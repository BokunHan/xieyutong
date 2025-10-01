<template>
	<view class="min-h-screen bg-gray-50">
		<!-- 状态栏占位 -->
		<view :style="{height: statusBarHeight + 'px'}"></view>
		
		<!-- 搜索栏 -->
		<view class="bg-white border-b border-gray-100" :style="{height: navBarHeight + 'px'}">
			<view class="flex items-center h-full px-3" :style="{paddingTop: (menuButtonInfo.top - statusBarHeight) + 'px'}">
				<!-- 返回按钮 -->
				<view 
					class="flex items-center justify-center" 
					:style="{width: menuButtonInfo.height + 'px', height: menuButtonInfo.height + 'px'}"
					@click="goBack"
				>
					<text class="fa fa-arrow-left text-gray-800 text-lg"></text>
				</view>
				
				<!-- 搜索框 -->
				<view 
					class="flex-1 mx-2" 
					@click="goToSearch"
					:style="{marginRight: (menuButtonInfo.width + 12) + 'px'}"
				>
					<view class="flex items-center bg-gray-100 rounded-lg px-3 py-1" :style="{height: (menuButtonInfo.height - 4) + 'px'}">
						<text class="fa fa-search text-gray-400 text-sm"></text>
						<text class="ml-2 text-gray-600 text-sm">{{ searchKeyword || '搜索产品' }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 排序栏 -->
		<view class="bg-white border-b border-gray-100" v-if="!loading">
			<view class="flex w-full">
				<view 
					class="flex-1 py-3 flex items-center justify-center" 
					:class="{'text-red-500 font-medium border-b-2 border-red-500': sortType === 'default'}" 
					@click="changeSortType('default')"
				>
					<text class="text-sm">销量</text>
				</view>
				<view 
					class="flex-1 py-3 flex items-center justify-center" 
					:class="{'text-red-500 font-medium border-b-2 border-red-500': sortType === 'price'}" 
					@click="changeSortType('price')"
				>
					<text class="text-sm">价格</text>
					<text class="fa text-xs ml-1" :class="priceSort === 'asc' ? 'fa-long-arrow-up' : 'fa-long-arrow-down'" v-if="sortType === 'price'"></text>
				</view>
				<view 
					class="flex-1 py-3 flex items-center justify-center" 
					:class="{'text-red-500 font-medium border-b-2 border-red-500': sortType === 'latest'}" 
					@click="changeSortType('latest')"
				>
					<text class="text-sm">上新</text>
				</view>
			</view>
		</view>

		<!-- 搜索结果列表 -->
		<scroll-view 
			scroll-y 
			class="h-screen pt-2"
			:style="{height: 'calc(100vh - ' + (statusBarHeight + navBarHeight + 48) + 'px)'}"
			@scrolltolower="loadMoreResults"
			:refresher-enabled="true"
			:refresher-triggered="refresherTriggered"
			@refresherrefresh="onRefresh"
		>
			<!-- 搜索结果信息 -->
			<view class="flex justify-between items-center px-4 py-2 text-xs text-gray-500" v-if="!loading && productList.length > 0">
				<text>找到 {{ totalCount }} 个相关产品</text>
				<text v-if="searchTime">用时 {{ searchTime }}ms</text>
			</view>
			
			<!-- 加载状态 -->
			<view v-if="loading" class="flex flex-col items-center justify-center py-20">
				<view class="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-3"></view>
				<text class="text-gray-500 text-sm">正在搜索...</text>
			</view>

			<!-- 搜索结果 - 参考首页的产品卡片样式 -->
			<view v-else-if="productList.length > 0" class="px-3">
				<view 
					v-for="(product, index) in productList" 
					:key="product.id || index" 
					class="bg-white mb-3 rounded-lg overflow-hidden shadow-sm"
					@click="goToProductDetail(product.id)"
				>
					<image :src="product.image" class="w-full h-48 object-cover" mode="aspectFill"></image>
					<view class="p-3">
						<view class="text-base font-medium text-gray-900 mb-1 line-clamp-2">{{ product.title }}</view>
						<view class="text-sm text-gray-600 mb-2 line-clamp-1" v-if="product.subtitle">{{ product.subtitle }}</view>
						
						<view class="flex justify-between items-center mb-2">
							<view class="flex items-center">
								<text class="fa fa-star text-yellow-400 mr-1 text-xs"></text>
								<text class="text-xs text-gray-700 font-medium mr-1">{{ product.rating }}分</text>
								<text class="text-xs text-gray-500">({{ product.reviewCount }}条评价)</text>
							</view>
							<text class="text-xs text-gray-500">已售{{ product.soldCount }}人</text>
						</view>
						
						<view class="flex justify-between items-end mt-2">
							<view class="flex items-baseline">
								<text class="text-red-500 text-xs">¥</text>
								<text class="text-red-500 text-lg font-bold">{{ product.price }}</text>
								<text class="text-gray-400 text-xs ml-1">/人起</text>
							</view>
							<view class="bg-red-50 text-red-500 text-xs px-2 py-1 rounded-full">{{ product.tag }}</view>
						</view>
					</view>
				</view>
				
				<!-- 加载更多 -->
				<view class="py-4 text-center" v-if="hasMore">
					<view v-if="loadingMore" class="flex items-center justify-center space-x-2">
						<text class="fa fa-spinner fa-spin text-gray-500"></text>
						<text class="text-sm text-gray-500">加载更多...</text>
					</view>
					<view v-else class="text-blue-500 text-sm py-2" @click="loadMoreResults">
						点击加载更多
					</view>
				</view>
				
				<!-- 没有更多数据 -->
				<view v-else class="py-4 text-center text-xs text-gray-400">
					已显示全部搜索结果
				</view>
			</view>

			<!-- 无搜索结果 -->
			<view v-else class="flex flex-col items-center justify-center py-20 px-6 text-center">
				<view class="text-5xl mb-6">🔍</view>
				<text class="text-lg font-medium text-gray-800 mb-2">未找到相关产品</text>
				<text class="text-sm text-gray-500 mb-8">试试其他关键词或者浏览热门产品</text>
				<view class="flex space-x-4">
					<view class="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-medium" @click="goToSearch">
						重新搜索
					</view>
					<view class="bg-gray-100 text-gray-700 px-6 py-2 rounded-full text-sm font-medium" @click="goToHome">
						浏览热门
					</view>
				</view>
			</view>
		</scroll-view>


	</view>
</template>

<script>
export default {
	data() {
		return {
			searchKeyword: '',
			productList: [],
			loading: false,
			loadingMore: false,
			hasMore: true,
			currentPage: 1,
			pageSize: 10,
			totalCount: 0,
			searchTime: 0,
			statusBarHeight: 20,
			navBarHeight: 44,
			menuButtonInfo: {
				width: 87,
				height: 32,
				top: 48,
				right: 7,
				bottom: 80
			},
			
			// 排序相关
			sortType: 'default', // default, sales, price, latest
			priceSort: 'asc', // asc, desc
			
			// 下拉刷新
			refresherTriggered: false
		}
	},
	onLoad(options) {
		console.log('搜索结果页面 onLoad:', options);
		
		// 获取系统信息
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 20;
		
		// 微信小程序胶囊按钮信息
		// #ifdef MP-WEIXIN
		this.menuButtonInfo = uni.getMenuButtonBoundingClientRect();
		this.navBarHeight = (this.menuButtonInfo.top - this.statusBarHeight) * 2 + this.menuButtonInfo.height;
		console.log('🎯 胶囊按钮信息:', this.menuButtonInfo);
		console.log('📐 导航栏高度:', this.navBarHeight);
		// #endif
		
		// 获取搜索关键词并解码
		let keyword = options.keyword || getApp().globalData.searchText || '';
		if (keyword) {
			try {
				// 解码URL编码的关键词
				keyword = decodeURIComponent(keyword);
				console.log('🔍 解码后的搜索关键词:', keyword);
			} catch (error) {
				console.warn('⚠️ 解码搜索关键词失败:', error);
			}
		}
		this.searchKeyword = keyword;
		
		if (this.searchKeyword) {
			this.performSearch();
		} else {
			// 如果没有搜索关键词，跳转回搜索页面
			uni.redirectTo({
				url: '/pages/search/search'
			});
		}
	},
	methods: {
		// 返回上一页
		goBack() {
			uni.navigateBack();
		},
		
		// 执行搜索
		async performSearch() {
			if (!this.searchKeyword.trim()) return;
			
			console.log('🔍 开始搜索:', this.searchKeyword);
			
			try {
				this.loading = true;
				this.currentPage = 1;
				this.hasMore = true;
				
				const startTime = Date.now();
				
				// 使用JQL进行搜索
				const db = uniCloud.databaseForJQL();
				
				// 构建JQL搜索条件字符串
				const whereCondition = this.buildJQLSearchCondition();
				console.log('🔧 JQL搜索条件:', whereCondition);
				
				// 执行搜索 - 参考首页的字段选择
				const result = await db.collection('a-products')
					.where(whereCondition)
					.field('_id,product_id,title,subtitle,price,child_price,rating,product_images,sales_count,review_count,view_count,sort_order')
					.orderBy(this.getSortOrderBy())
					.limit(this.pageSize)
					.get();
				
				this.searchTime = Date.now() - startTime;
				
				console.log('✅ 搜索完成:', result);
				
				// JQL返回的是 result.data，参考首页数据处理方式
				const rawData = result.data || [];
				console.log('📋 原始搜索数据:', rawData);
				
				// 数据预处理 - 参考首页的处理方式
				const processedData = rawData.map((item, index) => {
					console.log(`🔍 处理第${index + 1}条搜索数据:`, item);
					
					// 生成智能标签
					let tag = '热门推荐';
					if (item.sales_count > 100) {
						tag = '爆款热销';
					} else if (item.sales_count > 50) {
						tag = '人气精选';
					} else if (item.rating >= 4.8) {
						tag = '高分好评';
					} else if (item.view_count > 1000) {
						tag = '热门关注';
					}
					
					// 处理产品数据 - 与首页保持一致
					const processedItem = {
						id: item._id, // 使用_id作为唯一标识
						product_id: item.product_id || '',
						title: item.title || '未知商品',
						subtitle: item.subtitle || '',
						rating: Number(item.rating) || 5.0,
						soldCount: Number(item.sales_count) || 0, // 保持原字段名用于模板
						reviewCount: Number(item.review_count) || 0,
						viewCount: Number(item.view_count) || 0,
						price: this.formatPrice(item.price),
						child_price: this.formatPrice(item.child_price),
						image: (item.product_images && item.product_images.length > 0) 
							? item.product_images[0] 
							: 'https://images.unsplash.com/photo-1635582681213-450e9b127343?w=400',
						tag: tag,
						sort_order: Number(item.sort_order) || 0
					};
					
					console.log(`✅ 处理后的搜索数据:`, processedItem);
					return processedItem;
				});
				
				this.productList = processedData;
				this.totalCount = processedData.length; // 注意：这里只是当前页的数量，实际总数需要单独查询
				
				// 检查是否还有更多数据
				this.hasMore = rawData.length === this.pageSize;
				
				// 记录搜索日志
				this.recordSearchLog();
				
				// 如果没有搜索结果，显示提示
				if (processedData.length === 0) {
					console.log('🔍 未找到相关产品');
				} else {
					console.log(`✅ 找到 ${processedData.length} 个产品`);
				}
				
			} catch (error) {
				console.error('❌ 搜索失败:', error);
				uni.showToast({
					title: '搜索失败，请重试',
					icon: 'none'
				});
			} finally {
				this.loading = false;
			}
		},
		
		// 构建JQL搜索条件字符串
		buildJQLSearchCondition() {
			let conditions = [];
			
			// 基础条件：启用状态
			conditions.push('status == 1');
			
			// 添加关键词搜索条件
			if (this.searchKeyword && this.searchKeyword.trim()) {
				// 使用JQL正则表达式语法进行模糊搜索
				const keyword = this.searchKeyword.trim();
				const regex = `/${keyword}/i`; // JQL正则表达式格式
				
				// 多字段模糊搜索
				const searchFields = [
					`${regex}.test(title)`,
					`${regex}.test(subtitle)`, 
					`${regex}.test(destination)`
				];
				
				conditions.push(`(${searchFields.join(' || ')})`);
			}
			
			const whereCondition = conditions.join(' && ');
			console.log('🔧 JQL搜索条件:', whereCondition);
			return whereCondition;
		},
		
		// 构建JQL排序条件
		getSortOrderBy() {
			switch (this.sortType) {
				case 'price':
					return `price ${this.priceSort}`;
				case 'latest':
					return 'create_time desc';
				default:
					// 默认按销量排序，如果没有销量字段则按创建时间
					return 'soldCount desc, create_time desc';
			}
		},
		
		// 记录搜索日志
		async recordSearchLog() {
			try {
				const db = uniCloud.databaseForJQL();
				const deviceId = uni.getStorageSync('uni_id_device') || '';
				
				await db.collection('a-search-log').add({
					content: this.searchKeyword,
					device_id: deviceId,
					search_type: 'product',
					result_count: this.totalCount
				});
				console.log('✅ 搜索日志记录成功');
			} catch (error) {
				console.error('❌ 记录搜索日志失败:', error);
			}
		},
		
		// 更改排序方式
		changeSortType(type) {
			if (this.sortType === type && type === 'price') {
				// 如果点击的是当前已选中的价格排序，则切换升序/降序
				this.priceSort = this.priceSort === 'asc' ? 'desc' : 'asc';
			} else {
				this.sortType = type;
				if (type === 'price' && !this.priceSort) {
					this.priceSort = 'asc';
				}
			}
			
			// 重新搜索
			this.performSearch();
		},
		
		// 加载更多结果
		async loadMoreResults() {
			if (this.loadingMore || !this.hasMore || this.loading) return;
			
			try {
				this.loadingMore = true;
				this.currentPage++;
				
				const whereCondition = this.buildJQLSearchCondition();
				
				const db = uniCloud.databaseForJQL();
				const result = await db.collection('a-products')
					.where(whereCondition)
					.field('_id,product_id,title,subtitle,price,child_price,rating,product_images,sales_count,review_count,view_count,sort_order')
					.orderBy(this.getSortOrderBy())
					.skip((this.currentPage - 1) * this.pageSize)
					.limit(this.pageSize)
					.get();
				
				const rawMoreData = result.data || [];
				if (rawMoreData.length > 0) {
					// 数据预处理 - 与首次搜索保持一致
					const processedMoreData = rawMoreData.map((item, index) => {
						// 生成智能标签
						let tag = '热门推荐';
						if (item.sales_count > 100) {
							tag = '爆款热销';
						} else if (item.sales_count > 50) {
							tag = '人气精选';
						} else if (item.rating >= 4.8) {
							tag = '高分好评';
						} else if (item.view_count > 1000) {
							tag = '热门关注';
						}
						
						// 处理产品数据 - 与首页保持一致
						return {
							id: item._id,
							product_id: item.product_id || '',
							title: item.title || '未知商品',
							subtitle: item.subtitle || '',
							rating: Number(item.rating) || 5.0,
							soldCount: Number(item.sales_count) || 0,
							reviewCount: Number(item.review_count) || 0,
							viewCount: Number(item.view_count) || 0,
							price: this.formatPrice(item.price),
							child_price: this.formatPrice(item.child_price),
							image: (item.product_images && item.product_images.length > 0) 
								? item.product_images[0] 
								: 'https://images.unsplash.com/photo-1635582681213-450e9b127343?w=400',
							tag: tag,
							sort_order: Number(item.sort_order) || 0
						};
					});
					
					this.productList = this.productList.concat(processedMoreData);
					this.hasMore = rawMoreData.length === this.pageSize;
				} else {
					this.hasMore = false;
				}
				
			} catch (error) {
				console.error('加载更多失败:', error);
				this.currentPage--; // 回退页码
			} finally {
				this.loadingMore = false;
			}
		},
		
		// 下拉刷新
		onRefresh() {
			this.refresherTriggered = true;
			this.performSearch().finally(() => {
				this.refresherTriggered = false;
			});
		},
		

		
		// 页面跳转
		goToSearch() {
			uni.navigateTo({
				url: '/pages/search/search'
			});
		},
		
		goToHome() {
			uni.switchTab({
				url: '/pages/home/home'
			});
		},
		
		goToProductDetail(productId) {
			console.log('🔗 跳转到产品详情页，产品ID:', productId);
			console.log('📊 产品ID类型:', typeof productId);
			
			if (!productId) {
				console.error('❌ 产品ID为空，无法跳转');
				uni.showToast({
					title: '产品信息错误',
					icon: 'none'
				});
				return;
			}
			
			try {
				const url = `/pages/product-detail/product-detail?id=${productId}`;
				console.log('🚀 跳转URL:', url);
				
				uni.navigateTo({
					url: url,
					success: (res) => {
						console.log('✅ 产品详情页跳转成功:', res);
					},
					fail: (err) => {
						console.error('❌ 产品详情页跳转失败:', err);
						uni.showToast({
							title: '页面跳转失败',
							icon: 'none'
						});
					}
				});
			} catch (error) {
				console.error('❌ goToProductDetail异常:', error);
				uni.showToast({
					title: '跳转异常',
					icon: 'none'
				});
			}
		},
		
		// 工具方法 - 参考首页的formatPrice实现
		formatPrice(price) {
			console.log('💰 formatPrice 输入:', price, '类型:', typeof price);
			
			// 处理空值
			if (price === null || price === undefined || price === '') {
				console.log('⚠️ 价格为空，返回默认值');
				return '0';
			}
			
			// 转换为数字
			let numPrice = Number(price);
			if (isNaN(numPrice)) {
				console.log('⚠️ 价格转换失败，返回默认值:', price);
				return '0';
			}
			
			// 确保价格不为负数
			numPrice = Math.max(0, numPrice);
			
			// 格式化为千分位分隔的字符串
			const formatted = numPrice.toLocaleString('zh-CN', {
				minimumFractionDigits: 0,
				maximumFractionDigits: 2
			});
			
			console.log('✅ 价格格式化结果:', formatted);
			return formatted;
		}
	}
}
</script>

<style>
/* 使用Tailwind CSS，无需额外样式 */
.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style> 