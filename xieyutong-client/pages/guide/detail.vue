<template>
	<view class="guide-detail-page">
		<view v-if="loading" class="loading-full-screen">
			<view class="spinner"></view>
		</view>

		<template v-else-if="guide">
			<view class="detail-header">
				<image :src="getOptimizedImage(guide.background_image || guide.personal_photo, 800, 0)" class="header-bg-img" mode="aspectFill"></image>
				<view class="header-overlay"></view>

				<view class="custom-nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
					<view class="back-circle-btn" @click="goBack">
						<uni-icons type="left" color="#ffffff" size="20"></uni-icons>
					</view>
				</view>
				<view :style="{ height: statusBarHeight + 44 + 'px' }"></view>

				<view class="profile-card-float">
					<view class="profile-top">
						<image :src="getOptimizedImage(guide.personal_photo, 200, 200)" class="avatar-circle" mode="aspectFill"></image>
						<view class="profile-text">
							<view class="name-row">
								<text class="real-name">{{ guide.real_name }}</text>
								<image v-if="guide.gender === 2" src="/static/icons/female.png" class="gender-icon" />
								<image v-else src="/static/icons/male.png" class="gender-icon" />
							</view>
							<view class="tag-row">
								<text class="tag">5年驾龄</text>
								<text class="tag">摄影达人</text>
								<text class="tag">本地通</text>
							</view>
						</view>
					</view>

					<view class="stats-row">
						<view class="stat-item">
							<text class="stat-num">{{ guide.rating }}</text>
							<text class="stat-label">综合评分</text>
						</view>
						<view class="stat-divider"></view>
						<view class="stat-item">
							<text class="stat-num">{{ guide.order_count }}</text>
							<text class="stat-label">累计接单</text>
						</view>
						<view class="stat-divider"></view>
						<view class="stat-item">
							<text class="stat-num">100%</text>
							<text class="stat-label">好评率</text>
						</view>
					</view>
				</view>
			</view>

			<view class="detail-content">
				<view class="section-box">
					<view class="section-title">关于我</view>
					<view class="intro-text">
						{{ guide.introduction || '暂无详细介绍' }}
					</view>
				</view>

				<view class="section-box auth-section">
					<view class="section-title-mini">资质认证</view>
					<scroll-view scroll-x class="auth-scroll" :show-scrollbar="false">
						<view class="auth-row-horizontal">
							<view class="auth-tag-item gold" v-if="guide.guide_license_home" @click="previewImage(guide.guide_license_home)">
								<uni-icons type="flag-filled" color="#B8860B" size="16"></uni-icons>
								<text class="auth-text">导游认证</text>
							</view>

							<view class="auth-tag-item blue" v-if="guide.driver_license" @click="previewImage(guide.driver_license)">
								<uni-icons type="map-filled" color="#409EFF" size="16"></uni-icons>
								<text class="auth-text">驾驶认证</text>
							</view>

							<view class="auth-tag-item green">
								<uni-icons type="person-filled" color="#07c160" size="16"></uni-icons>
								<text class="auth-text">实名认证</text>
							</view>

							<view style="width: 1rpx; flex-shrink: 0"></view>
						</view>
					</scroll-view>
				</view>

				<view class="section-box no-padding portfolio-box">
					<view class="section-header-padded">
						<view class="section-title">旅拍瞬间</view>
						<view class="more-text">共 {{ portfolioList.length }} 个作品</view>
					</view>

					<swiper class="portfolio-swiper" :indicator-dots="false" :autoplay="true" :interval="4000" :circular="true" previous-margin="0" next-margin="0">
						<swiper-item v-for="(item, index) in portfolioList" :key="item._id" class="pf-swiper-item">
							<view class="pf-card full-width" @click="handleMediaClick(item)">
								<template v-if="item.media_type === 'video'">
									<image
										:src="getOptimizedImage(item.poster || (item.media && item.media.url ? item.media.url + '?x-oss-process=video/snapshot,t_1000' : ''), 800, 500)"
										mode="aspectFill"
										class="pf-img"></image>
									<view class="play-btn">
										<uni-icons type="videocam-filled" color="rgba(255,255,255,0.6)" size="32"></uni-icons>
									</view>
								</template>

								<template v-else>
									<image :src="getOptimizedImage(item.media ? item.media.url : '', 800, 500)" mode="aspectFill" class="pf-img"></image>
								</template>

								<view class="bottom-gradient"></view>
							</view>
						</swiper-item>

						<swiper-item v-if="portfolioList.length === 0">
							<view class="pf-card empty full-width">
								<text>暂无上传作品</text>
							</view>
						</swiper-item>
					</swiper>
				</view>

				<view style="height: 100px"></view>
			</view>

			<view class="bottom-action-bar">
				<view class="action-left">
					<view class="action-icon-col">
						<image src="/static/icons/share-alt.svg" class="bar-icon" />
						<text>分享</text>
					</view>
					<view class="action-icon-col">
						<image src="/static/icons/headset.svg" class="bar-icon" />
						<text>咨询</text>
					</view>
				</view>
				<view class="action-btn" @click="handleBook">预约档期</view>
			</view>
		</template>
	</view>
