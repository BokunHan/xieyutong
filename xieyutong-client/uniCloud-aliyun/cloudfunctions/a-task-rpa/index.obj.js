const db = uniCloud.database();
const dbCmd = db.command;

const DEEPSEEK_API_KEY = 'sk-43daeda4c8ab49408753c243b01f81d5';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

async function _callDeepSeekSimple(systemPrompt, userPrompt) {
	try {
		const res = await uniCloud.httpclient.request(DEEPSEEK_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${DEEPSEEK_API_KEY}`
			},
			dataType: 'json',
			timeout: 30000,
			data: {
				model: 'deepseek-chat',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				temperature: 0.1, // 低温，追求准确
				stream: false
			}
		});
		if (res.data && res.data.choices && res.data.choices[0]) {
			return res.data.choices[0].message.content.trim();
		}
	} catch (e) {
		console.error('[DeepSeek] 调用失败:', e);
	}
	return null;
}

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
// function getBjTimeStr() {
// 	const now = new Date();
// 	// 处理时区问题，强制转为 UTC+8
// 	const tzOffset = 8 * 60 * 60 * 1000;
// 	const time = now.getTime() + now.getTimezoneOffset() * 60 * 1000 + tzOffset;
// 	const d = new Date(time);

// 	const Y = d.getFullYear();
// 	const M = (d.getMonth() + 1).toString().padStart(2, '0');
// 	const D = d.getDate().toString().padStart(2, '0');
// 	const h = d.getHours().toString().padStart(2, '0');
// 	const m = d.getMinutes().toString().padStart(2, '0');
// 	const s = d.getSeconds().toString().padStart(2, '0');
// 	return `${Y}-${M}-${D} ${h}:${m}:${s}`;
// }

const serviceModule = {
	_before: function () {
		// 鉴权逻辑
	},

	async _timing() {
		console.log('[Trigger] 定时任务被触发');
		// 调用我们写好的天气预检逻辑
		return await serviceModule.dailyWeatherPrecheck();
	},

	/**
	 * Python 启动时调用：获取所有管家列表，用于现场绑定
	 */
	async getAttendantList() {
		// 查询所有角色包含 attendant 的用户
		const res = await db
			.collection('uni-id-users')
			.where({
				role: 'attendant'
			})
			.field({ _id: 1, nickname: 1, username: 1, mobile: 1 })
			.get();

		// 返回格式处理，确保有 nickname
		const list = res.data.map((u) => ({
			id: u._id,
			name: u.nickname || u.username || u.mobile || '未命名管家'
		}));

		return {
			errCode: 0,
			data: list // [{id: 'xxx', name: '张三'}, ...]
		};
	},

	/**
	 * 重新分配管家（同时更新订单、队列、快照）
	 */
	async reassignAgent(params) {
		const { orderId, agentId, accountName } = params;
		if (!orderId || !agentId) return { errCode: 1, errMsg: '参数缺失' };

		const db = uniCloud.database();
		const dbCmd = db.command;

		try {
			// 1. 获取管家详细信息 (为了写入快照 staves)
			const agentRes = await db
				.collection('uni-id-users')
				.doc(agentId)
				.field({
					_id: 1,
					nickname: 1,
					username: 1,
					mobile: 1
				})
				.get();

			if (agentRes.data.length === 0) return { errCode: 1, errMsg: '管家不存在' };
			const agent = agentRes.data[0];
			const agentName = agent.nickname || agent.username || accountName;
			const agentMobile = agent.mobile || '';

			// 2. 更新订单表 (a-task-orders)
			await db.collection('a-task-orders').where({ order_id: orderId }).update({
				agent_id: agentId,
				account_name: agentName, // 更新显示名
				updated_at: Date.now()
			});

			// 3. 查找任务ID并更新队列 (a-task-queue)
			const orderRes = await db.collection('a-task-orders').where({ order_id: orderId }).limit(1).get();
			if (orderRes.data.length > 0) {
				const taskId = orderRes.data[0]._id;
				// 只更新未完成的任务
				await db
					.collection('a-task-queue')
					.where({
						task_id: taskId,
						status: dbCmd.in(['pending', 'failed', 'manual_stop'])
					})
					.update({
						agent_id: agentId,
						account_name: agentName,
						updated_at: Date.now()
					});
			}

			// 4. 更新快照表 (a-snapshots)
			const snapRes = await db.collection('a-snapshots').where({ order_id: orderId }).limit(1).get();
			if (snapRes.data.length > 0) {
				const snapshot = snapRes.data[0];
				let staves = snapshot.staves || [];

				// 过滤掉旧的管家 (role === 'attendant')
				staves = staves.filter((s) => s.role !== 'attendant' && !s.role.includes('attendant'));

				// 推入新管家
				staves.push({
					id: agentId,
					role: ['attendant'],
					mobile: agentMobile,
					nickname: agentName
				});

				await db.collection('a-snapshots').doc(snapshot._id).update({
					staves: staves,
					updated_at: Date.now()
				});
			}

			return { errCode: 0, msg: '分配成功', data: { agentMobile, agentName } };
		} catch (e) {
			console.error(e);
			return { errCode: 500, errMsg: e.message };
		}
	},

	/**
	 * 获取待迁移的旧账号列表
	 */
	async getLegacyAccounts() {
		const db = uniCloud.database();
		const dbCmd = db.command;

		// 查出所有没有 agent_id 的订单
		// 为了性能，限制 1000 条，前端手动去重即可，或者利用 aggregate (如果表很大建议用聚合)
		const res = await db
			.collection('a-task-orders')
			.where({
				account_name: dbCmd.neq(null)
			})
			.field({ account_name: 1 })
			.limit(1000)
			.get();

		// 简单去重
		const names = new Set();
		res.data.forEach((item) => {
			if (item.account_name) names.add(item.account_name);
		});

		return { errCode: 0, data: Array.from(names) };
	},

	/**
	 * 执行迁移：将指定 account_name 的所有旧数据绑定到 target_agent_id
	 */
	async migrateAccountData(params) {
		const { oldAccountName, targetAgentId } = params;
		const db = uniCloud.database();

		// 1. 更新 Orders
		const orderRes = await db
			.collection('a-task-orders')
			.where({
				account_name: oldAccountName
			})
			.update({
				agent_id: targetAgentId
			});

		// 2. 更新 Queue
		const queueRes = await db
			.collection('a-task-queue')
			.where({
				account_name: oldAccountName
			})
			.update({
				agent_id: targetAgentId
			});

		return {
			errCode: 0,
			msg: `迁移完成: 订单 ${orderRes.updated} 条, 队列 ${queueRes.updated} 条`
		};
	},

	/**
	 * Python 回传：更新发送状态 (含自动重试与报警逻辑)
	 */
	async updateSendStatus(params) {
		// 使用通用解析函数，检查 task_id
		const input = getParams(this, params, 'task_id');
		const { task_id, status, error, ocr_raw } = input;

		if (!task_id) {
			console.error('缺少 task_id, input:', input);
			return { errCode: 1, msg: 'Missing task_id' };
		}

		const now = Date.now();

		// 1. 获取任务详情
		const queueRes = await db.collection('a-task-queue').doc(task_id).get();
		if (!queueRes.data || queueRes.data.length === 0) {
			return { errCode: 1, msg: 'Task not found' };
		}
		const queueItem = queueRes.data[0];

		// 2. 准备更新的数据
		let updateData = { updated_at: now };

		// === 核心逻辑：失败重试机制 ===
		if (status === 'failed') {
			const MAX_RETRIES = 2; // 最大重试次数
			const RETRY_INTERVAL_MINUTES = 10; // 重试间隔(分钟)
			const currentRetries = queueItem.retry_count || 0;

			if (currentRetries < MAX_RETRIES) {
				// A. 还可以重试 -> 重新入列
				console.log(`[RPA] 任务 ${task_id} 发送失败，安排第 ${currentRetries + 1} 次重试...`);

				// 计算下次时间 (当前时间 + 10分钟)
				let nextTimestamp = now + RETRY_INTERVAL_MINUTES * 60 * 1000;
				const timezoneOffset = 8 * 60 * 60 * 1000;
				const nextTimeObj = new Date(nextTimestamp + timezoneOffset);

				// 格式化为 YYYY-MM-DD HH:mm:ss
				const Y = nextTimeObj.getFullYear();
				const M = String(nextTimeObj.getMonth() + 1).padStart(2, '0');
				const D = String(nextTimeObj.getDate()).padStart(2, '0');
				const h = String(nextTimeObj.getHours()).padStart(2, '0');
				const m = String(nextTimeObj.getMinutes()).padStart(2, '0');
				const s = String(nextTimeObj.getSeconds()).padStart(2, '0');
				const nextTimeStr = `${Y}-${M}-${D} ${h}:${m}:${s}`;

				updateData.status = 'pending'; // 关键：重置为 pending，让 Python 能再次拉取到
				updateData.retry_count = currentRetries + 1;
				updateData.send_time = nextTimeStr; // 推迟执行时间
				updateData.error_msg = `(第${currentRetries + 1}次重试中) 上次错误: ${error}`;
			} else {
				// B. 次数用尽 -> 彻底失败并报警
				console.log(`[RPA] 任务 ${task_id} 重试次数耗尽，触发报警`);

				updateData.status = 'failed';
				updateData.error_msg = `(重试失败) ${error}`;

				// --- 触发企业微信报警 ---
				try {
					// 1. 查管家手机号
					let mobile = '';
					if (queueItem.agent_id) {
						const userRes = await db.collection('uni-id-users').doc(queueItem.agent_id).field({ mobile: 1 }).get();
						if (userRes.data.length > 0) mobile = userRes.data[0].mobile;
					}

					// 2. 调用通知云对象
					if (mobile) {
						await uniCloud.callFunction({
							name: 'attendant-notifier',
							data: {
								action: 'notifyTaskFailed',
								params: {
									mobile: mobile,
									groupName: queueItem.group_name,
									taskName: queueItem.task_name,
									errorMsg: error
								}
							}
						});
					}
				} catch (notifyErr) {
					console.error('[RPA] 报警发送失败:', notifyErr);
				}
				// -----------------------
			}
		} else {
			// C. 发送成功或其他状态
			updateData.status = status;
			if (error) updateData.error_msg = error;
		}

		// ================= 记录发送日志 =================
		try {
			// 查出这个任务的详情（为了获取计划时间、内容、关联的订单ID）
			const queueRes = await db.collection('a-task-queue').doc(task_id).get();

			if (queueRes.data && queueRes.data.length > 0) {
				const queueItem = queueRes.data[0];

				// 计算延迟 (秒)
				let delaySeconds = 0;
				if (queueItem.send_time) {
					// send_time 格式如 "2025-11-25 10:00:00"
					const planTime = new Date(queueItem.send_time).getTime();
					if (!isNaN(planTime)) {
						delaySeconds = Math.round((now - planTime) / 1000);
					}
				}

				// 提取内容摘要 (取 payload 里第一条文本的前 50 个字)
				let contentSnapshot = '[无文本]';
				if (Array.isArray(queueItem.payload)) {
					const textMsg = queueItem.payload.find((p) => p.type === 'text');
					if (textMsg && textMsg.data) {
						contentSnapshot = textMsg.data.substring(0, 50);
					} else if (queueItem.payload.length > 0) {
						contentSnapshot = `[${queueItem.payload[0].type}]`; // 如果全是图片，显示 [image]
					}
				}

				// 获取客户端 IP (监控是哪台机器跑的)
				let clientIp = '';
				try {
					const clientInfo = this.getClientInfo();
					clientIp = clientInfo.clientIP || '';
				} catch (e) {}

				// 写入日志表
				await db.collection('a-send-logs').add({
					queue_id: task_id, // 队列记录 ID
					order_id: queueItem.group_name, // 订单号(即群名)
					agent_id: queueItem.agent_id,
					account_name: queueItem.account_name,
					group_name: queueItem.group_name,
					scheduled_time: queueItem.send_time, // 计划时间
					actual_time: now, // 实际时间
					delay_seconds: delaySeconds, // 延迟秒数
					status: status,
					retry_count: updateData.retry_count || queueItem.retry_count || 0,
					content_snapshot: contentSnapshot,
					ocr_raw: ocr_raw,
					error_msg: error || '',
					client_ip: clientIp
				});

				console.log(`[Log] 日志已写入，延迟: ${delaySeconds}秒`);
			}
		} catch (logErr) {
			// 日志写入失败不应阻断主流程，打印错误即可
			console.error('[Log] 写入发送日志失败:', logErr);
		}
		// =============================================================

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
		console.log('orderRes: ', orderRes);

		const taskId = orderRes.data[0]._id;
		const updateData = {
			crawl_status: status === 'success' ? 'done' : 'failed',
			updated_at: Date.now()
		};
		console.log('updateData: ', updateData);

		if (status === 'success') {
			updateData.raw_data = data;
			updateData.ai_status = 'pending';
		} else {
			updateData.error_msg = error;
		}

		const updateRes = await db.collection('a-task-orders').doc(taskId).update(updateData);
		console.log('updateRes: ', updateRes);

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
	 * 批量修复“明日提醒”中的天气占位符
	 */
	async batchFixWeatherPlaceholder() {
		const db = uniCloud.database();
		const dbCmd = db.command;
		let updatedCount = 0;

		try {
			// 1. 查找所有“明日提醒”且未发送的任务
			const queueRes = await db
				.collection('a-task-queue')
				.where({
					// group_name: '1128143286920411',
					task_name: /明日提醒/,
					status: dbCmd.in(['pending', 'manual_stop'])
				})
				.limit(1000) // 根据实际量调整
				.get();

			const tasks = queueRes.data;
			if (tasks.length === 0) return { updated: 0 };

			// 2. 批量处理
			for (const task of tasks) {
				let hasChanged = false;
				const newPayload = JSON.parse(JSON.stringify(task.payload));

				for (let item of newPayload) {
					if (item.type === 'text' && (item.data.includes('【天气与海拔提示】') || item.data.includes('【天气提示】'))) {
						// --- 获取该任务对应的行程标题 ---
						let cityTitle = '拉萨'; // 默认兜底
						try {
							// 根据订单号(group_name)查快照
							const snapRes = await db.collection('a-snapshots').where({ order_id: task.group_name }).field({ itinerary: 1, departure_date: 1 }).limit(1).get();

							if (snapRes.data.length > 0) {
								const snapshot = snapRes.data[0];
								// 计算该任务是第几天 (因为是明日提醒，通常发的是 Day N 的行程，需要 +1)
								const dIndex = getTripDayIndex(task.send_time || task.start_time, snapshot.departure_date);
								const nextDay = dIndex + 1;
								const dayData = snapshot.itinerary.find((d) => d.day === nextDay);

								if (dayData && dayData.day_title) {
									// 提取标题中的核心地名 (取第一个空格前的内容，如 "拉萨-林芝")
									cityTitle = dayData.day_title.split(' ')[0];
								}
							}
						} catch (e) {
							console.error('获取快照失败:', e);
						}

						// --- 执行正则替换 ---
						const weatherPlaceholder = `{{WEATHER::${cityTitle}::1}}`;

						// 正则说明：匹配【天气与海拔提示】或【天气提示】开始，到“在旅途中有任何问题...”之前的所有内容
						const regex = /(🌡️\s*【天气(?:与海拔)?提示】)([\s\S]*?)(?=\n+在旅途中有任何问题)/;

						if (regex.test(item.data)) {
							item.data = item.data.replace(regex, `$1\n${weatherPlaceholder}`);
							hasChanged = true;
						}
					}
				}

				if (hasChanged) {
					await db.collection('a-task-queue').doc(task._id).update({
						payload: newPayload,
						updated_at: Date.now()
					});
					updatedCount++;
				}
			}

			return { updated: updatedCount };
		} catch (e) {
			throw new Error('批量处理异常: ' + e.message);
		}
	},

	/**
	 * 定时任务（建议配置为每天 09:00）：预处理天气占位符并通知管家
	 */
	async dailyWeatherPrecheck() {
		const db = uniCloud.database();
		const dbCmd = db.command;
		console.log('[Cron] 开始执行每日天气预检...');

		// 1. 筛选条件：
		// - task_name 包含 "明日提醒"
		// - status 为 pending (待发送) 或 manual_stop (人工暂停)
		// - send_time 在今天之内
		// 获取当前 UTC 时间
		const now = new Date();
		const offset = 8;
		const localTimeMs = now.getTime() + now.getTimezoneOffset() * 60000 + offset * 3600000;
		const bjDate = new Date(localTimeMs);

		// 格式化为 YYYY-MM-DD
		const Y = bjDate.getFullYear();
		const M = String(bjDate.getMonth() + 1).padStart(2, '0');
		const D = String(bjDate.getDate()).padStart(2, '0');
		const todayStr = `${Y}-${M}-${D}`;

		// 构造符合数据库格式的字符串
		const startOfDay = `${todayStr} 00:00:00`;
		const endOfDay = `${todayStr} 23:59:59`;

		console.log(`[Cron] 查询范围: ${startOfDay} ~ ${endOfDay}`);

		const queueRes = await db
			.collection('a-task-queue')
			.where({
				task_name: /明日提醒/,
				status: dbCmd.in(['pending', 'manual_stop']),
				send_time: dbCmd.gte(startOfDay).and(dbCmd.lte(endOfDay))
			})
			.limit(100)
			.get(); // 限制数量防止超时，根据业务量调整

		const tasks = queueRes.data;
		console.log(`[Cron] 扫描到 ${tasks.length} 条待处理天气任务`);

		let updateCount = 0;
		const notifier = uniCloud.importObject('attendant-notifier');

		for (const task of tasks) {
			let isUpdated = false;
			const newPayload = JSON.parse(JSON.stringify(task.payload));
			let updatedWeatherText = '';

			// 2. 遍历 payload 寻找占位符
			for (let item of newPayload) {
				if (item.type === 'text' && item.data && item.data.includes('{{WEATHER::')) {
					// 正则匹配 {{WEATHER::城市::偏移量}}
					const regex = /\{\{WEATHER::(.*?)::(\d+)\}\}/g;
					let match;

					while ((match = regex.exec(item.data)) !== null) {
						const placeholder = match[0];
						const city = match[1];
						const offset = match[2];

						console.log(`[Cron] 正在查询: ${task.group_name} -> ${city}`);

						try {
							// 3. 复用现有的 getRealtimeWeatherStr 方法
							const weatherRes = await serviceModule.getRealtimeWeatherStr({
								city: city,
								dayOffset: offset
							});

							if (weatherRes.errCode === 0 && weatherRes.data) {
								// 4. 执行替换
								item.data = item.data.replace(placeholder, weatherRes.data);
								updatedWeatherText = weatherRes.data;
								isUpdated = true;
							}
						} catch (e) {
							console.error(`[Cron] 天气查询失败 ${task._id}:`, e);
						}
					}
				}
			}

			// 5. 如果发生过替换，更新数据库 + 发通知
			if (isUpdated) {
				await db.collection('a-task-queue').doc(task._id).update({
					payload: newPayload,
					updated_at: Date.now()
				});
				updateCount++;

				// 6. 查找管家手机号并发送通知
				if (task.agent_id) {
					try {
						const userRes = await db.collection('uni-id-users').doc(task.agent_id).field({ mobile: 1 }).get();
						if (userRes.data.length > 0 && userRes.data[0].mobile) {
							await notifier.notifyWeatherCheck({
								mobile: userRes.data[0].mobile,
								groupName: task.group_name,
								weatherText: updatedWeatherText,
								taskTime: task.send_time
							});
						}
					} catch (notifyErr) {
						console.error('[Cron] 通知发送失败:', notifyErr);
					}
				}
			}
		}

		return { errCode: 0, msg: `预检完成，更新了 ${updateCount} 条任务` };
	},

	/**
	 * Python端 JIT 调用：获取实时天气字符串
	 * @param {String} city 这里接收的其实是 "行程标题" 或 "模糊地名"
	 * @param {String} dayOffset 0=今天, 1=明天
	 */
	async getRealtimeWeatherStr(params) {
		const input = getParams(this, params, 'city');
		let rawLocation = input.city || '拉萨'; // 这里可能是 "拉萨-巴松措-林芝"
		const dayOffset = parseInt(input.dayOffset || '1');

		const disclaimer = '\n（山区天气多变，预报信息仅供参考，请您出行时以实际天气为准。）';

		console.log(`[RPA-JIT] 智能天气查询 | 原始输入: ${rawLocation}, 偏移: ${dayOffset}`);

		try {
			// === 步骤 1: 让 DeepSeek 分析出最佳查询城市 ===
			// 解决痛点：行程标题长、含多个地点、地名生僻
			const aiSystemPrompt = `你是一个地理位置解析助手。用户会提供一段行程描述或地名。
	请分析出当晚的【住宿落脚点】。
	1. 如果有多个地点，取最后一个。
	2. 将该地点转换为【适合气象查询的行政区划名】（精确到市或县，不要具体到村）。
	   例如：“拉萨” -> “拉萨市”；“索松村” -> “米林县”；“巴松措” -> “工布江达县”；“羊湖” -> “浪卡子县”。
	3. 只返回城市名称，不要任何标点符号。`;

			const cleanCity = await _callDeepSeekSimple(aiSystemPrompt, rawLocation);
			console.log(`[RPA-JIT] DeepSeek 解析结果: "${rawLocation}" -> "${cleanCity}"`);

			// 如果 AI 挂了，回退到简单的 split 逻辑
			const queryCity = cleanCity || rawLocation.split('-').pop() || '拉萨';

			// === 步骤 2: 查询 a-weather ===
			const wRes = await uniCloud.callFunction({
				name: 'a-weather',
				data: {
					action: 'getWeatherByCityName',
					cityName: queryCity,
					extensions: 'all'
				}
			});

			console.log('wRes: ', wRes);

			if (wRes.result.errCode === 0 && wRes.result.data?.casts) {
				const weatherData = wRes.result.data;

				// 数据新鲜度检查
				if (weatherData.reporttime) {
					const reportTime = new Date(weatherData.reporttime).getTime();
					const now = Date.now();
					// 如果数据滞后超过 24 小时 (24 * 60 * 60 * 1000)
					if (now - reportTime > 86400000) {
						console.warn(`[RPA-JIT] 天气数据已过期 (发布于 ${weatherData.reporttime})，主动丢弃。`);
						throw new Error('API返回了过期数据');
					}
				}

				const casts = wRes.result.data.casts;
				const targetCast = casts[dayOffset] || casts[0];
				if (targetCast) {
					let datePrefix = targetCast.date; // 默认兜底: 2026-02-04
					if (dayOffset === 0) datePrefix = '今天天气';
					else if (dayOffset === 1) datePrefix = '明天天气';
					else if (dayOffset === 2) datePrefix = '后天天气';

					// 基础数据字符串
					const baseWeatherStr = `${datePrefix}：${targetCast.dayweather}, ${targetCast.nighttemp}~${targetCast.daytemp}℃`;

					// 让 AI 根据真实数据生成贴心提示
					try {
						// 构造一个包含具体天气参数的 Prompt
						const weatherCondition = `${targetCast.dayweather}，气温${targetCast.nighttemp}度到${targetCast.daytemp}度`;
						const tipPrompt = `当前${queryCity}的天气预报为：${weatherCondition}。请根据此数据生成一句简短的出行/穿衣建议（20字以内）。
					例如：“昼夜温差大，请注意增减衣物”或“紫外线强，做好防晒”。
					要求：直接返回建议内容，不要重复播报气温数据。`;

						const tips = await _callDeepSeekSimple('你是一个贴心的旅行管家。', tipPrompt);

						if (tips) {
							// 拼接结果：天气 + 逗号 + 建议
							return {
								errCode: 0,
								data: `${baseWeatherStr}，${tips.replace(/^["“]|["”]$/g, '')}${disclaimer}`
							};
						}
					} catch (aiErr) {
						console.error('[RPA-JIT] AI生成建议失败，仅返回基础天气:', aiErr);
					}

					// 如果 AI 生成失败，至少返回基础天气
					return {
						errCode: 0,
						data: baseWeatherStr + '，昼夜温差大，请注意增减衣物。' + disclaimer
					};
				}
			}

			throw new Error('未获取到有效预报数据');
		} catch (e) {
			// === 步骤 3: 兜底机制 (如果 API 查不到或数据滞后) ===
			console.warn(`[RPA-JIT] 实况天气查询失败：${e.message} -> 转为 AI 估算模式`);
			const queryCity = rawLocation.split('-').pop() || '拉萨';
			const curMonth = new Date().getMonth() + 1;
			// 优化 Prompt，让 AI 知道是因为查不到具体数据才让它估算的
			const fallbackPrompt = `我尝试查询 "${queryCity}" ${curMonth}月份的天气但接口数据缺失或过期。请根据当前季节目标地区当地气候，生成一句简短的出行气温/穿衣提示。例如："近期气温较低，早晚温差大，请穿羽绒服。"`;

			const fallbackText = await _callDeepSeekSimple('你是一个贴心的旅行管家。', fallbackPrompt);

			return {
				errCode: 0,
				data: fallbackText || '近期气温较低，早晚温差大，请穿羽绒服。'
			};
		}
	},

	/**
	 * 将新建的全局任务，立即分发给所有符合条件的现存订单
	 */
	async applyBatchTaskToExistingOrders(batchTask) {
		const db = uniCloud.database();
		const dbCmd = db.command;
		const { _id, task_name, send_time, payload, filter_agent_id } = batchTask;

		console.log(`[Batch] 开始将任务 "${task_name}" (BatchID: ${_id}) 分发给现有订单...`);

		try {
			// 1. 构建查询条件
			let matchQuery = {};
			// 只查询未结束的订单（可选：根据 crawl_status 或其他状态过滤，这里假设只给没删除的订单发）
			if (filter_agent_id) {
				matchQuery.agent_id = filter_agent_id;
			}

			// 2. 批量查询目标订单 (一次查 1000 条，如果订单非常多建议使用聚合或分页)
			const orderRes = await db.collection('a-task-orders').where(matchQuery).field({ _id: 1, order_id: 1, agent_id: 1, account_name: 1 }).limit(1000).get();

			const orders = orderRes.data;
			if (orders.length === 0) {
				return { errCode: 0, msg: '没有符合条件的现有订单' };
			}

			// 3. 构建队列数据
			const queueItems = orders.map((order) => {
				return {
					task_id: order._id, // 关联订单ID
					group_name: order.order_id, // 群名
					agent_id: order.agent_id, // 管家ID
					account_name: order.account_name, // 管家名

					task_name: task_name,
					batch_id: _id,
					start_time: send_time,
					end_time: send_time,
					send_time: send_time,
					payload: payload,

					status: 'manual_stop', // 为了安全，默认暂停，需人工检查开启。如需直接发改成 'pending'
					priority: 0,
					created_at: Date.now(),
					source: 'batch_immediate' // 标记来源
				};
			});

			// 4. 批量插入队列
			// 拆分插入，防止超过单次写入限制
			const BATCH_SIZE = 500;
			for (let i = 0; i < queueItems.length; i += BATCH_SIZE) {
				const chunk = queueItems.slice(i, i + BATCH_SIZE);
				await db.collection('a-task-queue').add(chunk);
			}

			return {
				errCode: 0,
				msg: `已成功分发给 ${orders.length} 个订单`
			};
		} catch (e) {
			console.error('[Batch] 分发失败:', e);
			return { errCode: 500, errMsg: e.message };
		}
	},

	/**
	 * 级联删除全局任务及其生成的子任务
	 */
	async deleteGlobalTask(batchId) {
		const db = uniCloud.database();
		const dbCmd = db.command;

		try {
			// 1. 删除 a-task-queue 中由该 batchId 生成的所有子任务
			const queueRes = await db
				.collection('a-task-queue')
				.where({
					batch_id: batchId
				})
				.remove();

			// 2. 删除 a-task-batch 中的主记录
			const batchRes = await db.collection('a-task-batch').doc(batchId).remove();

			return {
				errCode: 0,
				msg: `删除成功，清理了 ${queueRes.deleted} 条待发送任务`
			};
		} catch (e) {
			console.error(e);
			return { errCode: 500, errMsg: e.message };
		}
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
西藏地区海拔高，气候多变，昼夜温差大。建议您穿着保暖衣物，如厚外套、羽绒服，内搭毛衣或抓绒衣。请注意根据体感温度及时增减衣物，以防感冒。
🎒【必带物品】
1. 证件类：身份证、边防证
2. 生活类：墨镜、防晒霜、润唇膏、保温杯
3. 电子类：充电宝、相机
💝【贴心提示】
西藏海拔高，气候条件特殊，请务必注意保暖，避免感冒。活动时节奏放缓，多喝水，保证休息。祝您在雪域高原拥有一段平安、愉快而难忘的旅程！✨

=== 生成要求 ===
1. 语气要温暖贴心。
2. 如果提供的天气数据是 "{{WEATHER::...}}" 格式的占位符，请你在建议中【原样保留】该占位符，不要编造天气，也不要说“天气未知”。
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
🌡️ 【天气提示】
{{WEATHER::🏔️【行程】独立包车丨拉萨-雅鲁藏布大峡谷-南迦巴瓦峰-索松村::1}}

在旅途中有任何问题都可以与我们联系反馈，我们将第一时间为您们解决~
=== 参考范文结束 ===

=== 真实数据 (请用这些内容替换范文) ===
{real_data_content}

=== 生成要求 ===
1. 必须保留范文中的所有标题（如🌄 【行程】）和Emoji。
2. 仅替换内容，不要改变结构。
3. 景点介绍要精炼成一句话，不要长篇大论。
4. 如果真实数据中的景点介绍显示“暂无简介”或为空，请你根据景点名称，自动生成一句简短、吸引人的介绍（约30字以内），绝对不要在结果中显示“暂无简介”。
5. 如果真实数据中的 [天气预报] 是 "{{WEATHER::...}}" 格式的字符串，请务必在结果中【原样保留】该占位符（包含双大括号），绝对不要把它改写成“待更新”或编造天气数据。
6. 直接输出结果，不要包含任何客套话。`
			}
		};
		// ===============================================================

		try {
			// ================= 1. 数据准备 =================
			const taskRes = await db.collection('a-task-orders').doc(taskId).get();
			if (!taskRes.data || taskRes.data.length === 0) return { errCode: 404, errMsg: '任务不存在' };
			const taskOrder = taskRes.data[0];
			const executeAccount = taskOrder.account_name || '';
			const executeAgentId = taskOrder.agent_id || '';
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
			const targetCity = snapshot.destination_city || '拉萨';
			let weatherText = `{{WEATHER::${targetCity}::1}}`;
			// try {
			// 	const wRes = await uniCloud.callFunction({
			// 		name: 'a-weather',
			// 		data: {
			// 			action: 'getWeatherByCityName',
			// 			cityName: snapshot.destination_city || '拉萨', // 默认城市
			// 			extensions: 'all' // 获取预报
			// 		}
			// 	});

			// 	if (wRes.result.errCode === 0 && wRes.result.data?.casts) {
			// 		const allCasts = wRes.result.data.casts;

			// 		// 1. 计算出发日期的 YYYY-MM-DD (修正时区，确保是北京时间)
			// 		const depObj = new Date(snapshot.departure_date);
			// 		const localDepTime = depObj.getTime() + depObj.getTimezoneOffset() * 60 * 1000;
			// 		const localDepDate = new Date(localDepTime);
			// 		const Y = localDepDate.getFullYear();
			// 		const M = String(localDepDate.getMonth() + 1).padStart(2, '0');
			// 		const D = String(localDepDate.getDate()).padStart(2, '0');
			// 		const targetDateStr = `${Y}-${M}-${D}`; // 目标日期：出发当天

			// 		console.log(`[RPA] 正在匹配天气，出发日期: ${targetDateStr}`);

			// 		// 2. 在预报列表中查找出发日期
			// 		const startIndex = allCasts.findIndex((c) => c.date === targetDateStr);

			// 		let targetCasts = [];
			// 		if (startIndex !== -1) {
			// 			// 3. 如果找到了，就从出发日期开始取 3 天
			// 			targetCasts = allCasts.slice(startIndex, startIndex + 3);
			// 		} else {
			// 			// 4. 如果没找到（通常是因为行程在4天以后，或者已经是过去式）
			// 			// 为了不误导用户，这里可以选择置空，或者记录日志
			// 			console.warn(`[RPA] 天气预报范围(${allCasts[0].date}~${allCasts[allCasts.length - 1].date}) 未覆盖出发日期 ${targetDateStr}`);
			// 			// 这种情况下，weatherText 保持默认的 '暂无天气数据' 也许比给错的要好
			// 			// 或者你可以根据需求决定是否要 fallback 到 allCasts.slice(0, 3)
			// 		}

			// 		if (targetCasts.length > 0) {
			// 			const forecasts = targetCasts.map((c) => `${c.date}: ${c.dayweather}, ${c.nighttemp}~${c.daytemp}℃`).join('; ');
			// 			weatherText = forecasts;
			// 		}
			// 	}
			// } catch (e) {
			// 	console.error('[RPA] 天气查询失败:', e);
			// }

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
			for (let i = 1; i <= totalDays; i++) {
				if (i < totalDays && !existingReminderDays.has(i)) {
					// 计算日期：出发日期 + (第i天 - 1)
					const d = new Date(snapshot.departure_date);
					d.setDate(d.getDate() + (i - 1));

					// 格式化为 YYYY-MM-DD
					const Y = d.getFullYear();
					const M = String(d.getMonth() + 1).padStart(2, '0');
					const D = String(d.getDate()).padStart(2, '0');

					// 生成随机时间 17:00 - 17:59
					const randMin = Math.floor(Math.random() * 60);
					const timeStr = `${Y}-${M}-${D} 18:${String(randMin).padStart(2, '0')}:00`;

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

				// 计算该天的日期字符串
				const d = new Date(snapshot.departure_date);
				d.setDate(d.getDate() + (i - 1));
				const Y = d.getFullYear();
				const M = String(d.getMonth() + 1).padStart(2, '0');
				const D = String(d.getDate()).padStart(2, '0');
				const dateStrPrefix = `${Y}-${M}-${D}`;

				const hasMapTask = rawTasks.some((t) => t.name && t.name.includes('景区游览线路图') && t.start && t.start.startsWith(dateStrPrefix));

				if (!hasMapTask) {
					// 2. 检查这一天是否有包含地图的 POI
					const dayData = itinerary.find((item) => item.day === i);
					let hasValidPoiImage = false;

					if (dayData && dayData.activities) {
						const hasScenic = dayData.activities.some((act) => act.elementType === 'scenic');
						if (hasScenic) {
							// 生成 09:00 ~ 09:30 之间的随机时间
							const rMin = Math.floor(Math.random() * 30);
							const rSec = Math.floor(Math.random() * 60);
							const sendTimeStr = `${dateStrPrefix} 09:${String(rMin).padStart(2, '0')}:${String(rSec).padStart(2, '0')}`;

							console.log(`[RPA] 自动补全 Day ${i} 的景区游览线路图任务`);

							rawTasks.push({
								name: '景区游览线路图', // 确保名字包含关键字
								start: sendTimeStr,
								end: sendTimeStr,
								template: {
									text: '',
									image: '' // 占位，等待主循环填入
								},
								score: ''
							});
						}
					}
				}
			}

			// ================= 2. 任务遍历与分流 =================
			const dailyMapProcessed = new Set();

			for (const task of rawTasks) {
				if (task.order_context) continue;

				const taskName = task.name || '未命名任务';
				const taskScore = task.score || '';

				if (taskName.includes('游览线路及最佳拍摄点推荐')) {
					continue;
				}

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

				if (taskName.includes('景区游览线路图')) {
					// 如果这一天已经生成过地图任务，则跳过后续的
					if (dailyMapProcessed.has(dayKey)) {
						continue;
					}

					let foundImage = false;

					const currentDayData = itinerary.find((d) => d.day === dayIndex);
					if (currentDayData && currentDayData.activities) {
						const poiIdsToFetch = [];
						currentDayData.activities.forEach((act) => {
							if (act.elementType === 'scenic' && act.elementData?.scenic_spots) {
								act.elementData.scenic_spots.forEach((spot) => {
									if (spot.linked_poi_id) {
										poiIdsToFetch.push(spot.linked_poi_id);
									}
								});
							}
						});

						if (poiIdsToFetch.length > 0) {
							try {
								const dbCmd = db.command;
								// 查库找图片
								const poiRes = await db
									.collection('a-poi-database')
									.where({ _id: dbCmd.in(poiIdsToFetch) })
									.field({ route_map_image: true })
									.get();

								if (poiRes.data) {
									// 找到第一个有图的 POI
									const validPoi = poiRes.data.find((p) => p.route_map_image && p.route_map_image.url);
									if (validPoi) {
										console.log(`[RPA] 景区线路图任务：已替换为 POI 图片 -> ${validPoi.route_map_image.url}`);
										task.template.image = validPoi.route_map_image.url;
										task.template.text = '这是今日的游玩线路图/景区游览图，您可以参考一下哦';
										foundImage = true;
									}
								}
							} catch (e) {
								console.error('[RPA] 景区线路图查询图片失败:', e);
							}
						}
					}

					if (foundImage) {
						dailyMapProcessed.add(dayKey); // 只有成功了才标记该天已处理
					} else {
						task.template.text = '';
						task.template.image = '';
						console.log(`[RPA] Day ${dayIndex} 因未查到POI地图，该任务将被丢弃`);
						continue; // 直接跳过本次循环
					}
				}

				let templateText = cleanText(task.template?.text || '');
				let templateImage = task.template?.image || '';

				let finalSendTimeStr = '';
				const datePart = cleanStart.split(' ')[0]; // 获取 YYYY-MM-DD

				// 逻辑分支 A: 明日提醒
				if (taskName.includes('明日提醒')) {
					// 1. 解析任务原始的开始时间
					let targetDate = new Date(cleanStart);

					// 2. 如果解析失败（比如原始时间为空），兜底回 18:00
					if (isNaN(targetDate.getTime())) {
						const h = 18;
						const m = Math.floor(Math.random() * 60);
						finalSendTimeStr = `${datePart} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
					} else {
						// 3. 在原始时间基础上，增加 1 到 10 分钟的随机延迟 (避免早于开始时间)
						const randomDelay = Math.floor(Math.random() * 10 * 60 * 1000);
						const finalTimeMs = targetDate.getTime() + randomDelay;

						// 4. 格式化回字符串
						const d = new Date(finalTimeMs);
						const Y = d.getFullYear();
						const M = String(d.getMonth() + 1).padStart(2, '0');
						const D = String(d.getDate()).padStart(2, '0');
						const H = String(d.getHours()).padStart(2, '0');
						const Min = String(d.getMinutes()).padStart(2, '0');
						const S = String(d.getSeconds()).padStart(2, '0');
						finalSendTimeStr = `${Y}-${M}-${D} ${H}:${Min}:${S}`;
					}
				}

				// 逻辑分支 B: 景区游览线路图 -> 强制锁定在 09:00 - 09:30
				else if (taskName.includes('景区游览线路图')) {
					const rMin = Math.floor(Math.random() * 30);
					const rSec = Math.floor(Math.random() * 60);
					finalSendTimeStr = `${datePart} 09:${String(rMin).padStart(2, '0')}:${String(rSec).padStart(2, '0')}`;

					// 同时更新时间占用记录，防止后续其他任务撞到这个点
					dailyScheduleTracker[datePart] = new Date(finalSendTimeStr).getTime();
				}

				// 逻辑分支 C: 普通任务
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

							// weatherText = '暂无天气数据';
							// const strPieces = routeStr.split(' ');
							// const locations = strPieces[0].split('-');
							// const cityName = locations[locations.length - 1] || '拉萨';
							// console.log('cityName: ', cityName);
							// weatherText = `{{WEATHER::${cityName}::1}}`;

							const rawRoute = routeStr.split(' ')[0] || '拉萨';
							weatherText = `{{WEATHER::${rawRoute}::1}}`;

							// try {
							// 	const wRes = await uniCloud.callFunction({
							// 		name: 'a-weather',
							// 		data: {
							// 			action: 'getWeatherByCityName',
							// 			cityName: cityName || '拉萨', // 默认城市
							// 			extensions: 'all' // 获取预报
							// 		}
							// 	});

							// 	if (wRes.result.errCode === 0 && wRes.result.data?.casts) {
							// 		// 提取未来几天天气，简化成字符串喂给 AI
							// 		const forecasts = wRes.result.data.casts
							// 			.slice(0, 3)
							// 			.map((c) => `${c.date}: ${c.dayweather}, ${c.nighttemp}~${c.daytemp}℃`)
							// 			.join('; ');
							// 		weatherText = forecasts;
							// 	}
							// } catch (e) {
							// 	console.error('[RPA] 天气查询失败:', e);
							// }

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
							// scenicSpotsList.forEach((spot) => {
							// 	if (spot.linked_poi_id && poiDetailMap[spot.linked_poi_id]) {
							// 		const poiData = poiDetailMap[spot.linked_poi_id];
							// 		if (poiData.route_map_image && poiData.route_map_image.url) {
							// 			console.log(`[RPA] 发现路线导览图: ${spot.name}`);
							// 			processedPayload.push({ type: 'image', data: poiData.route_map_image.url });
							// 		}
							// 	}
							// });
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
								weather_data: '西藏地区海拔高，气候多变，昼夜温差大。建议您穿着保暖衣物，如厚外套、羽绒服，内搭毛衣或抓绒衣。请注意根据体感温度及时增减衣物，以防感冒。',
								destination: snapshot.destination_city || '拉萨'
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
							agent_id: executeAgentId,
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
						agent_id: executeAgentId,
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
								agent_id: executeAgentId,
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
						agent_id: executeAgentId,
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

			// ============================================================
			// 注入全局批量任务 (Persistent Batch Tasks)
			// ============================================================
			try {
				const nowStr = new Date().toISOString(); // 或者使用你偏好的时区格式

				// 1. 查询所有“启用中”且“发送时间在未来”的全局任务
				const batchRes = await db
					.collection('a-task-batch')
					.where({
						status: 'active'
					})
					.get();

				const globalTasks = batchRes.data || [];
				const nowMs = Date.now();

				globalTasks.forEach((gTask) => {
					// A. 检查时间：必须是未来的任务
					const sendTimeMs = new Date(gTask.send_time).getTime();
					if (sendTimeMs > nowMs) {
						// B. 检查筛选条件：如果设置了 filter_agent_id，必须匹配当前订单的 agent_id
						if (gTask.filter_agent_id && gTask.filter_agent_id !== executeAgentId) {
							return; // 不匹配，跳过
						}

						console.log(`[RPA] 注入全局任务: ${gTask.task_name} -> ${groupName}`);

						// C. 注入队列
						finalQueue.push({
							task_id: taskId,
							agent_id: executeAgentId,
							account_name: executeAccount,
							group_name: groupName,
							batch_id: gTask._id,
							task_name: gTask.task_name, // 继承全局任务名
							score: '',
							start_time: gTask.send_time, // 窗口开始时间
							end_time: gTask.send_time, // 窗口结束时间
							status: 'manual_stop', // 默认暂停，安全起见
							payload: gTask.payload, // 继承内容
							send_time: gTask.send_time, // 设定发送时间
							created_at: Date.now(),
							source: 'batch_inject' // 标记来源
						});
					}
				});
			} catch (e) {
				console.error('[RPA] 注入全局任务失败:', e);
				// 不阻断主流程
			}
			// ============================================================

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
	},

	/**
	 * 检查并生成缺失的任务数据（不直接入库，返回待添加数组）
	 * @param {Object} taskOrder 订单对象
	 * @param {Object} snapshot 快照对象
	 * @param {Array} existingQueue 当前数据库里的任务列表
	 * @param {Boolean} onlyRouteMap 是否只处理线路图（用于批量脚本）
	 */
	async _checkAndGenMissingTasks(taskOrder, snapshot, existingQueue, onlyRouteMap = false) {
		const db = uniCloud.database();
		const dbCmd = db.command;
		const tasksToAdd = [];
		const idsToDelete = [];

		const departureDate = new Date(snapshot.departure_date);
		const totalDays = snapshot.total_days;
		const itinerary = snapshot.itinerary || [];

		// 辅助函数：获取日期字符串
		const getDateStr = (dayIndex) => {
			const d = new Date(departureDate);
			d.setDate(d.getDate() + (dayIndex - 1));
			const Y = d.getFullYear();
			const M = String(d.getMonth() + 1).padStart(2, '0');
			const D = String(d.getDate()).padStart(2, '0');
			return `${Y}-${M}-${D}`;
		};

		// 辅助函数：查找已存在的任务对象（返回对象以便获取_id）
		const findExistingTask = (dayDateStr, keyword) => {
			return existingQueue.find((t) => {
				const nameMatch = t.task_name && t.task_name.includes(keyword);
				// 匹配 send_time 或 start_time
				const timeMatch = (t.send_time && t.send_time.startsWith(dayDateStr)) || (t.start_time && t.start_time.startsWith(dayDateStr));
				return nameMatch && timeMatch;
			});
		};

		for (let i = 1; i <= totalDays; i++) {
			const dateStr = getDateStr(i);

			// ================= logic 1: 智能处理“景区游览线路图” =================
			// const isMiddlePhase = i > 1 && i < totalDays; // 除去第1天和最后1天

			if (true) {
				// 如果已存在，则直接跳过，不查库、不删除、不重新生成
				if (findExistingTask(dateStr, '景区游览线路图')) {
					continue;
				}

				// 1. 先尝试去库里找图
				const dayData = itinerary.find((d) => d.day === i);
				let foundImgUrl = null;

				if (dayData && dayData.activities) {
					const poiIds = [];
					dayData.activities.forEach((act) => {
						if (act.elementType === 'scenic' && act.elementData?.scenic_spots) {
							act.elementData.scenic_spots.forEach((s) => {
								if (s.linked_poi_id) poiIds.push(s.linked_poi_id);
							});
						}
					});

					if (poiIds.length > 0) {
						const poiRes = await db
							.collection('a-poi-database')
							.where({
								_id: dbCmd.in(poiIds),
								'route_map_image.url': dbCmd.neq(null)
							})
							.field({ route_map_image: 1 })
							.limit(1)
							.get();

						if (poiRes.data.length > 0) {
							foundImgUrl = poiRes.data[0].route_map_image.url;
						}
					}
				}

				// 2. 只有查到了新图，才执行“删旧生新”
				if (foundImgUrl) {
					// 检查该天是否已经有旧任务
					// const oldTask = findExistingTask(dateStr, '景区游览线路图');
					// if (oldTask) {
					// 	idsToDelete.push(oldTask._id); // 标记删除旧的
					// }

					// 准备新任务
					const rMin = Math.floor(Math.random() * 30);
					const rSec = Math.floor(Math.random() * 60);
					const sendTime = `${dateStr} 09:${String(rMin).padStart(2, '0')}:${String(rSec).padStart(2, '0')}`;

					tasksToAdd.push({
						task_id: taskOrder._id,
						agent_id: taskOrder.agent_id,
						account_name: taskOrder.account_name,
						group_name: taskOrder.order_id,
						task_name: '景区游览线路图',
						start_time: sendTime,
						end_time: sendTime,
						status: 'manual_stop',
						payload: [
							{ type: 'text', data: '这是今日的游玩线路图/景区游览图，您可以参考一下哦' },
							{ type: 'image', data: foundImgUrl }
						],
						send_time: sendTime,
						created_at: Date.now()
					});
				}
				// else: 没查到图 -> 如果原来有旧任务，保留不动；如果没有，也不生成。
			}

			// ================= logic 2: 补全“明日提醒” (保持原有“仅补全”逻辑) =================
			// if (!onlyRouteMap) {
			// 	if (i < totalDays && !findExistingTask(dateStr, '明日提醒')) {
			// 		const rMin = Math.floor(Math.random() * 60);
			// 		const sendTime = `${dateStr} 18:${String(rMin).padStart(2, '0')}:00`;

			// 		tasksToAdd.push({
			// 			task_id: taskOrder._id,
			// 			agent_id: taskOrder.agent_id,
			// 			account_name: taskOrder.account_name,
			// 			group_name: taskOrder.order_id,
			// 			task_name: '明日提醒',
			// 			start_time: sendTime,
			// 			end_time: sendTime,
			// 			status: 'manual_stop',
			// 			payload: [{ type: 'text', data: '明日行程预告（系统自动补全，请编辑内容）' }],
			// 			send_time: sendTime,
			// 			created_at: Date.now()
			// 		});
			// 	}
			// }
		}

		return { tasksToAdd, idsToDelete };
	},

	/**
	 * 前端“刷新状态”按钮调用 - 自动补全当前订单缺失任务
	 */
	async patchMissingTasks(taskId) {
		const db = uniCloud.database();
		const dbCmd = db.command;
		if (!taskId) return { errCode: 1, msg: 'Missing taskId' };

		// 1. 获取订单
		const orderRes = await db.collection('a-task-orders').doc(taskId).get();
		if (orderRes.data.length === 0) return { errCode: 1, msg: 'Order not found' };
		const order = orderRes.data[0];

		// 2. 获取快照
		const snapRes = await db.collection('a-snapshots').where({ order_id: order.order_id }).limit(1).get();
		if (snapRes.data.length === 0) return { errCode: 1, msg: 'Snapshot not found' };
		const snapshot = snapRes.data[0];

		// 3. 获取现有队列
		const queueRes = await db.collection('a-task-queue').where({ task_id: taskId }).limit(1000).get();
		const existingQueue = queueRes.data;

		// 1. 计算出需要增加的任务 和 需要删除的旧任务
		const { tasksToAdd, idsToDelete } = await serviceModule._checkAndGenMissingTasks(order, snapshot, existingQueue, false);

		let msg = '检查完毕';

		// 2. 执行删除
		if (idsToDelete.length > 0) {
			await db
				.collection('a-task-queue')
				.where({
					_id: dbCmd.in(idsToDelete)
				})
				.remove();
			msg += `，替换了 ${idsToDelete.length} 条旧任务`;
		}

		// 3. 执行新增
		if (tasksToAdd.length > 0) {
			await db.collection('a-task-queue').add(tasksToAdd);
			msg += `，新增了 ${tasksToAdd.length} 条任务`;
		}

		if (idsToDelete.length === 0 && tasksToAdd.length === 0) {
			msg += '，暂无缺失或更新';
		}

		return { errCode: 0, msg: msg };
	},

	/**
	 * 一次性脚本 - 扫描所有订单并补全线路图
	 * 使用方法：在云函数 URL 或测试控制台调用此方法
	 */
	async batchFillAllRouteMaps() {
		const db = uniCloud.database();
		const dbCmd = db.command;
		console.log('[Batch] 开始批量优化线路图...');

		const ordersRes = await db
			.collection('a-task-orders')
			.where({
				// 可选：过滤条件
			})
			.limit(1000)
			.get();

		const orders = ordersRes.data;
		let totalAdded = 0;
		let totalDeleted = 0;
		let processedOrders = 0;

		for (const order of orders) {
			try {
				const snapRes = await db.collection('a-snapshots').where({ order_id: order.order_id }).limit(1).get();
				if (snapRes.data.length === 0) continue;
				const snapshot = snapRes.data[0];

				const queueRes = await db.collection('a-task-queue').where({ task_id: order._id }).get();
				const existingQueue = queueRes.data;

				// 调用核心逻辑 (onlyRouteMap=true)
				const { tasksToAdd, idsToDelete } = await serviceModule._checkAndGenMissingTasks(order, snapshot, existingQueue, true);

				if (idsToDelete.length > 0) {
					await db
						.collection('a-task-queue')
						.where({
							_id: dbCmd.in(idsToDelete)
						})
						.remove();
					totalDeleted += idsToDelete.length;
				}

				if (tasksToAdd.length > 0) {
					await db.collection('a-task-queue').add(tasksToAdd);
					totalAdded += tasksToAdd.length;
				}

				if (tasksToAdd.length > 0 || idsToDelete.length > 0) {
					console.log(`[Batch] 订单 ${order.order_id}: 删${idsToDelete.length}/增${tasksToAdd.length}`);
				}
				processedOrders++;
			} catch (e) {
				console.error(`[Batch] 处理订单 ${order.order_id} 失败:`, e);
			}
		}

		return { errCode: 0, msg: `处理完成: 扫描${processedOrders}个订单, 替换(删除)${totalDeleted}条, 新增${totalAdded}条` };
	},

	/**
	 * 当行程发生变动（删除天数、交换顺序）时，同步调整任务队列的时间
	 * @param {Object} params
	 * @param {String} params.orderId 订单号
	 * @param {String} params.action 'delete' | 'swap' | 'insert'
	 * @param {Object} params.data 具体参数 { dayIndex, fromIndex, toIndex, totalDaysBefore }
	 */
	async handleItineraryChange(params) {
		const { orderId, action, data } = params;
		if (!orderId) return { errCode: 1, errMsg: 'Missing orderId' };

		const db = uniCloud.database();
		const dbCmd = db.command;

		// 1. 获取快照以确定出发日期
		const snapRes = await db.collection('a-snapshots').where({ order_id: orderId }).field({ departure_date: 1 }).limit(1).get();

		if (snapRes.data.length === 0) return { errCode: 1, errMsg: 'Snapshot not found' };

		// 获取出发日期对象（注意时区，这里统一按 Beijing Time 0点处理计算天数偏移）
		const departureTimestamp = snapRes.data[0].departure_date;

		// 辅助函数：根据天数索引获取日期字符串前缀 (YYYY-MM-DD)
		const getDateStr = (dayIdx) => {
			const d = new Date(departureTimestamp);
			d.setDate(d.getDate() + dayIdx); // dayIdx 0 = Day1
			const Y = d.getFullYear();
			const M = String(d.getMonth() + 1).padStart(2, '0');
			const D = String(d.getDate()).padStart(2, '0');
			return `${Y}-${M}-${D}`;
		};

		// 辅助函数：调整时间字符串的天数
		const shiftTimeStr = (timeStr, dayOffset) => {
			try {
				const d = new Date(timeStr);
				d.setDate(d.getDate() + dayOffset);
				const Y = d.getFullYear();
				const M = String(d.getMonth() + 1).padStart(2, '0');
				const D = String(d.getDate()).padStart(2, '0');
				const H = String(d.getHours()).padStart(2, '0');
				const Min = String(d.getMinutes()).padStart(2, '0');
				const S = String(d.getSeconds()).padStart(2, '0');
				return `${Y}-${M}-${D} ${H}:${Min}:${S}`;
			} catch (e) {
				return timeStr;
			}
		};

		// 辅助函数：计算两个日期相差的天数
		const getDiffDays = (dateStr) => {
			try {
				const target = new Date(dateStr.split(' ')[0]);
				const start = new Date(getDateStr(0));
				// 忽略时分秒，仅计算日期差
				target.setHours(0, 0, 0, 0);
				start.setHours(0, 0, 0, 0);
				return Math.round((target - start) / (1000 * 60 * 60 * 24));
			} catch (e) {
				return -1;
			}
		};

		let limitDateStr = null;
		if (data.totalDaysBefore) {
			// totalDaysBefore 是总天数 (如 5)，转为索引是 4
			limitDateStr = getDateStr(data.totalDaysBefore - 1);
		}

		try {
			// 获取该订单下的所有未完成任务
			// 注意：已完成(done)的任务通常不建议修改，防止历史记录混乱，这里只改待发送的
			const queueRes = await db
				.collection('a-task-queue')
				.where({
					group_name: orderId, // group_name 通常存的是 order_id
					status: dbCmd.in(['pending', 'manual_stop', 'failed'])
				})
				.limit(1000)
				.get();

			const tasks = queueRes.data;
			if (tasks.length === 0) return { errCode: 0, msg: '没有需要调整的任务' };

			// === 场景 A: 删除某一天 (Delete) ===
			if (action === 'delete') {
				const targetDayIndex = data.dayIndex; // 0-based index
				const targetDateStr = getDateStr(targetDayIndex);

				const deleteIds = [];
				const updateTasks = [];

				for (const task of tasks) {
					const taskTime = task.send_time || task.start_time;
					if (!taskTime) continue;

					if (limitDateStr && taskTime.split(' ')[0] > limitDateStr) {
						continue;
					}

					const currentSendIdx = getDiffDays(taskTime);
					if (currentSendIdx < 0) continue;

					// 确定内容关联日
					const isTomorrowReminder = task.task_name && task.task_name.includes('明日提醒');
					let targetItineraryIdx = isTomorrowReminder ? currentSendIdx + 1 : currentSendIdx;

					// 逻辑修正：
					// 1. 如果任务的“发送日”被删了 (例如删D2，D2上的提醒)
					if (currentSendIdx === targetDayIndex) {
						if (currentSendIdx > 0) {
							// 保护机制：如果前面还有日子(如D1)，则把该任务前移到D1发送
							// 场景：删D2，原D2发的是关于D3的。现在D3变成了D2，所以要在D1发
							updateTasks.push({
								_id: task._id,
								send_time: shiftTimeStr(task.send_time, -1),
								start_time: shiftTimeStr(task.start_time, -1),
								end_time: shiftTimeStr(task.end_time, -1)
							});
						} else {
							// 如果删的是D1，前面没日子了，只能删除
							deleteIds.push(task._id);
						}
					}
					// 2. 如果任务的“内容关联日”被删了 (例如删D2，D1上发的关于D2的提醒)
					else if (targetItineraryIdx === targetDayIndex) {
						// 内容都没了，提醒必须删
						deleteIds.push(task._id);
					}
					// 3. 如果内容关联日 在被删除日期之后 -> 整体前移
					else if (targetItineraryIdx > targetDayIndex) {
						updateTasks.push({
							_id: task._id,
							send_time: shiftTimeStr(task.send_time, -1),
							start_time: shiftTimeStr(task.start_time, -1),
							end_time: shiftTimeStr(task.end_time, -1)
						});
					}
				}

				// 执行数据库操作
				if (deleteIds.length > 0) {
					await db
						.collection('a-task-queue')
						.where({ _id: dbCmd.in(deleteIds) })
						.remove();
				}

				// 批量更新太慢，循环更新 (或者使用 Promise.all)
				for (const u of updateTasks) {
					await db.collection('a-task-queue').doc(u._id).update({
						send_time: u.send_time,
						start_time: u.start_time,
						end_time: u.end_time,
						updated_at: Date.now()
					});
				}

				return { errCode: 0, msg: `删除了 ${deleteIds.length} 个任务，调整了 ${updateTasks.length} 个任务` };
			}

			// === 场景 B: 交换两天顺序 (Swap) ===
			if (action === 'swap') {
				const { fromIndex, toIndex } = data;

				const updateTasks = [];

				for (const task of tasks) {
					const taskTime = task.send_time || task.start_time;
					if (!taskTime) continue;

					const currentSendIdx = getDiffDays(taskTime);
					if (currentSendIdx < 0) continue;

					const isTomorrowReminder = task.task_name && task.task_name.includes('明日提醒');
					let targetItineraryIdx = isTomorrowReminder ? currentSendIdx + 1 : currentSendIdx;

					// 核心逻辑：只看“内容关联日”是否涉及交换
					// 如果 targetItineraryIdx 是被交换的那两天之一，则更新 Target
					let newTargetIdx = targetItineraryIdx;
					if (targetItineraryIdx === fromIndex) newTargetIdx = toIndex;
					else if (targetItineraryIdx === toIndex) newTargetIdx = fromIndex;

					// 如果 Target 没变（例如 D2上的提醒关于D3，D3没动），则 newSendIdx 也不变，任务不动。

					let newSendIdx = isTomorrowReminder ? newTargetIdx - 1 : newTargetIdx;

					if (newSendIdx !== currentSendIdx) {
						const dayOffset = newSendIdx - currentSendIdx;
						updateTasks.push({
							_id: task._id,
							send_time: shiftTimeStr(task.send_time, dayOffset),
							start_time: shiftTimeStr(task.start_time, dayOffset),
							end_time: shiftTimeStr(task.end_time, dayOffset)
						});
					}
				}

				for (const u of updateTasks) {
					await db.collection('a-task-queue').doc(u._id).update({
						send_time: u.send_time,
						start_time: u.start_time,
						end_time: u.end_time,
						updated_at: Date.now()
					});
				}

				return { errCode: 0, msg: `交换了 ${updateTasks.length} 个任务的时间` };
			}

			// === 场景 C: 插入一天 (Insert) ===
			if (action === 'insert') {
				const insertIndex = data.insertIndex; // 新的一天被插入的位置索引

				const updateTasks = [];

				for (const task of tasks) {
					const taskTime = task.send_time || task.start_time;
					if (!taskTime) continue;

					if (limitDateStr && taskTime.split(' ')[0] > limitDateStr) {
						continue;
					}

					const currentSendIdx = getDiffDays(taskTime);
					if (currentSendIdx < 0) continue;
					const isTomorrowReminder = task.task_name && task.task_name.includes('明日提醒');
					let targetItineraryIdx = isTomorrowReminder ? currentSendIdx + 1 : currentSendIdx;

					// 逻辑：如果 内容关联日 >= 插入位置，说明这天的内容被挤到后面去了
					// 例如插入在 Index 1 (D2)。
					// 任务A：Sent D1, Target D2 (Idx 1)。 Target 1 >= 1。 Shift +1。 -> Sent D2, Target D3. (D1空缺，正确)
					if (targetItineraryIdx >= insertIndex) {
						updateTasks.push({
							_id: task._id,
							send_time: shiftTimeStr(task.send_time, 1),
							start_time: shiftTimeStr(task.start_time, 1),
							end_time: shiftTimeStr(task.end_time, 1)
						});
					}
				}

				// 批量更新
				for (const u of updateTasks) {
					await db.collection('a-task-queue').doc(u._id).update({
						send_time: u.send_time,
						start_time: u.start_time,
						end_time: u.end_time,
						updated_at: Date.now()
					});
				}

				return { errCode: 0, msg: `因插入天数，顺延了 ${updateTasks.length} 个任务` };
			}

			// === 场景 D: 移动/插入排序 (Move) ===
			if (action === 'move') {
				const { fromIndex, toIndex } = data; // 0-based index

				// 如果位置没变，直接返回
				if (fromIndex === toIndex) return { errCode: 0 };

				const updateTasks = [];

				for (const task of tasks) {
					const taskTime = task.send_time || task.start_time;
					if (!taskTime) continue;

					// 1. 计算当前任务属于“第几天”的行程
					// 注意：0代表Day1。
					let currentDayIdx = getDiffDays(taskTime);

					// 2. 特殊处理【明日提醒】
					// 明日提醒通常在 Day N 发送，内容是关于 Day N+1 的
					// 所以它的“关联行程索引”应该是 currentDayIdx + 1
					let associatedItineraryIdx = currentDayIdx;
					const isTomorrowReminder = task.task_name && task.task_name.includes('明日提醒');

					if (isTomorrowReminder) {
						associatedItineraryIdx = currentDayIdx + 1;
					}

					// 3. 计算移动后的新索引
					let newItineraryIdx = associatedItineraryIdx;

					if (fromIndex < toIndex) {
						// 从前向后拖动 (例如把 Day1 拖到 Day3 后面)
						if (associatedItineraryIdx === fromIndex) {
							// 被拖动的这一天，直接变更为目标位置
							newItineraryIdx = toIndex;
						} else if (associatedItineraryIdx > fromIndex && associatedItineraryIdx <= toIndex) {
							// 中间的日子，自动前移一位 (Day2 -> Day1)
							newItineraryIdx = associatedItineraryIdx - 1;
						}
					} else {
						// 从后向前拖动 (例如把 Day4 拖到 Day2 前面)
						if (associatedItineraryIdx === fromIndex) {
							// 被拖动的这一天，直接变更为目标位置
							newItineraryIdx = toIndex;
						} else if (associatedItineraryIdx >= toIndex && associatedItineraryIdx < fromIndex) {
							// 中间的日子，自动后移一位 (Day2 -> Day3)
							newItineraryIdx = associatedItineraryIdx + 1;
						}
					}

					// 4. 如果索引发生了变化，计算新的时间
					if (newItineraryIdx !== associatedItineraryIdx) {
						// 反向计算：新的任务日期索引
						let newTaskDayIdx = newItineraryIdx;

						// 如果是明日提醒，任务日期要比行程日期早一天
						if (isTomorrowReminder) {
							newTaskDayIdx = newItineraryIdx - 1;
						}

						// 计算日期偏移量 (新 - 旧)
						const dayOffset = newTaskDayIdx - currentDayIdx;

						updateTasks.push({
							_id: task._id,
							send_time: shiftTimeStr(task.send_time, dayOffset),
							start_time: shiftTimeStr(task.start_time, dayOffset),
							end_time: shiftTimeStr(task.end_time, dayOffset)
						});
					}
				}

				// 批量更新
				for (const u of updateTasks) {
					await db.collection('a-task-queue').doc(u._id).update({
						send_time: u.send_time,
						start_time: u.start_time,
						end_time: u.end_time,
						updated_at: Date.now()
					});
				}

				return { errCode: 0, msg: `因行程顺序调整，更新了 ${updateTasks.length} 个任务` };
			}
		} catch (e) {
			console.error(e);
			return { errCode: 500, errMsg: e.message };
		}
	}
};

module.exports = serviceModule;
