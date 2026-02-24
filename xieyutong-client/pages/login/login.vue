<template>
	<view class="min-h-screen bg-white flex flex-col">
		<!-- 内容区域 -->
		<view class="flex-1 flex flex-col justify-center items-center p-5">
			<view class="back-button" @click="goBack">
				<uni-icons type="left" size="22" color="#333"></uni-icons>
			</view>

			<!-- 应用图标 -->
			<view class="app-icon">
				<image :src="appConfig.logo" :alt="appConfig.title" class="w-25 h-25" mode="aspectFit"></image>
			</view>

			<!-- 应用名称 -->
			<text class="app-name">{{ appConfig.title }}</text>
			<text class="app-name-en">{{ appConfig.title_en }}</text>
			<!-- 应用标语 -->
			<text class="app-slogan">{{ appConfig.slogan }}</text>
			<text class="app-subslogan">{{ appConfig.subslogan }}</text>
			<text class="app-description">{{ appConfig.description }}</text>

			<!-- 登录按钮 -->
			<!-- #ifdef MP-WEIXIN -->
			<button class="login-button" open-type="getPhoneNumber" @getphonenumber="wechatPhoneLogin" hover-class="login-button-hover" :disabled="!isAgreed">
				<text class="login-button-text">手机号快捷登录</text>
			</button>
			<!-- #endif -->

			<!-- #ifndef MP-WEIXIN -->
			<button class="login-button" @click="wechatLogin" hover-class="login-button-hover" :disabled="!isAgreed">
				<text class="login-button-text">手机号快捷登录</text>
			</button>
			<!-- #endif -->

			<!-- 隐私协议 -->
			<view class="privacy-text">
				<checkbox-group @change="agreementChange">
					<checkbox :checked="isAgreed" value="agreed" style="transform: scale(0.7)" />
				</checkbox-group>
				阅读
				<text class="text-blue-600" @click="openAgreement('service')">《服务协议》</text>
				与
				<text class="text-blue-600" @click="openAgreement('privacy')">《隐私政策》</text>
			</view>

			<text class="skip-login-text" @click="goBack">暂不登录</text>
		</view>
	</view>
</template>

<script>
// 导入uni-id云对象
const uniIdCo = uniCloud.importObject('uni-id-co');

