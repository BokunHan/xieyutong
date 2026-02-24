<template>
	<view class="px-5 py-3">
		<view class="uni-header">
			<view class="uni-group">
				<button type="default" size="mini" @click="goBack">返回</button>
				<view class="uni-title ml-2">定时批量任务管理</view>
			</view>
			<view class="uni-group">
				<button class="uni-button" type="default" size="mini" @click="refreshData">刷新</button>
				<button class="uni-button" type="primary" size="mini" @click="openCreateModal">+ 新建批量任务</button>
			</view>
		</view>

		<view class="bg-blue-50 text-blue-600 p-3 rounded mb-3 text-sm">
			<uni-icons type="info-filled" color="#2563eb" size="14"></uni-icons>
			<text class="ml-1 font-bold">机制说明：</text>
			在此处创建的任务，会自动注入到
			<text class="font-bold">之前的所有</text>
			订单队列以及
			<text class="font-bold">从此刻起新生成的</text>
			每一个订单队列中（只要该订单生成时间早于任务发送时间）。
		</view>

		<view class="uni-container">
			<unicloud-db ref="udb" collection="a-task-batch" orderby="send_time asc" page-data="replace" v-slot:default="{ data, loading, error }">
				<uni-table :loading="loading" :emptyText="error.message || '暂无全局计划'" border stripe>
					<uni-tr>
						<uni-th align="center" width="180">计划发送时间</uni-th>
						<uni-th align="center">任务名称</uni-th>
						<!-- <uni-th align="center">适用管家</uni-th> -->
						<uni-th align="center">内容预览</uni-th>
						<!-- <uni-th align="center" width="100">状态</uni-th> -->
						<uni-th align="center" width="150">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item, index) in data" :key="index">
						<uni-td align="center">
							<view class="font-bold text-gray-700">{{ item.send_time }}</view>
							<view v-if="isExpired(item.send_time)" class="text-xs text-red-400">(已过期)</view>
							<view v-else class="text-xs text-green-600">(等待执行)</view>
						</uni-td>
						<uni-td align="center">{{ item.task_name }}</uni-td>
						<!-- <uni-td align="center">
							<text v-if="!item.filter_agent_id" class="text-gray-400">全部管家</text>
							<text v-else class="text-blue-600 font-bold">指定ID: {{ item.filter_agent_id.substring(0, 6) }}...</text>
						</uni-td> -->
						<uni-td>
							<view class="text-xs text-gray-500 truncate max-w-xs">
								{{ getPayloadSummary(item.payload) }}
							</view>
						</uni-td>
						<!-- <uni-td align="center">
							<uni-tag :text="item.status === 'active' ? '启用' : '停用'" :type="item.status === 'active' ? 'success' : 'default'" size="small" />
						</uni-td> -->
						<uni-td align="center">
							<button class="uni-button" size="mini" type="warn" plain @click="deleteTask(item._id)">删除</button>
						</uni-td>
					</uni-tr>
				</uni-table>
			</unicloud-db>
		</view>

		<view
			v-if="showModal"
			class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
			style="background-color: rgba(0, 0, 0, 0.5); position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 999">
			<view class="bg-white rounded-lg w-11/12 md:w-1/2 p-5 shadow-lg max-h-90vh flex flex-col" style="max-height: 90vh">
				<view class="text-lg font-bold mb-4 border-b pb-2">新建批量任务</view>

				<view class="mb-4 bg-gray-50 p-2 rounded">
					<view class="text-xs text-gray-500 mb-1 font-bold">📌 任务名称:</view>
					<input class="uni-input border rounded px-2 bg-white text-sm" v-model="form.task_name" placeholder="例如：春节统一祝福" />
				</view>

				<view class="mb-4 bg-gray-50 p-2 rounded">
					<view class="text-xs text-gray-500 mb-1 font-bold">📅 计划发送时间:</view>
					<uni-datetime-picker type="datetime" v-model="form.send_time" return-type="string" />
				</view>

				<!-- <view class="mb-4 bg-gray-50 p-2 rounded flex items-center gap-2">
					<view class="text-xs text-gray-500 font-bold">👤 指定管家ID (选填):</view>
					<input class="uni-input border rounded px-2 py-1 bg-white text-sm flex-1" v-model="form.filter_agent_id" placeholder="留空则对所有管家生效" />
				</view> -->

				<scroll-view scroll-y class="flex-1 border rounded p-2 mb-2" style="height: 250px">
					<view v-for="(msg, index) in form.payload" :key="index" class="mb-4 border-b pb-4 last:border-0 relative">
						<view class="absolute right-0 top-0 z-10" style="position: absolute; right: 0; top: 0">
							<button size="mini" type="warn" plain style="font-size: 10px; height: 20px; line-height: 20px" @click="removePayload(index)">删除</button>
						</view>
						<view class="text-xs text-gray-500 mb-2 font-bold">第 {{ index + 1 }} 条 ({{ getTypeLabel(msg.type) }})</view>

						<view v-if="msg.type === 'text'">
							<textarea
								v-model="msg.data"
								class="w-full border p-2 rounded text-sm bg-gray-50 h-24"
								style="width: 100%; box-sizing: border-box"
								maxlength="-1"
								placeholder="内容..."></textarea>
						</view>
						<view v-else-if="msg.type === 'image'">
							<image :src="msg.data" mode="aspectFill" class="w-20 h-20 rounded bg-gray-200 border" style="width: 80px; height: 80px" @click="previewImage(msg.data)"></image>
							<button size="mini" class="mt-2" @click="replaceImage(index)">更换图片</button>
						</view>
					</view>
					<view v-if="form.payload.length === 0" class="text-center text-gray-400 py-4">暂无内容</view>
				</scroll-view>

				<view class="flex gap-2 mb-4 justify-center">
					<button size="mini" type="default" @click="addPayload('text')">+ 文本</button>
					<button size="mini" type="default" @click="addPayload('image')">+ 图片</button>
				</view>

				<view class="flex justify-end gap-3 mt-2 pt-3 border-t">
					<button size="mini" type="default" @click="closeModal">取消</button>
					<button size="mini" type="primary" @click="saveTask">保存生效</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const rpa = uniCloud.importObject('a-task-rpa');

