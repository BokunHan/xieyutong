// qrcode-service/index.obj.js
'use strict';

const uniIdCommon = require('uni-id-common');
const createConfig = require('uni-config-center');

const USER_MP_DCLOUD_APPID = '__UNI__5377474';
const ADMIN_DCLOUD_APPID = '__UNI__F09E2F3';

// --- 内部私有方法：获取微信 AccessToken ---
const _getWxAccessToken = async function (dcloudAppid) {
	let appid, secret;

	try {
		// 1. 获取 uni-id 的配置
		const uniIdConfigRes = createConfig({
			pluginId: 'uni-id' // 指定读取 uni-id 目录下的 config.json
		}).config();

		let currentConfig = uniIdConfigRes;

		// 如果配置是数组（多端模式），则根据 dcloudAppid 查找对应配置
		if (Array.isArray(uniIdConfigRes)) {
			if (!dcloudAppid) {
				throw new Error('多端配置模式下，必须传入 dcloudAppid');
			}
			// 在数组中找到匹配当前运行小程序的配置项
			currentConfig = uniIdConfigRes.find((item) => item.dcloudAppid === dcloudAppid);

			if (!currentConfig) {
				throw new Error(`在 uni-id 配置中未找到 dcloudAppid 为 ${dcloudAppid} 的配置项`);
			}
		}

		// 2. 提取 mp-weixin 下的配置
		if (currentConfig['mp-weixin'] && currentConfig['mp-weixin'].oauth && currentConfig['mp-weixin'].oauth.weixin) {
			appid = currentConfig['mp-weixin'].oauth.weixin.appid;
			secret = currentConfig['mp-weixin'].oauth.weixin.appsecret;
		}
	} catch (e) {
		console.error('读取 uni-id 配置失败:', e);
		throw e; // 抛出异常以便外层捕获
	}

	// 校验是否成功获取
	if (!appid || !secret) {
		throw new Error(`应用 [${dcloudAppid}] 未配置 mp-weixin 的 appid 或 appsecret`);
	}

	// 3. 请求微信接口
	// 建议此处添加缓存逻辑（uniCloud.redis 或 数据库缓存），避免频繁调用
	const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
	const res = await uniCloud.httpclient.request(url, { dataType: 'json' });

	if (res.data && res.data.access_token) {
		return res.data.access_token;
	}

	throw new Error('获取Access Token失败: ' + (res.data.errmsg || '未知错误'));
};

// --- 内部私有方法：调用微信接口生成图片 ---
async function _generateWXACodeUnlimit(targetDcloudAppid, scene, page, width = 430) {
	const accessToken = await _getWxAccessToken(targetDcloudAppid);
	console.log('accessToken: ', accessToken);

	const result = await uniCloud.httpclient.request(`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`, {
		method: 'POST',
		contentType: 'json',
		data: {
			scene: scene,
			page: page,
			width: width,
			check_path: false, // 开发阶段设为 false，上线需改为 true
			env_version: 'release' // release, trial, develop
		},
		dataType: 'buffer'
	});

	if (result.headers['content-type'].includes('image')) {
		console.log('result: ', result);
		return {
			errCode: 0,
			base64: 'data:image/png;base64,' + result.data.toString('base64')
		};
	} else {
		const err = JSON.parse(result.data.toString());
		throw new Error(err.errmsg || '微信接口生成失败');
	}
}

module.exports = {
	_before: async function () {
		this.clientInfo = this.getClientInfo();
		this.uniIdCommon = uniIdCommon.createInstance({
			clientInfo: this.clientInfo
		});
		// 获取当前用户信息（如果已登录）
		const token = this.getUniIdToken();
		if (token) {
			const checkResult = await this.uniIdCommon.checkToken(token);
			if (checkResult.errCode === 0) {
				this.uid = checkResult.uid;
				this.role = checkResult.role || [];
				this.permission = checkResult.permission || [];
			}
		}
	},

	/**
	 * 1. 生成管理端/营销用小程序码
	 * 权限：仅管理员
	 */
	async generateAdminPromoCode(params) {
		// 权限校验 (对应原文件中的 checkToken 和 role 判断)
		if (!this.role || (!this.role.includes('admin') && !this.role.includes('super_admin'))) {
			return { errCode: 403, errMsg: '权限不足' };
		}

		const { scene, page, width } = params;
		if (!scene) return { errCode: 'INVALID_PARAM', errMsg: '场景值不能为空' };

		try {
			return await _generateWXACodeUnlimit(USER_MP_DCLOUD_APPID, scene, page || 'pages/index/index', width);
		} catch (e) {
			return { errCode: 500, errMsg: e.message };
		}
	},

	/**
	 * 2. 生成订单/快照邀请码
	 * 权限：仅导游(guide) 或 管理员
	 */
	async generateOrderInviteCode(orderId) {
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' };

		// 简单的权限判断：必须是 admin 或者是 guide 角色
		const isAuthorized = this.role.includes('admin') || this.role.includes('super_admin') || this.role.some((r) => r === 'guide' || r.includes('guide'));

		if (!isAuthorized) {
			return { errCode: 403, errMsg: '无权操作' };
		}

		try {
			// 场景值：oid=订单ID
			const scene = `oid=${orderId}`;
			const page = 'pages/order/bind-confirm';
			return await _generateWXACodeUnlimit(USER_MP_DCLOUD_APPID, scene, page);
		} catch (e) {
			return { errCode: 500, errMsg: e.message };
		}
	},

	/**
	 * 3. 生成商品分享海报码
	 * 权限：登录用户 或 所有人
	 */
	async generateProductShareCode(productId) {
		if (!productId) return { errCode: 'INVALID_PARAM', errMsg: '缺少商品ID' };

		// 商品分享通常不需要严格权限，或者只需要登录即可
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' };

		try {
			// 场景值：id=商品ID
			const scene = `id=${productId}`;
			const page = 'pages/product-detail/product-detail';
			return await _generateWXACodeUnlimit(USER_MP_DCLOUD_APPID, scene, page);
		} catch (e) {
			return { errCode: 500, errMsg: e.message };
		}
	}
};
