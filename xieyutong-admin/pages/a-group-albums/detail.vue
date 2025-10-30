<template>
	<view class="container">
		<view class="uni-header-button-group">
			<button type="default" size="mini" @click="goBack">返回列表</button>
		</view>

		<unicloud-db
			ref="udbAlbum"
			v-slot:default="{ data: albumData, loading: albumLoading, error: albumError }"
			collection="a-group-albums"
			:where="`_id=='${id}'`"
			:getone="true"
			@load="handleLoadAlbum">
			<view v-if="albumError">{{ albumError.message }}</view>
			<view v-else-if="albumLoading">加载相册信息...</view>
			<view v-else-if="albumData" class="album-info-header">
				<view>
					<view class="info-item">
						<text class="label">相册名称：</text>
						<text>{{ albumData.album_name }}</text>
					</view>
					<view class="info-item">
						<text class="label">订单号：</text>
						<text>{{ albumData.order_id }}</text>
					</view>
					<view class="info-item">
						<text class="label">行程日期：</text>
						<text>
							<uni-dateformat :date="albumData.departure_date" format="yyyy-MM-dd" />
							~
							<uni-dateformat :date="formatEndDate(albumData.departure_date, albumData.total_days)" format="yyyy-MM-dd" />
						</text>
					</view>
					<view class="info-item">
						<text class="label">状态：</text>
						<text>{{ statusMap[albumData.status] }}</text>
					</view>
				</view>
			</view>
		</unicloud-db>

		<view v-if="albumData">
			<view v-if="daysList.length > 0" class="day-selector">
				<uni-segmented-control :current="selectedDay - 1" :values="daysList.map((d) => `Day ${d}`)" @clickItem="dayChange" styleType="button" activeColor="#2979FF" />
			</view>

			<unicloud-db
				ref="udbPhotos"
				v-slot:default="{ data, pagination, loading: photosLoading, error: photosError, options }"
				collection="a-album-photos,uni-id-users"
				field="album_id, user_id{nickname, username, mobile}, original_url, compressed_url, shooting_time, create_date"
				:where="photosWhereClause"
				orderby="shooting_time desc"
				:getcount="true"
				:page-size="pageSize"
				:page-current="pageCurrent"
				page-data="replace"
				@load="handleLoadPhotos">
				<view v-if="photosError" class="error-tip">{{ photosError.message }}</view>
				<view v-else>
					<view class="action-section flex flex-col md:flex-row">
						<view v-if="albumData && albumData.status === 1" style="display: flex; flex-wrap: nowrap; margin-bottom: 6px">
							<button type="primary" size="mini" @click="triggerUpload" :loading="isUploading">
								<uni-icons type="plusempty" size="16" color="#fff" style="margin-right: 2px"></uni-icons>
								上传照片
							</button>
							<button type="warn" size="mini" @click="handleBatchDelete" :disabled="selectedPhotoIds.length === 0">
								<uni-icons type="trash" size="16" color="#fff" style="margin-right: 2px"></uni-icons>
								批量删除
							</button>
							<button type="primary" size="mini" @click="handleBatchDownload" :disabled="selectedPhotoIds.length === 0" style="background-color: #19be6b; border-color: #19be6b">
								<uni-icons type="download" size="16" style="margin-right: 2px"></uni-icons>
								批量下载
							</button>
						</view>
						<view class="text-sm text-gray-500 flex justify-end pr-2">
							已选
							<text class="font-semibold text-indigo-600 text-base mx-1">{{ getSelectedCount() }} / {{ pagination.count }}</text>
							张照片
						</view>
					</view>

					<el-table
						ref="photoTable"
						:data="data"
						style="width: 100%"
						v-loading="photosLoading"
						element-loading-text="正在加载照片..."
						:empty-text="photosError ? photosError.message : '该天没有照片'"
						row-key="_id"
						@selection-change="handleSelectionChange">
						<el-table-column type="selection" width="55" align="center" :reserve-selection="true" />

						<el-table-column label="照片" width="120" align="center">
							<template #default="scope">
								<el-image
									:src="scope.row.compressed_url || scope.row.original_url"
									:preview-src-list="[scope.row.original_url]"
									fit="cover"
									style="cursor: pointer; border-radius: 4px"
									preview-teleported
									hide-on-click-modal />
							</template>
						</el-table-column>

						<el-table-column label="上传者" width="300" prop="uploader" sortable align="center">
							<template #default="scope">
								{{
									(scope.row.user_id &&
										scope.row.user_id[0] &&
										(scope.row.user_id[0].nickname || scope.row.user_id[0].username || scope.row.user_id[0].mobile || scope.row.user_id[0]._id)) ||
									'未知用户'
								}}
							</template>
						</el-table-column>

						<el-table-column label="拍摄/上传时间" prop="shooting_time" sortable align="center">
							<template #default="scope">
								<uni-dateformat :date="scope.row.shooting_time || scope.row.create_date" format="yyyy-MM-dd hh:mm" />
							</template>
						</el-table-column>

						<el-table-column label="操作" width="120" align="center">
							<template #default="scope">
								<view class="uni-group" style="flex-direction: column; gap: 8px">
									<el-button size="small" type="primary" @click="downloadSinglePhoto(scope.row.original_url)" style="background-color: #19be6b; border-color: #19be6b">
										<i class="fas fa-download el-icon--left"></i>
										下载
									</el-button>
									<el-button size="small" type="danger" @click="deletePhoto(scope.row)" style="margin-left: 0">
										<i class="fas fa-trash el-icon--left"></i>
										删除
									</el-button>
								</view>
							</template>
						</el-table-column>
					</el-table>
				</view>

				<!-- 分页组件 -->
				<view class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-2" v-if="pagination.count > 0">
					<view class="flex items-center justify-between">
						<view class="text-sm text-gray-700">
							显示第
							<text class="font-medium">{{ (pagination.current - 1) * pagination.size + 1 }}</text>
							到
							<text class="font-medium">{{ Math.min(pagination.current * pagination.size, pagination.count) }}</text>
							条， 共
							<text class="font-medium">{{ pagination.count }}</text>
							条记录
						</view>
						<uni-pagination show-icon :page-size="pageSize" :current="pageCurrent" :total="pagination.count" @change="onPageChanged" />
					</view>
				</view>
			</unicloud-db>
		</view>
	</view>
