// attendant-notifier/index.obj.js

const WEBHOOK_URLS = {
	// 1. 分单群
	FENDANQUN: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=6f3a3381-aeda-48ef-91cb-339ff71a7b41',

	// 2. 消息群
	XIAOXIQUN: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=3809926e-8732-4eef-9165-713497f538e6'
};

function getParams(ctx, params, keyField) {
	let input = params;

	// 1. 如果 params 中已经包含关键字段，直接返回
	if (input && input[keyField]) {
		return input;
	}

	// 2. 尝试从 HTTP Body 中解析
	try {
		const httpInfo = ctx.getHttpInfo();
		if (httpInfo && httpInfo.body) {
			let bodyStr = httpInfo.body;
			// 处理 Base64 编码 (虽然日志显示 false，但加上更保险)
			if (httpInfo.isBase64Encoded) {
				bodyStr = Buffer.from(bodyStr, 'base64').toString('utf-8');
			}
			// 解析 JSON
			const parsed = JSON.parse(bodyStr);
			console.log(`[DEBUG] Body解析成功，找到 ${keyField}:`, !!parsed[keyField]);
			return parsed;
		}
	} catch (e) {
		console.error('[ERROR] Body解析失败:', e);
	}

	// 3. 还是没找到，返回原始 params 或空对象
	return input || {};
}

notifier = {
	_before: function () {},

	/**
	 * 发送 Webhook 消息到企业微信群
	 * @param {String} content 消息内容
	 * @param {Array} mentionedMobileList 需要@的人的手机号列表
	 */
	async _sendWebhook(content, mentionedMobileList = [], targetUrl = WEBHOOK_URLS.FENDANQUN) {
		const payload = {
			msgtype: 'text',
			text: {
				content: content,
				// 企业微信群机器人支持直接通过手机号 @群成员，无需 UserID
				mentioned_mobile_list: mentionedMobileList
			}
		};

		try {
			const res = await uniCloud.httpclient.request(targetUrl, {
				method: 'POST',
				contentType: 'json',
				dataType: 'json',
				data: payload
			});
			console.log('Webhook发送结果:', res.data);
			return res.data;
		} catch (e) {
			console.error('Webhook发送失败:', e);
			return { errCode: 500, errMsg: e.message };
		}
	},

	/**
	 * 场景1：通知管理员（调度员）有新订单
	 * 对应前端：saveCustomer 中的调用
	 */
	async notifyAdminNewOrder(params) {
		const { customerName, orderId, salesName, remarks } = params;
		const content = `🔔 [新单待分配]\n\n客户姓名：${customerName}\n订单编号：${orderId}\n所属销售：${salesName || '未分配'}\n订单备注：${
			remarks || '无'
		}\n\n请及时登录后台分配管家。`;

		// 如果你想在群里 @管理员，可以在第二个参数填入管理员手机号，例如 ['13800138000']
		// 否则留空即可，所有群成员都能看到
		return await notifier._sendWebhook(content, ['15708002739']);
	},

	/**
	 * 场景2：通知管家有新任务
	 * 对应前端：saveAssign 中的调用
	 */
	async notifyAttendantAssigned(params) {
		const { mobile, orderId, departureDateStr, customerName } = params;

		if (!mobile) {
			return { errCode: 1, errMsg: '管家无手机号，无法通过机器人@提醒' };
		}

		const content = `📋 [新任务派发]\n\n您已被分配新的管家任务！\n\n订单编号：${orderId}\n客户姓名：${
			customerName || '详见订单'
		}\n出发日期：${departureDateStr}\n\n请做好行前准备！`;

		// 传入管家手机号，机器人会在群里专门 @这位管家
		return await notifier._sendWebhook(content, [mobile]);
	},

	/**
	 * 场景3：发送任务多次重试失败，通知管家介入
	 * 修改点：通过 agentId 查库获取手机号；显示预订发送时间
	 */
	async notifyTaskFailed(params) {
		const input = getParams(this, params, 'agentId');
		const { agentId, groupName, sendTime, errorMsg } = input;
		console.log('params: ', input);

		// 1. 根据 agentId (uni-id-users 的 _id) 查找手机号
		let mobile = '';
		if (agentId) {
			const db = uniCloud.database();
			try {
				const userRes = await db.collection('uni-id-users').doc(agentId).field({ mobile: 1, username: 1, nickname: 1 }).get();

				console.log('userRes: ', userRes);
				if (userRes.data && userRes.data.length > 0) {
					mobile = userRes.data[0].mobile;
				}
			} catch (e) {
				console.error('查找管家手机号失败:', e);
			}
		}

		// 2. 确定任务时间描述
		// 如果 sendTime 存在则显示，否则显示“立即发送”
		const timeDesc = sendTime ? `预订时间：${sendTime}` : '任务类型：即时发送';

		const content = `⚠️ [发送失败报警]\n\n检测到行中任务消息发送连续重试失败，请人工介入处理！\n\n目标群：${groupName}\n${timeDesc}\n错误原因：${
			errorMsg || '未知错误'
		}\n\n该任务已停止自动发送。`;
		console.log('content: ', content);

		// 3. 发送 Webhook
		if (mobile) {
			return await notifier._sendWebhook(content, [mobile], WEBHOOK_URLS.XIAOXIQUN);
		} else {
			// 如果没找到手机号，就只发消息不艾特，或者你可以选择艾特管理员
			console.warn(`未找到ID为 ${agentId} 的手机号，发送不带@的报警`);
			return await notifier._sendWebhook(content, [], WEBHOOK_URLS.XIAOXIQUN);
		}
	},

	/**
	 * 场景4：用户留言通知管家
	 */
	async notifyUserRemark(params) {
		const { orderId, customerName, customerMobile, remark, attendantMobile } = params;

		const content = `💬 [客人新留言]\n\n订单编号：${orderId}\n客人：${customerName || '未命名'} (${customerMobile || '无号码'})\n\n留言内容：\n${remark}\n\n请管家及时跟进！`;

		// 如果有管家手机号，则@管家
		const mentionedList = attendantMobile ? [attendantMobile] : [];
		return await notifier._sendWebhook(content, mentionedList);
	},

	/**
	 * 场景5：天气已预加载，通知管家校对
	 */
	async notifyWeatherCheck(params) {
		const { mobile, groupName, weatherText, taskTime } = params;

		if (!mobile) return { errCode: 0, msg: '无管家手机号，跳过通知' };

		const content = `🌤️ [天气预报已更新]\n\n目标群：${groupName}\n预订发送：${taskTime}\n\n已自动拉取“明日提醒”的天气部分：\n“${weatherText}”\n\n请确认内容无误，如有问题请及时手动调整。`;

		return await notifier._sendWebhook(content, [mobile], WEBHOOK_URLS.XIAOXIQUN);
	}
};

module.exports = notifier;
