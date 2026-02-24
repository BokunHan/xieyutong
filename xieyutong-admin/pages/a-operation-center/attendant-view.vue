<template>
	<view class="page-container">
		<view class="split-layout" v-if="currentAttendant">
			<view class="left-panel">
				<view class="panel-header">
					<text class="panel-title">负责行程</text>
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
					<view v-if="listLoading" class="loading-box"><uni-load-more status="loading" /></view>

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
									<uni-icons type="staff-filled" size="12" color="#999"></uni-icons>
									<text>{{ order.total_days }} 天服务</text>
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
								<image :src="currentAttendant.avatar || '/static/avatar-default.png'" mode="aspectFill" class="header-avatar" />
								<view class="score-circle">
									<text class="num">{{ assessmentData.total_score }}</text>
									<text class="label">综合分</text>
								</view>
								<view class="rank-info">
									<view class="grade-tag" :class="'grade-' + (assessmentData.rank_level || 'A').toLowerCase()">等级 {{ assessmentData.rank_level || 'D' }}</view>
									<text class="rank-text">管家评级</text>
								</view>
							</view>
							<!-- <picker v-if="attendantList.length > 0" mode="selector" :range="attendantList" range-key="real_name" :value="pickerIndex" @change="onAttendantChange">
								<view class="picker-trigger">
									<text class="label">当前查看：</text>
									<text class="value">{{ currentAttendant ? currentAttendant.real_name : '请选择' }}</text>
									<uni-icons type="bottom" size="14" color="#666"></uni-icons>
								</view>
							</picker> -->
							<custom-picker
								v-if="attendantList.length > 0"
								:options="attendantList"
								:value="currentAttendant"
								label-key="real_name"
								value-key="user_id"
								@change="onAttendantChange"></custom-picker>
						</view>

						<view class="dimensions-section">
							<view class="section-label">
								<text>考核维度明细</text>
								<view class="refresh-wrapper" @click="fetchAssessment">
									<uni-icons type="loop" size="14" color="#3b82f6"></uni-icons>
									<text class="refresh-text">刷新</text>
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
										<view class="log-title">得分记录:</view>
										<view class="log-row" v-for="(log, li) in dim.logs" :key="li">
											<text class="l-text">{{ formatLogText(log.text) }}</text>
											<text class="l-score" :class="log.delta > 0 ? 'plus' : 'minus'">{{ log.delta > 0 ? '+' : '' }}{{ log.delta }}</text>
										</view>
									</view>
									<view class="logs-list" v-else>
										<text class="log-empty">无额外记录</text>
									</view>
								</view>
							</view>
						</view>

						<view class="chart-section">
							<view class="section-label">近6个月服务单量</view>
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
			<text>正在加载管家列表...</text>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const operationCenter = uniCloud.importObject('a-operation-center');
import CustomPicker from '@/components/custom-picker/custom-picker.vue';

