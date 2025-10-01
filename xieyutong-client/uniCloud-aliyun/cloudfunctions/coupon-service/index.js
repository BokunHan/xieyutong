'use strict';

const uniIdCommon = require('uni-id-common');

exports.main = async (event, context) => {
  const { action, ...params } = event;
  
  // 根据 action 参数路由到不同的处理函数
  switch (action) {
    case 'getCouponByShareCode':
      return await getCouponByShareCode(event, context);
    case 'claimCoupon':
      return await claimCoupon(event, context);
    case 'getUserCoupons':
      return await getUserCoupons(event, context);
    case 'getValidCouponsForOrder':
      return await getValidCouponsForOrder(event, context);
    default:
      return {
        errCode: 'INVALID_ACTION',
        errMsg: '无效的操作类型'
      };
  }
};

/**
 * 根据分享码获取优惠券信息
 */
async function getCouponByShareCode(event, context) {
  const { shareCode, uniIdToken } = event;
  
  if (!shareCode) {
    return {
      errCode: 'INVALID_PARAM',
      errMsg: '分享码不能为空'
    };
  }

  try {
    const db = uniCloud.databaseForJQL({ event, context });
    
    // 查询优惠券信息
    const couponResult = await db.collection('a-coupons')
      .where(`share_code == "${shareCode}" && status == "active"`)
      .get();

    if (couponResult.data.length === 0) {
      return {
        errCode: 'COUPON_NOT_FOUND',
        errMsg: '优惠券不存在或已失效'
      };
    }

    const coupon = couponResult.data[0];
    let claimStatus = 'can_claim';

    // 如果用户已登录，检查是否已领取
    if (uniIdToken) {
      const uniIdInstance = uniIdCommon.createInstance({ context });
      const checkResult = await uniIdInstance.checkToken(uniIdToken);
      
      if (checkResult.errCode === 0) {
        const userId = checkResult.uid;
        
        // 检查用户是否已领取此优惠券
        const userCouponResult = await db.collection('a-user-coupons')
          .where(`user_id == "${userId}" && coupon_id == "${coupon._id}"`)
          .get();

        if (userCouponResult.data.length > 0) {
          claimStatus = 'already_claimed';
        }
      }
    }

    return {
      errCode: 0,
      data: {
        coupon,
        claimStatus
      }
    };
  } catch (error) {
    console.error('获取优惠券信息失败:', error);
    return {
      errCode: 'SERVER_ERROR',
      errMsg: '服务器错误，请重试'
    };
  }
}

/**
 * 领取优惠券
 */
async function claimCoupon(event, context) {
  const { shareCode, uniIdToken } = event;
  
  if (!shareCode || !uniIdToken) {
    return {
      errCode: 'INVALID_PARAM',
      errMsg: '参数不完整'
    };
  }

  try {
    const uniIdInstance = uniIdCommon.createInstance({ context });
    const checkResult = await uniIdInstance.checkToken(uniIdToken);
    
    if (checkResult.errCode !== 0) {
      return {
        errCode: 'TOKEN_INVALID',
        errMsg: '身份验证失败，请重新登录'
      };
    }

    const userId = checkResult.uid;
    const db = uniCloud.databaseForJQL({ event, context });

    // 查询优惠券信息
    const couponResult = await db.collection('a-coupons')
      .where(`share_code == "${shareCode}" && status == "active"`)
      .get();

    if (couponResult.data.length === 0) {
      return {
        errCode: 'COUPON_NOT_FOUND',
        errMsg: '优惠券不存在或已失效'
      };
    }

    const coupon = couponResult.data[0];

    // 检查用户是否已领取
    const existingResult = await db.collection('a-user-coupons')
      .where(`user_id == "${userId}" && coupon_id == "${coupon._id}"`)
      .get();

    if (existingResult.data.length > 0) {
      return {
        errCode: 'ALREADY_CLAIMED',
        errMsg: '您已经领取过此优惠券了'
      };
    }

    // 检查发放数量限制
    if (coupon.total_count > 0) {
      const claimedCount = await db.collection('a-user-coupons')
        .where(`coupon_id == "${coupon._id}"`)
        .count();

      if (claimedCount.total >= coupon.total_count) {
        return {
          errCode: 'COUPON_SOLD_OUT',
          errMsg: '优惠券已被抢完'
        };
      }
    }

    // 计算过期时间
    const now = new Date();
    const expiredAt = new Date(now.getTime() + coupon.valid_days * 24 * 60 * 60 * 1000);

    // 生成优惠券码
    const couponCode = generateCouponCode();

    // 创建用户优惠券记录
    const userCouponData = {
      user_id: userId,
      coupon_id: coupon._id,
      coupon_code: couponCode,
      status: 'unused',
      source_type: 'manual',
      source_detail: {
        share_code: shareCode
      },
      expired_at: expiredAt,
      // 冗余存储优惠券基本信息
      amount: coupon.amount,
      min_amount: coupon.min_amount,
      title: coupon.title
    };

    await db.collection('a-user-coupons').add(userCouponData);

    return {
      errCode: 0,
      data: {
        message: '领取成功',
        userCoupon: userCouponData
      }
    };
  } catch (error) {
    console.error('领取优惠券失败:', error);
    return {
      errCode: 'SERVER_ERROR',
      errMsg: '领取失败，请重试'
    };
  }
}

