<template>
	<view class="min-h-screen bg-gray-50 pb-safe">
		<view class="header-section" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="back-button" @click="goBack">
				<uni-icons type="left" size="22" color="#333"></uni-icons>
			</view>
		</view>

		<view v-if="loading" class="flex justify-center py-20">
			<uni-load-more status="loading" />
		</view>

		<view v-else-if="!supplyData" class="flex flex-col items-center justify-center h-80">
			<image src="/static/icons/file-text.svg" class="w-16 h-16 mb-4 opacity-50" mode="aspectFit" />
			<text class="text-gray-500">暂无订单物资信息</text>
		</view>

		<view v-else>
			<view class="bg-white p-6 mb-3 shadow-sm">
				<uni-steps :options="[{ title: '待领用' }, { title: '使用中' }, { title: '已归还' }]" :active="activeStep" active-color="#eb6d20" />
			</view>

			<view v-if="supplyData.user_remark" class="mx-4 mb-3 bg-yellow-50 rounded-lg p-3 border border-yellow-100">
				<text class="text-xs text-yellow-600 font-bold block mb-1">客户留言:</text>
				<text class="text-sm text-gray-800">{{ supplyData.user_remark }}</text>
			</view>

			<!-- <view class="mx-4 mb-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
				<view class="flex items-start mb-1">
					<uni-icons type="list" size="16" color="#3b82f6" class="mt-0.5 mr-1"></uni-icons>
					<text class="font-bold text-gray-800 text-sm">需求来源清单</text>
				</view>

				<view v-if="supplyData.selected_services && supplyData.selected_services.length > 0" class="ml-5 mb-1">
					<text class="text-xs text-gray-500 block mb-0.5">预订服务:</text>
					<view class="flex flex-wrap gap-2">
						<view v-for="(svc, idx) in supplyData.selected_services" :key="'svc' + idx" class="bg-white px-2 py-1 rounded text-xs text-blue-800 shadow-sm">
							{{ svc.name }}
							<text class="font-bold ml-1">x{{ svc.quantity }}</text>
						</view>
					</view>
				</view>

				<view v-if="supplyData.selected_supplies && supplyData.selected_supplies.length > 0" class="ml-5 mt-2">
					<text class="text-xs text-gray-500 block mb-0.5">额外物资:</text>
					<text class="text-xs text-gray-600">包含 {{ supplyData.selected_supplies.length }} 项单独添加的物资</text>
				</view>
			</view> -->

			<view v-if="isCreated" class="px-4 pb-4">
				<view class="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
					<view class="bg-orange-50 px-4 py-3 border-b border-orange-100 flex justify-between items-center">
						<text class="font-bold text-gray-800">出库核对</text>
						<text class="text-xs text-orange-600">请核实实际携带数量</text>
					</view>
					<view class="p-2">
						<view v-for="(item, idx) in localSupplies" :key="idx" class="flex items-center p-3 border-b border-gray-50 last:border-0">
							<image :src="getMainImage(item.image)" mode="aspectFill" class="w-16 h-16 rounded bg-gray-100 mr-3 flex-shrink-0" />
							<view class="flex flex-col gap-1 flex-1">
								<text class="text-gray-900 font-medium block">{{ item.name }}</text>
								<text v-if="item.description" class="text-xs text-gray-400 mt-0.5 block">{{ item.description }}</text>
								<view class="flex items-center justify-between text-xs text-gray-500 mt-0.5">
									<text>
										需领用:
										<text class="font-bold text-gray-900">{{ item.total_quantity }}{{ item.unit }}</text>
									</text>
									<uni-number-box v-model="item.pickup_quantity" :min="0" :max="999" background="#f9fafb" />
								</view>
							</view>
						</view>
					</view>
				</view>

				<view class="bg-white rounded-xl p-5 shadow-sm">
					<view class="text-sm text-gray-500 mb-2">整备拍照 (必填)</view>
					<uni-file-picker v-model="globalPhotos" limit="6" file-mediatype="image" mode="grid" />
					<button class="bg-brand-orange text-white rounded-full font-bold mt-4" @click="handlePickup">确认出库</button>
				</view>
			</view>

			<!-- 使用中 - 可编辑状态 -->
			<view v-else-if="isProcessingEditable" class="px-4 pb-4">
				<view class="bg-white rounded-xl p-4 mb-4 shadow-sm text-sm text-gray-600 flex justify-between items-center">
					<view>领用时间: {{ formatDate(supplyData.pickup_info?.time) }}</view>
					<view class="font-bold text-gray-800">实领总数: {{ totalPickedUpCount }}</view>
				</view>

				<view class="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
					<view class="bg-blue-50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
						<text class="font-bold text-gray-800">物资调整</text>
						<text class="text-xs text-blue-600">可修改领用数量或补拍照片</text>
					</view>
					<view class="p-2">
						<view v-for="(item, idx) in localSupplies" :key="idx" class="flex items-center p-3 border-b border-gray-50 last:border-0">
							<image :src="getMainImage(item.image)" mode="aspectFill" class="w-16 h-16 rounded bg-gray-100 mr-3 flex-shrink-0" />
							<view class="flex flex-col gap-1 flex-1">
								<text class="text-gray-900 font-medium block">{{ item.name }}</text>
								<text v-if="item.description" class="text-xs text-gray-400 mt-0.5 block">{{ item.description }}</text>
								<view class="flex items-center justify-between text-xs text-gray-500 mt-0.5">
									<text>
										当前领用:
										<text class="font-bold text-gray-900">{{ item.pickup_quantity }}{{ item.unit }}</text>
									</text>
									<uni-number-box v-model="item.pickup_quantity" :min="0" :max="999" background="#f9fafb" />
								</view>
							</view>
						</view>
					</view>
				</view>

				<view class="bg-white rounded-xl p-5 shadow-sm">
					<view class="text-sm text-gray-500 mb-2">补充拍照 (可选)</view>
					<uni-file-picker v-model="globalPhotos" limit="6" file-mediatype="image" mode="grid" />
					<view v-if="supplyData.pickup_info?.photos?.length" class="mt-3">
						<text class="text-xs text-gray-400 mb-2 block">已上传照片:</text>
						<view class="flex flex-wrap gap-2">
							<image
								v-for="(img, i) in supplyData.pickup_info.photos.slice(0, 3)"
								:key="i"
								:src="img"
								class="w-16 h-16 rounded"
								mode="aspectFill"
								@click="previewImage(img, supplyData.pickup_info.photos)" />
							<text v-if="supplyData.pickup_info.photos.length > 3" class="text-xs text-gray-400 self-center">+{{ supplyData.pickup_info.photos.length - 3 }}张</text>
						</view>
					</view>
					<view class="flex gap-3 mt-4">
						<button class="flex-1 bg-blue-600 text-white rounded-full font-bold" @click="handleUpdatePickup">保存修改</button>
						<button class="flex-1 bg-emerald-600 text-white rounded-full font-bold" @click="handleStartReturn">开始归还</button>
					</view>
				</view>
			</view>

			<view v-else-if="isReturning" class="px-4 pb-4">
				<view class="bg-white rounded-xl p-4 mb-4 shadow-sm text-sm text-gray-600 flex justify-between items-center">
					<view>领用时间: {{ formatDate(supplyData.pickup_info.time) }}</view>
					<view class="font-bold text-gray-800">实领总数: {{ totalPickedUpCount }}</view>
				</view>

				<view class="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
					<view class="bg-emerald-50 px-4 py-3 border-b border-emerald-100 flex justify-between">
						<text class="font-bold text-gray-800">入库清点</text>
						<text class="text-xs text-emerald-700">请如实分项填写数量</text>
					</view>
					<view class="p-2">
						<view v-for="(item, idx) in localSupplies" :key="idx" class="p-3 border-b border-gray-100 last:border-0">
							<view class="flex items-center mb-3">
								<image :src="getMainImage(item.image)" mode="aspectFill" class="w-12 h-12 rounded bg-gray-100 mr-3" />
								<view class="flex-1">
									<text class="text-gray-900 font-bold text-lg">{{ item.name }}</text>
									<view class="flex items-center mt-1">
										<text class="text-xs text-gray-500 mr-2">需归还总数:</text>
										<text class="text-base font-bold text-gray-800">{{ item.pickup_quantity }}</text>
									</view>
								</view>
								<view class="text-xs px-2 py-1 rounded transition-colors" :class="getValidationClass(item)">
									{{ getValidationText(item) }}
								</view>
							</view>

							<view v-if="item.is_consumable" class="bg-orange-50 rounded-lg p-4 mt-3">
								<view class="flex justify-between items-center mb-2">
									<view class="flex items-center">
										<uni-icons type="refresh-filled" size="20" color="#eb6d20"></uni-icons>
										<text class="text-sm text-gray-800 ml-1 font-bold">剩余归还</text>
										<text class="text-xs text-gray-400 ml-1">(入库)</text>
									</view>
									<uni-number-box v-model="item.return_normal_quantity" :min="0" :max="item.pickup_quantity" background="#fff" />
								</view>

								<view class="flex justify-end text-xs text-gray-500">
									<text>本次消耗：</text>
									<text class="font-bold text-gray-800 ml-1">{{ item.pickup_quantity - (item.return_normal_quantity || 0) }} {{ item.unit }}</text>
								</view>
							</view>

							<view class="bg-gray-50 rounded-lg p-3 space-y-3 mt-3">
								<view class="flex justify-between items-center">
									<view class="flex items-center">
										<uni-icons type="checkbox-filled" size="20" color="#10b981"></uni-icons>
										<text class="text-sm text-gray-600 ml-1 font-medium">完好入库</text>
									</view>
									<uni-number-box v-model="item.return_normal_quantity" :min="0" :max="item.pickup_quantity" background="#fff" />
								</view>

								<view class="flex justify-between items-center">
									<view class="flex items-center">
										<uni-icons type="gear-filled" size="20" color="#d97706"></uni-icons>
										<text class="text-sm text-orange-600 ml-1 font-medium">损坏报修</text>
									</view>
									<uni-number-box v-model="item.return_damaged_quantity" :min="0" :max="item.pickup_quantity" background="#fff" />
								</view>

								<view class="flex justify-between items-center">
									<view class="flex items-center">
										<uni-icons type="clear" size="20" color="#dc2626"></uni-icons>
										<text class="text-sm text-red-600 ml-1 font-medium">丢失赔偿</text>
									</view>
									<uni-number-box v-model="item.return_lost_quantity" :min="0" :max="item.pickup_quantity" background="#fff" />
								</view>
							</view>

							<view v-if="item.return_damaged_quantity > 0" class="mt-3 pl-2 border-l-2 border-orange-200 animate-fade-in">
								<text class="text-xs text-orange-500 mb-2 block">请上传 {{ item.return_damaged_quantity }} 件损坏物资的照片:</text>
								<uni-file-picker v-model="item.temp_evidence" limit="3" file-mediatype="image" :image-styles="{ width: 60, height: 60 }" />
							</view>
						</view>
					</view>
				</view>

				<view class="bg-white rounded-xl p-5 shadow-sm">
					<view class="mb-4">
						<text class="text-sm text-gray-500 mb-2 block">归还总览照 (必填)</text>
						<uni-file-picker v-model="globalPhotos" limit="4" file-mediatype="image" mode="grid" />
					</view>
					<view class="mb-4">
						<text class="text-sm text-gray-500 mb-2 block">备注 (可选)</text>
						<textarea v-model="returnRemark" class="w-full h-20 bg-gray-50 p-2 rounded text-sm" placeholder="如有异常请说明..." />
					</view>
					<button class="bg-emerald-600 text-white rounded-full font-bold" @click="handleReturn">确认归还</button>
				</view>
			</view>

			<view v-else-if="isCompleted" class="px-4 pb-4">
				<view class="bg-white rounded-xl p-6 shadow-sm text-center mb-4">
					<uni-icons type="checkmarkempty" size="48" color="#10b981"></uni-icons>
					<view class="text-gray-800 font-bold mt-2">流程已结束</view>
					<view class="text-gray-500 text-sm mt-1 mb-2">归还时间: {{ formatDate(supplyData.return_info?.time) }}</view>
					<view v-if="supplyData.return_info?.remark" class="text-xs bg-gray-100 p-2 rounded text-left text-gray-600">备注: {{ supplyData.return_info.remark }}</view>
				</view>

				<view v-if="hasAbnormalItems" class="bg-white rounded-xl shadow-sm overflow-hidden mt-4">
					<view class="bg-red-50 px-4 py-3 border-b border-red-100 text-red-700 font-bold text-sm">异常及报修记录</view>
					<view class="p-3">
						<view v-for="(item, idx) in abnormalItems" :key="idx" class="border-b border-gray-100 last:border-0 pb-3 mb-3">
							<view class="flex justify-between items-center mb-2">
								<text class="font-bold text-gray-800">{{ item.name }}</text>
							</view>
							<view class="flex gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
								<text v-if="item.return_damaged_quantity" class="text-orange-600">报修: {{ item.return_damaged_quantity }}</text>
								<text v-if="item.return_lost_quantity" class="text-red-600">报失: {{ item.return_lost_quantity }}</text>
							</view>
							<view v-if="item.return_evidence?.length" class="flex mt-2 gap-2">
								<image v-for="(img, i) in item.return_evidence" :key="i" :src="img" class="w-12 h-12 rounded" mode="aspectFill" @click="previewImage(img, item.return_evidence)" />
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
const supplyObj = uniCloud.importObject('a-supply-service');

