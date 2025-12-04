<template>
	<view class="uni-container">
		<view class="uni-header">
			<view class="uni-group">
				<button type="default" size="mini" @click="goBack">返回</button>
				<view class="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center ml-5">
					<i class="fas fa-check-double text-white text-xs"></i>
				</view>
				<view class="uni-title ml-2">POI 批量校准</view>
				<view class="uni-sub-title">系统建议: {{ rawSuggestions.length }} 条</view>
			</view>
			<view class="uni-group">
				<button class="uni-button" type="default" size="mini" @click="loadSuggestions" :loading="loading">
					<uni-icons type="refreshempty" size="16" style="margin-right: 5px"></uni-icons>
					{{ loading ? '加载中...' : '加载匹配建议' }}
				</button>
				<button class="uni-button" type="primary" size="mini" @click="confirmAllUnambiguous" :disabled="loading">
					<uni-icons type="checkbox-filled" size="16" style="margin-right: 5px"></uni-icons>
					一键确认所有无歧义
				</button>
			</view>
		</view>

		<view class="uni-container" style="padding-top: 15px">
			<view v-if="loading" class="loading-prompt">
				<uni-load-more status="loading" iconType="snow"></uni-load-more>
			</view>

			<view v-else-if="!rawSuggestions || rawSuggestions.length === 0" class="empty-prompt">
				<text>太棒了！没有需要校准的POI。</text>
				<text>如果需要重新加载，请点击右上角按钮。</text>
			</view>

			<view v-else class="grouped-suggestion-list">
				<uni-collapse v-model="openItineraries" accordion ref="l1Collapse">
					<uni-collapse-item v-for="[itineraryId, itineraryGroup] in groupedSuggestions" :key="itineraryId" :name="itineraryId">
						<template v-slot:title>
							<view class="collapse-title-l1">
								<view class="title-details">
									<view class="title-text-line">
										<!-- <uni-icons type="map-pin-ellipse" size="18" color="#007aff"></uni-icons> -->
										<text class="title-type" :class="itineraryGroup.meta.collection === 'a-snapshots' ? 'type-snapshot' : 'type-product'">
											{{ itineraryGroup.meta.collection === 'a-snapshots' ? '快照' : '商品' }}
										</text>
										<text class="title-text">{{ itineraryGroup.meta.title || '(无标题)' }}</text>
										<text class="title-count">({{ getItineraryActivityCount(itineraryGroup.daysMap) }} 项)</text>
									</view>
									<view class="title-sub-info">
										<text v-if="itineraryGroup.meta.collection === 'a-itineraries'">{{ itineraryGroup.meta.ctrip_id }}</text>
										<text v-else-if="itineraryGroup.meta.collection === 'a-snapshots'">{{ itineraryGroup.meta.order_id }}</text>
										<text v-if="itineraryGroup.meta.sub_title" class="ml-1">| {{ itineraryGroup.meta.sub_title }}</text>
									</view>
								</view>
							</view>
						</template>

						<view class="day-collapse-container">
							<uni-collapse v-model="openDays" @click="onDayCollapseChange">
								<uni-collapse-item v-for="[day, activities] in itineraryGroup.daysMap" :key="dayKey(itineraryId, day)" :name="dayKey(itineraryId, day)">
									<template v-slot:title>
										<view class="collapse-title-l2">
											<uni-icons type="calendar" size="16" color="#666"></uni-icons>
											<text class="title-text">第 {{ day }} 天</text>
											<text class="title-count">({{ activities.length }} 项)</text>
										</view>
									</template>

									<view class="activity-list">
										<template v-for="act in activities" :key="act.activity_id">
											<view class="suggestion-card" v-if="doesActivityNeedProcessing(act)">
												<view class="card-header">
													<text class="card-type-badge" :class="'type-' + act.elementType">{{ getActivityTypeName(act.elementType) }}</text>
												</view>

												<view class="card-body">
													<calibration-item
														v-if="act.elementType === 'restaurant' && (act.restaurant_location || act.restaurant_remark) && isUnprocessed(act.match_status)"
														:item="{ name: act.restaurant_location || act.restaurant_remark }"
														:suggestions="act.suggestions"
														@update="handleUpdate($event, act, '1-to-1')"></calibration-item>

													<calibration-item
														v-if="act.elementType === 'hotel' && act.hotel_name && isUnprocessed(act.match_status)"
														:item="{ name: act.hotel_name }"
														:suggestions="act.suggestions"
														@update="handleUpdate($event, act, '1-to-1')"></calibration-item>

													<template v-if="act.elementType === 'scenic' && act.scenic_spots">
														<template v-for="(spot, s_index) in act.scenic_spots" :key="s_index">
															<calibration-item
																v-if="spot && spot.name && isUnprocessed(spot.match_status)"
																:item="{ name: spot.name }"
																:suggestions="spot.suggestions"
																@update="handleUpdate($event, act, 'scenic', spot.name)"></calibration-item>
														</template>
													</template>

													<template v-if="act.elementType === 'hotel' && act.alternativeHotels">
														<template v-for="(hotel, h_index) in act.alternativeHotels" :key="h_index">
															<calibration-item
																v-if="hotel && hotel.name && isUnprocessed(hotel.match_status)"
																:item="{ name: hotel.name }"
																:suggestions="hotel.suggestions"
																@update="handleUpdate($event, act, 'hotel-alt', hotel.name)"></calibration-item>
														</template>
													</template>
												</view>
											</view>
										</template>
									</view>
								</uni-collapse-item>
							</uni-collapse>
						</view>
					</uni-collapse-item>
				</uni-collapse>
			</view>
		</view>
	</view>
