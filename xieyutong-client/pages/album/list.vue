<template>
	<view class="album-list-container">
		<view :style="{ paddingTop: statusBarHeight + 20 + 'px' }">
			<view v-if="filteredList.length > 0" class="page-header">
				<text class="main-title">我的旅程</text>
				<text class="sub-title">收藏时光里的独家记忆</text>
			</view>

			<view v-if="filteredList.length > 0" class="filter-scroll-container">
				<scroll-view scroll-x="true" class="year-tabs" show-scrollbar="false">
					<view class="tab-wrapper">
						<view class="year-tab" :class="{ active: selectedYear === 'all' }" @click="selectYear('all')">
							<uni-icons v-if="selectedYear === 'all'" type="images" size="14" color="#fff" style="margin-right: 4rpx"></uni-icons>
							<text>全部</text>
						</view>
						<view class="year-tab" v-for="year in yearList" :key="year" :class="{ active: selectedYear === year }" @click="selectYear(year)">
							<text>{{ year }}</text>
						</view>
					</view>
				</scroll-view>
			</view>
			<block v-if="loading">
				<view class="loading-tip">正在加载...</view>
			</block>
			<block v-else-if="filteredList.length === 0">
				<view class="empty-state">
					<view class="empty-state-icon">
						<!-- <text class="fa fa-images"></text> -->
						<image src="/static/icons/images.svg" class="images-icon" mode="aspectFit" />
					</view>
					<text class="text-xl font-semibold text-gray-800 mb-2">暂无相册</text>
					<text class="text-gray-600">您还没有加入任何旅行相册，</text>
					<text class="text-gray-600">快去开启一段新的旅程吧！</text>
					<view class="action-button" @click="browseProducts">
						<!-- <text class="fa fa-search mr-2"></text> -->
						<image src="/static/icons/search-white.svg" class="search-icon" mode="aspectFit" />
						<text>浏览旅行产品</text>
					</view>
				</view>
			</block>
			<block v-else>
				<view class="album-grid">
					<view v-for="(album, index) in filteredList" :key="album._id" class="album-card" :class="{ 'hero-card': index === 0 }" @click="goToDetail(album._id)">
						<view class="card-image-wrapper">
							<image class="album-cover" :src="getOptimizedImage(album.cover_image || product_image)" mode="aspectFill"></image>

							<block v-if="index === 0">
								<view class="album-overlay"></view>
								<view class="hero-info">
									<text class="album-name">{{ album.album_name }}</text>
									<text class="album-date">{{ formatDateRange(album) }}</text>
								</view>
							</block>
						</view>

						<view class="standard-info" v-if="index !== 0">
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
			loading: false,
			isNavigating: false,
			product_image: '', // 当前行程的商品图片作为所有相册的备用封面
			selectedYear: 'all'
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
	async onPullDownRefresh() {
		console.log('[相册列表] 用户触发下拉刷新');
		// 调用检查，并传入 true 强制刷新
		await this.checkAndRedirectToCurrentItinerary();
	},
	computed: {
		// 自动从 albumList 中提取所有出现的年份，去重并降序排列
		yearList() {
			if (!this.albumList || this.albumList.length === 0) return [];
			const years = this.albumList
				.map((album) => {
					const date = new Date(album.departure_date || Date.now());
					return date.getFullYear();
				})
				.filter((value, index, self) => self.indexOf(value) === index); // 去重
			return years.sort((a, b) => b - a); // 降序
		},
		// 根据选中的年份筛选相册
		filteredList() {
			if (this.selectedYear === 'all') {
				return this.albumList;
			}
			return this.albumList.filter((album) => {
				const date = new Date(album.departure_date || Date.now());
				return date.getFullYear() === this.selectedYear;
			});
		}
	},
	methods: {
		browseProducts() {
			// 跳转到首页或产品列表页 (假设是tabBar页面)
			uni.switchTab({
				url: '/pages/index/index', // 假设您的首页Tab是这个路径
				fail: (err) => {
					console.warn('跳转Tab失败，尝试非Tab页面:', err);
					// 如果首页不是Tab，或者路径不对，尝试跳转到其他页面
					uni.navigateTo({
						url: '/pages/product/list' // 换成您的产品列表页
					});
				}
			});
		},
		selectYear(year) {
			this.selectedYear = year;
		},

		// 检查用户是否有进行中的行程
		async checkAndRedirectToCurrentItinerary() {
			console.log('[相册列表] 开始检查当前行程...');

			// 检查登录状态
			const token = uni.getStorageSync('uni_id_token');
			if (!token) {
				console.log('[相册列表] 用户未登录');
				// uni.navigateTo({
				// 	url: '/pages/login/login'
				// });
				return;
			}

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
				console.log('[相册列表] 用户未登录');
				// uni.navigateTo({
				// 	url: '/pages/login/login'
				// });
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

		formatDate(timestamp, includeYear = true) {
			if (!timestamp) return '';
			const date = new Date(timestamp);
			const year = date.getFullYear();
			const month = date.getMonth() + 1;
			const day = date.getDate();

			if (includeYear) {
				return `${year}.${month}.${day}`;
			} else {
				return `${month}.${day}`;
			}
		},

		formatDateRange(album) {
			if (!album.departure_date) {
				return '日期未知';
			}

			const startDateObj = new Date(album.departure_date);
			const startYear = startDateObj.getFullYear();
			const startStr = this.formatDate(album.departure_date); // 默认带年份

			if (album.total_days && album.total_days > 1) {
				const endDateObj = new Date(album.departure_date);
				endDateObj.setDate(endDateObj.getDate() + album.total_days - 1);

				// 判断是否跨年
				if (startYear === endDateObj.getFullYear()) {
					// 同一年，结束日期不显示年份
					const endStr = this.formatDate(endDateObj.getTime(), false);
					return `${startStr} - ${endStr}`;
				} else {
					// 跨年，结束日期显示年份
					const endStr = this.formatDate(endDateObj.getTime(), true);
					return `${startStr} - ${endStr}`;
				}
			}

			// 只有一天
			return startStr;
		},

		// 智能图片压缩工具
		getOptimizedImage(url, width = 800, height = 0, quality = 80) {
			if (!url) return '';

			// 1. 检查是否已包含处理参数 (OSS参数 / 携程后缀 / 携程Query参数)
			if (url.includes('x-oss-process') || /[_][RC]_\d+/.test(url) || url.includes('proc=')) {
				return url;
			}

			const isAliyun = url.includes('bspapp.com') || url.includes('aliyuncs.com');
			const isCtrip = url.includes('ctrip.com');

			// 2. 阿里云 OSS
			if (isAliyun) {
				// resize,w_800: 宽缩放到800, 质量80, 格式webp
				return url + `?x-oss-process=image/resize,w_${width}/quality,q_${quality}/format,webp`;
			}

			// 3. 携程图片
			if (isCtrip) {
				// _R_宽_10000: 限宽模式
				// _C_宽_高: 裁剪模式
				if (height > 0) return url + `_C_${width}_${height}_Q${quality}.jpg`;
				return url + `_R_${width}_10000_Q${quality}.jpg`;
			}

			return url;
		}
	}
};
</script>

