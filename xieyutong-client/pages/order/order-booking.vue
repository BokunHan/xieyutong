<template>
	<view class="booking-page">
		<!-- 加载状态 -->
		<view v-if="loading" class="loading-container">
			<text class="loading-text">加载中...</text>
		</view>

		<!-- 内容区域 -->
		<view v-else class="content-area">
			<!-- 产品信息卡片 -->
			<view class="product-card">
				<image :src="productData.cover_image || (productData.product_images && productData.product_images[0])" class="product-image" mode="aspectFill" />
				<view class="product-info">
					<text class="product-title">{{ productData.title || '产品标题' }}</text>
					<text class="product-subtitle">{{ productData.subtitle || '产品描述' }}</text>
					<view class="price-info">
						<text class="current-price">¥{{ finalPrice }}</text>
						<text class="original-price" v-if="originalPrice > finalPrice">¥{{ originalPrice }}</text>
						<text class="savings" v-if="totalSavings > 0">省¥{{ totalSavings }}</text>
					</view>
				</view>
			</view>

			<!-- 出行日期选择 -->
			<view class="booking-section">
				<view class="section-header">
					<text class="section-title">出行日期</text>
					<text class="required">*</text>
				</view>
				<view class="date-selector" @click="selectDate">
					<view class="date-info">
						<text class="date-label">出发日期</text>
						<text class="date-value" :class="selectedDate ? '' : 'placeholder'">
							{{ selectedDate ? formatDate(selectedDate) : '请选择出发日期' }}
						</text>
					</view>
					<text class="fa fa-chevron-right arrow-icon"></text>
				</view>
			</view>

			<!-- 出行人选择 -->
			<view class="booking-section">
				<view class="section-header">
					<text class="section-title">出行人</text>
					<text class="required">*</text>
					<view class="section-action" @click="goToTravelersPage">
						<text class="action-text">管理出行人</text>
						<text class="fa fa-chevron-right action-icon"></text>
					</view>
				</view>

				<!-- 已选择的出行人列表 -->
				<view v-if="selectedTravelers.length > 0" class="selected-travelers">
					<view v-for="(traveler, index) in selectedTravelers" :key="traveler._id" class="traveler-item selected">
						<view class="traveler-avatar">
							<text class="avatar-text">{{ traveler.name.substring(0, 1) }}</text>
						</view>
						<view class="traveler-details">
							<text class="traveler-name">{{ traveler.name }}</text>
							<text class="traveler-type">{{ traveler.type }}</text>
						</view>
						<view class="remove-traveler" @click="removeTraveler(index)">
							<text class="fa fa-times"></text>
						</view>
					</view>
				</view>

				<!-- 选择出行人按钮 -->
				<view class="select-travelers-btn" @click="showTravelerSelector">
					<text class="fa fa-plus select-icon"></text>
					<text class="select-text">{{ selectedTravelers.length > 0 ? '继续添加出行人' : '选择出行人' }}</text>
				</view>
			</view>

			<!-- 联系人信息 -->
			<view class="booking-section">
				<view class="section-header">
					<text class="section-title">联系人信息</text>
					<text class="required">*</text>
					<text class="auto-fill-tip" v-if="contactInfo.name || contactInfo.phone">已自动填充，可修改</text>
				</view>
				<view class="contact-form">
					<view class="form-row">
						<text class="form-label">姓名</text>
						<input class="form-input" v-model="contactInfo.name" placeholder="请输入联系人姓名" :class="{ 'auto-filled': contactInfo.name }" />
						<text v-if="contactInfo.name" class="fa fa-edit edit-icon"></text>
					</view>
					<view class="form-row">
						<text class="form-label">手机号</text>
						<input class="form-input" v-model="contactInfo.phone" placeholder="请输入手机号码" type="number" :class="{ 'auto-filled': contactInfo.phone }" />
						<text v-if="contactInfo.phone" class="fa fa-edit edit-icon"></text>
					</view>
				</view>
			</view>

			<!-- 优惠券选择 -->
			<view class="booking-section">
				<view class="section-header">
					<text class="section-title">优惠券</text>
					<view class="section-action" @click="showCouponSelector">
						<text class="action-text">{{ selectedCoupon ? '已选择' : '选择优惠券' }}</text>
						<text class="fa fa-chevron-right action-icon"></text>
					</view>
				</view>

				<!-- 已选择的优惠券 -->
				<view v-if="selectedCoupon" class="selected-coupon">
					<view class="coupon-item">
						<view class="coupon-info">
							<view class="coupon-header">
								<text class="coupon-name">{{ selectedCoupon.name }}</text>
								<text class="coupon-tag">{{ selectedCoupon.type === 'fixed' ? '立减券' : '折扣券' }}</text>
								<view class="best-choice-badge" v-if="isBestChoice(selectedCoupon)">
									<text class="fa fa-star"></text>
									<text class="badge-text">最优</text>
								</view>
							</view>
							<text class="coupon-desc">满{{ selectedCoupon.min_amount || 0 }}元可用</text>
							<text class="coupon-expire">有效期至{{ formatExpireDate(selectedCoupon.expire_date) }}</text>
						</view>
						<view class="coupon-amount">
							<text class="amount-symbol">{{ selectedCoupon.type === 'fixed' ? '¥' : '' }}</text>
							<text class="amount-value">{{ selectedCoupon.type === 'fixed' ? selectedCoupon.amount : selectedCoupon.amount + '折' }}</text>
						</view>
						<view class="remove-coupon" @click="removeCoupon">
							<text class="fa fa-times"></text>
						</view>
					</view>
				</view>

				<!-- 未选择优惠券时的提示 -->
				<view v-else class="no-coupon-selected">
					<view class="coupon-placeholder" @click="showCouponSelector">
						<text class="fa fa-ticket placeholder-icon"></text>
						<text class="placeholder-text">选择优惠券，享受更多优惠</text>
						<text class="fa fa-chevron-right placeholder-arrow"></text>
					</view>
				</view>
			</view>

			<!-- 费用明细 -->
			<view class="booking-section">
				<view class="section-header">
					<text class="section-title">费用明细</text>
				</view>
				<view class="price-summary">
					<view class="price-row">
						<text class="price-label">成人 x {{ adultCount }}</text>
						<text class="price-value">¥{{ adultTotalPrice }}</text>
					</view>
					<view class="price-row" v-if="childCount > 0 && productData.child_price">
						<text class="price-label">儿童 x {{ childCount }}</text>
						<text class="price-value">¥{{ childTotalPrice }}</text>
					</view>
					<view class="price-row discount-row" v-if="totalDiscount > 0">
						<text class="price-label">优惠减免</text>
						<text class="price-value discount-value">-¥{{ totalDiscount }}</text>
					</view>
					<view class="price-divider"></view>
					<view class="price-row total-row">
						<text class="price-label">应付总额</text>
						<text class="total-price">¥{{ totalAmount }}</text>
					</view>
				</view>
			</view>

			<!-- 底部占位 -->
			<view class="bottom-placeholder"></view>
		</view>

		<!-- 底部支付栏 -->
		<view class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex items-center justify-between px-4 py-3">
			<view class="flex flex-col flex-1 mr-4">
				<view class="flex items-center">
					<text class="text-xl font-bold text-orange-500">¥{{ totalAmount }}</text>
					<text class="text-xs text-orange-500 ml-1">/人起</text>
					<text class="ml-2 bg-orange-100 text-orange-500 text-xs px-1.5 py-0.5 rounded-sm" v-if="totalDiscount > 0">已减¥{{ totalDiscount }}</text>
				</view>
				<view class="flex items-center mt-1">
					<text class="text-xs text-gray-400 line-through mr-2" v-if="originalPrice > totalAmount">原价¥{{ originalPrice }}</text>
					<text class="text-xs text-gray-500">已选{{ selectedTravelers.length }}人</text>
					<text class="text-xs text-gray-500 ml-2" v-if="selectedDate">{{ formatDate(selectedDate).split(' ')[0] }}</text>
				</view>
			</view>

			<button
				class="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg px-6 py-3 text-sm font-medium shadow-md transition-all"
				:class="{ 'pay-button-disabled': !canSubmit }"
				:disabled="!canSubmit"
				@click="submitOrder">
				微信支付
			</button>
		</view>

		<!-- 挂载支付组件(隐藏，直接调用微信支付) -->
		<uni-pay
			ref="uniPay"
			:to-success-page="true"
			:return-url="'/pages/order/order-detail'"
			:main-color="'#ff6b35'"
			mode="direct"
			@success="onPaySuccess"
			@fail="onPayFail"
			@cancel="onPayCancel"
			@mounted="onPayMounted" />

		<!-- 日期选择组件 -->
		<date-picker
			:show="showDateModal"
			:value="selectedDateString"
			:min-date="datePickerStart"
			:max-date="datePickerEnd"
			title="重新选择出发日期"
			@confirm="onDateConfirm"
			@cancel="onDateCancel" />

		<!-- 优惠券选择弹窗 -->
		<view v-if="showCouponModal" class="modal-overlay" @click="closeCouponModal">
			<view class="coupon-modal" @click.stop>
				<view class="modal-header">
					<view class="header-content">
						<text class="modal-title">选择优惠券</text>
						<text class="modal-subtitle">为您精选了{{ availableCoupons.length }}张可用优惠券</text>
					</view>
					<view class="close-button" @click="closeCouponModal">
						<text class="fa fa-times"></text>
					</view>
				</view>
				<view class="modal-content">
					<!-- 加载状态 -->
					<view v-if="loadingCoupons" class="loading-coupons">
						<text class="loading-text">加载中...</text>
					</view>

					<!-- 优惠券列表 -->
					<view v-else class="coupons-list">
						<!-- 可用优惠券 -->
						<view
							v-for="coupon in availableCoupons"
							:key="coupon.id"
							class="coupon-option available"
							:class="{ selected: tempSelectedCoupon && tempSelectedCoupon.id === coupon.id }"
							@click="selectCoupon(coupon)">
							<view class="coupon-left">
								<view class="coupon-amount-display">
									<text class="amount-symbol">{{ coupon.type === 'fixed' ? '¥' : '' }}</text>
									<text class="amount-value">{{ coupon.type === 'fixed' ? coupon.amount : coupon.amount + '折' }}</text>
								</view>
								<text class="coupon-type-label">{{ coupon.type === 'fixed' ? '立减券' : '折扣券' }}</text>
							</view>
							<view class="coupon-right">
								<text class="coupon-name">{{ coupon.name }}</text>
								<text class="coupon-condition">满{{ coupon.min_amount || 0 }}元可用</text>
								<text class="coupon-expire">{{ formatExpireDate(coupon.expire_date) }}</text>
							</view>
							<view class="coupon-status">
								<text class="fa" :class="tempSelectedCoupon && tempSelectedCoupon.id === coupon.id ? 'fa-check-circle selected' : 'fa-circle-o'"></text>
							</view>
						</view>

						<!-- 不可用优惠券 -->
						<view v-for="coupon in unavailableCoupons" :key="coupon.id" class="coupon-option unavailable">
							<view class="coupon-left">
								<view class="coupon-amount-display disabled">
									<text class="amount-symbol">{{ coupon.type === 'fixed' ? '¥' : '' }}</text>
									<text class="amount-value">{{ coupon.type === 'fixed' ? coupon.amount : coupon.amount + '折' }}</text>
								</view>
								<text class="coupon-type-label">{{ coupon.type === 'fixed' ? '立减券' : '折扣券' }}</text>
							</view>
							<view class="coupon-right">
								<text class="coupon-name disabled">{{ coupon.name }}</text>
								<text class="coupon-condition disabled">满{{ coupon.min_amount || 0 }}元可用</text>
								<text class="coupon-expire disabled">{{ formatExpireDate(coupon.expire_date) }}</text>
								<text class="unavailable-reason">{{ coupon.unavailable_reason }}</text>
							</view>
							<view class="coupon-status">
								<text class="fa fa-circle-o disabled"></text>
							</view>
						</view>

						<!-- 空状态 -->
						<view v-if="availableCoupons.length === 0 && unavailableCoupons.length === 0" class="empty-coupons">
							<text class="fa fa-ticket empty-icon"></text>
							<text class="empty-text">暂无可用优惠券</text>
							<text class="empty-desc">完成更多操作可获得优惠券</text>
						</view>
					</view>

					<!-- 不使用优惠券选项 -->
					<view class="no-coupon-option" :class="{ selected: !tempSelectedCoupon }" @click="selectCoupon(null)">
						<text class="no-coupon-text">不使用优惠券</text>
						<view class="coupon-status">
							<text class="fa" :class="!tempSelectedCoupon ? 'fa-check-circle selected' : 'fa-circle-o'"></text>
						</view>
					</view>
				</view>
				<view class="modal-footer">
					<button class="cancel-btn" @click="closeCouponModal">
						<text class="btn-text">取消</text>
					</button>
					<button class="confirm-btn" @click="confirmCouponSelection">
						<text class="btn-text">确认选择</text>
					</button>
				</view>
			</view>
		</view>

		<!-- 出行人选择弹窗 -->
		<view v-if="showTravelerModal" class="modal-overlay" @click="closeTravelerModal">
			<view class="traveler-modal" @click.stop>
				<view class="modal-header">
					<text class="modal-title">选择出行人</text>
					<view class="close-button" @click="closeTravelerModal">
						<text class="fa fa-times"></text>
					</view>
				</view>
				<view class="modal-content">
					<!-- 加载状态 -->
					<view v-if="loadingTravelers" class="loading-travelers">
						<text class="loading-text">加载中...</text>
					</view>

					<!-- 出行人列表 -->
					<view v-else class="travelers-list">
						<view
							v-for="traveler in availableTravelers"
							:key="traveler._id"
							class="traveler-option"
							:class="{ selected: isTravelerSelected(traveler._id) }"
							@click="toggleTravelerSelection(traveler)">
							<view class="traveler-checkbox">
								<text class="fa" :class="isTravelerSelected(traveler._id) ? 'fa-check-circle selected' : 'fa-circle-o'"></text>
							</view>
							<view class="traveler-info">
								<text class="traveler-name">{{ traveler.name }}</text>
								<text class="traveler-type">{{ traveler.type }}</text>
							</view>
						</view>

						<!-- 空状态 -->
						<view v-if="availableTravelers.length === 0" class="empty-travelers">
							<text class="fa fa-user-plus empty-icon"></text>
							<text class="empty-text">暂无出行人</text>
							<text class="empty-desc">请先添加出行人信息</text>
						</view>
					</view>

					<!-- 添加新出行人按钮 -->
					<view class="add-traveler-btn" @click="addNewTraveler">
						<text class="fa fa-plus add-icon"></text>
						<text class="add-text">添加新出行人</text>
					</view>
				</view>
				<view class="modal-footer">
					<button class="cancel-btn" @click="closeTravelerModal">取消</button>
					<button class="confirm-btn" @click="confirmTravelerSelection">确认选择</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import DatePicker from '@/components/date-picker/date-picker.vue';