</template>

<script>
// 导入我们即将创建的子组件
import CalibrationItem from './components/calibration-item.vue';
const poiService = uniCloud.importObject('a-poi-service');
import { toRaw } from 'vue';

export default {
	components: {
		CalibrationItem
	},
	data() {
		return {
			loading: false,
			rawSuggestions: [],
			openItineraries: '',
			openDays: []
		};
	},
	computed: {
		/**
		 * @returns {Map<string, Map<number, Array<object>>>}
		 * 结构: Map<ItineraryID, Map<DayNumber, Activity[]>>
		 */
		groupedSuggestions() {
			const groups = new Map();
			if (!this.rawSuggestions) {
				return groups;
			}

			this.rawSuggestions.forEach((act) => {
				// 级别 1: 按 Itinerary ID
				if (!groups.has(act.itinerary_id)) {
					groups.set(act.itinerary_id, {
						// 存储行程元数据 (从第一个活动中提取)
						meta: {
							itinerary_id: act.itinerary_id,
							order_id: act.order_id,
							collection: act.collection,
							title: act.title,
							sub_title: act.sub_title,
							ctrip_id: act.ctrip_id
						},
						// 创建用于存储“天”的 Map
						daysMap: new Map()
					});
				}
				const itineraryGroup = groups.get(act.itinerary_id);
				const dayMap = itineraryGroup.daysMap;

				// 级别 2: 按 Day
				if (!dayMap.has(act.day)) {
					dayMap.set(act.day, []);
				}
				const activities = dayMap.get(act.day);

				activities.push(act);
			});

			return groups;
		}
	},
	onLoad() {
		this.loadSuggestions();
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},
		onDayCollapseChange() {
			// uni-collapse-item 组件内部有一个 resize() 方法
			// 我们需要找到当前激活的 L1 (行程) 面板，并调用它的 resize()

			// 1. 确保 L1 ref 存在
			if (!this.$refs.l1Collapse) {
				return;
			}

			setTimeout(() => {
				this.$refs.l1Collapse.resize();
			}, 300);
		},

		getActivityTypeName(elementType) {
			const nameMap = {
				assembly: '集合',
				transport: '交通',
				restaurant: '餐厅',
				scenic: '景点',
				hotel: '酒店',
				other: '其他',
				dismissal: '解散'
			};
			return nameMap[elementType] || '未知';
		},

		dayKey(itineraryId, day) {
			return `${itineraryId}_day_${day}`;
		},

		getItineraryActivityCount(daysMap) {
			let count = 0;
			for (const activities of daysMap.values()) {
				count += activities.length;
			}
			return count;
		},

		isUnprocessed(status) {
			// 覆盖 'unmatched', null, undefined, 和 '' (空字符串)
			return !status || status === 'unmatched';
		},

		// 1. 加载建议
		async loadSuggestions() {
			// try {
			// 	console.log('开始执行架构迁移(ID + Hotels)...');
			// 	const migRes = await poiService.migrateItinerarySchema();
			// 	console.log('迁移结果:', migRes);
			// 	uni.showModal({ title: '迁移完成', content: JSON.stringify(migRes), showCancel: false });
			// } catch (e) {
			// 	console.error('迁移失败:', e);
			// 	uni.showModal({ title: '迁移失败', content: e.message, showCancel: false });
			// }

			this.loading = true;
			this.openItineraries = '';
			this.openDays = [];
			try {
				const res = await poiService.getMatchSuggestions();
				this.rawSuggestions = res.suggestions || [];
				uni.showToast({
					title: `加载了 ${res.total} 条建议`,
					icon: 'none'
				});

				if (this.groupedSuggestions.size > 0) {
					const firstItineraryId = this.groupedSuggestions.keys().next().value;
					this.openItineraries = firstItineraryId;
				}
			} catch (error) {
				uni.showModal({
					title: '加载失败',
					content: error.message,
					showCancel: false
				});
			} finally {
				this.loading = false;
			}
		},

		// 2. 处理子组件的更新事件 (手动选择或忽略)
		async handleUpdate(updateData, activity, matchType, itemName = null) {
			const { linked_poi_id, match_status } = updateData;
			const update = {
				itinerary_id: activity.itinerary_id,
				collection: activity.collection,
				activity_id: activity.activity_id,
				match_type: matchType,
				item_name: itemName,
				linked_poi_id: linked_poi_id,
				match_status: match_status
			};
			this.removeItemFromSuggestions(activity.activity_id, matchType, itemName, match_status);

			// 2. 立即显示成功提示
			uni.showToast({
				title: match_status === 'ignore' ? '已忽略' : '已确认',
				icon: 'success',
				duration: 1500
			});

			// 3. 在后台异步执行数据库写入 (注意：不再 await)
			try {
				poiService
					.batchConfirmPois([update])
					.then((res) => {
						// 3a. 后台成功了，很好，不需要打扰用户
						console.log('后台更新成功:', res);
					})
					.catch((error) => {
						// 3b. [!! 关键: 失败回滚 !!]
						// 后台失败了，必须通知用户并重新加载
						console.error('后台更新失败:', error);
						uni.showModal({
							title: '更新失败',
							content: `刚才的操作在后台保存失败: ${error.message}。列表将重新加载。`,
							showCancel: false,
							success: () => {
								this.loadSuggestions(); // 重新加载以恢复
							}
						});
					});
			} catch (error) {
				// 捕获 'poiService.batchConfirmPois' *调用本身*的错误 (e.g., 网络问题)
				console.error('调用更新失败:', error);
				uni.showModal({
					title: '调用失败',
					content: `无法发送更新请求: ${error.message}。列表将重新加载。`,
					showCancel: false,
					success: () => {
						this.loadSuggestions(); // 重新加载以恢复
					}
				});
			}
		},

		// 3. 一键确认所有无歧义
		async confirmAllUnambiguous() {
			const updates = [];

			this.rawSuggestions.forEach((act) => {
				// 1-to-1 (餐厅, 酒店主酒店)
				if (this.isUnprocessed(act.match_status) && act.suggestions && act.suggestions.length === 1) {
					updates.push({
						itinerary_id: act.itinerary_id,
						collection: act.collection,
						activity_id: act.activity_id,
						match_type: '1-to-1',
						item_name: null,
						linked_poi_id: act.suggestions[0]._id,
						match_status: 'auto'
					});
				}

				// 1-to-N (景点)
				if (act.elementType === 'scenic' && act.scenic_spots) {
					act.scenic_spots.forEach((spot) => {
						if (spot && this.isUnprocessed(spot.match_status) && spot.suggestions && spot.suggestions.length === 1) {
							updates.push({
								itinerary_id: act.itinerary_id,
								collection: act.collection,
								activity_id: act.activity_id,
								match_type: 'scenic',
								item_name: spot.name,
								linked_poi_id: spot.suggestions[0]._id,
								match_status: 'auto'
							});
						}
					});
				}

				// 1-to-N (备选酒店)
				if (act.elementType === 'hotel' && act.alternativeHotels) {
					act.alternativeHotels.forEach((hotel) => {
						if (hotel && this.isUnprocessed(hotel.match_status) && hotel.suggestions && hotel.suggestions.length === 1) {
							updates.push({
								itinerary_id: act.itinerary_id,
								collection: act.collection,
								activity_id: act.activity_id,
								match_type: 'hotel-alt',
								item_name: hotel.name,
								linked_poi_id: hotel.suggestions[0]._id,
								match_status: 'auto'
							});
						}
					});
				}
			});

			if (updates.length === 0) {
				uni.showToast({ title: '没有找到无歧义的建议', icon: 'none' });
				return;
			}

			uni.showLoading({ title: `正在提交 ${updates.length} 条...` });
			try {
				const res = await poiService.batchConfirmPois(updates);
				uni.showToast({ title: `成功确认 ${res.updated} 条`, icon: 'success' });
				this.loadSuggestions(); // 重新加载
			} catch (error) {
				uni.showModal({ title: '批量确认失败', content: error.message, showCancel: false });
			} finally {
				uni.hideLoading();
			}
		},

		// 4. (辅助) 从列表中移除已处理的项
		removeItemFromSuggestions(activityid, matchType, itemName, newStatus) {
			const actIndex = this.rawSuggestions.findIndex((a) => a.activity_id === activityid);
			if (actIndex === -1) return;

			const act = this.rawSuggestions[actIndex];

			if (matchType === '1-to-1') {
				act.match_status = newStatus; // 标记为已处理
			} else if (matchType === 'scenic' && act.scenic_spots) {
				const spot = act.scenic_spots.find((s) => s.name === itemName);
				if (spot) spot.match_status = newStatus;
			} else if (matchType === 'hotel-alt' && act.alternativeHotels) {
				const hotel = act.alternativeHotels.find((h) => h.name === itemName);
				if (hotel) hotel.match_status = newStatus;
			}

			// 检查此活动是否还有其他未处理项
			let hasUnmatched = false;
			if (this.isUnprocessed(act.match_status)) hasUnmatched = true;
			if (!hasUnmatched && act.scenic_spots) {
				hasUnmatched = act.scenic_spots.some((s) => s && this.isUnprocessed(s.match_status));
			}
			if (!hasUnmatched && act.alternativeHotels) {
				hasUnmatched = act.alternativeHotels.some((h) => h && this.isUnprocessed(h.match_status));
			}

			// 如果此活动所有项都处理完了，从列表中移除
			if (!hasUnmatched) {
				this.rawSuggestions.splice(actIndex, 1);
			} else {
				// 强制刷新 (计算属性会自动更新)
				this.rawSuggestions = [...this.rawSuggestions];
			}
		},

		doesActivityNeedProcessing(act) {
			if (!act) return false;

			// 1.检查 1-to-1 餐厅
			if (act.elementType === 'restaurant') {
				if (this.isUnprocessed(act.match_status) && (act.restaurant_location?.trim() || act.restaurant_remark?.trim())) {
					return true;
				}
			}

			// 2. 检查 1-to-1 酒店 (主酒店)
			if (act.elementType === 'hotel') {
				if (this.isUnprocessed(act.match_status) && act.hotel_name?.trim()) {
					return true;
				}
			}

			// 2. 检查 1-to-N 景点
			if (act.elementType === 'scenic' && act.scenic_spots) {
				if (act.scenic_spots.some((s) => s && s.name?.trim() && this.isUnprocessed(s.match_status))) {
					return true;
				}
			}

			// 3. 检查 1-to-N 备选酒店 (酒店类型独有)
			if (act.elementType === 'hotel' && act.alternativeHotels) {
				if (act.alternativeHotels.some((h) => h && h.name?.trim() && this.isUnprocessed(h.match_status))) {
					return true;
				}
			}

			// 4. 如果以上所有检查都未返回 true，则说明此活动已处理完毕
			return false;
		}
	}
};
</script>

