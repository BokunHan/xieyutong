'use strict';

const uniIdCommon = require('uni-id-common');

exports.main = async (event, context) => {
  const { action, ...params } = event;
  
  // 根据 action 参数路由到不同的处理函数
  switch (action) {
    case 'createProxyOrder':
      return await createProxyOrder(event, context);
    case 'getProxyOrderList':
      return await getProxyOrderList(event, context);
    case 'getProxyOrderDetail':
      return await getProxyOrderDetail(event, context);
    case 'updateProxyOrderStatus':
      return await updateProxyOrderStatus(event, context);
    case 'retryProxyOrder':
      return await retryProxyOrder(event, context);
    case 'searchProduct':
      return await searchProduct(event, context);
    case 'getTodayStatistics':
      return await getTodayStatistics(event, context);
    default:
      return {
        errCode: 'INVALID_ACTION',
        errMsg: '无效的操作类型'
      };
  }
};

// 公共权限验证函数
async function verifyToken(event, context) {
  const uniIdInstance = uniIdCommon.createInstance({ context });
  const checkResult = await uniIdInstance.checkToken(event.uniIdToken);
  
  if (checkResult.errCode !== 0) {
    return {
      success: false,
      error: {
        errCode: 'TOKEN_INVALID',
        errMsg: '身份验证失败'
      }
    };
  }
  
  return {
    success: true,
    userInfo: checkResult
  };
}

// 创建代下单订单
async function createProxyOrder(event, context) {
  try {
    // Token 验证
    const authResult = await verifyToken(event, context);
    if (!authResult.success) {
      return authResult.error;
    }
    const { uid, userInfo } = authResult.userInfo;
    
    const { customerPhone, productId, departureDate, remarks, quantity = 1 } = event;
    
    // 参数验证
    if (!customerPhone || !productId || !departureDate) {
      return {
        errCode: 'INVALID_PARAMS',
        errMsg: '缺少必要参数：客户手机号、商品ID、出发时间'
      };
    }
    
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(customerPhone)) {
      return {
        errCode: 'INVALID_PHONE',
        errMsg: '手机号格式不正确'
      };
    }
    
    const db = uniCloud.databaseForJQL({ event, context });
    
    // 1. 检查并创建用户
    let customerId;
    const existingUser = await db.collection('uni-id-users')
      .where(`mobile == "${customerPhone}"`)
      .field('_id, mobile, nickname')
      .get();
    
    if (existingUser.data.length > 0) {
      // 用户已存在
      customerId = existingUser.data[0]._id;
    } else {
      // 创建新用户
      const newUserResult = await db.collection('uni-id-users').add({
        mobile: customerPhone,
        mobile_confirmed: 1,
        nickname: `用户${customerPhone.substr(-4)}`,
        status: 0, // 正常状态
        role: ['user'] // 普通用户角色
      });
      
      if (!newUserResult.id) {
        return {
          errCode: 'CREATE_USER_FAILED',
          errMsg: '创建用户失败'
        };
      }
      customerId = newUserResult.id;
    }
    
    // 2. 获取商品信息
    const productResult = await db.collection('a-products')
      .where(`_id == "${productId}" || ctrip_id == "${productId}"`)
      .field('_id, title, price, product_images, duration, destination')
      .get();
    
    if (productResult.data.length === 0) {
      return {
        errCode: 'PRODUCT_NOT_FOUND',
        errMsg: '商品不存在'
      };
    }
    
    const product = productResult.data[0];
    
    // 3. 生成订单号（确保长度至少20位）
    const timestamp = Date.now().toString();
    const randomSuffix = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const orderNo = 'PX' + timestamp + randomSuffix;
    
    // 4. 构造订单数据
    const totalAmount = (product.price || 0) * quantity;
    const departureDateTimestamp = new Date(departureDate).getTime();
    
    const orderData = {
      order_no: orderNo,
      user_id: customerId,
      product_id: product._id,
      status: 'paid', // 代客下单订单状态为已支付
      order_type: 'proxy', // 订单类型为代客下单
      quantity: quantity,
      total_amount: totalAmount,
      final_amount: totalAmount,
      product_snapshot: {
        title: product.title,
        price: product.price || 0,
        images: product.product_images || [],
        departure_date: departureDateTimestamp,
        duration: product.duration || 1
      },
      departure_date: departureDateTimestamp,
      duration_days: product.duration || 1,
      special_requirements: remarks || '',
      notes: `代客下单 - 操作员: ${userInfo?.nickname || userInfo?.username || '管理员'}`,
      contact_info: {
        phone: customerPhone
      },
      payment_info: {
        payment_method: 'proxy',
        paid_at: new Date().getTime()
      }
    };
    
    // 5. 保存到订单表
    const result = await db.collection('a-orders').add(orderData);
    
    if (result.id) {
      return {
        errCode: 0,
        errMsg: '代客下单成功',
        data: {
          orderId: result.id,
          orderNo: orderNo,
          customerId: customerId,
          customerPhone: customerPhone,
          productTitle: product.title
        }
      };
    } else {
      return {
        errCode: 'CREATE_FAILED',
        errMsg: '订单创建失败'
      };
    }
    
  } catch (error) {
    console.error('创建代下单订单失败:', error);
    return {
      errCode: 'SYSTEM_ERROR',
      errMsg: '系统错误: ' + error.message
    };
  }
}

