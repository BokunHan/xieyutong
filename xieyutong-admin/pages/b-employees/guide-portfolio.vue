<template>
	<view class="p-4 min-h-screen bg-gray-50">
		<view class="mb-6 flex justify-between items-center">
			<view>
				<view class="text-xl font-bold text-gray-800">{{ currentName }} 的精彩瞬间</view>
				<view class="text-sm text-gray-500 mt-1">管理该私导展示在前端的个人相册/视频</view>
			</view>
			<button class="uni-button" type="primary" size="mini" @click="goAdd">
				<uni-icons type="plusempty" size="14" color="#fff"></uni-icons>
				上传素材
			</button>
		</view>

		<unicloud-db ref="udb" v-slot:default="{ data, loading, error, options }" collection="b-guide-portfolio" :where="whereCondition" orderby="created_at desc">
			<view v-if="error" class="p-8 text-center text-red-500 bg-white rounded">{{ error.message }}</view>
			<view v-else-if="loading" class="p-8 text-center text-gray-500">加载中...</view>
			<view v-else-if="data.length === 0" class="p-12 text-center bg-white rounded shadow-sm">
				<uni-icons type="images" size="48" color="#ddd"></uni-icons>
				<view class="text-gray-400 mt-2">暂无上传的素材</view>
				<button class="mt-4" size="mini" type="primary" plain @click="goAdd">去上传第一张照片</button>
			</view>

			<view v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
				<view
					v-for="(item, index) in data"
					:key="index"
					class="group relative bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
					<view class="aspect-w-1 aspect-h-1 w-full h-40 bg-gray-100 relative">
						<image v-if="item.media_type === 'image'" :src="item.media.url" mode="aspectFill" class="w-full h-full object-cover" @click="preview(item.media.url, data)"></image>
						<view v-else-if="item.media_type === 'video'" class="w-full h-full flex items-center justify-center bg-black" @click="previewVideo(item)">
							<video :src="item.media.url" class="w-full h-full" :controls="false" :show-center-play-btn="false"></video>
							<view class="absolute inset-0 flex items-center justify-center pointer-events-none">
								<uni-icons type="videocam-filled" color="#fff" size="30"></uni-icons>
							</view>
						</view>
					</view>

					<view class="p-2 bg-white flex justify-between items-center">
						<text class="text-xs text-gray-400">{{ formatDate(item.created_at) }}</text>
						<view class="flex space-x-3">
							<uni-icons type="trash" color="#ff4d4f" size="18" class="cursor-pointer" @click="handleDelete(item._id)"></uni-icons>
						</view>
					</view>
				</view>
			</view>
		</unicloud-db>

		<view v-if="videoVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" @click="closeVideo">
			<view class="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl" @click.stop>
				<view class="absolute top-4 right-4 z-10 cursor-pointer" @click="closeVideo">
					<uni-icons type="closeempty" size="30" color="#fff"></uni-icons>
				</view>

				<video :src="currentVideoUrl" class="w-full h-[60vh]" :autoplay="true" :controls="true"></video>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			userId: '',
			currentName: '私导',
			whereCondition: '',
			videoVisible: false,
			currentVideoUrl: ''
		};
	},
	onLoad(options) {
		if (options.user_id) {
			this.userId = options.user_id;
			this.currentName = options.name || '私导';
			this.whereCondition = `user_id == "${this.userId}"`;
			uni.$on('refreshPortfolioList', () => {
				console.log('收到刷新信号，正在重载数据...');
				this.$refs.udb.refresh();
			});
		} else {
			uni.showToast({ title: '参数错误', icon: 'none' });
			setTimeout(() => uni.navigateBack(), 1000);
		}
	},
	onUnload() {
		uni.$off('refreshPortfolioList');
	},
	methods: {
		goAdd() {
			// 传递 user_id 给新增页面
			uni.navigateTo({
				url: `./guide-portfolio-add?user_id=${this.userId}&name=${this.currentName}`
			});
		},
		handleDelete(id) {
			this.$refs.udb.remove(id, {
				success: () => {
					uni.showToast({ title: '已删除' });
				},
				fail: (err) => {
					uni.showModal({
						title: '删除失败',
						content: '请检查Schema权限配置。\n错误信息：' + err.message
					});
				}
			});
		},
		preview(current, list) {
			// 过滤出所有图片进行预览
			const urls = list.filter((i) => i.media_type === 'image').map((i) => i.media.url);
			uni.previewImage({
				current: current,
				urls: urls
			});
		},
		previewVideo(item) {
			this.currentVideoUrl = item.media.url;
			this.videoVisible = true;
		},
		closeVideo() {
			this.videoVisible = false;
			this.currentVideoUrl = ''; // 清空地址以停止播放
		},
		formatDate(timestamp) {
			if (!timestamp) return '';
			const date = new Date(timestamp);
			return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
		}
	}
};
</script>
