<template>
	<view class="p-4 bg-gray-50 min-h-screen">
		<uni-load-more v-if="loading" status="loading"></uni-load-more>
		<view v-else class="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
			<view class="text-xl font-bold mb-6 text-gray-800 border-b pb-2">编辑司导档案</view>

			<uni-forms ref="form" :model="formData" :rules="rules" validate-trigger="bind" label-width="110px" label-align="right">
				<view class="mb-6 border-b border-gray-100 pb-4">
					<view class="text-sm font-bold text-indigo-600 mb-4 bg-indigo-50 p-2 rounded">基本信息</view>
					<view class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<view v-show="false">
							<uni-forms-item name="user_id" label="关联用户">
								<uni-data-select v-model="formData.user_id" collection="uni-id-users" field="_id as value, nickname as text" :disabled="true"></uni-data-select>
							</uni-forms-item>
						</view>

						<uni-forms-item name="real_name" label="真实姓名" required>
							<uni-easyinput v-model="formData.real_name" />
						</uni-forms-item>
						<uni-forms-item name="mobile" label="手机号码" required>
							<uni-easyinput v-model="formData.mobile" :disabled="true" />
						</uni-forms-item>
						<uni-forms-item name="gender" label="性别">
							<uni-data-checkbox
								v-model="formData.gender"
								:localdata="[
									{ text: '男', value: 1 },
									{ text: '女', value: 2 }
								]" />
						</uni-forms-item>
						<uni-forms-item name="introduction" label="自我介绍" class="col-span-2">
							<uni-easyinput type="textarea" v-model="formData.introduction" />
						</uni-forms-item>
					</view>
				</view>

				<view class="mb-6 border-b border-gray-100 pb-4">
					<view class="text-sm font-bold text-indigo-600 mb-4 bg-indigo-50 p-2 rounded">工作与状态</view>
					<view class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<uni-forms-item name="work_status" label="工作状态">
							<uni-data-select v-model="formData.work_status" :localdata="workStatusOptions" :clear="false"></uni-data-select>
						</uni-forms-item>
						<uni-forms-item name="personality_type" label="性格类型">
							<uni-data-select v-model="formData.personality_type" :localdata="personalityOptions"></uni-data-select>
						</uni-forms-item>

						<uni-forms-item name="rating" label="实时综合评分">
							<uni-easyinput type="number" v-model="formData.rating" disabled placeholder="计算中..." />
						</uni-forms-item>
						<uni-forms-item name="order_count" label="近期接单数">
							<uni-easyinput type="number" v-model="formData.order_count" disabled placeholder="计算中..." />
						</uni-forms-item>
					</view>
				</view>

				<view class="mb-6 border-b border-gray-100 pb-4">
					<view class="text-sm font-bold text-indigo-600 mb-4 bg-indigo-50 p-2 rounded">车辆与设备</view>
					<view class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<uni-forms-item name="has_car" label="是否有车">
							<switch :checked="formData.has_car" @change="(e) => (formData.has_car = e.detail.value)" color="#4f46e5" style="transform: scale(0.8)" />
						</uni-forms-item>
						<uni-forms-item v-if="formData.has_car" name="vehicle_id" label="关联车辆">
							<uni-data-select v-model="formData.vehicle_id" collection="b-vehicle-profiles" field="_id as value, plate_number as text"></uni-data-select>
						</uni-forms-item>
						<uni-forms-item name="equipment" label="拍摄设备" class="col-span-2">
							<uni-data-checkbox multiple v-model="formData.equipment" :localdata="equipmentOptions" />
						</uni-forms-item>
					</view>
				</view>

				<view class="mb-6 border-b border-gray-100 pb-4">
					<view class="text-sm font-bold text-indigo-600 mb-4 bg-indigo-50 p-2 rounded">证件与照片</view>

					<uni-forms-item name="id_card_number" label="身份证号">
						<uni-easyinput v-model="formData.id_card_number" placeholder="请输入身份证号" />
					</uni-forms-item>

					<view class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<uni-forms-item name="birth_date" label="出生日期">
							<uni-datetime-picker type="date" v-model="formData.birth_date" />
						</uni-forms-item>
						<uni-forms-item name="license_valid_date" label="驾照有效期">
							<uni-datetime-picker type="date" v-model="formData.license_valid_date" />
						</uni-forms-item>
					</view>

					<view class="grid grid-cols-2 md:grid-cols-4 gap-4">
						<uni-forms-item name="personal_photo" label="个人头像" required label-position="top">
							<uni-file-picker
								v-model="imageValue.personal_photo"
								:image-styles="imgStyle"
								return-type="object"
								limit="1"
								@select="(e) => setFile(e, 'personal_photo')"
								@delete="() => delFile('personal_photo')"></uni-file-picker>
						</uni-forms-item>
						<uni-forms-item name="background_image" label="主页背景" label-position="top">
							<uni-file-picker
								v-model="imageValue.background_image"
								:image-styles="imgStyle"
								return-type="object"
								limit="1"
								@select="(e) => setFile(e, 'background_image')"
								@delete="() => delFile('background_image')"></uni-file-picker>
						</uni-forms-item>
						<uni-forms-item name="id_card_front" label="身份证正面" required label-position="top">
							<uni-file-picker
								v-model="imageValue.id_card_front"
								:image-styles="imgStyle"
								return-type="object"
								limit="1"
								@select="(e) => setFile(e, 'id_card_front')"
								@delete="() => delFile('id_card_front')"></uni-file-picker>
						</uni-forms-item>
						<uni-forms-item name="id_card_back" label="身份证反面" required label-position="top">
							<uni-file-picker
								v-model="imageValue.id_card_back"
								:image-styles="imgStyle"
								return-type="object"
								limit="1"
								@select="(e) => setFile(e, 'id_card_back')"
								@delete="() => delFile('id_card_back')"></uni-file-picker>
						</uni-forms-item>
						<uni-forms-item name="driver_license" label="驾驶证" required label-position="top">
							<uni-file-picker
								v-model="imageValue.driver_license"
								:image-styles="imgStyle"
								return-type="object"
								limit="1"
								@select="(e) => setFile(e, 'driver_license')"
								@delete="() => delFile('driver_license')"></uni-file-picker>
						</uni-forms-item>
					</view>
				</view>

				<view class="mb-6 border-b border-gray-100 pb-4">
					<view class="text-sm font-bold text-indigo-600 mb-4 bg-indigo-50 p-2 rounded">财务与紧急联系</view>
					<view class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<uni-forms-item name="bank_card_number" label="银行卡号">
							<uni-easyinput v-model="formData.bank_card_number" />
						</uni-forms-item>
						<uni-forms-item name="branch_name" label="开户行">
							<uni-easyinput v-model="formData.branch_name" />
						</uni-forms-item>
						<uni-forms-item name="bank_card_img" label="银行卡照片">
							<uni-file-picker
								v-model="imageValue.bank_card_img"
								:image-styles="imgStyle"
								return-type="object"
								limit="1"
								@select="(e) => setFile(e, 'bank_card_img')"
								@delete="() => delFile('bank_card_img')"></uni-file-picker>
						</uni-forms-item>
						<view></view>
						<uni-forms-item name="emergency_name" label="紧急联系人">
							<uni-easyinput v-model="formData.emergency_name" />
						</uni-forms-item>
						<uni-forms-item name="emergency_mobile" label="紧急联系电话">
							<uni-easyinput v-model="formData.emergency_mobile" />
						</uni-forms-item>
					</view>
				</view>

				<view class="mb-6">
					<view class="text-sm font-bold text-indigo-600 mb-4 bg-indigo-50 p-2 rounded">绩效数据 (人工统计/月度)</view>
					<view class="grid grid-cols-2 md:grid-cols-4 gap-4">
						<uni-forms-item label="拒单数" label-position="top">
							<uni-easyinput type="number" v-model="formData.stats.rejected_orders" />
						</uni-forms-item>
						<uni-forms-item label="无故取消数" label-position="top">
							<uni-easyinput type="number" v-model="formData.stats.cancelled_orders" />
						</uni-forms-item>
						<uni-forms-item label="迟到早退数" label-position="top">
							<uni-easyinput type="number" v-model="formData.stats.lateness_count" />
						</uni-forms-item>
						<uni-forms-item label="服务失误数" label-position="top">
							<uni-easyinput type="number" v-model="formData.stats.service_errors" />
						</uni-forms-item>
						<uni-forms-item label="报账逾漏数" label-position="top">
							<uni-easyinput type="number" v-model="formData.stats.accounting_delays" />
						</uni-forms-item>
						<uni-forms-item label="轻微违章" label-position="top">
							<uni-easyinput type="number" v-model="formData.stats.minor_violations" />
						</uni-forms-item>
						<uni-forms-item label="严重违章" label-position="top">
							<uni-easyinput type="number" v-model="formData.stats.serious_violations" />
						</uni-forms-item>
						<uni-forms-item label="照片质量分" label-position="top">
							<uni-easyinput type="number" v-model="formData.stats.photo_quality_score" placeholder="0-100" />
						</uni-forms-item>
						<uni-forms-item label="视频质量分" label-position="top">
							<uni-easyinput type="number" v-model="formData.stats.video_quality_score" placeholder="0-100" />
						</uni-forms-item>
						<uni-forms-item label="宣传素材数" label-position="top">
							<uni-easyinput type="number" v-model="formData.stats.promo_materials" />
						</uni-forms-item>
					</view>
				</view>

				<view class="flex justify-center gap-4 mt-8 pt-4 border-t border-gray-100">
					<button class="w-32 uni-button" type="default" @click="cancel">取消</button>
					<button class="w-32 uni-button" type="primary" @click="submit">保存修改</button>
				</view>
			</uni-forms>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const opCenter = uniCloud.importObject('a-operation-center');

