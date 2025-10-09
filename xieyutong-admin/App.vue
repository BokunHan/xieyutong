<template>
	<div>
		<!-- 强制显示调试信息 -->
		<div style="position: fixed; top: 10px; right: 10px; background: red; color: white; padding: 5px; z-index: 10000; font-size: 12px;">
			Debug: stagewise={{ !!stagewise }}, enabled={{ stagewise?.enabled }}
		</div>
		<div v-if="stagewise && stagewise.enabled" style="position: fixed; top: 40px; right: 10px; background: green; color: white; padding: 5px; z-index: 10000; font-size: 12px;">
			Stagewise Should Render
		</div>
		<StagewiseToolbar v-if="stagewise && stagewise.enabled" :config="stagewise.config" />
	</div>
</template>

<script>
	import {
		mapActions,
		mapMutations
	} from 'vuex'
	import config from '@/admin.config.js'
	import {
		version
	} from './package.json'
	import { uniAdminCacheKey } from './store/constants.js'
	import uploadFileForExtStorage from "@/js_sdk/ext-storage/uploadFileForExtStorage.js"
	import { StagewiseToolbar } from '@stagewise/toolbar-vue'
	import { VuePlugin } from '@stagewise-plugins/vue'
	export default {
		components: {
			StagewiseToolbar
		},
		data() {
			return {
				stagewise: {
					config: {
						plugins: [] // 暂时移除插件，测试基础工具栏
					},
					enabled: true
				}
			}
		},
		created() {
			this.clear = undefined
		},
		methods: {
			...mapMutations('app', ['SET_THEME']),
			...mapActions({
				init: 'app/init'
			}),
			clearPlatform() {
				const keysOfPlatform = uni.getStorageInfoSync().keys.filter(key => key.indexOf('platform') > -1)
				keysOfPlatform.length && keysOfPlatform.forEach(key => uni.removeStorageSync(key))
			}
		},
		onPageNotFound(msg) {
			uni.redirectTo({
				url: config.error.url
			})
		},
		onLaunch: function() {
			// #ifdef H5
			console.log(
				`%c uni-admin %c v${version} `,
				'background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff',
				'background:#007aff ;padding: 1px; border-radius: 0 3px 3px 0;  color: #fff; font-weight: bold;'
			)
			console.log('🔧 Stagewise Debug: App launched', this.stagewise)
			console.log('🔧 Stagewise Debug: StagewiseToolbar component', StagewiseToolbar)
			console.log('🔧 Stagewise Debug: VuePlugin', VuePlugin)
			// #endif
			// #ifdef H5
			// 此处为强制用户必须登录才能访问其他页面，如果需要部分页面不登录也能访问，需要在此过滤这些页面不执行下面的代码或直接注释掉此代码
			let uni_id_token_expired = uni.getStorageSync("uni_id_token_expired");
			if (!uni_id_token_expired || uni_id_token_expired < Date.now()) {
				uni.reLaunch({
					url: config.login.url
				})
			}
			// #endif
			// 线上示例使用
			// console.log('%c uni-app官方团队诚邀优秀前端工程师加盟，一起打造更卓越的uni-app & uniCloud，欢迎投递简历到 hr2013@dcloud.io', 'color: red');
			console.log('App Launch')
			if (this.$uniIdPagesStore.store.hasLogin) {
				this.init()
			}

			// 登录成功回调
			uni.$on('uni-id-pages-login-success', () => {
				this.init()
			})

			// theme
			this.SET_THEME(uni.getStorageSync(uniAdminCacheKey.theme) || 'default')

			// 设置 uniCloud.uploadFile 默认上传的云存储供应商
			uploadFileForExtStorage.init({
				provider: "unicloud", // provider代表默认上传到哪，可选项 "unicloud" 内置存储; "extStorage" 扩展存储;
				domain: "cdn.example.com", //【重要】这里需要改成你开通扩展存储时绑定的自定义域名）
				fileID2fileURL: true, // 将fileID转成fileURL，方便兼容老项目
				// 获取上传参数的函数
				uploadFileOptions: async (event) => {
					// ext-storage-co 是你自己写的云对象，参考代码：https://doc.dcloud.net.cn/uniCloud/ext-storage/dev.html#getuploadfileoptions
					const uniCloudStorageExtCo = uniCloud.importObject("ext-storage-co");
					return await uniCloudStorageExtCo.getUploadFileOptions(event);
				}
			});
		},
		onShow: function() {
			console.log('App Show')
			this.clear = setInterval(() => this.clearPlatform(), 15 * 60 * 1000)
		},
		onHide: function() {
			console.log('App Hide')
			this.clear && clearInterval(this.clear)
		}
	}
</script>

<style lang="scss">
	@import '@/common/uni.css';
	@import '@/common/uni-icons.css';
	@import '@/common/admin-icons.css';
	@import '@/common/theme.scss';
</style>
