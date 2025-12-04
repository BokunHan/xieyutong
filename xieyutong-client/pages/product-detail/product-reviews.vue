<template>
	<view class="review-page">
		<!-- 1. 顶部导航栏 -->
		<view class="header-bar">
			<view class="back-btn" @click="goBack">
				<!-- <text class="fa fa-chevron-left"></text> -->
				<image src="/static/icons/chevron-left.svg" class="w-6 h-6" mode="aspectFit" />
			</view>
			<text class="header-title">点评</text>
			<view class="placeholder"></view>
			<!-- 占位使标题居中 -->
		</view>

		<!-- 2. 页面内容 -->
		<view class="content-area">
			<!-- 2.1 评分统计 -->
			<view v-if="loadingProduct" class="rating-section section">
				<!-- 加载中的骨架屏 -->
				<view class="flex justify-between items-center">
					<view class="flex flex-col">
						<view class="h-10 w-24 bg-gray-200 rounded mb-2"></view>
						<view class="h-4 w-20 bg-gray-200 rounded"></view>
					</view>
					<view class="flex-1 ml-4 flex flex-col gap-2">
						<view class="h-4 w-full bg-gray-200 rounded"></view>
						<view class="h-4 w-full bg-gray-200 rounded"></view>
						<view class="h-4 w-full bg-gray-200 rounded"></view>
					</view>
				</view>
			</view>
			<view v-else-if="productData.rating" class="rating-section section">
				<!-- 左侧总分 -->
				<view class="rating-left">
					<view class="flex items-baseline">
						<text class="main-rating">{{ (productData.rating || 0).toFixed(1) }}</text>
						<text class="text-gray-500 text-base">/5</text>
					</view>
					<text class="good-rate">好评率{{ (productData.good_rate || 100).toFixed(1) }}%</text>
				</view>
				<!-- 右侧分项 -->
				<view class="rating-right">
					<view class="rating-spec-item">
						<text>行程安排</text>
						<view class="progress-bar-bg">
							<view class="progress-bar-fill" :style="{ width: getSpecRatingPercent('itinerary') }"></view>
						</view>
						<text class="spec-score">{{ getSpecRating('itinerary') }}</text>
					</view>
					<view class="rating-spec-item">
						<text>酒店体验</text>
						<view class="progress-bar-bg">
							<view class="progress-bar-fill" :style="{ width: getSpecRatingPercent('accommodation') }"></view>
						</view>
						<text class="spec-score">{{ getSpecRating('accommodation') }}</text>
					</view>
					<view class="rating-spec-item">
						<text>司导服务</text>
						<view class="progress-bar-bg">
							<view class="progress-bar-fill" :style="{ width: getSpecRatingPercent('service') }"></view>
						</view>
						<text class="spec-score">{{ getSpecRating('service') }}</text>
					</view>
				</view>
			</view>
			<view v-else-if="error" class="section">
				<text class="text-red-500">{{ error }}</text>
			</view>

			<!-- 2.2 评论列表 -->
			<view class="review-list section">
				<view v-if="loadingReviews && reviews.length === 0" class="text-center py-10">
					<text class="text-gray-500">评论加载中...</text>
				</view>
				<view v-else-if="reviews.length === 0" class="text-center py-10">
					<text class="text-gray-500">暂无评论</text>
				</view>

				<view v-else>
					<view class="review-card" v-for="review in reviews" :key="review._id">
						<!-- 头部：头像、昵称、评分 -->
						<view class="flex items-center justify-between mb-3">
							<view class="flex items-center">
								<image :src="review.user_avatar" class="w-10 h-10 rounded-full mr-3" mode="aspectFill" />
								<view>
									<text class="text-sm font-medium text-gray-800 block">{{ review.user_name || '匿名用户' }}</text>
									<view class="flex items-center mt-1">
										<text class="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-sm" style="font-weight: 500">😆 {{ (review.rating || 0).toFixed(1) }}分 好评</text>
									</view>
								</view>
							</view>
						</view>

						<!-- 元数据：日期、地点、类型等 -->
						<view class="review-meta">
							<text v-if="review.created_at">
								{{ review.created_at }}
							</text>
							<text v-if="review.location">发表于{{ review.location }}</text>
							<text v-if="review.group_type">
								<text class="meta-divider">|</text>
								{{ review.group_type }}
							</text>
						</view>
						<view class="review-meta">
							<text v-if="review.travel_date">{{ review.travel_date }} 出发</text>
							<text v-if="review.route">
								<text class="meta-divider">|</text>
								{{ review.route }}
							</text>
						</view>

						<view class="h-px bg-gray-200 my-3"></view>

						<!-- 评论内容 -->
						<text class="review-content">{{ review.content }}</text>

						<!-- 评论图片 -->
						<view v-if="review.images && review.images.length > 0" class="review-images-grid">
							<image
								v-for="(img, index) in review.images"
								:key="index"
								:src="img"
								class="w-full h-24 rounded-lg object-cover"
								mode="aspectFill"
								@click="previewImage(review, index)" />
						</view>

						<!-- 底部 -->
						<view class="flex items-center justify-between">
							<view v-if="review.guide_name" class="review-guide">
								<text class="text-gray-600 mr-2">TA的司导：</text>
								<image :src="review.guide_photo" class="w-6 h-6 rounded-full mr-1.5" mode="aspectFill" />
								<text class="font-medium text-gray-800">{{ review.guide_name }}</text>
							</view>

							<view class="helpful-btn" @click="toggleHelpful(review)">
								<!-- <text class="fa fa-thumbs-up mr-1"></text> -->
								<image src="/static/icons/thumbs-up.svg" class="w-3 h-3 mr-1" mode="aspectFit" />
								<text v-if="review.helpful_count === 0">有用</text>
								<text v-else>{{ review.helpful_count }}</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 2.3 列表底部提示 -->
				<view class="list-footer">
					<text v-if="loadingReviews && reviews.length > 0" class="text-gray-500">加载中...</text>
					<text v-else-if="!pagination.hasMore" class="text-gray-500">已经到底啦~</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			ctripId: null, // 从 onLoad 获取

			// 顶部产品数据
			loadingProduct: true,
			productData: {
				rating: 0,
				good_rate: 0,
				rating_spec: {
					itinerary: 0,
					accommodation: 0,
					service: 0
				}
			},

			// 评论列表数据
			loadingReviews: true,
			reviews: [],
			pagination: {
				page: 1,
				pageSize: 10,
				hasMore: true
			},

			error: null
		};
	},
	onLoad(options) {
		if (options.ctripId) {
			this.ctripId = options.ctripId;
			this.loadProductData();
			this.loadReviews(false); // 首次加载
		} else {
			this.error = '缺少产品ID';
			this.loadingProduct = false;
			this.loadingReviews = false;
		}
	},
	onReachBottom() {
		// 滚动到底部，加载更多评论
		this.loadReviews(true);
	},
	methods: {
		// 1. 加载顶部的产品评分信息
		async loadProductData() {
			this.loadingProduct = true;
			try {
				const db = uniCloud.database();
				const res = await db.collection('a-products').where({ ctrip_id: this.ctripId }).field('rating, good_rate, rating_spec').limit(1).get();

				if (res.result?.data?.length > 0) {
					this.productData = res.result.data[0];
				} else {
					console.warn(`未找到 ctrip_id 为 ${this.ctripId} 的产品`);
				}
			} catch (err) {
				console.error('加载产品数据失败:', err);
				this.error = '加载评分数据失败';
			} finally {
				this.loadingProduct = false;
			}
		},

		// 2. 加载评论列表（支持分页）
		async loadReviews(loadMore = false) {
			// 如果正在加载中，或者没有更多了，则不执行
			if (this.loadingReviews && loadMore) return;
			if (!this.pagination.hasMore && loadMore) return;

			this.loadingReviews = true;

			if (loadMore) {
				this.pagination.page++;
			} else {
				this.pagination.page = 1;
				this.reviews = []; // 重置列表
				this.pagination.hasMore = true;
			}

			try {
				const db = uniCloud.database();
				const res = await db
					.collection('a-reviews')
					.where({ ctrip_id: this.ctripId })
					.orderBy('created_at', 'desc') // 按时间倒序
					.skip((this.pagination.page - 1) * this.pagination.pageSize)
					.limit(this.pagination.pageSize)
					.get();

				const newReviews = res.result.data || [];

				if (loadMore) {
					this.reviews = [...this.reviews, ...newReviews];
				} else {
					this.reviews = newReviews;
				}

				console.log(`成功加载 ${newReviews.length} 条评论，共计 ${this.reviews.length} 条`);

				// 判断是否还有更多
				this.pagination.hasMore = newReviews.length === this.pagination.pageSize;
			} catch (err) {
				console.error('加载评论列表失败:', err);
				this.error = '加载评论列表失败';
			} finally {
				this.loadingReviews = false;
			}
		},

		// 3. 辅助方法 - 获取分项评分
		getSpecRating(specName) {
			if (!this.productData.rating_spec) return '5.0';
			return (this.productData.rating_spec[specName] || 5.0).toFixed(1);
		},

		// 4. 辅助方法 - 获取分项评分百分比（用于进度条）
		getSpecRatingPercent(specName) {
			const rating = this.getSpecRating(specName);
			return (rating / 5) * 100 + '%';
		},

		// 5. 预览图片
		previewImage(review, index) {
			uni.previewImage({
				current: index,
				urls: review.images
			});
		},

		// 6. 点击“有用” (这里只做前端模拟)
		toggleHelpful(review) {
			// 实际开发中，这里应该调用云函数/客户端DB操作
			// 并检查用户是否已点赞

			// 模拟：如果已经是0，点赞+1
			if (review.helpful_count === 0) {
				review.helpful_count++;
				uni.showToast({
					title: '感谢您的反馈',
					icon: 'none'
				});
			} else {
				// 模拟：如果已经 > 0，提示已点过
				uni.showToast({
					title: '您已经点过赞啦',
					icon: 'none'
				});
			}
		},

		// 7. 返回上一页
		goBack() {
			uni.navigateBack();
		}
	}
};
</script>

