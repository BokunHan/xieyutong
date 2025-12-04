<template>
	<view class="item-container">
		<view class="item-cell name-cell">
			<text class="item-label">原始文本</text>
			<text class="item-value">{{ item.name || '(空)' }}</text>
		</view>

		<view class="item-cell suggestion-cell">
			<text class="item-label">智能建议</text>
			<view class="item-value">
				<view v-if="suggestions && suggestions.length === 1" class="suggestion-chip success">
					<uni-icons type="checkmark-filled" color="#18b566" size="16"></uni-icons>
					{{ suggestions[0].name }}
				</view>

				<view v-else-if="suggestions && suggestions.length > 1" class="suggestion-chip warning" @click="showSuggestions = !showSuggestions">
					<uni-icons type="help-filled" color="#f3a73f" size="16"></uni-icons>
					多个匹配 ({{ suggestions.length }})
					<uni-icons :type="showSuggestions ? 'top' : 'bottom'" size="14" color="#f3a73f" style="margin-left: 4px"></uni-icons>
				</view>

				<view v-else class="suggestion-chip error">
					<uni-icons type="clear" color="#e43d33" size="16"></uni-icons>
					无匹配
				</view>

				<view v-if="showSuggestions && suggestions.length > 1" class="suggestion-dropdown">
					<view v-for="poi in suggestions" :key="poi._id" class="suggestion-option" @click="selectSuggestion(poi)">
						{{ poi.name }}
					</view>
				</view>
			</view>
		</view>

		<view class="item-cell manual-cell">
			<text class="item-label">手动处理</text>
			<view class="item-value">
				<uni-data-select
					v-model="manual_poi_id"
					collection="a-poi-database"
					field="_id as value, name as text"
					filterable
					clearable
					placeholder="搜索并手动关联POI"
					@change="onManualSelect"></uni-data-select>
			</view>
		</view>

		<view class="item-cell action-cell">
			<button class="uni-button" size="mini" type="primary" :disabled="!manual_poi_id" @click="confirmManual">确认</button>
			<button class="uni-button" size="mini" type="warn" @click="ignoreItem">忽略</button>
		</view>
	</view>
</template>

<script>
export default {
	name: 'CalibrationItem',
	props: {
		item: {
			// 原始项 { name: '...' }
			type: Object,
			required: true
		},
		suggestions: {
			// 建议数组 [ { _id: '...', name: '...' } ]
			type: Array,
			default: () => []
		}
	},
	data() {
		return {
			manual_poi_id: null,
			showSuggestions: false
		};
	},
	created() {
		// 如果是无歧义，自动填充到手动选择框
		if (this.suggestions && this.suggestions.length === 1) {
			this.manual_poi_id = this.suggestions[0]._id;
		}
	},
	methods: {
		selectSuggestion(poi) {
			this.manual_poi_id = poi._id; // 1. 填充ID到手动选择框
			this.showSuggestions = false; // 2. 关闭下拉列表
			this.confirmManual(); // 3. 立即提交确认
		},

		// 手动选择了POI
		onManualSelect(poiId) {
			// 如果选择后又清空了
			if (!poiId) {
				this.manual_poi_id = null;
			}
		},
		// 确认(手动)
		confirmManual() {
			if (!this.manual_poi_id) return;
			this.$emit('update', {
				linked_poi_id: this.manual_poi_id,
				match_status: 'manual'
			});
		},
		// 忽略
		ignoreItem() {
			this.$emit('update', {
				linked_poi_id: null,
				match_status: 'ignore'
			});
		}
	}
};
</script>

<style scoped>
.item-container {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px;
	border-bottom: 1px solid #f5f5f5;
}
.item-container:last-child {
	border-bottom: none;
}
.item-cell {
	display: flex;
	flex-direction: column;
	gap: 5px;
}
.item-label {
	font-size: 12px;
	color: #999;
}
.item-value {
	font-size: 14px;
	color: #333;
}
.name-cell {
	flex: 2;
	min-width: 150px;
}

/* [!! 修改 !!] */
.suggestion-cell {
	flex: 2;
	min-width: 150px;
	/* 添加相对定位，为下拉列表提供定位锚点 */
	position: relative;
	/* 确保它在手动处理单元格之上 */
	z-index: 6;
}

.manual-cell {
	flex: 3;
	min-width: 200px;
	position: relative;
	z-index: 5;
}
.action-cell {
	flex: 1;
	flex-direction: row;
	gap: 5px;
	min-width: 120px;
}

.suggestion-chip {
	display: flex;
	align-items: center;
	gap: 5px;
	font-size: 13px;
	padding: 4px 8px;
	border-radius: 4px;
}
.suggestion-chip.success {
	background-color: #f0f9eb;
	color: #18b566;
}

/* [!! 修改 !!] */
.suggestion-chip.warning {
	background-color: #fdf6ec;
	color: #f3a73f;
	/* 增加点击手势 */
	cursor: pointer;
}
.suggestion-chip.error {
	background-color: #fef0f0;
	color: #e43d33;
}

/* [!! 新增 !!] 下拉列表的样式 */
.suggestion-dropdown {
	position: absolute;
	/* 定位在单元格下方 */
	top: 100%;
	left: 0;
	right: 0;
	background-color: #fff;
	border: 1px solid #e5e5e5;
	border-radius: 4px;
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
	max-height: 150px;
	overflow-y: auto;
	/* 确保它在所有内容的最上层 */
	z-index: 99;
	margin-top: 4px;
}
.suggestion-option {
	padding: 8px 12px;
	font-size: 13px;
	color: #333;
	cursor: pointer;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.suggestion-option:hover {
	background-color: #f5f5f5;
}
</style>
