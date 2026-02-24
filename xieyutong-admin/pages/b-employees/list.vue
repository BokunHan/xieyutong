<template>
	<view class="p-4">
		<view class="mb-4 flex bg-white p-1 rounded shadow-sm sticky top-0 z-10">
			<view
				class="flex-1 text-center py-2 text-sm font-bold cursor-pointer rounded transition-colors"
				:class="currentTab === 'guide' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600'"
				@click="switchTab('guide')">
				私导档案
			</view>
			<view
				class="flex-1 text-center py-2 text-sm font-bold cursor-pointer rounded transition-colors"
				:class="currentTab === 'sale' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600'"
				@click="switchTab('sale')">
				销售档案
			</view>
			<view
				class="flex-1 text-center py-2 text-sm font-bold cursor-pointer rounded transition-colors"
				:class="currentTab === 'attendant' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600'"
				@click="switchTab('attendant')">
				管家档案
			</view>
		</view>

		<view v-if="currentTab === 'guide'">
			<view class="mb-3 flex items-center gap-2 w-1/2">
				<uni-easyinput v-model="searchGuide.keyword" placeholder="搜索姓名或电话" :clearable="true" @confirm="handleSearch('guide')" />
				<button type="primary" size="mini" @click="handleSearch('guide')">搜索</button>
				<button type="default" size="mini" @click="handleReset('guide')">重置</button>
			</view>
			<unicloud-db
				ref="udbGuide"
				v-slot:default="{ data, loading, error, options }"
				collection="b-guide-profiles, uni-id-users, b-vehicle-profiles"
				field="_id,real_name,mobile,gender,rating,order_count,personal_photo,rank,work_status,has_car,user_id._id,user_id.nickname,vehicle_id.plate_number"
				page-data="replace"
				:getcount="true"
				:where="guideWhere"
				:orderby="guideOrderBy"
				@load="onLoadGuideData">
				<view v-if="error" class="text-red-500">{{ error.message }}</view>
				<view v-else-if="loading" class="p-4 text-center text-gray-500">加载中...</view>
				<view v-else class="bg-white rounded shadow overflow-hidden">
					<uni-table border stripe emptyText="暂无数据">
						<uni-tr>
							<uni-th align="center" width="70">头像</uni-th>
							<uni-th align="center" width="90">姓名</uni-th>
							<uni-th align="center" width="110">手机号</uni-th>
							<uni-th align="center" width="80">级别</uni-th>
							<uni-th align="center" width="80">状态</uni-th>
							<uni-th align="center" width="60">
								<view class="flex items-center justify-center">
									<text class="mr-1">评分</text>
									<!-- <view class="flex flex-col" style="line-height: 0.5">
										<uni-icons v-if="guideSortField === 'rating'" :type="guideSortOrder === 'asc' ? 'up' : 'down'" size="14" color="#2563eb"></uni-icons>
										<uni-icons v-else type="down" size="14" color="#e5e7eb"></uni-icons>
									</view> -->
								</view>
							</uni-th>
							<uni-th align="center" width="100">
								<view class="flex items-center justify-center">
									<text class="mr-1">接单数</text>
									<!-- <view class="flex flex-col" style="line-height: 0.5">
										<uni-icons v-if="guideSortField === 'order_count'" :type="guideSortOrder === 'asc' ? 'up' : 'down'" size="14" color="#2563eb"></uni-icons>
										<uni-icons v-else type="down" size="14" color="#e5e7eb"></uni-icons>
									</view> -->
								</view>
							</uni-th>
							<uni-th align="center" width="70">车辆</uni-th>
							<uni-th align="center" width="200">操作</uni-th>
						</uni-tr>
						<uni-tr v-for="(item, index) in data" :key="index">
							<uni-td align="center">
								<image
									v-if="item.personal_photo"
									:src="item.personal_photo"
									mode="aspectFill"
									class="w-10 h-10 rounded-full bg-gray-100"
									@click="previewImage(item.personal_photo)"></image>
								<view v-else class="w-10 h-10 rounded-full bg-gray-100 mx-auto flex items-center justify-center text-gray-400 text-xs">无</view>
							</uni-td>
							<uni-td align="center">{{ item.real_name }}</uni-td>
							<uni-td align="center">{{ item.mobile }}</uni-td>
							<uni-td align="center">
								<uni-tag v-if="item.rank === 'excellent'" text="金牌" type="warning" size="small" />
								<uni-tag v-else text="普通" type="default" size="small" />
							</uni-td>
							<uni-td align="center">
								<text v-if="item.work_status === 'active'" class="text-green-500">正常</text>
								<text v-else-if="item.work_status === 'leave_personal'" class="text-orange-500">事假</text>
								<text v-else-if="item.work_status === 'leave_sick'" class="text-red-500">病假</text>
								<text v-else>-</text>
							</uni-td>
							<uni-td align="center">
								<view class="font-bold" :class="getScoreColor(getRealData(item).score)">
									{{ getRealData(item).score }}
								</view>
							</uni-td>

							<uni-td align="center">
								<view class="flex items-center justify-center gap-2">
									<text>{{ getRealData(item).count }}</text>
									<uni-icons type="eye" size="18" color="#007aff" class="cursor-pointer" @click="viewOrders(item)"></uni-icons>
								</view>
							</uni-td>

							<uni-td align="center">
								<view v-if="item.vehicle_id && item.vehicle_id[0]" class="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">
									{{ item.vehicle_id[0].plate_number }}
								</view>
								<text v-else-if="item.has_car" class="text-gray-400 text-xs">有车(无)</text>
								<text v-else class="text-gray-400 text-xs">-</text>
							</uni-td>

							<uni-td align="center">
								<view class="flex justify-center items-center gap-2">
									<button
										v-if="item.user_id && item.user_id[0]"
										size="mini"
										type="default"
										class="!bg-amber-50 !text-amber-600 !border-amber-200"
										@click="managePortfolio(item.user_id[0]._id, item.real_name)">
										相册
									</button>
									<button size="mini" type="primary" plain @click="navigateTo('./guide-profile-edit?id=' + item._id)">编辑</button>
									<button size="mini" type="warn" plain @click="deleteGuide(item._id)">删</button>
								</view>
							</uni-td>
						</uni-tr>
					</uni-table>
				</view>
				<view class="p-4">
					<uni-pagination show-icon :total="guideTotal" :pageSize="20" @change="$refs.udbGuide.loadData($event)"></uni-pagination>
				</view>
			</unicloud-db>
		</view>

		<view v-if="currentTab === 'sale'">
			<view class="mb-3 flex items-center gap-2">
				<uni-easyinput v-model="searchSale.keyword" placeholder="搜索姓名或电话" class="w-60" :clearable="true" @confirm="handleSearch('sale')" />
				<button type="primary" size="mini" @click="handleSearch('sale')">搜索</button>
				<button type="default" size="mini" @click="handleReset('sale')">重置</button>
			</view>
			<unicloud-db
				ref="udbSale"
				v-slot:default="{ data, loading, error }"
				collection="uni-id-users"
				:where="saleWhere"
				field="_id,nickname,mobile,avatar_file,role"
				@load="onLoadSaleData">
				<uni-table border stripe emptyText="暂无销售人员">
					<uni-tr>
						<uni-th align="center" width="80">头像</uni-th>
						<uni-th align="center">姓名</uni-th>
						<uni-th align="center">考核分(本月)</uni-th>
						<uni-th align="center" width="120">本月销售额</uni-th>
						<uni-th align="center" width="120">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item, index) in data" :key="index">
						<uni-td align="center">
							<image :src="item.avatar_file?.url" class="w-10 h-10 rounded-full bg-gray-100" mode="aspectFill"></image>
						</uni-td>
						<uni-td align="center">{{ item.nickname || '未命名' }}</uni-td>
						<uni-td align="center">
							<text class="font-bold text-lg" :class="getScoreColor(getRealData(item._id).score)">
								{{ getRealData(item._id).score }}
							</text>
						</uni-td>
						<uni-td align="center">
							<text class="text-xs">¥{{ (getRealData(item._id).sales || 0).toLocaleString() }}</text>
						</uni-td>
						<uni-td align="center">
							<button size="mini" type="primary" plain @click="editProfile('sale', item._id, item.nickname)">数据录入</button>
						</uni-td>
					</uni-tr>
				</uni-table>
			</unicloud-db>
		</view>

		<view v-if="currentTab === 'attendant'">
			<view class="mb-3 flex items-center gap-2">
				<uni-easyinput v-model="searchAttendant.keyword" placeholder="搜索姓名或电话" class="w-60" :clearable="true" @confirm="handleSearch('attendant')" />
				<button type="primary" size="mini" @click="handleSearch('attendant')">搜索</button>
				<button type="default" size="mini" @click="handleReset('attendant')">重置</button>
			</view>
			<unicloud-db
				ref="udbAttendant"
				v-slot:default="{ data, loading, error }"
				collection="uni-id-users"
				:where="attendantWhere"
				field="_id,nickname,mobile,avatar_file,role"
				@load="onLoadAttendantData">
				<uni-table border stripe emptyText="暂无管家人员">
					<uni-tr>
						<uni-th align="center" width="80">头像</uni-th>
						<uni-th align="center">姓名</uni-th>
						<uni-th align="center">手机号</uni-th>
						<uni-th align="center" width="120">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item, index) in data" :key="index">
						<uni-td align="center">
							<image :src="item.avatar_file?.url" class="w-10 h-10 rounded-full bg-gray-100" mode="aspectFill"></image>
						</uni-td>
						<uni-td align="center">{{ item.nickname || '未命名' }}</uni-td>
						<uni-td align="center">{{ item.mobile || '-' }}</uni-td>
						<uni-td align="center">
							<button size="mini" type="primary" plain @click="editProfile('attendant', item._id, item.nickname)">考核录入</button>
						</uni-td>
					</uni-tr>
				</uni-table>
			</unicloud-db>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const opCenter = uniCloud.importObject('a-operation-center');

