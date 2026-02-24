<template>
	<view class="p-6 bg-white min-h-screen">
		<view class="mb-6 border-b pb-2">
			<view class="font-bold text-lg text-gray-800">销售月度绩效数据录入</view>
			<view class="text-sm text-gray-500 mt-1">关联用户: {{ nickname }}</view>
		</view>

		<uni-forms ref="form" :model="formData" label-width="140px">
			<view class="text-sm font-bold text-indigo-600 mb-4 mt-6 bg-indigo-50 p-2 rounded">服务质量 (手动)</view>
			<uni-forms-item label="咨询客户投诉次数">
				<uni-number-box v-model="formData.stats.complaint_count" :min="0"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item label="响应速度未达标次">
				<uni-number-box v-model="formData.stats.response_violation_count" :min="0"></uni-number-box>
			</uni-forms-item>

			<view class="text-sm font-bold text-indigo-600 mb-4 mt-6 bg-indigo-50 p-2 rounded">工作规范 (手动)</view>
			<uni-forms-item label="客户信息录入错误">
				<uni-number-box v-model="formData.stats.data_entry_error_count" :min="0"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item label="工作流程违规次数">
				<uni-number-box v-model="formData.stats.workflow_violation_count" :min="0"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item label="团队协作违规次数">
				<uni-number-box v-model="formData.stats.team_violation_count" :min="0"></uni-number-box>
			</uni-forms-item>

			<button class="mt-8" type="primary" @click="submit">保存数据</button>
		</uni-forms>
	</view>
</template>

<script>
const db = uniCloud.database();
export default {
	data() {
		return {
			userId: '',
			nickname: '',
			docId: '', // b-sale-profiles 的 _id
			formData: {
				stats: {
					complaint_count: 0,
					response_violation_count: 0,
					data_entry_error_count: 0,
					workflow_violation_count: 0,
					team_violation_count: 0
				}
			}
		};
	},
	onLoad(options) {
		this.userId = options.user_id;
		this.nickname = options.nickname || '未命名';
		this.loadProfile();
	},
	methods: {
		async loadProfile() {
			const res = await db.collection('b-sale-profiles').where({ user_id: this.userId }).get();
			if (res.result.data.length > 0) {
				const data = res.result.data[0];
				this.docId = data._id;
				// 合并数据，防止新字段为空
				this.formData.stats = { ...this.formData.stats, ...(data.stats || {}) };
			}
		},
		async submit() {
			const dataToSave = {
				user_id: this.userId,
				stats: this.formData.stats,
				updated_at: Date.now()
			};

			if (this.docId) {
				await db.collection('b-sale-profiles').doc(this.docId).update(dataToSave);
			} else {
				await db.collection('b-sale-profiles').add(dataToSave);
			}
			uni.showToast({ title: '保存成功' });
			setTimeout(() => uni.navigateBack(), 1000);
		}
	}
};
</script>
