'use strict';

const uniIdCommon = require('uni-id-common');

// 爬虫API基础URL
const CRAWLER_API_BASE_URL = 'http://47.108.215.58:18000';

// 数据清洗函数 - 递归清理对象中所有字符串的双引号
function cleanDataForDatabase(data) {
	if (data === null || data === undefined) {
		return data;
	}

	if (typeof data === 'string') {
		// 移除字符串中的英文双引号，避免JSON解析和数据库插入问题
		return data.replace(/"/g, '');
	}

	if (Array.isArray(data)) {
		return data.map((item) => cleanDataForDatabase(item));
	}

	if (typeof data === 'object') {
		const cleanedObj = {};
		for (const key in data) {
			if (data.hasOwnProperty(key)) {
				// 清理键名和值
				const cleanedKey = typeof key === 'string' ? key.replace(/"/g, '') : key;
				cleanedObj[cleanedKey] = cleanDataForDatabase(data[key]);
			}
		}
		return cleanedObj;
	}

	return data;
}

// 从标题中提取天数信息
function extractDaysFromTitle(title) {
	if (!title) return 1;

	// 匹配各种天数格式：8日7晚、8天7夜、8天、8日等
	const dayMatch = title.match(/(\d+)[日天]/);
	if (dayMatch) {
		return parseInt(dayMatch[1]) || 1;
	}

	return 1;
}

// 生成随机数值的辅助函数
function generateRandomValues() {
	// rating: 4-5分之间，保留1位小数
	const rating = (Math.random() + 4).toFixed(1);

	// view_count: 1万-10万之间的整数
	const viewCount = Math.floor(Math.random() * 90000) + 10000;

	// sales_count: 100-5000之间的整数
	const salesCount = Math.floor(Math.random() * 4901) + 100;

	// review_count: sales_count的10分之一左右 (±20%的浮动)
	const baseReviewCount = Math.floor(salesCount / 10);
	const reviewCount = Math.floor(baseReviewCount * (0.8 + Math.random() * 0.4));

	console.log(`[随机数据生成] 评分: ${rating}, 浏览量: ${viewCount}, 销量: ${salesCount}, 评价数: ${reviewCount}`);

	return {
		rating: parseFloat(rating),
		viewCount,
		salesCount,
		reviewCount
	};
}

// 安全的数据清洗 - 专门处理可能含有特殊字符的字段
function sanitizeStringFields(obj, fields = []) {
	const result = { ...obj };

	fields.forEach((field) => {
		if (result[field] && typeof result[field] === 'string') {
			result[field] = result[field]
				.replace(/"/g, '') // 移除双引号
				.replace(/'/g, "'") // 替换单引号为安全字符
				.replace(/\\/g, '') // 移除反斜杠
				.trim(); // 去除首尾空格
		}
	});

	return result;
}

exports.main = async (event, context) => {
	const { action, ...params } = event;

	// 根据 action 参数路由到不同的处理函数
	switch (action) {
		case 'getProductRouteIds':
			return await getProductRouteIds(event, context);
		case 'checkExistingProducts':
			return await checkExistingProducts(event, context);
		case 'getProductDetail':
			return await getProductDetail(event, context);
		case 'getProductItinerary':
			return await getProductItinerary(event, context);
		case 'getBookingNote':
			return await getBookingNote(event, context);
		case 'getProductReviews':
			return await getProductReviews(event, context);
		case 'syncSnapshot':
			return await syncSnapshot(event, context);
		case 'syncFullProduct':
			return await syncFullProduct(event, context);
		case 'checkApiHealth':
			return await checkApiHealth(event, context);
		case 'testDataCleaning':
			return await testDataCleaning(event, context);
		default:
			return {
				errCode: 'INVALID_ACTION',
				errMsg: '无效的操作类型'
			};
	}
};

// 检查API健康状态
async function checkApiHealth(event, context) {
	console.log('开始API健康检查...');

	try {
		const requestUrl = `${CRAWLER_API_BASE_URL}/health`;
		console.log(`发送健康检查请求: ${requestUrl}`);

		const response = await uniCloud.httpclient.request(requestUrl, {
			method: 'GET',
			timeout: 30000,
			headers: {
				'User-Agent': 'uniCloud-httpclient/1.0',
				Accept: 'application/json'
			},
			dataType: 'json' // 明确指定返回数据类型为JSON
		});

		console.log(`健康检查响应状态: ${response.status}`);
		console.log(`健康检查响应数据:`, response.data);
		console.log(`健康检查响应数据类型: ${typeof response.data}`);

		if (response.status !== 200) {
			throw new Error(`API健康检查失败，状态码: ${response.status}, 响应内容: ${JSON.stringify(response.data)}`);
		}

		return {
			errCode: 0,
			data: {
				status: 'healthy',
				api_response: response.data,
				response_type: typeof response.data,
				timestamp: new Date().toISOString()
			}
		};
	} catch (error) {
		console.error('API健康检查失败:', error);
		console.error('错误堆栈:', error.stack);
		return {
			errCode: 'API_HEALTH_CHECK_FAILED',
			errMsg: `API健康检查失败: ${error.message}`
		};
	}
}

// 获取商品 Route IDs
async function getProductRouteIds(event, context) {
	const { productId, uniIdToken } = event;
	const uniIdInstance = uniIdCommon.createInstance({ context });
	// 验证用户身份
	const checkResult = await uniIdInstance.checkToken(uniIdToken);
	if (checkResult.errCode !== 0) {
		return {
			errCode: checkResult.errCode,
			errMsg: checkResult.errMsg || '身份验证失败'
		};
	}

	if (!checkResult.role.includes('admin') && !checkResult.role.includes('super_admin') && !checkResult.permission.includes('MANAGE_PRODUCTS')) {
		return {
			errCode: 500,
			errMsg: '无权限'
		};
	}

	if (!productId) {
		return {
			errCode: 'MISSING_PRODUCT_ID',
			errMsg: '缺少商品ID参数'
		};
	}

	console.log(`[Route ID 同步] 开始获取 Route IDs，产品ID: ${productId}`);

	try {
		const requestUrl = `${CRAWLER_API_BASE_URL}/api/route_ids/${productId}`;
		console.log(`[Route ID 同步] 发送API请求: ${requestUrl}`);

		const response = await uniCloud.httpclient.request(requestUrl, {
			method: 'GET',
			timeout: 60000, // 60秒超时
			headers: {
				'User-Agent': 'uniCloud-httpclient/1.0',
				Accept: 'application/json'
			},
			dataType: 'json' // 明确指定返回数据类型为JSON
		});

		console.log(`[Route ID 同步] API响应状态: ${response.status}`);
		console.log(`[Route ID 同步] API响应数据类型: ${typeof response.data}`);

		if (response.status !== 200) {
			throw new Error(`API请求失败，状态码: ${response.status}, 响应内容: ${JSON.stringify(response.data)}`);
		}

		// 由于设置了 dataType: 'json'，response.data 应该已经是解析后的对象
		const apiResult = response.data;

		if (!apiResult || typeof apiResult !== 'object') {
			throw new Error(`API返回数据格式错误，期望对象，实际收到: ${typeof apiResult}`);
		}

		if (!apiResult.success) {
			const errorMsg = apiResult.message || apiResult.error || '获取 Route IDs 失败';
			throw new Error(`API返回错误: ${errorMsg}`);
		}

		if (!apiResult.data) {
			throw new Error('API返回成功但缺少数据字段');
		}

		// 清洗返回的数据，移除可能导致问题的特殊字符
		const cleanedData = cleanDataForDatabase(apiResult.data);
		console.log(`[Route ID 同步] Route IDs 数据清洗完成，产品ID: ${productId}`);
		console.log(`[Route ID 同步] 清洗后的数据:`, JSON.stringify(cleanedData));

		const db = uniCloud.database();
		const routesCollection = db.collection('a-routes');
		const dataToSave = {
			A_route_id: cleanedData.A_route_id,
			route_ids: cleanedData.route_ids
		};

		// 2. 查找是否已存在该 product_id 的记录
		const existingRecord = await routesCollection
			.where({ A_route_id: cleanedData.A_route_id })
			.field({ _id: true }) // 只需要 _id
			.get();

		let dbResult;
		if (existingRecord.data && existingRecord.data.length > 0) {
			// 3a. 存在 -> 更新 (使用 set 覆盖)
			const recordId = existingRecord.data[0]._id;
			console.log(`[Route ID 同步] 发现已存在记录 (_id: ${recordId}), 执行更新...`);
			dbResult = await routesCollection.doc(recordId).set(dataToSave);
		} else {
			// 3b. 不存在 -> 新增
			console.log(`[Route ID 同步] 未发现记录, 执行新增...`);
			dbResult = await routesCollection.add(dataToSave);
		}

		console.log('[Route ID 同步] a-routes 数据库操作结果:', dbResult);

		return {
			errCode: 0,
			data: cleanedData
		};
	} catch (error) {
		console.error(`[Route ID 同步] 获取 Route IDs 失败 [产品ID: ${productId}]:`, error);
		console.error('[Route ID 同步] 错误堆栈:', error.stack);
		return {
			errCode: 'GET_ROUTE_IDS_FAILED',
			errMsg: `获取 Route IDs 失败: ${error.message}`
		};
	}
}

/**
 * 检查商品是否存在
 * 接收一个 route_ids 数组，返回其中已存在于 a-products 表中的 ctrip_id
 */
async function checkExistingProducts(event, context) {
	const { route_ids } = event;

	if (!route_ids || !Array.isArray(route_ids)) {
		return {
			errCode: 'MISSING_ROUTE_IDS',
			errMsg: '缺少 route_ids 数组参数'
		};
	}

	if (route_ids.length === 0) {
		return {
			errCode: 0,
			data: {
				existing_ids: []
			}
		};
	}

	console.log(`[商品检查] 开始检查 ${route_ids.length} 个商品ID是否存在...`);

	const db = uniCloud.databaseForJQL({
		clientInfo: event.clientInfo
	});
	const dbCmd = db.command;

	try {
		const queryResult = await db
			.collection('a-products')
			.where({
				ctrip_id: dbCmd.in(route_ids)
			})
			.field({ ctrip_id: true })
			.limit(route_ids.length)
			.get();

		if (queryResult.data) {
			const existing_ids = queryResult.data.map((item) => item.ctrip_id);
			console.log(`[商品检查] 检查完成，找到 ${existing_ids.length} 个已存在的商品。`);
			return {
				errCode: 0,
				data: {
					existing_ids: existing_ids
				}
			};
		} else {
			throw new Error('数据库查询失败');
		}
	} catch (error) {
		console.error(`[商品检查] 数据库查询失败:`, error);
		console.error('[商品检查] 错误堆栈:', error.stack);
		return {
			errCode: 'CHECK_PRODUCTS_FAILED',
			errMsg: `检查商品是否存在时失败: ${error.message}`
		};
	}
}

// 获取商品详情
async function getProductDetail(event, context) {
	const { productId } = event;

	if (!productId) {
		return {
			errCode: 'MISSING_PRODUCT_ID',
			errMsg: '缺少商品ID参数'
		};
	}

	console.log(`[商品详情同步] 开始获取商品详情，产品ID: ${productId}`);

	try {
		let requestUrl = `${CRAWLER_API_BASE_URL}/api/detail/${productId}`;
		console.log(`[商品详情同步] 发送API请求: ${requestUrl}`);

		let response = await uniCloud.httpclient.request(requestUrl, {
			method: 'GET',
			timeout: 60000, // 增加超时时间到60秒
			headers: {
				'User-Agent': 'uniCloud-httpclient/1.0',
				Accept: 'application/json'
			},
			dataType: 'json' // 明确指定返回数据类型为JSON
		});

		console.log(`[商品详情同步] API响应状态: ${response.status}`);
		console.log(`[商品详情同步] API响应数据类型: ${typeof response.data}`);

		if (response.status !== 200) {
			throw new Error(`API请求失败，状态码: ${response.status}, 响应内容: ${JSON.stringify(response.data)}`);
		}

		// 由于设置了 dataType: 'json'，response.data 应该已经是解析后的对象
		let apiResult = response.data;

		console.log(`[商品详情同步] 解析后的API结果字段:`, Object.keys(apiResult.data || {}));
		console.log(`[商品详情同步] API返回的完整数据结构:`, JSON.stringify(apiResult, null, 2));

		if (!apiResult || typeof apiResult !== 'object') {
			throw new Error(`API返回数据格式错误，期望对象，实际收到: ${typeof apiResult}`);
		}

		if (!apiResult.success) {
			let errorMsg = apiResult.message || apiResult.error || '获取商品详情失败';
			throw new Error(`API返回错误: ${errorMsg}`);
		}

		if (!apiResult.data) {
			throw new Error('API返回成功但缺少数据字段');
		}

		// 清洗返回的数据，移除可能导致问题的特殊字符
		const cleanedData = cleanDataForDatabase(apiResult.data);
		console.log(`[商品详情同步] 数据清洗完成，产品ID: ${productId}`);
		console.log(`[商品详情同步] 清洗后的数据字段:`, Object.keys(cleanedData));

		// 获取产品轮播图的图片
		requestUrl = `${CRAWLER_API_BASE_URL}/api/swiper/${productId}`;
		console.log(`[商品详情同步] 发送API请求: ${requestUrl}`);

		response = await uniCloud.httpclient.request(requestUrl, {
			method: 'GET',
			timeout: 60000, // 增加超时时间到60秒
			headers: {
				'User-Agent': 'uniCloud-httpclient/1.0',
				Accept: 'application/json'
			},
			dataType: 'json' // 明确指定返回数据类型为JSON
		});

		console.log(`[商品详情同步] API响应状态: ${response.status}`);
		console.log(`[商品详情同步] API响应数据类型: ${typeof response.data}`);

		if (response.status !== 200) {
			throw new Error(`API请求失败，状态码: ${response.status}, 响应内容: ${JSON.stringify(response.data)}`);
		}

		apiResult = response.data;

		console.log(`[商品详情同步] 解析后的API结果字段:`, Object.keys(apiResult.data || {}));
		console.log(`[商品详情同步] API返回的完整数据结构:`, JSON.stringify(apiResult, null, 2));

		if (!apiResult || typeof apiResult !== 'object') {
			throw new Error(`API返回数据格式错误，期望对象，实际收到: ${typeof apiResult}`);
		}

		if (!apiResult.success) {
			errorMsg = apiResult.message || apiResult.error || '获取商品详情失败';
			throw new Error(`API返回错误: ${errorMsg}`);
		}

		if (!apiResult.data) {
			throw new Error('API返回成功但缺少数据字段');
		}

		cleanedData.product_images = apiResult.data.image_urls;

		return {
			errCode: 0,
			data: cleanedData
		};
	} catch (error) {
		console.error(`[商品详情同步] 获取商品详情失败 [产品ID: ${productId}]:`, error);
		console.error('[商品详情同步] 错误堆栈:', error.stack);
		return {
			errCode: 'GET_PRODUCT_DETAIL_FAILED',
			errMsg: `获取商品详情失败: ${error.message}`
		};
	}
}

// 获取商品行程安排
async function getProductItinerary(event, context) {
	const { productId } = event;

	if (!productId) {
		return {
			errCode: 'MISSING_PRODUCT_ID',
			errMsg: '缺少商品ID参数'
		};
	}

	console.log(`开始获取行程安排，产品ID: ${productId}`);

	try {
		const requestUrl = `${CRAWLER_API_BASE_URL}/api/itinerary/${productId}`;
		console.log(`发送API请求: ${requestUrl}`);

		const response = await uniCloud.httpclient.request(requestUrl, {
			method: 'GET',
			timeout: 60000,
			headers: {
				'User-Agent': 'uniCloud-httpclient/1.0',
				Accept: 'application/json'
			},
			dataType: 'json' // 明确指定返回数据类型为JSON
		});

		console.log(`API响应状态: ${response.status}`);

		if (response.status !== 200) {
			throw new Error(`API请求失败，状态码: ${response.status}, 响应内容: ${JSON.stringify(response.data)}`);
		}

		// 由于设置了 dataType: 'json'，response.data 应该已经是解析后的对象
		const apiResult = response.data;

		if (!apiResult.success) {
			const errorMsg = apiResult.message || apiResult.error || '获取行程安排失败';
			throw new Error(`API返回错误: ${errorMsg}`);
		}

		// 清洗返回的数据，移除可能导致问题的特殊字符
		const cleanedData = cleanDataForDatabase(apiResult.data);
		console.log(`[行程安排同步] 行程数据清洗完成，产品ID: ${productId}`);

		return {
			errCode: 0,
			data: cleanedData
		};
	} catch (error) {
		console.error(`获取行程安排失败 [产品ID: ${productId}]:`, error);
		return {
			errCode: 'GET_ITINERARY_FAILED',
			errMsg: `获取行程安排失败: ${error.message}`
		};
	}
}

// 获取预订须知
async function getBookingNote(event, context) {
	const { productId } = event;

	if (!productId) {
		return {
			errCode: 'MISSING_PRODUCT_ID',
			errMsg: '缺少商品ID参数'
		};
	}

	console.log(`开始获取预订须知，产品ID: ${productId}`);

	try {
		const requestUrl = `${CRAWLER_API_BASE_URL}/api/booking_note/${productId}`;
		console.log(`发送API请求: ${requestUrl}`);

		const response = await uniCloud.httpclient.request(requestUrl, {
			method: 'GET',
			timeout: 60000,
			headers: {
				'User-Agent': 'uniCloud-httpclient/1.0',
				Accept: 'application/json'
			},
			dataType: 'json' // 明确指定返回数据类型为JSON
		});

		console.log(`API响应状态: ${response.status}`);

		if (response.status !== 200) {
			throw new Error(`API请求失败，状态码: ${response.status}, 响应内容: ${JSON.stringify(response.data)}`);
		}

		// 由于设置了 dataType: 'json'，response.data 应该已经是解析后的对象
		const apiResult = response.data;

		if (!apiResult.success) {
			const errorMsg = apiResult.message || apiResult.error || '获取预订须知失败';
			throw new Error(`API返回错误: ${errorMsg}`);
		}

		// 清洗返回的数据，移除可能导致问题的特殊字符
		const cleanedData = cleanDataForDatabase(apiResult.data);
		console.log(`[预订须知同步] 预订须知数据清洗完成，产品ID: ${productId}`);

		return {
			errCode: 0,
			data: cleanedData
		};
	} catch (error) {
		console.error(`获取预订须知失败 [产品ID: ${productId}]:`, error);
		return {
			errCode: 'GET_BOOKING_NOTE_FAILED',
			errMsg: `获取预订须知失败: ${error.message}`
		};
	}
}

// 获取并存储商品评论
async function getProductReviews(event, context) {
	const { productId, uniIdToken } = event;
	const uniIdInstance = uniIdCommon.createInstance({ context });
	// 验证用户身份
	const checkResult = await uniIdInstance.checkToken(uniIdToken);
	if (checkResult.errCode !== 0) {
		return {
			errCode: checkResult.errCode,
			errMsg: checkResult.errMsg || '身份验证失败'
		};
	}

	if (!checkResult.role.includes('admin') && !checkResult.role.includes('super_admin') && !checkResult.permission.includes('MANAGE_PRODUCTS')) {
		return {
			errCode: 500,
			errMsg: '无权限'
		};
	}

	if (!productId) {
		return {
			errCode: 'MISSING_PRODUCT_ID',
			errMsg: '缺少商品ID参数'
		};
	}

	try {
		const db = uniCloud.database();
		const productsCollection = db.collection('a-products');
		const routesCollection = db.collection('a-routes');
		const reviewsCollection = db.collection('a-reviews');

		const ARouteRes = await routesCollection.where({ route_ids: productId }).get();
		if (ARouteRes && ARouteRes.data && ARouteRes.data.length > 0) {
			productId = ARouteRes.data[0].A_route_id;
			console.log(`[评论同步] 成功获取该产品的A线路ID: ${productId}`);
		} else {
			console.warn(`[评论同步] 获取A线路ID失败`);
		}

		console.log(`[评论同步] 开始获取商品评论，产品ID: ${productId}`);

		const requestUrl = `${CRAWLER_API_BASE_URL}/api/reviews/${productId}`;
		console.log(`[评论同步] 发送API请求: ${requestUrl}`);

		const response = await uniCloud.httpclient.request(requestUrl, {
			method: 'GET',
			// 评论页可能需要更长时间加载
			timeout: 100000, // 增加超时时间到 100 秒
			headers: {
				'User-Agent': 'uniCloud-httpclient/1.0',
				Accept: 'application/json'
			},
			dataType: 'json' // 明确指定返回数据类型为JSON
		});

		console.log(`[评论同步] API响应状态: ${response.status}`);
		console.log(`[评论同步] API响应数据类型: ${typeof response.data}`);

		if (response.status !== 200) {
			throw new Error(`API请求失败，状态码: ${response.status}, 响应内容: ${JSON.stringify(response.data)}`);
		}

		const apiResult = response.data;

		if (!apiResult || typeof apiResult !== 'object') {
			throw new Error(`API返回数据格式错误，期望对象，实际收到: ${typeof apiResult}`);
		}

		if (!apiResult.success) {
			const errorMsg = apiResult.message || apiResult.error || '获取评论失败';
			throw new Error(`API返回错误: ${errorMsg}`);
		}

		if (!apiResult.data) {
			throw new Error('API返回成功但缺少数据字段');
		}

		// 清洗返回的数据
		const cleanedData = cleanDataForDatabase(apiResult.data);
		console.log(`[评论同步] 评论数据清洗完成，产品ID: ${productId}`);

		// 确保 cleanedData 中有 product_id (爬虫应该会返回)
		if (!cleanedData.product_id) {
			cleanedData.product_id = productId; // 备用方案
			console.warn(`[评论同步] API返回的评论数据中缺少 product_id，已使用传入的 productId 补充。`);
		}

		// 更新 a-products 表中的评分信息
		console.log(`[评论同步] 准备更新 a-products 表 (ctrip_id: ${cleanedData.product_id}) 的评分信息...`);
		const productUpdateData = {
			rating: parseFloat(cleanedData.rating) || 5,
			good_rate: parseFloat(cleanedData.good_rate) || 100,
			rating_spec: {
				itinerary: parseFloat(cleanedData.rating_spec?.itinerary) || 5,
				accommodation: parseFloat(cleanedData.rating_spec?.accommodation) || 5,
				service: parseFloat(cleanedData.rating_spec?.service) || 5
			}
		};

		const productUpdateResult = await productsCollection
			.where({
				ctrip_id: cleanedData.product_id
			})
			.update(productUpdateData);

		console.log(`[评论同步] 更新 a-products 结果:`, productUpdateResult);
		if (productUpdateResult.affectedDocs === 0) {
			console.warn(`[评论同步] 未找到 ctrip_id 为 ${cleanedData.product_id} 的产品记录或评分未变化，无法更新评分。`);
		} else {
			console.log(`[评论同步] 成功更新 a-products 表中的评分信息。`);
		}

		// 批量插入 a-reviews 表
		let newCount = 0;
		let updatedCount = 0;
		let insertErrors = [];
		const reviewsToInsert = cleanedData.reviews || [];

		console.log(`[评论同步] 准备向 a-reviews 插入 ${reviewsToInsert.length} 条评论...`);

		if (reviewsToInsert.length > 0) {
			// 为每条评论添加 ctrip_id 和 last_updated 字段
			const recordsToInsert = reviewsToInsert.map((review) => ({
				...review, // 展开单条评论的所有字段
				ctrip_id: cleanedData.product_id, // 添加关联的 ctrip_id
				is_real: true,
				status: 'pending'
			}));
			console.log(recordsToInsert[0]);

			const existingReviewsRes = await reviewsCollection
				.where({
					ctrip_id: cleanedData.product_id
				})
				.field({ _id: true, user_name: true, travel_date: true, content: true }) // 仅获取用于去重的字段
				.limit(1000)
				.get();

			const existingReviewMap = new Map();
			if (existingReviewsRes.data) {
				existingReviewsRes.data.forEach((review) => {
					const safe_user = (review.user_name || '').trim();
					const safe_date = (review.travel_date || '').trim();
					const safe_content = (review.content || '').trim();
					const contentSnippet = safe_content.substring(0, 30);
					const key = `${safe_user}_${safe_date}_${contentSnippet}`;
					existingReviewMap.set(key, review._id);
				});
			}
			console.log(`[评论同步] 数据库中已存在 ${existingReviewMap.size} 条相关评论。`);

			const recordsToAdd = [];
			const recordsToUpdate = [];

			for (const record of recordsToInsert) {
				const safe_user = (record.user_name || '').trim();
				const safe_date = (record.travel_date || '').trim();
				const safe_content = (record.content || '').trim();
				const contentSnippet = safe_content.substring(0, 30);
				const key = `${safe_user}_${safe_date}_${contentSnippet}`;

				if (key && existingReviewMap.has(key)) {
					// 已存在 -> 准备更新
					recordsToUpdate.push({
						_id: existingReviewMap.get(key),
						data: record // 完整的、从API拉取的新数据
					});
				} else {
					// 不存在 -> 准备新增
					console.log(key);
					recordsToAdd.push(record);
				}
			}

			console.log(`[评论同步] ${recordsToAdd.length} 条待新增, ${recordsToUpdate.length} 条待更新。`);

			// 4. 执行批量新增
			if (recordsToAdd.length > 0) {
				try {
					const addResult = await reviewsCollection.add(recordsToAdd);
					newCount = addResult.inserted || (addResult.ids ? addResult.ids.length : addResult.id ? 1 : 0);
					console.log(`[评论同步] 成功新增 ${newCount} 条评论。`);
				} catch (error) {
					console.error('[评论同步] a-reviews 批量插入时发生错误:', error);
					insertErrors.push(error.message);
				}
			}

			// 5. 执行批量更新 (通过循环单条 .set() 完成)
			if (recordsToUpdate.length > 0) {
				for (const item of recordsToUpdate) {
					try {
						// 使用 .set() 会用 item.data 完全覆盖掉 doc(item._id) 的原有数据
						// 这在“同步”场景下是正确的，可以确保数据和API一致
						await reviewsCollection.doc(item._id).set(item.data);
						updatedCount++;
					} catch (error) {
						console.error(`[评论同步] 更新评论 _id: ${item._id} 时失败:`, error);
						insertErrors.push(error.message);
					}
				}
				console.log(`[评论同步] 成功更新 ${updatedCount} 条评论。`);
			}
		} else {
			console.log('[评论同步] 没有评论需要插入或更新 a-reviews 表。');
		}

		if (insertErrors.length === 0) {
			// console.log(`[评论同步] 成功向 a-reviews 插入 ${insertedCount} 条评论，产品ID: ${cleanedData.product_id}`);
			return {
				errCode: 0,
				data: {
					productUpdateResult: productUpdateResult, // a-products 更新结果
					newCount: newCount, // a-reviews 新增数量
					updatedCount: updatedCount, // a-reviews 更新数量
					productId: cleanedData.product_id // 返回 ctrip_id
				}
			};
		} else {
			// 如果有错误，抛出或返回错误信息
			throw new Error(`a-reviews 数据库插入操作部分或全部失败: ${insertErrors.join('; ')}`);
		}
	} catch (error) {
		console.error(`[评论同步] 获取或存储评论失败 [产品ID: ${productId}]:`, error);
		console.error('[评论同步] 错误堆栈:', error.stack);
		return {
			errCode: 'GET_OR_SAVE_REVIEWS_FAILED',
			errMsg: `获取或存储评论失败: ${error.message}`
		};
	}
}

// 同步订单快照
async function syncSnapshot(event, context) {
	let { snapshot_url, departure_date, uniIdToken } = event;

	// 验证用户身份 - 管理端操作需要admin权限
	const uniIdInstance = uniIdCommon.createInstance({ context });
	let operatorId = 'system';
	let userRole = [];
	let userPermission = [];

	if (uniIdToken) {
		try {
			const checkResult = await uniIdInstance.checkToken(uniIdToken);

			if (checkResult.errCode !== 0) {
				return {
					errCode: 'TOKEN_INVALID',
					errMsg: `身份验证失败: ${checkResult.errMsg || '无效token'}`
				};
			}

			operatorId = checkResult.uid;
			userRole = checkResult.role || [];
			userPermission = checkResult.permission || [];

			if (!userRole.includes('admin') && !userRole.includes('super_admin') && !userPermission.includes('MANAGE_ORDERS')) {
				return {
					errCode: 500,
					errMsg: '无权限'
				};
			}

			// 检查是否有admin权限（可选，根据业务需求决定）
			console.log(`用户身份验证成功: uid=${operatorId}, role=${JSON.stringify(userRole)}`);
		} catch (error) {
			console.error('Token验证失败:', error);
			return {
				errCode: 'TOKEN_CHECK_ERROR',
				errMsg: `Token验证异常: ${error.message}`
			};
		}
	} else {
		console.log('未提供token，使用系统身份执行同步操作');
	}

	if (!snapshot_url) {
		return {
			errCode: 'MISSING_SNAPSHOT_URL',
			errMsg: '缺少订单快照URL参数'
		};
	}

	if (!departure_date) {
		return {
			errCode: 'MISSING_DEPARTURE_DATE',
			errMsg: '缺少出发/返回日期参数'
		};
	}

	const match = snapshot_url.match(/\/p(\d+)\/.*?orderId=(\d+)/);
	let ctripId = null;
	let orderId = null;
	let productId = null;
	if (match) {
		ctripId = match[1];
		orderId = match[2];
	}

	if (!orderId) {
		return {
			errCode: 'COULD_NOT_MATCH_ORDERID',
			errMsg: '无法匹配到orderId'
		};
	}

	if (!ctripId) {
		return {
			errCode: 'COULD_NOT_MATCH_CTRIPID',
			errMsg: '无法匹配到ctripId'
		};
	}

	const db = uniCloud.databaseForJQL({ clientInfo: event.clientInfo });

	try {
		const productRecord = await db.collection('a-products').where(`ctrip_id == '${ctripId}'`).field({ _id: true }).getOne();

		if (productRecord.data.length > 0) {
			productId = productRecord.data[0]._id;
			console.log('[订单快照同步] 成功获取商品ID: ', productId);
		} else {
			console.log('[订单快照同步] 该商品未录入，现在开始同步商品：', ctripId);
			const syncResult = await syncFullProduct({ productId: ctripId, uniIdToken }, context);
			if (syncResult.errCode === 0 && syncResult.data) {
				productId = syncResult.data.productId;
				console.log('[订单快照同步] 同步商品成功，ID: ', productId);
			} else {
				return {
					errCode: 'COULD_NOT_SYNC_PRODUCT',
					errMsg: `同步商品失败：${ctripId}`
				};
			}
		}
	} catch (error) {
		console.error(`[订单快照同步] 订单快照同步失败:`, error);
	}

	departure_date = departure_date.split('/')[0].trim();

	console.log(`[订单快照同步] 开始同步订单快照，ctripId: ${ctripId}, orderId: ${orderId}, productId: ${productId}, departure_date: ${departure_date}`);

	// 创建同步日志记录 - 包含 product_id 外键
	const syncLogResult = await db.collection('a-ctrip-sync-logs').add({
		ctrip_id: ctripId,
		sync_type: 'snapshot',
		sync_status: 'syncing',
		operator_id: operatorId
	});

	const syncLogId = syncLogResult.id;

	console.log(`[订单快照同步] 开始获取行程安排，订单快照URL: ${snapshot_url}`);

	try {
		const requestUrl = `${CRAWLER_API_BASE_URL}/api/snapshot_itinerary`;
		console.log(`发送API请求: ${requestUrl}`);

		const response = await uniCloud.httpclient.request(requestUrl, {
			method: 'POST',
			timeout: 60000,
			headers: {
				'User-Agent': 'uniCloud-httpclient/1.0',
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			dataType: 'json', // 明确指定返回数据类型为JSON
			data: {
				url: snapshot_url
			}
		});

		console.log(`API响应状态: ${response.status}`);

		if (response.status !== 200) {
			throw new Error(`API请求失败，状态码: ${response.status}, 响应内容: ${JSON.stringify(response.data)}`);
		}

		// 由于设置了 dataType: 'json'，response.data 应该已经是解析后的对象
		const apiResult = response.data;

		if (!apiResult.success) {
			const errorMsg = apiResult.message || apiResult.error || '获取行程安排失败';
			throw new Error(`API返回错误: ${errorMsg}`);
		}

		// 清洗返回的数据，移除可能导致问题的特殊字符
		const cleanedData = cleanDataForDatabase(apiResult.data);
		cleanedData.product_id = productId;
		const departureDateObj = new Date(departure_date);
		const departureTime = departureDateObj.getTime();
		const departureTimestamp = Math.floor(departureTime / 1000) * 1000;
		cleanedData.departure_date = departureTimestamp;
		console.log(`[订单快照同步] 行程数据清洗完成，订单快照URL: ${snapshot_url}`);

		try {
			const existingSnapshot = await db.collection('a-snapshots').where(`order_id == '${orderId}'`).get();

			if (existingSnapshot.data.length > 0) {
				console.log(`[订单快照同步] 更新现有订单快照记录，ID: ${existingSnapshot.data[0]._id}`);
				await db.collection('a-snapshots').doc(existingSnapshot.data[0]._id).update(cleanedData);
			} else {
				console.log(`[订单快照同步] 创建新订单快照记录`);
				await db.collection('a-snapshots').add(cleanedData);
			}

			console.log(`[订单快照同步] 订单快照同步成功，订单ID: ${orderId}`);
		} catch (error) {
			console.error(`[订单快照同步] 订单快照保存失败:`, error);
		}

		await db.collection('a-ctrip-sync-logs').doc(syncLogId).update({
			sync_status: 'success',
			end_time: Date.now()
		});

		try {
			// 导入album-service云对象
			const albumService = uniCloud.importObject('album-service', {
				customUI: true // 如果你的云对象需要前端的上下文信息，请保留此项
			});
			// 调用创建相册的方法
			const albumRes = await albumService.createAlbum(orderId);
			if (albumRes.errCode !== 0) {
				// 如果创建相册失败，在云函数日志中记录错误
				// 注意：这里我们不中断支付成功的主流程，以防影响用户体验
				console.error(`[订单快照同步] 订单快照 ${orderId} 创建相册失败:`, albumRes.errMsg);
			} else {
				console.log(`[订单快照同步] 创建相册成功，快照订单号: ${orderId}`);
			}
		} catch (e) {
			// 如果调用云对象本身失败，同样记录错误
			console.error(`调用album-service创建相册时发生异常，快照订单号: ${orderId}`, e);
		}

		return {
			errCode: 0,
			data: cleanedData
		};
	} catch (error) {
		// 更新同步记录为失败状态
		if (syncLogId) {
			await db
				.collection('a-ctrip-sync-logs')
				.doc(syncLogId)
				.update({
					sync_status: 'failed',
					end_time: Date.now(),
					sync_result: {
						error_message: error.message
					}
				});
		}

		console.error(`获取行程安排失败 [订单快照URL: ${snapshot_url}]:`, error);
		return {
			errCode: 'GET_SNAPSHOT_ITINERARY_FAILED',
			errMsg: `获取行程安排失败: ${error.message}`
		};
	}
}

// 全量同步商品数据
async function syncFullProduct(event, context) {
	const { productId, uniIdToken } = event;

	if (!productId) {
		return {
			errCode: 'MISSING_PRODUCT_ID',
			errMsg: '缺少商品ID参数'
		};
	}

	// 验证用户身份 - 管理端操作需要admin权限
	const uniIdInstance = uniIdCommon.createInstance({ context });
	let operatorId = 'system';
	let userRole = [];

	if (uniIdToken) {
		try {
			const checkResult = await uniIdInstance.checkToken(uniIdToken, {
				autoRefresh: true
			});

			if (checkResult.errCode !== 0) {
				return {
					errCode: 'TOKEN_INVALID',
					errMsg: `身份验证失败: ${checkResult.errMsg || '无效token'}`
				};
			}

			operatorId = checkResult.uid;
			userRole = checkResult.role || [];

			// 检查是否有admin权限（可选，根据业务需求决定）
			console.log(`用户身份验证成功: uid=${operatorId}, role=${JSON.stringify(userRole)}`);
		} catch (error) {
			console.error('Token验证失败:', error);
			return {
				errCode: 'TOKEN_CHECK_ERROR',
				errMsg: `Token验证异常: ${error.message}`
			};
		}
	} else {
		console.log('未提供token，使用系统身份执行同步操作');
	}

	const db = uniCloud.databaseForJQL({ clientInfo: event.clientInfo });
	let syncLogId = null;

	try {
		// 首先获取或创建商品记录以获取 product_id
		let productRecordId = null;
		const existingProduct = await db.collection('a-products').where(`ctrip_id == '${productId}'`).get();

		if (existingProduct.data.length > 0) {
			productRecordId = existingProduct.data[0]._id;
		} else {
			// 如果商品不存在，先获取商品详情并创建记录
			const productDetailResult = await getProductDetail({ productId });
			if (productDetailResult.errCode === 0) {
				const cleanedProductData = cleanDataForDatabase(productDetailResult.data);
				console.log(`[商品数据处理] 原始API数据字段:`, Object.keys(productDetailResult.data));

				// 详细字段映射和数据转换
				console.log(`[商品数据处理] 开始处理商品数据字段，产品ID: ${productId}`);
				console.log(`[商品数据处理] 清洗后数据字段:`, Object.keys(cleanedProductData));

				// 价格处理
				const processPrice = (priceStr) => {
					if (!priceStr) return 0;
					const cleanPrice = priceStr
						.toString()
						.replace(/[￥¥,元]/g, '')
						.trim();
					const price = parseFloat(cleanPrice) || 0;
					console.log(`[商品数据处理] 价格转换: "${priceStr}" => ${price}`);
					return price;
				};

				// 处理成人价格和儿童价格
				const adultPrice = processPrice(cleanedProductData.price || cleanedProductData.adult_price);
				const childPriceRaw = processPrice(cleanedProductData.child_price || cleanedProductData.children_price);
				const childPrice = childPriceRaw > 0 ? childPriceRaw : Math.round(adultPrice * 0.8); // 如果没有儿童价格，默认为成人价格的80%

				console.log(`[商品数据处理] 价格计算完成: 成人价=${adultPrice}, 儿童价=${childPrice} ${childPriceRaw > 0 ? '(API提供)' : '(自动计算80%)'}`);

				// 生成随机统计数据
				const randomValues = generateRandomValues();

				// 评分处理 - 优先使用API数据，否则使用随机值
				const processRating = (ratingData) => {
					if (!ratingData) return randomValues.rating;
					if (typeof ratingData === 'number') {
						const rating = Math.min(Math.max(ratingData, 0), 5);
						return rating > 0 ? rating : randomValues.rating;
					}
					if (typeof ratingData === 'string') {
						const rating = parseFloat(ratingData) || 0;
						return rating > 0 ? Math.min(Math.max(rating, 0), 5) : randomValues.rating;
					}
					return randomValues.rating;
				};

				// 目的地提取
				const extractDestination = (title) => {
					if (!title) return '';
					// 从标题中提取常见目的地
					const destinations = [
						'西藏',
						'新疆',
						'云南',
						'四川',
						'青海',
						'甘肃',
						'内蒙古',
						'北京',
						'上海',
						'广州',
						'深圳',
						'杭州',
						'苏州',
						'成都',
						'重庆',
						'西安',
						'南京',
						'武汉',
						'长沙',
						'厦门',
						'三亚',
						'大理',
						'丽江',
						'桂林'
					];
					for (const dest of destinations) {
						if (title.includes(dest)) {
							return dest;
						}
					}
					return '';
				};

				// 分类推断
				const inferCategory = (title, features) => {
					if (!title) return '国内游';
					const titleLower = title.toLowerCase();
					const featuresStr = Array.isArray(features) ? features.join('') : '';

					if (title.includes('出境') || title.includes('国外') || title.includes('海外')) return '出境游';
					if (title.includes('周边') || title.includes('一日游') || title.includes('二日游')) return '周边游';
					if (title.includes('自由行') || featuresStr.includes('自由行')) return '自由行';
					if (title.includes('跟团') || featuresStr.includes('跟团')) return '跟团游';
					if (title.includes('精品') || featuresStr.includes('精品') || featuresStr.includes('高端')) return '精品推荐';

					return '国内游';
				};

				// 标签提取
				const extractTags = (features, title) => {
					const tags = [];
					if (Array.isArray(features)) {
						features.forEach((feature) => {
							if (typeof feature === 'string') {
								if (feature.includes('热门') || feature.includes('爆款')) tags.push('热门');
								if (feature.includes('特价') || feature.includes('优惠')) tags.push('特价');
								if (feature.includes('新品') || feature.includes('新线')) tags.push('新品');
								if (feature.includes('精品') || feature.includes('高端')) tags.push('精品');
							}
						});
					}

					if (title) {
						if (title.includes('热门')) tags.push('热门');
						if (title.includes('特价')) tags.push('特价');
						if (title.includes('新品')) tags.push('新品');
					}

					return [...new Set(tags)]; // 去重
				};

				const productRecord = sanitizeStringFields(
					{
						ctrip_id: productId,
						title: cleanedProductData.title || '',
						subtitle: cleanedProductData.subtitle || cleanedProductData.sub_title || '',
						route_title: cleanedProductData.route_title || '',
						route_overview: cleanedProductData.route_overview || {},

						// 价格字段处理
						price: adultPrice,
						child_price: childPrice,

						// 天数和评分
						duration_days: cleanedProductData.duration_days || extractDaysFromTitle(cleanedProductData.title) || 1,
						rating: processRating(cleanedProductData.rating || cleanedProductData.score),

						// 图片数组
						product_images: Array.isArray(cleanedProductData.product_images)
							? cleanedProductData.product_images
							: Array.isArray(cleanedProductData.images)
							? cleanedProductData.images
							: [],
						detail_images: Array.isArray(cleanedProductData.detail_images)
							? cleanedProductData.detail_images
							: Array.isArray(cleanedProductData.detail_imgs)
							? cleanedProductData.detail_imgs
							: [],

						// 特色亮点
						features: Array.isArray(cleanedProductData.features) ? cleanedProductData.features : Array.isArray(cleanedProductData.highlights) ? cleanedProductData.highlights : [],

						// 概览信息
						overview: cleanedProductData.overview || cleanedProductData.summary || {},

						// 费用说明
						cost_info: cleanedProductData.cost_info || cleanedProductData.price_info || {},

						// 分类和目的地
						category: inferCategory(cleanedProductData.title, cleanedProductData.features),
						destination: extractDestination(cleanedProductData.title),

						// 标签
						tags: extractTags(cleanedProductData.features, cleanedProductData.title),

						// 状态和排序
						status: 1, // 上架状态
						sort_order: 0,

						// 统计字段 - 优先使用API数据，否则使用随机值
						view_count: cleanedProductData.view_count || randomValues.viewCount,
						sales_count: cleanedProductData.sales_count || randomValues.salesCount,
						review_count: cleanedProductData.review_count || cleanedProductData.comment_count || randomValues.reviewCount,

						// 时间戳
						crawl_timestamp: new Date().toISOString()
					},
					['title', 'subtitle']
				);

				console.log(`[商品数据处理] 处理后的产品记录字段:`, Object.keys(productRecord));
				console.log(`[商品数据处理] 价格信息: 成人价=${productRecord.price}, 儿童价=${productRecord.child_price}`);
				console.log(`[商品数据处理] 分类信息: 分类=${productRecord.category}, 目的地=${productRecord.destination}`);
				console.log(`[商品数据处理] 图片数量: 主图=${productRecord.product_images.length}, 详情图=${productRecord.detail_images.length}`);
				console.log(`[商品数据处理] 特色数量: ${productRecord.features.length}, 标签: [${productRecord.tags.join(', ')}]`);
				console.log(
					`[商品数据处理] 统计数据: 评分=${productRecord.rating}, 浏览=${productRecord.view_count}, 销量=${productRecord.sales_count}, 评价=${productRecord.review_count}`
				);

				try {
					const productResult = await db.collection('a-products').add(productRecord);
					productRecordId = productResult.id;
				} catch (error) {
					if (error.message && error.message.includes('ctrip_id_unique')) {
						const retryProduct = await db.collection('a-products').where(`ctrip_id == '${productId}'`).get();
						if (retryProduct.data.length > 0) {
							productRecordId = retryProduct.data[0]._id;
						}
					} else {
						throw error;
					}
				}
			}
		}

		// 创建同步日志记录 - 包含 product_id 外键
		const syncLogResult = await db.collection('a-ctrip-sync-logs').add({
			ctrip_id: productId,
			product_id: productRecordId, // 外键关联到 a-products._id
			sync_type: 'full_sync',
			sync_status: 'syncing',
			operator_id: operatorId
		});

		syncLogId = syncLogResult.id;

		// 并行获取行程安排和预订须知（商品详情已在前端获取）
		const [itineraryResult, bookingResult] = await Promise.allSettled([getProductItinerary({ productId }), getBookingNote({ productId })]);

		let successCount = 0;
		let failedCount = 0;
		const syncResults = {
			product_detail: 'skipped', // 商品详情已在前端获取，跳过
			itinerary: 'pending',
			booking_policies: 'pending'
		};

		// 处理行程安排
		console.log(`[行程安排同步] 开始处理行程安排数据，产品ID: ${productId}`);
		if (itineraryResult.status === 'fulfilled' && itineraryResult.value.errCode === 0) {
			const rawItineraryData = itineraryResult.value.data;
			console.log(`[行程安排同步] 获取到的原始行程数据字段:`, Object.keys(rawItineraryData));

			// 清洗行程数据，移除特殊字符
			const cleanedItineraryData = cleanDataForDatabase(rawItineraryData);
			console.log(`[行程安排同步] 清洗后的行程数据字段:`, Object.keys(cleanedItineraryData));

			// 获取商品详情信息用于补充缺失的行程字段
			let productDetailData = null;
			if (productRecordId) {
				try {
					const productDetail = await db.collection('a-products').doc(productRecordId).get();
					if (productDetail.data.length > 0) {
						productDetailData = productDetail.data[0];
						console.log(`[行程安排同步] 获取到商品详情数据用于补充行程字段`);
					}
				} catch (error) {
					console.warn(`[行程安排同步] 获取商品详情失败，将使用默认值:`, error);
				}
			}

			// 保存或更新行程信息
			const existingItinerary = await db.collection('a-itineraries').where(`ctrip_id == '${productId}'`).get();

			// 从商品详情补充缺失的字段
			const fallbackTitle = productDetailData?.title || '';
			const fallbackSubTitle = productDetailData?.subtitle || '';
			const fallbackTotalDays = productDetailData?.duration_days || extractDaysFromTitle(fallbackTitle) || 1;
			const fallbackDuration = productDetailData?.duration_days || fallbackTotalDays;

			// 处理 duration 字段，确保为数字类型
			const processDuration = (durationValue) => {
				if (typeof durationValue === 'number') {
					return durationValue;
				}
				if (typeof durationValue === 'string') {
					const parsed = parseInt(durationValue.replace(/[^0-9]/g, ''));
					return parsed > 0 ? parsed : fallbackTotalDays;
				}
				return fallbackTotalDays;
			};

			const finalDuration = cleanedItineraryData.duration ? processDuration(cleanedItineraryData.duration) : fallbackDuration;

			console.log(`[行程安排同步] 字段补充策略:`);
			console.log(`  - title: ${cleanedItineraryData.title || '(缺失)'} => ${cleanedItineraryData.title || fallbackTitle}`);
			console.log(`  - sub_title: ${cleanedItineraryData.sub_title || '(缺失)'} => ${cleanedItineraryData.sub_title || fallbackSubTitle}`);
			console.log(`  - total_days: ${cleanedItineraryData.total_days || '(缺失)'} => ${cleanedItineraryData.total_days || fallbackTotalDays}`);
			console.log(`  - duration: ${cleanedItineraryData.duration || '(缺失)'} => ${finalDuration} (数字类型)`);

			const itineraryRecord = {
				ctrip_id: productId,
				product_id: productRecordId, // 使用获取到的商品记录ID
				itinerary: cleanedItineraryData.itinerary || [],
				total_days: cleanedItineraryData.total_days || fallbackTotalDays,
				title: cleanedItineraryData.title || fallbackTitle,
				sub_title: cleanedItineraryData.sub_title || fallbackSubTitle,
				duration: finalDuration,
				remarks: cleanedItineraryData.remarks || '',
				metadata: {
					extracted_at: new Date().toISOString(),
					source_url: cleanedItineraryData.source_url || '',
					data_source: cleanedItineraryData.title ? 'itinerary_api' : 'product_detail_fallback'
				},
				status: 'active'
			};

			console.log(`[行程安排同步] 行程记录字段:`, Object.keys(itineraryRecord));
			console.log(`[行程安排同步] 行程天数: ${itineraryRecord.total_days}, 行程项目数量: ${itineraryRecord.itinerary.length}`);

			try {
				if (existingItinerary.data.length > 0) {
					console.log(`[行程安排同步] 更新现有行程记录，ID: ${existingItinerary.data[0]._id}`);
					await db.collection('a-itineraries').doc(existingItinerary.data[0]._id).update(itineraryRecord);
				} else {
					console.log(`[行程安排同步] 创建新行程记录`);
					await db.collection('a-itineraries').add(itineraryRecord);
				}

				successCount++;
				syncResults.itinerary = 'success';
				console.log(`[行程安排同步] 行程安排同步成功，产品ID: ${productId}`);
			} catch (error) {
				console.error(`[行程安排同步] 行程安排保存失败:`, error);

				// 检查是否为唯一约束冲突
				if (error.message && error.message.includes('product_id_unique')) {
					console.log(`[行程安排同步] 行程安排已存在，视为同步成功: ${productId}`);
					successCount++;
					syncResults.itinerary = 'success';
				} else {
					failedCount++;
					syncResults.itinerary = 'failed';
				}
			}
		} else {
			failedCount++;
			syncResults.itinerary = 'failed';
			console.error(`[行程安排同步] 行程安排获取失败:`, itineraryResult.reason?.message || '未知错误');
			console.error(`[行程安排同步] 失败状态:`, itineraryResult.status);
			if (itineraryResult.value) {
				console.error(`[行程安排同步] 错误响应:`, itineraryResult.value);
			}
		}

		// 处理预订须知
		console.log(`[预订须知同步] 开始处理预订须知数据，产品ID: ${productId}`);
		if (bookingResult.status === 'fulfilled' && bookingResult.value.errCode === 0) {
			const rawBookingData = bookingResult.value.data;
			console.log(`[预订须知同步] 获取到的原始预订须知数据字段:`, Object.keys(rawBookingData));

			// 清洗预订须知数据，移除特殊字符
			const cleanedBookingData = cleanDataForDatabase(rawBookingData);
			console.log(`[预订须知同步] 清洗后的预订须知数据字段:`, Object.keys(cleanedBookingData));

			// 保存或更新预订须知
			const existingBooking = await db.collection('a-booking-policies').where(`ctrip_id == '${productId}'`).get();

			const bookingRecord = {
				ctrip_id: productId,
				product_id: productRecordId, // 使用获取到的商品记录ID
				travel_agency_info: cleanedBookingData.travel_agency_info || {},
				booking_restrictions: cleanedBookingData.booking_restrictions || {},
				accommodation_policy: cleanedBookingData.accommodation_policy || {},
				group_info: cleanedBookingData.group_info || {},
				booking_requirements: cleanedBookingData.booking_requirements || [],
				violation_terms: cleanedBookingData.violation_terms || {},
				travel_guide: cleanedBookingData.travel_guide || [],
				safety_tips: cleanedBookingData.safety_tips || [],
				protection_tips: cleanedBookingData.protection_tips || [],
				payment_info: cleanedBookingData.payment_info || {},
				status: 'active'
			};

			console.log(`[预订须知同步] 预订须知记录字段:`, Object.keys(bookingRecord));
			console.log(`[预订须知同步] 预订要求数量: ${bookingRecord.booking_requirements.length}`);
			console.log(`[预订须知同步] 旅游指南数量: ${bookingRecord.travel_guide.length}`);
			console.log(`[预订须知同步] 安全提示数量: ${bookingRecord.safety_tips.length}`);

			try {
				if (existingBooking.data.length > 0) {
					console.log(`[预订须知同步] 更新现有预订须知记录，ID: ${existingBooking.data[0]._id}`);
					await db.collection('a-booking-policies').doc(existingBooking.data[0]._id).update(bookingRecord);
				} else {
					console.log(`[预订须知同步] 创建新预订须知记录`);
					await db.collection('a-booking-policies').add(bookingRecord);
				}

				successCount++;
				syncResults.booking_policies = 'success';
				console.log(`[预订须知同步] 预订须知同步成功，产品ID: ${productId}`);
			} catch (error) {
				console.error(`[预订须知同步] 预订须知保存失败:`, error);

				// 检查是否为唯一约束冲突
				if (error.message && error.message.includes('product_id_unique')) {
					console.log(`[预订须知同步] 预订须知已存在，视为同步成功: ${productId}`);
					successCount++;
					syncResults.booking_policies = 'success';
				} else {
					failedCount++;
					syncResults.booking_policies = 'failed';
				}
			}
		} else {
			failedCount++;
			syncResults.booking_policies = 'failed';
			console.error(`[预订须知同步] 预订须知获取失败:`, bookingResult.reason?.message || '未知错误');
			console.error(`[预订须知同步] 失败状态:`, bookingResult.status);
			if (bookingResult.value) {
				console.error(`[预订须知同步] 错误响应:`, bookingResult.value);
			}
		}

		// 更新同步记录
		const finalStatus = failedCount === 0 ? 'success' : successCount === 0 ? 'failed' : 'success';
		console.log(`[同步完成] 全量同步完成，产品ID: ${productId}`);
		console.log(`[同步完成] 成功数量: ${successCount}, 失败数量: ${failedCount}`);
		console.log(`[同步完成] 最终状态: ${finalStatus}`);
		console.log(`[同步完成] 详细结果:`, syncResults);

		await db
			.collection('a-ctrip-sync-logs')
			.doc(syncLogId)
			.update({
				sync_status: finalStatus,
				end_time: Date.now(),
				sync_result: {
					success_count: successCount,
					failed_count: failedCount,
					details: syncResults
				}
			});

		return {
			errCode: 0,
			data: {
				syncLogId,
				successCount,
				failedCount,
				syncResults,
				status: finalStatus,
				productId: productRecordId
			}
		};
	} catch (error) {
		console.error('同步商品数据失败:', error);

		// 更新同步记录为失败状态
		if (syncLogId) {
			await db
				.collection('a-ctrip-sync-logs')
				.doc(syncLogId)
				.update({
					sync_status: 'failed',
					end_time: Date.now(),
					sync_result: {
						error_message: error.message
					}
				});
		}

		return {
			errCode: 'SYNC_FAILED',
			errMsg: '同步失败: ' + error.message
		};
	}
}

// 测试数据清洗功能
async function testDataCleaning(event, context) {
	const { testData } = event;

	if (!testData) {
		return {
			errCode: 'MISSING_TEST_DATA',
			errMsg: '缺少测试数据'
		};
	}

	try {
		console.log('原始测试数据:', JSON.stringify(testData, null, 2));

		// 测试随机数值生成
		const randomValues = generateRandomValues();
		console.log('随机数值测试:', randomValues);

		// 使用数据清洗函数清理测试数据
		const cleanedData = cleanDataForDatabase(testData);

		console.log('清洗后数据:', JSON.stringify(cleanedData, null, 2));

		// 比较清洗前后的差异
		const differences = [];

		function findDifferences(original, cleaned, path = '') {
			if (typeof original === 'string' && typeof cleaned === 'string') {
				if (original !== cleaned) {
					differences.push({
						path: path || 'root',
						original: original,
						cleaned: cleaned,
						removed_chars: original.length - cleaned.length
					});
				}
			} else if (Array.isArray(original) && Array.isArray(cleaned)) {
				original.forEach((item, index) => {
					findDifferences(item, cleaned[index], `${path}[${index}]`);
				});
			} else if (typeof original === 'object' && typeof cleaned === 'object') {
				Object.keys(original).forEach((key) => {
					const newPath = path ? `${path}.${key}` : key;
					findDifferences(original[key], cleaned[key], newPath);
				});
			}
		}

		findDifferences(testData, cleanedData);

		return {
			errCode: 0,
			data: {
				original: testData,
				cleaned: cleanedData,
				differences: differences,
				summary: {
					total_changes: differences.length,
					total_chars_removed: differences.reduce((sum, diff) => sum + diff.removed_chars, 0)
				}
			}
		};
	} catch (error) {
		console.error('数据清洗测试失败:', error);
		return {
			errCode: 'TEST_FAILED',
			errMsg: '数据清洗测试失败: ' + error.message
		};
	}
}
