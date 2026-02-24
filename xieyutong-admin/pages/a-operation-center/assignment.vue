<template>
	<view class="page-container">
		<view class="main-body" v-if="!isLoading">
			<view class="side-panel">
				<view class="card stat-card">
					<view class="card-title">待分配统计</view>
					<view class="stat-circle-wrapper">
						<view class="css-pie" :style="pieStyle"></view>
						<view class="pie-legend">
							<view class="legend-item">
								<span class="dot red"></span>
								A级标杆: {{ stats.levelA }}
							</view>
							<view class="legend-item">
								<span class="dot orange"></span>
								B/C级内容: {{ stats.levelBC }}
							</view>
							<view class="legend-item">
								<span class="dot blue"></span>
								D级基础: {{ stats.levelD }}
							</view>
						</view>
					</view>
					<view class="stat-footer">
						<text>待分配总数: {{ totalPending }}</text>
						<text class="urgent">今日急单: {{ stats.urgent }}</text>
					</view>
				</view>

				<view class="card rule-card">
					<view class="card-title">分单优先级规则</view>
					<view class="rule-table">
						<view class="rule-row header">
							<text class="col-task">任务等级</text>
							<text class="col-auth">承接权限</text>
							<text class="col-num">当前可用</text>
						</view>
						<view class="rule-row row-a">
							<text class="col-task tag-a">A级</text>
							<text class="col-auth">仅限前20%优秀司机</text>
							<text class="col-num">{{ availableDrivers.top20 }}人</text>
						</view>
						<view class="rule-row row-b">
							<text class="col-task tag-b">B/C级</text>
							<text class="col-auth">优秀优先 / 前30%普通</text>
							<text class="col-num">{{ availableDrivers.top50 }}人</text>
						</view>
						<view class="rule-row row-d">
							<text class="col-task tag-d">D级</text>
							<text class="col-auth">全员可接 (普通优先)</text>
							<text class="col-num">{{ availableDrivers.all }}人</text>
						</view>
					</view>
					<view class="rule-hint">
						<uni-icons type="info" size="12" color="#6b7280"></uni-icons>
						<text>系统已按近90天综合分自动排序推荐</text>
					</view>
				</view>
			</view>

			<scroll-view scroll-y="true" class="list-panel">
				<view class="empty-state" v-if="pendingOrders.length === 0">
					<text>暂无待分配订单</text>
				</view>

				<view class="order-card" v-for="(order, index) in pendingOrders" :key="order._id">
					<view class="order-info">
						<view class="order-header">
							<text class="order-id">#{{ order.order_id }}</text>
							<view class="level-tag" :class="'tag-' + order.level.toLowerCase()">{{ order.level }}级任务</view>
							<text class="order-time">出发: {{ formatDate(order.departure_date) }} ({{ order.total_days }}天)</text>
						</view>
						<view class="order-route">{{ order.title }}</view>
						<view class="order-meta">
							<text class="meta-item">
								<uni-icons type="person" size="14"></uni-icons>
								{{ order.guestName }} {{ order.guestCount }}人
							</text>
							<text class="meta-item">
								<uni-icons type="map" size="14"></uni-icons>
								{{ order.destination || '西藏全境' }}
							</text>
						</view>
					</view>

					<view class="dispatch-action">
						<view class="recommend-label">推荐司机 (按综合分):</view>
						<button class="uni-btn-primary small" @click="autoDispatchAll">一键智能派单</button>
						<picker @change="(e) => onDriverChange(e, index)" :value="order.selectedDriverIdx" :range="order.recommendList" range-key="displayText" class="driver-picker">
							<view class="picker-inner" :class="{ 'has-val': order.selectedDriverIdx >= 0 }">
								<text>{{ order.selectedDriverIdx >= 0 ? order.recommendList[order.selectedDriverIdx].displayText : '请选择司机' }}</text>
								<uni-icons type="bottom" size="12" color="#666"></uni-icons>
							</view>
						</picker>

						<button class="confirm-btn" :disabled="order.selectedDriverIdx < 0" :class="{ active: order.selectedDriverIdx >= 0 }" @click="confirmDispatch(index)">确认</button>
					</view>
				</view>
			</scroll-view>
		</view>

		<view v-if="isLoading" class="loading-state">
			<uni-load-more status="loading" />
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();

