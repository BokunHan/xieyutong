export default {
	onShareAppMessage(res) {
		return {
			title: '风漫国际旅行',
			path: '/pages/index/index' // 或者动态获取当前路径
		};
	},
	onShareTimeline(res) {
		return {
			title: '风漫国际旅行'
		};
	}
};
