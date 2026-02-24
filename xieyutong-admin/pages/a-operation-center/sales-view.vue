<template>
	<view class="page-container">
		<view class="split-layout" v-if="currentSale">
			<view class="left-panel">
				<view class="panel-header">
					<text class="panel-title">我的客户</text>
					<view class="filter-tabs">
						<text
							v-for="status in customerFilters"
							:key="status.key"
							class="filter-item"
							:class="{ active: currentCustomerFilter === status.key }"
							@click="currentCustomerFilter = status.key">
							{{ status.label }}
						</text>
					</view>
				</view>

				<scroll-view scroll-y class="order-scroll">
					<view v-if="listLoading" class="loading-box"><uni-load-more status="loading" /></view>

					<view v-else-if="filteredCustomers.length > 0" class="order-list">
						<view class="order-card" v-for="cust in filteredCustomers" :key="cust._id">
							<view class="order-top">
								<text class="order-no">{{ cust.source || '未知来源' }}</text>
								<text class="status-badge" :class="getCustomerStatusClass(cust.status)">
									{{ getCustomerStatusText(cust.status) }}
								</text>
							</view>
							<view class="order-title">{{ cust.name || cust.wx_name_id || '未命名客户' }}</view>
							<view class="order-info">
								<view class="info-item">
									<uni-icons type="phone" size="12" color="#999"></uni-icons>
									<text>{{ cust.mobile || '-' }}</text>
								</view>
								<view class="info-item" v-if="cust.status === 'deal'">
									<uni-icons type="wallet" size="12" color="#999"></uni-icons>
									<text>已成交</text>
								</view>
								<view class="info-item" v-else>
									<uni-icons type="chat" size="12" color="#999"></uni-icons>
									<text>跟进中</text>
								</view>
							</view>
							<view class="cust-remark" v-if="cust.remarks">
								<text>备注: {{ cust.remarks }}</text>
							</view>
						</view>
					</view>

					<view v-else class="empty-state">
						<text>暂无符合条件的客户</text>
					</view>
				</scroll-view>
			</view>

			<view class="right-panel">
				<scroll-view scroll-y class="assessment-scroll">
					<view v-if="assessmentLoading" class="loading-box"><uni-load-more status="loading" /></view>

					<view v-else-if="assessmentData" class="assessment-content">
						<view class="score-header-card">
							<view class="main-score-area">
								<image :src="currentSale.avatar || '/static/avatar-default.png'" mode="aspectFill" class="header-avatar" />
								<view class="score-circle">
									<text class="num">{{ assessmentData.total_score }}</text>
									<text class="label">业绩分</text>
								</view>
								<view class="rank-info">
									<view class="grade-tag" :class="'grade-' + (assessmentData.rank_level || 'A').toLowerCase()">等级 {{ assessmentData.rank_level || 'D' }}</view>
									<text class="rank-text">销售评级</text>
								</view>
							</view>

							<custom-picker v-if="salesList.length > 0" :options="salesList" :value="currentSale" label-key="real_name" value-key="user_id" @change="onSaleChange"></custom-picker>
						</view>

						<view class="dimensions-section">
							<view class="section-label">
								<text>业绩考核明细</text>
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
										<view class="log-title">详细记录:</view>
										<view class="log-row" v-for="(log, li) in dim.logs" :key="li">
											<text class="l-text">{{ log.text }}</text>
											<text class="l-score" :class="log.delta > 0 ? 'plus' : 'minus'">{{ log.delta > 0 ? '+' : '' }}{{ log.delta }}</text>
										</view>
									</view>
									<view class="logs-list" v-else>
										<text class="log-empty">暂无记录</text>
									</view>
								</view>
							</view>
						</view>

						<view class="chart-section">
							<view class="section-label">近6个月新增客户数</view>
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
			<text>正在加载销售列表...</text>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const operationCenter = uniCloud.importObject('a-operation-center');
import CustomPicker from '@/components/custom-picker/custom-picker.vue';

