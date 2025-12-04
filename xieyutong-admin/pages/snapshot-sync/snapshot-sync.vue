<template>
	<view class="min-h-screen bg-gray-50 font-sans">
		<!-- 页面标题栏 -->
		<view class="bg-white border-b border-gray-200 shadow-sm">
			<view class="max-w-7xl mx-auto px-6 py-4">
				<view class="flex items-center justify-between">
					<view class="flex items-center">
						<button type="default" size="mini" @click="goBack">返回</button>
						<i class="fas fa-sync-alt text-blue-600 text-2xl mx-4"></i>
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
									<i class="fas fa-sync mr-2" :class="{ 'fa-spin': loading }"></i>
									<text v-if="!loading">开始同步快照</text>
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
							</view>
						</view>
					</view>
				</view>

				<!-- 同步完成后的操作按钮 -->
				<view v-if="!loading && progress === 100" class="mt-6 px-4 py-4 border-t border-gray-200">
					<view class="flex items-center justify-between">
						<view class="text-sm text-gray-600">
							<i class="fas fa-check-circle text-green-500 mr-2"></i>
							同步已完成，您可以将订单号
							<text class="font-semibold text-indigo-600 text-base ml-1">{{ order_id }}</text>
							<i class="fas fa-copy text-gray-500 mr-1 cursor-pointer hover:text-indigo-600 transition-all" @click="copyOrderId" title="点击复制"></i>
							保存并发送给客户进行导入行程
						</view>
						<!-- <button
							class="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center"
							@click="goTosnapshotDetail">
							<i class="fas fa-eye mr-2"></i>
							查看快照详情
						</button> -->
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			snapshot_url: '',
			order_id: '',
			departure_date: '',
			loading: false,
			loadingDetail: false,
			progress: 0,
			snapshotDetail: null,
			showSyncProgress: false,
			syncStatus: {
				product_detail: 'idle',
				itinerary: 'idle',
				booking_policies: 'idle'
			},
			currentSyncLogId: null
		};
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},
		// 开始同步流程
		async startSync() {
			this.loading = true;
			this.progress = 0;

			try {
				// 创建同步记录
				await this.createSyncLog();
				// 提取orderId
				const url = new URL(this.snapshot_url);
				this.order_id = url.searchParams.get('orderId');

				// 2. 检查是否成功提取
				if (!this.order_id) {
					console.log('[管理端同步] 无法从URL中提取orderId');
				}

				console.log(`[管理端同步] 成功提取 order_id: ${this.order_id}`);
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
					this.currentSyncLogId = syncData.syncLogId;
					this.updateProgress(100);

					console.log(`[管理端同步] 同步完成`);
				} else {
					throw new Error(result.result.errMsg);
				}
			} catch (error) {
				console.error('同步失败:', error);
				this.$message.error(error.message || '同步失败');
			}
		},

		// 创建同步记录（现已集成到云函数中）
		async createSyncLog() {
			// 同步记录的创建现在由云函数处理
			this.updateProgress(10);
		},

		// 更新进度条
		updateProgress(value) {
			this.progress = value;
		},

		copyOrderId() {
			if (!this.order_id) {
				this.$message.error('没有可复制的订单号');
				return;
			}

			uni.setClipboardData({
				data: this.order_id,
				success: () => {
					this.$message.success('订单号已复制到剪贴板');
				},
				fail: () => {
					this.$message.error('复制失败，请重试');
				}
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
				url: `/pages/a-products/list`
			});
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