<style>
/* 页面基础 */
.review-page {
	background-color: #f5f7fa;
	min-height: 100vh;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 顶部导航栏 */
.header-bar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 44px; /* H5/APP 通用导航栏高度 */
	padding: 0 16px;
	background-color: #ffffff;
	border-bottom: 1px solid #f0f0f0;
	z-index: 100;
	/* 适配状态栏 */
	padding-top: calc(var(--status-bar-height) + 40rpx);
}

.back-button {
	position: absolute;
	left: 24rpx;
	top: calc(var(--status-bar-height) + 45rpx);
	width: 70rpx;
	height: 70rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 99;
	background-color: rgba(255, 255, 255, 0.7);
	border-radius: 50%;
}

.header-title {
	font-size: 17px;
	font-weight: 600;
}
.placeholder {
	width: 30px;
}

/* 内容区域 */
.content-area {
	/* 留出顶部导航栏空间 */
	padding-top: calc(120rpx + var(--status-bar-height));
	padding-bottom: 20px;
}

/* 通用卡片样式 */
.section {
	background-color: #ffffff;
	margin: 12px;
	border-radius: 8px;
	padding: 16px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 评分统计 */
.rating-section {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.rating-left {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	padding-right: 16px;
}
.main-rating {
	font-size: 36px;
	font-weight: bold;
	color: #eb6d20;
	line-height: 1;
}
.good-rate {
	font-size: 12px;
	color: #6b7280;
	margin-top: 4px;
}
.rating-right {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.rating-spec-item {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	color: #4b5563;
}
.progress-bar-bg {
	flex: 1;
	height: 6px;
	background-color: #e5e7eb;
	border-radius: 3px;
	overflow: hidden;
}
.progress-bar-fill {
	height: 100%;
	background-color: #eb6d20;
	border-radius: 3px;
	transition: width 0.3s ease;
}
.spec-score {
	font-weight: 500;
	color: #eb6d20;
	width: 24px; /* 固定宽度，防止跳动 */
	text-align: right;
}

/* 评论列表 */
.review-list {
	padding-top: 8px;
	padding-bottom: 8px;
}

.review-card {
	padding-top: 16px;
	padding-bottom: 16px;
	border-bottom: 1px solid #f0f0f0;
}
.review-card:last-child {
	border-bottom: none;
	padding-bottom: 0;
}

.review-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 4px; /* 行间距4px, 列间距8px */
	font-size: 11px;
	color: #6b7280;
	margin-bottom: 3px;
}
.meta-divider {
	color: #d1d5db;
	margin: 0 4px;
}

.review-content {
	display: block;
	font-size: 14px;
	color: #1f2937;
	line-height: 1.6;
	margin-bottom: 12px;
	word-break: break-word; /* 自动换行 */
}

.review-images-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 8px;
	margin-bottom: 12px;
}

.review-guide {
	display: flex;
	align-items: center;
	background-color: #f9fafb;
	padding: 8px 10px;
	border-radius: 8px;
	font-size: 12px;
}

.helpful-btn {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 12px;
	color: #6b7280;
	border: 1px solid #d1d5db;
	border-radius: 16px;
	padding: 4px 10px;
	transition: all 0.2s ease;
}

.helpful-btn.active {
	color: #eb6d20;
	border-color: #bfdbfe;
	background-color: #eff6ff;
}
.helpful-btn:active {
	background-color: #f3f4f6;
}

.list-footer {
	text-align: center;
	font-size: 12px;
	color: #9ca3af;
	padding: 16px 0 8px;
}
</style>
