<template>
	<view class="page-container">
		<view class="status-bar-safe-area"></view>
		<view class="nav-bar">
			<text class="nav-title">私导专属性格测试</text>
		</view>

		<block v-if="!showResult">
			<view class="progress-bar">
				<view class="progress-inner" :style="{ width: (currentStep / questions.length) * 100 + '%' }"></view>
			</view>

			<view class="quiz-card fade-in">
				<view class="question-header">
					<text class="q-index">Q{{ currentStep }}.</text>
					<text class="q-title">{{ currentQuestion.title }}</text>
				</view>

				<view class="options-list">
					<view class="option-item" v-for="(opt, key) in currentQuestion.options" :key="key" :class="{ active: answers[currentStep] === key }" @click="selectOption(key)">
						<text class="opt-tag">{{ key }}</text>
						<text class="opt-text">{{ opt }}</text>
					</view>
				</view>
			</view>

			<view class="btn-area">
				<button class="back-btn" @click="prevStep" v-if="currentStep > 1">上一题</button>

				<button class="next-btn" @click="nextStep" :disabled="!answers[currentStep]">
					{{ currentStep === questions.length ? '查看结果' : '下一题' }}
				</button>
			</view>
		</block>

		<block v-else>
			<view class="result-container fade-in-up">
				<view class="result-card">
					<view class="result-icon-box" :class="resultData.typeKey">
						<uni-icons :type="resultData.icon" size="48" color="#fff"></uni-icons>
					</view>

					<view class="result-title">{{ resultData.title }}</view>
					<view class="result-tag">{{ resultData.tag }}</view>

					<view class="result-divider"></view>

					<view class="result-desc">
						<text>{{ resultData.desc }}</text>
					</view>
				</view>

				<view class="warm-message">
					<view class="quote-icon left">“</view>
					<text>愿你一路平安，接单顺畅\n平安喜乐，万事顺遂～</text>
					<view class="quote-icon right">”</view>
				</view>

				<view class="btn-area">
					<button class="submit-btn" @click="confirmSubmit" :loading="isSubmitting">开启私导之旅</button>
				</view>
			</view>
		</block>
	</view>
</template>

<script>
const db = uniCloud.database();

