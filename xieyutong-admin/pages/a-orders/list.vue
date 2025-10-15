<template>
	<view class="min-h-screen bg-gray-50" style="font-family: 'Microsoft YaHei', sans-serif">
		<!-- 页面标题栏 -->
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

		<!-- 快速统计卡片 -->
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

		<!-- 操作工具栏 -->
		<view class="bg-white shadow-sm mx-6 rounded-lg border border-gray-200">
			<view class="p-4">
				<view class="flex flex-wrap items-center justify-between gap-4">
					<!-- 搜索和筛选区域 -->
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

						<!-- 状态筛选 -->
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

					<!-- 操作按钮区域 -->
					<view class="flex items-center space-x-3">
						<button
							class="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base"
							@click="navigateToSync">
							<i class="fas fa-sync mr-2"></i>
							同步商品
						</button>

						<button
							class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base"
							@click="navigateTo('./add')">
							<i class="fas fa-plus mr-2"></i>
							新增订单
						</button>

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

		<!-- 主要内容区域 -->
		<view class="mx-6 my-6">
			<unicloud-db
				ref="udb"
				:collection="collectionList"
				field="_id,order_no,user_id,product_snapshot,status,quantity,final_amount,contact_info,departure_date,duration_days,created_at"
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
				<!-- 数据统计信息 -->
				<view class="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
					<view class="p-4 border-b border-gray-200">
						<view class="flex items-center justify-between">
							<view class="flex items-center">
								<i class="fas fa-chart-line text-emerald-600 text-lg mr-3"></i>
								<text class="text-lg font-semibold text-gray-900">订单列表</text>
							</view>
							<view class="text-sm text-gray-500">
								共找到
								<text class="font-semibold text-emerald-600 text-base">{{ pagination.count }}</text>
								个订单
							</view>
						</view>
					</view>

					<!-- 表格容器 -->
					<view class="overflow-hidden">
						<view class="overflow-x-auto">
							<table class="w-full" style="min-width: 1400px">
								<!-- 表头 -->
								<thead class="bg-gray-50 border-b border-gray-200">
									<tr>
										<th class="w-12 p-4 text-left">
											<input
												type="checkbox"
												class="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
												:checked="selectedIndexs.length === data.length && data.length > 0"
												@change="toggleSelectAll" />
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-40">
											订单号
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'order_no')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-32">
											用户信息
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'user_id')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-80">商品信息</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-24">
											数量
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'quantity')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-28">
											支付金额
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'final_amount')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-36">联系人信息</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-28">
											出发日期
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'departure_date')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-24">行程天数</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-28">订单状态</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-28">
											创建时间
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'created_at')"></i>
										</th>
										<th class="px-4 py-4 text-center text-sm font-semibold text-gray-900 w-40">操作</th>
									</tr>
								</thead>

								<!-- 表格主体 -->
								<tbody class="bg-white divide-y divide-gray-200">
									<!-- 加载状态 -->
									<tr v-if="loading">
										<td colspan="12" class="p-8 text-center">
											<view class="flex items-center justify-center">
												<i class="fas fa-spinner fa-spin text-emerald-600 text-xl mr-3"></i>
												<text class="text-gray-600 text-base">正在加载订单数据...</text>
											</view>
										</td>
									</tr>

									<!-- 空数据状态 -->
									<tr v-else-if="!data.length">
										<td colspan="12" class="p-12 text-center">
											<view class="flex flex-col items-center">
												<i class="fas fa-shopping-cart text-gray-400 text-4xl mb-4"></i>
												<text class="text-gray-500 text-lg">{{ error.message || '暂无订单数据' }}</text>
												<text class="text-gray-400 text-sm mt-2">您可以点击"新增订单"添加订单信息</text>
											</view>
										</td>
									</tr>

									<!-- 数据行 -->
									<tr
										v-else
										v-for="(item, index) in data"
										:key="index"
										class="hover:bg-gray-50 transition-colors duration-150"
										:class="selectedIndexs.includes(index) ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''">
										<!-- 选择框 -->
										<td class="p-4">
											<input
												type="checkbox"
												class="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
												:checked="selectedIndexs.includes(index)"
												@change="toggleSelectItem(index)" />
										</td>

										<!-- 订单号 -->
										<td class="px-4 py-4">
											<view class="flex items-center">
												<text
													class="text-sm font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded cursor-pointer hover:bg-emerald-100 transition-colors"
													@click="copyToClipboard(item.order_no)">
													{{ item.order_no || '-' }}
												</text>
												<i class="fas fa-copy text-gray-400 ml-2 cursor-pointer hover:text-emerald-600 transition-colors" @click="copyToClipboard(item.order_no)"></i>
											</view>
										</td>

										<!-- 用户信息 -->
										<td class="px-4 py-4">
											<view class="flex items-center">
												<i class="fas fa-user text-gray-400 mr-2"></i>
												<text class="text-sm text-gray-900 font-mono cursor-pointer hover:text-blue-600 transition-colors" @click="copyToClipboard(item.user_id)">
													{{ item.user_id ? item.user_id.substring(0, 8) + '...' : '-' }}
												</text>
											</view>
										</td>

										<!-- 商品信息 -->
										<td class="px-4 py-4">
											<view class="max-w-xs">
												<text class="text-sm font-medium text-gray-900 line-clamp-2 leading-5">
													{{ getProductTitle(item.product_snapshot) }}
												</text>
												<text class="text-xs text-gray-500 mt-1" v-if="getProductSubtitle(item.product_snapshot)">
													{{ getProductSubtitle(item.product_snapshot) }}
												</text>
											</view>
										</td>

										<!-- 数量 -->
										<td class="px-4 py-4">
											<view class="flex items-center">
												<i class="fas fa-users text-blue-400 mr-1"></i>
												<text class="text-sm font-semibold text-blue-600">
													{{ item.quantity || 0 }}
												</text>
											</view>
										</td>

										<!-- 支付金额 -->
										<td class="px-4 py-4">
											<text class="text-sm font-bold text-red-600">
												{{ item.final_amount ? '¥' + item.final_amount : '-' }}
											</text>
										</td>

										<!-- 联系人信息 -->
										<td class="px-4 py-4">
											<view class="text-xs text-gray-600">
												<text class="block font-medium">{{ getContactName(item.contact_info) }}</text>
												<text class="block text-gray-500">{{ getContactPhone(item.contact_info) }}</text>
											</view>
										</td>

										<!-- 出发日期 -->
										<td class="px-4 py-4">
											<text class="text-xs text-gray-500">
												<uni-dateformat :threshold="[0, 0]" :date="item.departure_date" format="MM-dd"></uni-dateformat>
											</text>
										</td>

										<!-- 行程天数 -->
										<td class="px-4 py-4">
											<view class="flex items-center">
												<i class="fas fa-calendar-alt text-orange-400 mr-1"></i>
												<text class="text-sm text-orange-600 font-medium">{{ item.duration_days || 0 }}天</text>
											</view>
										</td>

										<!-- 订单状态 -->
										<td class="px-4 py-4">
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="getStatusClass(item.status)">
												<i :class="getStatusIcon(item.status)" class="mr-1"></i>
												{{ getStatusText(item.status) }}
											</span>
										</td>

										<!-- 创建时间 -->
										<td class="px-4 py-4">
											<text class="text-xs text-gray-500">
												<uni-dateformat :threshold="[0, 0]" :date="item.created_at" format="MM-dd hh:mm"></uni-dateformat>
											</text>
										</td>

										<!-- 操作 -->
										<td class="px-4 py-4">
											<view class="flex items-center justify-center space-x-2">
												<button
													@click="navigateTo('./edit?id=' + item._id, false)"
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

				<!-- 分页组件 -->
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
	</view>
