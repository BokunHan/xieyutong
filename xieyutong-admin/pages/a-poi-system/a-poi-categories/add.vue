<template>
	<view class="uni-container">
		<view class="uni-header">
			<view class="uni-group">
				<button type="default" size="mini" @click="goBack">返回</button>
				<view class="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center ml-5">
					<i class="fas fa-sitemap text-white text-xs"></i>
				</view>
				<view class="uni-title ml-2">新增 POI 分类</view>
				<view class="uni-sub-title"></view>
			</view>
		</view>
		<uni-forms class="mt-6" ref="form" :model="formData" validateTrigger="bind">
			<uni-forms-item name="name" label="分类名称" required>
				<uni-easyinput placeholder="例如：景点、餐厅、酒店" v-model="formData.name" trim="both"></uni-easyinput>
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
import { validator } from '../../../js_sdk/validator/a-poi-categories.js';

const db = uniCloud.database();
const dbCmd = db.command;
const dbCollectionName = 'a-poi-categories';

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
