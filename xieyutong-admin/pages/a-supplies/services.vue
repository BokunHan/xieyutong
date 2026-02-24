<template>
	<view class="p-6">
		<view class="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
			<h2 class="text-xl font-bold mb-6 text-gray-800">{{ isEdit ? '编辑' : '新增' }}服务配置</h2>

			<uni-forms ref="form" :model="formData" :rules="rules" label-width="100px">
				<uni-forms-item label="服务名称" name="name" required>
					<uni-easyinput v-model="formData.name" placeholder="如: 户外烧烤套餐" />
				</uni-forms-item>

				<uni-forms-item label="描述" name="description">
					<uni-easyinput type="textarea" v-model="formData.description" placeholder="简要描述包含的内容" />
				</uni-forms-item>

				<uni-forms-item label="关联物资" required>
					<view class="border border-gray-200 rounded-lg flex flex-col w-full">
						<view class="flex items-center bg-gray-50 border-b border-gray-200 p-3 text-sm font-bold text-gray-700 w-full">
							<view class="flex-1">选择物资</view>
							<view class="w-32 pl-2">数量</view>
							<view class="w-16 text-center">操作</view>
						</view>

						<view class="flex flex-col w-full">
							<view v-if="formData.supplies.length === 0" class="p-4 text-center text-gray-400 text-sm">暂无物资配置</view>

							<view v-for="(item, index) in formData.supplies" :key="index" class="flex items-center border-b border-gray-100 p-2 w-full">
								<view class="flex-1 pr-2">
									<uni-data-picker
										v-model="item.id"
										collection="a-supplies"
										field="_id as value, name as text, is_consumable, allocation_type"
										placeholder="请选择"
										:border="false"
										@change="onSupplyChange($event, index)" />
								</view>

								<view class="w-32">
									<view class="h-9 flex items-center">
										<uni-number-box v-if="item.allocation_type === 'group'" v-model="item.quantity" :min="1" />
										<text v-else class="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded">按人数分配</text>
									</view>
								</view>

								<view class="w-16 flex justify-center">
									<uni-icons type="trash" color="#ef4444" size="20" @click="removeSupply(index)" class="cursor-pointer"></uni-icons>
								</view>
							</view>
						</view>

						<view class="p-2 bg-gray-50 border-t border-gray-200">
							<button class="w-full text-brand-orange text-sm bg-white border border-brand-orange py-2 rounded hover:bg-orange-50 transition-colors" @click="addSupply">
								+ 添加物资项
							</button>
						</view>
					</view>
				</uni-forms-item>

				<uni-forms-item label="默认配置">
					<view class="flex items-center h-full pt-1">
						<switch :checked="formData.is_default" @change="formData.is_default = $event.detail.value" color="#eb6d20" style="transform: scale(0.8)" />
						<text class="text-sm ml-2 text-gray-500">
							{{ formData.is_default ? '自动加入新订单' : '仅手动添加' }}
						</text>
					</view>
				</uni-forms-item>

				<uni-forms-item label="启用状态">
					<switch :checked="formData.status" @change="formData.status = $event.detail.value" color="#eb6d20" style="transform: scale(0.8)" />
				</uni-forms-item>
			</uni-forms>

			<view class="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-100">
				<button class="bg-gray-100 text-gray-700 px-8 py-2 rounded-lg text-sm" @click="goBack">取消</button>
				<button class="bg-brand-orange text-white px-8 py-2 rounded-lg text-sm shadow" @click="submit">保存提交</button>
			</view>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
import { toRaw } from 'vue';

