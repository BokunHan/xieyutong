<template>
	<view class="min-h-screen bg-gray-50" style="font-family: 'Microsoft YaHei', sans-serif">
		<!-- 页面标题栏 -->
		<view class="bg-white shadow-sm border-b border-gray-200">
			<view class="max-w-full mx-auto px-6 py-4">
				<view class="flex items-center justify-between">
					<view class="flex items-center">
						<view @click="goBack" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer mr-2">
							<i class="fas fa-arrow-left text-gray-600 text-lg"></i>
						</view>
						<i class="fas fa-ticket-alt text-amber-600 text-2xl mr-4"></i>
						<view>
							<text class="text-2xl font-bold text-gray-900">用户优惠券管理</text>
							<text class="block text-sm text-gray-500 mt-1">管理用户优惠券发放、使用和过期情况</text>
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
				<view class="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-4 text-white">
					<view class="flex items-center justify-between">
						<view>
							<text class="text-sm opacity-90">总发放量</text>
							<text class="block text-2xl font-bold">{{ statistics.totalCoupons }}</text>
						</view>
						<i class="fas fa-gift text-2xl opacity-80"></i>
					</view>
				</view>
				<view class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
					<view class="flex items-center justify-between">
						<view>
							<text class="text-sm opacity-90">已使用</text>
							<text class="block text-2xl font-bold">{{ statistics.usedCoupons }}</text>
						</view>
						<i class="fas fa-check-circle text-2xl opacity-80"></i>
					</view>
				</view>
				<view class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
					<view class="flex items-center justify-between">
						<view>
							<text class="text-sm opacity-90">未使用</text>
							<text class="block text-2xl font-bold">{{ statistics.unusedCoupons }}</text>
						</view>
						<i class="fas fa-ticket-alt text-2xl opacity-80"></i>
					</view>
				</view>
				<view class="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
					<view class="flex items-center justify-between">
						<view>
							<text class="text-sm opacity-90">已过期</text>
							<text class="block text-2xl font-bold">{{ statistics.expiredCoupons }}</text>
						</view>
						<i class="fas fa-times-circle text-2xl opacity-80"></i>
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
								placeholder="搜索用户手机、券码、券标题或备注"
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
									borderColor: '#f59e0b'
								}" />
						</view>

						<!-- 状态筛选 -->
						<view class="flex items-center space-x-2">
							<text class="text-sm text-gray-600 whitespace-nowrap">状态筛选:</text>
							<select
								v-model="statusFilter"
								@change="onStatusFilterChange"
								class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white">
								<option value="">全部状态</option>
								<option value="unused">未使用</option>
								<option value="used">已使用</option>
								<option value="expired">已过期</option>
							</select>
						</view>

						<!-- 来源筛选 -->
						<view class="flex items-center space-x-2">
							<text class="text-sm text-gray-600 whitespace-nowrap">来源筛选:</text>
							<select
								v-model="sourceFilter"
								@change="onSourceFilterChange"
								class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white">
								<option value="">全部来源</option>
								<option value="manual">手动发放</option>
								<option value="referral_reward">推荐奖励</option>
								<option value="new_user_gift">新用户礼品</option>
								<option value="member_upgrade">会员升级</option>
								<option value="activity">活动发放</option>
							</select>
						</view>

						<button
							class="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base"
							@click="search">
							<i class="fas fa-search mr-2"></i>
							搜索
						</button>
					</view>

					<!-- 操作按钮区域 -->
					<view class="flex items-center space-x-3">
						<button
							class="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base"
							@click="navigateTo('./add')">
							<i class="fas fa-plus mr-2"></i>
							发放优惠券
						</button>

						<button
							class="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base disabled:opacity-50 disabled:cursor-not-allowed"
							:disabled="!selectedIndexs.length"
							@click="delTable">
							<i class="fas fa-trash-alt mr-2"></i>
							批量删除 {{ selectedIndexs.length > 0 ? `(${selectedIndexs.length})` : '' }}
						</button>

						<download-excel :fields="exportExcel.fields" :data="exportExcelData" :type="exportExcel.type" :name="exportExcel.filename">
							<button class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base">
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
				collection="a-user-coupons, uni-id-users"
				field="coupon_id,coupon_code,status,order_id,source_type,source_detail,received_at,used_at,expired_at,type,amount,min_amount,title,remark,created_at,updated_at, user_id{mobile, _id}"
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
								<i class="fas fa-chart-line text-amber-600 text-lg mr-3"></i>
								<text class="text-lg font-semibold text-gray-900">优惠券列表</text>
							</view>
							<view class="text-sm text-gray-500">
								共找到
								<text class="font-semibold text-amber-600 text-base">{{ pagination.count }}</text>
								张优惠券
							</view>
						</view>
					</view>

					<!-- 表格容器 -->
					<view class="overflow-hidden">
						<view class="overflow-x-auto">
							<table class="w-full">
								<!-- 表头 -->
								<thead class="bg-gray-50 border-b border-gray-200">
									<tr>
										<th class="w-12 p-4 text-left">
											<checkbox class="transform scale-90" color="#f59e0b" :checked="selectedIndexs.length === data.length && data.length > 0" @click="toggleSelectAll" />
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-32">
											用户
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'user_id')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-48">
											优惠券码
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'coupon_code')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-48">
											券标题
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'title')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-32">
											优惠金额
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'amount')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-32">
											使用门槛
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'min_amount')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-28">使用状态</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-32">获取来源</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-36">
											领取时间
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'received_at')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-36">
											过期时间
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'expired_at')"></i>
										</th>
										<th class="px-4 py-4 text-center text-sm font-semibold text-gray-900 w-32">操作</th>
									</tr>
								</thead>

								<!-- 表格主体 -->
								<tbody class="bg-white divide-y divide-gray-200">
									<!-- 加载状态 -->
									<tr v-if="loading">
										<td colspan="12" class="p-8 text-center">
											<view class="flex items-center justify-center">
												<i class="fas fa-spinner fa-spin text-amber-600 text-xl mr-3"></i>
												<text class="text-gray-600 text-base">正在加载优惠券数据...</text>
											</view>
										</td>
									</tr>

									<!-- 空数据状态 -->
									<tr v-else-if="!data.length">
										<td colspan="12" class="p-12 text-center">
											<view class="flex flex-col items-center">
												<i class="fas fa-ticket-alt text-gray-400 text-4xl mb-4"></i>
												<text class="text-gray-500 text-lg">{{ error.message || '暂无优惠券数据' }}</text>
												<text class="text-gray-400 text-sm mt-2">您可以点击"新增优惠券"添加优惠券信息</text>
											</view>
										</td>
									</tr>

									<!-- 数据行 -->
									<tr
										v-else
										v-for="(item, index) in data"
										:key="index"
										class="hover:bg-gray-50 transition-colors duration-150"
										:class="selectedIndexs.includes(index) ? 'bg-amber-50 border-l-4 border-amber-500' : ''">
										<!-- 选择框 -->
										<td class="p-4">
											<checkbox class="transform scale-90" color="#f59e0b" :checked="selectedIndexs.includes(index)" @click="toggleSelectItem(index)" />
										</td>

										<!-- 用户ID -->
										<td class="px-4 py-4">
											<view class="flex items-center">
												<view class="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center mr-2">
													<i class="fas fa-user text-amber-600 text-xs"></i>
												</view>
												<text
													class="text-sm font-medium text-gray-900 font-mono cursor-pointer hover:text-amber-600 transition-colors"
													@click="copyToClipboard(item.user_id[0] ? item.user_id[0].mobile : '')">
													{{ item.user_id && item.user_id[0] ? item.user_id[0].mobile : '用户不存在' }}
												</text>
											</view>
										</td>

										<!-- 优惠券码 -->
										<td class="px-4 py-4">
											<view class="flex items-center">
												<i class="fas fa-barcode text-gray-400 mr-2"></i>
												<text class="text-sm text-gray-900 font-mono cursor-pointer hover:text-amber-600 transition-colors" @click="copyToClipboard(item.coupon_code)">
													{{ item.coupon_code }}
												</text>
											</view>
										</td>

										<!-- 券标题 -->
										<td class="px-4 py-4">
											<text class="text-sm font-medium text-gray-900 line-clamp-2">
												{{ item.title || '-' }}
											</text>
											<text class="text-xs text-gray-500 block mt-1" v-if="item.remark">
												{{ item.remark }}
											</text>
										</td>

										<!-- 优惠金额 -->
										<td class="px-4 py-4">
											<text class="text-sm font-bold text-red-600" v-if="item.type === 'fixed'">¥{{ item.amount }}</text>
											<text class="text-sm font-bold text-red-600" v-else-if="item.type === 'percent'">{{ item.amount }}折</text>
										</td>

										<!-- 使用门槛 -->
										<td class="px-4 py-4">
											<text class="text-sm text-gray-600">
												{{ item.min_amount ? '满¥' + item.min_amount : '无门槛' }}
											</text>
										</td>

										<!-- 使用状态 -->
										<td class="px-4 py-4">
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="getStatusClass(item.status)">
												<i :class="getStatusIcon(item.status)" class="mr-1"></i>
												{{ getStatusText(item.status) }}
											</span>
										</td>

										<!-- 获取来源 -->
										<td class="px-4 py-4">
											<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" :class="getSourceClass(item.source_type)">
												<i :class="getSourceIcon(item.source_type)" class="mr-1"></i>
												{{ getSourceText(item.source_type) }}
											</span>
										</td>

										<!-- 领取时间 -->
										<td class="px-4 py-4">
											<view class="text-xs text-gray-500">
												<uni-dateformat :threshold="[0, 0]" :date="item.received_at" format="MM-dd hh:mm"></uni-dateformat>
											</view>
										</td>

										<!-- 过期时间 -->
										<td class="px-4 py-4">
											<view class="text-xs" :class="isExpired(item.expired_at) ? 'text-red-600' : 'text-gray-500'">
												<uni-dateformat :threshold="[0, 0]" :date="item.expired_at" format="MM-dd hh:mm"></uni-dateformat>
											</view>
										</td>

										<!-- 操作 -->
										<td class="px-4 py-4">
											<view class="flex items-center justify-center space-x-2">
												<button
													@click="navigateTo('./edit?id=' + item._id, false)"
													class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors duration-200 flex items-center !mr-0">
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
						<uni-pagination
							show-icon
							show-page-size
							:page-size="pagination.size"
							v-model="pagination.current"
							:total="pagination.count"
							@change="onPageChanged"
							@pageSizeChange="changeSize" />
					</view>
				</view>
			</unicloud-db>
		</view>
	</view>
