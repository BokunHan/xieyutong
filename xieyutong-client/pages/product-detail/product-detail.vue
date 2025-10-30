<template>
	<view class="page-container">
		<view class="nav-bar">
			<view class="back-button" @click="goBack">
				<text class="fa fa-chevron-left"></text>
			</view>
			<view class="flex-1"></view>
		</view>

		<view v-if="loading" class="loading-container">
			<text class="loading-text">加载中...</text>
		</view>

		<view v-else-if="error" class="error-container">
			<text class="error-text">{{ error }}</text>
			<button @click="loadData" class="retry-button">重试</button>
		</view>

		<view v-else-if="selectedProduct" class="content-area">
			<view class="gallery-container" v-if="productData.product_images && productData.product_images.length > 0">
				<swiper
					:indicator-dots="true"
					:autoplay="true"
					:interval="3000"
					:duration="500"
					@change="onSwiperChange"
					class="swiper"
					:key="selectedProductId"
					:current="swiperCurrentIndex">
					<swiper-item v-for="(image, index) in productData.product_images" :key="index">
						<image :src="image" :alt="productData.title" class="w-full h-full" mode="aspectFill" />
					</swiper-item>
				</swiper>
				<view class="image-count">{{ currentImageIndex + 1 }}/{{ productData.product_images.length }}</view>
			</view>

			<view class="section">
				<view class="mb-3">
					<text class="text-xl font-semibold text-gray-800 block mb-2">{{ productData.title || '暂无标题' }}</text>
					<text class="text-sm text-gray-600 block">{{ productData.subtitle || '暂无描述' }}</text>
				</view>
				<view class="flex justify-between items-center mb-3">
					<view class="flex items-center">
						<text class="text-blue-500 font-medium mr-1">{{ (productData.rating || 0).toFixed(1) }}分</text>
						<view class="star-rating-container text-xs mr-2">
							<view class="stars-background text-gray-300">
								<text class="fa fa-star"></text>
								<text class="fa fa-star"></text>
								<text class="fa fa-star"></text>
								<text class="fa fa-star"></text>
								<text class="fa fa-star"></text>
							</view>
							<view class="stars-foreground text-yellow-400" :style="{ width: ((productData.rating || 0) / 5) * 100 + '%' }">
								<text class="fa fa-star"></text>
								<text class="fa fa-star"></text>
								<text class="fa fa-star"></text>
								<text class="fa fa-star"></text>
								<text class="fa fa-star"></text>
							</view>
						</view>
						<text class="text-gray-400 text-xs">({{ productData.review_count || 0 }}条评价)</text>
					</view>
					<text class="text-gray-400 text-xs">已售{{ productData.sales_count || 0 }}人</text>
				</view>
				<view class="action-buttons">
					<view class="action-button" @click="toggleFavorite">
						<text class="fa fa-heart action-icon" :class="isFavorite ? 'action-icon-active' : ''"></text>
						<text class="action-text" :class="isFavorite ? 'text-red-500' : ''">{{ isFavorite ? '已收藏' : '收藏' }}</text>
					</view>
					<!-- #ifdef MP-WEIXIN -->
					<button class="action-button" open-type="share" plain="true">
						<text class="fa fa-share-alt action-icon"></text>
						<text class="action-text">分享</text>
					</button>
					<!-- #endif -->

					<!-- #ifndef MP-WEIXIN -->
					<view class="action-button" @click="shareProduct">
						<text class="fa fa-share-alt action-icon"></text>
						<text class="action-text">分享</text>
					</view>
					<!-- #endif -->
				</view>
			</view>

			<view class="route-selection-section section" v-if="relatedProducts.length > 1">
				<scroll-view scroll-x="true" class="route-scroll-view">
					<view class="route-options-container">
						<view
							v-for="(routeProduct, index) in relatedProducts"
							:key="routeProduct.product._id"
							class="route-option"
							:class="{ selected: routeProduct.product._id === selectedProductId }"
							@click="selectRoute(routeProduct.product._id)">
							<view class="route-letter">{{ routeProduct.product.route_title || '未知线路' }}</view>
							<view class="route-price">¥{{ routeProduct.product.price || 'N/A' }}起</view>
							<view class="route-overview">
								<view v-if="routeProduct.product.route_overview?.transport" class="route-overview-item">
									<text class="fa fa-plane route-icon"></text>
									{{ routeProduct.product.route_overview.transport }}
								</view>
								<view v-if="routeProduct.product.route_overview?.accommodation" class="route-overview-item">
									<text class="fa fa-hotel route-icon"></text>
									{{ routeProduct.product.route_overview.accommodation }}
								</view>
								<view v-if="routeProduct.product.route_overview?.spots" class="route-overview-item">
									<text class="fa fa-map-marker-alt route-icon"></text>
									{{ routeProduct.product.route_overview.spots }}
								</view>
								<view v-if="routeProduct.product.route_overview?.meals" class="route-overview-item">
									<text class="fa fa-utensils route-icon"></text>
									{{ routeProduct.product.route_overview.meals }}
								</view>
								<view v-if="routeProduct.product.route_overview?.activities" class="route-overview-item">
									<text class="fa fa-hiking route-icon"></text>
									{{ routeProduct.product.route_overview.activities }}
								</view>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>
			<view class="section" v-if="productData.detail_images && productData.detail_images.length > 0">
				<text class="section-title">产品特色</text>
				<view class="product-detail-images">
					<image v-for="(image, index) in productData.detail_images" :key="index" :src="image" :alt="`产品特色${index + 1}`" class="w-full rounded-lg mb-3" mode="widthFix" />
				</view>
			</view>

			<view class="section">
				<view class="flex justify-between items-center mb-4">
					<view class="flex items-center">
						<text class="section-title mb-0! mr-2">评价</text>
						<text class="text-blue-500 font-medium mr-1">{{ (productData.rating || 0).toFixed(1) }}</text>
						<view class="star-rating-container text-xs mr-1">
							<view class="stars-background text-gray-300">
								<text class="fa fa-star"></text>
								<text class="fa fa-star"></text>
								<text class="fa fa-star"></text>
								<text class="fa fa-star"></text>
								<text class="fa fa-star"></text>
							</view>
							<view class="stars-foreground text-yellow-400" :style="{ width: ((productData.rating || 0) / 5) * 100 + '%' }">
								<text class="fa fa-star"></text>
								<text class="fa fa-star"></text>
								<text class="fa fa-star"></text>
								<text class="fa fa-star"></text>
								<text class="fa fa-star"></text>
							</view>
						</view>
					</view>
					<view class="flex items-center text-sm cursor-pointer" @click="navigateToReviews">
						<text>{{ productData.review_count || 0 }}条评价</text>
						<text class="fa fa-chevron-right ml-1 text-xs"></text>
					</view>
				</view>

				<view class="border-t border-gray-100 pt-4">
					<view v-if="firstReview" @click="navigateToReviews" class="cursor-pointer">
						<view class="flex items-center justify-between mb-3">
							<view class="flex items-center">
								<image :src="firstReview.user_avatar" class="w-10 h-10 rounded-full mr-3" mode="aspectFill" />
								<view>
									<text class="text-sm font-medium text-gray-800 block">{{ firstReview.user_name || '匿名用户' }}</text>
									<view class="flex items-center mt-1">
										<text class="text-xs bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded-sm mr-1" style="font-weight: 500">
											😆 {{ (firstReview.rating || 0).toFixed(1) }}分 好评
										</text>
									</view>
								</view>
							</view>
						</view>

						<view class="mb-3">
							<text class="text-gray-700 text-sm leading-relaxed review-content-truncate">
								{{ firstReview.content }}
							</text>
						</view>

						<view v-if="firstReview.images && firstReview.images.length > 0" class="grid grid-cols-4 gap-2">
							<image
								v-for="(img, index) in firstReview.images.slice(0, 4)"
								:key="index"
								:src="img"
								class="w-full h-20 rounded-lg object-cover"
								mode="aspectFill"
								@click="previewReviewImage(index)" />
						</view>
					</view>

					<view v-else class="border-t border-gray-100 pt-4">
						<view class="text-center text-gray-400"><text class="text-sm">暂无评价</text></view>
					</view>
				</view>
			</view>

			<view class="section" v-if="itineraryData && itineraryData.itinerary && itineraryData.itinerary.length > 0">
				<text class="section-title">行程概览</text>
				<view class="itinerary-overview-list">
					<view class="itinerary-overview-item" v-for="(day, index) in itineraryData.itinerary" :key="index">
						<view class="itinerary-day-header">
							<view class="day-number">
								<text class="day-text">Day {{ day.day }}</text>
							</view>
							<view class="day-title-content">
								<text class="day-title-text">{{ day.day_title || '暂无安排' }}</text>
							</view>
						</view>
					</view>
				</view>
				<view class="itinerary-notes">
					<text class="note-item">① 行程时间均为当地时间</text>
					<text class="note-item">② 酒店钻级由携程平台评定,具体评定标准可见携程平台酒店频道</text>
					<text class="note-item">③ 预订过程中不可选择的酒店将以旅行社统一安排为准</text>
					<text class="note-item">④ 景点图片仅供参考</text>
				</view>
				<view class="text-center mt-4">
					<button class="view-full-itinerary-btn" @click="viewFullItinerary">
						<text class="fa fa-route mr-2"></text>
						查看详细行程安排
						<text class="fa fa-chevron-right ml-2"></text>
					</button>
				</view>
			</view>

			<view class="accordion-wrapper">
				<view class="accordion-item" v-if="productData.features && productData.features.length > 0">
					<view class="accordion-header p-4 flex justify-between items-center" @click="toggleAccordion('highlights')">
						<text class="section-title mb-0 font-medium text-gray-800">行程亮点</text>
						<text :class="accordionState.highlights ? 'fa fa-chevron-up' : 'fa fa-chevron-down'" class="text-gray-400"></text>
					</view>
					<view class="accordion-content p-4 pt-0" v-if="accordionState.highlights">
						<view class="feature-item" v-for="(feature, index) in productData.features" :key="index">
							<view class="feature-icon"><text class="fa fa-star"></text></view>
							<view>
								<text class="text-gray-800 block">{{ feature }}</text>
							</view>
						</view>
					</view>
				</view>

				<view class="accordion-item" v-if="productData.overview && Object.keys(productData.overview).length > 0">
					<view class="accordion-header p-4 flex justify-between items-center" @click="toggleAccordion('overview')">
						<text class="section-title mb-0 font-medium text-gray-800">线路总览</text>
						<text :class="accordionState.overview ? 'fa fa-chevron-up' : 'fa fa-chevron-down'" class="text-gray-400"></text>
					</view>
					<view class="accordion-content p-4 pt-0" v-if="accordionState.overview">
						<view class="grid grid-cols-1 gap-3">
							<view class="bg-blue-50 rounded-lg p-3" v-if="productData.overview.guide">
								<text class="text-xs text-gray-500 mb-1 block">导游</text>
								<view v-for="(sentence, index) in productData.overview.guide.split(';')" :key="index">
									<text v-if="sentence.trim()" class="text-sm block mt-3">{{ sentence.trim() }}</text>
								</view>
							</view>
							<view class="bg-blue-50 rounded-lg p-3" v-if="productData.overview.transport">
								<text class="text-xs text-gray-500 mb-1 block">交通</text>
								<view v-for="(sentence, index) in productData.overview.transport.split(';')" :key="index">
									<text v-if="sentence.trim()" class="text-sm block mt-3">{{ sentence.trim() }}</text>
								</view>
							</view>
							<view class="bg-blue-50 rounded-lg p-3" v-if="productData.overview.activities">
								<text class="text-xs text-gray-500 mb-1 block">活动</text>
								<view v-for="(sentence, index) in productData.overview.activities.split(';')" :key="index">
									<text v-if="sentence.trim()" class="text-sm block mt-3">{{ sentence.trim() }}</text>
								</view>
							</view>
							<view class="bg-blue-50 rounded-lg p-3" v-if="productData.overview.accommodation">
								<text class="text-xs text-gray-500 mb-1 block">住宿</text>
								<view v-for="(sentence, index) in productData.overview.accommodation.split(';')" :key="index">
									<text v-if="sentence.trim()" class="text-sm block mt-3">{{ sentence.trim() }}</text>
								</view>
							</view>
							<view class="bg-blue-50 rounded-lg p-3" v-if="productData.overview.meals">
								<text class="text-xs text-gray-500 mb-1 block">餐食</text>
								<view v-for="(sentence, index) in productData.overview.meals.split(';')" :key="index">
									<text v-if="sentence.trim()" class="text-sm block mb-3">{{ sentence.trim() }}</text>
								</view>
							</view>
						</view>
					</view>
				</view>

				<view class="accordion-item" v-if="productData.cost_info && Object.keys(productData.cost_info).length > 0">
					<view class="accordion-header p-4 flex justify-between items-center" @click="toggleAccordion('cost')">
						<text class="section-title mb-0 font-medium text-gray-800">费用说明</text>
						<text :class="accordionState.cost ? 'fa fa-chevron-up' : 'fa fa-chevron-down'" class="text-gray-400"></text>
					</view>
					<view class="accordion-content p-4 pt-0" v-if="accordionState.cost">
						<view class="mb-3" v-if="productData.cost_info.transport">
							<text class="font-medium text-gray-800 mb-1 block">交通:</text>
							<text class="text-gray-600 text-sm">{{ productData.cost_info.transport }}</text>
						</view>
						<view class="mb-3" v-if="productData.cost_info.accommodation">
							<text class="font-medium text-gray-800 mb-1 block">住宿:</text>
							<text class="text-gray-600 text-sm">{{ productData.cost_info.accommodation }}</text>
						</view>
						<view class="mb-3" v-if="productData.cost_info.meals">
							<text class="font-medium text-gray-800 mb-1 block">餐食:</text>
							<text class="text-gray-600 text-sm">{{ productData.cost_info.meals }}</text>
						</view>
						<view class="mb-3" v-if="productData.cost_info.tickets">
							<text class="font-medium text-gray-800 mb-1 block">门票:</text>
							<text class="text-gray-600 text-sm">{{ productData.cost_info.tickets }}</text>
						</view>
						<view v-if="productData.cost_info.service">
							<text class="font-medium text-gray-800 mb-1 block">服务:</text>
							<text class="text-gray-600 text-sm">{{ productData.cost_info.service }}</text>
						</view>
					</view>
				</view>

				<view class="accordion-item">
					<view class="accordion-header p-4 flex justify-between items-center" @click="toggleAccordion('booking')">
						<text class="section-title mb-0 font-medium text-gray-800">预订须知</text>
						<text :class="accordionState.booking ? 'fa fa-chevron-up' : 'fa fa-chevron-down'" class="text-gray-400"></text>
					</view>
					<view class="accordion-content p-0" v-if="accordionState.booking">
						<view class="booking-note-item" @click="navigateToBookingPolicies()">
							<view class="booking-note-icon-wrapper bg-blue-100">
								<text class="fa fa-user-minus text-blue-500"></text>
							</view>
							<view class="booking-note-content">
								<text class="booking-note-title">预订限制</text>
								<text class="booking-note-subtitle">年龄限制、人群限制、其他限制</text>
							</view>
							<text class="fa fa-chevron-right text-gray-400"></text>
						</view>

						<view class="booking-note-item" @click="navigateToBookingPolicies()">
							<view class="booking-note-icon-wrapper bg-teal-100">
								<text class="fa fa-bed text-teal-500"></text>
							</view>
							<view class="booking-note-content">
								<text class="booking-note-title">单人/多人入住政策</text>
								<text class="booking-note-subtitle">多人入住</text>
							</view>
							<text class="fa fa-chevron-right text-gray-400"></text>
						</view>

						<view class="booking-note-item" @click="navigateToBookingPolicies()">
							<view class="booking-note-icon-wrapper bg-indigo-100">
								<text class="fa fa-users text-indigo-500"></text>
							</view>
							<view class="booking-note-content">
								<text class="booking-note-title">成团说明</text>
								<text class="booking-note-subtitle">成团说明、出团通知</text>
							</view>
							<text class="fa fa-chevron-right text-gray-400"></text>
						</view>

						<view class="booking-note-item" @click="navigateToBookingPolicies()">
							<view class="booking-note-icon-wrapper bg-orange-100">
								<text class="fa fa-exclamation-circle text-orange-500"></text>
							</view>
							<view class="booking-note-content">
								<text class="booking-note-title">违约条款</text>
							</view>
							<text class="fa fa-chevron-right text-gray-400"></text>
						</view>

						<view class="booking-note-item" @click="navigateToBookingPolicies()">
							<view class="booking-note-icon-wrapper bg-purple-100">
								<text class="fa fa-suitcase-rolling text-purple-500"></text>
							</view>
							<view class="booking-note-content">
								<text class="booking-note-title">预订及出行须知</text>
							</view>
							<text class="fa fa-chevron-right text-gray-400"></text>
						</view>

						<view class="booking-note-item" @click="navigateToBookingPolicies()">
							<view class="booking-note-icon-wrapper bg-green-100">
								<text class="fa fa-bell text-green-500"></text>
							</view>
							<view class="booking-note-content">
								<text class="booking-note-title">保障提示</text>
							</view>
							<text class="fa fa-chevron-right text-gray-400"></text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="bottom-bar" v-if="selectedProduct">
			<view class="price-info-container mr-4" @click="showPriceModal">
				<view class="flex items-center">
					<view class="flex flex-col">
						<view class="flex items-center">
							<text class="text-lg font-semibold text-orange-500">¥{{ finalPrice }}</text>
							<text class="text-xs font-normal text-orange-500">/人起</text>
							<text class="ml-1 bg-orange-100 text-orange-500 text-xs px-1-5 py-0-5 rounded-sm" v-if="totalSavings > 0">已减¥{{ totalSavings }}</text>
						</view>
						<view class="flex items-center" v-if="originalPrice > finalPrice">
							<text class="text-xs text-gray-400 line-through mr-1">原价¥{{ originalPrice }}</text>
							<text class="text-xs text-red-500">省¥{{ totalSavings }}</text>
						</view>
					</view>
				</view>
			</view>
			<button class="book-button" @click="bookNow">立即预订</button>
		</view>

		<date-picker
			:show="showDateModal"
			:value="selectedDate"
			:min-date="datePickerStart"
			:max-date="datePickerEnd"
			title="选择出发日期"
			@confirm="onDateConfirm"
			@cancel="onDateCancel" />

		<view v-if="showPriceDetail" class="price-modal-overlay" @click="hidePriceModal">
			<view class="price-modal" @click.stop>
				<view class="modal-header">
					<text class="modal-title">价格计算明细</text>
					<view class="close-button" @click="hidePriceModal"><text class="fa fa-times"></text></view>
				</view>
				<view class="modal-content">
					<view class="price-section">
						<view class="price-row">
							<text class="price-label">成人原价</text>
							<text class="price-value original-price">¥{{ originalPrice }}</text>
						</view>
						<view class="price-row" v-if="productData.child_price">
							<text class="price-label">儿童原价</text>
							<text class="price-value original-price">¥{{ productData.child_price }}</text>
						</view>
					</view>
					<view class="discount-section">
						<view class="discount-row" v-if="memberDiscount > 0">
							<view class="discount-left">
								<text class="discount-label">{{ memberLevelText }}折扣</text>
								<text class="discount-badge">{{ memberLevelText }}</text>
							</view>
							<text class="discount-amount">-¥{{ memberDiscount }}</text>
						</view>
						<view class="discount-row" v-if="couponDiscount > 0">
							<view class="discount-left">
								<text class="discount-label">优惠券</text>
								<text class="discount-badge coupon-badge">{{ selectedCoupon ? selectedCoupon.name : '' }}</text>
							</view>
							<text class="discount-amount">-¥{{ couponDiscount }}</text>
						</view>
						<view class="coupon-selector" @click="selectCoupon" v-if="!selectedCoupon && availableCoupons.length > 0">
							<text class="coupon-selector-text">选择优惠券</text>
							<text class="fa fa-chevron-right coupon-selector-arrow"></text>
						</view>
					</view>
					<view class="price-divider"></view>
					<view class="final-price-section">
						<view class="final-price-row">
							<text class="final-price-label">优惠后价格</text>
							<view class="final-price-container">
								<text class="final-price">¥{{ finalPrice }}</text>
								<text class="savings" v-if="totalSavings > 0">已省¥{{ totalSavings }}</text>
							</view>
						</view>
					</view>
					<view class="price-note"><text class="note-text">* 最终价格以下单时为准</text></view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import DatePicker from '@/components/date-picker/date-picker.vue';

