<template>
	<view class="page-container">
		<view class="header-space">
			<view class="status-bar-safe-area" :style="{ height: statusBarHeight + 'px' }"></view>
			<view class="nav-bar">
				<text class="nav-title">私导注册</text>
			</view>
		</view>

		<view class="card">
			<view class="card-title-box">
				<view class="vertical-line"></view>
				<text class="card-title">身份认证</text>
			</view>

			<text class="section-subtitle">请上传身份证正反面，系统将自动识别信息</text>
			<view class="upload-grid">
				<view class="upload-item" @click="chooseAndOcr('id_card_front')">
					<view class="upload-box">
						<image v-if="formData.id_card_front" :src="formData.id_card_front" mode="aspectFill" class="uploaded-img"></image>
						<view v-else class="upload-placeholder">
							<uni-icons type="camera-filled" size="32" color="#eb6d20"></uni-icons>
							<text class="upload-text">身份证正面 (OCR)</text>
						</view>
					</view>
				</view>
				<view class="upload-item" @click="chooseImage('id_card_back')">
					<view class="upload-box">
						<image v-if="formData.id_card_back" :src="formData.id_card_back" mode="aspectFill" class="uploaded-img"></image>
						<view v-else class="upload-placeholder">
							<uni-icons type="camera-filled" size="32" color="#BDC3C7"></uni-icons>
							<text class="upload-text">身份证反面</text>
						</view>
					</view>
				</view>
			</view>

			<view class="form-group" v-if="formData.id_card_front">
				<view class="form-item">
					<text class="label">真实姓名</text>
					<input class="input-box" type="text" v-model="formData.real_name" placeholder="自动识别" />
				</view>

				<view class="form-row">
					<view class="form-col">
						<text class="label">身份证号</text>
						<input class="input-box disabled-input" v-model="formData.id_card_number" placeholder="自动识别" />
					</view>
				</view>

				<view class="form-row">
					<view class="form-col">
						<text class="label">性别</text>
						<input class="input-box disabled-input" :value="formData.gender === 1 ? '男' : '女'" placeholder="自动识别" />
					</view>
					<view class="form-col">
						<text class="label">年龄</text>
						<input class="input-box disabled-input" :value="computedAge + ' 岁'" placeholder="自动计算" />
					</view>
				</view>
			</view>
			<view class="form-item" style="margin-top: 20rpx">
				<text class="label">联系电话</text>
				<input class="input-box disabled-input" type="number" v-model="formData.mobile" disabled />
			</view>
		</view>

		<view class="card">
			<view class="card-title-box">
				<view class="vertical-line"></view>
				<text class="card-title">结算信息</text>
			</view>
			<text class="section-subtitle">请上传银行卡正面，系统将自动识别信息</text>

			<view class="upload-grid">
				<view class="upload-item full-width" @click="chooseAndOcr('bank_card')">
					<view class="upload-box wide-box">
						<image v-if="formData.bank_card_img" :src="formData.bank_card_img" mode="aspectFill" class="uploaded-img"></image>
						<view v-else class="upload-placeholder">
							<uni-icons type="camera-filled" size="32" color="#eb6d20"></uni-icons>
							<text class="upload-text">点击上传银行卡 (OCR)</text>
						</view>
					</view>
				</view>
			</view>

			<view class="form-group">
				<view class="form-item">
					<text class="label">银行卡号</text>
					<input class="input-box" type="number" v-model="formData.bank_card_number" placeholder="自动识别或手动输入" />
				</view>
				<view class="form-row">
					<view class="form-col" style="flex: 2; margin-right: 20rpx">
						<view class="flex">
							<text class="label">开户行</text>
							<text class="label note">（请手动补全支行名称）</text>
						</view>
						<input class="input-box" type="text" v-model="formData.branch_name" placeholder="例如：招商银行城南支行" />
					</view>
					<view class="form-col" style="flex: 1">
						<text class="label">有效期</text>
						<input class="input-box" type="text" v-model="formData.bank_expire_date" placeholder="例如: 09/28" />
					</view>
				</view>
			</view>

			<view class="form-group">
				<view class="form-item" style="margin-top: 24rpx">
					<text class="label">支付宝账号</text>
					<input class="input-box" type="text" v-model="formData.alipay_account" placeholder="请输入支付宝账号" />
				</view>
			</view>
		</view>

		<view class="card">
			<view class="card-title-box">
				<view class="vertical-line"></view>
				<text class="card-title">紧急联系人</text>
			</view>
			<view class="form-group" style="margin-top: 10rpx">
				<view class="form-row">
					<view class="form-col">
						<text class="label">联系人姓名</text>
						<input class="input-box" type="text" v-model="formData.emergency_name" placeholder="请输入姓名" />
					</view>
					<view class="form-col">
						<text class="label">联系电话</text>
						<input class="input-box" type="number" maxlength="11" v-model="formData.emergency_mobile" placeholder="请输入手机号" />
					</view>
				</view>
			</view>
		</view>

		<view class="card">
			<view class="card-title-box">
				<view class="vertical-line"></view>
				<text class="card-title">驾驶资质</text>
			</view>

			<text class="section-subtitle">请上传驾驶证主页，系统将自动识别信息</text>
			<view class="upload-grid">
				<view class="upload-item full-width" @click="chooseAndOcr('driver_license')">
					<view class="upload-box wide-box">
						<image v-if="formData.driver_license" :src="formData.driver_license" mode="aspectFill" class="uploaded-img"></image>
						<view v-else class="upload-placeholder">
							<uni-icons type="camera-filled" size="32" color="#eb6d20"></uni-icons>
							<text class="upload-text">点击上传驾驶证 (OCR)</text>
						</view>
					</view>
				</view>
			</view>

			<view class="form-group" v-if="formData.driver_license">
				<view class="form-row">
					<view class="form-col">
						<text class="label">实际驾龄</text>
						<input class="input-box disabled-input" :value="computedDrivingYears + ' 年'" placeholder="自动计算" />
					</view>
					<view class="form-col">
						<text class="label">有效期至</text>
						<input class="input-box disabled-input" v-model="formData.license_valid_date" placeholder="自动识别" />
					</view>
				</view>
			</view>
		</view>

		<view class="card">
			<view class="card-title-box">
				<view class="vertical-line"></view>
				<text class="card-title">车辆情况</text>
			</view>

			<view class="form-item switch-item">
				<text class="label">是否自带车辆</text>
				<switch color="#eb6d20" :checked="formData.has_car" @change="onHasCarChange" />
			</view>

			<view v-if="formData.has_car" class="car-section">
				<view class="divider"></view>
				<text class="section-subtitle">请上传行驶证左右内页，自动识别车辆信息</text>
				<view class="upload-grid">
					<view class="upload-item full-width" @click="chooseAndOcr('vehicle_license')">
						<view class="upload-box wide-box">
							<image v-if="formData.car_info.vehicle_license" :src="formData.car_info.vehicle_license" mode="aspectFill" class="uploaded-img"></image>
							<view v-else class="upload-placeholder">
								<uni-icons type="scan" size="32" color="#eb6d20"></uni-icons>
								<text class="upload-text">点击上传行驶证 (OCR)</text>
							</view>
						</view>
					</view>
				</view>

				<view class="form-group">
					<view class="form-item">
						<text class="label">车牌号码</text>
						<input class="input-box" type="text" v-model="formData.car_info.plate_number" placeholder="自动识别或手动输入" />
					</view>
					<view class="form-row">
						<view class="form-col">
							<text class="label">车辆类型</text>
							<input class="input-box" type="text" v-model="formData.car_info.model" placeholder="车辆类型" />
						</view>
						<view class="form-col">
							<text class="label">核定载人</text>
							<input class="input-box" type="number" v-model="formData.car_info.seat_count" placeholder="座位数" />
						</view>
					</view>
				</view>

				<text class="section-subtitle" style="margin-top: 30rpx">补充车辆实拍照片</text>
				<view class="upload-grid">
					<view class="upload-item" @click="chooseImage('car_photo_exterior', true)">
						<view class="upload-box">
							<image v-if="formData.car_info.car_photo_exterior" :src="formData.car_info.car_photo_exterior" mode="aspectFill" class="uploaded-img"></image>
							<view v-else class="upload-placeholder">
								<uni-icons type="image" size="28" color="#BDC3C7"></uni-icons>
								<text class="upload-text">车辆外观</text>
							</view>
						</view>
					</view>
					<view class="upload-item" @click="chooseImage('car_photo_interior', true)">
						<view class="upload-box">
							<image v-if="formData.car_info.car_photo_interior" :src="formData.car_info.car_photo_interior" mode="aspectFill" class="uploaded-img"></image>
							<view v-else class="upload-placeholder">
								<uni-icons type="image" size="28" color="#BDC3C7"></uni-icons>
								<text class="upload-text">车辆内饰</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="card">
			<view class="card-title-box">
				<view class="vertical-line"></view>
				<text class="card-title">拍摄设备</text>
			</view>
			<text class="section-subtitle">请勾选您自备的专业拍摄设备（可多选）</text>

			<view class="equip-group">
				<view class="equip-item" :class="{ active: formData.equipment.includes('drone') }" @click="toggleEquipment('drone')">
					<uni-icons type="paperplane" size="24" :color="formData.equipment.includes('drone') ? '#eb6d20' : '#999'"></uni-icons>
					<text class="equip-text">无人机</text>
					<uni-icons v-if="formData.equipment.includes('drone')" type="checkmarkempty" size="16" color="#eb6d20" class="check-icon"></uni-icons>
				</view>

				<view class="equip-item" :class="{ active: formData.equipment.includes('dslr') }" @click="toggleEquipment('dslr')">
					<uni-icons type="camera" size="24" :color="formData.equipment.includes('dslr') ? '#eb6d20' : '#999'"></uni-icons>
					<text class="equip-text">单反/微单</text>
					<uni-icons v-if="formData.equipment.includes('dslr')" type="checkmarkempty" size="16" color="#eb6d20" class="check-icon"></uni-icons>
				</view>

				<view class="equip-item" :class="{ active: formData.equipment.includes('pocket') }" @click="toggleEquipment('pocket')">
					<uni-icons type="videocam" size="24" :color="formData.equipment.includes('pocket') ? '#eb6d20' : '#999'"></uni-icons>
					<text class="equip-text">口袋相机</text>
					<uni-icons v-if="formData.equipment.includes('pocket')" type="checkmarkempty" size="16" color="#eb6d20" class="check-icon"></uni-icons>
				</view>
			</view>
		</view>

		<view class="card">
			<view class="card-title-box">
				<view class="vertical-line"></view>
				<text class="card-title">个人形象</text>
			</view>
			<view class="upload-grid centered-grid">
				<view class="upload-item" @click="chooseImage('personal_photo')">
					<text class="label" style="text-align: center; margin-bottom: 10rpx">个人形象照 (必填)</text>
					<view class="upload-box portrait-box">
						<image v-if="formData.personal_photo" :src="formData.personal_photo" mode="aspectFill" class="uploaded-img"></image>
						<view v-else class="upload-placeholder">
							<uni-icons type="person-filled" size="40" color="#BDC3C7"></uni-icons>
							<text class="upload-text">点击上传形象照</text>
						</view>
					</view>
				</view>

				<view class="upload-item" @click="chooseImage('background_image')">
					<text class="label" style="text-align: center; margin-bottom: 10rpx">主页背景图 (选填)</text>
					<view class="upload-box portrait-box">
						<image v-if="formData.background_image" :src="formData.background_image" mode="aspectFill" class="uploaded-img"></image>
						<view v-else class="upload-placeholder">
							<uni-icons type="image" size="40" color="#BDC3C7"></uni-icons>
							<text class="upload-text">点击上传背景图</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view style="height: 140rpx"></view>

		<view class="footer-btn-area">
			<button class="submit-btn" @click="submitForm" :loading="isSubmitting">提交审核</button>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const guideObj = uniCloud.importObject('b-guide-service', { customUI: true });

