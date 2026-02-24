<template>
	<view class="page-container">
		<view class="split-layout" v-if="currentGuide">
			<view class="left-panel">
				<view class="panel-header">
					<text class="panel-title">订单记录</text>
					<view class="filter-tabs">
						<text
							v-for="status in orderFilters"
							:key="status.key"
							class="filter-item"
							:class="{ active: currentOrderFilter === status.key }"
							@click="currentOrderFilter = status.key">
							{{ status.label }}
						</text>
					</view>
				</view>

				<scroll-view scroll-y class="order-scroll">
					<view v-if="orderLoading" class="loading-box"><uni-load-more status="loading" /></view>

					<view v-else-if="filteredOrders.length > 0" class="order-list">
						<view class="order-card" v-for="order in filteredOrders" :key="order._id">
							<view class="order-top">
								<text class="order-no">单号: {{ order.order_id }}</text>
								<text class="status-badge" :class="getOrderStatusClass(order)">
									{{ getOrderStatusText(order) }}
								</text>
							</view>
							<view class="order-title">{{ order.title }}</view>
							<view class="order-info">
								<view class="info-item">
									<uni-icons type="calendar" size="12" color="#999"></uni-icons>
									<text>{{ formatDate(order.departure_date) }} 出发</text>
								</view>
								<view class="info-item">
									<uni-icons type="flag" size="12" color="#999"></uni-icons>
									<text>{{ order.total_days }} 天行程</text>
								</view>
							</view>
						</view>
					</view>

					<view v-else class="empty-state">
						<text>暂无符合条件的订单</text>
					</view>
				</scroll-view>
			</view>

			<view class="right-panel">
				<scroll-view scroll-y class="assessment-scroll">
					<view v-if="assessmentLoading" class="loading-box"><uni-load-more status="loading" /></view>

					<view v-else-if="assessmentData" class="assessment-content">
						<view class="score-header-card">
							<view class="main-score-area">
								<image :src="currentGuide.personal_photo || '/static/avatar-default.png'" mode="aspectFill" class="header-avatar" />
								<view class="score-circle">
									<text class="num">{{ assessmentData.total_score }}</text>
									<text class="label">综合分</text>
								</view>
								<view class="rank-info">
									<view class="grade-tag" :class="'grade-' + (assessmentData.rank_level || 'A').toLowerCase()">等级 {{ assessmentData.rank_level || 'D' }}</view>
									<text class="rank-text">综合评级</text>
								</view>
							</view>

							<custom-picker
								v-if="guideList.length > 0"
								:options="guideList"
								:value="currentGuide"
								label-key="real_name"
								value-key="user_id"
								@change="onGuideChange"></custom-picker>
						</view>

						<view class="dimensions-section">
							<view class="section-label">
								<text>考核维度 (点击查看明细)</text>
								<view class="refresh-wrapper" @click="fetchAssessment">
									<uni-icons type="loop" size="14" color="#3b82f6"></uni-icons>
									<text class="refresh-text">刷新数据</text>
								</view>
							</view>

							<view class="dimension-row" v-for="(dim, index) in assessmentData.dimensions" :key="dim.key || index">
								<view class="dim-summary" @click.stop="toggleDimension(index)">
									<view class="dim-info">
										<text class="d-name">{{ dim.name }}</text>
										<text class="d-weight">权重 {{ dim.weight }}%</text>
									</view>
									<view class="dim-progress-container">
										<view class="progress-bg">
											<view class="progress-fill" :style="{ width: getProgressWidth(dim) + '%', backgroundColor: getProgressColor(dim.score) }"></view>
										</view>
									</view>
									<view class="dim-value">
										{{ dim.score }}
										<text class="unit">分</text>
										<uni-icons :type="expandedDimIndex === index ? 'top' : 'bottom'" size="10" color="#999" style="margin-left: 5px"></uni-icons>
									</view>
								</view>

								<view class="dim-details" v-if="expandedDimIndex === index">
									<view class="logs-list" v-if="dim.logs.length > 0">
										<view class="log-title">加减分记录:</view>
										<view class="log-row" v-for="(log, li) in dim.logs" :key="li">
											<text class="l-text">{{ formatLogText(log.text) }}</text>
											<text class="l-score" :class="log.delta > 0 ? 'plus' : 'minus'">{{ log.delta > 0 ? '+' : '' }}{{ log.delta }}</text>
										</view>
									</view>
									<view class="logs-list" v-else>
										<text class="log-empty">无额外加减分项</text>
									</view>
								</view>
							</view>
						</view>

						<view class="chart-section">
							<view class="section-label">近6个月接单趋势</view>
							<view class="css-chart-container">
								<view class="chart-bars">
									<view class="chart-col" v-for="(item, idx) in chartData" :key="idx">
										<view class="bar-wrapper">
											<view class="bar-value" v-if="item.count > 0">{{ item.count }}</view>
											<view class="bar-fill" :style="{ height: (item.count / maxChartValue) * 80 + 'px' }"></view>
										</view>
										<text class="bar-label">{{ item.month }}月</text>
									</view>
								</view>
								<view class="chart-line-bg"></view>
							</view>
						</view>
					</view>
					<view v-else class="empty-state">暂无考核数据</view>
				</scroll-view>
			</view>
		</view>

		<view v-else class="loading-state">
			<text>正在加载...</text>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const operationCenter = uniCloud.importObject('a-operation-center');