export default {
	components: {
		DatePicker
	},
	data() {
		return {
			// 页面状态
			loading: true,
			error: null,
			mainProductId: '', // 主商品ID (从 onLoad 获取)
			mainCtripId: '',

			// UI状态
			currentImageIndex: 0,
			swiperCurrentIndex: 0,
			isFavorite: false,
			favoriteId: '',
			showPriceDetail: false,
			showDateModal: false,
			selectedDate: '',

			// 折叠状态
			accordionState: {
				highlights: false,
				overview: false,
				cost: false,
				booking: false
			},

			// 数据
			relatedProducts: [], // 存储所有相关产品 { product: {}, itinerary: {} }
			selectedProductId: null, // 当前选中的产品 _id
			firstReview: null,

			// 价格计算相关 (保持不变)
			userMemberLevel: 'gold',
			availableCoupons: [
				{ id: 'coupon1', name: '新用户专享', amount: 200, type: 'fixed' },
				{ id: 'coupon2', name: '会员专享', amount: 0.88, type: 'percent' } // 88折
			],
			selectedCoupon: { id: 'coupon1', name: '新用户专享', amount: 200, type: 'fixed' }
		};
	},

	computed: {
		// 当前选中的产品对象
		selectedProduct() {
			return this.relatedProducts.find((p) => p.product._id === this.selectedProductId) || null;
		},
		// 当前选中的产品数据 (用于模板绑定)
		productData() {
			return this.selectedProduct ? this.selectedProduct.product : {};
		},
		// 当前选中的行程数据 (用于模板绑定)
		itineraryData() {
			// 确保在 selectedProduct 或其 itinerary 不存在时返回默认结构
			return this.selectedProduct?.itinerary || { itinerary: [] };
		},

		// --- 价格计算属性 (现在依赖 selectedProduct) ---
		originalPrice() {
			const basePrice = this.productData.price || 0;
			// 简单处理，可以根据需要调整原价逻辑
			return Math.round(basePrice * 1.2);
		},
		memberLevelText() {
			const levelMap = { normal: '普通', silver: '银卡', gold: '金卡', diamond: '钻石' };
			return levelMap[this.userMemberLevel] || '普通';
		},
		memberDiscount() {
			const originalPrice = this.originalPrice;
			const discountMap = { normal: 0.05, silver: 0.08, gold: 0.12, diamond: 0.15 };
			const discountRate = discountMap[this.userMemberLevel] || 0;
			return Math.round(originalPrice * discountRate);
		},
		couponDiscount() {
			if (!this.selectedCoupon) return 0;
			// 计算优惠券应基于会员折扣后的价格
			const priceAfterMember = this.originalPrice - this.memberDiscount;
			if (this.selectedCoupon.type === 'fixed') {
				// 固定金额券不能超过当前价格
				return Math.min(this.selectedCoupon.amount, priceAfterMember);
			} else if (this.selectedCoupon.type === 'percent') {
				// 折扣券计算的是折扣掉的金额
				return Math.round(priceAfterMember * (1 - this.selectedCoupon.amount));
			}
			return 0;
		},
		totalSavings() {
			return this.memberDiscount + this.couponDiscount;
		},
		finalPrice() {
			const final = this.originalPrice - this.totalSavings;
			// 最终价格不能低于产品本身的基础价格
			return Math.max(final, this.productData.price || 0);
		},
		datePickerStart() {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			return tomorrow.toISOString().split('T')[0];
		},
		datePickerEnd() {
			const endDate = new Date();
			endDate.setMonth(endDate.getMonth() + 3);
			return endDate.toISOString().split('T')[0];
		}
	},

	onLoad(options) {
		if (options.id) {
			this.mainProductId = options.id;
			this.loadData(options.route); // 将可能的 route 参数传入
		} else {
			this.error = '缺少主产品ID参数';
			this.loading = false;
		}
	},

	// --- 分享相关 (现在使用 selectedProduct) ---
	onShareAppMessage() {
		return {
			title: this.productData.title || '精彩旅行',
			path: `/pages/product/detail?id=${this.mainProductId}&route=${this.selectedProductId}`, // 添加 route 参数
			imageUrl: this.productData.product_images?.[0] || '' // 优先使用 product_images
		};
	},
	onShareTimeline() {
		return {
			title: this.productData.title || '精彩旅行',
			query: `id=${this.mainProductId}&route=${this.selectedProductId}`, // 添加 route 参数
			imageUrl: this.productData.product_images?.[0] || '' // 优先使用 product_images
		};
	},

	methods: {
		// 加载所有相关数据
		async loadData(initialRouteId = null) {
			// 接收初始 routeId
			try {
				this.loading = true;
				this.error = null;
				this.relatedProducts = [];
				this.selectedProductId = null;

				console.log(`[多线路加载] 开始加载主商品 ${this.mainProductId}`);
				const db = uniCloud.database();
				const dbCmd = db.command;

				// 1. 加载主产品数据 (从 a-products)
				// 这一步仍然需要，用来获取 ctrip_id (用于评论) 和查询 a-routes
				const mainProductRes = await db.collection('a-products').doc(this.mainProductId).get();
				if (!mainProductRes.result?.data?.[0]) {
					throw new Error('主商品不存在');
				}
				const mainProductData = mainProductRes.result.data[0];
				this.mainCtripId = mainProductData.ctrip_id; // 关键：为评论保留
				console.log(`[多线路加载] 主商品ID: ${this.mainProductId}, 对应CtripId: ${this.mainCtripId}`);

				// 2. 查找包含此 mainCtripId 的 a-routes 记录
				console.log(`[多线路加载] 步骤2: 查找 mainCtripId 所在的 a-routes...`);
				const routesRes = await db.collection('a-routes').where({ A_route_id: this.mainCtripId }).get();

				let allRelatedProductIds = [];

				if (!routesRes.result?.data[0]) {
					// 3a. [回退方案] 未在 a-routes 找到匹配 (可能是旧数据或单线路产品)
					// 仅加载主产品本身
					console.warn('[多线路加载] 未在 a-routes 中找到匹配，将作为单线路产品加载');
					allRelatedProductIds = [this.mainCtripId]; // 列表中只包含它自己
				} else {
					// 3b. [标准方案] 找到了 a-routes 记录
					const routeDoc = routesRes.result.data[0];
					allRelatedProductIds = routeDoc.route_ids; //
					console.log(`[多线路加载] 步骤3: 成功在 a-routes 找到记录，共 ${allRelatedProductIds.length} 个关联产品`);
				}

				// 4. 批量查询 a-products (使用 allRelatedProductIds)
				console.log('[多线路加载] 步骤4: 批量查询 a-products...');
				const relatedProductsRes = await db
					.collection('a-products')
					.where({
						ctrip_id: dbCmd.in(allRelatedProductIds),
						status: 1 // 确保只显示上架产品
					})
					.get();

				const products = relatedProductsRes.result.data || [];
				console.log(`[多线路加载] 成功从 a-products 获取 ${products.length} 条产品数据`);

				if (products.length === 0) {
					// 如果查询为空 (例如产品都下架了)，至少保证主产品能显示
					products.push(mainProductData);
				}

				// 5. 批量查询所有相关产品的行程数据
				let itinerariesMap = {};
				if (allRelatedProductIds.length > 0) {
					const itineraryRes = await db
						.collection('a-itineraries')
						.where({ product_id: dbCmd.in(allRelatedProductIds) })
						.get();
					if (itineraryRes.result?.data?.length > 0) {
						itineraryRes.result.data.forEach((itin) => {
							itinerariesMap[itin.product_id] = itin;
						});
						console.log(`[多线路加载] 成功加载 ${Object.keys(itinerariesMap).length} 个行程`);
					}
				}

				// 6. 组合数据并按线路字母排序 (复用你现有的排序逻辑)
				products.sort((a, b) => {
					const letterA = a.route_title?.match(/^([A-Z])线/)?.[1] || 'Z'; // 获取字母，无则排最后
					const letterB = b.route_title?.match(/^([A-Z])线/)?.[1] || 'Z';
					if (letterA === letterB) return 0;
					return letterA.localeCompare(letterB);
				});

				this.relatedProducts = products.map((product) => {
					const itinerary = itinerariesMap[product._id] || null;
					return {
						product: product,
						itinerary: itinerary
					};
				});

				// 7. 设置默认选中的产品 (优先选择URL传入的route，否则用主产品)
				const routeParam = initialRouteId;
				if (routeParam && this.relatedProducts.some((p) => p.product._id === routeParam)) {
					this.selectedProductId = routeParam;
				} else if (this.relatedProducts.some((p) => p.product._id === this.mainProductId)) {
					this.selectedProductId = this.mainProductId;
				} else if (this.relatedProducts.length > 0) {
					this.selectedProductId = this.relatedProducts[0].product._id;
					console.warn('[多线路加载] Main product or route param not found in filtered list, selecting first available.');
				} else {
					this.selectedProductId = null;
					throw new Error('No valid products found to display after filtering.');
				}

				console.log(`[多线路加载] 最终选中产品: ${this.selectedProductId}`);

				// 8. 更新显示数据 (获取评论、检查收藏等)
				await this.updateDisplayedData();
			} catch (err) {
				console.error('[多线路加载] 加载数据失败:', err);
				this.error = err.message || '加载数据失败，请重试';
			} finally {
				this.loading = false;
			}
		},

		// 更新当前显示的 productData 和 itineraryData
		async updateDisplayedData() {
			if (!this.selectedProduct) {
				console.error('[更新显示] selectedProduct 为空!');
				this.error = '无法显示所选产品信息';
				return;
			}
			console.log(`[更新显示] 切换到产品: ${this.selectedProductId}`);
			// 计算属性会自动更新模板
			this.firstReview = null;
			this.swiperCurrentIndex = 0;
			this.currentImageIndex = 0; // 重置轮播图索引

			// 获取评论
			if (!this.firstReview) {
				try {
					const productCtripId = this.mainCtripId;
					if (productCtripId) {
						console.log(`[更新显示] 正在获取 ctrip_id: ${productCtripId} 的评论...`);
						const db = uniCloud.database();
						const reviewRes = await db.collection('a-reviews').where({ ctrip_id: productCtripId }).orderBy('created_at', 'desc').limit(1).get();

						if (reviewRes.result?.data?.length > 0) {
							this.firstReview = reviewRes.result.data[0];
							console.log('[更新显示] 成功获取到1条评论');
						} else {
							console.log('[更新显示] 未找到评论');
						}
					}
				} catch (err) {
					console.error('[更新显示] 加载评论失败:', err);
				}
			}

			await this.checkFavoriteStatus(); // 切换线路后需要重新检查收藏状态
		},

		// 选择线路
		selectRoute(productId) {
			if (productId !== this.selectedProductId) {
				this.selectedProductId = productId;
				this.updateDisplayedData();
			}
		},

		// 从 route_title 提取线路字母
		extractRouteLetter(routeTitle) {
			if (!routeTitle) return '?';
			const match = routeTitle.match(/^([A-Z])线/);
			return match ? match[1] : '?';
		},

		// 跳转到完整评论列表
		navigateToReviews() {
			if (!this.mainCtripId) return;
			uni.navigateTo({
				// 路径仅为示例，请修改为您实际的评论列表页面
				url: `/pages/product-detail/product-reviews?ctripId=${this.mainCtripId}`
			});
		},

		navigateToBookingPolicies() {
			if (!this.selectedProductId) {
				uni.showToast({ title: '请先选择一个商品线路', icon: 'none' });
				return;
			}
			uni.navigateTo({
				url: `/pages/product-detail/booking-policies?productId=${this.selectedProductId}`
			});
		},

		// 返回
		goBack() {
			uni.navigateBack();
		},
		// 轮播图切换
		onSwiperChange(e) {
			this.currentImageIndex = e.detail.current;
			this.swiperCurrentIndex = e.detail.current;
		},
		// 切换折叠
		toggleAccordion(key) {
			this.accordionState[key] = !this.accordionState[key];
		},
		// 显示/隐藏价格弹窗
		showPriceModal() {
			this.showPriceDetail = true;
		},
		hidePriceModal() {
			this.showPriceDetail = false;
		},
		// 选择优惠券
		selectCoupon() {
			const itemList = this.availableCoupons.map((coupon) => {
				if (coupon.type === 'fixed') {
					return `${coupon.name} - 减${coupon.amount}元`;
				} else {
					// 显示折扣，例如 0.88 -> 8.8折
					const discount = coupon.amount * 10;
					return `${coupon.name} - ${discount.toFixed(1)}折`;
				}
			});
			itemList.push('不使用优惠券');

			uni.showActionSheet({
				itemList: itemList,
				success: (res) => {
					if (res.tapIndex < this.availableCoupons.length) {
						this.selectedCoupon = this.availableCoupons[res.tapIndex];
						uni.showToast({ title: '优惠券已应用', icon: 'success' });
					} else {
						this.selectedCoupon = null; // 选择不使用
					}
				}
			});
		},
		// 显示/隐藏日期选择
		showDatePicker() {
			this.showDateModal = true;
		},
		onDateCancel() {
			this.showDateModal = false;
		},

		// --- 修改需要使用 selectedProductId 的方法 ---

		// 检查收藏状态
		async checkFavoriteStatus() {
			try {
				if (!this.selectedProductId) return;
				const db = uniCloud.database();
				// 获取当前登录用户ID，如果未登录则不查询
				const userInfo = uni.getStorageSync('uni-id-pages-userInfo');
				if (!userInfo || !userInfo._id) {
					this.isFavorite = false;
					this.favoriteId = '';
					console.log('[商品详情] 用户未登录，无法检查收藏状态');
					return;
				}
				const userId = userInfo._id;

				const result = await db.collection('a-favorites').where({ user_id: userId, product_id: this.selectedProductId }).field('_id').limit(1).get();

				if (result.result?.data?.length > 0) {
					this.isFavorite = true;
					this.favoriteId = result.result.data[0]._id;
				} else {
					this.isFavorite = false;
					this.favoriteId = '';
				}
				console.log(`[商品详情] 产品 ${this.selectedProductId} 收藏状态: ${this.isFavorite}`);
			} catch (error) {
				console.error('[商品详情] 检查收藏状态失败:', error);
				this.isFavorite = false;
				this.favoriteId = '';
			}
		},

		// 切换收藏状态
		async toggleFavorite() {
			try {
				// 检查登录状态
				const userInfo = uni.getStorageSync('uni-id-pages-userInfo');
				if (!userInfo || !userInfo._id) {
					uni.showToast({ title: '请先登录', icon: 'none' });
					// 可以选择跳转到登录页
					// uni.navigateTo({ url: '/uni_modules/uni-id-pages/pages/login/login-withpwd' });
					return;
				}
				const userId = userInfo._id;

				if (!this.selectedProductId) {
					uni.showToast({ title: '商品信息错误', icon: 'none' });
					return;
				}
				const db = uniCloud.database();

				if (this.isFavorite) {
					// 取消收藏
					if (!this.favoriteId) {
						await this.checkFavoriteStatus();
						if (!this.favoriteId) return;
					}
					const result = await db.collection('a-favorites').doc(this.favoriteId).remove();
					if (result.result?.deleted > 0) {
						this.isFavorite = false;
						this.favoriteId = '';
						uni.showToast({ title: '已取消收藏', icon: 'success' });
					} else {
						// 如果删除失败，可能记录已被删除，重新检查状态
						await this.checkFavoriteStatus();
						if (!this.isFavorite) uni.showToast({ title: '已取消收藏', icon: 'success' });
					}
				} else {
					// 添加收藏前再次检查
					const checkResult = await db.collection('a-favorites').where({ user_id: userId, product_id: this.selectedProductId }).field('_id').limit(1).get();
					if (checkResult.result?.data?.length > 0) {
						this.isFavorite = true;
						this.favoriteId = checkResult.result.data[0]._id;
						uni.showToast({ title: '已在收藏列表', icon: 'success' });
						return;
					}

					// 使用 this.productData (当前选中的)
					const favoriteData = {
						user_id: userId,
						product_id: this.selectedProductId,
						product_title: this.productData.title || '暂无标题',
						product_image: this.productData.product_images?.[0] || '',
						product_price: this.productData.price || 0,
						product_rating: this.productData.rating || 0,
						product_sales: this.productData.sales_count || 0
					};
					const result = await db.collection('a-favorites').add(favoriteData);
					if (result.result?.id) {
						this.isFavorite = true;
						this.favoriteId = result.result.id;
						uni.showToast({ title: '收藏成功', icon: 'success' });
					} else {
						throw new Error(result.result?.message || '添加收藏失败');
					}
				}
			} catch (error) {
				console.error('[商品详情] 切换收藏状态失败:', error);
				// 处理可能的错误，例如唯一索引冲突
				if (error.message?.includes('冲突') || error.message?.includes('duplicate key')) {
					await this.checkFavoriteStatus(); // 重新检查确保状态正确
					uni.showToast({ title: this.isFavorite ? '已在收藏列表' : '收藏状态异常', icon: this.isFavorite ? 'success' : 'none' });
				} else {
					uni.showToast({ title: error.message || '操作失败', icon: 'none' });
				}
			}
		},

		// 分享产品
		shareProduct() {
			this.showShareOptions(); // 统一调用显示选项的方法
		},
		showShareOptions() {
			const shareUrl = `${this.$config.h5.url}/#/pages/product/detail?id=${this.mainProductId}&route=${this.selectedProductId}`; // H5 地址
			uni.showActionSheet({
				itemList: ['分享给微信好友', '分享到朋友圈', '复制链接'],
				success: (res) => {
					switch (res.tapIndex) {
						case 0:
							// #ifdef APP-PLUS
							uni.share({
								provider: 'weixin',
								scene: 'WXSceneSession',
								type: 0, // 图文链接
								href: shareUrl,
								title: this.productData.title || '精彩旅游',
								summary: this.productData.subtitle || '点击查看详情',
								imageUrl: this.productData.product_images?.[0] || '',
								success: (res) => {
									uni.showToast({ title: '分享成功' });
								},
								fail: (err) => {
									uni.showToast({ title: '分享取消', icon: 'none' });
								}
							});
							// #endif
							// #ifdef H5 || MP-WEIXIN
							uni.showToast({ title: '请点击右上角分享', icon: 'none' });
							// #endif
							break;
						case 1:
							// #ifdef APP-PLUS
							uni.share({
								provider: 'weixin',
								scene: 'WXSceneTimeline',
								type: 0,
								href: shareUrl,
								title: this.productData.title || '精彩旅游',
								summary: this.productData.subtitle || '', // 朋友圈通常不显示摘要
								imageUrl: this.productData.product_images?.[0] || '',
								success: (res) => {
									uni.showToast({ title: '分享成功' });
								},
								fail: (err) => {
									uni.showToast({ title: '分享取消', icon: 'none' });
								}
							});
							// #endif
							// #ifdef H5 || MP-WEIXIN
							uni.showToast({ title: '请点击右上角分享到朋友圈', icon: 'none' });
							// #endif
							break;
						case 2:
							uni.setClipboardData({
								data: shareUrl,
								success: () => {
									uni.showToast({ title: '链接已复制', icon: 'success' });
								}
							});
							break;
					}
				}
			});
		},

		// 查看完整行程
		viewFullItinerary() {
			if (!this.selectedProductId) return;
			uni.navigateTo({
				// 传递当前选中的 product_id
				url: `/pages/product-detail/product-itinerary?productId=${this.selectedProductId}`
			});
		},

		// 立即预订
		bookNow() {
			if (!this.selectedProductId) {
				uni.showToast({ title: '请先选择产品', icon: 'none' });
				return;
			}
			this.showDatePicker();
		},

		// 日期选择确认
		onDateConfirm(selectedDate) {
			if (!this.selectedProductId) return;
			this.selectedDate = selectedDate;
			this.showDateModal = false;
			uni.navigateTo({
				// 传递当前选中的 product_id
				url: `/pages/order/order-booking?id=${this.selectedProductId}&date=${selectedDate}`
			});
		}
	}
};
</script>

