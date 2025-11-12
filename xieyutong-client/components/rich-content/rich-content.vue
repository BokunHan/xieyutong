<template>
	<view class="content-wrapper">
		<mp-html :content="html" lazy-load container-style="padding: 15px" />
	</view>
</template>

<script>
export default {
	name: 'rich-content',
	props: {
		/**
		 * 传入的、需要渲染的 HTML 字符串
		 */
		html: {
			type: String,
			default: '<p>暂无内容</p>'
		}
	},
	data() {
		return {};
	}
};
</script>

<style lang="scss" scoped>
.content-wrapper {
	background-color: #ffffff;
}

:deep(._table) {
	border: 1px solid #e6e6e6;
	border-collapse: collapse;
	margin: 10px 0;
}
:deep(._th),
:deep(._td) {
	border: 1px solid #e6e6e6;
	padding: 8px;
	text-align: center;
}
:deep(._th) {
	background-color: #f3f3f3;
	font-weight: bold;
}
:deep(video) {
	width: 100%;
}
:deep(img) {
	max-width: 100%;
	height: auto;
}
</style>
