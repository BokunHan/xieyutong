// uniCloud-aliyun/cloudfunctions/a-poi-service/index.obj.js

const db = uniCloud.database();
const dbCmd = db.command;
const $ = dbCmd.aggregate;

/**
 * 辅助函数：构建复杂的 "未匹配" 查询条件
 * (此函数无需修改)
 */
function _buildMatchQuery() {
	// 1. 餐厅: 1对1
	const restaurantUnmatched = dbCmd.and({
		elementType: 'restaurant',
		match_status: dbCmd.nin(['auto', 'manual', 'ignore'])
	});

	// 2. 酒店: 1对1 (主酒店)
	const hotelMainUnmatched = dbCmd.and({
		elementType: 'hotel',
		match_status: dbCmd.nin(['auto', 'manual', 'ignore'])
	});

	// 3. 备选酒店: 1对N
	// (注意：原版 schema 字段是 itinerary.activities.elementData... 在聚合中已被拉平)
	const hotelAltUnmatched = dbCmd.and({
		elementType: 'hotel',
		alternativeHotels: dbCmd.elemMatch({
			match_status: dbCmd.nin(['auto', 'manual', 'ignore'])
		})
	});

	// 4. 景点: 1对N
	const scenicUnmatched = dbCmd.and({
		elementType: 'scenic',
		scenic_spots: dbCmd.elemMatch({
			match_status: dbCmd.nin(['auto', 'manual', 'ignore'])
		})
	});

	return dbCmd.or(restaurantUnmatched, hotelMainUnmatched, hotelAltUnmatched, scenicUnmatched);
}

/**
 * 辅助函数：对指定集合执行行程聚合查询
 */
async function _runAggregation(collectionName) {
	const { data } = await db
		.collection(collectionName)
		.aggregate()
		.unwind('$itinerary')
		.unwind('$itinerary.activities')
		.project({
			_id: 0,
			itinerary_id: '$_id',
			order_id: '$order_id',
			collection: collectionName,
			product_id: '$product_id',
			ctrip_id: '$ctrip_id',
			title: '$title',
			sub_title: '$sub_title',
			day: '$itinerary.day',
			activity_id: '$itinerary.activities.id',
			elementType: '$itinerary.activities.elementType',
			linked_poi_id: '$itinerary.activities.linked_poi_id',
			match_status: '$itinerary.activities.match_status',
			scenic_spots: '$itinerary.activities.elementData.scenic_spots',
			restaurant_location: '$itinerary.activities.elementData.location',
			restaurant_remark: '$itinerary.activities.elementData.remark',
			hotel_name: '$itinerary.activities.elementData.hotelName',
			alternativeHotels: '$itinerary.activities.elementData.alternativeHotels'
		})
		.match(_buildMatchQuery())
		.limit(200)
		.end();
	return data || [];
}

/**
 * 帮助创建和排序 POI 搜索列表
 */
function createSearchList(poiList) {
	const searchList = [];
	poiList.forEach((poi) => {
		// 确保名称有效且长度大于1
		if (poi.name && poi.name.length > 1) {
			searchList.push({ name: poi.name, poi: poi });
		}
		if (poi.aliases) {
			poi.aliases.forEach((alias) => {
				if (alias && alias.length > 1) {
					searchList.push({ name: alias, poi: poi });
				}
			});
		}
	});

	// 按名称长度倒序排序
	searchList.sort((a, b) => b.name.length - a.name.length);
	return searchList;
}

function isUnprocessed(status) {
	// 覆盖 'unmatched', null, undefined, 和 '' (空字符串)
	return !status || status === 'unmatched';
}

/**
 * 辅助函数：加载并缓存所有POI数据和搜索列表
 */
