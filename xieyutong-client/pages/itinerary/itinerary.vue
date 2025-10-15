<template>
	<view class="page-container">
		<!-- 状态栏占位 -->
		<view class="status-bar-placeholder" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 加载状态 -->
		<view class="loading-container" v-if="loading">
			<view class="loading-spinner"></view>
			<text class="loading-text">正在检查行程信息...</text>
		</view>

		<!-- 有行程状态 -->
		<view class="content-area" v-else-if="hasItinerary">
			<!-- 行程头部 -->
			<view class="itinerary-header">
				<view class="flex justify-between items-center">
					<text class="text-xl font-semibold text-gray-800">{{ itineraryData.title }}</text>
				</view>
				<view class="text-sm text-gray-500 mt-1 flex items-center justify-between w-full">
					{{ itineraryData.dateRange }}
					<view v-if="orderType === 'snapshot'" class="exit-btn" @click="exitItinerary">退出行程</view>
				</view>

				<!-- 天气信息区域 -->
				<view class="weather-info mt-3 p-3 bg-blue-50 rounded-lg">
					<!-- 今天和明天天气对比 -->
					<view class="flex">
						<!-- 今天天气 -->
						<view class="flex-1 pr-2">
							<view class="text-xs text-blue-600 font-medium mb-1">今天 {{ weatherData.today.date }}</view>
							<view class="flex items-center mb-2">
								<text class="fa fa-sun text-yellow-500 text-xl mr-3"></text>
								<view>
									<view class="text-lg font-semibold text-gray-800">{{ weatherData.today.temp }}</view>
									<view class="text-sm text-gray-600">{{ weatherData.today.condition }}</view>
								</view>
							</view>
							<view class="flex items-center mb-1">
								<text class="fa fa-map-marker-alt text-blue-500 text-xs mr-1"></text>
								<text class="text-xs text-gray-600">{{ weatherData.today.location }}</text>
								<text class="fa fa-mountain text-blue-500 text-xs ml-2 mr-1"></text>
								<text class="text-xs text-blue-600">{{ weatherData.today.altitude }}</text>
							</view>
							<view class="text-xs text-gray-500 mb-1">{{ weatherData.today.tempRange }}</view>
							<view class="text-xs text-gray-500">风力 {{ weatherData.today.wind }}</view>
						</view>

						<!-- 分隔线 -->
						<view class="w-px bg-blue-200 mx-3"></view>

						<!-- 明天天气 -->
						<view class="flex-1 pl-2">
							<view class="text-xs text-blue-600 font-medium mb-1">明天 {{ weatherData.tomorrow.date }}</view>
							<view class="flex items-center mb-2">
								<text class="fa fa-cloud-sun text-gray-500 text-xl mr-3"></text>
								<view>
									<view class="text-lg font-semibold text-gray-800">{{ weatherData.tomorrow.temp }}</view>
									<view class="text-sm text-gray-600">{{ weatherData.tomorrow.condition }}</view>
								</view>
							</view>
							<view class="flex items-center mb-1">
								<text class="fa fa-map-marker-alt text-blue-500 text-xs mr-1"></text>
								<text class="text-xs text-gray-600">{{ weatherData.tomorrow.location }}</text>
								<text class="fa fa-mountain text-blue-500 text-xs ml-2 mr-1"></text>
								<text class="text-xs text-blue-600">{{ weatherData.tomorrow.altitude }}</text>
							</view>
							<view class="text-xs text-gray-500 mb-1">{{ weatherData.tomorrow.tempRange }}</view>
							<view class="text-xs text-gray-500">风力 {{ weatherData.tomorrow.wind }}</view>
						</view>
					</view>
				</view>

				<view class="progress-container">
					<view class="flex justify-between items-center text-sm mb-1">
						<text class="font-medium">第{{ currentDay }}天/共{{ totalDays }}天</text>
						<text class="text-gray-500">{{ progressPercent }}%</text>
					</view>
					<view class="progress-bar">
						<view class="progress" :style="{ width: progressPercent + '%' }"></view>
					</view>
				</view>

				<!-- 天数选择器 -->
				<view class="day-tabs">
					<view class="day-tab" :class="{ active: selectedDay === index + 1 }" v-for="(day, index) in daysList" :key="index" @click="selectDay(index + 1)">
						Day {{ index + 1 }}
					</view>
				</view>
			</view>

			<!-- 当日行程概览 -->
			<view class="day-overview">
				<text class="font-semibold text-gray-800 mb-2 formatted-content">{{ currentDayInfo.overview }}</text>
			</view>

			<!-- 当日亮点 -->
			<view class="day-highlights" v-if="currentDayInfo.highlights">
				<view class="highlight-section">
					<view class="highlight-header">
						<text class="fa fa-star text-amber-500 mr-2"></text>
						<text class="font-semibold text-gray-800">当日亮点</text>
					</view>
					<view class="highlight-content">
						<text class="text-gray-700">{{ currentDayInfo.highlights }}</text>
					</view>
				</view>
			</view>

			<!-- 时间轴 -->
			<view class="timeline">
				<view class="timeline-line"></view>

				<!-- 时间轴项目 -->
				<view class="timeline-item" :id="'timeline-item-' + index" v-for="(item, index) in currentDaySchedule" :key="index">
					<view class="timeline-dot">
						<text :class="getTimelineIcon(item.type)"></text>
					</view>
					<view class="timeline-content">
						<view class="timeline-header">
							<view class="timeline-time">{{ item.time }}</view>
							<view class="timeline-type">
								<text :class="getTimelineIcon(item.type)"></text>
								<text class="type-text">{{ getActivityTypeName(item.elementType) }}</text>
							</view>
						</view>
						<view class="timeline-title">{{ item.title }}</view>
						<view class="timeline-desc">{{ item.description }}</view>
						<!-- <image v-if="item.image" :src="item.image" :alt="item.title" class="timeline-image" mode="aspectFill" /> -->
						<swiper v-if="item.images && item.images.length > 0" class="timeline-swiper" indicator-dots circular>
							<swiper-item v-for="(imgUrl, imgIndex) in item.images" :key="imgIndex">
								<image :src="imgUrl" :alt="item.title" class="timeline-image" mode="aspectFill" @click="previewImage(item.images, imgIndex)" />
							</swiper-item>
						</swiper>
						<view class="timeline-remark">{{ item.remark }}</view>
					</view>
				</view>
			</view>

			<!-- 底部操作区 -->
			<view class="bottom-actions">
				<view class="action-btn action-btn-light" @click="contactGuide">
					<text class="fa fa-phone mr-2"></text>
					<text>联系导游</text>
				</view>
			</view>
		</view>

		<!-- 无行程状态 -->
		<view class="content-area" v-else>
			<view class="empty-state">
				<view class="empty-state-icon">
					<text class="fa fa-route"></text>
				</view>
				<text class="text-xl font-semibold text-gray-800 mb-2">暂无行程</text>
				<text class="text-gray-600">您目前没有进行中的旅行行程，</text>
				<text class="text-gray-600">快去探索心仪的旅行产品吧！</text>
				<view class="action-button mb-14" @click="browseProducts">
					<text class="fa fa-search mr-2"></text>
					<text>浏览旅行产品</text>
				</view>
				<text class="text-gray-600 mb-2">或输入订单号来导入行程</text>
				<view class="nav-search-bar">
					<input v-model="orderId" placeholder="输入订单号..." focus="focus" placeholder-class="text-gray-400 text-sm" class="flex-1 bg-transparent text-sm text-gray-800" />
				</view>
				<view class="action-button" @click="fetchSnapshotItinerary">
					<text class="fa fa-search mr-2"></text>
					<text>导入行程</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			orderId: null,
			orderType: 'mp',
			statusBarHeight: 0, // 状态栏高度
			hasItinerary: false, // 控制显示状态
			loading: true, // 加载状态
			selectedDay: 1,
			currentDay: 1,
			totalDays: 0,
			progressPercent: 0,

			// 当前订单信息
			currentOrder: null,

			// 行程基本信息
			itineraryData: {
				title: '',
				dateRange: ''
			},

			// 天气信息
			weatherData: {
				today: {
					date: '',
					temp: '--°C',
					condition: '暂无数据',
					tempRange: '-- ~ --°C',
					wind: '--',
					location: '当前位置',
					altitude: '--m'
				},
				tomorrow: {
					date: '',
					temp: '--°C',
					condition: '暂无数据',
					tempRange: '-- ~ --°C',
					wind: '--',
					location: '下一站',
					altitude: '--m'
				}
			},

			// 天数列表
			daysList: [],

			// 当日信息
			currentDayInfo: {
				overview: '',
				highlights: ''
			},

			// 完整行程数据
			fullItinerary: null,

			// 当日行程安排
			currentDaySchedule: []
		};
	},
	async onLoad(options) {
		console.log('[行程页面] 页面开始加载，参数:', options);

		// 获取系统信息，设置状态栏高度
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;
		console.log('[行程页面] 状态栏高度:', this.statusBarHeight);

		// 检查用户是否有进行中的行程
		await this.checkUserItinerary();

		// 如果有行程，实现智能滚动
		if (this.hasItinerary) {
			await this.$nextTick();
			this.scrollToCurrentPosition();
		}

		console.log('[行程页面] 页面加载完成');
	},
	methods: {
		// 检查用户是否有进行中的行程
		async checkUserItinerary() {
			console.log('[检查行程] 开始检查用户行程');
			try {
				this.loading = true;
				console.log('[检查行程] 设置加载状态为true');

				// 先检查本地缓存的行程信息
				const cachedItinerary = uni.getStorageSync('current_itinerary');
				if (cachedItinerary) {
					console.log('[检查行程] 使用缓存的行程信息');
					await this.loadItineraryFromCache(cachedItinerary);
					return;
				}

				// 调用行程服务获取当前行程
				console.log('[检查行程] 调用行程服务获取当前行程');
				const itineraryService = uniCloud.importObject('a-itinerary-service');
				const result = await itineraryService.getCurrentItinerary();

				console.log('[检查行程] 行程服务返回结果:', result);

				if (result.errCode === 0 && result.data) {
					console.log('[检查行程] 找到进行中的行程，开始加载');
					if (result.orderType) this.orderType = result.orderType;
					// 缓存行程信息
					uni.setStorageSync('current_itinerary', result.data);
					await this.loadItineraryFromCache(result.data);
				} else {
					console.log('[检查行程] 没有找到进行中的行程');
					this.hasItinerary = false;
					// 清除可能存在的旧缓存
					uni.removeStorageSync('current_itinerary');
				}
			} catch (error) {
				console.error('[检查行程] 检查行程失败:', error);
				this.hasItinerary = false;
				// 清除可能存在的旧缓存
				uni.removeStorageSync('current_itinerary');
			} finally {
				this.loading = false;
				console.log('[检查行程] 设置加载状态为false');
			}
		},

		// 提取用户指定的订单快照行程
		async fetchSnapshotItinerary() {
			console.log('[检查行程] 开始检查用户行程');
			try {
				this.loading = true;
				console.log('[检查行程] 设置加载状态为true');

				// 先检查本地缓存的行程信息
				const cachedItinerary = uni.getStorageSync('current_itinerary');
				if (cachedItinerary) {
					console.log('[检查行程] 使用缓存的行程信息');
					await this.loadItineraryFromCache(cachedItinerary);
					return;
				}

				// 调用行程服务获取当前行程
				console.log('[检查行程] 调用行程服务获取快照行程');
				const itineraryService = uniCloud.importObject('a-itinerary-service');
				const result = await itineraryService.getSnapshotItinerary(this.orderId);

				console.log('[检查行程] 行程服务返回结果:', result);

				if (result.errCode === 0 && result.data) {
					console.log('[检查行程] 找到指定快照行程，开始加载');
					// 缓存行程信息
					uni.setStorageSync('current_itinerary', result.data);
					await this.loadItineraryFromCache(result.data);
				} else {
					console.log('[检查行程] 没有找到指定的快照行程');
					this.hasItinerary = false;
					// 清除可能存在的旧缓存
					uni.removeStorageSync('current_itinerary');
				}
			} catch (error) {
				console.error('[检查行程] 检查快照失败:', error);
				this.hasItinerary = false;
				// 清除可能存在的旧缓存
				uni.removeStorageSync('current_itinerary');
			} finally {
				this.loading = false;
				console.log('[检查行程] 设置加载状态为false');
			}
		},

		// 从缓存加载行程数据
		async loadItineraryFromCache(itineraryInfo) {
			console.log('[加载行程] 从缓存加载行程数据:', itineraryInfo);
			try {
				// 设置基本信息
				this.currentOrder = itineraryInfo.order;
				this.fullItinerary = itineraryInfo.itinerary;

				// 设置行程标题和日期
				this.itineraryData.title = itineraryInfo.itinerary.title || itineraryInfo.order.product_snapshot?.title || '';
				this.totalDays = itineraryInfo.totalDays;
				this.currentDay = itineraryInfo.currentDay;
				this.selectedDay = this.currentDay;
				this.daysList = Array.from({ length: this.totalDays }, (_, i) => i + 1);

				// 设置日期范围 - 使用云端格式化好的日期字符串
				this.itineraryData.dateRange = `${itineraryInfo.departureDate} - ${itineraryInfo.endDate}`;

				// 计算进度
				this.progressPercent = Math.round((this.currentDay / this.totalDays) * 100);

				// 加载当日行程
				this.loadDaySchedule(this.currentDay);

				// 更新天气信息 - 固定显示今天和明天的天气
				this.updateWeatherData();

				this.hasItinerary = true;
				console.log('[加载行程] 缓存行程数据加载成功');
			} catch (error) {
				console.error('[加载行程] 加载缓存行程数据失败:', error);
				this.hasItinerary = false;
				// 清除损坏的缓存
				uni.removeStorageSync('current_itinerary');
			}
		},

		// 格式化日期
		formatDate(date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const result = `${year}.${month}.${day}`;
			console.log('[格式化日期] 输入:', date.toISOString(), '输出:', result);
			return result;
		},

		// 加载指定天数的行程安排
		loadDaySchedule(day) {
			console.log('[加载日程] 开始加载第', day, '天的行程安排');

			if (!this.fullItinerary || !this.fullItinerary.itinerary) {
				console.log('[加载日程] 没有行程数据，设置为空');
				this.currentDaySchedule = [];
				this.currentDayInfo.overview = '';
				this.currentDayInfo.highlights = '';
				return;
			}

			console.log('[加载日程] 行程数据可用，总天数:', this.fullItinerary.itinerary.length);

			const dayData = this.fullItinerary.itinerary.find((item) => item.day === day);
			if (!dayData) {
				console.log('[加载日程] 没有找到第', day, '天的数据');
				this.currentDaySchedule = [];
				this.currentDayInfo.overview = '';
				this.currentDayInfo.highlights = '';
				return;
			}

			console.log('--------------DAYDATA--------------', dayData);

			console.log('[加载日程] 找到第', day, '天的数据:', {
				day_title: dayData.day_title,
				activities_count: dayData.activities?.length || 0
			});

			// 设置当日概览
			this.currentDayInfo.overview = this.formatContent(dayData.day_title, { emojiBreakStyle: 'newline' }) || '';
			console.log('[加载日程] 设置当日概览:', this.currentDayInfo.overview);

			// 设置当日亮点
			this.currentDayInfo.highlights = this.formatContent(dayData.day_highlights, { emojiBreakStyle: 'newline' }) || '';
			console.log('[加载日程] 设置当日亮点:', this.currentDayInfo.highlights);

			// 转换活动数据为时间轴格式
			if (dayData.activities && dayData.activities.length > 0) {
				this.currentDaySchedule = dayData.activities.map((activity, index) => {
					console.log('[加载日程] 处理活动', index + 1, ':', {
						elementType: activity.elementType,
						title: activity.title,
						time_start_time: activity.time_start_time,
						time_period: activity.time_period,
						remark: activity.remark
					});

					// 获取活动图片
					let activityImages = [];
					if (activity.elementData) {
						// 景点类型：从scenic_spots获取图片
						if (activity.elementType === 'scenic' && activity.elementData.scenic_spots && activity.elementData.scenic_spots.length > 0) {
							// const firstSpot = activity.elementData.scenic_spots[0];
							// if (firstSpot.images && firstSpot.images.length > 0) {
							// 	activityImage = firstSpot.images[0];
							// }
							activity.elementData.scenic_spots.forEach((spot) => {
								if (spot.images && spot.images.length > 0) {
									activityImages.push(...spot.images); // 使用扩展运算符添加所有图片
								}
							});
						}
						// 酒店类型：从elementData直接获取
						else if (activity.elementType === 'hotel' && activity.elementData.image) {
							// activityImage = activity.elementData.image;
							activityImages.push(activity.elementData.image);
						}
						// 其他类型：通用图片获取
						else if (activity.elementData.images && activity.elementData.images.length > 0) {
							// activityImage = activity.elementData.images[0];
							activityImages = activity.elementData.images;
						} else if (activity.elementData.image) {
							// activityImage = activity.elementData.image;
							activityImages.push(activity.elementData.image);
						}
					}

					// 获取具体的活动名称
					let activityTitle = activity.title || '';
					if (activity.elementData) {
						// 景点类型：使用景点的具体名称
						if (activity.elementType === 'scenic' && activity.elementData.scenic_spots && activity.elementData.scenic_spots.length > 0) {
							const spotNames = activity.elementData.scenic_spots.map((spot) => spot.name).filter((name) => name);
							if (spotNames.length > 0) {
								activityTitle = spotNames.join('、');
							}
						}
						// 酒店类型：使用酒店的具体名称
						else if (activity.elementType === 'hotel') {
							if (activity.elementData.hotelName) {
								activityTitle = activity.elementData.hotelName;
							} else if (activity.elementData.name) {
								activityTitle = activity.elementData.name;
							}
						}
						// 餐厅类型：使用餐厅的具体名称
						else if (activity.elementType === 'restaurant') {
							if (activity.elementData.name) {
								activityTitle = activity.elementData.name;
							} else if (activity.elementData.meal_type) {
								activityTitle = activity.elementData.meal_type;
							}
						}
						// 交通类型：使用路线信息
						else if (activity.elementType === 'transport') {
							if (activity.elementData.departure && activity.elementData.destination) {
								activityTitle = `${activity.elementData.departure} → ${activity.elementData.destination}`;
							}
						}
						// 集合/解散类型：使用具体地点
						else if ((activity.elementType === 'assembly' || activity.elementType === 'dismissal') && activity.elementData.locations) {
							if (activity.elementData.locations.length > 0) {
								activityTitle = activity.elementData.locations.join(' / ');
							}
						}
						// 其他类型：使用content或show_name等
						else if (activity.elementData.show_name) {
							activityTitle = activity.elementData.show_name;
						} else if (activity.elementData.name) {
							activityTitle = activity.elementData.name;
						}
					}

					return {
						type: this.mapActivityType(activity.elementType),
						elementType: activity.elementType, // 保留原始类型
						time: activity.time_start_time || activity.time_period || '',
						title: activityTitle,
						description: this.buildActivityDescription(activity),
						images: activityImages,
						remark: this.formatContent(activity.remark, { emojiBreakStyle: 'newline' }),
						elementData: activity.elementData || null // 传递完整的elementData
					};
				});
				console.log('[加载日程] 转换完成，活动数量:', this.currentDaySchedule.length);
			} else {
				console.log('[加载日程] 当天没有活动安排');
				this.currentDaySchedule = [];
			}
		},

		previewImage(urls, current) {
			uni.previewImage({
				urls: urls, // 图片地址列表
				current: current, // 当前显示的图片索引
				longPressActions: {
					itemList: ['保存图片'],
					success: function (data) {
						console.log('用户长按了图片', data);
					},
					fail: function (err) {
						console.log(err.errMsg);
					}
				}
			});
		},

		// 退出当前快照行程，并清除用户数据中的快照订单号
		async exitItinerary() {
			try {
				const res = await uni.showModal({
					title: '确认操作',
					content: '您确定要退出当前行程吗？',
					confirmText: '确定',
					cancelText: '取消'
				});

				if (res.confirm) {
					console.log('[退出行程] 正在退出当前快照行程');
					const itineraryService = uniCloud.importObject('a-itinerary-service');
					const result = await itineraryService.exitItinerary();
					if (result.errCode === 0) {
						console.log('[退出行程] 退出成功');
						this.orderId = null;
						uni.removeStorageSync('current_itinerary');
						this.hasItinerary = false;
					}
				} else if (res.cancel) {
					console.log('[退出行程] 用户取消了退出操作');
				}
			} catch (error) {
				console.error('[退出行程] 操作过程中发生错误:', error);
				uni.showToast({
					title: '操作失败，请稍后重试',
					icon: 'none'
				});
			}
		},

		// 映射活动类型到图标类型
		mapActivityType(elementType) {
			console.log('[类型映射] 映射活动类型:', elementType);
			const typeMap = {
				restaurant: 'meal',
				transport: 'transport',
				scenic: 'attraction',
				hotel: 'hotel',
				assembly: 'transport',
				dismissal: 'transport',
				other: 'attraction'
			};
			const result = typeMap[elementType] || 'attraction';
			console.log('[类型映射] 映射结果:', result);
			return result;
		},

		/**
		 * 格式化长文本，根据特定规则（如Emoji标题）添加换行（V5 - 最终版）
		 * @param {string} rawText - 原始的、未格式化的文本字符串
		 * @returns {string} 格式化后的文本
		 * // const emojiRegexPart = '(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])';
		 */
		formatContent(rawText, options = {}) {
			// 修改点1: 增加 options 参数
			if (!rawText || typeof rawText !== 'string') {
				return '';
			}

			// --- 新增：根据选项决定换行符 ---
			const { emojiBreakStyle = 'blankline' } = options;
			const breakChar = emojiBreakStyle === 'newline' ? '\n' : '\n\n';

			let content = rawText;

			const emojiRegexPart =
				'(?:❤️|❤|🧡|💖|✨|⭐️|🌈|📍|📝|⏳|🙏|✈️|🚗|➡️|🏨|🛫|📌|🍜|\\ud83c[\\udc00-\\udfff]|\\ud83d[\\udc00-\\ude4f\\ude80-\\udeff]|\\ud83e[\\udc00-\\udfff]|[\\u2600-\\u2B55])';

			// --- 第 1 步：基础清理 ---
			content = content.replace(/[\uE000-\uF8FF]/g, ''); //去除幽灵字符
			content = content.replace(/(\r\n|\n|\r|↵)?(展开|收起|详情|点击).*/, '').trim();

			// --- 第 2 步：隔离并保护特殊的 "emoji...emoji" 标题 ---
			const specialTitles = [];
			const specialTitleRegex = new RegExp(`((${emojiRegexPart})[^.。]+\\2)`, 'gu');
			content = content.replace(specialTitleRegex, (match) => {
				const placeholder = `__SPECIAL_TITLE_${specialTitles.length}__`;
				specialTitles.push(match);
				return placeholder;
			});

			// --- 第 2.5 步：分离相邻的特殊标题占位符 ---
			// 修改点2: 使用动态的 breakChar 变量
			content = content.replace(/(__SPECIAL_TITLE_\d+__)(?=\s*__SPECIAL_TITLE_\d+__)/g, `$1${breakChar}`);

			// --- 第 3 步：在常规段落标题前插入空行 ---
			// 修改点3: 使用动态的 breakChar 变量
			const emojiHeaderRegex = new RegExp(`(\\s*)(${emojiRegexPart})(?!\\s*${emojiRegexPart})(?=\s*\\S)`, 'gu');
			content = content.replace(emojiHeaderRegex, `${breakChar}$2`);

			// 修改点4: 使用动态的 breakChar 变量
			const textHeaderRegex = /([。；！？])\s*([^，。；\n\r]{1,10}：)/gu;
			content = content.replace(textHeaderRegex, `$1${breakChar}$2`);

			// 问句前后固定为空行，作为强分隔，不受选项影响
			content = content.replace(/[^.!?。！？\n\r]+[?？]/g, (match) => {
				return `\n\n${match}\n\n`;
			});

			// --- 第 4 步：统一处理所有标题和正文的关系 (增加豁免条件) ---
			content = content.replace(new RegExp(`(${emojiRegexPart}*.*?：)`, 'gu'), (match) => {
				if (/\d：$/.test(match)) {
					const nextChar = content.charAt(content.indexOf(match) + match.length);
					if (/^\d/.test(nextChar)) {
						return match;
					}
				}

				const textOnly = match.replace(new RegExp(emojiRegexPart, 'g'), '');
				if (textOnly.length - 1 > 10) {
					return match;
				}

				return match + '\n';
			});

			// --- 第 5 步：格式化数字列表 ---
			// 数字列表前固定为空行，不受选项影响
			content = content.replace(/([。；！？：])\s*(\d+\.)(?!\d)/g, '$1\n\n$2');
			content = content.replace(/([\u4e00-\u9fa5a-zA-Z])(\d+\.)(?!\d)/g, '$1\n$2');

			// --- 第 6 步：恢复特殊标题，并应用其专属的换行规则 ---
			content = content.replace(/__SPECIAL_TITLE_(\d+)__/g, (match, index) => {
				const originalTitle = specialTitles[parseInt(index)];
				if (content.trim().indexOf(match.trim()) === 0) {
					return `${originalTitle}\n`;
				}
				// 修改点5: 使用动态的 breakChar 变量
				return `${breakChar}${originalTitle}\n`;
			});

			// --- 第 7 步：最终清理 ---
			// --- 将单独占一行的冒号合并到上一行 ---
			content = content.replace(/\n\s*([:：])\s*/g, '$1');

			content = content.replace(/\n{3,}/g, '\n\n').trim();

			return content;
		},

		// 构建活动描述
		buildActivityDescription(activity) {
			console.log('[构建描述] 开始构建活动描述:', {
				title: activity.title,
				location: activity.location,
				elementType: activity.elementType,
				hasElementData: !!activity.elementData
			});

			let description = '';

			// 优先处理景点类型的详细信息
			if (activity.elementType === 'scenic' && activity.elementData?.scenic_spots) {
				const spots = activity.elementData.scenic_spots;
				for (const spot of spots) {
					if (spot.description) {
						if (description) description += '\n\n';
						description += spot.description;

						// 添加景点级别信息
						if (spot.level || activity.elementData.level) {
							description += `\n级别：${spot.level || activity.elementData.level}`;
						}

						// 添加亮点信息
						if (spot.highlights && spot.highlights.length > 0) {
							description += `\n亮点：${spot.highlights.join('、')}`;
						} else if (activity.elementData.highlights && activity.elementData.highlights.length > 0) {
							description += `\n亮点：${activity.elementData.highlights.join('、')}`;
						}

						// 添加门票信息
						if (spot.ticket_type) {
							description += `\n门票：${spot.ticket_type}`;
						}
					}
				}
			}
			// 处理酒店类型
			else if (activity.elementType === 'hotel' && activity.elementData) {
				const hotel = activity.elementData;
				if (hotel.rating) {
					description += `酒店等级：${hotel.rating}`;
				}
				if (hotel.address) {
					if (description) description += '\n';
					description += `地址：${hotel.address}`;
				}
				if (hotel.remark) {
					if (description) description += '\n';
					description += this.formatContent(hotel.remark);
				}
			}
			// 处理餐厅类型
			else if (activity.elementType === 'restaurant' && activity.elementData) {
				const restaurant = activity.elementData;
				if (restaurant.meal_type) {
					description += `用餐类型：${restaurant.meal_type}`;
				}
				if (restaurant.cuisine) {
					if (description) description += ' | ';
					description += `菜系：${restaurant.cuisine}`;
				}
				if (restaurant.adult_fee_type) {
					if (description) description += '\n';
					description += `费用：${restaurant.adult_fee_type}`;
				}
				if (restaurant.remark) {
					if (description) description += '\n';
					description += this.formatContent(restaurant.remark);
				}
			}
			// 处理交通类型
			else if (activity.elementType === 'transport' && activity.elementData) {
				const transport = activity.elementData;
				if (transport.transport_type) {
					description += `交通方式：${transport.transport_type}`;
				}
				if (transport.departure && transport.destination) {
					if (description) description += '\n';
					description += `路线：${transport.departure} → ${transport.destination}`;
				}
				if (transport.remark) {
					if (description) description += '\n';
					description += this.formatContent(transport.remark);
				}
				if (transport.content) {
					if (description) description += '\n';
					// description += transport.content;
					description += this.formatContent(transport.content);
				}
			}
			// 处理其他类型
			else if (activity.elementData?.content) {
				// description += activity.elementData.content;
				description += this.formatContent(activity.elementData.content);
			} else if (activity.elementData?.description) {
				description += this.formatContent(activity.elementData.description);
			}

			// 如果没有详细描述，添加基础信息
			if (!description) {
				// 添加地点信息
				if (activity.location) {
					description += `地点：${activity.location}`;
				}

				// 添加时间信息
				if (activity.time_duration_hours || activity.time_duration_minutes) {
					const hours = activity.time_duration_hours || 0;
					const minutes = activity.time_duration_minutes || 0;
					if (description) description += ' | ';
					description += this.formatDuration(hours, minutes);
				}

				// 添加行程距离信息
				if (activity.driving_distance) {
					if (description) description += ' | ';
					description += `距离：${activity.driving_distance}公里`;
				}

				// 添加备注信息
				if (activity.time_remark) {
					if (description) description += ' | ';
					description += this.formatContent(activity.time_remark);
				}
			}

			const result = description || '详细安排请咨询导游';
			console.log('[构建描述] 最终描述:', result);
			return result;
		},

		/**
		 * 将小时和分钟的持续时间格式化为可读的字符串
		 * @param {number} hours - 小时数，可以是小数
		 * @param {number} minutes - 分钟数
		 * @returns {string} 格式化后的字符串，如 "1小时30分钟", "10分钟", "2小时"
		 */
		formatDuration(hours, minutes) {
			// 确保输入是有效的数字，如果不是则默认为 0
			const h = parseFloat(hours) || 0;
			const m = parseFloat(minutes) || 0;

			// 1. 计算总分钟数
			// 将小时部分转换为分钟，并加上已有的分钟数。
			// 使用 Math.round() 来处理浮点数精度问题，例如 0.1666... * 60 约等于 9.999...
			const totalMinutes = Math.round(h * 60 + m);

			if (totalMinutes <= 0) {
				return ''; // 如果总时间为0或负数，可以返回空字符串或 "时间很短"
			}

			// 2. 从总分钟数中计算出小时和剩余的分钟
			const displayHours = Math.floor(totalMinutes / 60);
			const displayMinutes = totalMinutes % 60;

			// 3. 根据计算结果智能拼接字符串
			let result = '时长：';
			if (displayHours > 0) {
				result += `${displayHours}小时`;
			}
			if (displayMinutes > 0) {
				// 如果前面已有小时数，可以加个空格增加可读性
				if (result) {
					result += ' ';
				}
				result += `${displayMinutes}分钟`;
			}

			return result;
		},

		// 更新天气数据 - 永远显示当前真实日期的天气
		async updateWeatherData() {
			console.log('[天气更新] 开始更新天气数据（固定显示今天和明天）');

			// 获取当前真实日期
			const today = new Date();
			const tomorrow = new Date(today);
			tomorrow.setDate(today.getDate() + 1);

			console.log('[天气更新] 今天日期:', today.toDateString());
			console.log('[天气更新] 明天日期:', tomorrow.toDateString());

			// 格式化日期显示
			const formatDateForWeather = (date) => {
				const month = date.getMonth() + 1;
				const day = date.getDate();
				return `${month}月${day}日`;
			};

			// 更新今天和明天的日期
			this.weatherData.today.date = formatDateForWeather(today);
			this.weatherData.tomorrow.date = formatDateForWeather(tomorrow);

			console.log('[天气更新] 更新后的天气日期:', {
				today: this.weatherData.today.date,
				tomorrow: this.weatherData.tomorrow.date
			});

			// 获取真实天气数据 - 永远获取当前位置的天气
			await this.fetchCurrentLocationWeather();

			console.log('[天气更新] 天气数据更新完成');
		},

		// 获取当前位置天气数据 - 分别获取今天和明天的位置天气
		async fetchCurrentLocationWeather() {
			console.log('[获取天气] 开始获取当前位置天气数据');

			try {
				// 获取当前真实日期
				const today = new Date();
				const todayDateStr = this.formatDateString(today);
				const tomorrow = new Date(today);
				tomorrow.setDate(today.getDate() + 1);
				const tomorrowDateStr = this.formatDateString(tomorrow);

				console.log('[获取天气] 今天日期:', todayDateStr);
				console.log('[获取天气] 明天日期:', tomorrowDateStr);

				// 获取今天对应的行程位置
				const todayLocation = this.getTodayLocationFromItinerary(todayDateStr);
				console.log('[获取天气] 今天位置:', todayLocation);

				// 获取明天对应的行程位置
				const tomorrowLocation = this.getTomorrowLocationFromItinerary(tomorrowDateStr);
				console.log('[获取天气] 明天位置:', tomorrowLocation);

				// 并发获取两个位置的天气
				const weatherPromises = [];

				if (todayLocation) {
					weatherPromises.push(this.fetchLocationWeather(todayLocation, 'today'));
				}

				if (tomorrowLocation) {
					weatherPromises.push(this.fetchLocationWeather(tomorrowLocation, 'tomorrow'));
				}

				if (weatherPromises.length > 0) {
					const results = await Promise.allSettled(weatherPromises);
					console.log('[获取天气] 天气数据获取完成:', results);

					// 处理结果
					results.forEach((result, index) => {
						if (result.status === 'fulfilled' && result.value) {
							const { type, data } = result.value;
							if (type === 'today' && data) {
								this.updateTodayWeatherFromData(data);
							} else if (type === 'tomorrow' && data) {
								this.updateTomorrowWeatherFromData(data);
							}
						} else {
							console.error('[获取天气] 天气请求失败:', result.reason);
						}
					});
				}
			} catch (error) {
				console.error('[获取天气] 获取天气数据异常:', error);
			}
		},

		// 格式化日期为字符串（用于匹配行程日期）
		formatDateString(date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		},

		// 获取今天对应的行程位置
		getTodayLocationFromItinerary(todayDateStr) {
			console.log('[获取今天位置] 查找今天的行程位置:', todayDateStr);

			try {
				if (!this.fullItinerary || !this.fullItinerary.itinerary) {
					console.log('[获取今天位置] 没有行程数据');
					return this.getDefaultLocation();
				}

				// 获取行程开始日期
				const departureTimestamp = this.currentOrder.departure_date;
				const startDate = new Date(typeof departureTimestamp === 'number' ? departureTimestamp : parseInt(departureTimestamp));
				const startDateStr = this.formatDateString(startDate);

				console.log('[获取今天位置] 行程开始日期:', startDateStr);

				// 计算今天是行程的第几天
				const todayDate = new Date(todayDateStr);
				const daysDiff = Math.floor((todayDate - startDate) / (24 * 60 * 60 * 1000)) + 1;

				console.log('[获取今天位置] 今天是行程第', daysDiff, '天');

				// 如果今天在行程范围内，使用对应天数的位置
				if (daysDiff >= 1 && daysDiff <= this.totalDays) {
					const dayData = this.fullItinerary.itinerary.find((item) => item.day === daysDiff);
					if (dayData && dayData.day_title) {
						console.log('[获取今天位置] 找到今天的行程:', dayData.day_title);
						return this.extractLocationFromRoute(dayData.day_title);
					}
				}

				// 如果今天不在行程范围内，使用第一天的位置
				const firstDayData = this.fullItinerary.itinerary.find((item) => item.day === 1);
				if (firstDayData && firstDayData.day_title) {
					console.log('[获取今天位置] 使用第一天的位置:', firstDayData.day_title);
					return this.extractLocationFromRoute(firstDayData.day_title);
				}

				return this.getDefaultLocation();
			} catch (error) {
				console.error('[获取今天位置] 获取今天位置失败:', error);
				return this.getDefaultLocation();
			}
		},

		// 获取明天对应的行程位置
		getTomorrowLocationFromItinerary(tomorrowDateStr) {
			console.log('[获取明天位置] 查找明天的行程位置:', tomorrowDateStr);

			try {
				if (!this.fullItinerary || !this.fullItinerary.itinerary) {
					console.log('[获取明天位置] 没有行程数据');
					return this.getDefaultLocation();
				}

				// 获取行程开始日期
				const departureTimestamp = this.currentOrder.departure_date;
				const startDate = new Date(typeof departureTimestamp === 'number' ? departureTimestamp : parseInt(departureTimestamp));
				const startDateStr = this.formatDateString(startDate);

				console.log('[获取明天位置] 行程开始日期:', startDateStr);

				// 计算明天是行程的第几天
				const tomorrowDate = new Date(tomorrowDateStr);
				const daysDiff = Math.floor((tomorrowDate - startDate) / (24 * 60 * 60 * 1000)) + 1;

				console.log('[获取明天位置] 明天是行程第', daysDiff, '天');

				// 如果明天在行程范围内，使用对应天数的位置
				if (daysDiff >= 1 && daysDiff <= this.totalDays) {
					const dayData = this.fullItinerary.itinerary.find((item) => item.day === daysDiff);
					if (dayData && dayData.day_title) {
						console.log('[获取明天位置] 找到明天的行程:', dayData.day_title);
						return this.extractLocationFromRoute(dayData.day_title);
					}
				}

				// 如果明天超出行程范围，使用最后一天的位置
				const lastDayData = this.fullItinerary.itinerary.find((item) => item.day === this.totalDays);
				if (lastDayData && lastDayData.day_title) {
					console.log('[获取明天位置] 使用最后一天的位置:', lastDayData.day_title);
					return this.extractLocationFromRoute(lastDayData.day_title);
				}

				return this.getDefaultLocation();
			} catch (error) {
				console.error('[获取明天位置] 获取明天位置失败:', error);
				return this.getDefaultLocation();
			}
		},

		// 获取默认位置
		getDefaultLocation() {
			return '拉萨';
		},

		// 获取指定位置的天气数据
		async fetchLocationWeather(locationName, type) {
			console.log('[获取位置天气] 开始获取', locationName, '的天气，类型:', type);

			try {
				const weatherResult = await uniCloud.callFunction({
					name: 'a-weather',
					data: {
						action: 'getWeatherByLocation',
						locationName: locationName,
						extensions: 'all'
					}
				});

				console.log('[获取位置天气]', locationName, '天气返回:', weatherResult);

				if (weatherResult.result.errCode === 0 && weatherResult.result.data) {
					return {
						type: type,
						data: weatherResult.result.data,
						locationName: locationName
					};
				} else {
					console.error('[获取位置天气]', locationName, '天气获取失败:', weatherResult.result.errMsg);
					return null;
				}
			} catch (error) {
				console.error('[获取位置天气]', locationName, '天气获取异常:', error);
				return null;
			}
		},

		// 更新今天天气显示
		updateTodayWeatherFromData(weatherData) {
			console.log('[更新今天天气] 开始更新今天天气显示:', weatherData);

			try {
				if (weatherData.type === 'forecast' && weatherData.today) {
					// 确定显示的地点名称
					let displayLocation = weatherData.city;
					if (weatherData.geocoding && weatherData.geocoding.city) {
						displayLocation = weatherData.geocoding.city;
					}

					// 获取海拔信息
					let altitude = '--m';
					if (weatherData.elevation && weatherData.elevation.altitude) {
						altitude = weatherData.elevation.altitude + 'm';
					}

					// 更新今天天气
					this.weatherData.today = {
						...this.weatherData.today,
						temp: `${weatherData.today.daytemp}°C`,
						condition: weatherData.today.dayweather,
						tempRange: weatherData.today.formatted.tempRange,
						wind: weatherData.today.formatted.wind,
						location: displayLocation,
						altitude: altitude
					};

					console.log('[更新今天天气] 今天天气更新完成:', this.weatherData.today);
				}
			} catch (error) {
				console.error('[更新今天天气] 更新今天天气显示失败:', error);
			}
		},

		// 更新明天天气显示
		updateTomorrowWeatherFromData(weatherData) {
			console.log('[更新明天天气] 开始更新明天天气显示:', weatherData);

			try {
				if (weatherData.type === 'forecast') {
					// 使用明天的数据，如果没有则使用今天的
					const tomorrowData = weatherData.tomorrow || weatherData.today;

					if (tomorrowData) {
						// 确定显示的地点名称
						let displayLocation = weatherData.city;
						if (weatherData.geocoding && weatherData.geocoding.city) {
							displayLocation = weatherData.geocoding.city;
						}

						// 获取海拔信息
						let altitude = '--m';
						if (weatherData.elevation && weatherData.elevation.altitude) {
							altitude = weatherData.elevation.altitude + 'm';
						}

						// 更新明天天气
						this.weatherData.tomorrow = {
							...this.weatherData.tomorrow,
							temp: `${tomorrowData.daytemp}°C`,
							condition: tomorrowData.dayweather,
							tempRange: tomorrowData.formatted.tempRange,
							wind: tomorrowData.formatted.wind,
							location: displayLocation,
							altitude: altitude
						};

						console.log('[更新明天天气] 明天天气更新完成:', this.weatherData.tomorrow);
					}
				}
			} catch (error) {
				console.error('[更新明天天气] 更新明天天气显示失败:', error);
			}
		},

		// 从指定天数的行程中提取位置信息
		extractLocationFromDay(dayNumber) {
			console.log('[提取指定天位置] 开始提取第', dayNumber, '天的位置信息');

			try {
				if (!this.fullItinerary || !this.fullItinerary.itinerary) {
					console.log('[提取指定天位置] 没有行程数据');
					return null;
				}

				const dayData = this.fullItinerary.itinerary.find((item) => item.day === dayNumber);
				if (!dayData || !dayData.activities) {
					console.log('[提取指定天位置] 没有找到第', dayNumber, '天的数据或活动');
					return null;
				}

				console.log('[提取指定天位置] 第', dayNumber, '天的活动数量:', dayData.activities.length);

				// 优先从天数标题中提取路线位置信息
				if (dayData.day_title) {
					console.log('[提取指定天位置] 分析第', dayNumber, '天标题:', dayData.day_title);

					const routeLocationResult = this.extractLocationFromRoute(dayData.day_title);
					if (routeLocationResult) {
						console.log('[提取指定天位置] 从路线中提取位置成功:', routeLocationResult);
						return routeLocationResult;
					}
				}

				// 备选：从活动中提取位置
				for (const activity of dayData.activities) {
					if (activity.location) {
						console.log('[提取指定天位置] 从活动位置字段提取:', activity.location);
						// 提取城市名称
						const cityMatch = activity.location.match(
							/(北京|上海|广州|深圳|杭州|南京|苏州|成都|重庆|西安|武汉|长沙|郑州|济南|青岛|大连|沈阳|哈尔滨|长春|石家庄|太原|呼和浩特|银川|西宁|乌鲁木齐|拉萨|昆明|贵阳|南宁|海口|三亚|福州|厦门|南昌|合肥|兰州|林芝|日喀则|山南|那曲|阿里)/
						);
						if (cityMatch) {
							console.log('[提取指定天位置] 提取到城市:', cityMatch[1]);
							return cityMatch[1];
						}
						return activity.location;
					}

					// 从活动标题中提取位置
					if (activity.title) {
						const titleCityMatch = activity.title.match(
							/(北京|上海|广州|深圳|杭州|南京|苏州|成都|重庆|西安|武汉|长沙|郑州|济南|青岛|大连|沈阳|哈尔滨|长春|石家庄|太原|呼和浩特|银川|西宁|乌鲁木齐|拉萨|昆明|贵阳|南宁|海口|三亚|福州|厦门|南昌|合肥|兰州|林芝|日喀则|山南|那曲|阿里)/
						);
						if (titleCityMatch) {
							console.log('[提取指定天位置] 从活动标题提取到城市:', titleCityMatch[1]);
							return titleCityMatch[1];
						}
					}
				}

				console.log('[提取指定天位置] 第', dayNumber, '天没有找到有效的位置信息');
				return null;
			} catch (error) {
				console.error('[提取指定天位置] 提取第', dayNumber, '天位置信息失败:', error);
				return null;
			}
		},

		// 从路线标题中智能提取位置信息
		extractLocationFromRoute(routeTitle) {
			console.log('[路线位置提取] 开始分析路线:', routeTitle);

			try {
				if (!routeTitle) return null;

				// 针对西藏地区的特殊处理
				// 示例：独立包车丨拉萨-江河汇流-雅鲁藏布大峡谷-南迦巴瓦峰-索松村

				// 1. 检查是否包含西藏特色地名
				const tibetKeywords = ['拉萨', '林芝', '日喀则', '山南', '那曲', '阿里', '昌都', '雅鲁藏布', '南迦巴瓦', '索松村', '鲁朗', '巴松措', '羊湖', '纳木措'];
				for (const keyword of tibetKeywords) {
					if (routeTitle.includes(keyword)) {
						console.log('[路线位置提取] 检测到西藏地名:', keyword);

						// 如果包含索松村或南迦巴瓦峰，使用完整路线信息进行搜索
						if (routeTitle.includes('索松村') || routeTitle.includes('南迦巴瓦')) {
							// 提取路线的关键部分
							const routeMatch = routeTitle.match(/拉萨[-\s]*江河汇流[-\s]*雅鲁藏布大峡谷[-\s]*南迦巴瓦峰[-\s]*索松村/);
							if (routeMatch) {
								console.log('[路线位置提取] 提取到完整路线:', routeMatch[0]);
								return '拉萨-雅鲁藏布大峡谷-南迦巴瓦峰-索松村';
							}

							// 如果没有完整匹配，使用索松村+林芝的组合
							if (routeTitle.includes('索松村')) {
								console.log('[路线位置提取] 使用索松村林芝组合');
								return '西藏林芝索松村';
							}
						}

						// 检查是否能确定具体城市
						if (keyword === '拉萨') return '拉萨';
						if (keyword === '林芝' || routeTitle.includes('雅鲁藏布') || routeTitle.includes('南迦巴瓦') || routeTitle.includes('索松村')) {
							return '林芝';
						}
						if (keyword === '日喀则') return '日喀则';
						if (keyword === '山南') return '山南';
						if (keyword === '那曲') return '那曲';
						if (keyword === '阿里') return '阿里';
						if (keyword === '昌都') return '昌都';
					}
				}

				// 2. 通用城市名称提取
				const cityMatch = routeTitle.match(
					/(北京|上海|广州|深圳|杭州|南京|苏州|成都|重庆|西安|武汉|长沙|郑州|济南|青岛|大连|沈阳|哈尔滨|长春|石家庄|太原|呼和浩特|银川|西宁|乌鲁木齐|拉萨|昆明|贵阳|南宁|海口|三亚|福州|厦门|南昌|合肥|兰州|林芝|日喀则|山南|那曲|阿里|昌都)/
				);
				if (cityMatch) {
					console.log('[路线位置提取] 提取到城市名称:', cityMatch[1]);
					return cityMatch[1];
				}

				// 3. 如果是路线格式，提取目的地
				const routeParts = routeTitle.split(/[-－丨|]/);
				if (routeParts.length > 1) {
					// 获取最后一个地点作为目的地
					const destination = routeParts[routeParts.length - 1].trim();
					console.log('[路线位置提取] 路线目的地:', destination);

					// 如果目的地是明确的地名，返回
					if (destination && destination.length <= 10) {
						return destination;
					}
				}

				console.log('[路线位置提取] 未能从路线中提取有效位置');
				return null;
			} catch (error) {
				console.error('[路线位置提取] 路线位置提取失败:', error);
				return null;
			}
		},

		// 更新天气显示数据 - 统一处理今天和明天的天气
		updateWeatherDisplay(weatherData) {
			console.log('[更新天气显示] 开始更新天气显示:', weatherData);

			try {
				if (weatherData.type === 'forecast') {
					// 确定显示的地点名称
					let displayLocation = weatherData.city;
					if (weatherData.geocoding && weatherData.geocoding.city) {
						displayLocation = weatherData.geocoding.city;
					}

					// 获取海拔信息
					let altitude = '--m';
					if (weatherData.elevation && weatherData.elevation.altitude) {
						altitude = weatherData.elevation.altitude + 'm';
					}

					// 更新今天天气
					if (weatherData.today) {
						this.weatherData.today = {
							...this.weatherData.today,
							temp: `${weatherData.today.daytemp}°C`,
							condition: weatherData.today.dayweather,
							tempRange: weatherData.today.formatted.tempRange,
							wind: weatherData.today.formatted.wind,
							location: displayLocation,
							altitude: altitude
						};
						console.log('[更新天气显示] 今天天气更新完成:', this.weatherData.today);
					}

					// 更新明天天气
					if (weatherData.tomorrow) {
						this.weatherData.tomorrow = {
							...this.weatherData.tomorrow,
							temp: `${weatherData.tomorrow.daytemp}°C`,
							condition: weatherData.tomorrow.dayweather,
							tempRange: weatherData.tomorrow.formatted.tempRange,
							wind: weatherData.tomorrow.formatted.wind,
							location: displayLocation,
							altitude: altitude
						};
						console.log('[更新天气显示] 明天天气更新完成:', this.weatherData.tomorrow);
					}
				}
			} catch (error) {
				console.error('[更新天气显示] 更新天气显示失败:', error);
			}
		},

		// 选择天数
		selectDay(day) {
			console.log('[选择天数] 用户选择第', day, '天');
			this.selectedDay = day;
			this.currentDay = day; // 更新当前天数
			this.loadDaySchedule(day);

			// 注意：不再更新天气信息，天气信息保持显示今天和明天的真实天气
		},

		// 获取时间轴图标
		getTimelineIcon(type) {
			const iconMap = {
				meal: 'fa fa-utensils',
				transport: 'fa fa-car',
				attraction: 'fa fa-camera',
				hotel: 'fa fa-hotel'
			};
			return iconMap[type] || 'fa fa-circle';
		},

		// 获取活动类型名称
		getActivityTypeName(elementType) {
			const typeNameMap = {
				scenic: '景点',
				restaurant: '用餐',
				transport: '交通',
				hotel: '住宿',
				assembly: '集合',
				dismissal: '解散',
				other: '其他'
			};
			return typeNameMap[elementType] || '活动';
		},

		// 联系导游
		contactGuide() {
			console.log('[联系导游] 用户点击联系导游');
			uni.showModal({
				title: '联系导游',
				content: '确定要拨打导游电话吗？',
				success: (res) => {
					if (res.confirm) {
						console.log('[联系导游] 用户确认拨打电话');
						uni.makePhoneCall({
							phoneNumber: '13800138000',
							success: () => {
								console.log('[联系导游] 拨打电话成功');
							},
							fail: (error) => {
								console.error('[联系导游] 拨打电话失败:', error);
							}
						});
					} else {
						console.log('[联系导游] 用户取消拨打电话');
					}
				}
			});
		},

		// 浏览旅行产品
		browseProducts() {
			console.log('[浏览产品] 用户点击浏览旅行产品');
			uni.switchTab({
				url: '/pages/home/home',
				success: () => {
					console.log('[浏览产品] 跳转到首页成功');
				},
				fail: (error) => {
					console.error('[浏览产品] 跳转到首页失败:', error);
				}
			});
		},

		// 智能滚动到当前时间对应的行程位置
		scrollToCurrentPosition() {
			console.log('[智能滚动] 开始智能滚动到当前位置');

			try {
				// 首先确定当前日期对应的行程天数
				const currentTripDay = this.getCurrentTripDay();
				console.log('[智能滚动] 当前行程天数:', currentTripDay);

				// 如果当前不在行程期间，滚动到页面顶部
				if (currentTripDay === null) {
					console.log('[智能滚动] 当前不在行程期间，滚动到顶部');
					uni.pageScrollTo({
						scrollTop: 0,
						duration: 300
					});
					return;
				}

				// 如果当前天数与显示的天数不同，切换到对应天数
				if (currentTripDay !== this.selectedDay) {
					console.log('[智能滚动] 切换到第', currentTripDay, '天');
					this.selectDay(currentTripDay);
					// 等待DOM更新后再滚动
					this.$nextTick(() => {
						this.scrollToCurrentTimeInDay();
					});
				} else {
					// 直接滚动到当前时间
					this.scrollToCurrentTimeInDay();
				}
			} catch (error) {
				console.error('[智能滚动] 智能滚动失败:', error);
				// 出错时滚动到页面顶部
				uni.pageScrollTo({
					scrollTop: 0,
					duration: 300
				});
			}
		},

		// 获取当前日期对应的行程天数
		getCurrentTripDay() {
			console.log('[获取行程天数] 开始计算当前行程天数');

			try {
				if (!this.currentOrder || !this.currentOrder.departure_date) {
					console.log('[获取行程天数] 没有订单或出发日期信息');
					return null;
				}

				// 获取行程开始日期
				const departureTimestamp = this.currentOrder.departure_date;
				const startDate = new Date(typeof departureTimestamp === 'number' ? departureTimestamp : parseInt(departureTimestamp));

				// 获取当前日期
				const today = new Date();
				today.setHours(0, 0, 0, 0); // 重置时间部分
				startDate.setHours(0, 0, 0, 0); // 重置时间部分

				// 计算天数差
				const daysDiff = Math.floor((today - startDate) / (24 * 60 * 60 * 1000)) + 1;

				console.log('[获取行程天数] 计算结果:', {
					startDate: startDate.toDateString(),
					today: today.toDateString(),
					daysDiff,
					totalDays: this.totalDays
				});

				// 检查是否在行程范围内
				if (daysDiff >= 1 && daysDiff <= this.totalDays) {
					return daysDiff;
				} else if (daysDiff < 1) {
					// 还没到出发日期，返回第1天
					return 1;
				} else {
					// 已经超过行程结束日期，返回最后一天
					return this.totalDays;
				}
			} catch (error) {
				console.error('[获取行程天数] 计算行程天数失败:', error);
				return null;
			}
		},

		// 滚动到当前时间在当天的位置
		scrollToCurrentTimeInDay() {
			console.log('[滚动到当前时间] 开始滚动到当前时间位置');

			try {
				// 获取当前时间
				const now = new Date();
				const currentTime = now.getHours() * 60 + now.getMinutes(); // 转换为分钟
				console.log('[滚动到当前时间] 当前时间:', `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);

				// 如果没有行程安排，滚动到页面顶部
				if (!this.currentDaySchedule || this.currentDaySchedule.length === 0) {
					console.log('[滚动到当前时间] 没有行程安排，滚动到顶部');
					uni.pageScrollTo({
						scrollTop: 0,
						duration: 300
					});
					return;
				}

				// 查找当前时间最接近的行程项
				let targetIndex = 0;
				let minTimeDiff = Infinity;
				let hasValidTime = false;

				for (let i = 0; i < this.currentDaySchedule.length; i++) {
					const item = this.currentDaySchedule[i];
					const itemTime = this.parseTimeToMinutes(item.time);

					if (itemTime !== null) {
						hasValidTime = true;
						const timeDiff = Math.abs(currentTime - itemTime);
						console.log('[滚动到当前时间] 行程项', i, '时间:', item.time, '分钟数:', itemTime, '差值:', timeDiff);

						// 如果当前时间已经过了这个行程项，或者时间差最小
						if (currentTime >= itemTime || timeDiff < minTimeDiff) {
							minTimeDiff = timeDiff;
							targetIndex = i;
						}
					}
				}

				// 如果没有有效的时间信息，滚动到第一个行程项
				if (!hasValidTime) {
					console.log('[滚动到当前时间] 没有有效时间信息，滚动到第一个行程项');
					targetIndex = 0;
				}

				console.log('[滚动到当前时间] 目标行程项索引:', targetIndex);

				// 计算滚动位置
				this.scrollToTimelineItem(targetIndex);
			} catch (error) {
				console.error('[滚动到当前时间] 滚动到当前时间失败:', error);
				// 出错时滚动到页面顶部
				uni.pageScrollTo({
					scrollTop: 0,
					duration: 300
				});
			}
		},

		// 解析时间字符串为分钟数
		parseTimeToMinutes(timeString) {
			console.log('[时间解析] 解析时间字符串:', timeString);

			if (!timeString) return null;

			// 匹配各种时间格式
			const timeFormats = [
				/(\d{1,2}):(\d{2})/, // 09:00, 14:30
				/(\d{1,2})\.(\d{2})/, // 09.00, 14.30
				/(\d{1,2})时(\d{2})/, // 9时30分
				/(\d{1,2})点(\d{2})/, // 9点30分
				/(\d{1,2})h(\d{2})/, // 9h30
				/上午(\d{1,2}):(\d{2})/, // 上午9:00
				/下午(\d{1,2}):(\d{2})/, // 下午2:00
				/早上(\d{1,2}):(\d{2})/, // 早上8:00
				/中午(\d{1,2}):(\d{2})/, // 中午12:00
				/晚上(\d{1,2}):(\d{2})/, // 晚上6:00
				/全天/
			];

			for (const format of timeFormats) {
				const match = timeString.match(format);
				if (match) {
					let hours = parseInt(match[1]);
					const minutes = parseInt(match[2] || 0);

					// 处理上午/下午格式
					if (timeString.includes('下午') && hours < 12) {
						hours += 12;
					} else if (timeString.includes('晚上') && hours < 12) {
						hours += 12;
					} else if (timeString.includes('上午') && hours === 12) {
						hours = 0;
					} else if (timeString.includes('全天')) {
						return 0;
					}

					const totalMinutes = hours * 60 + minutes;
					console.log('[时间解析] 解析结果:', `${hours}:${minutes} = ${totalMinutes}分钟`);
					return totalMinutes;
				}
			}

			console.log('[时间解析] 无法解析时间格式');
			return null;
		},

		// 滚动到指定的时间轴项目
		scrollToTimelineItem(itemIndex) {
			console.log('[滚动定位] 滚动到时间轴项目:', itemIndex);

			try {
				// 使用元素选择器进行精确滚动
				const elementId = `timeline-item-${itemIndex}`;
				console.log('[滚动定位] 目标元素ID:', elementId);

				// 使用 uni.createSelectorQuery 获取元素位置
				const query = uni.createSelectorQuery().in(this);
				query
					.select(`#${elementId}`)
					.boundingClientRect((data) => {
						if (data) {
							console.log('[滚动定位] 元素位置信息:', data);

							// 计算滚动位置：元素顶部位置 - 留出的缓冲空间
							const scrollTop = Math.max(0, data.top - 120); // 留出120px的缓冲空间

							console.log('[滚动定位] 执行滚动到位置:', scrollTop);

							// 执行滚动
							uni.pageScrollTo({
								scrollTop: scrollTop,
								duration: 800
							});
						} else {
							console.log('[滚动定位] 未找到目标元素，使用估算方法');
							this.scrollToTimelineItemByEstimate(itemIndex);
						}
					})
					.exec();
			} catch (error) {
				console.error('[滚动定位] 滚动定位失败:', error);
				this.scrollToTimelineItemByEstimate(itemIndex);
			}
		},

		// 备用滚动方法：使用估算的位置
		scrollToTimelineItemByEstimate(itemIndex) {
			console.log('[滚动定位估算] 使用估算方法滚动到时间轴项目:', itemIndex);

			try {
				// 计算滚动位置
				// 状态栏高度 + 行程头部高度 + 当日概览高度 + 当日亮点高度 + 目标项目偏移
				const statusBarHeight = this.statusBarHeight || 0;
				const headerHeight = 400; // 预估行程头部高度（包括天气、进度、天数选择器）
				const overviewHeight = 80; // 预估当日概览高度
				const highlightsHeight = this.currentDayInfo.highlights ? 100 : 0; // 当日亮点高度
				const itemHeight = 150; // 每个时间轴项目的平均高度

				const scrollTop = statusBarHeight + headerHeight + overviewHeight + highlightsHeight + itemIndex * itemHeight;

				console.log('[滚动定位估算] 计算的滚动位置:', {
					statusBarHeight,
					headerHeight,
					overviewHeight,
					highlightsHeight,
					itemIndex,
					itemHeight,
					scrollTop
				});

				// 执行滚动
				uni.pageScrollTo({
					scrollTop: Math.max(0, scrollTop - 100), // 减去100px留出一些缓冲空间
					duration: 800 // 稍慢的滚动动画，让用户能看清楚
				});
			} catch (error) {
				console.error('[滚动定位估算] 滚动定位失败:', error);
			}
		}
	}
};
</script>

