<template>
	<view class="min-h-screen bg-gray-50 font-sans">
		<!-- 页面标题栏 -->
		<view class="bg-white border-b border-gray-200 shadow-sm">
			<view class="max-w-7xl mx-auto px-6 py-4">
				<view class="flex items-center justify-between">
					<view class="flex items-center">
						<i class="fas fa-sync-alt text-blue-600 text-2xl mr-4"></i>
						<view>
							<text class="text-2xl font-bold text-gray-900" style="font-family: 'Microsoft YaHei', sans-serif">携程订单快照同步</text>
							<text class="text-sm text-gray-500 block mt-1">输入携程订单快照的完整URL地址和出发/返回日期文本，一键同步订单行程安排</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="max-w-7xl mx-auto px-6 py-8">
			<!-- 操作区域 -->
			<view class="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
				<view class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
					<view class="flex items-center">
						<i class="fas fa-search text-blue-600 text-xl mr-3"></i>
						<text class="text-xl font-semibold text-gray-800" style="font-family: 'Microsoft YaHei', sans-serif">订单信息查询与同步</text>
					</view>
				</view>

				<view class="p-8 w-full">
					<view class="flex items-start mb-8 w-full">
						<view class="flex flex-col items-start gap-6 w-full">
							<view class="flex mb-4 gap-6 w-full">
								<view class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</view>
								<text class="text-lg font-medium text-gray-700" style="font-family: 'Microsoft YaHei', sans-serif">输入快照URL地址</text>

								<uni-easyinput
									v-model="snapshot_url"
									placeholder="请输入订单快照的完整URL地址，如：https://vacations.ctrip.com/travel/detail/p45682742/?city=2&snapshotid=ee01ce6a031e52def9b49e4e70b918ad&orderId=1128141964251476"
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
									}"
									:focus-style="{
										borderColor: '#3b82f6',
										boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'
									}"></uni-easyinput>
							</view>

							<view class="flex items-center mb-4 gap-6 w-full">
								<view class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</view>
								<text class="text-lg font-medium text-gray-700" style="font-family: 'Microsoft YaHei', sans-serif">输入出发/返回日期</text>

								<uni-easyinput
									v-model="departure_date"
									placeholder="请输入出发/返回日期，如：2025-11-09 / 2025-11-15"
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
									}"
									:focus-style="{
										borderColor: '#3b82f6',
										boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'
									}"></uni-easyinput>
							</view>

							<view class="w-full">
								<button
									class="w-full px-6 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
									style="font-family: 'Microsoft YaHei', sans-serif"
									@click="startSync"
									:disabled="loading || !snapshot_url.trim() || !departure_date.trim()">
									<i class="fas fa-search mr-2" :class="{ 'fa-spin': loadingDetail }"></i>
									<text v-if="!loadingDetail">开始同步快照</text>
									<text v-else>同步中...</text>
								</button>
							</view>
						</view>
					</view>

					<!-- 商品详情预览 -->
					<view v-if="snapshotDetail" class="mb-8">
						<view class="flex items-center mb-4">
							<view class="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</view>
							<text class="text-lg font-medium text-gray-700" style="font-family: 'Microsoft YaHei', sans-serif">确认商品信息</text>
						</view>

						<view class="bg-gray-50 rounded-lg p-6 border border-gray-200">
							<view class="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<view>
									<text class="text-sm font-medium text-gray-500 mb-1">订单标题</text>
									<text class="text-lg font-semibold text-gray-900 block" style="font-family: 'Microsoft YaHei', sans-serif">{{ snapshotDetail.title || '未获取到标题' }}</text>
								</view>
								<view class="lg:col-span-2" v-if="snapshotDetail.subtitle">
									<text class="text-sm font-medium text-gray-500 mb-1">订单描述</text>
									<text class="text-gray-700 leading-relaxed" style="font-family: 'Microsoft YaHei', sans-serif">{{ snapshotDetail.subtitle }}</text>
								</view>
								<!-- <view class="lg:col-span-2" v-if="snapshotDetail.images && snapshotDetail.images.length > 0">
									<text class="text-sm font-medium text-gray-500 mb-2 block">商品图片（共{{ snapshotDetail.images.length }}张）</text>
									<view class="grid grid-cols-6 gap-2">
										<view v-for="(img, index) in snapshotDetail.images.slice(0, 12)" :key="index" class="relative group cursor-pointer" @click="previewImage(img, index)">
											<image
												:src="img"
												class="w-full h-20 rounded-lg object-cover border border-gray-200 hover:border-blue-400 transition-all duration-200"
												mode="aspectFill"
												@error="handleImageError"></image>
											<view class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center">
												<i class="fas fa-search-plus text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"></i>
											</view>
										</view>
										<view
											v-if="snapshotDetail.images.length > 12"
											class="w-full h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-all duration-200"
											@click="showAllImages">
											<view class="text-center">
												<i class="fas fa-images text-gray-400 text-lg block mb-1"></i>
												<text class="text-xs text-gray-500">+{{ snapshotDetail.images.length - 12 }}</text>
											</view>
										</view>
									</view> -->
							</view>
						</view>

						<!-- <view class="mt-6 flex items-center justify-between">
								<view class="text-sm text-gray-500">
									<i class="fas fa-info-circle mr-1"></i>
									请确认以上信息无误后，点击右侧按钮开始同步
								</view>
								<button
									class="px-8 py-3 bg-green-600 text-white text-lg font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
									style="font-family: 'Microsoft YaHei', sans-serif"
									@click="startSync"
									:disabled="loading">
									<i class="fas fa-sync mr-2" :class="{ 'fa-spin': loading }"></i>
									<text v-if="!loading">开始同步商品</text>
									<text v-else>同步中...</text>
								</button>
							</view> -->
					</view>
				</view>

				<!-- 步骤三：同步进度 -->
				<!-- <view v-if="showSyncProgress" class="mb-8">
						<view class="flex items-center mb-4">
							<view class="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</view>
							<text class="text-lg font-medium text-gray-700" style="font-family: 'Microsoft YaHei', sans-serif">同步进度</text>
						</view>

						<view class="bg-gray-50 rounded-lg p-6 border border-gray-200">
							<view class="space-y-4">
								<view v-for="(status, key) in syncStatus" :key="key" class="flex items-center justify-between p-4 bg-white rounded-lg border">
									<view class="flex items-center">
										<i :class="getStatusIcon(status)" class="mr-3 text-lg"></i>
										<text class="font-medium text-gray-700" style="font-family: 'Microsoft YaHei', sans-serif">{{ getSyncTypeText(key) }}</text>
									</view>
									<view class="flex items-center">
										<text :class="getStatusColor(status)" class="text-sm font-medium mr-2" style="font-family: 'Microsoft YaHei', sans-serif">{{ getStatusText(status) }}</text>
										<view v-if="status === 'error'" class="text-xs text-red-500 cursor-pointer" @click="showErrorDetail(key)">
											<i class="fas fa-exclamation-circle"></i>
										</view>
									</view>
								</view>
							</view> -->

				<!-- 总进度条 -->
				<!-- <view v-if="loading" class="mt-6">
								<text class="text-sm text-gray-600 mb-2 block" style="font-family: 'Microsoft YaHei', sans-serif">总体进度: {{ progress }}%</text>
								<view class="w-full bg-gray-200 rounded-full h-3">
									<view class="bg-blue-600 h-3 rounded-full transition-all duration-300" :style="{ width: progress + '%' }"></view>
								</view>
							</view> -->

				<!-- 同步完成后的操作按钮 -->
				<view v-if="!loading && progress === 100" class="mt-6 pt-4 border-t border-gray-200">
					<view class="flex items-center justify-between">
						<view class="text-sm text-gray-600">
							<i class="fas fa-check-circle text-green-500 mr-2"></i>
							同步已完成，您可以查看同步的快照详情
						</view>
						<button
							class="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center"
							@click="goTosnapshotDetail">
							<i class="fas fa-eye mr-2"></i>
							查看快照详情
						</button>
					</view>
				</view>
				<!-- </view>
					</view> -->
			</view>
			<!-- </view> -->

			<!-- 空状态提示 -->
			<view v-if="!snapshotDetail && !showSyncProgress && !loading" class="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
				<i class="fas fa-cloud-download-alt text-gray-300 text-6xl mb-6"></i>
				<text class="text-xl text-gray-500 block mb-2" style="font-family: 'Microsoft YaHei', sans-serif">输入订单快照信息开始查询</text>
				<text class="text-sm text-gray-400" style="font-family: 'Microsoft YaHei', sans-serif">请输入快照URL地址和出发/返回日期，进行同步快照</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	components: {
		// uni-easyinput 已通过 uni_modules 自动注册，无需手动导入
	},
	data() {
		return {
			snapshot_url: '',
			departure_date: '',
			loading: false,
			loadingDetail: false,
			progress: 0,
			snapshotDetail: null,
			showSyncProgress: false,
			syncStatus: {
				product_detail: 'idle', // idle, loading, success, error
				itinerary: 'idle', // idle, loading, success, error
				booking_policies: 'idle' // idle, loading, success, error
			},
			currentSyncLogId: null
		};
	},
	methods: {
		// 获取商品详情预览
		async getSnapshotDetail() {
			if (!this.snapshot_url.trim()) {
				this.$message.warning('请输入快照URL');
				return;
			}

			this.loadingDetail = true;

			try {
				// 调用云函数获取商品详情
				const result = await uniCloud.callFunction({
					name: 'ctrip-sync-service',
					data: {
						action: 'getSnapshotItinerary',
						snapshot_url: this.snapshot_url.trim()
					}
				});

				if (result.result.errCode === 0) {
					const productData = result.result.data;
					console.log(`[管理端] 获取到的商品数据字段:`, Object.keys(productData));
					console.log(`[管理端] 商品详情数据:`, {
						title: productData.title,
						price: productData.price,
						imageCount: (productData.product_images || productData.images || []).length
					});

					this.snapshotDetail = {
						title: productData.title || '未获取到标题',
						subtitle: productData.subtitle || productData.sub_title || '未获取到描述',
						price: productData.price || '未获取到价格',
						// 兼容不同的图片字段名
						images: productData.product_images || productData.images || []
					};

					this.$message.success('获取成功');
				} else {
					throw new Error(result.result.errMsg);
				}
			} catch (error) {
				console.error('获取商品详情失败:', error);
				this.$message.error(error.message || '获取失败');
			} finally {
				this.loadingDetail = false;
			}
		},

		// 开始同步流程
		async startSync() {
			// if (!this.snapshotDetail) {
			// 	this.$message.warning('请先获取商品详情');
			// 	return;
			// }

			this.loading = true;
			// this.showSyncProgress = true;
			this.progress = 0;

			// 重置同步状态
			// this.syncStatus = {
			// 	product_detail: 'loading',
			// 	itinerary: 'loading',
			// 	booking_policies: 'loading'
			// };

			// 模拟进度更新
			// this.updateProgress(20);

			try {
				// 创建同步记录
				await this.createSyncLog();

				// 执行同步流程
				await this.executeSync();
			} catch (error) {
				console.error(`[管理端同步] 同步过程出错:`, error);
				this.$message.error(error.message || '同步失败');

				// 将所有状态标记为错误
				Object.keys(this.syncStatus).forEach((key) => {
					this.syncStatus[key] = 'error';
				});

				// 同步记录的更新现在由云函数处理
				console.log(`[管理端同步] 同步失败，错误信息:`, error.message);
			} finally {
				this.loading = false;
			}
		},

		// 执行同步流程
		async executeSync() {
			try {
				// 调用云函数进行全量同步
				const token = uni.getStorageSync('uni_id_token');
				console.log(`[管理端同步] 开始同步快照，订单快照URL: ${this.snapshot_url.trim()}`);

				const result = await uniCloud.callFunction({
					name: 'ctrip-sync-service',
					data: {
						action: 'syncSnapshot',
						snapshot_url: this.snapshot_url.trim(),
						departure_date: this.departure_date.trim(),
						uniIdToken: token
					}
				});

				console.log(`[管理端同步] 云函数调用结果:`, result.result);

				if (result.result.errCode === 0) {
					const syncData = result.result.data;
					console.log(`[管理端同步] 同步数据结果:`, syncData);

					// 更新同步状态
					// if (syncData.syncResults) {
					// 	Object.keys(this.syncStatus).forEach((key) => {
					// 		const status = syncData.syncResults[key];
					// 		this.syncStatus[key] = status === 'success' || status === 'skipped' ? 'success' : 'error';
					// 		console.log(`[管理端同步] 更新状态 ${key}: ${this.syncStatus[key]} (原始: ${status})`);
					// 	});
					// }

					this.currentSyncLogId = syncData.syncLogId;
					this.updateProgress(100);

					console.log(`[管理端同步] 同步完成`);

					// if (syncData.failedCount === 0) {
					// 	this.$message.success(`全部同步成功！成功项目: ${syncData.successCount}`);
					// } else if (syncData.successCount > 0) {
					// 	this.$message.warning(`部分同步成功 - 成功: ${syncData.successCount}, 失败: ${syncData.failedCount}`);
					// } else {
					// 	this.$message.error('同步失败，所有项目都未能成功同步');
					// }
				} else {
					throw new Error(result.result.errMsg);
				}
			} catch (error) {
				console.error('同步失败:', error);

				// 将所有状态标记为错误
				// Object.keys(this.syncStatus).forEach((key) => {
				// 	this.syncStatus[key] = 'error';
				// });

				this.$message.error(error.message || '同步失败');
			}
		},

		// 创建同步记录（现已集成到云函数中）
		async createSyncLog() {
			// 同步记录的创建现在由云函数处理
			// console.log(`[管理端同步] 准备创建同步记录，产品ID: ${this.productId.trim()}`);
			this.updateProgress(10);
		},

		// // 这些同步方法已经集成到云函数的 syncFullProduct 中
		// // 保留这些方法以保证兼容性
		// async syncsnapshotDetail() {
		// 	// 现在由云函数统一处理
		// },

		// async syncItinerary() {
		// 	// 现在由云函数统一处理
		// },

		// async syncBookingPolicies() {
		// 	// 现在由云函数统一处理
		// },

		// // 更新同步记录（现已集成到云函数中）
		// async updateSyncLog(logId, status, result) {
		// 	// 同步记录的更新现在由云函数处理
		// 	console.log('同步记录已由云函数更新:', { logId, status, result });
		// },

		// 更新进度条
		updateProgress(value) {
			this.progress = value;
		},

		// 获取状态图标
		getStatusIcon(status) {
			switch (status) {
				case 'idle':
					return 'fas fa-circle text-gray-400';
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
				case 'idle':
					return 'text-gray-500';
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
				case 'idle':
					return '待同步';
				case 'loading':
					return '同步中';
				case 'success':
					return '已完成';
				case 'error':
					return '失败';
				default:
					return '待同步';
			}
		},

		// 获取同步类型文本
		getSyncTypeText(key) {
			switch (key) {
				case 'product_detail':
					return '商品详情';
				case 'itinerary':
					return '行程安排';
				case 'booking_policies':
					return '预订须知';
				default:
					return '未知类型';
			}
		},

		// 获取类型颜色
		getTypeColor(type) {
			switch (type) {
				case 'product_detail':
					return 'bg-blue-100 text-blue-800';
				case 'itinerary':
					return 'bg-green-100 text-green-800';
				case 'booking_policies':
					return 'bg-orange-100 text-orange-800';
				default:
					return 'bg-gray-100 text-gray-800';
			}
		},

		// 获取类型文本
		getTypeText(type) {
			switch (type) {
				case 'product_detail':
					return '商品详情';
				case 'itinerary':
					return '行程安排';
				case 'booking_policies':
					return '预订须知';
				default:
					return '未知类型';
			}
		},

		// 处理图片加载错误
		handleImageError(e) {
			console.log('图片加载失败:', e);
		},

		// 预览图片
		previewImage(imageUrl, index) {
			// 简单的图片预览，在新窗口打开图片
			window.open(imageUrl, '_blank');
		},

		// 显示所有图片
		showAllImages() {
			if (this.snapshotDetail.images && this.snapshotDetail.images.length > 0) {
				this.$alert(`该商品共有 ${this.snapshotDetail.images.length} 张图片，点击任意图片可查看大图`, '全部图片', {
					confirmButtonText: '确定'
				});
			}
		},

		// 显示错误详情
		showErrorDetail(key) {
			this.$alert(`${this.getSyncTypeText(key)} 同步失败，请检查网络连接或联系技术支持`, '错误详情', {
				confirmButtonText: '确定'
			});
		},

		// 跳转到商品详情页面
		goTosnapshotDetail() {
			if (!this.productId.trim()) {
				this.$message.warning('商品ID无效');
				return;
			}

			// 跳转到商品管理页面，通过查询参数定位到具体商品
			uni.navigateTo({
				url: `/pages/a-products/list?search=${this.productId.trim()}`
			});
		},

		// 重置同步状态
		resetSyncState() {
			this.snapshotDetail = null;
			this.showSyncProgress = false;
			this.progress = 0;
			this.syncStatus = {
				product_detail: 'idle',
				itinerary: 'idle',
				booking_policies: 'idle'
			};
			this.currentSyncLogId = null;
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
		},

		// 测试数据清洗功能
		async testDataCleaning() {
			try {
				const testData = {
					title: '北京"故宫"深度游 - 一日游体验',
					subtitle: '探索"紫禁城"的神秘历史，感受"皇家"文化的魅力',
					description: '这是一个包含"双引号"的描述文本，还有\'单引号\'和\\反斜杠\\的内容',
					features: ['专业导游"贴心"服务', '含"午餐"和"门票"', '小团"私享"体验'],
					nested: {
						info: {
							note: '注意：请"准时"到达集合地点',
							warning: '警告：携带"有效证件"'
						}
					}
				};

				const result = await uniCloud.callFunction({
					name: 'ctrip-sync-service',
					data: {
						action: 'testDataCleaning',
						testData: testData
					}
				});

				if (result.result.errCode === 0) {
					const cleaningResult = result.result.data;

					this.$alert(
						`测试完成！\n清理了 ${cleaningResult.summary.total_changes} 个字段\n移除了 ${cleaningResult.summary.total_chars_removed} 个特殊字符\n详细结果请查看控制台`,
						'数据清洗测试结果',
						{
							confirmButtonText: '确定'
						}
					);

					console.log('数据清洗测试结果:', cleaningResult);
				} else {
					throw new Error(result.result.errMsg);
				}
			} catch (error) {
				this.$alert(`测试失败：${error.message}`, '数据清洗测试', {
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

/* 表格样式优化 */
table {
	border-collapse: collapse;
}

/* 按钮禁用状态 */
button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

/* 输入框样式 */
input:focus {
	outline: none;
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
</style>
