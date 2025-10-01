<template>
	<view class="bg-gray-50 min-h-screen">
		<!-- 内容区域 -->
		<view class="pb-32 overflow-y-auto">
			<!-- 加载状态 -->
			<view v-if="loading" class="flex justify-center items-center py-20">
				<view class="flex flex-col items-center">
					<view class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></view>
					<text class="text-gray-500 text-sm">加载中...</text>
				</view>
			</view>
			
			<!-- 订单详情内容 -->
			<view v-else>
			<!-- 订单状态 -->
			<view class="bg-white mb-2.5 p-4">
				<view class="flex justify-between items-center">
					<view class="text-lg font-medium text-blue-500">{{ orderDetail.status }}</view>
					<view class="text-gray-500 text-sm">订单号: {{ orderDetail.orderNo }}</view>
				</view>
				
				<!-- 进度条 -->
				<view class="progress-bar">
					<view class="progress-line"></view>
					<view class="progress-active"></view>
					
					<view class="progress-step completed">
						<text class="fa-solid fa-check text-xs text-white"></text>
						<view class="progress-label">已付款</view>
					</view>
					
					<view class="progress-step active">
						<text class="fa-solid fa-check text-xs text-white"></text>
						<view class="progress-label">已出行</view>
					</view>
					
					<view class="progress-step">
						<view class="progress-label">待完成</view>
					</view>
				</view>
			</view>

			<!-- 产品信息 -->
			<view class="bg-white mb-2.5 p-4">
				<view class="flex flex-col">
					<view class="flex items-start">
						<view class="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
							<image :src="orderDetail.product.image" alt="产品图片" class="w-full h-full object-cover" mode="aspectFill"></image>
						</view>
						<view class="ml-4 flex-1">
							<text class="text-gray-900 font-semibold text-base leading-tight">{{ orderDetail.product.title }}</text>
							<view class="text-gray-500 text-xs mt-1">{{ orderDetail.product.subtitle }}</view>
							<view class="mt-2">
								<text class="text-orange-500 text-lg font-bold">¥{{ orderDetail.product.price }}</text>
								<text class="text-gray-400 text-xs ml-1">/ {{ orderDetail.product.peopleCount }}人</text>
							</view>
						</view>
					</view>
					
					<!-- 核心信息卡片 -->
					<view class="mt-4 bg-blue-50 rounded-lg p-4">
						<view class="info-grid">
							<view class="info-item">
								<view class="info-icon-wrapper">
									<text class="fa fa-users info-icon"></text>
								</view>
								<view class="info-content">
									<view class="info-label">出行人数</view>
									<view class="info-value">{{ orderDetail.product.peopleCount }}人</view>
								</view>
							</view>
							
							<view class="info-item">
								<view class="info-icon-wrapper">
									<text class="fa fa-calendar info-icon"></text>
								</view>
								<view class="info-content">
									<view class="info-label">行程天数</view>
									<view class="info-value">{{ orderDetail.product.duration }}</view>
								</view>
							</view>
							
							<view class="info-item">
								<view class="info-icon-wrapper">
									<text class="fa fa-plane info-icon"></text>
								</view>
								<view class="info-content">
									<view class="info-label">出行时间</view>
									<view class="info-value">{{ orderDetail.travelDate }}</view>
								</view>
							</view>
							
							<view class="info-item">
								<view class="info-icon-wrapper">
									<text class="fa fa-clock info-icon"></text>
								</view>
								<view class="info-content">
									<view class="info-label">下单时间</view>
									<view class="info-value">{{ orderDetail.createTime }}</view>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 联系人信息 -->
			<view class="bg-white mb-2.5 p-4">
				<view class="text-base font-semibold text-gray-800 mb-3">联系人信息</view>
				<view class="flex justify-between mb-2">
					<view class="text-gray-600 text-sm">姓名</view>
					<view class="text-gray-800 text-sm text-right">{{ orderDetail.contact.name }}</view>
				</view>
				<view class="flex justify-between">
					<view class="text-gray-600 text-sm">手机</view>
					<view class="text-gray-800 text-sm text-right">{{ orderDetail.contact.phone }}</view>
				</view>
			</view>

			<!-- 出行人信息 -->
			<view class="bg-white mb-2.5 p-4">
				<view class="text-base font-semibold text-gray-800 mb-3">出行人信息</view>
				<view 
					v-for="(traveler, index) in orderDetail.travelers" 
					:key="index"
					class="bg-gray-50 rounded-lg p-3"
					:class="{ 'mb-3': index < orderDetail.travelers.length - 1 }"
				>
					<view class="flex justify-between items-center mb-2">
						<text class="text-sm font-medium text-gray-700">出行人{{ index + 1 }}</text>
						<text class="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded">{{ traveler.type }}</text>
					</view>
					<view class="flex justify-between mb-1">
						<view class="text-gray-600 text-sm">姓名</view>
						<view class="text-gray-800 text-sm text-right">{{ traveler.name }}</view>
					</view>
					<view class="flex justify-between">
						<view class="text-gray-600 text-sm">身份证号</view>
						<view class="text-gray-800 text-sm text-right">{{ traveler.idCard }}</view>
					</view>
				</view>
			</view>

			<!-- 支付信息 -->
			<view class="bg-white mb-2.5 p-4">
				<view class="text-base font-semibold text-gray-800 mb-3">支付信息</view>
				<view class="flex justify-between mb-2">
					<view class="text-gray-600 text-sm">订单编号</view>
					<view class="text-gray-800 text-sm text-right">{{ orderDetail.orderNo }}</view>
				</view>
				<view class="flex justify-between mb-2">
					<view class="text-gray-600 text-sm">支付方式</view>
					<view class="text-gray-800 text-sm text-right">{{ orderDetail.payment.method }}</view>
				</view>
				<view class="flex justify-between mb-2">
					<view class="text-gray-600 text-sm">支付状态</view>
					<view class="text-green-600 font-medium text-sm text-right">{{ orderDetail.payment.status }}</view>
				</view>
				<view class="flex justify-between">
					<view class="text-gray-600 text-sm">支付金额</view>
					<view class="font-semibold text-lg text-right">¥{{ orderDetail.payment.amount }}</view>
				</view>
			</view>
			</view> <!-- 结束订单详情内容 -->
		</view>

		<!-- 底部操作栏 -->
		<view class="fixed bottom-0 left-0 right-0 bg-white flex items-center px-4 z-10 shadow-up safe-area-bottom">
			<view class="flex w-full py-3 gap-4">
				<button 
					class="flex-1 h-12 border border-blue-500 bg-white text-blue-500 rounded-full flex items-center justify-center shadow-sm transform transition-transform active:scale-95 active:opacity-80"
					hover-class="opacity-80"
					@click="viewItinerary"
				>
					<text class="fa fa-map text-lg mr-2"></text>
					<text class="font-medium">查看行程</text>
				</button>
				<button 
					class="flex-1 h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center shadow-sm transform transition-transform active:scale-95 active:opacity-80"
					hover-class="opacity-80"
					@click="contactService"
				>
					<text class="fa fa-phone text-lg mr-2"></text>
					<text class="font-medium">联系客服</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			loading: true,
			orderId: '',
			orderNo: '',
			orderDetail: {
				orderNo: '',
				status: '',
				product: {
					title: '',
					subtitle: '',
					image: '',
					price: '',
					peopleCount: '',
					duration: ''
				},
				travelDate: '',
				createTime: '',
				contact: {
					name: '',
					phone: ''
				},
				travelers: [],
				payment: {
					method: '微信支付',
					status: '已支付',
					amount: '25,058'
				}
			}
		}
	},
	onLoad(options) {
		console.log('[订单详情] 页面参数:', options);
		// 获取传入的订单ID和订单号
		if (options.orderId) {
			this.orderId = options.orderId;
		}
		if (options.orderNo) {
			this.orderNo = options.orderNo;
		}
		
		// 加载订单详情
		this.loadOrderDetail();
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},
		viewItinerary() {
			// 直接跳转到行程tabbar页面
			uni.switchTab({
				url: '/pages/itinerary/itinerary'
			});
		},
		contactService() {
			// 直接拨打客服电话
			uni.makePhoneCall({
				phoneNumber: '400-123-4567',
				success: () => {
					console.log('拨打电话成功');
				},
				fail: (err) => {
					console.error('拨打电话失败:', err);
					uni.showToast({
						title: '拨打电话失败',
						icon: 'none'
					});
				}
			});
		},
		async loadOrderDetail() {
			try {
				console.log('[订单详情] 开始加载订单详情数据, orderId:', this.orderId);
				this.loading = true;
				
				// 检查登录状态
				const token = uni.getStorageSync('uni_id_token');
				if (!token) {
					console.error('[订单详情] 用户未登录');
					uni.navigateTo({
						url: '/pages/login/login'
					});
					return;
				}
				
				if (!this.orderId) {
					console.error('[订单详情] 缺少订单ID');
					uni.showToast({
						title: '订单ID不存在',
						icon: 'none'
					});
					return;
				}
				
				// 使用 ClientDB 查询订单详情
				const db = uniCloud.database();
				const ordersCollection = db.collection('a-orders');
				
				const orderRes = await ordersCollection
					.where(`_id == "${this.orderId}" && user_id == $cloudEnv_uid`)
					.field('_id,order_no,status,product_snapshot,final_amount,departure_date,quantity,created_at,contact_info,travelers_info')
					.get();
				
				console.log('[订单详情] 查询结果:', orderRes);
				
				if (orderRes.result && orderRes.result.data && orderRes.result.data.length > 0) {
					const order = orderRes.result.data[0];
					
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
					
					// 格式化创建时间
					const createDate = new Date(order.created_at);
					const createTime = `${createDate.getFullYear().toString().slice(-2)}-${(createDate.getMonth() + 1).toString().padStart(2, '0')}-${createDate.getDate().toString().padStart(2, '0')} ${createDate.getHours().toString().padStart(2, '0')}:${createDate.getMinutes().toString().padStart(2, '0')}`;
					
					// 格式化出行日期
					const travelDate = order.departure_date ? 
					  new Date(order.departure_date).toISOString().split('T')[0] : 
					  '待确定';
					
					// 组装订单详情数据
					this.orderDetail = {
						orderNo: order.order_no,
						status: statusText,
						product: {
							title: order.product_snapshot?.title || '未知商品',
							subtitle: order.product_snapshot?.subtitle || '',
							image: order.product_snapshot?.images?.[0] || 'https://dimg04.c-ctrip.com/images/0303s12000dwdbkfnEB6E.webp',
							price: (order.final_amount || 0).toLocaleString(),
							peopleCount: order.quantity || 1,
							duration: order.product_snapshot?.duration || '未知'
						},
						travelDate: travelDate,
						createTime: createTime,
						contact: {
							name: order.contact_info?.name || '未填写',
							phone: order.contact_info?.phone || '未填写'
						},
						travelers: order.travelers_info || [],
						payment: {
							method: '微信支付',
							status: order.status === 'pending' ? '待支付' : '已支付',
							amount: (order.final_amount || 0).toLocaleString()
						}
					};
					
					console.log('[订单详情] 处理后的订单数据:', this.orderDetail);
				} else {
					console.error('[订单详情] 未找到订单数据');
					uni.showToast({
						title: '订单不存在',
						icon: 'none'
					});
					setTimeout(() => {
						uni.navigateBack();
					}, 1500);
				}
				
			} catch (error) {
				console.error('[订单详情] 加载订单详情失败:', error);
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				});
			} finally {
				this.loading = false;
			}
		}
	}
}
</script>

