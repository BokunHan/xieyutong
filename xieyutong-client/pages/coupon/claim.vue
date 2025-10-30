<template>
	<view class="min-h-screen bg-gray-50">
		<!-- 顶部导航 -->
		<view class="bg-white shadow-sm">
			<view class="flex items-center justify-between px-4 py-3">
				<view class="flex items-center space-x-3">
					<text class="i-awesome fas fa-ticket text-red-500 text-xl"></text>
					<text class="text-lg font-medium">领取优惠券</text>
				</view>
			</view>
		</view>

		<!-- 加载状态 -->
		<view v-if="loading" class="flex items-center justify-center py-20">
			<view class="flex flex-col items-center space-y-4">
				<view class="animate-spin">
					<text class="i-awesome fas fa-spinner text-blue-500 text-2xl"></text>
				</view>
				<text class="text-gray-500">加载中...</text>
			</view>
		</view>

		<!-- 优惠券信息 -->
		<view v-else-if="couponInfo" class="p-4">
			<!-- 优惠券卡片 -->
			<view class="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-6 text-white shadow-lg mb-6">
				<view class="flex items-center justify-between">
					<view class="flex-1">
						<view class="text-xs opacity-90 mb-1">优惠券</view>
						<view class="text-xl font-bold mb-2">{{ couponInfo.title }}</view>
						<view class="text-sm opacity-90" v-if="couponInfo.description">
							{{ couponInfo.description }}
						</view>
					</view>
					<view class="text-center">
						<view class="text-3xl font-bold">¥{{ couponInfo.amount }}</view>
						<view class="text-xs opacity-90">满{{ couponInfo.min_amount }}元可用</view>
					</view>
				</view>
			</view>

			<!-- 使用说明 -->
			<view class="bg-white rounded-lg p-4 mb-6">
				<view class="flex items-center space-x-2 mb-3">
					<text class="i-awesome fas fa-info-circle text-blue-500"></text>
					<text class="font-medium">使用说明</text>
				</view>
				<view class="space-y-2 text-sm text-gray-600">
					<view class="flex items-center space-x-2">
						<text class="i-awesome fas fa-check text-green-500 text-xs"></text>
						<text>满{{ couponInfo.min_amount }}元可使用</text>
					</view>
					<view class="flex items-center space-x-2">
						<text class="i-awesome fas fa-check text-green-500 text-xs"></text>
						<text>自领取日起{{ couponInfo.valid_days }}天内有效</text>
					</view>
					<view class="flex items-center space-x-2">
						<text class="i-awesome fas fa-check text-green-500 text-xs"></text>
						<text>可在下单时选择使用</text>
					</view>
				</view>
			</view>

			<!-- 领取状态 -->
			<view v-if="claimStatus === 'success'" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
				<view class="flex items-center space-x-2 text-green-700">
					<text class="i-awesome fas fa-check-circle"></text>
					<text class="font-medium">领取成功！</text>
				</view>
				<text class="text-sm text-green-600 mt-2">优惠券已添加到您的账户，可在"我的优惠券"中查看使用。</text>
			</view>

			<view v-else-if="claimStatus === 'already_claimed'" class="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
				<view class="flex items-center space-x-2 text-orange-700">
					<text class="i-awesome fas fa-exclamation-circle"></text>
					<text class="font-medium">您已领取过此优惠券</text>
				</view>
			</view>

			<view v-else-if="claimStatus === 'expired'" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
				<view class="flex items-center space-x-2 text-red-700">
					<text class="i-awesome fas fa-times-circle"></text>
					<text class="font-medium">优惠券已过期或已下架</text>
				</view>
			</view>

			<!-- 操作按钮 -->
			<view class="space-y-3">
				<button
					v-if="claimStatus === 'can_claim'"
					@click="claimCoupon"
					:disabled="claiming"
					class="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-4 rounded-lg font-medium transition-colors">
					<text v-if="claiming">领取中...</text>
					<text v-else>立即领取</text>
				</button>

				<button @click="goToMyCoupons" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-lg font-medium transition-colors">查看我的优惠券</button>

				<button @click="goToHome" class="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-4 rounded-lg font-medium transition-colors">返回首页</button>
			</view>
		</view>

		<!-- 错误状态 -->
		<view v-else class="flex flex-col items-center justify-center py-20 px-4">
			<text class="i-awesome fas fa-exclamation-triangle text-orange-500 text-4xl mb-4"></text>
			<text class="text-lg font-medium text-gray-800 mb-2">优惠券不存在</text>
			<text class="text-gray-500 text-center mb-6">该优惠券链接无效或已过期</text>
			<button @click="goToHome" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg">返回首页</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			loading: true,
			claiming: false,
			couponInfo: null,
			claimStatus: 'can_claim', // can_claim, already_claimed, expired, success
			shareCode: ''
		};
	},

	async onLoad(options) {
		// 从URL参数获取分享码
		this.shareCode = options.code || options.share_code || '';

		// 处理小程序码扫码进入的场景值
		if (!this.shareCode && options.scene) {
			// 场景值格式为 code=GIFT1000
			const sceneParams = this.parseScene(options.scene);
			this.shareCode = sceneParams.code || '';
		}

		if (!this.shareCode) {
			this.loading = false;
			uni.showToast({
				title: '无效的优惠券链接',
				icon: 'none'
			});
			return;
		}

		await this.loadCouponInfo();
	},

	methods: {
		// 解析小程序码场景值
		parseScene(scene) {
			const params = {};
			if (scene) {
				// 场景值可能是 key=value&key2=value2 的格式
				const pairs = scene.split('&');
				pairs.forEach((pair) => {
					const [key, value] = pair.split('=');
					if (key && value) {
						params[key] = decodeURIComponent(value);
					}
				});
			}
			return params;
		},

		// 加载优惠券信息
		async loadCouponInfo() {
			try {
				this.loading = true;

				const result = await uniCloud.callFunction({
					name: 'coupon-service',
					data: {
						action: 'getCouponByShareCode',
						shareCode: this.shareCode,
						uniIdToken: uni.getStorageSync('uni_id_token')
					}
				});

				if (result.result.errCode === 0) {
					this.couponInfo = result.result.data.coupon;
					this.claimStatus = result.result.data.claimStatus;
				} else {
					console.error('获取优惠券信息失败:', result.result.errMsg);
					uni.showToast({
						title: result.result.errMsg || '获取优惠券信息失败',
						icon: 'none'
					});
				}
			} catch (error) {
				console.error('加载优惠券信息失败:', error);
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				});
			} finally {
				this.loading = false;
			}
		},

		// 领取优惠券
		async claimCoupon() {
			// 检查登录状态
			const token = uni.getStorageSync('uni_id_token');
			if (!token) {
				uni.showModal({
					title: '提示',
					content: '请先登录再领取优惠券',
					confirmText: '去登录',
					success: (res) => {
						if (res.confirm) {
							uni.navigateTo({
								url: '/pages/login/login'
							});
						}
					}
				});
				return;
			}

			try {
				this.claiming = true;

				const result = await uniCloud.callFunction({
					name: 'coupon-service',
					data: {
						action: 'claimCoupon',
						shareCode: this.shareCode,
						uniIdToken: token
					}
				});

				if (result.result.errCode === 0) {
					this.claimStatus = 'success';
					uni.showToast({
						title: '领取成功！',
						icon: 'success'
					});
				} else {
					uni.showToast({
						title: result.result.errMsg || '领取失败',
						icon: 'none'
					});

					// 根据错误更新状态
					if (result.result.errCode === 'ALREADY_CLAIMED') {
						this.claimStatus = 'already_claimed';
					} else if (result.result.errCode === 'COUPON_EXPIRED') {
						this.claimStatus = 'expired';
					}
				}
			} catch (error) {
				console.error('领取优惠券失败:', error);
				uni.showToast({
					title: '领取失败，请重试',
					icon: 'none'
				});
			} finally {
				this.claiming = false;
			}
		},

		// 跳转到我的优惠券
		goToMyCoupons() {
			uni.navigateTo({
				url: '/pages/coupon/list'
			});
		},

		// 返回首页
		goToHome() {
			uni.switchTab({
				url: '/pages/home/home'
			});
		}
	}
};
</script>