<style scoped>
.loading-prompt,
.empty-prompt {
	text-align: center;
	padding: 50px 20px;
	color: #666;
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.grouped-suggestion-list {
	display: flex;
	flex-direction: column;
	gap: 10px; /* 让L1卡片之间有间距 */
}

.grouped-suggestion-list > uni-collapse > :deep(.uni-collapse-item) :deep(.uni-collapse-item__wrap) {
	overflow: visible !important;
}
.grouped-suggestion-list > uni-collapse > :deep(.uni-collapse-item) :deep(.uni-collapse-item__wrap-content) {
	overflow: visible !important;
}

.collapse-title-l1 {
	gap: 10px;
}

.title-details {
	display: flex;
	flex-direction: column;
	gap: 4px;
	flex: 1;
	min-width: 0; /* 关键: 防止 flex 溢出 */
}

.title-text-line {
	display: flex;
	align-items: center;
	gap: 8px;
}

.title-type {
	font-size: 11px;
	font-weight: 600;
	padding: 2px 5px;
	border-radius: 4px;
	color: #fff;
	flex-shrink: 0; /* 防止标签被压缩 */
}
.type-product {
	background-color: #007aff;
}
.type-snapshot {
	background-color: #f3a73f;
}

.title-text {
	font-size: 15px;
	font-weight: bold;
	color: #333;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	flex-grow: 1; /* 让标题占据剩余空间 */
}

.title-count {
	font-size: 14px;
	font-weight: normal;
	color: #666;
	flex-shrink: 0; /* 防止数量被压缩 */
}

.title-sub-info {
	font-size: 12px;
	color: #888;
	font-weight: normal;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.day-collapse-container {
	padding: 5px 0 5px 15px;
	background: #fdfdfd;
}

.day-collapse-container > uni-collapse > :deep(.uni-collapse-item) :deep(.uni-collapse-item__wrap) {
	overflow: visible !important;
}
.day-collapse-container > uni-collapse > :deep(.uni-collapse-item) :deep(.uni-collapse-item__wrap-content) {
	overflow: visible !important;
}

.collapse-title-l2 {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	font-weight: 600;
	color: #444;
	padding: 8px 0;
}

.activity-list {
	display: flex;
	flex-direction: column;
	gap: 15px;
	padding: 10px 0 10px 15px;
	border-left: 2px solid #e5e5e5;
}

.suggestion-card {
	background: #fff;
	border: 1px solid #e5e5e5;
	border-radius: 8px;
	overflow: visible;
	position: relative;
	z-index: 1;
}
.suggestion-card:hover {
	z-index: 10;
}

.card-header {
	background: #f8f8f8;
	padding: 10px 15px;
	border-bottom: 1px solid #e5e5e5;
	border-radius: 8px 8px 0 0;
	display: flex;
	align-items: center;
	gap: 8px;
}
.card-title {
	font-size: 14px;
	font-weight: 600;
	color: #333;
}
.card-subtitle {
	font-size: 12px;
	color: #666;
}
.card-body {
	padding: 15px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	border-radius: 0 0 8px 8px;
}

.card-type-badge {
	display: inline-flex;
	align-items: center;
	padding: 3px 8px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 600;
	white-space: nowrap;
}
.type-restaurant {
	background: #fecaca;
	color: #991b1b;
}
.type-scenic {
	background: #d1fae5;
	color: #065f46;
}
.type-hotel {
	background: #e0e7ff;
	color: #3730a3;
}
.type-assembly {
	background: #dbeafe;
	color: #1e40af;
}
.type-transport {
	background: #fef3c7;
	color: #92400e;
}
.type-other {
	background: #f3e8ff;
	color: #6b21a8;
}
.type-dismissal {
	background: #f1f5f9;
	color: #475569;
}
</style>
