const uniIdCommon = require('uni-id-common');

// 公共函数：根据用户ID查询会员信息
async function queryMemberByUserId(userId) {
	console.log('[queryMemberByUserId] 开始查询用户会员信息, userId:', userId);

	const db = uniCloud.database();

	const result = await db.collection('a-members').where({ user_id: userId }).get();

	console.log('[queryMemberByUserId] 查询结果:', {
		dataCount: result.data.length,
		hasData: result.data.length > 0,
		firstRecord: result.data.length > 0 ? result.data[0] : null
	});

	return result.data.length > 0 ? result.data[0] : null;
}

// 公共函数：初始化用户会员记录
async function initUserMemberRecord(userId) {
	console.log('[initUserMemberRecord] 开始初始化用户会员记录, userId:', userId);

	const db = uniCloud.database();

	const memberData = {
		user_id: userId,
		level: 'normal',
		total_consumption: 0,
		order_count: 0,
		upgrade_threshold: {
			next_level: 'silver',
			required_consumption: 5000,
			required_orders: 1
		},
		benefits: {
			discount_rate: 1.0
		},
		status: 'active'
	};

	console.log('[initUserMemberRecord] 准备插入的会员数据:', memberData);

	try {
		const result = await db.collection('a-members').add(memberData);
		console.log('[initUserMemberRecord] 用户会员记录初始化成功:', result);
		return memberData;
	} catch (error) {
		if (error.message?.includes('E11000') || error.errMsg?.includes('E11000')) {
			console.warn('[initUserMemberRecord] 捕获到并发冲突(E11000)，说明记录已存在，转为查询现有记录');

			// 既然插入失败说已存在，那就把它查出来返回，当作初始化成功
			const existingResult = await db.collection('a-members').where({ user_id: userId }).get();
			if (existingResult.data.length > 0) {
				console.log('[initUserMemberRecord] 成功获取到已存在的记录');
				return existingResult.data[0];
			}
		}

		console.error('[initUserMemberRecord] 初始化会员记录失败:', error);
		throw error;
	}
}

// 公共函数：统计用户消费数据
async function calculateUserConsumption(userId) {
	console.log('[calculateUserConsumption] 开始统计用户消费数据, userId:', userId);

	// 确保传递正确的客户端信息和用户身份
	const clientInfo = this.getClientInfo();
	console.log('[calculateUserConsumption] 客户端信息:', clientInfo);

	const db = uniCloud.databaseForJQL({
		clientInfo: clientInfo,
		// 显式传递用户ID用于权限验证
		uniIdToken: this.getUniIdToken()
	});

	// 查询用户所有已支付的订单（不包括pending_payment和cancelled状态）
	const result = await db
		.collection('a-orders')
		.where(`user_id == "${userId}" && status in ["paid", "confirmed", "processing", "completed"]`)
		.field('final_amount, status, _id, order_no')
		.get();

	console.log('[calculateUserConsumption] 订单查询结果:', {
		orderCount: result.data.length,
		orders: result.data,
		queryUserId: userId
	});

	// 如果没有查到订单，尝试查询所有订单看看数据情况
	if (result.data.length === 0) {
		console.log('[calculateUserConsumption] 未查到订单，检查数据库中的订单情况');
		const allOrdersResult = await db.collection('a-orders').field('user_id, status, _id, order_no').limit(10).get();
		console.log('[calculateUserConsumption] 数据库中的订单样本:', allOrdersResult.data);
	}

	let totalConsumption = 0;
	let orderCount = result.data.length;

	result.data.forEach((order) => {
		totalConsumption += order.final_amount || 0;
		console.log('[calculateUserConsumption] 处理订单:', {
			orderId: order._id,
			amount: order.final_amount,
			status: order.status
		});
	});

	const consumptionData = {
		totalConsumption,
		orderCount
	};

	console.log('[calculateUserConsumption] 消费统计结果:', consumptionData);
	return consumptionData;
}