export default {
	data() {
		return {
			statusBarHeight: 0,
			orderId: '',
			loading: true,
			supplyData: null,
			localSupplies: [],
			globalPhotos: [],
			returnRemark: ''
		};
	},
	computed: {
		activeStep() {
			if (!this.supplyData) return 0;
			if (this.supplyData.status === 'created') return 0;
			if (this.supplyData.status === 'processing') return 1;
			return 2;
		},
		// 状态判断
		isCreated() {
			return this.supplyData?.status === 'created';
		},
		// 使用中（可编辑出库信息）
		isProcessingEditable() {
			return this.supplyData?.status === 'processing' && this.supplyData?.is_returning !== true;
		},
		// 归还流程中
		isReturning() {
			return this.supplyData?.status === 'processing' && this.supplyData?.is_returning === true;
		},
		// 已完成
		isCompleted() {
			return this.supplyData?.status === 'completed';
		},
		totalPickedUpCount() {
			if (!this.supplyData || !this.supplyData.supplies) return 0;
			return this.supplyData.supplies.reduce((acc, cur) => acc + (cur.pickup_quantity || 0), 0);
		},
		hasAbnormalItems() {
			return this.abnormalItems.length > 0;
		},
		abnormalItems() {
			if (!this.supplyData || !this.supplyData.supplies) return [];
			return this.supplyData.supplies.filter((s) => (s.return_damaged_quantity || 0) > 0 || (s.return_lost_quantity || 0) > 0);
		}
	},
	onLoad(options) {
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;
		this.orderId = options.orderId;
		console.log('orderId: ', this.orderId);
		this.loadData();
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},

		// 辅助：获取图片（兼容数组或字符串）
		getMainImage(imgData) {
			if (Array.isArray(imgData) && imgData.length > 0) {
				const target = imgData.find((item) => item.type === 'image');
				if (target && target.url) return target.url;
				if (imgData[0].url) return imgData[0].url;
			}
			if (typeof imgData === 'string' && imgData) {
				return imgData;
			}
			return '/static/default-supply.png'; // 建议放一张默认图
		},

		// 获取当前操作人的 UID
		getCurrentUid() {
			// 优先使用 uniCloud 提供的 API (如果是 uni-id-pages 体系)
			if (uniCloud.getCurrentUserInfo) {
				return uniCloud.getCurrentUserInfo().uid;
			}
			// 降级方案：从本地缓存取 uni_id 存的 uid (视你的登录逻辑而定)
			return uni.getStorageSync('uni_id') || '';
		},

		async loadData() {
			this.loading = true;
			this.globalPhotos = [];
			try {
				const res = await supplyObj.getOrderSupplies(this.orderId);
				this.supplyData = res;

				console.log('res: ', res);
				if (res && res.supplies) {
					this.localSupplies = res.supplies.map((item) => {
						// 计算逻辑：
						// total_quantity 是后端合并服务+单项后计算出的总需量
						// 第一次加载时，默认 pickup_quantity = total_quantity
						const defaultPickup = item.pickup_quantity ? item.pickup_quantity : item.total_quantity;

						return {
							...item,
							pickup_quantity: defaultPickup,

							// 归还初始化：默认全部完好
							return_normal_quantity: defaultPickup,
							return_damaged_quantity: 0,
							return_lost_quantity: 0,

							temp_evidence: []
						};
					});
				}
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				this.loading = false;
			}
		},

		getSum(item) {
			return (item.return_normal_quantity || 0) + (item.return_damaged_quantity || 0) + (item.return_lost_quantity || 0);
		},
		getValidationClass(item) {
			if (item.is_consumable) {
				return (item.return_normal_quantity || 0) <= item.pickup_quantity ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700';
			}

			const sum = this.getSum(item);
			return sum === item.pickup_quantity ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
		},
		getValidationText(item) {
			if (item.is_consumable) {
				const consumed = item.pickup_quantity - (item.return_normal_quantity || 0);
				return consumed >= 0 ? `消耗 ${consumed}` : '数量超额';
			}

			const sum = this.getSum(item);
			const diff = sum - item.pickup_quantity;
			if (diff === 0) return '数量匹配 OK';
			return diff > 0 ? `多填 ${diff}` : `少填 ${Math.abs(diff)}`;
		},

		async handlePickup() {
			if (this.globalPhotos.length === 0) {
				return uni.showToast({ title: '请拍摄物资整备照片', icon: 'none' });
			}

			uni.showLoading({ mask: true });
			try {
				const payload = this.localSupplies.map((s) => ({
					id: s.id,
					pickup_quantity: Number(s.pickup_quantity)
				}));

				const photoUrls = this.globalPhotos.map((p) => p.url || p.path);

				// 使用真实的 uid
				const operatorId = this.getCurrentUid();

				await supplyObj.updateProcessStatus({
					id: this.supplyData._id,
					action: 'pickup',
					suppliesList: payload,
					photos: photoUrls,
					operatorId: operatorId
				});

				uni.showToast({ title: '已确认领用', icon: 'success' });
				this.globalPhotos = [];
				this.loadData();
			} catch (e) {
				uni.showToast({ title: e.message || '操作失败', icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		},

		async handleReturn() {
			if (this.globalPhotos.length === 0) {
				return uni.showToast({ title: '请拍摄归还入库照片', icon: 'none' });
			}

			// 校验
			for (let item of this.localSupplies) {
				if (item.is_consumable) {
					// 消耗品只校验是否超额
					if ((item.return_normal_quantity || 0) > item.pickup_quantity) {
						return uni.showToast({ title: `【${item.name}】归还数不能大于领用数`, icon: 'none' });
					}
				} else {
					const sum = this.getSum(item);
					if (sum !== item.pickup_quantity) {
						return uni.showToast({ title: `【${item.name}】归还总数不符`, icon: 'none' });
					}
					if (item.return_damaged_quantity > 0 && (!item.temp_evidence || item.temp_evidence.length === 0)) {
						return uni.showToast({ title: `${item.name} 需上传报修照片`, icon: 'none' });
					}
				}
			}

			uni.showLoading({ mask: true });
			try {
				const payload = this.localSupplies.map((s) => {
					const evidenceUrls = s.temp_evidence ? s.temp_evidence.map((p) => p.url || p.path) : [];
					return {
						id: s.id,
						return_normal_quantity: Number(s.return_normal_quantity),
						return_damaged_quantity: Number(s.return_damaged_quantity),
						return_lost_quantity: Number(s.return_lost_quantity),
						return_evidence: evidenceUrls
					};
				});

				const photoUrls = this.globalPhotos.map((p) => p.url || p.path);
				const operatorId = this.getCurrentUid();

				await supplyObj.updateProcessStatus({
					id: this.supplyData._id,
					action: 'return',
					suppliesList: payload,
					photos: photoUrls,
					remark: this.returnRemark,
					operatorId: operatorId
				});

				uni.showToast({ title: '已确认归还', icon: 'success' });
				this.loadData();
			} catch (e) {
				uni.showToast({ title: e.message || '操作失败', icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		},

		// 更新出库信息
		async handleUpdatePickup() {
			uni.showLoading({ mask: true });
			try {
				const payload = this.localSupplies.map((s) => ({
					id: s.id,
					pickup_quantity: Number(s.pickup_quantity)
				}));

				const photoUrls = this.globalPhotos.map((p) => p.url || p.path);

				await supplyObj.updatePickupInfo({
					id: this.supplyData._id,
					suppliesList: payload,
					photos: photoUrls.length > 0 ? photoUrls : undefined
				});

				uni.showToast({ title: '修改已保存', icon: 'success' });
				this.globalPhotos = [];
				this.loadData();
			} catch (e) {
				uni.showToast({ title: e.message || '操作失败', icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		},

		// 开始归还流程
		handleStartReturn() {
			uni.showModal({
				title: '确认开始归还',
				content: '开始归还后将无法修改出库信息，确认继续吗？',
				confirmColor: '#059669',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading({ mask: true });
						try {
							await supplyObj.startReturnProcess(this.supplyData._id);
							uni.showToast({ title: '已进入归还流程', icon: 'success' });
							this.globalPhotos = [];
							this.loadData();
						} catch (e) {
							uni.showToast({ title: e.message || '操作失败', icon: 'none' });
						} finally {
							uni.hideLoading();
						}
					}
				}
			});
		},

		formatDate(ts) {
			if (!ts) return '';
			return new Date(ts).toLocaleString('zh-CN', { hour12: false });
		},
		previewImage(current, urls) {
			uni.previewImage({ current, urls });
		}
	}
};
</script>

<style scoped>
.header-section {
	background-color: white;
	position: relative;
	width: 100%;
	z-index: 90;
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

.bg-brand-orange {
	background-color: #eb6d20;
}
.bg-emerald-600 {
	background-color: #059669;
}
.pb-safe {
	padding-bottom: env(safe-area-inset-bottom);
}
.animate-fade-in {
	animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(-5px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
