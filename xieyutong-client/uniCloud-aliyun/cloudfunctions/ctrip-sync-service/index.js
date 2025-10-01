'use strict';

const uniIdCommon = require('uni-id-common');

// 爬虫API基础URL
const CRAWLER_API_BASE_URL = 'https://ctrip-crawler-api.bitejufeng.com';

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
    return data.map(item => cleanDataForDatabase(item));
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
  // rating: 3-5分之间，保留1位小数
  const rating = (Math.random() * 2 + 3).toFixed(1);
  
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
  
  fields.forEach(field => {
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
    case 'getProductDetail':
      return await getProductDetail(event, context);
    case 'getProductItinerary':
      return await getProductItinerary(event, context);
    case 'getBookingNote':
      return await getBookingNote(event, context);
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
        'Accept': 'application/json'
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
    const requestUrl = `${CRAWLER_API_BASE_URL}/api/detail/${productId}`;
    console.log(`[商品详情同步] 发送API请求: ${requestUrl}`);
    
    const response = await uniCloud.httpclient.request(requestUrl, {
      method: 'GET',
      timeout: 60000, // 增加超时时间到60秒
      headers: {
        'User-Agent': 'uniCloud-httpclient/1.0',
        'Accept': 'application/json'
      },
      dataType: 'json' // 明确指定返回数据类型为JSON
    });
    
    console.log(`[商品详情同步] API响应状态: ${response.status}`);
    console.log(`[商品详情同步] API响应数据类型: ${typeof response.data}`);
    
    if (response.status !== 200) {
      throw new Error(`API请求失败，状态码: ${response.status}, 响应内容: ${JSON.stringify(response.data)}`);
    }
    
    // 由于设置了 dataType: 'json'，response.data 应该已经是解析后的对象
    const apiResult = response.data;
    
    console.log(`[商品详情同步] 解析后的API结果字段:`, Object.keys(apiResult.data || {}));
    console.log(`[商品详情同步] API返回的完整数据结构:`, JSON.stringify(apiResult, null, 2));
    
    if (!apiResult || typeof apiResult !== 'object') {
      throw new Error(`API返回数据格式错误，期望对象，实际收到: ${typeof apiResult}`);
    }
    
    if (!apiResult.success) {
      const errorMsg = apiResult.message || apiResult.error || '获取商品详情失败';
      throw new Error(`API返回错误: ${errorMsg}`);
    }
    
    if (!apiResult.data) {
      throw new Error('API返回成功但缺少数据字段');
    }
    
    // 清洗返回的数据，移除可能导致问题的特殊字符
    const cleanedData = cleanDataForDatabase(apiResult.data);
    console.log(`[商品详情同步] 数据清洗完成，产品ID: ${productId}`);
    console.log(`[商品详情同步] 清洗后的数据字段:`, Object.keys(cleanedData));
    
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
        'Accept': 'application/json'
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
        'Accept': 'application/json'
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
          const cleanPrice = priceStr.toString().replace(/[￥¥,元]/g, '').trim();
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
          const destinations = ['西藏', '新疆', '云南', '四川', '青海', '甘肃', '内蒙古', '北京', '上海', '广州', '深圳', '杭州', '苏州', '成都', '重庆', '西安', '南京', '武汉', '长沙', '厦门', '三亚', '大理', '丽江', '桂林'];
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
            features.forEach(feature => {
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
        
        const productRecord = sanitizeStringFields({
          ctrip_id: productId,
          title: cleanedProductData.title || '',
          subtitle: cleanedProductData.subtitle || cleanedProductData.sub_title || '',
          
          // 价格字段处理
          price: adultPrice,
          child_price: childPrice,
          
          // 天数和评分
          duration_days: cleanedProductData.duration_days || extractDaysFromTitle(cleanedProductData.title) || 1,
          rating: processRating(cleanedProductData.rating || cleanedProductData.score),
          
          // 图片数组
          product_images: Array.isArray(cleanedProductData.product_images) ? cleanedProductData.product_images : 
                          Array.isArray(cleanedProductData.images) ? cleanedProductData.images : [],
          detail_images: Array.isArray(cleanedProductData.detail_images) ? cleanedProductData.detail_images :
                        Array.isArray(cleanedProductData.detail_imgs) ? cleanedProductData.detail_imgs : [],
          
          // 特色亮点
          features: Array.isArray(cleanedProductData.features) ? cleanedProductData.features :
                   Array.isArray(cleanedProductData.highlights) ? cleanedProductData.highlights : [],
          
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
        }, ['title', 'subtitle']);
        
        console.log(`[商品数据处理] 处理后的产品记录字段:`, Object.keys(productRecord));
        console.log(`[商品数据处理] 价格信息: 成人价=${productRecord.price}, 儿童价=${productRecord.child_price}`);
        console.log(`[商品数据处理] 分类信息: 分类=${productRecord.category}, 目的地=${productRecord.destination}`);
        console.log(`[商品数据处理] 图片数量: 主图=${productRecord.product_images.length}, 详情图=${productRecord.detail_images.length}`);
        console.log(`[商品数据处理] 特色数量: ${productRecord.features.length}, 标签: [${productRecord.tags.join(', ')}]`);
        console.log(`[商品数据处理] 统计数据: 评分=${productRecord.rating}, 浏览=${productRecord.view_count}, 销量=${productRecord.sales_count}, 评价=${productRecord.review_count}`);
        
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
    const [itineraryResult, bookingResult] = await Promise.allSettled([
      getProductItinerary({ productId }),
      getBookingNote({ productId })
    ]);
    
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
    const finalStatus = failedCount === 0 ? 'success' : (successCount === 0 ? 'failed' : 'success');
    console.log(`[同步完成] 全量同步完成，产品ID: ${productId}`);
    console.log(`[同步完成] 成功数量: ${successCount}, 失败数量: ${failedCount}`);
    console.log(`[同步完成] 最终状态: ${finalStatus}`);
    console.log(`[同步完成] 详细结果:`, syncResults);
    
    await db.collection('a-ctrip-sync-logs').doc(syncLogId).update({
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
        status: finalStatus
      }
    };
    
  } catch (error) {
    console.error('同步商品数据失败:', error);
    
    // 更新同步记录为失败状态
    if (syncLogId) {
      await db.collection('a-ctrip-sync-logs').doc(syncLogId).update({
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
        Object.keys(original).forEach(key => {
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

