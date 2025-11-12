<template>
	<view>
		<view class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
			<uni-table :loading="loading" border emptyText="暂无数据">
				<uni-tr>
					<uni-th align="center" width="120">会员等级</uni-th>
					<uni-th align="center">等级名称</uni-th>
					<uni-th align="center">升级门槛 (元)</uni-th>
					<uni-th align="center">折扣率</uni-th>
					<uni-th align="center" width="180">操作</uni-th>
				</uni-tr>
				<uni-tr v-for="item in memberList" :key="item.key">
					<uni-td align="center">
						<uni-tag :text="item.title" :class="getLevelTagClass(item.key)" />
					</uni-td>
					<uni-td align="center">
						<view class="font-semibold text-gray-800">{{ item.title }}</view>
					</uni-td>
					<uni-td align="center">
						<view class="text-gray-800">{{ item.required_consumption }}</view>
					</uni-td>
					<uni-td align="center">
						<view class="font-semibold" :class="item.discount_rate < 1 ? 'text-green-600' : 'text-gray-500'">{{ item.discount_rate * 100 }}%</view>
					</uni-td>
					<uni-td align="center">
						<view class="flex justify-center space-x-3">
							<button @click="openForm(item)" class="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">编辑</button>
							<button v-if="item.key !== 'normal'" @click="deleteLevel(item)" class="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
								删除
							</button>
						</view>
					</uni-td>
				</uni-tr>
			</uni-table>
		</view>

		<uni-popup ref="formPopup" type="dialog">
			<uni-popup-dialog mode="form" :title="formTitle" :before-close="true" @confirm="submitForm" @close="closeForm">
				<view class="form-content space-y-4 p-4">
					<view>
						<text class="form-label">等级Key (唯一标识)</text>
						<uni-easyinput v-model="formData.key" :disabled="isEdit" placeholder="例如: platinum" :styles="inputStyles" />
						<text class="text-xs text-gray-500 mt-1 block">用于程序内部识别，创建后不可修改。</text>
					</view>
					<view>
						<text class="form-label">等级名称</text>
						<uni-easyinput v-model="formData.title" placeholder="例如：白金会员" :styles="inputStyles" />
					</view>
					<view>
						<text class="form-label">升级门槛 (单位: 元)</text>
						<uni-easyinput type="number" v-model.number="formData.required_consumption" placeholder="例如: 5000 (代表5000元)" :styles="inputStyles" />
					</view>
					<view>
						<text class="form-label">折扣率 (0 到 1 之间)</text>
						<uni-easyinput type="number" v-model.number="formData.discount_rate" placeholder="例如: 0.95 (代表95折)" :styles="inputStyles" />
						<text class="text-xs text-gray-500 mt-1 block">1 = 不打折, 0.95 = 95折, 0.9 = 9折</text>
					</view>
				</view>
			</uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script>
const db = uniCloud.database();
// 这是你要管理的数据库文档 ID
const configDocId = 'config_member_upgrade';

