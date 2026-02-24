<template>
	<view class="bg-gray-50 min-h-screen">
		<view class="pb-32 overflow-y-auto">
			<view class="nav-bar" :style="{ paddingTop: statusBarHeight + 20 + 'px' }">
				<view class="back-btn" @click="goBack">
					<uni-icons type="left" size="24" color="#333"></uni-icons>
				</view>
			</view>

			<view v-if="loading" class="flex justify-center items-center py-20">
				<view class="flex flex-col items-center">
					<view class="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mb-2"></view>
					<text class="text-gray-500 text-sm">加载中...</text>
				</view>
			</view>

			<view v-else>
				<view class="bg-white mb-2.5 p-4">
					<view class="flex justify-between items-center">
						<view class="text-lg font-medium text-brand-orange">{{ orderDetail.status }}</view>
						<view class="text-gray-500 text-sm">订单号: {{ orderDetail.orderNo }}</view>
					</view>

					<view class="progress-bar">
						<view class="progress-line"></view>
						<view class="progress-active"></view>

						<view class="progress-step completed">
							<image src="/static/icons/check-circle-orange.svg" class="w-8 h-8" mode="aspectFit" />
							<view class="progress-label">已付款</view>
						</view>

						<view class="progress-step active">
							<image src="/static/icons/check-circle-orange.svg" class="w-8 h-8" mode="aspectFit" />
							<view class="progress-label">已出行</view>
						</view>

						<view class="progress-step">
							<view class="progress-label">待完成</view>
						</view>
					</view>
				</view>

				<view class="bg-white mb-2.5 p-4">
					<view class="flex flex-col">
						<view class="flex items-start">
							<view class="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
								<image :src="getOptimizedImage(orderDetail.product.image, 200, 200)" alt="产品图片" class="w-full h-full object-cover" mode="aspectFill"></image>
							</view>
							<view class="ml-4 flex-1">
								<text class="text-gray-900 font-semibold text-base leading-tight">{{ orderDetail.product.title }}</text>
								<view class="text-gray-500 text-xs mt-1">{{ orderDetail.product.subtitle }}</view>
								<view class="mt-2">
									<text class="text-orange-500 text-lg font-bold">¥{{ orderDetail.product.price }}</text>
									<text class="text-gray-400 text-xs ml-1">/ {{ orderDetail.travelers.length }}人</text>
								</view>
							</view>
						</view>

						<view class="mt-4 bg-brand-orange-50 rounded-lg p-4">
							<view class="info-grid">
								<view class="info-item">
									<view class="info-icon-wrapper">
										<image src="/static/icons/users-orange.svg" class="w-5 h-5" mode="aspectFit" />
									</view>
									<view class="info-content">
										<view class="info-label">出行人数</view>
										<view class="info-value">{{ orderDetail.travelers.length }}人</view>
									</view>
								</view>

								<view class="info-item">
									<view class="info-icon-wrapper">
										<image src="/static/icons/calendar-orange.svg" class="w-5 h-5" mode="aspectFit" />
									</view>
									<view class="info-content">
										<view class="info-label">行程天数</view>
										<view class="info-value">{{ orderDetail.product.duration }}</view>
									</view>
								</view>

								<view class="info-item">
									<view class="info-icon-wrapper">
										<image src="/static/icons/plane-orange.svg" class="w-5 h-5" mode="aspectFit" />
									</view>
									<view class="info-content">
										<view class="info-label">出行时间</view>
										<view class="info-value">{{ orderDetail.travelDate }}</view>
									</view>
								</view>

								<view class="info-item">
									<view class="info-icon-wrapper">
										<image src="/static/icons/clock.svg" class="w-5 h-5" mode="aspectFit" />
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

				<view v-if="!isSnapshot" class="bg-white mb-2.5 p-4">
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

				<view class="bg-white mb-2.5 p-4">
					<view class="text-base font-semibold text-gray-800 mb-3">出行人信息</view>

					<view v-if="!orderDetail.travelers || orderDetail.travelers.length === 0" class="text-gray-400 text-sm text-center py-4">暂无出行人信息</view>

					<view
						v-else
						v-for="(traveler, index) in orderDetail.travelers"
						:key="traveler.id || index"
						class="bg-gray-50 rounded-lg p-3"
						:class="{ 'mb-3': index < orderDetail.travelers.length - 1 }">
						<view class="flex justify-between mb-1">
							<view class="text-gray-600 text-sm">昵称 (出行人{{ index + 1 }})</view>
							<view class="text-gray-800 text-sm text-right font-medium">{{ traveler.nickname }}</view>
						</view>
						<view class="flex justify-between">
							<view class="text-gray-600 text-sm">手机</view>
							<view class="text-gray-800 text-sm text-right">{{ traveler.mobile || '未提供' }}</view>
						</view>
					</view>
				</view>

				<view v-if="!isSnapshot" class="bg-white mb-2.5 p-4">
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
			</view>
		</view>

		<view class="fixed bottom-0 left-0 right-0 bg-white flex items-center px-4 z-10 shadow-up safe-area-bottom">
			<view class="flex w-full py-3 gap-3">
				<button
					class="flex-1 h-12 border border-brand-orange bg-white text-brand-orange rounded-full flex items-center justify-center shadow-sm active:opacity-80 text-sm"
					@click="viewItinerary">
					<image src="/static/icons/route.svg" class="w-4 h-4 mr-1" mode="aspectFit" />
					<text class="font-medium">查看行程</text>
				</button>

				<button
					v-if="isGuide"
					class="flex-1 h-12 border border-brand-orange bg-white text-brand-orange rounded-full flex items-center justify-center shadow-sm active:opacity-80 text-sm"
					@click="manageSupplies">
					<uni-icons type="list" size="18" color="#eb6d20" class="mr-1"></uni-icons>
					<text class="font-medium">物资管理</text>
				</button>

				<button class="flex-1 h-12 bg-brand-orange text-white rounded-full flex items-center justify-center shadow-sm active:opacity-80 text-sm" @click="contactService">
					<image src="/static/icons/phone-white.svg" class="w-4 h-4 mr-1" mode="aspectFit" />
					<text class="font-medium">{{ isGuide ? '联系客户' : '向导' }}</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 0,
			loading: true,
			orderId: '',
			orderNo: '',
			isGuide: false,
			isSnapshot: false,
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
					amount: '0'
				}
			},

			contactButtonText: '联系客服',
			contactPhoneNumber: null
		};
	},
	onLoad(options) {
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;

		console.log('[订单详情] 页面参数:', options);
		// 获取传入的订单ID和订单号
		this.isGuide = options.isGuide === 'true';
		this.isSnapshot = options.isSnapshot === 'true';
		this.orderId = options.orderId;
		this.orderNo = options.orderNo;

		console.log(`[订单详情] 模式: ${this.isSnapshot ? '快照' : '订单'}, ID: ${this.orderId}`);

		// 加载订单详情
		this.loadOrderDetail();
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},
		viewItinerary() {
			if (this.isGuide) {
				const orderId = this.isSnapshot ? this.orderId : this.orderNo;
				// 如果是向导，将要查看的订单号存入缓存
				uni.setStorageSync('guide_override_order_id', orderId);
			} else {
				// 如果是普通用户，确保清除该缓存
				uni.removeStorageSync('guide_override_order_id');
			}
			// 直接跳转到行程tabbar页面
			uni.switchTab({
				url: `/pages/itinerary/itinerary`
			});
		},

		// 新增：跳转到物资管理页面
		manageSupplies() {
			// 跳转到物资管理页面，传递订单ID
			// 注意：请确保 pages/supplies/list 页面已创建
			uni.navigateTo({
				url: `/pages/order/order-supplies?orderId=${this.orderId}`
			});
		},

		contactService() {
			if (!this.contactPhoneNumber) {
				const message = this.isGuide ? '未找到客户联系方式' : '未找到向导联系方式';
				uni.showToast({
					title: message,
					icon: 'none'
				});
				return;
			}

			uni.showModal({
				title: `呼叫${this.isGuide ? '客户' : '向导'}`,
				content: this.contactPhoneNumber,
				success: (res) => {
					if (res.confirm) {
						uni.makePhoneCall({
							phoneNumber: this.contactPhoneNumber,
							success: () => {
								console.log('拨打电话成功');
							},
							fail: (err) => {
								console.error('拨打电话失败:', err);
							}
						});
					}
				}
			});
		},

		async loadOrderDetail() {
			try {
				this.loading = true;

				// 检查登录状态
				const token = uni.getStorageSync('uni_id_token');
				if (!token) {
					uni.navigateTo({ url: '/pages/login/login' });
					return;
				}

				if (!this.orderId) {
					uni.showToast({ title: '订单ID不存在', icon: 'none' });
					return;
				}

				// 使用 ClientDB 查询订单详情
				const db = uniCloud.database();
				let orderRes = null;

				if (this.isSnapshot) {
					// --- 1. 查询 A-SNAPSHOTS ---
					let whereCondition = this.isGuide
						? `order_id == "${this.orderId}" && "staves.id" == $cloudEnv_uid`
						: `order_id == "${this.orderId}" && "travel_users.id" == $cloudEnv_uid`;

					orderRes = await db
						.collection('a-snapshots')
						.where(whereCondition)
						.field('_id,order_id,title,sub_title,product_id,departure_date,total_days,created_at,travel_users,staves')
						.get();
				} else {
					// --- 2. 查询 A-ORDERS ---
					let whereCondition = this.isGuide ? `_id == "${this.orderId}" && "staves.id" == $cloudEnv_uid` : `_id == "${this.orderId}" && user_id == $cloudEnv_uid`;

					orderRes = await db
						.collection('a-orders')
						.where(whereCondition)
						.field('_id,order_no,status,product_snapshot,final_amount,departure_date,quantity,created_at,contact_info,travel_users,staves,duration_days')
						.get();
				}

				if (orderRes.result && orderRes.result.data && orderRes.result.data.length > 0) {
					const order = orderRes.result.data[0];

					if (this.isSnapshot) {
						await this.processSnapshotData(order);
					} else {
						await this.processOrderData(order);
					}
				} else {
					uni.showToast({ title: '订单不存在', icon: 'none' });
					setTimeout(() => {
						uni.navigateBack();
					}, 1500);
				}
			} catch (error) {
				console.error('[订单详情] 加载订单详情失败:', error);
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				this.loading = false;
			}
		},

		async processOrderData(order) {
			const db = uniCloud.database();

			// --- 1. 处理状态 ---
			let statusText = '未知状态';
			switch (order.status) {
				case 'pending':
					statusText = '待支付';
					break;
				case 'paid':
				case 'confirmed':
					statusText = this.isGuide ? '待出行' : '进行中';
					break;
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

			// --- 2. 处理时间 ---
			const createDate = new Date(order.created_at);
			const createTime = `${createDate.getFullYear().toString().slice(-2)}-${(createDate.getMonth() + 1).toString().padStart(2, '0')}-${createDate
				.getDate()
				.toString()
				.padStart(2, '0')} ${createDate.getHours().toString().padStart(2, '0')}:${createDate.getMinutes().toString().padStart(2, '0')}`;
			const travelDate = order.departure_date ? new Date(order.departure_date).toISOString().split('T')[0] : '待确定';

			// --- 3. 处理出行人 (获取昵称) ---
			let travelersWithNicknames = [];
			const travelUsers = order.travel_users || [];
			if (travelUsers.length > 0) {
				const travelerIds = travelUsers.map((u) => u.id).filter((id) => id);
				if (travelerIds.length > 0) {
					try {
						const userRes = await db
							.collection('uni-id-users')
							.where({ _id: db.command.in(travelerIds) })
							.field('_id, nickname')
							.get();
						const nicknameMap = new Map(userRes.result.data.map((u) => [u._id, u.nickname]));

						travelersWithNicknames = travelUsers.map((u) => ({
							id: u.id,
							mobile: u.mobile,
							nickname: nicknameMap.get(u.id) || '未知昵称'
						}));
					} catch (err) {
						travelersWithNicknames = travelUsers.map((u) => ({ id: u.id, mobile: u.mobile, nickname: '加载失败' }));
					}
				}
			}

			// --- 4. 处理底部联系按钮 ---
			if (this.isGuide) {
				this.contactButtonText = '联系客户';
				if (travelUsers.length > 0 && travelUsers[0].mobile) {
					this.contactPhoneNumber = travelUsers[0].mobile;
				} else if (order.contact_info && order.contact_info.phone) {
					this.contactPhoneNumber = order.contact_info.phone;
				}
			} else {
				this.contactButtonText = '联系向导';
				const staves = order.staves || [];
				const guide = staves.find((s) => s.role && s.role.includes('guide'));
				this.contactPhoneNumber = guide ? guide.mobile : null;
			}

			// --- 5. 组装最终数据 ---
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
				travelers: travelersWithNicknames,
				payment: {
					method: '微信支付',
					status: order.status === 'pending' ? '待支付' : '已支付',
					amount: (order.final_amount || 0).toLocaleString()
				}
			};
		},

		async processSnapshotData(snapshot) {
			const db = uniCloud.database();
			const now = Date.now();
			const DAY_MS = 86400000;

			// --- 1. 处理状态 (基于时间) ---
			const endDate = (snapshot.departure_date || 0) + (snapshot.total_days || 0) * DAY_MS;
			let statusText = '';
			if (snapshot.departure_date >= now) {
				statusText = '待出行';
			} else if (endDate >= now) {
				statusText = '进行中';
			} else {
				statusText = '已完成';
			}

			// --- 2. 处理时间 ---
			const createDate = new Date(snapshot.created_at);
			const createTime = `${createDate.getFullYear().toString().slice(-2)}-${(createDate.getMonth() + 1).toString().padStart(2, '0')}-${createDate
				.getDate()
				.toString()
				.padStart(2, '0')} ${createDate.getHours().toString().padStart(2, '0')}:${createDate.getMinutes().toString().padStart(2, '0')}`;
			const travelDate = snapshot.departure_date ? new Date(snapshot.departure_date).toISOString().split('T')[0] : '待确定';

			// --- 3. 处理出行人 ---
			let travelersWithNicknames = [];
			const travelUsers = snapshot.travel_users || [];
			if (travelUsers.length > 0) {
				const travelerIds = travelUsers.map((u) => u.id).filter((id) => id);
				if (travelerIds.length > 0) {
					try {
						const userRes = await db
							.collection('uni-id-users')
							.where({ _id: db.command.in(travelerIds) })
							.field('_id, nickname')
							.get();
						const nicknameMap = new Map(userRes.result.data.map((u) => [u._id, u.nickname]));
						travelersWithNicknames = travelUsers.map((u) => ({
							id: u.id,
							mobile: u.mobile,
							nickname: nicknameMap.get(u.id) || '未知昵称'
						}));
					} catch (err) {
						travelersWithNicknames = travelUsers.map((u) => ({ id: u.id, mobile: u.mobile, nickname: '加载失败' }));
					}
				}
			}

			// --- 4. 处理底部联系按钮 ---
			if (this.isGuide) {
				this.contactButtonText = '联系客户';
				if (travelUsers.length > 0 && travelUsers[0].mobile) {
					this.contactPhoneNumber = travelUsers[0].mobile;
				}
			} else {
				this.contactButtonText = '联系向导';
				const staves = snapshot.staves || [];
				const guide = staves.find((s) => s.role && s.role.includes('guide'));
				this.contactPhoneNumber = guide ? guide.mobile : null;
			}

			// --- 5. 获取产品图片 ---
			let imageUrl = 'https://dimg04.c-ctrip.com/images/0303s12000dwdbkfnEB6E.webp';
			if (snapshot.product_id) {
				try {
					const productRes = await db.collection('a-products').doc(snapshot.product_id).field('product_images').get();
					if (productRes.result.data && productRes.result.data.product_images) {
						imageUrl = productRes.result.data.product_images[0] || imageUrl;
					}
				} catch (imgErr) {
					console.error('获取产品图片失败:', imgErr);
				}
			}

			// --- 6. 组装最终数据 ---
			this.orderDetail = {
				orderNo: snapshot.order_id,
				status: statusText,
				product: {
					title: snapshot.title || '未知商品',
					subtitle: snapshot.sub_title || '',
					image: imageUrl,
					price: '--',
					peopleCount: travelUsers.length || 1,
					duration: snapshot.total_days || '未知'
				},
				travelDate: travelDate,
				createTime: createTime,
				contact: { name: 'N/A', phone: 'N/A' },
				travelers: travelersWithNicknames,
				payment: { method: 'N/A', status: '已支付', amount: '--' }
			};
		},

		// 智能图片压缩工具
		getOptimizedImage(url, width = 800, height = 0, quality = 80) {
			if (!url) return '';
			if (url.includes('x-oss-process') || /[_][RC]_\d+/.test(url) || url.includes('proc=')) {
				return url;
			}
			const isAliyun = url.includes('bspapp.com') || url.includes('aliyuncs.com');
			const isCtrip = url.includes('ctrip.com');
			if (isAliyun) {
				return url + `?x-oss-process=image/resize,w_${width}/quality,q_${quality}/format,webp`;
			}
			if (isCtrip) {
				if (height > 0) return url + `_C_${width}_${height}_Q${quality}.jpg`;
				return url + `_R_${width}_10000_Q${quality}.jpg`;
			}
			return url;
		}
	}
};
</script>

<style scoped>
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
	background-color: #eb6d20;
	z-index: 2;
}

.progress-step {
	width: 30px;
	height: 30px;
	border-radius: 50%;
	background-color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 3;
	position: relative;
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

.progress-step.active .progress-label,
.progress-step.completed .progress-label {
	color: #eb6d20;
	font-weight: 500;
}

/* 阴影效果 */
.shadow-up {
	box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

/* 补充的Tailwind样式 */
.text-orange-500 {
	color: #ff9500;
}
.text-brand-orange {
	color: #eb6d20;
}
.bg-brand-orange {
	background-color: #eb6d20;
}
.border-brand-orange {
	border-color: #eb6d20;
}
.bg-brand-orange-50 {
	background-color: rgba(235, 109, 32, 0.05);
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
	background-color: rgba(235, 109, 32, 0.1);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 12px;
	flex-shrink: 0;
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
