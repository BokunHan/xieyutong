<template>
	<view class="main-container">
		<view class="global-header">
			<view class="header-left">
				<text class="page-title">运营中心 · {{ currentTitle }}</text>
			</view>

			<view class="view-switcher">
				<view class="switch-item" :class="{ active: currentView === 'scheduler' }" @click="switchView('scheduler')">调度日历</view>
				<view class="switch-item" :class="{ active: currentView === 'dashboard' }" @click="switchView('dashboard')">数据大盘</view>
				<view class="switch-item" :class="{ active: currentView === 'assignment' }" @click="switchView('assignment')">智能分单</view>
				<view class="switch-item" :class="{ active: currentView === 'sales-view' }" @click="currentView = 'sales-view'">销售视图</view>
				<view class="switch-item" :class="{ active: currentView === 'attendant-view' }" @click="currentView = 'attendant-view'">管家视图</view>
				<view class="switch-item" :class="{ active: currentView === 'guide-view' }" @click="currentView = 'guide-view'">私导视图</view>
				<!-- <view class="switch-item" :class="{ active: currentView === 'customer-management' }" @click="currentView = 'customer-management'">客户管理</view> -->
				<view class="switch-item" :class="{ active: currentView === 'performance-management' }" @click="currentView = 'performance-management'">考核管理</view>
				<view class="switch-item" :class="{ active: currentView === 'management-configs' }" @click="currentView = 'management-configs'">系统设置</view>
			</view>
		</view>

		<view class="content-viewport">
			<scheduler v-if="currentView === 'scheduler'" ref="schedulerRef"></scheduler>
			<dashboard v-if="currentView === 'dashboard'" ref="dashboardRef"></dashboard>
			<assignment v-if="currentView === 'assignment'" ref="assignmentRef"></assignment>
			<sales-view v-if="currentView === 'sales-view'" ref="sales-viewRef" :target-id="targetId"></sales-view>
			<attendant-view v-if="currentView === 'attendant-view'" ref="attendant-viewRef" :target-id="targetId"></attendant-view>
			<guide-view v-if="currentView === 'guide-view'" ref="guide-viewRef" :target-id="targetId"></guide-view>
			<!-- <customer-management v-if="currentView === 'customer-management'" ref="customer-managementRef"></customer-management> -->
			<performance-management v-if="currentView === 'performance-management'" ref="performance-managementRef" @switch-view="handleViewSwitch"></performance-management>
			<management-configs v-if="currentView === 'management-configs'" ref="management-configsRef"></management-configs>
		</view>
	</view>
</template>

<script>
import Scheduler from './scheduler.vue';
import Dashboard from './dashboard.vue';
import Assignment from './assignment.vue';
import SalesView from './sales-view.vue';
import AttendantView from './attendant-view.vue';
import GuideView from './guide-view.vue';
// import CustomerManagement from './customer-management.vue';
import PerformanceManagement from './performance-management.vue';
import ManagementConfigs from './management-configs.vue';

export default {
	components: { Scheduler, Dashboard, Assignment, SalesView, AttendantView, GuideView, PerformanceManagement, ManagementConfigs },
	data() {
		return {
			currentView: 'scheduler',
			targetId: null,
			titleMap: {
				scheduler: '调度日历',
				dashboard: '数据大盘',
				assignment: '智能分单',
				'sales-view': '销售视图',
				'attendant-view': '管家视图',
				'guide-view': '私导视图',
				// 'customer-management': '客户管理',
				'performance-management': '考核管理',
				'management-configs': '系统设置'
			}
		};
	},
	computed: {
		currentTitle() {
			return this.titleMap[this.currentView] || '运营中心';
		}
	},
	methods: {
		switchView(view) {
			this.currentView = view;
			this.targetId = null;
		},
		// 处理子组件请求切换视图的事件
		handleViewSwitch(payload) {
			// payload 格式: { view: 'guide-view', id: 'xxx' }
			this.targetId = payload.id;
			this.currentView = payload.view;
		}
	}
};
</script>

<style lang="scss">
/* 简单的布局样式 */
.main-container {
	height: 88.4vh;
	display: flex;
	flex-direction: column;
	background: #f5f7fa;
}
.global-header {
	height: 60px;
	background: #fff;
	border-bottom: 1px solid #e5e7eb;
	display: flex;
	align-items: center;
	padding: 0 20px;
	justify-content: space-between;
	flex-shrink: 0;

	.page-title {
		font-size: 18px;
		font-weight: bold;
		color: #1f2937;
	}

	.view-switcher {
		display: flex;
		background: #f3f4f6;
		padding: 3px;
		border-radius: 6px;
		.switch-item {
			padding: 6px 12px;
			font-size: 13px;
			cursor: pointer;
			color: #666;
			&.active {
				background: #fff;
				color: #3b82f6;
				font-weight: 500;
				box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
				border-radius: 4px;
			}
		}
	}
}
.content-viewport {
	flex: 1;
	overflow: hidden;
	position: relative;
}
</style>
