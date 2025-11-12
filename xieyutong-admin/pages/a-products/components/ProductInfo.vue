<template>
	<view class="bg-white rounded-xl shadow-lg overflow-hidden">
		<!-- 组件标题 -->
		<view class="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
			<view class="flex items-center">
				<i class="fas fa-box text-white text-2xl mr-4"></i>
				<text class="text-2xl font-bold text-white">商品基本信息</text>
			</view>
		</view>

		<!-- 表格容器 -->
		<view class="table-responsive">
			<table class="min-w-full divide-y divide-gray-200">
				<tbody class="bg-white divide-y divide-gray-200">
					<!-- 携程商品ID -->
					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50 w-48">
							<i class="fas fa-fingerprint text-blue-500 mr-3"></i>
							携程商品ID
						</td>
						<td class="px-8 py-6">
							<uni-easyinput v-model="localData.ctrip_id" @input="handleUserInput" :styles="inputStyles" placeholder="请输入携程商品ID" :clearable="true" />
						</td>
					</tr>

					<!-- 商品标题 -->
					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-heading text-blue-500 mr-3"></i>
							商品标题
						</td>
						<td class="px-8 py-6">
							<uni-easyinput v-model="localData.title" @change="handleUserInput" :styles="inputStyles" placeholder="请输入商品标题" :clearable="true" />
						</td>
					</tr>

					<!-- 商品副标题 -->
					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-text-width text-blue-500 mr-3"></i>
							商品副标题
						</td>
						<td class="px-8 py-6">
							<uni-easyinput
								v-model="localData.subtitle"
								@change="handleUserInput"
								:styles="textareaStyles"
								type="textarea"
								:autoHeight="true"
								placeholder="请输入商品副标题"
								:clearable="true" />
						</td>
					</tr>

					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-map-signs text-blue-500 mr-3"></i>
							路线标题
						</td>
						<td class="px-8 py-6">
							<uni-easyinput v-model="localData.route_title" @change="handleUserInput" :styles="inputStyles" placeholder="请输入路线标题" :clearable="true" />
						</td>
					</tr>

					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-clipboard-list text-blue-500 mr-3"></i>
							路线概览
						</td>
						<td class="px-8 py-6">
							<view class="space-y-4">
								<view class="flex items-center">
									<label class="flex-shrink-0 w-28 flex items-center text-gray-600">
										<i class="fas fa-car w-6 text-center mr-1 text-gray-500"></i>
										行
									</label>
									<uni-easyinput v-model="localData.route_overview.transport" @change="handleUserInput" :styles="flexInputStyles" placeholder="例如：专车接送" :clearable="true" />
								</view>
								<view class="flex items-center">
									<label class="flex-shrink-0 w-28 flex items-center text-gray-600">
										<i class="fas fa-hotel w-6 text-center mr-1 text-gray-500"></i>
										住
									</label>
									<uni-easyinput
										v-model="localData.route_overview.accommodation"
										@change="handleUserInput"
										:styles="flexInputStyles"
										placeholder="例如：全程5星酒店"
										:clearable="true" />
								</view>
								<view class="flex items-center">
									<label class="flex-shrink-0 w-28 flex items-center text-gray-600">
										<i class="fas fa-camera-retro w-6 text-center mr-1 text-gray-500"></i>
										游
									</label>
									<uni-easyinput v-model="localData.route_overview.spots" @change="handleUserInput" :styles="flexInputStyles" placeholder="例如：5大核心景点" :clearable="true" />
								</view>
								<view class="flex items-center">
									<label class="flex-shrink-0 w-28 flex items-center text-gray-600">
										<i class="fas fa-utensils w-6 text-center mr-1 text-gray-500"></i>
										餐
									</label>
									<uni-easyinput v-model="localData.route_overview.meals" @change="handleUserInput" :styles="flexInputStyles" placeholder="例如：包含3顿特色餐" :clearable="true" />
								</view>
								<view class="flex items-center">
									<label class="flex-shrink-0 w-28 flex items-center text-gray-600">
										<i class="fas fa-hiking w-6 text-center mr-1 text-gray-500"></i>
										活
									</label>
									<uni-easyinput v-model="localData.route_overview.activities" @change="handleUserInput" :styles="flexInputStyles" placeholder="例如：篝火晚会" :clearable="true" />
								</view>
							</view>
						</td>
					</tr>

					<!-- 商品图片 -->
					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-images text-purple-500 mr-3"></i>
							商品图片
							<text class="block text-xs text-gray-500 mt-1">主要展示图片</text>
						</td>
						<td class="px-8 py-6">
							<view class="space-y-4">
								<!-- 图片网格展示（包含上传按钮） -->
								<view class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
									<!-- 已上传的图片（可拖拽排序） -->
									<view
										v-for="(image, index) in localData.product_images"
										:key="index"
										class="relative group"
										:draggable="true"
										:data-index="index"
										@dragstart="onDragStart($event, index, 'product')"
										@dragover="onDragOver($event)"
										@drop="onDrop($event, index, 'product')"
										@dragend="onDragEnd"
										@click="previewImage(image, localData.product_images)"
										:class="{ 'scale-105 shadow-lg': draggingIndex === index && draggingType === 'product' }">
										<image
											:src="image"
											mode="aspectFill"
											class="w-18 h-18 rounded-lg object-cover border border-gray-200 hover:border-purple-400 transition-all duration-200 cursor-move" />

										<!-- 拖拽指示器 -->
										<view class="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
											<i class="fas fa-grip-vertical text-white text-xs bg-black bg-opacity-50 rounded px-1"></i>
										</view>

										<!-- 删除按钮 -->
										<button
											@click="removeProductImage(index)"
											class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">
											<i class="fas fa-times text-xs"></i>
										</button>

										<!-- 拖拽放置目标指示器 -->
										<view
											v-if="isDragOver && dropTargetIndex === index && draggingType === 'product'"
											class="absolute inset-0 border-2 border-dashed border-purple-500 bg-purple-50 bg-opacity-50 rounded-lg flex items-center justify-center">
											<i class="fas fa-arrow-down text-purple-500 text-lg"></i>
										</view>
									</view>

									<!-- 上传按钮 -->
									<view class="relative">
										<uni-file-picker
											@select="onProductImagesChange"
											@success="onProductImagesSuccess"
											@fail="onProductImagesFail"
											@input="onProductImagesInput"
											@progress="onProductImagesProgress"
											:limit="20"
											:del-icon="false"
											:auto-upload="true"
											file-mediatype="image"
											mode="list"
											:disabled="false"
											return-type="tempFilePaths">
											<view
												class="flex items-center justify-center w-18 h-18 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer"
												@click="onProductUploadClick">
												<view class="text-center">
													<i class="fas fa-plus text-base text-gray-400"></i>
													<text class="block text-xs text-gray-500 mt-0.5">上传</text>
												</view>
											</view>
										</uni-file-picker>
									</view>
								</view>

								<!-- 图片数量提示和操作说明 -->
								<view class="text-sm text-gray-500 space-y-2">
									<view class="flex items-center">
										<i class="fas fa-info-circle mr-2"></i>
										已上传 {{ (localData.product_images || []).length }} 张图片，最多支持20张
									</view>
									<view class="flex items-center text-xs">
										<i class="fas fa-grip-vertical mr-2"></i>
										可拖拽图片调整展示顺序，第一张为主图
									</view>
								</view>

								<!-- 手动输入URL -->
								<view class="border-t border-gray-200 pt-4">
									<view class="flex items-center space-x-3 mb-2">
										<uni-easyinput v-model="newProductImageUrl" :styles="flexInputStyles" placeholder="或直接输入图片URL地址" :clearable="true" />
										<button @click="addProductImageUrl" class="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
											<i class="fas fa-plus mr-1"></i>
											添加
										</button>
									</view>
								</view>
							</view>
						</td>
					</tr>

					<!-- 商品详情图 -->
					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-file-image text-indigo-500 mr-3"></i>
							商品详情图
							<text class="block text-xs text-gray-500 mt-1">详情页展示图片</text>
						</td>
						<td class="px-8 py-6">
							<view class="space-y-4">
								<!-- 图片网格展示（包含上传按钮） -->
								<view class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
									<!-- 已上传的图片（可拖拽排序） -->
									<view
										v-for="(image, index) in localData.detail_images"
										:key="index"
										class="relative group"
										:draggable="true"
										:data-index="index"
										@dragstart="onDragStart($event, index, 'detail')"
										@dragover="onDragOver($event)"
										@drop="onDrop($event, index, 'detail')"
										@dragend="onDragEnd"
										@click="previewImage(image, localData.detail_images)"
										:class="{ 'scale-105 shadow-lg': draggingIndex === index && draggingType === 'detail' }">
										<image
											:src="image"
											mode="aspectFill"
											class="w-18 h-18 rounded-lg object-cover border border-gray-200 hover:border-indigo-400 transition-all duration-200 cursor-move" />

										<!-- 拖拽指示器 -->
										<view class="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
											<i class="fas fa-grip-vertical text-white text-xs bg-black bg-opacity-50 rounded px-1"></i>
										</view>

										<!-- 删除按钮 -->
										<button
											@click="removeDetailImage(index)"
											class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">
											<i class="fas fa-times text-xs"></i>
										</button>

										<!-- 拖拽放置目标指示器 -->
										<view
											v-if="isDragOver && dropTargetIndex === index && draggingType === 'detail'"
											class="absolute inset-0 border-2 border-dashed border-indigo-500 bg-indigo-50 bg-opacity-50 rounded-lg flex items-center justify-center">
											<i class="fas fa-arrow-down text-indigo-500 text-lg"></i>
										</view>
									</view>

									<!-- 上传按钮 -->
									<view class="relative">
										<uni-file-picker
											@select="onDetailImagesChange"
											@success="onDetailImagesSuccess"
											@fail="onDetailImagesFail"
											@input="onDetailImagesInput"
											@progress="onDetailImagesProgress"
											:limit="50"
											:del-icon="false"
											:auto-upload="true"
											file-mediatype="image"
											mode="list"
											:disabled="false"
											return-type="tempFilePaths">
											<view
												class="flex items-center justify-center w-18 h-18 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer"
												@click="onDetailUploadClick">
												<view class="text-center">
													<i class="fas fa-plus text-base text-gray-400"></i>
													<text class="block text-xs text-gray-500 mt-0.5">上传</text>
												</view>
											</view>
										</uni-file-picker>
									</view>
								</view>

								<!-- 图片数量提示和操作说明 -->
								<view class="text-sm text-gray-500 space-y-2">
									<view class="flex items-center">
										<i class="fas fa-info-circle mr-2"></i>
										已上传 {{ (localData.detail_images || []).length }} 张图片，最多支持50张
									</view>
									<view class="flex items-center text-xs">
										<i class="fas fa-grip-vertical mr-2"></i>
										可拖拽图片调整展示顺序
									</view>
								</view>

								<!-- 手动输入URL -->
								<view class="border-t border-gray-200 pt-4">
									<view class="flex items-center space-x-3 mb-2">
										<uni-easyinput v-model="newDetailImageUrl" :styles="flexInputStyles" placeholder="或直接输入图片URL地址" :clearable="true" />
										<button @click="addDetailImageUrl" class="px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
											<i class="fas fa-plus mr-1"></i>
											添加
										</button>
									</view>
								</view>
							</view>
						</td>
					</tr>

					<!-- 行程天数 -->
					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-calendar-days text-blue-500 mr-3"></i>
							行程天数
						</td>
						<td class="px-8 py-6">
							<view class="flex items-center space-x-3">
								<uni-easyinput v-model="localData.duration_days" @change="handleUserInput" type="number" :styles="smallInputStyles" placeholder="1" :clearable="true" />
								<text class="text-lg text-gray-600">天</text>
								<view class="text-sm text-gray-500">
									<i class="fas fa-info-circle mr-1"></i>
									旅游产品的总游玩天数
								</view>
							</view>
						</td>
					</tr>

					<!-- 价格信息 -->
					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-money-bill-wave text-green-500 mr-3"></i>
							价格信息
						</td>
						<td class="px-8 py-6">
							<view class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">成人价格（元）</label>
									<uni-easyinput v-model="localData.price" @change="handleUserInput" type="number" :styles="inputStyles" placeholder="0.00" :clearable="true" />
								</view>
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">儿童价格（元）</label>
									<uni-easyinput v-model="localData.child_price" @change="handleUserInput" type="number" :styles="inputStyles" placeholder="0.00" :clearable="true" />
								</view>
							</view>
						</td>
					</tr>

					<!-- 评分 -->
					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-star text-yellow-500 mr-3"></i>
							产品评分
						</td>
						<td class="px-8 py-6">
							<view class="flex items-center space-x-4">
								<uni-easyinput v-model="localData.rating" @change="handleUserInput" type="number" :styles="smallInputStyles" :clearable="true" />
								<view class="flex items-center">
									<!-- <i v-for="i in 5" :key="i" 
                     :class="i <= Math.floor(localData.rating) ? 'fas fa-star text-yellow-400' : 'far fa-star text-gray-300'"
                     class="text-xl"></i> -->
									<view class="star-rating-container text-xl">
										<view class="stars-background text-gray-300">
											<text class="fas fa-star"></text>
											<text class="fas fa-star"></text>
											<text class="fas fa-star"></text>
											<text class="fas fa-star"></text>
											<text class="fas fa-star"></text>
										</view>
										<view class="stars-foreground text-yellow-400" :style="{ width: ((localData.rating || 0) / 5) * 100 + '%' }">
											<text class="fas fa-star"></text>
											<text class="fas fa-star"></text>
											<text class="fas fa-star"></text>
											<text class="fas fa-star"></text>
											<text class="fas fa-star"></text>
										</view>
									</view>
									<text class="ml-2 text-gray-600 text-lg">{{ localData.rating }}/5.0</text>
								</view>
							</view>
						</td>
					</tr>

					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-thumbs-up text-blue-500 mr-3"></i>
							好评率
						</td>
						<td class="px-8 py-6">
							<view class="flex items-center space-x-3">
								<uni-easyinput v-model.number="localData.good_rate" @change="handleUserInput" type="number" :styles="smallInputStyles" placeholder="98.5" :clearable="true" />
								<text class="text-lg text-gray-600">%</text>
								<view class="text-sm text-gray-500">
									<i class="fas fa-info-circle mr-1"></i>
									请输入 0-100 之间的数值
								</view>
							</view>
						</td>
					</tr>

					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-star-half-alt text-blue-500 mr-3"></i>
							评分明细
						</td>
						<td class="px-8 py-6">
							<view class="grid grid-cols-1 md:grid-cols-3 gap-6">
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										<i class="fas fa-route w-6 text-center mr-2 text-gray-500"></i>
										行程安排
									</label>
									<uni-easyinput
										v-model.number="localData.rating_spec.itinerary"
										@change="handleUserInput"
										type="number"
										:styles="inputStyles"
										placeholder="例如：4.8"
										:clearable="true" />
								</view>
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										<i class="fas fa-bed w-6 text-center mr-2 text-gray-500"></i>
										酒店体验
									</label>
									<uni-easyinput
										v-model.number="localData.rating_spec.accommodation"
										@change="handleUserInput"
										type="number"
										:styles="inputStyles"
										placeholder="例如：4.7"
										:clearable="true" />
								</view>
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										<i class="fas fa-user-tie w-6 text-center mr-2 text-gray-500"></i>
										司导服务
									</label>
									<uni-easyinput
										v-model.number="localData.rating_spec.service"
										@change="handleUserInput"
										type="number"
										:styles="inputStyles"
										placeholder="例如：4.9"
										:clearable="true" />
								</view>
							</view>
						</td>
					</tr>

					<!-- 商品状态 -->
					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-toggle-on text-green-500 mr-3"></i>
							商品状态
						</td>
						<td class="px-8 py-6">
							<select
								v-model.number="localData.status"
								@change="handleUserInput"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg bg-white">
								<option value="0">下架</option>
								<option value="1">上架</option>
							</select>
						</td>
					</tr>

					<!-- 统计信息 -->
					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-chart-bar text-purple-500 mr-3"></i>
							统计信息
						</td>
						<td class="px-8 py-6">
							<view class="grid grid-cols-1 md:grid-cols-3 gap-6">
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">浏览次数</label>
									<uni-easyinput v-model="localData.view_count" @change="handleUserInput" type="number" :styles="inputStyles" :clearable="true" />
								</view>
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">销售数量</label>
									<uni-easyinput v-model="localData.sales_count" @change="handleUserInput" type="number" :styles="inputStyles" :clearable="true" />
								</view>
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">评价数量</label>
									<uni-easyinput v-model="localData.review_count" @change="handleUserInput" type="number" :styles="inputStyles" :clearable="true" />
								</view>
							</view>
						</td>
					</tr>

					<!-- 排序权重 -->
					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-sort-numeric-up text-indigo-500 mr-3"></i>
							排序权重
						</td>
						<td class="px-8 py-6">
							<uni-easyinput v-model="localData.sort_order" @change="handleUserInput" type="number" :styles="inputStyles" placeholder="数值越大排序越靠前" :clearable="true" />
						</td>
					</tr>

					<!-- 商品概览 -->
					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-eye text-cyan-500 mr-3"></i>
							商品概览
						</td>
						<td class="px-8 py-6">
							<view class="space-y-4">
								<!-- 导游信息 -->
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										<i class="fas fa-user-tie text-blue-500 mr-2"></i>
										导游信息
									</label>
									<uni-easyinput
										v-model="localData.overview.guide"
										@change="handleUserInput"
										type="textarea"
										:styles="textareaStyles"
										:autoHeight="true"
										placeholder="请输入导游服务信息"
										:clearable="true" />
								</view>

								<!-- 交通信息 -->
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										<i class="fas fa-car text-green-500 mr-2"></i>
										交通信息
									</label>
									<uni-easyinput
										v-model="localData.overview.transport"
										@change="handleUserInput"
										type="textarea"
										:styles="textareaStyles"
										:autoHeight="true"
										placeholder="请输入交通安排信息"
										:clearable="true" />
								</view>

								<!-- 活动信息 -->
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										<i class="fas fa-hiking text-orange-500 mr-2"></i>
										活动信息
									</label>
									<uni-easyinput
										v-model="localData.overview.activities"
										@change="handleUserInput"
										type="textarea"
										:styles="textareaStyles"
										:autoHeight="true"
										placeholder="请输入景点活动信息"
										:clearable="true" />
								</view>

								<!-- 住宿信息 -->
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										<i class="fas fa-bed text-purple-500 mr-2"></i>
										住宿信息
									</label>
									<uni-easyinput
										v-model="localData.overview.accommodation"
										@change="handleUserInput"
										type="textarea"
										:styles="textareaStyles"
										:autoHeight="true"
										placeholder="请输入住宿安排信息"
										:clearable="true" />
								</view>

								<!-- 餐食信息 -->
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										<i class="fas fa-utensils text-red-500 mr-2"></i>
										餐食信息
									</label>
									<uni-easyinput
										v-model="localData.overview.meals"
										@change="handleUserInput"
										type="textarea"
										:styles="textareaStyles"
										:autoHeight="true"
										placeholder="请输入餐食安排信息"
										:clearable="true" />
								</view>
							</view>
						</td>
					</tr>

					<!-- 费用说明 -->
					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-calculator text-orange-500 mr-3"></i>
							费用说明
						</td>
						<td class="px-8 py-6">
							<view class="space-y-4">
								<!-- 交通费用 -->
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										<i class="fas fa-car text-blue-500 mr-2"></i>
										交通费用
									</label>
									<uni-easyinput
										v-model="localData.cost_info.transport"
										@change="handleUserInput"
										type="textarea"
										:styles="textareaStyles"
										:autoHeight="true"
										placeholder="请输入交通费用说明"
										:clearable="true" />
								</view>

								<!-- 住宿费用 -->
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										<i class="fas fa-bed text-purple-500 mr-2"></i>
										住宿费用
									</label>
									<uni-easyinput
										v-model="localData.cost_info.accommodation"
										@change="handleUserInput"
										type="textarea"
										:styles="textareaStyles"
										:autoHeight="true"
										placeholder="请输入住宿费用说明"
										:clearable="true" />
								</view>

								<!-- 餐食费用 -->
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										<i class="fas fa-utensils text-red-500 mr-2"></i>
										餐食费用
									</label>
									<uni-easyinput
										v-model="localData.cost_info.meals"
										@change="handleUserInput"
										type="textarea"
										:styles="textareaStyles"
										:autoHeight="true"
										placeholder="请输入餐食费用说明"
										:clearable="true" />
								</view>

								<!-- 门票费用 -->
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										<i class="fas fa-ticket-alt text-green-500 mr-2"></i>
										门票费用
									</label>
									<uni-easyinput
										v-model="localData.cost_info.tickets"
										@change="handleUserInput"
										type="textarea"
										:styles="textareaStyles"
										:autoHeight="true"
										placeholder="请输入门票费用说明"
										:clearable="true" />
								</view>

								<!-- 服务费用 -->
								<view>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										<i class="fas fa-concierge-bell text-orange-500 mr-2"></i>
										服务费用
									</label>
									<uni-easyinput
										v-model="localData.cost_info.service"
										@change="handleUserInput"
										type="textarea"
										:styles="textareaStyles"
										:autoHeight="true"
										placeholder="请输入服务费用说明"
										:clearable="true" />
								</view>
							</view>
						</td>
					</tr>

					<!-- 商品特色 -->
					<tr class="hover:bg-gray-50 transition-colors">
						<td class="px-8 py-6 whitespace-nowrap font-semibold text-gray-900 bg-gray-50">
							<i class="fas fa-star text-yellow-500 mr-3"></i>
							商品特色
						</td>
						<td class="px-8 py-6">
							<view class="space-y-4">
								<view v-for="(feature, index) in localData.features" :key="index" class="flex items-center space-x-3">
									<view class="flex items-center flex-1">
										<i class="fas fa-medal text-orange-500 mr-3 text-lg"></i>
										<uni-easyinput
											v-model="localData.features[index]"
											@change="handleUserInput"
											:styles="flexInputStyles"
											:placeholder="`特色亮点 ${index + 1}`"
											:clearable="true" />
									</view>
									<button @click="removeFeature(index)" class="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
										<i class="fas fa-trash"></i>
									</button>
								</view>
								<button
									@click="addFeature"
									class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors text-lg">
									<i class="fas fa-plus mr-2"></i>
									添加商品特色
								</button>
							</view>
						</td>
					</tr>
				</tbody>
			</table>
		</view>
	</view>
