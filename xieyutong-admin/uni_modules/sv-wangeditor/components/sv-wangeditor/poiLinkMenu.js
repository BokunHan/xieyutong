import { DomEditor } from '@wangeditor/editor';

export class PoiLinkMenu {
	constructor() {
		// 【修改】根据上下文，标题可以是 "关联POI" 或 "修改POI"
		this.title = '关联POI';
		this.tag = 'button';
	}

	// 【修改】根据是否选中了 POI 链接，动态修改按钮标题
	getTitle(editor) {
		return '关联POI'; // 否则显示 "关联POI"
	}

	// 辅助函数：获取当前选中的 POI 链接节点
	getSelectedPoiLink(editor) {
		const node = DomEditor.getSelectedNodeByType(editor, 'link');
		if (node && node['url']) {
			return node;
		}
		return null;
	}

	getValue(editor) {
		return '';
	}
	isActive(editor) {
		return false;
	}
	isDisabled(editor) {
		return false;
	}

	// 核心：点击按钮时执行的函数
	exec(editor) {
		const { openPoiModal } = editor.getConfig().extConfig || {};
		if (typeof openPoiModal !== 'function') {
			console.error('未在 extConfig 中找到 openPoiModal 方法');
			return;
		}

		// 【修改】获取当前选中的文本 和 当前的POI ID (如果有)
		const selectedText = editor.getSelectionText();
		const linkNode = this.getSelectedPoiLink(editor);
		const currentPoiId = linkNode ? linkNode['url'] : null;

		// 【修改】调用弹窗，并传入 currentPoiId 用于预选
		openPoiModal((poi) => {
			if (poi && poi.value && poi.text) {
				editor.restoreSelection();

				const newLinkNode = {
					type: 'link',
					url: 'poi:' + poi.value,
					children: [{ text: selectedText }] // 使用被选中的文字
				};

				// insertNode 在有选区时，会用 newLinkNode 替换掉选区内容
				editor.insertNode(newLinkNode);
			}
		}, currentPoiId); // 把 currentPoiId 传出去
	}
}
