<template>
	<view class="min-h-screen bg-gray-50">
		<view v-if="!checkComplete || !isGuide" class="flex flex-col items-center justify-center h-screen bg-white">
			<view class="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></view>
			<text class="mt-4 text-gray-500 text-sm">正在验证身份...</text>
		</view>

		<view v-else class="pb-safe">
			<view class="h-64 w-full absolute top-0 left-0 z-0 bg-gradient-to-b from-gray-200 to-gray-50"></view>

			<view class="relative z-10 px-4 pt-12 mb-4">
				<view class="bg-white rounded-3xl shadow-xl overflow-hidden relative transition-all duration-500">
					<view class="absolute bottom-0 left-0 w-48 h-48 bg-brand-orange opacity-5 rounded-full -ml-10 -mb-10 blur-3xl pointer-events-none"></view>

					<view class="p-6 flex items-center justify-between relative z-20">
						<view class="flex items-center">
							<view class="w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-brand-orange to-gray-300 mr-4 shadow-lg">
								<image :src="userInfo.personal_photo" mode="aspectFill" class="w-full h-full rounded-full border-2 border-white"></image>
							</view>

							<view class="flex flex-col">
								<view class="flex items-center">
									<text class="text-xl font-bold text-gray-900 mr-2">{{ userInfo.real_name || '司导' }}</text>
									<view
										class="px-2 py-1 rounded-lg text-xs font-bold leading-none border backdrop-blur-md"
										:class="userInfo.rank === 'excellent' ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-gray-100 border-gray-200 text-gray-500'">
										{{ userInfo.rank === 'excellent' ? '优秀私导' : '普通私导' }}
									</view>
								</view>

								<view
									class="mt-2 self-start inline-flex items-center justify-center px-3 py-1.5 rounded-full border transition-all duration-300 active:scale-95"
									:class="currentStatusObj.styleClass"
									@click="changeWorkStatus">
									<view class="w-1.5 h-1.5 rounded-full mr-2 animate-pulse" :class="currentStatusObj.dotClass"></view>
									<text class="text-xs font-semibold mr-1">{{ currentStatusObj.text }}</text>
									<uni-icons type="bottom" size="10" class="opacity-60" style="color: inherit"></uni-icons>
								</view>
							</view>
						</view>

						<view class="flex flex-col space-x-4">
							<view class="flex gap-2 items-end justify-end">
								<view class="text-xs text-gray-500 mb-1">本月接单</view>
								<view class="text-xl font-bold font-din text-gray-900">{{ stats.monthOrders }}</view>
							</view>
							<view class="flex gap-2 items-end justify-end">
								<view class="text-xs text-gray-500 mb-1">本月完成</view>
								<view class="text-xl font-bold font-din text-gray-900">{{ stats.monthCompleted }}</view>
							</view>
						</view>
					</view>

					<view class="relative" style="min-height: 220px">
						<view
							class="px-4 pt-1 absolute inset-0 flex flex-col justify-between transition-all duration-500 transform overflow-hidden"
							:class="isFlipped ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100 z-10'">
							<view class="flex justify-between items-end flex-shrink-0">
								<view>
									<view class="flex items-baseline">
										<text class="text-5xl font-bold font-din text-gray-900 tracking-tight">{{ assessmentData.total_score || '0.0' }}</text>
										<text class="text-sm text-gray-400 font-normal ml-1">分</text>
										<text class="text-xs text-gray-100 bg-brand-orange/10 px-2 py-0.5 rounded ml-3">第 {{ myRank }} 名</text>
									</view>
								</view>

								<view
									@click.stop="isFlipped = true"
									class="mb-2 h-8 px-3 flex items-center justify-center rounded-full bg-brand-orange active:bg-brand-orange__70 transition-colors cursor-pointer group">
									<uni-icons type="list" size="16" color="#fff"></uni-icons>
								</view>
							</view>

							<scroll-view scroll-y class="mt-4 flex-1 h-0 w-full" :enable-flex="true">
								<view class="space-y-3 pb-2">
									<view v-for="(dim, index) in assessmentData.dimensions || []" :key="dim.key || index" class="flex items-center text-xs mb-3 last:mb-0">
										<text class="w-11 text-gray-500 truncate text-[10px]">{{ dim.name }}</text>
										<view class="flex-1 h-1.5 bg-gray-300 rounded-full mx-2 overflow-hidden">
											<view
												class="h-full rounded-full shadow-lg transition-all duration-1000 relative"
												:class="getBarColor(dim.score, dim.weight)"
												:style="{ width: getProgressWidth(dim.weighted_score, dim.weight) }">
												<view class="absolute top-0 left-0 w-full h-[1px] bg-white/30"></view>
											</view>
										</view>
										<view class="w-10 text-right font-din flex items-baseline justify-end">
											<text class="text-gray-900 font-bold mx-1">{{ (dim.score / 100) * dim.weight }}</text>
											<text class="text-gray-400 text-[10px]">/{{ dim.weight }}</text>
										</view>
									</view>
									<view v-if="!assessmentData.dimensions || assessmentData.dimensions.length === 0" class="text-center text-gray-400 text-xs py-2">暂无维度评分数据</view>
								</view>
							</scroll-view>
						</view>

						<view
							class="absolute inset-0 w-full h-full flex flex-col bg-white/95 backdrop-blur-md transition-all duration-500 transform overflow-hidden"
							:class="!isFlipped ? 'opacity-0 scale-105 pointer-events-none translate-x-4' : 'opacity-100 scale-100 translate-x-0 z-20'">
							<view class="px-6 py-3 flex justify-between items-center border-b border-gray-100 relative z-10">
								<text class="text-sm font-bold text-gray-900">本月排行榜</text>

								<view
									@click.stop="isFlipped = false"
									class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 border border-gray-100 active:bg-gray-50 transition-all">
									<uni-icons type="closeempty" size="16" color="#9ca3af"></uni-icons>
								</view>
							</view>

							<scroll-view scroll-y class="flex-1 h-0 w-full relative z-10" :enable-flex="true">
								<view class="px-4 py-2">
									<view v-for="(item, idx) in rankingList" :key="idx" class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
										<view class="flex items-center space-x-3">
											<view class="w-6 text-center font-din font-bold" :class="idx < 3 ? 'text-brand-orange text-lg' : 'text-gray-400 text-sm'">
												{{ idx + 1 }}
											</view>
											<view class="flex items-center">
												<image :src="item.avatar || '/static/default-avatar.png'" class="w-8 h-8 rounded-full bg-gray-200 mr-2"></image>
												<view class="flex flex-col">
													<view class="flex items-center">
														<text class="text-sm text-gray-600" :class="{ 'font-bold text-gray-900 text-base': item.isMe }">{{ item.real_name }}</text>

														<view v-if="item.isMe" class="ml-2 px-2 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 shadow-sm flex items-center justify-center">
															<text class="text-white font-bold text-xs leading-none">我</text>
														</view>
													</view>
												</view>
											</view>
										</view>
										<text class="font-din font-bold" :class="item.isMe ? 'text-brand-orange text-lg' : 'text-gray-400'">
											{{ item.total_score }}
										</text>
									</view>
									<view class="h-8"></view>
								</view>
							</scroll-view>
						</view>
					</view>
				</view>

				<view class="px-2 mb-2 mt-8">
					<view class="flex items-center space-x-6">
						<view
							v-for="(tab, index) in tabs"
							:key="index"
							class="text-lg font-bold pb-2 relative transition-all"
							:class="currentTab === index ? 'text-gray-900' : 'text-gray-400 font-normal'"
							@click="switchTab(index)">
							{{ tab.name }}
							<view v-if="currentTab === index" class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-brand-orange rounded-full"></view>
						</view>
					</view>
				</view>

				<view class="pb-4">
					<view v-if="loading" class="py-10 flex justify-center">
						<view class="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></view>
					</view>

					<view v-else-if="orders.length === 0" class="bg-white rounded-xl py-20 flex flex-col items-center justify-center text-gray-400 shadow-sm border border-gray-100">
						<image src="/static/icons/file-text.svg" class="w-16 h-16 mb-4 opacity-50" mode="aspectFit" />
						<text class="text-sm">暂无{{ tabs[currentTab].name }}订单</text>
					</view>

					<view v-else class="space-y-3">
						<view v-for="(order, index) in orders" :key="index" class="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100" @click="goToOrderDetail(order)">
							<view class="relative h-32 w-full">
								<image :src="order.image" mode="aspectFill" class="w-full h-full"></image>
								<view class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></view>
								<view class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">{{ order.travelers }}人团</view>
								<view class="absolute bottom-2 left-3 right-3 text-white font-bold text-lg truncate">
									{{ order.title }}
								</view>
							</view>

							<view class="px-3 pt-3 flex justify-between items-center text-sm text-gray-600">
								<view class="flex items-center">
									<uni-icons type="calendar" size="14" color="#9ca3af" class="mr-1"></uni-icons>
									{{ order.departureDate }}
								</view>
							</view>

							<view class="px-3 py-3 flex justify-between items-center">
								<view class="flex space-x-2 w-full">
									<view class="flex-1 flex flex-col items-center justify-center py-1 active:bg-gray-50 rounded" @click.stop="showInviteQr(order)">
										<uni-icons type="scan" size="20" color="#eb6d20" class="mb-1"></uni-icons>
										<text class="text-xs text-gray-600">邀请</text>
									</view>
									<view class="flex-1 flex flex-col items-center justify-center py-1 active:bg-gray-50 rounded" @click.stop="viewItinerary(order)">
										<uni-icons type="map" size="20" color="#eb6d20" class="mb-1"></uni-icons>
										<text class="text-xs text-gray-600">查看行程</text>
									</view>
									<view class="flex-1 flex flex-col items-center justify-center py-1 active:bg-gray-50 rounded" @click.stop="manageSupplies(order)">
										<uni-icons type="list" size="20" color="#eb6d20" class="mb-1"></uni-icons>
										<text class="text-xs text-gray-600">物资管理</text>
									</view>
									<view class="flex-1 flex flex-col items-center justify-center py-1 active:bg-gray-50 rounded" @click.stop="contactClient(order)">
										<uni-icons type="phone" size="20" color="#eb6d20" class="mb-1"></uni-icons>
										<text class="text-xs text-gray-600">联系客人</text>
									</view>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view v-if="showQrModal" class="fixed inset-0 z-50 flex items-center justify-center bg-mask backdrop-blur-sm" @click="closeQrModal">
			<view class="flex flex-col items-center" @click.stop>
				<view class="bg-white rounded-2xl p-8 flex flex-col items-center w-72 shadow-2xl animate-scale-in">
					<view class="text-lg font-bold text-gray-800 mb-6">扫码绑定</view>

					<view class="relative w-56 h-56 mb-6">
						<image v-if="qrCodeBase64" :src="qrCodeBase64" class="w-full h-full" mode="aspectFit"></image>
						<view v-else class="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
							<view class="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></view>
						</view>
					</view>

					<view class="text-xs text-gray-400 text-center leading-relaxed">
						使用微信“扫一扫”
						<br />
						绑定此订单行程和相册
					</view>
				</view>

				<view class="close-btn-area" @click="closeQrModal">
					<view class="close-btn">
						<view class="close-icon">
							<view class="icon-line line-1"></view>
							<view class="icon-line line-2"></view>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const orderService = uniCloud.importObject('a-order-service', { customUI: true });
