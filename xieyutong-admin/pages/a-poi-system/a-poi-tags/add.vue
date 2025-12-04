<template>
	<view class="uni-container">
		<view class="uni-header">
			<view class="uni-group">
				<button type="default" size="mini" @click="goBack">返回</button>
				<view class="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center ml-5">
					<i class="fas fa-tags text-white text-xs"></i>
				</view>
				<view class="uni-title ml-2">新增 POI 标签</view>
				<view class="uni-sub-title"></view>
			</view>
		</view>
		<uni-forms class="mt-5" ref="form" :model="formData" validateTrigger="bind">
			<uni-forms-item name="name" label="标签名称" required>
				<uni-easyinput placeholder="例如：网红打卡、历史遗迹" v-model="formData.name" trim="both"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="order" label="排序">
				<uni-easyinput placeholder="数字越大越靠前" type="number" v-model="formData.order"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="status" label="启用状态">
				<switch @change="binddata('status', $event.detail.value)" :checked="formData.status"></switch>
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
import { validator } from '../../../js_sdk/validator/a-poi-tags.js';

const db = uniCloud.database();
const dbCmd = db.command;
const dbCollectionName = 'a-poi-tags';

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
			name: '',
			order: 0,
			status: true
		};
		return {
			formData,
			formOptions: {},
			rules: {
				...getValidator(Object.keys(formData))
			}
		};
	},
	onReady() {
		this.$refs.form.setRules(this.rules);
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},
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
		submitForm(value) {
			return db
				.collection(dbCollectionName)
				.add(value)
				.then((res) => {
					uni.showToast({
						title: '新增成功'
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
		}
	}
};
</script>
