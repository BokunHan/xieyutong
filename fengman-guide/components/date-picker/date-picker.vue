<template>
	<view v-if="show" class="date-picker-overlay" @click="onCancel">
		<view class="date-picker-container" @click.stop>
			<!-- 头部 -->
			<view class="date-picker-header">
				<text class="title">{{ title }}</text>
				<view class="close-btn" @click="onCancel">
					<image src="/static/icons/times.png" class="close-icon" mode="aspectFit" />
				</view>
			</view>

			<!-- 星期标题 -->
			<view class="week-header">
				<text class="week-item" v-for="(week, index) in weekDays" :key="week" :class="index === 5 || index === 6 ? 'weekend-text' : ''">{{ week }}</text>
			</view>

			<!-- 提示信息 -->
			<view class="tip-text">
				<text class="tip-content">* 价格为当天成人票最低价，价格变动频繁以支付为准</text>
			</view>

			<!-- 日期网格容器 -->
			<view class="calendar-months">
				<!-- 当前月份 -->
				<view class="month-section">
					<text class="month-title">{{ currentYear }}年{{ currentMonth }}月</text>
					<view class="date-grid">
						<view
							v-for="date in currentMonthDates"
							:key="date.key"
							class="date-item"
							:class="{
								'other-month': !date.isCurrentMonth,
								today: date.isToday,
								selected: date.isSelected,
								disabled: date.isDisabled,
								weekend: date.isWeekend,
								'has-festival': date.festival
							}"
							@click="selectDate(date)">
							<view class="date-content">
								<text v-if="date.festival" class="festival-text">{{ date.festival }}</text>
								<view class="day-container" :class="{ 'selected-day': date.isSelected, 'today-day': date.isToday }">
									<text class="day-number">{{ date.day }}</text>
								</view>
								<text v-if="date.isSelected" class="selected-label">出发</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 下一个月份 -->
				<view class="month-section">
					<text class="month-title">{{ nextMonthYear }}年{{ nextMonthMonth }}月</text>
					<view class="date-grid">
						<view
							v-for="date in nextMonthDates"
							:key="date.key"
							class="date-item"
							:class="{
								'other-month': !date.isCurrentMonth,
								today: date.isToday,
								selected: date.isSelected,
								disabled: date.isDisabled,
								weekend: date.isWeekend,
								'has-festival': date.festival
							}"
							@click="selectDate(date)">
							<view class="date-content">
								<text v-if="date.festival" class="festival-text">{{ date.festival }}</text>
								<view class="day-container" :class="{ 'selected-day': date.isSelected, 'today-day': date.isToday }">
									<text class="day-number">{{ date.day }}</text>
								</view>
								<text v-if="date.isSelected" class="selected-label">出发</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'DatePicker',
	props: {
		show: {
			type: Boolean,
			default: false
		},
		title: {
			type: String,
			default: '选择出发日期'
		},
		minDate: {
			type: String,
			default: ''
		},
		maxDate: {
			type: String,
			default: ''
		},
		value: {
			type: String,
			default: ''
		}
	},

	data() {
		return {
			currentDate: new Date(),
			selectedDate: '',
			weekDays: ['一', '二', '三', '四', '五', '六', '日']
		};
	},

	computed: {
		currentYear() {
			return this.currentDate.getFullYear();
		},

		currentMonth() {
			return this.currentDate.getMonth() + 1;
		},

		nextMonthYear() {
			const nextMonth = new Date(this.currentDate);
			nextMonth.setMonth(nextMonth.getMonth() + 1);
			return nextMonth.getFullYear();
		},

		nextMonthMonth() {
			const nextMonth = new Date(this.currentDate);
			nextMonth.setMonth(nextMonth.getMonth() + 1);
			return nextMonth.getMonth() + 1;
		},

		// 生成当月的日期列表
		currentMonthDates() {
			return this.generateMonthDates(this.currentYear, this.currentMonth);
		},

		// 生成下一个月的日期列表
		nextMonthDates() {
			return this.generateMonthDates(this.nextMonthYear, this.nextMonthMonth);
		}
	},

	watch: {
		value: {
			immediate: true,
			handler(newVal) {
				this.selectedDate = newVal;
			}
		},

		show(newVal) {
			if (newVal) {
				// 如果有选中的日期，跳转到对应月份
				if (this.selectedDate) {
					this.currentDate = new Date(this.selectedDate);
				}
			}
		}
	},

	methods: {
		// 生成指定月份的日期数据
		generateMonthDates(year, month) {
			const today = new Date();
			// 设置为当天0点，用于日期比较
			today.setHours(0, 0, 0, 0);

			// 处理最小日期
			let minDate;
			if (this.minDate) {
				minDate = new Date(this.minDate + 'T00:00:00');
			} else {
				// 默认从明天开始
				minDate = new Date(today);
				minDate.setDate(minDate.getDate() + 1);
			}
			minDate.setHours(0, 0, 0, 0);

			// 处理最大日期
			let maxDate;
			if (this.maxDate) {
				maxDate = new Date(this.maxDate + 'T00:00:00');
			} else {
				// 默认3个月后
				maxDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
			}
			maxDate.setHours(0, 0, 0, 0);

			// 当月第一天是星期几 (调整为周一开始: 0=周日变为6, 1=周一变为0)
			const firstDay = new Date(year, month - 1, 1);
			const firstDayWeek = (firstDay.getDay() + 6) % 7;

			// 当月有多少天
			const daysInMonth = new Date(year, month, 0).getDate();

			// 上月有多少天
			const prevMonthDays = new Date(year, month - 1, 0).getDate();

			const dateList = [];

			// 填充上月的日期
			for (let i = firstDayWeek - 1; i >= 0; i--) {
				const day = prevMonthDays - i;
				const date = new Date(year, month - 2, day);
				dateList.push({
					key: `${year}-${month}-prev-${day}`,
					day: day,
					date: date,
					dateString: this.formatDate(date),
					isCurrentMonth: false,
					isToday: false,
					isSelected: false,
					isDisabled: true,
					isWeekend: date.getDay() === 0 || date.getDay() === 6,
					festival: null
				});
			}

			// 填充当月的日期
			for (let day = 1; day <= daysInMonth; day++) {
				const date = new Date(year, month - 1, day);
				date.setHours(0, 0, 0, 0); // 设置为0点进行比较
				const dateString = this.formatDate(date);
				const isToday = this.isSameDay(date, today);
				const isDisabled = date < minDate || date > maxDate;
				const isWeekend = date.getDay() === 0 || date.getDay() === 6;

				dateList.push({
					key: `${year}-${month}-current-${day}`,
					day: day,
					date: date,
					dateString: dateString,
					isCurrentMonth: true,
					isToday: isToday,
					isSelected: this.selectedDate === dateString,
					isDisabled: isDisabled,
					isWeekend: isWeekend,
					festival: this.getFestival(date)
				});
			}

			// 填充下月的日期，确保总共42个格子（6行7列）
			const remainingCells = 42 - dateList.length;
			for (let day = 1; day <= remainingCells; day++) {
				const date = new Date(year, month, day);
				dateList.push({
					key: `${year}-${month}-next-${day}`,
					day: day,
					date: date,
					dateString: this.formatDate(date),
					isCurrentMonth: false,
					isToday: false,
					isSelected: false,
					isDisabled: true,
					isWeekend: date.getDay() === 0 || date.getDay() === 6,
					festival: null
				});
			}

			return dateList;
		},

		// 获取节日信息
		getFestival(date) {
			const month = date.getMonth() + 1;
			const day = date.getDate();

			// 一些常见节日，可以根据需要扩展
			const festivals = {
				'1-1': '元旦',
				'2-14': '情人节',
				'3-8': '妇女节',
				'5-1': '劳动节',
				'6-1': '儿童节',
				'8-1': '建军节',
				'10-1': '国庆节',
				'12-25': '圣诞节'
			};

			return festivals[`${month}-${day}`] || null;
		},

		// 选择日期
		selectDate(dateItem) {
			if (dateItem.isDisabled || !dateItem.isCurrentMonth) {
				return;
			}

			this.selectedDate = dateItem.dateString;

			// 直接确认选择
			this.$emit('confirm', this.selectedDate);
		},

		// 取消
		onCancel() {
			this.$emit('cancel');
		},

		// 格式化日期为 YYYY-MM-DD
		formatDate(date) {
			const year = date.getFullYear();
			const month = (date.getMonth() + 1).toString().padStart(2, '0');
			const day = date.getDate().toString().padStart(2, '0');
			return `${year}-${month}-${day}`;
		},

		// 判断是否为同一天
		isSameDay(date1, date2) {
			// 创建副本避免修改原始日期
			const d1 = new Date(date1);
			const d2 = new Date(date2);
			d1.setHours(0, 0, 0, 0);
			d2.setHours(0, 0, 0, 0);
			return d1.getTime() === d2.getTime();
		}
	}
};
</script>

