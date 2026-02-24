<template>
	<view class="manifest-container">
		<view class="manifest-header">
			<text class="date-title">{{ dateStr }} 运营日报</text>
			<view class="close-icon" @click="$emit('close')">×</view>
		</view>

		<view class="filter-section">
			<view class="filter-row">
				<text class="filter-label">类型:</text>
				<view class="tags-container">
					<view
						v-for="type in filterOptions.types"
						:key="type.value"
						class="tag-item"
						:class="{ active: filters.types.includes(type.value) }"
						@click="toggleTypeFilter(type.value)">
						{{ type.label }}
					</view>
				</view>
			</view>

			<view class="filter-row selectors-row">
				<view class="selector-wrapper">
					<text class="filter-label">私导:</text>
					<view class="select-box">
						<uni-data-select v-model="filters.guideId" :localdata="guideOptions" :clear="true" placeholder="选私导" class="mini-select"></uni-data-select>
					</view>
				</view>

				<view class="selector-wrapper">
					<text class="filter-label">管家:</text>
					<view class="select-box">
						<uni-data-select v-model="filters.attendantId" :localdata="attendantOptions" :clear="true" placeholder="选管家" class="mini-select"></uni-data-select>
					</view>
				</view>

				<view class="checkbox-group" @click="filters.hasVehicle = !filters.hasVehicle">
					<view class="checkbox" :class="{ checked: filters.hasVehicle }"></view>
					<text>用车</text>
				</view>
			</view>
		</view>

		<scroll-view scroll-y="true" class="order-list">
			<view v-if="displayOrders.length === 0" class="empty-tip">无符合条件的行程</view>

			<view v-for="item in displayOrders" :key="item.order_id" class="order-card">
				<view class="card-header" @click="toggleExpand(item.order_id)">
					<view class="header-main">
						<view class="title-row">
							<view class="tags-row">
								<text v-if="item.todayTags.includes('接')" class="mini-tag pickup">接</text>
								<text v-if="item.todayTags.includes('送')" class="mini-tag dropoff">送</text>
								<text v-if="item.todayTags.includes('布')" class="mini-tag potala">布</text>
								<text v-if="item.todayTags.includes('独')" class="mini-tag charter">包</text>
							</view>
							<text class="order-title">{{ item.title }}</text>
						</view>
						<view class="info-row-aggregated">
							<text class="day-indicator">D{{ item.dayIndex + 1 }}</text>
							<text class="info-segment guest">
								<text class="icon">👤</text>
								{{ item.guestName }}
								<text v-if="item.guestCount > 1">{{ item.guestCount }}人</text>
							</text>
							<text v-if="item.guideSummary" class="info-segment guide">
								<text class="icon">🚩</text>
								{{ item.guideSummary }}
							</text>
							<text v-if="item.attendantSummary" class="info-segment attendant">
								<text class="icon">☂️</text>
								{{ item.attendantSummary }}
							</text>
							<text v-if="item.vehicleSummary" class="info-segment vehicle">
								<text class="icon">🚌</text>
								{{ item.vehicleSummary }}
							</text>
						</view>
					</view>
					<view class="arrow-icon" :class="{ rotated: expandedIds.includes(item.order_id) }">▼</view>
				</view>

				<view v-if="expandedIds.includes(item.order_id)" class="card-body">
					<view class="today-highlight">
						<text class="highlight-label">今日行程：</text>
						<text class="highlight-content">{{ item.todayTitle || '无具体标题' }}</text>
					</view>
					<view class="detail-block" v-if="item.travel_users && item.travel_users.length > 0">
						<text class="block-label">出行客人 ({{ item.travel_users.length }}人)</text>
						<view class="guest-list">
							<view v-for="(guest, gIdx) in item.travel_users" :key="gIdx" class="guest-item">
								<text class="guest-name">{{ guest.name || guest.nickname || '未命名' }}</text>
								<text class="guest-mobile">{{ guest.mobile || '-' }}</text>
								<text class="guest-id" v-if="guest.id_card">({{ guest.id_card }})</text>
							</view>
						</view>
					</view>
					<view class="divider"></view>
					<view class="detail-block">
						<text class="block-label">订单信息</text>
						<view class="detail-row">ID: {{ item.order_id }}</view>
						<view class="detail-row">日期: {{ formatDate(item.start) }} - {{ formatDate(item.end) }} ({{ item.total_days }}天)</view>
					</view>
					<view class="detail-block" v-if="item.staves.length > 0">
						<text class="block-label">服务团队</text>
						<view v-for="(staff, idx) in item.staves" :key="idx" class="detail-row">
							<text class="role-badge" :class="staff.role === 'guide' ? 'bg-blue' : 'bg-purple'">{{ staff.role === 'guide' ? '导' : '管' }}</text>
							<text class="staff-name">{{ staff.name }}</text>
							<text class="detail-sub" @click="makeCall(staff.mobile)">{{ staff.mobile }}</text>
						</view>
					</view>
					<view class="detail-block" v-if="item.vehicle">
						<text class="block-label">车辆信息</text>
						<view class="detail-row">
							<text class="role-badge bg-green">车</text>
							{{ item.vehicle.plate_number }}
							<text class="detail-sub">({{ item.vehicle.model }} / {{ item.vehicle.seat_count }}座)</text>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>

		<view class="footer-count">当前显示 {{ displayOrders.length }} 单</view>
	</view>
