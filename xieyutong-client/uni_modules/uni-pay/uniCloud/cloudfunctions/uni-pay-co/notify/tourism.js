'use strict';
/**
 * tourism.js - 旅游订单支付成功回调逻辑
 */
module.exports = async (obj) => {
	let user_order_success = true;
	let { data = {} } = obj;
	let {
		order_no, // 业务订单号 TRIP_1759133344752_U42K30
		out_trade_no, // 支付订单号
		total_fee // 支付金额（分）
	} = data;

	// 此处写你自己的支付成功逻辑开始-----------------------------------------------------------
	try {
		console.log(`[tourism.js] 开始处理旅游订单支付回调，业务订单号: ${order_no}, 支付订单号: ${out_trade_no}`);
		
		if (!order_no) {
			console.error('[tourism.js] 错误：未找到业务订单号');
			return false;
		}
		
		// 直接更新订单状态
		const db = uniCloud.database();
		const orderCollection = db.collection('a-orders'); // 你的订单表名
		
		// 根据 order_no 更新订单状态为 paid
		const updateRes = await orderCollection.where({
			order_no: order_no
		}).update({
			status: 'paid',
			updated_at: Date.now()
		});
		
		console.log(`[tourism.js] 业务订单 ${order_no} 状态更新结果:`, updateRes);
		
		if (updateRes.updated === 1) {
			console.log(`[tourism.js] 订单状态更新成功: ${order_no} -> paid`);
			user_order_success = true;
		} else {
			console.error(`[tourism.js] 订单状态更新失败，未找到订单或更新条数为0: ${order_no}`);
			user_order_success = false;
		}
		
	} catch (error) {
		console.error('[tourism.js] 处理支付回调时发生异常:', error);
		user_order_success = false;
	}
	// 此处写你自己的支付成功逻辑结束-----------------------------------------------------------
	
	return user_order_success;
};