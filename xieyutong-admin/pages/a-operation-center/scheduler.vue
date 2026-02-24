<template>
	<view class="scheduler-container" :style="{ '--cell-width': cellWidth + 'px' }">
		<view class="dashboard-panel" v-if="!isLoading && currentView === 'gantt'">
			<view class="control-group">
				<view class="date-picker-wrapper">
					<uni-datetime-picker type="date" v-model="startDateStr" @change="onDateChange" :clear-icon="false" :border="false" />
				</view>

				<view class="zoom-wrapper">
					<uni-icons type="minus" size="16" color="#666" @click="changeZoom(-10)"></uni-icons>
					<slider class="zoom-slider" :value="cellWidth" min="30" max="120" activeColor="#3b82f6" block-size="12" @changing="onZoomSliderChange" @change="onZoomSliderChange" />
					<uni-icons type="plus" size="16" color="#666" @click="changeZoom(10)"></uni-icons>
				</view>
			</view>

			<view class="status-card adaptive-card">
				<view class="chart-container">
					<view class="donut-chart guide-chart" :style="dashboardStats.guide.chartStyle">
						<view class="donut-hole">
							<text class="chart-value">{{ dashboardStats.guide.todayBusy }}</text>
							<text class="chart-label">今日忙</text>
						</view>
					</view>
				</view>
				<view class="status-info">
					<view class="info-text-col">
						<text class="info-title">私导带团状态</text>
						<view class="info-row">
							<view class="dot busy-guide"></view>
							<text class="mr-3">今日: {{ dashboardStats.guide.todayBusy }}人</text>
							<text>明日: {{ dashboardStats.guide.tomorrowBusy }}人</text>
						</view>
						<view class="info-row">
							<view class="dot future-dot"></view>
							<text class="mr-2">共计: {{ dashboardStats.guide.total }}人</text>
							<text>7日内: {{ dashboardStats.guide.sevenDaysBusy }}人</text>
						</view>
					</view>

					<view class="unassigned-btn" @click="toggleGuideFilter" :class="{ active: isGuideFilterActive }">
						<text class="label">待分配</text>
						<text class="value">{{ unassignedGuideOrders.length }}</text>
					</view>
				</view>
			</view>

			<view class="status-card adaptive-card">
				<view class="chart-container">
					<view class="donut-chart attendant-chart" :style="dashboardStats.attendant.chartStyle">
						<view class="donut-hole">
							<text class="chart-value">{{ dashboardStats.attendant.inProgress }}</text>
							<text class="chart-label">进行中</text>
						</view>
					</view>
				</view>
				<view class="status-info">
					<view class="info-text-col">
						<text class="info-title">管家订单统计</text>
						<view class="info-row">
							<view class="dot busy-attendant"></view>
							<text class="mr-2">进行中: {{ dashboardStats.attendant.inProgress }}</text>
							<text class="mr-2">本月待出行: {{ dashboardStats.attendant.upcoming }}</text>
							<text>本月已结束: {{ dashboardStats.attendant.completed }}</text>
						</view>
						<view class="info-row">
							<!-- <view class="dot future-dot"></view> -->
							<text class="mr-2">今日行中任务</text>
							<text class="mr-2">已执行: {{ dailyTaskStats.executed_count || 0 }}</text>
							<text>待执行: {{ dailyTaskStats.pending_count || 0 }}</text>
						</view>
					</view>

					<view class="unassigned-btn" @click="showAttendantUnassigned = !showAttendantUnassigned" :class="{ active: showAttendantUnassigned }">
						<text class="label">待分配</text>
						<text class="value">{{ unassignedAttendantOrders.length }}</text>
					</view>
				</view>
			</view>

			<view class="status-card adaptive-card">
				<view class="chart-container">
					<view class="donut-chart model-chart" :style="modelStats.chartStyle">
						<view class="donut-hole">
							<text class="chart-value">{{ modelStats.totalActive }}</text>
							<text class="chart-label">车在途</text>
						</view>
					</view>
				</view>
				<view class="status-info">
					<text class="info-title">今日运行车型</text>
					<view class="scroll-legend">
						<view class="info-row" v-for="(item, idx) in modelStats.legend" :key="idx">
							<view class="dot" :style="{ backgroundColor: item.color }"></view>
							<text>{{ item.name }}: {{ item.count }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="gantt-viewport" v-if="!isLoading && currentView === 'gantt'" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" @mousedown="onMouseDown">
			<view class="corner-fixed" @click="focusMode = !focusMode">
				<view class="focus-btn" :class="{ active: focusMode }">
					<uni-icons :type="focusMode ? 'checkbox-filled' : 'circle'" :color="focusMode ? '#fff' : '#666'" size="16"></uni-icons>
					<text class="ml-1">仅看选中</text>
				</view>
				<!-- <button @click="runBatchFix" size="mini" type="warn">批量补全信息</button> -->
			</view>

			<view class="header-viewport">
				<view class="header-content" :style="{ transform: `translateX(${-scrollX}px)` }">
					<view
						class="date-cell"
						v-for="(day, index) in days"
						:key="index"
						:class="{ 'is-weekend': day.isWeekend, 'is-today': day.isToday, 'is-monday': day.weekDay === '一' }"
						@click="onDateClick(day)">
						<text v-if="day.monthLabel" class="month-tag">{{ day.monthLabel }}</text>

						<text class="day-num">{{ day.dateNum }}</text>
						<text class="week-num">{{ day.weekDay }}</text>
					</view>
				</view>
			</view>

			<view class="sidebar-viewport">
				<view class="sidebar-content" :style="{ transform: `translateY(${-scrollY}px)` }">
					<view class="group-title sortable-header">
						<view class="flex items-center" @click="toggleAttendantSelectAll">
							<view class="check-box-mini mr-1">
								<uni-icons :type="isAllAttendantsSelected ? 'checkbox-filled' : 'circle'" :color="isAllAttendantsSelected ? '#3b82f6' : '#999'" size="16"></uni-icons>
							</view>
							<text>管家列表 ({{ sortedAttendants.length }})</text>
						</view>

						<text class="sort-icon" @click.stop="toggleSort">⇅ {{ sortType === 'score' ? '评分' : '单量' }}</text>
					</view>

					<view
						class="resource-item"
						v-for="att in visibleAttendants"
						:key="'sidebar-a-' + att._id"
						:style="{ height: att.renderHeight + 'px' }"
						@click="toggleAttendantSelect(att)">
						<view class="flex-row">
							<view class="check-box" @click.stop="toggleAttendantSelect(att)">
								<uni-icons :type="att.isSelected ? 'checkbox-filled' : 'circle'" :color="att.isSelected ? att.color : '#ddd'" size="18"></uni-icons>
							</view>

							<view class="info-col">
								<view class="name-row">
									<text class="name">{{ truncateName(att.real_name) }}</text>
									<text class="score-tag" :style="{ borderColor: att.color, color: att.color }">{{ att.total_score }}</text>
								</view>
								<view class="stats-row">
									<!-- <text title="当月总团数">总{{ att.stats.total }}</text>
									<text class="mx-1">|</text> -->
									<text>当月团数：</text>
									<text>出发{{ att.stats.start }}</text>
									<text class="mx-1">|</text>
									<text>结束{{ att.stats.end }}</text>
								</view>
								<view class="stats-row" style="margin-top: 2px">
									<text>当月服务：{{ att.stats.days || 0 }}天</text>
								</view>
							</view>
						</view>
					</view>

					<template v-if="showAttendantUnassigned">
						<view class="group-title unassigned-title sortable-header">
							<view class="flex items-center" @click="toggleAttendantUnassignedSelectAll">
								<view class="check-box-mini mr-1">
									<uni-icons :type="isAttendantUnassignedAllSelected ? 'checkbox-filled' : 'circle'" color="#dc2626" size="16"></uni-icons>
								</view>
								<text>管家待分配 ({{ unassignedAttendantOrders.length }})</text>
							</view>
							<uni-icons type="closeempty" size="14" color="#d1d5db" @click.stop="showAttendantUnassigned = false"></uni-icons>
						</view>
						<view class="resource-item unassigned-row" :style="{ height: unassignedAttendantLayoutHeight + 'px' }">
							<text class="text-sm text-gray-500">右键详情中分配</text>
						</view>
					</template>
				</view>
			</view>

			<view class="grid-viewport">
				<view class="grid-content" :style="{ transform: `translate(${-scrollX}px, ${-scrollY}px)` }">
					<view class="group-title-placeholder"></view>
					<view class="timeline-row" v-for="att in visibleAttendants" :key="'row-a-' + att._id" :style="{ height: att.renderHeight + 'px' }">
						<view class="grid-bg">
							<view class="grid-cell" v-for="(day, index) in days" :key="index" :class="{ 'is-weekend': day.isWeekend, 'is-monday': day.weekDay === '一' }"></view>
						</view>

						<template v-for="(item, idx) in att.renderItems">
							<view
								v-if="item.type === 'bar' && (!focusMode || selectedAttendantOrderIds.includes(item.original.order_id))"
								class="schedule-bar"
								:class="{ 'is-selected-order': selectedAttendantOrderIds.includes(item.original.order_id) }"
								:style="item.style"
								@click.stop="toggleAttendantOrderSelect(item.original)"
								@longpress.stop="showOrderDetails(item.original)"
								@contextmenu.prevent="showOrderDetails(item.original)"
								@mouseenter="handleTooltipMove($event, item.text || item.label)"
								@mouseleave="handleTooltipLeave"
								@dblclick.stop="enableEdit(item)">
								<input
									v-if="editingId === item.original.order_id && item.isMainBar"
									class="bar-edit-input"
									v-model="editingText"
									:focus="true"
									@blur="saveCustomText(item)"
									@confirm="saveCustomText(item)"
									@click.stop
									@touchstart.stop
									@touchend.stop
									@mousedown.stop
									@touchmove.stop />
								<text v-else class="bar-text">{{ item.text }}</text>
							</view>
							<view
								v-else-if="item.type === 'marker' && (!focusMode || selectedAttendantOrderIds.includes(item.original.order_id))"
								class="schedule-marker"
								:class="[item.subType, { 'is-selected-order': selectedAttendantOrderIds.includes(item.original.order_id) }]"
								:style="item.style"
								@click.stop="toggleAttendantOrderSelect(item.original)"
								@longpress.stop="showOrderDetails(item.original)"
								@contextmenu.prevent="showOrderDetails(item.original)"
								@mouseenter="handleTooltipMove($event, item.text || item.label)"
								@mouseleave="handleTooltipLeave"
								@dblclick.stop="handleMarkerDblClick(item)">
								<text class="marker-text">{{ item.label }}</text>
							</view>
						</template>
					</view>

					<template v-if="showAttendantUnassigned">
						<view class="group-title-placeholder"></view>
						<view class="timeline-row" v-if="!focusMode || isUnassignedSelected || selectedUnassignedIds.length > 0" :style="{ height: unassignedAttendantLayoutHeight + 'px' }">
							<view class="grid-bg">
								<view class="grid-cell" v-for="(day, index) in days" :key="index" :class="{ 'is-weekend': day.isWeekend }"></view>
							</view>
							<template v-for="(item, idx) in unassignedAttendantRenderItems">
								<view
									v-if="item.type === 'bar'"
									class="schedule-bar unassigned-bar"
									:class="{ 'is-selected-order': selectedUnassignedIds.includes(item.original.order_id) }"
									:style="item.style"
									@click.stop="toggleUnassignedOrderSelect(item.original)"
									@longpress.stop="showOrderDetails(item.original)"
									@contextmenu.prevent="showOrderDetails(item.original)"
									@mouseenter="handleTooltipMove($event, item.text || item.label)"
									@mouseleave="handleTooltipLeave">
									<text class="bar-text">{{ item.text }}</text>
								</view>
								<view
									v-else-if="item.type === 'marker'"
									class="schedule-marker"
									:class="[item.subType, { 'is-selected-order': selectedUnassignedIds.includes(item.original.order_id) }]"
									:style="item.style"
									@click.stop="toggleUnassignedOrderSelect(item.original)"
									@longpress.stop="showOrderDetails(item.original)"
									@contextmenu.prevent="showOrderDetails(item.original)"
									@mouseenter="handleTooltipMove($event, item.text || item.label)"
									@mouseleave="handleTooltipLeave">
									<text class="marker-text">{{ item.label }}</text>
								</view>
							</template>
						</view>
					</template>
				</view>
			</view>
		</view>

		<view class="stats-wrapper" v-if="!isLoading && currentView === 'stats'">
			<scroll-view scroll-y="true" class="stats-scroll">
				<view class="stats-container">
					<view class="stat-card">
						<view class="card-header">
							<text class="card-title">详细资源列表 (含饱和度)</text>
							<text class="card-subtitle">请在左侧"调度排期"视图侧边栏查看可视化饱和度</text>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<view v-if="isLoading" class="loading-state">
			<text>数据加载与计算中...</text>
		</view>

		<uni-popup ref="popup" type="bottom" background-color="#fff">
			<view class="popup-content" v-if="selectedOrder">
				<view class="popup-header">行程详情 & 调度分配</view>

				<view class="popup-row">
					<text class="label">订单号：</text>
					<text class="value">{{ selectedOrder.order_id }}</text>
				</view>
				<view class="popup-row">
					<text class="label">订单等级：</text>
					<text class="value">{{ selectedOrder.rank ? selectedOrder.rank + '级' : 'D级' }}</text>
				</view>

				<view class="popup-row">
					<text class="label">销售姓名：</text>
					<text class="value">{{ selectedOrder.sales_name || selectedOrder.sales_name_display || '未关联' }}</text>
				</view>
				<view class="popup-row">
					<text class="label">行程名称：</text>
					<text class="value">{{ selectedOrder.title }}</text>
				</view>

				<view class="popup-row">
					<text class="label">客人信息：</text>
					<text class="value">{{ getGuestInfoStr(selectedOrder) }}</text>
				</view>

				<view class="popup-row">
					<text class="label">客户备注：</text>
					<text class="value" style="color: #f59e0b">{{ selectedOrder.customer_remarks || '无' }}</text>
				</view>

				<view class="popup-row">
					<text class="label">行程时间：</text>
					<text class="value">{{ formatDate(selectedOrder.start) }} ({{ selectedOrder.total_days }}天)</text>
				</view>

				<view class="popup-divider"></view>

				<view class="assign-section">
					<view class="assign-item">
						<text class="assign-label">分配管家</text>
						<custom-picker
							:options="assignmentOptions.attendants"
							:value="tempAssignment.attendantObj"
							label-key="displayLabel"
							value-key="id"
							@change="onAttendantChange"></custom-picker>
					</view>

					<view class="assign-item">
						<text class="assign-label">分配私导</text>
						<custom-picker :options="assignmentOptions.guides" :value="tempAssignment.guideObj" label-key="displayLabel" value-key="id" @change="onGuideChange"></custom-picker>
					</view>
				</view>

				<view class="tips-box">
					<uni-icons type="info" size="14" color="#f97316" style="margin-right: 4px"></uni-icons>
					<text>注：列表中显示本订单出发日所属月份内的服务团数和天数</text>
				</view>

				<view class="btn-group">
					<button class="save-btn" @click="saveOrderAssignment">保存并分配</button>
					<button class="close-btn" @click="$refs.popup.close()">取消</button>
				</view>
			</view>
		</uni-popup>

		<uni-popup ref="potalaPopup" type="center" :mask-click="false" background-color="#fff">
			<view class="potala-popup-content" style="width: 300px; padding: 20px; border-radius: 8px">
				<view style="font-size: 16px; font-weight: bold; margin-bottom: 15px; text-align: center">调整布达拉宫日期</view>

				<view v-if="potalaMoveData.order" style="font-size: 13px; color: #666; margin-bottom: 15px">
					<view>当前订单：{{ potalaMoveData.order.title }}</view>
					<view style="margin-top: 5px">
						当前位置：
						<text style="color: #d97706; font-weight: bold">第 {{ potalaMoveData.currentDay }} 天</text>
					</view>
				</view>

				<view style="margin-bottom: 10px; font-size: 12px; color: #333">请选择新的日期:</view>

				<view class="day-selector" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px">
					<view
						v-for="d in potalaMoveData.availableDays"
						:key="d"
						@click="togglePotalaDay(d)"
						:style="{
							width: '36px',
							height: '36px',
							lineHeight: '36px',
							textAlign: 'center',
							borderRadius: '4px',
							fontSize: '14px',
							background: potalaMoveData.targetDay === d ? '#3b82f6' : '#f3f4f6',
							color: potalaMoveData.targetDay === d ? '#fff' : '#333',
							border: potalaMoveData.targetDay === d ? '1px solid #2563eb' : '1px solid #e5e7eb',
							transition: 'all 0.2s'
						}">
						D{{ d }}
					</view>
				</view>

				<view style="display: flex; justify-content: space-between">
					<button size="mini" type="default" @click="$refs.potalaPopup.close()">取消</button>
					<button size="mini" :type="potalaMoveData.targetDay ? 'primary' : 'warn'" @click="confirmPotalaMove">
						{{ potalaMoveData.targetDay ? '确认调整' : '移除标记' }}
					</button>
				</view>
			</view>
		</uni-popup>

		<view class="global-tooltip" v-if="tooltip.visible" :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }" :class="{ 'align-left': tooltip.isRightSide }">
			{{ tooltip.text }}
		</view>

		<uni-popup ref="dailyPopup" type="bottom" background-color="#fff" :mask-click="false" @maskClick="onPopupMaskClick">
			<daily-manifest
				v-if="dailyPopupData.dateTs"
				:dateTs="dailyPopupData.dateTs"
				:rawOrders="dailyPopupData.orders"
				:staffMap="staffInfoMap"
				:vehicleMap="vehicleInfoMap"
				@close="closeDailyPopup" />
		</uni-popup>

		<uni-popup ref="colorPopup" type="center" background-color="#fff">
			<view class="color-popup-content" style="padding: 20px; width: 300px; border-radius: 8px">
				<view style="font-size: 16px; font-weight: bold; margin-bottom: 15px; text-align: center">选择订单颜色</view>
				<view style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center">
					<view
						v-for="(c, index) in presetColors"
						:key="index"
						@click="selectOrderColor(c)"
						:style="{
							backgroundColor: c,
							width: '40px',
							height: '40px',
							borderRadius: '50%',
							border: '2px solid #fff',
							boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
							transform: editingColor === c ? 'scale(1.1)' : 'scale(1)',
							border: editingColor === c ? '2px solid #333' : '2px solid #fff'
						}"></view>
					<view
						@click="selectOrderColor(null)"
						style="
							width: 40px;
							height: 40px;
							border-radius: 50%;
							border: 1px dashed #999;
							display: flex;
							align-items: center;
							justify-content: center;
							font-size: 10px;
							color: #666;
						">
						默认
					</view>
				</view>
				<view style="margin-top: 20px; text-align: center">
					<text style="font-size: 12px; color: #999">点击颜色直接应用</text>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
