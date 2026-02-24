<template>
	<view class="bg-gray-50 min-h-screen">
		<!-- 内容区域 -->
		<scroll-view
			class="pb-safe"
			scroll-y
			:style="{ height: scrollViewHeight }"
			@scrolltolower="loadMore"
			:refresher-enabled="true"
			:refresher-triggered="refreshing"
			@refresherrefresh="onRefresh"
			@refresherrestore="onRestore">
			<!-- 订单标签页 -->
			<view class="flex bg-white border-b border-gray-100 sticky top-0 z-5">
				<view
					v-for="(tab, index) in tabs"
					:key="index"
					class="flex-1 text-center py-3 text-sm relative"
					:class="{ 'text-brand-orange font-medium': currentTab === index, 'text-gray-600': currentTab !== index }"
					@click="switchTab(index)">
					{{ tab.name }}
					<view v-if="tab.badge && tab.badge > 0" class="absolute top-1.5 right-1/4 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
						{{ tab.badge }}
					</view>
					<view v-if="currentTab === index" class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-5 h-0.5 bg-brand-orange rounded-sm"></view>
				</view>
			</view>

			<!-- 订单列表 -->
			<view class="px-3">
				<!-- 加载状态 -->
				<view v-if="loading" class="flex justify-center items-center py-20">
					<view class="flex flex-col items-center">
						<view class="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mb-2"></view>
						<text class="text-gray-500 text-sm">加载中...</text>
					</view>
				</view>

				<!-- 订单列表 -->
				<view v-else v-for="(order, index) in orders" :key="index" class="bg-white mb-3 rounded-xl overflow-hidden shadow-sm" @click="goToOrderDetail(order)">
					<!-- 订单头部 -->
					<view class="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
						<view class="text-gray-500 text-sm flex items-center" @click="copyOrderNumber(order.orderNumber)">
							订单号: {{ order.orderNumber }}
							<!-- <text class="fa fa-copy ml-1 text-xs opacity-60"></text> -->
							<image src="/static/icons/copy.svg" class="w-3 h-3 ml-1" mode="aspectFit" />
						</view>
						<view
							class="text-sm font-medium"
							:class="{
								'text-brand-orange': order.status === '进行中',
								'text-gray-500': order.status === '已完成',
								'text-orange-500': order.status === '待支付'
							}">
							{{ order.status }}
						</view>
					</view>

					<!-- 订单内容 -->
					<view class="p-4">
						<view class="flex">
							<view class="w-20 h-20 rounded overflow-hidden flex-shrink-0">
								<image :src="getOptimizedImage(order.image, 200, 200)" class="w-full h-full" mode="aspectFill"></image>
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
						<view class="flex">
							<button
								v-for="(btn, btnIndex) in order.buttons"
								:key="btnIndex"
								class="px-4 py-1 text-sm rounded-full"
								:class="
									btn.type === 'primary'
										? 'bg-brand-orange text-white'
										: btn.type === 'orange'
										? 'bg-orange-500 text-white'
										: 'border border-brand-orange text-brand-orange bg-white'
								"
								@click.stop="handleButtonClick(btn.action, order)"
								:style="{ marginLeft: btnIndex > 0 ? '8px' : '0' }">
								{{ btn.text }}
							</button>
						</view>

						<view v-if="showQrModal" class="fixed inset-0 z-50 flex items-center justify-center bg-mask backdrop-blur-sm" @click="closeQrModal">
							<view class="flex flex-col items-center" @click.stop>
								<view class="bg-white rounded-2xl p-8 flex flex-col items-center w-72 shadow-2xl animate-scale-in">
									<view class="text-lg font-bold text-gray-800 mb-6">扫码绑定</view>

									<view class="relative w-56 h-56 mb-6">
										<image v-if="qrCodeBase64" :src="qrCodeBase64" class="w-full h-full" mode="aspectFit"></image>
										<view v-else class="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
											<view class="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></view>
										</view>
									</view>

									<view class="text-xs text-gray-400 text-center leading-relaxed">
										使用微信“扫一扫”
										<br />
										绑定此订单行程和相册
									</view>
								</view>

								<view class="close-btn-area" @click="closeQrModal">
									<view class="close-btn">
										<view class="close-icon">
											<view class="icon-line line-1"></view>
											<view class="icon-line line-2"></view>
										</view>
									</view>
								</view>
							</view>
						</view>
					</view>
				</view>

				<!-- 无订单状态 -->
				<view v-if="!loading && orders.length === 0" class="flex flex-col items-center justify-center text-gray-400" style="height: 60vh">
					<!-- <text class="fa fa-file-text text-6xl text-gray-300 mb-4"></text> -->
					<image src="/static/icons/file-text.svg" class="w-16 h-16 mb-4" mode="aspectFit" />
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
import { toRaw } from 'vue';
const orderService = uniCloud.importObject('a-order-service', {
	customUI: true
});
const qrcodeService = uniCloud.importObject('qrcode-service');

