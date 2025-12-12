<template>
	<view class="px-5 py-3">
		<view class="uni-header">
			<view class="uni-group">
				<button type="default" size="mini" @click="goBack">返回</button>
				<view class="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center ml-5">
					<i class="fas fa-paper-plane text-white text-xs"></i>
				</view>
				<view class="uni-title ml-2">行中推荐任务管理</view>
			</view>
			<view class="uni-group">
				<button class="uni-button" type="default" size="mini" @click="refreshData">
					<uni-icons type="refreshempty" size="14"></uni-icons>
					刷新
				</button>
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="搜索订单号" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
				<button class="uni-button" type="primary" size="mini" @click="navigateTo('./add')">新建任务</button>
			</view>
		</view>

		<!-- collection="a-task-orders,a-task-groups"
		field="order_id,account_name,crawl_status,snapshot_status,ai_status,created_at,target_group_id{name}" -->

		<view class="uni-container">
			<unicloud-db
				ref="udb"
				collection="a-task-orders"
				field="order_id,account_name,crawl_status,snapshot_status,ai_status,created_at"
				:where="where"
				page-data="replace"
				orderby="created_at desc"
				:getcount="true"
				:page-size="20"
				v-slot:default="{ data, pagination, loading, error, options }">
				<uni-table :loading="loading" :emptyText="error.message || '暂无任务数据'" border stripe>
					<uni-tr>
						<uni-th align="center">订单号</uni-th>
						<uni-th align="center">执行账号</uni-th>
						<uni-th align="center" width="120">1. 抓取状态</uni-th>
						<uni-th align="center" width="120">2. 快照同步</uni-th>
						<uni-th align="center" width="120">3. AI处理</uni-th>
						<uni-th align="center">创建时间</uni-th>
						<uni-th align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item, index) in data" :key="index">
						<uni-td align="center">{{ item.order_id }}</uni-td>
						<uni-td align="center">
							<text v-if="item.account_name" class="font-bold text-blue-600">{{ item.account_name }}</text>
							<text v-else class="text-gray-400">-</text>
						</uni-td>
						<uni-td align="center">
							<view class="flex gap-2">
								<view :class="getStatusClass(item.crawl_status)">{{ getStatusText(item.crawl_status) }}</view>
								<view
									v-if="item.crawl_status !== 'processing' && item.crawl_status !== 'pending'"
									class="mini-icon-btn"
									:class="item.ai_status === 'failed' ? 'btn-red' : 'btn-blue'"
									@click.stop="retryCrawl(item)">
									<uni-icons
										style="font-weight: bold"
										:type="item.crawl_status === 'failed' ? 'refresh-filled' : 'refreshempty'"
										size="16"
										:color="item.crawl_status === 'failed' ? '#dc2626' : '#2563eb'"></uni-icons>
								</view>
							</view>
						</uni-td>

						<uni-td align="center">
							<view class="flex gap-2">
								<view :class="getStatusClass(item.snapshot_status)">{{ getStatusText(item.snapshot_status || 'pending') }}</view>
								<view
									v-if="item.crawl_status === 'done' && item.snapshot_status !== 'syncing'"
									class="mini-icon-btn"
									:class="item.ai_status === 'failed' ? 'btn-red' : 'btn-blue'"
									@click.stop="retrySnapshot(item)">
									<uni-icons
										style="font-weight: bold"
										:type="item.snapshot_status === 'failed' ? 'refresh-filled' : 'refreshempty'"
										size="16"
										:color="item.snapshot_status === 'failed' ? '#dc2626' : '#2563eb'"></uni-icons>
								</view>
							</view>
						</uni-td>

						<uni-td align="center">
							<view class="flex gap-2">
								<view :class="getStatusClass(item.ai_status)">{{ getStatusText(item.ai_status) }}</view>
								<view v-if="item.snapshot_status === 'done'" class="mini-icon-btn" :class="item.ai_status === 'failed' ? 'btn-red' : 'btn-blue'" @click.stop="retryAI(item)">
									<uni-icons
										style="font-weight: bold"
										:type="item.ai_status === 'failed' ? 'refresh-filled' : 'refreshempty'"
										size="16"
										:color="item.ai_status === 'failed' ? '#dc2626' : '#2563eb'"></uni-icons>
								</view>
							</view>
						</uni-td>
						<uni-td align="center">
							<uni-dateformat :date="item.created_at" format="yyyy-MM-dd hh:mm"></uni-dateformat>
						</uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button class="uni-button" size="mini" type="primary" @click="navigateTo('./queue?id=' + item._id + '&order=' + item.order_id)">查看消息队列</button>
								<button class="uni-button" size="mini" type="warn" @click="confirmDelete(item._id)">删除</button>
							</view>
						</uni-td>
					</uni-tr>
				</uni-table>
				<view class="uni-pagination-box">
					<uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current" :total="pagination.count" @change="onPageChanged" />
				</view>
			</unicloud-db>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();

