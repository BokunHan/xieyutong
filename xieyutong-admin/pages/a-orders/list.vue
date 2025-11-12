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
						<text class="text-sm text-gray-500">
							<i class="fas fa-clock mr-1"></i>
							{{ currentTime }}
						</text>
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
							<text class="text-sm opacity-90">待处理</text>
							<text class="block text-2xl font-bold">{{ statistics.pendingOrders }}</text>
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
			<snapshots-table v-show="currentTab === 0" />
			<orders-table v-show="currentTab === 1" />
		</view>
	</view>
</template>

<script>
// 导入子组件
import SnapshotsTable from './components/snapshots-table.vue';
import OrdersTable from './components/orders-table.vue';

export default {
	components: {
		SnapshotsTable,
		OrdersTable
	},
	data() {
		return {
			currentTab: 0,
			tabs: ['携程订单快照', '小程序订单'],
			currentTime: '',
			// 模拟统计数据
			statistics: {
				todayOrders: 23,
				todayRevenue: '12,568',
				pendingOrders: 8,
				monthlyCompleted: 156
			}
		};
	},
	onLoad() {
		this.updateCurrentTime();
		// 定时更新时间
		setInterval(() => {
			this.updateCurrentTime();
		}, 60000);
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
