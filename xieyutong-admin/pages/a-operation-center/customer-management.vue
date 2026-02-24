<template>
	<view class="page-container">
		<view class="main-content">
			<view class="stats-row">
				<view class="stat-box blue">
					<view class="stat-val">{{ stats.total }}</view>
					<view class="stat-label">总客户数</view>
				</view>
				<view class="stat-box green">
					<view class="stat-val">{{ stats.deal }}</view>
					<view class="stat-label">已成交</view>
				</view>
				<view class="stat-box orange">
					<view class="stat-val">{{ stats.following }}</view>
					<view class="stat-label">跟进中</view>
				</view>
				<view class="stat-box cyan">
					<view class="stat-val">{{ stats.newToday }}</view>
					<view class="stat-label">今日新增</view>
				</view>
			</view>

			<view class="filter-bar">
				<view class="search-input">
					<uni-icons type="search" size="16" color="#9ca3af"></uni-icons>
					<input type="text" v-model="filters.keyword" placeholder="搜索客户姓名/电话..." @confirm="refreshData" />
				</view>

				<picker :range="sourceOptions" @change="onSourceFilter" class="filter-picker">
					<view class="picker-inner">
						<text>{{ filters.source || '所有来源' }}</text>
						<uni-icons type="bottom" size="12" color="#666"></uni-icons>
					</view>
				</picker>

				<picker :range="statusOptions" @change="onStatusFilter" class="filter-picker">
					<view class="picker-inner">
						<text>{{ filters.statusLabel || '所有状态' }}</text>
						<uni-icons type="bottom" size="12" color="#666"></uni-icons>
					</view>
				</picker>

				<picker :range="salesOptions" range-key="nickname" @change="onSalesFilter" class="filter-picker">
					<view class="picker-inner">
						<text>{{ filters.salesLabel || '所有销售' }}</text>
						<uni-icons type="bottom" size="12" color="#666"></uni-icons>
					</view>
				</picker>

				<view class="filter-actions">
					<text class="link-btn" @click="resetFilters">重置</text>
				</view>

				<button class="uni-btn-primary small ml-10" @click="openAddPopup">
					<uni-icons type="plusempty" size="12" color="#fff"></uni-icons>
					录入新客户
				</button>
			</view>

			<view class="customer-list">
				<view class="list-header">
					<text class="col-id">ID</text>
					<text class="col-info">客户信息</text>
					<text class="col-source">来源渠道</text>
					<text class="col-sales">分配销售</text>
					<text class="col-status">状态</text>
					<text class="col-amt">成交金额</text>
					<text class="col-date">创建时间</text>
					<text class="col-opt">操作</text>
				</view>

				<scroll-view scroll-y="true" class="list-body">
					<view v-if="isLoading" class="loading-state-inner">
						<uni-load-more status="loading" />
					</view>

					<view class="empty-state" v-else-if="customers.length === 0">
						<text>暂无匹配客户数据</text>
					</view>

					<view class="list-row" v-for="cust in customers" :key="cust._id" v-else>
						<view class="col-id">#{{ cust.shortId }}</view>
						<view class="col-info">
							<view class="ci-top">
								<text class="name">{{ cust.name }}</text>
								<uni-icons v-if="cust.level === 'A'" type="star-filled" size="14" color="#f59e0b"></uni-icons>
							</view>
							<text class="mobile">{{ cust.mobile }}</text>
						</view>
						<view class="col-source">
							<text class="source-tag" :class="getSourceClass(cust.source)">{{ cust.source }}</text>
						</view>
						<view class="col-sales">
							<text v-if="cust.sales_name">{{ cust.sales_name }}</text>
							<text v-else class="text-gray">未分配</text>
						</view>
						<view class="col-status">
							<text class="status-badge" :class="'st-' + cust.status">{{ getStatusLabel(cust.status) }}</text>
						</view>
						<view class="col-amt">
							<text v-if="cust.dealAmount > 0" class="amt-val">¥{{ formatCompact(cust.dealAmount) }}</text>
							<text v-else>-</text>
						</view>
						<view class="col-date">{{ formatDate(cust.created_at) }}</view>
						<view class="col-opt">
							<view class="icon-btn blue" @click="viewDetail(cust)"><uni-icons type="eye" size="16" color="#3b82f6"></uni-icons></view>
							<view class="icon-btn orange" @click="editCustomer(cust)"><uni-icons type="compose" size="16" color="#f59e0b"></uni-icons></view>
							<view class="icon-btn red" @click="deleteCustomer(cust._id)"><uni-icons type="trash" size="16" color="#ef4444"></uni-icons></view>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>

		<uni-popup ref="editPopup" type="center">
			<view class="edit-card" v-if="editingCust">
				<view class="card-title">{{ editingCust._id ? '编辑客户' : '录入新客户' }}</view>
				<view class="form-item">
					<text class="label">客户姓名</text>
					<input class="input" v-model="editingCust.name" placeholder="请输入姓名" />
				</view>
				<view class="form-item">
					<text class="label">联系电话</text>
					<input class="input" v-model="editingCust.mobile" placeholder="请输入手机号" type="number" maxlength="11" />
				</view>
				<view class="form-item">
					<text class="label">来源渠道</text>
					<picker :range="sourceOptions" @change="(e) => (editingCust.source = sourceOptions[e.detail.value])" class="picker">
						<view class="picker-text">{{ editingCust.source || '请选择' }}</view>
					</picker>
				</view>
				<view class="form-item">
					<text class="label">意向等级</text>
					<view class="radio-group">
						<text class="radio-tag" :class="{ active: editingCust.level === 'A' }" @click="editingCust.level = 'A'">A级(高)</text>
						<text class="radio-tag" :class="{ active: editingCust.level === 'B' }" @click="editingCust.level = 'B'">B级(中)</text>
						<text class="radio-tag" :class="{ active: editingCust.level === 'C' }" @click="editingCust.level = 'C'">C级(低)</text>
					</view>
				</view>
				<view class="form-item">
					<text class="label">分配销售</text>
					<picker :range="salesOptions" range-key="nickname" @change="onAssignSales" class="picker">
						<view class="picker-text">{{ getSalesName(editingCust.sales_id) || '未分配' }}</view>
					</picker>
				</view>
				<view class="btn-row">
					<button class="btn cancel" @click="$refs.editPopup.close()">取消</button>
					<button class="btn submit" :loading="isSaving" @click="saveCustomer">保存</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
