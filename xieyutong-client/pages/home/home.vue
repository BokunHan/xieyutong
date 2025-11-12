<template>
	<view class="min-h-screen bg-gray-50">
		<view class="page-header" id="page-header">
			<view class="status-bar-safe-area" :style="{ height: statusBarHeight + 'px' }"></view>

			<view class="top-nav-bar">
				<view class="logo-container">
					<image src="/static/logo.jpg" class="logo-img" mode="aspectFill"></image>
					<view class="logo-text-group">
						<view class="app-title">风漫国际旅行</view>
						<view class="app-slogan">随风漫行 × 向心而生</view>
					</view>
				</view>
			</view>
		</view>

		<scroll-view scroll-y scroll-with-animation class="main-scroll-area" :style="{ paddingTop: headerHeight + 'px' }" ref="mainScrollView" id="main-scroll-view">
			<view class="search-bar-container" @click="goToSearch">
				<view class="search-bar-content">
					<!-- <text class="fa fa-search search-bar-icon"></text> -->
					<image src="/static/icons/search.svg" class="search-icon" mode="aspectFit" />
					<text class="search-text-placeholder">国内游 / 私家团</text>
				</view>
			</view>

			<!-- <view class="hot-search-container">
				<view class="hot-search-tag-active">热搜</view>
				<view class="hot-search-tag" v-for="(tag, index) in hotSearchTags" :key="index">{{ tag }}</view>
			</view> -->

			<view class="banner-container">
				<view v-if="bannerLoading" class="banner-loading">
					<view class="loading-spinner"></view>
					<text class="loading-text">正在加载...</text>
				</view>

				<view v-else-if="bannerError" class="banner-error">
					<view class="error-icon">⚠️</view>
					<text class="error-text">{{ bannerErrorMsg }}</text>
					<button class="retry-btn" @click="refreshBannerData">重新加载</button>
				</view>
				<template v-else-if="bannerList.length > 0">
					<swiper
						class="banner-swiper"
						:circular="true"
						:indicator-dots="true"
						:autoplay="true"
						:interval="5000"
						:duration="500"
						indicator-color="rgba(0, 0, 0, 0.2)"
						indicator-active-color="#333"
						@change="onSwiperChange">
						<swiper-item v-for="(banner, index) in bannerList" :key="index">
							<image :src="banner.image" class="banner-img" mode="aspectFill" @click="handleBannerClick(banner)"></image>
							<view class="banner-content">
								<view class="banner-title">{{ banner.title }}</view>
								<view class="banner-subtitle">{{ banner.subtitle }}</view>
							</view>
						</swiper-item>
					</swiper>
				</template>
			</view>

			<!-- <view class="icon-grid-container">
				<view class="icon-grid">
					<view class="icon-item" v-for="(item, index) in iconGridList" :key="index">
						<view class="icon-wrapper">
							<image :src="item.icon" class="icon-item-img" mode="aspectFit" />
						</view>
						<text class="icon-label">{{ item.label }}</text>
					</view>
				</view>
			</view> -->

			<view class="content-area" id="content-area">
				<view class="section-title">
					<text class="section-title-text">精品私家团</text>
					<!-- <view class="section-title-more">
						<text class="section-title-more-text">查看全部</text>
						<image src="/static/icons/right.svg" class="right-icon" mode="aspectFit" />
					</view> -->
				</view>

				<view v-if="productLoading" class="product-loading">
					<view class="loading-spinner"></view>
					<text class="loading-text">正在加载产品数据...</text>
				</view>

				<view v-else-if="productError" class="product-error">
					<view class="error-icon">⚠️</view>
					<text class="error-text">{{ productErrorMsg }}</text>
					<button class="retry-btn" @click="loadProductData">重新加载</button>
				</view>

				<template v-else-if="displayProductList.length > 0">
					<view v-for="(product, index) in displayProductList" :key="product.id || index" class="product-card" @click="goToProductDetail(product.id)">
						<image :src="product.image" class="product-img" mode="aspectFill"></image>
						<view class="product-info">
							<view class="product-title">{{ product.title }}</view>
							<view class="product-meta">
								<view class="product-rating">
									<image src="/static/icons/star.svg" class="star-icon" mode="aspectFit" />
									<!-- <text class="fa fa-star rating-star"></text> -->
									<text>{{ product.rating }}分</text>
								</view>
								<view>已售{{ product.soldCount }}人</view>
							</view>
							<view class="product-price">
								<view>
									<text class="price">{{ product.price }}</text>
									<text class="price-label">/人起</text>
								</view>
								<view class="promotion-tag">{{ product.tag }}</view>
							</view>
						</view>
					</view>
				</template>
			</view>
		</scroll-view>

		<CouponModal :visible="showCouponModal" :couponList="newCouponData" @close="handleCloseCouponModal" @confirm="handleGoToCoupons" />
		<UserInfoModal :visible="showUserInfoModal" @close="handleCloseUserInfoModal" />
	</view>
