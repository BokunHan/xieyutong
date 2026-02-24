<template>
	<view class="page-container">
		<view class="nav-bar-placeholder" :style="{ height: statusBarHeight + 44 + 'px' }">
			<view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
				<view class="back-btn" @click="goBack">
					<uni-icons type="left" size="24" color="#333"></uni-icons>
				</view>
				<text class="nav-title">精彩瞬间</text>
				<view class="right-placeholder"></view>
			</view>
		</view>

		<view class="content-area">
			<view class="tip-bar">
				<uni-icons type="info-filled" color="#ff9900" size="16"></uni-icons>
				<text class="tip-text">长按照片可进行保存、分享或删除操作。</text>
			</view>

			<view class="grid-container">
				<view class="grid-item" v-for="(item, index) in list" :key="item._id" @click="previewMedia(index)" @longpress="handleLongPress(item)">
					<template v-if="item.media_type === 'video'">
						<image :src="item.poster || item.media.url + '?x-oss-process=video/snapshot,t_1000,f_jpg'" mode="aspectFill" class="photo"></image>
						<view class="video-icon-overlay">
							<uni-icons type="videocam-filled" color="#fff" size="30"></uni-icons>
						</view>
					</template>

					<template v-else>
						<image :src="item.media.url" mode="aspectFill" class="photo"></image>
					</template>
				</view>

				<view class="grid-item add-btn" @click="chooseAndUpload">
					<uni-icons type="plusempty" color="#ccc" size="40"></uni-icons>
					<text class="add-text">添加作品</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const dbCollection = db.collection('b-guide-portfolio');

export default {
	data() {
		return {
			statusBarHeight: 0,
			list: [] // 图片列表
		};
	},
	onLoad() {
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;
		this.fetchData();
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},

		// 1. 获取图片列表
		async fetchData() {
			uni.showLoading({ title: '加载中' });
			try {
				// 查询当前用户的图片，按时间倒序
				const res = await dbCollection.where('user_id == $cloudEnv_uid').orderBy('created_at', 'desc').get();

				this.list = res.result.data;
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		},

		// 2. 选择并上传图片 (不限总数，单次最多9张)
		chooseAndUpload() {
			uni.chooseMedia({
				count: 9,
				mediaType: ['image', 'video'], // 同时支持
				sourceType: ['album', 'camera'],
				maxDuration: 30, // 视频最长30秒
				success: async (res) => {
					uni.showLoading({ title: '上传中...' });
					for (let file of res.tempFiles) {
						await this.uploadOneFile(file);
					}
					uni.hideLoading();
					this.fetchData();
				}
			});
		},

		// 单个文件上传逻辑
		async uploadOneFile(file) {
			try {
				let filePath = file.tempFilePath;
				let fileExt = filePath.split('.').pop();
				// 简单的容错处理
				if (!fileExt || fileExt.length > 5) {
					fileExt = file.fileType === 'video' ? 'mp4' : 'jpg';
				}

				let cloudPath = `portfolio/${Date.now()}_${Math.random().toString(36).substr(2)}.${fileExt}`;
				let mediaType = file.fileType || 'image';

				const uploadRes = await uniCloud.uploadFile({
					filePath: filePath,
					cloudPath: cloudPath
				});

				await dbCollection.add({
					media: {
						url: uploadRes.fileID,
						name: `upload_${Date.now()}.${fileExt}`,
						extname: fileExt
					},
					media_type: mediaType,
					created_at: Date.now()
				});
			} catch (e) {
				console.error('上传失败', e);
				uni.showToast({ title: '上传失败', icon: 'none' });
			}
		},

		// 3. 预览图片
		previewMedia(current) {
			const item = this.list[current];
			if (!item.media || !item.media.url) return;

			const currentUrl = item.media.url;
			if (item.media_type === 'video') {
				const videoPoster = currentUrl + '?x-oss-process=video/snapshot,t_1000,f_jpg';

				uni.previewMedia({
					sources: [
						{
							url: currentUrl,
							type: 'video',
							poster: videoPoster
						}
					],
					current: 0
				});
			} else {
				const images = this.list.filter((i) => i.media_type !== 'video');
				const urls = images.map((i) => i.media.url);
				const imgIndex = urls.indexOf(currentUrl);
				if (imgIndex < 0) imgIndex = 0;

				uni.previewImage({
					current: imgIndex,
					urls: urls
				});
			}
		},

		// 4. 长按菜单 (兼容非App端的备选方案，或者直接在宫格页触发)
		handleLongPress(item) {
			uni.showActionSheet({
				itemList: ['保存', '分享', '删除'],
				itemColor: '#000000',
				success: (res) => {
					if (res.tapIndex === 0) {
						this.downloadPhoto(item);
					} else if (res.tapIndex === 1) {
						this.shareSinglePhoto(item);
					} else if (res.tapIndex === 2) {
						this.deletePhoto(item);
					}
				}
			});
		},

		// --- 以下逻辑复刻自 detail.vue ---

		// 保存图片
		downloadPhoto(photo) {
			uni.showLoading({ title: '正在保存...' });
			uni.downloadFile({
				url: photo.media.url,
				success: (res) => {
					if (res.statusCode === 200) {
						uni.saveImageToPhotosAlbum({
							filePath: res.tempFilePath,
							success: () => {
								uni.hideLoading();
								uni.showToast({ title: '图片已保存', icon: 'success' });
							},
							fail: (err) => this.handleSaveFail(err)
						});
					} else {
						uni.hideLoading();
						uni.showToast({ title: '下载失败', icon: 'none' });
					}
				},
				fail: (err) => {
					uni.hideLoading();
					uni.showToast({ title: '下载失败', icon: 'none' });
				}
			});
		},

		// 处理保存失败（权限问题）
		handleSaveFail(err) {
			uni.hideLoading();
			if (err.errMsg && (err.errMsg.includes('auth') || err.errMsg.includes('deny') || err.errMsg.includes('scope'))) {
				uni.showModal({
					title: '保存失败',
					content: '需要您的相册授权才能保存文件，请去设置中开启。',
					confirmText: '去设置',
					success: (modalRes) => {
						if (modalRes.confirm) uni.openSetting();
					}
				});
			} else {
				uni.showToast({ title: '保存失败', icon: 'none' });
			}
		},

		// 分享图片
		shareSinglePhoto(photo) {
			uni.showLoading({ title: '准备分享...' });
			uni.downloadFile({
				url: photo.media.url,
				success: (res) => {
					uni.hideLoading();
					if (res.statusCode === 200) {
						uni.showShareImageMenu({
							path: res.tempFilePath,
							fail: (shareErr) => {
								if (shareErr.errMsg && shareErr.errMsg.indexOf('cancel') === -1) {
									uni.showToast({ title: '分享失败', icon: 'none' });
								}
							}
						});
					} else {
						uni.showToast({ title: '下载失败', icon: 'none' });
					}
				},
				fail: () => {
					uni.hideLoading();
					uni.showToast({ title: '下载失败', icon: 'none' });
				}
			});
		},

		// 删除图片
		deletePhoto(item) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这张精彩瞬间吗？',
				confirmColor: '#FF0000',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '删除中' });
						try {
							// 删除数据库记录
							await dbCollection.doc(item._id).remove();

							// 尝试删除云文件 (如果权限允许)
							try {
								if (item.media && item.media.url) {
									await uniCloud.deleteFile({ fileList: [item.media.url] });
								}
							} catch (ignore) {}

							uni.hideLoading();
							uni.showToast({ title: '删除成功', icon: 'success' });
							this.fetchData(); // 刷新
						} catch (e) {
							uni.hideLoading();
							uni.showToast({ title: '删除失败', icon: 'none' });
						}
					}
				}
			});
		}
	}
};
</script>