export default {
	data() {
		return {
			isEdit: false,
			suppliesMap: {},
			formData: {
				name: '',
				description: '',
				is_default: false,
				status: true,
				supplies: [] // [{id: '...', quantity: 1}]
			},
			rules: {
				name: { rules: [{ required: true, errorMessage: '请输入名称' }] }
			}
		};
	},
	onLoad(options) {
		this.loadAllSupplies();

		if (options.id) {
			this.isEdit = true;
			this.loadDetail(options.id);
		}
	},
	methods: {
		// 拉取所有物资
		async loadAllSupplies() {
			try {
				const res = await db.collection('a-supplies').field('_id, name, is_consumable, allocation_type').limit(500).get();

				res.result.data.forEach((item) => {
					this.suppliesMap[item._id] = item;
				});
			} catch (e) {
				console.error('预加载物资失败', e);
			}
		},

		async loadDetail(id) {
			uni.showLoading();
			try {
				// 第一步：获取服务详情 (单表)
				const serviceRes = await db.collection('a-services').doc(id).get();
				const serviceData = serviceRes.result.data[0];

				if (serviceData.supplies && serviceData.supplies.length > 0) {
					// 提取该服务关联的所有物资ID
					const supplyIds = serviceData.supplies.map((s) => s.id);

					// 第二步：去 a-supplies 表查询这些物资的最新属性
					const supplyRes = await db
						.collection('a-supplies')
						.where({
							_id: db.command.in(supplyIds)
						})
						.field('_id, name, is_consumable, allocation_type')
						.get();

					// 建立临时字典方便查找
					const supplyInfoMap = {};
					supplyRes.result.data.forEach((s) => {
						supplyInfoMap[s._id] = s;
					});

					// 第三步：合并数据
					serviceData.supplies = serviceData.supplies.map((item) => {
						const latestInfo = supplyInfoMap[item.id] || {};
						return {
							id: item.id,
							quantity: item.quantity,
							// 使用最新查到的名称和属性，而不是服务表里可能过期的
							name: latestInfo.name || '未知物资',
							is_consumable: !!latestInfo.is_consumable,
							allocation_type: latestInfo.allocation_type || 'person'
						};
					});
				}

				this.formData = serviceData;
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		},
		addSupply() {
			this.formData.supplies.push({ id: '', name: '', quantity: 1, is_consumable: true, allocation_type: 'person' });
		},
		removeSupply(index) {
			this.formData.supplies.splice(index, 1);
		},
		onSupplyChange(e, index) {
			// 1. 处理清空
			if (!e.detail.value || e.detail.value.length === 0) {
				const emptyItem = {
					id: '',
					name: '',
					quantity: 1,
					is_consumable: false,
					allocation_type: 'person'
				};
				this.formData.supplies.splice(index, 1, emptyItem);
				return;
			}

			// 2. 获取选中的 ID
			const selectedNode = e.detail.value[e.detail.value.length - 1];
			const selectedId = selectedNode.value;

			// 3. 直接从本地字典中查找完整数据
			const fullInfo = this.suppliesMap[selectedId];

			if (fullInfo) {
				const currentItem = this.formData.supplies[index];

				const newItem = {
					...currentItem,
					id: fullInfo._id,
					name: fullInfo.name,
					is_consumable: !!fullInfo.is_consumable,
					allocation_type: fullInfo.allocation_type || 'person',
					quantity: 1
				};

				// 4. 更新视图
				this.formData.supplies.splice(index, 1, newItem);
			} else {
				console.warn('本地缓存未找到该物资:', selectedId);
			}
		},
		async submit() {
			await this.$refs.form.validate();
			// 过滤无效的空物资项
			const validSupplies = this.formData.supplies
				.filter((s) => s.id)
				.map((s) => ({
					...s,
					is_consumable: s.is_consumable || false, // 确保有默认值
					allocation_type: s.allocation_type || 'person'
				}));

			// 简单克隆数据避免引用问题
			const dataToSubmit = {
				...this.formData,
				supplies: validSupplies
			};

			uni.showLoading({ title: '保存中' });
			try {
				if (this.isEdit) {
					// update时不能带_id
					const { _id, ...updateData } = dataToSubmit;
					await db.collection('a-services').doc(this.formData._id).update(updateData);
				} else {
					await db.collection('a-services').add(dataToSubmit);
				}
				uni.hideLoading();
				uni.showToast({ title: '保存成功' });
				setTimeout(() => this.goBack(), 1000);
			} catch (e) {
				uni.hideLoading();
				uni.showToast({ title: '保存失败', icon: 'none' });
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
.bg-brand-orange {
	background-color: #eb6d20;
}
.text-brand-orange {
	color: #eb6d20;
}
.border-brand-orange {
	border-color: #eb6d20;
}
</style>