<style scoped>
.close-icon {
	width: 24px;
	height: 24px;
}

.date-picker-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: flex-end;
	justify-content: center;
	z-index: 1000;
}

.date-picker-container {
	background-color: white;
	border-radius: 16px 16px 0 0;
	width: 100vw;
	max-height: 80vh;
	overflow-y: auto;
	animation: slideUp 0.3s ease-out;
	box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}

@keyframes slideUp {
	from {
		transform: translateY(100%);
	}
	to {
		transform: translateY(0);
	}
}

.date-picker-header {
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 16px 20px;
	border-bottom: 1px solid #f0f0f0;
	background-color: white;
}

.title {
	font-size: 18px;
	font-weight: 500;
	color: #333;
}

.close-btn {
	position: absolute;
	right: 16px;
	top: 50%;
	transform: translateY(-50%);
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background-color: transparent;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #999;
	font-size: 16px;
}

.close-btn:active {
	background-color: #f0f0f0;
}

.week-header {
	display: flex;
	background-color: #f5f5f7;
	padding: 8px 0;
}

.week-item {
	flex: 1;
	text-align: center;
	font-size: 14px;
	color: #999;
	font-weight: 500;
}

.weekend-text {
	color: #191970;
}

.tip-text {
	padding: 12px 16px;
	background-color: #f5f5f7;
	border-bottom: 1px solid #e0e0e0;
}