export default {
	data() {
		return {
			statusBarHeight: 0,
			isSubmitting: false,
			userId: '',
			formData: {
				real_name: '',
				gender: 1,
				mobile: '',
				id_card_front: '',
				id_card_back: '',
				id_card_number: '',
				birth_date: '',

				// 结算信息
				bank_card_img: '',
				bank_card_number: '',
				branch_name: '',
				bank_expire_date: '',
				alipay_account: '',

				// 紧急联系人
				emergency_name: '',
				emergency_mobile: '',

				driver_license: '',
				first_issue_date: '',
				license_valid_date: '',

				personal_photo: '',
				background_image: '',

				has_car: false,
				car_info: {
					plate_number: '',
					model: '',
					seat_count: null,
					vehicle_license: '',
					car_photo_exterior: '',
					car_photo_interior: ''
				},
				equipment: []
			}
		};
	},
	async onLoad() {
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;
		await this.getUserInfo();
		await this.loadUserProfile();
	},
	computed: {
		// 计算年龄
		computedAge() {
			if (!this.formData.birth_date) return '';
			const year = parseInt(this.formData.birth_date.substring(0, 4));
			const currentYear = new Date().getFullYear();
			return currentYear - year;
		},
		// 计算驾龄
		computedDrivingYears() {
			if (!this.formData.first_issue_date) return '';
			// 兼容 YYYY-MM-DD 或 YYYYMMDD
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
		async getUserInfo() {
			try {
				let res = await db.collection('uni-id-users').where('_id==$cloudEnv_uid').field('_id, mobile').get();
				if (res.result.data.length > 0) {
					this.userId = res.result.data[0]._id;
					this.formData.mobile = res.result.data[0].mobile;
					if (!this.formData.alipay_account) {
						this.formData.alipay_account = this.formData.mobile;
					}
				}
			} catch (e) {
				console.error(e);
			}
		},

		async loadUserProfile() {
			if (!this.userId) return;
			uni.showLoading({ title: '加载资料中...' });

			try {
				// 1. 查私导表
				const guideRes = await db.collection('b-guide-profiles').where({ user_id: this.userId }).limit(1).get();
				if (guideRes.result.data.length > 0) {
					const profile = guideRes.result.data[0];

					// 回填基础信息
					this.formData.real_name = profile.real_name || '';
					this.formData.gender = profile.gender || 1;
					this.formData.id_card_front = profile.id_card_front || '';
					this.formData.id_card_back = profile.id_card_back || '';
					this.formData.id_card_number = profile.id_card_number || '';
					this.formData.birth_date = profile.birth_date || ''; // 注意确保有此字段

					// 回填结算与紧急联系人
					this.formData.bank_card_img = profile.bank_card_img || '';
					this.formData.bank_card_number = profile.bank_card_number || '';
					this.formData.branch_name = profile.branch_name || '';
					this.formData.bank_expire_date = profile.bank_expire_date || '';
					this.formData.alipay_account = profile.alipay_account || this.formData.mobile;
					this.formData.emergency_name = profile.emergency_name || '';
					this.formData.emergency_mobile = profile.emergency_mobile || '';

					this.formData.driver_license = profile.driver_license || '';
					this.formData.personal_photo = profile.personal_photo || '';
					this.formData.background_image = profile.background_image || '';
					this.formData.first_issue_date = profile.first_issue_date || '';
					this.formData.license_valid_date = profile.license_valid_date || '';
					this.formData.equipment = profile.equipment || [];

					// 2. 查车辆表
					if (profile.vehicle_id) {
						this.formData.has_car = true;
						const carRes = await db.collection('b-vehicle-profiles').doc(profile.vehicle_id).get();
						if (carRes.result.data.length > 0) {
							const car = carRes.result.data[0];
							this.formData.car_info = {
								plate_number: car.plate_number || '',
								model: car.model || '',
								seat_count: car.seat_count || null,
								vehicle_license: car.vehicle_license || '',
								car_photo_exterior: car.car_photo_exterior || '',
								car_photo_interior: car.car_photo_interior || ''
							};
						}
					}
				}
			} catch (e) {
				console.error('加载资料失败', e);
			} finally {
				uni.hideLoading();
			}
		},

		onHasCarChange(e) {
			this.formData.has_car = e.detail.value;
		},

		toggleEquipment(value) {
			const index = this.formData.equipment.indexOf(value);
			if (index > -1) {
				this.formData.equipment.splice(index, 1); // 取消选中
			} else {
				this.formData.equipment.push(value); // 选中
			}
		},

		// 统一 OCR 处理方法
		chooseAndOcr(key) {
			let isVehicle = key === 'vehicle_license';

			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				success: async (res) => {
					const tempFilePath = res.tempFilePaths[0];
					const uploadRes = await this.uploadFile(tempFilePath);
					if (!uploadRes) return;

					// 设置图片回显
					if (isVehicle) {
						this.formData.car_info.vehicle_license = uploadRes;
					} else if (key === 'bank_card') {
						this.formData.bank_card_img = uploadRes;
					} else {
						this.formData[key] = uploadRes;
					}

					uni.showLoading({ title: '智能识别中...' });

					try {
						const ocrRes = await guideObj.ocrAnalysis({
							url: uploadRes,
							type: key
						});

						if (ocrRes.code === 0) {
							const data = ocrRes.data;

							if (key === 'id_card_front') {
								this.formData.real_name = data.real_name;
								this.formData.id_card_number = data.id_card_number;
								this.formData.birth_date = data.birth_date;
								this.formData.gender = data.gender;
							} else if (key === 'driver_license') {
								this.formData.first_issue_date = data.first_issue_date;
								this.formData.license_valid_date = data.license_valid_date;
							} else if (key === 'vehicle_license') {
								this.formData.car_info.plate_number = data.plate_number;
								this.formData.car_info.model = data.model;
								this.formData.car_info.seat_count = data.seat_count;
							} else if (key === 'bank_card') {
								// 填充银行卡信息
								this.formData.bank_card_number = data.bank_card_number;
								if (data.bank_name) {
									this.formData.branch_name = data.bank_name;
								}
								if (data.valid_date) {
									this.formData.bank_expire_date = data.valid_date;
								}
							}
							uni.showToast({ title: '已自动填充', icon: 'success' });
						} else {
							throw new Error(ocrRes.msg);
						}
					} catch (e) {
						console.error(e);
						uni.showToast({ title: '识别受限，请手动补充', icon: 'none' });
					} finally {
						uni.hideLoading();
					}
				}
			});
		},

		// 普通上传
		chooseImage(key, isCarInfo = false) {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				success: async (res) => {
					const tempFilePath = res.tempFilePaths[0];
					const url = await this.uploadFile(tempFilePath);
					if (url) {
						if (isCarInfo) {
							this.formData.car_info[key] = url;
						} else {
							this.formData[key] = url;
						}
					}
				}
			});
		},

		async uploadFile(filePath) {
			uni.showLoading({ title: '上传中...' });
			try {
				const fileExt = filePath.split('.').pop();
				const fileName = `${Date.now()}_${Math.random().toString(36).substr(2)}.${fileExt}`;
				const result = await uniCloud.uploadFile({
					filePath: filePath,
					cloudPath: `guide-profile/${fileName}`
				});
				uni.hideLoading();
				return result.fileID;
			} catch (e) {
				uni.hideLoading();
				return null;
			}
		},

		async submitForm() {
			// 简单校验
			if (!this.formData.real_name) return this.msg('请输入真实姓名');
			if (!this.formData.id_card_front) return this.msg('请上传身份证');

			// 校验结算信息
			if (!this.formData.bank_card_number) return this.msg('请填写或识别银行卡号');
			if (!this.formData.branch_name) return this.msg('请填写开户行');
			if (!this.formData.bank_expire_date) return this.msg('请填写银行卡有效期');
			if (!this.formData.alipay_account) return this.msg('请填写支付宝账号');

			// 校验紧急联系人
			if (!this.formData.emergency_name) return this.msg('请填写紧急联系人姓名');
			if (!this.formData.emergency_mobile) return this.msg('请填写紧急联系人电话');

			if (this.formData.has_car) {
				const c = this.formData.car_info;
				if (!c.plate_number || !c.model || !c.seat_count) return this.msg('请完善车辆信息');
			}

			this.isSubmitting = true;

			try {
				let vehicleId = null;

				// 1. 存车
				if (this.formData.has_car) {
					const carQuery = await db.collection('b-vehicle-profiles').where({ owner_id: this.userId }).get();

					const vehiclePayload = {
						owner_id: this.userId,
						...this.formData.car_info,
						seat_count: Number(this.formData.car_info.seat_count),
						status: 0,
						updated_date: Date.now()
					};
					if (carQuery.result.data.length > 0) {
						// 更新现有车辆
						vehicleId = carQuery.result.data[0]._id;
						await db.collection('b-vehicle-profiles').doc(vehicleId).update(vehiclePayload);
					} else {
						// 新增车辆
						vehiclePayload.create_date = Date.now();
						const vehicleRes = await db.collection('b-vehicle-profiles').add(vehiclePayload);
						vehicleId = vehicleRes.result.id;
					}
				}

				// 2. 存人
				const guidePayload = {
					...this.formData,
					user_id: this.userId,
					vehicle_id: vehicleId,
					equipment: this.formData.equipment,
					updated_at: Date.now()
				};
				delete guidePayload.car_info; // 清理冗余

				const collection = db.collection('b-guide-profiles');
				const exist = await collection.where({ user_id: this.userId }).get();

				if (exist.result.data.length > 0) {
					await collection.doc(exist.result.data[0]._id).update(guidePayload);
				} else {
					await collection.add(guidePayload);
				}

				try {
					await guideObj.grantGuideRole({
						realName: this.formData.real_name
					});
				} catch (err) {
					console.error('更新角色失败', err);
				}

				uni.showToast({ title: '注册成功', icon: 'success' });
				uni.reLaunch({ url: '/pages/home/home' });
				// setTimeout(() => {
				// 	uni.reLaunch({ url: '/pages/home/home' });
				// }, 1000);
			} catch (e) {
				this.msg('提交失败：' + e.message);
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
.page-container {
	min-height: 100vh;
	background-color: #f5f7fa;
	padding: 24rpx;
	padding-bottom: 40rpx;
}
.header-space {
	position: sticky;
	top: 0;
	z-index: 100;
	background-color: #f5f7fa;
}
.nav-bar {
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: center;
}
.nav-title {
	font-size: 34rpx;
	font-weight: bold;
	color: #333;
}

/* 卡片样式优化 */
.card {
	background-color: #fff;
	border-radius: 24rpx;
	padding: 30rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}
.card-title-box {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
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
.section-subtitle {
	font-size: 24rpx;
	color: #999;
	margin-bottom: 20rpx;
	display: block;
}

/* 表单与布局 */
.form-group {
	margin-top: 30rpx;
}
.form-item {
	margin-bottom: 24rpx;
}
.form-row {
	display: flex;
	gap: 20rpx;
	margin-bottom: 24rpx;
}
.form-col {
	flex: 1;
}

.upload-placeholder {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.label {
	font-size: 26rpx;
	color: #666;
	margin-bottom: 12rpx;
	display: block;

	&.note {
		color: #eb6d20;
	}
}

.input-box {
	background-color: #f8f9fb;
	height: 80rpx;
	border-radius: 12rpx;
	padding: 0 24rpx;
	font-size: 28rpx;
	color: #333;
	border: 1px solid transparent;
	transition: border-color 0.2s;

	&:focus {
		border-color: #eb6d20;
		background-color: #fff;
	}
}
.disabled-input {
	background-color: #f0f2f5;
	color: #999;
}

/* 上传区域优化 */
.upload-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	gap: 20rpx;
}
.upload-item {
	width: 48%;
}
.upload-item.full-width {
	width: 100%;
}
.centered-grid {
	justify-content: center;
}

.upload-box {
	width: 100%;
	height: 200rpx;
	background-color: #fafafa;
	border: 2rpx dashed #dcdfe6;
	border-radius: 16rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	position: relative;

	&.wide-box {
		height: 260rpx;
	}
	&.portrait-box {
		height: 260rpx;
	}
}

.uploaded-img {
	width: 100%;
	height: 100%;
}
.upload-text {
	font-size: 22rpx;
	color: #999;
	margin-top: 12rpx;
}

/* 车辆模块特殊样式 */
.car-section {
	animation: fadeIn 0.3s ease;
}
.divider {
	width: 100%;
	height: 1px;
	background-color: #eee;
	margin: 30rpx 0;
}
.switch-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.footer-btn-area {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #fff;
	padding: 20rpx 40rpx calc(20rpx + env(safe-area-inset-bottom));
	box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
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

/* 设备选择样式 */
.equip-group {
	display: flex;
	justify-content: space-between;
	gap: 20rpx;
	margin-top: 10rpx;
}

.equip-item {
	flex: 1;
	background-color: #f8f9fb;
	border: 2rpx solid transparent;
	border-radius: 16rpx;
	height: 140rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	position: relative;
	transition: all 0.2s;

	.equip-text {
		font-size: 26rpx;
		color: #666;
		margin-top: 12rpx;
		font-weight: 500;
	}

	/* 选中状态 */
	&.active {
		background-color: #fff4ec;
		border-color: #eb6d20;

		.equip-text {
			color: #eb6d20;
		}
	}

	.check-icon {
		position: absolute;
		top: 10rpx;
		right: 10rpx;
	}
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(-10rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
