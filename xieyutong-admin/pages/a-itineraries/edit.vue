<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="product_id" label="商品ID" required>
        <uni-easyinput placeholder="关联的商品ID" v-model="formData.product_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="title" label="行程标题">
        <uni-easyinput placeholder="行程标题" v-model="formData.title" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="sub_title" label="行程副标题">
        <uni-easyinput placeholder="行程副标题" v-model="formData.sub_title" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="duration" label="行程时长">
        <uni-easyinput placeholder="行程时长描述，如'8天'" v-model="formData.duration"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="total_days" label="总天数" required>
        <uni-easyinput placeholder="总天数" type="number" v-model="formData.total_days"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="remarks" label="行程备注">
        <uni-easyinput placeholder="行程备注说明" v-model="formData.remarks"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="itinerary" label="行程安排" required>
        <uni-data-checkbox :multiple="true" v-model="formData.itinerary"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="metadata" label="">
        <undefined v-model="formData.metadata"></undefined>
      </uni-forms-item>
      <uni-forms-item name="status" label="">
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
  import { validator } from '../../js_sdk/validator/a-itineraries.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'a-itineraries';

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
        "product_id": "",
        "title": "",
        "sub_title": "",
        "duration": "",
        "total_days": 1,
        "remarks": "",
        "itinerary": [],
        "metadata": null,
        "status": "",
        "created_at": null,
        "updated_at": null
      }
      return {
        formData,
        formOptions: {
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
              "value": "draft",
              "text": "draft"
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
        db.collection(dbCollectionName).doc(id).field("product_id,title,sub_title,duration,total_days,remarks,itinerary,metadata,status,created_at,updated_at").get().then((res) => {
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
