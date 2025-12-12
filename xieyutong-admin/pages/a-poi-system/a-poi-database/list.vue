<template>
	<view class="px-5 py-3">
		<view class="uni-header">
			<view class="uni-group">
				<button type="default" size="mini" @click="goBack">返回</button>
				<view class="w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center ml-5">
					<i class="fas fa-map-marker-alt text-white text-xs"></i>
				</view>
				<view class="uni-title ml-2">POI 内容管理</view>
				<view class="uni-sub-title"></view>
			</view>
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入POI名称或别名" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
				<button class="uni-button" type="default" size="mini" @click="navigateTo('./add')">新增</button>
				<button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length" @click="delTable">批量删除</button>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db
				ref="udb"
				:collection="collectionList"
				:field="fieldList"
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
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'name')" sortable @sort-change="sortChange($event, 'name')">POI名称</uni-th>
						<uni-th align="center" sortable @sort-change="sortChange($event, 'aliases')">别名</uni-th>
						<uni-th align="center" filter-type="select" :filter-data="options.filterData.category_id_localdata" @filter-change="filterChange($event, 'category_id')">分类</uni-th>
						<uni-th align="center" filter-type="select" :filter-data="options.filterData.region_ids_localdata" @filter-change="filterChange($event, 'region_ids')">所属区域</uni-th>
						<uni-th align="center" :filter-data="options.filterData.tags_localdata" @filter-change="filterChange($event, 'tags')">POI标签</uni-th>
						<uni-th
							align="center"
							filter-type="search"
							@filter-change="filterChange($event, 'address_text')"
							sortable
							width="100"
							@sort-change="sortChange($event, 'address_text')">
							详细地址
						</uni-th>
						<uni-th align="center" sortable @sort-change="sortChange($event, 'media')">媒体库</uni-th>
						<uni-th align="center" width="80">线路图</uni-th>
						<uni-th align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item, index) in data" :key="index">
						<uni-td align="center">{{ item.name }}</uni-td>
						<uni-td align="center">{{ item.aliases && item.aliases.join(', ') }}</uni-td>
						<uni-td align="center">{{ item.category_id && item.category_id[0] && item.category_id[0].text }}</uni-td>
						<uni-td align="center">{{ item.region_ids && item.region_ids.map((r) => r.text).join(', ') }}</uni-td>
						<uni-td align="center">{{ item.tags && item.tags.map((t) => t.text).join(', ') }}</uni-td>
						<uni-td align="center">{{ item.address_text }}</uni-td>
						<uni-td align="center">
							<template v-if="item.media && item.media.length > 0">
								<uni-file-picker
									:value="item.media"
									:file-mediatype="getFileType(item.media[0])"
									return-type="object"
									:imageStyles="imageStyles"
									readonly
									:limit="1"></uni-file-picker>
								<text v-if="item.media.length > 1">... ({{ item.media.length }})</text>
							</template>
						</uni-td>
						<uni-td align="center">
							<uni-file-picker
								v-if="item.route_map_image && item.route_map_image.url"
								:value="item.route_map_image"
								:file-mediatype="'image'"
								return-type="object"
								:imageStyles="imageStyles"
								readonly></uni-file-picker>
							<text v-else>-</text>
						</uni-td>
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
import { enumConverter, filterToWhere } from '../../../js_sdk/validator/a-poi-database.js';

const db = uniCloud.database();
const dbCmd = db.command;
// 表查询配置
const dbOrderBy = ''; // 排序字段
const dbSearchFields = ['name', 'aliases']; // 模糊搜索字段
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
				db.collection('a-poi-database').getTemp(),
				db.collection('a-poi-categories').field('_id, name as text').getTemp(),
				db.collection('a-regions').field('_id, name as text').getTemp(),
				db.collection('a-poi-tags').field('_id, name as text').getTemp()
			],
			fieldList: 'name,category_id{text},region_ids{text},aliases,tags{text},address_text,media,route_map_image',
			query: '',
			where: '',
			orderby: dbOrderBy,
			orderByFieldName: '',
			selectedIndexs: [],
			options: {
				pageSize,
				pageCurrent,
				filterData: {
					category_id_localdata: [],
					region_ids_localdata: [],
					tags_localdata: []
				},
				...enumConverter
			},
			imageStyles: {
				width: 64,
				height: 64
			}
		};
	},
	onLoad(options) {
		this._filter = {};
		let where = '';

		// 解析URL参数，实现从其他页面跳转的筛选
		if (options.region_id) {
			where = `region_ids == "${options.region_id}"`;
			this.pageTitle = `区域 [${options.region_name || '...'}]: POI管理`;
		}
		if (options.category_id) {
			where = `category_id == "${options.category_id}"`;
			this.pageTitle = `分类 [${options.category_name || '...'}]: POI管理`;
		}
		if (options.tag_id) {
			// 标签是数组，查询方式为 "array == 'element'"
			// === 这是修复后的代码 ===
			where = `tags == "${options.tag_id}"`;
			// === Bug 修复结束 ===
			this.pageTitle = `标签 [${options.tag_name || '...'}]: POI管理`;
		}

		if (where) {
			this.where = where;
		}

		this.loadRegions();
		this.loadCategories();
		this.loadTags();
	},
	onReady() {
		this.$refs.udb.loadData();
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},
		getFileType(file) {
			if (!file) return 'all';
			if (file.fileType === 'image') return 'image';
			if (file.fileType === 'video') return 'video';
			return 'all';
		},
		// 加载筛选数据
		loadRegions() {
			db.collection('a-regions')
				.field('_id, name')
				.where('status == true')
				.get()
				.then((res) => {
					this.options.filterData.region_ids_localdata = res.result.data.map((item) => ({ value: item._id, text: item.name }));
				});
		},
		loadCategories() {
			db.collection('a-poi-categories')
				.field('_id, name')
				.where('status == true')
				.get()
				.then((res) => {
					this.options.filterData.category_id_localdata = res.result.data.map((item) => ({ value: item._id, text: item.name }));
				});
		},
		loadTags() {
			db.collection('a-poi-tags')
				.field('_id, name')
				.where('status == true')
				.get()
				.then((res) => {
					this.options.filterData.tags_localdata = res.result.data.map((item) => ({ value: item._id, text: item.name }));
				});
		},

		onqueryload(data) {},
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
			// 确保搜索不覆盖来自URL参数的筛选
			if (this.where && !newWhere) {
				// 保持 URL 的 where
			} else if (!this.where && newWhere) {
				this.where = newWhere;
			} else if (this.where && newWhere) {
				// 合并
				this.where = `(${this.where}) && (${newWhere})`;
			}

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
			var dataList = this.$refs.udb.dataList;
			return this.selectedIndexs.map((i) => dataList[i]._id);
		},
		delTable() {
			this.$refs.udb.remove(this.selectedItems(), {
				success: (res) => {
					this.$refs.table.clearSelection();
				}
			});
		},
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
				// 合并筛选
				const query = this.query.trim();
				if (query) {
					newWhere = db.command.and(newWhere, { [dbSearchFields[0]]: new RegExp(query, 'i') });
				}
				this.where = newWhere;
			} else {
				this.where = this.getWhere() || '';
			}
			this.$nextTick(() => {
				this.$refs.udb.loadData();
			});
		}
	}
};
</script>

<style></style>
