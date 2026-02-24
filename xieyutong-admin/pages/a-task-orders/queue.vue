<template>
	<view class="px-5 py-3">
		<view class="uni-header">
			<view class="uni-group">
				<button type="default" size="mini" @click="goBack">返回</button>
				<view class="uni-title ml-2">消息发送队列 - {{ orderId }}</view>
			</view>
			<view class="uni-group">
				<button class="uni-button" size="mini" type="default" style="margin-right: 10px; background-color: green; color: #fff" @click="openCreateModal">+ 新建消息</button>
				<button class="uni-button" size="mini" type="warn" style="margin-right: 10px" @click="resendAll">全部重发</button>
				<button class="uni-button" size="mini" type="primary" style="margin-right: 10px" @click="resendFailed">重发失败</button>
				<button class="uni-button" size="mini" @click="refresh">刷新状态</button>
				<button class="uni-button" size="mini" type="default" style="margin-right: 10px" @click="goToSettings">⚙️ 设置</button>
			</view>
		</view>

		<view class="uni-container">
			<unicloud-db
				ref="udb"
				collection="a-task-queue"
				:where="`task_id == '${taskId}'`"
				orderby="send_time asc"
				:page-size="500"
				@load="onDBLoad"
				v-slot:default="{ loading, error }">
				<view v-if="loading" class="p-5 text-center text-gray-500">加载中...</view>
				<view v-else-if="!rawList.length" class="p-10 text-center text-gray-400">暂无消息队列。如果任务刚创建，请等待程序处理完成。{{ error }}</view>

				<scroll-view v-else scroll-y scroll-with-animation :scroll-into-view="scrollTarget" style="height: calc(100vh - 160px)">
					<view class="flex flex-row items-start relative" style="align-items: flex-start; min-height: 100%">
						<view class="sticky-sidebar flex-shrink-0 hidden md:flex flex-col gap-1 pr-2 mr-3 border-r border-gray-100" style="width: 80px">
							<view
								v-for="(tasks, dateKey) in groupedTasks"
								:key="'idx-' + dateKey"
								@click="scrollToDate(dateKey)"
								class="cursor-pointer group flex flex-col items-center justify-center p-2 rounded hover:bg-blue-50 transition-colors">
								<view class="text-xs text-gray-400 font-bold mb-1">{{ dateKey.split('-')[0] }}</view>
								<view class="text-sm text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
									{{ dateKey.split('-').slice(1).join('/') }}
								</view>
								<view class="text-xs text-gray-400 mt-1 scale-90">{{ tasks.length }}条</view>
							</view>
						</view>

						<view class="flex-1" style="min-width: 0">
							<view v-for="(tasks, dateKey) in groupedTasks" :key="dateKey" class="mb-8">
								<view :id="'date-header-' + dateKey" class="flex items-center justify-center mb-4">
									<view class="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-bold shadow-sm">📅 {{ dateKey }}</view>
								</view>

								<view class="grid grid-cols-1 gap-4">
									<view
										v-for="item in tasks"
										:key="item._id"
										:id="'msg-' + item._id"
										class="bg-white border rounded-lg p-4 shadow-sm relative transition-all duration-500"
										:class="[item.status === 'manual_stop' ? 'opacity-60' : '', highlightId === item._id ? 'ring-2 ring-red-500 bg-red-50 transform scale-102 shadow-lg' : '']">
										<view v-if="highlightId === item._id" class="absolute -left-2 -top-2 bg-red-600 text-white text-xs px-2 py-1 rounded z-20 shadow">当前处理项</view>

										<view class="absolute top-4 right-4 flex items-center z-10">
											<text class="text-xs mr-2" :class="item.status === 'pending' ? 'text-blue-600 font-bold' : 'text-gray-400'">
												{{ item.status === 'pending' ? '已启用' : '未启用' }}
											</text>
											<switch :checked="item.status === 'pending'" style="transform: scale(0.7)" color="#2563EB" @change="(e) => toggleTaskStatus(item, e)" />
										</view>

										<view class="mb-3 border-b pb-2 pr-20">
											<view class="text-base font-bold text-gray-800 mb-1">
												📌 {{ item.task_name || '未命名任务' }}
												<text v-if="item.score" class="ml-2 text-sm text-orange-500 bg-orange-100 px-1 rounded">
													{{ item.score }}
												</text>
											</view>

											<view v-if="item.error_msg" class="text-xs text-red-600 bg-red-50 p-1 rounded mt-1 border border-red-200">❌ 失败原因: {{ item.error_msg }}</view>

											<view class="text-xs text-gray-500 mb-1" v-if="item.start_time">
												🕒 窗口: {{ formatTimeOnly(item.start_time) }}
												<span v-if="item.end_time">- {{ formatTimeOnly(item.end_time) }}</span>
											</view>
											<view class="text-sm text-gray-600 flex flex-wrap gap-4 mt-2">
												<view>
													📅 计划发送:
													<text class="font-medium text-blue-600">{{ item.send_time || '待定' }}</text>
												</view>
											</view>
										</view>

										<view class="bg-gray-50 p-3 rounded mb-3">
											<view v-for="(msg, idx) in item.payload" :key="idx" class="mb-3 last:mb-0">
												<view v-if="msg.type === 'text'" class="text-gray-800 text-sm whitespace-pre-wrap">{{ msg.data }}</view>
												<view v-else-if="msg.type === 'image'" class="mt-2">
													<image
														:src="msg.data"
														mode="aspectFill"
														class="rounded border bg-gray-200"
														style="width: 100px; height: 100px"
														@click.stop="previewImage(msg.data)"></image>
												</view>
												<view v-else-if="msg.type === 'video'" class="text-purple-600 text-xs mt-1">📹 [视频] {{ getFileName(msg.data) }}</view>
												<view v-else-if="msg.type === 'file'" class="text-blue-600 text-xs mt-1 underline">📎 [文件] {{ getFileName(msg.data) }}</view>
											</view>
										</view>

										<view class="flex justify-end gap-2">
											<button size="mini" type="warn" plain @click="deleteTask(item._id)">删除</button>
											<button v-if="item.status === 'sent'" size="mini" type="warn" plain @click="confirmResend(item._id)">再次发送</button>
											<button size="mini" @click="openEditModal(item)">编辑消息</button>
										</view>
									</view>
								</view>
							</view>
						</view>
					</view>
				</scroll-view>
			</unicloud-db>
		</view>

		<view v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" style="background-color: rgba(0, 0, 0, 0.5)">
			<view class="bg-white rounded-lg w-11/12 md:w-1/2 p-5 shadow-lg max-h-90vh flex flex-col">
				<view class="text-lg font-bold mb-4 border-b pb-2">{{ editingId ? '编辑消息' : '新建消息' }}</view>

				<view class="mb-4 bg-gray-50 p-2 rounded">
					<view class="text-xs text-gray-500 mb-1 font-bold">📅 计划发送时间:</view>
					<uni-datetime-picker type="datetime" v-model="tempSendTime" placeholder="请选择发送时间" return-type="string" />
				</view>

				<scroll-view scroll-y class="flex-1 border rounded p-2 mb-2" style="max-height: 50vh">
					<view v-if="tempPayload.length === 0" class="text-center text-gray-400 py-4">暂无内容，请点击下方按钮添加</view>

					<view v-for="(msg, index) in tempPayload" :key="index" class="mb-4 border-b pb-4 last:border-0 relative">
						<view class="absolute right-0 top-0 z-10">
							<button size="mini" type="warn" plain style="font-size: 10px; padding: 0 5px; height: 20px; line-height: 20px" @click="removePayloadItem(index)">删除</button>
						</view>

						<view class="text-xs text-gray-500 mb-2 font-bold">第 {{ index + 1 }} 条 ({{ getTypeLabel(msg.type) }})</view>

						<view v-if="msg.type === 'text'">
							<textarea v-model="msg.data" class="w-full border p-2 rounded text-sm bg-gray-50 h-24" maxlength="-1" placeholder="请输入文本内容"></textarea>
						</view>

						<view v-else-if="msg.type === 'image'" class="flex flex-col gap-2">
							<view class="flex w-full items-start gap-3">
								<image :src="msg.data" mode="aspectFill" class="w-20 h-20 rounded bg-gray-200 border flex-shrink-0" @click="previewImage(msg.data)"></image>
								<view class="flex-1" style="min-width: 0">
									<textarea v-model="msg.data" class="w-full border p-1 rounded text-xs bg-gray-50 h-16" placeholder="输入图片URL"></textarea>
								</view>
							</view>
							<button size="mini" @click="replaceMedia(index, 'image')">🔄 更换图片</button>
						</view>

						<view v-else-if="msg.type === 'video'" class="flex flex-col gap-2">
							<view class="text-xs text-blue-600 break-all bg-gray-100 p-2 rounded">📹 {{ getFileName(msg.data) || '未知视频' }}</view>
							<textarea v-model="msg.data" class="w-full border p-1 rounded text-xs bg-gray-50 h-10" placeholder="输入视频URL"></textarea>
							<button size="mini" @click="replaceMedia(index, 'video')">🔄 更换视频</button>
						</view>

						<view v-else-if="msg.type === 'file'" class="flex flex-col gap-2">
							<view class="text-xs text-green-600 break-all bg-gray-100 p-2 rounded">📎 {{ getFileName(msg.data) || '未知文件' }}</view>
							<textarea v-model="msg.data" class="w-full border p-1 rounded text-xs bg-gray-50 h-10" placeholder="输入文件URL"></textarea>
							<button size="mini" @click="replaceMedia(index, 'file')">🔄 更换文件</button>
						</view>

						<view v-else class="border p-2 rounded bg-gray-50 text-gray-400 text-xs">暂不支持编辑此类型数据</view>
					</view>
				</scroll-view>

				<view class="flex gap-2 mb-4 justify-center">
					<button size="mini" type="default" @click="addMediaItem('image')">+ 图片</button>
					<button size="mini" type="default" @click="addMediaItem('video')">+ 视频</button>
					<button size="mini" type="default" @click="addMediaItem('file')">+ 文件</button>
				</view>

				<view class="flex justify-end gap-3 mt-2 pt-3 border-t">
					<button size="mini" type="default" @click="closeEditModal">取消</button>
					<button size="mini" type="primary" @click="saveEdit">保存修改</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();

