<template>
	<view class="uni-container">
		<view class="uni-header">
			<view class="uni-group">
				<button type="default" size="mini" @click="goBack">返回</button>
				<view class="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center ml-5">
					<i class="fas fa-globe-asia text-white text-xs"></i>
				</view>
				<view class="uni-title ml-2">新增区域提示</view>
				<view class="uni-sub-title"></view>
			</view>
		</view>
		<uni-forms class="mt-3" ref="form" :model="formData" validateTrigger="bind">
			<uni-forms-item name="region_id" label="所属区域" required>
				<uni-data-picker v-model="formData.region_id" collection="a-regions" field="_id as value, name as text" where="status == true" orderby="order asc"></uni-data-picker>
			</uni-forms-item>
			<uni-forms-item name="type" label="内容类型" required>
				<uni-data-checkbox v-model="formData.type" :localdata="formOptions.type_localdata"></uni-data-checkbox>
			</uni-forms-item>
			<uni-forms-item name="title" label="标题" required>
				<uni-easyinput placeholder="文章显示的标题" v-model="formData.title" trim="both"></uni-easyinput>
			</uni-forms-item>

			<uni-forms-item name="content" label="详细内容">
				<view class="wangeditor-container">
					<sv-wangeditor v-model:html="formData.content" :toolbarConfig="toolbarConfig" :editorConfig="editorConfig" mode="default"></sv-wangeditor>
				</view>
			</uni-forms-item>
			<uni-forms-item name="order" label="排序">
				<uni-easyinput placeholder="同类型内容间的排序" type="number" v-model="formData.order"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="status" label="发布状态">
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
import { validator } from '../../../js_sdk/validator/a-region-content.js';
const db = uniCloud.database();
const dbCmd = db.command;
const dbCollectionName = 'a-region-content';

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
	components: {},
	data() {
		let formData = {
			region_id: '',
			type: '',
			title: '',
			content: '',
			order: 0,
			status: true
		};
		return {
			formData,
			formOptions: {
				type_localdata: [
					{ value: 'tips', text: '出行提示' },
					{ value: 'precautions', text: '注意事项' },
					{ value: 'must_read', text: '出行前必读' }
				]
			},
			rules: {
				...getValidator(Object.keys(formData))
			},
			toolbarConfig: {},
			editorConfig: {
				// 配置悬浮工具栏
				hoverbarKeys: {
					// 选中文本时
					text: {
						menuKeys: ['bold', 'italic', 'underline', 'through', 'color', 'bgColor', 'fontSize', 'fontFamily', 'lineHeight', 'insertLink', 'insertPoi', 'clearStyle']
					},
					link: {
						menuKeys: ['editLink', 'unLink', 'viewLink']
					}
				}
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
				.catch((err) => {
					console.error('表单校验失败：', err);
				})
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

<style lang="scss" scoped>
.wangeditor-container {
	border: 1px solid #e5e5e5;
	border-radius: 5px;

	:deep(.w-e-text-container) {
		min-height: 300px;
	}
}
</style>
