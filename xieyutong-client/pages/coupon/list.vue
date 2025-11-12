<template>
	<view class="min-h-screen bg-gray-50">
		<!-- 顶部导航 -->
		<view class="bg-white shadow-sm" :style="{ paddingTop: statusBarHeight + 40 + 'rpx' }">
			<view class="flex items-center justify-between px-4 py-3">
				<view class="flex items-center space-x-3">
					<!-- <text class="i-awesome fas fa-arrow-left text-gray-600 text-lg" @click="goBack"></text> -->
					<image src="/static/icons/arrow-left.svg" class="w-5 h-5 mr-3" mode="aspectFit" @click="goBack" />
					<text class="text-lg font-medium">我的优惠券</text>
				</view>
			</view>
		</view>

		<!-- 状态切换标签 -->
		<view class="bg-white px-4 py-3 border-b border-gray-100">
			<view class="flex space-x-1">
				<button
					v-for="tab in statusTabs"
					:key="tab.value"
					@click="switchStatus(tab.value)"
					:class="[
						'flex-1 py-2 px-3 rounded-lg text-center text-sm font-medium transition-colors',
						currentStatus === tab.value ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
					]">
					{{ tab.label }}
				</button>
			</view>
		</view>

		<!-- 优惠券列表 -->
		<view class="p-4">
			<!-- 加载状态 -->
			<view v-if="loading" class="flex items-center justify-center py-20">
				<view class="flex flex-col items-center space-y-4">
					<view class="animate-spin">
						<!-- <text class="i-awesome fas fa-spinner text-blue-500 text-2xl"></text> -->
						<image src="/static/icons/spinner.svg" class="w-5 h-5" mode="aspectFit" />
					</view>
					<text class="text-gray-500">加载中...</text>
				</view>
			</view>

			<!-- 优惠券列表 -->
			<view v-else-if="couponList.length > 0" class="space-y-3">
				<view
					v-for="coupon in couponList"
					:key="coupon._id"
					:class="['bg-white rounded-lg shadow-sm overflow-hidden', coupon.status === 'expired' ? 'opacity-60' : '', coupon.status === 'used' ? 'opacity-70' : '']">
					<!-- 优惠券卡片 -->
					<view class="flex">
						<!-- 左侧优惠金额 -->
						<view
							:class="[
								'w-24 flex flex-col items-center justify-center text-white relative',
								coupon.status === 'unused' ? 'bg-gradient-to-b from-red-500 to-red-600' : 'bg-gray-400'
							]">
							<text class="text-lg font-bold">¥{{ coupon.amount }}</text>
							<text class="text-xs opacity-90">优惠券</text>

							<!-- 圆形切口效果 -->
							<view class="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full"></view>
						</view>

						<!-- 右侧详细信息 -->
						<view class="flex-1 p-4">
							<view class="flex items-start justify-between">
								<view class="flex-1">
									<view class="text-base font-medium text-gray-800 mb-1">{{ coupon.title }}</view>
									<view class="text-sm text-gray-500 mb-2">满{{ coupon.min_amount }}元可用</view>

									<!-- 状态和时间信息 -->
									<view class="flex items-center space-x-4 text-xs">
										<view class="text-gray-400">{{ formatTime(coupon.received_at) }}</view>
										<view v-if="coupon.status === 'unused'" class="flex items-center space-x-1 text-orange-600">
											<!-- <text class="i-awesome fas fa-clock"></text> -->
											<image src="/static/icons/clock.svg" class="w-3 h-3 mr-1" mode="aspectFit" />
											<text>{{ formatExpireTime(coupon.expired_at) }}</text>
										</view>
										<view v-else-if="coupon.status === 'used'" class="flex items-center space-x-1 text-green-600">
											<!-- <text class="i-awesome fas fa-check-circle"></text> -->
											<image src="/static/icons/check-circle.svg" class="w-3 h-3 mr-1" mode="aspectFit" />
											<text>已使用</text>
										</view>
										<view v-else class="flex items-center space-x-1 text-gray-500">
											<!-- <text class="i-awesome fas fa-times-circle"></text> -->
											<image src="/static/icons/times-circle.svg" class="w-3 h-3 mr-1" mode="aspectFit" />
											<text>已过期</text>
										</view>
									</view>
								</view>

								<!-- 状态标签 -->
								<view
									v-if="coupon.status !== 'unused'"
									:class="['px-2 py-1 rounded text-xs', coupon.status === 'used' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500']">
									{{ getStatusText(coupon.status) }}
								</view>
							</view>

							<!-- 优惠券码 -->
							<view v-if="coupon.coupon_code" class="mt-3 pt-3 border-t border-gray-100">
								<view class="flex items-center justify-between">
									<text class="text-xs text-gray-500">券码：{{ coupon.coupon_code }}</text>
									<!-- <button @click="copyCouponCode(coupon.coupon_code)" class="text-xs text-blue-500 hover:text-blue-600">复制</button> -->
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 空状态 -->
			<view v-else class="flex flex-col items-center justify-center py-20">
				<!-- <text class="i-awesome fas fa-ticket text-gray-300 text-4xl mb-4"></text> -->
				<image src="/static/icons/ticket-alt.svg" class="w-12 h-12 mb-4" mode="aspectFit" />
				<text class="text-gray-500 mb-2">{{ getEmptyText() }}</text>
				<text class="text-sm text-gray-400 text-center">{{ getEmptySubText() }}</text>
			</view>

			<!-- 加载更多 -->
			<view v-if="hasMore && !loading" class="flex justify-center py-4">
				<button @click="loadMore" :disabled="loadingMore" class="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 text-gray-600 px-6 py-2 rounded-lg text-sm">
					<text v-if="loadingMore">加载中...</text>
					<text v-else>加载更多</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 0,
			loading: true,
			loadingMore: false,
			currentStatus: 'all',
			couponList: [],
			hasMore: false,
			pageIndex: 1,
			statusTabs: [
				{ label: '全部', value: 'all' },
				{ label: '未使用', value: 'unused' },
				{ label: '已使用', value: 'used' },
				{ label: '已过期', value: 'expired' }
			]
		};
	},

	async onLoad() {
		// 获取系统信息中的状态栏高度
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;

		await this.loadCoupons();
	},

	onPullDownRefresh() {
		this.refreshCoupons();
	},

	onReachBottom() {
		if (this.hasMore && !this.loading && !this.loadingMore) {
			this.loadMore();
		}
	},

	methods: {
		// 切换状态标签
		async switchStatus(status) {
			if (this.currentStatus === status) return;

			this.currentStatus = status;
			this.pageIndex = 1;
			this.couponList = [];
			await this.loadCoupons();
		},

		// 加载优惠券列表
		async loadCoupons() {
			try {
				this.loading = true;

				const token = uni.getStorageSync('uni_id_token');
				if (!token) {
					uni.showModal({
						title: '提示',
						content: '请先登录查看优惠券',
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

				const result = await uniCloud.callFunction({
					name: 'coupon-service',
					data: {
						action: 'getUserCoupons',
						uniIdToken: token,
						status: this.currentStatus,
						pageIndex: this.pageIndex,
						pageSize: 20
					}
				});

				console.log(result);

				if (result.result.errCode === 0) {
					const newData = result.result.data.list || [];

					if (this.pageIndex === 1) {
						this.couponList = newData;
					} else {
						this.couponList.push(...newData);
					}

					this.hasMore = result.result.data.hasMore;
				} else {
					console.error('获取优惠券列表失败:', result.result.errMsg);
					uni.showToast({
						title: result.result.errMsg || '获取优惠券失败',
						icon: 'none'
					});
				}
			} catch (error) {
				console.error('加载优惠券列表失败:', error);
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				});
			} finally {
				this.loading = false;
				uni.stopPullDownRefresh();
			}
		},

		// 刷新列表
		async refreshCoupons() {
			this.pageIndex = 1;
			this.couponList = [];
			await this.loadCoupons();
		},

		// 加载更多
		async loadMore() {
			this.loadingMore = true;
			this.pageIndex++;
			await this.loadCoupons();
			this.loadingMore = false;
		},

		// 复制优惠券码
		copyCouponCode(code) {
			uni.setClipboardData({
				data: code,
				success: () => {
					uni.showToast({
						title: '券码已复制',
						icon: 'success'
					});
				}
			});
		},

		// 格式化过期时间
		formatExpireTime(timestamp) {
			const expireDate = new Date(timestamp);
			const now = new Date();
			const diffTime = expireDate.getTime() - now.getTime();
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			if (diffDays < 0) {
				return '已过期';
			} else if (diffDays === 0) {
				return '今天过期';
			} else if (diffDays === 1) {
				return '明天过期';
			} else if (diffDays <= 7) {
				return `${diffDays}天后过期`;
			} else {
				return `${expireDate.getFullYear()}-${String(expireDate.getMonth() + 1).padStart(2, '0')}-${String(expireDate.getDate()).padStart(2, '0')} 过期`;
			}
		},

		// 格式化时间
		formatTime(timestamp) {
			const date = new Date(timestamp);
			return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
		},

		// 获取状态文本
		getStatusText(status) {
			const statusMap = {
				unused: '未使用',
				used: '已使用',
				expired: '已过期'
			};
			return statusMap[status] || status;
		},

		// 获取空状态文本
		getEmptyText() {
			const emptyTextMap = {
				all: '还没有优惠券',
				unused: '没有可用优惠券',
				used: '没有已使用的优惠券',
				expired: '没有过期的优惠券'
			};
			return emptyTextMap[this.currentStatus] || '没有优惠券';
		},

		// 获取空状态副文本
		getEmptySubText() {
			const subTextMap = {
				all: '快去领取优惠券，享受更多优惠吧！',
				unused: '快去领取优惠券，或查看其他状态的券',
				used: '使用优惠券购买商品后会在这里显示',
				expired: '过期的优惠券会在这里显示'
			};
			return subTextMap[this.currentStatus] || '';
		},

		// 返回上一页
		goBack() {
			uni.navigateBack({
				fail: () => {
					uni.switchTab({
						url: '/pages/home/home'
					});
				}
			});
		}
	}
};
</script>