// 引入支付云对象
const uniPayCo = uniCloud.importObject('uni-pay-co');

export default {
	components: {
		DatePicker
	},
	data() {
		return {
			// 页面状态
			loading: true,
			productId: '',

			// 产品数据
			productData: {},

			// 预订信息
			selectedDate: null,
			showDateModal: false,
			selectedTravelers: [],
			contactInfo: {
				name: '',
				phone: ''
			},

			// 价格计算
			userMemberLevel: 'gold',
			selectedCoupon: null,

			// 优惠券相关
			showCouponModal: false,
			loadingCoupons: false,
			availableCoupons: [],
			unavailableCoupons: [],
			tempSelectedCoupon: null, // 临时选择的优惠券，确认后才赋值给selectedCoupon

			// UI状态
			showTravelerModal: false,
			availableTravelers: [],
			loadingTravelers: false
		};
	},

	computed: {
		// 原价计算
		originalPrice() {
			const basePrice = this.productData.price || 0;
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

		// 会员折扣
		memberDiscount() {
			const originalPrice = this.originalPrice;
			const discountMap = {
				normal: 0.05,
				silver: 0.08,
				gold: 0.12,
				diamond: 0.15
			};
			const discountRate = discountMap[this.userMemberLevel] || 0;
			return Math.round(originalPrice * discountRate);
		},

		// 优惠券折扣
		couponDiscount() {
			if (!this.selectedCoupon) return 0;

			const priceAfterMember = this.originalPrice - this.memberDiscount;
			console.log('selectedCoupon: ', this.selectedCoupon.amount);

			if (this.selectedCoupon.type === 'fixed') {
				return Math.min(this.selectedCoupon.amount, priceAfterMember);
			} else if (this.selectedCoupon.type === 'percent') {
				return Math.round(priceAfterMember * (1 - this.selectedCoupon.amount / 10));
			}
			return 0;
		},

		// 总节省
		totalSavings() {
			return this.memberDiscount + this.couponDiscount;
		},

		// 最终单价
		finalPrice() {
			const final = this.originalPrice - this.totalSavings;
			return Math.max(final, this.productData.price || 0);
		},

		// 成人总价
		adultTotalPrice() {
			return this.finalPrice * this.adultCount;
		},

		// 儿童总价
		childTotalPrice() {
			const childPrice = this.productData.child_price || 0;
			return childPrice * this.childCount;
		},

		// 总折扣
		totalDiscount() {
			return (this.memberDiscount + this.couponDiscount) * this.adultCount;
		},

		// 应付总额
		totalAmount() {
			return this.adultTotalPrice + this.childTotalPrice;
		},

		// 是否可以提交订单
		canSubmit() {
			return this.selectedDate && this.selectedTravelers.length > 0 && this.contactInfo.name && this.contactInfo.phone;
		},

		// 支付按钮文字
		payButtonText() {
			if (!this.selectedDate) return '请选择出发日期';
			if (this.selectedTravelers.length === 0) return '请选择出行人';
			if (!this.contactInfo.name || !this.contactInfo.phone) return '请填写联系人信息';
			if (!this.agreedToTerms) return '请同意预订协议';
			return '微信支付';
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
		},

		// 选中日期的字符串格式（用于日期选择组件）
		selectedDateString() {
			if (!this.selectedDate) return '';
			const d = new Date(this.selectedDate);
			return d.toISOString().split('T')[0];
		},

		// 成人数量
		adultCount() {
			if (!this.selectedTravelers || this.selectedTravelers.length === 0) return 1; // 默认至少1个成人
			return this.selectedTravelers.filter((t) => t.type === '成人' || t.type === 'adult').length || 1;
		},

		// 儿童数量
		childCount() {
			if (!this.selectedTravelers || this.selectedTravelers.length === 0) return 0;
			return this.selectedTravelers.filter((t) => t.type === '儿童' || t.type === 'child').length;
		}
	},

	watch: {
		// 监听总金额变化，自动重新选择最佳优惠券
		totalAmount: {
			handler(newAmount, oldAmount) {
				if (newAmount !== oldAmount && this.availableCoupons.length > 0) {
					console.log(`[优惠券] 订单金额变化: ¥${oldAmount} → ¥${newAmount}`);
					// 延迟执行，避免在初始化时重复执行
					this.$nextTick(() => {
						this.selectBestCoupon();
					});
				}
			},
			immediate: false // 不在初始化时立即执行
		},

		// 监听出行人变化，重新加载优惠券数据
		selectedTravelers: {
			handler(newTravelers, oldTravelers) {
				if (newTravelers && oldTravelers && newTravelers.length !== oldTravelers.length) {
					console.log(`[优惠券] 出行人数量变化: ${oldTravelers.length} → ${newTravelers.length}`);
					// 重新设置优惠券数据并自动选择
					this.$nextTick(() => {
						this.setMockCoupons();
					});
				}
			},
			deep: true
		}
	},

	onLoad(options) {
		if (options.id) {
			this.productId = options.id;

			// 如果传递了日期参数，设置选中的日期
			if (options.date) {
				this.selectedDate = new Date(options.date);
			}

			this.loadData();
		} else {
			this.loading = false;
		}
	},

	onShow() {
		// 从添加出行人页面返回时重新加载出行人数据
		if (this.showTravelerModal) {
			this.loadTravelers();
		}
	},

	methods: {
		// 加载数据
		async loadData() {
			try {
				this.loading = true;
				this.error = null;

				// 并行加载产品数据、用户信息、出行人数据和优惠券数据
				const [productResult, userResult, travelersResult] = await Promise.all([
					this.loadProductData(),
					this.loadUserInfo(),
					this.loadTravelers(false), // 不显示加载状态
					this.loadCoupons(false) // 不显示加载状态
				]);

				if (productResult.success) {
					this.productData = productResult.data;
				} else {
					throw new Error(productResult.error || '加载产品数据失败');
				}

				// 自动填充用户联系信息
				if (userResult.success && userResult.data) {
					const userData = userResult.data;
					this.contactInfo = {
						name: userData.username || userData.nickname || '',
						phone: userData.mobile || ''
					};
					console.log('[预订页面] 自动填充联系人信息:', this.contactInfo);
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

		// 加载用户信息
		async loadUserInfo() {
			try {
				// 检查用户登录状态
				const token = uni.getStorageSync('uni_id_token');
				if (!token) {
					console.log('[预订页面] 用户未登录，跳过加载用户信息');
					return { success: false, error: '用户未登录' };
				}

				// 使用 ClientDB 查询当前用户信息
				const db = uniCloud.database();
				const res = await db.collection('uni-id-users').where('_id == $cloudEnv_uid').field('username,nickname,mobile,realname_auth').get();

				console.log('[预订页面] 查询用户信息结果:', res);

				if (res.result && res.result.data && res.result.data.length > 0) {
					return {
						success: true,
						data: res.result.data[0]
					};
				} else {
					console.log('[预订页面] 未查询到用户信息');
					return { success: false, error: '未查询到用户信息' };
				}
			} catch (error) {
				console.error('[预订页面] 加载用户信息失败:', error);
				return { success: false, error: error.message || '加载用户信息失败' };
			}
		},

		// 加载出行人数据
		async loadTravelers(setLoadingState = true) {
			try {
				if (setLoadingState) {
					this.loadingTravelers = true;
				}

				// 检查用户登录状态
				const token = uni.getStorageSync('uni_id_token');
				if (!token) {
					console.log('[预订页面] 用户未登录，跳过加载出行人数据');
					return { success: false, error: '用户未登录' };
				}

				// 使用 ClientDB 查询出行人列表
				const db = uniCloud.database();
				const result = await db
					.collection('a-travelers')
					.where('status == "active" && user_id == $env.uid')
					.field('_id,name,id_card,phone,type,gender,birthday,is_main')
					.orderBy('is_main desc, created_at desc')
					.get();

				console.log('[ClientDB] 查询出行人列表结果:', result);

				if (result.result && result.result.data) {
					this.availableTravelers = result.result.data;
					console.log('[ClientDB] 加载出行人列表成功，共', this.availableTravelers.length, '条数据');

					// 自动选择主要出行人（is_main为true的出行人）
					this.autoSelectMainTraveler();

					return { success: true, data: result.result.data };
				} else {
					this.availableTravelers = [];
					console.log('[ClientDB] 未查询到出行人数据');
					return { success: true, data: [] };
				}
			} catch (error) {
				console.error('[ClientDB] 加载出行人列表失败:', error);
				this.availableTravelers = [];
				return { success: false, error: error.message || '加载出行人列表失败' };
			} finally {
				if (setLoadingState) {
					this.loadingTravelers = false;
				}
			}
		},

		// 自动选择主要出行人
		autoSelectMainTraveler() {
			// 如果已经有选中的出行人，则不再自动选择
			if (this.selectedTravelers.length > 0) {
				console.log('[预订页面] 已有选中的出行人，跳过自动选择');
				return;
			}

			// 查找主要出行人（is_main为true）
			const mainTraveler = this.availableTravelers.find((traveler) => traveler.is_main === true);

			if (mainTraveler) {
				this.selectedTravelers = [mainTraveler];
				console.log('[预订页面] 自动选择主要出行人:', mainTraveler.name);
			} else if (this.availableTravelers.length > 0) {
				// 如果没有主要出行人，选择第一个出行人
				this.selectedTravelers = [this.availableTravelers[0]];
				console.log('[预订页面] 自动选择第一个出行人:', this.availableTravelers[0].name);
			}
		},

		// 格式化日期
		formatDate(date) {
			if (!date) return '';
			const d = new Date(date);
			const year = d.getFullYear();
			const month = (d.getMonth() + 1).toString().padStart(2, '0');
			const day = d.getDate().toString().padStart(2, '0');
			const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
			return `${year}-${month}-${day} ${weekDay}`;
		},

		// 选择日期
		selectDate() {
			this.showDateModal = true;
		},

		// 日期选择确认
		onDateConfirm(selectedDate) {
			console.log('[预订页面] 确认选择的日期：', selectedDate);

			this.selectedDate = new Date(selectedDate);
			this.showDateModal = false;
		},

		// 取消日期选择
		onDateCancel() {
			this.showDateModal = false;
		},

		// 跳转到出行人管理页面
		goToTravelersPage() {
			uni.navigateTo({
				url: '/pages/travelers/travelers'
			});
		},

		// 移除出行人
		removeTraveler(index) {
			this.selectedTravelers.splice(index, 1);
		},

		// 显示出行人选择弹窗
		async showTravelerSelector() {
			this.showTravelerModal = true;
			await this.loadTravelers(true); // 在弹窗中显示加载状态
		},

		// 关闭出行人选择弹窗
		closeTravelerModal() {
			this.showTravelerModal = false;
		},

		// 切换出行人选择
		toggleTravelerSelection(traveler) {
			if (this.isTravelerSelected(traveler._id)) {
				this.selectedTravelers = this.selectedTravelers.filter((t) => t._id !== traveler._id);
			} else {
				this.selectedTravelers.push(traveler);
			}
		},

		// 判断出行人是否被选中
		isTravelerSelected(travelerId) {
			return this.selectedTravelers.some((t) => t._id === travelerId);
		},

		// 添加新出行人
		addNewTraveler() {
			// 关闭弹窗并跳转到添加出行人页面
			this.closeTravelerModal();
			uni.navigateTo({
				url: '/pages/traveler-add/traveler-add'
			});
		},

		// 确认出行人选择
		confirmTravelerSelection() {
			console.log('确认选择的出行人：', this.selectedTravelers);
			this.closeTravelerModal();
		},

		// 提交订单并发起支付
		async submitOrder() {
			if (!this.canSubmit) return;

			try {
				uni.showLoading({
					title: '正在创建订单...'
				});

				// 1. 先创建业务订单
				const orderData = await this.createBusinessOrder();
				console.log('[支付] 创建业务订单成功:', orderData);

				// 2. 获取用户openid（微信小程序支付必需）
				console.log('[支付] 开始获取用户openid');

				let openid = '';

				// 尝试从缓存获取openid
				const cachedOpenid = uni.getStorageSync('wx_openid');
				const openidExpired = uni.getStorageSync('openid_expired') || 0;
				const now = Date.now();

				if (cachedOpenid && now < openidExpired) {
					console.log('[支付] 使用缓存的openid:', cachedOpenid);
					openid = cachedOpenid;
				} else {
					console.log('[支付] 重新获取openid');

					// 获取微信登录code
					const loginRes = await uni.login({
						provider: 'weixin'
					});

					console.log('[支付] 微信登录结果:', loginRes);

					// uni.login 在 Promise 化后直接返回结果对象，不是数组
					if (!loginRes || !loginRes.code) {
						throw new Error('获取微信登录code失败');
					}

					console.log('[支付] 获取到微信code:', loginRes.code);

					// 通过code获取openid
					const openidRes = await uniPayCo.getOpenid({
						provider: 'wxpay',
						code: loginRes.code
					});

					console.log('[支付] 获取openid结果:', openidRes);

					if (openidRes.errCode !== 0 || !openidRes.openid) {
						throw new Error(openidRes.errMsg || '获取用户openid失败');
					}

					openid = openidRes.openid;

					// 缓存openid，有效期1小时
					uni.setStorageSync('wx_openid', openid);
					uni.setStorageSync('openid_expired', now + 3600000); // 1小时后过期

					console.log('[支付] 获取openid成功:', openid);
				}

				// 3. 创建微信支付订单
				const paymentParams = {
					provider: 'wxpay', // 仅支持微信支付
					total_fee: Math.round(this.totalAmount * 100), // 转换为分
					order_no: orderData.order_no, // 业务订单号
					description: `${this.productData.title} - ${this.selectedTravelers.length}人`,
					type: 'tourism', // 旅游订单
					openid: openid, // 用户openid
					custom: {
						product_id: this.productId,
						departure_date: this.selectedDate,
						traveler_count: this.selectedTravelers.length,
						contact_phone: this.contactInfo.phone,
						business_order_id: orderData._id
					}
				};

				console.log('[支付] 支付参数:', paymentParams);

				uni.hideLoading();

				// 4. 直接发起微信支付，不显示选择界面
				try {
					// 直接调用微信支付
					const payResult = await uniPayCo.createOrder(paymentParams);
					console.log('[支付] 创建支付订单成功:', payResult);

					// 直接调用微信支付
					this.triggerWxPay(payResult);
				} catch (payError) {
					console.error('[支付] 创建支付订单失败:', payError);
					uni.showToast({
						title: payError.message || '支付失败，请重试',
						icon: 'none'
					});
				}
			} catch (error) {
				uni.hideLoading();
				console.error('[支付] 订单创建失败:', error);
				uni.showToast({
					title: error.message || '订单创建失败，请重试',
					icon: 'none'
				});
			}
		},

		// 创建业务订单
		async createBusinessOrder() {
			try {
				// 生成业务订单号
				const orderNo = 'TRIP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6).toUpperCase();

				// 检查用户登录状态
				const token = uni.getStorageSync('uni_id_token');
				if (!token) {
					throw new Error('用户未登录，无法创建订单');
				}

				console.log('[创建订单] 用户已登录，token存在');

				const orderData = {
					order_no: orderNo,
					// user_id 会由 ClientDB 根据当前用户token自动设置
					product_id: this.productId,
					product_snapshot: {
						title: this.productData.title,
						price: this.productData.price,
						images: [this.productData.cover_image || this.productData.product_images?.[0]],
						departure_date: this.selectedDate,
						duration: this.productData.duration_days || 1
					},
					status: 'pending',
					quantity: this.selectedTravelers.length,
					total_amount: this.originalPrice * this.adultCount,
					discount_amount: this.memberDiscount * this.adultCount,
					coupon_discount: this.couponDiscount * this.adultCount,
					member_discount: this.memberDiscount * this.adultCount,
					final_amount: this.totalAmount,
					coupons_used: this.selectedCoupon ? [this.selectedCoupon.id] : [],
					member_level: this.userMemberLevel,
					contact_info: {
						name: this.contactInfo.name,
						phone: this.contactInfo.phone
					},
					travelers: this.selectedTravelers.map((traveler) => ({
						name: traveler.name,
						id_card: traveler.id_card,
						phone: traveler.phone,
						passport: traveler.passport || ''
					})),
					departure_date: this.selectedDate,
					duration_days: this.productData.duration_days || 1
					// 移除 created_at 字段，让数据库根据 schema 自动生成
				};

				console.log('[创建订单] 最终订单数据:', JSON.stringify(orderData, null, 2));

				// 使用云对象创建订单，确保用户认证正确处理
				const orderService = uniCloud.importObject('a-order-service');
				const result = await orderService.createOrder(orderData);

				if (result.errCode === 0) {
					console.log('[订单] 业务订单创建成功:', result.data._id);
					return result.data;
				} else {
					throw new Error(result.errMsg || '订单创建失败');
				}
			} catch (error) {
				console.error('[订单] 创建业务订单失败:', error);
				throw error;
			}
		},

		// 支付成功回调
		onPaySuccess(payResult) {
			console.log('[支付] 支付成功回调:', payResult);

			if (payResult.user_order_success) {
				// 用户已付款，且回调执行成功
				uni.showToast({
					title: '支付成功！',
					icon: 'success',
					duration: 2000
				});

				this.createAlbum(payResult.pay_order.order_no);

				// 延迟跳转到订单详情页
				setTimeout(() => {
					uni.redirectTo({
						url: `/pages/order/order-detail?orderId=${payResult.pay_order.custom.business_order_id}&orderNo=${payResult.pay_order.order_no}`
					});
				}, 2000);
			} else {
				// 用户已付款，但回调执行失败
				uni.showModal({
					title: '支付完成',
					content: '支付已完成，正在处理订单信息，请稍后查看订单状态',
					showCancel: false,
					confirmText: '查看订单',
					success: () => {
						uni.redirectTo({
							url: '/pages/order/order-list'
						});
					}
				});
			}
		},

		// 创建群相册
		async createAlbum(orderId) {
			try {
				// 导入album-service云对象
				const albumService = uniCloud.importObject('album-service', {
					customUI: true // 如果你的云对象需要前端的上下文信息，请保留此项
				});
				// 调用创建相册的方法
				const albumRes = await albumService.createAlbum(orderId);
				if (albumRes.errCode !== 0) {
					// 如果创建相册失败，在云函数日志中记录错误
					console.error(`订单 ${orderId} 创建相册失败:`, albumRes.errMsg);
				}
			} catch (e) {
				// 如果调用云对象本身失败，同样记录错误
				console.error(`调用album-service创建相册时发生异常，订单ID: ${orderId}`, e);
			}

			return {
				errCode: 0,
				errMsg: '创建相册成功'
			};
		},

		// 支付失败回调
		onPayFail(error) {
			console.error('[支付] 支付失败:', error);

			uni.showModal({
				title: '支付失败',
				content: error.errMsg || '支付过程中出现问题，请重试',
				showCancel: true,
				cancelText: '取消',
				confirmText: '重新支付',
				success: (res) => {
					if (res.confirm) {
						// 重新发起支付
						this.submitOrder();
					}
				}
			});
		},

		// 支付取消回调
		onPayCancel() {
			console.log('[支付] 用户取消支付');

			uni.showToast({
				title: '支付已取消',
				icon: 'none',
				duration: 1500
			});
		},

		// 支付组件挂载完成
		onPayMounted(data) {
			console.log('[支付] uni-pay组件挂载完成:', data);
		},

		// 直接触发微信支付
		triggerWxPay(payResult) {
			console.log('[支付] 开始微信支付:', payResult);

			// #ifdef MP-WEIXIN
			// 小程序环境直接调用微信支付
			if (payResult.order) {
				console.log('[支付] 微信支付参数:', payResult.order);
				uni.requestPayment({
					provider: 'wxpay',
					timeStamp: payResult.order.timeStamp,
					nonceStr: payResult.order.nonceStr,
					package: payResult.order.package,
					signType: payResult.order.signType,
					paySign: payResult.order.paySign,
					success: (res) => {
						console.log('[支付] 微信支付成功:', res);
						this.checkPaymentResult(payResult.out_trade_no);
					},
					fail: (err) => {
						console.error('[支付] 微信支付失败:', err);
						this.onPayFail(err);
					}
				});
			} else {
				console.error('[支付] 支付参数缺失:', payResult);
				uni.showToast({
					title: '支付参数错误',
					icon: 'none'
				});
			}
			// #endif

			// #ifdef APP-PLUS
			// APP环境处理
			if (payResult.order) {
				uni.requestPayment({
					provider: 'wxpay',
					orderInfo: payResult.order,
					success: (res) => {
						console.log('[支付] 微信支付成功:', res);
						this.checkPaymentResult(payResult.out_trade_no);
					},
					fail: (err) => {
						console.error('[支付] 微信支付失败:', err);
						this.onPayFail(err);
					}
				});
			}
			// #endif

			// #ifdef H5
			// H5环境处理（二维码或跳转）
			if (payResult.mweb_url) {
				// 跳转到微信H5支付页面
				window.location.href = payResult.mweb_url;
			} else if (payResult.qr_code_image) {
				// 显示二维码支付
				uni.showModal({
					title: '微信扫码支付',
					content: '请使用微信扫描二维码完成支付',
					showCancel: true,
					cancelText: '取消支付',
					confirmText: '支付完成',
					success: (res) => {
						if (res.confirm) {
							this.checkPaymentResult(payResult.out_trade_no);
						} else {
							this.onPayCancel();
						}
					}
				});
			}
			// #endif
		},

		// 检查支付结果
		async checkPaymentResult(outTradeNo) {
			try {
				uni.showLoading({
					title: '确认支付结果...'
				});
				console.log('---------outTradeNo---------', outTradeNo);

				const result = await uniPayCo.getOrder({
					out_trade_no: outTradeNo,
					await_notify: true
				});

				console.log('result: ', result);

				uni.hideLoading();

				if (result.status === 'success' || result.status === 1) {
					this.onPaySuccess(result);
				} else {
					throw new Error('支付状态异常');
				}
			} catch (error) {
				uni.hideLoading();
				console.error('[支付] 检查支付结果失败:', error);
				this.onPayFail(error);
			}
		},

		// ========== 优惠券相关方法 ==========

		// 显示优惠券选择器
		showCouponSelector() {
			console.log('[优惠券] 点击选择优惠券按钮');
			this.tempSelectedCoupon = this.selectedCoupon; // 备份当前选择
			this.showCouponModal = true;
			console.log('[优惠券] 弹窗状态设置为:', this.showCouponModal);
			this.loadCoupons(true); // 显示加载状态
		},

		// 移除当前优惠券
		removeCoupon() {
			this.selectedCoupon = null;
			uni.showToast({
				title: '已取消优惠券',
				icon: 'none',
				duration: 1500
			});
		},

		// 格式化过期日期
		formatExpireDate(dateStr) {
			if (!dateStr) return '长期有效';
			const date = new Date(dateStr);
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			return `${year}.${month}.${day}`;
		},

		// 加载优惠券数据
		async loadCoupons(showLoading = true) {
			try {
				console.log('[优惠券] 开始加载优惠券数据, showLoading:', showLoading);
				if (showLoading) {
					this.loadingCoupons = true;
					console.log('[优惠券] 设置加载状态为true');
				}

				// 检查用户登录状态
				const token = uni.getStorageSync('uni_id_token');
				if (!token) {
					console.log('[优惠券] 用户未登录，使用模拟数据');
					this.setMockCoupons();
					return;
				}

				// 模拟优惠券数据（后续可替换为真实API调用）
				console.log('[优惠券] 模拟网络延迟...');
				await new Promise((resolve) => setTimeout(resolve, 500)); // 模拟网络延迟
				this.setMockCoupons();

				console.log('[优惠券] 加载完成:', {
					available: this.availableCoupons.length,
					unavailable: this.unavailableCoupons.length
				});
			} catch (error) {
				console.error('[优惠券] 加载失败:', error);
				uni.showToast({
					title: '优惠券加载失败',
					icon: 'none'
				});
			} finally {
				if (showLoading) {
					this.loadingCoupons = false;
					console.log('[优惠券] 设置加载状态为false');
				}
			}
		},

		// 设置模拟优惠券数据
		setMockCoupons() {
			const currentAmount = this.totalAmount;

			this.availableCoupons = [
				{
					id: 'coupon1',
					name: '新用户专享',
					type: 'fixed',
					amount: 200,
					min_amount: 1000,
					expire_date: '2024-12-31',
					description: '新用户专享立减券'
				},
				{
					id: 'coupon2',
					name: '限时优惠',
					type: 'fixed',
					amount: 100,
					min_amount: 500,
					expire_date: '2024-06-30',
					description: '限时优惠立减券'
				},
				{
					id: 'coupon3',
					name: '九折优惠',
					type: 'percent',
					amount: 9,
					min_amount: 800,
					expire_date: '2024-09-30',
					description: '九折优惠券'
				}
			].filter((coupon) => {
				// 过滤掉不满足最低金额要求的优惠券
				return currentAmount >= (coupon.min_amount || 0);
			});

			this.unavailableCoupons = [
				{
					id: 'coupon4',
					name: '超级优惠',
					type: 'fixed',
					amount: 500,
					min_amount: 2000,
					expire_date: '2024-08-31',
					description: '超级优惠立减券',
					unavailable_reason: `满${2000}元可用`
				}
			].filter((coupon) => {
				// 不满足条件的优惠券
				return currentAmount < (coupon.min_amount || 0);
			});

			// 自动选择最佳优惠券
			this.selectBestCoupon();
		},

		// 自动选择最佳优惠券
		selectBestCoupon() {
			if (this.availableCoupons.length === 0) {
				console.log('[优惠券] 无可用优惠券，不自动选择');
				this.selectedCoupon = null;
				return;
			}

			const currentAmount = this.totalAmount;
			let bestCoupon = null;
			let maxDiscount = 0;

			// 计算每个优惠券的实际优惠金额
			this.availableCoupons.forEach((coupon) => {
				let discount = 0;

				if (coupon.type === 'fixed') {
					// 立减券：直接减免金额
					discount = coupon.amount;
				} else if (coupon.type === 'percent') {
					// 折扣券：计算折扣金额
					discount = currentAmount * (1 - coupon.amount / 10);
				}

				console.log(`[优惠券] ${coupon.name} 优惠金额: ¥${discount}`);

				// 选择优惠金额最大的券
				if (discount > maxDiscount) {
					maxDiscount = discount;
					bestCoupon = coupon;
				}
			});

			if (bestCoupon) {
				this.selectedCoupon = bestCoupon;
				this.tempSelectedCoupon = bestCoupon; // 同步临时选择
				console.log(`[优惠券] 自动选择最佳优惠券: ${bestCoupon.name}，可省¥${maxDiscount.toFixed(2)}`);

				// 显示提示信息
				setTimeout(() => {
					uni.showToast({
						title: `已为您选择最优惠券：${bestCoupon.name}`,
						icon: 'success',
						duration: 2000
					});
				}, 100);
			} else {
				this.selectedCoupon = null;
				console.log('[优惠券] 未找到最佳优惠券');
			}
		},

		// 选择优惠券（临时选择）
		selectCoupon(coupon) {
			this.tempSelectedCoupon = coupon;
			console.log('[优惠券] 临时选择:', coupon?.name || '不使用优惠券');
		},

		// 关闭优惠券弹窗
		closeCouponModal() {
			console.log('[优惠券] 关闭弹窗');
			this.showCouponModal = false;
			this.tempSelectedCoupon = this.selectedCoupon; // 恢复原来的选择
			console.log('[优惠券] 弹窗状态设置为:', this.showCouponModal);
		},

		// 确认优惠券选择
		confirmCouponSelection() {
			this.selectedCoupon = this.tempSelectedCoupon;
			this.showCouponModal = false;

			if (this.selectedCoupon) {
				uni.showToast({
					title: `已选择${this.selectedCoupon.name}`,
					icon: 'success',
					duration: 1500
				});
				console.log('[优惠券] 确认选择:', this.selectedCoupon.name);
			} else {
				uni.showToast({
					title: '已取消优惠券',
					icon: 'none',
					duration: 1500
				});
				console.log('[优惠券] 取消使用优惠券');
			}
		},

		// 判断是否为最佳选择的优惠券
		isBestChoice(coupon) {
			if (!coupon || this.availableCoupons.length === 0) return false;

			const currentAmount = this.totalAmount;
			let maxDiscount = 0;
			let bestCouponId = null;

			// 计算所有可用优惠券的实际优惠金额
			this.availableCoupons.forEach((c) => {
				let discount = 0;
				if (c.type === 'fixed') {
					discount = c.amount;
				} else if (c.type === 'percent') {
					discount = currentAmount * (1 - c.amount / 10);
				}

				if (discount > maxDiscount) {
					maxDiscount = discount;
					bestCouponId = c.id;
				}
			});

			return coupon.id === bestCouponId;
		}
	}
};
</script>

<style>
.booking-page {
	background-color: #f5f7fa;
	min-height: 100vh;
	position: relative;
}

/* 加载状态 */
.loading-container {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100vh;
	padding: 20px;
}

.loading-text {
	color: #666;
	font-size: 16px;
}

/* 内容区域 */
.content-area {
	padding: 8px 0 120px 0;
}

/* 产品卡片 */
.product-card {
	background-color: white;
	margin: 8px 16px 16px 16px;
	border-radius: 12px;
	padding: 16px;
	display: flex;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.product-image {
	width: 80px;
	height: 80px;
	border-radius: 8px;
	margin-right: 12px;
}

.product-info {
	flex: 1;
}

.product-title {
	font-size: 16px;
	font-weight: 600;
	color: #333;
	margin-bottom: 4px;
	display: block;
}

.product-subtitle {
	font-size: 14px;
	color: #666;
	margin-bottom: 8px;
	display: block;
}

.price-info {
	display: flex;
	align-items: center;
}

.current-price {
	font-size: 18px;
	font-weight: 700;
	color: #ff6b35;
	margin-right: 8px;
}

.original-price {
	font-size: 14px;
	color: #999;
	text-decoration: line-through;
	margin-right: 8px;
}

.savings {
	font-size: 12px;
	background-color: #ffe0d6;
	color: #ff6b35;
	padding: 2px 6px;
	border-radius: 4px;
}

/* 预订区域 */
.booking-section {
	background-color: white;
	margin: 0 16px 8px 16px;
	border-radius: 12px;
	padding: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header {
	display: flex;
	align-items: center;
	margin-bottom: 16px;
}

.section-title {
	font-size: 16px;
	font-weight: 600;
	color: #333;
}

.required {
	color: #f44336;
	margin-left: 4px;
}

.section-action {
	margin-left: auto;
	display: flex;
	align-items: center;
}

.action-text {
	font-size: 14px;
	color: #2196f3;
	margin-right: 4px;
}

/* 日期选择器 */
.date-selector {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px;
	background-color: #f8f9fa;
	border-radius: 8px;
	cursor: pointer;
}

.date-info {
	flex: 1;
}

.date-label {
	font-size: 14px;
	color: #666;
	margin-bottom: 4px;
	display: block;
}

.date-value {
	font-size: 16px;
	color: #333;
	font-weight: 500;
}

.date-value.placeholder {
	color: #999;
}

.arrow-icon {
	color: #999;
	font-size: 14px;
}

/* 出行人选择 */
.section-action {
	margin-left: auto;
	display: flex;
	align-items: center;
	cursor: pointer;
}

.action-text {
	font-size: 14px;
	color: #2196f3;
	margin-right: 4px;
}

.action-icon {
	font-size: 12px;
	color: #2196f3;
}

/* 已选择的出行人 */
.selected-travelers {
	margin-bottom: 16px;
}

.traveler-item.selected {
	background-color: #f8f9fa;
	border-radius: 8px;
	padding: 12px;
	margin-bottom: 8px;
}

.traveler-item.selected:last-child {
	margin-bottom: 0;
}

.remove-traveler {
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background-color: #f44336;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 12px;
	cursor: pointer;
}

.remove-traveler:active {
	background-color: #d32f2f;
}

/* 选择出行人按钮 */
.select-travelers-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 16px;
	background-color: #f8f9fa;
	border-radius: 8px;
	border: 1px dashed #ccc;
	cursor: pointer;
}

.select-travelers-btn:active {
	background-color: #e9ecef;
}

.select-icon {
	font-size: 16px;
	color: #2196f3;
	margin-right: 8px;
}

.select-text {
	font-size: 14px;
	color: #2196f3;
}

.traveler-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 0;
}

.traveler-row:not(:last-child) {
	border-bottom: 1px solid #f0f0f0;
}

.traveler-info {
	flex: 1;
}

.traveler-label {
	font-size: 16px;
	color: #333;
	font-weight: 500;
	margin-bottom: 4px;
	display: block;
}

.traveler-desc {
	font-size: 14px;
	color: #666;
}

.quantity-controls {
	display: flex;
	align-items: center;
}

.quantity-btn {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background-color: #f8f9fa;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #333;
	font-size: 14px;
	cursor: pointer;
}

.quantity-btn:active {
	background-color: #e9ecef;
}

.quantity-value {
	font-size: 16px;
	font-weight: 600;
	color: #333;
	margin: 0 16px;
	min-width: 20px;
	text-align: center;
}

/* 出行人列表 */
.travelers-list {
}

.traveler-item {
	display: flex;
	align-items: center;
	padding: 12px 0;
	border-bottom: 1px solid #f0f0f0;
}

.traveler-item:last-child {
	border-bottom: none;
}

.traveler-avatar {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background-color: #e3f2fd;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 12px;
}

.avatar-text {
	font-size: 16px;
	font-weight: 600;
	color: #1976d2;
}

.traveler-details {
	flex: 1;
}

.traveler-name {
	font-size: 16px;
	color: #333;
	font-weight: 500;
	margin-bottom: 4px;
	display: block;
}

.traveler-phone {
	font-size: 14px;
	color: #666;
}

.traveler-type {
	margin-left: auto;
}

.type-tag {
	font-size: 12px;
	background-color: #f0f0f0;
	color: #666;
	padding: 4px 8px;
	border-radius: 4px;
}

.empty-travelers {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 32px 0;
	cursor: pointer;
}

.empty-icon {
	font-size: 32px;
	color: #ccc;
	margin-bottom: 8px;
}

.empty-text {
	font-size: 14px;
	color: #999;
}

/* 联系人表单 */
.contact-form {
}

.form-row {
	display: flex;
	align-items: center;
	margin-bottom: 16px;
	position: relative;
}

.form-row:last-child {
	margin-bottom: 0;
}

.form-label {
	font-size: 16px;
	color: #333;
	font-weight: 500;
	width: 80px;
	margin-right: 16px;
}

.form-input {
	flex: 1;
	height: 44px;
	background-color: #f8f9fa;
	border-radius: 8px;
	padding: 0 16px;
	font-size: 16px;
	border: none;
}

.form-input.auto-filled {
	background-color: #f0f8ff;
	border: 1px solid #e3f2fd;
}

.edit-icon {
	position: absolute;
	right: 16px;
	color: #2196f3;
	font-size: 14px;
	pointer-events: none;
}

.auto-fill-tip {
	font-size: 12px;
	color: #1976d2;
	margin-left: 8px;
	background-color: #e3f2fd;
	padding: 2px 8px;
	border-radius: 4px;
}

/* 费用明细 */
.price-summary {
}

.price-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.price-label {
	font-size: 14px;
	color: #666;
}

.price-value {
	font-size: 14px;
	color: #333;
	font-weight: 500;
}

.discount-row .price-value {
	color: #f44336;
}

.price-divider {
	height: 1px;
	background-color: #f0f0f0;
	margin: 16px 0;
}

.total-row {
	margin-bottom: 0;
}

.total-row .price-label {
	font-size: 16px;
	color: #333;
	font-weight: 600;
}

.total-price {
	font-size: 18px;
	color: #ff6b35;
	font-weight: 700;
}

/* 底部占位 */
.bottom-placeholder {
	height: 80px;
}

/* 底部支付栏自定义样式 */
.pay-button-disabled {
	opacity: 0.6;
	background-color: #e2e8f0 !important;
	color: #999 !important;
}

/* ========== 优惠券样式 ========== */

/* 弹窗遮罩 */
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
	backdrop-filter: blur(4px);
	animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

/* 已选择的优惠券 */
.selected-coupon {
	margin-bottom: 0;
}

.coupon-item {
	display: flex;
	align-items: center;
	background: linear-gradient(135deg, #ff6b35 0%, #ff8a65 100%);
	border-radius: 12px;
	padding: 16px;
	color: white;
	position: relative;
	overflow: hidden;
}

.coupon-item::before {
	content: '';
	position: absolute;
	right: -10px;
	top: 50%;
	transform: translateY(-50%);
	width: 20px;
	height: 20px;
	background-color: #f5f7fa;
	border-radius: 50%;
}

.coupon-info {
	flex: 1;
}

.coupon-header {
	display: flex;
	align-items: center;
	margin-bottom: 8px;
}

.coupon-name {
	font-size: 16px;
	font-weight: 600;
	margin-right: 8px;
}

.coupon-tag {
	font-size: 10px;
	background-color: rgba(255, 255, 255, 0.2);
	padding: 2px 6px;
	border-radius: 4px;
}

.best-choice-badge {
	display: flex;
	align-items: center;
	background: linear-gradient(135deg, #ffd700, #ffb347);
	color: #b8860b;
	font-size: 9px;
	padding: 2px 5px;
	border-radius: 8px;
	margin-left: 6px;
	box-shadow: 0 1px 3px rgba(255, 215, 0, 0.4);
}

.best-choice-badge .fa {
	font-size: 8px;
	margin-right: 2px;
}

.badge-text {
	font-weight: 600;
	letter-spacing: 0.5px;
}

.coupon-desc,
.coupon-expire {
	font-size: 12px;
	opacity: 0.9;
	margin-bottom: 4px;
	display: block;
}

.coupon-amount {
	display: flex;
	align-items: baseline;
	margin-right: 16px;
}

.amount-symbol {
	font-size: 14px;
	font-weight: 500;
}

.amount-value {
	font-size: 24px;
	font-weight: 700;
}

.remove-coupon {
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background-color: rgba(255, 255, 255, 0.2);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 12px;
}

/* 未选择优惠券的占位 */
.no-coupon-selected {
	margin-bottom: 0;
}

.coupon-placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 16px;
	background-color: #f8f9fa;
	border-radius: 8px;
	border: 1px dashed #ddd;
}

.placeholder-icon {
	font-size: 16px;
	color: #ff6b35;
	margin-right: 8px;
}

.placeholder-text {
	font-size: 14px;
	color: #666;
	flex: 1;
}

.placeholder-arrow {
	font-size: 12px;
	color: #999;
}

/* 优惠券弹窗 */
.coupon-modal {
	width: 90%;
	max-width: 500px;
	max-height: 80vh;
	background-color: white;
	border-radius: 20px;
	overflow: hidden;
	margin: 20px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
	animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
	from {
		transform: translateY(100px);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}

/* 弹窗头部 */
.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20px 24px 16px 24px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	position: relative;
}

.modal-header::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
}

.header-content {
	flex: 1;
}

.modal-title {
	font-size: 18px;
	font-weight: 600;
	margin-bottom: 4px;
	display: block;
}

.modal-subtitle {
	font-size: 13px;
	opacity: 0.9;
	display: block;
}

.close-button {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background-color: rgba(255, 255, 255, 0.15);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 16px;
	transition: all 0.2s ease;
}

.close-button:active {
	background-color: rgba(255, 255, 255, 0.25);
	transform: scale(0.95);
}

.loading-coupons {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40px;
}

.coupons-list {
	max-height: 400px;
	overflow-y: auto;
	padding: 8px 0;
	background: linear-gradient(to bottom, #fafafa, white);
}

.coupons-list::-webkit-scrollbar {
	width: 6px;
}

.coupons-list::-webkit-scrollbar-track {
	background: rgba(0, 0, 0, 0.1);
	border-radius: 3px;
	margin: 10px 0;
}

.coupons-list::-webkit-scrollbar-thumb {
	background: linear-gradient(135deg, #ff6b35, #ff8a65);
	border-radius: 3px;
}

.coupons-list::-webkit-scrollbar-thumb:hover {
	background: linear-gradient(135deg, #e55a2b, #e6785a);
}

/* 优惠券选项 */
.coupon-option {
	display: flex;
	align-items: center;
	padding: 16px;
	margin: 8px 16px;
	border-radius: 12px;
	cursor: pointer;
	transition: all 0.2s ease;
	border: 2px solid transparent;
	background: linear-gradient(white, white) padding-box, linear-gradient(135deg, #ff6b35, #ff8a65) border-box;
	position: relative;
	overflow: hidden;
}

.coupon-option::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(135deg, rgba(255, 107, 53, 0.05), rgba(255, 138, 101, 0.05));
	opacity: 0;
	transition: opacity 0.2s ease;
}

.coupon-option.available:active::before {
	opacity: 1;
}

.coupon-option.selected {
	border-color: #ff6b35;
	box-shadow: 0 4px 20px rgba(255, 107, 53, 0.2);
	transform: translateY(-2px);
}

.coupon-option.selected::before {
	opacity: 1;
}

.coupon-option.unavailable {
	opacity: 0.4;
	cursor: not-allowed;
	filter: grayscale(100%);
}

.coupon-left {
	margin-right: 16px;
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 80px;
}

.coupon-amount-display {
	display: flex;
	align-items: baseline;
	margin-bottom: 4px;
	position: relative;
}

.coupon-amount-display .amount-symbol {
	font-size: 14px;
	color: #ff6b35;
	font-weight: 600;
}

.coupon-amount-display .amount-value {
	font-size: 24px;
	font-weight: 800;
	color: #ff6b35;
	text-shadow: 0 1px 2px rgba(255, 107, 53, 0.2);
}

.coupon-amount-display.disabled .amount-symbol,
.coupon-amount-display.disabled .amount-value {
	color: #ccc;
	text-shadow: none;
}

.coupon-type-label {
	font-size: 10px;
	color: white;
	background: linear-gradient(135deg, #ff6b35, #ff8a65);
	padding: 3px 8px;
	border-radius: 8px;
	font-weight: 500;
	letter-spacing: 0.5px;
	box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
}

.coupon-right {
	flex: 1;
}

.coupon-right .coupon-name {
	font-size: 14px;
	font-weight: 600;
	color: #333;
	margin-bottom: 4px;
	display: block;
}

.coupon-condition,
.coupon-right .coupon-expire {
	font-size: 12px;
	color: #666;
	margin-bottom: 2px;
	display: block;
}

.unavailable-reason {
	font-size: 12px;
	color: #f44336;
	display: block;
}

.disabled {
	color: #ccc !important;
}

.coupon-status {
	margin-left: 16px;
}

.coupon-status .fa {
	font-size: 20px;
	color: #ddd;
}

.coupon-status .fa.selected {
	color: #2196f3;
}

.coupon-status .fa.disabled {
	color: #f0f0f0;
}

/* 不使用优惠券选项 */
.no-coupon-option {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px;
	margin: 8px 16px 16px 16px;
	background: linear-gradient(135deg, #f8f9fa, #ffffff);
	border-radius: 12px;
	cursor: pointer;
	transition: all 0.2s ease;
	border: 2px solid #e0e0e0;
	position: relative;
}

.no-coupon-option:active {
	transform: scale(0.98);
}

.no-coupon-option.selected {
	background: linear-gradient(135deg, #e8f5e8, #f0fff0);
	border-color: #4caf50;
	box-shadow: 0 4px 20px rgba(76, 175, 80, 0.2);
}

.no-coupon-text {
	font-size: 14px;
	color: #666;
	font-weight: 500;
}

.empty-coupons {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40px;
}

.empty-coupons .empty-icon {
	font-size: 32px;
	color: #ddd;
	margin-bottom: 8px;
}

.empty-coupons .empty-text {
	font-size: 14px;
	color: #999;
	margin-bottom: 4px;
}

.empty-coupons .empty-desc {
	font-size: 12px;
	color: #ccc;
}

/* 底部按钮 */
.modal-footer {
	display: flex;
	padding: 16px 24px 24px 24px;
	background-color: #fafafa;
	gap: 12px;
}

.cancel-btn,
.confirm-btn {
	flex: 1;
	height: 48px;
	border-radius: 12px;
	border: none;
	font-size: 16px;
	font-weight: 600;
	transition: all 0.2s ease;
	position: relative;
	overflow: hidden;
}

.cancel-btn {
	background-color: #f5f5f5;
	color: #666;
	border: 1px solid #e0e0e0;
}

.cancel-btn:active {
	background-color: #eeeeee;
	transform: scale(0.98);
}

.confirm-btn {
	background: linear-gradient(135deg, #ff6b35 0%, #ff8a65 100%);
	color: white;
	box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);
}

.confirm-btn:active {
	transform: scale(0.98);
	box-shadow: 0 2px 10px rgba(255, 107, 53, 0.4);
}

.btn-text {
	position: relative;
	z-index: 1;
}
</style>