</template>

<script>
export default {
	name: 'DailyManifest',
	props: {
		dateTs: { type: Number, default: 0 },
		rawOrders: { type: Array, default: () => [] },
		staffMap: { type: Object, default: () => ({}) },
		vehicleMap: { type: Object, default: () => ({}) }
	},
	data() {
		return {
			expandedIds: [],
			filters: {
				types: [],
				hasVehicle: false,
				guideId: '',
				attendantId: ''
			},
			filterOptions: {
				types: [
					{ label: '独立包车', value: 'charter' },
					{ label: '接机/站', value: 'pickup' },
					{ label: '送机/站', value: 'dropoff' },
					{ label: '布宫', value: 'potala' }
				]
			}
		};
	},
	computed: {
		dateStr() {
			if (!this.dateTs) return '';
			const d = new Date(this.dateTs);
			return `${d.getMonth() + 1}月${d.getDate()}日`;
		},
		processedOrders() {
			const dayMs = 24 * 3600 * 1000;
			const getZeroTime = (ts) => {
				const d = new Date(ts);
				d.setHours(0, 0, 0, 0);
				d.setMilliseconds(0);
				return d.getTime();
			};
			const targetZero = getZeroTime(this.dateTs);

			return this.rawOrders
				.map((order) => {
					const startZero = getZeroTime(order.start);
					const dayIndex = Math.round((targetZero - startZero) / dayMs);

					if (dayIndex < 0 || dayIndex >= order.total_days) {
						return null;
					}

					let todayTitle = '';
					if (order.itinerary) {
						const dayItem = order.itinerary.find((d) => d.day === dayIndex + 1) || order.itinerary[dayIndex];
						todayTitle = dayItem ? dayItem.day_title : '';
					}

					const tags = [];
					if (todayTitle.includes('接机') || todayTitle.includes('接站')) tags.push('接');
					if (todayTitle.includes('送机') || todayTitle.includes('送站')) tags.push('送');
					if (todayTitle.includes('布达拉宫')) tags.push('布');
					if (todayTitle.includes('独立包车')) tags.push('独');

					const stavesList = [];
					let guideNames = [];
					let attendantNames = [];
					const guideIds = [];
					const attendantIds = [];

					if (order.staves) {
						order.staves.forEach((s) => {
							if (s.role.includes('guide')) {
								const info = this.staffMap[s.id];
								const name = info ? info.real_name : '私导';
								stavesList.push({ role: 'guide', name, mobile: info ? info.mobile : s.mobile, id: s.id });
								guideNames.push(name);
								guideIds.push(s.id);
							}
							if (s.role.includes('attendant')) {
								const info = this.staffMap[s.id];
								const name = info ? info.real_name : '管家';
								stavesList.push({ role: 'attendant', name, mobile: info ? info.mobile : s.mobile, id: s.id });
								attendantNames.push(name);
								attendantIds.push(s.id);
							}
						});
					}

					let vehicleInfo = null;
					let vehicleSummary = '';
					if (order.vehicle_id && this.vehicleMap[order.vehicle_id]) {
						vehicleInfo = this.vehicleMap[order.vehicle_id];
						vehicleSummary = vehicleInfo.model;
					}

					let guestName = '客人';
					let guestCount = 0;
					if (order.travel_users && order.travel_users.length) {
						const g = order.travel_users[0];
						guestName = g.name || g.nickname || '客人';
						guestCount = order.travel_users.length;
					}

					return {
						...order,
						dayIndex,
						todayTitle,
						todayTags: tags,
						staves: stavesList,
						guideIds,
						attendantIds,
						vehicle: vehicleInfo,
						guestName,
						guestCount,
						guideSummary: guideNames.join('、'),
						attendantSummary: attendantNames.join('、'),
						vehicleSummary
					};
				})
				.filter((item) => item !== null);
		},
		guideOptions() {
			const map = new Map();
			this.processedOrders.forEach((order) => {
				order.staves.forEach((staff) => {
					if (staff.role === 'guide') {
						map.set(staff.id, staff.name);
					}
				});
			});
			return Array.from(map).map(([id, name]) => ({ value: id, text: name }));
		},
		attendantOptions() {
			const map = new Map();
			this.processedOrders.forEach((order) => {
				order.staves.forEach((staff) => {
					if (staff.role === 'attendant') {
						map.set(staff.id, staff.name);
					}
				});
			});
			return Array.from(map).map(([id, name]) => ({ value: id, text: name }));
		},
		displayOrders() {
			return this.processedOrders.filter((item) => {
				if (this.filters.types.length > 0) {
					const matchCharter = this.filters.types.includes('charter') && item.todayTags.includes('独');
					const matchPickup = this.filters.types.includes('pickup') && item.todayTags.includes('接');
					const matchDrop = this.filters.types.includes('dropoff') && item.todayTags.includes('送');
					const matchPotala = this.filters.types.includes('potala') && item.todayTags.includes('布');
					if (!matchCharter && !matchPickup && !matchDrop && !matchPotala) return false;
				}
				if (this.filters.hasVehicle && !item.vehicle) return false;
				if (this.filters.guideId && !item.guideIds.includes(this.filters.guideId)) return false;
				if (this.filters.attendantId && !item.attendantIds.includes(this.filters.attendantId)) return false;
				return true;
			});
		}
	},
	methods: {
		toggleTypeFilter(value) {
			const idx = this.filters.types.indexOf(value);
			if (idx > -1) {
				this.filters.types.splice(idx, 1);
			} else {
				this.filters.types.push(value);
			}
		},
		toggleExpand(id) {
			const idx = this.expandedIds.indexOf(id);
			if (idx > -1) {
				this.expandedIds.splice(idx, 1);
			} else {
				this.expandedIds.push(id);
			}
		},
		formatDate(ts) {
			return new Date(ts).toLocaleDateString();
		},
		makeCall(mobile) {
			if (mobile) {
				uni.makePhoneCall({ phoneNumber: mobile });
			}
		}
	}
};
</script>