<style scoped>
/* 引入FontAwesome样式 */
/* 进度条样式 */
.progress-bar {
	display: flex;
	justify-content: space-between;
	position: relative;
	margin: 24px 0;
}

.progress-line {
	position: absolute;
	top: 12px;
	left: 0;
	right: 0;
	height: 2px;
	background-color: #e0e0e0;
	z-index: 1;
}

.progress-active {
	position: absolute;
	top: 12px;
	left: 0;
	width: 66%;
	height: 2px;
	background-color: #0086F6;
	z-index: 2;
}

.progress-step {
	width: 26px;
	height: 26px;
	border-radius: 50%;
	background-color: white;
	border: 2px solid #e0e0e0;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 3;
	position: relative;
}

.progress-step.active {
	border-color: #0086F6;
	background-color: #0086F6;
	color: white;
}

.progress-step.completed {
	border-color: #0086F6;
	background-color: #0086F6;
	color: white;
}

.progress-label {
	position: absolute;
	top: 30px;
	left: 50%;
	transform: translateX(-50%);
	width: 60px;
	text-align: center;
	font-size: 12px;
	color: #666;
	white-space: nowrap;
}

.progress-step.active .progress-label {
	color: #0086F6;
	font-weight: 500;
}

.progress-step.completed .progress-label {
	color: #0086F6;
	font-weight: 500;
}

