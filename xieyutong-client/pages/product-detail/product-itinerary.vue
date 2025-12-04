<template>
	<page-meta :page-style="isPopupOpen ? 'overflow: hidden;' : ''"></page-meta>
	<view class="page-container">
		<view class="loading-container" v-if="loading">
			<view class="loading-spinner"></view>
			<text class="loading-text">正在加载行程详情...</text>
		</view>

		<view class="all-days-container" v-else-if="fullItinerary">
			<view class="itinerary-header-detail" id="itinerary-header-detail" :style="{ paddingTop: statusBarHeight + 120 + 'rpx' }">
				<view class="back-button" @click="goBack">
					<uni-icons type="left" size="22" color="#333"></uni-icons>
				</view>

				<scroll-view class="day-tabs" scroll-x="true" :scroll-into-view="tabScrollTarget" scroll-with-animation="true" show-scrollbar="false">
					<view
						class="day-tab"
						:id="'day-tab-' + (index + 1)"
						:class="{ active: selectedDay === index + 1 }"
						v-for="(day, index) in daysList"
						:key="index"
						@click="selectDay(index + 1)">
						Day {{ index + 1 }}
					</view>
				</scroll-view>
			</view>

			<view v-for="dayData in fullItinerary.itinerary" :key="dayData.day" :id="'day-section-' + dayData.day" class="day-section">
				<view class="day-section-header">Day {{ dayData.day }}</view>

				<view class="day-overview">
					<text class="font-semibold text-gray-800 mb-2 formatted-content">{{ formatContent(dayData.day_title, { emojiBreakStyle: 'newline' }) }}</text>
				</view>

				<view class="day-highlights" v-if="dayData.day_highlights">
					<view class="highlight-section">
						<view class="highlight-header">
							<!-- <text class="fa fa-star text-amber-500 mr-2"></text> -->
							<image src="/static/icons/star.svg" class="w-5 h-5 mr-2" mode="aspectFit" />
							<text class="font-semibold text-gray-800">当日亮点</text>
						</view>
						<view class="highlight-content">
							<text class="text-gray-700">{{ formatContent(dayData.day_highlights, { emojiBreakStyle: 'newline' }) }}</text>
						</view>
					</view>
				</view>

				<view class="timeline">
					<view class="timeline-line"></view>

					<view class="timeline-item" :id="'timeline-item-' + index" v-for="(item, index) in transformDayActivities(dayData.activities)" :key="index">
						<view class="timeline-dot">
							<!-- <text :class="getTimelineIcon(item.type)"></text> -->
							<image :src="getTimelineIcon(item.type)" class="w-4 h-4" mode="aspectFit" />
						</view>
						<view class="timeline-content">
							<view class="timeline-header">
								<view class="timeline-time">{{ item.time }}</view>
								<view class="timeline-type">
									<!-- <text :class="getTimelineIcon(item.type)"></text> -->
									<image :src="getTimelineIcon(item.type)" class="w-4 h-4" mode="aspectFit" />
									<text class="type-text">{{ getActivityTypeName(item.elementType) }}</text>
								</view>
							</view>

							<view v-if="item.elementType === 'hotel' && item.hotelOptions && item.hotelOptions.length > 0" class="timeline-hotel-list">
								<view class="hotel-option-item" v-for="(hotel, hIndex) in item.hotelOptions" :key="hIndex">
									<text v-if="hIndex > 0" class="hotel-prefix">或</text>
									<text class="hotel-name" :class="{ 'poi-link': hotel.linked_poi_id }" @click="hotel.linked_poi_id ? openPoiPopup(hotel.linked_poi_id) : null">
										{{ hotel.name }}
									</text>
								</view>
							</view>

							<view v-else-if="item.elementType === 'scenic' && item.scenicSpots && item.scenicSpots.length > 0" class="timeline-title">
								<block v-for="(spot, sIndex) in item.scenicSpots" :key="sIndex">
									<text :class="{ 'poi-link': spot.linked_poi_id }" @click="spot.linked_poi_id ? openPoiPopup(spot.linked_poi_id) : null">
										{{ spot.name }}
									</text>
									<text v-if="sIndex < item.scenicSpots.length - 1">、</text>
								</block>
							</view>

							<view class="timeline-title" v-else>
								<text :class="{ 'poi-link': item.activityPoiId }" @click="item.activityPoiId ? openPoiPopup(item.activityPoiId) : null">
									{{ item.title }}
								</text>
							</view>

							<view class="timeline-desc">{{ item.description }}</view>
							<swiper v-if="item.images && item.images.length > 0" class="timeline-swiper" indicator-dots circular>
								<swiper-item v-for="(imgUrl, imgIndex) in item.images" :key="imgIndex">
									<image :src="imgUrl" :alt="item.title" class="timeline-image" mode="aspectFill" @click="previewImage(item.images, imgIndex)" />
								</swiper-item>
							</swiper>
							<view class="timeline-remark">{{ item.remark }}</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="content-area" v-else>
			<view class="empty-state">
				<view class="empty-state-icon">
					<!-- <text class="fa fa-route"></text> -->
					<image src="/static/icons/route.svg" class="w-12 h-12 mb-4" mode="aspectFit" />
				</view>
				<text class="text-xl font-semibold text-gray-800 mb-2">无法加载行程</text>
				<text class="text-gray-600">未找到该产品的行程详情，</text>
				<text class="text-gray-600">请返回上一页重试。</text>
			</view>
		</view>

		<uni-popup ref="tipsPopup" type="bottom" @change="onPopupChange">
			<view class="tips-popup-container">
				<view class="tips-popup-header" @touchstart="onHeaderDragStart" @touchmove.stop.prevent="onDragMove" @touchend="onHeaderDragEnd">
					<view class="tips-popup-close" @click="closeTipsPopup">
						<uni-icons type="closeempty" size="20" color="#999"></uni-icons>
					</view>
				</view>

				<swiper v-if="currentPoiMedia && currentPoiMedia.length > 0" class="poi-swiper-native" indicator-dots circular :autoplay="isSwiperAutoplay" @change="onSwiperChange">
					<swiper-item v-for="(file, index) in currentPoiMedia" :key="index">
						<image v-if="isImageFile(file)" :src="getEncodedUrl(file.url)" class="poi-swiper-image-native" mode="aspectFill" @click="previewSwiperImage(file.url)" />
						<video
							v-if="isVideoFile(file)"
							:src="getEncodedUrl(file.url)"
							controls
							class="poi-swiper-video-native"
							:id="'video-' + index"
							@play="onVideoPlay"
							@pause="onVideoPause"
							@ended="onVideoPause"></video>
					</swiper-item>
				</swiper>

				<view class="tips-popup-content-wrapper" @touchstart="onContentTouchStart" @touchend="onContentTouchEnd">
					<scroll-view class="tips-popup-content" scroll-y :show-scrollbar="false" @scroll="onContentScroll" @touchmove.stop="dummyAllow">
						<rich-content :html="popupContent" :noPadding="true" />
					</scroll-view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