<style lang="scss" scoped>
/* 容器样式：确保高度固定，Flex 布局 */
.manifest-container {
	background: #f5f7fa;
	height: 85vh; /* 弹窗高度 */
	display: flex;
	flex-direction: column;
	border-radius: 16px 16px 0 0;
	overflow: hidden;
}

.manifest-header {
	padding: 12px 16px;
	background: #fff;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid #eee;
	flex-shrink: 0;
	.date-title {
		font-size: 16px;
		font-weight: bold;
		color: #1f2937;
	}
	.close-icon {
		font-size: 24px;
		color: #9ca3af;
		padding: 0 8px;
		cursor: pointer;
	}
}

.filter-section {
	padding: 10px 16px;
	background: #fff;
	border-bottom: 1px solid #eee;
	flex-shrink: 0;

	.filter-row {
		display: flex;
		align-items: center;
		margin-bottom: 8px;
		&:last-child {
			margin-bottom: 0;
		}

		.filter-label {
			font-size: 12px;
			color: #6b7280;
			width: 40px;
			flex-shrink: 0;
			margin-right: 4px;
		}

		.tags-container {
			display: flex;
			flex-wrap: wrap;
			flex: 1;
			.tag-item {
				padding: 4px 12px;
				background: #f3f4f6;
				border-radius: 14px;
				font-size: 11px;
				color: #4b5563;
				margin-right: 8px;
				border: 1px solid transparent;
				&.active {
					background: #e0e7ff;
					color: #3b82f6;
					border-color: #3b82f6;
					font-weight: 500;
				}
			}
		}

		/* 优化后的选择器样式：更紧凑 */
		&.selectors-row {
			justify-content: flex-start; /* 左对齐 */

			.selector-wrapper {
				display: flex;
				align-items: center;
				margin-right: 12px; /* 元素间距 */

				.filter-label {
					width: 32px; /* 标签再窄一点 */
				}

				.select-box {
					width: 90px; /* 固定下拉框宽度，防止过宽 */

					/* 深度覆盖 uni-ui 样式 */
					::v-deep .uni-select {
						border: none;
						background-color: #f9fafb;
						height: 28px; /* 稍微调低高度 */
						font-size: 12px;
						padding: 0 6px;
						border-radius: 6px;
					}
					::v-deep .uni-select__input-text {
						font-size: 12px;
						color: #374151;
					}
					::v-deep .uni-icons {
						color: #9ca3af !important;
					}
				}
			}

			.checkbox-group {
				display: flex;
				align-items: center;
				margin-left: 12px;
				cursor: pointer;
				.checkbox {
					width: 14px;
					height: 14px;
					border: 1px solid #d1d5db;
					border-radius: 3px;
					margin-right: 4px;
					&.checked {
						background-color: #3b82f6;
						border-color: #3b82f6;
					}
				}
				text {
					font-size: 12px;
					color: #4b5563;
				}
			}
		}
	}
}

