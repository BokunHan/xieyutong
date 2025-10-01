<template>
	<view class="page-container">
		<!-- 内容区域 -->
		<view class="content-area">
			<!-- 优惠券标签页 -->
			<view class="coupon-tabs">
				<view 
					class="coupon-tab" 
					v-for="(tab, index) in tabs" 
					:key="index"
					:class="{ active: currentTab === index }"
					@click="switchTab(index)"
				>
					{{ tab.name }}
				</view>
			</view>

			<!-- 新人大礼包提示 -->
			<view class="banner" v-if="currentTab === 0">
				<view class="banner-title">注册即送1000元旅游大礼包</view>
				<view class="banner-desc">真诚无套路，4张优惠券已发放至您的账户</view>
			</view>

			<!-- 优惠券列表 -->
			<view class="coupon-list">
				<!-- 加载状态 -->
				<view v-if="loading" class="loading-container">
					<view class="loading-spinner"></view>
					<view class="loading-text">加载中...</view>
				</view>
				
				<!-- 优惠券卡片 -->
				<view 
					v-else
					class="coupon-card" 
					v-for="(coupon, index) in currentCoupons" 
					:key="index"
					:class="{ 'expired-card': coupon.status === 'expired' }"
				>
					<!-- 特殊标签 -->
					<view v-if="coupon.badge" class="badge" :class="coupon.badgeClass">
						{{ coupon.badge }}
					</view>
					
					<view class="coupon-content">
						<view class="coupon-left">
							<view class="coupon-title">{{ coupon.title }}</view>
							<view class="coupon-desc">{{ coupon.description }}</view>
							<view class="coupon-validity">{{ coupon.validity }}</view>
						</view>
						<view class="coupon-right">
							<view class="coupon-value">¥{{ coupon.value }}</view>
							<view class="coupon-type">{{ coupon.type }}</view>
						</view>
					</view>
					<view class="coupon-footer">
						<view class="coupon-rules" @click="showRules(coupon)">使用规则</view>
						<button 
							class="use-button" 
							:disabled="coupon.status === 'expired'"
							@click="useCoupon(coupon)"
						>
							{{ coupon.status === 'expired' ? '已过期' : '立即使用' }}
						</button>
					</view>
				</view>

				<!-- 空状态 -->
				<view v-if="!loading && currentCoupons.length === 0" class="empty-state">
					<text class="fa fa-ticket-alt empty-icon"></text>
					<view>暂无可用优惠券</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// 标签页数据
const tabs = ref([
	{ name: '可使用', status: 'unused' },
	{ name: '已使用', status: 'used' },
	{ name: '已过期', status: 'expired' }
]);

const currentTab = ref(0);
const loading = ref(false);

// 优惠券数据
const coupons = ref([]);

// 当前显示的优惠券列表
const currentCoupons = computed(() => {
	const status = tabs.value[currentTab.value].status;
	return coupons.value.filter(coupon => coupon.status === status);
});

// 加载优惠券数据
const loadCoupons = async () => {
	try {
		console.log('[优惠券页面] 开始加载优惠券数据');
		loading.value = true;
		
		// 检查登录状态
		const token = uni.getStorageSync('uni_id_token');
		if (!token) {
			console.error('[优惠券页面] 用户未登录');
			uni.navigateTo({
				url: '/pages/login/login'
			});
			return;
		}
		
		// 使用 ClientDB 查询用户优惠券
		const db = uniCloud.database();
		const userCouponsCollection = db.collection('a-user-coupons');
		
		const result = await userCouponsCollection
			.where('user_id == $cloudEnv_uid')
			.field('_id, coupon_id, coupon_code, status, amount, min_amount, title, expired_at, used_at, remark, source_type')
			.orderBy('received_at', 'desc')
			.get();
		
		console.log('[优惠券页面] 数据库查询结果:', result);
		
		if (result.result && result.result.data) {
			const couponData = result.result.data;
			
			// 处理优惠券数据，检查过期状态
			const now = Date.now();
			coupons.value = couponData.map(coupon => {
				let status = coupon.status;
				
				// 检查是否过期
				if (status === 'unused' && coupon.expired_at && coupon.expired_at < now) {
					status = 'expired';
				}
				
				// 格式化过期时间
				const expiredDate = coupon.expired_at ? new Date(coupon.expired_at) : null;
				const validity = expiredDate ? 
					`有效期至：${expiredDate.getFullYear()}-${(expiredDate.getMonth() + 1).toString().padStart(2, '0')}-${expiredDate.getDate().toString().padStart(2, '0')}` 
					: '永久有效';
				
				// 根据来源类型设置徽章
				let badge = '';
				let badgeClass = 'badge';
				if (coupon.source_type === 'new_user_gift') {
					badge = '新人专享';
					badgeClass = 'new-user-badge';
				} else if (coupon.source_type === 'referral_reward') {
					badge = '推荐奖励';
				} else if (coupon.source_type === 'member_upgrade') {
					badge = '会员专享';
				} else if (coupon.source_type === 'activity') {
					badge = '活动专享';
				}
				
				return {
					id: coupon._id,
					couponCode: coupon.coupon_code,
					title: coupon.title || '优惠券',
					description: coupon.min_amount ? `满${coupon.min_amount}元可用` : '无门槛使用',
					validity: validity,
					value: coupon.amount || 0,
					type: coupon.min_amount ? '满减券' : '无门槛券',
					status: status,
					badge: badge,
					badgeClass: badgeClass,
					remark: coupon.remark || ''
				};
			});
			
			console.log('[优惠券页面] 处理后的优惠券数据:', coupons.value);
		} else {
			console.log('[优惠券页面] 暂无优惠券数据');
			coupons.value = [];
		}
		
	} catch (error) {
		console.error('[优惠券页面] 加载优惠券失败:', error);
		uni.showToast({
			title: '加载失败',
			icon: 'none'
		});
		coupons.value = [];
	} finally {
		loading.value = false;
	}
};

