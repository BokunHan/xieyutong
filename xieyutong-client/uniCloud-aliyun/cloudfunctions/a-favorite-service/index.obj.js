// 引入 uni-id-common，用于安全地解析 token
const uniIdCommon = require('uni-id-common');

const db = uniCloud.database();
const dbCmd = db.command;

module.exports = {
	_before: async function () {
		console.log('云对象调用开始');

		// 创建 uni-id-common 实例
		this.uniIdCommon = uniIdCommon.createInstance({
			context: this
		});

		// 获取客户端信息
		try {
			const clientInfo = this.getClientInfo();
			console.log('客户端信息:', JSON.stringify(clientInfo));
		} catch (error) {
			console.log('获取客户端信息失败:', error.message);
		}
	},

	/**
	 * 检查收藏状态
	 * @param {string} productId - 商品ID
	 * @returns {object} - { isFavorite: boolean, favoriteId: string | null }
	 */
	async checkStatus(productId) {
		if (!productId) {
			throw new Error('商品ID不能为空');
		}

		// 使用 checkToken 方法验证并获取用户信息
		const checkTokenResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		console.log('checkToken 结果:', checkTokenResult);

		if (checkTokenResult.errCode !== 0) {
			console.log('token 校验失败:', checkTokenResult.message);
			throw new Error(checkTokenResult.message || '用户未登录或登录已过期');
		}

		const userId = checkTokenResult.uid;

		const res = await db
			.collection('a-favorites')
			.where({
				user_id: userId,
				product_id: productId
			})
			.field({ _id: true })
			.limit(1)
			.get();

		if (res.data && res.data.length > 0) {
			return {
				isFavorite: true,
				favoriteId: res.data[0]._id
			};
		} else {
			return {
				isFavorite: false,
				favoriteId: null
			};
		}
	},

	/**
	 * 切换收藏状态 (添加/删除)
	 * @param {string} productId - 商品ID
	 * @param {object} productData - 用于添加收藏时，需要的基本商品信息
	 * @returns {object} - { status: 'added' | 'removed', favoriteId: string | null, message: string }
	 */
	async toggle(productId, productData) {
		if (!productId) {
			throw new Error('商品ID不能为空');
		}

		// 使用 checkToken 方法验证并获取用户信息
		const checkTokenResult = await this.uniIdCommon.checkToken(this.getUniIdToken());
		console.log('checkToken 结果:', checkTokenResult);

		if (checkTokenResult.errCode !== 0) {
			console.log('token 校验失败:', checkTokenResult.message);
			throw new Error(checkTokenResult.message || '用户未登录或登录已过期');
		}

		const userId = checkTokenResult.uid;

		const collection = db.collection('a-favorites');

		// 1. 检查是否已存在
		const checkRes = await collection
			.where({
				user_id: userId,
				product_id: productId
			})
			.field({ _id: true })
			.limit(1)
			.get();

		const exists = checkRes.data && checkRes.data.length > 0;

		if (exists) {
			// 2. 如果存在，则删除
			const favoriteId = checkRes.data[0]._id;
			const removeRes = await collection.doc(favoriteId).remove();

			if (removeRes.deleted <= 0) {
				throw new Error('取消收藏失败');
			}

			return {
				status: 'removed',
				favoriteId: null,
				message: '已取消收藏'
			};
		} else {
			// 3. 如果不存在，则添加
			if (!productData) {
				throw new Error('缺少商品信息，无法添加收藏');
			}

			// 组装收藏数据
			const favoriteItem = {
				user_id: userId,
				product_id: productId,
				product_title: productData.product_title || '暂无标题',
				product_image: productData.product_image || '',
				product_price: productData.product_price || 0,
				product_rating: productData.product_rating || 0,
				product_sales: productData.product_sales || 0,
				create_date: Date.now() // 增加一个创建时间
			};

			const addRes = await collection.add(favoriteItem);

			if (!addRes.id) {
				throw new Error('收藏失败');
			}

			return {
				status: 'added',
				favoriteId: addRes.id,
				message: '收藏成功'
			};
		}
	}
};
