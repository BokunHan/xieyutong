const uniIdCommon = require('uni-id-common');

const numericFields = new Set([
	'duration',
	'total_days',
	'day',
	'time_duration_hours',
	'time_duration_minutes',
	'driving_distance',
	'driving_duration_hours',
	'driving_duration_minutes'
]);

const requiredFields = new Set(['total_days', 'day']);

// 获取用户当前进行中的行程
// async function getCurrentItinerary(userId) {
// 	const db = uniCloud.databaseForJQL({
// 		clientInfo: this.getClientInfo()
// 	});

// 	console.log('[行程服务] 查询用户当前行程，用户ID:', userId);

// 	// 1. 查询用户所有已支付且未完成的订单
// 	const ordersResult = await db
// 		.collection('a-orders')
// 		.where({
// 			user_id: userId,
// 			status: db.command.in(['paid', 'confirmed', 'processing'])
// 		})
// 		.field('_id, product_id, departure_date, return_date, duration_days, product_snapshot')
// 		.orderBy('departure_date', 'asc')
// 		.get();

// 	if (!ordersResult.data || ordersResult.data.length === 0) {
// 		console.log('[行程服务] 用户没有进行中的订单');
// 		return null;
// 	}

// 	console.log('[行程服务] 找到进行中的订单:', ordersResult.data.length, '个');

// 	// 2. 检查订单是否在行程期间（当前时间 <= 行程结束时间）
// 	const currentTime = Date.now();

// 	for (const order of ordersResult.data) {
// 		if (!order.departure_date) {
// 			console.log('[行程服务] 订单缺少出发日期，跳过:', order.order_no);
// 			continue;
// 		}

// 		// 安全地处理时间戳格式的出发日期
// 		let rawTime;
// 		if (order.departure_date instanceof Date) {
// 			rawTime = order.departure_date.getTime();
// 		} else if (typeof order.departure_date === 'number') {
// 			rawTime = order.departure_date;
// 		} else if (typeof order.departure_date === 'string') {
// 			rawTime = parseInt(order.departure_date);
// 			if (isNaN(rawTime)) {
// 				console.log('[行程服务] 无效的出发日期格式，跳过:', order.order_no, order.departure_date);
// 				continue;
// 			}
// 		} else {
// 			console.log('[行程服务] 未知的出发日期格式，跳过:', order.order_no, order.departure_date);
// 			continue;
// 		}

// 		const dateobj = new Date(rawTime);
// 		dateobj.setHours(0, 0, 0, 0);
// 		let departureTime = dateobj.getTime();

// 		// 获取行程天数，优先级：订单中的duration_days > 行程表中的total_days > 默认1天
// 		let totalDays = 0;

// 		// 1. 首先尝试从订单中获取天数
// 		if (order.duration_days && typeof order.duration_days === 'number' && order.duration_days > 0) {
// 			totalDays = order.duration_days;
// 		} else {
// 			// 2. 从行程表中查询天数
// 			try {
// 				const itineraryResult = await db
// 					.collection('a-itineraries')
// 					.where({
// 						product_id: order.product_id
// 					})
// 					.field('total_days')
// 					.get();

// 				if (itineraryResult.data && itineraryResult.data[0] && itineraryResult.data[0].total_days) {
// 					totalDays = itineraryResult.data[0].total_days;
// 				}
// 			} catch (error) {
// 				console.log('[行程服务] 查询行程表失败:', error.message);
// 			}

// 			// 3. 默认值
// 			if (totalDays <= 0) {
// 				totalDays = 1;
// 				console.log('[行程服务] 使用默认行程天数1天，订单:', order.order_no);
// 			}
// 		}

// 		// 计算行程结束时间
// 		let itineraryEndTime;

// 		// 如果有明确的返回日期且有效，优先使用
// 		if (order.return_date) {
// 			if (order.return_date instanceof Date) {
// 				itineraryEndTime = order.return_date.getTime();
// 			} else if (typeof order.return_date === 'number') {
// 				itineraryEndTime = order.return_date;
// 			} else if (typeof order.return_date === 'string') {
// 				itineraryEndTime = parseInt(order.return_date);
// 				if (isNaN(itineraryEndTime)) {
// 					itineraryEndTime = null;
// 				}
// 			}
// 		}

