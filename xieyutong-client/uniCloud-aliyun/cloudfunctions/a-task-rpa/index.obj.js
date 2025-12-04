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

		try {
			// ================= 1. 数据准备 =================
			const taskRes = await db.collection('a-task-orders').doc(taskId).get();
			if (!taskRes.data || taskRes.data.length === 0) return { errCode: 404, errMsg: '任务不存在' };
			const taskOrder = taskRes.data[0];
			const executeAccount = taskOrder.account_name || '';

			// let groupName = '默认群';
			// if (taskOrder.target_group_id) {
			// 	const gRes = await db.collection('a-task-groups').doc(taskOrder.target_group_id).get();
			// 	if (gRes.data && gRes.data.length > 0) groupName = gRes.data[0].name;
			// }
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

			// 计数器 { "Day1_line": 0, "Day1_photo": 0 }
			let dayCounters = {};

			// ================= 2. 任务遍历与分流 =================
			for (const task of rawTasks) {
				if (task.order_context) continue;

				const taskName = task.name || '未命名任务';
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

				templateText = replaceTravelers(templateText, travelers);

				// 规则：凡是出现 "1." "2️." (含Emoji变体) 等序号，强制在前面加换行
				if (templateText) {
					templateText = templateText.replace(/(\d+(?:\ufe0f)?\.)/g, '\n$1');
				}

				let processedPayload = [];
				let skipTask = false;

				// -----------------------------------------------------
				// A. DeepSeek 处理类 (4类)
				// -----------------------------------------------------
				// 这里的判断逻辑需要覆盖全面，防止任务漏网
				if (
					taskName.includes('目的地建议携带') ||
					(taskName.includes('出行提醒') && !taskName.includes('大交通')) ||
					taskName.includes('大交通出行提醒') ||
					taskName.includes('明日提醒')
				) {
					// 准备 AI 上下文
					let aiContext = {};
					let isAiTask = true;

					if (taskName.includes('目的地建议携带')) {
						aiContext = {
							type: 'weather_packing',
							date: getTripDate(departureDate, 1),
							destination: snapshot.destination_city || '目的地',
							travelers: travelers.map((t) => ({ gender: t.gender_type, age: t.name }))
						};
					} else if (taskName.includes('出行提醒') && !taskName.includes('大交通')) {
						const day1 = itinerary.find((d) => d.day === 1);
						aiContext = {
							type: 'trip_start',
							date: getTripDate(departureDate, 1),
							first_day_schedule: day1 ? day1.day_title : '自由活动'
						};
					} else if (taskName.includes('大交通')) {
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
						aiContext = {
							type: 'transport',
							flights: targetFlights,
							origin: isLastDay ? snapshot.destination_city : '出发地',
							destination: isLastDay ? '出发地' : snapshot.destination_city
						};
					} else if (taskName.includes('明日提醒')) {
						const nextDay = itinerary.find((d) => d.day === dayIndex + 1);
						if (!nextDay) {
							// 如果确实没有明天的行程（比如最后一天），则跳过
							// 但为了保险，如果是“最后一天提醒”，可能需要不同处理
							// 这里简单处理：如果找不到下一天行程，就不发明日提醒
							skipTask = true;
							isAiTask = false;
						} else {
							aiContext = {
								type: 'tomorrow_brief',
								date: getTripDate(departureDate, dayIndex + 1),
								day_num: dayIndex + 1,
								schedule: nextDay.day_title,
								highlights: nextDay.day_highlights,
								hotel: nextDay.activities?.find((a) => a.elementType === 'hotel')?.elementData?.hotelName
							};
						}
					}

					if (!skipTask && isAiTask) {
						// 兜底 Payload：先把原始模板放进去，status 设为 pending_ai
						// 这样即使 AI 挂了，后续过滤器也能把它当做普通任务发出去
						let fallbackPayload = [];
						if (templateText) fallbackPayload.push({ type: 'text', data: templateText });
						if (templateImage) fallbackPayload.push({ type: 'image', data: templateImage });

						aiRequests.push({
							task_idx: finalQueue.length,
							task_name: taskName,
							original_text: templateText,
							context: aiContext
						});

						finalQueue.push({
							task_id: taskId,
							account_name: executeAccount,
							group_name: groupName,
							task_name: taskName,
							start_time: cleanStart,
							end_time: cleanEnd,
							payload: fallbackPayload, // 填入兜底数据
							status: 'pending_ai',
							send_time: adjustSendTime(cleanStart, cleanEnd),
							created_at: Date.now()
						});
					}
					continue; // 处理完 AI 类，直接进入下一次循环
				}

				// -----------------------------------------------------
				// B. 规则处理类 (JS 逻辑)
				// -----------------------------------------------------

				if (taskName.includes('伴手礼')) {
					templateText = templateText.replace(/【.*?】/g, '').trim();

					try {
						// 1. 计算目标时间：行程结束前2天的 10:00
						const tripEndDate = new Date(departureDate);
						tripEndDate.setDate(tripEndDate.getDate() + snapshot.total_days - 2);
						tripEndDate.setHours(10, 0, 0, 0);

						// 2. 获取任务原始有效范围
						const originalStart = new Date(cleanStart);
						const originalEnd = cleanEnd ? new Date(cleanEnd) : new Date('2099-12-31'); // 如果没有截止时间，视为无限长

						// 3. 只有当目标时间在任务有效期内时，才修改
						if (tripEndDate >= originalStart && tripEndDate <= originalEnd) {
							const y = tripEndDate.getFullYear();
							const m = String(tripEndDate.getMonth() + 1).padStart(2, '0');
							const d = String(tripEndDate.getDate()).padStart(2, '0');
							cleanStart = `${y}-${m}-${d} 10:00:00`;
						}
						// 否则保持 cleanStart 原值（即不改动）
					} catch (e) {
						console.error('伴手礼时间计算错误:', e);
					}
				}

				if (taskName.includes('随车备品') || taskName.includes('图片展示')) {
					// 假设模板中有 "示例1... 示例2..."，这里根据季节重写文案
					// 如果原模板是通用文本，这里可以根据季节强制覆盖或追加提示
					let supplyMsg = '尊敬的客人您好，车内已为您准备了矿泉水、纸巾和充电线。';
					if (season === 'winter') {
						supplyMsg += '冬日寒冷，我们还特意准备了暖宝宝和保温壶，助您温暖出行。';
					} else if (season === 'summer') {
						supplyMsg += '夏日炎炎，车内备有防晒喷雾和清凉湿巾，祝您旅途清爽。';
					} else {
						supplyMsg += '还准备了舒适的U型枕和当地特色零食，供您途中休憩享用。';
					}
					// 替换原有模板内容
					templateText = supplyMsg;
				}

				if (taskName.includes('值机提醒')) {
					if (flights.length > 0) {
						const f = flights[0]; // 默认取去程
						templateText = `【值机提醒】\n尊敬的旅客，您的航班 ${f.flight_no} (${f.route}) 现已开放值机。\n起飞时间：${f.dep_time}\n请及时在航司APP或小程序选座。`;
					}
				}

				// 规则 3 & 4: 航班信息
				else if (templateText.includes('航班') || templateText.includes('#航班号#')) {
					if (flights.length > 0) {
						const f = flights[0];
						templateText = templateText
							.replace(/#航班号#/g, f.flight_no || '')
							.replace(/#起飞时间#/g, f.dep_time || '')
							.replace(/#落地时间#/g, f.arr_time || '')
							.replace(/#出发城市#/g, f.route?.split('-')[0] || '')
							.replace(/#抵达城市#/g, f.route?.split('-')[1] || '')
							.replace(/#.*?#/g, '');
					}
				}

				// 规则 5: 景区线路图 & 最佳拍摄点 (独立计数器)
				if (taskName.includes('线路图') || taskName.includes('最佳拍摄点')) {
					const dayData = itinerary.find((d) => d.day === dayIndex);
					const scenicSpots = [];
					if (dayData && dayData.activities) {
						dayData.activities.forEach((act) => {
							if (act.elementType === 'scenic' && act.elementData?.scenic_spots) {
								scenicSpots.push(...act.elementData.scenic_spots);
							}
						});
					}

					// 区分两种任务类型的计数器 Key
					const typeKey = taskName.includes('线路图') ? 'line' : 'photo';
					const counterKey = `${dayKey}_${typeKey}`;
					if (dayCounters[counterKey] === undefined) dayCounters[counterKey] = 0;

					const spotIdx = dayCounters[counterKey];

					if (spotIdx < scenicSpots.length) {
						const spot = scenicSpots[spotIdx];
						templateText = `【${spot.name}】${typeKey === 'line' ? '游览线路图' : '最佳拍摄点推荐'} \n您可以参考下图进行游览。`;
						if (spot.images && spot.images.length > 0) {
							templateImage = spot.images[0];
						}
						dayCounters[counterKey]++; // 计数 +1
					} else {
						skipTask = true; // 景点不够分了
					}
				}

				if (taskName.includes('告知客人') && (taskName.includes('门票') || taskName.includes('餐厅'))) {
					let tickets = [];
					let reserves = [];
					// 扫描整个行程
					itinerary.forEach((d) => {
						d.activities?.forEach((a) => {
							if (a.elementType === 'scenic' && a.elementData?.scenic_spots) {
								a.elementData.scenic_spots.forEach((s) => {
									if (s.ticket_included) tickets.push(`${s.name}`);
								});
							}
							if (a.elementType === 'restaurant' && a.elementData) {
								let rName = a.elementData.name;
								const rRemark = a.elementData.remark || '';

								// 忽略通用名称，尝试从备注提取
								if (!rName || ['午餐', '晚餐', '早餐', '正餐'].includes(rName)) {
									const lines = rRemark.split(/[\n\r]+/);
									const targetLine = lines.find((l) => l.includes('前往餐厅') || l.includes('用餐地点'));

									if (targetLine) {
										// 提取冒号后的内容： "前往餐厅：平措康桑...·观景餐厅"
										const parts = targetLine.split(/[：:]/);
										if (parts.length > 1) {
											rName = parts[1].trim();
										}
									} else {
										rName = null; // 没名字就不显示了，避免显示“午餐”
									}
								}
								// 如果是“自理”，跳过
								if (rName && rName.includes('自理')) return;

								if (rName) {
									reserves.push(`${d.day}日${a.elementData.meal_type || '用餐'}：${rName}`);
								}
							}
						});
					});

					let msg = '';
					if (tickets.length) msg += `🎫 已为您预约门票：${tickets.join('、')}\n`;
					if (reserves.length) msg += `🍽️ 已为您预留餐厅：${reserves.join('、')}\n`;

					if (!msg) skipTask = true; // 没东西就不发
					else templateText = msg + '请您届时出示证件使用。';
				}

				// 规则 6: 餐厅预约
				else if (taskName.includes('餐厅预定')) {
					templateText = templateText.replace(/预约凭证/g, '');
					const dayData = itinerary.find((d) => d.day === dayIndex);
					const restaurant = dayData?.activities?.find((a) => a.elementType === 'restaurant');

					if (restaurant && restaurant.elementData) {
						const rName = restaurant.elementData.name || '当地精选餐厅';
						const rAddr = restaurant.elementData.address || restaurant.elementData.location || '（详询导游）';
						templateText += `\n\n🍽️ 推荐餐厅：${rName}\n📍 地址：${rAddr}`;
					}
				}

				// 规则 7: 人群构成
				if (taskName.includes('确认人群构成')) {
					const { hasElderly, hasChild } = getTravelerComposition(travelers);
					if (hasElderly) {
						templateText = '您好，关注到您此次出行包含长者，我们在行程安排中会特别注意舒适度。如有特别的健康注意事项或饮食需求，请随时告知我们。';
					} else if (hasChild) {
						templateText = '您好，关注到此次出行含儿童，请问小朋友大概几岁？行程安排中需要特别注意什么吗？';
					} else {
						skipTask = true;
					}
				}
				if (taskName.includes('轮椅') && !getTravelerComposition(travelers).hasElderly) skipTask = true;
				if (taskName.includes('儿童座椅') && !getTravelerComposition(travelers).hasChild) skipTask = true;

				// 确认交通信息
				if (taskName.includes('确认交通信息')) {
					let msg = '您好，跟您确认此次行程的大交通信息：\n';
					flights.forEach((f, i) => {
						// 简单判定：如果是 2 趟航班，默认 0去 1回
						const prefix = i === 0 ? '✈️去程' : '✈️返程';
						msg += `${prefix}：${f.flight_no} ${f.dep_time} ${f.route}\n`;
					});
					msg += '如有托运行李，请注意航司额度规定。';
					templateText = msg;
				}

				// 规则 8: 确认酒店
				if (taskName.includes('确认酒店') || taskName.includes('房型')) {
					let hotelMsg = '为您确认行程中的酒店安排：\n';
					let hasHotel = false;
					itinerary.forEach((d) => {
						const h = d.activities?.find((a) => a.elementType === 'hotel');
						if (h && h.elementData) {
							hotelMsg += `📅 Day${d.day}: ${h.elementData.hotelName || '待定'}\n`;
							hasHotel = true;
						}
					});
					if (hasHotel) {
						templateText = hotelMsg + '\n如有特殊房型需求（如大床/双床），请提前告知。';
					} else {
						templateText = '行程中未包含酒店住宿。';
					}
				}

				// 确认特殊景点
				if (taskName.includes('确认行程-特殊景点') || taskName.includes('特殊景点')) {
					const keywords = ['徒步', '登山', '海拔4000', '珠峰', '冰川', '稻城亚丁'];
					let foundInfo = '';
					// 简单全文搜索
					const jsonStr = JSON.stringify(itinerary);
					for (let kw of keywords) {
						if (jsonStr.includes(kw)) {
							foundInfo = kw;
							break;
						}
					}
					if (foundInfo) {
						templateText = `您好，这次行程包含${foundInfo}相关活动，对体力有一定要求。建议您出行前保持良好休息，量力而行，避免剧烈运动。`;
					} else {
						skipTask = true; // 没找到特殊景点就不发
					}
				} else if (taskName.includes('登山杖')) {
					const allText = JSON.stringify(itinerary);
					const needHike = allText.includes('徒步') || allText.includes('爬山') || allText.includes('高海拔');
					if (!needHike) skipTask = true;
				}

				// 规则 10: 餐饮信息
				if (taskName.includes('确认餐饮信息')) {
					// 收集所有餐饮活动的 remark，分析风格
					let styles = new Set();
					itinerary.forEach((d) =>
						d.activities?.forEach((a) => {
							if (a.elementType === 'restaurant') {
								const remark = a.elementData?.remark || '';
								if (remark.includes('自助')) styles.add('自助餐');
								if (remark.includes('火锅')) styles.add('特色火锅');
								if (remark.includes('藏餐') || remark.includes('藏式')) styles.add('地道藏餐');
								if (remark.includes('西餐')) styles.add('西餐');
							}
						})
					);

					const styleStr = styles.size > 0 ? Array.from(styles).join('、') : '精选中式团餐';

					// 替换模板中的占位符
					if (templateText.includes('[')) {
						templateText = templateText.replace(/\[.*?\]/g, styleStr);
					} else {
						// 如果没占位符，就追加
						templateText += `\n餐食类型：${mealsStr}`;
					}
				} else if (taskName.includes('餐饮信息')) {
					const meals = [];
					itinerary.forEach((d) => {
						d.activities?.forEach((a) => {
							if (a.elementType === 'restaurant') meals.push(a.elementData?.meal_type || '正餐');
						});
					});
					templateText += `\n本次行程包含：${Array.from(new Set(meals)).join('、')}`;
				}

				// 规则 11: 订单基本信息
				if (taskName.includes('订单基本信息')) {
					const depStr = getTripDate(departureDate, 1);
					templateText = templateText
						// 先移除底部的列表（如果存在）
						.split('----------------')[0]
						.trim()
						// 精确替换
						.replace(/出行人数：\s*/, `\n出行人数：${travelers.length}人\n`)
						.replace(/出行日期：\s*/, `出行日期：${depStr}\n`)
						.replace(/往返天数：\s*/, `往返天数：${snapshot.total_days}天\n`)
						.replace(/基本行程：\s*/, `基本行程：${snapshot.title || '定制西藏游'}\n`);
				}

				// 构建 Payload 并入队
				if (!skipTask) {
					if (templateText) processedPayload.push({ type: 'text', data: templateText });
					if (templateImage) processedPayload.push({ type: 'image', data: templateImage });

					if (processedPayload.length > 0) {
						finalQueue.push({
							task_id: taskId,
							account_name: executeAccount,
							group_name: groupName,
							task_name: taskName,
							start_time: cleanStart,
							end_time: cleanEnd,
							payload: processedPayload,
							status: 'pending',
							send_time: adjustSendTime(cleanStart, cleanEnd),
							created_at: Date.now()
						});
					}
				}
			}

			// ================= 3. 执行 AI 请求 =================
			if (aiRequests.length > 0) {
				console.log(`[RPA] 正在请求 DeepSeek 处理 ${aiRequests.length} 个任务...`);

				const systemPrompt = `你是一个专业的旅行管家。请根据用户提供的任务列表（包含类型、日期、上下文数据），直接生成对应的回复内容。
						要求：
						1. 语气亲切、专业。
						2. 必须基于提供的 context 数据，不要编造。
						3. "天气建议"：需根据目的地和日期预估天气，给出穿衣指南。
						4. "明日提醒"：用生动的语言预告明天的行程亮点和酒店。
						5. 返回 JSON 数组：[{ "id": 任务序号, "text": "生成的文案" }, ...]`;

				const aiPayload = {
					model: 'deepseek-chat',
					messages: [
						{ role: 'system', content: systemPrompt },
						{ role: 'user', content: JSON.stringify(aiRequests.map((r, i) => ({ id: i, type: r.task_name, context: r.context }))) }
					],
					response_format: { type: 'json_object' }
				};

				// 请求 AI
				const aiResponse = await uniCloud.httpclient.request(DEEPSEEK_API_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
					timeout: 120000,
					dataType: 'json',
					data: aiPayload
				});

				// 处理响应 (含 Buffer 修复)
				let aiResultList = [];
				try {
					let body = aiResponse.data;
					if (Buffer.isBuffer(body)) body = JSON.parse(body.toString('utf-8'));
					else if (typeof body === 'object' && body.type === 'Buffer') {
						body = JSON.parse(Buffer.from(body.data).toString('utf-8'));
					}

					if (body.choices && body.choices[0]) {
						const content = body.choices[0].message.content;
						const parsed = JSON.parse(content.replace(/```json/g, '').replace(/```/g, ''));
						aiResultList = Array.isArray(parsed) ? parsed : parsed.results || parsed.list || [];
					}
				} catch (e) {
					console.error('[RPA] AI 解析失败，将使用兜底文案:', e);
				}

				// 回填数据
				aiResultList.forEach((res) => {
					const req = aiRequests[res.id];
					if (req && res.text) {
						const qItem = finalQueue[req.task_idx];
						const images = qItem.payload.filter((p) => p.type === 'image');
						qItem.payload = [{ type: 'text', data: res.text }, ...images];
						qItem.status = 'pending'; // 明确激活
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
