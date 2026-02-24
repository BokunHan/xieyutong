<template>
	<view class="px-5 py-3 page-container">
		<view class="uni-header sticky-top">
			<view class="uni-group">
				<button type="default" size="mini" @click="goBack">返回</button>
				<view class="uni-title ml-2">全局队列管理</view>
			</view>

			<view class="uni-group wrap-group">
				<view style="width: 150px; margin-right: 10px">
					<uni-data-select v-model="filterAgentId" :localdata="attendantOptions" placeholder="筛选管家" @change="onFilterChange" :clear="true"></uni-data-select>
				</view>

				<button class="uni-button" size="mini" type="default" plain @click="setQuickDate('today')">今日</button>
				<button class="uni-button" size="mini" type="default" plain @click="setQuickDate('tomorrow')" style="margin-right: 10px">明日</button>
				<view style="width: 240px; margin-right: 10px">
					<uni-datetime-picker type="datetimerange" v-model="filterDateRange" return-type="string" @change="onFilterChange" placeholder="发送时间范围" />
				</view>

				<view style="width: 260px">
					<input
						class="uni-input border rounded px-2 bg-white text-sm"
						style="height: 35px; box-sizing: border-box"
						v-model="searchTaskName"
						placeholder="搜索任务名称"
						@confirm="refreshData" />
				</view>
				<button class="uni-button" type="primary" size="mini" @click="refreshData">查询</button>
			</view>
		</view>

		<view class="uni-container mt-4">
			<unicloud-db
				ref="udb"
				collection="a-task-queue"
				:where="where"
				orderby="send_time asc"
				:page-size="30"
				:getcount="true"
				page-data="replace"
				v-slot:default="{ data, loading, error, pagination }">
				<view v-if="loading" class="p-5 text-center text-gray-500">加载中...</view>
				<view v-else-if="error" class="p-5 text-center text-red-500">{{ error.message }}</view>
				<view v-else-if="!data.length" class="p-10 text-center text-gray-400">当前筛选条件下暂无任务</view>

				<view v-else class="grid grid-cols-1 gap-4">
					<view
						v-for="item in data"
						:key="item._id"
						class="bg-white border rounded-lg p-4 shadow-sm relative transition-all"
						:class="[item.status === 'manual_stop' ? 'opacity-60' : '']">
						<view class="absolute top-4 right-4 flex items-center z-10">
							<text class="text-xs mr-2" :class="item.status === 'pending' ? 'text-blue-600 font-bold' : 'text-gray-400'">
								{{ item.status === 'pending' ? '已启用' : '未启用' }}
							</text>
							<switch :checked="item.status === 'pending'" style="transform: scale(0.7)" color="#2563EB" @change="(e) => toggleTaskStatus(item, e)" />
						</view>

						<view class="mb-3 border-b pb-2 pr-20">
							<view class="flex items-center mb-2">
								<view class="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded cursor-pointer hover:bg-blue-100" @click="jumpToQueue(item)">
									订单: {{ item.group_name || '未知' }} (点击查看队列)
								</view>
								<view class="ml-2 text-xs text-gray-500">管家: {{ getAgentName(item.agent_id) }}</view>
							</view>

							<view class="text-base font-bold text-gray-800 mb-1">📌 {{ item.task_name || '未命名任务' }}</view>

							<view v-if="item.error_msg" class="text-xs text-red-600 bg-red-50 p-1 rounded mt-1 border border-red-200">❌ {{ item.error_msg }}</view>

							<view class="text-sm text-gray-600 mt-1">
								📅 计划发送:
								<text class="font-medium text-blue-600">{{ item.send_time || '待定' }}</text>
							</view>
						</view>

						<view class="bg-gray-50 p-3 rounded mb-3">
							<view v-for="(msg, idx) in item.payload" :key="idx" class="mb-3 last:mb-0">
								<view v-if="msg.type === 'text'" class="text-gray-800 text-sm whitespace-pre-wrap">{{ msg.data }}</view>
								<view v-else-if="msg.type === 'image'" class="mt-2">
									<image :src="msg.data" mode="aspectFill" class="rounded border bg-gray-200" style="width: 80px; height: 80px" @click.stop="previewImage(msg.data)"></image>
								</view>
								<view v-else class="text-blue-600 text-xs mt-1">[{{ msg.type }}] 文件</view>
							</view>
						</view>

						<view class="flex justify-end gap-2">
							<button size="mini" type="warn" plain @click="deleteTask(item._id)">删除</button>
							<button v-if="item.status === 'sent' || item.status === 'failed'" size="mini" type="primary" plain @click="confirmResend(item._id)">重发</button>
							<button size="mini" @click="openEditModal(item)">编辑</button>
						</view>
					</view>
				</view>

				<view class="uni-pagination-box mt-4">
					<uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current" :total="pagination.count" @change="onPageChanged" />
				</view>
			</unicloud-db>
		</view>

		<view v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" style="background-color: rgba(0, 0, 0, 0.5)">
			<view class="bg-white rounded-lg w-11/12 md:w-1/2 p-5 shadow-lg max-h-90vh flex flex-col">
				<view class="text-lg font-bold mb-4 border-b pb-2">编辑消息</view>
				<view class="mb-4 bg-gray-50 p-2 rounded">
					<view class="text-xs text-gray-500 mb-1 font-bold">计划发送时间:</view>
					<uni-datetime-picker type="datetime" v-model="tempSendTime" return-type="string" />
				</view>
				<scroll-view scroll-y class="flex-1 border rounded p-2 mb-2" style="max-height: 40vh">
					<view v-for="(msg, index) in tempPayload" :key="index" class="mb-4 border-b pb-4">
						<view class="text-xs text-gray-500 mb-2">第 {{ index + 1 }} 条 ({{ msg.type }})</view>
						<view v-if="msg.type === 'text'">
							<textarea v-model="msg.data" class="w-full border p-2 rounded text-sm bg-gray-50 h-24" maxlength="-1"></textarea>
						</view>
						<view v-else>
							<view class="text-xs text-gray-400">非文本类型请去原队列编辑或重新上传</view>
						</view>
					</view>
				</scroll-view>
				<view class="flex justify-end gap-3 mt-2">
					<button size="mini" @click="closeEditModal">取消</button>
					<button size="mini" type="primary" @click="saveEdit">保存</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const dbCmd = db.command;

