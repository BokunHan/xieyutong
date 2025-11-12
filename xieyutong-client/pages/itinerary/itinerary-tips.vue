<template>
	<view class="page-container">
		<view class="status-bar-placeholder" :style="{ height: statusBarHeight + 100 + 'rpx' }">
			<view class="back-button" @click="goBack">
				<uni-icons type="left" size="22" color="#333"></uni-icons>
			</view>
		</view>

		<rich-content :html="dbContent" />
	</view>
</template>

<script>
import RichContent from '@/components/rich-content/rich-content.vue';

export default {
	components: {
		RichContent
	},
	data() {
		return {
			statusBarHeight: 0,
			dbContent: '<p>正在加载...</p>'
		};
	},
	onLoad(options) {
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;

		if (options.type) {
			this.fetchContent(options.type);
		} else {
			this.dbContent = '<p>未提供内容ID</p>';
		}
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},

		async fetchContent(type) {
			try {
				const db = uniCloud.database();
				const res = await db.collection('a-region-content').where({ type: type }).get();
				if (res.result.data && res.result.data.length > 0) {
					const data = res.result.data[0];
					this.dbContent = data.content;
				} else {
					this.dbContent = '<p>未找到内容</p>';
				}
			} catch (e) {
				console.error(e);
				this.dbContent = '<p>内容加载失败</p>';
			}
		}
	}
};
</script>

<style scoped>
.status-bar-placeholder {
	width: 100%;
	background-color: white;
}

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

.page-container {
	padding: 10px;
}
.header {
	padding-bottom: 10px;
	border-bottom: 1px solid #eee;
}
.title {
	font-size: 22px;
	font-weight: bold;
}
</style>
