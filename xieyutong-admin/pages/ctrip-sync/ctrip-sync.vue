<template>
	<view class="min-h-screen bg-gray-50 font-sans">
		<view class="bg-white border-b border-gray-200 shadow-sm">
			<view class="max-w-7xl mx-auto px-6 py-4">
				<view class="flex items-center justify-between">
					<view class="flex items-center">
						<i class="fas fa-sync-alt text-blue-600 text-2xl mr-4"></i>
						<view>
							<text class="text-2xl font-bold text-gray-900" style="font-family: 'Microsoft YaHei', sans-serif">携程商品同步</text>
							<text class="text-sm text-gray-500 block mt-1">输入商品ID，一键同步商品全部线路</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="max-w-7xl mx-auto px-6 py-8">
			<view class="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
				<view class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
					<view class="flex items-center">
						<i class="fas fa-search text-blue-600 text-xl mr-3"></i>
						<text class="text-xl font-semibold text-gray-800" style="font-family: 'Microsoft YaHei', sans-serif">商品信息查询与同步</text>
					</view>
				</view>

				<view class="p-8">
					<view class="mb-8">
						<view class="flex items-center mb-4">
							<view class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</view>
							<text class="text-lg font-medium text-gray-700" style="font-family: 'Microsoft YaHei', sans-serif">输入商品ID</text>
						</view>

						<view class="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
							<view class="lg:col-span-2">
								<uni-easyinput
									v-model="mainProductId"
									placeholder="请输入携程商品ID，例如：41767537"
									:clearable="true"
									:inputBorder="true"
									:styles="{
										color: '#1f2937',
										backgroundColor: '#ffffff',
										borderColor: '#d1d5db',
										borderRadius: '8px',
										fontSize: '18px',
										fontFamily: 'Microsoft YaHei, sans-serif',
										padding: '16px 24px',
										minHeight: '56px'
									}"></uni-easyinput>
							</view>

							<view class="lg:col-span-1">
								<button
									class="w-full px-6 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
									style="font-family: 'Microsoft YaHei', sans-serif"
									@click="getRouteIds"
									:disabled="loadingRouteIds || !mainProductId.trim() || loadingReviews">
									<i class="fas fa-search mr-2" :class="{ 'fa-spin': loadingRouteIds }"></i>
									<text v-if="!loadingRouteIds">获取商品线路</text>
									<text v-else>查询中...</text>
								</button>
							</view>

							<view class="lg:col-span-1">
								<button
									class="w-full px-6 py-4 bg-purple-600 text-white text-lg font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
									style="font-family: 'Microsoft YaHei', sans-serif"
									@click="syncReviews"
									:disabled="loadingReviews || !mainProductId.trim() || loadingRouteIds">
									<i class="fas fa-star mr-2" :class="{ 'fa-spin': loadingReviews }"></i>
									<text v-if="!loadingReviews">同步评价</text>
									<text v-else>同步中...</text>
								</button>
							</view>
						</view>

						<view v-if="reviewSyncResult" class="mt-4 p-4 rounded-lg" :class="reviewSyncResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
							<view class="flex items-center">
								<i class="fas" :class="reviewSyncResult.success ? 'fa-check-circle text-green-600' : 'fa-exclamation-triangle text-red-600'"></i>
								<text class="ml-3 text-sm font-medium" :class="reviewSyncResult.success ? 'text-green-800' : 'text-red-800'">
									{{ reviewSyncResult.message }}
								</text>
							</view>
						</view>
					</view>

					<view v-if="routeIdList.length > 0" class="mb-8">
						<view class="flex items-center justify-between mb-4">
							<view class="flex items-center">
								<view class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</view>
								<text class="text-lg font-medium text-gray-700" style="font-family: 'Microsoft YaHei', sans-serif">选择要同步的线路 (共 {{ routeIdList.length }} 条)</text>
							</view>
							<view class="flex space-x-2">
								<button class="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300" @click="toggleSelectAll(true)">全选</button>
								<button class="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300" @click="toggleSelectAll(false)">全不选</button>
							</view>
						</view>

						<view class="bg-gray-50 rounded-lg p-6 border border-gray-200">
							<view class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								<label
									v-for="route in routeIdList"
									:key="route.id"
									class="flex items-center p-3 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-all"
									@click.prevent="toggleRouteSelection(route)">
									<checkbox :value="route.id" :checked="route.selected" class="transform scale-110 mr-3" />
									<text class="font-medium text-gray-800">{{ route.id }}</text>
									<text v-if="route.exists" class="ml-auto text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">已存在</text>
									<text v-else class="ml-auto text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">新商品</text>
								</label>
							</view>

							<view class="mt-6 flex items-center justify-between">
								<view class="text-sm text-gray-500">
									<i class="fas fa-info-circle mr-1"></i>
									已选择 {{ selectedRouteIds.length }} 条线路
								</view>
								<button
									class="px-8 py-3 bg-indigo-600 text-white text-lg font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
									style="font-family: 'Microsoft YaHei', sans-serif"
									@click="fetchProductDetails"
									:disabled="loadingProductDetails || selectedRouteIds.length === 0">
									<i class="fas fa-download mr-2" :class="{ 'fa-spin': loadingProductDetails }"></i>
									<text v-if="!loadingProductDetails">获取商品详情</text>
									<text v-else>获取中...</text>
								</button>
							</view>
						</view>
					</view>

					<view v-if="productDetailList.length > 0" class="mb-8">
						<view class="flex items-center mb-4">
							<view class="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</view>
							<text class="text-lg font-medium text-gray-700" style="font-family: 'Microsoft YaHei', sans-serif">确认商品信息</text>
						</view>

						<view class="space-y-4">
							<view v-for="(product, index) in productDetailList" :key="product.id" class="bg-gray-50 rounded-lg p-4 border border-gray-200">
								<view v-if="product.status === 'loading'" class="flex items-center justify-center py-10">
									<i class="fas fa-spinner fa-spin text-blue-500 text-2xl mr-3"></i>
									<text class="text-gray-600">正在加载 {{ product.id }} 详情...</text>
								</view>

								<view v-else-if="product.status === 'error'" class="flex items-center justify-between">
									<view>
										<text class="font-semibold text-red-600">商品 {{ product.id }} 加载失败</text>
										<text class="text-sm text-gray-500 block mt-1">{{ product.error }}</text>
									</view>
									<view class="flex space-x-2">
										<button class="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700" @click="retryProductDetail(product, index)">重试</button>
										<button class="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300" @click="cancelProductDetail(index)">取消</button>
									</view>
								</view>

								<view v-else-if="product.status === 'success'">
									<view class="grid grid-cols-1 lg:grid-cols-5 gap-4">
										<view class="lg:col-span-3">
											<text class="text-sm font-medium text-gray-500 mb-1">商品 {{ product.id }}</text>
											<text class="text-base font-semibold text-gray-900 block" style="font-family: 'Microsoft YaHei', sans-serif">{{ product.data.title || 'N/A' }}</text>
											<text class="text-sm text-gray-600 block mt-1" style="font-family: 'Microsoft YaHei', sans-serif">{{ product.data.subtitle || 'N/A' }}</text>
										</view>
										<view class="lg:col-span-1">
											<text class="text-sm font-medium text-gray-500 mb-1">价格</text>
											<text class="text-base font-semibold text-red-600" style="font-family: 'Microsoft YaHei', sans-serif">{{ product.data.price || 'N/A' }}</text>
										</view>
										<view class="lg:col-span-1 flex items-center justify-end">
											<button class="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300" @click="cancelProductDetail(index)">取消</button>
										</view>
										<view class="lg:col-span-5" v-if="product.data.images && product.data.images.length > 0">
											<view class="grid grid-cols-10 gap-2">
												<image
													v-for="(img, imgIndex) in product.data.images.slice(0, 10)"
													:key="imgIndex"
													:src="img"
													class="w-full h-16 rounded object-cover border border-gray-200"
													mode="aspectFill"
													@error="handleImageError"></image>
											</view>
										</view>
									</view>
								</view>
							</view>
						</view>

						<view class="mt-6 flex items-center justify-between">
							<view class="text-sm text-gray-500">
								<i class="fas fa-info-circle mr-1"></i>
								将同步 {{ successfulProductIds.length }} 个商品 (已自动过滤失败项)
							</view>
							<button
								class="px-8 py-3 bg-green-600 text-white text-lg font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
								style="font-family: 'Microsoft YaHei', sans-serif"
								@click="startSync"
								:disabled="loadingSync || successfulProductIds.length === 0">
								<i class="fas fa-sync mr-2" :class="{ 'fa-spin': loadingSync }"></i>
								<text v-if="!loadingSync">开始同步商品</text>
								<text v-else>同步中...</text>
							</button>
						</view>
					</view>

					<view v-if="showSyncProgress" class="mb-8">
						<view class="flex items-center mb-4">
							<view class="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</view>
							<text class="text-lg font-medium text-gray-700" style="font-family: 'Microsoft YaHei', sans-serif">同步进度</text>
						</view>

						<view class="bg-gray-50 rounded-lg p-6 border border-gray-200">
							<view class="mb-4 p-4 bg-white rounded-lg border border-gray-200">
								<text class="text-lg font-semibold text-gray-800">同步结果统计</text>
								<view class="flex justify-around mt-2">
									<view class="text-center">
										<text class="text-2xl font-bold text-blue-600 block">{{ syncStats.total }}</text>
										<text class="text-sm text-gray-500">总任务</text>
									</view>
									<view class="text-center">
										<text class="text-2xl font-bold text-green-600 block">{{ syncStats.success }}</text>
										<text class="text-sm text-gray-500">成功</text>
									</view>
									<view class="text-center">
										<text class="text-2xl font-bold text-red-600 block">{{ syncStats.failed }}</text>
										<text class="text-sm text-gray-500">失败</text>
									</view>
								</view>
							</view>

							<view class="space-y-2">
								<view v-for="result in syncResults" :key="result.id" class="flex items-center justify-between p-3 bg-white rounded-lg border">
									<view class="flex items-center">
										<i :class="getStatusIcon(result.status)" class="mr-3 text-lg"></i>
										<text class="font-medium text-gray-700" style="font-family: 'Microsoft YaHei', sans-serif">商品 {{ result.id }}</text>
									</view>
									<view class="flex items-center">
										<text :class="getStatusColor(result.status)" class="text-sm font-medium mr-2" style="font-family: 'Microsoft YaHei', sans-serif">
											{{ getStatusText(result.status) }}
										</text>
										<view v-if="result.status === 'error'" class="text-xs text-red-500 cursor-pointer" @click="showErrorDetail(result.error)">
											<i class="fas fa-exclamation-circle"></i>
										</view>
									</view>
								</view>
							</view>

							<view v-if="!loadingSync" class="mt-6 pt-4 border-t border-gray-200">
								<view class="flex items-center justify-between">
									<button
										v-if="syncStats.failed > 0"
										class="px-6 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 flex items-center disabled:opacity-50"
										@click="retryFailedSyncs"
										:disabled="loadingSync">
										<i class="fas fa-redo mr-2"></i>
										重试失败
									</button>
									<view v-else class="text-sm text-gray-600">
										<i class="fas fa-check-circle text-green-500 mr-2"></i>
										全部同步已完成
									</view>

									<button
										class="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center"
										@click="goToProductList">
										<i class="fas fa-eye mr-2"></i>
										查看商品列表
									</button>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>

			<view v-if="routeIdList.length === 0 && productDetailList.length === 0 && !loadingRouteIds" class="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
				<i class="fas fa-cloud-download-alt text-gray-300 text-6xl mb-6"></i>
				<text class="text-xl text-gray-500 block mb-2" style="font-family: 'Microsoft YaHei', sans-serif">输入商品ID开始查询</text>
				<text class="text-sm text-gray-400" style="font-family: 'Microsoft YaHei', sans-serif">第一步：获取商品包含的所有线路ID</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			mainProductId: '41767537',
			loadingRouteIds: false,
			loadingReviews: false,
			loadingProductDetails: false,
			loadingSync: false,

			routeIdList: [], // 步骤1: { id: '123', exists: true, selected: false }
			reviewSyncResult: null, // 存储评价同步的结果 { success: true/false, message: '...' }
			productDetailList: [], // 步骤2: { id: '123', status: 'loading' | 'success' | 'error', data: {...}, error: '...' }
			syncResults: [], // 步骤3: { id: '123', status: 'loading' | 'success' | 'error', error: '...' }

			syncStats: {
				// 步骤3
				total: 0,
				success: 0,
				failed: 0
			},

			showSyncProgress: false
		};
	},
	computed: {
		/**
		 * 计算属性：获取所有选中的 route ID
		 */
		selectedRouteIds() {
			return this.routeIdList.filter((r) => r.selected).map((r) => r.id);
		},
		/**
		 * 计算属性：获取所有成功加载详情的 product ID
		 */
		successfulProductIds() {
			return this.productDetailList.filter((p) => p.status === 'success').map((p) => p.id);
		}
	},
	methods: {
		// 步骤1：获取商品线路ID
		async getRouteIds() {
			if (!this.mainProductId.trim()) {
				this.$message.warning('请输入商品ID');
				return;
			}

			this.loadingRouteIds = true;
			this.routeIdList = [];
			this.productDetailList = [];
			this.syncResults = [];
			this.showSyncProgress = false;
			this.reviewSyncResult = null;

			try {
				// 1. 调用云函数获取所有 Route IDs
				console.log(`[步骤1] 获取Route IDs, 主ID: ${this.mainProductId.trim()}`);
				const routeResult = await uniCloud.callFunction({
					name: 'ctrip-sync-service',
					data: {
						action: 'getProductRouteIds',
						productId: this.mainProductId.trim()
					}
				});

				if (routeResult.result.errCode !== 0) {
					throw new Error(routeResult.result.errMsg);
				}

				const routeIds = routeResult.result.data.route_ids || [];
				if (routeIds.length === 0) {
					this.$message.warning('未找到任何商品线路ID，请检查主ID是否正确');
					return;
				}
				console.log(`[步骤1] 成功获取 ${routeIds.length} 个Route ID`);

				// 2. 检查哪些ID已经存在
				const checkResult = await uniCloud.callFunction({
					name: 'ctrip-sync-service',
					data: {
						action: 'checkExistingProducts',
						route_ids: routeIds
					}
				});

				if (checkResult.result.errCode !== 0) {
					this.$message.warning(`检查商品存在状态失败: ${checkResult.result.errMsg}。将假定所有商品为新商品。`);
				}

				const existingIds = new Set(checkResult.result.data.existing_ids || []);
				console.log(`[步骤1] ${existingIds.size} 个商品已存在`);

				// 3. 填充 routeIdList
				this.routeIdList = routeIds.map((id) => {
					const exists = existingIds.has(id);
					return {
						id: id,
						exists: exists,
						selected: !exists // 默认勾选不存在的
					};
				});
			} catch (error) {
				console.error('获取商品线路ID失败:', error);
				this.$message.error(error.message || '获取线路ID失败');
			} finally {
				this.loadingRouteIds = false;
			}
		},

		// 步骤1 同步商品评价
		async syncReviews() {
			if (!this.mainProductId.trim()) {
				this.$message.warning('请输入商品ID');
				return;
			}

			this.loadingReviews = true;
			this.reviewSyncResult = null; // 清除旧结果

			try {
				console.log(`[步骤1-B] 同步评价, 主ID: ${this.mainProductId.trim()}`);

				const result = await uniCloud.callFunction({
					name: 'ctrip-sync-service',
					data: {
						action: 'getProductReviews',
						productId: this.mainProductId.trim()
					}
				});

				if (result.result.errCode !== 0) {
					throw new Error(result.result.errMsg);
				}

				const data = result.result.data;
				const message = `评价同步成功。该产品A线路ID: ${data.productId}, 更新评分: ${data.productUpdateResult.updated > 0 ? '是' : '否'}, 新增评论: ${
					data.newCount
				} 条, 更新评论: ${data.updatedCount} 条。`;

				this.reviewSyncResult = { success: true, message: message };
				this.$message.success('评价同步成功');
			} catch (error) {
				console.error('同步评价失败:', error);
				const errMsg = error.message || '同步评价时发生未知错误';
				this.reviewSyncResult = { success: false, message: errMsg };
				this.$message.error(errMsg);
			} finally {
				this.loadingReviews = false;
			}
		},

		// 步骤1.5: 切换线路选择
		toggleRouteSelection(route) {
			route.selected = !route.selected;
		},

		// 步骤1.5: 全选/全不选
		toggleSelectAll(selectAll) {
			this.routeIdList.forEach((route) => {
				route.selected = selectAll;
			});
		},

		// 步骤2：获取所选商品的详情
		async fetchProductDetails() {
			const idsToFetch = this.selectedRouteIds;
			if (idsToFetch.length === 0) {
				this.$message.warning('请至少选择一条商品线路');
				return;
			}

			this.loadingProductDetails = true;
			this.showSyncProgress = false;
			this.syncResults = [];

			// 初始化详情列表
			this.productDetailList = idsToFetch.map((id) => ({
				id: id,
				status: 'loading',
				data: null,
				error: null
			}));

			// 并发获取所有详情
			const promises = idsToFetch.map((id) => {
				return uniCloud.callFunction({
					name: 'ctrip-sync-service',
					data: {
						action: 'getProductDetail',
						productId: id
					}
				});
			});

			const results = await Promise.allSettled(promises);

			// 处理结果
			results.forEach((result, index) => {
				const productId = idsToFetch[index];
				const product = this.productDetailList.find((p) => p.id === productId);

				if (result.status === 'fulfilled') {
					if (result.value.result.errCode === 0) {
						product.status = 'success';
						product.data = {
							...result.value.result.data,
							// 兼容旧模板的图片字段
							images: result.value.result.data.product_images || result.value.result.data.images || []
						};
					} else {
						product.status = 'error';
						product.error = result.value.result.errMsg;
					}
				} else {
					product.status = 'error';
					product.error = result.reason.message || '请求失败';
				}
			});

			this.loadingProductDetails = false;
		},

		// 步骤2: 重试获取单个商品详情
		async retryProductDetail(product, index) {
			product.status = 'loading';

			try {
				const result = await uniCloud.callFunction({
					name: 'ctrip-sync-service',
					data: {
						action: 'getProductDetail',
						productId: product.id
					}
				});

				if (result.result.errCode === 0) {
					product.status = 'success';
					product.data = {
						...result.result.data,
						images: result.result.data.product_images || result.value.result.data.images || []
					};
					product.error = null;
				} else {
					throw new Error(result.result.errMsg);
				}
			} catch (error) {
				product.status = 'error';
				product.error = error.message || '重试失败';
			}
		},

		// 步骤2: 取消同步单个商品
		cancelProductDetail(index) {
			this.productDetailList.splice(index, 1);
		},

		// 步骤3：开始同步
		async startSync() {
			const productsToSync = this.productDetailList.filter((p) => p.status === 'success');
			if (productsToSync.length === 0) {
				this.$message.warning('没有可同步的商品');
				return;
			}

			this.loadingSync = true;
			this.showSyncProgress = true;

			// 初始化同步结果
			this.syncResults = productsToSync.map((p) => ({
				id: p.id,
				status: 'loading',
				error: null
			}));
			this.syncStats = {
				total: productsToSync.length,
				success: 0,
				failed: 0
			};

			await this.executeSync(productsToSync.map((p) => p.id));
		},

		// 步骤3：执行同步（可被重试调用）
		async executeSync(productIds) {
			const token = uni.getStorageSync('uni_id_token');

			const promises = productIds.map((id) => {
				return uniCloud.callFunction({
					name: 'ctrip-sync-service',
					data: {
						action: 'syncFullProduct',
						productId: id,
						uniIdToken: token
					}
				});
			});

			const results = await Promise.allSettled(promises);

			// 处理结果
			results.forEach((result, index) => {
				const productId = productIds[index];
				const syncResult = this.syncResults.find((r) => r.id === productId);

				if (result.status === 'fulfilled') {
					if (result.value.result.errCode === 0) {
						syncResult.status = 'success';
						syncResult.error = null;
						this.syncStats.success++;
					} else {
						syncResult.status = 'error';
						syncResult.error = result.value.result.errMsg;
						this.syncStats.failed++;
					}
				} else {
					syncResult.status = 'error';
					syncResult.error = result.reason.message || '请求失败';
					this.syncStats.failed++;
				}
			});

			this.loadingSync = false;
			this.$message.success('同步任务执行完成');
		},

		// 步骤3: 重试失败的同步
		async retryFailedSyncs() {
			const idsToRetry = this.syncResults.filter((r) => r.status === 'error').map((r) => r.id);

			if (idsToRetry.length === 0) {
				this.$message.info('没有需要重试的失败任务');
				return;
			}

			this.loadingSync = true;

			// 重置失败项的状态
			this.syncStats.failed = 0;
			idsToRetry.forEach((id) => {
				const syncResult = this.syncResults.find((r) => r.id === id);
				if (syncResult) {
					syncResult.status = 'loading';
					syncResult.error = null;
				}
			});

			// 重新执行同步
			await this.executeSync(idsToRetry);
		},

		// --- 辅助方法 ---

		// 获取状态图标
		getStatusIcon(status) {
			switch (status) {
				case 'loading':
					return 'fas fa-spinner fa-spin text-blue-500';
				case 'success':
					return 'fas fa-check-circle text-green-500';
				case 'error':
					return 'fas fa-times-circle text-red-500';
				default:
					return 'fas fa-circle text-gray-400';
			}
		},

		// 获取状态颜色
		getStatusColor(status) {
			switch (status) {
				case 'loading':
					return 'text-blue-600';
				case 'success':
					return 'text-green-600';
				case 'error':
					return 'text-red-600';
				default:
					return 'text-gray-500';
			}
		},

		// 获取状态文本
		getStatusText(status) {
			switch (status) {
				case 'loading':
					return '处理中';
				case 'success':
					return '已完成';
				case 'error':
					return '失败';
				default:
					return '待定';
			}
		},

		// 处理图片加载错误
		handleImageError(e) {
			console.log('图片加载失败:', e);
			// 可以在这里设置一个默认的占位图
			// e.target.src = '/static/images/placeholder.png'
		},

		// 预览图片
		previewImage(imageUrl, index) {
			// uni-app的预览API
			uni.previewImage({
				current: index,
				urls: this.productDetailList.flatMap((p) => (p.status === 'success' ? p.data.images || [] : []))
			});
		},

		// 显示错误详情
		showErrorDetail(errorMessage) {
			this.$alert(errorMessage || '未知错误', '错误详情', {
				confirmButtonText: '确定'
			});
		},

		// 跳转到商品列表页面
		goToProductList() {
			uni.navigateTo({
				url: '/pages/a-products/list' // 直接跳转到列表页，不带搜索
			});
		},

		// 测试API连接
		async testApiConnection() {
			try {
				const result = await uniCloud.callFunction({
					name: 'ctrip-sync-service',
					data: {
						action: 'checkApiHealth'
					}
				});

				if (result.result.errCode === 0) {
					this.$message.success('API连接正常');
				} else {
					throw new Error(result.result.errMsg);
				}
			} catch (error) {
				this.$alert(`连接失败：${error.message}`, 'API连接测试', {
					confirmButtonText: '确定'
				});
			}
		}
	}
};
</script>

<style>
/* 微软雅黑字体 */
.font-sans {
	font-family: 'Microsoft YaHei', sans-serif;
}

/* 自定义样式 */
.transition-all {
	transition: all 0.2s ease-in-out;
}

/* 按钮禁用状态 */
button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

/* 滚动条样式 */
::-webkit-scrollbar {
	width: 6px;
	height: 6px;
}

::-webkit-scrollbar-track {
	background: #f1f1f1;
	border-radius: 3px;
}

::-webkit-scrollbar-thumb {
	background: #c1c1c1;
	border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
	background: #a8a8a8;
}

/* 强制 uni-app checkbox 样式 */
label {
	cursor: pointer;
}
checkbox {
	transform: scale(1.1);
	margin-right: 12px;
}
</style>
