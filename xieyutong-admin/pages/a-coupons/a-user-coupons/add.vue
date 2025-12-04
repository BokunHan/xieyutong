<template>
	<view class="uni-container">
		<uni-forms ref="form" :model="formData" validateTrigger="bind" label-width="100" label-align="right">
			<uni-forms-item name="selected_users" label="发放用户" required>
				<view class="w-full">
					<view v-if="!formData.selected_users || formData.selected_users.length === 0" class="text-sm text-gray-400 mb-2">暂无用户</view>
					<view v-else class="w-full space-y-2 mb-3">
						<view v-for="(user, index) in formData.selected_users" :key="user.id" class="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-lg">
							<view class="flex items-center">
								<i class="fas fa-user text-emerald-600 mr-2"></i>
								<text class="text-sm text-gray-800">{{ user.mobile || '号码缺失' }}</text>
							</view>
							<button
								@click="removeUser(index)"
								class="px-2 py-0 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors"
								style="line-height: 1.5rem; margin: 0">
								移除
							</button>
						</view>
					</view>
					<uni-combox
						v-model="userSearchInput"
						:candidates="userCandidates"
						label-key="mobile"
						value-key="_id"
						placeholder="输入手机号搜索并添加用户"
						@input="searchUsers"
						@change="onUserSelect"
						@click="loadDefaultUsers" />
				</view>
			</uni-forms-item>

			<uni-forms-item name="coupon_id" label="选择优惠券" required>
				<uni-combox
					v-model="formData.coupon_id"
					:candidates="couponCandidates"
					label-key="title"
					value-key="_id"
					placeholder="输入标题搜索优惠券"
					@input="searchCoupons"
					@change="onCouponSelect"
					@click="loadDefaultCoupons" />
			</uni-forms-item>

			<uni-forms-item name="source_type" label="获取来源" required>
				<uni-data-checkbox v-model="formData.source_type" :localdata="formOptions.source_type_localdata"></uni-data-checkbox>
			</uni-forms-item>

			<uni-forms-item name="remark" label="备注">
				<uni-easyinput type="textarea" placeholder="备注信息 (例如：后台手动发放)" v-model="formData.remark"></uni-easyinput>
			</uni-forms-item>

			<view class="uni-button-group">
				<button type="primary" class="uni-button" style="width: 100px" @click="submit">提交</button>
				<navigator open-type="navigateBack" style="margin-left: 15px">
					<button class="uni-button" style="width: 100px">返回</button>
				</navigator>
			</view>
		</uni-forms>
	</view>
</template>

<script>
import { validator } from '../../../js_sdk/validator/a-user-coupons.js';

const db = uniCloud.database();
const dbCmd = db.command;
const dbCollectionName = 'a-user-coupons';
const couponsCollection = db.collection('a-coupons');
const usersCollection = db.collection('uni-id-users');