</template>

<script>
import { toRaw } from 'vue';

export default {
	name: 'ProductInfo',
	props: {
		productData: {
			type: Object,
			default: () => ({})
		}
	},
	data() {
		return {
			isDirty: false, // 当用户开始编辑数据时，isDirty变为true，防止productData因某种原因变化或刷新而覆盖了localData，造成用户输入被覆盖
			localData: {
				ctrip_id: '',
				title: '',
				subtitle: '',
				route_title: '',
				route_overview: {
					transport: '',
					accommodation: '',
					spots: '',
					meals: '',
					activities: ''
				},
				price: 0,
				child_price: 0,
				rating: 5.0,
				good_rate: 100,
				rating_spec: {
					itinerary: 5,
					accommodation: 5,
					service: 5
				},
				status: 1,
				view_count: 0,
				sales_count: 0,
				review_count: 0,
				sort_order: 0,
				product_images: [],
				detail_images: [],
				duration_days: 1,
				features: [],
				category: '国内游',
				destination: '',
				tags: [],
				overview: {
					guide: '',
					transport: '',
					activities: '',
					accommodation: '',
					meals: ''
				},
				cost_info: {
					transport: '',
					accommodation: '',
					meals: '',
					tickets: '',
					service: ''
				},
				crawl_timestamp: '',
				...this.productData
			},
			// 新图片URL输入
			newProductImageUrl: '',
			newDetailImageUrl: '',
			// 拖拽状态
			draggingIndex: -1,
			draggingType: '', // 'product' 或 'detail'
			isDragOver: false,
			dropTargetIndex: -1,
			// uni-easyinput 样式配置
			inputStyles: {
				borderRadius: '8px',
				borderColor: '#d1d5db',
				fontSize: '18px',
				padding: '12px 16px'
			},
			smallInputStyles: {
				borderRadius: '8px',
				borderColor: '#d1d5db',
				fontSize: '18px',
				padding: '12px 16px',
				width: '128px'
			},
			flexInputStyles: {
				borderRadius: '8px',
				borderColor: '#d1d5db',
				fontSize: '18px',
				padding: '12px 16px',
				flex: '1'
			},
			textareaStyles: {
				borderRadius: '8px',
				borderColor: '#d1d5db',
				fontSize: '18px',
				padding: '12px 16px'
			}
		};
	},
	created() {
		console.log('🎬 [ProductInfo] 组件创建完成');
		console.log('🎬 [ProductInfo] 初始productData:', toRaw(this.productData));
		console.log('🎬 [ProductInfo] 初始localData:', toRaw(this.localData));
		console.log('🎬 [ProductInfo] 商品概览数据结构:', {
			overview类型: typeof this.localData.overview,
			overview内容: this.localData.overview,
			costInfo类型: typeof this.localData.cost_info,
			costInfo内容: this.localData.cost_info
		});
		console.log('🎬 [ProductInfo] 初始图片状态:', {
			商品图片数量: (this.localData.product_images || []).length,
			详情图片数量: (this.localData.detail_images || []).length,
			行程天数: this.localData.duration_days,
			商品图片列表: this.localData.product_images,
			详情图片列表: this.localData.detail_images
		});
	},

	mounted() {
		console.log('🎯 [ProductInfo] 组件挂载完成');
		console.log('🎯 [ProductInfo] 挂载时图片状态:', {
			商品图片数量: (this.localData.product_images || []).length,
			详情图片数量: (this.localData.detail_images || []).length,
			行程天数: this.localData.duration_days
		});

		// 检查uni-file-picker组件
		this.$nextTick(() => {
			console.log('🔧 [ProductInfo] 检查uni-file-picker组件是否存在');
			const filePickerElements = this.$el.querySelectorAll('.uni-file-picker');
			console.log('🔧 [ProductInfo] 找到的uni-file-picker元素数量:', filePickerElements.length);

			// 添加全局点击事件监听来测试
			console.log('🔧 [ProductInfo] 添加全局点击监听器用于调试');
		});
	},

	beforeDestroy() {
		console.log('💔 [ProductInfo] 组件即将销毁');
		console.log('💔 [ProductInfo] 销毁时图片状态:', {
			商品图片数量: (this.localData.product_images || []).length,
			详情图片数量: (this.localData.detail_images || []).length
		});
	},
	watch: {
		productData: {
			handler(newVal, oldVal) {
				// 只在初始化时更新 localData，避免覆盖用户输入
				// if (!oldVal || Object.keys(oldVal).length === 0) {
				if (!this.isDirty) {
					console.log('🔄 [ProductInfo] 初始化 productData:', toRaw(newVal));

					if (newVal) {
						const updatedData = { ...this.localData, ...newVal };

						if (!updatedData.overview) {
							updatedData.overview = {};
						}

						if (!updatedData.cost_info) {
							updatedData.cost_info = {};
						}

						// 确保 overview 始终是对象
						if (newVal.overview && typeof newVal.overview === 'object') {
							updatedData.overview = {
								...this.localData.overview,
								...newVal.overview
							};
						}

						// 确保 cost_info 始终是对象
						if (newVal.cost_info && typeof newVal.cost_info === 'object') {
							updatedData.cost_info = {
								...this.localData.cost_info,
								...newVal.cost_info
							};
						}

						this.localData = updatedData;
						console.log('✅ [ProductInfo] 初始化完成');
					}
				} else {
					console.log('🔄 [ProductInfo] productData变化，但不覆盖用户输入');
				}
			},
			deep: true,
			immediate: true
		}
	},
	methods: {
		handleUserInput() {
			this.isDirty = true;
			this.updateData();
		},
		updateData() {
			console.log('📤 [ProductInfo] 发送数据更新事件开始');
			console.log('📤 [ProductInfo] 触发时间:', new Date().toLocaleString());
			console.log('📤 [ProductInfo] 当前localData:', toRaw(this.localData));
			console.log('📤 [ProductInfo] localData完整结构:', toRaw(this.localData));
			console.log('📤 [ProductInfo] 关键字段检查:', {
				ctrip_id: this.localData.ctrip_id,
				title: this.localData.title,
				price: this.localData.price,
				price_type: typeof this.localData.price,
				status: this.localData.status,
				status_type: typeof this.localData.status
			});
			console.log('📤 [ProductInfo] 商品图片数量:', (this.localData.product_images || []).length);
			console.log('📤 [ProductInfo] 详情图片数量:', (this.localData.detail_images || []).length);

			this.$emit('update', this.localData);
			console.log('✅ [ProductInfo] 数据更新事件已发送，数据:', toRaw(this.localData));
		},
		// 点击事件测试
		onProductUploadClick() {
			console.log('🎯 [ProductInfo] 商品图片上传按钮被点击');
		},

		onDetailUploadClick() {
			console.log('🎯 [ProductInfo] 详情图片上传按钮被点击');
		},

		addFeature() {
			this.isDirty = true;
			console.log('⭐ [ProductInfo] 添加商品特色');
			if (!Array.isArray(this.localData.features)) {
				this.localData.features = [];
			}
			this.localData.features.push('');
			console.log('⭐ [ProductInfo] 商品特色已添加，当前数量:', this.localData.features.length);
			this.updateData();
		},
		removeFeature(index) {
			this.isDirty = true;
			console.log('⭐ [ProductInfo] 删除商品特色，索引:', index);
			this.localData.features.splice(index, 1);
			console.log('⭐ [ProductInfo] 商品特色已删除，当前数量:', this.localData.features.length);
			this.updateData();
		},

		// 商品图片处理方法 - 测试多个事件
		onProductImagesInput(files) {
			console.log('🚨 [ProductInfo] 商品图片 @input 事件触发:', files);
			console.log('ℹ️ [ProductInfo] @input事件仅用于监控，不处理图片添加');
			// 注意：@input 事件仅用于监控，实际的图片添加在 @success 事件中处理
		},

		onProductImagesSuccess(files) {
			console.log('🚨 [ProductInfo] 商品图片 @success 事件触发:', files);
			console.log('✅ [ProductInfo] 使用@success事件处理图片添加（确保上传成功）');
			this.handleProductImagesUpload(files, 'success');
		},

		onProductImagesFail(error) {
			console.log('🚨 [ProductInfo] 商品图片 @fail 事件触发:', error);
		},

		onProductImagesProgress(progress) {
			console.log('🚨 [ProductInfo] 商品图片 @progress 事件触发:', progress);
		},

		onProductImagesChange(files) {
			console.log('🚨 [ProductInfo] 商品图片 @select 事件触发:', files);
			console.log('ℹ️ [ProductInfo] @select事件仅用于预览，不处理图片添加');
			// 注意：@select 事件仅用于预览，实际的图片添加在 @success 事件中处理
		},

		// 统一的商品图片处理方法
		handleProductImagesUpload(files, eventType) {
			this.isDirty = true;
			console.log('📷 [ProductInfo] 商品图片上传开始');
			console.log('📷 [ProductInfo] 触发事件类型:', eventType);
			console.log('📷 [ProductInfo] 接收到的files参数:', files);
			console.log('📷 [ProductInfo] files类型:', typeof files);
			console.log('📷 [ProductInfo] 当前商品图片数量:', (this.localData.product_images || []).length);

			// 只处理 success 事件，避免重复添加
			if (eventType !== 'success') {
				console.log('ℹ️ [ProductInfo] 只在success事件中处理图片添加，当前事件已忽略:', eventType);
				return;
			}

			if (files && files.tempFilePaths && files.tempFilePaths.length > 0) {
				console.log('📷 [ProductInfo] 处理tempFilePaths格式数据');
				console.log('📷 [ProductInfo] tempFilePaths内容:', files.tempFilePaths);

				// 处理上传成功的图片
				const urls = files.tempFilePaths.map((file, index) => {
					const url = file.url || file.path || file;
					console.log(`📷 [ProductInfo] 处理第${index + 1}张图片:`, { file, extractedUrl: url });
					return url;
				});

				console.log('📷 [ProductInfo] 提取到的URL列表:', urls);

				if (!Array.isArray(this.localData.product_images)) {
					console.log('📷 [ProductInfo] 初始化商品图片数组');
					this.localData.product_images = [];
				}

				const originalCount = this.localData.product_images.length;
				this.localData.product_images = [...this.localData.product_images, ...urls];
				console.log('📷 [ProductInfo] 图片添加完成:', {
					originalCount,
					addedCount: urls.length,
					newTotalCount: this.localData.product_images.length,
					allImages: this.localData.product_images
				});

				this.updateData();

				uni.showToast({
					title: `成功上传${urls.length}张图片`,
					icon: 'success'
				});

				console.log('✅ [ProductInfo] 商品图片上传流程完成');
			} else if (Array.isArray(files) && files.length > 0) {
				console.log('📷 [ProductInfo] 处理直接文件数组格式');
				console.log('📷 [ProductInfo] 文件数组内容:', files);

				// 直接是文件数组
				const urls = files.map((file, index) => {
					const url = file.url || file.path || file;
					console.log(`📷 [ProductInfo] 处理第${index + 1}个文件:`, { file, extractedUrl: url });
					return url;
				});

				console.log('📷 [ProductInfo] 提取到的URL列表:', urls);

				if (!Array.isArray(this.localData.product_images)) {
					console.log('📷 [ProductInfo] 初始化商品图片数组');
					this.localData.product_images = [];
				}

				const originalCount = this.localData.product_images.length;
				this.localData.product_images = [...this.localData.product_images, ...urls];
				console.log('📷 [ProductInfo] 图片添加完成:', {
					originalCount,
					addedCount: urls.length,
					newTotalCount: this.localData.product_images.length,
					allImages: this.localData.product_images
				});

				this.updateData();

				uni.showToast({
					title: `成功上传${urls.length}张图片`,
					icon: 'success'
				});

				console.log('✅ [ProductInfo] 商品图片上传流程完成');
			} else {
				console.warn('⚠️ [ProductInfo] 商品图片上传失败 - 无效的文件数据:', files);
				uni.showToast({
					title: '图片上传失败',
					icon: 'error'
				});
			}
		},

		// 图片预览方法
		previewImage(currentUrl, allImages) {
			console.log('📸 [图片预览] 触发:', { currentUrl, total: allImages.length });

			if (!allImages || allImages.length === 0) {
				console.warn('📸 [图片预览] 没有图片可供预览');
				return;
			}

			uni.previewImage({
				current: currentUrl,
				urls: allImages
			});
		},

		addProductImageUrl() {
			this.isDirty = true;
			console.log('🔗 [ProductInfo] 手动添加商品图片URL开始');
			console.log('🔗 [ProductInfo] 输入的URL:', this.newProductImageUrl);
			console.log('🔗 [ProductInfo] URL长度:', this.newProductImageUrl ? this.newProductImageUrl.length : 0);
			console.log('🔗 [ProductInfo] 当前商品图片数量:', (this.localData.product_images || []).length);

			if (this.newProductImageUrl.trim()) {
				const cleanUrl = this.newProductImageUrl.trim();
				console.log('🔗 [ProductInfo] 清理后的URL:', cleanUrl);

				if (!Array.isArray(this.localData.product_images)) {
					console.log('🔗 [ProductInfo] 初始化商品图片数组');
					this.localData.product_images = [];
				}

				const originalCount = this.localData.product_images.length;
				this.localData.product_images.push(cleanUrl);
				console.log('🔗 [ProductInfo] URL添加完成:', {
					originalCount,
					newTotalCount: this.localData.product_images.length,
					addedUrl: cleanUrl,
					allImages: this.localData.product_images
				});

				this.newProductImageUrl = '';
				console.log('🔗 [ProductInfo] 输入框已清空');

				this.updateData();

				uni.showToast({
					title: '图片添加成功',
					icon: 'success'
				});

				console.log('✅ [ProductInfo] 商品图片URL添加流程完成');
			} else {
				console.warn('⚠️ [ProductInfo] 商品图片URL添加失败 - URL为空');
				uni.showToast({
					title: '请输入图片URL',
					icon: 'error'
				});
			}
		},

		removeProductImage(index) {
			this.isDirty = true;
			console.log('🗑️ [ProductInfo] 删除商品图片开始');
			console.log('🗑️ [ProductInfo] 要删除的索引:', index);
			console.log('🗑️ [ProductInfo] 当前商品图片数组:', this.localData.product_images);
			console.log('🗑️ [ProductInfo] 当前图片数量:', (this.localData.product_images || []).length);

			if (this.localData.product_images && this.localData.product_images.length > index) {
				const imageToDelete = this.localData.product_images[index];
				console.log('🗑️ [ProductInfo] 将要删除的图片URL:', imageToDelete);

				const originalCount = this.localData.product_images.length;
				this.localData.product_images.splice(index, 1);
				console.log('🗑️ [ProductInfo] 图片删除完成:', {
					deletedImageUrl: imageToDelete,
					deletedIndex: index,
					originalCount,
					newCount: this.localData.product_images.length,
					remainingImages: this.localData.product_images
				});

				this.updateData();

				uni.showToast({
					title: '图片删除成功',
					icon: 'success'
				});

				console.log('✅ [ProductInfo] 商品图片删除流程完成');
			} else {
				console.warn('⚠️ [ProductInfo] 删除商品图片失败 - 索引无效:', {
					index,
					arrayLength: (this.localData.product_images || []).length,
					array: this.localData.product_images
				});
			}
		},

		// 详情图片处理方法 - 测试多个事件
		onDetailImagesInput(files) {
			console.log('🚨 [ProductInfo] 详情图片 @input 事件触发:', files);
			console.log('ℹ️ [ProductInfo] @input事件仅用于监控，不处理图片添加');
			// 注意：@input 事件仅用于监控，实际的图片添加在 @success 事件中处理
		},

		onDetailImagesSuccess(files) {
			console.log('🚨 [ProductInfo] 详情图片 @success 事件触发:', files);
			console.log('✅ [ProductInfo] 使用@success事件处理图片添加（确保上传成功）');
			this.handleDetailImagesUpload(files, 'success');
		},

		onDetailImagesFail(error) {
			console.log('🚨 [ProductInfo] 详情图片 @fail 事件触发:', error);
		},

		onDetailImagesProgress(progress) {
			console.log('🚨 [ProductInfo] 详情图片 @progress 事件触发:', progress);
		},

		onDetailImagesChange(files) {
			console.log('🚨 [ProductInfo] 详情图片 @select 事件触发:', files);
			console.log('ℹ️ [ProductInfo] @select事件仅用于预览，不处理图片添加');
			// 注意：@select 事件仅用于预览，实际的图片添加在 @success 事件中处理
		},

		// 统一的详情图片处理方法
		handleDetailImagesUpload(files, eventType) {
			console.log('🖼️ [ProductInfo] 详情图片上传开始');
			console.log('🖼️ [ProductInfo] 触发事件类型:', eventType);
			console.log('🖼️ [ProductInfo] 接收到的files参数:', files);
			console.log('🖼️ [ProductInfo] files类型:', typeof files);
			console.log('🖼️ [ProductInfo] 当前详情图片数量:', (this.localData.detail_images || []).length);

			if (files && files.tempFilePaths && files.tempFilePaths.length > 0) {
				console.log('🖼️ [ProductInfo] 处理tempFilePaths格式数据');
				console.log('🖼️ [ProductInfo] tempFilePaths内容:', files.tempFilePaths);

				// 处理上传成功的图片
				const urls = files.tempFilePaths.map((file, index) => {
					const url = file.url || file.path || file;
					console.log(`🖼️ [ProductInfo] 处理第${index + 1}张图片:`, { file, extractedUrl: url });
					return url;
				});

				console.log('🖼️ [ProductInfo] 提取到的URL列表:', urls);

				if (!Array.isArray(this.localData.detail_images)) {
					console.log('🖼️ [ProductInfo] 初始化详情图片数组');
					this.localData.detail_images = [];
				}

				const originalCount = this.localData.detail_images.length;
				this.localData.detail_images = [...this.localData.detail_images, ...urls];
				console.log('🖼️ [ProductInfo] 图片添加完成:', {
					originalCount,
					addedCount: urls.length,
					newTotalCount: this.localData.detail_images.length,
					allImages: this.localData.detail_images
				});

				this.updateData();

				uni.showToast({
					title: `成功上传${urls.length}张图片`,
					icon: 'success'
				});

				console.log('✅ [ProductInfo] 详情图片上传流程完成');
			} else if (Array.isArray(files) && files.length > 0) {
				console.log('🖼️ [ProductInfo] 处理直接文件数组格式');
				console.log('🖼️ [ProductInfo] 文件数组内容:', files);

				// 直接是文件数组
				const urls = files.map((file, index) => {
					const url = file.url || file.path || file;
					console.log(`🖼️ [ProductInfo] 处理第${index + 1}个文件:`, { file, extractedUrl: url });
					return url;
				});

				console.log('🖼️ [ProductInfo] 提取到的URL列表:', urls);

				if (!Array.isArray(this.localData.detail_images)) {
					console.log('🖼️ [ProductInfo] 初始化详情图片数组');
					this.localData.detail_images = [];
				}

				const originalCount = this.localData.detail_images.length;
				this.localData.detail_images = [...this.localData.detail_images, ...urls];
				console.log('🖼️ [ProductInfo] 图片添加完成:', {
					originalCount,
					addedCount: urls.length,
					newTotalCount: this.localData.detail_images.length,
					allImages: this.localData.detail_images
				});

				this.updateData();

				uni.showToast({
					title: `成功上传${urls.length}张图片`,
					icon: 'success'
				});

				console.log('✅ [ProductInfo] 详情图片上传流程完成');
			} else {
				console.warn('⚠️ [ProductInfo] 详情图片上传失败 - 无效的文件数据:', files);
				uni.showToast({
					title: '图片上传失败',
					icon: 'error'
				});
			}
		},

		addDetailImageUrl() {
			this.isDirty = true;
			console.log('🔗 [ProductInfo] 手动添加详情图片URL开始');
			console.log('🔗 [ProductInfo] 输入的URL:', this.newDetailImageUrl);
			console.log('🔗 [ProductInfo] URL长度:', this.newDetailImageUrl ? this.newDetailImageUrl.length : 0);
			console.log('🔗 [ProductInfo] 当前详情图片数量:', (this.localData.detail_images || []).length);

			if (this.newDetailImageUrl.trim()) {
				const cleanUrl = this.newDetailImageUrl.trim();
				console.log('🔗 [ProductInfo] 清理后的URL:', cleanUrl);

				if (!Array.isArray(this.localData.detail_images)) {
					console.log('🔗 [ProductInfo] 初始化详情图片数组');
					this.localData.detail_images = [];
				}

				const originalCount = this.localData.detail_images.length;
				this.localData.detail_images.push(cleanUrl);
				console.log('🔗 [ProductInfo] URL添加完成:', {
					originalCount,
					newTotalCount: this.localData.detail_images.length,
					addedUrl: cleanUrl,
					allImages: this.localData.detail_images
				});

				this.newDetailImageUrl = '';
				console.log('🔗 [ProductInfo] 输入框已清空');

				this.updateData();

				uni.showToast({
					title: '图片添加成功',
					icon: 'success'
				});

				console.log('✅ [ProductInfo] 详情图片URL添加流程完成');
			} else {
				console.warn('⚠️ [ProductInfo] 详情图片URL添加失败 - URL为空');
				uni.showToast({
					title: '请输入图片URL',
					icon: 'error'
				});
			}
		},

		removeDetailImage(index) {
			this.isDirty = true;
			console.log('🗑️ [ProductInfo] 删除详情图片开始');
			console.log('🗑️ [ProductInfo] 要删除的索引:', index);
			console.log('🗑️ [ProductInfo] 当前详情图片数组:', this.localData.detail_images);
			console.log('🗑️ [ProductInfo] 当前图片数量:', (this.localData.detail_images || []).length);

			if (this.localData.detail_images && this.localData.detail_images.length > index) {
				const imageToDelete = this.localData.detail_images[index];
				console.log('🗑️ [ProductInfo] 将要删除的图片URL:', imageToDelete);

				const originalCount = this.localData.detail_images.length;
				this.localData.detail_images.splice(index, 1);
				console.log('🗑️ [ProductInfo] 图片删除完成:', {
					deletedImageUrl: imageToDelete,
					deletedIndex: index,
					originalCount,
					newCount: this.localData.detail_images.length,
					remainingImages: this.localData.detail_images
				});

				this.updateData();

				uni.showToast({
					title: '图片删除成功',
					icon: 'success'
				});

				console.log('✅ [ProductInfo] 详情图片删除流程完成');
			} else {
				console.warn('⚠️ [ProductInfo] 删除详情图片失败 - 索引无效:', {
					index,
					arrayLength: (this.localData.detail_images || []).length,
					array: this.localData.detail_images
				});
			}
		},

		// 拖拽排序相关方法
		onDragStart(event, index, type) {
			console.log('🎯 [ProductInfo] 开始拖拽:', { index, type });
			this.draggingIndex = index;
			this.draggingType = type;

			// 设置拖拽数据
			if (event.dataTransfer) {
				event.dataTransfer.setData('text/plain', `${index},${type}`);
				event.dataTransfer.effectAllowed = 'move';
			}
		},

		onDragOver(event) {
			event.preventDefault();
			this.isDragOver = true;

			// 获取目标索引
			const target = event.currentTarget;
			if (target && target.getAttribute) {
				const index = target.getAttribute('data-index');
				if (index !== null) {
					this.dropTargetIndex = parseInt(index);
				}
			}

			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = 'move';
			}
		},

		onDrop(event, targetIndex, targetType) {
			event.preventDefault();
			console.log('📍 [ProductInfo] 拖拽放置开始');
			console.log('📍 [ProductInfo] 目标位置:', targetIndex);
			console.log('📍 [ProductInfo] 目标类型:', targetType);
			console.log('📍 [ProductInfo] 源索引:', this.draggingIndex);
			console.log('📍 [ProductInfo] 源类型:', this.draggingType);

			// 只允许同类型图片之间拖拽
			if (this.draggingType !== targetType) {
				console.warn('⚠️ [ProductInfo] 拖拽失败 - 类型不匹配:', {
					sourceType: this.draggingType,
					targetType: targetType
				});
				this.resetDragState();
				return;
			}

			const sourceIndex = this.draggingIndex;

			if (sourceIndex !== targetIndex && sourceIndex >= 0) {
				this.isDirty = true;
				console.log('📍 [ProductInfo] 开始重排图片数组');

				// 重新排列数组
				const images = targetType === 'product' ? [...this.localData.product_images] : [...this.localData.detail_images];

				console.log('📍 [ProductInfo] 原始数组:', images);
				console.log('📍 [ProductInfo] 要移动的图片:', images[sourceIndex]);

				// 移动元素
				const [movedItem] = images.splice(sourceIndex, 1);
				images.splice(targetIndex, 0, movedItem);

				console.log('📍 [ProductInfo] 重排后数组:', images);
				console.log('📍 [ProductInfo] 移动的元素:', movedItem);

				// 更新数据
				if (targetType === 'product') {
					this.localData.product_images = images;
					console.log('📍 [ProductInfo] 商品图片数组已更新');
				} else {
					this.localData.detail_images = images;
					console.log('📍 [ProductInfo] 详情图片数组已更新');
				}

				this.updateData();

				uni.showToast({
					title: '图片顺序调整成功',
					icon: 'success'
				});

				console.log('✅ [ProductInfo] 图片重排完成:', {
					sourceIndex,
					targetIndex,
					type: targetType,
					movedItem,
					finalArray: images
				});
			} else {
				console.log('ℹ️ [ProductInfo] 无需重排 - 相同位置或无效索引:', {
					sourceIndex,
					targetIndex,
					isSamePosition: sourceIndex === targetIndex,
					isValidIndex: sourceIndex >= 0
				});
			}

			this.resetDragState();
		},

		onDragEnd() {
			this.resetDragState();
		},

		resetDragState() {
			console.log('🔄 [ProductInfo] 重置拖拽状态');
			console.log('🔄 [ProductInfo] 重置前状态:', {
				draggingIndex: this.draggingIndex,
				draggingType: this.draggingType,
				isDragOver: this.isDragOver,
				dropTargetIndex: this.dropTargetIndex
			});

			this.draggingIndex = -1;
			this.draggingType = '';
			this.isDragOver = false;
			this.dropTargetIndex = -1;

			console.log('✅ [ProductInfo] 拖拽状态已重置');
		}
	}
};
</script>