</template>

<script>
import CouponModal from '@/components/coupon-modal/coupon-modal.vue';
import UserInfoModal from '@/components/userInfoModal/userInfoModal.vue';

export default {
	components: {
		CouponModal,
		UserInfoModal
	},
	data() {
		return {
			statusBarHeight: 0,
			screenHeight: 0,
			headerHeight: 0,
			currentScrollTop: 0,
			isLoading: false,
			scrollViewScrollTop: 0,
			currentBannerIndex: 0,
			bannerLoading: true,
			bannerError: false,
			bannerErrorMsg: '',
			bannerList: [],
			productList: [],
			productLoading: false,
			productError: false,
			productErrorMsg: '',

			hotSearchTags: ['北疆', '禾木雪村', '喀纳斯', '滑雪', '领队带玩'],

			iconGridList: [
				{ label: '国内出游', icon: '/static/icons/map-o.svg' },
				{ label: '境外逸游', icon: '/static/icons/earth-o.svg' },
				{ label: '精品小团', icon: '/static/icons/truck-o.svg' },
				{ label: '私家主题', icon: '/static/icons/star-o.svg' },
				{ label: '野奢营地', icon: '/static/icons/house-o.svg' },
				{ label: '高端定制', icon: '/static/icons/write-o.svg' },
				{ label: '超能领队', icon: '/static/icons/circle-user-o.svg' },
				{ label: '旅行日历', icon: '/static/icons/calendar-o.svg' }
			],

			showCouponModal: false,
			newCouponData: [],
			showUserInfoModal: false
		};
	},
	computed: {
		// 计算产品列表状态用于调试
		productListStatus() {
			const status = {
				总数量: this.productList.length,
				加载状态: this.productLoading,
				错误状态: this.productError,
				有更多数据: this.hasMoreProducts,
				当前页码: this.currentPage,
				首个产品:
					this.productList.length > 0
						? {
								id: this.productList[0].id,
								title: this.productList[0].title,
								price: this.productList[0].price
						  }
						: null
			};
			console.log('📊 产品列表状态变化:', status);
			return status;
		},

		// 过滤和排序后的产品列表
		displayProductList() {
			let filteredList = [...this.productList];
			filteredList.sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0));

			return filteredList;
		}
	},
	// 页面卸载时清理资源
	onUnload() {
		// if (this.scrollTimer) {
		// 	clearTimeout(this.scrollTimer);
		// 	this.scrollTimer = null;
		// }
	},
	async onLoad() {
		getApp().globalData.isModalShowing = false;
		console.log('=== 首页 onLoad 开始 ===');

		// 获取系统信息
		const systemInfo = uni.getSystemInfoSync();
		this.screenHeight = systemInfo.windowHeight;
		this.statusBarHeight = systemInfo.statusBarHeight || 0;
		console.log('📱 系统信息:', {
			screenHeight: this.screenHeight,
			statusBarHeight: this.statusBarHeight
		});

		this.loadBannerData();
		this.loadProductData();

		// 加载banner数据
		// this.loadBannerData();

		// // 加载产品数据
		// this.loadProductData();

		// // 调用检查优惠券的方法
		// await this.checkNewCouponModal();

		// // 检查是否有进行中的行程
		// await this.checkCurrentItinerary();

		console.log('=== 首页 onLoad 结束 ===');
	},
	onReady() {
		try {
			const query = uni.createSelectorQuery().in(this);
			query
				.select('#page-header')
				.boundingClientRect((data) => {
					if (data) {
						this.headerHeight = data.height;
						console.log('📐 头部高度计算:', this.headerHeight);
					}
				})
				.exec();
		} catch (e) {
			console.error('计算头部高度失败:', e);
		}
	},
	async onShow() {
		// 检查是否有搜索关键词
		const searchText = getApp().globalData.searchText;
		if (searchText) {
			console.log('🔍 检测到搜索关键词:', searchText);
			// 根据搜索关键词过滤产品列表
			this.filterProductsBySearch(searchText);
			// 清除搜索关键词，避免重复过滤
			getApp().globalData.searchText = '';
		}

		const justLoggedIn = getApp().globalData.justLoggedIn;
		if (justLoggedIn) {
			getApp().globalData.justLoggedIn = false; // 立即清除标志
			// 刚登录，强制刷新所有检查
			this.checkAndShowModals(true); // true = 强制检查
		} else {
			// 普通进入，按缓存策略检查
			this.checkAndShowModals(false); // false = 使用缓存
		}
	},
	methods: {
		// 统一的弹窗检查逻辑
		async checkAndShowModals(forceCheck = false) {
			// 0. 检查是否已登录
			const token = uni.getStorageSync('uni_id_token');
			if (!token) {
				console.log('[ModalCheck] 未登录，跳过所有检查');
				return;
			}

			// 1. 检查是否已在显示弹窗
			if (getApp().globalData.isModalShowing) {
				console.log('[ModalCheck] 已有弹窗显示中，跳过');
				return;
			}

			// 2. 检查用户信息是否完整
			// (forceCheck=true 时，刚登录，必须检查)
			const userInfoComplete = uni.getStorageSync('userInfoComplete');
			if (forceCheck || !userInfoComplete) {
				const checkRes = await this.checkUserInfoComplete();
				if (!checkRes.complete) {
					// 信息不完整，显示弹窗
					console.log('[ModalCheck] 用户信息不全，显示弹窗');
					getApp().globalData.isModalShowing = true;
					this.showUserInfoModal = true;
					return; // 优先显示信息弹窗，阻止优惠券弹窗
				} else {
					console.log('[ModalCheck] 用户信息完整');
				}
			}

			// 3. (用户信息完整) 检查优惠券
			await this.checkNewCouponModal();

			// 4. (无弹窗) 检查行程
			await this.checkCurrentItinerary();
		},

		// 检查用户信息完整性
		async checkUserInfoComplete() {
			try {
				const db = uniCloud.database();
				const userRes = await db.collection('uni-id-users').where('_id == $cloudEnv_uid').field('nickname, avatar_file, mobile_confirmed').get({ getOne: true });

				if (userRes.result.data) {
					const user = userRes.result.data;
					// 检查关键字段是否存在
					if (user.nickname && user.avatar_file && user.mobile_confirmed) {
						uni.setStorageSync('userInfoComplete', true); // 存入缓存
						return { complete: true };
					}
				}
			} catch (e) {
				console.error('检查用户信息失败:', e);
			}
			uni.removeStorageSync('userInfoComplete'); // 检查失败或信息不全
			return { complete: false };
		},

		// 处理用户信息弹窗关闭
		handleCloseUserInfoModal(e) {
			this.showUserInfoModal = false;
			getApp().globalData.isModalShowing = false; // 解锁
			if (e.success) {
				// 如果提交成功，立即重新检查后续流程
				this.checkAndShowModals(false);
			} else {
				// 用户取消
				this.checkAndShowModals(false);
			}
		},

		/**
		 * 检查是否有新的手动发放的优惠券
		 */
		async checkNewCouponModal() {
			console.log('[首页] 检查是否有新优惠券');

			// 检查登录状态
			const token = uni.getStorageSync('uni_id_token');
			const tokenExpired = uni.getStorageSync('uni_id_token_expired');

			if (!token || (tokenExpired && Date.now() > tokenExpired)) {
				console.log('[首页] 用户未登录，不检查优惠券');
				return;
			}

			if (getApp().globalData.isModalShowing) {
				console.log('[首页] 已有其他弹窗，跳过优惠券检查');
				return;
			}

			try {
				// 调用云对象
				const { result } = await uniCloud.callFunction({
					name: 'coupon-service',
					data: {
						action: 'getNewManualCoupon',
						event: { uniIdToken: token }
					}
				});

				console.log('[首页] 新优惠券检查结果:', result);

				if (result.errCode === 0 && result.data) {
					// 找到了新的优惠券
					this.newCouponData = result.data;
					this.showCouponModal = true;
					getApp().globalData.isModalShowing = true;
					console.log(`[首页] 发现 ${result.data.length} 张新优惠券，准备弹窗:`, result.data);
				} else {
					console.log('[首页] 没有新的优惠券');
				}
			} catch (error) {
				console.error('[首页] 检查新优惠券失败:', error);
				// 即便失败了也不打扰用户
			}
		},

		/**
		 * 关闭弹窗
		 */
		handleCloseCouponModal() {
			this.showCouponModal = false;
			this.newCouponData = [];
			getApp().globalData.isModalShowing = false;
		},

		/**
		 * 点击“立即查看”
		 */
		handleGoToCoupons() {
			this.showCouponModal = false;
			this.newCouponData = [];
			getApp().globalData.isModalShowing = false;
			uni.navigateTo({
				url: '/pages/coupon/list'
			});
		},

		// 滚动事件处理 - 优化性能
		onScroll(e) {
			this.currentScrollTop = e.detail.scrollTop;
		},

		// 优化搜索跳转体验
		goToSearch() {
			console.log('🔍 跳转到搜索页面');

			uni.navigateTo({
				url: '/pages/search/search',
				animationType: 'slide-in-right',
				animationDuration: 300
			});
		},

		scrollToContent() {
			console.log('=== scrollToContent 开始 ===');

			try {
				console.log('🚀 开始滚动到商品卡片列表区域');

				// 使用节点查询获取内容区域的位置
				const query = uni.createSelectorQuery().in(this);
				query.select('#content-area').boundingClientRect();
				query.exec((res) => {
					console.log('✅ 内容区域节点信息:', res);
					if (res && res[0]) {
						// 获取内容区域在scroll-view中的位置
						const contentAreaTop = res[0].top;
						console.log('📍 内容区域顶部位置:', contentAreaTop);

						// 计算目标滚动位置
						// 由于banner区域高度是100vh，内容区域在其下方
						// 我们需要滚动到banner底部，即内容区域顶部
						const targetScrollTop = this.screenHeight - 100; // 留一点缓冲空间

						console.log('🎯 目标滚动位置:', targetScrollTop);
						console.log('当前scrollViewScrollTop:', this.scrollViewScrollTop);

						// 关键修复：确保scroll-top值发生变化才能触发滚动
						// 如果目标位置和当前位置相同，先设置为0再设置目标值
						if (this.scrollViewScrollTop === targetScrollTop) {
							console.log('🔄 scroll-top值相同，先重置为0');
							this.scrollViewScrollTop = 0;
							// 使用nextTick确保DOM更新后再设置目标值
							this.$nextTick(() => {
								this.scrollViewScrollTop = targetScrollTop;
								console.log('✅ 重置后设置目标滚动位置:', targetScrollTop);
							});
						} else {
							// 直接设置新的滚动位置
							this.scrollViewScrollTop = targetScrollTop;
							console.log('✅ 直接设置滚动位置:', targetScrollTop);
						}
					} else {
						console.log('⚠️ 无法获取内容区域节点信息，使用默认滚动');
						// 备用方案：滚动到一个屏幕高度
						const targetScrollTop = this.screenHeight - 100;

						if (this.scrollViewScrollTop === targetScrollTop) {
							this.scrollViewScrollTop = 0;
							this.$nextTick(() => {
								this.scrollViewScrollTop = targetScrollTop;
							});
						} else {
							this.scrollViewScrollTop = targetScrollTop;
						}
					}
				});
			} catch (error) {
				console.error('❌ scrollToContent异常:', error);
				console.log('异常详情:', {
					message: error.message,
					stack: error.stack
				});

				// 异常情况下的备用滚动方案
				const targetScrollTop = this.screenHeight - 100;
				if (this.scrollViewScrollTop === targetScrollTop) {
					this.scrollViewScrollTop = 0;
					this.$nextTick(() => {
						this.scrollViewScrollTop = targetScrollTop;
					});
				} else {
					this.scrollViewScrollTop = targetScrollTop;
				}
			}

			console.log('=== scrollToContent 结束 ===');
		},

		// 检查是否有进行中的行程
		async checkCurrentItinerary() {
			// 检查优惠券弹窗是否将要显示
			if (this.showCouponModal) {
				console.log('[首页] 已有新优惠券弹窗，本次不检查/跳转行程');
				// 阻止后续的行程检查和跳转
				return;
			}

			try {
				console.log('[首页] 检查是否有进行中的行程');

				// 检查用户登录状态
				const token = uni.getStorageSync('uni_id_token');
				const tokenExpired = uni.getStorageSync('uni_id_token_expired');

				if (!token || (tokenExpired && Date.now() > tokenExpired)) {
					console.log('[首页] 用户未登录，无需检查行程');
					return;
				}

				// 调用行程服务检查是否有进行中的行程
				const itineraryService = uniCloud.importObject('a-itinerary-service');
				const result = await itineraryService.getCurrentItinerary();

				console.log('[首页] 行程检查结果:', result);

				if (result.errCode === 0 && result.data) {
					console.log('[首页] 发现进行中的行程，缓存行程信息');
					// 存储行程信息到本地，供行程页面使用
					uni.setStorageSync('current_itinerary', result.data);

					// 可以在这里添加一些UI提示，比如在行程tab上显示小红点
					// 或者显示一个悬浮的行程提醒
					console.log('[首页] 用户有进行中的行程，当前第', result.data.currentDay, '天');
				} else {
					console.log('[首页] 没有进行中的行程');
					// 清除可能存在的旧行程数据
					uni.removeStorageSync('current_itinerary');
				}
			} catch (error) {
				console.log('[首页] 检查行程失败:', error);
			}
		},

		goToProductDetail(productId) {
			console.log('=== goToProductDetail 开始 ===');
			console.log('🔗 跳转到产品详情页，产品ID:', productId);
			console.log('📊 产品ID类型:', typeof productId);

			if (!productId) {
				console.error('❌ 产品ID为空，无法跳转');
				uni.showToast({
					title: '产品信息错误',
					icon: 'none'
				});
				return;
			}

			try {
				const url = `/pages/product-detail/product-detail?id=${productId}`;
				console.log('🚀 跳转URL:', url);

				uni.navigateTo({
					url: url,
					success: (res) => {
						console.log('✅ 产品详情页跳转成功:', res);
					},
					fail: (err) => {
						console.error('❌ 产品详情页跳转失败:', err);
						uni.showToast({
							title: '页面跳转失败',
							icon: 'none'
						});
					}
				});
			} catch (error) {
				console.error('❌ goToProductDetail异常:', error);
				uni.showToast({
					title: '跳转异常',
					icon: 'none'
				});
			}

			console.log('=== goToProductDetail 结束 ===');
		},

		handleBannerClick(banner) {
			console.log('=== Banner点击事件开始 ===');
			console.log('点击的banner数据:', banner);
			console.log('banner.url:', banner.url);
			console.log('banner.link_type:', banner.link_type);

			// 检查是否有链接地址
			if (!banner.url) {
				console.error('❌ banner没有配置url');
				uni.showToast({
					title: '暂无链接配置',
					icon: 'none'
				});
				return;
			}

			console.log('✅ banner有url配置');

			// 根据link_type判断跳转方式
			if (banner.link_type === 2) {
				console.log('📱 外部网页链接，使用webview打开');
				// 外部网页链接，使用webview打开
				this.skipToWebview(banner.url);
			} else {
				console.log('📄 小程序页面链接，直接跳转');
				// 小程序页面链接，直接跳转
				this.skipToPage(banner.url);
			}

			console.log('=== Banner点击事件结束 ===');
		},

		// 跳转到webview页面
		skipToWebview(url) {
			console.log('=== skipToWebview 开始 ===');
			console.log('原始URL:', url);
			console.log('URL类型:', typeof url);
			console.log('URL长度:', url.length);

			try {
				const encodedUrl = encodeURIComponent(url);
				console.log('✅ URL编码成功:', encodedUrl);
				console.log('编码后URL长度:', encodedUrl.length);

				const finalUrl = `/pages/webview/webview?url=${encodedUrl}`;
				console.log('✅ 最终跳转URL:', finalUrl);

				console.log('🚀 开始执行uni.navigateTo跳转...');
				uni.navigateTo({
					url: finalUrl,
					success: (res) => {
						console.log('✅ navigateTo成功:', res);
					},
					fail: (err) => {
						console.error('❌ navigateTo失败:', err);
						uni.showToast({
							title: '跳转失败',
							icon: 'none'
						});
					}
				});
			} catch (error) {
				console.error('❌ skipToWebview异常:', error);
				console.log('异常详情:', {
					message: error.message,
					stack: error.stack,
					url: url
				});
				uni.showToast({
					title: '跳转失败',
					icon: 'none'
				});
			}

			console.log('=== skipToWebview 结束 ===');
		},

		// 跳转到小程序页面
		skipToPage(url) {
			console.log('=== skipToPage 开始 ===');
			console.log('原始页面URL:', url);

			try {
				// 检查url是否以/开头，如果不是则添加
				const pageUrl = url.startsWith('/') ? url : `/${url}`;
				console.log('✅ 处理后的页面URL:', pageUrl);

				console.log('🚀 开始执行uni.navigateTo跳转...');
				uni.navigateTo({
					url: pageUrl,
					success: (res) => {
						console.log('✅ 页面跳转成功:', res);
					},
					fail: (err) => {
						console.error('❌ navigateTo失败，尝试switchTab:', err);
						// 如果navigateTo失败，尝试switchTab
						try {
							console.log('🔄 尝试使用switchTab跳转...');
							uni.switchTab({
								url: pageUrl,
								success: (res) => {
									console.log('✅ switchTab成功:', res);
								},
								fail: (switchErr) => {
									console.error('❌ switchTab也失败了:', switchErr);
									uni.showToast({
										title: '页面跳转失败',
										icon: 'none'
									});
								}
							});
						} catch (switchError) {
							console.error('❌ switchTab异常:', switchError);
							uni.showToast({
								title: '页面跳转失败',
								icon: 'none'
							});
						}
					}
				});
			} catch (error) {
				console.error('❌ skipToPage异常:', error);
				console.log('异常详情:', {
					message: error.message,
					stack: error.stack,
					url: url
				});
				uni.showToast({
					title: '页面跳转失败',
					icon: 'none'
				});
			}

			console.log('=== skipToPage 结束 ===');
		},

		onSwiperChange(e) {
			this.currentBannerIndex = e.detail.current;
		},

		// 加载Banner数据
		async loadBannerData() {
			console.log('=== loadBannerData 开始 ===');

			try {
				this.bannerLoading = true;
				this.bannerError = false;
				this.bannerErrorMsg = '';

				console.log('🚀 开始查询uniCloud数据库 a-banners表...');

				// 获取数据库引用
				const db = uniCloud.databaseForJQL();
				console.log('✅ 数据库引用获取成功');

				// 查询banner数据
				const result = await db
					.collection('a-banners')
					.where('status == 1') // 只查询状态为启用的banner
					.orderBy('sort_order asc, created_at desc') // 按排序字段和创建时间排序
					.field('title, subtitle, button_name, image, url, link_type, sort_order') // 指定需要的字段
					.get();

				console.log('✅ 数据库查询成功:', result);
				console.log('查询结果数量:', result.data.length);
				console.log('查询结果详情:', result.data);

				if (result.data && result.data.length > 0) {
					this.bannerList = result.data;
					console.log('✅ banner数据设置成功，共', this.bannerList.length, '条');

					// 确保currentBannerIndex在有效范围内
					if (this.currentBannerIndex >= this.bannerList.length) {
						this.currentBannerIndex = 0;
						console.log('🔄 重置轮播图索引为0');
					}
				} else {
					console.log('⚠️ 数据库中没有启用的banner数据');
					this.bannerList = [];
					this.currentBannerIndex = 0;
				}
			} catch (error) {
				console.error('❌ 加载banner数据失败:', error);
				console.log('错误详情:', {
					message: error.message,
					code: error.code,
					stack: error.stack
				});

				this.bannerError = true;
				this.bannerErrorMsg = error.message || '网络错误，请稍后重试';

				// 错误时不使用默认数据，保持错误状态
				this.bannerList = [];
				this.currentBannerIndex = 0;

				// 显示错误提示
				uni.showToast({
					title: '加载Banner数据失败',
					icon: 'none',
					duration: 3000
				});
			} finally {
				this.bannerLoading = false;
				console.log('=== loadBannerData 结束 ===');
			}
		},

		// 重新加载Banner数据
		refreshBannerData() {
			console.log('🔄 用户手动刷新banner数据');
			this.loadBannerData();
		},

		// 加载产品数据
		async loadProductData() {
			console.log('=== loadProductData 开始 ===');
			this.productLoading = true;
			this.productError = false;
			this.productErrorMsg = '';
			this.productList = []; // 重置列表

			try {
				const db = uniCloud.databaseForJQL();

				// 1. 从 a-routes 获取所有 A_route_id
				console.log('[加载产品] 从 a-routes 获取所有 A_route_id...');
				const routesRes = await db
					.collection('a-routes')
					.field({ A_route_id: true }) // 只需要 A_route_id
					.get();

				if (!routesRes.data || routesRes.data.length === 0) {
					console.warn('[加载产品] a-routes 中没有数据。');
					this.productLoading = false;
					return;
				}

				// 2. 提取所有 A_route_id (这些是 a-products 的 _id)
				const productIdsToFetch = routesRes.data.map((item) => item.A_route_id).filter((id) => id); // 过滤掉空值

				console.log(`[加载产品] 成功获取 ${productIdsToFetch.length} 个 A线路产品ID`);

				if (productIdsToFetch.length === 0) {
					console.warn('[加载产品] 没有有效的 A_route_id 可供查询。');
					this.productLoading = false;
					return;
				}

				// 3. 使用 in 查询，一次性从 a-products 获取所有对应的产品
				console.log('[加载产品] 从 a-products 查询产品详情...');
				const result = await db
					.collection('a-products')
					.where({
						ctrip_id: db.command.in(productIdsToFetch),
						status: 1
					})
					.field('_id, product_id, title, subtitle, price, child_price, rating, product_images, sales_count, review_count, view_count, sort_order, category, route_title')
					.get();

				console.log(`[加载产品] 数据库返回 ${result.data.length} 条产品数据`);

				if (result.data && result.data.length > 0) {
					// 4. 数据预处理
					const processedData = result.data.map((item) => ({
						id: item._id,
						title: item.title || '未知商品',
						route_title: item.route_title || '',
						subtitle: item.subtitle || '',
						rating: Number(item.rating) || 5.0,
						soldCount: Number(item.sales_count) || 0,
						reviewCount: Number(item.review_count) || 0,
						viewCount: Number(item.view_count) || 0,
						price: this.formatPrice(item.price),
						child_price: this.formatPrice(item.child_price),
						image: item.product_images && item.product_images.length > 0 ? item.product_images[0] : 'https://images.unsplash.com/photo-1635582681213-450e9b127343?w=400',
						tag: this.generateTag(item),
						sort_order: Number(item.sort_order) || 0,
						category: item.category || '国内游'
					}));

					this.productList = processedData;
					console.log(`[加载产品] 数据处理完成, 总数: ${this.productList.length}`);
				}
			} catch (error) {
				console.error('[加载产品] 加载产品数据失败:', error);
				this.productError = true;
				this.productErrorMsg = error.message || '加载数据失败';
			} finally {
				this.productLoading = false;
				console.log('=== loadProductData 结束 ===');
			}
		},

		// 生成 Tag 的逻辑方法
		generateTag(item) {
			let tag = '热门推荐';
			if (item.sales_count > 100) tag = '爆款热销';
			else if (item.sales_count > 50) tag = '人气精选';
			else if (item.rating >= 4.8) tag = '高分好评';
			else if (item.view_count > 1000) tag = '热门关注';
			return tag;
		},

		// 格式化价格显示
		formatPrice(price) {
			console.log('💰 formatPrice 输入:', price, '类型:', typeof price);

			// 处理空值
			if (price === null || price === undefined || price === '') {
				console.log('💰 价格为空，返回默认值');
				return '价格待定';
			}

			// 转换为数字
			let numPrice;
			if (typeof price === 'string') {
				// 如果是字符串，去除非数字字符后转换
				const cleanPrice = price.replace(/[^0-9.]/g, '');
				numPrice = parseFloat(cleanPrice);
				console.log('💰 字符串转数字:', price, '->', cleanPrice, '->', numPrice);
			} else if (typeof price === 'number') {
				numPrice = price;
				console.log('💰 直接使用数字:', numPrice);
			} else {
				console.log('💰 未知类型，返回默认值');
				return '价格待定';
			}

			// 检查转换结果
			if (isNaN(numPrice) || numPrice < 0) {
				console.log('💰 转换失败或无效价格，返回默认值');
				return '价格待定';
			}

			// 格式化价格显示（添加千分位分隔符）
			const formattedPrice = numPrice.toLocaleString('zh-CN');
			console.log('💰 格式化结果:', formattedPrice);

			return formattedPrice;
		}
	}
};
</script>

