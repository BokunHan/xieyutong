<template>
	<view class="min-h-screen bg-gray-50 pb-safe">
		<view class="header-section" :style="{ paddingTop: statusBarHeight + 'px', height: statusBarHeight + 'px' }">
			<view class="back-button" @click="goBack">
				<uni-icons type="left" size="22" color="#333"></uni-icons>
			</view>
		</view>

		<view class="p-5" :style="{ marginTop: statusBarHeight + 64 + 'px' }" style="padding-bottom: 240rpx">
			<view class="mb-6">
				<view class="text-2xl font-bold text-gray-900 leading-tight">
					您将于
					<text class="text-brand-orange mx-1">{{ dateStr }}</text>
					开展新的旅行
				</view>
				<text class="block text-sm text-gray-500 mt-3">为了您的旅途舒适，我们已为您精心准备了以下全套物品与服务。如有其他需要，请在底部留言。</text>
			</view>

			<view v-if="loading" class="flex justify-center py-10">
				<uni-load-more status="loading" />
			</view>

			<view v-else class="space-y-4">
				<view
					v-for="item in mixedList"
					:key="item._id"
					class="bg-white rounded-2xl p-5 shadow-sm border-2 transition-all duration-200 relative overflow-hidden border-brand-orange bg-orange-50">
					<view class="flex justify-between items-start mb-2">
						<view class="flex-1">
							<view class="flex items-center justify-between">
								<text class="text-lg font-bold text-gray-900">{{ item.name }}</text>
								<view class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 mb-1 bg-brand-orange border-brand-orange">
									<uni-icons type="checkmarkempty" size="16" color="#fff"></uni-icons>
								</view>
							</view>
							<text class="block text-sm text-gray-500 mt-1">{{ item.description }}</text>
						</view>
					</view>

					<view v-if="item.type === 'service' && item.items && item.items.length > 0" class="flex flex-wrap gap-2 mt-4">
						<view
							v-for="(sub, idx) in item.items"
							:key="idx"
							class="flex items-center bg-gray-100 rounded-full px-3 py-1"
							:class="item.checked ? 'bg-white' : ''"
							@click.stop="previewSubItemImage(sub.image)">
							<image v-if="getImgUrl(sub.image)" :src="getImgUrl(sub.image)" mode="aspectFill" class="w-4 h-4 rounded-full mr-1.5"></image>
							<uni-icons v-else type="box" size="14" color="#666" class="mr-1"></uni-icons>
							<text class="text-xs text-gray-700 font-medium">{{ sub.name }}</text>
						</view>
					</view>

					<view v-if="item.type === 'supply' && item.mediaList && item.mediaList.length > 0" class="mt-3">
						<scroll-view scroll-x class="whitespace-nowrap w-full" :show-scrollbar="false">
							<view class="flex gap-2">
								<view
									v-for="(media, mIdx) in item.mediaList"
									:key="mIdx"
									class="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100"
									@click.stop="handleMediaClick(item.mediaList, mIdx)">
									<block v-if="media.type === 'video'">
										<image :src="getVideoSnapshot(media.url)" mode="aspectFill" class="w-full h-full bg-black"></image>
										<view class="video-icon-overlay">
											<uni-icons type="videocam-filled" size="30" color="rgba(255,255,255,0.7)"></uni-icons>
										</view>
									</block>

									<block v-else>
										<image :src="media.url" mode="aspectFill" class="w-full h-full"></image>
									</block>
								</view>
							</view>
						</scroll-view>
					</view>

					<!-- <view v-if="item.checked" class="flex justify-between items-center mt-3 pt-3 border-t border-gray-300" @click.stop>
						<text class="text-sm text-gray-600 font-medium">需要数量</text>
						<view class="flex items-center gap-2">
							<uni-number-box v-model="item.quantity" :min="1" :max="99" background="#fff" color="#333" />
							<text class="text-sm text-gray-600 font-medium">{{ item.unit }}</text>
						</view>
					</view> -->
				</view>
			</view>
		</view>

		<view class="mt-6 mb-24 px-2">
			<view class="bg-orange-50 p-4 rounded-xl mb-4 border border-orange-100">
				<view class="flex items-start">
					<uni-icons type="info-filled" size="18" color="#eb6d20" class="mt-0.5 mr-2"></uni-icons>
					<view class="text-xs text-orange-800 leading-relaxed">
						<text class="font-bold block mb-1">温馨提示：</text>
						以上物资的图片和描述仅供参考，请以实际配备为准。我们的管家和私导团队会根据您的行程人数和实际需求，做好最充足的准备，请您放心。
					</view>
				</view>
			</view>

			<view class="bg-white rounded-xl p-4 shadow-sm">
				<text class="text-sm font-bold text-gray-800 mb-2 block">特别诉求 / 留言</text>
				<textarea
					v-model="userRemark"
					class="w-full bg-gray-50 h-24 p-3 rounded-lg text-sm"
					placeholder="如果您有其他需求或备注，请在此留言..."
					placeholder-class="text-gray-400" />
			</view>
		</view>

		<view class="w-full" style="height: 50rpx"></view>

		<view class="fixed bottom-0 left-0 right-0 bg-white shadow-up safe-area-bottom z-50">
			<view class="px-6 py-4 flex items-center justify-between gap-4">
				<button
					v-if="isAutoPop"
					class="flex-[2] bg-gray-100 text-gray-600 font-bold text-base h-11 flex items-center justify-center rounded-lg active:scale-95 transition-transform"
					hover-class="none"
					@click="handleNotNeeded">
					晚点再说
				</button>

				<!-- <button
					class="flex-1 bg-brand-orange text-white font-bold text-lg h-11 flex items-center justify-center rounded-full shadow-lg active:scale-95 transition-transform"
					hover-class="none"
					@click="submitDemand">
					确认提交
					<text v-if="selectedCount > 0" class="ml-1 text-sm opacity-90">({{ selectedCount }})</text>
				</button> -->
				<button
					class="flex-1 bg-brand-orange text-white font-bold text-lg h-11 flex items-center justify-center rounded-full shadow-lg active:scale-95 transition-transform"
					hover-class="none"
					@click="submitDemand">
					知晓并确认
				</button>
			</view>
		</view>

		<view v-if="currentVideoUrl" class="fixed inset-0 z-[9999] bg-black flex items-center justify-center animate-fade-in" @click.stop="closeVideoPlayer">
			<video
				id="fullScreenVideo"
				:src="currentVideoUrl"
				class="w-full h-full"
				:controls="true"
				:show-fullscreen-btn="false"
				:show-center-play-btn="true"
				:show-play-btn="true"
				:show-progress="true"
				:show-bottom-progress="true"
				:enable-progress-gesture="true"
				object-fit="contain"
				@ended="closeVideoPlayer"
				@error="onVideoError"></video>
		</view>
	</view>