</template>

<script>
import { exif } from '@/uni_modules/lime-shared/exif';
const albumService = uniCloud.importObject('album-service', {
	customUI: true
});
import { toRaw } from 'vue';

export default {
	data() {
		return {
			id: '',
			albumData: null,
			selectedDay: 1,
			daysList: [],
			albumLoading: true,
			photosLoading: false,
			photosError: null,
			pageSize: 20,
			pageCurrent: 1,
			statusMap: {
				// 状态映射
				0: '待激活',
				1: '进行中',
				2: '已归档'
			},
			isUploading: false,
			selectedPhotoIds: [],
			selectedPhotoUrls: []
		};
	},
	computed: {
		/**
		 * @description 计算行程第一天的 00:00:00 的时间戳
		 */
		tripStartDateMs() {
			if (!this.albumData || !this.albumData.departure_date) return null;
			const date = new Date(this.albumData.departure_date);
			date.setHours(0, 0, 0, 0);
			return date.getTime();
		},

		/**
		 * @description 根据 selectedDay 计算 JQL 查询所需的时间范围 {start, end}
		 * 逻辑：Day 1 包含出发日之前的所有照片；Last Day 包含最后一天之后的所有照片
		 */
		dayQueryRange() {
			if (!this.tripStartDateMs || !this.albumData.total_days) {
				return { start: null, end: null };
			}

			const dayMs = 24 * 60 * 60 * 1000;
			const totalDays = this.albumData.total_days;

			let queryStart, queryEnd;

			// 计算当前选中日期的开始时间
			const dayOffset = this.selectedDay - 1;
			queryStart = this.tripStartDateMs + dayOffset * dayMs;

			// 计算当前选中日期的结束时间
			queryEnd = queryStart + dayMs - 1;

			// 特殊处理：Day 1 (包含所有出发前拍的照片)
			if (this.selectedDay === 1) {
				queryStart = 0; // 从时间起点开始
			}

			// 特殊处理：Last Day (包含所有行程结束后拍的照片)
			if (this.selectedDay === totalDays) {
				queryEnd = 9999999999999; // 到一个很远的未来时间
			}

			return { start: queryStart, end: queryEnd };
		},

		/**
		 * @description 为 udbPhotos 动态生成最终的 where 查询子句
		 */
		photosWhereClause() {
			if (!this.id) {
				console.log('photoWhereClause：缺少相册ID');
				return "album_id == 'INVALID_ID_TEMP'";
			} // 安全检查

			// 在相册信息加载完成前，返回一个查不到任何东西的查询
			if (!this.albumData || !this.albumData.departure_date) {
				console.log('photoWhereClause：albumData未加载');
				return "album_id == 'INVALID_ID_TEMP'";
			}

			let where = `album_id == '${this.id}'`;

			const { start, end } = this.dayQueryRange;

			if (start === null || end === null) {
				// 理论上不应该发生，但作为保险
				console.warn('photoWhereClause：无法计算日期范围，将加载所有照片');
				return where;
			}

			// 核心：构建日期查询
			const dateQuery = `((shooting_time != null && shooting_time >= ${start} && shooting_time <= ${end}) || (shooting_time == null && create_date >= ${start} && create_date <= ${end}))`;

			where += ` && ${dateQuery}`;

			console.log('udbPhotos where:', where); // 调试用
			return where;
		}
	},

	onLoad(e) {
		if (e.id) {
			this.id = e.id;
			console.log('页面加载，相册ID:', this.id);
		} else {
			console.error('页面加载错误：缺少相册ID');
			uni.showToast({ title: '缺少相册ID', icon: 'error' });
			uni.navigateBack();
		}
	},

	onReady() {
		// this.loadAlbumAndPhotos();
	},

	methods: {
		goBack() {
			uni.navigateBack();
		},

		// 加载相册信息的回调
		handleLoadAlbum(data, ended, pagination) {
			this.albumLoading = false;
			if (data) {
				console.log('相册信息加载完成:', data);
				this.albumData = data;
				const totalDays = this.albumData.total_days || 1;
				this.daysList = Array.from({ length: totalDays }, (_, i) => i + 1);
				console.log('相册加载完毕，开始加载 Day 1 照片...');
			} else {
				console.error('未能加载到相册信息');
				uni.showToast({ title: '未能加载到相册信息', icon: 'error' });
			}
		},

		// 加载所有照片的回调
		handleLoadPhotos(data, ended, pagination) {
			if (data) {
				console.log(`照片数据加载完成，共 ${data.length} 张`);
			} else {
				console.warn('照片加载完成，但数据为空');
			}
		},

		// 天数切换事件
		dayChange(e) {
			const newDay = e.currentIndex + 1;
			if (this.selectedDay !== newDay) {
				this.selectedDay = newDay;
				this.pageCurrent = 1;
				// 清除选择状态
				this.clearSelection();
				console.log('切换到 Day', newDay);
			}
		},

		onPageChanged(e) {
			console.log('页码切换到', e.current);
			this.pageCurrent = e.current;
			this.clearSelection();
		},

		handleSelectionChange(selection) {
			this.selectedPhotoIds = selection.map((row) => row._id);
			this.selectedPhotoUrls = selection.map((row) => row.original_url);

			console.log('selectedPhotoIds: ', toRaw(this.selectedPhotoIds));
			console.log('selectedPhotoUrls: ', toRaw(this.selectedPhotoUrls));
		},

		// 获取选中数量
		getSelectedCount() {
			if (this.selectedPhotoUrls && this.selectedPhotoUrls.length > 0) {
				return this.selectedPhotoUrls.length;
			}
			return this.selectedPhotoIds.length;
		},

		clearSelection() {
			this.selectedPhotoIds = [];
			this.selectedPhotoUrls = [];
			this.$refs.photoTable.clearSelection();
		},

		// 下载单张照片
		downloadSinglePhoto(url) {
			if (!url) return;
			console.log('下载单张:', url);
			// 在浏览器环境中，直接打开 URL 通常就会触发下载或预览
			// 为了强制下载，可以创建一个隐藏的 a 标签
			const link = document.createElement('a');
			link.href = url;
			// 可以尝试从 URL 中提取文件名，或者生成一个
			const filename = url.substring(url.lastIndexOf('/') + 1) || `photo_${Date.now()}.jpg`;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		},

		// 处理批量下载 (前端仅触发，实际处理需后端配合)
		handleBatchDownload() {
			if (this.selectedPhotoUrls.length === 0) return;
			console.log(`准备批量下载 ${this.selectedPhotoUrls.length} 张照片:`, toRaw(this.selectedPhotoUrls));
			uni.showLoading({ title: '准备下载链接...' });

			// 调用后端云对象生成 ZIP 包并返回下载链接
			albumService
				.generateBatchDownloadLink({
					// --- 确保传递的是 FileIDs ---
					photoUrls: this.selectedPhotoUrls, // 传递照片的 _id 列表
					albumName: this.albumData?.album_name || 'album_photos'
				})
				.then((res) => {
					uni.hideLoading();
					if (res.errCode === 0 && res.downloadUrl) {
						console.log('获取到批量下载链接:', res.downloadUrl);
						window.open(res.downloadUrl);
						this.clearSelection();
					} else {
						throw new Error(res.errMsg || '生成下载链接失败');
					}
				})
				.catch((err) => {
					uni.hideLoading();
					console.error('请求批量下载失败:', err);
					uni.showModal({ content: err.message || '请求批量下载失败', showCancel: false });
				});
		},

		deletePhoto(item) {
			uni.showModal({
				title: '提示',
				content: '确定删除该图片吗？此操作会同时删除云存储文件。',
				success: async (res) => {
					if (res.confirm) {
						console.log('准备删除照片:', toRaw(item));
						uni.showLoading({ title: '删除中...' });
						try {
							// 删除云存储文件
							console.log('删除云存储文件:', item._id);
							const deleteFileRes = await albumService.deletePhoto(item._id);
							console.log('云存储删除结果:', deleteFileRes);
							if (deleteFileRes.errCode === 0) {
								uni.hideLoading();
								uni.showToast({ title: '删除成功', icon: 'success' });
								this.$refs.udbPhotos.loadData({ clear: true });
							} else {
								// 如果云对象返回错误
								throw new Error(deleteFileRes.errMsg || '删除失败');
							}
						} catch (err) {
							uni.hideLoading();
							console.error('删除照片失败:', err);
							uni.showModal({
								content: err.message || '删除失败',
								showCancel: false
							});
						}
					}
				}
			});
		},

		// 处理批量删除
		handleBatchDelete() {
			if (this.selectedPhotoIds.length === 0) return;
			uni.showModal({
				title: '确认删除',
				content: `确定要删除选中的 ${this.selectedPhotoIds.length} 张照片吗？此操作不可恢复。`,
				confirmColor: '#f56c6c',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '批量删除中...' });
						try {
							// 调用云对象执行批量删除
							const result = await albumService.batchDeletePhotos(this.selectedPhotoIds);
							console.log('批量删除结果:', result);
							uni.hideLoading();
							if (result.errCode === 0) {
								uni.showToast({ title: `成功删除 ${result.data.deletedCount} 张`, icon: 'success' });
								// 清空选择并刷新列表
								this.clearSelection();
								this.$refs.udbPhotos.loadData({ clear: true });
							} else {
								// 显示部分失败信息（如果云对象返回了的话）
								let errMsg = result.errMsg || '批量删除失败';
								if (result.data && result.data.failCount > 0) {
									errMsg += ` (${result.data.failCount}张失败)`;
								}
								uni.showModal({ content: errMsg, showCancel: false });
							}
						} catch (err) {
							uni.hideLoading();
							console.error('批量删除异常:', err);
							uni.showModal({ content: err.message || '批量删除请求失败', showCancel: false });
						}
					}
				}
			});
		},

		previewImage(url) {
			uni.previewImage({
				urls: [url]
			});
		},

		formatEndDate(startTimestamp, totalDays) {
			if (!startTimestamp || !totalDays) return null;
			const startDate = new Date(startTimestamp);
			const endDate = new Date(startDate.getTime() + (totalDays - 1) * 24 * 60 * 60 * 1000);
			return endDate.getTime();
		},

		triggerUpload() {
			if (this.isUploading) return;
			if (!this.albumData || this.albumData.status !== 1) {
				uni.showToast({ title: '当前相册状态不可上传', icon: 'none' });
				return;
			}

			uni.chooseImage({
				count: 9,
				sizeType: ['original'], // 获取原图以保留 EXIF
				sourceType: ['album', 'camera'],
				success: async (res) => {
					this.isUploading = true;
					uni.showLoading({ title: '处理中 0/' + res.tempFiles.length });
					let successCount = 0;
					let failCount = 0;

					// 异步处理 EXIF 并上传
					const uploadPromises = res.tempFiles.map(async (tempFile, index) => {
						uni.showLoading({ title: `处理中 ${index + 1}/${res.tempFiles.length}` });
						try {
							// 1. 解析拍摄时间 (异步)
							let shootingTime = await new Promise((resolve, reject) => {
								try {
									// 确保 exif.getData 能正确处理 Admin 环境下的文件对象
									// H5端可能需要不同的处理方式获取文件 ArrayBuffer
									// 这里假设 tempFile.path 在 Admin H5 环境下可用
									if (typeof tempFile === 'string' || tempFile instanceof String || !tempFile.path) {
										console.warn('[EXIF] Admin H5 环境下无法直接读取本地路径，使用当前时间');
										resolve(Date.now());
										return;
									}

									exif.getData(tempFile.path, function () {
										const dateTimeOriginal = exif.getTag(this, 'DateTimeOriginal');
										if (dateTimeOriginal) {
											const [datePart, timePart] = dateTimeOriginal.split(' ');
											if (datePart && timePart) {
												const [year, month, day] = datePart.split(':');
												const [hours, minutes, seconds] = timePart.split(':');
												if (year && month && day && hours && minutes && seconds) {
													const date = new Date(year, month - 1, day, hours, minutes, seconds);
													resolve(date.getTime());
													console.log('[EXIF] 解析到拍摄时间:', date.toLocaleString());
													return;
												}
											}
										}
										console.log('[EXIF] 未找到或解析失败，使用当前时间');
										resolve(Date.now());
									});
								} catch (exifError) {
									console.warn('[EXIF] 解析异常，使用当前时间:', exifError);
									resolve(Date.now()); // 解析出错也使用当前时间
								}
							});
							if (!shootingTime) shootingTime = Date.now(); // 再次确保有值
							console.log('shootingTime: ', shootingTime);

							// 2. 构造文件名和路径
							const filePath = tempFile.path;
							const extensionMatch = /\.([a-zA-Z0-9]+)$/.exec(filePath || tempFile.name || '');
							const extension = extensionMatch ? extensionMatch[0] : '.jpg';
							const randomString = Math.random().toString(36).substring(2, 10);
							const fileName = `${shootingTime}-${randomString}${extension}`;
							const cloudPath = `album-photos/${this.id}/${fileName}`;

							let percentCompleted;
							// 3. 上传文件
							const uploadResult = await uniCloud.uploadFile({
								filePath: filePath,
								cloudPath: cloudPath,
								onUploadProgress: (progressEvent) => {
									percentCompleted = Math.round((progressEvent.loaded / progressEvent.total) * 100 || 0);
									uni.showLoading({ title: `上传中 ${index + 1}/${res.tempFiles.length} (${percentCompleted}%)` });
								}
							});
							console.log(`[上传照片] 文件 ${fileName} 上传成功:`, uploadResult);

							// 4. 调用云对象写入数据库，标记为 guide
							await albumService.uploadPhotos({
								albumId: this.id,
								file: uploadResult,
								shootingTime: shootingTime,
								is_guide: true // 标记为导游上传
							});

							successCount++;
						} catch (e) {
							failCount++;
							console.error(`[上传照片] 文件 ${tempFile.name || '未知文件'} 处理失败:`, e);
						}
					}); // map end

					// 等待所有上传完成
					await Promise.all(uploadPromises);

					this.isUploading = false;
					uni.hideLoading();

					if (failCount > 0) {
						uni.showModal({
							title: '上传完成',
							content: `${successCount} 张成功, ${failCount} 张失败`,
							showCancel: false
						});
					} else {
						uni.showToast({ title: `成功上传 ${successCount} 张照片`, icon: 'success' });
					}

					this.clearSelection();
					this.$refs.udbPhotos.loadData({ clear: true });
				},
				fail: (err) => {
					if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
						console.error('[选择照片] 失败:', err);
						uni.showToast({ title: '选择照片失败', icon: 'none' });
					}
					this.isUploading = false; // 确保重置状态
				}
			});
		}
	}
};
</script>

<style scoped>
.uni-header-button-group {
	padding: 10px 0px 10px 0px;
}

.action-section {
	display: flex;
	justify-content: space-between;
}

.action-section button {
	margin-right: 10px;
}

.upload-disabled-tip {
	font-size: 14px;
	color: #999;
	padding: 15px;
	background-color: #f9f9f9;
	text-align: center;
	border-bottom: 1px solid #eee;
}

.container {
	padding: 15px;
}

.album-info-header {
	background-color: #f9f9f9;
	padding: 15px;
	border-radius: 8px;
	margin-bottom: 15px;
	border: 1px solid #eee;
}

.info-item {
	margin-bottom: 8px;
	font-size: 14px;
}

.label {
	font-weight: bold;
	color: #555;
	margin-right: 5px;
}

.day-selector {
	margin-bottom: 15px;
}

.error-tip {
	color: red;
	text-align: center;
	padding: 20px;
}
</style>