export default {
	data() {
		return {
			isLoading: true,
			// 模拟数据
			totalPending: 0,
			stats: { levelA: 0, levelBC: 0, levelD: 0, urgent: 0 },
			availableDrivers: { top20: 0, top50: 0, all: 0 },

			rawOrders: [], // 原始订单数据
			rawDrivers: [], // 原始司机数据
			pendingOrders: [] // 处理后的视图数据
		};
	},
	computed: {
		pieStyle() {
			// 计算饼图样式 (A=Red, BC=Orange, D=Blue)
			const total = this.totalPending || 1;
			const pA = (this.stats.levelA / total) * 100;
			const pBC = (this.stats.levelBC / total) * 100;
			const endA = pA;
			const endBC = pA + pBC;

			return {
				background: `conic-gradient(#ef4444 0% ${endA}%, #f59e0b ${endA}% ${endBC}%, #3b82f6 ${endBC}% 100%)`
			};
		}
	},
	mounted() {
		this.fetchData();
	},
	methods: {
		formatDate(ts) {
			return new Date(ts).toLocaleDateString();
		},
		async fetchData() {
			this.isLoading = true;
			try {
				// 1. 获取待分配订单 (status='active' 且 staves 数组中没有 guide 角色)
				// 这里为了演示，获取最近的 active 订单
				const ordersRes = await db.collection('a-snapshots').where('status == "active"').limit(20).get();

				// 2. 获取所有司机档案 (需包含 rating, user_id, real_name)
				const [usersRes, profilesRes] = await Promise.all([
					db.collection('uni-id-users').where({ role: 'guide' }).field('_id, nickname, username, mobile').get(),
					db.collection('b-guide-profiles').field('user_id, real_name, rating, order_count, mobile').get()
				]);

				const profileMap = {};
				profilesRes.result.data.forEach((p) => {
					if (p.user_id) profileMap[p.user_id] = p;
				});

				// 合并并计算分数
				this.rawDrivers = usersRes.result.data
					.map((u) => {
						const profile = profileMap[u._id];

						// 优先取 Profile 数据，否则取 User 数据，并给予默认评分
						const realName = profile && profile.real_name ? profile.real_name : u.nickname || u.username || '私导';
						const rating = profile && profile.rating !== undefined ? profile.rating : 100.0;
						const orderCount = profile && profile.order_count !== undefined ? profile.order_count : 0;
						const mobile = profile && profile.mobile ? profile.mobile : u.mobile;

						return {
							user_id: u._id,
							real_name: realName,
							rating: rating,
							order_count: orderCount,
							mobile: mobile,
							// 计算综合分 (模拟逻辑：rating * 20)
							score: rating * 20,
							// 简单模拟优秀司机判定
							isExcellent: rating >= 4.8
						};
					})
					.sort((a, b) => b.score - a.score); // 按分数降序

				this.rawOrders = ordersRes.result.data;

				this.calculateStats();
				this.processOrders();
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				this.isLoading = false;
			}
		},

		calculateStats() {
			// 统计司机可用人数
			const total = this.rawDrivers.length;
			this.availableDrivers.all = total;
			this.availableDrivers.top20 = Math.ceil(total * 0.2);
			this.availableDrivers.top50 = Math.ceil(total * 0.5); // 前30%普通 + 优秀 ≈ 50%
		},

		processOrders() {
			const processed = [];
			let countA = 0,
				countBC = 0,
				countD = 0,
				urgent = 0;
			const now = Date.now();

			this.rawOrders.forEach((order) => {
				// 1. 模拟判定任务等级 (根据金额或标题，这里随机模拟)
				// 实际业务中应从 order.metadata 或 tags 读取
				const price = 10000; // 假设字段
				let level = 'D';
				if (order.title.includes('高端') || order.title.includes('定制')) level = 'A';
				else if (order.title.includes('纯玩')) level = 'B';
				else level = 'D';

				// 统计
				if (level === 'A') countA++;
				else if (level === 'B' || level === 'C') countBC++;
				else countD++;

				if (order.departure_date - now < 3 * 24 * 3600 * 1000) urgent++;

				// 2. 生成推荐司机列表 (核心算法)
				const recommendList = this.getRecommendedDrivers(level);

				processed.push({
					...order,
					level,
					guestName: order.travel_users && order.travel_users[0] ? '王先生' : '未知客户', // 模拟
					guestCount: order.travel_users ? order.travel_users.length : 2,
					recommendList,
					selectedDriverIdx: -1
				});
			});

			this.pendingOrders = processed;
			this.totalPending = processed.length;
			this.stats = { levelA: countA, levelBC: countBC, levelD: countD, urgent };
		},

		// 核心推荐算法 [cite: 43, 45, 46, 47]
		getRecommendedDrivers(level) {
			let candidates = [];
			const allDrivers = this.rawDrivers; // 已按分数降序
			const top20Count = Math.ceil(allDrivers.length * 0.2);
			const top50Count = Math.ceil(allDrivers.length * 0.5);

			if (level === 'A') {
				[cite_start]; // [cite: 45] A级任务：仅限综合分前20%的优秀司机
				candidates = allDrivers.slice(0, top20Count);
			} else if (level === 'B' || level === 'C') {
				[cite_start]; // [cite: 46] B/C级：优先优秀，其次前30%普通 (这里取前50%近似覆盖)
				candidates = allDrivers.slice(0, top50Count);
			} else {
				[cite_start]; // [cite: 47] D级：以普通为主，优秀可自愿 (全员可见，但建议倒序或混合，这里简单返回全员)
				candidates = allDrivers;
			}

			return candidates.map((d) => ({
				value: d.user_id,
				displayText: `${d.real_name} (${d.score.toFixed(1)}分${d.isExcellent ? '/优' : ''})`,
				mobile: d.mobile
			}));
		},

		onDriverChange(e, index) {
			this.pendingOrders[index].selectedDriverIdx = e.detail.value;
		},

		confirmDispatch(index) {
			const order = this.pendingOrders[index];
			const driver = order.recommendList[order.selectedDriverIdx];

			uni.showModal({
				title: '确认派单',
				content: `将 ${order.level}级任务 派给 ${driver.displayText}？`,
				success: (res) => {
					if (res.confirm) {
						// 模拟提交 API
						uni.showToast({ title: '分单成功' });
						this.pendingOrders.splice(index, 1);
						this.totalPending--;
						// 更新统计...
					}
				}
			});
		},

		autoDispatchAll() {
			uni.showToast({ title: '已自动匹配最优司机', icon: 'none' });
		}
	}
};
</script>

