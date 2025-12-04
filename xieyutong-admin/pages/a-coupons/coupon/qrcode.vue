<template>
  <view class="p-6">
    <el-card class="mb-6">
      <template #header>
        <div class="flex items-center space-x-2">
          <i class="fas fa-qrcode text-blue-500"></i>
          <span class="text-lg font-medium">优惠券二维码生成</span>
        </div>
      </template>
      
      <div class="space-y-4">
        <el-form :model="qrForm" label-width="120px">
          <el-form-item label="选择优惠券">
            <el-select
              v-model="qrForm.couponId"
              placeholder="请选择要生成二维码的优惠券"
              style="width: 400px"
              @change="onCouponChange"
            >
              <el-option
                v-for="coupon in couponList"
                :key="coupon._id"
                :label="`${coupon.title} (¥${coupon.amount})`"
                :value="coupon._id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="小程序路径">
            <el-input
              v-model="qrForm.miniProgramPath"
              placeholder="自动生成的小程序页面路径"
              style="width: 500px"
              readonly
            />
          </el-form-item>
          
          <el-form-item label="H5链接">
            <div class="flex items-center space-x-2">
              <el-input
                v-model="qrForm.h5Url"
                placeholder="H5页面链接"
                style="width: 500px"
                readonly
              />
              <el-button type="primary" size="small" @click="copyH5Url">
                <i class="fas fa-copy mr-1"></i>
                复制
              </el-button>
            </div>
          </el-form-item>
        </el-form>
        
        <div class="flex space-x-4">
          <el-button 
            type="primary" 
            @click="generateMiniProgramQR"
            :disabled="!qrForm.couponId"
            :loading="generating"
          >
            <i class="fab fa-weixin mr-1"></i>
            生成小程序码
          </el-button>
          
          <el-button 
            type="default"
            @click="generateH5QRCode"
            :disabled="!qrForm.couponId"
            :loading="generatingH5"
          >
            <i class="fas fa-qrcode mr-1"></i>
            生成H5二维码
          </el-button>
          
          <el-button 
            v-if="qrCodeUrl"
            type="success" 
            @click="downloadQRCode"
          >
            <i class="fas fa-download mr-1"></i>
            下载二维码
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 优惠券预览 -->
    <el-card v-if="selectedCoupon" class="mb-6">
      <template #header>
        <span>优惠券预览</span>
      </template>
      
      <div class="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 rounded-lg max-w-md">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="text-xs opacity-90 mb-1">优惠券</div>
            <div class="text-xl font-bold mb-2">{{ selectedCoupon.title }}</div>
            <div class="text-sm opacity-90" v-if="selectedCoupon.description">
              {{ selectedCoupon.description }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold">¥{{ selectedCoupon.amount }}</div>
            <div class="text-xs opacity-90">
              满{{ selectedCoupon.min_amount }}元可用
            </div>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-white border-opacity-30">
          <div class="text-xs opacity-80">
            分享码：{{ selectedCoupon.share_code }} | 有效期：{{ selectedCoupon.valid_days }}天
          </div>
        </div>
      </div>
    </el-card>

    <!-- 二维码显示 -->
    <el-card v-if="qrCodeUrl">
      <template #header>
        <span>生成的二维码</span>
      </template>
      
      <div class="text-center">
        <div class="inline-block p-4 bg-white border border-gray-200 rounded-lg">
          <img :src="qrCodeUrl" alt="优惠券二维码" class="w-64 h-64" />
        </div>
        <div class="mt-4 text-sm text-gray-600">
          <p>扫描二维码即可领取优惠券</p>
          <p class="mt-1">可用于宣传材料、社交媒体分享等</p>
        </div>
      </div>
    </el-card>

    <!-- 使用说明 -->
    <el-card>
      <template #header>
        <span>使用说明</span>
      </template>
      
      <div class="space-y-3 text-sm text-gray-600">
        <div class="flex items-start space-x-2">
          <i class="fas fa-info-circle text-blue-500 mt-1"></i>
          <div>
            <strong>小程序码：</strong>适用于微信环境，用户扫码后直接跳转到小程序领取页面
          </div>
        </div>
        <div class="flex items-start space-x-2">
          <i class="fas fa-info-circle text-blue-500 mt-1"></i>
          <div>
            <strong>H5链接：</strong>适用于各种浏览器环境，可以作为普通网页链接分享
          </div>
        </div>
        <div class="flex items-start space-x-2">
          <i class="fas fa-info-circle text-blue-500 mt-1"></i>
          <div>
            <strong>使用场景：</strong>可用于朋友圈分享、客户群发送、宣传海报等营销推广
          </div>
        </div>
        <div class="flex items-start space-x-2">
          <i class="fas fa-exclamation-triangle text-orange-500 mt-1"></i>
          <div>
            <strong>注意事项：</strong>确保优惠券状态为"活跃"，否则用户无法正常领取
          </div>
        </div>
      </div>
    </el-card>
  </view>
</template>

<script>
import QRCode from 'qrcode'

export default {
  name: 'CouponQRCode',
  
  data() {
    return {
      couponList: [],
      selectedCoupon: null,
      generating: false,
      generatingH5: false,
      qrCodeUrl: null,
      qrCodeType: '', // 'miniprogram' 或 'h5'
      qrForm: {
        couponId: '',
        miniProgramPath: '',
        h5Url: ''
      }
    }
  },

  async mounted() {
    await this.loadCoupons()
  },

  methods: {
    // 加载优惠券列表
    async loadCoupons() {
      try {
        const result = await uniCloud.callFunction({
          name: 'admin-coupon-service',
          data: {
            action: 'getCouponList',
            status: 'active',
            issue_type: 'manual' // 只显示手动发券的优惠券
          }
        })

        if (result.result.errCode === 0) {
          this.couponList = result.result.data.list || []
        } else {
          this.$message.error(result.result.errMsg || '获取优惠券列表失败')
        }
      } catch (error) {
        console.error('加载优惠券列表失败:', error)
        this.$message.error('加载优惠券列表失败')
      }
    },

    // 优惠券选择变化
    onCouponChange(couponId) {
      this.selectedCoupon = this.couponList.find(c => c._id === couponId)
      if (this.selectedCoupon) {
        // 生成小程序路径
        this.qrForm.miniProgramPath = `/pages/coupon/claim?code=${this.selectedCoupon.share_code}`
        
        // 生成H5链接（这里需要替换为实际的域名）
        this.qrForm.h5Url = `https://your-domain.com/#/pages/coupon/claim?code=${this.selectedCoupon.share_code}`
      }
      
      // 清除之前的二维码
      this.qrCodeUrl = null
    },

    // 生成小程序码
    async generateMiniProgramQR() {
      if (!this.selectedCoupon) {
        this.$message.warning('请先选择优惠券')
        return
      }

      try {
        this.generating = true
        
        // 调用云函数生成小程序码
        const result = await uniCloud.callFunction({
          name: 'admin-qrcode-service',
          data: {
            action: 'generateMiniProgramQR',
            scene: this.selectedCoupon.share_code,
            page: 'pages/coupon/claim',
            width: 280
          }
        })

        if (result.result.errCode === 0) {
          this.qrCodeUrl = result.result.data.qrCodeUrl
          this.qrCodeType = 'miniprogram'
          this.$message.success('小程序码生成成功')
        } else {
          this.$message.error(result.result.errMsg || '生成小程序码失败')
        }
      } catch (error) {
        console.error('生成小程序码失败:', error)
        this.$message.error('生成小程序码失败')
      } finally {
        this.generating = false
      }
    },

    // 生成H5二维码
    async generateH5QRCode() {
      if (!this.selectedCoupon) {
        this.$message.warning('请先选择优惠券')
        return
      }

      try {
        this.generatingH5 = true
        
        // 使用H5链接生成二维码
        const qrCodeDataURL = await QRCode.toDataURL(this.qrForm.h5Url, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        
        this.qrCodeUrl = qrCodeDataURL
        this.qrCodeType = 'h5'
        this.$message.success('H5二维码生成成功')
      } catch (error) {
        console.error('生成H5二维码失败:', error)
        this.$message.error('生成H5二维码失败')
      } finally {
        this.generatingH5 = false
      }
    },

    // 下载二维码
    downloadQRCode() {
      if (!this.qrCodeUrl || !this.selectedCoupon) return

      const link = document.createElement('a')
      const suffix = this.qrCodeType === 'miniprogram' ? 'miniprogram' : 'h5'
      link.download = `coupon_${this.selectedCoupon.share_code}_${suffix}_qrcode.png`
      link.href = this.qrCodeUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      this.$message.success('二维码下载成功')
    },

    // 复制H5链接
    copyH5Url() {
      if (!this.qrForm.h5Url) {
        this.$message.warning('请先选择优惠券')
        return
      }

      navigator.clipboard.writeText(this.qrForm.h5Url).then(() => {
        this.$message.success('链接已复制到剪贴板')
      }).catch(() => {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = this.qrForm.h5Url
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        this.$message.success('链接已复制到剪贴板')
      })
    }
  }
}
</script>

<style scoped>
/* 可以添加一些自定义样式 */
</style>