import { toRaw } from 'vue';
import DailyManifest from './daily-manifest.vue';

const db = uniCloud.database();
const operationCenter = uniCloud.importObject('a-operation-center');
const rpa = uniCloud.importObject('a-task-rpa');
const attendantNotifier = uniCloud.importObject('attendant-notifier');

const MODEL_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];
// const PALETTE = ['#3b82f6', '#ef4444', '#f97316', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const PALETTE = ['#10b981', '#059669', '#34d399', '#047857', '#6ee7b7', '#065f46'];
const TRACK_HEIGHT = 28;

export default {
	components: {
		DailyManifest
	},
	data() {
		const now = new Date();
		const year = now.getFullYear();
		const month = (now.getMonth() + 1).toString().padStart(2, '0');
		const day = now.getDate().toString().padStart(2, '0');
		const todayStr = `${year}-${month}-${day}`;

		return {
			isLoading: true,
			currentView: 'gantt',
			startDateStr: todayStr,
			startDateTs: 0,
			days: [],

			// 待分配数据拆分与显示控制
			unassignedGuideOrders: [],
			unassignedAttendantOrders: [],
			showGuideUnassigned: false,
			showAttendantUnassigned: false,
			isGuideFilterActive: false,

			salesMap: {}, // 存储 order_id -> 销售姓名 的映射
			salesUserMap: {}, // 存储 sales_id -> 销售姓名 的映射
			guides: [],
			attendants: [],
			vehicles: [],

			assignmentOptions: {
				guides: [],
				attendants: []
			},
			tempAssignment: {
				attendantId: '',
				attendantName: '',
				guideId: '',
				guideName: ''
			},

			serverAttendantStats: { completed: 0 },
			attendantListStats: {},

			occupancyData: {
				guides: {},
				attendants: {},
				vehicles: {}
			},
			selectedOrder: null,
			unassignedOrders: [],
			unassignedLayoutHeight: 60,
			unassignedRenderItems: [],
			isUnassignedSelected: false,
			selectedUnassignedIds: [],
			selectedAttendantOrderIds: [],
			processedAttendants: [],

			// 布局计算相关
			unassignedGuideLayoutHeight: 0,
			unassignedAttendantLayoutHeight: 0,
			unassignedGuideRenderItems: [],
			unassignedAttendantRenderItems: [],
			dailyTaskStats: { executed_count: 0, pending_count: 0 },

			// 交互状态
			focusMode: false, // 仅看选中
			sortType: 'score', // score | total
			editingId: null, // 当前正在编辑的订单ID
			editingText: '', // 编辑中的文字

			cellWidth: 60,
			SIDEBAR_WIDTH: 180,

			scrollX: 0,
			scrollY: 0,
			isDragging: false,
			dragStartX: 0,
			dragStartY: 0,
			lastX: 0,
			lastY: 0,
			viewportWidth: 0,
			viewportHeight: 0,
			tooltip: { visible: false, text: '', x: 0, y: 0, isRightSide: false },
			windowWidth: 0,

			dailyPopupData: {
				dateTs: 0,
				orders: []
			},

			// 布达拉宫移动状态数据
			potalaMoveData: {
				order: null,
				currentDay: 0,
				targetDay: 0,
				availableDays: []
			},

			// 预设颜色盘 (Tailwind 风格)
			presetColors: [
				'#ef4444', // Red 500
				'#f97316', // Orange 500
				'#f59e0b', // Amber 500
				'#84cc16', // Lime 500
				'#10b981', // Emerald 500
				'#06b6d4', // Cyan 500
				'#3b82f6', // Blue 500
				'#6366f1', // Indigo 500
				'#8b5cf6', // Violet 500
				'#d946ef', // Fuchsia 500
				'#ec4899', // Pink 500
				'#64748b' // Slate 500
			],
			editingColorOrder: null, // 当前正在修改颜色的订单对象
			editingColor: '' // 当前选中的颜色
		};
	},
	computed: {
		// 计算后的管家列表（含饱和度 + 排序）
		sortedAttendants() {
			// 1. 排序
			let list = [...this.processedAttendants];
			if (this.sortType === 'score') {
				list.sort((a, b) => b.total_score - a.total_score);
			} else {
				list.sort((a, b) => b.stats.total - a.stats.total);
			}
			return list;
		},
		// 最终显示的管家（受Focus Mode影响）
		visibleAttendants() {
			if (this.focusMode) {
				// 筛选选中的，并把它们聚拢在一起
				return this.sortedAttendants.filter((a) => a.isSelected);
			}
			return this.sortedAttendants;
		},
		isAllSelected() {
			return this.processedAttendants.length > 0 && this.processedAttendants.every((a) => a.isSelected);
		},
		isAllAttendantsSelected() {
			return this.processedAttendants.length > 0 && this.processedAttendants.every((a) => a.isSelected);
		},

		// 仪表盘统计：私导
		dashboardStats() {
			const now = new Date();
			// 真实世界的"今天"（用于判断进行中/已结束状态）
			const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
			const tomorrowStart = todayStart + 24 * 3600 * 1000;

			// --- 计算当前选择日期所在的月份范围 ---
			const selDate = this.startDateStr ? new Date(this.startDateStr) : new Date();
			// 当月1号 00:00:00
			const monthStartTs = new Date(selDate.getFullYear(), selDate.getMonth(), 1).getTime();
			// 下个月1号 00:00:00 (作为当月结束的边界)
			const nextMonthStartTs = new Date(selDate.getFullYear(), selDate.getMonth() + 1, 1).getTime();

			const calcStats = (role, idList) => {
				let todayCount = 0;
				let tomorrowCount = 0;
				let sevenDaysCount = 0;

				idList.forEach((id) => {
					if (this.checkIsBusy(id, role, todayStart)) todayCount++;
					if (this.checkIsBusy(id, role, tomorrowStart)) tomorrowCount++;
					if (this.checkIsBusy(id, role, todayStart, 7)) sevenDaysCount++;
				});

				const total = idList.length || 1;
				const pct = (todayCount / total) * 100;
				const color = role === 'guide' ? '#3b82f6' : '#8b5cf6'; // 蓝 vs 紫

				return {
					todayBusy: todayCount,
					total: total,
					tomorrowBusy: tomorrowCount,
					sevenDaysBusy: sevenDaysCount,
					chartStyle: { background: `conic-gradient(${color} 0% ${pct}%, #f3f4f6 ${pct}% 100%)` }
				};
			};

			const guideIds = this.guides.map((g) => g.user_id);

			// --- 管家：基于订单状态统计 ---
			let attInProgress = 0;
			let attUpcoming = 0;
			let attCompleted = this.serverAttendantStats.completed;

			const processedOrders = new Set();

			if (this.occupancyData.attendants) {
				Object.values(this.occupancyData.attendants).forEach((orderList) => {
					if (!Array.isArray(orderList)) return;
					orderList.forEach((order) => {
						if (processedOrders.has(order.order_id)) return;
						const tripEnd = order.end + 24 * 3600 * 1000; // 结束时间是当天的24点
						const isInSelectedMonth = order.start < nextMonthStartTs && tripEnd > monthStartTs;
						if (!isInSelectedMonth) return;

						processedOrders.add(order.order_id);

						// 1. 进行中: 行程时间段包含“今天” (Start < Tomorrow AND End > Today)
						if (order.start < tomorrowStart && tripEnd > todayStart) {
							attInProgress++;
						}
						// 2. 待出行: 开始时间 >= 明天
						else if (order.start >= tomorrowStart) {
							attUpcoming++;
						}
						// 3. 已结束：移除本地计算，防止数据不全
					});
				});
			}

			// 计算饼图比例 (以当前加载的所有相关订单为分母)
			const totalAttOrders = attInProgress + attUpcoming + attCompleted || 1;
			const attPct = (attInProgress / totalAttOrders) * 100;
			const attColor = '#8b5cf6'; // 紫色

			return {
				guide: calcStats('guide', guideIds),
				attendant: {
					inProgress: attInProgress,
					upcoming: attUpcoming,
					completed: attCompleted,
					tasksToday: this.dailyTaskStats.executed_count || 0, // [新增] 任务数
					chartStyle: { background: `conic-gradient(${attColor} 0% ${attPct}%, #f3f4f6 ${attPct}% 100%)` }
				}
			};
		},

		// 车型统计计算属性
		modelStats() {
			const now = new Date();
			const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
			const todayEnd = todayStart + 24 * 3600 * 1000;

			const modelCounts = {};
			let totalActive = 0;

			// 遍历所有车辆的排期
			Object.keys(this.occupancyData.vehicles).forEach((vehicleId) => {
				const schedules = this.occupancyData.vehicles[vehicleId];
				// 检查今天是否在运
				const isRunningToday = schedules.some((s) => {
					const tripEnd = s.end + 24 * 3600 * 1000;
					return Math.max(todayStart, s.start) < Math.min(todayEnd, tripEnd);
				});

				if (isRunningToday) {
					totalActive++;
					// 查找车型
					const car = this.vehicles.find((v) => v._id === vehicleId);
					const model = car ? car.model : '未知车型';
					modelCounts[model] = (modelCounts[model] || 0) + 1;
				}
			});

			let arr = Object.keys(modelCounts).map((key) => ({ name: key, count: modelCounts[key] }));
			arr.sort((a, b) => b.count - a.count);

			let gradientStr = '';
			let currentPct = 0;
			const legend = [];

			arr.forEach((item, index) => {
				const color = MODEL_COLORS[index % MODEL_COLORS.length];
				const pct = (item.count / totalActive) * 100;
				const nextPct = currentPct + pct;
				gradientStr += `${color} ${currentPct}% ${nextPct}%, `;
				currentPct = nextPct;
				legend.push({ name: item.name, count: item.count, color: color });
			});

			const styleBg = totalActive > 0 ? `conic-gradient(${gradientStr.slice(0, -2)})` : '#f3f4f6';

			return {
				totalActive,
				legend,
				chartStyle: { background: styleBg }
			};
		},

		staffInfoMap() {
			const map = {};
			this.guides.forEach((g) => (map[g.user_id] = g));
			this.attendants.forEach((a) => (map[a._id] = a));
			return map;
		},
		vehicleInfoMap() {
			const map = {};
			this.vehicles.forEach((v) => (map[v._id] = v));
			return map;
		},

		// 私导待分配全选状态
		isGuideUnassignedAllSelected() {
			if (this.unassignedGuideOrders.length === 0) return false;
			return this.unassignedGuideOrders.every((o) => this.selectedUnassignedIds.includes(o.order_id));
		},

		// 管家待分配全选状态
		isAttendantUnassignedAllSelected() {
			if (this.unassignedAttendantOrders.length === 0) return false;
			return this.unassignedAttendantOrders.every((o) => this.selectedUnassignedIds.includes(o.order_id));
		}
	},
	mounted() {
		const sys = uni.getSystemInfoSync();
		this.windowWidth = sys.windowWidth;
		this.viewportWidth = this.windowWidth - this.SIDEBAR_WIDTH;
		this.viewportHeight = sys.windowHeight - 200;
		this.initData();
	},
	watch: {
		// 监听聚焦模式切换
		focusMode() {
			this.refreshAllLayouts();
		},
		// 监听选中ID变化 (深度监听数组)
		selectedUnassignedIds: {
			handler() {
				if (this.focusMode) {
					this.refreshAllLayouts();
				}
			},
			deep: true
		}
	},
	methods: {
		toggleAttendantSelect(att) {
			// 1. 切换管家自身的选中状态 (控制侧边栏勾选框和行显示)
			att.isSelected = !att.isSelected;

			// 获取该管家名下的所有订单数据
			const attendantOrders = this.occupancyData.attendants[att._id] || [];
			const orderIds = attendantOrders.map((o) => o.order_id);

			if (att.isSelected) {
				// 2. 如果是“选中”：把他的所有订单ID加到 selectedAttendantOrderIds (去重)
				// 使用 Set 去重，防止已经是红色边框的订单被重复添加
				this.selectedAttendantOrderIds = [...new Set([...this.selectedAttendantOrderIds, ...orderIds])];
			} else {
				// 3. 如果是“取消”：从 selectedAttendantOrderIds 中移除他的订单ID
				this.selectedAttendantOrderIds = this.selectedAttendantOrderIds.filter((id) => !orderIds.includes(id));
			}
		},
		toggleUnassignedSelect() {
			// 1. 切换 Header 的勾选状态
			this.isUnassignedSelected = !this.isUnassignedSelected;

			// 2. 同步数据：根据 Header 的新状态，更新“选中ID数组”
			if (this.isUnassignedSelected) {
				// 变为选中 -> 将所有待分配订单的 ID 放入数组
				this.selectedUnassignedIds = this.unassignedOrders.map((order) => order.order_id);
			} else {
				// 变为未选 -> 清空数组
				this.selectedUnassignedIds = [];
			}
		},
		toggleAttendantSelectAll() {
			// 目标状态：如果当前不是全选，则变为全选；否则变为全不选
			const targetState = !this.isAllAttendantsSelected;

			// 1. 更新所有管家的 isSelected 状态
			this.processedAttendants.forEach((a) => (a.isSelected = targetState));

			// 2. 同步更新所有订单 ID
			if (targetState) {
				// 变为全选：收集所有管家的所有订单 ID
				let allOrderIds = [];
				this.processedAttendants.forEach((att) => {
					const orders = this.occupancyData.attendants[att._id] || [];
					orders.forEach((o) => allOrderIds.push(o.order_id));
				});
				// 更新数组 (去重)
				this.selectedAttendantOrderIds = [...new Set([...this.selectedAttendantOrderIds, ...allOrderIds])];
			} else {
				// 变为全不选：清空管家订单选中数组
				// (注：如果你希望保留待分配区的选中，这里只清空管家相关的；如果想清空所有，直接设为 [])
				this.selectedAttendantOrderIds = [];
			}
		},
		// 未分配订单的单选逻辑
		toggleUnassignedOrderSelect(order) {
			const id = order.order_id;
			const idx = this.selectedUnassignedIds.indexOf(id);
			if (idx > -1) {
				this.selectedUnassignedIds.splice(idx, 1);
			} else {
				this.selectedUnassignedIds.push(id);
			}
		},

		// 切换私导待分配筛选模式
		toggleGuideFilter() {
			this.isGuideFilterActive = !this.isGuideFilterActive;

			if (this.isGuideFilterActive) {
				// --- 开启筛选 ---

				// 1. 强制开启聚焦模式
				this.focusMode = true;

				// 2. 找出所有“未分配私导”的订单ID
				const targetIds = [];
				if (this.occupancyData.attendants) {
					Object.values(this.occupancyData.attendants)
						.flat()
						.forEach((order) => {
							// 检查是否有 guide
							const hasGuide = order.staves && order.staves.some((s) => s.role.includes('guide') || s.role === 'guide');
							if (!hasGuide) {
								targetIds.push(order.order_id);
							}
						});
				}

				// 3. 把“已分配”的订单反选掉
				this.selectedAttendantOrderIds = targetIds;

				// 4. 确保所有管家都被勾选，防止因为管家未勾选导致订单看不见
				this.processedAttendants.forEach((a) => (a.isSelected = true));

				// 5. 关闭原本的底部展开区域 (如果之前打开过)
				this.showGuideUnassigned = false;
			} else {
				// --- 关闭筛选 (恢复) ---

				// 1. 关闭聚焦模式
				this.focusMode = false;

				// 2. 恢复所有管家为选中状态
				this.processedAttendants.forEach((a) => (a.isSelected = true));

				// 3. 重新收集所有管家的所有订单ID
				let allOrderIds = [];
				this.processedAttendants.forEach((att) => {
					const orders = this.occupancyData.attendants[att._id] || [];
					orders.forEach((o) => allOrderIds.push(o.order_id));
				});

				// 4. 加上待分配区域的选中ID (如果需要保持选中)
				// 这里我们将所有管家订单 + 当前待分配列表中的订单合并，确保恢复到“全选”状态
				const unassignedIds = [...this.unassignedGuideOrders, ...this.unassignedAttendantOrders].map((o) => o.order_id);

				// 5. 去重并赋值
				this.selectedAttendantOrderIds = [...new Set([...allOrderIds, ...unassignedIds])];
				this.selectedUnassignedIds = [...new Set(unassignedIds)];
			}

			// 触发布局更新
			this.refreshAllLayouts();
		},
		// 管家订单的单选逻辑
		toggleAttendantOrderSelect(order) {
			if (this.isGuideFilterActive) {
				// 检查该订单是否属于“未分配私导”
				const hasGuide = order.staves && order.staves.some((s) => s.role.includes('guide') || s.role === 'guide');
				if (!hasGuide) {
					// 如果是未分配订单，且当前处于筛选模式，禁止取消选中
					uni.showToast({ title: '筛选模式下不可取消', icon: 'none' });
					return;
				}
			}

			const id = order.order_id;
			const idx = this.selectedAttendantOrderIds.indexOf(id);
			if (idx > -1) {
				this.selectedAttendantOrderIds.splice(idx, 1);
			} else {
				this.selectedAttendantOrderIds.push(id);
			}
		},
		toggleSort() {
			this.sortType = this.sortType === 'score' ? 'total' : 'score';
		},

		// Slider 缩放处理
		onZoomSliderChange(e) {
			this.cellWidth = e.detail.value;
			// 建议加防抖，或者仅在 change (松手) 时重绘，这里简单处理
			this.refreshAllLayouts();
		},

		// 私导待分配全选/全不选
		toggleGuideUnassignedSelectAll() {
			const targetState = !this.isGuideUnassignedAllSelected;
			const ids = this.unassignedGuideOrders.map((o) => o.order_id);
			if (targetState) {
				// 增加
				this.selectedUnassignedIds = [...new Set([...this.selectedUnassignedIds, ...ids])];
			} else {
				// 移除
				this.selectedUnassignedIds = this.selectedUnassignedIds.filter((id) => !ids.includes(id));
			}
		},

		// 管家待分配全选/全不选
		toggleAttendantUnassignedSelectAll() {
			const targetState = !this.isAttendantUnassignedAllSelected;
			const ids = this.unassignedAttendantOrders.map((o) => o.order_id);
			if (targetState) {
				this.selectedUnassignedIds = [...new Set([...this.selectedUnassignedIds, ...ids])];
			} else {
				this.selectedUnassignedIds = this.selectedUnassignedIds.filter((id) => !ids.includes(id));
			}
		},

		refreshAllLayouts() {
			// 重新计算私导待分配
			const guideLayout = this.calculateLayout(this.unassignedGuideOrders);
			this.unassignedGuideRenderItems = this.generateRenderItems(guideLayout.tracks, '#999', true);

			// 管家待分配布局
			let targetAttOrders = this.unassignedAttendantOrders;
			// 如果开启聚焦模式，且有选中的未分配订单，则只显示选中的
			if (this.focusMode) {
				targetAttOrders = targetAttOrders.filter((o) => this.selectedUnassignedIds.includes(o.order_id));
			}

			// 重新计算管家待分配
			const attLayout = this.calculateLayout(targetAttOrders);
			this.unassignedAttendantLayoutHeight = Math.max(1, attLayout.trackCount) * TRACK_HEIGHT + 10;
			this.unassignedAttendantRenderItems = this.generateRenderItems(attLayout.tracks, '#999', true);

			// 重新计算管家列表
			this.processedAttendants.forEach((att) => {
				const orders = this.occupancyData.attendants[att._id] || [];
				const layout = this.calculateLayout(orders);
				const dynamicHeight = Math.max(1, layout.trackCount) * TRACK_HEIGHT + 10;
				att.renderHeight = Math.max(60, dynamicHeight);
				att.renderItems = this.generateRenderItems(layout.tracks, att.color, false);
			});
		},

		/**
		 * 更新未分配区域的布局
		 * 根据当前模式重新计算布局，从而实现高度自适应压缩
		 */
		updateUnassignedLayout() {
			// 1. 确定参与排版的订单集合
			let targetOrders = this.unassignedOrders;

			// 逻辑：聚焦模式下，如果有选中的，只排版选中的；否则排版全部
			if (this.focusMode && this.selectedUnassignedIds.length > 0) {
				targetOrders = this.unassignedOrders.filter((o) => this.selectedUnassignedIds.includes(o.order_id));
			}

			// 2. 重新运行 Tetris 算法
			const unResult = this.calculateLayout(targetOrders);

			// 3. 更新高度 (压缩空间)
			// 至少保留1行高度，避免完全消失不好看
			this.unassignedLayoutHeight = Math.max(1, unResult.trackCount) * TRACK_HEIGHT + 10;

			// 4. 生成渲染项 (重新生成 Top 和 Style)
			// 注意：这里生成的 items 已经是筛选过的了，所以 template 里不需要再加 v-if 过滤
			this.unassignedRenderItems = this.generateRenderItems(unResult.tracks, '#999', true);
		},

		// 通用：检查某人某日是否忙碌
		checkIsBusy(userId, role, checkDateTs, days = 1) {
			const dataPool = role === 'guide' ? this.occupancyData.guides : this.occupancyData.attendants;
			const schedules = dataPool[userId] || [];
			const checkEnd = checkDateTs + 24 * 3600 * 1000 * days;

			return schedules.some((s) => {
				// 1. 日期范围初筛
				const tripEnd = s.end + 24 * 3600 * 1000;
				const inRange = Math.max(checkDateTs, s.start) < Math.min(checkEnd, tripEnd);
				if (!inRange) return false;

				// 2. 详细逻辑判断
				if (role === 'attendant' || role.includes('attendant')) {
					return true;
				} else {
					// 如果需要精确判断是否在行程内的某一天：
					if (s.itinerary && Array.isArray(s.itinerary)) {
						// 计算这是行程的第几天
						const dayIndex = Math.floor((checkDateTs - s.start) / (24 * 3600 * 1000));
						// 只要 index 在 0 到 total_days-1 之间，说明正在带团
						return dayIndex >= 0 && dayIndex < s.total_days;
					}
					// 如果没有详细行程数据，但时间重叠，也算忙
					return true;
				}
			});
		},

		/**
		 * 处理日期点击
		 */
		onDateClick(day) {
			const targetTs = day.ts;
			const targetEnd = targetTs + 24 * 3600 * 1000;

			// 使用 Map 去重 (同一个订单可能在私导、管家、车辆里都出现)
			const uniqueOrders = new Map();

			// 辅助函数：收集并筛选数据
			const collectOrders = (resourceMap) => {
				if (!resourceMap) return;
				Object.values(resourceMap).forEach((orderList) => {
					if (!Array.isArray(orderList)) return;
					orderList.forEach((order) => {
						// 计算订单时间范围
						const tripEnd = order.end + 24 * 3600 * 1000;
						// 判断交集：订单结束时间必须晚于查询日期开始，且订单开始时间必须早于查询日期结束
						if (tripEnd > targetTs && order.start < targetEnd) {
							// 存入 Map (order_id 为 Key)
							if (!uniqueOrders.has(order.order_id)) {
								uniqueOrders.set(order.order_id, order);
							}
						}
					});
				});
			};

			// 遍历三类资源池
			collectOrders(this.occupancyData.guides);
			collectOrders(this.occupancyData.attendants);
			collectOrders(this.occupancyData.vehicles);

			// 设置数据并打开弹窗
			this.dailyPopupData.dateTs = targetTs;
			this.dailyPopupData.orders = Array.from(uniqueOrders.values());

			this.$refs.dailyPopup.open();
		},

		// 统一的关闭入口
		closeDailyPopup() {
			this.$refs.dailyPopup.close();
		},

		// 处理遮罩点击
		onPopupMaskClick() {
			// 直接强制关闭，忽略焦点状态
			this.closeDailyPopup();
		},

		onTouchStart(e) {
			// 如果正在编辑，禁止拖动画布
			if (this.editingId) return;

			this.isDragging = true;
			// 记录初始触摸点，用于计算是否真正开始移动
			this.dragStartX = e.touches[0].clientX;
			this.dragStartY = e.touches[0].clientY;

			this.lastX = e.touches[0].clientX;
			this.lastY = e.touches[0].clientY;
		},
		onTouchMove(e) {
			if (this.editingId) return;
			if (!this.isDragging) return;

			const touch = e.touches[0];
			const totalMoveX = Math.abs(touch.clientX - this.dragStartX);
			const totalMoveY = Math.abs(touch.clientY - this.dragStartY);
			// 如果移动幅度小于 5px，认为是手指抖动，不拦截事件，让长按(longpress)可以正常触发
			if (totalMoveX < 5 && totalMoveY < 5) {
				return;
			}
			if (e.preventDefault) e.preventDefault();

			this.scrollX -= touch.clientX - this.lastX;
			this.scrollY -= touch.clientY - this.lastY;
			this.lastX = touch.clientX;
			this.lastY = touch.clientY;
			this.checkBounds();
		},
		onTouchEnd() {
			this.isDragging = false;
			this.checkBounds();
		},
		onMouseDown(e) {
			// 如果正在编辑，禁止拖动画布
			if (this.editingId) return;

			this.isDragging = true;
			this.lastX = e.clientX;
			this.lastY = e.clientY;
			const moveHandler = (ev) => {
				if (!this.isDragging) return;
				this.scrollX -= ev.clientX - this.lastX;
				this.scrollY -= ev.clientY - this.lastY;
				this.lastX = ev.clientX;
				this.lastY = ev.clientY;
				this.checkBounds();
			};
			const upHandler = () => {
				this.isDragging = false;
				window.removeEventListener('mousemove', moveHandler);
				window.removeEventListener('mouseup', upHandler);
				this.checkBounds();
			};
			window.addEventListener('mousemove', moveHandler);
			window.addEventListener('mouseup', upHandler);
		},

		checkBounds() {
			const currentContentWidth = this.days.length * this.cellWidth;
			// 如果滚动接近右边界 (剩余少于 500px)
			if (this.scrollX + this.viewportWidth > currentContentWidth - 800) {
				// 追加天数
				this.appendDays(15);
			}

			if (this.scrollX < 0) this.scrollX = 0;
			if (this.scrollY < 0) this.scrollY = 0;
		},
		// 追加天数方法
		appendDays(count) {
			const lastDay = this.days[this.days.length - 1];
			const start = new Date(lastDay.ts);
			const weekMap = ['日', '一', '二', '三', '四', '五', '六'];
			const newStartTs = this.days[this.days.length - 1].ts + 24 * 3600 * 1000;

			if (this.isAppending) return;
			this.isAppending = true;

			for (let i = 1; i <= count; i++) {
				const d = new Date(start);
				d.setDate(start.getDate() + i);

				const isFirstDayOfMonth = d.getDate() === 1;
				let monthLabel = '';
				if (isFirstDayOfMonth) {
					monthLabel = d.getMonth() + 1 + '月';
				}

				this.days.push({
					dateNum: d.getDate(),
					weekDay: weekMap[d.getDay()],
					ts: d.getTime(),
					isWeekend: d.getDay() === 0 || d.getDay() === 6,
					isToday: false, // 肯定是未来
					monthLabel: monthLabel
				});
			}

			const addedStartDate = new Date(newStartTs);
			const addedEndDate = new Date(newStartTs + count * 24 * 3600 * 1000);

			this.loadMoreData(addedStartDate, addedEndDate);

			this.$nextTick(() => {
				this.refreshAllLayouts(); // 调用上面定义的重绘方法
				// this.isAppending = false;
			});
		},
		async loadMoreData(startDate, endDate) {
			console.log('正在加载更多数据...', startDate.toLocaleDateString(), endDate.toLocaleDateString());

			try {
				const res = await operationCenter.getScheduleMatrix({
					startDate: startDate.getTime(),
					endDate: endDate.getTime()
				});

				if (res.code === 0) {
					const newData = res.data;

					// 辅助函数：合并数据（避免重复添加）
					const mergeOrders = (targetObj, sourceObj) => {
						Object.keys(sourceObj).forEach((key) => {
							if (!targetObj[key]) {
								targetObj[key] = [];
							}
							// 遍历新数据，如果 ID 不存在则添加
							sourceObj[key].forEach((newItem) => {
								const exists = targetObj[key].some((oldItem) => oldItem.order_id === newItem.order_id);
								if (!exists) {
									targetObj[key].push(newItem);
								}
							});
						});
					};

					// 1. 合并 Guides, Attendants, Vehicles 数据
					mergeOrders(this.occupancyData.guides, newData.guides);
					mergeOrders(this.occupancyData.attendants, newData.attendants);
					mergeOrders(this.occupancyData.vehicles, newData.vehicles);

					// 2. 合并待分配列表
					const mergeList = (targetList, sourceList) => {
						if (!sourceList || !Array.isArray(sourceList)) return;
						sourceList.forEach((newItem) => {
							if (!newItem.order_id) return;
							if (!targetList.some((oldItem) => oldItem.order_id === newItem.order_id)) {
								targetList.push(newItem);
							}
						});
					};
					mergeList(this.unassignedGuideOrders, newData.unassignedGuide);
					mergeList(this.unassignedAttendantOrders, newData.unassignedAttendant);

					// --- 如果在筛选模式下，将新数据中未分配私导的订单加入选中列表 ---
					if (this.isGuideFilterActive) {
						const newUnassignedIds = [];
						// 仅遍历新加载的管家订单数据 (newData.attendants)
						if (newData.attendants) {
							Object.values(newData.attendants)
								.flat()
								.forEach((order) => {
									const hasGuide = order.staves && order.staves.some((s) => s.role.includes('guide') || s.role === 'guide');
									if (!hasGuide) {
										newUnassignedIds.push(order.order_id);
									}
								});
						}
						// 追加到现有选中列表 (去重)
						if (newUnassignedIds.length > 0) {
							this.selectedAttendantOrderIds = [...new Set([...this.selectedAttendantOrderIds, ...newUnassignedIds])];
						}
					}

					// 3. 重新计算所有人的统计数据 (stats)
					// 因为数据多了，"出发"、"结束"的统计可能会变
					// this.updateAttendantStats();

					// 4. 重新布局绘图
					this.refreshAllLayouts();
				}
			} catch (e) {
				console.error('加载更多数据失败', e);
			} finally {
				this.isAppending = false;
			}
		},
		// 新增辅助：更新管家统计数据
		// updateAttendantStats() {
		// 	this.processedAttendants.forEach((att) => {
		// 		const orders = this.occupancyData.attendants[att._id] || [];
		// 		let startC = 0,
		// 			endC = 0;
		// 		// 统计范围：当前视图的所有天数
		// 		const viewStart = this.days[0].ts;
		// 		const viewEnd = this.days[this.days.length - 1].ts;

		// 		orders.forEach((o) => {
		// 			const tripEnd = o.end + 24 * 3600 * 1000;
		// 			if (o.start >= viewStart && o.start <= viewEnd) startC++;
		// 			if (tripEnd >= viewStart && tripEnd <= viewEnd) endC++;
		// 		});
		// 		att.stats = { total: orders.length, start: startC, end: endC };
		// 	});
		// },

		// 混合获取私导数据
		async fetchGuideDataMixed() {
			const db = uniCloud.database();
			const [usersRes, profilesRes] = await Promise.all([
				db.collection('uni-id-users').where({ role: 'guide' }).field('_id, nickname, username, mobile, avatar_file').get(),
				db.collection('b-guide-profiles').field('_id, user_id, real_name, mobile, personal_photo').get()
			]);

			const profileMap = {};
			profilesRes.result.data.forEach((p) => {
				if (p.user_id) profileMap[p.user_id] = p;
			});

			return usersRes.result.data.map((u) => {
				const profile = profileMap[u._id];
				return {
					_id: profile ? profile._id : u._id,
					user_id: u._id, // 确保有 user_id，调度逻辑依赖此字段
					real_name: profile && profile.real_name ? profile.real_name : u.nickname || u.username || '私导',
					mobile: profile && profile.mobile ? profile.mobile : u.mobile,
					personal_photo: profile && profile.personal_photo ? profile.personal_photo : u.avatar_file?.url || ''
				};
			});
		},

		async initData() {
			this.isLoading = true;
			try {
				this.generateDays(this.startDateStr);
				const todayTs = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
				const selectedDateTs = new Date(this.startDateStr).getTime();

				const [usersRes, attScoreRes, guideScoreRes, matrixRes, vehiclesRes, guidesData, taskRes, statsRes, listStatsRes] = await Promise.all([
					db.collection('uni-id-users').where({ role: 'attendant' }).field('_id,nickname,mobile,avatar_file').get(),
					operationCenter.getAssessmentData({ role: 'attendant' }),
					operationCenter.getAssessmentData({ role: 'guide' }),
					this.fetchScheduleMatrix(),
					db.collection('b-vehicle-profiles').field('_id,plate_number,model').get(),
					this.fetchGuideDataMixed(),
					operationCenter.getDailyTaskOverview({ dateTs: todayTs }),
					operationCenter.getAttendantMonthlyStats({ dateTs: todayTs }),
					operationCenter.getAttendantListStats({ dateTs: selectedDateTs })
				]);

				// 1. 处理基础数据
				const guideScores = guideScoreRes.data || [];
				const rawGuides = guidesData || [];
				this.guides = rawGuides.map((g) => {
					const sObj = guideScores.find((s) => s.user_id === g.user_id);
					return {
						...g,
						total_score: sObj ? sObj.total_score : 0
					};
				});
				this.attendants = usersRes.result.data || [];
				this.vehicles = vehiclesRes.result.data;
				const attScores = attScoreRes.data || [];

				if (taskRes && (taskRes.errCode === 0 || taskRes.code === 0)) {
					this.dailyTaskStats = taskRes.data || { executed_count: 0, pending_count: 0 };
				}

				if (statsRes && (statsRes.code === 0 || statsRes.errCode === 0)) {
					this.serverAttendantStats = statsRes.data || { completed: 0 };
				}

				if (listStatsRes && listStatsRes.code === 0) {
					this.attendantListStats = listStatsRes.data || {};
				}

				// 2. 映射管家信息并分配颜色
				this.processedAttendants = usersRes.result.data.map((u, index) => {
					const sObj = attScores.find((s) => s.user_id === u._id);
					const listStats = this.attendantListStats[u._id] || { total: 0, start: 0, end: 0, days: 0 };
					return {
						_id: u._id,
						user_id: u._id,
						real_name: u.nickname || '未命名',
						mobile: u.mobile,
						total_score: sObj ? sObj.total_score : 0,
						color: '#059669',
						isSelected: true,
						stats: listStats,
						renderHeight: 60, // 初始高度
						renderItems: []
					};
				});

				// 3. 处理排期数据 (含未分配)
				if (matrixRes.code === 0) {
					this.occupancyData = matrixRes.data;
					this.salesMap = matrixRes.data.salesMap || {};
					this.unassignedGuideOrders = matrixRes.data.unassignedGuide || [];
					this.unassignedAttendantOrders = matrixRes.data.unassignedAttendant || [];

					// 1. 私导待分配布局
					const guideLayout = this.calculateLayout(this.unassignedGuideOrders);
					this.unassignedGuideLayoutHeight = Math.max(1, guideLayout.trackCount) * TRACK_HEIGHT + 10;
					this.unassignedGuideRenderItems = this.generateRenderItems(guideLayout.tracks, '#999', true);

					// 2. 管家待分配布局
					const attLayout = this.calculateLayout(this.unassignedAttendantOrders);
					this.unassignedAttendantLayoutHeight = Math.max(1, attLayout.trackCount) * TRACK_HEIGHT + 10;
					this.unassignedAttendantRenderItems = this.generateRenderItems(attLayout.tracks, '#999', true);

					if (this.isUnassignedSelected) {
						this.selectedUnassignedIds = this.unassignedOrders.map((o) => o.order_id);
					}

					// 计算未分配布局
					const unResult = this.calculateLayout(this.unassignedOrders);
					this.unassignedLayoutHeight = Math.max(1, unResult.trackCount) * TRACK_HEIGHT + 10;
					this.unassignedRenderItems = this.generateRenderItems(unResult.tracks, '#999', true); // 灰色

					this.updateUnassignedLayout();

					const allUnassignedIds = [...this.unassignedGuideOrders.map((o) => o.order_id), ...this.unassignedAttendantOrders.map((o) => o.order_id)];
					this.selectedUnassignedIds = [...new Set([...this.selectedUnassignedIds, ...allUnassignedIds])];

					let allAttendantOrderIds = [];

					// 遍历所有管家的订单数据
					if (this.occupancyData.attendants) {
						Object.values(this.occupancyData.attendants).forEach((orders) => {
							if (Array.isArray(orders)) {
								orders.forEach((o) => allAttendantOrderIds.push(o.order_id));
							}
						});
					}
					// 去重并赋值给选中数组
					this.selectedAttendantOrderIds = [...new Set(allAttendantOrderIds)];

					// 计算每个管家的布局 & 统计
					this.processedAttendants.forEach((att) => {
						const orders = matrixRes.data.attendants[att._id] || [];

						// 统计
						// let startC = 0,
						// 	endC = 0;
						// const viewStart = this.startDateTs;
						// const viewEnd = viewStart + 30 * 24 * 3600 * 1000;
						// orders.forEach((o) => {
						// 	if (o.start >= viewStart && o.start <= viewEnd) startC++;
						// 	if (o.end >= viewStart && o.end <= viewEnd) endC++;
						// });
						// att.stats = { total: orders.length, start: startC, end: endC };

						// 布局计算 (Tetris 算法)
						const layout = this.calculateLayout(orders);
						const dynamicHeight = Math.max(1, layout.trackCount) * TRACK_HEIGHT + 10;
						att.renderHeight = Math.max(60, dynamicHeight);
						att.renderItems = this.generateRenderItems(layout.tracks, att.color, false);
					});
				}
			} catch (e) {
				console.error(e);
			} finally {
				this.isLoading = false;
			}
		},

		// 缩放功能
		changeZoom(delta) {
			const newWidth = this.cellWidth + delta;
			if (newWidth >= 30 && newWidth <= 120) {
				this.cellWidth = newWidth;
				this.refreshAllLayouts();
			}
		},

		// 俄罗斯方块布局算法 (Tetris Packing)
		calculateLayout(orders) {
			if (!orders || orders.length === 0) return { trackCount: 1, tracks: [] };

			// 1. 按开始时间排序
			const sorted = [...orders].sort((a, b) => a.start - b.start);

			// 2. 轨道数组，记录每条轨道的最后占用结束时间
			const tracks = []; // [{ endTs: 0, orders: [] }]

			sorted.forEach((order) => {
				let placed = false;
				const orderStart = order.start;
				// order.end (最后一天0点) + 24小时 (即最后一天结束) + 1小时缓冲 (避免视觉粘连)
				const orderEnd = order.end + 24 * 3600 * 1000 + 3600 * 1000;

				// 尝试放入现有轨道
				for (let i = 0; i < tracks.length; i++) {
					if (tracks[i].endTs < orderStart) {
						tracks[i].orders.push({ ...order, trackIndex: i });
						tracks[i].endTs = orderEnd;
						placed = true;
						break;
					}
				}

				// 放不进去，新开轨道
				if (!placed) {
					tracks.push({
						endTs: orderEnd,
						orders: [{ ...order, trackIndex: tracks.length }]
					});
				}
			});

			// 拍平数据以便渲染
			const allPlacedOrders = [];
			tracks.forEach((t) => allPlacedOrders.push(...t.orders));

			return { trackCount: tracks.length, tracks: allPlacedOrders };
		},

		/**
		 * 激活编辑模式
		 */
		enableEdit(item) {
			if (item.type !== 'bar') return;

			const order = item.original;
			const manuals = order.manual_markers || {};

			uni.showActionSheet({
				itemList: ['修改订单显示文字', '修改颜色', '设置/修改 接机(首日)', '设置/修改 送机(尾日)', '设置/修改 布宫'],
				success: (res) => {
					if (res.tapIndex === 0) {
						// 原有的编辑文字逻辑
						this.editingId = order.order_id;
						this.editingText = item.text;
						this.editingSegment = item.segmentType || 'pre';
						item.isMainBar = true;
					} else if (res.tapIndex === 1) {
						// 打开颜色选择器
						this.editingColorOrder = order;
						this.editingColor = order.custom_color || '';
						this.$refs.colorPopup.open();
					} else if (res.tapIndex === 2) {
						this.handleManualMarkerInput(order, 'pickup', manuals.pickup || '接');
					} else if (res.tapIndex === 3) {
						this.handleManualMarkerInput(order, 'dropoff', manuals.dropoff || '送');
					} else if (res.tapIndex === 4) {
						// 布宫需要选天数，复用现有的 potalaPopup 逻辑，但需要稍作改造
						this.openPotalaSelector(order);
					}
				}
			});
		},

		// 选择并在本地/远程保存颜色
		async selectOrderColor(color) {
			if (!this.editingColorOrder) return;

			const order = this.editingColorOrder;
			const orderId = order.order_id;
			const oldColor = order.custom_color;

			// 1. 关闭弹窗
			this.$refs.colorPopup.close();

			// 2. 如果颜色没变，不做处理
			if (color === oldColor) return;

			// 3. 乐观更新本地数据
			this.updateLocalOrderColor(orderId, color);

			// 4. 调用后端保存
			try {
				uni.showLoading({ title: '保存颜色...' });
				const res = await operationCenter.updateOrderColor({
					order_id: orderId,
					color: color
				});

				if (res.code === 0) {
					uni.showToast({ title: '颜色已修改', icon: 'none' });
				} else {
					throw new Error(res.msg);
				}
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '保存失败', icon: 'none' });
				// 回滚
				this.updateLocalOrderColor(orderId, oldColor);
			} finally {
				uni.hideLoading();
				this.editingColorOrder = null;
			}
		},

		// 本地更新颜色辅助方法
		updateLocalOrderColor(orderId, color) {
			// 辅助函数：更新列表
			const updateList = (map) => {
				if (!map) return;
				Object.values(map).forEach((list) => {
					if (Array.isArray(list)) {
						list.forEach((order) => {
							if (order.order_id === orderId) {
								// 使用 $set 确保响应式 (Vue 2)
								this.$set(order, 'custom_color', color);
							}
						});
					}
				});
			};

			updateList(this.occupancyData.guides);
			updateList(this.occupancyData.attendants);
			updateList(this.occupancyData.vehicles);

			// 更新待分配
			[...this.unassignedGuideOrders, ...this.unassignedAttendantOrders, ...this.unassignedOrders].forEach((order) => {
				if (order.order_id === orderId) {
					this.$set(order, 'custom_color', color);
				}
			});

			// 触发重绘
			this.refreshAllLayouts();
		},

		/**
		 * 保存自定义文字
		 */
		async saveCustomText(item) {
			if (this.editingId === null) return;

			const orderId = this.editingId;
			const newText = this.editingText; // 用户输入的新文字
			const order = item.original;
			const SEPARATOR = '##';

			// 退出编辑状态
			this.editingId = null;
			this.editingText = '';
			item.isMainBar = false;

			// 1. 获取当前的完整存储值
			const rawCustom = order.custom_display_text || '';
			const defaultText = this.generateDefaultText(order);

			// 2. 解析出 Pre 和 Post
			let pre = defaultText;
			let post = defaultText;

			if (rawCustom) {
				const parts = rawCustom.split(SEPARATOR);
				if (parts.length > 1) {
					pre = parts[0];
					post = parts[1];
				} else {
					pre = parts[0];
					post = parts[0]; // 未分割时视为相同
				}
			}

			// 3. 更新对应段落
			if (this.editingSegment === 'post') {
				post = newText;
			} else {
				pre = newText;
			}

			// 4. 合并新字符串 (始终使用分隔符格式保存，确保唯一性)
			// 即使两段一样也保存为 "A##A"，方便逻辑统一
			const finalCustomText = `${pre}${SEPARATOR}${post}`;

			if (finalCustomText === rawCustom) return;

			// 5. 乐观更新 & 后端保存
			// 注意：updateLocalOrderText 需要更新，直接存 finalCustomText 即可
			this.updateLocalOrderText(orderId, finalCustomText);

			try {
				const res = await operationCenter.updateOrderCustomText({
					order_id: orderId,
					text: finalCustomText
				});
				if (res.code !== 0) throw new Error(res.msg);
				uni.showToast({ title: '已更新', icon: 'none' });
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '保存失败', icon: 'none' });
				this.updateLocalOrderText(orderId, rawCustom); // 回滚
			}
		},

		/**
		 * 本地更新所有相关视图的数据
		 */
		updateLocalOrderText(orderId, text) {
			// 辅助函数：更新列表中的订单对象
			const updateList = (map) => {
				Object.values(map).forEach((list) => {
					if (Array.isArray(list)) {
						list.forEach((order) => {
							if (order.order_id === orderId) {
								order.custom_display_text = text;
							}
						});
					}
				});
			};

			// 更新三大资源池
			updateList(this.occupancyData.guides);
			updateList(this.occupancyData.attendants);
			updateList(this.occupancyData.vehicles);

			// 更新待分配
			[...this.unassignedGuideOrders, ...this.unassignedAttendantOrders].forEach((order) => {
				if (order.order_id === orderId) {
					order.custom_display_text = text;
				}
			});

			// 触发重绘
			this.refreshAllLayouts();
		},

		/**
		 * 本地更新所有相关视图的 manual_markers
		 */
		updateLocalOrderMarkers(orderId, markers) {
			// 辅助函数：更新列表中的订单对象
			const updateList = (map) => {
				if (!map) return;
				Object.values(map).forEach((list) => {
					if (Array.isArray(list)) {
						list.forEach((order) => {
							if (order.order_id === orderId) {
								this.$set(order, 'manual_markers', markers);
							}
						});
					}
				});
			};

			// 1. 更新三大资源池 (私导、管家、车辆)
			updateList(this.occupancyData.guides);
			updateList(this.occupancyData.attendants);
			updateList(this.occupancyData.vehicles);

			// 2. 更新待分配列表 (合并处理)
			const allUnassigned = [...this.unassignedGuideOrders, ...this.unassignedAttendantOrders, ...this.unassignedOrders];
			allUnassigned.forEach((order) => {
				if (order.order_id === orderId) {
					this.$set(order, 'manual_markers', markers);
				}
			});

			// 3. 如果当前正在查看每日详情弹窗，也要更新那里面的数据
			if (this.dailyPopupData && this.dailyPopupData.orders) {
				this.dailyPopupData.orders.forEach((order) => {
					if (order.order_id === orderId) {
						this.$set(order, 'manual_markers', markers);
					}
				});
			}

			// 4. 触发全局重绘
			this.refreshAllLayouts();
		},

		/**
		 * 生成渲染项 (核心渲染逻辑)
		 * @param {Array} placedOrders 已经计算好 trackIndex 的订单数组
		 * @param {String} color 管家的专属颜色
		 * @param {Boolean} isUnassigned 是否为未分配订单 (未分配显示灰色)
		 */
		generateRenderItems(placedOrders, color, isUnassigned) {
			const items = [];
			const dayMs = 24 * 3600 * 1000;
			const BAR_HEIGHT = 22;
			const PADDING_TOP = 2;
			const SEPARATOR = '##'; // 定义分隔符

			placedOrders.forEach((order) => {
				const trackIdx = order.trackIndex || 0;
				const topOffset = trackIdx * TRACK_HEIGHT + PADDING_TOP;

				// 1. 获取默认文字
				const defaultText = this.generateDefaultText(order);

				// 2. 解析自定义文字 (支持 "前段文字##后段文字")
				let textPre = defaultText;
				let textPost = defaultText;

				if (order.custom_display_text) {
					const parts = order.custom_display_text.split(SEPARATOR);
					if (parts.length > 1) {
						// 如果有分隔符，分别赋值
						textPre = parts[0];
						textPost = parts[1];
					} else {
						// 如果没有分隔符，视为全局统一
						textPre = parts[0];
						textPost = parts[0];
					}
				}

				let currentBarStartIdx = -1;
				let currentBarLength = 0;
				// 标记是否已经经过了布达拉宫（用于判断当前是前段还是后段）
				let hasPassedPotala = false;

				const manuals = order.manual_markers || {};
				const itineraryList = order.itinerary && Array.isArray(order.itinerary) ? order.itinerary : [];

				const finalColor = order.custom_color || (isUnassigned ? '#9ca3af' : color);

				for (let i = 0; i < order.total_days; i++) {
					const dayItem = itineraryList.find((d) => d.day === i + 1) || itineraryList[i];
					const dayTitle = dayItem ? dayItem.day_title || '' : '';
					const isPotalaDisabled = manuals.potala && manuals.potala.disabled === true;

					// --- 标记检测逻辑 (保持原有逻辑，增加 hasPassedPotala 更新) ---
					let manualMarkerType = null;
					let manualLabel = '';

					if (i === 0 && manuals.pickup) {
						manualMarkerType = 'pickup';
						manualLabel = manuals.pickup;
					} else if (i === order.total_days - 1 && manuals.dropoff) {
						manualMarkerType = 'dropoff';
						manualLabel = manuals.dropoff;
					} else if (manuals.potala && !isPotalaDisabled && manuals.potala.day === i + 1) {
						manualMarkerType = 'potala';
						manualLabel = manuals.potala.text || '布';
					}

					// 自动检测逻辑
					let autoMarkerType = null;
					if (!manualMarkerType && dayTitle.indexOf('独立包车') === -1) {
						if (dayTitle.indexOf('接机') !== -1 || dayTitle.indexOf('接站') !== -1) autoMarkerType = 'pickup';
						else if (dayTitle.indexOf('送机') !== -1 || dayTitle.indexOf('送站') !== -1) autoMarkerType = 'dropoff';
						else if (dayTitle.indexOf('布达拉宫') !== -1 && !isPotalaDisabled) autoMarkerType = 'potala';
					}

					const activeMarkerType = manualMarkerType || autoMarkerType;
					const activeLabel = manualLabel || (autoMarkerType === 'potala' ? '布' : autoMarkerType === 'pickup' ? '接' : '送');

					// --- 渲染逻辑 ---
					if (activeMarkerType) {
						// 结算之前的 Bar
						if (currentBarStartIdx !== -1) {
							// 判断依据：如果还没遇到布宫，就是 Pre，否则是 Post
							// 注意：这里的 Bar 是在 Marker 之前的，所以状态取决于之前的 hasPassedPotala
							const barSegment = hasPassedPotala ? 'post' : 'pre';
							items.push({
								type: 'bar',
								segmentType: barSegment, // 记录段落类型
								text: barSegment === 'pre' ? textPre : textPost,
								original: order,
								style: this.getBarStyle(order.start + currentBarStartIdx * dayMs, currentBarLength, topOffset, BAR_HEIGHT, finalColor)
							});
							currentBarStartIdx = -1;
							currentBarLength = 0;
						}

						// 更新状态：如果当前是布宫，那么之后的 Bar 都是 Post
						if (activeMarkerType === 'potala') {
							hasPassedPotala = true;
						}

						// 渲染 Marker
						const offsetDays = (order.start + i * dayMs - this.startDateTs) / dayMs;
						if (offsetDays >= 0 && offsetDays < this.days.length) {
							items.push({
								type: 'marker',
								subType: activeMarkerType === 'potala' ? 'marker-potala' : 'marker-pickup',
								label: activeLabel,
								text: activeLabel,
								original: order,
								style: {
									left: offsetDays * this.cellWidth + 'px',
									width: this.cellWidth - 4 + 'px',
									top: topOffset + 'px',
									height: BAR_HEIGHT + 'px'
								}
							});
						}
						continue;
					}

					// 独立包车逻辑 (保持不变)
					if (dayTitle.indexOf('独立包车') !== -1) {
						if (currentBarStartIdx === -1) currentBarStartIdx = i;
						currentBarLength++;
						continue;
					}

					// 普通 Bar 累加
					if (currentBarStartIdx === -1) {
						currentBarStartIdx = i;
					}
					currentBarLength++;
				}

				// 结算最后剩余的 Bar
				if (currentBarStartIdx !== -1) {
					const barSegment = hasPassedPotala ? 'post' : 'pre';
					items.push({
						type: 'bar',
						segmentType: barSegment,
						text: barSegment === 'pre' ? textPre : textPost,
						original: order,
						style: this.getBarStyle(order.start + currentBarStartIdx * dayMs, currentBarLength, topOffset, BAR_HEIGHT, finalColor)
					});
				}
			});

			return items;
		},

		// 辅助方法：生成 Bar 的 Style
		getBarStyle(segStartTs, length, top, height, bgColor) {
			const dayMs = 24 * 3600 * 1000;
			let offsetDays = (segStartTs - this.startDateTs) / dayMs;
			let displayLen = length;

			// 处理左边界截断
			if (offsetDays < 0) {
				displayLen += offsetDays;
				offsetDays = 0;
			}

			// 长度不足或超出右边界
			if (displayLen <= 0) return { display: 'none' };

			const maxDays = this.days.length;
			if (offsetDays + displayLen > maxDays) {
				displayLen = maxDays - offsetDays;
			}

			return {
				left: offsetDays * this.cellWidth + 'px',
				width: displayLen * this.cellWidth - 4 + 'px',
				top: top + 'px',
				height: height + 'px',
				backgroundColor: bgColor
			};
		},

		abbreviateTitle(title) {
			if (!title) return '';
			const dayMatch = title.match(/(\d+)[天日]/);
			const days = dayMatch ? dayMatch[1] : '';
			let clean = title.replace(/(\d+)[天日].*$/, '').replace(/私家团|行程|旅游|纯玩|路线/g, '');
			const parts = clean.split(/[+＋ ]/);
			let locs = '';
			parts.forEach((p) => {
				if (p.length > 0) locs += p[0];
			});
			return `${locs}${days}天`;
		},

		findStaffName(id) {
			// 先查私导
			const g = this.guides.find((u) => u.user_id === id);
			if (g) return g.real_name;

			// 再查管家
			const a = this.attendants.find((u) => u._id === id);
			if (a) return a.nickname || '管家';

			return '';
		},
		generateDays(startStr) {
			const start = new Date(startStr.replace(/-/g, '/'));
			start.setHours(0, 0, 0, 0);
			start.setDate(start.getDate() - 7);
			this.startDateTs = start.getTime();
			const arr = [];
			const weekMap = ['日', '一', '二', '三', '四', '五', '六'];
			for (let i = 0; i < 45; i++) {
				const d = new Date(start);
				d.setDate(start.getDate() + i);
				d.setHours(0, 0, 0, 0);

				const isFirstDayOfMonth = d.getDate() === 1;
				let monthLabel = '';

				if (i === 0 || isFirstDayOfMonth) {
					monthLabel = d.getMonth() + 1 + '月';
				}

				arr.push({
					dateNum: d.getDate(),
					weekDay: weekMap[d.getDay()],
					ts: d.getTime(),
					isWeekend: d.getDay() === 0 || d.getDay() === 6,
					isToday: d.toDateString() === new Date().toDateString(),
					monthLabel: monthLabel
				});
			}
			this.days = arr;
		},

		async fetchScheduleMatrix() {
			const start = new Date(this.startDateStr);
			const end = new Date(start);
			end.setDate(start.getDate() + 30);
			return await operationCenter.getScheduleMatrix({ startDate: start.getTime(), endDate: end.getTime() });
		},
		onDateChange(e) {
			this.startDateStr = e;
			// 1. 关闭私导筛选模式
			if (this.isGuideFilterActive) {
				this.isGuideFilterActive = false;
				// 恢复所有管家行程的勾选状态
				this.processedAttendants.forEach((a) => (a.isSelected = true));
			}

			// 2. 关闭管家待分配面板
			this.showAttendantUnassigned = false;

			// 3. 关闭聚焦模式并清空选中
			this.focusMode = false;
			this.selectedUnassignedIds = []; // 清空待分配选中
			this.selectedAttendantOrderIds = []; // 清空管家订单选中
			this.initData();
		},
		async showOrderDetails(item) {
			this.selectedOrder = item;
			this.prepareAssignmentOptions(item);

			const sName = item.sales_name || this.salesMap[item.order_id] || '';
			this.$set(this.selectedOrder, 'sales_name_display', sName);

			// Prepare Temp State
			let currentAttId = '';
			let currentGuideId = '';
			if (item.staves) {
				const a = item.staves.find((s) => s.role.includes('attendant') || s.role === 'attendant');
				if (a) currentAttId = String(a.id);
				const g = item.staves.find((s) => s.role.includes('guide') || s.role === 'guide');
				if (g) currentGuideId = String(g.id);
			}

			// 查找对应的对象，用于 CustomPicker 的回显
			const attObj = this.assignmentOptions.attendants.find((x) => x.id === currentAttId);
			// const guideObj = this.assignmentOptions.guides.find((x) => x.id === currentGuideId);

			this.tempAssignment = {
				attendantId: currentAttId,
				attendantName: attObj ? attObj.name || attObj.real_name : currentAttId ? '未知管家' : '',
				attendantObj: attObj || null,

				guideId: currentGuideId,
				guideName: '',
				guideObj: null
			};

			this.$refs.popup.open();

			// 2. 调用云对象获取分配列表 (异步加载)
			uni.showLoading({ title: '加载可接团私导...' });
			try {
				const [guideRes, attRes] = await Promise.all([
					operationCenter.getAssignableList({
						role: 'guide',
						startTime: item.start,
						totalDays: item.total_days,
						excludeOrderId: item.order_id
					})
					// operationCenter.getAssignableList({
					//     role: 'attendant',
					//     startTime: item.start,
					//     totalDays: item.total_days,
					//     excludeOrderId: item.order_id
					// })
				]);

				if (guideRes.code === 0) {
					const mergedList = guideRes.data.map((remoteItem) => {
						// 从本地已加载的 guides (包含准确评分) 中查找
						const localGuide = this.guides.find((g) => g.user_id === remoteItem.id);
						// 优先使用本地评分
						const score = localGuide ? localGuide.total_score || 0 : remoteItem.score || 0;

						// 重新构建 displayLabel
						// 格式: [优秀] 张三 (100分 | 3团 | 15天) - 可接团
						const statsText = `${score}分 | ${remoteItem.groups}团 | ${remoteItem.days}天`;
						const displayLabel = `[${remoteItem.rankLabel}] ${remoteItem.real_name} (${statsText}) - ${remoteItem.statusText}`;

						return {
							...remoteItem,
							score: score,
							displayLabel: displayLabel
						};
					});

					// 重新排序：忙碌沉底 > 优秀优先 > 评分高优先
					mergedList.sort((a, b) => {
						if (a.isBusy !== b.isBusy) return a.isBusy ? 1 : -1;
						if (a.rank !== b.rank) return a.rank === 'excellent' ? -1 : 1;
						return b.score - a.score;
					});

					this.assignmentOptions.guides = mergedList;

					// 回显选中项
					const found = this.assignmentOptions.guides.find((g) => g.id === currentGuideId);
					if (found) {
						this.tempAssignment.guideObj = found;
						this.tempAssignment.guideName = found.displayLabel;
					}
				}
				// if (attRes.code === 0) {
				//     this.assignmentOptions.attendants = attRes.data;
				//     const found = attRes.data.find(a => a.id === currentAttId);
				//     if(found) {
				//         this.tempAssignment.attendantObj = found;
				//         this.tempAssignment.attendantName = found.displayLabel;
				//     }
				// }
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '人员列表加载失败', icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		},

		// Calculate stats and sort for dropdown
		prepareAssignmentOptions(orderItem) {
			// 1. 获取订单结束时间
			const startTs = orderItem.start;
			const days = orderItem.total_days || 1;
			// 订单结束那天的 00:00:00 (粗略计算用于定位月份即可)
			// 也可以用 startTs + days * 24h - 1s
			const endTs = startTs + days * 24 * 3600 * 1000;

			// 2. 使用订单结束时间所在的月份作为统计窗口
			const d = new Date(endTs - 1000); // 减1秒确保刚好卡在结束当天

			// 当月1号 00:00:00
			const windowStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
			// 当月最后一天 23:59:59
			const windowEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();

			// 辅助函数保持不变
			const getStatsInWindow = (id, role) => {
				// ... 代码不变，逻辑是计算 overlap ...
				// 这里不需要动，因为 windowStart/End 已经变了，内部逻辑会自动计算新窗口下的重叠
				let groups = 0;
				let days = 0;
				const pool = role === 'guide' ? this.occupancyData.guides : this.occupancyData.attendants;
				const list = pool[id] || [];

				list.forEach((o) => {
					const tripEnd = o.end + 24 * 3600 * 1000;
					const lastServiceDay = tripEnd - 1000;

					// 1. 团数：按出发时间 (o.start) 统计
					if (o.start >= windowStart && o.start <= windowEnd) {
						groups++;
					}

					// 2. 天数：按结束时间 (lastServiceDay) 严格筛选
					if (lastServiceDay >= windowStart && lastServiceDay <= windowEnd) {
						const overlapStart = Math.max(o.start, windowStart);
						const overlapEnd = Math.min(tripEnd, windowEnd);

						if (overlapEnd > overlapStart) {
							const overlapDays = Math.ceil((overlapEnd - overlapStart) / (24 * 3600 * 1000));
							if (overlapDays > 0) days += overlapDays;
						}
					}
				});
				return { groups, days };
			};

			// 1. Guides
			const guidesOpt = this.guides.map((g) => {
				const stats = getStatsInWindow(g.user_id, 'guide');
				const score = g.total_score || 0;
				return {
					id: g.user_id,
					name: g.real_name,
					score: score,
					groups: stats.groups,
					days: stats.days,
					displayLabel: `${this.truncateName(g.real_name)} (${score}分 | ${stats.groups}团 | ${stats.days}天)`
				};
			});
			guidesOpt.sort((a, b) => b.score - a.score);
			this.assignmentOptions.guides = guidesOpt;

			// 2. Attendants
			const attOpt = this.processedAttendants.map((a) => {
				const stats = getStatsInWindow(a.user_id, 'attendant');
				return {
					id: a.user_id,
					name: a.real_name,
					score: a.total_score,
					groups: stats.groups,
					days: stats.days,
					displayLabel: `${this.truncateName(a.real_name)} (${a.total_score}分 | ${stats.groups}团 | ${stats.days}天)`
				};
			});
			attOpt.sort((a, b) => b.score - a.score);
			this.assignmentOptions.attendants = attOpt;
		},

		onAttendantChange(selectedItem) {
			if (selectedItem) {
				this.tempAssignment.attendantId = selectedItem.id;
				this.tempAssignment.attendantName = selectedItem.name || selectedItem.real_name;
				this.tempAssignment.attendantObj = selectedItem;
			}
		},
		onGuideChange(selectedItem) {
			if (selectedItem) {
				this.tempAssignment.guideId = selectedItem.id;
				this.tempAssignment.guideName = selectedItem.displayLabel;
				this.tempAssignment.guideObj = selectedItem;
			}
		},

		async saveOrderAssignment() {
			uni.showLoading({ title: '保存中...' });
			try {
				// 1. 处理管家分配 (调用 RPA reassignAgent)
				if (this.tempAssignment.attendantId) {
					const attRes = await rpa.reassignAgent({
						orderId: this.selectedOrder.order_id,
						agentId: this.tempAssignment.attendantId,
						accountName: this.tempAssignment.attendantName
					});

					if (attRes.errCode !== 0) {
						throw new Error(attRes.errMsg || '管家分配失败');
					}

					const attendantInfo = this.processedAttendants.find((a) => a.user_id === this.tempAssignment.attendantId);

					if (attendantInfo && attendantInfo.mobile) {
						// 提取客人姓名 (去除人数后缀)
						let customerName = '详见订单';
						if (this.selectedOrder.raw_data && this.selectedOrder.raw_data[0]?.order_context?.travelers?.[0]?.name) {
							customerName = this.selectedOrder.raw_data[0].order_context.travelers[0].name;
						} else if (this.selectedOrder.travel_users?.[0]?.name) {
							customerName = this.selectedOrder.travel_users[0].name;
						}

						// 格式化日期 (月.日)
						const d = new Date(this.selectedOrder.start);
						const departureDateStr = `${d.getMonth() + 1}.${d.getDate()}`;

						// 发送通知 (不阻塞主流程，异步执行)
						attendantNotifier
							.notifyAttendantAssigned({
								mobile: attendantInfo.mobile,
								orderId: this.selectedOrder.order_id,
								customerName: customerName,
								departureDateStr: departureDateStr
							})
							.then((res) => {
								if (res.errcode === 0) {
									console.log('管家通知发送成功');
								} else {
									// 如果因为未加入企微等原因失败，仅打印日志或轻提示，不打断保存流程
									console.warn('通知发送异常:', res.errmsg);
								}
							})
							.catch((err) => {
								console.error('管家通知接口调用失败:', err);
							});
					} else {
						console.log('该管家无手机号，跳过发送企微通知');
					}

					if (this.selectedOrder.custom_display_text) {
						const oldStaves = this.selectedOrder.staves || [];
						const oldAttendant = oldStaves.find((s) => s.role === 'attendant' || (s.role.includes && s.role.includes('attendant')));
						// 获取旧名字 (优先用 nickname，没有则尝试从 findStaffName 获取)
						const oldName = oldAttendant ? oldAttendant.nickname || this.findStaffName(oldAttendant.id) : '';
						const newName = this.tempAssignment.attendantName; // 已经在 data 中

						// 如果旧名字存在且与新名字不同，且文本中包含旧名字
						if (newName && newName !== oldName) {
							// 1. 拆分
							const parts = this.selectedOrder.custom_display_text.split('##');
							// 2. 对每一段分别处理
							const updatedParts = parts.map((p) => {
								if (oldName && p.includes(oldName)) {
									// 情况A: 包含旧名字 -> 替换
									return p.split(oldName).join(newName);
								} else if (!p.includes(newName)) {
									// 情况B: 不包含旧名字且不包含新名字 -> 追加
									// 检查是否需要加分隔符
									return p + ' | ' + newName;
								}
								return p;
							});
							// 3. 合并
							const newText = updatedParts.join('##');

							// 4. 保存
							if (newText !== this.selectedOrder.custom_display_text) {
								await operationCenter.updateOrderCustomText({
									order_id: this.selectedOrder.order_id,
									text: newText
								});
								this.updateLocalOrderText(this.selectedOrder.order_id, newText);
							}
						}
					}
				}

				// 2. 处理私导分配 (调用 OperationCenter updateOrderStaff)
				if (this.tempAssignment.guideId) {
					// 从 this.guides 中查找完整的私导对象，获取 mobile
					const guideObj = this.guides.find((g) => g.user_id === this.tempAssignment.guideId);

					if (guideObj) {
						const guideInfo = {
							id: guideObj.user_id,
							mobile: guideObj.mobile || '',
							role: ['guide'],
							nickname: guideObj.real_name || ''
						};

						const gRes = await operationCenter.updateOrderStaff({
							snapshot_id: this.selectedOrder._id,
							guide_info: guideInfo
						});

						if (gRes.code !== 0) {
							throw new Error(gRes.msg || '私导分配失败');
						}
					}
				}

				uni.showToast({ title: '分配成功', icon: 'success' });
				this.$refs.popup.close();
				// 刷新数据
				this.initData();
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '保存失败: ' + (e.message || '未知错误'), icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		},

		// 处理 "布"Marker 双击
		handleMarkerDblClick(item) {
			const order = item.original;
			const type = item.subType === 'marker-potala' ? 'potala' : item.label.includes('接') ? 'pickup' : 'dropoff'; // 这里简易判断，严谨点可以用 item 里的数据透传 type

			// 如果是布宫，还是允许移动日期
			if (type === 'potala') {
				uni.showActionSheet({
					itemList: ['修改标记文字', '调整布宫日期'],
					success: (res) => {
						if (res.tapIndex === 0) {
							this.handleManualMarkerInput(order, 'potala', item.label);
						} else {
							// 原有的移动布宫逻辑
							this.openPotalaSelector(order);
						}
					}
				});
			} else {
				// 接送直接修改文字
				this.handleManualMarkerInput(order, type === 'pickup' ? 'pickup' : 'dropoff', item.label);
			}
		},

		// 处理标记文字输入
		handleManualMarkerInput(order, type, defaultText) {
			uni.showModal({
				title: '编辑标记文字',
				editable: true,
				placeholderText: '请输入简短文字 (如: 接、早接)',
				content: defaultText,
				success: async (res) => {
					if (res.confirm) {
						const newText = res.content.trim();
						// 构造新的 markers 对象
						const markers = JSON.parse(JSON.stringify(order.manual_markers || {}));

						if (type === 'potala') {
							if (!markers.potala) markers.potala = { day: 0, text: '布' }; // day暂时不动，只改字
							// 如果原先没有 manual potala，需要先找到它在哪一天（从 itinerary 推断）
							if (!markers.potala.day) {
								const idx = order.itinerary.findIndex((d) => d.day_title.includes('布达拉宫'));
								markers.potala.day = idx !== -1 ? idx + 1 : 2; // 默认第二天
							}
							markers.potala.text = newText;
							// 如果清空文字，视为删除标记？或者依然显示空？这里假设不删除
						} else {
							markers[type] = newText;
						}

						// 保存到后端
						await this.saveManualMarkers(order, markers);
					}
				}
			});
		},

		// 打开布宫选择器
		openPotalaSelector(order) {
			const totalDays = order.total_days;
			const availableDays = [];
			for (let i = 2; i < totalDays; i++) {
				availableDays.push(i);
			}

			// 查找当前布宫位置 (优先 manual, 其次 itinerary)
			let currentDay = 0;
			if (order.manual_markers && order.manual_markers.potala) {
				currentDay = order.manual_markers.potala.day;
			} else {
				const idx = order.itinerary.findIndex((d) => d.day_title && d.day_title.includes('布达拉宫'));
				currentDay = idx + 1;
			}

			const itineraryHasPotala = order.itinerary && order.itinerary.some((d) => d.day_title && d.day_title.includes('布达拉宫'));

			this.potalaMoveData = {
				order: order,
				currentDay: currentDay || 0,
				targetDay: currentDay || 0, // 默认选中当前
				availableDays: availableDays,
				isManualAdd: !itineraryHasPotala
			};
			this.$refs.potalaPopup.open();
		},

		// 1. 切换日期选中状态（反选功能）
		togglePotalaDay(day) {
			if (this.potalaMoveData.targetDay === day) {
				// 如果点击已选中的天，则取消选中
				this.potalaMoveData.targetDay = null;
			} else {
				// 否则选中该天
				this.potalaMoveData.targetDay = day;
			}
		},

		generateDefaultText(order) {
			let guestStr = '客人';
			let countStr = '';

			// 尝试从 raw_data 获取
			if (
				order.raw_data &&
				order.raw_data[0] &&
				order.raw_data[0].order_context &&
				order.raw_data[0].order_context.travelers &&
				order.raw_data[0].order_context.travelers.length > 0
			) {
				guestStr = order.raw_data[0].order_context.travelers[0].name || '未知客人';
				countStr = order.raw_data[0].order_context.travelers.length + '人';
			} else if (order.travel_users && order.travel_users.length > 0) {
				const g = order.travel_users[0];
				guestStr = g.name || g.nickname || '客人';
				countStr = order.travel_users.length + '人';
			}

			if (guestStr && guestStr.indexOf(' ') !== -1) {
				guestStr = guestStr.split(' ')[0];
			}

			let vehicleTypeStr = '';
			if (order.raw_data && order.raw_data[0] && order.raw_data[0].order_context && order.raw_data[0].order_context.vehicle_type) {
				vehicleTypeStr = order.raw_data[0].order_context.vehicle_type;
			}

			const abbrevTitle = this.abbreviateTitle(order.title);
			const vehicle = this.vehicles.find((v) => v._id === order.vehicle_id);
			// const carModel = vehicle ? vehicle.model : ''; // 未使用

			let guideName = '';
			let attendantName = '';
			const salesName = order.sales_name || this.salesMap[order.order_id] || '';
			if (order.staves) {
				const g = order.staves.find((s) => (s.role && s.role.includes('guide')) || s.role === 'guide');
				const att = order.staves.find((s) => s.role === 'attendant' || s.role.includes('attendant'));
				if (g) guideName = this.truncateName(this.findStaffName(g.id));
				if (att) attendantName = this.findStaffName(att.id);
			}

			const rank = order.rank ? `${order.rank}级` : 'D级';

			return `${guestStr}${countStr} ${abbrevTitle} ${vehicleTypeStr ? vehicleTypeStr + ' ' : ''}${rank} ${guideName ? '| ' + guideName : ''} ${
				attendantName ? '| ' + attendantName : ''
			} ${salesName ? '| ' + salesName : ''}`;
		},

		// 确认移动行程
		async confirmPotalaMove() {
			const { order, targetDay, isManualAdd } = this.potalaMoveData;

			// --- 情况 A: 未选择日期 -> 执行删除逻辑 ---
			if (!targetDay) {
				uni.showModal({
					title: '确认移除',
					content: '未选择日期，将移除该布宫标记，确定吗？',
					success: async (res) => {
						if (res.confirm) {
							// 复制并删除 potala 字段
							const markers = JSON.parse(JSON.stringify(order.manual_markers || {}));
							if (markers.potala) {
								markers.potala = { disabled: true };
								await this.saveManualMarkers(order, markers);
								this.$refs.potalaPopup.close();
							}
						}
					}
				});
				return;
			}

			// --- 情况 B: 选择了日期 -> 执行调整逻辑 ---
			if (isManualAdd) {
				// 更新 manual markers
				const markers = JSON.parse(JSON.stringify(order.manual_markers || {}));
				const currentText = markers.potala && markers.potala.text ? markers.potala.text : '布';

				markers.potala = {
					day: targetDay,
					text: currentText,
					disabled: false
				};
				await this.saveManualMarkers(order, markers);
				this.$refs.potalaPopup.close();
			} else {
				// 调用后端 switchItineraryDay (如果需要的话)
				try {
					uni.showLoading({ title: '调整中...' });
					const res = await operationCenter.switchItineraryDay({
						order_id: order.order_id,
						day_a: this.potalaMoveData.currentDay,
						day_b: targetDay
					});
					if (res.code === 0) {
						// 如果存在旧的手动布宫标记，建议将其禁用或删除，以免和真实行程混淆
						if (order.manual_markers && order.manual_markers.potala) {
							const markers = JSON.parse(JSON.stringify(order.manual_markers));
							markers.potala.day = targetDay;
							await operationCenter.updateOrderManualMarkers({
								order_id: order.order_id,
								markers: markers
							});
						}

						rpa
							.handleItineraryChange({
								orderId: order.order_id,
								action: 'swap',
								data: {
									fromIndex: this.potalaMoveData.currentDay - 1,
									toIndex: targetDay - 1
								}
							})
							.then((rpaRes) => {
								console.log('任务交换同步结果:', rpaRes);
							})
							.catch((err) => {
								console.error('任务交换同步失败:', err);
							});

						uni.showToast({ title: '调整成功', icon: 'success' });
						this.$refs.potalaPopup.close();
						this.initData();
					} else {
						throw new Error(res.msg || '调整失败');
					}
				} catch (e) {
					console.error(e);
					uni.showToast({ title: '调整失败: ' + (e.message || ''), icon: 'none' });
				} finally {
					uni.hideLoading();
				}
			}
		},

		// 保存并刷新Marker
		async saveManualMarkers(order, markers) {
			// 这样能确保从无到有添加 Marker 时，所有视图都能感知到变化
			this.updateLocalOrderMarkers(order.order_id, markers);

			try {
				const res = await operationCenter.updateOrderManualMarkers({
					order_id: order.order_id,
					markers: markers
				});
				if (res.code === 0) {
					uni.showToast({ title: '已更新', icon: 'none' });
				}
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '保存失败', icon: 'none' });
			}
		},

		formatDate(ts) {
			return new Date(ts).toLocaleDateString();
		},
		handleTooltipMove(e, title) {
			const clientX = e.clientX || (e.touches && e.touches[0].clientX);
			const clientY = e.clientY || (e.touches && e.touches[0].clientY);
			this.tooltip.text = title;
			this.tooltip.visible = true;
			this.tooltip.x = clientX;
			this.tooltip.y = clientY;
			this.tooltip.isRightSide = clientX > this.windowWidth - 220;
		},
		handleTooltipLeave() {
			this.tooltip.visible = false;
		},

		// 名字截断工具方法 (限制7个汉字)
		truncateName(name) {
			if (!name) return '';
			return name.length > 7 ? name.substring(0, 7) + '...' : name;
		},

		// 获取客人信息 (用于弹窗显示，处理空格截取)
		getGuestInfoStr(order) {
			if (!order) return '';
			let guestStr = '未知';
			let countStr = '0人';

			// 优先从 raw_data 获取
			if (
				order.raw_data &&
				order.raw_data[0] &&
				order.raw_data[0].order_context &&
				order.raw_data[0].order_context.travelers &&
				order.raw_data[0].order_context.travelers.length > 0
			) {
				const t = order.raw_data[0].order_context.travelers[0];
				guestStr = t.name || '未知';
				countStr = order.raw_data[0].order_context.travelers.length + '人';
			} else if (order.travel_users && order.travel_users.length > 0) {
				const g = order.travel_users[0];
				guestStr = g.name || g.nickname || '客人';
				countStr = order.travel_users.length + '人';
			}

			// 处理空格：只取空格前的内容
			if (guestStr.indexOf(' ') !== -1) {
				guestStr = guestStr.split(' ')[0];
			}

			return `${guestStr} (${countStr})`;
		},

		async runBatchFix() {
			uni.showLoading({ title: '处理中...' });
			try {
				const res = await operationCenter.batchCompleteCustomText();
				uni.showModal({ content: res.msg, showCancel: false });
			} catch (e) {
				uni.showToast({ title: '失败:' + e.message, icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		}
	}
};
</script>

<style lang="scss">
/* 变量定义 */
$cell-width: 60px;
$row-height: 50px;
$sidebar-width: 180px;
$header-height: 60px;

$color-guide: #3b82f6;
$color-attendant: #8b5cf6;
$color-vehicle: #10b981;

.scheduler-container {
	display: flex;
	flex-direction: column;
	height: 100%;
	background-color: #f5f7fa;
	overflow: hidden;

	/* 顶部操作栏 */
	.header-bar {
		padding: 10px 20px;
		background: #fff;
		border-bottom: 1px solid #eee;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		height: 70px;
		flex-shrink: 0;

		.header-left {
			display: flex;
			align-items: center;
		}
		.title-section {
			margin-right: 30px;
			.page-title {
				font-size: 18px;
				font-weight: bold;
				color: #1f2937;
				display: block;
			}
			.sub-title {
				font-size: 11px;
				color: #6b7280;
				margin-top: 2px;
				display: block;
			}
		}

		.view-switcher {
			display: flex;
			background: #f3f4f6;
			padding: 4px;
			border-radius: 8px;
			margin-right: auto;
			.switch-item {
				padding: 6px 16px;
				font-size: 13px;
				color: #6b7280;
				border-radius: 6px;
				cursor: pointer;
				display: flex;
				align-items: center;
				&.active {
					background: #fff;
					color: #374151;
					font-weight: 600;
					box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
				}
			}
		}

		.date-picker-section {
			width: 220px;
			flex-shrink: 0;
			position: relative;
			.date-hint {
				font-size: 10px;
				color: #9ca3af;
				text-align: center;
				display: block;
				margin-top: 2px;
			}
		}
	}

	/* 仪表盘 */
	.dashboard-panel {
		display: flex;
		padding: 10px 15px;
		background: #fff;
		border-bottom: 1px solid #e5e7eb;
		gap: 15px;
		flex-wrap: wrap;
		flex-shrink: 0;
		min-height: 50px;

		/* 左侧控制区 */
		.control-group {
			display: flex;
			flex-direction: column;
			width: 150px; /* 固定宽度 */
			flex-shrink: 0;
			gap: 8px;
		}

		.status-card {
			display: flex;
			align-items: center;
			background: #f9fafb;
			border: 1px solid #f3f4f6;
			border-radius: 8px;
			padding: 4px 10px;
			min-width: 140px;
			flex: 1;
			&.active {
				border-color: #3b82f6;
				background-color: #eff6ff;
			}
			.unassigned-stat {
				display: flex;
				flex-direction: column;
				align-items: center;
				margin-left: 10px;
				padding-left: 10px;
				border-left: 1px solid #eee;
				.label {
					font-size: 10px;
					color: #999;
				}
				.value {
					font-size: 14px;
					font-weight: bold;
				}
			}
			.chart-container {
				margin-right: 6px;
				width: 50px;
				height: 50px;
				.donut-chart {
					width: 100%;
					height: 100%;
					border-radius: 50%;
					position: relative;
					display: flex;
					align-items: center;
					justify-content: center;
					.donut-hole {
						width: 70%;
						height: 70%;
						background: #fff;
						border-radius: 50%;
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: center;
						z-index: 2;
						.chart-value {
							font-size: 12px;
							font-weight: bold;
							color: #1f2937;
							line-height: 1;
						}
						.chart-label {
							font-size: 9px;
							color: #9ca3af;
							transform: scale(0.8);
						}
					}
				}
			}
			.status-info {
				display: flex;
				flex: 1;
				flex-direction: row;
				justify-content: center;
				justify-content: space-between;
				.info-text-col {
					display: flex;
					flex-direction: column;
				}
				.info-title {
					font-size: 12px;
					font-weight: 600;
					color: #374151;
					margin-bottom: 4px;
				}
				.info-row {
					display: flex;
					align-items: center;
					font-size: 11px;
					color: #6b7280;
					margin-bottom: 2px;
					.dot {
						width: 6px;
						height: 6px;
						border-radius: 50%;
						&.busy-guide {
							background-color: $color-guide;
						}
						&.busy-attendant {
							background-color: $color-attendant;
						}
						&.future-dot {
							background-color: #9ca3af;
						}
						&.idle {
							background-color: #e5e7eb;
						}
					}
				}
				/* 待分配按钮样式化 */
				.unassigned-btn {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					background: #fee2e2;
					border: 1px solid #fecaca;
					border-radius: 6px;
					padding: 4px 8px;
					cursor: pointer;
					min-width: 50px;
					margin-left: 10px;
					transition: all 0.2s;

					&.active {
						background: #ef4444;
						border-color: #dc2626;
						.label,
						.value {
							color: #fff !important;
						}
					}

					.label {
						font-size: 10px;
						color: #7f1d1d;
						margin-bottom: 2px;
					}
					.value {
						font-size: 14px;
						font-weight: bold;
						color: #dc2626;
						line-height: 1;
					}

					&:hover {
						opacity: 0.9;
					}
				}
			}
		}
		.date-picker-wrapper {
			display: flex;
			align-items: center;
			background: #f3f4f6;
			padding: 4px 12px;
			height: auto;
			width: 100%;
			border-radius: 6px; /* 圆角胶囊样式 */
			cursor: pointer;

			::v-deep .uni-date-x {
				padding: 0;
				background-color: transparent;
			}
			::v-deep .uni-date-x--border {
				border: none;
			}
			::v-deep .uni-date__x-input {
				height: 24px;
				line-height: 24px;
				font-size: 13px;
				text-align: center;
				width: 90px;
			}

			.date-hint {
				font-size: 11px;
				color: #999;
				margin-left: 8px;
				padding-left: 8px;
				border-left: 1px solid #ddd;
			}
		}
		.date-picker-wrapper .uni-date__picker-popup {
			position: fixed !important; /* 改为相对于屏幕定位 */
			left: auto !important;
			right: 20px !important; /* 距离屏幕右边 20px */
			top: 150px !important; /* 需要根据你的顶部高度手动写死 Top 值 */
		}

		/* 缩放条样式 */
		.zoom-wrapper {
			display: flex;
			align-items: center;
			background: #f3f4f6;
			padding: 4px 8px;
			border-radius: 6px;
			.zoom-slider {
				flex: 1;
				margin: 0 8px;
			}
		}

		/* 看板自适应 */
		.adaptive-card {
			flex: 1 0 auto; /* 自然伸缩 */
			min-width: fit-content;
			max-width: none;
			width: auto !important; /* 覆盖原内联样式 */

			.status-info {
				justify-content: space-between; /* 内容两端对齐 */
				padding-left: 10px;
				width: 100%;
			}

			/* 调整文字行布局，防止换行 */
			.info-row {
				white-space: nowrap;
				display: flex;
				align-items: center;
				gap: 8px; /* 内部文字间距 */
			}
		}
	}

	/* Sticky 区域样式 */
	.sticky-header-container,
	.sticky-grid-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		/* 高度由内容撑开，不设 overflow 以便显示 tooltip */
	}
	.sticky-grid-container {
		overflow: hidden; /* X轴需要隐藏溢出 */
	}

	/* 修正 Grid 内的 marker 显示，确保样式通用 */
	.sticky-grid-container .schedule-marker,
	.sticky-grid-container .schedule-bar {
		/* 继承原有样式 */
		position: absolute;
		top: 10px;
		height: 22px;
	}

	/* --- 甘特图视口 --- */
	.gantt-viewport {
		flex: 1;
		position: relative;
		overflow: hidden;
		background: #fff;
		cursor: grab;
		&:active {
			cursor: grabbing;
		}

		.corner-fixed {
			position: absolute;
			top: 0;
			left: 0;
			width: $sidebar-width;
			height: $header-height;
			background: #f9fafb;
			border-right: 1px solid #e5e7eb;
			border-bottom: 1px solid #e5e7eb;
			z-index: 30;
			display: flex;
			align-items: center;
			justify-content: center;
			padding-left: 0 !important;
			font-size: 14px;
			color: #4b5563;
			font-weight: 600;
			.focus-btn {
				display: flex;
				align-items: center;
				padding: 6px 12px;
				background: #e5e7eb;
				border-radius: 20px;
				transition: all 0.2s;
				color: #666;
				font-size: 12px;

				&.active {
					background: #3b82f6;
					color: #fff;
					box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
				}
				.ml-1 {
					margin-left: 4px;
				}
			}
		}

		.header-viewport {
			position: absolute;
			top: 0;
			left: $sidebar-width;
			right: 0;
			height: $header-height;
			overflow: hidden;
			background: #f9fafb;
			border-bottom: 1px solid #e5e7eb;
			z-index: 20;
			.header-content {
				display: flex;
				height: 100%;
				will-change: transform;
				.date-cell {
					width: var(--cell-width, 60px);
					flex-shrink: 0;
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					border-right: 1px solid #f3f4f6;
					position: relative;
					&.is-monday {
						background-color: rgba(254, 65, 65, 0.5); /* 淡淡的红色 */
						color: #dc2626;
					}
					.month-tag {
						position: absolute;
						top: 3px; /* 距离顶部2px */
						left: 0;
						width: 100%;
						text-align: center;
						font-size: 10px;
						font-weight: bold;
						color: #3b82f6; /* 使用主色调蓝，或者用 #ef4444 醒目红 */
						line-height: 1;
						z-index: 5;
					}
					.day-num {
						font-size: 16px;
						font-weight: 600;
						color: #374151;
						margin-top: 4px;
					}
					.week-num {
						font-size: 11px;
						color: #9ca3af;
						margin-top: 2px;
					}
					&.is-weekend {
						background-color: #f9fafb;
						.week-num {
							color: #f59e0b;
						}
					}
					&.is-today {
						background-color: #eff6ff;
						.day-num {
							color: $color-guide;
						}
					}
				}
			}
		}

		.sidebar-viewport {
			position: absolute;
			top: $header-height;
			left: 0;
			width: $sidebar-width;
			bottom: 0;
			overflow: hidden;
			background: #fff;
			border-right: 1px solid #e5e7eb;
			z-index: 20;
			.sidebar-content {
				will-change: transform;
				.group-title {
					background: #f3f4f6;
					color: #6b7280;
					font-size: 12px;
					padding: 5px 10px;
					font-weight: 600;
					height: 26px;
					line-height: 26px;
					&.sortable-header {
						display: flex;
						justify-content: space-between;
						align-items: center;
						cursor: pointer;
						.sort-icon {
							font-size: 10px;
							opacity: 0.5;
							&.active {
								opacity: 1;
								color: $color-guide;
								font-weight: bold;
							}
						}
					}
				}
				.resource-item {
					height: $row-height;
					padding: 5px 10px;
					border-bottom: 1px solid #f3f4f6;
					display: flex;
					flex-direction: column;
					justify-content: center;
					position: relative;
					.name-row {
						display: flex;
						justify-content: space-between;
						align-items: center;
						width: 100%;
					}
					.name {
						font-size: 13px;
						color: #374151;
						font-weight: 500;
						overflow: hidden;
						white-space: nowrap;
						text-overflow: ellipsis;
						max-width: 80px;
					}
					.sat-val {
						font-size: 10px;
						color: #9ca3af;
						transform: scale(0.9);
						transform-origin: right center;
						&.text-green {
							color: #10b981;
						}
						&.text-orange {
							color: #f59e0b;
						}
						&.text-red {
							color: #ef4444;
						}
					}
					.sub-info {
						font-size: 10px;
						color: #9ca3af;
						margin-top: 2px;
					}

					/* 饱和度条 */
					.sat-bar-bg {
						position: absolute;
						bottom: 0;
						left: 0;
						right: 0;
						height: 2px;
						background: #f3f4f6;
					}
					.sat-bar-fill {
						height: 100%;
						transition: width 0.3s;
						&.guide-fill {
							background: $color-guide;
						}
						&.attendant-fill {
							background: $color-attendant;
						}
					}
				}
			}
		}

		.grid-viewport {
			position: absolute;
			top: $header-height;
			left: $sidebar-width;
			right: 0;
			bottom: 0;
			overflow: hidden;
			z-index: 10;
			.grid-content {
				will-change: transform;
				.group-spacer-row {
					height: 26px;
					background: #fcfcfc;
				}
				.timeline-row {
					height: $row-height;
					position: relative;
					border-bottom: 1px solid #f3f4f6;
					.grid-bg {
						display: flex;
						height: 100%;
						position: absolute;
						top: 0;
						left: 0;
						right: 0;
						z-index: 0;
						.grid-cell {
							width: var(--cell-width, 60px);
							height: 100%;
							border-right: 1px dashed #e5e7eb;
							flex-shrink: 0;
							&.is-monday {
								background-color: rgba(254, 65, 65, 0.3);
							}
							&.is-weekend {
								background-color: #f9fafb;
							}
						}
					}
					.schedule-bar {
						position: absolute;
						top: 10px;
						bottom: 10px;
						border-radius: 3px;
						z-index: 1;
						padding: 0 4px;
						display: flex;
						align-items: center;
						font-size: 10px;
						color: #fff;
						overflow: visible;
						white-space: nowrap;
						box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
						cursor: pointer;
						transition: transform 0.1s;
						&.is-selected-order {
							border: 2px solid rgba(59, 130, 246, 0.5); /* 红色边框 */
							transform: scaleY(1.1);
							z-index: 10; /* 浮起，防止被遮挡 */
							box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
						}
						&:active {
							transform: scale(0.98);
						}
						&.guide-bar {
							background-color: $color-guide;
						}
						&.attendant-bar {
							background-color: $color-attendant;
							z-index: 1;
						}
						.bar-text {
							font-weight: 500;
							opacity: 1;
							line-height: 1;
							display: block;
							flex: 1;
							width: 0;
							white-space: nowrap;
							overflow: hidden;
							text-overflow: ellipsis;
						}
						&.is-short {
							padding: 0;
							justify-content: center;
							.bar-text {
								font-size: 10px;
								transform: scale(0.9);
								text-overflow: clip;
							}
						}
					}
					.schedule-marker {
						position: absolute;
						top: 10px;
						bottom: 10px;
						border-radius: 4px;
						z-index: 5;
						display: flex;
						align-items: center;
						justify-content: center;
						box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
						cursor: pointer;
						.marker-text {
							color: #fff;
							font-size: 10px !important; /* 强制缩小字体 */
							font-weight: normal; /* 稍微减重以便显示更多字 */
							transform: scale(0.85); /* 进一步缩小以容纳更多文字 */
							white-space: nowrap;
							overflow: hidden; /* 防止溢出 */
							max-width: 100%;
						}
						&.marker-pickup,
						.marker-dropoff {
							background-color: #fbcfe8;
							color: #9d174d;
							border: 1px solid #f9a8d4;
							.marker-text {
								color: #9d174d !important;
							}
						}
						&.marker-potala {
							background-color: #ef4444;
						}
					}
				}
			}
		}
	}

	.vehicle-group,
	.vehicle-bar {
		display: none;
	}
	.attendant-group {
		border-top: 1px solid #e5e7eb;
	}

	.scroll-legend {
		max-height: 60px;
		overflow-y: auto;
		margin-top: 5px;
		.info-row {
			margin-bottom: 4px;
			font-size: 11px;
			display: flex;
			align-items: center;
			color: #4b5563;
			.dot {
				width: 8px;
				height: 8px;
				border-radius: 2px;
				margin-right: 6px;
				flex-shrink: 0;
			}
		}
	}

	.stats-wrapper {
		flex: 1;
		background: #f5f7fa;
		height: 100%;
		overflow: hidden;
		.stats-container {
			padding: 20px;
		}
	}
	.loading-state {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 400px;
		color: #9ca3af;
	}

	.popup-content {
		padding: 24px;
		background: #fff;
		.popup-header {
			font-size: 16px;
			font-weight: 600;
			margin-bottom: 20px;
			text-align: center;
			color: #111;
		}
		.popup-row {
			margin-bottom: 12px;
			font-size: 14px;
			color: #374151;
			display: flex;
			.label {
				width: 80px;
				color: #6b7280;
			}
			.value {
				flex: 1;
				color: #111;
				font-weight: 500;
			}
		}
		.close-btn {
			margin-top: 24px;
			background: #f3f4f6;
			color: #4b5563;
			font-size: 14px;
			border: none;
			padding: 10px;
			border-radius: 8px;
		}
	}
	.global-tooltip {
		position: fixed;
		z-index: 9999;
		background-color: rgba(0, 0, 0, 0.85);
		color: #fff;
		padding: 6px 10px;
		border-radius: 4px;
		font-size: 12px;
		line-height: 1.4;
		max-width: 200px;
		pointer-events: none;
		transform: translate(12px, 12px);
		&.align-left {
			transform: translate(calc(-100% - 12px), 12px);
		}
	}
}