// 获取代客下单订单列表
async function getProxyOrderList(event, context) {
  try {
    // Token 验证
    const authResult = await verifyToken(event, context);
    if (!authResult.success) {
      return authResult.error;
    }
    
    const { page = 1, limit = 20, status, keyword } = event;
    
    const db = uniCloud.databaseForJQL({ event, context });
    
    // 构建查询条件 - 只查询代客下单类型的订单
    let whereCondition = {
      order_type: 'proxy'
    };
    
    // 状态筛选
    if (status) {
      whereCondition.status = status;
    }
    
    // 关键词搜索
    if (keyword) {
      whereCondition = {
        ...whereCondition,
        $or: [
          { order_no: new RegExp(keyword, 'i') },
          { 'contact_info.phone': new RegExp(keyword, 'i') },
          { 'product_snapshot.title': new RegExp(keyword, 'i') }
        ]
      };
    }
    
    // 查询订单列表，关联用户信息
    const result = await db.collection('a-orders')
      .where(whereCondition)
      .field('_id, order_no, user_id, product_id, status, order_type, quantity, total_amount, final_amount, product_snapshot, departure_date, contact_info, notes, created_at, updated_at')
      .foreignKey('user_id.mobile,user_id.nickname')
      .orderBy('created_at desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get();
    
    // 获取总数
    const countResult = await db.collection('a-orders')
      .where(whereCondition)
      .count();
    
    // 处理返回数据格式，兼容原有前端调用
    const processedList = result.data.map(order => ({
      _id: order._id,
      orderNo: order.order_no,
      customerPhone: order.contact_info?.phone || order.user_id?.mobile || '',
      customerName: order.user_id?.nickname || '',
      productId: order.product_id,
      productTitle: order.product_snapshot?.title || '',
      departureDate: order.departure_date,
      amount: order.final_amount || order.total_amount || 0,
      quantity: order.quantity || 1,
      status: order.status === 'paid' ? 'success' : 'pending',
      remarks: order.special_requirements || '',
      created_at: order.created_at,
      updated_at: order.updated_at
    }));
    
    return {
      errCode: 0,
      errMsg: '获取成功',
      data: {
        list: processedList,
        total: countResult.total,
        page: page,
        limit: limit
      }
    };
    
  } catch (error) {
    console.error('获取代下单订单列表失败:', error);
    return {
      errCode: 'SYSTEM_ERROR',
      errMsg: '系统错误: ' + error.message
    };
  }
}

// 获取代下单订单详情
async function getProxyOrderDetail(event, context) {
  try {
    // Token 验证
    const authResult = await verifyToken(event, context);
    if (!authResult.success) {
      return authResult.error;
    }
    
    const { orderId } = event;
    
    if (!orderId) {
      return {
        errCode: 'INVALID_PARAMS',
        errMsg: '缺少订单ID'
      };
    }
    
    const db = uniCloud.databaseForJQL({ event, context });
    
    // 查询订单详情
    const result = await db.collection('a-orders')
      .where(`_id == "${orderId}" && order_type == "proxy"`)
      .foreignKey('user_id.mobile,user_id.nickname')
      .get();
    
    if (result.data.length === 0) {
      return {
        errCode: 'ORDER_NOT_FOUND',
        errMsg: '代客下单订单不存在'
      };
    }
    
    const order = result.data[0];
    
    // 格式化返回数据，兼容原有前端调用
    const formattedOrder = {
      _id: order._id,
      orderNo: order.order_no,
      customerPhone: order.contact_info?.phone || order.user_id?.mobile || '',
      customerName: order.user_id?.nickname || '',
      productId: order.product_id,
      productTitle: order.product_snapshot?.title || '',
      departureDate: order.departure_date,
      amount: order.final_amount || order.total_amount || 0,
      quantity: order.quantity || 1,
      status: order.status === 'paid' ? 'success' : 'pending',
      remarks: order.special_requirements || '',
      notes: order.notes || '',
      created_at: order.created_at,
      updated_at: order.updated_at
    };
    
    return {
      errCode: 0,
      errMsg: '获取成功',
      data: formattedOrder
    };
    
  } catch (error) {
    console.error('获取代下单订单详情失败:', error);
    return {
      errCode: 'SYSTEM_ERROR',
      errMsg: '系统错误: ' + error.message
    };
  }
}

// 更新代下单订单状态
async function updateProxyOrderStatus(event, context) {
  try {
    // Token 验证
    const authResult = await verifyToken(event, context);
    if (!authResult.success) {
      return authResult.error;
    }
    const { uid } = authResult.userInfo;
    
    const { orderId, status, message } = event;
    
    if (!orderId || !status) {
      return {
        errCode: 'INVALID_PARAMS',
        errMsg: '缺少必要参数'
      };
    }
    
    // 验证状态值
    if (!['pending', 'paid'].includes(status)) {
      return {
        errCode: 'INVALID_STATUS',
        errMsg: '无效的订单状态，只支持 pending 或 paid'
      };
    }
    
    const db = uniCloud.databaseForJQL({ event, context });
    
    // 构建更新数据
    const updateData = {
      status: status
    };
    
    // 根据状态设置相应字段
    if (status === 'paid') {
      updateData.paid_at = new Date();
      if (!updateData['payment_info']) {
        updateData['payment_info'] = {};
      }
      updateData['payment_info.paid_at'] = new Date();
    }
    
    // 添加操作备注
    if (message) {
      updateData.notes = message;
    }
    
    // 更新订单
    const result = await db.collection('a-orders')
      .where(`_id == \"${orderId}\" && order_type == \"proxy\"`)
      .update(updateData);
    
    if (result.updated === 1) {
      return {
        errCode: 0,
        errMsg: '状态更新成功'
      };
    } else {
      return {
        errCode: 'UPDATE_FAILED',
        errMsg: '状态更新失败或订单不存在'
      };
    }
    
  } catch (error) {
    console.error('更新代下单订单状态失败:', error);
    return {
      errCode: 'SYSTEM_ERROR',
      errMsg: '系统错误: ' + error.message
    };
  }
}

// 重试代下单订单（已废弃，代客下单直接创建为已支付状态）
async function retryProxyOrder(event, context) {
  return {
    errCode: 'DEPRECATED',
    errMsg: '该功能已废弃，代客下单订单直接创建为已支付状态'
  };
}

// 搜索商品
async function searchProduct(event, context) {
  try {
    const { productId } = event;
    
    if (!productId) {
      return {
        errCode: 'INVALID_PARAMS',
        errMsg: '缺少商品ID'
      };
    }
    
    const db = uniCloud.databaseForJQL({ event, context });
    
    // 先尝试在系统商品中搜索
    const productResult = await db.collection('a-products')
      .where(`ctrip_id == "${productId}" || _id == "${productId}"`)
      .field('_id, ctrip_id, title, price, product_images, status')
      .get();
    
    console.log('商品搜索结果:', productResult.data);
    
    if (productResult.data.length > 0) {
      const product = productResult.data[0];
      console.log('找到商品:', product);
      return {
        errCode: 0,
        errMsg: '商品找到',
        data: {
          id: product._id,
          title: product.title,
          price: product.price || 999, // 确保价格不为空
          image: product.product_images && product.product_images[0],
          source: 'system',
          available: product.status === 1
        }
      };
    } else {
      console.log('商品未找到，使用默认信息');
      // 如果系统中没有，返回携程商品信息（设置默认价格）
      return {
        errCode: 0,
        errMsg: '商品信息获取成功',
        data: {
          id: productId,
          title: `携程商品-${productId}`,
          price: 999, // 设置默认价格，避免显示0
          image: null,
          source: 'ctrip',
          available: true,
          needSync: true
        }
      };
    }
    
  } catch (error) {
    console.error('搜索商品失败:', error);
    return {
      errCode: 'SYSTEM_ERROR',
      errMsg: '系统错误: ' + error.message
    };
  }
}

// 获取今日统计
async function getTodayStatistics(event, context) {
  try {
    // Token 验证
    const authResult = await verifyToken(event, context);
    if (!authResult.success) {
      return authResult.error;
    }
    
    const db = uniCloud.databaseForJQL({ event, context });
    
    // 获取今日开始时间
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 查询今日代客下单订单
    const result = await db.collection('a-orders')
      .where({
        order_type: 'proxy',
        created_at: db.command.gte(today)
      })
      .field('final_amount, total_amount, status')
      .get();
    
    const orders = result.data;
    
    // 计算统计数据
    const todayOrderCount = orders.length;
    const todayRevenue = orders.reduce((sum, order) => sum + (order.final_amount || order.total_amount || 0), 0);
    const successCount = orders.filter(order => order.status === 'paid').length;
    const pendingCount = orders.filter(order => order.status === 'pending').length;
    
    return {
      errCode: 0,
      errMsg: '获取成功',
      data: {
        todayOrderCount,
        todayRevenue: parseFloat(todayRevenue.toFixed(2)),
        successCount,
        failedCount: pendingCount, // 将pending状态作为失败计数，保持兼容性
        successRate: todayOrderCount > 0 ? parseFloat((successCount / todayOrderCount * 100).toFixed(2)) : 0
      }
    };
    
  } catch (error) {
    console.error('获取今日统计失败:', error);
    return {
      errCode: 'SYSTEM_ERROR',
      errMsg: '系统错误: ' + error.message
    };
  }
}