<template>
	<view class="bg-gray-50 min-h-screen">
		<template v-if="!isCheckingLogin">
			<!-- 头部用户信息区域（包含状态栏） -->
			<view class="header-gradient text-white px-4 pb-6 rounded-b-2xl" :style="{ paddingTop: statusBarHeight + 120 + 'rpx' }">
				<!-- 已登录状态 -->
				<view v-if="isLoggedIn" class="flex items-center relative user-info-container" @click="goToProfileEdit">
					<view class="avatar">
						<image :src="userInfo.avatar" alt="用户头像" class="w-full h-full object-cover" mode="aspectFill"></image>
					</view>
					<view class="ml-4 flex-1">
						<view class="user-name">{{ userInfo.name }}</view>
						<view class="user-level mr-2">{{ userInfo.level }}</view>
						<view v-if="isGuide" class="user-tag mt-1" :style="{ backgroundColor: userRoleLabelBgColor }">
							<!-- <text class="fa fa-gem mr-1"></text> -->
							<image src="/static/icons/gem.svg" class="w-3 h-3 mr-1" mode="aspectFit" />
							<text>{{ userRoleLabel }}</text>
						</view>
						<!-- <view class="user-privilege mt-1">
						<text class="fa fa-tag mr-1"></text>
						<text>{{ userInfo.privilege }}</text>
					</view> -->
					</view>
					<view class="profile-edit-hint">
						<!-- <text class="fa fa-chevron-right"></text> -->
						<image src="/static/icons/chevron-right-white.svg" class="w-6 h-6" mode="aspectFit" />
					</view>
				</view>

				<!-- 未登录状态 -->
				<view v-else class="flex items-center relative user-info-container" @click="goToLogin">
					<view class="avatar">
						<view class="default-avatar">
							<!-- <text class="fa fa-user"></text> -->
							<image src="/static/icons/user.svg" class="w-8 h-8" mode="aspectFit" />
						</view>
					</view>
					<view class="ml-4 flex-1">
						<view class="user-name">点击登录</view>
						<view class="user-level">登录后享受会员权益</view>
					</view>
					<view class="profile-edit-hint">
						<!-- <text class="fa fa-chevron-right"></text> -->
						<image src="/static/icons/chevron-right.svg" class="w-5 h-5" mode="aspectFit" />
					</view>
				</view>

				<!-- 会员信息卡片 -->
				<view class="member-info-card mt-4 p-3 bg-white bg-opacity-20 rounded-xl">
					<!-- 已登录状态的会员信息 -->
					<view v-if="isLoggedIn">
						<view class="flex justify-between items-center mb-2">
							<view class="text-sm">累计消费</view>
							<view class="text-sm">距离{{ userInfo.nextLevelName || '下一等级' }}</view>
						</view>
						<view class="flex justify-between items-center mb-3">
							<view class="font-bold">¥{{ userInfo.totalSpent }}</view>
							<view class="font-bold">还需¥{{ userInfo.nextLevelAmount }}</view>
						</view>
						<!-- 进度条容器 -->
						<view class="relative h-2 bg-white bg-opacity-30 rounded-full mb-1">
							<view class="absolute left-0 top-0 h-2 bg-orange-500 rounded-full progress-bar" :style="{ width: userInfo.progressPercent + '%' }"></view>
						</view>
						<!-- 调试信息 -->
						<view class="text-xs text-white opacity-80">进度: {{ userInfo.progressPercent }}%</view>
					</view>

					<!-- 未登录状态的空数据 -->
					<view v-else class="text-center py-4">
						<view class="text-sm opacity-80 mb-2">登录后查看会员权益</view>
						<view class="flex justify-between items-center mb-3">
							<view class="font-bold">¥--</view>
							<view class="font-bold">--</view>
						</view>
						<view class="relative h-2 bg-white bg-opacity-30 rounded-full">
							<view class="absolute left-0 top-0 h-2 bg-white bg-opacity-50 rounded-full" style="width: 0%"></view>
						</view>
					</view>
				</view>
			</view>

			<view class="section guide-order-section" v-if="isGuide">
				<view class="section-title">私导订单</view>
				<view class="order-types">
					<view class="order-type" @click="goToGuideOrderList('pending')">
						<view class="order-icon" style="position: relative">
							<!-- <text class="fa fa-suitcase-rolling"></text> -->
							<image src="/static/icons/suitcase-rolling-orange.svg" class="w-5 h-5" mode="aspectFit" />
						</view>
						<view class="order-label">待出行</view>
					</view>
					<view class="order-type" @click="goToGuideOrderList('ongoing')">
						<view class="order-icon" style="position: relative">
							<!-- <text class="fa fa-route"></text> -->
							<image src="/static/icons/route.svg" class="w-5 h-5" mode="aspectFit" />
						</view>
						<view class="order-label">进行中</view>
					</view>
					<view class="order-type" @click="goToGuideOrderList('completed')">
						<view class="order-icon" style="position: relative">
							<!-- <text class="fa fa-check-circle"></text> -->
							<image src="/static/icons/check-circle-orange.svg" class="w-5 h-5" mode="aspectFit" />
						</view>
						<view class="order-label">已完成</view>
					</view>
				</view>
			</view>

			<!-- 我的订单 -->
			<view class="section">
				<view class="section-title">我的订单</view>
				<view class="order-types">
					<view class="order-type" @click="goToOrderList('pending')">
						<view class="order-icon" style="position: relative">
							<!-- <text class="fa fa-credit-card"></text> -->
							<image src="/static/icons/credit-card.svg" class="w-5 h-5" mode="aspectFit" />
							<view v-if="orderCounts.pending > 0" class="badge">{{ orderCounts.pending }}</view>
						</view>
						<view class="order-label">待支付</view>
					</view>
					<view class="order-type" @click="goToOrderList('ongoing')">
						<view class="order-icon" style="position: relative">
							<!-- <text class="fa fa-route"></text> -->
							<image src="/static/icons/route.svg" class="w-5 h-5" mode="aspectFit" />
							<view v-if="orderCounts.ongoing > 0" class="badge">{{ orderCounts.ongoing }}</view>
						</view>
						<view class="order-label">进行中</view>
					</view>
					<view class="order-type" @click="goToOrderList('completed')">
						<view class="order-icon" style="position: relative">
							<!-- <text class="fa fa-check-circle"></text> -->
							<image src="/static/icons/check-circle-orange.svg" class="w-5 h-5" mode="aspectFit" />
							<view v-if="orderCounts.completed > 0" class="badge">{{ orderCounts.completed }}</view>
						</view>
						<view class="order-label">已完成</view>
					</view>
				</view>
			</view>

			<!-- 功能菜单 -->
			<view class="section">
				<view class="menu-item" @click="goToCoupons">
					<view class="menu-left">
						<view class="menu-icon">
							<!-- <text class="fa fa-ticket-alt"></text> -->
							<image src="/static/icons/ticket-alt-orange.svg" class="w-4 h-4" mode="aspectFit" />
						</view>
						<view class="menu-label">我的优惠券</view>
					</view>
					<view class="menu-right">
						<text>{{ couponCount }}张可用</text>
						<!-- <text class="fa fa-chevron-right ml-1"></text> -->
						<image src="/static/icons/chevron-right.svg" class="w-5 h-5 ml-1" mode="aspectFit" />
					</view>
				</view>

				<view class="menu-item" @click="goToFavorites">
					<view class="menu-left">
						<view class="menu-icon">
							<!-- <text class="fa fa-heart"></text> -->
							<image src="/static/icons/heart-orange.svg" class="w-4 h-4" mode="aspectFit" />
						</view>
						<view class="menu-label">我的收藏</view>
					</view>
					<view class="menu-right">
						<!-- <text class="fa fa-chevron-right"></text> -->
						<image src="/static/icons/chevron-right.svg" class="w-5 h-5" mode="aspectFit" />
					</view>
				</view>

				<view class="menu-item" @click="goToTravelers">
					<view class="menu-left">
						<view class="menu-icon">
							<!-- <text class="fa fa-map-marker-alt"></text> -->
							<image src="/static/icons/map-marker-alt.svg" class="w-4 h-4" mode="aspectFit" />
						</view>
						<view class="menu-label">常用出行人</view>
					</view>
					<view class="menu-right">
						<!-- <text class="fa fa-chevron-right"></text> -->
						<image src="/static/icons/chevron-right.svg" class="w-5 h-5" mode="aspectFit" />
					</view>
				</view>
			</view>

			<!-- 设置菜单 -->
			<view class="section">
				<view class="menu-item" @click="goToCustomerService">
					<view class="menu-left">
						<view class="menu-icon">
							<!-- <text class="fa fa-headset"></text> -->
							<image src="/static/icons/headset.svg" class="w-4 h-4" mode="aspectFit" />
						</view>
						<view class="menu-label">客服中心</view>
					</view>
					<view class="menu-right">
						<!-- <text class="fa fa-chevron-right"></text> -->
						<image src="/static/icons/chevron-right.svg" class="w-5 h-5" mode="aspectFit" />
					</view>
				</view>

				<view class="menu-item" @click="logout">
					<view class="menu-left">
						<view class="menu-icon">
							<!-- <text class="fa fa-cog"></text> -->
							<image src="/static/icons/cog.svg" class="w-4 h-4" mode="aspectFit" />
						</view>
						<view class="menu-label">登出</view>
					</view>
					<view class="menu-right">
						<!-- <text class="fa fa-chevron-right"></text> -->
						<image src="/static/icons/chevron-right.svg" class="w-5 h-5" mode="aspectFit" />
					</view>
				</view>
			</view>

			<!-- 底部间距 -->
			<view style="height: 70px"></view>
		</template>
	</view>
