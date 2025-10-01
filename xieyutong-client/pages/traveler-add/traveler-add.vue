<template>
	<view class="page-container">
		<!-- 内容区域 -->
		<view class="content-area">
			<!-- 基本信息表单 -->
			<view class="form-section">
				<view class="section-title">基本信息</view>
				
				<view class="form-item">
					<view class="form-label">
						姓名
						<text class="required-mark">*</text>
					</view>
					<input 
						type="text" 
						class="form-input" 
						placeholder="请输入出行人姓名"
						v-model="formData.name"
					/>
				</view>
				
				<view class="form-item">
					<view class="form-label">
						身份证号
						<text class="required-mark">*</text>
					</view>
					<input 
						type="text" 
						class="form-input" 
						placeholder="请输入身份证号码"
						v-model="formData.idCard"
						@input="onIdCardInput"
						maxlength="18"
					/>
					<view class="form-right">
						<text 
							class="info-tag" 
							v-if="ageType"
							:style="ageTypeStyle"
						>{{ ageType }}</text>
					</view>
				</view>
				
				<view class="form-item">
					<view class="form-label">手机号</view>
					<input 
						type="tel" 
						class="form-input" 
						placeholder="请输入手机号码"
						v-model="formData.phone"
						maxlength="11"
					/>
					<view class="form-right">
						<text class="optional-tag">选填</text>
					</view>
				</view>
			</view>

			<view class="note">
				<text>* 系统将根据身份证信息自动判断出行人类型（12岁以下为儿童，12岁及以上为成人）</text>
			</view>

			<!-- 隐私声明 -->
			<view class="privacy-notice">
				<text>您的个人信息将被严格保密，仅用于提供更好的旅游服务和体验。身份证信息将用于旅游预订和保险服务。</text>
			</view>

			<!-- 提交按钮 -->
			<view class="submit-button" @click="saveTraveler" :style="{ opacity: loading ? 0.5 : 1 }">
				{{ loading ? '保存中...' : '保存' }}
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			formData: {
				name: '',
				idCard: '',
				phone: ''
			},
			ageType: '',
			ageTypeStyle: {},
			loading: false,
			isEditMode: false,
			editId: null
		}
	},
	onLoad(options) {
		// 检查是否为编辑模式
		if (options.id) {
			this.isEditMode = true;
			this.editId = options.id;
			this.loadTravelerData(options.id);
		}
		
		// 设置导航栏标题
		uni.setNavigationBarTitle({
			title: this.isEditMode ? '编辑出行人' : '添加出行人'
		});
	},
	onReady() {
		// 设置导航栏右侧按钮
		// #ifdef H5 || APP-PLUS
		uni.setNavigationBarColor({
			frontColor: '#000000',
			backgroundColor: '#ffffff'
		});
		// #endif
	},
	methods: {
		
		// 加载出行人数据（编辑模式）
		async loadTravelerData(id) {
			try {
				this.loading = true;
				
				// 使用 ClientDB 查询出行人数据
				const db = uniCloud.database();
				const result = await db.collection('a-travelers')
					.where(`_id == "${id}"`)
					.field('_id,name,id_card,phone,type,gender,birthday')
					.get();
				
				console.log('[ClientDB] 查询出行人数据结果:', result);
				
				if (result.result && result.result.data && result.result.data.length > 0) {
					const travelerData = result.result.data[0];
					
					// 填充表单数据
					this.formData = {
						name: travelerData.name || '',
						idCard: travelerData.id_card || '',
						phone: travelerData.phone || ''
					};
					
					// 设置年龄类型和样式
					this.ageType = travelerData.type || '';
					this.updateAgeTypeStyle();
					
					console.log('[ClientDB] 加载出行人数据成功:', travelerData);
				} else {
					console.error('[ClientDB] 未找到出行人信息');
					uni.showToast({
						title: '未找到出行人信息',
						icon: 'none'
					});
					uni.navigateBack();
				}
			} catch (error) {
				console.error('[ClientDB] 加载出行人数据失败:', error);
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				});
			uni.navigateBack();
			} finally {
				this.loading = false;
			}
		},
		
		// 保存出行人
		async saveTraveler() {
			if (this.loading) return;
			
			if (!this.validateForm()) {
				return;
			}
			
			try {
				this.loading = true;
				
				// 检查用户登录状态
				const token = uni.getStorageSync('uni_id_token');
				if (!token) {
					console.error('[ClientDB] 用户未登录');
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					uni.navigateTo({
						url: '/pages/login/login'
					});
					return;
				}

				// 构建保存数据
				const travelerData = {
					name: this.formData.name.trim(),
					id_card: this.formData.idCard.trim(),
					type: this.ageType || '成人',
					status: 'active',
					is_main: false
				};

				// 添加手机号（如果有）
				if (this.formData.phone.trim()) {
					travelerData.phone = this.formData.phone.trim();
				}

				// 从身份证提取生日和性别
				if (this.formData.idCard.length === 18) {
					// 提取生日
					const year = this.formData.idCard.substring(6, 10);
					const month = this.formData.idCard.substring(10, 12);
					const day = this.formData.idCard.substring(12, 14);
					travelerData.birthday = `${year}-${month}-${day}`;

				// 从身份证判断性别
					const genderCode = parseInt(this.formData.idCard.substring(16, 17));
					travelerData.gender = genderCode % 2 === 0 ? '女' : '男';
				}

				console.log('[ClientDB] 保存出行人数据:', travelerData);

				// 使用 ClientDB 保存到数据库
				const db = uniCloud.database();
				let result;
				
				if (this.isEditMode && this.editId) {
					// 编辑模式：使用 ClientDB 更新数据
					result = await db.collection('a-travelers')
						.where(`_id == "${this.editId}"`)
						.update(travelerData);
					console.log('[ClientDB] 更新结果:', result);
				} else {
					// 添加模式：使用 ClientDB 新增数据
					// 注意：user_id 会由 ClientDB 自动填入当前登录用户的ID
					result = await db.collection('a-travelers').add(travelerData);
					console.log('[ClientDB] 添加结果:', result);
				}

				// 检查操作结果
				if (result.result && (result.result.id || result.result.updated)) {
				uni.showToast({
						title: this.isEditMode ? '更新成功' : '保存成功',
					icon: 'success',
					duration: 1500
				});
				
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
				} else {
					throw new Error('数据库操作失败');
				}

			} catch (error) {
				console.error('保存出行人失败:', error);
				uni.showToast({
					title: '保存失败，请重试',
					icon: 'none'
				});
			} finally {
				this.loading = false;
			}
		},
		
		// 表单验证
		validateForm() {
			if (!this.formData.name.trim()) {
				uni.showToast({
					title: '请输入姓名',
					icon: 'none'
				});
				return false;
			}
			
			if (!this.formData.idCard.trim()) {
				uni.showToast({
					title: '请输入身份证号',
					icon: 'none'
				});
				return false;
			}
			
			if (this.formData.idCard.length !== 18) {
				uni.showToast({
					title: '身份证号格式不正确',
					icon: 'none'
				});
				return false;
			}

			// 验证身份证号格式
			const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
			if (!idCardRegex.test(this.formData.idCard)) {
				uni.showToast({
					title: '身份证号格式不正确',
					icon: 'none'
				});
				return false;
			}

			// 验证手机号（选填，但如果填写了需要格式正确）
			if (this.formData.phone.trim()) {
				const phoneRegex = /^1[3-9]\d{9}$/;
				if (!phoneRegex.test(this.formData.phone.trim())) {
					uni.showToast({
						title: '手机号格式不正确',
						icon: 'none'
					});
					return false;
				}
			}
			
			return true;
		},
		
		// 更新年龄类型样式
		updateAgeTypeStyle() {
			if (this.ageType === '儿童') {
				this.ageTypeStyle = {
					backgroundColor: 'rgba(255, 149, 0, 0.1)',
					color: '#FF9500'
				};
			} else if (this.ageType === '成人') {
				this.ageTypeStyle = {
					backgroundColor: 'rgba(0, 134, 246, 0.1)',
					color: '#0086F6'
				};
			} else {
				this.ageTypeStyle = {};
			}
		},
		
		// 身份证输入事件，自动判断成人/儿童
		onIdCardInput(e) {
			const idCard = e.detail.value.trim();
			
			// 当身份证号达到18位时，进行判断
			if (idCard.length === 18) {
				try {
					// 从身份证提取出生日期
					const year = parseInt(idCard.substring(6, 10));
					const month = parseInt(idCard.substring(10, 12));
					const day = parseInt(idCard.substring(12, 14));
					
					// 计算年龄
					const birthDate = new Date(year, month - 1, day);
					const today = new Date();
					let age = today.getFullYear() - birthDate.getFullYear();
					
					// 调整年龄（如果今年的生日还没到）
					const monthDiff = today.getMonth() - birthDate.getMonth();
					if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
						age--;
					}
					
					// 显示年龄类型
					if (age < 12) {
						this.ageType = '儿童';
					} else {
						this.ageType = '成人';
					}
					
					// 更新样式
					this.updateAgeTypeStyle();
				} catch (e) {
					this.ageType = '';
				}
			} else {
				this.ageType = '';
			}
		}
	}
}
</script>

