<template>
	<view class="guide-list-page">
		<view class="hero-section">
			<view class="nav-back-btn" @click="goBack">
				<uni-icons type="left" color="#ffffff" size="24"></uni-icons>
			</view>
			<view class="status-bar-placeholder"></view>
			<view class="hero-content">
				<view class="hero-title">风漫 · 超能私导</view>
				<view class="hero-subtitle">与有趣的灵魂同行</view>
			</view>
			<view class="hero-curve"></view>
		</view>

		<view class="guide-container">
			<view v-if="loading && guideList.length === 0" class="loading-state">
				<view class="spinner"></view>
				<text>正在召集王牌私导...</text>
			</view>

			<view v-else class="guide-grid">
				<view class="guide-card" v-for="(guide, index) in guideList" :key="guide._id" @click="goToDetail(guide._id)">
					<view class="card-image-box">
						<image :src="getOptimizedImage(guide.personal_photo, 600, 800)" mode="aspectFill" class="guide-photo"></image>
						<view class="guide-gradient-overlay"></view>
					</view>

					<view class="card-info">
						<view class="info-header">
							<text class="guide-name">{{ guide.real_name }}</text>
							<view class="rating-row-inline">
								<image src="/static/icons/star.svg" class="star-icon-small" />
								<text class="rating-num-text">{{ guide.rating || 5.0 }}</text>
							</view>
						</view>

						<view class="guide-stats">
							<text>已服务 {{ guide.order_count || 0 }} 个团</text>
						</view>

						<view class="guide-intro">
							{{ guide.introduction || '这位私导很神秘，暂时没有介绍~' }}
						</view>

						<view class="card-footer">
							<view class="view-profile-btn">查看详情</view>
						</view>
					</view>
				</view>
			</view>

			<view class="load-more-status" v-if="guideList.length > 0">
				<text v-if="loading">正在加载更多...</text>
				<text v-else-if="!hasMore" class="no-more">—— 到底啦，没有更多私导了 ——</text>
			</view>

			<view v-if="!loading && guideList.length === 0" class="empty-state">暂无私导数据</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			loading: false,
			guideList: [],
			// 分页参数
			page: 1,
			pageSize: 10,
			hasMore: true // 是否还有更多数据
		};
	},
	onLoad() {
		this.loadGuides(true); // true 表示重置列表（第一页）
	},
	// 监听触底事件
	onReachBottom() {
		if (this.hasMore && !this.loading) {
			this.loadGuides(false); // 加载下一页
		}
	},
	methods: {
		goBack() {
			uni.navigateBack({ delta: 1 });
		},
		getOptimizedImage(url, w, h) {
			if (!url) return 'https://via.placeholder.com/400x600?text=No+Image';
			if (url.includes('x-oss-process')) return url;
			return url + `?x-oss-process=image/resize,w_${w}/quality,q_80/format,webp`;
		},

		async loadGuides(reset = false) {
			if (this.loading) return;

			this.loading = true;

			if (reset) {
				this.page = 1;
				this.hasMore = true;
				this.guideList = [];
			}

			try {
				const db = uniCloud.databaseForJQL();

				// 1. 获取私导列表 (分页)
				const res = await db
					.collection('b-guide-profiles')
					.field('real_name, personal_photo, rating, introduction, user_id')
					.orderBy('rating desc, order_count desc') // 保持原有排序
					.skip((this.page - 1) * this.pageSize) // 跳过前面页数的数据
					.limit(this.pageSize) // 限制每页数量
					.get();

				const currentBatch = res.data;

				// 2. 实时计算 *当前页* 私导的接单数
				const countPromises = currentBatch.map(async (guide) => {
					if (!guide.user_id) return { ...guide, order_count: 0 };

					try {
						const countRes = await db
							.collection('a-snapshots')
							.where({
								'staves.id': guide.user_id
							})
							.count();
						return { ...guide, order_count: countRes.total };
					} catch (err) {
						console.error(`Count error for ${guide.real_name}`, err);
						return { ...guide, order_count: 0 };
					}
				});

				const processedBatch = await Promise.all(countPromises);

				// 3. 更新列表数据
				if (reset) {
					this.guideList = processedBatch;
				} else {
					// 追加数据
					this.guideList = [...this.guideList, ...processedBatch];
				}

				// 4. 判断是否还有更多数据
				if (processedBatch.length < this.pageSize) {
					this.hasMore = false;
				} else {
					this.page++;
				}
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				this.loading = false;
			}
		},

		goToDetail(id) {
			uni.navigateTo({
				url: `/pages/guide/detail?id=${id}`
			});
		}
	}
};
</script>

