<template>
	<view>
		<view class="bg-white shadow-sm mx-6 rounded-lg border border-gray-200">
			<view class="p-4">
				<view class="flex flex-wrap items-center justify-between gap-4">
					<view class="flex items-center space-x-3 flex-1 min-w-0">
						<view class="flex-1 max-w-md">
							<uni-easyinput
								v-model="searchQuery"
								placeholder="搜索商品标题、副标题或携程商品ID"
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
						<button class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base" @click="search">
							<i class="fas fa-search mr-2"></i>
							搜索
						</button>
					</view>

					<view class="flex items-center space-x-3">
						<button
							class="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base"
							@click="navigateToSync">
							<i class="fas fa-sync mr-2"></i>
							同步商品
						</button>

						<button
							class="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base disabled:opacity-50 disabled:cursor-not-allowed"
							:disabled="(!selectedRows || selectedRows.length === 0) && (!selectedIndexs || selectedIndexs.length === 0)"
							@click="delTable">
							<i class="fas fa-trash-alt mr-2"></i>
							批量删除 {{ getSelectedCount() > 0 ? `(${getSelectedCount()})` : '' }}
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

		<view class="mx-6 mt-6">
			<unicloud-db
				ref="udb"
				collection="a-products"
				field="_id,ctrip_id,title,subtitle,route_title,duration_days,price,child_price,product_images,status,created_at"
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
								<i class="fas fa-box-open text-indigo-600 text-lg mr-3"></i>
								<text class="text-lg font-semibold text-gray-900">小程序商品库</text>
							</view>
							<view class="text-sm text-gray-500">
								共找到
								<text class="font-semibold text-indigo-600 text-base">{{ pagination.count }}</text>
								个商品
							</view>
						</view>
					</view>

					<div class="p-2 overflow-x-auto">
						<el-table :data="data" style="width: 100%" v-loading="loading" element-loading-text="正在加载数据..." @selection-change="handleSelectionChange" row-key="_id">
							<el-table-column type="selection" width="40" :reserve-selection="true" />

							<el-table-column prop="ctrip_id" label="携程商品ID" width="120" show-overflow-tooltip>
								<template #default="scope">
									<div class="flex items-center">
										<el-text type="primary" class="cursor-pointer" @click="copyToClipboard(scope.row.ctrip_id)">
											{{ scope.row.ctrip_id || '-' }}
										</el-text>
										<i class="fas fa-copy text-gray-400 ml-2 cursor-pointer hover:text-blue-600 transition-colors" @click="copyToClipboard(scope.row.ctrip_id)"></i>
									</div>
								</template>
							</el-table-column>

							<el-table-column label="商品信息" min-width="200">
								<template #default="scope">
									<div>
										<div class="font-medium text-gray-900 line-clamp-2 mb-1">
											{{ scope.row.title || '未设置标题' }}
										</div>
										<div class="text-xs text-gray-500 line-clamp-2" v-if="scope.row.subtitle">
											{{ scope.row.subtitle }}
										</div>
										<div class="text-xs text-blue-600 line-clamp-1 mt-1" v-if="scope.row.route_title">
											<i class="fas fa-route mr-1" style="font-size: 11px"></i>
											{{ scope.row.route_title }}
										</div>
									</div>
								</template>
							</el-table-column>

							<el-table-column label="商品图片" width="100" align="center">
								<template #default="scope">
									<el-image
										v-if="scope.row.product_images && scope.row.product_images.length > 0"
										:src="getFirstImage(scope.row.product_images)"
										:preview-src-list="getImageList(scope.row.product_images)"
										fit="cover"
										class="w-16 h-16 rounded-lg"
										:initial-index="0"
										preview-teleported
										hide-on-click-modal />
								</template>
							</el-table-column>

							<el-table-column prop="price" label="成人价格" width="120" sortable>
								<template #default="scope">
									<el-text type="success" v-if="scope.row.price">¥{{ scope.row.price }}</el-text>
									<el-text type="info" v-else>-</el-text>
								</template>
							</el-table-column>

							<el-table-column prop="child_price" label="儿童价格" width="120" sortable>
								<template #default="scope">
									<el-text type="warning" v-if="scope.row.child_price">¥{{ scope.row.child_price }}</el-text>
									<el-text type="info" v-else>-</el-text>
								</template>
							</el-table-column>

							<el-table-column prop="duration_days" label="天数" width="100" sortable>
								<template #header>
									<div class="flex items-center">
										<span>天数</span>
										<el-popover placement="bottom" title="筛选天数" :width="200" trigger="click" v-model:visible="durationPopoverVisible">
											<template #reference>
												<el-button type="primary" link class="ml-1 !p-1" :class="durationFilter ? 'text-blue-500' : 'text-gray-400'" @click.stop title="筛选天数">
													<i class="fas fa-filter"></i>
												</el-button>
											</template>
											<template #default>
												<el-select
													v-if="durationPopoverVisible"
													v-model="durationFilter"
													placeholder="选择天数 (1-15)"
													clearable
													class="w-full"
													size="small"
													@change="onDurationChange">
													<el-option v-for="n in 15" :key="n" :label="`${n} 天`" :value="n" />
												</el-select>
											</template>
										</el-popover>
									</div>
								</template>
								<template #default="scope">
									<el-text v-if="scope.row.duration_days > 0">{{ scope.row.duration_days }} 天</el-text>
									<el-text type="info" v-else>-</el-text>
								</template>
							</el-table-column>

							<el-table-column prop="status" label="商品状态" width="120">
								<template #default="scope">
									<el-tag :type="getElementStatusType(scope.row.status)" effect="light" round>
										<i :class="getStatusIcon(scope.row.status)" class="mr-1"></i>
										{{ getStatusText(scope.row.status) }}
									</el-tag>
								</template>
							</el-table-column>

							<el-table-column label="操作" width="120" fixed="right" align="center">
								<template #default="scope">
									<div class="flex flex-col items-center justify-center gap-2 mb-1">
										<el-button type="primary" size="small" @click="navigateToDetail(scope.row._id)" class="w-full">
											<i class="fas fa-edit mr-1"></i>
											编辑
										</el-button>
										<el-button type="danger" size="small" @click="confirmDelete(scope.row._id)" class="w-full !ml-0">
											<i class="fas fa-trash mr-1"></i>
											删除
										</el-button>
									</div>
								</template>
							</el-table-column>
						</el-table>

						<el-empty v-if="!loading && !data.length" description="暂无商品数据">
							<el-button type="primary" @click="navigateToSync">
								<i class="fas fa-sync mr-2"></i>
								同步商品
							</el-button>
						</el-empty>
					</div>
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
	</view>
