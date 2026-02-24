<template>
	<view class="px-5 py-3">
		<view class="uni-header">
			<view class="uni-group">
				<button type="default" size="mini" @click="goBack">返回</button>
				<view class="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center ml-5">
					<i class="fas fa-paper-plane text-white text-xs"></i>
				</view>
				<view class="uni-title ml-2">行中推荐任务管理</view>
			</view>
			<view class="uni-group">
				<picker mode="selector" :range="filterAttendantList" range-key="nickname" :value="filterAttendantIndex" @change="onFilterAttendantChange" style="margin-right: 10px">
					<button class="uni-button" type="default" size="mini" plain>
						{{ filterAttendantIndex > -1 && filterAttendantList[filterAttendantIndex] ? filterAttendantList[filterAttendantIndex].nickname : '全部' }}
						<uni-icons type="bottom" size="12" class="ml-1"></uni-icons>
					</button>
				</picker>

				<view style="width: 240px; margin-right: 10px">
					<uni-datetime-picker type="daterange" v-model="filterDateRange" @change="onDateChange" placeholder="请选择出发日期范围" />
				</view>

				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="搜索订单号 / 客人姓名" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
				<button class="uni-button" type="default" size="mini" @click="refreshData">
					<uni-icons type="refreshempty" size="14"></uni-icons>
					刷新
				</button>

				<!-- <button class="uni-button" type="primary" size="mini" plain @click="navigateTo('./migration')" style="margin-right: 10px">
					<uni-icons type="loop" size="14" color="#007aff"></uni-icons>
					数据迁移
				</button> -->
				<!-- <button class="uni-button" type="primary" size="mini" plain @click="batchFixWeather">
					<uni-icons type=" tune" size="14" color="#007aff"></uni-icons>
					校准天气占位符
				</button> -->
			</view>
			<view class="uni-group">
				<button class="uni-button" type="primary" size="mini" plain @click="navigateTo('./global-queue')" style="margin-right: 10px; border-color: #8b5cf6; color: #8b5cf6">
					<uni-icons type="list" size="14" color="#8b5cf6"></uni-icons>
					全局队列管理
				</button>
				<button class="uni-button" type="warn" size="mini" plain @click="navigateTo('./failed-list')" style="margin-right: 10px">
					<uni-icons type="info" size="14" color="#dc2626"></uni-icons>
					查看失败任务
				</button>
				<!-- <button class="uni-button" type="warn" plain size="mini" @click="openBatchStopModal" style="margin-right: 10px">
					<uni-icons type="calendar-filled" size="14" color="#dc2626"></uni-icons>
					规定时间暂停
				</button> -->
				<button
					class="uni-button"
					type="primary"
					size="mini"
					plain
					@click="navigateTo('./batch')"
					style="margin-right: 10px; margin-left: 10px; border-color: #16a34a; color: #16a34a">
					<uni-icons type="paperplane-filled" size="14" color="#16a34a"></uni-icons>
					定时批量任务
				</button>
				<button class="uni-button" type="primary" size="mini" @click="navigateTo('./add')">新建任务</button>
			</view>
		</view>

		<view class="uni-container">
			<unicloud-db
				ref="udb"
				collection="a-task-orders"
				field="order_id,account_name,crawl_status,snapshot_status,ai_status,created_at,raw_data"
				:where="where"
				page-data="replace"
				:orderby="orderby"
				:getcount="true"
				:page-size="20"
				v-slot:default="{ data, pagination, loading, error, options }">
				<uni-table :loading="loading" :emptyText="error.message || '暂无任务数据'" border stripe>
					<uni-tr>
						<uni-th align="center" width="150">
							<view class="flex items-center justify-center cursor-pointer" @click="handleManualSort('raw_data.0.order_context.trip_dates')">
								<text class="mr-1">订单信息</text>
								<view class="flex flex-col" style="line-height: 0.5">
									<uni-icons
										v-if="currentSortField === 'raw_data.0.order_context.trip_dates'"
										:type="currentSortOrder === 'asc' ? 'up' : 'down'"
										size="14"
										color="#2563eb"></uni-icons>
									<uni-icons v-else type="down" size="14" color="#e5e7eb"></uni-icons>
								</view>
							</view>
						</uni-th>
						<uni-th align="center">客人姓名 (点击切换)</uni-th>
						<uni-th align="center">管家 (执行账号)</uni-th>
						<uni-th align="center" width="120">1. 抓取状态</uni-th>
						<uni-th align="center" width="120">2. 快照同步</uni-th>
						<uni-th align="center" width="120">3. AI处理</uni-th>
						<uni-th align="center" width="150">
							<view class="flex items-center justify-center cursor-pointer" @click="handleManualSort('created_at')">
								<text class="mr-1">创建时间</text>
								<view class="flex flex-col" style="line-height: 0.5">
									<uni-icons v-if="currentSortField === 'created_at'" :type="currentSortOrder === 'asc' ? 'up' : 'down'" size="14" color="#2563eb"></uni-icons>
									<uni-icons v-else type="down" size="14" color="#e5e7eb"></uni-icons>
								</view>
							</view>
						</uni-th>
						<uni-th align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item, index) in data" :key="index">
						<uni-td align="center">
							<view class="font-bold text-gray-700">{{ item.order_id }}</view>
							<view v-if="getTripInfo(item)">
								<view class="text-xs text-gray-500 mt-1">{{ getTripInfo(item).date }} ({{ getTripInfo(item).days }}天)</view>
							</view>
						</uni-td>

						<uni-td align="center">
							<view class="flex items-center justify-center gap-1 cursor-pointer hover:bg-gray-100 rounded py-1" @click.stop="openEditOrderModal(item)">
								<text class="font-bold text-gray-700">{{ getCustomerName(item) }}</text>

								<uni-icons type="compose" size="14" color="#2563eb" class="ml-1"></uni-icons>
							</view>
						</uni-td>

						<uni-td align="center">
							<view class="flex items-center justify-center gap-2">
								<text v-if="item.account_name" class="font-bold text-blue-600">{{ item.account_name }}</text>
								<text v-else class="text-gray-400 text-xs">未分配</text>
								<uni-icons type="compose" size="16" color="#f59e0b" class="cursor-pointer" @click="openAssignModal(item)"></uni-icons>
							</view>
						</uni-td>

						<uni-td align="center">
							<view class="flex gap-2">
								<view :class="getStatusClass(item.crawl_status)">{{ getStatusText(item.crawl_status) }}</view>
								<view class="mini-icon-btn" :class="item.ai_status === 'failed' ? 'btn-red' : 'btn-blue'" @click.stop="retryCrawl(item)">
									<uni-icons
										style="font-weight: bold"
										:type="item.crawl_status === 'failed' ? 'refresh-filled' : 'refreshempty'"
										size="16"
										:color="item.crawl_status === 'failed' ? '#dc2626' : '#2563eb'"></uni-icons>
								</view>
							</view>
						</uni-td>

						<uni-td align="center">
							<view class="flex gap-2">
								<view :class="getStatusClass(item.snapshot_status)">{{ getStatusText(item.snapshot_status || 'pending') }}</view>
								<view v-if="item.crawl_status === 'done'" class="mini-icon-btn" :class="item.ai_status === 'failed' ? 'btn-red' : 'btn-blue'" @click.stop="retrySnapshot(item)">
									<uni-icons
										style="font-weight: bold"
										:type="item.snapshot_status === 'failed' ? 'refresh-filled' : 'refreshempty'"
										size="16"
										:color="item.snapshot_status === 'failed' ? '#dc2626' : '#2563eb'"></uni-icons>
								</view>
							</view>
						</uni-td>

						<uni-td align="center">
							<view class="flex gap-2">
								<view :class="getStatusClass(item.ai_status)">{{ getStatusText(item.ai_status) }}</view>
								<view v-if="item.snapshot_status === 'done'" class="mini-icon-btn" :class="item.ai_status === 'failed' ? 'btn-red' : 'btn-blue'" @click.stop="retryAI(item)">
									<uni-icons
										style="font-weight: bold"
										:type="item.ai_status === 'failed' ? 'refresh-filled' : 'refreshempty'"
										size="16"
										:color="item.ai_status === 'failed' ? '#dc2626' : '#2563eb'"></uni-icons>
								</view>
							</view>
						</uni-td>
						<uni-td align="center">
							<uni-dateformat :date="item.created_at" format="yyyy-MM-dd hh:mm"></uni-dateformat>
						</uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button class="uni-button" size="mini" type="primary" @click="navigateTo('./queue?id=' + item._id + '&order=' + item.order_id)">查看队列</button>
								<button class="uni-button" size="mini" type="warn" @click="confirmDelete(item._id)">删除</button>
							</view>
						</uni-td>
					</uni-tr>
				</uni-table>
				<view class="uni-pagination-box">
					<uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current" :total="pagination.count" @change="onPageChanged" />
				</view>
			</unicloud-db>
		</view>

		<view v-if="showBatchStopModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" style="background-color: rgba(0, 0, 0, 0.5)">
			<view class="bg-white rounded-lg w-11/12 md:w-1/2 p-5 shadow-lg max-h-90vh flex flex-col">
				<view class="text-lg font-bold mb-4 border-b pb-2">
					<uni-icons type="info-filled" size="24" color="#f59e0b"></uni-icons>
					全局批量暂停任务
				</view>
				<view class="flex justify-end gap-3 pt-3 border-t">
					<button size="mini" type="default" @click="closeBatchStopModal">关闭</button>
					<button size="mini" type="warn" :disabled="batchList.length === 0" @click="executeGlobalBatchStop">确认暂停 ({{ batchList.length }})</button>
				</view>
			</view>
		</view>

		<uni-popup ref="assignPopup" type="center" :is-mask-click="false" background-color="#fff">
			<view class="assign-popup-container">
				<view class="popup-header-bar">
					<view>
						<text class="text-lg font-bold">分配管家</text>
						<text class="text-sm text-gray-500 ml-2">订单: {{ editingTask.order_id }}</text>
					</view>
					<uni-icons type="closeempty" size="24" color="#666" @click="$refs.assignPopup.close()" class="cursor-pointer"></uni-icons>
				</view>

				<view class="popup-body">
					<view class="left-panel">
						<view class="panel-section" style="height: 100%">
							<view class="section-title">管家列表与统计 ({{ currentViewLabel }})</view>
							<scroll-view scroll-y class="attendant-list-scroll">
								<view
									v-for="att in attendantList"
									:key="att._id"
									class="attendant-item"
									:class="{ 'is-selected': isAttendantSelected(att._id) }"
									@click="toggleAttendantSelect(att._id)">
									<view class="flex items-center justify-between w-full mb-1">
										<view class="flex items-center">
											<view class="color-dot" :style="{ backgroundColor: att.color }"></view>
											<text class="att-name">{{ att.nickname }}</text>
										</view>
										<view class="flex items-center">
											<text class="att-score mr-2">{{ att.total_score }}分</text>
											<uni-icons v-if="isAttendantSelected(att._id)" type="checkbox-filled" color="#2563eb" size="18"></uni-icons>
											<uni-icons v-else type="circle" color="#e5e7eb" size="18"></uni-icons>
										</view>
									</view>

									<view class="stat-row-merged">
										<text>本期出发: {{ att.stats.startCount }}</text>
										<text class="ml-2">结束: {{ att.stats.endCount }}</text>
									</view>
								</view>
							</scroll-view>
						</view>
					</view>

					<view class="right-panel">
						<view class="calendar-toolbar">
							<view class="mode-switch">
								<view class="mode-btn" :class="{ active: viewMode === 'current' }" @click="switchViewMode('current')">本月</view>
								<view class="mode-btn" :class="{ active: viewMode === 'next' }" @click="switchViewMode('next')">次月</view>

								<view class="relative inline-block">
									<view class="mode-btn" :class="{ active: viewMode === 'custom' }" @click="toggleRangePicker">
										自定义时段
										<uni-icons v-if="viewMode === 'custom'" type="bottom" size="12" color="#2563eb"></uni-icons>
									</view>
									<view v-if="showRangePicker" class="absolute-picker-box">
										<uni-datetime-picker type="daterange" v-model="customDateRange" @change="onRangePicked" :border="false" />
									</view>
								</view>
							</view>
							<view class="current-range-label">{{ dateRangeLabel }}</view>
						</view>

						<view class="week-header">
							<view class="week-cell" v-for="d in ['日', '一', '二', '三', '四', '五', '六']" :key="d">{{ d }}</view>
						</view>

						<scroll-view scroll-y class="calendar-body">
							<view v-if="attendantLoading" class="loading-mask">加载排期中...</view>

							<view v-for="(week, wIdx) in calendarWeeks" :key="wIdx" class="calendar-week-row">
								<view
									v-for="(day, dIdx) in week"
									:key="dIdx"
									class="calendar-day-cell"
									:class="{ 'is-other-month': day.isOtherMonth, 'is-today': day.isToday }"
									@click="onDayClick(day)">
									<view class="day-header">
										<text class="day-num">{{ day.dayNum }}</text>
										<view v-if="day.totalOrders > 0" class="day-badge">{{ day.totalOrders }}</view>
									</view>

									<view class="lines-container">
										<block v-for="(line, lIdx) in day.lines" :key="lIdx">
											<view
												v-if="line.type === 'line'"
												class="order-line"
												:style="{ backgroundColor: line.color, width: line.isEnd ? '90%' : '100%' }"
												:class="{ 'is-start': line.isStart }"></view>
											<view v-else class="line-spacer"></view>
										</block>
									</view>
								</view>
							</view>
						</scroll-view>

						<view class="action-footer">
							<view class="flex items-center">
								<text class="text-sm mr-2">当前分配给：</text>
								<picker mode="selector" :range="attendantList" range-key="nickname" :value="getPickerIndex()" @change="onPickerChange" class="flex-1 mr-5">
									<view class="picker-box">
										<text v-if="tempAccountName" class="font-bold text-blue-600 text-lg min-w-36">{{ tempAccountName }}</text>
										<text v-else class="text-gray-400">点击选择管家</text>
										<uni-icons type="bottom" size="14" color="#666" class="ml-1"></uni-icons>
									</view>
								</picker>
								<button size="mini" type="primary" :disabled="!tempAccountName" @click="saveAssign">确认分配</button>
							</view>
						</view>
					</view>
				</view>
			</view>
		</uni-popup>

		<uni-popup ref="dayDetailPopup" type="dialog">
			<uni-popup-dialog type="info" :title="selectedDateInfo.title" :before-close="true" @close="$refs.dayDetailPopup.close()" @confirm="$refs.dayDetailPopup.close()">
				<view class="day-detail-content" v-if="selectedDateInfo">
					<view class="detail-stat-grid">
						<view class="stat-box blue">
							<text class="num">{{ selectedDateInfo.stats.pendingStart }}</text>
							<text class="lbl">待出行</text>
						</view>
						<view class="stat-box green">
							<text class="num">{{ selectedDateInfo.stats.ongoing }}</text>
							<text class="lbl">进行中</text>
						</view>
						<view class="stat-box gray">
							<text class="num">{{ selectedDateInfo.stats.ended }}</text>
							<text class="lbl">已结束</text>
						</view>
					</view>

					<view class="task-stat-section">
						<view class="section-head">行中任务执行情况</view>
						<view v-if="taskStatLoading" class="py-2 text-center text-gray-400 text-xs">统计中...</view>
						<view v-else class="flex justify-around py-2">
							<view class="text-center">
								<view class="text-lg font-bold text-green-600">{{ selectedDateInfo.taskStats.executed }}</view>
								<text class="text-xs text-gray-500">已执行日志</text>
							</view>
							<view class="text-center">
								<view class="text-lg font-bold text-orange-500">{{ selectedDateInfo.taskStats.pending }}</view>
								<text class="text-xs text-gray-500">待执行队列</text>
							</view>
						</view>
					</view>

					<view class="order-list-mini">
						<view class="text-xs font-bold mb-1 text-gray-700">关联订单 ({{ selectedDateInfo.orders.length }})：</view>
						<scroll-view scroll-y style="max-height: 120px">
							<view v-for="(o, i) in selectedDateInfo.orders" :key="i" class="mini-order-row">
								<view class="dot" :style="{ background: o.color }"></view>
								<text class="o-name">{{ o.attendantName }}</text>
								<text class="o-info">{{ o.order_id }} ({{ o.statusText }})</text>
							</view>
						</scroll-view>
					</view>
				</view>
			</uni-popup-dialog>
		</uni-popup>

		<uni-popup ref="editOrderPopup" type="center" background-color="#fff">
			<view class="bg-white rounded-lg p-5 w-full" style="max-width: 1000px">
				<view class="text-lg font-bold mb-4 border-b pb-2">修改订单信息</view>

				<view class="mb-4">
					<view class="text-sm font-bold text-gray-700 mb-2">行程日期</view>
					<uni-datetime-picker type="daterange" v-model="editForm.dateRange" :border="true" />
				</view>

				<view class="mb-4">
					<view class="flex justify-between items-center mb-2">
						<view class="text-sm font-bold text-gray-700">客人名单 ({{ editForm.travelers.length }}人)</view>
						<button size="mini" type="primary" plain @click="addTraveler">+ 添加</button>
					</view>

					<scroll-view scroll-y style="max-height: 300px">
						<view
							v-for="(t, index) in editForm.travelers"
							:key="index"
							class="flex flex-col mb-2 p-2 bg-gray-50 rounded border"
							:class="{ 'border-blue-500 bg-blue-50': index === 0 }">
							<view class="flex items-center gap-2">
								<view class="flex-1">
									<view class="flex items-center mb-1">
										<text v-if="index === 0" class="text-xs text-white bg-blue-500 px-1 rounded mr-1">显示</text>
										<input class="uni-input text-sm font-bold border-b border-gray-200 flex-1" v-model="t.name" placeholder="姓名" />
									</view>
									<input class="uni-input text-xs text-gray-500" v-model="t.phone" placeholder="电话 (选填)" />
								</view>
								<uni-icons type="trash" size="18" color="#dc2626" @click="removeTraveler(index)" class="cursor-pointer"></uni-icons>
							</view>

							<view v-if="index > 0" class="flex justify-end mt-1 pt-1 border-t border-gray-200 border-dashed">
								<view class="text-xs text-blue-600 cursor-pointer flex items-center" @click="setAsMainTraveler(index)">
									<uni-icons type="arrow-up" size="12" color="#2563eb"></uni-icons>
									设为显示
								</view>
							</view>
						</view>
					</scroll-view>
				</view>

				<view class="flex justify-end gap-3 pt-3 border-t mt-2">
					<button size="mini" type="default" @click="$refs.editOrderPopup.close()">取消</button>
					<button size="mini" type="primary" @click="saveOrderInfo">保存修改</button>
				</view>
			</view>
		</uni-popup>

		<!-- <view v-if="showRangePicker" class="fixed-picker-mask">
			<view class="bg-white p-4 rounded-lg">
				<view class="mb-2 font-bold">选择自定义时段</view>
				<uni-datetime-picker type="daterange" v-model="customDateRange" @change="onRangePicked" />
				<button class="mt-4" size="mini" @click="showRangePicker = false">关闭</button>
			</view>
		</view> -->
	</view>