const db = uniCloud.database();
const dbCmd = db.command;

export default {
	data() {
		return {
			isLoading: true,
			isSaving: false,

			customers: [],
			salesList: [], // 销售人员缓存

			stats: { total: 0, deal: 0, following: 0, newToday: 0 },

			// 筛选状态
			filters: { keyword: '', source: '', status: '', salesId: '', statusLabel: '', salesLabel: '' },
			sourceOptions: ['抖音', '小红书', '携程私家团', '转介绍', '其他'],
			statusOptions: ['待分配', '跟进中', '已成交', '已流失'],
			statusValues: ['new', 'following', 'deal', 'lost'],

			// 编辑状态
			editingCust: null,
			salesOptions: [] // Picker用
		};
	},
	mounted() {
		this.initData();
	},
	methods: {
		// 初始化：先加载销售列表，再加载客户
		async initData() {
			try {
				const salesRes = await db.collection('uni-id-users').where({ role: 'sale' }).field('_id, nickname, username').get();

				this.salesList = salesRes.result.data.map((s) => ({
					_id: s._id,
					nickname: s.nickname || s.username || '销售员'
				}));
				this.salesOptions = [{ _id: '', nickname: '未分配' }, ...this.salesList];

				this.refreshData();
			} catch (e) {
				console.error('销售列表加载失败', e);
			}
		},

		async refreshData() {
			this.isLoading = true;
			try {
				// 1. 构建查询条件
				let where = {};
				if (this.filters.keyword) {
					// 模糊查询：姓名或手机号
					where = dbCmd.or([{ name: new RegExp(this.filters.keyword) }, { mobile: new RegExp(this.filters.keyword) }]);
				}
				if (this.filters.source) where.source = this.filters.source;
				if (this.filters.status) where.status = this.filters.status;
				if (this.filters.salesId) where.sales_id = this.filters.salesId;

				// 2. 查询 a-customers
				const customersRes = await db
					.collection('a-customers')
					.where(where)
					.orderBy('created_at', 'desc')
					.limit(50) // 暂限 50 条，实际需分页
					.get();

				let rawList = customersRes.result.data;

				if (rawList.length > 0) {
					// 3. 关联查询成交金额 (通过手机号关联 a-snapshots)
					// 收集所有手机号
					const mobiles = rawList.map((c) => c.mobile).filter((m) => m);

					// 查找这些手机号是否在任何 active 订单的 travel_users 中
					// 注意：travel_users 是数组对象 [{mobile: '...'}, ...]
					// 复杂查询在客户端受限，这里查回所有相关订单在前端匹配 (数据量大时需改为云函数聚合)
					if (mobiles.length > 0) {
						const ordersRes = await db
							.collection('a-snapshots')
							.where({
								'travel_users.mobile': dbCmd.in(mobiles)
								// status: 'active' // 也可以包括 completed
							})
							.field('total_days, travel_users')
							.get();

						const orderAmountMap = {};
						ordersRes.result.data.forEach((order) => {
							if (order.travel_users) {
								order.travel_users.forEach((u) => {
									if (u.mobile) {
										// 简单估算：天数 * 2000元。如有真实金额字段请替换。
										const amt = (order.total_days || 5) * 2000;
										if (!orderAmountMap[u.mobile]) orderAmountMap[u.mobile] = 0;
										orderAmountMap[u.mobile] += amt;
									}
								});
							}
						});

						// 合并数据
						rawList = rawList.map((c) => ({
							...c,
							sales_name: this.getSalesName(c.sales_id),
							dealAmount: orderAmountMap[c.mobile] || 0,
							shortId: c._id.substring(c._id.length - 4).toUpperCase()
						}));
					}
				}

				this.customers = rawList;
				this.calculateStats();
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				this.isLoading = false;
			}
		},

		// 统计：这里简单统计当前列表，真实场景需单独 count 接口
		calculateStats() {
			const today = new Date().setHours(0, 0, 0, 0);
			this.stats = {
				total: this.customers.length,
				deal: this.customers.filter((c) => c.status === 'deal').length,
				following: this.customers.filter((c) => c.status === 'following').length,
				newToday: this.customers.filter((c) => c.created_at >= today).length
			};
		},

		// 辅助函数
		getSalesName(id) {
			const s = this.salesList.find((x) => x._id === id);
			return s ? s.nickname : '';
		},
		getSourceClass(src) {
			if (src === '携程私家团') return 'bg-cyan';
			if (src === '小红书') return 'bg-red';
			if (src === '抖音') return 'bg-dark';
			return 'bg-gray';
		},
		getStatusLabel(st) {
			const map = { new: '待分配', following: '跟进中', deal: '已成交', lost: '已流失' };
			return map[st] || st;
		},
		formatDate(ts) {
			if (!ts) return '-';
			return new Date(ts).toLocaleDateString();
		},
		formatCompact(num) {
			return num >= 10000 ? (num / 10000).toFixed(1) + 'w' : num;
		},

		// 筛选
		onSourceFilter(e) {
			this.filters.source = this.sourceOptions[e.detail.value];
			this.refreshData();
		},
		onStatusFilter(e) {
			this.filters.statusLabel = this.statusOptions[e.detail.value];
			this.filters.status = this.statusValues[e.detail.value];
			this.refreshData();
		},
		onSalesFilter(e) {
			const idx = e.detail.value;
			this.filters.salesLabel = this.salesOptions[idx].nickname;
			this.filters.salesId = this.salesOptions[idx]._id;
			this.refreshData();
		},
		resetFilters() {
			this.filters = { keyword: '', source: '', status: '', salesId: '', statusLabel: '', salesLabel: '' };
			this.refreshData();
		},

		// 编辑与保存
		openAddPopup() {
			this.editingCust = { name: '', mobile: '', source: '', level: 'B', sales_id: '', status: 'new' };
			this.$refs.editPopup.open();
		},
		editCustomer(cust) {
			// 深拷贝避免影响列表显示
			this.editingCust = JSON.parse(JSON.stringify(cust));
			this.$refs.editPopup.open();
		},
		onAssignSales(e) {
			const idx = e.detail.value;
			const sale = this.salesOptions[idx];
			this.editingCust.sales_id = sale._id;
			// 自动变更为跟进中
			if (sale._id && this.editingCust.status === 'new') {
				this.editingCust.status = 'following';
			}
		},
		async saveCustomer() {
			if (!this.editingCust.name) return uni.showToast({ title: '请输入姓名', icon: 'none' });
			if (!this.editingCust.mobile) return uni.showToast({ title: '请输入手机号', icon: 'none' });

			this.isSaving = true;
			try {
				const data = {
					name: this.editingCust.name,
					mobile: this.editingCust.mobile,
					source: this.editingCust.source,
					level: this.editingCust.level,
					sales_id: this.editingCust.sales_id,
					status: this.editingCust.status,
					updated_at: Date.now()
				};

				if (this.editingCust._id) {
					// 更新
					await db.collection('a-customers').doc(this.editingCust._id).update(data);
				} else {
					// 新增
					data.created_at = Date.now();
					await db.collection('a-customers').add(data);
				}

				this.$refs.editPopup.close();
				uni.showToast({ title: '保存成功' });
				this.refreshData();
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '保存失败', icon: 'none' });
			} finally {
				this.isSaving = false;
			}
		},

		deleteCustomer(id) {
			uni.showModal({
				title: '提示',
				content: '确定要删除该客户资料吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							await db.collection('a-customers').doc(id).remove();
							uni.showToast({ title: '已删除' });
							this.refreshData();
						} catch (e) {
							uni.showToast({ title: '删除失败', icon: 'none' });
						}
					}
				}
			});
		},

		viewDetail(cust) {
			uni.showToast({ title: '查看详情功能待开发', icon: 'none' });
		}
	}
};
</script>