</template>

<script>
const supplyObj = uniCloud.importObject('a-supply-service');
const db = uniCloud.database();

export default {
	data() {
		return {
			statusBarHeight: 0,
			orderId: '',
			loading: true,
			mixedList: [],
			isAutoPop: false,
			dateStr: '近期',
			currentVideoUrl: null,
			hasCloseIcon: false, // 如果有 /static/icons/close-white.png 请改为 true
			userRemark: ''
		};
	},
	computed: {
		selectedCount() {
			return this.mixedList.filter((s) => s.checked).length;
		}
	},
	onLoad(options) {
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;

		this.orderId = options.orderId;
		this.isAutoPop = options.autoPop === 'true';

		this.fetchOrderInfo();
		this.loadData();
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},

		async fetchOrderInfo() {
			if (!this.orderId) return;
			try {
				const res = await db.collection('a-snapshots').where({ order_id: this.orderId }).field('departure_date').get();
				if (res.result.data.length > 0) {
					const timestamp = res.result.data[0].departure_date;
					if (timestamp) {
						const date = new Date(timestamp);
						this.dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
					}
				}
			} catch (e) {
				console.error('获取订单日期失败', e);
			}
		},

		getImgUrl(imgData) {
			if (Array.isArray(imgData) && imgData.length > 0) {
				return imgData[0].url || imgData[0];
			} else if (typeof imgData === 'string') {
				return imgData;
			}
			return '';
		},

		previewSubItemImage(imgData) {
			const url = this.getImgUrl(imgData);
			if (url) {
				uni.previewImage({
					urls: [url], // 预览当前图片的数组
					current: 0
				});
			}
		},

		formatMediaList(imageRaw) {
			if (!imageRaw) return [];
			let list = Array.isArray(imageRaw) ? imageRaw : [imageRaw];
			return list.map((item) => {
				let url = '';
				let type = 'image';
				if (typeof item === 'object') {
					url = item.url;
					type = item.type || (this.isVideoUrl(url) ? 'video' : 'image');
				} else {
					url = item;
					type = this.isVideoUrl(url) ? 'video' : 'image';
				}
				try {
					url = decodeURI(url);
				} catch (e) {}
				url = encodeURI(url);
				return { url, type };
			});
		},

		isVideoUrl(url) {
			if (!url) return false;
			return url.match(/\.(mp4|mov|avi|webm|m4v)(\?|$)/i) !== null;
		},

		getVideoSnapshot(url) {
			if (!url) return '';
			if (url.startsWith('http')) {
				return url + '?x-oss-process=video/snapshot,t_0,f_jpg,w_400,m_fast';
			}
			return url;
		},

		async loadData() {
			try {
				this.loading = true;
				const list = await supplyObj.getServicesWithDetails();
				const existRes = await db.collection('a-order-supplies').where({ order_id: this.orderId }).get();
				const record = existRes.result.data[0];

				if (record && record.user_remark) {
					this.userRemark = record.user_remark;
				}

				// 构建回显 Map: ID -> Quantity
				const serviceQtyMap = {};
				const supplyQtyMap = {};

				if (record) {
					// 兼容旧数据(可能没有 quantity 字段)和新数据
					(record.selected_services || []).forEach((s) => {
						const id = s.id || s._id; // 兼容不同写法
						serviceQtyMap[id] = s.quantity || 1;
					});
					(record.selected_supplies || []).forEach((s) => {
						// 兼容旧数据是字符串数组的情况
						const id = typeof s === 'string' ? s : s.id;
						const qty = typeof s === 'string' ? 1 : s.quantity || 1;
						supplyQtyMap[id] = qty;
					});
				}

				// this.mixedList = list.map((item) => {
				// 	let isChecked = false;
				// 	let qty = 1;

				// 	if (item.type === 'service') {
				// 		if (serviceQtyMap[item._id]) {
				// 			isChecked = true;
				// 			qty = serviceQtyMap[item._id];
				// 		}
				// 	} else {
				// 		if (supplyQtyMap[item._id]) {
				// 			isChecked = true;
				// 			qty = supplyQtyMap[item._id];
				// 		}
				// 	}

				// 	const mediaList = item.type === 'supply' ? this.formatMediaList(item.image) : [];
				// 	return {
				// 		...item,
				// 		checked: isChecked,
				// 		quantity: qty, // 绑定数量
				// 		mediaList: mediaList
				// 	};
				// });

				const tempMixedList = [];

				list.forEach((item) => {
					let qty = 0;
					let isIncluded = false;

					if (item.type === 'service' && serviceQtyMap[item._id]) {
						qty = serviceQtyMap[item._id];
						isIncluded = true;
					} else if (item.type === 'supply' && supplyQtyMap[item._id]) {
						qty = supplyQtyMap[item._id];
						isIncluded = true;
					}

					if (isIncluded) {
						const mediaList = item.type === 'supply' ? this.formatMediaList(item.image) : [];
						tempMixedList.push({
							...item,
							checked: true, // 强制选中
							quantity: qty,
							mediaList: mediaList
						});
					}
				});

				this.mixedList = tempMixedList;
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '加载服务失败', icon: 'none' });
			} finally {
				this.loading = false;
			}
		},

		toggleItem(item) {
			// item.checked = !item.checked;
			return;
		},

		handleMediaClick(mediaList, index) {
			const target = mediaList[index];
			if (target.type === 'video') {
				this.playFullScreenVideo(target.url);
			} else {
				const imgUrls = mediaList.filter((m) => m.type === 'image').map((m) => m.url);
				const currentUrl = target.url;
				const imgIndex = imgUrls.indexOf(currentUrl);
				if (imgIndex >= 0) {
					uni.previewImage({ urls: imgUrls, current: imgIndex });
				}
			}
		},

		playFullScreenVideo(url) {
			this.currentVideoUrl = url;
			// 使用 JS 延迟触发播放，比 :autoplay 更稳妥
			this.$nextTick(() => {
				setTimeout(() => {
					const videoCtx = uni.createVideoContext('fullScreenVideo', this);
					videoCtx.play();
				}, 100);
			});
		},

		closeVideoPlayer() {
			this.currentVideoUrl = null;
		},

		onVideoError(e) {
			uni.showToast({ title: '视频加载失败', icon: 'none' });
			this.closeVideoPlayer();
		},

		async submitDemand() {
			// 提取数据：[{id, name, quantity}]
			const selectedServices = this.mixedList.filter((s) => s.checked && s.type === 'service').map((s) => ({ id: s._id, name: s.name, quantity: s.quantity }));

			// 提取数据：[{id, quantity}]
			const selectedSupplies = this.mixedList.filter((s) => s.checked && s.type === 'supply').map((s) => ({ id: s._id, quantity: s.quantity }));

			// if (selectedServices.length === 0 && selectedSupplies.length === 0) {
			// 	if (this.isAutoPop) return this.handleNotNeeded();
			// 	return uni.showToast({ title: '请至少选择一项', icon: 'none' });
			// }

			uni.showLoading({ title: '提交中...' });
			try {
				await supplyObj.submitOrderDemand(this.orderId, selectedServices, selectedSupplies, this.userRemark);
				uni.hideLoading();
				uni.showToast({ title: '已确认需求', icon: 'success' });
				setTimeout(() => uni.navigateBack(), 1500);
			} catch (e) {
				uni.hideLoading();
				uni.showToast({ title: e.message || '提交失败', icon: 'none' });
			}
		},

		handleNotNeeded() {
			if (this.orderId) {
				uni.setStorageSync(`dismiss_service_${this.orderId}`, true);
			}
			uni.showModal({
				title: '提示',
				content: '您可以在“我的订单”中点击“服务”按钮重新进行选择',
				showCancel: false,
				confirmText: '知道了',
				confirmColor: '#eb6d20',
				success: () => {
					uni.navigateBack();
				}
			});
		}
	}
};
</script>

<style scoped>
.header-section {
	background-color: rgba(249, 250, 251, 0.95);
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	z-index: 90;
	backdrop-filter: blur(10px);
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
}

.back-button {
	position: absolute;
	left: 24rpx;
	top: calc(var(--status-bar-height) + 50rpx);
	width: 70rpx;
	height: 70rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 99;
	background-color: rgba(255, 255, 255, 0.7);
	border-radius: 50%;
}

.safe-area-bottom {
	padding-bottom: env(safe-area-inset-bottom);
}
.shadow-up {
	box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
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
.bg-orange-50 {
	background-color: #fff7ed;
}

::-webkit-scrollbar {
	display: none;
	width: 0 !important;
	height: 0 !important;
	-webkit-appearance: none;
	background: transparent;
}

.video-icon-overlay {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: rgba(0, 0, 0, 0.2);
}

.animate-fade-in {
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
</style>
