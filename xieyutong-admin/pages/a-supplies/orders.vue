<template>
	<view class="p-6 pb-40">
		<view class="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
			<h2 class="text-xl font-bold mb-6 text-gray-800">{{ isEdit ? '编辑' : '新增' }}订单物资记录</h2>

			<uni-forms ref="form" :model="formData" :rules="rules" label-width="100px">
				<uni-forms-item label="关联订单号" name="order_id" required>
					<uni-easyinput v-model="formData.order_id" placeholder="输入订单号" />
				</uni-forms-item>

				<uni-forms-item label="当前状态" name="status" required>
					<uni-data-select v-model="formData.status" :localdata="statusOptions" :clear="false" />
				</uni-forms-item>

				<uni-forms-item label="领用物资" required>
					<view class="border border-gray-200 rounded-lg flex flex-col w-full">
						<view class="flex items-center bg-gray-50 border-b border-gray-200 p-3 text-sm font-bold text-gray-700 w-full">
							<view class="flex-1">选择物资</view>
							<view class="w-32 text-center">数量</view>
							<view class="w-16 text-center">操作</view>
						</view>

						<view class="flex flex-col w-full">
							<view v-if="formData.supplies.length === 0" class="p-4 text-center text-gray-400 text-sm">暂无物资</view>

							<view v-for="(item, index) in formData.supplies" :key="index" class="flex items-center border-b border-gray-100 p-2 relative w-full" :style="{ zIndex: 100 - index }">
								<view class="flex-1 pr-2">
									<custom-picker
										:options="suppliesList"
										label-key="name"
										value-key="_id"
										:value="{ _id: item.id, name: item.name }"
										placeholder="请选择"
										@change="onSupplyChange($event, index)"></custom-picker>
								</view>

								<view class="w-32 flex justify-center">
									<uni-number-box v-model="item.quantity" :min="1" />
								</view>

								<view class="w-16 flex justify-center">
									<uni-icons type="trash" color="#ef4444" size="20" @click="removeSupply(index)" class="cursor-pointer"></uni-icons>
								</view>
							</view>
						</view>

						<view class="p-2 bg-gray-50 border-t border-gray-200 text-center">
							<button
								class="text-brand-orange text-xs bg-white border border-brand-orange py-1.5 px-4 rounded inline-block hover:bg-orange-50 transition-colors"
								@click="addSupply">
								+ 添加物资
							</button>
						</view>
					</view>
				</uni-forms-item>
			</uni-forms>

			<view class="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-100">
				<button class="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm" @click="goBack">取消</button>
				<button class="bg-brand-orange text-white px-6 py-2 rounded-lg text-sm shadow" @click="submit">保存提交</button>
			</view>
		</view>

		<view class="h-20"></view>
	</view>
</template>

<script>
// 引入你的自定义组件
import CustomPicker from '../../components/custom-picker/custom-picker.vue'; // 确保路径正确

const db = uniCloud.database();

