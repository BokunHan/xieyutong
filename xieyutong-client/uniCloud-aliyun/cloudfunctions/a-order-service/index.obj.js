const uniIdCommon = require('uni-id-common');
const createConfig = require('uni-config-center');
const db = uniCloud.database();
const dbCmd = db.command;
const $ = dbCmd.aggregate;
const opCenter = uniCloud.importObject('a-operation-center');

const _buildWhereQuery = function (userId, collectionType, isGuide, tabIndex) {
	const now = Date.now();
	const DAY_MS = 86400000;
	const durationField = collectionType === 'a-orders' ? '$duration_days' : '$total_days';

	// [!!] This is the server-side $expr.
	// It uses $toInt to fix your 'string' error.
	const exprEndDate = dbCmd.aggregate.add([dbCmd.aggregate.ifNull(['$departure_date', 0]), dbCmd.aggregate.multiply([dbCmd.aggregate.ifNull([durationField, 0]), DAY_MS])]);

	// Base Where (Who is asking)
	let baseWhere = {};
	if (collectionType === 'a-orders') {
		baseWhere = isGuide ? { 'staves.id': userId } : { user_id: userId };
	} else {
		baseWhere = isGuide ? { 'staves.id': userId } : { 'travel_users.id': userId };
	}

	if (tabIndex === 0) {
		return baseWhere;
	}

	let statusWhere = {};

	// (This logic is from your last correct version)
	if (collectionType === 'a-orders') {
		if (isGuide) {
			if (tabIndex === 1) {
				// 待出行
				statusWhere = { status: dbCmd.in(['paid', 'confirmed']), departure_date: dbCmd.gte(now) };
			} else if (tabIndex === 2) {
				// 进行中
				statusWhere = { status: dbCmd.in(['paid', 'confirmed']), departure_date: dbCmd.lt(now), $expr: dbCmd.gte([exprEndDate, now]) };
			} else if (tabIndex === 3) {
				// 已完成
				statusWhere = { status: dbCmd.in(['paid', 'confirmed']), $expr: dbCmd.lt([exprEndDate, now]) };
			}
		} else {
			if (tabIndex === 1) {
				// 待支付
				statusWhere = { status: 'pending' };
			} else if (tabIndex === 2) {
				// 进行中
				statusWhere = { status: 'paid', $expr: dbCmd.gte([exprEndDate, now]) };
			} else if (tabIndex === 3) {
				// 已完成
				statusWhere = { status: 'paid', $expr: dbCmd.lt([exprEndDate, now]) };
			}
		}
	} else {
		if (isGuide) {
			if (tabIndex === 1) {
				// 待出行
				statusWhere = { departure_date: dbCmd.gte(now) };
			} else if (tabIndex === 2) {
				// 进行中
				statusWhere = { departure_date: dbCmd.lt(now), $expr: dbCmd.gte([exprEndDate, now]) };
			} else if (tabIndex === 3) {
				// 已完成
				statusWhere = { $expr: dbCmd.lt([exprEndDate, now]) };
			}
		} else {
			if (tabIndex === 1) {
				// 待支付 (快照永不为待支付)
				statusWhere = { _id: '0' };
			} else if (tabIndex === 2) {
				// 进行中
				statusWhere = { departure_date: dbCmd.lt(now), $expr: dbCmd.gte([exprEndDate, now]) };
			} else if (tabIndex === 3) {
				// 已完成
				statusWhere = { $expr: dbCmd.lt([exprEndDate, now]) };
			}
		}
	}
	return dbCmd.and([baseWhere, statusWhere]);
};