<style scoped>
/* 表格样式优化 */
table {
	border-collapse: separate;
	border-spacing: 0;
}

/* 移动端响应式 */
@media (max-width: 480px) {
	.grid.grid-cols-5 {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	.w-18 {
		width: 4rem; /* 64px */
	}

	.h-18 {
		height: 4rem; /* 64px */
	}
}

@media (max-width: 768px) {
	.table-responsive {
		font-size: 0.9rem;
	}
}

/* 自定义尺寸 */
.w-18 {
	width: 4.5rem; /* 72px */
}

.h-18 {
	height: 4.5rem; /* 72px */
}

/* 图片网格优化 */
.grid.grid-cols-5 {
	grid-template-columns: repeat(5, minmax(0, 1fr));
}

@media (min-width: 640px) {
	.grid.sm\\:grid-cols-7 {
		grid-template-columns: repeat(7, minmax(0, 1fr));
	}
}

@media (min-width: 768px) {
	.grid.md\\:grid-cols-9 {
		grid-template-columns: repeat(9, minmax(0, 1fr));
	}
}

/* 隐藏 uni-file-picker 内部的默认展示 */
.uni-file-picker /deep/ .uni-file-picker__container .file-picker__box {
	display: none !important;
}

/* 只显示我们自定义的上传按钮 */
.uni-file-picker /deep/ .uni-file-picker__container {
	margin: 0 !important;
	padding: 0 !important;
}

/* 确保上传按钮悬停效果正常 */
.group:hover .group-hover\:opacity-100 {
	opacity: 1;
}

/* 拖拽样式 */
.cursor-move {
	cursor: move;
}

/* 拖拽时的视觉反馈 */
[draggable='true']:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 拖拽中的元素样式 */
.scale-105 {
	transform: scale(1.05);
}

/* 拖拽放置区域样式 */
.drag-over {
	background-color: rgba(59, 130, 246, 0.1);
	border-color: #3b82f6;
}

/* 平滑过渡动画 */
.transition-all {
	transition: all 0.2s ease-in-out;
}

.star-rating-container {
	position: relative;
	display: inline-block; /* 让容器只占内容宽度 */
	vertical-align: middle; /* 方便和旁边的文字对齐 */
}

.stars-background {
	/* flex 布局让星星排成一行 */
	display: flex;
	white-space: nowrap; /* 防止星星换行 */
}

.stars-foreground {
	position: absolute;
	top: 0;
	left: 0;
	display: flex;
	white-space: nowrap;
	overflow: hidden; /* 关键：裁剪前景层 */
}

/* 统一给星星一点间距，使其不至于粘在一起 */
.star-rating-container .fa-star {
	margin-right: 2px;
}
/* 最后一个星星不需要右边距 */
.star-rating-container .fa-star:last-child {
	margin-right: 0;
}
</style>