<style>
.page-container {
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	position: relative;
	background-color: #f5f7fa;
	min-height: 100vh;
}

.nav-bar {
	position: absolute;
	top: 44px;
	left: 0;
	right: 0;
	height: 44px;
	display: flex;
	align-items: center;
	padding: 0 16px;
	z-index: 10;
}

.back-button {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background-color: rgba(0, 0, 0, 0.3);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
}

.nav-actions {
	display: flex;
	align-items: center;
}

.nav-button {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background-color: rgba(0, 0, 0, 0.3);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
}

.loading-container {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100vh;
}

.loading-text {
	color: #666;
	font-size: 16px;
}

.error-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100vh;
	padding: 20px;
}

.error-text {
	color: #f56565;
	font-size: 16px;
	margin-bottom: 20px;
	text-align: center;
}

.retry-button {
	background-color: #3182ce;
	color: white;
	padding: 10px 20px;
	border-radius: 6px;
	border: none;
	font-size: 14px;
}

.content-area {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 83px;
	overflow-y: auto;
}

.gallery-container {
	position: relative;
	height: 60vh;
	width: 100%;
	overflow: hidden;
}

.swiper {
	width: 100%;
	height: 100%;
}

.image-count {
	position: absolute;
	right: 16px;
	bottom: 16px;
	background-color: rgba(0, 0, 0, 0.5);
	color: white;
	border-radius: 12px;
	padding: 2px 8px;
	font-size: 12px;
	z-index: 5;
}

