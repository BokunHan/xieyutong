<template>
	<view class="bg-gray-50 min-h-screen">
		<!-- 内容区域 -->
		<view class="pb-20">
			<!-- 加载状态 -->
			<view v-if="loading" class="flex flex-col items-center justify-center py-20">
				<view class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></view>
				<text class="text-gray-500">加载中...</text>
			</view>

			<!-- 头像部分 -->
			<view v-else class="flex flex-col items-center mb-6 mt-4">
				<view class="avatar-container" @click="changeAvatar">
					<view class="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden relative">
						<image v-if="userProfile.avatar_file" :src="userProfile.avatar_file.url" alt="用户头像" class="w-full h-full object-cover" mode="aspectFill"></image>
						<view v-else class="w-full h-full bg-gray-100 flex items-center justify-center">
							<!-- <text class="fa fa-user text-2xl text-gray-400"></text> -->
							<image src="/static/icons/user.svg" class="w-8 h-8" mode="aspectFit" />
						</view>
						<view class="avatar-edit">
							<!-- <text class="fa fa-camera mr-1 text-xs"></text> -->
							<image src="/static/icons/camera.svg" class="w-3 h-3 mr-1" mode="aspectFit" />
							<!-- <text class="text-xs text-brand-orange">更换</text> -->
						</view>
					</view>
				</view>
				<view class="text-blue-500 text-sm mt-3">点击更换头像</view>
			</view>

			<!-- 基本信息表单 -->
			<view v-if="!loading" class="bg-white rounded-xl mx-4 shadow-sm">
				<!-- 用户名 -->
				<view class="form-item">
					<view class="form-label">昵称</view>
					<input type="text" class="form-input" placeholder="请输入昵称" v-model="userProfile.nickname" />
				</view>

				<!-- 手机号 -->
				<view class="form-item">
					<view class="form-label">手机号</view>
					<input type="tel" class="form-input form-input-disabled" :value="userProfile.mobile" disabled />
					<view class="form-right">
						<text class="text-xs text-gray-400">不可修改</text>
					</view>
				</view>

				<!-- 生日 -->
				<view class="form-item">
					<view class="form-label">生日</view>
					<picker mode="date" :value="userProfile.birthday" @change="onBirthdayChange">
						<view class="form-input-picker">
							<text v-if="userProfile.birthday" class="text-gray-800">{{ userProfile.birthday }}</text>
							<text v-else class="text-gray-400">请选择您的生日</text>
						</view>
					</picker>
				</view>

				<!-- 真实姓名 -->
				<view class="form-item">
					<view class="form-label">真实姓名</view>
					<input type="text" class="form-input" placeholder="请输入真实姓名" v-model="realNameInfo.real_name" />
					<view class="form-right">
						<text class="optional-tag">选填</text>
					</view>
				</view>

				<!-- 身份证号 -->
				<view class="form-item border-b-0">
					<view class="form-label">身份证号</view>
					<input type="text" class="form-input" placeholder="请输入身份证号码" v-model="realNameInfo.identity" />
					<view class="form-right">
						<text class="optional-tag">选填</text>
					</view>
				</view>
			</view>

			<!-- 隐私声明 -->
			<view v-if="!loading" class="privacy-notice">
				<text class="text-gray-400 text-sm leading-relaxed">
					您的个人信息将被严格保密，仅用于提供更好的旅游服务和体验。身份证信息将用于旅游预订和保险服务，您可以选择不填写，但可能会影响部分功能的使用。
				</text>
			</view>
		</view>

		<!-- 底部保存按钮 -->
		<view v-if="!loading" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 safe-area-inset-bottom">
			<button class="save-btn w-full" @click="saveProfile">保存</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			userProfile: {
				_id: '',
				avatar_file: {},
				nickname: '',
				mobile: '',
				birthday: ''
			},
			realNameInfo: {
				real_name: '',
				identity: '',
				auth_status: 0,
				type: 0
			},
			loading: false,
			isLoggedIn: false,
			currentUserId: ''
		};
	},

	onLoad() {
		this.checkLoginAndLoadData();
	},

	methods: {
		// 检查登录状态并加载数据
		async checkLoginAndLoadData() {
			console.log('=== 开始检查登录状态并加载数据 ===');

			try {
				console.log('步骤1: 检查本地登录状态');
				// 检查登录状态
				const token = uni.getStorageSync('uni_id_token');
				const tokenExpired = uni.getStorageSync('uni_id_token_expired');

				console.log('本地登录状态检查:');
				console.log('- token存在:', !!token);
				console.log('- token长度:', token ? token.length : 0);
				console.log('- token过期时间:', tokenExpired ? new Date(tokenExpired) : null);
				console.log('- 当前时间:', new Date());
				console.log('- token是否过期:', tokenExpired ? Date.now() > tokenExpired : true);

				if (!token || !tokenExpired || Date.now() > tokenExpired) {
					console.warn('登录状态无效，跳转到登录页');
					console.warn('- token缺失:', !token);
					console.warn('- tokenExpired缺失:', !tokenExpired);
					console.warn('- token已过期:', tokenExpired ? Date.now() > tokenExpired : false);

					// 未登录或token过期，跳转到登录页
					const redirectUrl = '/pages/login/login?redirect=' + encodeURIComponent('/pages/profile/profile-edit');
					console.log('跳转URL:', redirectUrl);

					uni.reLaunch({
						url: redirectUrl
					});
					return;
				}

				console.log('步骤2: 登录状态有效，设置登录标志');
				this.isLoggedIn = true;
				console.log('登录状态设置为:', this.isLoggedIn);

				console.log('步骤3: 开始加载用户资料');
				await this.loadUserProfile();

				console.log('=== 登录检查和数据加载完成 ===');
			} catch (error) {
				console.error('=== 检查登录状态失败 ===');
				console.error('错误类型:', error.constructor.name);
				console.error('错误消息:', error.message);
				console.error('错误详情:', JSON.stringify(error, null, 2));
				console.error('错误堆栈:', error.stack);

				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				});
			}
		},

		// 使用 ClientDB 加载用户资料
		async loadUserProfile() {
			console.log('=== 开始加载用户资料 ===');

			try {
				console.log('步骤1: 设置加载状态');
				this.loading = true;
				console.log('loading状态设置为:', this.loading);

				console.log('步骤2: 创建数据库连接');
				// 使用 ClientDB 获取当前用户信息
				const db = uniCloud.database();
				console.log('数据库实例创建成功');

				console.log('步骤3: 构建查询');
				const queryFields = '_id, nickname, avatar_file, mobile, birthday, realname_auth, register_date';
				console.log('查询字段:', queryFields);
				console.log('查询条件: _id == $cloudEnv_uid');

				const result = await db.collection('uni-id-users').where('_id == $cloudEnv_uid').field(queryFields).get();

				console.log('步骤4: 数据库查询完成');
				console.log('ClientDB 查询结果详情:', JSON.stringify(result, null, 2));

				if (result.result && result.result.data && result.result.data.length > 0) {
					console.log('步骤5: 解析查询结果');
					const userData = result.result.data[0];
					console.log('原始用户数据:', JSON.stringify(userData, null, 2));

					console.log('步骤6: 构建用户资料对象');
					// 更新用户资料
					this.userProfile = {
						_id: userData._id,
						avatar_file: userData.avatar_file || {},
						nickname: userData.nickname || '',
						mobile: userData.mobile || '',
						birthday: userData.birthday || ''
					};

					console.log('用户资料对象构建完成:', JSON.stringify(this.userProfile, null, 2));

					console.log('步骤7: 处理实名认证信息');
					// 处理实名认证信息
					if (userData.realname_auth) {
						console.log('发现实名认证数据:', JSON.stringify(userData.realname_auth, null, 2));
						this.realNameInfo = {
							real_name: userData.realname_auth.real_name || '',
							identity: userData.realname_auth.identity || '',
							auth_status: userData.realname_auth.auth_status || 0,
							type: userData.realname_auth.type || 0
						};
						console.log('实名认证信息构建完成:', JSON.stringify(this.realNameInfo, null, 2));
					} else {
						console.log('没有实名认证数据，使用默认值');
						// 保持默认的实名信息结构
					}

					console.log('步骤8: 设置当前用户ID');
					this.currentUserId = userData._id;
					console.log('当前用户ID设置为:', this.currentUserId);

					console.log('步骤9: 数据加载完成汇总');
					console.log('最终用户资料:', JSON.stringify(this.userProfile, null, 2));
					console.log('最终实名信息:', JSON.stringify(this.realNameInfo, null, 2));
					console.log('当前用户ID:', this.currentUserId);
					console.log('注册时间:', userData.register_date ? new Date(userData.register_date) : '未知');

					console.log('=== 用户资料加载成功 ===');
				} else {
					console.error('数据库查询结果为空');
					console.error('查询结果结构:', {
						hasResult: !!result.result,
						hasData: !!(result.result && result.result.data),
						dataLength: result.result && result.result.data ? result.result.data.length : 0
					});
					throw new Error('未找到用户信息');
				}
			} catch (error) {
				console.error('=== 加载用户资料失败 ===');
				console.error('错误类型:', error.constructor.name);
				console.error('错误消息:', error.message);
				console.error('错误详情:', JSON.stringify(error, null, 2));
				console.error('错误堆栈:', error.stack);

				// 分析具体错误类型
				if (error.message && error.message.includes('权限校验未通过')) {
					console.error('权限校验错误，可能需要重新登录');
				} else if (error.message && error.message.includes('网络')) {
					console.error('网络连接错误');
				} else {
					console.error('其他类型错误');
				}

				uni.showToast({
					title: error.message || '加载失败，请重试',
					icon: 'none'
				});
			} finally {
				console.log('步骤10: 清理加载状态');
				this.loading = false;
				console.log('loading状态设置为:', this.loading);
			}
		},

		// 使用 ClientDB 更换头像
		async changeAvatar() {
			console.log('=== 开始更换头像流程 ===');
			console.log('当前登录状态:', this.isLoggedIn);
			console.log('当前用户ID:', this.currentUserId);
			console.log('当前头像URL:', this.userProfile.avatar);

			try {
				console.log('步骤1: 选择图片');
				// 使用 uni.chooseMedia 替代 uni.chooseImage（更现代的API）
				const res = await uni.chooseMedia({
					count: 1,
					mediaType: ['image'],
					sizeType: ['compressed'],
					sourceType: ['album', 'camera']
				});

				console.log('图片选择结果:', res);

				if (res.tempFiles && res.tempFiles.length > 0) {
					const tempFilePath = res.tempFiles[0].tempFilePath;
					const fileSize = res.tempFiles[0].size;

					console.log('选中的图片信息:');
					console.log('- 临时路径:', tempFilePath);
					console.log('- 文件大小:', fileSize, 'bytes');
					console.log('- 文件大小(MB):', (fileSize / 1024 / 1024).toFixed(2));

					uni.showLoading({
						title: '上传中...'
					});

					console.log('步骤2: 开始上传到七牛云扩展存储');
					const cloudPath = `avatar/${this.currentUserId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
					console.log('云存储路径:', cloudPath);

					// 使用扩展存储上传到七牛云
					const uploadResult = await uniCloud.uploadFile({
						filePath: tempFilePath,
						cloudPath: cloudPath,
						// 扩展存储配置
						extStorage: {
							provider: 'qiniu', // 七牛云
							domain: 'cdn-xieyutong.bitejufeng.com' // 你的CDN域名
						}
					});

					console.log('步骤3: 云存储上传完成');
					console.log('上传结果详情:', JSON.stringify(uploadResult, null, 2));

					if (uploadResult.fileID) {
						console.log('步骤4: 准备更新数据库');
						console.log('准备更新头像，当前用户ID:', this.currentUserId);
						console.log('新头像URL:', uploadResult.fileID);
						console.log('更新时间戳:', Date.now());

						// 检查登录状态
						const token = uni.getStorageSync('uni_id_token');
						const tokenExpired = uni.getStorageSync('uni_id_token_expired');
						console.log('当前token存在:', !!token);
						console.log('token过期时间:', new Date(tokenExpired));
						console.log('当前时间:', new Date());
						console.log('token是否过期:', Date.now() > tokenExpired);

						// 使用 ClientDB 更新头像
						const db = uniCloud.database();
						console.log('数据库实例创建成功');

						const updateData = {
							avatar_file: { name: cloudPath, extname: 'jpg', url: uploadResult.fileID },
							updated_at: Date.now()
						};

						console.log('准备更新的数据:', updateData);
						console.log('目标文档ID:', this.currentUserId);

						const updateResult = await db.collection('uni-id-users').doc(this.currentUserId).update(updateData);

						console.log('步骤5: 数据库更新完成');
						console.log('头像更新结果详情:', JSON.stringify(updateResult, null, 2));

						if (updateResult.result && updateResult.result.updated > 0) {
							console.log('步骤6: 更新成功，更新本地状态');
							// 更新本地显示
							const oldAvatar = this.userProfile.avatar;
							this.userProfile.avatar = uploadResult.fileID;

							console.log('本地头像更新:');
							console.log('- 旧头像:', oldAvatar);
							console.log('- 新头像:', this.userProfile.avatar);

							uni.hideLoading();
							uni.showToast({
								title: '头像更换成功',
								icon: 'success'
							});

							console.log('=== 头像更换流程完成 ===');
						} else {
							console.error('数据库更新失败: 没有记录被更新');
							console.error('更新结果:', updateResult);
							throw new Error('头像更新失败：数据库未更新任何记录');
						}
					} else {
						console.error('云存储上传失败: 没有返回fileID');
						console.error('上传结果:', uploadResult);
						throw new Error('上传失败：云存储未返回文件ID');
					}
				} else {
					console.log('用户取消了图片选择');
				}
			} catch (error) {
				console.error('=== 头像更换失败 ===');
				console.error('错误类型:', error.constructor.name);
				console.error('错误消息:', error.message);
				console.error('错误详情:', JSON.stringify(error, null, 2));
				console.error('错误堆栈:', error.stack);

				uni.hideLoading();

				// 如果是权限错误，提供更详细的信息
				if (error.message && error.message.includes('权限校验未通过')) {
					console.error('权限校验错误详细分析:');
					console.error('- 错误代码:', error.code || error.errCode);
					console.error('- 错误信息:', error.errMsg || error.message);

					uni.showModal({
						title: '权限错误',
						content: '头像更新权限校验失败，可能是登录状态异常。是否重新登录？',
						confirmText: '重新登录',
						cancelText: '取消',
						success: (res) => {
							if (res.confirm) {
								console.log('用户选择重新登录，清除本地登录状态');
								// 清除登录状态，跳转到登录页
								uni.removeStorageSync('uni_id_token');
								uni.removeStorageSync('uni_id_token_expired');
								uni.reLaunch({
									url: '/pages/login/login'
								});
							} else {
								console.log('用户取消重新登录');
							}
						}
					});
				} else {
					uni.showToast({
						title: error.message || '头像更换失败',
						icon: 'none'
					});
				}
			}
		},

		onBirthdayChange(e) {
			console.log('=== 生日选择变更 ===');
			console.log('事件对象:', e);
			console.log('原生日:', this.userProfile.birthday);
			console.log('新生日:', e.detail.value);

			this.userProfile.birthday = e.detail.value;

			console.log('生日更新完成:', this.userProfile.birthday);
		},

		// 使用 ClientDB 保存用户资料
		async saveProfile() {
			console.log('=== 开始保存用户资料流程 ===');
			console.log('当前登录状态:', this.isLoggedIn);
			console.log('当前用户ID:', this.currentUserId);
			console.log('原始用户资料:', JSON.stringify(this.userProfile, null, 2));
			console.log('原始实名信息:', JSON.stringify(this.realNameInfo, null, 2));

			try {
				console.log('步骤1: 数据验证');
				// 验证必填字段
				if (!this.userProfile.username.trim()) {
					console.warn('验证失败: 用户名为空');
					uni.showToast({
						title: '请输入用户名',
						icon: 'none'
					});
					return;
				}

				console.log('验证通过: 用户名已填写:', this.userProfile.username.trim());

				uni.showLoading({
					title: '保存中...'
				});

				console.log('步骤2: 准备更新数据');
				// 准备更新数据 - 只更新用户可修改的基本字段
				const updateData = {
					username: this.userProfile.username.trim(),
					birthday: this.userProfile.birthday,
					updated_at: Date.now()
				};

				console.log('基础更新数据:', JSON.stringify(updateData, null, 2));

				// 处理实名认证信息 - 只更新用户填写的信息，不更新系统状态字段
				const hasRealName = this.realNameInfo.real_name.trim();
				const hasIdentity = this.realNameInfo.identity.trim();

				console.log('实名认证数据检查:');
				console.log('- 真实姓名:', hasRealName ? this.realNameInfo.real_name.trim() : '(空)');
				console.log('- 身份证号:', hasIdentity ? this.realNameInfo.identity.trim() : '(空)');
				console.log('- 认证状态(不更新):', this.realNameInfo.auth_status);
				console.log('- 认证类型(不更新):', this.realNameInfo.type);

				if (hasRealName || hasIdentity) {
					// 只更新用户填写的基本信息，不更新系统管理的状态字段
					updateData.realname_auth = {
						real_name: this.realNameInfo.real_name.trim(),
						identity: this.realNameInfo.identity.trim()
						// 注意：不包含 auth_status 和 type，这些由系统管理
					};
					console.log('添加实名认证基本信息到更新数据（不包含状态字段）');
				} else {
					console.log('跳过实名认证信息（无数据）');
				}

				console.log('最终更新数据:', JSON.stringify(updateData, null, 2));

				// 检查登录状态
				const token = uni.getStorageSync('uni_id_token');
				const tokenExpired = uni.getStorageSync('uni_id_token_expired');
				console.log('登录状态检查:');
				console.log('- token存在:', !!token);
				console.log('- token过期时间:', new Date(tokenExpired));
				console.log('- 当前时间:', new Date());
				console.log('- token是否过期:', Date.now() > tokenExpired);

				console.log('步骤3: 执行数据库更新');
				// 使用 ClientDB 更新用户资料
				const db = uniCloud.database();
				console.log('数据库实例创建成功');
				console.log('目标集合: uni-id-users');
				console.log('目标文档ID:', this.currentUserId);

				const result = await db.collection('uni-id-users').doc(this.currentUserId).update(updateData);

				console.log('步骤4: 数据库更新完成');
				console.log('用户资料更新结果详情:', JSON.stringify(result, null, 2));

				if (result.result && result.result.updated > 0) {
					console.log('步骤5: 更新成功处理');
					console.log('更新记录数:', result.result.updated);

					uni.hideLoading();
					uni.showToast({
						title: '保存成功',
						icon: 'success'
					});

					console.log('保存成功，1.5秒后返回上一页');
					// 保存成功后返回上一页
					setTimeout(() => {
						console.log('执行页面返回');
						uni.navigateBack();
					}, 1500);

					console.log('=== 用户资料保存流程完成 ===');
				} else {
					console.error('数据库更新失败: 没有记录被更新');
					console.error('更新结果详情:', result);
					throw new Error('保存失败，没有数据被更新');
				}
			} catch (error) {
				console.error('=== 用户资料保存失败 ===');
				console.error('错误类型:', error.constructor.name);
				console.error('错误消息:', error.message);
				console.error('错误详情:', JSON.stringify(error, null, 2));
				console.error('错误堆栈:', error.stack);

				uni.hideLoading();

				// 分析具体错误类型
				if (error.message && error.message.includes('权限校验未通过')) {
					console.error('权限校验错误详细分析:');
					console.error('- 错误代码:', error.code || error.errCode);
					console.error('- 错误信息:', error.errMsg || error.message);

					uni.showModal({
						title: '权限错误',
						content: '数据保存权限校验失败，可能是登录状态异常。是否重新登录？',
						confirmText: '重新登录',
						cancelText: '取消',
						success: (res) => {
							if (res.confirm) {
								console.log('用户选择重新登录，清除本地登录状态');
								uni.removeStorageSync('uni_id_token');
								uni.removeStorageSync('uni_id_token_expired');
								uni.reLaunch({
									url: '/pages/login/login'
								});
							} else {
								console.log('用户取消重新登录');
							}
						}
					});
				} else {
					uni.showToast({
						title: error.message || '保存失败，请重试',
						icon: 'none'
					});
				}
			}
		}
	}
};
</script>

<style>
/* 个人资料编辑页面自定义样式 */
.profile-edit-container {
	background-color: #f5f5f5;
	min-height: 100vh;
}

/* 头像编辑遮罩 */
.avatar-edit {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 24px;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 12px;
}

/* 表单项样式 */
.form-item {
	padding: 12px 16px;
	border-bottom: 1px solid #f0f0f0;
	display: flex;
	align-items: center;
}

.form-label {
	width: 80px;
	font-size: 15px;
	color: #666666;
	flex-shrink: 0;
}

.form-input {
	flex: 1;
	border: none;
	outline: none;
	font-size: 15px;
	color: #333333;
	background: transparent;
}

.form-input-disabled {
	color: #999999;
}

.form-input::placeholder {
	color: #999999;
}

.form-input-picker {
	flex: 1;
	font-size: 15px;
}

.form-right {
	display: flex;
	align-items: center;
	margin-left: 8px;
}

.optional-tag {
	background-color: #f0f0f0;
	color: #999999;
	font-size: 12px;
	padding: 2px 6px;
	border-radius: 4px;
}

/* 保存按钮 */
.save-btn {
	background-color: #eb6d20;
	color: white;
	border: none;
	border-radius: 8px;
	padding: 12px 24px;
	font-size: 16px;
	font-weight: 500;
	transition: all 0.2s ease;
}

.save-btn:active {
	opacity: 0.8;
	transform: scale(0.98);
}

/* 隐私声明 */
.privacy-notice {
	padding: 0 16px;
	margin-top: 24px;
}

/* 阴影效果 */
.shadow-sm {
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.shadow-md {
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 补充样式 */
.object-cover {
	object-fit: cover;
}

.leading-relaxed {
	line-height: 1.625;
}

.border-b-0 {
	border-bottom: none !important;
}

/* 安全区域适配 */
.safe-area-inset-bottom {
	padding-bottom: env(safe-area-inset-bottom);
}

/* 加载动画 */
.animate-spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}
</style>
