<template>
  <div class="redirect-container">
    <div class="redirect-content">
      <div class="loading-spinner">
        <i class="fas fa-sync-alt fa-spin text-4xl text-blue-600 mb-4"></i>
      </div>
      <h2 class="text-xl font-semibold text-gray-800 mb-2">正在跳转到商品同步页面...</h2>
      <p class="text-gray-600">现在使用携程同步功能来添加新商品</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductAddRedirect',
  mounted() {
    // 立即跳转到携程同步页面
    this.redirectToSync()
  },
  methods: {
    redirectToSync() {
      setTimeout(() => {
        uni.redirectTo({
          url: '/pages/ctrip-sync/ctrip-sync',
          fail: (error) => {
            console.error('跳转失败:', error)
            // 如果跳转失败，回到列表页
            uni.redirectTo({
              url: './list'
            })
          }
        })
      }, 1000) // 延迟1秒，让用户看到跳转提示
    }
  }
}
</script>

<style scoped>
.redirect-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f8fafc;
}

.redirect-content {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: 0 auto;
}

.loading-spinner {
  margin-bottom: 1rem;
}

h2 {
  color: #1f2937;
  margin-bottom: 0.5rem;
}

p {
  color: #6b7280;
  font-size: 14px;
}
</style>