.section {
	background-color: white;
	margin-bottom: 8px;
	padding: 16px;
}

.section-title {
	font-size: 16px;
	font-weight: 600;
	color: #333;
	display: flex;
	align-items: center;
}

.section-title::before {
	content: '';
	display: block;
	width: 4px;
	height: 16px;
	background-color: #0086f6;
	margin-right: 8px;
	border-radius: 2px;
}

/* 精准星星评分样式 */
.star-rating-container {
	position: relative;
	display: inline-block;
	vertical-align: middle;
}

.stars-background {
	display: flex;
	white-space: nowrap;
}

.stars-foreground {
	position: absolute;
	top: 0;
	left: 0;
	display: flex;
	white-space: nowrap;
	overflow: hidden;
}

.star-rating-container .fa-star {
	margin-right: 2px;
}

.star-rating-container .fa-star:last-child {
	margin-right: 0;
}

.feature-item {
	display: flex;
	align-items: flex-start;
	margin-bottom: 12px;
}

.feature-icon {
	width: 20px;
	height: 20px;
	border-radius: 50%;
	background-color: #f0f9ff;
	color: #0086f6;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 8px;
	flex-shrink: 0;
}

.feature-icon text {
	font-size: 10px;
}

.line-clamp-2 {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.accordion-wrapper {
	margin-bottom: 100px;
}

.accordion-item {
	background-color: white;
	margin: 0 16px 8px 16px;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.accordion-header {
	cursor: pointer;
	transition: background-color 0.2s ease;
}

.accordion-header:active {
	background-color: #f8f9fa;
}

.bottom-bar {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 83px;
	background-color: white;
	display: flex;
	align-items: center;
	padding: 0 16px;
	box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.price-info-container {
	cursor: pointer;
}

.book-button {
	flex: 1;
	height: 44px;
	background-color: #ff9500;
	color: white;
	border-radius: 22px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 500;
	border: none;
}

/* 日期选择弹窗样式 - 底部弹出 */
.date-picker-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: flex-end;
	justify-content: center;
	z-index: 1000;
}

.date-picker-modal {
	background-color: white;
	border-radius: 16px 16px 0 0;
	width: 100%;
	max-height: 70vh;
	overflow: hidden;
	box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
	animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
	from {
		transform: translateY(100%);
	}
	to {
		transform: translateY(0);
	}
}

.date-picker-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px 20px;
	border-bottom: 1px solid #f0f0f0;
	background-color: #f8f9fa;
}

.date-picker-title {
	font-size: 16px;
	font-weight: 600;
	color: #333;
}

.date-picker-cancel {
	font-size: 16px;
	color: #666;
	cursor: pointer;
}

.date-picker-confirm {
	font-size: 16px;
	color: #0086f6;
	font-weight: 600;
	cursor: pointer;
}

.date-picker-confirm.disabled {
	color: #ccc;
	cursor: not-allowed;
}

.date-picker-confirm:active:not(.disabled) {
	color: #0074d9;
}

.date-picker-content {
	padding: 0;
	min-height: 300px;
}

.date-picker-trigger {
	width: 100%;
	height: 300px;
}

.price-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 50;
}