export default {
	data() {
		return {
			showModal: false,
			form: {
				task_name: '',
				send_time: '',
				filter_agent_id: '',
				payload: [],
				status: 'active'
			}
		};
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},
		refreshData() {
			this.$refs.udb.loadData();
		},
		isExpired(timeStr) {
			return new Date(timeStr).getTime() < Date.now();
		},
		getPayloadSummary(payload) {
			if (!payload || payload.length === 0) return '空';
			const first = payload[0];
			if (first.type === 'image') return '[图片]';
			return first.data.substring(0, 20) + (first.data.length > 20 ? '...' : '');
		},
		getTypeLabel(type) {
			return type === 'text' ? '文本' : '图片';
		},
		openCreateModal() {
			this.form = {
				task_name: '全局通知 ' + this.formatDate(new Date()),
				send_time: '',
				filter_agent_id: '',
				payload: [{ type: 'text', data: '' }],
				status: 'active'
			};
			// 默认明天上午9点
			const tmr = new Date();
			tmr.setDate(tmr.getDate() + 1);
			tmr.setHours(9, 0, 0, 0);
			this.form.send_time = this.formatFullDate(tmr);
			this.showModal = true;
		},
		closeModal() {
			this.showModal = false;
		},
		formatDate(d) {
			return `${d.getMonth() + 1}.${d.getDate()}`;
		},
		formatFullDate(d) {
			const pad = (n) => (n < 10 ? '0' + n : n);
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
		},
		addPayload(type) {
			if (type === 'text') {
				this.form.payload.push({ type: 'text', data: '' });
			} else {
				this.handleUpload((url) => {
					this.form.payload.push({ type: 'image', data: url });
				});
			}
		},
		removePayload(index) {
			this.form.payload.splice(index, 1);
		},
		replaceImage(index) {
			this.handleUpload((url) => {
				this.form.payload[index].data = url;
			});
		},
		previewImage(url) {
			uni.previewImage({ urls: [url] });
		},
		handleUpload(callback) {
			uni.chooseImage({
				count: 1,
				success: (res) => {
					const filePath = res.tempFilePaths[0];
					uni.showLoading({ title: '上传中...' });
					uniCloud.uploadFile({
						filePath: filePath,
						cloudPath: `batch_global_${Date.now()}.jpg`,
						success: (uploadRes) => {
							callback(uploadRes.fileID);
							uni.hideLoading();
						},
						fail: () => {
							uni.hideLoading();
							uni.showToast({ title: '上传失败', icon: 'none' });
						}
					});
				}
			});
		},
		async deleteTask(id) {
			uni.showModal({
				title: '确认删除',
				content: '删除此全局任务，是否同时撤回(删除)已下发到各订单队列中尚未发送的任务？',
				confirmText: '全部删除',
				cancelText: '取消',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '删除中...' });
						try {
							// 调用云对象进行级联删除
							const result = await rpa.deleteGlobalTask(id);
							if (result.errCode === 0) {
								uni.showToast({ title: '删除成功', icon: 'success' });
								this.refreshData();
							} else {
								throw new Error(result.errMsg);
							}
						} catch (e) {
							uni.showModal({ content: '删除失败: ' + e.message, showCancel: false });
						} finally {
							uni.hideLoading();
						}
					}
				}
			});
		},
		async saveTask() {
			if (!this.form.send_time) return uni.showToast({ title: '请选择时间', icon: 'none' });
			if (this.form.payload.length === 0) return uni.showToast({ title: '内容不能为空', icon: 'none' });

			// 简单的格式清洗
			this.form.filter_agent_id = this.form.filter_agent_id ? this.form.filter_agent_id.trim() : '';

			uni.showLoading({ title: '处理中...' });
			try {
				// 1. 先保存到全局表 (给未来新生成的订单用)
				const addRes = await db.collection('a-task-batch').add({
					...this.form,
					created_at: Date.now()
				});

				const newBatchId = addRes.result.id;

				// 2. 调用云对象，分发给现有订单
				uni.showLoading({ title: '正在分发给现有订单...' });

				const taskPayload = {
					...this.form,
					_id: newBatchId // 传入 ID
				};

				const res = await rpa.applyBatchTaskToExistingOrders(taskPayload);

				if (res.errCode === 0) {
					uni.showModal({
						title: '创建成功',
						content: `全局任务已保存。\n\n${res.msg}。\n\n注意：为了安全，新插入的任务默认状态为【暂停】，请通知管家开启或检查。`,
						showCancel: false,
						success: () => {
							this.closeModal();
							this.refreshData();
						}
					});
				} else {
					throw new Error(res.errMsg);
				}
			} catch (e) {
				uni.showModal({
					title: '部分失败',
					content: '保存或分发过程中出错: ' + e.message,
					showCancel: false
				});
			} finally {
				uni.hideLoading();
			}
		}
	}
};
</script>

<style scoped>
/* 使用简单的 Tailwind 风格 */
.text-blue-600 {
	color: #2563eb;
}
.bg-blue-50 {
	background-color: #eff6ff;
}
.truncate {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.max-w-xs {
	max-width: 200px;
}
</style>
