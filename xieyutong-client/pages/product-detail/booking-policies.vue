<template>
	<view class="policy-container bg-white min-h-screen">
		<view v-if="loading" class="p-10 text-center text-gray-500">
			<text>加载中...</text>
		</view>

		<view v-else-if="error" class="p-10 text-center text-red-500">
			<text>加载失败: {{ error }}</text>
			<button @click="loadData" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded text-sm">重试</button>
		</view>

		<view v-else-if="bookingPolicyData" class="main-wrapper">
			<view class="fixed-header bg-white">
				<view class="header-top-row" :style="{ paddingTop: statusBarHeight + 'px' }">
					<view class="back-button" @click="goBack">
						<uni-icons type="left" size="22" color="#333"></uni-icons>
					</view>
				</view>
			</view>
			<view class="header-spacer" :style="{ height: fixedHeaderHeight + 'px' }"></view>

			<view
				v-if="bookingPolicyData.travel_agency_info && bookingPolicyData.travel_agency_info.claim"
				class="top-claim bg-gray-50 p-3 text-xs text-orange-500 border-b border-gray-200">
				<text>{{ bookingPolicyData.travel_agency_info.claim }}</text>
			</view>

			<view class="policy-section">
				<text class="section-title">预订限制</text>
				<view class="content-text" v-if="bookingPolicyData.booking_restrictions?.age_limit">
					<text class="sub-section-title">年龄限制：</text>
					<text>{{ bookingPolicyData.booking_restrictions.age_limit }}</text>
				</view>
				<view class="content-text" v-if="bookingPolicyData.booking_restrictions?.group_limit">
					<text class="sub-section-title">人群限制：</text>
					<text>{{ bookingPolicyData.booking_restrictions.group_limit }}</text>
				</view>
				<view class="content-text" v-if="bookingPolicyData.booking_restrictions?.other_limit">
					<text class="sub-section-title">其他限制：</text>
					<text>{{ bookingPolicyData.booking_restrictions.other_limit }}</text>
				</view>
				<view
					v-if="!bookingPolicyData.booking_restrictions?.age_limit && !bookingPolicyData.booking_restrictions?.group_limit && !bookingPolicyData.booking_restrictions?.other_limit"
					class="text-gray-400 text-sm">
					暂无预订限制信息
				</view>
			</view>

			<view class="policy-section">
				<text class="section-title">单人/多人入住政策</text>
				<view class="content-text" v-if="bookingPolicyData.accommodation_policy?.multi_person">
					{{ bookingPolicyData.accommodation_policy.multi_person }}
				</view>
				<view v-else class="text-gray-400 text-sm">暂无入住政策信息</view>
			</view>

			<view class="policy-section">
				<text class="section-title">成团说明</text>
				<view class="content-text" v-if="bookingPolicyData.group_info?.group_description">
					<text class="sub-section-title">成团说明：</text>
					<text>{{ bookingPolicyData.group_info.group_description }}</text>
				</view>
				<view class="content-text" v-if="bookingPolicyData.group_info?.departure_notice">
					<text class="sub-section-title">出团通知：</text>
					<text>{{ bookingPolicyData.group_info.departure_notice }}</text>
				</view>
				<view v-if="!bookingPolicyData.group_info?.group_description && !bookingPolicyData.group_info?.departure_notice" class="text-gray-400 text-sm">暂无成团说明信息</view>
			</view>

			<view class="policy-section">
				<text class="section-title">预订及出行须知</text>
				<view v-if="bookingPolicyData.booking_requirements && bookingPolicyData.booking_requirements.length > 0">
					<view v-for="(item, index) in bookingPolicyData.booking_requirements" :key="index" class="list-item">
						<text>{{ item }}</text>
					</view>
				</view>
				<view v-else class="text-gray-400 text-sm">暂无预订及出行须知信息</view>
			</view>

			<view class="policy-section">
				<text class="section-title">违约条款</text>
				<view v-if="bookingPolicyData.violation_terms?.agency_violation?.length > 0" class="mb-4">
					<text class="sub-section-title">旅行社违约</text>
					<view class="content-text mb-2">{{ bookingPolicyData.violation_terms.agency_violation[0] }}</view>
					<view class="violation-table border border-gray-200 rounded overflow-hidden">
						<view class="table-header flex bg-gray-50">
							<view class="table-cell flex-1 font-medium p-2 border-r border-gray-200 text-center">行程前</view>
							<view class="table-cell flex-1 font-medium p-2 text-center">违约金</view>
						</view>
						<view
							v-for="(item, index) in bookingPolicyData.violation_terms.agency_violation.slice(1, 4)"
							:key="'agency-row-' + index"
							class="table-row flex border-t border-gray-200">
							<view class="table-cell flex-1 p-2 border-r border-gray-200 text-center">{{ splitViolation(item)[0] }}</view>
							<view class="table-cell flex-1 p-2 text-center">{{ splitViolation(item)[1] }}</view>
						</view>
					</view>
					<view v-if="bookingPolicyData.violation_terms.agency_violation.length > 4">
						<view v-for="(item, index) in bookingPolicyData.violation_terms.agency_violation.slice(4)" :key="'agency-extra-' + index" class="content-text mt-2">
							{{ item }}
						</view>
					</view>
				</view>

				<view v-if="bookingPolicyData.violation_terms?.tourist_violation?.length > 0" class="mb-4">
					<text class="sub-section-title">旅游者违约</text>
					<view class="content-text mb-2">{{ bookingPolicyData.violation_terms.tourist_violation[0] }}</view>
					<view class="violation-table border border-gray-200 rounded overflow-hidden">
						<view class="table-header flex bg-gray-50">
							<view class="table-cell flex-1 font-medium p-2 border-r border-gray-200 text-center">行程前</view>
							<view class="table-cell flex-1 font-medium p-2 text-center">违约金</view>
						</view>
						<view
							v-for="(item, index) in bookingPolicyData.violation_terms.tourist_violation.slice(1, 4)"
							:key="'tourist-row-' + index"
							class="table-row flex border-t border-gray-200">
							<view class="table-cell flex-1 p-2 border-r border-gray-200 text-center">{{ splitViolation(item)[0] }}</view>
							<view class="table-cell flex-1 p-2 text-center">{{ splitViolation(item)[1] }}</view>
						</view>
					</view>
					<view v-if="bookingPolicyData.violation_terms.tourist_violation.length > 4">
						<view v-for="(item, index) in bookingPolicyData.violation_terms.tourist_violation.slice(4)" :key="'tourist-extra-' + index" class="content-text mt-2">
							{{ item }}
						</view>
					</view>
				</view>
				<view v-if="!bookingPolicyData.violation_terms?.agency_violation?.length && !bookingPolicyData.violation_terms?.tourist_violation?.length" class="text-gray-400 text-sm">
					暂无违约条款信息
				</view>
			</view>

			<view class="policy-section">
				<text class="section-title">出行指南</text>
				<view v-if="bookingPolicyData.travel_guide && bookingPolicyData.travel_guide.length > 0">
					<view v-for="(item, index) in bookingPolicyData.travel_guide" :key="index" class="list-item">
						<block v-for="(segment, segIndex) in parseContent(item)" :key="segIndex">
							<text v-if="segment.type === 'text'">{{ segment.content }}</text>
							<text v-else-if="segment.type === 'link'" class="link-text" @click="handleLinkClick(segment.url)">{{ segment.content }}</text>
						</block>
					</view>
				</view>
				<view v-else class="text-gray-400 text-sm">暂无出行指南信息</view>
			</view>

			<view class="policy-section">
				<text class="section-title">安全提示</text>
				<view v-if="bookingPolicyData.safety_tips && bookingPolicyData.safety_tips.length > 0">
					<view v-for="(item, index) in bookingPolicyData.safety_tips" :key="index" class="list-item">
						<block v-for="(segment, segIndex) in parseContent(item)" :key="segIndex">
							<text v-if="segment.type === 'text'">{{ segment.content }}</text>
							<text v-else-if="segment.type === 'link'" class="link-text" @click="handleLinkClick(segment.url)">{{ segment.content }}</text>
						</block>
					</view>
				</view>
				<view v-else class="text-gray-400 text-sm">暂无安全提示信息</view>
			</view>

			<view class="policy-section">
				<text class="section-title">保障提示</text>
				<view class="content-text" v-if="bookingPolicyData.protection_tips && bookingPolicyData.protection_tips.length > 0">
					<view v-for="(item, index) in bookingPolicyData.protection_tips" :key="index" class="list-item">
						<text>{{ item }}</text>
					</view>
				</view>
				<view v-else class="text-gray-400 text-sm">暂无保障提示信息</view>
			</view>

			<view class="policy-section">
				<text class="section-title">支付信息</text>
				<view class="content-text" v-if="bookingPolicyData.payment_info?.supported_methods?.length > 0">
					<text class="font-medium">支持的支付方式：</text>
					<text>{{ bookingPolicyData.payment_info.supported_methods.join('、') }}</text>
				</view>
				<view v-else class="text-gray-400 text-sm">暂无支付信息</view>
			</view>

			<view class="policy-section">
				<text class="section-title">常见支付问题</text>
				<view v-if="bookingPolicyData.payment_info?.payment_notes?.length > 0">
					<view v-for="(item, index) in bookingPolicyData.payment_info.payment_notes" :key="index" class="list-item">
						<text>{{ item }}</text>
					</view>
				</view>
				<view v-else class="text-gray-400 text-sm">暂无常见支付问题信息</view>
			</view>
		</view>

		<view v-else class="p-10 text-center text-gray-500">
			<text>未能加载到购买须知信息</text>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		productId: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			statusBarHeight: 0, // 状态栏高度
			loading: true,
			error: null,
			bookingPolicyData: null
		};
	},
	mounted() {
		this.loadData();
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},

		async loadData() {
			this.loading = true;
			this.error = null;
			this.bookingPolicyData = null;

			if (!this.productId) {
				this.error = '缺少 Product ID';
				this.loading = false;
				return;
			}

			// 获取系统信息，设置状态栏高度
			const systemInfo = uni.getSystemInfoSync();
			this.statusBarHeight = systemInfo.statusBarHeight || 0;
			this.fixedHeaderHeight = this.statusBarHeight + 44;
			console.log('[预订须知页] 状态栏高度:', this.statusBarHeight);

			try {
				console.log(`[预订须知页] Loading data for product ID: ${this.productId}`);
				const db = uniCloud.database();
				const res = await db.collection('a-booking-policies').where({ product_id: this.productId }).limit(1).get();

				if (res.result?.data?.length > 0) {
					this.bookingPolicyData = res.result.data[0];
					console.log('[预订须知页] Data loaded successfully:', this.bookingPolicyData);
				} else {
					console.warn(`[预订须知页] No data found for product ID: ${this.productId}`);
					this.bookingPolicyData = {};
				}
			} catch (err) {
				console.error('[预订须知页] Error loading data:', err);
				this.error = err.message || '加载数据时发生错误';
			} finally {
				this.loading = false;
			}
		},

		splitViolation(item) {
			if (!item || typeof item !== 'string') {
				return ['', ''];
			}
			const parts = item.split('|');
			return [parts[0] ? parts[0].trim() : '', parts[1] ? parts[1].trim() : ''];
		},

		parseContent(content) {
			if (!content) return [];
			const segments = [];
			const linkRegex = /\[([^\]]+)\]\((?:.*?<(.+?)>|([^)]+))\)/g;
			let lastIndex = 0;
			let match;

			while ((match = linkRegex.exec(content)) !== null) {
				if (match.index > lastIndex) {
					segments.push({ type: 'text', content: content.substring(lastIndex, match.index) });
				}
				const linkText = match[1];
				const linkUrl = match[2] || match[3];

				if (linkText && linkUrl) {
					segments.push({ type: 'link', content: linkText.trim(), url: linkUrl.trim() });
				} else {
					segments.push({ type: 'text', content: match[0] });
				}

				lastIndex = linkRegex.lastIndex;
			}

			if (lastIndex < content.length) {
				segments.push({ type: 'text', content: content.substring(lastIndex) });
			}
			// console.log('Parsed Segments:', segments); // Debugging
			return segments;
		},

		handleLinkClick(url) {
			console.log('Link clicked, attempting to open URL:', url);
			if (!url) {
				uni.showToast({ title: '无效的链接', icon: 'none' });
				return;
			}

			// #ifdef APP-PLUS || H5
			// Try using uni.openURL first for App/H5
			uni.openURL({
				url: url,
				success: function (res) {
					console.log('Successfully opened URL via uni.openURL');
				},
				fail: function (err) {
					console.error('uni.openURL failed:', err);
					// Fallback for H5/App if openURL fails: Copy to clipboard
					uni.setClipboardData({
						data: url,
						success: () => {
							uni.showToast({ title: '无法直接打开,链接已复制', icon: 'none', duration: 3000 });
						},
						fail: (clipErr) => {
							console.error('Clipboard fallback failed:', clipErr);
							uni.showToast({ title: '打开失败且复制失败', icon: 'none' });
						}
					});
				}
			});
			// #endif

			// #ifdef MP
			// For Mini Programs, directly copy to clipboard
			console.log('Running in Mini Program, copying URL to clipboard.');
			uni.setClipboardData({
				data: url,
				success: () => {
					uni.showToast({ title: '链接已复制,请在浏览器打开', icon: 'none', duration: 3000 });
				},
				fail: (err) => {
					console.error('Clipboard copy failed:', err);
					uni.showToast({ title: '复制链接失败', icon: 'none' });
				}
			});
			// #endif
		}
	}
};
</script>