.price-modal {
	background-color: white;
	border-radius: 16px;
	width: 85%;
	max-width: 350px;
	overflow: hidden;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

/* 弹窗头部样式 */
.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px 20px 16px 20px;
	border-bottom: 1px solid #f0f0f0;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
}

.modal-title {
	font-size: 18px;
	font-weight: 600;
	color: white;
}

.close-button {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background-color: rgba(255, 255, 255, 0.2);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 16px;
	cursor: pointer;
	transition: background-color 0.2s ease;
}

.close-button:active {
	background-color: rgba(255, 255, 255, 0.3);
}

/* 弹窗内容样式 */
.modal-content {
	padding: 20px;
}

/* 价格区域样式 */
.price-section {
	margin-bottom: 16px;
}

.price-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.price-label {
	font-size: 16px;
	color: #333;
	font-weight: 500;
}

.price-value {
	font-size: 16px;
	font-weight: 600;
}

.original-price {
	color: #999;
	text-decoration: line-through;
}

/* 优惠区域样式 */
.discount-section {
	margin-bottom: 20px;
}

.discount-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
	padding: 12px;
	background-color: #f8f9fa;
	border-radius: 8px;
}

.discount-left {
	display: flex;
	align-items: center;
	flex: 1;
}

.discount-label {
	font-size: 14px;
	color: #666;
	margin-right: 8px;
}

