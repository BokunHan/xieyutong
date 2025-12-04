<template>
	<view class="uni-container">
		<view class="uni-header">
			<view class="uni-group">
				<button type="default" size="mini" @click="goBack">返回</button>
				<view class="w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center ml-5">
					<i class="fas fa-map-marker-alt text-white text-xs"></i>
				</view>
				<view class="uni-title ml-2">新增 POI 内容</view>
				<view class="uni-sub-title"></view>
			</view>
		</view>
		<uni-forms class="mt-5" ref="form" :model="formData" validateTrigger="bind" label-width="100px">
			<uni-forms-item name="name" label="POI名称" required>
				<uni-easyinput placeholder="地点的主名称" v-model="formData.name" trim="both"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="category_id" label="POI分类" required>
				<uni-data-select
					v-model="formData.category_id"
					collection="a-poi-categories"
					field="_id as value, name as text"
					where="status == true"
					orderby="order desc"
					placeholder="请选择POI分类"></uni-data-select>
			</uni-forms-item>
			<uni-forms-item name="region_ids" label="所属区域">
				<uni-data-picker
					v-model="_leaf_region_id"
					collection="a-regions"
					field="_id as value, name as text"
					where="status == true"
					orderby="order asc"
					placeholder="请选择所属区域"
					tree
					popup-title="选择区域"></uni-data-picker>
			</uni-forms-item>
			<uni-forms-item name="aliases" label="别名/俗称">
				<uni-easyinput placeholder="输入别名后回车添加，多个别名用,隔开" v-model="aliases_text" @confirm="addAlias"></uni-easyinput>
				<view class="tag-view">
					<uni-tag
						:inverted="true"
						:text="tag"
						v-for="(tag, index) in formData.aliases"
						:key="index"
						@click="removeAlias(index)"
						type="primary"
						style="margin-right: 5px"></uni-tag>
				</view>
			</uni-forms-item>
			<uni-forms-item name="tags" label="POI标签">
				<uni-data-checkbox
					v-model="formData.tags"
					collection="a-poi-tags"
					field="_id as value, name as text"
					where="status == true"
					orderby="order desc"
					:multiple="true"></uni-data-checkbox>
			</uni-forms-item>
			<uni-forms-item name="address_text" label="详细地址">
				<uni-easyinput placeholder="例如：北京市东城区景山前街4号" v-model="formData.address_text" trim="both"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="media" label="媒体库(图/视频)">
				<uni-file-picker v-model="formData.media" file-mediatype="all" return-type="array" :limit="20" mode="grid"></uni-file-picker>
			</uni-forms-item>

			<uni-forms-item name="description" label="富文本介绍">
				<view class="wangeditor-container">
					<sv-wangeditor v-model:html="formData.description" :toolbarConfig="toolbarConfig" :editorConfig="editorConfig" mode="default"></sv-wangeditor>
				</view>
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
import { validator } from '../../../js_sdk/validator/a-poi-database.js';

const db = uniCloud.database();
const dbCmd = db.command;
const dbCollectionName = 'a-poi-database';

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
			category_id: '',
			region_ids: [],
			aliases: [],
			tags: [],
			address_text: '',
			media: [],
			description: ''
		};
		return {
			formData,
			_leaf_region_id: '',
			formOptions: {},
			rules: {
				...getValidator(Object.keys(formData))
			},
			aliases_text: '',
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
		addAlias() {
			if (this.aliases_text) {
				const newAliases = this.aliases_text
					.split(',')
					.map((item) => item.trim())
					.filter((item) => item);
				if (newAliases.length > 0) {
					this.formData.aliases = [...new Set([...this.formData.aliases, ...newAliases])];
					this.aliases_text = ''; // 清空输入框
				}
			}
		},
		removeAlias(index) {
			this.formData.aliases.splice(index, 1);
		},
		/**
		 * 验证表单并提交
		 */
		submit() {
			this.addAlias();

			uni.showLoading({
				mask: true
			});

			this.validateAndSubmit();
		},

		validateAndSubmit() {
			this.$refs.form
				.validate()
				.then(async (res) => {
					uni.showLoading({ title: '处理区域信息...', mask: true });
					if (this._leaf_region_id) {
						try {
							const regionService = uniCloud.importObject('a-region-service');
							const ancestorsMap = await regionService.getAncestorsMap(this._leaf_region_id);
							// 把返回的数组 ["chaoyang_id", "beijing_id", "china_id"] 赋给 res
							res.region_ids = ancestorsMap[this._leaf_region_id];
						} catch (e) {
							uni.hideLoading();
							uni.showModal({
								content: `区域信息处理失败：${e.message}`,
								showCancel: false
							});
							return; // 阻止提交
						}
					} else {
						res.region_ids = []; // 确保是个空数组
					}

					res.aliases = this.formData.aliases;
					return this.submitForm(res);
				})
				.catch(() => {
					console.log('表单校验失败', err);
				})
				.finally(() => {
					uni.hideLoading();
				});
		},

		/**
		 * 提交表单
		 */
		async submitForm(value) {
			const poiService = uniCloud.importObject('a-poi-service');

			try {
				const res = await poiService.addPoi(value);

				uni.showToast({
					title: '新增成功'
				});

				// 通知父页面刷新
				this.getOpenerEventChannel().emit('refreshData');

				// 延迟返回
				setTimeout(() => uni.navigateBack(), 500);
			} catch (err) {
				console.error(err);
				uni.showModal({
					content: err.message || '添加失败',
					showCancel: false
				});
			}
		}
	}
};
</script>

<style lang="scss" scoped>
.wangeditor-container {
	border: 1px solid #e5e5e5;
	border-radius: 5px;

	:deep(.w-e-text-container) {
		min-height: 400px;
	}
}
.tag-view {
	margin-top: 10px;
}
</style>
