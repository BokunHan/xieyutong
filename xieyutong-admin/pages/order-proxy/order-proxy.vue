<template>
	<view class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-microsoft">
		    <!-- 页面头部 -->
    <view class="bg-white shadow-lg border-b border-gray-200">
			<view class="max-w-7xl mx-auto px-8 py-6">
				<view class="flex items-center justify-between">
					<view class="flex items-center space-x-4">
						<view class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
							<i class="fas fa-user-plus text-white text-xl"></i>
						</view>
						<view>
							<text class="text-3xl font-bold text-gray-900">代下单管理</text>
							<text class="block text-lg text-gray-600 mt-1">为客户快速创建旅游订单</text>
						</view>
					</view>
					<view class="flex items-center space-x-4">
						<view class="bg-blue-50 px-6 py-3 rounded-lg">
							<text class="text-blue-700 font-medium text-lg">今日代下单: {{ todayOrderCount }}笔</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 主要内容区域 -->
		<view class="max-w-7xl mx-auto px-8 py-8 space-y-8">
			
			<!-- 代下单表单区域 -->
			<view class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
				<view class="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
					<view class="flex items-center">
						<i class="fas fa-plus-circle text-white text-2xl mr-4"></i>
						<text class="text-2xl font-bold text-white">创建新订单</text>
					</view>
				</view>
				
				<view class="p-8">
					<view class="grid grid-cols-1 xl:grid-cols-2 gap-8">
						<!-- 左侧：订单信息表单 -->
						<view class="space-y-6">
							<view>
								<text class="block text-xl font-semibold text-gray-800 mb-4">订单基本信息</text>
								
								<!-- 客户手机号 -->
								<view class="mb-6">
									<label class="flex items-center text-lg font-medium text-gray-700 mb-3">
										<i class="fas fa-mobile-alt text-blue-500 mr-3 text-xl"></i>
										客户手机号
									</label>
									<uni-easyinput 
										v-model="orderForm.customerPhone"
										placeholder="请输入客户手机号"
										type="number"
										:clearable="true"
										:inputBorder="true"
										:styles="{
											color: '#1f2937',
											backgroundColor: '#ffffff',
											borderColor: '#d1d5db',
											borderRadius: '12px',
											fontSize: '18px',
											fontFamily: 'Microsoft YaHei, sans-serif',
											padding: '16px 20px',
											minHeight: '56px'
										}"
										:focus-style="{
											borderColor: '#3b82f6',
											boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
										}"
									/>
								</view>

								<!-- 商品ID -->
								<view class="mb-6">
									<label class="flex items-center text-lg font-medium text-gray-700 mb-3">
										<i class="fas fa-barcode text-green-500 mr-3 text-xl"></i>
										商品ID
									</label>
									<view class="relative">
										<uni-easyinput 
											v-model="orderForm.productId"
											placeholder="请输入携程商品ID或系统内部商品ID"
											:clearable="true"
											:inputBorder="true"
											:styles="{
												color: '#1f2937',
												backgroundColor: '#ffffff',
												borderColor: '#d1d5db',
												borderRadius: '12px',
												fontSize: '18px',
												fontFamily: 'Microsoft YaHei, sans-serif',
												padding: '16px 60px 16px 20px',
												minHeight: '56px'
											}"
											:focus-style="{
												borderColor: '#10b981',
												boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
											}"
										/>
										<button 
											@click="searchProduct"
											:disabled="!orderForm.productId.trim() || searchingProduct"
											class="absolute right-3 top-1/2 transform -translate-y-1/2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
										>
											<i v-if="!searchingProduct" class="fas fa-search"></i>
											<i v-else class="fas fa-spinner fa-spin"></i>
										</button>
									</view>
									<text v-if="productInfo" class="text-sm text-green-600 mt-2 block">
										<i class="fas fa-check-circle mr-1"></i>
										已找到商品：{{ productInfo.title }}
									</text>
								</view>

								<!-- 商品价格 -->
								<view v-if="productInfo" class="mb-6">
									<label class="flex items-center text-lg font-medium text-gray-700 mb-3">
										<i class="fas fa-yen-sign text-red-500 mr-3 text-xl"></i>
										商品价格
									</label>
									<uni-easyinput 
										v-model="productInfo.price"
										placeholder="请输入商品价格"
										type="number"
										:clearable="false"
										:inputBorder="true"
										:styles="{
											color: '#dc2626',
											backgroundColor: '#ffffff',
											borderColor: '#d1d5db',
											borderRadius: '12px',
											fontSize: '18px',
											fontFamily: 'Microsoft YaHei, sans-serif',
											padding: '16px 20px',
											minHeight: '56px',
											fontWeight: 'bold'
										}"
										:focus-style="{
											borderColor: '#dc2626',
											boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.1)'
										}"
									/>
									<text class="text-sm text-gray-500 mt-2 block">
										<i class="fas fa-info-circle mr-1"></i>
										可以手动调整价格，确保订单金额正确
									</text>
								</view>

								<!-- 出发时间 -->
								<view class="mb-6">
									<label class="flex items-center text-lg font-medium text-gray-700 mb-3">
										<i class="fas fa-calendar-alt text-purple-500 mr-3 text-xl"></i>
										出发时间
									</label>
									<uni-datetime-picker 
										v-model="orderForm.departureDate"
										type="date"
										:clear-icon="false"
										:start="minDate"
										:end="maxDate"
										@change="handleDateChange"
									>
										<template v-slot:default="{ value }">
											<uni-easyinput 
												:value="orderForm.departureDate || ''"
												placeholder="请选择出发时间"
												:inputBorder="true"
												readonly
												:styles="{
													color: '#1f2937',
													backgroundColor: '#ffffff',
													borderColor: '#d1d5db',
													borderRadius: '12px',
													fontSize: '18px',
													fontFamily: 'Microsoft YaHei, sans-serif',
													padding: '16px 20px',
													minHeight: '56px'
												}"
												:focus-style="{
													borderColor: '#8b5cf6',
													boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)'
												}"
											/>
										</template>
									</uni-datetime-picker>
								</view>

								<!-- 备注信息 -->
								<view class="mb-6">
									<label class="flex items-center text-lg font-medium text-gray-700 mb-3">
										<i class="fas fa-sticky-note text-orange-500 mr-3 text-xl"></i>
										备注信息
									</label>
									<uni-easyinput 
										v-model="orderForm.remarks"
										placeholder="请输入订单备注信息（可选）"
										type="textarea"
										:autoHeight="true"
										:clearable="true"
										:inputBorder="true"
										:styles="{
											color: '#1f2937',
											backgroundColor: '#ffffff',
											borderColor: '#d1d5db',
											borderRadius: '12px',
											fontSize: '18px',
											fontFamily: 'Microsoft YaHei, sans-serif',
											padding: '16px 20px',
											minHeight: '100px'
										}"
										:focus-style="{
											borderColor: '#f59e0b',
											boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.1)'
										}"
									/>
								</view>

								<!-- 提交按钮 -->
								<button 
									@click="createOrder"
									:disabled="!canSubmit || creatingOrder"
									class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-xl font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg"
								>
									<i v-if="!creatingOrder" class="fas fa-plus-circle mr-3"></i>
									<i v-else class="fas fa-spinner fa-spin mr-3"></i>
									{{ creatingOrder ? '创建中...' : '立即创建订单' }}
								</button>
							</view>
						</view>

						<!-- 右侧：订单预览和统计 -->
						<view class="space-y-6">
	<view>
								<text class="block text-xl font-semibold text-gray-800 mb-4">订单预览</text>
								
								<view class="bg-gray-50 rounded-xl p-6 border border-gray-200">
									<view v-if="productInfo" class="space-y-4">
										<view class="flex items-start space-x-4">
											<img 
												v-if="productInfo.image" 
												:src="productInfo.image" 
												class="w-20 h-20 rounded-lg object-cover border border-gray-200"
											/>
											<view class="flex-1">
												<text class="text-lg font-semibold text-gray-900 block mb-2">{{ productInfo.title }}</text>
												<text class="text-red-600 text-xl font-bold">￥{{ productInfo.price }}</text>
											</view>
										</view>
										
										<view class="border-t border-gray-200 pt-4 space-y-2">
											<view class="flex justify-between">
												<text class="text-gray-600">客户手机：</text>
												<text class="font-medium">{{ orderForm.customerPhone || '未填写' }}</text>
											</view>
											<view class="flex justify-between">
												<text class="text-gray-600">出发时间：</text>
												<text class="font-medium">{{ orderForm.departureDate || '未选择' }}</text>
											</view>
											<view class="flex justify-between">
												<text class="text-gray-600">商品ID：</text>
												<text class="font-medium text-sm">{{ orderForm.productId || '未填写' }}</text>
											</view>
										</view>
									</view>
									
									<view v-else class="text-center py-8">
										<i class="fas fa-search text-gray-300 text-4xl mb-4"></i>
										<text class="text-gray-500 text-lg">请先搜索商品信息</text>
									</view>
								</view>
							</view>

							<!-- 今日统计 -->
							<view class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
								<text class="text-lg font-semibold text-gray-800 mb-4 block">今日统计</text>
								<view class="grid grid-cols-2 gap-4">
									<view class="text-center">
										<text class="text-3xl font-bold text-green-600 block">{{ todayOrderCount }}</text>
										<text class="text-gray-600 text-sm">代下单数</text>
									</view>
									<view class="text-center">
										<text class="text-3xl font-bold text-blue-600 block">{{ todayRevenue }}</text>
										<text class="text-gray-600 text-sm">总金额</text>
									</view>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 订单历史记录 -->
			<view class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
				<view class="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
					<view class="flex items-center justify-between">
						<view class="flex items-center">
							<i class="fas fa-history text-white text-2xl mr-4"></i>
							<text class="text-2xl font-bold text-white">代下单历史</text>
						</view>
						<view class="flex items-center space-x-4">
							<button 
								@click="refreshOrderList"
								:disabled="loadingOrders"
								class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-2 rounded-lg transition-colors font-medium"
							>
								<i :class="loadingOrders ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'" class="mr-2"></i>
								刷新
							</button>
						</view>
					</view>
				</view>

				<!-- 搜索和筛选 -->
				<view class="bg-gray-50 px-8 py-4 border-b border-gray-200">
					<view class="flex flex-wrap items-center gap-4">
						<view class="flex-1 min-w-64">
							<uni-easyinput 
								v-model="searchKeyword"
								placeholder="搜索手机号、商品ID、订单号..."
								:clearable="true"
								:inputBorder="true"
								:styles="{
									backgroundColor: '#ffffff',
									borderColor: '#d1d5db',
									borderRadius: '8px',
									fontSize: '16px',
									padding: '12px 16px'
								}"
							/>
						</view>
						<select 
							v-model="statusFilter"
							class="px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium"
						>
							<option value="">全部状态</option>
							<option value="paid">已支付</option>
							<option value="pending">待支付</option>
						</select>
						<button 
							@click="searchOrders"
							class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
						>
							<i class="fas fa-search mr-2"></i>
							搜索
						</button>
					</view>
				</view>

				<!-- 订单列表表格 -->
				<view class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-4 text-left text-lg font-semibold text-gray-700 border-b">订单号</th>
								<th class="px-6 py-4 text-left text-lg font-semibold text-gray-700 border-b">客户手机</th>
								<th class="px-6 py-4 text-left text-lg font-semibold text-gray-700 border-b">商品信息</th>
								<th class="px-6 py-4 text-left text-lg font-semibold text-gray-700 border-b">出发时间</th>
								<th class="px-6 py-4 text-left text-lg font-semibold text-gray-700 border-b">订单金额</th>
								<th class="px-6 py-4 text-left text-lg font-semibold text-gray-700 border-b">状态</th>
								<th class="px-6 py-4 text-left text-lg font-semibold text-gray-700 border-b">创建时间</th>
								<th class="px-6 py-4 text-left text-lg font-semibold text-gray-700 border-b">操作</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="(order, index) in filteredOrders" :key="order.id" 
									class="hover:bg-gray-50 transition-colors border-b border-gray-200">
								<td class="px-6 py-4">
									<text class="font-medium text-gray-900 text-lg">{{ order.orderNo }}</text>
								</td>
								<td class="px-6 py-4">
									<text class="text-gray-700 text-lg">{{ order.customerPhone }}</text>
								</td>
								<td class="px-6 py-4">
									<view class="max-w-48">
										<text class="text-gray-900 font-medium block text-lg truncate">{{ order.productTitle }}</text>
										<text class="text-gray-500 text-sm">ID: {{ order.productId }}</text>
									</view>
								</td>
								<td class="px-6 py-4">
									<text class="text-gray-700 text-lg">{{ formatDate(order.departureDate) }}</text>
								</td>
								<td class="px-6 py-4">
									<text class="text-red-600 font-bold text-lg">￥{{ order.amount }}</text>
								</td>
								<td class="px-6 py-4">
									<span :class="getStatusClass(order.status)" 
											class="px-3 py-1 rounded-full text-sm font-medium">
										{{ getStatusText(order.status) }}
									</span>
								</td>
								<td class="px-6 py-4">
									<text class="text-gray-600 text-lg">{{ formatDateTime(order.created_at) }}</text>
								</td>
								<td class="px-6 py-4">
									<view class="flex space-x-2">
										<button 
											@click="viewOrder(order)"
											class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
										>
											<i class="fas fa-eye mr-1"></i>
											查看
										</button>
									</view>
								</td>
							</tr>
						</tbody>
					</table>
					
					<!-- 空状态 -->
					<view v-if="filteredOrders.length === 0 && !loadingOrders" 
							class="text-center py-16">
						<i class="fas fa-inbox text-gray-300 text-6xl mb-4"></i>
						<text class="text-gray-500 text-xl block mb-2">暂无代下单记录</text>
						<text class="text-gray-400">创建第一个代下单开始使用吧</text>
					</view>
					
					<!-- 加载状态 -->
					<view v-if="loadingOrders" class="text-center py-16">
						<i class="fas fa-spinner fa-spin text-blue-500 text-4xl mb-4"></i>
						<text class="text-gray-600 text-lg">加载中...</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
			// 订单表单数据
			orderForm: {
				customerPhone: '',
				productId: '',
				departureDate: '',
				remarks: ''
			},
			
			// 商品信息
			productInfo: null,
			searchingProduct: false,
			
			// 订单创建状态
			creatingOrder: false,
			
			// 订单列表数据
			orderList: [],
			loadingOrders: false,
			
			// 搜索和筛选
			searchKeyword: '',
			statusFilter: '',
			
			// 统计数据
			todayOrderCount: 0,
			todayRevenue: 0,
			
			// 日期范围
			minDate: this.formatDate(new Date()),
			maxDate: this.formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))
		}
	},
	
	computed: {
		// 是否可以提交
		canSubmit() {
			return this.orderForm.customerPhone.trim() && 
				   this.orderForm.productId.trim() && 
				   this.orderForm.departureDate &&
				   this.productInfo
		},
		
		// 过滤后的订单列表
		filteredOrders() {
			// 现在订单列表直接从云函数获取，已包含搜索和筛选
			return this.orderList
		}
	},
	
	onLoad() {
		// 延迟加载，确保页面初始化完成
		this.$nextTick(() => {
			this.loadOrderList()
			this.loadTodayStatistics()
		})
	},
	
	methods: {
		// 搜索商品
		async searchProduct() {
			if (!this.orderForm.productId.trim()) {
				uni.showToast({
					title: '请输入商品ID',
					icon: 'none'
				})
				return
			}
			
			this.searchingProduct = true
			
			try {
				// 调用云函数搜索商品
				const result = await uniCloud.callFunction({
					name: 'a-proxy-order-service',
					data: {
						action: 'searchProduct',
						productId: this.orderForm.productId
					}
				})
				
				if (result.result.errCode === 0) {
					this.productInfo = result.result.data
					
					uni.showToast({
						title: '商品信息获取成功',
						icon: 'success'
					})
				} else {
					uni.showToast({
						title: result.result.errMsg || '获取商品信息失败',
						icon: 'none'
					})
				}
				
			} catch (error) {
				uni.showToast({
					title: '获取商品信息失败',
					icon: 'none'
				})
				console.error('搜索商品失败:', error)
			} finally {
				this.searchingProduct = false
			}
		},
		
		// 创建订单
		async createOrder() {
			if (!this.canSubmit) {
				uni.showToast({
					title: '请完善订单信息',
					icon: 'none'
				})
				return
			}
			
			this.creatingOrder = true
			
			try {
				// 获取登录token
				const token = uni.getStorageSync('uni_id_token')
				if (!token) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				// 调用云函数创建订单
				const result = await uniCloud.callFunction({
					name: 'a-proxy-order-service',
					data: {
						action: 'createProxyOrder',
						uniIdToken: token,
						customerPhone: this.orderForm.customerPhone,
						productId: this.orderForm.productId,
						departureDate: this.orderForm.departureDate,
						remarks: this.orderForm.remarks,
						quantity: 1
					}
				})
				
				if (result.result.errCode === 0) {
					uni.showToast({
						title: '订单创建成功',
						icon: 'success'
					})
					
					// 重置表单
					this.resetForm()
					
					// 刷新订单列表和统计
					this.loadOrderList()
					this.loadTodayStatistics()
				} else {
					uni.showToast({
						title: result.result.errMsg || '订单创建失败',
						icon: 'none'
					})
				}
				
			} catch (error) {
				uni.showToast({
					title: '订单创建失败',
					icon: 'none'
				})
				console.error('创建订单失败:', error)
			} finally {
				this.creatingOrder = false
			}
		},
		
		// 重置表单
		resetForm() {
			this.orderForm = {
				customerPhone: '',
				productId: '',
				departureDate: '',
				remarks: ''
			}
			this.productInfo = null
		},
		
		// 加载订单列表
		async loadOrderList() {
			this.loadingOrders = true
			
			try {
				// 获取登录token
				const token = uni.getStorageSync('uni_id_token')
				if (!token) {
					console.warn('未登录，跳过加载订单列表')
					return
				}
				
				// 调用云函数获取订单列表
				const result = await uniCloud.callFunction({
					name: 'a-proxy-order-service',
					data: {
						action: 'getProxyOrderList',
						uniIdToken: token,
						page: 1,
						limit: 50,
						status: this.statusFilter,
						keyword: this.searchKeyword
					}
				})
				
				if (result.result.errCode === 0) {
					this.orderList = result.result.data.list || []
				} else {
					console.error('加载订单列表失败:', result.result.errMsg)
				}
				
			} catch (error) {
				console.error('加载订单列表失败:', error)
			} finally {
				this.loadingOrders = false
			}
		},
		
		// 加载今日统计
		async loadTodayStatistics() {
			try {
				// 获取登录token
				const token = uni.getStorageSync('uni_id_token')
				if (!token) {
					console.warn('未登录，跳过加载统计数据')
					return
				}
				
				// 调用云函数获取今日统计
				const result = await uniCloud.callFunction({
					name: 'a-proxy-order-service',
					data: {
						action: 'getTodayStatistics',
						uniIdToken: token
					}
				})
				
				if (result.result.errCode === 0) {
					const stats = result.result.data
					this.todayOrderCount = stats.todayOrderCount || 0
					this.todayRevenue = stats.todayRevenue || 0
				} else {
					console.error('加载统计数据失败:', result.result.errMsg)
				}
				
			} catch (error) {
				console.error('加载统计数据失败:', error)
			}
		},
		
		// 刷新订单列表
		refreshOrderList() {
			this.loadOrderList()
			this.loadTodayStatistics()
		},
		
		// 搜索订单
		searchOrders() {
			// 重新加载订单列表，会自动应用搜索条件
			this.loadOrderList()
		},
		
		// 查看订单详情
		viewOrder(order) {
			// TODO: 打开订单详情弹窗或跳转页面
			console.log('查看订单:', order)
		},
		
		// 重试订单
		async retryOrder(order) {
			try {
				// 获取登录token
				const token = uni.getStorageSync('uni_id_token')
				if (!token) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				// 调用云函数重试订单
				const result = await uniCloud.callFunction({
					name: 'a-proxy-order-service',
					data: {
						action: 'retryProxyOrder',
						uniIdToken: token,
						orderId: order._id
					}
				})
				
				if (result.result.errCode === 0) {
					uni.showToast({
						title: '重试成功',
						icon: 'success'
					})
					
					this.loadOrderList()
				} else {
					uni.showToast({
						title: result.result.errMsg || '重试失败',
						icon: 'none'
					})
				}
				
			} catch (error) {
				uni.showToast({
					title: '重试失败',
					icon: 'none'
				})
				console.error('重试订单失败:', error)
			}
		},
		
		// 获取状态样式
		getStatusClass(status) {
			const statusMap = {
				'paid': 'bg-green-100 text-green-800',
				'pending': 'bg-yellow-100 text-yellow-800'
			}
			return statusMap[status] || 'bg-gray-100 text-gray-800'
		},
		
		// 获取状态文本
		getStatusText(status) {
			const statusMap = {
				'paid': '已支付',
				'pending': '待支付'
			}
			return statusMap[status] || '未知'
		},
		
		// 格式化日期
		formatDate(date) {
			if (!date) return ''
			const d = new Date(date)
			return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
		},
		
		// 格式化日期时间
		formatDateTime(date) {
			if (!date) return ''
			const d = new Date(date)
			return `${this.formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
		},
		
		// 处理日期变化
		handleDateChange(event) {
			this.orderForm.departureDate = event
		}
		}
	}
</script>

<style>
/* 微软雅黑字体 */
.font-microsoft {
	font-family: "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
}

/* 表格样式优化 */
table {
	border-collapse: collapse;
}

/* 滚动条样式 */
::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

::-webkit-scrollbar-track {
	background: #f1f1f1;
	border-radius: 4px;
}

::-webkit-scrollbar-thumb {
	background: #c1c1c1;
	border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
	background: #a8a8a8;
}

/* 按钮禁用状态 */
button:disabled {
	cursor: not-allowed;
}

/* 输入框聚焦动画 */
.uni-easyinput__content-input:focus {
	transition: all 0.2s ease-in-out;
}

/* 表格行悬停效果 */
tr:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 卡片悬停效果 */
.bg-white:hover {
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
	transition: box-shadow 0.3s ease;
}
</style>
