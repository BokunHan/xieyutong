const db = uniCloud.database();
const dbCmd = db.command;
const uniIdCommon = require('uni-id-common');

// 百度应用：识别证件（身份证、驾照、行驶证）
const BAIDU_CONFIG = {
	API_KEY: '5GGgGyDiMMOF7t9WiVgzCzmT',
	SECRET_KEY: 'sGwUDpeSg9QROelgRuCK1RliOtqm5Efl'
};

module.exports = {
	_before: function () {
		const clientInfo = this.getClientInfo();
		this.uniIdCommon = uniIdCommon.createInstance({
			clientInfo: clientInfo
		});
	},

	/**
	 * 获取指定用户的精彩瞬间列表
	 * @param {String} targetUserId 可选，如果不传则查当前登录用户
	 */
	async getPortfolio(targetUserId) {
		let userId = targetUserId;

		// 如果没传targetUserId，尝试获取当前登录用户ID
		if (!userId) {
			// 验证用户身份
			const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
			if (checkResult.errCode !== 0) {
				throw new Error('身份验证失败');
			}

			userId = checkResult.uid;
		}

		// 查询 b-guide-portfolio 表，按时间倒序，取前6张（UI显示）
		const res = await db
			.collection('b-guide-portfolio')
			.where({
				user_id: userId
			})
			.orderBy('created_at', 'desc')
			.limit(6)
			.get();

		return {
			code: 0,
			msg: 'success',
			data: res.data
		};
	},

	// 如果需要添加图片的方法
	async addPhoto(url) {
		// 验证用户身份
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) {
			throw new Error('身份验证失败');
		}

		const userId = checkResult.uid;

		await db.collection('b-guide-portfolio').add({
			user_id: userId,
			url: url
		});
		return { code: 0, msg: '添加成功' };
	},

	/**
	 * OCR 智能识别接口 (百度AI)
	 */
	async ocrAnalysis({ url, type }) {
		// 1. 身份校验
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) throw new Error('请先登录');

		try {
			// 2. 将 fileID 转换为公网 https 链接
			let imageUrl = url;
			if (url.startsWith('cloud://')) {
				const fileRes = await uniCloud.getTempFileURL({ fileList: [url] });
				if (fileRes.fileList && fileRes.fileList.length > 0) {
					imageUrl = fileRes.fileList[0].tempFileURL;
				}
			}

			// 3. 获取 Access Token
			let token = '';
			const authUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_CONFIG.API_KEY}&client_secret=${BAIDU_CONFIG.SECRET_KEY}`;

			const res = await uniCloud.httpclient.request(authUrl, { dataType: 'json' });
			if (res.data && res.data.access_token) {
				token = res.data.access_token;
			} else {
				throw new Error('获取 OCR 服务授权失败');
			}

			let resultData = {};
			let apiUrl = '';
			let postData = { url: imageUrl };

			// --- A: 身份证识别 ---
			if (type === 'id_card_front') {
				apiUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/idcard?access_token=${token}`;
				postData.id_card_side = 'front';
			}
			// --- B: 驾驶证识别 ---
			else if (type === 'driver_license') {
				apiUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/driving_license?access_token=${token}`;
			}
			// --- C: 行驶证识别 ---
			else if (type === 'vehicle_license') {
				apiUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/vehicle_license?access_token=${token}`;
			}
			// --- D: 银行卡识别 (新增) ---
			else if (type === 'bank_card') {
				apiUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/bankcard?access_token=${token}`;
			}

			// 发起 OCR 请求
			const ocrRes = await uniCloud.httpclient.request(apiUrl, {
				method: 'POST',
				contentType: 'application/x-www-form-urlencoded',
				dataType: 'json',
				data: postData
			});

			const data = ocrRes.data;
			if (data.error_code) throw new Error('识别失败: ' + (data.error_msg || '未知错误'));

			// --- 数据解析 ---

			if (type === 'id_card_front') {
				const idNum = data.words_result['公民身份号码']?.words || '';
				const name = data.words_result['姓名']?.words || '';
				const birthStr = data.words_result['出生']?.words || '';
				const genderStr = data.words_result['性别']?.words || '';
				resultData = {
					real_name: name,
					id_card_number: idNum,
					birth_date: birthStr,
					gender: genderStr === '男' ? 1 : 2
				};
			} else if (type === 'driver_license') {
				resultData = {
					first_issue_date: data.words_result['初次领证日期']?.words || '',
					license_valid_date: data.words_result['至']?.words || '需手动填写'
				};
			} else if (type === 'vehicle_license') {
				const words = data.words_result;
				resultData = {
					plate_number: words['号牌号码']?.words || '',
					model: words['车辆类型']?.words || '',
					seat_count: parseInt(words['核定载人数']?.words || '') || ''
				};
			} else if (type === 'bank_card') {
				const resObj = data.result || {};
				resultData = {
					bank_card_number: resObj.bank_card_number ? resObj.bank_card_number.replace(/\s/g, '') : '',
					bank_name: resObj.bank_name || '',
					valid_date: resObj.valid_date || ''
				};
			}

			return {
				code: 0,
				msg: '识别成功',
				data: resultData
			};
		} catch (e) {
			console.error('OCR Error:', e);
			return {
				code: 500,
				msg: '自动识别失败，请手动填写',
				error: e.message
			};
		}
	},

	/**
	 * 赋予当前用户私导角色
	 */
	async grantGuideRole({ realName } = {}) {
		// 1. 身份校验
		const checkResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		if (checkResult.errCode !== 0) {
			throw new Error('未登录或登录失效');
		}

		const uid = checkResult.uid;

		// 2. 更新 uni-id-users 表，追加 guide 角色
		await db
			.collection('uni-id-users')
			.doc(uid)
			.update({
				role: dbCmd.addToSet('guide'),
				nickname: realName,
				status: 0
			});

		return {
			code: 0,
			msg: '角色更新成功'
		};
	}
};