async function _loadPoiCache(db, dbCmd) {
	// 1. 获取 POI 分类 ID
	const { data: categories } = await db
		.collection('a-poi-categories')
		.where({
			name: dbCmd.in(['酒店', '餐厅', '景点'])
		})
		.field({ _id: 1, name: 1 })
		.get();

	const categoryMap = {};
	const typeToCatId = {};
	categories.forEach((cat) => {
		categoryMap[cat.name] = cat._id;
	});
	if (categoryMap['酒店']) typeToCatId['hotel'] = categoryMap['酒店'];
	if (categoryMap['餐厅']) typeToCatId['restaurant'] = categoryMap['餐厅'];
	if (categoryMap['景点']) typeToCatId['scenic'] = categoryMap['景点'];

	// 2. 加载所有 POI 数据
	const { data: allPois } = await db.collection('a-poi-database').field({ _id: 1, name: 1, aliases: 1, category_id: 1 }).limit(10000).get();

	if (!allPois || allPois.length === 0) {
		console.warn('POI 数据库为空，无法进行匹配。');
		return { hotelSearchList: [], restaurantSearchList: [], scenicSearchList: [] };
	}

	// 3. 按类型拆分 POI
	const hotelPois = [],
		restaurantPois = [],
		scenicPois = [];
	allPois.forEach((poi) => {
		if (poi.category_id === typeToCatId['hotel']) hotelPois.push(poi);
		else if (poi.category_id === typeToCatId['restaurant']) restaurantPois.push(poi);
		else if (poi.category_id === typeToCatId['scenic']) scenicPois.push(poi);
	});

	// 4. 为每个类型创建优化的搜索列表
	return {
		hotelSearchList: createSearchList(hotelPois),
		restaurantSearchList: createSearchList(restaurantPois),
		scenicSearchList: createSearchList(scenicPois)
	};
}

