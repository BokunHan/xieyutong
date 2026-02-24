<template>
	<view class="sales-panel">
		<view class="filter-bar">
			<view class="filter-left">
				<picker :range="salesList" range-key="real_name" :value="salesIndex" @change="onSalesChange">
					<view class="picker-trigger">
						<text>{{ currentSaleId === 'all' ? '全部销售' : salesList[salesIndex] ? salesList[salesIndex].real_name : '选择销售' }}</text>
						<uni-icons type="bottom" size="12" color="#666"></uni-icons>
					</view>
				</picker>
				<view class="time-tabs">
					<text class="t-item" :class="{ active: timeRange === 'month' }" @click="switchTime('month')">本月</text>
					<text class="t-item" :class="{ active: timeRange === 'last_month' }" @click="switchTime('last_month')">上月</text>
					<text class="t-item" :class="{ active: timeRange === 'quarter' }" @click="switchTime('quarter')">本季</text>
				</view>
			</view>
			<view class="refresh-btn" @click="loadData">
				<uni-icons type="refresh" size="14" color="#3b82f6"></uni-icons>
				<text>刷新</text>
			</view>
		</view>

		<view class="kpi-group">
			<view class="kpi-card blue" @click="openTrendPopup('sales')">
				<view class="kpi-content">
					<view class="kpi-left">
						<view class="label">销售额 (元)</view>
						<view class="value">¥{{ formatNumber(kpi.totalSalesAmount) }}</view>
						<view class="sub">本期业绩</view>
					</view>
					<view class="kpi-chart">
						<echarts-view :option="kpiSalesOption" width="100%" height="100%"></echarts-view>
					</view>
				</view>
			</view>
			<view class="kpi-card green" @click="openTrendPopup('rate')">
				<view class="kpi-content">
					<view class="kpi-left">
						<view class="label">成交转化率</view>
						<view class="value">{{ kpi.conversionRate }}%</view>
						<view class="sub">成交占比</view>
					</view>
					<view class="kpi-chart">
						<echarts-view :option="kpiRateOption" width="100%" height="100%"></echarts-view>
					</view>
				</view>
			</view>
			<view class="kpi-card orange" @click="openTrendPopup('followup')">
				<view class="kpi-content">
					<view class="kpi-left">
						<view class="label">跟进记录</view>
						<view class="value">{{ kpi.followUpCount }}</view>
						<view class="sub">工作活跃度</view>
					</view>
					<view class="kpi-chart">
						<echarts-view :option="kpiFollowupOption" width="100%" height="100%"></echarts-view>
					</view>
				</view>
			</view>
		</view>

		<view class="chart-row">
			<view class="chart-card">
				<view class="card-title" style="justify-content: space-between">
					<text>渠道表现</text>
					<picker :range="channelFilterOptions" range-key="label" @change="onChannelFilterChange">
						<view class="mini-filter">
							<text>{{ currentChannelLabel }}</text>
							<uni-icons type="bottom" size="10" color="#999"></uni-icons>
						</view>
					</picker>
				</view>
				<view class="chart-body">
					<echarts-view ref="channelChart" :option="channelOption" height="250px" @click="onChannelClick"></echarts-view>
				</view>
			</view>
			<view class="chart-card">
				<view class="card-title">转化漏斗</view>
				<view class="chart-body">
					<echarts-view :option="funnelOption" height="250px" @click="onFunnelClick"></echarts-view>
				</view>
			</view>
		</view>

		<view class="chart-row">
			<view class="chart-card">
				<view class="card-title" style="justify-content: space-between">
					<view>
						工作效能
						<text class="hint">(录入/接待)</text>
					</view>
					<picker :range="heatmapWeeks" range-key="label" @change="onHeatmapWeekChange">
						<view class="mini-filter">
							<text>{{ heatmapWeeks[heatmapWeekIndex] ? heatmapWeeks[heatmapWeekIndex].label : '全部时间' }}</text>
							<uni-icons type="bottom" size="10" color="#999"></uni-icons>
						</view>
					</picker>
				</view>
				<view class="chart-body">
					<echarts-view :option="heatmapOption" height="300px"></echarts-view>
				</view>
			</view>
			<view class="chart-card">
				<view class="card-title">
					客户质量分布
					<text class="hint">(X:满意度 Y:复购率)</text>
				</view>
				<view class="chart-body">
					<echarts-view :option="scatterOption" height="300px" @click="onScatterClick"></echarts-view>
				</view>
			</view>
		</view>

		<uni-popup ref="trendPopup" type="center" background-color="#fff">
			<view class="trend-popup-card">
				<view class="popup-header">
					<text class="title">{{ trendPopupTitle }}</text>
					<view class="close-btn" @click="$refs.trendPopup.close()">
						<uni-icons type="closeempty" size="20" color="#999"></uni-icons>
					</view>
				</view>
				<view class="popup-body">
					<echarts-view v-if="trendPopupVisible" :option="trendPopupOption" height="300px" @click="onTrendClick"></echarts-view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
