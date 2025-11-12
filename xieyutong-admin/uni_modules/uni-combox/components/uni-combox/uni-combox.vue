<template>
	<view class="uni-combox" :class="border ? '' : 'uni-combox__no-border'">
		<view v-if="label" class="uni-combox__label" :style="labelStyle">
			<text>{{ label }}</text>
		</view>
		<view class="uni-combox__input-box">
			<input
				class="uni-combox__input"
				type="text"
				:placeholder="placeholder"
				placeholder-class="uni-combox__input-plac"
				v-model="inputVal"
				@input="onInput"
				@focus="onFocus"
				@blur="onBlur" />
			<uni-icons :type="showSelector ? 'top' : 'bottom'" size="14" color="#999" @click="toggleSelector"></uni-icons>
		</view>
		<view class="uni-combox__selector" v-if="showSelector">
			<view class="uni-popper__arrow"></view>
			<scroll-view scroll-y="true" class="uni-combox__selector-scroll" @scroll="onScroll">
				<view class="uni-combox__selector-empty" v-if="filterCandidatesLength === 0">
					<text>{{ emptyTips }}</text>
				</view>
				<view class="uni-combox__selector-item" v-for="(item, index) in filterCandidates" :key="index" @click="onSelectorClick(index)">
					<text>{{ item[`${labelKey}`] }}</text>
				</view>
			</scroll-view>
		</view>
		<uni-icons style="padding-left: 20rpx" class="content-clear-icon" type="clear" color="#c0c4cc" v-if="inputVal" @click="onClear"></uni-icons>
		<view class="uni-combox__mask" v-show="showSelector" @click="showSelector = false"></view>
	</view>
</template>

<script>
/**
 * Combox 组合输入框
 * @description 组合输入框一般用于既可以输入也可以选择的场景
 * @tutorial https://ext.dcloud.net.cn/plugin?id=1261
 * @property {String} label 左侧文字
 * @property {String} labelWidth 左侧内容宽度
 * @property {String} placeholder 输入框占位符
 * @property {Array} candidates 候选项列表
 * @property {String} emptyTips 筛选结果为空时显示的文字
 * @property {String} value 组合框的值
 */
export default {
	name: 'uniCombox',
	emits: ['input', 'update:modelValue', 'change'],
	props: {
		border: {
			type: Boolean,
			default: true
		},
		filter: {
			type: Boolean,
			default: true
		},
		label: {
			type: String,
			default: ''
		},
		labelWidth: {
			type: String,
			default: 'auto'
		},
		placeholder: {
			type: String,
			default: ''
		},
		candidates: {
			type: Array,
			default() {
				return [];
			}
		},
		emptyTips: {
			type: String,
			default: '无匹配项'
		},
		labelKey: {
			type: String,
			default: 'dictName'
		},
		valueKey: {
			type: String,
			default: 'dictId'
		},
		// #ifndef VUE3
		value: {
			type: [String, Number],
			default: ''
		},
		// #endif
		// #ifdef VUE3
		modelValue: {
			type: [String, Number],
			default: ''
		}
		// #endif
	},
	data() {
		return {
			showSelector: false,
			inputVal: '',
			blurTimer: null,
			dictVal: '',
			filterCandidates: []
		};
	},
	computed: {
		labelStyle() {
			if (this.labelWidth === 'auto') {
				return '';
			}
			return `width: ${this.labelWidth}`;
		},
		// filterCandidates() {
		// 	if (!this.filter) {
		// 		return this.candidates
		// 	}
		// 	return this.candidates.filter((item) => {
		// 		return item.toString().indexOf(this.inputVal) > -1
		// 	})
		// },
		filterCandidatesLength() {
			return this.filterCandidates.length;
		}
	},
	watch: {
		// #ifndef VUE3
		value: {
			handler(newVal) {
				this.inputVal = newVal;
			},
			immediate: true
		},
		// #endif

		candidates: {
			handler(arr) {
				if (arr.length > 0 && this.dictVal) {
					let obj = arr.find((item, index) => {
						return this.dictVal == item[`${this.valueKey}`];
					});
					this.inputVal = obj[`${this.labelKey}`];
					this.$forceUpdate();
				}
				this.filterCandidates = arr.filter((item) => {
					return item[`${this.labelKey}`].toString().indexOf(this.inputVal) > -1;
				});
			},
			immediate: true,
			deep: true
		},

		// #ifdef VUE3
		modelValue: {
			handler(newVal) {
				// this.inputVal = newVal
				this.dictVal = newVal;
				if (this.candidates.length > 0 && newVal) {
					let obj = this.candidates.find((item, index) => {
						return newVal == item[`${this.valueKey}`];
					});
					if (obj) {
						this.inputVal = obj[`${this.labelKey}`];
					} else {
						this.inputVal = '';
					}
				} else if (!newVal) {
					this.inputVal = '';
				}
			},
			immediate: true,
			deep: true
		}
		// #endif
	},
	methods: {
		toggleSelector() {
			this.showSelector = !this.showSelector;
		},
		onFocus() {
			this.showSelector = true;
		},
		onBlur() {
			setTimeout(() => {
				this.showSelector = false;
			}, 153);
		},
		onScroll() {
			if (this.blurTimer) {
				clearTimeout(this.blurTimer);
				this.blurTimer = null;
			}
		},
		onSelectorClick(index) {
			// this.inputVal = this.filterCandidates[index]
			this.dictVal = this.filterCandidates[index][`${this.valueKey}`];
			this.inputVal = this.filterCandidates[index][`${this.labelKey}`];
			this.showSelector = false;
			this.$emit('input', this.dictVal);
			this.$emit('change', this.dictVal);
			this.$emit('update:modelValue', this.dictVal);
		},
		onInput() {
			this.filterCandidates = this.candidates.filter((item) => {
				console.log(item, this.labelKey);
				return item[`${this.labelKey}`].toString().indexOf(this.inputVal) > -1;
			});
			setTimeout(() => {
				this.$emit('input', this.dictVal);
				this.$emit('update:modelValue', this.dictVal);
			});
		},
		onClear(event) {
			this.inputVal = '';
		}
	}
};
</script>

