const uniIdCommon = require('uni-id-common');

module.exports = {
	_before: function () {
		console.log('云对象调用开始');

		// 创建 uni-id-common 实例
		const clientInfo = this.getClientInfo();
		this.uniIdCommon = uniIdCommon.createInstance({
			clientInfo: clientInfo
		});

		// 获取客户端信息
		try {
			const clientInfo = this.getClientInfo();
			console.log('客户端信息:', JSON.stringify(clientInfo));
		} catch (error) {
			console.log('获取客户端信息失败:', error.message);
		}
	},

	/**
	 * 获取用户资料
	 */
	async getUserProfile() {
		try {
			console.log('开始获取用户资料');

			// 使用 checkToken 方法验证并获取用户信息
			const checkTokenResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
			console.log('checkToken 结果:', checkTokenResult);

			if (checkTokenResult.errCode !== 0) {
				console.log('token 校验失败:', checkTokenResult.message);
				throw new Error(checkTokenResult.message || '用户未登录或登录已过期');
			}

			const uid = checkTokenResult.uid;
			console.log('用户ID:', uid);
			console.log('用户角色:', checkTokenResult.role);
			console.log('用户权限:', checkTokenResult.permission);

			// 使用 JQL 语法查询用户资料
			const userRes = await uniCloud
				.databaseForJQL({
					// 获取JQL database引用，此处需要传入云对象的clientInfo
					clientInfo: this.getClientInfo()
				})
				.collection('uni-id-users')
				.doc(uid)
				.field('_id, username, nickname, avatar, gender, mobile, email, realname_auth, register_date, birthday')
				.get();

			console.log('数据库查询结果:', userRes);

			if (!userRes.data || userRes.data.length === 0) {
				throw new Error('用户不存在');
			}

			const userData = userRes.data[0];

			// 创建新的用户数据对象，处理手机号脱敏
			const userProfile = {
				...userData
			};

			// 安全地处理手机号脱敏
			if (userData.mobile) {
				userProfile.mobile = userData.mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
			} else {
				userProfile.mobile = '';
			}

			return {
				errCode: 0,
				message: '获取成功',
				data: {
					user: userProfile,
					// 如果token快要过期，返回新token
					token: checkTokenResult.token,
					tokenExpired: checkTokenResult.tokenExpired
				}
			};
		} catch (error) {
			console.error('getUserProfile 错误:', error);
			return {
				errCode: -1,
				message: error.message || '获取用户资料失败',
				data: null
			};
		}
	},

	/**
	 * 更新用户资料
	 * @param {Object} profileData 用户资料数据
	 */
	async updateUserProfile(profileData) {
		try {
			console.log('开始更新用户资料:', profileData);

			// 使用 checkToken 方法验证并获取用户信息
			const checkTokenResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
			console.log('checkToken 结果:', checkTokenResult);

			if (checkTokenResult.errCode !== 0) {
				console.log('token 校验失败:', checkTokenResult.message);
				throw new Error(checkTokenResult.message || '用户未登录或登录已过期');
			}

			const uid = checkTokenResult.uid;
			console.log('用户ID:', uid);

			// 数据验证
			if (!profileData || typeof profileData !== 'object') {
				throw new Error('无效的资料数据');
			}

			// 过滤允许更新的字段
			const allowedFields = ['nickname', 'gender', 'realname_auth', 'birthday'];
			const updateData = {};

			for (const field of allowedFields) {
				if (profileData.hasOwnProperty(field)) {
					updateData[field] = profileData[field];
				}
			}

			// 特殊验证：实名认证信息
			if (updateData.realname_auth) {
				const { real_name, identity } = updateData.realname_auth;
				if (!real_name) {
					throw new Error('请输入真实姓名');
				}
				// 身份证格式验证（如果提供了身份证号）
				if (identity) {
					const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
					if (!idCardRegex.test(identity)) {
						throw new Error('身份证号格式不正确');
					}
				}
			}

			if (Object.keys(updateData).length === 0) {
				throw new Error('没有可更新的数据');
			}

			// 添加更新时间
			updateData.updated_at = Date.now();

			console.log('准备更新的数据:', updateData);

			// 使用 JQL 语法更新用户资料
			const updateRes = await uniCloud
				.databaseForJQL({
					// 获取JQL database引用，此处需要传入云对象的clientInfo
					clientInfo: this.getClientInfo()
				})
				.collection('uni-id-users')
				.doc(uid)
				.update(updateData);

			console.log('更新结果:', updateRes);

			return {
				errCode: 0,
				message: '更新成功',
				data: {
					updated: updateRes.updated,
					// 如果token快要过期，返回新token
					token: checkTokenResult.token,
					tokenExpired: checkTokenResult.tokenExpired
				}
			};
		} catch (error) {
			console.error('updateUserProfile 错误:', error);
			return {
				errCode: -1,
				message: error.message || '更新用户资料失败',
				data: null
			};
		}
	},

	/**
	 * 更新用户头像
	 * @param {String} avatarUrl 头像URL
	 */
	async updateUserAvatar(avatarUrl) {
		try {
			console.log('开始更新用户头像:', avatarUrl);

			// 使用 checkToken 方法验证并获取用户信息
			const checkTokenResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
			console.log('checkToken 结果:', checkTokenResult);

			if (checkTokenResult.errCode !== 0) {
				console.log('token 校验失败:', checkTokenResult.message);
				throw new Error(checkTokenResult.message || '用户未登录或登录已过期');
			}

			const uid = checkTokenResult.uid;
			console.log('用户ID:', uid);

			// 数据验证
			if (!avatarUrl || typeof avatarUrl !== 'string') {
				throw new Error('无效的头像URL');
			}

			// 使用 JQL 语法更新用户头像
			const updateRes = await uniCloud
				.databaseForJQL({
					// 获取JQL database引用，此处需要传入云对象的clientInfo
					clientInfo: this.getClientInfo()
				})
				.collection('uni-id-users')
				.doc(uid)
				.update({
					avatar: avatarUrl,
					updated_at: Date.now()
				});

			console.log('更新结果:', updateRes);

			return {
				errCode: 0,
				message: '头像更新成功',
				data: {
					updated: updateRes.updated,
					avatarUrl: avatarUrl,
					// 如果token快要过期，返回新token
					token: checkTokenResult.token,
					tokenExpired: checkTokenResult.tokenExpired
				}
			};
		} catch (error) {
			console.error('updateUserAvatar 错误:', error);
			return {
				errCode: -1,
				message: error.message || '头像更新失败',
				data: null
			};
		}
	},

	/**
	 * 获取用户角色和权限信息
	 */
	async getUserRoleAndPermission() {
		try {
			console.log('开始获取用户角色和权限信息');

			// 使用 checkToken 方法验证并获取用户信息
			const checkTokenResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
			console.log('checkToken 结果:', checkTokenResult);

			if (checkTokenResult.errCode !== 0) {
				console.log('token 校验失败:', checkTokenResult.message);
				throw new Error(checkTokenResult.message || '用户未登录或登录已过期');
			}

			return {
				errCode: 0,
				message: '获取成功',
				data: {
					uid: checkTokenResult.uid,
					role: checkTokenResult.role || [],
					permission: checkTokenResult.permission || [],
					// 如果token快要过期，返回新token
					token: checkTokenResult.token,
					tokenExpired: checkTokenResult.tokenExpired
				}
			};
		} catch (error) {
			console.error('getUserRoleAndPermission 错误:', error);
			return {
				errCode: -1,
				message: error.message || '获取角色权限信息失败',
				data: null
			};
		}
	}
};