</template>

<script>
import { enumConverter, filterToWhere } from '../../../js_sdk/validator/a-user-coupons.js';

const db = uniCloud.database();
const dbOrderBy = 'received_at desc'; // 排序字段
const dbSearchFields = ['coupon_code', 'title', 'remark', 'user_id.mobile']; // 模糊搜索字段
const pageSize = 15;
const pageCurrent = 1;

const orderByMapping = {
	ascending: 'asc',
	descending: 'desc'
};

export default {
	data() {
		return {
			collectionList: 'a-user-coupons',
			query: '',
			where: '',
			orderby: dbOrderBy,
			orderByFieldName: '',
			selectedIndexs: [],
			statusFilter: '', // 状态筛选
			sourceFilter: '', // 来源筛选
			currentTime: '',
			// 模拟统计数据
			statistics: {
				totalCoupons: 2156,
				usedCoupons: 834,
				unusedCoupons: 1127,
				expiredCoupons: 195
			},
			options: {
				pageSize,
				pageCurrent,
				filterData: {
					status_localdata: [
						{ value: 'unused', text: '未使用' },
						{ value: 'used', text: '已使用' },
						{ value: 'expired', text: '已过期' }
					],
					source_type_localdata: [
						{ value: 'manual', text: '手动发放' },
						{ value: 'referral_reward', text: '推荐奖励' },
						{ value: 'new_user_gift', text: '新用户礼品' },
						{ value: 'member_upgrade', text: '会员升级' },
						{ value: 'activity', text: '活动发放' }
					]
				},
				...enumConverter
			},
			exportExcel: {
				filename: '用户优惠券数据导出.xls',
				type: 'xls',
				fields: {
					用户ID: 'user_id',
					优惠券码: 'coupon_code',
					使用状态: 'status',
					关联订单ID: 'order_id',
					获取来源: 'source_type',
					来源详情: 'source_detail',
					领取时间: 'received_at',
					使用时间: 'used_at',
					过期时间: 'expired_at',
					优惠金额: 'amount',
					使用门槛: 'min_amount',
					券标题: 'title',
					备注: 'remark'
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
		goBack() {
			uni.navigateBack();
		},

		updateCurrentTime() {
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const day = String(now.getDate()).padStart(2, '0');
			const hours = String(now.getHours()).padStart(2, '0');
			const minutes = String(now.getMinutes()).padStart(2, '0');
			this.currentTime = `${year}-${month}-${day} ${hours}:${minutes}`;
		},

		// 获取状态样式类
		getStatusClass(status) {
			const statusMap = {
				unused: 'bg-blue-100 text-blue-800', // 未使用
				used: 'bg-green-100 text-green-800', // 已使用
				expired: 'bg-red-100 text-red-800' // 已过期
			};
			return statusMap[status] || 'bg-gray-100 text-gray-800';
		},

		// 获取状态图标
		getStatusIcon(status) {
			const iconMap = {
				unused: 'fas fa-ticket-alt', // 未使用
				used: 'fas fa-check-circle', // 已使用
				expired: 'fas fa-times-circle' // 已过期
			};
			return iconMap[status] || 'fas fa-question-circle';
		},

		// 获取状态文本
		getStatusText(status) {
			const textMap = {
				unused: '未使用',
				used: '已使用',
				expired: '已过期'
			};
			return textMap[status] || '未知状态';
		},

		// 获取来源样式类
		getSourceClass(sourceType) {
			const sourceMap = {
				manual: 'bg-purple-100 text-purple-800', // 手动发放
				referral_reward: 'bg-orange-100 text-orange-800', // 推荐奖励
				new_user_gift: 'bg-pink-100 text-pink-800', // 新用户礼品
				member_upgrade: 'bg-indigo-100 text-indigo-800', // 会员升级
				activity: 'bg-green-100 text-green-800' // 活动发放
			};
			return sourceMap[sourceType] || 'bg-gray-100 text-gray-800';
		},

		// 获取来源图标
		getSourceIcon(sourceType) {
			const iconMap = {
				manual: 'fas fa-hand-holding', // 手动发放
				referral_reward: 'fas fa-user-friends', // 推荐奖励
				new_user_gift: 'fas fa-gift', // 新用户礼品
				member_upgrade: 'fas fa-crown', // 会员升级
				activity: 'fas fa-calendar-star' // 活动发放
			};
			return iconMap[sourceType] || 'fas fa-question-circle';
		},

		// 获取来源文本
		getSourceText(sourceType) {
			const textMap = {
				manual: '手动发放',
				referral_reward: '推荐奖励',
				new_user_gift: '新用户礼品',
				member_upgrade: '会员升级',
				activity: '活动发放'
			};
			return textMap[sourceType] || '未知来源';
		},

		// 格式化金额
		formatAmount(amount) {
			if (!amount) return '0.00';
			return (parseFloat(amount) / 100).toFixed(2);
		},

		// 判断是否过期
		isExpired(expiredAt) {
			if (!expiredAt) return false;
			return new Date(expiredAt) < new Date();
		},

		// 状态筛选变化
		onStatusFilterChange() {
			this.buildWhere();
		},

		// 来源筛选变化
		onSourceFilterChange() {
			this.buildWhere();
		},

		// 构建查询条件
		buildWhere() {
			let conditions = [];

			// 搜索条件
			const query = this.query.trim();
			if (query) {
				const queryRe = new RegExp(query, 'i');
				const searchConditions = dbSearchFields.map((field) => ({
					[field]: queryRe
				}));
				conditions.push(db.command.or(searchConditions));
			}

			// 状态筛选
			if (this.statusFilter) {
				conditions.push({ status: this.statusFilter });
			}

			// 来源筛选
			if (this.sourceFilter) {
				conditions.push({ source_type: this.sourceFilter });
			}

			// 合并条件
			if (conditions.length > 0) {
				this.where = conditions.length === 1 ? conditions[0] : db.command.and(conditions);
			} else {
				this.where = '';
			}

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
			const queryRe = new RegExp(query, 'i');
			return db.command.or(
				dbSearchFields.map((name) => {
					return {
						[name]: queryRe
					};
				})
			);
		},

		search() {
			this.buildWhere();
		},

		clearSearch() {
			this.query = '';
			this.statusFilter = '';
			this.sourceFilter = '';
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

		changeSize(pageSize) {
			this.options.pageSize = pageSize;
			this.options.pageCurrent = 1;
			this.$nextTick(() => {
				this.loadData();
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

		// 获取选中的项目ID
		selectedItems() {
			var dataList = this.$refs.udb.dataList;
			return this.selectedIndexs.map((i) => dataList[i]._id);
		},

		// 批量删除
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
		}
	}
};
</script>

<style scoped>
/* 自定义滚动条样式 */
.overflow-x-auto::-webkit-scrollbar {
	height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
	background: #f1f5f9;
	border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
	background: #cbd5e1;
	border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
	background: #94a3b8;
}

/* 文本截断样式 */
.line-clamp-2 {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

/* 选择框选中状态动画 */
input[type='checkbox']:checked {
	transform: scale(1.1);
	transition: transform 0.1s ease-in-out;
}

/* 表格行悬停效果 */
table tbody tr {
	transition: all 0.15s ease-in-out;
}

/* 按钮悬停效果 */
button {
	transition: all 0.2s ease-in-out;
}

button:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

button:active {
	transform: translateY(0);
}

/* 状态标签动画效果 */
.status-badge {
	transition: all 0.2s ease-in-out;
}

.status-badge:hover {
	transform: scale(1.05);
}

/* 响应式表格 */
@media (max-width: 768px) {
	.hide-on-mobile {
		display: none;
	}
}

/* 加载动画 */
@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

.fa-spin {
	animation: spin 1s linear infinite;
}

/* 渐变动画 */
@keyframes gradient {
	0% {
		background-position: 0% 50%;
	}
	50% {
		background-position: 100% 50%;
	}
	100% {
		background-position: 0% 50%;
	}
}

.animate-gradient {
	background-size: 200% 200%;
	animation: gradient 3s ease infinite;
}
</style>