<style>
/* 首页样式 */
/* 1. 新的固定头部样式 */
.page-header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	/* 背景改为白色 */
	background-color: white;
	padding-top: constant(safe-area-inset-top);
	padding-top: env(safe-area-inset-top);
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}

.status-bar-safe-area {
	width: 100%;
}

/* 顶部Logo栏 */
.top-nav-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 8px 16px;
	height: 44px; /* 标准导航栏高度 */
}

.logo-container {
	display: flex;
	align-items: center;
}

.logo-img {
	width: 49px;
	height: 40px;
	border-radius: 8px;
}

.logo-text-group {
	display: flex;
	flex-direction: column;
	color: #333;
}

.app-title {
	font-size: 17px;
	font-weight: 600;
	line-height: 1.3;
}

.app-slogan {
	font-size: 11px;
	color: #888;
	line-height: 1.3;
}

/* 固定搜索栏 */
.search-bar-container {
	padding: 8px 16px;
	margin-top: 6px;
}

.search-bar-content {
	display: flex;
	align-items: center;
	background-color: #f5f5f5;
	border-radius: 20px;
	border-color: rgba(255, 107, 53, 0.1);
	border-radius: 18px;
	border-style: solid;
	padding: 10px 16px;
}

.search-icon {
	width: 20px;
	height: 20px;
	margin-right: 10px;
}