// 内部方法：获取微信 AccessToken (简化版，建议复用公共模块)
const _getWxAccessToken = async function (dcloudAppid) {
	let appid, secret;

	try {
		// 1. 获取 uni-id 的配置
		const uniIdConfigRes = createConfig({
			pluginId: 'uni-id' // 指定读取 uni-id 目录下的 config.json
		}).config();

		let currentConfig = uniIdConfigRes;

		// 如果配置是数组（多端模式），则根据 dcloudAppid 查找对应配置
		if (Array.isArray(uniIdConfigRes)) {
			if (!dcloudAppid) {
				throw new Error('多端配置模式下，必须传入 dcloudAppid');
			}
			// 在数组中找到匹配当前运行小程序的配置项
			currentConfig = uniIdConfigRes.find((item) => item.dcloudAppid === dcloudAppid);

			if (!currentConfig) {
				throw new Error(`在 uni-id 配置中未找到 dcloudAppid 为 ${dcloudAppid} 的配置项`);
			}
		}

		// 2. 提取 mp-weixin 下的配置
		if (currentConfig['mp-weixin'] && currentConfig['mp-weixin'].oauth && currentConfig['mp-weixin'].oauth.weixin) {
			appid = currentConfig['mp-weixin'].oauth.weixin.appid;
			secret = currentConfig['mp-weixin'].oauth.weixin.appsecret;
		}
	} catch (e) {
		console.error('读取 uni-id 配置失败:', e);
		throw e; // 抛出异常以便外层捕获
	}

	// 校验是否成功获取
	if (!appid || !secret) {
		throw new Error(`应用 [${dcloudAppid}] 未配置 mp-weixin 的 appid 或 appsecret`);
	}

	// 3. 请求微信接口
	// 建议此处添加缓存逻辑（uniCloud.redis 或 数据库缓存），避免频繁调用
	const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
	const res = await uniCloud.httpclient.request(url, { dataType: 'json' });

	if (res.data && res.data.access_token) {
		return res.data.access_token;
	}

	throw new Error('获取Access Token失败: ' + (res.data.errmsg || '未知错误'));
};

