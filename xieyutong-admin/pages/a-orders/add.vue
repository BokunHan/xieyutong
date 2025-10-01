<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="order_no" label="订单号" required>
        <uni-easyinput placeholder="订单号，唯一标识" v-model="formData.order_no"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="user_id" label="用户ID" required>
        <uni-easyinput placeholder="用户ID，关联uni-id-users表" v-model="formData.user_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="product_id" label="商品ID" required>
        <uni-easyinput placeholder="商品ID，关联a-products表" v-model="formData.product_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="product_snapshot" label="商品快照">
        <undefined v-model="formData.product_snapshot"></undefined>
      </uni-forms-item>
      <uni-forms-item name="status" label="订单状态" required>
        <uni-data-checkbox v-model="formData.status" :localdata="formOptions.status_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="quantity" label="购买数量">
        <undefined v-model="formData.quantity"></undefined>
      </uni-forms-item>
      <uni-forms-item name="total_amount" label="订单总金额">
        <undefined v-model="formData.total_amount"></undefined>
      </uni-forms-item>
      <uni-forms-item name="discount_amount" label="折扣金额">
        <undefined v-model="formData.discount_amount"></undefined>
      </uni-forms-item>
      <uni-forms-item name="coupon_discount" label="优惠券折扣">
        <undefined v-model="formData.coupon_discount"></undefined>
      </uni-forms-item>
      <uni-forms-item name="member_discount" label="会员折扣">
        <undefined v-model="formData.member_discount"></undefined>
      </uni-forms-item>
      <uni-forms-item name="final_amount" label="最终支付金额">
        <undefined v-model="formData.final_amount"></undefined>
      </uni-forms-item>
      <uni-forms-item name="coupons_used" label="使用优惠券">
        <uni-data-checkbox :multiple="true" v-model="formData.coupons_used"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="member_level" label="会员等级">
        <uni-data-checkbox v-model="formData.member_level" :localdata="formOptions.member_level_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="contact_info" label="联系人信息">
        <undefined v-model="formData.contact_info"></undefined>
      </uni-forms-item>
      <uni-forms-item name="travelers" label="出行人信息">
        <uni-data-checkbox :multiple="true" v-model="formData.travelers"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="departure_date" label="出发日期">
        <uni-datetime-picker return-type="timestamp" v-model="formData.departure_date"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="return_date" label="返回日期">
        <uni-datetime-picker return-type="timestamp" v-model="formData.return_date"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="duration_days" label="行程天数">
        <undefined v-model="formData.duration_days"></undefined>
      </uni-forms-item>
      <uni-forms-item name="special_requirements" label="特殊要求">
        <uni-easyinput placeholder="特殊要求" v-model="formData.special_requirements"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="payment_info" label="支付信息">
        <undefined v-model="formData.payment_info"></undefined>
      </uni-forms-item>
      <uni-forms-item name="ctrip_sync" label="携程同步">
        <undefined v-model="formData.ctrip_sync"></undefined>
      </uni-forms-item>
      <uni-forms-item name="notes" label="订单备注">
        <uni-easyinput placeholder="订单备注" v-model="formData.notes"></uni-easyinput>
      </uni-forms-item>
      <!-- <uni-forms-item name="created_at" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.created_at"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="updated_at" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.updated_at"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="paid_at" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.paid_at"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="confirmed_at" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.confirmed_at"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="completed_at" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.completed_at"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="cancelled_at" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.cancelled_at"></uni-datetime-picker>
      </uni-forms-item> -->
      <view class="uni-button-group">
        <button type="primary" class="uni-button" style="width: 100px;" @click="submit">提交</button>
        <navigator open-type="navigateBack" style="margin-left: 15px;">
          <button class="uni-button" style="width: 100px;">返回</button>
        </navigator>
      </view>
    </uni-forms>
  </view>
</template>

<script>
  import { validator } from '../../js_sdk/validator/a-orders.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'a-orders';

  function getValidator(fields) {
    let result = {}
    for (let key in validator) {
      if (fields.includes(key)) {
        result[key] = validator[key]
      }
    }
    return result
  }

  

  export default {
    data() {
      let formData = {
        "order_no": "",
        "user_id": "",
        "product_id": "",
        "product_snapshot": null,
        "status": "",
        "quantity": null,
        "total_amount": null,
        "discount_amount": null,
        "coupon_discount": null,
        "member_discount": null,
        "final_amount": null,
        "coupons_used": [],
        "member_level": "",
        "contact_info": null,
        "travelers": [],
        "departure_date": null,
        "return_date": null,
        "duration_days": null,
        "special_requirements": "",
        "payment_info": null,
        "ctrip_sync": null,
        "notes": "",
        // "created_at": null,
        // "updated_at": null,
        // "paid_at": null,
        // "confirmed_at": null,
        // "completed_at": null,
        // "cancelled_at": null
      }
      return {
        formData,
        formOptions: {
          "status_localdata": [
            {
              "value": "pending",
              "text": "pending"
            },
            {
              "value": "paid",
              "text": "paid"
            },
            {
              "value": "confirmed",
              "text": "confirmed"
            },
            {
              "value": "processing",
              "text": "processing"
            },
            {
              "value": "completed",
              "text": "completed"
            },
            {
              "value": "cancelled",
              "text": "cancelled"
            },
            {
              "value": "refunded",
              "text": "refunded"
            }
          ],
          "member_level_localdata": [
            {
              "value": "normal",
              "text": "normal"
            },
            {
              "value": "silver",
              "text": "silver"
            },
            {
              "value": "gold",
              "text": "gold"
            },
            {
              "value": "diamond",
              "text": "diamond"
            }
          ]
        },
        rules: {
          ...getValidator(Object.keys(formData))
        }
      }
    },
    onReady() {
      this.$refs.form.setRules(this.rules)
    },
    methods: {
      
      /**
       * 验证表单并提交
       */
      submit() {
        uni.showLoading({
          mask: true
        })
        this.$refs.form.validate().then((res) => {
          return this.submitForm(res)
        }).catch(() => {
        }).finally(() => {
          uni.hideLoading()
        })
      },

      /**
       * 提交表单
       */
      submitForm(value) {
        // 使用 clientDB 提交数据
        return db.collection(dbCollectionName).add(value).then((res) => {
          uni.showToast({
            title: '新增成功'
          })
          this.getOpenerEventChannel().emit('refreshData')
          setTimeout(() => uni.navigateBack(), 500)
        }).catch((err) => {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          })
        })
      }
    }
  }
</script>
