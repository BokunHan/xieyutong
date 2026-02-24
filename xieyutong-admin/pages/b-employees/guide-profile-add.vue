<template>
	<view class="p-4 bg-gray-50 min-h-screen">
		<view class="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
			<view class="text-xl font-bold mb-6 text-gray-800 border-b pb-2">新增司导档案</view>

			<uni-forms ref="form" :model="formData" :rules="rules" validate-trigger="bind" label-width="110px" label-align="right">
				<view class="mb-6 border-b border-gray-100 pb-4">
					<view class="text-sm font-bold text-indigo-600 mb-4 bg-indigo-50 p-2 rounded">基本信息</view>
					<view class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<uni-forms-item name="user_id" label="关联用户" required>
							<uni-data-select v-model="formData.user_id" collection="uni-id-users" field="_id as value, nickname as text" placeholder="请选择关联账户"></uni-data-select>
						</uni-forms-item>
						<uni-forms-item name="real_name" label="真实姓名" required>
							<uni-easyinput v-model="formData.real_name" placeholder="请输入姓名" />
						</uni-forms-item>
						<uni-forms-item name="mobile" label="手机号码" required>
							<uni-easyinput v-model="formData.mobile" placeholder="请输入手机号" />
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
							<uni-easyinput type="textarea" v-model="formData.introduction" placeholder="请输入自我介绍" />
						</uni-forms-item>
					</view>
				</view>

				<view class="mb-6 border-b border-gray-100 pb-4">
					<view class="text-sm font-bold text-indigo-600 mb-4 bg-indigo-50 p-2 rounded">工作与状态</view>
					<view class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<uni-forms-item name="rank" label="司导身份">
							<uni-data-select v-model="formData.rank" :localdata="rankOptions" :clear="false"></uni-data-select>
						</uni-forms-item>
						<uni-forms-item name="work_status" label="工作状态">
							<uni-data-select v-model="formData.work_status" :localdata="workStatusOptions" :clear="false"></uni-data-select>
						</uni-forms-item>
						<uni-forms-item name="personality_type" label="性格类型">
							<uni-data-select v-model="formData.personality_type" :localdata="personalityOptions"></uni-data-select>
						</uni-forms-item>
						<uni-forms-item name="rating" label="初始评分">
							<uni-easyinput type="number" v-model="formData.rating" placeholder="默认100" />
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
							<uni-data-select
								v-model="formData.vehicle_id"
								collection="b-vehicle-profiles"
								field="_id as value, plate_number as text"
								placeholder="选择运营车辆"></uni-data-select>
						</uni-forms-item>
						<uni-forms-item name="equipment" label="拍摄设备" class="col-span-2">
							<uni-data-checkbox multiple v-model="formData.equipment" :localdata="equipmentOptions" />
						</uni-forms-item>
					</view>
				</view>

				<view class="mb-6 border-b border-gray-100 pb-4">
					<view class="text-sm font-bold text-indigo-600 mb-4 bg-indigo-50 p-2 rounded">证件与照片</view>

					<view class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
						<uni-forms-item name="id_card_number" label="身份证号">
							<uni-easyinput v-model="formData.id_card_number" placeholder="OCR识别或手填" />
						</uni-forms-item>
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
						<uni-forms-item name="guide_license_home" label="导游证首页" label-position="top">
							<uni-file-picker
								v-model="imageValue.guide_license_home"
								:image-styles="imgStyle"
								return-type="object"
								limit="1"
								@select="(e) => setFile(e, 'guide_license_home')"
								@delete="() => delFile('guide_license_home')"></uni-file-picker>
						</uni-forms-item>
						<uni-forms-item name="guide_license_detail" label="导游证详情" label-position="top">
							<uni-file-picker
								v-model="imageValue.guide_license_detail"
								:image-styles="imgStyle"
								return-type="object"
								limit="1"
								@select="(e) => setFile(e, 'guide_license_detail')"
								@delete="() => delFile('guide_license_detail')"></uni-file-picker>
						</uni-forms-item>
					</view>
				</view>

				<view class="mb-6">
					<view class="text-sm font-bold text-indigo-600 mb-4 bg-indigo-50 p-2 rounded">财务与紧急联系</view>
					<view class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<uni-forms-item name="bank_card_number" label="银行卡号">
							<uni-easyinput v-model="formData.bank_card_number" placeholder="请输入卡号" />
						</uni-forms-item>
						<uni-forms-item name="branch_name" label="开户行">
							<uni-easyinput v-model="formData.branch_name" placeholder="例如：招商银行朝阳支行" />
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

				<view class="flex justify-center gap-4 mt-8 pt-4 border-t border-gray-100">
					<button class="w-32 uni-button" type="default" @click="cancel">取消</button>
					<button class="w-32 uni-button" type="primary" @click="submit">提交保存</button>
				</view>
			</uni-forms>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