.search-text-placeholder {
	color: #999;
	font-size: 14px;
	flex: 1;
}

.hot-search-container {
	display: flex;
	align-items: center;
	padding: 0px 16px 12px;
	margin-top: 10px;
	flex-wrap: nowrap;
	overflow-x: auto;
	/* 隐藏滚动条 */
	-ms-overflow-style: none; /* IE and Edge */
	scrollbar-width: none; /* Firefox */
}
.hot-search-container::-webkit-scrollbar {
	display: none; /* Chrome, Safari, Opera */
}

.hot-search-tag,
.hot-search-tag-active {
	flex-shrink: 0;
	padding: 6px 14px;
	border-radius: 18px;
	font-size: 13px;
	margin-right: 10px;
	background-color: #f5f5f5;
	color: #555;
}
.hot-search-tag-active {
	background-color: #ff6b35;
	color: white;
	font-weight: 600;
}

/* 2. 主滚动区域 */
.main-scroll-area {
	width: 100%;
	/* padding-top 将由JS动态设置 */
}
.main-scroll-area ::-webkit-scrollbar {
	display: none;
	width: 0;
	height: 0;
	-webkit-appearance: none;
	background: transparent;
	color: transparent;
}

/* 3. Banner容器 (新样式) */
.banner-container {
	position: relative;
	height: 30vh; /* 缩小高度 */
	overflow: hidden;
	/* 为轮播图底部留出空间，避免裁切 */
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	width: calc(100% - 24px);
	margin: 8px auto;
	border-radius: 12px;
}