const operationCenter = uniCloud.importObject('a-operation-center', { customUI: true });
const qrcodeService = uniCloud.importObject('qrcode-service');

export default {
	data() {
		return {
			checkComplete: false,
			isGuide: false,
			userInfo: {},
			assessmentData: { dimensions: [] },
			beatRate: 0,
			isFlipped: false,
			rankingList: [],
			myRank: '-',
			showQrModal: false,
			qrCodeBase64: '',

			stats: {
				monthOrders: 0,
				monthCompleted: 0,
				rating: '100.0'
			},

			tabs: [
				{ name: '进行中', value: 'ongoing' },
				{ name: '待出发', value: 'upcoming' },
				{ name: '已结束', value: 'completed' }
			],
			currentTab: 0,
			orders: [],
			loading: true,

			statusOptions: [
				{
					value: 'active',
					text: '正常接单',
					styleClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
					dotClass: 'bg-emerald-500'
				},
				{
					value: 'leave_personal',
					text: '事假中',
					styleClass: 'bg-gray-100 text-gray-600 border-gray-200',
					dotClass: 'bg-gray-400'
				},
				{
					value: 'leave_sick',
					text: '病假中',
					styleClass: 'bg-rose-50 text-rose-700 border-rose-200',
					dotClass: 'bg-rose-500'
				}
			]
		};
	},
	onShow() {
		this.checkUserStatus();
	},
	async onPullDownRefresh() {
		await this.loadDashboardData();
		uni.stopPullDownRefresh();
	},
	computed: {
		currentStatusObj() {
			const status = this.userInfo.work_status || 'active';
			return this.statusOptions.find((item) => item.value === status) || this.statusOptions[0];
		}
	},
	methods: {
		async checkUserStatus() {
			const currentUser = uniCloud.getCurrentUserInfo();
			console.log('currentUser: ');
			if (!currentUser.uid) {
				uni.reLaunch({ url: '/pages/login/login' });
				return;
			}

			// 1. 先看本地缓存是否有身份
			let hasGuideRole = currentUser.role && currentUser.role.includes('guide');

			// 2. 如果本地没身份，去数据库再确认一次（防止缓存滞后）
			if (!hasGuideRole) {
				try {
					const userRes = await db.collection('uni-id-users').doc(currentUser.uid).field('role').get();

					if (userRes.result.data.length > 0) {
						const latestRole = userRes.result.data[0].role || [];
						if (latestRole.includes('guide')) {
							hasGuideRole = true;
						}
					}
				} catch (e) {
					console.error('二次验证身份失败', e);
				}
			}

			// 3. 根据最终确认结果决定流程
			if (hasGuideRole) {
				this.isGuide = true;
				this.checkComplete = true;

				// 加载司导资料
				const guideRes = await db.collection('b-guide-profiles').where('user_id == $cloudEnv_uid').get();
				if (guideRes.result && guideRes.result.data && guideRes.result.data.length > 0) {
					this.userInfo = guideRes.result.data[0] || {};
				}

				this.loadDashboardData();
			} else {
				uni.redirectTo({ url: '/pages/register/register' });
			}
		},

		async loadDashboardData() {
			this.loading = true;
			try {
				await Promise.all([this.loadStats(), this.loadOrders(), this.loadAssessment()]);
			} catch (e) {
				console.error(e);
			} finally {
				this.loading = false;
			}
		},

		async loadStats() {
			try {
				const statsRes = await orderService.getGuideHomeStats();
				this.stats = {
					monthOrders: statsRes.monthOrders || 0,
					monthCompleted: statsRes.monthCompleted || 0,
					rating: statsRes.rating || '100.0'
				};
			} catch (e) {
				console.error('加载统计失败', e);
			}
		},

		async loadOrders() {
			let serviceTabIndex = 2;
			const tabValue = this.tabs[this.currentTab].value;
			if (tabValue === 'ongoing') serviceTabIndex = 2;
			if (tabValue === 'upcoming') serviceTabIndex = 1;
			if (tabValue === 'completed') serviceTabIndex = 3;

			try {
				const res = await orderService.getOrders({
					isGuide: true,
					tabIndex: serviceTabIndex,
					pageCurrent: 1,
					pageSize: 20
				});
				this.orders = (res.snapshots || []).map((snapshot) => {
					return {
						_id: snapshot.order_id,
						orderNumber: snapshot.order_id,
						title: snapshot.title || '未知商品',
						departureDate: this.formatDate(snapshot.departure_date),
						travelers: snapshot.task_traveler_count || snapshot.travel_users?.length || 1,
						image: snapshot.product_image_url || 'https://dimg04.c-ctrip.com/images/0303s12000dwdbkfnEB6E.webp',
						contact_info: snapshot.contact_info,
						travel_users: snapshot.travel_users,
						staves: snapshot.staves,
						isSnapshot: true
					};
				});
			} catch (e) {
				console.error('加载订单失败', e);
			}
		},

		async showInviteQr(order) {
			this.showQrModal = true;
			this.qrCodeBase64 = '';

			try {
				uni.showLoading({ title: '生成中...' });
				// 注意：这里使用的是 order._id，确保 loadOrders 中映射正确
				const res = await qrcodeService.generateOrderInviteCode(order._id);
				uni.hideLoading();

				if (res.errCode === 0) {
					this.qrCodeBase64 = res.base64;
				} else {
					uni.showToast({ title: res.errMsg, icon: 'none' });
					this.showQrModal = false;
				}
			} catch (e) {
				uni.hideLoading();
				uni.showToast({ title: '生成失败', icon: 'none' });
				this.showQrModal = false;
				console.error(e);
			}
		},

		closeQrModal() {
			this.showQrModal = false;
		},

		switchTab(index) {
			this.currentTab = index;
			this.loadOrders();
		},

		async loadAssessment() {
			try {
				const uid = uniCloud.getCurrentUserInfo().uid;
				if (!uid) return;

				const res = await operationCenter.getAssessmentData({ role: 'guide' });
				const list = res.data || [];

				list.sort((a, b) => b.total_score - a.total_score);

				this.rankingList = list.map((item) => ({
					...item,
					isMe: item.user_id === uid
				}));

				const myIndex = list.findIndex((item) => item.user_id === uid);
				if (myIndex !== -1) {
					this.assessmentData = list[myIndex];
					this.myRank = myIndex + 1;
					const total = list.length;
					this.beatRate = total > 1 ? Math.floor(((total - this.myRank) / total) * 100) : 100;
				} else {
					this.assessmentData = { total_score: 0, dimensions: [] };
					this.myRank = '-';
				}
			} catch (e) {
				console.error('加载考核数据失败', e);
			}
		},

		changeWorkStatus() {
			const itemList = this.statusOptions.map((item) => item.text);
			uni.showActionSheet({
				itemList: itemList,
				success: async (res) => {
					const selected = this.statusOptions[res.tapIndex];
					const oldStatus = this.userInfo.work_status;
					this.$set(this.userInfo, 'work_status', selected.value);
					try {
						uni.showLoading({ title: '更新中' });
						await db.collection('b-guide-profiles').doc(this.userInfo._id).update({
							work_status: selected.value
						});
						uni.showToast({ title: '状态已更新', icon: 'none' });
					} catch (e) {
						this.$set(this.userInfo, 'work_status', oldStatus);
						uni.showToast({ title: '更新失败', icon: 'none' });
					} finally {
						uni.hideLoading();
					}
				}
			});
		},

		viewItinerary(order) {
			uni.setStorageSync('guide_override_order_id', order.orderNumber);
			uni.switchTab({ url: '/pages/itinerary/itinerary' });
		},
		manageSupplies(order) {
			uni.navigateTo({ url: `/pages/order/order-supplies?orderId=${order._id}` });
		},
		contactClient(order) {
			const users = order.travel_users;
			if (users && users.length > 0 && users[0].mobile) {
				uni.makePhoneCall({ phoneNumber: users[0].mobile });
			} else {
				uni.showToast({ title: '无号码', icon: 'none' });
			}
		},
		goToOrderDetail(order) {
			uni.navigateTo({ url: `/pages/order/order-detail?orderId=${order._id}&isGuide=true` });
		},
		formatDate(ts) {
			if (!ts) return '';
			const d = new Date(ts);
			return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
		},
		getProgressWidth(score, weight) {
			if (!weight) return '0%';
			return Math.min((score / weight) * 100, 100) + '%';
		},
		getBarColor(score, weight) {
			const ratio = score / weight;
			return ratio < 0.6 ? 'bg-red-500' : 'bg-brand-orange';
		}
	}
};
</script>

