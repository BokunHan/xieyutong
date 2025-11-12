<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<button type="default" size="mini" @click="goBack">返回</button>
				<view class="uni-title ml-5">区域提示管理</view>
				<view class="uni-sub-title"></view>
			</view>
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query.keyword" @confirm="search" placeholder="请输入搜索内容" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
				<button class="uni-button" type="default" size="mini" @click="navigateTo('./add')">新增</button>
				<button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length" @click="delTable">批量删除</button>
				<download-excel class="hide-on-phone" :fields="exportExcel.fields" :data="exportExcelData" :type="exportExcel.type" :name="exportExcel.filename">
					<button class="uni-button" type="primary" size="mini">导出 Excel</button>
				</download-excel>
			</view>
			<view class="uni-group">
				<uni-data-picker v-model="query.region_id" collection="a-regions" field="_id as value, name as text" placeholder="请选择区域筛选" style="width: 250px" @change="search" />
			</view>
		</view>
		<view class="uni-container">
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
				<uni-table ref="table" :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection" @selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center">所属区域</uni-th>
						<uni-th align="center" filter-type="select" :filter-data="options.filterData.type_localdata" @filter-change="filterChange($event, 'type')">内容类型</uni-th>
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'title')" sortable @sort-change="sortChange($event, 'title')">标题</uni-th>
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'content')" sortable @sort-change="sortChange($event, 'content')">详细内容</uni-th>
						<uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'order')" sortable @sort-change="sortChange($event, 'order')">排序</uni-th>
						<uni-th align="center" sortable @sort-change="sortChange($event, 'status')">发布状态</uni-th>
						<uni-th align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item, index) in data" :key="index">
						<uni-td align="center">{{ item.region_id && item.region_id[0] && item.region_id[0].text }}</uni-td>
						<uni-td align="center">{{ options.type_valuetotext[item.type] }}</uni-td>
						<uni-td align="center">{{ item.title }}</uni-td>
						<uni-td align="center">{{ item.content ? '[富文本内容]' : '暂无内容' }}</uni-td>
						<uni-td align="center">{{ item.order }}</uni-td>
						<uni-td align="center">{{ item.status == true ? '✅' : '❌' }}</uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button @click="navigateTo('./edit?id=' + item._id, false)" class="uni-button" size="mini" type="primary">修改</button>
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
import { enumConverter, filterToWhere } from '../../js_sdk/validator/a-region-content.js';

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
			collectionList: [
				db.collection('a-region-content').field('region_id,type,title,content,order,status').getTemp(),
				db.collection('a-regions').field('_id, name as text').getTemp()
			],
			query: {
				keyword: '',
				region_id: ''
			},
			where: '',
			orderby: dbOrderBy,
			orderByFieldName: '',
			selectedIndexs: [],
			options: {
				pageSize,
				pageCurrent,
				filterData: {
					type_localdata: [
						{
							value: 'tips',
							text: '出行提示'
						},
						{
							value: 'precautions',
							text: '注意事项'
						},
						{
							value: 'must_read',
							text: '出行前必读'
						}
					]
				},
				...enumConverter
			},
			imageStyles: {
				width: 64,
				height: 64
			},
			exportExcel: {
				filename: 'a-region-content.xls',
				type: 'xls',
				fields: {
					所属区域: 'region_id',
					内容类型: 'type',
					标题: 'title',
					详细内容: 'content',
					排序: 'order',
					发布状态: 'status'
				}
			},
			exportExcelData: []
		};
	},
	onLoad() {
		this._filter = {};
		if (options.region_id) {
			// 自动设置筛选器
			this.query.region_id = options.region_id;

			if (options.region_name) {
				uni.setNavigationBarTitle({
					title: `${options.region_name} - 内容管理`
				});
			}
		}
	},
	onReady() {
		this.buildWhere();
		this.$refs.udb.loadData();
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},

		buildWhere() {
			const where = {};
			const jqlCommands = [];

			// 1. 处理表头筛选
			const filter = filterToWhere(this._filter, db.command);
			if (Object.keys(filter).length) {
				// filterToWhere 返回的是对象，比如 { type: 'tips' }
				// 我们需要转为 JQL 字符串，因为 collectionList 是联表查询
				for (const key in filter) {
					if (filter[key]) {
						// 简单处理，假设都是字符串等于
						jqlCommands.push(`${key} == "${filter[key]}"`);
					}
				}
			}

			// 2. 处理区域筛选
			if (this.query.region_id) {
				jqlCommands.push(`region_id == "${this.query.region_id}"`);
			}

			// 3. 处理关键词搜索
			const keyword = this.query.keyword.trim();
			if (keyword) {
				// 假设只搜索标题
				jqlCommands.push(`new RegExp("${keyword}", "i").test(title)`);
			}

			this.where = jqlCommands.join(' && ');
		},
		onqueryload(data) {
			this.exportExcelData = data;
		},
		search() {
			this.buildWhere();
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
			this.buildWhere();
			this.$nextTick(() => {
				this.$refs.udb.loadData();
			});
		}
	}
};
</script>

<style></style>