/* 侧边栏工具栏 */
.sidebar-toolbar {
	height: 40px;
	border-bottom: 1px solid #eee;
	background: #f9fafb;
	display: flex;
	align-items: center;
	padding: 0 8px;
	font-size: 12px;
	.tool-row {
		display: flex;
		align-items: center;
		width: 100%;
		justify-content: space-between;
	}
	.focus-switch {
		padding: 4px 12px;
		border-radius: 14px;
		background: #e5e7eb;
		color: #666;
		font-size: 11px;
		cursor: pointer;
		&.active {
			background: #3b82f6;
			color: #fff;
		}
	}
}

.flex {
	display: flex;
}
.items-center {
	align-items: center;
}
.mr-1 {
	margin-right: 4px;
}

.check-box-mini {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
}

.unassigned-bar {
	background-color: #9ca3af !important;
	border: 1px solid #6b7280;
	opacity: 0.8;
	.bar-text {
		color: #fff;
	}
	&.is-selected-order {
		// background-color: #ef4444 !important; /* 选中变红 */
		border: 2px solid rgba(59, 130, 246, 0.5); /* 加粗边框 */
		z-index: 10; /* 浮起 */
		opacity: 1;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}
}

/* 侧边栏管家条目 */
.resource-item {
	border-bottom: 1px solid #f3f4f6;
	box-sizing: border-box;
	display: flex; /* 让高度自适应 */
	flex-direction: column;
	justify-content: center; /* 内容垂直居中 */
	padding: 0 4px;

	.flex-row {
		display: flex;
		align-items: center;
		height: 100%;
	}
	.check-box {
		width: 24px;
		display: flex;
		justify-content: center;
	}
	.info-col {
		flex: 1;
		overflow: hidden;
	}
	.name-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		.name {
			font-weight: bold;
			font-size: 13px;
		}
		.score-tag {
			font-size: 10px;
			border: 1px solid;
			padding: 0 2px;
			border-radius: 3px;
			transform: scale(0.9);
		}
	}
	.stats-row {
		font-size: 10px;
		color: #999;
		margin-top: 2px;
		display: flex;
		align-items: center;
	}
}

