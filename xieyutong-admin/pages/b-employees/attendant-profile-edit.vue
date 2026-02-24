<template>
	<view class="p-6 bg-white min-h-screen">
		<view class="mb-6 border-b pb-2">
			<view class="font-bold text-lg text-gray-800">管家月度绩效数据录入</view>
			<view class="text-sm text-gray-500 mt-1">关联用户: {{ nickname }}</view>
		</view>

		<uni-forms ref="form" :model="formData" label-width="180px">
			<view class="text-sm font-bold text-green-700 mb-4 mt-2 bg-green-50 p-2 rounded">加分/贡献项</view>
			<uni-forms-item label="客户好评与表扬">
				<uni-number-box v-model="formData.stats.praise_count" :min="0"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item label="主动纠正成本差异">
				<uni-number-box v-model="formData.stats.cost_correction_count" :min="0"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item label="主动协助同事">
				<uni-number-box v-model="formData.stats.assist_colleague_count" :min="0"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item label="担任新人导师">
				<uni-number-box v-model="formData.stats.mentor_count" :min="0"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item label="有效经验分享">
				<uni-number-box v-model="formData.stats.knowledge_share_count" :min="0"></uni-number-box>
			</uni-forms-item>

			<view class="text-sm font-bold text-red-700 mb-4 mt-6 bg-red-50 p-2 rounded">客诉与失误</view>
			<uni-forms-item label="贬损差评次数">
				<uni-number-box v-model="formData.stats.detractor_count" :min="0"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item label="L2级及以上客诉">
				<uni-number-box v-model="formData.stats.l2_complaint_count" :min="0"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item label="重大操作失误">
				<uni-number-box v-model="formData.stats.major_error_count" :min="0"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item label="跨部门推诿投诉">
				<uni-number-box v-model="formData.stats.shirking_complaint_count" :min="0"></uni-number-box>
			</uni-forms-item>

			<view class="text-sm font-bold text-indigo-700 mb-4 mt-6 bg-indigo-50 p-2 rounded">流程与时效规范</view>
			<uni-forms-item label="“1小时启动”迟漏">
				<uni-number-box v-model="formData.stats.startup_delay_count" :min="0"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item label="司机派单专项未达标">
				<uni-number-box v-model="formData.stats.driver_dispatch_fail_count" :min="0"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item label="响应未达标">
				<uni-number-box v-model="formData.stats.response_fail_count" :min="0"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item label="响应处理不当">
				<uni-number-box v-model="formData.stats.response_mishandle_count" :min="0"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item label="预订信息错误">
				<uni-number-box v-model="formData.stats.booking_error_count" :min="0"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item label="行后审核迟漏">
				<uni-number-box v-model="formData.stats.audit_delay_count" :min="0"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item label="资源库维护迟漏">
				<uni-number-box v-model="formData.stats.resource_maintenance_delay_count" :min="0"></uni-number-box>
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
			docId: '',
			formData: {
				stats: {
					praise_count: 0,
					detractor_count: 0,
					l2_complaint_count: 0,
					major_error_count: 0,
					startup_delay_count: 0,
					driver_dispatch_fail_count: 0,
					response_fail_count: 0,
					response_mishandle_count: 0,
					booking_error_count: 0,
					audit_delay_count: 0,
					cost_correction_count: 0,
					shirking_complaint_count: 0,
					assist_colleague_count: 0,
					mentor_count: 0,
					resource_maintenance_delay_count: 0,
					knowledge_share_count: 0
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
			const res = await db.collection('b-attendant-profiles').where({ user_id: this.userId }).get();
			if (res.result.data.length > 0) {
				const data = res.result.data[0];
				this.docId = data._id;
				// 合并数据
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
				await db.collection('b-attendant-profiles').doc(this.docId).update(dataToSave);
			} else {
				await db.collection('b-attendant-profiles').add(dataToSave);
			}
			uni.showToast({ title: '保存成功' });
			setTimeout(() => uni.navigateBack(), 1000);
		}
	}
};
</script>