</template>

<script>
import { enumConverter, filterToWhere } from '../../../js_sdk/validator/a-products.js';

const db = uniCloud.database();
const dbOrderBy = 'created_at desc';
const dbSearchFields = ['title', 'subtitle', 'ctrip_id'];
const pageSize = 15;
const pageCurrent = 1;

const orderByMapping = {
	ascending: 'asc',
	descending: 'desc'
};

export default {
	data() {
		return {
			searchQuery: '',
			where: '',
			orderby: dbOrderBy,
			orderByFieldName: '',
			selectedIndexs: [],
			selectedRows: [],
			durationFilter: null,
			durationPopoverVisible: false,
			options: {
				pageSize,
				pageCurrent,
				filterData: {
					status_localdata: [
						{ value: 1, text: '已上架' },
						{ value: 2, text: '已下架' }
					]
				},
				...enumConverter
			},
			exportExcel: {
				filename: '商品数据导出.xls',
				type: 'xls',
				fields: {
					商品ID: '_id',
					携程商品ID: 'ctrip_id',
					商品标题: 'title',
					商品副标题: 'subtitle',
					成人价格: 'price',
					儿童价格: 'child_price',
					商品状态: 'status',
					创建时间: 'created_at'
				}
			},
			exportExcelData: []
		};
	},
	mounted() {
		this.buildWhereClause();
		// 组件挂载时自动加载数据
		this.$nextTick(() => {
			this.loadData();
		});
	},
	methods: {
		loadData(clear = true) {
			this.$refs.udb.loadData({
				clear,
				where: this.where
			});
		},

		// 跳转到编辑页
		navigateToDetail(id) {
			uni.navigateTo({
				url: `/pages/a-products-orders/edit?id=${id}&type=product`,
				events: {
					refreshData: () => {
						this.loadData(false);
					}
				}
			});
		},

		// 跳转到携程同步页面
		navigateToSync() {
			uni.navigateTo({
				url: '/pages/ctrip-sync/ctrip-sync'
			});
		},

		// 构建搜索条件
		buildWhereClause() {
			let textConditions = [];
			let durationCondition = '';
			const query = this.searchQuery.trim();

			if (query) {
				textConditions = dbSearchFields.map((field) => {
					return `/${query}/i.test(${field})`;
				});
			}

			if (this.durationFilter) {
				durationCondition = `duration_days == ${this.durationFilter}`;
			}

			if (textConditions.length > 0 && durationCondition) {
				this.where = `(${textConditions.join(' || ')}) && (${durationCondition})`;
			} else if (textConditions.length > 0) {
				this.where = textConditions.join(' || ');
			} else if (durationCondition) {
				this.where = durationCondition;
			} else {
				this.where = '';
			}
		},

		search() {
			this.buildWhereClause();
			this.selectedIndexs = [];
			this.selectedRows = [];
			this.$nextTick(() => {
				this.loadData(true);
			});
		},

		clearSearch() {
			this.searchQuery = '';
			this.buildWhereClause();
			this.selectedIndexs = [];
			this.selectedRows = [];
			this.$nextTick(() => {
				this.loadData(true);
			});
		},

		// 处理图片显示
		getFirstImage(images) {
			if (Array.isArray(images) && images.length > 0) return images[0];
			if (typeof images === 'string') {
				try {
					const parsed = JSON.parse(images);
					return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : images;
				} catch {
					return images;
				}
			}
			return '';
		},
		getImageList(images) {
			if (Array.isArray(images)) return images;
			if (typeof images === 'string') {
				try {
					return JSON.parse(images);
				} catch {
					return [images];
				}
			}
			return [];
		},

		// Element表格选择处理
		handleSelectionChange(selection) {
			this.selectedRows = selection;
			this.selectedIndexs = selection.map((row) => row._id);
		},

		getSelectedCount() {
			return this.selectedRows ? this.selectedRows.length : 0;
		},

		// 批量删除
		delTable() {
			if (this.selectedRows.length === 0) return;
			const ids = this.selectedRows.map((row) => row._id);
			this.$confirm('确定要删除选中的商品吗？', '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'warning'
			}).then(() => {
				this.$refs.udb.remove(ids, {
					success: (res) => {
						this.selectedRows = [];
						this.$message.success('删除成功');
					}
				});
			});
		},

		confirmDelete(id) {
			this.$confirm('确定要删除该商品吗？', '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'warning'
			}).then(() => {
				this.$refs.udb.remove(id, {
					success: (res) => {
						this.$message.success('删除成功');
					}
				});
			});
		},

		// 状态显示辅助函数
		getElementStatusType(status) {
			const typeMap = { 0: '', 1: 'success', 2: 'warning', 3: 'danger' };
			return typeMap[status] || '';
		},
		getStatusIcon(status) {
			const iconMap = { 0: 'fas fa-edit', 1: 'fas fa-check-circle', 2: 'fas fa-pause-circle', 3: 'fas fa-times-circle' };
			return iconMap[status] || 'fas fa-question-circle';
		},
		getStatusText(status) {
			const textMap = { 0: '草稿', 1: '已发布', 2: '已下架', 3: '已删除' };
			return textMap[status] || '未知';
		},

		onqueryload(data) {
			this.exportExcelData = data;
		},

		onPageChanged(e) {
			this.selectedRows = [];
			this.$refs.udb.loadData({
				current: e.current,
				where: this.where
			});
		},

		onDurationChange() {
			this.buildWhereClause();
			this.$nextTick(() => {
				this.loadData();
			});
			this.durationPopoverVisible = false;
		},

		copyToClipboard(text) {
			if (!text) return;
			uni.setClipboardData({
				data: text,
				success: () => {
					this.$message.success('已复制');
				}
			});
		}
	}
};
</script>

<style>
/* 样式复用 */
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
</style>
