<template>
	<view class="min-h-screen bg-gray-50">
		<!-- 顶部导航 -->
		<view class="bg-white shadow-sm border-b border-gray-200">
			<view class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<view class="flex justify-between items-center h-16">
					<view class="flex items-center">
						<i class="fas fa-home text-blue-600 text-xl mr-3"></i>
						<text class="text-xl font-semibold text-gray-900">私域运营数据中心</text>
					</view>
					<view class="text-sm text-gray-500">最后更新: {{ currentTime }}</view>
				</view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<!-- 私域用户池模块 -->
			<!-- <view class="bg-white rounded-lg shadow-md mb-8">
				<view class="px-6 py-4 border-b border-gray-200">
					<view class="flex items-center">
						<i class="fas fa-users text-indigo-600 text-lg mr-3"></i>
						<text class="text-lg font-semibold text-gray-900">私域用户池</text>
					</view>
				</view>
				<view class="p-6">
					<view class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<view class="text-center">
							<view class="text-3xl font-bold text-indigo-600 mb-2">{{ userPoolData.totalUsers }}</view>
							<view class="text-sm text-gray-600">总用户</view>
						</view>
						<view class="text-center">
							<view class="text-3xl font-bold text-green-600 mb-2">{{ userPoolData.newUsers }}</view>
							<view class="text-sm text-gray-600">新增用户</view>
						</view>
						<view class="text-center">
							<view class="text-3xl font-bold text-purple-600 mb-2">{{ userPoolData.memberConversion }}</view>
							<view class="text-sm text-gray-600">会员转化率</view>
						</view>
					</view>
				</view>
			</view> -->

			<!-- 优惠券营销模块 -->
			<!-- <view class="bg-white rounded-lg shadow-md mb-8">
				<view class="px-6 py-4 border-b border-gray-200">
					<view class="flex items-center">
						<i class="fas fa-ticket-alt text-orange-600 text-lg mr-3"></i>
						<text class="text-lg font-semibold text-gray-900">优惠券营销</text>
					</view>
				</view>
				<view class="p-6">
					<view class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
						<view class="text-center">
							<view class="text-2xl font-bold text-orange-600 mb-2">{{ couponData.issued }}</view>
							<view class="text-sm text-gray-600">发放数量</view>
						</view>
						<view class="text-center">
							<view class="text-2xl font-bold text-blue-600 mb-2">{{ couponData.used }}</view>
							<view class="text-sm text-gray-600">使用数量</view>
						</view>
						<view class="text-center">
							<view class="text-2xl font-bold text-green-600 mb-2">{{ couponData.usageRate }}</view>
							<view class="text-sm text-gray-600">使用率</view>
						</view>
						<view class="text-center">
							<view class="text-2xl font-bold text-purple-600 mb-2">{{ couponData.ordersGenerated }}</view>
							<view class="text-sm text-gray-600">带来订单</view>
						</view>
						<view class="text-center">
							<view class="text-2xl font-bold text-red-600 mb-2">{{ couponData.orderAmount }}</view>
							<view class="text-sm text-gray-600">订单金额</view>
						</view>
					</view>
				</view>
			</view> -->

			<!-- 转介绍裂变模块 -->
			<!-- <view class="bg-white rounded-lg shadow-md mb-8">
				<view class="px-6 py-4 border-b border-gray-200">
					<view class="flex items-center">
						<i class="fas fa-share-alt text-teal-600 text-lg mr-3"></i>
						<text class="text-lg font-semibold text-gray-900">转介绍裂变</text>
					</view>
				</view>
				<view class="p-6">
					<view class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
						<view class="text-center">
							<view class="text-2xl font-bold text-teal-600 mb-2">{{ referralData.inviteUsers }}</view>
							<view class="text-sm text-gray-600">邀请用户</view>
						</view>
						<view class="text-center">
							<view class="text-2xl font-bold text-cyan-600 mb-2">{{ referralData.invitedUsers }}</view>
							<view class="text-sm text-gray-600">被邀请用户</view>
						</view>
						<view class="text-center">
							<view class="text-2xl font-bold text-pink-600 mb-2">{{ referralData.spreadRate }}</view>
							<view class="text-sm text-gray-600">裂变率</view>
						</view>
						<view class="text-center">
							<view class="text-2xl font-bold text-amber-600 mb-2">{{ referralData.rewardOrders }}</view>
							<view class="text-sm text-gray-600">转介奖励</view>
						</view>
						<view class="text-center">
							<view class="text-2xl font-bold text-lime-600 mb-2">{{ referralData.rewardAmount }}</view>
							<view class="text-sm text-gray-600">奖励金额</view>
						</view>
						<view class="text-center">
							<view class="text-2xl font-bold text-emerald-600 mb-2">{{ referralData.completionRate }}</view>
							<view class="text-sm text-gray-600">完成率</view>
						</view>
					</view>
				</view>
			</view> -->

			<!-- 下单转化模块 -->
			<!-- <view class="bg-white rounded-lg shadow-md mb-8">
				<view class="px-6 py-4 border-b border-gray-200">
					<view class="flex items-center">
						<i class="fas fa-shopping-cart text-rose-600 text-lg mr-3"></i>
						<text class="text-lg font-semibold text-gray-900">下单转化</text>
					</view>
				</view>
				<view class="p-6">
					<view class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
						<view class="text-center">
							<view class="text-2xl font-bold text-rose-600 mb-2">{{ orderData.totalOrders }}</view>
							<view class="text-sm text-gray-600">总订单</view>
						</view>
						<view class="text-center">
							<view class="text-2xl font-bold text-green-600 mb-2">{{ orderData.newOrders }}</view>
							<view class="text-sm text-gray-600">新增订单</view>
						</view>
						<view class="text-center">
							<view class="text-2xl font-bold text-blue-600 mb-2">{{ orderData.conversionRate }}</view>
							<view class="text-sm text-gray-600">转化率</view>
						</view>
						<view class="text-center">
							<view class="text-2xl font-bold text-indigo-600 mb-2">{{ orderData.repeatUsers }}</view>
							<view class="text-sm text-gray-600">复购用户</view>
						</view>
						<view class="text-center">
							<view class="text-2xl font-bold text-purple-600 mb-2">{{ orderData.repeatRate }}</view>
							<view class="text-sm text-gray-600">复购率</view>
						</view>
						<view class="text-center">
							<view class="text-2xl font-bold text-orange-600 mb-2">{{ orderData.avgOrderValue }}</view>
							<view class="text-sm text-gray-600">平均客单价</view>
						</view>
					</view>
				</view>
			</view> -->

			<!-- 快捷操作区 -->
			<view class="bg-white rounded-lg shadow-md">
				<view class="px-6 py-4 border-b border-gray-200">
					<view class="flex items-center">
						<i class="fas fa-bolt text-yellow-600 text-lg mr-3"></i>
						<text class="text-lg font-semibold text-gray-900">快捷操作</text>
					</view>
				</view>
				<view class="p-6">
					<view class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4">
						<view class="bg-cyan-50 hover:bg-cyan-100 rounded-lg p-4 cursor-pointer transition-colors" @click="navigateTo('/pages/a-system/list')">
							<view class="flex items-center justify-center mb-3">
								<i class="fas fa-cogs text-cyan-600 text-2xl"></i>
							</view>
							<text class="block text-center text-sm font-medium text-cyan-900">系统管理</text>
						</view>
						<view class="bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 cursor-pointer transition-colors" @click="navigateTo('/pages/a-task-orders/list')">
							<view class="flex items-center justify-center mb-3">
								<i class="fas fa-paper-plane text-indigo-600 text-2xl"></i>
							</view>
							<text class="block text-center text-sm font-medium text-indigo-900">行中推荐任务</text>
						</view>
						<!-- <view class="bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 cursor-pointer transition-colors" @click="navigateTo('/pages/a-regions/list')">
							<view class="flex items-center justify-center mb-3">
								<i class="fas fa-globe-asia text-indigo-600 text-2xl"></i>
							</view>
							<text class="block text-center text-sm font-medium text-indigo-900">区域管理</text>
						</view> -->
						<view class="bg-pink-50 hover:bg-pink-100 rounded-lg p-4 cursor-pointer transition-colors" @click="navigateTo('/pages/a-poi-system/a-poi-system')">
							<view class="flex items-center justify-center mb-3">
								<i class="fas fa-map-marked-alt text-pink-600 text-2xl"></i>
							</view>
							<text class="block text-center text-sm font-medium text-pink-900">POI 系统管理</text>
						</view>
						<view class="bg-purple-50 hover:bg-purple-100 rounded-lg p-4 cursor-pointer transition-colors" @click="navigateTo('/pages/a-members/list')">
							<view class="flex items-center justify-center mb-3">
								<i class="fas fa-crown text-purple-600 text-2xl"></i>
							</view>
							<text class="block text-center text-sm font-medium text-purple-900">会员管理</text>
						</view>
						<view class="bg-rose-50 hover:bg-rose-100 rounded-lg p-4 cursor-pointer transition-colors" @click="navigateTo('/pages/a-customers/list')">
							<view class="flex items-center justify-center mb-3">
								<i class="fas fa-user-friends text-rose-600 text-2xl"></i>
							</view>
							<text class="block text-center text-sm font-medium text-rose-900">客户管理</text>
						</view>
						<view class="bg-green-50 hover:bg-green-100 rounded-lg p-4 cursor-pointer transition-colors" @click="navigateTo('/pages/a-products-orders/list')">
							<view class="flex items-center justify-center mb-3">
								<i class="fas fa-list-alt text-green-600 text-2xl"></i>
							</view>
							<text class="block text-center text-sm font-medium text-green-900">商品与订单管理</text>
						</view>
						<view class="bg-red-50 hover:bg-red-100 rounded-lg p-4 cursor-pointer transition-colors" @click="navigateTo('/pages/a-group-albums/list')">
							<view class="flex items-center justify-center mb-3">
								<i class="fas fa-images text-red-600 text-2xl"></i>
							</view>
							<text class="block text-center text-sm font-medium text-red-900">群相册管理</text>
						</view>
						<view class="bg-orange-50 hover:bg-orange-100 rounded-lg p-4 cursor-pointer transition-colors" @click="navigateTo('/pages/a-coupons/list')">
							<view class="flex items-center justify-center mb-3">
								<i class="fas fa-gift text-orange-600 text-2xl"></i>
							</view>
							<text class="block text-center text-sm font-medium text-orange-900">优惠券管理</text>
						</view>
						<view class="bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 cursor-pointer transition-colors" @click="navigateTo('/pages/a-operation-center/index')">
							<view class="flex items-center justify-center mb-3">
								<i class="fas fa-calendar-alt text-indigo-600 text-2xl"></i>
							</view>
							<text class="block text-center text-sm font-medium text-indigo-900">运营中心</text>
						</view>
						<view class="bg-amber-50 hover:bg-amber-100 rounded-lg p-4 cursor-pointer transition-colors" @click="navigateTo('/pages/b-employees/list')">
							<view class="flex items-center justify-center mb-3">
								<i class="fas fa-id-badge text-amber-600 text-2xl"></i>
							</view>
							<text class="block text-center text-sm font-medium text-amber-900">员工档案</text>
						</view>
						<view class="bg-teal-50 hover:bg-teal-100 rounded-lg p-4 cursor-pointer transition-colors" @click="navigateTo('/pages/a-supplies/overview')">
							<view class="flex items-center justify-center mb-3">
								<i class="fas fa-box-open text-teal-600 text-2xl"></i>
							</view>
							<text class="block text-center text-sm font-medium text-teal-900">物资管理</text>
						</view>
						<view class="bg-lime-50 hover:bg-lime-100 rounded-lg p-4 cursor-pointer transition-colors" @click="navigateTo('/pages/b-vehicle-profiles/list')">
							<view class="flex items-center justify-center mb-3">
								<i class="fas fa-car text-lime-600 text-2xl"></i>
							</view>
							<text class="block text-center text-sm font-medium text-lime-900">车辆管理</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			currentTime: '',
			// 私域用户池数据
			userPoolData: {
				totalUsers: '1,250人',
				newUsers: '15人',
				memberConversion: '54.2%'
			},
			// 优惠券营销数据
			couponData: {
				issued: '500张',
				used: '125张',
				usageRate: '25%',
				ordersGenerated: '45单',
				orderAmount: '¥89,600'
			},
			// 转介绍裂变数据
			referralData: {
				inviteUsers: '68人',
				invitedUsers: '156人',
				spreadRate: '229%',
				rewardOrders: '32单',
				rewardAmount: '¥64,000',
				completionRate: '87.5%'
			},
			// 下单转化数据
			orderData: {
				totalOrders: '186单',
				newOrders: '8单',
				conversionRate: '14.9%',
				repeatUsers: '28人',
				repeatRate: '18.7%',
				avgOrderValue: '¥1,680'
			}
		};
	},
	onLoad() {
		this.updateCurrentTime();
		// 定时更新时间
		setInterval(() => {
			this.updateCurrentTime();
		}, 60000); // 每分钟更新一次
	},
	methods: {
		updateCurrentTime() {
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const day = String(now.getDate()).padStart(2, '0');
			const hours = String(now.getHours()).padStart(2, '0');
			const minutes = String(now.getMinutes()).padStart(2, '0');
			this.currentTime = `${year}-${month}-${day} ${hours}:${minutes}`;
		},
		navigateTo(url) {
			uni.navigateTo({
				url: url
			});
		}
	}
};
</script>

<style>
/* Tailwind CSS 已通过 CDN 引入 */
/* FontAwesome 已通过 CDN 引入 */

/* 自定义样式补充 */
.cursor-pointer {
	cursor: pointer;
}

.transition-colors {
	transition: background-color 0.2s ease-in-out;
}

/* 确保hover效果在移动端也能正常工作 */
@media (hover: hover) {
	.hover\:bg-cyan-100:hover {
		background-color: #cffafe;
	}
	.hover\:bg-blue-100:hover {
		background-color: #dbeafe;
	}
	.hover\:bg-green-100:hover {
		background-color: #dcfce7;
	}
	.hover\:bg-purple-100:hover {
		background-color: #f3e8ff;
	}
	.hover\:bg-orange-100:hover {
		background-color: #ffedd5;
	}
	.hover\:bg-indigo-100:hover {
		background-color: #e0e7ff;
	}
}
</style>
