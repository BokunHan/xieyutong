<template>
	<view class="uni-container">
		<uni-forms labelWidth="80" ref="form" v-model="formData" :rules="rules" validateTrigger="bind" @submit="submit">
			<uni-forms-item name="menu_id" label="标识" required>
				<uni-easyinput v-model="formData.menu_id" :clearable="false" placeholder="请输入菜单项的ID，不可重复" />
			</uni-forms-item>
			<uni-forms-item name="name" label="显示名称" required>
				<uni-easyinput v-model="formData.name" :clearable="false" placeholder="请输入菜单名称" />
			</uni-forms-item>
			<uni-forms-item name="icon" label="图标 class" style="margin-bottom: 10px;">
				<uni-easyinput v-model="formData.icon" :clearable="false" placeholder="请输入菜单图标css样式类名">
					<template v-slot:right>
						<span style="color: #007aff; cursor: pointer;padding-right: 10px;" @click="showIconPopup">选择图标</span>
					</template>
				</uni-easyinput>
				<view class="icon-preview" v-if="formData.icon">
					<text>预览：</text>
					<text :class="formData.icon" style="margin-left: 10px; font-size: 16px;"></text>
				</view>
				<uni-link font-size="12" href="https://fontawesome.com/icons" text="FontAwesome图标库参考"
				 class="uni-form-item-tips"></uni-link>
			</uni-forms-item>
			<uni-forms-item name="url" label="页面URL">
				<uni-easyinput v-model="formData.url" :clearable="false" placeholder="URL必须是/开头，URL为空代表是目录而不是叶子节点" />
			</uni-forms-item>
			<uni-forms-item name="sort" label="序号">
				<uni-easyinput v-model="formData.sort" :clearable="false" placeholder="请输入菜单序号（越大越靠后）" />
			</uni-forms-item>
			<uni-forms-item name="parent_id" label="父菜单标识">
				<uni-easyinput v-model="formData.parent_id" :clearable="false" placeholder="请输入父级菜单标识, 一级菜单不需要填写" />
			</uni-forms-item>
			<uni-forms-item name="permission" label="权限列表" class="flex-center-x">
				<uni-data-checkbox :multiple="true" v-model="formData.permission" collection="uni-id-permissions" :page-size="500" field="permission_name as text, permission_id as value" />
				<view class="uni-form-item-tips">
					当用户拥有以上被选中的权限时，可以访问此菜单。建议仅对子菜单配置权限，父菜单会自动包含。如不选择权限，意味着仅超级管理员可访问本菜单
				</view>
			</uni-forms-item>
			<uni-forms-item name="enable" label="是否启用">
				<switch @change="binddata('enable', $event.detail.value)" :checked="formData.enable" />
			</uni-forms-item>

			<view class="uni-button-group">
				<button type="primary" class="uni-button" @click="submitForm" style="width: 100px;">{{$t('common.button.submit')}}</button>
				<navigator open-type="navigateBack" style="margin-left: 15px;"><button class="uni-button" style="width: 100px;">{{$t('common.button.back')}}</button></navigator>
			</view>
		</uni-forms>
		
		<!-- 图标选择弹窗 -->
		<uni-popup ref="iconPopup" type="center">
			<view class="icon-modal">
				<view class="icon-modal-header">
					<text class="icon-modal-title">选择图标</text>
					<text class="icon-modal-close" @click="closeIconPopup">×</text>
				</view>
				<view class="icon-modal-content">
					<view class="icon-search">
						<uni-easyinput v-model="iconSearchKeyword" placeholder="搜索图标..." @input="filterIcons" />
					</view>
					<scroll-view class="icon-list" scroll-y="true">
						<view class="icon-grid">
							<view 
								v-for="icon in filteredIcons" 
								:key="icon.class"
								class="icon-item"
								:class="{'icon-item-selected': formData.icon === icon.class}"
								@click="selectIcon(icon.class)"
							>
								<text :class="icon.class" class="icon-preview-text"></text>
								<text class="icon-name">{{icon.name}}</text>
							</view>
						</view>
					</scroll-view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	import validator from '@/js_sdk/validator/opendb-admin-menus.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'opendb-admin-menus';

	function getValidator(fields) {
		let result = {}
		for (let key in validator) {
			if (fields.includes(key)) {
				result[key] = validator[key]
			}
		}
		return result
	}

	export default {
		data() {
			return {
				formData: {
					"menu_id": "",
					"name": "",
					"icon": "",
					"url": "",
					"sort": '',
					"parent_id": "",
					"permission": [],
					"enable": null
				},
				rules: {
					...getValidator(["menu_id", "name", "icon", "url", "sort", "parent_id", "permission", "enable"])
				},
				iconSearchKeyword: '',
				commonIcons: [
					{ class: 'fas fa-home', name: '首页' },
					{ class: 'fas fa-user', name: '用户' },
					{ class: 'fas fa-users', name: '用户组' },
					{ class: 'fas fa-cog', name: '设置' },
					{ class: 'fas fa-chart-bar', name: '统计' },
					{ class: 'fas fa-shopping-cart', name: '购物车' },
					{ class: 'fas fa-list', name: '列表' },
					{ class: 'fas fa-plus', name: '添加' },
					{ class: 'fas fa-edit', name: '编辑' },
					{ class: 'fas fa-trash', name: '删除' },
					{ class: 'fas fa-search', name: '搜索' },
					{ class: 'fas fa-filter', name: '筛选' },
					{ class: 'fas fa-download', name: '下载' },
					{ class: 'fas fa-upload', name: '上传' },
					{ class: 'fas fa-file', name: '文件' },
					{ class: 'fas fa-folder', name: '文件夹' },
					{ class: 'fas fa-image', name: '图片' },
					{ class: 'fas fa-video', name: '视频' },
					{ class: 'fas fa-music', name: '音乐' },
					{ class: 'fas fa-bell', name: '通知' },
					{ class: 'fas fa-message', name: '消息' },
					{ class: 'fas fa-envelope', name: '邮件' },
					{ class: 'fas fa-phone', name: '电话' },
					{ class: 'fas fa-calendar', name: '日历' },
					{ class: 'fas fa-clock', name: '时钟' },
					{ class: 'fas fa-map', name: '地图' },
					{ class: 'fas fa-location-dot', name: '位置' },
					{ class: 'fas fa-heart', name: '喜欢' },
					{ class: 'fas fa-star', name: '星标' },
					{ class: 'fas fa-bookmark', name: '书签' },
					{ class: 'fas fa-tag', name: '标签' },
					{ class: 'fas fa-key', name: '密钥' },
					{ class: 'fas fa-lock', name: '锁定' },
					{ class: 'fas fa-unlock', name: '解锁' },
					{ class: 'fas fa-shield', name: '安全' },
					{ class: 'fas fa-database', name: '数据库' },
					{ class: 'fas fa-server', name: '服务器' },
					{ class: 'fas fa-cloud', name: '云' },
					{ class: 'fas fa-wifi', name: 'WiFi' },
					{ class: 'fas fa-mobile', name: '手机' },
					{ class: 'fas fa-laptop', name: '笔记本' },
					{ class: 'fas fa-desktop', name: '桌面' },
					{ class: 'fas fa-print', name: '打印' },
					{ class: 'fas fa-camera', name: '相机' },
					{ class: 'fas fa-microphone', name: '麦克风' },
					{ class: 'fas fa-volume-high', name: '音量' },
					{ class: 'fas fa-play', name: '播放' },
					{ class: 'fas fa-pause', name: '暂停' },
					{ class: 'fas fa-stop', name: '停止' },
					{ class: 'fas fa-forward', name: '快进' },
					{ class: 'fas fa-backward', name: '后退' },
					{ class: 'fas fa-refresh', name: '刷新' },
					{ class: 'fas fa-sync', name: '同步' },
					{ class: 'fas fa-undo', name: '撤销' },
					{ class: 'fas fa-redo', name: '重做' },
					{ class: 'fas fa-copy', name: '复制' },
					{ class: 'fas fa-paste', name: '粘贴' },
					{ class: 'fas fa-cut', name: '剪切' },
					{ class: 'fas fa-save', name: '保存' },
					{ class: 'fas fa-check', name: '确认' },
					{ class: 'fas fa-times', name: '关闭' },
					{ class: 'fas fa-exclamation', name: '感叹号' },
					{ class: 'fas fa-question', name: '问号' },
					{ class: 'fas fa-info', name: '信息' },
					{ class: 'fas fa-warning', name: '警告' },
					{ class: 'fas fa-ban', name: '禁止' },
					{ class: 'fas fa-circle', name: '圆圈' },
					{ class: 'fas fa-square', name: '方块' },
					{ class: 'fas fa-triangle', name: '三角形' },
					{ class: 'fas fa-diamond', name: '菱形' },
					{ class: 'fas fa-graduation-cap', name: '学习' },
					{ class: 'fas fa-book', name: '书籍' },
					{ class: 'fas fa-newspaper', name: '新闻' },
					{ class: 'fas fa-trophy', name: '奖杯' },
					{ class: 'fas fa-medal', name: '奖牌' },
					{ class: 'fas fa-gift', name: '礼物' },
					{ class: 'fas fa-birthday-cake', name: '生日' },
					{ class: 'fas fa-coffee', name: '咖啡' },
					{ class: 'fas fa-utensils', name: '餐具' },
					{ class: 'fas fa-car', name: '汽车' },
					{ class: 'fas fa-plane', name: '飞机' },
					{ class: 'fas fa-train', name: '火车' },
					{ class: 'fas fa-ship', name: '船舶' },
					{ class: 'fas fa-bicycle', name: '自行车' },
					{ class: 'fas fa-bus', name: '公交车' },
					{ class: 'fas fa-taxi', name: '出租车' },
					{ class: 'fas fa-truck', name: '卡车' },
					{ class: 'fas fa-motorcycle', name: '摩托车' },
					{ class: 'fas fa-walking', name: '步行' },
					{ class: 'fas fa-running', name: '跑步' },
					{ class: 'fas fa-swimming-pool', name: '游泳' },
					{ class: 'fas fa-football', name: '足球' },
					{ class: 'fas fa-basketball', name: '篮球' },
					{ class: 'fas fa-tennis-ball', name: '网球' },
					{ class: 'fas fa-golf-ball', name: '高尔夫' },
					{ class: 'fas fa-dumbbell', name: '健身' },
					{ class: 'fas fa-gamepad', name: '游戏' },
					{ class: 'fas fa-dice', name: '骰子' },
					{ class: 'fas fa-puzzle-piece', name: '拼图' },
					{ class: 'fas fa-chess', name: '国际象棋' },
					{ class: 'fas fa-cards', name: '扑克牌' }
				],
				filteredIcons: []
			}
		},
		onLoad(e) {
			const id = e.id
			this.formDataId = id
			this.getDetail(id)
			this.filteredIcons = this.commonIcons
		},
		methods: {
			/**
			 * 触发表单提交
			 */
			submitForm(form) {
				this.$refs.form.submit();
			},

			/**
			 * 表单提交
			 * @param {Object} event 回调参数 Function(callback:{value,errors})
			 */
			submit(event) {
				const {
					value,
					errors
				} = event.detail

				// 表单校验失败页面会提示报错 ，要停止表单提交逻辑
				if (errors) {
					return
				}

				uni.showLoading({
					title: '修改中...',
					mask: true
				})
				// 使用 uni-clientDB 提交数据
				db.collection(dbCollectionName).doc(this.formDataId).update(value).then((res) => {
				    uni.showToast({
				        title: '修改成功'
				    })
				    this.getOpenerEventChannel().emit('refreshData')
				    setTimeout(() => uni.navigateBack(), 500)
				}).catch((err) => {
				    uni.showModal({
				        content: err.message || '请求服务失败',
				        showCancel: false
				    })
				}).finally(() => {
				    uni.hideLoading()
				})
			},

			/**
			 * 获取表单数据
			 * @param {Object} id
			 */
			getDetail(id) {
				uni.showLoading({
					mask: true
				})
				db.collection(dbCollectionName).where({
					_id: id
				}).get().then((res) => {
					const data = res.result.data[0]
					if (data) {
						this.formData = data
					}
				}).catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					})
				}).finally(() => {
					uni.hideLoading()
				})
			},
			
			/**
			 * 显示图标选择弹窗
			 */
			showIconPopup() {
				this.$refs.iconPopup.open()
			},
			
			/**
			 * 关闭图标选择弹窗
			 */
			closeIconPopup() {
				this.$refs.iconPopup.close()
				this.iconSearchKeyword = ''
				this.filteredIcons = this.commonIcons
			},
			
			/**
			 * 选择图标
			 */
			selectIcon(iconClass) {
				this.formData.icon = iconClass
				this.closeIconPopup()
			},
			
			/**
			 * 筛选图标
			 */
			filterIcons() {
				if (!this.iconSearchKeyword.trim()) {
					this.filteredIcons = this.commonIcons
					return
				}
				
				const keyword = this.iconSearchKeyword.toLowerCase()
				this.filteredIcons = this.commonIcons.filter(icon => {
					return icon.name.toLowerCase().includes(keyword) || 
						   icon.class.toLowerCase().includes(keyword)
				})
			}
		}
	}
