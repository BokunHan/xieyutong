<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="plate_number" label="车牌号" required>
        <uni-easyinput placeholder="车牌号" v-model="formData.plate_number" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="model" label="车型" required>
        <uni-easyinput placeholder="车型描述，如考斯特、阿尔法" v-model="formData.model"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="seat_count" label="座位数" required>
        <uni-easyinput placeholder="座位数" type="number" v-model="formData.seat_count"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="status" label="状态" required>
        <uni-easyinput placeholder="车辆状态：0-运营中 1-维修/停运" type="number" v-model="formData.status"></uni-easyinput>
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
  import { validator } from '../../js_sdk/validator/b-vehicle-profiles.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'b-vehicle-profiles';

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
        "plate_number": "",
        "model": "",
        "seat_count": null,
        "status": 0
      }
      return {
        formData,
        formOptions: {},
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
