<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<view class="uni-title">群相册管理</view>
			</view>
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入订单号或相册名称" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
				<button class="uni-button" type="primary" size="mini" @click="openCreateDialog">
					<uni-icons type="plusempty" size="14" color="#fff" style="margin-right: 2px"></uni-icons>
					创建相册
				</button>
			</view>
		</view>

		<view class="uni-container">
			<unicloud-db
				ref="udb"
				collection="a-group-albums"
				field="order_id, album_name, departure_date, total_days, status, members, create_date"
				:where="where"
				page-data="replace"
				:orderby="orderby"
				:getcount="true"
				:page-size="options.pageSize"
				:page-current="options.pageCurrent"
				v-slot:default="{ data, pagination, loading, error, options: dbOptions }"
				@load="onqueryload">
				<el-table
					ref="table"
					:data="data"
					style="width: 100%"
					v-loading="loading"
					element-loading-text="正在加载数据..."
					:empty-text="error ? error.message : '没有更多数据'"
					stripe>
					<el-table-column label="订单号" prop="order_id" align="center" />

					<el-table-column label="相册名称" prop="album_name" align="center" />

					<el-table-column label="出发日期" prop="departure_date" align="center" sortable>
						<template #default="scope">
							<uni-dateformat :date="scope.row.departure_date" format="yyyy-MM-dd" :threshold="[0, 0]" />
						</template>
					</el-table-column>

					<el-table-column label="总天数" prop="total_days" align="center" />

					<el-table-column label="状态" prop="status" align="center" sortable>
						<template #default="scope">
							{{ options.status_valuetotext[scope.row.status] }}
						</template>
					</el-table-column>

					<el-table-column label="操作" align="center" width="220">
						<template #default="scope">
							<view class="uni-group">
								<el-button size="small" type="primary" @click="navigateTo('/pages/a-group-albums/detail?id=' + scope.row._id, false)">
									<uni-icons type="eye" size="16" color="#fff" style="margin-right: 2px"></uni-icons>
									查看照片
								</el-button>
								<el-button size="small" type="danger" @click="confirmDelete(scope.row._id)">
									<uni-icons type="trash" size="16" color="#fff" style="margin-right: 2px"></uni-icons>
									删除相册
								</el-button>
							</view>
						</template>
					</el-table-column>
				</el-table>

				<view class="uni-pagination-box" v-if="pagination.count > 0">
					<uni-pagination show-icon :page-size="pagination.size" :current="pagination.current" :total="pagination.count" @change="onPageChanged" />
				</view>
			</unicloud-db>

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
import { enumConverter } from '@/js_sdk/validator/a-group-albums.js';
import { toRaw } from 'vue';