<style>
.nav-search-bar {
	background-color: #ffffff;
	border-radius: 20px;
	padding: 10px 16px;
	display: flex;
	margin-bottom: 2px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	border: 1px solid #e0e0e0;
}

.status-bar-placeholder {
	width: 100%;
	background-color: #f8f9fa;
}

.loading-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100vh;
	padding: 0 32px;
}

.loading-spinner {
	width: 40px;
	height: 40px;
	border: 3px solid #f0f0f0;
	border-top: 3px solid #0086f6;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin-bottom: 16px;
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

.loading-text {
	color: #666;
	font-size: 14px;
}

.page-container {
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	background-color: #f8f9fa;
	min-height: 100vh;
}

.content-area {
	min-height: 100vh;
	padding-bottom: 80px;
}

.itinerary-header {
	background-color: white;
	padding: 20px;
	border-bottom: 1px solid #f0f0f0;
}

.progress-container {
	margin: 12px 0;
}

.progress-bar {
	height: 4px;
	background-color: #e9ecef;
	border-radius: 2px;
	overflow: hidden;
}

.progress {
	height: 100%;
	background-color: #0086f6;
	border-radius: 2px;
	transition: width 0.3s ease;
}

.exit-btn {
	flex: 0 0 auto;
	padding: 4px 10px;
	border-radius: 8px;
	font-size: 12px;
	white-space: nowrap;
	background-color: #0086f6;
	color: white;
	box-shadow: 0 2px 8px rgba(0, 134, 246, 0.3);
}

.day-tabs {
	display: flex;
	overflow-x: auto;
	padding: 16px 0 8px;
	scrollbar-width: none;
}

.day-tabs::-webkit-scrollbar {
	display: none;
}

.day-tab {
	flex: 0 0 auto;
	padding: 8px 12px;
	margin-right: 10px;
	border-radius: 16px;
	font-size: 14px;
	white-space: nowrap;
	background-color: #f0f7ff;
	color: #0086f6;
	transition: all 0.2s ease;
}

.day-tab.active {
	background-color: #0086f6;
	color: white;
	box-shadow: 0 2px 8px rgba(0, 134, 246, 0.3);
}

.day-overview {
	background-color: white;
	padding: 16px 20px;
	margin-bottom: 10px;
	border-bottom: 1px solid #f0f0f0;
}

.day-highlights {
	background-color: white;
	margin-bottom: 10px;
	border-bottom: 1px solid #f0f0f0;
}

.highlight-section {
	padding: 16px 20px;
}

.highlight-header {
	display: flex;
	align-items: center;
	margin-bottom: 8px;
}

.highlight-content {
	padding-left: 20px;
}

.weather-info {
	border: 1px solid rgba(0, 134, 246, 0.1);
	transition: all 0.3s ease;
}

.location-name {
	font-weight: 500;
	color: #333;
}

.altitude {
	font-weight: 500;
	color: #0086f6;
}

.timeline {
	position: relative;
	padding: 0 20px 80px;
}

.timeline-line {
	position: absolute;
	left: 32px;
	top: 0;
	bottom: 0;
	width: 1px;
	background-color: #e0e0e0;
	z-index: 1;
}

.timeline-item {
	position: relative;
	padding: 12px 0 12px 30px;
}

.timeline-dot {
	position: absolute;
	left: 0;
	top: 12px;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background-color: #f0f9ff;
	border: 1px solid #0086f6;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2;
}

.timeline-dot text {
	color: #0086f6;
	font-size: 12px;
}

.timeline-content {
	background-color: white;
	border-radius: 12px;
	padding: 12px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.timeline-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.timeline-time {
	color: #0086f6;
	font-weight: 500;
	font-size: 14px;
}

.timeline-type {
	display: flex;
	align-items: center;
	background-color: #f8f9fa;
	border-radius: 8px;
	padding: 4px 8px;
}

.timeline-type text {
	color: #666;
	font-size: 12px;
}

.type-text {
	margin-left: 4px;
	font-weight: 500;
}

.timeline-title {
	font-weight: 600;
	font-size: 16px;
	color: #333;
	margin-bottom: 8px;
	line-height: 1.3;
}

.timeline-desc {
	font-size: 13px;
	color: #666;
	line-height: 1.4;
	margin-bottom: 8px;
	white-space: pre-wrap;
}

.timeline-swiper {
	width: 100%;
	height: 150px;
	border-radius: 8px;
	margin-top: 8px;
	overflow: hidden;
}

.timeline-image {
	width: 100%;
	/* height: 120px; */
	height: 100%;
	border-radius: 8px;
	margin-top: 8px;
}

.timeline-remark {
	font-size: 13px;
	color: #666;
	line-height: 1.4;
	margin-top: 8px;
	margin-bottom: 8px;
	white-space: pre-wrap;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 90vh;
	padding: 0 32px;
	text-align: center;
}

.empty-state-icon {
	width: 120px;
	height: 120px;
	background-color: #f0f9ff;
	border-radius: 60px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 24px;
}

.empty-state-icon text {
	font-size: 48px;
	color: #0086f6;
}

.action-button {
	background-color: #0086f6;
	color: white;
	border-radius: 24px;
	padding: 12px 24px;
	font-weight: 500;
	margin-top: 16px;
	box-shadow: 0 4px 12px rgba(0, 134, 246, 0.3);
	display: flex;
	align-items: center;
	justify-content: center;
}

.bottom-actions {
	position: fixed;
	bottom: 20px;
	left: 20px;
	right: 20px;
	display: flex;
	justify-content: center;
	z-index: 10;
}

.action-btn {
	background-color: rgba(255, 255, 255, 0.9);
	color: #555;
	backdrop-filter: blur(5px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	border: 1px solid rgba(0, 0, 0, 0.05);
	border-radius: 24px;
	padding: 12px 20px;
	font-weight: 500;
	display: flex;
	align-items: center;
	justify-content: center;
}

.action-btn-light {
	background-color: rgba(255, 255, 255, 0.9);
	color: #555;
}

.formatted-content {
	white-space: pre-wrap;
	display: block;
	word-break: break-all;
}
</style>