</template>

<script>
export default {
	data() {
		return {
			isCheckingLogin: true,
			statusBarHeight: 0,
			isLoggedIn: false, // 登录状态
			isGuide: false,
			userInfo: {
				avatar:
					'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80'
			},
			orderCounts: {
				pending: 0,
				ongoing: 0,
				completed: 0
			},
			couponCount: 0,
			// 缓存相关
			memberDataCache: null,
			memberDataCacheTime: 0,
			orderDataCache: null,
			orderDataCacheTime: 0,
			couponDataCache: null,
			couponDataCacheTime: 0,
			cacheExpireTime: 5 * 60 * 1000, // 5分钟缓存过期时间
			shortCacheExpireTime: 2 * 60 * 1000, // 2分钟短期缓存（订单、优惠券）
			isPreloading: false,
			isDataLoading: false,
			// 骨架屏显示状态
			showSkeleton: true
		};
	},
	computed: {
		userRoleLabel() {
			if (this.isLoggedIn) {
				if (this.isGuide) {
					return '认证私导';
				} else {
					return '';
				}
			}
			return '';
		},

		userRoleLabelBgColor() {
			return this.isGuide ? '#EB6D20' : 'rgba(255, 255, 255, 0.2)';
		}
	},
	onLoad() {
		// 获取系统信息中的状态栏高度
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;

		// 设置状态栏样式为浅色内容（适配深色背景）
		// #ifdef APP-PLUS
		plus.navigator.setStatusBarStyle('light');
		// #endif

		// 从本地缓存快速恢复数据状态
		this.loadFromLocalCache();

		// 检查登录状态
		this.checkLoginStatus();
	},
	onShow() {
		// 页面显示时重新检查登录状态
		this.checkLoginStatus();

		// 智能预加载策略：仅当缓存过期或不存在时才预加载
		this.smartPreloadData();
	},
	methods: {
		goToOrderDetail() {
			uni.navigateTo({
				url: '/pages/order/order-detail'
			});
		},

		// 从本地缓存快速恢复数据（页面加载时立即执行）
		loadFromLocalCache() {
			try {
				console.log('[缓存恢复] 开始从本地缓存恢复数据');

				// 恢复会员数据缓存
				const memberCache = uni.getStorageSync('member_data_cache');
				if (memberCache && memberCache.data) {
					this.memberDataCache = memberCache.data;
					this.memberDataCacheTime = memberCache.cacheTime;
					console.log('[缓存恢复] 会员数据已恢复');
				}

				// 恢复订单数据缓存
				const orderCache = uni.getStorageSync('order_data_cache');
				if (orderCache && orderCache.data) {
					this.orderDataCache = orderCache.data;
					this.orderDataCacheTime = orderCache.cacheTime;
					this.orderCounts = orderCache.data;
					console.log('[缓存恢复] 订单数据已恢复:', this.orderCounts);
				}

				// 恢复优惠券数据缓存
				const couponCache = uni.getStorageSync('coupon_data_cache');
				if (couponCache && couponCache.data !== undefined) {
					this.couponDataCache = couponCache.data;
					this.couponDataCacheTime = couponCache.cacheTime;
					this.couponCount = couponCache.data;
					console.log('[缓存恢复] 优惠券数据已恢复:', this.couponCount);
				}

				// 如果有缓存数据，立即隐藏骨架屏
				if (memberCache || orderCache || couponCache) {
					this.showSkeleton = false;
					console.log('[缓存恢复] 缓存数据已恢复，隐藏骨架屏');
				}
			} catch (error) {
				console.error('[缓存恢复] 恢复缓存数据失败:', error);
			}
		},

		// 智能预加载策略
		async smartPreloadData() {
			if (!this.isLoggedIn || this.isPreloading) {
				return;
			}

			const currentTime = Date.now();
			const needPreload = [];

			// 检查哪些数据需要预加载
			if (!this.memberDataCache || currentTime - this.memberDataCacheTime > this.cacheExpireTime) {
				needPreload.push('member');
			}

			if (!this.orderDataCache || currentTime - this.orderDataCacheTime > this.shortCacheExpireTime) {
				needPreload.push('order');
			}

			if (this.couponDataCache === null || currentTime - this.couponDataCacheTime > this.shortCacheExpireTime) {
				needPreload.push('coupon');
			}

			if (needPreload.length > 0) {
				console.log('[智能预加载] 需要预加载的数据:', needPreload);
				setTimeout(() => {
					this.preloadData(needPreload);
				}, 500); // 短延迟，避免影响页面显示
			} else {
				console.log('[智能预加载] 所有缓存都有效，跳过预加载');
			}
		},

		// 并行预加载多种数据
		async preloadData(dataTypes) {
			if (this.isPreloading) {
				return;
			}

			try {
				this.isPreloading = true;
				console.log('[并行预加载] 开始预加载数据:', dataTypes);

				const token = uni.getStorageSync('uni_id_token');
				if (!token) {
					return;
				}

				const promises = [];

				// 会员数据预加载
				if (dataTypes.includes('member')) {
					promises.push(this.preloadMemberDataOnly());
				}

				// 订单数据预加载
				if (dataTypes.includes('order')) {
					promises.push(this.preloadOrderData());
				}

				// 优惠券数据预加载
				if (dataTypes.includes('coupon')) {
					promises.push(this.preloadCouponData());
				}

				// 并行执行所有预加载任务
				await Promise.allSettled(promises);
				console.log('[并行预加载] 所有预加载任务完成');
			} catch (error) {
				console.error('[并行预加载] 预加载失败:', error);
			} finally {
				this.isPreloading = false;
			}
		},

		// 仅预加载会员数据（不更新UI）
		async preloadMemberDataOnly() {
			try {
				const memberService = uniCloud.importObject('a-member-service');
				const memberResult = await memberService.getUserMemberInfo();

				if (memberResult.errCode === 0) {
					const currentTime = Date.now();
					this.memberDataCache = memberResult.data;
					this.memberDataCacheTime = currentTime;

					// 存储到本地缓存
					uni.setStorageSync('member_data_cache', {
						data: this.memberDataCache,
						cacheTime: this.memberDataCacheTime
					});

					console.log('[会员预加载] 会员数据预加载完成');
				}
			} catch (error) {
				console.error('[会员预加载] 预加载失败:', error);
			}
		},

		// 预加载订单数据
		async preloadOrderData() {
			try {
				const db = uniCloud.database();
				const ordersCollection = db.collection('a-orders');
				const orderRes = await ordersCollection.where('user_id == $cloudEnv_uid').field('status').get();

				if (orderRes.result && orderRes.result.data) {
					const orders = orderRes.result.data;

					// 统计各状态订单数量
					const orderCounts = {
						pending: orders.filter((order) => order.status === 'pending').length,
						ongoing: orders.filter((order) => ['paid', 'confirmed', 'processing'].includes(order.status)).length,
						completed: orders.filter((order) => order.status === 'completed').length
					};

					const currentTime = Date.now();
					this.orderDataCache = orderCounts;
					this.orderDataCacheTime = currentTime;

					// 存储到本地缓存
					uni.setStorageSync('order_data_cache', {
						data: this.orderDataCache,
						cacheTime: this.orderDataCacheTime
					});

					console.log('[订单预加载] 订单数据预加载完成:', orderCounts);
				}
			} catch (error) {
				console.error('[订单预加载] 预加载失败:', error);
			}
		},

		// 预加载优惠券数据
		async preloadCouponData() {
			try {
				const db = uniCloud.database();
				const couponsCollection = db.collection('a-user-coupons');
				const couponRes = await couponsCollection.where('user_id == $cloudEnv_uid && status == "unused" && expired_at > $cloudEnv_now').count();

				if (couponRes.result) {
					const couponCount = couponRes.result.total || 0;
					const currentTime = Date.now();
					this.couponDataCache = couponCount;
					this.couponDataCacheTime = currentTime;

					// 存储到本地缓存
					uni.setStorageSync('coupon_data_cache', {
						data: this.couponDataCache,
						cacheTime: this.couponDataCacheTime
					});

					console.log('[优惠券预加载] 优惠券数据预加载完成:', couponCount);
				}
			} catch (error) {
				console.error('[优惠券预加载] 预加载失败:', error);
			}
		},
		// 预加载会员数据（后台静默加载）
		async preloadMemberData() {
			if (this.isPreloading) {
				return;
			}

			try {
				this.isPreloading = true;
				console.log('[会员数据] 开始预加载会员数据');

				const token = uni.getStorageSync('uni_id_token');
				if (!token) {
					console.log('[会员数据] 未登录，跳过预加载');
					return;
				}

				// 检查缓存是否有效
				const currentTime = Date.now();
				if (this.memberDataCache && currentTime - this.memberDataCacheTime < this.cacheExpireTime) {
					console.log('[会员数据] 缓存有效，跳过预加载');
					return;
				}

				// 调用会员服务云对象获取会员信息
				const memberService = uniCloud.importObject('a-member-service');
				const memberResult = await memberService.getUserMemberInfo();

				if (memberResult.errCode === 0) {
					// 缓存会员数据
					this.memberDataCache = memberResult.data;
					this.memberDataCacheTime = currentTime;
					console.log('[会员数据] 预加载完成，数据已缓存');

					// 将缓存数据存储到本地
					uni.setStorageSync('member_data_cache', {
						data: this.memberDataCache,
						cacheTime: this.memberDataCacheTime
					});
				} else {
					console.error('[会员数据] 预加载失败:', memberResult.errMsg);
				}
			} catch (error) {
				console.error('[会员数据] 预加载异常:', error);
			} finally {
				this.isPreloading = false;
			}
		},

		// 从缓存或本地存储获取会员数据
		getMemberDataFromCache() {
			const currentTime = Date.now();

			// 1. 优先检查内存缓存
			if (this.memberDataCache && currentTime - this.memberDataCacheTime < this.cacheExpireTime) {
				console.log('[会员数据] 使用内存缓存数据');
				return this.memberDataCache;
			}

			// 2. 检查本地存储缓存
			try {
				const localCache = uni.getStorageSync('member_data_cache');
				if (localCache && localCache.data && currentTime - localCache.cacheTime < this.cacheExpireTime) {
					console.log('[会员数据] 使用本地存储缓存数据');
					// 同步到内存缓存
					this.memberDataCache = localCache.data;
					this.memberDataCacheTime = localCache.cacheTime;
					return localCache.data;
				}
			} catch (error) {
				console.error('[会员数据] 读取本地缓存失败:', error);
			}

			return null;
		},

		// 清除会员数据缓存
		clearMemberDataCache() {
			this.memberDataCache = null;
			this.memberDataCacheTime = 0;
			uni.removeStorageSync('member_data_cache');
			console.log('[会员数据] 缓存已清除');
		},

		// 清除所有缓存数据
		clearAllDataCache() {
			// 清除内存缓存
			this.memberDataCache = null;
			this.memberDataCacheTime = 0;
			this.orderDataCache = null;
			this.orderDataCacheTime = 0;
			this.couponDataCache = null;
			this.couponDataCacheTime = 0;

			// 清除本地存储缓存
			uni.removeStorageSync('member_data_cache');
			uni.removeStorageSync('order_data_cache');
			uni.removeStorageSync('coupon_data_cache');

			console.log('[缓存清理] 所有数据缓存已清除');
		},

		// 使用会员数据更新用户信息
		updateUserInfoWithMemberData(userData, memberData) {
			this.userInfo = {
				avatar:
					userData.avatar_file?.url ||
					'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80',
				name: userData.nickname || userData.username || '用户',
				level: memberData.memberInfo.levelName,
				privilege: memberData.memberInfo.privilege,
				totalSpent: memberData.consumptionData.totalSpent,
				nextLevelAmount: memberData.upgradeInfo.nextLevelAmount,
				progressPercent: memberData.upgradeInfo.progressPercent,
				nextLevelName: memberData.upgradeInfo.nextLevelName
			};

			console.log('[会员数据] 用户信息更新成功:', this.userInfo);
		},

		// 使用默认数据更新用户信息
		updateUserInfoWithDefaultData(userData) {
			this.userInfo = {
				avatar:
					userData.avatar_file?.url ||
					'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80',
				name: userData.nickname || userData.username || '用户',
				level: '普通会员',
				privilege: '暂无特权',
				totalSpent: '0',
				nextLevelAmount: '5,000',
				progressPercent: 0,
				nextLevelName: '银卡会员'
			};

			console.log('[会员数据] 使用默认用户信息');
		},

		// 检查登录状态
		async checkLoginStatus() {
			this.isCheckingLogin = true;

			try {
				// 根据 uni-id 规范检查 token
				const token = uni.getStorageSync('uni_id_token');
				const tokenExpired = uni.getStorageSync('uni_id_token_expired');

				if (token) {
					// 检查 token 是否过期
					const currentTime = Date.now();
					if (tokenExpired && currentTime < tokenExpired) {
						// token 有效，设置登录状态
						this.isLoggedIn = true;
						// 加载用户数据
						await this.loadUserData();
						this.isCheckingLogin = false;
						console.log('用户已登录，token 有效');
					} else {
						// token 已过期，清除本地存储
						console.log('token 已过期，清除登录状态');
						uni.removeStorageSync('uni_id_token');
						uni.removeStorageSync('uni_id_token_expired');
						uni.removeStorageSync('uni_id_uid');
						this.isLoggedIn = false;
						this.isGuide = false;
						this.setEmptyData();
						this.goToLogin();
					}
				} else {
					// 没有 token，未登录状态
					console.log('未找到 token，用户未登录');
					this.isLoggedIn = false;
					this.isGuide = false;
					this.setEmptyData();
					this.goToLogin();
				}
			} catch (error) {
				console.error('检查登录状态失败:', error);
				this.isLoggedIn = false;
				this.isGuide = false;
				this.setEmptyData();
				this.goToLogin();
			}
		},

		// 设置空数据状态
		setEmptyData() {
			this.isGuide = false;
			this.orderCounts = {
				pending: 0,
				ongoing: 0,
				completed: 0
			};
			this.couponCount = 0;
		},

		// 加载用户数据（优化版本）
		async loadUserData() {
			if (this.isDataLoading) {
				return;
			}

			try {
				this.isDataLoading = true;
				console.log('[用户数据] 开始加载用户数据');

				// 1. 查询用户基本信息
				const db = uniCloud.database();
				const usersCollection = db.collection('uni-id-users');

				// 获取当前用户 uid
				const token = uni.getStorageSync('uni_id_token');
				if (!token) {
					console.error('未找到有效的用户 token');
					this.isLoggedIn = false;
					this.setEmptyData();
					return;
				}

				// 使用 clientDB 查询当前用户信息
				const userRes = await usersCollection.where('_id == $cloudEnv_uid').field('_id,username,nickname,avatar_file,mobile,email,register_date,role').get();

				console.log('用户查询结果:', userRes);

				if (userRes.result && userRes.result.data && userRes.result.data.length > 0) {
					const userData = userRes.result.data[0];

					this.isGuide = userData.role && userData.role.includes('guide');
					console.log('[角色检查] 是否为私导:', this.isGuide);

					// 2. 优先使用缓存数据快速渲染
					const currentTime = Date.now();

					// 检查会员数据缓存
					let memberData = this.getMemberDataFromCache();
					if (memberData) {
						console.log('[用户数据] 使用缓存的会员数据快速渲染');
						this.updateUserInfoWithMemberData(userData, memberData);
					} else {
						// 无缓存时显示默认数据，然后异步加载
						console.log('[用户数据] 无会员缓存，使用默认数据');
						this.updateUserInfoWithDefaultData(userData);
					}

					// 从缓存快速设置订单和优惠券数据
					if (this.orderDataCache && currentTime - this.orderDataCacheTime < this.shortCacheExpireTime) {
						this.orderCounts = this.orderDataCache;
						console.log('[用户数据] 使用缓存的订单数据:', this.orderCounts);
					}

					if (this.couponDataCache !== null && currentTime - this.couponDataCacheTime < this.shortCacheExpireTime) {
						this.couponCount = this.couponDataCache;
						console.log('[用户数据] 使用缓存的优惠券数据:', this.couponCount);
					}

					// 隐藏骨架屏（因为有数据可以显示了）
					this.showSkeleton = false;

					// 3. 异步并行加载需要更新的数据
					const asyncTasks = [];

					// 会员数据异步加载（如果缓存无效）
					if (!memberData) {
						asyncTasks.push(this.loadMemberDataAsync(userData));
					}

					// 订单数据异步加载（如果缓存无效）
					if (!this.orderDataCache || currentTime - this.orderDataCacheTime >= this.shortCacheExpireTime) {
						asyncTasks.push(this.loadOrderDataAsync());
					}

					// 优惠券数据异步加载（如果缓存无效）
					if (this.couponDataCache === null || currentTime - this.couponDataCacheTime >= this.shortCacheExpireTime) {
						asyncTasks.push(this.loadCouponDataAsync());
					}

					// 并行执行异步任务（不阻塞UI）
					if (asyncTasks.length > 0) {
						console.log('[用户数据] 开始并行加载异步数据，任务数:', asyncTasks.length);
						Promise.allSettled(asyncTasks).then(() => {
							console.log('[用户数据] 所有异步任务完成');
						});
					} else {
						console.log('[用户数据] 所有数据都是最新缓存，无需异步加载');
					}
				} else {
					console.error('未找到用户信息');
					// 如果查询不到用户信息，可能是 token 无效
					this.isLoggedIn = false;
					this.setEmptyData();
					uni.removeStorageSync('uni_id_token');
					uni.removeStorageSync('uni_id_token_expired');
					uni.removeStorageSync('uni_id_uid');
					return;
				}
			} catch (error) {
				console.error('加载用户数据失败:', error);
				this.showSkeleton = false; // 即使失败也要隐藏骨架屏
				// 加载失败时使用默认数据，不影响登录状态
				this.orderCounts = {
					pending: 0,
					ongoing: 0,
					completed: 0
				};
				this.couponCount = 0;
			} finally {
				this.isDataLoading = false;
			}
		},

		// 异步加载会员数据
		async loadMemberDataAsync(userData) {
			try {
				console.log('[异步会员] 开始异步加载会员数据');
				const memberService = uniCloud.importObject('a-member-service');
				const memberResult = await memberService.getUserMemberInfo();

				if (memberResult.errCode === 0) {
					const memberData = memberResult.data;

					// 更新缓存
					const currentTime = Date.now();
					this.memberDataCache = memberData;
					this.memberDataCacheTime = currentTime;
					uni.setStorageSync('member_data_cache', {
						data: this.memberDataCache,
						cacheTime: this.memberDataCacheTime
					});

					// 更新UI
					this.updateUserInfoWithMemberData(userData, memberData);
					console.log('[异步会员] 会员数据异步加载完成');
				} else {
					console.error('[异步会员] 获取会员信息失败:', memberResult.errMsg);
				}
			} catch (error) {
				console.error('[异步会员] 会员数据异步加载失败:', error);
			}
		},

		// 异步加载订单数据
		async loadOrderDataAsync() {
			try {
				console.log('[异步订单] 开始异步加载订单数据');
				const db = uniCloud.database();
				const ordersCollection = db.collection('a-orders');
				const orderRes = await ordersCollection.where('user_id == $cloudEnv_uid').field('status').get();

				if (orderRes.result && orderRes.result.data) {
					const orders = orderRes.result.data;

					// 统计各状态订单数量
					const orderCounts = {
						pending: orders.filter((order) => order.status === 'pending').length,
						ongoing: orders.filter((order) => ['paid', 'confirmed', 'processing'].includes(order.status)).length,
						completed: orders.filter((order) => order.status === 'completed').length
					};

					// 更新缓存和UI
					const currentTime = Date.now();
					this.orderDataCache = orderCounts;
					this.orderDataCacheTime = currentTime;
					this.orderCounts = orderCounts;

					uni.setStorageSync('order_data_cache', {
						data: this.orderDataCache,
						cacheTime: this.orderDataCacheTime
					});

					console.log('[异步订单] 订单数据异步加载完成:', orderCounts);
				}
			} catch (error) {
				console.error('[异步订单] 订单数据异步加载失败:', error);
			}
		},

		// 异步加载优惠券数据
		async loadCouponDataAsync() {
			try {
				console.log('[异步优惠券] 开始异步加载优惠券数据');
				const db = uniCloud.database();
				const couponsCollection = db.collection('a-user-coupons');
				const couponRes = await couponsCollection.where('user_id == $cloudEnv_uid && status == "unused" && expired_at > $cloudEnv_now').count();

				if (couponRes.result) {
					const couponCount = couponRes.result.total || 0;

					// 更新缓存和UI
					const currentTime = Date.now();
					this.couponDataCache = couponCount;
					this.couponDataCacheTime = currentTime;
					this.couponCount = couponCount;

					uni.setStorageSync('coupon_data_cache', {
						data: this.couponDataCache,
						cacheTime: this.couponDataCacheTime
					});

					console.log('[异步优惠券] 优惠券数据异步加载完成:', couponCount);
				}
			} catch (error) {
				console.error('[异步优惠券] 优惠券数据异步加载失败:', error);
			}
		},

		// 跳转到登录页
		goToLogin() {
			uni.navigateTo({
				url: '/pages/login/login?uniIdRedirectUrl=' + encodeURIComponent('/pages/profile/profile')
			});
		},

		goToProfileEdit() {
			if (!this.isLoggedIn) {
				this.goToLogin();
				return;
			}
			uni.navigateTo({
				url: '/pages/profile/profile-edit'
			});
		},
		goToOrderList(type) {
			if (!this.isLoggedIn) {
				this.goToLogin();
				return;
			}
			uni.navigateTo({
				url: `/pages/order/order-list?type=${type}`
			});
		},
		goToGuideOrderList(type) {
			if (!this.isLoggedIn) {
				this.goToLogin();
				return;
			}
			// 传递 isGuide=true 参数以作区分
			uni.navigateTo({
				url: `/pages/order/order-list?type=${type}&isGuide=true`
			});
		},
		goToCoupons() {
			if (!this.isLoggedIn) {
				this.goToLogin();
				return;
			}
			uni.navigateTo({
				url: '/pages/coupon/list'
			});
		},
		goToFavorites() {
			if (!this.isLoggedIn) {
				this.goToLogin();
				return;
			}
			uni.navigateTo({
				url: '/pages/favorites-list/favorites-list'
			});
		},
		goToTravelers() {
			if (!this.isLoggedIn) {
				this.goToLogin();
				return;
			}
			uni.navigateTo({
				url: '/pages/travelers/travelers'
			});
		},
		goToCustomerService() {
			// 直接拨打客服电话
			uni.makePhoneCall({
				phoneNumber: '400-123-4567',
				fail: () => {
					// 如果拨号失败，则显示客服电话并复制
					uni.showModal({
						title: '客服电话',
						content: '客服热线：400-123-4567\n\n工作时间：9:00-18:00',
						showCancel: true,
						cancelText: '取消',
						confirmText: '复制号码',
						success: (res) => {
							if (res.confirm) {
								uni.setClipboardData({
									data: '400-123-4567',
									success: () => {
										uni.showToast({
											title: '电话号码已复制',
											icon: 'success'
										});
									}
								});
							}
						}
					});
				}
			});
		},
		logout() {
			uni.showModal({
				title: '提示',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						// 清除用户信息
						uni.removeStorageSync('userInfo');
						uni.removeStorageSync('token');
						uni.removeStorageSync('uni_id_token');
						uni.removeStorageSync('uni_id_token_expired');
						uni.removeStorageSync('uni_id_uid');

						this.isGuide = false;
						// 清除所有数据缓存
						this.clearAllDataCache();

						// 跳转到登录页
						uni.reLaunch({
							url: '/pages/home/home'
						});
					}
				}
			});
		}
	}
};
</script>

