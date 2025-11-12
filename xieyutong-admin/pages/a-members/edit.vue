<template>
	<view class="uni-container">
		<uni-forms ref="form" :model="formData" validateTrigger="bind" label-width="100px">
			<uni-forms-item label="用户昵称">
				<text class="form-text">{{ memberInfo.nickname }}</text>
			</uni-forms-item>
			<uni-forms-item label="用户手机">
				<text class="form-text">{{ memberInfo.mobile }}</text>
			</uni-forms-item>
			<uni-forms-item label="会员等级">
				<text class="form-text">{{ levelMap[memberInfo.level] || memberInfo.level }}</text>
			</uni-forms-item>
			<uni-forms-item label="升级条件">
				<text class="form-text">{{ formattedThreshold }}</text>
			</uni-forms-item>
			<uni-forms-item label="加入日期">
				<text class="form-text">
					<uni-dateformat :date="memberInfo.join_date" :threshold="[0, 0]"></uni-dateformat>
				</text>
			</uni-forms-item>

			<uni-forms-item name="status" label="会员状态" required>
				<uni-data-checkbox v-model="formData.status" :localdata="formOptions.status_localdata"></uni-data-checkbox>
			</uni-forms-item>

			<view class="uni-button-group">
				<button type="primary" class="uni-button" style="width: 100px" @click="submit">提交</button>
				<navigator open-type="navigateBack" style="margin-left: 15px">
					<button class="uni-button" style="width: 100px">返回</button>
				</navigator>
			</view>
		</uni-forms>
	</view>
</template>

<script>
// import { validator } from '../../js_sdk/validator/a-members.js';

const db = uniCloud.database();
const dbCmd = db.command;
const dbCollectionName = 'a-members, uni-id-users';

export default {
	data() {
		let formData = {
			status: ''
		};
		return {
			formData,
			memberInfo: {
				nickname: '加载中...',
				mobile: '加载中...',
				level: '',
				upgrade_threshold: null,
				join_date: null
			},
			levelMap: {
				normal: '普通会员',
				silver: '银卡会员',
				gold: '金卡会员',
				diamond: '钻石会员'
			},
			formOptions: {
				status_localdata: [
					{
						value: 'active',
						text: '正常'
					},
					{
						value: 'inactive',
						text: '失效'
					},
					{
						value: 'suspended',
						text: '冻结'
					}
				]
			},
			rules: {
				status: {
					rules: [
						{
							required: true,
							errorMessage: '请选择会员状态'
						}
					]
				}
			},
			formDataId: null
		};
	},

	computed: {
		formattedThreshold() {
			const ut = this.memberInfo.upgrade_threshold;
			if (!ut || !ut.next_level) {
				return '已是最高等级';
			}
			// 数据库中是 "分"，转换为 "元"
			const requiredAmount = ut.required_consumption;
			const nextLevelName = this.levelMap[ut.next_level] || ut.next_level;
			return `消费满 ${requiredAmount} 元 升至 ${nextLevelName}`;
		}
	},
	onLoad(e) {
		if (e.id) {
			const id = e.id;
			this.formDataId = id;
			this.getDetail(id);
		}
	},
	onReady() {
		this.$refs.form.setRules(this.rules);
	},
	methods: {
		/**
		 * 验证表单并提交
		 */
		submit() {
			uni.showLoading({
				mask: true
			});
			this.$refs.form
				.validate()
				.then((res) => {
					// res 将只包含 { status: "..." }
					return this.submitForm(res);
				})
				.catch(() => {})
				.finally(() => {
					uni.hideLoading();
				});
		},

		/**
		 * 提交表单
		 */
		submitForm(value) {
			return db
				.collection('a-members')
				.doc(this.formDataId)
				.update(value)
				.then((res) => {
					uni.showToast({
						title: '修改成功'
					});
					this.getOpenerEventChannel().emit('refreshData');
					setTimeout(() => uni.navigateBack(), 500);
				})
				.catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					});
				});
		},

		/**
		 * 获取表单数据
		 * @param {Object} id
		 */
		getDetail(id) {
			uni.showLoading({
				mask: true
			});
			db.collection(dbCollectionName)
				.doc(id)
				.field('user_id{nickname,mobile},level,upgrade_threshold,status,join_date')
				.get()
				.then((res) => {
					const data = res.result.data[0];
					if (data) {
						this.memberInfo = data;

						if (data.user_id && data.user_id[0]) {
							this.memberInfo.nickname = data.user_id[0].nickname || '未知昵称';
							this.memberInfo.mobile = data.user_id[0].mobile || '未留手机';
						} else {
							this.memberInfo.nickname = '未知用户';
							this.memberInfo.mobile = 'N/A';
						}

						this.formData.status = data.status;
					}
				})
				.catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					});
				})
				.finally(() => {
					uni.hideLoading();
				});
		}
	}
};
</script>

<style>
.form-text {
	font-size: 14px;
	color: #333;
	padding-left: 10px; /* 对齐输入框 */
	line-height: 36px; /* 垂直居中对齐 */
}

/* 确保容器有边距 */
.uni-container {
	padding: 15px;
}
</style>
