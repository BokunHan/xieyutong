<template>
	<view class="page-container">
		<view class="dashboard-tabs">
			<!-- <view class="tab-item" :class="{ active: activeTab === 'summary' }" @click="activeTab = 'summary'">综合大盘</view> -->
			<view class="tab-item" :class="{ active: activeTab === 'sales' }" @click="activeTab = 'sales'">销售面板</view>
		</view>

		<scroll-view scroll-y="true" class="main-content" v-if="activeTab === 'sales'">
			<sales-panel ref="salesPanel" />
		</scroll-view>

		<!-- <scroll-view scroll-y="true" class="main-content" v-if="activeTab === 'summary' && !isLoading">
			<view class="metrics-panel">
				<view class="metric-card blue-theme">
					<view class="card-top">
						<text class="card-label">总销售额 (本月)</text>
						<uni-icons type="wallet" size="20" color="#fff"></uni-icons>
					</view>
					<view class="card-value">¥ {{ formatNumber(stats.totalSales) }}</view>
					<view class="card-trend">
						<text>环比 {{ stats.salesGrowth > 0 ? '+' : '' }}{{ stats.salesGrowth }}%</text>
						<uni-icons :type="stats.salesGrowth >= 0 ? 'arrow-up' : 'arrow-down'" size="12" color="rgba(255,255,255,0.8)"></uni-icons>
					</view>
				</view>

				<view class="metric-card green-theme">
					<view class="card-top">
						<text class="card-label">订单转化率</text>
						<uni-icons type="refresh-filled" size="20" color="#fff"></uni-icons>
					</view>
					<view class="card-value">{{ stats.conversionRate }}%</view>
					<view class="card-trend">
						<text>成交客户 {{ stats.dealCount }} 人</text>
					</view>
				</view>

				<view class="metric-card cyan-theme">
					<view class="card-top">
						<text class="card-label">平均综合分</text>
						<uni-icons type="hand-up" size="20" color="#fff"></uni-icons>
					</view>
					<view class="card-value">{{ stats.avgScore }}</view>
					<view class="card-trend">
						<text>A级司导占比 {{ stats.excellentRate }}%</text>
					</view>
				</view>

				<view class="metric-card orange-theme">
					<view class="card-top">
						<text class="card-label">私导人数 (优/普)</text>
						<uni-icons type="staff" size="20" color="#fff"></uni-icons>
					</view>
					<view class="card-value">{{ stats.driverCounts.excellent }} / {{ stats.driverCounts.normal }}</view>
					<view class="card-trend">
						<text>总计 {{ stats.driverTotal }} 人</text>
					</view>
				</view>
			</view>

			<view class="charts-panel">
				<view class="chart-box big-chart">
					<view class="chart-header">
						<text class="chart-title">月度销售额趋势 (近6个月)</text>
						<view class="legend">
							<view class="dot blue"></view>
							<text>预估额 (万元)</text>
						</view>
					</view>
					<view class="chart-body">
						<view class="bar-chart-container">
							<view class="bar-item" v-for="(item, index) in chartData.salesTrend" :key="index">
								<view class="bar-column">
									<view class="bar-fill" :style="{ height: item.percent + '%' }">
										<text class="bar-val">{{ item.value }}</text>
									</view>
								</view>
								<text class="bar-label">{{ item.month }}月</text>
							</view>
						</view>
					</view>
				</view>

				<view class="chart-box small-chart">
					<view class="chart-header">
						<text class="chart-title">司导考核等级分布</text>
					</view>
					<view class="chart-body donut-body">
						<view class="donut-chart-wrapper">
							<view class="css-donut" :style="donutStyle"></view>
							<view class="donut-center">
								<text class="center-val">{{ stats.driverTotal }}</text>
								<text class="center-lbl">总人数</text>
							</view>
						</view>
						<view class="chart-legend-list">
							<view class="legend-row">
								<view class="dot green"></view>
								<text>优秀 (A/B级) {{ chartData.driverDist.excellent }}人</text>
							</view>
							<view class="legend-row">
								<view class="dot gray"></view>
								<text>普通 (C/D级) {{ chartData.driverDist.normal }}人</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<view class="todo-panel">
				<view class="panel-header">待办提醒</view>
				<view class="todo-list">
					<view class="todo-item" v-if="pendingRisks.length > 0">
						<uni-tag text="风险" type="error" size="small" />
						<text class="todo-text">有 {{ pendingRisks.length }} 位司导（{{ pendingRisks.join('、') }}）考核评级为C/D，需关注</text>
						<text class="link-btn">查看考核</text>
					</view>

					<view class="todo-item" v-if="pendingDispatchList.length > 0">
						<uni-tag text="派单" type="primary" size="small" />
						<text class="todo-text">明日有 {{ pendingDispatchList.length }} 个行程即将出发，但尚未分配私导</text>
						<text class="link-btn" @click="handleDispatchJump">去处理</text>
					</view>

					<view class="todo-item-group" v-if="missingPhotoList.length > 0">
						<view class="todo-item" @click="toggleNoPhoto">
							<uni-tag text="相册" type="warning" size="small" />
							<view class="todo-text">
								今日有 {{ missingPhotoList.length }} 个进行中的行程尚未上传照片
								<uni-icons :type="isNoPhotoExpanded ? 'top' : 'bottom'" size="12" color="#666" style="margin-left: 4px"></uni-icons>
							</view>
						</view>
						<view class="todo-detail-list" v-if="isNoPhotoExpanded">
							<view class="detail-row" v-for="order in missingPhotoList" :key="order._id">
								<text class="detail-id">{{ order.order_id }}</text>
								<text class="detail-title">{{ order.title }}</text>
								<text class="detail-guide">
									<uni-icons type="staff" size="12" color="#999"></uni-icons>
									{{ getGuideInfo(order.staves) }}
								</text>
							</view>
						</view>
					</view>

					<view class="todo-item" v-if="pendingRisks.length === 0 && pendingDispatchList.length === 0 && missingPhotoList.length === 0">
						<uni-tag text="完成" type="success" size="small" />
						<text class="todo-text">当前暂无紧急待办事项。</text>
					</view>
				</view>
			</view>
		</scroll-view> -->

		<!-- <view v-if="isLoading" class="loading-state">
			<uni-load-more status="loading" />
		</view> -->
	</view>
