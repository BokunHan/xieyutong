<template>
	<view class="px-5 py-3 page-container">
		<view class="uni-header">
			<view class="uni-group">
				<button type="default" size="mini" @click="goBack">返回</button>
				<view class="ml-5 font-bold text-lg text-red-600">发送失败任务列表</view>
			</view>
			<view class="uni-group">
				<button class="uni-button" type="default" size="mini" @click="refreshData">刷新</button>
			</view>
		</view>

		<view class="uni-container mt-4">
			<unicloud-db
				ref="udb"
				collection="a-task-queue"
				field="_id, task_id, group_name, task_name, send_time, status, error_msg, payload"
				where="status == 'failed'"
				orderby="send_time desc"
				:page-size="50"
				v-slot:default="{ data, loading, error, options }">
				<view v-if="loading" class="text-center py-10 text-gray-500">加载中...</view>
				<view v-else-if="error" class="text-center py-10 text-red-500">{{ error.message }}</view>
				<view v-else-if="!data.length" class="text-center py-10 text-gray-500">🎉 暂无失败任务，系统运行良好！</view>

				<uni-table v-else border stripe emptyText="暂无数据">
					<uni-tr>
						<uni-th align="center" width="100">订单号</uni-th>
						<uni-th align="center" width="150">任务名称</uni-th>
						<uni-th align="center" width="140">计划发送时间</uni-th>
						<uni-th align="center">失败原因</uni-th>
						<uni-th align="center" width="100">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item, index) in data" :key="item._id">
						<uni-td align="center">
							<text class="font-bold text-blue-800">{{ item.group_name || '未知订单' }}</text>
						</uni-td>
						<uni-td align="center">{{ item.task_name }}</uni-td>
						<uni-td align="center">
							<text class="text-xs text-gray-600">{{ item.send_time }}</text>
						</uni-td>
						<uni-td>
							<view class="text-xs text-red-600 break-words" style="max-width: 300px">
								{{ item.error_msg || '未知错误' }}
							</view>
						</uni-td>
						<uni-td align="center">
							<button type="primary" size="mini" plain @click="handleTask(item)">去处理</button>
						</uni-td>
					</uni-tr>
				</uni-table>
			</unicloud-db>
		</view>
	</view>
</template>

<script>
export default {
	methods: {
		goBack() {
			uni.navigateBack();
		},
		refreshData() {
			this.$refs.udb.refresh();
		},
		handleTask(item) {
			// 跳转到 queue 页面，并传递 highlight 参数
			// task_id 对应 orders 表的 _id
			// group_name 对应 显示的订单号
			// highlight 对应 这一条消息的 _id
			uni.navigateTo({
				url: `./queue?id=${item.task_id}&order=${item.group_name}&highlight=${item._id}`
			});
		}
	}
};
</script>

<style scoped>
.page-container {
	min-height: 100vh;
	background-color: #f8fafc;
}
.break-words {
	word-break: break-all;
	white-space: pre-wrap;
}
</style>