export default {
	data() {
		return {
			currentTab: 'guide',
			// 缓存各角色的考核数据 map
			guideMap: {},
			saleMap: {},
			guideTotal: 0,
			// 搜索条件（合并为一个关键词）
			searchGuide: { keyword: '' },
			searchSale: { keyword: '' },
			searchAttendant: { keyword: '' },
			// where 条件
			guideWhere: '',
			saleWhere: "role == 'sale'",
			attendantWhere: "role == 'attendant'",
			// 排序相关
			guideSortField: '',
			guideSortOrder: 'desc',
			guideOrderBy: ''
		};
	},
	methods: {
		switchTab(tab) {
			this.currentTab = tab;
			this.$nextTick(() => {
				if (tab === 'sale' && this.$refs.udbSale) this.$refs.udbSale.loadData();
				if (tab === 'guide' && this.$refs.udbGuide) this.$refs.udbGuide.loadData();
				if (tab === 'attendant' && this.$refs.udbAttendant) this.$refs.udbAttendant.loadData();
			});
		},
		navigateTo(url) {
			uni.navigateTo({ url });
		},

		// --- 私导相关方法 ---
		async onLoadGuideData(data, ended, pagination) {
			if (pagination) {
				this.guideTotal = pagination.total || pagination.count || 0;
			} else if (this.$refs.udbGuide) {
				this.$nextTick(() => {
					this.guideTotal = this.$refs.udbGuide.total || 0;
				});
			}

			try {
				const res = await opCenter.getAssessmentData({ role: 'guide' });
				if (res.data) {
					const map = {};
					res.data.forEach((item) => {
						const orderCount = item.dimensions && item.dimensions.length > 0 ? item.dimensions[0].metrics.order_count : 0;
						map[item.user_id] = { score: item.total_score, count: orderCount };
					});
					this.guideMap = map;

					if (this.guideSortField && this.$refs.udbGuide && this.$refs.udbGuide.dataList) {
						const list = this.$refs.udbGuide.dataList;
						const isDesc = this.guideSortOrder === 'desc';
						const field = this.guideSortField; // 'rating' 或 'order_count'

						list.sort((a, b) => {
							// 获取两个对象的实时数据
							const dataA = this.getRealData(a);
							const dataB = this.getRealData(b);

							let valA = 0;
							let valB = 0;

							if (field === 'rating') {
								valA = Number(dataA.score) || 0;
								valB = Number(dataB.score) || 0;
							} else if (field === 'order_count') {
								valA = Number(dataA.count) || 0;
								valB = Number(dataB.count) || 0;
							}

							if (valA === valB) return 0;
							return isDesc ? valB - valA : valA - valB;
						});
					}
				}
			} catch (e) {
				console.error(e);
			}
		},
		getRealData(item) {
			// 处理私导数据映射
			// 1. 如果传的是私导 item 对象
			if (item.user_id && Array.isArray(item.user_id)) {
				const uid = item.user_id[0] ? item.user_id[0]._id : '';
				return this.guideMap[uid] || { score: '-', count: '-' };
			}
			// 2. 如果传的是销售 user_id 字符串
			if (typeof item === 'string') {
				return this.saleMap[item] || { score: '-', sales: 0 };
			}
			return {};
		},
		viewOrders(item) {
			const uid = item.user_id && item.user_id[0] ? item.user_id[0]._id : '';
			if (!uid) return uni.showToast({ title: '未关联用户ID', icon: 'none' });
			uni.navigateTo({ url: `/pages/snapshots/table?staff_id=${uid}` });
		},
		managePortfolio(userId, name) {
			uni.navigateTo({ url: `./guide-portfolio?user_id=${userId}&name=${name}` });
		},
		deleteGuide(id) {
			this.$refs.udbGuide.remove(id, {
				needConfirm: true,
				confirmTitle: '提示',
				confirmContent: '确定删除此档案？',
				success: () => this.$refs.udbGuide.loadData()
			});
		},
		previewImage(url) {
			if (url) uni.previewImage({ urls: [url] });
		},

		// --- 销售相关方法 ---
		async onLoadSaleData(data) {
			const res = await opCenter.getAssessmentData({ role: 'sale' });
			if (res.data) {
				const map = {};
				res.data.forEach((item) => {
					const metrics = item.dimensions?.[0]?.metrics || {};
					const totalSales = (metrics.sales_amount_ctrip || 0) + (metrics.sales_amount_other || 0);
					map[item.user_id] = { score: item.total_score, sales: totalSales };
				});
				this.saleMap = map;
			}
		},

		// --- 管家相关方法 ---
		onLoadAttendantData(data) {
			// 管家数据暂无实时API聚合，直接显示列表，点击进去编辑
		},

		// 通用编辑跳转
		editProfile(role, userId, nickname) {
			if (role === 'sale') {
				uni.navigateTo({ url: `./sale-profile-edit?user_id=${userId}&nickname=${nickname}` });
			} else if (role === 'attendant') {
				uni.navigateTo({ url: `./attendant-profile-edit?user_id=${userId}&nickname=${nickname}` });
			}
		},

		getScoreColor(score) {
			if (typeof score !== 'number') return 'text-gray-400';
			if (score >= 90) return 'text-green-600';
			if (score >= 80) return 'text-blue-600';
			if (score >= 60) return 'text-orange-600';
			return 'text-red-600';
		},

		// 搜索方法
		handleSearch(type) {
			const dbCmd = db.command;

			if (type === 'guide') {
				const keyword = this.searchGuide.keyword && this.searchGuide.keyword.trim();
				if (keyword) {
					// 使用 $or 同时搜索姓名和电话
					this.guideWhere = dbCmd.or([{ real_name: new RegExp(keyword) }, { mobile: new RegExp(keyword) }]);
				} else {
					this.guideWhere = '';
				}
				this.$nextTick(() => {
					if (this.$refs.udbGuide) this.$refs.udbGuide.loadData({ current: 1 });
				});
			} else if (type === 'sale') {
				const keyword = this.searchSale.keyword && this.searchSale.keyword.trim();
				const whereParts = [{ role: 'sale' }];
				if (keyword) {
					whereParts.push(dbCmd.or([{ nickname: new RegExp(keyword) }, { mobile: new RegExp(keyword) }]));
				}
				if (whereParts.length === 1) {
					this.saleWhere = whereParts[0];
				} else {
					this.saleWhere = dbCmd.and(whereParts);
				}
				this.$nextTick(() => {
					if (this.$refs.udbSale) this.$refs.udbSale.loadData({ current: 1 });
				});
			} else if (type === 'attendant') {
				const keyword = this.searchAttendant.keyword && this.searchAttendant.keyword.trim();
				const whereParts = [{ role: 'attendant' }];
				if (keyword) {
					whereParts.push(dbCmd.or([{ nickname: new RegExp(keyword) }, { mobile: new RegExp(keyword) }]));
				}
				if (whereParts.length === 1) {
					this.attendantWhere = whereParts[0];
				} else {
					this.attendantWhere = dbCmd.and(whereParts);
				}
				this.$nextTick(() => {
					if (this.$refs.udbAttendant) this.$refs.udbAttendant.loadData({ current: 1 });
				});
			}
		},

		// 重置搜索
		handleReset(type) {
			const dbCmd = db.command;

			if (type === 'guide') {
				this.searchGuide = { keyword: '' };
				this.guideWhere = '';
				this.guideSortField = '';
				this.guideSortOrder = 'desc';
				this.guideOrderBy = '';
				this.$nextTick(() => {
					if (this.$refs.udbGuide) this.$refs.udbGuide.loadData({ current: 1 });
				});
			} else if (type === 'sale') {
				this.searchSale = { keyword: '' };
				this.saleWhere = { role: 'sale' };
				this.$nextTick(() => {
					if (this.$refs.udbSale) this.$refs.udbSale.loadData({ current: 1 });
				});
			} else if (type === 'attendant') {
				this.searchAttendant = { keyword: '' };
				this.attendantWhere = { role: 'attendant' };
				this.$nextTick(() => {
					if (this.$refs.udbAttendant) this.$refs.udbAttendant.loadData({ current: 1 });
				});
			}
		},

		// 排序切换
		handleSort(field) {
			if (this.guideSortField === field) {
				// 同一字段，切换排序方向
				this.guideSortOrder = this.guideSortOrder === 'asc' ? 'desc' : 'asc';
			} else {
				// 新字段，默认降序
				this.guideSortField = field;
				this.guideSortOrder = 'desc';
			}
			this.guideOrderBy = `${field} ${this.guideSortOrder}`;
			this.$nextTick(() => {
				if (this.$refs.udbGuide) this.$refs.udbGuide.loadData({ current: 1 });
			});
		}
	}
};
</script>
