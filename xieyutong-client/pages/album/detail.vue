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

			<view class="day-stats-bar" v-if="filteredPhotos.length > 0 && !isSelectionMode">
				<text class="stats-text">共 {{ filteredPhotos.length }} 张照片</text>
				<view class="download-day-btn" @click="handleDownloadDay">
					<uni-icons type="download" size="14" color="#eb6d20"></uni-icons>
					<text>一键下载本页</text>
				</view>
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

				<view class="waterfall-container" v-if="filteredPhotos.length > 0">
					<view class="waterfall-column">
						<view v-for="(photo, index) in waterfallData.col1" :key="photo._id" class="photo-card" @click="handlePhotoTap(photo)" @longpress="handleLongPress(photo)">
							<image class="card-image" :src="getGridThumb(photo.compressed_url || photo.original_url)" mode="widthFix" lazy-load />
							<view v-if="photo.media_type === 'video'" class="video-tag">
								<uni-icons type="videocam-filled" size="16" color="#fff"></uni-icons>
								<text class="time-text" v-if="photo.duration">{{ formatDuration(photo.duration) }}</text>
							</view>
							<view v-if="isSelectionMode" class="selection-overlay" :class="{ selected: selectedPhotoIds.includes(photo._id) }">
								<view class="checkbox-circle">
									<uni-icons v-if="selectedPhotoIds.includes(photo._id)" type="checkmarkempty" size="16" color="#fff"></uni-icons>
								</view>
							</view>
						</view>
					</view>

					<view class="waterfall-column">
						<view v-for="(photo, index) in waterfallData.col2" :key="photo._id" class="photo-card" @click="handlePhotoTap(photo)" @longpress="handleLongPress(photo)">
							<image class="card-image" :src="getGridThumb(photo.compressed_url || photo.original_url)" mode="widthFix" lazy-load />
							<view v-if="photo.media_type === 'video'" class="video-tag">
								<uni-icons type="videocam-filled" size="16" color="#fff"></uni-icons>
								<text class="time-text" v-if="photo.duration">{{ formatDuration(photo.duration) }}</text>
							</view>
							<view v-if="isSelectionMode" class="selection-overlay" :class="{ selected: selectedPhotoIds.includes(photo._id) }">
								<view class="checkbox-circle">
									<uni-icons v-if="selectedPhotoIds.includes(photo._id)" type="checkmarkempty" size="16" color="#fff"></uni-icons>
								</view>
							</view>
						</view>
					</view>

					<view class="waterfall-column">
						<view v-for="(photo, index) in waterfallData.col3" :key="photo._id" class="photo-card" @click="handlePhotoTap(photo)" @longpress="handleLongPress(photo)">
							<image class="card-image" :src="getGridThumb(photo.compressed_url || photo.original_url)" mode="widthFix" lazy-load />
							<view v-if="photo.media_type === 'video'" class="video-tag">
								<uni-icons type="videocam-filled" size="16" color="#fff"></uni-icons>
								<text class="time-text" v-if="photo.duration">{{ formatDuration(photo.duration) }}</text>
							</view>
							<view v-if="isSelectionMode" class="selection-overlay" :class="{ selected: selectedPhotoIds.includes(photo._id) }">
								<view class="checkbox-circle">
									<uni-icons v-if="selectedPhotoIds.includes(photo._id)" type="checkmarkempty" size="16" color="#fff"></uni-icons>
								</view>
							</view>
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

		<view class="batch-bar" v-if="isSelectionMode">
			<view class="batch-header">
				<text class="batch-btn cancel" @click="exitSelectionMode">取消</text>
				<text class="batch-info">已选 {{ selectedPhotoIds.length }} 项</text>
				<text class="batch-btn select-all" @click="selectAllPhotos">全选</text>
			</view>

			<view class="batch-actions">
				<view class="action-item" @click="handleBatchDownload">
					<view class="icon-box">
						<uni-icons type="download" size="24" color="#333"></uni-icons>
					</view>
					<text>下载</text>
				</view>

				<view class="action-item" @click="handleBatchDelete">
					<view class="icon-box delete">
						<uni-icons type="trash" size="24" color="#FF0000"></uni-icons>
					</view>
					<text class="text-delete">删除</text>
				</view>
			</view>
		</view>

		<uni-popup ref="ratingPopup" type="center" :is-mask-click="false">
			<view class="rating-popup-box">
				<text class="rating-title">照片下载成功</text>
				<text class="rating-subtitle">咱们私导这一路拍摄的照片您还满意吗？\n打个分鼓励一下吧！</text>

				<view class="rate-container">
					<uni-rate v-model="ratingScore" :size="36" margin="15" color="#E5E5E5" active-color="#eb6d20" :touchable="true" />
				</view>

				<textarea v-model="ratingComment" placeholder="留下几句评价或感谢的话..." class="rating-textarea" placeholder-style="color:#bbb" :disable-default-padding="true" />

				<view class="rating-btn-row">
					<view class="custom-btn btn-gray" @click="closeRatingPopup">
						<text>暂不评价</text>
					</view>
					<view class="custom-btn btn-orange" @click="submitRating">
						<text>提交评价</text>
					</view>
				</view>
			</view>
		</uni-popup>
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
			filterMode: 'all',
			isSelectionMode: false,
			selectedPhotoIds: [],
			ratingScore: 5,
			ratingComment: '',
			hasRated: false
		};
	},
	onLoad(options) {
		if (options.id) {
			// 获取系统信息中的状态栏高度
			const systemInfo = uni.getSystemInfoSync();
			this.statusBarHeight = systemInfo.statusBarHeight || 0;
			this.albumId = options.id;
			console.log('albumId: ', this.albumId);
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
		},
		waterfallData() {
			const col1 = [];
			const col2 = [];
			const col3 = [];

			this.filteredPhotos.forEach((item, index) => {
				const remainder = index % 3;
				if (remainder === 0) {
					col1.push(item);
				} else if (remainder === 1) {
					col2.push(item);
				} else {
					col3.push(item);
				}
			});

			return { col1, col2, col3 };
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
					this.checkRemoteRatingStatus();
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

		async checkRemoteRatingStatus() {
			if (!this.currentUid || !this.albumId) return;

			try {
				const db = uniCloud.database();
				const res = await db
					.collection('a-group-albums')
					.where({
						_id: this.albumId,
						'guest_ratings.user_id': this.currentUid
					})
					.count();

				// 如果查到了记录，说明已经评价过
				if (res.result.total > 0) {
					this.hasRated = true;
					console.log('用户已评价过该相册');

					// 同步更新本地缓存
					uni.setStorageSync(`album_rated_${this.albumId}`, true);
				} else {
					uni.removeStorageSync(`album_rated_${this.albumId}`);
				}
			} catch (e) {
				console.error('检查评价状态失败', e);
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

		// 点击照片逻辑：如果是多选模式则切换选中，否则预览
		handlePhotoTap(photo) {
			if (this.isSelectionMode) {
				this.toggleSelection(photo);
			} else {
				this.previewMediaItem(photo);
			}
		},

		// 切换选中状态
		toggleSelection(photo) {
			const index = this.selectedPhotoIds.indexOf(photo._id);
			if (index > -1) {
				this.selectedPhotoIds.splice(index, 1);
			} else {
				this.selectedPhotoIds.push(photo._id);
			}
		},

		// 预览逻辑
		previewMediaItem(currentPhoto) {
			// 构造 sources 数组，适配 uni.previewMedia
			const sources = this.filteredPhotos.map((p) => ({
				url: p.original_url,
				type: p.media_type === 'video' ? 'video' : 'image',
				poster: p.media_type === 'video' ? p.video_poster_url || p.compressed_url : ''
			}));

			const currentIndex = this.filteredPhotos.findIndex((p) => p._id === currentPhoto._id);

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
			if (this.isSelectionMode) return;
			uni.vibrateShort(); // 震动反馈
			this.isSelectionMode = true;
			this.selectedPhotoIds = [photo._id];
		},

		// 退出多选
		exitSelectionMode() {
			this.isSelectionMode = false;
			this.selectedPhotoIds = [];
		},

		// 全选/反选
		selectAllPhotos() {
			const allIds = this.filteredPhotos.map((p) => p._id);
			if (this.selectedPhotoIds.length === allIds.length) {
				this.selectedPhotoIds = [];
			} else {
				this.selectedPhotoIds = [...allIds];
			}
		},

		// 一键下载整天（根据当前筛选）
		async handleDownloadDay() {
			if (this.filteredPhotos.length === 0) return;

			uni.showModal({
				title: '确认下载',
				content: `确定要下载当前显示的全部 ${this.filteredPhotos.length} 张照片/视频吗？`,
				success: (res) => {
					if (res.confirm) {
						// 复用批量下载逻辑，传入所有当前照片
						this.processDownload(this.filteredPhotos);
					}
				}
			});
		},

		// 批量下载（选中的）
		handleBatchDownload() {
			if (this.selectedPhotoIds.length === 0) return;
			const selectedPhotos = this.filteredPhotos.filter((p) => this.selectedPhotoIds.includes(p._id));
			this.processDownload(selectedPhotos);
		},

		// 下载处理逻辑
		async processDownload(photos) {
			const count = photos.length;
			uni.showLoading({ title: `准备下载 0/${count}` });

			let successCount = 0;
			let failCount = 0;

			for (let i = 0; i < count; i++) {
				const photo = photos[i];
				uni.showLoading({ title: `正在保存 ${i + 1}/${count}` });

				try {
					// 1. 下载文件
					const downloadRes = await new Promise((resolve, reject) => {
						uni.downloadFile({
							url: photo.original_url || photo.compressed_url,
							success: (res) => (res.statusCode === 200 ? resolve(res) : reject(res)),
							fail: reject
						});
					});

					// 2. 保存到相册
					await new Promise((resolve, reject) => {
						if (photo.media_type === 'video') {
							uni.saveVideoToPhotosAlbum({ filePath: downloadRes.tempFilePath, success: resolve, fail: reject });
						} else {
							uni.saveImageToPhotosAlbum({ filePath: downloadRes.tempFilePath, success: resolve, fail: reject });
						}
					});

					successCount++;
				} catch (err) {
					console.error('下载失败:', err);
					failCount++;
				}
			}

			uni.hideLoading();

			// 下载完成后，如果是在多选模式下，退出多选
			if (this.isSelectionMode) {
				this.exitSelectionMode();
			}

			// 如果一张都没成功（可能用户取消了授权，或者网络挂了）
			if (successCount === 0) {
				uni.showToast({
					title: '下载已取消或失败',
					icon: 'none'
				});
				return; // 直接结束，不弹评价窗，不弹成功提示
			}

			// 如果部分失败，给个提示，但仍然可以弹出评价窗
			if (failCount > 0) {
				uni.showToast({
					title: `${successCount}张保存成功，${failCount}张失败`,
					icon: 'none',
					duration: 2000
				});
				// 稍微延迟一下再弹窗，防止 Toast 被覆盖
				await new Promise((r) => setTimeout(r, 1500));
			}

			// 检查是否已经评价过
			if (this.hasRated) {
				// 如果已评价（数据库里有记录），直接提示成功，不弹窗
				uni.showModal({
					title: '下载完成',
					content: `成功保存到手机相册。`,
					showCancel: false
				});
				return;
			}

			// 再次检查本地缓存作为双重保险
			const storageKey = `album_rated_${this.albumId}`;
			const localRated = uni.getStorageSync(storageKey);

			if (!localRated) {
				// 只有 数据库没记录 且 缓存没记录 时，才弹窗
				this.$refs.ratingPopup.open();
			} else {
				// 本地有缓存但 hasRated 没更新（极少情况），也标记为已评价
				this.hasRated = true;
				uni.showModal({
					title: '下载完成',
					content: `成功保存到手机相册。`,
					showCancel: false
				});
			}
		},

		closeRatingPopup() {
			this.$refs.ratingPopup.close();
			// 关闭评价框后，还是提示一下下载成功，给用户一个交代
			uni.showToast({ title: '下载已完成', icon: 'success' });
		},

		async submitRating() {
			if (this.ratingScore === 0) {
				uni.showToast({ title: '请点击星星评分', icon: 'none' });
				return;
			}

			uni.showLoading({ title: '提交中...' });

			try {
				// 调用你的云对象方法提交评价
				await albumService.submitAlbumRating({
					albumId: this.albumId,
					score: this.ratingScore,
					comment: this.ratingComment
				});

				// 记录本地缓存，避免重复弹窗
				uni.setStorageSync(`album_rated_${this.albumId}`, true);
				this.hasRated = true;

				uni.hideLoading();
				this.$refs.ratingPopup.close();
				uni.showToast({ title: '感谢您的评价！', icon: 'success' });
			} catch (e) {
				uni.hideLoading();
				console.error(e);
				// 即使失败也关闭弹窗，不影响用户体验
				this.$refs.ratingPopup.close();
				uni.showToast({ title: '评价保存失败', icon: 'none' });
			}
		},

		// 批量删除
		handleBatchDelete() {
			if (this.selectedPhotoIds.length === 0) return;

			// 筛选出属于当前用户的照片
			const myPhotos = this.filteredPhotos.filter((p) => this.selectedPhotoIds.includes(p._id) && p.user_id === this.currentUid);

			const othersCount = this.selectedPhotoIds.length - myPhotos.length;

			if (myPhotos.length === 0) {
				return uni.showToast({ title: '只能删除自己上传的照片', icon: 'none' });
			}

			let content = `确定要删除选中的 ${myPhotos.length} 个文件吗？`;
			if (othersCount > 0) {
				content += `\n(已忽略 ${othersCount} 张他人上传的照片)`;
			}

			uni.showModal({
				title: '确认删除',
				content: content,
				confirmColor: '#FF0000',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '删除中...' });
						try {
							// 并行删除
							const deletePromises = myPhotos.map((photo) => {
								return albumService.deletePhoto(photo._id).catch((err) => {
									console.error(`删除 ${photo._id} 失败`, err);
									return null;
								});
							});

							await Promise.all(deletePromises);

							uni.hideLoading();
							uni.showToast({ title: '删除成功', icon: 'success' });

							this.exitSelectionMode();
							this.fetchAlbumDetails(); // 刷新列表
						} catch (e) {
							uni.hideLoading();
							uni.showToast({ title: '删除出错', icon: 'none' });
						}
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

/* 瀑布流容器 */
.waterfall-container {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	padding: 0 10rpx; /* 整体左右留白 */
	box-sizing: border-box;
}

/* 列样式 */
.waterfall-column {
	display: flex;
	flex-direction: column;
	width: 32%;
}

/* 卡片样式 */
.photo-card {
	position: relative;
	width: 100%;
	margin-bottom: 20rpx; /* 上下间距 */
	border-radius: 16rpx; /* 大圆角 */
	background-color: #fff;
	overflow: hidden;
	/* 增加轻微阴影增加立体感 */
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
	transition: transform 0.1s;
	/* 解决 Safari/iOS 圆角溢出 bug */
	transform: translateZ(0);
}
.photo-card:active {
	transform: scale(0.98);
	opacity: 0.9;
}

/* 图片样式 */
.card-image {
	width: 100%;
	display: block; /* 消除图片底部默认间隙 */
	/* 高度自动，由 widthFix 决定 */
	min-height: 200rpx; /* 防止加载前高度坍塌 */
	background-color: #f0f0f0; /* 加载占位色 */
}

/* 视频标识样式 */
.video-tag {
	position: absolute;
	top: 12rpx;
	right: 12rpx;
	background-color: rgba(0, 0, 0, 0.5);
	border-radius: 30rpx;
	padding: 4rpx 12rpx;
	display: flex;
	align-items: center;
	backdrop-filter: blur(4px);
}

.time-text {
	color: #fff;
	font-size: 20rpx;
	margin-left: 6rpx;
	font-weight: 500;
}

/* 头部一键下载栏 */
.day-stats-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10rpx 30rpx 20rpx;
	background-color: #f8f8f8;
}
.stats-text {
	font-size: 24rpx;
	color: #999;
}
.download-day-btn {
	display: flex;
	align-items: center;
	background-color: rgba(235, 109, 32, 0.1);
	padding: 8rpx 20rpx;
	border-radius: 30rpx;
}
.download-day-btn text {
	font-size: 24rpx;
	color: #eb6d20;
	margin-left: 6rpx;
	font-weight: 500;
}

/* 多选遮罩层 (适配瀑布流圆角) */
.selection-overlay {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.1);
	z-index: 10;
	transition: all 0.2s;
	border-radius: 16rpx; /* 需与 photo-card 圆角一致 */
}
.selection-overlay.selected {
	background-color: rgba(0, 0, 0, 0.4);
	border: 4rpx solid #eb6d20;
	box-sizing: border-box;
}

/* 勾选圈圈 */
.checkbox-circle {
	position: absolute;
	top: 16rpx;
	right: 16rpx;
	width: 44rpx;
	height: 44rpx;
	border-radius: 50%;
	border: 2rpx solid #fff;
	background-color: rgba(0, 0, 0, 0.3);
	display: flex;
	justify-content: center;
	align-items: center;
}
.selection-overlay.selected .checkbox-circle {
	background-color: #eb6d20;
	border-color: #eb6d20;
}

/* 底部批量操作栏 */
.batch-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	width: 100%;
	background-color: #fff;
	border-top: 1rpx solid #eee;
	z-index: 2000;
	padding-bottom: constant(safe-area-inset-bottom);
	padding-bottom: env(safe-area-inset-bottom);
	display: flex;
	flex-direction: column;
	box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
}
.batch-header {
	height: 80rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 40rpx;
	border-bottom: 1rpx solid #f5f5f5;
}
.batch-info {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
}
.batch-btn {
	font-size: 28rpx;
	padding: 10rpx 20rpx;
}
.batch-btn.cancel {
	color: #666;
}
.batch-btn.select-all {
	color: #eb6d20;
	font-weight: bold;
}

.batch-actions {
	height: 140rpx;
	display: flex;
	justify-content: space-around;
	align-items: center;
}
.action-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	flex: 1;
	height: 100%;
}
.action-item:active {
	background-color: #f9f9f9;
}
.icon-box {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	background-color: #f0f0f0;
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: 8rpx;
}
.icon-box.delete {
	background-color: #fff0f0;
}
.action-item text {
	font-size: 24rpx;
	color: #333;
}
.action-item .text-delete {
	color: #ff0000;
}

/* 评价弹窗样式优化 */
.rating-popup-box {
	background-color: #fff;
	width: 600rpx;
	border-radius: 24rpx;
	padding: 40rpx 30rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.rating-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 16rpx;
}

.rating-subtitle {
	font-size: 26rpx;
	color: #888;
	text-align: center;
	line-height: 1.5;
	margin-bottom: 40rpx;
}

.rate-container {
	margin-bottom: 40rpx;
	/* 确保容器高度足够显示星星 */
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.rating-textarea {
	width: 100%;
	height: 180rpx;
	background-color: #f8f8f8;
	border-radius: 12rpx;
	padding: 20rpx;
	font-size: 28rpx;
	color: #333;
	box-sizing: border-box; /* 关键：防止padding撑大 */
	margin-bottom: 40rpx;
}

.rating-btn-row {
	display: flex;
	width: 100%;
	justify-content: space-between;
	gap: 20rpx;
}

.custom-btn {
	flex: 1;
	height: 80rpx; /* 增加高度 */
	border-radius: 40rpx; /* 大圆角 */
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 30rpx;
	font-weight: 500;
}

.btn-gray {
	background-color: #f0f0f0;
	color: #666;
}

.btn-orange {
	background-color: #eb6d20;
	color: #fff;
	box-shadow: 0 4rpx 10rpx rgba(235, 109, 32, 0.3); /* 添加阴影使其立体 */
}

/* 点击反馈 */
.custom-btn:active {
	opacity: 0.9;
	transform: scale(0.98);
}
</style>