export default {
	name: 'sales-view',
	props: { targetId: { type: String, default: '' } },
	components: {
		CustomPicker
	},
	data() {
		return {
			salesList: [],
			// pickerIndex: 0,
			currentSale: null,

			// 左侧列表相关 (客户)
			listLoading: false,
			rawCustomers: [],
			currentCustomerFilter: 'all',
			// 对应 a-customers 的 status
			customerFilters: [
				{ key: 'all', label: '全部' },
				{ key: 'following', label: '跟进中' },
				{ key: 'deal', label: '已成交' },
				{ key: 'lost', label: '流失' }
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
		filteredCustomers() {
			if (this.currentCustomerFilter === 'all') return this.rawCustomers;

			// 简单的状态映射
			if (this.currentCustomerFilter === 'following') {
				// new 和 following 都算跟进中
				return this.rawCustomers.filter((c) => c.status === 'new' || c.status === 'following');
			}

			return this.rawCustomers.filter((c) => c.status === this.currentCustomerFilter);
		},
		maxChartValue() {
			if (this.chartData.length === 0) return 10;
			const max = Math.max(...this.chartData.map((i) => i.count));
			return max === 0 ? 10 : max;
		}
	},
	watch: {
		salesList: {
			handler(newVal) {
				if (newVal && newVal.length > 0) {
					// 优先匹配 targetId
					if (this.targetId) {
						const target = newVal.find((s) => s.user_id === this.targetId);
						if (target) {
							this.pickerIndex = newVal.indexOf(target);
							this.switchSale(target);
							return;
						}
					}
					if (!this.currentSale) {
						this.pickerIndex = 0;
						this.switchSale(newVal[0]);
					}
				}
			},
			immediate: true
		},
		// 监听 targetId 变化（应对组件已挂载但 ID 变更的情况）
		targetId(newId) {
			if (newId && this.salesList.length > 0) {
				const target = this.salesList.find((g) => g.user_id === newId);
				if (target) {
					this.pickerIndex = this.salesList.indexOf(target);
					this.switchSale(target);
				}
			}
		}
	},
	mounted() {
		this.fetchSalesList();
	},
	methods: {
		// 1. 获取销售人员列表
		async fetchSalesList() {
			try {
				const res = await db.collection('uni-id-users').where({ role: 'sale' }).field('_id, nickname, username, mobile, avatar_file, avatar').get();

				this.salesList = res.result.data.map((u) => ({
					user_id: u._id,
					real_name: u.nickname || u.username || '销售',
					mobile: u.mobile,
					avatar: u.avatar_file?.url || u.avatar
				}));

				if (this.salesList.length > 0 && !this.currentSale) {
					this.switchSale(this.salesList[0]);
				}
			} catch (e) {
				console.error(e);
			}
		},

		onSaleChange(selectedItem) {
			this.switchSale(selectedItem);
		},

		switchSale(sale) {
			if (!sale) return;
			this.currentSale = sale;
			this.rawCustomers = [];
			this.chartData = [];
			this.assessmentData = null;
			this.expandedDimIndex = -1;

			this.fetchAssessment();
			this.fetchCustomers();
		},

		// 2. 获取该销售名下的客户 (a-customers)
		async fetchCustomers() {
			this.listLoading = true;
			try {
				const targetId = this.currentSale.user_id;
				// 查询 a-customers 表
				const res = await db
					.collection('a-customers')
					.where({
						sales_id: targetId
					})
					.orderBy('created_at', 'desc')
					.limit(50)
					.get();

				this.rawCustomers = res.result.data;
				this.generateChartData(this.rawCustomers);
			} catch (e) {
				console.error('Customers fetch failed', e);
			} finally {
				this.listLoading = false;
			}
		},

		// 3. 获取考核数据
		async fetchAssessment() {
			if (!this.currentSale) return;
			this.assessmentLoading = true;
			try {
				const res = await operationCenter.getAssessmentData({
					role: 'sale', // 角色改为 sale
					target_id: this.currentSale.user_id
				});
				this.assessmentData = res.data;
			} catch (e) {
				console.error(e);
			} finally {
				this.assessmentLoading = false;
			}
		},

		toggleDimension(index) {
			this.expandedDimIndex = this.expandedDimIndex === index ? -1 : index;
		},

		// 图表：按客户创建时间统计
		generateChartData(customers) {
			const months = [];
			const now = new Date();
			for (let i = 5; i >= 0; i--) {
				const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
				months.push({ year: d.getFullYear(), month: d.getMonth() + 1, count: 0 });
			}
			customers.forEach((c) => {
				if (c.created_at) {
					const d = new Date(c.created_at);
					const target = months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth() + 1);
					if (target) target.count++;
				}
			});
			this.chartData = months;
		},

		// --- UI 辅助 ---
		getCustomerStatusText(status) {
			const map = {
				new: '新增',
				following: '跟进中',
				deal: '已成交',
				lost: '已流失'
			};
			return map[status] || status;
		},
		getCustomerStatusClass(status) {
			if (status === 'deal') return 'status-completed'; // 绿色
			if (status === 'lost') return 'status-lost'; // 灰色
			if (status === 'following') return 'status-ongoing'; // 橙色
			return 'status-pending'; // 蓝色
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
							&.status-lost {
								background: #f3f4f6;
								color: #9ca3af;
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
						margin-bottom: 4px;
						.info-item {
							display: flex;
							align-items: center;
							gap: 4px;
							font-size: 11px;
							color: #666;
						}
					}
					.cust-remark {
						font-size: 11px;
						color: #999;
						background: #f9fafb;
						padding: 4px 6px;
						border-radius: 4px;
						margin-top: 6px;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
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