<style lang="scss" scoped>
.page-container {
	min-height: 100vh;
	background-color: #f5f7fa;
}

/* 顶部导航栏固定 */
.nav-bar-placeholder {
	background-color: #fff;
	position: sticky;
	top: 0;
	z-index: 100;
}

.nav-bar {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 24rpx;
	box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05);
}

.back-btn {
	width: 60rpx;
	height: 100%;
	display: flex;
	align-items: center;
}

.nav-title {
	font-size: 34rpx;
	font-weight: bold;
	color: #333;
}

.right-placeholder {
	width: 60rpx;
}

/* 内容区 */
.content-area {
	padding: 30rpx;
}

.tip-bar {
	display: flex;
	align-items: center;
	background-color: #fff8e1;
	padding: 16rpx 24rpx;
	border-radius: 8rpx;
	margin-bottom: 30rpx;

	.tip-text {
		font-size: 24rpx;
		color: #ff9900;
		margin-left: 10rpx;
	}
}

.video-icon-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(0, 0, 0, 0.2);
}

/* 九宫格网格 */
.grid-container {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
}

.grid-item {
	/* (屏幕宽度 - padding - gap*2) / 3 */
	width: calc((100% - 40rpx) / 3);
	height: 220rpx;
	border-radius: 12rpx;
	position: relative;
	overflow: hidden;
	background-color: #fff;

	.photo {
		width: 100%;
		height: 100%;
		display: block;
	}
}

/* 上传按钮样式 */
.add-btn {
	border: 2rpx dashed #dcdfe6;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background-color: #fafafa;

	&:active {
		background-color: #f0f0f0;
	}

	.add-text {
		font-size: 24rpx;
		color: #999;
		margin-top: 10rpx;
	}
}
</style>