<style>
.bg-brand-orange {
	background-color: #eb6d20;
}
.text-brand-orange {
	color: #eb6d20;
}
.pb-safe {
	padding-bottom: env(safe-area-inset-bottom);
}
.font-din {
	font-family: 'DIN Alternate', sans-serif;
}
.transition-all {
	transition-property: all;
	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-spin {
	animation: spin 1s linear infinite;
}

/* --- 用于二维码弹窗 --- */
.bg-mask {
	background-color: rgba(0, 0, 0, 0.6);
}
.backdrop-blur-sm {
	backdrop-filter: blur(4px);
	-webkit-backdrop-filter: blur(4px);
}
.animate-scale-in {
	animation: scaleIn 0.2s ease-out;
}
.close-btn-area {
	margin-top: 60rpx;
	padding: 20rpx;
	opacity: 0.8;
}
.close-btn-area:active {
	opacity: 0.5;
}
.close-btn {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	border: 2rpx solid rgba(255, 255, 255, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
}
.close-icon {
	position: relative;
	width: 32rpx;
	height: 32rpx;
}
.icon-line {
	position: absolute;
	top: 50%;
	left: 0;
	width: 100%;
	height: 4rpx;
	background-color: #ffffff;
	border-radius: 4rpx;
}
.line-1 {
	transform: translateY(-50%) rotate(45deg);
}
.line-2 {
	transform: translateY(-50%) rotate(-45deg);
}
@keyframes scaleIn {
	from {
		transform: scale(0.9);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
}
@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}
</style>
