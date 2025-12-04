<template>
	<view class="uni-container">
		<view class="uni-header">
			<view class="uni-group">
				<button type="default" size="mini" @click="goBack">返回</button>
				<view class="uni-title ml-2">新建推荐任务</view>
			</view>
		</view>
		<uni-forms class="mt-6" ref="form" :model="formData" :rules="rules" validateTrigger="bind" label-width="120px">
			<uni-forms-item name="order_id" label="订单编号" required>
				<uni-easyinput placeholder="请输入订单号" v-model="formData.order_id" trim="both"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="account_name" label="执行账号" required>
				<view style="display: flex; align-items: center; gap: 10px">
					<view style="flex: 1">
						<uni-data-select
							v-if="showOptions"
							v-model="formData.account_name"
							collection="a-task-accounts"
							field="name as value, name as text"
							placeholder="请选择用哪个号发送"></uni-data-select>
					</view>
					<button type="default" size="mini" @click="refreshOptions">
						<uni-icons type="refreshempty" size="12"></uni-icons>
						更新账号群列表
					</button>
				</view>
				<view class="text-xs text-gray-500 mt-1">* 如果您刚刚新建了客户群，请选择您的账号并点击刷新按钮</view>
			</uni-forms-item>

			<!-- <uni-forms-item name="target_group_id" label="企业微信群" required>
				<uni-data-select
					v-if="showOptions"
					v-model="formData.target_group_id"
					collection="a-task-groups"
					:where="groupWhere"
					field="_id as value, name as text"
					orderby="updated_at desc"
					placeholder="请选择要发送的客户群"></uni-data-select>
			</uni-forms-item> -->

			<view class="uni-button-group">
				<button type="primary" class="uni-button" style="width: 150px" @click="submit" :loading="loading">提交并开始抓取</button>
			</view>
		</uni-forms>
	</view>
</template>

<script>
const db = uniCloud.database();

export default {
	data() {
		return {
			formData: {
				order_id: '',
				account_name: '',
				// target_group_id: '',
				crawl_status: 'pending',
				ai_status: 'pending'
			},
			loading: false,
			showOptions: true,
			rules: {
				order_id: { rules: [{ required: true, errorMessage: '请输入订单号' }] },
				account_name: { rules: [{ required: true, errorMessage: '请选择执行账号' }] }
				// target_group_id: { rules: [{ required: true, errorMessage: '请选择群组' }] }
			}
		};
	},
	// computed: {
	// 	groupWhere() {
	// 		if (!this.formData.account_name) {
	// 			return "account_name == 'none'"; // 没选账号时，显示所有（或者你可以改为 "account_name == 'none'" 来不显示任何群）
	// 		}
	// 		// 筛选条件：account_name 等于当前选中的账号
	// 		return `account_name == '${this.formData.account_name}'`;
	// 	}
	// },
	methods: {
		goBack() {
			uni.navigateBack();
		},
		submit() {
			this.$refs.form.validate().then((res) => {
				this.loading = true;
				// 提交到数据库，状态为 pending，本地 Agent 会轮询到它
				db.collection('a-task-orders')
					.add(this.formData)
					.then(() => {
						uni.showToast({ title: '任务创建成功' });
						this.getOpenerEventChannel().emit('refreshData');
						setTimeout(() => uni.navigateBack(), 800);
					})
					.catch((err) => {
						uni.showModal({ content: err.message || '提交失败', showCancel: false });
					})
					.finally(() => {
						this.loading = false;
					});
			});
		},

		// 请求同步逻辑
		async refreshOptions() {
			if (!this.formData.account_name) {
				return uni.showToast({ title: '请先选择账号', icon: 'none' });
			}

			uni.showLoading({ title: '正在呼叫本地Agent...' });

			try {
				const rpa = uniCloud.importObject('a-task-rpa');
				const res = await rpa.triggerSync(this.formData.account_name);

				uni.hideLoading();

				if (res.errCode === 0) {
					uni.showModal({
						title: '指令已发送',
						content: `已通知服务器重新抓取【${this.formData.account_name}】的群列表。\n\n这可能需要几十秒，请稍后再次点击刷新按钮查看最新数据。`,
						showCancel: false,
						success: () => {
							// 稍微重置一下 UI，假装刷新
							this.showOptions = false;
							setTimeout(() => (this.showOptions = true), 200);
						}
					});
				}
			} catch (e) {
				uni.hideLoading();
				uni.showToast({ title: '请求失败: ' + e.message, icon: 'none' });
			}
		}
	}
};
</script>
