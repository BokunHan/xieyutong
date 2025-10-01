'use strict';

exports.main = async (event, context) => {
	console.log('[地理编码云函数] 接收到请求:', JSON.stringify(event, null, 2))
	console.log('[地理编码云函数] 请求上下文:', {
		requestId: context.requestId,
		functionName: context.functionName,
		functionVersion: context.functionVersion,
		memory: context.memory,
		timeout: context.timeout
	})
	
	const { action, ...params } = event
	
	try {
		console.log('[地理编码云函数] 解析操作类型:', action)
		console.log('[地理编码云函数] 操作参数:', JSON.stringify(params, null, 2))
		
		let result
		const startTime = Date.now()
		
		switch (action) {
			case 'geocode':
				console.log('[地理编码云函数] 执行地理编码（地名转坐标）')
				result = await geocode(params)
				break
			case 'regeocode':
				console.log('[地理编码云函数] 执行逆地理编码（坐标转地名）')
				result = await regeocode(params)
				break
			case 'batchGeocode':
				console.log('[地理编码云函数] 执行批量地理编码')
				result = await batchGeocode(params)
				break
			case 'getLocationWithElevation':
				console.log('[地理编码云函数] 执行位置+海拔查询')
				result = await getLocationWithElevation(params)
				break
			case 'placeSearch':
				console.log('[地理编码云函数] 执行地点搜索')
				result = await placeSearch(params)
				break
			default:
				console.error('[地理编码云函数] 未知的操作类型:', action)
				return {
					errCode: 'INVALID_ACTION',
					errMsg: '不支持的操作类型',
					data: null
				}
		}
		
		const endTime = Date.now()
		const duration = endTime - startTime
		
		console.log(`[地理编码云函数] 操作执行完成，耗时: ${duration}ms`)
		console.log('[地理编码云函数] 返回结果状态码:', result.code)
		
		if (result.code === 200) {
			console.log('[地理编码云函数] 操作成功')
			if (result.data) {
				console.log('[地理编码云函数] 返回数据类型:', typeof result.data)
				if (result.data.results && Array.isArray(result.data.results)) {
					console.log('[地理编码云函数] 返回结果数量:', result.data.results.length)
				}
			}
			// 转换为统一的错误码格式
			return {
				errCode: 0,
				errMsg: result.message,
				data: result.data
			}
		} else {
			console.warn('[地理编码云函数] 操作失败:', result.message)
			return {
				errCode: result.code,
				errMsg: result.message,
				data: result.data
			}
		}
		
	} catch (error) {
		console.error('[地理编码云函数] 处理请求时发生异常:', error)
		console.error('[地理编码云函数] 异常堆栈:', error.stack)
		console.error('[地理编码云函数] 异常详情:', {
			name: error.name,
			message: error.message,
			code: error.code
		})
		return {
			errCode: 500,
			errMsg: '地理编码服务异常: ' + error.message,
			data: null
		}
	}
}

/**
 * 地理编码：地名转经纬度
 * @param {Object} params
 * @param {String} params.address - 地址信息（如：拉萨、林芝、北京市朝阳区）
 * @param {String} params.city - 指定查询城市（可选）
 */
