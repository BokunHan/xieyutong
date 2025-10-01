<template>
	<view class="min-h-screen bg-white flex flex-col">
		<!-- 内容区域 -->
		<view class="flex-1 flex flex-col justify-center items-center p-5">
			<!-- 应用图标 -->
			<view class="app-icon">
				<image :src="appConfig.logo" :alt="appConfig.title" class="w-25 h-25" mode="aspectFit"></image>
			</view>
			
			<!-- 应用名称 -->
			<view class="app-name">{{ appConfig.title }}</view>
			<!-- 应用标语 -->
			<view class="app-slogan">{{ appConfig.slogan }}</view>
			
			<!-- 登录按钮 -->
			<!-- #ifdef MP-WEIXIN -->
			<button 
				class="login-button"
				open-type="getPhoneNumber"
				@getphonenumber="wechatPhoneLogin"
				hover-class="login-button-hover"
			>
				<text class="fab fa-weixin mr-2"></text>
				微信手机号一键登录
			</button>
			<!-- #endif -->
			
			<!-- #ifndef MP-WEIXIN -->
			<button 
				class="login-button"
				@click="wechatLogin"
				hover-class="login-button-hover"
			>
				<text class="fab fa-weixin mr-2"></text>
				微信手机号一键登录
			</button>
			<!-- #endif -->
			
			<!-- 隐私协议 -->
			<view class="privacy-text">
				登录即表示您已阅读并同意<text class="text-blue-600" @click="openAgreement('service')">《服务协议》</text>和<text class="text-blue-600" @click="openAgreement('privacy')">《隐私政策》</text>
			</view>
		</view>
	</view>
</template>

<script>
// 导入uni-id云对象
const uniIdCo = uniCloud.importObject('uni-id-co')