.banner-swiper {
	width: 100%;
	height: 100%;
	border-radius: 12px;
	overflow: hidden;
}

.banner-img {
	width: 100%;
	height: 100%;
}

.banner-content {
	position: absolute;
	bottom: 30px; /* 距离底部30px (可调整) */
	left: 20px;
	right: 20px;
	color: white;
	z-index: 10;
	/* 添加文字阴影，使其在亮色背景下更清晰 */
	text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.banner-title {
	font-size: 22px;
	font-weight: 600;
	margin-bottom: 8px;
	/* 最多显示1行 */
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.banner-subtitle {
	font-size: 14px;
	opacity: 0.9;
	/* 最多显示2行 */
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

/* 4. 新增图标网格 */
.icon-grid-container {
	margin: 8px 12px 8px 12px;
	padding: 20px 16px;
	border-radius: 16px;
	position: relative;
}
.icon-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 16px 8px;
}
.icon-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	font-size: 12px;
	color: #333;
}
.icon-wrapper {
	width: 56px;
	height: 56px;
	border-color: rgba(255, 107, 53, 0.1);
	border-radius: 18px;
	border-style: solid;
	border-width: 2px;
	background-color: #fff8f3; /* 您的橙色配套浅色 */
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 8px;
}
.icon-item-img {
	width: 32px; /* 控制图标宽度 */
	height: 32px; /* 控制图标高度 */
}
.icon-item-fa {
	font-size: 22px;
	color: #ff6b35; /* 您的主色 */
}
.icon-label {
	font-size: 12px;
	color: #444;
}

/* 6. 内容区域 (产品列表) */
.content-area {
	padding: 16px 12px; /* 调整内边距 */
	background-color: #f9f9f9; /* 浅灰色背景 */
	/* 移除旧的负边距和圆角 */
}

/* 新增：章节标题 */
.section-title {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 4px 16px 4px; /* 匹配卡片边距 */
}
.section-title-text {
	font-size: 18px;
	font-weight: 600;
	color: #333;
}
.section-title-more {
	display: flex;
	align-items: center;
}
.section-title-more-text {
	font-size: 13px;
	color: #999;
}
.right-icon {
	width: 18px;
	height: 18px;
}

/* 产品卡片 - 匹配设计图样式 */
.product-card {
	background-color: white;
	border-radius: 12px;
	overflow: hidden;
	margin-bottom: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	transition: all 0.2s ease;
	border: 1px solid #f0f0f0;
}

/* ... (产品卡片 .product-card 内部样式保持不变) ... */
.product-card:active {
	transform: scale(0.98);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.product-img {
	width: 100%;
	height: 180px;
	object-fit: cover;
}

.product-info {
	padding: 12px 16px 16px;
}

.product-title {
	font-weight: 600;
	margin-bottom: 8px;
	font-size: 15px;
	line-height: 1.4;
	color: #333333;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.product-meta {
	display: flex;
	justify-content: space-between;
	margin-bottom: 10px;
	font-size: 13px;
	color: #666666;
}

.product-rating {
	display: flex;
	align-items: center;
}

.star-icon {
	width: 16px;
	height: 16px;
	margin-right: 3px;
}

/* .rating-star {
	color: #ffb400;
	margin-right: 4px;
} */

.product-price {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.price {
	color: #e53e3e;
	font-weight: 700;
	font-size: 18px;
}

.price-label {
	font-size: 12px;
	color: #999999;
	margin-left: 4px;
	font-weight: 400;
}

.promotion-tag {
	background-color: #fff8f3;
	color: #ff6b35;
	padding: 4px 8px;
	border-radius: 12px;
	font-size: 11px;
	font-weight: 600;
	border: 1px solid #fceae1;
}

/* 微动画效果 */
.category-item:active {
	transform: scale(0.95);
}

.sort-tab:active {
	transform: scale(0.95);
	background-color: #f5f5f5;
}

.search-bar-content:active {
	transform: scale(0.98);
}

/* ... (加载、错误、空状态样式保持不变) ... */
.loading-spinner {
	width: 50px;
	height: 50px;
	border: 4px solid rgba(255, 255, 255, 0.3);
	border-top: 4px solid white;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin-bottom: 20px;
}

.loading-text {
	font-size: 16px;
	opacity: 0.9;
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

/* Banner相关样式 */
.banner-loading,
.banner-error,
.banner-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 35vh; /* 匹配新高度 */
	background: linear-gradient(135deg, #cfd8dc 0%, #263238 100%);
	color: white;
	text-align: center;
	padding: 40px 20px;
	border-radius: 0 0 20px 20px; /* 匹配新圆角 */
}

.error-icon,
.empty-icon {
	font-size: 60px;
	margin-bottom: 20px;
}

.error-text,
.empty-text {
	font-size: 16px;
	margin-bottom: 30px;
	opacity: 0.9;
	line-height: 1.4;
}

.retry-btn {
	background-color: rgba(255, 255, 255, 0.2);
	color: white;
	border: 2px solid white;
	border-radius: 25px;
	padding: 12px 24px;
	font-size: 16px;
	font-weight: 500;
	letter-spacing: 1px;
	transition: all 0.3s ease;
}

.retry-btn:active {
	background-color: rgba(255, 255, 255, 0.3);
	transform: translateY(2px);
}

/* 产品列表加载状态 */
.product-loading,
.product-error,
.product-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 300px; /* 避免撑满全屏 */
	background-color: #f9f9f9;
	color: #666; /* 更改文字颜色以适应浅色背景 */
	text-align: center;
	padding: 40px 20px;
}
/* 覆盖原有的深色背景和白色文字 */
.product-loading .loading-spinner {
	border: 4px solid rgba(0, 0, 0, 0.1);
	border-top: 4px solid #ff6b35;
}
.product-loading .loading-text,
.product-error .error-text,
.product-empty .empty-text {
	color: #666;
}
.product-error .retry-btn,
.product-empty .retry-btn {
	background-color: #ff6b35;
	color: white;
	border: none;
}
</style>