async function geocode(params) {
	console.log('[地理编码云函数-地理编码] 开始地理编码:', JSON.stringify(params, null, 2))
	
	try {
		const { address, city } = params
		
		console.log('[地理编码云函数-地理编码] 查询地址:', address)
		console.log('[地理编码云函数-地理编码] 指定城市:', city || '未指定')
		
		if (!address) {
			console.warn('[地理编码云函数-地理编码] 地址信息为空')
			return {
				code: 400,
				message: '地址信息不能为空',
				data: null
			}
		}
		console.log('[地理编码云函数-地理编码] 参数验证通过')
		
		// 获取高德地图API Key (使用uni-config-center)
		console.log('[地理编码云函数-地理编码] 开始获取API配置')
		const createConfig = require('uni-config-center')
		const geocodingConfig = createConfig({
			pluginId: 'a-geocoding',
			defaultConfig: {
				amapApiKey: 'c79c3a382a1a0ee9d06889d1db95f7bd'
			}
		})
		
		const apiKey = geocodingConfig.config('amapApiKey')
		console.log('[地理编码云函数-地理编码] API Key配置状态:', apiKey ? '已配置' : '未配置')
		
		if (!apiKey) {
			console.error('[地理编码云函数-地理编码] 高德地图API Key未配置')
			return {
				code: 500,
				message: '地理编码服务配置错误',
				data: null
			}
		}
		
		// 构建请求URL
		let url = `https://restapi.amap.com/v3/geocode/geo?key=${apiKey}&address=${encodeURIComponent(address)}&output=JSON`
		if (city) {
			url += `&city=${encodeURIComponent(city)}`
		}
		
		console.log('[地理编码云函数-地理编码] 请求URL:', url.replace(apiKey, '***'))
		
		// 发起HTTP请求
		console.log('[地理编码云函数-地理编码] 开始发起API请求')
		const requestStartTime = Date.now()
		const response = await uniCloud.httpclient.request(url, {
			method: 'GET',
			timeout: 10000,
			dataType: 'json'
		})
		const requestEndTime = Date.now()
		
		console.log(`[地理编码云函数-地理编码] API请求完成，耗时: ${requestEndTime - requestStartTime}ms`)
		console.log('[地理编码云函数-地理编码] API响应状态:', response.status)
		console.log('[地理编码云函数-地理编码] API响应数据:', JSON.stringify(response.data, null, 2))
		
		if (response.status !== 200) {
			console.error('[地理编码云函数] API请求失败，状态码:', response.status)
			return {
				code: 500,
				message: '地理编码服务请求失败',
				data: null
			}
		}
		
		const geocodeData = response.data
		
		// 检查API返回状态
		if (geocodeData.status !== '1') {
			console.error('[地理编码云函数] 高德API返回错误:', {
				status: geocodeData.status,
				info: geocodeData.info
			})
			return {
				code: 500,
				message: geocodeData.info || '地理编码失败',
				data: {
					status: geocodeData.status,
					originalError: geocodeData
				}
			}
		}
		
		// 检查是否有结果
		if (!geocodeData.geocodes || geocodeData.geocodes.length === 0) {
			return {
				code: 404,
				message: '未找到该地址的地理位置信息',
				data: null
			}
		}
		
		// 格式化地理编码数据
		const formattedData = formatGeocodeData(geocodeData.geocodes, address)
		
		console.log('[地理编码云函数] 格式化后的数据:', formattedData)
		
		return {
			code: 200,
			message: '地理编码成功',
			data: formattedData
		}
		
	} catch (error) {
		console.error('[地理编码云函数] 地理编码失败:', error)
		return {
			code: 500,
			message: '地理编码服务异常: ' + error.message,
			data: null
		}
	}
}

/**
 * 逆地理编码：经纬度转地名
 * @param {Object} params
 * @param {Number} params.lat - 纬度
 * @param {Number} params.lng - 经度
 * @param {Number} params.radius - 搜索半径（米，默认1000）
 * @param {String} params.extensions - 返回结果控制（base/all，默认base）
 */
