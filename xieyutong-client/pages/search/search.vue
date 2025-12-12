<template>
	<view class="min-h-screen bg-gray-50 search-page-container">
		<view class="status-bar-placeholder" :style="{ height: statusBarHeight + 100 + 'rpx' }">
			<view class="back-button" @click="goBack">
				<uni-icons type="left" size="22" color="#333"></uni-icons>
			</view>
		</view>

		<view class="search-input-container">
			<view class="search-input-wrapper">
				<!-- <text class="fa fa-search search-icon"></text> -->
				<image src="/static/icons/search.svg" class="w-5 h-5 mr-3" mode="aspectFit" />
				<input class="search-input" type="text" placeholder="搜索目的地、产品" v-model="searchText" confirm-type="search" @input="onSearchInput" @confirm="onSearchConfirm" />
				<uni-icons v-if="searchText" class="search-clear-icon" type="clear" size="20" color="#999" @click="clearSearch" />
			</view>
		</view>

		<view class="category-bar">
			<scroll-view scroll-x="true" class="category-scroll">
				<view class="category-list">
					<view
						v-for="(category, index) in categoryList"
						:key="index"
						class="category-item"
						:class="{ 'category-active': selectedCategory === category.value }"
						@click="selectCategory(category.value)">
						{{ category.label }}
					</view>
				</view>
			</scroll-view>
		</view>

		<view class="sort-bar">
			<view class="sort-tabs">
				<view class="sort-tab" :class="{ 'sort-active': sortType === 'sales' }" @click="changeSortType('sales')">
					<text>销量</text>
					<!-- <text v-if="sortType === 'sales'" class="fa fa-arrow-down sort-arrow"></text> -->
					<image v-if="sortType === 'sales'" src="/static/icons/arrow-down.svg" class="w-4 h-4 ml-1" mode="aspectFit" />
				</view>
				<view class="sort-tab" :class="{ 'sort-active': sortType === 'price' }" @click="changeSortType('price')">
					<text>价格</text>
					<!-- <text v-if="sortType === 'price'" class="fa fa-arrow-down sort-arrow"></text> -->
					<image v-if="sortType === 'price'" src="/static/icons/arrow-down.svg" class="w-4 h-4 ml-1" mode="aspectFit" />
				</view>
				<view class="sort-tab" :class="{ 'sort-active': sortType === 'newest' }" @click="changeSortType('newest')">
					<text>新品</text>
					<!-- <text v-if="sortType === 'newest'" class="fa fa-arrow-down sort-arrow"></text> -->
					<image v-if="sortType === 'newest'" src="/static/icons/arrow-down.svg" class="w-4 h-4 ml-1" mode="aspectFit" />
				</view>
			</view>
		</view>

		<scroll-view scroll-y class="product-scroll-area" :style="{ height: screenHeight + 'px', paddingTop: headerHeight + 'px' }">
			<view class="content-area" id="content-area">
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
						<image :src="getOptimizedImage(product.image, 400, 400)" class="product-img" mode="aspectFill"></image>
						<view class="product-info">
							<view class="product-title">{{ product.title }}</view>
							<view class="product-meta">
								<view class="product-rating">
									<!-- <text class="fa fa-star rating-star"></text> -->
									<image src="/static/icons/star.svg" class="w-4 h-4 mr-1" mode="aspectFit" />
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

				<view v-else class="product-empty">
					<view class="empty-icon">📦</view>
					<text class="empty-text">
						{{ searchText ? '未找到相关产品' : '暂无产品数据' }}
					</text>
					<button v-if="searchText" class="retry-btn" @click="clearSearch">清除搜索</button>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