/* 阴影效果 */
.shadow-up {
	box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}

/* 网格布局兼容 */
.grid {
	display: flex;
	flex-wrap: wrap;
}

.grid-cols-2 {
	width: 100%;
}

.grid-cols-2 > view {
	width: 50%;
}

.gap-3 > view {
	margin-bottom: 12px;
}

/* 补充的Tailwind样式 */
.text-orange-500 {
	color: #FF9500;
}

.w-5 {
	width: 1.25rem;
}

.object-cover {
	object-fit: cover;
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

/* 核心信息卡片样式 */
.info-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
}

.info-item {
	display: flex;
	align-items: center;
	width: calc(50% - 8px);
	min-height: 50px;
}

.info-icon-wrapper {
	width: 36px;
	height: 36px;
	background-color: rgba(0, 134, 246, 0.1);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 12px;
	flex-shrink: 0;
}

.info-icon {
	color: #0086F6;
	font-size: 16px;
}

.info-content {
	flex: 1;
	min-width: 0;
}

.info-label {
	font-size: 12px;
	color: #666;
	margin-bottom: 2px;
	line-height: 1.2;
}

.info-value {
	font-size: 14px;
	font-weight: 500;
	color: #333;
	line-height: 1.3;
	word-break: break-all;
}

/* 底部安全区域 */
.safe-area-bottom {
	padding-bottom: env(safe-area-inset-bottom);
}
</style> 