// 		// 如果没有有效的返回日期，使用出发时间 + 行程天数计算
// 		if (!itineraryEndTime || itineraryEndTime <= departureTime) {
// 			// 计算行程结束时间：出发日期 + (行程天数-1) * 24小时
// 			// 注意：8天行程实际上是从第1天到第8天，所以结束时间是出发时间 + 7*24小时 + 23小时59分59秒
// 			const daysToAdd = totalDays - 1; // 减1是因为出发当天算第1天
// 			const hoursToAdd = 23; // 添加23小时59分59秒，表示行程最后一天的结束
// 			const minutesToAdd = 59;
// 			const secondsToAdd = 59;

// 			itineraryEndTime = departureTime + daysToAdd * 24 * 60 * 60 * 1000 + hoursToAdd * 60 * 60 * 1000 + minutesToAdd * 60 * 1000 + secondsToAdd * 1000;
// 		}

// 		console.log('[行程服务] 检查订单:', {
// 			orderId: order.order_no,
// 			productId: order.product_id,
// 			departureTime: new Date(departureTime).toISOString(),
// 			itineraryEndTime: new Date(itineraryEndTime).toISOString(),
// 			totalDays,
// 			currentTime: new Date(currentTime).toISOString(),
// 			isActive: currentTime <= itineraryEndTime,
// 			hasReturnDate: !!order.return_date,
// 			durationDays: order.duration_days
// 		});

// 		// 如果当前时间 <= 行程结束时间，说明行程还在进行中
// 		if (currentTime <= itineraryEndTime) {
// 			// 查询商品和行程详细信息
// 			const [productResult, itineraryResult] = await Promise.all([
// 				db.collection('a-products').where({ _id: order.product_id }).field('title, product_images').get(),
// 				db.collection('a-itineraries').where({ product_id: order.product_id }).field('title, total_days, itinerary').get()
// 			]);

// 			if (!productResult.data || productResult.data.length === 0) {
// 				console.log('[行程服务] 未找到商品信息，跳过订单:', order.order_no);
// 				continue;
// 			}

// 			if (!itineraryResult.data || itineraryResult.data.length === 0) {
// 				console.log('[行程服务] 未找到行程信息，跳过订单:', order.order_no);
// 				continue;
// 			}

// 			// 计算当前是第几天（从出发日期开始算）
// 			const daysPassed = Math.floor((currentTime - departureTime) / (24 * 60 * 60 * 1000)) + 1;
// 			const currentDay = Math.max(1, Math.min(daysPassed, totalDays));

// 			console.log('[行程服务] 找到进行中的行程:', {
// 				orderId: order.order_no,
// 				productId: order.product_id,
// 				currentDay,
// 				totalDays,
// 				daysPassed
// 			});

// 			// 格式化日期字符串
// 			const formatDate = (timestamp) => {
// 				const date = new Date(timestamp);
// 				return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
// 			};

// 			order.order_id = order.order_no; // 与snapshot中的order_id字段保持一致

// 			return {
// 				order,
// 				product: productResult.data[0],
// 				itinerary: itineraryResult.data[0],
// 				currentDay,
// 				totalDays,
// 				departureDate: formatDate(departureTime),
// 				endDate: formatDate(itineraryEndTime)
// 			};
// 		}
// 	}

// 	console.log('[行程服务] 没有找到进行中的行程');
// 	return null;
// }

