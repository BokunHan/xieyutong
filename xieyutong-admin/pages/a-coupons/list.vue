<template>
	<view class="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 font-microsoft">
		<!-- 页面头部 -->
		<view class="bg-white shadow-lg border-b border-gray-200">
			<view class="max-w-7xl mx-auto px-8 py-6">
				<view class="flex items-center justify-between">
					<view class="flex items-center space-x-4">
						<view class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
							<i class="fas fa-ticket-alt text-white text-xl"></i>
						</view>
						<view>
							<text class="text-3xl font-bold text-gray-900">优惠券管理</text>
							<text class="block text-lg text-gray-600 mt-1">管理平台优惠券发放与使用</text>
						</view>
					</view>
					<view class="flex items-center space-x-4">
						<view class="bg-purple-50 px-6 py-3 rounded-lg">
							<text class="text-purple-700 font-medium text-lg">总券数: {{ totalCoupons }}</text>
						</view>
					</view>
					<view>
						<button
							class="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base"
							@click="navigateTo('../a-user-coupons/list')">
							用户优惠券管理
						</button>
					</view>
				</view>
			</view>
		</view>

		<!-- 主要内容区域 -->
		<view class="max-w-7xl mx-auto px-8 py-8 space-y-8">
			<!-- 统计卡片区域 -->
			<view class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<view class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
					<view class="flex items-center justify-between">
						<view>
							<text class="text-2xl font-bold text-purple-600">{{ activeCoupons }}</text>
							<text class="text-gray-600 text-lg block mt-1">启用券数</text>
						</view>
						<view class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
							<i class="fas fa-check-circle text-purple-600 text-xl"></i>
						</view>
					</view>
				</view>

				<view class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
					<view class="flex items-center justify-between">
						<view>
							<text class="text-2xl font-bold text-green-600">{{ usedCoupons }}</text>
							<text class="text-gray-600 text-lg block mt-1">已使用</text>
						</view>
						<view class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
							<i class="fas fa-shopping-cart text-green-600 text-xl"></i>
						</view>
					</view>
				</view>

				<view class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
					<view class="flex items-center justify-between">
						<view>
							<text class="text-2xl font-bold text-orange-600">{{ totalAmount }}</text>
							<text class="text-gray-600 text-lg block mt-1">总优惠额</text>
						</view>
						<view class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
							<i class="fas fa-coins text-orange-600 text-xl"></i>
						</view>
					</view>
				</view>

				<view class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
					<view class="flex items-center justify-between">
						<view>
							<text class="text-2xl font-bold text-blue-600">{{ todayIssued }}</text>
							<text class="text-gray-600 text-lg block mt-1">今日发放</text>
						</view>
						<view class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
							<i class="fas fa-calendar-day text-blue-600 text-xl"></i>
						</view>
					</view>
				</view>
			</view>

			<!-- 搜索和操作区域 -->
			<view class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
				<view class="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
					<view class="flex items-center justify-between">
						<view class="flex items-center">
							<i class="fas fa-search text-white text-2xl mr-4"></i>
							<text class="text-2xl font-bold text-white">搜索与筛选</text>
						</view>
					</view>
				</view>

				<view class="p-8">
					<view class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
						<!-- 搜索框 -->
						<view class="lg:col-span-2">
							<label class="block text-lg font-medium text-gray-700 mb-3">
								<i class="fas fa-search text-purple-500 mr-2"></i>
								搜索优惠券
							</label>
							<uni-easyinput
								v-model="query"
								placeholder="搜索券名称、描述、分享码..."
								:clearable="true"
								:inputBorder="true"
								:styles="{
									color: '#1f2937',
									backgroundColor: '#ffffff',
									borderColor: '#d1d5db',
									borderRadius: '12px',
									fontSize: '18px',
									fontFamily: 'Microsoft YaHei, sans-serif',
									padding: '16px 20px',
									minHeight: '56px'
								}"
								:focus-style="{
									borderColor: '#a855f7',
									boxShadow: '0 0 0 3px rgba(168, 85, 247, 0.1)'
								}"
								@input="handleSearch" />
						</view>

						<!-- 状态筛选 -->
						<view>
							<label class="block text-lg font-medium text-gray-700 mb-3">
								<i class="fas fa-filter text-pink-500 mr-2"></i>
								状态筛选
							</label>
							<select
								v-model="statusFilter"
								@change="handleFilter"
								class="w-full px-6 py-4 border border-gray-300 rounded-xl bg-white text-gray-700 font-medium text-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all">
								<option value="">全部状态</option>
								<option value="active">启用</option>
								<option value="inactive">停用</option>
							</select>
						</view>
					</view>

					<!-- 操作按钮组 -->
					<view class="flex flex-wrap items-center gap-4">
						<button
							@click="navigateTo('./add')"
							class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-bold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
							<i class="fas fa-plus mr-3"></i>
							新增优惠券
						</button>

						<!-- <button
							@click="delTable"
							:disabled="!selectedIndexs.length"
							:class="selectedIndexs.length ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'"
							class="text-white text-lg font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg">
							<i class="fas fa-trash mr-3"></i>
							批量删除 ({{ selectedIndexs.length }})
						</button> -->

						<download-excel :fields="exportExcel.fields" :data="exportExcelData" :type="exportExcel.type" :name="exportExcel.filename">
							<button class="bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
								<i class="fas fa-download mr-3"></i>
								导出Excel
							</button>
						</download-excel>

						<button
							@click="refreshData"
							:disabled="loading"
							class="bg-gray-600 hover:bg-gray-700 text-white text-lg font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg">
							<i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'" class="mr-3"></i>
							刷新数据
						</button>
					</view>
				</view>
			</view>

			<!-- 数据表格区域 -->
			<view class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
				<view class="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
					<view class="flex items-center justify-between">
						<view class="flex items-center">
							<i class="fas fa-table text-white text-2xl mr-4"></i>
							<text class="text-2xl font-bold text-white">优惠券列表</text>
						</view>
						<!-- <view class="text-white">
							<text class="text-lg">共 {{ pagination.count }} 条记录</text>
						</view> -->
					</view>
				</view>

				<!-- uniCloud数据库查询 -->
				<unicloud-db
					ref="udb"
					:collection="collectionList"
					field="title,description,type,amount,min_amount,issue_type,total_count,used_count,valid_days,share_code,auto_issue_condition,status,created_at,updated_at"
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
					<!-- 表格头部筛选栏 -->
					<view class="bg-gray-50 px-8 py-4 border-b border-gray-200">
						<view class="grid grid-cols-1 md:grid-cols-3 gap-4">
							<view>
								<label class="block text-sm font-medium text-gray-700 mb-2">发券类型</label>
								<select
									v-model="issueTypeFilter"
									@change="handleFilter"
									class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:border-purple-500">
									<option value="">全部类型</option>
									<option value="manual">手动发放</option>
									<option value="auto_referral">推荐奖励</option>
								</select>
							</view>

							<view>
								<label class="block text-sm font-medium text-gray-700 mb-2">自动发券条件</label>
								<select
									v-model="autoIssueFilter"
									@change="handleFilter"
									class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:border-purple-500">
									<option value="">全部条件</option>
									<option value="referrer_reward">推荐人奖励</option>
									<option value="referee_reward">被推荐人奖励</option>
								</select>
							</view>

							<view>
								<label class="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
								<select v-model="sortType" @change="handleSort" class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:border-purple-500">
									<option value="">默认排序</option>
									<option value="created_at desc">创建时间(新到旧)</option>
									<option value="created_at asc">创建时间(旧到新)</option>
									<option value="amount desc">优惠金额(高到低)</option>
									<option value="amount asc">优惠金额(低到高)</option>
									<option value="used_count desc">使用数量(多到少)</option>
								</select>
							</view>
						</view>
					</view>

					<!-- 数据表格 -->
					<view class="overflow-x-auto">
						<table class="w-full">
							<colgroup>
								<col style="width: 60px" />
								<col style="width: 300px" />
								<col style="width: 200px" />
								<col style="width: 220px" />
								<col style="width: 160px" />
								<col style="width: 120px" />
								<col style="width: 160px" />
								<col style="width: 180px" />
							</colgroup>
							<thead class="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-purple-200">
								<tr>
									<th class="px-4 py-5 text-center border-r border-purple-100">
										<input
											type="checkbox"
											@change="selectAll"
											:checked="selectedIndexs.length === data.length && data.length > 0"
											class="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-300" />
									</th>
									<th class="px-6 py-5 text-left text-lg font-bold text-gray-800 border-r border-purple-100">
										<i class="fas fa-ticket-alt text-purple-600 mr-2"></i>
										券信息
									</th>
									<th class="px-6 py-5 text-center text-lg font-bold text-gray-800 border-r border-purple-100">
										<i class="fas fa-money-bill-wave text-red-600 mr-2"></i>
										优惠详情
									</th>
									<th class="px-6 py-5 text-center text-lg font-bold text-gray-800 border-r border-purple-100">
										<i class="fas fa-chart-bar text-green-600 mr-2"></i>
										发放统计
									</th>
									<th class="px-6 py-5 text-center text-lg font-bold text-gray-800 border-r border-purple-100">
										<i class="fas fa-cogs text-blue-600 mr-2"></i>
										发券设置
									</th>
									<th class="px-6 py-5 text-center text-lg font-bold text-gray-800 border-r border-purple-100">
										<i class="fas fa-power-off text-orange-600 mr-2"></i>
										状态
									</th>
									<th class="px-6 py-5 text-center text-lg font-bold text-gray-800 border-r border-purple-100">
										<i class="fas fa-clock text-indigo-600 mr-2"></i>
										创建时间
									</th>
									<th class="px-6 py-5 text-center text-lg font-bold text-gray-800">
										<i class="fas fa-tools text-gray-600 mr-2"></i>
										操作
									</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								<tr
									v-for="(item, index) in data"
									:key="index"
									class="hover:bg-gradient-to-r hover:from-purple-25 hover:to-pink-25 transition-all duration-200 group"
									:class="selectedIndexs.includes(index) ? 'bg-purple-50 border-l-4 border-purple-400' : ''">
									<td class="px-4 py-6 text-center border-r border-gray-100">
										<input
											type="checkbox"
											:checked="selectedIndexs.includes(index)"
											@change="toggleSelect(index)"
											class="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-300" />
									</td>

									<!-- 券信息 -->
									<td class="px-6 py-6 border-r border-gray-100">
										<view class="flex flex-col space-y-2">
											<text class="text-lg font-bold text-gray-900 leading-tight">{{ item.title }}</text>
											<text class="text-gray-600 text-sm leading-relaxed line-clamp-2 min-h-[40px]">{{ item.description }}</text>
											<view v-if="item.share_code" class="flex items-center mt-2 p-2 bg-purple-50 rounded-lg">
												<i class="fas fa-code text-purple-600 mr-2"></i>
												<text class="text-purple-700 font-mono text-sm font-medium">{{ item.share_code }}</text>
											</view>
										</view>
									</td>

									<!-- 优惠详情 -->
									<td class="px-6 py-6 text-center border-r border-gray-100">
										<view class="flex flex-col items-center space-y-2">
											<view class="bg-red-50 p-3 rounded-xl border border-red-200">
												<text v-if="item.type === 'fixed'" class="text-3xl font-bold text-red-600 block">￥{{ item.amount }}</text>
												<text v-else-if="item.type === 'percent'" class="text-3xl font-bold text-red-600 block">{{ item.amount * 10 }}%</text>
											</view>
											<view class="text-center space-y-1">
												<text class="text-gray-700 text-sm font-medium block">
													满
													<span class="text-orange-600 font-bold">￥{{ item.min_amount }}</span>
													可用
												</text>
												<view class="flex items-center justify-center text-gray-500 text-sm">
													<i class="fas fa-calendar-alt mr-1"></i>
													<text>有效期{{ item.valid_days }}天</text>
												</view>
											</view>
										</view>
									</td>

									<!-- 发放统计 -->
									<td class="px-6 py-6 border-r border-gray-100">
										<view class="bg-gray-50 p-4 rounded-xl space-y-3">
											<!-- 数量统计 -->
											<view class="grid grid-cols-2 gap-3 text-center">
												<view class="bg-blue-50 p-2 rounded-lg border border-blue-200">
													<text class="text-blue-600 text-xs block mb-1">发放</text>
													<text class="font-bold text-blue-700 text-lg">{{ item.total_count }}</text>
												</view>
												<view class="bg-green-50 p-2 rounded-lg border border-green-200">
													<text class="text-green-600 text-xs block mb-1">已用</text>
													<text class="font-bold text-green-700 text-lg">{{ item.used_count }}</text>
												</view>
											</view>

											<!-- 进度条 -->
											<view class="space-y-2">
												<view class="flex justify-between text-xs text-gray-600">
													<text>使用进度</text>
													<text class="font-bold">{{ ((item.used_count / item.total_count) * 100).toFixed(1) }}%</text>
												</view>
												<view class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
													<view
														class="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
														:style="{ width: Math.min((item.used_count / item.total_count) * 100, 100) + '%' }"></view>
												</view>

												<!-- 剩余数量 -->
												<view class="text-center">
													<text class="text-gray-500 text-xs">剩余</text>
													<text class="font-bold text-orange-600 text-sm">{{ item.total_count - item.used_count }}</text>
													<text class="text-gray-500 text-xs">张</text>
												</view>
											</view>
										</view>
									</td>

									<!-- 发券设置 -->
									<td class="px-6 py-6 text-center border-r border-gray-100">
										<view class="space-y-3">
											<span :class="getIssueTypeClass(item.issue_type)" class="inline-block px-3 py-2 rounded-lg text-sm font-bold border-2">
												{{ getIssueTypeText(item.issue_type) }}
											</span>
											<view v-if="item.auto_issue_condition" class="bg-yellow-50 p-2 rounded-lg border border-yellow-200">
												<text class="text-yellow-800 text-xs font-medium">
													{{ getAutoIssueText(item.auto_issue_condition) }}
												</text>
											</view>
										</view>
									</td>

									<!-- 状态 -->
									<td class="px-6 py-6 text-center border-r border-gray-100">
										<view class="flex justify-center">
											<span :class="getStatusClass(item.status)" class="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 min-w-[80px] justify-center">
												<i :class="item.status === 'active' ? 'fas fa-check-circle' : 'fas fa-times-circle'" class="mr-2"></i>
												{{ getStatusText(item.status) }}
											</span>
										</view>
									</td>

									<!-- 创建时间 -->
									<td class="px-6 py-6 text-center border-r border-gray-100">
										<view class="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
											<text class="text-indigo-800 text-sm font-medium block leading-relaxed">
												{{ formatDateTime(item.created_at) }}
											</text>
										</view>
									</td>

									<!-- 操作 -->
									<td class="px-6 py-6 text-center">
										<view class="flex flex-col space-y-2">
											<button
												@click="navigateTo('./edit?id=' + item._id, false)"
												class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-bold shadow-md hover:shadow-lg transform hover:scale-105">
												<i class="fas fa-edit mr-2"></i>
												编辑
											</button>
											<button
												@click="confirmDelete(item._id)"
												class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-bold shadow-md hover:shadow-lg transform hover:scale-105">
												<i class="fas fa-trash mr-2"></i>
												删除
											</button>
										</view>
									</td>
								</tr>
							</tbody>
						</table>

						<!-- 空状态 -->
						<view v-if="data.length === 0 && !loading" class="text-center py-16">
							<i class="fas fa-ticket-alt text-gray-300 text-6xl mb-4"></i>
							<text class="text-gray-500 text-xl block mb-2">暂无优惠券记录</text>
							<text class="text-gray-400">点击"新增优惠券"创建第一个优惠券</text>
						</view>

						<!-- 加载状态 -->
						<view v-if="loading" class="text-center py-16">
							<i class="fas fa-spinner fa-spin text-purple-500 text-4xl mb-4"></i>
							<text class="text-gray-600 text-lg">加载中...</text>
						</view>
					</view>

					<!-- 分页器 -->
					<view v-if="data.length > 0" class="bg-gray-50 px-8 py-6 border-t border-gray-200">
						<view class="flex items-center justify-between">
							<text class="text-gray-600 text-lg">
								显示第 {{ (pagination.current - 1) * pagination.size + 1 }} - {{ Math.min(pagination.current * pagination.size, pagination.count) }} 条， 共
								{{ pagination.count }} 条记录
							</text>
							<uni-pagination
								show-icon
								:page-size="pagination.size"
								v-model="pagination.current"
								:total="pagination.count"
								@change="onPageChanged"
								:style="{
									'--primary-color': '#a855f7'
								}" />
						</view>
					</view>
				</unicloud-db>
			</view>
		</view>
	</view>
