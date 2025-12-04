<template>
	<view>
		<view class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
			<uni-table :loading="loading" border emptyText="暂无数据">
				<uni-tr>
					<uni-th align="center" width="80">排序</uni-th>
					<uni-th align="center" width="120">图片/视频</uni-th>
					<uni-th align="left">标题 / 副标题</uni-th>
					<uni-th align="left">跳转链接</uni-th>
					<uni-th align="center" width="100">状态</uni-th>
					<uni-th align="center" width="180">操作</uni-th>
				</uni-tr>
				<uni-tr v-for="item in bannerList" :key="item._id">
					<uni-td align="center">{{ item.sort_order }}</uni-td>
					<uni-td align="center">
						<view class="relative inline-block w-24 h-12">
							<video
								v-if="item.media_type === 'video'"
								:src="item.image"
								class="w-24 h-12 rounded bg-black"
								:muted="true"
								:controls="false"
								:show-play-btn="false"
								:show-center-play-btn="false"
								object-fit="cover"></video>
							<image v-else :src="item.image" mode="aspectFill" class="w-24 h-12 rounded" />
							<view v-if="item.media_type === 'video'" class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded pointer-events-none">
								<uni-icons type="videocam-filled" color="rgba(255,255,255,0.6)" size="24"></uni-icons>
							</view>
						</view>
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
							<text class="form-label">媒体类型</text>
							<uni-data-select
								v-model="formData.media_type"
								:localdata="[
									{ value: 'image', text: '图片' },
									{ value: 'video', text: '视频' }
								]"
								:clear="false" />
						</view>
						<view v-if="formData.media_type === 'image'">
							<text class="form-label">显示区域调整</text>
							<view class="flex items-center">
								<button type="primary" size="mini" class="w-full" @click="openCropper" :disabled="!formData.image || formData.image.length === 0">
									{{ formData.object_position ? '已调整 (点击修改)' : '点击调整显示区域' }}
								</button>
							</view>
							<text class="text-xs text-gray-400 mt-1" v-if="!formData.image">请先上传图片</text>
						</view>
						<view>
							<text class="form-label">标题</text>
							<uni-easyinput v-model="formData.title" placeholder="请输入标题" :styles="inputStyles" />
						</view>
						<view>
							<text class="form-label">副标题</text>
							<uni-easyinput v-model="formData.subtitle" placeholder="请输入副标题" :styles="inputStyles" />
						</view>
					</view>

					<uni-popup ref="cropperPopup" type="center" :mask-click="false">
						<view class="bg-white rounded-lg overflow-hidden flex flex-col" style="width: 680rpx">
							<view class="p-4 border-b border-gray-200">
								<text class="font-bold text-lg block">调整显示区域</text>
								<text class="text-xs text-gray-500">拖动图片调整位置，双指或滑块缩放</text>
							</view>

							<view class="relative w-full bg-black flex items-center justify-center overflow-hidden" style="height: 600rpx">
								<movable-area v-if="container.width" :style="{ width: container.width + 'px', height: container.height + 'px' }" class="relative">
									<movable-view
										direction="all"
										:x="imgState.x"
										:y="imgState.y"
										:style="{ width: imgBase.width * imgState.scale + 'px', height: imgBase.height * imgState.scale + 'px' }"
										@change="onMovableChange">
										<image :src="cropperImage" class="w-full h-full" style="display: block" />
									</movable-view>
								</movable-area>

								<view
									v-if="container.width"
									class="absolute border-2 border-green-400 pointer-events-none z-10"
									:style="{ width: container.width + 'px', height: container.height + 'px' }">
									<view class="absolute top-1/2 left-0 w-full border-t border-white opacity-30 dashed"></view>
									<view class="absolute left-1/2 top-0 h-full border-l border-white opacity-30 dashed"></view>
								</view>

								<view class="absolute bottom-4 text-white text-xs opacity-70 pointer-events-none z-20">绿框内为实际显示区域</view>

								<image :src="cropperImage" class="fixed opacity-0 -z-10" style="width: 1px; height: 1px" @load="onImageLoad" />
							</view>

							<view class="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
								<view class="flex items-center space-x-3">
									<uni-icons type="minus" size="20" color="#666" @click="stepScale(-0.1)"></uni-icons>
									<slider class="flex-1" :value="imgState.scale" :min="1" :max="3" :step="0.05" activeColor="#10b981" @changing="onSliderChange" />
									<uni-icons type="plus" size="20" color="#666" @click="stepScale(0.1)"></uni-icons>
								</view>

								<view class="flex justify-end space-x-3">
									<button size="mini" @click="closeCropper">取消</button>
									<button size="mini" type="primary" class="bg-blue-600" @click="confirmCropper">确认保存</button>
								</view>
							</view>
						</view>
					</uni-popup>

					<view class="grid grid-cols-2 gap-4">
						<view>
							<text class="form-label">按钮名称</text>
							<uni-easyinput v-model="formData.button_name" placeholder="例如：立即预订" :styles="inputStyles" />
						</view>
						<view>
							<text class="form-label">{{ formData.media_type === 'video' ? '上传视频' : '上传图片' }}</text>
							<uni-file-picker
								v-model="formData.image"
								limit="1"
								:file-mediatype="formData.media_type || 'image'"
								@success="handleImageUploadSuccess"
								@delete="handleImageDelete"
								mode="grid"
								:title="formData.media_type === 'video' ? '建议格式 mp4' : '建议尺寸 750x450'" />
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
			},
			// 裁剪器数据
			cropperImage: '',
			container: { width: 0, height: 0 }, // 绿框尺寸
			imgBase: { width: 0, height: 0 }, // 图片基础尺寸 (scale=1时)
			imgState: { x: 0, y: 0, scale: 1 }, // 状态
			currentDetail: { x: 0, y: 0 } // 实时坐标
		};
	},
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
				media_type: 'image',
				object_position: 'center',
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
				// 编辑模式
				this.formTitle = '编辑轮播图';

				// --- 修改开始：智能解析文件名和后缀 ---
				let imageData = [];
				if (item.image) {
					let fileName = 'unknown-file';
					let fileExt = 'jpg';

					try {
						// 1. 尝试从 URL 中分割出文件名
						// 例如：https://.../uploads/promo-video.mp4
						const urlParts = item.image.split('/');
						const fullName = urlParts[urlParts.length - 1]; // 拿到 "promo-video.mp4"

						if (fullName) {
							fileName = fullName;
							// 2. 尝试从文件名分割出后缀
							const nameParts = fullName.split('.');
							if (nameParts.length > 1) {
								fileExt = nameParts[nameParts.length - 1]; // 拿到 "mp4"
							}
						}
					} catch (e) {
						// 解析出错时的兜底逻辑
						console.warn('文件名解析失败，使用默认值');
					}

					// 3. 如果是视频类型，但后缀解析出来还是 jpg (比如 URL 没有后缀的情况)，强制修正
					if (item.media_type === 'video' && (fileExt === 'jpg' || fileExt === 'png')) {
						fileExt = 'mp4';
						if (fileName === 'unknown-file') fileName = 'video.mp4';
					}

					// 4. 组装 uni-file-picker 需要的对象
					imageData = [
						{
							url: item.image,
							name: fileName, // 这里决定了界面上显示的名称
							extname: fileExt // 这里决定了图标样式
						}
					];
				}
				// --- 修改结束 ---

				this.formData = { ...item, image: imageData };
			} else {
				// 新增模式
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
		},

		getFormDataImage() {
			// 兼容 uni-file-picker 的数据格式 (数组) 和直接字符串 url
			if (Array.isArray(this.formData.image) && this.formData.image.length > 0) {
				// 如果是 file-picker 返回的数组格式 [{url: '...'}]
				return this.formData.image[0].url;
			} else if (typeof this.formData.image === 'string') {
				// 如果已经是字符串格式
				return this.formData.image;
			}
			return '';
		},

		// 打开裁剪器
		openCropper() {
			const imgUrl = this.getFormDataImage();
			if (!imgUrl) return uni.showToast({ title: '请先上传图片', icon: 'none' });

			this.cropperImage = imgUrl;

			// 设定绿框大小 (固定比例 750:450)
			// 弹窗宽约 340px (680rpx) -> 留点边距 -> 设为 320px
			const winW = 320;
			const winH = 320 / (750 / 450); // 保持和前端一致的比例

			this.container = { width: winW, height: winH };
			this.imgBase = { width: 0, height: 0 }; // 等待 onload
			this.imgState = { x: 0, y: 0, scale: 1 };

			this.$refs.cropperPopup.open();
		},

		closeCropper() {
			this.$refs.cropperPopup.close();
		},

		// 图片加载完毕：计算基础尺寸 & 恢复历史状态
		onImageLoad(e) {
			const { width, height } = e.detail; // 原图尺寸
			const ratio = width / height;

			const winW = this.container.width;
			const winH = this.container.height;
			const winRatio = winW / winH;

			let baseW, baseH;

			// 1. 计算 cover 尺寸：确保短边填满绿框
			if (ratio > winRatio) {
				// 图片更宽 -> 高度对齐绿框，宽度按比例
				baseH = winH;
				baseW = baseH * ratio;
			} else {
				// 图片更高 -> 宽度对齐绿框，高度按比例
				baseW = winW;
				baseH = baseW / ratio;
			}

			this.imgBase = { width: baseW, height: baseH };

			// 2. 初始化状态 (默认居中)
			// 居中公式：(绿框宽 - 图片宽) / 2
			let initScale = 1;
			let initX = (winW - baseW) / 2;
			let initY = (winH - baseH) / 2;

			// 3. 尝试恢复历史数据
			if (this.formData.object_position) {
				try {
					const { backgroundSize, backgroundPosition } = this.formData.object_position;

					// 恢复缩放
					if (backgroundSize && backgroundSize !== 'cover') {
						const sizeVal = parseFloat(backgroundSize.split(' ')[0]);
						if (!isNaN(sizeVal)) initScale = sizeVal / 100;
					}

					// 恢复位置
					if (backgroundPosition) {
						const posParts = backgroundPosition.split(' ');
						const perX = parseFloat(posParts[0]) / 100 || 0;
						const perY = parseFloat(posParts[1]) / 100 || 0;

						// 恢复公式：x = 偏移百分比 * 可移动总距离
						// 可移动总距离 = (winW - currentW)
						// 注意：这个距离是负数，所以乘出来直接是负坐标
						const currentW = baseW * initScale;
						const currentH = baseH * initScale;

						// 如果 currentW = winW (刚好填满)，则 x = 0
						if (currentW !== winW) initX = perX * (winW - currentW);
						if (currentH !== winH) initY = perY * (winH - currentH);
					}
				} catch (err) {
					console.error('样式恢复失败', err);
				}
			}

			// 应用
			this.imgState = { x: initX, y: initY, scale: initScale };
			this.currentDetail = { x: initX, y: initY };
		},

		onMovableChange(e) {
			// 直接记录 x, y (相对于绿框左上角)
			this.currentDetail = { x: e.detail.x, y: e.detail.y };
		},

		onSliderChange(e) {
			const newScale = e.detail.value;
			this.applyScale(newScale);
		},

		stepScale(delta) {
			this.applyScale(this.imgState.scale + delta);
		},

		// 缩放处理核心逻辑
		applyScale(newScale) {
			newScale = Math.max(1, Math.min(3, newScale));

			// 缩放时，我们要保持"视觉中心不变"比较难算
			// 简单处理：缩放后，重置位置到居中，或者保持当前中心比
			// 为了防止缩放后图片"跑偏"导致留白，最简单的方法是：
			// 改变 scale，让 movable-view 的宽高校验逻辑自己去修正位置 (uni-app 会自动回弹)

			this.imgState.scale = newScale;
			// 注意：直接修改 scale 后，movable-view 的大小变了，
			// 如果当前 x,y 超出了新的边界，movable-view 通常会自动修正回弹。
		},

		confirmCropper() {
			const scale = this.imgState.scale;

			// 当前图片的实际像素尺寸
			const currentW = this.imgBase.width * scale;
			const currentH = this.imgBase.height * scale;

			const winW = this.container.width;
			const winH = this.container.height;

			const { x, y } = this.currentDetail;

			// --- 计算 background-position 百分比 ---
			// 公式：百分比 = 当前位移 / 可移动总距离
			// 可移动总距离 = winW - currentW (这是一个负数)
			// x 也是负数。 负数 / 负数 = 正数百分比 (0 ~ 1)

			let perX = 0;
			let perY = 0;

			// 容错：如果图片比框小（理论上不应该发生），分母为正，逻辑会反，但这里 scale>=1 且 base>=win，所以 current >= win
			if (Math.abs(winW - currentW) > 1) {
				perX = x / (winW - currentW);
			}

			if (Math.abs(winH - currentH) > 1) {
				perY = y / (winH - currentH);
			}

			// 边界强制清洗 (0% - 100%)
			perX = Math.max(0, Math.min(1, perX));
			perY = Math.max(0, Math.min(1, perY));

			// --- 计算 background-size ---
			let bgSizeStyle;
			if (Math.abs(scale - 1) < 0.01) {
				bgSizeStyle = 'cover';
			} else {
				// 这里的比例：图片宽 / 容器宽
				bgSizeStyle = `${((currentW / winW) * 100).toFixed(1)}% auto`;
			}

			const bgPosStyle = `${(perX * 100).toFixed(1)}% ${(perY * 100).toFixed(1)}%`;

			console.log('保存样式:', { bgSizeStyle, bgPosStyle, scale });

			this.formData.object_position = {
				backgroundSize: bgSizeStyle,
				backgroundPosition: bgPosStyle
			};

			this.closeCropper();
			uni.showToast({ title: '显示区域已保存', icon: 'success' });
		}
	}
};
</script>

<style scoped>
/* 样式在父组件 (system-management.vue) 中定义 */
</style>