import { toRaw } from 'vue';
import CustomPicker from '@/components/custom-picker/custom-picker.vue';

export default {
	name: 'guide-view',
	props: {
		targetId: {
			type: String,
			default: ''
		}
	},
	components: {
		CustomPicker
	},
	data() {
		return {
			guideList: [],
			// pickerIndex: 0,
			currentGuide: null,
			// showGuideSelector: false,

			// 订单相关
			orderLoading: false,
			rawOrders: [],
			currentOrderFilter: 'all',
			orderFilters: [
				{ key: 'all', label: '全部' },
				{ key: 'pending', label: '待服务' },
				{ key: 'ongoing', label: '进行中' },
				{ key: 'completed', label: '已完成' }
			],

			// 考核相关
			assessmentLoading: false,
			assessmentData: null,
			expandedDimIndex: -1, // 当前展开的维度索引

			// 图表数据
			chartData: []
		};
	},
	computed: {
		filteredOrders() {
			const now = Date.now();
			if (this.currentOrderFilter === 'all') return this.rawOrders;

			return this.rawOrders.filter((o) => {
				// 简单的状态判断逻辑，可根据实际 status 字段调整
				const start = o.departure_date;
				const end = start + o.total_days * 24 * 3600 * 1000;

				if (this.currentOrderFilter === 'pending') return start > now;
				if (this.currentOrderFilter === 'ongoing') return start <= now && end >= now;
				if (this.currentOrderFilter === 'completed') return end < now;
				return true;
			});
		},
		maxChartValue() {
			if (this.chartData.length === 0) return 10;
			const max = Math.max(...this.chartData.map((i) => i.count));
			return max === 0 ? 10 : max;
		}
	},
	watch: {
		guideList: {
			handler(newVal) {
				// 如果列表加载好了
				if (newVal && newVal.length > 0) {
					// 优先查找 targetId 对应的私导
					if (this.targetId) {
						const target = newVal.find((g) => g.user_id === this.targetId);
						if (target) {
							this.pickerIndex = newVal.indexOf(target);
							this.switchGuide(target);
							return; // 找到了就结束
						}
					}

					// 如果没有 targetId 或者没找到，且当前没有选中的 guide，才默认选第一个
					if (!this.currentGuide) {
						this.pickerIndex = 0;
						this.switchGuide(newVal[0]);
					}
				}
			},
			immediate: true
		},
		// 监听 targetId 变化（应对组件已挂载但 ID 变更的情况）
		targetId(newId) {
			if (newId && this.guideList.length > 0) {
				const target = this.guideList.find((g) => g.user_id === newId);
				if (target) {
					this.pickerIndex = this.guideList.indexOf(target);
					this.switchGuide(target);
				}
			}
		}
	},
	mounted() {
		this.fetchGuideList();
		if (this.guideList && this.guideList.length > 0 && !this.currentGuide) {
			this.pickerIndex = 0;
			this.switchGuide(this.guideList[0]);
		}
	},
	methods: {
		async fetchGuideList() {
			try {
				const db = uniCloud.database();
				const [usersRes, profilesRes] = await Promise.all([
					db.collection('uni-id-users').where({ role: 'guide' }).field('_id, nickname, username, mobile, avatar_file').get(),
					db.collection('b-guide-profiles').field('_id, user_id, real_name, mobile, personal_photo').get()
				]);

				const users = usersRes.result.data;
				const profiles = profilesRes.result.data;
				console.log('users: ', users);
				console.log('profiles: ', profiles);

				// 2. 建立 Profile 映射表 (key: user_id)
				const profileMap = {};
				profiles.forEach((p) => {
					if (p.user_id) profileMap[p.user_id] = p;
				});

				console.log('profileMap: ', profileMap);

				// 3. 合并数据：以 uni-id-users 为基准，优先使用 profile 数据
				this.guideList = users.map((u) => {
					const profile = profileMap[u._id];
					// 如果有档案，优先用档案的真实姓名和头像，否则用用户的昵称/头像
					const realName = profile && profile.real_name ? profile.real_name : u.nickname || u.username || '未命名私导';
					const photo = profile && profile.personal_photo ? profile.personal_photo : u.avatar_file && u.avatar_file.url ? u.avatar_file.url : '';
					const mobile = profile && profile.mobile ? profile.mobile : u.mobile;
					const profileId = profile ? profile._id : ''; // 档案ID

					return {
						_id: profileId || u._id, // 如果没有档案ID，暂时用userID占位，但在业务逻辑中应主要使用 user_id
						user_id: u._id, // 关键字段：关联ID
						real_name: realName,
						mobile: mobile,
						personal_photo: photo
					};
				});
				console.log('this.guideList: ', toRaw(this.guideList));

				// 默认选中第一个
				if (this.guideList.length > 0) {
					// 如果当前没有选中，或者选中的人不在列表里了，重置为第一个
					if (!this.currentGuide || !this.guideList.find((g) => g.user_id === this.currentGuide.user_id)) {
						this.pickerIndex = 0;
						this.switchGuide(this.guideList[0]);
					}
				}
			} catch (e) {
				console.error(e);
			}
		},

		onGuideChange(selectedItem) {
			this.switchGuide(selectedItem);
		},

		switchGuide(guide) {
			if (!guide) return;
			this.currentGuide = guide;
			this.rawOrders = [];
			this.chartData = [];
			this.assessmentData = null;
			this.expandedDimIndex = -1;

			this.fetchAssessment();
			this.fetchOrders();
		},

		// 获取订单列表
		async fetchOrders() {
			this.orderLoading = true;
			try {
				// 修改点：明确使用 user_id，因为 staves.id 是 uni-id-users 的 _id
				const targetId = this.currentGuide.user_id;

				if (!targetId) {
					console.warn('当前私导缺少 user_id，无法查询订单');
					this.orderLoading = false;
					return;
				}

				// 查询 snapshots 表
				const res = await db
					.collection('a-snapshots')
					.where({
						'staves.id': targetId
					})
					.field('order_id, title, departure_date, total_days')
					.orderBy('departure_date', 'desc')
					.limit(50)
					.get();

				this.rawOrders = res.result.data;
				this.generateChartData(this.rawOrders);
			} catch (e) {
				console.error('Orders fetch failed', e);
			} finally {
				this.orderLoading = false;
			}
		},

		async fetchAssessment() {
			if (!this.currentGuide) return;
			this.assessmentLoading = true;
			try {
				const targetId = this.currentGuide.user_id || this.currentGuide._id;
				const res = await operationCenter.getAssessmentData({
					role: 'guide',
					target_id: targetId
				});
				this.assessmentData = res.data;
			} catch (e) {
				console.error(e);
			} finally {
				this.assessmentLoading = false;
			}
		},

		toggleDimension(index) {
			console.log('Toggle dimension:', index);
			if (this.expandedDimIndex === index) {
				this.expandedDimIndex = -1;
			} else {
				this.expandedDimIndex = index;
			}
		},

		generateChartData(orders) {
			const months = [];
			const now = new Date();
			for (let i = 5; i >= 0; i--) {
				const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
				months.push({
					year: d.getFullYear(),
					month: d.getMonth() + 1,
					count: 0
				});
			}

			orders.forEach((o) => {
				const d = new Date(o.departure_date);
				const target = months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth() + 1);
				if (target) target.count++;
			});

			this.chartData = months;
		},

		// UI 辅助方法
		formatDate(ts) {
			if (!ts) return '';
			const d = new Date(ts);
			return `${d.getMonth() + 1}/${d.getDate()}`;
		},

		// 格式化日志文本
		formatLogText(text) {
			if (!text) return '';

			// 1. 定义字段映射
			const fieldMap = {
				order_count: '订单量',
				service_days: '服务天数',
				rejected_orders: '拒单数',
				cancelled_orders: '无故取消数',
				lateness_count: '迟到早退数',
				review_count: '评价数',
				rating_avg: '评价平均分',
				rating_bad: '中差评数(<4分)',
				rating_5_star: '5分好评数',
				service_errors: '服务失误数',
				accounting_delays: '报账逾漏数',
				minor_violations: '轻微违章数',
				serious_violations: '严重违章',
				photo_standard_pct: '拍摄达标率',
				photo_quality_score: '照片质量分',
				video_quality_score: '视频质量分',
				material_delays: '素材上传逾漏',
				promo_materials: '宣传素材数'
			};

			// 2. 定义操作符映射
			const opMap = {
				' gte ': ' ≥ ',
				' gt ': ' > ',
				' lte ': ' ≤ ',
				' lt ': ' < ',
				' eq ': ' = '
			};

			let res = text;

			// 替换操作符 (注意空格，防止误伤)
			for (let op in opMap) {
				res = res.replace(new RegExp(op, 'g'), opMap[op]);
			}

			// 替换字段名
			for (let field in fieldMap) {
				// 使用正则全局替换
				res = res.replace(new RegExp(field, 'g'), fieldMap[field]);
			}

			return res;
		},

		getOrderStatusText(order) {
			const now = Date.now();
			const start = order.departure_date;
			const end = start + order.total_days * 24 * 3600 * 1000;
			if (start > now) return '待服务';
			if (end < now) return '已完成';
			return '进行中';
		},
		getOrderStatusClass(order) {
			const now = Date.now();
			const start = order.departure_date;
			const end = start + order.total_days * 24 * 3600 * 1000;
			if (start > now) return 'status-pending';
			if (end < now) return 'status-completed';
			return 'status-ongoing';
		},
		getProgressWidth(dim) {
			return Math.min(100, Math.max(0, dim.score));
		},
		getProgressColor(score) {
			if (score >= 90) return '#10b981';
			if (score >= 70) return '#3b82f6';
			if (score >= 60) return '#f59e0b';
			return '#ef4444';
		},
		getMetricName(key) {
			const map = {
				order_count: '订单总数',
				service_days: '服务天数',
				rating_avg: '平均评分',
				rejected_orders: '拒单数',
				cancelled_orders: '取消数',
				lateness_count: '迟到次数',
				photo_standard_pct: '相册达标率',
				review_count: '评价总数'
			};
			return map[key] || key;
		},
		filterMetrics(metrics) {
			const res = {};
			const ignoreKeys = ['weight', 'total', 'rating_5_star', 'rating_bad'];
			for (let k in metrics) {
				if (metrics[k] !== 0 && !ignoreKeys.includes(k)) {
					res[k] = metrics[k];
				}
			}
			return res;
		}
	}
};
</script>