/* 未分配区域 */
.unassigned-title {
	background: #fee2e2;
	color: #dc2626;
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.unassigned-bar {
	background-color: #7c7f82 !important; /* 强制灰色 */
	border: 1px dashed #9ca3af;
}
.text-red {
	color: #dc2626;
}

/* Grid 区域动态行 */
.timeline-row {
	border-bottom: 1px solid #eee;
	box-sizing: border-box;
	/* 高度由 style 动态控制 */
}
.schedule-bar {
	height: 22px !important; /* 变细一点，适应紧凑布局 */
	font-size: 10px;
	-webkit-user-select: none;
	user-select: none;
}
.schedule-marker {
	height: 22px !important;
	-webkit-user-select: none;
	user-select: none;
	&.is-selected-order {
		border: 2px solid rgba(59, 130, 246, 0.5);
		transform: scale(1.1);
		z-index: 11;
	}
}
.group-title-placeholder {
	height: 26px; /* 对应 sidebar title 高度 */
	background: #fcfcfc;
	border-bottom: 1px dashed #eee;
}

/* 侧边栏样式微调，防止挤压 */
.sidebar-viewport .sidebar-content .group-title.sortable-header {
	padding-right: 5px;
	.flex {
		flex: 1;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.sort-icon {
		flex-shrink: 0;
		margin-left: 5px;
	}
}

/* Popup Styles for Assignment */
.popup-divider {
	height: 1px;
	background: #eee;
	margin: 15px 0;
}
.assign-row {
	display: flex;
	align-items: center;
	margin-bottom: 15px;
	.label {
		width: 80px;
		font-size: 14px;
		color: #666;
	}
	.picker-box {
		border: 1px solid #ddd;
		padding: 8px 10px;
		border-radius: 4px;
		font-size: 14px;
		color: #333;
		background: #f9f9f9;
		.placeholder {
			color: #aaa;
		}
	}
	.flex-1 {
		flex: 1;
	}
}
.btn-group {
	display: flex;
	justify-content: center;
	align-items: center;
	button {
		width: 240px;
		font-size: 13px;
		height: 36px;
		line-height: 36px;
		border-radius: 18px !important;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		&::after {
			border: none; /* 去除 uni-app 默认边框 */
		}
		&.save-btn {
			background: #10b981;
			color: #fff;
			box-shadow: 0 2px 5px rgba(16, 185, 129, 0.3);
			&:active {
				background: #059669;
			}
		}
		&.close-btn {
			background: #f3f4f6;
			color: #4b5563;
			&:active {
				background: #e5e7eb;
			}
		}
	}
}

/* 分配区域新布局 */
.assign-section {
	display: flex;
	gap: 15px; /* 两个卡片之间的间距 */
	margin-bottom: 15px;

	.assign-item {
		flex: 1;
		min-width: 0;
		position: relative; // 确保定位基准

		.assign-label {
			display: block;
			font-size: 13px;
			color: #666;
			margin-bottom: 6px;
		}

		::v-deep .custom-picker-wrapper {
			.picker-trigger {
				width: 100% !important;
				max-width: none !important;
				box-sizing: border-box;
			}
			// 下拉框样式覆盖
			.custom-dropdown-options {
				top: auto !important; //不仅要覆盖，还要强制取消 top 定位
				bottom: 100% !important; // 向上展开
				left: 0 !important; // 靠左对齐
				right: auto !important; // 取消右对齐
				margin-bottom: 5px; // 留点间距
				width: 100% !important;
				min-width: 300px;

				// 增加阴影使其在上方更明显
				box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
			}
		}
	}
}

/* 提示文字样式 */
.tips-box {
	display: flex;
	align-items: center;
	background: #fff7ed;
	padding: 8px 12px;
	border-radius: 6px;
	margin-bottom: 20px;
	border: 1px solid #ffedd5;

	text {
		font-size: 12px;
		color: #f97316;
		font-weight: 500;
	}
}

.bar-edit-input {
	width: 100%;
	height: 100%;
	background: #fff;
	border: none;
	outline: none;
	font-size: 10px; /* 保持和原有 bar-text 一致 */
	color: #333;
	padding: 0 4px;
	border-radius: 2px;
}
</style>
