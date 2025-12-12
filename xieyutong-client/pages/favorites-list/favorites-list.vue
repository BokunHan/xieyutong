<template>
	<view class="favorites-container">
		<!-- 内容区域 -->
		<scroll-view class="content-area" scroll-y refresher-enabled :refresher-triggered="isRefreshing" @refresherrefresh="onRefresh" @scrolltolower="onLoadMore">
			<!-- 收藏列表 -->
			<view class="favorite-list">
				<!-- 收藏项目 -->
				<view class="favorite-card" v-for="(item, index) in favoriteItems" :key="item._id" @click="goToProductDetail(item)">
					<view class="favorite-content">
						<view class="flex">
							<view class="w-20 h-20 rounded overflow-hidden flex-shrink-0">
								<image :src="getOptimizedImage(item.product_image, 200, 200)" :alt="item.product_title" class="w-full h-full object-cover"></image>
							</view>
							<view class="ml-3 flex-1">
								<view class="product-title-container">
									<text class="product-title">{{ item.product_title }}</text>
								</view>
								<view class="product-rating-container">
									<text class="rating-score">{{ item.product_rating }}分</text>
									<view class="rating-stars">
										<!-- <text class="fa fa-star" v-for="star in 5" :key="star" :class="star <= Math.floor(item.product_rating) ? 'star-active' : 'star-inactive'"></text> -->
										<image
											class="w-3 h-3"
											v-for="star in 5"
											:key="star"
											:src="star <= Math.floor(item.product_rating) ? '/static/icons/star.svg' : '/static/icons/star-inactive.svg'" />
									</view>
									<text class="sales-count">已售{{ item.product_sales }}人</text>
								</view>
							</view>
						</view>
					</view>
					<view class="favorite-footer">
						<view class="text-orange-500 font-medium">¥{{ item.product_price }}/人起</view>
						<view class="flex space-x-2">
							<button class="cancel-button" @click.stop="removeFavorite(item, index)">取消收藏</button>
							<button class="orange-button" @click.stop="bookNow(item)">立即预订</button>
						</view>
					</view>
				</view>

				<!-- 空状态 -->
				<view class="empty-state" v-if="favoriteItems.length === 0 && !isLoading">
					<view class="flex flex-col items-center justify-center" style="height: 60vh">
						<!-- <text class="fa fa-heart empty-icon"></text> -->
						<image src="/static/icons/heart-gray.svg" class="w-12 h-12 mb-3" mode="aspectFit" />
						<view class="empty-title">暂无收藏</view>
						<view class="empty-desc">您还没有收藏任何商品</view>
						<button class="browse-button" @click="goToBrowse">去逛逛</button>
					</view>
				</view>

				<!-- 加载更多 -->
				<view class="load-more" v-if="favoriteItems.length > 0">
					<text v-if="isLoadingMore" class="text-gray-500 text-sm">加载中...</text>
					<text v-else-if="hasMore" class="text-gray-500 text-sm">上拉加载更多</text>
					<text v-else class="text-gray-500 text-sm">没有更多数据了</text>
				</view>
			</view>
		</scroll-view>

		<!-- 加载中状态 -->
		<view class="loading-state" v-if="isLoading && favoriteItems.length === 0">
			<view class="flex flex-col items-center justify-center" style="height: 60vh">
				<text class="text-gray-500">加载中...</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 响应式数据
const favoriteItems = ref([]);
const isLoading = ref(false);
const isRefreshing = ref(false);
const isLoadingMore = ref(false);
const hasMore = ref(true);
const currentPage = ref(1);
const pageSize = 10;

// 获取收藏列表 - 直接使用 ClientDB
const getFavoriteList = async (page = 1, isRefresh = false) => {
	try {
		if (page === 1) {
			isRefresh ? (isRefreshing.value = true) : (isLoading.value = true);
		} else {
			isLoadingMore.value = true;
		}

		console.log('[收藏列表] 开始获取收藏数据，页码:', page);

		// 直接使用 ClientDB，会自动验证用户身份和权限
		const db = uniCloud.database();
		const skip = (page - 1) * pageSize;

		const result = await db
			.collection('a-favorites')
			.where('user_id == $cloudEnv_uid') // ClientDB 自动替换为当前用户ID
			.orderBy('created_at desc')
			.skip(skip)
			.limit(pageSize)
			.get();

		console.log('[收藏列表] ClientDB 查询结果:', result);

		if (result.result && result.result.data) {
			const newItems = result.result.data;

			if (page === 1) {
				favoriteItems.value = newItems;
			} else {
				favoriteItems.value.push(...newItems);
			}

			// 判断是否还有更多数据
			hasMore.value = newItems.length === pageSize;
			currentPage.value = page;

			console.log('[收藏列表] 收藏数据加载成功，共', favoriteItems.value.length, '条');
		}
	} catch (error) {
		console.error('[收藏列表] 获取收藏列表失败:', error);
		uni.showToast({
			title: '获取收藏列表失败',
			icon: 'none'
		});
	} finally {
		isLoading.value = false;
		isRefreshing.value = false;
		isLoadingMore.value = false;
	}
};