<style lang="scss">
$page-bg: #f5f7fa;
$blue: #3b82f6;
$text-main: #1f2937;
$text-sub: #6b7280;
$border: #e5e7eb;

.custom-picker-wrapper {
	position: relative;
	z-index: 100;

	// 触发器样式
	.picker-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		padding: 6px 10px;
		border-radius: 6px;
		font-size: 13px;

		// 宽度设置
		width: auto;
		min-width: 90px;
		max-width: 150px;
		box-sizing: border-box;
		cursor: pointer; // 鼠标手势

		.value {
			flex: 1;
			text-align: center;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
			margin-right: 4px;
		}
		uni-icons {
			flex-shrink: 0;
		}
	}

	// 透明遮罩层：覆盖全屏，保证点外面能关闭
	.picker-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 998;
		background: transparent;
	}

	// 自定义下拉菜单核心样式
	.custom-dropdown-options {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 5px;

		width: 200px;
		max-height: 250px;

		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 999;
		overflow: hidden;

		.options-scroll {
			max-height: 250px;
		}

		.option-item {
			padding: 8px 12px;
			font-size: 13px;
			color: #333;
			border-bottom: 1px solid #f3f4f6;
			display: flex;
			justify-content: space-between;
			align-items: center;
			cursor: pointer;

			&:last-child {
				border-bottom: none;
			}

			&:active {
				background-color: #f5f7fa;
			}

			// 选中态样式
			&.active {
				background-color: #eff6ff;
				color: #3b82f6;
				font-weight: 500;
			}

			.opt-text {
				flex: 1;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
				margin-right: 5px;
			}
		}
	}
}

