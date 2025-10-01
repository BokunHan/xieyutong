'use strict';

const db = uniCloud.database();

// 公共函数：获取天气信息的核心逻辑
async function getWeatherCore(params, context) {
	console.log('[天气云函数-getWeatherCore] ========== 核心函数调用开始 ==========')
	console.log('[天气云函数-getWeatherCore] 接收参数:', JSON.stringify(params, null, 2))
	console.log('[天气云函数-getWeatherCore] context 信息:', JSON.stringify({
		requestId: context.requestId,
		function: context.function
	}, null, 2))

	try {
		const { city = '110000', extensions = 'all' } = params

		console.log('[天气云函数-getWeatherCore] 查询城市:', city)
		console.log('[天气云函数-getWeatherCore] 查询类型:', extensions)

		// 验证extensions参数 (官方文档：base/all)
		if (!['base', 'all'].includes(extensions)) {
			console.error('[天气云函数-getWeatherCore] extensions参数无效:', extensions)
			console.error('[天气云函数-getWeatherCore] 支持的extensions值: base, all')
			return {
				errCode: 'INVALID_EXTENSIONS',
				errMsg: 'extensions参数必须是base或all',
				data: null
			}
		}
		console.log('[天气云函数-getWeatherCore] 参数验证通过')

		// 高德地图API Key (使用uni-config-center)
		console.log('[天气云函数-getWeatherCore] 开始获取API配置')
		const createConfig = require('uni-config-center')
		const weatherConfig = createConfig({
			pluginId: 'a-weather',
			defaultConfig: {
				amapApiKey: 'c79c3a382a1a0ee9d06889d1db95f7bd'
			}
		})

		const apiKey = weatherConfig.config('amapApiKey')
		console.log('[天气云函数-getWeatherCore] API Key配置状态:', apiKey ? '已配置' : '未配置')
		console.log('[天气云函数-getWeatherCore] API Key长度:', apiKey ? apiKey.length : 0)

		if (!apiKey) {
			console.error('[天气云函数-getWeatherCore] 高德地图API Key未配置')
			console.error('[天气云函数-getWeatherCore] 请检查 uni-config-center 配置')
			return {
				errCode: 'API_KEY_NOT_CONFIGURED',
				errMsg: '天气服务配置错误',
				data: null
			}
		}

		// 构建请求URL (按照官方文档格式)
		const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${apiKey}&city=${encodeURIComponent(city)}&extensions=${extensions}&output=JSON`
		console.log('[天气云函数-getWeatherCore] 请求URL:', url.replace(apiKey, '***'))

		// 发起HTTP请求
		console.log('[天气云函数-getWeatherCore] 开始发起API请求')
		const requestStartTime = Date.now()
		
		let response;
		try {
			response = await uniCloud.httpclient.request(url, {
				method: 'GET',
				timeout: 10000,
				dataType: 'json'
			})
		} catch (httpError) {
			console.error('[天气云函数-getWeatherCore] HTTP请求异常:', httpError)
			console.error('[天气云函数-getWeatherCore] HTTP错误详情:', {
				message: httpError.message,
				code: httpError.code,
				status: httpError.status
			})
			return {
				errCode: 'HTTP_REQUEST_ERROR',
				errMsg: 'HTTP请求失败: ' + httpError.message,
				data: null
			}
		}
		
		const requestEndTime = Date.now()

		console.log(`[天气云函数-getWeatherCore] API请求完成，耗时: ${requestEndTime - requestStartTime}ms`)
		console.log('[天气云函数-getWeatherCore] API响应状态:', response.status)
		console.log('[天气云函数-getWeatherCore] API响应headers:', JSON.stringify(response.headers, null, 2))
		console.log('[天气云函数-getWeatherCore] API响应数据:', JSON.stringify(response.data, null, 2))

		if (response.status !== 200) {
			console.error('[天气云函数-getWeatherCore] API请求失败，状态码:', response.status)
			console.error('[天气云函数-getWeatherCore] 响应内容:', response.data)
			return {
				errCode: 'API_REQUEST_FAILED',
				errMsg: `天气服务请求失败，状态码: ${response.status}`,
				data: null
			}
		}

		const weatherData = response.data

		// 检查API返回状态 (官方文档：status为1表示成功，0表示失败)
		if (weatherData.status !== '1') {
			console.error('[天气云函数-getWeatherCore] 高德API返回错误:', {
				status: weatherData.status,
				info: weatherData.info,
				infocode: weatherData.infocode
			})
			console.error('[天气云函数-getWeatherCore] 完整错误响应:', weatherData)
			return {
				errCode: 'API_RESPONSE_ERROR',
				errMsg: weatherData.info || '天气数据获取失败',
				data: {
					infocode: weatherData.infocode,
					originalError: weatherData
				}
			}
		}

		console.log('[天气云函数-getWeatherCore] 高德API返回成功，开始格式化数据')
		// 格式化天气数据
		let formattedData;
		try {
			formattedData = formatWeatherData(weatherData, extensions)
			console.log('[天气云函数-getWeatherCore] 数据格式化成功')
		} catch (formatError) {
			console.error('[天气云函数-getWeatherCore] 数据格式化失败:', formatError)
			return {
				errCode: 'DATA_FORMAT_ERROR',
				errMsg: '天气数据格式化失败: ' + formatError.message,
				data: null
			}
		}

		console.log('[天气云函数-getWeatherCore] 格式化后的数据:', formattedData)
		console.log('[天气云函数-getWeatherCore] ========== 核心函数执行成功 ==========')

		return {
			errCode: 0,
			errMsg: '获取成功',
			data: formattedData
		}

	} catch (error) {
		console.error('[天气云函数-getWeatherCore] ========== 核心函数执行失败 ==========')
		console.error('[天气云函数-getWeatherCore] 获取天气信息失败:', error)
		console.error('[天气云函数-getWeatherCore] 错误堆栈:', error.stack)
		console.error('[天气云函数-getWeatherCore] 错误类型:', error.constructor.name)
		return {
			errCode: 'SYSTEM_ERROR',
			errMsg: '天气服务异常: ' + error.message,
			data: null
		}
	}
}

// 公共函数：格式化天气数据
function formatWeatherData(weatherData, extensions) {
	console.log('[天气云函数] 开始格式化天气数据')

	try {
		if (extensions === 'base') {
			// 实时天气数据格式化
			const live = weatherData.lives?.[0]
			if (!live) {
				throw new Error('实时天气数据为空')
			}

			return {
				type: 'live',
				city: live.city,
				province: live.province,
				adcode: live.adcode,
				weather: live.weather,
				temperature: live.temperature,
				winddirection: live.winddirection,
				windpower: live.windpower,
				humidity: live.humidity,
				reporttime: live.reporttime,
				formatted: {
					location: `${live.province} ${live.city}`,
					condition: live.weather,
					temp: `${live.temperature}°C`,
					humidity: `${live.humidity}%`,
					wind: `${live.winddirection}风 ${live.windpower}级`,
					updateTime: live.reporttime
				}
			}
		} else {
			// 预报天气数据格式化
			const forecast = weatherData.forecasts?.[0]
			if (!forecast) {
				throw new Error('预报天气数据为空')
			}

			const casts = forecast.casts || []
			const formattedCasts = casts.map((cast, index) => {
				const date = new Date(cast.date)
				const dayNames = ['今天', '明天', '后天']
				const dayName = index < 3 ? dayNames[index] : `${date.getMonth() + 1}月${date.getDate()}日`

				return {
					date: cast.date,
					dayName: dayName,
					week: cast.week,
					dayweather: cast.dayweather,
					nightweather: cast.nightweather,
					daytemp: cast.daytemp,
					nighttemp: cast.nighttemp,
					daywind: cast.daywind,
					nightwind: cast.nightwind,
					daypower: cast.daypower,
					nightpower: cast.nightpower,
					formatted: {
						date: `${date.getMonth() + 1}月${date.getDate()}日`,
						dayName: dayName,
						condition: cast.dayweather,
						tempRange: `${cast.nighttemp}°C ~ ${cast.daytemp}°C`,
						wind: `${cast.daywind} ${cast.daypower}级`
					}
				}
			})

			return {
				type: 'forecast',
				city: forecast.city,
				province: forecast.province,
				adcode: forecast.adcode,
				reporttime: forecast.reporttime,
				casts: formattedCasts,
				today: formattedCasts[0] || null,
				tomorrow: formattedCasts[1] || null
			}
		}
	} catch (error) {
		console.error('[天气云函数] 格式化天气数据失败:', error)
		throw error
	}
}

// 获取天气信息
async function getWeather(event, context) {
	console.log('[天气云函数-getWeather] ========== 函数调用开始 ==========');
	console.log('[天气云函数-getWeather] 接收到的 event 参数:', JSON.stringify(event, null, 2));
	console.log('[天气云函数-getWeather] context 信息:', JSON.stringify({
		requestId: context.requestId,
		function: context.function
	}, null, 2));
	
	const { city, extensions } = event;
	
	console.log('[天气云函数-getWeather] 解析参数 - city:', city);
	console.log('[天气云函数-getWeather] 解析参数 - extensions:', extensions);
	
	try {
		const result = await getWeatherCore({ city, extensions }, context);
		console.log('[天气云函数-getWeather] 调用 getWeatherCore 成功');
		console.log('[天气云函数-getWeather] 返回结果:', JSON.stringify(result, null, 2));
		return result;
	} catch (error) {
		console.error('[天气云函数-getWeather] 调用 getWeatherCore 失败:', error);
		return {
			errCode: 'SYSTEM_ERROR',
			errMsg: '获取天气信息失败: ' + error.message,
			data: null
		};
	}
}

// 根据城市名称获取天气信息
async function getWeatherByCityName(event, context) {
	console.log('[天气云函数-getWeatherByCityName] ========== 函数调用开始 ==========');
	console.log('[天气云函数-getWeatherByCityName] 接收到的 event 参数:', JSON.stringify(event, null, 2));
	console.log('[天气云函数-getWeatherByCityName] context 信息:', JSON.stringify({
		requestId: context.requestId,
		function: context.function
	}, null, 2));

	try {
		const { cityName, extensions = 'all' } = event
		
		console.log('[天气云函数-getWeatherByCityName] 解析参数 - cityName:', cityName);
		console.log('[天气云函数-getWeatherByCityName] 解析参数 - extensions:', extensions);

		if (!cityName) {
			console.error('[天气云函数-getWeatherByCityName] 城市名称为空');
			return {
				errCode: 'CITY_NAME_REQUIRED',
				errMsg: '城市名称不能为空',
				data: null
			}
		}

		console.log('[天气云函数-getWeatherByCityName] 准备调用 getWeatherCore');
		// 直接使用城市名称调用天气API
		const result = await getWeatherCore({
			city: cityName,
			extensions: extensions
		}, context)
		
		console.log('[天气云函数-getWeatherByCityName] 调用 getWeatherCore 成功');
		console.log('[天气云函数-getWeatherByCityName] 返回结果:', JSON.stringify(result, null, 2));
		return result;

	} catch (error) {
		console.error('[天气云函数-getWeatherByCityName] 处理失败:', error)
		return {
			errCode: 'SYSTEM_ERROR',
			errMsg: '天气服务异常: ' + error.message,
			data: null
		}
	}
}

// 批量获取多个城市的天气信息
async function getBatchWeather(event, context) {
	console.log('[天气云函数-getBatchWeather] ========== 函数调用开始 ==========');
	console.log('[天气云函数-getBatchWeather] 接收到的 event 参数:', JSON.stringify(event, null, 2));
	console.log('[天气云函数-getBatchWeather] context 信息:', JSON.stringify({
		requestId: context.requestId,
		function: context.function
	}, null, 2));

	try {
		const { cities = [], extensions = 'base' } = event
		
		console.log('[天气云函数-getBatchWeather] 解析参数 - cities:', JSON.stringify(cities, null, 2));
		console.log('[天气云函数-getBatchWeather] 解析参数 - extensions:', extensions);
		console.log('[天气云函数-getBatchWeather] 城市数量:', cities.length);

		if (!Array.isArray(cities) || cities.length === 0) {
			console.error('[天气云函数-getBatchWeather] 城市列表为空或不是数组');
			return {
				errCode: 'CITIES_REQUIRED',
				errMsg: '城市列表不能为空',
				data: null
			}
		}

		// 限制批量查询数量
		if (cities.length > 10) {
			console.error('[天气云函数-getBatchWeather] 城市数量超过限制:', cities.length);
			return {
				errCode: 'TOO_MANY_CITIES',
				errMsg: '批量查询城市数量不能超过10个',
				data: null
			}
		}

		console.log('[天气云函数-getBatchWeather] 开始并发请求天气数据');
		// 并发请求所有城市的天气
		const promises = cities.map(async (cityInfo, index) => {
			console.log(`[天气云函数-getBatchWeather] 处理第 ${index + 1} 个城市:`, cityInfo);
			try {
				const city = cityInfo.code || cityInfo.name
				console.log(`[天气云函数-getBatchWeather] 城市 ${index + 1} - 使用标识:`, city);
				
				const result = await getWeatherCore({ city, extensions }, context)
				console.log(`[天气云函数-getBatchWeather] 城市 ${index + 1} - 获取成功`);
				
				return {
					city: cityInfo.name || city,
					...result
				}
			} catch (error) {
				console.error(`[天气云函数-getBatchWeather] 获取第 ${index + 1} 个城市 ${cityInfo.name} 天气失败:`, error)
				return {
					city: cityInfo.name || cityInfo.code,
					errCode: 'SYSTEM_ERROR',
					errMsg: '获取失败',
					data: null
				}
			}
		})

		const weatherResults = await Promise.all(promises)
		console.log('[天气云函数-getBatchWeather] 所有城市天气获取完成');
		console.log('[天气云函数-getBatchWeather] 批量结果:', JSON.stringify(weatherResults, null, 2));

		return {
			errCode: 0,
			errMsg: '批量获取完成',
			data: weatherResults
		}

	} catch (error) {
		console.error('[天气云函数-getBatchWeather] 批量获取天气失败:', error)
		return {
			errCode: 'SYSTEM_ERROR',
			errMsg: '批量天气服务异常: ' + error.message,
			data: null
		}
	}
}

// 根据地点名称获取天气信息（支持酒店、景点等地点名称）
async function getWeatherByLocation(event, context) {
	console.log('[天气云函数-getWeatherByLocation] ========== 函数调用开始 ==========');
	console.log('[天气云函数-getWeatherByLocation] 接收到的 event 参数:', JSON.stringify(event, null, 2));
	console.log('[天气云函数-getWeatherByLocation] context 信息:', JSON.stringify({
		requestId: context.requestId,
		function: context.function
	}, null, 2));

	try {
		const { locationName, extensions = 'all' } = event
		
		console.log('[天气云函数-getWeatherByLocation] 解析参数 - locationName:', locationName);
		console.log('[天气云函数-getWeatherByLocation] 解析参数 - extensions:', extensions);

		if (!locationName) {
			console.error('[天气云函数-getWeatherByLocation] 地点名称为空');
			return {
				errCode: 'LOCATION_NAME_REQUIRED',
				errMsg: '地点名称不能为空',
				data: null
			}
		}

		console.log('[天气云函数-getWeatherByLocation] 准备调用地理编码服务获取城市信息');
		
		// 步骤1: 调用地理编码服务，将地点名称转换为城市信息
		let geocodingResult;
		try {
			geocodingResult = await uniCloud.callFunction({
				name: 'a-geocoding',
				data: {
					action: 'geocode',
					address: locationName
				}
			});
			
			console.log('[天气云函数-getWeatherByLocation] 地理编码调用结果:', JSON.stringify(geocodingResult, null, 2));
		} catch (geocodingError) {
			console.error('[天气云函数-getWeatherByLocation] 地理编码服务调用失败:', geocodingError);
			return {
				errCode: 'GEOCODING_ERROR',
				errMsg: '地理编码服务调用失败: ' + geocodingError.message,
				data: null
			}
		}

		// 检查地理编码结果
		if (geocodingResult.result.errCode !== 0) {
			console.error('[天气云函数-getWeatherByLocation] 地理编码服务返回错误:', geocodingResult.result.errMsg);
			return {
				errCode: 'GEOCODING_FAILED',
				errMsg: '地理位置解析失败: ' + geocodingResult.result.errMsg,
				data: null
			}
		}

		const geocodingData = geocodingResult.result.data;
		if (!geocodingData || !geocodingData.results || geocodingData.results.length === 0) {
			console.error('[天气云函数-getWeatherByLocation] 未找到地理位置信息');
			return {
				errCode: 'LOCATION_NOT_FOUND',
				errMsg: `未找到地点"${locationName}"的地理位置信息`,
				data: null
			}
		}

		// 获取最佳匹配的地理位置信息
		const bestMatch = geocodingData.bestMatch || geocodingData.results[0];
		console.log('[天气云函数-getWeatherByLocation] 获取到地理位置信息:', JSON.stringify(bestMatch, null, 2));

		// 步骤2: 提取城市信息用于天气查询
		let cityForWeather = bestMatch.city || bestMatch.adcode;
		
		// 如果没有城市信息，尝试使用省份
		if (!cityForWeather && bestMatch.province) {
			cityForWeather = bestMatch.province;
			console.log('[天气云函数-getWeatherByLocation] 使用省份作为天气查询城市:', cityForWeather);
		}

		// 如果还是没有，使用adcode
		if (!cityForWeather && bestMatch.adcode) {
			cityForWeather = bestMatch.adcode;
			console.log('[天气云函数-getWeatherByLocation] 使用adcode作为天气查询城市:', cityForWeather);
		}

		if (!cityForWeather) {
			console.error('[天气云函数-getWeatherByLocation] 无法从地理位置信息中提取城市信息');
			return {
				errCode: 'CITY_EXTRACTION_FAILED',
				errMsg: '无法从地理位置信息中提取有效的城市信息',
				data: null
			}
		}

		console.log('[天气云函数-getWeatherByLocation] 准备使用城市信息获取天气:', cityForWeather);

		// 步骤3: 使用提取的城市信息获取天气
		const weatherResult = await getWeatherCore({
			city: cityForWeather,
			extensions: extensions
		}, context);

		console.log('[天气云函数-getWeatherByLocation] 天气获取结果:', JSON.stringify(weatherResult, null, 2));

		if (weatherResult.errCode !== 0) {
			console.error('[天气云函数-getWeatherByLocation] 天气获取失败:', weatherResult.errMsg);
			return {
				errCode: 'WEATHER_FETCH_FAILED',
				errMsg: '天气获取失败: ' + weatherResult.errMsg,
				data: null
			}
		}

		// 步骤4: 获取海拔信息
		let elevationData = null;
		try {
			console.log('[天气云函数-getWeatherByLocation] 开始获取海拔信息');
			const elevationResult = await uniCloud.callFunction({
				name: 'a-elevation',
				data: {
					action: 'getElevationByLocation',
					locationName: locationName
				}
			});
			
			console.log('[天气云函数-getWeatherByLocation] 海拔查询结果:', JSON.stringify(elevationResult, null, 2));
			
			if (elevationResult.result.errCode === 0 && elevationResult.result.data) {
				elevationData = elevationResult.result.data;
				console.log('[天气云函数-getWeatherByLocation] 海拔信息获取成功:', elevationData.elevation + 'm');
			} else {
				console.log('[天气云函数-getWeatherByLocation] 海拔信息获取失败，使用默认值');
			}
		} catch (elevationError) {
			console.error('[天气云函数-getWeatherByLocation] 海拔查询异常:', elevationError);
		}

		// 步骤5: 合并地理位置信息、天气信息和海拔信息
		const finalResult = {
			...weatherResult.data,
			originalLocation: locationName,
			geocoding: {
				city: bestMatch.city,
				province: bestMatch.province,
				district: bestMatch.district,
				formatted_address: bestMatch.formatted_address,
				location: bestMatch.location
			},
			elevation: elevationData ? {
				altitude: elevationData.elevation,
				unit: 'm',
				coordinates: elevationData.coordinates
			} : null
		};

		console.log('[天气云函数-getWeatherByLocation] 调用成功，返回综合结果');
		
		return {
			errCode: 0,
			errMsg: '获取成功',
			data: finalResult
		};

	} catch (error) {
		console.error('[天气云函数-getWeatherByLocation] 处理失败:', error)
		return {
			errCode: 'SYSTEM_ERROR',
			errMsg: '地点天气服务异常: ' + error.message,
			data: null
		}
	}
}

exports.main = async (event, context) => {
	console.log('[天气云函数] ========== 云函数调用开始 ==========');
	console.log('[天气云函数] 完整 event 参数:', JSON.stringify(event, null, 2));
	console.log('[天气云函数] context 信息:', JSON.stringify({
		requestId: context.requestId,
		function: context.function,
		clientIP: context.clientIP
	}, null, 2));
	
	const { action, ...params } = event;
	
	console.log('[天气云函数] 解析后的 action:', action);
	console.log('[天气云函数] 解析后的 params:', JSON.stringify(params, null, 2));
	console.log('[天气云函数] action 类型:', typeof action);
	console.log('[天气云函数] action 是否为 undefined:', action === undefined);
	console.log('[天气云函数] action 是否为 null:', action === null);
	console.log('[天气云函数] action 是否为空字符串:', action === '');
	
	// 根据 action 参数路由到不同的处理函数
	console.log('[天气云函数] 开始进行 action 路由匹配...');
	
	switch (action) {
		case 'getWeather':
			console.log('[天气云函数] 匹配到 getWeather action');
			return await getWeather(params, context);
		case 'getWeatherByCityName':
			console.log('[天气云函数] 匹配到 getWeatherByCityName action');
			return await getWeatherByCityName(params, context);
		case 'getBatchWeather':
			console.log('[天气云函数] 匹配到 getBatchWeather action');
			return await getBatchWeather(params, context);
		case 'getWeatherByLocation':
			console.log('[天气云函数] 匹配到 getWeatherByLocation action');
			return await getWeatherByLocation(params, context);
		default:
			console.error('[天气云函数] 未匹配到任何有效的 action!');
			console.error('[天气云函数] 当前 action 值:', action);
			console.error('[天气云函数] 支持的 action 列表: getWeather, getWeatherByCityName, getBatchWeather, getWeatherByLocation');
			return {
				errCode: 'INVALID_ACTION',
				errMsg: `无效的操作类型: ${action}，支持的操作: getWeather, getWeatherByCityName, getBatchWeather, getWeatherByLocation`
			};
	}
};