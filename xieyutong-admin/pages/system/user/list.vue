<template>
	<view class="min-h-screen bg-gray-50" style="font-family: 'Microsoft YaHei', sans-serif">
		<!-- 页面标题栏 -->
		<view class="bg-white shadow-sm border-b border-gray-200">
			<view class="max-w-full mx-auto px-6 py-4">
				<view class="flex items-center justify-between">
					<view class="flex items-center">
						<i class="fas fa-users text-blue-600 text-2xl mr-4"></i>
						<view>
							<text class="text-2xl font-bold text-gray-900">用户管理</text>
							<text class="block text-sm text-gray-500 mt-1">管理系统用户信息和权限</text>
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
							<text class="text-sm opacity-90">总用户数</text>
							<text class="block text-2xl font-bold">{{ statistics.totalUsers }}</text>
						</view>
						<i class="fas fa-users text-2xl opacity-80"></i>
					</view>
				</view>
				<view class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
					<view class="flex items-center justify-between">
						<view>
							<text class="text-sm opacity-90">活跃用户</text>
							<text class="block text-2xl font-bold">{{ statistics.activeUsers }}</text>
						</view>
						<i class="fas fa-user-check text-2xl opacity-80"></i>
					</view>
				</view>
				<view class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
					<view class="flex items-center justify-between">
						<view>
							<text class="text-sm opacity-90">新注册</text>
							<text class="block text-2xl font-bold">{{ statistics.newUsers }}</text>
						</view>
						<i class="fas fa-user-plus text-2xl opacity-80"></i>
					</view>
				</view>
				<view class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
					<view class="flex items-center justify-between">
						<view>
							<text class="text-sm opacity-90">管理员</text>
							<text class="block text-2xl font-bold">{{ statistics.adminUsers }}</text>
						</view>
						<i class="fas fa-user-shield text-2xl opacity-80"></i>
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
								placeholder="搜索用户名、手机号、邮箱或昵称"
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
									borderColor: '#3b82f6'
								}" />
						</view>

						<!-- 状态筛选 -->
						<view class="flex items-center space-x-2">
							<text class="text-sm text-gray-600 whitespace-nowrap">状态筛选:</text>
							<select
								v-model="statusFilter"
								@change="onStatusFilterChange"
								class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
								<option value="">全部状态</option>
								<option value="0">正常</option>
								<option value="1">禁用</option>
								<option value="2">审核中</option>
								<option value="3">审核拒绝</option>
							</select>
						</view>

						<button class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base" @click="search">
							<i class="fas fa-search mr-2"></i>
							搜索
						</button>
					</view>

					<!-- 操作按钮区域 -->
					<view class="flex items-center space-x-3">
						<button
							class="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base"
							@click="navigateTo('./add')">
							<i class="fas fa-user-plus mr-2"></i>
							新增用户
						</button>

						<button
							class="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base disabled:opacity-50 disabled:cursor-not-allowed"
							:disabled="!selectedIndexs.length"
							@click="openTagsPopup">
							<i class="fas fa-tags mr-2"></i>
							标签管理 {{ selectedIndexs.length > 0 ? `(${selectedIndexs.length})` : '' }}
						</button>

						<button
							class="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base disabled:opacity-50 disabled:cursor-not-allowed"
							:disabled="!selectedIndexs.length"
							@click="delTable">
							<i class="fas fa-trash-alt mr-2"></i>
							批量删除 {{ selectedIndexs.length > 0 ? `(${selectedIndexs.length})` : '' }}
						</button>

						<!-- #ifdef H5 -->
						<button
							class="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base disabled:opacity-50 disabled:cursor-not-allowed"
							:disabled="!selectedIndexs.length"
							@click="$refs.batchSms.open()">
							<i class="fas fa-sms mr-2"></i>
							批量短信
						</button>

						<download-excel :fields="exportExcel.fields" :data="exportExcelData" :type="exportExcel.type" :name="exportExcel.filename">
							<button class="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base">
								<i class="fas fa-file-excel mr-2"></i>
								导出Excel
							</button>
						</download-excel>
						<!-- #endif -->
					</view>
				</view>
			</view>
		</view>

		<!-- 主要内容区域 -->
		<view class="mx-6 my-6">
			<unicloud-db
				ref="udb"
				:collection="collectionList"
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
								<i class="fas fa-chart-line text-blue-600 text-lg mr-3"></i>
								<text class="text-lg font-semibold text-gray-900">用户列表</text>
							</view>
							<view class="text-sm text-gray-500">
								共找到
								<text class="font-semibold text-blue-600 text-base">{{ pagination.count }}</text>
								个用户
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
											<!-- <input 
												type="checkbox" 
												class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
												:checked="selectedIndexs.length === data.length && data.length > 0"
												@change="toggleSelectAll"
											/> -->
											<checkbox style="transform: scale(0.8)" :checked="selectedIndexs.length === data.length && data.length > 0" @click="toggleSelectAll" />
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-36">
											用户名
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'username')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-36">
											用户昵称
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'nickname')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-36">
											手机号码
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'mobile')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-48">
											邮箱地址
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'email')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-32">用户状态</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-36">用户角色</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-40">用户标签</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-36">
											最后登录
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'last_login_date')"></i>
										</th>
										<th class="px-4 py-4 text-center text-sm font-semibold text-gray-900 w-40">操作</th>
									</tr>
								</thead>

								<!-- 表格主体 -->
								<tbody class="bg-white divide-y divide-gray-200">
									<!-- 加载状态 -->
									<tr v-if="loading">
										<td colspan="10" class="p-8 text-center">
											<view class="flex items-center justify-center">
												<i class="fas fa-spinner fa-spin text-blue-600 text-xl mr-3"></i>
												<text class="text-gray-600 text-base">正在加载用户数据...</text>
											</view>
										</td>
									</tr>

									<!-- 空数据状态 -->
									<tr v-else-if="!data.length">
										<td colspan="10" class="p-12 text-center">
											<view class="flex flex-col items-center">
												<i class="fas fa-users text-gray-400 text-4xl mb-4"></i>
												<text class="text-gray-500 text-lg">{{ error.message || '暂无用户数据' }}</text>
												<text class="text-gray-400 text-sm mt-2">您可以点击"新增用户"添加用户信息</text>
											</view>
										</td>
									</tr>

									<!-- 数据行 -->
									<tr
										v-else
										v-for="(item, index) in data"
										:key="index"
										class="hover:bg-gray-50 transition-colors duration-150"
										:class="selectedIndexs.includes(index) ? 'bg-blue-50 border-l-4 border-blue-500' : ''">
										<!-- 选择框 -->
										<td class="p-4">
											<!-- <input 
												type="checkbox" 
												class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
												:checked="selectedIndexs.includes(index)"
												@change="toggleSelectItem(index)"
											/> -->
											<checkbox style="transform: scale(0.8)" :checked="selectedIndexs.includes(index)" @click="toggleSelectItem(index)" />
										</td>

										<!-- 用户名 -->
										<td class="px-4 py-4">
											<view class="flex items-center">
												<view class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
													<i class="fas fa-user text-blue-600 text-sm"></i>
												</view>
												<text class="text-sm font-medium text-gray-900">
													{{ item.username || '-' }}
												</text>
											</view>
										</td>

										<!-- 用户昵称 -->
										<td class="px-4 py-4">
											<text class="text-sm text-gray-900">
												{{ item.nickname || '-' }}
											</text>
										</td>

										<!-- 手机号码 -->
										<td class="px-4 py-4">
											<view class="flex items-center">
												<i class="fas fa-mobile-alt text-gray-400 mr-2"></i>
												<text class="text-sm text-gray-900 font-mono cursor-pointer hover:text-blue-600 transition-colors" @click="copyToClipboard(item.mobile)">
													{{ item.mobile || '-' }}
												</text>
											</view>
										</td>

										<!-- 邮箱地址 -->
										<td class="px-4 py-4">
											<view class="flex items-center" v-if="item.email">
												<i class="fas fa-envelope text-gray-400 mr-2"></i>
												<text class="text-sm text-blue-600 hover:text-blue-800 cursor-pointer transition-colors" @click="openEmail(item.email)">
													{{ item.email }}
												</text>
											</view>
											<text v-else class="text-sm text-gray-400">-</text>
										</td>

										<!-- 用户状态 -->
										<td class="px-4 py-4">
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="getStatusClass(item.status)">
												<i :class="getStatusIcon(item.status)" class="mr-1"></i>
												{{ getStatusText(item.status) }}
											</span>
										</td>

										<!-- 用户角色 -->
										<td class="px-4 py-4">
											<view class="flex flex-wrap gap-1">
												<span
													v-for="(role, roleIndex) in getRoleArray(item.role)"
													:key="roleIndex"
													class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
													<i class="fas fa-user-tag mr-1"></i>
													{{ role }}
												</span>
												<span v-if="!item.role" class="text-xs text-gray-400">无角色</span>
											</view>
										</td>

										<!-- 用户标签 -->
										<td class="px-4 py-4">
											<view class="flex flex-wrap gap-1">
												<span
													v-for="(tag, tagIndex) in item.tags"
													:key="tagIndex"
													class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
													<i class="fas fa-tag mr-1"></i>
													{{ tag }}
												</span>
												<span v-if="!item.tags || !item.tags.length" class="text-xs text-gray-400">无标签</span>
											</view>
										</td>

										<!-- 最后登录 -->
										<td class="px-4 py-4">
											<view class="text-xs text-gray-500">
												<uni-dateformat :threshold="[0, 0]" :date="item.last_login_date" format="MM-dd hh:mm"></uni-dateformat>
											</view>
										</td>

										<!-- 操作 -->
										<td class="px-4 py-4">
											<view class="flex items-center justify-center">
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

		<!-- 标签管理弹窗 -->
		<uni-popup ref="tagsPopup" type="center">
			<view class="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full">
				<view class="flex items-center justify-between mb-6">
					<text class="text-xl font-bold text-gray-900">管理用户标签</text>
					<button @click="closeTagsPopup" class="text-gray-400 hover:text-gray-600">
						<i class="fas fa-times text-lg"></i>
					</button>
				</view>

				<view class="mb-6">
					<uni-data-checkbox ref="checkbox" v-model="managerTags" :multiple="true" collection="uni-id-tag" field="tagid as value, name as text" class="space-y-2" />
				</view>

				<view class="flex items-center justify-end space-x-3">
					<button @click="closeTagsPopup" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
					<button @click="managerMultiTag" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">保存标签</button>
				</view>
			</view>
		</uni-popup>

		<!-- #ifdef H5 -->
		<batch-sms ref="batchSms" toType="user" :receiver="smsReceiver" :condition="smsCondition"></batch-sms>
		<!-- #endif -->
	</view>