.page-container {
	height: 100%;
	background-color: $page-bg;
	display: flex;
	flex-direction: column;

	.page-toolbar {
		height: 50px;
		background: #fff;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		padding: 0 20px;
		flex-shrink: 0;
	}

	.split-layout {
		flex: 1;
		display: flex;
		overflow: hidden;
		padding: 15px;
		gap: 15px;

		/* === 左侧面板：订单 (flex: 2) === */
		.left-panel {
			flex: 2;
			background: #fff;
			border-radius: 8px;
			display: flex;
			flex-direction: column;
			box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

			.panel-header {
				padding: 15px;
				border-bottom: 1px solid #f3f4f6;
				display: flex;
				justify-content: space-between;
				align-items: center;
				.panel-title {
					font-weight: bold;
					font-size: 15px;
					color: #333;
				}
				.filter-tabs {
					display: flex;
					background: #f3f4f6;
					border-radius: 4px;
					padding: 2px;
					.filter-item {
						text-align: center;
						font-size: 12px;
						padding: 4px 12px;
						color: #666;
						cursor: pointer;
						border-radius: 4px;
						&.active {
							background: #fff;
							color: $blue;
							font-weight: 600;
							box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
						}
					}
				}
			}

			.order-scroll {
				flex: 1;
				background: #f9fafb;
				overflow-y: hidden;

				.order-list {
					padding: 10px;
				}
				.order-card {
					background: #fff;
					padding: 12px;
					border-radius: 6px;
					margin-bottom: 10px;
					border: 1px solid #e5e7eb;
					.order-top {
						display: flex;
						justify-content: space-between;
						margin-bottom: 6px;
						.order-no {
							font-size: 11px;
							color: #999;
						}
						.status-badge {
							font-size: 10px;
							padding: 1px 6px;
							border-radius: 4px;
							&.status-pending {
								background: #eff6ff;
								color: $blue;
							}
							&.status-ongoing {
								background: #fff7ed;
								color: #f59e0b;
							}
							&.status-completed {
								background: #f0fdf4;
								color: #10b981;
							}
						}
					}
					.order-title {
						font-size: 14px;
						font-weight: 600;
						color: #333;
						margin-bottom: 6px;
					}
					.order-info {
						display: flex;
						gap: 10px;
						.info-item {
							display: flex;
							align-items: center;
							gap: 4px;
							font-size: 11px;
							color: #666;
						}
					}
				}
				.empty-state {
					text-align: center;
					color: #999;
					padding: 30px;
					font-size: 12px;
				}
			}
		}

		/* === 右侧面板=== */
		.right-panel {
			flex: 1;
			background: #fff;
			border-radius: 8px;
			display: flex;
			flex-direction: column;
			box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
			overflow: hidden;

			.assessment-scroll {
				flex: 1;
				padding: 15px;
				box-sizing: border-box;

				::-webkit-scrollbar {
					display: none;
				}

				.score-header-card {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 20px;
					background: #fdfdfd;
					padding: 10px;
					border-radius: 8px;
					border: 1px solid #f0f0f0;

					.main-score-area {
						display: flex;
						align-items: center;
						gap: 15px;

						.header-avatar {
							width: 50px;
							height: 50px;
							border-radius: 50%;
							border: 2px solid #fff;
							box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
						}

						.score-circle {
							width: 60px;
							height: 60px;
							border-radius: 50%;
							background: linear-gradient(135deg, $blue, #2563eb);
							color: #fff;
							display: flex;
							flex-direction: column;
							align-items: center;
							justify-content: center;
							box-shadow: 0 4px 8px rgba(59, 130, 246, 0.25);
							.num {
								font-size: 20px;
								font-weight: bold;
								line-height: 1;
							}
							.label {
								font-size: 8px;
								opacity: 0.9;
								margin-top: 2px;
							}
						}

						.rank-info {
							display: flex;
							flex-direction: column;
							gap: 4px;
							.grade-tag {
								font-size: 14px;
								font-weight: bold;
								color: $blue;
								&.grade-a {
									color: #10b981;
								}
								&.grade-b {
									color: $blue;
								}
								&.grade-c {
									color: #f59e0b;
								}
							}
							.rank-text {
								font-size: 11px;
								color: #999;
							}
						}
					}
				}

				.section-label {
					font-size: 13px;
					font-weight: bold;
					color: #333;
					margin-bottom: 10px;
					border-left: 3px solid $blue;
					padding-left: 8px;
					display: flex;
					justify-content: space-between;
					align-items: center;
				}

				.dimensions-section {
					margin-bottom: 25px;
					.dimension-row {
						margin-bottom: 10px;
						border: 1px solid #f9fafb;
						border-radius: 6px;
						background: #fff;

						.dim-summary {
							display: flex;
							align-items: center;
							padding: 8px 10px;
							cursor: pointer;
							transition: background-color 0.2s;
							&:active {
								background-color: #f0f0f0;
							} /* 点击反馈 */

							.dim-info {
								width: 70px;
								flex-shrink: 0;
								.d-name {
									font-size: 12px;
									font-weight: 500;
									display: block;
									color: #333;
								}
								.d-weight {
									font-size: 9px;
									color: #999;
								}
							}
							.dim-progress-container {
								flex: 1;
								margin: 0 10px;
								.progress-bg {
									height: 5px;
									background: #f3f4f6;
									border-radius: 3px;
									overflow: hidden;
									.progress-fill {
										height: 100%;
										transition: width 0.5s ease;
									}
								}
							}
							.dim-value {
								width: 50px;
								text-align: right;
								font-size: 13px;
								font-weight: bold;
								color: #333;
								display: flex;
								align-items: center;
								justify-content: flex-end;
								.unit {
									font-size: 9px;
									color: #999;
									font-weight: normal;
									margin-left: 2px;
								}
							}
						}

						.dim-details {
							background: #fcfcfc;
							border-top: 1px dashed #eee;
							padding: 10px;
							animation: fadeIn 0.3s;
							.detail-grid {
								display: flex;
								flex-wrap: wrap;
								gap: 8px;
								margin-bottom: 8px;
								.metric-item {
									background: #fff;
									border: 1px solid #eee;
									padding: 3px 6px;
									border-radius: 4px;
									font-size: 10px;
									.m-label {
										color: #888;
										margin-right: 4px;
									}
									.m-val {
										font-weight: 600;
										color: #333;
									}
								}
							}
							.logs-list {
								.log-title {
									font-size: 10px;
									font-weight: bold;
									color: #999;
									margin-bottom: 4px;
								}
								.log-row {
									display: flex;
									justify-content: space-between;
									font-size: 10px;
									color: #666;
									margin-bottom: 2px;
									.l-score.plus {
										color: #10b981;
									}
									.l-score.minus {
										color: #ef4444;
									}
								}
								.log-empty {
									font-size: 10px;
									color: #ccc;
									font-style: italic;
								}
							}
						}
					}
					.refresh-wrapper {
						display: flex;
						align-items: center;
						gap: 4px;
						padding: 3px 10px;
						border-radius: 20px;
						background-color: #eff6ff;
						cursor: pointer;
						transition: all 0.2s;

						&:active {
							background-color: #dbeafe;
							transform: scale(0.95);
						}

						.refresh-text {
							font-size: 11px;
							color: #3b82f6;
							font-weight: 500;
						}
					}
				}

				.chart-section {
					.css-chart-container {
						height: 100px;
						position: relative;
						display: flex;
						align-items: flex-end;
						padding-bottom: 15px;
						.chart-line-bg {
							position: absolute;
							bottom: 15px;
							left: 0;
							right: 0;
							border-bottom: 1px solid #eee;
							z-index: 0;
						}
						.chart-bars {
							display: flex;
							width: 100%;
							justify-content: space-around;
							z-index: 1;
							height: 100%;
							align-items: flex-end;
							.chart-col {
								display: flex;
								flex-direction: column;
								align-items: center;
								.bar-wrapper {
									display: flex;
									flex-direction: column;
									align-items: center;
									justify-content: flex-end;
									.bar-value {
										font-size: 9px;
										color: $blue;
										margin-bottom: 2px;
									}
									.bar-fill {
										width: 10px;
										background: #93c5fd;
										border-radius: 2px 2px 0 0;
										transition: height 0.5s;
										&:hover {
											background: $blue;
										}
									}
								}
								.bar-label {
									margin-top: 4px;
									font-size: 9px;
									color: #999;
								}
							}
						}
					}
				}
			}
		}
	}

	.loading-state,
	.loading-box {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100px;
		color: #999;
	}
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}
</style>