</template>

<script>
export default {
	data() {
		return {
			guideId: '',
			loading: true,
			guide: null,
			portfolioList: [],
			statusBarHeight: 20
		};
	},
	onLoad(options) {
		const sys = uni.getSystemInfoSync();
		this.statusBarHeight = sys.statusBarHeight;

		if (options.id) {
			this.guideId = options.id;
			this.loadData();
		}
	},
	methods: {
		goBack() {
			uni.navigateBack({ delta: 1 });
		},

		getOptimizedImage(url, w, h) {
			if (!url) return '';
			if (url.includes('x-oss-process')) return url;
			return url + `?x-oss-process=image/resize,w_${w}/quality,q_80/format,webp`;
		},

		async loadData() {
			this.loading = true;
			const db = uniCloud.databaseForJQL();

			try {
				const guideRes = await db.collection('b-guide-profiles').doc(this.guideId).get();
				if (guideRes.data && guideRes.data.length > 0) {
					this.guide = guideRes.data[0];
					const userId = this.guide.user_id;
					if (userId) {
						const [portRes, countRes] = await Promise.all([
							// 获取作品集
							db.collection('b-guide-portfolio').where(`user_id == "${userId}"`).orderBy('created_at desc').limit(12).get(),

							db.collection('a-snapshots').where({ 'staves.id': userId }).count()
						]);

						this.portfolioList = portRes.data;
						this.$set(this.guide, 'order_count', countRes.total);
					}
				}
			} catch (e) {
				console.error(e);
			} finally {
				this.loading = false;
			}
		},

		previewImage(url) {
			uni.previewImage({ urls: [url] });
		},

		handleMediaClick(item) {
			// 安全获取 url
			const currentUrl = item.media ? item.media.url : '';
			if (!currentUrl) return;

			if (item.media_type === 'video') {
				uni.previewMedia({
					sources: [
						{
							url: currentUrl,
							type: 'video',
							poster: item.poster || currentUrl + '?x-oss-process=video/snapshot,t_1000'
						}
					],
					current: 0
				});
			} else {
				// 过滤出图片类型的项目
				const images = this.portfolioList.filter((p) => p.media_type !== 'video');
				// 修改点：映射时取 p.media.url
				const urls = images.map((p) => (p.media ? p.media.url : '')).filter((u) => !!u);

				// 找到当前图片在数组中的索引
				let imgIndex = urls.indexOf(currentUrl);
				if (imgIndex < 0) imgIndex = 0;

				uni.previewImage({
					current: imgIndex,
					urls: urls
				});
			}
		},

		handleBook() {
			uni.showToast({ title: '预约功能开发中', icon: 'none' });
		}
	}
};
</script>

<style>
.custom-nav-bar {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	z-index: 100;
	pointer-events: none; /* 让导航栏空白处不阻挡下方图片的交互 */
}

.back-circle-btn {
	pointer-events: auto; /* 恢复按钮的点击交互 */
	margin-left: 16px;
	margin-top: 8px; /* 距离状态栏的一点间距 */
	width: 32px;
	height: 32px;
	background: rgba(0, 0, 0, 0.3); /* 半透明黑底 */
	backdrop-filter: blur(4px); /* 磨砂效果 */
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px solid rgba(255, 255, 255, 0.1); /* 极细的高光边框 */
}

.guide-detail-page {
	background-color: #f8f8f8;
	min-height: 100vh;
}

.detail-header {
	position: relative;
	width: 100%;
	height: 420px;
}
.header-bg-img {
	width: 100%;
	height: 100%;
	position: absolute;
	top: 0;
	left: 0;
	filter: blur(2px) brightness(0.9); /* 减少模糊，更清晰 */
	transform: scale(1.05);
}
.header-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.4));
}

.profile-card-float {
	position: absolute;
	left: 16px;
	right: 16px;
	bottom: -40px;
	/* 背景改为半透明白色 (0.75左右比较合适) */
	background: rgba(255, 255, 255, 0.75);
	/* 添加毛玻璃模糊效果 */
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px); /* 兼容iOS */
	border-radius: 16px;
	padding: 24px;
	/* 调整阴影，使其更柔和 */
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
	/* 添加1px半透明边框，增加玻璃边缘感 */
	border: 1px solid rgba(255, 255, 255, 0.4);
	z-index: 10;
}

.profile-top {
	display: flex;
	align-items: center;
	margin-bottom: 20px;
}
.avatar-circle {
	width: 70px;
	height: 70px;
	border-radius: 50%;
	border: 3px solid white;
	margin-right: 16px;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
.profile-text {
	flex: 1;
}
.name-row {
	display: flex;
	align-items: center;
	margin-bottom: 6px;
}
.real-name {
	font-size: 20px;
	font-weight: bold;
	color: #333;
	margin-right: 8px;
}
.gender-icon {
	width: 16px;
	height: 16px;
}
.tag-row {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}
.tag {
	font-size: 10px;
	padding: 2px 6px;
	background: #f0f0f0;
	color: #666;
	border-radius: 4px;
}
.stats-row {
	display: flex;
	justify-content: space-around;
	align-items: center;
}
.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}
.stat-num {
	font-size: 18px;
	font-weight: bold;
	color: #333;
	margin-bottom: 2px;
}
.stat-label {
	font-size: 11px;
	color: #999;
}
.stat-divider {
	width: 1px;
	height: 20px;
	background: #eee;
}

