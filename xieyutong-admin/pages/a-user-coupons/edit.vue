<!-- <template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="user_id" label="用户ID" required>
        <uni-easyinput placeholder="用户ID，关联uni-id-users表" v-model="formData.user_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="coupon_id" label="优惠券ID" required>
        <uni-easyinput placeholder="优惠券ID，关联a-coupons表" v-model="formData.coupon_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="coupon_code" label="优惠券码">
        <uni-easyinput placeholder="优惠券码，用户使用时的唯一标识" v-model="formData.coupon_code"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="status" label="使用状态" required>
        <uni-data-checkbox v-model="formData.status" :localdata="formOptions.status_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="order_id" label="关联订单ID">
        <uni-easyinput placeholder="使用该券的订单ID" v-model="formData.order_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="source_type" label="获取来源">
        <uni-data-checkbox v-model="formData.source_type" :localdata="formOptions.source_type_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="source_detail" label="来源详情">
        <undefined v-model="formData.source_detail"></undefined>
      </uni-forms-item>
      <uni-forms-item name="received_at" label="领取时间">
        <uni-datetime-picker return-type="timestamp" v-model="formData.received_at"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="used_at" label="使用时间">
        <uni-datetime-picker return-type="timestamp" v-model="formData.used_at"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="expired_at" label="过期时间">
        <uni-datetime-picker return-type="timestamp" v-model="formData.expired_at"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="amount" label="优惠金额">
        <undefined v-model="formData.amount"></undefined>
      </uni-forms-item>
      <uni-forms-item name="min_amount" label="使用门槛">
        <undefined v-model="formData.min_amount"></undefined>
      </uni-forms-item>
      <uni-forms-item name="title" label="券标题">
        <uni-easyinput placeholder="优惠券标题（冗余存储）" v-model="formData.title"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="remark" label="备注">
        <uni-easyinput placeholder="备注信息" v-model="formData.remark"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="created_at" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.created_at"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="updated_at" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.updated_at"></uni-datetime-picker>
      </uni-forms-item>
      <view class="uni-button-group">
        <button type="primary" class="uni-button" style="width: 100px;" @click="submit">提交</button>
        <navigator open-type="navigateBack" style="margin-left: 15px;">
          <button class="uni-button" style="width: 100px;">返回</button>
        </navigator>
      </view>
    </uni-forms>
  </view>
</template> -->

<template>
	<view class="uni-container">
		<uni-forms ref="form" :model="formData" validateTrigger="bind">
			<uni-forms-item name="user_id" label="用户" required>
				<view class="form-field-readonly">
					<text>{{ userInfo.mobile || '加载中...' }}</text>
				</view>
			</uni-forms-item>

			<uni-forms-item name="coupon_id" label="优惠券" required>
				<view class="form-field-readonly">
					<text>{{ couponInfo.title || '加载中...' }}</text>
				</view>
			</uni-forms-item>

			<uni-forms-item name="coupon_code" label="优惠券码">
				<uni-easyinput placeholder="优惠券码，用户使用时的唯一标识" v-model="formData.coupon_code"></uni-easyinput>
			</uni-forms-item>

			<uni-forms-item name="status" label="使用状态" required>
				<uni-data-checkbox v-model="formData.status" :localdata="formOptions.status_localdata"></uni-data-checkbox>
			</uni-forms-item>

			<uni-forms-item name="source_type" label="获取来源">
				<uni-data-checkbox v-model="formData.source_type" :localdata="formOptions.source_type_localdata"></uni-data-checkbox>
			</uni-forms-item>

			<uni-forms-item name="expired_at" label="过期时间">
				<uni-datetime-picker return-type="timestamp" v-model="formData.expired_at"></uni-datetime-picker>
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
import { validator } from '../../js_sdk/validator/a-user-coupons.js';

const db = uniCloud.database();
const dbCmd = db.command;
const dbCollectionName = 'a-user-coupons';