// 切换标签页
const switchTab = (index) => {
	currentTab.value = index;
};

// 返回
const goBack = () => {
	uni.navigateBack();
};

// 使用优惠券
const useCoupon = (coupon) => {
	if (coupon.status === 'expired') return;
	
	if (coupon.status === 'unused') {
		// 复制优惠券码到剪贴板
		uni.setClipboardData({
			data: coupon.couponCode,
			success: () => {
				uni.showToast({
					title: '券码已复制',
					icon: 'success'
				});
			}
		});
	} else {
		uni.showModal({
			title: '使用优惠券',
			content: `确定要使用${coupon.title}吗？`,
			success: (res) => {
				if (res.confirm) {
					uni.showToast({
						title: '优惠券使用成功',
						icon: 'success'
					});
				}
			}
		});
	}
};

// 查看使用规则
const showRules = (coupon) => {
	uni.showModal({
		title: '使用规则',
		content: `1. 本券仅限本人使用\n2. 不可与其他优惠同享\n3. 使用前请确认订单金额\n4. 过期自动失效\n5. 券码：${coupon.couponCode}`,
		showCancel: false
	});
};

// 生命周期
onMounted(() => {
	loadCoupons();
});
</script>

<style>


.page-container {
	background-color: #f5f7fa;
	min-height: 100vh;
}



.content-area {
	min-height: 100vh;
}

.coupon-tabs {
	display: flex;
	background-color: white;
	border-bottom: 1px solid #f0f0f0;
	position: sticky;
	z-index: 5;
}

.coupon-tab {
	flex: 1;
	text-align: center;
	padding: 12px 0;
	font-size: 13px;
	color: #666;
	position: relative;
}

.coupon-tab.active {
	color: #0086F6;
	font-weight: 500;
}

.coupon-tab.active::after {
	content: "";
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 20px;
	height: 3px;
	background-color: #0086F6;
	border-radius: 1.5px;
}

.banner {
	background: linear-gradient(135deg, #FF9500, #FF5E3A);
	color: white;
	padding: 16px;
	margin: 12px;
	border-radius: 12px;
	text-align: center;
}

.banner-title {
	font-size: 18px;
	font-weight: bold;
	margin-bottom: 8px;
}

.banner-desc {
	font-size: 14px;
	opacity: 0.9;
}

.coupon-card {
	background-color: white;
	margin: 12px;
	border-radius: 12px;
	overflow: hidden;
	position: relative;
}

.coupon-card::before {
	content: "";
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	width: 6px;
	background-color: #FF9500;
	border-top-left-radius: 12px;
	border-bottom-left-radius: 12px;
}

.coupon-content {
	padding: 16px;
	display: flex;
}

.coupon-left {
	flex: 3;
	padding-right: 16px;
}

.coupon-right {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	border-left: 1px dashed #e0e0e0;
	padding-left: 16px;
}

.coupon-value {
	font-size: 24px;
	font-weight: bold;
	color: #FF9500;
	margin-bottom: 4px;
}

.coupon-type {
	font-size: 12px;
	color: #FF9500;
}

.coupon-title {
	font-size: 16px;
	font-weight: 600;
	color: #333;
	margin-bottom: 8px;
}

.coupon-desc {
	font-size: 12px;
	color: #666;
	margin-bottom: 8px;
}

.coupon-validity {
	font-size: 12px;
	color: #999;
}

.coupon-footer {
	padding: 10px 16px;
	border-top: 1px solid #f0f0f0;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.coupon-rules {
	font-size: 12px;
	color: #0086F6;
}

.use-button {
	background-color: #FF9500;
	color: white;
	border-radius: 9999px;
	padding: 6px 16px;
	font-size: 13px;
	border: none;
}

.use-button:disabled {
	background-color: #ccc;
	color: #999;
}

.expired-card {
	filter: grayscale(1);
	opacity: 0.7;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 300px;
	color: #999;
}

.empty-icon {
	font-size: 48px;
	margin-bottom: 16px;
	color: #ccc;
}

.badge {
	position: absolute;
	top: -8px;
	right: -8px;
	background-color: #FF3B30;
	color: white;
	font-size: 10px;
	padding: 2px 6px;
	border-radius: 10px;
	font-weight: bold;
}

.new-user-badge {
	position: absolute;
	top: 12px;
	right: 12px;
	background-color: #FF3B30;
	color: white;
	font-size: 10px;
	padding: 2px 6px;
	border-radius: 10px;
	font-weight: bold;
}

/* 加载状态样式 */
.loading-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 200px;
	color: #999;
}

.loading-spinner {
	width: 32px;
	height: 32px;
	border: 3px solid #f0f0f0;
	border-top: 3px solid #FF9500;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin-bottom: 12px;
}

.loading-text {
	font-size: 14px;
	color: #999;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}
</style> 