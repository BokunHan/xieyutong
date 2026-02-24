<template>
	<view class="p-6 flex justify-center">
		<view class="w-full max-w-2xl bg-white rounded-xl shadow-sm p-8">
			<h2 class="text-xl font-bold mb-6 text-gray-800">{{ isEdit ? '编辑' : '新增' }}物资</h2>

			<uni-forms ref="form" :model="formData" :rules="rules" label-width="90px">
				<uni-forms-item label="物资名称" name="name" required>
					<uni-easyinput v-model="formData.name" placeholder="例如: 卡式炉" trim="both" />
				</uni-forms-item>

				<uni-forms-item label="物资描述" name="description">
					<uni-easyinput type="textarea" v-model="formData.description" placeholder="请输入物资详细描述" trim="both" />
				</uni-forms-item>

				<view class="flex gap-4">
					<view class="flex-1">
						<uni-forms-item label="单位" name="unit" required>
							<view class="flex gap-2">
								<uni-data-select v-model="formData.unit" :localdata="unitOptions" placeholder="选择" :clear="false" />
								<view class="flex items-center justify-center w-8 h-9 bg-gray-100 rounded cursor-pointer hover:bg-gray-200" @click="openManager('unit')">
									<uni-icons type="gear" size="18" color="#666"></uni-icons>
								</view>
							</view>
						</uni-forms-item>
					</view>
					<view class="flex-1">
						<uni-forms-item label="分类" name="category">
							<view class="flex gap-2">
								<uni-data-select v-model="formData.category" :localdata="categoryOptions" placeholder="选择" :clear="false" />
								<view class="flex items-center justify-center w-8 h-9 bg-gray-100 rounded cursor-pointer hover:bg-gray-200" @click="openManager('category')">
									<uni-icons type="gear" size="18" color="#666"></uni-icons>
								</view>
							</view>
						</uni-forms-item>
					</view>
				</view>

				<uni-forms-item label="物资媒体" name="image">
					<view class="flex flex-wrap gap-3">
						<view v-for="(file, index) in imageValue" :key="index" class="w-24 flex flex-col group">
							<view class="w-24 h-24 relative rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
								<video v-if="file.fileType === 'video'" :src="file.url" class="w-full h-full" :controls="false" :show-center-play-btn="false" object-fit="cover"></video>

								<image v-else :src="file.url" mode="aspectFill" class="w-full h-full cursor-pointer" @click="previewImage(file.url)"></image>

								<view v-if="file.fileType === 'video'" class="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
									<uni-icons type="videocam-filled" size="24" color="rgba(255,255,255,0.9)"></uni-icons>
								</view>

								<view
									@click.stop="removeFile(index)"
									class="absolute top-0 right-0 bg-red-500/90 hover:bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-bl-lg cursor-pointer z-20 transition-colors">
									<uni-icons type="trash" size="12" color="#fff"></uni-icons>
								</view>

								<view v-if="file.status === 'uploading'" class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
									<uni-icons type="spinner-cycle" size="20" color="#fff" class="animate-spin"></uni-icons>
									<text class="text-white text-[10px] mt-1">上传中</text>
								</view>

								<view v-if="file.status === 'error'" class="absolute inset-0 bg-red-500/50 flex items-center justify-center z-10">
									<text class="text-white text-xs font-bold">失败</text>
								</view>
							</view>

							<text class="text-xs text-gray-500 text-center mt-1 truncate px-1 select-none w-full block">
								{{ file.name || '未命名' }}
							</text>
						</view>

						<view class="w-24 h-24" v-if="imageValue.length < 9">
							<uni-file-picker
								v-model="pickerTemp"
								:limit="9 - imageValue.length"
								file-mediatype="all"
								return-type="object"
								:image-styles="uploadBoxStyle"
								:del-icon="false"
								@select="handleMediaSelect" />
						</view>
					</view>

					<view class="text-xs text-gray-400 mt-2 flex justify-between">
						<text>支持图片或视频，最多9个</text>
						<text v-if="uploadingCount > 0" class="text-brand-orange animate-pulse">{{ uploadingCount }} 个文件上传中...</text>
					</view>
				</uni-forms-item>

				<uni-forms-item label="初始库存">
					<uni-number-box v-model="formData.stock" :min="0" :max="9999" />
				</uni-forms-item>

				<uni-forms-item label="分配方式" required>
					<uni-data-checkbox
						v-model="formData.allocation_type"
						:localdata="[
							{ text: '按人分配 (数量=人数)', value: 'person' },
							{ text: '按团分配 (数量固定)', value: 'group' }
						]" />
				</uni-forms-item>

				<uni-forms-item label="属性设置">
					<view class="flex items-center h-full pt-1">
						<view class="flex items-center mr-4">
							<switch :checked="formData.is_consumable" @change="formData.is_consumable = $event.detail.value" color="#eb6d20" style="transform: scale(0.7)" />
							<text class="text-sm ml-1 text-gray-600 cursor-pointer" @click="formData.is_consumable = !formData.is_consumable">
								{{ formData.is_consumable ? '消耗品 (无需归还)' : '非消耗品 (需归还)' }}
							</text>
						</view>
					</view>
				</uni-forms-item>

				<uni-forms-item label="默认配置">
					<view class="flex items-center h-full pt-1">
						<switch :checked="formData.is_default" @change="formData.is_default = $event.detail.value" color="#eb6d20" style="transform: scale(0.7)" />
						<text class="text-sm ml-2 text-gray-500">
							{{ formData.is_default ? '自动加入新订单' : '仅手动添加' }}
						</text>
					</view>
				</uni-forms-item>

				<uni-forms-item label="启用状态">
					<switch :checked="formData.status" @change="formData.status = $event.detail.value" color="#10b981" style="transform: scale(0.7)" />
				</uni-forms-item>
			</uni-forms>

			<view class="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
				<button class="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm" @click="goBack">取消</button>
				<button
					class="text-white px-6 py-2 rounded-lg text-sm shadow-md transition-all"
					:class="uploadingCount > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600'"
					:disabled="uploadingCount > 0"
					@click="submit">
					{{ uploadingCount > 0 ? '资源上传中...' : '保存提交' }}
				</button>
			</view>
		</view>

		<view v-if="showManager" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
			<view class="bg-white w-80 rounded-xl p-5 shadow-xl">
				<view class="flex justify-between items-center mb-4">
					<h3 class="font-bold text-gray-800">管理{{ managerType === 'unit' ? '单位' : '分类' }}选项</h3>
					<uni-icons type="closeempty" size="20" color="#999" @click="showManager = false"></uni-icons>
				</view>
				<view class="flex gap-2 mb-4">
					<uni-easyinput v-model="newOptionVal" placeholder="输入新选项" class="flex-1" :inputBorder="true" />
					<button class="bg-emerald-600 text-white text-sm px-3 py-1.5 rounded" @click="addOption" :disabled="loadingOptions">添加</button>
				</view>
				<scroll-view scroll-y class="max-h-48 border-t border-gray-100 pt-2">
					<view v-if="loadingOptions" class="text-center py-4 text-gray-400 text-xs">同步中...</view>
					<template v-else>
						<view v-for="(opt, idx) in currentManagerList" :key="idx" class="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
							<text class="text-gray-700 text-sm">{{ opt.text }}</text>
							<uni-icons type="trash" size="16" color="#ef4444" class="cursor-pointer" @click="removeOption(idx)"></uni-icons>
						</view>
						<view v-if="currentManagerList.length === 0" class="text-center text-gray-400 py-4 text-xs">暂无选项</view>
					</template>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const DEFAULT_UNITS = ['个', '箱', '套', '包', '瓶'];