</template>

<script>
import { enumConverter, filterToWhere } from '../../../js_sdk/validator/uni-id-users.js';

const db = uniCloud.database();
const dbOrderBy = 'last_login_date desc'; // 排序字段
const dbSearchFields = ['username', 'role.role_name', 'mobile', 'email']; // 模糊搜索字段
const pageSize = 15;
const pageCurrent = 1;

const orderByMapping = {
	ascending: 'asc',
	descending: 'desc'
};

export default {
	data() {
		return {
			collectionList: [
				db
					.collection('uni-id-users')
					.field(
						'ali_openid,apple_openid,avatar,avatar_file,comment,dcloud_appid,department_id,email,email_confirmed,gender,invite_time,inviter_uid,last_login_date,last_login_ip,mobile,mobile_confirmed,my_invite_code,nickname,role,score,status,username,wx_unionid,qq_unionid,tags'
					)
					.getTemp(),
				db.collection('uni-id-roles').field('role_id, role_name').getTemp()
			],
			query: '',
			where: this.getBaseWhere(),
			orderby: dbOrderBy,
			orderByFieldName: '',
			selectedIndexs: [],
			statusFilter: '', // 状态筛选
			currentTime: '',
			tags: {},
			managerTags: [],
			queryTagid: '',
			queryUserId: '',
			// 模拟统计数据
			statistics: {
				totalUsers: 1247,
				activeUsers: 856,
				newUsers: 23,
				adminUsers: 8
			},
			options: {
				pageSize,
				pageCurrent,
				filterData: {
					status_localdata: [
						{ text: '正常', value: 0, checked: true },
						{ text: '禁用', value: 1 },
						{ text: '审核中', value: 2 },
						{ text: '审核拒绝', value: 3 }
					]
				},
				...enumConverter
			},
			exportExcel: {
				filename: '用户数据导出.xls',
				type: 'xls',
				fields: {
					用户名: 'username',
					手机号码: 'mobile',
					用户状态: 'status',
					邮箱: 'email',
					角色: 'role',
					最后登录时间: 'last_login_date'
				}
			},
			exportExcelData: [],
			noAppidWhatShouldIDoLink: 'https://uniapp.dcloud.net.cn/uniCloud/uni-id?id=makeup-dcloud-appid',
			smsCondition: {}
		};
	},
	onLoad(e) {
		this._filter = {};
		this.updateCurrentTime();
		// 定时更新时间
		setInterval(() => {
			this.updateCurrentTime();
		}, 60000);

		const tagid = e.tagid;
		const userId = e.id;

		if (tagid) {
			this.queryTagid = tagid;
			const options = {
				filterType: 'select',
				filter: [tagid]
			};
			this.filterChange(options, 'tags');
		}

		if (userId) {
			this.queryUserId = userId;
			const options = {
				filterType: 'select',
				filter: [userId]
			};
			this.filterChange(options, '_id');
		}
	},
	onReady() {
		this.loadTags();
		if (!this.queryTagid && !this.queryUserId) {
			this.$refs.udb.loadData();
		}
	},
	computed: {
		tagsData() {
			const dynamic_data = [];
			for (const key in this.tags) {
				const tag = {
					value: key,
					text: this.tags[key]
				};
				if (key === this.queryTagid) {
					tag.checked = true;
				}
				dynamic_data.push(tag);
			}
			return dynamic_data;
		},
		smsReceiver() {
			if (this.selectedIndexs.length) {
				let dataList = this.$refs.udb.dataList;
				return this.selectedIndexs.map((i) => dataList[i]._id);
			} else {
				return undefined;
			}
		}
	},
	methods: {
		getBaseWhere() {
			// 返回一个基础的查询条件，目前为空
			return '';
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
				0: 'bg-green-100 text-green-800', // 正常
				1: 'bg-red-100 text-red-800', // 禁用
				2: 'bg-yellow-100 text-yellow-800', // 审核中
				3: 'bg-gray-100 text-gray-800' // 审核拒绝
			};
			return statusMap[status] || 'bg-gray-100 text-gray-800';
		},

		// 获取状态图标
		getStatusIcon(status) {
			const iconMap = {
				0: 'fas fa-check-circle', // 正常
				1: 'fas fa-ban', // 禁用
				2: 'fas fa-clock', // 审核中
				3: 'fas fa-times-circle' // 审核拒绝
			};
			return iconMap[status] || 'fas fa-question-circle';
		},

		// 获取状态文本
		getStatusText(status) {
			const textMap = {
				0: '正常',
				1: '禁用',
				2: '审核中',
				3: '审核拒绝'
			};
			return textMap[status] || '未知状态';
		},

		// 获取角色数组
		getRoleArray(role) {
			if (!role) return [];
			if (typeof role === 'string') {
				return role.split('、').filter((r) => r.trim());
			}
			return Array.isArray(role) ? role : [role];
		},

		// 状态筛选变化
		onStatusFilterChange() {
			let newWhere = this.getWhere();
			if (this.statusFilter !== '') {
				const statusCondition = { status: parseInt(this.statusFilter) };
				if (newWhere) {
					newWhere = db.command.and([newWhere, statusCondition]);
				} else {
					newWhere = statusCondition;
				}
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

		// 打开邮箱
		openEmail(email) {
			// #ifdef H5
			window.open(`mailto:${email}`);
			// #endif
			// #ifndef H5
			uni.showToast({
				title: '邮箱: ' + email,
				icon: 'none'
			});
			// #endif
		},

		// 全选/取消全选
		// toggleSelectAll(e) {
		// 	if (e.target.checked) {
		// 		this.selectedIndexs = Array.from({length: this.$refs.udb.dataList.length}, (_, i) => i)
		// 	} else {
		// 		this.selectedIndexs = []
		// 	}
		// },

		toggleSelectAll() {
			// 判断当前是否已全选
			const isAllSelected = this.selectedIndexs.length === this.$refs.udb.dataList.length && this.$refs.udb.dataList.length > 0;

			if (isAllSelected) {
				// 如果已全选，则清空
				this.selectedIndexs = [];
			} else {
				// 如果未全选，则全部选中
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
			for (let i = 0; i < data.length; i++) {
				let item = data[i];
				const roleArr = item.role && item.role.map((item) => item.role_name);
				item.role = roleArr ? roleArr.join('、') : '';
				const tagsArr = item.tags && item.tags.map((item) => this.tags[item]);
				item.tags = tagsArr;
				if (Array.isArray(item.dcloud_appid)) {
					item.dcloud_appid = item.dcloud_appid.join('、');
				}
				item.last_login_date = this.$formatDate(item.last_login_date);
			}
			this.exportExcelData = data;
		},

		changeSize(pageSize) {
			this.options.pageSize = pageSize;
			this.options.pageCurrent = 1;
			this.$nextTick(() => {
				this.loadData();
			});
		},

		openTagsPopup() {
			this.$refs.tagsPopup.open();
		},

		closeTagsPopup() {
			this.$refs.tagsPopup.close();
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
			let newWhere = this.getWhere();
			// 如果有状态筛选，添加状态条件
			if (this.statusFilter !== '') {
				const statusCondition = { status: parseInt(this.statusFilter) };
				if (newWhere) {
					newWhere = db.command.and([newWhere, statusCondition]);
				} else {
					newWhere = statusCondition;
				}
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
						this.loadTags();
						this.loadData(clear);
					}
				}
			});
		},

		// 获取选中的项目ID
		selectedItems() {
			let dataList = this.$refs.udb.dataList;
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
				},
				fail: (err) => {
					console.error('删除用户失败:', err);
					uni.showModal({
						content: err.message || '删除失败',
						showCancel: false
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

			// uni-sms-co
			if (Object.keys(this._filter).length) {
				this.smsCondition = this._filter;
			} else {
				this.smsCondition = {};
			}

			this.selectedIndexs = [];
			this.$nextTick(() => {
				this.$refs.udb.loadData();
			});
		},

		loadTags() {
			db.collection('uni-id-tag')
				.limit(500)
				.get()
				.then((res) => {
					res.result.data.map((item) => {
						this.$set(this.tags, item.tagid, item.name);
					});
				})
				.catch((err) => {
					uni.showModal({
						title: '提示',
						content: err.message,
						showCancel: false
					});
				});
		},

		managerMultiTag() {
			const ids = this.selectedItems();

			db.collection('uni-id-users')
				.where({
					_id: db.command.in(ids)
				})
				.update({
					tags: this.managerTags
				})
				.then(() => {
					uni.showToast({
						title: '修改标签成功',
						duration: 2000
					});
					this.selectedIndexs = [];
					this.managerTags = [];
					this.loadData();
					this.closeTagsPopup();
				})
				.catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					});
				})
				.finally((err) => {
					uni.hideLoading();
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
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
