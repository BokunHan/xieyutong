<template>
	<view class="page-container">
		<!-- 导航栏 -->
		<view class="nav-bar">
			<view class="back-button" @click="goBack">
				<text class="fa fa-chevron-left"></text>
			</view>
			<view class="flex-1"></view>
			<!-- 隐藏右上角的收藏和分享按钮 -->
			<!-- <view class="nav-actions">
				<view class="nav-button" @click="shareProduct">
					<text class="fa fa-share-alt"></text>
				</view>
				<view class="nav-button ml-2" @click="toggleFavorite">
					<text class="fa fa-heart" :style="isFavorite ? 'color: #ef4444;' : 'color: rgba(255,255,255,0.6);'"></text>
				</view>
			</view> -->
		</view>

		<!-- 加载状态 -->
		<view v-if="loading" class="loading-container">
			<text class="loading-text">加载中...</text>
		</view>

		<!-- 错误状态 -->
		<view v-else-if="error" class="error-container">
			<text class="error-text">{{ error }}</text>
			<button @click="loadData" class="retry-button">重试</button>
		</view>

		<!-- 内容区域 -->
		<view v-else class="content-area">
			<!-- 顶部图片轮播 -->
			<view class="gallery-container" v-if="productData.product_images && productData.product_images.length > 0">
				<swiper 
					:indicator-dots="true" 
					:autoplay="true" 
					:interval="3000" 
					:duration="500"
					@change="onSwiperChange"
					class="swiper"
				>
					<swiper-item v-for="(image, index) in productData.product_images" :key="index">
						<image :src="image" :alt="productData.title" class="w-full h-full" mode="aspectFill" />
					</swiper-item>
				</swiper>
				<view class="image-count">{{ currentImageIndex + 1 }}/{{ productData.product_images.length }}</view>
			</view>

			<!-- 产品标题信息 -->
			<view class="section">
				<view class="mb-3">
					<text class="text-xl font-semibold text-gray-800 block mb-2">{{ productData.title || '暂无标题' }}</text>
					<text class="text-sm text-gray-600 block">{{ productData.subtitle || '暂无描述' }}</text>
				</view>
				<view class="flex justify-between items-center mb-3">
					<view class="flex items-center">
						<text class="text-blue-500 font-medium mr-1">{{ (productData.rating || 0).toFixed(1) }}分</text>
						<view class="flex text-yellow-400 mr-2">
							<text v-for="i in 5" :key="i" :class="i <= Math.floor(productData.rating || 0) ? 'fa fa-star' : 'fa fa-star-o'" class="text-xs"></text>
						</view>
						<text class="text-gray-400 text-xs">({{ productData.review_count || 0 }}条评价)</text>
					</view>
					<text class="text-gray-400 text-xs">已售{{ productData.sales_count || 0 }}人</text>
				</view>
				
				<!-- 收藏和分享按钮组 -->
				<view class="action-buttons">
					<view class="action-button" @click="toggleFavorite">
						<text class="fa fa-heart action-icon" :class="isFavorite ? 'action-icon-active' : ''"></text>
						<text class="action-text" :class="isFavorite ? 'text-red-500' : ''">{{ isFavorite ? '已收藏' : '收藏' }}</text>
					</view>
					<view class="action-button" @click="shareProduct">
						<text class="fa fa-share-alt action-icon"></text>
						<text class="action-text">分享</text>
					</view>
				</view>
			</view>
			
			<!-- 产品特色(详情图) -->
			<view class="section" v-if="productData.detail_images && productData.detail_images.length > 0">
				<text class="section-title">产品特色</text>
				<view class="product-detail-images">
					<image 
						v-for="(image, index) in productData.detail_images" 
						:key="index"
						:src="image" 
						:alt="`产品特色${index + 1}`" 
						class="w-full rounded-lg mb-3"
						mode="widthFix"
					/>
				</view>
			</view>

			<!-- 用户评价(只展示两条精选) -->
			<view class="section">
				<view class="flex justify-between items-center mb-4">
					<text class="section-title mb-0">用户评价</text>
					<view class="flex items-center">
						<text class="text-blue-500 font-medium mr-1">{{ (productData.rating || 0).toFixed(1) }}</text>
						<view class="flex text-yellow-400 mr-1">
							<text v-for="i in 5" :key="i" :class="i <= Math.floor(productData.rating || 0) ? 'fa fa-star' : 'fa fa-star-o'" class="text-xs"></text>
						</view>
						<text class="text-gray-400 text-xs">({{ productData.review_count || 0 }})</text>
					</view>
				</view>
				
				<!-- 暂时显示暂无评价，等待后续集成评价数据 -->
				<view class="border-t border-gray-100 pt-4">
					<view class="text-center text-gray-400">
						<text class="text-sm">暂无评价，成为第一个评价的用户吧</text>
					</view>
				</view>
			</view>

			<!-- 行程概览 -->
			<view class="section" v-if="itineraryData && itineraryData.itinerary && itineraryData.itinerary.length > 0">
				<text class="section-title">行程概览</text>
				<view class="itinerary-overview-list">
					<view 
						class="itinerary-overview-item" 
						v-for="(day, index) in itineraryData.itinerary" 
						:key="index"
					>
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
				<!-- <view class="text-center mt-4">
					<button class="view-full-itinerary-btn" @click="viewFullItinerary">
						<text class="fa fa-route mr-2"></text>
						查看详细行程安排
						<text class="fa fa-chevron-right ml-2"></text>
					</button>
				</view> -->
			</view>



			<!-- 折叠式区域 -->
			<view class="accordion-wrapper">
				<!-- 行程亮点 -->
				<view class="accordion-item" v-if="productData.features && productData.features.length > 0">
					<view class="accordion-header p-4 flex justify-between items-center" @click="toggleAccordion('highlights')">
						<text class="section-title mb-0 font-medium text-gray-800">行程亮点</text>
						<text :class="accordionState.highlights ? 'fa fa-chevron-up' : 'fa fa-chevron-down'" class="text-gray-400"></text>
					</view>
					<view class="accordion-content p-4 pt-0" v-if="accordionState.highlights">
						<view class="feature-item" v-for="(feature, index) in productData.features" :key="index">
							<view class="feature-icon">
								<text class="fa fa-star"></text>
							</view>
							<view>
								<text class="text-gray-800 block">{{ feature }}</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 行程概览 -->
				<view class="accordion-item" v-if="productData.overview">
					<view class="accordion-header p-4 flex justify-between items-center" @click="toggleAccordion('overview')">
						<text class="section-title mb-0 font-medium text-gray-800">行程概览</text>
						<text :class="accordionState.overview ? 'fa fa-chevron-up' : 'fa fa-chevron-down'" class="text-gray-400"></text>
					</view>
					<view class="accordion-content p-4 pt-0" v-if="accordionState.overview">
						<view class="grid grid-cols-2 gap-3">
							<view class="bg-blue-50 rounded-lg p-3" v-if="productData.overview.guide">
								<text class="text-xs text-gray-500 mb-1 block">导游</text>
								<text class="text-sm block">{{ productData.overview.guide }}</text>
							</view>
							<view class="bg-blue-50 rounded-lg p-3" v-if="productData.overview.transport">
								<text class="text-xs text-gray-500 mb-1 block">交通</text>
								<text class="text-sm block">{{ productData.overview.transport }}</text>
							</view>
							<view class="bg-blue-50 rounded-lg p-3" v-if="productData.overview.activities">
								<text class="text-xs text-gray-500 mb-1 block">活动</text>
								<text class="text-sm block">{{ productData.overview.activities }}</text>
							</view>
							<view class="bg-blue-50 rounded-lg p-3" v-if="productData.overview.accommodation">
								<text class="text-xs text-gray-500 mb-1 block">住宿</text>
								<text class="text-sm block">{{ productData.overview.accommodation }}</text>
							</view>
							<view class="bg-blue-50 rounded-lg p-3" v-if="productData.overview.meals">
								<text class="text-xs text-gray-500 mb-1 block">餐食</text>
								<text class="text-sm block">{{ productData.overview.meals }}</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 费用说明 -->
				<view class="accordion-item" v-if="productData.cost_info">
					<view class="accordion-header p-4 flex justify-between items-center" @click="toggleAccordion('cost')">
						<text class="section-title mb-0 font-medium text-gray-800">费用说明</text>
						<text :class="accordionState.cost ? 'fa fa-chevron-up' : 'fa fa-chevron-down'" class="text-gray-400"></text>
					</view>
					<view class="accordion-content p-4 pt-0" v-if="accordionState.cost">
						<view class="mb-3" v-if="productData.cost_info.transport">
							<text class="font-medium text-gray-800 mb-1 block">交通费用:</text>
							<text class="text-gray-600 text-sm">{{ productData.cost_info.transport }}</text>
						</view>
						<view class="mb-3" v-if="productData.cost_info.accommodation">
							<text class="font-medium text-gray-800 mb-1 block">住宿费用:</text>
							<text class="text-gray-600 text-sm">{{ productData.cost_info.accommodation }}</text>
						</view>
						<view class="mb-3" v-if="productData.cost_info.meals">
							<text class="font-medium text-gray-800 mb-1 block">餐食费用:</text>
							<text class="text-gray-600 text-sm">{{ productData.cost_info.meals }}</text>
						</view>
						<view class="mb-3" v-if="productData.cost_info.tickets">
							<text class="font-medium text-gray-800 mb-1 block">门票费用:</text>
							<text class="text-gray-600 text-sm">{{ productData.cost_info.tickets }}</text>
						</view>
						<view v-if="productData.cost_info.service">
							<text class="font-medium text-gray-800 mb-1 block">服务费用:</text>
							<text class="text-gray-600 text-sm">{{ productData.cost_info.service }}</text>
						</view>
					</view>
				</view>

				<!-- 预订须知 -->
				<view class="accordion-item">
					<view class="accordion-header p-4 flex justify-between items-center" @click="toggleAccordion('booking')">
						<text class="section-title mb-0 font-medium text-gray-800">预定须知</text>
						<text :class="accordionState.booking ? 'fa fa-chevron-up' : 'fa fa-chevron-down'" class="text-gray-400"></text>
					</view>
					<view class="accordion-content p-4 pt-0" v-if="accordionState.booking">
						<view class="mb-3">
							<text class="font-medium text-gray-800 mb-1 block">退改规则</text>
							<view class="text-gray-600 text-sm">
								<text class="mb-1 block">· 出行前7天（含）以上取消，全额退款</text>
								<text class="mb-1 block">· 出行前3-6天（含）取消，收取总费用的50%</text>
								<text class="mb-1 block">· 出行前2天（含）以内取消，收取总费用的100%</text>
							</view>
						</view>
						<view class="mb-3">
							<text class="font-medium text-gray-800 mb-1 block">预订限制</text>
							<view class="text-gray-600 text-sm">
								<text class="mb-1 block">· 最少预订人数：1人</text>
								<text class="mb-1 block">· 儿童预订提示：儿童价格仅适用于2-12岁（含）</text>
							</view>
						</view>
						<view>
							<text class="font-medium text-gray-800 mb-1 block">特别提示</text>
							<view class="text-gray-600 text-sm">
								<text class="mb-1 block">· 西藏为高原地区，请做好高原反应准备</text>
								<text class="mb-1 block">· 建议购买旅游意外保险</text>
								<text class="mb-1 block">· 请携带有效身份证件</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部预订栏 -->
		<view class="bottom-bar" v-if="!loading && !error">
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
			<button class="book-button" @click="bookNow">
				立即预订
			</button>
		</view>

		<!-- 日期选择组件 -->
		<date-picker
			:show="showDateModal"
			:value="selectedDate"
			:min-date="datePickerStart"
			:max-date="datePickerEnd"
			title="选择出发日期"
			@confirm="onDateConfirm"
			@cancel="onDateCancel"
		/>

		<!-- 价格计算弹窗 -->
		<view v-if="showPriceDetail" class="price-modal-overlay" @click="hidePriceModal">
			<view class="price-modal" @click.stop>
				<!-- 弹窗头部 -->
				<view class="modal-header">
					<text class="modal-title">价格计算明细</text>
					<view class="close-button" @click="hidePriceModal">
						<text class="fa fa-times"></text>
					</view>
				</view>
				
				<!-- 价格内容 -->
				<view class="modal-content">
					<!-- 原价部分 -->
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
					
					<!-- 优惠部分 -->
					<view class="discount-section">
						<!-- 会员折扣 -->
						<view class="discount-row" v-if="memberDiscount > 0">
							<view class="discount-left">
								<text class="discount-label">{{ memberLevelText }}折扣</text>
								<text class="discount-badge">{{ memberLevelText }}</text>
							</view>
							<text class="discount-amount">-¥{{ memberDiscount }}</text>
						</view>
						
						<!-- 优惠券折扣 -->
						<view class="discount-row" v-if="couponDiscount > 0">
							<view class="discount-left">
								<text class="discount-label">优惠券</text>
								<text class="discount-badge coupon-badge">{{ selectedCoupon ? selectedCoupon.name : '' }}</text>
							</view>
							<text class="discount-amount">-¥{{ couponDiscount }}</text>
						</view>
						
						<!-- 选择优惠券按钮 -->
						<view class="coupon-selector" @click="selectCoupon" v-if="!selectedCoupon && availableCoupons.length > 0">
							<text class="coupon-selector-text">选择优惠券</text>
							<text class="fa fa-chevron-right coupon-selector-arrow"></text>
						</view>
					</view>
					
					<!-- 分割线 -->
					<view class="price-divider"></view>
					
					<!-- 最终价格 -->
					<view class="final-price-section">
						<view class="final-price-row">
							<text class="final-price-label">优惠后价格</text>
							<view class="final-price-container">
								<text class="final-price">¥{{ finalPrice }}</text>
								<text class="savings" v-if="totalSavings > 0">已省¥{{ totalSavings }}</text>
							</view>
						</view>
					</view>
					
					<!-- 提示文字 -->
					<view class="price-note">
						<text class="note-text">* 最终价格以下单时为准，可能因日期、人数等因素有所变化</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import DatePicker from '@/components/date-picker/date-picker.vue'

