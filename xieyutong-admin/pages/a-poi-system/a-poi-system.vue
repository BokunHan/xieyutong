<template>
	<view class="min-h-screen bg-gray-50 p-6">
		<view class="mx-5 my-3">
			<!-- 页面标题 -->
			<view class="flex items-center mb-6">
				<i class="fas fa-map-marked-alt text-pink-600 text-2xl mr-3"></i>
				<text class="text-2xl font-semibold text-gray-900">POI 系统管理</text>
			</view>

			<!-- 介绍文本 -->
			<view class="bg-white p-5 rounded-lg shadow-sm mb-6 border border-gray-200">
				<text class="text-gray-700">管理兴趣点 (Point of Interest) 系统数据，请从以下入口开始操作：</text>
			</view>

			<!-- 功能网格 -->
			<view class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<!-- POI 内容管理 -->
				<view class="bg-pink-50 hover:bg-pink-100 rounded-lg p-6 cursor-pointer transition-colors shadow-sm" @click="navigateTo('../a-poi-system/a-poi-database/list')">
					<view class="flex items-center justify-center mb-4">
						<view class="w-16 h-16 rounded-full bg-pink-600 flex items-center justify-center">
							<i class="fas fa-map-marker-alt text-white text-3xl"></i>
						</view>
					</view>
					<text class="block text-center text-lg font-medium text-pink-900">POI 内容管理</text>
					<text class="block text-center text-sm text-gray-600 mt-1">文字介绍、图片视频、标签、别名等</text>
				</view>

				<!-- POI 分类管理 -->
				<view class="bg-blue-50 hover:bg-blue-100 rounded-lg p-6 cursor-pointer transition-colors shadow-sm" @click="navigateTo('../a-poi-system/a-poi-categories/list')">
					<view class="flex items-center justify-center mb-4">
						<view class="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
							<i class="fas fa-sitemap text-white text-3xl"></i>
						</view>
					</view>
					<text class="block text-center text-lg font-medium text-blue-900">POI 分类管理</text>
					<text class="block text-center text-sm text-gray-600 mt-1">例如：景点、餐厅、酒店</text>
				</view>

				<!-- POI 标签管理 -->
				<view class="bg-green-50 hover:bg-green-100 rounded-lg p-6 cursor-pointer transition-colors shadow-sm" @click="navigateTo('../a-poi-system/a-poi-tags/list')">
					<view class="flex items-center justify-center mb-4">
						<view class="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
							<i class="fas fa-tags text-white text-3xl"></i>
						</view>
					</view>
					<text class="block text-center text-lg font-medium text-green-900">POI 标签管理</text>
					<text class="block text-center text-sm text-gray-600 mt-1">例如：网红打卡、历史遗迹</text>
				</view>

				<view class="bg-indigo-50 hover:bg-indigo-100 rounded-lg p-6 cursor-pointer transition-colors shadow-sm" @click="navigateTo('/pages/a-regions/list')">
					<view class="flex items-center justify-center mb-4">
						<view class="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center">
							<i class="fas fa-globe-asia text-white text-3xl"></i>
						</view>
					</view>
					<text class="block text-center text-lg font-medium text-green-900">区域管理</text>
					<text class="block text-center text-sm text-indigo-900 mt-1">树状层级的区域管理</text>
				</view>

				<!-- 行程 POI 校准 -->
				<!-- <view class="bg-orange-50 hover:bg-orange-100 rounded-lg p-6 cursor-pointer transition-colors shadow-sm" @click="navigateTo('./a-poi-calibration/list')">
					<view class="flex items-center justify-center mb-4">
						<view class="w-16 h-16 rounded-full bg-orange-600 flex items-center justify-center">
							<i class="fas fa-check-double text-white text-3xl"></i>
						</view>
					</view>
					<text class="block text-center text-lg font-medium text-orange-900">行程 POI 校准</text>
					<text class="block text-center text-sm text-gray-600 mt-1">批量匹配行程与POI</text>
				</view> -->
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {};
	},
	methods: {
		navigateTo(url) {
			uni.navigateTo({
				url: url
			});
		}
	}
};
</script>

<style>
/* Tailwind CSS 和 FontAwesome 假设已全局引入 */
.cursor-pointer {
	cursor: pointer;
}
.transition-colors {
	transition: background-color 0.2s ease-in-out;
}
</style>
