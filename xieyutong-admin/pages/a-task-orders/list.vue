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
						<uni-th align="center" width="100">1. 抓取状态</uni-th>
						<uni-th align="center" width="100">2. 快照同步</uni-th>
						<uni-th align="center" width="100">3. AI处理</uni-th>
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
							<view :class="getStatusClass(item.crawl_status)">{{ getStatusText(item.crawl_status) }}</view>
							<button v-if="item.crawl_status === 'failed'" class="uni-button mt-1" size="mini" type="warn" plain style="padding: 0 5px; font-size: 10px" @click="retryCrawl(item)">
								重试抓取
							</button>
						</uni-td>

						<uni-td align="center">
							<view :class="getStatusClass(item.snapshot_status)">{{ getStatusText(item.snapshot_status || 'pending') }}</view>
							<button
								v-if="item.snapshot_status === 'failed' && item.crawl_status === 'done'"
								class="uni-button mt-1"
								size="mini"
								type="warn"
								plain
								style="padding: 0 5px; font-size: 10px"
								@click="retrySnapshot(item)">
								重试同步
							</button>
						</uni-td>

						<uni-td align="center">
							<view :class="getStatusClass(item.ai_status)">{{ getStatusText(item.ai_status) }}</view>
							<button
								v-if="item.ai_status === 'failed' && item.snapshot_status === 'done'"
								class="uni-button mt-1"
								size="mini"
								type="warn"
								plain
								style="padding: 0 5px; font-size: 10px"
								@click="retryAI(item)">
								重试处理
							</button>
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
			uni.showLoading({ title: '重置中...' });
			db.collection('a-task-orders')
				.doc(item._id)
				.update({
					crawl_status: 'pending', // 变回 pending，Python 就会再次抓取
					ai_status: 'pending', // AI 也重置
					raw_data: [], // 清空旧数据
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
		},

		// 重试快照
		async retrySnapshot(item) {
			uni.showLoading({ title: '正在同步快照...' });
			try {
				const rpa = uniCloud.importObject('a-task-rpa');
				const res = await rpa.retrySnapshot(item._id);
				if (res.errCode === 0) {
					uni.showToast({ title: '同步成功', icon: 'success' });
					// 同步成功后，自动触发一下 AI (可选，看你需求)
					this.retryAI(item);
				} else {
					uni.showModal({ content: res.errMsg || '同步失败', showCancel: false });
				}
				this.refreshData();
			} catch (e) {
				uni.showModal({ content: '请求异常: ' + e.message, showCancel: false });
			} finally {
				uni.hideLoading();
			}
		},

		// 重试AI处理
		async retryAI(item) {
			uni.showLoading({ title: 'AI 处理中...' });
			try {
				const rpa = uniCloud.importObject('a-task-rpa');
				const res = await rpa.generateQueue(item._id);
				if (res.errCode === 0) {
					uni.showToast({ title: '处理成功', icon: 'success' });
					this.refreshData();
				} else {
					uni.showModal({ content: res.errMsg, showCancel: false });
				}
			} catch (e) {
				uni.showModal({ content: '请求失败: ' + e.message, showCancel: false });
			} finally {
				uni.hideLoading();
			}
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
</style>
