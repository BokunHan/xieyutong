const db = uniCloud.database();
const dbCmd = db.command;

const DEEPSEEK_API_KEY = 'sk-43daeda4c8ab49408753c243b01f81d5';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// 提取一个通用的解析函数，避免代码重复
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

// 日期计算：计算任务时间是行程的第几天 (Day 1, Day 2...)
function getTripDayIndex(taskTimeStr, departureTimestamp) {
	try {
		const taskDate = new Date(taskTimeStr.split('\n')[0].replace(/-/g, '/'));
		const depDate = new Date(departureTimestamp);
		// 设置为当天的 00:00:00 进行比较
		taskDate.setHours(0, 0, 0, 0);
		const depDateZero = new Date(depDate);
		depDateZero.setHours(0, 0, 0, 0);

		const diffTime = taskDate.getTime() - depDateZero.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays + 1; // Day 1 是出发当天
	} catch (e) {
		return 1;
	}
}

// 发送时间调整：限制在 09:00 - 21:00，否则顺延
function adjustSendTime(timeStr, rangeEndStr) {
	try {
		let d = new Date(timeStr);
		const hour = d.getHours();

		// 如果早于 09:00 -> 设为当天 09:00
		if (hour < 9) {
			d.setHours(9, 0, 0, 0);
		}
		// 如果晚于 21:00 -> 设为第二天 09:00
		else if (hour >= 21) {
			d.setDate(d.getDate() + 1);
			d.setHours(9, 0, 0, 0);
		}

		if (rangeEndStr) {
			const endDate = new Date(rangeEndStr);
			// 如果调整后的时间 晚于 截止时间
			if (d > endDate) {
				// 如果推迟后超时了，就保持原始时间（即不推迟，确保能发出去）
				return timeStr;
			}
		}

		// 格式化回 YYYY-MM-DD HH:mm:ss
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const da = String(d.getDate()).padStart(2, '0');
		const h = String(d.getHours()).padStart(2, '0');
		const min = String(d.getMinutes()).padStart(2, '0');
		const s = String(d.getSeconds()).padStart(2, '0');
		return `${y}-${m}-${da} ${h}:${min}:${s}`;
	} catch (e) {
		return timeStr; // 解析失败则返回原值
	}
}

// 基础文本清洗
function cleanText(text) {
	if (!text) return '';
	let res = text.replace(/^"|"$/g, '').trim();
	res = res.replace(/复制文字/g, '').trim();

	if (res.includes('示例1') || res.includes('示例 1')) {
		const parts = res.split(/示例\s*\d+[：:]/);
		if (parts.length > 1 && parts[1].trim()) {
			res = parts[1].trim();
		}
	}

	return res;
}

// 称呼替换
function replaceTravelers(text, travelers) {
	if (!text) return '';

	let nameStr = '尊敬的旅客';
	if (travelers && travelers.length > 0) {
		nameStr = travelers
			.slice(0, 2)
			.map((t) => {
				// 清洗名字
				const rawName = t.name
					.replace(/[\d]+岁.*/g, '')
					.replace(/\(.*\)/g, '')
					.trim();
				// 判断性别
				let title = '';
				if (t.gender_type) {
					if (t.gender_type.includes('男')) title = '先生';
					else if (t.gender_type.includes('女')) title = '女士';
				}
				return rawName + title;
			})
			.join('、');

		if (travelers.length > 2) nameStr += '等';
		nameStr += '，您好';
	}

	return text
		.replace(/xx先生\/女士/g, nameStr)
		.replace(/x先生\/女士/g, nameStr)
		.replace(/李先生/g, nameStr)
		.replace(/亲爱的.*?您/g, `亲爱的 ${nameStr}，您`);
}

function getTripDate(departureTimestamp, dayIndex) {
	try {
		const dep = new Date(departureTimestamp);
		// dayIndex 1 = 出发当天, dayIndex 2 = 出发+1天
		dep.setDate(dep.getDate() + (dayIndex - 1));
		return `${dep.getMonth() + 1}月${dep.getDate()}日`;
	} catch (e) {
		return '';
	}
}

function getSeason(dateTimestamp) {
	const month = new Date(dateTimestamp).getMonth() + 1;
	if (month >= 3 && month <= 5) return 'spring';
	if (month >= 6 && month <= 8) return 'summer';
	if (month >= 9 && month <= 11) return 'autumn';
	return 'winter';
}

function getMealTypes(itinerary) {
	const meals = new Set();
	itinerary.forEach((d) =>
		d.activities?.forEach((a) => {
			if (a.elementType === 'restaurant' && a.elementData?.meal_type) {
				meals.add(a.elementData.meal_type);
			}
		})
	);
	return meals.size > 0 ? Array.from(meals).join('、') : '中式餐饮';
}

// 判断是否含老人/儿童
function getTravelerComposition(travelers) {
	let hasElderly = false;
	let hasChild = false;
	const currentYear = new Date().getFullYear();

	if (travelers) {
		travelers.forEach((t) => {
			if (t.name.includes('老') || t.name.includes('60岁')) hasElderly = true;
			if (t.name.includes('儿') || t.name.includes('童') || t.name.includes('小')) hasChild = true;

			if (t.birthday) {
				const birthYear = new Date(t.birthday).getFullYear();
				const age = currentYear - birthYear;
				if (age >= 60) hasElderly = true;
				if (age <= 12) hasChild = true;
			}
		});
	}
	return { hasElderly, hasChild };
}

function formatDate(dateInput) {
	try {
		const d = new Date(dateInput);
		return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
	} catch (e) {
		return dateInput;
	}
}

