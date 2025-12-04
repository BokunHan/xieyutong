<template>
	<view class="sv-wangeditor">
		<!-- 将node_modules中的@wangeditor/editor/dist/css/style.css复制到项目根目录static/css文件夹中，并改名为wangeditor-style.css -->
		<!-- 因为uniapp在编译时会将h5原生button等标签转换为uni-button从而导致样式失效，故将样式文件放置static中，并通过link引入才能规避uniapp这一bug -->
		<link href="static/css/wangeditor-style.css" rel="stylesheet" />
		<Toolbar class="editor-toolbar" :editor="editorIns" :defaultConfig="toolbarConfig" :mode="mode" />
		<Editor class="editor-wrapper" v-model="htmlValue" :defaultConfig="finalEditorConfig" :mode="mode" @onCreated="handleCreated" />

		<uni-popup ref="poiPopup" type="center">
			<view class="poi-popup-content">
				<text class="popup-title">请搜索并选择 POI</text>
				<uni-data-select
					ref="poiSelectComp"
					v-model="selectedPoi"
					collection="a-poi-database"
					field="_id as value, name as text"
					filterable
					placeholder="搜索POI名称"></uni-data-select>
				<view class="popup-button-group">
					<button class="popup-button cancel" @click="closePoiPopup">取消</button>
					<button class="popup-button confirm" @click="confirmPoiSelection" :disabled="!selectedPoi">确认</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script setup>
import { ref, shallowRef, onBeforeUnmount, watch, computed, onMounted, nextTick } from 'vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import { Boot, DomEditor } from '@wangeditor/editor';
import { PoiLinkMenu } from './poiLinkMenu.js';

const db = uniCloud.database();
const poiMenuKey = 'insertPoi';

if (!globalThis.__WANG_MENU_KEYS_REGISTERED__) {
	globalThis.__WANG_MENU_KEYS_REGISTERED__ = {};
}

if (!globalThis.__WANG_MENU_KEYS_REGISTERED__[poiMenuKey]) {
	Boot.registerMenu({
		key: poiMenuKey,
		factory: () => new PoiLinkMenu()
	});
	globalThis.__WANG_MENU_KEYS_REGISTERED__[poiMenuKey] = true;
}

const props = defineProps({
	html: {
		type: String,
		default: ''
	},
	// 工具栏配置
	toolbarConfig: {
		type: Object,
		default: () => {}
	},
	editorConfig: {
		type: Object,
		default: () => ({})
	},
	mode: {
		type: String,
		default: 'default' // [ default | simple ]
	},
	placeholder: {
		type: String,
		default: '请输入内容...'
	}
});

const emits = defineEmits(['update:html', 'change', 'save']);

// 编辑器实例，必须用 shallowRef
const editorIns = shallowRef();

// 富文本内容
const htmlValue = computed({
	set(newHtml) {
		// 双向绑定
		emits('update:html', newHtml);
	},
	get() {
		return props.html;
	}
});

watch(htmlValue, (newHtml) => {
	// 纯文本内容
	if (editorIns.value) {
		const newText = editorIns.value.getText();
		emits('change', { html: newHtml, text: newText });
	}
});

const insertedFileList = ref([]); // 编辑过程中插入的图片列表
const savedFileList = ref([]); // 编辑完成后保存的图片列表

// POI 弹窗相关的 ref
const poiPopup = ref(null); // uni-popup 组件的 ref
const poiSelectComp = ref(null); // uni-data-select 组件的 ref
const selectedPoi = ref(null); // v-model 绑定
const _poiCallback = ref(null); // 存储菜单按钮的回调函数

const finalEditorConfig = computed(() => {
	// 1. 定义我们内部必须的配置 (弹窗 + 上传)
	const internalConfig = {
		placeholder: props.placeholder,
		extConfig: {
			openPoiModal: (callback, currentPoiId) => {
				openPoiPopup(callback, currentPoiId);
			}
		},
		MENU_CONF: {
			uploadImage: {
				async customUpload(file, insertFn) {
					const fileURL = window.URL.createObjectURL(file);
					let cloundFile = await uniCloud.uploadFile({
						filePath: fileURL,
						cloudPath: `cloudstorage/${Date.now()}_${file.name}`,
						cloudPathAsRealPath: true
					});
					insertFn(cloundFile.fileID, file.name, '');
					URL.revokeObjectURL(fileURL);
				}
			},
			insertImage: {
				onInsertedImage(imageNode) {
					if (imageNode == null) return;
					insertedFileList.value.push(imageNode.src);
				}
			},
			uploadVideo: {
				async customUpload(file, insertFn) {
					const fileURL = window.URL.createObjectURL(file);
					let cloundFile = await uniCloud.uploadFile({
						filePath: fileURL,
						cloudPath: `cloudstorage/${Date.now()}_${file.name}`,
						cloudPathAsRealPath: true
					});
					insertFn(cloundFile.fileID);
					URL.revokeObjectURL(fileURL);
				}
			},
			insertVideo: {
				onInsertedVideo(videoNode) {
					if (videoNode == null) return;
					insertedFileList.value.push(videoNode.src);
				}
			}
		}
	};

	const mergedConfig = {
		...props.editorConfig,
		...internalConfig,
		MENU_CONF: {
			...internalConfig.MENU_CONF, // 保证我们的上传配置
			...(props.editorConfig.MENU_CONF || {}) // 合并传入的 MENU_CONF (如果有)
		},
		extConfig: internalConfig.extConfig // 保证我们的弹窗配置不被覆盖
	};

	return mergedConfig;
});

