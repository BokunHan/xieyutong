<template>
	<view class="page-container">
		<view class="main-content">
			<view class="stats-row">
				<view class="stat-box blue">
					<view class="stat-val">{{ stats.total }}</view>
					<view class="stat-label">总客户数</view>
				</view>
				<view class="stat-box green">
					<view class="stat-val">{{ stats.deal }}</view>
					<view class="stat-label">已成交</view>
				</view>
				<view class="stat-box orange">
					<view class="stat-val">{{ stats.following }}</view>
					<view class="stat-label">跟进中</view>
				</view>
				<view class="stat-box cyan">
					<view class="stat-val">{{ stats.newToday }}</view>
					<view class="stat-label">今日新增</view>
				</view>
			</view>

			<view class="filter-bar">
				<view class="search-input">
					<uni-icons type="search" size="16" color="#9ca3af"></uni-icons>
					<input type="text" v-model="filters.keyword" placeholder="搜姓名/电话/微信号..." @confirm="refreshData" />
				</view>

				<picker :range="sourceOptions" @change="onSourceFilter" class="filter-picker">
					<view class="picker-inner">
						<text>{{ filters.source || '所有来源' }}</text>
						<uni-icons type="bottom" size="12" color="#666"></uni-icons>
					</view>
				</picker>

				<picker :range="statusOptions" range-key="label" @change="onStatusFilter" class="filter-picker">
					<view class="picker-inner">
						<text>{{ filters.statusLabel || '所有状态' }}</text>
						<uni-icons type="bottom" size="12" color="#666"></uni-icons>
					</view>
				</picker>

				<picker :range="salesOptions" range-key="nickname" @change="onSalesFilter" class="filter-picker">
					<view class="picker-inner">
						<text>{{ filters.salesLabel || '所有销售' }}</text>
						<uni-icons type="bottom" size="12" color="#666"></uni-icons>
					</view>
				</picker>

				<view class="filter-actions">
					<text class="link-btn" @click="resetFilters">重置</text>
				</view>

				<button class="uni-btn-primary small ml-10" style="background-color: #f59e0b; border-color: #f59e0b" @click="openInvalidPopup">
					<uni-icons type="close" size="12" color="#fff"></uni-icons>
					无效统计
				</button>

				<button class="uni-btn-primary small ml-10" @click="openAddPopup">
					<uni-icons type="plusempty" size="12" color="#fff"></uni-icons>
					客户录入
				</button>
			</view>

			<view class="customer-list">
				<view class="list-header">
					<text class="col-info">基础信息</text>
					<text class="col-source">来源渠道</text>
					<text class="col-plan">出行计划</text>
					<text class="col-follow">销售跟进情况</text>
					<text class="col-sales">销售/管家</text>
					<text class="col-status">状态/评价</text>
					<text class="col-opt">操作</text>
				</view>

				<scroll-view scroll-y="true" class="list-body">
					<view v-if="isLoading" class="loading-state-inner">
						<uni-load-more status="loading" />
					</view>

					<view class="empty-state" v-else-if="customers.length === 0">
						<text>暂无匹配客户数据</text>
					</view>

					<view class="list-row" v-for="cust in customers" :key="cust._id" v-else>
						<view class="col-info">
							<view class="ci-row-top">
								<view class="channel-badge" :class="getChannelStyle(cust.contact_channel).cls">
									<uni-icons :type="getChannelStyle(cust.contact_channel).icon" size="11" color="#fff" style="margin-right: 2px"></uni-icons>
									<text>{{ cust.contact_channel || '未知渠道' }}</text>
								</view>
								<template v-if="cust.wx_name_id">
									<text class="wx-id text-ellipsis" :title="cust.wx_name_id">{{ cust.wx_name_id }}</text>
								</template>
							</view>
							<view class="ci-row-bottom">
								<text class="date">{{ formatDate(cust.reception_time).split(' ')[0] }}</text>
								<text class="divider">|</text>
								<text class="mobile">{{ cust.mobile }}</text>
							</view>
						</view>

						<view class="col-source">
							<view class="source-tag" :class="getSourceClass(cust.source)">{{ cust.source }}</view>
						</view>

						<view class="col-plan">
							<view v-if="cust.recommended_route || cust.departure_date" class="plan-card compact">
								<view class="pc-row primary">
									<uni-icons type="paperplane-filled" size="12" color="#0369a1"></uni-icons>
									<text class="pc-dest" :title="cust.recommended_route">{{ cust.recommended_route || '未定' }}</text>
								</view>

								<view class="pc-row meta">
									<text v-if="cust.departure_date">{{ formatDate(cust.departure_date).split(' ')[0] }}</text>
									<text v-else class="text-light">待定</text>

									<text v-if="cust.travelers_count" class="divider">·</text>
									<text v-if="cust.travelers_count">{{ cust.travelers_count }}人</text>

									<text v-if="cust.total_days" class="divider">·</text>
									<text v-if="cust.total_days">{{ cust.total_days }}天</text>
								</view>
							</view>
							<text v-else class="text-gray">-</text>
						</view>

						<view class="col-follow">
							<scroll-view scroll-y="true" class="follow-scroll-box">
								<view v-if="Array.isArray(cust.follow_up) && cust.follow_up.length > 0">
									<view v-for="(item, index) in cust.follow_up" :key="index" class="history-row">
										<text class="date-tag">{{ formatDate(item.time) }}</text>
										<text class="content-text">{{ item.content }}</text>
									</view>
								</view>
								<view v-else-if="cust.follow_up && typeof cust.follow_up === 'string'" class="history-row">
									<text class="date-tag">历史</text>
									<text class="content-text">{{ cust.follow_up }}</text>
								</view>
								<text class="text-gray" v-else>暂无记录</text>
							</scroll-view>
						</view>

						<view class="col-sales">
							<view class="sales-row-top">
								<uni-icons type="chat" size="12" color="#6b7280"></uni-icons>
								<text class="sales-name">{{ cust.sales_name || '未分配' }}</text>
								<view v-if="cust.status === 'deal'" class="sales-score-mini">
									<uni-icons type="star-filled" size="11" color="#f59e0b"></uni-icons>
									<text>{{ cust.sales_score || '-' }}</text>
								</view>
							</view>
							<view class="butler-row">
								<uni-icons type="person" size="12" color="#6b7280"></uni-icons>
								<text v-if="cust.attendant_name">{{ cust.attendant_name }}</text>
								<text v-else class="text-gray-small mt-1">未分配</text>
							</view>
						</view>

						<view class="col-status">
							<view class="status-row-top">
								<view class="status-badge" :class="'st-' + cust.status">
									{{ getStatusLabel(cust.status) }}
								</view>
								<view v-if="cust.order_id" class="order-link" @click.stop="navigateToOrder(cust.order_id)">
									{{ cust.order_id }}
								</view>
							</view>
							<view class="status-row-bottom">
								<text v-if="cust.status === 'deal'" class="final-amount">¥{{ cust.final_amount }}</text>
								<view v-if="cust.review" class="review-badge compact" :class="getReviewClass(cust.review)">
									{{ getReviewLabel(cust.review) }}
								</view>
								<text v-else-if="cust.status === 'deal'" class="text-gray-small">暂无评价</text>
							</view>
						</view>

						<view class="col-opt">
							<view class="icon-btn orange" @click="editCustomer(cust)"><uni-icons type="compose" size="18" color="#f59e0b"></uni-icons></view>
							<view class="icon-btn red" @click="deleteCustomer(cust._id)"><uni-icons type="trash" size="18" color="#ef4444"></uni-icons></view>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>

		<uni-popup ref="editPopup" type="center" :is-mask-click="false">
			<view class="edit-card">
				<view class="card-header">
					<text class="card-title">{{ editingCust._id ? '编辑客户档案' : '录入新客户' }}</text>
					<uni-icons type="closeempty" size="20" color="#666" @click="$refs.editPopup.close()"></uni-icons>
				</view>

				<scroll-view scroll-y="true" class="edit-body">
					<view class="form-section-title">基本信息</view>
					<view class="form-row">
						<view class="form-item half">
							<text class="label">客户姓名</text>
							<input class="input" v-model="editingCust.name" placeholder="姓名" />
						</view>
						<view class="form-item half">
							<text class="label">手机号码</text>
							<input class="input" v-model="editingCust.mobile" placeholder="11位手机号" type="number" maxlength="11" />
						</view>
					</view>

					<view class="form-row">
						<view class="form-item half" style="flex: 0.6; margin-right: 10px">
							<text class="label">联系渠道</text>
							<picker :range="contactChannelOptions" @change="(e) => (editingCust.contact_channel = contactChannelOptions[e.detail.value])" class="picker">
								<view class="picker-text">{{ editingCust.contact_channel || '请选择' }}</view>
							</picker>
						</view>
						<view class="form-item half" style="flex: 1.4">
							<text class="label">微信名称/ID</text>
							<input class="input" v-model="editingCust.wx_name_id" placeholder="客户微信展示名或ID" />
						</view>
					</view>

					<view class="form-row">
						<view class="form-item half">
							<text class="label">接待时间</text>
							<uni-datetime-picker
								type="datetime"
								return-type="timestamp"
								v-model="editingCust.reception_time"
								:border="false"
								class="date-picker-custom"
								style="padding: 0; border: 1px solid #e5e7eb; border-radius: 6px" />
						</view>
						<view class="form-item half">
							<text class="label required">
								分配销售
								<text style="color: #3b82f6; font-size: 11px; margin-left: 5px">（按综合评分排序）</text>
							</text>
							<custom-picker
								:options="salesOptions"
								:value="currentSalesObj"
								label-key="displayText"
								value-key="_id"
								placeholder="请选择销售"
								@change="(item) => (editingCust.sales_id = item._id)" />
						</view>
					</view>

					<view class="form-section-title">预计出行计划</view>
					<view class="form-row">
						<view class="form-item half">
							<text class="label">
								预计出行时间
								<text v-if="editingCust.order_id" style="color: #3b82f6; font-weight: bold">(已绑定)</text>
							</text>
							<uni-datetime-picker
								type="date"
								return-type="timestamp"
								v-model="editingCust.departure_date"
								:border="false"
								class="date-picker-custom"
								@change="onDepartureDateChange"
								style="padding: 0; border: 1px solid #e5e7eb; border-radius: 6px"
								:style="editingCust.order_id ? 'border-color: #3b82f6; background-color: #eff6ff;' : ''" />
						</view>
						<view class="form-item half">
							<text class="label">目的地</text>
							<input class="input" v-model="editingCust.destination" placeholder="计划出行的目的地" />
						</view>
					</view>
					<view class="form-row">
						<view class="form-item half">
							<text class="label">预计出行人数</text>
							<input class="input" type="number" v-model="editingCust.travelers_count" placeholder="数字" />
						</view>
						<view class="form-item half">
							<text class="label">
								预计出行天数
								<text v-if="editingCust.order_id" style="color: #3b82f6; font-weight: bold">(已绑定)</text>
							</text>
							<input
								class="input"
								type="number"
								v-model="editingCust.total_days"
								placeholder="数字"
								:style="editingCust.order_id ? 'border-color: #3b82f6; background-color: #eff6ff;' : ''" />
						</view>
					</view>

					<view class="form-item">
						<text class="label">
							推荐产品线路
							<text v-if="editingCust.order_id" style="color: #3b82f6; font-size: 11px; margin-left: 5px">(关联订单标题)</text>
						</text>
						<input
							class="input"
							v-model="editingCust.recommended_route"
							placeholder="填写推荐产品线路..."
							:style="editingCust.order_id ? 'border-color: #3b82f6; background-color: #eff6ff;' : ''" />
					</view>

					<view class="form-section-title">业务详情</view>
					<view class="form-item">
						<view class="flex-row-between mb-2">
							<text class="label mb-0">销售跟进记录</text>
							<view class="text-btn" @click="addFollowUpItem">
								<uni-icons type="plusempty" size="12" color="#3b82f6"></uni-icons>
								<text>添加一条</text>
							</view>
						</view>

						<view class="history-review-box-editable">
							<view v-if="!editingCust.follow_up || editingCust.follow_up.length === 0" class="empty-tip">暂无跟进记录，点击右上角添加</view>

							<view v-for="(item, idx) in editingCust.follow_up" :key="idx" class="review-row-editable">
								<view class="row-left">
									<uni-datetime-picker type="datetime" v-model="item.time" :border="false" :clear-icon="false" class="mini-date-picker" />
								</view>
								<view class="row-middle">
									<input class="mini-input" v-model="item.content" placeholder="请输入跟进内容" />
								</view>
								<view class="row-right" @click="removeFollowUp(idx)">
									<uni-icons type="trash" size="16" color="#9ca3af"></uni-icons>
								</view>
							</view>
						</view>
					</view>

					<view class="form-section-title">分类与状态</view>
					<view class="form-row">
						<view class="form-item half">
							<text class="label required">来源渠道</text>
							<picker
								:range="sourceOptions"
								@change="(e) => (editingCust.source = sourceOptions[e.detail.value])"
								class="picker"
								:class="{ 'disabled-picker': !!editingCust._id }"
								:disabled="!!editingCust._id">
								<view class="picker-text">{{ editingCust.source || '请选择' }}</view>
							</picker>
						</view>
						<view class="form-item half">
							<text class="label required">客户状态</text>
							<picker :range="statusOptions" range-key="label" @change="onStatusChange" class="picker">
								<view class="picker-text">{{ getStatusLabel(editingCust.status) }}</view>
							</picker>
						</view>
					</view>

					<view class="form-row" v-if="editingCust.status === 'deal'">
						<view class="form-item mr-5" style="flex: 2">
							<text class="label">成交订单ID</text>
							<view style="display: flex; align-items: center; gap: 8px">
								<view style="flex: 1">
									<input
										class="input"
										v-model="editingCust.order_id"
										placeholder="请输入订单号"
										@blur="syncOrderDetail(editingCust.order_id)"
										:style="editingCust.order_id ? 'border-color: #3b82f6; background-color: #eff6ff;' : ''" />
								</view>
								<!-- <view style="flex: 1">
									<uni-combox
										:candidates="orderCandidates"
										:loading="orderLoading"
										label-key="order_id"
										value-key="order_id"
										v-model="editingCust.order_id"
										placeholder="输入订单号搜索"
										@input="onOrderSearchInput"
										@click="loadDefaultOrders"
										:style="editingCust.order_id ? 'border-color: #3b82f6; background-color: #eff6ff;' : ''"></uni-combox>
								</view> -->
								<!-- <button
									v-if="editingCust.order_id"
									size="mini"
									type="primary"
									plain
									style="margin: 0; padding: 0 10px; height: 36px; line-height: 36px; font-size: 12px"
									@click="navigateToOrder">
									查看
								</button>
								<button v-else size="mini" type="warn" plain style="margin: 0; padding: 0 10px; height: 36px; line-height: 36px; font-size: 12px" @click="navigateToCreateOrder">
									新建
								</button> -->
							</view>
						</view>
						<!-- <view class="form-item" style="flex: 1">
							<text class="label">
								成交金额 (元)
								<text v-if="editingCust.order_id" style="color: #3b82f6; font-weight: bold">(已绑定)</text>
							</text>
							<input
								class="input"
								type="digit"
								v-model="editingCust.final_amount"
								placeholder="0.00"
								:style="editingCust.order_id ? 'border-color: #3b82f6; background-color: #eff6ff;' : ''" />
						</view> -->
					</view>

					<view class="form-row">
						<view class="form-item w-full">
							<text class="label">备注信息</text>
							<textarea class="textarea small" v-model="editingCust.remarks" placeholder="其他备注信息" :maxlength="-1" />
						</view>
					</view>

					<!-- <view class="form-row" v-if="editingCust.status === 'deal' && editingCust.order_id">
						<view class="form-item" style="width: 100%">
							<text class="label">
								分配管家
								<text style="color: #3b82f6; font-size: 11px; margin-left: 5px">（按综合评分排序，并显示出发日期前后5天的在团情况）</text>
								<text v-if="attendantLoading" class="text-gray-small">(加载中...)</text>
							</text>
							<custom-picker
								v-if="editingCust.departure_date"
								class="wide-picker"
								:options="attendantOptions"
								:value="currentAttendantObj"
								label-key="displayText"
								value-key="_id"
								placeholder="选择管家 (按评分及排期排序)"
								@change="(item) => (editingCust.attendant_id = item._id)" />
							<view v-else class="fake-input-disabled">请先填写出发日期以加载排期</view>

							<view v-if="currentAttendantTimeline.length > 0" class="timeline-container">
								<view class="timeline-header">
									<text>排期预览 (出发日前后5天):</text>
									<view class="legend">
										<view class="legend-item">
											<view class="dot red"></view>
											在团
										</view>
										<view class="legend-item">
											<view class="dot gray"></view>
											空闲
										</view>
										<view class="legend-item">
											<view class="dot blue-border"></view>
											出发日
										</view>
									</view>
								</view>
								<view class="timeline-blocks">
									<view
										v-for="(day, index) in currentAttendantTimeline"
										:key="index"
										class="time-block"
										:class="{
											busy: day.isBusy,
											target: day.isTarget,
											today: day.isToday
										}"
										@click="showToast(day.dateStr + (day.isBusy ? ' 已排' : ' 空闲'))">
										<text class="tiny-date">{{ day.shortDate }}</text>
									</view>
								</view>
							</view>
						</view>
					</view> -->

					<!-- <view class="form-row" v-if="editingCust.status === 'deal'">
						<view class="form-item half mr-5">
							<text class="label">服务评价 (客户评)</text>
							<picker :range="reviewOptions" range-key="label" @change="(e) => (editingCust.review = reviewOptions[e.detail.value].value)" class="picker">
								<view class="picker-text">{{ getReviewLabel(editingCust.review) || '暂无评价' }}</view>
							</picker>
						</view>
						<view class="form-item half">
							<text class="label ml-5">销售评价</text>
							<slider
								:value="editingCust.sales_score"
								min="0"
								max="10"
								step="1"
								show-value
								activeColor="#3b82f6"
								block-size="20"
								@change="(e) => (editingCust.sales_score = e.detail.value)" />
						</view>
					</view> -->
				</scroll-view>

				<view class="btn-row">
					<button class="btn cancel" @click="$refs.editPopup.close()">取消</button>
					<button class="btn submit" :loading="isSaving" @click="saveCustomer">保存</button>
				</view>
			</view>
		</uni-popup>

		<uni-popup ref="invalidPopup" type="center" :is-mask-click="true">
			<view class="edit-card" style="width: 350px; height: auto; max-height: 600px">
				<view class="card-header">
					<text class="card-title">无效沟通统计</text>
					<uni-icons type="closeempty" size="20" color="#666" @click="$refs.invalidPopup.close()"></uni-icons>
				</view>

				<view class="edit-body" style="padding-bottom: 20px">
					<view class="stats-input-box">
						<view class="form-item">
							<text class="label">选择日期</text>
							<uni-datetime-picker type="date" :border="false" v-model="invalidForm.date" @change="fetchInvalidCount" class="date-picker-custom" />
						</view>
						<view class="form-item">
							<text class="label">无效沟通 (次)</text>
							<view class="counter-box">
								<view class="count-btn" @click="invalidForm.count > 0 ? invalidForm.count-- : 0">-</view>
								<input class="count-input" type="number" v-model.number="invalidForm.count" />
								<view class="count-btn plus" @click="invalidForm.count++">+</view>
							</view>
						</view>
						<button class="uni-btn-primary" style="width: 100%; margin-top: 10px" :loading="isSavingStats" @click="saveInvalidStats">保存 / 更新</button>
					</view>

					<view class="form-section-title" style="margin-top: 20px">近7天记录</view>
					<view class="stats-history-list">
						<view class="empty-state" v-if="invalidHistory.length === 0">暂无记录</view>
						<view class="history-item" v-for="(item, index) in invalidHistory" :key="index">
							<text class="h-date">{{ item.date }}</text>
							<view class="h-right-box">
								<text class="h-val">{{ item.ineffective_count }} 次</text>
								<view class="del-btn" @click="deleteInvalidStat(item)">
									<uni-icons type="trash" size="15" color="#9ca3af"></uni-icons>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
