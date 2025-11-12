<template>
	<view v-if="visible" class="modal-overlay" @click.stop="closeModal(false)">
		<view class="modal-container" @click.stop>
			<view class="modal-header-deco">
				<view class="header-content">
					<text class="main-header">新优惠</text>
					<text class="header-title">券到账啦！</text>
				</view>
			</view>

			<view class="modal-body">
				<view class="coupon-detail-item">
					<text class="dot"></text>
					<text class="detail-text">{{ coupon.description || '全场通用，部分商品除外' }}</text>
				</view>
				<view v-for="(item, index) in couponList" :key="item._id || index" class="coupon-ticket-display">
					<view class="ticket-left">
						<text class="ticket-currency">¥</text>
						<text class="ticket-amount">{{ item.amount }}</text>
					</view>
					<view class="ticket-right">
						<text class="ticket-title">{{ item.title }}</text>
						<text class="ticket-subtitle">{{ item.min_amount ? `满${item.min_amount}可用` : '无门槛使用' }}</text>
						<text class="ticket-expiry">{{ formatExpiryDate(item.expired_at) }}</text>
					</view>
					<view class="ticket-dash-line"></view>
				</view>
			</view>

			<view class="modal-actions">
				<button class="action-btn-secondary" @click="closeModal(false)">知道了</button>
				<button class="action-btn-primary" @click="confirmModal">去查看</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		visible: {
			type: Boolean,
			default: false
		},
		couponList: {
			type: Array,
			default: () => []
		}
	},
	computed: {
		coupon() {
			return this.couponList.length > 0 ? this.couponList[0] : {};
		}
	},
	methods: {
		closeModal(isConfirm) {
			if (isConfirm) {
				this.$emit('confirm');
			} else {
				this.$emit('close');
			}
		},
		confirmModal() {
			this.closeModal(true);
			uni.navigateTo({
				url: '/pages/coupon/list'
			});
		},
		formatExpiryDate(timestamp) {
			if (!timestamp) return '日期无效';
			try {
				const date = new Date(timestamp);
				const y = date.getFullYear();
				const m = (date.getMonth() + 1).toString().padStart(2, '0');
				const d = date.getDate().toString().padStart(2, '0');
				return `有效期至 ${y}-${m}-${d}`;
			} catch (e) {
				return '日期无效';
			}
		}
	}
};
</script>

<style scoped>
/* 遮罩层 */
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
	animation: fadeIn 0.3s ease forwards;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

/* 弹窗容器 */
.modal-container {
	width: 85%;
	max-width: 340px;
	background-color: #fff;
	border-radius: 12px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
	position: relative;
	animation: scaleIn 0.3s ease-out forwards;
	transform-origin: center;
	overflow: hidden; /* 防止内容溢出圆角 */
}

@keyframes scaleIn {
	from {
		transform: scale(0.8);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
}

/* 顶部装饰图和信息 */
.modal-header-deco {
	position: relative;
	width: 100%;
	height: 140px; /* 根据背景图调整高度 */
	background-color: #eb6d20; /* 备用背景色 */
	/* background: linear-gradient(135deg, #fff7f0 0%, #fdecdc 100%); */
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
}

.header-content {
	position: relative;
	z-index: 2;
	display: flex;
	align-items: baseline;
	color: white;
	text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.main-header {
	font-size: 48px;
	font-weight: 800;
	line-height: 1;
	margin-right: 10px;
}

.header-title {
	font-size: 20px;
	font-weight: 600;
	color: #222; /* “券到账啦！”的颜色 */
}

/* 弹窗主体内容 */
.modal-body {
	padding: 16px 24px 24px;
	background-color: #fff;
	position: relative;
	z-index: 3;
}

.coupon-detail-item {
	display: flex;
	align-items: flex-start;
	margin-bottom: 8px;
}

.dot {
	width: 6px;
	height: 6px;
	background-color: #ff6b35;
	border-radius: 50%;
	margin-top: 6px;
	margin-right: 8px;
	flex-shrink: 0;
}

.detail-text {
	font-size: 13px;
	color: #666;
	line-height: 1.6;
}

/* 优惠券展示卡片 */
.coupon-ticket-display {
	display: flex;
	width: 100%;
	height: 80px;
	background-color: #fff;
	border-radius: 6px;
	border: 1px solid #ffede3;
	margin-top: 16px;
	position: relative;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.ticket-left {
	width: 30%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background-color: #fff4ed;
	color: #eb6d20;
	padding-right: 5px;
	position: relative;
}
.ticket-currency {
	font-size: 16px;
	font-weight: 600;
	margin-bottom: -4px;
}
.ticket-amount {
	font-size: 30px;
	font-weight: 700;
	line-height: 1;
}

.ticket-right {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding-left: 15px;
	color: #333;
}
.ticket-title {
	font-size: 14px;
	font-weight: 600;
	margin-bottom: 4px;
}
.ticket-subtitle {
	font-size: 12px;
	color: #999;
	margin-bottom: 4px;
}
.ticket-expiry {
	font-size: 11px;
	color: #aaa;
}

/* 虚线分割 */
.ticket-dash-line {
	position: absolute;
	left: 30%; /* 与ticket-left宽度一致 */
	top: 0;
	bottom: 0;
	width: 2px; /* 虚线宽度 */
	background-image: linear-gradient(to bottom, #ffc3a8 50%, transparent 50%);
	background-size: 100% 10px; /* 虚线高度和间隔 */
	z-index: 1;
}
.ticket-dash-line::before,
.ticket-dash-line::after {
	content: '';
	position: absolute;
	left: -8px; /* 圆点一半的宽度 */
	width: 16px;
	height: 16px;
	background-color: #fff; /* 与背景色一致 */
	border-radius: 50%;
	border: 1px solid #ffede3; /* 小圆点边框 */
	box-sizing: border-box;
	z-index: 2;
}
.ticket-dash-line::before {
	top: -8px; /* 向上偏移一半高度 */
}
.ticket-dash-line::after {
	bottom: -8px; /* 向下偏移一半高度 */
}

/* 底部按钮组 */
.modal-actions {
	display: flex;
	padding: 16px 24px;
	border-top: 1px solid #f0f0f0;
}

.action-btn-secondary,
.action-btn-primary {
	flex: 1;
	height: 40px;
	border-radius: 20px;
	font-size: 15px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 8px; /* 按钮间距 */
	box-sizing: border-box;
}

.action-btn-secondary {
	background-color: #f0f0f0;
	color: #666;
	border: none;
}

.action-btn-primary {
	/* background: linear-gradient(90deg, #ff6b35 0%, #e53e3e 100%); */
	background-color: #eb6d20;
	color: white;
	border: none;
	box-shadow: 0 4px 10px rgba(255, 107, 53, 0.3);
}
</style>
