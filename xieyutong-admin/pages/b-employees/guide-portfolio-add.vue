<template>
	<view class="p-6 bg-white min-h-screen">
		<view class="mb-6 pb-4 border-b border-gray-100">
			<text class="text-gray-500">正在为</text>
			<text class="text-lg font-bold text-indigo-600 mx-1">{{ guideName }}</text>
			<text class="text-gray-500">上传精彩瞬间</text>
		</view>

		<uni-forms ref="form" :model="formData" :rules="rules" validate-trigger="bind" label-width="100px">
			<view v-show="false">
				<uni-easyinput v-model="formData.user_id"></uni-easyinput>
			</view>

			<uni-forms-item name="media_type" label="素材类型" required>
				<uni-data-checkbox
					v-model="formData.media_type"
					:localdata="[
						{ text: '图片', value: 'image' },
						{ text: '视频', value: 'video' }
					]"></uni-data-checkbox>
			</uni-forms-item>

			<uni-forms-item name="media" label="上传文件" required>
				<view class="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
					<uni-file-picker
						v-model="formData.media"
						return-type="object"
						:file-mediatype="formData.media_type"
						limit="1"
						:title="formData.media_type === 'image' ? '点击选择图片' : '点击选择视频'"></uni-file-picker>
				</view>
				<view class="text-xs text-gray-400 mt-2">支持上传 jpg, png, mp4 等格式</view>
			</uni-forms-item>

			<view class="mt-8 flex gap-4">
				<button class="flex-1" @click="cancel">取消</button>
				<button class="flex-1" type="primary" @click="submit" :loading="submitting">确认上传</button>
			</view>
		</uni-forms>
	</view>
</template>

<script>
const db = uniCloud.database();
import { toRaw } from 'vue';
export default {
	data() {
		return {
			guideName: '',
			submitting: false,
			formData: {
				user_id: '',
				media: null,
				media_type: 'image'
			},
			rules: { media: { rules: [{ required: true, errorMessage: '请上传文件' }] } }
		};
	},
	onLoad(options) {
		if (options.user_id) {
			this.formData.user_id = options.user_id;
			this.guideName = options.name || '该私导';
		} else {
			uni.showToast({ title: '缺少关键参数', icon: 'none' });
		}
	},
	methods: {
		async submit() {
			this.$refs.form.validate().then(() => {
				if (!this.formData.user_id) {
					return uni.showToast({ title: '用户ID丢失', icon: 'none' });
				}

				this.submitting = true;

				db.collection('b-guide-portfolio')
					.add(this.formData)
					.then(() => {
						uni.showToast({ title: '上传成功' });
						setTimeout(() => {
							uni.$emit('refreshPortfolioList');
							uni.navigateBack();
						}, 1500);
					})
					.catch((err) => {
						this.submitting = false;
						uni.showModal({ content: '上传失败：' + err.message });
					});
			});
		},
		cancel() {
			uni.navigateBack();
		}
	}
};
</script>