// 公共函数：获取会员升级规则
async function fetchMemberUpgradeRules() {
	console.log('[fetchMemberUpgradeRules] 开始获取会员升级规则');

	const db = uniCloud.databaseForJQL({
		clientInfo: this.getClientInfo()
	});

	const result = await db.collection('a-system-configs').where('config_key == "member_upgrade_rules" && status == "active"').get();

	console.log('[fetchMemberUpgradeRules] 系统配置查询结果:', {
		configCount: result.data.length,
		configs: result.data
	});

	if (result.data.length > 0) {
		const rulesArray = result.data[0].config_value;
		console.log('[fetchMemberUpgradeRules] 数据库配置为数组:', rulesArray);

		// 使用 reduce 将数组 [ {key: 'silver', ...}, ... ] 转换回 { silver: {...}, ... }
		const rulesObject = rulesArray.reduce((acc, rule) => {
			if (rule && rule.key) {
				const { key, ...value } = rule;
				acc[key] = value;
			}
			return acc;
		}, {});

		console.log('[fetchMemberUpgradeRules] 转换为对象格式，使用数据库配置的升级规则:', rulesObject);
		return rulesObject;
	}

	// 默认规则（如果配置表中没有数据）
	const defaultRules = {
		silver: { required_consumption: 5000, discount_rate: 0.95 },
		gold: { required_consumption: 20000, discount_rate: 0.9 },
		diamond: { required_consumption: 50000, discount_rate: 0.85 }
	};

	console.log('[fetchMemberUpgradeRules] 使用默认升级规则:', defaultRules);
	return defaultRules;
}

// 公共函数：计算用户当前应该的会员等级
function calculateMemberLevelInfo(totalConsumption, upgradeRules) {
	console.log('[calculateMemberLevelInfo] 开始计算会员等级, totalConsumption:', totalConsumption, 'upgradeRules:', upgradeRules);

	let levelInfo = null;

	if (totalConsumption >= upgradeRules.diamond.required_consumption) {
		levelInfo = {
			currentLevel: 'diamond',
			nextLevel: 'max',
			discountRate: upgradeRules.diamond.discount_rate,
			requiredConsumption: upgradeRules.diamond.required_consumption
		};
	} else if (totalConsumption >= upgradeRules.gold.required_consumption) {
		levelInfo = {
			currentLevel: 'gold',
			nextLevel: 'diamond',
			discountRate: upgradeRules.gold.discount_rate,
			requiredConsumption: upgradeRules.diamond.required_consumption
		};
	} else if (totalConsumption >= upgradeRules.silver.required_consumption) {
		levelInfo = {
			currentLevel: 'silver',
			nextLevel: 'gold',
			discountRate: upgradeRules.silver.discount_rate,
			requiredConsumption: upgradeRules.gold.required_consumption
		};
	} else {
		levelInfo = {
			currentLevel: 'normal',
			nextLevel: 'silver',
			discountRate: 1.0,
			requiredConsumption: upgradeRules.silver.required_consumption
		};
	}

	console.log('[calculateMemberLevelInfo] 计算得出的等级信息:', levelInfo);
	return levelInfo;
}

// 公共函数：升级用户会员等级
async function updateMemberLevel(userId, newLevel, consumptionData, upgradeRules) {
	console.log('[updateMemberLevel] 开始升级用户会员等级:', {
		userId,
		newLevel,
		consumptionData,
		upgradeRules
	});

	const db = uniCloud.databaseForJQL({
		clientInfo: this.getClientInfo()
	});

	const levelInfo = calculateMemberLevelInfo(consumptionData.totalConsumption, upgradeRules);

	const updateData = {
		level: newLevel,
		total_consumption: consumptionData.totalConsumption,
		order_count: consumptionData.orderCount,
		benefits: {
			discount_rate: levelInfo.discountRate
		},
		upgrade_threshold: {
			next_level: levelInfo.nextLevel,
			required_consumption: levelInfo.requiredConsumption,
			required_orders: 1
		},
		upgrade_date: Date.now()
	};

	console.log('[updateMemberLevel] 准备更新的数据:', updateData);

	try {
		const updateResult = await db.collection('a-members').where(`user_id == "${userId}"`).update(updateData);

		console.log('[updateMemberLevel] 会员等级升级成功:', {
			userId,
			newLevel,
			updateResult
		});
	} catch (error) {
		console.error('[updateMemberLevel] 升级会员等级失败:', error);
		throw error;
	}
}

// 工具函数：获取等级中文名称
function getLevelDisplayName(level) {
	console.log('[getLevelDisplayName] 获取等级中文名称, level:', level);

	const levelNames = {
		normal: '普通会员',
		silver: '银卡会员',
		gold: '金卡会员',
		diamond: '钻石会员'
	};

	const displayName = levelNames[level] || '普通会员';
	console.log('[getLevelDisplayName] 返回等级名称:', displayName);
	return displayName;
}

// 工具函数：获取特权文本
function getDiscountPrivilegeText(discountRate) {
	console.log('[getDiscountPrivilegeText] 获取特权文本, discountRate:', discountRate);

	let privilegeText = '';
	if (discountRate >= 1.0) {
		privilegeText = '暂无特权';
	} else {
		const discount = Math.round((1 - discountRate) * 100);
		privilegeText = `尊享${(discountRate * 10).toFixed(1)}折优惠`;
	}

	console.log('[getDiscountPrivilegeText] 返回特权文本:', privilegeText);
	return privilegeText;
}