import EchartsView from '@/components/echarts-view/echarts-view.vue';
const operationCenter = uniCloud.importObject('a-operation-center');
const db = uniCloud.database();

export default {
	name: 'sales-panel',
	components: { EchartsView },
	data() {
		return {
			salesList: [{ user_id: 'all', real_name: '全部销售' }],
			salesIndex: 0,
			currentSaleId: 'all',
			timeRange: 'month', // month, last_month, quarter

			// 渠道筛选
			channelFilterOptions: [
				{ label: '全部订单', value: 'all' },
				{ label: '仅成交', value: 'deal' },
				{ label: '仅流失', value: 'lost' }
			],
			channelFilterValue: 'all',
			currentChannelLabel: '全部订单',

			// 热力图周筛选
			heatmapWeeks: [{ label: '全周期', start: 0, end: 0 }],
			heatmapWeekIndex: 0,

			// 数据
			kpi: { totalSalesAmount: 0, conversionRate: 0, followUpCount: 0 },

			// ECharts Options - 迷你图
			kpiSalesOption: {},
			kpiRateOption: {},
			kpiFollowupOption: {},

			// ECharts Options - 主图表
			channelOption: {},
			funnelOption: {},
			scatterOption: {},
			heatmapOption: {},

			// 弹窗相关
			trendPopupVisible: false,
			trendPopupTitle: '',
			trendPopupOption: {}
		};
	},
	mounted() {
		this.fetchSalesList();
		this.loadData();
		this.$nextTick(() => {
			const chartInstance = this.$refs.channelChart.chart;

			if (chartInstance) {
				chartInstance.on('click', (params) => {
					this.onChannelClick(params);
				});
			}
		});
	},
	methods: {
		formatNumber(num) {
			return num ? num.toLocaleString() : '0';
		},
		async fetchSalesList() {
			try {
				const res = await db.collection('uni-id-users').where({ role: 'sale' }).field('_id, nickname, username').get();
				const list = res.result.data.map((u) => ({
					user_id: u._id,
					real_name: u.nickname || u.username || '销售'
				}));
				this.salesList = [{ user_id: 'all', real_name: '全部销售' }, ...list];
			} catch (e) {
				console.error(e);
			}
		},
		onSalesChange(e) {
			this.salesIndex = e.detail.value;
			this.currentSaleId = this.salesList[this.salesIndex].user_id;
			this.loadData();
		},
		switchTime(range) {
			this.timeRange = range;
			this.loadData();
		},

		// --- 渠道筛选变更 ---
		onChannelFilterChange(e) {
			const idx = e.detail.value;
			const opt = this.channelFilterOptions[idx];
			this.channelFilterValue = opt.value;
			this.currentChannelLabel = opt.label;
			this.loadData(); // 重新加载
		},

		// --- 热力图周筛选变更 ---
		onHeatmapWeekChange(e) {
			this.heatmapWeekIndex = e.detail.value;
			// 这里不需要 reload 全部数据，因为是展示层过滤，但为了复用后端逻辑
			// 我们可以再次调用 loadData，把特定的热力图时间传过去
			this.loadData();
		},

		// 渠道点击 -> 筛选来源
		onChannelClick(params) {
			if (!params.name) return;
			uni.navigateTo({
				url: `/pages/a-customers/list?source=${params.name}`
			});
		},

		// 漏斗点击 -> 筛选状态
		onFunnelClick(params) {
			const stage = params.name;
			let status = '';

			// 映射漏斗层级到数据库状态
			switch (stage) {
				case '咨询':
					status = ''; // 全部
					break;
				case '意向':
					status = 'intent'; // 特殊标记，在 list.vue 中处理为 != new
					break;
				case '成交':
					status = 'deal';
					break;
				case '流失':
					status = 'lost';
					break;
				default:
					return;
			}

			uni.navigateTo({
				url: `/pages/a-customers/list?status=${status}`
			});
		},

		// 散点图点击 -> 筛选评分
		onScatterClick(params) {
			const score = params.value && params.value[0];
			if (score === undefined) return;

			uni.navigateTo({
				url: `/pages/a-customers/list?score=${score}`
			});
		},

		onTrendClick(params) {
			// 如果点击的值是 0，或者无效，不跳转
			if (!params.value || parseFloat(params.value) === 0) return;

			// params.name 格式通常为 "MM-DD" (例如 "01-08")
			const dateStr = params.name;
			if (!dateStr || !dateStr.includes('-')) return;

			// 获取当前筛选时间段的年份
			// 逻辑：用当前选定的开始时间的年份作为基准
			const { start } = this.getTimeRange();
			const year = new Date(start).getFullYear();

			// 拼接完整日期 YYYY-MM-DD
			const fullDate = `${year}-${dateStr}`;

			// 根据不同的图表类型，决定是否需要传 status 参数
			// params.seriesName 是我们在 getDetailTrendOption 里设置的 label (销售额、转化率、跟进数)
			let query = `date=${fullDate}`;

			// 如果是点击的“成交转化率”趋势图，最好去列表页也只看成交的
			if (params.seriesName === '转化率') {
				// 但要注意，转化率的分母是总客资，分子是成交。
				// 如果用户想看当天的所有客资情况，传 date 即可。
				// 如果只想看成交的，传 status=deal。
				// 这里建议只传 date，让用户看到当天的全貌（包含未成交的）更合理，
				// 或者你可以根据需求改为 `date=${fullDate}&status=deal`
			}

			// 跳转
			uni.navigateTo({
				url: `/pages/a-customers/list?${query}`
			});

			// 关闭弹窗
			this.$refs.trendPopup.close();
		},

		getTimeRange() {
			const now = new Date();
			let start = 0;
			let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

			if (this.timeRange === 'month') {
				start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
			} else if (this.timeRange === 'last_month') {
				start = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
				end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
			} else if (this.timeRange === 'quarter') {
				const q = Math.floor(now.getMonth() / 3);
				start = new Date(now.getFullYear(), q * 3, 1).getTime();
			}
			return { start, end };
		},

		// 生成当前时间范围内的周列表
		generateWeeks(start, end) {
			const weeks = [{ label: '全周期', start: 0, end: 0 }];
			let current = new Date(start);
			// 调整 current 到当周周一 (假设周一为第一天)
			// 或简单点，直接按7天切分，从 start 开始
			let count = 1;

			// 循环直到超过结束时间
			while (current.getTime() < end) {
				const wStart = current.getTime();
				const wEnd = Math.min(wStart + 7 * 24 * 3600 * 1000 - 1, end);

				const d1 = new Date(wStart);
				const d2 = new Date(wEnd);
				const label = `第${count}周 (${d1.getMonth() + 1}.${d1.getDate()}-${d2.getMonth() + 1}.${d2.getDate()})`;

				weeks.push({
					label,
					start: wStart,
					end: wEnd
				});

				current.setTime(current.getTime() + 7 * 24 * 3600 * 1000);
				count++;
			}
			return weeks;
		},

		async loadData() {
			uni.showLoading({ title: '加载中...' });
			try {
				const { start, end } = this.getTimeRange();
				const newWeeks = this.generateWeeks(start, end);
				if (this.heatmapWeeks.length === 0 || this.heatmapWeeks[1]?.label !== newWeeks[1]?.label) {
					this.heatmapWeeks = newWeeks;
					this.heatmapWeekIndex = 0; // 重置回全周期
				}

				// 确定热力图的具体查询时间
				const selectedWeek = this.heatmapWeeks[this.heatmapWeekIndex];
				const hmStart = selectedWeek.start || start;
				const hmEnd = selectedWeek.end || end;

				const res = await operationCenter.getSalesDashboardData({
					sales_id: this.currentSaleId,
					startTime: start,
					endTime: end,
					channelStatus: this.channelFilterValue,
					heatmapStartTime: hmStart,
					heatmapEndTime: hmEnd
				});

				console.log('res: ', res);

				if (res.code === 0) {
					this.kpi = res.data.kpi;
					this.updateCharts(res.data);
				}
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		},

		// 生成迷你图配置的辅助函数
		getSparklineOption(data, color) {
			return {
				grid: { top: 5, bottom: 5, left: 0, right: 0 },
				xAxis: {
					type: 'category',
					show: false,
					boundaryGap: false // 紧贴边缘
				},
				yAxis: {
					type: 'value',
					show: false,
					min: 0
				},
				series: [
					{
						data: data,
						type: 'line',
						smooth: true,
						showSymbol: false,
						lineStyle: { width: 2, color: color },
						areaStyle: {
							color: {
								type: 'linear',
								x: 0,
								y: 0,
								x2: 0,
								y2: 1,
								colorStops: [
									{ offset: 0, color: color }, // 顶部颜色
									{ offset: 1, color: 'rgba(255,255,255,0)' } // 底部透明
								]
							},
							opacity: 0.3
						}
					}
				]
			};
		},

		// 生成详细趋势图配置 - 有坐标轴
		getDetailTrendOption(dates, values, color, label) {
			return {
				tooltip: { trigger: 'item' },
				grid: { top: 30, bottom: 30, left: 50, right: 20, containLabel: true },
				xAxis: {
					type: 'category',
					data: dates,
					boundaryGap: false,
					axisLine: { lineStyle: { color: '#ddd' } },
					axisLabel: { color: '#666' }
				},
				yAxis: {
					type: 'value',
					splitLine: { lineStyle: { type: 'dashed' } }
				},
				series: [
					{
						name: label,
						data: values,
						type: 'line',
						smooth: true,
						itemStyle: { color: color },
						areaStyle: {
							color: {
								type: 'linear',
								x: 0,
								y: 0,
								x2: 0,
								y2: 1,
								colorStops: [
									{ offset: 0, color: color },
									{ offset: 1, color: '#fff' }
								]
							},
							opacity: 0.2
						}
					}
				]
			};
		},

		// 打开弹窗逻辑
		openTrendPopup(type) {
			const trends = this.kpi.trends;
			if (!trends || !trends.dates || trends.dates.length === 0) {
				return uni.showToast({ title: '暂无趋势数据', icon: 'none' });
			}

			this.trendPopupVisible = true;

			if (type === 'sales') {
				this.trendPopupTitle = '销售额每日趋势 (元)';
				this.trendPopupOption = this.getDetailTrendOption(trends.dates, trends.sales, '#3b82f6', '销售额');
			} else if (type === 'rate') {
				this.trendPopupTitle = '成交转化率趋势 (%)';
				this.trendPopupOption = this.getDetailTrendOption(trends.dates, trends.rates, '#10b981', '转化率');
			} else if (type === 'followup') {
				this.trendPopupTitle = '每日跟进次数';
				this.trendPopupOption = this.getDetailTrendOption(trends.dates, trends.followups, '#f59e0b', '跟进数');
			}

			this.$refs.trendPopup.open();
		},

		getChannelColor(name) {
			const colorMap = {
				携程私家团: '#3b82f6', // blue
				携程定制: '#06b6d4', // cyan
				小程序: '#f59e0b', // orange
				飞猪: '#f5ee0e', // yellow
				小红书: '#f43f5e', // red
				抖音: '#333333', // dark
				复购: '#b036f6', // purple
				转介绍: '#10b981' // green
			};
			return colorMap[name] || '#9ca3af'; // 默认 gray
		},

		updateCharts(data) {
			// --- 更新 KPI 迷你图 ---
			const trends = data.kpi.trends || { sales: [], rates: [], followups: [] };
			this.kpiSalesOption = this.getSparklineOption(trends.sales, '#3b82f6'); // 蓝
			this.kpiRateOption = this.getSparklineOption(trends.rates, '#10b981'); // 绿
			this.kpiFollowupOption = this.getSparklineOption(trends.followups, '#f59e0b'); // 橙

			// 1. 渠道表现 (柱状图)
			this.channelOption = {
				tooltip: {
					trigger: 'item',
					confine: true,
					backgroundColor: 'rgba(255, 255, 255, 0.9)',
					textStyle: { color: '#333', fontSize: 12 },
					formatter: '{b}: {c}' // 渠道名: 数值
				},
				grid: { top: 30, bottom: 30, left: 40, right: 20 },
				xAxis: { type: 'category', data: data.channelData.map((i) => i.name) },
				yAxis: { type: 'value' },
				series: [
					{
						data: data.channelData.map((i) => i.value),
						type: 'bar',
						itemStyle: {
							color: (params) => {
								return this.getChannelColor(params.name);
							},
							borderRadius: [4, 4, 0, 0]
						},
						barWidth: '40%'
					}
				]
			};

			// 2. 转化漏斗 (漏斗图)
			this.funnelOption = {
				tooltip: { trigger: 'item' },
				series: [
					{
						type: 'funnel',
						left: '10%',
						top: 10,
						bottom: 10,
						width: '80%',
						min: 0,
						max: 100,
						minSize: '0%',
						maxSize: '100%',
						sort: 'descending',
						gap: 2,
						label: { show: true, position: 'inside' },
						data: data.funnelData,
						itemStyle: { borderColor: '#fff', borderWidth: 1 }
					}
				]
			};

			// 3. 客户质量 (散点图)
			this.scatterOption = {
				tooltip: {
					formatter: (param) => {
						return `评分: ${param.value[0]}分\n复购率: ${(param.value[1] * 100).toFixed(0)}%\n人数: ${param.value[2]}`;
					}
				},
				grid: { top: 30, bottom: 30, left: 50, right: 60 },
				xAxis: { name: '满意度', min: 0, max: 10, splitLine: { show: false } },
				yAxis: { name: '复购率', min: 0, max: 1, splitLine: { lineStyle: { type: 'dashed' } } },
				series: [
					{
						symbolSize: (val) => Math.min(Math.max(val[2] * 2, 10), 50), // 根据人数动态调整气泡大小
						data: data.scatterData,
						type: 'scatter',
						itemStyle: { color: '#ef4444', opacity: 0.7 }
					}
				]
			};

			// 4. 工作效能 (热力图)
			const hours = Array.from({ length: 24 }, (_, i) => i + '点');
			const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
			const maxVal = data.heatMapData.reduce((m, i) => Math.max(m, i[2]), 0) || 5;

			this.heatmapOption = {
				tooltip: {
					position: 'top',
					confine: true,
					// 自定义内容格式：周四 9点 1
					formatter: (params) => {
						// params.data = [hourIndex, dayIndex, value]
						const h = hours[params.data[0]];
						const d = days[params.data[1]];
						const v = params.data[2];
						return `${d} ${h}\n数量: ${v}`;
					}
				},
				grid: { top: 10, bottom: 30, left: 40, right: 10 },
				xAxis: { type: 'category', data: hours, splitArea: { show: true } },
				yAxis: { type: 'category', data: days, splitArea: { show: true } },
				visualMap: {
					min: 0,
					max: maxVal,
					calculable: true,
					orient: 'horizontal',
					left: 'center',
					bottom: 0,
					inRange: { color: ['#f0f9ff', '#3b82f6'] },
					show: false // 隐藏图例节省空间
				},
				series: [
					{
						type: 'heatmap',
						data: data.heatMapData,
						label: { show: false },
						itemStyle: {
							emphasis: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
						}
					}
				]
			};
		}
	}
};
</script>

<style lang="scss">
.sales-panel {
	display: flex;
	flex-direction: column;
	gap: 15px;
	padding-bottom: 20px;

	.filter-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #fff;
		padding: 10px 15px;
		border-radius: 8px;

		.filter-left {
			display: flex;
			align-items: center;
			gap: 15px;
			.picker-trigger {
				display: flex;
				align-items: center;
				gap: 4px;
				font-size: 14px;
				font-weight: bold;
				color: #333;
			}
			.time-tabs {
				display: flex;
				background: #f3f4f6;
				border-radius: 4px;
				padding: 2px;
				.t-item {
					font-size: 12px;
					padding: 4px 12px;
					color: #666;
					cursor: pointer;
					&.active {
						background: #fff;
						color: #3b82f6;
						border-radius: 4px;
						box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
					}
				}
			}
		}

		.refresh-btn {
			display: flex;
			align-items: center;
			gap: 4px;
			font-size: 12px;
			color: #3b82f6;
			cursor: pointer;
		}
	}

	.kpi-group {
		display: flex;
		gap: 15px;
		.kpi-card {
			flex: 1;
			background: #fff;
			padding: 15px 15px 15px 20px;
			border-radius: 8px;
			display: flex;
			flex-direction: column;
			box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
			border-top: 3px solid transparent;

			&.blue {
				border-color: #3b82f6;
			}
			&.green {
				border-color: #10b981;
			}
			&.orange {
				border-color: #f59e0b;
			}

			.kpi-content {
				display: flex;
				justify-content: space-between;
				align-items: center;
				height: 100%; /* 确保填满高度 */

				.kpi-left {
					display: flex;
					flex-direction: column;
					.label {
						font-size: 12px;
						color: #666;
						margin-bottom: 5px;
					}
					.value {
						font-size: 20px;
						font-weight: bold;
						color: #333;
						margin-bottom: 2px;
					}
					.sub {
						font-size: 10px;
						color: #999;
					}
				}

				.kpi-chart {
					width: 80px;
					height: 50px;
					/* 确保图表容器有具体宽高 */
				}
			}

			.label {
				font-size: 12px;
				color: #666;
				margin-bottom: 5px;
			}
			.value {
				font-size: 20px;
				font-weight: bold;
				color: #333;
				margin-bottom: 2px;
			}
			.sub {
				font-size: 10px;
				color: #999;
			}
		}
	}

	.chart-row {
		display: flex;
		gap: 15px;
		.chart-card {
			flex: 1;
			background: #fff;
			border-radius: 8px;
			padding: 15px;
			box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

			.card-title {
				font-size: 14px;
				font-weight: bold;
				margin-bottom: 15px;
				display: flex;
				align-items: center;
				gap: 5px;
				.hint {
					font-size: 11px;
					color: #999;
					font-weight: normal;
				}
			}
			.chart-body {
				width: 100%;
				overflow: hidden;
			}
		}
	}

	/* 弹窗样式 */
	.trend-popup-card {
		width: 90vw;
		background: #fff;
		border-radius: 12px;
		overflow: hidden;
		padding-bottom: 20px;

		.popup-header {
			padding: 15px 20px;
			border-bottom: 1px solid #eee;
			display: flex;
			justify-content: space-between;
			align-items: center;
			.title {
				font-size: 16px;
				font-weight: bold;
				color: #333;
			}
			.close-btn {
				padding: 5px;
				cursor: pointer;
			}
		}

		.popup-body {
			padding: 20px 10px;
			height: 320px;
		}

		.mini-filter {
			display: flex;
			align-items: center;
			gap: 4px;
			font-size: 11px;
			background: #f3f4f6;
			padding: 2px 8px;
			border-radius: 10px;
			color: #666;
		}
	}
}
</style>