export default {
	name: 'attendant-view',
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
			attendantList: [],
			pickerIndex: 0,
			currentAttendant: null,

			// 左侧列表相关
			listLoading: false,
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
			expandedDimIndex: -1,

			// 图表数据
			chartData: []
		};
	},
	computed: {
		// 筛选订单逻辑
		filteredOrders() {
			const now = Date.now();
			if (this.currentOrderFilter === 'all') return this.rawOrders;

			return this.rawOrders.filter((o) => {
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
		attendantList: {
			handler(newVal) {
				// 如果列表加载好了
				if (newVal && newVal.length > 0) {
					// 优先查找 targetId 对应的私导
					if (this.targetId) {
						const target = newVal.find((g) => g.user_id === this.targetId);
						if (target) {
							this.pickerIndex = newVal.indexOf(target);
							this.switchAttendant(target);
							return; // 找到了就结束
						}
					}

					// 如果没有 targetId 或者没找到，且当前没有选中的 guide，才默认选第一个
					if (!this.currentGuide) {
						this.pickerIndex = 0;
						this.switchAttendant(newVal[0]);
					}
				}
			},
			immediate: true
		},
		// 监听 targetId 变化（应对组件已挂载但 ID 变更的情况）
		targetId(newId) {
			if (newId && this.attendantList.length > 0) {
				const target = this.attendantList.find((g) => g.user_id === newId);
				if (target) {
					this.pickerIndex = this.attendantList.indexOf(target);
					this.switchAttendant(target);
				}
			}
		}
	},
	mounted() {
		this.fetchAttendantList();
	},
	methods: {
		// 1. 获取所有管家列表
		async fetchAttendantList() {
			try {
				const res = await db.collection('uni-id-users').where({ role: 'attendant' }).field('_id, nickname, username, mobile, avatar_file, avatar').get();

				// 标准化数据结构
				this.attendantList = res.result.data.map((u) => ({
					user_id: u._id,
					real_name: u.nickname || u.username || '管家',
					mobile: u.mobile,
					avatar: u.avatar_file?.url || u.avatar
				}));

				if (this.attendantList.length > 0 && !this.currentAttendant) {
					this.switchAttendant(this.attendantList[0]);
				}
			} catch (e) {
				console.error(e);
			}
		},

		onAttendantChange(selectedItem) {
			this.switchAttendant(selectedItem);
		},

		switchAttendant(attendant) {
			if (!attendant) return;
			this.currentAttendant = attendant;
			this.rawOrders = [];
			this.chartData = [];
			this.assessmentData = null;
			this.expandedDimIndex = -1;

			this.fetchAssessment();
			this.fetchOrders();
		},

		// 2. 获取该管家参与的订单
		async fetchOrders() {
			this.listLoading = true;
			try {
				const targetId = this.currentAttendant.user_id;
				// 查询 a-snapshots 表，查找 staves 数组中包含该 ID 且 role 为 attendant
				// 注意：这里用简单的 elemMatch 逻辑
				const res = await db
					.collection('a-snapshots')
					.where({
						staves: db.command.elemMatch({
							id: targetId,
							role: 'attendant' // 确保是作为管家参与
						})
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
				this.listLoading = false;
			}
		},

		// 3. 获取考核数据
		async fetchAssessment() {
			if (!this.currentAttendant) return;
			this.assessmentLoading = true;
			try {
				const res = await operationCenter.getAssessmentData({
					role: 'attendant',
					target_id: this.currentAttendant.user_id
				});
				this.assessmentData = res.data;
			} catch (e) {
				console.error(e);
			} finally {
				this.assessmentLoading = false;
			}
		},

		// --- 辅助 UI 方法 (复用 guide-view) ---
		toggleDimension(index) {
			this.expandedDimIndex = this.expandedDimIndex === index ? -1 : index;
		},
		generateChartData(orders) {
			const months = [];
			const now = new Date();
			for (let i = 5; i >= 0; i--) {
				const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
				months.push({ year: d.getFullYear(), month: d.getMonth() + 1, count: 0 });
			}
			orders.forEach((o) => {
				const d = new Date(o.departure_date);
				const target = months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth() + 1);
				if (target) target.count++;
			});
			this.chartData = months;
		},
		formatDate(ts) {
			if (!ts) return '';
			const d = new Date(ts);
			return `${d.getMonth() + 1}/${d.getDate()}`;
		},
		formatLogText(text) {
			// 简单的文本优化，同 guide-view
			return text
				.replace(/order_count/g, '服务单数')
				.replace(/review_count/g, '评价数')
				.replace(/gte/g, '≥');
		},
		getOrderStatusText(order) {
			const now = Date.now();
			const start = order.departure_date;
			const end = start + order.total_days * 24 * 3600 * 1000;
			if (start > now) return '待服务';
			if (end < now) return '已完成';
			return '服务中';
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
		}
	}
};
</script>

<style lang="scss">
$page-bg: #f5f7fa;
$blue: #3b82f6;
$text-main: #1f2937;

.page-container {
	height: 100%;
	background-color: $page-bg;
	display: flex;
	flex-direction: column;

	.picker-trigger {
		display: flex;
		align-items: center;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 13px;
	}

	.split-layout {
		flex: 1;
		display: flex;
		overflow: hidden;
		padding: 15px;
		gap: 15px;

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
				height: 100%;
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
							&:active {
								background-color: #f0f0f0;
							}
							.dim-info {
								width: 70px;
								flex-shrink: 0;
								.d-name {
									font-size: 12px;
									font-weight: 500;
									display: block;
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
									}
								}
							}
							.dim-value {
								width: 50px;
								text-align: right;
								font-size: 13px;
								font-weight: bold;
							}
						}
						.dim-details {
							background: #fcfcfc;
							border-top: 1px dashed #eee;
							padding: 10px;
							.logs-list {
								.log-row {
									display: flex;
									justify-content: space-between;
									font-size: 10px;
									color: #666;
									margin-bottom: 2px;
									.plus {
										color: #10b981;
									}
									.minus {
										color: #ef4444;
									}
								}
								.log-title {
									font-size: 10px;
									font-weight: bold;
									color: #999;
									margin-bottom: 4px;
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
						.refresh-text {
							font-size: 11px;
							color: #3b82f6;
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
</style>