<style>
.nav-back-btn {
	position: absolute;
	top: calc(var(--status-bar-height) + 80px);
	left: 16px;
	z-index: 100;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
}

/* 页面背景 */
.guide-list-page {
	min-height: 100vh;
	background-color: #f5f7fa;
	padding-bottom: 40px; /* 底部留白给 loading 提示 */
}

/* 头部设计 */
.hero-section {
	background: linear-gradient(135deg, #2c3e50 0%, #000000 100%);
	color: white;
	padding: 100px 24px 140px;
	position: relative;
	overflow: hidden;
}
.hero-title {
	font-size: 28px;
	font-weight: bold;
	margin-bottom: 8px;
	margin-left: 42px;
	letter-spacing: 1px;
}
.hero-subtitle {
	font-size: 14px;
	opacity: 0.8;
	margin-left: 42px;
	letter-spacing: 2px;
	text-transform: uppercase;
}
.hero-curve {
	position: absolute;
	bottom: -20px;
	left: 0;
	width: 100%;
	height: 80px;
	background: #f5f7fa;
	border-radius: 50% 50% 0 0 / 100% 100% 0 0;
	transform: scaleX(1.5);
}

.guide-container {
	padding: 0 16px 0; /* 底部padding移交给了 page */
	margin-top: -100px;
	position: relative;
	z-index: 10;
}

.guide-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 12px;
}

/* 卡片设计 */
.guide-card {
	background: white;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
	margin-bottom: 0;
	display: flex;
	flex-direction: column;
}
.guide-card:active {
	transform: scale(0.98);
}

/* 第一张卡片 */
.guide-card:first-child {
	grid-column: span 2;
	margin-bottom: 12px;
	border-radius: 20px;
}
.guide-card:first-child .card-image-box {
	height: 380px;
}
.guide-card:first-child .card-info {
	position: relative;
	background: white;
	margin-top: -20px;
	border-radius: 20px 20px 0 0;
	padding: 20px;
}

/* 小卡片 */
.guide-card:not(:first-child) .card-image-box {
	height: 200px;
}
.guide-card:not(:first-child) .card-info {
	padding: 12px;
	margin-top: -10px;
	flex: 1;
	display: flex;
	flex-direction: column;
}
.guide-card:not(:first-child) .guide-name {
	font-size: 16px;
}
.guide-card:not(:first-child) .badge {
	font-size: 9px;
	padding: 1px 4px;
	transform: scale(0.9);
	transform-origin: left center;
}
.guide-card:not(:first-child) .guide-intro {
	font-size: 12px;
	line-height: 1.6;
	height: 3.2em;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	overflow: hidden;
	margin-bottom: 8px;
}
.guide-card:not(:first-child) .view-profile-btn {
	height: 32px;
	font-size: 12px;
	margin-top: auto;
}

/* 通用组件样式 */
.card-image-box {
	width: 100%;
	position: relative;
}
.guide-photo {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
.guide-gradient-overlay {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 50%;
	background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
}

.rating-row-inline {
	display: flex;
	align-items: center;
}
.star-icon-small {
	width: 16px;
	height: 16px;
	margin-right: 4px;
}
.rating-num-text {
	font-weight: bold;
	color: #333;
	font-size: 16px;
}

.card-info {
	background: white;
	z-index: 2;
}
.info-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}
.guide-name {
	font-size: 22px;
	font-weight: 700;
	color: #333;
}
.guide-stats {
	font-size: 13px;
	color: #ff6b35;
	margin-bottom: 12px;
	font-weight: 600;
}
.guide-intro {
	font-size: 14px;
	color: #666;
	line-height: 1.6;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	overflow: hidden;
	margin-bottom: 16px;
}
.guide-card:first-child .guide-intro {
	-webkit-line-clamp: 3;
}

.view-profile-btn {
	width: 100%;
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #333;
	color: #d4af37;
	border-radius: 12px;
	font-size: 14px;
	font-weight: 600;
}

/* 初始Loading */
.loading-state {
	padding: 60px 0;
	text-align: center;
	color: #999;
	display: flex;
	flex-direction: column;
	align-items: center;
}
.spinner {
	width: 30px;
	height: 30px;
	border: 3px solid #eee;
	border-top-color: #ff6b35;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin: 0 auto 10px;
}
@keyframes spin {
	100% {
		transform: rotate(360deg);
	}
}

.load-more-status {
	text-align: center;
	padding: 20px 0;
	color: #999;
	font-size: 13px;
	grid-column: span 2; /* 确保在Grid中占满整行 */
	width: 100%;
}
.no-more {
	opacity: 0.6;
}
.empty-state {
	text-align: center;
	padding: 60px 0;
	color: #999;
}
</style>