<style lang="scss">
$page-bg: #f5f7fa;
$blue: #3b82f6;
$red: #ef4444;
$orange: #f59e0b;
$text-main: #1f2937;
$text-sub: #6b7280;

.page-container {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background-color: $page-bg;

	.main-body {
		flex: 1;
		display: flex;
		padding: 20px;
		gap: 20px;
		overflow: hidden;

		/* 左侧面板 */
		.side-panel {
			width: 280px;
			flex-shrink: 0;
			display: flex;
			flex-direction: column;
			gap: 20px;

			.card {
				background: #fff;
				border-radius: 8px;
				padding: 15px;
				box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
				.card-title {
					font-size: 14px;
					font-weight: 600;
					margin-bottom: 12px;
					color: $text-main;
					border-left: 3px solid $blue;
					padding-left: 8px;
				}
			}

			.stat-circle-wrapper {
				display: flex;
				align-items: center;
				margin-bottom: 15px;
				.css-pie {
					width: 80px;
					height: 80px;
					border-radius: 50%;
					margin-right: 15px;
					flex-shrink: 0;
				}
				.pie-legend {
					.legend-item {
						font-size: 12px;
						margin-bottom: 4px;
						color: $text-sub;
						display: flex;
						align-items: center;
						.dot {
							width: 8px;
							height: 8px;
							border-radius: 2px;
							margin-right: 6px;
						}
						.red {
							background: $red;
						}
						.orange {
							background: $orange;
						}
						.blue {
							background: $blue;
						}
					}
				}
			}
			.stat-footer {
				border-top: 1px solid #eee;
				padding-top: 10px;
				display: flex;
				justify-content: space-between;
				font-size: 12px;
				color: $text-main;
				.urgent {
					color: $red;
					font-weight: bold;
				}
			}

			.rule-table {
				.rule-row {
					display: flex;
					font-size: 12px;
					padding: 8px 0;
					border-bottom: 1px solid #f9fafb;
					&.header {
						color: #9ca3af;
					}
					.col-task {
						width: 60px;
						font-weight: bold;
					}
					.col-auth {
						flex: 1;
						color: $text-sub;
					}
					.col-num {
						width: 40px;
						text-align: right;
						color: $blue;
					}

					.tag-a {
						color: $red;
					}
					.tag-b {
						color: $orange;
					}
					.tag-d {
						color: $blue;
					}
				}
			}
			.rule-hint {
				margin-top: 10px;
				background: #f3f4f6;
				padding: 6px;
				border-radius: 4px;
				font-size: 11px;
				color: #6b7280;
				display: flex;
				align-items: center;
				gap: 4px;
			}
		}

		/* 右侧列表面板 */
		.list-panel {
			flex: 1;
			background: #fff;
			border-radius: 8px;
			padding: 15px;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

			.order-card {
				border: 1px solid #eee;
				border-radius: 6px;
				padding: 15px;
				margin-bottom: 15px;
				display: flex;
				justify-content: space-between;
				align-items: center;

				.order-info {
					flex: 1;
					margin-right: 20px;
					.order-header {
						display: flex;
						align-items: center;
						margin-bottom: 6px;
						.order-id {
							font-weight: bold;
							margin-right: 10px;
							color: $text-main;
						}
						.level-tag {
							font-size: 10px;
							padding: 1px 6px;
							border-radius: 3px;
							margin-right: 10px;
							&.tag-a {
								background: #fee2e2;
								color: $red;
							}
							&.tag-b {
								background: #fef3c7;
								color: $orange;
							}
							&.tag-d {
								background: #dbeafe;
								color: $blue;
							}
						}
						.order-time {
							font-size: 12px;
							color: #9ca3af;
						}
					}
					.order-route {
						font-size: 14px;
						margin-bottom: 6px;
						color: #374151;
					}
					.order-meta {
						font-size: 12px;
						color: $text-sub;
						display: flex;
						gap: 15px;
						.meta-item {
							display: flex;
							align-items: center;
							gap: 4px;
						}
					}
				}

				.dispatch-action {
					width: 220px;
					display: flex;
					flex-direction: column;
					gap: 6px;
					.recommend-label {
						font-size: 11px;
						color: $blue;
						font-weight: 500;
					}
					.driver-picker {
						width: 100%;
						.picker-inner {
							border: 1px solid #d1d5db;
							border-radius: 4px;
							padding: 6px 10px;
							font-size: 13px;
							color: #9ca3af;
							display: flex;
							justify-content: space-between;
							align-items: center;
							background: #fff;
							&.has-val {
								color: $text-main;
								border-color: $blue;
								background: #eff6ff;
							}
						}
					}
					.confirm-btn {
						width: 100%;
						font-size: 12px;
						background: #e5e7eb;
						color: #fff;
						border: none;
						border-radius: 4px;
						padding: 4px 0;
						&.active {
							background: $blue;
							cursor: pointer;
						}
					}
					.uni-btn-primary {
						background-color: $blue;
						color: #fff;
						font-size: 13px;
						padding: 6px 16px;
						border-radius: 4px;
						border: none;
					}
				}
			}
		}
	}
	.loading-state {
		display: flex;
		justify-content: center;
		padding-top: 100px;
	}
}
</style>
