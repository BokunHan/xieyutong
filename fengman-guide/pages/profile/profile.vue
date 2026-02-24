<template>
	<view class="container">
		<view class="header-section">
			<image class="header-bg" :src="headerBgUrl" mode="aspectFill"></image>
			<view class="header-mask"></view>
			<view class="nav-bar-placeholder" :style="{ height: statusBarHeight + 'px' }"></view>

			<view class="user-info-row">
				<image class="avatar w-full h-full" :src="profile.personal_photo" mode="aspectFill"></image>
				<view class="info-content">
					<view class="name-row">
						<text class="name">{{ profile.real_name || '未认证私导' }}</text>
					</view>

					<view class="badge-row">
						<view class="cert-badge">
							<uni-icons type="vip-filled" color="#6d4c00" size="16"></uni-icons>
							<text class="cert-text">认证私导</text>
						</view>
					</view>
					<!-- <view class="tags-row">
						<view class="tag" v-if="profile.tags && profile.tags.length > 0">{{ profile.tags[0] }}</view>
						<view class="rating">
							<uni-icons type="star-filled" color="#FFF" size="12"></uni-icons>
							<text class="score">{{ profile.rating || 5.0 }} ({{ profile.order_count || 0 }}单)</text>
						</view>
					</view> -->
				</view>
				<view class="settings-btn" @click="goToSettings">
					<uni-icons type="right" color="#FFF" size="26"></uni-icons>
				</view>
			</view>
		</view>

		<view class="card-container">
			<view class="card">
				<view class="card-header">
					<text class="card-title">自我介绍</text>
				</view>
				<view class="card-body">
					<text class="intro-text">
						{{ profile.introduction || '暂无自我介绍，请点击右上角设置完善资料。' }}
					</text>
				</view>
			</view>

			<view class="card auth-card">
				<view class="card-header">
					<text class="card-title">我的认证</text>
				</view>
				<scroll-view scroll-x class="auth-scroll" :show-scrollbar="false">
					<view class="auth-row-horizontal">
						<view class="auth-item-chip" :class="{ active: isRealNameVerified }">
							<uni-icons type="person-filled" :color="isRealNameVerified ? '#07c160' : '#ccc'" size="16"></uni-icons>
							<text class="auth-text">实名认证</text>
						</view>
						<view class="auth-item-chip" :class="{ active: hasDriverLicense }">
							<uni-icons type="map-filled" :color="hasDriverLicense ? '#409EFF' : '#ccc'" size="16"></uni-icons>
							<text class="auth-text">驾驶证</text>
						</view>
						<view style="width: 1rpx; flex-shrink: 0"></view>
					</view>
				</scroll-view>
			</view>

			<view class="card no-padding">
				<view class="card-header padded">
					<text class="card-title">精彩瞬间</text>
					<text class="manage-link" @click="managePortfolio">管理</text>
				</view>

				<swiper class="portfolio-swiper" :indicator-dots="false" :autoplay="true" :interval="4000" :circular="true" previous-margin="0" next-margin="0">
					<swiper-item v-for="(item, index) in portfolioList" :key="item._id">
						<view class="pf-card full-width" @click="managePortfolio">
							<template v-if="item.media_type === 'video'">
								<image :src="item.poster || item.media.url + '?x-oss-process=video/snapshot,t_1000'" mode="aspectFill" class="pf-img"></image>
								<view class="play-btn">
									<uni-icons type="videocam-filled" color="rgba(255,255,255,0.5)" size="30"></uni-icons>
								</view>
							</template>
							<template v-else>
								<image :src="item.media.url" mode="aspectFill" class="pf-img"></image>
							</template>
							<view class="bottom-gradient"></view>
						</view>
					</swiper-item>

					<swiper-item v-if="portfolioList.length === 0">
						<view class="pf-card empty full-width" @click="managePortfolio">
							<uni-icons type="plusempty" color="#ccc" size="30"></uni-icons>
							<text class="empty-text">点击添加作品</text>
						</view>
					</swiper-item>
				</swiper>
			</view>

			<view class="logout-btn" @click="handleLogout">
				<text>退出登录</text>
			</view>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const guideService = uniCloud.importObject('b-guide-service');

