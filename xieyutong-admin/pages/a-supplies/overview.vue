{ type: uploaded file fileName: overview.vue fullContent:
<template>
	<view class="min-h-screen bg-gray-50">
		<view class="bg-white shadow-sm sticky top-0 z-10">
			<view class="px-4 py-3">
				<uni-segmented-control :current="currentTab" :values="['流转监控', '服务配置', '物资管理']" style-type="text" active-color="#eb6d20" @clickItem="onClickTab" />
			</view>
		</view>

		<view class="p-6">
			<view v-if="currentTab === 0">
				<view class="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
					<view class="flex justify-between items-center mb-4">
						<h2 class="text-xl font-bold text-gray-800">物资流转监控</h2>
						<view class="flex gap-2">
							<button class="bg-brand-orange text-white px-3 py-1.5 rounded-lg text-sm flex items-center shadow-sm hover:opacity-90" @click="goOrderForm()">
								<uni-icons type="plus" color="#fff" size="14" class="mr-1"></uni-icons>
								新增记录
							</button>
							<button class="text-gray-500 text-sm flex items-center bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors" @click="loadSuppliesFlowList">
								<uni-icons type="refresh" size="14" class="mr-1"></uni-icons>
								刷新
							</button>
						</view>
					</view>

					<!-- 筛选区域 -->
					<view class="bg-gray-50 rounded-lg p-4 mb-4">
						<view class="flex flex-wrap gap-3 items-center">
							<!-- 管家筛选 -->
							<view class="flex items-center gap-2">
								<text class="text-sm text-gray-600">管家:</text>
								<uni-data-select v-model="filterAttendant" :localdata="attendantOptions" placeholder="全部管家" style="width: 140px" @change="handleFilterChange" />
							</view>

							<!-- 出发时间筛选 -->
							<view class="flex items-center gap-2">
								<text class="text-sm text-gray-600">出发时间:</text>
								<uni-datetime-picker 
									v-model="filterDateRange" 
									type="daterange" 
									placeholder="选择日期范围" 
									style="width: 320px" 
									@change="handleDateChange"
									@maskClick="handleDateClear" />
							</view>

							<!-- 搜索框 -->
							<view class="flex items-center gap-2 flex-1">
								<uni-easyinput 
									v-model="searchKeyword" 
									placeholder="搜索订单号或客人姓名" 
									prefix-icon="search" 
									:clearable="true"
									style="width: 200px" 
									@confirm="handleFilterChange"
									@clear="handleSearchClear" />
								<button class="bg-blue-600 text-white px-3 py-1.5 rounded text-sm" @click="handleFilterChange">搜索</button>
							</view>
						</view>
					</view>

					<!-- 表格区域 -->
					<view v-if="flowLoading" class="py-10 text-center text-gray-400">加载中...</view>
					<view v-else-if="flowError" class="text-red-500">{{ flowError }}</view>
					<template v-else>
						<uni-table border stripe emptyText="暂无流转数据">
							<uni-tr>
								<uni-th width="160">订单号/行程信息</uni-th>
								<uni-th width="140">人员信息</uni-th>
								<uni-th width="200">留言/备注</uni-th>
								<uni-th>物资流转明细</uni-th>
								<uni-th width="100">凭证记录</uni-th>
								<uni-th width="100" align="center">操作</uni-th>
							</uni-tr>
							<uni-tr v-for="item in flowList" :key="item._id">
								<!-- 订单号/行程信息 -->
								<uni-td>
									<view class="mb-1 font-medium">{{ item.order_id || '无订单号' }}</view>
									<view v-if="item.snapshot" class="text-xs text-gray-500 mb-1">
										<uni-dateformat :date="item.snapshot.departure_date" format="yyyy-MM-dd" />
										<text v-if="item.snapshot.total_days" class="ml-1">· {{ item.snapshot.total_days }}天</text>
									</view>
									<view class="text-xs text-gray-400">
										<uni-dateformat :date="item.updated_at" format="MM-dd hh:mm" />
										<span class="px-2 py-0.5 rounded text-xs font-medium ml-2" :class="getStatusClass(item.status)">{{ getStatusText(item.status) }}</span>
									</view>
								</uni-td>

								<!-- 人员信息 -->
								<uni-td>
									<view v-if="getCustomerName(item)" class="mb-1">
										<text class="text-xs text-gray-400 mr-1">客人:</text>
										<text class="text-sm font-medium">{{ getCustomerName(item) }}</text>
									</view>
									<view v-if="getAttendantName(item)" class="text-xs">
										<text class="text-gray-400 mr-1">管家:</text>
										<text class="text-blue-600">{{ getAttendantName(item) }}</text>
									</view>
									<text v-if="!getCustomerName(item) && !getAttendantName(item)" class="text-xs text-gray-300">-</text>
								</uni-td>

								<!-- 留言/备注 -->
								<uni-td>
									<view class="flex flex-col gap-1">
										<view v-if="item.user_remark" class="bg-red-50 p-2 rounded text-xs">
											<text class="text-red-400 font-bold block mb-0.5">客人留言:</text>
											<text class="text-gray-700">{{ item.user_remark }}</text>
										</view>
										<view v-if="item.return_info && item.return_info.remark" class="bg-blue-50 p-2 rounded text-xs">
											<text class="text-blue-400 font-bold block mb-0.5">归还备注:</text>
											<text class="text-gray-700">{{ item.return_info.remark }}</text>
										</view>
										<text v-if="!item.user_remark && (!item.return_info || !item.return_info.remark)" class="text-xs text-gray-300">-</text>
									</view>
								</uni-td>

								<!-- 物资流转明细 -->
								<uni-td>
									<view class="flex flex-wrap gap-1.5">
										<view v-for="(s, i) in item.supplies" :key="i" class="flex items-center bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 text-xs">
											<text class="font-bold text-gray-700 mr-1">{{ s.name || s.id }}</text>
											<text v-if="s.is_consumable" class="text-[10px] text-orange-500 font-medium mr-1">耗</text>

											<view v-if="item.status === 'created'" class="text-gray-500 font-medium">x{{ s.total_quantity || s.quantity }}</view>

											<view v-if="item.status === 'processing'" class="text-blue-600 font-medium">领{{ s.pickup_quantity }}</view>

											<view v-if="item.status === 'completed'" class="flex items-center text-[10px] gap-1 ml-0.5 border-l border-gray-200 pl-1.5">
												<text class="text-gray-400">领{{ s.pickup_quantity }}</text>

												<text v-if="s.return_normal_quantity > 0" class="text-green-600 font-bold">返{{ s.return_normal_quantity }}</text>

												<text v-if="s.is_consumable && (s.pickup_quantity || 0) - (s.return_normal_quantity || 0) > 0" class="text-blue-500 font-bold">
													耗{{ (s.pickup_quantity || 0) - (s.return_normal_quantity || 0) }}
												</text>

												<view v-if="s.return_damaged_quantity > 0" class="flex items-center text-orange-600 font-bold">
													<text>修{{ s.return_damaged_quantity }}</text>
													<view v-if="s.return_evidence && s.return_evidence.length" class="ml-0.5 cursor-pointer hover:opacity-70" @click.stop="previewSimple(s.return_evidence)">
														<uni-icons type="image-filled" size="12" color="#ea580c"></uni-icons>
													</view>
												</view>

												<text v-if="s.return_lost_quantity > 0" class="text-red-600 font-bold">丢{{ s.return_lost_quantity }}</text>
											</view>
										</view>
									</view>
								</uni-td>

								<!-- 凭证记录 -->
								<uni-td>
									<view class="flex flex-col gap-2">
										<view
											v-if="item.pickup_info && item.pickup_info.photos && item.pickup_info.photos.length"
											class="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs flex items-center justify-center transition-colors"
											@click="previewSimple(item.pickup_info.photos)">
											<uni-icons type="camera-filled" size="14" color="#2563eb" class="mr-1"></uni-icons>
											出库照
										</view>

										<view
											v-if="item.return_info && item.return_info.photos && item.return_info.photos.length"
											class="cursor-pointer bg-green-50 hover:bg-green-100 text-green-600 px-2 py-1 rounded text-xs flex items-center justify-center transition-colors"
											@click="previewSimple(item.return_info.photos)">
											<uni-icons type="camera-filled" size="14" color="#059669" class="mr-1"></uni-icons>
											归还照
										</view>

										<text v-if="!item.pickup_info && !item.return_info" class="text-gray-300 text-xs text-center">-</text>
									</view>
								</uni-td>

								<!-- 操作 -->
								<uni-td align="center">
									<view class="flex flex-col gap-2">
										<button class="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded w-full" @click="goOrderForm(item._id)">编辑</button>
										<button class="bg-red-50 text-red-600 text-xs px-2 py-1 rounded w-full" @click="deleteFlowItem(item._id)">删除</button>
									</view>
								</uni-td>
							</uni-tr>
						</uni-table>
						<uni-pagination
							v-if="flowPagination.total > 0"
							show-icon
							:page-size="flowPagination.size"
							:current="flowPagination.current"
							:total="flowPagination.total"
							class="mt-3"
							@change="handleFlowPageChange" />
					</template>
				</view>
			</view>

			<view v-if="currentTab === 1">
				<view class="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
					<view class="flex justify-between items-center mb-6">
						<view>
							<h2 class="text-xl font-bold text-gray-800">服务配置</h2>
							<p class="text-sm text-gray-500 mt-1">配置服务及所需物资，供用户选择</p>
						</view>
						<button class="bg-brand-orange text-white px-3 py-1.5 rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center text-sm" @click="goServiceForm()">
							<uni-icons type="plus" color="#fff" size="14" class="mr-1"></uni-icons>
							新增服务
						</button>
					</view>

					<unicloud-db ref="udbServices" collection="a-services" :getcount="true" page-data="replace" v-slot:default="{ data, loading, error, pagination }">
						<view v-if="loading" class="py-10 text-center">加载中...</view>
						<view v-else-if="error" class="text-red-500">{{ error.message }}</view>
						<uni-table border stripe emptyText="暂无服务配置" v-else>
							<uni-tr>
								<uni-th width="150">服务名称</uni-th>
								<uni-th width="200">描述</uni-th>
								<uni-th>包含物资</uni-th>
								<uni-th width="80" align="center">默认</uni-th>
								<uni-th width="80" align="center">启用</uni-th>
								<uni-th width="120" align="center">操作</uni-th>
							</uni-tr>
							<uni-tr v-for="item in data" :key="item._id">
								<uni-td>
									<text class="font-bold text-gray-700">{{ item.name }}</text>
									<view v-if="item.is_consumable" class="ml-2 px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[10px] rounded border border-orange-200 leading-none">耗</view>
								</uni-td>
								<uni-td>
									<text class="text-gray-500 text-sm line-clamp-2">{{ item.description || '-' }}</text>
								</uni-td>
								<uni-td>
									<view class="flex flex-wrap gap-2">
										<view v-for="(sub, idx) in item.supplies" :key="idx" class="bg-blue-50 px-2 py-1 rounded text-xs text-blue-600 border border-blue-100">
											{{ supplyMap[sub.id] ? supplyMap[sub.id].name : '加载中...' }}

											<text
												v-if="supplyMap[sub.id] && supplyMap[sub.id].is_consumable"
												class="ml-1 text-[10px] px-1 bg-orange-50 text-orange-600 border border-orange-200 rounded leading-none">
												耗
											</text>

											<text class="ml-1 font-bold">
												{{ supplyMap[sub.id] && supplyMap[sub.id].allocation_type === 'group' ? 'x' + sub.quantity : '' }}
											</text>
										</view>
									</view>
								</uni-td>
								<uni-td align="center">
									<switch :checked="!!item.is_default" color="#007aff" style="transform: scale(0.7)" @change="handleSwitch('is_default', item, 'udbServices', $event)" />
								</uni-td>
								<uni-td align="center">
									<switch :checked="!!item.status" color="#eb6d20" style="transform: scale(0.7)" @change="handleSwitch('status', item, 'udbServices', $event)" />
								</uni-td>
								<uni-td align="center">
									<view class="flex justify-center gap-2">
										<button class="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded" @click="goServiceForm(item._id)">编辑</button>
										<button class="bg-red-50 text-red-600 text-xs px-2 py-1 rounded" @click="deleteItem('udbServices', item._id)">删除</button>
									</view>
								</uni-td>
							</uni-tr>
						</uni-table>
						<uni-pagination
							v-if="pagination"
							show-icon
							:page-size="pagination.size"
							:current="pagination.current"
							:total="pagination.count"
							class="mt-3"
							@change="(e) => handlePageChanged(e, 'udbServices')" />
					</unicloud-db>
				</view>
			</view>

			<view v-if="currentTab === 2">
				<view class="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
					<view class="flex justify-between items-center mb-6">
						<view>
							<h2 class="text-xl font-bold text-gray-800">物资管理</h2>
							<p class="text-sm text-gray-500 mt-1">管理所有物资</p>
						</view>
						<button class="bg-emerald-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center text-sm" @click="goSupplyForm()">
							<uni-icons type="plus" color="#fff" size="14" class="mr-1"></uni-icons>
							入库物资
						</button>
					</view>

					<unicloud-db
						ref="udbSupplies"
						collection="a-supplies"
						where="is_config != true"
						:getcount="true"
						page-data="replace"
						v-slot:default="{ data, loading, error, pagination }">
						<view v-if="loading" class="py-10 text-center">加载中...</view>
						<view v-else-if="error" class="text-red-500">{{ error.message }}</view>
						<uni-table border stripe emptyText="暂无物资" v-else>
							<uni-tr>
								<uni-th width="60" align="center">媒体</uni-th>
								<uni-th width="120">名称</uni-th>
								<uni-th width="200">描述</uni-th>
								<uni-th width="60">分类</uni-th>
								<uni-th width="80" align="center">分配方式</uni-th>
								<uni-th width="40" align="center">单位</uni-th>
								<uni-th width="80" align="center">库存</uni-th>
								<uni-th width="80" align="center">默认</uni-th>
								<uni-th width="80" align="center">启用</uni-th>
								<uni-th width="120" align="center">操作</uni-th>
							</uni-tr>
							<uni-tr v-for="item in data" :key="item._id">
								<uni-td align="center">
									<view
										v-if="getDisplayMedia(item)"
										class="relative w-10 h-10 rounded bg-gray-100 flex items-center justify-center mx-auto overflow-hidden cursor-pointer border border-gray-200"
										@click="openPreview(item)">
										<image v-if="getDisplayMedia(item).type === 'image'" :src="getDisplayMedia(item).url" mode="aspectFill" class="w-full h-full"></image>
										<view v-else class="flex items-center justify-center w-full h-full bg-slate-800">
											<uni-icons type="videocam-filled" size="20" color="#fff"></uni-icons>
										</view>
										<view v-if="getMediaList(item).length > 1" class="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1 rounded-tl-sm font-bold">
											+{{ getMediaList(item).length - 1 }}
										</view>
									</view>

									<view v-else class="w-8 h-8 rounded bg-gray-50 flex items-center justify-center mx-auto text-gray-300">
										<uni-icons type="image" size="16"></uni-icons>
									</view>
								</uni-td>
								<uni-td>
									<view class="flex">
										<text class="font-bold text-gray-800">{{ item.name }}</text>
										<view v-if="item.is_consumable" class="ml-2 px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[10px] rounded border border-orange-200 leading-none w-6">耗</view>
									</view>
								</uni-td>
								<uni-td>
									<text class="font-bold text-gray-800">{{ item.description }}</text>
								</uni-td>
								<uni-td>
									<span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{{ item.category || '通用' }}</span>
								</uni-td>
								<uni-td align="center">
									<span class="text-xs px-2 py-1 rounded" :class="item.allocation_type === 'group' ? 'bg-purple-50 text-purple-600' : 'bg-cyan-50 text-cyan-600'">
										{{ item.allocation_type === 'group' ? '按团' : '按人' }}
									</span>
								</uni-td>
								<uni-td align="center">{{ item.unit }}</uni-td>
								<uni-td align="center">
									<text :class="item.stock < 10 ? 'text-red-500 font-bold' : 'text-gray-600'">{{ item.stock }}</text>
								</uni-td>
								<uni-td align="center">
									<switch :checked="!!item.is_default" color="#007aff" style="transform: scale(0.7)" @change="handleSwitch('is_default', item, 'udbSupplies', $event)" />
								</uni-td>
								<uni-td align="center">
									<switch :checked="item.status" color="#10b981" style="transform: scale(0.7)" @change="handleSwitch('status', item, 'udbSupplies', $event)" />
								</uni-td>
								<uni-td align="center">
									<view class="flex justify-center gap-2">
										<button class="bg-emerald-50 text-emerald-600 text-xs px-2 py-1 rounded" @click="goSupplyForm(item._id)">编辑</button>
										<button class="bg-red-50 text-red-600 text-xs px-2 py-1 rounded" @click="deleteItem('udbSupplies', item._id)">删除</button>
									</view>
								</uni-td>
							</uni-tr>
						</uni-table>
						<uni-pagination
							v-if="pagination"
							show-icon
							:page-size="pagination.size"
							:current="pagination.current"
							:total="pagination.count"
							class="mt-3"
							@change="(e) => handlePageChanged(e, 'udbSupplies')" />
					</unicloud-db>
				</view>
			</view>
		</view>

		<view v-if="showPreview" class="fixed inset-0 z-[9999] bg-black flex flex-col animate-fade-in" @click.self="closePreview">
			<view class="absolute top-4 right-4 z-50 p-2 cursor-pointer bg-white/20 rounded-full hover:bg-white/30 transition-colors" @click="closePreview">
				<uni-icons type="closeempty" size="24" color="#fff"></uni-icons>
			</view>

			<swiper class="flex-1 w-full h-full" :current="previewIndex" :indicator-dots="true" indicator-color="rgba(255,255,255,0.3)" indicator-active-color="#fff">
				<swiper-item v-for="(media, idx) in previewList" :key="idx" class="flex items-center justify-center">
					<view class="w-full h-full flex items-center justify-center">
						<image v-if="media.type === 'image'" :src="media.url" mode="aspectFit" class="w-full h-full" />
						<video v-else :src="media.url" controls autoplay class="w-full max-h-screen"></video>
					</view>
				</swiper-item>
			</swiper>

			<view class="text-white text-center pb-8 pt-4">{{ previewIndex + 1 }} / {{ previewList.length }}</view>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const supplyService = uniCloud.importObject('a-supply-service');

export default {
	data() {
		return {
			currentTab: 0,
			// 预览相关状态
			showPreview: false,
			previewList: [],
			previewIndex: 0,
			supplyMap: {},

			// 物资流转列表数据
			flowList: [],
			flowLoading: false,
			flowError: '',
			flowPagination: {
				current: 1,
				size: 20,
				total: 0
			},

			// 筛选条件
			filterAttendant: '',
			filterDateRange: [],
			searchKeyword: '',

			// 管家选项
			attendantOptions: []
		};
	},
	onShow() {
		this.refreshCurrentTab();
		// 加载管家列表
		this.loadAttendantOptions();
		// 加载物资流转列表
		if (this.currentTab === 0) {
			this.loadSuppliesFlowList();
		}
	},
	methods: {
		onClickTab(e) {
			this.currentTab = e.currentIndex;
			this.$nextTick(() => {
				this.refreshCurrentTab();
				// 如果切换到服务配置Tab，加载物资字典
				if (this.currentTab === 1) {
					this.loadSupplyMap();
				}
			});
		},
		handlePageChanged(e, refName) {
			this.$refs[refName].loadData({
				current: e.current
			});
		},
		// 加载物资字典
		async loadSupplyMap() {
			// 只查询需要的字段，减少流量
			const res = await db.collection('a-supplies').field('_id, name, is_consumable, allocation_type').get();

			const map = {};
			res.result.data.forEach((item) => {
				map[item._id] = item;
			});
			this.supplyMap = map;
		},
		refreshCurrentTab() {
			if (this.currentTab === 1 && this.$refs.udbServices) this.$refs.udbServices.loadData({ clear: true });
			if (this.currentTab === 2 && this.$refs.udbSupplies) this.$refs.udbSupplies.loadData({ clear: true });
			// 流转监控Tab使用手动加载
			if (this.currentTab === 0) {
				this.loadSuppliesFlowList();
			}
		},

		// --- 物资流转列表相关方法 ---

		// 加载管家选项
		async loadAttendantOptions() {
			try {
				const res = await db.collection('uni-id-users').where({ role: 'attendant' }).field('_id, nickname, username').get();

				if (res.result.data) {
					this.attendantOptions = [
						{ value: '', text: '全部管家' },
						{ value: 'unassigned', text: '未分配' },
						...res.result.data.map((item) => ({
							value: item._id,
							text: item.nickname || item.username || '未命名'
						}))
					];
				}
			} catch (e) {
				console.error('加载管家列表失败:', e);
			}
		},

		// 加载物资流转列表
		async loadSuppliesFlowList() {
			this.flowLoading = true;
			this.flowError = '';

			try {
				const params = {
					page: this.flowPagination.current,
					size: this.flowPagination.size
				};

				// 管家筛选
				if (this.filterAttendant) {
					params.attendantId = this.filterAttendant;
				}

				// 日期筛选 - 转换为时间戳
				if (this.filterDateRange && this.filterDateRange.length === 2) {
					// uni-datetime-picker 返回的是日期字符串，需要转换为时间戳
					// 开始日期设为当天的 00:00:00
					const startDate = new Date(this.filterDateRange[0]);
					startDate.setHours(0, 0, 0, 0);
					params.startDate = startDate.getTime();

					// 结束日期设为当天的 23:59:59
					const endDate = new Date(this.filterDateRange[1]);
					endDate.setHours(23, 59, 59, 999);
					params.endDate = endDate.getTime();
				}

				// 关键词搜索
				if (this.searchKeyword.trim()) {
					params.keyword = this.searchKeyword.trim();
				}

				const res = await supplyService.getSuppliesFlowList(params);

				if (res.errCode === 0) {
					this.flowList = res.data || [];
					this.flowPagination.total = res.total || 0;
				} else {
					this.flowError = res.msg || '加载失败';
				}
			} catch (e) {
				console.error('加载物资流转列表失败:', e);
				this.flowError = '加载失败: ' + e.message;
			} finally {
				this.flowLoading = false;
			}
		},

		// 筛选条件变化
		handleFilterChange() {
			this.flowPagination.current = 1;
			this.loadSuppliesFlowList();
		},

		// 日期选择变化
		handleDateChange(e) {
			// 当日期被清除时（e 为 null 或空数组）
			if (!e || (Array.isArray(e) && e.length === 0)) {
				this.filterDateRange = [];
			} else {
				this.filterDateRange = e;
			}
			this.handleFilterChange();
		},

		// 日期选择器点击遮罩关闭（清除）
		handleDateClear() {
			this.filterDateRange = [];
			this.handleFilterChange();
		},

		// 搜索框清空
		handleSearchClear() {
			this.searchKeyword = '';
			this.handleFilterChange();
		},

		// 分页变化
		handleFlowPageChange(e) {
			this.flowPagination.current = e.current;
			this.loadSuppliesFlowList();
		},

		// 获取客人姓名
		getCustomerName(item) {
			try {
				if (
					item.taskOrder &&
					item.taskOrder.raw_data &&
					item.taskOrder.raw_data[0] &&
					item.taskOrder.raw_data[0].order_context &&
					item.taskOrder.raw_data[0].order_context.travelers &&
					item.taskOrder.raw_data[0].order_context.travelers.length > 0
				) {
					return item.taskOrder.raw_data[0].order_context.travelers[0].name || '';
				}
			} catch (e) {
				console.error('解析客人姓名失败:', e);
			}
			return '';
		},

		// 获取管家姓名
		getAttendantName(item) {
			try {
				if (item.snapshot && item.snapshot.staves && Array.isArray(item.snapshot.staves)) {
					const attendant = item.snapshot.staves.find((s) => s.role === 'attendant' || (Array.isArray(s.role) && s.role.includes('attendant')));
					if (attendant) {
						return attendant.nickname || attendant.name || '';
					}
				}
			} catch (e) {
				console.error('解析管家姓名失败:', e);
			}
			return '';
		},

		// 删除物资流转记录
		deleteFlowItem(id) {
			uni.showModal({
				title: '确认删除?',
				content: '删除后此数据将无法恢复',
				success: (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '删除中...' });
						db.collection('a-order-supplies')
							.doc(id)
							.remove()
							.then(() => {
								uni.showToast({ title: '已删除' });
								this.loadSuppliesFlowList();
							})
							.catch((err) => {
								uni.showToast({ title: '删除失败: ' + err.message, icon: 'none' });
							})
							.finally(() => {
								uni.hideLoading();
							});
					}
				}
			});
		},

		// --- 导航 ---
		goServiceForm(id) {
			const url = id ? `/pages/a-supplies/services?id=${id}` : '/pages/a-supplies/services';
			uni.navigateTo({ url });
		},
		goSupplyForm(id) {
			const url = id ? `/pages/a-supplies/supplies?id=${id}` : '/pages/a-supplies/supplies';
			uni.navigateTo({ url });
		},
		goOrderForm(id) {
			const url = id ? `/pages/a-supplies/orders?id=${id}` : '/pages/a-supplies/orders';
			uni.navigateTo({ url });
		},

		// --- 媒体处理 ---

		// 统一将数据标准化为 [{url, type}] 数组
		getMediaList(item) {
			if (!item.image) return [];

			// 新版数据：已经是数组
			if (Array.isArray(item.image)) {
				return item.image;
			}

			// 兼容旧版数据：字符串
			if (typeof item.image === 'string') {
				const isVideo = item.image.match(/\.(mp4|mov|avi|webm)$/i) || item.file_type === 'video';
				return [
					{
						url: item.image,
						type: isVideo ? 'video' : 'image'
					}
				];
			}
			return [];
		},

		// 获取列表中显示的第一张缩略图
		getDisplayMedia(item) {
			const list = this.getMediaList(item);
			return list.length > 0 ? list[0] : null;
		},

		// 打开预览弹窗 (用于物资列表)
		openPreview(item) {
			const list = this.getMediaList(item);
			if (list.length === 0) return;

			this.previewList = list;
			this.previewIndex = 0;
			this.showPreview = true;
		},

		// 简单的字符串数组预览 (用于凭证照片)
		previewSimple(urls) {
			if (!urls || urls.length === 0) return;
			this.previewList = urls.map((url) => ({
				url: url,
				type: 'image' // 默认凭证都是图片
			}));
			this.previewIndex = 0;
			this.showPreview = true;
		},

		closePreview() {
			this.showPreview = false;
			this.previewList = [];
		},

		// --- 通用业务逻辑 ---
		getStatusText(status) {
			const map = { created: '待领用', processing: '使用中', completed: '已归还' };
			return map[status] || status;
		},
		getStatusClass(status) {
			if (status === 'created') return 'bg-orange-100 text-orange-600';
			if (status === 'processing') return 'bg-blue-100 text-blue-600';
			return 'bg-green-100 text-green-600';
		},
		handleSwitch(field, item, refName, e) {
			// 1. 获取目标状态（用户点击后，开关变成的状态）
			// 如果传入了事件对象，使用 e.detail.value，否则取反
			const targetValue = e ? e.detail.value : !item[field];

			// 2. 生成提示文案
			const actionText = field === 'status' ? (targetValue ? '启用' : '停用') : targetValue ? '设为默认' : '取消默认';

			// 3. 先临时更新本地数据，让 UI 保持用户点击后的状态
			item[field] = targetValue;

			uni.showModal({
				title: '确认操作',
				content: `确定要${actionText}【${item.name}】吗？`,
				success: (res) => {
					if (res.confirm) {
						// --- 用户点击确认 ---
						// 执行数据库更新
						this.$refs[refName].update(
							item._id,
							{ [field]: targetValue },
							{
								toastTitle: '设置成功',
								success: () => {
									console.log('Update success');
								},
								fail: () => {
									// 数据库更新失败，回滚状态
									this.$nextTick(() => {
										item[field] = !targetValue;
									});
								}
							}
						);
					} else {
						// --- 用户点击取消 ---
						this.$nextTick(() => {
							item[field] = !targetValue;
						});
					}
				}
			});
		},
		deleteItem(refName, id) {
			this.$refs[refName].remove(id, {
				confirmTitle: '确认删除?',
				confirmContent: '删除后此数据将无法恢复',
				success: () => {
					uni.showToast({ title: '已删除' });
				}
			});
		}
	}
};
</script>

<style>
.bg-brand-orange {
	background-color: #eb6d20;
}
.animate-fade-in {
	animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(5px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
.uni-table-td {
	vertical-align: middle !important;
}
</style>
