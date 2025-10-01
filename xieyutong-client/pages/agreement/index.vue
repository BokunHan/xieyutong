<template>
	<view class="min-h-screen bg-gray-50">
		<!-- 自定义导航栏 -->
		<view class="bg-white border-b border-gray-200">
			<view class="flex items-center justify-between px-4 py-3" :style="{paddingTop: statusBarHeight + 'px'}">
				<view class="w-8 h-8 flex items-center justify-center" @click="goBack">
					<text class="fas fa-arrow-left text-gray-600 text-lg"></text>
				</view>
				<view class="text-lg font-medium text-gray-900">{{ pageTitle }}</view>
				<view class="w-8 h-8"></view>
			</view>
		</view>
		
		<!-- 加载状态 -->
		<view v-if="loading" class="flex-1 flex items-center justify-center py-20">
			<view class="text-center">
				<view class="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></view>
				<view class="text-gray-500">加载中...</view>
			</view>
		</view>
		
		<!-- 协议内容 -->
		<scroll-view v-else scroll-y class="flex-1 px-4 py-6">
			<view class="bg-white rounded-lg p-6 shadow-sm">
				<!-- 富文本内容 -->
				<rich-text 
					v-if="content" 
					:nodes="content" 
					class="agreement-content"
				></rich-text>
				
				<!-- 无内容提示 -->
				<view v-else class="text-center py-20">
					<text class="fas fa-file-text text-gray-300 text-4xl mb-4 block"></text>
					<view class="text-gray-500">暂无协议内容</view>
					<view class="text-gray-400 text-sm mt-2">请联系管理员配置</view>
				</view>
			</view>
		</scroll-view>
		
		<!-- 错误提示 -->
		<view v-if="error" class="flex-1 flex items-center justify-center py-20">
			<view class="text-center">
				<text class="fas fa-exclamation-triangle text-red-400 text-4xl mb-4 block"></text>
				<view class="text-gray-600 mb-2">加载失败</view>
				<view class="text-gray-400 text-sm mb-4">{{ error }}</view>
				<button @click="loadContent" class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
					重试
				</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 0,
			type: '', // service 或 privacy
			pageTitle: '协议',
			content: '',
			loading: true,
			error: ''
		}
	},
	onLoad(options) {
		// 获取系统状态栏高度
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;
		
		// 获取协议类型
		this.type = options.type || 'service';
		this.setPageTitle();
		this.loadContent();
	},
	methods: {
		// 设置页面标题
		setPageTitle() {
			const titleMap = {
				'service': '服务协议',
				'privacy': '隐私政策'
			};
			this.pageTitle = titleMap[this.type] || '协议';
		},
		
		// 加载协议内容
		async loadContent() {
			this.loading = true;
			this.error = '';
			
			try {
				// 从数据库获取协议内容
				const db = uniCloud.database();
				const configKey = this.type === 'service' ? 'service_agreement' : 'privacy_policy';
				
				const result = await db.collection('a-system-configs')
					.where({
						config_key: configKey,
						status: 'active' // 启用状态
					})
					.orderBy('created_at', 'desc')
					.limit(1)
					.get();
				
				if (result.result.data && result.result.data.length > 0) {
					const configData = result.result.data[0];
					// config_value 是对象格式，需要获取其中的 content 字段
					this.content = configData.config_value?.content || configData.config_value;
					
					// 如果内容是字符串，需要处理为富文本格式
					if (typeof this.content === 'string') {
						// 将换行符转换为<br>标签
						this.content = this.content.replace(/\n/g, '<br>');
					}
				} else {
					this.content = '';
				}
			} catch (error) {
				console.error('加载协议内容失败:', error);
				this.error = error.message || '网络连接失败，请稍后重试';
			} finally {
				this.loading = false;
			}
		},
		
		// 返回上一页
		goBack() {
			uni.navigateBack({
				delta: 1
			});
		}
	}
}
</script>

<style scoped>
/* 富文本样式 */
.agreement-content {
	line-height: 1.6;
	color: #374151;
}

/* 富文本内容样式 */
.agreement-content >>> h1,
.agreement-content >>> h2,
.agreement-content >>> h3 {
	font-weight: bold;
	margin: 1rem 0 0.5rem 0;
	color: #111827;
}

.agreement-content >>> h1 {
	font-size: 1.5rem;
}

.agreement-content >>> h2 {
	font-size: 1.25rem;
}

.agreement-content >>> h3 {
	font-size: 1.125rem;
}

.agreement-content >>> p {
	margin: 0.5rem 0;
}

.agreement-content >>> ul,
.agreement-content >>> ol {
	margin: 0.5rem 0;
	padding-left: 1.5rem;
}

.agreement-content >>> li {
	margin: 0.25rem 0;
}

.agreement-content >>> strong,
.agreement-content >>> b {
	font-weight: bold;
	color: #111827;
}

.agreement-content >>> a {
	color: #3B82F6;
	text-decoration: underline;
}

/* 加载动画 */
.animate-spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}
</style> 