/* 滚动区域关键样式 */
.order-list {
	flex: 1; /* 占据剩余空间 */
	height: 0; /* 配合 flex:1 在某些iOS场景下的兼容性 */
	padding: 10px;
	box-sizing: border-box;
	overflow-y: auto;
}

.empty-tip {
	text-align: center;
	color: #9ca3af;
	margin-top: 50px;
	font-size: 14px;
}

.order-card {
	background: #fff;
	border-radius: 8px;
	margin-bottom: 10px;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	overflow: hidden;

	.card-header {
		padding: 12px;
		display: flex;
		justify-content: space-between;
		align-items: center;

		.header-main {
			flex: 1;
			overflow: hidden;
		}

		.title-row {
			display: flex;
			align-items: center;
			margin-bottom: 6px;
			.tags-row {
				display: flex;
				flex-shrink: 0;
				margin-right: 6px;
				.mini-tag {
					font-size: 10px;
					color: #fff;
					padding: 1px 4px;
					border-radius: 3px;
					margin-right: 3px;
					&.pickup,
					&.dropoff {
						background: #ec4899;
					}
					&.potala {
						background: #ef4444;
					}
					&.charter {
						background: #3b82f6;
					}
				}
			}
			.order-title {
				font-size: 14px;
				font-weight: 600;
				color: #111;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}

		.info-row-aggregated {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			font-size: 12px;
			color: #374151;
			line-height: 1.4;

			.day-indicator {
				font-weight: bold;
				color: #3b82f6;
				margin-right: 8px;
				background: #eff6ff;
				padding: 0 4px;
				border-radius: 4px;
			}

			.info-segment {
				display: flex;
				align-items: center;
				margin-right: 10px;
				white-space: nowrap;
				.icon {
					font-size: 10px;
					margin-right: 2px;
					opacity: 0.7;
				}
				&.guest {
					color: #1f2937;
					font-weight: 500;
				}
				&.guide {
					color: #4b5563;
				}
				&.attendant {
					color: #6b7280;
				}
				&.vehicle {
					color: #059669;
				}
			}
		}

		.arrow-icon {
			margin-left: 10px;
			color: #9ca3af;
			font-size: 12px;
			transition: transform 0.3s;
			&.rotated {
				transform: rotate(180deg);
			}
		}
	}

	.card-body {
		background: #fcfcfc;
		border-top: 1px dashed #e5e7eb;
		padding: 12px;

		.today-highlight {
			background: #f3f4f6;
			padding: 8px 10px;
			border-radius: 6px;
			margin-bottom: 12px;
			.highlight-label {
				font-size: 12px;
				color: #6b7280;
				font-weight: bold;
			}
			.highlight-content {
				font-size: 14px;
				color: #111;
				font-weight: 500;
			}
		}

		.guest-list {
			background: #fff;
			border: 1px solid #f3f4f6;
			border-radius: 4px;
			padding: 4px 8px;
			margin-bottom: 8px;
			.guest-item {
				display: flex;
				align-items: center;
				font-size: 13px;
				color: #374151;
				padding: 4px 0;
				border-bottom: 1px solid #f9fafb;
				&:last-child {
					border-bottom: none;
				}
				.guest-name {
					font-weight: 500;
					margin-right: 8px;
				}
				.guest-mobile {
					color: #6b7280;
					font-size: 12px;
					margin-right: 8px;
				}
				.guest-id {
					color: #9ca3af;
					font-size: 12px;
					transform: scale(0.9);
				}
			}
		}

		.divider {
			height: 1px;
			background: #eee;
			margin: 8px 0;
		}

		.detail-block {
			margin-bottom: 10px;
			&:last-child {
				margin-bottom: 0;
			}
			.block-label {
				font-size: 11px;
				color: #9ca3af;
				margin-bottom: 4px;
				display: block;
			}
			.detail-row {
				font-size: 13px;
				color: #4b5563;
				display: flex;
				align-items: center;
				margin-bottom: 4px;
				.staff-name {
					font-weight: 500;
					margin-right: 6px;
				}
				.detail-sub {
					font-size: 12px;
					color: #3b82f6;
					cursor: pointer;
				}
				.role-badge {
					font-size: 10px;
					color: #fff;
					padding: 1px 4px;
					border-radius: 3px;
					margin-right: 6px;
					min-width: 14px;
					text-align: center;
					&.bg-blue {
						background: #3b82f6;
					}
					&.bg-purple {
						background: #8b5cf6;
					}
					&.bg-green {
						background: #10b981;
					}
				}
			}
		}
	}
}

.footer-count {
	text-align: center;
	font-size: 11px;
	color: #9ca3af;
	padding: 8px 0;
	background: #fff;
	border-top: 1px solid #eee;
	flex-shrink: 0;
}
</style>