<style lang="scss" scoped>
.uni-combox {
	font-size: 14px;
	border: 1px solid #dcdfe6;
	border-radius: 4px;
	padding: 6px 10px;
	position: relative;
	/* #ifndef APP-NVUE */
	display: flex;
	/* #endif */
	// height: 40px;
	flex-direction: row;
	align-items: center;
	// border-bottom: solid 1px #DDDDDD;
}

.uni-combox__label {
	font-size: 16px;
	line-height: 22px;
	padding-right: 10px;
	color: #999999;
}

.uni-combox__input-box {
	position: relative;
	/* #ifndef APP-NVUE */
	display: flex;
	/* #endif */
	flex: 1;
	flex-direction: row;
	align-items: center;
}

.uni-combox__input {
	flex: 1;
	font-size: 14px;
	height: 22px;
	line-height: 22px;
}

.uni-combox__input-plac {
	font-size: 14px;
	color: #999;
}

.uni-combox__selector {
	/* #ifndef APP-NVUE */
	box-sizing: border-box;
	/* #endif */
	position: absolute;
	top: calc(100% + 12px);
	left: 0;
	width: 100%;
	background-color: #ffffff;
	border: 1px solid #ebeef5;
	border-radius: 6px;
	box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
	z-index: 2;
	padding: 4px 0;
}

.uni-combox__selector-scroll {
	/* #ifndef APP-NVUE */
	max-height: 200px;
	box-sizing: border-box;
	/* #endif */
}

.uni-combox__selector-empty,
.uni-combox__selector-item {
	/* #ifndef APP-NVUE */
	display: flex;
	cursor: pointer;
	/* #endif */
	line-height: 36px;
	font-size: 14px;
	text-align: center;
	// border-bottom: solid 1px #DDDDDD;
	padding: 0px 10px;
}

.uni-combox__selector-item:hover {
	background-color: #f9f9f9;
}

.uni-combox__selector-empty:last-child,
.uni-combox__selector-item:last-child {
	/* #ifndef APP-NVUE */
	border-bottom: none;
	/* #endif */
}

// picker 弹出层通用的指示小三角
.uni-popper__arrow,
.uni-popper__arrow::after {
	position: absolute;
	display: block;
	width: 0;
	height: 0;
	border-color: transparent;
	border-style: solid;
	border-width: 6px;
}

.uni-popper__arrow {
	filter: drop-shadow(0 2px 12px rgba(0, 0, 0, 0.03));
	top: -6px;
	left: 10%;
	margin-right: 3px;
	border-top-width: 0;
	border-bottom-color: #ebeef5;
}

.uni-popper__arrow::after {
	content: ' ';
	top: 1px;
	margin-left: -6px;
	border-top-width: 0;
	border-bottom-color: #fff;
}

.uni-combox__no-border {
	border: none;
}

.uni-combox__mask {
	width: 100%;
	height: 100%;
	position: fixed;
	top: 0;
	left: 0;
	z-index: 1;
}
</style>