import RichContent from '@/components/rich-content/rich-content.vue';

export default {
	components: {
		RichContent
	},
	data() {
		return {
			statusBarHeight: 0, // 状态栏高度
			headerHeight: 0, // 粘性头部的高度
			isPreview: false,
			loading: true, // 加载状态
			selectedDay: 1,
			totalDays: 0,

			// 行程基本信息
			itineraryData: {
				title: ''
			},

			// 天数列表
			daysList: [],

			// 完整行程数据
			fullItinerary: null,

			daySectionTops: [],
			isClickScrolling: false,
			tabScrollTarget: '',

			popupTitle: '',
			popupContent: '<p>正在加载...</p>',
			isPopupOpen: false,
			currentPoiMedia: [],
			isPreview: false,
			isSwiperAutoplay: true,
			currentSwiperSlide: 0,
			headerDragData: { y: 0, time: 0 },
			contentDragData: { y: 0, time: 0 },
			isDragging: false,
			isContentAtTop: true
		};
	},

	async onLoad(options) {
		console.log('[行程详情页] 页面开始加载，参数:', options);

		// 获取系统信息，设置状态栏高度
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;
		console.log('[行程详情页] 状态栏高度:', this.statusBarHeight);

		const productId = options.productId;
		if (!productId) {
			console.error('[行程详情页] 缺少 productId');
			uni.showToast({
				title: '缺少产品ID',
				icon: 'none'
			});
			this.loading = false;
			return;
		}

		// 获取行程详情
		await this.loadItineraryDetail(productId);
	},

	onShow() {
		// 修复从预览图片返回时的问题
		this.isPreview = false;
	},

	onPageScroll(e) {
		// 如果是点击tab触发的滚动，或者位置信息尚未计算，则不执行
		if (this.isClickScrolling || this.daySectionTops.length === 0) {
			return;
		}

		const scrollTop = e.scrollTop;
		// 定义一个触发线，即页面滚动条+粘性头部高度+一点缓冲
		// 当day-section的顶部触碰到这条线时，我们就认为它"激活"了
		const triggerLine = scrollTop + this.headerHeight + 20; // 20px的缓冲

		// 从后往前遍历，效率更高
		for (let i = this.daySectionTops.length - 1; i >= 0; i--) {
			if (triggerLine >= this.daySectionTops[i]) {
				const currentDay = i + 1;
				if (this.selectedDay !== currentDay) {
					this.selectedDay = currentDay;
					this.scrollToTab(currentDay);
				}
				return; // 找到后立即退出
			}
		}

		// 如果滚动到最顶部，且未匹配到任何
		if (scrollTop < this.daySectionTops[0]) {
			if (this.selectedDay !== 1) {
				this.selectedDay = 1;
				this.scrollToTab(1);
			}
		}
	},

	methods: {
		goBack() {
			uni.navigateBack();
		},

		// 获取行程详细信息
		async loadItineraryDetail(productId) {
			console.log('[加载行程详情] 开始获取产品ID为', productId, '的行程');
			this.loading = true;
			try {
				const itineraryService = uniCloud.importObject('a-itinerary-service');
				const result = await itineraryService.getItineraryDetail(productId);

				// console.log('[加载行程详情] 服务返回结果:', result);

				if (result.errCode === 0 && result.data) {
					this.fullItinerary = result.data;
					this.itineraryData.title = result.data.title || '行程详情';
					this.totalDays = result.data.itinerary ? result.data.itinerary.length : 0;
					this.daysList = Array.from({ length: this.totalDays }, (_, i) => i + 1);

					// 动态获取头部高度，用于滚动计算
					this.$nextTick(() => {
						uni
							.createSelectorQuery()
							.in(this)
							.select('#itinerary-header-detail')
							.boundingClientRect((data) => {
								if (data) {
									this.headerHeight = data.height;
									console.log('[加载行程详情] 粘性头部高度:', this.headerHeight);
									this.calculateSectionTops();
									this.scrollToTab(this.selectedDay, false);
								}
							})
							.exec();
					});
				} else {
					console.error('[加载行程详情] 获取失败:', result.errMsg);
					uni.showToast({
						title: result.errMsg || '加载行程失败',
						icon: 'none'
					});
					this.fullItinerary = null;
				}
			} catch (error) {
				console.error('[加载行程详情] 捕获异常:', error);
				uni.showToast({
					title: '加载异常，请重试',
					icon: 'none'
				});
				this.fullItinerary = null;
			} finally {
				this.loading = false;
				console.log('[加载行程详情] 加载结束');
			}
		},

		// 转换活动数据为时间轴格式
		transformDayActivities(activities) {
			if (!activities || activities.length === 0) {
				return [];
			}

			return activities.map((activity, index) => {
				let activityImages = [];
				if (activity.elementData) {
					if (activity.elementType === 'scenic' && activity.elementData.scenic_spots && activity.elementData.scenic_spots.length > 0) {
						activity.elementData.scenic_spots.forEach((spot) => {
							if (spot.images && spot.images.length > 0) {
								activityImages.push(...spot.images);
							}
						});
					} else if (activity.elementType === 'hotel' && activity.elementData.image) {
						activityImages.push(activity.elementData.image);
					} else if (activity.elementData.images && activity.elementData.images.length > 0) {
						activityImages = activity.elementData.images;
					} else if (activity.elementData.image) {
						activityImages.push(activity.elementData.image);
					}
				}

				let activityTitle = activity.title || '';
				let hotelOptions = null;
				let scenicSpots = null;
				let activityPoiId = null;
				let activityMatchStatus = null;

				if (activity.elementData) {
					if (activity.elementType === 'scenic' && activity.elementData.scenic_spots && activity.elementData.scenic_spots.length > 0) {
						scenicSpots = activity.elementData.scenic_spots.map((spot) => ({
							name: spot.name,
							linked_poi_id: spot.linked_poi_id || null,
							match_status: spot.match_status || null
						}));
						const spotNames = scenicSpots.map((spot) => spot.name).filter((name) => name);
						if (spotNames.length > 0) {
							activityTitle = spotNames.join('、');
						}
					} else if (activity.elementType === 'hotel') {
						const hotelData = activity.elementData;
						let hotelNames = [];
						const primaryName = hotelData.hotelName || hotelData.name;
						if (primaryName) {
							hotelNames.push({
								name: primaryName,
								linked_poi_id: activity.linked_poi_id || null,
								match_status: activity.match_status || null
							});
						}
						if (hotelData.alternativeHotels && Array.isArray(hotelData.alternativeHotels)) {
							hotelData.alternativeHotels.forEach((altHotel) => {
								let altHotelName = '';
								let altPoiId = null;
								let altMatchStatus = null;
								if (typeof altHotel === 'object' && altHotel.name) {
									altHotelName = altHotel.name;
									altPoiId = altHotel.linked_poi_id || null;
									altMatchStatus = altHotel.match_status || null;
								} else if (typeof altHotel === 'string') {
									altHotelName = altHotel;
								}
								if (altHotelName) {
									hotelNames.push({
										name: altHotelName,
										linked_poi_id: altPoiId,
										match_status: altMatchStatus
									});
								}
							});
						}
						if (hotelNames.length > 0) {
							hotelOptions = hotelNames;
							activityTitle = hotelNames[0].name;
						}
					} else if (activity.elementType === 'restaurant') {
						activityPoiId = activity.linked_poi_id || null;
						activityMatchStatus = activity.match_status || null;
						if (activity.elementData.name) {
							activityTitle = activity.elementData.name;
						} else if (activity.elementData.meal_type) {
							activityTitle = activity.elementData.meal_type;
						}
					} else if (activity.elementType === 'transport') {
						if (activity.elementData.departure && activity.elementData.destination) {
							activityTitle = `${activity.elementData.departure} → ${activity.elementData.destination}`;
						}
					} else if ((activity.elementType === 'assembly' || activity.elementType === 'dismissal') && activity.elementData.locations) {
						if (activity.elementData.locations.length > 0) {
							activityTitle = activity.elementData.locations.join(' / ');
						}
					} else if (activity.elementData.show_name) {
						activityTitle = activity.elementData.show_name;
					} else if (activity.elementData.name) {
						activityTitle = activity.elementData.name;
					}
				}

				return {
					type: this.mapActivityType(activity.elementType),
					elementType: activity.elementType,
					time: activity.time_start_time || activity.time_period || '',
					description: this.buildActivityDescription(activity),
					images: activityImages,
					remark: this.formatContent(activity.remark, { emojiBreakStyle: 'newline' }),
					elementData: activity.elementData || null,
					title: activityTitle,
					hotelOptions: hotelOptions,
					scenicSpots: scenicSpots,
					activityPoiId: activityPoiId,
					activityMatchStatus: activityMatchStatus
				};
			});
		},

		previewImage(urls, current) {
			this.isPreview = true;
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

		// 映射活动类型到图标类型
		mapActivityType(elementType) {
			// console.log('[类型映射] 映射活动类型:', elementType);
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
			// console.log('[类型映射] 映射结果:', result);
			return result;
		},

		/**
		 * 格式化长文本，根据特定规则（如Emoji标题）添加换行
		 */
		formatContent(rawText, options = {}) {
			if (!rawText || typeof rawText !== 'string') {
				return '';
			}

			// --- 根据选项决定换行符 ---
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
			content = content.replace(/(__SPECIAL_TITLE_\d+__)(?=\s*__SPECIAL_TITLE_\d+__)/g, `$1${breakChar}`);

			// --- 第 3 步：在常规段落标题前插入空行 ---
			const emojiHeaderRegex = new RegExp(`(\\s*)(${emojiRegexPart})(?!\\s*${emojiRegexPart})(?=\s*\\S)`, 'gu');
			content = content.replace(emojiHeaderRegex, `${breakChar}$2`);

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
			content = content.replace(/([。；！？：])\s*(\d+\.)(?!\d)/g, '$1\n\n$2');
			content = content.replace(/([\u4e00-\u9fa5a-zA-Z])(\d+\.)(?!\d)/g, '$1\n$2');

			// --- 第 6 步：恢复特殊标题，并应用其专属的换行规则 ---
			content = content.replace(/__SPECIAL_TITLE_(\d+)__/g, (match, index) => {
				const originalTitle = specialTitles[parseInt(index)];
				if (content.trim().indexOf(match.trim()) === 0) {
					return `${originalTitle}\n`;
				}
				return `${breakChar}${originalTitle}\n`;
			});

			// --- 第 7 步：最终清理 ---
			content = content.replace(/\n\s*([:：])\s*/g, '$1');
			content = content.replace(/\n{3,}/g, '\n\n').trim();

			return content;
		},

		// 构建活动描述
		buildActivityDescription(activity) {
			// console.log('[构建描述] 开始构建活动描述:', {
			// 	title: activity.title,
			// 	location: activity.location,
			// 	elementType: activity.elementType,
			// 	hasElementData: !!activity.elementData
			// });

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
					description += this.formatContent(transport.content);
				}
			}
			// 处理其他类型
			else if (activity.elementData?.content) {
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
		 */
		formatDuration(hours, minutes) {
			const h = parseFloat(hours) || 0;
			const m = parseFloat(minutes) || 0;
			const totalMinutes = Math.round(h * 60 + m);
			if (totalMinutes <= 0) {
				return '';
			}
			const displayHours = Math.floor(totalMinutes / 60);
			const displayMinutes = totalMinutes % 60;
			let result = '时长：';
			if (displayHours > 0) {
				result += `${displayHours}小时`;
			}
			if (displayMinutes > 0) {
				if (result) {
					result += ' ';
				}
				result += `${displayMinutes}分钟`;
			}
			return result;
		},

		// 选择天数
		selectDay(day) {
			console.log('[选择天数] 用户选择第', day, '天');
			this.selectedDay = day;
			this.scrollToTab(day);

			this.isClickScrolling = true;

			// 滚动到对应的天数锚点
			const elementId = 'day-section-' + day;
			console.log('[滚动定位] 滚动到锚点:', elementId);

			try {
				uni
					.createSelectorQuery()
					.in(this)
					.select('#' + elementId)
					.boundingClientRect((data) => {
						if (!data) {
							console.warn('[滚动定位] 未找到元素:', elementId);
							this.isClickScrolling = false;
							return;
						}

						// 获取视窗滚动信息
						uni
							.createSelectorQuery()
							.in(this)
							.selectViewport()
							.scrollOffset((viewport) => {
								if (!viewport) {
									console.warn('[滚动定位] 未找到视窗信息');
									this.isClickScrolling = false;
									return;
								}

								// 目标滚动位置 = 当前滚动条 + 元素顶部位置 - 粘性头部高度
								const targetScrollTop = viewport.scrollTop + data.top - this.headerHeight;

								// console.log(`[滚动定位] 计算: ${viewport.scrollTop} (current) + ${data.top} (element) - ${this.headerHeight} (header) = ${targetScrollTop}`);

								uni.pageScrollTo({
									scrollTop: Math.max(0, targetScrollTop), // 确保不为负数
									duration: 300,
									complete: () => {
										// 滚动结束后，稍作延迟再重置标记
										setTimeout(() => {
											this.isClickScrolling = false;
										}, 100); // 100ms 缓冲
									}
								});
							})
							.exec();
					})
					.exec();
			} catch (e) {
				console.error('[滚动定位] 发生错误:', e);
				this.isClickScrolling = false;
			}
		},

		// 滚动Tabs的方法
		scrollToTab(day, animated = true) {
			if (day <= 0) return;
			// console.log('[Tab滚动] 滚动到', 'day-tab-' + day);

			// 动态设置目标ID
			this.tabScrollTarget = 'day-tab-' + day;

			// 必须在$nextTick后清除ID，否则下次设置相同ID时不会触发滚动
			this.$nextTick(() => {
				this.tabScrollTarget = '';
			});
		},

		// 计算每天section的锚点位置
		calculateSectionTops() {
			console.log('[锚点计算] 开始计算所有day-section的顶部位置');
			try {
				const query = uni.createSelectorQuery().in(this);
				query.selectViewport().scrollOffset(); // 用于获取当前滚动条位置

				this.daysList.forEach((day) => {
					query.select('#day-section-' + day).boundingClientRect();
				});

				query.exec((res) => {
					if (!res || res.length === 0) {
						console.error('[锚点计算] query.exec失败');
						return;
					}

					const scrollTop = res[0] ? res[0].scrollTop : 0;
					// console.log('[锚点计算] 当前scrollTop:', scrollTop);

					this.daySectionTops = []; // 清空

					for (let i = 1; i < res.length; i++) {
						if (res[i]) {
							// 元素的绝对顶部位置 = 视窗滚动条 + 元素相对视窗的top
							// 我们需要减去粘性头部的高度，因为那是我们的"触发线"
							const absoluteTop = scrollTop + res[i].top - this.headerHeight;
							this.daySectionTops.push(absoluteTop);
						} else {
							console.warn(`[锚点计算] 未找到 #day-section-${i}`);
							// Failsafe: 估算一个值
							const lastTop = this.daySectionTops[this.daySectionTops.length - 1] || 0;
							this.daySectionTops.push(lastTop + 500); // 假设每个section高500
						}
					}
					// console.log('[锚点计算] 计算完成，各section顶部位置:', this.daySectionTops);
				});
			} catch (e) {
				console.error('[锚点计算] 发生异常:', e);
			}
		},

		// 获取时间轴图标
		getTimelineIcon(type) {
			const iconMap = {
				// meal: 'fa fa-utensils',
				meal: '/static/icons/utensils.svg',
				// transport: 'fa fa-car',
				transport: '/static/icons/car.svg',
				// attraction: 'fa fa-camera',
				attraction: '/static/icons/camera.svg',
				// hotel: 'fa fa-hotel'
				hotel: '/static/icons/hotel.svg'
			};
			// return iconMap[type] || 'fa fa-circle';
			return iconMap[type] || '/static/icons/circle.svg';
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

		isImageFile(file) {
			if (!file) return false;
			return !this.isVideoFile(file);
		},

		isVideoFile(file) {
			if (!file) return false;
			let ext = '';
			if (file.extname) {
				ext = file.extname.toLowerCase().replace('.', '');
			} else if (file.url) {
				ext = file.url.split('.').pop().toLowerCase();
			}
			if (!ext) return false;
			const videoExts = ['mp4', 'mov', 'webm', 'ogg'];
			return videoExts.includes(ext);
		},

		async openPoiPopup(poiId) {
			if (!poiId) return;
			this.popupContent = '<div style="padding: 15px;"><p>正在加载...</p></div>';
			this.currentPoiMedia = [];
			this.isSwiperAutoplay = true;
			this.currentSwiperSlide = 0;

			await this.fetchPoiDetails(poiId);

			this.$nextTick(() => {
				this.$refs.tipsPopup.open();
				if (this.currentPoiMedia.length > 0) {
					const firstMedia = this.currentPoiMedia[0];
					if (this.isVideoFile(firstMedia)) {
						setTimeout(() => {
							const videoCtx = uni.createVideoContext('video-0', this);
							if (videoCtx) {
								videoCtx.play();
							}
						}, 500);
					}
				}
			});
		},

		async fetchPoiDetails(poiId) {
			try {
				const poiService = uniCloud.importObject('a-poi-service');
				const res = await poiService.getPoiDetails(poiId);
				if (res.errCode === 0 && res.data) {
					this.currentPoiMedia = res.data.media || [];
					this.popupContent = this.formatPoiToHtml(res.data);
				} else {
					throw new Error(res.errMsg || '未找到POI详情');
				}
			} catch (e) {
				console.error('fetchPoiDetails failed:', e);
				this.popupTitle = '加载失败';
				this.popupContent = `<p style="padding: 15px;">加载POI详情失败: ${e.message}</p>`;
				this.currentPoiMedia = [];
			}
		},

		formatPoiToHtml(poi) {
			let html = '<div style="padding: 15px;">';
			html += '<div class="poi-line-1">';
			if (poi.category_name) {
				html += `<span class="poi-badge-cat">${poi.category_name}</span>`;
			}
			html += `<h1 class="poi-name">${poi.name}</h1>`;
			html += '</div>';
			html += '<div class="poi-line-2">';
			if (poi.region_names && poi.region_names.length > 0) {
				poi.region_names.forEach((name) => {
					html += `<span class="poi-badge-region">${name}</span>`;
				});
			}
			if (poi.address_text) {
				html += `<span class="poi-address">${poi.address_text}</span>`;
			}
			html += '</div>';
			if (poi.tag_names && poi.tag_names.length > 0) {
				html += '<div class="poi-line-3">';
				poi.tag_names.forEach((name) => {
					html += `<span class="poi-badge-tag">${name}</span>`;
				});
				html += '</div>';
			}
			if ((poi.tag_names && poi.tag_names.length > 0) || (poi.region_names && poi.region_names.length > 0)) {
				html += '<div class="poi-divider"></div>';
			}
			html += '<div class="poi-description">';
			html += poi.description || '<p>暂无详细介绍</p>';
			html += '</div>';
			html += '</div>';
			return html;
		},

		closeTipsPopup() {
			this.$refs.tipsPopup.close();
			const currentMedia = this.currentPoiMedia[this.currentSwiperSlide];
			if (currentMedia && this.isVideoFile(currentMedia)) {
				const videoCtx = uni.createVideoContext('video-' + this.currentSwiperSlide, this);
				if (videoCtx) {
					videoCtx.pause();
				}
			}
			this.currentPoiMedia = [];
			this.isSwiperAutoplay = true;
		},

		onPopupChange(e) {
			this.isPopupOpen = e.show;
			if (e.show) {
				this.isContentAtTop = true;
			}
		},

		onHeaderDragStart(e) {
			if (e.touches.length !== 1) return;
			this.headerDragData.y = e.touches[0].clientY;
			this.headerDragData.time = Date.now();
			this.isDragging = true;
		},

		onDragMove(e) {
			if (!this.isDragging) return;
		},

		onHeaderDragEnd(e) {
			if (!this.isDragging) return;
			this.isDragging = false;
			const touch = e.changedTouches[0];
			const deltaY = touch.clientY - this.headerDragData.y;
			const deltaTime = Date.now() - this.headerDragData.time;
			const isForcefulSwipe = deltaY > 50 && deltaTime < 300;
			if (isForcefulSwipe) {
				this.closeTipsPopup();
			}
		},

		dummyAllow() {
			return;
		},

		onContentScroll(e) {
			this.isContentAtTop = e.detail.scrollTop < 20;
		},

		onContentTouchStart(e) {
			if (e.touches.length !== 1) return;
			this.contentDragData.y = e.touches[0].clientY;
			this.contentDragData.time = Date.now();
			this.isDragging = true;
		},

		onContentTouchEnd(e) {
			if (!this.isDragging) return;
			this.isDragging = false;
			const touch = e.changedTouches[0];
			const deltaY = touch.clientY - this.contentDragData.y;
			const deltaTime = Date.now() - this.contentDragData.time;
			const isForcefulSwipe = deltaY > 50 && deltaTime < 300;
			if (isForcefulSwipe && this.isContentAtTop) {
				this.closeTipsPopup();
			}
		},

		onSwiperChange(e) {
			const newIndex = e.detail.current;
			const oldIndex = this.currentSwiperSlide;
			this.currentSwiperSlide = newIndex;

			const oldMedia = this.currentPoiMedia[oldIndex];
			if (oldMedia && this.isVideoFile(oldMedia)) {
				const oldCtx = uni.createVideoContext('video-' + oldIndex, this);
				if (oldCtx) {
					oldCtx.pause();
				}
			}

			const newMedia = this.currentPoiMedia[newIndex];
			if (newMedia && this.isVideoFile(newMedia)) {
				const newCtx = uni.createVideoContext('video-' + newIndex, this);
				if (newCtx) {
					newCtx.play();
				}
			}
		},

		previewSwiperImage(currentUrl) {
			// 1. 从媒体列表中筛选出所有的图片
			const imageUrls = this.currentPoiMedia
				.filter((file) => this.isImageFile(file)) // 使用我们已有的辅助函数
				.map((file) => file.url); // 使用编码后的URL

			if (imageUrls.length === 0) {
				return; // 没有图片可预览
			}

			// 2. 找到当前点击的图片在列表中的索引
			const currentIndex = imageUrls.indexOf(currentUrl);

			// 3. 设置 isPreview 标志，防止 onShow 时页面滚动
			this.isPreview = true;

			// 4. 调用 uni.previewImage
			uni.previewImage({
				urls: imageUrls,
				current: currentIndex,
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

		onVideoPlay() {
			console.log('Video playing, pausing swiper.');
			this.isSwiperAutoplay = false;
		},

		onVideoPause() {
			console.log('Video paused/ended, resuming swiper.');
			this.isSwiperAutoplay = true;
		},

		getEncodedUrl(url) {
			if (!url) return '';
			return encodeURI(url);
		}
	}
};
</script>

<style>
.back-button {
	position: absolute;
	left: 24rpx;
	top: calc(var(--status-bar-height) + 45rpx);
	width: 70rpx;
	height: 70rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 99;
	background-color: rgba(255, 255, 255, 0.7);
	border-radius: 50%;
}

.itinerary-header-detail {
	background-color: white;
	padding: 20px 20px 0;
	border-bottom: 1px solid #f0f0f0;
	position: sticky;
	z-index: 10;
	top: 0;
}

.day-section {
	margin-bottom: 10px;
}

.day-section-header {
	padding: 16px 20px;
	font-size: 18px;
	font-weight: 600;
	color: #eb6d20;
	background-color: #f0f7ff;
	border-bottom: 1px solid #e0e8f3;
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
	border-top: 3px solid #eb6d20;
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

.day-tabs {
	padding: 16px 0 12px;
	scrollbar-width: none;
	white-space: nowrap;
}

.day-tabs::-webkit-scrollbar {
	display: none;
}

.day-tab {
	display: inline-block;
	padding: 8px 12px;
	margin-right: 10px;
	border-radius: 16px;
	font-size: 14px;
	white-space: nowrap;
	background-color: #f0f7ff;
	color: #eb6d20;
	transition: all 0.2s ease;
}

.day-tab.active {
	background-color: #eb6d20;
	color: white;
	/* box-shadow: 0 2px 8px rgba(0, 134, 246, 0.3); */
}

.day-overview {
	background-color: white;
	padding: 16px 20px;
	border-bottom: 1px solid #f0f0f0;
}

.day-highlights {
	background-color: white;
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

.timeline {
	position: relative;
	padding: 0 20px 20px;
	background-color: #fff;
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
	border: 1px solid #eb6d20;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2;
}

.timeline-dot text {
	color: #eb6d20;
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
	color: #eb6d20;
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
	color: #eb6d20;
}

.formatted-content {
	white-space: pre-wrap;
	display: block;
	word-break: break-all;
}

/* POI 弹窗通用样式 */
.tips-popup-container {
	background-color: #ffffff;
	border-top-left-radius: 16px;
	border-top-right-radius: 16px;
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 80vh;
}
.tips-popup-header {
	padding: 12px 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-bottom: 1px solid #f0f0f0;
	position: relative;
	min-height: 44px;
	box-sizing: border-box;
	flex-shrink: 0;
}
.tips-popup-close {
	position: absolute;
	right: 12px;
	top: 50%;
	transform: translateY(-50%);
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
}
.tips-popup-close:active {
	background-color: #f0f0f0;
}
.tips-popup-content-wrapper {
	flex: 1;
	min-height: 0;
	position: relative;
}
.tips-popup-content {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	height: 100%;
	width: 100%;
}
.tips-popup-content ::-webkit-scrollbar {
	display: none;
	width: 0;
	height: 0;
	-webkit-appearance: none;
	background: transparent;
	color: transparent;
}

/* POI 链接样式 */
.poi-link {
	color: #007aff;
	text-decoration: underline;
	font-weight: 600;
}
.poi-link:active {
	color: #5856d6;
}

/* POI 酒店列表 */
.timeline-hotel-list {
	margin-bottom: 8px;
}
.hotel-option-item {
	line-height: 1.4;
	margin-bottom: 4px;
}
.hotel-option-item:last-child {
	margin-bottom: 0;
}
.hotel-prefix {
	font-weight: 600;
	color: #333;
	font-size: 16px;
	margin-right: 4px;
}
.hotel-name {
	font-weight: 600;
	color: #333;
	font-size: 16px;
	word-break: break-word;
}

/* 原生 Swiper 样式 */
.poi-swiper-native {
	width: 100%;
	height: 200px;
}
.poi-swiper-image-native,
.poi-swiper-video-native {
	width: 100%;
	height: 100%;
}

/* POI 弹窗新布局样式 */
.tips-popup-content :deep(.poi-line-1) {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	margin-bottom: 10px;
}
.tips-popup-content :deep(.poi-name) {
	font-size: 20px;
	font-weight: 600;
	color: #000;
	margin: 0;
	margin-left: 8px;
	line-height: 1.3;
}
.tips-popup-content :deep(.poi-line-2) {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 6px;
	margin-bottom: 10px;
}
.tips-popup-content :deep(.poi-address) {
	font-size: 14px;
	color: #555;
	margin-left: 4px;
}
.tips-popup-content :deep(.poi-line-3) {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

/* 徽章样式 */
.tips-popup-content :deep(.poi-badge-cat) {
	background-color: #e0f2fe;
	color: #0c4a6e;
	padding: 3px 8px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 600;
	flex-shrink: 0;
}
.tips-popup-content :deep(.poi-badge-region) {
	background-color: #f0fdf4;
	color: #166534;
	padding: 2px 6px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;
}
.tips-popup-content :deep(.poi-badge-tag) {
	background-color: #fefce8;
	color: #854d0e;
	padding: 2px 6px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;
}

/* 分隔线 */
.tips-popup-content :deep(.poi-divider) {
	height: 1px;
	background-color: #f0f0f0;
	margin: 15px 0;
}

/* 描述区样式 */
.tips-popup-content :deep(.poi-description p) {
	font-size: 15px;
	line-height: 1.7;
	color: #333;
	margin-bottom: 12px;
}
.tips-popup-content :deep(.poi-description img) {
	max-width: 100%;
	height: auto;
	border-radius: 8px;
}
</style>