export default {
	data() {
		return {
			statusBarHeight: 0,
			profile: {},
			portfolioList: []
		};
	},
	computed: {
		isRealNameVerified() {
			return this.profile.real_name && this.profile.id_card_front;
		},
		hasDriverLicense() {
			return !!this.profile.driver_license;
		},
		headerBgUrl() {
			if (this.profile.background_image) return this.profile.background_image;
			if (this.profile.personal_photo) return this.profile.personal_photo;
			return '/static/default-bg.jpg';
		}
	},
	onLoad() {
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;
	},
	onShow() {
		this.fetchProfile();
		this.fetchPortfolio();
	},
	methods: {
		async fetchProfile() {
			try {
				const res = await db.collection('b-guide-profiles').where('user_id == $cloudEnv_uid').get({ getOne: true });
				if (res.result.data) this.profile = res.result.data;
			} catch (e) {
				console.error(e);
			}
		},
		async fetchPortfolio() {
			try {
				const res = await guideService.getPortfolio();
				if (res.code === 0) this.portfolioList = res.data;
			} catch (e) {
				console.error(e);
			}
		},
		goToSettings() {
			uni.navigateTo({ url: '/pages/profile/profile-edit' });
		},
		managePortfolio() {
			uni.navigateTo({ url: '/pages/profile/portfolio' });
		},
		handleLogout() {
			uni.showModal({
				title: '提示',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						uni.removeStorageSync('uni_id_token');
						uni.removeStorageSync('uni_id_token_expired');
						uni.reLaunch({ url: '/pages/login/login' });
					}
				}
			});
		}
	}
};
</script>

<style lang="scss" scoped>
$bg-gray: #f5f7fa;

.container {
	min-height: 100vh;
	background-color: $bg-gray;
}

.header-section {
	position: relative;
	width: 100%;
	box-sizing: border-box;
	height: 420rpx; /* 保持较高的高度 */
	overflow: hidden;
	padding: 0 40rpx;
	display: flex;
	flex-direction: column;
	padding-bottom: 120rpx;

	.header-bg {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		filter: blur(5px);
		transform: scale(1.05);
	}
	.header-mask {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.3);
		z-index: 1;
	}
	.nav-bar-placeholder,
	.user-info-row {
		position: relative;
		z-index: 2;
	}

	.user-info-row {
		display: flex;
		align-items: center;
		margin-top: auto;
		.avatar {
			width: 120rpx;
			height: 120rpx;
			border-radius: 50%;
			border: 4rpx solid rgba(255, 255, 255, 0.5);
			margin-right: 30rpx;
		}
		.info-content {
			flex: 1;
			.name-row {
				display: flex;
				align-items: center;
				margin-bottom: 10rpx;
				.name {
					font-size: 36rpx;
					font-weight: bold;
					color: #fff;
					margin-right: 10rpx;
					text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
				}
			}
			.badge-row {
				display: flex;
				.cert-badge {
					display: flex;
					align-items: center;
					background: #ffb000;
					padding: 4rpx 12rpx;
					border-radius: 30rpx;

					.cert-text {
						font-size: 20rpx;
						color: #6d4c00;
						font-weight: bold;
						margin-left: 6rpx;
					}
				}
			}
		}
		.settings-btn {
			opacity: 0.9;
		}
	}
}

/* 1. 整体内容向上调整 */
.card-container {
	padding: 0 30rpx 40rpx;
	margin-top: -80rpx;
	position: relative;
	z-index: 10;
	padding-bottom: 40rpx;
}

.card {
	background-color: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);

	&.no-padding {
		padding: 0;
		overflow: hidden;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
		&.padded {
			padding: 30rpx 30rpx 20rpx;
			margin-bottom: 0;
		}
		.card-title {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
		}
		.manage-link {
			font-size: 26rpx;
			color: #999;
		}
	}
}

.intro-text {
	font-size: 28rpx;
	color: #666;
	line-height: 1.6;
}

/* 2. 认证部分改为横向 */
.auth-scroll {
	width: 100%;
	white-space: nowrap;
}
.auth-row-horizontal {
	display: inline-flex;
	align-items: center;
	gap: 16rpx;
}
.auth-item-chip {
	display: inline-flex;
	align-items: center;
	padding: 12rpx 20rpx;
	border-radius: 50rpx;
	background: #f8f8f8;
	color: #999;
	flex-shrink: 0;

	&.active {
		background: #ecf5ff;
		color: #409eff;
		/* 简单区分颜色 */
	}
	.auth-text {
		font-size: 24rpx;
		margin-left: 8rpx;
	}
}

/* 3. 轮播图样式 */
.portfolio-swiper {
	height: 400rpx;
}
.pf-card.full-width {
	width: 100%;
	height: 100%;
	border-radius: 0 0 20rpx 20rpx; /* 下方圆角跟随卡片 */
	overflow: hidden;
	position: relative;
	background: #eee;
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
	width: 80rpx;
	height: 80rpx;
	background: rgba(0, 0, 0, 0.3);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px solid rgba(255, 255, 255, 0.4);
}
.pf-card.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: #fafafa;
	.empty-text {
		font-size: 26rpx;
		color: #999;
		margin-top: 10rpx;
	}
}
.bottom-gradient {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 60rpx;
	background: linear-gradient(to top, rgba(0, 0, 0, 0.2), transparent);
}

.logout-btn {
	margin-top: 40rpx;
	background-color: #fff;
	height: 90rpx;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #ff4d4f;
	font-size: 32rpx;
	font-weight: bold;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	&:active {
		background-color: #f9f9f9;
		opacity: 0.8;
	}
}
</style>