// 下拉刷新
const onRefresh = async () => {
	console.log('[收藏列表] 下拉刷新');
	await getFavoriteList(1, true);
};

// 上拉加载更多
const onLoadMore = async () => {
	if (!hasMore.value || isLoadingMore.value) {
		console.log('[收藏列表] 没有更多数据或正在加载中');
		return;
	}

	console.log('[收藏列表] 上拉加载更多');
	await getFavoriteList(currentPage.value + 1);
};

// 取消收藏 - 直接使用 ClientDB
const removeFavorite = async (item, index) => {
	console.log('[收藏列表] 准备取消收藏:', item.product_title);

	uni.showModal({
		title: '取消收藏',
		content: '确定要取消收藏这个商品吗？',
		success: async (res) => {
			if (res.confirm) {
				try {
					console.log('[收藏列表] 开始删除收藏记录，ID:', item._id);

					// 直接使用 ClientDB 删除，会自动验证权限（只能删除自己的收藏）
					const db = uniCloud.database();
					const result = await db.collection('a-favorites').doc(item._id).remove();

					console.log('[收藏列表] ClientDB 删除结果:', result);

					if (result.result && result.result.deleted > 0) {
						// 从本地数组中移除
						favoriteItems.value.splice(index, 1);

						uni.showToast({
							title: '已取消收藏',
							icon: 'success'
						});

						console.log('[收藏列表] 取消收藏成功');
					} else {
						throw new Error('删除失败');
					}
				} catch (error) {
					console.error('[收藏列表] 取消收藏失败:', error);
					uni.showToast({
						title: '取消收藏失败',
						icon: 'none'
					});
				}
			}
		}
	});
};

// 跳转到商品详情
const goToProductDetail = (item) => {
	console.log('[收藏列表] 跳转到商品详情:', item.product_title);
	uni.navigateTo({
		url: `/pages/product-detail/product-detail?id=${item.product_id}`
	});
};

// 立即预订
const bookNow = (item) => {
	console.log('[收藏列表] 立即预订:', item.product_title);
	uni.navigateTo({
		url: `/pages/product-detail/product-detail?id=${item.product_id}`
	});
};

// 去逛逛
const goToBrowse = () => {
	console.log('[收藏列表] 跳转到首页');
	uni.switchTab({
		url: '/pages/home/home'
	});
};

const getOptimizedImage = (url, width = 800, height = 0, quality = 80) => {
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
};

// 收藏页面只需要查看和删除功能，添加收藏应该在商品详情页面实现

// 页面加载时获取数据
onMounted(() => {
	console.log('[收藏列表] 页面加载，开始获取收藏数据');
	getFavoriteList(1);
});

// 页面完成
</script>

<style>
/* 收藏列表页面样式 */
.favorites-container {
	background-color: #f5f5f5;
	min-height: 100vh;
}

.content-area {
	height: 100vh;
	background-color: #f5f5f5;
}

.favorite-card {
	background-color: white;
	margin: 12px;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.favorite-content {
	padding: 16px;
}

/* 产品信息布局优化 */
.product-title-container {
	margin-bottom: 8px;
}

.product-title {
	font-size: 15px;
	font-weight: 500;
	color: #1f2937;
	line-height: 1.4;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	word-break: break-all;
}

.product-rating-container {
	display: flex;
	align-items: center;
	gap: 6px;
	flex-wrap: wrap;
}

.rating-score {
	font-size: 13px;
	font-weight: 500;
	color: #eb6d20;
}

.rating-stars {
	display: flex;
	gap: 1px;
}

.rating-stars .fa-star {
	font-size: 11px;
}

.star-active {
	color: #fbbf24;
}

.star-inactive {
	color: #d1d5db;
}

.sales-count {
	font-size: 11px;
	color: #9ca3af;
}

.favorite-footer {
	padding: 12px 16px;
	border-top: 1px solid #f0f0f0;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.cancel-button {
	border: 1px solid #d1d5db;
	color: #6b7280;
	background-color: white;
	border-radius: 9999px;
	padding: 6px 16px;
	font-size: 14px;
	border: 1px solid #d1d5db;
	min-width: 80px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 400;
}

.orange-button {
	background-color: #eb6d20;
	color: white;
	border-radius: 9999px;
	padding: 6px 16px;
	font-size: 14px;
	border: none;
	min-width: 80px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 500;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 20px;
	color: #999;
}

.empty-icon {
	font-size: 48px;
	margin-bottom: 16px;
	color: #d1d5db;
}

.empty-title {
	font-size: 16px;
	color: #666;
	margin-bottom: 8px;
}

.empty-desc {
	font-size: 14px;
	color: #999;
	margin-bottom: 20px;
}

.browse-button {
	background-color: #eb6d20;
	color: white;
	border-radius: 10px;
	padding: 8px 20px;
	font-size: 14px;
	border: none;
}

.space-x-2 > button:not(:first-child) {
	margin-left: 8px;
}

.load-more {
	padding: 20px;
	text-align: center;
}

.loading-state {
	background-color: #f5f5f5;
}
</style>
