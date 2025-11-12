<template>
	<view class="bg-white rounded-xl shadow-lg overflow-hidden">
		<!-- 组件标题 -->
		<view class="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
			<view class="flex items-center justify-between">
				<view class="flex items-center">
					<i class="fas fa-file-contract text-white text-2xl mr-4"></i>
					<view>
						<text class="text-2xl font-bold text-white">预定须知</text>
						<view v-if="productId || ctripId" class="mt-1">
							<text class="text-orange-100 text-sm">
								查询方式: {{ productId ? `产品ID: ${productId}` : '' }}{{ productId && ctripId ? ' | ' : '' }}{{ ctripId ? `携程ID: ${ctripId}` : '' }}
							</text>
						</view>
					</view>
				</view>
				<button v-if="!hasPolicy" @click="createPolicy" class="px-6 py-2 bg-white text-orange-600 rounded-lg hover:bg-gray-50 transition-colors font-medium">
					<i class="fas fa-plus mr-2"></i>
					创建政策
				</button>
			</view>
		</view>

		<!-- 预定政策表格 -->
		<view v-if="hasPolicy" class="table-responsive">
			<table class="min-w-full divide-y divide-gray-200">
				<tbody class="bg-white divide-y divide-gray-200">
					<!-- 政策标题 -->
					<!-- <tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50 w-48">
							<i class="fas fa-heading text-orange-500 mr-3"></i>
							政策标题
						</td>
						<td class="px-8 py-6">
							<uni-easyinput v-model="localData.title" @change="updateData" :styles="inputStyles" placeholder="请输入预定政策标题" :clearable="true" />
						</td>
					</tr> -->

					<!-- 退款政策 -->
					<!-- <tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-undo text-red-500 mr-3"></i>
							退款政策
						</td>
						<td class="px-8 py-6">
							<uni-easyinput
								v-model="localData.refund_policy"
								@change="updateData"
								type="textarea"
								:styles="textareaStyles"
								:autoHeight="true"
								placeholder="请详细描述退款政策和退款条件"
								:clearable="true" />
						</td>
					</tr> -->

					<!-- 修改政策 -->
					<!-- <tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-edit text-blue-500 mr-3"></i>
							修改政策
						</td>
						<td class="px-8 py-6">
							<uni-easyinput
								v-model="localData.change_policy"
								@change="updateData"
								type="textarea"
								:styles="textareaStyles"
								:autoHeight="true"
								placeholder="请详细描述订单修改政策和收费标准"
								:clearable="true" />
						</td>
					</tr> -->

					<!-- 预定须知 -->
					<!-- <tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-info-circle text-blue-500 mr-3"></i>
							预定须知
						</td>
						<td class="px-8 py-6">
							<view class="space-y-4">
								<view v-for="(notice, index) in localData.booking_notes" :key="index" class="flex items-start space-x-3">
									<uni-easyinput
										v-model="localData.booking_notes[index]"
										@change="updateData"
										type="textarea"
										:styles="flexTextareaStyles"
										:autoHeight="true"
										:placeholder="`须知条目 ${index + 1}`"
										:clearable="true" />
									<button @click="removeBookingNote(index)" class="remove-btn">
										<i class="fas fa-trash"></i>
									</button>
								</view>
								<button
									@click="addBookingNote"
									class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-500 hover:text-orange-500 transition-colors text-lg">
									<i class="fas fa-plus mr-2"></i>
									添加预定须知
								</button>
							</view>
						</td>
					</tr> -->

					<!-- 注意事项 -->
					<!-- <tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-exclamation-triangle text-yellow-500 mr-3"></i>
							注意事项
						</td>
						<td class="px-8 py-6">
							<view class="space-y-4">
								<view v-for="(warning, index) in localData.important_notes" :key="index" class="flex items-start space-x-3">
									<uni-easyinput
										v-model="localData.important_notes[index]"
										@change="updateData"
										type="textarea"
										:styles="flexTextareaStyles"
										:autoHeight="true"
										:placeholder="`注意事项 ${index + 1}`"
										:clearable="true" />
									<button @click="removeImportantNote(index)" class="remove-btn">
										<i class="fas fa-trash"></i>
									</button>
								</view>
								<button
									@click="addImportantNote"
									class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-500 hover:text-orange-500 transition-colors text-lg">
									<i class="fas fa-plus mr-2"></i>
									添加注意事项
								</button>
							</view>
						</td>
					</tr> -->

					<!-- 年龄限制 -->
					<!-- <tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-users text-purple-500 mr-3"></i>
							年龄限制
						</td>
						<td class="px-8 py-6">
							<view class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">最小年龄限制</label>
									<view class="flex items-center space-x-3">
										<uni-easyinput v-model="localData.min_age" @change="updateData" type="number" :styles="ageInputStyles" :clearable="true" />
										<text class="text-gray-600 text-lg">岁</text>
									</view>
								</view>
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">最大年龄限制</label>
									<view class="flex items-center space-x-3">
										<uni-easyinput v-model="localData.max_age" @change="updateData" type="number" :styles="ageInputStyles" :clearable="true" />
										<text class="text-gray-600 text-lg">岁</text>
									</view>
								</view>
							</view>
						</td>
					</tr> -->

					<!-- 身体要求 -->
					<!-- <tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-heartbeat text-red-500 mr-3"></i>
							身体要求
						</td>
						<td class="px-8 py-6">
							<uni-easyinput
								v-model="localData.physical_requirements"
								@change="updateData"
								type="textarea"
								:styles="textareaStyles"
								:autoHeight="true"
								placeholder="请描述对参与者身体健康状况的要求"
								:clearable="true" />
						</td>
					</tr> -->

					<!-- 携带物品 -->
					<!-- <tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-suitcase text-green-500 mr-3"></i>
							携带物品
						</td>
						<td class="px-8 py-6">
							<view class="space-y-4">
								<view v-for="(item, index) in localData.required_items" :key="index" class="flex items-center space-x-3">
									<uni-easyinput v-model="localData.required_items[index]" @change="updateData" :styles="flexInputStyles" :placeholder="`物品 ${index + 1}`" :clearable="true" />
									<button @click="removeRequiredItem(index)" class="remove-btn">
										<i class="fas fa-trash"></i>
									</button>
								</view>
								<button
									@click="addRequiredItem"
									class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-500 hover:text-orange-500 transition-colors text-lg">
									<i class="fas fa-plus mr-2"></i>
									添加携带物品
								</button>
							</view>
						</td>
					</tr> -->

					<!-- 保险条款 -->
					<!-- <tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-shield-alt text-blue-500 mr-3"></i>
							保险条款
						</td>
						<td class="px-8 py-6">
							<uni-easyinput
								v-model="localData.insurance_terms"
								@change="updateData"
								type="textarea"
								:styles="textareaStyles"
								:autoHeight="true"
								placeholder="请详细描述保险相关条款和理赔流程"
								:clearable="true" />
						</td>
					</tr> -->

					<!-- 免责声明 -->
					<!-- <tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-exclamation-circle text-red-500 mr-3"></i>
							免责声明
						</td>
						<td class="px-8 py-6">
							<uni-easyinput
								v-model="localData.disclaimer"
								@change="updateData"
								type="textarea"
								:styles="textareaStyles"
								:autoHeight="true"
								placeholder="请输入免责声明条款"
								:clearable="true" />
						</td>
					</tr> -->

					<!-- 联系信息 -->
					<!-- <tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-phone text-green-500 mr-3"></i>
							联系信息
						</td>
						<td class="px-8 py-6">
							<view class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">客服电话</label>
									<uni-easyinput v-model="localData.contact_phone" @change="updateData" :styles="inputStyles" placeholder="请输入客服电话" :clearable="true" />
								</view>
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">客服邮箱</label>
									<uni-easyinput v-model="localData.contact_email" @change="updateData" :styles="inputStyles" placeholder="请输入客服邮箱" :clearable="true" />
								</view>
							</view>
						</td>
					</tr> -->

					<!-- <tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-building text-gray-500 mr-3"></i>
							旅行社信息
						</td>
						<td class="px-8 py-6">
							<view class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">代理旅行社</label>
									<uni-easyinput v-model="localData.travel_agency_info.agent" @change="updateData" :styles="inputStyles" placeholder="请输入代理旅行社名称" :clearable="true" />
								</view>
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">委托旅行社</label>
									<uni-easyinput v-model="localData.travel_agency_info.delegate" @change="updateData" :styles="inputStyles" placeholder="请输入委托旅行社名称" :clearable="true" />
								</view>
							</view>
						</td>
					</tr> -->

					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-ban text-red-500 mr-3"></i>
							预定限制
						</td>
						<td class="px-8 py-6 space-y-4">
							<view>
								<label class="block text-sm font-medium text-gray-700 mb-2">年龄限制</label>
								<uni-easyinput
									v-model="localData.booking_restrictions.age_limit"
									@change="updateData"
									:styles="inputStyles"
									type="textarea"
									:autoHeight="true"
									:maxlength="-1"
									placeholder="年龄限制说明" />
							</view>
							<view>
								<label class="block text-sm font-medium text-gray-700 mb-2">人群限制</label>
								<uni-easyinput
									v-model="localData.booking_restrictions.group_limit"
									@change="updateData"
									:styles="inputStyles"
									type="textarea"
									:autoHeight="true"
									:maxlength="-1"
									placeholder="人群限制说明" />
							</view>
							<view>
								<label class="block text-sm font-medium text-gray-700 mb-2">其他限制</label>
								<uni-easyinput
									v-model="localData.booking_restrictions.other_limit"
									@change="updateData"
									:styles="inputStyles"
									type="textarea"
									:autoHeight="true"
									:maxlength="-1"
									placeholder="其他限制说明" />
							</view>
						</td>
					</tr>

					<tr class="hover:bg-gray-50">
						<td class="px-8 py-6 font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-key text-gray-500 mr-3"></i>
							住宿政策
						</td>
						<td class="px-8 py-6">
							<uni-easyinput
								v-model="localData.accommodation_policy.multi_person"
								@change="updateData"
								type="textarea"
								:styles="textareaStyles"
								:autoHeight="true"
								:maxlength="-1"
								placeholder="多人入住政策说明" />
						</td>
					</tr>

					<tr class="hover:bg-gray-50">
						<td class="px-8 py-6 font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-users-cog text-gray-500 mr-3"></i>
							团组信息
						</td>
						<td class="px-8 py-6 space-y-4">
							<view>
								<label class="block text-sm font-medium text-gray-700 mb-2">团组描述</label>
								<uni-easyinput v-model="localData.group_info.group_description" @change="updateData" :styles="textareaStyles" :autoHeight="true" />
							</view>
							<view>
								<label class="block text-sm font-medium text-gray-700 mb-2">出团通知</label>
								<uni-easyinput v-model="localData.group_info.departure_notice" @change="updateData" :styles="textareaStyles" :autoHeight="true" />
							</view>
						</td>
					</tr>

					<tr class="hover:bg-gray-50">
						<td class="px-8 py-6 font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-clipboard-list text-gray-500 mr-3"></i>
							预定要求
						</td>
						<td class="px-8 py-6">
							<view class="space-y-4">
								<view v-for="(req, index) in localData.booking_requirements" :key="index" class="flex items-start space-x-3">
									<uni-easyinput
										v-model="localData.booking_requirements[index]"
										@change="updateData"
										type="textarea"
										:styles="flexTextareaStyles"
										:autoHeight="true"
										:maxlength="-1"
										:placeholder="`要求 ${index + 1}`" />
									<button @click="removeBookingRequirement(index)" class="remove-btn">
										<i class="fas fa-trash"></i>
									</button>
								</view>
								<button @click="addBookingRequirement" class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
									<i class="fas fa-plus mr-2"></i>
									添加预定要求
								</button>
							</view>
						</td>
					</tr>

					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-gavel text-gray-500 mr-3"></i>
							违约条款
						</td>
						<td class="px-8 py-6 space-y-6">
							<view class="space-y-4">
								<label class="block text-md font-medium text-gray-700">旅行社违约责任</label>
								<view v-for="(term, index) in localData.violation_terms.agency_violation" :key="index" class="flex items-start space-x-3">
									<uni-easyinput
										v-model="localData.violation_terms.agency_violation[index]"
										@change="updateData"
										type="textarea"
										:styles="flexTextareaStyles"
										:autoHeight="true"
										:maxlength="-1"
										:placeholder="`条款 ${index + 1}`" />
									<button @click="removeViolationTerm('agency', index)" class="remove-btn">
										<i class="fas fa-trash"></i>
									</button>
								</view>
								<button
									@click="addViolationTerm('agency')"
									class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-500 hover:text-orange-500">
									<i class="fas fa-plus mr-2"></i>
									添加旅行社违约条款
								</button>
							</view>
							<view class="space-y-4">
								<label class="block text-md font-medium text-gray-700">旅游者违约责任</label>
								<view v-for="(term, index) in localData.violation_terms.tourist_violation" :key="index" class="flex items-start space-x-3">
									<uni-easyinput
										v-model="localData.violation_terms.tourist_violation[index]"
										@change="updateData"
										type="textarea"
										:styles="flexTextareaStyles"
										:autoHeight="true"
										:maxlength="-1"
										:placeholder="`条款 ${index + 1}`" />
									<button @click="removeViolationTerm('tourist', index)" class="remove-btn">
										<i class="fas fa-trash"></i>
									</button>
								</view>
								<button
									@click="addViolationTerm('tourist')"
									class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-500 hover:text-orange-500">
									<i class="fas fa-plus mr-2"></i>
									添加旅游者违约条款
								</button>
							</view>
						</td>
					</tr>

					<tr class="hover:bg-gray-50">
						<td class="px-8 py-6 font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-shield-heart text-gray-500 mr-1"></i>
							出行/安全提示
						</td>
						<td class="px-8 py-6 space-y-6">
							<view class="space-y-4">
								<label class="block font-medium text-gray-700">出行指南</label>
								<view v-for="(guide, index) in localData.travel_guide" :key="index" class="flex items-start space-x-3">
									<uni-easyinput
										v-model="localData.travel_guide[index]"
										@change="updateData"
										type="textarea"
										:styles="flexTextareaStyles"
										:autoHeight="true"
										:maxlength="-1"
										:placeholder="`指南 ${index + 1}`" />
									<button @click="removeTravelGuide(index)" class="remove-btn">
										<i class="fas fa-trash"></i>
									</button>
								</view>
								<button @click="addTravelGuide" class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
									<i class="fas fa-plus mr-2"></i>
									添加出行指南
								</button>
							</view>
							<view class="space-y-4">
								<label class="block font-medium text-gray-700">安全提示</label>
								<view v-for="(tip, index) in localData.safety_tips" :key="index" class="flex items-start space-x-3">
									<uni-easyinput
										v-model="localData.safety_tips[index]"
										@change="updateData"
										type="textarea"
										:styles="flexTextareaStyles"
										:autoHeight="true"
										:maxlength="-1"
										:placeholder="`提示 ${index + 1}`" />
									<button @click="removeSafetyTip(index)" class="remove-btn">
										<i class="fas fa-trash"></i>
									</button>
								</view>
								<button @click="addSafetyTip" class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
									<i class="fas fa-plus mr-2"></i>
									添加安全提示
								</button>
							</view>
						</td>
					</tr>

					<!-- <tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-credit-card text-blue-500 mr-3"></i>
							支付信息
						</td>
						<td class="px-8 py-6 space-y-6">
							<view class="space-y-4">
								<label class="block font-medium text-gray-700">支持的支付方式</label>
								<view v-for="(method, index) in localData.payment_info.supported_methods" :key="index" class="flex items-center space-x-3">
									<uni-easyinput v-model="localData.payment_info.supported_methods[index]" @change="updateData" :styles="flexInputStyles" :placeholder="`方式 ${index + 1}`" />
									<button @click="removeSupportedMethod(index)" class="remove-btn">
										<i class="fas fa-trash"></i>
									</button>
								</view>
								<button
									@click="addSupportedMethod"
									class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-500 hover:text-orange-500">
									<i class="fas fa-plus mr-2"></i>
									添加支付方式
								</button>
							</view>

							<view class="space-y-4">
								<label class="block font-medium text-gray-700">支付说明</label>
								<uni-easyinput
									:modelValue="Array.isArray(localData.payment_info.payment_notes) ? localData.payment_info.payment_notes.join('\\n') : localData.payment_info.payment_notes"
									@input="localData.payment_info.payment_notes = $event.split('\\n')"
									@change="updateData"
									type="textarea"
									:styles="textareaStyles"
									:autoHeight="true"
									:maxlength="-1"
									placeholder="请输入支付相关说明" />
							</view>
						</td>
					</tr> -->
				</tbody>
			</table>
		</view>

		<!-- 空状态 -->
		<view v-if="!hasPolicy" class="px-8 py-16 text-center">
			<i class="fas fa-file-contract text-6xl text-gray-300 mb-4"></i>
			<text class="block text-xl text-gray-500 mb-4">暂未创建预定政策</text>
			<text class="block text-gray-400 mb-8">点击上方"创建政策"按钮开始设置预定规则</text>
		</view>
	</view>
