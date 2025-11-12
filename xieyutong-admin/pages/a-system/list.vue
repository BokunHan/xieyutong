<template>
	<view class="min-h-screen bg-gray-50 font-microsoft p-6">
		<view class="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
			<view class="max-w-7xl mx-auto px-6 py-4">
				<view class="flex items-center justify-between">
					<view class="flex items-center space-x-4">
						<i class="fas text-2xl" :class="current === 0 ? 'fa-images text-cyan-600' : 'fa-gem text-purple-600'"></i>
						<view>
							<text class="text-2xl font-bold text-gray-900">{{ tabItems[current] }}</text>
							<text class="block text-sm text-gray-500 mt-1">{{ current === 0 ? '管理小程序首页的轮播图' : '管理会员等级、折扣和升级条件' }}</text>
						</view>
					</view>
					<view>
						<button @click="handleAddNew" class="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium">
							<i class="fas fa-plus mr-2"></i>
							{{ current === 0 ? '新增轮播图' : '新增会员等级' }}
						</button>
					</view>
				</view>
			</view>
		</view>

		<view class="mb-6">
			<uni-segmented-control :current="current" :values="tabItems" @clickItem="onTabClick" style-type="button" active-color="#2563eb" />
		</view>

		<view>
			<banner-manager v-show="current === 0" ref="bannerManager" />
			<member-config v-show="current === 1" ref="memberConfig" />
		</view>
	</view>
</template>

<script>
// 1. 导入两个子组件
// (请确保子组件
import BannerManager from './banner-manager.vue';
import MemberConfig from './member-levels-config.vue';

export default {
	components: {
		BannerManager,
		MemberConfig
	},
	data() {
		return {
			current: 0,
			tabItems: ['轮播图管理', '会员等级管理']
		};
	},
	methods: {
		// 切换 Tab
		onTabClick(e) {
			if (this.current !== e.currentIndex) {
				this.current = e.currentIndex;
			}
		},
		// “新增”按钮点击事件
		handleAddNew() {
			if (this.current === 0) {
				// 2. 调用子组件 BannerManager 的 openForm 方法
				this.$refs.bannerManager.openForm();
			} else {
				// 3. 调用子组件 MemberConfig 的 openForm 方法
				this.$refs.memberConfig.openForm();
			}
		}
	}
};
</script>

<style>
/* 全局 Tailwind 样式定义 (从你原有的文件复制) 
  这些样式会应用到父组件和子组件
*/

/* 弹窗表单样式 */
.form-content {
	max-height: 70vh;
	overflow-y: auto;
}

.form-label {
	font-size: 14px;
	color: #374151;
	font-weight: 600;
	margin-bottom: 8px;
	display: block;
}

/* 引入Tailwind基础样式 */
.min-h-screen {
	min-height: 100vh;
}
.bg-gray-50 {
	background-color: #f9fafb;
}
.font-microsoft {
	font-family: 'Microsoft YaHei', sans-serif;
}
.p-6 {
	padding: 1.5rem;
}
.bg-white {
	background-color: #ffffff;
}
.shadow-sm {
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.rounded-lg {
	border-radius: 0.5rem;
}
.border {
	border-width: 1px;
}
.border-gray-200 {
	border-color: #e5e7eb;
}
.mb-6 {
	margin-bottom: 1.5rem;
}
.max-w-7xl {
	max-width: 80rem;
}
.mx-auto {
	margin-left: auto;
	margin-right: auto;
}
.px-6 {
	padding-left: 1.5rem;
	padding-right: 1.5rem;
}
.py-4 {
	padding-top: 1rem;
	padding-bottom: 1rem;
}
.flex {
	display: flex;
}
.items-center {
	align-items: center;
}
.justify-between {
	justify-content: space-between;
}
.space-x-4 > :not([hidden]) ~ :not([hidden]) {
	margin-left: 1rem;
}
.text-2xl {
	font-size: 1.5rem;
	line-height: 2rem;
}
.text-cyan-600 {
	color: #0891b2;
}
.text-purple-600 {
	color: #9333ea;
}
.font-bold {
	font-weight: 700;
}
.text-gray-900 {
	color: #111827;
}
.block {
	display: block;
}
.text-sm {
	font-size: 0.875rem;
	line-height: 1.25rem;
}
.text-gray-500 {
	color: #6b7280;
}
.mt-1 {
	margin-top: 0.25rem;
}
.py-3 {
	padding-top: 0.75rem;
	padding-bottom: 0.75rem;
}
.bg-blue-600 {
	background-color: #2563eb;
}
.text-white {
	color: #ffffff;
}
.hover\:bg-blue-700:hover {
	background-color: #1d4ed8;
}
.transition-colors {
	transition-property: background-color, border-color, color, fill, stroke;
	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	transition-duration: 150ms;
}
.text-lg {
	font-size: 1.125rem;
	line-height: 1.75rem;
}
.font-medium {
	font-weight: 500;
}
.fas {
	margin-right: 0.5rem;
}
.overflow-hidden {
	overflow: hidden;
}
.w-24 {
	width: 6rem;
}
.h-12 {
	height: 3rem;
}
.rounded {
	border-radius: 0.25rem;
}
.font-semibold {
	font-weight: 600;
}
.text-gray-800 {
	color: #1f2937;
}
.text-blue-600 {
	color: #2563eb;
}
.justify-center {
	justify-content: center;
}
.space-x-3 > :not([hidden]) ~ :not([hidden]) {
	margin-left: 0.75rem;
}
.px-3 {
	padding-left: 0.75rem;
	padding-right: 0.75rem;
}
.py-2 {
	padding-top: 0.5rem;
	padding-bottom: 0.5rem;
}
.bg-blue-500 {
	background-color: #3b82f6;
}
.hover\:bg-blue-600:hover {
	background-color: #2563eb;
}
.bg-red-500 {
	background-color: #ef4444;
}
.hover\:bg-red-600:hover {
	background-color: #dc2626;
}
.space-y-4 > :not([hidden]) ~ :not([hidden]) {
	margin-top: 1rem;
}
.p-4 {
	padding: 1rem;
}
.grid {
	display: grid;
}
.grid-cols-2 {
	grid-template-columns: repeat(2, minmax(0, 1fr));
}
.gap-4 {
	gap: 1rem;
}
.text-green-600 {
	color: #059669;
}

::v-deep .uni-popup__wrapper {
	display: block !important;
}

::v-deep .uni-popup-dialog {
	width: 900px !important;
	max-width: 90vw !important;
	margin: 0 auto 0;
}

/* 确保 uni-table 样式正确 */
.uni-table {
	width: 100% !important;
}
</style>
