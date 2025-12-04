<template>
	<view>
		<view class="bg-white shadow-sm mx-6 rounded-lg border border-gray-200">
			<view class="p-4">
				<view class="flex flex-wrap items-center justify-between gap-4">
					<view class="flex items-center space-x-3 flex-1 min-w-0">
						<view class="flex-1 max-w-md">
							<uni-easyinput
								v-model="query"
								placeholder="搜索订单号、用户ID或联系人信息"
								prefixIcon="search"
								:clearable="true"
								@confirm="search"
								@clear="clearSearch"
								:styles="{
									color: '#333',
									backgroundColor: '#fff',
									borderColor: '#d1d5db',
									borderRadius: '8px',
									fontSize: '16px',
									height: '42px'
								}"
								:focus-style="{
									borderColor: '#10b981'
								}" />
						</view>

						<view class="flex items-center space-x-2">
							<text class="text-sm text-gray-600 whitespace-nowrap">状态筛选:</text>
							<select
								v-model="statusFilter"
								@change="onStatusFilterChange"
								class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white">
								<option value="">全部状态</option>
								<option value="pending">待支付</option>
								<option value="paid">已支付</option>
								<option value="confirmed">已确认</option>
								<option value="processing">处理中</option>
								<option value="completed">已完成</option>
								<option value="cancelled">已取消</option>
								<option value="refunded">已退款</option>
							</select>
						</view>

						<button
							class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base"
							@click="search">
							<i class="fas fa-search mr-2"></i>
							搜索
						</button>
					</view>

					<view class="flex items-center space-x-3">
						<!-- <button
							class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base"
							@click="navigateTo('./add')">
							<i class="fas fa-plus mr-2"></i>
							新增订单
						</button> -->

						<button
							class="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base disabled:opacity-50 disabled:cursor-not-allowed"
							:disabled="!selectedIndexs.length"
							@click="delTable">
							<i class="fas fa-trash-alt mr-2"></i>
							批量删除 {{ selectedIndexs.length > 0 ? `(${selectedIndexs.length})` : '' }}
						</button>

						<download-excel :fields="exportExcel.fields" :data="exportExcelData" :type="exportExcel.type" :name="exportExcel.filename">
							<button class="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base">
								<i class="fas fa-file-excel mr-2"></i>
								导出Excel
							</button>
						</download-excel>
					</view>
				</view>
			</view>
		</view>

		<view class="mx-6 my-6">
			<unicloud-db
				ref="udb"
				:collection="collectionList"
				field="_id,order_no,user_id{mobile},product_snapshot,status,quantity,final_amount,contact_info,departure_date,duration_days,created_at,travel_users,staves"
				:where="where"
				page-data="replace"
				:orderby="orderby"
				:getcount="true"
				:page-size="options.pageSize"
				:page-current="options.pageCurrent"
				v-slot:default="{ data, pagination, loading, error, options }"
				:options="options"
				loadtime="manual"
				@load="onqueryload">
				<view class="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
					<view class="p-4 border-b border-gray-200">
						<view class="flex items-center justify-between">
							<view class="flex items-center">
								<i class="fas fa-chart-line text-emerald-600 text-lg mr-3"></i>
								<text class="text-lg font-semibold text-gray-900">小程序订单列表</text>
							</view>
							<view class="text-sm text-gray-500">
								共找到
								<text class="font-semibold text-emerald-600 text-base">{{ pagination.count }}</text>
								个订单
							</view>
						</view>
					</view>

					<view class="overflow-hidden">
						<view class="overflow-x-auto">
							<table class="w-full">
								<thead class="bg-gray-50 border-b border-gray-200">
									<tr>
										<th class="w-12 p-4 text-left">
											<checkbox class="transform scale-90" :checked="selectedIndexs.length === data.length && data.length > 0" @click="toggleSelectAll" />
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-40">
											订单号
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'order_no')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-32">
											下单用户
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'user_id')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-45">出行用户</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-40">服务人员</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-60">商品信息</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-28">
											支付金额
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'final_amount')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-30">联系人信息</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-20">
											出发日期
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'departure_date')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-24">天数</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-28">订单状态</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-20">
											创建时间
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'created_at')"></i>
										</th>
										<th class="px-4 py-4 text-center text-sm font-semibold text-gray-900 w-40">操作</th>
									</tr>
								</thead>

								<tbody class="bg-white divide-y divide-gray-200">
									<tr v-if="loading">
										<td colspan="13" class="p-8 text-center">
											<view class="flex items-center justify-center">
												<i class="fas fa-spinner fa-spin text-emerald-600 text-xl mr-3"></i>
												<text class="text-gray-600 text-base">正在加载订单数据...</text>
											</view>
										</td>
									</tr>

									<tr v-else-if="!data.length">
										<td colspan="13" class="p-12 text-center">
											<view class="flex flex-col items-center">
												<i class="fas fa-shopping-cart text-gray-400 text-4xl mb-4"></i>
												<text class="text-gray-500 text-lg">{{ error.message || '暂无订单数据' }}</text>
												<text class="text-gray-400 text-sm mt-2">您可以点击"新增订单"添加订单信息</text>
											</view>
										</td>
									</tr>

									<tr
										v-else
										v-for="(item, index) in data"
										:key="index"
										class="hover:bg-gray-50 transition-colors duration-150"
										:class="selectedIndexs.includes(index) ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''">
										<td class="p-4">
											<checkbox class="transform scale-90" :checked="selectedIndexs.includes(index)" @click="toggleSelectItem(index)" />
										</td>

										<td class="px-4 py-4 w-32">
											<view class="flex items-center">
												<text
													class="text-sm font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded cursor-pointer hover:bg-emerald-100 transition-colors break-all"
													@click="copyToClipboard(item.order_no)">
													{{ item.order_no || '-' }}
												</text>
												<i class="fas fa-copy text-gray-400 ml-2 cursor-pointer hover:text-emerald-600 transition-colors" @click="copyToClipboard(item.order_no)"></i>
											</view>
										</td>

										<td class="px-4 py-4">
											<view class="flex items-center">
												<i class="fas fa-user text-gray-400 mr-2"></i>
												<text class="text-sm text-gray-900 font-mono cursor-pointer hover:text-blue-600 transition-colors" @click="copyToClipboard(item.user_id[0].mobile)">
													{{ item.user_id && item.user_id[0] ? item.user_id[0].mobile : '号码未留' }}
												</text>
											</view>
										</td>

										<td class="px-4 py-4">
											<view class="flex flex-col space-y-1" v-if="item.travel_users && item.travel_users.length">
												<view v-for="user in item.travel_users" :key="user.id" class="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
													<i class="fas fa-user-tag mr-1 text-emerald-600"></i>
													{{ user.mobile || '号码缺失' }}
												</view>
											</view>
											<text v-else class="text-xs text-gray-400">未指定</text>
										</td>

										<td class="px-4 py-4">
											<view class="flex flex-col space-y-1" v-if="item.staves && item.staves.length">
												<view v-for="staff in item.staves" :key="staff.id" class="text-xs text-gray-700 bg-yellow-100 px-2 py-0.5 rounded">
													<i class="fas fa-user-shield mr-1 text-yellow-700"></i>
													<text v-if="formatRoleText(staff.role)" class="font-semibold mr-1">[{{ formatRoleText(staff.role) }}]</text>
													{{ staff.mobile || '号码缺失' }}
												</view>
											</view>
											<text v-else class="text-xs text-gray-400">未分配</text>
										</td>

										<td class="px-4 py-4">
											<view class="max-w-xs">
												<text class="text-sm font-medium text-gray-900 line-clamp-3 leading-5">
													{{ getProductTitle(item.product_snapshot) }}
												</text>
												<text class="text-xs text-gray-500 mt-1 line-clamp-3" v-if="getProductSubtitle(item.product_snapshot)">
													{{ getProductSubtitle(item.product_snapshot) }}
												</text>
											</view>
										</td>

										<td class="px-4 py-4">
											<text class="text-sm font-bold text-red-600">
												{{ item.final_amount ? '¥' + item.final_amount : '-' }}
											</text>
										</td>

										<td class="px-4 py-4">
											<view class="text-xs text-gray-600">
												<text class="block font-medium">{{ getContactName(item.contact_info) }}</text>
												<text class="block text-gray-500">{{ getContactPhone(item.contact_info) }}</text>
											</view>
										</td>

										<td class="px-4 py-4">
											<view class="text-xs text-gray-500">
												<uni-dateformat :threshold="[0, 0]" :date="item.departure_date" format="MM-dd"></uni-dateformat>
											</view>
										</td>

										<td class="px-4 py-4">
											<view class="flex items-center">
												<i class="fas fa-calendar-alt text-orange-400 mr-1"></i>
												<text class="text-sm text-orange-600 font-medium">{{ item.duration_days || 0 }}天</text>
											</view>
										</td>

										<td class="px-4 py-4">
											<view class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="getStatusClass(item.status)">
												<i :class="getStatusIcon(item.status)" class="mr-1"></i>
												{{ getStatusText(item.status) }}
											</view>
										</td>

										<td class="px-4 py-4">
											<view class="text-xs text-gray-500">
												<uni-dateformat :threshold="[0, 0]" :date="item.created_at" format="MM-dd hh:mm"></uni-dateformat>
											</view>
										</td>

										<td class="px-4 py-4">
											<view class="flex items-center justify-center">
												<button
													@click="handleShowQr(item)"
													class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors duration-200 flex items-center">
													<i class="fas fa-qrcode mr-1"></i>
													邀请
												</button>
												<button
													@click="openEditDialog(item)"
													class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors duration-200 flex items-center">
													<i class="fas fa-edit mr-1"></i>
													编辑
												</button>
												<button
													@click="confirmDelete(item._id)"
													class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors duration-200 flex items-center">
													<i class="fas fa-trash mr-1"></i>
													删除
												</button>
											</view>
										</td>
									</tr>
								</tbody>
							</table>
						</view>
					</view>
				</view>

				<view class="bg-white rounded-lg shadow-sm border border-gray-200 p-4" v-if="pagination.count > 0">
					<view class="flex items-center justify-between">
						<view class="text-sm text-gray-700">
							显示第
							<text class="font-medium">{{ (pagination.current - 1) * pagination.size + 1 }}</text>
							到
							<text class="font-medium">{{ Math.min(pagination.current * pagination.size, pagination.count) }}</text>
							条， 共
							<text class="font-medium">{{ pagination.count }}</text>
							条记录
						</view>
						<uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current" :total="pagination.count" @change="onPageChanged" />
					</view>
				</view>
			</unicloud-db>
		</view>

		<uni-popup ref="editPopup" type="center" :mask-click="false" @change="onPopupStateChange">
			<view class="bg-white rounded-lg shadow-lg border border-gray-200" style="width: 90vw; max-width: 600px">
				<view class="p-4 border-b border-gray-200">
					<view class="flex items-center justify-between">
						<view class="flex items-center">
							<i class="fas fa-edit text-emerald-600 text-xl mr-3"></i>
							<text class="text-xl font-bold text-gray-900">编辑订单</text>
						</view>
						<view class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer" @click="closeEditDialog">
							<i class="fas fa-times text-gray-500"></i>
						</view>
					</view>
				</view>

				<scroll-view scroll-y style="max-height: 70vh">
					<view class="p-6">
						<uni-forms v-if="currentEditId" ref="editForm" :modelValue="formData" :rules="formRules" validate-trigger="bind" label-width="100" label-align="right">
							<uni-forms-item name="order_no" label="订单号">
								<uni-easyinput v-model="formData.order_no" disabled />
							</uni-forms-item>

							<uni-forms-item name="user_id" label="用户ID">
								<uni-easyinput v-model="formData.user_id" disabled />
							</uni-forms-item>

							<uni-forms-item name="travel_users" label="出行用户">
								<view class="w-full">
									<view v-if="!formData.travel_users || formData.travel_users.length === 0" class="text-sm text-gray-400 mb-2">暂无出行用户</view>
									<view v-else class="w-full space-y-2 mb-3">
										<view v-for="(user, index) in formData.travel_users" :key="user.id" class="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-lg">
											<view class="flex items-center">
												<i class="fas fa-user text-emerald-600 mr-2"></i>
												<text class="text-sm text-gray-800">{{ user.mobile || '号码缺失' }}</text>
											</view>
											<button
												@click="removeTraveler(index)"
												class="px-2 py-0 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors"
												style="line-height: 1.5rem; margin: 0">
												移除
											</button>
										</view>
									</view>
									<uni-combox
										v-model="travelerSearchInput"
										:candidates="travelerCandidates"
										label-key="mobile"
										value-key="_id"
										placeholder="输入手机号搜索并添加"
										:clearOnSelect="true"
										@input="searchTravelers"
										@change="onTravelerSelect"
										@click="loadDefaultTravelers" />
								</view>
							</uni-forms-item>

							<uni-forms-item name="staves" label="服务人员">
								<view class="w-full">
									<view v-if="!formData.staves || formData.staves.length === 0" class="text-sm text-gray-400 mb-2">暂无服务人员</view>

									<view v-else class="w-full space-y-2 mb-3">
										<view v-for="(staff, index) in formData.staves" :key="staff.id" class="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-lg">
											<view class="flex items-center">
												<i class="fas fa-user-shield text-yellow-700 mr-2"></i>
												<text v-if="formatRoleText(staff.role)" class="font-semibold mr-1">[{{ formatRoleText(staff.role) }}]</text>
												<text class="text-sm text-gray-800">{{ staff.mobile || '号码缺失' }}</text>
											</view>
											<button
												@click="removeStaff(index)"
												class="px-2 py-0 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors"
												style="line-height: 1.5rem; margin: 0">
												移除
											</button>
										</view>
									</view>

									<uni-combox
										v-model="staffSearchInput"
										:candidates="staffCandidates"
										label-key="displayText"
										value-key="_id"
										placeholder="搜索向导/管家(手机号/昵称)"
										:clearOnSelect="true"
										@input="searchStaff"
										@change="onStaffSelect"
										@click="loadDefaultStaff" />
								</view>
							</uni-forms-item>

							<uni-forms-item name="departure_date" label="出发日期">
								<uni-datetime-picker type="timestamp" return-type="timestamp" v-model="formData.departure_date" />
							</uni-forms-item>

							<uni-forms-item name="duration_days" label="天数">
								<uni-number-box v-model="formData.duration_days" :min="0" />
							</uni-forms-item>
						</uni-forms>
					</view>
				</scroll-view>

				<view class="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
					<view class="flex justify-end space-x-4">
						<button @click="closeEditDialog" class="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors">取消</button>
						<button @click="submitEditForm" class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center">
							<i class="fas fa-check mr-2"></i>
							保存
						</button>
					</view>
				</view>
			</view>
		</uni-popup>

		<uni-popup ref="qrPopup" type="center" :mask-click="true">
			<view class="bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center justify-center w-80 relative">
				<view class="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-gray-600" @click="closeQrPopup">
					<i class="fas fa-times text-lg"></i>
				</view>

				<view class="text-2xl font-bold text-gray-800 mb-2">扫码加入行程</view>
				<view class="text-md text-gray-600 mb-6 text-center">
					行程同步电子讲解
					<br />
					获得旅行精彩相册
				</view>

				<view v-if="qrLoading" class="w-48 h-48 flex items-center justify-center bg-gray-50 rounded-lg mb-6">
					<i class="fas fa-spinner fa-spin text-emerald-500 text-2xl"></i>
				</view>

				<image v-else-if="qrCodeBase64" :src="qrCodeBase64" class="w-48 h-48 mb-6 rounded-lg shadow-sm border border-gray-100" mode="aspectFit"></image>

				<view v-else class="w-48 h-48 flex items-center justify-center bg-gray-50 rounded-lg mb-6 text-gray-400 text-sm">获取失败</view>

				<view class="flex w-full space-x-3">
					<button class="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors" @click="closeQrPopup">关闭</button>
					<a
						v-if="qrCodeBase64"
						:href="qrCodeBase64"
						:download="currentQrFileName"
						class="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center decoration-none">
						<i class="fas fa-download mr-1"></i>
						下载
					</a>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