// 这是 search.vue
export default {
	data() {
		return {
			statusBarHeight: 0,
			screenHeight: 0,
			headerHeight: 0, // 头部总高度

			searchText: '', // 搜索关键词

			productList: [],
			productLoading: false,
			productError: false,
			productErrorMsg: '',

			// 从 home.vue 迁移过来的数据
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
		};
	},
	computed: {
		// 包含搜索、分类、排序的完整列表
		displayProductList() {
			let filteredList = [...this.productList];
			const keyword = this.searchText.trim().toLowerCase();

			// 1. 搜索过滤
			if (keyword) {
				filteredList = filteredList.filter(
					(product) => (product.title && product.title.toLowerCase().includes(keyword)) || (product.subtitle && product.subtitle.toLowerCase().includes(keyword))
				);
			}

			// 2. 分类过滤
			if (this.selectedCategory !== 'all') {
				filteredList = filteredList.filter((product) => product.category === this.selectedCategory);
			}

			// 3. 排序
			if (this.sortType === 'sales') {
				filteredList.sort((a, b) => b.soldCount - a.soldCount);
			} else if (this.sortType === 'price') {
				filteredList.sort((a, b) => {
					const priceA = typeof a.price === 'string' ? parseFloat(a.price.replace(/[^0-9.]/g, '')) : a.price;
					const priceB = typeof b.price === 'string' ? parseFloat(b.price.replace(/[^0-9.]/g, '')) : b.price;
					return priceA - priceB;
				});
			} else if (this.sortType === 'newest') {
				filteredList.sort((a, b) => b.sort_order - a.sort_order);
			} else {
				filteredList.sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0));
			}

			return filteredList;
		}
	},
	onLoad() {
		// 获取系统信息
		const systemInfo = uni.getSystemInfoSync();
		this.screenHeight = systemInfo.windowHeight;
		this.statusBarHeight = systemInfo.statusBarHeight || 0;

		// 加载所有产品数据
		this.loadProductData();
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},
		onSearchInput(e) {
			// 实时搜索
		},
		onSearchConfirm(e) {
			console.log('搜索:', this.searchText);
		},
		clearSearch() {
			this.searchText = '';
		},

		// --- 从 home.vue 迁移的方法 ---

		selectCategory(category) {
			console.log('🏷️ 选择分类:', category);
			this.selectedCategory = category;
		},

		changeSortType(sortType) {
			console.log('🔄 切换排序:', sortType);

			if (this.sortType === sortType) {
				this.sortType = 'default';
			} else {
				this.sortType = sortType;
			}
		},

		goToProductDetail(productId) {
			if (!productId) {
				console.error('❌ 产品ID为空，无法跳转');
				return;
			}
			const url = `/pages/product-detail/product-detail?id=${productId}`;
			uni.navigateTo({
				url: url
			});
		},

		// 加载产品数据
		async loadProductData() {
			console.log('=== [SearchPage] loadProductData 开始 ===');
			this.productLoading = true;
			this.productError = false;
			this.productErrorMsg = '';
			this.productList = [];

			try {
				const db = uniCloud.databaseForJQL();
				const routesRes = await db.collection('a-routes').field({ A_route_id: true }).get();

				if (!routesRes.data || routesRes.data.length === 0) {
					console.warn('[加载产品] a-routes 中没有数据。');
					this.productLoading = false;
					return;
				}

				const productIdsToFetch = routesRes.data.map((item) => item.A_route_id).filter((id) => id);
				if (productIdsToFetch.length === 0) {
					console.warn('[加载产品] 没有有效的 A_route_id 可供查询。');
					this.productLoading = false;
					return;
				}

				const result = await db
					.collection('a-products')
					.where({
						ctrip_id: db.command.in(productIdsToFetch),
						status: 1
					})
					.field('_id, product_id, title, subtitle, price, child_price, rating, product_images, sales_count, review_count, view_count, sort_order, category, route_title')
					.get();

				if (result.data && result.data.length > 0) {
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
				}
			} catch (error) {
				console.error('[加载产品] 加载产品数据失败:', error);
				this.productError = true;
				this.productErrorMsg = error.message || '加载数据失败';
			} finally {
				this.productLoading = false;
				console.log('=== [SearchPage] loadProductData 结束 ===');
			}
		},

		generateTag(item) {
			let tag = '热门推荐';
			if (item.sales_count > 100) tag = '爆款热销';
			else if (item.sales_count > 50) tag = '人气精选';
			else if (item.rating >= 4.8) tag = '高分好评';
			else if (item.view_count > 1000) tag = '热门关注';
			return tag;
		},

		formatPrice(price) {
			if (price === null || price === undefined || price === '') {
				return '价格待定';
			}
			let numPrice;
			if (typeof price === 'string') {
				const cleanPrice = price.replace(/[^0-9.]/g, '');
				numPrice = parseFloat(cleanPrice);
			} else if (typeof price === 'number') {
				numPrice = price;
			} else {
				return '价格待定';
			}
			if (isNaN(numPrice) || numPrice < 0) {
				return '价格待定';
			}
			return numPrice.toLocaleString('zh-CN');
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
/* 搜索页面样式 */
.status-bar-placeholder {
	width: 100%;
}

.back-button {
	position: absolute;
	left: 24rpx;
	top: calc(var(--status-bar-height) + 50rpx);
	width: 70rpx;
	height: 70rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 99;
	background-color: rgba(255, 255, 255, 0.7);
	border-radius: 50%;
}

.search-page-container {
	background-color: #f9f9f9;
}

/* 搜索框样式 */
.search-input-container {
	margin-top: 15px;
	display: flex;
	align-items: center;
	padding: 8px 16px;
	height: 44px;
}
.search-input-wrapper {
	flex: 1;
	display: flex;
	align-items: center;
	background-color: #f5f5f5;
	border-radius: 20px;
	padding: 0 16px;
}
.search-icon {
	color: #999;
	margin-right: 10px;
	font-size: 16px;
}
.search-input {
	flex: 1;
	height: 40px;
	line-height: 40px;
	font-size: 14px;
	color: #333;
}
.search-clear-icon {
	margin-left: 10px;
}

/* 2. 可滚动的产品列表区域 */
.product-scroll-area {
	width: 100%;
}

/* 3. 内容区域 */
.content-area {
	padding: 16px 12px;
	background-color: #f9f9f9;
}

/* --- 迁移过来的样式 --- */

/* 分类栏样式 (与 home.vue 相同) */
.category-bar {
	background-color: white;
	padding: 8px 0;
	border-top: 1px solid #f5f5f5;
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
	background-color: #fff8f3;
	color: #ff6b35;
	white-space: nowrap;
	transition: all 0.2s ease;
	border: 1px solid #fceae1;
	font-weight: 500;
}
.category-active {
	background-color: #ff6b35;
	color: white;
	border-color: #ff6b35;
	box-shadow: 0 2px 6px rgba(255, 107, 53, 0.3);
}

/* 排序栏样式 (与 home.vue 相同) */
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
}
.category-item:active {
	transform: scale(0.95);
}
.sort-tab:active {
	transform: scale(0.95);
	background-color: #f5f5f5;
}

/* 产品卡片样式 (与 home.vue 相同) */
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
.product-rating {
	display: flex;
	align-items: center;
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
	background-color: #fff8f3;
	color: #ff6b35;
	padding: 4px 8px;
	border-radius: 12px;
	font-size: 11px;
	font-weight: 600;
	border: 1px solid #fceae1;
}

/* 加载、错误、空状态样式 (与 home.vue 相同) */
.product-loading,
.product-error,
.product-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 300px;
	background-color: #f9f9f9;
	color: #666;
	text-align: center;
	padding: 40px 20px;
}
.product-loading .loading-spinner {
	width: 50px;
	height: 50px;
	border: 4px solid rgba(0, 0, 0, 0.1);
	border-top: 4px solid #ff6b35;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin-bottom: 20px;
}
.product-loading .loading-text,
.product-error .error-text,
.product-empty .empty-text {
	color: #666;
	margin-bottom: 20px;
}
.product-error .retry-btn,
.product-empty .retry-btn {
	background-color: #ff6b35;
	color: white;
	border: none;
	border-radius: 25px;
	padding: 12px 24px;
	font-size: 16px;
	font-weight: 500;
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}
</style>
