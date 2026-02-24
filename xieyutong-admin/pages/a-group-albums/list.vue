<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<view class="uni-title">群相册管理</view>
			</view>
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @input="handleSearchInput" placeholder="输入订单号、相册名或私导姓名" />

				<!-- <view style="margin-left: 10px">
					<uni-datetime-picker type="month" return-type="string" v-model="filterMonth" @change="handleFilterChange" :clear-icon="true" />
				</view> -->

				<button class="uni-button" type="default" size="mini" @click="resetFilters">重置</button>
				<button class="uni-button" type="primary" size="mini" @click="openCreateDialog">创建相册</button>
			</view>
		</view>

		<view class="uni-container">
			<el-table :data="tableData" style="width: 100%" v-loading="loading" stripe border>
				<el-table-column label="出发日期" width="120" align="center" prop="departure_date">
					<template #default="scope">
						<uni-dateformat :date="scope.row.departure_date" format="yyyy-MM-dd" />
					</template>
				</el-table-column>

				<el-table-column label="状态" width="100" align="center">
					<template #default="scope">
						<el-tag :type="getStatusTag(scope.row)">{{ getStatusText(scope.row) }}</el-tag>
					</template>
				</el-table-column>

				<el-table-column label="订单号" prop="order_id" align="center" width="180" />
				<el-table-column label="相册名称" prop="album_name" align="center" min-width="200" />

				<el-table-column label="私导" align="center" width="150">
					<template #default="scope">
						<view v-if="scope.row.guideInfo">
							<view>{{ scope.row.guideInfo.real_name }}</view>
							<view style="font-size: 12px; color: #999">{{ scope.row.guideInfo.mobile }}</view>
						</view>
						<view v-else style="color: #ccc">-</view>
					</template>
				</el-table-column>

				<el-table-column label="行程天数" prop="total_days" align="center" width="80" />

				<el-table-column label="操作" align="center" width="180">
					<template #default="scope">
						<el-button size="small" type="primary" @click="navigateToDetail(scope.row._id)">管理</el-button>
						<el-button size="small" type="danger" @click="confirmDelete(scope.row._id)">删除</el-button>
					</template>
				</el-table-column>
			</el-table>

			<view class="uni-pagination-box">
				<uni-pagination show-icon :page-size="pagination.pageSize" :current="pagination.current" :total="pagination.total" @change="onPageChanged" />
			</view>

			<el-dialog title="创建新相册" v-model="dialogVisible" width="500px" @close="closeCreateDialog">
				<el-form ref="createForm" :model="createForm" :rules="formRules" label-width="100px">
					<el-form-item label="关联订单号" prop="order_id">
						<el-select
							v-model="createForm.order_id"
							placeholder="请输入订单号搜索"
							filterable
							remote
							:remote-method="searchOrders"
							:loading="orderLoading"
							@change="onOrderSelect"
							@visible-change="handleOrderVisibleChange"
							style="width: 100%">
							<el-option v-for="item in orderList" :key="item.value" :label="item.value" :value="item.value">
								<span class="option-line">
									<span class="option-date-days">
										<uni-dateformat :date="item.departure_date" format="yyyy-MM-dd" />
										({{ item.total_days }}天)
									</span>

									<span class="option-separator">-</span>
									<span class="option-order-name" :title="item.label">{{ item.value }} ({{ item.label }})</span>
								</span>
							</el-option>
						</el-select>
					</el-form-item>

					<el-form-item label="相册名称" prop="album_name">
						<el-input v-model="createForm.album_name" placeholder="选择订单自动填充" disabled />
					</el-form-item>

					<el-form-item label="出发日期" prop="departure_date">
						<el-date-picker v-model="createForm.departure_date" type="date" placeholder="选择订单自动填充" style="width: 100%" disabled />
					</el-form-item>

					<el-form-item label="行程天数" prop="total_days">
						<el-input-number v-model="createForm.total_days" :min="1" :max="99" disabled />
					</el-form-item>
				</el-form>
				<template #footer>
					<span class="dialog-footer">
						<el-button @click="closeCreateDialog">取 消</el-button>
						<el-button type="primary" @click="handleCreateAlbum">确 定</el-button>
					</span>
				</template>
			</el-dialog>
		</view>
	</view>
</template>

<script>
// 这里不需要引入 enumConverter 了，因为我们手动处理数据
import { toRaw } from 'vue';

const albumService = uniCloud.importObject('album-service', {
	customUI: true
});

const defaultForm = {
	order_id: '',
	album_name: '',
	departure_date: null,
	total_days: 1
};

