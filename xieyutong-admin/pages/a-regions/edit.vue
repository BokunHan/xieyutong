<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="name" label="区域名称" required>
        <uni-easyinput placeholder="区域名称，如：西藏" v-model="formData.name" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="slug" label="唯一标识" required>
        <uni-easyinput placeholder="英文标识，如：tibet，用于程序调用" v-model="formData.slug" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="parent_id" label="父级区域">
        <uni-easyinput placeholder="用于构建区域层级，可选" v-model="formData.parent_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="cover_image" label="区域封面图">
        <uni-file-picker file-mediatype="image" return-type="object" v-model="formData.cover_image"></uni-file-picker>
      </uni-forms-item>
      <uni-forms-item name="description" label="区域简介">
        <textarea placeholder="简短的介绍文本" @input="binddata('description', $event.detail.value)" class="uni-textarea-border" v-model="formData.description"></textarea>
      </uni-forms-item>
      <uni-forms-item name="order" label="排序权重">
        <uni-easyinput placeholder="数字越大越靠前" type="number" v-model="formData.order"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="status" label="启用状态">
        <switch @change="binddata('status', $event.detail.value)" :checked="formData.status"></switch>
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
  import { validator } from '../../js_sdk/validator/a-regions.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'a-regions';

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
        "name": "",
        "slug": "",
        "parent_id": "",
        "cover_image": null,
        "description": "",
        "order": 0,
        "status": true
      }
      return {
        formData,
        formOptions: {},
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
        db.collection(dbCollectionName).doc(id).field("name,slug,parent_id,cover_image,description,order,status").get().then((res) => {
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