</template>

<script>
const db = uniCloud.database();
const dbCmd = db.command;
const operationCenter = uniCloud.importObject('a-operation-center');
import SalesPanel from './sales-panel.vue';

export default {
	components: { SalesPanel },
	data() {
		return {
			activeTab: 'sales'
			// isLoading: true,
			// stats: {
			// 	totalSales: 0,
			// 	salesGrowth: 0,
			// 	conversionRate: 0,
			// 	dealCount: 0,
			// 	avgScore: 0,
			// 	excellentRate: 0,
			// 	driverCounts: { excellent: 0, normal: 0 },
			// 	driverTotal: 0
			// },
			// chartData: {
			// 	salesTrend: [],
			// 	driverDist: { excellent: 0, normal: 0 }
			// },
			// pendingRisks: [], // 风险司机名字列表
			// pendingDispatchList: [], // 待派单的订单列表
			// missingPhotoList: [], // 缺照片的订单列表
			// isNoPhotoExpanded: false
		};
	},
	computed: {
		donutStyle() {
			const total = this.stats.driverTotal || 1;
			const excPct = (this.chartData.driverDist.excellent / total) * 100;
			return {
				background: `conic-gradient(#10b981 0% ${excPct}%, #e5e7eb ${excPct}% 100%)`
			};
		}
	},
	mounted() {
		// this.fetchDashboardData();
		// this.fetchTodos();
	},
	methods: {
		formatNumber(num) {
			return (num || 0).toLocaleString();
		}

		// 处理跳转：去处理待派单
		// handleDispatchJump() {
		// 	// 方案：跳转到快照列表页，并携带筛选参数
		// 	// 目前先打日志，需要确认您是否同意修改 snapshots-table.vue 来接收参数
		// 	console.log('跳转到订单列表，筛选明日未派单行程');
		// 	uni.showToast({ title: '即将跳转处理...', icon: 'none' });

		// 	// 实际代码示例（待 snapshots-table 支持后生效）：
		// 	// uni.navigateTo({
		// 	// 	url: '/pages/snapshots-table/snapshots-table?filter=unassigned_tomorrow'
		// 	// });
		// },

		// // 展开/收起照片提醒
		// toggleNoPhoto() {
		// 	this.isNoPhotoExpanded = !this.isNoPhotoExpanded;
		// },

		// // 辅助方法：从 staves 数组中提取司导信息
		// getGuideInfo(staves) {
		// 	if (!staves || !Array.isArray(staves)) return '未分配';
		// 	const guide = staves.find((s) => {
		// 		const r = s.role;
		// 		return r === 'guide' || (Array.isArray(r) && r.includes('guide'));
		// 	});
		// 	return guide ? guide.mobile || '已分配' : '未分配';
		// },

		// async fetchDashboardData() {
		// 	this.isLoading = true;
		// 	try {
		// 		const now = new Date();
		// 		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
		// 		const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
		// 		const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).getTime();

		// 		// 并行请求数据
		// 		const [customersRes, ordersRes, assessmentRes] = await Promise.all([
		// 			// 1. 客户数据：用于计算转化率
		// 			db.collection('a-customers').field('status').limit(1000).get(),

		// 			// 2. 订单数据：用于计算销售额、趋势、待派单
		// 			// 获取过去6个月到现在，以及未来的订单
		// 			db
		// 				.collection('a-snapshots')
		// 				.where({
		// 					departure_date: dbCmd.gte(sixMonthsAgo)
		// 				})
		// 				.field('departure_date, total_days, staves, final_amount')
		// 				.limit(1000)
		// 				.get(),

		// 			// 3. 司导考核数据：直接调用云对象获取最新评分
		// 			operationCenter.getAssessmentData({ role: 'guide' })
		// 		]);

		// 		// --- A. 处理客户转化率 ---
		// 		const customers = customersRes.result.data;
		// 		const totalCust = customers.length;
		// 		const dealCust = customers.filter((c) => c.status === 'deal').length;
		// 		this.stats.conversionRate = totalCust > 0 ? ((dealCust / totalCust) * 100).toFixed(1) : 0;
		// 		this.stats.dealCount = dealCust;

		// 		// --- B. 处理订单与销售额 ---
		// 		const orders = ordersRes.result.data;
		// 		let currentMonthSales = 0;
		// 		let lastMonthSales = 0;
		// 		let pendingDispatch = 0;
		// 		const trendMap = {}; // Key: "2023-12", Value: amount

		// 		// 初始化过去6个月的Key
		// 		for (let i = 0; i < 6; i++) {
		// 			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		// 			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		// 			trendMap[key] = 0;
		// 		}

		// 		orders.forEach((o) => {
		// 			const amount = o.final_amount || 0;
		// 			const orderDate = new Date(o.departure_date);
		// 			const key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;

		// 			// 1. 本月与上月销售额
		// 			if (o.departure_date >= startOfMonth) {
		// 				currentMonthSales += amount;
		// 			} else if (o.departure_date >= startOfLastMonth && o.departure_date < startOfMonth) {
		// 				lastMonthSales += amount;
		// 			}

		// 			// 2. 趋势数据聚合
		// 			if (trendMap[key] !== undefined) {
		// 				trendMap[key] += amount;
		// 			}

		// 			// 3. 统计未来7天待派单 (staves 为空或长度为0)
		// 			const isFuture = o.departure_date > now.getTime();
		// 			const isWithin7Days = o.departure_date < now.getTime() + 7 * 24 * 3600 * 1000;
		// 			const unassigned = !o.staves || o.staves.length === 0;
		// 			if (isFuture && isWithin7Days && unassigned) {
		// 				pendingDispatch++;
		// 			}
		// 		});

		// 		this.stats.totalSales = currentMonthSales;
		// 		// 计算环比
		// 		if (lastMonthSales > 0) {
		// 			this.stats.salesGrowth = (((currentMonthSales - lastMonthSales) / lastMonthSales) * 100).toFixed(1);
		// 		} else {
		// 			this.stats.salesGrowth = currentMonthSales > 0 ? 100 : 0;
		// 		}
		// 		this.pendingDispatchCount = pendingDispatch;

		// 		// 构建趋势图数据 (倒序转正序)
		// 		const trendKeys = Object.keys(trendMap).sort();
		// 		const maxVal = Math.max(...Object.values(trendMap)) || 1;
		// 		this.chartData.salesTrend = trendKeys.map((k) => ({
		// 			month: parseInt(k.split('-')[1]),
		// 			value: (trendMap[k] / 10000).toFixed(1), // 转为万元
		// 			percent: (trendMap[k] / maxVal) * 100
		// 		}));

		// 		// --- C. 处理司导考核数据 ---
		// 		const guidesData = assessmentRes.data || []; // 这是一个数组，包含 rank_level, total_score
		// 		const totalGuides = guidesData.length;
		// 		let excellentCount = 0;
		// 		let totalScore = 0;
		// 		const risks = [];

		// 		guidesData.forEach((g) => {
		// 			totalScore += g.total_score || 0;
		// 			// A, B级视为优秀/良好
		// 			if (g.rank_level === 'A' || g.rank_level === 'B') {
		// 				excellentCount++;
		// 			}
		// 			// 收集风险名单 (C级以下)
		// 			if (g.rank_level === 'C' || g.rank_level === 'D') {
		// 				if (risks.length < 3) risks.push(g.real_name); // 最多显示3个名字
		// 			}
		// 		});

		// 		this.stats.driverTotal = totalGuides;
		// 		this.stats.driverCounts.excellent = excellentCount;
		// 		this.stats.driverCounts.normal = totalGuides - excellentCount;
		// 		this.stats.avgScore = totalGuides > 0 ? (totalScore / totalGuides).toFixed(1) : 0;
		// 		this.stats.excellentRate = totalGuides > 0 ? Math.round((excellentCount / totalGuides) * 100) : 0;

		// 		this.chartData.driverDist = {
		// 			excellent: excellentCount,
		// 			normal: totalGuides - excellentCount
		// 		};
		// 		this.pendingRisks = risks;
		// 	} catch (e) {
		// 		console.error('Dashboard load error:', e);
		// 		uni.showToast({ title: '加载失败', icon: 'none' });
		// 	} finally {
		// 		this.isLoading = false;
		// 	}
		// },

		// // 专门获取待办数据
		// async fetchTodos() {
		// 	try {
		// 		const now = Date.now();

		// 		// === 任务1: 明日出发未分配私导 ===
		// 		const tomorrow = new Date();
		// 		tomorrow.setDate(tomorrow.getDate() + 1);
		// 		tomorrow.setHours(0, 0, 0, 0);
		// 		const tomorrowEnd = new Date(tomorrow);
		// 		tomorrowEnd.setHours(23, 59, 59, 999);

		// 		const dispatchRes = await db
		// 			.collection('a-snapshots')
		// 			.where({
		// 				departure_date: dbCmd.gte(tomorrow.getTime()).and(dbCmd.lte(tomorrowEnd.getTime()))
		// 			})
		// 			.field('order_id, title, staves, departure_date')
		// 			.get();

		// 		// 筛选 staves 中没有 guide 角色的订单
		// 		this.pendingDispatchList = dispatchRes.result.data.filter((order) => {
		// 			if (!order.staves || order.staves.length === 0) return true;
		// 			const hasGuide = order.staves.some((s) => {
		// 				const r = s.role;
		// 				return r === 'guide' || (Array.isArray(r) && r.includes('guide'));
		// 			});
		// 			return !hasGuide;
		// 		});

		// 		// === 任务2: 今日进行中但未上传照片 ===
		// 		// 1. 获取所有"进行中"的订单 (简单起见，取最近15天出发且未结束的)
		// 		const fifteenDaysAgo = now - 15 * 24 * 3600 * 1000;
		// 		const activeRes = await db
		// 			.collection('a-snapshots')
		// 			.where({
		// 				departure_date: dbCmd.gte(fifteenDaysAgo).and(dbCmd.lte(now))
		// 			})
		// 			.field('order_id, title, staves, departure_date, total_days')
		// 			.limit(100)
		// 			.get();

		// 		const activeOrders = activeRes.result.data.filter((o) => {
		// 			const endTime = o.departure_date + o.total_days * 24 * 3600 * 1000;
		// 			return o.departure_date <= now && now <= endTime;
		// 		});

		// 		if (activeOrders.length > 0) {
		// 			const orderIds = activeOrders.map((o) => o.order_id);

		// 			// 2. 找到对应的相册ID
		// 			const albumsRes = await db
		// 				.collection('a-group-albums')
		// 				.where({ order_id: dbCmd.in(orderIds) })
		// 				.field('_id, order_id')
		// 				.get();

		// 			const albumMap = {}; // order_id -> album_id
		// 			const albumIds = [];
		// 			albumsRes.result.data.forEach((a) => {
		// 				albumMap[a.order_id] = a._id;
		// 				albumIds.push(a._id);
		// 			});

		// 			// 3. 查询这些相册今日是否有照片上传
		// 			let albumsWithPhotos = new Set();
		// 			if (albumIds.length > 0) {
		// 				const todayStart = new Date();
		// 				todayStart.setHours(0, 0, 0, 0);

		// 				const photosRes = await db
		// 					.collection('a-album-photos')
		// 					.where({
		// 						album_id: dbCmd.in(albumIds),
		// 						create_date: dbCmd.gte(todayStart.getTime())
		// 					})
		// 					.field('album_id')
		// 					.get();

		// 				photosRes.result.data.forEach((p) => albumsWithPhotos.add(p.album_id));
		// 			}

		// 			// 4. 筛选出缺照片的订单
		// 			this.missingPhotoList = activeOrders.filter((o) => {
		// 				const aid = albumMap[o.order_id];
		// 				// 如果没相册，或者相册不在"今日有照片"的集合中
		// 				if (!aid) return true;
		// 				return !albumsWithPhotos.has(aid);
		// 			});
		// 		}
		// 	} catch (e) {
		// 		console.error('Fetch todos error:', e);
		// 	}
		// }
	}
};
</script>

