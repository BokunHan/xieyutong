<template>
	<view class="album-list-container">
		<view :style="{ paddingTop: statusBarHeight + 150 + 'rpx' }">
			<block v-if="loading">
				<view class="loading-tip">正在加载...</view>
			</block>
			<block v-else-if="albumList.length === 0">
				<view class="empty-container">
					<text class="empty-text">您还没有加入任何相册</text>
				</view>
			</block>
			<block v-else>
				<view class="album-list">
					<view v-for="album in albumList" :key="album._id" class="album-item" @click="goToDetail(album._id)">
						<image class="album-cover" :src="album.cover_image || product_image" mode="aspectFill"></image>
						<view class="album-overlay"></view>
						<view class="album-info">
							<text class="album-name">{{ album.album_name }}</text>
							<text class="album-date">{{ formatDateRange(album) }}</text>
						</view>
					</view>
				</view>
			</block>
		</view>
	</view>
</template>

<script>
const albumService = uniCloud.importObject('album-service');
const itineraryService = uniCloud.importObject('a-itinerary-service');

export default {
	data() {
		return {
			statusBarHeight: 0,
			albumList: [],
			loading: true,
			isNavigating: false,
			product_image: '' // 当前行程的商品图片作为所有相册的备用封面
		};
	},
	onLoad() {
		// 获取系统信息中的状态栏高度
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;
	},
	onShow() {
		// 如果是从详情页返回，则不执行检查，直接加载列表
		if (this.isNavigating) {
			this.isNavigating = false;
			this.fetchAlbumList(); // 从详情页返回时，刷新一下列表
			return;
		}

		this.checkAndRedirectToCurrentItinerary();
	},
	methods: {
		// 检查用户是否有进行中的行程
		async checkAndRedirectToCurrentItinerary() {
			console.log('[相册列表] 开始检查当前行程...');
			this.loading = true;
			try {
				// 1. 调用轻量化接口获取当前行程的 order_id
				const res = await itineraryService.getCurrentItineraryOrderId();
				if (res.errCode === 0 && res.data && res.data.order_id) {
					const orderId = res.data.order_id;
					console.log('[相册列表] 找到进行中的行程，订单ID:', orderId);

					if (res.data.product_image) this.product_image = res.data.product_image;
					console.log('[相册列表] 获取到默认封面照片：', res.data.product_image);
					// 2. 根据 order_id 查询相册 ID
					const db = uniCloud.database();
					const albumRes = await db.collection('a-group-albums').where({ order_id: orderId }).field('_id').get({ getOne: true });

					if (albumRes.result && albumRes.result.data) {
						const albumId = albumRes.result.data._id;
						console.log('[相册列表] 找到对应的相册ID，准备跳转:', albumId);
						this.goToDetail(albumId);
						return; // 跳转后终止后续操作
					}
				}

				// 3. 如果没有进行中的行程或没有对应的相册，则正常加载相册列表
				console.log('[相册列表] 未找到进行中的行程或对应相册，加载列表');
				this.fetchAlbumList();
			} catch (error) {
				console.error('[相册列表] 检查行程失败:', error);
				this.fetchAlbumList(); // 发生错误时，也正常加载列表
			}
		},

		async fetchAlbumList() {
			this.loading = true;

			// 检查登录状态
			const token = uni.getStorageSync('uni_id_token');
			if (!token) {
				console.error('[相册列表] 用户未登录');
				uni.navigateTo({
					url: '/pages/login/login'
				});
				return;
			}

			try {
				const res = await albumService.getAlbumListByUser();
				if (res.errCode === 0) {
					this.albumList = res.data;
				} else {
					uni.showToast({
						title: res.errMsg,
						icon: 'none'
					});
				}
			} catch (e) {
				console.error(e);
				uni.showToast({
					title: '加载失败，请稍后重试',
					icon: 'none'
				});
			} finally {
				this.loading = false;
			}
		},

		goToDetail(albumId) {
			// 在跳转前设置标志位
			this.isNavigating = true;
			uni.navigateTo({
				url: `/pages/album/detail?id=${albumId}`
			});
		},

		formatDate(timestamp) {
			if (!timestamp) return '';
			const date = new Date(timestamp);
			return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
		},

		formatDateRange(album) {
			if (!album.departure_date) {
				return '日期未知';
			}

			const startDate = this.formatDate(album.departure_date);

			if (album.total_days && album.total_days > 1) {
				const endDateObj = new Date(album.departure_date);
				endDateObj.setDate(endDateObj.getDate() + album.total_days - 1);
				const endDate = this.formatDate(endDateObj.getTime());
				return `${startDate} 至 ${endDate}`;
			}

			// 5. 如果 total_days 为 1 或不存在，只显示开始日期
			return startDate;
		}
	}
};
</script>

<style scoped>
.album-list-container {
	padding: 0 30rpx 30rpx;
}

.loading-tip,
.empty-container {
	text-align: center;
	margin-top: 200rpx;
	color: #999;
}

.empty-image {
	width: 300rpx;
	height: 300rpx;
	margin-bottom: 20rpx;
}

.album-list {
	width: 100%;
}

.album-item {
	width: 100%;
	height: 400rpx; /* 增加卡片高度，使其更突出 */
	border-radius: 24rpx; /* 增加圆角，提升高级感 */
	overflow: hidden;
	background-color: #f0f0f0; /* 图片加载时的底色 */
	position: relative; /* 设为相对定位，作为子元素的锚点 */
	margin-bottom: 30rpx; /* 卡片之间的间距 */
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.08);
}

.album-cover {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
}

.album-overlay {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 50%; /* 蒙版只覆盖下半部分 */
	background: linear-gradient(0deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0) 100%);
	z-index: 2;
}

.album-info {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	padding: 24rpx; /* 增加内边距 */
	display: flex;
	flex-direction: column;
	z-index: 3;
	box-sizing: border-box;
}

.album-name {
	font-size: 36rpx;
	font-weight: bold;
	color: #ffffff;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	line-height: 1.4;
	text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.album-date {
	font-size: 26rpx;
	color: #e0e0e0;
	margin-top: 8rpx;
}
</style>
