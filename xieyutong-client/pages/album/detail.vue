<template>
	<view class="album-detail-page">
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
			<view class="content-wrapper">
				<view v-if="loading" class="loading-state">
					<text>加载中...</text>
				</view>

				<view v-else-if="!currentDayPhotos || currentDayPhotos.length === 0" class="empty-state">
					<text class="empty-text">今天还没有人上传照片哦</text>
				</view>

				<view v-else class="photo-grid">
					<view v-for="(photo, index) in filteredPhotos" :key="photo._id" class="photo-item" @click="previewImage(photo)" @longpress="handleLongPress(photo)">
						<image class="photo-image" :src="photo.compressed_url" mode="aspectFill" />
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
			uni.chooseImage({
				count: 9, // 最多选择9张
				sizeType: ['original', 'compressed'],
				sourceType: ['album', 'camera'],
				success: async (res) => {
					const maxSize = 10 * 1024 * 1024;
					const validFiles = [];
					const invalidFileNames = [];
					for (const tempFile of res.tempFiles) {
						if (tempFile.size > maxSize) {
							// 文件过大，记录下来
							let fileName = tempFile.path.split('/').pop();
							invalidFileNames.push(fileName);
						} else {
							// 文件大小合格，加入待上传列表
							validFiles.push(tempFile);
						}
					}

					if (invalidFileNames.length > 0) {
						uni.showToast({
							title: `${invalidFileNames.length}张图片超过10MB，已自动跳过。`,
							icon: 'none',
							duration: 3000
						});
					}

					// 2. 如果没有合格的文件，则直接停止
					if (validFiles.length === 0) {
						console.log('[页面] 没有符合大小的文件可上传');
						return;
					}

					uni.showLoading({ title: '上传中 0/ ' + validFiles.length });
					let uploadedCount = 0;

					// 使用 Promise.all 来并行处理所有文件的上传，速度更快
					const uploadPromises = validFiles.map((tempFile) => {
						return new Promise(async (resolve, reject) => {
							try {
								console.log('[页面] 准备上传临时文件:', tempFile);

								// 0. 解析拍摄时间
								let shootingTime = Date.now();
								try {
									// 将EXIF解析包装在Promise中
									const exifTime = await new Promise((exifResolve, exifReject) => {
										// 设置一个超时，防止EXIF库卡死
										const timer = setTimeout(() => {
											exifReject(new Error('EXIF parsing timed out'));
										}, 1500); // 1.5秒超时

										exif.getData(tempFile, function () {
											clearTimeout(timer);
											try {
												const dateTimeOriginal = exif.getTag(this, 'DateTimeOriginal');
												if (!dateTimeOriginal) {
													return exifResolve(null);
												}

												const [datePart, timePart] = dateTimeOriginal.split(' ');
												const [year, month, day] = datePart.split(':');
												const [hours, minutes, seconds] = timePart.split(':');
												const date = new Date(year, month - 1, day, hours, minutes, seconds);
												const time = date.getTime();

												if (!isNaN(time)) {
													console.log('[EXIF] 解析到拍摄时间:', date.toLocaleString());
													exifResolve(time);
												} else {
													exifResolve(null);
												}
											} catch (e) {
												// 捕获回调内部错误
												exifReject(e);
											}
										});
									});

									// 如果成功解析到时间，则使用
									if (exifTime) {
										shootingTime = exifTime;
									}
								} catch (exifError) {
									console.warn('[EXIF] 解析失败，使用当前时间:', exifError);
								}

								// 1. 从临时路径中提取文件后缀名
								const filePath = tempFile.path;
								// 使用正则表达式匹配最后一个点之后的内容作为后缀
								const extensionMatch = /\.([a-zA-Z0-9]+)$/.exec(filePath);
								const extension = extensionMatch ? extensionMatch[0] : '.jpg'; // 如果没有匹配到，默认为.jpg

								// 2. 生成一个唯一的、随机的文件名 (时间戳 + 8位随机字符串)
								const randomString = Math.random().toString(36).substring(2, 10);
								const fileName = `${shootingTime}-${randomString}${extension}`;

								// 3. 构造完整、正确的云端存储路径
								const cloudPath = `album-photos/${this.albumId}/${fileName}`;
								console.log('[页面] 生成的 CloudPath:', cloudPath);

								// 4. 上传文件到云存储
								const uploadResult = await uniCloud.uploadFile({
									filePath: filePath,
									cloudPath: cloudPath // 使用新生成的路径
								});
								console.log(`[页面] 文件 ${fileName} 上传成功:`, uploadResult);

								// 5. 调用云对象方法，将文件信息写入数据库
								await albumService.uploadPhotos({
									albumId: this.albumId,
									file: uploadResult,
									shootingTime: shootingTime,
									is_guide: this.userRole.includes('guide')
								});

								// 更新上传进度
								uploadedCount++;
								uni.showLoading({ title: `上传中 ${uploadedCount}/${res.tempFiles.length}` });

								resolve(); // 当前文件处理成功
							} catch (e) {
								console.error('[页面] 单个文件上传处理失败:', e);
								reject(e); // 当前文件处理失败
							}
						});
					});

					try {
						// 等待所有文件的上传和数据库写入操作完成
						await Promise.all(uploadPromises);
						uni.hideLoading();
						uni.showToast({
							title: '上传完成',
							icon: 'success'
						});
						this.fetchAlbumDetails(); // 全部成功后，刷新照片列表
					} catch (error) {
						// 如果有任何一个文件上传失败，则进入这里
						uni.hideLoading();
						uni.showToast({
							title: '部分文件上传失败',
							icon: 'none'
						});
					}
				},
				fail: (err) => {
					// 用户取消选择图片时，不弹出提示
					if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
						console.error('[页面] 选择图片失败:', err);
						uni.showToast({
							title: '选择图片失败',
							icon: 'none'
						});
					}
				}
			});
		},

		previewImage(currentPhoto) {
			const urls = this.filteredPhotos.map((p) => p.original_url);
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
					itemList: ['保存照片', '分享照片', '删除照片'],
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
									title: '只能删除自己的照片',
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
			console.log(`[页面] 长按照片: user_id: ${photo.user_id}, currentUid: ${this.currentUid}`);
			// 动态构建菜单
			let itemList = ['保存照片', '分享照片'];
			if (photo.user_id === this.currentUid || this.userRole.includes('guide')) {
				itemList.push('删除照片');
			}

			console.log(`[页面] 长按照片:`, photo);
			uni.showActionSheet({
				itemList: itemList,
				itemColor: '#000000', // 默认颜色
				success: (res) => {
					const tappedItem = itemList[res.tapIndex];

					if (tappedItem === '保存照片') {
						this.downloadPhoto(photo);
					} else if (tappedItem === '分享照片') {
						this.shareSinglePhoto(photo);
					} else if (tappedItem === '删除照片') {
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
						uni.saveImageToPhotosAlbum({
							filePath: res.tempFilePath,
							success: () => {
								uni.hideLoading();
								uni.showToast({
									title: '已保存到相册',
									icon: 'success'
								});
							},
							fail: (saveErr) => {
								uni.hideLoading();
								// 检查是否是权限问题
								if (saveErr.errMsg && (saveErr.errMsg.indexOf('auth') > -1 || saveErr.errMsg.indexOf('Auth') > -1)) {
									uni.showModal({
										title: '保存失败',
										content: '您未授权保存图片到相册，请在小程序设置中打开“相册”权限。',
										showCancel: true,
										confirmText: '去设置',
										success: (modalRes) => {
											if (modalRes.confirm) {
												uni.openSetting(); // 打开设置界面
											}
										}
									});
								} else {
									console.error('Save image error:', saveErr);
									uni.showToast({ title: '保存失败', icon: 'none' });
								}
							}
						});
					} else {
						uni.hideLoading();
						uni.showToast({ title: '图片下载失败', icon: 'none' });
					}
				},
				fail: (err) => {
					uni.hideLoading();
					console.error('Download error:', err);
					uni.showToast({ title: '图片下载失败', icon: 'none' });
				}
			});
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
						uni.showToast({ title: '图片下载失败', icon: 'none' });
					}
				},
				fail: (err) => {
					uni.hideLoading();
					console.error('Download error:', err);
					uni.showToast({ title: '图片下载失败', icon: 'none' });
				}
			});
		},

		deletePhoto(photo) {
			uni.showModal({
				title: '确认删除',
				content: '删除后将无法恢复，确定要删除这张照片吗？',
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
	bottom: 120rpx;
	display: flex;
	flex-direction: column-reverse;
	align-items: center;
	z-index: 10;
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
</style>
