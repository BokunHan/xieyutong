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

				<view v-else>
					<view v-for="(tasks, dateKey) in groupedTasks" :key="dateKey" class="mb-8">
						<view class="flex items-center justify-center mb-4">
							<view class="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-bold shadow-sm">📅 {{ dateKey }}</view>
						</view>

						<view class="grid grid-cols-1 gap-4">
							<view
								v-for="item in tasks"
								:key="item._id"
								class="bg-white border rounded-lg p-4 shadow-sm relative transition-all"
								:class="{ 'opacity-60': item.status === 'manual_stop' }">
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
											<image :src="msg.data" mode="aspectFill" class="rounded border bg-gray-200" style="width: 100px; height: 100px" @click.stop="previewImage(msg.data)"></image>
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
			rawList: []
		};
	},
	onLoad(options) {
		this.taskId = options.id;
		this.orderId = options.order || '';
	},
	computed: {
		// 按日期分组逻辑
		groupedTasks() {
			if (!this.rawList || this.rawList.length === 0) return {};

			const groups = {};
			this.rawList.forEach((item) => {
				// 提取 send_time 的日期部分 (YYYY-MM-DD)
				// 如果 send_time 为空，归类为 '待定'
				const dateKey = item.send_time ? item.send_time.split(' ')[0] : '待定日期';

				if (!groups[dateKey]) {
					groups[dateKey] = [];
				}
				groups[dateKey].push(item);
			});

			// 对日期 Key 进行排序，保证顺序显示
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
		},
		// 只提取时间部分的辅助函数 (去掉日期)
		formatTimeOnly(dateTimeStr) {
			if (!dateTimeStr) return '';
			const parts = dateTimeStr.split(' ');
			return parts.length > 1 ? parts[1] : dateTimeStr;
		},
		// 勾选框切换状态逻辑
		toggleTaskStatus(item, e) {
			// switch 组件 e.detail.value 为 true/false
			const isChecked = e.detail.value;
			const newStatus = isChecked ? 'pending' : 'manual_stop';

			// 1. 乐观更新：先在本地修改状态，让 UI 反应迅速
			item.status = newStatus;

			// 2. 提交到数据库
			db.collection('a-task-queue')
				.doc(item._id)
				.update({
					status: newStatus
				})
				.then(() => {
					// 更新成功，静默即可
					console.log('状态更新成功');
				})
				.catch((err) => {
					// 更新失败，回滚状态并提示
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
				confirmColor: '#e64340', // 红色警示
				success: (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '正在重置...' });
						// 批量更新当前任务单下的所有子任务
						db.collection('a-task-queue')
							.where({
								task_id: this.taskId
							})
							.update({
								status: 'pending', // 重置状态
								error_msg: '' // 清空错误信息
							})
							.then((res) => {
								uni.showToast({ title: '已全部重置', icon: 'success' });
								this.refresh(); // 刷新列表显示
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
		refresh() {
			this.$refs.udb.loadData({
				clear: true
			});
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

		// --- 编辑逻辑 ---

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

				// 兼容不同平台的返回值
				if (type === 'file') {
					filePath = res.tempFilePaths[0];
					if (res.tempFiles && res.tempFiles[0]) {
						fileName = res.tempFiles[0].name || '';
					}
				} else if (type === 'video') {
					filePath = res.tempFilePath;
					// 视频对象通常没有直接的 name 属性，需要自己构造或从 path 提取
				} else {
					filePath = res.tempFilePaths[0];
					if (res.tempFiles && res.tempFiles[0]) {
						// H5端 tempFiles 包含 File 对象，有 name 属性
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
					// 优先从真实文件名获取后缀
					ext = fileName.split('.').pop();
				} else {
					// 兜底：如果没名字，尝试从路径获取（但在H5 blob url下无效），或使用默认后缀
					// blob url 不包含后缀，所以这里必须要有默认值
					if (type === 'image') ext = 'jpg';
					else if (type === 'video') ext = 'mp4';
					else ext = 'bin';
				}

				// 确保后缀名合法
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

			// API 调用
			if (type === 'video') {
				uni.chooseVideo({ sourceType: ['album', 'camera'], success: successCallback });
			} else if (type === 'file') {
				// #ifdef H5
				uni.chooseFile({ count: 1, success: successCallback });
				// #endif
				// #ifndef H5
				uni.chooseImage({ count: 1, success: successCallback }); // 非H5暂用选图替代
				// #endif
			} else {
				uni.chooseImage({ count: 1, sourceType: ['album', 'camera'], success: successCallback });
			}
		},

		// 打开新建弹窗
		openCreateModal() {
			this.editingId = null; // 置空表示新建模式
			this.tempPayload = [{ type: 'text', data: '' }];
			// 默认时间设为当前时间往后推5分钟，方便直接保存
			const now = new Date();
			now.setMinutes(now.getMinutes() + 5);
			// 简单的格式化 YYYY-MM-DD HH:mm:ss
			const pad = (n) => (n < 10 ? '0' + n : n);
			this.tempSendTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
			this.showEditModal = true;
		},

		// 删除任务
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
			// 基础校验
			if (!this.tempSendTime) {
				return uni.showToast({ title: '请选择发送时间', icon: 'none' });
			}
			if (this.tempPayload.length === 0) {
				return uni.showToast({ title: '请至少添加一条内容', icon: 'none' });
			}

			uni.showLoading({ title: '保存中...' });

			// 1. 编辑
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
			}
			// 2. 新建
			else {
				// 尝试从列表中获取默认的 group_name 和 account_name (保持上下文一致)
				let defaultGroup = this.orderId; // 默认用订单号当群名
				let defaultAccount = '';

				if (this.rawList && this.rawList.length > 0) {
					// 如果列表里有数据，直接抄第一条的配置
					const sample = this.rawList[0];
					if (sample.group_name) defaultGroup = sample.group_name;
					if (sample.account_name) defaultAccount = sample.account_name;
				}

				db.collection('a-task-queue')
					.add({
						task_id: this.taskId, // 关联 ID
						group_name: defaultGroup, // 目标群名
						account_name: defaultAccount, // 执行账号
						task_name: '手动新建消息', // 固定名称
						payload: this.tempPayload, // 内容
						send_time: this.tempSendTime, // 时间
						status: 'manual_stop', // 默认状态
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
</style>