export default {
	data() {
		return {
			query: '',
			where: ''
		};
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},
		refreshData() {
			this.$refs.udb.loadData();
			uni.showToast({ title: '已刷新', icon: 'none' });
		},
		search() {
			this.where = this.query ? `/.*${this.query}.*/.test(order_id)` : '';
			this.$nextTick(() => this.$refs.udb.loadData());
		},
		onPageChanged(e) {
			this.$refs.udb.loadData({ current: e.current });
		},
		navigateTo(url) {
			uni.navigateTo({ url, events: { refreshData: () => this.$refs.udb.loadData() } });
		},
		confirmDelete(id) {
			uni.showModal({
				title: '确认删除',
				content: '删除此订单将一并清空其生成的发送队列，确定继续吗？',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '删除中...' });
						try {
							// 1. 先删子表 (队列)
							await db
								.collection('a-task-queue')
								.where({
									task_id: id // 这里的 task_id 对应 orders 表的 _id
								})
								.remove();

							// 2. 再删主表 (订单)
							await db.collection('a-task-orders').doc(id).remove();

							uni.showToast({ title: '删除成功' });
							this.refreshData(); // 刷新列表
						} catch (e) {
							uni.showModal({
								content: '删除失败: ' + e.message,
								showCancel: false
							});
						} finally {
							uni.hideLoading();
						}
					}
				}
			});
		},
		// 重置状态，让 Python 脚本重新认领任务
		retryCrawl(item) {
			uni.showModal({
				title: '确认重抓',
				content: '⚠️ 警告：重新抓取将清空该订单现有的【快照数据】和【AI生成队列】，这可能导致已编辑的内容丢失。确定继续吗？',
				confirmColor: '#dc2626', // 确认按钮标红，警示用户
				success: (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '重置中...' });
						db.collection('a-task-orders')
							.doc(item._id)
							.update({
								crawl_status: 'pending',
								snapshot_status: 'pending',
								ai_status: 'pending',
								raw_data: [],
								error_msg: ''
							})
							.then(() => {
								uni.showToast({ title: '已重置，等待抓取', icon: 'success' });
								this.refreshData();
							})
							.catch((err) => {
								uni.showModal({ content: err.message, showCancel: false });
							})
							.finally(() => {
								uni.hideLoading();
							});
					}
				}
			});
		},

		// 重试快照
		async retrySnapshot(item) {
			uni.showModal({
				title: '确认同步',
				content: '确定要重新从携程同步行程快照吗？这将覆盖当前的行程基础数据。',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '正在同步...' });
						try {
							const rpa = uniCloud.importObject('a-task-rpa');
							const res = await rpa.retrySnapshot(item._id);
							if (res.errCode === 0) {
								uni.showToast({ title: '同步成功', icon: 'success' });
								// 同步成功后，询问是否接着生成 AI
								uni.showModal({
									title: '同步完成',
									content: '快照已更新，是否立即重新生成 AI 消息队列？',
									success: (aiRes) => {
										if (aiRes.confirm) {
											this.retryAI(item);
										}
									}
								});
							} else {
								uni.showModal({ content: res.errMsg || '同步失败', showCancel: false });
							}
							this.refreshData();
						} catch (e) {
							uni.showModal({ content: '请求异常: ' + e.message, showCancel: false });
						} finally {
							uni.hideLoading();
						}
					}
				}
			});
		},

		// 重试AI处理
		async retryAI(item) {
			uni.showModal({
				title: '确认生成',
				content: '确定要让 AI 重新生成消息队列吗？\n这将覆盖当前已生成的待发送队列（已发送的消息不会受影响）。',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading({ title: 'AI 生成中...' });
						try {
							const rpa = uniCloud.importObject('a-task-rpa');
							const res = await rpa.generateQueue(item._id);
							if (res.errCode === 0) {
								uni.showToast({ title: '生成成功', icon: 'success' });
								this.refreshData();
							} else {
								uni.showModal({ content: res.errMsg, showCancel: false });
							}
						} catch (e) {
							uni.showModal({ content: '请求失败: ' + e.message, showCancel: false });
						} finally {
							uni.hideLoading();
						}
					}
				}
			});
		},

		// 更新状态文本映射
		getStatusText(status) {
			const map = {
				pending: '⏳ 等待',
				processing: '🔄 进行中',
				syncing: '🔄 同步中',
				done: '✅ 完成',
				failed: '❌ 失败',
				skipped: '⏭️ 跳过'
			};
			return map[status] || status;
		},

		getStatusClass(status) {
			const map = { pending: 'text-gray-500', processing: 'text-blue-600', done: 'text-green-600', failed: 'text-red-600' };
			return map[status] || '';
		}
	}
};
</script>

<style>
.text-gray-500 {
	color: #6b7280;
}
.text-blue-600 {
	color: #2563eb;
}
.text-green-600 {
	color: #16a34a;
}
.text-red-600 {
	color: #dc2626;
}

.mini-icon-btn {
	/* 弹性布局实现图标绝对居中 */
	display: flex;
	align-items: center;
	justify-content: center;

	/* 尺寸控制 */
	width: 22px;
	height: 22px;

	/* 边框和圆角 */
	border: 1px solid;
	border-radius: 4px;
	background-color: transparent;

	/* 鼠标手势 */
	cursor: pointer;
	transition: all 0.2s;
}

/* 蓝色状态（正常/进行中） */
.btn-blue {
	border-color: #2563eb;
}
/* 点击反馈 */
.btn-blue:active {
	background-color: rgba(37, 99, 235, 0.1);
}

/* 红色状态（失败） */
.btn-red {
	border-color: #dc2626;
}
/* 点击反馈 */
.btn-red:active {
	background-color: rgba(220, 38, 38, 0.1);
}
</style>
