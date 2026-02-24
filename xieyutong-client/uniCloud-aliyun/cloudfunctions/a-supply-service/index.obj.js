const db = uniCloud.database();
const cmd = db.command;
const uniIdCommon = require('uni-id-common');

module.exports = {
	_before: function () {
		const clientInfo = this.getClientInfo();
		this.uniIdCommon = uniIdCommon.createInstance({
			clientInfo: clientInfo
		});
	},

	/**
	 * 系统端：自动初始化订单物资（默认将所有启用项加入）
	 */
	async autoInitOrderSupplies(orderId) {
		// 0. 获取订单人数
		let travelerCount = 1; // 默认1
		const taskRes = await db.collection('a-task-orders').where({ order_id: orderId }).get();
		if (taskRes.data.length > 0) {
			const task = taskRes.data[0];
			if (task.raw_data && task.raw_data[0] && task.raw_data[0].order_context && Array.isArray(task.raw_data[0].order_context.travelers)) {
				travelerCount = task.raw_data[0].order_context.travelers.length || 1;
			}
		}
		console.log(`[AutoInit] 订单 ${orderId} 人数读取: ${travelerCount}`);

		// 1. 获取所有启用的服务
		const servicesRes = await db.collection('a-services').where({ status: true, is_default: true }).get();
		// 2. 获取所有启用的物资（排除配置项）
		const suppliesRes = await db
			.collection('a-supplies')
			.where({ status: true, is_config: { $ne: true }, is_default: true })
			.get();

		// 3. 构造默认选中数据 (默认数量均为 1)
		const selectedServices = servicesRes.data.map((s) => ({
			id: s._id,
			name: s.name,
			quantity: 1
		}));

		const selectedSupplies = suppliesRes.data.map((s) => {
			// 如果是按人分配，数量 = 人数；否则 = 1
			const qty = s.allocation_type === 'person' ? travelerCount : 1;
			return {
				id: s._id,
				quantity: qty
			};
		});

		// 4. 计算物资汇总

		let allSupplyIds = new Set(selectedSupplies.map((s) => s.id));
		servicesRes.data.forEach((s) => {
			if (s.supplies) s.supplies.forEach((i) => allSupplyIds.add(i.id));
		});

		let suppliesDetailMap = {};
		if (allSupplyIds.size > 0) {
			const res = await db
				.collection('a-supplies')
				.where({ _id: cmd.in(Array.from(allSupplyIds)) })
				.get();
			res.data.forEach((s) => (suppliesDetailMap[s._id] = s));
		}

		const supplySummary = {};
		const addToSummary = (id, qty) => {
			if (!suppliesDetailMap[id]) return;
			if (!supplySummary[id]) {
				const detail = suppliesDetailMap[id];
				supplySummary[id] = {
					id: id,
					name: detail.name,
					image: detail.image,
					unit: detail.unit,
					is_consumable: detail.is_consumable || false,
					total_quantity: 0,
					pickup_quantity: 0,
					return_normal_quantity: 0,
					return_damaged_quantity: 0,
					return_lost_quantity: 0,
					status: 'pending'
				};
			}
			supplySummary[id].total_quantity += qty;
		};

		// 统计服务
		selectedServices.forEach((userSel) => {
			const serviceDetail = servicesRes.data.find((s) => s._id === userSel.id);
			if (serviceDetail && serviceDetail.supplies) {
				serviceDetail.supplies.forEach((item) => {
					// 1. 获取该物资的详细定义
					const sDetail = suppliesDetailMap[item.id];

					// 2. 确定分配方式 (默认为 person)
					const allocType = sDetail ? sDetail.allocation_type || 'person' : 'person';

					// 3. 计算倍数：如果是按团，倍数为1；如果是按人，倍数为人数
					const multiplier = allocType === 'group' ? 1 : travelerCount;

					// 4. 计算最终加入汇总的数量
					// 公式: 服务内定义的单量 * 用户选购的服务份数 * (人数倍数)
					const finalQty = item.quantity * userSel.quantity * multiplier;

					addToSummary(item.id, finalQty);
				});
			}
		});
		// 统计单项
		selectedSupplies.forEach((item) => addToSummary(item.id, item.quantity));
		const finalSupplyList = Object.values(supplySummary);

		// 5. 存入数据库
		const existCheck = await db.collection('a-order-supplies').where({ order_id: orderId }).count();
		if (existCheck.total === 0) {
			await db.collection('a-order-supplies').add({
				order_id: orderId,
				user_id: 'system_auto', // 标记为系统自动生成
				selected_services: selectedServices,
				selected_supplies: selectedSupplies,
				supplies: finalSupplyList,
				user_remark: '',
				is_user_confirmed: false,
				status: 'created',
				created_at: Date.now(),
				updated_at: Date.now()
			});
			console.log(`[AutoInit] 订单 ${orderId} 物资已自动初始化`);
		}
	},

	// 前端调用：检查是否需要弹窗
	async checkNeedPopup(orderId) {
		if (!orderId) return false;
		const res = await db.collection('a-order-supplies').where({ order_id: orderId }).field({ is_user_confirmed: true }).get();

		if (res.data.length === 0) {
			return true;
		}

		// 如果 is_user_confirmed 为 false (或 undefined)，则需要弹窗
		return !res.data[0].is_user_confirmed;
	},

	/**
	 * 用户端：获取所有启用的服务，并自动查出关联的物资详情（图片、单位等）
	 */
	async getServicesWithDetails() {
		// 1. 并行查询服务和物资
		const servicesProm = db.collection('a-services').where({ status: true }).get();
		// 排除配置项(is_config)
		const suppliesProm = db
			.collection('a-supplies')
			.where({ status: true, is_config: { $ne: true } })
			.get();

		const [servicesRes, suppliesRes] = await Promise.all([servicesProm, suppliesProm]);
		const services = servicesRes.data;
		const supplies = suppliesRes.data;

		// 2. 收集服务中涉及的物资ID，用于查询服务包含的子项详情
		let serviceSupplyIds = new Set();
		services.forEach((s) => {
			if (s.supplies && Array.isArray(s.supplies)) {
				s.supplies.forEach((item) => serviceSupplyIds.add(item.id));
			}
		});

		// 3. 查询服务子项的物资基础信息
		let supplyDetailMap = {};
		if (serviceSupplyIds.size > 0) {
			const detailRes = await db
				.collection('a-supplies')
				.where({ _id: cmd.in(Array.from(serviceSupplyIds)) })
				.field({ name: 1, unit: 1, image: 1 }) // 只取必要字段
				.get();
			detailRes.data.forEach((s) => (supplyDetailMap[s._id] = s));
		}

		// 4. 组装服务数据 (Type: service)
		const formattedServices = services.map((service) => {
			const enrichedSupplies = (service.supplies || []).map((ref) => {
				const detail = supplyDetailMap[ref.id] || { name: '未知物资', image: '' };
				return {
					name: detail.name,
					image: detail.image, // 这里可能是数组或字符串，前端需处理
					quantity: ref.quantity,
					is_on_demand: ref.is_on_demand || false
				};
			});

			return {
				_id: service._id,
				type: 'service', // 标记类型
				name: service.name,
				description: service.description || '包含多项物资的套餐服务',
				unit: '套',
				items: enrichedSupplies, // 子项列表
				image: null // 服务本身通常没有图，用子项图拼凑
			};
		});

		// 5. 组装单项物资数据 (Type: supply)
		const formattedSupplies = supplies.map((supply) => {
			return {
				_id: supply._id,
				type: 'supply', // 标记类型
				name: supply.name,
				description: supply.description,
				unit: supply.unit,
				items: null,
				// 统一图片格式
				image: supply.image
			};
		});

		// 6. 合并返回 (服务排在前面)
		return [...formattedServices, ...formattedSupplies];
	},

	/**
	 * 用户端：提交订单物资需求及留言
	 * @param {String} orderId 订单ID
	 * @param {Array} selectedServices 用户选中的服务列表 [{id, quantity, name}]
	 * @param {Array} selectedSupplies 用户选中的单项物资列表 [{id, quantity}]
	 */
	async submitOrderDemand(orderId, selectedServices = [], selectedSupplies = [], remark = '') {
		// 验证用户身份
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) {
			throw new Error('身份验证失败');
		}

		const userId = checkResult.uid;

		// 1. 获取选中的服务详情
		let servicesList = [];
		if (selectedServices.length > 0) {
			// 提取ID进行查询
			const serviceIds = selectedServices.map((s) => s.id);
			const res = await db
				.collection('a-services')
				.where({ _id: cmd.in(serviceIds) })
				.get();
			servicesList = res.data;
		}

		// 2. 获取选中的单项物资详情 (同时查询服务里的物资)
		let allSupplyIds = new Set(selectedSupplies.map((s) => s.id));
		servicesList.forEach((s) => {
			if (s.supplies) s.supplies.forEach((i) => allSupplyIds.add(i.id));
		});

		let suppliesDetailMap = {};
		if (allSupplyIds.size > 0) {
			const res = await db
				.collection('a-supplies')
				.where({ _id: cmd.in(Array.from(allSupplyIds)) })
				.get();
			res.data.forEach((s) => (suppliesDetailMap[s._id] = s));
		}

		// 3. 计算物资汇总
		const supplySummary = {};

		const addToSummary = (id, qty) => {
			if (!suppliesDetailMap[id]) return;
			if (!supplySummary[id]) {
				const detail = suppliesDetailMap[id];
				supplySummary[id] = {
					id: id,
					name: detail.name,
					image: detail.image,
					unit: detail.unit,
					is_consumable: detail.is_consumable || false,
					is_on_demand: false,
					total_quantity: 0,
					pickup_quantity: 0,
					return_normal_quantity: 0,
					return_damaged_quantity: 0,
					return_lost_quantity: 0,
					status: 'pending'
				};
			}
			supplySummary[id].total_quantity += qty;
		};

		// 3.1 统计服务中的物资 (注意：需乘以服务选择的数量)
		selectedServices.forEach((userSel) => {
			const serviceDetail = servicesList.find((s) => s._id === userSel.id);
			if (serviceDetail && serviceDetail.supplies) {
				serviceDetail.supplies.forEach((item) => {
					// 1. 获取该物资的详细定义
					const sDetail = suppliesDetailMap[item.id];

					// 2. 确定分配方式 (默认为 person)
					const allocType = sDetail ? sDetail.allocation_type || 'person' : 'person';

					// 3. 计算倍数：如果是按团，倍数为1；如果是按人，倍数为人数
					const multiplier = allocType === 'group' ? 1 : travelerCount;

					// 4. 计算最终加入汇总的数量
					// 公式: 服务内定义的单量 * 用户选购的服务份数 * (人数倍数)
					const finalQty = item.quantity * userSel.quantity * multiplier;

					addToSummary(item.id, finalQty);
				});
			}
		});

		// 3.2 统计单项物资 (直接累加用户选择的数量)
		selectedSupplies.forEach((item) => addToSummary(item.id, item.quantity));

		const finalSupplyList = Object.values(supplySummary);

		// 4. 存入 a-order-supplies
		const existCheck = await db.collection('a-order-supplies').where({ order_id: orderId }).get();

		let oldRemark = '';
		if (existCheck.data.length > 0) {
			oldRemark = existCheck.data[0].user_remark || '';
		}

		const dataToSave = {
			order_id: orderId,
			user_id: userId,
			// 存储带数量的结构
			selected_services: selectedServices,
			selected_supplies: selectedSupplies,
			supplies: finalSupplyList,
			user_remark: remark,
			is_user_confirmed: true,
			status: 'created',
			updated_at: Date.now()
		};

		if (existCheck.data.length > 0) {
			await db.collection('a-order-supplies').doc(existCheck.data[0]._id).update(dataToSave);
		} else {
			dataToSave.created_at = Date.now();
			await db.collection('a-order-supplies').add(dataToSave);
		}

		// 如果留言不为空且与之前不一样，发送通知
		if (remark && remark.trim() !== oldRemark.trim()) {
			try {
				// 1. 获取快照信息 (查询管家 & 客户)
				const snapshotRes = await db.collection('a-snapshots').where({ order_id: orderId }).field({ travel_users: 1, staves: 1 }).get();

				if (snapshotRes.data.length > 0) {
					const snapshot = snapshotRes.data[0];

					// 2. 找管家手机号 (staves中role包含attendant)
					let attendantMobile = '';
					const staves = snapshot.staves || [];
					const attendant = staves.find((s) => s.role === 'attendant' || (Array.isArray(s.role) && s.role.includes('attendant')));
					if (attendant) {
						attendantMobile = attendant.mobile;
					}

					// 3. 找客户信息
					let customerName = '未知客户';
					let customerMobile = '';
					if (userId) {
						const uRes = await db.collection('uni-id-users').doc(userId).field({ nickname: 1, username: 1, mobile: 1 }).get();
						if (uRes.data.length > 0) {
							const u = uRes.data[0];
							customerName = u.nickname || u.username || '未知客户';
							customerMobile = u.mobile || '';
						}
					}

					// 4. 调用通知云对象
					const notifier = uniCloud.importObject('attendant-notifier');
					await notifier.notifyUserRemark({
						orderId,
						customerName,
						customerMobile,
						remark,
						attendantMobile
					});
				}
			} catch (e) {
				console.error('发送留言通知失败:', e);
				// 不阻塞主流程返回
			}
		}

		return { errCode: 0, msg: '需求提交成功' };
	},

	/**
	 * 后台：获取物资流转列表（带关联数据）
	 * @param {Object} params
	 * @param {Number} params.page 页码，默认1
	 * @param {Number} params.size 每页条数，默认20
	 * @param {String} params.attendantId 管家ID（筛选）
	 * @param {Number} params.startDate 开始日期时间戳
	 * @param {Number} params.endDate 结束日期时间戳
	 * @param {String} params.keyword 搜索关键词（订单号/客人姓名）
	 */
	async getSuppliesFlowList(params) {
		const { page = 1, size = 20, attendantId, startDate, endDate, keyword } = params;
		const skip = (page - 1) * size;

		try {
			// 1. 构建聚合管道的筛选条件 (Match Object)
			let matchObj = {};

			// A. 关联表查询 (Lookups) - 定义在后面，但这里先准备筛选逻辑

			// B. 筛选: 时间 (基于 snapshot 表)
			if (startDate && endDate) {
				matchObj['snapshot.0.departure_date'] = {
					$gte: startDate,
					$lte: endDate
				};
			}

			// C. 筛选: 关键词 (订单号 OR 第一位客人姓名)
			if (keyword && keyword.trim()) {
				const keyStr = keyword.trim();
				matchObj['$or'] = [{ order_id: { $regex: keyStr, $options: 'i' } }, { 'taskOrder.0.raw_data.0.order_context.travelers.0.name': { $regex: keyStr, $options: 'i' } }];
			}

			// D. 筛选: 管家
			if (attendantId) {
				if (attendantId === 'unassigned') {
					// 筛选未分配：snapshot.staves 数组为空，或者不存在 role 为 attendant 的项
					matchObj['snapshot.0.staves.role'] = cmd.neq('attendant');
				} else {
					// 筛选指定管家ID
					matchObj['snapshot.0.staves.id'] = attendantId;
				}
			}

			// 2. 定义基础聚合管道 (用于复用)
			const aggregatePipeline = db
				.collection('a-order-supplies')
				.aggregate()
				// 关联快照表 (获取时间、管家)
				.lookup({
					from: 'a-snapshots',
					localField: 'order_id',
					foreignField: 'order_id',
					as: 'snapshot'
				})
				// 关联任务订单表 (获取客人姓名)
				.lookup({
					from: 'a-task-orders',
					localField: 'order_id',
					foreignField: 'order_id',
					as: 'taskOrder'
				})
				// 应用筛选条件
				.match(matchObj);

			// 3. 执行查询：获取总数 (用于前端分页)
			const countResult = await aggregatePipeline.count('total').end();

			const total = countResult.data && countResult.data.length > 0 ? countResult.data[0].total : 0;

			// 4. 执行查询：获取分页数据
			let listData = [];
			if (total > 0) {
				const dataResult = await db
					.collection('a-order-supplies')
					.aggregate()
					.lookup({
						from: 'a-snapshots',
						localField: 'order_id',
						foreignField: 'order_id',
						as: 'snapshot'
					})
					.lookup({
						from: 'a-task-orders',
						localField: 'order_id',
						foreignField: 'order_id',
						as: 'taskOrder'
					})
					.match(matchObj)
					.sort({ updated_at: -1 }) // 按更新时间倒序
					.skip(skip)
					.limit(size)
					.end();

				listData = dataResult.data;
			}

			// 5. 数据格式化 (清理 lookup 产生的数组结构，以匹配前端原有逻辑)
			const formattedList = listData.map((item) => {
				// lookup 返回的是数组，解包第一项
				const snapshot = item.snapshot && item.snapshot.length > 0 ? item.snapshot[0] : null;
				const taskOrder = item.taskOrder && item.taskOrder.length > 0 ? item.taskOrder[0] : null;

				// 移除数组形式的字段，换回对象形式，避免前端报错
				delete item.snapshot;
				delete item.taskOrder;

				return {
					...item,
					snapshot: snapshot,
					taskOrder: taskOrder
				};
			});

			return {
				errCode: 0,
				data: formattedList,
				total: total,
				page: page,
				size: size
			};
		} catch (e) {
			console.error('getSuppliesFlowList Aggr error:', e);
			return { errCode: -1, msg: e.message || '查询失败' };
		}
	},

	/**
	 * 司导端：获取订单物资详情
	 */
	async getOrderSupplies(orderId) {
		const res = await db.collection('a-order-supplies').where({ order_id: orderId }).get();
		if (res.data.length === 0) return null;
		const orderSupply = res.data[0];

		if (orderSupply.supplies && orderSupply.supplies.length > 0) {
			const ids = orderSupply.supplies.map((s) => s.id);
			// 查询 a-supplies 表获取描述
			const supplyRes = await db
				.collection('a-supplies')
				.where({ _id: cmd.in(ids) })
				.field({ description: 1 })
				.get();

			const descMap = {};
			supplyRes.data.forEach((s) => (descMap[s._id] = s.description));

			// 将描述合并回返回结果
			orderSupply.supplies.forEach((s) => {
				// 优先使用记录里的，如果没有则使用查出来的
				if (!s.description) {
					s.description = descMap[s.id] || '';
				}
			});
		}

		return orderSupply;
	},

	/**
	 * 司导端：流转状态（领用/归还）+ 库存管理
	 * @param {Object} params
	 * @param {String} params.id  记录ID
	 * @param {String} params.action 'pickup' | 'return'
	 * @param {Array}  params.suppliesList 前端传来的包含修改后数据的物资列表
	 * @param {Array}  params.photos 全局照片（整堆物资的照片）
	 * @param {String} params.operatorId 操作人ID
	 * @param {String} params.remark 归还时的备注 (仅return有效)
	 */
	async updateProcessStatus(params) {
		const { id, action, suppliesList, photos, operatorId, remark } = params;
		const now = Date.now();
		console.log('updateProcessStatus');
		console.log('id: ', id, ' | action: ', action, ' | suppliesList: ', suppliesList, ' | photos: ', photos, ' | operatorId: ', operatorId, ' | remark: ', remark);

		// 开启事务
		const transaction = await db.startTransaction();

		try {
			// 1. 获取当前订单记录（事务内锁定）
			const recordRes = await transaction.collection('a-order-supplies').doc(id).get();
			if (recordRes.data.length === 0) throw new Error('记录不存在');
			const currentRecord = recordRes.data;
			console.log('currentRecord: ', currentRecord);

			const updateData = {};
			let newSupplies = [];
			const findCurrentItem = (itemId) => currentRecord.supplies.find((s) => s.id === itemId);

			// ================== 领用流程 (扣库存) ==================
			if (action === 'pickup') {
				updateData.status = 'processing';
				updateData.is_returning = false; // 初始化归还标记
				updateData['pickup_info'] = {
					time: now,
					photos: photos || [],
					operator_id: operatorId
				};

				newSupplies = [];
				for (let item of suppliesList) {
					const original = findCurrentItem(item.id);
					const pickupQty = item.pickup_quantity;

					// 检查库存是否充足 (可选)
					const supplyInDb = await transaction.collection('a-supplies').doc(item.id).get();
					if (supplyInDb.data.stock < pickupQty) {
						console.error(`物资【${original.name}】库存不足，剩余: ${supplyInDb.data.stock}`);
					}

					// 扣减库存
					await transaction
						.collection('a-supplies')
						.doc(item.id)
						.update({
							stock: cmd.inc(-pickupQty)
						});

					newSupplies.push({
						...original,
						pickup_quantity: pickupQty,
						status: 'picked_up'
					});
				}

				console.log('newSupplies: ', newSupplies);

				// ================== 归还流程 (还库存) ==================
			} else if (action === 'return') {
				updateData.status = 'completed';
				updateData['return_info'] = {
					time: now,
					photos: photos || [],
					operator_id: operatorId,
					remark: remark || ''
				};

				newSupplies = [];
				for (let item of suppliesList) {
					const original = findCurrentItem(item.id);

					if (original.is_consumable) {
						// 【消耗品逻辑】
						// 校验：归还不能超过领用
						if (item.return_normal_quantity > original.pickup_quantity) {
							throw new Error(`物资【${original.name}】归还数不能大于领用数`);
						}

						// 恢复库存：将剩余的（return_normal_quantity）加回库存
						// 差额（pickup - return_normal）视为已消耗，无需操作
						if (item.return_normal_quantity > 0) {
							await transaction
								.collection('a-supplies')
								.doc(item.id)
								.update({
									stock: cmd.inc(item.return_normal_quantity)
								});
						}

						newSupplies.push({
							...original,
							status: 'returned',
							return_normal_quantity: item.return_normal_quantity,
							return_damaged_quantity: 0, // 消耗品默认无损坏
							return_lost_quantity: 0, // 消耗品默认无丢失
							return_evidence: []
						});
					} else {
						// 校验：三个数量之和必须等于领用数量
						const totalReturn = (item.return_normal_quantity || 0) + (item.return_damaged_quantity || 0) + (item.return_lost_quantity || 0);

						if (totalReturn !== original.pickup_quantity) {
							throw new Error(`物资【${original.name}】归还总数(${totalReturn})与领用数(${original.pickup_quantity})不符`);
						}

						// 恢复库存：只恢复【完好】的数量
						// 报修和报失的物资通常需要另外的流程处理，不直接回已用库存
						if (item.return_normal_quantity > 0) {
							await transaction
								.collection('a-supplies')
								.doc(item.id)
								.update({
									stock: cmd.inc(item.return_normal_quantity)
								});
						}

						newSupplies.push({
							...original,
							status: 'returned',
							return_normal_quantity: item.return_normal_quantity,
							return_damaged_quantity: item.return_damaged_quantity,
							return_lost_quantity: item.return_lost_quantity,
							return_evidence: item.return_evidence || []
						});
					}
				}
			}

			// 更新订单记录
			updateData.supplies = newSupplies;
			updateData.updated_at = now;
			console.log('updateData: ', updateData);
			await transaction.collection('a-order-supplies').doc(id).update(updateData);

			// 提交事务
			await transaction.commit();
			return { errCode: 0, msg: '操作成功' };
		} catch (e) {
			// 回滚事务
			await transaction.rollback();
			return { errCode: -1, msg: e.message || '系统繁忙' };
		}
	},

	/**
	 * 司导端：更新出库信息（在 processing 状态且未进入归还流程时）
	 * @param {Object} params
	 * @param {String} params.id 记录ID
	 * @param {Array} params.suppliesList 更新后的物资列表
	 * @param {Array} params.photos 新增的照片（追加）
	 */
	async updatePickupInfo(params) {
		const { id, suppliesList, photos } = params;
		const now = Date.now();

		try {
			// 1. 获取当前记录
			const recordRes = await db.collection('a-order-supplies').doc(id).get();
			if (recordRes.data.length === 0) {
				throw new Error('记录不存在');
			}
			const currentRecord = recordRes.data[0];

			// 2. 状态校验
			if (currentRecord.status !== 'processing') {
				throw new Error('当前状态不允许修改出库信息');
			}
			if (currentRecord.is_returning === true) {
				throw new Error('已进入归还流程，无法修改出库信息');
			}

			// 3. 处理库存变更（需要对比原数量和现数量）
			const currentSupplies = currentRecord.supplies || [];
			const stockChanges = []; // 记录库存变更

			for (let item of suppliesList) {
				const original = currentSupplies.find((s) => s.id === item.id);
				const originalQty = original ? original.pickup_quantity || 0 : 0;
				const newQty = item.pickup_quantity || 0;
				const diff = newQty - originalQty;

				if (diff !== 0) {
					// 检查库存是否充足（如果是增加）
					if (diff > 0) {
						const supplyRes = await db.collection('a-supplies').doc(item.id).field({ stock: 1, name: 1 }).get();
						if (supplyRes.data.length > 0) {
							if (supplyRes.data[0].stock < diff) {
								throw new Error(`物资【${supplyRes.data[0].name}】库存不足，剩余: ${supplyRes.data[0].stock}`);
							}
						}
					}
					stockChanges.push({ id: item.id, diff });
				}
			}

			// 4. 执行库存变更
			for (let change of stockChanges) {
				await db
					.collection('a-supplies')
					.doc(change.id)
					.update({
						stock: cmd.inc(-change.diff)
					});
			}

			// 5. 更新物资列表
			const newSupplies = suppliesList.map((item) => {
				const original = currentSupplies.find((s) => s.id === item.id);
				return {
					...original,
					pickup_quantity: item.pickup_quantity,
					status: 'picked_up'
				};
			});

			// 6. 处理照片（追加）
			let newPhotos = currentRecord.pickup_info?.photos || [];
			if (photos && photos.length > 0) {
				newPhotos = [...newPhotos, ...photos];
			}

			// 7. 更新记录
			await db.collection('a-order-supplies').doc(id).update({
				supplies: newSupplies,
				'pickup_info.photos': newPhotos,
				updated_at: now
			});

			return { errCode: 0, msg: '更新成功' };
		} catch (e) {
			console.error('updatePickupInfo error:', e);
			return { errCode: -1, msg: e.message || '操作失败' };
		}
	},

	/**
	 * 司导端：开始归还流程（将 is_returning 设为 true）
	 * @param {String} id 记录ID
	 */
	async startReturnProcess(id) {
		try {
			// 1. 获取当前记录
			const recordRes = await db.collection('a-order-supplies').doc(id).get();
			if (recordRes.data.length === 0) {
				throw new Error('记录不存在');
			}
			const currentRecord = recordRes.data[0];

			// 2. 状态校验
			if (currentRecord.status !== 'processing') {
				throw new Error('当前状态不允许开始归还');
			}
			if (currentRecord.is_returning === true) {
				throw new Error('已进入归还流程');
			}

			// 3. 更新 is_returning 标记
			await db.collection('a-order-supplies').doc(id).update({
				is_returning: true,
				updated_at: Date.now()
			});

			return { errCode: 0, msg: '已进入归还流程' };
		} catch (e) {
			console.error('startReturnProcess error:', e);
			return { errCode: -1, msg: e.message || '操作失败' };
		}
	}
};
