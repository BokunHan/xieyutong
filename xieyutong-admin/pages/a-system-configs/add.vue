<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="config_key" label="配置键名" required>
        <uni-easyinput placeholder="配置键名，用于标识配置项" v-model="formData.config_key"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="config_value" label="配置值" required>
        <undefined v-model="formData.config_value"></undefined>
      </uni-forms-item>
      <uni-forms-item name="config_type" label="配置类型">
        <uni-data-checkbox v-model="formData.config_type" :localdata="formOptions.config_type_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="description" label="配置描述">
        <uni-easyinput placeholder="配置项描述说明" v-model="formData.description"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="status" label="状态" required>
        <uni-data-checkbox v-model="formData.status" :localdata="formOptions.status_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="version" label="版本号">
        <uni-easyinput placeholder="配置版本号" v-model="formData.version"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="effective_date" label="生效时间">
        <uni-datetime-picker return-type="timestamp" v-model="formData.effective_date"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="created_by" label="创建人">
        <uni-easyinput placeholder="创建人ID" v-model="formData.created_by"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="updated_by" label="修改人">
        <uni-easyinput placeholder="最后修改人ID" v-model="formData.updated_by"></uni-easyinput>
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
  import { validator } from '../../js_sdk/validator/a-system-configs.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'a-system-configs';

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
        "config_key": "",
        "config_value": null,
        "config_type": "",
        "description": "",
        "status": "",
        "version": "",
        "effective_date": null,
        "created_by": "",
        "updated_by": "",
        "created_at": null,
        "updated_at": null
      }
      return {
        formData,
        formOptions: {
          "config_type_localdata": [
            {
              "value": "member_upgrade",
              "text": "member_upgrade"
            },
            {
              "value": "coupon_rules",
              "text": "coupon_rules"
            },
            {
              "value": "referral_rules",
              "text": "referral_rules"
            },
            {
              "value": "system_params",
              "text": "system_params"
            },
            {
              "value": "app_settings",
              "text": "app_settings"
            },
            {
              "value": "legal_docs",
              "text": "legal_docs"
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