</script>

<style scoped>
	.icon-preview {
		margin-top: 8px;
		display: flex;
		align-items: center;
		font-size: 14px;
		color: #666;
	}
	
	.icon-modal {
		width: 80vw;
		max-width: 600px;
		height: 70vh;
		max-height: 500px;
		background-color: #fff;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.icon-modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15px 20px;
		border-bottom: 1px solid #eee;
		background-color: #f8f9fa;
	}

	.icon-modal-title {
		font-size: 16px;
		font-weight: 600;
		color: #333;
	}

	.icon-modal-close {
		font-size: 24px;
		color: #999;
		cursor: pointer;
		line-height: 1;
		padding: 5px;
	}

	.icon-modal-close:hover {
		color: #666;
	}

	.icon-modal-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.icon-search {
		padding: 15px 20px;
		border-bottom: 1px solid #eee;
	}

	.icon-list {
		flex: 1;
		padding: 10px;
	}

	.icon-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		gap: 10px;
	}

	.icon-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 15px 8px;
		border: 1px solid #eee;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		background-color: #fff;
	}

	.icon-item:hover {
		border-color: #007aff;
		background-color: #f0f8ff;
	}

	.icon-item-selected {
		border-color: #007aff;
		background-color: #e6f3ff;
	}

	.icon-preview-text {
		font-size: 20px;
		color: #333;
		margin-bottom: 8px;
	}

	.icon-name {
		font-size: 12px;
		color: #666;
		text-align: center;
		word-break: break-all;
		line-height: 1.2;
	}

	::v-deep .uni-forms-item__label {
		width: 90px !important;
	}

	/* 移动端适配 */
	@media screen and (max-width: 768px) {
		.icon-modal {
			width: 95vw;
			height: 80vh;
		}
		
		.icon-grid {
			grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
			gap: 8px;
		}
		
		.icon-item {
			padding: 12px 6px;
		}
		
		.icon-preview-text {
			font-size: 18px;
		}
		
		.icon-name {
			font-size: 11px;
		}
	}
</style>