export default {
	components: {
		DatePicker
	},
	data() {
		return {
			// 页面状态
			loading: true,
			error: null,
			productId: '',
			
			// UI状态
			currentImageIndex: 0,
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
			productData: {},
			itineraryData: {},
			
			// 价格计算相关
			userMemberLevel: 'gold', // normal, silver, gold, diamond
			availableCoupons: [
				{ id: 'coupon1', name: '新用户专享', amount: 200, type: 'fixed' },
				{ id: 'coupon2', name: '会员专享', amount: 0.88, type: 'percent' }
			],
			selectedCoupon: { id: 'coupon1', name: '新用户专享', amount: 200, type: 'fixed' } // 默认应用优惠券
		}
	},
	
	computed: {
		// 原价（增加一些原价显示）
		originalPrice() {
			const basePrice = this.productData.price || 0;
			// 增加20%作为原价，让优惠显得更明显
			return Math.round(basePrice * 1.2);
		},
		
		// 会员等级文字
		memberLevelText() {
			const levelMap = {
				normal: '普通会员',
				silver: '银卡会员', 
				gold: '金卡会员',
				diamond: '钻石会员'
			};
			return levelMap[this.userMemberLevel] || '普通会员';
		},
		
		// 会员折扣金额
		memberDiscount() {
			const originalPrice = this.originalPrice;
			const discountMap = {
				normal: 0.05,  // 5%折扣
				silver: 0.08,  // 8%折扣
				gold: 0.12,    // 12%折扣
				diamond: 0.15  // 15%折扣
			};
			const discountRate = discountMap[this.userMemberLevel] || 0;
			return Math.round(originalPrice * discountRate);
		},
		
		// 优惠券折扣金额
		couponDiscount() {
			if (!this.selectedCoupon) return 0;
			
			const priceAfterMember = this.originalPrice - this.memberDiscount;
			
			if (this.selectedCoupon.type === 'fixed') {
				return Math.min(this.selectedCoupon.amount, priceAfterMember);
			} else if (this.selectedCoupon.type === 'percent') {
				return Math.round(priceAfterMember * (1 - this.selectedCoupon.amount));
			}
			return 0;
		},
		
		// 总节省金额
		totalSavings() {
			return this.memberDiscount + this.couponDiscount;
		},
		
		// 最终价格
		finalPrice() {
			const final = this.originalPrice - this.totalSavings;
			return Math.max(final, this.productData.price || 0); // 不能低于成本价
		},
		
		// 日期选择器的开始日期（明天）
		datePickerStart() {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			return tomorrow.toISOString().split('T')[0];
		},
		
		// 日期选择器的结束日期（3个月后）
		datePickerEnd() {
			const endDate = new Date();
			endDate.setMonth(endDate.getMonth() + 3);
			return endDate.toISOString().split('T')[0];
		}
	},
	
	onLoad(options) {
		// 获取URL参数中的id
		if (options.id) {
			this.productId = options.id;
			this.loadData();
		} else {
			this.error = '缺少产品ID参数';
			this.loading = false;
		}
	},
	
	methods: {
		// 加载数据
		async loadData() {
			try {
				this.loading = true;
				this.error = null;
				
				// 先加载产品数据
				const productResult = await this.loadProductData();
				
				if (productResult.success) {
					this.productData = productResult.data;
					
					// 再加载行程数据
					const itineraryResult = await this.loadItineraryData();
					
					if (itineraryResult.success) {
						this.itineraryData = itineraryResult.data;
						// 为行程数据添加展开状态
						if (this.itineraryData.itinerary) {
							this.itineraryData.itinerary.forEach(day => {
								this.$set(day, 'expanded', false);
							});
						}
					}
					// 检查收藏状态
					await this.checkFavoriteStatus();
				} else {
					throw new Error(productResult.error || '加载产品数据失败');
				}
				
			} catch (err) {
				console.error('加载数据失败:', err);
				this.error = err.message || '加载数据失败，请重试';
			} finally {
				this.loading = false;
			}
		},
		
		// 加载产品数据
		async loadProductData() {
			try {
				const db = uniCloud.database();
				const res = await db.collection('a-products').doc(this.productId).get();
				
				if (res.result.data.length > 0) {
					return {
						success: true,
						data: res.result.data[0]
					};
				} else {
					return {
						success: false,
						error: '商品不存在'
					};
				}
			} catch (err) {
				console.error('加载产品数据失败:', err);
				return {
					success: false,
					error: err.message || '加载产品数据失败'
				};
			}
		},
		
		// 加载行程数据
		async loadItineraryData() {
			try {
				console.log('[产品详情] 开始加载行程数据, 产品ID:', this.productId);
				
				const db = uniCloud.database();
				const res = await db.collection('a-itineraries')
					.where({
						product_id: this.productId
					})
					.get();
				
				console.log('[产品详情] 行程数据查询结果:', res);
				
				if (res.result.data.length > 0) {
					console.log('[产品详情] 行程数据加载成功:', res.result.data[0]);
					return {
						success: true,
						data: res.result.data[0]
					};
				} else {
					console.log('[产品详情] 未找到行程数据');
					return {
						success: true,
						data: { itinerary: [] }
					};
				}
			} catch (err) {
				console.error('[产品详情] 加载行程数据失败:', err);
				return {
					success: true,
					data: { itinerary: [] }
				};
			}
		},
		
		// 返回
		goBack() {
			uni.navigateBack();
		},
		
		// 检查收藏状态 - 使用 ClientDB
		async checkFavoriteStatus() {
			try {
				if (!this.productId) return;
				
				console.log('[商品详情] 检查收藏状态:', this.productId);
				
				const db = uniCloud.database();
				// 修复查询条件，使用对象格式而不是字符串
				const result = await db.collection('a-favorites')
					.where({
						user_id: db.env.uid,
						product_id: this.productId
					})
					.field('_id')
					.get();
				
				console.log('[商品详情] 收藏查询结果:', result);
				
				if (result.result && result.result.data && result.result.data.length > 0) {
					this.isFavorite = true;
					this.favoriteId = result.result.data[0]._id;
					console.log('[商品详情] 已收藏，收藏ID:', this.favoriteId);
				} else {
					this.isFavorite = false;
					this.favoriteId = '';
					console.log('[商品详情] 未收藏');
				}
				
				console.log('[商品详情] 最终收藏状态:', this.isFavorite);
			} catch (error) {
				console.error('[商品详情] 检查收藏状态失败:', error);
				// 发生错误时设置为未收藏状态，避免重复添加
				this.isFavorite = false;
				this.favoriteId = '';
			}
		},
		
		// 切换收藏状态 - 使用 ClientDB
		async toggleFavorite() {
			try {
				if (!this.productId) {
					uni.showToast({
						title: '商品信息错误',
						icon: 'none'
					});
					return;
				}
				
				const db = uniCloud.database();
				
				if (this.isFavorite) {
					// 取消收藏
					console.log('[商品详情] 取消收藏，ID:', this.favoriteId);
					
					if (!this.favoriteId) {
						// 如果没有收藏ID，先重新检查状态
						await this.checkFavoriteStatus();
						if (!this.favoriteId) {
							uni.showToast({
								title: '收藏状态异常',
								icon: 'none'
							});
							return;
						}
					}
					
					const result = await db.collection('a-favorites')
						.doc(this.favoriteId)
						.remove();
					
					if (result.result && result.result.deleted > 0) {
						this.isFavorite = false;
						this.favoriteId = '';
						
						uni.showToast({
							title: '已取消收藏',
							icon: 'success'
						});
						
						console.log('[商品详情] 取消收藏成功');
					}
				} else {
					// 添加收藏前先检查是否已存在
					console.log('[商品详情] 准备添加收藏，先检查是否已存在');
					
					const checkResult = await db.collection('a-favorites')
						.where({
							user_id: db.env.uid,
							product_id: this.productId
						})
						.field('_id')
						.get();
					
					if (checkResult.result && checkResult.result.data && checkResult.result.data.length > 0) {
						// 已存在收藏记录，更新状态
						console.log('[商品详情] 发现已存在收藏记录，更新状态');
						this.isFavorite = true;
						this.favoriteId = checkResult.result.data[0]._id;
						
						uni.showToast({
							title: '已在收藏列表中',
							icon: 'success'
						});
						return;
					}
					
					// 构造收藏数据
					const favoriteData = {
						user_id: db.env.uid,
						product_id: this.productId,
						product_title: this.productData.title || '暂无标题',
						product_image: this.productData.product_images && this.productData.product_images.length > 0 
							? this.productData.product_images[0] : '',
						product_price: this.productData.price || 0,
						product_rating: this.productData.rating || 0,
						product_sales: this.productData.sales_count || 0
					};
					
					console.log('[商品详情] 添加收藏数据:', favoriteData);
					
					const result = await db.collection('a-favorites').add(favoriteData);
					
					if (result.result && result.result.id) {
						this.isFavorite = true;
						this.favoriteId = result.result.id;
						
						uni.showToast({
							title: '收藏成功',
							icon: 'success'
						});
						
						console.log('[商品详情] 添加收藏成功，ID:', result.result.id);
					}
				}
			} catch (error) {
				console.error('[商品详情] 切换收藏状态失败:', error);
				
				// 处理唯一索引冲突错误
				if (error.message && error.message.includes('冲突')) {
					console.log('[商品详情] 检测到索引冲突，重新检查收藏状态');
					await this.checkFavoriteStatus();
					uni.showToast({
						title: this.isFavorite ? '已在收藏列表中' : '收藏状态异常',
						icon: this.isFavorite ? 'success' : 'none'
					});
				} else {
					uni.showToast({
						title: '操作失败，请重试',
						icon: 'none'
					});
				}
			}
		},
		
		// 分享产品
		shareProduct() {
			// #ifdef MP-WEIXIN
			uni.showShareMenu({
				withShareTicket: true,
				menus: ['shareAppMessage', 'shareTimeline']
			});
			// #endif
			
			// #ifdef H5
			if (navigator.share) {
				navigator.share({
					title: this.productData.title || '精彩旅游产品',
					text: this.productData.subtitle || '发现更多精彩',
					url: window.location.href
				}).catch(err => {
					console.log('分享失败:', err);
					this.showShareOptions();
				});
			} else {
				this.showShareOptions();
			}
			// #endif
			
			// #ifdef APP-PLUS
			this.showShareOptions();
			// #endif
		},
		
		// 显示分享选项
		showShareOptions() {
			uni.showActionSheet({
				itemList: ['分享到微信', '分享到朋友圈', '复制链接'],
				success: (res) => {
					switch(res.tapIndex) {
						case 0:
							uni.showToast({
								title: '已分享到微信',
								icon: 'success'
							});
							break;
						case 1:
							uni.showToast({
								title: '已分享到朋友圈',
								icon: 'success'
							});
							break;
						case 2:
							// #ifdef H5
							navigator.clipboard.writeText(window.location.href).then(() => {
								uni.showToast({
									title: '链接已复制',
									icon: 'success'
								});
							});
							// #endif
							// #ifndef H5
							uni.setClipboardData({
								data: `${this.productData.title} - 携程高端游`,
								success: () => {
									uni.showToast({
										title: '链接已复制',
										icon: 'success'
									});
								}
							});
							// #endif
							break;
					}
				}
			});
		},
		
		// 轮播图切换
		onSwiperChange(e) {
			this.currentImageIndex = e.detail.current;
		},
		
		// 查看所有评价
		viewAllReviews() {
			console.log('查看所有评价');
		},
		
		// 切换天数展开状态
		toggleDayExpand(index) {
			this.$set(this.itineraryData.itinerary[index], 'expanded', !this.itineraryData.itinerary[index].expanded);
		},
		
		// 查看完整行程
		viewFullItinerary() {
			uni.navigateTo({
				url: `/pages/itinerary/itinerary?id=${this.productId}`
			});
		},
		
		// 切换折叠区域
		toggleAccordion(key) {
			this.accordionState[key] = !this.accordionState[key];
		},
		
		// 显示价格弹窗
		showPriceModal() {
			this.showPriceDetail = true;
		},
		
		// 隐藏价格弹窗
		hidePriceModal() {
			this.showPriceDetail = false;
		},
		
		// 选择优惠券
		selectCoupon() {
			const itemList = this.availableCoupons.map(coupon => {
				if (coupon.type === 'fixed') {
					return `${coupon.name} - 减${coupon.amount}元`;
				} else {
					return `${coupon.name} - ${Math.round((1 - coupon.amount) * 100)}折`;
				}
			});
			itemList.push('不使用优惠券');
			
			uni.showActionSheet({
				itemList: itemList,
				success: (res) => {
					if (res.tapIndex < this.availableCoupons.length) {
						this.selectedCoupon = this.availableCoupons[res.tapIndex];
						uni.showToast({
							title: '优惠券已应用',
							icon: 'success'
						});
					} else {
						this.selectedCoupon = null;
					}
				}
			});
		},
		
		// 立即预订
		bookNow() {
			console.log('[产品详情] 点击立即预订按钮');
			
			// 检查产品ID
			if (!this.productId) {
				uni.showToast({
					title: '商品信息异常',
					icon: 'none'
				});
				return;
			}
			
			this.showDatePicker();
		},
		
		// 显示日期选择器
		showDatePicker() {
			this.showDateModal = true;
		},
		
		// 日期选择确认
		onDateConfirm(selectedDate) {
			console.log('[产品详情] 确认选择的日期：', selectedDate);
			
			this.selectedDate = selectedDate;
			this.showDateModal = false;
			
			// 跳转到预订页面，传递选中的日期
			uni.navigateTo({
				url: `/pages/order/order-booking?id=${this.productId}&date=${selectedDate}`
			});
		},
		
		// 取消日期选择
		onDateCancel() {
			this.showDateModal = false;
		}
	}
}
</script>

<style>
.page-container {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
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
	margin-bottom: 12px;
	display: flex;
	align-items: center;
}

.section-title::before {
	content: "";
	display: block;
	width: 4px;
	height: 16px;
	background-color: #0086F6;
	margin-right: 8px;
	border-radius: 2px;
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
	color: #0086F6;
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
	box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}

.price-info-container {
	cursor: pointer;
}

.book-button {
	flex: 1;
	height: 44px;
	background-color: #FF9500;
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
	color: #0086F6;
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
	background-color: #f8fafc;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s ease;
}

.action-button:active {
	background-color: #e2e8f0;
	transform: scale(0.98);
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
	background: linear-gradient(135deg, #0086F6 0%, #0074d9 100%);
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
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	word-break: break-word;
}

.view-full-itinerary-btn {
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	color: #0086F6;
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
</style>
