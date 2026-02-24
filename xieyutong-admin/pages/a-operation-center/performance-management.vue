<template>
	<view class="page-container">
		<view class="control-bar">
			<view class="type-switcher">
				<view class="ts-item" :class="{ active: currentType === 'guide' }" @click="switchType('guide')">私导</view>
				<view class="ts-item" :class="{ active: currentType === 'sale' }" @click="switchType('sale')">销售</view>
				<view class="ts-item" :class="{ active: currentType === 'attendant' }" @click="switchType('attendant')">管家</view>
			</view>
			<view class="action-group">
				<view class="icon-btn" @click="goToConfig" title="考核配置">
					<uni-icons type="gear" size="18" color="#666"></uni-icons>
				</view>
				<view class="icon-btn" @click="triggerArchive" title="立即归档">
					<uni-icons type="cloud-upload" size="18" color="#666"></uni-icons>
				</view>
				<view class="icon-btn primary" @click="fetchData" title="刷新数据">
					<uni-icons type="refresh" size="18" color="#fff"></uni-icons>
				</view>
			</view>
		</view>

		<view class="content-wrapper">
			<scroll-view scroll-y class="left-panel">
				<view class="stats-overview" v-if="!isLoading">
					<view class="stat-item">
						<text class="val">{{ listData.length }}</text>
						<text class="label">考核人数</text>
					</view>
					<view class="divider"></view>
					<view class="stat-item">
						<text class="val">{{ avgScore }}</text>
						<text class="label">平均得分</text>
					</view>
					<view class="divider"></view>
					<view class="stat-item">
						<text class="val text-green">{{ aLevelCount }}</text>
						<text class="label">A级优秀</text>
					</view>
				</view>

				<view class="charts-section" v-if="!isLoading && listData.length > 0">
					<view class="chart-card">
						<view class="card-header">
							<text class="title">团队分布</text>
						</view>
						<view class="chart-body">
							<echarts-view v-if="boxPlotReady" :option="boxPlotOption" height="180px"></echarts-view>
						</view>
					</view>

					<view class="chart-card">
						<view class="card-header flex-header">
							<text class="title">排名趋势</text>
							<picker :range="listData" range-key="real_name" :value="trendUserIndex" @change="onTrendUserChange" class="mini-picker">
								<view class="picker-label">
									{{ listData[trendUserIndex] ? listData[trendUserIndex].real_name : '选择' }}
									<uni-icons type="bottom" size="10" color="#666"></uni-icons>
								</view>
							</picker>
						</view>
						<view class="chart-body">
							<echarts-view :option="trendOption" height="180px"></echarts-view>
						</view>
					</view>
				</view>
			</scroll-view>

			<view class="right-panel">
				<view class="table-container">
					<uni-load-more v-if="isLoading" status="loading" />
					<view class="data-table" v-else>
						<view class="table-header">
							<view class="th col-level">{{ currentType === 'guide' ? '排名' : '等级' }}</view>
							<view class="th col-name">人员</view>
							<view class="th col-score sortable" @click="handleSort('total_score')">
								综分
								<uni-icons :type="getSortIcon('total_score')" size="10" :color="getSortColor('total_score')"></uni-icons>
							</view>
							<view class="th col-dynamic sortable" v-for="dim in dimensionHeaders" :key="dim.key" @click="handleSort(dim.key)">
								{{ dim.name }}
								<uni-icons :type="getSortIcon(dim.key)" size="10" :color="getSortColor(dim.key)"></uni-icons>
							</view>
							<view class="th col-opt">操作</view>
						</view>

						<scroll-view scroll-y="true" class="table-scroll-body">
							<view class="table-row" v-for="(item, index) in sortedListData" :key="item.user_id || index">
								<view class="td col-level">
									<template v-if="currentType === 'guide'">
										<text style="font-weight: bold; color: #666">{{ item._rank }}</text>
									</template>
									<template v-else>
										<text class="level-tag" :class="'bg-' + item.rank_level.toLowerCase()">{{ item.rank_level }}</text>
									</template>
								</view>
								<view class="td col-name">
									<image :src="item.avatar || '/static/avatar-default.png'" mode="aspectFill" class="avatar small" />
									<view class="info">
										<text class="name">{{ item.real_name }}</text>
									</view>
								</view>
								<view class="td col-score">
									<text class="score-val">{{ item.total_score }}</text>
								</view>
								<view class="td col-dynamic" v-for="dim in dimensionHeaders" :key="dim.key">
									<text>{{ getDimScore(item, dim.key) }}</text>
								</view>
								<view class="td col-opt">
									<text class="link-btn" @click="viewDetail(item)">查看</text>
								</view>
							</view>
							<view v-if="listData.length === 0" class="empty-tip">暂无数据</view>
							<view style="height: 20px"></view>
						</scroll-view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import EchartsView from '@/components/echarts-view/echarts-view.vue';