<style scoped>
.album-list-container {
	padding: 0 12rpx 40rpx;
	background-color: #f7f8fa;
	min-height: 100vh;
}

/* 1. 标题区域 */
.page-header {
	padding: 20rpx 32rpx;
	margin-bottom: 20rpx;
}
.main-title {
	font-size: 56rpx;
	font-weight: 800;
	color: #333;
	display: block;
	margin-bottom: 8rpx;
	letter-spacing: 2rpx;
}
.sub-title {
	font-size: 26rpx;
	color: #999;
	letter-spacing: 1rpx;
	font-weight: 400;
}

/* 2. 筛选胶囊 */
.filter-scroll-container {
	margin-bottom: 40rpx;
	height: 60rpx; /* 显式高度防止坍塌 */
}
.year-tabs {
	width: 100%;
	white-space: nowrap;
}
.tab-wrapper {
	display: flex;
	padding: 0 32rpx;
}
.year-tab {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 10rpx 32rpx;
	margin-right: 20rpx;
	border-radius: 100rpx; /* 胶囊圆角 */
	background-color: #f0f2f5;
	color: #666;
	font-size: 26rpx;
	transition: all 0.3s ease;
}
.year-tab.active {
	background-color: #eb6d20; /* 橙色主题 */
	color: #fff;
	font-weight: 600;
	box-shadow: 0 4rpx 12rpx rgba(235, 109, 32, 0.3);
}