export default {
	data() {
		return {
			searchTaskName: '',
			filterAgentId: '',
			filterDateRange: [], // ['YYYY-MM-DD HH:mm:ss', '...']
			attendantOptions: [],
			attendantMap: {}, // id -> nickname 映射
			where: '',

			// 编辑相关
			showEditModal: false,
			editingId: null,
			tempPayload: [],
			tempSendTime: ''
		};
	},
	onLoad() {
		this.loadAttendants();
		// 默认查询今天
		this.setQuickDate('today');
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},
		async loadAttendants() {
			try {
				const res = await db.collection('uni-id-users').where({ role: 'attendant' }).field('_id, nickname, username').get();

				// 1. 先映射真实管家列表
				const realAgents = res.result.data.map((u) => ({
					value: u._id,
					text: u.nickname || u.username
				}));

				// 2. 在头部插入“未分配”选项
				this.attendantOptions = [{ value: 'unassigned', text: '未分配' }, ...realAgents];

				// 建立映射方便显示
				res.result.data.forEach((u) => {
					this.attendantMap[u._id] = u.nickname || u.username;
				});
			} catch (e) {
				console.error(e);
			}
		},
		getAgentName(id) {
			return this.attendantMap[id] || id || '未分配';
		},
		setQuickDate(type) {
			const now = new Date();
			const y = now.getFullYear();
			const m = now.getMonth();
			const d = now.getDate();

			let start, end;

			if (type === 'today') {
				start = new Date(y, m, d, 0, 0, 0);
				end = new Date(y, m, d, 23, 59, 59);
			} else if (type === 'tomorrow') {
				start = new Date(y, m, d + 1, 0, 0, 0);
				end = new Date(y, m, d + 1, 23, 59, 59);
			}

			this.filterDateRange = [this.formatDate(start), this.formatDate(end)];
			this.refreshData();
		},
		formatDate(d) {
			const pad = (n) => (n < 10 ? '0' + n : n);
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
		},
		onFilterChange() {
			this.$nextTick(() => {
				this.refreshData();
			});
		},
		refreshData() {
			const whereParts = [];

			// 1. 管家筛选逻辑修改
			if (this.filterAgentId === 'unassigned') {
				// 筛选未分配：agent_id 为 null 或 空字符串
				whereParts.push(dbCmd.or([{ agent_id: null }, { agent_id: '' }]));
			} else if (this.filterAgentId) {
				// 筛选指定管家
				whereParts.push({ agent_id: this.filterAgentId });
			}

			// 2. 时间筛选 (send_time 是字符串，可以直接比较)
			if (this.filterDateRange && this.filterDateRange.length === 2) {
				whereParts.push({
					send_time: dbCmd.gte(this.filterDateRange[0]).and(dbCmd.lte(this.filterDateRange[1]))
				});
			}

			if (this.searchTaskName) {
				// 使用正则进行模糊搜索，'i' 表示忽略大小写
				whereParts.push({
					task_name: new RegExp(this.searchTaskName, 'i')
				});
			}

			// 组合
			if (whereParts.length === 0) {
				this.where = '';
			} else if (whereParts.length === 1) {
				this.where = whereParts[0];
			} else {
				this.where = dbCmd.and(whereParts);
			}

			this.$nextTick(() => {
				this.$refs.udb.loadData({ current: 1 });
			});
		},
		onPageChanged(e) {
			this.$refs.udb.loadData({ current: e.current });
		},

		// --- 操作逻辑 (复用 queue.vue) ---

		// 跳转到对应的订单队列
		jumpToQueue(item) {
			if (!item.task_id) return uni.showToast({ title: '数据缺失，无法跳转', icon: 'none' });
			// highlight 参数可以让 queue 页面自动滚动到这条消息
			uni.navigateTo({
				url: `/pages/a-task-orders/queue?id=${item.task_id}&order=${item.group_name}&highlight=${item._id}`
			});
		},

		toggleTaskStatus(item, e) {
			const newStatus = e.detail.value ? 'pending' : 'manual_stop';
			// 乐观更新
			item.status = newStatus;
			db.collection('a-task-queue')
				.doc(item._id)
				.update({ status: newStatus })
				.catch(() => {
					uni.showToast({ title: '操作失败', icon: 'none' });
					item.status = newStatus === 'pending' ? 'manual_stop' : 'pending'; // 回滚
				});
		},

		deleteTask(id) {
			uni.showModal({
				title: '确认删除',
				content: '确定删除此任务？',
				success: (res) => {
					if (res.confirm) {
						uni.showLoading();
						db.collection('a-task-queue')
							.doc(id)
							.remove()
							.then(() => {
								uni.showToast({ title: '删除成功' });
								this.$refs.udb.loadData();
							})
							.finally(() => uni.hideLoading());
					}
				}
			});
		},

		confirmResend(id) {
			uni.showModal({
				title: '确认重发',
				content: '确定将此任务状态重置为“待发送”？',
				success: (res) => {
					if (res.confirm) {
						uni.showLoading();
						db.collection('a-task-queue')
							.doc(id)
							.update({ status: 'pending', error_msg: '' })
							.then(() => {
								uni.showToast({ title: '已重置' });
								this.$refs.udb.loadData();
							})
							.finally(() => uni.hideLoading());
					}
				}
			});
		},

		previewImage(url) {
			uni.previewImage({ urls: [url] });
		},

		// 编辑相关
		openEditModal(item) {
			this.editingId = item._id;
			this.tempPayload = JSON.parse(JSON.stringify(item.payload));
			this.tempSendTime = item.send_time;
			this.showEditModal = true;
		},
		closeEditModal() {
			this.showEditModal = false;
			this.editingId = null;
		},
		saveEdit() {
			if (!this.tempSendTime) return uni.showToast({ title: '时间不能为空', icon: 'none' });
			uni.showLoading();
			db.collection('a-task-queue')
				.doc(this.editingId)
				.update({
					payload: this.tempPayload,
					send_time: this.tempSendTime
				})
				.then(() => {
					uni.showToast({ title: '保存成功' });
					this.closeEditModal();
					this.$refs.udb.loadData();
				})
				.finally(() => uni.hideLoading());
		}
	}
};
</script>

<style scoped>
.page-container {
	min-height: 100vh;
	background-color: #f8fafc;
}
.sticky-top {
	position: sticky;
	top: 0;
	z-index: 100;
	background-color: #f8fafc;
	padding-bottom: 10px;
	border-bottom: 1px solid #e5e7eb;
}
.wrap-group {
	flex-wrap: wrap;
	gap: 8px;
	margin-top: 10px;
}
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
</style>
