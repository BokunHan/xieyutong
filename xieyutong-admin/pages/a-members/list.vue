<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<view class="uni-title"></view>
				<view class="uni-sub-title"></view>
			</view>
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入用户昵称或手机号" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
				<!-- <button class="uni-button" type="default" size="mini" @click="navigateTo('./add')">新增</button> -->
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
				field="user_id{avatar,nickname,mobile},level,total_consumption,order_count,upgrade_threshold,benefits,status,join_date,expire_date"
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
						<uni-th align="left">用户</uni-th>
						<uni-th align="center" filter-type="select" :filter-data="options.filterData.level_localdata" @filter-change="filterChange($event, 'level')">会员等级</uni-th>
						<!-- <uni-th align="center" sortable @sort-change="sortChange($event, 'total_consumption')">累计消费</uni-th>
						<uni-th align="center" sortable @sort-change="sortChange($event, 'order_count')">订单数量</uni-th> -->
						<uni-th align="center" sortable @sort-change="sortChange($event, 'upgrade_threshold')">升级门槛</uni-th>
						<!-- <uni-th align="center">会员权益</uni-th> -->
						<uni-th align="center" filter-type="select" :filter-data="options.filterData.status_localdata" @filter-change="filterChange($event, 'status')">状态</uni-th>
						<uni-th align="center" filter-type="timestamp" @filter-change="filterChange($event, 'join_date')" sortable @sort-change="sortChange($event, 'join_date')">
							加入日期
						</uni-th>
						<!-- <uni-th align="center" filter-type="timestamp" @filter-change="filterChange($event, 'expire_date')" sortable @sort-change="sortChange($event, 'expire_date')">
							过期日期
						</uni-th> -->
						<uni-th align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item, index) in data" :key="index">
						<uni-td align="left">
							<view class="user-info" v-if="item.user_id && item.user_id[0]">
								<view class="user-nickname">
									{{ item.user_id[0].nickname || item.user_id[0].mobile || '未知用户' }}
								</view>
							</view>
							<view v-else class="user-info-empty">
								<text>未知用户</text>
							</view>
						</uni-td>
						<uni-td align="center">
							<view class="level-badge" :class="'level-' + item.level">
								{{ levelMap[item.level] || item.level }}
							</view>
						</uni-td>
						<!-- <uni-td align="center">
							<text class="price">{{ formatAmount(item.total_consumption) }}</text>
						</uni-td>
						<uni-td align="center">{{ item.order_count }}</uni-td> -->
						<uni-td align="center">
							<view v-if="item.upgrade_threshold && item.upgrade_threshold.required_consumption > 0">
								<text class="price">{{ item.upgrade_threshold.required_consumption }}</text>
								<text class="next-level-text">({{ levelMap[item.upgrade_threshold.next_level] || item.upgrade_threshold.next_level }})</text>
							</view>
							<text v-else>-</text>
						</uni-td>
						<!-- <uni-td align="center">
							<text class="benefits-text">{{ formatBenefits(item.benefits) }}</text>
						</uni-td> -->
						<uni-td align="center">
							<view class="status-badge" :class="'status-' + item.status">
								{{ statusMap[item.status] || item.status }}
							</view>
						</uni-td>
						<uni-td align="center">
							<uni-dateformat :threshold="[0, 0]" :date="item.join_date"></uni-dateformat>
						</uni-td>
						<!-- <uni-td align="center">
							<uni-dateformat :threshold="[0, 0]" :date="item.expire_date"></uni-dateformat>
						</uni-td> -->
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
import { enumConverter, filterToWhere } from '../../js_sdk/validator/a-members.js';

const db = uniCloud.database();
// 表查询配置
const dbOrderBy = 'created_at desc'; // (修改) 默认排序
// (修改) 启用搜索，并指定搜索字段
const dbSearchFields = ['user_id.nickname', 'user_id.mobile'];
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
			// (修改) 关联 uni-id-users 表
			collectionList: 'a-members, uni-id-users',
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
				filename: 'a-members.xls',
				type: 'xls',
				fields: {
					// (修改) 优化导出字段
					用户昵称: 'user_id.0.nickname',
					用户手机: 'user_id.0.mobile',
					会员等级: 'level',
					累计消费: 'total_consumption',
					订单数量: 'order_count',
					状态: 'status',
					加入日期: 'join_date',
					过期日期: 'expire_date'
				}
			},
			exportExcelData: [],
			levelMap: {
				normal: '普通会员',
				silver: '银卡会员',
				gold: '金卡会员',
				diamond: '钻石会员'
			},
			statusMap: {
				active: '正常',
				inactive: '失效',
				suspended: '冻结'
			}
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
			// (修改) 导出数据前，先格式化
			this.exportExcelData = data.map((item) => {
				// 格式化 level
				item.level = this.options.level_valuetotext[item.level];
				item.status = this.options.status_valuetotext[item.status];
				// 格式化金额 (分 -> 元)
				item.total_consumption = (item.total_consumption / 100).toFixed(2);
				return item;
			});
		},
		// (新增) 格式化金额 (分 -> 元)
		formatAmount(amountInCents) {
			if (!amountInCents) return '¥0.00';
			return '¥' + (parseFloat(amountInCents) / 100).toFixed(2);
		},
		// (新增) 格式化权益
		formatBenefits(benefits) {
			if (Array.isArray(benefits)) {
				return benefits.join(' | ');
			}
			return benefits || '-';
		},
		getWhere() {
			const query = this.query.trim();
			if (!query) {
				return '';
			}
			const queryRe = new RegExp(query, 'i');
			// (修改) JQL查询，正确拼接
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
/* 用户信息 */
.user-info {
	display: flex;
	align-items: center;
}
.user-avatar {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	margin-right: 10px;
	flex-shrink: 0;
}
.user-nickname {
	font-weight: 500;
	color: #333;
	white-space: nowrap;
}
.user-info-empty {
	color: #999;
	font-style: italic;
}

/* 金额样式 */
.price {
	color: #e53e3e; /* 红色 */
	font-weight: 600;
}

/* 权益文本 */
.benefits-text {
	font-size: 12px;
	color: #555;
	white-space: nowrap;
}

/* 通用标签样式 */
.level-badge,
.status-badge {
	display: inline-block;
	padding: 3px 10px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 600;
	white-space: nowrap;
}

.next-level-text {
	font-size: 12px;
	color: #999;
	margin-left: 4px;
}

/* 等级标签 */
.level-normal {
	background-color: #e2e8f0;
	color: #4a5568;
}
.level-silver {
	background-color: #d6bcfa;
	color: #553c9a;
}
.level-gold {
	background-color: #fefcbf;
	color: #b7791f;
}
.level-diamond {
	background-color: #c6f6f6;
	color: #0b696b;
}

/* 状态标签 */
.status-active {
	background-color: #c6f6d5;
	color: #2f855a;
}
.status-inactive,
.status-suspended {
	background-color: #fed7d7;
	color: #c53030;
}
</style>