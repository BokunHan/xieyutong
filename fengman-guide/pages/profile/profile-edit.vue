<template>
	<view class="page-container">
		<view class="header-space">
			<view class="status-bar-safe-area" :style="{ height: statusBarHeight + 'px' }"></view>
			<view class="nav-bar">
				<view class="back-btn" @click="goBack">
					<uni-icons type="left" size="24" color="#333"></uni-icons>
				</view>
				<text class="nav-title">编辑资料</text>
				<view class="right-placeholder"></view>
			</view>
		</view>

		<view class="card">
			<view class="card-title-box">
				<view class="vertical-line"></view>
				<text class="card-title">形象设置</text>
			</view>
			<view class="form-item avatar-row">
				<text class="label">个人头像</text>
				<view class="avatar-wrapper" @click="chooseImage('personal_photo')">
					<image :src="formData.personal_photo" mode="aspectFill" class="avatar-img"></image>
					<text class="edit-text">点击修改</text>
				</view>
			</view>
			<view class="form-item avatar-row">
				<text class="label">主页背景图</text>
				<view class="bg-wrapper" @click="chooseImage('background_image')">
					<image :src="formData.background_image || formData.personal_photo" mode="aspectFill" class="bg-img-preview"></image>
					<text class="edit-text">点击修改</text>
				</view>
			</view>
		</view>

		<view class="card">
			<view class="card-title-box">
				<view class="vertical-line"></view>
				<text class="card-title">基本信息</text>
			</view>

			<view class="form-item">
				<text class="label">真实姓名</text>
				<input class="input-box disabled-input" type="text" v-model="formData.real_name" disabled />
			</view>

			<view class="form-row">
				<view class="form-col">
					<text class="label">性别</text>
					<input class="input-box disabled-input" :value="formData.gender === 1 ? '男' : '女'" disabled />
				</view>
				<view class="form-col">
					<text class="label">年龄</text>
					<input class="input-box disabled-input" :value="computedAge + ' 岁'" disabled />
				</view>
			</view>

			<view class="form-row">
				<view class="form-col">
					<text class="label">驾龄</text>
					<input class="input-box disabled-input" :value="computedDrivingYears + ' 年'" disabled />
				</view>
				<view class="form-col">
					<text class="label">性格类型</text>
					<input class="input-box disabled-input" v-model="formData.personality_type" disabled placeholder="未测试" />
				</view>
			</view>

			<view class="form-item">
				<text class="label">手机号码</text>
				<input class="input-box disabled-input" type="number" v-model="formData.mobile" disabled />
			</view>

			<view class="form-item">
				<text class="label">自我介绍</text>
				<textarea class="textarea-box" v-model="formData.introduction" placeholder="简单的介绍一下自己，让游客更了解你..." maxlength="200"></textarea>
			</view>
		</view>

		<view class="card" v-if="vehicleData">
			<view class="card-title-box">
				<view class="vertical-line"></view>
				<text class="card-title">我的车辆</text>
			</view>
			<view class="form-item">
				<text class="label">车牌号码</text>
				<input class="input-box disabled-input" :value="vehicleData.plate_number" disabled />
			</view>
			<view class="form-row">
				<view class="form-col">
					<text class="label">车型</text>
					<input class="input-box disabled-input" :value="vehicleData.model" disabled />
				</view>
				<view class="form-col">
					<text class="label">座位数</text>
					<input class="input-box disabled-input" :value="vehicleData.seat_count" disabled />
				</view>
			</view>
			<view class="upload-grid">
				<view class="upload-item" v-if="vehicleData.car_photo_exterior">
					<text class="upload-label">车辆外观</text>
					<view class="upload-box">
						<image :src="vehicleData.car_photo_exterior" mode="aspectFill" class="uploaded-img" @click="previewImg(vehicleData.car_photo_exterior)"></image>
					</view>
				</view>
				<view class="upload-item" v-if="vehicleData.car_photo_interior">
					<text class="upload-label">车辆内饰</text>
					<view class="upload-box">
						<image :src="vehicleData.car_photo_interior" mode="aspectFill" class="uploaded-img" @click="previewImg(vehicleData.car_photo_interior)"></image>
					</view>
				</view>
			</view>
		</view>

		<view class="card">
			<view class="card-title-box">
				<view class="vertical-line"></view>
				<text class="card-title">证件信息 (不可修改)</text>
			</view>
			<text class="tip-text">如需更新核心证件，请联系客服重新审核</text>

			<view class="upload-grid">
				<view class="upload-item">
					<text class="upload-label">身份证正面</text>
					<view class="upload-box">
						<image v-if="formData.id_card_front" :src="formData.id_card_front" mode="aspectFill" class="uploaded-img" @click="previewImg(formData.id_card_front)"></image>
					</view>
				</view>

				<view class="upload-item">
					<text class="upload-label">身份证反面</text>
					<view class="upload-box">
						<image v-if="formData.id_card_back" :src="formData.id_card_back" mode="aspectFill" class="uploaded-img" @click="previewImg(formData.id_card_back)"></image>
					</view>
				</view>

				<view class="upload-item">
					<text class="upload-label">驾驶证</text>
					<view class="upload-box">
						<image v-if="formData.driver_license" :src="formData.driver_license" mode="aspectFill" class="uploaded-img" @click="previewImg(formData.driver_license)"></image>
					</view>
				</view>

				<view class="upload-item" v-if="vehicleData && vehicleData.vehicle_license">
					<text class="upload-label">行驶证</text>
					<view class="upload-box">
						<image :src="vehicleData.vehicle_license" mode="aspectFill" class="uploaded-img" @click="previewImg(vehicleData.vehicle_license)"></image>
					</view>
				</view>
			</view>
		</view>

		<view style="height: 120rpx"></view>

		<view class="footer-btn-area">
			<button class="submit-btn" @click="submitUpdate" :loading="isSubmitting">保存修改</button>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();