// 工具函数：格式化金额显示
function formatCurrencyAmount(amount) {
	console.log('[formatCurrencyAmount] 格式化金额, amount:', amount);

	// 1元=1积分，不需要除以100
	const formatted = amount.toLocaleString();
	console.log('[formatCurrencyAmount] 格式化结果:', formatted);
	return formatted;
}

// 工具函数：计算升级进度百分比
function calculateUpgradeProgress(totalConsumption, levelInfo) {
	console.log('[calculateUpgradeProgress] 计算升级进度:', {
		totalConsumption,
		levelInfo
	});

	if (levelInfo.nextLevel === 'max') {
		console.log('[calculateUpgradeProgress] 已达到最高等级，返回100%');
		return 100;
	}

	const currentLevelThresholds = {
		normal: 0,
		silver: 5000,
		gold: 20000,
		diamond: 50000
	};

	const currentThreshold = currentLevelThresholds[levelInfo.currentLevel] || 0;
	const nextThreshold = levelInfo.requiredConsumption;

	console.log('[calculateUpgradeProgress] 进度计算参数:', {
		currentLevel: levelInfo.currentLevel,
		currentThreshold,
		nextThreshold,
		totalConsumption
	});

	if (nextThreshold <= currentThreshold) {
		console.log('[calculateUpgradeProgress] 阈值异常，返回100%');
		return 100;
	}

	const progress = Math.max(0, totalConsumption - currentThreshold);
	const total = nextThreshold - currentThreshold;
	const progressPercent = Math.min(100, Math.floor((progress / total) * 100));

	console.log('[calculateUpgradeProgress] 进度计算结果:', {
		progress,
		total,
		progressPercent
	});

	return progressPercent;
}