<style scoped>
.fixed-header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background-color: white;
}

.header-top-row {
	display: flex;
	align-items: center;
	height: 44px;
	padding: 0 16px;
	position: relative;
}

.header-spacer {
	width: 100%;
}

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

.policy-container {
	padding-bottom: 20px;
}

.top-claim {
	line-height: 1.6;
}

.policy-section {
	padding: 16px;
	border-bottom: 8px solid #f3f4f6;
	overflow: visible;
}
.policy-section:last-child {
	border-bottom: none;
}

.section-title {
	font-size: 16px;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 12px;
	display: block;
}

.sub-section-title {
	font-size: 15px;
	font-weight: 500;
	color: #374151;
	margin-bottom: 10px;
	display: block;
	position: relative; /* 相对定位，用于伪元素定位 */
	padding-left: 10px; /* 为侧边条留出空间 */
	line-height: 1.4; /* 确保文字垂直居中 */
}

.sub-section-title::before {
	content: '';
	position: absolute;
	left: 0;
	top: 50%;
	transform: translateY(-50%);
	width: 4px; /* 侧边条宽度 */
	height: 16px; /* 侧边条高度 */
	background-color: #3b82f6; /* 侧边条颜色 (蓝色) */
	border-radius: 2px;
}

.content-text {
	font-size: 14px;
	color: #4b5563;
	line-height: 1.7;
	margin-bottom: 8px;
}
.content-text:last-child {
	margin-bottom: 0;
}

.link-text {
	color: #3b82f6; /* 链接颜色 */
	font-weight: 500; /* 加粗一点表示可点击 */
	cursor: pointer;
}

.list-item {
	font-size: 14px;
	color: #4b5563;
	line-height: 1.7;
	padding-bottom: 10px; /* 添加底部内边距 */
	margin-bottom: 10px; /* 添加底部外边距 */
	border-bottom: 1px solid #f0f0f0; /* 添加分割线 */
	margin-bottom: 10px;
	list-style: none;
	white-space: normal;
	word-break: break-word;
}
.list-item block {
	display: inline; /* 让 block 像 span 一样，允许文本和链接在同一行 */
}
.list-item text {
	display: inline; /* 默认就是 inline，但明确一下 */
}
.list-item:last-child {
	margin-bottom: 0;
	padding-bottom: 0; /* 移除最后一项的内边距 */
	border-bottom: none; /* 移除最后一项的分割线 */
}

.violation-table {
	font-size: 13px;
	color: #4b5563;
}
.table-cell {
	word-break: break-word;
}
.table-header .table-cell {
	color: #1f2937;
}
</style>
