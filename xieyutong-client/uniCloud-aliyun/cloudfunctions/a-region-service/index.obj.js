const db = uniCloud.database();
const dbCmd = db.command;
const $ = dbCmd.aggregate;

module.exports = {
	_before: function () {
		// 这里可以放鉴权逻辑
	},

	/**
	 * 获取一个或多个区域ID的祖先路径
	 * @param {string | string[]} regionIds - 单个ID或ID数组
	 * @returns {object} - 返回一个Map，key为region_id, value为包含自身在内的祖先ID数组
	 * 例如：{ "chaoyang_id": ["chaoyang_id", "beijing_id", "china_id"] }
	 */
	async getAncestorsMap(regionIds) {
		if (!regionIds) {
			return {};
		}

		const ids = Array.isArray(regionIds) ? regionIds : [regionIds];
		if (ids.length === 0) {
			return {};
		}

		// 1. 获取所有 `a-regions` 数据，在云函数端构建一个 Map
		// 对于区域这种量小、不常变的数据，可以一次性全查出来
		const { data: allRegions } = await db
			.collection('a-regions')
			.field({ _id: 1, parent_id: 1, name: 1 })
			.limit(5000) // 假设你的区域不会超过5000
			.get();

		// 2. 构建一个易于查找的 Map
		const regionMap = new Map(allRegions.map((item) => [item._id, item]));

		const ancestorsMap = {};

		// 3. 为每个传入的ID查找祖先
		for (const id of ids) {
			let currentId = id;
			const path = [];

			// 循环向上查找，最多10层，防止死循环
			for (let i = 0; i < 10; i++) {
				if (!currentId || !regionMap.has(currentId)) {
					break; // 找不到或到顶了
				}

				path.push(currentId); // 1. 将自己加入

				const region = regionMap.get(currentId);
				currentId = region.parent_id; // 2. 移动到父级
			}

			ancestorsMap[id] = path; // 存储路径
		}

		return ancestorsMap;
	}
};