/**
 * 获取用户的优惠券列表
 */
async function getUserCoupons(event, context) {
  const { uniIdToken, status = 'all', pageIndex = 1, pageSize = 20 } = event;
  
  if (!uniIdToken) {
    return {
      errCode: 'TOKEN_REQUIRED',
      errMsg: '请先登录'
    };
  }

  try {
    const uniIdInstance = uniIdCommon.createInstance({ context });
    const checkResult = await uniIdInstance.checkToken(uniIdToken);
    
    if (checkResult.errCode !== 0) {
      return {
        errCode: 'TOKEN_INVALID',
        errMsg: '身份验证失败'
      };
    }

    const userId = checkResult.uid;
    const db = uniCloud.databaseForJQL({ event, context });

    // 构建查询条件
    let whereCondition = `user_id == "${userId}"`;
    
    if (status !== 'all') {
      whereCondition += ` && status == "${status}"`;
    }

    // 自动标记过期的优惠券
    // const now = new Date();
    // await db.collection('a-user-coupons')
    //   .where(`user_id == "${userId}" && status == "unused" && expired_at < ${now.getTime()}`)
    //   .update({
    //     status: 'expired'
    //   });

    // 查询用户优惠券
    const result = await db.collection('a-user-coupons')
      .where(whereCondition)
      .orderBy('created_at desc')
      .skip((pageIndex - 1) * pageSize)
      .limit(pageSize)
      .get();

    return {
      errCode: 0,
      data: {
        list: result.data,
        hasMore: result.data.length === pageSize
      }
    };
  } catch (error) {
    console.error('获取用户优惠券失败:', error);
    return {
      errCode: 'SERVER_ERROR',
      errMsg: '获取优惠券列表失败'
    };
  }
}

/**
 * 获取订单可用的优惠券
 */
async function getValidCouponsForOrder(event, context) {
  const { uniIdToken, orderAmount } = event;
  
  if (!uniIdToken || !orderAmount) {
    return {
      errCode: 'INVALID_PARAM',
      errMsg: '参数不完整'
    };
  }

  try {
    const uniIdInstance = uniIdCommon.createInstance({ context });
    const checkResult = await uniIdInstance.checkToken(uniIdToken);
    
    if (checkResult.errCode !== 0) {
      return {
        errCode: 'TOKEN_INVALID',
        errMsg: '身份验证失败'
      };
    }

    const userId = checkResult.uid;
    const db = uniCloud.databaseForJQL({ event, context });

    // 自动标记过期的优惠券
    const now = new Date();
    await db.collection('a-user-coupons')
      .where(`user_id == "${userId}" && status == "unused" && expired_at < ${now.getTime()}`)
      .update({
        status: 'expired'
      });

    // 查询可用优惠券
    const result = await db.collection('a-user-coupons')
      .where(`user_id == "${userId}" && status == "unused" && min_amount <= ${orderAmount} && expired_at >= ${now.getTime()}`)
      .orderBy('amount desc')
      .get();

    return {
      errCode: 0,
      data: {
        coupons: result.data
      }
    };
  } catch (error) {
    console.error('获取订单可用优惠券失败:', error);
    return {
      errCode: 'SERVER_ERROR',
      errMsg: '获取可用优惠券失败'
    };
  }
}

/**
 * 生成优惠券码
 */
function generateCouponCode() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}