<template>
	<view v-if="visible" class="modal-mask" catchtouchmove="preventTouchMove">
		<view class="modal-dialog">
			<view class="modal-content">
				<!-- <view class="modal-close" @click="closeModal(false)">
					<text class="fas fa-times"></text>
				</view> -->

				<view class="modal-title">完善信息</view>
				<view class="modal-subtitle">请提供头像和昵称以完成注册</view>

				<button class="avatar-wrapper" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
					<image class="avatar-image" :src="avatarUrl"></image>
					<view v-if="!avatarUrl" class="avatar-plus-icon">+</view>
				</button>

				<input class="nickname-input" type="nickname" placeholder="请输入昵称" v-model="nickName" />

				<button class="modal-login-button" @click="submitUserInfo" :disabled="!avatarUrl || !nickName || loading">
					<text v-if="!loading" class="login-button-text">提交信息</text>
					<text v-else class="login-button-text">提交中...</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		visible: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			nickName: '',
			avatarUrl: '',
			avatarCloudPath: '',
			loading: false
		};
	},
	methods: {
		async onChooseAvatar(e) {
			const tempFilePath = e.detail.avatarUrl;
			if (!tempFilePath) return;

			uni.showLoading({ title: '头像上传中...', mask: true });
			try {
				this.avatarCloudPath = 'user/avatar/' + Date.now() + '-' + Math.round(Math.random() * 10000) + '.jpeg';
				const uploadResult = await uniCloud.uploadFile({
					filePath: tempFilePath,
					cloudPath: this.avatarCloudPath
				});
				this.avatarUrl = uploadResult.fileID;
				uni.hideLoading();
			} catch (err) {
				console.error('头像上传失败:', err);
				uni.hideLoading();
				uni.showToast({ title: '头像上传失败', icon: 'none' });
			}
		},

		async submitUserInfo() {
			if (this.loading) return;
			this.loading = true;
			uni.showLoading({ title: '正在提交...' });

			try {
				const uniIdCo = uniCloud.importObject('utils');
				const res = await uniIdCo.updateUserInfo({
					nickname: this.nickName,
					avatar: this.avatarUrl,
					avatarCloudPath: this.avatarCloudPath
				});

				if (res.errCode !== 0) {
					throw new Error(res.errMsg || '更新失败');
				}

				uni.setStorageSync('userInfoComplete', true);
				uni.hideLoading();
				uni.showToast({ title: '更新成功！', icon: 'success' });
				this.loading = false;
				this.closeModal(true);
			} catch (error) {
				uni.hideLoading();
				this.loading = false;
				uni.showToast({ title: error.message || '更新失败', icon: 'none' });
			}
		},

		closeModal(isSuccess) {
			if (this.loading) return;
			this.nickName = '';
			this.avatarUrl = '';
			this.avatarCloudPath = '';
			this.loading = false;
			this.$emit('close', { success: isSuccess });
		}
	}
};
</script>

<style scoped>
.modal-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 998;
}

.modal-dialog {
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background-color: #ffffff;
	border-radius: 12px;
	z-index: 999;
	width: 85vw;
	max-width: 320px;
}

.modal-content {
	padding: 45px 30px 30px 30px;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	position: relative;
}
.modal-close {
	position: absolute;
	top: 15px;
	right: 15px;
	font-size: 18px;
	color: #999;
	cursor: pointer;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.modal-title {
	font-size: 18px;
	font-weight: 600;
	color: #333;
	margin-bottom: 5px;
}
.modal-subtitle {
	font-size: 14px;
	color: #666;
	margin-bottom: 25px;
}

.avatar-wrapper {
	width: 90px;
	height: 90px;
	border-radius: 50%;
	background-color: #f4f4f5;
	padding: 0;
	border: 2px dashed #d1d5db;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	margin-bottom: 25px;
}
.avatar-image {
	width: 100%;
	height: 100%;
	border-radius: 50%;
}

.avatar-plus-icon {
	position: absolute;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;

	font-size: 60px;
	font-weight: 100;
	color: rgba(156, 163, 175, 0.4);
}

.nickname-input {
	width: 100%;
	border: 1px solid #e5e7eb;
	background-color: #f9fafb;
	border-radius: 8px;
	padding: 12px 15px;
	font-size: 15px;
	height: auto;
	text-align: center;
	box-sizing: border-box;
}

.modal-login-button {
	background-color: #eb6d20;
	color: #000;
	border-radius: 8px;
	width: 100%;
	font-size: 16px;
	font-weight: 700;
	margin-top: 25px;
}
.modal-login-button .login-button-text {
	letter-spacing: 2px;
}
.modal-login-button[disabled] {
	background-color: #f7d8c6;
	color: #999;
	opacity: 1;
}
</style>
