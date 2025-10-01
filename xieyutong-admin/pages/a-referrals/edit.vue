<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="referrer_id" label="推荐人ID" required>
        <uni-easyinput placeholder="推荐人用户ID（老客户，获得推荐感谢券）" v-model="formData.referrer_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="referee_id" label="被推荐人ID" required>
        <uni-easyinput placeholder="被推荐人用户ID（被老客户推荐的新人，获得新人专享券）" v-model="formData.referee_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="order_id" label="关联订单ID">
        <uni-easyinput placeholder="触发奖励的订单ID" v-model="formData.order_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="order_amount" label="订单金额">
        <undefined v-model="formData.order_amount"></undefined>
      </uni-forms-item>
      <uni-forms-item name="referrer_coupon_id" label="推荐感谢券ID">
        <uni-easyinput placeholder="推荐人获得的感谢券ID" v-model="formData.referrer_coupon_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="referee_coupon_id" label="新人专享券ID">
        <uni-easyinput placeholder="被推荐新人获得的专享券ID" v-model="formData.referee_coupon_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="referrer_coupon_amount" label="推荐感谢券金额">
        <undefined v-model="formData.referrer_coupon_amount"></undefined>
      </uni-forms-item>
      <uni-forms-item name="referee_coupon_amount" label="新人专享券金额">
        <undefined v-model="formData.referee_coupon_amount"></undefined>
      </uni-forms-item>
      <uni-forms-item name="status" label="状态" required>
        <uni-data-checkbox v-model="formData.status" :localdata="formOptions.status_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="order_date" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.order_date"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="coupon_sent_date" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.coupon_sent_date"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="remark" label="">
        <uni-easyinput placeholder="备注信息" v-model="formData.remark"></uni-easyinput>
      </uni-forms-item>
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
  import { validator } from '../../js_sdk/validator/a-referrals.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'a-referrals';

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
        "referrer_id": "",
        "referee_id": "",
        "order_id": "",
        "order_amount": null,
        "referrer_coupon_id": "",
        "referee_coupon_id": "",
        "referrer_coupon_amount": null,
        "referee_coupon_amount": null,
        "status": "",
        "order_date": null,
        "coupon_sent_date": null,
        "remark": ""
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
              "value": "confirmed",
              "text": "confirmed"
            },
            {
              "value": "completed",
              "text": "completed"
            }
          ]
        },
        rules: {
          ...getValidator(Object.keys(formData))
        }
      }
    },
    onLoad(e) {
      if (e.id) {
        const id = e.id
        this.formDataId = id
        this.getDetail(id)
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
        return db.collection(dbCollectionName).doc(this.formDataId).update(value).then((res) => {
          uni.showToast({
            title: '修改成功'
          })
          this.getOpenerEventChannel().emit('refreshData')
          setTimeout(() => uni.navigateBack(), 500)
        }).catch((err) => {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          })
        })
      },

      /**
       * 获取表单数据
       * @param {Object} id
       */
      getDetail(id) {
        uni.showLoading({
          mask: true
        })
        db.collection(dbCollectionName).doc(id).field("referrer_id,referee_id,order_id,order_amount,referrer_coupon_id,referee_coupon_id,referrer_coupon_amount,referee_coupon_amount,status,order_date,coupon_sent_date,remark").get().then((res) => {
          const data = res.result.data[0]
          if (data) {
            this.formData = data
            
          }
        }).catch((err) => {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          })
        }).finally(() => {
          uni.hideLoading()
        })
      }
    }
  }
</script>