export default {
	data() {
		return {
			taskId: '',
			orderId: '',
			showEditModal: false,
			editingId: null,
			tempPayload: [],
			tempSendTime: '',
			rawList: [],
			highlightId: '',
			scrollTarget: ''
		};
	},
	onLoad(options) {
		this.taskId = options.id;
		this.orderId = options.order || '';
		// 获取传递进来的高亮ID
		if (options.highlight) {
			this.highlightId = options.highlight;
		}
	},
	computed: {
		// 按日期分组逻辑
		groupedTasks() {
			if (!this.rawList || this.rawList.length === 0) return {};

			const groups = {};
			this.rawList.forEach((item) => {
				const dateKey = item.send_time ? item.send_time.split(' ')[0] : '待定日期';

				if (!groups[dateKey]) {
					groups[dateKey] = [];
				}
				groups[dateKey].push(item);
			});

			const sortedKeys = Object.keys(groups).sort();
			const sortedGroups = {};
			sortedKeys.forEach((key) => {
				sortedGroups[key] = groups[key];
			});

			return sortedGroups;
		}
	},
	methods: {
		onDBLoad(data) {
			this.rawList = data;
			// 数据加载后，尝试滚动到高亮位置
			if (this.highlightId) {
				this.scrollToHighlight();
			}
		},
		// 滚动到指定元素
		scrollToHighlight() {
			// 给页面渲染一点时间
			setTimeout(() => {
				const query = uni.createSelectorQuery().in(this);
				query
					.select('#msg-' + this.highlightId)
					.boundingClientRect((data) => {
						if (data) {
							uni.pageScrollTo({
								scrollTop: data.top - 100, // 减去头部高度，避免被遮挡
								duration: 300
							});
						}
					})
					.exec();
			}, 600);
		},

		// 滚动到指定日期
		scrollToDate(dateKey) {
			this.scrollTarget = '';
			this.$nextTick(() => {
				this.scrollTarget = 'date-header-' + dateKey;
			});
		},

		formatTimeOnly(dateTimeStr) {
			if (!dateTimeStr) return '';
			const parts = dateTimeStr.split(' ');
			return parts.length > 1 ? parts[1] : dateTimeStr;
		},
		toggleTaskStatus(item, e) {
			console.log('agent_id: ', item.agent_id);
			if (!item.agent_id) {
				// 1. 弹窗提示
				uni.showModal({
					title: '无法启用',
					content: '该任务未绑定有效的管家，无法执行自动发送。\n\n请返回订单列表页，通过分配管家修复此问题。',
					showCancel: false
				});

				item.status = 'pending';
				// 2. 强制将开关视觉状态重置为“关” (manual_stop)
				this.$nextTick(() => {
					item.status = 'manual_stop';
				});
				return;
			}

			const isChecked = e.detail.value;
			const newStatus = isChecked ? 'pending' : 'manual_stop';
			item.status = newStatus;
			db.collection('a-task-queue')
				.doc(item._id)
				.update({
					status: newStatus
				})
				.then(() => {
					console.log('状态更新成功');
				})
				.catch((err) => {
					item.status = !isChecked ? 'pending' : 'manual_stop';
					uni.showToast({
						title: '状态更新失败',
						icon: 'none'
					});
				});
		},
		goBack() {
			uni.navigateBack();
		},
		goToSettings() {
			uni.navigateTo({
				url: '/pages/a-task-orders/settings'
			});
		},
		resendAll() {
			uni.showModal({
				title: '确认全部重发',
				content: '此操作会将本队列中的【所有任务】（含已发送成功的）重置为“待发送”状态。\n\n这可能导致消息重复发送，确定要继续吗？',
				confirmText: '确定重发',
				confirmColor: '#e64340',
				success: (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '正在重置...' });
						db.collection('a-task-queue')
							.where({
								task_id: this.taskId
							})
							.update({
								status: 'pending',
								error_msg: ''
							})
							.then((res) => {
								uni.showToast({ title: '已全部重置', icon: 'success' });
								this.refresh();
							})
							.catch((err) => {
								console.error(err);
								uni.showModal({
									title: '重置失败',
									content: '数据库批量更新失败，请检查权限或网络。\n错误信息: ' + err.message,
									showCancel: false
								});
							})
							.finally(() => {
								uni.hideLoading();
							});
					}
				}
			});
		},
		resendFailed() {
			uni.showModal({
				title: '确认重发失败消息',
				content: '此操作将仅把状态为【失败】的消息重置为“待发送”状态。\n\n确定要继续吗？',
				success: (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '正在处理...' });
						db.collection('a-task-queue')
							.where({
								task_id: this.taskId,
								status: 'failed'
							})
							.update({
								status: 'pending',
								error_msg: ''
							})
							.then((res) => {
								uni.showToast({
									title: `已重置 ${res.updated} 条消息`,
									icon: 'none'
								});
								this.refresh();
							})
							.catch((err) => {
								console.error(err);
								uni.showModal({
									title: '操作失败',
									content: '数据库更新失败：' + err.message,
									showCancel: false
								});
							})
							.finally(() => {
								uni.hideLoading();
							});
					}
				}
			});
		},
		async refresh() {
			uni.showLoading({ title: '检查补全中...' });
			try {
				// 1. 调用云对象进行智能补全
				const uniObj = uniCloud.importObject('a-task-rpa');
				const res = await uniObj.patchMissingTasks(this.taskId);

				if (res.errCode === 0) {
					if (res.msg.includes('已补全')) {
						uni.showToast({ title: res.msg, icon: 'success' });
					}
				} else {
					console.error(res);
				}
			} catch (e) {
				console.error('自动补全失败:', e);
				// 不阻断刷新，继续执行
			} finally {
				uni.hideLoading();
				// 2. 刷新列表数据
				this.$refs.udb.loadData(
					{
						clear: true
					},
					() => {
						// loadData 完成后的回调（如有需要）
						uni.stopPullDownRefresh();
					}
				);
			}
		},
		getFileName(url) {
			if (!url) return '';
			let cleanUrl = url.split('?')[0];
			return decodeURIComponent(cleanUrl.split('/').pop());
		},
		getTypeLabel(type) {
			const map = { text: '文本', image: '图片', video: '视频', file: '文件' };
			return map[type] || '未知';
		},
		getStatusText(status) {
			const map = { pending: '⏳ 待发送', sent: '✅ 已发送', failed: '❌ 失败', manual_stop: '⏸ 已暂停' };
			return map[status] || status;
		},
		getStatusClass(status) {
			const map = { pending: 'text-blue-600', sent: 'text-green-600', failed: 'text-red-600', manual_stop: 'text-orange-500' };
			return map[status] || '';
		},
		confirmResend(id) {
			uni.showModal({
				title: '确认重发',
				content: '该消息已发送过，确定要再次发送吗？',
				success: (res) => {
					if (res.confirm) {
						this.updateStatus(id, 'pending');
					}
				}
			});
		},
		updateStatus(id, newStatus) {
			uni.showLoading();
			db.collection('a-task-queue')
				.doc(id)
				.update({ status: newStatus })
				.then(() => {
					uni.showToast({ title: '状态已更新' });
					this.refresh();
				})
				.finally(() => uni.hideLoading());
		},
		previewImage(url) {
			uni.previewImage({
				urls: [url],
				current: 0
			});
		},
		openEditModal(item) {
			this.editingId = item._id;
			this.tempPayload = JSON.parse(JSON.stringify(item.payload));
			this.tempSendTime = item.send_time || '';
			this.showEditModal = true;
		},
		closeEditModal() {
			this.showEditModal = false;
			this.editingId = null;
			this.tempPayload = [];
			this.tempSendTime = '';
		},
		addMediaItem(type) {
			this.handleUpload(type, (url) => {
				this.tempPayload.push({ type: type, data: url });
			});
		},
		replaceMedia(index, type) {
			this.handleUpload(type, (url) => {
				this.tempPayload[index].data = url;
				this.tempPayload[index].type = type;
			});
		},
		removePayloadItem(index) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这条内容吗？',
				success: (res) => {
					if (res.confirm) {
						this.tempPayload.splice(index, 1);
					}
				}
			});
		},
		handleUpload(type, callback) {
			const successCallback = (res) => {
				let filePath;
				let fileName = '';
				if (type === 'file') {
					filePath = res.tempFilePaths[0];
					if (res.tempFiles && res.tempFiles[0]) {
						fileName = res.tempFiles[0].name || '';
					}
				} else if (type === 'video') {
					filePath = res.tempFilePath;
				} else {
					filePath = res.tempFilePaths[0];
					if (res.tempFiles && res.tempFiles[0]) {
						fileName = res.tempFiles[0].name || '';
					}
				}

				if (!filePath) {
					uni.showToast({ title: '文件选择失败', icon: 'none' });
					return;
				}

				uni.showLoading({ title: '上传中...' });

				let ext = '';
				if (fileName && fileName.includes('.')) {
					ext = fileName.split('.').pop();
				} else {
					if (type === 'image') ext = 'jpg';
					else if (type === 'video') ext = 'mp4';
					else ext = 'bin';
				}

				ext = ext.replace(/[^a-zA-Z0-9]/g, '');

				const cloudPath = `manual_upload_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
				console.log('[Upload] Starting upload:', filePath, '->', cloudPath);

				uniCloud.uploadFile({
					filePath: filePath,
					cloudPath: cloudPath,
					success: (uploadRes) => {
						console.log('[Upload] Success:', uploadRes);
						callback(uploadRes.fileID);
						uni.showToast({ title: '上传成功', icon: 'success' });
					},
					fail: (err) => {
						console.error('[Upload] Fail:', err);
						uni.showModal({
							title: '上传失败',
							content: '请检查文件名是否包含特殊字符，或云存储配置是否正确。\n错误信息: ' + (err.errMsg || JSON.stringify(err)),
							showCancel: false
						});
					},
					complete: () => {
						uni.hideLoading();
					}
				});
			};

			if (type === 'video') {
				uni.chooseVideo({ sourceType: ['album', 'camera'], success: successCallback });
			} else if (type === 'file') {
				// #ifdef H5
				uni.chooseFile({ count: 1, success: successCallback });
				// #endif
				// #ifndef H5
				uni.chooseImage({ count: 1, success: successCallback });
				// #endif
			} else {
				uni.chooseImage({ count: 1, sourceType: ['album', 'camera'], success: successCallback });
			}
		},
		openCreateModal() {
			this.editingId = null;
			this.tempPayload = [{ type: 'text', data: '' }];
			const now = new Date();
			now.setMinutes(now.getMinutes() + 5);
			const pad = (n) => (n < 10 ? '0' + n : n);
			this.tempSendTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
			this.showEditModal = true;
		},
		deleteTask(id) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这条消息吗？此操作不可恢复。',
				confirmColor: '#e64340',
				success: (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '删除中...' });
						db.collection('a-task-queue')
							.doc(id)
							.remove()
							.then(() => {
								uni.showToast({ title: '删除成功' });
								this.refresh();
							})
							.catch((err) => {
								console.error('[Delete] Error:', err);
								uni.showModal({
									title: '删除失败',
									content: err.message,
									showCancel: false
								});
							})
							.finally(() => {
								uni.hideLoading();
							});
					}
				}
			});
		},
		saveEdit() {
			if (!this.tempSendTime) {
				return uni.showToast({ title: '请选择发送时间', icon: 'none' });
			}
			if (this.tempPayload.length === 0) {
				return uni.showToast({ title: '请至少添加一条内容', icon: 'none' });
			}

			uni.showLoading({ title: '保存中...' });

			if (this.editingId) {
				db.collection('a-task-queue')
					.doc(this.editingId)
					.update({
						payload: this.tempPayload,
						send_time: this.tempSendTime
					})
					.then(() => {
						uni.showToast({ title: '保存成功' });
						this.closeEditModal();
						this.refresh();
					})
					.catch((err) => {
						console.error('[Save] Error:', err);
						uni.showToast({ title: '保存失败', icon: 'none' });
					})
					.finally(() => {
						uni.hideLoading();
					});
			} else {
				let defaultGroup = this.orderId;
				let defaultAccount = '';
				let defaultAgentId = '';

				if (this.rawList && this.rawList.length > 0) {
					const sample = this.rawList[0];
					if (sample.group_name) defaultGroup = sample.group_name;
					if (sample.account_name) defaultAccount = sample.account_name;
					if (sample.agent_id) defaultAgentId = sample.agent_id;
				}

				db.collection('a-task-queue')
					.add({
						task_id: this.taskId,
						agent_id: defaultAgentId,
						group_name: defaultGroup,
						account_name: defaultAccount,
						task_name: '手动新建消息',
						payload: this.tempPayload,
						send_time: this.tempSendTime,
						status: 'manual_stop',
						priority: 0
					})
					.then(() => {
						uni.showToast({ title: '创建成功' });
						this.closeEditModal();
						this.refresh();
					})
					.catch((err) => {
						console.error('[Create] Error:', err);
						uni.showModal({
							title: '创建失败',
							content: '请确保数据库权限允许创建。\n' + err.message,
							showCancel: false
						});
					})
					.finally(() => {
						uni.hideLoading();
					});
			}
		}
	}
};
</script>

<style scoped>
.fixed {
	position: fixed;
}
.inset-0 {
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
}
.z-50 {
	z-index: 50;
}
.max-h-90vh {
	max-height: 90vh;
}
.whitespace-pre-wrap {
	white-space: pre-wrap;
}
.flex-shrink-0 {
	flex-shrink: 0;
}

/* 简单的放大动画 */
.scale-102 {
	transform: scale(1.02);
}

.sticky-sidebar {
	/* position: -webkit-sticky; */
	position: sticky;
	top: 0px;
	z-index: 10;
	max-height: 80vh;
	overflow-y: auto;
}

.sticky-sidebar::-webkit-scrollbar {
	width: 0;
	height: 0;
	color: transparent;
}
</style>
