<template>
	<view class="min-h-screen bg-gray-50">
		<view class="page-header" id="page-header">
			<view class="status-bar-safe-area" :style="{ height: statusBarHeight + 'px' }"></view>
			<view class="top-nav-bar">
				<view class="back-btn" @click="goBack">
					<image src="/static/icons/chevron-left.svg" class="back-icon" mode="aspectFit" />
				</view>
				<view class="page-title">高端定制</view>
			</view>
		</view>

		<scroll-view scroll-y class="main-scroll-area" :style="{ paddingTop: headerHeight + 'px' }">
			<view class="banner-container">
				<image src="https://mp-518245e5-51c5-4ee4-8c3f-47f1c20358ab.cdn.bspapp.com/static/customize-banner.png" class="banner-img" mode="aspectFill"></image>
				<view class="banner-overlay"></view>
				<view class="banner-text">
					<view class="banner-title">西藏 · 心之所向</view>
					<view class="banner-subtitle">专属行程，为你而定</view>
				</view>
			</view>

			<view class="form-section">
				<view class="form-card">
					<view class="form-grid">
						<view class="grid-item">
							<view class="input-label">
								<text>目的地</text>
							</view>
							<view class="input-wrapper">
								<input class="custom-input" type="text" placeholder="请输入您的目的地" v-model="formData.destination" />
							</view>
						</view>

						<view class="grid-item">
							<view class="input-label">
								<text>联系人</text>
							</view>
							<view class="input-wrapper">
								<input class="custom-input" type="text" placeholder="请输入联系人姓名" v-model="formData.contactPerson" />
							</view>
						</view>

						<view class="grid-item">
							<view class="input-label">
								<text>出行人数</text>
							</view>
							<view class="input-wrapper">
								<input class="custom-input" type="number" placeholder="请输入出行人数" v-model="formData.travelers" />
							</view>
						</view>

						<view class="grid-item">
							<view class="input-label">
								<text>出行天数</text>
							</view>
							<view class="input-wrapper">
								<input class="custom-input" type="number" placeholder="请输入出行天数" v-model="formData.days" />
							</view>
						</view>

						<view class="grid-item full-width">
							<view class="input-label">
								<text>联系方式</text>
							</view>
							<view class="input-wrapper">
								<input class="custom-input" type="number" placeholder="请输入手机号码" v-model="formData.contactInfo" />
							</view>
						</view>
					</view>

					<view class="submit-btn-container">
						<button class="submit-btn" @click="handleSubmit">开始专属定制</button>
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
			statusBarHeight: 0,
			headerHeight: 0,
			formData: {
				destination: '',
				contactPerson: '',
				travelers: '',
				days: '',
				contactInfo: ''
			}
		};
	},
	onLoad() {
		// 获取系统信息，用于设置导航栏高度
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = systemInfo.statusBarHeight || 0;
	},
	onReady() {
		// 计算导航栏高度，用于设置scroll-view的padding-top
		try {
			const query = uni.createSelectorQuery().in(this);
			query
				.select('#page-header')
				.boundingClientRect((data) => {
					if (data) {
						this.headerHeight = data.height;
					}
				})
				.exec();
		} catch (e) {
			console.error('计算头部高度失败:', e);
		}
	},
	methods: {
		// 返回上一页
		goBack() {
			uni.navigateBack({
				delta: 1
			});
		},
		// 提交表单
		handleSubmit() {
			console.log('提交的表单数据:', this.formData);
			uni.showToast({
				title: '提交成功，我们将尽快与您联系',
				icon: 'success'
			});
			// 这里可以添加后续的数据提交逻辑
		}
	}
};
</script>

<style lang="scss" scoped>
.min-h-screen {
	min-height: 100vh;
}

.bg-gray-50 {
	background-color: #f9fafb;
}

/* 导航栏样式 */
.page-header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background-color: #ffffff;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

	.top-nav-bar {
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;

		.back-btn {
			position: absolute;
			left: 10px;
			display: flex;
			align-items: center;
			height: 100%;
			padding: 0 10px;

			.back-icon {
				width: 20px;
				height: 20px;
				filter: brightness(0);
			}
		}

		.page-title {
			font-size: 17px;
			font-weight: 600;
			color: #333;
		}
	}
}

/* 主要内容区域样式 */
.main-scroll-area {
	height: 100vh;
	box-sizing: border-box;
}

/* Banner 样式 */
.banner-container {
	position: relative;
	width: 100%;
	height: 260px;

	.banner-img {
		width: 100%;
		height: 100%;
	}

	.banner-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0.6) 100%);
	}

	.banner-text {
		position: absolute;
		bottom: 30px;
		left: 24px;
		color: #ffffff;

		.banner-title {
			font-size: 28px;
			font-weight: 800;
			margin-bottom: 8px;
			letter-spacing: 1px;
		}

		.banner-subtitle {
			font-size: 16px;
			font-weight: 500;
			opacity: 0.95;
		}
	}
}

/* 表单区域样式 - 修改了位置和间距 */
.form-section {
	position: relative;
	padding: 20px 16px 30px;

	.form-card {
		background-color: #ffffff;
		border-radius: 20px;
		padding: 24px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05); // 调整了阴影使其更柔和
	}
}

/* 网格布局 */
.form-grid {
	display: flex;
	flex-wrap: wrap;
	margin-left: -10px;
	margin-right: -10px;

	.grid-item {
		width: 50%; // 两列布局
		padding: 0 10px;
		margin-bottom: 20px;
		box-sizing: border-box;

		&.full-width {
			width: 100%;
		}
	}
}

/* 输入框样式 */
.input-label {
	display: flex;
	align-items: center;
	margin-bottom: 8px;
	color: #333;
	font-weight: 500;
	font-size: 14px;
}

.input-wrapper {
	background-color: #f5f7fa;
	border-radius: 12px;
	padding: 12px 16px;
	transition: all 0.3s ease;

	&:focus-within {
		background-color: #fff;
		box-shadow: 0 0 0 2px rgba(179, 139, 93, 0.2); // 聚焦时的金色边框
	}
}

.custom-input {
	width: 100%;
	font-size: 15px;
	color: #333;
	border: none;
	background: transparent;
	height: 24px;

	&::placeholder {
		color: #999;
	}
}

.submit-btn-container {
	margin-top: 10px;

	.submit-btn {
		width: 100%;
		height: 50px;
		line-height: 50px;
		background: #b38b5d;
		color: #ffffff;
		font-size: 18px;
		font-weight: bold;
		border-radius: 25px;
		border: none;
		box-shadow: 0 4px 12px rgba(179, 139, 93, 0.3);
		transition: all 0.3s ease;

		&:active {
			transform: translateY(2px);
			box-shadow: 0 2px 6px rgba(179, 139, 93, 0.3);
		}

		&::after {
			border: none;
		}
	}
}
</style>
