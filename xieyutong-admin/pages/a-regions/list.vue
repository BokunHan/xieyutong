<template>
	<view class="px-5 py-3">
		<view class="uni-header">
			<view class="uni-group">
				<button type="default" size="mini" @click="goBack">返回</button>
				<view class="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center ml-5">
					<i class="fas fa-globe-asia text-white text-xs"></i>
				</view>
				<view class="uni-title ml-2">区域管理</view>
				<view class="uni-sub-title"></view>
			</view>
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入区域名称或标识" />
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
				v-slot:default="{ loading, error, options }"
				:options="options"
				loadtime="manual"
				@load="onqueryload">
				<uni-table ref="table" :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection" @selection-change="selectionChange" :data="treeData">
					<uni-tr>
						<uni-th align="left" filter-type="search" @filter-change="filterChange($event, 'name')" sortable @sort-change="sortChange($event, 'name')">区域名称</uni-th>
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'slug')" sortable @sort-change="sortChange($event, 'slug')">唯一标识</uni-th>
						<uni-th align="center" sortable @sort-change="sortChange($event, 'cover_image')">区域封面图</uni-th>
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'description')" sortable @sort-change="sortChange($event, 'description')">
							区域简介
						</uni-th>
						<uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'order')" sortable @sort-change="sortChange($event, 'order')">排序权重</uni-th>
						<uni-th align="center" sortable @sort-change="sortChange($event, 'status')">启用状态</uni-th>
						<uni-th align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item, index) in treeData" :key="index">
						<uni-td align="left">
							<view @click="toggleExpand(item, index)" class="tree-table-row">
								<text :style="{ 'padding-left': item.level * 20 + 'px' }"></text>
								<view class="icon-container">
									<uni-icons v-if="item.children && item.children.length > 0" :type="item.expand ? 'bottom' : 'right'" size="14" color="#999"></uni-icons>
									<text v-else class="icon-arrow-placeholder"></text>
								</view>

								<text>{{ item.name }}</text>
							</view>
						</uni-td>

						<uni-td align="center">{{ item.slug }}</uni-td>
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
									@click="navigateTo('../a-regions/a-region-content/list?region_id=' + item._id + '&region_name=' + item.name, false)"
									class="uni-button green-button"
									size="mini"
									type="default">
									提示管理
								</button>
								<!-- <button
									@click="navigateTo('../a-poi-system/a-poi-database/list?region_id=' + item._id + '&region_name=' + item.name, false)"
									class="uni-button"
									size="mini"
									type="primary">
									POI管理
								</button> -->
								<button @click="confirmDelete(item._id)" class="uni-button" size="mini" type="warn">删除</button>
							</view>
						</uni-td>
					</uni-tr>
				</uni-table>
			</unicloud-db>
		</view>
	</view>
</template>

<script>
import { enumConverter, filterToWhere } from '../../js_sdk/validator/a-regions.js';

const db = uniCloud.database();
const dbOrderBy = 'order desc';
const dbSearchFields = ['name', 'slug'];
const pageSize = 500; // 一次性加载所有数据以构建树

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
				filterData: {},
				...enumConverter
			},
			treeData: [], // 4. 最终渲染的数据
			rawData: [], // 5. 存储原始列表数据
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
					父级区域: 'parent_name', // 导出时使用处理过的父级名称
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
		goBack() {
			uni.navigateBack();
		},
		onqueryload(data) {
			this.rawData = data; // 存储原始数据
			this.exportExcelData = this.buildExcelData(data);
			this.treeData = this.buildTree(data);
		},

		buildTree(data, parentId = '', level = 0) {
			let tree = [];
			data.forEach((item) => {
				if (item.parent_id === parentId) {
					const node = { ...item };
					node.level = level;
					node.expand = false; // 默认不展开
					// 确保 children 属性存在
					node.children = this.buildTree(data, item._id, level + 1);
					tree.push(node);
				}
			});
			// 排序
			tree.sort((a, b) => b.order - a.order);
			return tree;
		},

		toggleExpand(item, index) {
			if (!item.children || !item.children.length) {
				return;
			}
			item.expand = !item.expand;
			if (item.expand) {
				// 展开：将子节点插入到当前项的后面
				this.treeData.splice(index + 1, 0, ...item.children);
			} else {
				// 折叠：移除所有子孙节点
				const childCount = this.getChildCount(item);
				this.treeData.splice(index + 1, childCount);
			}
		},

		getChildCount(item) {
			let count = 0;
			if (item.children && item.children.length) {
				count += item.children.length;
				if (item.expand) {
					item.children.forEach((child) => {
						count += this.getChildCount(child);
					});
				}
			}
			return count;
		},

		buildExcelData(data) {
			const dataMap = new Map(data.map((item) => [item._id, item.name]));
			return data.map((item) => {
				return {
					...item,
					parent_name: dataMap.get(item.parent_id) || '顶级区域'
				};
			});
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
		selectedItems() {
			return this.selectedIndexs.map((i) => this.treeData[i]._id);
		},
		delTable() {
			this.$refs.udb.remove(this.selectedItems(), {
				success: (res) => {
					this.$refs.table.clearSelection();
					this.loadData(); // 删除后重新加载
				}
			});
		},
		selectionChange(e) {
			this.selectedIndexs = e.detail.index;
		},
		confirmDelete(id) {
			// 11. 删除时需要考虑子节点
			const children = this.buildTree(this.rawData, id);
			if (children.length > 0) {
				uni.showModal({
					title: '删除失败',
					content: '该区域下有子区域，请先删除子区域。',
					showCancel: false
				});
				return;
			}

			this.$refs.udb.remove(id, {
				success: (res) => {
					this.$refs.table.clearSelection();
					this.loadData(); // 删除后重新加载
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
	background-color: #4caf50 !important;
	color: #fff !important;
	border-color: #4caf50 !important;
}
.green-button:active {
	background-color: #43a047 !important;
	border-color: #43a047 !important;
}
.green-button:hover {
	opacity: 0.9;
}

.tree-table-row {
	display: flex;
	align-items: center;
	cursor: pointer;
	padding: 8px 0;
}
.icon-container {
	display: inline-block;
	width: 20px;
	height: 20px;
	line-height: 20px; /* 辅助垂直居中 */
	text-align: center; /* 辅助水平居中 */
}
.icon-arrow-placeholder {
	display: inline-block;
	width: 20px;
	height: 20px;
}
</style>