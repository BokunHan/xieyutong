<template>
	<view class="custom-picker-wrapper">
		<view class="picker-trigger" @click.stop="toggleSelector">
			<text class="value">{{ currentLabel || placeholder }}</text>
			<uni-icons :type="showSelector ? 'top' : 'bottom'" size="14" color="#666"></uni-icons>
		</view>

		<view v-if="showSelector" class="picker-mask" @click.stop="closeSelector" @touchmove.stop.prevent></view>

		<view v-if="showSelector" class="custom-dropdown-options" :class="direction === 'top' ? 'is-top' : 'is-bottom'">
			<scroll-view scroll-y class="options-scroll">
				<view class="option-item" v-for="(item, index) in options" :key="item[valueKey] || index" @click.stop="selectItem(item, index)" :class="{ active: isSelected(item) }">
					<text class="opt-text">{{ item[labelKey] }}</text>
					<uni-icons v-if="isSelected(item)" type="checkmarkempty" size="14" color="#3b82f6"></uni-icons>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'custom-picker',
	props: {
		// 数据源列表
		options: {
			type: Array,
			default: () => []
		},
		// 当前选中的对象 (v-model 绑定)
		value: {
			type: Object,
			default: null
		},
		// 显示文本的字段名 (默认 real_name，你可以传 name, title 等)
		labelKey: {
			type: String,
			default: 'real_name'
		},
		// 唯一值的字段名 (默认 user_id，你可以传 id, uuid 等)
		valueKey: {
			type: String,
			default: 'user_id'
		},
		// 空值占位符
		placeholder: {
			type: String,
			default: '请选择'
		},
		direction: {
			type: String,
			default: 'bottom'
		}
	},
	data() {
		return {
			showSelector: false
		};
	},
	computed: {
		// 计算当前显示的文字
		currentLabel() {
			if (!this.value) return '';
			return this.value[this.labelKey];
		}
	},
	methods: {
		toggleSelector() {
			this.showSelector = !this.showSelector;
		},
		closeSelector() {
			this.showSelector = false;
		},
		selectItem(item, index) {
			// 触发 input 事件实现 v-model 更新
			this.$emit('input', item);
			// 同时触发 change 事件，方便父组件做额外操作
			this.$emit('change', item);
			this.closeSelector();
		},
		isSelected(item) {
			if (!this.value || !item) return false;
			// 对比唯一键值
			return this.value[this.valueKey] === item[this.valueKey];
		}
	}
};
</script>

<style lang="scss" scoped>
.custom-picker-wrapper {
	position: relative;
	z-index: 100;

	// 触发器样式
	.picker-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		padding: 6px 10px;
		border-radius: 6px;
		font-size: 13px;

		width: auto;
		min-width: 90px;
		max-width: 150px;
		box-sizing: border-box;
		cursor: pointer;

		.value {
			flex: 1;
			text-align: center;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
			margin-right: 4px;
		}

		uni-icons {
			flex-shrink: 0;
		}
	}

	.picker-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 998;
		background: transparent;
	}

	.custom-dropdown-options {
		position: absolute;
		top: 100%;
		right: 0; // 靠右对齐
		margin-top: 5px;

		width: 200px; // 下拉框宽度
		max-height: 250px;

		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 999;
		overflow: hidden;

		&.is-bottom {
			top: 100%;
		}

		&.is-top {
			bottom: 100%;
			top: auto;
		}

		.options-scroll {
			max-height: 250px;
		}

		.option-item {
			padding: 8px 12px;
			font-size: 13px;
			color: #333;
			border-bottom: 1px solid #f3f4f6;
			display: flex;
			justify-content: space-between;
			align-items: center;
			cursor: pointer;

			&:last-child {
				border-bottom: none;
			}

			&:hover {
				background-color: #f9fafb; // 微微变灰
			}

			&:active {
				background-color: #f5f7fa;
			}

			&.active {
				background-color: #eff6ff;
				color: #3b82f6;
				font-weight: 500;
				&:hover {
					background-color: #e0e7ff;
				}
			}

			.opt-text {
				flex: 1;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
				margin-right: 5px;
			}
		}
	}
}
</style>
