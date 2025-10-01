<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="user_id" label="用户ID" required>
        <uni-easyinput placeholder="评价用户ID" v-model="formData.user_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="product_id" label="商品ID" required>
        <uni-easyinput placeholder="被评价的商品ID（携程商品ID）" v-model="formData.product_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="rating" label="评分" required>
        <picker @change="pickerChange($event, 'rating')" :range="formOptions.rating_data" :value="formOptions.rating_index">
          <view>{{formOptions.rating_data[formOptions.rating_index] || "请选择..."}}</view>
        </picker>
      </uni-forms-item>
      <uni-forms-item name="content" label="评价内容" required>
        <uni-easyinput placeholder="评价文本内容" v-model="formData.content" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="images" label="评价图片">
        <uni-data-checkbox :multiple="true" v-model="formData.images"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="travel_date" label="出行日期">
        <uni-easyinput placeholder="出行日期，格式：YYYY-MM-DD" v-model="formData.travel_date"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="is_real" label="真实评价">
        <switch @change="binddata('is_real', $event.detail.value)" :checked="formData.is_real"></switch>
      </uni-forms-item>
      <uni-forms-item name="helpful_count" label="有用数">
        <uni-easyinput placeholder="有用点赞数" type="number" v-model="formData.helpful_count"></uni-easyinput>
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
  import { validator } from '../../js_sdk/validator/a-reviews.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'a-reviews';

  function getValidator(fields) {
    let result = {}
    for (let key in validator) {
      if (fields.includes(key)) {
        result[key] = validator[key]
      }
    }
    return result
  }

  function numberRange(start, end) {
    return Array.from(new Array(end + 1).keys()).slice(start);
  }

  export default {
    data() {
      let formData = {
        "user_id": "",
        "product_id": "",
        "rating": 1,
        "content": "",
        "images": [],
        "travel_date": "",
        "is_real": null,
        "helpful_count": null,
        "status": "",
        "created_at": null,
        "updated_at": null
      }
      return {
        formData,
        formOptions: {
          "rating_data": numberRange(1, 5),
          "rating_index": null,
          "status_localdata": [
            {
              "value": "pending",
              "text": "pending"
            },
            {
              "value": "approved",
              "text": "approved"
            },
            {
              "value": "rejected",
              "text": "rejected"
            },
            {
              "value": "hidden",
              "text": "hidden"
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
      pickerChange(e, name) {
        this.formOptions[name + '_index'] = e.detail.value;
        this.formData[name] = this.formOptions[name + '_data'][e.detail.value];
        this.binddata(name, this.formData[name]);
      },
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