async function regeocode(params) {
	console.log('[地理编码云函数] 开始逆地理编码:', params)
	
	try {
		const { lat, lng, radius = 1000, extensions = 'base' } = params
		
		if (!lat || !lng) {
			return {
				code: 400,
				message: '经纬度信息不能为空',
				data: null
			}
		}
		
		// 获取高德地图API Key
		const createConfig = require('uni-config-center')
		const geocodingConfig = createConfig({
			pluginId: 'a-geocoding',
			defaultConfig: {
				amapApiKey: 'c79c3a382a1a0ee9d06889d1db95f7bd'
			}
		})
		
		const apiKey = geocodingConfig.config('amapApiKey')
		
		if (!apiKey) {
			console.error('[地理编码云函数] 高德地图API Key未配置')
			return {
				code: 500,
				message: '地理编码服务配置错误',
				data: null
			}
		}
		
		// 构建请求URL
		const location = `${lng},${lat}` // 高德API要求经度在前，纬度在后
		const url = `https://restapi.amap.com/v3/geocode/regeo?key=${apiKey}&location=${location}&radius=${radius}&extensions=${extensions}&output=JSON`
		
		console.log('[地理编码云函数] 请求URL:', url.replace(apiKey, '***'))
		
		// 发起HTTP请求
		const response = await uniCloud.httpclient.request(url, {
			method: 'GET',
			timeout: 10000,
			dataType: 'json'
		})
		
		console.log('[地理编码云函数] API响应状态:', response.status)
		console.log('[地理编码云函数] API响应数据:', response.data)
		
		if (response.status !== 200) {
			console.error('[地理编码云函数] API请求失败，状态码:', response.status)
			return {
				code: 500,
				message: '逆地理编码服务请求失败',
				data: null
			}
		}
		
		const regeocodeData = response.data
		
		// 检查API返回状态
		if (regeocodeData.status !== '1') {
			console.error('[地理编码云函数] 高德API返回错误:', {
				status: regeocodeData.status,
				info: regeocodeData.info
			})
			return {
				code: 500,
				message: regeocodeData.info || '逆地理编码失败',
				data: {
					status: regeocodeData.status,
					originalError: regeocodeData
				}
			}
		}
		
		// 格式化逆地理编码数据
		const formattedData = formatRegeocodeData(regeocodeData.regeocode, { lat, lng })
		
		console.log('[地理编码云函数] 格式化后的数据:', formattedData)
		
		return {
			code: 200,
			message: '逆地理编码成功',
			data: formattedData
		}
		
	} catch (error) {
		console.error('[地理编码云函数] 逆地理编码失败:', error)
		return {
			code: 500,
			message: '逆地理编码服务异常: ' + error.message,
			data: null
		}
	}
}

/**
 * 批量地理编码
 * @param {Object} params
 * @param {Array} params.addresses - 地址列表
 */
async function batchGeocode(params) {
	console.log('[地理编码云函数] 批量地理编码:', params)
	
	try {
		const { addresses = [] } = params
		
		if (!Array.isArray(addresses) || addresses.length === 0) {
			return {
				code: 400,
				message: '地址列表不能为空',
				data: null
			}
		}
		
		// 限制批量查询数量
		if (addresses.length > 10) {
			return {
				code: 400,
				message: '批量查询地址数量不能超过10个',
				data: null
			}
		}
		
		// 并发请求所有地址的地理编码
		const promises = addresses.map(async (address, index) => {
			try {
				const result = await geocode({ address })
				return {
					address: address,
					index: index,
					...result
				}
			} catch (error) {
				console.error(`[地理编码云函数] 获取${address}地理编码失败:`, error)
				return {
					address: address,
					index: index,
					code: 500,
					message: '获取失败',
					data: null
				}
			}
		})
		
		const geocodeResults = await Promise.all(promises)
		
		return {
			code: 200,
			message: '批量地理编码完成',
			data: geocodeResults
		}
		
	} catch (error) {
		console.error('[地理编码云函数] 批量地理编码失败:', error)
		return {
			code: 500,
			message: '批量地理编码服务异常: ' + error.message,
			data: null
		}
	}
}

/**
 * 获取地点位置信息并查询海拔（调用其他云函数）
 * @param {Object} params
 * @param {String} params.address - 地址信息
 * @param {String} params.city - 指定查询城市（可选）
 */
