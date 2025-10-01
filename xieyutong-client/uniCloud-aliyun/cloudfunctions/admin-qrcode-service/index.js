'use strict';

const uniIdCommon = require('uni-id-common');

exports.main = async (event, context) => {
  const { action, ...params } = event;
  
  // 根据 action 参数路由到不同的处理函数
  switch (action) {
    case 'generateMiniProgramQR':
      return await generateMiniProgramQR(event, context);
    default:
      return {
        errCode: 'INVALID_ACTION',
        errMsg: '无效的操作类型'
      };
  }
};

/**
 * 生成小程序码
 */
async function generateMiniProgramQR(event, context) {
  const { scene, page = 'pages/coupon/claim', width = 280, uniIdToken } = event;
  
  if (!scene) {
    return {
      errCode: 'INVALID_PARAM',
      errMsg: '场景值不能为空'
    };
  }

  // 验证管理员权限（可选，根据需求决定）
  if (uniIdToken) {
    const uniIdInstance = uniIdCommon.createInstance({ context });
    const checkResult = await uniIdInstance.checkToken(uniIdToken);
    
    if (checkResult.errCode !== 0) {
      return {
        errCode: 'TOKEN_INVALID',
        errMsg: '身份验证失败'
      };
    }

    // 检查是否为管理员
    const userRole = checkResult.role || [];
    if (!userRole.includes('admin') && !userRole.includes('super_admin')) {
      return {
        errCode: 'PERMISSION_DENIED',
        errMsg: '权限不足'
      };
    }
  }

  try {
    // 调用微信接口生成小程序码
    const result = await uniCloud.httpclient.request('https://api.weixin.qq.com/wxa/getwxacodeunlimit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        scene: `code=${scene}`, // 场景值，格式为 code=GIFT1000
        page: page,
        width: width,
        auto_color: false,
        line_color: {
          "r": 0,
          "g": 0,
          "b": 0
        },
        is_hyaline: false
      },
      // 需要先获取access_token
      beforeRequest: async (options) => {
        const accessToken = await getAccessToken();
        options.url = `${options.url}?access_token=${accessToken}`;
        return options;
      }
    });

    // 检查响应是否为图片数据
    if (result.headers['content-type'] && result.headers['content-type'].includes('image')) {
      // 将图片数据转换为base64
      const base64Data = Buffer.from(result.data).toString('base64');
      const qrCodeUrl = `data:image/png;base64,${base64Data}`;
      
      return {
        errCode: 0,
        data: {
          qrCodeUrl,
          scene,
          page
        }
      };
    } else {
      // 如果返回的不是图片，可能是错误信息
      const errorData = JSON.parse(result.data.toString());
      return {
        errCode: 'WECHAT_API_ERROR',
        errMsg: `微信接口错误: ${errorData.errmsg || '未知错误'}`,
        wxError: errorData
      };
    }
  } catch (error) {
    console.error('生成小程序码失败:', error);
    return {
      errCode: 'SERVER_ERROR',
      errMsg: '生成小程序码失败，请重试'
    };
  }
}

/**
 * 获取微信小程序 access_token
 */
async function getAccessToken() {
  // 这里需要根据实际情况获取access_token
  // 可以从配置中心获取 appid 和 secret
  const config = uniCloud.config.get('wx-miniprogram');
  const appid = config.appid;
  const secret = config.secret;
  
  if (!appid || !secret) {
    throw new Error('微信小程序配置不完整');
  }

  try {
    const result = await uniCloud.httpclient.request(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`, {
      method: 'GET'
    });

    const data = JSON.parse(result.data.toString());
    
    if (data.access_token) {
      return data.access_token;
    } else {
      throw new Error(`获取access_token失败: ${data.errmsg}`);
    }
  } catch (error) {
    console.error('获取access_token失败:', error);
    throw error;
  }
}