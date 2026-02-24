<template>
	<view class="page-container">
		<view class="bg-decoration"></view>

		<view class="card fade-in-up">
			<image src="/static/logo.jpg" class="logo" mode="aspectFit"></image>
			<view class="title">加入行程</view>
			<view class="subtitle">绑定后，您可以查看详细行程并共享相册</view>

			<view v-if="loading" class="status-box">
				<view class="spinner"></view>
				<text class="status-text">正在处理...</text>
			</view>

			<view v-else class="content-box">
				<view v-if="success" class="status-box">
					<icon type="success" size="64" color="#10b981" />
					<view class="success-text">绑定成功</view>
				</view>

				<view v-else-if="error" class="status-box">
					<icon type="warn" size="64" color="#ef4444" />
					<view class="error-text">{{ error }}</view>
				</view>

				<view class="btn-group">
					<button v-if="!success && !hasBound" class="btn btn-primary shadow-lg" @click="confirmBind">确 认 加 入</button>

					<view v-if="success || hasBound" class="link-btn" @click="goItinerary">
						<text>查看行程</text>
						<text class="arrow">→</text>
					</view>

					<view v-if="!success && !hasBound" class="link-btn secondary" @click="goHome">暂不加入，去首页</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
const orderService = uniCloud.importObject('a-order-service');

export default {
	data() {
		return {
			orderId: '',
			loading: true, // 默认显示加载中
			success: false,
			hasBound: false,
			error: '',
			debugMsg: 'Init...'
		};
	},
	async onLoad(options) {
		console.log('【Debug】页面加载 onLoad:', options);

		// 1. 解析参数 (兼容 URLSearchParams 不可用的情况)
		if (options.scene) {
			const scene = decodeURIComponent(options.scene);
			const parts = scene.split('&');
			for (let i = 0; i < parts.length; i++) {
				const pair = parts[i].split('=');
				if (pair[0] === 'oid') {
					this.orderId = pair[1];
					break;
				}
			}
		} else if (options.orderId) {
			this.orderId = options.orderId;
		}

		console.log('【Debug】获取到的 orderId:', this.orderId);

		if (!this.orderId) {
			this.loading = false;
			this.error = '二维码无效或已过期';
			return;
		}

		// 2. 检查登录状态
		const token = uni.getStorageSync('uni_id_token');
		const tokenExpired = uni.getStorageSync('uni_id_token_expired');
		const now = Date.now();

		// 如果未登录或 Token 过期，跳转登录
		if (!token || tokenExpired <= now) {
			console.log('【Debug】未登录，跳转 Login');
			setTimeout(() => {
				uni.redirectTo({
					url: `/pages/login/login?redirect=bind&orderId=${this.orderId}`
				});
			}, 200);
			return;
		}

		// 3. 已登录，自动执行绑定
		console.log('【Debug】已登录，开始自动绑定...');
		await this.executeBind();
	},
	methods: {
		log(tag, msg = '') {
			console.log(`[BindPage] ${tag}`, msg);
			// 如果需要看屏幕调试，取消下面这行的注释
			// this.debugMsg = `${tag} ${JSON.stringify(msg)}`;
		},

		async executeBind() {
			this.loading = true;
			this.error = '';

			try {
				const res = await orderService.bindUserToOrder(this.orderId);
				console.log('【Debug】绑定结果:', res);

				if (res.errCode === 0) {
					this.success = true;
					uni.removeStorageSync('current_itinerary');
					uni.showToast({ title: '绑定成功', icon: 'success' });
					// 延迟跳转，让用户看清成功提示
					setTimeout(() => {
						this.goItinerary();
					}, 5000);
				} else {
					this.error = res.errMsg || '绑定失败';
				}
			} catch (e) {
				console.error('【Debug】绑定异常:', e);
				this.error = '网络请求失败，请稍后重试';
			} finally {
				this.loading = false; // 无论成功失败，必须结束加载状态
			}
		},
		confirmBind() {
			this.executeBind();
		},
		goItinerary() {
			uni.switchTab({ url: '/pages/itinerary/itinerary' });
		},
		goHome() {
			uni.switchTab({ url: '/pages/home/home' });
		}
	}
};
</script>

<style>
/* 页面容器：全屏灰色背景，垂直居中 */
.page-container {
	min-height: 100vh;
	background-color: #f8f9fa;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: calc(env(safe-area-inset-top) + 240rpx);
	box-sizing: border-box;
	position: relative;
}

/* 卡片样式 */
.card {
	position: relative;
	z-index: 1;
	background-color: #ffffff;
	width: 620rpx;
	padding: 80rpx 50rpx;
	border-radius: 32rpx;
	box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.06);
	display: flex;
	flex-direction: column;
	align-items: center;
}

.fade-in-up {
	animation: fadeInUp 0.6s ease-out;
}
@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(40rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.logo {
	width: 172rpx;
	height: 140rpx;
	border-radius: 50%;
	margin-bottom: 40rpx;
}

.title {
	font-size: 40rpx;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 16rpx;
	letter-spacing: 2rpx;
}

.subtitle {
	font-size: 28rpx;
	color: #9ca3af;
	margin-bottom: 60rpx;
	text-align: center;
	line-height: 1.5;
}

.status-box {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 40rpx;
}

/* 原生 CSS 加载动画 */
.spinner {
	width: 60rpx;
	height: 60rpx;
	border: 5rpx solid #eb6d20;
	border-top-color: transparent;
	border-radius: 50%;
	animation: rotate 0.8s linear infinite;
	margin-bottom: 30rpx;
}
@keyframes rotate {
	to {
		transform: rotate(360deg);
	}
}

.status-text {
	color: #6b7280;
	font-size: 28rpx;
}
.success-text {
	font-size: 36rpx;
	color: #10b981;
	margin-top: 30rpx;
	font-weight: 600;
}
.error-text {
	font-size: 30rpx;
	color: #ef4444;
	margin-top: 30rpx;
	text-align: center;
}

.content-box {
	width: 100%;
}
.btn-group {
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.btn {
	width: 100%;
	height: 96rpx;
	line-height: 96rpx;
	text-align: center;
	border-radius: 18rpx;
	font-size: 36rpx;
	font-weight: 700;
	border: none;
	margin-top: 20rpx;
}
.btn::after {
	border: none;
}

.btn-primary {
	background: #eb6d20;
	color: #000;
	box-shadow: 0 8rpx 20rpx rgba(235, 109, 32, 0.3);
}
.btn-primary:active {
	opacity: 0.9;
	transform: scale(0.98);
}

.link-btn {
	margin-top: 40rpx;
	padding: 20rpx 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #4b5563;
	font-size: 30rpx;
}
.link-btn .arrow {
	margin-left: 8rpx;
	transition: transform 0.2s;
}
.link-btn:active {
	opacity: 0.6;
}
.link-btn:active .arrow {
	transform: translateX(6rpx);
}

.link-btn.secondary {
	margin-top: 20rpx;
	font-size: 28rpx;
	color: #9ca3af;
}
</style>
