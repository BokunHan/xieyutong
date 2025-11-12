const db = uniCloud.database();
const dbCmd = db.command;

module.exports = {
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
	}
};