</template>

<script>
import { enumConverter, filterToWhere } from '../../js_sdk/validator/a-orders.js';

const db = uniCloud.database();
const dbOrderBy = 'created_at desc'; // 默认按创建时间倒序
const dbSearchFields = ['order_no', 'user_id', 'contact_info']; // 模糊搜索字段
const pageSize = 15;
const pageCurrent = 1;

const orderByMapping = {
	ascending: 'asc',
	descending: 'desc'
};

export default {
	data() {
		return {
			collectionList: 'a-orders',
			query: '',
			where: '',
			orderby: dbOrderBy,
			orderByFieldName: '',
			selectedIndexs: [],
			currentTime: '',
			statusFilter: '', // 状态筛选
			// 模拟统计数据
			statistics: {
				todayOrders: 23,
				todayRevenue: '12,568',
				pendingOrders: 8,
				monthlyCompleted: 156
			},
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
			exportExcelData: []
		};
	},
	onLoad() {
		this._filter = {};
		this.updateCurrentTime();
		// 定时更新时间
		setInterval(() => {
			this.updateCurrentTime();
		}, 60000);
	},
	onReady() {
		this.$refs.udb.loadData();
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

		// 全选/取消全选
		toggleSelectAll(e) {
			if (e.target.checked) {
				this.selectedIndexs = Array.from({ length: this.$refs.udb.dataList.length }, (_, i) => i);
			} else {
				this.selectedIndexs = [];
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
			// 构建模糊搜索条件
			const conditions = dbSearchFields.map((field) => `/${query}/i.test(${field})`);
			return conditions.join(' || ');
		},

		search() {
			let newWhere = this.getWhere();
			// 如果有状态筛选，添加状态条件
			if (this.statusFilter) {
				const statusCondition = `status == "${this.statusFilter}"`;
				newWhere = newWhere ? `(${newWhere}) && ${statusCondition}` : statusCondition;
			}
			this.where = newWhere;
			this.selectedIndexs = []; // 清空选择
			this.$nextTick(() => {
				this.loadData();
			});
		},

		clearSearch() {
			this.query = '';
			this.statusFilter = '';
			this.where = '';
			this.selectedIndexs = []; // 清空选择
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
			this.selectedIndexs = []; // 切换页面时清空选择
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

		// 跳转到携程同步页面
		navigateToSync() {
			uni.navigateTo({
				url: '/pages/snapshot-sync/snapshot-sync',
				success: () => {
					console.log('跳转到快照同步页面成功');
				},
				fail: (error) => {
					console.error('跳转失败:', error);
					this.$message.error('页面跳转失败，请检查页面路径是否正确');
				}
			});
		},

		// 获取选中的项目ID
		selectedItems() {
			var dataList = this.$refs.udb.dataList;
			return this.selectedIndexs.map((i) => dataList[i]._id);
		},

		// 批量删除
		delTable() {
			if (!this.selectedIndexs.length) return;

			uni.showModal({
				title: '确认删除',
				content: `确定要删除选中的 ${this.selectedIndexs.length} 个订单吗？此操作不可恢复。`,
				success: (res) => {
					if (res.confirm) {
						this.$refs.udb.remove(this.selectedItems(), {
							success: (res) => {
								this.selectedIndexs = [];
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								});
							}
						});
					}
				}
			});
		},

		confirmDelete(id) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这个订单吗？此操作不可恢复。',
				success: (res) => {
					if (res.confirm) {
						this.$refs.udb.remove(id, {
							success: (res) => {
								this.selectedIndexs = [];
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								});
							}
						});
					}
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
		}
	}
};
</script>

