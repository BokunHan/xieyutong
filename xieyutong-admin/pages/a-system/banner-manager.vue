<template>
	<view>
		<view class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
			<uni-table :loading="loading" border emptyText="暂无数据">
				<uni-tr>
					<uni-th align="center" width="80">排序</uni-th>
					<uni-th align="center" width="120">图片</uni-th>
					<uni-th align="left">标题 / 副标题</uni-th>
					<uni-th align="left">跳转链接</uni-th>
					<uni-th align="center" width="100">状态</uni-th>
					<uni-th align="center" width="180">操作</uni-th>
				</uni-tr>
				<uni-tr v-for="item in bannerList" :key="item._id">
					<uni-td align="center">{{ item.sort_order }}</uni-td>
					<uni-td align="center">
						<image :src="item.image" mode="aspectFill" class="w-24 h-12 rounded" />
					</uni-td>
					<uni-td>
						<view>
							<view class="font-semibold text-gray-800">{{ item.title }}</view>
							<view class="text-sm text-gray-500">{{ item.subtitle }}</view>
						</view>
					</uni-td>
					<uni-td>
						<view class="text-sm text-blue-600">{{ item.url }}</view>
					</uni-td>
					<uni-td align="center">
						<uni-tag :type="item.status === 1 ? 'success' : 'error'" :text="item.status === 1 ? '启用' : '禁用'" inverted />
					</uni-td>
					<uni-td align="center">
						<view class="flex justify-center space-x-3">
							<button @click="openForm(item)" class="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">编辑</button>
							<button @click="deleteBanner(item._id)" class="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors">删除</button>
						</view>
					</uni-td>
				</uni-tr>
			</uni-table>
		</view>

		<uni-popup ref="formPopup" type="dialog">
			<uni-popup-dialog mode="form" :title="formTitle" :before-close="true" @confirm="submitForm" @close="closeForm">
				<view class="form-content space-y-4 p-4 w-full">
					<view class="grid grid-cols-2 gap-4">
						<view>
							<text class="form-label">标题</text>
							<uni-easyinput v-model="formData.title" placeholder="请输入标题" :styles="inputStyles" />
						</view>
						<view>
							<text class="form-label">副标题</text>
							<uni-easyinput v-model="formData.subtitle" placeholder="请输入副标题" :styles="inputStyles" />
						</view>
					</view>

					<view class="grid grid-cols-2 gap-4">
						<view>
							<text class="form-label">按钮名称</text>
							<uni-easyinput v-model="formData.button_name" placeholder="例如：立即预订" :styles="inputStyles" />
						</view>
						<view>
							<text class="form-label">轮播图片</text>
							<uni-file-picker
								v-model="formData.image"
								limit="1"
								file-mediatype="image"
								@success="handleImageUploadSuccess"
								@delete="handleImageDelete"
								mode="grid"
								title="建议尺寸 750x350" />
						</view>
					</view>

					<view class="grid grid-cols-2 gap-4">
						<view>
							<text class="form-label">链接类型</text>
							<uni-data-select
								v-model="formData.link_type"
								:localdata="[
									{ value: 1, text: '内部页面' },
									{ value: 2, text: '外部H5' }
								]"
								:clear="false" />
						</view>
						<view>
							<text class="form-label">跳转链接</text>
							<uni-easyinput v-model="formData.url" placeholder="例如：/pages/product-detail/product-detail?id=1" :styles="inputStyles" />
						</view>
					</view>

					<view class="grid grid-cols-2 gap-4">
						<view>
							<text class="form-label">排序</text>
							<uni-easyinput type="number" v-model.number="formData.sort_order" placeholder="数字越小越靠前" :styles="inputStyles" />
						</view>
						<view>
							<text class="form-label">状态</text>
							<uni-data-select
								v-model="formData.status"
								:localdata="[
									{ value: 1, text: '启用' },
									{ value: 0, text: '禁用' }
								]"
								:clear="false" />
						</view>
					</view>

					<view>
						<text class="form-label">备注</text>
						<uni-easyinput type="textarea" v-model="formData.remark" placeholder="请输入备注" :styles="textareaStyles" />
					</view>
				</view>
			</uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script>