function getValidator(fields) {
	let result = {};
	for (let key in validator) {
		if (fields.includes(key)) {
			result[key] = validator[key];
		}
	}
	return result;
}

export default {
	data() {
		// let formData = {
		//   "user_id": "",
		//   "coupon_id": "",
		//   "coupon_code": "",
		//   "status": "",
		//   "order_id": "",
		//   "source_type": "",
		//   "source_detail": null,
		//   "received_at": null,
		//   "used_at": null,
		//   "expired_at": null,
		//   "amount": null,
		//   "min_amount": null,
		//   "title": "",
		//   "remark": "",
		//   "created_at": null,
		//   "updated_at": null
		// }
		let formData = {
			user_id: '',
			coupon_id: '',
			coupon_code: '',
			status: '',
			source_type: '',
			expired_at: null
		};
		return {
			formData,
			userInfo: {},
			couponInfo: {},
			formOptions: {
				status_localdata: [
					{
						value: 'unused',
						text: '未使用'
					},
					{
						value: 'used',
						text: '已使用'
					},
					{
						value: 'expired',
						text: '已过期'
					}
				],
				source_type_localdata: [
					{
						value: 'manual',
						text: '手动发放'
					},
					{
						value: 'referral_reward',
						text: '推荐奖励'
					},
					{
						value: 'new_user_gift',
						text: '新用户礼品'
					},
					{
						value: 'member_upgrade',
						text: '会员升级'
					},
					{
						value: 'activity',
						text: '活动赠送'
					}
				]
			},
			rules: {
				...getValidator(Object.keys(formData))
			}
		};
	},
	onLoad(e) {
		if (e.id) {
			const id = e.id;
			this.formDataId = id;
			this.getDetail(id);
		}
	},
	onReady() {
		this.$refs.form.setRules(this.rules);
	},
	methods: {
		/**
		 * 验证表单并提交
		 */
		submit() {
			uni.showLoading({
				mask: true
			});
			this.$refs.form
				.validate()
				.then((res) => {
					return this.submitForm(res);
				})
				.catch(() => {})
				.finally(() => {
					uni.hideLoading();
				});
		},

		/**
		 * 提交表单
		 */
		submitForm(value) {
			// 使用 clientDB 提交数据
			return db
				.collection(dbCollectionName)
				.doc(this.formDataId)
				.update(value)
				.then((res) => {
					uni.showToast({
						title: '修改成功'
					});
					this.getOpenerEventChannel().emit('refreshData');
					setTimeout(() => uni.navigateBack(), 500);
				})
				.catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					});
				});
		},

		/**
		 * 获取表单数据
		 * @param {Object} id
		 */
		getDetail(id) {
			uni.showLoading({
				mask: true
			});
			db.collection(dbCollectionName)
				.doc(id)
				.field('user_id,coupon_id,coupon_code,status,source_type,expired_at')
				.get()
				.then((res) => {
					const data = res.result.data[0];
					if (data) {
						this.formData = data;
						this.loadUserInfo(data.user_id);
						this.loadCouponInfo(data.coupon_id);
					}
				})
				.catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					});
				})
				.finally(() => {
					uni.hideLoading();
				});
		},

		loadUserInfo(userId) {
			db.collection('uni-id-users')
				.doc(userId)
				.field('mobile')
				.get()
				.then((res) => {
					this.userInfo = res.result.data[0] || { mobile: '用户不存在' };
				});
		},

		// (新增) 加载优惠券信息
		loadCouponInfo(couponId) {
			db.collection('a-coupons')
				.doc(couponId)
				.field('title')
				.get()
				.then((res) => {
					this.couponInfo = res.result.data[0] || { title: '优惠券不存在' };
				});
		}
	}
};
</script>

<style>
.form-field-readonly {
	width: 100%;
	height: 36px;
	padding: 0 10px;
	line-height: 36px;
	background-color: #f5f5f5;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	color: #666;
	font-size: 14px;
	box-sizing: border-box;
}
</style>
