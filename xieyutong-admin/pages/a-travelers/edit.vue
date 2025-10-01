<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="user_id" label="" required>
        <uni-easyinput placeholder="用户ID，关联uni-id-users表" v-model="formData.user_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="name" label="" required>
        <uni-easyinput placeholder="出行人姓名" v-model="formData.name" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="type" label="" required>
        <uni-data-checkbox v-model="formData.type" :localdata="formOptions.type_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="id_card" label="" required>
        <uni-easyinput placeholder="身份证号" v-model="formData.id_card" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="phone" label="">
        <uni-easyinput placeholder="手机号" v-model="formData.phone" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="birthday" label="">
        <uni-easyinput placeholder="出生日期，格式YYYY-MM-DD" v-model="formData.birthday"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="is_main" label="">
        <switch @change="binddata('is_main', $event.detail.value)" :checked="formData.is_main"></switch>
      </uni-forms-item>
      <uni-forms-item name="gender" label="">
        <uni-data-checkbox v-model="formData.gender" :localdata="formOptions.gender_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="passport" label="">
        <uni-easyinput placeholder="护照号码" v-model="formData.passport"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="status" label="">
        <uni-data-checkbox v-model="formData.status" :localdata="formOptions.status_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="remark" label="">
        <uni-easyinput placeholder="备注" v-model="formData.remark"></uni-easyinput>
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
  import { validator } from '../../js_sdk/validator/a-travelers.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'a-travelers';

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
        "name": "",
        "type": "成人",
        "id_card": "",
        "phone": "",
        "birthday": "",
        "is_main": false,
        "gender": "未知",
        "passport": "",
        "status": "active",
        "remark": "",
        "created_at": null,
        "updated_at": null
      }
      return {
        formData,
        formOptions: {
          "type_localdata": [
            {
              "value": "成人",
              "text": "成人"
            },
            {
              "value": "儿童",
              "text": "儿童"
            }
          ],
          "gender_localdata": [
            {
              "value": "男",
              "text": "男"
            },
            {
              "value": "女",
              "text": "女"
            },
            {
              "value": "未知",
              "text": "未知"
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
        db.collection(dbCollectionName).doc(id).field("user_id,name,type,id_card,phone,birthday,is_main,gender,passport,status,remark,created_at,updated_at").get().then((res) => {
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
