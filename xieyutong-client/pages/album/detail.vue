<template>
	<view class="album-detail-page">
		<view class="custom-tabbar">
			<view class="tab-item" @click="switchTab('/pages/home/home')">
				<image src="/static/tab_icons/home.png" class="tab-icon" mode="aspectFit" />
				<text class="tab-text">首页</text>
			</view>

			<view class="tab-item" @click="switchTab('/pages/itinerary/itinerary')">
				<image src="/static/tab_icons/itinerary.png" class="tab-icon" mode="aspectFit" />
				<text class="tab-text">行程</text>
			</view>

			<view class="tab-item active">
				<image src="/static/tab_icons/album_cur.png" class="tab-icon" mode="aspectFit" />
				<text class="tab-text">相册</text>
			</view>

			<view class="tab-item" @click="switchTab('/pages/profile/profile')">
				<image src="/static/tab_icons/my.png" class="tab-icon" mode="aspectFit" />
				<text class="tab-text">我的</text>
			</view>
		</view>

		<view class="header-section" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="back-button" @click="goBack">
				<uni-icons type="left" size="22" color="#333"></uni-icons>
			</view>

			<!-- <view class="album-title-wrapper">
				<view class="album-title">{{ albumInfo.album_name }}</view>
			</view> -->

			<view class="day-tabs" v-if="daysList.length > 0">
				<view class="day-tab" :class="{ active: selectedDay === day }" v-for="day in daysList" :key="day" @click="selectDay(day)">Day {{ day }}</view>
			</view>

			<view class="filter-tabs">
				<view class="filter-tab" :class="{ active: filterMode === 'all' }" @click="setFilterMode('all')">全部</view>
				<view class="filter-tab" :class="{ active: filterMode === 'me' }" @click="setFilterMode('me')">只看我</view>
				<view class="filter-tab" :class="{ active: filterMode === 'guide' }" @click="setFilterMode('guide')">只看导游</view>
			</view>
		</view>

		<scroll-view :scroll-y="true" class="photo-scroll-view">
			<view class="content-wrapper" style="padding-bottom: 160rpx">
				<view v-if="loading" class="loading-state">
					<text>加载中...</text>
				</view>

				<view v-else-if="!currentDayPhotos || currentDayPhotos.length === 0" class="empty-state">
					<image src="/static/icons/images-gray.svg" class="images-icon" mode="aspectFit" />
					<text class="empty-text">今天还没有人上传照片哦</text>
				</view>

				<view v-else class="photo-grid">
					<view v-for="(photo, index) in filteredPhotos" :key="photo._id" class="photo-item" @click="previewMediaItem(photo, index)" @longpress="handleLongPress(photo)">
						<image class="photo-image" :src="getGridThumb(photo.compressed_url || photo.original_url)" mode="aspectFill" />

						<view v-if="photo.media_type === 'video'" class="video-icon-overlay">
							<uni-icons type="videocam-filled" size="30" color="rgba(255,255,255,0.5)"></uni-icons>
							<text class="video-duration" v-if="photo.duration">{{ formatDuration(photo.duration) }}</text>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>

		<view class="fab-container">
			<view class="fab-button upload-fab" @click="handleUpload">
				<uni-icons type="plusempty" size="30" color="#fff"></uni-icons>
			</view>
			<button class="fab-button share-fab" open-type="share">
				<uni-icons type="paperplane" size="30" color="#fff"></uni-icons>
			</button>
		</view>
	</view>
</template>

<script>
import { exif } from '@/uni_modules/lime-shared/exif';
const albumService = uniCloud.importObject('album-service', {
	customUI: true
});

