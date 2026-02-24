<template>
	<view class="page-container">
		<view class="header-space">
			<view class="status-bar-safe-area" :style="{ height: statusBarHeight + 'px' }"></view>
		</view>

		<view class="content">
			<view class="icon-box">
				<view class="loading-ring"></view>
				<uni-icons type="paperplane-filled" size="60" color="#eb6d20" class="inner-icon"></uni-icons>
			</view>

			<view class="text-area">
				<text class="status-title">资料提交成功</text>
				<text class="status-desc">工作人员正在为您审核资料，请耐心等待。</text>
			</view>

			<view class="button-group">
				<button class="btn-refresh" @click="checkIdentity" :loading="isChecking">刷新审核状态</button>
				<button class="btn-logout" @click="handleLogout">退出当前账号</button>
			</view>
		</view>
	</view>
</template>

<script>
const uniIdCo = uniCloud.importObject('uni-id-co');

export default {
	data() {
		return {
			statusBarHeight: 0,
			isChecking: false
		};
	},
	onLoad() {
		this.statusBarHeight = uni.getSystemInfoSync().statusBarHeight;
	},
	methods: {
		// 刷新身份逻辑
		async checkIdentity() {
			this.isChecking = true;
			try {
				// 核心：调用刷新Token接口，同步服务端最新的 role
				const res = await uniIdCo.refreshToken();

				if (res.errCode === 0) {
					const userInfo = uniCloud.getCurrentUserInfo();
					// 检查角色中是否已包含 guide
					if (userInfo.role && userInfo.role.includes('guide')) {
						uni.showToast({ title: '审核已通过！', icon: 'success' });
						setTimeout(() => {
							uni.reLaunch({ url: '/pages/home/home' });
						}, 1500);
					} else {
						uni.showToast({ title: '仍处于审核中...', icon: 'none' });
					}
				}
			} catch (e) {
				uni.showToast({ title: '状态同步失败', icon: 'none' });
			} finally {
				this.isChecking = false;
			}
		},

		handleLogout() {
			uni.showModal({
				title: '提示',
				content: '确认退出当前账号吗？',
				success: (res) => {
					if (res.confirm) {
						uniIdCo.logout();
						uni.reLaunch({ url: '/pages/login/login' });
					}
				}
			});
		}
	}
};
</script>

<style lang="scss" scoped>
.page-container {
	min-height: 100vh;
	background-color: #ffffff;
}

.header-space {
	background-color: #ffffff;
	position: sticky;
	top: 0;
	z-index: 100;
	.nav-bar {
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		.nav-title {
			font-size: 34rpx;
			font-weight: bold;
			color: #333;
		}
	}
}

.content {
	padding: 360rpx 60rpx 0;
	display: flex;
	flex-direction: column;
	align-items: center;
}

/* 状态图标动画 */
.icon-box {
	position: relative;
	width: 200rpx;
	height: 200rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 60rpx;

	.loading-ring {
		position: absolute;
		width: 100%;
		height: 100%;
		border: 6rpx solid #f5f7fa;
		border-top: 6rpx solid #eb6d20;
		border-radius: 50%;
		animation: rotate 2s linear infinite;
	}
}

@keyframes rotate {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.text-area {
	text-align: center;
	margin-bottom: 100rpx;

	.status-title {
		font-size: 40rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 24rpx;
	}

	.status-desc {
		font-size: 28rpx;
		color: #999;
		line-height: 1.6;
	}
}

.button-group {
	width: 100%;

	button {
		width: 100%;
		height: 90rpx;
		line-height: 90rpx;
		border-radius: 45rpx;
		font-size: 32rpx;
		margin-bottom: 30rpx;
		border: none;

		&::after {
			border: none;
		}
	}

	.btn-refresh {
		background-color: #eb6d20;
		color: #ffffff;
		font-weight: bold;
		box-shadow: 0 10rpx 20rpx rgba(235, 109, 32, 0.2);
	}

	.btn-logout {
		background-color: #f8f9fb;
		color: #666;
	}
}
</style>
