const uniIdCommon = require('uni-id-common');
const db = uniCloud.database();
const dbCmd = db.command;
const $ = dbCmd.aggregate;

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

module.exports = {
	async _before() {
		this.uniIdCommon = uniIdCommon.createInstance({ context: this });
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) {
			return {
				errCode: checkResult.errCode,
				errMsg: checkResult.errMsg || '身份验证失败'
			};
		}
		this.uid = checkResult.uid;
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
			if (snapshotRes.data && snapshotRes.data.length > 0) {
				const productIds = snapshotRes.data.map((s) => s.product_id).filter((id) => id);
				if (productIds.length > 0) {
					const productRes = await db
						.collection('a-products')
						.where({ _id: dbCmd.in(productIds) })
						.field({ _id: true, product_images: true })
						.get();
					imageMap = new Map(productRes.data.map((p) => [p._id, p.product_images?.[0]]));
				}
			}

			const mappedSnapshots = snapshotRes.data.map((snapshot) => {
				snapshot.product_image_url = imageMap.get(snapshot.product_id);
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
	}
};