// 绑定并获取当前行程（通过订单号输入）
async function getItineraryByOrderId(userId, orderId) {
	if (!userId) {
		return {
			errCode: 'MISSING_USERID',
			errMsg: '缺少用户ID参数'
		};
	}

	const db = uniCloud.database();
	const cmd = db.command;
	const $ = db.command.aggregate;
	let orderType = 'mp';
	let orderResult;

	if (orderId) {
		console.log(`[行程服务] 将orderId存入用户数据，用户ID: ${userId}, 订单号:${orderId}`);
		let result = await db
			.collection('uni-id-users')
			.doc(userId)
			.update({ $set: { user_input_order_id: orderId } });

		if (result && result.updated > 0) {
			console.log('[行程服务] 订单号存入用户数据成功');
		} else {
			console.log('[行程服务] 订单号存入失败或无需更新');
		}

		// let mobile = '';
		// result = await db.collection('uni-id-users').doc(userId).field({ mobile: true }).get();
		// if (result && result.data && result.data.length > 0) {
		// 	mobile.result.data[0].mobile;
		// }

		orderResult = await db.collection('a-orders').where({ order_no: orderId }).get();
		if (!orderResult.data || orderResult.data.length === 0) {
			orderType = 'snapshot';
			orderResult = await db
				.collection('a-snapshots')
				.where({
					order_id: orderId
				})
				.get();

			if (!orderResult.data || orderResult.data.length === 0) {
				console.log(`[行程服务] 未查询到订单号为${orderId}的行程`);
				return null;
			}
			// } else if (mobile) {
			// 	const newTraveler = { id: userId, mobile: mobile };
			// 	result = await db
			// 		.collection('a-snapshots')
			// 		.where({ order_id: orderId, 'travel_users.id': cmd.neq(userId) })
			// 		.update({ travel_users: cmd.push(newTraveler) });
			// 	if (result && result.updated > 0) {
			// 		console.log('[行程服务] 成功将用户加入snapshots出行用户');
			// 	} else {
			// 		console.log('[行程服务] 用户加入snapshots出行用户失败');
			// 	}
			// }
		}
		// } else if (mobile) {
		// 	const newTraveler = { id: userId, mobile: mobile };
		// 	result = await db
		// 		.collection('a-orders')
		// 		.where({ order_no: orderId, 'travel_users.id': cmd.neq(userId) })
		// 		.update({ travel_users: cmd.push(newTraveler) });
		// 	if (result && result.updated > 0) {
		// 		console.log('[行程服务] 成功将用户加入orders出行用户');
		// 	} else {
		// 		console.log('[行程服务] 用户加入orders出行用户失败');
		// 	}
		// }
	} else {
		// console.log('[行程服务] 在用户数据中查询当前行程订单号');
		// const result = await db.collection('uni-id-users').where({ _id: userId }).field({ user_input_order_id: true }).get();

		// if (result.data && result.data.length > 0 && result.data[0].user_input_order_id) {
		// 	orderId = result.data[0].user_input_order_id;
		// 	console.log('[行程服务] 成功获取当前行程订单号：', orderId);
		// } else {
		// 	console.log('[行程服务] 获取当前行程订单号失败，用户ID: ', userId);
		// 	return null;
		// }
		console.log('[行程服务] 在orders和snapshots数据表中查询当前行程订单号');
		const now = Date.now();
		const ordersWhere = cmd.and([
			{ 'travel_users.id': userId },
			// { departure_date: cmd.lte(now) },
			cmd.expr($.gte([$.add(['$departure_date', $.multiply(['$duration_days', 24 * 60 * 60 * 1000])]), now]))
		]);

		orderResult = await db.collection('a-orders').where(ordersWhere).get();
		if (!orderResult || !orderResult.data || orderResult.data.length === 0) {
			const snapshotsWhere = cmd.and([
				{ 'travel_users.id': userId },
				// { departure_date: cmd.lte(now) },
				cmd.expr($.gte([$.add(['$departure_date', $.multiply(['$total_days', 24 * 60 * 60 * 1000])]), now]))
			]);
			console.log('[行程服务] snapshotsWhere: ', snapshotsWhere);
			orderResult = await db.collection('a-snapshots').where(snapshotsWhere).get();
			if (!orderResult || !orderResult.data || orderResult.data.length === 0) {
				console.log(`[行程服务] 未查询到当前有正在进行的订单`);
				return null;
			} else {
				orderId = orderResult.data[0].order_id;
			}
		} else {
			orderId = orderResult.data[0].order_no;
		}
	}

	console.log(`[行程服务] 已找到订单号为${orderId}的行程`);

	// 2. 检查订单是否在行程期间（当前时间 <= 行程结束时间）
	const currentTime = Date.now();
	const order = orderResult.data[0];
	order.orderType = orderType;

	if (!order.departure_date) {
		console.log('[行程服务] 订单缺少出发日期，订单号：', orderId);
		return null;
	}

	// 安全地处理时间戳格式的出发日期
	const departureDateObj = new Date(order.departure_date);
	departureDateObj.setHours(0, 0, 0, 0);
	let departureTime = departureDateObj.getTime();

	let totalDays = 0;

	// 1. 首先尝试从订单中获取天数
	if (order.duration_days && typeof order.duration_days === 'number' && order.duration_days > 0) totalDays = order.duration_days;
	else if (order.total_days && typeof order.total_days === 'number' && order.total_days > 0) totalDays = order.total_days;
	else {
		console.log('[行程服务] 订单缺少行程天数，订单号：', orderId);
		return null;
	}

	// 计算行程结束时间：出发日期 + (行程天数-1) * 24小时
	// 注意：8天行程实际上是从第1天到第8天，所以结束时间是出发时间 + 7*24小时 + 23小时59分59秒
	const daysToAdd = totalDays - 1; // 减1是因为出发当天算第1天
	const hoursToAdd = 23; // 添加23小时59分59秒，表示行程最后一天的结束
	const minutesToAdd = 59;
	const secondsToAdd = 59;
	const itineraryEndTime = departureTime + daysToAdd * 24 * 60 * 60 * 1000 + hoursToAdd * 60 * 60 * 1000 + minutesToAdd * 60 * 1000 + secondsToAdd * 1000;

	console.log('[行程服务] 检查订单:', {
		orderId: orderId,
		productId: order.product_id,
		departureTime: new Date(departureTime).toISOString(),
		itineraryEndTime: new Date(itineraryEndTime).toISOString(),
		totalDays,
		currentTime: new Date(currentTime).toISOString(),
		isActive: currentTime <= itineraryEndTime
	});

	// 如果当前时间 <= 行程结束时间，说明行程还在进行中
	if (currentTime <= itineraryEndTime) {
		// 查询商品和行程详细信息
		let productResult = { data: [] };
		productResult = await db.collection('a-products').where({ _id: order.product_id }).field({ title: true, product_images: true }).get();

		let itineraryResult = {};
		if (orderType === 'mp') {
			itineraryResult = await db.collection('a-itineraries').where({ product_id: order.product_id }).field({ title: true, total_days: true, itinerary: true }).get();
		} else if (orderType === 'snapshot') {
			itineraryResult = await db.collection('a-snapshots').where({ order_id: orderId }).field({ title: true, total_days: true, itinerary: true }).get();
		}

		if (!productResult.data || productResult.data.length === 0) {
			console.log('[行程服务] 未找到商品信息，订单号:', orderId);
			return null;
		}

		if (!itineraryResult.data || itineraryResult.data.length === 0) {
			console.log('[行程服务] 未找到行程，订单号:', orderId);
			return null;
		}

		// 计算当前是第几天（从出发日期开始算）
		const daysPassed = Math.floor((currentTime - departureTime) / (24 * 60 * 60 * 1000)) + 1;
		const currentDay = Math.max(1, Math.min(daysPassed, totalDays));

		console.log('[行程服务] 找到进行中的行程:', {
			orderId: orderId,
			productId: order.product_id,
			currentDay,
			totalDays,
			daysPassed
		});

		// 格式化日期字符串
		const formatDate = (timestamp) => {
			const date = new Date(timestamp);
			return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
		};

		return {
			order,
			product: productResult.data[0],
			itinerary: itineraryResult.data[0],
			currentDay,
			totalDays,
			departureDate: formatDate(departureTime),
			endDate: formatDate(itineraryEndTime)
		};
	}

	console.log('[行程服务] 没有找到进行中的快照行程');
	return null;
}

