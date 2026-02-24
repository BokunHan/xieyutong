// a-operation-center/index.obj.js
const db = uniCloud.database();
const dbCmd = db.command;

const operationCenter = {
	_before: async function () {
		// 简单的权限校验，确保只有管理员或内部员工能调用
		const clientInfo = this.getClientInfo();
		// 这里请根据你的鉴权体系完善，比如检查 token
	},

	/**
	 * 获取资源调度矩阵
	 * @param {Object} params
	 * @param {Number} params.startDate 查询开始时间戳 (毫秒)
	 * @param {Number} params.endDate   查询结束时间戳 (毫秒)
	 */
	async getScheduleMatrix(params) {
		const { startDate, endDate } = params;

		// 1. 确定数据库查询范围
		// 为了防止漏掉那些“早于startDate出发，但行程跨越到了startDate之后”的订单
		// 我们假设最长行程不会超过 20 天（根据业务调整），向前多查 20 天
		const BUFFER_DAYS = 20 * 24 * 60 * 60 * 1000;
		const queryStart = startDate - BUFFER_DAYS;
		console.log('queryStart: ', queryStart, ' - endDate: ', endDate);

		// 2. 查询快照表
		// 只需要取核心字段，减少数据传输量
		const res = await db
			.collection('a-snapshots')
			.where({
				departure_date: dbCmd.gte(queryStart).and(dbCmd.lte(endDate))
			})
			.field({
				_id: 1,
				order_id: 1,
				title: 1,
				departure_date: 1,
				total_days: 1,
				staves: 1,
				vehicle_id: 1,
				itinerary: 1,
				travel_users: 1,
				rank: 1,
				custom_display_text: 1,
				manual_markers: 1,
				custom_color: 1
			})
			.limit(1000)
			.get();

		const orders = res.data;

		const orderIds = orders.map((o) => o.order_id);
		let taskOrderMap = {};

		if (orderIds.length > 0) {
			const taskRes = await db
				.collection('a-task-orders')
				.where({
					order_id: dbCmd.in(orderIds)
				})
				.field({ order_id: 1, raw_data: 1 })
				.get();

			taskRes.data.forEach((t) => {
				taskOrderMap[t.order_id] = t.raw_data;
			});
		}

		// --- 获取销售信息 ---
		let salesMap = {}; // 格式: { order_id: "销售姓名" }
		let customerRemarksMap = {};

		if (orderIds.length > 0) {
			// 2.1 获取任务数据 (原有逻辑)
			const taskRes = await db
				.collection('a-task-orders')
				.where({
					order_id: dbCmd.in(orderIds)
				})
				.field({ order_id: 1, raw_data: 1 })
				.get();

			taskRes.data.forEach((t) => {
				taskOrderMap[t.order_id] = t.raw_data;
			});

			// 2.2 查询订单关联的客户信息 (获取 sales_id)
			const custRes = await db
				.collection('a-customers')
				.where({
					order_id: dbCmd.in(orderIds),
					status: 'deal' // 仅查询已成交的关联
				})
				.field({ order_id: 1, sales_id: 1, remarks: 1 })
				.get();

			const customers = custRes.data;

			// 建立 OrderID -> Remarks 映射
			customers.forEach((c) => {
				if (c.order_id) customerRemarksMap[c.order_id] = c.remarks || '';
			});

			// 提取所有涉及的 sales_id (去重且排除空值)
			const salesIds = [...new Set(customers.map((c) => c.sales_id).filter((id) => id))];

			if (salesIds.length > 0) {
				// 2.3 查询销售人员姓名
				const salesUserRes = await db
					.collection('uni-id-users')
					.where({
						_id: dbCmd.in(salesIds)
					})
					.field({ _id: 1, nickname: 1, username: 1 })
					.get();

				// 建立 ID -> Name 临时映射
				const userIdNameMap = {};
				salesUserRes.data.forEach((u) => {
					userIdNameMap[u._id] = u.nickname || u.username || '未知销售';
				});

				// 2.4 建立 OrderID -> SalesName 映射
				customers.forEach((c) => {
					if (c.order_id && c.sales_id && userIdNameMap[c.sales_id]) {
						salesMap[c.order_id] = userIdNameMap[c.sales_id];
					}
				});
			}
		}

		// 3. 构建占用矩阵
		// 格式: { 'guide_id_123': [ {start, end, orderInfo}, ... ], 'vehicle_id_abc': [...] }
		let guideOccupancy = {};
		let attendantOccupancy = {};
		let vehicleOccupancy = {};
		let unassignedGuide = [];
		let unassignedAttendant = [];

		// 辅助函数：标准化日期（去除时分秒，避免边缘误差）
		const getDayTime = (ts) => {
			const offset = 8 * 60 * 60 * 1000;
			const d = new Date(ts + offset);
			d.setHours(0, 0, 0, 0);
			return d.getTime() - offset;
		};

		const reqStart = getDayTime(startDate);
		const reqEnd = getDayTime(endDate);

		for (const order of orders) {
			const rawData = taskOrderMap[order.order_id];
			// 计算该订单的绝对时间段
			const tripStart = getDayTime(order.departure_date);
			const durationMs = (order.total_days - 1) * 24 * 60 * 60 * 1000;
			const tripEnd = tripStart + durationMs;

			// 过滤掉虽然查出来了，但实际上跟 [reqStart, reqEnd] 完全没有交集的边缘数据
			if (tripEnd < reqStart || tripStart > reqEnd) {
				continue;
			}

			// 只保留 day 和 day_title，剔除 activities 等大体积数据
			const simpleItinerary = order.itinerary
				? order.itinerary.map((day) => ({
						day: day.day,
						day_title: day.day_title
				  }))
				: [];

			// 构造占用条目信息
			const occupancyItem = {
				_id: order._id,
				order_id: order.order_id,
				title: order.title,
				start: tripStart,
				end: tripEnd,
				total_days: order.total_days,
				itinerary: simpleItinerary,
				staves: order.staves || [],
				vehicle_id: order.vehicle_id,
				travel_users: order.travel_users,
				rank: order.rank,
				sales_name: salesMap[order.order_id] || '',
				customer_remarks: customerRemarksMap[order.order_id] || '',
				custom_display_text: order.custom_display_text,
				custom_color: order.custom_color,
				manual_markers: order.manual_markers || {},
				raw_data: rawData
			};

			let hasGuide = false;
			let hasAttendant = false;

			// A. 处理司导 (Guides) - 遍历 staves 数组
			if (order.staves) {
				order.staves.forEach((staff) => {
					if ((staff.role.includes('guide') || staff.role === 'guide') && staff.id) {
						hasGuide = true;
						if (!guideOccupancy[staff.id]) {
							guideOccupancy[staff.id] = [];
						}
						guideOccupancy[staff.id].push(occupancyItem);
					}

					if ((staff.role.includes('attendant') || staff.role === 'attendant') && staff.id) {
						hasAttendant = true;
						if (!attendantOccupancy[staff.id]) attendantOccupancy[staff.id] = [];
						attendantOccupancy[staff.id].push(occupancyItem);
					}
				});
			}

			if (!hasGuide) {
				unassignedGuide.push(occupancyItem);
			}
			if (!hasAttendant) {
				unassignedAttendant.push(occupancyItem);
			}

			// B. 处理车辆 (Vehicles)
			if (order.vehicle_id) {
				if (!vehicleOccupancy[order.vehicle_id]) {
					vehicleOccupancy[order.vehicle_id] = [];
				}
				vehicleOccupancy[order.vehicle_id].push(occupancyItem);
			}
		}
		// console.log('guides: ', guideOccupancy);
		// console.log('attendants: ', attendantOccupancy);
		// console.log('vehicles: ', vehicleOccupancy);
		// console.log(
		// 	'unassignedGuide: ',
		// 	unassignedGuide.map((item) => item.order_id)
		// );
		// console.log(
		// 	'unassignedAttendant: ',
		// 	unassignedAttendant.map((item) => item.order_id)
		// );

		return {
			code: 0,
			data: {
				guides: guideOccupancy,
				attendants: attendantOccupancy,
				salesMap: salesMap,
				vehicles: vehicleOccupancy,
				unassignedGuide: unassignedGuide,
				unassignedAttendant: unassignedAttendant,
				debug_order_count: orders.length
			}
		};
	},

	/**
	 * 更新订单人员信息
	 * 仅处理 Guide 的更新，Attendant 已移交 RPA 处理
	 */
	async updateOrderStaff(params) {
		const { snapshot_id, guide_info } = params;

		if (!snapshot_id) return { code: -1, msg: 'Missing ID' };

		// 1. 获取当前快照中的 staves
		const snapRes = await db.collection('a-snapshots').doc(snapshot_id).get();
		if (!snapRes.data || snapRes.data.length === 0) {
			return { code: -1, msg: 'Snapshot not found' };
		}

		const snapshot = snapRes.data[0];
		let staves = snapshot.staves || [];
		let customText = snapshot.custom_display_text || '';

		// 2. 如果传入了私导信息，进行更新
		if (guide_info && guide_info.id) {
			if (customText) {
				// 找到旧的私导名字
				const oldGuide = staves.find((s) => s.role === 'guide' || (Array.isArray(s.role) && s.role.includes('guide')));
				const oldName = oldGuide ? oldGuide.nickname || oldGuide.name : '';
				const newName = guide_info.nickname;

				if (newName && newName !== oldName) {
					const parts = customText.split('##');
					const updatedParts = parts.map((p) => {
						if (oldName && p.includes(oldName)) {
							return p.split(oldName).join(newName);
						} else if (!p.includes(newName)) {
							return p + ' | ' + newName;
						}
						return p;
					});
					customText = updatedParts.join('##');
				}
			}

			// 先移除旧的 guide
			staves = staves.filter((s) => s.role !== 'guide' && !s.role.includes('guide'));

			// 推入新的 guide (包含完整信息)
			staves.push({
				id: guide_info.id,
				role: ['guide'],
				nickname: guide_info.nickname,
				mobile: guide_info.mobile
			});

			// === 同步更新相册成员 ===
			const orderId = snapshot.order_id;
			if (orderId) {
				try {
					const albumRes = await db.collection('a-group-albums').where({ order_id: orderId }).limit(1).get();
					if (albumRes.data && albumRes.data.length > 0) {
						const album = albumRes.data[0];
						let members = album.members || [];

						// 检查该私导是否已经在相册成员中
						const isExist = members.some((m) => m.id === guide_info.id);

						if (!isExist) {
							members.push({
								id: guide_info.id,
								mobile: guide_info.mobile
							});
							await db.collection('a-group-albums').doc(album._id).update({
								members: members
							});
						}
					}
				} catch (e) {
					console.error('自动同步相册成员失败', e);
					// 不阻断主流程
				}
			}
		}

		// 3. 更新数据库
		await db.collection('a-snapshots').doc(snapshot_id).update({
			staves: staves,
			custom_display_text: customText,
			updated_at: Date.now()
		});

		return { code: 0, msg: '分配私导成功' };
	},

	/**
	 * 更新订单自定义颜色
	 */
	async updateOrderColor(params) {
		const { order_id, color } = params;
		if (!order_id) return { code: -1, msg: '缺少订单号' };

		const res = await db.collection('a-snapshots').where({ order_id: order_id }).update({
			custom_color: color,
			updated_at: Date.now()
		});

		return { code: 0, msg: '颜色更新成功', updated: res.updated };
	},

	/**
	 * 更新订单的大盘自定义显示文字
	 */
	async updateOrderCustomText(params) {
		const { order_id, text } = params;
		if (!order_id) return { code: -1, msg: '缺少订单号' };

		// 使用 update 而不是 set，只更新指定字段
		const res = await db.collection('a-snapshots').where({ order_id: order_id }).update({
			custom_display_text: text,
			updated_at: Date.now()
		});

		return { code: 0, msg: '更新成功', updated: res.updated };
	},

	/**
	 * 更新订单的手动标记 (接/送/布)
	 */
	async updateOrderManualMarkers(params) {
		const { order_id, markers } = params;
		if (!order_id) return { code: -1, msg: '缺少订单号' };

		// 使用 update 更新 manual_markers 字段
		const res = await db.collection('a-snapshots').where({ order_id: order_id }).update({
			manual_markers: markers,
			updated_at: Date.now()
		});

		return { code: 0, msg: '更新标记成功', updated: res.updated };
	},

	/**
	 * 获取考核评分数据 (Debug版)
	 * @param {Object} params
	 * @param {String} params.role guide/sale/attendant
	 * @param {String} params.target_id 特定ID（可选）
	 */
	async getAssessmentData(params) {
		console.log('【DEBUG】考核计算开始, 参数:', params);
		const { role = 'guide', target_id } = params;

		// 1. 获取全局考核配置
		const configRes = await db.collection('a-management-configs').doc('GLOBAL_CONFIG').get();
		const globalConfig = configRes.data[0] || {};
		const config = globalConfig.assessment_configs?.[role];
		const benchmarks = globalConfig.benchmarks || {};

		console.log('【DEBUG】基准值配置 (Benchmarks):', JSON.stringify(benchmarks));

		if (!config || !config.dimensions || config.dimensions.length === 0) {
			console.error('【考核计算】错误: 未找到考核配置或维度为空');
			// return { errCode: 'NO_CONFIG', errMsg: '未配置考核规则' };
			return;
		}

		// 2. 确定查询的用户范围
		let userQuery = { role: role, status: 0 };
		if (target_id) userQuery._id = target_id;

		const usersRes = await db.collection('uni-id-users').where(userQuery).field({ _id: 1, nickname: 1, username: 1, mobile: 1, avatar: 1, avatar_file: 1 }).limit(100).get();

		const validUsers = usersRes.data;
		if (validUsers.length === 0) return { data: target_id ? null : [] };

		const validUserIds = validUsers.map((u) => u._id);
		let profiles = [];

		// 3. 预处理档案数据
		let profilesMap = {};
		let profileCollection = role === 'guide' ? 'b-guide-profiles' : role === 'sale' ? 'b-sale-profiles' : role === 'attendant' ? 'b-attendant-profiles' : null;

		if (profileCollection) {
			const profilesRes = await db
				.collection(profileCollection)
				.where({ user_id: dbCmd.in(validUserIds) })
				.get();
			profilesRes.data.forEach((p) => {
				profilesMap[p.user_id] = p;
			});
		}

		profiles = validUsers.map((user) => {
			const profile = profilesMap[user._id] || {};
			return {
				user_id: user._id,
				real_name: profile.real_name || user.nickname || user.username || '未命名',
				mobile: profile.mobile || user.mobile,
				personal_photo: profile.personal_photo || user.avatar_file?.url || user.avatar,
				stats: profile.stats || {}
			};
		});

		// 4. 批量获取业务数据
		const maxDays = Math.max(...config.dimensions.map((d) => d.period_days || 30), 30);
		const now = Date.now();
		const earliestDate = now - maxDays * 24 * 60 * 60 * 1000;

		let globalAttendantTotalGroups = 1;
		if (role === 'attendant') {
			const globalGroupRes = await db
				.collection('a-snapshots')
				.where({
					departure_date: dbCmd.gte(earliestDate),
					'staves.role': 'attendant'
				})
				.count();
			globalAttendantTotalGroups = globalGroupRes.total || 1;
			console.log('【DEBUG】所有管家接团总数 (用于NPS数量分):', globalAttendantTotalGroups);
		}

		const results = [];

		for (const profile of profiles) {
			console.log(`\n>>> 【DEBUG】正在计算用户: ${profile.real_name} (${role})`);
			console.log(`>>> 【DEBUG】档案统计数据 (Stats):`, JSON.stringify(profile.stats));

			// --- 数据准备阶段 ---
			let rawData = {};

			if (role === 'guide') {
				const ordersRes = await db
					.collection('a-snapshots')
					.where({ 'staves.id': profile.user_id, departure_date: dbCmd.gte(earliestDate) })
					.field({ _id: 1, departure_date: 1, itinerary: 1 })
					.get();

				const reviewsRes = await db
					.collection('a-reviews')
					.where({ guide_name: profile.real_name, created_at: dbCmd.gte(new Date(earliestDate).toISOString()) })
					.get();

				const orderIds = ordersRes.data.map((o) => o._id);
				let albumsCount = 0;
				if (orderIds.length > 0) {
					const albRes = await db
						.collection('a-group-albums')
						.where({ order_id: dbCmd.in(orderIds) })
						.count();
					albumsCount = albRes.total;
				}

				rawData = { orders: ordersRes.data, reviews: reviewsRes.data, albumsCount };
				console.log(`>>> 【DEBUG】原始数据 - 订单数: ${rawData.orders.length}, 评价数: ${rawData.reviews.length}, 相册数: ${albumsCount}`);
			} else if (role === 'sale') {
				const custRes = await db
					.collection('a-customers')
					.where({
						sales_id: profile.user_id,
						created_at: dbCmd.gte(earliestDate)
					})
					.get();

				const customers = custRes.data;
				const dealOrderIds = customers.filter((c) => c.status === 'deal' && c.order_id).map((c) => c.order_id);

				let orderAmountMap = {};
				if (dealOrderIds.length > 0) {
					const amountRes = await db
						.collection('a-snapshots')
						.where({ order_id: dbCmd.in(dealOrderIds) })
						.field({ order_id: 1, final_amount: 1 })
						.get();
					amountRes.data.forEach((o) => (orderAmountMap[o.order_id] = o.final_amount || 0));
				}

				rawData = { customers, orderAmountMap };
				console.log(`>>> 【DEBUG】原始数据 - 客户总数: ${customers.length}, 成交订单数: ${dealOrderIds.length}`);
				console.log(`>>> 【DEBUG】订单金额Map预览:`, JSON.stringify(orderAmountMap));
			} else if (role === 'attendant') {
				const attOrdersRes = await db
					.collection('a-snapshots')
					.where({
						'staves.id': profile.user_id,
						'staves.role': 'attendant',
						departure_date: dbCmd.gte(earliestDate)
					})
					.field({ _id: 1, order_id: 1 })
					.get();

				const attOrderIds = attOrdersRes.data.map((o) => o.order_id).filter((id) => id);

				let attCustomers = [];
				if (attOrderIds.length > 0) {
					const attCustRes = await db
						.collection('a-customers')
						.where(dbCmd.or([{ attendant_id: profile.user_id, created_at: dbCmd.gte(earliestDate) }, { order_id: dbCmd.in(attOrderIds) }]))
						.field({ review: 1, status: 1 })
						.get();
					attCustomers = attCustRes.data;
				}

				rawData = {
					orders: attOrdersRes.data,
					customers: attCustomers
				};
			}

			// --- 维度计算阶段 ---
			const dimensionScores = [];
			let totalScore = 0;

			for (const dim of config.dimensions) {
				console.log(`\n  --- 【DEBUG】计算维度: ${dim.name} (${dim.key}) ---`);

				const dimTimeLimit = now - (dim.period_days || 30) * 24 * 60 * 60 * 1000;
				let metrics = {};

				if (role === 'guide') {
					const dimOrders = rawData.orders.filter((o) => o.departure_date >= dimTimeLimit);
					const dimReviews = rawData.reviews.filter((r) => new Date(r.created_at).getTime() >= dimTimeLimit);

					// 所有的计算步骤
					const order_count = dimOrders.length;
					const service_days = dimOrders.reduce((sum, o) => sum + (o.itinerary?.length || 0), 0);
					const rating_sum = dimReviews.reduce((sum, r) => sum + r.rating, 0);
					const rating_avg = dimReviews.length > 0 ? rating_sum / dimReviews.length : 5;

					console.log(`  [数值] 周期内订单: ${order_count}, 服务天数: ${service_days}, 评分均值: ${rating_avg}`);

					metrics = {
						order_count,
						service_days,
						review_count: dimReviews.length,
						rating_avg,
						rating_5_star: dimReviews.filter((r) => r.rating >= 5).length,
						rating_bad: dimReviews.filter((r) => r.rating <= 3).length,
						photo_standard_pct: dimOrders.length > 0 ? Math.round((rawData.albumsCount / dimOrders.length) * 100) : 0,
						// 手动数据
						rejected_orders: profile.stats.rejected_orders || 0,
						cancelled_orders: profile.stats.cancelled_orders || 0,
						lateness_count: profile.stats.lateness_count || 0,
						service_errors: profile.stats.service_errors || 0,
						accounting_delays: profile.stats.accounting_delays || 0,
						minor_violations: profile.stats.minor_violations || 0,
						serious_violations: profile.stats.serious_violations || 0,
						photo_quality_score: profile.stats.photo_quality_score || 0,
						video_quality_score: profile.stats.video_quality_score || 0,
						promo_materials: profile.stats.promo_materials || 0
					};
				} else if (role === 'sale') {
					const dimCustomers = rawData.customers.filter((c) => {
						const t = c.reception_time || c.created_at;
						return t >= dimTimeLimit && t <= now;
					});

					console.log(`  [数值] 周期内有效客户数: ${dimCustomers.length}`);

					const isCtrip = (src) => ['携程定制', '携程私家团'].includes(src);
					const isDeal = (c) => c.status === 'deal';

					const ctripCusts = dimCustomers.filter((c) => isCtrip(c.source));
					const otherCusts = dimCustomers.filter((c) => !isCtrip(c.source));

					let sales_amount_ctrip = 0;
					let sales_amount_other = 0;

					ctripCusts.forEach((c) => {
						if (isDeal(c)) {
							const amt = rawData.orderAmountMap[c.order_id] || 0;
							sales_amount_ctrip += amt;
							// console.log(`    -> 携程成交: ${c.nickname} 金额: ${amt}`);
						}
					});
					otherCusts.forEach((c) => {
						if (isDeal(c)) {
							const amt = rawData.orderAmountMap[c.order_id] || 0;
							sales_amount_other += amt;
							// console.log(`    -> 其它成交: ${c.nickname} 金额: ${amt}`);
						}
					});

					const conversion_rate_ctrip = ctripCusts.length > 0 ? (ctripCusts.filter(isDeal).length / ctripCusts.length) * 100 : 0;
					const conversion_rate_other = otherCusts.length > 0 ? (otherCusts.filter(isDeal).length / otherCusts.length) * 100 : 0;

					console.log(`  [数值] 携程: 总客${ctripCusts.length}/成交${ctripCusts.filter(isDeal).length}/金额${sales_amount_ctrip}/转化${conversion_rate_ctrip.toFixed(1)}%`);
					console.log(`  [数值] 其它: 总客${otherCusts.length}/成交${otherCusts.filter(isDeal).length}/金额${sales_amount_other}/转化${conversion_rate_other.toFixed(1)}%`);

					const potentialCusts = dimCustomers.filter((c) => ['new', 'following'].includes(c.status));
					const followedCusts = potentialCusts.filter((c) => c.follow_up && c.follow_up.length > 0);
					const follow_up_rate = potentialCusts.length > 0 ? (followedCusts.length / potentialCusts.length) * 100 : 100;

					console.log(`  [数值] 跟进率: 分子${followedCusts.length} / 分母${potentialCusts.length} = ${follow_up_rate.toFixed(1)}%`);

					const ratedCusts = dimCustomers.filter((c) => c.sales_score > 0);
					const satisfaction_avg = ratedCusts.length > 0 ? ratedCusts.reduce((sum, c) => sum + c.sales_score, 0) / ratedCusts.length : 10;

					const repurchase_rate = dimCustomers.length > 0 ? (dimCustomers.filter((c) => c.source === '复购').length / dimCustomers.length) * 100 : 0;
					const referral_rate = dimCustomers.length > 0 ? (dimCustomers.filter((c) => c.source === '转介绍').length / dimCustomers.length) * 100 : 0;
					const long_term_count = dimCustomers.filter((c) => isDeal(c) && c.source === '复购').length;

					metrics = {
						_sales_ctrip: sales_amount_ctrip,
						_sales_other: sales_amount_other,
						_rate_ctrip: conversion_rate_ctrip,
						_rate_other: conversion_rate_other,
						sales_amount: sales_amount_ctrip + sales_amount_other,
						conversion_rate: dimCustomers.length > 0 ? (dimCustomers.filter(isDeal).length / dimCustomers.length) * 100 : 0,
						follow_up_rate,
						satisfaction_avg,
						repurchase_rate,
						referral_rate,
						long_term_count,
						complaint_count: profile.stats.complaint_count || 0,
						response_violation_count: profile.stats.response_violation_count || 0,
						data_entry_error_count: profile.stats.data_entry_error_count || 0,
						workflow_violation_count: profile.stats.workflow_violation_count || 0,
						team_violation_count: profile.stats.team_violation_count || 0
					};
				} else if (role === 'attendant') {
					// --- 管家的 metrics 映射逻辑 ---
					// 管家的数据主要来自 profile.stats (手动录入)，没有复杂的实时聚合
					const s = profile.stats || {};

					// --- NPS计算逻辑---
					// Formula: NPS = (ReviewRateScore * 0.3) + (TotalReviewScore * 0.5) + (QuantityScore * 0.2)
					const myGroupCount = rawData.orders ? rawData.orders.length : 0;
					const myCustomers = rawData.customers || [];

					// 1. Review Rate Score: (Non-bad Reviews / Total Attended Groups) * 100
					const validReviews = myCustomers.filter((c) => c.review && c.review !== 'bad');
					const reviewCount = validReviews.length;

					let reviewRateScore = 0;
					if (myGroupCount > 0) {
						reviewRateScore = (reviewCount / myGroupCount) * 100;
					}

					// 2. Total Review Score
					// good_pic_recommend * 3 + (good_nopic_recommend + good_pic) * 2 + (good_nopic + ok_recommend) * 1
					let totalReviewScoreRaw = 0;
					myCustomers.forEach((c) => {
						if (c.review === 'good_pic_recommend') totalReviewScoreRaw += 3;
						else if (['good_nopic_recommend', 'good_pic'].includes(c.review)) totalReviewScoreRaw += 2;
						else if (['good_nopic', 'ok_recommend'].includes(c.review)) totalReviewScoreRaw += 1;
					});

					// 3. Quantity Score: (My Groups / Global Groups) * 100
					const quantityScore = (myGroupCount / globalAttendantTotalGroups) * 100;

					// Final NPS
					const nps_score = reviewRateScore * 0.3 + totalReviewScoreRaw * 0.5 + quantityScore * 0.2;

					console.log(`  [NPS计算] 接团:${myGroupCount}, 有效点评:${reviewCount}, 全网总团:${globalAttendantTotalGroups}`);
					console.log(`  [NPS细节] 点评率分:${reviewRateScore.toFixed(1)} * 0.3, 点评得分:${totalReviewScoreRaw} * 0.5, 数量分:${quantityScore.toFixed(1)} * 0.2`);
					console.log(`  [NPS结果] ${nps_score.toFixed(2)}`);

					metrics = {
						nps_score: parseFloat(nps_score.toFixed(1)),
						detractor_count: s.detractor_count || 0,
						praise_count: s.praise_count || 0,
						l2_complaint_count: s.l2_complaint_count || 0,
						major_error_count: s.major_error_count || 0,
						startup_delay_count: s.startup_delay_count || 0,
						driver_dispatch_fail_count: s.driver_dispatch_fail_count || 0,
						response_fail_count: s.response_fail_count || 0,
						response_mishandle_count: s.response_mishandle_count || 0,
						booking_error_count: s.booking_error_count || 0,
						audit_delay_count: s.audit_delay_count || 0,
						cost_correction_count: s.cost_correction_count || 0,
						shirking_complaint_count: s.shirking_complaint_count || 0,
						assist_colleague_count: s.assist_colleague_count || 0,
						mentor_count: s.mentor_count || 0,
						resource_maintenance_delay_count: s.resource_maintenance_delay_count || 0,
						knowledge_share_count: s.knowledge_share_count || 0
					};
					console.log(`  [数值] 管家数据加载: 好评${metrics.praise_count}, 客诉${metrics.l2_complaint_count}, 失误${metrics.major_error_count}`);
				}

				// --- 规则应用 ---
				let currentScore = dim.default_score || 0;
				const dimRules = config.rules.filter((r) => r.dimension_key === dim.key);
				const logs = [];

				for (const rule of dimRules) {
					const baseScore = rule.score_change || 0;
					const stepRate = rule.bonus_step_rate || 0;
					const stepScore = rule.bonus_step_score || 0;

					// 1. 销售额逻辑
					if (role === 'sale' && rule.item_code === 'sales_amount') {
						const targetCtrip = benchmarks.sales_target_ctrip || 100000;
						const targetOther = benchmarks.sales_target_other || 50000;
						const totalTarget = targetCtrip + targetOther;
						const targetCtripPercentage = targetCtrip / totalTarget;
						const targetOtherPercentage = targetOther / totalTarget;

						const totalActual = metrics._sales_ctrip + metrics._sales_other;
						const ratio = totalTarget > 0 ? totalActual / totalTarget : 0;

						const ctripExcess = metrics._sales_ctrip - targetCtrip;
						const otherExcess = metrics._sales_other - targetOther;
						const avgExcessPercentage = ctripExcess * targetCtripPercentage + otherExcess * targetOtherPercentage;

						console.log(`    [规则:销售额] 目标: ${totalTarget} (携程${targetCtrip}+其它${targetOther}), 实际: ${totalActual}, 完成率: ${ratio.toFixed(2)}`);

						let score = 0;
						let desc = '';
						if (ratio < 1) {
							score = baseScore * ratio;
							desc = `未达标, 完成率${(ratio * 100).toFixed(1)}%`;
						} else {
							let bonusPoints = 0;
							if (stepRate > 0 && stepScore > 0) {
								bonusPoints = Math.floor(avgExcessPercentage / stepRate) * stepScore;
							}
							score = baseScore + bonusPoints;
							desc = `已达标, 超出${(avgExcessPercentage * 100).toFixed(1)}%`;
						}
						if (rule.max_limit && score > rule.max_limit) {
							score = rule.max_limit;
							desc += '(封顶)';
						}
						console.log(`      -> 得分变动: +${score.toFixed(1)}`);
						currentScore += score;
						logs.push({ text: `[销售额] ${desc}`, delta: parseFloat(score.toFixed(1)) });
						continue;
					}

					// 2. 转化率逻辑
					if (role === 'sale' && rule.item_code === 'conversion_rate') {
						const targetCtrip = benchmarks.conversion_rate_ctrip || 35;
						const targetOther = benchmarks.conversion_rate_other || 20;
						const totalTarget = targetCtrip + targetOther;
						const targetCtripPercentage = targetCtrip / totalTarget;
						const targetOtherPercentage = targetOther / totalTarget;

						const ratioCtrip = targetCtrip > 0 ? metrics._rate_ctrip / targetCtrip : 0;
						const ratioOther = targetOther > 0 ? metrics._rate_other / targetOther : 0;
						// const avgRatio = (ratioCtrip + ratioOther) / 2;
						const avgRatio = ratioCtrip * targetCtripPercentage + ratioOther * targetOtherPercentage;

						const ctripExcess = metrics._rate_ctrip - targetCtrip;
						const otherExcess = metrics._rate_other - targetOther;
						const avgExcess = ctripExcess * targetCtripPercentage + otherExcess * targetOtherPercentage;

						console.log(
							`    [规则:转化率] 携程目标${targetCtrip}%(实${metrics._rate_ctrip.toFixed(1)}%), 其它目标${targetOther}%(实${metrics._rate_other.toFixed(
								1
							)}%), 综合比率: ${avgRatio.toFixed(2)}`
						);

						let score = 0;
						let desc = '';
						if (avgRatio < 1) {
							score = baseScore * avgRatio;
							desc = `综合完成率${(avgRatio * 100).toFixed(1)}%`;
						} else {
							let bonusPoints = 0;
							if (stepRate > 0 && stepScore > 0 && avgExcess > 0) {
								bonusPoints = Math.floor(avgExcess / stepRate) * stepScore;
							}
							score = baseScore + bonusPoints;
							if (rule.max_limit && score > rule.max_limit) score = rule.max_limit;
							desc = `综合超额${avgExcess.toFixed(1)}%`;
						}
						if (rule.max_limit && score > rule.max_limit) {
							score = rule.max_limit;
							desc += '(封顶)';
						}
						console.log(`      -> 得分变动: +${score.toFixed(1)}`);
						currentScore += score;
						logs.push({ text: `[转化率] ${desc}`, delta: parseFloat(score.toFixed(1)) });
						continue;
					}

					// 3. 通用基准计算
					const BENCHMARK_DEF = {
						follow_up_rate: { targetKey: 'follow_up_rate', default: 100, label: '跟进率' },
						satisfaction_avg: { targetKey: 'satisfaction_target', default: 90, label: '满意度', isScore: true },
						repurchase_rate: { targetKey: 'repurchase_rate', default: 15, label: '回购率' },
						referral_rate: { targetKey: 'referral_rate', default: 10, label: '转介绍率' },
						long_term_count: { targetKey: 'long_term_count', default: 10, label: '长期客户', unit: '个' },
						nps_score: { targetKey: 'nps_target', default: 40, label: 'NPS评分' }
					};

					if ((role === 'sale' || role === 'attendant') && rule.use_benchmark && BENCHMARK_DEF[rule.item_code]) {
						const def = BENCHMARK_DEF[rule.item_code];
						const targetVal = benchmarks[def.targetKey] || def.default;
						let actualVal = metrics[rule.item_code] || 0;
						if (def.isScore) actualVal = (actualVal / 10) * 100;

						const missing = targetVal - actualVal;
						console.log(`    [规则:基准-${def.label}] 目标: ${targetVal}, 实际: ${actualVal.toFixed(1)}, 缺失: ${missing.toFixed(1)}`);

						let score = 0;
						let desc = '';
						if (missing <= 0) {
							score = baseScore;
							desc = `达标 (实际${actualVal.toFixed(1)} >= 目标${targetVal})`;
						} else {
							if (stepRate > 0) {
								const penaltyCount = Math.floor(missing / stepRate);
								const penaltyTotal = penaltyCount * stepScore;
								score = baseScore - penaltyTotal;
								if (score < 0) score = 0;
								const unit = def.unit || '%';
								desc = `${def.label}缺失${missing.toFixed(1)}${unit}, 扣${penaltyTotal}分`;
							} else {
								score = baseScore;
							}
						}
						console.log(`      -> 得分变动: +${score.toFixed(1)} (基础分: ${baseScore})`);
						currentScore += score;
						logs.push({ text: `[${def.label}] ${desc}`, delta: parseFloat(score.toFixed(1)) });
						continue;
					}

					// 4. 普通规则
					const val = metrics[rule.item_code];
					const checkVal = val !== undefined ? val : 0;
					const threshold = rule.threshold;
					let matched = false;

					switch (rule.operator) {
						case 'gt':
							matched = checkVal > threshold;
							break;
						case 'gte':
							matched = checkVal >= threshold;
							break;
						case 'eq':
							matched = checkVal == threshold;
							break;
						case 'lt':
							matched = checkVal < threshold;
							break;
						case 'lte':
							matched = checkVal <= threshold;
							break;
						case 'per':
							if (checkVal > 0) {
								const count = Math.floor(checkVal / (threshold || 1));
								if (count > 0) {
									const delta = count * rule.score_change;
									currentScore += delta;
									logs.push({ text: `每${threshold}个${rule.item_code}(共${checkVal})`, delta });
									console.log(`    [规则:计数] Item: ${rule.item_code}, 数量: ${checkVal}, 阈值: ${threshold}, 变动: ${delta}`);
								}
							}
							break;
					}

					if (matched && rule.operator !== 'per') {
						currentScore += rule.score_change;
						logs.push({ text: `${rule.item_code} ${rule.operator} ${threshold}`, delta: rule.score_change });
						console.log(`    [规则:触发] Item: ${rule.item_code} (${checkVal}) ${rule.operator} ${threshold}, 变动: ${rule.score_change}`);
					}
				}

				if (dim.max_score !== null && currentScore > dim.max_score) currentScore = dim.max_score;
				if (dim.min_limit !== null && currentScore < dim.min_limit) currentScore = dim.min_limit;
				if (currentScore < 0) currentScore = 0;

				console.log(`  [维度结果] ${dim.name} 最终得分: ${currentScore}, 权重后得分: ${(currentScore * (dim.weight / 100)).toFixed(1)}`);

				dimensionScores.push({
					key: dim.key,
					name: dim.name,
					weight: dim.weight,
					score: parseFloat(currentScore.toFixed(1)),
					weighted_score: parseFloat((currentScore * (dim.weight / 100)).toFixed(1)),
					metrics: metrics,
					logs: logs
				});

				totalScore += currentScore * (dim.weight / 100);
			}

			const finalScore = parseFloat(totalScore.toFixed(1));
			console.log(`>>> 【DEBUG】用户 ${profile.real_name} 总分: ${finalScore}`);

			results.push({
				user_id: profile.user_id,
				real_name: profile.real_name,
				mobile: profile.mobile,
				avatar: profile.personal_photo,
				dimensions: dimensionScores,
				total_score: finalScore,
				rank_level: finalScore >= 85 ? 'A' : finalScore >= 65 ? 'B' : 'C'
			});
		}

		return { data: target_id ? results[0] : results };
	},

	/**
	 * 考核归档：将当期计算的分数存入历史表
	 * @param {Object} params
	 * @param {String} params.period 周期标识，如 "2023-10"
	 * @param {String} params.role   (可选) 指定归档角色，不传则归档所有
	 */
	async archiveAssessment(params) {
		const { period } = params;
		if (!period) return { errCode: 'PARAM_ERROR', errMsg: '缺少周期参数 period' };

		const roles = params.role ? [params.role] : ['guide', 'sale', 'attendant'];
		let totalArchived = 0;

		for (const role of roles) {
			// 1. 调用现有的实时计算逻辑
			const res = await operationCenter.getAssessmentData({ role });
			const list = res.data;

			if (!list || list.length === 0) continue;

			// 2. 排序并计算排名
			// 按 total_score 降序
			list.sort((a, b) => b.total_score - a.total_score);

			// 3. 准备批量写入的数据
			const historyItems = list.map((item, index) => {
				return {
					period: period,
					role: role,
					user_id: item.user_id,
					real_name: item.real_name,
					total_score: item.total_score,
					rank: index + 1, // 排名
					// 仅保存维度分数的快照，不保存详细 logs，节省空间
					dimensions: item.dimensions.map((d) => ({
						key: d.key,
						name: d.name,
						score: d.score
					})),
					created_at: Date.now()
				};
			});

			// 4. 写入数据库 (先删旧数据，防止重复归档)
			await db
				.collection('a-assessment-history')
				.where({
					period: period,
					role: role
				})
				.remove();

			if (historyItems.length > 0) {
				await db.collection('a-assessment-history').add(historyItems);
			}
			totalArchived += historyItems.length;
		}

		return { code: 0, msg: `归档完成，共处理 ${totalArchived} 条数据` };
	},

	/**
	 * 获取排名趋势
	 * @param {Object} params
	 * @param {String} params.user_id
	 * @param {String} params.role
	 * @param {Number} params.limit 获取最近几期，默认6
	 */
	async getRankTrend(params) {
		const { user_id, role, limit = 6 } = params;

		const res = await db
			.collection('a-assessment-history')
			.where({
				user_id: user_id,
				role: role
			})
			.orderBy('period', 'asc') // 按时间正序，方便前端画折线图
			.limit(limit)
			.get();

		return {
			code: 0,
			data: res.data.map((item) => ({
				period: item.period,
				rank: item.rank,
				total_score: item.total_score
			}))
		};
	},

	/**
	 * 获取可分配的人员列表 (含状态检测 & 当月统计)
	 * @param {Object} params
	 * @param {String} params.role 角色 'guide' | 'attendant'
	 * @param {Number} params.startTime 订单开始时间戳
	 * @param {Number} params.totalDays 订单天数
	 * @param {String} params.excludeOrderId 排除的订单ID (用于编辑时排除自己)
	 */
	async getAssignableList(params) {
		const { role, startTime, totalDays, excludeOrderId } = params;

		// 1. 时间计算
		// A. 冲突检测时间段 (当前订单时间)
		const checkStart = startTime;
		const checkEnd = startTime + (totalDays || 1) * 24 * 3600 * 1000;

		// B. 统计时间段：以【结束日期】为基准
		const orderEndTime = startTime + (totalDays || 1) * 24 * 3600 * 1000;
		const d = new Date(orderEndTime - 1000); // 减1秒取实际结束当天
		const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
		const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();

		// 2. 获取人员基础信息 & 档案
		const usersRes = await db.collection('uni-id-users').where({ role: role, status: 0 }).field({ _id: 1, nickname: 1, username: 1, mobile: 1 }).get();

		const users = usersRes.data;
		const userIds = users.map((u) => u._id);

		// 获取档案 (包含 Rank 和 Score)
		const profileColl = role === 'guide' ? 'b-guide-profiles' : 'b-attendant-profiles';
		const profilesRes = await db
			.collection(profileColl)
			.where({ user_id: dbCmd.in(userIds) })
			.field({ user_id: 1, real_name: 1, rank: 1, total_score: 1 })
			.get();

		const profileMap = {};
		profilesRes.data.forEach((p) => (profileMap[p.user_id] = p));

		// 3. 批量查询订单 (范围：覆盖整个月，用于统计；冲突检测是其子集)
		// 注意：departure_date 在 monthEnd 之前即可，结束时间在 monthStart 之后
		const ordersRes = await db
			.collection('a-snapshots')
			.where({
				'staves.role': role,
				departure_date: dbCmd.lte(monthEnd) // 出发时间早于月底
				// 实际还需要筛选“结束时间晚于月初”，这里先查出来再内存过滤，避免复杂索引
			})
			.field({ _id: 1, order_id: 1, departure_date: 1, total_days: 1, staves: 1 })
			.limit(2000)
			.get();

		// 4. 计算 冲突状态 & 月度统计
		const statusMap = {}; // { userId: { isBusy: false, conflictText: '' } }
		const statsMap = {}; // { userId: { groups: 0, days: 0 } }

		ordersRes.data.forEach((order) => {
			// 排除自身订单 (不计入冲突，也不计入"已有"负载，或者看业务需求，通常为了看余量应排除)
			if (excludeOrderId && order.order_id === excludeOrderId) return;

			const oStart = order.departure_date;
			const oDays = order.total_days || 1;
			const oEnd = oStart + oDays * 24 * 3600 * 1000;
			const oLastDay = oEnd - 1000;

			if (order.staves) {
				order.staves.forEach((staff) => {
					if (staff.role && (staff.role === role || staff.role.includes(role))) {
						const uid = staff.id;

						// --- A. 统计当月负载 ---
						if (oLastDay >= monthStart && oLastDay <= monthEnd) {
							// 只有结束在当月，才计入 statsMap
							order.staves?.forEach((staff) => {
								if (staff.role && (staff.role === role || staff.role.includes(role))) {
									const uid = staff.id;
									if (!statsMap[uid]) statsMap[uid] = { groups: 0, days: 0 };

									// 1. 团数：按出发时间统计 (oStart 在当月)
									if (oStart >= monthStart && oStart <= monthEnd) {
										statsMap[uid].groups += 1;
									}

									// 2. 天数：按结束时间结算 (oLastDay 在当月)
									if (oLastDay >= monthStart && oLastDay <= monthEnd) {
										const overlapStart = Math.max(oStart, monthStart);
										const overlapEnd = Math.min(oEnd, monthEnd);

										if (overlapEnd > overlapStart) {
											const days = Math.ceil((overlapEnd - overlapStart) / (24 * 3600 * 1000));
											statsMap[uid].days += days;
										}
									}
								}
							});
						}

						// --- B. 检测时间冲突 (针对当前订单) ---
						if (Math.max(oStart, checkStart) < Math.min(oEnd, checkEnd)) {
							// 有交集
							const sDate = new Date(oStart);
							const eDate = new Date(oEnd - 1000);
							const dateStr = `${sDate.getMonth() + 1}.${sDate.getDate()}-${eDate.getMonth() + 1}.${eDate.getDate()}`;

							// 记录最早的一个冲突即可，或者拼接
							if (!statusMap[uid]) {
								statusMap[uid] = { isBusy: true, conflictText: `带团中(${dateStr})` };
							}
						}
					}
				});
			}
		});

		// 5. 组装最终列表
		const list = users.map((u) => {
			const profile = profileMap[u._id] || {};
			const status = statusMap[u._id] || { isBusy: false, conflictText: '可接团' };
			const stats = statsMap[u._id] || { groups: 0, days: 0 };

			let rankLabel = '普通';
			if (profile.rank === 'excellent') rankLabel = '优秀';

			const realName = profile.real_name || u.nickname || u.username || '未命名';
			const score = profile.total_score || 0; // 评分

			// 核心修改：Label 格式
			// 格式：[优秀] 张三 (100分 | 3团 | 15天) - 可接团
			// 如果忙碌，conflictText 会显示 "带团中(1.1-1.5)"
			const statsText = `${score}分 | ${stats.groups}团 | ${stats.days}天`;
			const displayLabel = `[${rankLabel}] ${realName} (${statsText}) - ${status.conflictText}`;

			return {
				id: u._id,
				real_name: realName,
				rank: profile.rank || 'regular',
				rankLabel: rankLabel,
				score: score,
				groups: stats.groups,
				days: stats.days,
				isBusy: status.isBusy,
				statusText: status.conflictText,
				displayLabel: displayLabel
			};
		});

		// 6. 排序：不忙优先 > 优秀优先 > 评分高优先
		list.sort((a, b) => {
			if (a.isBusy !== b.isBusy) return a.isBusy ? 1 : -1; // 忙的沉底
			if (a.rank !== b.rank) return a.rank === 'excellent' ? -1 : 1; // 优秀的优先
			return b.score - a.score; // 评分降序
		});

		return { code: 0, data: list };
	},

	/**
	 * 获取销售数据大盘 (聚合查询)
	 * @param {Object} params
	 * @param {String} params.sales_id (可选) 指定销售ID
	 * @param {Number} params.startTime (可选)
	 * @param {Number} params.endTime   (可选)
	 * @param {String} params.channelStatus (可选) 'all'|'deal'|'lost' 渠道筛选
	 * @param {Number} params.heatmapStartTime (可选) 热力图专用开始时间
	 * @param {Number} params.heatmapEndTime (可选) 热力图专用结束时间
	 */
	async getSalesDashboardData(params) {
		console.log('【销售大盘】开始获取数据, 参数:', params);

		const { sales_id, startTime, endTime, channelStatus, heatmapStartTime, heatmapEndTime } = params;

		// 构造查询条件
		let matchStage = {};

		// 1. 时间过滤
		if (startTime && endTime) {
			matchStage = dbCmd.or([
				{ reception_time: dbCmd.gte(startTime).and(dbCmd.lte(endTime)) },
				{
					reception_time: dbCmd.exists(false),
					created_at: dbCmd.gte(startTime).and(dbCmd.lte(endTime))
				}
			]);
		}

		// 2. 销售人员过滤
		if (sales_id && sales_id !== 'all') {
			if (Object.keys(matchStage).length > 0) {
				matchStage = dbCmd.and(matchStage, { sales_id: sales_id });
			} else {
				matchStage = { sales_id: sales_id };
			}
		}

		// 查询数据
		const customersRes = await db.collection('a-customers').where(matchStage).limit(2000).get();

		const customers = customersRes.data;

		const dealOrderIds = customers.filter((c) => c.status === 'deal' && c.order_id).map((c) => c.order_id);

		// 建立 order_id -> final_amount 的映射表
		let priceMap = {};

		if (dealOrderIds.length > 0) {
			// 分批查询，防止 ID 太多超出限制 (虽然 limit 2000 一般还好，但为了稳健)
			const priceRes = await db
				.collection('a-snapshots')
				.where({
					order_id: dbCmd.in(dealOrderIds)
				})
				.field({ order_id: 1, final_amount: 1 })
				.limit(1000) // 假设一次最多查1000条成交
				.get();

			priceRes.data.forEach((p) => {
				priceMap[p.order_id] = p.final_amount || 0;
			});
		}

		// --- 初始化趋势数据容器 ---
		// Map: "2023-10-01" -> { sales: 0, deals: 0, total: 0, followups: 0 }
		const dailyStats = {};

		// 辅助函数：生成日期键
		const getDateKey = (ts) => {
			const d = new Date(ts);
			const month = (d.getMonth() + 1).toString().padStart(2, '0');
			const day = d.getDate().toString().padStart(2, '0');
			return `${month}-${day}`;
		};

		// 预填时间轴（保证图表连续，即是某天无数据也显示0）
		if (startTime && endTime) {
			let current = startTime;
			while (current <= endTime) {
				dailyStats[getDateKey(current)] = { sales: 0, deals: 0, total: 0, followups: 0 };
				current += 24 * 3600 * 1000;
			}
		}

		// --- A. KPI 计算 & 趋势聚合 ---
		let dealCount = 0;
		let totalSalesAmount = 0;
		let followUpCount = 0;

		customers.forEach((c) => {
			// 确定该客户归属的日期
			const ts = c.reception_time || c.created_at;
			const dateKey = getDateKey(ts);

			// 如果该日期不在预设范围内（比如稍微越界的边缘数据），初始化它
			if (!dailyStats[dateKey]) {
				dailyStats[dateKey] = { sales: 0, deals: 0, total: 0, followups: 0 };
			}

			const dayStat = dailyStats[dateKey];
			dayStat.total++; // 当日客资总数

			// 1. 销售额逻辑
			if (c.status === 'deal') {
				dealCount++;
				dayStat.deals++;
				let amount = 0;
				if (c.order_id && priceMap[c.order_id]) {
					amount = priceMap[c.order_id];
				}
				totalSalesAmount += amount;
				dayStat.sales += amount;
			}

			// 2. 跟进记录逻辑
			if (c.follow_up && Array.isArray(c.follow_up)) {
				const count = c.follow_up.length;
				followUpCount += count;
				dayStat.followups += count;
			}
		});

		const conversionRate = customers.length > 0 ? ((dealCount / customers.length) * 100).toFixed(1) : 0;

		// --- 生成趋势数组 (按日期排序) ---
		// Object.keys 可能会乱序，需手动排序 (MM-DD 格式可以直接字符串排序)
		const sortedKeys = Object.keys(dailyStats).sort();
		const trends = {
			dates: sortedKeys,
			sales: sortedKeys.map((k) => dailyStats[k].sales),
			// 转化率趋势：当日成交 / 当日客资数 (如果分母为0则为0)
			rates: sortedKeys.map((k) => (dailyStats[k].total > 0 ? Math.round((dailyStats[k].deals / dailyStats[k].total) * 100) : 0)),
			followups: sortedKeys.map((k) => dailyStats[k].followups)
		};

		// --- B. 渠道表现 ---
		const sourceStats = {};
		customers.forEach((c) => {
			// 筛选逻辑
			let include = true;
			if (channelStatus === 'deal') include = c.status === 'deal';
			else if (channelStatus === 'lost') include = c.status === 'lost';

			if (include) {
				const src = c.source || '未知';
				sourceStats[src] = (sourceStats[src] || 0) + 1;
			}
		});
		const channelData = Object.keys(sourceStats).map((k) => ({ name: k, value: sourceStats[k] }));

		// --- C. 转化漏斗 ---
		// 1. 先统计各状态的基础数量
		const statusCounts = { new: 0, following: 0, deal: 0, lost: 0 };

		customers.forEach((c) => {
			// 确保 status 存在，防止 undefined 报错
			const s = c.status || 'new';
			if (statusCounts[s] !== undefined) {
				statusCounts[s]++;
			}
		});

		// 2. 计算各层级逻辑
		// 假设 status 对应关系: 'new'=待分配, 'following'=跟进中, 'deal'=已成交, 'lost'=已流失

		const countPending = statusCounts['new']; // 待分配
		const countFollowing = statusCounts['following']; // 跟进中
		const countDeal = statusCounts['deal']; // 已成交
		const countLost = statusCounts['lost']; // 已流失

		// 总数 (所有查出来的客户)
		const totalCustomers = customers.length;

		// 层级 1: 咨询 (包含所有客户)
		const stage1_Consult = totalCustomers;

		// 层级 2: 意向 (总数 - 待分配) = (跟进中 + 成交 + 流失)
		const stage2_Intent = totalCustomers - countPending;

		// 层级 3: 成交
		const stage3_Deal = countDeal;

		// 层级 4: 流失
		const stage4_Lost = countLost;

		const funnelData = [
			{ name: '咨询', value: stage1_Consult },
			{ name: '意向', value: stage2_Intent },
			{ name: '成交', value: stage3_Deal },
			{ name: '流失', value: stage4_Lost }
		];

		// --- D. 散点图 ---
		const scoreGroups = {};
		customers.forEach((c) => {
			const score = c.sales_score || 0;
			if (score > 0) {
				if (!scoreGroups[score]) scoreGroups[score] = { total: 0, repurchase: 0 };
				scoreGroups[score].total++;
				if (c.source === '复购') {
					scoreGroups[score].repurchase++;
				}
			}
		});
		const scatterData = Object.keys(scoreGroups).map((score) => {
			const g = scoreGroups[score];
			return [parseInt(score), parseFloat((g.repurchase / g.total).toFixed(2)), g.total];
		});

		// --- E. 热力图 ---
		// 确定热力图的统计范围
		const hmStart = heatmapStartTime || startTime;
		const hmEnd = heatmapEndTime || endTime;

		const heatMapRaw = Array.from({ length: 7 }, () => Array(24).fill(0));
		customers.forEach((c) => {
			const ts = c.reception_time || c.created_at;

			// 增加时间范围判断
			if (ts && ts >= hmStart && ts <= hmEnd) {
				const d = new Date(ts);
				let dayIdx = d.getDay();
				dayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
				const hourIdx = d.getHours();
				if (dayIdx >= 0 && dayIdx <= 6 && hourIdx >= 0 && hourIdx <= 23) {
					heatMapRaw[dayIdx][hourIdx]++;
				}
			}
		});
		const heatMapData = [];
		for (let d = 0; d < 7; d++) {
			for (let h = 0; h < 24; h++) {
				heatMapData.push([h, d, heatMapRaw[d][h]]);
			}
		}

		return {
			code: 0,
			data: {
				kpi: {
					totalSalesAmount,
					conversionRate,
					followUpCount,
					trends
				},
				channelData,
				funnelData,
				scatterData,
				heatMapData
			}
		};
	},

	/**
	 * 获取指定日期的任务统计概览
	 * @param {Object} params
	 * @param {Number} params.dateTs 当天0点的时间戳
	 * @param {Array} params.agentIds 限定的管家ID列表（可选）
	 */
	async getDailyTaskOverview(params) {
		const { dateTs, agentIds } = params;
		const startOfDay = dateTs;
		const endOfDay = dateTs + 24 * 3600 * 1000 - 1;

		// 构造时间格式字符串用于查 a-task-queue (String类型) 和 a-task-logs (Timestamp或String需确认)
		// 假设 a-task-queue.send_time 是 "YYYY-MM-DD HH:mm:ss" 字符串
		const d = new Date(dateTs);
		// 注意时区，这里简单处理，实际建议用 dayjs 或手动修正
		const Y = d.getFullYear();
		const M = String(d.getMonth() + 1).padStart(2, '0');
		const D = String(d.getDate()).padStart(2, '0');
		const dateStr = `${Y}-${M}-${D}`; // "2025-01-01"

		// 1. 统计已执行任务 (a-task-logs)
		// actual_time 是 timestamp
		let logMatch = {
			actual_time: dbCmd.gte(startOfDay).and(dbCmd.lte(endOfDay))
		};
		if (agentIds && agentIds.length > 0) {
			logMatch.agent_id = dbCmd.in(agentIds);
		}
		const logRes = await db.collection('a-send-logs').where(logMatch).count();

		// 2. 统计待执行/执行中任务 (a-task-queue)
		// send_time 是 String，我们需要模糊匹配日期前缀
		// 或者 status 在 ['pending', 'failed', 'manual_stop'] 且 send_time 包含 dateStr
		// 为了准确，这里用正则匹配 send_time
		let queueMatch = {
			send_time: new RegExp(`^${dateStr}`), // 匹配当天
			status: dbCmd.in(['pending', 'manual_stop', 'failed']) // 未完成的
		};
		if (agentIds && agentIds.length > 0) {
			queueMatch.agent_id = dbCmd.in(agentIds);
		}
		const queueRes = await db.collection('a-task-queue').where(queueMatch).count();

		return {
			errCode: 0,
			data: {
				executed_count: logRes.total,
				pending_count: queueRes.total
			}
		};
	},

	/**
	 * 获取管家本月已结束订单统计 (Dashboard专用)
	 * 解决前端只加载部分排期导致无法统计完整月度历史数据的问题
	 * @param {Object} params
	 * @param {Number} params.dateTs 参考日期(通常是今天0点)
	 */
	async getAttendantMonthlyStats(params) {
		const { dateTs } = params;
		if (!dateTs) return { code: 0, data: { completed: 0 } };

		const todayStart = dateTs;
		const d = new Date(todayStart);
		// 当月1号 00:00:00
		const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();

		// 确定查询范围：
		// 我们要找的是“结束时间”在 [monthStart, todayStart] 之间的订单。
		// 数据库存的是 departure_date (出发时间)。
		// 为了不漏掉跨月订单，出发时间的查询下限需要向前推 (比如推60天，覆盖长线行程)
		const BUFFER_DAYS = 60 * 24 * 3600 * 1000;
		const queryStart = monthStart - BUFFER_DAYS;

		const res = await db
			.collection('a-snapshots')
			.where({
				departure_date: dbCmd.gte(queryStart).and(dbCmd.lte(todayStart)),
				'staves.role': 'attendant' // 必须包含管家
			})
			.field({ departure_date: 1, total_days: 1 })
			.limit(5000) // 限制条数防止过大，一般单月单量不会超过此数
			.get();

		let completedCount = 0;
		const ONE_DAY = 24 * 3600 * 1000;

		res.data.forEach((order) => {
			const start = order.departure_date;
			const days = order.total_days || 1;
			// 计算订单结束时间 (这里的定义是：行程最后一天的24点，即第二天0点)
			const tripEnd = start + days * ONE_DAY;

			// 统计条件：
			// 1. 结束时间 > 当月1号 (属于本月的数据)
			// 2. 结束时间 <= 今天0点 (截止到今天已经结束)
			if (tripEnd > monthStart && tripEnd <= todayStart) {
				completedCount++;
			}
		});

		return {
			code: 0,
			data: {
				completed: completedCount
			}
		};
	},

	/**
	 * 获取管家列表的月度统计数据 (总单量、出发、结束)
	 * @param {Object} params
	 * @param {Number} params.dateTs 参考日期时间戳
	 */
	async getAttendantListStats(params) {
		const { dateTs } = params;
		if (!dateTs) return { code: 0, data: {} };

		const d = new Date(dateTs);
		// 月初 00:00:00
		const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
		// 月末 23:59:59
		const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

		// 向前推60天查询，确保能覆盖到跨月和正在进行的订单
		const BUFFER_DAYS = 60 * 24 * 3600 * 1000;
		const queryStart = monthStart - BUFFER_DAYS;

		// 查询该时间段内所有管家相关的订单
		const res = await db
			.collection('a-snapshots')
			.where({
				departure_date: dbCmd.gte(queryStart).and(dbCmd.lte(monthEnd)),
				'staves.role': 'attendant'
			})
			.field({ order_id: 1, departure_date: 1, total_days: 1, staves: 1 })
			.limit(5000)
			.get();

		const statsMap = {}; // { attId: { total: 0, start: 0, end: 0, days: 0 } }

		res.data.forEach((order) => {
			const start = order.departure_date;
			const days = order.total_days || 1;
			// 计算行程结束时间 (第二天0点)
			const tripEnd = start + days * 24 * 3600 * 1000;
			// 计算行程最后一天 (用于判断“结束在当月”)
			// 比如 1号出发1天，end是2号0点，lastServiceDay是1号
			const lastServiceDay = tripEnd - 1000; // 减1秒回到最后一天
			let attr_counted = false;
			if (order.staves) {
				order.staves.forEach((staff) => {
					if (!attr_counted && (staff.role.includes('attendant') || staff.role === 'attendant') && staff.id) {
						attr_counted = true;
						if (!statsMap[staff.id]) statsMap[staff.id] = { total: 0, start: 0, end: 0, days: 0, debug_details: [] };
						const s = statsMap[staff.id];

						// 1. 【特例】出发团数：按出发时间统计
						if (start >= monthStart && start <= monthEnd) {
							s.start++;
						}

						// 2. 结算类数据（天数、结束、总数）：严格按结束时间筛选
						if (lastServiceDay >= monthStart && lastServiceDay <= monthEnd) {
							// 计算交集天数
							// const overlapStart = Math.max(start, monthStart);
							// const overlapEnd = Math.min(tripEnd, monthEnd);

							// if (overlapEnd > overlapStart) {
							// 	const serviceDaysInMonth = Math.ceil((overlapEnd - overlapStart) / (24 * 3600 * 1000));
							// 	s.days += serviceDaysInMonth;
							// }

							const dateStr = new Date(lastServiceDay).toLocaleDateString();
							s.debug_details.push({
								order_id: order.order_id,
								days: days,
								end_date: dateStr
							});

							s.days += days;
							s.total++; // 这里 total 定义为“已结算单量”
							s.end++;
						}
					}
				});
			}
		});

		console.log('====== 月度服务天数统计汇总 ======');
		Object.keys(statsMap).forEach((attId) => {
			const s = statsMap[attId];
			if (s.debug_details && s.debug_details.length > 0) {
				console.log(`-------------`);
				console.log(`管家ID: ${attId}`);
				console.log(`本月结算总天数: ${s.days}天`);
				console.log(`本月结算订单数: ${s.end}单`);
				console.log(`明细列表:`);
				s.debug_details.forEach((item) => {
					console.log(`  -> 订单: ${item.order_id} | 天数: ${item.days} | 结束日: ${item.end_date}`);
				});
			}
		});
		console.log('==================================');

		return { code: 0, data: statsMap };
	},

	/**
	 * 交换行程中的两天 (用于布达拉宫排期调整)
	 * @param {Object} params
	 * @param {String} params.order_id 订单号
	 * @param {Number} params.day_a 第几天 (1-based)
	 * @param {Number} params.day_b 第几天 (1-based)
	 */
	async switchItineraryDay(params) {
		const { order_id, day_a, day_b } = params;
		if (!order_id || !day_a || !day_b) return { code: -1, msg: '参数不完整' };

		// 1. 获取行程数据
		const res = await db.collection('a-snapshots').where({ order_id: order_id }).field({ itinerary: 1, total_days: 1 }).get();

		if (!res.data || res.data.length === 0) {
			return { code: -1, msg: '订单不存在' };
		}

		const docId = res.data[0]._id;
		let itinerary = res.data[0].itinerary || [];
		const totalDays = res.data[0].total_days;

		// 2. 校验范围 (确保不移动第一天和最后一天)
		if (day_a <= 1 || day_a >= totalDays || day_b <= 1 || day_b >= totalDays) {
			return { code: -1, msg: '首尾行程不可调整' };
		}

		// 3. 查找数组索引 (itinerary 中的 day 字段对应 day_a/day_b)
		const idxA = itinerary.findIndex((item) => item.day === day_a);
		const idxB = itinerary.findIndex((item) => item.day === day_b);

		if (idxA === -1 || idxB === -1) {
			// 如果数据不完整，可能需要补全空对象，这里简单报错
			return { code: -1, msg: '对应天数的行程数据不存在' };
		}

		// 4. 交换内容 (利用 JSON 序列化深拷贝防止引用问题)
		const itemA = JSON.parse(JSON.stringify(itinerary[idxA]));
		const itemB = JSON.parse(JSON.stringify(itinerary[idxB]));

		// 5. 核心：修改 day 字段为交换后的天数
		itemA.day = day_b;
		itemB.day = day_a;

		// 6. 回写到数组
		itinerary[idxA] = itemB; // 原位置放 B 的内容(day已改)
		itinerary[idxB] = itemA; // 原位置放 A 的内容(day已改)

		// 7. 重新按 day 排序 (保持数据整洁)
		itinerary.sort((a, b) => a.day - b.day);

		// 8. 更新数据库
		await db.collection('a-snapshots').doc(docId).update({
			itinerary: itinerary,
			updated_at: Date.now()
		});

		return { code: 0, msg: '调整成功' };
	},

	/**
	 * 批量补全所有 custom_display_text 的信息（等级、销售、管家、私导）
	 * 逻辑：遍历所有非空 custom_display_text，如果缺少当前最新的关键信息，则追加
	 */
	async batchCompleteCustomText() {
		// 1. 获取所有有自定义文本的快照
		const snapRes = await db
			.collection('a-snapshots')
			.where({
				custom_display_text: dbCmd.neq(null) // 筛选非空
			})
			.limit(1000)
			.get();

		const snapshots = snapRes.data;
		if (snapshots.length === 0) return { code: 0, msg: '没有需要处理的数据' };

		// 2. 收集所有需要查询的用户 ID (销售 + 管家 + 私导)
		const orderIds = [];
		const userIdsToFetch = new Set(); // 使用 Set 去重

		snapshots.forEach((s) => {
			orderIds.push(s.order_id);
			// 收集 staves 中的 ID
			if (s.staves && Array.isArray(s.staves)) {
				s.staves.forEach((staff) => {
					if (staff.id) userIdsToFetch.add(staff.id);
				});
			}
		});

		// 3. 查 a-customers 获取销售 ID
		const custRes = await db
			.collection('a-customers')
			.where({ order_id: dbCmd.in(orderIds) })
			.field({ order_id: 1, sales_id: 1 })
			.get();

		const custMap = {}; // order_id -> sales_id
		custRes.data.forEach((c) => {
			custMap[c.order_id] = c.sales_id;
			if (c.sales_id) userIdsToFetch.add(c.sales_id);
		});

		// 4. 批量查询用户信息 (一次性查回所有名字)
		const allUserIds = Array.from(userIdsToFetch);
		const userMap = {}; // user_id -> nickname

		if (allUserIds.length > 0) {
			const userRes = await db
				.collection('uni-id-users')
				.where({ _id: dbCmd.in(allUserIds) })
				.field({ _id: 1, nickname: 1, username: 1, real_name: 1 }) // 多查几个字段防空
				.get();

			userRes.data.forEach((u) => {
				// 优先取 nickname，没有则取 real_name，最后取 username
				userMap[u._id] = u.nickname || u.real_name || u.username;
			});
		}

		// 5. 遍历并处理
		let updateCount = 0;
		const updates = [];

		for (const snap of snapshots) {
			if (!snap.custom_display_text) continue;

			let text = snap.custom_display_text;
			let parts = text.split('##');
			let isChanged = false;

			// --- 收集当前应该存在的关键信息 ---
			const targets = [];

			// A. 等级
			if (snap.rank) targets.push(snap.rank + '级');
			else targets.push('D级');

			// B. 销售名字 (从 userMap 获取)
			const sId = custMap[snap.order_id];
			if (sId && userMap[sId]) targets.push(userMap[sId]);

			// C. 管家 & 私导名字 (从 userMap 获取)
			if (snap.staves && Array.isArray(snap.staves)) {
				snap.staves.forEach((s) => {
					const role = s.role;
					const isAttendant = role === 'attendant' || (Array.isArray(role) && role.includes('attendant'));
					const isGuide = role === 'guide' || (Array.isArray(role) && role.includes('guide'));

					// 只要 ID 存在且在 userMap 里有名字，就加入目标列表
					if ((isAttendant || isGuide) && s.id && userMap[s.id]) {
						targets.push(userMap[s.id]);
					}
				});
			}

			// --- 核心补全逻辑 ---
			parts = parts.map((p) => {
				let newP = p;
				targets.forEach((tgt) => {
					// 检查是否存在
					if (!newP.includes(tgt)) {
						newP += ` | ${tgt}`;
						isChanged = true;
					}
				});
				return newP;
			});

			// 如果有变动，执行更新
			if (isChanged) {
				updates.push(
					db
						.collection('a-snapshots')
						.doc(snap._id)
						.update({
							custom_display_text: parts.join('##')
						})
				);
				updateCount++;
			}
		}

		// 6. 并发执行更新
		if (updates.length > 0) {
			// 如果数量太多，建议分批 Promise.all，这里假设一次不超过 500 个并发
			await Promise.all(updates);
		}

		return { code: 0, msg: `处理完成，共扫描 ${snapshots.length} 条，更新了 ${updateCount} 条` };
	}
};

module.exports = operationCenter;
