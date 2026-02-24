const uniIdCommon = require('uni-id-common');
const db = uniCloud.database();
const dbCmd = db.command;
const httpclient = uniCloud.httpclient;

const albumService = {
	_before: async function () {
		const clientInfo = this.getClientInfo();
		this.uniIdCommon = uniIdCommon.createInstance({
			clientInfo: clientInfo
		});
	},
	/**
	 * 创建群相册
	 * @param {string} orderId - 订单ID
	 * @returns {object} - 返回创建结果
	 */
	async createAlbum(orderId) {
		if (!orderId) {
			return {
				errCode: 'MISSING_ORDERID',
				errMsg: '订单ID不能为空'
			};
		}

		console.log('[相册服务] 开始创建相册，订单ID:', orderId);

		const albumDb = db.collection('a-group-albums');
		const orderDb = db.collection('a-orders');
		const productDb = db.collection('a-products');
		const snapshotDb = db.collection('a-snapshots');
		// const travelersDb = db.collection('a-travelers');
		const usersDb = db.collection('uni-id-users');

		let result;
		// 1. 检查相册是否已存在
		result = await albumDb
			.where({
				order_id: orderId
			})
			.limit(1)
			.get();
		if (result && result.data.length > 0) {
			return {
				errCode: 0,
				errMsg: '该订单的相册已存在',
				album_id: result.data[0]._id
			};
		}

		// 2. 获取订单信息
		result = await orderDb.where({ order_no: orderId }).get();
		if (!result || result.data.length === 0) {
			result = await snapshotDb.where({ order_id: orderId }).get();
			if (!result || result.data.length === 0) {
				return {
					errCode: 'ORDER_NOT_FOUND',
					errMsg: '订单不存在'
				};
			}
		}
		console.log('[相册服务] 已找到订单:', result.data);
		const orderInfo = result.data[0];

		// 3. 获取产品信息以确定行程日期和相册名
		result = await productDb.doc(orderInfo.product_id).get();
		if (!result || result.data.length === 0) {
			return {
				errCode: 'PRODUCT_NOT_FOUND',
				errMsg: '产品不存在'
			};
		}
		const productInfo = result.data[0];
		console.log('[相册服务] 已找到产品:', productInfo);

		// 4. 获取出行人列表作为相册成员
		// let {
		//     data: travelers
		// } = await travelersDb.where({
		//     order_id: orderId
		// }).get();
		// const travelers = orderInfo.travelers;

		// 5. 将下单人和出行人合并为成员列表，并去重
		let members = [];
		if (orderInfo.user_id) {
			const memberIds = [orderInfo.user_id];

			// travelers.forEach(t => {
			//     if (t.user_id && !memberIds.includes(t.user_id)) {
			//         memberIds.push(t.user_id);
			//     }
			// });

			// 6. 查询成员手机号码
			result = await usersDb
				.where({
					_id: dbCmd.in(memberIds)
				})
				.field({
					mobile: 1
				})
				.get();

			if (result && result.data.length > 0) {
				members = result.data.map((u) => ({
					id: u._id,
					mobile: u.mobile || ''
				}));
				console.log('[相册服务] 已初始化团员列表:', members);
			}
		}

		// 7. 组装相册数据并创建
		const albumInfo = {
			order_id: orderId,
			product_id: productInfo._id,
			user_id: orderInfo.user_id,
			album_name: productInfo.title,
			departure_date: Math.floor(new Date(orderInfo.departure_date).getTime() / 1000) * 1000,
			total_days: parseInt(orderInfo.total_days) || parseInt(orderInfo.duration_days),
			status: 1, // 0: 待激活, 1: 进行中, 2: 已归档
			members: members,
			create_date: Date.now()
		};

		// 根据当前日期判断初始状态
		const now = Date.now();
		const startTime = albumInfo.departure_date;
		const endTime = startTime + albumInfo.total_days * 24 * 60 * 60 * 1000;

		// 行程开始前一天可激活
		if (now >= startTime - 24 * 60 * 60 * 1000 && now <= endTime) {
			albumInfo.status = 1;
		} else if (now > endTime) {
			albumInfo.status = 2;
		}
		console.log('[相册服务] 开始创建相册:', albumInfo);

		const addRes = await albumDb.add(albumInfo);
		console.log('[相册服务] 相册创建成功，相册ID: ', addRes.id);

		return {
			errCode: 0,
			errMsg: '相册创建成功',
			album_id: addRes.id
		};
	},

	/**
	 * 搜索可用于后台创建相册的订单
	 * 1. 从 a-orders 查
	 * 2. 从 a-snapshots 查
	 * 3. 排除 a-group-albums 中已存在的 order_id
	 * @param {string} query 搜索关键词
	 * @returns {Array}
	 */
	async searchAvailableOrders(query) {
		try {
			// 1. 获取所有已创建相册的 order_id 列表
			// 使用聚合操作去重并获取列表
			const aggregateRes = await db
				.collection('a-group-albums')
				.aggregate()
				.group({
					_id: null,
					existingOrders: dbCmd.aggregate.addToSet('$order_id')
				})
				.end();

			const existingOrderIds = aggregateRes.data[0] ? aggregateRes.data[0].existingOrders : [];
			console.log('existingOrderIds: ', existingOrderIds);

			// 2. 构建查询条件
			const queryRe = new RegExp(query, 'i');
			const ninCondition = dbCmd.nin(existingOrderIds);
			const notNull = dbCmd.neq(null);

			// 3. 查询 a-orders
			const orderConditions = [{ order_no: queryRe }, { order_no: ninCondition }, { order_no: notNull }, { departure_date: notNull }, { duration_days: notNull }];
			const ordersWhere = dbCmd.and(orderConditions);
			const ordersRes = await db
				.collection('a-orders')
				.where(ordersWhere)
				.field({
					order_no: 1,
					'product_snapshot.title': 1,
					departure_date: 1,
					duration_days: 1
				})
				.orderBy('departure_date', 'desc')
				.limit(20) // 限制返回数量，防止列表过长
				.get();

			// 4. 查询 a-snapshots
			const snapshotsConditions = [{ order_id: queryRe }, { order_id: ninCondition }, { order_id: notNull }, { departure_date: notNull }, { total_days: notNull }];
			const snapshotsWhere = dbCmd.and(snapshotsConditions);
			const snapshotsRes = await db
				.collection('a-snapshots')
				.where(snapshotsWhere)
				.field({
					order_id: 1,
					title: 1,
					departure_date: 1,
					total_days: 1
				})
				.orderBy('departure_date', 'desc')
				.limit(20)
				.get();

			console.log('ordersRes: ', ordersRes);
			console.log('snapshotsRes: ', snapshotsRes);

			// 5. 格式化并合并结果
			const ordersMapped = ordersRes.data.map((item) => ({
				value: item.order_no,
				label: item.product_snapshot?.title || '未知标题',
				departure_date: item.departure_date,
				total_days: item.duration_days
			}));

			const snapshotsMapped = snapshotsRes.data.map((item) => ({
				value: item.order_id,
				label: item.title || '未知标题',
				departure_date: item.departure_date,
				total_days: item.total_days
			}));

			let combinedResults = [...ordersMapped, ...snapshotsMapped];

			// 6. 去重（可能 a-orders.order_no 和 a-snapshots.order_id 相同）
			const uniqueResults = Array.from(new Map(combinedResults.map((item) => [item.value, item])).values());

			console.log('uniqueResults: ', uniqueResults);
			return {
				errCode: 0,
				data: uniqueResults
			};
		} catch (e) {
			console.error('searchAvailableOrders error:', e);
			return { errCode: 500, errMsg: e.message };
		}
	},

	/**
	 * 加入指定订单号的相册
	 * @returns {object} - 返回相册列表
	 */
	async joinAlbumByOrderId(orderId) {
		if (!orderId) {
			return {
				errCode: 'MISSING_ORDERID',
				errMsg: '订单ID不能为空'
			};
		}

		// 验证用户身份
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) {
			throw new Error('身份验证失败');
		}

		const userId = checkResult.uid;
		console.log(`[相册服务] 准备加入订单号为 ${orderId} 的相册`);

		const albumDb = db.collection('a-group-albums');
		const usersDb = db.collection('uni-id-users');

		const { data: albumRes } = await albumDb
			.where({
				order_id: orderId
			})
			.limit(1)
			.get();

		console.log(`[相册服务] 检查订单号为 ${orderId} 的相册，返回结果：`, albumRes);

		if (albumRes && albumRes.length > 0) {
			const members = albumRes[0].members;
			const userExists = members.some((m) => {
				return m.id === userId;
			});

			if (!userExists) {
				const userResult = await usersDb
					.where({
						_id: userId
					})
					.field({
						mobile: 1
					})
					.get();

				let mobile = '';
				if (userResult.data && userResult.data.length > 0) {
					mobile = userResult.data[0].mobile;
				}

				members.push({ id: userId, mobile });

				const result = await albumDb
					.where({
						order_id: orderId
					})
					.update({ $set: { members: members } });

				console.log(`[相册服务] 成功加入相册，用户ID: ${userId}, 订单号：${orderId}`);
			} else {
				console.log('[相册服务] 用户已存在于该相册，用户ID: ', userId);
			}
		} else {
			console.log(`[相册服务] 没找到订单号为 ${orderId} 的相册`);
			return {
				errCode: 500,
				errMsg: '没有找到相册'
			};
		}
		return {
			errCode: 0,
			errMsg: '加入相册成功'
		};
	},

	/**
	 * 获取当前用户的相册列表
	 * @returns {object} - 返回相册列表
	 */
	async getAlbumListByUser() {
		// 验证用户身份
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) {
			throw new Error('身份验证失败');
		}

		const userId = checkResult.uid;
		console.log('[相册服务] 开始获取当前用户相册列表，用户ID:', userId);

		// --- 第 1 次查询: 获取用户参与的所有相册 ---
		const albumDb = db.collection('a-group-albums');
		const { data: albumList } = await albumDb
			.where({
				'members.id': userId
			})
			.orderBy('departure_date', 'desc')
			.get();

		if (!albumList || albumList.length === 0) {
			console.log(`[相册服务] 用户 ${userId} 尚未加入任何相册`);
			return {
				errCode: 0,
				errMsg: '获取成功',
				data: []
			};
		}

		console.log('[相册服务] 成功获取相册列表，用户ID:', userId, ' 获取结果：', albumList);

		const photosDb = db.collection('a-album-photos');
		const albumIds = albumList.map((a) => a._id);

		// --- 第 2 次查询: 一次性获取所有相关相册的最新照片 ---
		const { data: photos } = await photosDb
			.where({
				album_id: dbCmd.in(albumIds)
			})
			.orderBy('shooting_time', 'desc')
			.field({
				album_id: 1,
				compressed_url: 1
			})
			.get();

		console.log(`[相册服务] 查找所有相册的第一张作为封面，聚合查询找到 ${photos.length} 张相关照片`);

		// --- 在内存中高效地为每个相册匹配封面 ---
		const coverMap = new Map();
		for (const photo of photos) {
			// 因为照片已按时间倒序排列，第一个遇到的就是最新的
			if (!coverMap.has(photo.album_id)) {
				coverMap.set(photo.album_id, photo.compressed_url);
			}
		}

		const productDb = db.collection('a-products');

		const modifiedAlbumPromises = albumList.map(async (album) => {
			if (coverMap.get(album._id)) {
				album.cover_image = coverMap.get(album._id);
			} else {
				try {
					const productRes = await productDb.where({ _id: album.product_id }).field({ product_images: true }).get();

					console.log('[相册服务] 查找商品图片结果：', productRes);
					if (productRes.data && productRes.data.length > 0 && productRes.data[0].product_images && productRes.data[0].product_images.length > 0) {
						album.cover_image = productRes.data[0].product_images[0];
					} else {
						console.log('[相册服务] 未找到商品图片作为相册封面，相册ID: ', album._id, '，商品ID: ', album.product_id);
					}
				} catch (err) {
					console.error(`[相册服务] 查询相册 ${album._id} 的商品封面失败:`, err);
				}
			}
			return album;
		});

		const modifiedAlbumList = await Promise.all(modifiedAlbumPromises);

		console.log('[相册服务] 成功聚合处理完相册列表');

		return {
			errCode: 0,
			errMsg: '获取成功',
			data: modifiedAlbumList
		};
	},

	/**
	 * 获取单个相册的详细信息及照片列表
	 * @param {string} albumId - 相册ID
	 * @returns {object} - 返回相册信息和照片列表
	 */
	async getAlbumInfo(albumId) {
		// 1. 验证用户身份
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) {
			console.error('[相册服务] getAlbumInfo 身份验证失败:', checkResult);
			return {
				errCode: '401',
				errMsg: '用户未登录'
			};
		}
		const userId = checkResult.uid;
		console.log(`[相册服务] 用户 ${userId} 请求获取相册详情，相册ID: ${albumId}`);

		// 2. 查询相册基本信息
		const albumDb = db.collection('a-group-albums');
		const { data: albumList } = await albumDb.doc(albumId).get();

		if (!albumList || albumList.length === 0) {
			console.warn(`[相册服务] 用户 ${userId} 请求的相册 ${albumId} 不存在`);
			return {
				errCode: 'ALBUM_NOT_FOUND',
				errMsg: '相册不存在'
			};
		}
		const albumInfo = albumList[0];

		// 3. 验证用户是否为相册成员
		const isMember = albumInfo.members.some((member) => member.id === userId);
		if (!isMember) {
			console.warn(`[相册服务] 用户 ${userId} 无权访问相册 ${albumId}`);
			return {
				errCode: 'NO_PERMISSION',
				errMsg: '您不是该相册的成员'
			};
		}

		// 4. 查询相册下的所有照片
		const photosDb = db.collection('a-album-photos');
		const { data: photos } = await photosDb
			.where({
				album_id: albumId
			})
			.orderBy('shooting_time', 'desc')
			.get();
		console.log(`[相册服务] 成功获取相册 ${albumId} 的 ${photos.length} 张照片`);

		// 5. 将照片按天分组
		const photosGroupedByDay = {};
		const albumStartDate = new Date(albumInfo.departure_date);
		albumStartDate.setHours(0, 0, 0, 0);

		photos.forEach((photo) => {
			const shootingDate = new Date(photo.shooting_time);
			shootingDate.setHours(0, 0, 0, 0);

			const dayDiff = Math.ceil((shootingDate - albumStartDate) / (1000 * 60 * 60 * 24));
			let dayIndex = dayDiff >= 0 ? dayDiff + 1 : 1;
			dayIndex = Math.min(dayIndex, albumInfo.total_days);

			const dayKey = `Day ${dayIndex}`;
			if (!photosGroupedByDay[dayKey]) {
				photosGroupedByDay[dayKey] = [];
			}
			photosGroupedByDay[dayKey].push(photo);
		});

		// 计算当前是第几天（从出发日期开始算）
		const daysPassed = Math.floor((Date.now() - albumInfo.departure_date) / (24 * 60 * 60 * 1000)) + 1;
		const currentDay = Math.max(1, Math.min(daysPassed, albumInfo.total_days));
		albumInfo.currentDay = currentDay;

		console.log(`[相册服务] 照片分组完成 for album ${albumId}`);

		return {
			errCode: 0,
			errMsg: '获取成功',
			data: {
				albumInfo,
				photos: photosGroupedByDay
			}
		};
	},

	/**
	 * 删除单个相册及其所有照片
	 * @param {string} albumId
	 */
	async deleteAlbum(albumId) {
		if (!albumId) {
			return { errCode: 'INVALID_PARAM', errMsg: '缺少相册ID' };
		}

		// 1. 验证用户身份
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) {
			console.error('[相册服务] deleteAlbum 身份验证失败:', checkResult);
			return { errCode: '401', errMsg: '用户未登录' };
		}
		const userId = checkResult.uid;
		const userRole = checkResult.role;
		console.log(`[相册服务] 用户 ${userId} 尝试删除相册，ID: ${albumId}`);

		// 2. 权限验证：确保是管理员在执行删除
		if (!userRole.includes('admin') && !userRole.includes('super_admin')) {
			console.warn(`[相册服务] 用户 ${userId} 无权删除相册 ${albumId}`);
			return { errCode: 'NO_PERMISSION', errMsg: '只有管理员才可删除相册' };
		}

		const albumDb = db.collection('a-group-albums');
		const photosDb = db.collection('a-album-photos');

		// 3. 查找相册记录
		const { data: albumRes } = await albumDb.doc(albumId).get();
		if (!albumRes || albumRes.length === 0) {
			console.warn(`[相册服务] 删除失败，相册 ${albumId} 不存在`);
			return { errCode: 'ALBUM_NOT_FOUND', errMsg: '相册不存在' };
		}

		console.log(`[deleteAlbum] 开始删除相册: ${albumId}`);

		try {
			// 1. 查找此相册下的所有照片 (包括文件ID)
			const photosFullRes = await photosDb
				.where({
					album_id: albumId
				})
				.field({
					_id: 1,
					original_url: 1,
					compressed_url: 1
				})
				.get();

			const fileIDsToDelete = [];
			const photoIDsToDelete = [];

			if (photosFullRes.data && photosFullRes.data.length > 0) {
				console.log(`[deleteAlbum] 找到 ${photosFullRes.data.length} 张照片待删除`);

				for (const photo of photosFullRes.data) {
					photoIDsToDelete.push(photo._id);
					// 确保 fileID 存在且是 uniCloud 文件格式
					if (photo.original_url && photo.original_url.startsWith('cloud://')) {
						fileIDsToDelete.push(photo.original_url);
					}
					if (photo.compressed_url && photo.compressed_url !== photo.original_url && photo.compressed_url.startsWith('cloud://')) {
						fileIDsToDelete.push(photo.compressed_url);
					}
				}

				// 2. 从云存储批量删除文件
				if (fileIDsToDelete.length > 0) {
					console.log(`[deleteAlbum] 正在从云存储删除 ${fileIDsToDelete.length} 个文件...`);
					await uniCloud.deleteFile({ fileList: fileIDsToDelete });
				}

				// 3. 从数据库删除照片记录
				if (photoIDsToDelete.length > 0) {
					console.log(`[deleteAlbum] 正在从数据库删除 ${photoIDsToDelete.length} 条照片记录...`);
					await photosDb
						.where({
							_id: dbCmd.in(photoIDsToDelete)
						})
						.remove();
				}
			}

			// 4. 从数据库删除相册记录
			console.log(`[deleteAlbum] 正在从数据库删除相册记录...`);
			const deleteAlbumRes = await albumDb.doc(albumId).remove();

			if (deleteAlbumRes.deleted === 1) {
				console.log(`[deleteAlbum] 相册 ${albumId} 删除成功`);
				return { errCode: 0, errMsg: '删除成功' };
			} else {
				// 即使没有照片，也应该成功删除相册
				if (deleteAlbumRes.deleted === 0) {
					return { errCode: 'NOT_FOUND', errMsg: '删除相册记录失败（可能已被删除）' };
				}
				return { errCode: 0, errMsg: '删除成功' };
			}
		} catch (e) {
			console.error('deleteAlbum error:', e);
			return { errCode: 500, errMsg: e.message };
		}
	},

	/**
	 * 为相册列表获取关联的私导信息
	 * @param {Array} orderIds 订单ID列表
	 */
	async getGuidesByOrderIds(orderIds) {
		if (!orderIds || orderIds.length === 0) return { errCode: 0, data: {} };

		// 1. 从 a-snapshots 查 staves
		const snapRes = await db
			.collection('a-snapshots')
			.where({ order_id: dbCmd.in(orderIds) })
			.field({ order_id: 1, staves: 1 })
			.get();

		const guideMap = {}; // order_id -> { real_name, mobile, user_id }
		const guideUserIds = [];

		// 2. 提取私导 ID
		for (const snap of snapRes.data) {
			if (snap.staves) {
				const guide = snap.staves.find((s) => s.role && s.role.includes('guide'));
				if (guide && guide.id) {
					guideMap[snap.order_id] = { user_id: guide.id };
					guideUserIds.push(guide.id);
				}
			}
		}

		if (guideUserIds.length === 0) return { errCode: 0, data: guideMap };

		// 3. 查私导档案获取真实姓名
		const profileRes = await db
			.collection('b-guide-profiles')
			.where({ user_id: dbCmd.in(guideUserIds) })
			.field({ user_id: 1, real_name: 1, mobile: 1 })
			.get();

		const profileMap = {};
		profileRes.data.forEach((p) => (profileMap[p.user_id] = p));

		// 4. 合并数据
		Object.keys(guideMap).forEach((orderId) => {
			const userId = guideMap[orderId].user_id;
			if (profileMap[userId]) {
				guideMap[orderId] = { ...guideMap[orderId], ...profileMap[userId] };
			}
		});

		return { errCode: 0, data: guideMap };
	},

	/**
	 * 根据私导姓名搜索订单ID（用于列表筛选）
	 */
	async searchOrdersByGuide(keyword) {
		if (!keyword) return { errCode: 0, data: [] };

		// 1. 模糊搜索私导档案
		const profiles = await db
			.collection('b-guide-profiles')
			.where({ real_name: new RegExp(keyword, 'i') })
			.field({ user_id: 1 })
			.get();

		if (profiles.data.length === 0) return { errCode: 0, data: [] };
		const guideIds = profiles.data.map((p) => p.user_id);

		// 2. 查找这些私导参与的订单快照
		const snapshots = await db
			.collection('a-snapshots')
			.where({
				'staves.id': dbCmd.in(guideIds),
				'staves.role': 'guide'
			})
			.field({ order_id: 1 })
			.limit(500)
			.get();

		return { errCode: 0, data: snapshots.data.map((s) => s.order_id) };
	},

	/**
	 * 获取管理后台相册列表（支持全局排序：有私导 > 无私导 > 出发日期）
	 */
	async getAdminAlbumList(params) {
		const { page = 1, pageSize = 20, query = '', filterMonth = '', filterStatus = '' } = params;

		// 1. 验证管理员权限
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) return { errCode: '401', errMsg: '未登录' };
		// 这里可以加更多权限判断...

		const dbJQL = uniCloud.databaseForJQL({ clientInfo: this.getClientInfo() });
		const _cmd = dbJQL.command;
		let conditions = [];

		// --- A. 构建查询条件 ---

		// 1. 月份筛选 (修复原有的筛选Bug)
		if (filterMonth) {
			const parts = filterMonth.split('-');
			if (parts.length === 2) {
				const year = parseInt(parts[0]);
				const month = parseInt(parts[1]) - 1; // JS月份 0-11
				const startDt = new Date(year, month, 1).getTime();
				// 下个月1号
				let endDtObj = new Date(year, month, 1);
				endDtObj.setMonth(endDtObj.getMonth() + 1);
				const endDt = endDtObj.getTime();

				conditions.push({
					departure_date: _cmd.gte(startDt).and(_cmd.lt(endDt))
				});
			}
		}

		// 2. 状态筛选
		const now = Date.now();
		const oneDay = 24 * 3600 * 1000;
		const maxDaysBuffer = 30;
		if (filterStatus === 'pending') {
			conditions.push({ departure_date: _cmd.gt(now) });
		} else if (filterStatus === 'active') {
			conditions.push({
				departure_date: _cmd.lte(now).and(_cmd.gte(now - maxDaysBuffer * oneDay))
			});
		} else if (filterStatus === 'completed') {
			conditions.push({ departure_date: _cmd.lt(now - maxDaysBuffer * oneDay) });
		}

		// 3. 关键词搜索 (处理混合逻辑)
		let guideOrderIds = [];
		if (query && query.trim()) {
			// 先尝试搜索私导名字，获取对应的 OrderIDs
			const guideRes = await albumService.searchOrdersByGuide(query.trim());
			if (guideRes.data && guideRes.data.length > 0) {
				guideOrderIds = guideRes.data;
			}

			const reg = new RegExp(query.trim(), 'i');
			const orArray = [{ order_id: reg }, { album_name: reg }];
			if (guideOrderIds.length > 0) {
				orArray.push({ order_id: _cmd.in(guideOrderIds) });
			}
			conditions.push(_cmd.or(orArray));
		}

		// 组合 Where 子句
		let whereObj = {};
		if (conditions.length > 0) {
			whereObj = _cmd.and(...conditions);
		}

		// --- B. 获取数据 (为了全局排序，这里需要拉取较多数据) ---
		// 注意：如果你的数据量非常巨大(>5000)，建议在数据库加字段 is_guide_assigned 来做索引排序
		// 这里假设管理后台查看的活跃数据在可控范围内，我们拉取最多 1000 条匹配记录进行内存排序

		const countRes = await dbJQL.collection('a-group-albums').where(whereObj).count();
		const total = countRes.total;

		const listRes = await dbJQL
			.collection('a-group-albums')
			.where(whereObj)
			.limit(1000) // 软限制，确保能覆盖大部分排序需求
			.orderBy('departure_date', 'desc') // 数据库先按时间粗排
			.get();

		let allList = listRes.data;

		// --- C. 获取私导信息 ---
		const orderIds = allList.map((item) => item.order_id);
		const guideRes = await albumService.getGuidesByOrderIds(orderIds);
		const guideMap = guideRes.data || {};

		// --- D. 合并与全局排序 (核心逻辑) ---
		allList.forEach((item) => {
			item.guideInfo = guideMap[item.order_id] || null;
			// 标记是否有有效私导
			item.hasGuide = item.guideInfo && Object.keys(item.guideInfo).length > 0;
		});

		// 排序规则：有私导 > 无私导，内部按时间倒序
		allList.sort((a, b) => {
			if (a.hasGuide !== b.hasGuide) {
				return a.hasGuide ? -1 : 1; // 有私导排前 (-1)
			}
			// 如果私导状态相同，按时间倒序
			return b.departure_date - a.departure_date;
		});

		// --- E. 内存分页 ---
		const startIndex = (page - 1) * pageSize;
		const endIndex = startIndex + pageSize;
		const pageData = allList.slice(startIndex, endIndex);

		return {
			errCode: 0,
			data: {
				list: pageData,
				total: allList.length // 使用实际拉取到的长度作为total，或者使用数据库count
			}
		};
	},

	/**
	 * 获取相册详情，包含统计数据和任务基准
	 */
	async getAlbumDetailWithStats(albumId) {
		// 1. 获取相册基础信息
		const albumRes = await db.collection('a-group-albums').doc(albumId).get();
		if (!albumRes.data || albumRes.data.length === 0) {
			return { errCode: 'NOT_FOUND', errMsg: '相册不存在' };
		}
		const album = albumRes.data[0];

		// 2. 获取私导信息
		let guideInfo = null;
		const snapRes = await db.collection('a-snapshots').where({ order_id: album.order_id }).limit(1).get();
		if (snapRes.data.length > 0) {
			const snap = snapRes.data[0];
			const guideStaff = snap.staves ? snap.staves.find((s) => s.role && s.role.includes('guide')) : null;
			if (guideStaff) {
				const profileRes = await db.collection('b-guide-profiles').where({ user_id: guideStaff.id }).limit(1).get();
				if (profileRes.data.length > 0) {
					guideInfo = { ...profileRes.data[0], _id: undefined }; // 包含 level, real_name 等
				}
			}
		}

		// 3. 获取任务基准配置
		let standards = null;
		if (guideInfo && guideInfo.level) {
			const configRes = await db.collection('a-management-configs').doc('GLOBAL_CONFIG').get();
			if (configRes.data.length > 0 && configRes.data[0].benchmarks && configRes.data[0].benchmarks.guide_standards) {
				standards = configRes.data[0].benchmarks.guide_standards[guideInfo.level];
			}
		}

		// 4. 统计每日照片/视频数据
		const photosRes = await db.collection('a-album-photos').where({ album_id: albumId }).field({ shooting_time: 1, media_type: 1, is_guide: 1, is_promo: 1 }).limit(2000).get();

		const dailyStats = {};
		// 初始化每一天
		for (let i = 1; i <= album.total_days; i++) {
			dailyStats[i] = { photo: 0, video: 0, promo: 0 };
		}

		const GMT8_OFFSET = 8 * 60 * 60 * 1000;
		const ONE_DAY_MS = 24 * 60 * 60 * 1000;

		const startDayIndex = Math.floor((album.departure_date + GMT8_OFFSET) / ONE_DAY_MS);

		photosRes.data.forEach((p) => {
			if (!p.shooting_time) return;

			// 计算照片的“绝对天数索引” (基于 GMT+8)
			const photoDayIndex = Math.floor((p.shooting_time + GMT8_OFFSET) / ONE_DAY_MS);

			// 计算它是第几天 (索引相减 + 1)
			const diffDays = photoDayIndex - startDayIndex + 1;

			if (diffDays >= 1 && diffDays <= album.total_days) {
				// 只统计私导上传的
				if (p.is_guide) {
					if (p.media_type === 'video') dailyStats[diffDays].video++;
					else dailyStats[diffDays].photo++;

					if (p.is_promo) dailyStats[diffDays].promo++;
				}
			}
		});

		// 5. 组装返回
		return {
			errCode: 0,
			data: {
				album,
				guideInfo,
				standards,
				dailyStats
			}
		};
	},

	/**
	 * 保存每日评分
	 */
	async saveDailyAssessment(params) {
		const { albumId, dayIndex, photoScore, videoScore, excludeAssessment } = params;
		const albumDb = db.collection('a-group-albums');

		// 获取当前记录
		const res = await albumDb.doc(albumId).get();
		if (!res.data.length) return { errCode: 'NOT_FOUND' };

		let assessments = res.data[0].daily_assessments || [];
		// 移除旧的当天记录
		assessments = assessments.filter((a) => a.day_index !== dayIndex);
		// 添加新的
		assessments.push({
			day_index: dayIndex,
			photo_score: parseFloat(photoScore),
			video_score: parseFloat(videoScore),
			exclude_assessment: !!excludeAssessment
		});

		await albumDb.doc(albumId).update({ daily_assessments: assessments });
		return { errCode: 0 };
	},

	/**
	 * 更新照片属性（设为宣传/设为已读）
	 */
	async updatePhotoAttribute(params) {
		const { photoId, attributes } = params; // attributes: { is_promo: true, is_viewed: true }
		await db.collection('a-album-photos').doc(photoId).update(attributes);
		return { errCode: 0 };
	},

	/**
	 * 上传照片到指定相册
	 * @param {object} params - 包含 albumId 和 file 的对象
	 * @returns {object} - 返回上传结果
	 */
	async uploadPhotos(params) {
		let { albumId, file, shootingTime, is_guide, mediaType = 'image', posterFile, duration } = params;

		// 1. 验证用户身份
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) {
			console.error('[相册服务] uploadPhotos 身份验证失败:', checkResult);
			return { errCode: '401', errMsg: '用户未登录' };
		}
		const userId = checkResult.uid;
		const userRole = checkResult.role;
		const userPermission = checkResult.permission;
		console.log(`[相册服务] 用户 ${userId} 尝试上传照片到相册 ${albumId}`);
		console.log('用户角色：', userRole, ' | 用户权限：', userPermission);

		if (userRole.includes('guide')) {
			is_guide = true;
		}
		console.log('是否是司导：', is_guide);

		// 2. 验证相册状态和成员资格
		const albumDb = db.collection('a-group-albums');
		const { data: albumList } = await albumDb.doc(albumId).get();
		if (!albumList || !albumList.length) {
			console.error(`[相册服务] 上传失败，相册 ${albumId} 不存在`);
			return { errCode: 'ALBUM_NOT_FOUND', errMsg: '相册不存在' };
		}
		console.log('相册数据：', albumList);
		const albumInfo = albumList[0];
		if (albumInfo.status !== 1) {
			console.warn(`[相册服务] 上传失败，相册 ${albumId} 不是进行中状态`);
			return { errCode: 'ALBUM_NOT_ACTIVE', errMsg: '相册当前不可上传' };
		}
		console.log('相册状态：', albumInfo.status);

		const isMember = albumInfo.members.some((member) => member.id === userId);
		console.log('是否是相册成员：', isMember);
		if (!is_guide && !userPermission.includes('MANAGE_ALBUMS') && !userRole.includes('admin') && !userRole.includes('super_admin') && !isMember) {
			return { errCode: 'NOT_A_MEMBER', errMsg: '不是该相册的成员' };
		}

		// 服务器端文件大小校验
		const fileID = file.fileID;
		// 图片限制 20MB，视频限制 100MB
		const maxSize = mediaType === 'video' ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
		let fileSize = 0;

		try {
			// 3. 校验文件大小
			console.log(`[相册服务] 正在校验文件大小: ${fileID}`);
			const fileInfoResult = await uniCloud.getFileInfo({
				fileList: [fileID]
			});

			if (!fileInfoResult.fileList || fileInfoResult.fileList.length === 0) {
				throw new Error('无法获取已上传的文件信息');
			}

			fileSize = fileInfoResult.fileList[0].size;

			// 4. 检查文件大小
			if (fileSize > maxSize) {
				// 文件过大，立即从云存储删除
				console.warn(`[安全] 用户 ${userId} 尝试上传超大文件: ${(fileSize / 1024 / 1024).toFixed(2)}MB。正在删除: ${fileID}`);
				await uniCloud.deleteFile({
					fileList: [fileID]
				});

				if (posterFile && posterFile.fileID) {
					await uniCloud.deleteFile({ fileList: [posterFile.fileID] });
				}

				// 返回错误，阻止数据库写入
				return {
					errCode: 'FILE_TOO_LARGE',
					errMsg: `文件大小超过${maxSize / 1024 / 1024}MB，已被服务器拒绝`
				};
			}

			console.log(`[相册服务] 文件 ${fileID} 大小校验通过: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
		} catch (e) {
			console.error(`[相册服务] 文件 ${fileID} 校验或删除失败:`, e);
			// 尝试删除这个"幽灵"文件，防止它残留在存储中
			await uniCloud.deleteFile({ fileList: [fileID] });
			return {
				errCode: 'FILE_CHECK_FAILED',
				errMsg: '文件校验失败'
			};
		}

		try {
			// 3. 将照片信息存入数据库
			const photosDb = db.collection('a-album-photos');
			const currentTime = Date.now();

			const photoData = {
				album_id: albumId,
				user_id: userId,
				original_url: file.fileID,
				compressed_url: mediaType === 'video' && posterFile ? posterFile.fileID : file.fileID,
				shooting_time: shootingTime || Date.now(),
				is_guide: !!is_guide,
				media_type: mediaType,
				duration: duration || 0,
				create_date: currentTime
			};
			const addRes = await photosDb.add(photoData);
			console.log(`[相册服务] 照片信息成功写入数据库，照片ID: ${addRes.id}`);

			return {
				errCode: 0,
				errMsg: '上传成功',
				data: {
					_id: addRes.id,
					...photoData
				}
			};
		} catch (e) {
			console.error(`[相册服务] 上传照片失败，相册ID: ${albumId}`, e);
			console.log(`[相册服务] 数据库写入失败，回滚删除文件: ${fileID}`);
			await uniCloud.deleteFile({ fileList: [fileID] });
			return {
				errCode: 'UPLOAD_FAILED',
				errMsg: '上传失败'
			};
		}
	},

	/**
	 * 删除照片
	 * @param {string} photoId - 要删除的照片ID
	 * @returns {object} - 返回删除结果
	 */
	async deletePhoto(photoId) {
		// 1. 验证用户身份
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) {
			console.error('[相册服务] deletePhoto 身份验证失败:', checkResult);
			return { errCode: '401', errMsg: '用户未登录' };
		}
		const userId = checkResult.uid;
		const userRole = checkResult.role;
		console.log(`[相册服务] 用户 ${userId}, 角色 ${userRole} 尝试删除照片，照片ID: ${photoId}`);

		if (!photoId) {
			return { errCode: 'INVALID_PARAM', errMsg: '照片ID不能为空' };
		}

		const photosDb = db.collection('a-album-photos');

		// 2. 查找照片记录
		const { data: photoList } = await photosDb.doc(photoId).get();
		if (!photoList || photoList.length === 0) {
			console.warn(`[相册服务] 删除失败，照片 ${photoId} 不存在`);
			return { errCode: 'PHOTO_NOT_FOUND', errMsg: '照片不存在' };
		}
		const photoInfo = photoList[0];

		// 3. 权限验证：确保是照片上传者本人或管理员在执行删除
		if (!userRole.includes('admin') && !userRole.includes('super_admin') && !userRole.includes('guide') && photoInfo.user_id !== userId) {
			console.warn(`[相册服务] 用户 ${userId} 无权删除照片 ${photoId} (所有者为 ${photoInfo.user_id})`);
			return { errCode: 'NO_PERMISSION', errMsg: '您只能删除自己上传的照片' };
		}

		try {
			// 4. 从云存储中删除文件 (包括原图/视频 和 压缩图/封面)
			const fileListToDelete = [];

			// 添加主文件
			if (photoInfo.original_url) {
				fileListToDelete.push(photoInfo.original_url);
			}

			if (photoInfo.compressed_url && photoInfo.compressed_url !== photoInfo.original_url) {
				fileListToDelete.push(photoInfo.compressed_url);
			}

			if (fileListToDelete.length > 0) {
				const deleteFileRes = await uniCloud.deleteFile({
					fileList: fileListToDelete
				});
				console.log(`[相册服务] 从云存储删除文件完成，数量: ${fileListToDelete.length}, 结果:`, deleteFileRes);
			}

			// 5. 从数据库中删除记录
			const deleteDbRes = await photosDb.doc(photoId).remove();
			if (deleteDbRes.deleted === 1) {
				console.log(`[相册服务] 成功从数据库删除照片记录 ${photoId}`);
				return { errCode: 0, errMsg: '删除成功' };
			} else {
				throw new Error('数据库记录删除失败');
			}
		} catch (e) {
			console.error(`[相册服务] 删除照片 ${photoId} 过程中发生异常:`, e);
			// 如果文件已删但数据库删除失败，需要有补偿机制，这里暂时只返回错误
			return { errCode: 'DELETE_FAILED', errMsg: '删除失败，请稍后重试' };
		}
	},

	/**
	 * 批量删除照片
	 * @param {Array<string>} photoIds - 要删除的照片ID数组
	 * @returns {object} - 返回批量删除结果 { deletedCount: number, failCount: number }
	 */
	async batchDeletePhotos(photoIds) {
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) {
			console.error('[相册服务] batchDeletePhotos 身份验证失败:', checkResult);
			return { errCode: '401', errMsg: '用户未登录' };
		}
		const userId = checkResult.uid;
		const userRole = checkResult.role;
		if (!userRole || (!userRole.includes('admin') && !userRole.includes('super_admin'))) {
			console.error('[相册服务] batchDeletePhotos 非管理员无权使用批量删除');
			return { errCode: '401', errMsg: '非管理员' };
		}

		console.log(`[相册服务] 管理员 ${userId} 尝试批量删除照片，数量: ${photoIds.length}`);

		if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
			return { errCode: 'INVALID_PARAM', errMsg: '照片ID列表不能为空' };
		}

		const photosDb = db.collection('a-album-photos');
		let deletedCount = 0;
		let failCount = 0;
		const fileListToDelete = [];
		const dbIdsToDelete = [];

		try {
			// 1. 先查询所有要删除的照片信息，获取 fileID
			const { data: photosToDelete } = await photosDb
				.where({
					_id: dbCmd.in(photoIds)
				})
				.field({ original_url: 1, compressed_url: 1 })
				.get();

			photosToDelete.forEach((photo) => {
				if (photo.original_url) {
					fileListToDelete.push(photo.original_url);
				}

				if (photo.compressed_url && photo.compressed_url !== photo.original_url) {
					fileListToDelete.push(photo.compressed_url);
				}

				dbIdsToDelete.push(photo._id); // 记录有效的数据库ID
			});

			console.log(`[相册服务] 准备删除 ${fileListToDelete.length} 个云存储文件和 ${dbIdsToDelete.length} 条数据库记录，ID为：`, photoIds);

			// 2. 批量删除云存储文件 (如果文件列表不为空)
			if (fileListToDelete.length > 0) {
				const deleteFileRes = await uniCloud.deleteFile({
					fileList: fileListToDelete
				});
				console.log('[相册服务] 批量删除云存储文件结果:', deleteFileRes);
				// 注意：deleteFile 的结果比较复杂，需要检查内部 fileList 的状态来精确统计成功失败
				if (deleteFileRes.fileList && deleteFileRes.fileList.length > 0) {
					deleteFileRes.fileList.forEach((item) => {
						if (!item.fileID) {
							console.warn(`[相册服务] 文件删除失败: ${item.fileID}, 原因: ${item.errMsg}`);
							// 暂时不精确统计文件删除失败个数，只要有一个失败就算整体可能部分失败
						}
					});
				} else if (!deleteFileRes.success) {
					console.error('[相册服务] 批量删除云存储文件API调用失败:', deleteFileRes.errMsg);
					// 严重错误，可能需要中断
					// throw new Error("批量删除云存储文件失败");
				}
			}

			// 3. 批量删除数据库记录 (如果ID列表不为空)
			if (dbIdsToDelete.length > 0) {
				const removeDbRes = await photosDb
					.where({
						_id: dbCmd.in(dbIdsToDelete)
					})
					.remove();

				if (removeDbRes.deleted) {
					deletedCount = removeDbRes.deleted;
					console.log(`[相册服务] 成功删除 ${deletedCount} 条数据库记录`);
				} else {
					console.error('[相册服务] 数据库记录删除失败:', removeDbRes);
					// 即使数据库删除失败也要报告，文件可能已删
				}
				failCount = photoIds.length - deletedCount; // 简单计算失败数（可能不精确）
			} else {
				failCount = photoIds.length; // 如果没有有效的ID，则全部算失败
			}

			return {
				errCode: 0,
				errMsg: '批量删除操作完成',
				data: { deletedCount, failCount }
			};
		} catch (e) {
			console.error(`[相册服务] 批量删除照片过程中发生异常:`, e);
			return {
				errCode: 'BATCH_DELETE_FAILED',
				errMsg: e.message || '批量删除失败',
				data: { deletedCount, failCount: photoIds.length - deletedCount } // 尽量返回已处理的结果
			};
		}
	},

	/**
	 * 生成批量下载照片的 ZIP 文件链接
	 * @param {object} params - 包含 photoUrls (fileID 列表) 和 albumName 的对象
	 * @returns {object} - 返回包含 downloadUrl 的对象
	 */
	async generateBatchDownloadLink(params) {
		const {
			photoUrls,
			albumName = 'album_photos' // 默认相册名
		} = params;

		// 1. 验证用户身份 (确保是管理员)
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) {
			console.error('[相册服务] generateBatchDownloadLink 身份验证失败:', checkResult);
			return { errCode: '401', errMsg: '用户未登录' };
		}

		const userRole = checkResult.role;
		if (!userRole.includes('admin') && !userRole.includes('super_admin')) {
			return { errCode: 'NO_PERMISSION', errMsg: '无权操作' };
		}

		const userId = checkResult.uid;
		console.log(`[相册服务] 用户 ${userId} 请求批量下载 ${photoUrls.length} 张照片，相册名: ${albumName}`);

		if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
			return { errCode: 'INVALID_PARAM', errMsg: '照片 URL 列表不能为空' };
		}

		// 限制一次性下载的数量，防止超时或内存溢出
		const MAX_DOWNLOAD_COUNT = 50;
		if (photoUrls.length > MAX_DOWNLOAD_COUNT) {
			return { errCode: 'LIMIT_EXCEEDED', errMsg: `单次最多下载 ${MAX_DOWNLOAD_COUNT} 张照片` };
		}

		const JSZip = require('jszip');
		const zip = new JSZip();
		const downloadPromises = [];

		console.log('[相册服务] 开始准备下载文件内容...');

		// 2. 获取所有文件的临时访问 URL (假设 photoUrls 是 fileIDs)
		let tempFileURLsResult;
		try {
			tempFileURLsResult = await uniCloud.getTempFileURL({
				fileList: photoUrls
			});
			console.log('[相册服务] 获取临时 URL 结果:', tempFileURLsResult);
		} catch (urlError) {
			console.error('[相册服务] 获取临时文件 URL 失败:', urlError);
			return { errCode: 'GET_URL_FAILED', errMsg: '获取文件访问链接失败' };
		}

		const fileListWithUrls = tempFileURLsResult.fileList.filter((f) => f.tempFileURL); // 过滤掉获取失败的
		if (fileListWithUrls.length !== photoUrls.length) {
			const failedCount = photoUrls.length - fileListWithUrls.length;
			console.warn(`[相册服务] 有 ${failedCount} 个文件的临时 URL 获取失败，可能文件不存在或权限问题`);
			// 根据业务决定是否继续，如果必须全部成功，可以在这里返回错误
			// if (fileListWithUrls.length === 0) {
			//    return { errCode: 'GET_URL_FAILED', errMsg: '所有文件的访问链接都获取失败' };
			// }
		}
		if (fileListWithUrls.length === 0) {
			console.error('[相册服务] 未能获取任何有效的文件临时 URL');
			return { errCode: 'GET_URL_FAILED', errMsg: '无法获取文件访问链接' };
		}

		// 3. 并行下载文件内容并添加到 ZIP
		fileListWithUrls.forEach((fileInfo) => {
			const promise = httpclient
				.request(fileInfo.tempFileURL, {
					method: 'GET',
					dataType: 'buffer' // 获取二进制数据
				})
				.then((res) => {
					if (res.status === 200 && res.data) {
						// 从 fileID 或 tempFileURL 中提取文件名
						let filename = 'unknown.jpg';
						const fileID = fileInfo.fileID;
						try {
							filename = fileID.substring(fileID.lastIndexOf('/') + 1);
							// 简单处理，如果文件名没有后缀，尝试从原始URL推断或默认 .jpg
							if (!/\.[a-zA-Z0-9]+$/.test(filename)) {
								const extMatch = /\.(\w+)$/.exec(fileInfo.tempFileURL.split('?')[0]); // 尝试从临时URL获取后缀
								filename += extMatch ? `.${extMatch[1]}` : '.jpg';
							}
						} catch (e) {
							console.warn('无法从fileID提取文件名:', fileID, e);
						}
						console.log(`[相册服务] 添加文件到 ZIP: ${filename}, 大小: ${res.data.length} bytes`);
						zip.file(filename, res.data); // 将 Buffer 添加到 zip
					} else {
						console.warn(`[相册服务] 下载文件失败: ${fileInfo.tempFileURL}, Status: ${res.status}`);
						// 可以选择记录失败的文件
					}
				})
				.catch((err) => {
					console.error(`[相册服务] 请求文件内容异常: ${fileInfo.tempFileURL}`, err);
					// 记录失败
				});
			downloadPromises.push(promise);
		});

		try {
			// 4. 等待所有文件下载和添加完成
			await Promise.all(downloadPromises);
			console.log('[相册服务] 所有文件内容已添加到 ZIP 实例');

			// 检查 zip 是否为空
			if (Object.keys(zip.files).length === 0) {
				console.warn('[相册服务] 没有成功添加任何文件到 ZIP');
				return { errCode: 'ZIP_EMPTY', errMsg: '无法打包照片，请检查文件是否存在' };
			}

			// 5. 生成 ZIP 文件 Buffer
			const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
			console.log(`[相册服务] ZIP 文件生成成功, 大小: ${zipBuffer.length} bytes`);

			// 6. 上传 ZIP 文件到云存储临时目录
			const zipFileName = `${albumName}_${Date.now()}.zip`;
			const zipCloudPath = `temp-zip/${zipFileName}`; // 存储在专门的临时目录

			console.log(`[相册服务] 开始上传 ZIP 文件到: ${zipCloudPath}`);
			const uploadZipRes = await uniCloud.uploadFile({
				cloudPath: zipCloudPath,
				fileContent: zipBuffer
			});
			console.log('[相册服务] ZIP 文件上传结果:', uploadZipRes);

			if (!uploadZipRes.fileID) {
				throw new Error(uploadZipRes.message || '上传ZIP文件失败，未返回 fileID');
			}

			// 7. 获取 ZIP 文件的临时下载链接 (有效期1小时)
			console.log('[相册服务] 开始获取 ZIP 文件的临时下载链接...');
			const tempZipUrlRes = await uniCloud.getTempFileURL({
				fileList: [uploadZipRes.fileID]
			});
			console.log('[相册服务] 获取 ZIP 临时链接结果:', tempZipUrlRes);

			if (tempZipUrlRes.fileList && tempZipUrlRes.fileList.length > 0 && tempZipUrlRes.fileList[0].tempFileURL) {
				const downloadUrl = tempZipUrlRes.fileList[0].tempFileURL;
				console.log('[相册服务] 成功生成下载链接:', downloadUrl);
				return {
					errCode: 0,
					errMsg: '成功生成下载链接',
					downloadUrl: downloadUrl
				};
			} else {
				throw new Error(tempZipUrlRes.fileList[0]?.errMsg || '获取 ZIP 文件下载链接失败');
			}
		} catch (e) {
			console.error(`[相册服务] 处理批量下载过程中发生异常:`, e);
			return {
				errCode: 'BATCH_DOWNLOAD_FAILED',
				errMsg: e.message || '生成批量下载链接失败'
			};
		}
	},

	async submitAlbumRating(params) {
		// 1. 验证用户身份
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) {
			console.error('[相册服务] submitAlbumRating 身份验证失败:', checkResult);
			return { errCode: '401', errMsg: '用户未登录' };
		}
		const userId = checkResult.uid;

		const { albumId, score, comment } = params;

		// 将评价推送到数组中
		await db
			.collection('a-group-albums')
			.doc(albumId)
			.update({
				guest_ratings: dbCmd.push({
					user_id: userId,
					score: score,
					comment: comment,
					create_date: Date.now()
				})
			});

		return { errCode: 0, errMsg: 'ok' };
	}
};

module.exports = albumService;
