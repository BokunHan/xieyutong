<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="title" label="券名称" required>
        <uni-easyinput placeholder="优惠券标题" v-model="formData.title"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="description" label="券描述">
        <uni-easyinput placeholder="优惠券描述" v-model="formData.description"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="amount" label="优惠金额" required>
        <undefined v-model="formData.amount"></undefined>
      </uni-forms-item>
      <uni-forms-item name="min_amount" label="使用门槛" required>
        <undefined v-model="formData.min_amount"></undefined>
      </uni-forms-item>
      <uni-forms-item name="issue_type" label="发券类型" required>
        <uni-data-checkbox v-model="formData.issue_type" :localdata="formOptions.issue_type_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="total_count" label="发放总数">
        <undefined v-model="formData.total_count"></undefined>
      </uni-forms-item>
      <uni-forms-item name="used_count" label="已使用数">
        <undefined v-model="formData.used_count"></undefined>
      </uni-forms-item>
      <uni-forms-item name="valid_days" label="有效天数">
        <undefined v-model="formData.valid_days"></undefined>
      </uni-forms-item>
      <uni-forms-item name="share_code" label="分享码">
        <uni-easyinput placeholder="分享码，用于生成领券链接和二维码（仅手动发券使用）" v-model="formData.share_code"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="auto_issue_condition" label="自动发券条件">
        <uni-data-checkbox :max="50" v-model="formData.auto_issue_condition" :localdata="formOptions.auto_issue_condition_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="status" label="状态" required>
        <uni-data-checkbox v-model="formData.status" :localdata="formOptions.status_localdata"></uni-data-checkbox>
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
</template>

<script>
  import { validator } from '../../js_sdk/validator/a-coupons.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'a-coupons';

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
        "title": "",
        "description": "",
        "amount": null,
        "min_amount": null,
        "issue_type": "",
        "total_count": null,
        "used_count": null,
        "valid_days": null,
        "share_code": "",
        "auto_issue_condition": "",
        "status": "",
        "created_at": null,
        "updated_at": null
      }
      return {
        formData,
        formOptions: {
          "issue_type_localdata": [
            {
              "value": "manual",
              "text": "manual"
            },
            {
              "value": "auto_referral",
              "text": "auto_referral"
            }
          ],
          "auto_issue_condition_localdata": [
            {
              "value": "referrer_reward",
              "text": "referrer_reward"
            },
            {
              "value": "referee_reward",
              "text": "referee_reward"
            }
          ],
          "status_localdata": [
            {
              "value": "active",
              "text": "active"
            },
            {
              "value": "inactive",
              "text": "inactive"
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
