<template>
	<view class="container">
		<view class="uni-header-button-group">
			<button class="uni-button" type="default" size="mini" @click="goBack">
				<uni-icons type="back" size="14"></uni-icons>
				返回列表
			</button>
		</view>

		<unicloud-db
			ref="udbAlbum"
			v-slot:default="{ data: albumData, loading: albumLoading, error: albumError }"
			collection="a-group-albums"
			:where="`_id=='${id}'`"
			:getone="true"
			@load="handleLoadAlbum">
			<view v-if="albumError" class="error-tip">{{ albumError.message }}</view>
			<view v-else-if="albumLoading" class="loading-tip">加载相册信息...</view>
			<view v-else-if="albumData" class="album-info-header">
				<view class="info-col base-info">
					<view class="info-item title">
						<text class="album-name">{{ albumData.album_name }}</text>
						<text class="status-tag" :class="albumStatusClass">{{ albumStatusText }}</text>
					</view>
					<view class="info-item">
						<text class="label">订单号：</text>
						{{ albumData.order_id }}
					</view>
					<view class="info-item">
						<text class="label">日期：</text>
						<uni-dateformat :date="albumData.departure_date" format="yyyy-MM-dd" />
						<text class="mx-1">~</text>
						<uni-dateformat :date="getEndDate(albumData)" format="yyyy-MM-dd" />
					</view>
				</view>

				<view class="info-col guide-panel" v-if="guideInfo">
					<view class="guide-header">
						<view class="guide-profile">
							<text class="guide-name mr-2">{{ guideInfo.real_name }}</text>
							<text class="guide-mobile text-xs text-gray-400">{{ guideInfo.mobile }}</text>
						</view>
						<text class="guide-level" :class="guideInfo.level ? 'level-' + guideInfo.level : 'level-D'">{{ guideInfo.level || 'D' }}级</text>
					</view>

					<view class="task-overview" v-if="taskRules">
						<view class="task-row">
							<view class="task-label">
								<uni-icons type="image" size="14" color="#666"></uni-icons>
								<text>照片 ({{ currentDayStats.photo }}/{{ taskRules.photo_target }})</text>
							</view>
							<view class="task-status">
								<progress
									:percent="getPercent(currentDayStats.photo, taskRules.photo_target)"
									stroke-width="6"
									border-radius="3"
									:active-color="currentDayStats.photo >= taskRules.photo_target ? '#19be6b' : '#e6a23c'"
									style="width: 60px" />
							</view>
						</view>

						<view class="task-row" v-if="taskRules.video_req !== 'none'">
							<view class="task-label">
								<uni-icons type="videocam" size="14" color="#666"></uni-icons>
								<text>视频</text>
								<text class="sub-text" v-if="taskRules.video_req === '3day'">(3天1条)</text>
								<text class="sub-text" v-else>(每日1条)</text>
							</view>
							<view class="task-status">
								<text class="status-icon" :class="{ done: isVideoTaskDone }">
									{{ isVideoTaskDone ? '已完成' : currentDayStats.video > 0 ? '✔' : '未完成' }}
								</text>
								<text class="count-text" v-if="currentDayStats.video > 0">({{ currentDayStats.video }})</text>
							</view>
						</view>

						<view class="task-row" v-if="taskRules.promo_target > 0">
							<view class="task-label">
								<uni-icons type="star-filled" size="14" color="#ffca28"></uni-icons>
								<text>宣传素材 ({{ currentDayStats.promo }}/{{ taskRules.promo_target }})</text>
							</view>
							<view class="task-status">
								<progress :percent="getPercent(currentDayStats.promo, taskRules.promo_target)" stroke-width="6" border-radius="3" active-color="#ffca28" style="width: 60px" />
							</view>
						</view>
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
				field="album_id, user_id{nickname, username, mobile}, original_url, compressed_url, shooting_time, create_date, is_viewed, is_promo, is_guide, media_type"
				:where="photosWhereClause"
				orderby="shooting_time desc"
				:getcount="true"
				:page-size="pageSize"
				:page-current="pageCurrent"
				page-data="replace"
				@load="handleLoadPhotos">
				<view class="action-section">
					<view class="action-left">
						<view v-if="albumData && albumData.status === 1" class="btn-group">
							<button type="primary" size="mini" @click="triggerUpload" :loading="isUploading">
								<uni-icons type="plusempty" size="14" color="#fff"></uni-icons>
								上传
							</button>
						</view>

						<view class="btn-group" style="margin-left: 15px">
							<button type="default" plain size="mini" @click="handleBatchUnview" :disabled="selectedPhotoIds.length === 0">设为未读</button>
							<button type="warn" plain size="mini" @click="handleBatchDelete" :disabled="selectedPhotoIds.length === 0">批量删除</button>
							<button type="primary" plain size="mini" @click="handleBatchDownload" :disabled="selectedPhotoIds.length === 0">批量下载</button>
						</view>
					</view>

					<view class="flex gap-6 text-sm text-gray-500">
						<view class="assessment-display" @click="openAssessmentDialog">
							<view class="score-tag">
								<text title="拍摄评分">📸 {{ currentAssessment.photo_score || 0 }}</text>
								<text class="divider">|</text>
								<text title="视频评分">📹 {{ currentAssessment.video_score || 0 }}</text>
							</view>
							<view v-if="currentAssessment.exclude_assessment" class="exclude-tag">不考核</view>
							<uni-icons type="compose" size="16" color="#409eff" class="edit-icon"></uni-icons>
						</view>

						<view>
							已选
							<text class="highlight-num">{{ getSelectedCount() }}</text>
							/ {{ pagination.count }}
						</view>
					</view>
				</view>

				<view v-if="photosError" class="error-tip">{{ photosError.message }}</view>
				<view v-else>
					<el-table
						ref="photoTable"
						:data="data"
						style="width: 100%"
						v-loading="photosLoading"
						element-loading-text="加载中..."
						row-key="_id"
						border
						@selection-change="handleSelectionChange">
						<el-table-column type="selection" width="80" align="center" :reserve-selection="true" />

						<el-table-column label="内容" width="200" align="center">
							<template #default="scope">
								<view class="media-thumbnail-container" @click="onMediaClick(scope.row)">
									<view v-if="isVideo(scope.row.original_url)" class="media-content video-mode">
										<video :src="scope.row.original_url" :controls="false" :show-center-play-btn="false" :show-play-btn="false" muted class="mini-video"></video>
										<view class="video-overlay"><uni-icons type="videocam-filled" size="24" color="rgba(255,255,255,0.7)"></uni-icons></view>
									</view>

									<el-image
										v-else
										:src="scope.row.compressed_url || scope.row.original_url"
										:preview-src-list="imageOnlyPreviewList"
										:initial-index="getImageIndex(scope.row.original_url)"
										@switch="handlePreviewSwitch"
										fit="cover"
										class="media-content"
										loading="lazy"
										hide-on-click-modal
										:preview-teleported="true" />

									<view class="thumbnail-overlays">
										<view class="corner-badge promo-badge" v-if="scope.row.is_promo">
											<uni-icons type="star-filled" size="14" style="color: inherit"></uni-icons>
										</view>
										<view class="corner-badge view-badge">
											<uni-icons :type="scope.row.is_viewed ? 'eye-filled' : 'eye-slash'" size="12" color="rgba(255,255,255,0.7)"></uni-icons>
										</view>
									</view>
								</view>
							</template>
						</el-table-column>

						<el-table-column label="拍摄时间" width="300" align="center" sortable prop="shooting_time">
							<template #default="scope">
								<view style="font-size: 12px; line-height: 1.4">
									<view>{{ formatDate(scope.row.shooting_time, 'yyyy-MM-dd hh:mm') }}</view>
								</view>
							</template>
						</el-table-column>

						<el-table-column label="上传者" width="300" prop="uploader" align="center" show-overflow-tooltip>
							<template #default="scope">
								<view class="uploader-info">
									<text class="text-ellipsis">{{ getUserName(scope.row.user_id) }}</text>
									<text v-if="scope.row.is_guide" class="role-tag">导</text>
								</view>
							</template>
						</el-table-column>

						<el-table-column label="操作" align="center" fixed="right">
							<template #default="scope">
								<view class="uni-group op-btns">
									<el-button size="small" :type="scope.row.is_promo ? 'warning' : 'info'" plain @click="togglePromo(scope.row)" style="padding: 6px 8px">
										<uni-icons :type="scope.row.is_promo ? 'star-filled' : 'star'" size="14" style="color: inherit"></uni-icons>
										<text style="margin-left: 2px; font-size: 12px">{{ scope.row.is_promo ? '取消宣传' : '设为宣传' }}</text>
									</el-button>

									<el-button size="small" type="primary" plain @click="downloadSinglePhoto(scope.row.original_url)" style="padding: 6px 8px; margin-left: 6px">
										<uni-icons type="download" size="14" style="color: inherit">
											<text style="margin-left: 2px; font-size: 12px">下载</text>
										</uni-icons>
									</el-button>

									<el-button size="small" type="danger" plain @click="deletePhoto(scope.row)" style="padding: 6px 8px; margin-left: 6px">
										<uni-icons type="trash" size="14" style="color: inherit">
											<text style="margin-left: 2px; font-size: 12px">删除</text>
										</uni-icons>
									</el-button>
								</view>
							</template>
						</el-table-column>
					</el-table>

					<view class="pagination-wrapper">
						<uni-pagination show-icon :page-size="pageSize" :current="pageCurrent" :total="pagination.count" @change="onPageChanged" />
					</view>
				</view>
			</unicloud-db>
		</view>

		<el-dialog title="视频预览" v-model="videoDialogVisible" width="600px" destroy-on-close center append-to-body>
			<video v-if="videoDialogVisible" :src="currentVideoUrl" controls autoplay class="preview-video-player"></video>
		</el-dialog>

		<el-dialog title="当日评分" v-model="assessmentVisible" width="400px" append-to-body>
			<el-form label-width="100px">
				<el-form-item label="拍摄评分">
					<el-input-number v-model="assessmentForm.photo_score" :min="0" :max="100"></el-input-number>
				</el-form-item>
				<el-form-item label="视频评分">
					<el-input-number v-model="assessmentForm.video_score" :min="0" :max="100"></el-input-number>
				</el-form-item>
				<el-form-item label="不纳入考核">
					<el-switch v-model="assessmentForm.exclude_assessment"></el-switch>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="assessmentVisible = false">取消</el-button>
				<el-button type="primary" @click="saveAssessment">保存</el-button>
			</template>
		</el-dialog>
	</view>