.tip-text .tip-content {
	font-size: 12px;
	color: #999;
	line-height: 1.4;
}

.calendar-months {
	padding: 0 20px 20px;
}

.month-section {
	margin-bottom: 24px;
}

.month-title {
	font-size: 18px;
	font-weight: 500;
	color: #333;
	margin: 20px 0 16px;
	display: block;
}

.date-grid {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 4px;
}

.date-item {
	height: 60px;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	cursor: pointer;
}

.date-item:active:not(.disabled) {
	opacity: 0.6;
}

.date-item.other-month {
	visibility: hidden;
}

.date-item.disabled {
	color: #e0e0e0;
	cursor: not-allowed;
}

.date-content {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	position: relative;
	border-radius: 8px;
	border: 1px solid transparent;
	padding: 4px 0;
	box-sizing: border-box;
}

.festival-text {
	font-size: 10px;
	color: #ef4444;
	margin-bottom: 2px;
	line-height: 1;
}

.day-container {
	width: 36px;
	height: 36px;
	border-radius: 50% !important;
	background: transparent !important;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	flex-shrink: 0;
	flex-grow: 0;
}

.day-number {
	font-size: 16px;
	font-weight: 500;
	color: #333;
	line-height: 1.2;
}

.date-item.today .day-container {
	background-color: #0086f6;
}

.date-item.today .day-number {
	color: white;
}

.date-item.selected .day-container {
	background-color: #ff6b35;
	border-radius: 50% !important;
	width: 36px;
	height: 36px;
}

.date-item.selected .day-number {
	color: white;
}

.date-item.weekend:not(.disabled):not(.selected):not(.today) .day-number {
	color: #4169e1;
}

.date-item.disabled .day-number {
	color: #e0e0e0;
}

.selected-label {
	position: static;
	position: absolute;
	bottom: -20px;
	font-size: 10px;
	color: white;
	background-color: #ff6b35;
	padding: 2px 8px;
	border-radius: 8px;
	white-space: nowrap;
}

/* 今天的特殊样式 */
.today-day {
	background-color: #0086f6 !important;
	border-radius: 50% !important;
	width: 36px !important;
	height: 36px !important;
}

.today-day .day-number {
	color: white !important;
}

/* 选中日期的特殊样式 */
.selected-day {
	background-color: #ff6b35 !important;
	border-radius: 50% !important;
	width: 36px !important;
	height: 36px !important;
}

.selected-day .day-number {
	color: white !important;
}
</style>