async function getLocationWithElevation(params) {
	console.log('[地理编码云函数] 获取地点位置和海拔信息:', params)
	
	try {
		// 1. 先进行地理编码获取经纬度
		const geocodeResult = await geocode(params)
		
		if (geocodeResult.code !== 200) {
			return geocodeResult
		}
		
		const locationData = geocodeResult.data
		const firstResult = locationData.results[0]
		
		if (!firstResult || !firstResult.location) {
			return {
				code: 404,
				message: '未找到该地址的地理位置信息',
				data: null
			}
		}
		
		// 2. 调用海拔云函数获取海拔信息
		console.log('[地理编码云函数-位置海拔查询] 开始调用海拔云函数')
		console.log('[地理编码云函数-位置海拔查询] 查询坐标:', {
			lat: firstResult.location.lat,
			lng: firstResult.location.lng
		})
		
		const elevationCallStartTime = Date.now()
		const elevationResult = await uniCloud.callFunction({
			name: 'a-elevation',
			data: {
				action: 'getElevationForLocations',
				locations: [{
					lat: firstResult.location.lat,
					lng: firstResult.location.lng
				}]
			}
		})
		const elevationCallEndTime = Date.now()
		
		console.log(`[地理编码云函数-位置海拔查询] 海拔云函数调用完成，耗时: ${elevationCallEndTime - elevationCallStartTime}ms`)
		console.log('[地理编码云函数-位置海拔查询] 海拔查询结果:', JSON.stringify(elevationResult, null, 2))
		
		// 3. 合并地理编码和海拔数据
		const combinedData = {
			...locationData,
			elevation: elevationResult.result?.data || null,
			elevationStatus: elevationResult.result?.errCode || 500
		}
		
		// 4. 为第一个结果添加海拔信息
		if (elevationResult.result?.errCode === 0 && elevationResult.result.data?.results?.[0]) {
			const elevationInfo = elevationResult.result.data.results[0]
			combinedData.results[0].elevation = elevationInfo.elevation
			combinedData.results[0].elevationFormatted = elevationInfo.formatted.elevationText
		}
		
		return {
			code: 200,
			message: '获取地点位置和海拔信息成功',
			data: combinedData
		}
		
	} catch (error) {
		console.error('[地理编码云函数] 获取地点位置和海拔信息失败:', error)
		return {
			code: 500,
			message: '获取地点位置和海拔信息异常: ' + error.message,
			data: null
		}
	}
}

/**
 * 地点搜索：根据关键词搜索地点
 * @param {Object} params
 * @param {String} params.keywords - 搜索关键词（如：酒店、餐厅、景点名称等）
 * @param {String} params.types - 地点类型过滤（可选，如：120000|130000）
 * @param {String} params.city - 指定搜索城市（可选）
 * @param {String} params.location - 中心点坐标（可选，格式：lng,lat）
 * @param {Number} params.radius - 搜索半径（米，默认3000）
 * @param {Number} params.page - 页码（默认1）
 * @param {Number} params.pageSize - 每页数量（默认10，最大25）
 */