export default {
	data() {
		return {
			statusBarHeight: 0,
			isSubmitting: false,
			docId: '',
			// 车辆数据对象
			vehicleData: null,
			formData: {
				real_name: '',
				gender: 1,
				mobile: '',
				introduction: '',
				id_card_front: '',
				id_card_back: '',
				driver_license: '',
				personal_photo: '',
				background_image: '',
				// 日期字段
				birth_date: '',
				first_issue_date: '',
				personality_type: '' // 性格类型
			}
		};
	},
	onLoad() {
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;
		this.fetchProfileData();
	},
	computed: {
		computedAge() {
			if (!this.formData.birth_date) return '--';
			const year = parseInt(this.formData.birth_date.substring(0, 4));
			const currentYear = new Date().getFullYear();
			return currentYear - year;
		},
		computedDrivingYears() {
			if (!this.formData.first_issue_date) return '--';
			let startYear = 0;
			if (this.formData.first_issue_date.includes('-')) {
				startYear = parseInt(this.formData.first_issue_date.split('-')[0]);
			} else {
				startYear = parseInt(this.formData.first_issue_date.substring(0, 4));
			}
			const currentYear = new Date().getFullYear();
			const diff = currentYear - startYear;
			return diff > 0 ? diff : 0;
		}
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},

		previewImg(url) {
			if (url) uni.previewImage({ urls: [url] });
		},

		async fetchProfileData() {
			uni.showLoading({ title: '加载中' });
			try {
				const res = await db.collection('b-guide-profiles').where('user_id == $cloudEnv_uid').get({ getOne: true });

				if (res.result.data) {
					const data = res.result.data;
					this.docId = data._id;
					this.formData = { ...this.formData, ...data };

					// 【新增】如果有 vehicle_id，查询车辆信息
					if (data.vehicle_id) {
						const vRes = await db.collection('b-vehicle-profiles').doc(data.vehicle_id).get();
						if (vRes.result.data.length > 0) {
							this.vehicleData = vRes.result.data[0];
						}
					}
				} else {
					uni.showToast({ title: '未找到资料', icon: 'none' });
				}
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		},

		// 仅允许上传头像和背景图
		chooseImage(key) {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				success: async (res) => {
					uni.showLoading({ title: '上传中...' });
					const tempFilePath = res.tempFilePaths[0];
					const fileExt = tempFilePath.split('.').pop();
					const fileName = `${Date.now()}_${Math.random().toString(36).substr(2)}.${fileExt}`;

					try {
						const result = await uniCloud.uploadFile({
							filePath: tempFilePath,
							cloudPath: `guide-profile/${fileName}`
						});
						this.formData[key] = result.fileID;
						uni.hideLoading();
					} catch (e) {
						uni.hideLoading();
						uni.showToast({ title: '上传失败', icon: 'none' });
					}
				}
			});
		},

		async submitUpdate() {
			if (!this.docId) return this.msg('数据异常');
			this.isSubmitting = true;
			try {
				// 只更新允许修改的字段
				const updateData = {
					personal_photo: this.formData.personal_photo,
					background_image: this.formData.background_image,
					introduction: this.formData.introduction,
					updated_at: Date.now()
				};

				await db.collection('b-guide-profiles').doc(this.docId).update(updateData);
				uni.showToast({ title: '保存成功', icon: 'success' });
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
			} catch (e) {
				this.msg('保存失败');
			} finally {
				this.isSubmitting = false;
			}
		},
		msg(title) {
			uni.showToast({ title, icon: 'none' });
		}
	}
};
</script>

