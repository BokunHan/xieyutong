<template>
	<view class="bg-white rounded-xl shadow-lg overflow-hidden">
		<!-- 组件标题 -->
		<view class="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
			<view class="flex items-center justify-between">
				<view class="flex items-center">
					<i class="fas fa-star text-white text-2xl mr-4"></i>
					<text class="text-2xl font-bold text-white">评价管理</text>
				</view>
				<view class="flex items-center space-x-3">
					<button @click="generateAIReviews" class="px-6 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-50 transition-colors font-medium">
						<i class="fas fa-robot mr-2"></i>
						生成AI评价
					</button>
					<button @click="addManualReview" class="px-6 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-50 transition-colors font-medium">
						<i class="fas fa-plus mr-2"></i>
						添加评价
					</button>
				</view>
			</view>
		</view>

		<!-- 评价统计 -->
		<view class="px-8 py-6 bg-gray-50 border-b border-gray-200">
			<view class="grid grid-cols-1 md:grid-cols-4 gap-6">
				<view class="text-center">
					<text class="block text-3xl font-bold text-purple-600">{{ totalReviews }}</text>
					<text class="text-sm text-gray-600">总评价数</text>
				</view>
				<view class="text-center">
					<text class="block text-3xl font-bold text-yellow-500">{{ averageRating.toFixed(1) }}</text>
					<text class="text-sm text-gray-600">平均评分</text>
				</view>
				<view class="text-center">
					<text class="block text-3xl font-bold text-blue-600">{{ aiReviewsCount }}</text>
					<text class="text-sm text-gray-600">AI评价</text>
				</view>
				<view class="text-center">
					<text class="block text-3xl font-bold text-green-600">{{ realReviewsCount }}</text>
					<text class="text-sm text-gray-600">真实评价</text>
				</view>
			</view>
		</view>

		<!-- 评价列表 -->
		<view class="overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-100">
					<tr>
						<th class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-32">用户信息</th>
						<th class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-24">评分</th>
						<th class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">评价内容</th>
						<th class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-32">类型</th>
						<th class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-32">状态</th>
						<th class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-40">创建时间</th>
						<th class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-32">操作</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					<tr v-for="(review, index) in paginatedReviews" :key="review.review_id || index" class="hover:bg-gray-50 transition-colors">
						<!-- 用户信息 -->
						<td class="px-6 py-4">
							<view class="flex items-center">
								<view class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
									<i class="fas fa-user text-gray-600"></i>
								</view>
								<view>
									<text class="block text-sm font-medium text-gray-900">{{ review.user_name || '匿名用户' }}</text>
									<text class="block text-xs text-gray-500">{{ review.user_id || 'N/A' }}</text>
								</view>
							</view>
						</td>

						<!-- 评分 -->
						<td class="px-6 py-4">
							<view class="flex items-center">
								<view class="flex">
									<i v-for="i in 5" :key="i" :class="i <= review.rating ? 'fas fa-star text-yellow-400' : 'far fa-star text-gray-300'" class="text-sm"></i>
								</view>
								<text class="ml-2 text-sm text-gray-600">{{ review.rating }}</text>
							</view>
						</td>

						<!-- 评价内容 -->
						<td class="px-6 py-4">
							<view class="max-w-xs">
								<text class="text-sm text-gray-900 line-clamp-3">{{ review.content }}</text>
								<view v-if="review.images && review.images.length > 0" class="mt-2 flex space-x-2">
									<view v-for="(image, imgIndex) in review.images.slice(0, 3)" :key="imgIndex" class="w-8 h-8 bg-gray-200 rounded border">
										<image :src="image" class="w-full h-full object-cover rounded" mode="aspectFill" />
									</view>
									<text v-if="review.images.length > 3" class="text-xs text-gray-500 flex items-center">+{{ review.images.length - 3 }}</text>
								</view>
							</view>
						</td>

						<!-- 类型 -->
						<td class="px-6 py-4">
							<span :class="['inline-flex px-2 py-1 text-xs font-semibold rounded-full', review.is_ai ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800']">
								{{ review.is_ai ? 'AI评价' : '真实评价' }}
							</span>
						</td>

						<!-- 状态 -->
						<td class="px-6 py-4">
							<select
								v-model.number="review.status"
								@change="updateReviewStatus(review)"
								:class="[
									'text-xs font-semibold rounded px-2 py-1 border-0',
									review.status === 1 ? 'bg-green-100 text-green-800' : review.status === 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
								]">
								<option value="0">待审核</option>
								<option value="1">已发布</option>
								<option value="2">已隐藏</option>
							</select>
						</td>

						<!-- 创建时间 -->
						<td class="px-6 py-4 text-sm text-gray-500">
							{{ formatDate(review.created_at) }}
						</td>

						<!-- 操作 -->
						<td class="px-6 py-4">
							<view class="flex items-center space-x-2">
								<button @click="editReview(review)" class="text-blue-600 hover:text-blue-800 text-sm">
									<i class="fas fa-edit mr-1"></i>
									编辑
								</button>
								<button @click="deleteReview(review, index)" class="text-red-600 hover:text-red-800 text-sm">
									<i class="fas fa-trash mr-1"></i>
									删除
								</button>
							</view>
						</td>
					</tr>
				</tbody>
			</table>

			<!-- 分页 -->
			<view v-if="totalPages > 1" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
				<view class="flex items-center justify-between">
					<text class="text-sm text-gray-700">
						显示 {{ (currentPage - 1) * pageSize + 1 }} 到 {{ Math.min(currentPage * pageSize, totalReviews) }} 条，共 {{ totalReviews }} 条记录
					</text>
					<view class="flex items-center space-x-2">
						<button
							@click="changePage(currentPage - 1)"
							:disabled="currentPage <= 1"
							:class="['px-3 py-1 rounded text-sm', currentPage <= 1 ? 'bg-gray-100 text-gray-400' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50']">
							上一页
						</button>
						<text class="text-sm text-gray-700">{{ currentPage }} / {{ totalPages }}</text>
						<button
							@click="changePage(currentPage + 1)"
							:disabled="currentPage >= totalPages"
							:class="['px-3 py-1 rounded text-sm', currentPage >= totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50']">
							下一页
						</button>
					</view>
				</view>
			</view>
		</view>

		<!-- 编辑评价弹窗 -->
		<view v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeEditModal">
			<view class="bg-white rounded-lg p-8 w-full max-w-2xl mx-4" @click.stop>
				<view class="flex items-center justify-between mb-6">
					<text class="text-xl font-bold text-gray-900">编辑评价</text>
					<button @click="closeEditModal" class="text-gray-400 hover:text-gray-600">
						<i class="fas fa-times text-xl"></i>
					</button>
				</view>

				<view class="space-y-6">
					<!-- 用户名 -->
					<view>
						<label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
						<uni-easyinput v-model="editingReview.user_name" :styles="modalInputStyles" placeholder="输入用户名" :clearable="true" />
					</view>

					<!-- 评分 -->
					<view>
						<label class="block text-sm font-medium text-gray-700 mb-2">评分</label>
						<select v-model.number="editingReview.rating" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
							<option v-for="i in 5" :key="i" :value="i">{{ i }} 星</option>
						</select>
					</view>

					<!-- 评价内容 -->
					<view>
						<label class="block text-sm font-medium text-gray-700 mb-2">评价内容</label>
						<uni-easyinput v-model="editingReview.content" type="textarea" :styles="modalTextareaStyles" :autoHeight="true" placeholder="输入评价内容" :clearable="true" />
					</view>

					<!-- 评价类型 -->
					<view>
						<label class="block text-sm font-medium text-gray-700 mb-2">评价类型</label>
						<select v-model="editingReview.is_ai" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
							<option :value="false">真实评价</option>
							<option :value="true">AI评价</option>
						</select>
					</view>
				</view>

				<!-- 操作按钮 -->
				<view class="flex items-center justify-end space-x-4 mt-8">
					<button @click="closeEditModal" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
					<button @click="saveReview" class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">保存</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { names } from '@/data/reviewNames.js';