module.exports = {
	_before() {
		this.uniIdCommon = uniIdCommon.createInstance({ context: this });
	},

	// 获取用户当前进行中的行程
	async getCurrentItinerary() {
		try {
			// 验证用户身份
			const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
			if (checkResult.errCode !== 0) {
				console.warn('[行程服务] 用户身份验证失败:', checkResult.errMsg);
				return {
					errCode: 0,
					data: null
				};
			}

			const userId = checkResult.uid;
			console.log('[行程服务] 获取当前行程，用户ID:', userId);

			// let orderType = 'snapshot'; // 行程所属订单的类型，目前有两种：1. 小程序上下单(mp)，2.从vbooking平台同步过来的订单快照(snapshot)
			// let itineraryInfo = await getItineraryByOrderId.call(this, userId, null);
			// if (!itineraryInfo) {
			// 	itineraryInfo = await getCurrentItinerary.call(this, userId);
			// 	if (!itineraryInfo) {
			// 		console.error('[行程服务] 未能获取到快照行程');
			// 		return null;
			// 	}
			// 	orderType = 'mp';
			// }
			// itineraryInfo.orderType = orderType;

			let itineraryInfo = await getItineraryByOrderId.call(this, userId, null);
			if (!itineraryInfo) {
				console.error('[行程服务] 未能获取到快照行程');
				return {
					errCode: 0,
					data: null
				};
			}
			itineraryInfo.orderType = itineraryInfo.order.orderType;

			return {
				errCode: 0,
				data: itineraryInfo
			};
		} catch (error) {
			console.error('[行程服务] 获取当前行程失败:', error);
			return {
				errCode: 500,
				errMsg: error.message || '获取行程信息失败'
			};
		}
	},

	/**
	 * [轻量化] 仅获取当前进行中行程的订单ID
	 * @returns {object} - { order_id: string } 或 null
	 */
	async getCurrentItineraryOrderId() {
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) {
			console.warn('[行程服务] 用户身份验证失败:', checkResult.errMsg);
			return {
				errCode: 0,
				data: null
			};
		}
		const userId = checkResult.uid;
		const db = uniCloud.database();
		const cmd = db.command;
		const $ = db.command.aggregate;
		const now = Date.now();

		console.log('[行程服务] 开始为用户查询当前行程的订单ID:', userId);

		// const { data: user } = await db.collection('uni-id-users').where({ _id: userId }).field({ user_input_order_id: 1 }).limit(1).get();

		// if (user && user.length > 0) {
		// 	const orderId = user[0].user_input_order_id;
		// 	console.log('[行程服务] 找到当前绑定的订单:', orderId);

		// 	let product_image = '';
		// 	const { data: orderRes } = await db.collection('a-orders').where({ order_no: orderId }).field({ product_snapshot: 1 }).limit(1).get();

		// 	if (orderRes && orderRes.length > 0) {
		// 		product_image = orderRes[0].product_snapshot?.images[0] || '';
		// 	} else {
		// 		const { data: snapshotRes } = await db.collection('a-snapshots').where({ order_id: orderId }).field({ product_id: 1 }).limit(1).get();

		// 		if (snapshotRes && snapshotRes.length > 0) {
		// 			product_id = snapshotRes[0].product_id;
		// 			if (product_id) {
		// 				const { data: productRes } = await db.collection('a-products').where({ _id: product_id }).field({ product_images: 1 }).limit(1).get();

		// 				if (productRes && productRes.length > 0) {
		// 					product_image = productRes[0].product_images[0] || '';
		// 				}
		// 			}
		// 		}
		// 	}

		// 	return {
		// 		errCode: 0,
		// 		data: {
		// 			order_id: orderId,
		// 			product_image
		// 		}
		// 	};
		// }
		const snapshotsWhere = cmd.and([
			{ 'travel_users.id': userId },
			// { departure_date: cmd.lte(now) },
			cmd.expr($.gte([$.add(['$departure_date', $.multiply(['$total_days', 24 * 60 * 60 * 1000])]), now]))
		]);

		const { data: snapshot } = await db.collection('a-snapshots').where(snapshotsWhere).field({ order_id: 1, product_id: 1 }).get();

		if (snapshot && snapshot.length > 0) {
			console.log('[行程服务] 找到进行中的订单:', snapshot);

			let product_image = '';
			const { data: product } = await db.collection('a-products').doc(snapshot[0].product_id).get();
			if (product && product.length > 0) {
				product_image = product[0].product_images[0];
			}
			return {
				errCode: 0,
				data: {
					order_id: snapshot[0].order_id,
					product_image: product_image || ''
				}
			};
		}

		const ordersWhere = cmd.and([
			{ 'travel_users.id': userId },
			// { departure_date: cmd.lte(now) },
			{ status: db.command.in(['paid', 'confirmed', 'processing']) },
			cmd.expr($.gte([$.add(['$departure_date', $.multiply(['$duration_days', 24 * 60 * 60 * 1000])]), now]))
		]);
		const { data: order } = await db.collection('a-orders').where(ordersWhere).field({ order_no: 1, product_snapshot: 1 }).limit(1).get();

		if (order && order.length > 0) {
			console.log('[行程服务] 找到进行中的订单:', order);
			return {
				errCode: 0,
				data: {
					order_id: order[0].order_no,
					product_image: order[0].product_snapshot?.images[0] || ''
				}
			};
		}

		console.log('[行程服务] 未找到进行中的订单');
		return { errCode: 0, data: null };
	},

	// 获取行程详细信息
	async getItineraryDetail(productId) {
		try {
			// 验证用户身份
			const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
			if (checkResult.errCode !== 0) {
				throw new Error('身份验证失败');
			}

			console.log('[行程服务] 获取行程详情，产品ID:', productId);

			const db = uniCloud.databaseForJQL({
				clientInfo: this.getClientInfo()
			});

			// 查询行程详细信息
			const itineraryResult = await db
				.collection('a-itineraries')
				.where({
					product_id: productId
				})
				.get();

			if (!itineraryResult.data || itineraryResult.data.length === 0) {
				return {
					errCode: 404,
					errMsg: '未找到行程信息'
				};
			}

			return {
				errCode: 0,
				data: itineraryResult.data[0]
			};
		} catch (error) {
			console.error('[行程服务] 获取行程详情失败:', error);
			return {
				errCode: 500,
				errMsg: error.message || '获取行程详情失败'
			};
		}
	},

	// 绑定并获取当前行程（通过订单号输入）
	async getItineraryByOrderId(orderId) {
		try {
			// 验证用户身份
			const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
			if (checkResult.errCode !== 0) {
				console.warn('[行程服务] 用户身份验证失败:', checkResult.errMsg);
				return {
					errCode: 0,
					data: null
				};
			}

			const userId = checkResult.uid;
			console.log('[行程服务] 获取订单行程，用户ID:', userId);

			const itineraryInfo = await getItineraryByOrderId.call(this, userId, orderId);

			return {
				errCode: 0,
				data: itineraryInfo
			};
		} catch (error) {
			console.error('[行程服务] 获取订单行程失败:', error);
			return {
				errCode: 500,
				errMsg: error.message || '获取订单行程失败'
			};
		}
	},

	async exitItinerary() {
		try {
			// 验证用户身份
			const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
			if (checkResult.errCode !== 0) {
				console.warn('[行程服务] 用户身份验证失败:', checkResult.errMsg);
				return {
					errCode: 0,
					data: null
				};
			}

			const userId = checkResult.uid;
			console.log('[行程服务] 清除绑定的订单号，用户ID:', userId);
			const db = uniCloud.database();

			const result = await db.collection('uni-id-users').doc(userId).field({ user_input_order_id: true }).get();

			if (result.data && result.data.length > 0) {
				const order_id = result.data[0].user_input_order_id;
				const albumRes = await db.collection('a-group-albums').where({ order_id: order_id }).field({ _id: true, members: true }).get();

				if (albumRes.data && albumRes.data.length > 0) {
					const album_id = albumRes.data[0]._id;
					const photoRes = await db.collection('a-album-photos').where({ album_id: album_id, user_id: userId }).field({ _id: true }).get();

					if (photoRes.data && photoRes.data.length === 0) {
						const members = albumRes.data[0].members;
						const foundUser = members.some((m) => {
							return m.user_id === userId;
						});
						if (foundUser) {
							const newMembers = members.filter((m) => {
								return m.user_id !== userId;
							});

							// 如果用户在该行程相册中尚未上传任何照片，在退出行程时也同时退出相册
							await db
								.collection('a-group-albums')
								.where({ order_id: order_id })
								.update({
									$set: {
										members: newMembers
									}
								});
						}
					}
				}
			}

			await db
				.collection('uni-id-users')
				.doc(userId)
				.update({
					$set: {
						user_input_order_id: null
					}
				});

			return {
				errCode: 0
			};
		} catch (error) {
			console.error('[行程服务] 清除绑定订单号失败:', error);
			return {
				errCode: 500,
				errMsg: error.message || '清除绑定订单号失败'
			};
		}
	},

	/**
	 * 对行程文档执行局部/增量更新
	 * @param {string} itineraryId - 要更新的行程文档 _id
	 * @param {string} path - 要更新的字段路径 (使用点符号)
	 * @param {any} value - 新的值
	 * @param {string} [operator] - 特殊操作符, 如 '$push'
	 */
	async partialUpdateItinerary({ itineraryId, path, value, operator }) {
		try {
			// 1. 身份验证与授权
			const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
			if (checkResult.errCode !== 0) {
				console.warn('[行程服务] 用户身份验证失败:', checkResult.errMsg);
				return {
					errCode: 0,
					data: null
				};
			}

			// 授权检查：确保只有管理员可以执行更新操作
			// const authorized = checkResult.role && (checkResult.role.includes('admin') || checkResult.role.includes('super_admin'));
			// if (!authorized) {
			// 	return { errCode: 403, errMsg: '无权操作' };
			// }

			// 2. 参数验证
			if (!itineraryId || !path) {
				return { errCode: 400, errMsg: '缺少必要参数：行程ID或更新路径' };
			}

			// 从路径中获取最终的字段名，例如从 'itinerary.0.day' 中获取 'day'
			const baseField = path.split('.').pop();

			// 检查这个字段是否在我们定义的数字字段集合中
			if (numericFields.has(baseField)) {
				// 如果值为空字符串或 null，我们视情况处理，这里暂时允许
				// 如果不允许为空，可以在这里返回错误
				if (value === '' || value === null || value === undefined) {
					// 如果字段允许为空，则不做处理
					// 如果字段不允许为空，可以在这里返回错误：
					if (requiredFields.has(baseField)) return { errCode: 400, errMsg: `字段 [${baseField}] 不能为空` };
				} else {
					const parsedValue = parseFloat(value);
					// 检查转换后的值是否为 NaN (Not-a-Number)，如果是则说明原始值不是有效数字
					if (isNaN(parsedValue)) {
						return {
							errCode: 400, // Bad Request
							errMsg: `字段 [${baseField}] 的值 "${value}" 不是一个有效的数字。`
						};
					}
					// 如果转换成功，确保我们保存的是数字类型的值，而不是字符串
					value = parsedValue;
				}
			}

			const db = uniCloud.database();
			let updateObject = {};

			// 3. 构建更新指令
			if (operator) {
				updateObject[operator] = { [path]: value };
			} else {
				updateObject['$set'] = { [path]: value };
			}

			console.log('[行程服务] 执行局部更新:', { itineraryId, updateObject });

			// 4. 执行数据库更新
			const result = await db.collection('a-itineraries').doc(itineraryId).update(updateObject);

			return {
				errCode: 0,
				data: result
			};
		} catch (error) {
			console.error('[行程服务] 局部更新失败:', error);
			return {
				errCode: 500,
				errMsg: error.message || '更新失败'
			};
		}
	}
};