async function placeSearch(params) {
	console.log('[地理编码云函数-地点搜索] 开始地点搜索:', JSON.stringify(params, null, 2))
	
	try {
		const { 
			keywords, 
			types = '', 
			city = '', 
			location = '', 
			radius = 3000, 
			page = 1, 
			pageSize = 10 
		} = params
		
		console.log('[地理编码云函数-地点搜索] 搜索关键词:', keywords)
		console.log('[地理编码云函数-地点搜索] 地点类型:', types || '未指定')
		console.log('[地理编码云函数-地点搜索] 指定城市:', city || '未指定')
		
		if (!keywords || keywords.trim() === '') {
			console.warn('[地理编码云函数-地点搜索] 搜索关键词为空')
			return {
				code: 400,
				message: '搜索关键词不能为空',
				data: null
			}
		}
		
		// 验证页码和每页数量
		const validPage = Math.max(1, parseInt(page) || 1)
		const validPageSize = Math.min(25, Math.max(1, parseInt(pageSize) || 10))
		
		console.log('[地理编码云函数-地点搜索] 参数验证通过')
		
		// 获取高德地图API Key (使用uni-config-center)
		console.log('[地理编码云函数-地点搜索] 开始获取API配置')
		const createConfig = require('uni-config-center')
		const geocodingConfig = createConfig({
			pluginId: 'a-geocoding',
			defaultConfig: {
				amapApiKey: 'c79c3a382a1a0ee9d06889d1db95f7bd'
			}
		})
		
		const apiKey = geocodingConfig.config('amapApiKey')
		console.log('[地理编码云函数-地点搜索] API Key配置状态:', apiKey ? '已配置' : '未配置')
		
		if (!apiKey) {
			console.error('[地理编码云函数-地点搜索] 高德地图API Key未配置')
			return {
				code: 500,
				message: '地点搜索服务配置错误',
				data: null
			}
		}
		
		// 构建请求URL
		let url = `https://restapi.amap.com/v3/place/text?key=${apiKey}&keywords=${encodeURIComponent(keywords)}&output=JSON&page=${validPage}&limit=${validPageSize}`
		
		if (types) {
			url += `&types=${encodeURIComponent(types)}`
		}
		
		if (city) {
			url += `&city=${encodeURIComponent(city)}`
		}
		
		if (location) {
			url += `&location=${encodeURIComponent(location)}&radius=${radius}`
		}
		
		console.log('[地理编码云函数-地点搜索] 请求URL:', url.replace(apiKey, '***'))
		
		// 发起HTTP请求
		console.log('[地理编码云函数-地点搜索] 开始发起API请求')
		const requestStartTime = Date.now()
		const response = await uniCloud.httpclient.request(url, {
			method: 'GET',
			timeout: 10000,
			dataType: 'json'
		})
		const requestEndTime = Date.now()
		
		console.log(`[地理编码云函数-地点搜索] API请求完成，耗时: ${requestEndTime - requestStartTime}ms`)
		console.log('[地理编码云函数-地点搜索] API响应状态:', response.status)
		console.log('[地理编码云函数-地点搜索] API响应数据:', JSON.stringify(response.data, null, 2))
		
		if (response.status !== 200) {
			console.error('[地理编码云函数-地点搜索] API请求失败，状态码:', response.status)
			return {
				code: 500,
				message: '地点搜索服务请求失败',
				data: null
			}
		}
		
		const searchData = response.data
		
		// 检查API返回状态
		if (searchData.status !== '1') {
			console.error('[地理编码云函数-地点搜索] 高德API返回错误:', {
				status: searchData.status,
				info: searchData.info
			})
			return {
				code: 500,
				message: searchData.info || '地点搜索失败',
				data: {
					status: searchData.status,
					originalError: searchData
				}
			}
		}
		
		// 检查是否有结果
		if (!searchData.pois || searchData.pois.length === 0) {
			return {
				code: 404,
				message: '未找到相关地点信息',
				data: {
					type: 'placeSearch',
					query: keywords,
					count: 0,
					results: [],
					pagination: {
						page: validPage,
						pageSize: validPageSize,
						total: 0
					}
				}
			}
		}
		
		// 格式化地点搜索数据
		const formattedData = formatPlaceSearchData(searchData, keywords, validPage, validPageSize)
		
		console.log('[地理编码云函数-地点搜索] 格式化后的数据:', formattedData)
		
		return {
			code: 200,
			message: '地点搜索成功',
			data: formattedData
		}
		
	} catch (error) {
		console.error('[地理编码云函数-地点搜索] 地点搜索失败:', error)
		return {
			code: 500,
			message: '地点搜索服务异常: ' + error.message,
			data: null
		}
	}
}

