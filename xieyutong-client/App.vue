<script>
export default {
	onLaunch: function () {
		console.log('App Launch');

		// 全局加载FontAwesome字体
		this.loadFontAwesome();

		// 检查并设置默认启动页面
		this.checkDefaultPage();
	},
	onShow: function () {
		console.log('App Show');
	},
	onHide: function () {
		console.log('App Hide');
	},
	methods: {
		// 检查用户是否有进行中的行程，决定默认启动页面
		async checkDefaultPage() {
			try {
				console.log('[App] 开始检查默认启动页面');

				// 检查用户登录状态
				const token = uni.getStorageSync('uni_id_token');
				const tokenExpired = uni.getStorageSync('uni_id_token_expired');

				if (!token || (tokenExpired && Date.now() > tokenExpired)) {
					console.log('[App] 用户未登录，使用默认首页');
					return;
				}

				// 调用行程服务检查是否有进行中的行程
				const itineraryService = uniCloud.importObject('a-itinerary-service');
				const result = await itineraryService.getCurrentItinerary();

				console.log('[App] 行程检查结果:', result);

				if (result && result.errCode === 0 && result.data) {
					// 有进行中的行程，设置行程页面为默认启动页
					console.log('[App] 发现进行中的行程，将切换到行程页面');

					// 存储行程信息到本地，供行程页面使用
					uni.setStorageSync('current_itinerary', result.data);

					// 延迟跳转，确保应用初始化完成
					setTimeout(() => {
						uni.switchTab({
							url: '/pages/itinerary/itinerary',
							success: () => {
								console.log('[App] 成功切换到行程页面');
							},
							fail: (error) => {
								console.error('[App] 切换到行程页面失败:', error);
							}
						});
					}, 500);
				} else {
					console.log('[App] 没有进行中的行程，保持默认首页');
					// 清除可能存在的旧行程数据
					uni.removeStorageSync('current_itinerary');
				}
			} catch (error) {
				console.error('[App] 检查默认启动页面失败:', error);
				// 发生错误时，使用默认首页
			}
		},

		loadFontAwesome() {
			const fontList = [
				{
					family: 'Font Awesome 6 Free',
					path: 'url("https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/webfonts/fa-solid-900.ttf")'
				},
				{
					family: 'Font Awesome 6 Free Regular',
					path: 'url("https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/webfonts/fa-regular-400.ttf")'
				},
				{
					family: 'Font Awesome 6 Brands',
					path: 'url("https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/webfonts/fa-brands-400.ttf")'
				}
			];

			fontList.forEach((font) => {
				// #ifdef MP-WEIXIN
				// --- 只在微信小程序平台执行的代码 ---
				wx.loadFontFace({
					family: font.family,
					global: true,
					source: font.path,
					success: () => console.log(`[字体加载]wx: ${font.family} 加载成功`),
					fail: (err) => console.error(`[字体加载]wx: ${font.family} 加载失败:`, err)
				});
				// #endif

				// #ifndef MP-WEIXIN
				// --- 在除微信小程序以外的所有其他平台执行的代码 ---
				uni.loadFontFace({
					family: font.family,
					global: true,
					source: font.path,
					success: () => console.log(`[字体加载]uni: ${font.family} 加载成功`),
					fail: (err) => console.error(`[字体加载]uni: ${font.family} 加载失败:`, err)
				});
				// #endif
			});
		}
	}
};
</script>

<style>
/*每个页面公共css */
@import './static/css/tailwind.css';
@import './static/css/awesome-font.css';
</style>
