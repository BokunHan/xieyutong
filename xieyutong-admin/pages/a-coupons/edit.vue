<template>
	<view class="uni-container">
		<uni-forms ref="form" :model="formData" validateTrigger="bind">
			<uni-forms-item name="title" label="券名称" required>
				<uni-easyinput placeholder="优惠券标题" v-model="formData.title"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="description" label="券描述">
				<uni-easyinput placeholder="优惠券描述" v-model="formData.description"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="type" label="优惠类型" required>
				<uni-data-checkbox v-model="formData.type" :localdata="formOptions.type_localdata"></uni-data-checkbox>
			</uni-forms-item>
			<uni-forms-item name="amount" label="优惠金额" required>
				<uni-number-box v-model="formData.amount" :max="1000000"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item name="min_amount" label="使用门槛" required>
				<uni-number-box v-model="formData.min_amount" :max="1000000"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item name="issue_type" label="发券类型" required>
				<uni-data-checkbox v-model="formData.issue_type" :localdata="formOptions.issue_type_localdata"></uni-data-checkbox>
			</uni-forms-item>
			<!-- <uni-forms-item name="total_count" label="发放总数">
				<uni-number-box v-model="formData.total_count"></uni-number-box>
			</uni-forms-item>
			<uni-forms-item name="used_count" label="已使用数">
				<uni-number-box v-model="formData.used_count"></uni-number-box>
			</uni-forms-item> -->
			<uni-forms-item name="valid_days" label="有效天数">
				<uni-number-box v-model="formData.valid_days" :max="10000"></uni-number-box>
			</uni-forms-item>
			<!-- <uni-forms-item name="share_code" label="分享码">
				<uni-easyinput placeholder="分享码，用于生成领券链接和二维码（仅手动发券使用）" v-model="formData.share_code"></uni-easyinput>
			</uni-forms-item> -->
			<uni-forms-item name="auto_issue_condition" label="自动发券条件">
				<uni-data-checkbox :max="50" v-model="formData.auto_issue_condition" :localdata="formOptions.auto_issue_condition_localdata"></uni-data-checkbox>
			</uni-forms-item>
			<uni-forms-item name="status" label="状态" required>
				<uni-data-checkbox v-model="formData.status" :localdata="formOptions.status_localdata"></uni-data-checkbox>
			</uni-forms-item>
			<view class="uni-button-group">
				<button type="primary" class="uni-button" style="width: 100px" @click="submit">提交</button>
				<navigator open-type="navigateBack" style="margin-left: 15px">
					<button class="uni-button" style="width: 100px">返回</button>
				</navigator>
			</view>
		</uni-forms>
	</view>
</template>

<script>
import { validator } from '../../js_sdk/validator/a-coupons.js';

const db = uniCloud.database();
const dbCmd = db.command;
const dbCollectionName = 'a-coupons';

function getValidator(fields) {
	let result = {};
	for (let key in validator) {
		if (fields.includes(key)) {
			result[key] = validator[key];
		}
	}
	return result;
}

export default {
	data() {
		let formData = {
			title: '',
			description: '',
			type: 'fixed',
			amount: 0,
			min_amount: 0,
			issue_type: '',
			total_count: 0,
			used_count: 0,
			valid_days: 30,
			share_code: '',
			auto_issue_condition: '',
			status: 'active'
			// "created_at": null,
			// "updated_at": null
		};
		return {
			formData,
			formOptions: {
				type_localdata: [
					{
						value: 'fixed',
						text: '固定金额'
					},
					{
						value: 'percent',
						text: '打折比例'
					}
				],
				issue_type_localdata: [
					{
						value: 'manual',
						text: '手动发放'
					},
					{
						value: 'auto_referral',
						text: '推荐奖励'
					}
				],
				auto_issue_condition_localdata: [
					{
						value: 'referrer_reward',
						text: '推荐人奖励'
					},
					{
						value: 'referee_reward',
						text: '被推荐人奖励'
					}
				],
				status_localdata: [
					{
						value: 'active',
						text: '启用'
					},
					{
						value: 'inactive',
						text: '停用'
					}
				]
			},
			rules: {
				...getValidator(Object.keys(formData))
			}
		};
	},
	onLoad(e) {
		if (e.id) {
			const id = e.id;
			this.formDataId = id;
			this.getDetail(id);
		}
	},
	onReady() {
		this.$refs.form.setRules(this.rules);
	},
	methods: {
		/**
		 * 验证表单并提交
		 */
		submit() {
			uni.showLoading({
				mask: true
			});
			this.$refs.form
				.validate()
				.then((res) => {
					return this.submitForm(res);
				})
				.catch(() => {})
				.finally(() => {
					uni.hideLoading();
				});
		},

		/**
		 * 提交表单
		 */
		submitForm(value) {
			// 使用 clientDB 提交数据
			return db
				.collection(dbCollectionName)
				.doc(this.formDataId)
				.update(value)
				.then((res) => {
					uni.showToast({
						title: '修改成功'
					});
					this.getOpenerEventChannel().emit('refreshData');
					setTimeout(() => uni.navigateBack(), 500);
				})
				.catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					});
				});
		},

		/**
		 * 获取表单数据
		 * @param {Object} id
		 */
		getDetail(id) {
			uni.showLoading({
				mask: true
			});
			db.collection(dbCollectionName)
				.doc(id)
				.field('title,description,type,amount,min_amount,issue_type,total_count,used_count,valid_days,share_code,auto_issue_condition,status')
				.get()
				.then((res) => {
					const data = res.result.data[0];
					if (data) {
						this.formData = data;
					}
				})
				.catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					});
				})
				.finally(() => {
					uni.hideLoading();
				});
		}
	}
};
</script>