</template>

<script>
import { exif } from '@/uni_modules/lime-shared/exif';
import { toRaw } from 'vue';

// 引入 format 日期工具 (可选，如果没有全局mixin)
import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js';

const albumService = uniCloud.importObject('album-service', { customUI: true });

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
			isUploading: false,
			selectedPhotoIds: [],
			selectedPhotoUrls: [],
			currentPhotoList: [],
			videoDialogVisible: false,
			currentVideoUrl: '',
			guideInfo: null,
			serverStandards: null, // 后端返回的配置（如果有）
			dailyStatsAll: {},
			assessmentVisible: false,
			assessmentForm: {
				photo_score: 0,
				video_score: 0,
				exclude_assessment: false
			}
		};
	},
	computed: {
		/**
		 * 根据私导等级生成当前的任务基准规则
		 */
		taskRules() {
			// 优先使用后端配置 (a-management-configs)
			if (this.serverStandards) {
				const s = this.serverStandards;
				return {
					photo_target: s.photo_daily || 0,
					// 根据 video_days 转换逻辑：1天->daily, >1天->3day
					video_req: s.video_days === 1 ? 'daily' : s.video_days > 1 ? '3day' : 'none',
					promo_target: s.promo_daily || 0
				};
			}

			// 兜底逻辑：如果没读到配置，才使用本地硬编码规则
			if (!this.guideInfo) return null;
			const level = this.guideInfo.level?.toUpperCase() || 'D';
			const rules = {
				D: { photo_target: 10, video_req: 'none', promo_target: 0 },
				C: { photo_target: 30, video_req: '3day', promo_target: 0 },
				B: { photo_target: 50, video_req: 'daily', promo_target: 0 },
				A: { photo_target: 100, video_req: 'daily', promo_target: 10 }
			};
			return rules[level] || rules['D'];
		},

		imageOnlyPreviewList() {
			return this.currentPhotoList.filter((p) => !this.isVideo(p.original_url)).map((p) => p.original_url);
		},

		/**
		 * 判断视频任务是否达标
		 */
		isVideoTaskDone() {
			if (!this.taskRules) return false;
			const req = this.taskRules.video_req;
			const count = this.currentDayStats.video || 0;

			if (req === 'none') return true;
			if (req === 'daily') return count >= 1;
			if (req === '3day') {
				// C级：3天1条。如果当天有视频，肯定达标。
				// 如果当天没有，我们暂且认为"未完成"或者显示总数。
				// 这里为了简单直观，如果当天有就显示绿钩，没有则显示数字0
				return count >= 1;
			}
			return false;
		},

		tripStartDateMs() {
			if (!this.albumData || !this.albumData.departure_date) return null;
			const date = new Date(this.albumData.departure_date);
			date.setHours(0, 0, 0, 0);
			return date.getTime();
		},

		dayQueryRange() {
			if (!this.tripStartDateMs || !this.albumData.total_days) return { start: null, end: null };
			const dayMs = 24 * 60 * 60 * 1000;
			let queryStart = this.selectedDay === 1 ? 0 : this.tripStartDateMs + (this.selectedDay - 1) * dayMs;
			let queryEnd = this.selectedDay === this.albumData.total_days ? 9999999999999 : this.tripStartDateMs + (this.selectedDay - 1) * dayMs + dayMs - 1;
			return { start: queryStart, end: queryEnd };
		},

		photosWhereClause() {
			if (!this.id || !this.albumData) return "album_id == 'INVALID'";
			const { start, end } = this.dayQueryRange;
			return `album_id == '${this.id}' && ((shooting_time != null && shooting_time >= ${start} && shooting_time <= ${end}) || (shooting_time == null && create_date >= ${start} && create_date <= ${end}))`;
		},

		currentDayStats() {
			return (this.dailyStatsAll && this.dailyStatsAll[this.selectedDay]) || { photo: 0, video: 0, promo: 0 };
		},

		currentAssessment() {
			if (!this.albumData || !this.albumData.daily_assessments) return {};
			return this.albumData.daily_assessments.find((a) => a.day_index === this.selectedDay) || {};
		},

		albumStatusText() {
			if (!this.albumData) return '';
			const now = Date.now();
			const start = this.albumData.departure_date;
			const end = start + this.albumData.total_days * 86400000;
			if (now < start) return '待出发';
			if (now > end) return '已完成';
			return '进行中';
		},
		albumStatusClass() {
			return { 待出发: 'pending', 进行中: 'active', 已完成: 'done' }[this.albumStatusText] || '';
		}
	},

	onLoad(e) {
		if (e.id) {
			this.id = e.id;
			this.loadAlbumDetail();
		} else {
			uni.navigateBack();
		}
	},

	methods: {
		formatDate(date, fmt) {
			return formatDate(date, fmt);
		},
		goBack() {
			uni.navigateBack();
		},

		async loadAlbumDetail() {
			uni.showLoading({ title: '加载中' });
			try {
				const res = await albumService.getAlbumDetailWithStats(this.id);
				if (res.errCode === 0) {
					this.albumData = res.data.album;
					this.guideInfo = res.data.guideInfo;
					this.serverStandards = res.data.standards; // 保留后端返回的，但UI主要用本地计算的taskRules
					this.dailyStatsAll = res.data.dailyStats;
					if (this.albumData.total_days) {
						this.daysList = Array.from({ length: this.albumData.total_days }, (_, i) => i + 1);
					}
				}
			} catch (e) {
				console.error(e);
			} finally {
				uni.hideLoading();
			}
		},

		getEndDate(data) {
			if (!data) return 0;
			const days = data.total_days || 1;
			return data.departure_date + (days - 1) * 86400000;
		},

		getUserName(users) {
			if (users && users[0]) {
				return users[0].nickname || users[0].real_name || users[0].mobile || '未知';
			}
			return '未知';
		},

		getPercent(cur, target) {
			if (!target) return 0;
			return Math.min(100, (cur / target) * 100);
		},

		// 切换宣传状态
		async togglePromo(row) {
			const newStatus = !row.is_promo;
			row.is_promo = newStatus; // 乐观更新
			await albumService.updatePhotoAttribute({ photoId: row._id, attributes: { is_promo: newStatus } });
			if (newStatus) this.dailyStatsAll[this.selectedDay].promo++;
			else this.dailyStatsAll[this.selectedDay].promo--;
		},

		handleLoadAlbum(data) {
			this.albumLoading = false;
			if (data) {
				this.albumData = data;
				this.daysList = Array.from({ length: data.total_days || 1 }, (_, i) => i + 1);
			}
		},

		handleLoadPhotos(data) {
			this.currentPhotoList = data || [];
			this.photosLoading = false;
		},

		dayChange(e) {
			this.selectedDay = e.currentIndex + 1;
			this.pageCurrent = 1;
			this.clearSelection();
		},

		onPageChanged(e) {
			this.pageCurrent = e.current;
			this.clearSelection();
		},

		handleSelectionChange(selection) {
			this.selectedPhotoIds = selection.map((row) => row._id);
			this.selectedPhotoUrls = selection.map((row) => row.original_url);
		},

		getSelectedCount() {
			return this.selectedPhotoIds.length;
		},

		clearSelection() {
			this.selectedPhotoIds = [];
			this.selectedPhotoUrls = [];
			if (this.$refs.photoTable) this.$refs.photoTable.clearSelection();
		},

		downloadSinglePhoto(url) {
			const link = document.createElement('a');
			link.href = url;
			link.download = url.substring(url.lastIndexOf('/') + 1) || `photo.jpg`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		},

		handleBatchDownload() {
			if (this.selectedPhotoUrls.length === 0) return;
			uni.showLoading({ title: '打包中...' });
			albumService
				.generateBatchDownloadLink({ photoUrls: this.selectedPhotoUrls, albumName: this.albumData?.album_name })
				.then((res) => {
					uni.hideLoading();
					if (res.errCode === 0 && res.downloadUrl) window.open(res.downloadUrl);
				})
				.catch((err) => {
					uni.hideLoading();
					uni.showModal({ content: err.message || '下载失败', showCancel: false });
				});
		},

		deletePhoto(item) {
			uni.showModal({
				title: '确认删除',
				content: '删除后无法恢复，确定吗？',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading();
						const delRes = await albumService.deletePhoto(item._id);
						uni.hideLoading();
						if (delRes.errCode === 0) {
							uni.showToast({ title: '删除成功' });
							this.$refs.udbPhotos.loadData({ clear: true });
							// 更新统计
							if (item.media_type === 'video') this.dailyStatsAll[this.selectedDay].video--;
							else this.dailyStatsAll[this.selectedDay].photo--;
						}
					}
				}
			});
		},

		handleBatchDelete() {
			uni.showModal({
				title: '批量删除',
				content: `确定删除 ${this.selectedPhotoIds.length} 张照片吗？`,
				confirmColor: '#f56c6c',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading();
						const result = await albumService.batchDeletePhotos(this.selectedPhotoIds);
						uni.hideLoading();
						if (result.errCode === 0) {
							uni.showToast({ title: '删除成功' });
							this.clearSelection();
							this.$refs.udbPhotos.loadData({ clear: true });
						}
					}
				}
			});
		},

		/**
		 * 统一处理媒体点击：
		 * 1. 无论是图片还是视频，点击即标记为已读
		 * 2. 如果是视频，打开视频弹窗
		 * 3. 如果是图片，不做额外操作，让点击事件冒泡给 el-image 自动触发预览
		 */
		onMediaClick(row) {
			// 1. 立即标记为已读 (UI更新 + 后端请求)
			if (!row.is_viewed) {
				row.is_viewed = true;
				// 静默更新后端状态
				albumService.updatePhotoAttribute({
					photoId: row._id,
					attributes: { is_viewed: true }
				});
			}

			// 2. 如果是视频，手动处理播放逻辑
			if (this.isVideo(row.original_url)) {
				this.currentVideoUrl = row.original_url;
				this.videoDialogVisible = true;
			}

			// 3. 如果是图片，什么都不用做，Click事件会自然传给内部的 el-image 组件打开预览
		},

		isVideo(url) {
			return ['.mp4', '.mov', '.webm', '.avi', '.m3u8'].some((ext) => (url || '').toLowerCase().includes(ext));
		},

		/**
		 * 获取图片在纯图片列表中的索引 (用于打开预览时的初始位置)
		 */
		getImageIndex(url) {
			return this.imageOnlyPreviewList.indexOf(url);
		},

		/**
		 * 处理预览切换：自动标记为已读
		 */
		handlePreviewSwitch(index) {
			const url = this.imageOnlyPreviewList[index];
			if (!url) return;

			const row = this.currentPhotoList.find((p) => p.original_url === url);
			if (row && !row.is_viewed) {
				// 乐观更新 UI
				row.is_viewed = true;
				// 静默提交后端更新
				albumService.updatePhotoAttribute({
					photoId: row._id,
					attributes: { is_viewed: true }
				});
			}
		},

		/**
		 * 批量设为未读
		 */
		async handleBatchUnview() {
			if (this.selectedPhotoIds.length === 0) return;
			uni.showLoading({ title: '处理中...' });

			try {
				// 循环调用 (建议后续后端增加 batchUpdate 接口优化)
				const promises = this.selectedPhotoIds.map((id) => {
					return albumService.updatePhotoAttribute({
						photoId: id,
						attributes: { is_viewed: false }
					});
				});
				await Promise.all(promises);

				// 更新本地状态
				this.currentPhotoList.forEach((row) => {
					if (this.selectedPhotoIds.includes(row._id)) {
						row.is_viewed = false;
					}
				});
				uni.hideLoading();
				uni.showToast({ title: '已标记为未读' });
				this.clearSelection();
			} catch (e) {
				uni.hideLoading();
				console.error(e);
			}
		},

		previewMedia(row) {
			if (!row.is_viewed) {
				row.is_viewed = true;
				albumService.updatePhotoAttribute({ photoId: row._id, attributes: { is_viewed: true } });
			}
			if (this.isVideo(row.original_url)) {
				this.currentVideoUrl = row.original_url;
				this.videoDialogVisible = true;
			} else {
				// 仅预览图片
				const urls = this.currentPhotoList.filter((p) => !this.isVideo(p.original_url)).map((p) => p.original_url);
				const current = row.original_url;
				uni.previewImage({ urls, current });
			}
		},

		openAssessmentDialog() {
			const record = this.albumData.daily_assessments?.find((a) => a.day_index === this.selectedDay);
			this.assessmentForm = record ? { ...record } : { photo_score: 0, video_score: 0, exclude_assessment: false };
			this.assessmentVisible = true;
		},

		async saveAssessment() {
			uni.showLoading();
			await albumService.saveDailyAssessment({ albumId: this.id, dayIndex: this.selectedDay, ...this.assessmentForm });
			if (!this.albumData.daily_assessments) this.albumData.daily_assessments = [];
			const idx = this.albumData.daily_assessments.findIndex((a) => a.day_index === this.selectedDay);
			const newRecord = { day_index: this.selectedDay, ...this.assessmentForm };
			if (idx > -1) this.albumData.daily_assessments.splice(idx, 1, newRecord);
			else this.albumData.daily_assessments.push(newRecord);
			uni.hideLoading();
			this.assessmentVisible = false;
			uni.showToast({ title: '保存成功' });
		},

		triggerUpload() {
			if (!this.albumData || this.albumData.status !== 1) return uni.showToast({ title: '非进行中相册', icon: 'none' });
			uni.chooseFile({
				count: 9,
				type: 'all', // 允许所有类型，通过 extension 过滤
				extension: ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.m4v', '.avi'],
				success: async (res) => {
					this.isUploading = true;
					uni.showLoading({ title: '处理中 0/' + res.tempFiles.length });
					let successCount = 0;
					let failCount = 0;

					const uploadPromises = res.tempFiles.map(async (tempFile, index) => {
						uni.showLoading({ title: `处理中 ${index + 1}/${res.tempFiles.length}` });
						try {
							const filePath = tempFile.path; // Web端这是一个 Blob URL
							const fileNameRaw = tempFile.name || '';
							const extensionMatch = /\.([a-zA-Z0-9]+)$/.exec(fileNameRaw);
							const extension = extensionMatch ? extensionMatch[0].toLowerCase() : '.jpg';

							// 修改 2: 判断媒体类型
							const isVideo = ['.mp4', '.mov', '.m4v', '.avi'].includes(extension);
							const mediaType = isVideo ? 'video' : 'image';

							// 3. 解析拍摄时间 (仅图片尝试 EXIF，视频使用当前时间)
							let shootingTime = await new Promise((resolve) => {
								if (isVideo) {
									resolve(Date.now()); // 视频暂不解析时间，直接用当前时间
									return;
								}

								try {
									if (typeof tempFile === 'string' || (!tempFile.path && !tempFile.file)) {
										resolve(Date.now());
										return;
									}

									// 兼容 Web 端的 File 对象
									const fileSource = tempFile.file || tempFile.path;

									exif.getData(fileSource, function () {
										const dateTimeOriginal = exif.getTag(this, 'DateTimeOriginal');
										if (dateTimeOriginal) {
											const [datePart, timePart] = dateTimeOriginal.split(' ');
											if (datePart && timePart) {
												const [year, month, day] = datePart.split(':');
												const [hours, minutes, seconds] = timePart.split(':');
												if (year && month && day && hours && minutes && seconds) {
													const date = new Date(year, month - 1, day, hours, minutes, seconds);
													resolve(date.getTime());
													return;
												}
											}
										}
										resolve(Date.now());
									});
								} catch (exifError) {
									console.warn('[EXIF] 解析异常:', exifError);
									resolve(Date.now());
								}
							});

							// 4. 上传文件
							const randomString = Math.random().toString(36).substring(2, 10);
							const cloudPath = `album-photos/${this.id}/${shootingTime}-${randomString}${extension}`;

							const uploadResult = await uniCloud.uploadFile({
								filePath: filePath,
								cloudPath: cloudPath,
								fileType: mediaType, // 明确指定云存储的文件类型
								onUploadProgress: (progressEvent) => {
									const percentCompleted = Math.round((progressEvent.loaded / progressEvent.total) * 100 || 0);
									uni.showLoading({ title: `上传中 ${index + 1}/${res.tempFiles.length} (${percentCompleted}%)` });
								}
							});

							// 修改 3: 调用服务时传入 mediaType
							await albumService.uploadPhotos({
								albumId: this.id,
								file: uploadResult,
								shootingTime: shootingTime,
								mediaType: mediaType // 关键参数
							});

							successCount++;
						} catch (e) {
							failCount++;
							console.error(`[上传] 文件 ${tempFile.name} 失败:`, e);
						}
					});

					await Promise.all(uploadPromises);

					this.isUploading = false;
					uni.hideLoading();

					if (failCount > 0) {
						uni.showModal({
							title: '上传报告',
							content: `成功: ${successCount}\n失败: ${failCount}`,
							showCancel: false
						});
					} else {
						uni.showToast({ title: `成功上传 ${successCount} 个文件`, icon: 'success' });
					}

					this.clearSelection();
					this.$refs.udbPhotos.loadData({ clear: true });
				},
				fail: (err) => {
					// 忽略用户取消的情况
					if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
						console.error('[选择文件] 失败:', err);
						uni.showToast({ title: '选择文件失败', icon: 'none' });
					}
					this.isUploading = false;
				}
			});
		}
	}
};
</script>