import { contents } from '@/data/reviewContents.js';

export default {
	name: 'ReviewManagement',
	props: {
		reviewData: {
			type: Array,
			default: () => []
		},
		productId: {
			type: String,
			default: ''
		},
		ctripId: {
			type: String,
			default: ''
		}
	},
	data() {
		console.log('💾 [ReviewManagement] data() - 初始化组件数据');
		console.log('💾 [ReviewManagement] data() - 接收的reviewData:', this.reviewData);
		console.log('💾 [ReviewManagement] data() - reviewData长度:', this.reviewData ? this.reviewData.length : 'undefined');

		const localData = [...this.reviewData];
		console.log('💾 [ReviewManagement] data() - 复制到localData，长度:', localData.length);

		return {
			localData: localData,
			currentPage: 1,
			pageSize: 10,
			showEditModal: false,
			editingReview: {},
			editingIndex: -1,
			// uni-easyinput 样式配置
			modalInputStyles: {
				borderRadius: '8px',
				borderColor: '#d1d5db',
				fontSize: '16px',
				padding: '12px 16px'
			},
			modalTextareaStyles: {
				borderRadius: '8px',
				borderColor: '#d1d5db',
				fontSize: '16px',
				padding: '12px 16px'
			}
		};
	},
	computed: {
		totalReviews() {
			const total = this.localData.length;
			console.log('📊 [ReviewManagement] computed.totalReviews - 计算总评价数:', total);
			return total;
		},
		totalPages() {
			const total = Math.ceil(this.totalReviews / this.pageSize);
			console.log('📊 [ReviewManagement] computed.totalPages - 计算总页数:', total, '(每页', this.pageSize, '条)');
			return total;
		},
		paginatedReviews() {
			const start = (this.currentPage - 1) * this.pageSize;
			const end = start + this.pageSize;
			const result = this.localData.slice(start, end);
			console.log('📊 [ReviewManagement] computed.paginatedReviews - 分页数据计算:');
			console.log('  - 当前页:', this.currentPage);
			console.log('  - 起始索引:', start);
			console.log('  - 结束索引:', end);
			console.log('  - 返回数据长度:', result.length);
			return result;
		},
		averageRating() {
			if (this.localData.length === 0) {
				console.log('📊 [ReviewManagement] computed.averageRating - 无评价数据，返回0');
				return 0;
			}
			const sum = this.localData.reduce((acc, review) => acc + review.rating, 0);
			const average = sum / this.localData.length;
			console.log('📊 [ReviewManagement] computed.averageRating - 平均评分计算:');
			console.log('  - 总分:', sum);
			console.log('  - 评价数:', this.localData.length);
			console.log('  - 平均分:', average);
			return average;
		},
		aiReviewsCount() {
			const count = this.localData.filter((review) => review.is_ai).length;
			console.log('📊 [ReviewManagement] computed.aiReviewsCount - AI评价数量:', count);
			return count;
		},
		realReviewsCount() {
			const count = this.localData.filter((review) => !review.is_ai).length;
			console.log('📊 [ReviewManagement] computed.realReviewsCount - 真实评价数量:', count);
			return count;
		}
	},
	watch: {
		reviewData: {
			handler(newVal, oldVal) {
				console.log('👁️ [ReviewManagement] watch.reviewData - 检测到reviewData变化');
				console.log('👁️ [ReviewManagement] watch.reviewData - 旧数据长度:', oldVal ? oldVal.length : 'undefined');
				console.log('👁️ [ReviewManagement] watch.reviewData - 新数据长度:', newVal ? newVal.length : 'undefined');
				console.log('👁️ [ReviewManagement] watch.reviewData - 新数据详情:', JSON.stringify(newVal, null, 2));

				this.localData = [...newVal];

				console.log('✅ [ReviewManagement] watch.reviewData - localData已更新');
				console.log('✅ [ReviewManagement] watch.reviewData - 更新后localData长度:', this.localData.length);
				console.log('✅ [ReviewManagement] watch.reviewData - 更新后localData:', JSON.stringify(this.localData, null, 2));
			},
			deep: true,
			immediate: true
		}
	},
	created() {
		console.log('🎬 [ReviewManagement] created() - 组件创建完成');
		console.log('🎬 [ReviewManagement] created() - 接收的props:');
		console.log('  - productId:', this.productId);
		console.log('  - reviewData类型:', typeof this.reviewData);
		console.log('  - reviewData长度:', this.reviewData ? this.reviewData.length : 'undefined');
		console.log('🎬 [ReviewManagement] created() - 初始reviewData详情:', JSON.stringify(this.reviewData, null, 2));
		console.log('🎬 [ReviewManagement] created() - 初始localData长度:', this.localData.length);
		console.log('🎬 [ReviewManagement] created() - 初始localData详情:', JSON.stringify(this.localData, null, 2));
		console.log('🎬 [ReviewManagement] created() - 组件初始化参数:');
		console.log('  - currentPage:', this.currentPage);
		console.log('  - pageSize:', this.pageSize);
		console.log('  - showEditModal:', this.showEditModal);
		console.log('✅ [ReviewManagement] created() - 组件创建阶段完成');
	},
	methods: {
		updateData() {
			console.log('📤 [ReviewManagement] updateData() - 开始发送数据更新事件');
			console.log('📤 [ReviewManagement] updateData() - 当前localData长度:', this.localData.length);
			console.log('📤 [ReviewManagement] updateData() - 发送的数据:', JSON.stringify(this.localData, null, 2));
			this.$emit('update', this.localData);
			console.log('✅ [ReviewManagement] updateData() - 数据更新事件发送完成');
		},

		// 分页
		changePage(page) {
			console.log('📖 [ReviewManagement] changePage() - 开始切换页码');
			console.log('📖 [ReviewManagement] changePage() - 目标页码:', page);
			console.log('📖 [ReviewManagement] changePage() - 当前页码:', this.currentPage);
			console.log('📖 [ReviewManagement] changePage() - 总页数:', this.totalPages);
			console.log('📖 [ReviewManagement] changePage() - 页码有效性检查:', page >= 1 && page <= this.totalPages);

			if (page >= 1 && page <= this.totalPages) {
				this.currentPage = page;
				console.log('✅ [ReviewManagement] changePage() - 页码切换成功，新页码:', this.currentPage);
				console.log('📖 [ReviewManagement] changePage() - 新页面数据长度:', this.paginatedReviews.length);
			} else {
				console.warn('⚠️ [ReviewManagement] changePage() - 页码超出范围，切换失败');
			}
		},

		// 格式化日期
		formatDate(dateStr) {
			if (!dateStr) return '';
			const date = new Date(dateStr);
			return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN');
		},

		// 生成AI评价
		async generateAIReviews() {
			console.log('🤖 [ReviewManagement] generateAIReviews() - 开始生成AI评价');
			console.log('🤖 [ReviewManagement] generateAIReviews() - 当前productId:', this.productId);
			console.log('🤖 [ReviewManagement] generateAIReviews() - 生成前localData长度:', this.localData.length);

			uni.showLoading({ title: '生成中...' });

			try {
				// 模拟AI评价生成
				const aiReviews = this.generateMockAIReviews(5);
				console.log('🤖 [ReviewManagement] generateAIReviews() - 生成的AI评价数量:', aiReviews.length);
				console.log('🤖 [ReviewManagement] generateAIReviews() - 生成的AI评价数据:', JSON.stringify(aiReviews, null, 2));

				this.localData.unshift(...aiReviews);
				console.log('🤖 [ReviewManagement] generateAIReviews() - 添加后localData长度:', this.localData.length);

				this.updateData();

				uni.showToast({
					title: '生成成功',
					icon: 'success'
				});
				console.log('✅ [ReviewManagement] generateAIReviews() - AI评价生成成功');
			} catch (error) {
				console.error('❌ [ReviewManagement] generateAIReviews() - 生成AI评价失败:', error);
				uni.showToast({
					title: '生成失败',
					icon: 'none'
				});
			} finally {
				uni.hideLoading();
				console.log('🔚 [ReviewManagement] generateAIReviews() - 方法执行完成');
			}
		},

		// 生成模拟AI评价
		generateMockAIReviews(count) {
			console.log('🎲 [ReviewManagement] generateMockAIReviews() - 开始生成模拟数据');
			console.log('🎲 [ReviewManagement] generateMockAIReviews() - 生成数量:', count);
			console.log('🎲 [ReviewManagement] generateMockAIReviews() - 目标产品ID:', this.productId);

			const reviews = [];

			for (let i = 0; i < count; i++) {
				const selectedName = names[Math.floor(Math.random() * names.length)];
				const selectedContent = contents[Math.floor(Math.random() * contents.length)];
				const selectedRating = Math.floor(Math.random() * 2) + 4; // 4-5星

				const review = {
					review_id: `ai_${Date.now()}_${i}`,
					product_id: this.productId,
					user_id: `user_${Math.random().toString(36).substr(2, 9)}`,
					user_name: selectedName,
					rating: selectedRating,
					content: selectedContent,
					images: [],
					is_ai: true,
					status: 1,
					created_at: new Date().toISOString()
				};

				console.log(`🎲 [ReviewManagement] generateMockAIReviews() - 生成第${i + 1}条评价:`, {
					review_id: review.review_id,
					user_name: review.user_name,
					rating: review.rating,
					content: review.content.substring(0, 20) + '...'
				});

				reviews.push(review);
			}

			console.log('✅ [ReviewManagement] generateMockAIReviews() - 模拟数据生成完成，总数:', reviews.length);
			return reviews;
		},

		// 添加手动评价
		addManualReview() {
			console.log('➕ [ReviewManagement] addManualReview() - 开始添加手动评价');
			console.log('➕ [ReviewManagement] addManualReview() - 当前productId:', this.productId);

			this.editingReview = {
				review_id: `manual_${Date.now()}`,
				product_id: this.productId,
				user_id: '',
				user_name: '',
				rating: 5,
				content: '',
				images: [],
				is_ai: false,
				status: 1,
				created_at: new Date().toISOString()
			};
			this.editingIndex = -1;

			console.log('➕ [ReviewManagement] addManualReview() - 初始化编辑数据:', JSON.stringify(this.editingReview, null, 2));
			console.log('➕ [ReviewManagement] addManualReview() - editingIndex设置为:', this.editingIndex);

			this.showEditModal = true;
			console.log('✅ [ReviewManagement] addManualReview() - 打开编辑弹窗');
		},

		// 编辑评价
		editReview(review) {
			console.log('✏️ [ReviewManagement] editReview() - 开始编辑评价');
			console.log('✏️ [ReviewManagement] editReview() - 被编辑的评价数据:', JSON.stringify(review, null, 2));

			this.editingReview = { ...review };
			console.log('✏️ [ReviewManagement] editReview() - 复制到editingReview:', JSON.stringify(this.editingReview, null, 2));

			this.editingIndex = this.localData.findIndex((r) => r.review_id === review.review_id);
			console.log('✏️ [ReviewManagement] editReview() - 找到的索引editingIndex:', this.editingIndex);
			console.log('✏️ [ReviewManagement] editReview() - localData总长度:', this.localData.length);

			this.showEditModal = true;
			console.log('✅ [ReviewManagement] editReview() - 打开编辑弹窗');
		},

		// 保存评价
		saveReview() {
			console.log('💾 [ReviewManagement] saveReview() - 开始保存评价');
			console.log('💾 [ReviewManagement] saveReview() - 待保存的评价数据:', JSON.stringify(this.editingReview, null, 2));
			console.log('💾 [ReviewManagement] saveReview() - editingIndex:', this.editingIndex);
			console.log('💾 [ReviewManagement] saveReview() - 操作类型:', this.editingIndex === -1 ? '新增' : '编辑');

			if (!this.editingReview.user_name || !this.editingReview.content) {
				console.warn('⚠️ [ReviewManagement] saveReview() - 数据验证失败，缺少必要信息');
				console.warn('⚠️ [ReviewManagement] saveReview() - user_name:', this.editingReview.user_name);
				console.warn('⚠️ [ReviewManagement] saveReview() - content:', this.editingReview.content);
				uni.showToast({
					title: '请填写完整信息',
					icon: 'none'
				});
				return;
			}

			console.log('✅ [ReviewManagement] saveReview() - 数据验证通过');
			console.log('💾 [ReviewManagement] saveReview() - 保存前localData长度:', this.localData.length);

			if (this.editingIndex === -1) {
				// 新增
				console.log('➕ [ReviewManagement] saveReview() - 执行新增操作');
				this.localData.unshift(this.editingReview);
				console.log('➕ [ReviewManagement] saveReview() - 新增后localData长度:', this.localData.length);
			} else {
				// 编辑
				console.log('✏️ [ReviewManagement] saveReview() - 执行编辑操作');
				console.log('✏️ [ReviewManagement] saveReview() - 替换索引:', this.editingIndex);
				console.log('✏️ [ReviewManagement] saveReview() - 原数据:', JSON.stringify(this.localData[this.editingIndex], null, 2));
				this.localData.splice(this.editingIndex, 1, this.editingReview);
				console.log('✏️ [ReviewManagement] saveReview() - 替换后数据:', JSON.stringify(this.localData[this.editingIndex], null, 2));
			}

			console.log('💾 [ReviewManagement] saveReview() - 调用updateData()更新父组件');
			this.updateData();

			console.log('💾 [ReviewManagement] saveReview() - 关闭编辑弹窗');
			this.closeEditModal();

			uni.showToast({
				title: '保存成功',
				icon: 'success'
			});
			console.log('✅ [ReviewManagement] saveReview() - 评价保存完成');
		},

		// 关闭编辑弹窗
		closeEditModal() {
			console.log('❌ [ReviewManagement] closeEditModal() - 开始关闭编辑弹窗');
			console.log('❌ [ReviewManagement] closeEditModal() - 关闭前editingReview:', JSON.stringify(this.editingReview, null, 2));
			console.log('❌ [ReviewManagement] closeEditModal() - 关闭前editingIndex:', this.editingIndex);

			this.showEditModal = false;
			this.editingReview = {};
			this.editingIndex = -1;

			console.log('✅ [ReviewManagement] closeEditModal() - 编辑弹窗已关闭，数据已重置');
		},

		// 更新评价状态
		updateReviewStatus(review) {
			console.log('🔄 [ReviewManagement] updateReviewStatus() - 开始更新评价状态');
			console.log('🔄 [ReviewManagement] updateReviewStatus() - 评价ID:', review.review_id);
			console.log('🔄 [ReviewManagement] updateReviewStatus() - 新状态:', review.status);
			console.log(
				'🔄 [ReviewManagement] updateReviewStatus() - 状态含义:',
				review.status === 0 ? '待审核' : review.status === 1 ? '已发布' : review.status === 2 ? '已隐藏' : '未知状态'
			);
			console.log('🔄 [ReviewManagement] updateReviewStatus() - 更新的评价数据:', JSON.stringify(review, null, 2));

			this.updateData();
			console.log('✅ [ReviewManagement] updateReviewStatus() - 评价状态更新完成');
		},

		// 删除评价
		deleteReview(review, index) {
			console.log('🗑️ [ReviewManagement] deleteReview() - 开始删除评价');
			console.log('🗑️ [ReviewManagement] deleteReview() - 待删除评价ID:', review.review_id);
			console.log('🗑️ [ReviewManagement] deleteReview() - 待删除评价数据:', JSON.stringify(review, null, 2));
			console.log('🗑️ [ReviewManagement] deleteReview() - 页面索引index:', index);
			console.log('🗑️ [ReviewManagement] deleteReview() - 删除前localData长度:', this.localData.length);

			uni.showModal({
				title: '确认删除',
				content: '确定要删除这条评价吗？',
				success: (res) => {
					console.log('🗑️ [ReviewManagement] deleteReview() - 用户选择结果:', res.confirm ? '确认删除' : '取消删除');

					if (res.confirm) {
						const globalIndex = this.localData.findIndex((r) => r.review_id === review.review_id);
						console.log('🗑️ [ReviewManagement] deleteReview() - 找到的全局索引globalIndex:', globalIndex);

						if (globalIndex !== -1) {
							console.log('🗑️ [ReviewManagement] deleteReview() - 执行删除操作');
							console.log('🗑️ [ReviewManagement] deleteReview() - 被删除的数据:', JSON.stringify(this.localData[globalIndex], null, 2));

							this.localData.splice(globalIndex, 1);
							console.log('🗑️ [ReviewManagement] deleteReview() - 删除后localData长度:', this.localData.length);

							this.updateData();

							// 调整当前页
							console.log('🗑️ [ReviewManagement] deleteReview() - 检查分页调整');
							console.log('🗑️ [ReviewManagement] deleteReview() - 当前页paginatedReviews长度:', this.paginatedReviews.length);
							console.log('🗑️ [ReviewManagement] deleteReview() - 当前页码:', this.currentPage);

							if (this.paginatedReviews.length === 0 && this.currentPage > 1) {
								this.currentPage--;
								console.log('🗑️ [ReviewManagement] deleteReview() - 调整页码到:', this.currentPage);
							}

							console.log('✅ [ReviewManagement] deleteReview() - 评价删除完成');
						} else {
							console.error('❌ [ReviewManagement] deleteReview() - 未找到要删除的评价，globalIndex为-1');
						}
					}
				}
			});
		}
	}
};
</script>

<style scoped>
/* 行截断 */
.line-clamp-3 {
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

/* 移动端响应式 */
@media (max-width: 768px) {
	.table-responsive {
		font-size: 0.9rem;
	}

	.grid {
		grid-template-columns: repeat(2, 1fr);
	}
}
</style>