module.exports = {
	async _before() {
		const clientInfo = this.getClientInfo();
		this.uniIdCommon = uniIdCommon.createInstance({
			clientInfo: clientInfo
		});
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) {
			return {
				errCode: checkResult.errCode,
				errMsg: checkResult.errMsg || '身份验证失败'
			};
		}
		this.uid = checkResult.uid;
		this.role = checkResult.role;
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
			const dbJQL = uniCloud.databaseForJQL({
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
			const result = await dbJQL.collection('a-orders').add(orderData);

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
	},

	getBadgeCounts: async function ({ isGuide }) {
		try {
			const collections = ['a-orders', 'a-snapshots'];
			let queries = [];

			for (const collectionType of collections) {
				for (const tabIndex of [1, 2, 3]) {
					const where = _buildWhereQuery(this.uid, collectionType, isGuide, tabIndex);
					queries.push(db.collection(collectionType).where(where).count());
				}
			}

			const results = await Promise.all(queries);

			return {
				tab1: (results[0].total || 0) + (results[3].total || 0),
				tab2: (results[1].total || 0) + (results[4].total || 0),
				tab3: (results[2].total || 0) + (results[5].total || 0)
			};
		} catch (error) {
			console.error('getBadgeCounts error:', error);
			return { tab1: 0, tab2: 0, tab3: 0 };
		}
	},

	getOrders: async function ({ isGuide, tabIndex, pageCurrent, pageSize }) {
		try {
			const skip = (pageCurrent - 1) * pageSize;

			const whereOrders = _buildWhereQuery(this.uid, 'a-orders', isGuide, tabIndex);
			const queryOrders = db
				.collection('a-orders')
				.where(whereOrders)
				.field({
					_id: true,
					order_no: true,
					status: true,
					product_snapshot: true,
					final_amount: true,
					departure_date: true,
					quantity: true,
					created_at: true,
					contact_info: true,
					duration_days: true,
					travel_users: true,
					staves: true
				})
				.orderBy('created_at', 'desc')
				.skip(skip)
				.limit(pageSize)
				.get();

			const whereSnapshots = _buildWhereQuery(this.uid, 'a-snapshots', isGuide, tabIndex);
			const querySnapshots = db
				.collection('a-snapshots')
				.where(whereSnapshots)
				.field({
					_id: true,
					order_id: true,
					title: true,
					product_id: true,
					departure_date: true,
					total_days: true,
					created_at: true,
					travel_users: true,
					staves: true
				})
				.orderBy('created_at', 'desc')
				.skip(skip)
				.limit(pageSize)
				.get();

			const [orderRes, snapshotRes] = await Promise.all([queryOrders, querySnapshots]);

			let imageMap = new Map();
			let taskCountMap = new Map();

			if (snapshotRes.data && snapshotRes.data.length > 0) {
				const productIds = snapshotRes.data.map((s) => s.product_id).filter((id) => id);
				const orderIds = snapshotRes.data.map((s) => s.order_id).filter((id) => id);

				const promises = [];

				if (productIds.length > 0) {
					promises.push(
						db
							.collection('a-products')
							.where({ _id: dbCmd.in(productIds) })
							.field({ _id: true, product_images: true })
							.get()
							.then((res) => ({ type: 'product', data: res.data }))
					);
				}

				if (orderIds.length > 0) {
					promises.push(
						db
							.collection('a-task-orders')
							.where({ order_id: dbCmd.in(orderIds) })
							.field({ order_id: true, raw_data: true })
							.get()
							.then((res) => {
								const countMap = new Map();
								res.data.forEach((item) => {
									try {
										// 安全获取长度
										const count = item.raw_data?.[0]?.order_context?.travelers?.length;
										if (count) {
											countMap.set(item.order_id, count);
										}
									} catch (e) {}
								});
								return { type: 'task', data: countMap }; // 返回只包含{order_id: count}的Map
							})
					);
				}

				const results = await Promise.all(promises);

				results.forEach((res) => {
					if (res.type === 'product') {
						imageMap = new Map(res.data.map((p) => [p._id, p.product_images?.[0]]));
					} else if (res.type === 'task') {
						taskCountMap = res.data;
					}
				});
			}

			const mappedSnapshots = snapshotRes.data.map((snapshot) => {
				snapshot.product_image_url = imageMap.get(snapshot.product_id);
				snapshot.task_traveler_count = taskCountMap.get(snapshot.order_id);
				return snapshot;
			});

			return {
				orders: orderRes.data,
				snapshots: mappedSnapshots,
				hasMore: orderRes.data.length >= pageSize || snapshotRes.data.length >= pageSize
			};
		} catch (error) {
			console.error('getOrders error:', error);
			return { orders: [], snapshots: [], hasMore: false };
		}
	},

	/**
	 * 向导生成邀请二维码
	 * @param {String} id 订单ID
	 */
	async getInviteQRCode(id) {
		if (!this.uid) throw new Error('未登录');

		// 1. 动态查找记录 (确定是哪个表的)
		let targetCollection = '';
		let targetRecord = null;

		// A. 先试着从 a-orders 找
		const orderRes = await db.collection('a-orders').where({ order_no: id }).get();
		if (orderRes.data && orderRes.data.length > 0) {
			targetCollection = 'a-orders';
			targetRecord = orderRes.data[0];
		} else {
			// B. 没找到，去 a-snapshots 找
			const snapshotRes = await db.collection('a-snapshots').where({ order_id: id }).get();
			if (snapshotRes.data && snapshotRes.data.length > 0) {
				targetCollection = 'a-snapshots';
				targetRecord = snapshotRes.data[0];
			}
		}

		if (!targetRecord) throw new Error('订单或快照不存在');

		// 2. 验证权限
		// 无论是订单还是快照，schema里都有 staves 字段，逻辑通用
		const isStaff = targetRecord.staves && targetRecord.staves.some((s) => s.id === this.uid);
		const isAdmin = this.role.includes('admin') || this.role.includes('super_admin');

		if (!isStaff && !isAdmin) {
			throw new Error('无权操作此订单');
		}

		// 3. 获取微信 Access Token
		const clientInfo = this.getClientInfo();
		const currentAppId = clientInfo.appId;
		const accessToken = await _getWxAccessToken('__UNI__5377474');

		// 4. 生成小程序码
		// 场景值直接传 ID。
		// 关键点：扫码端(bindUserToOrder)也必须具备“双表查找”的能力，否则不知道去哪个表绑定用户。
		const scene = `oid=${id}`;
		const page = 'pages/order/bind-confirm';

		try {
			const result = await uniCloud.httpclient.request(`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`, {
				method: 'POST',
				contentType: 'json',
				data: {
					scene: scene,
					page: page,
					width: 430,
					check_path: false,
					env_version: 'release'
				},
				dataType: 'buffer'
			});

			if (result.headers['content-type'].includes('image')) {
				return {
					errCode: 0,
					base64: 'data:image/png;base64,' + result.data.toString('base64')
				};
			} else {
				const err = JSON.parse(result.data.toString());
				throw new Error(err.errmsg || '生成二维码失败');
			}
		} catch (e) {
			console.error(e);
			return { errCode: 500, errMsg: e.message };
		}
	},

	/**
	 * 客户绑定订单/快照 (支持双表)
	 * @param {String} id 订单ID 或 快照ID
	 */
	async bindUserToOrder(id) {
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' };

		// 1. 获取用户信息
		const userRes = await db.collection('uni-id-users').doc(this.uid).field({ mobile: 1, nickname: 1 }).get();
		if (!userRes.data || userRes.data.length === 0) {
			console.log('用户不存在，查询ID: ', this.uid);
			return { errCode: 404, errMsg: '用户不存在' };
		}

		const userInfo = {
			id: this.uid,
			mobile: userRes.data[0].mobile || '',
			name: userRes.data[0].nickname || '用户'
		};

		// 2. 确定目标表 (a-orders 还是 a-snapshots)
		let targetCollection = '';
		let targetWhere = '';
		let targetRecord = null;

		// 先检查是不是普通订单
		const orderCheck = await db.collection('a-orders').where({ order_no: id }).get();
		if (orderCheck.data && orderCheck.data.length > 0) {
			targetCollection = 'a-orders';
			targetWhere = { order_no: id };
			targetRecord = orderCheck.data[0];
		} else {
			// 再检查是不是快照
			const snapshotCheck = await db.collection('a-snapshots').where({ order_id: id }).get();
			if (snapshotCheck.data && snapshotCheck.data.length > 0) {
				targetCollection = 'a-snapshots';
				targetWhere = { order_id: id };
				targetRecord = snapshotCheck.data[0];
			}
		}

		if (!targetCollection) {
			return { errCode: 404, errMsg: '未找到对应的订单或快照' };
		}

		const isUserBound = targetRecord.travel_users && targetRecord.travel_users.some((u) => u.id === this.uid);

		if (!isUserBound) {
			// 3. 执行绑定 (动态集合名称)
			// 两个表的字段结构里都有 travel_users，所以逻辑通用
			const updateRes = await db
				.collection(targetCollection)
				.where(targetWhere)
				.update({
					travel_users: dbCmd.addToSet(userInfo)
				});
		}

		// 4. 绑定到相册 (a-group-albums)
		// 假设相册也是通过 order_id 关联的 (注意：如果你快照也有相册，这里的逻辑可能也要适配，暂时按原样处理关联)
		const albumRes = await db.collection('a-group-albums').where({ order_id: id }).get();
		if (albumRes.data && albumRes.data.length > 0) {
			const albumRecord = albumRes.data[0];
			const isAlbumMember = albumRecord.members && albumRecord.members.some((m) => m.id === this.uid);

			if (!isAlbumMember) {
				await db
					.collection('a-group-albums')
					.where({ order_id: id })
					.update({
						members: dbCmd.addToSet(userInfo)
					});
			}
		}

		return {
			errCode: 0,
			errMsg: '绑定成功'
		};
	},

	/**
	 * 获取司导首页仪表盘统计数据
	 * 1. 本月接单：查询本月出发的订单
	 * 2. 本月完单：查询本月出发且时间已结束的订单
	 * 3. 综合评分：调用运营中心考核数据
	 */
	async getGuideHomeStats() {
		// 获取当前请求的用户ID
		if (!this.uid) return { monthOrders: 0, monthCompleted: 0, rating: '100.0' };

		// --- 1. 时间计算 ---
		const now = new Date();
		const nowTs = now.getTime();
		// 本月第一天 00:00:00
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
		// 本月最后一天 23:59:59
		const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

		// --- 2. 查询本月相关订单 ---
		// 查询条件：staves数组中包含当前用户且角色为guide，且出发日期在本月
		const whereClause = {
			staves: dbCmd.elemMatch({
				id: this.uid,
				role: new RegExp('guide') // 匹配 guide, head-guide 等
			}),
			departure_date: dbCmd.gte(startOfMonth).and(dbCmd.lte(endOfMonth))
		};

		console.log('whereClause: ', whereClause);

		// 只需要查询出发日期和总天数，用于计算是否完单
		const ordersRes = await db.collection('a-snapshots').where(whereClause).field({ departure_date: 1, total_days: 1 }).get();

		console.log('ordersRes: ', ordersRes);

		const monthOrders = ordersRes.data;
		const totalOrdersCount = monthOrders.length;

		// --- 3. 计算完单数 ---
		// 逻辑：本月出发的订单中，(出发日期 + 行程天数) 小于 当前时间 的视为已完单
		let completedCount = 0;
		monthOrders.forEach((o) => {
			// 计算行程结束时间戳 (总天数 * 24小时)
			const endTime = o.departure_date + o.total_days * 24 * 60 * 60 * 1000;
			if (endTime < nowTs) {
				completedCount++;
			}
		});

		// --- 4. 获取评分 (调用运营中心) ---
		let ratingStr = '100.0';
		try {
			const assessmentRes = await opCenter.getAssessmentData({
				role: 'guide',
				target_id: this.uid
			});
			console.log('assessmentRes: ', assessmentRes);

			if (assessmentRes.data && assessmentRes.data.total_score !== undefined) {
				ratingStr = assessmentRes.data.total_score.toFixed(1);
			}
		} catch (e) {
			console.error('获取评分失败，使用默认值', e);
		}

		return {
			monthOrders: totalOrdersCount,
			monthCompleted: completedCount,
			rating: ratingStr
		};
	}
};
