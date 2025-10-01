<template>
	<view class="min-h-screen bg-gray-50">
		<!-- 固定头部导航 -->
		<view class="fixed-header" :class="{ 'header-fixed': showFixedHeader }">
			<!-- 状态栏安全区域 -->
			<view class="status-bar-safe-area" :style="{ height: statusBarHeight + 'px' }"></view>
			
			<!-- 固定导航栏 -->
			<view class="sticky-nav" :class="{ 'nav-visible': showFixedHeader }">
				<view class="nav-content">
					<!-- 导航搜索栏 -->
					<view class="nav-search-bar" @click="goToSearch">
						<text class="fa fa-search nav-search-icon"></text>
						<text class="nav-search-placeholder">搜索目的地/产品</text>
					</view>
				</view>
				
				<!-- 分类栏 -->
				<view class="category-bar">
					<scroll-view scroll-x="true" class="category-scroll">
						<view class="category-list">
							<view 
								v-for="(category, index) in categoryList" 
								:key="index"
								class="category-item"
								:class="{ 'category-active': selectedCategory === category.value }"
								@click="selectCategory(category.value)"
							>
								{{ category.label }}
							</view>
						</view>
					</scroll-view>
				</view>
				
				<!-- 排序栏 -->
				<view class="sort-bar">
					<view class="sort-tabs">
						<view 
							class="sort-tab"
							:class="{ 'sort-active': sortType === 'sales' }"
							@click="changeSortType('sales')"
						>
							<text>销量</text>
							<text v-if="sortType === 'sales'" class="fa fa-arrow-down sort-arrow"></text>
						</view>
						<view 
							class="sort-tab"
							:class="{ 'sort-active': sortType === 'price' }"
							@click="changeSortType('price')"
						>
							<text>价格</text>
							<text v-if="sortType === 'price'" class="fa fa-arrow-down sort-arrow"></text>
						</view>
						<view 
							class="sort-tab"
							:class="{ 'sort-active': sortType === 'newest' }"
							@click="changeSortType('newest')"
						>
							<text>新品</text>
							<text v-if="sortType === 'newest'" class="fa fa-arrow-down sort-arrow"></text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 主滚动区域 -->
		<scroll-view 
			scroll-y 
			scroll-with-animation
			class="main-scroll-area" 
			:style="{height: screenHeight + 'px'}" 
			:scroll-top="scrollViewScrollTop"
			@scroll="onScroll"
			ref="mainScrollView" 
			id="main-scroll-view"
		>
			<!-- Banner区域 -->
			<view class="banner-container">
				<!-- Loading状态 -->
				<view v-if="bannerLoading" class="banner-loading">
					<view class="loading-spinner"></view>
					<text class="loading-text">正在加载...</text>
				</view>
				
				<!-- 错误状态 -->
				<view v-else-if="bannerError" class="banner-error">
					<view class="error-icon">⚠️</view>
					<text class="error-text">{{ bannerErrorMsg }}</text>
					<button class="retry-btn" @click="refreshBannerData">重新加载</button>
				</view>
				
				<!-- 正常Banner显示 -->
				<template v-else-if="bannerList.length > 0">
					<!-- 轮播图 -->
					<swiper 
						class="banner-swiper" 
						:indicator-dots="true" 
						:autoplay="true" 
						:interval="5000" 
						:duration="500"
						indicator-color="rgba(255, 255, 255, 0.5)"
						indicator-active-color="white"
						@change="onSwiperChange"
					>
						<swiper-item v-for="(banner, index) in bannerList" :key="index">
							<image :src="banner.image" class="banner-img" mode="aspectFill"></image>
						</swiper-item>
					</swiper>
					
					<!-- Banner内容 -->
					<view class="banner-content">
						<view class="banner-title">{{ bannerList[currentBannerIndex].title }}</view>
						<view class="banner-subtitle">{{ bannerList[currentBannerIndex].subtitle }}</view>
						<view class="explore-btn" @click="handleBannerClick(bannerList[currentBannerIndex])">{{ bannerList[currentBannerIndex].button_name }}</view>
					</view>
					
					<!-- 滚动提示 -->
					<view class="scroll-hint" @click="scrollToContent">
						<text class="fa fa-chevron-down"></text>
					</view>
				</template>
				
				<!-- 无数据状态 -->
				<view v-else class="banner-empty">
					<view class="empty-icon">📷</view>
					<text class="empty-text">暂无轮播图数据</text>
					<button class="retry-btn" @click="refreshBannerData">重新加载</button>
				</view>
			</view>

			<!-- 内容区域 -->
			<view class="content-area" id="content-area">
				<!-- 产品列表加载状态 -->
				<view v-if="productLoading" class="product-loading">
					<view class="loading-spinner"></view>
					<text class="loading-text">正在加载产品数据...</text>
				</view>
				
				<!-- 产品列表错误状态 -->
				<view v-else-if="productError" class="product-error">
					<view class="error-icon">⚠️</view>
					<text class="error-text">{{ productErrorMsg }}</text>
					<button class="retry-btn" @click="loadProductData">重新加载</button>
				</view>
				
				<!-- 产品列表 -->
				<template v-else-if="displayProductList.length > 0">
					<view v-for="(product, index) in displayProductList" :key="product.id || index" class="product-card" @click="goToProductDetail(product.id)">
						<image :src="product.image" class="product-img" mode="aspectFill"></image>
						<view class="product-info">
							<view class="product-title">{{ product.title }}</view>
							<view class="product-meta">
								<view>
									<text class="fa fa-star rating-star"></text>
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
					
					<!-- 加载更多提示 -->
					<view class="load-more" @click="loadMore">
						<text class="fa fa-spinner" :class="{'fa-spin': isLoading}" v-if="hasMoreProducts || isLoading"></text>
						<text class="fa fa-check-circle" v-if="!hasMoreProducts && !isLoading"></text>
						<text v-if="isLoading">加载中...</text>
						<text v-else-if="!hasMoreProducts">已加载全部数据</text>
						<text v-else>点击加载更多</text>
					</view>
				</template>
				
				<!-- 无数据状态 -->
				<view v-else class="product-empty">
					<view class="empty-icon">📦</view>
					<text class="empty-text">暂无产品数据</text>
					<button class="retry-btn" @click="loadProductData">重新加载</button>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 0,
			screenHeight: 0,
			isLoading: false,
			showFixedHeader: false, // 控制固定导航栏显示
			scrollTimer: null, // 滚动节流计时器
			// 添加scroll-view的scrollTop控制属性
			scrollViewScrollTop: 0,
			// 当前轮播图索引
			currentBannerIndex: 0,
			// 添加胶囊按钮位置信息
			capsuleInfo: {
				width: 87,
				height: 32,
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
			},
			// 胶囊按钮样式
			capsuleStyle: {},
			// Banner数据状态
			bannerLoading: true,
			bannerError: false,
			bannerErrorMsg: '',
			bannerList: [],
			// 产品列表相关状态
			productList: [],
			productLoading: false,
			productError: false,
			productErrorMsg: '',
			hasMoreProducts: true,
			currentPage: 1,
			pageSize: 10,
			// 分类和排序相关状态
			selectedCategory: 'all',
			sortType: 'default', // default, sales, price
			categoryList: [
				{ label: '全部', value: 'all' },
				{ label: '精品推荐', value: '精品推荐' },
				{ label: '国内游', value: '国内游' },
				{ label: '出境游', value: '出境游' },
				{ label: '周边游', value: '周边游' },
				{ label: '自由行', value: '自由行' },
				{ label: '跟团游', value: '跟团游' }
			]
		}
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
				首个产品: this.productList.length > 0 ? {
					id: this.productList[0].id,
					title: this.productList[0].title,
					price: this.productList[0].price
				} : null
			};
			console.log('📊 产品列表状态变化:', status);
			return status;
		},
		
		// 过滤和排序后的产品列表
		displayProductList() {
			let filteredList = [...this.productList];
			
			// 分类过滤
			if (this.selectedCategory !== 'all') {
				filteredList = filteredList.filter(product => 
					product.category === this.selectedCategory
				);
			}
			
			// 排序
			if (this.sortType === 'sales') {
				filteredList.sort((a, b) => b.soldCount - a.soldCount);
			} else if (this.sortType === 'price') {
				filteredList.sort((a, b) => {
					const priceA = typeof a.price === 'string' ? parseFloat(a.price.replace(/[^0-9.]/g, '')) : a.price;
					const priceB = typeof b.price === 'string' ? parseFloat(b.price.replace(/[^0-9.]/g, '')) : b.price;
					return priceA - priceB;
				});
			} else if (this.sortType === 'newest') {
				// 按创建时间倒序排列（新品在前）
				filteredList.sort((a, b) => {
					// 如果有创建时间字段，使用创建时间排序
					// 否则按照sort_order排序
					return b.sort_order - a.sort_order;
				});
			}
			
			return filteredList;
		}
	},
	// 页面卸载时清理资源
	onUnload() {
		if (this.scrollTimer) {
			clearTimeout(this.scrollTimer);
			this.scrollTimer = null;
		}
	},
	async onLoad() {
		console.log('=== 首页 onLoad 开始 ===');
		
		// 获取系统信息
		const systemInfo = uni.getSystemInfoSync();
		this.screenHeight = systemInfo.windowHeight;
		this.statusBarHeight = systemInfo.statusBarHeight || 0;
		console.log('📱 系统信息:', {
			screenHeight: this.screenHeight,
			statusBarHeight: this.statusBarHeight
		});
		
		// 加载banner数据
		this.loadBannerData();
		
		// 加载产品数据
		this.loadProductData();
		
		// 检查是否有进行中的行程
		await this.checkCurrentItinerary();
		
		console.log('=== 首页 onLoad 结束 ===');
	},
	onShow() {
		// 检查是否有搜索关键词
		const searchText = getApp().globalData.searchText;
		if (searchText) {
			console.log('🔍 检测到搜索关键词:', searchText);
			// 根据搜索关键词过滤产品列表
			this.filterProductsBySearch(searchText);
			// 清除搜索关键词，避免重复过滤
			getApp().globalData.searchText = '';
		}
	},
	methods: {
		// 滚动事件处理 - 优化性能
		onScroll(e) {
			const scrollTop = e.detail.scrollTop;
			// 使用节流优化滚动性能
			if (this.scrollTimer) {
				clearTimeout(this.scrollTimer);
			}
			this.scrollTimer = setTimeout(() => {
				// 当滚动超过banner高度时显示固定导航栏
				const shouldShow = scrollTop > this.screenHeight * 0.6;
				if (this.showFixedHeader !== shouldShow) {
					this.showFixedHeader = shouldShow;
				}
			}, 16); // 约60fps
		},
		
		// 分类选择 - 优化用户体验
		selectCategory(category) {
			console.log('🏷️ 选择分类:', category);
			this.selectedCategory = category;
			
			// 添加触觉反馈
			// #ifdef MP-WEIXIN
			uni.vibrateShort({
				type: 'light'
			});
			// #endif
			
			// 滚动到产品区域
			this.scrollToProductList();
		},
		
		// 排序类型切换 - 优化交互
		changeSortType(sortType) {
			console.log('🔄 切换排序:', sortType);
			
			// 添加触觉反馈
			// #ifdef MP-WEIXIN
			uni.vibrateShort({
				type: 'light'
			});
			// #endif
			
			if (this.sortType === sortType) {
				// 如果点击相同的排序，则切换为默认排序
				this.sortType = 'default';
				uni.showToast({
					title: '恢复默认排序',
					icon: 'none',
					duration: 1500
				});
			} else {
				this.sortType = sortType;
				const sortNames = {
					'sales': '按销量排序',
					'price': '按价格排序',
					'newest': '按新品排序'
				};
				uni.showToast({
					title: sortNames[sortType],
					icon: 'none',
					duration: 1500
				});
			}
		},
		
		// 滚动到产品列表区域
		scrollToProductList() {
			try {
				const query = uni.createSelectorQuery().in(this);
				query.select('#content-area').boundingClientRect();
				query.exec((res) => {
					if (res && res[0]) {
						const targetScrollTop = this.screenHeight - 50;
						this.scrollViewScrollTop = targetScrollTop;
					}
				});
			} catch (error) {
				console.error('滚动到产品列表失败:', error);
			}
		},
		
		// 优化搜索跳转体验
		goToSearch() {
			console.log('🔍 跳转到搜索页面');
			
			// 添加触觉反馈
			// #ifdef MP-WEIXIN
			uni.vibrateShort({
				type: 'light'
			});
			// #endif
			
			uni.navigateTo({
				url: '/pages/search/search',
				animationType: 'slide-in-right',
				animationDuration: 300
			});
		},
		
		// 获取胶囊按钮位置信息
		getCapsuleInfo() {
			// #ifdef MP-WEIXIN
			const capsule = uni.getMenuButtonBoundingClientRect();
			this.capsuleInfo = capsule;
			// #endif
			
			// #ifndef MP-WEIXIN
			// 非微信小程序环境，使用默认值
			const systemInfo = uni.getSystemInfoSync();
			this.capsuleInfo = {
				width: 87,
				height: 32,
				top: systemInfo.statusBarHeight + 6,
				right: systemInfo.windowWidth - 10,
				bottom: systemInfo.statusBarHeight + 38,
				left: systemInfo.windowWidth - 97
			};
			// #endif
			
			// 计算搜索按钮样式
			this.calculateSearchBtnStyle();
		},
		
		// 计算搜索按钮样式
		calculateSearchBtnStyle() {
			const capsule = this.capsuleInfo;
			
			// 搜索按钮高度与胶囊按钮相同
			const btnHeight = capsule.height;
			// 搜索按钮宽度也设置为相同高度，保持圆形
			const btnWidth = capsule.height;
			
			// 垂直居中对齐胶囊按钮
			const top = capsule.top;
			
			// 左侧距离屏幕边缘的距离，与胶囊按钮右侧距离保持一致
			const screenWidth = uni.getSystemInfoSync().windowWidth;
			const capsuleRightMargin = screenWidth - capsule.right;
			const left = capsuleRightMargin;
			
			this.searchBtnStyle = {
				position: 'fixed',
				top: top + 'px',
				left: left + 'px',
				width: btnWidth + 'px',
				height: btnHeight + 'px',
				borderRadius: (btnHeight / 2) + 'px',
				backgroundColor: 'rgba(255, 255, 255, 0.8)',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				color: '#333',
				boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
				backdropFilter: 'blur(5px)',
				webkitBackdropFilter: 'blur(5px)',
				zIndex: '20'
			};
			
			// 计算胶囊按钮样式（用于非微信小程序环境的模拟显示）
			this.capsuleStyle = {
				position: 'fixed',
				top: top + 'px',
				right: capsuleRightMargin + 'px',
				width: capsule.width + 'px',
				height: capsule.height + 'px',
				zIndex: '20'
			};
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
				console.error('[首页] 检查行程失败:', error);
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
		loadMore() {
			console.log('=== loadMore 开始 ===');
			
			if (this.isLoading || !this.hasMoreProducts) {
				console.log('⚠️ 正在加载中或没有更多数据');
				return;
			}
			
			this.loadMoreProducts();
		},
		
		// 加载更多产品数据
		async loadMoreProducts() {
			console.log('=== loadMoreProducts 开始 ===');
			console.log('📊 当前分页状态:', {
				currentPage: this.currentPage,
				pageSize: this.pageSize,
				hasMoreProducts: this.hasMoreProducts,
				isLoading: this.isLoading,
				currentListLength: this.productList.length
			});
			
			try {
				this.isLoading = true;
				console.log('🚀 开始加载更多产品数据，页码:', this.currentPage + 1);
				
				// 获取数据库引用
				const db = uniCloud.databaseForJQL();
				console.log('✅ 数据库引用获取成功');
				
				// 查询下一页产品数据
				const skipCount = this.currentPage * this.pageSize;
				console.log('📝 查询参数:', {
					where: 'status == 1',
					orderBy: 'sort_order desc, created_at desc',
					field: '_id, product_id, title, subtitle, price, child_price, rating, product_images, sales_count, review_count, view_count, sort_order, category',
					skip: skipCount,
					limit: this.pageSize
				});
				
				const result = await db.collection('a-products')
					.where('status == 1') // 只查询状态为启用的产品
					.orderBy('sort_order desc, created_at desc') // 按排序字段和创建时间排序
					.field('_id, product_id, title, subtitle, price, child_price, rating, product_images, sales_count, review_count, view_count, sort_order, category') // 查询真实存在的字段，包含分类
					.skip(skipCount) // 跳过已加载的数据
					.limit(this.pageSize) // 限制查询数量
					.get();
				
				console.log('✅ 加载更多数据查询成功:', result);
				console.log('📊 查询结果详细信息:', {
					success: result.success,
					code: result.code,
					errCode: result.errCode,
					message: result.message,
					errMsg: result.errMsg,
					dataLength: result.data ? result.data.length : 0,
					affectedDocs: result.affectedDocs
				});
				
				if (result.data && result.data.length > 0) {
					console.log('📋 新增数据列表:');
					result.data.forEach((item, index) => {
						console.log(`  新产品${index + 1}:`, {
							_id: item._id,
							product_id: item.product_id,
							title: item.title,
							subtitle: item.subtitle,
							price: item.price,
							child_price: item.child_price,
							rating: item.rating,
							product_images: item.product_images,
							sales_count: item.sales_count,
							review_count: item.review_count,
							view_count: item.view_count,
							sort_order: item.sort_order
						});
					});
					
					// 数据预处理 - 根据Schema字段进行处理
					const processedData = result.data.map((item, index) => {
						console.log(`🔍 处理第${index + 1}条数据:`, item);
						
						// 检查各字段是否存在
						const fieldCheck = {
							_id: !!item._id,
							product_id: !!item.product_id,
							title: !!item.title,
							subtitle: !!item.subtitle,
							price: item.price !== undefined && item.price !== null,
							child_price: item.child_price !== undefined && item.child_price !== null,
							rating: item.rating !== undefined && item.rating !== null,
							product_images: !!item.product_images && Array.isArray(item.product_images),
							sales_count: item.sales_count !== undefined && item.sales_count !== null,
							review_count: item.review_count !== undefined && item.review_count !== null,
							view_count: item.view_count !== undefined && item.view_count !== null,
							sort_order: item.sort_order !== undefined && item.sort_order !== null
						};
						
						console.log(`📊 字段存在性检查:`, fieldCheck);
						
						// 生成智能标签
						let tag = '热门推荐';
						if (item.sales_count > 100) {
							tag = '爆款热销';
						} else if (item.sales_count > 50) {
							tag = '人气精选';
						} else if (item.rating >= 4.8) {
							tag = '高分好评';
						} else if (item.view_count > 1000) {
							tag = '热门关注';
						}
						
						console.log(`🏷️ 生成标签: ${tag} (基于销量:${item.sales_count}, 评分:${item.rating}, 浏览:${item.view_count})`);
						
						// 处理产品数据
						const processedItem = {
							id: item._id, // 使用_id作为唯一标识
							product_id: item.product_id || '',
							title: item.title || '未知商品',
							subtitle: item.subtitle || '',
							rating: Number(item.rating) || 5.0,
							soldCount: Number(item.sales_count) || 0, // 保持原字段名用于模板
							reviewCount: Number(item.review_count) || 0,
							viewCount: Number(item.view_count) || 0,
							price: this.formatPrice(item.price),
							child_price: this.formatPrice(item.child_price),
							image: (item.product_images && item.product_images.length > 0) 
								? item.product_images[0] 
								: 'https://images.unsplash.com/photo-1635582681213-450e9b127343?w=400',
							tag: tag,
							sort_order: Number(item.sort_order) || 0,
							category: item.category || '国内游' // 添加分类字段
						};
						
						console.log(`✅ 处理后的数据:`, processedItem);
						return processedItem;
					});
					
					// 将新数据追加到现有列表
					const originalLength = this.productList.length;
					this.productList = this.productList.concat(processedData);
					this.currentPage++;
					
					console.log('✅ 数据追加成功:', {
						原始数据量: originalLength,
						新增数据量: processedData.length,
						当前总数据量: this.productList.length,
						当前页码: this.currentPage
					});
					
					// 如果返回的数据少于pageSize，说明没有更多数据了
					if (result.data.length < this.pageSize) {
						this.hasMoreProducts = false;
						console.log('📄 已加载全部数据，设置hasMoreProducts为false');
					}
					
					uni.showToast({
						title: `加载了${result.data.length}条新数据`,
						icon: 'success',
						duration: 1500
					});
				} else {
					// 没有更多数据
					this.hasMoreProducts = false;
					console.log('📄 没有更多数据了，设置hasMoreProducts为false');
					console.log('📊 查询结果为空:', {
						hasData: !!result.data,
						dataLength: result.data ? result.data.length : 0,
						result: result
					});
					
					uni.showToast({
						title: '已加载全部数据',
						icon: 'none',
						duration: 1500
					});
				}
				
			} catch (error) {
				console.error('❌ 加载更多数据失败:', error);
				console.log('🔍 错误详情:', {
					name: error.name,
					message: error.message,
					code: error.code,
					stack: error.stack,
					cause: error.cause
				});
				
				// 错误时不使用模拟数据，直接显示错误信息
				this.hasMoreProducts = false;
				
				uni.showToast({
					title: '加载更多数据失败',
					icon: 'none',
					duration: 2000
				});
				
			} finally {
				this.isLoading = false;
				console.log('🏁 loadMoreProducts 完成，最终状态:', {
					isLoading: this.isLoading,
					productListLength: this.productList.length,
					hasMoreProducts: this.hasMoreProducts,
					currentPage: this.currentPage
				});
				console.log('=== loadMoreProducts 结束 ===');
			}
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
				const result = await db.collection('a-banners')
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
			console.log('📊 当前产品列表状态:', {
				productList: this.productList,
				productLoading: this.productLoading,
				productError: this.productError,
				hasMoreProducts: this.hasMoreProducts,
				currentPage: this.currentPage,
				pageSize: this.pageSize
			});
			
			try {
				this.productLoading = true;
				this.productError = false;
				this.productErrorMsg = '';
				console.log('🔄 设置加载状态为true, 清除错误状态');
				
				console.log('🚀 开始查询uniCloud数据库 a-products表...');
				
				// 获取数据库引用
				const db = uniCloud.databaseForJQL();
				console.log('✅ 数据库引用获取成功');
				
				// 查询第一页产品数据 - 根据Schema更新字段
				console.log('📝 查询条件:', {
					where: 'status == 1',
					orderBy: 'sort_order desc, created_at desc',
					field: '_id, product_id, title, subtitle, price, child_price, rating, product_images, sales_count, review_count, view_count, sort_order, category',
					limit: this.pageSize
				});
				
				const result = await db.collection('a-products')
					.where('status == 1') // 只查询状态为启用的产品
					.orderBy('sort_order desc, created_at desc') // 按排序字段和创建时间排序
					.field('_id, product_id, title, subtitle, price, child_price, rating, product_images, sales_count, review_count, view_count, sort_order, category') // 查询真实存在的字段，包含分类
					.limit(this.pageSize) // 限制查询数量
					.get();
				
				console.log('✅ 数据库查询成功:', result);
				console.log('📊 查询结果详细信息:', {
					success: result.success,
					code: result.code,
					errCode: result.errCode,
					message: result.message,
					errMsg: result.errMsg,
					dataLength: result.data ? result.data.length : 0,
					affectedDocs: result.affectedDocs
				});
				
				if (result.data && result.data.length > 0) {
					console.log('📋 原始数据列表:');
					result.data.forEach((item, index) => {
						console.log(`  产品${index + 1}:`, {
							_id: item._id,
							product_id: item.product_id,
							title: item.title,
							subtitle: item.subtitle,
							price: item.price,
							child_price: item.child_price,
							rating: item.rating,
							product_images: item.product_images,
							sales_count: item.sales_count,
							review_count: item.review_count,
							view_count: item.view_count,
							sort_order: item.sort_order
						});
					});
					
					// 数据预处理 - 根据Schema字段进行处理
					const processedData = result.data.map((item, index) => {
						console.log(`🔍 处理第${index + 1}条数据:`, item);
						
						// 检查各字段是否存在
						const fieldCheck = {
							_id: !!item._id,
							product_id: !!item.product_id,
							title: !!item.title,
							subtitle: !!item.subtitle,
							price: item.price !== undefined && item.price !== null,
							child_price: item.child_price !== undefined && item.child_price !== null,
							rating: item.rating !== undefined && item.rating !== null,
							product_images: !!item.product_images && Array.isArray(item.product_images),
							sales_count: item.sales_count !== undefined && item.sales_count !== null,
							review_count: item.review_count !== undefined && item.review_count !== null,
							view_count: item.view_count !== undefined && item.view_count !== null,
							sort_order: item.sort_order !== undefined && item.sort_order !== null
						};
						
						console.log(`📊 字段存在性检查:`, fieldCheck);
						
						// 生成智能标签
						let tag = '热门推荐';
						if (item.sales_count > 100) {
							tag = '爆款热销';
						} else if (item.sales_count > 50) {
							tag = '人气精选';
						} else if (item.rating >= 4.8) {
							tag = '高分好评';
						} else if (item.view_count > 1000) {
							tag = '热门关注';
						}
						
						console.log(`🏷️ 生成标签: ${tag} (基于销量:${item.sales_count}, 评分:${item.rating}, 浏览:${item.view_count})`);
						
						// 处理产品数据
						const processedItem = {
							id: item._id, // 使用_id作为唯一标识
							product_id: item.product_id || '',
							title: item.title || '未知商品',
							subtitle: item.subtitle || '',
							rating: Number(item.rating) || 5.0,
							soldCount: Number(item.sales_count) || 0, // 保持原字段名用于模板
							reviewCount: Number(item.review_count) || 0,
							viewCount: Number(item.view_count) || 0,
							price: this.formatPrice(item.price),
							child_price: this.formatPrice(item.child_price),
							image: (item.product_images && item.product_images.length > 0) 
								? item.product_images[0] 
								: 'https://images.unsplash.com/photo-1635582681213-450e9b127343?w=400',
							tag: tag,
							sort_order: Number(item.sort_order) || 0,
							category: item.category || '国内游' // 添加分类字段
						};
						
						console.log(`✅ 处理后的数据:`, processedItem);
						return processedItem;
					});
					
					this.productList = processedData;
					console.log('✅ 产品数据设置成功，共', this.productList.length, '条');
					console.log('📋 最终产品列表:', this.productList);
					
					// 设置分页状态
					this.currentPage = 1;
					// 如果返回的数据等于pageSize，说明可能还有更多数据
					this.hasMoreProducts = result.data.length === this.pageSize;
					console.log('📄 分页状态设置完成:', {
						currentPage: this.currentPage,
						hasMoreProducts: this.hasMoreProducts,
						返回数据量: result.data.length,
						页面大小: this.pageSize
					});
				} else {
					console.log('⚠️ 数据库中没有启用的产品数据');
					console.log('📊 查询结果为空:', {
						hasData: !!result.data,
						dataLength: result.data ? result.data.length : 0,
						result: result
					});
					
					// 数据为空时不设置默认数据，保持空列表
					this.productList = [];
					this.hasMoreProducts = false;
					this.currentPage = 1;
				}
				
			} catch (error) {
				console.error('❌ 加载产品数据失败:', error);
				console.log('🔍 错误详情:', {
					name: error.name,
					message: error.message,
					code: error.code,
					stack: error.stack,
					cause: error.cause
				});
				
				this.productError = true;
				this.productErrorMsg = error.message || '网络错误，请稍后重试';
				console.log('❌ 设置错误状态:', {
					productError: this.productError,
					productErrorMsg: this.productErrorMsg
				});
				
				// 错误时不使用模拟数据，保持错误状态供调试
				this.productList = [];
				this.hasMoreProducts = false;
				this.currentPage = 1;
				
				// 显示错误提示
				uni.showToast({
					title: '数据库连接失败',
					icon: 'none',
					duration: 3000
				});
				
			} finally {
				this.productLoading = false;
				console.log('🏁 loadProductData 完成，最终状态:', {
					productLoading: this.productLoading,
					productError: this.productError,
					productListLength: this.productList.length,
					hasMoreProducts: this.hasMoreProducts,
					currentPage: this.currentPage
				});
				console.log('=== loadProductData 结束 ===');
			}
		},
		// 根据搜索关键词过滤产品列表
		filterProductsBySearch(searchText) {
			console.log('=== filterProductsBySearch 开始 ===');
			console.log('🔍 搜索关键词:', searchText);
			console.log('📊 当前产品列表长度:', this.productList.length);
			
			if (!searchText || searchText.trim() === '') {
				console.log('⚠️ 搜索关键词为空，不进行过滤');
				return;
			}
			
			const keyword = searchText.trim().toLowerCase();
			console.log('🔍 处理后的搜索关键词:', keyword);
			
			// 过滤产品列表
			const filteredList = this.productList.filter(product => {
				const titleMatch = product.title && product.title.toLowerCase().includes(keyword);
				const subtitleMatch = product.subtitle && product.subtitle.toLowerCase().includes(keyword);
				console.log(`🔍 产品"${product.title}"匹配结果:`, {
					标题匹配: titleMatch,
					副标题匹配: subtitleMatch,
					最终匹配: titleMatch || subtitleMatch
				});
				return titleMatch || subtitleMatch;
			});
			
			console.log('✅ 过滤结果:', {
				原始数量: this.productList.length,
				过滤后数量: filteredList.length,
				过滤关键词: keyword
			});
			
			this.productList = filteredList;
			
			if (filteredList.length === 0) {
				console.log('⚠️ 没有找到匹配的产品');
				uni.showToast({
					title: '未找到相关产品',
					icon: 'none',
					duration: 2000
				});
			}
			
			console.log('=== filterProductsBySearch 结束 ===');
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
}
</script>

<style>
/* 首页样式 */
/* 固定头部导航样式 */
.fixed-header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	transition: all 0.3s ease;
}

/* 状态栏安全区域 */
.status-bar-safe-area {
	width: 100%;
	background-color: transparent;
	transition: background-color 0.3s ease;
}

.header-fixed .status-bar-safe-area {
	background-color: rgba(255, 255, 255, 0.95);
}

/* 支持刘海屏等特殊屏幕 */
.fixed-header {
	/* iOS安全区域适配 */
	padding-top: constant(safe-area-inset-top);
	padding-top: env(safe-area-inset-top);
}

.header-fixed {
	background-color: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* 固定导航栏 */
.sticky-nav {
	opacity: 0;
	transform: translateY(-100%);
	transition: all 0.3s ease;
	pointer-events: none;
}

.nav-visible {
	opacity: 1;
	transform: translateY(0);
	pointer-events: auto;
}

.nav-content {
	padding: 8px 16px;
}

/* 导航搜索栏 - 匹配设计图的白色搜索框 */
.nav-search-bar {
	background-color: #ffffff;
	border-radius: 20px;
	padding: 10px 16px;
	display: flex;
	align-items: center;
	margin-bottom: 8px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	border: 1px solid #e0e0e0;
}

.nav-search-icon {
	color: #ff6b35;
	margin-right: 8px;
	font-size: 16px;
}

.nav-search-placeholder {
	color: #999;
	font-size: 14px;
	flex: 1;
}

/* 分类栏样式 - 匹配设计图的黄色标签 */
.category-bar {
	background-color: white;
	padding: 8px 0;
}

.category-scroll {
	white-space: nowrap;
}

.category-list {
	display: inline-flex;
	padding: 0 16px;
}

.category-item {
	flex-shrink: 0;
	padding: 8px 16px;
	margin-right: 12px;
	border-radius: 20px;
	font-size: 14px;
	background-color: #fff8f0;
	color: #ff6b35;
	white-space: nowrap;
	transition: all 0.2s ease;
	border: 1px solid #ffe4d6;
	font-weight: 500;
}

.category-active {
	background-color: #ff6b35;
	color: white;
	border-color: #ff6b35;
	box-shadow: 0 2px 6px rgba(255, 107, 53, 0.3);
}

/* 排序栏样式 - 三个tab等分布局 */
.sort-bar {
	background-color: white;
	padding: 0;
	border-top: 1px solid #f0f0f0;
}

.sort-tabs {
	display: flex;
	width: 100%;
}

.sort-tab {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 12px 0;
	font-size: 14px;
	color: #666;
	position: relative;
	transition: all 0.2s ease;
	font-weight: 500;
	border-right: 1px solid #f0f0f0;
}

.sort-tab:last-child {
	border-right: none;
}

.sort-tab.sort-active {
	color: #e53e3e;
	background-color: #fef2f2;
}

.sort-arrow {
	margin-left: 4px;
	font-size: 10px;
	transition: transform 0.2s ease;
}

/* Banner和产品卡片的颜色优化 */
.hero-section {
	background: linear-gradient(135deg, #0086F6 0%, #0066CC 100%);
	color: white;
	padding: 20px;
	border-radius: 0 0 20px 20px;
}

/* 主滚动区域 */
.main-scroll-area {
	width: 100%;
}

/* 小程序胶囊样式 */
.mp-capsule {
	width: 87px;
	height: 32px;
	background-color: rgba(0, 0, 0, 0.2);
	border-radius: 16px;
	border: 1px solid rgba(255, 255, 255, 0.25);
	display: flex;
	align-items: center;
	justify-content: space-around;
	padding: 0 5px;
	backdrop-filter: blur(5px);
	-webkit-backdrop-filter: blur(5px);
}

.mp-capsule-divider {
	width: 1px;
	height: 18px;
	background-color: rgba(255, 255, 255, 0.25);
}

.capsule-icon {
	color: white;
	font-size: 12px;
}

/* Banner容器 */
.banner-container {
	position: relative;
	height: 100vh;
	overflow: hidden;
}

/* 轮播图 */
.banner-swiper {
	width: 100%;
	height: 100%;
	/* 确保轮播图本身不响应点击 */
}

/* 确保轮播项不响应点击 */
.banner-swiper swiper-item {
	pointer-events: none;
}

/* 确保图片区域没有点击效果 */
.banner-img {
	width: 100%;
	height: 100%;
	pointer-events: none; /* 禁用图片的点击事件 */
}

/* Banner内容 */
.banner-content {
	position: absolute;
	bottom: 15%;
	left: 0;
	right: 0;
	transform: translateY(-60%);
	padding: 0 20px;
	color: white;
	z-index: 3;
	text-align: center;
	/* 允许内容区域的事件传递，但不阻止按钮点击 */
	pointer-events: auto;
}

.banner-title {
	font-family: 'Playfair Display', serif;
	font-size: 36px;
	font-weight: 600;
	margin-bottom: 16px;
	text-shadow: 2px 2px 8px rgba(0,0,0,0.8), 0 0 16px rgba(0,0,0,0.6);
	letter-spacing: 0.5px;
	line-height: 1.2;
	/* 标题不响应点击 */
	pointer-events: none;
}

.banner-subtitle {
	font-size: 18px;
	font-weight: 300;
	opacity: 0.95;
	margin-bottom: 30px;
	text-shadow: 1px 1px 6px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.6);
	letter-spacing: 1px;
	/* 副标题不响应点击 */
	pointer-events: none;
}

.explore-btn {
	background-color: rgba(0, 0, 0, 0.3);
	color: white;
	padding: 12px 32px;
	border-radius: 30px;
	font-weight: 500;
	display: inline-block;
	border: 2px solid white;
	letter-spacing: 1px;
	transition: all 0.2s ease;
	cursor: pointer;
	position: relative;
	z-index: 10;
	backdrop-filter: blur(5px);
	-webkit-backdrop-filter: blur(5px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.explore-btn:active {
	transform: translateY(2px);
	background-color: rgba(255, 255, 255, 0.2);
	border-color: rgba(255, 255, 255, 0.8);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.explore-btn:hover {
	background-color: rgba(255, 255, 255, 0.1);
	transform: scale(1.05);
}

/* 滚动提示 */
.scroll-hint {
	position: absolute;
	bottom: 10%;
	left: 50%;
	transform: translateX(-50%);
	color: white;
	font-size: 20px;
	opacity: 0.9;
	z-index: 5;
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 50%;
	background-color: rgba(0, 0, 0, 0.2);
	backdrop-filter: blur(2px);
	-webkit-backdrop-filter: blur(2px);
	animation: bounce 2s infinite;
}

@keyframes bounce {
	0%, 20%, 50%, 80%, 100% {
		transform: translateY(0) translateX(-50%);
	}
	40% {
		transform: translateY(-8px) translateX(-50%);
	}
	60% {
		transform: translateY(-4px) translateX(-50%);
	}
}

/* 内容区域 */
.content-area {
	padding: 32px 16px;
	background-color: white;
	position: relative;
	z-index: 5;
	margin-top: -80px;
	border-top-left-radius: 24px;
	border-top-right-radius: 24px;
	box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
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

.rating-star {
	color: #ffb400;
	margin-right: 4px;
}

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
	background-color: #fff2e8;
	color: #ff6b35;
	padding: 4px 8px;
	border-radius: 12px;
	font-size: 11px;
	font-weight: 600;
	border: 1px solid #ffe4d6;
}

/* 微动画效果 */
.category-item:active {
	transform: scale(0.95);
}

.sort-tab:active {
	transform: scale(0.95);
	background-color: #f5f5f5;
}

.nav-search-bar:active {
	transform: scale(0.98);
}

/* 加载状态优化 */
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

/* 优化滚动条样式 */
.category-scroll::-webkit-scrollbar {
	display: none;
}

.category-scroll {
	scrollbar-width: none;
}

/* 加载更多样式 */
.load-more {
	text-align: center;
	color: #666666;
	font-size: 14px;
	padding: 20px 0;
	opacity: 0.8;
	transition: all 0.2s ease;
}

.load-more:active {
	opacity: 0.6;
	transform: scale(0.98);
}

.load-more text:first-child {
	margin-right: 6px;
}

.fa-spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

/* Banner相关样式 */
.banner-loading,
.banner-error,
.banner-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	text-align: center;
	padding: 40px 20px;
}

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
.product-loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	text-align: center;
	padding: 40px 20px;
}

/* 产品列表错误状态 */
.product-error {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	text-align: center;
	padding: 40px 20px;
}

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

.error-icon {
	font-size: 60px;
	margin-bottom: 20px;
}

.error-text {
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

/* 无数据状态 */
.product-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	text-align: center;
	padding: 40px 20px;
}

.empty-icon {
	font-size: 60px;
	margin-bottom: 20px;
}

.empty-text {
	font-size: 16px;
	margin-bottom: 30px;
	opacity: 0.9;
	line-height: 1.4;
}
</style>
