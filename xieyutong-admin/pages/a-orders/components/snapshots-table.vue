<template>
	<view>
		<view class="bg-white shadow-sm mx-6 rounded-lg border border-gray-200">
			<view class="p-4">
				<view class="flex flex-wrap items-center justify-between gap-4">
					<view class="flex items-center space-x-3 flex-1 min-w-0">
						<view class="flex-1 max-w-md">
							<uni-easyinput
								v-model="query"
								placeholder="搜索订单ID、标题或副标题"
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
						<button
							class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base"
							@click="search">
							<i class="fas fa-search mr-2"></i>
							搜索
						</button>
					</view>
				</view>
			</view>
		</view>

		<view class="mx-6 my-6">
			<unicloud-db
				ref="udb"
				:collection="collectionList"
				field="_id,order_id,title,sub_title,departure_date,total_days,created_at,travel_users,staves"
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
								<i class="fas fa-camera text-emerald-600 text-lg mr-3"></i>
								<text class="text-lg font-semibold text-gray-900">订单快照列表</text>
							</view>
							<view class="text-sm text-gray-500">
								共找到
								<text class="font-semibold text-emerald-600 text-base">{{ pagination.count }}</text>
								个快照
							</view>
						</view>
					</view>

					<view class="overflow-hidden">
						<view class="overflow-x-auto">
							<table class="w-full">
								<thead class="bg-gray-50 border-b border-gray-200">
									<tr>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-48">
											订单ID
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'order_id')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-40">出行用户</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-40">服务人员</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-80">商品信息</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-32">
											出发日期
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'departure_date')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-24">
											总天数
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'total_days')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-30">
											创建时间
											<i class="fas fa-sort text-gray-400 ml-1 cursor-pointer" @click="sortChange({ order: 'ascending' }, 'created_at')"></i>
										</th>
										<th class="px-4 py-4 text-center text-sm font-semibold text-gray-900 w-50">操作</th>
									</tr>
								</thead>

								<tbody class="bg-white divide-y divide-gray-200">
									<tr v-if="loading">
										<td colspan="8" class="p-8 text-center">
											<view class="flex items-center justify-center">
												<i class="fas fa-spinner fa-spin text-emerald-600 text-xl mr-3"></i>
												<text class="text-gray-600 text-base">正在加载快照数据...</text>
											</view>
										</td>
									</tr>

									<tr v-else-if="!data.length">
										<td colspan="8" class="p-12 text-center">
											<view class="flex flex-col items-center">
												<i class="fas fa-camera-retro text-gray-400 text-4xl mb-4"></i>
												<text class="text-gray-500 text-lg">{{ error.message || '暂无快照数据' }}</text>
											</view>
										</td>
									</tr>

									<tr v-else v-for="(item, index) in data" :key="index" class="hover:bg-gray-50 transition-colors duration-150">
										<td class="px-4 py-4">
											<view class="flex items-center">
												<text
													class="text-sm font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 transition-colors"
													@click="copyToClipboard(item.order_id)">
													{{ item.order_id || '-' }}
												</text>
												<i class="fas fa-copy text-gray-400 ml-2 cursor-pointer hover:text-emerald-600 transition-colors" @click="copyToClipboard(item.order_id)"></i>
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
											<view class="max-w-md">
												<text class="text-sm font-medium text-gray-900 line-clamp-2 leading-5">
													{{ item.title || '无标题' }}
												</text>
												<text class="text-xs text-gray-500 mt-1 line-clamp-2">
													{{ item.sub_title || '' }}
												</text>
											</view>
										</td>

										<td class="px-4 py-4">
											<view class="text-sm text-gray-700">
												<uni-dateformat :threshold="[0, 0]" :date="item.departure_date" format="yyyy-MM-dd"></uni-dateformat>
											</view>
										</td>

										<td class="px-4 py-4">
											<view class="flex items-center">
												<i class="fas fa-calendar-alt text-orange-400 mr-1.5"></i>
												<text class="text-sm text-orange-600 font-medium">{{ item.total_days || '?' }}天</text>
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
							<text class="text-xl font-bold text-gray-900">编辑商品快照</text>
						</view>
						<view class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer" @click="closeEditDialog">
							<i class="fas fa-times text-gray-500"></i>
						</view>
					</view>
				</view>

				<scroll-view scroll-y style="max-height: 70vh">
					<view class="p-6">
						<uni-forms v-if="currentEditId" ref="editForm" :modelValue="formData" :rules="formRules" validate-trigger="bind" label-width="100" label-align="right">
							<uni-forms-item name="title" label="标题" required>
								<uni-easyinput v-model="formData.title" type="textarea" autoHeight placeholder="请输入商品标题" />
							</uni-forms-item>

							<uni-forms-item name="sub_title" label="副标题">
								<uni-easyinput v-model="formData.sub_title" type="textarea" autoHeight placeholder="请输入商品副标题" />
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

							<uni-forms-item name="total_days" label="总天数">
								<uni-number-box v-model="formData.total_days" :min="0" />
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
import { toRaw } from 'vue';
const db = uniCloud.database();
const dbOrderBy = 'created_at desc';
const dbSearchFields = ['order_id', 'title', 'sub_title']; // 模糊搜索字段
const pageSize = 15;
const pageCurrent = 1;
const orderService = uniCloud.importObject('a-order-service');