export default {
	data() {
		return {
			currentStep: 1,
			answers: {},
			showResult: false, // 控制是否显示结果页
			isSubmitting: false,
			finalTypeResult: '', // 最终计算出的类型字符串（存库用）

			// 结果配置映射
			resultMap: {
				A: {
					typeKey: 'type-a',
					title: '沉稳靠谱型',
					tag: '安全感满分 · 责任心强',
					desc: '开车稳、责任心强，乘客安全感拉满，口碑超好回头客多！',
					icon: 'hand-up-filled'
				},
				B: {
					typeKey: 'type-b',
					title: '果断干练型',
					tag: '效率达人 · 反应迅速',
					desc: '反应快、效率高，遇事会解决，接单顺畅超省心！',
					icon: 'fire-filled'
				},
				C: {
					typeKey: 'type-c',
					title: '随和灵活型',
					tag: '高情商 · 服务舒适',
					desc: '脾气好、情商高，服务舒服，人缘好乘客都满意！',
					icon: 'heart-filled'
				},
				D: {
					typeKey: 'type-d',
					title: '全能优质型',
					tag: '六边形战士 · 行业标杆',
					desc: '稳活兼备，适配所有路况乘客，妥妥司机标杆！',
					icon: 'vip-filled'
				}
			},

			questions: [
				{ id: 1, title: '乘客想逛小众点', options: { A: '按需求稳妥带路', B: '主动推荐+规划路线', C: '先确认，再灵活配合' } },
				{ id: 2, title: '行程中乘客提问多', options: { A: '耐心细致解答', B: '热情回应+延伸讲解', C: '问啥答啥，不啰嗦' } },
				{ id: 3, title: '遇行程临时调整', options: { A: '先确认，稳妥执行', B: '快速协调，高效安排', C: '配合调整，不纠结' } },
				{ id: 4, title: '乘客想拍沿途美景', options: { A: '安全停车配合拍', B: '主动推荐最佳机位', C: '顺路停，不耽误行程' } },
				{ id: 5, title: '讲解当地风土人情', options: { A: '简洁精准说重点', B: '生动详细多分享', C: '乘客想听才多说' } },
				{ id: 6, title: '遇乘客饮食/住宿咨询', options: { A: '客观推荐靠谱选项', B: '细致分析，帮做参考', C: '按需推荐，不刻意' } },
				{ id: 7, title: '行程遇突发延误', options: { A: '提前告知，安抚情绪', B: '快速想办法，减少耽误', C: '先安抚，再灵活处理' } },
				{ id: 8, title: '团队乘客意见不一', options: { A: '耐心协调，兼顾大家', B: '主动牵头，敲定方案', C: '顺势调解，不主导' } },
				{ id: 9, title: '返程乘客想顺路停留', options: { A: '合规前提下配合', B: '合理规划，满足需求', C: '看时间，灵活答应' } },
				{ id: 10, title: '乘客夸赞服务', options: { A: '礼貌感谢，低调回应', B: '开心互动，欢迎复购', C: '微笑致谢，平常心对待' } }
			]
		};
	},
	computed: {
		currentQuestion() {
			return this.questions[this.currentStep - 1];
		},
		resultData() {
			const type = this.finalTypeResult;
			if (type === '沉稳贴心型') return this.resultMap.A;
			if (type === '热情全能型') return this.resultMap.B;
			if (type === '随和灵活型') return this.resultMap.C;
			return this.resultMap.D;
		}
	},
	methods: {
		selectOption(key) {
			this.$set(this.answers, this.currentStep, key);
		},
		prevStep() {
			if (this.currentStep > 1) this.currentStep--;
		},
		nextStep() {
			if (this.currentStep < this.questions.length) {
				this.currentStep++;
			} else {
				// 最后一题点击后，计算结果并展示
				this.calculateAndShow();
			}
		},
		calculateAndShow() {
			let counts = { A: 0, B: 0, C: 0 };
			Object.values(this.answers).forEach((val) => counts[val]++);

			const { A, B, C } = counts;

			let type = '专业适配型';
			if (A >= 5) type = '沉稳贴心型';
			else if (B >= 5) type = '热情全能型';
			else if (C >= 5) type = '随和灵活型';

			this.finalTypeResult = type;
			this.showResult = true;
		},
		async confirmSubmit() {
			this.isSubmitting = true;
			try {
				const uid = uniCloud.getCurrentUserInfo().uid;
				// 更新数据库
				await db.collection('b-guide-profiles').where({ user_id: uid }).update({
					personality_type: this.finalTypeResult,
					updated_at: Date.now()
				});

				uni.showToast({ title: '注册完成！', icon: 'success' });

				setTimeout(() => {
					uni.reLaunch({ url: '/pages/register/pending' });
				}, 1500);
			} catch (e) {
				this.isSubmitting = false;
				uni.showToast({ title: '提交失败，请重试', icon: 'none' });
			}
		}
	}
};
</script>

<style lang="scss" scoped>
.page-container {
	min-height: 100vh;
	background-color: #f5f7fa;
	padding: 30rpx;
	box-sizing: border-box;
}
.status-bar-safe-area {
	height: var(--status-bar-height);
}
.nav-bar {
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	.nav-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #333;
	}
}

/* 进度条 */
.progress-bar {
	height: 8rpx;
	background: #e1e1e1;
	border-radius: 4rpx;
	margin: 20rpx 0 40rpx;
	overflow: hidden;
	.progress-inner {
		height: 100%;
		background: #eb6d20;
		transition: width 0.3s ease;
	}
}

/* 答题卡片 */
.quiz-card {
	background: #fff;
	border-radius: 24rpx;
	padding: 40rpx;
	box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.04);
	min-height: 60vh;
}

.question-header {
	margin-bottom: 60rpx;
	.q-index {
		font-size: 44rpx;
		color: #eb6d20;
		font-weight: bold;
		margin-right: 20rpx;
		font-family: DIN, sans-serif;
	}
	.q-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		line-height: 1.5;
	}
}