export default {
	data() {
		return {
			id: '',
			loading: true,
			imgStyle: {
				width: '80px',
				height: '80px',
				border: { color: '#eee', width: '1px', style: 'solid', radius: '4px' }
			},
			workStatusOptions: [
				{ text: '正常接单', value: 'active' },
				{ text: '事假中', value: 'leave_personal' },
				{ text: '病假中', value: 'leave_sick' }
			],
			personalityOptions: [
				{ text: '沉稳贴心型', value: '沉稳贴心型' },
				{ text: '热情全能型', value: '热情全能型' },
				{ text: '随和灵活型', value: '随和灵活型' },
				{ text: '专业适配型', value: '专业适配型' }
			],
			equipmentOptions: [
				{ text: '无人机', value: 'drone' },
				{ text: '单反相机', value: 'dslr' },
				{ text: '口袋相机', value: 'pocket' }
			],
			formData: {
				user_id: '',
				real_name: '',
				mobile: '',
				gender: 1,
				rating: 0, // 初始值改为0，等待异步加载
				order_count: 0,
				introduction: '',
				rank: 'regular',
				work_status: 'active',
				personality_type: '',

				// 证件
				personal_photo: '',
				background_image: '',
				id_card_front: '',
				id_card_back: '',
				driver_license: '',
				guide_license_home: '',
				guide_license_detail: '',
				bank_card_img: '',

				// 详情
				id_card_number: '',
				birth_date: null, // 初始化为null，防止NaN
				license_valid_date: null, // 初始化为null

				// 银行与紧急
				bank_card_number: '',
				branch_name: '',
				emergency_name: '',
				emergency_mobile: '',

				// 车辆设备
				has_car: false,
				vehicle_id: '',
				equipment: [],

				stats: {
					rejected_orders: 0,
					cancelled_orders: 0,
					lateness_count: 0,
					service_errors: 0,
					accounting_delays: 0,
					minor_violations: 0,
					serious_violations: 0,
					photo_quality_score: 0,
					video_quality_score: 0,
					promo_materials: 0
				}
			},
			imageValue: {
				personal_photo: null,
				background_image: null,
				id_card_front: null,
				id_card_back: null,
				driver_license: null,
				// 移除了导游证
				bank_card_img: null
			},
			rules: {
				real_name: { rules: [{ required: true, errorMessage: '必填' }] }
			}
		};
	},
	onLoad(options) {
		if (options.id) {
			this.id = options.id;
			this.loadData(options.id);
		}
	},
	methods: {
		loadData(id) {
			db.collection('b-guide-profiles')
				.doc(id)
				.get()
				.then((res) => {
					if (res.result.data && res.result.data.length > 0) {
						const data = res.result.data[0];
						// 确保数组存在，防止多选框报错
						if (!data.equipment) data.equipment = [];
						// 确保 stats 对象存在
						if (!data.stats) {
							data.stats = {
								rejected_orders: 0,
								cancelled_orders: 0,
								lateness_count: 0,
								service_errors: 0,
								accounting_delays: 0,
								minor_violations: 0,
								serious_violations: 0,
								photo_quality_score: 0,
								video_quality_score: 0,
								promo_materials: 0
							};
						}

						if (data.birth_date && /^\d{8}$/.test(data.birth_date)) {
							data.birth_date = data.birth_date.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');
						} else {
							data.birth_date = null; // 格式不对或为空则置空
						}

						if (data.license_valid_date && /^\d{8}$/.test(data.license_valid_date)) {
							data.license_valid_date = data.license_valid_date.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');
						} else {
							data.license_valid_date = null;
						}

						this.formData = data;

						// 初始化图片回显
						this.initImageValue();

						// 加载实时评分和接单数
						if (this.formData.user_id) {
							this.getRealtimeStats(this.formData.user_id);
						}
					}
					this.loading = false;
				});
		},
		async getRealtimeStats(userId) {
			try {
				// 获取单个司导的考核数据
				const res = await opCenter.getAssessmentData({
					role: 'guide',
					target_id: userId
				});

				if (res.data) {
					// 1. 设置实时评分
					this.formData.rating = res.data.total_score || 0;

					// 2. 设置接单数 (从第一个维度的 metrics 中获取，通常是近30天)
					const dims = res.data.dimensions || [];
					if (dims.length > 0 && dims[0].metrics) {
						this.formData.order_count = dims[0].metrics.order_count || 0;
					} else {
						this.formData.order_count = 0;
					}
				}
			} catch (e) {
				console.error('获取实时考核数据失败:', e);
			}
		},
		initImageValue() {
			const keys = Object.keys(this.imageValue);
			keys.forEach((key) => {
				if (this.formData[key]) {
					this.imageValue[key] = {
						url: this.formData[key],
						name: 'image.jpg',
						extname: 'jpg'
					};
				}
			});
		},
		setFile(e, key) {
			const tempFile = e.tempFiles[0];
			this.formData[key] = tempFile.url || tempFile.path;
		},
		delFile(key) {
			this.formData[key] = '';
		},
		submit() {
			this.$refs.form.validate().then((res) => {
				const data = { ...this.formData };
				delete data._id; // 更新时移除ID

				if (data.birth_date) {
					data.birth_date = data.birth_date.replace(/-/g, '');
				}
				if (data.license_valid_date) {
					data.license_valid_date = data.license_valid_date.replace(/-/g, '');
				}

				db.collection('b-guide-profiles')
					.doc(this.id)
					.update(data)
					.then(() => {
						uni.showToast({ title: '更新成功' });
						setTimeout(() => uni.navigateBack(), 1500);
					})
					.catch((err) => {
						uni.showModal({ content: '更新失败: ' + err.message });
					});
			});
		},
		cancel() {
			uni.navigateBack();
		}
	}
};
</script>

<style scoped>
:deep(.uni-forms-item__label) {
	font-weight: 500;
	color: #374151;
}
</style>