export default {
	components: {
		CustomPicker
	},
	data() {
		return {
			isEdit: false,
			// 新增：用于存储从数据库拉取的物资列表
			suppliesList: [],
			formData: {
				order_id: '',
				status: 'created',
				user_id: '',
				supplies: []
			},
			statusOptions: [
				{ value: 'created', text: '待领用' },
				{ value: 'processing', text: '使用中' },
				{ value: 'completed', text: '已归还' }
			],
			rules: {
				status: { rules: [{ required: true, errorMessage: '请选择状态' }] },
				order_id: { rules: [{ required: true, errorMessage: '请输入关联订单号' }] }
			}
		};
	},
	onLoad(options) {
		this.initUser();
		// 重点修改 3: 页面加载时获取物资列表
		this.getSuppliesList();

		if (options.id) {
			this.isEdit = true;
			this.loadDetail(options.id);
		} else {
			this.addSupply();
		}
	},
	methods: {
		// 新增方法：从云数据库拉取物资数据
		async getSuppliesList() {
			try {
				// 如果数据量很大，可能需要分页，这里默认拉取前 500 条
				const res = await db
					.collection('a-supplies')
					.field('_id, name, is_consumable') // 只查需要的字段
					.limit(500)
					.get();
				if (res.result.data) {
					this.suppliesList = res.result.data;
				}
			} catch (e) {
				console.error('获取物资列表失败', e);
				uni.showToast({ title: '物资列表加载失败', icon: 'none' });
			}
		},

		// ... initUser, loadDetail 保持不变 ...
		initUser() {
			// 尝试获取 uni-id 登录信息
			try {
				const userInfo = uniCloud.getCurrentUserInfo();
				if (userInfo && userInfo.uid) {
					this.formData.user_id = userInfo.uid;
				}
			} catch (e) {
				console.error('获取用户信息失败', e);
			}
		},
		async loadDetail(id) {
			uni.showLoading();
			try {
				const res = await db.collection('a-order-supplies').doc(id).get();
				if (res.result.data && res.result.data.length > 0) {
					const data = res.result.data[0];
					if (data.supplies) {
						data.supplies = data.supplies.map((s) => ({
							...s,
							quantity: s.quantity || s.total_quantity || 1
						}));
					}
					this.formData = data;
				}
			} catch (e) {
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		},

		addSupply() {
			this.formData.supplies.push({ id: '', name: '', quantity: 1, is_consumable: false });
			// 滚动逻辑可以保留，体验更好
			this.$nextTick(() => {
				uni.pageScrollTo({
					scrollTop: 99999,
					duration: 300
				});
			});
		},
		removeSupply(index) {
			this.formData.supplies.splice(index, 1);
		},

		// 重点修改 4: 适配 CustomPicker 的 change 事件
		// CustomPicker 传出来的直接是选中的 item 对象，不是 event 对象
		onSupplyChange(selectedItem, index) {
			if (selectedItem) {
				// 更新 ID
				this.formData.supplies[index].id = selectedItem._id;
				// 更新名称
				this.formData.supplies[index].name = selectedItem.name;
				// 更新是否消耗品状态
				this.formData.supplies[index].is_consumable = !!selectedItem.is_consumable;
			}
		},

		// ... submit, goBack 保持不变 ...
		async submit() {
			// 1. 表单校验
			await this.$refs.form.validate();

			// 2. 过滤无效数据
			const validSupplies = this.formData.supplies.filter((s) => s.id);
			if (validSupplies.length === 0) {
				return uni.showToast({ title: '请至少添加一种物资', icon: 'none' });
			}

			if (!this.formData.user_id) {
				this.initUser();
				if (!this.formData.user_id) {
					return uni.showToast({ title: '无法获取用户ID，请重新登录', icon: 'none' });
				}
			}

			const suppliesToSave = validSupplies.map((s) => ({
				id: s.id,
				name: s.name,
				quantity: s.quantity,
				total_quantity: s.quantity,
				is_consumable: s.is_consumable || false
			}));

			const dataToSubmit = {
				...this.formData,
				supplies: suppliesToSave,
				updated_at: Date.now()
			};

			if (!this.isEdit) {
				dataToSubmit.created_at = Date.now();
			}

			uni.showLoading({ title: '保存中' });
			try {
				if (this.isEdit) {
					const { _id, ...updateData } = dataToSubmit;
					await db.collection('a-order-supplies').doc(this.formData._id).update(updateData);
				} else {
					await db.collection('a-order-supplies').add(dataToSubmit);
				}
				uni.hideLoading();
				uni.showToast({ title: '保存成功' });
				setTimeout(() => this.goBack(), 1000);
			} catch (e) {
				uni.hideLoading();
				uni.showToast({ title: '保存失败: ' + e.message, icon: 'none' });
				console.error(e);
			}
		},
		goBack() {
			uni.navigateBack();
		}
	}
};
</script>

<style>
.pb-40 {
	padding-bottom: 10rem;
}
.bg-brand-orange {
	background-color: #eb6d20;
}
.text-brand-orange {
	color: #eb6d20;
}
.border-brand-orange {
	border-color: #eb6d20;
}
/* 可选：如果表格把下拉框挡住了，尝试给 uni-table 的单元格添加 visible 属性。
  但通常去掉容器的 overflow-hidden 并使用 absolute 定位（custom-picker 自带）就足够了。
*/
</style>
