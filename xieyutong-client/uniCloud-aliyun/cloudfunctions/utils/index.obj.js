const uniIdCommon = require('uni-id-common');
const db = uniCloud.database();
const dbCmd = db.command;

module.exports = {
	_before() {
		this.uniIdCommon = uniIdCommon.createInstance({ context: this });
	},

	/**
	 * 检查是否存在管理员账户
	 * 这是一个安全
	 * 任何人都可以调用，但它只返回一个布尔值，不会泄露任何数据。
	 */
	async checkAdminExists() {
		let countRes = await db
			.collection('uni-id-users')
			.where({
				role: dbCmd.in(['admin', 'super_admin'])
			})
			.count();

		// 只返回一个布尔值给前端
		return countRes.total > 0;
	},

	/**
	 * 更新用户信息（昵称和头像）
	 */
	async updateUserInfo() {
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) {
			console.warn('[行程服务] 用户身份验证失败:', checkResult.errMsg);
			return {
				errCode: 0,
				data: null
			};
		}
		const userId = checkResult.uid;

		const params = this.getParams()[0];
		if (!params) {
			return {
				errCode: 'PARAM_ERROR',
				errMsg: '缺少参数'
			};
		}

		const { nickname, avatar, avatarCloudPath } = params;

		// 3. 校验参数
		if (!nickname || !avatar || !avatarCloudPath) {
			return {
				errCode: 'PARAM_ERROR',
				errMsg: '参数均不能为空'
			};
		}

		const avatar_file = {
			extname: 'jpeg',
			name: avatarCloudPath,
			url: avatar
		};

		const dataToUpdate = {
			nickname: nickname,
			avatar_file: avatar_file
		};

		// 6. 执行数据库更新
		try {
			await db.collection('uni-id-users').doc(userId).update(dataToUpdate);

			// 7. 返回成功响应
			return {
				errCode: 0,
				errMsg: '更新成功'
			};
		} catch (e) {
			console.error('updateUserInfo failed:', e);
			return {
				errCode: 'DB_ERROR',
				errMsg: '数据库更新失败',
				message: e.message
			};
		}
	}
};