<style>
@import url('/static/css/awesome-font.css');
@import url('/static/css/tailwind.css');

.page-container {
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	background-color: #F5F7FA;
	color: #333333;
	min-height: 100vh;
}

.content-area {
	padding: 16px;
}

.form-section {
	background-color: white;
	border-radius: 12px;
	padding: 16px;
	margin-bottom: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
	font-size: 16px;
	font-weight: 600;
	margin-bottom: 16px;
	color: #333333;
}

.form-item {
	padding: 12px 0;
	border-bottom: 1px solid #f0f0f0;
	display: flex;
	align-items: center;
}

.form-item:last-child {
	border-bottom: none;
}

.form-label {
	width: 80px;
	font-size: 15px;
	color: #666666;
}

.form-input {
	flex: 1;
	border: none;
	outline: none;
	font-size: 15px;
	color: #333333;
	background: transparent;
}

.form-input::placeholder {
	color: #999999;
}

.form-right {
	color: #999999;
	font-size: 14px;
	display: flex;
	align-items: center;
}

.optional-tag {
	background-color: #f0f0f0;
	color: #999999;
	font-size: 12px;
	padding: 2px 6px;
	border-radius: 4px;
	margin-left: 8px;
}

.info-tag {
	font-size: 12px;
	padding: 2px 6px;
	border-radius: 4px;
	margin-left: 8px;
}

.privacy-notice {
	font-size: 13px;
	color: #999999;
	padding: 0 16px;
	line-height: 1.5;
	margin-top: 24px;
}

.submit-button {
	background-color: #0086F6;
	color: white;
	border-radius: 12px;
	padding: 14px;
	font-size: 16px;
	font-weight: 500;
	text-align: center;
	margin-top: 24px;
	box-shadow: 0 4px 12px rgba(0, 134, 246, 0.2);
}

.note {
	font-size: 13px;
	color: #666666;
	margin-top: 8px;
	padding: 0 16px;
}

.required-mark {
	color: #FF3B30;
	font-size: 14px;
	margin-left: 2px;
}
</style> 