.option-item {
	display: flex;
	align-items: center;
	padding: 32rpx;
	border: 2rpx solid #f0f2f5;
	background: #f9fafb;
	border-radius: 16rpx;
	margin-bottom: 24rpx;
	transition: all 0.2s;

	&:active {
		transform: scale(0.98);
	}

	&.active {
		border-color: #eb6d20;
		background-color: #fff4ec;
		.opt-tag {
			background: #eb6d20;
			color: #fff;
			border-color: #eb6d20;
		}
		.opt-text {
			color: #eb6d20;
			font-weight: bold;
		}
	}

	.opt-tag {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		border: 2rpx solid #ccc;
		color: #999;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
		font-size: 28rpx;
		font-weight: 600;
		flex-shrink: 0;
	}
	.opt-text {
		font-size: 30rpx;
		color: #4b5563;
	}
}

.btn-area {
	display: flex;
	justify-content: space-between;
	margin-top: 60rpx;

	button {
		border-radius: 50rpx;
		font-size: 30rpx;
		height: 96rpx;
		line-height: 96rpx;
		font-weight: bold;
		&::after {
			border: none;
		}
	}

	.back-btn {
		width: 30%;
		background: #fff;
		color: #666;
		border: 2rpx solid #eee;
	}
	.next-btn {
		flex: 1;
		margin-left: 20rpx;
		background: linear-gradient(135deg, #ff8f40, #eb6d20);
		color: #fff;
		box-shadow: 0 8rpx 16rpx rgba(235, 109, 32, 0.2);

		&[disabled] {
			background: #fccca7;
			box-shadow: none;
		}
	}
}

/* --- 结果页样式 --- */
.result-container {
	margin-top: 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.result-card {
	background: #fff;
	width: 100%;
	border-radius: 30rpx;
	padding: 60rpx 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.05);
	position: relative;
	overflow: hidden;
}

.result-icon-box {
	width: 140rpx;
	height: 140rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 30rpx;
	box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.1);

	/* 不同类型的配色 */
	&.type-a {
		background: linear-gradient(135deg, #34d399, #10b981);
		box-shadow: 0 10rpx 20rpx rgba(16, 185, 129, 0.3);
	}
	&.type-b {
		background: linear-gradient(135deg, #60a5fa, #3b82f6);
		box-shadow: 0 10rpx 20rpx rgba(59, 130, 246, 0.3);
	}
	&.type-c {
		background: linear-gradient(135deg, #fbbf24, #f59e0b);
		box-shadow: 0 10rpx 20rpx rgba(245, 158, 11, 0.3);
	}
	&.type-d {
		background: linear-gradient(135deg, #a78bfa, #8b5cf6);
		box-shadow: 0 10rpx 20rpx rgba(139, 92, 246, 0.3);
	}
}

.result-title {
	font-size: 48rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 10rpx;
	letter-spacing: 2rpx;
}

.result-tag {
	font-size: 26rpx;
	color: #999;
	background: #f5f7fa;
	padding: 6rpx 20rpx;
	border-radius: 20rpx;
	margin-bottom: 40rpx;
}

.result-divider {
	width: 60rpx;
	height: 6rpx;
	background: #eee;
	border-radius: 3rpx;
	margin-bottom: 40rpx;
}

.result-desc {
	text-align: center;
	font-size: 30rpx;
	color: #555;
	line-height: 1.8;
	padding: 0 20rpx;
	font-weight: 500;
}

.warm-message {
	margin-top: 60rpx;
	position: relative;
	padding: 0 40rpx;
	text-align: center;

	text {
		font-size: 26rpx;
		color: #9ca3af;
		line-height: 1.8;
		font-family: 'Songti SC', serif; /* 尝试使用衬线体增加温度感 */
	}

	.quote-icon {
		position: absolute;
		font-size: 60rpx;
		color: #e5e7eb;
		font-family: serif;
	}
	.quote-icon.left {
		top: -20rpx;
		left: 0;
	}
	.quote-icon.right {
		bottom: -40rpx;
		right: 0;
	}
}

.submit-btn {
	width: 100%;
	background: #eb6d20;
	color: #fff;
	box-shadow: 0 8rpx 20rpx rgba(235, 109, 32, 0.3);
}

/* 动画 */
.fade-in {
	animation: fadeIn 0.4s ease forwards;
}
.fade-in-up {
	animation: fadeInUp 0.5s ease forwards;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}
@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