<style lang="scss">
$page-bg: #f5f7fa;
$blue: #3b82f6;
$green: #10b981;
$orange: #f59e0b;
$cyan: #06b6d4;
$red: #f43f5e;
$text-main: #1f2937;
$text-sub: #6b7280;

.page-container {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background-color: $page-bg;

	.main-content {
		flex: 1;
		padding: 20px;
		display: flex;
		flex-direction: column;
		overflow: hidden;

		.stats-row {
			display: flex;
			gap: 15px;
			margin-bottom: 15px;
			flex-shrink: 0;
			.stat-box {
				flex: 1;
				background: #fff;
				padding: 15px;
				border-radius: 8px;
				text-align: center;
				box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
				border-top: 3px solid transparent;
				&.blue {
					border-color: $blue;
				}
				&.green {
					border-color: $green;
				}
				&.orange {
					border-color: $orange;
				}
				&.cyan {
					border-color: $cyan;
				}
				.stat-val {
					font-size: 24px;
					font-weight: bold;
					color: $text-main;
					margin-bottom: 4px;
				}
				.stat-label {
					font-size: 12px;
					color: $text-sub;
				}
			}
		}

		.filter-bar {
			display: flex;
			align-items: center;
			background: #fff;
			padding: 10px 15px;
			border-radius: 8px;
			margin-bottom: 15px;
			gap: 10px;
			flex-shrink: 0;

			.search-input {
				flex: 1;
				background: #f3f4f6;
				border-radius: 4px;
				padding: 6px 10px;
				display: flex;
				align-items: center;
				input {
					margin-left: 8px;
					font-size: 13px;
					width: 100%;
				}
			}
			.filter-picker {
				.picker-inner {
					border: 1px solid #e5e7eb;
					border-radius: 4px;
					padding: 6px 10px;
					font-size: 13px;
					color: $text-main;
					background: #fff;
					display: flex;
					align-items: center;
					gap: 6px;
					min-width: 90px;
					justify-content: space-between;
				}
			}
			.link-btn {
				font-size: 13px;
				color: $blue;
				cursor: pointer;
				padding: 0 5px;
			}
			.uni-btn-primary {
				background-color: $blue;
				color: #fff;
				font-size: 13px;
				padding: 6px 16px;
				border-radius: 4px;
				border: none;
				display: flex;
				align-items: center;
				gap: 4px;
			}
		}

		.customer-list {
			flex: 1;
			background: #fff;
			border-radius: 8px;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
			display: flex;
			flex-direction: column;
			overflow: hidden;

			.list-header {
				display: flex;
				padding: 12px 15px;
				background: #f9fafb;
				border-bottom: 1px solid #eee;
				font-size: 12px;
				font-weight: 600;
				color: $text-sub;
				.col-id {
					width: 60px;
				}
				.col-info {
					flex: 1.5;
				}
				.col-source {
					width: 90px;
				}
				.col-sales {
					width: 80px;
				}
				.col-status {
					width: 70px;
					text-align: center;
				}
				.col-amt {
					width: 80px;
					text-align: right;
				}
				.col-date {
					width: 90px;
					text-align: right;
				}
				.col-opt {
					width: 100px;
					text-align: right;
				}
			}

			.list-body {
				flex: 1;
				overflow-y: auto;
				.loading-state-inner {
					padding: 40px 0;
				}
				.empty-state {
					padding: 40px;
					text-align: center;
					color: #ccc;
					font-size: 13px;
				}
				.list-row {
					display: flex;
					align-items: center;
					padding: 12px 15px;
					border-bottom: 1px solid #f3f4f6;
					font-size: 13px;
					color: $text-main;
					&:hover {
						background: #fcfcfc;
					}

					.col-id {
						width: 60px;
						color: $text-sub;
					}
					.col-info {
						flex: 1.5;
						.ci-top {
							display: flex;
							align-items: center;
							gap: 4px;
							.name {
								font-weight: 500;
							}
						}
						.mobile {
							font-size: 12px;
							color: #9ca3af;
							display: block;
							margin-top: 2px;
						}
					}
					.col-source {
						width: 90px;
						.source-tag {
							font-size: 10px;
							padding: 2px 6px;
							border-radius: 4px;
							color: #fff;
							&.bg-cyan {
								background: #06b6d4;
							}
							&.bg-red {
								background: #f43f5e;
							}
							&.bg-dark {
								background: #111;
							}
							&.bg-gray {
								background: #9ca3af;
							}
						}
					}
					.col-sales {
						width: 80px;
						.text-gray {
							color: #ccc;
							font-style: italic;
							font-size: 12px;
						}
					}
					.col-status {
						width: 70px;
						text-align: center;
						.status-badge {
							font-size: 11px;
							padding: 2px 6px;
							border-radius: 10px;
							&.st-new {
								background: #e5e7eb;
								color: $text-sub;
							}
							&.st-following {
								background: #eff6ff;
								color: $blue;
							}
							&.st-deal {
								background: #ecfdf5;
								color: $green;
								font-weight: 500;
							}
							&.st-lost {
								background: #fff1f2;
								color: $text-sub;
								text-decoration: line-through;
							}
						}
					}
					.col-amt {
						width: 80px;
						text-align: right;
						.amt-val {
							color: $text-main;
							font-weight: 500;
						}
					}
					.col-date {
						width: 90px;
						text-align: right;
						font-size: 12px;
						color: $text-sub;
					}
					.col-opt {
						width: 100px;
						text-align: right;
						display: flex;
						justify-content: flex-end;
						gap: 10px;
						.icon-btn {
							cursor: pointer;
							opacity: 0.8;
							&:hover {
								opacity: 1;
							}
						}
					}
				}
			}
		}
	}

	.edit-card {
		width: 320px;
		background: #fff;
		border-radius: 12px;
		padding: 20px;
		.card-title {
			font-size: 16px;
			font-weight: bold;
			margin-bottom: 20px;
			text-align: center;
		}
		.form-item {
			margin-bottom: 15px;
			.label {
				font-size: 13px;
				color: $text-sub;
				margin-bottom: 6px;
				display: block;
			}
			.input,
			.picker {
				width: 100%;
				border: 1px solid #e5e7eb;
				border-radius: 6px;
				padding: 0px 10px;
				font-size: 14px;
				height: 30px;
				box-sizing: border-box;
				.picker-text {
					color: $text-main;
				}
			}
			.radio-group {
				display: flex;
				gap: 10px;
				.radio-tag {
					font-size: 12px;
					padding: 4px 12px;
					border-radius: 20px;
					border: 1px solid #e5e7eb;
					color: $text-sub;
					cursor: pointer;
					&.active {
						background: $blue;
						color: #fff;
						border-color: $blue;
					}
				}
			}
		}
		.btn-row {
			display: flex;
			gap: 15px;
			margin-top: 25px;
			.btn {
				flex: 1;
				font-size: 14px;
				border-radius: 6px;
				border: none;
				padding: 8px 0;
				&.cancel {
					background: #f3f4f6;
					color: $text-main;
				}
				&.submit {
					background: $blue;
					color: #fff;
				}
			}
		}
	}
}
</style>
