<script>
export default {
	onLaunch: function () {
		console.log('App Launch');
		this.checkLoginStatus();
	},
	onShow: function () {
		console.log('App Show');
	},
	onHide: function () {
		console.log('App Hide');
	},
	methods: {
		async checkLoginStatus() {
			const token = uni.getStorageSync('uni_id_token');
			// 如果没有登录，不做任何处理，由页面自行守卫
			if (!token) return;

			// 获取当前页面栈，避免重复跳转
			const pages = getCurrentPages();
			const currentPage = pages[pages.length - 1];
			// 如果当前已经在注册流程的相关页面，可以暂时不强行跳转，或者根据需求强行纠正
			const currentRoute = currentPage ? currentPage.route : '';

			// 白名单页面（不需要被强制跳转逻辑打断的页面）
			const whiteList = ['pages/login/login', 'pages/common/webview'];
			if (whiteList.includes(currentRoute)) return;

			try {
				const db = uniCloud.database();
				const uid = uniCloud.getCurrentUserInfo().uid;
				if (!uid) return;

				// 1. 查角色
				const userRes = await db.collection('uni-id-users').doc(uid).field('role').get();
				const roles = userRes.result.data[0]?.role || [];

				if (roles.includes('guide')) {
					// 已经是司导，不做拦截
					return;
				}

				// 2. 查资料状态
				const profileRes = await db.collection('b-guide-profiles').where(`user_id == "${uid}"`).field('personality_type').limit(1).get();

				if (profileRes.result.data.length > 0) {
					const profile = profileRes.result.data[0];
					console.log('profile: ', profile);

					// 场景：有资料但没做测试 -> 强制去测试页
					if (!profile.personality_type) {
						if (currentRoute !== 'pages/register/quiz') {
							console.log('currentRoute: ', currentRoute);
							setTimeout(() => {
								uni.reLaunch({ url: '/pages/register/quiz' });
							}, 500);
						}
					} else {
						if (currentRoute !== 'pages/register/pending') {
							uni.reLaunch({ url: '/pages/register/pending' });
						}
					}
				} else {
					console.log('no profile');
					if (currentRoute !== 'pages/register/register') {
						uni.reLaunch({ url: '/pages/register/register' });
					}
				}
			} catch (e) {
				// 容错处理
				console.error('App check status error', e);
			}
		}
	}
};
</script>

<style>
/*每个页面公共css */
@import './static/css/tailwind.css';

::-webkit-scrollbar {
	display: none;
	width: 0;
	height: 0;
	-webkit-appearance: none;
	background: transparent;
	color: transparent;
}
</style>
