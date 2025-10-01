const uniIdCommon = require('uni-id-common');

module.exports = {
	_before() {
		this.uniIdCommon = uniIdCommon.createInstance({ context: this });
	},

	async createOrder(orderData) {
		try {
			// 验证用户身份
			const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
			if (checkResult.errCode !== 0) {
				return {
					errCode: checkResult.errCode,
					errMsg: checkResult.errMsg || '身份验证失败'
				};
			}

			// 获取数据库引用
			const db = uniCloud.databaseForJQL({
				clientInfo: this.getClientInfo()
			});

			// 设置用户ID
			orderData.user_id = checkResult.uid;
			
			// 处理日期字段：将字符串格式转换为时间戳（毫秒数）
			if (orderData.departure_date && typeof orderData.departure_date === 'string') {
				orderData.departure_date = new Date(orderData.departure_date).getTime();
			}
			if (orderData.return_date && typeof orderData.return_date === 'string') {
				orderData.return_date = new Date(orderData.return_date).getTime();
			}
			// 处理产品快照中的出发日期
			if (orderData.product_snapshot && orderData.product_snapshot.departure_date && typeof orderData.product_snapshot.departure_date === 'string') {
				orderData.product_snapshot.departure_date = new Date(orderData.product_snapshot.departure_date).getTime();
			}
			
			console.log('[云对象] 创建订单，用户ID:', checkResult.uid);
			console.log('[云对象] 处理后的订单数据:', JSON.stringify(orderData, null, 2));

			// 创建订单
			const result = await db.collection('a-orders').add(orderData);

			if (result.id) {
				return {
					errCode: 0,
					errMsg: '订单创建成功',
					data: {
						...orderData,
						_id: result.id
					}
				};
			} else {
				return {
					errCode: 500,
					errMsg: '订单创建失败'
				};
			}

		} catch (error) {
			console.error('[云对象] 创建订单失败:', error);
			return {
				errCode: 500,
				errMsg: error.message || '创建订单时发生错误'
			};
		}
	}
}; 