// 获取当前北京时间字符串 (YYYY-MM-DD HH:mm:ss)
function getBjTimeStr() {
	const now = new Date();
	// 处理时区问题，强制转为 UTC+8
	const tzOffset = 8 * 60 * 60 * 1000;
	const time = now.getTime() + now.getTimezoneOffset() * 60 * 1000 + tzOffset;
	const d = new Date(time);

	const Y = d.getFullYear();
	const M = (d.getMonth() + 1).toString().padStart(2, '0');
	const D = d.getDate().toString().padStart(2, '0');
	const h = d.getHours().toString().padStart(2, '0');
	const m = d.getMinutes().toString().padStart(2, '0');
	const s = d.getSeconds().toString().padStart(2, '0');
	return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

const serviceModule = {
	_before: function () {
		// 鉴权逻辑
	},

	/**
	 *  同步本地企业微信账号列表
	 */
	async updateAccounts(params) {
		const input = getParams(this, params, 'accounts');
		const accounts = input.accounts; // 格式: ["大号", "小号"]

		if (!accounts || !Array.isArray(accounts)) {
			return { errCode: 1, msg: 'Invalid accounts list' };
		}

		console.log(`[Sync] 收到本地账号上报: ${accounts.join(', ')}`);
		let addedCount = 0;

		for (const name of accounts) {
			if (!name) continue;
			// 查一下是否存在，不存在才添加 (避免重复)
			const check = await db.collection('a-task-accounts').where({ name: name }).count();
			if (check.total === 0) {
				await db.collection('a-task-accounts').add({
					name: name,
					updated_at: Date.now()
				});
				addedCount++;
			} else {
				// 如果存在，更新一下时间，表示这个号还活着
				await db.collection('a-task-accounts').where({ name: name }).update({
					updated_at: Date.now()
				});
			}
		}

		return { errCode: 0, msg: `同步完成，新增 ${addedCount} 个账号` };
	},

	/**
	 * Python 启动时调用：获取账号配置（含 UserID）
	 */
	async getAccounts() {
		const res = await db.collection('a-task-accounts').field({ name: true, wx_userid: true }).get();
		return {
			errCode: 0,
			data: res.data // 返回 [{name: "大号", wx_userid: "ZhangSan"}, ...]
		};
	},

	/**
	 * 前端调用：触发指定账号的群同步
	 */
	async triggerSync(accountName) {
		if (!accountName) return { errCode: 1, errMsg: '请选择账号' };

		await db.collection('a-task-commands').add({
			type: 'sync_groups',
			account: accountName,
			status: 'pending'
		});

		return { errCode: 0, msg: '同步指令已发送，请稍候刷新列表' };
	},

	/**
	 * Python 轮询接口：获取下一个任务
	 */
	async getNextTask() {
		try {
			// === 优先级 0：查系统指令 ===
			const cmdRes = await db.collection('a-task-commands').where({ status: 'pending' }).orderBy('created_at', 'asc').limit(1).get();

			if (cmdRes.data.length > 0) {
				const cmd = cmdRes.data[0];
				// 领走指令后，标记为已完成（防止重复执行）
				await db.collection('a-task-commands').doc(cmd._id).update({ status: 'done' });
				return { type: 'command', data: cmd };
			}

			// 1. 查待发送消息
			const nowStr = getBjTimeStr(); // 获取当前时间
			console.log('获取下一个任务，当前时间：', nowStr);
			const sendRes = await db
				.collection('a-task-queue')
				.where({
					status: 'pending',
					// 必须是“发送时间 <= 当前时间”的任务才会被取出
					send_time: dbCmd.lte(nowStr)
				})
				.orderBy('priority', 'desc')
				.orderBy('send_time', 'asc')
				.limit(1)
				.get();

			if (sendRes.data.length > 0) {
				return { type: 'send', data: sendRes.data[0] };
			}

			// 2. 查待抓取订单
			const crawlRes = await db.collection('a-task-orders').where({ crawl_status: 'pending' }).orderBy('created_at', 'asc').limit(1).get();

			if (crawlRes.data.length > 0) {
				const task = crawlRes.data[0];
				// 标记为处理中
				await db.collection('a-task-orders').doc(task._id).update({
					crawl_status: 'processing'
				});
				return { type: 'crawl', data: task };
			}

			return { type: 'none', data: null };
		} catch (e) {
			console.error('获取任务出错:', e);
			return { type: 'none', data: null, error: e.message };
		}
	},

	/**
	 * Python 回传：更新发送状态
	 */
	async updateSendStatus(params) {
		// 使用通用解析函数，检查 task_id
		const input = getParams(this, params, 'task_id');
		const { task_id, status, error } = input;

		if (!task_id) {
			console.error('缺少 task_id, input:', input);
			return { errCode: 1, msg: 'Missing task_id' };
		}

		const updateData = { status, updated_at: Date.now() };
		if (error) updateData.error_msg = error;

		await db.collection('a-task-queue').doc(task_id).update(updateData);
		return { errCode: 0 };
	},

	/**
	 * Python 回传：上传爬虫抓取结果并触发AI生成
	 */
	async uploadCrawlResult(params) {
		// 使用通用解析函数，检查 order_id
		const input = getParams(this, params, 'order_id');
		const { order_id, status, data, error } = input;

		console.log(`[DEBUG] 上传抓取结果: OrderID=${order_id}, Status=${status}`);

		if (!order_id) {
			return { errCode: 1, msg: 'Missing order_id' };
		}

		// 查找对应订单的 _id
		const orderRes = await db.collection('a-task-orders').where({ order_id }).get();
		if (orderRes.data.length === 0) {
			console.error('未找到订单:', order_id);
			return { errCode: 1, msg: 'Order not found' };
		}

		const taskId = orderRes.data[0]._id;
		const updateData = {
			crawl_status: status === 'success' ? 'done' : 'failed',
			updated_at: Date.now()
		};

		if (status === 'success') {
			updateData.raw_data = data;
			updateData.ai_status = 'pending';
		} else {
			updateData.error_msg = error;
		}

		await db.collection('a-task-orders').doc(taskId).update(updateData);

		// === 【流水线逻辑】 ===
		if (status === 'success') {
			try {
				// 3. 检查快照是否存在
				const snapCheck = await db.collection('a-snapshots').where({ order_id }).count();

				if (snapCheck.total === 0) {
					console.log(`[RPA] 订单 ${order_id} 缺少快照，准备触发同步...`);

					await db.collection('a-task-orders').doc(taskId).update({ snapshot_status: 'syncing' });

					// 3.1 从爬虫数据中提取 URL 和 日期
					// 假设 data[0] 是 context 信息 (根据 crawler 逻辑)
					let snapshotUrl = '';
					let departureDate = '';

					if (data && data.length > 0) {
						// 尝试从第一项(order_context)获取
						const context = data[0].order_context || {};
						snapshotUrl = context.snapshot_url;
						departureDate = context.trip_dates;
					}

					if (snapshotUrl && departureDate) {
						// 3.2 调用同步云函数
						const syncRes = await uniCloud.callFunction({
							name: 'ctrip-sync-service',
							data: {
								action: 'syncSnapshot',
								snapshot_url: snapshotUrl,
								departure_date: departureDate
							}
						});

						if (syncRes.result && syncRes.result.errCode === 0) {
							console.log(`[RPA] 快照同步成功，准备生成 AI 队列`);
							await db.collection('a-task-orders').doc(taskId).update({ snapshot_status: 'done' });
						} else {
							console.error(`[RPA] 快照同步失败:`, syncRes.result);
							await db.collection('a-task-orders').doc(taskId).update({ snapshot_status: 'failed' });
							// 即使同步失败，也可以尝试生成(可能会缺数据)，或者直接返回
						}
					} else {
						console.error(`[RPA] 无法同步快照：爬虫数据中缺失 url 或 日期`);
						await db.collection('a-task-orders').doc(taskId).update({ snapshot_status: 'failed', error_msg: '爬虫未获取到快照URL' });
					}
				} else {
					console.log(`[RPA] 快照已存在，直接进入 AI 生成`);
					await db.collection('a-task-orders').doc(taskId).update({ snapshot_status: 'done' });
				}

				// 4. 无论是否刚同步过，都触发 AI 队列生成
				// (generateQueue 内部会再次查库，确保读到最新快照)
				await db.collection('a-task-orders').doc(taskId).update({ ai_status: 'processing' });
				const aiRes = await serviceModule.generateQueue(taskId);
				console.log(`[RPA] AI 生成结果:`, aiRes);
				if (aiRes.errCode !== 0) {
					await db.collection('a-task-orders').doc(taskId).update({ ai_status: 'failed', error_msg: aiRes.errMsg });
				}

				return { errCode: 0, msg: 'Crawl processed & AI triggerd', ai_result: aiRes };
			} catch (err) {
				console.error(`[RPA] 后置处理流水线异常:`, err);
			}
		}

		return { errCode: 0 };
	},

	/**
	 * 前端手动重试：同步快照
	 */
	async retrySnapshot(taskId) {
		if (!taskId) return { errCode: 1, msg: 'Missing taskId' };

		const orderRes = await db.collection('a-task-orders').doc(taskId).get();
		if (orderRes.data.length === 0) return { errCode: 1, msg: 'Order not found' };
		const taskOrder = orderRes.data[0];

		// 从 raw_data 中找 URL
		let snapshotUrl = '';
		let departureDate = '';
		if (taskOrder.raw_data && taskOrder.raw_data.length > 0) {
			const context = taskOrder.raw_data[0].order_context || {};
			snapshotUrl = context.snapshot_url;
			departureDate = context.trip_dates;
		}

		if (!snapshotUrl) return { errCode: 1, msg: '未找到快照URL，请先重新抓取' };

		await db.collection('a-task-orders').doc(taskId).update({ snapshot_status: 'syncing' });

		try {
			const syncRes = await uniCloud.callFunction({
				name: 'ctrip-sync-service', // 替换为你实际的云函数名
				data: {
					action: 'syncSnapshot',
					snapshot_url: snapshotUrl,
					departure_date: departureDate
				}
			});

			if (syncRes.result && syncRes.result.errCode === 0) {
				await db.collection('a-task-orders').doc(taskId).update({ snapshot_status: 'done' });
				return { errCode: 0, msg: '同步成功' };
			} else {
				throw new Error(syncRes.result?.errMsg || '同步服务返回错误');
			}
		} catch (e) {
			await db.collection('a-task-orders').doc(taskId).update({ snapshot_status: 'failed', error_msg: e.message });
			return { errCode: 500, msg: e.message };
		}
	},

	/**
	 * Python 定时：同步群列表
	 */
	async updateGroups(params) {
		// 使用通用解析函数，检查 groups
		const input = getParams(this, params, 'groups');
		const groups = input.groups;
		const accountName = input.account_name || '';

		if (!groups || !Array.isArray(groups)) {
			console.error('参数错误: groups 不是数组');
			return { errCode: 1, msg: 'Invalid parameters' };
		}

		if (!accountName) {
			console.error('参数错误: accountName 缺失');
			return { errCode: 1, msg: 'Missing accountName' };
		}

		console.log(`同步 ${groups.length} 个群组 (归属: ${accountName})...`);
		const results = { updated: 0, added: 0, errors: 0 };

		for (const group of groups) {
			try {
				const checkRes = await db.collection('a-task-groups').where({ chat_id: group.chat_id }).get();

				if (checkRes.data.length > 0) {
					await db.collection('a-task-groups').doc(checkRes.data[0]._id).update({
						name: group.name,
						member_count: group.member_count,
						owner: group.owner,
						account_name: accountName,
						updated_at: Date.now()
					});
					results.updated++;
				} else {
					await db.collection('a-task-groups').add({
						chat_id: group.chat_id,
						name: group.name,
						member_count: group.member_count,
						owner: group.owner,
						account_name: accountName,
						updated_at: Date.now()
					});
					results.added++;
				}
			} catch (err) {
				results.errors++;
			}
		}
		return { errCode: 0, details: results };
	},

	/**
	 * 核心方法：触发 AI 生成队列
	 * @param {String} taskId  a-task-orders 表的 _id
	 */
	async generateQueue(taskId) {
		const fnStartTime = Date.now();
		if (!taskId) return { errCode: 400, errMsg: '缺少 Task ID' };
		console.log(`[RPA] 开始智能生成任务: ${taskId}`);

		// ================= 配置区域 =================
		const CONFIG = {
			// 白名单：只有标题包含这些关键词的任务才会被处理
			// 如果想放行所有，可以把这个数组设为 null 或 []，并在下方逻辑中去掉判断
			allowedKeywords: [
				'准备清单',
				'确认交通信息',
				'酒店周边提醒',
				'酒店内相关服务披露',
				'特殊景点',
				'确认司机/导游',
				'确认餐饮信息',
				'高海拔注意事项',
				'摄影需求',
				'长者关怀',
				'目的地建议携带',
				'明日提醒',
				'自由活动玩法推荐',
				'伴手礼/特色商品推荐',
				'餐厅推荐',
				'落地关怀'
			],

			// 内容覆写：精确匹配任务名（或关键词），强制替换为指定文本
			contentOverrides: {
				特殊景点:
					'明天就要出行啦~记得随身携带好身份证件哦~西藏地域辽阔，车程都相对较长，今天可以为自己备一些巧克力士力架或葡萄糖,西藏会消耗较多体力,这些高热量食品能较快的补充人体所需能量。随车多备件厚外套,旅途中上下车风大，温差大，以便及时添衣预防感冒。我们为您们在车上准备了随车备品:氧气罐、矿泉水等,如果有身体不适咱们就及时吸氧哦~',
				确认餐饮信息: '我们想了解一下您的口味偏好。请问您对饮食有具体的偏好吗？是否有饮食禁忌或特殊要求，如有请告知我们，以便届时师傅可以为您推荐更合适的餐饮选择~'
			},

			// 自定义新增任务：每次生成都会强制插入这些任务
			customTasks: [
				{
					task_name: '长者关怀',
					start_time_offset: -5, // 距离行程开始第几天 (0代表出发当天)
					send_hour: '08:33:25', // 发送时间
					payload: [
						{
							type: 'text',
							data: '您好，非常感谢您选择我们的西藏私家团出行。注意到咱们这次有长者随行，西藏是一片值得用心感受的净土，同时长辈的健康与安全也是我们的幸挂。由于高原环境的特殊性，为了让您的旅程更加安心、舒适，我们特别为您升级了【长者关怀服务】，并提前与您沟通以下注意事项，感谢您的理解与配合❤️'
						}
					]
				},
				{
					task_name: '长者关怀',
					start_time_offset: -5, // 距离行程开始第几天 (0代表出发当天)
					send_hour: '08:35:37', // 发送时间
					payload: [
						{
							type: 'text',
							data: '西藏平均海拔较高，初到者可能出现轻微头痛、气短、乏力等高原反应。我们已为您和家人升级以下配置:\n1.随车升级配置:额外增加血气仪、医用气气瓶，供您随时监测身体状况;\n2.专业团队守护:管家和司机全程关注您的状态，及时提供帮助;\n3.行前健康关怀:行程出发前免费提供血压、血气基础检测。\n【特别说明】高原反应因人而异，我们的工作人员虽具备基础应急能力，但并非专业医护人员。若您感到明显不适，请务必第一时间告知我们，我们将协助您前往就近医疗机构。'
						}
					]
				},
				{
					task_name: '长者关怀',
					start_time_offset: -5, // 距离行程开始第几天 (0代表出发当天)
					send_hour: '08:36:52', // 发送时间
					payload: [
						{
							type: 'text',
							data: '如有高血压、心脏病、呼吸系统疾病等基础病，高原环境可能对您的身体提出更高要求。出于对您的负责，我们温馨建议您:\n1.行前确认:请咨询您的医生进行必要体检，确保身体状况适合高原旅行;\n2.提前告知: 若您有特殊健康情况，请务必提前告知我们，将为您提供更细致的服务安排。\n为了让您的旅程更加顺利，我们会在您抵达后，请您与司机师傅共同签署一份安全责任书。以代表您已充分了解高原旅行的注意事项，并便于我们为您提供更周全的保障。'
						}
					]
				}
			],

			// AI 模板配置：针对不同类型的任务，提供给 AI 的提示词模板
			aiTemplates: {
				weather_packing: `任务目标：根据查询到的天气（{weather_data}），为前往“{destination}”的旅客生成出行建议。

=== 输出格式演示 (请严格模仿) ===
🧥【穿衣建议】
近期气温较低，早晚温差大。建议您穿着厚外套、羽绒服，内搭毛衣。午后气温回升可适当减衣，注意防感冒。
🎒【必带物品】
1. 证件类：身份证、边防证
2. 生活类：墨镜、防晒霜、润唇膏、保温杯
3. 电子类：充电宝、相机
💝【贴心提示】
西藏海拔高，气候条件特殊，请务必注意保暖，避免感冒。活动时节奏放缓，多喝水，保证休息。祝您在雪域高原拥有一段平安、愉快而难忘的旅程！✨

=== 生成要求 ===
1. 语气要温暖贴心。
2. 根据真实天气数据调整建议内容。
3. 直接输出正文，不要包含任何客套话。`,
				tomorrow_brief: `任务目标：根据提供的【真实数据】，严格模仿【参考范文】的格式、Emoji使用和语气生成一段明日提醒。

=== 参考范文 (请学习此格式) ===
明日提醒：
🌄 【行程】
拉萨/林芝（机场接机）-雅鲁藏布大峡谷-南迦巴瓦峰观日落-索松村
🚗 【行车】
总车程约490公里，行车时间约6-7小时（具体视路况而定）。
🏞️ 【景点简介】
江河汇流：观赏尼洋河与雅鲁藏布江交汇的壮丽景象。
雅鲁藏布大峡谷：游览世界第一大峡谷，体验自然奇观。
南迦巴瓦峰：十人九不遇羞女峰，有机会观赏日落时分“日照金山”（视天气情况而定）。
索松村：直面南迦巴瓦峰的绝佳观景村落。
🏨 【入住信息】
索松村平措康桑雪里桃花度假庄园 | 海拔约3000米
🌡️ 【天气与海拔提示】
明日气温约0-7℃，昼夜温差大，请注意防风保暖。

在旅途中有任何问题都可以与我们联系反馈，我们将第一时间为您们解决~
=== 参考范文结束 ===

=== 真实数据 (请用这些内容替换范文) ===
{real_data_content}

=== 生成要求 ===
1. 必须保留范文中的所有标题（如🌄 【行程】）和Emoji。
2. 仅替换内容，不要改变结构。
3. 直接输出结果，不要包含任何客套话。`
			}
		};
		// ===============================================================

		try {
			// ================= 1. 数据准备 =================
			const taskRes = await db.collection('a-task-orders').doc(taskId).get();
			if (!taskRes.data || taskRes.data.length === 0) return { errCode: 404, errMsg: '任务不存在' };
			const taskOrder = taskRes.data[0];
			const executeAccount = taskOrder.account_name || '';
			let groupName = taskOrder.order_id; // 直接搜索订单号来确定目标群

			const snapshotRes = await db.collection('a-snapshots').where({ order_id: taskOrder.order_id }).limit(1).get();
			if (!snapshotRes.data || snapshotRes.data.length === 0) return { errCode: 404, errMsg: '未找到行程快照' };
			const snapshot = snapshotRes.data[0];

			const rawTasks = taskOrder.raw_data || [];
			const context = rawTasks.find((x) => x.order_context)?.order_context || {};
			const flights = context.flights || [];
			const travelers = context.travelers || [];
			const itinerary = snapshot.itinerary || [];
			const departureDate = snapshot.departure_date;
			const depDateStr = new Date(departureDate).toISOString().split('T')[0];
			const season = getSeason(departureDate);

			const finalQueue = [];
			const aiRequests = [];
			const dailyScheduleTracker = {};

			// 计数器 { "Day1_line": 0, "Day1_photo": 0 }
			let dayCounters = {};

			console.log('flights: ', flights);

			// 调用 a-weather 云函数查询天气
			let weatherText = '暂无天气数据';
			try {
				const wRes = await uniCloud.callFunction({
					name: 'a-weather',
					data: {
						action: 'getWeatherByCityName',
						cityName: snapshot.destination_city || '拉萨', // 默认城市
						extensions: 'all' // 获取预报
					}
				});

				if (wRes.result.errCode === 0 && wRes.result.data?.casts) {
					const allCasts = wRes.result.data.casts;

					// 1. 计算出发日期的 YYYY-MM-DD (修正时区，确保是北京时间)
					const depObj = new Date(snapshot.departure_date);
					const localDepTime = depObj.getTime() + depObj.getTimezoneOffset() * 60 * 1000;
					const localDepDate = new Date(localDepTime);
					const Y = localDepDate.getFullYear();
					const M = String(localDepDate.getMonth() + 1).padStart(2, '0');
					const D = String(localDepDate.getDate()).padStart(2, '0');
					const targetDateStr = `${Y}-${M}-${D}`; // 目标日期：出发当天

					console.log(`[RPA] 正在匹配天气，出发日期: ${targetDateStr}`);

					// 2. 在预报列表中查找出发日期
					const startIndex = allCasts.findIndex((c) => c.date === targetDateStr);

					let targetCasts = [];
					if (startIndex !== -1) {
						// 3. 如果找到了，就从出发日期开始取 3 天
						targetCasts = allCasts.slice(startIndex, startIndex + 3);
					} else {
						// 4. 如果没找到（通常是因为行程在4天以后，或者已经是过去式）
						// 为了不误导用户，这里可以选择置空，或者记录日志
						console.warn(`[RPA] 天气预报范围(${allCasts[0].date}~${allCasts[allCasts.length - 1].date}) 未覆盖出发日期 ${targetDateStr}`);
						// 这种情况下，weatherText 保持默认的 '暂无天气数据' 也许比给错的要好
						// 或者你可以根据需求决定是否要 fallback 到 allCasts.slice(0, 3)
					}

					if (targetCasts.length > 0) {
						const forecasts = targetCasts.map((c) => `${c.date}: ${c.dayweather}, ${c.nighttemp}~${c.daytemp}℃`).join('; ');
						weatherText = forecasts;
					}
				}
			} catch (e) {
				console.error('[RPA] 天气查询失败:', e);
			}

			// 辅助函数：判断是否在白名单
			const isAllowed = (name) => {
				if (!CONFIG.allowedKeywords || CONFIG.allowedKeywords.length === 0) return true;
				return CONFIG.allowedKeywords.some((kw) => name.includes(kw));
			};

			// 辅助函数：处理文本换行和格式化
			const processTextPayload = (text) => {
				if (!text) return text;
				let processed = cleanText(text);

				// 替换旅行者名称（如果有这个需求，保持现有逻辑）
				processed = replaceTravelers(processed, travelers);

				// 核心：强制在数字序号前加换行，以应对微信/小程序排版问题
				// (\d+): 匹配一个或多个数字 (如 1, 2)
				// (?:\ufe0f)?: 匹配可选的 emoji 变体选择符 (如 2️)
				// \.: 匹配句点
				// $1: 替换为换行符 + 捕获到的匹配内容
				processed = processed.replace(/(\d+(?:\ufe0f)?\.)/g, '\n$1');

				// 清理多余的连续换行
				processed = processed.replace(/\n\n+/g, '\n\n');

				return processed;
			};

			const allNamesToQuery = new Set();

			// 收集景点名和酒店名
			itinerary.forEach((day) => {
				if (day.activities) {
					day.activities.forEach((act) => {
						if (act.elementType === 'scenic' && act.elementData?.scenic_spots) {
							act.elementData.scenic_spots.forEach((s) => allNamesToQuery.add(s.name));
						}
						if (act.elementType === 'hotel' && act.elementData?.hotelName) {
							allNamesToQuery.add(act.elementData.hotelName);
						}
					});
				}
			});

			let settingsMap = {}; // 格式: { "KeyName": [item1, item2] }
			if (allNamesToQuery.size > 0) {
				const settingRes = await db.collection('a-task-settings').limit(1000).get();

				if (settingRes.data) {
					settingRes.data.forEach((item) => {
						if (!settingsMap[item.key]) settingsMap[item.key] = [];
						settingsMap[item.key].push(item);
					});
				}
			}

			const totalDays = itinerary.length;
			const existingReminderDays = new Set();

			// 1. 记录已有的明日提醒是第几天
			rawTasks.forEach((t) => {
				if (t.name && t.name.includes('明日提醒')) {
					const dIndex = getTripDayIndex(t.start, snapshot.departure_date);
					existingReminderDays.add(dIndex);
				}
			});

			// 2. 遍历行程 Day 1 到 Day N-1，缺失则补全
			for (let i = 1; i < totalDays; i++) {
				if (!existingReminderDays.has(i)) {
					// 计算日期：出发日期 + (第i天 - 1)
					const d = new Date(snapshot.departure_date);
					d.setDate(d.getDate() + (i - 1));

					// 格式化为 YYYY-MM-DD
					const Y = d.getFullYear();
					const M = String(d.getMonth() + 1).padStart(2, '0');
					const D = String(d.getDate()).padStart(2, '0');

					// 生成随机时间 17:00 - 17:59
					const randMin = Math.floor(Math.random() * 60);
					const timeStr = `${Y}-${M}-${D} 17:${String(randMin).padStart(2, '0')}:00`;

					console.log(`[RPA] 自动补全 Day ${i} 的明日提醒: ${timeStr}`);

					// 插入到 rawTasks 队列，等待下方循环处理
					rawTasks.push({
						name: '明日提醒',
						start: timeStr,
						end: timeStr,
						template: { text: '', image: '' }, // 内容为空，交由后续 AI 生成逻辑填充
						score: ''
					});
				}
			}

			// ================= 2. 任务遍历与分流 =================
			for (const task of rawTasks) {
				if (task.order_context) continue;

				const taskName = task.name || '未命名任务';
				const taskScore = task.score || '';

				// if (!isAllowed(taskName)) {
				// 	console.log(`[RPA] 任务 "${taskName}" 不在白名单中，跳过。`);
				// 	continue;
				// }

				const startStr = task.start || '';
				const endStr = task.end || '';
				const cleanStart = startStr.split('\n')[0];
				const cleanEnd = endStr.split('\n')[0];

				const dayIndex = getTripDayIndex(startStr, snapshot.departure_date);
				const dayKey = `Day${dayIndex}`;
				const isLastDay = dayIndex >= snapshot.total_days;
				const isReturnPhase = dayIndex >= snapshot.total_days - 2;

				let templateText = cleanText(task.template?.text || '');
				let templateImage = task.template?.image || '';

				let finalSendTimeStr = '';
				const datePart = cleanStart.split(' ')[0]; // 获取 YYYY-MM-DD

				// 逻辑分支 A: 明日提醒 (17:00 - 18:00)
				if (taskName.includes('明日提醒')) {
					const h = 17;
					const m = Math.floor(Math.random() * 60); // 0-59随机分
					// 简单拼凑时间字符串
					finalSendTimeStr = `${datePart} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
				}
				// 逻辑分支 B: 普通任务
				else {
					// 解析原始建议时间
					let targetDate = new Date(cleanStart);
					let h = targetDate.getHours();

					// 规则(1): 强制修正到 09:00 - 21:00
					if (h < 9 || h >= 21) {
						targetDate.setHours(9, 0, 0, 0);
					}

					// 获取修正后的基础时间戳
					let baseTimeMs = targetDate.getTime() + Math.floor(Math.random() * 10 * 60 * 1000);

					// 规则(3): 防重叠逻辑
					// 如果这一天已经安排过任务，新任务必须在 (上个任务时间 + 30分钟) 之后
					const lastTimeForThisDay = dailyScheduleTracker[datePart];
					if (lastTimeForThisDay) {
						const minNextTime = lastTimeForThisDay + Math.floor(Math.random() * 20 * 60 * 1000); // 上个任务 + 30分钟内随机
						if (baseTimeMs < minNextTime) {
							baseTimeMs = minNextTime; // 顺延
						}
					}

					// 规则(2): 在基准时间后的 30分钟内随机
					// const randomDelayMs = Math.floor(Math.random() * 30 * 60 * 1000);
					const finalTimeMs = baseTimeMs;

					// 更新该日期的占用记录
					dailyScheduleTracker[datePart] = finalTimeMs;

					// 转回格式化字符串
					const d = new Date(finalTimeMs);
					// 注意：这里需处理时区，如果服务器是UTC，需+8，如果是本地时间直接转
					// 简单做法：
					const Y = d.getFullYear();
					const M = String(d.getMonth() + 1).padStart(2, '0');
					const D = String(d.getDate()).padStart(2, '0');
					const H = String(d.getHours()).padStart(2, '0');
					const Min = String(d.getMinutes()).padStart(2, '0');
					const S = String(d.getSeconds()).padStart(2, '0');
					finalSendTimeStr = `${Y}-${M}-${D} ${H}:${Min}:${S}`;
				}

				templateText = replaceTravelers(templateText, travelers);

				// 规则：凡是出现 "1." "2️." (含Emoji变体) 等序号，强制在前面加换行
				if (templateText) {
					templateText = templateText.replace(/(\d+(?:\ufe0f)?\.)/g, '\n$1');
				}

				let processedPayload = [];
				let skipTask = false;
				let isAiTask = false;

				// 判断是否内容覆写
				let isOverridden = false;
				for (const [key, value] of Object.entries(CONFIG.contentOverrides)) {
					if (taskName.includes(key)) {
						processedPayload.push({ type: 'text', data: value });
						isOverridden = true;
						break;
					}
				}

				if (!isOverridden) {
					// --- 正常逻辑处理 ---

					// 明日提醒 + 路线导览图 (Route Map Image)
					if (taskName.includes('明日提醒')) {
						const nextDay = dayIndex + 1;
						const nextDayData = itinerary.find((d) => d.day === nextDay);

						if (nextDayData) {
							// 预处理：收集需要查询的 POI ID
							const poiIdsToFetch = [];
							const scenicSpotsList = []; // 暂存景点引用，方便后续回填
							let hotelInfoStr = '待定';

							if (nextDayData.activities) {
								nextDayData.activities.forEach((act) => {
									// 收集景点 ID
									if (act.elementType === 'scenic' && act.elementData?.scenic_spots) {
										act.elementData.scenic_spots.forEach((spot) => {
											scenicSpotsList.push(spot); // 存下来引用
											if (spot.linked_poi_id) {
												poiIdsToFetch.push(spot.linked_poi_id);
											}
										});
									}
									// 收集酒店名称
									if (act.elementType === 'hotel') {
										hotelInfoStr = act.elementData?.hotelName || '待定';
									}
								});
							}

							// 数据库查询：批量获取 POI 详情 (Description & Image)
							const poiDetailMap = {}; // ID -> { description, image }
							if (poiIdsToFetch.length > 0) {
								try {
									const dbCmd = db.command;
									const poiRes = await db
										.collection('a-poi-database')
										.where({ _id: dbCmd.in(poiIdsToFetch) })
										.field({ description: true, route_map_image: true })
										.get();

									if (poiRes.data) {
										poiRes.data.forEach((p) => {
											poiDetailMap[p._id] = p;
										});
									}
								} catch (e) {
									console.error('[RPA] POI数据库查询失败:', e);
								}
							}

							// 构建喂给 AI 的“真实数据”字符串
							const routeStr = nextDayData.day_title || '无详细路线';

							// 构建景点列表字符串
							const spotsDescriptionStr = scenicSpotsList
								.map((spot) => {
									let desc = '暂无简介';
									// 如果有关联POI且查到了数据
									if (spot.linked_poi_id && poiDetailMap[spot.linked_poi_id]) {
										const rawDesc = poiDetailMap[spot.linked_poi_id].description || '';

										// 【优化】去除 HTML 标签，并限制长度！
										// 1. 去除 HTML 标签
										let cleanDesc = rawDesc.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
										// 2. 截断文本 (例如只取前 200 字)，AI 写摘要足够了
										if (cleanDesc.length > 200) {
											cleanDesc = cleanDesc.substring(0, 200) + '...';
										}
										desc = cleanDesc || '暂无简介';
									}
									return `${spot.name}：${desc}`;
								})
								.join('\n');

							// --- 查找景点特殊注意事项 ---
							let specialNoticeStr = '';
							scenicSpotsList.forEach((spot) => {
								// 检查景点名是否包含该Key
								Object.keys(settingsMap).forEach((key) => {
									if (spot.name.includes(key)) {
										// 筛选 category 为 'notice' 的数据
										const notices = settingsMap[key].filter((x) => x.category === 'notice');
										notices.forEach((n) => {
											specialNoticeStr += `${n.content}\n`; // 拼接内容
										});
									}
								});
							});

							weatherText = '暂无天气数据';
							const strPieces = routeStr.split(' ');
							const locations = strPieces[0].split('-');
							const cityName = locations[locations.length - 1];
							console.log('cityName: ', cityName);
							try {
								const wRes = await uniCloud.callFunction({
									name: 'a-weather',
									data: {
										action: 'getWeatherByCityName',
										cityName: cityName || '拉萨', // 默认城市
										extensions: 'all' // 获取预报
									}
								});

								if (wRes.result.errCode === 0 && wRes.result.data?.casts) {
									// 提取未来几天天气，简化成字符串喂给 AI
									const forecasts = wRes.result.data.casts
										.slice(0, 3)
										.map((c) => `${c.date}: ${c.dayweather}, ${c.nighttemp}~${c.daytemp}℃`)
										.join('; ');
									weatherText = forecasts;
								}
							} catch (e) {
								console.error('[RPA] 天气查询失败:', e);
							}

							const isLastDayTarget = nextDay === totalDays;
							const realDataBlock = `
							        [行程路线]：${routeStr}
							        [景点详情]：\n${spotsDescriptionStr}
							        ${isLastDayTarget ? '' : `[入住酒店]：${hotelInfoStr}`}
							        [天气预报]：${weatherText}
											${specialNoticeStr ? `[特别提示]：\n${specialNoticeStr}` : ''}
							        `;

							let promptTemplate = CONFIG.aiTemplates.tomorrow_brief;
							if (isLastDayTarget) {
								promptTemplate = promptTemplate.replace(/🏨 【入住信息】[\s\S]*?(?=🌡️)/, '');
							}

							// 设置 AI 上下文
							isAiTask = true;
							aiContext = {
								type: 'tomorrow_brief',
								template: promptTemplate,
								params: {
									real_data_content: realDataBlock
								}
							};

							// 处理图片 (Route Map Image)
							// 只有当 a-poi-database 里查到了图片，才添加到 payload
							scenicSpotsList.forEach((spot) => {
								if (spot.linked_poi_id && poiDetailMap[spot.linked_poi_id]) {
									const poiData = poiDetailMap[spot.linked_poi_id];
									if (poiData.route_map_image && poiData.route_map_image.url) {
										console.log(`[RPA] 发现路线导览图: ${spot.name}`);
										processedPayload.push({ type: 'image', data: poiData.route_map_image.url });
									}
								}
							});
						} else {
							continue; // 没有明天行程，跳过
						}
					}

					// 天气查询 + AI 模板
					else if (taskName.includes('目的地建议携带')) {
						isAiTask = true;

						aiContext = {
							type: 'weather_packing',
							template: CONFIG.aiTemplates.weather_packing,
							params: {
								weather_data: weatherText,
								destination: snapshot.destination_city || '西藏'
							}
						};
					} else if (taskName.includes('交通信息')) {
						if (flights.length === 0) continue;

						let finalMsg = task.template?.text || '';

						let targetFlights = flights;
						if (isReturnPhase) {
							// 简单判断：过滤掉起飞日期是出发日期的航班，或者取数组后半部分
							// 这里假设 flights 数组顺序为 [去程, ..., 返程]
							targetFlights = flights.filter((f) => !f.dep_time.startsWith(depDateStr));
							if (targetFlights.length === 0) targetFlights = flights.slice(-1); // 兜底取最后一个
							// 强制重写模板为返程格式
							let msg = '尊敬的旅客，您好！大交通出行提醒：\n';
							targetFlights.forEach((f) => {
								msg += `您的返程航班 ${f.flight_no} 将于 ${f.dep_time} 从 ${f.route.split('-')[0]} 起飞，计划 ${f.arr_time} 抵达。`;
							});
							msg += '\n请您提前安排时间前往机场，祝您一路平安！';
							templateText = msg;
						} else {
							targetFlights = flights.slice(0, 1); // 仅去程
						}

						if (targetFlights.length > 0) {
							const f = targetFlights[0];
							finalMsg = finalMsg
								.replace(/#航班号#/g, f.flight_no || '')
								.replace(/#起飞时间#/g, f.dep_time || '')
								.replace(/#落地时间#/g, f.arr_time || '')
								.replace(/#出发城市#/g, f.route?.split('-')[0] || '')
								.replace(/#抵达城市#/g, f.route?.split('-')[1] || '')
								.replace(/#.*?#/g, ''); // 移除所有未替换的占位符
						}
						console.log('flights: ', flights);
						console.log('finalMsg: ', finalMsg);

						if (finalMsg) processedPayload.push({ type: 'text', data: processTextPayload(finalMsg) });

						// aiContext = {
						// 	type: 'transport',
						// 	flights: targetFlights,
						// 	origin: isLastDay ? snapshot.destination_city : '出发地',
						// 	destination: isLastDay ? '出发地' : snapshot.destination_city
						// };
					} else {
						// 普通任务，直接用原来的模板
						let templateText = cleanText(task.template?.text || '');
						templateText = replaceTravelers(templateText, travelers);
						if (templateText) {
							const finalContent = processTextPayload(templateText);
							processedPayload.push({ type: 'text', data: finalContent });
						}
						if (task.template?.image) processedPayload.push({ type: 'image', data: task.template.image });
					}
				}

				// 入队逻辑 (AI 任务或普通任务)
				if (isAiTask) {
					if (aiContext) {
						// 添加到 AI 请求列表
						aiRequests.push({
							task_idx: finalQueue.length,
							task_name: taskName,
							context: aiContext // 包含模板和天气数据
						});

						// 占位
						finalQueue.push({
							task_id: taskId,
							account_name: executeAccount,
							group_name: groupName,
							task_name: taskName,
							score: taskScore,
							start_time: cleanStart,
							end_time: cleanEnd,
							status: 'manual_stop',
							payload: processedPayload, // 这里可能已经包含 route_map_image
							send_time: finalSendTimeStr, // 假设你有这个函数
							created_at: Date.now()
						});
					}
				} else if (processedPayload.length > 0) {
					finalQueue.push({
						task_id: taskId,
						account_name: executeAccount,
						group_name: groupName,
						task_name: taskName,
						score: taskScore,
						start_time: cleanStart,
						end_time: cleanEnd,
						status: 'manual_stop',
						payload: processedPayload,
						send_time: finalSendTimeStr,
						created_at: Date.now()
					});
				}
			}

			// --- 根据酒店生成额外服务/周边消息 ---
			let prevDayHotel = '';

			// 按天遍历行程
			for (const dayItem of itinerary) {
				// 1. 找当天的酒店名称
				let currentHotel = '';
				if (dayItem.activities) {
					const hotelAct = dayItem.activities.find((a) => a.elementType === 'hotel');
					if (hotelAct && hotelAct.elementData?.hotelName) {
						currentHotel = hotelAct.elementData.hotelName;
					}
				}

				// 2. 如果有酒店，且跟昨天不一样 (Day1 prevDayHotel为空，也会触发)
				if (currentHotel && currentHotel !== prevDayHotel) {
					let hotelTasks = [];

					// 遍历 settingsMap 中所有的 key
					Object.keys(settingsMap).forEach((key) => {
						// 如果 行程中的酒店名 包含 配置表里的key (例如 "拉萨瑞吉酒店".includes("瑞吉"))
						if (currentHotel.includes(key)) {
							// 将该 key 下的所有任务合并进来
							hotelTasks = hotelTasks.concat(settingsMap[key]);
						}
					});

					// 如果匹配到了任务
					if (hotelTasks.length > 0) {
						// 4. 计算时间：取当天已安排的最后一条消息时间，往后顺延
						// 计算日期字符串 YYYY-MM-DD
						const currentDepDate = new Date(departureDate);
						currentDepDate.setDate(currentDepDate.getDate() + (dayItem.day - 1));
						const dateKey = currentDepDate.toISOString().split('T')[0];

						// 获取当天最后的时间戳，如果没有则默认 20:00
						let lastTimeMs = dailyScheduleTracker[dateKey];
						if (!lastTimeMs) {
							// 如果当天完全没任务，设为 20:00
							const d = new Date(currentDepDate);
							d.setHours(20, 0, 0, 0);
							lastTimeMs = d.getTime();
						}

						// 5. 生成任务
						hotelTasks.forEach((setting, idx) => {
							// 每条消息间隔 5 分钟
							const sendTimeMs = lastTimeMs + (idx + 1) * 5 * 60 * 1000;

							// 更新 tracker，防止后续其他逻辑重叠
							dailyScheduleTracker[dateKey] = sendTimeMs;

							// 格式化时间
							const d = new Date(sendTimeMs);
							// 简单格式化
							const Y = d.getFullYear();
							const M = String(d.getMonth() + 1).padStart(2, '0');
							const D = String(d.getDate()).padStart(2, '0');
							const H = String(d.getHours()).padStart(2, '0');
							const Min = String(d.getMinutes()).padStart(2, '0');
							const S = String(d.getSeconds()).padStart(2, '0');
							const sendTimeStr = `${Y}-${M}-${D} ${H}:${Min}:${S}`;

							// 推入队列
							finalQueue.push({
								task_id: taskId,
								account_name: executeAccount,
								group_name: groupName,
								task_name: `酒店服务-${setting.category}`, // 任务名方便识别
								start_time: sendTimeStr,
								end_time: '',
								status: 'manual_stop',
								payload: [{ type: 'text', data: setting.content }],
								send_time: sendTimeStr,
								created_at: Date.now()
							});
						});
					}
				}

				// 更新昨天的酒店
				if (currentHotel) prevDayHotel = currentHotel;
			}

			// ================= 插入自定义任务 =================
			for (const customTask of CONFIG.customTasks) {
				let isAllowed = false;
				if (customTask.task_name.includes('长者关怀')) {
					const { hasElderly, hasChild } = getTravelerComposition(travelers);
					if (hasElderly) isAllowed = true;
				}

				if (isAllowed) {
					// 计算发送日期
					const targetDate = new Date(departureDate);
					targetDate.setDate(targetDate.getDate() + customTask.start_time_offset);
					const sendTimeStr = `${targetDate.toISOString().split('T')[0]} ${customTask.send_hour}`;

					finalQueue.push({
						task_id: taskId,
						account_name: executeAccount,
						group_name: groupName,
						task_name: customTask.task_name,
						start_time: sendTimeStr,
						end_time: '',
						status: 'manual_stop',
						payload: customTask.payload,
						send_time: sendTimeStr,
						created_at: Date.now()
					});
				}
			}

			// ================= 3. 执行 AI 请求 =================
			if (aiRequests.length > 0) {
				console.log(`[RPA] 正在请求 DeepSeek 处理 ${aiRequests.length} 个任务...`);

				const systemPrompt = `你是一个专业的旅行管家。用户会发送一组任务，每个任务包含 template (模板) 和 params (变量)。请完全按照 "template" 中的指示，提取 "params" 中的数据，生成符合范文格式的文案。如果 params 中包含 "real_data_content"，请用它替换模板中的对应占位符。 要求：
                1. 直接返回生成的内容字符串。
                2. 不要包含任何 JSON 格式（如 {"text":...}）。
                3. 不要包含 Markdown 代码块标记（如 \`\`\` ）。
                4. 保持模板中的 Emoji 和换行格式。`;

				// 定义单个请求函数
				const requestSingleAi = async (reqItem) => {
					try {
						const payload = {
							model: 'deepseek-chat',
							messages: [
								{ role: 'system', content: systemPrompt },
								// 单个请求不再需要复杂的 JSON 结构，直接把 prompt 拼好给 AI，效果更稳定
								{
									role: 'user',
									content: `模板：\n${reqItem.context.template}\n\n真实数据：\n${JSON.stringify(reqItem.context.params)}`
								}
							],
							temperature: 0.7,
							stream: false
						};

						const res = await uniCloud.httpclient.request(DEEPSEEK_API_URL, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${DEEPSEEK_API_KEY}`
							},
							timeout: 60000, // 单个请求 60秒超时
							dataType: 'json',
							data: payload
						});

						// 解析结果
						if (res.data && res.data.choices && res.data.choices[0]) {
							let rawContent = res.data.choices[0].message.content;

							// 深度清洗，防止 AI 还是带了格式
							// 去除可能的 Markdown 标记
							rawContent = rawContent.replace(/^```(json|text)?\n?/g, '').replace(/```$/g, '');
							// 如果 AI 还是不听话返回了 JSON 字符串（以 { 或 [ 开头），尝试解析提取
							if (rawContent.trim().startsWith('{') || rawContent.trim().startsWith('[')) {
								try {
									const parsed = JSON.parse(rawContent);
									// 尝试提取可能的字段，如果解析出是数组且有 text，取第一个
									if (Array.isArray(parsed) && parsed[0]?.text) rawContent = parsed[0].text;
									else if (parsed.text) rawContent = parsed.text;
									// 如果解析出来是纯对象但没 text 字段，可能整个对象就是内容，暂不处理
								} catch (e) {
									// 解析失败，说明可能只是普通的文本开头碰巧是符号，忽略
								}
							}

							return {
								id: reqItem.task_idx,
								text: rawContent.trim(), // 去除首尾空白
								success: true
							};
						} else {
							throw new Error('API返回结构异常');
						}
					} catch (err) {
						console.error(`[RPA] 任务 ${reqItem.task_name} AI 生成失败:`, err.message);
						return { id: reqItem.task_idx, success: false };
					}
				};

				const promises = aiRequests.map((item) => requestSingleAi(item));

				// 等待所有请求完成 (无论成功失败)
				const results = await Promise.all(promises);

				// 回填数据
				results.forEach((res) => {
					if (res.success && res.text) {
						const qItem = finalQueue[res.id];
						// 清洗一下 AI 可能返回的 ```markdown 标记
						let cleanText = res.text.replace(/^```.*?(\n|$)/g, '').replace(/```$/g, '');

						qItem.payload.unshift({ type: 'text', data: cleanText });
						qItem.status = 'manual_stop'; // 生成成功，设为暂停待人工确认
					} else {
						// 失败的任务，状态保持 manual_stop 或 pending，内容为空，人工去补或者重试
						console.log(`[RPA] 索引 ${res.id} 回填跳过 (AI失败)`);
					}
				});
			}

			// ================= 4. 入库 (覆盖模式) =================

			// 过滤掉 payload 为空的无效任务
			// 如果 status 仍是 pending_ai（说明 AI 失败），则强制降级为 pending（使用兜底文案）
			const validQueue = finalQueue.filter((q) => {
				if (q.status === 'pending_ai') q.status = 'pending';
				return q.payload.length > 0;
			});

			if (validQueue.length > 0) {
				await db.collection('a-task-queue').where({ task_id: taskId }).remove();
				await db.collection('a-task-queue').add(validQueue);
				await db.collection('a-task-orders').doc(taskId).update({ ai_status: 'done', updated_at: Date.now() });

				return { errCode: 0, msg: `成功生成 ${validQueue.length} 条消息` };
			} else {
				return { errCode: 0, msg: '无有效消息生成' };
			}
		} catch (e) {
			console.error(e);
			return { errCode: 500, errMsg: e.message };
		}
	}
};

module.exports = serviceModule;
