<template>
	<view class="page-container">
		<view class="fixed-header-group">
			<view class="custom-nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
				<view class="nav-left" @click="goBack">
					<view class="back-btn-wrapper">
						<image src="/static/icons/chevron-left.svg" class="back-icon" mode="aspectFit" />
					</view>
				</view>
				<view class="nav-center">
					<text class="page-title">精品小团</text>
				</view>
				<view class="nav-right"></view>
			</view>

			<view class="filter-bar">
				<view class="filter-item" :class="{ active: currentFilterType === 'sort' }" @click="toggleFilter('sort')">
					<text>{{ currentSortLabel }}</text>
					<text class="arrow-icon" :class="{ rotated: currentFilterType === 'sort' }">▼</text>
				</view>

				<view class="filter-item" :class="{ active: currentFilterType === 'days' }" @click="toggleFilter('days')">
					<text>{{ currentDaysLabel }}</text>
					<text class="arrow-icon" :class="{ rotated: currentFilterType === 'days' }">▼</text>
				</view>
			</view>

			<view class="filter-dropdown" v-if="currentFilterType" @click.stop>
				<view v-if="currentFilterType === 'sort'" class="dropdown-content">
					<view class="dropdown-item" v-for="(item, index) in sortOptions" :key="index" :class="{ selected: sortValue === item.value }" @click="handleSortSelect(item)">
						{{ item.label }}
					</view>
				</view>

				<view v-if="currentFilterType === 'days'" class="dropdown-content">
					<view class="dropdown-item" v-for="(item, index) in daysOptions" :key="index" :class="{ selected: daysValue === item.value }" @click="handleDaysSelect(item)">
						{{ item.label }}
					</view>
				</view>
			</view>
		</view>

		<view class="filter-mask" v-if="currentFilterType" @click="closeFilter" :style="{ top: maskTop + 'px' }"></view>

		<scroll-view scroll-y class="product-scroll" @scrolltolower="loadMore">
			<view class="product-grid">
				<view class="product-card" v-for="(item, index) in productList" :key="item._id" @click="goToDetail(item._id)">
					<view class="image-wrapper">
						<image :src="getOptimizedImage(item.image, 400, 400)" mode="aspectFill" class="product-img"></image>
						<view class="duration-tag" v-if="item.duration_days">{{ item.duration_days }}天行程</view>
					</view>

					<view class="info-section">
						<view class="title">{{ item.title }}</view>

						<view class="tags-row" v-if="item.tags && item.tags.length">
							<text class="tag" v-for="(tag, tIndex) in item.tags.slice(0, 2)" :key="tIndex">{{ tag }}</text>
						</view>

						<view class="meta-row">
							<view class="sales">已售 {{ item.sales_count || 0 }}</view>
							<view class="rating" v-if="item.rating">
								<text class="star">★</text>
								{{ item.rating }}分
							</view>
						</view>

						<view class="price-row">
							<view class="price-box">
								<text class="symbol">¥</text>
								<text class="number">{{ item.price }}</text>
								<text class="unit">起</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<view class="loading-status">
				<text v-if="loading">正在加载...</text>
				<text v-else-if="!hasMore && productList.length > 0">没有更多了</text>
				<view v-else-if="!loading && productList.length === 0" class="empty-state">
					<text>暂无符合条件的产品</text>
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
			navBarHeight: 44, // 标准导航栏高度
			filterBarHeight: 44, // 筛选栏高度

			// 数据相关
			productList: [],
			loading: false,
			hasMore: true,
			page: 1,
			pageSize: 10,

			// 筛选状态
			currentFilterType: null, // 'sort' | 'days' | null

			// 排序配置
			sortValue: 'sales_desc',
			sortOptions: [
				{ label: '销量优先', value: 'sales_desc', field: 'sales_count desc' },
				{ label: '最新发布', value: 'new_desc', field: 'created_at desc' },
				{ label: '价格从低到高', value: 'price_asc', field: 'price asc' },
				{ label: '价格从高到低', value: 'price_desc', field: 'price desc' }
			],

			// 天数配置
			daysValue: 'all',
			daysOptions: [
				{ label: '全部天数', value: 'all', query: '' },
				{ label: '3天以下', value: 'lt3', query: 'duration_days < 3' },
				{ label: '3-5天', value: '3to5', query: 'duration_days >= 3 && duration_days <= 5' },
				{ label: '6-8天', value: '6to8', query: 'duration_days >= 6 && duration_days <= 8' },
				{ label: '9-12天', value: '9to12', query: 'duration_days >= 9 && duration_days <= 12' },
				{ label: '13天以上', value: 'gt13', query: 'duration_days >= 13' }
			]
		};
	},
	computed: {
		// 计算遮罩层的顶部位置 (状态栏 + 导航栏 + 筛选栏)
		maskTop() {
			return this.statusBarHeight + this.navBarHeight + this.filterBarHeight;
		},
		currentSortLabel() {
			const item = this.sortOptions.find((i) => i.value === this.sortValue);
			return item ? item.label : '排序';
		},
		currentDaysLabel() {
			const item = this.daysOptions.find((i) => i.value === this.daysValue);
			return item && item.value !== 'all' ? item.label : '行程天数';
		}
	},
	onLoad() {
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;
		this.loadData(true);
	},
	onPullDownRefresh() {
		this.loadData(true);
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},

		toggleFilter(type) {
			if (this.currentFilterType === type) {
				this.currentFilterType = null;
			} else {
				this.currentFilterType = type;
			}
		},
		closeFilter() {
			this.currentFilterType = null;
		},

		handleSortSelect(item) {
			this.sortValue = item.value;
			this.closeFilter();
			this.loadData(true);
		},

		handleDaysSelect(item) {
			this.daysValue = item.value;
			this.closeFilter();
			this.loadData(true);
		},

		async loadData(reload = false) {
			if (reload) {
				this.page = 1;
				this.hasMore = true;
				this.productList = [];
			}

			if (!this.hasMore || (this.loading && !reload)) return;

			this.loading = true;

			try {
				const db = uniCloud.databaseForJQL();
				let whereString = 'status == 1';

				const currentDayOpt = this.daysOptions.find((i) => i.value === this.daysValue);
				if (currentDayOpt && currentDayOpt.query) {
					whereString += ` && (${currentDayOpt.query})`;
				}

				const currentSortOpt = this.sortOptions.find((i) => i.value === this.sortValue);
				const orderByString = currentSortOpt ? currentSortOpt.field : 'sales_count desc';

				const res = await db
					.collection('a-products')
					.where(whereString)
					.field('title, price, product_images, sales_count, rating, duration_days, tags')
					.orderBy(orderByString)
					.skip((this.page - 1) * this.pageSize)
					.limit(this.pageSize)
					.get();

				const newData = res.data.map((item) => ({
					...item,
					image: item.product_images && item.product_images.length > 0 ? item.product_images[0] : '',
					price: Number(item.price).toLocaleString('zh-CN')
				}));

				if (reload) {
					this.productList = newData;
					uni.stopPullDownRefresh();
				} else {
					this.productList = [...this.productList, ...newData];
				}

				this.hasMore = newData.length === this.pageSize;
				if (this.hasMore) {
					this.page++;
				}
			} catch (e) {
				console.error('加载失败', e);
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				this.loading = false;
			}
		},

		loadMore() {
			this.loadData(false);
		},

		goToDetail(id) {
			uni.navigateTo({
				url: `/pages/product-detail/product-detail?id=${id}`
			});
		},

		getOptimizedImage(url, width = 400, height = 400) {
			if (!url) return '/static/default-image.png';
			if (url.includes('bspapp.com') || url.includes('aliyuncs.com')) {
				return url + `?x-oss-process=image/resize,w_${width},h_${height},m_fill/quality,q_80`;
			}
			return url;
		}
	}
};
</script>