const orderByMapping = {
	ascending: 'asc',
	descending: 'desc'
};

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export default {
	data() {
		return {
			collectionList: 'a-snapshots',
			query: '',
			where: '',
			orderby: dbOrderBy,
			orderByFieldName: '',
			selectedIndexs: [],
			options: {
				pageSize,
				pageCurrent
			},

			// ============================
			// 编辑弹窗的状态
			// ============================
			currentEditId: null, // 当前正在编辑的项的 _id
			// formData 存储将要提交到数据库的完整数据
			formData: {
				order_id: '',
				title: '',
				sub_title: '',
				travel_users: [], // 数据库存储格式: [{id, mobile}, ...]
				staves: [],
				departure_date: null,
				total_days: 0
			},

			// 用于 "添加用户" 搜索框的 v-model
			travelerSearchInput: '',
			travelerCandidates: [],
			searchTimer: null,

			// 服务人员的状态
			staffSearchInput: '',
			staffCandidates: [],
			staffSearchTimer: null,

			dialogReady: false,
			formRules: {
				title: {
					rules: [
						{
							required: true,
							errorMessage: '标题不能为空'
						}
					]
				}
			},

			qrCodeBase64: '',
			qrLoading: false,
			currentQrFileName: 'invite_code.png'
		};
	},
	mounted() {
		this.$refs.udb.loadData();
	},
	methods: {
		// 跳转到携程同步页面
		// navigateToSync() {
		// 	uni.navigateTo({
		// 		url: '/pages/snapshot-sync/snapshot-sync',
		// 		success: () => {
		// 			console.log('跳转到快照同步页面成功');
		// 		},
		// 		fail: (error) => {
		// 			console.error('跳转失败:', error);
		// 			this.$message.error('页面跳转失败，请检查页面路径是否正确');
		// 		}
		// 	});
		// },

		// 复制到剪贴板
		copyToClipboard(text) {
			if (!text) return;
			// #ifdef H5
			if (navigator.clipboard) {
				navigator.clipboard.writeText(text).then(() => {
					uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
				});
			} else {
				this.fallbackCopyToClipboard(text);
			}
			// #endif
			// #ifndef H5
			uni.setClipboardData({
				data: text,
				success: () => {
					uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
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
				uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
			} catch (err) {
				uni.showToast({ title: '复制失败', icon: 'none' });
			}
			document.body.removeChild(textArea);
		},

		onqueryload(data) {
			// 快照列表目前不需要导出，此函数留空或移除
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
			this.where = this.getWhere();
			this.$nextTick(() => {
				this.loadData();
			});
		},

		clearSearch() {
			this.query = '';
			this.where = '';
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
			this.$refs.udb.loadData({
				current: e.current
			});
		},

		confirmDelete(id) {
			this.$refs.udb.remove(id, {
				success: (res) => {
					uni.showToast({ title: '删除成功', icon: 'success' });
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
			this.$nextTick(() => {
				this.$refs.udb.loadData();
			});
		},

		// =============================================
		// 编辑弹窗相关方法
		// =============================================

		/**
		 * 1. 打开弹窗
		 */
		openEditDialog(item) {
			console.log('openEditDialog');
			this.dialogReady = false;
			this.currentEditId = item._id;

			// 填充表单
			this.formData.order_id = item.order_id;
			this.formData.title = item.title;
			this.formData.sub_title = item.sub_title;
			this.formData.departure_date = item.departure_date;
			this.formData.total_days = item.total_days;
			// 深拷贝 travel_users 数组，防止修改影响列表
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

		/**
		 * 2. 关闭弹窗并重置状态
		 */
		closeEditDialog() {
			console.log('closeEditDialog');
			this.$refs.editPopup.close();
			// this.dialogReady = false;
			this.currentEditId = null;
			this.travelerSearchInput = '';
			this.travelerCandidates = [];
			if (this.searchTimer) clearTimeout(this.searchTimer);
			this.staffSearchInput = '';
			this.staffCandidates = [];
			if (this.staffSearchTimer) clearTimeout(this.staffSearchTimer);

			this.formData = {
				order_id: '',
				title: '',
				sub_title: '',
				travel_users: [],
				staves: [],
				departure_date: null,
				total_days: 0
			};
			// 清除表单验证状态
			if (this.$refs.editForm) {
				this.$refs.editForm.clearValidate();
			}
		},

		/**
		 * 3. 提交按钮点击 (表单验证)
		 */
		submitEditForm() {
			this.$refs.editForm
				.validate()
				.then((res) => {
					// 验证通过，直接保存
					// formData.travel_users 已经是我们需要的 [{id, mobile}, ...] 格式
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

		/**
		 * 4. 最终保存
		 */
		async saveData(value) {
			// value 就是 this.formData
			uni.showLoading({
				title: '正在保存...',
				mask: true
			});

			// 2. 准备数据
			const orderId = value.order_id; // 从 formData 获取 order_id
			const newTravelUsers = value.travel_users || [];

			try {
				// 3. 定义并行任务
				// 任务 A: 更新快照
				const updateSnapshotPromise = db
					.collection('a-snapshots')
					.doc(this.currentEditId) //
					.update(value); // (value 就是完整的 formData)

				// 任务 B: 查找对应的相册 (获取 _id 和 members)
				const findAlbumPromise = db
					.collection('a-group-albums')
					.where({
						order_id: orderId // 使用快照的 order_id 查找
					})
					.field('_id, members') // 获取 _id (用于更新) 和 members (用于合并)
					.get();

				// 4. 并行执行
				const [snapshotRes, albumFindRes] = await Promise.all([updateSnapshotPromise, findAlbumPromise]);

				console.log('快照更新结果:', snapshotRes);
				console.log('相册查找结果:', albumFindRes);

				// 5. 开始处理相册 (合并与更新)
				if (albumFindRes.result && albumFindRes.result.data && albumFindRes.result.data.length > 0) {
					// 5.1 找到了相册
					const album = albumFindRes.result.data[0];
					const albumId = album._id;
					const existingMembers = album.members || []; // 从数据库读出的旧成员

					// 5.2 --- 开始合并 (使用 Map 保证 ID 唯一) ---
					const memberMap = new Map();

					// 1. 先把所有旧成员放入 Map
					for (const member of existingMembers) {
						if (member && member.id) {
							memberMap.set(member.id, member);
						}
					}

					// 2. 再把表单里的新成员放入 Map (如果 ID 相同，会覆盖旧的)
					for (const member of newTravelUsers) {
						//
						if (member && member.id) {
							//
							memberMap.set(member.id, member);
						}
					}

					// 3. 从 Map 中提取合并后的数组
					const mergedMembers = Array.from(memberMap.values());
					// --- 合并结束 ---

					console.log(`正在更新相册 ${albumId}，合并后成员数: ${mergedMembers.length}`);

					// 5.3 用合并后的新数组，通过 .doc() 更新相册 (覆盖)
					await db.collection('a-group-albums').doc(albumId).update({
						members: mergedMembers // 用合并后的完整数组覆盖
					});

					uni.showToast({ title: '修改成功', icon: 'success' }); //
				} else {
					// 快照更新成功了，但没找到匹配的相册
					console.warn(`未找到 order_id 为 ${orderId} 的相册，成员未添加。`);
					uni.showToast({ title: '快照保存成功，但未找到匹配相册', icon: 'none', duration: 3000 });
				}

				// 6. 最终收尾
				uni.hideLoading();
				this.closeEditDialog(); //
				this.loadData(); //
			} catch (err) {
				// 7. 统一错误处理
				uni.hideLoading();
				uni.showModal({
					title: '保存失败', //
					content: `发生错误: ${err.message || '请求服务失败'}`,
					showCancel: false
				});
			}
		},

		onPopupStateChange(e) {
			if (e.show) {
				// 弹窗已打开，组件已渲染
				this.dialogReady = true; // 解锁
			} else {
				// 弹窗已关闭
				this.dialogReady = false; // 确保关闭时上锁
			}
		},

		/**
		 * 5. 进入搜索框时默认加载前30条用户数据
		 */
		async loadDefaultTravelers() {
			// 如果输入框非空 (意味着正在搜索)，则不加载默认
			if (this.travelerSearchInput) {
				return;
			}

			// 如果防抖计时器在跑，清除它
			if (this.searchTimer) {
				clearTimeout(this.searchTimer);
			}

			try {
				// 加载前30个有手机号的用户
				const res = await db
					.collection('uni-id-users')
					.where('mobile != null') // 确保只显示有手机号的
					.field('_id, mobile')
					.limit(30)
					.orderBy('register_date', 'desc') // 按注册日期倒序
					.get();

				if (res.result.data) {
					this.travelerCandidates = res.result.data;
					console.log('loadDefaultTravelers travelerCandidates: ', toRaw(this.travelerCandidates));
				}
			} catch (err) {
				console.error('loadDefaultTravelers error:', err);
			}
		},

		/**
		 * 6. 搜索框输入时触发 (带防抖)
		 */
		searchTravelers(query) {
			this.travelerSearchInput = query;

			console.log('searchTravelers query: ', query);
			if (this.searchTimer) {
				clearTimeout(this.searchTimer);
			}

			// 如果清空了输入框，也清空建议
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
						console.log('searchTravelers travelerCandidates: ', toRaw(this.travelerCandidates));
					}
				} catch (err) {
					console.error('searchTravelers error:', err);
				}
			}, 300);
		},

		/**
		 * 7. (新增) 当用户从建议列表中选择一项时
		 */
		onTravelerSelect(selectedUserId) {
			// 参数名已更改
			if (!selectedUserId || !this.dialogReady) return;

			// 从 candidates 列表中查找完整的 user 对象
			const selectedUser = this.travelerCandidates.find((user) => user._id === selectedUserId);

			if (!selectedUser) {
				uni.showToast({ title: '未找到用户信息', icon: 'none' });
				this.resetCombox();
				return;
			}

			// 1. 检查是否已在列表中
			const isDuplicate = this.formData.travel_users.some((user) => user.id === selectedUserId);
			if (isDuplicate) {
				uni.showToast({ title: '用户已在列表中', icon: 'none' });
				this.resetCombox();
				return;
			}

			// 2. 添加用户 (使用强制刷新)
			const newTravelersArray = [
				...this.formData.travel_users,
				{
					id: selectedUserId,
					mobile: selectedUser.mobile // 从查找到的对象中获取 mobile
				}
			];

			this.formData = {
				...this.formData,
				travel_users: newTravelersArray
			};

			// 3. 清空 combox
			this.resetCombox();
		},

		/**
		 * 8. 重置 combox 状态
		 */
		resetCombox() {
			console.log('resetCombox');
			this.$nextTick(() => {
				this.travelerSearchInput = '';
				this.travelerCandidates = [];
			});
		},

		/**
		 * 9. 点击移除按钮
		 */
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
			this.currentQrFileName = `${item.order_id || 'invite_code'}.png`;
			this.$refs.qrPopup.open();

			try {
				const idToPass = item.order_id;

				const res = await orderService.getInviteQRCode(idToPass);

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
.uni-data-select {
	width: 100%;
}
.uni-forms-item {
	margin-bottom: 20px;
}
</style>