<style scoped>
.container {
	padding: 15px;
	background-color: #f5f7fa;
	min-height: 100vh;
}
.uni-header-button-group {
	margin-bottom: 10px;
}

/* 头部面板样式 */
.album-info-header {
	background-color: #fff;
	padding: 15px;
	border-radius: 8px;
	margin-bottom: 15px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	display: flex;
	gap: 15px;
	flex-wrap: wrap;
}

.info-col {
	flex: 1;
	min-width: 280px;
}
.info-item {
	margin-bottom: 8px;
	font-size: 14px;
	color: #606266;
}
.label {
	font-weight: 500;
	color: #333;
}
.title .album-name {
	font-size: 16px;
	font-weight: bold;
	color: #303133;
	margin-right: 8px;
}

/* 状态标签 */
.status-tag {
	padding: 2px 6px;
	border-radius: 4px;
	font-size: 12px;
	border: 1px solid #ddd;
	color: #999;
}
.status-tag.active {
	border-color: #19be6b;
	color: #19be6b;
	background: #e1f3d8;
}
.status-tag.pending {
	border-color: #e6a23c;
	color: #e6a23c;
	background: #faecd8;
}

/* 私导任务面板 */
.guide-panel {
	background: #fdfdfd;
	padding: 12px;
	border: 1px solid #ebeef5;
	border-radius: 6px;
}
.guide-header {
	display: flex;
	justify-content: space-between;
	margin-bottom: 10px;
	border-bottom: 1px solid #eee;
	padding-bottom: 8px;
}
.guide-name {
	font-weight: bold;
	font-size: 15px;
}
.guide-level {
	font-size: 12px;
	padding: 3px 8px;
	border-radius: 3px;
	color: #fff;
	background: #909399;
}
.guide-level.level-A {
	background: #f56c6c;
}
.guide-level.level-B {
	background: #e6a23c;
}
.guide-level.level-C {
	background: #409eff;
}
.guide-level.level-D {
	background: #67c23a;
}

