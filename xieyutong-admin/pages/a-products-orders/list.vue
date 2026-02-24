<template>
	<view class="min-h-screen bg-gray-50" style="font-family: 'Microsoft YaHei', sans-serif">
		<view class="bg-white shadow-sm border-b border-gray-200">
			<view class="max-w-full mx-auto px-6 py-4">
				<view class="flex items-center justify-between">
					<view class="flex items-center">
						<i class="fas fa-list-alt text-emerald-600 text-2xl mr-4"></i>
						<view>
							<text class="text-2xl font-bold text-gray-900">订单管理</text>
							<text class="block text-sm text-gray-500 mt-1">管理旅游订单信息和状态</text>
						</view>
					</view>
					<view class="flex items-center space-x-3">
						<view class="text-sm text-gray-500">
							<i class="fas fa-clock mr-1"></i>
							{{ currentTime }}
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="mx-6 mt-6">
			<view class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<view class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
					<view class="flex items-center justify-between">
						<view>
							<text class="text-sm opacity-90">今日订单</text>
							<text class="block text-2xl font-bold">{{ statistics.todayOrders }}</text>
						</view>
						<i class="fas fa-shopping-cart text-2xl opacity-80"></i>
					</view>
				</view>
				<view class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
					<view class="flex items-center justify-between">
						<view>
							<text class="text-sm opacity-90">今日收入</text>
							<text class="block text-2xl font-bold">¥{{ statistics.todayRevenue }}</text>
						</view>
						<i class="fas fa-coins text-2xl opacity-80"></i>
					</view>
				</view>
				<view class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
					<view class="flex items-center justify-between">
						<view>
							<text class="text-sm opacity-90">本月新增</text>
							<text class="block text-2xl font-bold">{{ statistics.monthNewOrders }}</text>
						</view>
						<i class="fas fa-hourglass-half text-2xl opacity-80"></i>
					</view>
				</view>
				<view class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
					<view class="flex items-center justify-between">
						<view>
							<text class="text-sm opacity-90">本月完成</text>
							<text class="block text-2xl font-bold">{{ statistics.monthlyCompleted }}</text>
						</view>
						<i class="fas fa-check-circle text-2xl opacity-80"></i>
					</view>
				</view>
			</view>
		</view>

		<view class="mx-6">
			<uni-segmented-control :current="currentTab" :values="tabs" @clickItem="onClickTab" style-type="button" active-color="#10b981" class="mb-6" />
		</view>

		<view>
			<snapshots-table ref="snapshotsTable" v-show="currentTab === 0" />
			<products-table ref="productsTable" v-show="currentTab === 1" />
			<orders-table ref="ordersTable" v-show="currentTab === 2" />
		</view>
	</view>
</template>

<script>
// 导入子组件
import SnapshotsTable from './components/snapshots-table.vue';
import OrdersTable from './components/orders-table.vue';
import ProductsTable from './components/products-table.vue';

export default {
	components: {
		SnapshotsTable,
		OrdersTable,
		ProductsTable
	},
	data() {
		return {
			currentTab: 0,
			tabs: ['订单快照', '商品管理', '小程序订单'],
			currentTime: '',
			// 模拟统计数据
			statistics: {
				todayOrders: 0,
				todayRevenue: 0,
				monthNewOrders: 0,
				monthlyCompleted: 0
			}
		};
	},
	onLoad(options) {
		this.updateCurrentTime();

		if (options.targetOrderId) {
			// 1. 切换到“订单快照”标签页 (tab=0)
			this.currentTab = 0;

			// 2. 等待 DOM 渲染后，调用子组件的搜索方法
			this.$nextTick(() => {
				if (this.$refs.snapshotsTable) {
					this.$refs.snapshotsTable.autoSearchById(options.targetOrderId);
				}
			});
		}

		if (options.action === 'create') {
			// 1. 切换到快照 Tab
			this.currentTab = 0;

			// 2. 调用子组件打开弹窗，并传入 options 对象
			this.$nextTick(() => {
				if (this.$refs.snapshotsTable) {
					this.$refs.snapshotsTable.openCreateDialog(options);
				}
			});
		}

		// 定时更新时间
		setInterval(() => {
			this.updateCurrentTime();
		}, 60000);
	},
	onShow() {
		// this.updateCurrentTime();
		// this.getStatistics();
	},
	methods: {
		onClickTab(e) {
			if (this.currentTab !== e.currentIndex) {
				this.currentTab = e.currentIndex;
			}
		},
		updateCurrentTime() {
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const day = String(now.getDate()).padStart(2, '0');
			const hours = String(now.getHours()).padStart(2, '0');
			const minutes = String(now.getMinutes()).padStart(2, '0');
			this.currentTime = `${year}-${month}-${day} ${hours}:${minutes}`;
		},
		getStatistics() {
			const db = uniCloud.database();
			const cmd = db.command;
			const $ = db.command.aggregate;

			// 1. 计算时间节点
			const now = new Date();
			// 今日 00:00:00
			const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
			// 本月 1号 00:00:00
			const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
			// 下月 1号 00:00:00 (用于确定本月结束)
			const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

			// 2. 发起查询
			// 请求1：今日数据（订单数 + 收入）
			const p1 = db
				.collection('a-snapshots')
				.where({
					created_at: cmd.gt(todayStart)
				})
				.groupBy(null) // 不分组，统计全部
				.groupField({
					totalOrders: $.sum(1), // 计数
					totalRevenue: $.sum('$final_amount') // 求和
				})
				.get();

			// 请求2：本月新增（订单数）
			const p2 = db
				.collection('a-snapshots')
				.where({
					created_at: cmd.gt(monthStart)
				})
				.count();

			// 请求3：本月完成（定义为：本月出发的订单）
			const p3 = db
				.collection('a-snapshots')
				.where({
					departure_date: cmd.gte(monthStart).and(cmd.lt(nextMonthStart))
				})
				.count();

			// 3. 并行执行并处理结果
			Promise.all([p1, p2, p3])
				.then((results) => {
					// 处理今日数据
					const todayRes = results[0].result.data[0] || {};
					const todayCount = todayRes.totalOrders || 0;
					const todayMoney = todayRes.totalRevenue || 0;

					// 处理本月数据
					const monthNewCount = results[1].result.total;
					const monthCompletedCount = results[2].result.total;

					// 格式化金额 (千分位)
					const formatMoney = (num) => {
						return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
					};

					// 更新页面数据
					this.statistics = {
						todayOrders: todayCount,
						todayRevenue: formatMoney(todayMoney),
						monthNewOrders: monthNewCount,
						monthlyCompleted: monthCompletedCount
					};
				})
				.catch((err) => {
					console.error('统计数据获取失败', err);
				});
		}
	}
};
</script>

<style>
/* 您的原始样式表可以保留在这里 */

/* 确保 uni-segmented-control 样式正确 */
.mb-6 {
	margin-bottom: 1.5rem;
}
</style>