export default {
	data() {
		return {
			imgStyle: {
				width: '80px',
				height: '80px',
				border: { color: '#eee', width: '1px', style: 'solid', radius: '4px' }
			},
			rankOptions: [
				{ text: '普通', value: 'regular' },
				{ text: '金牌', value: 'excellent' }
			],
			workStatusOptions: [
				{ text: '在职', value: 'active' },
				{ text: '事假', value: 'leave_personal' },
				{ text: '病假', value: 'leave_sick' }
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
				{ text: '口袋云台', value: 'pocket' }
			],
			formData: {
				user_id: '',
				real_name: '',
				mobile: '',
				gender: 1,
				introduction: '',
				rank: 'regular',
				rating: 100.0,
				order_count: 0,

				// 图片
				personal_photo: '',
				background_image: '',
				id_card_front: '',
				id_card_back: '',
				driver_license: '',
				guide_license_home: '',
				guide_license_detail: '',
				bank_card_img: '',

				// 证件详情
				id_card_number: '',
				birth_date: '',
				first_issue_date: '',
				license_valid_date: '',

				// 车辆设备
				has_car: false,
				vehicle_id: '',
				equipment: [],

				// 银行
				bank_card_number: '',
				branch_name: '',
				bank_expire_date: '',

				// 紧急联系
				emergency_name: '',
				emergency_mobile: '',

				// 状态
				personality_type: '',
				work_status: 'active'
			},
			imageValue: {
				personal_photo: null,
				background_image: null,
				id_card_front: null,
				id_card_back: null,
				driver_license: null,
				guide_license_home: null,
				guide_license_detail: null,
				bank_card_img: null
			},
			rules: {
				real_name: { rules: [{ required: true, errorMessage: '请输入姓名' }] },
				mobile: { rules: [{ required: true, errorMessage: '请输入手机号' }] },
				user_id: { rules: [{ required: true, errorMessage: '请选择关联用户' }] },
				personal_photo: { rules: [{ required: true, errorMessage: '请上传头像' }] },
				id_card_front: { rules: [{ required: true, errorMessage: '请上传身份证' }] },
				driver_license: { rules: [{ required: true, errorMessage: '请上传驾驶证' }] }
			}
		};
	},
	methods: {
		setFile(e, key) {
			const tempFile = e.tempFiles[0];
			this.formData[key] = tempFile.url || tempFile.path;
		},
		delFile(key) {
			this.formData[key] = '';
		},
		submit() {
			this.$refs.form
				.validate()
				.then((res) => {
					db.collection('b-guide-profiles')
						.add(this.formData)
						.then((res) => {
							uni.showToast({ title: '创建成功' });
							setTimeout(() => uni.navigateBack(), 1500);
						})
						.catch((err) => {
							uni.showModal({ content: err.message || '创建失败' });
						});
				})
				.catch((err) => {
					console.log('表单错误', err);
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
