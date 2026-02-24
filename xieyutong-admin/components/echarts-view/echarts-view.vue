<template>
	<view class="echarts-box" :style="{ width: width, height: height }">
		<view :id="canvasId" class="echarts-dom" :prop="updateData" :change:prop="echarts.updateEcharts"></view>
	</view>
</template>

<script>
export default {
	name: 'echarts-view',
	props: {
		option: {
			type: Object,
			default: () => ({})
		},
		width: {
			type: String,
			default: '100%'
		},
		height: {
			type: String,
			default: '300px'
		}
	},
	data() {
		return {
			// 生成唯一ID，确保每个图表实例独立
			canvasId: 'ec_' + Math.random().toString(36).substr(2, 9)
		};
	},
	computed: {
		// 将 id 和 option 打包，以便 renderjs 监听变化
		updateData() {
			return {
				id: this.canvasId,
				option: this.option
			};
		}
	},
	methods: {
		/**
		 * 供 renderjs 调用的回调方法
		 * 接收 ECharts 内部点击事件的数据，并向父组件抛出
		 */
		emitChartClick(params) {
			this.$emit('click', params);
		}
	}
};
</script>

<script module="echarts" lang="renderjs">
import * as echarts from '@/js_sdk/echarts/echarts.min.js';

export default {
	data() {
		return {
			chart: null,
			ownerInstance: null, // 用于保存逻辑层的实例
			retryCount: 0 // 增加重试计数器防止死循环
		}
	},
	methods: {
		/**
		 * 当逻辑层数据(updateData)发生变更时触发
		 */
		updateEcharts(newValue, oldValue, ownerInstance, instance) {
			if (!newValue) return;

			// 保存 ownerInstance 用于后续抛出点击事件
			this.ownerInstance = ownerInstance;

			const { id, option } = newValue;

			// 如果没有 option 数据，不执行
			if (!option || Object.keys(option).length === 0) return;

			// 调用渲染逻辑
			this.renderChart(id, option);
		},

		/**
		 * 渲染或更新图表
		 */
		renderChart(id, option) {
			// 获取 DOM 节点
			const el = document.getElementById(id);

			if (!el) {
				// 如果 DOM 还没准备好，静默等待 100ms 后重试
				// 不再打印 console.error，避免刷屏
				setTimeout(() => {
					this.renderChart(id, option);
				}, 100);
				return;
			}

			// DOM 已就绪，开始初始化
			if (!this.chart) {
				this.initChart(el, option);
			} else {
				// 图表已存在，更新数据
				// 第二个参数 true 代表不合并，强制刷新数据
				this.chart.setOption(option, true);
			}
		},

		/**
		 * 初始化图表实例及事件绑定
		 */
		initChart(el, option) {
			const myChart = echarts.init ? echarts : (echarts.default ? echarts.default : window.echarts);

			if (!myChart) {
				console.error('ECharts 库加载失败，请检查路径: @/js_sdk/echarts/echarts.min.js');
				return;
			}

			if (this.chart) {
				this.chart.dispose();
			}

			this.chart = myChart.init(el);

			// 绑定点击事件
			this.chart.on('click', (params) => {
				// 数据清洗，只保留必要字段传回逻辑层
				const clickData = {
					name: params.name,
					value: params.value,
					seriesName: params.seriesName,
					dataIndex: params.dataIndex,
					seriesIndex: params.seriesIndex,
					data: params.data
				};

				if (this.ownerInstance) {
					this.ownerInstance.callMethod('emitChartClick', clickData);
				}
			});

			// 设置初始数据
			if (option) {
				this.chart.setOption(option, true);
			}
		}
	}
};
</script>

<style scoped>
.echarts-box {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
}
.echarts-dom {
	width: 100%;
	height: 100%;
}
</style>