.task-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 6px;
	font-size: 13px;
}
.task-label {
	display: flex;
	align-items: center;
	gap: 4px;
	color: #606266;
}
.sub-text {
	font-size: 12px;
	color: #999;
}
.task-status {
	display: flex;
	align-items: center;
	gap: 5px;
}
.status-icon {
	font-weight: bold;
	color: #f56c6c;
}
.status-icon.done {
	color: #67c23a;
}

/* 操作栏样式 (Fix 1) */
.action-section {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 10px;
	background: #fff;
	padding: 10px;
	border-radius: 6px;
	border: 1px solid #ebeef5;
}
.action-left {
	display: flex;
	align-items: center;
}
.btn-group {
	display: flex;
	align-items: center;
	gap: 8px;
}
.highlight-num {
	color: #409eff;
	font-weight: bold;
	margin: 0 4px;
}

/* 缩略图样式 (Fix 3) */
.media-thumbnail-container {
	width: 100px;
	height: 100px;
	border-radius: 4px;
	overflow: hidden;
	position: relative;
	margin: 0 auto;
	cursor: pointer;
	border: 1px solid #eee;
}
.media-content {
	width: 100%;
	height: 100%;
	display: block;
}
.video-mode {
	background: #000;
	position: relative;
}
.mini-video {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
.video-overlay {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.2);
	pointer-events: none;
}
.thumbnail-overlays {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
}
.corner-badge {
	position: absolute;
	color: rgba(255, 255, 255, 0.8);
	font-size: 14px;
	padding: 1px 6px;
	box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
	z-index: 2;
}
.promo-badge {
	top: 0;
	left: 0;
	background: linear-gradient(45deg, #ff4d4f, #f56c6c);
	border-bottom-right-radius: 6px;
}
.view-badge {
	bottom: 0;
	right: 0;
	background: rgba(0, 0, 0, 0.5); /* 半透明黑底，保证看清 */
	border-top-left-radius: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0px 6px;
}

.bottom-bar {
	width: 100%;
	background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
	display: flex;
	justify-content: flex-end;
	padding: 4px;
	box-sizing: border-box;
}

/* 列表相关 */
.uploader-info {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 5px;
	width: 100%;
}
.text-ellipsis {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	text-align: center;
}
.role-tag {
	font-size: 10px;
	background: #e6a23c;
	color: white;
	padding: 0 4px;
	border-radius: 2px;
	margin-top: 2px;
	transform: scale(0.9);
}
.text-gray {
	color: #909399;
}

/* 操作按钮组 */
.op-btns {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-wrap: nowrap;
}
.pagination-wrapper {
	margin-top: 15px;
	background: #fff;
	padding: 10px;
	border-radius: 6px;
}
.preview-video-player {
	width: 100%;
	height: 400px;
}
.error-tip {
	color: #f56c6c;
	text-align: center;
	padding: 20px;
}

/* 评分展示区样式 */
.assessment-display {
	display: flex;
	align-items: center;
	background-color: #f0f9eb;
	padding: 4px 10px;
	border-radius: 4px;
	border: 1px solid #e1f3d8;
	margin-left: 10px;
	cursor: pointer;
	transition: all 0.3s;
}
.assessment-display:hover {
	background-color: #e1f3d8;
}
.score-tag {
	font-size: 13px;
	font-weight: bold;
	color: #67c23a;
	display: flex;
	align-items: center;
}
.divider {
	margin: 0 5px;
	color: #c0c4cc;
}
.exclude-tag {
	font-size: 10px;
	background: #909399;
	color: #fff;
	padding: 1px 4px;
	border-radius: 2px;
	margin-left: 6px;
}
.edit-icon {
	margin-left: 6px;
}
</style>