const albumService = uniCloud.importObject('album-service', {
	customUI: true
});
const db = uniCloud.database();
const dbOrderBy = 'create_date desc';
// 支持搜索的字段
const dbSearchFields = ['album_name', 'order_id'];
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
			where: 'status>-1', // 初始查询条件
			orderby: dbOrderBy,
			options: {
				pageSize: 20,
				pageCurrent: 1,
				filterData: {
					status_localdata: [
						{ value: 0, text: '待激活' },
						{ value: 1, text: '进行中' },
						{ value: 2, text: '已归档' }
					]
				},
				...enumConverter
			},
			dialogVisible: false,
			createForm: { ...defaultForm },
			formRules: {
				order_id: [{ required: true, message: '请选择一个关联订单号', trigger: 'change' }],
				// 保留这些规则，以确保用户确实选择了一个订单
				album_name: [{ required: true, message: '请选择订单以自动填充相册名称', trigger: 'blur' }],
				departure_date: [
					{
						required: true,
						message: '请选择出发日期',
						trigger: 'change'
					}
				],
				total_days: [{ required: true, message: '请选择订单以自动填充行程天数', trigger: 'blur' }]
			},
			orderList: [],
			orderLoading: false
		};
	},
	methods: {
		onqueryload(data, ended) {
			console.log('[群相册管理] 数据加载完成');
		},

		/**
		 * @description 生成 JQL where 查询条件
		 * 仅使用顶部的搜索框
		 */
		getWhere() {
			let where = 'status>-1'; // 基础查询条件

			// 处理顶部搜索框的条件
			const query = this.query.trim();
			if (query) {
				// 使用正则表达式进行模糊查询，'i' 表示不区分大小写
				const queryRe = new RegExp(query, 'i');
				// 构建 JQL 的 $or 查询
				const searchWhere = db.command.or(dbSearchFields.map((name) => ({ [name]: queryRe })));

				// 将搜索条件和基础条件合并
				where = db.command.and(searchWhere, { status: db.command.gt(-1) });
			}

			// console.log('Final where:', JSON.stringify(where));
			return where;
		},

		/**
		 * @description 触发搜索
		 */
		search() {
			this.options.pageCurrent = 1;
			const newWhere = this.getWhere();
			this.where = newWhere;

			// this.$nextTick(() => {
			// 	// 搜索时重置为第一页

			// 	this.$refs.udb.loadData({
			// 		clear: true
			// 	});
			// });
		},

		/**
		 * @description 分页切换
		 */
		onPageChanged(e) {
			// 更新当前页码
			this.options.pageCurrent = e.current;
			// 手动触发 unicloud-db 加载指定页的数据
			// this.$refs.udb.loadData({
			// 	current: e.current
			// });
		},

		navigateTo(url, clear) {
			uni.navigateTo({
				url,
				events: {
					refreshData: () => {
						this.$refs.udb.loadData({
							clear: !clear
						});
					}
				}
			});
		},

		/**
		 * @description 删除相册
		 */
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
						this.$refs.udb.loadData({
							clear: true
						});
					} else {
						throw new Error(res.result.errMsg || '删除失败');
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
			// 当下拉框展开，并且列表为空，并且不在加载中时
			if (isVisible && this.orderList.length === 0 && !this.orderLoading) {
				console.log('下拉框展开，加载初始列表...');
				// 调用 searchOrders 传入空字符串，加载初始列表
				this.searchOrders('');
			}
		},

		async searchOrders(query) {
			console.log('[创建相册] 正在搜索订单号：', query);
			this.orderLoading = true;
			try {
				const res = await albumService.searchAvailableOrders(query);
				if (res.errCode === 0) {
					this.orderList = res.data;
				} else {
					this.orderList = [];
					console.error(res.errMsg);
				}
			} catch (e) {
				console.error(e);
				this.orderList = [];
			} finally {
				this.orderLoading = false;
			}
		},

		onOrderSelect(selectedOrderId) {
			const selectedOrder = this.orderList.find((item) => item.value === selectedOrderId);
			if (selectedOrder) {
				this.createForm.album_name = selectedOrder.label;
				if (selectedOrder.departure_date) {
					this.createForm.departure_date = new Date(selectedOrder.departure_date);
				} else {
					this.createForm.departure_date = null;
				}
				this.createForm.total_days = selectedOrder.total_days || 1;
				console.log('this.createForm', toRaw(this.createForm));

				if (this.$refs.createForm) {
					this.$refs.createForm.clearValidate(['departure_date', 'album_name', 'total_days']);
				}
			}
		},

		/**
		 * @description 提交创建表单 (已修改)
		 */
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
							this.$refs.udb.loadData({
								clear: true
							});
						} else {
							uni.showModal({ content: res.errMsg, showCancel: false });
						}
					} catch (e) {
						uni.hideLoading();
						uni.showModal({ content: e.message || '创建失败', showCancel: false });
					}
				} else {
					// 验证失败，提示用户选择订单
					uni.showToast({ title: '请先选择一个订单', icon: 'none' });
					return false;
				}
			});
		}
	}
};
</script>

<style>
/* 可以在这里保留或添加 uni-admin 的样式 */
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
	font-size: 13px; /* 稍微缩小字体以容纳更多内容 */
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