export default {
	data() {
		return {
			statusBarHeight: 0,
			albumId: '',
			currentUid: '',
			userRole: '',
			albumInfo: {},
			groupedPhotos: {},
			loading: false,
			selectedDay: 1,
			daysList: [],
			currentPreviewIndex: 0,
			filterMode: 'all'
		};
	},
	onLoad(options) {
		if (options.id) {
			// 获取系统信息中的状态栏高度
			const systemInfo = uni.getSystemInfoSync();
			this.statusBarHeight = systemInfo.statusBarHeight || 0;
			this.albumId = options.id;
			this.loadUserId();
			this.fetchAlbumDetails();
		} else {
			uni.showToast({
				title: '相册ID无效',
				icon: 'none'
			});
			uni.navigateBack();
		}
	},

	onShareAppMessage(res) {
		console.log('[页面] 用户触发分享', res);

		// 默认的分享标题和图片
		let shareTitle = '邀请你加入群相册';
		let shareImageUrl = '/static/images/default-share-cover.png'; // 确保这个文件存在

		// 如果相册信息已加载，则使用更具体的标题
		if (this.albumInfo && this.albumInfo.album_name) {
			shareTitle = `快来看看我们“${this.albumInfo.album_name}”的精彩照片！`;
		}

		// 如果相册有照片，则使用第一张作为封面
		if (this.groupedPhotos && Object.keys(this.groupedPhotos).length > 0) {
			const firstDayKey = Object.keys(this.groupedPhotos)[0];
			if (this.groupedPhotos[firstDayKey] && this.groupedPhotos[firstDayKey].length > 0) {
				shareImageUrl = this.groupedPhotos[firstDayKey][0].compressed_url;
			}
		}

		console.log(`[页面] 分享信息: Title=${shareTitle}, Path=/pages/album/detail?id=${this.albumId}`);

		return {
			title: shareTitle,
			path: `/pages/album/detail?id=${this.albumId}`,
			imageUrl: shareImageUrl
		};
	},

	computed: {
		currentDayPhotos() {
			const key = `Day ${this.selectedDay}`;
			return this.groupedPhotos[key] || [];
		},
		filteredPhotos() {
			if (this.filterMode === 'all') {
				return this.currentDayPhotos;
			}
			if (this.filterMode === 'me') {
				return this.currentDayPhotos.filter((p) => p.user_id === this.currentUid);
			}
			if (this.filterMode === 'guide') {
				return this.currentDayPhotos.filter((p) => p.is_guide === true);
			}
			return [];
		}
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},

		switchTab(url) {
			uni.switchTab({
				url: url,
				fail: (err) => {
					console.error('跳转 Tab 失败', err);
					// 如果目标不是 Tab 页面，尝试用 redirectTo
					uni.redirectTo({ url });
				}
			});
		},

		async loadUserId() {
			if (this.loading) {
				return;
			}

			try {
				console.log('[用户数据] 开始加载用户数据');

				// 1. 查询用户基本信息
				const db = uniCloud.database();
				const usersCollection = db.collection('uni-id-users');

				const userRes = await usersCollection.where('_id == $cloudEnv_uid').field({ _id: true, role: true }).get();
				console.log('用户查询结果: ', userRes);

				if (userRes.result && userRes.result.data && userRes.result.data.length > 0) {
					this.currentUid = userRes.result.data[0]._id;
					this.userRole = userRes.result.data[0].role || [];
				} else {
					console.error('未找到用户信息');
					return;
				}
			} catch (error) {
				console.error('加载用户数据失败:', error);
			} finally {
				this.loading = false;
			}
		},

		async fetchAlbumDetails() {
			console.log(`[页面] 开始获取相册详情: ${this.albumId}`);
			this.loading = true;
			try {
				const res = await albumService.getAlbumInfo(this.albumId);
				if (res.errCode === 0) {
					this.albumInfo = res.data.albumInfo;
					this.groupedPhotos = res.data.photos;
					this.daysList = Array.from({ length: res.data.albumInfo.total_days }, (_, i) => i + 1);
					this.selectedDay = this.albumInfo.currentDay || 1;
					console.log('[页面] 成功获取相册详情及照片:', res.data);
				} else {
					throw new Error(res.errMsg);
				}
			} catch (e) {
				console.error('[页面] 获取相册详情失败:', e);
				uni.showModal({
					title: '加载失败',
					content: e.message || '网络错误，请稍后再试',
					showCancel: false,
					complete: () => {
						uni.navigateBack();
					}
				});
			} finally {
				this.loading = false;
			}
		},

		// 选择天数的逻辑
		selectDay(day) {
			this.selectedDay = day;
		},

		setFilterMode(mode) {
			this.filterMode = mode;
		},

		handleUpload() {
			uni.chooseMedia({
				count: 9,
				mediaType: ['image', 'video'], // 同时支持图片和视频
				sourceType: ['album', 'camera'],
				maxDuration: 60, // 视频最大时长(秒)
				success: async (res) => {
					const tempFiles = res.tempFiles;

					// 大小校验 (视频放宽到100MB, 图片20MB)
					const validFiles = [];
					for (const file of tempFiles) {
						const limit = file.fileType === 'video' ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
						if (file.size > limit) {
							uni.showToast({ title: '部分文件过大已跳过', icon: 'none' });
						} else {
							validFiles.push(file);
						}
					}

					if (validFiles.length === 0) return;

					uni.showLoading({ title: '上传中...' });
					let uploadedCount = 0;

					const uploadPromises = validFiles.map(async (tempFile) => {
						try {
							const isVideo = tempFile.fileType === 'video';
							let filePath = tempFile.tempFilePath; // 默认用原路径

							if (isVideo && tempFile.size > 20 * 1024 * 1024) {
								uni.showLoading({ title: '视频压缩中...' });
								try {
									const compressRes = await uni.compressVideo({
										src: filePath,
										quality: 'medium',
										resolution: 0.8
									});
									filePath = compressRes.tempFilePath; // 使用压缩后的路径
									console.log('视频已压缩');
								} catch (e) {
									console.error('压缩失败，使用原片');
								}
								uni.showLoading({ title: '上传中...' }); // 恢复提示
							}

							// 1. 上传主文件 (图片或视频)
							let extension = tempFile.tempFilePath.split('.').pop();
							// 简单的后缀处理
							if (!extension || extension.length > 5) extension = isVideo ? 'mp4' : 'jpg';

							const randomName = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}.${extension}`;
							const cloudPath = `album-photos/${this.albumId}/${randomName}`;

							const uploadRes = await uniCloud.uploadFile({
								filePath: filePath,
								cloudPath: cloudPath
							});

							// 2. 如果是视频，尝试上传封面图 (chooseMedia 会返回 thumbTempFilePath)
							let posterUploadRes = null;
							if (isVideo && tempFile.thumbTempFilePath) {
								const posterName = `${randomName}_poster.jpg`;
								posterUploadRes = await uniCloud.uploadFile({
									filePath: tempFile.thumbTempFilePath,
									cloudPath: `album-photos/${this.albumId}/${posterName}`
								});
							}

							// 3. 提交到数据库
							await albumService.uploadPhotos({
								albumId: this.albumId,
								file: uploadRes,
								posterFile: posterUploadRes, // 传递封面图信息
								mediaType: isVideo ? 'video' : 'image',
								duration: tempFile.duration, // 视频时长
								shootingTime: Date.now(),
								is_guide: this.userRole.includes('guide')
							});

							uploadedCount++;
						} catch (e) {
							console.error('上传失败', e);
						}
					});

					await Promise.all(uploadPromises);
					uni.hideLoading();
					uni.showToast({ title: '上传完成', icon: 'success' });
					this.fetchAlbumDetails();
				},
				fail: (err) => {
					console.log('选择媒体失败', err);
				}
			});
		},

		// 格式化秒数
		formatDuration(seconds) {
			if (!seconds) return '';
			const m = Math.floor(seconds / 60);
			const s = Math.floor(seconds % 60);
			return `${m}:${s < 10 ? '0' + s : s}`;
		},

		// 预览逻辑
		previewMediaItem(currentPhoto, index) {
			// 构造 sources 数组，适配 uni.previewMedia
			const sources = this.filteredPhotos.map((p) => ({
				url: p.original_url,
				type: p.media_type === 'video' ? 'video' : 'image',
				poster: p.media_type === 'video' ? p.video_poster_url || p.compressed_url : ''
			}));

			// 找到当前点击项在 filteredPhotos 中的真实 index
			// 注意：这里需要确保 filteredPhotos 和 sources 是一一对应的
			const currentIndex = this.filteredPhotos.indexOf(currentPhoto);

			uni.previewMedia({
				sources: sources,
				current: currentIndex,
				success: () => {
					console.log('预览打开成功');
				},
				fail: (err) => {
					console.error('预览打开失败l', err);
					// 降级处理：如果 previewMedia 不支持（某些旧环境），回退到 previewImage (只看图片)
					if (currentPhoto.media_type !== 'video') {
						this.previewImage(currentPhoto);
					} else {
						uni.showToast({ title: '当前环境不支持预览视频', icon: 'none' });
					}
				}
			});
		},

		// 生成网格小图 (WebP + 400px)
		getGridThumb(url) {
			if (!url) return '';
			return url + '?x-oss-process=image/resize,w_400/quality,q_80/format,webp';
		},

		// 生成预览大图 (JPG + 1920px，不用WebP以防保存兼容性问题)
		getPreviewUrl(url) {
			if (!url) return '';
			return url + '?x-oss-process=image/resize,w_1920/quality,q_90/format,jpg';
		},

		previewImage(currentPhoto) {
			const urls = this.filteredPhotos.map((p) => this.getPreviewUrl(p.original_url));
			const currentIndex = urls.findIndex((url) => url === currentPhoto.original_url);
			this.currentPreviewIndex = currentIndex;
			console.log('currentIndex: ', currentIndex);
			uni.previewImage({
				urls: urls,
				current: currentIndex,
				showmenu: true,
				onChange: (index) => {
					this.currentPreviewIndex = index;
					console.log('Preview index changed:', index);
				},
				longPressActions: {
					itemList: ['保存', '分享', '删除'],
					success: (res) => {
						// 根据当前索引获取照片信息
						const currentPhotoOnPreview = this.filteredPhotos[this.currentPreviewIndex];
						console.log('currentPhotoOnPreview: ', currentPhotoOnPreview);
						// 选项 0: '保存照片'
						if (res.tapIndex === 0) {
							this.downloadPhoto(currentPhotoOnPreview);
						}
						// 选项 1: '分享照片'
						else if (res.tapIndex === 1) {
							this.shareSinglePhoto(currentPhotoOnPreview);
						}
						// 选项 2: '删除照片'
						else if (res.tapIndex === 2) {
							// *在点击时*才检查权限
							if (currentPhotoOnPreview.user_id === this.currentUid) {
								this.deletePhoto(currentPhotoOnPreview);
							} else {
								// 用户点击了“删除”但不是自己的照片
								// uni.closePreviewImage(); // 关闭预览
								uni.showToast({
									title: '只能删除自己的文件',
									icon: 'none'
								});
							}
						}
					},
					fail: (err) => {
						console.log('longPressActions fail:', err);
					}
				}
			});
		},

		handleLongPress(photo) {
			console.log(`[页面] 长按文件: user_id: ${photo.user_id}, currentUid: ${this.currentUid}`);
			// 动态构建菜单
			let itemList = ['保存'];
			if (photo.user_id === this.currentUid || this.userRole.includes('guide')) {
				itemList.push('删除');
			}

			if (photo.media_type !== 'video') {
				itemList.push('分享');
			}

			console.log(`[页面] 长按文件:`, photo);
			uni.showActionSheet({
				itemList: itemList,
				itemColor: '#000000', // 默认颜色
				success: (res) => {
					const tappedItem = itemList[res.tapIndex];

					if (tappedItem === '保存') {
						this.downloadPhoto(photo);
					} else if (tappedItem === '分享') {
						this.shareSinglePhoto(photo);
					} else if (tappedItem === '删除') {
						// 此时已确认是自己的照片
						this.deletePhoto(photo);
					}
				}
			});
		},

		downloadPhoto(photo) {
			uni.showLoading({ title: '正在保存...' });
			uni.downloadFile({
				url: photo.original_url || photo.compressed_url,
				success: (res) => {
					if (res.statusCode === 200) {
						if (photo.media_type === 'video') {
							// 保存视频
							uni.saveVideoToPhotosAlbum({
								filePath: res.tempFilePath,
								success: () => {
									uni.hideLoading();
									uni.showToast({ title: '视频已保存', icon: 'success' });
								},
								fail: (err) => this.handleSaveFail(err)
							});
						} else {
							// 保存图片
							uni.saveImageToPhotosAlbum({
								filePath: res.tempFilePath,
								success: () => {
									uni.hideLoading();
									uni.showToast({ title: '图片已保存', icon: 'success' });
								},
								fail: (err) => this.handleSaveFail(err)
							});
						}
					} else {
						uni.hideLoading();
						uni.showToast({ title: '下载失败', icon: 'none' });
					}
				},
				fail: (err) => {
					uni.hideLoading();
					console.error('Download error:', err);
					uni.showToast({ title: '下载失败', icon: 'none' });
				}
			});
		},

		handleSaveFail(err) {
			uni.hideLoading();
			// 检查是否是权限问题
			if (err.errMsg && (err.errMsg.includes('auth') || err.errMsg.includes('deny') || err.errMsg.includes('scope'))) {
				uni.showModal({
					title: '保存失败',
					content: '需要您的相册授权才能保存文件，请去设置中开启。',
					showCancel: true,
					confirmText: '去设置',
					success: (modalRes) => {
						if (modalRes.confirm) {
							uni.openSetting();
						}
					}
				});
			} else {
				console.error('Save media error:', err);
				uni.showToast({ title: '保存失败', icon: 'none' });
			}
		},

		shareSinglePhoto(photo) {
			uni.showLoading({ title: '准备分享...' });
			console.log('即将下载的URL:', photo.original_url);
			uni.downloadFile({
				url: photo.original_url || photo.compressed_url,
				success: (res) => {
					uni.hideLoading();
					if (res.statusCode === 200) {
						// 调起微信分享（好友或朋友圈）
						uni.showShareImageMenu({
							path: res.tempFilePath,
							fail: (shareErr) => {
								console.error('Share menu error:', shareErr);
								if (shareErr.errMsg && shareErr.errMsg.indexOf('cancel') === -1) {
									uni.showToast({ title: '分享失败', icon: 'none' });
								}
							}
						});
					} else {
						uni.showToast({ title: '文件下载失败', icon: 'none' });
					}
				},
				fail: (err) => {
					uni.hideLoading();
					console.error('Download error:', err);
					uni.showToast({ title: '文件下载失败', icon: 'none' });
				}
			});
		},

		deletePhoto(photo) {
			uni.showModal({
				title: '确认删除',
				content: '删除后将无法恢复，确定要删除该文件吗？',
				confirmColor: '#FF0000',
				success: async (modalRes) => {
					if (modalRes.confirm) {
						uni.showLoading({ title: '正在删除...' });
						try {
							const deleteResult = await albumService.deletePhoto(photo._id);
							if (deleteResult.errCode === 0) {
								uni.hideLoading();
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								});
								// 刷新照片列表
								this.fetchAlbumDetails();
							} else {
								throw new Error(deleteResult.errMsg);
							}
						} catch (e) {
							uni.hideLoading();
							uni.showToast({
								title: e.message || '删除失败',
								icon: 'none'
							});
						}
					}
				}
			});
		}
	}
};
</script>

<style scoped>
.images-icon {
	width: 140rpx;
	height: 124rpx;
	margin-bottom: 60rpx;
}

.header-section {
	background-color: #f8f8f8;
	position: relative;
	width: 100%;
	z-index: 90;
	box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.05);
}

.back-button {
	position: absolute;
	left: 24rpx;
	top: calc(var(--status-bar-height) + 40rpx);
	width: 70rpx;
	height: 70rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 99;
	background-color: rgba(255, 255, 255, 0.7);
	border-radius: 50%;
}

.content-wrapper {
	padding: 0 16rpx 24rpx; /* 左右和底部内边距 */
}

.album-title-wrapper {
	padding: calc(var(--status-bar-height) + 30rpx) 20rpx 0rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 74px;
}

.album-title {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
	line-height: 1.4;
	margin-bottom: 20rpx;
	padding-left: 8rpx;

	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2; /* 限制为两行 */
	-webkit-box-orient: vertical;
}

.album-detail-page {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background-color: #f8f8f8;
}

.day-tabs {
	display: flex;
	overflow-x: auto;
	/* padding: 8px 20px; */
	padding: calc(var(--status-bar-height) + 50rpx) 20rpx 0rpx;
	scrollbar-width: none;
}

.day-tabs::-webkit-scrollbar {
	display: none;
}

.day-tab {
	flex: 0 0 auto;
	padding: 8px 12px;
	margin-right: 10px;
	border-radius: 16px;
	font-size: 14px;
	white-space: nowrap;
	background-color: #f0f7ff;
	color: #eb6d20;
	transition: all 0.2s ease;
}

.day-tab.active {
	background-color: #eb6d20;
	color: white;
	box-shadow: 0 2rpx 4rpx rgba(0, 134, 246, 0.3);
}

.photo-scroll-view {
	flex: 1;
	height: 0; /* 重要：让flex布局生效 */
}

.filter-tabs {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 20rpx 0 20rpx;
}
.filter-tab {
	padding: 8rpx 24rpx;
	font-size: 28rpx;
	color: #666;
	background-color: #f0f0f0;
	border-radius: 30rpx;
	margin: 0 10rpx;
	transition: all 0.2s;
}
.filter-tab.active {
	background-color: #eb6d20;
	color: #fff;
	font-weight: bold;
}

.loading-state,
.empty-state {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	padding-top: 100rpx;
	color: #999;
}

.empty-image {
	width: 300rpx;
	height: 300rpx;
	margin-bottom: 20rpx;
}

.photo-sections {
	padding: 16rpx;
}

.day-section {
	margin-bottom: 40rpx;
}

.day-header {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	padding: 20rpx 4rpx;
}

.photo-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 8rpx;
}

.photo-item {
	width: 100%;
	padding-bottom: 100%; /* 1:1 aspect ratio */
	position: relative;
	border-radius: 8rpx;
	overflow: hidden;
}

.photo-image {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.upload-fab {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	background-color: #eb6d20;
	display: flex;
	justify-content: center;
	align-items: center;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.4);
	z-index: 10;
}

.fab-container {
	position: fixed;
	right: 40rpx;
	bottom: calc(160rpx + constant(safe-area-inset-bottom));
	bottom: calc(160rpx + env(safe-area-inset-bottom));
	display: flex;
	flex-direction: column-reverse;
	align-items: center;
	z-index: 1000;
}

.fab-button {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	display: flex;
	justify-content: center;
	align-items: center;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
	margin-top: 20rpx;
	padding: 0; /* 清除button默认padding */
}

.fab-button::after {
	border: none; /* 清除button默认边框 */
}

.upload-fab {
	background-color: #eb6d20;
}

.share-fab {
	background-color: #1aad19; /* 微信绿 */
}

/* 自定义 Tabbar 容器 */
.custom-tabbar {
	position: fixed;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 100rpx; /* 标准 Tabbar 高度 */
	background-color: #ffffff;
	border-top: 1rpx solid #eeeeee;
	display: flex;
	justify-content: space-around;
	align-items: center;
	z-index: 999;
	/* 适配 iPhone X 等全面屏底部安全区 */
	padding-bottom: constant(safe-area-inset-bottom);
	padding-bottom: env(safe-area-inset-bottom);
	box-shadow: 0 -1rpx 5rpx rgba(0, 0, 0, 0.02);
}

.tab-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	flex: 1;
	height: 100%;
}

.tab-icon {
	width: 52rpx; /* 标准图标大小 */
	height: 52rpx;
}

.tab-text {
	font-size: 22rpx;
	color: #999999;
}

/* 激活状态样式 */
.tab-item.active .tab-text {
	color: #eb6d20; /* 你的主题色 */
}

.video-icon-overlay {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	background-color: rgba(0, 0, 0, 0.2); /* 轻微变暗 */
}

.video-duration {
	font-size: 20rpx;
	color: rgba(255, 255, 255, 0.5);
	margin-top: 4rpx;
	background-color: rgba(0, 0, 0, 0.5);
	padding: 2rpx 8rpx;
	border-radius: 8rpx;
}
</style>