.detail-content {
	padding-top: 60px;
	padding-left: 16px;
	padding-right: 16px;
}

.section-box {
	background: white;
	border-radius: 12px;
	padding: 20px;
	margin-bottom: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}
.section-box.no-padding {
	padding: 0;
	overflow: hidden;
}

.section-title {
	font-size: 17px;
	font-weight: 600;
	color: #333;
	margin-bottom: 12px;
	position: relative;
	padding-left: 10px;
}
.section-title::before {
	content: '';
	position: absolute;
	left: 0;
	top: 4px;
	bottom: 4px;
	width: 4px;
	background: #ff6b35;
	border-radius: 2px;
}
/* 小标题，用于紧凑版块 */
.section-title-mini {
	font-size: 15px;
	font-weight: 600;
	color: #333;
	margin-bottom: 12px;
}

.section-header-padded {
	padding: 16px 16px 10px;
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.section-header-padded .section-title {
	margin-bottom: 0;
}
.more-text {
	font-size: 12px;
	color: #999;
}
.intro-text {
	font-size: 14px;
	color: #555;
	line-height: 1.7;
	text-align: justify;
}

/* --- 横向滚动的资质认证 --- */
.auth-section {
	padding: 16px; /* 减小内边距 */
}
.auth-scroll {
	width: 100%;
	white-space: nowrap;
}
.auth-row-horizontal {
	display: inline-flex;
	align-items: center;
	gap: 12px;
}
.auth-tag-item {
	display: inline-flex;
	align-items: center;
	padding: 8px 12px;
	border-radius: 8px;
	background: #f5f5f5;
	flex-shrink: 0;
}
.auth-tag-item.gold {
	background: #fffcf0;
	border: 1px solid rgba(184, 134, 11, 0.1);
}
.auth-tag-item.blue {
	background: #f0f8ff;
	border: 1px solid rgba(64, 158, 255, 0.1);
}
.auth-tag-item.green {
	background: #f0f9eb;
	border: 1px solid rgba(7, 193, 96, 0.1);
}
.auth-text {
	font-size: 12px;
	color: #555;
	margin-left: 6px;
	font-weight: 500;
}

/* --- 全宽卡片轮播 --- */
.portfolio-box {
	padding-bottom: 0;
	border-radius: 12px;
	overflow: hidden;
}
.portfolio-swiper {
	height: 420rpx; /* 稍微增加高度 */
}
.pf-swiper-item {
	/* 移除原来的 padding，做全宽 */
	padding: 0;
}
.pf-card.full-width {
	width: 100%;
	height: 100%;
	/* 左上和右上直角，底部跟随 section-box 的圆角(如果swiper填满) 或 自定义 */
	border-radius: 0 0 12px 12px;
	overflow: hidden;
	position: relative;
	background: #f0f0f0;
}
.pf-img {
	width: 100%;
	height: 100%;
}
.play-btn {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 90rpx;
	height: 90rpx;
	background: rgba(0, 0, 0, 0.3);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	backdrop-filter: blur(4px);
	border: 1px solid rgba(255, 255, 255, 0.3);
}
.bottom-gradient {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 80rpx;
	background: linear-gradient(to top, rgba(0, 0, 0, 0.3), transparent);
	pointer-events: none;
}

.pf-card.empty {
	display: flex;
	align-items: center;
	justify-content: center;
	color: #999;
	font-size: 13px;
}

/* 底部操作栏 */
.bottom-action-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: 50px;
	background: white;
	display: flex;
	align-items: center;
	padding: 10px 16px;
	padding-bottom: calc(10px + constant(safe-area-inset-bottom));
	padding-bottom: calc(10px + env(safe-area-inset-bottom));
	box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
	z-index: 100;
}
.action-left {
	display: flex;
	margin-right: 16px;
}
.action-icon-col {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-right: 20px;
	font-size: 10px;
	color: #666;
}
.bar-icon {
	width: 22px;
	height: 22px;
	margin-bottom: 2px;
}
.action-btn {
	flex: 1;
	background: linear-gradient(90deg, #ff8c60, #ff6b35);
	color: white;
	text-align: center;
	height: 40px;
	line-height: 40px;
	border-radius: 20px;
	font-size: 15px;
	font-weight: 600;
	box-shadow: 0 4px 10px rgba(255, 107, 53, 0.3);
}
.action-btn:active {
	opacity: 0.9;
	transform: translateY(1px);
}
.loading-full-screen {
	height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
}
.spinner {
	width: 32px;
	height: 32px;
	border: 3px solid #f3f3f3;
	border-top: 3px solid #ff6b35;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}
@keyframes spin {
	100% {
		transform: rotate(360deg);
	}
}
</style>
