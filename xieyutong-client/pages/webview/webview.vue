<template>
  <view class="webview-container">
    <!-- 添加loading状态 -->
    <view v-if="!url && !hasError" class="loading-container">
      <view class="loading-text">正在加载...</view>
    </view>
    
    <!-- 错误提示 -->
    <view v-if="hasError" class="error-container">
      <view class="error-icon">!</view>
      <view class="error-text">{{ errorMessage }}</view>
      <view class="error-detail">{{ errorDetail }}</view>
      <button class="back-btn" @click="goBack">返回上一页</button>
    </view>
    
    <!-- web-view组件 -->
    <web-view v-if="url && !hasError" :src="url" @message="onMessage" @error="onError"></web-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      url: '',
      hasError: false,
      errorMessage: '参数错误',
      errorDetail: ''
    }
  },
  onLoad(options) {
    console.log('=== webview页面 onLoad 开始 ===');
    console.log('接收到的原始参数:', options);
    console.log('参数类型:', typeof options);
    console.log('参数keys:', Object.keys(options));
    
    // 检查是否有url参数
    if (!options || !options.url) {
      console.error('❌ 未接收到url参数');
      console.log('options为空或url为空:', { options, hasUrl: !!options?.url });
      this.showError('链接地址无效', '未接收到有效的URL参数');
      return;
    }
    
    console.log('✅ 接收到url参数:', options.url);
    console.log('url参数长度:', options.url.length);
    
    try {
      // 解码URL
      const decodedUrl = decodeURIComponent(options.url);
      console.log('✅ URL解码成功:', decodedUrl);
      console.log('解码后URL长度:', decodedUrl.length);
      
      console.log('URL解码详情:', {
        原始参数: options.url,
        解码结果: decodedUrl,
        解码前长度: options.url ? options.url.length : 0,
        解码后长度: decodedUrl.length
      });
      
      // 验证URL格式
      if (!this.validateUrl(decodedUrl)) {
        console.warn('⚠️ URL格式验证失败，但仍尝试加载:', decodedUrl);
        // 不再直接显示错误，而是警告并继续尝试加载
      } else {
        console.log('✅ URL格式验证通过');
      }
      
      // 设置URL并尝试加载
      this.url = decodedUrl;
      console.log('✅ URL设置成功，准备加载webview');
      
    } catch (error) {
      console.error('❌ onLoad处理异常:', error);
      console.log('异常详情:', {
        message: error.message,
        stack: error.stack,
        options: options
      });
      this.showError('页面加载失败', error.message || '未知错误');
    }
    
    console.log('=== webview页面 onLoad 结束 ===');
  },
  
  onShow() {
    console.log('=== webview页面 onShow ===');
    console.log('当前URL状态:', { url: this.url, hasError: this.hasError });
  },
  
  onReady() {
    console.log('=== webview页面 onReady ===');
    console.log('页面渲染完成，URL:', this.url);
  },
  
  methods: {
    // 验证URL格式
    validateUrl(url) {
      console.log('开始验证URL格式:', url);
      
      try {
        // 检查是否为空
        if (!url || typeof url !== 'string') {
          console.log('❌ URL为空或不是字符串类型');
          return false;
        }
        
        // 检查是否为HTTP(S)协议
        const isHttps = url.toLowerCase().startsWith('https://');
        const isHttp = url.toLowerCase().startsWith('http://');
        console.log('是否为HTTP(S)协议:', isHttps || isHttp);
        
        if (!isHttps && !isHttp) {
          console.log('❌ URL必须以http://或https://开头');
          return false;
        }
        
        // 使用正则表达式验证URL格式（兼容小程序环境）
        const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
        const isValidFormat = urlPattern.test(url);
        console.log('正则表达式验证结果:', isValidFormat);
        
        if (!isValidFormat) {
          console.log('❌ URL格式不符合正则表达式');
          return false;
        }
        
        // 额外检查：确保URL包含域名
        const urlWithoutProtocol = url.replace(/^https?:\/\//, '');
        const hasDomain = urlWithoutProtocol.includes('.') && urlWithoutProtocol.length > 3;
        console.log('是否包含有效域名:', hasDomain);
        
        if (!hasDomain) {
          console.log('❌ URL缺少有效域名');
          return false;
        }
        
        console.log('✅ URL格式验证通过');
        return true;
        
      } catch (error) {
        console.error('❌ URL验证异常:', error);
        return false;
      }
    },
    
    // 显示错误信息
    showError(message, detail = '') {
      console.log('显示错误信息:', { message, detail });
      this.hasError = true;
      this.errorMessage = message;
      this.errorDetail = detail;
      
      // 同时显示toast提示
      uni.showToast({
        title: message,
        icon: 'none',
        duration: 3000
      });
    },
    
    // 返回上一页
    goBack() {
      console.log('用户点击返回按钮');
      uni.navigateBack({
        delta: 1,
        fail: (err) => {
          console.error('返回失败:', err);
          // 如果返回失败，跳转到首页
          uni.switchTab({
            url: '/pages/home/home'
          });
        }
      });
    },
    
    // webview消息事件
    onMessage(event) {
      console.log('收到webview消息:', event);
    },
    
    // webview错误事件
    onError(event) {
      console.error('❌ webview加载失败:', event);
      console.log('错误事件详情:', {
        detail: event.detail,
        target: event.target,
        currentTarget: event.currentTarget,
        url: this.url
      });
      
      // 显示用户友好的错误信息
      let errorMessage = '网页加载失败';
      let errorDetail = '';
      
      if (event.detail) {
        if (event.detail.errMsg) {
          errorDetail = event.detail.errMsg;
        } else if (event.detail.src) {
          errorDetail = `加载失败的URL: ${event.detail.src}`;
        }
      }
      
      // 如果没有具体错误信息，提供通用说明
      if (!errorDetail) {
        errorDetail = '可能是网络连接问题或网页不支持在小程序中显示';
      }
      
      this.showError(errorMessage, errorDetail);
      
      // 提供重试选项
      // uni.showModal({
      //   title: '网页加载失败',
      //   content: '是否要重新尝试加载？',
      //   confirmText: '重试',
      //   cancelText: '返回',
      //   success: (res) => {
      //     if (res.confirm) {
      //       console.log('🔄 用户选择重试');
      //       this.retryLoad();
      //     } else {
      //       console.log('👈 用户选择返回');
      //       this.goBack();
      //     }
      //   }
      // });
    },
    
    // 重试加载
    retryLoad() {
      console.log('🔄 开始重试加载webview');
      this.hasError = false;
      this.errorMessage = '';
      this.errorDetail = '';
      
      // 强制刷新webview
      this.$nextTick(() => {
        console.log('✅ webview重试加载完成');
      });
    }
  }
}
</script>

<style scoped>
.webview-container {
  width: 100%;
  height: 100vh;
  position: relative;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.loading-text {
  color: #666;
  font-size: 16px;
}

.error-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 40px 20px;
  background-color: #f5f5f5;
  text-align: center;
}

.error-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #ff4757;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.error-text {
  font-size: 18px;
  color: #333;
  margin-bottom: 10px;
  font-weight: 500;
}

.error-detail {
  font-size: 14px;
  color: #666;
  margin-bottom: 30px;
  line-height: 1.4;
  word-break: break-all;
}

.back-btn {
  padding: 12px 24px;
  background-color: #0086F6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
}

.back-btn:active {
  background-color: #0066CC;
}
</style> 