export default {
	data() {
		return {
			isAgreed: false,
			uniIdRedirectUrl: '',
			appConfig: {
				logo: '/static/logo.jpg',
				title: '风漫国际管家',
				title_en: 'F E N G M A N',
				slogan: '随风漫行 × 向心而生',
				subslogan: '遇见 | 挑战 | 归属 | 印记',
				description: '全国旅行品牌，海量目的地待您探索\nTRAVEL ACROSS CHINA'
			},
			redirectType: '',
			targetOrderId: ''
		};
	},
	async onLoad(options) {
		// 获取重定向URL参数;
		if (options.uniIdRedirectUrl) {
			this.uniIdRedirectUrl = decodeURIComponent(options.uniIdRedirectUrl);
		}

		// 接收落地页传来的参数
		if (options.redirect === 'bind' && options.orderId) {
			this.redirectType = 'bind';
			this.targetOrderId = options.orderId;
		}

		// 加载应用配置
		await this.loadAppConfig();
	},
	methods: {
		goBack() {
			if (this.uniIdRedirectUrl === '/pages/profile/profile') {
				// 如果登录后准备跳回 "我的" 页面 (tabBar)
				// 说明用户是从 "我的" 标签页被强制过来的
				// 此时点返回/暂不登录，应该去首页
				uni.reLaunch({
					url: '/pages/home/home'
				});
			} else {
				// 否则，正常返回上一页
				uni.navigateBack();
			}
		},

		agreementChange(e) {
			this.isAgreed = e.detail.value.length > 0;
		},

		// 加载应用配置
		async loadAppConfig() {
			try {
				const db = uniCloud.database();

				// 获取应用配置数据
				const configRes = await db
					.collection('a-system-configs')
					.where({
						config_type: 'app_settings',
						status: 'active'
					})
					.get();

				if (configRes.result && configRes.result.data.length > 0) {
					const configs = configRes.result.data;

					// 解析配置数据
					configs.forEach((config) => {
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
							case 'app_title_en':
								if (config.config_value && config.config_value.title) {
									this.appConfig.title_en = config.config_value.title_en;
								}
								break;
							case 'app_slogan':
								if (config.config_value && config.config_value.slogan) {
									this.appConfig.slogan = config.config_value.slogan;
								}
								break;
							case 'app_subslogan':
								if (config.config_value && config.config_value.subslogan) {
									this.appConfig.subslogan = config.config_value.subslogan;
								}
								break;
							case 'app_desciption':
								if (config.config_value && config.config_value.desciption) {
									this.appConfig.desciption = config.config_value.desciption;
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

			if (e.detail.errMsg === 'getPhoneNumber:ok') {
				try {
					uni.showLoading({
						title: '登录中...'
					});

					const payload = {
						phoneCode: e.detail.code
					};
					console.log('用户信息：', payload);

					// 调用uni-id云对象进行微信手机号登录
					const result = await uniIdCo.loginByWeixinMobile(payload);

					console.log('登录结果:', result);

					if (result.errCode === 0) {
						uni.hideLoading();
						uni.showToast({
							title: '登录成功',
							icon: 'success'
						});
						getApp().globalData.justLoggedIn = true;

						// 登录成功后跳转
						setTimeout(() => {
							if (this.redirectType === 'bind' && this.targetOrderId) {
								console.log('登录成功，跳回绑定页面');
								uni.redirectTo({
									url: `/pages/order/bind-confirm?orderId=${this.targetOrderId}`
								});
							} else {
								uni.reLaunch({
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
			if (!this.isAgreed) {
				uni.showToast({
					title: '请先阅读并同意协议',
					icon: 'none'
				});
				return;
			}

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
							// 判断是否需要跳回绑定页面
							if (this.redirectType === 'bind' && this.targetOrderId) {
								console.log('登录成功，跳回绑定页面');
								uni.redirectTo({
									url: `/pages/order/bind-confirm?orderId=${this.targetOrderId}`
								});
							} else {
								uni.reLaunch({
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
			const tabBarPages = ['/pages/home/home', '/pages/itinerary/itinerary', '/pages/profile/profile'];

			// 提取页面路径（去掉参数）
			const pagePath = url.split('?')[0];

			// 判断是否为 tabBar 页面
			if (tabBarPages.includes(pagePath)) {
				// 使用 switchTab 跳转到 tabBar 页面
				uni.switchTab({
					url: pagePath // tabBar 页面不支持参数，只跳转到页面
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
};
</script>

<style>
.back-button {
	position: absolute;
	left: 24rpx;
	top: calc(var(--status-bar-height) + 50rpx);
	width: 70rpx;
	height: 70rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 99;
	background-color: rgba(255, 255, 255, 0.7);
	border-radius: 50%;
}

/* 应用图标样式 */
.app-icon {
	width: 120px;
	height: 120px;
	background-color: white;
	display: flex;
	justify-content: center;
	align-items: center;
	overflow: hidden;
}

/* 登录按钮样式 */
.login-button {
	/* background-color: #07c160; */
	background-color: #eb6d20;
	color: #000;
	width: 70%;
	max-width: 300px;
	padding: 8px;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 20px;
	font-weight: 700;
	box-shadow: 0 4px 12px rgba(7, 193, 96, 0.2);
	border: none;
	transition: all 0.2s ease;
}

.login-button-text {
	letter-spacing: 4px;
}

.login-button[disabled] {
	/* background-color: #07c160; */
	background-color: #eb6d20;
	opacity: 0.9;
	box-shadow: none;
}

.login-button-hover {
	opacity: 0.9;
	transform: scale(0.98);
}

/* 应用名称样式 */
.app-name {
	font-size: 20px;
	font-weight: 600;
	text-align: center;
	color: #333;
	margin-bottom: 3px;
}

.app-name-en {
	font-size: 17px;
	font-weight: 400;
	text-align: center;
	color: #333;
	margin-bottom: 16px;
}

/* 应用标语样式 */
.app-slogan {
	font-size: 24px;
	font-weight: 600;
	text-align: center;
	color: #666;
	margin-bottom: 8px;
}

.app-subslogan {
	font-size: 20px;
	font-weight: 600;
	text-align: center;
	color: #666;
	margin-bottom: 16px;
}

.app-description {
	font-size: 16px;
	text-align: center;
	line-height: 1.5;
	color: #666;
	margin-bottom: 40px;
}

/* 隐私协议文本样式 */
.privacy-text {
	font-size: 15px;
	color: #999;
	text-align: center;
	margin-top: 20px;
	max-width: 300px;
	line-height: 1.5;
	display: flex;
	align-items: center;
	justify-content: center;
}

.skip-login-text {
	position: absolute;
	/* 适配iPhone等设备的底部安全区域 */
	bottom: calc(env(safe-area-inset-bottom) + 20px);
	left: 0;
	right: 0;

	font-size: 15px;
	color: #999;
	text-align: center;
}
</style>
