<template>
	<page-meta :page-style="isPopupOpen ? 'overflow: hidden;' : ''"></page-meta>
	<view class="page-container">
		<!-- 状态栏占位 -->
		<view class="status-bar-placeholder" :style="{ height: statusBarHeight + 100 + 'rpx' }"></view>

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
					<view class="exit-btn" @click="exitItinerary">退出行程</view>
				</view>

				<view class="my-4">
					<view class="theme-card bg-blue-50" @click="openTipsPopup('tips')" hover-class="theme-card-active" hover-start-time="0" hover-stay-time="70">
						<view class="theme-icon-wrapper bg-blue-100">
							<!-- <text class="fa fa-suitcase-rolling text-blue-500"></text> -->
							<image src="/static/icons/suitcase-rolling.svg" class="w-5 h-5" mode="aspectFit" />
						</view>
						<view class="theme-card-title">
							<text>西藏出行提示</text>
						</view>
					</view>

					<!-- 	<view class="theme-card bg-red-50" @click="openTipsPopup('precautions')" hover-class="theme-card-active" hover-start-time="0" hover-stay-time="70">
						<view class="theme-icon-wrapper bg-red-100"> -->
					<!-- <text class="fa fa-exclamation-triangle text-red-500"></text> -->
					<!-- <image src="/static/icons/exclamation-triangle.svg" class="w-5 h-5" mode="aspectFit" />
						</view>
						<view class="theme-card-title">
							<text>注意</text>
							<text>事项</text>
						</view>
					</view>

					<view class="theme-card bg-green-50" @click="openTipsPopup('must_read')" hover-class="theme-card-active" hover-start-time="0" hover-stay-time="70">
						<view class="theme-icon-wrapper bg-green-100"> -->
					<!-- <text class="fa fa-check-circle text-green-500"></text> -->
					<!-- <image src="/static/icons/check-circle.svg" class="w-5 h-5" mode="aspectFit" />
						</view>
						<view class="theme-card-title">
							<text>出行前</text>
							<text>必读</text>
						</view>
					</view>-->
				</view>

				<!-- 天气信息区域 -->
				<view class="weather-info mt-3 p-3 bg-brand-orange-50 rounded-lg">
					<!-- 今天和明天天气对比 -->
					<view class="flex">
						<!-- 今天天气 -->
						<view class="flex-1 pr-2">
							<view class="text-xs text-brand-orange font-medium mb-1">今天 {{ weatherData.today.date }}</view>
							<view class="flex items-center mb-2">
								<!-- <text class="fa fa-sun text-yellow-500 text-xl mr-3"></text> -->
								<image src="/static/icons/sun.svg" class="w-5 h-5 mr-3" mode="aspectFit" />
								<view>
									<view class="text-lg font-semibold text-gray-800">{{ weatherData.today.temp }}</view>
									<view class="text-sm text-gray-600">{{ weatherData.today.condition }}</view>
								</view>
							</view>
							<view class="flex items-center mb-1">
								<!-- <text class="fa fa-map-marker-alt text-brand-orange text-xs mr-1"></text> -->
								<image src="/static/icons/map-marker-alt.svg" class="w-3 h-3 mr-1" mode="aspectFit" />
								<text class="text-xs text-gray-600">{{ weatherData.today.location }}</text>
								<!-- <text class="fa fa-mountain text-brand-orange text-xs ml-2 mr-1"></text> -->
								<image src="/static/icons/mountain.svg" class="w-3 h-3 ml-2 mr-1" mode="aspectFit" />
								<text class="text-xs text-brand-orange">{{ weatherData.today.altitude }}</text>
							</view>
							<view class="text-xs text-gray-500 mb-1">{{ weatherData.today.tempRange }}</view>
							<view class="text-xs text-gray-500">风力 {{ weatherData.today.wind }}</view>
						</view>

						<!-- 分隔线 -->
						<view class="w-px bg-blue-200 mx-3"></view>

						<!-- 明天天气 -->
						<view class="flex-1 pl-2">
							<view class="text-xs text-brand-orange font-medium mb-1">明天 {{ weatherData.tomorrow.date }}</view>
							<view class="flex items-center mb-2">
								<!-- <text class="fa fa-cloud-sun text-gray-500 text-xl mr-3"></text> -->
								<image src="/static/icons/cloud-sun.svg" class="w-5 h-5 mr-3" mode="aspectFit" />
								<view>
									<view class="text-lg font-semibold text-gray-800">{{ weatherData.tomorrow.temp }}</view>
									<view class="text-sm text-gray-600">{{ weatherData.tomorrow.condition }}</view>
								</view>
							</view>
							<view class="flex items-center mb-1">
								<!-- <text class="fa fa-map-marker-alt text-brand-orange text-xs mr-1"></text> -->
								<image src="/static/icons/map-marker-alt.svg" class="w-3 h-3 mr-1" mode="aspectFit" />
								<text class="text-xs text-gray-600">{{ weatherData.tomorrow.location }}</text>
								<!-- <text class="fa fa-mountain text-brand-orange text-xs ml-2 mr-1"></text> -->
								<image src="/static/icons/mountain.svg" class="w-3 h-3 ml-2 mr-1" mode="aspectFit" />
								<text class="text-xs text-brand-orange">{{ weatherData.tomorrow.altitude }}</text>
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
						<!-- <text class="fa fa-star text-amber-500 mr-2"></text> -->
						<image src="/static/icons/star.svg" class="w-5 h-5 mr-2" mode="aspectFit" />
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
								<text class="hotel-rating-icons">💎💎💎💎💎</text>
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
				<view class="action-group">
					<view class="group-btn" @click="contactSupport" hover-class="group-btn-active" hover-start-time="0" hover-stay-time="70">
						<!-- <text class="fa fa-phone mr-2"></text> -->
						<image src="/static/icons/phone.svg" class="w-5 h-5 mr-2" mode="aspectFit" />
						<text>联系管家</text>
					</view>

					<view class="action-divider"></view>

					<view class="group-btn" @click="contactGuide" hover-class="group-btn-active" hover-start-time="0" hover-stay-time="70">
						<!-- <text class="fa fa-user-headset mr-2"></text> -->
						<image src="/static/icons/user-headset.svg" class="w-5 h-5 mr-2" mode="aspectFit" />
						<text>联系向导</text>
					</view>
				</view>
			</view>
			<!-- <view class="bottom-actions">
				<view class="action-btn action-btn-light" @click="contactGuide">
					<text class="fa fa-phone mr-2"></text>
					<text>联系导游</text>
				</view>
			</view> -->
		</view>

		<!-- 无行程状态 -->
		<view class="content-area" v-else>
			<view class="empty-state">
				<view class="empty-state-icon">
					<!-- <text class="fa fa-route"></text> -->
					<image src="/static/icons/route.svg" class="route-icon" mode="aspectFit" />
				</view>
				<text class="text-xl font-semibold text-gray-800 mb-2">暂无行程</text>
				<text class="text-gray-600">您目前没有进行中的旅行行程，</text>
				<text class="text-gray-600">快去探索心仪的旅行产品吧！</text>
				<view class="action-button mb-14" @click="browseProducts">
					<!-- <text class="fa fa-search mr-2"></text> -->
					<image src="/static/icons/search-white.svg" class="search-icon mr-2" mode="aspectFit" />
					<text>浏览旅行产品</text>
				</view>
				<text class="text-gray-600 mb-2">或输入订单号来导入行程</text>
				<view class="nav-search-bar">
					<input v-model="orderId" placeholder="输入订单号..." focus="focus" placeholder-class="text-gray-400 text-sm" class="flex-1 bg-transparent text-sm text-gray-800" />
				</view>
				<view class="action-button" @click="fetchItineraryAndJoinAlbum">
					<!-- <text class="fa fa-search mr-2"></text> -->
					<image src="/static/icons/search-white.svg" class="search-icon mr-2" mode="aspectFit" />
					<text>导入行程</text>
				</view>
			</view>
		</view>

		<uni-popup ref="tipsPopup" type="bottom" @change="onPopupChange">
			<view class="tips-popup-container">
				<view class="tips-popup-header" @touchstart="onHeaderDragStart" @touchmove.stop.prevent="onDragMove" @touchend="onHeaderDragEnd">
					<view class="tips-popup-close" @click="closeTipsPopup">
						<uni-icons type="closeempty" size="20" color="#999"></uni-icons>
					</view>
				</view>

				<view class="tips-popup-content-wrapper" @touchstart="onContentTouchStart" @touchend="onContentTouchEnd">
					<scroll-view class="tips-popup-content" scroll-y :show-scrollbar="false" @scroll="onContentScroll" @touchmove.stop="dummyAllow">
						<swiper
							v-if="currentPoiMedia && currentPoiMedia.length > 0"
							class="poi-swiper-native"
							:style="{ height: swiperHeight }"
							indicator-dots
							circular
							:autoplay="isSwiperAutoplay"
							@change="onSwiperChange">
							<swiper-item v-for="(file, index) in currentPoiMedia" :key="index">
								<image
									v-if="isImageFile(file)"
									:src="getEncodedUrl(file.url)"
									class="poi-swiper-image-native"
									mode="aspectFit"
									@click="previewSwiperImage(file.url)"
									@load="(e) => onMediaLoad(e, index, 'image')" />
								<video
									v-if="isVideoFile(file)"
									:src="getEncodedUrl(file.url)"
									controls
									show-center-play-btn
									object-fit="contain"
									class="poi-swiper-video-native"
									:id="'video-' + index"
									@play="onVideoPlay"
									@pause="onVideoPause"
									@ended="onVideoPause"
									@loadedmetadata="(e) => onMediaLoad(e, index, 'video')"></video>
							</swiper-item>
						</swiper>

						<rich-content :html="popupContent" :noPadding="true" @linkTap="handleRichTextLink" />
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
			orderId: null,
			orderType: 'mp',
			statusBarHeight: 0, // 状态栏高度
			swiperHeight: '400rpx',
			hasItinerary: false, // 控制显示状态
			isPreview: false,
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
			currentDaySchedule: [],

			guidePhone: null,
			attendantPhone: null,

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
		console.log('[行程页面] 页面开始加载，参数:', options);

		// 获取系统信息，设置状态栏高度
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;
		console.log('[行程页面] 状态栏高度:', this.statusBarHeight);

		const guideOrderId = uni.getStorageSync('guide_override_order_id');
		if (guideOrderId) {
			console.log('[行程页面] 向导特权：加载行程，订单号：', guideOrderId);
			this.orderId = guideOrderId;
			await this.fetchItineraryAndJoinAlbum(true);
		}
		// 检查用户是否有进行中的行程
		else {
			console.log('[行程页面] 用户加载行程');
			await this.checkUserItinerary();
		}
	},

	async onShow() {
		const guideOrderId = uni.getStorageSync('guide_override_order_id');
		if (guideOrderId) {
			console.log('[行程页面] onShow 当前行程为向导特权订单：', guideOrderId);
			uni.removeStorageSync('guide_override_order_id');
			this.orderId = guideOrderId;
			this.loading = true;
			this.hasItinerary = false;
			await this.fetchItineraryAndJoinAlbum(true);

			if (this.hasItinerary) {
				await this.$nextTick();
				this.scrollToCurrentPosition();
			}
			return;
		}

		// 如果有行程且不是从图片预览中退回，实现智能滚动
		if (this.isPreview) {
			this.isPreview = false; // 重置标志
			console.log('[行程页面] onShow: 从图片预览返回，跳过');
			return; // 退出
		}

		this.isPreview = false;
		console.log('[行程页面] onShow: 页面显示，检查缓存时效');

		// onShow 也调用标准检查，它会自动处理缓存
		await this.checkUserItinerary();

		// 智能滚动 (基于刷新后的状态)
		if (this.hasItinerary) {
			await this.$nextTick();
			this.scrollToCurrentPosition();
		}

		console.log('[行程页面] 页面加载完成 (onShow)');
	},

	async onPullDownRefresh() {
		console.log('[行程页面] 用户触发下拉刷新');
		// 调用检查，并传入 true 强制刷新
		await this.checkUserItinerary(true);
	},

	methods: {
		// 检查用户是否有进行中的行程
		async checkUserItinerary(forceRefresh = false) {
			console.log(`[检查行程] 开始 (ForceRefresh: ${forceRefresh})`);
			try {
				console.log('[检查行程] 设置加载状态为true');

				// 检查登录状态
				const token = uni.getStorageSync('uni_id_token');
				if (!token) {
					console.error('[检查行程] 用户未登录');
					// uni.navigateTo({
					// 	url: '/pages/login/login'
					// });
					return;
				}

				// 先检查本地缓存的行程信息
				const cachedItinerary = uni.getStorageSync('current_itinerary');
				if (cachedItinerary && !forceRefresh) {
					if (cachedItinerary.orderType) this.orderType = cachedItinerary.orderType;
					console.log('[检查行程] 使用缓存的行程信息');
					await this.loadItineraryFromCache(cachedItinerary);
					return;
				}

				// 调用行程服务获取当前行程
				if (!this.hasItinerary) {
					this.loading = true;
				}
				console.log('[检查行程] 调用行程服务获取当前行程');
				const itineraryService = uniCloud.importObject('a-itinerary-service');
				const result = await itineraryService.getCurrentItinerary();

				console.log('[检查行程] 行程服务返回结果:', result);

				if (result && result.errCode === 0 && result.data) {
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
					// uni.navigateTo({
					// 	url: '/pages/login/login'
					// });
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

		// 通过用户输入的订单号获取订单行程及加入相册
		async fetchItineraryAndJoinAlbum(forceRefresh = false) {
			// 检查登录状态
			const token = uni.getStorageSync('uni_id_token');
			if (!token) {
				console.error('[检查行程] 用户未登录');
				uni.navigateTo({
					url: '/pages/login/login'
				});
				return;
			}

			console.log('[检查行程] 开始检查用户行程');
			try {
				this.loading = true;
				console.log('[检查行程] 设置加载状态为true');

				if (!forceRefresh) {
					// 先检查本地缓存的行程信息
					const cachedItinerary = uni.getStorageSync('current_itinerary');
					if (cachedItinerary) {
						console.log('[检查行程] 使用缓存的行程信息');
						await this.loadItineraryFromCache(cachedItinerary);
						return;
					}
				}

				// 调用行程服务获取当前行程
				console.log('[检查行程] 调用行程服务获取快照行程');
				const itineraryService = uniCloud.importObject('a-itinerary-service');
				const result = await itineraryService.getItineraryByOrderId(this.orderId);

				console.log('[检查行程] 行程服务返回结果:', result);

				if (result.errCode === 0 && result.data) {
					console.log('[检查行程] 找到指定行程，开始加载');
					// 缓存行程信息
					uni.setStorageSync('current_itinerary', result.data);
					await this.loadItineraryFromCache(result.data);

					console.log('[检查行程] 调用相册服务加入该行程的群相册');
					const albumService = uniCloud.importObject('album-service', { customUI: true });
					let albumResult;

					try {
						albumResult = await albumService.joinAlbumByOrderId(this.orderId);
						console.log('[检查行程] 相册服务返回结果:', albumResult);

						if (albumResult.errCode === 0 && albumResult.data) {
							console.log('[检查行程] 成功加入群相册');
						} else {
							console.log('[检查行程] 加入群相册失败，可能是未找到相册');
						}
					} catch (e) {
						try {
							console.log(`[检查行程] 开始为订单 ${this.orderId} 创建相册`);
							albumResult = await albumService.createAlbum(this.orderId);
							console.log('[检查行程] 相册服务返回结果:', albumResult);
							if (albumResult.errCode === 0 && albumResult.album_id) {
								console.log('[检查行程] 创建成功并加入该相册，相册ID: ', albumResult.album_id);
							} else {
								console.log('[检查行程] 相册创建失败');
							}
						} catch (createError) {
							console.error('[检查行程] 尝试创建相册时也失败了:', createError);
							uni.showToast({ title: '创建相册失败', icon: 'none' });
						}
					}
				} else {
					console.log('[检查行程] 没有找到指定的行程');
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

		// 从缓存加载行程数据
		async loadItineraryFromCache(itineraryInfo) {
			console.log('[加载行程] 从缓存加载行程数据:', itineraryInfo);
			try {
				// 设置基本信息
				this.currentOrder = itineraryInfo.order;
				this.fullItinerary = itineraryInfo.itinerary;
				this.parseStaves();

				// 设置行程标题和日期
				this.itineraryData.title = itineraryInfo.itinerary.title || itineraryInfo.order.product_snapshot?.title || '';
				this.totalDays = itineraryInfo.totalDays;
				this.currentDay = itineraryInfo.currentDay;
				this.selectedDay = this.currentDay;
				this.daysList = Array.from({ length: this.totalDays }, (_, i) => i + 1);

				// 设置日期范围 - 使用云端格式化好的日期字符串
				const departureTimestamp = Number(this.currentOrder.departure_date);
				const departureDateObj = new Date(departureTimestamp);

				// 计算结束日期
				const endDateObj = new Date(departureTimestamp);
				endDateObj.setDate(departureDateObj.getDate() + this.totalDays - 1);

				const departureDateStr = this.formatDate(departureDateObj);
				const endDateStr = this.formatDate(endDateObj);

				// 5. 设置日期范围
				this.itineraryData.dateRange = `${departureDateStr} - ${endDateStr}`;

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

		parseStaves() {
			// 每次加载时先重置
			this.guidePhone = null;
			this.attendantPhone = null;

			if (!this.currentOrder || !Array.isArray(this.currentOrder.staves)) {
				console.log('[解析Staves] 订单信息中无 staves 字段');
				return;
			}

			const staves = this.currentOrder.staves;

			for (const staff of staves) {
				if (staff.role && Array.isArray(staff.role)) {
					// 查找向导
					if (staff.role.includes('guide')) {
						this.guidePhone = staff.mobile;
						console.log('[解析Staves] 找到向导电话:', staff.mobile);
					}
					// 查找管家
					if (staff.role.includes('attendant')) {
						this.attendantPhone = staff.mobile;
						console.log('[解析Staves] 找到管家电话:', staff.mobile);
					}
				}
			}
		},

		navigateToTips(type) {
			uni.navigateTo({
				url: `/pages/itinerary/itinerary-tips?type=${type}`
			});
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
					let hotelOptions = null;
					let scenicSpots = null;
					let activityPoiId = null;
					let activityMatchStatus = null;

					if (activity.elementData) {
						// 景点类型：使用景点的具体名称
						if (activity.elementType === 'scenic' && activity.elementData.scenic_spots && activity.elementData.scenic_spots.length > 0) {
							scenicSpots = activity.elementData.scenic_spots.map((spot) => ({
								name: spot.name,
								linked_poi_id: spot.linked_poi_id || null,
								match_status: spot.match_status || null
							}));

							const spotNames = activity.elementData.scenic_spots.map((spot) => spot.name).filter((name) => name);
							if (spotNames.length > 0) {
								activityTitle = spotNames.join('、');
							}
						}
						// 酒店类型：使用酒店的具体名称
						else if (activity.elementType === 'hotel') {
							const hotelData = activity.elementData;
							let hotelNames = [];

							// 1. 获取主酒店名称
							const primaryName = hotelData.hotelName || hotelData.name;
							if (primaryName) {
								hotelNames.push({
									name: primaryName,
									linked_poi_id: activity.linked_poi_id || null, // 主酒店POI在 activity 根级
									match_status: activity.match_status || null
								});
							}

							// 2. 获取备选酒店名称
							if (hotelData.alternativeHotels && Array.isArray(hotelData.alternativeHotels)) {
								hotelData.alternativeHotels.forEach((altHotel) => {
									let altHotelName = '';
									let altPoiId = null;
									let altMatchStatus = null;

									// 兼容备选酒店是对象数组或字符串数组
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
						}
						// 餐厅类型：使用餐厅的具体名称
						else if (activity.elementType === 'restaurant') {
							activityPoiId = activity.linked_poi_id || null;
							activityMatchStatus = activity.match_status || null;

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
						elementData: activity.elementData || null, // 传递完整的elementData
						title: activityTitle,
						hotelOptions: hotelOptions,
						scenicSpots: scenicSpots,
						activityPoiId: activityPoiId,
						activityMatchStatus: activityMatchStatus
					};
				});
				console.log('[加载日程] 转换完成，活动数量:', this.currentDaySchedule.length);
			} else {
				console.log('[加载日程] 当天没有活动安排');
				this.currentDaySchedule = [];
			}
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
						uni.removeStorageSync('guide_override_order_id');
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
			// 修改点2: 使用动态的 breakChar 变量
			content = content.replace(/(__SPECIAL_TITLE_\d+__)(?=\s*__SPECIAL_TITLE_\d+__)/g, `$1${breakChar}`);

			// --- 第 3 步：在常规段落标题前插入空行 ---
			// 修改点3: 使用动态的 breakChar 变量
			const emojiHeaderRegex = new RegExp(`(\\s*)(${emojiRegexPart})(?!\\s*${emojiRegexPart})(?=\s*\\S)`, 'gu');
			content = content.replace(emojiHeaderRegex, `${breakChar}$2`);

			const textHeaderRegex = /([。；！？])\s*([^，。；\n\r]{1,10}：)/gu;
			content = content.replace(textHeaderRegex, `$1${breakChar}$2`);

			// 在 "▪️" 列表符前另起一行 ---
			content = content.replace(/\s*(▪️)/g, `\n$1`);

			// 在 "(1)" 或 "（1）" 这样的序号前另起一行
			content = content.replace(/\s*([\(\（]\d+[\)\）])/g, `\n$1`);

			// 在 "PS" 开头的句子前空行
			content = content.replace(/\s*(PS)/g, `${breakChar}$1`);

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
				if (Array.isArray(spots)) {
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
			}
			// 处理酒店类型
			else if (activity.elementType === 'hotel' && activity.elementData) {
				const hotel = activity.elementData;
				// if (hotel.rating) {
				// 	description += `酒店等级：${hotel.rating}`;
				// }
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
				// if (restaurant.meal_type) {
				// 	description += `用餐类型：${restaurant.meal_type}`;
				// }
				if (restaurant.cuisine) {
					if (description) description += ' | ';
					description += `菜系：${restaurant.cuisine}`;
				}
				if (restaurant.adult_fee_type) {
					if (description) description += '\n';
					description += `费用：${restaurant.adult_fee_type}`;
				}
				if (restaurant.standard) {
					if (description) description += '\n';
					description += `餐标：${restaurant.standard}`;
				}

				// const durationString = this.formatDuration(activity.time_duration_hours, activity.time_duration_minutes);
				// if (durationString) {
				// 	if (description) description += '\n';
				// 	// formatDuration 默认返回 "时长："，我们替换为 "用餐时间："
				// 	description += durationString.replace('时长：', '用餐时间：');
				// }
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
				startDate.setHours(0, 0, 0, 0);
				const startDateStr = this.formatDateString(startDate);

				console.log('[获取今天位置] 行程开始日期:', startDateStr);

				// 计算今天是行程的第几天
				const todayDate = new Date(todayDateStr);
				const daysDiff = Math.floor((todayDate - startDate) / (24 * 60 * 60 * 1000)) + 1;

				console.log('[获取今天位置] 今天是行程第', daysDiff, '天');

				// 如果今天在行程范围内，使用对应天数的位置
				// if (daysDiff >= 1 && daysDiff <= this.totalDays) {
				// 	const dayData = this.fullItinerary.itinerary.find((item) => item.day === daysDiff);
				// 	if (dayData && dayData.day_title) {
				// 		console.log('[获取今天位置] 找到今天的行程:', dayData.day_title);
				// 		return this.extractLocationFromRoute(dayData.day_title);
				// 	}
				// }

				// // 如果今天不在行程范围内，使用第一天的位置
				// const firstDayData = this.fullItinerary.itinerary.find((item) => item.day === 1);
				// if (firstDayData && firstDayData.day_title) {
				// 	console.log('[获取今天位置] 使用第一天的位置:', firstDayData.day_title);
				// 	return this.extractLocationFromRoute(firstDayData.day_title);
				// }

				let targetDayToQuery = 0; // 我们要查询的目标天数

				// (Case 1) 如果今天在行程范围内
				if (daysDiff >= 1 && daysDiff <= this.totalDays) {
					targetDayToQuery = daysDiff;
				}
				// (Case 2) 如果今天在行程开始前
				else if (daysDiff < 1) {
					targetDayToQuery = 1; // 始终查询第1天
				}
				// (Case 3) 如果今天在行程结束后 (修复你源码中的BUG)
				else {
					// (daysDiff > this.totalDays)
					targetDayToQuery = this.totalDays; // 始终查询最后1天
				}

				// (新) 统一调用 getLocationForDay
				if (targetDayToQuery > 0) {
					console.log('[获取今天位置] 开始智能查找，目标天数:', targetDayToQuery);
					const location = this.getLocationForDay(targetDayToQuery); // <-- 调用你添加的新函数
					if (location) {
						return location; // 找到了！
					}
				}

				// (Fallback) 如果智能查找都失败了
				console.log('[获取今天位置] 智能查找失败，使用默认位置');
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
				startDate.setHours(0, 0, 0, 0);
				const startDateStr = this.formatDateString(startDate);

				console.log('[获取明天位置] 行程开始日期:', startDateStr);

				// 计算明天是行程的第几天
				const tomorrowDate = new Date(tomorrowDateStr);
				const daysDiff = Math.floor((tomorrowDate - startDate) / (24 * 60 * 60 * 1000)) + 1;

				console.log('[获取明天位置] 明天是行程第', daysDiff, '天');

				// 如果明天在行程范围内，使用对应天数的位置
				// if (daysDiff >= 1 && daysDiff <= this.totalDays) {
				// 	const dayData = this.fullItinerary.itinerary.find((item) => item.day === daysDiff);
				// 	if (dayData && dayData.day_title) {
				// 		console.log('[获取明天位置] 找到明天的行程:', dayData.day_title);
				// 		return this.extractLocationFromRoute(dayData.day_title);
				// 	}
				// }

				// // 如果明天超出行程范围，使用最后一天的位置
				// const lastDayData = this.fullItinerary.itinerary.find((item) => item.day === this.totalDays);
				// if (lastDayData && lastDayData.day_title) {
				// 	console.log('[获取明天位置] 使用最后一天的位置:', lastDayData.day_title);
				// 	return this.extractLocationFromRoute(lastDayData.day_title);
				// }

				let targetDayToQuery = 0; // 我们要查询的目标天数

				// (Case 1) 如果明天在行程范围内
				if (daysDiff >= 1 && daysDiff <= this.totalDays) {
					targetDayToQuery = daysDiff;
				}
				// (Case 2) 如果明天在行程开始前
				else if (daysDiff < 1) {
					targetDayToQuery = 1; // 始终查询第1天
				}
				// (Case 3) 如果明天在行程结束后 (这部分你原代码是正确的)
				else {
					// (daysDiff > this.totalDays)
					targetDayToQuery = this.totalDays; // 始终查询最后1天
				}

				// (新) 统一调用 getLocationForDay
				if (targetDayToQuery > 0) {
					console.log('[获取明天位置] 开始智能查找，目标天数:', targetDayToQuery);
					const location = this.getLocationForDay(targetDayToQuery); // <-- 调用你添加的新函数
					if (location) {
						return location; // 找到了！
					}
				}

				// (Fallback) 如果智能查找都失败了
				console.log('[获取明天位置] 智能查找失败，使用默认位置');
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
				if (Array.isArray(dayData.activities)) {
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

				const routeParts = routeTitle.split('【');
				if (routeParts.length > 1) {
					// 获取行程句子
					let itin_phrase = routeParts[1].trim().slice(0, -2);
					console.log('[路线位置提取] 路线拆分行程句子:', itin_phrase);

					const phraseParts = itin_phrase.split('-');
					const destination = phraseParts[phraseParts.length - 1].trim();

					// 清理括号内容，例如 "桃花的酒店(索松店)" -> "索松店"
					// 这有助于提取括号内的真实落脚点
					// const bracketMatch = destination.match(/[\(（]([^)]+)[\)）]/);
					// if (bracketMatch && bracketMatch[1]) {
					// 	destination = bracketMatch[1];
					// 	console.log('[路线位置提取] 提取落脚地点:', destination);
					// }

					// 如果目的地是明确的地名，返回
					const symbolsRegex = /[()\[\]\\/.-]/;
					if (destination && destination.length > 0 && destination.length <= 15 && !symbolsRegex.test(destination)) {
						console.log('[路线位置提取] 拆分法提取目的地:', destination);

						// (新) 特殊处理，如果提取到的是 "索松村" 或 "南迦巴瓦", 返回 "林芝"
						// 因为 "索松村" 本身天气 API 可能不支持，但 "林芝" 肯定支持。
						if (
							destination.includes('索松') ||
							destination.includes('南迦巴瓦') ||
							destination.includes('鲁朗') ||
							destination.includes('巴松措') ||
							destination.includes('雅鲁藏布')
						) {
							console.log('[路线位置提取] 目的地含索松村等地名，返回 "林芝"');
							return '林芝';
						}

						return destination;
					}
				}

				const tibetKeywords = ['索松村', '南迦巴瓦', '鲁朗', '巴松措', '羊湖', '纳木措', '阿里', '那曲', '山南', '日喀则', '林芝', '拉萨', '昌都', '雅鲁藏布'];

				for (const keyword of tibetKeywords) {
					// 遍历顺序很重要
					if (routeTitle.includes(keyword)) {
						console.log('[路线位置提取] 检测到西藏地名:', keyword);

						// (新) 统一返回城市，而不是村
						if (keyword === '索松村' || keyword === '南迦巴瓦' || keyword === '鲁朗' || keyword === '巴松措' || keyword === '雅鲁藏布') {
							return '林芝';
						}
						// (新) 检查是否能确定具体城市 (倒序检查)
						if (keyword === '阿里') return '阿里';
						if (keyword === '那曲') return '那曲';
						if (keyword === '山南') return '山南';
						if (keyword === '日喀则') return '日喀则';
						if (keyword === '林芝') return '林芝';
						if (keyword === '昌都') return '昌都';
						if (keyword === '拉萨') return '拉萨';

						// 如果匹配了 羊湖、纳木措 但没匹配城市，会继续循环直到匹配到 拉萨/山南 等
					}
				}

				const cityRegex =
					/(北京|上海|广州|深圳|杭州|南京|苏州|成都|重庆|西安|武汉|长沙|郑州|济南|青岛|大连|沈阳|哈尔滨|长春|石家庄|太原|呼和浩特|银川|西宁|乌鲁木齐|拉萨|昆明|贵阳|南宁|海口|三亚|福州|厦门|南昌|合肥|兰州|林芝|日喀则|山南|那曲|阿里|昌都)/g;
				const matches = routeTitle.match(cityRegex);

				if (matches && matches.length > 0) {
					const lastMatch = matches[matches.length - 1]; // (新) 获取最后一个匹配
					console.log('[路线位置提取] 提取到最后一个城市名称:', lastMatch);
					return lastMatch;
				}

				// 针对西藏地区的特殊处理
				// 示例：独立包车丨拉萨-江河汇流-雅鲁藏布大峡谷-南迦巴瓦峰-索松村

				// 1. 检查是否包含西藏特色地名
				// const tibetKeywords = ['拉萨', '林芝', '日喀则', '山南', '那曲', '阿里', '昌都', '雅鲁藏布', '南迦巴瓦', '索松村', '鲁朗', '巴松措', '羊湖', '纳木措'];
				// for (const keyword of tibetKeywords) {
				// 	if (routeTitle.includes(keyword)) {
				// 		console.log('[路线位置提取] 检测到西藏地名:', keyword);

				// 		// 如果包含索松村或南迦巴瓦峰，使用完整路线信息进行搜索
				// 		if (routeTitle.includes('索松村') || routeTitle.includes('南迦巴瓦')) {
				// 			// 提取路线的关键部分
				// 			const routeMatch = routeTitle.match(/拉萨[-\s]*江河汇流[-\s]*雅鲁藏布大峡谷[-\s]*南迦巴瓦峰[-\s]*索松村/);
				// 			if (routeMatch) {
				// 				console.log('[路线位置提取] 提取到完整路线:', routeMatch[0]);
				// 				return '拉萨-雅鲁藏布大峡谷-南迦巴瓦峰-索松村';
				// 			}

				// 			// 如果没有完整匹配，使用索松村+林芝的组合
				// 			if (routeTitle.includes('索松村')) {
				// 				console.log('[路线位置提取] 使用索松村林芝组合');
				// 				return '西藏林芝索松村';
				// 			}
				// 		}

				// 		// 检查是否能确定具体城市
				// 		if (keyword === '拉萨') return '拉萨';
				// 		if (keyword === '林芝' || routeTitle.includes('雅鲁藏布') || routeTitle.includes('南迦巴瓦') || routeTitle.includes('索松村')) {
				// 			return '林芝';
				// 		}
				// 		if (keyword === '日喀则') return '日喀则';
				// 		if (keyword === '山南') return '山南';
				// 		if (keyword === '那曲') return '那曲';
				// 		if (keyword === '阿里') return '阿里';
				// 		if (keyword === '昌都') return '昌都';
				// 	}
				// }

				// // 2. 通用城市名称提取
				// const cityMatch = routeTitle.match(
				// 	/(北京|上海|广州|深圳|杭州|南京|苏州|成都|重庆|西安|武汉|长沙|郑州|济南|青岛|大连|沈阳|哈尔滨|长春|石家庄|太原|呼和浩特|银川|西宁|乌鲁木齐|拉萨|昆明|贵阳|南宁|海口|三亚|福州|厦门|南昌|合肥|兰州|林芝|日喀则|山南|那曲|阿里|昌都)/
				// );
				// if (cityMatch) {
				// 	console.log('[路线位置提取] 提取到城市名称:', cityMatch[1]);
				// 	return cityMatch[1];
				// }

				// // 3. 如果是路线格式，提取目的地
				// const routeParts = routeTitle.split(/[-－丨|]/);
				// if (routeParts.length > 1) {
				// 	// 获取最后一个地点作为目的地
				// 	const destination = routeParts[routeParts.length - 1].trim();
				// 	console.log('[路线位置提取] 路线目的地:', destination);

				// 	// 如果目的地是明确的地名，返回
				// 	if (destination && destination.length <= 10) {
				// 		return destination;
				// 	}
				// }

				console.log('[路线位置提取] 未能从路线中提取有效位置');
				return null;
			} catch (error) {
				console.error('[路线位置提取] 路线位置提取失败:', error);
				return null;
			}
		},

		// 智能获取指定天数的位置，如果当天没有，则向前回溯
		getLocationForDay(targetDay) {
			console.log('[智能查找] 开始查找第', targetDay, '天或之前的位置');

			if (!this.fullItinerary || !this.fullItinerary.itinerary) {
				console.log('[智能查找] 没有行程数据');
				return null;
			}

			// 从目标天数开始，向前循环 (e.g. targetDay=5, 循环 5, 4, 3, 2, 1)
			for (let i = targetDay; i >= 1; i--) {
				const dayData = this.fullItinerary.itinerary.find((item) => item.day === i);

				// 检查当天的数据和标题是否存在
				if (dayData && dayData.day_title) {
					// 尝试解析这一天的位置
					const location = this.extractLocationFromRoute(dayData.day_title);

					// 如果解析成功 (location 不是 null, undefined, 或 "")
					if (location) {
						console.log('[智能查找] 成功！在第', i, '天找到位置:', location, '(目标天数:', targetDay, ')');
						return location; // 立即返回找到的位置
					}

					// 如果 location 为空 (解析失败)，循环会继续 (i--)，尝试前一天
					console.log('[智能查找] 第', i, '天标题解析失败 (', dayData.day_title, ')，尝试前一天...');
				}
			}

			// 如果循环结束 (i=0) 还没找到任何位置
			console.log('[智能查找] 无法在第', targetDay, '天或之前找到任何有效位置');
			return null;
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

		// 联系管家
		contactSupport() {
			console.log('[联系管家] 用户点击');
			if (!this.attendantPhone) {
				uni.showToast({
					title: '暂未分配管家',
					icon: 'none'
				});
				return;
			}

			uni.showModal({
				title: '联系管家',
				content: `确定要拨打管家电话吗？\n号码：${this.attendantPhone} `,
				success: (res) => {
					if (res.confirm) {
						console.log('[联系管家] 用户确认拨打电话');
						uni.makePhoneCall({
							phoneNumber: this.attendantPhone, // 动态号码
							success: () => {
								console.log('[联系管家] 拨打电话成功');
							},
							fail: (error) => {
								console.error('[联系管家] 拨打电话失败:', error);
							}
						});
					} else {
						console.log('[联系管家] 用户取消拨打电话');
					}
				}
			});
		},

		// 联系向导
		contactGuide() {
			console.log('[联系向导] 用户点击');
			if (!this.guidePhone) {
				uni.showToast({
					title: '暂未分配向导',
					icon: 'none'
				});
				return;
			}

			uni.showModal({
				title: '联系向导',
				content: `确定要拨打向导电话吗？\n号码：${this.guidePhone} `,
				success: (res) => {
					if (res.confirm) {
						console.log('[联系向导] 用户确认拨打电话');
						uni.makePhoneCall({
							phoneNumber: this.guidePhone, // 动态号码
							success: () => {
								console.log('[联系向导] 拨打电话成功');
							},
							fail: (error) => {
								console.error('[联系向导] 拨打电话失败:', error);
							}
						});
					} else {
						console.log('[联系向导] 用户取消拨打电话');
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

				// 1. 获取目标元素的位置信息（相对于视窗）
				query.select(`#${elementId}`).boundingClientRect();

				// 2. 获取当前视窗的滚动信息
				query.selectViewport().scrollOffset();

				// query
				// 	.select(`#${elementId}`)
				// 	.boundingClientRect((data) => {
				// 		if (data) {
				// 			console.log('[滚动定位] 元素位置信息:', data);

				// 			// 计算滚动位置：元素顶部位置 - 留出的缓冲空间
				// 			const scrollTop = Math.max(0, data.top - 120); // 留出120px的缓冲空间

				// 			console.log('[滚动定位] 执行滚动到位置:', scrollTop);

				// 			// 执行滚动
				// 			uni.pageScrollTo({
				// 				scrollTop: scrollTop,
				// 				duration: 800
				// 			});
				// 		} else {
				// 			console.log('[滚动定位] 未找到目标元素，使用估算方法');
				// 			this.scrollToTimelineItemByEstimate(itemIndex);
				// 		}
				// 	})
				// 	.exec();

				query.exec((res) => {
					// res[0] 是 elementId.boundingClientRect 的结果
					// res[1] 是 selectViewport.scrollOffset 的结果

					if (!res[0]) {
						console.log('[滚动定位] 未找到目标元素，使用估算方法');
						this.scrollToTimelineItemByEstimate(itemIndex);
						return;
					}

					if (!res[1]) {
						console.log('[滚动定位] 未能获取到视窗信息，使用估算方法');
						this.scrollToTimelineItemByEstimate(itemIndex);
						return;
					}

					const elementInfo = res[0];
					const viewportInfo = res[1];

					console.log('[滚动定位] 元素位置信息:', elementInfo);
					console.log('[滚动定位] 视窗滚动信息:', viewportInfo);

					// 核心计算：
					// 目标滚动位置 = 当前视窗的 scrollTop + 元素相对于视窗的 top - 缓冲空间
					const targetScrollTop = viewportInfo.scrollTop + elementInfo.top - 120; // 120px的缓冲空间

					console.log(`[滚动定位] 计算目标: ${viewportInfo.scrollTop} (current) + ${elementInfo.top} (element) - 120 (offset) = ${targetScrollTop}`);

					// 执行滚动
					uni.pageScrollTo({
						scrollTop: Math.max(0, targetScrollTop), // 确保不为负数
						duration: 800
					});
				});
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
		},

		// 点击 POI 链接时调用
		async openPoiPopup(poiId) {
			if (!poiId) return;
			this.popupContent = '<div style="padding: 15px;"><p>正在加载...</p></div>';
			this.currentPoiMedia = [];
			this.isSwiperAutoplay = true; // 重置 swiper 状态
			this.currentSwiperSlide = 0;
			this.swiperHeight = '400rpx';

			await this.fetchPoiDetails(poiId);

			this.$nextTick(() => {
				if (this.currentPoiMedia.length > 0) {
					this.updateSwiperHeight(0);
				}

				// 打开弹窗
				this.$refs.tipsPopup.open();

				// 检查 slide 0 是否为视频，如果是则在弹窗打开后播放
				if (this.currentPoiMedia.length > 0) {
					const firstMedia = this.currentPoiMedia[0];
					if (this.isVideoFile(firstMedia)) {
						// 延迟播放，等待弹窗动画结束
						setTimeout(() => {
							const videoCtx = uni.createVideoContext('video-0', this);
							if (videoCtx) {
								videoCtx.play();
							}
						}, 500); // 500ms 延迟
					}
				}
			});
		},

		// 从云函数获取 POI 详情
		async fetchPoiDetails(poiId) {
			try {
				const poiService = uniCloud.importObject('a-poi-service');
				const res = await poiService.getPoiDetails(poiId);

				if (res.errCode === 0 && res.data) {
					this.currentPoiMedia = res.data.media || [];
					console.log('currentPoiMedia', this.currentPoiMedia);
					// this.popupTitle = res.data.name; // 用POi名称设置弹窗标题
					this.popupContent = this.formatPoiToHtml(res.data);
				} else {
					throw new Error(res.errMsg || '未找到POI详情');
				}
			} catch (e) {
				console.error('fetchPoiDetails failed:', e);
				this.popupTitle = '加载失败';
				this.popupContent = `<p>加载POI详情失败: ${e.message}</p>`;
			}
		},

		// 将 POI JSON 数据格式化为 HTML 字符串
		formatPoiToHtml(poi) {
			// 我们自己控制 padding，因为 rich-content 已经被 noPadding="true"
			let html = '<div style="padding: 15px;">';

			// --- 1. Line 1: Category + Name ---
			html += '<div class="poi-line-1">';
			if (poi.category_name) {
				html += `<span class="poi-badge-cat">${poi.category_name}</span>`;
			}
			html += `<h1 class="poi-name">${poi.name}</h1>`;
			html += '</div>';

			// --- 2. Line 2: Region + Address ---
			html += '<div class="poi-line-2">';
			if (poi.region_names && poi.region_names.length > 0) {
				// 后端已反转数组 (父到子)，这里直接使用
				poi.region_names.forEach((name) => {
					html += `<span class="poi-badge-region">${name}</span>`;
				});
			}
			if (poi.address_text) {
				html += `<span class="poi-address">${poi.address_text}</span>`;
			}
			html += '</div>';

			// --- 3. Line 3: POI Tags ---
			if (poi.tag_names && poi.tag_names.length > 0) {
				html += '<div class="poi-line-3">';
				poi.tag_names.forEach((name) => {
					html += `<span class="poi-badge-tag">${name}</span>`;
				});
				html += '</div>';
			}

			// --- 4. 分隔线 ---
			if ((poi.tag_names && poi.tag_names.length > 0) || (poi.region_names && poi.region_names.length > 0)) {
				html += '<div class="poi-divider"></div>';
			}

			// --- 5. Description ---
			html += '<div class="poi-description">';
			html += poi.description || '<p>暂无详细介绍</p>';
			html += '</div>';

			html += '</div>'; // 关闭 padding div
			return html;
		},

		// 打开弹窗并触发内容加载
		async openTipsPopup(type) {
			// 根据类型设置标题
			// if (type === 'tips') {
			// 	this.popupTitle = '出行提示';
			// } else if (type === 'precautions') {
			// 	this.popupTitle = '注意事项';
			// } else if (type === 'must_read') {
			// 	this.popupTitle = '出行前必读';
			// }

			this.popupContent = '<p>正在加载...</p>';
			this.$refs.tipsPopup.open();

			await this.fetchPopupContent(type);
		},

		onMediaLoad(e, index, type) {
			// e.detail 在图片和视频事件中都包含 width 和 height
			const { width, height } = e.detail;

			if (!width || !height) return;

			// 计算宽高比
			const ratio = height / width;

			// 根据屏幕宽度 (750rpx) 计算自适应高度
			// 公式：高度 = 750 * (原高 / 原宽)
			let calcHeight = 750 * ratio;

			// 【关键】设置最大/最小高度限制
			// 最小 400rpx (防止横条太细)
			// 最大 1000rpx (防止竖图超出屏幕可视范围)
			const minHeight = 400;
			const maxHeight = 1000;

			if (calcHeight < minHeight) calcHeight = minHeight;
			if (calcHeight > maxHeight) calcHeight = maxHeight;

			// 将计算出的高度缓存到当前的 media 对象中
			// 这样下次滑回来时，不用重新计算
			this.$set(this.currentPoiMedia[index], '_calcHeight', calcHeight + 'rpx');

			// 如果当前正在展示这一页，立即更新 Swiper 高度
			if (index === this.currentSwiperSlide) {
				this.swiperHeight = calcHeight + 'rpx';
			}
		},

		onSwiperChange(e) {
			const newIndex = e.detail.current;
			const oldIndex = this.currentSwiperSlide;
			this.currentSwiperSlide = newIndex;

			this.updateSwiperHeight(newIndex);

			// 1. 暂停上一个 slide 的视频（如果存在）
			const oldMedia = this.currentPoiMedia[oldIndex];
			// (根据你的反馈，使用 extname)
			if (this.isVideoFile(oldMedia)) {
				const oldCtx = uni.createVideoContext('video-' + oldIndex, this);
				if (oldCtx) {
					oldCtx.pause();
				}
			}

			// 2. 自动播放当前 slide 的视频（如果存在）
			const newMedia = this.currentPoiMedia[newIndex];
			if (this.isVideoFile(newMedia)) {
				const newCtx = uni.createVideoContext('video-' + newIndex, this);
				if (newCtx) {
					newCtx.play(); // 播放将自动触发 onVideoPlay，暂停 swiper
				}
			}
		},

		updateSwiperHeight(index) {
			const media = this.currentPoiMedia[index];

			// 1. 如果这个资源已经加载过并计算了高度，直接使用
			if (media._calcHeight) {
				this.swiperHeight = media._calcHeight;
				return;
			}

			// 2. 如果还没加载完（或者第一次显示），使用默认策略
			if (this.isVideoFile(media)) {
				// 视频默认先给个 16:9 的高度，等 loadedmetadata 触发后再自动撑开
				this.swiperHeight = '422rpx';
			} else {
				// 图片默认高度
				this.swiperHeight = '400rpx';
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

		// 视频开始播放时触发
		onVideoPlay() {
			console.log('Video playing, pausing swiper.');
			this.isSwiperAutoplay = false; // 暂停 Swiper 轮播
		},

		// 视频暂停或结束时触发
		onVideoPause() {
			console.log('Video paused/ended, resuming swiper.');
			this.isSwiperAutoplay = true; // 恢复 Swiper 轮播
		},

		// 关闭弹窗
		closeTipsPopup() {
			this.$refs.tipsPopup.close();

			const currentMedia = this.currentPoiMedia[this.currentSwiperSlide];
			if (currentMedia && (currentMedia.extname.includes('mp4') || currentMedia.extname.includes('mov'))) {
				const videoCtx = uni.createVideoContext('video-' + this.currentSwiperSlide, this);
				if (videoCtx) {
					videoCtx.pause();
				}
			}

			this.currentPoiMedia = [];
			this.isSwiperAutoplay = true;
		},

		// 从数据库获取内容
		async fetchPopupContent(type) {
			try {
				const db = uniCloud.database();
				const res = await db.collection('a-region-content').where({ type: type }).get();
				if (res.result.data && res.result.data.length > 0) {
					const data = res.result.data[0];
					this.popupContent = `<div style="padding: 15px;">${data.content}</div>`;
				} else {
					this.popupContent = '<p style="padding: 15px;">未找到内容</p>';
				}
			} catch (e) {
				console.error(e);
				this.popupContent = '<p style="padding: 15px;">内容加载失败</p>';
			}
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
			// 可以在此添加让弹窗跟随手指移动的逻辑 (较复杂)
		},
		onDragEnd(e) {
			if (!this.isDragging) return;
			this.isDragging = false;

			const touch = e.changedTouches[0];
			const deltaY = touch.clientY - this.headerDragData.y; // 垂直滑动的距离
			const deltaTime = Date.now() - this.headerDragData.time; // 滑动时间

			// --- 判断为“用力下划” ---
			// 1. 必须是向下滑动 (deltaY > 0)
			// 2. 必须滑动了足够距离 (例如 > 50px)
			// 3. 必须足够快 (例如 < 300ms)
			const isForcefulSwipe = deltaY > 50 && deltaTime < 300;

			if (isForcefulSwipe) {
				this.closeTipsPopup(); // 调用您已有的关闭方法
			}
		},
		dummyAllow() {
			// 这个空函数是为了让 @touchmove.stop 生效
			return;
		},
		/**
		 * 监听内容区滚动
		 */
		onContentScroll(e) {
			// 判断是否滚动到了顶部 (小于5px都算顶部，增加容错)
			this.isContentAtTop = e.detail.scrollTop < 20;
		},

		/**
		 * 在内容区按下
		 */
		onContentTouchStart(e) {
			if (e.touches.length !== 1) return;
			this.contentDragData.y = e.touches[0].clientY;
			this.contentDragData.time = Date.now();
			this.isDragging = true;
		},

		/**
		 * 在内容区松开
		 */
		onContentTouchEnd(e) {
			if (!this.isDragging) return;
			this.isDragging = false;

			const touch = e.changedTouches[0];
			const deltaY = touch.clientY - this.contentDragData.y;
			const deltaTime = Date.now() - this.contentDragData.time;

			// 检查是否为快速下划
			const isForcefulSwipe = deltaY > 50 && deltaTime < 300;

			// (核心逻辑)
			// 必须是快速下划，*并且* 滚动条必须在最顶部
			if (isForcefulSwipe && this.isContentAtTop) {
				console.log('Swipe down on content top detected, closing popup.');
				this.closeTipsPopup();
			}
		},

		getEncodedUrl(url) {
			if (!url) return '';
			try {
				// 1. 先解码 (如果本身未编码，解码不会有副作用)
				// 2. 再编码 (确保中文和空格被正确处理)
				return encodeURI(decodeURI(url));
			} catch (e) {
				// 如果解码出错，说明格式极度异常，直接返回原样或做基础编码
				console.error('URL parsing error:', e);
				return encodeURI(url);
			}
		},

		isImageFile(file) {
			if (!file) return false;
			return !this.isVideoFile(file);
		},

		isVideoFile(file) {
			if (!file) return false;

			let ext = '';

			if (file.extname) {
				ext = file.extname.toLowerCase();
			} else if (file.url) {
				ext = file.url.split('.').pop().toLowerCase();
			}

			if (!ext) return false;

			const videoExts = ['mp4', 'mov', 'webm', 'ogg'];
			return videoExts.includes(ext);
		},

		handleRichTextLink(e) {
			console.log('[富文本点击] 捕获链接点击:', e);

			// 获取 href 属性
			// mp-html 的事件对象通常包含 href，有时在 detail 中，根据版本略有不同，做个兼容
			const href = e.href || (e.detail && e.detail.href);

			if (href && typeof href === 'string') {
				// 检查是否以 'poi:' 开头
				if (href.startsWith('poi:')) {
					// 提取 ID (去掉前4个字符 'poi:')
					const poiId = href.substring(4);

					console.log('[富文本点击] 识别到POI链接, ID:', poiId);

					if (poiId) {
						// 调用已有的打开弹窗方法
						this.openPoiPopup(poiId);
					}
				} else {
					// 如果是普通 http 链接，可以选择是否允许跳转
					// uni.navigateTo({ url: ... }) 或者复制链接等
					console.log('[富文本点击] 普通链接:', href);
				}
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
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	background-color: #f8f9fa;
	min-height: 100vh;
}
/* .page-container.stop-scrolling {
	height: 100vh;
	overflow: hidden;
} */

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
	background-color: #eb6d20;
	border-radius: 2px;
	transition: width 0.3s ease;
}

.exit-btn {
	flex: 0 0 auto;
	padding: 4px 10px;
	border-radius: 8px;
	font-size: 12px;
	white-space: nowrap;
	background-color: #eb6d20;
	color: white;
	box-shadow: 0 2px 8px rgba(235, 109, 32, 0.3);
}

.theme-card {
	display: inline-flex;
	flex-direction: row;
	align-items: center;
	justify-content: flex-start;
	padding: 10px 16px;
	border-radius: 12px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	border: 1px solid #f0f0f0;
	transition: transform 0.15s ease-out, filter 0.15s ease-out;
}

.theme-card-active {
	transform: scale(0.96);
	filter: brightness(0.92);
}

.theme-icon-wrapper {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 0;
	margin-right: 8px;
}
.theme-icon-wrapper .fa {
	font-size: 18px;
}

.theme-card-title {
	display: flex;
	flex-direction: column;
	font-size: 16px;
	font-weight: 600;
	color: #333;
	line-height: 1.3;
	letter-spacing: 1px;
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
	background-color: #fff8f3;
	color: #eb6d20;
	transition: all 0.2s ease;
}

.day-tab.active {
	background-color: #eb6d20;
	color: white;
	box-shadow: 0 2px 8px rgba(235, 109, 32, 0.3);
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
	border: 1px solid rgba(235, 109, 32, 0.1);
	transition: all 0.3s ease;
}

.location-name {
	font-weight: 500;
	color: #333;
}

.altitude {
	font-weight: 500;
	color: #eb6d20;
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
	background-color: #fff8f3;
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

.hotel-rating-icons {
	margin-left: 2px;
	font-size: 10px;
	color: #ff9500;
	vertical-align: middle;
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
	padding: 0 0px;
	text-align: center;
}

.empty-state-icon {
	width: 240rpx;
	height: 240rpx;
	background-color: #fff8f3;
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

.action-button {
	background-color: #eb6d20;
	color: white;
	border-radius: 24px;
	padding: 12px 24px;
	font-weight: 500;
	margin-top: 16px;
	box-shadow: 0 4px 12px rgba(235, 109, 32, 0.3);
	display: flex;
	align-items: center;
	justify-content: center;
}

.route-icon {
	width: 140rpx;
	height: 124rpx;
}

.search-icon {
	width: 24px;
	height: 24px;
	margin-right: 6px;
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

/* "胶囊"容器 */
.action-group {
	display: flex;
	align-items: center;
	background-color: rgba(255, 255, 255, 0.75);
	color: #555;
	backdrop-filter: blur(1px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	/* border: 1px solid rgba(0, 0, 0, 0.05); */
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 24px;
	overflow: hidden;
}

/* "胶囊"内部的单个按钮 */
.group-btn {
	padding: 12px 20px;
	font-weight: 500;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #555;
	transition: background-color 0.1s ease-out;
}

/* 按钮之间的垂直分割线 */
.action-divider {
	width: 1px;
	height: 16px;
	background-color: rgba(0, 0, 0, 0.1);
}

/* 按钮的 "按下" 状态 (使用 hover-class) */
.group-btn-active {
	background-color: rgba(0, 0, 0, 0.05);
}

.formatted-content {
	white-space: pre-wrap;
	display: block;
	word-break: break-all;
}

/* POI 链接样式 */
.poi-link {
	color: #007aff; /* iOS 蓝色 */
	text-decoration: underline;
	font-weight: 600; /* 让链接稍微加粗以示区别 */
}
/* 模拟按下的效果 */
.poi-link:active {
	color: #5856d6;
}

.poi-swiper-native {
	width: 100%;
	transition: height 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
	background-color: #000;
	flex-shrink: 0;
	margin-bottom: 10px;
}
.poi-swiper-image-native {
	width: 100%;
	height: 100%;
	background-color: #f8f9fa;
}

.poi-swiper-video-native {
	width: 100%;
	height: 100%;
}

/* POI 弹窗内容的样式 */
/* 使用 :deep() 穿透到 rich-content (mp-html) 组件内部 */
.tips-popup-content :deep(.poi-line-1) {
	display: flex;
	align-items: center;
	flex-wrap: wrap; /* 允许换行 */
	margin-bottom: 10px;
}
.tips-popup-content :deep(.poi-name) {
	font-size: 20px;
	font-weight: 600;
	color: #000;
	margin: 0; /* 重置 h1 默认边距 */
	margin-left: 8px;
	line-height: 1.3;
}
.tips-popup-content :deep(.poi-line-2) {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 6px; /* 徽章和地址之间的间距 */
	margin-bottom: 10px;
}
.tips-popup-content :deep(.poi-address) {
	font-size: 14px;
	color: #555;
	margin-left: 4px; /* 地址和徽章的间距 */
}
.tips-popup-content :deep(.poi-line-3) {
	display: flex;
	flex-wrap: wrap;
	gap: 6px; /* 标签之间的间距 */
}
.tips-popup-content :deep(.poi-swiper) {
	width: 100%;
	height: 200px; /* 轮播图高度 */
	border-radius: 8px;
	overflow: hidden;
	margin-bottom: 15px;
}
.tips-popup-content :deep(.poi-swiper-image),
.tips-popup-content :deep(.poi-swiper-video) {
	width: 100%;
	height: 100%;
}
.tips-popup-content :deep(video) {
	/* 确保视频也撑满 */
	width: 100%;
	height: 100%;
}
.tips-popup-content :deep(.poi-meta) {
	padding-bottom: 10px;
	border-bottom: 1px solid #f0f0f0;
	margin-bottom: 10px;
}
.tips-popup-content :deep(.poi-meta-item) {
	font-size: 14px;
	line-height: 1.8;
	display: flex;
	align-items: flex-start;
}
.tips-popup-content :deep(.poi-meta-label) {
	font-weight: 600;
	color: #333;
	flex-shrink: 0;
	margin-right: 8px;
	width: 40px; /* 标签对齐 */
}
.tips-popup-content :deep(.poi-meta-value) {
	color: #555;
	display: inline-flex;
	flex-wrap: wrap;
	gap: 4px; /* 徽章之间的间距 */
}
/* 元数据徽章样式 */
.tips-popup-content :deep(.poi-badge-cat) {
	background-color: #e0f2fe; /* blue-100 */
	color: #0c4a6e; /* blue-900 */
	padding: 3px 8px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 600;
	flex-shrink: 0;
}
.tips-popup-content :deep(.poi-badge-region) {
	background-color: #f0fdf4; /* green-50 */
	color: #166534; /* green-900 */
	padding: 2px 6px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;
}
.tips-popup-content :deep(.poi-badge-tag) {
	background-color: #fefce8; /* yellow-50 */
	color: #854d0e; /* yellow-900 */
	padding: 2px 6px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;
}
.tips-popup-content :deep(.poi-divider) {
	height: 1px;
	background-color: #f0f0f0;
	margin: 15px 0;
}
.tips-popup-content :deep(.poi-description) {
	padding-top: 10px;
}
/* 确保富文本中的 P 标签有正确样式 */
.tips-popup-content :deep(.poi-description p) {
	font-size: 15px;
	line-height: 1.7;
	color: #333;
	margin-bottom: 12px;
}
/* 确保富文本中的图片样式正确 */
.tips-popup-content :deep(.poi-description img) {
	max-width: 100%;
	height: auto;
	border-radius: 8px;
}

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

.tips-popup-title {
	font-size: 16px;
	font-weight: 600;
	color: #333;
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
	flex: 1; /* 占据头部以外的所有剩余空间 */
	min-height: 0; /* 修复 flex bug */
	position: relative; /* 确保 scroll-view 能在内部正确定位 */
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

uni-modal .uni-modal__bd {
	white-space: pre-wrap;
}

.bg-brand-orange {
	background-color: #eb6d20;
}
.text-brand-orange {
	color: #eb6d20;
}
.border-brand-orange {
	border-color: #eb6d20;
}
.bg-brand-orange-50 {
	background-color: #fff8f3;
}
.bg-brand-orange-100 {
	background-color: #fff0e6;
}
.bg-brand-orange-200 {
	background-color: #ffe0cc;
}
</style>
