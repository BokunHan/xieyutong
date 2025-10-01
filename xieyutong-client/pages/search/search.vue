<template>
	<view class="min-h-screen bg-gray-50">
		<!-- 状态栏占位 -->
		<view :style="{height: statusBarHeight + 'px'}"></view>
		
		<!-- 导航栏 -->
		<view class="bg-white" :style="{height: navBarHeight + 'px'}">
			<view class="flex items-center h-full px-3">
				<!-- 返回按钮 -->
				<view class="w-10 h-10 flex items-center justify-center" @click="cancel">
					<text class="fa fa-arrow-left text-gray-800 text-lg"></text>
				</view>
				
				<!-- 搜索框 -->
				<view class="flex-1 mx-2">
					<view class="flex items-center bg-gray-100 rounded-lg px-3 py-2">
						<text class="fa fa-search text-gray-400 text-sm mr-2"></text>
						<input 
							v-model="searchText" 
							:placeholder="hotWorld"
							:focus="focus"
							placeholder-class="text-gray-400 text-sm"
							class="flex-1 bg-transparent text-sm text-gray-800"
							@input="onInput"
							@confirm="confirm"
						/>
						<view v-if="searchText" class="ml-2" @click="clearInput">
							<text class="fa fa-times-circle text-gray-400 text-sm"></text>
						</view>
					</view>
				</view>
				
				<!-- 更多按钮（三个点）-->
				<view class="w-10 h-10 flex items-center justify-center">
					<text class="fa fa-ellipsis-h text-gray-600 text-lg"></text>
				</view>
				
				<!-- 右侧圆形按钮 -->
				<view class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center ml-2">
					<text class="fa fa-question text-gray-600 text-sm"></text>
				</view>
			</view>
		</view>
		
		<!-- 分隔线 -->
		<view class="h-px bg-gray-200"></view>

		<!-- 搜索内容区域 -->
		<view class="bg-white mt-1 mx-2 rounded-lg shadow-sm">
			<!-- 搜索历史 -->
			<view v-if="localSearchList.length" class="p-4 border-b border-gray-100">
				<view class="flex items-center justify-between mb-3">
					<text class="text-gray-800 text-base font-medium">搜索历史</text>
					<view v-if="!localSearchListDel" @click="localSearchListDel = true" class="p-1">
						<text class="fa fa-trash text-gray-500 text-sm"></text>
					</view>
					<view v-else class="flex items-center space-x-4">
						<view @click="LocalSearchListClear" class="px-2 py-1">
							<text class="text-gray-600 text-xs">全部删除</text>
						</view>
						<view @click="localSearchListDel = false" class="px-2 py-1">
							<text class="text-red-500 text-xs">完成</text>
						</view>
					</view>
				</view>

				<view class="flex flex-wrap">
					<view 
						v-for="(word,index) in localSearchList" 
						:key="index"
						class="flex items-center bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2"
						@click="LocalSearchlistItemClick(word,index)"
					>
						<text class="text-gray-600 text-xs">{{word}}</text>
						<text v-if="localSearchListDel" class="fa fa-times text-gray-400 text-xs ml-1"></text>
					</view>
				</view>
			</view>

			<!-- 搜索发现/热搜 -->
			<view class="p-4">
				<view class="flex items-center justify-between mb-3">
					<view class="flex items-center">
						<text class="text-gray-800 text-base font-medium">搜索发现</text>
						<view v-if="!netHotListIsHide" class="ml-2 p-1" @click="searchHotRefresh">
							<text class="fa fa-sync-alt text-gray-500 text-sm"></text>
						</view>
					</view>
					<view @click="netHotListIsHide = !netHotListIsHide" class="p-1">
						<text :class="'fa ' + (netHotListIsHide ? 'fa-eye-slash' : 'fa-eye') + ' text-gray-500 text-sm'"></text>
					</view>
				</view>

				<!-- 热搜数据加载 -->
				<unicloud-db 
					ref="udb" 
					#default="{data, loading, error, options}" 
					field="content" 
					collection="a-search-hot"
					orderby="rank asc,count desc" 
					page-data="replace" 
					:page-size="10"
				>
					<view v-if="loading && !netHotListIsHide" class="text-center py-4">
						<text class="text-gray-500 text-sm">正在加载...</text>
					</view>
					<view v-else-if="!netHotListIsHide">
						<view v-if="error" class="text-center py-4">
							<text class="text-gray-500 text-sm">{{error.message}}</text>
						</view>
						<view v-else class="flex flex-wrap">
							<view 
								v-for="(word,index) in data" 
								:key="index"
								class="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2"
								@click="search(word.content)"
							>
								<text class="text-gray-600 text-xs">{{word.content}}</text>
							</view>
						</view>
					</view>
					<view v-else class="text-center py-4">
						<text class="text-gray-500 text-sm">当前搜索发现已隐藏</text>
					</view>
				</unicloud-db>
			</view>
		</view>

		<!-- 搜索联想列表 -->
		<view v-if="associativeShow" class="absolute left-0 right-0 bottom-0 bg-white mx-2 mt-1 rounded-lg shadow-lg overflow-hidden z-50" :style="{top: (statusBarHeight + navBarHeight + 8) + 'px'}">
			<scroll-view scroll-y class="h-full">
				<view 
					v-for="(item,index) in associativeList" 
					:key="item._id"
					class="flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
					@click="associativeClick(item)"
				>
					<view class="mr-3">
						<text class="fa fa-search text-gray-400 text-sm"></text>
					</view>
					<view class="flex-1">
						<text class="text-gray-800 text-sm">{{truncateText(item.title, 30)}}</text>
					</view>
					<view v-if="item.price">
						<text class="text-orange-500 text-sm font-medium">{{item.price}}</text>
					</view>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	/**
	 * 携程私域搜索页面
	 * @description 基于uniCloud云端一体搜索模板适配的旅游产品搜索页面
	 */
	const searchLogDbName = 'a-search-log'; // 搜索记录数据库
	const productsDbName = 'a-products'; // 旅游产品数据库
	const associativeSearchField = 'title'; // 联想时，搜索框值检索数据库字段名
	const associativeField = 'title,price'; // 联想列表每一项携带的字段
	const localSearchListKey = '__travel_search_history'; //	本地历史存储字段名

	// 数组去重
	const arrUnique = arr => {
		for (let i = arr.length - 1; i >= 0; i--) {
			const curIndex = arr.indexOf(arr[i]);
			const lastIndex = arr.lastIndexOf(arr[i])
			curIndex != lastIndex && arr.splice(lastIndex, 1)
		}
		return arr
	}
	
	// 防抖
	function debounce(fn, interval, isFirstAutoRun) {
		var _self = fn;
		var timer = null;
		var first = true;

		if (isFirstAutoRun) {
			_self();
		}

		return function() {
			var args = arguments;
			var _me = this;
			if (first) {
				first = false;
				_self.apply(_me, args);
			}

			if (timer) {
				clearTimeout(timer)
			}

			timer = setTimeout(function() {
				clearTimeout(timer);
				timer = null;
				_self.apply(_me, args);
			}, interval || 200);
		}
	}

	export default {
		data() {
			return {
				productsDbName,
				searchLogDbName,

				localSearchList: uni.getStorageSync(localSearchListKey) || [],
				localSearchListDel: false,
				netHotListIsHide: false,
				searchText: '',
				iconColor: '#999999',
				associativeList: [],
				keyBoardPopup: false,

				hotWorld: '拉萨', //	搜索热词，如果没有输入即回车，则搜索热词，但是不会加入搜索记录
				focus: true, //	是否自动聚焦
				speechEngine: 'iFly', //	语音识别引擎 iFly 讯飞 baidu 百度
				
				// 系统信息
				statusBarHeight: 0,
				navBarHeight: 44
			}
		},
		created() {
			this.db = uniCloud.database();
			this.searchLogDb = this.db.collection(this.searchLogDbName);
			this.productsDb = this.db.collection(this.productsDbName);
			
			// 获取系统信息
			const systemInfo = uni.getSystemInfoSync();
			this.statusBarHeight = systemInfo.statusBarHeight || 20;
			
			// #ifdef MP-WEIXIN
			// 微信小程序胶囊按钮信息
			const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
			this.navBarHeight = (menuButtonInfo.top - this.statusBarHeight) * 2 + menuButtonInfo.height;
			// #endif
			
			// #ifdef APP-PLUS
			this.navBarHeight = 44; // APP默认导航栏高度
			uni.onKeyboardHeightChange((res) => {
				this.keyBoardPopup = res.height !== 0;
			})
			// #endif

			this.searchText = getApp().globalData.searchText || '';
		},
		methods: {
			// 文字截断方法
			truncateText(text, maxLength) {
				if (!text) return '';
				if (text.length <= maxLength) return text;
				return text.substring(0, maxLength) + '...';
			},
			onInput(e) {
				this.searchText = e.detail.value;
			},
			clearInput() {
				this.searchText = '';
				this.associativeList = [];
			},
			confirm(res) {
				// 键盘确认
				this.search(res.detail.value || this.searchText);
			},
			cancel(res) {
				uni.hideKeyboard();
				this.searchText = '';
				uni.navigateBack();
			},
			search(value) {
				if (!value && !this.hotWorld) {
					return;
				}
				if (value) {
					if (this.searchText !== value) {
						this.searchText = value
					}

					this.localSearchListManage(value);
					this.searchLogDbAdd(value)
				} else if (this.hotWorld) {
					this.searchText = this.hotWorld
				}

				uni.hideKeyboard();
				this.loadList(this.searchText);
			},
			localSearchListManage(word) {
				let list = uni.getStorageSync(localSearchListKey) || [];
				if (list.length) {
					this.localSearchList.unshift(word);
					arrUnique(this.localSearchList);
					if (this.localSearchList.length > 10) {
						this.localSearchList.pop();
					}
				} else {
					this.localSearchList = [word];
				}
				uni.setStorageSync(localSearchListKey, this.localSearchList);
			},
			LocalSearchListClear() {
				this.localSearchList = [];
				uni.removeStorageSync(localSearchListKey);
			},
			LocalSearchlistItemClick(word, index) {
				if (this.localSearchListDel) {
					this.localSearchList.splice(index, 1);
					uni.setStorageSync(localSearchListKey, this.localSearchList);
				} else {
					this.search(word);
				}
			},
			searchLogDbAdd(value) {
				// 添加搜索记录到云数据库
				let deviceId = uni.getStorageSync('uni_id_device') || '';
				this.searchLogDb.add({
					content: value,
					device_id: deviceId,
					search_type: 'product',
					result_count: 0
				}).then(res => {
					console.log('搜索记录已保存', res);
				}).catch(err => {
					console.error('保存搜索记录失败', err);
				});
			},
			searchHotRefresh() {
				this.$refs.udb.loadData({
					clear: true
				});
			},
			associativeClick(item) {
				getApp().globalData.searchText = item.title;
				this.search(item.title);
			},
			loadList(searchText = '') {
				// 跳转到搜索结果页面并传递搜索关键词
				if (searchText) {
					uni.navigateTo({
						url: `/pages/search/search-result?keyword=${encodeURIComponent(searchText)}`
					});
				} else {
					// 如果没有搜索内容，不跳转
					uni.showToast({
						title: '请输入搜索内容',
						icon: 'none'
					});
				}
			},
			// 语音搜索功能
			// #ifdef APP-PLUS
			speech() {
				// TODO: 实现语音搜索功能
				uni.showToast({
					title: '语音搜索功能开发中',
					icon: 'none'
				});
			}
			// #endif
		},
		computed: {
			associativeShow() {
				return this.searchText && this.associativeList.length;
			}
		},
		watch: {
			searchText: debounce(function(value) {
				if (value) {
					// 根据a-products表结构进行搜索联想
					this.productsDb.where({
						[associativeSearchField]: new RegExp(value, 'gi'),
						status: 1 // 只搜索上架的产品
					}).field(associativeField).limit(10).get().then(res => {
						this.associativeList = res.result.data;
					}).catch(err => {
						console.error('搜索联想失败', err);
						this.associativeList = [];
					});
				} else {
					this.associativeList.length = 0;
					getApp().globalData.searchText = '';
				}
			}, 300)
		}
	}
</script>

<style>
/* 覆盖默认样式 */
page {
	background-color: #f9fafb;
}
</style> 