/**
 * 格式化地点搜索数据
 * @param {Object} searchData - 高德API返回的原始搜索数据
 * @param {String} keywords - 原始搜索关键词
 * @param {Number} page - 当前页码
 * @param {Number} pageSize - 每页数量
 */
function formatPlaceSearchData(searchData, keywords, page, pageSize) {
	console.log('[地理编码云函数] 开始格式化地点搜索数据')
	
	try {
		const pois = searchData.pois || []
		const count = parseInt(searchData.count) || pois.length
		
		const formattedResults = pois.map((poi, index) => {
			// 处理坐标
			let location = { lat: 0, lng: 0 }
			if (poi.location) {
				const [lng, lat] = poi.location.split(',').map(Number)
				location = { lat, lng }
			}
			
			return {
				id: poi.id || '',
				name: poi.name || '',
				type: poi.type || '',
				typecode: poi.typecode || '',
				location: location,
				address: poi.address || '',
				pname: poi.pname || '', // 省份
				cityname: poi.cityname || '', // 城市
				adname: poi.adname || '', // 区域
				business_area: poi.business_area || '', // 商圈
				tel: poi.tel || '', // 电话
				distance: poi.distance || '', // 距离（当提供location参数时）
				formatted: {
					coordinates: location.lat && location.lng ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : '',
					fullAddress: `${String(poi.pname || '')}${String(poi.cityname || '')}${String(poi.adname || '')}${String(poi.address || '')}`,
					shortAddress: `${String(poi.cityname || '')}${String(poi.adname || '')}`,
					displayName: poi.name || '',
					category: getPlaceTypeDescription(poi.typecode)
				},
				// 原始数据（用于调试）
				_raw: poi
			}
		})
		
		return {
			type: 'placeSearch',
			query: keywords,
			count: count,
			results: formattedResults,
			pagination: {
				page: page,
				pageSize: pageSize,
				total: count,
				totalPages: Math.ceil(count / pageSize),
				hasNext: count > page * pageSize
			},
			suggestion: searchData.suggestion || null
		}
		
	} catch (error) {
		console.error('[地理编码云函数] 格式化地点搜索数据失败:', error)
		throw error
	}
}

/**
 * 获取地点类型描述
 */
function getPlaceTypeDescription(typecode) {
	// 高德地图POI分类编码
	const typeMap = {
		'010000': '汽车服务',
		'020000': '汽车销售',
		'030000': '汽车维修',
		'040000': '摩托车服务',
		'050000': '餐饮服务',
		'060000': '购物服务',
		'070000': '生活服务',
		'080000': '体育休闲服务',
		'090000': '医疗保健服务',
		'100000': '住宿服务',
		'110000': '风景名胜',
		'120000': '商务住宅',
		'130000': '政府机构及社会团体',
		'140000': '科教文化服务',
		'150000': '交通设施服务',
		'160000': '金融保险服务',
		'170000': '公司企业',
		'180000': '道路附属设施',
		'190000': '地名地址信息',
		'200000': '公共设施'
	}
	
	if (!typecode) return '未知类型'
	
	// 取前6位匹配大类
	const mainType = typecode.substring(0, 6)
	return typeMap[mainType] || `类型代码：${typecode}`
}

/**
 * 格式化地理编码数据
 * @param {Array} geocodes - 高德API返回的原始数据
 * @param {String} originalAddress - 原始查询地址
 */