<style lang="scss" scoped>
$primary-color: #ff6b35;
$bg-color: #f5f7fa;
$text-main: #333;

.page-container {
	background-color: $bg-color;
	height: 100vh; /* 必须限制高度，Flex布局才生效 */
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

/* --- 顶部固定区域组 (核心修改) --- */
.fixed-header-group {
	flex-shrink: 0; /* 禁止压缩 */
	background-color: #fff;
	z-index: 100;
	position: relative;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

/* 1. 自定义导航栏样式 */
.custom-nav-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 44px; /* 标准高度 */
	padding: 0 12px;
	box-sizing: content-box; /* 包含statusBar的高度的计算方式 */
}

.nav-left,
.nav-right {
	width: 60px; /* 两侧定宽，保证中间居中 */
	display: flex;
	align-items: center;
}

.nav-center {
	flex: 1;
	display: flex;
	justify-content: center;
}

.page-title {
	font-size: 17px;
	font-weight: 600;
	color: #333;
}

.back-btn-wrapper {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.back-icon {
	width: 20px;
	height: 20px;
}

/* 2. 筛选栏样式 (移除了 sticky，因为外层已经是固定的了) */
.filter-bar {
	display: flex;
	height: 44px;
	align-items: center;
	border-top: 1px solid #f5f5f5;
	background-color: #fff;
}

.filter-item {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
	color: #666;

	&.active {
		color: $primary-color;
		font-weight: 500;
	}

	.arrow-icon {
		font-size: 10px;
		margin-left: 4px;
		transition: transform 0.2s;
		&.rotated {
			transform: rotate(180deg);
		}
	}
}

/* 下拉菜单 */
.filter-dropdown {
	position: absolute;
	top: 100%; /* 紧贴头部下方 */
	left: 0;
	width: 100%;
	background-color: #fff;
	z-index: 101;
	border-radius: 0 0 12px 12px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
	padding: 12px 20px;
	font-size: 14px;
	color: #333;
	border-bottom: 1px solid #f9f9f9;

	&:last-child {
		border-bottom: none;
	}

	&.selected {
		color: $primary-color;
		background-color: #fff8f3;
		font-weight: 500;
	}
}

.filter-mask {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 99;
}

/* 3. 滚动区域 */
.product-scroll {
	flex: 1; /* 占据剩余空间 */
	height: 0; /* 关键：解决Flex子元素滚动问题 */
	background-color: $bg-color;
}

/* 产品卡片样式保持不变 */
.product-grid {
	padding: 12px;
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 10px;
}

.product-card {
	background-color: #fff;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
	display: flex;
	flex-direction: column;
}

.image-wrapper {
	position: relative;
	width: 100%;
	padding-top: 100%;
}

.product-img {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: #eee;
}

.duration-tag {
	position: absolute;
	bottom: 6px;
	left: 6px;
	background-color: rgba(0, 0, 0, 0.6);
	color: #fff;
	font-size: 10px;
	padding: 2px 6px;
	border-radius: 4px;
}

.info-section {
	padding: 8px 10px 12px;
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.title {
	font-size: 14px;
	font-weight: 600;
	color: $text-main;
	line-height: 1.4;
	margin-bottom: 6px;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.tags-row {
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
	margin-bottom: 6px;
}
.tag {
	font-size: 10px;
	color: $primary-color;
	border: 1px solid rgba($primary-color, 0.3);
	padding: 1px 4px;
	border-radius: 3px;
}

.meta-row {
	display: flex;
	justify-content: space-between;
	font-size: 11px;
	color: #999;
	margin-bottom: 8px;

	.rating {
		display: flex;
		align-items: center;
		.star {
			color: #ffb400;
			margin-right: 2px;
		}
	}
}

.price-row {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
}

.price-box {
	color: #e53e3e;
	font-weight: 600;
	line-height: 1;

	.symbol {
		font-size: 12px;
	}
	.number {
		font-size: 18px;
	}
	.unit {
		font-size: 10px;
		color: #999;
		margin-left: 2px;
		font-weight: normal;
	}
}

.loading-status {
	padding: 20px 0;
	text-align: center;
	color: #999;
	font-size: 12px;
}

.empty-state {
	padding-top: 50px;
	display: flex;
	flex-direction: column;
	align-items: center;
	color: #999;
}
</style>