export default {
	data() {
		return {
			uniIdRedirectUrl: '',
			appConfig: {
				logo: 'https://cdn.bitejufeng.com/baojia/logo.jpg', // 默认值
				title: '携域通旅行', // 默认值
				slogan: '把平台的客户变成你的客户' // 默认值
			}
		}
	},
	async onLoad(options) {
		// 获取重定向URL参数
		if (options.uniIdRedirectUrl) {
			this.uniIdRedirectUrl = decodeURIComponent(options.uniIdRedirectUrl);
		}
		
		// 加载应用配置
		await this.loadAppConfig();
	},
	methods: {
		// 加载应用配置
		async loadAppConfig() {
			try {
				const db = uniCloud.database();
				
				// 获取应用配置数据
				const configRes = await db.collection('a-system-configs')
					.where({
						config_type: 'app_settings',
						status: 'active'
					})
					.get();
				
				if (configRes.result && configRes.result.data.length > 0) {
					const configs = configRes.result.data;
					
					// 解析配置数据
					configs.forEach(config => {
						switch (config.config_key) {
							case 'app_logo':
								if (config.config_value && config.config_value.logo_url) {
									this.appConfig.logo = config.config_value.logo_url;
								}
								break;
							case 'app_title':
								if (config.config_value && config.config_value.title) {
									this.appConfig.title = config.config_value.title;
								}
								break;
							case 'app_slogan':
								if (config.config_value && config.config_value.slogan) {
									this.appConfig.slogan = config.config_value.slogan;
								}
								break;
						}
					});
				}
				
				console.log('应用配置加载成功:', this.appConfig);
				
			} catch (error) {
				console.error('加载应用配置失败:', error);
				// 使用默认配置，不影响页面显示
			}
		},
		
		// 微信手机号一键登录（小程序专用）
		async wechatPhoneLogin(e) {
			console.log('微信手机号登录回调:', e);
			
			if (e.detail.errMsg === "getPhoneNumber:ok") {
				try {
					uni.showLoading({
						title: '登录中...'
					});
					
					// 调用uni-id云对象进行微信手机号登录
					const result = await uniIdCo.loginByWeixinMobile({
						phoneCode: e.detail.code
					});
					
					console.log('登录结果:', result);
					
					if (result.errCode === 0) {
						uni.hideLoading();
						uni.showToast({
							title: '登录成功',
							icon: 'success'
						});
						
						// 登录成功后跳转
						setTimeout(() => {
							if (this.uniIdRedirectUrl) {
								// 判断是否为 tabBar 页面
								this.navigateToPage(this.uniIdRedirectUrl);
							} else {
								// 否则跳转到首页
								uni.switchTab({
									url: '/pages/home/home'
								});
							}
						}, 1500);
					} else {
						throw new Error(result.errMsg || '登录失败');
					}
					
				} catch (error) {
					uni.hideLoading();
					uni.showToast({
						title: error.message || '登录失败',
						icon: 'none'
					});
					console.error('微信手机号登录失败:', error);
				}
			} else {
				// 用户拒绝授权
				uni.showToast({
					title: '需要授权手机号才能登录',
					icon: 'none'
				});
			}
		},
		
		// 普通微信登录（非小程序环境）
		async wechatLogin() {
			try {
				uni.showLoading({
					title: '登录中...'
				});
				
				// 获取微信登录code
				const loginRes = await uni.login({
					provider: 'weixin'
				});
				
				if (loginRes[1].code) {
					// 调用uni-id云对象进行微信登录
					const result = await uniIdCo.loginByWeixin({
						code: loginRes[1].code
					});
					
					console.log('微信登录结果:', result);
					
					if (result.errCode === 0) {
						uni.hideLoading();
						uni.showToast({
							title: '登录成功',
							icon: 'success'
						});
						
						// 登录成功后跳转
						setTimeout(() => {
							if (this.uniIdRedirectUrl) {
								// 判断是否为 tabBar 页面
								this.navigateToPage(this.uniIdRedirectUrl);
							} else {
								// 否则跳转到首页
								uni.switchTab({
									url: '/pages/home/home'
								});
							}
						}, 1500);
					} else {
						throw new Error(result.errMsg || '登录失败');
					}
				} else {
					throw new Error('获取微信授权失败');
				}
				
			} catch (error) {
				uni.hideLoading();
				uni.showToast({
					title: error.message || '登录失败',
					icon: 'none'
				});
				console.error('微信登录失败:', error);
			}
		},
		
		// 智能跳转页面（根据是否为 tabBar 页面选择跳转方式）
		navigateToPage(url) {
			// 定义 tabBar 页面列表
			const tabBarPages = [
				'/pages/home/home',
				'/pages/itinerary/itinerary', 
				'/pages/profile/profile'
			];
			
			// 提取页面路径（去掉参数）
			const pagePath = url.split('?')[0];
			
			// 判断是否为 tabBar 页面
			if (tabBarPages.includes(pagePath)) {
				// 使用 switchTab 跳转到 tabBar 页面
				uni.switchTab({
					url: pagePath  // tabBar 页面不支持参数，只跳转到页面
				});
			} else {
				// 使用 redirectTo 跳转到普通页面
				uni.redirectTo({
					url: url
				});
			}
		},
		
		// 打开协议页面
		openAgreement(type) {
			uni.navigateTo({
				url: `/pages/agreement/index?type=${type}`
			});
		}
	}
}
</script>

<style>
/* 应用图标样式 */
.app-icon {
	width: 120px;
	height: 120px;
	border-radius: 24px;
	margin-bottom: 40px;
	box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
	background-color: white;
	display: flex;
	justify-content: center;
	align-items: center;
	overflow: hidden;
}

/* 登录按钮样式 */
.login-button {
	background-color: #07C160;
	color: white;
	width: 80%;
	max-width: 300px;
	padding: 12px;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	font-weight: 500;
	box-shadow: 0 4px 12px rgba(7, 193, 96, 0.2);
	border: none;
	transition: all 0.2s ease;
}

.login-button-hover {
	opacity: 0.9;
	transform: scale(0.98);
}

/* 应用名称样式 */
.app-name {
	font-size: 24px;
	font-weight: 600;
	color: #333;
	margin-bottom: 10px;
}

/* 应用标语样式 */
.app-slogan {
	font-size: 14px;
	color: #666;
	margin-bottom: 60px;
}

/* 隐私协议文本样式 */
.privacy-text {
	font-size: 12px;
	color: #999;
	text-align: center;
	margin-top: 40px;
	max-width: 300px;
	line-height: 1.5;
}
</style> 