.loading-tip {
	text-align: center;
	margin-top: 300rpx;
	color: #999;
	font-size: 28rpx;
	letter-spacing: 2rpx;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 200rpx;
	text-align: center;
}

.empty-state-icon {
	width: 200rpx;
	height: 200rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #fff5f0 0%, #fff 100%);
	border-radius: 40rpx;
	margin-bottom: 40rpx;
	box-shadow: 0 20rpx 40rpx rgba(235, 109, 32, 0.08);
}

.images-icon {
	width: 142rpx;
	height: 128rpx;
	margin-right: 12rpx;
}

.search-icon {
	width: 24px;
	height: 24px;
	margin-right: 6px;
}

.action-button {
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #eb6d20;
	color: #ffffff;
	padding: 24rpx 64rpx;
	border-radius: 100rpx;
	font-size: 30rpx;
	font-weight: 600;
	margin-top: 80rpx;
	box-shadow: 0 16rpx 32rpx rgba(235, 109, 32, 0.25);
	transition: all 0.3s ease;
}

.action-button:active {
	transform: scale(0.98);
	box-shadow: 0 8rpx 16rpx rgba(235, 109, 32, 0.2);
}

.action-button:hover {
	background-color: #f44336; /* 蓝色 (Tailwind blue-800) */
}

/* 3. 相册网格流布局*/
.album-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr); /* 两列 */
	gap: 40rpx;
	row-gap: 40rpx;
	padding: 0 32rpx 60rpx;
}

.album-card {
	position: relative;
	background-color: transparent;
	box-shadow: none;
	border-radius: 0;
}

.card-image-wrapper {
	position: relative;
	width: 100%;
	background-color: #fff;
	padding: 10rpx;
	border-radius: 68rpx; /* 图片圆角 */
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06), 0 2rpx 6rpx rgba(0, 0, 0, 0.04);
	transition: transform 0.3s ease;
	box-sizing: border-box;
}
.album-card:active .card-image-wrapper {
	transform: scale(0.98);
}

/* 最上方一个：占一行，较扁 */
.hero-card {
	grid-column: span 2; /* 跨两列 */
}
.hero-card .card-image-wrapper {
	aspect-ratio: 16 / 9; /* 扁平比例 */
	padding: 0;
	background-color: transparent;
}
.hero-card .album-cover {
	border-radius: 68rpx; /* 让圆角直接作用在图片上 */
}

.album-cover {
	width: 100%;
	height: 100%;
	display: block;
	border-radius: 62rpx; /* 图片圆角略小于相框圆角 */
	background-color: #f0f0f0; /* 图片加载前的底色 */
}

.album-overlay {
	position: absolute;
	bottom: 0; /* 匹配 padding */
	left: 0;
	right: 0;
	height: 60%;
	background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 100%);
	border-radius: 68rpx 68rpx 68rpx 68rpx; /* 匹配图片底部圆角 */
	z-index: 1;
}

.hero-info {
	position: absolute; /* 绝对定位在相框内 */
	bottom: 30rpx;
	left: 30rpx;
	right: 30rpx;
	z-index: 2;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
}

.hero-card .album-name {
	font-size: 30rpx;
	font-weight: 700;
	color: #fff;
	margin: 0 12rpx 12rpx;
	/* margin-bottom: 12rpx; */
	text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2; /* 限制2行 */
	overflow: hidden;
}

.hero-card .album-date {
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.95);
	background: rgba(255, 255, 255, 0.2);
	margin-left: 20rpx;
	padding: 4rpx 22rpx 4rpx;
	border-radius: 50rpx;
	backdrop-filter: blur(4px);
}

/* === 样式 B: 普通相册 (竖长，文字在相框外) === */
.album-card:not(.hero-card) .card-image-wrapper {
	aspect-ratio: 4 / 5; /* 竖长比例 */
}

.standard-info {
	margin-top: 16rpx; /* 文字与相框的距离 */
	padding: 0 8rpx; /* 稍微缩进一点，视觉更平衡 */
	display: flex;
	flex-direction: column;
}

.standard-info .album-name {
	font-size: 28rpx; /* 稍微调小一点，更精致 */
	font-weight: bold;
	color: #333;
	line-height: 1.4;
	margin-bottom: 6rpx;

	/* 限制两行 */
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.standard-info .album-date {
	font-size: 22rpx;
	color: #999;
}
</style>