export default {
	data() {
		return {
			loading: false,
			memberConfig: [],
			formTitle: '',
			formData: {}, // 存储弹窗中正在编辑的 *单个* 等级 { key: 'normal', title: '...', ... }
			isEdit: false, // 标记当前是新增还是编辑
			// 表单输入框样式
			inputStyles: {
				borderColor: '#d1d5db',
				fontSize: '16px'
			}
		};
	},
	computed: {
		memberList() {
			if (!this.memberConfig || this.memberConfig.length === 0) {
				return [];
			}
			return [...this.memberConfig].sort((a, b) => a.required_consumption - b.required_consumption);
		}
	},
	created() {
		this.loadData();
	},
	methods: {
		// 加载数据
		async loadData() {
			this.loading = true;
			try {
				const res = await db.collection('a-system-configs').doc(configDocId).field('config_value').get();

				if (res.result.data.length > 0) {
					this.memberConfig = res.result.data[0].config_value;
				} else {
					uni.showToast({
						title: '未找到会员配置',
						icon: 'error'
					});
				}
			} catch (error) {
				console.error('会员配置加载失败:', error);
				uni.showToast({
					title: '配置加载失败',
					icon: 'error'
				});
			} finally {
				this.loading = false;
			}
		},

		// 定义空表单
		getEmptyFormData() {
			return {
				key: '',
				title: '',
				required_consumption: 0,
				discount_rate: 1
			};
		},

		// 打开弹窗 (新增/编辑) - (此方法由父组件通过 ref 调用)
		openForm(item = null) {
			if (item) {
				// 编辑
				this.isEdit = true;
				this.formTitle = `编辑: ${item.title}`;
				// 深拷贝，防止表单修改时直接影响表格
				this.formData = JSON.parse(JSON.stringify(item));
			} else {
				// 新增
				this.isEdit = false;
				this.formTitle = '新增会员等级';
				this.formData = this.getEmptyFormData();
			}
			this.$refs.formPopup.open();
		},

		// 关闭弹窗
		closeForm() {
			this.$refs.formPopup.close();
			this.formData = {};
		},

		// 提交表单 (新增/更新)
		async submitForm() {
			// 基础验证
			if (!this.formData.key) {
				uni.showToast({ title: '等级Key不能为空', icon: 'none' });
				return;
			}
			if (!this.formData.title) {
				uni.showToast({ title: '等级名称不能为空', icon: 'none' });
				return;
			}

			this.loading = true;
			try {
				const keyToUpdate = this.formData.key;

				let newConfigValue = JSON.parse(JSON.stringify(this.memberConfig));

				const newItem = {
					key: this.formData.key,
					title: this.formData.title,
					required_consumption: Number(this.formData.required_consumption) || 0,
					discount_rate: Number(this.formData.discount_rate) || 1
				};

				if (this.isEdit) {
					const index = newConfigValue.findIndex((item) => item.key === keyToUpdate);
					if (index > -1) {
						newConfigValue[index] = newItem;
					} else {
						newConfigValue.push(newItem);
					}
				} else {
					if (newConfigValue.some((item) => item.key === keyToUpdate)) {
						uni.showToast({ title: `Key "${keyToUpdate}" 已存在`, icon: 'error' });
						this.loading = false;
						return;
					}
					newConfigValue.push(newItem);
				}

				await db.collection('a-system-configs').doc(configDocId).update({
					config_value: newConfigValue
				});

				uni.showToast({
					title: this.isEdit ? '更新成功' : '新增成功',
					icon: 'success'
				});

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

		// 删除等级
		async deleteLevel(item) {
			if (item.key === 'normal') {
				uni.showToast({ title: '不能删除 "normal" 基础等级', icon: 'none' });
				return;
			}

			this.$confirm(`确定要删除 "${item.title}" 等级吗？`, '确认删除', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'warning'
			})
				.then(async () => {
					this.loading = true;
					try {
						let newConfigValue = this.memberConfig.filter((level) => level.key !== item.key);

						const res = await db.collection('a-system-configs').doc(configDocId).update({
							config_value: newConfigValue
						});

						if (res.result.updated > 0) {
							uni.showToast({ title: '删除成功', icon: 'success' });
							this.loadData();
						} else {
							uni.showToast({ title: '操作未生效', icon: 'error' });
						}
					} catch (error) {
						console.error('删除失败:', error);
						uni.showToast({ title: '删除失败', icon: 'error' });
					} finally {
						this.loading = false;
					}
				})
				.catch(() => {
					// 用户取消删除
				});
		},

		getLevelTagClass(key) {
			switch (key) {
				case 'diamond':
					return 'level-diamond';
				case 'gold':
					return 'level-gold';
				case 'silver':
					return 'level-silver';
				case 'normal':
				default:
					return 'level-normal';
			}
		}
	}
};
</script>

<style scoped>
::v-deep .uni-tag.level-normal {
	background-color: #f4f4f5;
	color: #909399;
	border: 1px solid #e9e9eb;
}
::v-deep .uni-tag.level-silver {
	background-color: #e5e7eb;
	color: #374151;
	border: 1px solid #d1d5db;
}
::v-deep .uni-tag.level-gold {
	background-color: #fdf6ec;
	color: #e6a23c;
	border: 1px solid #faecd8;
}
::v-deep .uni-tag.level-diamond {
	background-color: #ecf5ff;
	color: #409eff;
	border: 1px solid #d9ecff;
}
</style>