const operationCenter = uniCloud.importObject('a-operation-center');

export default {
	components: { EchartsView },
	data() {
		return {
			isLoading: false,
			currentType: 'guide', // guide, sale, attendant
			listData: [],
			dimensionHeaders: [],
			sortKey: 'total_score',
			sortOrder: 'desc',

			// 图表相关
			trendUserIndex: 0,
			trendData: [],
			boxPlotOption: {},
			boxPlotReady: false,
			trendOption: {}
		};
	},
	computed: {
		avgScore() {
			if (!this.listData.length) return 0;
			const sum = this.listData.reduce((acc, cur) => acc + (cur.total_score || 0), 0);
			return (sum / this.listData.length).toFixed(1);
		},
		aLevelCount() {
			return this.listData.filter((i) => i.rank_level === 'A').length;
		},
		sortedListData() {
			let list = [...this.listData];
			list.sort((a, b) => {
				let valA = 0;
				let valB = 0;
				if (this.sortKey === 'total_score') {
					valA = Number(a.total_score) || 0;
					valB = Number(b.total_score) || 0;
				} else {
					const dimA = a.dimensions ? a.dimensions.find((d) => d.key === this.sortKey) : null;
					valA = dimA ? Number(dimA.score) : 0;
					const dimB = b.dimensions ? b.dimensions.find((d) => d.key === this.sortKey) : null;
					valB = dimB ? Number(dimB.score) : 0;
				}
				return this.sortOrder === 'asc' ? valA - valB : valB - valA;
			});
			return list;
		}
	},
	mounted() {
		this.fetchData();
	},
	methods: {
		switchType(type) {
			this.currentType = type;
			this.fetchData();
		},
		async fetchData() {
			this.isLoading = true;
			this.boxPlotReady = false;
			try {
				const res = await operationCenter.getAssessmentData({ role: this.currentType });
				if (res.data) {
					const sortedForRank = [...res.data].sort((a, b) => Number(b.total_score) - Number(a.total_score));
					sortedForRank.forEach((item, index) => {
						item._rank = index + 1;
					});

					this.listData = res.data;
					if (this.listData.length > 0 && this.listData[0].dimensions) {
						this.dimensionHeaders = this.listData[0].dimensions.map((d) => ({
							key: d.key,
							name: d.name
						}));
					} else {
						this.dimensionHeaders = [];
					}
					this.sortKey = 'total_score';
					this.sortOrder = 'desc';

					this.$nextTick(() => {
						this.updateViolinPlot();
						if (this.listData.length > 0) {
							this.trendUserIndex = 0;
							this.fetchTrendData(this.listData[0].user_id);
						}
					});
				}
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				this.isLoading = false;
			}
		},

		async fetchTrendData(userId) {
			try {
				const res = await operationCenter.getRankTrend({
					user_id: userId,
					role: this.currentType,
					limit: 6
				});
				this.trendData = res.data || [];
				this.updateTrendChart();
			} catch (e) {
				console.error(e);
			}
		},

		onTrendUserChange(e) {
			this.trendUserIndex = e.detail.value;
			const user = this.listData[this.trendUserIndex];
			if (user) {
				this.fetchTrendData(user.user_id);
			}
		},

		updateViolinPlot() {
			// 1. 数据准备
			const scores = this.listData.map((i) => Number(i.total_score)).filter((s) => !isNaN(s) && s >= 0);

			if (scores.length === 0) {
				this.boxPlotReady = false;
				return;
			}

			// 2. KDE 计算参数
			const yMin = 0;
			const yMax = 105;
			const step = 2;
			const bandwidth = scores.length < 5 ? 10 : 5;

			// 3. 计算采样点的密度 (KDE)
			const violinData = [];
			let maxDensity = 0;

			for (let y = yMin; y <= yMax; y += step) {
				let density = 0;
				for (let i = 0; i < scores.length; i++) {
					const u = (y - scores[i]) / bandwidth;
					density += Math.exp(-0.5 * u * u);
				}
				violinData.push({ y, density });
				if (density > maxDensity) maxDensity = density;
			}

			// 4. 生成闭合的多边形坐标
			const widthFactor = maxDensity > 0 ? 0.4 / maxDensity : 0;

			const leftLine = [];
			const rightLine = [];

			violinData.forEach((p) => {
				const xOffset = p.density * widthFactor;
				leftLine.push([-xOffset, p.y]);
				rightLine.unshift([xOffset, p.y]);
			});

			const polygonData = leftLine.concat(rightLine);
			if (polygonData.length > 0) polygonData.push(polygonData[0]);

			// 5. 个人散点数据
			const scatterData = scores.map((s) => {
				const jitter = (Math.random() - 0.5) * 0.1;
				return [jitter, s];
			});

			// 6. 配置 Option
			this.boxPlotOption = {
				grid: { top: 30, bottom: 20, left: 20, right: 20 },
				tooltip: {
					trigger: 'item',
					confine: true
				},
				xAxis: {
					type: 'value',
					min: -0.6,
					max: 0.6,
					show: false,
					splitLine: { show: false }
				},
				yAxis: {
					type: 'value',
					name: '分数',
					min: 0,
					max: 110,
					splitLine: { lineStyle: { type: 'dashed' } }
				},
				series: [
					{
						type: 'line',
						smooth: true,
						symbol: 'none',
						data: polygonData,
						lineStyle: { width: 0 },
						areaStyle: {
							color: '#eff6ff',
							opacity: 0.8
						},
						silent: true
					},
					{
						type: 'line',
						smooth: true,
						symbol: 'none',
						data: polygonData,
						lineStyle: { width: 1, color: '#3b82f6' },
						silent: true
					},
					{
						name: '得分',
						type: 'scatter',
						symbolSize: 6,
						itemStyle: {
							color: '#3b82f6',
							borderColor: '#fff',
							borderWidth: 1,
							opacity: 0.9
						},
						data: scatterData
					},
					{
						type: 'scatter',
						markLine: {
							symbol: 'none',
							label: { show: true, position: 'end', formatter: '{b}: {c}' },
							lineStyle: { type: 'dashed', color: '#f59e0b' },
							data: [{ type: 'average', name: '平均分', valueIndex: 1 }]
						},
						data: []
					}
				]
			};

			this.boxPlotReady = true;
		},

		updateTrendChart() {
			const periods = this.trendData.map((i) => i.period);
			const ranks = this.trendData.map((i) => i.rank);

			if (periods.length === 0) {
				this.trendOption = {
					title: { text: '暂无历史数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 12 } }
				};
				return;
			}

			this.trendOption = {
				tooltip: { trigger: 'axis' },
				grid: { top: 30, bottom: 20, left: 40, right: 20 },
				xAxis: { type: 'category', data: periods },
				yAxis: {
					type: 'value',
					inverse: true,
					min: 1,
					minInterval: 1,
					name: '排名'
				},
				series: [
					{
						name: '排名',
						data: ranks,
						type: 'line',
						smooth: true,
						itemStyle: { color: '#10b981' },
						areaStyle: { color: 'rgba(16, 185, 129, 0.1)' },
						markPoint: {
							data: [
								{ type: 'min', name: '最佳' },
								{ type: 'max', name: '最差' }
							]
						}
					}
				]
			};
		},

		async triggerArchive() {
			uni.showLoading({ title: '归档中...' });
			const now = new Date();
			const period = `${now.getFullYear()}-${now.getMonth() + 1}`;
			try {
				const res = await operationCenter.archiveAssessment({ period, role: this.currentType });
				uni.showToast({ title: res.msg || '归档成功' });
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '失败', icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		},

		getDimScore(item, key) {
			const dim = item.dimensions?.find((d) => d.key === key);
			return dim ? dim.score : '-';
		},
		goToConfig() {
			uni.navigateTo({ url: '/pages/a-operation-center/management-configs' });
		},
		viewDetail(item) {
			const viewMap = {
				guide: 'guide-view',
				sale: 'sales-view',
				attendant: 'attendant-view'
			};
			const targetView = viewMap[this.currentType];
			if (targetView) {
				this.$emit('switch-view', {
					view: targetView,
					id: item.user_id
				});
			} else {
				uni.showToast({ title: '暂无详情页', icon: 'none' });
			}
		},
		handleSort(key) {
			if (this.sortKey === key) {
				this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
			} else {
				this.sortKey = key;
				this.sortOrder = 'desc';
			}
		},
		getSortIcon(key) {
			if (this.sortKey !== key) return 'bars';
			return this.sortOrder === 'desc' ? 'down' : 'up';
		},
		getSortColor(key) {
			return this.sortKey === key ? '#3b82f6' : '#d1d5db';
		}
	}
};
</script>

<style lang="scss">
$page-bg: #f5f7fa;
$blue: #3b82f6;
$text-main: #1f2937;
$text-sub: #6b7280;
$border: #e5e7eb;

.page-container {
	height: 100vh;
	background-color: $page-bg;
	display: flex;
	flex-direction: column;
	overflow: hidden;

	/* 1. 顶部控制栏 */
	.control-bar {
		padding: 10px 12px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #fff;
		flex-shrink: 0;
		border-bottom: 1px solid $border;

		.type-switcher {
			display: flex;
			background: #f3f4f6;
			padding: 3px;
			border-radius: 6px;
			.ts-item {
				padding: 4px 12px;
				font-size: 12px;
				color: #666;
				cursor: pointer;
				border-radius: 4px;
				transition: all 0.2s;
				&.active {
					background: #fff;
					color: $blue;
					font-weight: 600;
					box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
				}
			}
		}
		.action-group {
			display: flex;
			gap: 8px;
			.icon-btn {
				width: 32px;
				height: 32px;
				border-radius: 6px;
				background: #fff;
				border: 1px solid #e5e7eb;
				display: flex;
				align-items: center;
				justify-content: center;
				&.primary {
					background: $blue;
					border-color: $blue;
				}
			}
		}
	}

	/* 2. 主体内容区：左右布局 */
	.content-wrapper {
		flex: 1;
		display: flex;
		overflow: hidden;
		padding: 10px 12px 0px; // 整体外边距
		gap: 12px;

		/* 左侧面板 */
		.left-panel {
			width: 30%; // 占1/3
			display: flex;
			flex-direction: column;
			// 允许左侧内部滚动（如果图表太高）
			height: 100%;

			/* 统计卡片 (垂直排列或紧凑布局) */
			.stats-overview {
				background: #fff;
				border-radius: 8px;
				padding: 12px 0;
				display: flex;
				align-items: center;
				box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
				margin-bottom: 10px;

				.stat-item {
					flex: 1;
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;

					.val {
						font-size: 16px; // 略微调小
						font-weight: 700;
						color: $text-main;
						line-height: 1.2;
						&.text-green {
							color: #059669;
						}
					}
					.label {
						font-size: 10px;
						color: $text-sub;
						margin-top: 2px;
					}
				}
				.divider {
					width: 1px;
					height: 20px;
					background: #e5e7eb;
				}
			}

			/* 图表区域 (强制纵向排列) */
			.charts-section {
				display: flex;
				flex-direction: column; // 纵向
				gap: 10px;

				.chart-card {
					background: #fff;
					border-radius: 8px;
					padding: 10px;
					box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
					overflow: hidden;

					.card-header {
						display: flex;
						justify-content: space-between;
						align-items: center;
						margin-bottom: 5px;
						height: 20px;

						.title {
							font-size: 12px;
							font-weight: 600;
							color: #374151;
						}

						.mini-picker {
							.picker-label {
								font-size: 11px;
								color: $blue;
								display: flex;
								align-items: center;
								gap: 2px;
							}
						}
					}
					.chart-body {
						width: 100%;
					}
				}
			}
		}

		/* 右侧面板 */
		.right-panel {
			flex: 1; // 占剩余空间 (2/3)
			display: flex;
			flex-direction: column;
			overflow: hidden;

			/* 表格容器 */
			.table-container {
				flex: 1;
				background: #fff;
				border-radius: 8px;
				box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
				overflow: hidden;
				display: flex;
				flex-direction: column;
				min-height: 0;
				margin-bottom: 170px;

				.data-table {
					display: flex;
					flex-direction: column;
					height: 100%;

					.table-header {
						flex-shrink: 0;
						display: flex;
						background: #f9fafb;
						padding: 8px 12px;
						border-bottom: 1px solid $border;
						.th {
							font-size: 11px;
							font-weight: 600;
							color: $text-sub;
							&.sortable {
								cursor: pointer;
								display: flex;
								align-items: center;
								justify-content: center;
								gap: 2px;
							}
						}
					}

					.table-scroll-body {
						flex: 1;
						height: 0;
						overflow-y: auto;
					}

					.table-row {
						display: flex;
						align-items: center;
						padding: 10px 12px;
						border-bottom: 1px solid #f3f4f6;

						.td {
							font-size: 12px;
							color: $text-main;
						}
					}

					/* 列样式 */
					.col-name {
						flex: 1.5;
						display: flex;
						align-items: center;
						gap: 8px;
						overflow: hidden;
						.avatar {
							width: 24px;
							height: 24px;
							border-radius: 50%;
							flex-shrink: 0;
						}
						.info {
							display: flex;
							flex-direction: column;
							overflow: hidden;
							.name {
								font-weight: 500;
								white-space: nowrap;
								text-overflow: ellipsis;
								overflow: hidden;
							}
						}
					}
					.col-level {
						width: 40px;
						text-align: center;
						.level-tag {
							padding: 1px 4px;
							border-radius: 4px;
							font-size: 10px;
							&.bg-a {
								background: #d1fae5;
								color: #047857;
							}
							&.bg-b {
								background: #dbeafe;
								color: #1e40af;
							}
							&.bg-c {
								background: #fef3c7;
								color: #b45309;
							}
							&.bg-d {
								background: #f3f4f6;
								color: #6b7280;
							}
						}
					}
					.col-score {
						width: 50px;
						text-align: center;
						font-weight: bold;
						color: $blue;
					}
					.col-dynamic {
						flex: 1;
						text-align: center;
						color: $text-sub;
						font-size: 11px;
					}
					.col-opt {
						width: 40px;
						text-align: right;
						.link-btn {
							color: $blue;
							font-size: 11px;
						}
					}
					.empty-tip {
						padding: 30px;
						text-align: center;
						color: #999;
						font-size: 12px;
					}
				}
			}
		}
	}
}
</style>
