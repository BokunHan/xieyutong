<template>
	<view class="bg-gray-50 min-h-screen">
		<!-- 内容区域 -->
		<view class="pb-safe overflow-y-auto">
			<view class="p-4 pb-25">
				<!-- 加载状态 -->
				<view v-if="loading" class="flex justify-center items-center py-10">
					<view class="text-gray-500">加载中...</view>
				</view>

				<!-- 出行人卡片列表 -->
				<view v-for="(traveler, index) in travelers" :key="traveler._id" class="bg-white rounded-xl mb-4 shadow-sm overflow-hidden">
					<!-- 出行人头部 -->
					<view class="flex justify-between items-center px-4 py-4 border-b border-gray-100">
						<view class="flex items-center">
							<view class="text-lg font-semibold text-gray-800">{{ traveler.name }}</view>
							<view class="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
								{{ traveler.type }}
							</view>
						</view>
						<view class="flex items-center space-x-4">
							<view class="text-gray-400 text-lg" @click="editTraveler(traveler)">
								<text class="fa fa-edit"></text>
							</view>
							<view v-if="!traveler.is_main" class="text-red-500 text-lg" @click="deleteTraveler(traveler, index)">
								<text class="fa fa-trash-alt"></text>
							</view>
						</view>
					</view>

					<!-- 出行人内容 -->
					<view class="p-4">
						<view class="flex mb-3">
							<view class="w-20 text-sm text-gray-600">身份证号</view>
							<view class="flex-1 text-sm text-gray-800">{{ maskIdCard(traveler.id_card) }}</view>
						</view>
						<view class="flex mb-3" v-if="traveler.phone">
							<view class="w-20 text-sm text-gray-600">手机号</view>
							<view class="flex-1 text-sm text-gray-800">{{ maskPhone(traveler.phone) }}</view>
						</view>
						<view class="flex" v-if="traveler.birthday">
							<view class="w-20 text-sm text-gray-600">出生日期</view>
							<view class="flex-1 text-sm text-gray-800">{{ traveler.birthday }}</view>
						</view>
					</view>
				</view>

				<!-- 空状态 -->
				<view v-if="!loading && travelers.length === 0" class="flex flex-col items-center justify-center h-75 text-gray-400 text-center px-10">
					<text class="fa fa-user-friends text-5xl text-gray-300 mb-4"></text>
					<view class="text-lg font-medium mb-2 text-gray-600">暂无常用出行人</view>
					<view class="text-sm leading-relaxed">添加常用出行人信息，下次预订时可快速选择，无需重复填写</view>
				</view>
			</view>
		</view>

		<!-- 右下角悬浮添加按钮 -->
		<view class="fab-button" @click="addTraveler">
			<text class="fa fa-plus"></text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			travelers: [],
			loading: true
		};
	},
	async onLoad() {
		await this.loadTravelers();
	},
	onShow() {
		// 从添加页面返回时重新加载数据
		this.loadTravelers();
	},
	methods: {
		async loadTravelers() {
			try {
				this.loading = true;

				// 检查用户登录状态
				const token = uni.getStorageSync('uni_id_token');
				if (!token) {
					console.error('[ClientDB] 用户未登录');
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					uni.navigateTo({
						url: '/pages/login/login'
					});
					return;
				}

				// 使用 ClientDB 查询出行人列表
				const db = uniCloud.database();
				const result = await db
					.collection('a-travelers')
					.where('status == "active" && user_id == $env.uid')
					.field('_id,name,id_card,phone,type,gender,birthday,is_main,created_at')
					.orderBy('is_main desc, created_at desc')
					.get();

				console.log('[ClientDB] 查询出行人列表结果:', result);

				if (result.result && result.result.data) {
					this.travelers = result.result.data;
					console.log('[ClientDB] 加载出行人列表成功，共', this.travelers.length, '条数据');
				} else {
					this.travelers = [];
					console.log('[ClientDB] 未查询到出行人数据');
				}
			} catch (error) {
				console.error('[ClientDB] 加载出行人列表失败:', error);
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				});
				this.travelers = [];
			} finally {
				this.loading = false;
			}
		},

		addTraveler() {
			// 跳转到添加出行人页面
			uni.navigateTo({
				url: '/pages/traveler-add/traveler-add'
			});
		},

		editTraveler(traveler) {
			// 跳转到编辑出行人页面（复用添加页面）
			uni.navigateTo({
				url: `/pages/traveler-add/traveler-add?id=${traveler._id}`
			});
		},

		async deleteTraveler(traveler, index) {
			const that = this;
			uni.showModal({
				title: '删除确认',
				content: '确定要删除这位出行人吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							// 使用 ClientDB 软删除出行人
							const db = uniCloud.database();
							const result = await db.collection('a-travelers').where(`_id == "${traveler._id}"`).update({
								status: 'inactive'
							});

							console.log('[ClientDB] 删除出行人结果:', result);

							// 检查操作结果
							if (result.result && result.result.updated) {
								// 从列表中移除
								that.travelers.splice(index, 1);

								uni.showToast({
									title: '删除成功',
									icon: 'success'
								});

								console.log('[ClientDB] 删除出行人成功');
							} else {
								throw new Error('删除操作失败');
							}
						} catch (error) {
							console.error('[ClientDB] 删除出行人失败:', error);
							uni.showToast({
								title: '删除失败，请重试',
								icon: 'none'
							});
						}
					}
				}
			});
		},

		// 脱敏显示身份证号
		maskIdCard(idCard) {
			if (!idCard) return '';
			return idCard.replace(/^(.{4})(.*)(.{4})$/, '$1********$3');
		},

		// 脱敏显示手机号
		maskPhone(phone) {
			if (!phone) return '';
			return phone.replace(/^(.{3})(.*)(.{4})$/, '$1****$3');
		}
	}
};
</script>

<style>
/* 补充样式 */
.pb-safe {
	padding-bottom: env(safe-area-inset-bottom);
}

.shadow-sm {
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.shadow-lg {
	box-shadow: 0 4px 12px rgba(0, 134, 246, 0.3);
}

.space-x-4 {
	margin-left: 1rem;
}

.pb-25 {
	padding-bottom: 6.25rem;
}

/* 右下角悬浮添加按钮 */
.fab-button {
	position: fixed;
	bottom: 20px;
	right: 20px;
	width: 56px;
	height: 56px;
	background: linear-gradient(135deg, #0086f6 0%, #0066cc 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 24px;
	box-shadow: 0 4px 12px rgba(0, 134, 246, 0.4);
	cursor: pointer;
	z-index: 1000;
	transition: all 0.3s ease;
}

.fab-button:hover {
	transform: scale(1.1);
	box-shadow: 0 6px 16px rgba(0, 134, 246, 0.5);
}

.fab-button:active {
	transform: scale(0.95);
}
</style>