export default {
	data() {
		return {
			tabs: [],
			currentTab: 0,
			isGuide: false,
			orders: [],
			loading: true,
			refreshing: false,
			loadingMore: false,
			hasMore: true,
			pageSize: 10,
			currentPage: 1,
			scrollViewHeight: '100vh',
			showQrModal: false,
			qrCodeBase64: ''
		};
	},
	async onLoad(options) {
		// 检查传入的类型参数
		this.isGuide = options.isGuide === 'true';
		console.log('[订单列表] 向导模式:', this.isGuide);

		if (this.isGuide) {
			this.tabs = [
				{ name: '全部', badge: 0 },
				{ name: '待出行', badge: 0 },
				{ name: '进行中', badge: 0 },
				{ name: '已完成', badge: 0 }
			];
		} else {
			this.tabs = [
				{ name: '全部', badge: 0 },
				{ name: '待支付', badge: 0 },
				{ name: '进行中', badge: 0 },
				{ name: '已完成', badge: 0 }
			];
		}

		if (options.type) {
			const typeMapping = {
				pending: 1,
				ongoing: 2,
				completed: 3
			};
			this.currentTab = typeMapping[options.type] || 0;
		}

		// 计算 scroll-view 高度
		this.calculateScrollViewHeight();

		// 加载订单数据
		await this.loadOrders(true);
	},
	methods: {
		switchTab(index) {
			if (this.currentTab === index) return;

			console.log('切换到tab: ', index);
			this.currentTab = index;
			this.currentPage = 1;
			this.hasMore = true;
			this.orders = [];
			this.loadOrders(true);
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
			this.preloadBadgeCounts();
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
				if (isRefresh) {
					this.loading = true;
					this.preloadBadgeCounts();
				}

				const res = await orderService.getOrders({
					isGuide: this.isGuide,
					tabIndex: this.currentTab,
					pageCurrent: this.currentPage,
					pageSize: this.pageSize
				});

				console.log('[订单列表] Cloud Object 返回结果:', res);

				const mappedOrders = res.orders.map((order) => this.mapOrderData(order));
				const mappedSnapshots = res.snapshots.map((snapshot) => this.mapSnapshotData(snapshot));

				const combinedResults = [...mappedOrders, ...mappedSnapshots].sort((a, b) => b.created_at_timestamp - a.created_at_timestamp);

				if (isRefresh) {
					this.orders = combinedResults;
				} else {
					this.orders = [...this.orders, ...combinedResults];
				}

				this.hasMore = res.hasMore;
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

		// a-orders 数据映射
		mapOrderData(order) {
			const now = Date.now();
			const DAY_MS = 86400000;

			// [!!] 确保使用 duration_days，如果不存在则回退到 quantity
			const days = order.duration_days !== undefined ? order.duration_days : order.quantity;
			const calculatedEndDate = (order.departure_date || 0) + (days || 0) * DAY_MS;

			let statusText = '未知状态';
			let buttons = [];

			if (this.isGuide) {
				// --- 向导 (a-orders) ---
				if (order.status === 'paid' || order.status === 'confirmed') {
					if (order.departure_date >= now) {
						statusText = '待出行';
						buttons = [
							{ text: '邀请', type: 'outline', action: 'invite' },
							{ text: '查看行程', type: 'outline', action: 'viewItinerary' },
							{ text: '联系客户', type: 'primary', action: 'contactClient' }
						];
					} else if (calculatedEndDate >= now) {
						statusText = '进行中';
						buttons = [
							{ text: '邀请', type: 'outline', action: 'invite' },
							{ text: '查看行程', type: 'outline', action: 'viewItinerary' },
							{ text: '联系客户', type: 'primary', action: 'contactClient' }
						];
					} else {
						statusText = '已完成';
						buttons = [{ text: '查看详情', type: 'outline', action: 'viewDetail' }];
					}
				} else if (order.status === 'processing') {
					statusText = '进行中';
					buttons = [
						{ text: '邀请', type: 'outline', action: 'invite' },
						{ text: '查看行程', type: 'outline', action: 'viewItinerary' },
						{ text: '联系客户', type: 'primary', action: 'contactClient' }
					];
				} else if (order.status === 'completed') {
					statusText = '已完成';
					buttons = [{ text: '查看详情', type: 'outline', action: 'viewDetail' }];
				} else {
					statusText = order.status; // (pending, cancelled, etc.)
					buttons = [{ text: '查看详情', type: 'outline', action: 'viewDetail' }];
				}
			} else {
				// --- 用户 (a-orders) ---
				if (order.status === 'pending') {
					statusText = '待支付';
					buttons = [
						{ text: '联系客服', type: 'outline', action: 'contactService' },
						{ text: '立即支付', type: 'orange', action: 'pay' }
					];
				} else if (order.status === 'paid' || order.status === 'confirmed' || order.status === 'processing') {
					// [!!] 按您的要求：paid + 时间
					if (calculatedEndDate < now) {
						statusText = '已完成';
						buttons = [
							{ text: '服务', type: 'outline', action: 'services' },
							{ text: '查看详情', type: 'outline', action: 'viewDetail' },
							{ text: '再次预订', type: 'orange', action: 'bookAgain' }
						];
					} else {
						statusText = '进行中';
						buttons = [
							{ text: '服务', type: 'outline', action: 'services' },
							{ text: '查看行程', type: 'outline', action: 'viewItinerary' },
							{ text: '联系客服', type: 'primary', action: 'contactService' }
						];
					}
				} else if (order.status === 'completed') {
					statusText = '已完成';
					buttons = [
						{ text: '服务', type: 'outline', action: 'services' },
						{ text: '查看详情', type: 'outline', action: 'viewDetail' },
						{ text: '再次预订', type: 'orange', action: 'bookAgain' }
					];
				} else {
					statusText = order.status === 'cancelled' ? '已取消' : '已退款';
				}
			}

			return {
				_id: order._id,
				orderNumber: order.order_no,
				status: statusText,
				originalStatus: order.status,
				title: order.product_snapshot?.title || '未知商品',
				departureDate: this.formatDate(order.departure_date) || '待确定',
				travelers: order.travel_users?.length || 1,
				price: (order.final_amount || 0).toLocaleString(),
				image: order.product_snapshot?.images?.[0] || 'https://dimg04.c-ctrip.com/images/0303s12000dwdbkfnEB6E.webp',
				buttons: buttons,
				contact_info: order.contact_info,
				travel_users: order.travel_users,
				staves: order.staves,
				created_at_timestamp: order.created_at, // 用于排序
				isSnapshot: false
			};
		},

		// a-snapshots 数据映射
		mapSnapshotData(snapshot, imageMap) {
			const now = Date.now();
			const DAY_MS = 86400000;
			const endDate = (snapshot.departure_date || 0) + (snapshot.total_days || 0) * DAY_MS;

			let statusText = '未知状态';
			let buttons = [];

			// 快照的状态逻辑对双方都是一样的
			if (snapshot.departure_date >= now) {
				statusText = '待出行';
			} else if (endDate >= now) {
				statusText = '进行中';
			} else {
				statusText = '已完成';
			}

			if (this.isGuide) {
				buttons = [
					{ text: '邀请', type: 'outline', action: 'invite' },
					{ text: '查看行程', type: 'outline', action: 'viewItinerary' },
					{ text: '联系客户', type: 'primary', action: 'contactClient' }
				];
			} else {
				buttons = [
					{ text: '服务', type: 'outline', action: 'services' },
					{ text: '查看行程', type: 'outline', action: 'viewItinerary' },
					{ text: '联系客服', type: 'primary', action: 'contactService' }
				];
			}

			return {
				_id: snapshot.order_id,
				orderNumber: snapshot.order_id,
				status: statusText,
				originalStatus: 'confirmed', // 假设 snapshot 都是 confirmed
				title: snapshot.title || '未知商品',
				departureDate: this.formatDate(snapshot.departure_date) || '待确定',
				travelers: snapshot.travel_users?.length || 1,
				price: '--',
				image: snapshot.product_image_url || 'https://dimg04.c-ctrip.com/images/0303s12000dwdbkfnEB6E.webp',
				buttons: buttons,
				contact_info: snapshot.contact_info,
				travel_users: snapshot.travel_users,
				staves: snapshot.staves,
				created_at_timestamp: snapshot.created_at,
				isSnapshot: true
			};
		},

		async preloadBadgeCounts() {
			try {
				const counts = await orderService.getBadgeCounts({ isGuide: this.isGuide });
				this.tabs[1].badge = counts.tab1;
				this.tabs[2].badge = counts.tab2;
				this.tabs[3].badge = counts.tab3;
				console.log('[徽章] 刷新:', counts.tab1, counts.tab2, counts.tab3);
			} catch (error) {
				console.error('[徽章] 加载徽章数量失败:', error);
			}
		},

		// 跳转到订单详情页
		goToOrderDetail(order) {
			console.log('[订单列表] 跳转到订单详情页:', order.orderNumber);
			uni.navigateTo({
				url: `/pages/order/order-detail?orderId=${order._id}&orderNo=${order.orderNumber}&isGuide=${this.isGuide}&isSnapshot=${order.isSnapshot}`
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
			console.log('action: ', action);
			console.log('order', order);
			if (action === 'contactClient') {
				const travelers = order.travel_users;

				if (!travelers || travelers.length === 0 || !travelers[0].mobile) {
					uni.showToast({ title: '未找到客户手机号', icon: 'none' });
					return;
				}

				const clientMobile = travelers[0].mobile;
				uni.showModal({
					title: '联系客户',
					content: `确定要拨打客户电话吗？\n号码：${clientMobile}`,
					success: (res) => {
						if (res.confirm) {
							uni.makePhoneCall({
								phoneNumber: clientMobile
							});
						}
					}
				});
				return; // 结束
			}

			switch (action) {
				case 'contactService':
					const staves = order.staves;

					if (!staves || staves.length === 0 || !staves[0].mobile) {
						uni.showToast({ title: '未找到客服号码', icon: 'none' });
						return;
					}
					const staffMobile = staves[0].mobile;
					uni.showModal({
						title: '联系客服',
						content: `是否拨打客服电话？\n号码：${staffMobile}`,
						success: (res) => {
							if (res.confirm) {
								uni.makePhoneCall({
									phoneNumber: staffMobile
								});
							}
						}
					});
					break;
				case 'services':
					uni.navigateTo({
						url: `/pages/order/order-services?orderId=${order._id}`
					});
					break;
				case 'viewItinerary':
					this.viewItinerary(order);
					break;
				case 'viewDetail':
					this.goToOrderDetail(order);
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
									this.onRefresh();
								}, 2000);
							}
						}
					});
					break;
				case 'invite':
					this.showInviteQr(order);
					break;
				default:
					console.log('未知操作:', action);
			}
		},

		// 显示邀请二维码
		async showInviteQr(order) {
			this.showQrModal = true;
			this.qrCodeBase64 = '';

			try {
				uni.showLoading({ title: '生成中...' });
				const res = await qrcodeService.generateOrderInviteCode(order._id);
				uni.hideLoading();

				if (res.errCode === 0) {
					this.qrCodeBase64 = res.base64;
				} else {
					uni.showToast({ title: res.errMsg, icon: 'none' });
					this.showQrModal = false;
				}
			} catch (e) {
				uni.hideLoading();
				uni.showToast({ title: '生成失败', icon: 'none' });
				this.showQrModal = false;
				console.error(e);
			}
		},

		closeQrModal() {
			this.showQrModal = false;
		},

		viewItinerary(order) {
			if (this.isGuide) {
				// 1. 将要查看的订单号存入缓存
				console.log('[订单列表] 向导模式跳转行程, 设置缓存:', order.orderNumber);
				uni.setStorageSync('guide_override_order_id', order.orderNumber);
			} else {
				// (可选) 如果是普通用户（虽然此按钮不应出现），确保清除该缓存
				uni.removeStorageSync('guide_override_order_id');
			}

			// 2. 正常跳转到 Tab Bar 页面
			uni.switchTab({
				url: '/pages/itinerary/itinerary'
			});
		},

		formatDate(timestamp) {
			if (!timestamp) {
				return '待确定';
			}
			try {
				const date = new Date(Number(timestamp));
				// 补零
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				return `${year}-${month}-${day}`;
			} catch (e) {
				console.error('日期格式化失败:', e);
				return '日期无效';
			}
		},

		// 智能图片压缩工具 (适配阿里云 OSS 和 携程)
		getOptimizedImage(url, width = 800, height = 0, quality = 80) {
			if (!url) return '';

			// 1. 检查是否已包含处理参数
			if (url.includes('x-oss-process') || /[_][RC]_\d+/.test(url) || url.includes('proc=')) {
				return url;
			}

			const isAliyun = url.includes('bspapp.com') || url.includes('aliyuncs.com');
			const isCtrip = url.includes('ctrip.com');

			// 2. 阿里云 OSS: 缩放 + WebP
			if (isAliyun) {
				return url + `?x-oss-process=image/resize,w_${width}/quality,q_${quality}/format,webp`;
			}

			// 3. 携程图片: 裁剪(_C_) 或 限宽(_R_)
			if (isCtrip) {
				if (height > 0) return url + `_C_${width}_${height}_Q${quality}.jpg`;
				return url + `_R_${width}_10000_Q${quality}.jpg`;
			}

			return url;
		}
	}
};
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
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.space-x-2 {
	margin-left: 0.5rem;
}

