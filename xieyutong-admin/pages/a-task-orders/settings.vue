<template>
	<view class="page-container">
		<view class="header-bar px-5 py-3 border-b flex items-center justify-between bg-white sticky top-0 z-10">
			<view class="flex items-center">
				<button type="default" size="mini" @click="goBack">返回</button>
				<text class="text-lg font-bold ml-3">消息文案设置</text>
			</view>
			<button type="primary" size="mini" @click="openModal()">+ 新增文案</button>
		</view>

		<view class="px-5 py-3 bg-gray-50">
			<view class="flex bg-white rounded p-1 border">
				<view
					v-for="tab in tabs"
					:key="tab.key"
					class="flex-1 text-center py-2 text-sm cursor-pointer rounded transition-all"
					:class="currentTab === tab.key ? 'bg-blue-600 text-white font-bold' : 'text-gray-600 hover:bg-gray-100'"
					@click="switchTab(tab.key)">
					{{ tab.name }}
				</view>
			</view>
		</view>

		<view class="p-5">
			<unicloud-db ref="udb" collection="a-task-settings" :where="`category == '${currentTab}'`" orderby="created_at desc" v-slot:default="{ data, loading, error }">
				<view v-if="loading" class="text-center text-gray-400 py-10">加载中...</view>
				<view v-else-if="error" class="text-center text-red-500 py-10">{{ error.message }}</view>
				<view v-else-if="!data.length" class="text-center text-gray-400 py-10">该分类下暂无配置，请点击右上角新增。</view>

				<view v-else class="grid grid-cols-1 gap-4">
					<view v-for="item in data" :key="item._id" class="bg-white border rounded-lg p-4 shadow-sm relative">
						<view class="flex justify-between items-start mb-2 border-b pb-2">
							<text class="font-bold text-gray-800 text-base">🏷️ {{ item.key }}</text>
							<view class="flex gap-2">
								<button size="mini" type="primary" plain style="font-size: 10px; height: 24px; line-height: 24px" @click="openModal(item)">编辑</button>
								<button size="mini" type="warn" plain style="font-size: 10px; height: 24px; line-height: 24px" @click="deleteItem(item._id)">删除</button>
							</view>
						</view>
						<view class="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed bg-gray-50 p-2 rounded">
							{{ item.content }}
						</view>
					</view>
				</view>
			</unicloud-db>
		</view>

		<view v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" style="background-color: rgba(0, 0, 0, 0.5)">
			<view class="bg-white rounded-lg w-11/12 md:w-1/2 p-5 shadow-lg flex flex-col max-h-90vh">
				<view class="text-lg font-bold mb-4 border-b pb-2">
					{{ form._id ? '编辑文案' : '新增文案' }} -
					<text class="text-blue-600">{{ getTabName(currentTab) }}</text>
				</view>

				<view class="mb-4">
					<view class="text-xs text-gray-500 mb-1 font-bold">关键词:</view>
					<input class="w-full border p-2 rounded text-sm bg-gray-50" style="font-size: 16px; height: 40px" v-model="form.key" placeholder="请输入关键词" />
				</view>

				<view class="mb-4 flex-1 w-full">
					<view class="w-full text-xs text-gray-500 mb-1 font-bold">内容 (支持换行):</view>
					<textarea class="w-full border p-2 rounded text-sm bg-gray-50 h-60" maxlength="-1" v-model="form.content" placeholder="请输入具体的文案内容..."></textarea>
				</view>

				<view class="flex justify-end gap-3 mt-2 pt-3 border-t">
					<button size="mini" type="default" @click="closeModal">取消</button>
					<button size="mini" type="primary" @click="saveData">保存</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();

export default {
	data() {
		return {
			currentTab: 'hotel_surrounding', // 默认分类
			tabs: [
				{ key: 'hotel_surrounding', name: '酒店周边提醒' },
				{ key: 'hotel_service', name: '酒店内相关服务' },
				{ key: 'notice', name: '注意事项' }
			],
			showModal: false,
			form: {
				_id: '',
				key: '',
				content: ''
			}
		};
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},
		switchTab(key) {
			this.currentTab = key;
			// 切换 tab 后，unicloud-db 组件会自动根据 where 属性重新加载数据
		},
		getTabName(key) {
			const t = this.tabs.find((x) => x.key === key);
			return t ? t.name : '';
		},
		// 打开弹窗 (兼容新增和编辑)
		openModal(item = null) {
			if (item) {
				// 编辑模式
				this.form = {
					_id: item._id,
					key: item.key,
					content: item.content
				};
			} else {
				// 新增模式
				this.form = {
					_id: '',
					key: '',
					content: ''
				};
			}
			this.showModal = true;
		},
		closeModal() {
			this.showModal = false;
		},
		saveData() {
			if (!this.form.content) {
				return uni.showToast({ title: '内容不能为空', icon: 'none' });
			}

			uni.showLoading({ title: '保存中...' });

			const dataToSave = {
				category: this.currentTab,
				key: this.form.key,
				content: this.form.content
			};

			let promise;
			if (this.form._id) {
				// 更新
				promise = db.collection('a-task-settings').doc(this.form._id).update(dataToSave);
			} else {
				// 新增
				dataToSave.created_at = Date.now();
				promise = db.collection('a-task-settings').add(dataToSave);
			}

			promise
				.then(() => {
					uni.showToast({ title: '保存成功' });
					this.closeModal();
					this.$refs.udb.refresh(); // 刷新列表
				})
				.catch((err) => {
					console.error(err);
					uni.showModal({ title: '保存失败', content: err.message, showCancel: false });
				})
				.finally(() => {
					uni.hideLoading();
				});
		},
		deleteItem(id) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这条配置吗？',
				success: (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '删除中...' });
						db.collection('a-task-settings')
							.doc(id)
							.remove()
							.then(() => {
								uni.showToast({ title: '删除成功' });
								this.$refs.udb.refresh();
							})
							.catch((err) => {
								uni.showToast({ title: '删除失败', icon: 'none' });
							})
							.finally(() => {
								uni.hideLoading();
							});
					}
				}
			});
		}
	}
};
</script>

<style scoped>
/* 复用你原有的 Utility Classes 风格 */
.page-container {
	min-height: 100vh;
	background-color: #f8fafc;
}
.fixed {
	position: fixed;
}
.inset-0 {
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
}
.z-50 {
	z-index: 50;
}
.max-h-90vh {
	max-height: 90vh;
}
.whitespace-pre-wrap {
	white-space: pre-wrap;
}
/* 如果你使用了 Tailwind 这里的样式大部分是多余的，主要是为了兜底 */
</style>