.discount-badge {
	background-color: #e3f2fd;
	color: #1976d2;
	font-size: 12px;
	padding: 2px 8px;
	border-radius: 12px;
	font-weight: 500;
}

.coupon-badge {
	background-color: #fff3e0;
	color: #f57c00;
}

.discount-amount {
	font-size: 16px;
	font-weight: 600;
	color: #f44336;
}

/* 优惠券选择器 */
.coupon-selector {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px;
	border: 2px dashed #e0e0e0;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s ease;
}

.coupon-selector:active {
	border-color: #2196f3;
	background-color: #f5f5f5;
}

.coupon-selector-text {
	color: #2196f3;
	font-size: 14px;
	font-weight: 500;
}

.coupon-selector-arrow {
	color: #2196f3;
	font-size: 12px;
}

/* 分割线 */
.price-divider {
	height: 1px;
	background: linear-gradient(to right, transparent, #e0e0e0, transparent);
	margin: 20px 0;
}

/* 最终价格区域 */
.final-price-section {
	margin-bottom: 16px;
}

.final-price-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px;
	background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%);
	border-radius: 12px;
	color: white;
}

.final-price-label {
	font-size: 16px;
	font-weight: 500;
	color: white;
}

.final-price-container {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
}

.final-price {
	font-size: 24px;
	font-weight: 700;
	color: white;
	line-height: 1;
}