const db = uniCloud.database();
const dbCmd = db.command;
const operationCenter = uniCloud.importObject('a-operation-center');
const attendantNotifier = uniCloud.importObject('attendant-notifier');
import { onShow } from '@dcloudio/uni-app';
import CustomPicker from '@/components/custom-picker/custom-picker.vue';

function debounce(fn, delay = 500) {
	let timer = null;
	return function () {
		let args = arguments;
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			fn.apply(this, args);
		}, delay);
	};
}

export default {
	components: {
		CustomPicker
	},
	data() {
		return {
			isLoading: true,
			isSaving: false,

			customers: [],
			salesList: [],
			salesOptions: [],
			attendantList: [],
			attendantMap: {},
			attendantOptions: [],
			attendantLoading: false,
			attendantScheduleMap: {},
			tempNewFollowUp: '',
			originalCust: null,

			stats: { total: 0, deal: 0, following: 0, newToday: 0 },

			// 筛选数据
			filters: { keyword: '', source: '', status: '', salesId: '', statusLabel: '', salesLabel: '', score: '', date: '' },

			// 字典定义 (完全对应 Schema)
			sourceOptions: ['复购', '转介绍', '抖音', '小红书', '飞猪', '携程定制', '携程私家团', '小程序'],
			contactChannelOptions: ['个人微信', '携程企微', '风漫企微'],

			statusOptions: [
				{ label: '跟进中', value: 'following' },
				{ label: '已成交', value: 'deal' },
				{ label: '待拼团', value: 'waiting_group' },
				{ label: '已流失', value: 'lost' }
			],

			reviewOptions: [
				{ label: '差评/诋毁（4.5星以下）', value: 'bad' },
				{ label: '4.5星+10分推荐', value: 'ok_recommend' },
				{ label: '五星+无图', value: 'good_nopic' },
				{ label: '五星+带图', value: 'good_pic' },
				{ label: '五星+无图+10分推荐', value: 'good_nopic_recommend' },
				{ label: '五星+带图+10分推荐', value: 'good_pic_recommend' }
			],

			// 编辑对象
			editingCust: {
				wx_name_id: '',
				contact_channel: '',
				name: '',
				mobile: '',
				source: '',
				sales_id: '',
				attendant_id: '',
				follow_up: '',
				added_qywx: 0,
				destination: '',
				departure_date: null,
				travelers_count: null,
				total_days: null,
				recommended_route: '',
				status: 'following',
				order_id: '',
				sales_score: 5, // 默认为5分
				final_amount: '', // 临时字段，不直接存入 customers 表，用于 UI 绑定
				review: '',
				remarks: '',
				reception_time: null
			},

			orderCandidates: [], // 存储搜索到的订单号列表
			orderSearchTimer: null, // 定时器引用
			orderLoading: false,
			syncTimer: null,

			// 无效统计相关数据
			invalidForm: {
				date: '',
				count: 0
			},
			invalidHistory: [],
			isSavingStats: false
		};
	},
	mounted() {
		this.initData();
	},
	onShow() {
		// 如果当前弹窗是打开状态，且正在编辑某客户，则刷新该客户数据
		if (this.$refs.editPopup && this.editingCust._id) {
			this.reloadCurrentCustomer();
		} else {
			// 如果没有打开弹窗，通常也建议刷新一下列表
			this.refreshData();
		}
	},
	onLoad(options) {
		if (options.source) {
			this.filters.source = options.source;
		}
		if (options.status) {
			this.filters.status = options.status;
			// 简单回显 Label (根据 statusOptions 查找)
			const match = this.statusOptions.find((o) => o.value === options.status);
			this.filters.statusLabel = match ? match.label : options.status === 'intent' ? '意向客户' : options.status;
		}
		if (options.date) {
			this.filters.date = options.date;
		}
		if (options.score) {
			this.filters.score = Number(options.score);
		}
		// 如果是从图表跳转过来的，自动刷新
		if (Object.keys(options).length > 0) {
			this.refreshData();
		}

		// 监听订单创建成功的事件
		uni.$on('ORDER_CREATED_SUCCESS', (data) => {
			if (this.editingCust && this.editingCust._id === data.customerId) {
				// 1. 关闭编辑弹窗
				this.$refs.editPopup.close();

				// 2. 刷新列表
				this.refreshData();

				// 3. 明确提示成功
				setTimeout(() => {
					uni.showToast({ title: '订单创建成功', icon: 'success' });
				}, 500);
			}
		});
	},
	onUnload() {
		uni.$off('ORDER_CREATED_SUCCESS');
	},
	computed: {
		// 获取当前选中管家的时间轴数据
		currentAttendantTimeline() {
			if (!this.editingCust.attendant_id || !this.attendantList.length) return [];
			const attendant = this.attendantList.find((u) => u._id === this.editingCust.attendant_id);
			return attendant ? attendant.timeline || [] : [];
		},
		// 获取当前选中的销售对象
		currentSalesObj() {
			if (!this.salesOptions || !this.salesOptions.length) return null;
			return this.salesOptions.find((o) => o._id === this.editingCust.sales_id) || null;
		},
		// 获取当前选中的管家对象
		currentAttendantObj() {
			if (!this.attendantOptions || !this.attendantOptions.length) return null;
			return this.attendantOptions.find((o) => o._id === this.editingCust.attendant_id) || null;
		}
	},
	watch: {
		// 监听订单ID变化
		'editingCust.order_id': function (newVal) {
			// 1. 如果ID被清空，或者太短（可能只是在输入搜索关键词），不执行同步
			if (!newVal || newVal.length < 5) return;

			// 2. 防抖处理：停止输入/选择后 0.5秒 执行同步，避免打字时频繁请求
			if (this.syncTimer) clearTimeout(this.syncTimer);
			this.syncTimer = setTimeout(() => {
				this.syncOrderDetail(newVal);
			}, 500);
		}
	},
	methods: {
		async initData() {
			try {
				// 1. 获取销售列表
				const salesRes = await db.collection('uni-id-users').where({ role: 'sale' }).field('_id, nickname, username').get();
				let rawSalesList = salesRes.result.data;

				// 2. 获取销售评分
				let salesScores = [];
				try {
					const scoreRes = await operationCenter.getAssessmentData({ role: 'sale' });
					if (scoreRes.data) {
						salesScores = Array.isArray(scoreRes.data) ? scoreRes.data : [scoreRes.data];
					}
				} catch (e) {
					console.error('获取销售评分失败', e);
				}

				// 3. 合并评分并排序
				this.salesList = rawSalesList.map((s) => {
					const scoreObj = salesScores.find((sc) => sc.user_id === s._id);
					return {
						_id: s._id,
						nickname: s.nickname || s.username || '销售员',
						total_score: scoreObj ? scoreObj.total_score : 0, // 默认0分
						displayText: `${s.nickname || s.username} (${scoreObj ? scoreObj.total_score : '-'}分)`
					};
				});

				// 按评分降序排列
				this.salesList.sort((a, b) => b.total_score - a.total_score);

				this.salesOptions = [{ _id: '', nickname: '未分配', displayText: '未分配' }, ...this.salesList];

				// 获取当前登录用户ID
				const currentUser = uniCloud.getCurrentUserInfo();
				const currentUid = currentUser.uid;

				// 1. 如果是新建客户（没有_id），且当前用户在销售列表中，自动选中
				if (!this.editingCust._id && currentUid) {
					const match = this.salesOptions.find((s) => s._id === currentUid);
					if (match) {
						this.editingCust.sales_id = match._id;
					}
				}

				const attRes = await db.collection('uni-id-users').where({ role: 'attendant' }).field('_id, nickname').get();
				if (attRes.result.data) {
					attRes.result.data.forEach((u) => {
						this.attendantMap[u._id] = u.nickname || '管家';
					});
				}

				this.refreshData();
			} catch (e) {
				console.error('初始化数据失败', e);
			}
		},

		async loadAttendantsData() {
			if (!this.editingCust.departure_date || this.editingCust.status !== 'deal') {
				this.attendantOptions = [];
				return;
			}

			this.attendantLoading = true;
			try {
				// 1. 获取基础信息 (保持不变)
				const usersRes = await db.collection('uni-id-users').where({ role: 'attendant' }).field('_id, nickname, mobile').get();
				let rawUsers = usersRes.result.data;

				// 2. 获取评分 (保持不变)
				let scores = [];
				try {
					const sRes = await operationCenter.getAssessmentData({ role: 'attendant' });
					scores = Array.isArray(sRes.data) ? sRes.data : [];
				} catch (e) {}

				// 3. 获取排期数据
				const depDate = this.editingCust.departure_date;
				const totalDays = Number(this.editingCust.total_days) || 1;
				// 扩大查询范围
				const startDate = depDate - 6 * 24 * 3600 * 1000;
				const endDate = depDate + (totalDays + 6) * 24 * 3600 * 1000;

				let scheduleRawMap = {}; // 存储原始排期段
				try {
					const schRes = await operationCenter.getScheduleMatrix({ startDate, endDate });
					scheduleRawMap = schRes.data?.attendants || {};
				} catch (e) {
					console.error('排期获取失败', e);
				}

				// 4. 组装数据 & 计算 Timeline
				this.attendantList = rawUsers.map((u) => {
					const scoreObj = scores.find((s) => s.user_id === u._id);
					const score = scoreObj ? scoreObj.total_score : 0;

					const ranges = scheduleRawMap[u._id] || [];
					const timeline = [];
					let busyRanges = []; // 存储最终的日期段，如 ['1.1-1.3', '1.5']
					let currentRange = null; // 当前正在记录的连续段
					let conflictCount = 0;

					// 辅助：标准化时间到 00:00:00
					const getDayTime = (ts) => new Date(new Date(ts).setHours(0, 0, 0, 0)).getTime();
					const targetDayTime = getDayTime(depDate);

					for (let i = -5; i <= 5; i++) {
						const currentTs = targetDayTime + i * 24 * 3600 * 1000;
						const dateObj = new Date(currentTs);
						const shortDate = `${dateObj.getMonth() + 1}.${dateObj.getDate()}`;
						const fullDateStr = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`;

						// 检查这一天是否在任何行程段内
						// 只要 (currentTs >= range.start && currentTs <= range.end) 就算忙
						const isBusy = ranges.some((range) => {
							const rStart = getDayTime(range.start);
							const rEnd = getDayTime(range.end);
							return currentTs >= rStart && currentTs <= rEnd;
						});

						if (isBusy) {
							conflictCount++;
							if (!currentRange) {
								// 开启新的一段
								currentRange = { start: shortDate, end: shortDate };
							} else {
								// 延续当前段
								currentRange.end = shortDate;
							}
						} else {
							// 遇到空闲，如果之前有正在记录的段，先结算
							if (currentRange) {
								const str = currentRange.start === currentRange.end ? currentRange.start : `${currentRange.start}-${currentRange.end}`;
								busyRanges.push(str);
								currentRange = null;
							}
						}

						timeline.push({
							timestamp: currentTs,
							dateStr: fullDateStr,
							shortDate: shortDate,
							isBusy: isBusy,
							isTarget: i === 0, // 是否是出发当天
							isToday: getDayTime(Date.now()) === currentTs
						});
					}

					if (currentRange) {
						const str = currentRange.start === currentRange.end ? currentRange.start : `${currentRange.start}-${currentRange.end}`;
						busyRanges.push(str);
					}

					// --- 计算这11天窗口内涉及的团数量 ---
					const windowStart = targetDayTime - 5 * 24 * 3600 * 1000;
					const windowEnd = targetDayTime + 5 * 24 * 3600 * 1000;

					// 过滤出与当前窗口有重叠的行程段
					const activeToursCount = ranges.filter((range) => {
						const rStart = getDayTime(range.start);
						const rEnd = getDayTime(range.end);
						// 判断区间重叠: start1 <= end2 && start2 <= end1
						return rStart <= windowEnd && rEnd >= windowStart;
					}).length;

					// 生成 Picker 显示的文字
					let statusText = '空闲';
					if (conflictCount > 0) {
						statusText = `(${busyRanges.join(',')})`;
					}

					const tourCountStr = activeToursCount > 0 ? `${activeToursCount}个团 ` : '';

					return {
						_id: u._id,
						mobile: u.mobile,
						nickname: u.nickname || '管家',
						total_score: score,
						conflictCount: conflictCount,
						timeline: timeline, // 存入 timeline 数据供前端渲染
						displayText: `${u.nickname} (${score}分) | ${tourCountStr}${statusText}`
					};
				});

				// 排序: 评分高 -> 冲突少
				this.attendantList.sort((a, b) => {
					if (b.total_score !== a.total_score) return b.total_score - a.total_score;
					return a.conflictCount - b.conflictCount;
				});

				this.attendantOptions = [{ _id: '', displayText: '未分配' }, ...this.attendantList];
			} catch (e) {
				console.error('管家数据加载失败', e);
			} finally {
				this.attendantLoading = false;
			}
		},

		showToast(msg) {
			uni.showToast({ title: msg, icon: 'none' });
		},

		async refreshData() {
			this.isLoading = true;
			try {
				let where = {};
				if (this.filters.keyword) {
					where = dbCmd.or([{ name: new RegExp(this.filters.keyword) }, { mobile: new RegExp(this.filters.keyword) }, { wx_name_id: new RegExp(this.filters.keyword) }]);
				}
				if (this.filters.source) where.source = this.filters.source;
				if (this.filters.status) {
					if (this.filters.status === 'intent') {
						where.status = dbCmd.neq('new');
					} else {
						where.status = this.filters.status;
					}
				}
				if (this.filters.salesId) where.sales_id = this.filters.salesId;
				if (this.filters.score !== '' && this.filters.score !== undefined) {
					where.sales_score = this.filters.score;
				}
				if (this.filters.date) {
					const startTs = new Date(this.filters.date + ' 00:00:00').getTime();
					const endTs = new Date(this.filters.date + ' 23:59:59').getTime();
					const dateQuery = dbCmd.or([
						{ reception_time: dbCmd.gte(startTs).and(dbCmd.lte(endTs)) },
						{ reception_time: dbCmd.exists(false), created_at: dbCmd.gte(startTs).and(dbCmd.lte(endTs)) }
					]);
					if (Object.keys(where).length > 0) {
						where = dbCmd.and(where, dateQuery);
					} else {
						where = dateQuery;
					}
				}

				// 1. 查询客户列表
				const res = await db.collection('a-customers').where(where).orderBy('created_at', 'desc').limit(50).get();
				let list = res.result.data;

				// 2. 提取成交订单ID
				const dealOrderIds = list.filter((c) => c.status === 'deal' && c.order_id).map((c) => c.order_id);

				// 3. 批量查询快照详情 (金额、标题、时间、天数)
				let snapshotMap = {}; // 存储结构: { order_id: { final_amount, title, ... } }

				if (dealOrderIds.length > 0) {
					try {
						const snapshotRes = await db
							.collection('a-snapshots')
							.where({
								order_id: dbCmd.in(dealOrderIds)
							})
							.field('order_id, final_amount, departure_date, total_days, title, staves')
							.get();

						snapshotRes.result.data.forEach((s) => {
							snapshotMap[s.order_id] = s;
						});
					} catch (err) {
						console.error('快照数据加载失败', err);
					}
				}

				// 4. 数据组装 (优先使用快照数据)
				this.customers = list.map((c) => {
					// 获取对应的快照数据
					const snap = c.order_id ? snapshotMap[c.order_id] : null;

					let attendantName = '';
					if (snap && Array.isArray(snap.staves)) {
						const att = snap.staves.find((s) => s.role === 'attendant');
						if (att && att.id) {
							attendantName = this.attendantMap[att.id] || '未知管家';
						}
					}

					return {
						...c,
						sales_name: this.getSalesName(c.sales_id),
						attendant_name: attendantName,
						// 1. 金额
						final_amount: snap ? snap.final_amount || 0 : 0,

						// 2. 产品路线 (快照里的 title 对应 列表里的 recommended_route)
						recommended_route: snap ? snap.title || c.recommended_route : c.recommended_route,

						// 3. 出发日期
						departure_date: snap ? snap.departure_date || c.departure_date : c.departure_date,

						// 4. 总天数
						total_days: snap ? snap.total_days || c.total_days : c.total_days
					};
				});

				this.calculateStats();
			} catch (e) {
				uni.showToast({ title: '加载失败', icon: 'none' });
				console.error(e);
			} finally {
				this.isLoading = false;
			}
		},

		// 重新加载当前编辑的客户数据 (用于从订单页返回后同步 OrderID)
		async reloadCurrentCustomer() {
			if (!this.editingCust._id) return;
			try {
				const res = await db.collection('a-customers').doc(this.editingCust._id).get();
				if (res.result.data && res.result.data.length > 0) {
					const latestData = res.result.data[0];

					if (!this.editingCust.order_id && latestData.order_id) {
						this.editingCust.order_id = latestData.order_id;
						// this.$refs.editPopup.close(); // 关闭弹窗
						this.refreshData(); // 刷新列表
						// uni.showToast({ title: '订单创建成功', icon: 'success' });
						// return;
					}
				}
			} catch (e) {
				console.error('刷新客户数据失败', e);
			}
		},

		navigateToCreateOrder() {
			const cust = this.editingCust;
			const source = cust.source || '';

			// 准备要传递的参数
			const params = {
				action: 'create',
				source: source,
				customerId: cust._id,
				// 如果有成交金额则传递
				final_amount: cust.final_amount || '',
				// 如果有出发日期则传递
				departure_date: cust.departure_date || '',
				// 如果有天数则传递
				total_days: cust.total_days || '',
				// 将推荐产品线作为标题传递，注意进行编码防止特殊字符导致解析错误
				product_title: cust.recommended_route ? encodeURIComponent(cust.recommended_route) : ''
			};

			// 拼接查询字符串
			const queryString = Object.keys(params)
				.filter((key) => params[key] !== '') // 过滤空值
				.map((key) => `${key}=${params[key]}`)
				.join('&');

			uni.navigateTo({
				url: `/pages/a-orders/list?${queryString}`,
				fail: (err) => {
					console.error('跳转失败', err);
					uni.showToast({ title: '无法跳转到订单页', icon: 'none' });
				}
			});
		},

		calculateStats() {
			// 简单前端统计 (实际应走聚合查询)
			const today = new Date().setHours(0, 0, 0, 0);
			this.stats = {
				total: this.customers.length,
				deal: this.customers.filter((c) => c.status === 'deal').length,
				following: this.customers.filter((c) => c.status === 'following').length,
				newToday: this.customers.filter((c) => c.created_at >= today).length
			};
		},

		// --- 辅助显示函数 ---
		// 获取联系渠道的样式配置
		getChannelStyle(channel) {
			if (!channel) return { cls: 'ch-default', icon: 'help' };

			if (channel.includes('个人微信')) {
				return { cls: 'ch-wx', icon: 'weixin' }; // 绿色 + 微信图标
			} else if (channel.includes('携程')) {
				return { cls: 'ch-ctrip', icon: 'headphones' }; // 蓝色 + 客服图标
			} else if (channel.includes('风漫')) {
				return { cls: 'ch-corp', icon: 'staff-filled' }; // 橙色/品牌色 + 员工图标
			}

			return { cls: 'ch-default', icon: 'chat' }; // 默认灰色
		},
		getSalesName(id) {
			const s = this.salesList.find((x) => x._id === id);
			return s ? s.nickname : ''; // 列表中只显示名字，不显示评分
		},
		getSalesDisplayText(id) {
			// 编辑弹窗中显示带评分的文本
			const s = this.salesOptions.find((x) => x._id === id);
			return s ? s.displayText : '';
		},
		getAttendantDisplayText(id) {
			const s = this.attendantOptions.find((x) => x._id === id);
			return s ? s.displayText : '';
		},
		getAttendantScheduleTip(id) {
			if (!id || !this.attendantScheduleMap) return '';
			const count = this.attendantScheduleMap[id] || 0;
			return count > 0 ? `该管家在出发日前后5天内已有 ${count} 个团` : '';
		},
		getStatusLabel(val) {
			const item = this.statusOptions.find((o) => o.value === val);
			return item ? item.label : val;
		},
		getReviewLabel(val) {
			const item = this.reviewOptions.find((o) => o.value === val);
			return item ? item.label : '';
		},
		getSourceClass(src) {
			const map = {
				携程私家团: 'bg-blue',
				携程定制: 'bg-cyan',
				小程序: 'bg-orange',
				飞猪: 'bg-yellow',
				小红书: 'bg-red',
				抖音: 'bg-dark',
				复购: 'bg-purple',
				转介绍: 'bg-green'
			};
			return map[src] || 'bg-gray';
		},
		getReviewClass(val) {
			if (!val) return '';
			if (val.includes('bad')) return 'text-red';
			if (val.includes('pic')) return 'text-green';
			return 'text-blue';
		},

		// --- 交互与筛选 ---
		onDepartureDateChange(e) {
			this.editingCust.departure_date = e;
			this.loadAttendantsData(); // 日期改变，重新计算管家排期
		},

		onAssignSales(e) {
			const idx = e.detail.value;
			this.editingCust.sales_id = this.salesOptions[idx]._id;
			if (this.editingCust.sales_id && this.editingCust.status === 'new') {
				this.editingCust.status = 'following';
			}
		},
		onAssignAttendant(e) {
			const idx = e.detail.value;
			this.editingCust.attendant_id = this.attendantOptions[idx]._id;
		},

		removeFollowUp(index) {
			this.editingCust.follow_up.splice(index, 1);
		},
		onSourceFilter(e) {
			this.filters.source = this.sourceOptions[e.detail.value];
			this.refreshData();
		},
		onStatusFilter(e) {
			const item = this.statusOptions[e.detail.value];
			this.filters.statusLabel = item.label;
			this.filters.status = item.value;
			this.refreshData();
		},
		onSalesFilter(e) {
			const idx = e.detail.value;
			this.filters.salesLabel = this.salesOptions[idx].nickname;
			this.filters.salesId = this.salesOptions[idx]._id;
			this.refreshData();
		},
		resetFilters() {
			this.filters = { keyword: '', source: '', status: '', salesId: '', statusLabel: '', salesLabel: '' };
			this.refreshData();
		},

		// 添加日期格式化函数
		formatDate(timestamp) {
			if (!timestamp) return '';
			const date = new Date(timestamp);
			const year = date.getFullYear();
			const month = (date.getMonth() + 1).toString().padStart(2, '0');
			const day = date.getDate().toString().padStart(2, '0');
			const hours = date.getHours().toString().padStart(2, '0');
			const minutes = date.getMinutes().toString().padStart(2, '0');

			// 返回格式：2025-12-30 14:30
			return `${year}-${month}-${day} ${hours}:${minutes}`;
		},

		// 加载默认订单 (点击 Combox 时)
		async loadDefaultOrders() {
			if (this.orderSearchTimer) clearTimeout(this.orderSearchTimer);

			this.orderCandidates = [];
			this.orderLoading = true;

			try {
				const db = uniCloud.database();
				const res = await db.collection('a-snapshots').field('order_id').limit(20).get();

				if (res.result.data) {
					this.orderCandidates = res.result.data;
				}
			} catch (e) {
				console.error('加载默认订单失败', e);
			} finally {
				this.orderLoading = false;
			}
		},

		// 订单搜索方法
		onOrderSearchInput(val) {
			// uni-combox 的 input 事件会返回当前输入值
			if (!val) {
				this.orderCandidates = [];
				return;
			}

			// 防抖调用
			if (this.orderSearchTimer) clearTimeout(this.orderSearchTimer);
			this.orderSearchTimer = setTimeout(async () => {
				this.fetchOrderCandidates(val);
			}, 500);
		},

		// 执行数据库查询
		async fetchOrderCandidates(keyword) {
			try {
				const db = uniCloud.database();
				// 查询 a-snapshots 表，匹配 order_id
				const res = await db
					.collection('a-snapshots')
					.where({
						order_id: new RegExp(keyword, 'i') // 模糊查询
					})
					.field('order_id')
					.limit(20)
					.get();

				if (res.result.data) {
					this.orderCandidates = res.result.data;
				}
			} catch (e) {
				console.error('订单搜索失败', e);
			}
		},

		// 跳转并定位订单
		navigateToOrder(id) {
			// 逻辑判断：
			// 1. 如果 id 是字符串，说明是从列表直接点击过来的，使用传入的 id
			// 2. 否则（是事件对象或undefined），说明是从弹窗点击过来的，使用 editingCust.order_id
			let targetId = '';

			if (typeof id === 'string' && id) {
				targetId = id;
			} else {
				targetId = this.editingCust.order_id;
			}

			if (!targetId) {
				uni.showToast({ title: '无效的订单ID', icon: 'none' });
				return;
			}

			// 跳转到订单列表页，并传递 targetOrderId 参数
			uni.navigateTo({
				url: `/pages/a-orders/list?tab=0&targetOrderId=${targetId}`,
				fail: (err) => {
					console.error('跳转失败，请检查路径是否正确', err);
					uni.showToast({ title: '页面路径错误', icon: 'none' });
				}
			});
		},

		// 根据订单ID同步快照数据到表单
		async syncOrderDetail(orderId) {
			console.log('开始同步订单详情:', orderId);
			try {
				// 查询快照表
				const res = await db.collection('a-snapshots').where({ order_id: orderId }).field('final_amount, staves, departure_date, total_days, title').limit(1).get();

				if (res.result.data && res.result.data.length > 0) {
					const snapshot = res.result.data[0];

					// 1. 同步基础字段
					this.editingCust.final_amount = null;
					if (snapshot.final_amount) this.editingCust.final_amount = snapshot.final_amount;
					if (snapshot.departure_date) this.editingCust.departure_date = snapshot.departure_date;
					if (snapshot.total_days) this.editingCust.total_days = snapshot.total_days;
					if (snapshot.title) this.editingCust.recommended_route = snapshot.title;

					// 2. 同步管家 ID
					// 先重置管家，避免残留
					// this.editingCust.attendant_id = '';
					if (snapshot.staves && Array.isArray(snapshot.staves)) {
						const att = snapshot.staves.find((s) => s.role === 'attendant');
						if (att && att.id) {
							this.editingCust.attendant_id = att.id;
						}
					}

					// 3. 立即刷新管家排期视图
					// 因为 departure_date 变了，attendant_id 可能也变了，必须刷新 Timeline
					this.$nextTick(() => {
						this.loadAttendantsData();
					});

					uni.showToast({ title: '已同步订单数据', icon: 'none' });
				} else {
					// 如果查不到（可能是用户正在输入搜索词，还不是完整ID），这里不做处理，避免报错
					console.log('未找到对应快照，可能是搜索关键词');
				}
			} catch (e) {
				console.error('同步订单详情失败', e);
			}
		},

		// --- 编辑逻辑 ---
		openAddPopup() {
			this.editingCust = {
				wx_name_id: '',
				name: '',
				mobile: '',
				source: '',
				sales_id: '',
				follow_up: [],
				added_qywx: 0,
				destination: '',
				departure_date: null,
				travelers_count: null,
				total_days: null,
				recommended_route: '',
				status: 'following',
				order_id: '',
				sales_score: 5,
				final_amount: '',
				review: '',
				remarks: '',
				reception_time: Date.now()
			};
			this.tempNewFollowUp = '';
			this.orderCandidates = [];
			this.$refs.editPopup.open();
		},

		async editCustomer(cust) {
			this.originalCust = JSON.parse(JSON.stringify(cust));
			this.editingCust = JSON.parse(JSON.stringify(cust));
			if (!this.editingCust.reception_time) this.editingCust.reception_time = this.editingCust.created_at || Date.now();

			// 处理旧数据的 contact_channel 如果为空
			if (!this.editingCust.contact_channel) this.editingCust.contact_channel = '';

			if (!Array.isArray(this.editingCust.follow_up)) {
				this.editingCust.follow_up = this.editingCust.follow_up ? [{ content: this.editingCust.follow_up, time: Date.now() }] : [];
			}

			// 处理管家回显逻辑
			this.editingCust.attendant_id = ''; // 重置
			if (this.editingCust.order_id) {
				this.orderCandidates = [{ order_id: this.editingCust.order_id }];
				// 1. 获取金额
				try {
					const res = await db
						.collection('a-snapshots')
						.where({ order_id: this.editingCust.order_id })
						.field('final_amount, staves, departure_date, total_days, title')
						.limit(1)
						.get();
					if (res.result.data && res.result.data.length > 0) {
						const snapshot = res.result.data[0];
						if (snapshot.final_amount) this.editingCust.final_amount = snapshot.final_amount;
						// 同步 出发日期
						if (snapshot.departure_date) this.editingCust.departure_date = snapshot.departure_date;
						// 同步 总天数
						if (snapshot.total_days) this.editingCust.total_days = snapshot.total_days;
						// 同步 产品线 (对应快照的标题)
						if (snapshot.title) this.editingCust.recommended_route = snapshot.title;
						// 获取当前分配的管家
						if (snapshot.staves) {
							const att = snapshot.staves.find((s) => s.role === 'attendant');
							if (att) this.editingCust.attendant_id = att.id;
						}
					}
				} catch (e) {
					console.error(e);
				}
			}

			// 如果是成交且有日期，加载管家列表
			if (this.editingCust.status === 'deal' && this.editingCust.departure_date) {
				this.loadAttendantsData();
			}

			this.tempNewFollowUp = '';
			this.$refs.editPopup.open();
		},
		onAssignSales(e) {
			const idx = e.detail.value;
			this.editingCust.sales_id = this.salesOptions[idx]._id;
		},
		onStatusChange(e) {
			this.editingCust.status = this.statusOptions[e.detail.value].value;
		},

		addFollowUpItem() {
			if (!Array.isArray(this.editingCust.follow_up)) {
				this.editingCust.follow_up = [];
			}
			// 直接推入数组，默认当前时间，内容为空
			this.editingCust.follow_up.unshift({
				time: Date.now(),
				content: ''
			});
		},

		async saveCustomer() {
			// 校验
			if (!this.editingCust.source) return uni.showToast({ title: '请选择来源', icon: 'none' });
			if (this.editingCust.status === 'deal' && !this.editingCust.order_id) {
				return uni.showToast({ title: '已成交客户必须填写订单ID', icon: 'none' });
			}

			this.isSaving = true;
			try {
				// 处理跟进记录：如果有新输入的内容，加入数组头部
				let finalFollowUp = Array.isArray(this.editingCust.follow_up) ? this.editingCust.follow_up.filter((item) => item.content && item.content.trim() !== '') : [];
				finalFollowUp = finalFollowUp.map((item) => ({
					content: item.content,
					time: item.time || Date.now()
				}));

				// 构造数据，剔除临时字段
				const customerPayload = {
					contact_channel: this.editingCust.contact_channel,
					wx_name_id: this.editingCust.wx_name_id,
					name: this.editingCust.name,
					mobile: this.editingCust.mobile,
					source: this.editingCust.source,
					sales_id: this.editingCust.sales_id,
					follow_up: finalFollowUp,
					// added_qywx: this.editingCust.added_qywx,
					destination: this.editingCust.destination,
					departure_date: this.editingCust.departure_date,
					travelers_count: this.editingCust.travelers_count ? Number(this.editingCust.travelers_count) : null, // 确保转为数字
					total_days: this.editingCust.total_days ? Number(this.editingCust.total_days) : null,
					recommended_route: this.editingCust.recommended_route,
					status: this.editingCust.status,
					order_id: this.editingCust.order_id,
					sales_score: this.editingCust.sales_score,
					review: this.editingCust.review,
					remarks: this.editingCust.remarks,
					reception_time: this.editingCust.reception_time
				};

				// 2. 执行客户表更新
				const customerPromise = this.editingCust._id
					? db.collection('a-customers').doc(this.editingCust._id).update(customerPayload)
					: db.collection('a-customers').add(customerPayload);

				// 3. 如果绑定了订单，反向更新 a-snapshots
				let snapshotPromise = Promise.resolve();
				if (this.editingCust.order_id) {
					snapshotPromise = (async () => {
						// 先查询现有快照，获取原有的 staves，防止覆盖掉其他角色（如司机）
						const snapRes = await db.collection('a-snapshots').where({ order_id: this.editingCust.order_id }).field('staves, custom_display_text').get();
						if (snapRes.result.data && snapRes.result.data.length > 0) {
							const snapshot = snapRes.result.data[0];
							let staves = snapshot.staves || [];

							// 1. 移除旧的管家信息 (过滤掉 role 为 attendant 的项)
							staves = staves.filter((s) => s.role !== 'attendant');

							// 2. 如果当前选了管家，添加新的管家信息
							if (this.editingCust.attendant_id) {
								// 从已加载的管家列表中查找完整信息（需要手机号）
								const attUser = this.attendantList.find((u) => u._id === this.editingCust.attendant_id);
								if (attUser) {
									staves.push({
										id: attUser._id,
										mobile: attUser.mobile || '',
										role: 'attendant'
									});
								}
							}

							const snapshotPayload = {
								final_amount: this.editingCust.final_amount ? Number(this.editingCust.final_amount) : 0,
								departure_date: this.editingCust.departure_date,
								total_days: this.editingCust.total_days ? Number(this.editingCust.total_days) : 1,
								title: this.editingCust.recommended_route,
								staves: staves // 更新服务人员列表
							};

							if (snapshot.custom_display_text) {
								let parts = snapshot.custom_display_text.split('##');
								let textChanged = false;

								// 1. 处理销售变更
								if (this.editingCust.sales_id !== this.originalCust.sales_id) {
									const oldSalesName = this.getSalesName(this.originalCust.sales_id);
									const newSalesName = this.getSalesName(this.editingCust.sales_id);

									if (newSalesName && newSalesName !== oldSalesName) {
										parts = parts.map((p) => {
											if (oldSalesName && p.includes(oldSalesName)) {
												textChanged = true;
												return p.split(oldSalesName).join(newSalesName);
											} else if (!p.includes(newSalesName)) {
												textChanged = true;
												return p + ' | ' + newSalesName;
											}
											return p;
										});
									}
								}

								// 2. 处理管家变更
								if (this.editingCust.attendant_id !== this.originalCust.attendant_id) {
									const oldAttName = this.attendantMap[this.originalCust.attendant_id];
									const newAttName = this.attendantMap[this.editingCust.attendant_id];

									if (newAttName && newAttName !== oldAttName) {
										parts = parts.map((p) => {
											if (oldAttName && p.includes(oldAttName)) {
												textChanged = true;
												return p.split(oldAttName).join(newAttName);
											} else if (!p.includes(newAttName)) {
												textChanged = true;
												return p + ' | ' + newAttName;
											}
											return p;
										});
									}
								}

								if (textChanged) {
									snapshotPayload.custom_display_text = parts.join('##');
								}
							}

							return db.collection('a-snapshots').doc(snapshot._id).update(snapshotPayload);
						}
					})();
				}

				// 并行执行
				await Promise.all([customerPromise, snapshotPromise]);

				// 自动创建任务到 a-task-orders
				if (this.editingCust.status === 'deal' && this.editingCust.order_id) {
					const orderId = this.editingCust.order_id;

					// 1. 检查任务是否已存在，避免重复创建
					const taskCheck = await db.collection('a-task-orders').where({ order_id: orderId }).count();

					if (taskCheck.result.total === 0) {
						// 2. 不存在则创建新任务
						await db.collection('a-task-orders').add({
							order_id: orderId,
							account_name: '', // 暂时留空，等待后续分配
							crawl_status: 'pending', // 初始状态：待抓取
							snapshot_status: 'pending',
							ai_status: 'pending',
							created_at: Date.now(),
							updated_at: Date.now()
						});
						console.log('自动创建抓取任务成功');

						attendantNotifier
							.notifyAdminNewOrder({
								customerName: this.editingCust.name,
								orderId: orderId,
								salesName: this.getSalesName(this.editingCust.sales_id),
								remarks: this.editingCust.remarks || '无'
							})
							.then((res) => {
								console.log('管理员通知发送结果:', res);
							})
							.catch((err) => {
								console.error('管理员通知发送失败:', err);
							});
					}
				}

				this.$refs.editPopup.close();
				uni.showToast({ title: '保存成功' });
				this.refreshData();
			} catch (e) {
				uni.showToast({ title: '保存失败: ' + e.message, icon: 'none' });
			} finally {
				this.isSaving = false;
			}
		},
		deleteCustomer(id) {
			uni.showModal({
				title: '确认删除',
				content: '删除后无法恢复，是否继续？',
				success: async (res) => {
					if (res.confirm) {
						try {
							await db.collection('a-customers').doc(id).remove();
							uni.showToast({ title: '已删除' });
							this.refreshData();
						} catch (e) {
							uni.showToast({ title: '删除失败', icon: 'none' });
						}
					}
				}
			});
		},

		// 打开无效统计弹窗
		openInvalidPopup() {
			const today = new Date();
			const y = today.getFullYear();
			const m = (today.getMonth() + 1).toString().padStart(2, '0');
			const d = today.getDate().toString().padStart(2, '0');

			this.invalidForm.date = `${y}-${m}-${d}`; // 默认今天
			this.fetchInvalidCount(); // 获取当天已有的数据
			this.loadInvalidHistory(); // 加载历史
			this.$refs.invalidPopup.open();
		},

		// 获取选中日期的具体数据
		async fetchInvalidCount() {
			if (!this.invalidForm.date) return;
			try {
				const res = await db.collection('a-daily-stats').where({ date: this.invalidForm.date }).get();

				if (res.result.data.length > 0) {
					this.invalidForm.count = res.result.data[0].ineffective_count;
				} else {
					this.invalidForm.count = 0;
				}
			} catch (e) {
				console.error(e);
			}
		},

		// 保存统计数据
		async saveInvalidStats() {
			if (!this.invalidForm.date) return uni.showToast({ title: '请选择日期', icon: 'none' });

			this.isSavingStats = true;
			try {
				const collection = db.collection('a-daily-stats');
				const check = await collection.where({ date: this.invalidForm.date }).get();

				const payload = {
					date: this.invalidForm.date,
					ineffective_count: Number(this.invalidForm.count)
				};

				if (check.result.data.length > 0) {
					// 更新
					await collection.where({ date: this.invalidForm.date }).update({
						ineffective_count: payload.count
					});
				} else {
					// 新增
					await collection.add(payload);
				}

				uni.showToast({ title: '保存成功' });
				this.loadInvalidHistory(); // 刷新列表
			} catch (e) {
				uni.showToast({ title: '保存失败', icon: 'none' });
				console.error(e);
			} finally {
				this.isSavingStats = false;
			}
		},

		// 加载最近7天历史
		async loadInvalidHistory() {
			try {
				const res = await db.collection('a-daily-stats').orderBy('date', 'desc').limit(7).get();
				this.invalidHistory = res.result.data;
			} catch (e) {
				console.error(e);
			}
		},

		// 删除无效统计记录
		deleteInvalidStat(item) {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除 ${item.date} 的统计记录吗？`,
				success: async (res) => {
					if (res.confirm) {
						try {
							// 使用 _id 删除最准确
							await db.collection('a-daily-stats').doc(item._id).remove();

							uni.showToast({ title: '已删除' });

							// 逻辑优化：如果删除的是“当前正在编辑”的那个日期，把输入框重置为0
							if (item.date === this.invalidForm.date) {
								this.invalidForm.count = 0;
							}

							// 刷新历史列表
							this.loadInvalidHistory();
						} catch (e) {
							console.error(e);
							uni.showToast({ title: '删除失败', icon: 'none' });
						}
					}
				}
			});
		}
	}
};
</script>

<style lang="scss">
$page-bg: #f5f7fa;
$blue: #3b82f6;
$green: #10b981;
$yellow: #f5ee0e;
$orange: #f59e0b;
$cyan: #06b6d4;
$red: #f43f5e;
$purple: #b036f6;
$text-main: #1f2937;
$text-sub: #6b7280;

.text-ellipsis {
	white-space: nowrap; /* 强制不换行 */
	overflow: hidden; /* 超出隐藏 */
	text-overflow: ellipsis; /* 超出显示省略号 */
	display: inline-block; /* 必须是 block 或 inline-block 才能生效 */
	vertical-align: middle;
}

.page-container {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background-color: $page-bg;

	.main-content {
		flex: 1;
		padding: 20px;
		display: flex;
		flex-direction: column;
		overflow: hidden;

		.stats-row {
			display: flex;
			gap: 15px;
			margin-bottom: 15px;
			flex-shrink: 0;
			.stat-box {
				flex: 1;
				background: #fff;
				padding: 15px;
				border-radius: 8px;
				text-align: center;
				box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
				border-top: 3px solid transparent;
				&.blue {
					border-color: $blue;
				}
				&.green {
					border-color: $green;
				}
				&.orange {
					border-color: $orange;
				}
				&.cyan {
					border-color: $cyan;
				}
				.stat-val {
					font-size: 24px;
					font-weight: bold;
					color: $text-main;
					margin-bottom: 4px;
				}
				.stat-label {
					font-size: 12px;
					color: $text-sub;
				}
			}
		}

		.filter-bar {
			display: flex;
			align-items: center;
			background: #fff;
			padding: 10px 15px;
			border-radius: 8px;
			margin-bottom: 15px;
			gap: 10px;
			flex-shrink: 0;

			.search-input {
				flex: 1;
				background: #f3f4f6;
				border-radius: 4px;
				padding: 6px 10px;
				display: flex;
				align-items: center;
				input {
					margin-left: 8px;
					font-size: 13px;
					width: 100%;
				}
			}
			.filter-picker {
				.picker-inner {
					border: 1px solid #e5e7eb;
					border-radius: 4px;
					padding: 6px 10px;
					font-size: 13px;
					color: $text-main;
					background: #fff;
					display: flex;
					align-items: center;
					gap: 6px;
					min-width: 90px;
					justify-content: space-between;
				}
			}
			.link-btn {
				font-size: 13px;
				color: $blue;
				cursor: pointer;
				padding: 0 5px;
			}
			.uni-btn-primary {
				background-color: $blue;
				color: #fff;
				font-size: 13px;
				padding: 6px 16px;
				border-radius: 4px;
				border: none;
				display: flex;
				align-items: center;
				gap: 4px;
			}
			.ml-10 {
				margin-left: 10px;
			}
		}

		.customer-list {
			flex: 1;
			background: #fff;
			border-radius: 8px;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
			display: flex;
			flex-direction: column;
			overflow: hidden;

			.list-header {
				display: flex;
				padding: 12px 15px;
				background: #f9fafb;
				border-bottom: 1px solid #eee;
				font-size: 12px;
				font-weight: 600;
				color: $text-sub;
				.col-info {
					width: 180px;
				}
				.col-source {
					width: 90px;
				}
				.col-plan {
					width: 150px;
					padding-right: 10px;
				}
				.col-follow {
					width: 350px;
					padding-left: 20px;
				}
				.col-sales {
					width: 180px;
				}
				.col-status {
					width: 250px;
					text-align: center;
				}
				.col-opt {
					width: 50px;
					text-align: left;
				}
			}

			.list-body {
				flex: 1;
				overflow-y: auto;
				.loading-state-inner {
					padding: 40px 0;
				}
				.empty-state {
					padding: 40px;
					text-align: center;
					color: #ccc;
					font-size: 13px;
				}

				.list-row {
					display: flex;
					align-items: stretch; // 顶部对齐
					padding: 12px 15px;
					border-bottom: 1px solid #f3f4f6;
					font-size: 13px;
					color: $text-main;
					&:hover {
						background: #fcfcfc;
					}

					.col-info {
						width: 180px;
						padding-right: 5px;
						display: flex;
						flex-direction: column;
						justify-content: center;
						gap: 4px; // 两行之间的间距

						.ci-row-top {
							display: flex;
							align-items: center;
							.channel-badge {
								display: flex;
								align-items: center;
								justify-content: center;
								padding: 1px 6px;
								margin-right: 3px;
								border-radius: 4px;
								font-size: 10px;
								color: #fff;
								height: 18px;
								line-height: 18px;
								width: fit-content;

								/* 个人微信：微信绿 */
								&.ch-wx {
									background: #07c160;
								}
								/* 携程企微：携程蓝 */
								&.ch-ctrip {
									background: #2f80ed;
								}
								/* 风漫企微/其他企微：企业橙/深色 */
								&.ch-corp {
									background: #f59e0b;
								}
								/* 默认/未知 */
								&.ch-default {
									background: #d1d5db;
									color: #666;
								}
							}
							.name {
								font-weight: 600;
								font-size: 14px;
								color: $text-main;
							}
							.divider {
								margin: 0 6px;
								color: #e5e7eb;
								font-size: 10px;
							}
							.wx-id {
								font-size: 12px;
								color: #1f2937;
								font-weight: 500;
								max-width: 100px; // 限制微信名宽度
							}
						}

						.ci-row-bottom {
							display: flex;
							align-items: center;
							font-size: 12px;
							color: #9ca3af;
							.divider {
								margin: 0 6px;
								color: #e5e7eb;
								font-size: 10px;
							}
							.mobile {
								font-family: Arial, sans-serif;
							}
						}
					}
					.col-source {
						width: 90px;
						display: flex;
						flex-direction: column;
						justify-content: center;
						.source-tag {
							display: inline-block;
							width: fit-content;
							font-size: 10px;
							padding: 2px 8px;
							border-radius: 4px;
							color: #fff;
							&.bg-cyan {
								background: #06b6d4;
							}
							&.bg-red {
								background: #f43f5e;
							}
							&.bg-orange {
								background: #f59e0b;
							}
							&.bg-dark {
								background: #333;
							}
							&.bg-gray {
								background: #9ca3af;
							}
							&.bg-blue {
								background: $blue;
							}
							&.bg-yellow {
								background: $yellow;
								color: #333;
							}
							&.bg-purple {
								background: $purple;
							}
							&.bg-green {
								background: $green;
							}
						}
					}
					.col-plan {
						width: 150px;
						display: flex;
						flex-direction: column;
						justify-content: center;
						margin-right: 20px;

						.text-gray {
							color: #eee;
							font-size: 12px;
							margin-left: 10px;
						}

						.plan-card {
							background: #f0f9ff; // 浅蓝背景
							border: 1px solid #bae6fd;
							border-radius: 6px;
							padding: 6px 8px;
							width: 100%;
							box-sizing: border-box;

							.pc-row {
								display: flex;
								align-items: center;
								line-height: 1.4;

								&.primary {
									color: #0369a1;
									font-weight: 600;
									font-size: 13px;
									margin-bottom: 2px;
									display: flex;
									align-items: center;
									overflow: hidden;
									.pc-dest {
										margin-left: 4px;
										flex: 1; // 占据剩余空间
										white-space: nowrap; // 不换行
										overflow: hidden; // 超出隐藏
										text-overflow: ellipsis; // 显示省略号
										min-width: 0;
									}
								}

								&.secondary {
									color: #0284c7;
									font-size: 11px;
								}

								&.meta {
									color: #64748b;
									font-size: 11px;
									margin-top: 2px;
									.divider {
										margin: 0 4px;
										color: #cbd5e1;
									}
								}
							}
						}
					}
					.col-follow {
						width: 350px;
						padding-right: 10px;
						display: flex;
						flex-direction: column;
						justify-content: center;
						.follow-text {
							font-size: 12px;
							color: #4b5563;
							display: -webkit-box;
							-webkit-box-orient: vertical;
							-webkit-line-clamp: 2;
							overflow: hidden;
						}
						.text-gray {
							color: #ccc;
						}
					}
					.col-sales {
						width: 180px;
						display: flex;
						flex-direction: column;
						justify-content: center;
						gap: 3px;

						.sales-row-top {
							display: flex;
							align-items: center;
							gap: 6px;
							.sales-name {
								font-size: 13px;
							}
							.sales-score-mini {
								display: flex;
								align-items: center;
								gap: 1px;
								font-size: 11px;
								color: #b45309;
								background: #fffbeb;
								padding: 0 3px;
								border-radius: 2px;
								border: 1px solid #fcd34d;
								height: 16px;
								line-height: 14px;
							}
						}

						.qywx-tag {
							font-size: 10px;
							color: #d1d5db;
							width: fit-content;
							&.active {
								color: $green;
							}
						}
					}
					.col-status {
						width: 250px;
						padding: 0 10px;
						display: flex;
						flex-direction: column;
						justify-content: center;
						gap: 5px; // 上下行间距

						.status-row-top {
							display: flex;
							align-items: center;
							justify-content: center; // 居中对齐
							gap: 8px;

							.status-badge {
								font-size: 11px;
								padding: 1px 6px;
								border-radius: 10px;
								height: 18px;
								line-height: 18px;
								// 保持原有颜色逻辑
								&.st-new {
									background: #e5e7eb;
									color: $text-sub;
								}
								&.st-following {
									background: #eff6ff;
									color: $blue;
								}
								&.st-deal {
									background: #ecfdf5;
									color: $green;
									font-weight: 500;
								}
								&.st-waiting_group {
									background: #f3e8ff;
									color: #9333ea;
								}
								&.st-lost {
									background: #fff1f2;
									color: $text-sub;
									text-decoration: line-through;
								}
							}

							.order-link {
								font-size: 11px;
								color: $blue;
								text-decoration: underline;
								cursor: pointer;
								background: #eff6ff;
								padding: 0 4px;
								border-radius: 2px;
							}
						}

						.status-row-bottom {
							display: flex;
							align-items: center;
							justify-content: center; // 居中对齐
							gap: 8px;
							height: 18px; // 占位高度，防止没有内容时塌陷太厉害

							.final-amount {
								font-size: 13px;
								font-weight: bold;
								color: #ef4444;
								font-family: DIN, Arial, sans-serif;
							}

							.review-badge {
								font-size: 10px;
								&.text-red {
									color: $red;
								}
								&.text-green {
									color: $green;
								}
								&.text-blue {
									color: $blue;
								}

								&.compact {
									transform: scale(0.9); //稍微缩小一点以适应布局
									transform-origin: left center;
								}
							}

							.text-gray-small {
								font-size: 10px;
								color: #e5e7eb;
							}
						}
					}
					.col-opt {
						width: 50px;
						text-align: left;
						display: flex;
						justify-content: flex-start;
						align-items: center;
						gap: 10px;
						.icon-btn {
							cursor: pointer;
							opacity: 0.8;
							&:hover {
								opacity: 1;
							}
						}
					}
				}
			}
		}
	}

	.edit-card {
		width: 550px; // 加宽以容纳双列
		max-width: 90vw;
		background: #fff;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		max-height: 85vh;

		.card-header {
			padding: 15px 20px;
			border-bottom: 1px solid #eee;
			display: flex;
			justify-content: space-between;
			align-items: center;
			.card-title {
				font-size: 16px;
				font-weight: bold;
			}
		}

		.edit-body {
			flex: 1;
			overflow-y: auto;
			padding: 20px;

			.form-section-title {
				font-size: 12px;
				color: $blue;
				font-weight: 600;
				margin-bottom: 10px;
				margin-top: 5px;
				padding-left: 8px;
				border-left: 3px solid $blue;
				&:first-child {
					margin-top: 0;
				}
			}

			.form-row {
				display: flex;
				align-items: center;
				gap: 15px;
				.half {
					flex: 1;
				}
			}

			.form-item {
				margin-bottom: 15px;
				.label {
					font-size: 13px;
					color: $text-sub;
					margin-bottom: 6px;
					display: block;
					&.required::after {
						content: '*';
						color: $red;
						margin-left: 2px;
					}
				}
				.input,
				.picker {
					width: 100%;
					border: 1px solid #e5e7eb;
					border-radius: 6px;
					padding: 0 10px;
					font-size: 14px;
					height: 36px;
					line-height: 36px;
					box-sizing: border-box;
					.picker-text {
						color: $text-main;
						overflow: hidden;
						white-space: nowrap;
						text-overflow: ellipsis;
					}
				}
				.textarea {
					width: 100%;
					border: 1px solid #e5e7eb;
					border-radius: 6px;
					padding: 8px 10px;
					font-size: 14px;
					height: 80px;
					box-sizing: border-box;
					&.small {
						height: 120px;
						min-height: 80px;
					}
				}
			}
		}

		.btn-row {
			padding: 15px 20px;
			border-top: 1px solid #eee;
			display: flex;
			gap: 15px;
			.btn {
				flex: 1;
				font-size: 14px;
				border-radius: 6px;
				border: none;
				padding: 8px 0;
				&.cancel {
					background: #f3f4f6;
					color: $text-main;
				}
				&.submit {
					background: $blue;
					color: #fff;
				}
			}
		}
	}

	.follow-scroll-box {
		max-height: 40px;
		width: 100%;

		.history-row {
			display: flex;
			align-items: flex-start; /* 顶部对齐 */
			margin-bottom: 4px; /* 行间距 */
			line-height: 1.4;

			&:last-child {
				margin-bottom: 0;
			}

			.date-tag {
				font-size: 10px;
				color: #999;
				background: #f3f4f6;
				padding: 0 4px;
				border-radius: 2px;
				margin-right: 6px;
				white-space: nowrap;
				height: 16px;
				line-height: 16px;
				margin-top: 1px; /* 微调对齐 */
			}

			.content-text {
				font-size: 12px;
				color: #374151;
				flex: 1;
				/* 如果单条内容很长，允许折行 */
				word-break: break-all;
			}
		}
	}

	/* 弹窗内的历史记录样式 */
	.history-review-box-editable {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 10px;
		min-height: 60px;

		.empty-tip {
			text-align: center;
			font-size: 12px;
			color: #9ca3af;
			padding: 15px 0;
		}

		.review-row-editable {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 8px;
			border-bottom: 1px dashed #e5e7eb;
			padding-bottom: 8px;
			background: #fff; /* 增加背景色突出行 */
			padding: 8px;
			border-radius: 4px;

			&:last-child {
				margin-bottom: 0;
				// border-bottom: none;
			}

			.row-left {
				width: 145px; // 给日期选择器足够宽度
			}

			.row-middle {
				flex: 1;
				.mini-input {
					font-size: 13px;
					width: 100%;
					border: none; // 移除边框，看起来更像纯文本编辑
					background: transparent;
					height: 24px;
					line-height: 24px;
				}
			}

			.row-right {
				width: 24px;
				display: flex;
				justify-content: center;
				cursor: pointer;
			}

			// 调整日期选择器样式
			:deep(.uni-date-x--border) {
				border: none !important;
				padding: 0 !important;
			}
			:deep(.uni-date__x-input) {
				font-size: 11px !important;
				height: 24px !important;
				line-height: 24px !important;
				color: #6b7280;
			}
			:deep(.uni-date__icon-clear) {
				display: none; // 隐藏清除按钮，保持紧凑
			}
		}
	}

	.mt-1 {
		margin-top: 4px;
		display: block;
	}

	.schedule-tip {
		font-size: 11px;
		color: #f59e0b;
		margin-top: 4px;
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.text-gray-small {
		font-size: 12px;
		color: #999;
		font-weight: normal;
	}
	.text-gray {
		color: #ccc;
	}
	.review-row-editable {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
		border-bottom: 1px dashed #eee;
		padding-bottom: 8px;

		.r-time-edit {
			width: 140px;
		}
		.r-content-edit {
			flex: 1;
			.mini-input {
				font-size: 13px;
				width: 100%;
				border: 1px solid #eee;
				border-radius: 4px;
				padding: 4px;
			}
		}
		// 覆盖 uni-datetime-picker 内部一些样式让它变小
		:deep(.uni-date-x--border) {
			border: none !important;
			padding: 0 !important;
		}
		:deep(.uni-date__x-input) {
			font-size: 11px !important;
			height: 24px !important;
			line-height: 24px !important;
		}
	}

	.timeline-container {
		margin-top: 10px;
		padding: 10px;
		background: #f9fafb;
		border-radius: 6px;
		border: 1px solid #e5e7eb;

		.timeline-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 8px;
			font-size: 11px;
			color: #6b7280;

			.legend {
				display: flex;
				gap: 8px;
				.legend-item {
					display: flex;
					align-items: center;
					gap: 3px;
					.dot {
						width: 8px;
						height: 8px;
						border-radius: 2px;
						&.red {
							background: #f87171;
						}
						&.gray {
							background: #e5e7eb;
						}
						&.blue-border {
							border: 1px solid #3b82f6;
							background: transparent;
						}
					}
				}
			}
		}

		.timeline-blocks {
			display: flex;
			justify-content: space-between;
			gap: 2px;

			.time-block {
				flex: 1;
				height: 24px;
				background: #e5e7eb; // 默认空闲灰色
				border-radius: 3px;
				display: flex;
				align-items: center;
				justify-content: center;
				position: relative;
				cursor: pointer;

				.tiny-date {
					font-size: 9px;
					color: #6b7280;
					transform: scale(0.8);
				}

				&.busy {
					background: #f87171; // 忙碌红色
					.tiny-date {
						color: #fff;
					}
				}

				&.target {
					border: 2px solid #3b82f6; // 目标日蓝色边框
					background: #eff6ff;
					z-index: 1;
					transform: scale(1.1);
					&.busy {
						background: #f87171; // 如果目标日也忙，背景保持红，边框蓝
					}
				}
			}
		}
	}

	// 针对 custom-picker 的宽度覆写类
	.wide-picker {
		flex: 1;
		width: 100%;

		// 使用 ::v-deep 穿透修改组件内部样式
		::v-deep .picker-trigger {
			max-width: none !important; // 取消最大宽度限制
			width: 100% !important; // 占满父容器
		}

		// 让下拉菜单也跟随变宽
		::v-deep .custom-dropdown-options {
			width: 100% !important;
			right: auto; // 取消强制靠右，让其自然撑开
			left: 0;
		}
	}

	// 模拟禁用的输入框样式 (用于未选择日期时)
	.fake-input-disabled {
		background: #f3f4f6;
		border: 1px solid #e5e7eb;
		color: #9ca3af;
		padding: 6px 10px;
		border-radius: 6px;
		font-size: 13px;
		height: 36px;
		line-height: 24px; // 配合padding
		box-sizing: border-box;
		display: flex;
		align-items: center;
	}

	.flex-row-between {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.butler-row {
		display: flex;
		align-items: center;
		gap: 2px;
		font-size: 12px;
		color: #4b5563;
		margin-top: 4px;
	}

	.mb-2 {
		margin-bottom: 8px;
	}

	.mb-0 {
		margin-bottom: 0 !important;
	}

	.text-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
		color: #3b82f6;
		cursor: pointer;
		padding: 4px 8px;
		background: #eff6ff;
		border-radius: 4px;
		&:active {
			opacity: 0.7;
		}
	}

	.date-picker-custom {
		width: 100%;
		/* 利用深度选择器修改组件内部样式，完美匹配你的 input 风格 */
		::v-deep .uni-date-x {
			height: 36px;
			line-height: 36px;
			border: 1px solid #e5e7eb;
			border-radius: 6px;
			padding: 0 10px;
			box-sizing: border-box;
		}

		/* 修复图标位置 */
		::v-deep .uni-date__icon-clear {
			top: 5px;
		}

		/* 如果有订单绑定时的特殊颜色处理 */
		&[style*='eff6ff'] {
			::v-deep .uni-date-x {
				border-color: #3b82f6;
				background-color: #eff6ff;
			}
		}
	}

	.disabled-picker {
		background-color: #f3f4f6; /* 浅灰色背景 */
		pointer-events: none; /* 禁止鼠标事件 */

		.picker-text {
			color: #9ca3af; /* 灰色文字 */
		}
	}

	/* 无效统计弹窗样式 */
	.stats-input-box {
		background: #f9fafb;
		padding: 15px;
		border-radius: 8px;
		margin-bottom: 10px;
	}

	.counter-box {
		display: flex;
		align-items: center;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		overflow: hidden;
		background: #fff;
		height: 36px;

		.count-btn {
			width: 40px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: #f3f4f6;
			font-size: 18px;
			color: #666;
			cursor: pointer;
			height: 100%;
			&:active {
				background: #e5e7eb;
			}
			&.plus {
				color: #3b82f6;
			}
		}

		.count-input {
			flex: 1;
			text-align: center;
			font-size: 16px;
			font-weight: bold;
			color: #333;
			height: 100%;
		}
	}

	.stats-history-list {
		border-top: 1px solid #eee;

		.history-item {
			display: flex;
			justify-content: space-between;
			align-items: center; // 垂直居中
			padding: 10px 0;
			border-bottom: 1px dashed #f3f4f6;
			font-size: 13px;
			color: #4b5563;

			.h-right-box {
				display: flex;
				align-items: center;
				gap: 12px; // 数值和删除图标的间距
			}

			.h-val {
				font-weight: 600;
				color: #f59e0b;
			}

			.del-btn {
				cursor: pointer;
				padding: 4px; // 增加点击区域
				display: flex; // 修复图标对齐
				align-items: center;
				opacity: 0.6;
				&:hover {
					opacity: 1;
				}
			}
		}
	}
}
</style>