function formatGeocodeData(geocodes, originalAddress) {
	console.log('[地理编码云函数] 开始格式化地理编码数据')
	
	try {
		const formattedResults = geocodes.map((geocode, index) => {
			const [lng, lat] = geocode.location.split(',').map(Number)
			
			return {
				location: {
					lat: lat,
					lng: lng
				},
				formatted_address: geocode.formatted_address || buildFormattedAddress(geocode),
				country: geocode.country || '中国',
				province: geocode.province || '',
				city: geocode.city || '',
				district: geocode.district || '',
				street: geocode.street || '',
				number: geocode.number || '',
				adcode: geocode.adcode || '',
				citycode: geocode.citycode || '',
				level: geocode.level || '',
				confidence: index === 0 ? 'high' : 'medium', // 第一个结果置信度最高
				formatted: {
					coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
					fullAddress: buildFormattedAddress(geocode),
					shortAddress: `${String(geocode.city || '')}${String(geocode.district || '')}`,
					level: getLevelDescription(geocode.level)
				}
			}
		})
		
		return {
			type: 'geocode',
			query: originalAddress,
			count: geocodes.length,
			results: formattedResults,
			bestMatch: formattedResults[0] || null
		}
		
	} catch (error) {
		console.error('[地理编码云函数] 格式化地理编码数据失败:', error)
		throw error
	}
}

/**
 * 格式化逆地理编码数据
 * @param {Object} regeocode - 高德API返回的原始数据
 * @param {Object} originalLocation - 原始查询坐标
 */
function formatRegeocodeData(regeocode, originalLocation) {
	console.log('[地理编码云函数] 开始格式化逆地理编码数据')
	
	try {
		const addressComponent = regeocode.addressComponent || {}
		const formattedAddress = regeocode.formatted_address || buildFormattedAddressFromComponent(addressComponent)
		
		const result = {
			type: 'regeocode',
			query: originalLocation,
			location: originalLocation,
			formatted_address: formattedAddress,
			addressComponent: {
				country: addressComponent.country || '中国',
				province: addressComponent.province || '',
				city: addressComponent.city || '',
				district: addressComponent.district || '',
				township: addressComponent.township || '',
				street: addressComponent.streetNumber?.street || '',
				number: addressComponent.streetNumber?.number || '',
				adcode: addressComponent.adcode || '',
				citycode: addressComponent.citycode || ''
			},
			formatted: {
				coordinates: `${originalLocation.lat.toFixed(6)}, ${originalLocation.lng.toFixed(6)}`,
				fullAddress: formattedAddress,
				shortAddress: `${String(addressComponent.city || '')}${String(addressComponent.district || '')}`,
				adminLevel: `${String(addressComponent.province || '')} ${String(addressComponent.city || '')} ${String(addressComponent.district || '')}`.trim()
			}
		}
		
		// 如果有POI信息，添加到结果中
		if (regeocode.pois && regeocode.pois.length > 0) {
			result.nearbyPois = regeocode.pois.slice(0, 5).map(poi => ({
				name: poi.name,
				type: poi.type,
				distance: poi.distance,
				address: poi.address
			}))
		}
		
		return result
		
	} catch (error) {
		console.error('[地理编码云函数] 格式化逆地理编码数据失败:', error)
		throw error
	}
}

/**
 * 构建格式化地址
 */
function buildFormattedAddress(geocode) {
	const parts = [
		geocode.country,
		geocode.province,
		geocode.city,
		geocode.district,
		geocode.street,
		geocode.number
	].filter(part => part && typeof part === 'string' && part.trim())
	
	return parts.join('')
}

/**
 * 从地址组件构建格式化地址
 */
function buildFormattedAddressFromComponent(component) {
	const parts = [
		component.country,
		component.province,
		component.city,
		component.district,
		component.township,
		component.streetNumber?.street,
		component.streetNumber?.number
	].filter(part => part && typeof part === 'string' && part.trim())
	
	return parts.join('')
}

/**
 * 获取匹配级别描述
 */
function getLevelDescription(level) {
	const levelMap = {
		'国家': '国家级别',
		'省': '省级别',
		'市': '市级别',
		'区县': '区县级别',
		'乡镇': '乡镇级别',
		'村庄': '村庄级别',
		'道路': '道路级别',
		'兴趣点': '兴趣点级别',
		'门牌号': '门牌号级别'
	}
	
	return levelMap[level] || level || '未知级别'
}