<style>
/* Tailwind CSS 和 FontAwesome 已通过 CDN 引入 */

/* 自定义样式补充 */
.line-clamp-1 {
	display: -webkit-box;
	-webkit-line-clamp: 1;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.line-clamp-2 {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

/* 表格滚动条样式 */
.overflow-x-auto::-webkit-scrollbar {
	height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
	background: #f1f1f1;
	border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
	background: #c1c1c1;
	border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
	background: #a8a8a8;
}

/* 确保表格在小屏幕上可以横向滚动 */
@media (max-width: 768px) {
	.overflow-x-auto {
		-webkit-overflow-scrolling: touch;
	}
}

/* 动画效果 */
.transition-colors {
	transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out;
}

/* 输入框聚焦效果 */
input:focus,
select:focus {
	outline: none;
	box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* 按钮悬停效果 */
button:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

button:active {
	transform: translateY(0);
}

/* 禁用状态 */
button:disabled {
	transform: none;
	box-shadow: none;
}

/* 渐变背景 */
.bg-gradient-to-r {
	background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

.from-blue-500 {
	--tw-gradient-from: #3b82f6;
	--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(59, 130, 246, 0));
}

.to-blue-600 {
	--tw-gradient-to: #2563eb;
}

.from-green-500 {
	--tw-gradient-from: #10b981;
	--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(16, 185, 129, 0));
}

.to-green-600 {
	--tw-gradient-to: #059669;
}

.from-orange-500 {
	--tw-gradient-from: #f97316;
	--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(249, 115, 22, 0));
}

.to-orange-600 {
	--tw-gradient-to: #ea580c;
}

.from-purple-500 {
	--tw-gradient-from: #8b5cf6;
	--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(139, 92, 246, 0));
}

.to-purple-600 {
	--tw-gradient-to: #7c3aed;
}
</style>
