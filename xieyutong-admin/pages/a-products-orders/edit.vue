<template>
	<view class="bg-gray-50 font-microsoft" :class="activeTab === 1 ? 'h-[50vh]' : 'min-h-screen'">
		<!-- 页面头部 -->
		<view class="bg-white shadow-sm border-b border-gray-200">
			<view class="max-w-7xl mx-auto px-6 py-4">
				<view class="flex items-center justify-between">
					<view class="flex items-center space-x-4">
						<button @click="goBack" class="flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors">
							<i class="fas fa-arrow-left text-lg mr-2"></i>
							<text class="text-lg font-medium">返回列表</text>
						</button>
						<view class="h-6 w-px bg-gray-300"></view>
						<view>
							<text class="text-2xl font-bold text-gray-900">商品详情管理</text>
							<text v-if="formData.title" class="block text-sm text-gray-500 mt-1">{{ formData.title }}</text>
						</view>
					</view>
					<view class="flex items-center space-x-3">
						<button @click="saveProduct" class="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium">
							<i class="fas fa-save mr-2"></i>
							保存更改
						</button>
					</view>
				</view>
			</view>
		</view>

		<!-- 标签导航 -->
		<view class="bg-white border-b border-gray-200">
			<view class="max-w-7xl mx-auto px-10">
				<view class="flex">
					<button
						v-for="(tab, index) in tabs"
						:key="index"
						@click="activeTab = index"
						:class="[
							'flex-1 relative py-2 px-4 text-lg font-medium transition-colors text-center',
							activeTab === index ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
						]">
						<i :class="tab.icon" class="mr-2"></i>
						{{ tab.name }}
					</button>
				</view>
			</view>
		</view>

		<!-- 主要内容区域 -->
		<view class="max-w-7xl mx-auto px-6 py-3">
			<!-- 商品信息标签 -->
			<view v-if="activeTab === 0" class="space-y-8">
				<ProductInfo :productData="formData" @update="updateProductData" />
			</view>

			<!-- 行程管理标签 -->
			<view v-else-if="activeTab === 1" class="space-y-8">
				<ItineraryManagement
					:productId="editType === 'product' ? formDataId : formData.product_id"
					:productCtripId="formData.ctrip_id"
					:itineraryData="itineraryData"
					:editType="editType"
					:snapshotId="editType === 'snapshot' ? formDataId : null"
					@update="updateItineraryData"
					@data-loaded="onItineraryDataLoaded"
					@no-data-found="onItineraryNoDataFound"
					@load-error="onItineraryLoadError"
					@update-partial="handlePartialUpdate" />
			</view>

			<!-- 预定须知标签 -->
			<view v-else-if="activeTab === 2" class="space-y-8">
				<BookingPolicies :productId="editType === 'product' ? formDataId : formData.product_id" :ctripId="formData.ctrip_id" :policyData="policyData" @update="updatePolicyData" />
			</view>

			<!-- 评价管理标签 -->
			<view v-else-if="activeTab === 3" class="space-y-8">
				<ReviewManagement :productId="editType === 'product' ? formDataId : formData.product_id" :ctripId="formData.ctrip_id" :reviewData="reviewData" @update="updateReviewData" />
			</view>
		</view>

		<!-- 加载遮罩 -->
		<view v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<view class="bg-white rounded-lg p-8 flex items-center space-x-4">
				<view class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></view>
				<text class="text-lg text-gray-700">{{ loadingText }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { validator } from '../../js_sdk/validator/a-products.js';
import ProductInfo from './components/ProductInfo.vue';
import ItineraryManagement from './components/ItineraryManagement.vue';
import BookingPolicies from './components/BookingPolicies.vue';
import ReviewManagement from './components/ReviewManagement.vue';
import { toRaw } from 'vue';

const db = uniCloud.database();
console.log('🔌 [产品编辑页] 数据库连接初始化:', db ? '✅ 成功' : '❌ 失败');

export default {
	components: {
		ProductInfo,
		ItineraryManagement,
		BookingPolicies,
		ReviewManagement
	},
	data() {
		return {
			loading: false,
			loadingText: '加载中...',
			activeTab: 0,
			formDataId: '',
			editType: 'product',
			tabs: [
				{ name: '商品信息', icon: 'fas fa-box' },
				{ name: '行程管理', icon: 'fas fa-route' },
				{ name: '预定须知', icon: 'fas fa-file-contract' },
				{ name: '评价管理', icon: 'fas fa-star' }
			],
			formData: {
				product_id: '',
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
				price: null,
				child_price: null,
				rating: 5,
				good_rate: 100,
				rating_spec: {
					itinerary: 5,
					accommodation: 5,
					service: 5
				},
				product_images: [],
				detail_images: [],
				duration_days: 1,
				overview: {},
				features: [],
				cost_info: null,
				status: 1,
				sort_order: 0,
				view_count: 0,
				sales_count: 0,
				review_count: 0,
				created_at: null,
				updated_at: null,
				crawl_timestamp: ''
			},
			itineraryData: null,
			policyData: null,
			reviewData: []
		};
	},
	created() {
		console.log('🎬 [产品编辑页] 组件创建完成');
		console.log('🎬 [产品编辑页] 当前环境信息:', {
			platform: uni.getSystemInfoSync().platform,
			uniCloud: !!uniCloud,
			db_available: !!db
		});
	},
	onLoad(e) {
		console.log('🚀 [产品编辑页] 页面加载 onLoad 参数:', e);

		if (e.id) {
			this.formDataId = e.id;
			if (e.type) {
				this.editType = e.type;
			}
			console.log('✅ [产品编辑页] 获取到商品ID:', e.id);
			this.loadAllData(e.id);
		} else {
			console.error('❌ [产品编辑页] 缺少商品ID参数');
			this.$confirm('缺少商品ID参数，无法加载商品数据', '参数错误', {
				confirmButtonText: '确定',
				showCancelButton: false,
				type: 'error'
			}).then(() => {
				uni.navigateBack();
			});
		}
	},
	methods: {
		// 加载所有相关数据
		async loadAllData(id) {
			console.log('📊 [产品编辑页] 开始加载所有数据, 商品ID:', id);
			this.loading = true;
			this.loadingText = '加载商品数据...';

			try {
				let productId = '';
				let ctripId = '';

				if (this.editType === 'product') {
					this.loadingText = '加载商品数据...';
					const productData = await this.getProductDetail(id); // 从 a-products 加载
					productId = productData._id;
					ctripId = productData.ctrip_id;
				} else if (this.editType === 'snapshot') {
					this.loadingText = '加载快照数据...';
					const snapshotData = await this.getSnapshotDetail(id);
					productId = snapshotData.product_id; // 从快照中获取 product_id
					ctripId = snapshotData.ctrip_id; // 从快照中获取 ctrip_id
				}

				// 并行加载所有数据（行程数据由ItineraryManagement组件自行获取）
				const promises = [this.getPolicyData(productId, ctripId), this.getReviewData(productId, ctripId)];

				const results = await Promise.all(promises);
				console.log('✅ [产品编辑页] 所有数据加载完成, 结果数量:', results.length);

				// 检查加载后的数据状态
				console.log('📋 [产品编辑页] 数据状态检查:');
				console.log('  - 商品基础数据:', this.formData ? '✅ 已加载' : '❌ 未加载');
				console.log('  - 行程数据:', this.itineraryData ? '✅ 已加载' : '❌ 未加载');
				console.log('  - 政策数据:', this.policyData ? '✅ 已加载' : '❌ 未加载');
				console.log('  - 评价数据:', this.reviewData && this.reviewData.length > 0 ? `✅ 已加载(${this.reviewData.length}条)` : '❌ 未加载');
			} catch (error) {
				console.error('💥 [产品编辑页] 数据加载失败:', error);
				this.$confirm(error.message || '数据加载失败', '错误', {
					confirmButtonText: '确定',
					showCancelButton: false,
					type: 'error'
				});
			} finally {
				this.loading = false;
				console.log('🏁 [产品编辑页] 数据加载流程结束');
			}
		},

		// 获取商品详情
		async getProductDetail(id) {
			console.log('📦 [商品详情] 开始获取商品详情, ID:', id);

			try {
				const res = await db.collection('a-products').doc(id).get();
				console.log('📦 [商品详情] 数据库查询结果:', res);
				console.log('📦 [商品详情] 查询状态 - success:', res.success);
				console.log('📦 [商品详情] 数据数量:', res.result?.data?.length || 0);

				if (res.result.data.length > 0) {
					this.formData = res.result.data[0];
					console.log('✅ [商品详情] 商品数据赋值成功:', {
						ctrip_id: this.formData.ctrip_id,
						title: this.formData.title,
						price: this.formData.price,
						status: this.formData.status
					});
					return this.formData;
				} else {
					console.warn('⚠️ [商品详情] 未找到商品数据, ID:', id);
					this.$message.warning('未找到商品数据');
				}
			} catch (error) {
				console.error('💥 [商品详情] 获取商品详情失败:', error);
				throw error;
			}
		},

		async getSnapshotDetail(id) {
			console.log('📦 [快照详情] 开始获取快照详情, ID:', id);
			try {
				const res = await db.collection('a-snapshots').doc(id).get();
				if (res.result.data.length > 0) {
					const snapshotData = res.result.data[0];

					// 先加载原始商品信息，再用快照信息覆盖
					let baseProduct = {};
					if (snapshotData.product_id) {
						const productRes = await db
							.collection('a-products')
							.doc(snapshotData.product_id)
							.field('_id,product_images,detail_images,overview,cost_info,features') // 只加载快照没有的字段
							.get();
						if (productRes.result.data.length > 0) {
							baseProduct = productRes.result.data[0];
						}
					}

					if (snapshotData.sub_title !== undefined) {
						console.log('📦 [快照详情] 正在标准化: sub_title -> subtitle');
						snapshotData.subtitle = snapshotData.sub_title;
						delete snapshotData.sub_title;
					}

					if (snapshotData.total_days !== undefined) {
						console.log('📦 [快照详情] 正在标准化: total_days -> duration_days');
						snapshotData.duration_days = snapshotData.total_days;
						delete snapshotData.total_days;
					}

					// 合并数据：快照中的字段(如title)会覆盖原始商品的字段
					this.formData = { ...baseProduct, ...snapshotData };
					this.formData._id = snapshotData._id; // 确保 formData 的 _id 是快照的 _id

					console.log('✅ [快照详情] 快照数据赋值成功:', this.formData.title);
					return this.formData; // 返回数据供 loadAllData 使用
				} else {
					throw new Error('未找到快照数据');
				}
			} catch (error) {
				console.error('💥 [快照详情] 获取快照详情失败:', error);
				throw error;
			}
		},

		// 获取政策数据
		async getPolicyData(productId, ctripId) {
			console.log('📋 [政策数据] 开始获取政策数据, product_id:', productId, 'ctrip_id:', ctripId);
			if (!productId && !ctripId) return;
			let whereCondition = '';
			if (productId && ctripId) {
				whereCondition = `product_id == "${productId}" || ctrip_id == "${ctripId}"`;
			} else if (productId) {
				whereCondition = `product_id == "${productId}"`;
			} else {
				whereCondition = `ctrip_id == "${ctripId}"`;
			}

			try {
				const res = await db.collection('a-booking-policies').where(whereCondition).get();
				console.log('📋 [政策数据] 数据库查询结果:', res);
				console.log('📋 [政策数据] 查询状态 - success:', res.success);
				console.log('📋 [政策数据] 数据数量:', res.result?.data?.length || 0);

				if (res.result.data.length > 0) {
					this.policyData = res.result.data[0];
					console.log('✅ [政策数据] 政策数据赋值成功:', {
						title: this.policyData.title,
						refund_policy_length: this.policyData.refund_policy?.length || 0,
						booking_notes_count: this.policyData.booking_notes?.length || 0
					});
				} else {
					console.warn('⚠️ [政策数据] 未找到政策数据, product_id:', productId);
				}
			} catch (error) {
				console.error('💥 [政策数据] 获取政策数据失败:', error);
				throw error;
			}
		},

		// 获取评价数据
		async getReviewData(productId, ctripId) {
			console.log('⭐ [评价数据] 开始获取评价数据, product_id:', productId, 'ctrip_id:', ctripId);

			try {
				let queryCtripId = ctripId;

				if (!queryCtripId && productId) {
					// 如果没有 ctripId, 尝试从 product_id 获取
					const productRes = await db.collection('a-products').doc(productId).field('ctrip_id').get();
					if (productRes.result.data.length > 0) {
						queryCtripId = productRes.result.data[0].ctrip_id;
					}
				}

				if (queryCtripId) {
					const res = await db.collection('a-reviews').where(`ctrip_id == "${queryCtripId}"`).limit(1000).orderBy('created_at', 'desc').get();
					console.log('⭐ [评价数据] 数据库查询结果:', res);
					console.log('⭐ [评价数据] 查询状态 - success:', res.success);
					console.log('⭐ [评价数据] 数据数量:', res.result?.data?.length || 0);

					this.reviewData = res.result.data;
					console.log('✅ [评价数据] 评价数据赋值成功, 评价条数:', this.reviewData.length);

					if (this.reviewData.length > 0) {
						console.log('📊 [评价数据] 评价统计:', {
							总评价数: this.reviewData.length,
							平均评分: (this.reviewData.reduce((sum, item) => sum + (item.rating || 0), 0) / this.reviewData.length).toFixed(1)
						});
					}
				} else {
					console.warn('💥 [评价数据] 获取A线路ID失败');
				}
			} catch (error) {
				console.error('💥 [评价数据] 获取评价数据失败:', error);
				throw error;
			}
		},

		// 保存商品数据 - 最简单的方式
		async saveProduct() {
			await this.updateProductInfo(this.formData);
		},

		// 更新商品基本信息 - 最简单直接的保存方法
		async updateProductInfo(data) {
			console.log('💾 [更新商品] 开始更新, ID:', this.formDataId);
			console.log('💾 [更新商品] 原始数据:', toRaw(data));
			console.log('💾 [更新商品] ID类型和值:', typeof this.formDataId, this.formDataId);

			if (!this.formDataId) {
				console.error('❌ [更新商品] formDataId为空，无法保存');
				this.$message.error('商品ID为空，无法保存');
				return;
			}

			try {
				this.loading = true;
				this.loadingText = '保存中...';

				// 过滤掉不能更新的系统字段和schema中不存在的字段
				const updateData = { ...data };
				delete updateData._id;
				delete updateData.created_at;
				delete updateData.updated_at;
				// 删除schema中不存在的字段
				delete updateData.description;
				delete updateData.target_audience;
				delete updateData.seo_title;
				delete updateData.seo_description;
				delete updateData.seo_keywords;
				delete updateData.product_id;

				const numericFields = ['rating', 'price', 'child_price', 'duration_days', 'view_count', 'sales_count', 'review_count', 'sort_order'];

				// 在提交到数据库前，强制转换所有应该为数字的字段
				numericFields.forEach((field) => {
					if (updateData[field] !== null && updateData[field] !== undefined) {
						updateData[field] = parseFloat(updateData[field]);
					}
				});

				console.log('💾 [更新商品] 过滤后数据:', updateData);
				console.log('💾 [更新商品] 过滤后数据字段数:', Object.keys(updateData).length);
				console.log('💾 [更新商品] 数据库实例:', !!db);

				// 检查是否有数据要更新
				if (Object.keys(updateData).length === 0) {
					console.warn('⚠️ [更新商品] 没有有效字段要更新');
					this.$message.warning('没有有效数据要更新');
					return;
				}

				let collectionName = '';
				if (this.editType === 'product') {
					collectionName = 'a-products';
				} else if (this.editType === 'snapshot') {
					collectionName = 'a-snapshots';

					// subtitle 的反向映射
					if (updateData.subtitle !== undefined) {
						console.log('💾 [更新商品-快照] 正在标准化: subtitle -> sub_title');
						updateData.sub_title = updateData.subtitle;
						delete updateData.subtitle;
					}

					// "天数" 的反向映射
					if (updateData.duration_days !== undefined) {
						console.log('💾 [更新商品-快照] 正在标准化: duration_days -> total_days');
						updateData.total_days = updateData.duration_days;
						delete updateData.duration_days;
					}
				}

				// 直接使用ClientDB保存
				console.log(`🚀 [更新商品] 开始执行数据库更新操作... 集合: ${collectionName}`);
				const result = await db.collection(collectionName).doc(this.formDataId).update(updateData);
				console.log('✅ [更新商品] 保存结果:', result);
				console.log('✅ [更新商品] 结果详情:', {
					success: result.success,
					code: result.result.code,
					errCode: result.result.errCode,
					errMsg: result.result.errMsg,
					affectedDocs: result.result.affectedDocs,
					updated: result.result.updated
				});

				if (result.result.updated > 0) {
					this.$message.success('保存成功');
				} else {
					console.warn('⚠️ [更新商品] 没有文档被更新');
					this.$message.warning('[更新商品] 数据保存成功，但没有内容变化');
				}
			} catch (error) {
				console.error('❌ [更新商品] 保存失败:', error);
				console.error('❌ [更新商品] 错误详情:', {
					name: error.name,
					message: error.message,
					code: error.code,
					stack: error.stack
				});
				this.$message.error('保存失败: ' + (error.message || '未知错误'));
			} finally {
				this.loading = false;
			}
		},

		// 保存行程数据
		async saveItineraryData(data) {
			console.log('💾 [保存行程] 开始保存行程数据');
			console.log('💾 [保存行程] 输入数据:', toRaw(data));
			console.log('💾 [保存行程] 数据验证:', {
				has_product_id: !!data.product_id,
				product_id: data.product_id,
				title_length: data.title?.length || 0,
				total_days: data.total_days,
				features_count: data.features?.length || 0,
				daily_itinerary_count: data.daily_itinerary?.length || 0
			});

			if (!data.product_id) {
				console.error('❌ [保存行程] 缺少product_id，无法保存');
				return;
			}

			try {
				console.log('🔍 [保存行程] 检查现有行程记录...');
				let result;
				let operationType = 'unknown';
				let saveData;

				if (this.editType === 'product') {
					// 检查是否已存在行程记录
					const existQuery = await db.collection('a-itineraries').where(`product_id == "${data.product_id}"`).get();

					console.log('🔍 [保存行程] 查询结果:', existQuery);
					console.log('🔍 [保存行程] 现有记录数量:', existQuery.result.data.length);

					// 准备保存的数据（根据schema定义，需要将组件数据转换为数据库格式）
					const saveData = this.convertComponentToDatabase(data);

					let result;
					if (existQuery.result.data.length > 0) {
						// 更新现有记录
						const existId = existQuery.result.data[0]._id;
						console.log('🔄 [保存行程] 更新现有记录, ID:', existId);

						result = await db.collection('a-itineraries').doc(existId).update(saveData);
						operationType = '更新';
						console.log('✅ [保存行程] 更新完成，结果:', result);
					} else {
						// 创建新记录
						console.log('🆕 [保存行程] 创建新记录');

						result = await db.collection('a-itineraries').add(saveData);
						operationType = '创建';
						console.log('✅ [保存行程] 创建完成，结果:', result);
					}
				} else if (this.editType === 'snapshot') {
					console.log('🔄 [保存行程-快照] 更新现有快照记录, ID:', this.formDataId);
					const saveData = this.convertComponentToDatabase(data);

					// 快照更新只关心行程相关的字段
					const snapshotUpdateData = {
						title: saveData.title,
						total_days: saveData.total_days,
						remarks: saveData.remarks,
						itinerary: saveData.itinerary,
						status: saveData.status
					};

					const result = await db.collection('a-snapshots').doc(this.formDataId).update(snapshotUpdateData);
					operationType = '更新';
					console.log('✅ [保存行程-快照] 更新完成，结果:', result);
				}

				console.log('📝 [保存行程] 准备保存的数据:', saveData);
				console.log('📝 [保存行程] 数据完整性检查:', {
					字段数量: Object.keys(saveData).length,
					必填字段: {
						product_id: !!saveData.product_id,
						title: typeof saveData.title === 'string',
						total_days: typeof saveData.total_days === 'number',
						itinerary_is_array: Array.isArray(saveData.itinerary),
						status: !!saveData.status
					}
				});

				console.log('🎉 [保存行程] 行程数据保存成功');
				console.log('📊 [保存行程] 保存统计:', {
					操作类型: operationType,
					数据大小: JSON.stringify(saveData).length + ' 字符',
					总天数: saveData.total_days,
					行程天数: saveData.itinerary.length,
					状态: saveData.status
				});

				if (result && result.result.updated > 0) {
					this.$message.success('保存成功');
				} else {
					console.warn('⚠️ [保存行程] 没有文档被更新');
					this.$message.warning('[保存行程] 数据保存成功，但没有内容变化');
				}
			} catch (error) {
				console.error('💥 [保存行程] 保存失败:', error);
				console.error('💥 [保存行程] 错误详情:', {
					message: error.message,
					code: error.code,
					stack: error.stack
				});

				// 显示用户友好的错误信息
				this.$message.error('行程保存失败');
			}
		},

		// 将组件数据格式转换为数据库格式
		convertComponentToDatabase(componentData) {
			console.log('🔄 [数据转换] 开始将组件数据转换为数据库格式');
			console.log('🔄 [数据转换] 输入数据:', toRaw(componentData));

			const dbData = {
				product_id: componentData.product_id,
				ctrip_id: componentData.ctrip_id || '', // 携程ID
				title: componentData.title || '',
				total_days: componentData.total_days || 1,
				remarks: componentData.remarks || '', // overview转换为remarks
				itinerary: [], // 将daily_itinerary转换为itinerary
				status: 'active'
			};

			// 转换行程数据
			if (componentData.itinerary && Array.isArray(componentData.itinerary)) {
				console.log('📋 [数据转换] 开始转换行程数据，共', componentData.itinerary.length, '天');

				dbData.itinerary = componentData.itinerary.map((dayData, index) => {
					console.log(`📅 [数据转换] 转换第${index + 1}天:`, toRaw(dayData));

					const dayItem = {
						day: dayData.day || index + 1,
						day_title: dayData.title || `第${index + 1}天`,
						activities: [],
						day_highlights: dayData.day_highlights || '',
						destination_city: dayData.destination_city || ''
					};

					// 转换活动数据
					if (dayData.activities && Array.isArray(dayData.activities)) {
						// dayItem.activities = dayData.activities.map(activity => ({
						//   elementType: 'other', // 默认类型
						//   title: activity.description || '',
						//   location: activity.location || '',
						//   time_type: 'specific',
						//   time_start_time: activity.time || '',
						//   time_duration_hours: null,
						//   time_duration_minutes: null,
						//   time_period: null,
						//   time_remark: null,
						//   driving_distance: 0,
						//   driving_duration_hours: 0,
						//   driving_duration_minutes: 0,
						//   elementData: {
						//     content: activity.description || '',
						//     location: activity.location || ''
						//   }
						// }));
						dayItem.activities = dayData.activities;
					}

					console.log(`✅ [数据转换] 第${index + 1}天转换完成:`, dayItem);
					return dayItem;
				});
			}

			console.log('✅ [数据转换] 数据转换完成');
			console.log('📊 [数据转换] 转换后统计:', {
				总天数: dbData.itinerary.length,
				数据大小: JSON.stringify(dbData).length,
				标题: dbData.title
			});

			return dbData;
		},

		// 返回列表页
		goBack() {
			uni.navigateBack();
		},

		// 更新商品数据 - 只更新本地数据，不自动保存
		updateProductData(data) {
			console.log('🔄 [数据更新] 收到商品数据更新:', toRaw(data));

			// 更新本地数据
			this.formData = { ...this.formData, ...data };

			console.log('✅ [数据更新] 商品数据已更新');
		},

		// 更新行程数据
		updateItineraryData(data) {
			console.log('🔄 [数据更新] 收到行程数据更新:', toRaw(data));
			console.log('🔄 [数据更新] 行程数据变化详情:', {
				timestamp: new Date().toLocaleString(),
				data_size: JSON.stringify(data).length,
				has_product_id: !!data.product_id,
				title: data.title,
				total_days: data.total_days,
				features_count: data.features?.length || 0,
				daily_itinerary_count: data.daily_itinerary?.length || 0,
				data_structure: data
			});

			this.itineraryData = data;
			console.log('✅ [数据更新] 行程数据已更新');

			// 自动保存行程数据
			console.log('🔄 [数据更新] 触发自动保存行程数据');
			this.saveItineraryData(data);
		},

		// 增量更新行程数据
		async handlePartialUpdate({ path, value, operator }) {
			if (!this.itineraryData || !this.itineraryData._id) {
				console.error('❌ [局部更新] 无法执行，缺少行程ID。');
				return;
			}

			// 1. 【修改】导入云对象
			const itineraryService = uniCloud.importObject('a-itinerary-service');

			if (this.editType === 'product') {
				const payload = {
					itineraryId: this.itineraryData._id,
					path,
					value,
					operator
				};

				console.log(`🚀 [局部更新] 准备调用云对象partialUpdateItinerary方法，参数:`, payload);
				uni.showToast({ title: '自动保存中...', icon: 'loading', duration: 1500 });

				try {
					const res = await itineraryService.partialUpdateItinerary(payload);

					if (res.errCode === 0) {
						uni.showToast({ title: '自动保存成功', icon: 'success', duration: 1500 });
						console.log('✅ [局部更新] 云对象方法执行成功');
					} else {
						throw new Error(res.errMsg || '云对象返回错误');
					}
				} catch (error) {
					console.error('💥 [局部更新] 调用云对象失败:', error);
					uni.showToast({ title: `保存失败: ${error.message || '未知错误'}`, icon: 'none', duration: 3000 });
				}
			} else if (this.editType === 'snapshot') {
				const payload = {
					snapshotId: this.formDataId,
					path,
					value,
					operator
				};

				console.log(`🚀 [局部更新] 准备调用云对象partialUpdateSnapshot方法，参数:`, payload);
				uni.showToast({ title: '自动保存中...', icon: 'loading', duration: 1500 });

				try {
					const res = await itineraryService.partialUpdateSnapshot(payload);

					if (res.errCode === 0) {
						uni.showToast({ title: '自动保存成功', icon: 'success', duration: 1500 });
						console.log('✅ [局部更新] 云对象方法执行成功');
					} else {
						throw new Error(res.errMsg || '云对象返回错误');
					}
				} catch (error) {
					console.error('💥 [局部更新] 调用云对象失败:', error);
					uni.showToast({ title: `保存失败: ${error.message || '未知错误'}`, icon: 'none', duration: 3000 });
				}
			}
		},

		// 更新政策数据
		updatePolicyData(data) {
			console.log('🔄 [数据更新] 收到政策数据更新:', data);
			this.policyData = data;
			console.log('✅ [数据更新] 政策数据已更新');
		},

		// 更新评价数据
		updateReviewData(data) {
			console.log('🔄 [数据更新] 收到评价数据更新:', data);
			this.reviewData = data;
			console.log('✅ [数据更新] 评价数据已更新');
		},

		// 行程数据从数据库加载完成
		onItineraryDataLoaded(data) {
			console.log('✅ [行程管理] 数据从数据库加载完成:', toRaw(data));
			console.log('📊 [行程管理] 传递给组件的参数验证:', {
				productId_传递值: this.formData._id,
				productCtripId_传递值: this.formData.ctrip_id,
				商品表_id字段: this.formData._id,
				商品表ctrip_id字段: this.formData.ctrip_id,
				formData_keys: Object.keys(this.formData),
				timestamp: new Date().toLocaleString()
			});
			console.log('📊 [行程管理] 加载的数据统计:', {
				has_product_id: !!data.product_id,
				has_ctrip_id: !!data.ctrip_id,
				title: data.title,
				total_days: data.total_days,
				features_count: data.features?.length || 0,
				daily_itinerary_count: data.daily_itinerary?.length || 0,
				加载时间: new Date().toLocaleString()
			});

			// 更新本地数据
			this.itineraryData = data;

			// 显示成功提示
			this.$message.success('行程数据加载成功');
		},

		// 未找到行程数据
		onItineraryNoDataFound(params) {
			console.log('ℹ️ [行程管理] 未找到匹配的行程数据:', params);
			console.log('ℹ️ [行程管理] 传递的查询参数对比:', {
				Mode: this.editType,
				ProductID: this.editType === 'product' ? this.formDataId : this.formData.product_id,
				CtripID: this.formData.ctrip_id,
				SnapshotID: this.editType === 'snapshot' ? this.formDataId : null,
				timestamp: new Date().toLocaleString()
			});

			// 显示提示信息
			this.$message.warning('未找到行程数据');
		},

		// 行程数据加载错误
		onItineraryLoadError(errorInfo) {
			console.error('❌ [行程管理] 数据加载失败:', errorInfo);
			console.error('❌ [行程管理] 错误详情:', {
				error: errorInfo.error,
				productId: errorInfo.productId || null,
				productCtripId: errorInfo.productCtripId || null,
				timestamp: new Date().toLocaleString()
			});

			// 显示错误提示
			this.$confirm(`无法从数据库加载行程数据：${errorInfo.error.message || '未知错误'}`, '数据加载失败', {
				confirmButtonText: '重试',
				cancelButtonText: '确定',
				type: 'error'
			})
				.then(() => {
					// 用户选择重试，可以在这里触发重新加载
					console.log('🔄 [行程管理] 用户选择重试加载');
					// 由于组件有refresh方法，这里可以考虑添加组件引用并调用
				})
				.catch(() => {
					// 用户选择确定
				});
		}
	}
};
</script>

<style>
/* 微软雅黑字体 */
.font-microsoft {
	font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

/* 确保表格在小屏幕上也能正常显示 */
.table-responsive {
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
}
</style>