function getValidator(fields) {
	let result = {};
	for (let key in validator) {
		if (fields.includes(key)) {
			result[key] = validator[key];
		}
	}
	return result;
}

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateCouponCode() {
	const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let result = '';
	for (let i = 0; i < 12; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

export default {
	data() {
		let formData = {
			selected_users: [],
			coupon_id: '',
			source_type: 'manual',
			remark: ''
		};
		return {
			formData,
			formOptions: {
				source_type_localdata: [
					{ value: 'manual', text: '手动发放' },
					{ value: 'referral_reward', text: '推荐奖励' },
					{ value: 'new_user_gift', text: '新用户礼品' },
					{ value: 'member_upgrade', text: '会员升级' },
					{ value: 'activity', text: '活动赠送' }
				]
			},
			rules: {},

			userSearchInput: '',
			userCandidates: [],
			userSearchTimer: null,

			couponSearchInput: '',
			couponCandidates: [],
			couponSearchTimer: null,
			selectedCoupon: null
		};
	},
	onReady() {
		const newRules = {
			selected_users: {
				rules: [
					{
						required: true,
						validateFunction: (rule, value, data, callback) => {
							if (!value || value.length === 0) {
								callback('请至少选择一个用户');
							}
							return true;
						}
					}
				]
			},
			coupon_id: {
				rules: [{ required: true, errorMessage: '请选择一个优惠券' }]
			},
			source_type: {
				rules: [{ required: true, errorMessage: '请选择来源' }]
			}
		};
		this.$refs.form.setRules(newRules);
		this.rules = newRules;
	},
	methods: {
		/**
		 * 验证表单并提交
		 */
		submit() {
			this.$refs.form
				.validate()
				.then((res) => {
					this.submitForm(res);
				})
				.catch((err) => {
					console.log('表单错误信息：', err);
				});
		},

		/**
		 * 提交表单
		 */
		async submitForm(value) {
			uni.showLoading({ mask: true, title: '正在发放...' });
			try {
				const usersToIssue = this.formData.selected_users;
				const couponId = this.formData.coupon_id;

				if (!usersToIssue || usersToIssue.length === 0) {
					throw new Error('请至少选择一个用户');
				}
				if (!couponId) {
					throw new Error('请选择一个优惠券');
				}

				// 1. 获取优惠券模板
				let coupon = this.selectedCoupon;
				if (!coupon || coupon._id !== couponId) {
					const couponRes = await couponsCollection.doc(couponId).get();
					if (!couponRes.result || !couponRes.result.data || couponRes.result.data.length === 0) {
						throw new Error('优惠券ID不存在 (a-coupons)');
					}
					coupon = couponRes.result.data[0];
				}

				const now = Date.now();
				const expired_at = now + coupon.valid_days * 24 * 60 * 60 * 1000;
				const dataToSubmitList = [];

				// 2. 准备批量数据
				for (const user of usersToIssue) {
					const coupon_code = generateCouponCode();
					const dataToSubmit = {
						user_id: user.id,
						coupon_id: couponId,
						source_type: value.source_type,
						remark: value.remark,
						coupon_code: coupon_code,
						status: 'unused',
						expired_at: expired_at,
						type: coupon.type,
						amount: coupon.amount,
						min_amount: coupon.min_amount,
						title: coupon.title,
						source_detail: {
							admin_user: 'admin'
						}
					};
					dataToSubmitList.push(dataToSubmit);
				}

				// 3. 批量提交
				const res = await db.collection(dbCollectionName).add(dataToSubmitList);

				uni.hideLoading();
				uni.showToast({ title: `成功发放 ${dataToSubmitList.length} 张优惠券` });
				this.getOpenerEventChannel().emit('refreshData');
				setTimeout(() => uni.navigateBack(), 500);
			} catch (err) {
				uni.hideLoading();
				uni.showModal({
					content: err.message || '请求服务失败',
					showCancel: false
				});
			}
		},

		// =============================================
		// 用户搜索框相关方法
		// =============================================
		async loadDefaultUsers() {
			if (this.userSearchInput) return;
			if (this.userSearchTimer) clearTimeout(this.userSearchTimer);
			try {
				const res = await usersCollection.where('mobile != null').field('_id, mobile').limit(30).orderBy('register_date', 'desc').get();
				if (res.result.data) this.userCandidates = res.result.data;
			} catch (err) {
				console.error('loadDefaultUsers error:', err);
			}
		},

		searchUsers(query) {
			this.userSearchInput = query;
			if (this.userSearchTimer) clearTimeout(this.userSearchTimer);
			if (!query) {
				this.loadDefaultUsers();
				return;
			}
			const escapedQuery = escapeRegExp(query);
			this.userSearchTimer = setTimeout(async () => {
				try {
					const res = await usersCollection
						.where({ mobile: new RegExp(escapedQuery, 'i') })
						.field('_id, mobile')
						.limit(30)
						.get();
					if (res.result.data) this.userCandidates = res.result.data;
				} catch (err) {
					console.error('searchUsers error:', err);
				}
			}, 300);
		},

		onUserSelect(selectedUserId) {
			if (!selectedUserId) return;
			const selectedUser = this.userCandidates.find((user) => user._id === selectedUserId);
			if (!selectedUser) return;

			const isDuplicate = this.formData.selected_users.some((user) => user.id === selectedUserId);
			if (isDuplicate) {
				uni.showToast({ title: '用户已在列表中', icon: 'none' });
				this.resetUserCombox();
				return;
			}

			this.formData.selected_users.push({
				id: selectedUserId,
				mobile: selectedUser.mobile
			});
			this.resetUserCombox();
		},

		removeUser(index) {
			this.formData.selected_users.splice(index, 1);
		},

		resetUserCombox() {
			this.$nextTick(() => {
				this.userSearchInput = '';
				this.userCandidates = [];
			});
		},

		// =============================================
		// 优惠券搜索框相关方法
		// =============================================
		async loadDefaultCoupons() {
			if (this.couponSearchInput) return;
			if (this.couponSearchTimer) clearTimeout(this.couponSearchTimer);
			try {
				const res = await couponsCollection.field('_id, title, amount, min_amount, valid_days').limit(30).orderBy('created_at', 'desc').get();
				if (res.result.data) this.couponCandidates = res.result.data;
			} catch (err) {
				console.error('loadDefaultCoupons error:', err);
			}
		},

		searchCoupons(query) {
			this.couponSearchInput = query;
			if (this.couponSearchTimer) clearTimeout(this.couponSearchTimer);
			if (!query) {
				this.loadDefaultCoupons();
				return;
			}
			const escapedQuery = escapeRegExp(query);
			this.couponSearchTimer = setTimeout(async () => {
				try {
					const res = await couponsCollection
						.where({ title: new RegExp(escapedQuery, 'i') })
						.field('_id, title, amount, min_amount, valid_days')
						.limit(30)
						.get();
					if (res.result.data) this.couponCandidates = res.result.data;
				} catch (err) {
					console.error('searchCoupons error:', err);
				}
			}, 300);
		},

		onCouponSelect(selectedCouponId) {
			if (!selectedCouponId) {
				this.selectedCoupon = null;
				this.formData.coupon_id = '';
				return;
			}
			this.selectedCoupon = this.couponCandidates.find((c) => c._id === selectedCouponId);
			this.formData.coupon_id = selectedCouponId;
			this.$nextTick(() => {
				this.couponSearchInput = '';
			});
		}
	}
};
</script>

<style>
.uni-container {
	padding: 20px;
}
.uni-forms-item {
	margin-bottom: 20px;
}
.w-full {
	width: 100%;
}
.text-sm {
	font-size: 14px;
}
.text-gray-400 {
	color: #9ca3af;
}
.mb-2 {
	margin-bottom: 8px;
}
.mb-3 {
	margin-bottom: 12px;
}
.space-y-2 > * + * {
	margin-top: 8px;
}
.flex {
	display: flex;
}
.items-center {
	align-items: center;
}
.justify-between {
	justify-content: space-between;
}
.bg-gray-100 {
	background-color: #f3f4f6;
}
.px-3 {
	padding-left: 12px;
	padding-right: 12px;
}
.py-2 {
	padding-top: 8px;
	padding-bottom: 8px;
}
.rounded-lg {
	border-radius: 8px;
}
.text-gray-800 {
	color: #1f2937;
}
.fa-user {
	margin-right: 8px;
}
.text-emerald-600 {
	color: #059669;
}
</style>