</template>

<script>
const db = uniCloud.database();
const operationCenter = uniCloud.importObject('a-operation-center'); // 引入运算中心用于查排期
const attendantNotifier = uniCloud.importObject('attendant-notifier');
const rpa = uniCloud.importObject('a-task-rpa');
import CustomPicker from '@/components/custom-picker/custom-picker.vue';
import { toRaw } from 'vue';

const PALETTE = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'];

export default {
	components: {
		CustomPicker
	},
	data() {
		return {
			filterDateRange: [],
			query: '',
			where: '',
			orderby: 'created_at desc',
			currentSortField: 'created_at', // 默认排序字段
			currentSortOrder: 'desc', // 默认排序方向
			showBatchStopModal: false,
			batchStartTime: '',
			batchEndTime: '',
			batchList: [],
			hasSearched: false,

			// --- 分配管家相关数据 ---
			editingTask: {}, // 当前正在编辑的任务
			attendantList: [],
			selectedAttendantIds: [], // 筛选器选中的ID
			tempAccountName: '', // 临时选中的管家名

			filterAttendantList: [{ nickname: '全部', _id: '' }], // 供筛选用的管家列表
			filterAttendantIndex: 0,
			selectedAgentId: '',

			viewMode: 'current', // current, next, custom
			displayStartDate: 0, // 视图开始时间戳
			displayEndDate: 0, // 视图结束时间戳
			customDateRange: [], // 自定义选择的 ['yyyy-mm-dd', 'yyyy-mm-dd']
			showRangePicker: false,
			attendantOptions: [],

			attendantLoading: false,
			scheduleMap: {},

			currentOrderSnapshot: {}, // 查到的订单快照信息（含日期）
			// --- 详情弹窗数据 ---
			selectedDateInfo: { title: '', stats: {}, taskStats: {}, orders: [] },
			taskStatLoading: false,

			batchSendTime: '',
			batchTaskName: '',
			batchPayload: [],

			editForm: {
				_id: '',
				dateRange: [], // ['YYYY-MM-DD', 'YYYY-MM-DD']
				travelers: [], // [{name: '', phone: ''}]
				originalRawData: []
			}
		};
	},
	computed: {
		// 计算当前选中管家的 timeline
		currentAttendantTimeline() {
			if (!this.tempAccountName || !this.attendantList.length) return [];
			// 这里通过 nickname 匹配 (因为我们存的是 account_name=nickname)
			const attendant = this.attendantList.find((u) => u.nickname === this.tempAccountName);
			return attendant ? attendant.timeline || [] : [];
		},
		// 计算 custom-picker 需要的回显对象
		currentAttendantObj() {
			if (!this.tempAccountName || !this.attendantOptions.length) return null;
			return this.attendantOptions.find((o) => o.nickname === this.tempAccountName) || null;
		},
		currentViewLabel() {
			if (this.viewMode === 'custom') return '自定义';
			return this.viewMode === 'current' ? '本月' : '次月';
		},
		dateRangeLabel() {
			const d1 = new Date(this.displayStartDate);
			const d2 = new Date(this.displayEndDate);
			return `${d1.getMonth() + 1}.${d1.getDate()} - ${d2.getMonth() + 1}.${d2.getDate()}`;
		},
		// 计算选中的管家数据（用于左侧统计列表）
		selectedAttendantsData() {
			return this.attendantList.filter((a) => this.selectedAttendantIds.includes(a._id));
		},
		// 生成日历周数据
		calendarWeeks() {
			if (!this.displayStartDate || !this.displayEndDate) return [];

			const weeks = [];
			let currentDay = new Date(this.displayStartDate);
			const startDayNum = currentDay.getDay();
			currentDay.setDate(currentDay.getDate() - startDayNum);

			const endDate = new Date(this.displayEndDate);
			const ONE_DAY = 24 * 3600 * 1000;

			// 辅助函数：日期转字符串 YYYY-MM-DD
			const getDayStr = (d) => {
				return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			};

			while (currentDay <= endDate || weeks.length === 0) {
				const weekDays = [];
				// 1. 先生成这一周的7天日期对象
				for (let i = 0; i < 7; i++) {
					weekDays.push(new Date(currentDay));
					currentDay.setDate(currentDay.getDate() + 1);
				}

				const weekStartStr = getDayStr(weekDays[0]);
				const weekEndStr = getDayStr(weekDays[6]);

				// 2. 找出这一周内所有涉及的订单线段
				let weekSegments = [];
				this.attendantList.forEach((att) => {
					// 只有被勾选的才参与排版
					if (!this.isAttendantSelected(att._id)) return;

					const orders = this.scheduleMap[att._id] || [];
					orders.forEach((o) => {
						const oStartStr = getDayStr(new Date(o.start));
						const oEndStr = getDayStr(new Date(o.end));

						// 判断是否与本周有交集
						if (oEndStr >= weekStartStr && oStartStr <= weekEndStr) {
							weekSegments.push({
								attendantId: att._id,
								color: att.color,
								startStr: oStartStr,
								endStr: oEndStr,
								orderId: o.order_id,
								slotIndex: -1 // 待分配行号
							});
						}
					});
				});

				// 3. 贪心算法分配行号 (Slot)
				// 先按开始时间排序，同开始时间的按结束时间
				weekSegments.sort((a, b) => a.startStr.localeCompare(b.startStr) || b.endStr.localeCompare(a.endStr));

				const slots = []; // 记录每一行的结束日期字符串
				weekSegments.forEach((seg) => {
					let placed = false;
					// 尝试放入已有的行
					for (let i = 0; i < slots.length; i++) {
						// 如果该行的结束时间 < 当前线段的开始时间，说明可以放入
						// 注意：这里需要比较日期字符串。为了简单，只要 seg.start > slotEnd 即可
						// 因为都是 YYYY-MM-DD，可以直接字符串比较
						if (slots[i] < seg.startStr) {
							seg.slotIndex = i;
							slots[i] = seg.endStr;
							placed = true;
							break;
						}
					}
					// 没地方放，开新行
					if (!placed) {
						seg.slotIndex = slots.length;
						slots.push(seg.endStr);
					}
				});

				const maxSlots = slots.length; // 本周最大行数

				// 4. 生成每一天的数据结构
				const weekData = weekDays.map((d) => {
					const dateStr = getDayStr(d);
					const ts = d.getTime();

					// 构建当天的 lines 数组，长度固定为 maxSlots
					// 每一项要么是线段数据，要么是 null (spacer)
					const lines = new Array(maxSlots).fill(null);

					// 统计当天的订单数
					let dailyTotal = 0;

					weekSegments.forEach((seg) => {
						// 如果今天在这个线段范围内
						if (dateStr >= seg.startStr && dateStr <= seg.endStr) {
							dailyTotal++; // 这里只统计数量，不区分是否被筛选，为了对齐逻辑

							// 填入对应槽位
							lines[seg.slotIndex] = {
								type: 'line',
								color: seg.color,
								attendantId: seg.attendantId,
								isStart: dateStr === seg.startStr,
								isEnd: dateStr === seg.endStr
							};
						}
					});

					// 将 null 转为 spacer 类型以便前端渲染
					const renderLines = lines.map((l) => (l ? l : { type: 'spacer' }));

					return {
						ts: ts,
						dateStr: dateStr, // [修改3] 传递字符串供点击使用
						dayNum: d.getDate(),
						isToday: this.isToday(ts),
						isOtherMonth: false,
						totalOrders: dailyTotal,
						lines: renderLines
					};
				});

				weeks.push(weekData);
				if (currentDay > endDate) break;
			}
			return weeks;
		}
	},
	onReady() {
		// 页面加载完成后，获取管家列表用于筛选
		this.loadFilterAttendants();
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},

		// 手动排序处理
		handleManualSort(field) {
			console.log('【调试】点击了排序字段:', field);

			// 1. 如果点击的是当前字段，切换方向
			if (this.currentSortField === field) {
				this.currentSortOrder = this.currentSortOrder === 'asc' ? 'desc' : 'asc';
			} else {
				// 2. 如果点击的是新字段，重置为 desc (通常看最新数据的需求比较大)
				this.currentSortField = field;
				this.currentSortOrder = 'desc';
			}

			// 3. 拼接 unicloud-db 需要的字符串
			const newSortString = `${this.currentSortField} ${this.currentSortOrder}`;

			console.log('【调试】新排序规则:', newSortString);

			// 4. 赋值并刷新
			this.orderby = newSortString;
			this.$nextTick(() => {
				this.$refs.udb.loadData({ current: 1 });
				uni.showToast({ title: '已排序', icon: 'none' });
			});
		},

		// 解析出发时间和天数
		getTripInfo(item) {
			try {
				// 安全获取 trip_dates 字符串
				const datesStr = item.raw_data?.[0]?.order_context?.trip_dates;
				if (!datesStr) return null;

				// 分割字符串 "2026-02-07 / 2026-02-14"
				const parts = datesStr.split(' / ');
				if (parts.length < 2) return null;

				const startStr = parts[0];
				const endStr = parts[1];

				// 计算天数
				const startDate = new Date(startStr);
				const endDate = new Date(endStr);
				// 计算毫秒差 -> 天数 (通常行程包含首尾，所以 +1)
				const diffTime = Math.abs(endDate - startDate);
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

				return {
					date: startStr, // 直接显示日期字符串
					days: diffDays
				};
			} catch (e) {
				return null;
			}
		},
		// 获取显示的客人姓名（始终取 travelers 数组的第一个）
		getCustomerName(item) {
			try {
				if (
					item.raw_data &&
					item.raw_data[0] &&
					item.raw_data[0].order_context &&
					item.raw_data[0].order_context.travelers &&
					item.raw_data[0].order_context.travelers.length > 0
				) {
					return item.raw_data[0].order_context.travelers[0].name || '-';
				}
			} catch (e) {
				console.error('解析姓名失败', e);
			}
			return '-';
		},

		async loadFilterAttendants() {
			try {
				const res = await db.collection('uni-id-users').where({ role: 'attendant' }).field('_id, nickname').get();

				const realAttendants = res.result.data || [];

				this.filterAttendantList = [{ nickname: '全部', _id: '' }, { nickname: '未分配', _id: 'unassigned' }, ...realAttendants];

				// 确保默认选中第一个
				this.filterAttendantIndex = 0;
			} catch (e) {
				console.error('加载管家列表失败', e);
			}
		},

		onFilterAttendantChange(e) {
			const idx = e.detail.value;
			this.filterAttendantIndex = idx;

			// 获取当前选中的项
			const selectedItem = this.filterAttendantList[idx];
			if (!selectedItem) return;

			this.selectedAgentId = selectedItem._id;

			this.search();
		},

		// 判断是否有多个出行人，用于显示切换图标
		hasMultipleTravelers(item) {
			try {
				return item.raw_data[0].order_context.travelers.length > 1;
			} catch (e) {
				return false;
			}
		},

		refreshData() {
			this.$refs.udb.loadData();
			uni.showToast({ title: '已刷新', icon: 'none' });
		},

		// 专门处理日期变动，确保清空时能正确重置
		onDateChange(e) {
			// e 是组件传回来的新值，可能是 [] (被清空时) 或者 ['2023-01-01', '2023-01-02']
			this.filterDateRange = e;
			// 确保数据赋值完成后，再执行搜索
			this.$nextTick(() => {
				this.search();
			});
		},

		// 管家筛选变动
		onFilterAttendantChange(e) {
			const idx = e.detail.value;
			this.filterAttendantIndex = idx;
			const selectedItem = this.filterAttendantList[idx];

			if (selectedItem) {
				this.selectedAgentId = selectedItem._id;
			} else {
				this.selectedAgentId = '';
			}

			// 触发重新组合搜索
			this.search();
		},

		// 搜索逻辑增加对姓名的匹配
		search() {
			const dbCmd = db.command;
			const whereParts = [];

			// 1. 处理管家筛选 (只要有值就叠加)
			if (this.selectedAgentId === 'unassigned') {
				// 特殊值：未分配
				whereParts.push(dbCmd.or([{ agent_id: null }, { agent_id: '' }]));
			} else if (this.selectedAgentId) {
				// 具体管家 ID
				whereParts.push({
					agent_id: this.selectedAgentId
				});
			}

			// 2. 处理日期筛选 (只要数组有值且长度为2就叠加)
			// 注意：这里不再依赖 v-model 的自动更新，而是直接判断当前 data 中的值
			if (Array.isArray(this.filterDateRange) && this.filterDateRange.length === 2) {
				const startDate = this.filterDateRange[0];
				const endDate = this.filterDateRange[1];
				// 只有当开始和结束时间都存在（不为null/undefined）时才添加条件
				if (startDate && endDate) {
					whereParts.push({
						'raw_data.0.order_context.trip_dates': dbCmd.gte(startDate).and(dbCmd.lte(endDate + '\ufff0'))
					});
				}
			}

			// 3. 处理文本搜索 (只要有文本就叠加)
			const q = this.query && this.query.trim();
			if (q) {
				const searchRegex = new RegExp(q); // 构建正则
				whereParts.push(dbCmd.or([{ order_id: searchRegex }, { 'raw_data.0.order_context.travelers.0.name': searchRegex }]));
			}

			// 4. 组合最终查询语句 (And 逻辑)
			// 无论删除了哪一个条件，只要 whereParts 里剩下的条件会被保留
			if (whereParts.length === 0) {
				this.where = ''; // 无任何条件，查全部
			} else if (whereParts.length === 1) {
				this.where = whereParts[0]; // 只有一个条件
			} else {
				this.where = dbCmd.and(whereParts); // 多个条件取交集
			}

			// 5. 强制刷新列表，重置到第1页
			this.$nextTick(() => {
				if (this.$refs.udb) {
					this.$refs.udb.loadData({ current: 1 });
				}
			});

			console.log('当前查询条件:', this.where);
		},

		formatDateStr(d) {
			const pad = (n) => (n < 10 ? '0' + n : n);
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
		},
		isToday(ts) {
			const now = new Date();
			const d = new Date(ts);
			return now.getDate() === d.getDate() && now.getMonth() === d.getMonth() && now.getFullYear() === d.getFullYear();
		},
		onPageChanged(e) {
			this.$refs.udb.loadData({ current: e.current });
		},
		toggleRangePicker() {
			this.showRangePicker = !this.showRangePicker;
		},
		onRangePicked(e) {
			if (e && e.length === 2) {
				this.viewMode = 'custom';
				this.displayStartDate = new Date(e[0]).getTime();
				this.displayEndDate = new Date(e[1]).getTime();
				this.showRangePicker = false; // 选完自动收起
				this.loadScheduleData();
			}
		},
		// Picker 辅助方法
		getPickerIndex() {
			return this.attendantList.findIndex((a) => a.nickname === this.tempAccountName);
		},
		onPickerChange(e) {
			const idx = e.detail.value;
			if (idx >= 0 && this.attendantList[idx]) {
				this.tempAccountName = this.attendantList[idx].nickname;
			}
		},
		navigateTo(url) {
			uni.navigateTo({ url, events: { refreshData: () => this.$refs.udb.loadData() } });
		},
		confirmDelete(id) {
			uni.showModal({
				title: '确认删除',
				content: '删除此订单将一并清空其生成的发送队列，确定继续吗？',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '删除中...' });
						try {
							await db.collection('a-task-queue').where({ task_id: id }).remove();
							await db.collection('a-task-orders').doc(id).remove();
							uni.showToast({ title: '删除成功' });
							this.refreshData();
						} catch (e) {
							uni.showModal({ content: '删除失败: ' + e.message, showCancel: false });
						} finally {
							uni.hideLoading();
						}
					}
				}
			});
		},

		// --- 分配管家逻辑 ---
		async openAssignModal(task) {
			// this.editingTask = task;
			// this.tempAccountName = task.account_name || ''; // 回显当前名字
			// this.currentOrderSnapshot = {};
			// this.attendantList = [];
			// this.attendantOptions = [];
			// this.$refs.assignPopup.open();

			// this.attendantLoading = true;
			// try {
			// 	// 1. 先查快照，获取出发日期和天数
			// 	const snapRes = await db.collection('a-snapshots').where({ order_id: task.order_id }).field('departure_date, total_days').limit(1).get();

			// 	if (snapRes.result.data.length > 0) {
			// 		this.currentOrderSnapshot = snapRes.result.data[0];
			// 		const depDate = this.currentOrderSnapshot.departure_date;
			// 		const totalDays = this.currentOrderSnapshot.total_days || 1;

			// 		// 2. 有日期，加载带排期的管家列表
			// 		await this.loadAttendantsData(depDate, totalDays);
			// 	} else {
			// 		// 没日期，只加载简单的管家列表(不带timeline)
			// 		await this.loadSimpleAttendants();
			// 	}
			// } catch (e) {
			// 	console.error(e);
			// 	uni.showToast({ title: '数据加载失败', icon: 'none' });
			// } finally {
			// 	this.attendantLoading = false;
			// }
			this.editingTask = task;
			this.tempAccountName = task.account_name || '';
			this.scheduleMap = {};
			this.$refs.assignPopup.open();

			// --- 补回这部分逻辑 start ---
			this.currentOrderSnapshot = {}; // 重置
			// 异步静默加载快照信息，不阻塞 UI 显示
			db.collection('a-snapshots')
				.where({ order_id: task.order_id })
				.field('departure_date, total_days')
				.limit(1)
				.get()
				.then((res) => {
					if (res.result.data.length > 0) {
						this.currentOrderSnapshot = res.result.data[0];
					}
				});
			// --- 补回这部分逻辑 end ---

			// 默认显示本月
			this.switchViewMode('current');

			// 加载管家列表
			await this.loadAttendantBaseInfo();
		},

		async loadAttendantBaseInfo() {
			this.attendantLoading = true;
			try {
				// 1. 获取管家列表
				const usersRes = await db.collection('uni-id-users').where({ role: 'attendant' }).field('_id, nickname, mobile').get();
				// 2. 获取评分
				let scores = [];
				try {
					const sRes = await operationCenter.getAssessmentData({ role: 'attendant' });
					scores = sRes.data || [];
				} catch (e) {}

				this.attendantList = usersRes.result.data.map((u, idx) => {
					const sObj = scores.find((s) => s.user_id === u._id);
					return {
						_id: u._id,
						nickname: u.nickname || '未命名',
						total_score: sObj ? sObj.total_score : 0,
						color: PALETTE[idx % PALETTE.length], // 分配颜色
						stats: { startCount: 0, endCount: 0 } // 初始化统计
					};
				});

				// 默认全选
				this.selectedAttendantIds = this.attendantList.map((a) => a._id);

				// 触发数据加载
				this.loadScheduleData();
			} catch (e) {
				console.error(e);
			} finally {
				this.attendantLoading = false;
			}
		},

		switchViewMode(mode) {
			this.viewMode = mode;
			const now = new Date();

			if (mode === 'current') {
				// 本月1号 到 月末
				this.displayStartDate = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
				this.displayEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();
			} else if (mode === 'next') {
				this.displayStartDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
				this.displayEndDate = new Date(now.getFullYear(), now.getMonth() + 2, 0).getTime();
			}

			if (mode !== 'custom') {
				this.loadScheduleData();
			}
		},

		openDateRangePicker() {
			this.showRangePicker = true;
		},

		onRangePicked(e) {
			// e 是 ['2025-01-01', '2025-01-05']
			if (e && e.length === 2) {
				this.viewMode = 'custom';
				this.displayStartDate = new Date(e[0]).getTime();
				this.displayEndDate = new Date(e[1]).getTime();
				this.showRangePicker = false;
				this.loadScheduleData();
			}
		},

		async loadScheduleData() {
			if (!this.displayStartDate || !this.displayEndDate) return;
			this.attendantLoading = true;

			try {
				// 调用后端矩阵接口
				const res = await operationCenter.getScheduleMatrix({
					startDate: this.displayStartDate,
					endDate: this.displayEndDate
				});

				// 获取管家占用数据
				const rawMap = res.data?.attendants || {};

				// 处理数据：缓存订单并计算当期统计
				this.scheduleMap = rawMap;

				// 更新统计数据 (Start/End Count)
				this.attendantList.forEach((att) => {
					let sCount = 0;
					let eCount = 0;
					const orders = rawMap[att._id] || [];

					orders.forEach((o) => {
						if (o.start >= this.displayStartDate && o.start <= this.displayEndDate) sCount++;
						if (o.end >= this.displayStartDate && o.end <= this.displayEndDate) eCount++;
					});

					att.stats = { startCount: sCount, endCount: eCount };
				});
			} catch (e) {
				console.error('加载排期失败', e);
			} finally {
				this.attendantLoading = false;
			}
		},

		// 筛选器逻辑
		isAttendantSelected(id) {
			return this.selectedAttendantIds.includes(id);
		},
		toggleAttendantSelect(id) {
			if (this.isAttendantSelected(id)) {
				this.selectedAttendantIds = this.selectedAttendantIds.filter((x) => x !== id);
			} else {
				this.selectedAttendantIds.push(id);
				// 如果是单选逻辑：点击谁，就预选谁作为分配对象
				const target = this.attendantList.find((a) => a._id === id);
				if (target) this.tempAccountName = target.nickname;
			}
		},

		// --- 点击日期显示详情 ---
		async onDayClick(day) {
			const dateStr = day.dateStr; // 使用 calendarWeeks 生成好的 YYYY-MM-DD
			const dateObj = new Date(day.ts);

			this.selectedDateInfo = {
				title: `${dateObj.getMonth() + 1}月${dateObj.getDate()}日 任务详情`,
				stats: { pendingStart: 0, ongoing: 0, ended: 0 },
				taskStats: { executed: '-', pending: '-' },
				orders: []
			};

			const activeOrders = [];

			// 遍历所有数据进行统计 (或者只遍历筛选后的，看需求，这里假设统计筛选后的)
			this.attendantList.forEach((att) => {
				if (this.isAttendantSelected(att._id) && this.scheduleMap[att._id]) {
					this.scheduleMap[att._id].forEach((o) => {
						// 转字符串比较
						const oStartStr = this.formatDateStr(new Date(o.start));
						const oEndStr = this.formatDateStr(new Date(o.end));

						let statusText = '';
						let isHit = false;

						// [修改 6] 统计逻辑调整
						// 待出行: 今天及以后开始的
						if (oStartStr >= dateStr) {
							// 注意：这会包含今天出发的
							this.selectedDateInfo.stats.pendingStart++;
							if (oStartStr === dateStr) statusText = '今日出发';
							else statusText = '待出行';

							// 仅当点击的日期恰好是开始日期时，才在列表显示为"今日出发"，或者你想显示所有关联的？
							// 原逻辑是点击某天，显示某天涉及的订单。
							// 如果 oStartStr >= dateStr，说明这单是在今天或未来。
							// 但"关联订单列表"通常只显示**占用今天**的订单。
							// 所以这里的统计是“全局统计”，而列表是“当日列表”。
						}

						// 已结束: 今天及以前结束的
						if (oEndStr <= dateStr) {
							this.selectedDateInfo.stats.ended++;
							if (oEndStr === dateStr) statusText = '今日结束';
						}

						// 进行中: 跨越今天 (不含开始和结束当天，或者含？视业务定义，通常含)
						// 这里为了互斥，简单定义：如果不属于完全未来，也不属于完全过去...
						// 严格的“当日关联订单”逻辑：
						if (dateStr >= oStartStr && dateStr <= oEndStr) {
							this.selectedDateInfo.stats.ongoing++; // 这里的 ongoing 泛指今天有排期

							// 修正 statusText 用于列表显示
							if (oStartStr === dateStr) statusText = '今日出发';
							else if (oEndStr === dateStr) statusText = '今日结束';
							else statusText = '进行中';

							activeOrders.push({
								attendantName: att.nickname,
								color: att.color,
								order_id: o.order_id,
								statusText: statusText
							});
						}
					});
				}
			});
			this.selectedDateInfo.orders = activeOrders;

			this.$refs.dayDetailPopup.open();

			// 2. 异步加载 Task 统计
			this.taskStatLoading = true;
			try {
				// 筛选出的管家ID
				const agentIds = this.selectedAttendantIds;
				const res = await operationCenter.getDailyTaskOverview({
					dateTs: ts,
					agentIds: agentIds
				});

				if (res.data) {
					this.selectedDateInfo.taskStats = {
						executed: res.data.executed_count,
						pending: res.data.pending_count
					};
				}
			} catch (e) {
				console.error(e);
			} finally {
				this.taskStatLoading = false;
			}
		},

		// 加载简单列表（无日期时）
		async loadSimpleAttendants() {
			const usersRes = await db.collection('uni-id-users').where({ role: 'attendant' }).field('_id, nickname, username, mobile').get();

			this.attendantList = usersRes.result.data.map((u) => ({
				_id: u._id,
				nickname: u.nickname || u.username || '未命名',
				mobile: u.mobile || '',
				timeline: [] // 无排期信息
			}));

			this.attendantOptions = this.attendantList.map((u) => ({
				nickname: u.nickname,
				displayText: u.nickname
			}));
		},

		// 加载带排期的列表（有日期时）- 逻辑搬运自 a-customers/list.vue
		async loadAttendantsData(depDate, totalDays) {
			const usersRes = await db.collection('uni-id-users').where({ role: 'attendant' }).field('_id, nickname, mobile').get();
			let rawUsers = usersRes.result.data;

			// 获取评分
			let scores = [];
			try {
				const sRes = await operationCenter.getAssessmentData({ role: 'attendant' });
				scores = Array.isArray(sRes.data) ? sRes.data : [];
			} catch (e) {}

			// 获取排期矩阵
			const startDate = depDate - 6 * 24 * 3600 * 1000;
			const endDate = depDate + (totalDays + 6) * 24 * 3600 * 1000;
			let scheduleRawMap = {};
			try {
				const schRes = await operationCenter.getScheduleMatrix({ startDate, endDate });
				scheduleRawMap = schRes.data?.attendants || {};
			} catch (e) {}

			// 计算 Timeline
			this.attendantList = rawUsers.map((u) => {
				const scoreObj = scores.find((s) => s.user_id === u._id);
				const score = scoreObj ? scoreObj.total_score : 0;
				const ranges = scheduleRawMap[u._id] || [];
				const timeline = [];
				let busyRanges = [];
				let currentRange = null;
				let conflictCount = 0;

				const getDayTime = (ts) => new Date(new Date(ts).setHours(0, 0, 0, 0)).getTime();
				const targetDayTime = getDayTime(depDate);

				for (let i = -5; i <= 5; i++) {
					const currentTs = targetDayTime + i * 24 * 3600 * 1000;
					const dateObj = new Date(currentTs);
					const shortDate = `${dateObj.getMonth() + 1}.${dateObj.getDate()}`;
					const fullDateStr = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`;

					const isBusy = ranges.some((range) => {
						const rStart = getDayTime(range.start);
						const rEnd = getDayTime(range.end);
						return currentTs >= rStart && currentTs <= rEnd;
					});

					if (isBusy) {
						conflictCount++;
						if (!currentRange) currentRange = { start: shortDate, end: shortDate };
						else currentRange.end = shortDate;
					} else {
						if (currentRange) {
							busyRanges.push(currentRange.start === currentRange.end ? currentRange.start : `${currentRange.start}-${currentRange.end}`);
							currentRange = null;
						}
					}

					timeline.push({
						timestamp: currentTs,
						dateStr: fullDateStr,
						shortDate: shortDate,
						isBusy: isBusy,
						isTarget: i === 0,
						isToday: getDayTime(Date.now()) === currentTs
					});
				}
				if (currentRange) {
					busyRanges.push(currentRange.start === currentRange.end ? currentRange.start : `${currentRange.start}-${currentRange.end}`);
				}

				let statusText = '空闲';
				if (conflictCount > 0) statusText = `(${busyRanges.join(',')})`;

				return {
					_id: u._id,
					nickname: u.nickname || u.username,
					mobile: u.mobile || '',
					total_score: score,
					conflictCount: conflictCount,
					timeline: timeline,
					displayText: `${u.nickname} (${score}分) | ${statusText}`
				};
			});

			// 排序
			this.attendantList.sort((a, b) => {
				if (b.total_score !== a.total_score) return b.total_score - a.total_score;
				return a.conflictCount - b.conflictCount;
			});

			this.attendantOptions = [...this.attendantList];
		},

		async saveAssign() {
			if (!this.tempAccountName) return;

			uni.showLoading({ title: '保存中...' });
			try {
				const orderId = this.editingTask.order_id;
				const selectedAttendant = this.attendantList.find((u) => u.nickname === this.tempAccountName);

				if (!selectedAttendant) throw new Error('未找到管家信息');

				const snapRes = await db.collection('a-snapshots').where({ order_id: orderId }).field('custom_display_text, staves').limit(1).get();

				if (snapRes.result.data.length > 0) {
					const snap = snapRes.result.data[0];
					if (snap.custom_display_text) {
						const oldAtt = (snap.staves || []).find((s) => s.role === 'attendant' || (Array.isArray(s.role) && s.role.includes('attendant')));
						const oldName = oldAtt ? oldAtt.nickname || oldAtt.name : '';
						const newName = this.tempAccountName;

						if (newName && newName !== oldName) {
							const parts = snap.custom_display_text.split('##');
							const updatedParts = parts.map((p) => {
								if (oldName && p.includes(oldName)) {
									return p.split(oldName).join(newName);
								} else if (!p.includes(newName)) {
									return p + ' | ' + newName;
								}
								return p;
							});
							const newText = updatedParts.join('##');

							if (newText !== snap.custom_display_text) {
								await db.collection('a-snapshots').doc(snap._id).update({
									custom_display_text: newText
								});
							}
						}
					}
				}

				// 1. 调用云对象进行原子化更新 (同时更新 Order 和 Queue)
				const rpa = uniCloud.importObject('a-task-rpa');
				const res = await rpa.reassignAgent({
					orderId: orderId,
					agentId: selectedAttendant._id, // 传 ID
					accountName: selectedAttendant.nickname // 传 Name (冗余)
				});

				if (res.errCode !== 0) {
					throw new Error(res.errMsg);
				}

				if (selectedAttendant && selectedAttendant.mobile) {
					attendantNotifier
						.notifyAttendantAssigned({
							mobile: selectedAttendant.mobile, // 关键：传手机号
							orderId: orderId,
							customerName: this.getCustomerName(this.editingTask), // 获取一下客人名字
							departureDateStr: this.formatDateShort(this.currentOrderSnapshot.departure_date)
						})
						.then((res) => {
							if (res.errcode === 0) {
								console.log('管家通知发送成功');
							} else {
								// 如果报错（比如管家没进企微），弹个窗提示一下操作员
								uni.showToast({ title: '通知失败:' + res.errmsg, icon: 'none', duration: 3000 });
							}
						})
						.catch((err) => {
							console.error('管家通知接口异常:', err);
						});
				} else {
					uni.showToast({ title: '该管家无手机号，无法发送企微通知', icon: 'none' });
				}

				uni.showToast({ title: '已分配', icon: 'success' });
				this.$refs.assignPopup.close();
				this.refreshData();
			} catch (e) {
				uni.showModal({ content: '分配失败: ' + e.message, showCancel: false });
			} finally {
				uni.hideLoading();
			}
		},

		showToast(msg) {
			uni.showToast({ title: msg, icon: 'none' });
		},

		formatDateShort(ts) {
			if (!ts) return '';
			const d = new Date(ts);
			return `${d.getMonth() + 1}.${d.getDate()}`;
		},

		// --- 全局批量暂停相关方法 ---
		formatFullDate(d) {
			const pad = (n) => (n < 10 ? '0' + n : n);
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
		},

		openBatchStopModal() {
			const now = new Date();
			this.batchStartTime = this.formatFullDate(now);
			const tmr = new Date(now);
			tmr.setDate(tmr.getDate() + 1);
			this.batchEndTime = this.formatFullDate(tmr);
			this.batchList = [];
			this.hasSearched = false;
			this.showBatchStopModal = true;
		},

		closeBatchStopModal() {
			this.showBatchStopModal = false;
		},

		async fetchGlobalBatchTasks() {
			if (!this.batchStartTime || !this.batchEndTime) {
				return uni.showToast({ title: '请选择完整的开始和结束时间', icon: 'none' });
			}
			if (this.batchStartTime > this.batchEndTime) {
				return uni.showToast({ title: '开始时间不能晚于结束时间', icon: 'none' });
			}
			uni.showLoading({ title: '全局扫描中...' });
			try {
				const dbCmd = db.command;
				const res = await db
					.collection('a-task-queue')
					.where({
						status: 'pending',
						send_time: dbCmd.gte(this.batchStartTime).and(dbCmd.lte(this.batchEndTime))
					})
					.limit(500)
					.orderBy('send_time', 'asc')
					.get();
				this.batchList = res.result.data || [];
				this.hasSearched = true;
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '查询失败: ' + e.message, icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		},

		executeGlobalBatchStop() {
			if (this.batchList.length === 0) return;
			uni.showModal({
				title: '确认全局暂停',
				content: `确定要将这 ${this.batchList.length} 条任务（涉及多个订单）全部改为【暂停】状态吗？`,
				confirmColor: '#dc2626',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '正在处理...' });
						try {
							const ids = this.batchList.map((item) => item._id);
							const dbCmd = db.command;
							await db
								.collection('a-task-queue')
								.where({ _id: dbCmd.in(ids) })
								.update({ status: 'manual_stop' });
							uni.showToast({ title: '全局暂停成功', icon: 'success' });
							this.closeBatchStopModal();
							this.refreshData();
						} catch (e) {
							uni.showModal({ title: '操作失败', content: e.message, showCancel: false });
						} finally {
							uni.hideLoading();
						}
					}
				}
			});
		},

		retryCrawl(item) {
			uni.showModal({
				title: '确认重抓',
				content: '⚠️ 警告：重新抓取将清空该订单现有的【快照数据】和【AI生成队列】，这可能导致已编辑的内容丢失。确定继续吗？',
				confirmColor: '#dc2626',
				success: (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '重置中...' });
						db.collection('a-task-orders')
							.doc(item._id)
							.update({
								crawl_status: 'pending',
								snapshot_status: 'pending',
								ai_status: 'pending',
								raw_data: [],
								error_msg: ''
							})
							.then(() => {
								uni.showToast({ title: '已重置，等待抓取', icon: 'success' });
								this.refreshData();
							})
							.catch((err) => {
								uni.showModal({ content: err.message, showCancel: false });
							})
							.finally(() => {
								uni.hideLoading();
							});
					}
				}
			});
		},

		async retrySnapshot(item) {
			uni.showModal({
				title: '确认同步',
				content: '确定要重新从携程同步行程快照吗？这将覆盖当前的行程基础数据。',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '正在同步...' });
						try {
							const rpa = uniCloud.importObject('a-task-rpa');
							const res = await rpa.retrySnapshot(item._id);
							if (res.errCode === 0) {
								uni.showToast({ title: '同步成功', icon: 'success' });
								uni.showModal({
									title: '同步完成',
									content: '快照已更新，是否立即重新生成 AI 消息队列？',
									success: (aiRes) => {
										if (aiRes.confirm) {
											this.retryAI(item);
										}
									}
								});
							} else {
								uni.showModal({ content: res.errMsg || '同步失败', showCancel: false });
							}
							this.refreshData();
						} catch (e) {
							uni.showModal({ content: '请求异常: ' + e.message, showCancel: false });
						} finally {
							uni.hideLoading();
						}
					}
				}
			});
		},

		async retryAI(item) {
			uni.showModal({
				title: '确认生成',
				content: '确定要让 AI 重新生成消息队列吗？\n这将覆盖当前已生成的待发送队列（已发送的消息不会受影响）。',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading({ title: 'AI 生成中...' });
						try {
							const rpa = uniCloud.importObject('a-task-rpa');
							const res = await rpa.generateQueue(item._id);
							if (res.errCode === 0) {
								uni.showToast({ title: '生成成功', icon: 'success' });
								this.refreshData();
							} else {
								uni.showModal({ content: res.errMsg, showCancel: false });
							}
						} catch (e) {
							uni.showModal({ content: '请求失败: ' + e.message, showCancel: false });
						} finally {
							uni.hideLoading();
						}
					}
				}
			});
		},

		getStatusText(status) {
			const map = {
				pending: '⏳ 等待',
				processing: '🔄 进行中',
				syncing: '🔄 同步中',
				done: '✅ 完成',
				failed: '❌ 失败',
				skipped: '⏭️ 跳过'
			};
			return map[status] || status;
		},

		getStatusClass(status) {
			const map = { pending: 'text-gray-500', processing: 'text-blue-600', done: 'text-green-600', failed: 'text-red-600' };
			return map[status] || '';
		},

		async batchFixWeather() {
			uni.showModal({
				title: '确认校准',
				content: '将批量扫描所有“明日提醒”任务，并将正文中的天气段落替换为最新的动态占位符。是否继续？',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '处理中...' });
						try {
							const rpa = uniCloud.importObject('a-task-rpa');
							const result = await rpa.batchFixWeatherPlaceholder();
							uni.showToast({
								title: `处理完成：成功 ${result.updated} 条`,
								icon: 'none',
								duration: 3000
							});
						} catch (e) {
							uni.showModal({ content: '操作失败: ' + e.message, showCancel: false });
						} finally {
							uni.hideLoading();
						}
					}
				}
			});
		},

		// 打开编辑弹窗，解析数据
		openEditOrderModal(item) {
			this.editForm._id = item._id;

			try {
				this.editForm.originalRawData = item.raw_data ? JSON.parse(JSON.stringify(item.raw_data)) : [];
			} catch (e) {
				this.editForm.originalRawData = [];
			}

			// 1. 解析日期
			let dates = [];
			try {
				const dateStr = item.raw_data?.[0]?.order_context?.trip_dates;
				if (dateStr && dateStr.includes(' / ')) {
					dates = dateStr.split(' / ');
				}
			} catch (e) {}
			this.editForm.dateRange = dates;

			// 2. 解析客人 (深拷贝，防止直接修改原对象)
			let travelers = [];
			try {
				const rawTravelers = item.raw_data?.[0]?.order_context?.travelers || [];
				travelers = JSON.parse(JSON.stringify(rawTravelers));
			} catch (e) {}

			// 确保至少有一个空对象方便编辑
			if (travelers.length === 0) {
				travelers.push({ name: '', phone: '' });
			}

			this.editForm.travelers = travelers;
			this.$refs.editOrderPopup.open();
		},

		// 添加一个客人行
		addTraveler() {
			this.editForm.travelers.push({ name: '', phone: '' });
		},

		// 删除一个客人行
		removeTraveler(index) {
			if (this.editForm.travelers.length <= 1) {
				return uni.showToast({ title: '至少保留一位客人', icon: 'none' });
			}
			this.editForm.travelers.splice(index, 1);
		},

		// 将指定客人移到第一位（显示）
		setAsMainTraveler(index) {
			if (index <= 0) return;

			// 取出该客人
			const target = this.editForm.travelers[index];
			// 从原位置删除
			this.editForm.travelers.splice(index, 1);
			// 插入到数组头部
			this.editForm.travelers.unshift(target);

			uni.showToast({ title: '已设为显示', icon: 'none' });
		},

		// 保存逻辑
		async saveOrderInfo() {
			if (!this.editForm.dateRange || this.editForm.dateRange.length < 2) {
				return uni.showToast({ title: '请选择完整的日期范围', icon: 'none' });
			}

			// 过滤掉没有名字的空行
			const validTravelers = this.editForm.travelers.filter((t) => t.name && t.name.trim());
			if (validTravelers.length === 0) {
				return uni.showToast({ title: '请至少填写一位客人姓名', icon: 'none' });
			}

			// 拼接日期字符串 "2025-12-20 / 2025-12-27"
			const newDateStr = `${this.editForm.dateRange[0]} / ${this.editForm.dateRange[1]}`;

			uni.showLoading({ title: '保存中...' });
			try {
				// 1. 取出完整的 raw_data 副本
				let finalRawData = this.editForm.originalRawData;

				// 2. 确保结构存在 (防止原数据为空)
				if (!finalRawData[0]) finalRawData[0] = {};
				if (!finalRawData[0].order_context) finalRawData[0].order_context = {};

				// 3. 在本地更新字段
				finalRawData[0].order_context.trip_dates = newDateStr;
				finalRawData[0].order_context.travelers = validTravelers;

				// 4. 整体更新 raw_data 字段 (schema 中存在 raw_data，所以这样是合法的)
				await db.collection('a-task-orders').doc(this.editForm._id).update({
					raw_data: finalRawData
				});

				uni.showToast({ title: '修改成功', icon: 'success' });
				this.$refs.editOrderPopup.close();
				this.refreshData(); // 刷新列表

				// 如果修改了日期或名字，建议提示是否需要重置 AI 状态
				// 因为 AI 生成的内容是基于旧数据的
			} catch (e) {
				console.error(e);
				uni.showModal({ content: '保存失败: ' + e.message, showCancel: false });
			} finally {
				uni.hideLoading();
			}
		}
	}
};
</script>

<style>
.text-gray-500 {
	color: #6b7280;
}
.text-blue-600 {
	color: #2563eb;
}
.text-green-600 {
	color: #16a34a;
}
.text-red-600 {
	color: #dc2626;
}

/* 增加鼠标手势 */
.cursor-pointer {
	cursor: pointer;
}

.mini-icon-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	border: 1px solid;
	border-radius: 4px;
	background-color: transparent;
	cursor: pointer;
	transition: all 0.2s;
}
.btn-blue {
	border-color: #2563eb;
}
.btn-blue:active {
	background-color: rgba(37, 99, 235, 0.1);
}
.btn-red {
	border-color: #dc2626;
}
.btn-red:active {
	background-color: rgba(220, 38, 38, 0.1);
}

.timeline-container {
	margin-top: 10px;
	padding: 10px;
	background: #f9fafb;
	border-radius: 6px;
	border: 1px solid #e5e7eb;
}
.timeline-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
	font-size: 11px;
	color: #6b7280;
}
.legend {
	display: flex;
	gap: 8px;
}
.legend-item {
	display: flex;
	align-items: center;
	gap: 3px;
}
.dot {
	width: 8px;
	height: 8px;
	border-radius: 2px;
}
.dot.red {
	background: #f87171;
}
.dot.gray {
	background: #e5e7eb;
}
.dot.blue-border {
	border: 1px solid #3b82f6;
	background: transparent;
}
.timeline-blocks {
	display: flex;
	justify-content: space-between;
	gap: 2px;
}
.time-block {
	flex: 1;
	height: 24px;
	background: #e5e7eb;
	border-radius: 3px;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	cursor: pointer;
}
.tiny-date {
	font-size: 9px;
	color: #6b7280;
	transform: scale(0.8);
}
.time-block.busy {
	background: #f87171;
}
.time-block.busy .tiny-date {
	color: #fff;
}
.time-block.target {
	border: 2px solid #3b82f6;
	background: #eff6ff;
	z-index: 1;
	transform: scale(1.1);
}
.time-block.target.busy {
	background: #f87171;
}

.wide-picker {
	width: 100%;
}

/* 弹窗容器 */
.assign-popup-container {
	width: 95vw;
	height: 90vh;
	background: #fff;
	border-radius: 12px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.popup-header-bar {
	padding: 15px;
	border-bottom: 1px solid #eee;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #f9fafb;
}

.popup-body {
	flex: 1;
	display: flex;
	overflow: hidden;
}

/* 左侧面板 */
.left-panel {
	width: 240px;
	border-right: 1px solid #eee;
	display: flex;
	flex-direction: column;
	background: #fcfcfc;
}

.panel-section {
	padding: 10px;
	display: flex;
	flex-direction: column;
	height: 50%;
}

.section-title {
	font-size: 12px;
	font-weight: bold;
	color: #6b7280;
	margin-bottom: 8px;
	padding-left: 4px;
	border-left: 3px solid #3b82f6;
}

.attendant-list-scroll,
.stats-list-scroll {
	flex: 1;
	overflow-y: auto;
}

.attendant-item {
	display: flex;
	align-items: center;
	padding: 8px;
	border-radius: 6px;
	margin-bottom: 4px;
	cursor: pointer;
	transition: all 0.2s;
	&:active {
		background: #f3f4f6;
	}
	&.is-selected {
		background: #eff6ff;
		border: 1px solid #dbeafe;
	}
}

.color-dot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	margin-right: 8px;
	&.small {
		width: 8px;
		height: 8px;
	}
}

.att-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	.att-name {
		font-size: 13px;
		font-weight: 500;
		color: #374151;
	}
	.att-score {
		font-size: 10px;
		color: #9ca3af;
	}
}

.stat-item {
	padding: 6px 8px;
	border-bottom: 1px dashed #eee;
	.stat-row {
		display: flex;
		justify-content: space-between;
		font-size: 10px;
		color: #6b7280;
		margin-top: 4px;
	}
}

/* 右侧面板 */
.right-panel {
	flex: 1;
	display: flex;
	flex-direction: column;
	position: relative;
}

.calendar-toolbar {
	padding: 10px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid #eee;
}

.mode-switch {
	display: flex;
	background: #f3f4f6;
	border-radius: 6px;
	padding: 2px;
	.mode-btn {
		padding: 4px 12px;
		font-size: 12px;
		color: #666;
		border-radius: 4px;
		cursor: pointer;
		&.active {
			background: #fff;
			color: #2563eb;
			font-weight: bold;
			box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		}
	}
}

.current-range-label {
	font-size: 14px;
	font-weight: bold;
	color: #374151;
}

.week-header {
	display: flex;
	background: #f9fafb;
	border-bottom: 1px solid #eee;
	.week-cell {
		flex: 1;
		text-align: center;
		font-size: 12px;
		color: #9ca3af;
		padding: 8px 0;
	}
}

.calendar-body {
	flex: 1;
	background: #fff;
	position: relative;
}

.loading-mask {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(255, 255, 255, 0.8);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 10;
	color: #666;
}

.calendar-week-row {
	display: flex;
	border-bottom: 1px solid #f3f4f6;
	min-height: 80px; /* 保证每周有一定高度 */
}

.calendar-day-cell {
	flex: 1;
	border-right: 1px solid #f3f4f6;
	padding: 4px;
	display: flex;
	flex-direction: column;
	cursor: pointer;
	&:active {
		background: #f9fafb;
	}
	&.is-today {
		background: #eff6ff;
	}
}

.day-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 4px;
	.day-num {
		font-size: 12px;
		font-weight: 600;
		color: #374151;
	}
	.day-badge {
		background: #fee2e2;
		color: #ef4444;
		font-size: 9px;
		padding: 1px 4px;
		border-radius: 4px;
	}
}

.lines-container {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding-top: 2px;
}

.order-line,
.line-spacer {
	height: 4px;
	border-radius: 2px;
	width: 100%;
}

.order-line.is-start {
	margin-left: 2px;
	width: calc(100% - 2px);
}

.line-spacer {
	background: transparent;
}

.action-footer {
	padding: 10px 15px;
	border-top: 1px solid #eee;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #f9fafb;
}

/* 详情弹窗样式 */
.day-detail-content {
	padding: 10px;
	width: 280px;
}

.detail-stat-grid {
	display: flex;
	justify-content: space-between;
	margin-bottom: 15px;
	.stat-box {
		width: 30%;
		padding: 8px 0;
		border-radius: 6px;
		display: flex;
		flex-direction: column;
		align-items: center;
		&.blue {
			background: #eff6ff;
			color: #2563eb;
		}
		&.green {
			background: #ecfdf5;
			color: #10b981;
		}
		&.gray {
			background: #f3f4f6;
			color: #6b7280;
		}
		.num {
			font-size: 16px;
			font-weight: bold;
		}
		.lbl {
			font-size: 10px;
			margin-top: 2px;
		}
	}
}

.task-stat-section {
	background: #f9fafb;
	border-radius: 6px;
	padding: 8px;
	margin-bottom: 10px;
	.section-head {
		font-size: 12px;
		font-weight: bold;
		margin-bottom: 4px;
		color: #374151;
	}
}

.mini-order-row {
	display: flex;
	align-items: center;
	padding: 4px 0;
	border-bottom: 1px dashed #f3f4f6;
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		margin-right: 6px;
	}
	.o-name {
		font-size: 11px;
		font-weight: bold;
		width: 50px;
	}
	.o-info {
		font-size: 10px;
		color: #666;
	}
}

.fixed-picker-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 999;
	display: flex;
	justify-content: center;
	align-items: center;
}

.relative {
	position: relative;
}
.inline-block {
	display: inline-block;
}
.absolute-picker-box {
	position: absolute;
	top: 30px;
	left: 0;
	width: 300px;
	background: #fff;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	border-radius: 8px;
	padding: 10px;
	z-index: 50;
	border: 1px solid #eee;
}

.stat-row-merged {
	font-size: 10px;
	color: #6b7280;
	margin-top: 4px;
	padding-left: 18px; /* 对齐名字 */
}
.picker-box {
	display: flex;
	align-items: center;
	border: 1px solid #e5e7eb;
	padding: 4px 10px;
	border-radius: 4px;
	background: #fff;
}
</style>
