<template>
	<view class="bg-gray-50 min-h-screen">
		<!-- 内容区域 -->
		<scroll-view 
			class="pb-safe" 
			scroll-y 
			:style="{height: scrollViewHeight}"
			@scrolltolower="loadMore"
			:refresher-enabled="true"
			:refresher-triggered="refreshing"
			@refresherrefresh="onRefresh"
			@refresherrestore="onRestore"
		>
			<!-- 订单标签页 -->
			<view class="flex bg-white border-b border-gray-100 sticky top-0 z-5">
				<view 
					v-for="(tab, index) in tabs" 
					:key="index" 
					class="flex-1 text-center py-3 text-sm relative" 
					:class="{ 'text-blue-500 font-medium': currentTab === index, 'text-gray-600': currentTab !== index }"
					@click="switchTab(index)"
				>
					{{ tab.name }}
					<view v-if="tab.badge && tab.badge > 0" class="absolute top-1.5 right-1/4 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
						{{ tab.badge }}
					</view>
					<view v-if="currentTab === index" class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-5 h-0.5 bg-blue-500 rounded-sm"></view>
				</view>
			</view>

			<!-- 订单列表 -->
			<view class="px-3">
				<!-- 加载状态 -->
				<view v-if="loading" class="flex justify-center items-center py-20">
					<view class="flex flex-col items-center">
						<view class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></view>
						<text class="text-gray-500 text-sm">加载中...</text>
					</view>
				</view>
				
				<!-- 订单列表 -->
				<view 
					v-else
					v-for="(order, index) in displayOrders" 
					:key="index" 
					class="bg-white mb-3 rounded-xl overflow-hidden shadow-sm"
					@click="goToOrderDetail(order)"
				>
					<!-- 订单头部 -->
					<view class="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
						<view class="text-gray-500 text-sm flex items-center" @click="copyOrderNumber(order.orderNumber)">
							订单号: {{ order.orderNumber }}
							<text class="fa fa-copy ml-1 text-xs opacity-60"></text>
						</view>
						<view 
							class="text-sm font-medium"
							:class="{
								'text-blue-500': order.status === '进行中',
								'text-gray-500': order.status === '已完成',
								'text-orange-500': order.status === '待支付'
							}"
						>
							{{ order.status }}
						</view>
					</view>

					<!-- 订单内容 -->
					<view class="p-4">
						<view class="flex">
							<view class="w-20 h-20 rounded overflow-hidden flex-shrink-0">
								<image :src="order.image" class="w-full h-full" mode="aspectFill"></image>
							</view>
							<view class="ml-3 flex-1">
								<view class="text-gray-800 font-medium text-base">{{ order.title }}</view>
								<view class="text-gray-500 text-sm mt-1">出发日期: {{ order.departureDate }}</view>
								<view class="text-gray-500 text-sm mt-1">出行人数: {{ order.travelers }}人</view>
							</view>
						</view>
					</view>

					<!-- 订单底部 -->
					<view class="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
						<view class="text-gray-800 font-medium">¥{{ order.price }}</view>
						<view class="flex space-x-2">
							<button 
								v-for="(btn, btnIndex) in order.buttons" 
								:key="btnIndex"
								class="px-4 py-1 text-sm rounded-full"
								:class="btn.type === 'primary' ? 'bg-blue-500 text-white' : btn.type === 'orange' ? 'bg-orange-500 text-white' : 'border border-gray-400 text-gray-500'"
								@click="handleButtonClick(btn.action, order)"
							>
								{{ btn.text }}
							</button>
						</view>
					</view>
				</view>

				<!-- 无订单状态 -->
				<view v-if="!loading && displayOrders.length === 0" class="flex flex-col items-center justify-center text-gray-400" style="height: 60vh;">
					<text class="fa fa-file-text text-6xl text-gray-300 mb-4"></text>
					<view class="text-base">暂无{{ tabs[currentTab].name }}订单</view>
					<view class="text-sm text-gray-400 mt-2">快去下单吧~</view>
				</view>
			</view>
			
			<!-- 加载更多状态 -->
			<view v-if="hasMore && !loading" class="flex justify-center py-4">
				<view v-if="loadingMore" class="flex items-center text-gray-500 text-sm">
					<view class="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></view>
					加载中...
				</view>
				<view v-else class="text-gray-400 text-sm">上拉加载更多</view>
			</view>
			
			<!-- 没有更多数据 -->
			<view v-if="!hasMore && orders.length > 0" class="flex justify-center py-4">
				<view class="text-gray-400 text-sm">没有更多订单了</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			tabs: [
				{ name: '全部', badge: 0 },
				{ name: '待支付', badge: 0 },
				{ name: '进行中', badge: 0 },
				{ name: '已完成', badge: 0 }
			],
			currentTab: 0,
			orders: [],
			loading: true,
			refreshing: false,
			loadingMore: false,
			hasMore: true,
			pageSize: 10,
			currentPage: 1,
			scrollViewHeight: '100vh'
		}
	},
	computed: {
		displayOrders() {
			if (this.currentTab === 0) {
				return this.orders;
			} else if (this.currentTab === 1) {
				return this.orders.filter(order => order.status === '待支付');
			} else if (this.currentTab === 2) {
				return this.orders.filter(order => order.status === '进行中');
			} else {
				return this.orders.filter(order => order.status === '已完成');
			}
		}
	},
	async onLoad(options) {
		// 检查传入的类型参数
		if (options.type) {
			const typeMapping = {
				'pending': 1,
				'ongoing': 2,
				'completed': 3
			};
			this.currentTab = typeMapping[options.type] || 0;
		}
		
		// 计算 scroll-view 高度
		this.calculateScrollViewHeight();
		
		// 加载订单数据
		await this.loadOrders();
	},
	methods: {
		switchTab(index) {
			this.currentTab = index;
		},
		
		// 计算 scroll-view 高度
		calculateScrollViewHeight() {
			const systemInfo = uni.getSystemInfoSync();
			const windowHeight = systemInfo.windowHeight;
			// 减去导航栏高度（系统导航栏约44px）和安全区域
			this.scrollViewHeight = windowHeight + 'px';
		},
		
		// 下拉刷新
		async onRefresh() {
			console.log('[订单列表] 开始下拉刷新');
			this.refreshing = true;
			this.currentPage = 1;
			this.hasMore = true;
			await this.loadOrders(true);
			this.refreshing = false;
		},
		
		// 刷新恢复
		onRestore() {
			this.refreshing = false;
		},
		
		// 上拉加载更多
		async loadMore() {
			if (this.loadingMore || !this.hasMore || this.loading) {
				return;
			}
			
			console.log('[订单列表] 开始加载更多订单');
			this.loadingMore = true;
			this.currentPage++;
			await this.loadOrders(false);
			this.loadingMore = false;
		},
		
		// 加载订单数据
		async loadOrders(isRefresh = true) {
			try {
				console.log('[订单列表] 开始加载订单数据, isRefresh:', isRefresh, 'currentPage:', this.currentPage);
				
				// 只有首次加载或刷新时显示loading
				if (isRefresh) {
					this.loading = true;
				}
				
				// 检查登录状态
				const token = uni.getStorageSync('uni_id_token');
				if (!token) {
					console.error('[订单列表] 用户未登录');
					uni.navigateTo({
						url: '/pages/login/login'
					});
					return;
				}
				
				// 使用 ClientDB 查询订单，支持分页
				const db = uniCloud.database();
				const ordersCollection = db.collection('a-orders');
				
				const orderRes = await ordersCollection
					.where('user_id == $cloudEnv_uid')
					.field('_id,order_no,status,product_snapshot,final_amount,departure_date,quantity,created_at')
					.orderBy('created_at', 'desc')
					.skip((this.currentPage - 1) * this.pageSize)
					.limit(this.pageSize)
					.get();
				
				console.log('[订单列表] 查询结果:', orderRes);
				
				if (orderRes.result && orderRes.result.data) {
					const newOrders = orderRes.result.data.map(order => {
						// 转换订单状态为中文显示
						let statusText = '未知状态';
						switch (order.status) {
							case 'pending':
								statusText = '待支付';
								break;
							case 'paid':
							case 'confirmed':
							case 'processing':
								statusText = '进行中';
								break;
							case 'completed':
								statusText = '已完成';
								break;
							case 'cancelled':
								statusText = '已取消';
								break;
							case 'refunded':
								statusText = '已退款';
								break;
						}
						
						// 生成操作按钮
						let buttons = [];
						if (order.status === 'pending') {
							buttons = [
								{ text: '联系客服', type: 'outline', action: 'contactService' },
								{ text: '立即支付', type: 'orange', action: 'pay' }
							];
						} else if (['paid', 'confirmed', 'processing'].includes(order.status)) {
							buttons = [
								{ text: '联系客服', type: 'primary', action: 'contactService' }
							];
						} else if (order.status === 'completed') {
							buttons = [
								{ text: '查看详情', type: 'outline', action: 'viewDetail' },
								{ text: '再次预订', type: 'orange', action: 'bookAgain' }
							];
						}
						
						return {
							_id: order._id,
							orderNumber: order.order_no,
							status: statusText,
							originalStatus: order.status,
							title: order.product_snapshot?.title || '未知商品',
							departureDate: order.departure_date || '待确定',
							travelers: order.quantity || 1,
							price: (order.final_amount || 0).toLocaleString(),
							image: order.product_snapshot?.images?.[0] || 'https://dimg04.c-ctrip.com/images/0303s12000dwdbkfnEB6E.webp',
							buttons: buttons
						};
					});
					
					// 判断是刷新还是加载更多
					if (isRefresh || this.currentPage === 1) {
						// 刷新或首次加载，替换数据
						this.orders = newOrders;
					} else {
						// 加载更多，追加数据
						this.orders = [...this.orders, ...newOrders];
					}
					
					// 判断是否还有更多数据
					this.hasMore = newOrders.length >= this.pageSize;
					
					console.log('[订单列表] 处理后的订单数据:', this.orders.length, '条');
					console.log('[订单列表] 是否还有更多数据:', this.hasMore);
					
					// 更新标签页徽章
					this.updateTabBadges();
				} else {
					console.log('[订单列表] 未查询到订单数据');
					if (isRefresh || this.currentPage === 1) {
						this.orders = [];
					}
					this.hasMore = false;
				}
				
			} catch (error) {
				console.error('[订单列表] 加载订单失败:', error);
				uni.showToast({
					title: '加载订单失败',
					icon: 'none'
				});
				this.orders = [];
			} finally {
				this.loading = false;
			}
		},
		
		// 更新标签页徽章数量
		updateTabBadges() {
			this.tabs[1].badge = this.orders.filter(order => order.status === '待支付').length;
			this.tabs[2].badge = this.orders.filter(order => order.status === '进行中').length;
			this.tabs[3].badge = this.orders.filter(order => order.status === '已完成').length;
		},
		
		// 跳转到订单详情页
		goToOrderDetail(order) {
			console.log('[订单列表] 跳转到订单详情页:', order.orderNumber);
			uni.navigateTo({
				url: `/pages/order/order-detail?orderId=${order._id}&orderNo=${order.orderNumber}`
			});
		},
		copyOrderNumber(orderNumber) {
			// 在小程序中，需要使用uni.setClipboardData来复制
			uni.setClipboardData({
				data: orderNumber,
				success: () => {
					uni.showToast({
						title: '订单号已复制',
						icon: 'success',
						duration: 2000
					});
				},
				fail: () => {
					uni.showToast({
						title: '复制失败',
						icon: 'none'
					});
				}
			});
		},
		handleButtonClick(action, order) {
			switch(action) {
				case 'contactService':
					uni.showModal({
						title: '联系客服',
						content: '是否拨打客服电话？',
						success: (res) => {
							if (res.confirm) {
								uni.makePhoneCall({
									phoneNumber: '400-123-4567'
								});
							}
						}
					});
					break;
				case 'viewDetail':
					uni.navigateTo({
						url: `/pages/order/order-detail?orderId=${order._id}&orderNo=${order.orderNumber}`
					});
					break;
				case 'bookAgain':
					uni.showToast({
						title: '正在为您重新预订',
						icon: 'none'
					});
					// 跳转到商品详情页
					setTimeout(() => {
						uni.navigateTo({
							url: '/pages/product-detail/product-detail'
						});
					}, 1500);
					break;
				case 'pay':
					uni.showModal({
						title: '确认支付',
						content: `订单金额：¥${order.price}，确认支付吗？`,
						success: (res) => {
							if (res.confirm) {
								uni.showLoading({
									title: '支付中...'
								});
								setTimeout(() => {
									uni.hideLoading();
									uni.showToast({
										title: '支付成功',
										icon: 'success'
									});
									// 更新订单状态
									order.status = '进行中';
									order.buttons = [
										{ text: '查看行程', type: 'outline', action: 'viewItinerary' },
										{ text: '联系客服', type: 'primary', action: 'contactService' }
									];
									this.updateTabBadges();
								}, 2000);
							}
						}
					});
					break;
				default:
					console.log('未知操作:', action);
			}
		}
	}
}
</script>

<style>
/* 订单列表页面样式 */
.order-list-container {
	background-color: #f5f5f5;
	min-height: 100vh;
}

/* 补充样式 */
.pb-safe {
	padding-bottom: env(safe-area-inset-bottom);
}

.shadow-sm {
	box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.space-x-2  {
	margin-left: 0.5rem;
}

/* 橙色按钮样式 */
.bg-orange-500 {
	background-color: #FF9500;
}

.text-orange-500 {
	color: #FF9500;
}

/* 加载动画 */
.animate-spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}
</style> 