</template>

<script>
import { toRaw } from 'vue';

const defaultLocalData = {
	// title: '',
	// refund_policy: '',
	// change_policy: '',
	// booking_notes: [''],
	// important_notes: [''],
	// min_age: 0,
	// max_age: 99,
	// physical_requirements: '',
	// required_items: [''],
	// insurance_terms: '',
	// disclaimer: '',
	// contact_phone: '',
	// contact_email: '',
	travel_agency_info: { agent: '', delegate: '' },
	booking_restrictions: { age_limit: '', group_limit: '', other_limit: '' },
	accommodation_policy: { multi_person: '' },
	group_info: { group_description: '', departure_notice: '' },
	booking_requirements: [''],
	violation_terms: { agency_violation: [''], tourist_violation: [''] },
	travel_guide: [''],
	safety_tips: [''],
	payment_info: { supported_methods: [''], payment_notes: [''] }
};

export default {
	name: 'BookingPolicies',
	props: {
		productId: {
			type: String,
			default: '',
			validator(value) {
				console.log('✅ [BookingPolicies] productId属性验证:', {
					timestamp: new Date().toLocaleString(),
					value: value,
					type: typeof value,
					length: value ? value.length : 0,
					isValid: typeof value === 'string'
				});
				return typeof value === 'string';
			}
		},
		ctripId: {
			type: String,
			default: '',
			validator(value) {
				console.log('✅ [BookingPolicies] ctripId属性验证:', {
					timestamp: new Date().toLocaleString(),
					value: value,
					type: typeof value,
					length: value ? value.length : 0,
					isValid: typeof value === 'string'
				});
				return typeof value === 'string';
			}
		},
		policyData: {
			type: Object,
			default: () => ({}),
			validator(value) {
				const isValid = value === null || value === undefined || (typeof value === 'object' && !Array.isArray(value));
				console.log('✅ [BookingPolicies] policyData属性验证:', {
					timestamp: new Date().toLocaleString(),
					value: value,
					type: typeof value,
					isNull: value === null,
					isUndefined: value === undefined,
					isArray: Array.isArray(value),
					isObject: typeof value === 'object',
					keys: value && typeof value === 'object' ? Object.keys(value) : [],
					keysCount: value && typeof value === 'object' ? Object.keys(value).length : 0,
					isValid: isValid
				});
				return isValid;
			}
		}
	},
	data() {
		console.log('🏗️ [BookingPolicies] 开始初始化组件数据');
		console.log('🏗️ [BookingPolicies] 初始化输入:', {
			timestamp: new Date().toLocaleString(),
			productId: this.productId,
			ctripId: this.ctripId,
			policyData: this.policyData,
			policyDataType: typeof this.policyData,
			policyDataKeys: this.policyData ? Object.keys(this.policyData) : []
		});

		console.log('🏗️ [BookingPolicies] 默认数据模板:', defaultLocalData);

		const mergedData = { ...defaultLocalData, ...this.policyData };

		console.log('🏗️ [BookingPolicies] 合并后数据:', mergedData);
		console.log('🏗️ [BookingPolicies] 数据初始化统计:', {
			默认字段数: Object.keys(defaultLocalData).length,
			传入字段数: this.policyData ? Object.keys(this.policyData).length : 0,
			最终字段数: Object.keys(mergedData).length
			// 数组字段检查: {
			// 	booking_notes: {
			// 		类型: typeof mergedData.booking_notes,
			// 		是否数组: Array.isArray(mergedData.booking_notes),
			// 		长度: mergedData.booking_notes?.length || 0
			// 	},
			// 	important_notes: {
			// 		类型: typeof mergedData.important_notes,
			// 		是否数组: Array.isArray(mergedData.important_notes),
			// 		长度: mergedData.important_notes?.length || 0
			// 	},
			// 	required_items: {
			// 		类型: typeof mergedData.required_items,
			// 		是否数组: Array.isArray(mergedData.required_items),
			// 		长度: mergedData.required_items?.length || 0
			// 	}
			// },
			// 数值字段检查: {
			// 	min_age: {
			// 		值: mergedData.min_age,
			// 		类型: typeof mergedData.min_age
			// 	},
			// 	max_age: {
			// 		值: mergedData.max_age,
			// 		类型: typeof mergedData.max_age
			// 	}
			// }
		});

		return {
			localData: mergedData,
			// uni-easyinput 样式配置
			inputStyles: {
				borderRadius: '8px',
				borderColor: '#d1d5db',
				fontSize: '18px',
				padding: '12px 16px'
			},
			textareaStyles: {
				borderRadius: '8px',
				borderColor: '#d1d5db',
				fontSize: '18px',
				padding: '12px 16px'
			},
			flexInputStyles: {
				borderRadius: '8px',
				borderColor: '#d1d5db',
				fontSize: '18px',
				padding: '12px 16px'
			},
			flexTextareaStyles: {
				borderRadius: '8px',
				borderColor: '#d1d5db',
				fontSize: '18px',
				padding: '12px 16px'
			},
			ageInputStyles: {
				borderRadius: '8px',
				borderColor: '#d1d5db',
				fontSize: '18px',
				padding: '12px 16px',
				width: '128px'
			}
		};
	},
	computed: {
		hasPolicy() {
			// 新的逻辑：只要 localData 中存在 _id 字段，就代表政策已存在，应该显示编辑表单。
			const policyExists = !!(this.localData && this.localData._id);

			// 您的日志非常详尽，我们可以在这里加一个简化的新日志
			console.log('🔍 [BookingPolicies] hasPolicy 计算结果:', policyExists, '(基于是否存在 _id)');

			return policyExists;
			// const hasData = this.localData && Object.keys(this.localData).length > 0;
			// const hasContentfulData = hasData && (
			//   this.localData.title ||
			//   this.localData.refund_policy ||
			//   this.localData.change_policy ||
			//   (this.localData.booking_notes && this.localData.booking_notes.some(note => note.trim())) ||
			//   (this.localData.important_notes && this.localData.important_notes.some(note => note.trim())) ||
			//   (this.localData.required_items && this.localData.required_items.some(item => item.trim())) ||
			//   this.localData.physical_requirements ||
			//   this.localData.insurance_terms ||
			//   this.localData.disclaimer ||
			//   this.localData.contact_phone ||
			//   this.localData.contact_email
			// );

			// console.log('🔍 [BookingPolicies] hasPolicy计算:', {
			//   timestamp: new Date().toLocaleString(),
			//   localData存在: !!this.localData,
			//   字段数量: this.localData ? Object.keys(this.localData).length : 0,
			//   基础判断: hasData,
			//   内容判断: hasContentfulData,
			//   最终结果: hasContentfulData,
			//   详细检查: {
			//     title: !!this.localData?.title,
			//     refund_policy: !!this.localData?.refund_policy,
			//     change_policy: !!this.localData?.change_policy,
			//     有效booking_notes: this.localData?.booking_notes?.some(note => note.trim()) || false,
			//     有效important_notes: this.localData?.important_notes?.some(note => note.trim()) || false,
			//     有效required_items: this.localData?.required_items?.some(item => item.trim()) || false,
			//     physical_requirements: !!this.localData?.physical_requirements,
			//     insurance_terms: !!this.localData?.insurance_terms,
			//     disclaimer: !!this.localData?.disclaimer,
			//     contact_phone: !!this.localData?.contact_phone,
			//     contact_email: !!this.localData?.contact_email
			//   }
			// });

			// return hasContentfulData;
		}
	},
	watch: {
		// 监听外部传入的 policyData，当它变化时，重置本地数据
		// 这对于从父组件切换不同产品时很有用
		policyData(newVal) {
			this.localData = { ...defaultLocalData, ...newVal };

			// policyData: {
			// 	handler(newVal, oldVal) {
			// 		console.log('🔄 [BookingPolicies] policyData监听器触发');
			// 		console.log('🔄 [BookingPolicies] 监听器详情:', {
			// 			timestamp: new Date().toLocaleString(),
			// 			trigger_reason: '外部policyData变化',
			// 			has_newVal: !!newVal,
			// 			has_oldVal: !!oldVal,
			// 			newVal_keys: newVal ? Object.keys(newVal).length : 0,
			// 			oldVal_keys: oldVal ? Object.keys(oldVal).length : 0
			// 		});
			// 		console.log('🔄 [BookingPolicies] 新值详情:', newVal);
			// 		console.log('🔄 [BookingPolicies] 旧值详情:', oldVal);

			// 		if (newVal) {
			// 			console.log('📝 [BookingPolicies] 开始合并新数据到localData');
			// 			console.log('📝 [BookingPolicies] 合并前localData:', { ...this.localData });

			// 			this.localData = { ...this.localData, ...newVal };

			// 			console.log('📝 [BookingPolicies] 合并后初步结果:', { ...this.localData });

			// 			// 确保数组初始化
			// 			console.log('🔧 [BookingPolicies] 开始数组字段标准化处理');
			// 			const arrayFixLog = {
			// 				booking_notes: {
			// 					原始类型: typeof this.localData.booking_notes,
			// 					是否数组: Array.isArray(this.localData.booking_notes),
			// 					原始值: this.localData.booking_notes
			// 				},
			// 				important_notes: {
			// 					原始类型: typeof this.localData.important_notes,
			// 					是否数组: Array.isArray(this.localData.important_notes),
			// 					原始值: this.localData.important_notes
			// 				},
			// 				required_items: {
			// 					原始类型: typeof this.localData.required_items,
			// 					是否数组: Array.isArray(this.localData.required_items),
			// 					原始值: this.localData.required_items
			// 				}
			// 			};

			// 			if (!Array.isArray(this.localData.booking_notes)) {
			// 				console.log('🔧 [BookingPolicies] 修复booking_notes为数组');
			// 				this.localData.booking_notes = [''];
			// 			}
			// 			if (!Array.isArray(this.localData.important_notes)) {
			// 				console.log('🔧 [BookingPolicies] 修复important_notes为数组');
			// 				this.localData.important_notes = [''];
			// 			}
			// 			if (!Array.isArray(this.localData.required_items)) {
			// 				console.log('🔧 [BookingPolicies] 修复required_items为数组');
			// 				this.localData.required_items = [''];
			// 			}

			// 			arrayFixLog.booking_notes.修复后 = this.localData.booking_notes;
			// 			arrayFixLog.important_notes.修复后 = this.localData.important_notes;
			// 			arrayFixLog.required_items.修复后 = this.localData.required_items;

			// 			console.log('🔧 [BookingPolicies] 数组字段修复日志:', arrayFixLog);
			// 		}

			// 		console.log('✅ [BookingPolicies] localData最终更新结果:', toRaw(this.localData));
			// 		console.log('📊 [BookingPolicies] 更新后数据统计:', {
			// 			总字段数: Object.keys(this.localData).length
			// 			// 文本字段: {
			// 			// 	title: this.localData.title?.length || 0,
			// 			// 	refund_policy: this.localData.refund_policy?.length || 0,
			// 			// 	change_policy: this.localData.change_policy?.length || 0,
			// 			// 	physical_requirements: this.localData.physical_requirements?.length || 0,
			// 			// 	insurance_terms: this.localData.insurance_terms?.length || 0,
			// 			// 	disclaimer: this.localData.disclaimer?.length || 0
			// 			// },
			// 			// 数组字段: {
			// 			// 	booking_notes: this.localData.booking_notes?.length || 0,
			// 			// 	important_notes: this.localData.important_notes?.length || 0,
			// 			// 	required_items: this.localData.required_items?.length || 0
			// 			// },
			// 			// 联系信息: {
			// 			// 	contact_phone: !!this.localData.contact_phone,
			// 			// 	contact_email: !!this.localData.contact_email
			// 			// },
			// 			// 年龄设置: {
			// 			// 	min_age: this.localData.min_age,
			// 			// 	max_age: this.localData.max_age
			// 			// }
			// 		});
			// 	},
			// 	deep: true,
			// 	immediate: true
		},

		// 监听productId变化
		productId: {
			handler(newVal, oldVal) {
				console.log('🆔 [BookingPolicies] productId监听器触发');
				console.log('🆔 [BookingPolicies] productId变化:', {
					timestamp: new Date().toLocaleString(),
					oldVal: oldVal,
					newVal: newVal,
					变化类型: !oldVal && newVal ? '初始化' : oldVal && newVal ? '更新' : oldVal && !newVal ? '清空' : '未知'
				});

				// 当productId发生变化时，重新加载政策数据
				if (newVal && newVal !== oldVal) {
					console.log('🔄 [BookingPolicies] productId已变化，触发重新加载政策数据');
					this.loadPolicyData();
				}
			},
			immediate: false
		},

		// 监听ctripId变化
		ctripId: {
			handler(newVal, oldVal) {
				console.log('🆔 [BookingPolicies] ctripId监听器触发');
				console.log('🆔 [BookingPolicies] ctripId变化:', {
					timestamp: new Date().toLocaleString(),
					oldVal: oldVal,
					newVal: newVal,
					变化类型: !oldVal && newVal ? '初始化' : oldVal && newVal ? '更新' : oldVal && !newVal ? '清空' : '未知'
				});

				// 当ctripId发生变化时，重新加载政策数据
				if (newVal && newVal !== oldVal) {
					console.log('🔄 [BookingPolicies] ctripId已变化，触发重新加载政策数据');
					this.loadPolicyData();
				}
			},
			immediate: false
		}
	},
	async created() {
		console.log('🎬 [BookingPolicies] 组件创建完成');
		console.log('🎬 [BookingPolicies] 初始productId:', this.productId);
		console.log('🎬 [BookingPolicies] 初始ctripId:', this.ctripId);
		console.log('🎬 [BookingPolicies] 初始policyData:', toRaw(this.policyData));
		console.log('🎬 [BookingPolicies] 初始localData:', toRaw(this.localData));
		console.log('🎬 [BookingPolicies] 组件创建时状态:', {
			timestamp: new Date().toLocaleString(),
			hasProductId: !!this.productId,
			hasCtripId: !!this.ctripId,
			hasPolicyData: !!this.policyData && Object.keys(this.policyData).length > 0
			// localDataFields: Object.keys(this.localData).length,
			// arrayFields: {
			// 	booking_notes: Array.isArray(this.localData.booking_notes) ? this.localData.booking_notes.length : 'not array',
			// 	important_notes: Array.isArray(this.localData.important_notes) ? this.localData.important_notes.length : 'not array',
			// 	required_items: Array.isArray(this.localData.required_items) ? this.localData.required_items.length : 'not array'
			// }
		});

		// 如果有productId或ctripId但没有政策数据，尝试从数据库获取
		if ((this.productId || this.ctripId) && (!this.policyData || Object.keys(this.policyData).length === 0)) {
			console.log('🔍 [BookingPolicies] 检测到productId或ctripId但无政策数据，开始从数据库获取');
			await this.loadPolicyData();
		}
	},
	async mounted() {
		console.log('🎯 [BookingPolicies] 组件挂载完成');
		console.log('🎯 [BookingPolicies] 挂载时状态检查:', {
			productId: this.productId,
			ctripId: this.ctripId,
			hasPolicy: this.hasPolicy
			// localDataStructure: {
			// 	title: typeof this.localData.title,
			// 	refund_policy: typeof this.localData.refund_policy,
			// 	change_policy: typeof this.localData.change_policy,
			// 	booking_notes_length: this.localData.booking_notes?.length,
			// 	important_notes_length: this.localData.important_notes?.length,
			// 	required_items_length: this.localData.required_items?.length,
			// 	min_age: this.localData.min_age,
			// 	max_age: this.localData.max_age
			// }
		});
	},
	beforeDestroy() {
		console.log('🏁 [BookingPolicies] 组件即将销毁');
		console.log('🏁 [BookingPolicies] 销毁前状态:', {
			timestamp: new Date().toLocaleString(),
			productId: this.productId,
			ctripId: this.ctripId,
			hasPolicy: this.hasPolicy
			// localDataSummary: {
			// 	总字段数: Object.keys(this.localData).length,
			// 	有内容字段数: Object.values(this.localData).filter((v) => v && (typeof v === 'string' ? v.trim() : true)).length,
			// 	数组字段状态: {
			// 		booking_notes: this.localData.booking_notes?.length || 0,
			// 		important_notes: this.localData.important_notes?.length || 0,
			// 		required_items: this.localData.required_items?.length || 0
			// 	}
			// }
		});
	},
	destroyed() {
		console.log('💀 [BookingPolicies] 组件已销毁');
		console.log('💀 [BookingPolicies] 组件销毁完成时间:', new Date().toLocaleString());
	},
	methods: {
		// 获取政策数据
		async loadPolicyData() {
			console.log('🔍 [BookingPolicies] 开始加载政策数据');
			console.log('🔍 [BookingPolicies] 查询条件:', {
				productId: this.productId,
				ctripId: this.ctripId,
				timestamp: new Date().toLocaleString()
			});

			if (!this.productId && !this.ctripId) {
				console.warn('⚠️ [BookingPolicies] 缺少productId和ctripId，无法加载政策数据');
				return;
			}

			try {
				// const db = uniCloud.databaseForJQL({
				//   clientInfo: uni.getSystemInfoSync()
				// });
				const db = uniCloud.databaseForJQL();

				// 构建查询条件 - 避免空值查询
				let whereClause = '';
				if (this.productId && this.ctripId) {
					whereClause = `(product_id == "${this.productId}" || ctrip_id == "${this.ctripId}")`;
				} else if (this.productId) {
					whereClause = `product_id == "${this.productId}"`;
				} else if (this.ctripId) {
					whereClause = `ctrip_id == "${this.ctripId}"`;
				} else {
					console.warn('⚠️ [BookingPolicies] 没有有效的查询条件');
					return;
				}

				console.log('🔍 [BookingPolicies] 构建的查询条件:', whereClause);
				console.log('🔍 [BookingPolicies] 开始数据库查询...');

				const result = await db.collection('a-booking-policies').where(whereClause).get();

				console.log('�� [BookingPolicies] 数据库查询结果:', result);
				console.log('🔍 [BookingPolicies] 查询详情:', {
					success: !!result.data,
					recordCount: result.data?.length || 0,
					hasData: result.data && result.data.length > 0,
					firstRecord: result.data?.[0] || null
				});

				if (result.data && result.data.length > 0) {
					const policyData = result.data[0];
					console.log('✅ [BookingPolicies] 找到政策数据，开始更新localData');
					console.log('✅ [BookingPolicies] 原始政策数据:', policyData);

					// 确保数组字段正确初始化
					const processedData = {
						...policyData,
						booking_notes: Array.isArray(policyData.booking_notes) ? policyData.booking_notes : [''],
						important_notes: Array.isArray(policyData.important_notes) ? policyData.important_notes : [''],
						required_items: Array.isArray(policyData.required_items) ? policyData.required_items : ['']
					};

					console.log('✅ [BookingPolicies] 处理后的政策数据:', processedData);

					this.localData = { ...this.localData, ...processedData };

					console.log('✅ [BookingPolicies] localData更新完成:', toRaw(this.localData));
					console.log('📊 [BookingPolicies] 数据加载统计:', {
						字段数量: Object.keys(processedData).length
						// 数组字段: {
						// 	booking_notes: processedData.booking_notes.length,
						// 	important_notes: processedData.important_notes.length,
						// 	required_items: processedData.required_items.length
						// },
						// 年龄限制: {
						// 	min_age: processedData.min_age,
						// 	max_age: processedData.max_age
						// },
						// 文本字段长度: {
						// 	title: processedData.title?.length || 0,
						// 	refund_policy: processedData.refund_policy?.length || 0,
						// 	change_policy: processedData.change_policy?.length || 0,
						// 	physical_requirements: processedData.physical_requirements?.length || 0,
						// 	insurance_terms: processedData.insurance_terms?.length || 0,
						// 	disclaimer: processedData.disclaimer?.length || 0
						// }
					});
				} else {
					console.log('ℹ️ [BookingPolicies] 未找到现有政策数据，使用默认值');
					console.log('ℹ️ [BookingPolicies] 当前localData保持不变:', this.localData);
				}
			} catch (error) {
				console.error('💥 [BookingPolicies] 加载政策数据失败:', error);
				console.error('💥 [BookingPolicies] 错误详情:', {
					message: error.message,
					code: error.code,
					requestId: error.requestId,
					stack: error.stack
				});

				uni.showToast({
					title: '政策数据加载失败',
					icon: 'none',
					duration: 2000
				});
			}
		},

		// 保存政策数据
		async savePolicyData(data) {
			console.log('💾 [BookingPolicies] 开始保存政策数据');
			console.log('💾 [BookingPolicies] 输入数据:', data);
			console.log('💾 [BookingPolicies] 数据验证:', {
				has_product_id: !!this.productId,
				has_ctrip_id: !!this.ctripId,
				product_id: this.productId,
				ctrip_id: this.ctripId
				// title_length: data.title?.length || 0,
				// refund_policy_length: data.refund_policy?.length || 0,
				// change_policy_length: data.change_policy?.length || 0,
				// booking_notes_count: data.booking_notes?.length || 0,
				// important_notes_count: data.important_notes?.length || 0,
				// required_items_count: data.required_items?.length || 0,
				// has_contact_info: !!(data.contact_phone || data.contact_email),
				// age_range: {
				// 	min: data.min_age,
				// 	max: data.max_age
				// }
			});

			if (!this.productId && !this.ctripId) {
				console.error('❌ [BookingPolicies] 缺少productId和ctripId，无法保存政策数据');
				return;
			}

			try {
				console.log('🔍 [BookingPolicies] 检查现有政策记录...');

				// const db = uniCloud.databaseForJQL({
				//   clientInfo: uni.getSystemInfoSync()
				// });
				const db = uniCloud.databaseForJQL();

				// 检查是否已存在政策记录 - 同时支持product_id和ctrip_id查询
				let whereClause = '';
				if (this.productId && this.ctripId) {
					whereClause = `(product_id == "${this.productId}" || ctrip_id == "${this.ctripId}")`;
				} else if (this.productId) {
					whereClause = `product_id == "${this.productId}"`;
				} else if (this.ctripId) {
					whereClause = `ctrip_id == "${this.ctripId}"`;
				}

				console.log('🔍 [BookingPolicies] 查询条件:', whereClause);

				const existQuery = await db.collection('a-booking-policies').where(whereClause).get();

				console.log('🔍 [BookingPolicies] 查询结果:', existQuery);
				console.log('🔍 [BookingPolicies] 现有记录数量:', existQuery.data?.length || 0);

				// 准备保存的数据
				const saveData = {
					// title: data.title || '',
					// refund_policy: data.refund_policy || '',
					// change_policy: data.change_policy || '',
					// booking_notes: Array.isArray(data.booking_notes) ? data.booking_notes.filter((note) => note.trim()) : [],
					// important_notes: Array.isArray(data.important_notes) ? data.important_notes.filter((note) => note.trim()) : [],
					// min_age: Number(data.min_age) || 0,
					// max_age: Number(data.max_age) || 99,
					// physical_requirements: data.physical_requirements || '',
					// required_items: Array.isArray(data.required_items) ? data.required_items.filter((item) => item.trim()) : [],
					// insurance_terms: data.insurance_terms || '',
					// disclaimer: data.disclaimer || '',
					// contact_phone: data.contact_phone || '',
					// contact_email: data.contact_email || '',
					travel_agency_info: data.travel_agency_info || { agent: '', delegate: '' },
					booking_restrictions: data.booking_restrictions || { age_limit: '', group_limit: '', other_limit: '' },
					accommodation_policy: data.accommodation_policy || { multi_person: '' },
					group_info: data.group_info || { group_description: '', departure_notice: '' },
					booking_requirements: Array.isArray(data.booking_requirements) ? data.booking_requirements.filter((r) => r && r.trim()) : [],
					violation_terms: {
						agency_violation: Array.isArray(data.violation_terms?.agency_violation) ? data.violation_terms.agency_violation.filter((t) => t && t.trim()) : [],
						tourist_violation: Array.isArray(data.violation_terms?.tourist_violation) ? data.violation_terms.tourist_violation.filter((t) => t && t.trim()) : []
					},
					travel_guide: Array.isArray(data.travel_guide) ? data.travel_guide.filter((g) => g && g.trim()) : [],
					safety_tips: Array.isArray(data.safety_tips) ? data.safety_tips.filter((s) => s && s.trim()) : [],
					payment_info: {
						supported_methods: Array.isArray(data.payment_info?.supported_methods) ? data.payment_info.supported_methods.filter((m) => m && m.trim()) : [],
						payment_notes: Array.isArray(data.payment_info?.payment_notes) ? data.payment_info.payment_notes.filter((n) => n && n.trim()) : []
					},
					status: 'active'
				};

				// 设置关联字段
				if (this.productId) {
					saveData.product_id = this.productId;
				}
				if (this.ctripId) {
					saveData.ctrip_id = this.ctripId;
				}

				console.log('📝 [BookingPolicies] 准备保存的数据:', saveData);
				console.log('📝 [BookingPolicies] 数据完整性检查:', {
					字段数量: Object.keys(saveData).length,
					必填字段: {
						product_id: !!saveData.product_id
						// title: typeof saveData.title === 'string',
						// 数组字段完整性: {
						// 	booking_notes_is_array: Array.isArray(saveData.booking_notes),
						// 	important_notes_is_array: Array.isArray(saveData.important_notes),
						// 	required_items_is_array: Array.isArray(saveData.required_items)
						// },
						// 数值字段: {
						// 	min_age_type: typeof saveData.min_age,
						// 	max_age_type: typeof saveData.max_age,
						// 	min_age_value: saveData.min_age,
						// 	max_age_value: saveData.max_age
						// }
					}
					// 过滤后数组长度: {
					// 	booking_notes: saveData.booking_notes.length,
					// 	important_notes: saveData.important_notes.length,
					// 	required_items: saveData.required_items.length
					// }
				});

				let result;
				if (existQuery.data && existQuery.data.length > 0) {
					// 更新现有记录
					const existId = existQuery.data[0]._id;
					console.log('🔄 [BookingPolicies] 更新现有记录, ID:', existId);

					result = await db.collection('a-booking-policies').doc(existId).update(saveData);
					console.log('✅ [BookingPolicies] 更新完成，结果:', result);
				} else {
					// 创建新记录
					console.log('🆕 [BookingPolicies] 创建新记录');

					result = await db.collection('a-booking-policies').add(saveData);
					console.log('✅ [BookingPolicies] 创建完成，结果:', result);

					// 创建成功后，uniCloud 会在 result.id 中返回新记录的 ID
					// 我们需要把它更新回 localData，这样 hasPolicy 就会变为 true
					if (result.id) {
						this.localData._id = result.id;
						console.log('🔄 [BookingPolicies] 已将新创建的ID更新到localData:', this.localData._id);
					}
				}

				console.log('🎉 [BookingPolicies] 政策数据保存成功');
				console.log('📊 [BookingPolicies] 保存统计:', {
					操作类型: existQuery.data && existQuery.data.length > 0 ? '更新' : '创建',
					数据大小: JSON.stringify(saveData).length + ' 字符'
					// 政策条目总数: saveData.booking_notes.length + saveData.important_notes.length + saveData.required_items.length,
					// 联系方式完整性: {
					// 	有电话: !!saveData.contact_phone,
					// 	有邮箱: !!saveData.contact_email
					// },
					// 年龄限制: `${saveData.min_age}-${saveData.max_age}岁`
				});

				// 显示成功提示
				uni.showToast({
					title: '政策保存成功',
					icon: 'success',
					duration: 1500
				});
			} catch (error) {
				console.error('💥 [BookingPolicies] 保存失败:', error);
				console.error('💥 [BookingPolicies] 完整错误对象:', JSON.parse(JSON.stringify(error)));

				// 显示用户友好的错误信息
				uni.showToast({
					title: '政策保存失败',
					icon: 'none',
					duration: 2000
				});
			}
		},

		updateData() {
			console.log('📤 [BookingPolicies] 发送数据更新事件');
			console.log('📤 [BookingPolicies] 当前localData:', this.localData);
			console.log('📤 [BookingPolicies] 数据更新详情:', {
				timestamp: new Date().toLocaleString(),
				productId: this.productId,
				ctripId: this.ctripId,
				hasProductId: !!this.productId,
				hasCtripId: !!this.ctripId
				// 数据变化: {
				// 	title: this.localData.title,
				// 	refund_policy_length: this.localData.refund_policy?.length || 0,
				// 	change_policy_length: this.localData.change_policy?.length || 0,
				// 	booking_notes_count: this.localData.booking_notes?.length || 0,
				// 	important_notes_count: this.localData.important_notes?.length || 0,
				// 	required_items_count: this.localData.required_items?.length || 0
				// }
			});

			// 发送更新事件给父组件
			this.$emit('update', this.localData);

			// 自动保存政策数据
			if (this.productId || this.ctripId) {
				console.log('📝 [BookingPolicies] 触发自动保存政策数据');
				this.savePolicyData(this.localData);
			} else {
				console.warn('⚠️ [BookingPolicies] 无productId和ctripId，跳过自动保存');
			}
		},

		createPolicy() {
			console.log('🆕 [BookingPolicies] 开始创建新政策');
			console.log('🆕 [BookingPolicies] 创建前状态:', {
				productId: this.productId,
				ctripId: this.ctripId,
				hasExistingData: !!this.localData && Object.keys(this.localData).length > 0,
				timestamp: new Date().toLocaleString()
			});

			// const defaultPolicy = {
			// 	// title: '',
			// 	// refund_policy: '',
			// 	// change_policy: '',
			// 	// booking_notes: [''],
			// 	// important_notes: [''],
			// 	// min_age: 0,
			// 	// max_age: 99,
			// 	// physical_requirements: '',
			// 	// required_items: [''],
			// 	// insurance_terms: '',
			// 	// disclaimer: '',
			// 	// contact_phone: '',
			// 	// contact_email: '',

			// 	travel_agency_info: {
			// 		agent: '',
			// 		delegate: ''
			// 	},
			// 	booking_restrictions: {
			// 		age_limit: '',
			// 		group_limit: '',
			// 		other_limit: ''
			// 	},
			// 	accommodation_policy: {
			// 		multi_person: ''
			// 	},
			// 	group_info: {
			// 		group_description: '',
			// 		departure_notice: ''
			// 	},
			// 	booking_requirements: [''],
			// 	violation_terms: {
			// 		agency_violation: [''],
			// 		tourist_violation: ['']
			// 	},
			// 	travel_guide: [''],
			// 	safety_tips: [''],
			// 	payment_info: {
			// 		supported_methods: [''],
			// 		payment_notes: ''
			// 	}
			// };

			// console.log('🆕 [BookingPolicies] 默认政策模板:', defaultPolicy);

			// this.localData = defaultPolicy;

			this.localData = JSON.parse(JSON.stringify(defaultLocalData));

			console.log('✅ [BookingPolicies] 政策创建完成');
			console.log('✅ [BookingPolicies] 新政策状态:', {
				字段数量: Object.keys(this.localData).length
				// 数组字段初始化: {
				// 	booking_notes: this.localData.booking_notes.length,
				// 	important_notes: this.localData.important_notes.length,
				// 	required_items: this.localData.required_items.length
				// },
				// 年龄设置: {
				// 	min: this.localData.min_age,
				// 	max: this.localData.max_age
				// }
			});

			this.updateData();
		},

		// addBookingNote() {
		// 	console.log('➕ [BookingPolicies] 添加预定须知');
		// 	console.log('➕ [BookingPolicies] 添加前状态:', {
		// 		当前数量: this.localData.booking_notes.length,
		// 		现有内容: this.localData.booking_notes,
		// 		timestamp: new Date().toLocaleString()
		// 	});

		// 	this.localData.booking_notes.push('');

		// 	console.log('✅ [BookingPolicies] 预定须知添加完成');
		// 	console.log('✅ [BookingPolicies] 添加后状态:', {
		// 		新数量: this.localData.booking_notes.length,
		// 		最后项索引: this.localData.booking_notes.length - 1,
		// 		数组内容: this.localData.booking_notes
		// 	});

		// 	this.updateData();
		// },

		// removeBookingNote(index) {
		// 	console.log('🗑️ [BookingPolicies] 删除预定须知');
		// 	console.log('🗑️ [BookingPolicies] 删除参数:', {
		// 		删除索引: index,
		// 		删除前数量: this.localData.booking_notes.length,
		// 		被删除内容: this.localData.booking_notes[index],
		// 		删除前数组: [...this.localData.booking_notes],
		// 		timestamp: new Date().toLocaleString()
		// 	});

		// 	if (index >= 0 && index < this.localData.booking_notes.length) {
		// 		this.localData.booking_notes.splice(index, 1);

		// 		console.log('✅ [BookingPolicies] 预定须知删除完成');
		// 		console.log('✅ [BookingPolicies] 删除后状态:', {
		// 			新数量: this.localData.booking_notes.length,
		// 			删除后数组: this.localData.booking_notes,
		// 			是否还有内容: this.localData.booking_notes.length > 0
		// 		});
		// 	} else {
		// 		console.error('❌ [BookingPolicies] 删除索引无效:', {
		// 			提供索引: index,
		// 			有效范围: `0-${this.localData.booking_notes.length - 1}`,
		// 			当前数组长度: this.localData.booking_notes.length
		// 		});
		// 		return;
		// 	}

		// 	this.updateData();
		// },

		// addImportantNote() {
		// 	console.log('➕ [BookingPolicies] 添加注意事项');
		// 	console.log('➕ [BookingPolicies] 添加前状态:', {
		// 		当前数量: this.localData.important_notes.length,
		// 		现有内容: this.localData.important_notes,
		// 		timestamp: new Date().toLocaleString()
		// 	});

		// 	this.localData.important_notes.push('');

		// 	console.log('✅ [BookingPolicies] 注意事项添加完成');
		// 	console.log('✅ [BookingPolicies] 添加后状态:', {
		// 		新数量: this.localData.important_notes.length,
		// 		最后项索引: this.localData.important_notes.length - 1,
		// 		数组内容: this.localData.important_notes
		// 	});

		// 	this.updateData();
		// },

		// removeImportantNote(index) {
		// 	console.log('🗑️ [BookingPolicies] 删除注意事项');
		// 	console.log('🗑️ [BookingPolicies] 删除参数:', {
		// 		删除索引: index,
		// 		删除前数量: this.localData.important_notes.length,
		// 		被删除内容: this.localData.important_notes[index],
		// 		删除前数组: [...this.localData.important_notes],
		// 		timestamp: new Date().toLocaleString()
		// 	});

		// 	if (index >= 0 && index < this.localData.important_notes.length) {
		// 		this.localData.important_notes.splice(index, 1);

		// 		console.log('✅ [BookingPolicies] 注意事项删除完成');
		// 		console.log('✅ [BookingPolicies] 删除后状态:', {
		// 			新数量: this.localData.important_notes.length,
		// 			删除后数组: this.localData.important_notes,
		// 			是否还有内容: this.localData.important_notes.length > 0
		// 		});
		// 	} else {
		// 		console.error('❌ [BookingPolicies] 删除索引无效:', {
		// 			提供索引: index,
		// 			有效范围: `0-${this.localData.important_notes.length - 1}`,
		// 			当前数组长度: this.localData.important_notes.length
		// 		});
		// 		return;
		// 	}

		// 	this.updateData();
		// },

		// addRequiredItem() {
		// 	console.log('➕ [BookingPolicies] 添加携带物品');
		// 	console.log('➕ [BookingPolicies] 添加前状态:', {
		// 		当前数量: this.localData.required_items.length,
		// 		现有内容: this.localData.required_items,
		// 		timestamp: new Date().toLocaleString()
		// 	});

		// 	this.localData.required_items.push('');

		// 	console.log('✅ [BookingPolicies] 携带物品添加完成');
		// 	console.log('✅ [BookingPolicies] 添加后状态:', {
		// 		新数量: this.localData.required_items.length,
		// 		最后项索引: this.localData.required_items.length - 1,
		// 		数组内容: this.localData.required_items
		// 	});

		// 	this.updateData();
		// },

		// removeRequiredItem(index) {
		// 	console.log('🗑️ [BookingPolicies] 删除携带物品');
		// 	console.log('🗑️ [BookingPolicies] 删除参数:', {
		// 		删除索引: index,
		// 		删除前数量: this.localData.required_items.length,
		// 		被删除内容: this.localData.required_items[index],
		// 		删除前数组: [...this.localData.required_items],
		// 		timestamp: new Date().toLocaleString()
		// 	});

		// 	if (index >= 0 && index < this.localData.required_items.length) {
		// 		this.localData.required_items.splice(index, 1);

		// 		console.log('✅ [BookingPolicies] 携带物品删除完成');
		// 		console.log('✅ [BookingPolicies] 删除后状态:', {
		// 			新数量: this.localData.required_items.length,
		// 			删除后数组: this.localData.required_items,
		// 			是否还有内容: this.localData.required_items.length > 0
		// 		});
		// 	} else {
		// 		console.error('❌ [BookingPolicies] 删除索引无效:', {
		// 			提供索引: index,
		// 			有效范围: `0-${this.localData.required_items.length - 1}`,
		// 			当前数组长度: this.localData.required_items.length
		// 		});
		// 		return;
		// 	}

		// 	this.updateData();
		// },

		addBookingRequirement() {
			this.localData.booking_requirements.push('');
			this.updateData();
		},

		removeBookingRequirement(index) {
			this.localData.booking_requirements.splice(index, 1);
			this.updateData();
		},

		addViolationTerm(type, index) {
			if (type === 'agency') this.localData.violation_terms.agency_violation.push('');
			else this.localData.violation_terms.tourist_violation.push('');
			this.updateData();
		},

		removeViolationTerm(type, index) {
			if (type === 'agency') this.localData.violation_terms.agency_violation.splice(index, 1);
			else this.localData.violation_terms.tourist_violation.splice(index, 1);
			this.updateData();
		},

		addTravelGuide() {
			this.localData.travel_guide.push('');
			this.updateData();
		},

		removeTravelGuide(index) {
			this.localData.travel_guide.splice(index, 1);
			this.updateData();
		},

		addSafetyTip() {
			this.localData.safety_tips.push('');
			this.updateData();
		},

		removeSafetyTip(index) {
			this.localData.safety_tips.splice(index, 1);
			this.updateData();
		},

		addSupportedMethod() {
			this.localData.payment_info.supported_methods.push('');
			this.updateData();
		},

		removeSupportedMethod(index) {
			this.localData.payment_info.supported_methods.splice(index, 1);
			this.updateData();
		}
	}
};
</script>

<style scoped>
.table-responsive {
	overflow-x: auto;
}

.remove-btn {
	width: 3rem; /* 48px */
	height: 3rem; /* 48px */
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #ef4444;
	color: #ffffff;
	border-radius: 0.5rem; /* 8px */
	transition: background-color 0.2s ease-in-out;
	cursor: pointer;
}

.remove-btn:hover {
	background-color: #dc2626;
}
</style>