.savings {
	font-size: 12px;
	background-color: rgba(255, 255, 255, 0.2);
	padding: 2px 8px;
	border-radius: 10px;
	margin-top: 4px;
	color: white;
}

/* 提示文字 */
.price-note {
	text-align: center;
}

.note-text {
	font-size: 12px;
	color: #999;
	line-height: 1.4;
}

.action-buttons {
	display: flex;
	gap: 16px;
	padding: 12px 0;
	border-top: 1px solid #f0f0f0;
}

.action-button {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 8px;
	background-color: #f8fafc !important;
	border-radius: 8px;
	border: none !important;
	cursor: pointer;
	transition: all 0.2s ease;
}

.action-button:active {
	background-color: #e2e8f0;
	transform: scale(0.98);
}

.action-button::after {
	border: none !important;
}

.action-icon {
	font-size: 18px;
	color: #64748b;
	margin-bottom: 4px;
}

.action-icon-active {
	color: #ef4444;
}

.action-text {
	font-size: 12px;
	color: #64748b;
	font-weight: 500;
}

/* 行程概览样式 */
.itinerary-overview-list {
	margin-top: 4px;
}

.itinerary-overview-item {
	margin-bottom: 12px;
	border-radius: 8px;
	background-color: #f8f9fa;
	border: 1px solid #e9ecef;
	overflow: hidden;
	transition: all 0.2s ease;
}

.itinerary-overview-item:last-child {
	margin-bottom: 0;
}