</template>

<script>
import { enumConverter, filterToWhere } from '../../js_sdk/validator/a-coupons.js';

const db = uniCloud.database();
const dbSearchFields = ['title', 'description', 'share_code'];
const pageSize = 20;
const pageCurrent = 1;

const orderByMapping = {
	ascending: 'asc',
	descending: 'desc'
};

export default {
	data() {
		return {
			collectionList: 'a-coupons',
			query: '',
			where: '',
			orderby: 'created_at desc',
			orderByFieldName: '',
			selectedIndexs: [],
			loading: false,

			// 筛选条件
			statusFilter: '',
			issueTypeFilter: '',
			autoIssueFilter: '',
			sortType: '',

			// 统计数据
			totalCoupons: 0,
			activeCoupons: 0,
			usedCoupons: 0,
			totalAmount: 0,
			todayIssued: 0,

			// 分页信息
			pagination: {
				current: pageCurrent,
				size: pageSize,
				count: 0
			},

			options: {
				pageSize,
				pageCurrent,
				filterData: {
					issue_type_localdata: [
						{ value: 'manual', text: '手动发放' },
						{ value: 'auto_referral', text: '推荐奖励' }
					],
					auto_issue_condition_localdata: [
						{ value: 'referrer_reward', text: '推荐人奖励' },
						{ value: 'referee_reward', text: '被推荐人奖励' }
					],
					status_localdata: [
						{ value: 'active', text: '启用' },
						{ value: 'inactive', text: '停用' }
					]
				},
				...enumConverter
			},

			exportExcel: {
				filename: '优惠券列表.xls',
				type: 'xls',
				fields: {
					券名称: 'title',
					券描述: 'description',
					优惠金额: 'amount',
					使用门槛: 'min_amount',
					发券类型: 'issue_type',
					发放总数: 'total_count',
					已使用数: 'used_count',
					有效天数: 'valid_days',
					分享码: 'share_code',
					自动发券条件: 'auto_issue_condition',
					状态: 'status',
					创建时间: 'created_at',
					更新时间: 'updated_at'
				}
			},
			exportExcelData: []
		};
	},

	onLoad() {
		this._filter = {};
		this.loadStatistics();
	},

	onReady() {
		this.$refs.udb.loadData();
	},

	methods: {
		// 加载统计数据
		async loadStatistics() {
			try {
				const result = await db.collection('a-coupons').get();
				const coupons = result.result.data;

				this.totalCoupons = coupons.length;
				this.activeCoupons = coupons.filter((item) => item.status === 'active').length;
				this.usedCoupons = coupons.reduce((sum, item) => sum + (item.used_count || 0), 0);
				this.totalAmount = coupons.reduce((sum, item) => sum + (item.amount || 0), 0);

				// 计算今日发放数量
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				this.todayIssued = coupons.filter((item) => new Date(item.created_at) >= today).length;
			} catch (error) {
				console.error('加载统计数据失败:', error);
			}
		},

		onqueryload(data) {
			this.exportExcelData = data;
			this.pagination = data.pagination || this.pagination;
			this.loadStatistics();
		},

		// 处理搜索
		handleSearch() {
			this.buildWhere();
			this.loadData();
		},

		// 处理筛选
		handleFilter() {
			this.buildWhere();
			this.loadData();
		},

		// 处理排序
		handleSort() {
			this.orderby = this.sortType;
			this.loadData();
		},

		// 构建查询条件
		buildWhere() {
			let conditions = [];

			// 搜索条件
			if (this.query.trim()) {
				const searchConditions = dbSearchFields.map((field) => `/${this.query.trim()}/i.test(${field})`).join(' || ');
				conditions.push(`(${searchConditions})`);
			}

			// 状态筛选
			if (this.statusFilter) {
				conditions.push(`status == "${this.statusFilter}"`);
			}

			// 发券类型筛选
			if (this.issueTypeFilter) {
				conditions.push(`issue_type == "${this.issueTypeFilter}"`);
			}

			// 自动发券条件筛选
			if (this.autoIssueFilter) {
				conditions.push(`auto_issue_condition == "${this.autoIssueFilter}"`);
			}

			this.where = conditions.length > 0 ? conditions.join(' && ') : '';
		},

		loadData(clear = true) {
			this.loading = true;
			this.$refs.udb.loadData({ clear });
		},

		refreshData() {
			this.loadData(true);
			this.loadStatistics();
		},

		onPageChanged(e) {
			this.selectedIndexs.length = 0;
			this.$refs.udb.loadData({
				current: e.current
			});
		},

		navigateTo(url, clear = true) {
			uni.navigateTo({
				url,
				events: {
					refreshData: () => {
						this.loadData(clear);
						this.loadStatistics();
					}
				}
			});
		},

		// 全选
		selectAll(e) {
			if (e.detail.value) {
				this.selectedIndexs = Array.from({ length: this.$refs.udb.dataList.length }, (_, i) => i);
			} else {
				this.selectedIndexs = [];
			}
		},

		// 切换选择
		toggleSelect(index) {
			const selectedIndex = this.selectedIndexs.indexOf(index);
			if (selectedIndex > -1) {
				this.selectedIndexs.splice(selectedIndex, 1);
			} else {
				this.selectedIndexs.push(index);
			}
		},

		// 获取选中项ID
		selectedItems() {
			const dataList = this.$refs.udb.dataList;
			return this.selectedIndexs.map((i) => dataList[i]._id);
		},

		// 批量删除
		delTable() {
			if (!this.selectedIndexs.length) {
				uni.showToast({
					title: '请选择要删除的记录',
					icon: 'none'
				});
				return;
			}

			this.$refs.udb.remove(this.selectedItems(), {
				success: (res) => {
					this.selectedIndexs = [];
					this.loadStatistics();
					this.$message.success('删除成功');
				}
			});
		},

		confirmDelete(id) {
			this.$refs.udb.remove(id, {
				success: (res) => {
					this.selectedIndexs = [];
					this.loadStatistics();
					this.$message.success('删除成功');
				}
			});
		},

		// 获取发券类型样式
		getIssueTypeClass(type) {
			const classMap = {
				manual: 'bg-blue-100 text-blue-800 border-blue-300',
				auto_referral: 'bg-green-100 text-green-800 border-green-300'
			};
			return classMap[type] || 'bg-gray-100 text-gray-800 border-gray-300';
		},

		// 获取发券类型文本
		getIssueTypeText(type) {
			const textMap = {
				manual: '手动发放',
				auto_referral: '推荐奖励'
			};
			return textMap[type] || type;
		},

		// 获取自动发券条件文本
		getAutoIssueText(condition) {
			const textMap = {
				referrer_reward: '推荐人奖励',
				referee_reward: '被推荐人奖励'
			};
			return textMap[condition] || condition;
		},

		// 获取状态样式
		getStatusClass(status) {
			const classMap = {
				active: 'bg-green-100 text-green-800 border-green-300',
				inactive: 'bg-red-100 text-red-800 border-red-300'
			};
			return classMap[status] || 'bg-gray-100 text-gray-800 border-gray-300';
		},

		// 获取状态文本
		getStatusText(status) {
			const textMap = {
				active: '启用',
				inactive: '停用'
			};
			return textMap[status] || '未知';
		},

		// 格式化日期时间
		formatDateTime(date) {
			if (!date) return '';
			const d = new Date(date);
			return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
				d.getMinutes()
			).padStart(2, '0')}`;
		}
	}
};
</script>

<style>
/* 微软雅黑字体 */
.font-microsoft {
	font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

/* 表格样式优化 */
table {
	border-collapse: collapse;
}

/* 滚动条样式 */
::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

::-webkit-scrollbar-track {
	background: #f1f1f1;
	border-radius: 4px;
}

::-webkit-scrollbar-thumb {
	background: #c1c1c1;
	border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
	background: #a8a8a8;
}

/* 按钮禁用状态 */
button:disabled {
	cursor: not-allowed;
}

/* 输入框聚焦动画 */
.uni-easyinput__content-input:focus {
	transition: all 0.2s ease-in-out;
}

/* 表格行悬停效果 */
tr:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 卡片悬停效果 */
.bg-white:hover {
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
	transition: box-shadow 0.3s ease;
}

/* 文本省略 */
.line-clamp-2 {
	overflow: hidden;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
}

/* 进度条动画 */
.bg-green-500 {
	transition: width 0.3s ease-in-out;
}

/* 表格固定布局优化 */
.table-fixed {
	table-layout: fixed;
}

/* 表格单元格内边距统一 */
table td,
table th {
	vertical-align: middle;
}

/* 表格行悬停效果增强 */
tbody tr:hover {
	box-shadow: 0 4px 25px rgba(168, 85, 247, 0.15);
	transform: translateY(-2px);
}

/* 选中行边框效果 */
tbody tr.bg-purple-50 {
	box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.3);
}

/* 渐变背景颜色定义 */
.hover\:from-purple-25:hover {
	--tw-gradient-from: rgba(168, 85, 247, 0.05);
	--tw-gradient-to: rgba(168, 85, 247, 0);
	--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.hover\:to-pink-25:hover {
	--tw-gradient-to: rgba(236, 72, 153, 0.05);
}

/* 数字显示优化 */
.text-3xl.font-bold {
	letter-spacing: -0.025em;
}

/* 进度条容器样式 */
.rounded-full.overflow-hidden {
	box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 按钮组优化 */
.flex.flex-col.space-y-2 button {
	min-width: 80px;
}

/* 状态标签样式增强 */
.inline-flex.items-center.rounded-full {
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 卡片样式统一 */
.bg-gray-50.p-4.rounded-xl,
.bg-red-50.p-3.rounded-xl,
.bg-indigo-50.p-3.rounded-lg,
.bg-purple-50.p-2.rounded-lg,
.bg-yellow-50.p-2.rounded-lg {
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 滚动条在表格中的样式 */
.overflow-x-auto::-webkit-scrollbar {
	height: 12px;
}

.overflow-x-auto::-webkit-scrollbar-track {
	background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%);
}

.overflow-x-auto::-webkit-scrollbar-thumb {
	background: linear-gradient(90deg, #a855f7 0%, #d946ef 100%);
	border-radius: 6px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
	background: linear-gradient(90deg, #9333ea 0%, #c026d3 100%);
}
</style>