export default {
	data() {
		return {
			query: '',
			searchTimer: null,
			filterMonth: '',
			filterStatus: '',

			// 表格数据
			tableData: [],
			loading: false, // 控制表格加载状态

			// 分页配置
			pagination: {
				current: 1,
				pageSize: 20,
				total: 0
			},

			statusOptions: [
				{ value: 'active', text: '进行中' },
				{ value: 'completed', text: '已完成' },
				{ value: 'pending', text: '待出发' }
			],

			dialogVisible: false,
			createForm: { ...defaultForm },
			formRules: {
				order_id: [{ required: true, message: '请选择一个关联订单号', trigger: 'change' }],
				album_name: [{ required: true, message: '请选择订单以自动填充相册名称', trigger: 'blur' }],
				departure_date: [{ required: true, message: '请选择出发日期', trigger: 'change' }],
				total_days: [{ required: true, message: '请选择订单以自动填充行程天数', trigger: 'blur' }]
			},
			orderList: [],
			orderLoading: false,
			orderLoading: false
		};
	},
	mounted() {
		this.loadData();
	},
	methods: {
		// --- 核心方法：加载数据 ---
		async loadData(resetPage = false) {
			if (resetPage) {
				this.pagination.current = 1;
			}
			this.loading = true;
			try {
				const res = await albumService.getAdminAlbumList({
					page: this.pagination.current,
					pageSize: this.pagination.pageSize,
					query: this.query,
					filterMonth: this.filterMonth,
					filterStatus: this.filterStatus
				});

				if (res.errCode === 0) {
					this.tableData = res.data.list;
					this.pagination.total = res.data.total;
				} else {
					uni.showToast({ title: res.errMsg || '加载失败', icon: 'none' });
				}
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '加载异常', icon: 'none' });
			} finally {
				this.loading = false;
			}
		},

		// 处理分页变化
		onPageChanged(e) {
			this.pagination.current = e.current;
			this.loadData();
		},

		// 处理搜索（防抖）
		handleSearchInput() {
			if (this.searchTimer) clearTimeout(this.searchTimer);
			this.searchTimer = setTimeout(() => {
				this.loadData(true); // 搜索时重置回第一页
			}, 500);
		},

		// 处理月份变化
		handleFilterChange() {
			this.loadData(true);
		},

		// 重置
		resetFilters() {
			this.query = '';
			this.filterMonth = '';
			this.filterStatus = '';
			this.loadData(true);
		},

		// 动态计算状态文本 (保持不变)
		getStatusText(row) {
			const now = Date.now();
			const start = row.departure_date;
			const end = start + (row.total_days || 1) * 24 * 3600 * 1000;

			if (now < start) return '待出发';
			if (now >= start && now <= end) return '进行中';
			return '已完成';
		},
		getStatusTag(row) {
			const text = this.getStatusText(row);
			if (text === '待出发') return 'info';
			if (text === '进行中') return 'success';
			return 'warning';
		},

		navigateToDetail(id) {
			uni.navigateTo({ url: `/pages/a-group-albums/detail?id=${id}` });
		},

		async confirmDelete(id) {
			const modalRes = await uni.showModal({
				title: '确认删除',
				content: '确定要删除此记录吗？',
				confirmColor: '#f56c6c'
			});

			if (modalRes.confirm) {
				uni.showLoading({ title: '删除中...' });
				try {
					const res = await albumService.deleteAlbum(id);
					if (res.errCode === 0) {
						uni.showToast({ title: '删除成功', icon: 'success' });
						this.loadData(); // 重新加载
					} else {
						throw new Error(res.errMsg || '删除失败');
					}
				} catch (err) {
					uni.showModal({ content: err.message || '请求服务失败', showCancel: false });
				} finally {
					uni.hideLoading();
				}
			}
		},

		openCreateDialog() {
			this.dialogVisible = true;
		},

		closeCreateDialog() {
			this.dialogVisible = false;
			this.$refs.createForm.resetFields();
			this.createForm = { ...defaultForm };
			this.orderList = [];
		},

		handleOrderVisibleChange(isVisible) {
			if (isVisible && this.orderList.length === 0 && !this.orderLoading) {
				this.searchOrders('');
			}
		},

		async searchOrders(query) {
			this.orderLoading = true;
			try {
				const res = await albumService.searchAvailableOrders(query);
				if (res.errCode === 0) {
					this.orderList = res.data;
				} else {
					this.orderList = [];
				}
			} catch (e) {
				this.orderList = [];
			} finally {
				this.orderLoading = false;
			}
		},

		onOrderSelect(selectedOrderId) {
			const selectedOrder = this.orderList.find((item) => item.value === selectedOrderId);
			if (selectedOrder) {
				this.createForm.album_name = selectedOrder.label;
				this.createForm.departure_date = selectedOrder.departure_date ? new Date(selectedOrder.departure_date) : null;
				this.createForm.total_days = selectedOrder.total_days || 1;
			}
		},

		handleCreateAlbum() {
			this.$refs.createForm.validate(async (valid) => {
				if (valid) {
					uni.showLoading({ title: '创建中...' });
					try {
						const res = await albumService.createAlbum(this.createForm.order_id);
						uni.hideLoading();
						if (res.errCode === 0) {
							uni.showToast({ title: '创建成功', icon: 'success' });
							this.closeCreateDialog();
							this.loadData(true); // 创建后刷新
						} else {
							uni.showModal({ content: res.errMsg, showCancel: false });
						}
					} catch (e) {
						uni.hideLoading();
						uni.showModal({ content: e.message || '创建失败', showCancel: false });
					}
				}
			});
		}
	}
};
</script>

<style>
/* 样式保持不变 */
.uni-header {
	display: flex;
	justify-content: space-between;
	padding: 10px 15px;
	border-bottom: 1px solid #eee;
}
.uni-group {
	display: flex;
	align-items: center;
	flex-wrap: nowrap;
}
.uni-group > * {
	margin-left: 10px;
}
.uni-search {
	flex: 1;
	height: 35px;
	line-height: 35px;
	font-size: 14px;
	padding: 0 10px;
	border: 1px solid #dcdfe6;
	border-radius: 4px;
	background: #fff;
}
.uni-title {
	font-size: 16px;
	font-weight: bold;
}
.uni-container {
	padding: 15px;
}
.uni-pagination-box {
	margin-top: 15px;
	display: flex;
	justify-content: flex-end;
}

.el-table .uni-group {
	justify-content: center;
}
.el-table .uni-group .el-button {
	margin-left: 10px;
}
.el-table .uni-group .el-button:first-child {
	margin-left: 0;
}

.option-line {
	display: flex;
	align-items: center;
	width: 100%;
	font-size: 13px;
}

.option-date-days {
	flex-shrink: 0;
	color: #606266;
}

.option-separator {
	margin: 0 8px;
	color: #909399;
}

.option-order-name {
	flex-grow: 1;
	color: #303133;
	font-weight: 500;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
</style>