const db = uniCloud.database();

export default {
	data() {
		return {
			loading: false,
			bannerList: [],
			formTitle: '',
			formData: {},
			// 表单输入框样式
			inputStyles: {
				borderColor: '#d1d5db',
				fontSize: '16px'
			},
			textareaStyles: {
				borderColor: '#d1d5db',
				fontSize: '16px',
				minHeight: '80px'
			}
		};
	},
	// (修改) 使用 created 替代 onLoad，以便在 v-show 切换时正确加载
	created() {
		this.loadData();
	},
	methods: {
		// 加载数据
		async loadData() {
			this.loading = true;
			try {
				const res = await db.collection('a-banners').orderBy('sort_order', 'asc').get();
				this.bannerList = res.result.data;
			} catch (error) {
				console.error('轮播图数据加载失败:', error);
				uni.showToast({
					title: '数据加载失败',
					icon: 'error'
				});
			} finally {
				this.loading = false;
			}
		},

		// 定义空表单
		getEmptyFormData() {
			return {
				title: '',
				subtitle: '',
				image: [],
				button_name: '',
				url: '',
				link_type: 1,
				sort_order: 100,
				status: 1,
				remark: ''
			};
		},

		// 打开弹窗 (新增/编辑) - (此方法由父组件通过 ref 调用)
		openForm(item = null) {
			if (item) {
				// 编辑
				this.formTitle = '编辑轮播图';
				// 注意：uni-file-picker 需要特定格式
				const imageData = item.image ? [{ url: item.image, name: 'image', extname: 'jpg' }] : [];
				this.formData = { ...item, image: imageData };
			} else {
				// 新增
				this.formTitle = '新增轮播图';
				this.formData = this.getEmptyFormData();
			}
			this.$refs.formPopup.open();
		},

		// 关闭弹窗
		closeForm() {
			this.$refs.formPopup.close();
			this.formData = {};
		},

		// 提交表单
		async submitForm() {
			this.loading = true;
			try {
				const dataToSubmit = { ...this.formData };

				if (Array.isArray(dataToSubmit.image) && dataToSubmit.image.length > 0 && dataToSubmit.image[0].url) {
					dataToSubmit.image = dataToSubmit.image[0].url;
				} else {
					dataToSubmit.image = '';
				}

				const recordId = dataToSubmit._id;
				delete dataToSubmit._id;
				// delete dataToSubmit.extname;
				// delete dataToSubmit.name;

				if (recordId) {
					// 更新
					await db.collection('a-banners').doc(recordId).update(dataToSubmit);
					uni.showToast({
						title: '更新成功',
						icon: 'success'
					});
				} else {
					// 新增
					await db.collection('a-banners').add(dataToSubmit);
					uni.showToast({
						title: '新增成功',
						icon: 'success'
					});
				}

				this.closeForm();
				this.loadData(); // 重新加载数据
			} catch (error) {
				console.error('提交失败:', error);
				uni.showToast({
					title: error.message || '操作失败',
					icon: 'error'
				});
			} finally {
				this.loading = false;
			}
		},

		// 删除
		async deleteBanner(id) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除此轮播图吗？',
				success: async (res) => {
					if (res.confirm) {
						this.loading = true;
						try {
							await db.collection('a-banners').doc(id).remove();
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							});
							this.loadData(); // 重新加载数据
						} catch (error) {
							console.error('删除失败:', error);
							uni.showToast({
								title: '删除失败',
								icon: 'error'
							});
						} finally {
							this.loading = false;
						}
					}
				}
			});
		},

		// 图片上传成功
		handleImageUploadSuccess(e) {
			// v-model 自动处理
		},

		// 图片删除
		handleImageDelete(e) {
			this.formData.image = [];
		}
	}
};
</script>

<style scoped>
/* 样式在父组件 (system-management.vue) 中定义 */
</style>