<style>
/* 头部渐变背景 */
.header-gradient {
	background: linear-gradient(135deg, #eb6d20 0%, #d85c18 100%);
}

/* 用户头像 */
.avatar {
	width: 64px;
	height: 64px;
	border-radius: 50%;
	background-color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
	overflow: hidden;
}

/* 默认头像 */
.default-avatar {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(255, 255, 255, 0.9);
	color: #999;
	font-size: 24px;
}

/* 用户信息 */
.user-name {
	font-size: 18px;
	font-weight: 600;
	margin-bottom: 4px;
}

.user-level {
	font-size: 14px;
	opacity: 0.8;
	display: inline-block;
	background-color: rgba(255, 255, 255, 0.2);
	padding: 2px 8px;
	border-radius: 12px;
}

.user-privilege {
	font-size: 12px;
	opacity: 0.8;
	display: inline-block;
	background-color: #ff9500;
	padding: 2px 8px;
	border-radius: 12px;
	color: white;
}

.user-tag {
	font-size: 14px;
	opacity: 0.9;
	display: inline-flex;
	align-items: center;
	padding: 2px 10px;
	border-radius: 12px;
	color: white;
	transition: background-color 0.3s ease;
}

.profile-edit-hint {
	color: rgba(255, 255, 255, 0.8);
	font-size: 20px;
}

.user-info-container {
	cursor: pointer;
}

/* 区块样式 */
.section {
	background-color: white;
	border-radius: 16px;
	margin: 16px;
	padding: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
	font-size: 16px;
	font-weight: 600;
	margin-bottom: 16px;
}

.guide-order-section {
	border: 1px solid #eb6d20;
	padding: 15px;
}

/* 订单类型样式 */
.order-types {
	display: flex;
	justify-content: space-between;
	text-align: center;
}

.order-type {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 1;
}

.order-icon {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background-color: rgba(235, 109, 32, 0.1);
	color: #eb6d20;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 8px;
	font-size: 20px;
}

.order-label {
	font-size: 14px;
}

/* 菜单项样式 */
.menu-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 0;
	border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.menu-item:last-child {
	border-bottom: none;
	padding-bottom: 0;
}

.menu-item:first-child {
	padding-top: 0;
}

.menu-left {
	display: flex;
	align-items: center;
}

.menu-icon {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background-color: rgba(235, 109, 32, 0.1);
	color: #eb6d20;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 12px;
}

.menu-label {
	font-size: 15px;
}

.menu-right {
	color: #999999;
	display: flex;
	align-items: center;
}

/* 徽章样式 */
.badge {
	position: absolute;
	top: -5px;
	right: -5px;
	background-color: #ff9500;
	color: white;
	font-size: 12px;
	width: 18px;
	height: 18px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

/* 会员信息卡片 */
.member-info-card {
	/* 已在模板中使用内联样式 */
}

.progress-bar {
	transition: width 0.3s ease;
}

/* 补充样式 */
.object-cover {
	object-fit: cover;
}

.bg-opacity-20 {
	background-color: rgba(255, 255, 255, 0.2);
}

/* 进度条橙色背景 */
.bg-orange-500 {
	background-color: #ff9500;
}
</style>