module.exports = {
	_before: function () {
		console.log('[_before] 初始化云对象实例');
		// 初始化 uni-id 实例
		const clientInfo = this.getClientInfo();
		this.uniIdCommon = uniIdCommon.createInstance({
			clientInfo: clientInfo
		});
		console.log('[_before] uni-id 实例初始化完成');
	},

	/**
	 * 获取用户会员信息
	 * 如果用户没有会员记录，则自动创建
	 */
	async getUserMemberInfo() {
		console.log('[getUserMemberInfo] ========== 开始获取用户会员信息 ==========');

		try {
			// 验证用户身份
			console.log('[getUserMemberInfo] 开始验证用户身份');
			const checkTokenResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
			console.log('[getUserMemberInfo] Token验证结果:', {
				errCode: checkTokenResult.errCode,
				errMsg: checkTokenResult.errMsg,
				uid: checkTokenResult.uid,
				token: this.getUniIdToken()
			});

			if (checkTokenResult.errCode !== 0) {
				throw new Error(checkTokenResult.errMsg || '用户身份验证失败');
			}

			const uid = checkTokenResult.uid;
			console.log('[getUserMemberInfo] 用户身份验证成功，用户ID:', uid);

			// 1. 查询用户会员信息
			console.log('[getUserMemberInfo] 步骤1: 查询用户会员信息');
			let memberInfo = await queryMemberByUserId.call(this, uid);

			// 2. 如果没有会员记录，则自动创建
			if (!memberInfo) {
				console.log('[getUserMemberInfo] 步骤2: 用户无会员记录，开始自动初始化');
				memberInfo = await initUserMemberRecord.call(this, uid);
			} else {
				console.log('[getUserMemberInfo] 步骤2: 用户已有会员记录:', memberInfo);
			}

			// 3. 统计用户消费数据
			console.log('[getUserMemberInfo] 步骤3: 统计用户消费数据');
			const consumptionData = await calculateUserConsumption.call(this, uid);

			// 4. 获取会员等级规则
			console.log('[getUserMemberInfo] 步骤4: 获取会员等级规则');
			const upgradeRules = await fetchMemberUpgradeRules.call(this);

			// 5. 计算会员等级和升级信息
			console.log('[getUserMemberInfo] 步骤5: 计算会员等级和升级信息');
			const levelInfo = calculateMemberLevelInfo(consumptionData.totalConsumption, upgradeRules);

			// 6. 检查是否需要升级
			console.log('[getUserMemberInfo] 步骤6: 检查是否需要升级');
			console.log('[getUserMemberInfo] 当前等级:', memberInfo.level, '计算等级:', levelInfo.currentLevel);

			if (levelInfo.currentLevel !== memberInfo.level) {
				console.log('[getUserMemberInfo] 用户等级需要升级:', {
					from: memberInfo.level,
					to: levelInfo.currentLevel
				});
				await updateMemberLevel.call(this, uid, levelInfo.currentLevel, consumptionData, upgradeRules);
				memberInfo.level = levelInfo.currentLevel;
				memberInfo.benefits.discount_rate = levelInfo.discountRate;
				console.log('[getUserMemberInfo] 等级升级完成');
			} else {
				console.log('[getUserMemberInfo] 用户等级无需升级');
			}

			// 7. 构造返回数据
			console.log('[getUserMemberInfo] 步骤7: 构造返回数据');
			const result = {
				memberInfo: {
					level: memberInfo.level,
					levelName: getLevelDisplayName(memberInfo.level),
					discountRate: memberInfo.benefits.discount_rate,
					privilege: getDiscountPrivilegeText(memberInfo.benefits.discount_rate),
					status: memberInfo.status,
					joinDate: memberInfo.join_date
				},
				consumptionData: {
					totalConsumption: consumptionData.totalConsumption,
					orderCount: consumptionData.orderCount,
					totalSpent: formatCurrencyAmount(consumptionData.totalConsumption)
				},
				upgradeInfo: {
					nextLevel: levelInfo.nextLevel,
					nextLevelName: getLevelDisplayName(levelInfo.nextLevel),
					requiredConsumption: levelInfo.requiredConsumption,
					nextLevelAmount: formatCurrencyAmount(Math.max(0, levelInfo.requiredConsumption - consumptionData.totalConsumption)),
					progressPercent: calculateUpgradeProgress(consumptionData.totalConsumption, levelInfo)
				}
			};

			console.log('[getUserMemberInfo] 最终返回结果:', result);
			console.log('[getUserMemberInfo] ========== 获取用户会员信息成功 ==========');

			return {
				errCode: 0,
				errMsg: '获取成功',
				data: result
			};
		} catch (error) {
			console.error('[getUserMemberInfo] ========== 获取用户会员信息失败 ==========');
			console.error('[getUserMemberInfo] 错误详情:', {
				message: error.message,
				stack: error.stack,
				name: error.name
			});

			return {
				errCode: -1,
				errMsg: error.message || '获取会员信息失败'
			};
		}
	},

	/**
	 * 根据用户ID查询会员信息
	 */
	async getMemberByUserId(userId) {
		console.log('[getMemberByUserId] 调用公共函数查询会员信息, userId:', userId);
		return await queryMemberByUserId.call(this, userId);
	},

	/**
	 * 初始化用户会员记录
	 */
	async initUserMember(userId) {
		console.log('[initUserMember] 调用公共函数初始化会员记录, userId:', userId);
		return await initUserMemberRecord.call(this, userId);
	},

	/**
	 * 统计用户消费数据
	 */
	async getUserConsumptionStats(userId) {
		console.log('[getUserConsumptionStats] 调用公共函数统计消费数据, userId:', userId);
		return await calculateUserConsumption.call(this, userId);
	},

	/**
	 * 获取会员升级规则
	 */
	async getMemberUpgradeRules() {
		console.log('[getMemberUpgradeRules] 调用公共函数获取升级规则');
		return await fetchMemberUpgradeRules.call(this);
	},

	/**
	 * 计算用户当前应该的会员等级
	 */
	calculateMemberLevel(totalConsumption, upgradeRules) {
		console.log('[calculateMemberLevel] 调用公共函数计算会员等级');
		return calculateMemberLevelInfo(totalConsumption, upgradeRules);
	},

	/**
	 * 升级用户会员等级
	 */
	async upgradeMemberLevel(userId, newLevel, consumptionData) {
		console.log('[upgradeMemberLevel] 调用公共函数升级会员等级:', {
			userId,
			newLevel,
			consumptionData
		});
		const upgradeRules = await fetchMemberUpgradeRules.call(this);
		return await updateMemberLevel.call(this, userId, newLevel, consumptionData, upgradeRules);
	},

	/**
	 * 获取等级中文名称
	 */
	getLevelName(level) {
		console.log('[getLevelName] 调用工具函数获取等级名称, level:', level);
		return getLevelDisplayName(level);
	},

	/**
	 * 获取特权文本
	 */
	getPrivilegeText(discountRate) {
		console.log('[getPrivilegeText] 调用工具函数获取特权文本, discountRate:', discountRate);
		return getDiscountPrivilegeText(discountRate);
	},

	/**
	 * 格式化金额显示
	 */
	formatAmount(amount) {
		console.log('[formatAmount] 调用工具函数格式化金额, amount:', amount);
		return formatCurrencyAmount(amount);
	},

	/**
	 * 计算升级进度百分比
	 */
	calculateProgressPercent(totalConsumption, levelInfo) {
		console.log('[calculateProgressPercent] 调用工具函数计算升级进度');
		return calculateUpgradeProgress(totalConsumption, levelInfo);
	}
};