import { enumConverter, filterToWhere } from '../../../js_sdk/validator/a-orders.js';

const db = uniCloud.database();
const cmd = db.command;
const dbOrderBy = 'created_at desc'; // 默认按创建时间倒序
const dbSearchFields = ['order_no', 'user_id', 'contact_info']; // 模糊搜索字段
const pageSize = 15;
const pageCurrent = 1;
const orderService = uniCloud.importObject('a-order-service');

const orderByMapping = {
	ascending: 'asc',
	descending: 'desc'
};

// FIX 4: 引入辅助函数
function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default {
	data() {
		return {
			collectionList: 'a-orders, uni-id-users',
			query: '',
			where: '',
			orderby: dbOrderBy,
			orderByFieldName: '',
			selectedIndexs: [],
			statusFilter: '',
			options: {
				pageSize,
				pageCurrent,
				filterData: {
					status_localdata: [
						{ value: 'pending', text: '待支付' },
						{ value: 'paid', text: '已支付' },
						{ value: 'confirmed', text: '已确认' },
						{ value: 'processing', text: '处理中' },
						{ value: 'completed', text: '已完成' },
						{ value: 'cancelled', text: '已取消' },
						{ value: 'refunded', text: '已退款' }
					],
					member_level_localdata: [
						{ value: 'normal', text: '普通会员' },
						{ value: 'silver', text: '银卡会员' },
						{ value: 'gold', text: '金卡会员' },
						{ value: 'diamond', text: '钻石会员' }
					]
				},
				...enumConverter
			},
			exportExcel: {
				filename: '订单数据导出.xls',
				type: 'xls',
				fields: {
					订单号: 'order_no',
					用户ID: 'user_id',
					订单状态: 'status',
					购买数量: 'quantity',
					最终支付金额: 'final_amount',
					联系人信息: 'contact_info',
					出发日期: 'departure_date',
					行程天数: 'duration_days',
					创建时间: 'created_at'
				}
			},
			exportExcelData: [],

			// ============================
			// FIX 4: 编辑弹窗的状态
			// ============================
			currentEditId: null,
			formData: {
				travel_users: [],
				staves: [],
				departure_date: null,
				total_days: 0
			},

			travelerSearchInput: '',
			travelerCandidates: [],
			searchTimer: null,

			staffSearchInput: '',
			staffCandidates: [],
			staffSearchTimer: null,

			dialogReady: false,
			formRules: {},

			qrCodeBase64: '',
			qrLoading: false,
			currentQrFileName: 'invite_code.png'
		};
	},
	mounted() {
		this.$refs.udb.loadData();
	},
	methods: {
		// 获取商品标题
		getProductTitle(snapshot) {
			if (!snapshot) return '商品信息缺失';
			if (typeof snapshot === 'string') {
				try {
					const parsed = JSON.parse(snapshot);
					return parsed.title || '未知商品';
				} catch {
					return snapshot;
				}
			}
			return snapshot.title || '未知商品';
		},

		// 获取商品副标题
		getProductSubtitle(snapshot) {
			if (!snapshot) return '';
			if (typeof snapshot === 'string') {
				try {
					const parsed = JSON.parse(snapshot);
					return parsed.subtitle || '';
				} catch {
					return '';
				}
			}
			return snapshot.subtitle || '';
		},

		// 获取联系人姓名
		getContactName(contactInfo) {
			if (!contactInfo) return '未设置';
			if (typeof contactInfo === 'string') {
				try {
					const parsed = JSON.parse(contactInfo);
					return parsed.name || '未知';
				} catch {
					return contactInfo;
				}
			}
			return contactInfo.name || '未知';
		},

		// 获取联系人电话
		getContactPhone(contactInfo) {
			if (!contactInfo) return '';
			if (typeof contactInfo === 'string') {
				try {
					const parsed = JSON.parse(contactInfo);
					return parsed.phone || '';
				} catch {
					return '';
				}
			}
			return contactInfo.phone || '';
		},

		// 获取状态样式类
		getStatusClass(status) {
			const statusMap = {
				pending: 'bg-yellow-100 text-yellow-800', // 待支付
				paid: 'bg-blue-100 text-blue-800', // 已支付
				confirmed: 'bg-green-100 text-green-800', // 已确认
				processing: 'bg-purple-100 text-purple-800', // 处理中
				completed: 'bg-emerald-100 text-emerald-800', // 已完成
				cancelled: 'bg-gray-100 text-gray-800', // 已取消
				refunded: 'bg-red-100 text-red-800' // 已退款
			};
			return statusMap[status] || 'bg-gray-100 text-gray-800';
		},

		// 获取状态图标
		getStatusIcon(status) {
			const iconMap = {
				pending: 'fas fa-clock', // 待支付
				paid: 'fas fa-credit-card', // 已支付
				confirmed: 'fas fa-check', // 已确认
				processing: 'fas fa-cog fa-spin', // 处理中
				completed: 'fas fa-check-circle', // 已完成
				cancelled: 'fas fa-times-circle', // 已取消
				refunded: 'fas fa-undo' // 已退款
			};
			return iconMap[status] || 'fas fa-question-circle';
		},

		// 获取状态文本
		getStatusText(status) {
			const textMap = {
				pending: '待支付',
				paid: '已支付',
				confirmed: '已确认',
				processing: '处理中',
				completed: '已完成',
				cancelled: '已取消',
				refunded: '已退款'
			};
			return textMap[status] || '未知状态';
		},

		// 状态筛选变化
		onStatusFilterChange() {
			let newWhere = this.getWhere();
			if (this.statusFilter) {
				const statusCondition = `status == "${this.statusFilter}"`;
				newWhere = newWhere ? `(${newWhere}) && ${statusCondition}` : statusCondition;
			}
			this.where = newWhere;
			this.selectedIndexs = [];
			this.$nextTick(() => {
				this.loadData();
			});
		},

		// 复制到剪贴板
		copyToClipboard(text) {
			if (!text) return;
			// #ifdef H5
			if (navigator.clipboard) {
				navigator.clipboard
					.writeText(text)
					.then(() => {
						uni.showToast({
							title: '已复制到剪贴板',
							icon: 'success'
						});
					})
					.catch(() => {
						this.fallbackCopyToClipboard(text);
					});
			} else {
				this.fallbackCopyToClipboard(text);
			}
			// #endif
			// #ifndef H5
			uni.setClipboardData({
				data: text,
				success: () => {
					uni.showToast({
						title: '已复制到剪贴板',
						icon: 'success'
					});
				}
			});
			// #endif
		},

		// 降级复制方法
		fallbackCopyToClipboard(text) {
			const textArea = document.createElement('textarea');
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand('copy');
				uni.showToast({
					title: '已复制到剪贴板',
					icon: 'success'
				});
			} catch (err) {
				uni.showToast({
					title: '复制失败',
					icon: 'none'
				});
			}
			document.body.removeChild(textArea);
		},

		// FIX 1: 修改 toggleSelectAll
		toggleSelectAll() {
			const allSelected = this.selectedIndexs.length === this.$refs.udb.dataList.length;
			if (allSelected) {
				this.selectedIndexs = [];
			} else {
				this.selectedIndexs = Array.from({ length: this.$refs.udb.dataList.length }, (_, i) => i);
			}
		},

		// 切换单个选择
		toggleSelectItem(index) {
			const currentIndex = this.selectedIndexs.indexOf(index);
			if (currentIndex > -1) {
				this.selectedIndexs.splice(currentIndex, 1);
			} else {
				this.selectedIndexs.push(index);
			}
		},

		onqueryload(data) {
			this.exportExcelData = data;
		},

		getWhere() {
			const query = this.query.trim();
			if (!query) {
				return '';
			}
			const conditions = dbSearchFields.map((field) => `/${query}/i.test(${field})`);
			return conditions.join(' || ');
		},

		search() {
			let newWhere = this.getWhere();
			if (this.statusFilter) {
				const statusCondition = `status == "${this.statusFilter}"`;
				newWhere = newWhere ? `(${newWhere}) && ${statusCondition}` : statusCondition;
			}
			this.where = newWhere;
			this.selectedIndexs = [];
			this.$nextTick(() => {
				this.loadData();
			});
		},

		clearSearch() {
			this.query = '';
			this.statusFilter = '';
			this.where = '';
			this.selectedIndexs = [];
			this.$nextTick(() => {
				this.loadData();
			});
		},

		loadData(clear = true) {
			this.$refs.udb.loadData({
				clear
			});
		},

		onPageChanged(e) {
			this.selectedIndexs = [];
			this.$refs.udb.loadData({
				current: e.current
			});
		},

		navigateTo(url, clear) {
			uni.navigateTo({
				url,
				events: {
					refreshData: () => {
						this.loadData(clear);
					}
				}
			});
		},

		selectedItems() {
			var dataList = this.$refs.udb.dataList;
			return this.selectedIndexs.map((i) => dataList[i]._id);
		},

		delTable() {
			if (!this.selectedIndexs.length) return;
			this.$refs.udb.remove(this.selectedItems(), {
				success: (res) => {
					this.selectedIndexs = [];
					uni.showToast({
						title: '删除成功',
						icon: 'success'
					});
				}
			});
		},

		confirmDelete(id) {
			this.$refs.udb.remove(id, {
				success: (res) => {
					this.selectedIndexs = [];
					uni.showToast({
						title: '删除成功',
						icon: 'success'
					});
				}
			});
		},

		sortChange(e, name) {
			this.orderByFieldName = name;
			if (e.order) {
				this.orderby = name + ' ' + orderByMapping[e.order];
			} else {
				this.orderby = dbOrderBy;
			}
			this.selectedIndexs = [];
			this.$nextTick(() => {
				this.$refs.udb.loadData();
			});
		},

		filterChange(e, name) {
			this._filter[name] = {
				type: e.filterType,
				value: e.filter
			};
			let newWhere = filterToWhere(this._filter, db.command);
			if (Object.keys(newWhere).length) {
				this.where = newWhere;
			} else {
				this.where = '';
			}
			this.selectedIndexs = [];
			this.$nextTick(() => {
				this.$refs.udb.loadData();
			});
		},

		// =============================================
		// 编辑弹窗相关方法
		// =============================================
		openEditDialog(item) {
			this.dialogReady = false;
			this.currentEditId = item._id;

			// 填充表单
			this.formData.order_no = item.order_no;

			if (Array.isArray(item.user_id) && item.user_id.length > 0) {
				this.formData.user_id = item.user_id[0].mobile || '未知号码';
			} else {
				this.formData.user_id = '用户数据缺失';
			}

			this.formData.departure_date = item.departure_date;
			this.formData.duration_days = item.duration_days || 0;

			// 深拷贝数组
			this.formData.travel_users = item.travel_users ? JSON.parse(JSON.stringify(item.travel_users)) : [];
			this.formData.staves = item.staves ? JSON.parse(JSON.stringify(item.staves)) : [];

			// 重置搜索框
			this.travelerSearchInput = '';
			this.travelerCandidates = [];
			if (this.searchTimer) clearTimeout(this.searchTimer);

			this.staffSearchInput = '';
			this.staffCandidates = [];
			if (this.staffSearchTimer) clearTimeout(this.staffSearchTimer);

			this.$refs.editPopup.open();
		},

		closeEditDialog() {
			this.$refs.editPopup.close();
			this.currentEditId = null;
			this.travelerSearchInput = '';
			this.travelerCandidates = [];
			if (this.searchTimer) clearTimeout(this.searchTimer);
			this.staffSearchInput = '';
			this.staffCandidates = [];
			if (this.staffSearchTimer) clearTimeout(this.staffSearchTimer);

			this.formData = {
				order_no: '',
				user_id: '',
				travel_users: [],
				staves: [],
				departure_date: null,
				duration_days: 0
			};
			if (this.$refs.editForm) {
				this.$refs.editForm.clearValidate();
			}
		},

		submitEditForm() {
			this.$refs.editForm
				.validate()
				.then((res) => {
					this.saveData(this.formData);
				})
				.catch((err) => {
					console.log('表单错误信息：', err);
					uni.showToast({
						title: '请检查表单信息',
						icon: 'none'
					});
				});
		},

		async saveData(value) {
			uni.showLoading({
				title: '正在保存...',
				mask: true
			});

			// 准备要保存的数据
			const dataToSave = {
				travel_users: value.travel_users,
				staves: value.staves,
				departure_date: value.departure_date,
				duration_days: value.duration_days
			};

			const orderId = value.order_no;
			const newMembers = value.travel_users || [];

			try {
				const updateOrderPromise = db.collection('a-orders').doc(this.currentEditId).update(dataToSave);

				const findAlbumPromise = db
					.collection('a-group-albums')
					.where({
						order_id: orderId
					})
					.field({ _id: true, members: true }) // 我们只需要 _id
					.get();

				const [orderRes, albumFindRes] = await Promise.all([updateOrderPromise, findAlbumPromise]);
				console.log('订单更新结果:', orderRes);
				console.log('相册查找结果:', albumFindRes);
				if (albumFindRes.result && albumFindRes.result.data && albumFindRes.result.data.length > 0) {
					const albumId = albumFindRes.result.data[0]._id;
					const members = albumFindRes.result.data[0].members || [];
					const memberMap = new Map();
					for (const member of members) {
						if (member && member.id) {
							memberMap.set(member.id, member);
						}
					}

					for (const member of newMembers) {
						if (member && member.id) {
							memberMap.set(member.id, member);
						}
					}

					const mergedMembers = Array.from(memberMap.values());
					console.log(`找到了匹配的相册: ${albumId}，正在追加成员...`);

					await db.collection('a-group-albums').doc(albumId).update({
						members: mergedMembers
					});

					uni.showToast({
						title: '修改成功',
						icon: 'success'
					});
				} else {
					console.warn(`未找到 order_id 为 ${orderId} 的相册，成员未添加。`);
					// 订单更新成功，且没有成员需要添加
					uni.showToast({
						title: '修改成功',
						icon: 'success'
					});
				}

				// 5. 成功后统一处理
				uni.hideLoading();
				this.closeEditDialog();
				this.loadData();
			} catch (err) {
				// 6. 任意一个失败，统一处理错误
				uni.hideLoading();
				uni.showModal({
					content: err.message || '请求服务失败',
					showCancel: false
				});
			}

			// db.collection('a-orders')
			// 	.doc(this.currentEditId)
			// 	.update(dataToSave)
			// 	.then((res) => {
			// 		uni.hideLoading();
			// 		uni.showToast({
			// 			title: '修改成功',
			// 			icon: 'success'
			// 		});
			// 		this.closeEditDialog();
			// 		this.loadData();
			// 	})
			// 	.catch((err) => {
			// 		uni.hideLoading();
			// 		uni.showModal({
			// 			content: err.message || '请求服务失败',
			// 			showCancel: false
			// 		});
			// 	});
		},

		onPopupStateChange(e) {
			if (e.show) {
				this.dialogReady = true;
			} else {
				this.dialogReady = false;
			}
		},

		async loadDefaultTravelers() {
			if (this.travelerSearchInput) {
				return;
			}
			if (this.searchTimer) {
				clearTimeout(this.searchTimer);
			}
			try {
				const res = await db.collection('uni-id-users').where('mobile != null').field('_id, mobile').limit(30).orderBy('register_date', 'desc').get();

				if (res.result.data) {
					this.travelerCandidates = res.result.data;
				}
			} catch (err) {
				console.error('loadDefaultTravelers error:', err);
			}
		},

		searchTravelers(query) {
			this.travelerSearchInput = query;

			if (this.searchTimer) {
				clearTimeout(this.searchTimer);
			}
			if (!query) {
				this.loadDefaultTravelers();
				return;
			}
			const escapedQuery = escapeRegExp(query);
			this.searchTimer = setTimeout(async () => {
				try {
					const res = await db
						.collection('uni-id-users')
						.where({
							mobile: new RegExp(escapedQuery, 'i')
						})
						.field('_id, mobile')
						.limit(30)
						.get();

					if (res.result.data) {
						this.travelerCandidates = res.result.data;
					}
				} catch (err) {
					console.error('searchTravelers error:', err);
				}
			}, 300);
		},

		onTravelerSelect(selectedUserId) {
			if (!selectedUserId || !this.dialogReady) return;

			const selectedUser = this.travelerCandidates.find((user) => user._id === selectedUserId);

			if (!selectedUser) {
				uni.showToast({ title: '未找到用户信息', icon: 'none' });
				this.resetCombox();
				return;
			}

			const isDuplicate = this.formData.travel_users.some((user) => user.id === selectedUserId);
			if (isDuplicate) {
				uni.showToast({ title: '用户已在列表中', icon: 'none' });
				this.resetCombox();
				return;
			}

			const newTravelersArray = [
				...this.formData.travel_users,
				{
					id: selectedUserId,
					mobile: selectedUser.mobile
				}
			];

			this.formData = {
				...this.formData,
				travel_users: newTravelersArray
			};

			this.resetCombox();
		},

		resetCombox() {
			this.$nextTick(() => {
				this.travelerSearchInput = '';
				this.travelerCandidates = [];
			});
		},

		removeTraveler(index) {
			const newTravelersArray = this.formData.travel_users.filter((user, i) => {
				return i !== index;
			});

			this.formData = {
				...this.formData,
				travel_users: newTravelersArray
			};
		},

		formatRoleText(roleField) {
			const roleMap = {
				guide: '向导',
				attendant: '管家'
			};

			if (Array.isArray(roleField)) {
				if (roleField.length === 0) return '';
				// 优先返回已知的角色
				for (const r of roleField) {
					if (roleMap[r]) return roleMap[r];
				}
				return ''; // 未找到匹配角色
			}
			if (typeof roleField === 'string') {
				return roleMap[roleField] || '';
			}
			return '';
		},

		formatStaffDisplay(user) {
			const roleText = this.formatRoleText(user.role) || '职员';
			const nickname = user.nickname || '未命名';
			const mobile = user.mobile || '无手机号';
			return `[${roleText}] ${nickname} - ${mobile}`;
		},

		/**
		 * 加载默认服务人员 (向导/管家)
		 */
		async loadDefaultStaff() {
			if (this.staffSearchInput) {
				return;
			}
			if (this.staffSearchTimer) {
				clearTimeout(this.staffSearchTimer);
			}

			try {
				// 筛选 role 包含 'guide' 或 'attendant' 的用户
				const roleQuery = db.command.or([
					{
						role: 'guide'
					},
					{
						role: 'attendant'
					}
				]);

				const res = await db.collection('uni-id-users').where(roleQuery).field('_id, mobile, nickname, role').limit(30).orderBy('register_date', 'desc').get();

				if (res.result.data) {
					// 格式化 displayText 供 combox 显示
					this.staffCandidates = res.result.data.map((user) => {
						user.displayText = this.formatStaffDisplay(user);
						return user;
					});
				}
			} catch (err) {
				console.error('loadDefaultStaff error:', err);
			}
		},

		/**
		 * 搜索服务人员 (带防抖)
		 */
		searchStaff(query) {
			this.staffSearchInput = query;

			if (this.staffSearchTimer) {
				clearTimeout(this.staffSearchTimer);
			}
			if (!query) {
				this.loadDefaultStaff(); // 清空时加载默认
				return;
			}

			const escapedQuery = escapeRegExp(query);

			this.staffSearchTimer = setTimeout(async () => {
				try {
					// 必须是 向导/管家
					const roleQuery = db.command.or([
						{
							role: 'guide'
						},
						{
							role: 'attendant'
						}
					]);

					// 手机号 或 昵称 模糊匹配
					const searchQuery = db.command.or([{ mobile: new RegExp(escapedQuery, 'i') }, { nickname: new RegExp(escapedQuery, 'i') }]);

					const res = await db
						.collection('uni-id-users')
						.where(db.command.and([roleQuery, searchQuery]))
						.field('_id, mobile, nickname, role')
						.limit(30)
						.get();

					if (res.result.data) {
						this.staffCandidates = res.result.data.map((user) => {
							user.displayText = this.formatStaffDisplay(user);
							return user;
						});
					}
				} catch (err) {
					console.error('searchStaff error:', err);
				}
			}, 300);
		},

		/**
		 * 当服务人员从建议列表中选择一项时
		 */
		onStaffSelect(selectedUserId) {
			if (!selectedUserId || !this.dialogReady) return;

			const selectedStaff = this.staffCandidates.find((user) => user._id === selectedUserId);

			if (!selectedStaff) {
				uni.showToast({ title: '未找到用户信息', icon: 'none' });
				this.resetStaffCombox();
				return;
			}

			const isDuplicate = this.formData.staves.some((user) => user.id === selectedUserId);
			if (isDuplicate) {
				uni.showToast({ title: '服务人员已在列表中', icon: 'none' });
				this.resetStaffCombox();
				return;
			}

			const newStaffArray = [
				...this.formData.staves,
				{
					id: selectedUserId,
					mobile: selectedStaff.mobile,
					role: selectedStaff.role
				}
			];
			this.formData = {
				...this.formData,
				staves: newStaffArray
			};

			this.resetStaffCombox();
		},

		/**
		 * 重置服务人员 combox 状态
		 */
		resetStaffCombox() {
			this.$nextTick(() => {
				this.staffSearchInput = '';
				this.staffCandidates = [];
			});
		},

		/**
		 * 移除服务人员
		 */
		removeStaff(index) {
			const newStaffArray = this.formData.staves.filter((user, i) => {
				return i !== index;
			});
			this.formData = {
				...this.formData,
				staves: newStaffArray
			};
		},

		// 显示二维码逻辑
		async handleShowQr(item) {
			this.qrCodeBase64 = '';
			this.qrLoading = true;
			this.currentQrFileName = `${item.order_no || 'invite_code'}.png`;
			this.$refs.qrPopup.open();

			try {
				const res = await orderService.getInviteQRCode(item.order_no);

				if (res.errCode === 0) {
					this.qrCodeBase64 = res.base64;
				} else {
					uni.showToast({ title: res.errMsg || '生成失败', icon: 'none' });
				}
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '网络请求失败', icon: 'none' });
			} finally {
				this.qrLoading = false;
			}
		},

		closeQrPopup() {
			this.$refs.qrPopup.close();
		}
	}
};
</script>

<style>
/* 确保 easyinput 和 select 样式在弹窗中正常 */
.uni-easyinput,
.uni-data-select,
.uni-combox {
	width: 100%;
}
.uni-forms-item {
	margin-bottom: 20px;
}
/* 修复 Checkbox 样式 */
.transform.scale-90 {
	transform: scale(0.9);
}
</style>