<style lang="scss">
$page-bg: #f5f7fa;
$text-main: #1f2937;
$text-sub: #6b7280;

.dashboard-tabs {
	display: flex;
	background: #fff;
	padding: 5px 10px 0;
	border-bottom: 1px solid #eee;
	flex-shrink: 0;

	.tab-item {
		padding: 10px 20px;
		font-size: 14px;
		color: #666;
		cursor: pointer;
		position: relative;
		font-weight: 500;

		&.active {
			color: #3b82f6;
			font-weight: bold;
			&:after {
				content: '';
				position: absolute;
				bottom: -1px; /* 盖住边框 */
				left: 20px;
				right: 20px;
				height: 3px;
				background: #3b82f6;
				border-radius: 3px 3px 0 0;
			}
		}
	}
}

.page-container {
	display: flex;
	flex-direction: column;
	height: 100vh; /* 修正高度 */
	background-color: $page-bg;

	.main-content {
		flex: 1;
		padding: 20px;
		padding-bottom: 170px;
		overflow-y: auto;
		box-sizing: border-box;
		height: 0; /* 确保scroll-view高度 */
	}

	.metrics-panel {
		display: flex;
		gap: 15px;
		margin-bottom: 20px;

		.metric-card {
			flex: 1;
			min-width: 20%;
			min-height: 130px;
			border-radius: 12px;
			padding: 20px;
			color: #fff;
			box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
			display: flex;
			flex-direction: column;
			justify-content: space-between;

			&.blue-theme {
				background: linear-gradient(135deg, #3b82f6, #2563eb);
			}
			&.green-theme {
				background: linear-gradient(135deg, #10b981, #059669);
			}
			&.cyan-theme {
				background: linear-gradient(135deg, #06b6d4, #0891b2);
			}
			&.orange-theme {
				background: linear-gradient(135deg, #f59e0b, #d97706);
			}

			.card-top {
				display: flex;
				justify-content: space-between;
				align-items: flex-start;
				margin-bottom: 10px;
				.card-label {
					font-size: 13px;
					opacity: 0.95;
					font-weight: 500;
				}
			}
			.card-value {
				font-size: 28px;
				font-weight: bold;
				margin-bottom: 10px;
				white-space: nowrap;
			}
			.card-trend {
				font-size: 12px;
				display: flex;
				align-items: center;
				opacity: 0.85;
				text {
					margin-right: 4px;
				}
			}
		}
	}

	.charts-panel {
		display: flex;
		gap: 20px;
		min-height: 350px;
		margin-bottom: 20px;

		.chart-box {
			background: #fff;
			border-radius: 8px;
			padding: 20px;
			display: flex;
			flex-direction: column;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
			.chart-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 25px;
				.chart-title {
					font-size: 15px;
					font-weight: 700;
					color: $text-main;
				}
				.legend {
					display: flex;
					align-items: center;
					font-size: 11px;
					color: $text-sub;
					.dot {
						width: 8px;
						height: 8px;
						border-radius: 50%;
						margin-right: 6px;
					}
					.blue {
						background: #3b82f6;
					}
				}
			}
			&.big-chart {
				flex: 2;
			}
			&.small-chart {
				flex: 1;
			}
			.chart-body {
				flex: 1;
				position: relative;
			}
		}

		.bar-chart-container {
			display: flex;
			height: 100%;
			align-items: flex-end;
			justify-content: space-around;
			padding-bottom: 10px;
			padding-top: 25px;
			border-bottom: 1px solid #eee;
			.bar-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				height: 100%;
				width: 40px;
				.bar-column {
					flex: 1;
					width: 12px;
					background: #f3f4f6;
					border-radius: 6px;
					display: flex;
					align-items: flex-end;
					overflow: visible;
					.bar-fill {
						width: 100%;
						background: #3b82f6;
						position: relative;
						border-radius: 6px;
						.bar-val {
							position: absolute;
							top: -22px;
							left: 50%;
							transform: translateX(-50%);
							font-size: 11px;
							color: #333;
							font-weight: bold;
							white-space: nowrap;
							z-index: 10;
						}
					}
				}
				.bar-label {
					margin-top: 8px;
					font-size: 11px;
					color: $text-sub;
				}
			}
		}

		.donut-body {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			.donut-chart-wrapper {
				width: 140px;
				height: 140px;
				position: relative;
				margin-bottom: 20px;
				.css-donut {
					width: 100%;
					height: 100%;
					border-radius: 50%;
				}
				.donut-center {
					position: absolute;
					top: 20px;
					left: 20px;
					right: 20px;
					bottom: 20px;
					background: #fff;
					border-radius: 50%;
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					.center-val {
						font-size: 24px;
						font-weight: bold;
						color: $text-main;
					}
					.center-lbl {
						font-size: 12px;
						color: $text-sub;
					}
				}
			}
			.chart-legend-list {
				width: 100%;
				.legend-row {
					display: flex;
					align-items: center;
					margin-bottom: 8px;
					font-size: 13px;
					color: $text-sub;
					.dot {
						width: 8px;
						height: 8px;
						border-radius: 2px;
						margin-right: 8px;
					}
					.green {
						background: #10b981;
					}
					.gray {
						background: #e5e7eb;
					}
				}
			}
		}
	}

	.todo-panel {
		background: #fff;
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 40px;

		.panel-header {
			font-size: 16px;
			font-weight: 700;
			margin-bottom: 15px;
			color: $text-main;
		}

		.todo-list {
			.todo-item {
				display: flex;
				align-items: flex-start;
				padding: 12px 0;
				border-bottom: 1px solid #f9fafb;
				cursor: pointer;

				&:last-child {
					border-bottom: none;
				}

				.todo-text {
					flex: 1;
					margin-left: 10px;
					font-size: 13px;
					color: $text-main;
					line-height: 1.6;
					display: flex;
					align-items: center;
				}

				.link-btn {
					font-size: 13px;
					color: #3b82f6;
					cursor: pointer;
					white-space: nowrap;
					margin-left: 10px;
					font-weight: 500;
				}
			}

			/* 展开的详情列表样式 */
			.todo-detail-list {
				background-color: #f9fafb;
				border-radius: 6px;
				padding: 10px;
				margin-top: -5px;
				margin-bottom: 10px;
				margin-left: 5px;

				.detail-row {
					display: flex;
					justify-content: space-between;
					font-size: 12px;
					padding: 6px 0;
					border-bottom: 1px dashed #e5e7eb;

					&:last-child {
						border-bottom: none;
					}

					.detail-id {
						color: #6b7280;
						width: 200px;
					}
					.detail-title {
						flex: 1;
						color: #374151;
						margin: 0 10px;
						overflow: hidden;
						white-space: nowrap;
						text-overflow: ellipsis;
					}
					.detail-guide {
						color: #059669;
						width: 120px;
						text-align: right;
						display: flex;
						align-items: center;
						justify-content: flex-end;
						gap: 4px;
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