function handleCreated(editor) {
	editorIns.value = editor;
}

onBeforeUnmount(() => {
	editorIns.value?.destroy();
	editorIns.value = null;
});

// 打开 POI 弹窗
function openPoiPopup(callback, currentPoiId = null) {
	console.log('当前POI ID:', currentPoiId);
	selectedPoi.value = currentPoiId; // 清空上次选择
	_poiCallback.value = callback; // 存储回调
	poiPopup.value.open();
}

// 关闭 POI 弹窗
function closePoiPopup() {
	poiPopup.value.close();
	_poiCallback.value = null;
}

async function confirmPoiSelection() {
	// 从 v-model 获取值
	const poiValue = selectedPoi.value;

	// 1. 检查 poiValue 和回调
	if (!poiValue || !_poiCallback.value) {
		closePoiPopup();
		return;
	}

	// 2. 显示加载
	uni.showLoading({ title: '获取POI...', mask: true });

	try {
		// 3. 【核心】直接查询数据库获取名称
		const res = await db
			.collection('a-poi-database')
			.doc(poiValue)
			.field({ name: true }) // 只需要 name 字段
			.get();

		uni.hideLoading();

		if (res.result && res.result.data && res.result.data.length > 0) {
			const poi = res.result.data[0];
			const poiText = poi.name; // 成功拿到 POI 名称

			// 4. 执行回调
			_poiCallback.value({
				value: poiValue, // _id
				text: poiText // name
			});
			closePoiPopup(); // 自动关闭
		} else {
			// 数据库没找到 (理论上不应发生)
			console.error(`sv-wangeditor: 数据库中未找到 POI (id: ${poiValue})`);
			uni.showToast({ title: 'POI未找到', icon: 'error' });
			// 注意：这里不关闭弹窗，允许用户重新选择
		}
	} catch (error) {
		uni.hideLoading();
		console.error('sv-wangeditor: 查询 POI 失败', error);
		uni.showToast({ title: '查询失败', icon: 'error' });
		// 注意：这里不关闭弹窗
	}
}

function save() {
	// 获取当前富文本中所有图片
	const savedImages = editorIns.value.getElemsByType('image')?.map((item) => item.src);
	const savedVideos = editorIns.value.getElemsByType('video')?.map((item) => item.src);
	savedFileList.value = [...savedImages, ...savedVideos];
	/**
	 * savedFileList需要和insertedFileList对比，从云存储中删除未保存的图片或视频资源
	 * 为什么要在结束编辑时才进行对比删除？详见下面链接
	 * @tutorial https://www.wangeditor.com/v5/menu-config.html#%E8%8E%B7%E5%8F%96%E5%B7%B2%E5%88%A0%E9%99%A4%E7%9A%84%E5%9B%BE%E7%89%87
	 */
	const needDelFiles = insertedFileList.value.filter((item) => !savedFileList.value.includes(item));
	if (needDelFiles.length > 0) {
		/**
		 * 删除云存储中的文件资源
		 * 注意：阿里云不支持客户端删除操作，需要调用云对象删除，使用前需要上传sv-utils云对象
		 */
		uniCloud.importObject('sv-utils').deleteCloudFile(needDelFiles);
	}

	// 纯文本内容
	const newText = editorIns.value.getText();
	emits('save', { html: htmlValue.value, text: newText });
}

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
	editorIns.value?.destroy();
	editorIns.value = null;
});

defineExpose({
	/**
	 * 将editorIns实例暴露出去，可自用调用官方编辑器api
	 * @tutorial https://www.wangeditor.com/v5/API.html
	 */
	editorIns,
	save
});
</script>

<style lang="scss">
.sv-wangeditor {
	width: 100%;
	height: 100%;
	border: 1px solid #ccc;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	z-index: 6;
	overflow: visible;

	.editor-toolbar {
		border-bottom: 1px solid #ccc;
		box-sizing: border-box;
	}

	.editor-wrapper {
		flex: 1;
		overflow-x: visible;
		overflow-y: visible;
		box-sizing: border-box;
	}

	:deep(.editor-wrapper .w-e-text-container a) {
		color: #007aff;
		text-decoration: underline;
	}
}

.poi-popup-content {
	width: 300px;
	background-color: #fff;
	padding: 20px;
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	gap: 15px;

	.popup-title {
		font-size: 16px;
		font-weight: bold;
		text-align: center;
	}

	.popup-button-group {
		display: flex;
		flex-direction: row;
		gap: 10px;
		margin-top: 10px;
	}

	.popup-button {
		flex: 1;
		margin: 0; /* 重置 uni-app 按钮的默认 margin */
		font-size: 14px;
	}

	.popup-button.cancel {
		/* 默认按钮样式 (灰色) */
	}

	.popup-button.confirm {
		/* 主按钮样式 (蓝色) */
		background-color: #007aff;
		color: #fff;
	}

	.popup-button.confirm[disabled] {
		background-color: #f4f4f4 !important;
		color: #999 !important;
		border: 1px solid #e5e5e5 !important;
	}
}
</style>