const serviceModule = {
	_before: async function () {
		// 可以在这里做权限校验，比如检查是否为 admin
	},

	/**
	 * 获取POI匹配建议 (已修改为“包含匹配”)
	 *
	 * 遍历所有行程中未匹配的活动，并从 poi-database 中查找建议
	 */
	async getMatchSuggestions() {
		console.log('开始获取POI匹配建议 (按类型过滤)...');

		const { hotelSearchList, restaurantSearchList, scenicSearchList } = await _loadPoiCache(db, dbCmd);

		console.log(`分类完毕: ${hotelSearchList.length} (酒店), ${restaurantSearchList.length} (餐厅), ${scenicSearchList.length} (景点)`);

		console.log('正在聚合查询 a-itineraries...');
		const itineraryPromise = _runAggregation('a-itineraries');

		console.log('正在聚合查询 a-snapshots...');
		const snapshotPromise = _runAggregation('a-snapshots');

		// 并发执行查询
		const [itineraryActivities, snapshotActivities] = await Promise.all([itineraryPromise, snapshotPromise]);

		// 合并结果
		const itineraries = [...itineraryActivities, ...snapshotActivities];

		if (!itineraries || itineraries.length === 0) {
			console.log('没有找到需要匹配的活动。');
			return {
				suggestions: [],
				total: 0
			};
		}

		console.log(`找到 ${itineraries.length} 个未匹配的活动项。`);

		itineraries.forEach((act) => {
			act.suggestions = [];
			const foundPois = new Map(); // 存储 1-to-1 匹配到的POI，使用Map去重
			const type = act.elementType;

			// 辅助函数：在文本中搜索匹配的POI
			const findMatchesInText = (textToSearch, searchList) => {
				if (!textToSearch || !searchList) return;
				for (const poiEntry of searchList) {
					if (textToSearch.includes(poiEntry.name)) {
						if (!foundPois.has(poiEntry.poi._id)) {
							foundPois.set(poiEntry.poi._id, poiEntry.poi);
						}
					}
				}
			};

			// 辅助函数：为 1-to-N 的子项查找匹配 (景点、备选酒店)
			const findMatchesForItem = (item, searchList) => {
				item.suggestions = [];
				if (!item.name || !searchList) return;

				const itemFoundPois = new Map();
				for (const poiEntry of searchList) {
					if (item.name.includes(poiEntry.name)) {
						if (!itemFoundPois.has(poiEntry.poi._id)) {
							itemFoundPois.set(poiEntry.poi._id, poiEntry.poi);
						}
					}
				}
				item.suggestions = Array.from(itemFoundPois.values());
			};

			// --- 开始匹配 ---

			// 餐厅 (1对1)
			if (type === 'restaurant' && isUnprocessed(act.match_status)) {
				findMatchesInText(act.restaurant_location, restaurantSearchList);
				findMatchesInText(act.restaurant_remark, restaurantSearchList);
			}

			// 酒店 (1对1 主酒店)
			if (type === 'hotel' && isUnprocessed(act.match_status)) {
				findMatchesInText(act.hotel_name, hotelSearchList);
			}

			// 景点 (1对N)
			if (type === 'scenic' && act.scenic_spots) {
				act.scenic_spots.forEach((spot) => {
					if (spot && isUnprocessed(spot.match_status)) {
						findMatchesForItem(spot, scenicSearchList);
					}
				});
			}

			// 备选酒店 (1对N)
			if (type === 'hotel' && act.alternativeHotels) {
				act.alternativeHotels.forEach((hotel) => {
					if (hotel && isUnprocessed(hotel.match_status)) {
						findMatchesForItem(hotel, hotelSearchList);
					}
				});
			}

			// 将 1-to-1 匹配的结果存入 act.suggestions
			act.suggestions = Array.from(foundPois.values());
		});

		return {
			suggestions: itineraries,
			total: itineraries.length
		};
	},

	/**
	 * 自动校准单个行程文档
	 * * @param {object} param
	 * @param {string} param.itinerary_id - 文档的 _id
	 * @param {string} param.collectionName - 集合名称 ('a-itineraries' 或 'a-snapshots')
	 */
	async autoCalibrateDocument({ itinerary_id, collectionName }) {
		if (!itinerary_id || !collectionName) {
			throw new Error('itinerary_id 和 collectionName 是必需的');
		}

		console.log(`[AutoCalibrate] 开始自动校准: ${collectionName} / ${itinerary_id}`);

		// 1. 加载 POI 缓存
		const { hotelSearchList, restaurantSearchList, scenicSearchList } = await _loadPoiCache(db, dbCmd);
		if (hotelSearchList.length === 0 && restaurantSearchList.length === 0 && scenicSearchList.length === 0) {
			console.warn('[AutoCalibrate] POI 数据库为空，跳过。');
			return { updated: 0, total: 0 };
		}

		// 2. 获取指定的一个文档
		const docResult = await db.collection(collectionName).doc(itinerary_id).field({ itinerary: 1 }).get();
		if (!docResult.data || docResult.data.length === 0) {
			console.warn(`[AutoCalibrate] 未找到文档: ${itinerary_id}`);
			return { updated: 0, total: 0 };
		}
		const itineraryArray = docResult.data[0].itinerary || [];

		// 3. 准备匹配逻辑 (从 getMatchSuggestions 复制)

		// 辅助函数：在文本中搜索匹配的POI (返回建议数组)
		const findMatchesInText = (textToSearch, searchList) => {
			const foundPois = new Map();
			if (!textToSearch || !searchList) return [];
			for (const poiEntry of searchList) {
				if (textToSearch.includes(poiEntry.name)) {
					if (!foundPois.has(poiEntry.poi._id)) {
						foundPois.set(poiEntry.poi._id, poiEntry.poi);
					}
				}
			}
			return Array.from(foundPois.values());
		};

		// 辅助函数：为 1-to-N 的子项查找匹配 (返回建议数组)
		const findMatchesForItem = (item, searchList) => {
			if (!item || !item.name || !searchList) return [];
			const itemFoundPois = new Map();
			for (const poiEntry of searchList) {
				if (item.name.includes(poiEntry.name)) {
					if (!itemFoundPois.has(poiEntry.poi._id)) {
						itemFoundPois.set(poiEntry.poi._id, poiEntry.poi);
					}
				}
			}
			return Array.from(itemFoundPois.values());
		};

		// 4. 遍历行程，查找无歧义匹配
		const updates = [];
		for (const day of itineraryArray) {
			if (!day.activities) continue;
			for (const act of day.activities) {
				const type = act.elementType;
				const elementData = act.elementData || {};

				// 1-to-1: 餐厅
				if (type === 'restaurant' && isUnprocessed(act.match_status)) {
					const text = (elementData.location || '') + (elementData.remark || '');
					const suggestions = findMatchesInText(text, restaurantSearchList);
					if (suggestions.length === 1) {
						updates.push({
							itinerary_id: itinerary_id,
							collection: collectionName,
							activity_id: act.id,
							match_type: '1-to-1',
							item_name: null,
							linked_poi_id: suggestions[0]._id,
							match_status: 'auto'
						});
					}
				}

				// 1-to-1: 酒店 (主)
				if (type === 'hotel' && isUnprocessed(act.match_status)) {
					const suggestions = findMatchesInText(elementData.hotelName, hotelSearchList);
					if (suggestions.length === 1) {
						updates.push({
							itinerary_id: itinerary_id,
							collection: collectionName,
							activity_id: act.id,
							match_type: '1-to-1',
							item_name: null,
							linked_poi_id: suggestions[0]._id,
							match_status: 'auto'
						});
					}
				}

				// 1-to-N: 景点
				if (type === 'scenic' && elementData.scenic_spots) {
					elementData.scenic_spots.forEach((spot) => {
						if (spot && isUnprocessed(spot.match_status)) {
							const suggestions = findMatchesForItem(spot, scenicSearchList);
							if (suggestions.length === 1) {
								updates.push({
									itinerary_id: itinerary_id,
									collection: collectionName,
									activity_id: act.id,
									match_type: 'scenic',
									item_name: spot.name,
									linked_poi_id: suggestions[0]._id,
									match_status: 'auto'
								});
							}
						}
					});
				}

				// 1-to-N: 备选酒店
				if (type === 'hotel' && elementData.alternativeHotels) {
					elementData.alternativeHotels.forEach((hotel) => {
						if (hotel && isUnprocessed(hotel.match_status)) {
							const suggestions = findMatchesForItem(hotel, hotelSearchList);
							if (suggestions.length === 1) {
								updates.push({
									itinerary_id: itinerary_id,
									collection: collectionName,
									activity_id: act.id,
									match_type: 'hotel-alt',
									item_name: hotel.name,
									linked_poi_id: suggestions[0]._id,
									match_status: 'auto'
								});
							}
						}
					});
				}
			}
		}

		// 5. 提交更新
		if (updates.length > 0) {
			console.log(`[AutoCalibrate] 发现 ${updates.length} 个无歧义匹配项，正在提交...`);
			// 直接调用本对象中的 batchConfirmPois 方法
			return await serviceModule.batchConfirmPois(updates);
		}

		console.log(`[AutoCalibrate] 未发现可自动确认的匹配项。`);
		return { updated: 0, total: 0 };
	},

	/**
	 * 批量确认POI
	 */
	async batchConfirmPois(updates) {
		if (!updates || !Array.isArray(updates) || updates.length === 0) {
			return { code: 400, message: '无效的更新请求' };
		}

		// 1. 按集合 ID 分组
		// 格式: { "a-itineraries": { "id_1": [update1] }, "a-snapshots": { "id_2": [update2] } }
		const updatesByCollection = updates.reduce((acc, update) => {
			const collection = update.collection || 'a-itineraries'; // 默认为 a-itineraries 兼容旧版
			if (!acc[collection]) {
				acc[collection] = {};
			}
			const itineraryUpdates = acc[collection];
			if (!itineraryUpdates[update.itinerary_id]) {
				itineraryUpdates[update.itinerary_id] = [];
			}
			itineraryUpdates[update.itinerary_id].push(update);
			return acc;
		}, {});

		const writeTasks = [];
		let updatedCount = 0;

		// 2. 遍历所有需要更新的行程ID
		for (const collectionName of Object.keys(updatesByCollection)) {
			const updatesByItinerary = updatesByCollection[collectionName];

			for (const itinerary_id of Object.keys(updatesByItinerary)) {
				// 3. 创建一个异步任务
				const task = async () => {
					// 3a. 读 (Read)
					const docResult = await db.collection(collectionName).doc(itinerary_id).field({ itinerary: 1 }).get();

					if (!docResult.data || docResult.data.length === 0) {
						console.warn(`未找到行程 ${itinerary_id} (在 ${collectionName} 中)，跳过...`);
						return;
					}

					let itineraryDoc = docResult.data[0];
					let itineraryArray = itineraryDoc.itinerary; // 这就是我们要修改的数组
					let docNeedsUpdate = false; // 标记此文档是否被修改

					// 3b. 改 (Modify)
					const updatesForThisDoc = updatesByItinerary[itinerary_id];

					// 遍历此行程的所有待办更新
					for (const update of updatesForThisDoc) {
						const { activity_id, match_type, item_name, linked_poi_id, match_status } = update;

						let found = false;

						// 遍历 "天"
						for (const day of itineraryArray) {
							if (found) break;
							if (!day.activities) continue;

							// 遍历 "活动"
							for (const act of day.activities) {
								if (found) break;
								if (act.id !== activity_id) continue;

								// 找到了匹配的活动 (activity_id)

								if (match_type === '1-to-1') {
									// 1-to-1 (餐厅, 酒店主酒店)
									act.linked_poi_id = linked_poi_id;
									act.match_status = match_status;
									found = true;
									docNeedsUpdate = true;
									updatedCount++; // 计数
								} else if (match_type === 'scenic' && act.elementData && act.elementData.scenic_spots) {
									// 1-to-N (景点)
									const spot = act.elementData.scenic_spots.find((s) => s && s.name === item_name);
									if (spot) {
										spot.linked_poi_id = linked_poi_id;
										spot.match_status = match_status;
										found = true;
										docNeedsUpdate = true;
										updatedCount++; // 计数
									}
								} else if (match_type === 'hotel-alt' && act.elementData && act.elementData.alternativeHotels) {
									// 1-to-N (备选酒店)
									const hotel = act.elementData.alternativeHotels.find((h) => h && h.name === item_name);
									if (hotel) {
										hotel.linked_poi_id = linked_poi_id;
										hotel.match_status = match_status;
										found = true;
										docNeedsUpdate = true;
										updatedCount++; // 计数
									}
								}
							} // 结束 "活动" 循环
						} // 结束 "天" 循环
					} // 结束 "待办更新" 循环

					// 3c. 写 (Write)
					if (docNeedsUpdate) {
						// 仅当此文档被修改时才回写数据库
						return db.collection(collectionName).doc(itinerary_id).update({
							itinerary: itineraryArray // 完整替换整个行程数组
						});
					}
				}; // 结束 task 定义

				writeTasks.push(task()); // 将此异步任务添加到队列
			} // 结束 "itinerary_id" 循环
		}

		try {
			// 并发执行所有 "读-改-写" 任务
			await Promise.all(writeTasks);
			console.log(`批量更新成功, ${updatedCount} 条记录被更新。`);
			return { success: true, updated: updatedCount, total: updates.length };
		} catch (error) {
			console.error('批量更新POI时发生错误:', error);
			return { code: 500, message: '数据库写入失败', error: error.message };
		}
	},

	/**
	 * 根据 POI ID 获取其详细信息 (名称, 分类, 区域, 标签, 媒体, 描述)
	 * @param {string} poiId - a-poi-database 的 _id
	 */
	async getPoiDetails(poiId) {
		if (!poiId) {
			return { errCode: 400, errMsg: '缺少 POI ID' };
		}

		console.log(`[POI服务] 开始查询 POI 详情: ${poiId}`);

		// 1. 获取 POI 主文档
		// 2. 联表查询 (lookup) a-poi-categories
		// 3. 联表查询 (lookup) a-regions
		// 4. 联表查询 (lookup) a-poi-tags
		const { data: poiData } = await db
			.collection('a-poi-database')
			.aggregate()
			.match({
				_id: poiId
			})
			// 联表查询分类
			.lookup({
				from: 'a-poi-categories',
				localField: 'category_id',
				foreignField: '_id',
				as: 'category'
			})
			// 联表查询标签
			.lookup({
				from: 'a-poi-tags',
				localField: 'tags',
				foreignField: '_id',
				as: 'poi_tags'
			})
			.unwind({
				path: '$region_ids',
				preserveNullAndEmptyArrays: true // 即使 region_ids 为空或null，也保留该文档
			})
			// 联表查询区域
			.lookup({
				from: 'a-regions',
				localField: 'region_ids',
				foreignField: '_id',
				as: 'region_doc'
			})

			// 投影 (project) 我们需要的字段
			.project({
				_id: true,
				name: true,
				address_text: true,
				media: true,
				description: true,
				// 将联表查询的数组结果转换为我们需要的格式
				category_name: { $arrayElemAt: ['$category.name', 0] },
				tag_names: '$poi_tags.name',
				region_name: { $arrayElemAt: ['$region_doc.name', 0] }
			})
			.group({
				_id: '$_id',
				// $first 会获取第一个文档的值
				name: { $first: '$name' },
				address_text: { $first: '$address_text' },
				media: { $first: '$media' },
				description: { $first: '$description' },
				category_name: { $first: '$category_name' },
				tag_names: { $first: '$tag_names' },
				// $push 会按照 unwind 的顺序 [c, b, a] 把 region_name 组合成数组
				region_names_ordered: { $push: '$region_name' }
			})
			.project({
				_id: true,
				name: true,
				address_text: true,
				media: true,
				description: true,
				category_name: true,
				tag_names: true,
				// 反转这个 [子, 父, 祖父] 顺序的数组
				region_names: { $reverseArray: '$region_names_ordered' }
			})
			.limit(1)
			.end();

		if (!poiData || poiData.length === 0) {
			console.log(`[POI服务] 未找到 POI: ${poiId}`);
			return { errCode: 404, errMsg: '未找到 POI' };
		}

		console.log(`[POI服务] 查询成功: ${poiData[0].name}`);
		return { errCode: 0, data: poiData[0] };
	},

	/**
	 * 添加POI并触发全局自动匹配
	 * @param {Object} poiData - 经过前端验证和处理后的POI数据
	 */
	async addPoi(poiData) {
		// 1. 数据基本校验
		if (!poiData.name || !poiData.category_id) {
			throw new Error('POI名称和分类不能为空');
		}

		// 补充创建时间和更新时间
		poiData.created_at = Date.now();
		poiData.updated_at = Date.now();

		// 2. 插入数据库
		const res = await db.collection('a-poi-database').add(poiData);

		if (res.id) {
			console.log(`POI添加成功 [${res.id}]，开始执行全局反向匹配...`);

			// 3. 异步执行匹配逻辑
			// 注意：为了加快前端响应，这里不await匹配过程，而是让它在后台运行
			// 但如果你希望用户看到“匹配完成”的提示，可以加上 await
			try {
				// 获取完整的POI对象（包含刚才插入的ID）用于匹配
				const newPoi = { ...poiData, _id: res.id };
				await serviceModule.matchNewPoiGlobal(newPoi);
			} catch (e) {
				console.error('添加后自动匹配失败:', e);
				// 匹配失败不影响添加成功的状态，仅记录日志
			}
		}

		return res;
	},

	/**
	 * 更新POI信息
	 * @param {String} id POI的文档ID
	 * @param {Object} data 表单数据
	 */
	async updatePoi(id, data) {
		if (!id) {
			throw new Error('缺少POI ID');
		}

		console.log(`[POI服务] 开始更新 POI: ${id}`);

		// 检查 route_map_image 字段
		// 1. 如果前端传来了这个字段（无论是 null 还是 对象）
		if (data.route_map_image !== undefined) {
			// 2. 使用 dbCmd.set 包裹
			// 这告诉 MongoDB：不要试图去合并属性(如 route_map_image.cloudPath)，
			// 而是把数据库里的旧值（哪怕是 null）直接扔掉，替换成这个新值。
			data.route_map_image = dbCmd.set(data.route_map_image);
		}

		data.updated_at = Date.now();

		// 执行更新
		const res = await db.collection('a-poi-database').doc(id).update(data);
		return res;
	},

	/**
	 * 针对单个新POI执行全局反向匹配
	 * 遍历所有行程，查找包含此POI名称或别名的未匹配项
	 */
	async matchNewPoiGlobal(newPoi) {
		console.log(`[GlobalMatch] 开始为新POI [${newPoi.name}] 扫描匹配项...`);

		// 准备匹配关键词：名称 + 所有别名
		let keywords = [newPoi.name];
		if (newPoi.aliases && Array.isArray(newPoi.aliases)) {
			keywords = keywords.concat(newPoi.aliases);
		}
		// 过滤空字符串并去重
		keywords = keywords.filter((k) => k && k.trim().length > 1); // 排除单字，防止误伤
		keywords = [...new Set(keywords)];

		console.log(`[GlobalMatch] 匹配关键词: ${JSON.stringify(keywords)}`);

		// 定义需要扫描的集合
		const collections = ['a-itineraries', 'a-snapshots'];
		const updates = [];

		// 获取新POI的类型 (通过 category_id 判断)
		// 这里需要先获取分类信息，或者简单通过 category_id 反查
		// 为了简化，我们先查一下分类表，确定这个POI属于 酒店、餐厅 还是 景点
		const catRes = await db.collection('a-poi-categories').doc(newPoi.category_id).get();
		if (!catRes.data || catRes.data.length === 0) return;

		const catName = catRes.data[0].name;
		let targetType = '';
		if (catName === '酒店') targetType = 'hotel';
		else if (catName === '餐厅') targetType = 'restaurant';
		else if (catName === '景点') targetType = 'scenic';

		if (!targetType) {
			console.log(`[GlobalMatch] POI分类 [${catName}] 不属于核心匹配类型，跳过。`);
			return;
		}

		// 辅助函数：检查文本是否包含任意关键词
		const isMatch = (text) => {
			if (!text) return false;
			return keywords.some((kw) => text.includes(kw));
		};

		// 辅助函数：判断状态是否未处理
		const isUnprocessed = (status) => !status || status === 'unmatched';

		// 遍历两个集合
		for (const colName of collections) {
			// 每次取 100 条处理，循环直到取完 (简单起见，这里假设系统体量在几千条以内，一次性取字段进行内存匹配)
			// 生产环境建议使用 skip/limit 分页处理，这里为了代码简洁使用流式读取或大Limit
			const { data: docs } = await db
				.collection(colName)
				.where({
					// 仅查询包含相关活动的行程，减少数据量（简单优化）
					'itinerary.activities.elementType': targetType
				})
				.field({ itinerary: 1 }) // 只需要行程数组
				.limit(1000) // 限制每次处理上限，防止超时
				.get();

			for (const doc of docs) {
				if (!doc.itinerary) continue;

				for (const day of doc.itinerary) {
					if (!day.activities) continue;

					for (const act of day.activities) {
						// 类型必须匹配
						if (act.elementType !== targetType) continue;

						const elementData = act.elementData || {};

						// 1. 匹配餐厅 (1-to-1)
						if (targetType === 'restaurant' && isUnprocessed(act.match_status)) {
							const text = (elementData.location || '') + (elementData.remark || '');
							if (isMatch(text)) {
								updates.push({
									itinerary_id: doc._id,
									collection: colName,
									activity_id: act.id,
									match_type: '1-to-1',
									linked_poi_id: newPoi._id,
									match_status: 'auto'
								});
							}
						}

						// 2. 匹配酒店 (主酒店 1-to-1)
						if (targetType === 'hotel' && isUnprocessed(act.match_status)) {
							if (isMatch(elementData.hotelName)) {
								updates.push({
									itinerary_id: doc._id,
									collection: colName,
									activity_id: act.id,
									match_type: '1-to-1',
									linked_poi_id: newPoi._id,
									match_status: 'auto'
								});
							}
						}

						// 3. 匹配景点 (1-to-N)
						if (targetType === 'scenic' && elementData.scenic_spots) {
							elementData.scenic_spots.forEach((spot) => {
								if (spot && isUnprocessed(spot.match_status) && isMatch(spot.name)) {
									updates.push({
										itinerary_id: doc._id,
										collection: colName,
										activity_id: act.id,
										match_type: 'scenic',
										item_name: spot.name,
										linked_poi_id: newPoi._id,
										match_status: 'auto'
									});
								}
							});
						}

						// 4. 匹配备选酒店 (1-to-N)
						if (targetType === 'hotel' && elementData.alternativeHotels) {
							elementData.alternativeHotels.forEach((hotel) => {
								if (hotel && isUnprocessed(hotel.match_status) && isMatch(hotel.name)) {
									updates.push({
										itinerary_id: doc._id,
										collection: colName,
										activity_id: act.id,
										match_type: 'hotel-alt',
										item_name: hotel.name,
										linked_poi_id: newPoi._id,
										match_status: 'auto'
									});
								}
							});
						}
					}
				}
			}
		}

		if (updates.length > 0) {
			console.log(`[GlobalMatch] 发现 ${updates.length} 个匹配项，正在更新数据库...`);
			await serviceModule.batchConfirmPois(updates); // 复用现有的批量更新逻辑
			console.log(`[GlobalMatch] 更新完成。`);
		} else {
			console.log(`[GlobalMatch] 未发现相关行程匹配。`);
		}

		return { matchedCount: updates.length };
	}

	// async migrateItinerarySchema() {
	// 	console.log('开始执行【行程架构迁移】任务 - 针对 a-itineraries 和 a-snapshots...');
	// 	const db = uniCloud.database();
	// 	const MAX_LIMIT = 50; // 每次处理50个行程，防止超时

	// 	async function runMigrationForCollection(collectionName) {
	// 		console.log(`--- 开始处理集合: ${collectionName} ---`);
	// 		let processedCount = 0;
	// 		let skip = 0;
	// 		let hasMore = true;

	// 		while (hasMore) {
	// 			console.log(`[${collectionName}] 正在处理第 ${skip} 至 ${skip + MAX_LIMIT} 条...`);

	// 			const { data: docs } = await db.collection(collectionName).field({ itinerary: 1 }).skip(skip).limit(MAX_LIMIT).get();

	// 			if (docs.length === 0) {
	// 				hasMore = false;
	// 				console.log(`[${collectionName}] 没有更多需要处理的文档。`);
	// 				break;
	// 			}

	// 			const updateTasks = [];

	// 			for (const doc of docs) {
	// 				let needsUpdate = false;

	// 				if (doc.itinerary && Array.isArray(doc.itinerary)) {
	// 					doc.itinerary.forEach((day) => {
	// 						if (day.activities && Array.isArray(day.activities)) {
	// 							day.activities.forEach((activity) => {
	// 								// [!! 任务1 !!] 修复缺失的 ID
	// 								if (!activity.id) {
	// 									needsUpdate = true;
	// 									//
	// 									activity.id = 'act_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
	// 								}

	// 								// [!! 任务2 !!] 修复 alternativeHotels (string[] -> object[])
	// 								//
	// 								if (
	// 									activity.elementType === 'hotel' &&
	// 									activity.elementData &&
	// 									activity.elementData.alternativeHotels &&
	// 									activity.elementData.alternativeHotels.length > 0 &&
	// 									typeof activity.elementData.alternativeHotels[0] === 'string' // 增加检查，防止重复迁移
	// 								) {
	// 									needsUpdate = true;
	// 									activity.elementData.alternativeHotels = activity.elementData.alternativeHotels.map((hotelName) => ({
	// 										name: hotelName,
	// 										linked_poi_id: null,
	// 										match_status: 'unmatched'
	// 									}));
	// 								}
	// 							});
	// 						}
	// 					});
	// 				}

	// 				// 5. 如果此文档被修改了，则添加一个更新任务
	// 				if (needsUpdate) {
	// 					processedCount++;
	// 					updateTasks.push(
	// 						db.collection(collectionName).doc(doc._id).update({
	// 							itinerary: doc.itinerary // 完整替换 itinerary 数组
	// 						})
	// 					);
	// 				}
	// 			}

	// 			// 6. 并发执行本批次的更新
	// 			if (updateTasks.length > 0) {
	// 				await Promise.all(updateTasks);
	// 				console.log(`[${collectionName}] 本批次成功更新了 ${updateTasks.length} 个文档。`);
	// 			} else {
	// 				console.log(`[${collectionName}] 本批次没有发现需要更新的活动。`);
	// 			}

	// 			skip += docs.length;
	// 			if (docs.length < MAX_LIMIT) {
	// 				hasMore = false;
	// 			}
	// 		}
	// 		console.log(`--- 集合 ${collectionName} 处理完毕 ---`);
	// 		return processedCount;
	// 	} // 结束 [runMigrationForCollection]

	// 	try {
	// 		const [itinerariesCount, snapshotsCount] = await Promise.all([
	// 			// runMigrationForCollection('a-itineraries'),
	// 			runMigrationForCollection('a-snapshots')
	// 		]);

	// 		const totalUpdated = itinerariesCount + snapshotsCount;
	// 		console.log(`迁移任务完成。总共处理并更新了 ${totalUpdated} 个行程文档。`);
	// 		return {
	// 			message: `迁移完成 (IDs 和 AlternativeHotels)`,
	// 			updatedDocuments: totalUpdated,
	// 			itinerariesUpdated: itinerariesCount,
	// 			snapshotsUpdated: snapshotsCount
	// 		};
	// 	} catch (error) {
	// 		console.error('迁移失败:', error);
	// 		// 抛出错误以便前端捕获
	// 		throw new Error(`迁移失败: ${error.message}`);
	// 	}
	// }
};

module.exports = serviceModule;