<style lang="scss" scoped>
/* 页面容器 */
.page-container {
	min-height: 100vh;
	background-color: #f5f7fa;
	padding: 24rpx;
	box-sizing: border-box;
}

.header-space {
	background-color: #f5f7fa;
	position: sticky;
	top: 0;
	z-index: 100;
}

.nav-bar {
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: space-between; /* 两端对齐 */
	padding: 0 10rpx;
}

.back-btn {
	padding: 10rpx;
	width: 60rpx;
}

.right-placeholder {
	width: 60rpx;
}

.nav-title {
	font-size: 34rpx;
	font-weight: bold;
	color: #333;
}

/* 卡片 */
.card {
	background-color: #ffffff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.02);
}

.card-title-box {
	display: flex;
	align-items: center;
	margin-bottom: 30rpx;
}

.vertical-line {
	width: 8rpx;
	height: 32rpx;
	background-color: #eb6d20;
	border-radius: 4rpx;
	margin-right: 16rpx;
}

.card-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

/* 表单项 */
.form-item {
	margin-bottom: 30rpx;
}

.avatar-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.avatar-wrapper {
	display: flex;
	flex-direction: column;
	align-items: flex-end;

	.avatar-img {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		margin-bottom: 8rpx;
		background-color: #eee;
	}

	.edit-text {
		font-size: 22rpx;
		color: #999;
	}
}

.bg-wrapper {
	display: flex;
	flex-direction: column;
	align-items: flex-end;

	.bg-img-preview {
		width: 160rpx;
		height: 90rpx; /* 16:9 比例 */
		border-radius: 8rpx;
		background-color: #eee;
		margin-bottom: 8rpx;
		border: 1px solid #ddd;
	}

	.edit-text {
		font-size: 22rpx;
		color: #999;
	}
}

.label {
	font-size: 28rpx;
	color: #333;
	margin-bottom: 16rpx;
	display: block;
}

.input-box {
	background-color: #f8f9fb;
	height: 88rpx;
	border-radius: 12rpx;
	padding: 0 24rpx;
	font-size: 28rpx;
	color: #333;
	border: 1px solid #eaeaea;
}

.textarea-box {
	background-color: #f8f9fb;
	width: 100%;
	height: 200rpx;
	border-radius: 12rpx;
	padding: 24rpx;
	font-size: 28rpx;
	color: #333;
	border: 1px solid #eaeaea;
	box-sizing: border-box;
}

.disabled-input {
	color: #999;
	background-color: #f0f0f0;
}

/* 性别 */
.gender-box {
	display: flex;
	justify-content: space-between;
}

.gender-item {
	width: 48%;
	height: 88rpx;
	border: 1px solid #eaeaea;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #fff;
	transition: all 0.2s;
}

.gender-item.active {
	border-color: #eb6d20;
	background-color: rgba(235, 109, 32, 0.05);
	color: #eb6d20;
}

.radio-circle {
	width: 32rpx;
	height: 32rpx;
	border-radius: 50%;
	border: 2rpx solid #ccc;
	margin-right: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.gender-item.active .radio-circle {
	border-color: #eb6d20;
}

.radio-inner {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	background-color: #eb6d20;
}

.tip-text {
	font-size: 24rpx;
	color: #999;
	margin-bottom: 24rpx;
	display: block;
}

/* 上传 */
.upload-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}

.upload-item {
	width: 48%;
	margin-bottom: 30rpx;
}

.upload-label {
	font-size: 26rpx;
	color: #333;
	margin-bottom: 12rpx;
	display: block;
}

.upload-box {
	width: 100%;
	height: 200rpx;
	background-color: #f8f9fb;
	border: 2rpx dashed #dcdfe6;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	position: relative;
}

.upload-placeholder {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.upload-text {
	font-size: 24rpx;
	color: #bdc3c7;
	margin-top: 10rpx;
}

.uploaded-img {
	width: 100%;
	height: 100%;
}

/* 底部按钮 */
.footer-btn-area {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #fff;
	padding: 20rpx 40rpx calc(20rpx + env(safe-area-inset-bottom));
	box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
	z-index: 99;
}

.submit-btn {
	background-color: #eb6d20;
	color: #fff;
	border-radius: 50rpx;
	font-size: 32rpx;
	height: 88rpx;
	line-height: 88rpx;
	font-weight: bold;
}

.submit-btn:active {
	opacity: 0.9;
}

.form-row {
	display: flex;
	gap: 20rpx;
	margin-bottom: 30rpx;
}
.form-col {
	flex: 1;
}
</style>