const DEFAULT_CATEGORIES = ['露营装备', '餐饮用具', '水上用品', '急救安全', '其他'];

export default {
	data() {
		return {
			isEdit: false,
			uploadingCount: 0,

			// 主数据列表
			imageValue: [],

			// 仅用于 uni-file-picker 触发选择的临时变量
			pickerTemp: [],

			// 上传框样式 (96px 约等于 w-24)
			uploadBoxStyle: {
				width: '96px',
				height: '96px',
				background: '#f9fafb',
				border: '1px solid #e5e7eb',
				borderRadius: '8px'
			},

			formData: {
				name: '',
				description: '',
				unit: '',
				image: [],
				category: '',
				stock: 10,
				allocation_type: 'person',
				is_consumable: false,
				is_default: false,
				status: true
			},
			unitOptions: [],
			categoryOptions: [],
			showManager: false,
			managerType: 'unit',
			newOptionVal: '',
			loadingOptions: false,
			configId: null,
			rules: {
				name: { rules: [{ required: true, errorMessage: '请输入名称' }] },
				unit: { rules: [{ required: true, errorMessage: '请输入单位' }] }
			}
		};
	},
	computed: {
		currentManagerList() {
			return this.managerType === 'unit' ? this.unitOptions : this.categoryOptions;
		}
	},
	onLoad(options) {
		this.loadOptionsFromDB();
		if (options.id) {
			this.isEdit = true;
			this.loadDetail(options.id);
		}
	},
	methods: {
		async loadOptionsFromDB() {
			try {
				const res = await db.collection('a-supplies').where({ is_config: true }).get();
				if (res.result.data.length > 0) {
					const config = res.result.data[0];
					this.configId = config._id;
					this.mapOptions(config.unit_options, config.category_options);
				} else {
					const initData = {
						is_config: true,
						name: '系统选项配置(请勿删除)',
						unit: '无',
						unit_options: DEFAULT_UNITS,
						category_options: DEFAULT_CATEGORIES,
						stock: -999,
						status: false
					};
					const addRes = await db.collection('a-supplies').add(initData);
					this.configId = addRes.result.id;
					this.mapOptions(DEFAULT_UNITS, DEFAULT_CATEGORIES);
				}
			} catch (e) {
				console.error('加载选项失败', e);
				this.mapOptions(DEFAULT_UNITS, DEFAULT_CATEGORIES);
			}
		},

		mapOptions(units, cats) {
			this.unitOptions = (units || []).map((v) => ({ value: v, text: v }));
			this.categoryOptions = (cats || []).map((v) => ({ value: v, text: v }));
		},

		openManager(type) {
			this.managerType = type;
			this.newOptionVal = '';
			this.showManager = true;
		},

		async addOption() {
			if (!this.newOptionVal.trim()) return;
			const val = this.newOptionVal.trim();
			const list = this.managerType === 'unit' ? this.unitOptions : this.categoryOptions;
			if (list.some((item) => item.value === val)) {
				uni.showToast({ title: '选项已存在', icon: 'none' });
				return;
			}
			list.push({ value: val, text: val });
			this.newOptionVal = '';
			await this.saveOptionsToDB();
		},

		async removeOption(idx) {
			const list = this.managerType === 'unit' ? this.unitOptions : this.categoryOptions;
			list.splice(idx, 1);
			await this.saveOptionsToDB();
		},

		async saveOptionsToDB() {
			if (!this.configId) return;
			this.loadingOptions = true;
			try {
				const units = this.unitOptions.map((i) => i.value);
				const cats = this.categoryOptions.map((i) => i.value);
				await db.collection('a-supplies').doc(this.configId).update({
					unit_options: units,
					category_options: cats
				});
			} catch (e) {
				uni.showToast({ title: '同步失败', icon: 'none' });
				console.error(e);
			} finally {
				this.loadingOptions = false;
			}
		},

		async loadDetail(id) {
			uni.showLoading();
			try {
				const res = await db.collection('a-supplies').doc(id).get();
				const data = res.result.data[0];

				if (data.is_consumable === undefined) {
					data.is_consumable = false;
				}

				if (data.is_default === undefined) {
					data.is_default = false;
				}

				if (!data.allocation_type) {
					data.allocation_type = 'person';
				}

				if (data.image) {
					let rawImages = [];
					if (typeof data.image === 'string') {
						rawImages = [{ url: data.image }];
					} else if (Array.isArray(data.image)) {
						rawImages = data.image;
					}

					data.image = rawImages.map((img) => {
						const url = img.url || '';
						const isVideo = url.match(/\.(mp4|mov|avi|m4v|webm)(\?|$)/i) || img.type === 'video';
						return {
							url: url,
							extname: isVideo ? 'mp4' : 'jpg',
							name: img.name || (isVideo ? '视频文件.mp4' : '图片文件.jpg'),
							fileType: isVideo ? 'video' : 'image',
							status: 'success'
						};
					});
				}

				this.formData = data;
				this.imageValue = this.formData.image || [];
			} catch (e) {
				console.error('加载详情失败', e);
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		},

		previewImage(url) {
			uni.previewImage({ urls: [url] });
		},

		removeFile(index) {
			// 如果该文件正在上传，需要减少计数
			if (this.imageValue[index].status === 'uploading') {
				this.uploadingCount = Math.max(0, this.uploadingCount - 1);
			}
			this.imageValue.splice(index, 1);
		},

		// 新的上传处理逻辑：处理 picker 选中的新文件
		async handleMediaSelect(e) {
			const newFiles = e.tempFiles;
			if (!newFiles || newFiles.length === 0) return;

			// 1. 立即重置 picker，让它保持“+”号状态
			this.$nextTick(() => {
				this.pickerTemp = [];
			});

			// 2. 将新文件格式化并添加到主列表
			const processingFiles = newFiles.map((file) => {
				let fileType = 'image';
				const fileName = (file.name || '').toLowerCase();
				if (fileName.match(/\.(mp4|mov|avi|m4v|webm)$/) || file.fileType === 'video') {
					fileType = 'video';
				}

				return {
					url: file.url || file.path, // 临时地址
					name: file.name,
					fileType: fileType,
					status: 'uploading',
					progress: 0
				};
			});

			// 添加到 UI 列表
			this.imageValue.push(...processingFiles);

			// 3. 增加锁计数
			this.uploadingCount += processingFiles.length;

			// 4. 并行上传所有新文件
			processingFiles.forEach(async (fileObj) => {
				try {
					const randomString = Math.random().toString(36).substring(2, 10);
					const cloudPath = `supplies-media/${Date.now()}-${randomString}.${fileObj.fileType === 'video' ? 'mp4' : 'jpg'}`;

					console.log(`开始上传: ${fileObj.name}`);
					const uploadRes = await uniCloud.uploadFile({
						filePath: fileObj.url,
						cloudPath: cloudPath,
						fileType: fileObj.fileType
					});

					// 上传成功：更新为云端地址
					fileObj.url = uploadRes.fileID;
					fileObj.status = 'success';
				} catch (err) {
					console.error(`上传失败: ${fileObj.name}`, err);
					fileObj.status = 'error';
					uni.showToast({ title: `${fileObj.name} 上传失败`, icon: 'none' });
				} finally {
					// 释放锁
					this.uploadingCount = Math.max(0, this.uploadingCount - 1);
				}
			});
		},

		async submit() {
			if (this.uploadingCount > 0) {
				uni.showToast({ title: '还有文件正在上传中', icon: 'none' });
				return;
			}

			await this.$refs.form.validate();
			uni.showLoading({ title: '保存中' });

			try {
				// 过滤掉上传失败的（只保留成功的云端地址）
				const finalMediaList = this.imageValue
					.filter((file) => file.status === 'success' && (file.url.startsWith('http') || file.url.startsWith('cloud://')))
					.map((file) => ({
						url: file.url,
						type: file.fileType,
						name: file.name
					}));

				const dataToSave = {
					...this.formData,
					image: finalMediaList
				};
				delete dataToSave.file_type;

				if (this.isEdit) {
					const { _id, ...updateData } = dataToSave;
					await db.collection('a-supplies').doc(this.formData._id).update(updateData);
				} else {
					await db.collection('a-supplies').add(dataToSave);
				}

				uni.hideLoading();
				uni.showToast({ title: '保存成功' });

				setTimeout(() => {
					this.goBack();
				}, 1000);
			} catch (e) {
				uni.hideLoading();
				console.error(e);
				uni.showToast({ title: '保存失败: ' + e.message, icon: 'none' });
			}
		},

		goBack() {
			uni.navigateBack();
		}
	}
};
</script>

<style>
.animate-pulse {
	animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}
/* 确保视频组件可以撑满容器 */
video {
	width: 100%;
	height: 100%;
}
</style>
