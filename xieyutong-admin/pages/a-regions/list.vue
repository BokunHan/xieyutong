<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<view class="uni-title"></view>
				<view class="uni-sub-title"></view>
			</view>
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
				<button class="uni-button" type="default" size="mini" @click="navigateTo('./add')">新增</button>
				<button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length" @click="delTable">批量删除</button>
				<download-excel class="hide-on-phone" :fields="exportExcel.fields" :data="exportExcelData" :type="exportExcel.type" :name="exportExcel.filename">
					<button class="uni-button" type="primary" size="mini">导出 Excel</button>
				</download-excel>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db
				ref="udb"
				:collection="collectionList"
				field="name,slug,parent_id,cover_image,description,order,status"
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
				<uni-table ref="table" :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection" @selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'name')" sortable @sort-change="sortChange($event, 'name')">区域名称</uni-th>
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'slug')" sortable @sort-change="sortChange($event, 'slug')">唯一标识</uni-th>
						<uni-th align="center" sortable @sort-change="sortChange($event, 'parent_id')">父级区域</uni-th>
						<uni-th align="center" sortable @sort-change="sortChange($event, 'cover_image')">区域封面图</uni-th>
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'description')" sortable @sort-change="sortChange($event, 'description')">
							区域简介
						</uni-th>
						<uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'order')" sortable @sort-change="sortChange($event, 'order')">排序权重</uni-th>
						<uni-th align="center" sortable @sort-change="sortChange($event, 'status')">启用状态</uni-th>
						<uni-th align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item, index) in data" :key="index">
						<uni-td align="center">{{ item.name }}</uni-td>
						<uni-td align="center">{{ item.slug }}</uni-td>
						<uni-td align="center">{{ item.parent_id }}</uni-td>
						<uni-td align="center">
							<uni-file-picker
								v-if="item.cover_image && item.cover_image.fileType == 'image'"
								:value="item.cover_image"
								:file-mediatype="item.cover_image && item.cover_image.fileType"
								return-type="object"
								:imageStyles="imageStyles"
								readonly></uni-file-picker>
							<uni-link v-else :href="item.cover_image && item.cover_image.url" :text="item.cover_image && item.cover_image.url"></uni-link>
						</uni-td>
						<uni-td align="center">{{ item.description }}</uni-td>
						<uni-td align="center">{{ item.order }}</uni-td>
						<uni-td align="center">{{ item.status == true ? '✅' : '❌' }}</uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button @click="navigateTo('./edit?id=' + item._id, false)" class="uni-button" size="mini" type="primary">修改</button>
								<button
									@click="navigateTo('../a-region-content/list?region_id=' + item._id + '&region_name=' + item.name, false)"
									class="uni-button green-button"
									size="mini"
									type="default">
									提示管理
								</button>
								<button @click="confirmDelete(item._id)" class="uni-button" size="mini" type="warn">删除</button>
							</view>
						</uni-td>
					</uni-tr>
				</uni-table>
				<view class="uni-pagination-box">
					<uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current" :total="pagination.count" @change="onPageChanged" />
				</view>
			</unicloud-db>
		</view>
	</view>
</template>

<script>
import { enumConverter, filterToWhere } from '../../js_sdk/validator/a-regions.js';

const db = uniCloud.database();
// 表查询配置
const dbOrderBy = ''; // 排序字段
const dbSearchFields = []; // 模糊搜索字段，支持模糊搜索的字段列表。联表查询格式: 主表字段名.副表字段名，例如用户表关联角色表 role.role_name
// 分页配置
const pageSize = 20;
const pageCurrent = 1;

const orderByMapping = {
	ascending: 'asc',
	descending: 'desc'
};

export default {
	data() {
		return {
			collectionList: 'a-regions',
			query: '',
			where: '',
			orderby: dbOrderBy,
			orderByFieldName: '',
			selectedIndexs: [],
			options: {
				pageSize,
				pageCurrent,
				filterData: {},
				...enumConverter
			},
			imageStyles: {
				width: 64,
				height: 64
			},
			exportExcel: {
				filename: 'a-regions.xls',
				type: 'xls',
				fields: {
					区域名称: 'name',
					唯一标识: 'slug',
					父级区域: 'parent_id',
					区域封面图: 'cover_image',
					区域简介: 'description',
					排序权重: 'order',
					启用状态: 'status'
				}
			},
			exportExcelData: []
		};
	},
	onLoad() {
		this._filter = {};
	},
	onReady() {
		this.$refs.udb.loadData();
	},
	methods: {
		onqueryload(data) {
			this.exportExcelData = data;
		},
		getWhere() {
			const query = this.query.trim();
			if (!query) {
				return '';
			}
			const queryRe = new RegExp(query, 'i');
			return dbSearchFields.map((name) => queryRe + '.test(' + name + ')').join(' || ');
		},
		search() {
			const newWhere = this.getWhere();
			this.where = newWhere;
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
			this.selectedIndexs.length = 0;
			this.$refs.table.clearSelection();
			this.$refs.udb.loadData({
				current: e.current
			});
		},
		navigateTo(url, clear) {
			// clear 表示刷新列表时是否清除页码，true 表示刷新并回到列表第 1 页，默认为 true
			uni.navigateTo({
				url,
				events: {
					refreshData: () => {
						this.loadData(clear);
					}
				}
			});
		},
		// 多选处理
		selectedItems() {
			var dataList = this.$refs.udb.dataList;
			return this.selectedIndexs.map((i) => dataList[i]._id);
		},
		// 批量删除
		delTable() {
			this.$refs.udb.remove(this.selectedItems(), {
				success: (res) => {
					this.$refs.table.clearSelection();
				}
			});
		},
		// 多选
		selectionChange(e) {
			this.selectedIndexs = e.detail.index;
		},
		confirmDelete(id) {
			this.$refs.udb.remove(id, {
				success: (res) => {
					this.$refs.table.clearSelection();
				}
			});
		},
		sortChange(e, name) {
			this.orderByFieldName = name;
			if (e.order) {
				this.orderby = name + ' ' + orderByMapping[e.order];
			} else {
				this.orderby = '';
			}
			this.$refs.table.clearSelection();
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
			this.$nextTick(() => {
				this.$refs.udb.loadData();
			});
		}
	}
};
</script>

<style>
.green-button {
	background-color: #4caf50 !important; /* 更高级的绿色 */
	color: #fff !important; /* 确保文字颜色为白色 */
	border-color: #4caf50 !important; /* 边框颜色与背景色一致 */
}

/* 如果需要hover或active状态的颜色变化 */
.green-button:active {
	background-color: #43a047 !important; /* 点击时的深绿色 */
	border-color: #43a047 !important;
}

/* 如果在非h5端，需要调整hover效果 */
.green-button:hover {
	opacity: 0.9; /* 鼠标悬停时的透明度变化 */
}
</style>
