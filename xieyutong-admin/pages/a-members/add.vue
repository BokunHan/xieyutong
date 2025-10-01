<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="user_id" label="用户ID" required>
        <uni-easyinput placeholder="关联的用户ID（uni-id-users表的_id）" v-model="formData.user_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="level" label="会员等级" required>
        <uni-data-checkbox v-model="formData.level" :localdata="formOptions.level_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="total_consumption" label="累计消费">
        <undefined v-model="formData.total_consumption"></undefined>
      </uni-forms-item>
      <uni-forms-item name="order_count" label="订单数量">
        <undefined v-model="formData.order_count"></undefined>
      </uni-forms-item>
      <uni-forms-item name="upgrade_threshold" label="升级条件">
        <undefined v-model="formData.upgrade_threshold"></undefined>
      </uni-forms-item>
      <uni-forms-item name="benefits" label="会员权益">
        <undefined v-model="formData.benefits"></undefined>
      </uni-forms-item>
      <uni-forms-item name="status" label="" required>
        <uni-data-checkbox v-model="formData.status" :localdata="formOptions.status_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="join_date" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.join_date"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="upgrade_date" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.upgrade_date"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="expire_date" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.expire_date"></uni-datetime-picker>
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
  import { validator } from '../../js_sdk/validator/a-members.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'a-members';

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
        "user_id": "",
        "level": "",
        "total_consumption": null,
        "order_count": null,
        "upgrade_threshold": null,
        "benefits": null,
        "status": "",
        "join_date": null,
        "upgrade_date": null,
        "expire_date": null,
        "created_at": null,
        "updated_at": null
      }
      return {
        formData,
        formOptions: {
          "level_localdata": [
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
          ],
          "status_localdata": [
            {
              "value": "active",
              "text": "active"
            },
            {
              "value": "inactive",
              "text": "inactive"
            },
            {
              "value": "suspended",
              "text": "suspended"
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