.itinerary-overview-item:active {
	background-color: #e9ecef;
	transform: scale(0.99);
}

.itinerary-day-header {
	display: flex;
	align-items: center;
	padding: 12px 16px;
}

.day-number {
	flex-shrink: 0;
	width: 56px;
	height: 32px;
	background: linear-gradient(135deg, #0086f6 0%, #0074d9 100%);
	border-radius: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 12px;
}

.day-text {
	color: white;
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.5px;
}

.day-title-content {
	flex: 1;
	min-width: 0;
}

.day-title-text {
	font-size: 14px;
	color: #333;
	font-weight: 500;
	line-height: 1.4;
	word-break: break-word;
}

.itinerary-notes {
	padding: 12px 0 8px;
	border-top: 1px solid #f0f0f0;
	margin-top: 16px;
}

.note-item {
	display: block;
	font-size: 12px;
	color: #999;
	line-height: 1.6;
}

.view-full-itinerary-btn {
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	color: #0086f6;
	border: 1px solid #b3e5fc;
	border-radius: 24px;
	padding: 10px 24px;
	font-size: 14px;
	font-weight: 500;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;
	box-shadow: 0 2px 4px rgba(0, 134, 246, 0.1);
}

.view-full-itinerary-btn:active {
	background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
	transform: scale(0.98);
	box-shadow: 0 1px 2px rgba(0, 134, 246, 0.2);
}

.route-selection-section {
	padding-top: 8px; /* 减少顶部 padding */
	padding-bottom: 8px; /* 减少底部 padding */
	background-color: #ffffff; /* 确保背景色 */
}

.route-scroll-view {
	width: 100%;
	white-space: nowrap; /* 重要：让内部元素横向排列 */
}

.route-options-container {
	display: flex; /* 让子元素横向排列 */
	gap: 12px; /* 选项之间的间距 */
	padding: 4px 16px; /* 左右留边距，上下给滚动条空间 */
}

.route-option {
	display: inline-block; /* 允许横向滚动 */
	flex-shrink: 0; /* 防止选项被压缩 */
	width: 160px; /* 固定宽度 */
	border: 2px solid #e5e7eb; /* 默认边框 */
	border-radius: 12px;
	padding: 12px;
	background-color: #fff;
	cursor: pointer;
	transition: all 0.2s ease-in-out;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.route-option:active {
	transform: scale(0.98);
}

.route-option.selected {
	border-color: #3b82f6; /* 选中边框颜色 */
	background-color: #eff6ff; /* 选中背景色 */
	box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1);
}

.route-letter {
	font-size: 14px;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 4px;
	white-space: normal; /* 允许文字换行 */
	word-break: break-word;
}

.route-price {
	font-size: 16px;
	font-weight: bold;
	color: #ef4444; /* 价格颜色 */
	margin-bottom: 8px;
}

.route-overview {
	font-size: 11px;
	color: #6b7280;
	line-height: 1.5;
}

.route-overview-item {
	white-space: normal; /* 允许内部换行 */
	display: flex;
	align-items: flex-start;
	margin-bottom: 3px;
	overflow: hidden;
	text-overflow: ellipsis;
}
.route-overview-item:last-child {
	margin-bottom: 0;
}

.route-icon {
	width: 14px; /* 图标宽度 */
	text-align: center;
	margin-right: 4px;
	color: #9ca3af;
	margin-top: 4px;
}

.review-content-truncate {
	display: -webkit-box;
	-webkit-line-clamp: 3; /* 限制为3行 */
	-webkit-box-orient: vertical;
	overflow: hidden;
	text-overflow: ellipsis;
}

/* 调整底部栏高度 */
.bottom-bar {
	height: 65px; /* 减少底部栏高度 */
	/* #ifdef H5 */
	padding-bottom: 0; /* H5不需要安全区域 */
	/* #endif */
	/* #ifndef H5 */
	padding-bottom: constant(safe-area-inset-bottom); /* 兼容旧版 iOS */
	padding-bottom: env(safe-area-inset-bottom); /* 适配iPhoneX等 */
	/* #endif */
	box-sizing: content-box; /* 让padding不增加高度 */
}
/* 调整内容区域底部间距 */
.content-area {
	bottom: 65px; /* 匹配底部栏高度 */
	/* #ifdef H5 */
	/* H5不需要额外处理 */
	/* #endif */
	/* #ifndef H5 */
	padding-bottom: calc(constant(safe-area-inset-bottom) / 2); /* 留一点空间避免内容被底部栏遮挡 */
	padding-bottom: calc(env(safe-area-inset-bottom) / 2);
	/* #endif */
}
/* 调整折叠区域底部间距 */
.accordion-wrapper {
	margin-bottom: 80px; /* 留出更多空间 */
}

/* 导航栏调整以适应状态栏 */
/* 状态栏高度处理 */
.nav-bar {
	/* #ifdef MP-WEIXIN || APP-PLUS */
	top: calc(var(--status-bar-height) + 40rpx);
	/* #endif */
	/* #ifdef H5 */
	top: 0; /* H5 没有原生状态栏 */
	/* #endif */
}
/* 内容区域的顶部需要避开导航栏和可能的H5 header */
.content-area {
	padding-top: calc(44px + var(--status-bar-height, 0px)); /* 导航栏高度 + 状态栏高度 */
	/* #ifdef H5 */
	padding-top: 44px; /* H5 只有导航栏高度 */
	/* #endif */
}
.gallery-container {
	margin-top: calc(-44px - var(--status-bar-height, 0px)); /* 图片向上移动以覆盖导航栏 */
	/* #ifdef H5 */
	margin-top: -44px;
	/* #endif */
}

.booking-note-item {
	display: flex;
	align-items: center;
	padding: 16px; /* 内边距 */
	border-bottom: 1px solid #f0f0f0; /* 分隔线 */
	cursor: pointer;
	transition: background-color 0.2s ease;
}
.booking-note-item:last-child {
	border-bottom: none; /* 最后一项无分隔线 */
}
.booking-note-item:active {
	background-color: #f8f9fa; /* 点击效果 */
}

.booking-note-icon-wrapper {
	width: 40px; /* 图标背景宽度 */
	height: 40px; /* 图标背景高度 */
	border-radius: 50%; /* 圆形背景 */
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 12px; /* 图标与文字间距 */
	flex-shrink: 0;
}
.booking-note-icon-wrapper .fa {
	font-size: 18px; /* 图标大小 */
}

.booking-note-content {
	flex: 1; /* 占据剩余空间 */
	min-width: 0; /* 防止内容过长撑开布局 */
}

.booking-note-title {
	font-size: 15px; /* 标题字号 */
	font-weight: 500; /* 标题字重 */
	color: #333; /* 标题颜色 */
	display: block; /* 独占一行 */
	margin-bottom: 2px; /* 标题与副标题间距 */
}

.booking-note-subtitle {
	font-size: 12px; /* 副标题字号 */
	color: #999; /* 副标题颜色 */
	display: block; /* 独占一行 */
	white-space: nowrap; /* 副标题不换行 */
	overflow: hidden; /* 超出隐藏 */
	text-overflow: ellipsis; /* 超出显示省略号 */
}
</style>