.bg-brand-orange {
	background-color: #eb6d20;
}
.text-brand-orange {
	color: #eb6d20;
}
.border-brand-orange {
	border-color: #eb6d20;
}

/* 橙色按钮样式 */
.bg-orange-500 {
	background-color: #ff9500;
}

.text-orange-500 {
	color: #ff9500;
}

/* 加载动画 */
.animate-spin {
	animation: spin 1s linear infinite;
}

.bg-mask {
	background-color: rgba(0, 0, 0, 0.6);
}

.border-close {
	border-color: rgba(255, 255, 255, 0.5);
}

.backdrop-blur-sm {
	backdrop-filter: blur(4px);
	-webkit-backdrop-filter: blur(4px);
} /* 增加磨砂玻璃质感 */
.animate-scale-in {
	animation: scaleIn 0.2s ease-out;
}

/* 关闭按钮专用样式 */
.close-btn-area {
	margin-top: 60rpx;
	padding: 20rpx;
	opacity: 0.8;
}
.close-btn-area:active {
	opacity: 0.5;
}

.close-btn {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	border: 2rpx solid rgba(255, 255, 255, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
}

.close-icon {
	position: relative;
	width: 32rpx;
	height: 32rpx;
}

.icon-line {
	position: absolute;
	top: 50%;
	left: 0;
	width: 100%;
	height: 4rpx; /* 线条厚度 */
	background-color: #ffffff; /* 强制白色 */
	border-radius: 4rpx;
}

/* 第一条线：旋转 45 度 */
.line-1 {
	transform: translateY(-50%) rotate(45deg);
}

/* 第二条线：旋转 -45 度 */
.line-2 {
	transform: translateY(-50%) rotate(-45deg);
}

@keyframes scaleIn {
	from {
		transform: scale(0.9);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
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
