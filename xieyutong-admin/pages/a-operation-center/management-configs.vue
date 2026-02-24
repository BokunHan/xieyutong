<template>
	<view class="page-container">
		<view class="main-body">
			<view class="side-nav">
				<view class="nav-item" :class="{ active: currentTab === 'assessment' }" @click="currentTab = 'assessment'">
					<uni-icons type="tune" size="16" :color="currentTab === 'assessment' ? '#3b82f6' : '#666'"></uni-icons>
					<text>考核规则</text>
				</view>
				<view class="nav-item" :class="{ active: currentTab === 'benchmark' }" @click="currentTab = 'benchmark'">
					<uni-icons type="flag" size="16" :color="currentTab === 'benchmark' ? '#3b82f6' : '#666'"></uni-icons>
					<text>基准值设置</text>
				</view>
				<view class="nav-item" :class="{ active: currentTab === 'grab' }" @click="currentTab = 'grab'">
					<uni-icons type="paperplane" size="16" :color="currentTab === 'grab' ? '#3b82f6' : '#666'"></uni-icons>
					<text>抢单设置</text>
				</view>
				<view class="nav-item" :class="{ active: currentTab === 'system' }" @click="currentTab = 'system'">
					<uni-icons type="gear" size="16" :color="currentTab === 'system' ? '#3b82f6' : '#666'"></uni-icons>
					<text>系统设置</text>
				</view>
				<view class="nav-item" :class="{ active: currentTab === 'data' }" @click="currentTab = 'data'">
					<uni-icons type="folder-add" size="16" :color="currentTab === 'data' ? '#3b82f6' : '#666'"></uni-icons>
					<text>数据管理</text>
				</view>
			</view>

			<scroll-view scroll-y="true" class="content-area">
				<view class="loading-state" v-if="isLoading">
					<uni-load-more status="loading" />
				</view>

				<view class="config-panel" v-if="!isLoading && currentTab === 'assessment'">
					<view class="panel-header-row">
						<view class="header-left">
							<text class="panel-title">考核体系设置</text>
							<view class="role-switcher">
								<text
									v-for="role in ['guide', 'sale', 'attendant']"
									:key="role"
									class="role-tab"
									:class="{ active: currentAssessmentRole === role }"
									@click="currentAssessmentRole = role">
									{{ getRoleName(role) }}
								</text>
							</view>
						</view>
						<button class="uni-btn-primary" @click="saveAllConfigs" :loading="isSaving">
							<uni-icons type="checkmarkempty" size="16" color="#fff"></uni-icons>
							保存所有配置
						</button>
					</view>

					<view class="sub-card">
						<view class="card-header-row">
							<view class="card-title">1. 考核维度 (权重总和: {{ currentDimensionsWeight }}%)</view>
							<button class="mini-btn" @click="addDimension">+ 添加维度</button>
						</view>

						<view class="table-container">
							<view class="table-header">
								<text class="th" style="flex: 2">维度名称</text>
								<text class="th">权重(%)</text>
								<text class="th">核算天数</text>
								<text class="th">满分</text>
								<text class="th">基础分</text>
								<text class="th" style="width: 50px">操作</text>
							</view>
							<view class="table-row" v-for="(dim, index) in currentConfig.dimensions" :key="index">
								<input class="td-input" style="flex: 2" v-model="dim.name" placeholder="如:活跃分" />
								<input class="td-input" type="number" v-model.number="dim.weight" />
								<input class="td-input" type="number" v-model.number="dim.period_days" placeholder="如:30" />
								<input class="td-input" type="number" v-model.number="dim.max_score" />
								<input class="td-input" type="number" v-model.number="dim.default_score" />
								<view class="td-action" @click="removeDimension(index)">
									<uni-icons type="trash" color="#ef4444" size="16"></uni-icons>
								</view>
							</view>
							<view v-if="currentConfig.dimensions.length === 0" class="empty-text">暂无维度，请添加</view>
						</view>
					</view>

					<view class="sub-card">
						<view class="card-header-row">
							<view class="card-title">2. 详细计分项规则</view>
							<button class="mini-btn blue" @click="addRule" :disabled="!currentRuleDimKey" :class="{ disabled: !currentRuleDimKey }">+ 添加规则</button>
						</view>

						<scroll-view scroll-x="true" class="dim-tabs-scroll" v-if="currentConfig.dimensions.length > 0">
							<view class="dim-tabs-container">
								<view
									class="dim-tab-item"
									v-for="(dim, idx) in currentConfig.dimensions"
									:key="dim.key"
									:class="{ active: currentRuleDimKey === dim.key }"
									@click="switchRuleTab(dim.key)">
									{{ dim.name || '未命名维度' }}
									<text class="count-badge" v-if="getRuleCount(dim.key) > 0">{{ getRuleCount(dim.key) }}</text>
								</view>
							</view>
						</scroll-view>

						<view class="rules-list">
							<view v-if="currentConfig.dimensions.length === 0" class="empty-text">请先在上方添加考核维度</view>

							<view v-else-if="filteredRules.length === 0" class="empty-text">【{{ getDimName(currentRuleDimKey) }}】维度下暂无规则，请点击右上角添加</view>

							<view class="rule-item" v-for="(rule, index) in filteredRules" :key="rule._originalIndex">
								<view class="rule-header">
									<text class="rule-index">#{{ index + 1 }}</text>
									<view class="action-icon" @click="removeRule(rule._originalIndex)">
										<uni-icons type="closeempty" color="#999" size="14"></uni-icons>
									</view>
								</view>

								<view class="rule-grid">
									<view class="logic-row">
										<view class="form-item wide">
											<text class="label">计分项目</text>
											<picker :range="scoringItems" range-key="label" @change="(e) => updateRuleItem(rule._originalIndex, e.detail.value)">
												<view class="picker">
													<text>{{ getItemLabel(currentConfig.rules[rule._originalIndex].item_code) }}</text>
													<uni-icons type="bottom" size="12"></uni-icons>
												</view>
											</picker>
										</view>

										<view class="form-item">
											<text class="label">运算符</text>
											<picker :range="operators" range-key="label" @change="(e) => (currentConfig.rules[rule._originalIndex].operator = operators[e.detail.value].value)">
												<view class="picker center">{{ getOpLabel(currentConfig.rules[rule._originalIndex].operator) }}</view>
											</picker>
										</view>

										<view class="form-item wide-input">
											<view class="label-row">
												<text class="label">
													{{
														!currentConfig.rules[rule._originalIndex].use_benchmark
															? '目标数值'
															: getItemBenchmarkType(currentConfig.rules[rule._originalIndex].item_code) === 'penalty'
															? '惩罚规则'
															: '奖励规则'
													}}
												</text>
												<view v-if="canUseBenchmark(currentConfig.rules[rule._originalIndex].item_code)" class="benchmark-switch" @click="toggleBenchmark(rule._originalIndex)">
													<text :class="{ active: !currentConfig.rules[rule._originalIndex].use_benchmark }">固定</text>
													<text :class="{ active: currentConfig.rules[rule._originalIndex].use_benchmark }">基准</text>
												</view>
											</view>

											<view v-if="currentConfig.rules[rule._originalIndex].use_benchmark" class="benchmark-config-box">
												<block v-if="getItemBenchmarkType(currentConfig.rules[rule._originalIndex].item_code) === 'penalty'">
													<view class="bonus-row">
														<text>每缺</text>
														<input class="mini-input" type="number" v-model.number="currentConfig.rules[rule._originalIndex].bonus_step_rate" placeholder="5" />
														<text>%</text>
													</view>
													<view class="bonus-row">
														<text>扣</text>
														<input class="mini-input" type="number" v-model.number="currentConfig.rules[rule._originalIndex].bonus_step_score" placeholder="1" />
														<text>分</text>
													</view>
												</block>
												<block v-else>
													<view class="bonus-row">
														<text>每超</text>
														<input class="mini-input" type="number" v-model.number="currentConfig.rules[rule._originalIndex].bonus_step_rate" placeholder="10" />
														<text>%</text>
													</view>
													<view class="bonus-row">
														<text>加</text>
														<input class="mini-input" type="number" v-model.number="currentConfig.rules[rule._originalIndex].bonus_step_score" placeholder="1" />
														<text>分</text>
													</view>
												</block>
											</view>

											<view v-else class="input-with-suffix">
												<input class="input-inner" type="number" v-model.number="currentConfig.rules[rule._originalIndex].threshold" placeholder="0" />
												<text class="suffix">{{ getItemUnit(currentConfig.rules[rule._originalIndex].item_code) }}</text>
											</view>
										</view>

										<view class="arrow">→</view>

										<view class="form-item">
											<text class="label">
												{{ currentConfig.rules[rule._originalIndex].use_benchmark ? '满分/基数' : '分数变化' }}
											</text>

											<input class="input center" type="number" v-model.number="currentConfig.rules[rule._originalIndex].score_change" placeholder="分值" />
										</view>
									</view>

									<view class="limit-row">
										<view class="form-item small">
											<text class="label">上限(选填)</text>
											<input class="input" type="number" v-model.number="currentConfig.rules[rule._originalIndex].max_limit" placeholder="无" />
										</view>
										<view class="form-item small">
											<text class="label">下限(选填)</text>
											<input class="input" type="number" v-model.number="currentConfig.rules[rule._originalIndex].min_limit" placeholder="无" />
										</view>
									</view>
								</view>

								<view class="rule-summary">
									<uni-icons type="info" size="12" color="#3b82f6"></uni-icons>

									<text v-if="rule.use_benchmark && getItemBenchmarkType(rule.item_code) === 'penalty'">
										倒扣模式：以设定的 [基准值] 为目标，每缺失 [{{ rule.bonus_step_rate || 5 }}%] 扣 [{{ rule.bonus_step_score || 1 }}] 分，扣完为止。
									</text>

									<text v-else-if="rule.use_benchmark">
										基准模式：以设定的 [基准值] 为目标，未达标将按完成比例折算得分； 达标获得 [{{ rule.score_change }}] 分，每超出基准 [{{ rule.bonus_step_rate || 10 }}%] 额外奖励
										[{{ rule.bonus_step_score || 0 }}] 分 {{ rule.max_limit ? ` (最高封顶 ${rule.max_limit} 分)` : '' }}。
									</text>

									<text v-else>
										规则含义：当 [{{ getItemLabel(rule.item_code) }}]
										{{ getOpLabel(rule.operator) }}
										{{ rule.threshold || 0 }}{{ getItemUnit(rule.item_code) }} 时 {{ rule.score_change > 0 ? '+' : '' }}{{ rule.score_change || 0 }}分
										{{ rule.max_limit && `，上限${rule.max_limit}分` }}
										{{ rule.min_limit && `，下限${rule.min_limit}分` }}
										。
									</text>
								</view>
							</view>
						</view>
					</view>
				</view>

				<view class="config-panel" v-if="!isLoading && currentTab === 'benchmark'">
					<view class="panel-header">业绩基准值设置</view>
					<button class="uni-btn-primary" @click="saveAllConfigs" :loading="isSaving">
						<uni-icons type="checkmarkempty" size="16" color="#fff"></uni-icons>
						保存配置
					</button>

					<view class="sub-card">
						<view class="card-title">私导拍摄任务分级标准</view>
						<view class="guide-standards-table">
							<view class="gs-header">
								<text class="th role">等级</text>
								<text class="th">照片要求 (张/天)</text>
								<text class="th wide">视频要求 (N天M条)</text>
								<text class="th">宣传级素材 (张/天)</text>
							</view>

							<view class="gs-row" v-for="level in ['D', 'C', 'B', 'A']" :key="level">
								<view class="td role">
									<text class="level-badge" :class="level">{{ level }}级</text>
								</view>
								<view class="td">
									<input class="input" type="number" v-model.number="config.benchmarks.guide_standards[level].photo_daily" />
								</view>
								<view class="td wide flex-row">
									<text>每</text>
									<input class="mini-input" type="number" v-model.number="config.benchmarks.guide_standards[level].video_days" />
									<text>天，至少</text>
									<input class="mini-input" type="number" v-model.number="config.benchmarks.guide_standards[level].video_count" />
									<text>条</text>
								</view>
								<view class="td">
									<input class="input" type="number" v-model.number="config.benchmarks.guide_standards[level].promo_daily" placeholder="无" />
								</view>
							</view>
						</view>
						<view class="tips-box">
							<uni-icons type="info" size="14" color="#6b7280"></uni-icons>
							<text>说明：视频要求设置为 "每1天至少1条" 即为日更；"每3天至少1条" 即为3天一更；数量设为0表示无要求。</text>
						</view>
					</view>

					<view class="sub-card">
						<view class="card-title">销售基准值</view>
						<view class="form-grid">
							<view class="form-item">
								<text class="label">携程渠道销售额（元）</text>
								<input class="input" type="number" v-model.number="config.benchmarks.sales_target_ctrip" />
							</view>
							<view class="form-item">
								<text class="label">非携程渠道销售额（元）</text>
								<input class="input" type="number" v-model.number="config.benchmarks.sales_target_other" />
							</view>
							<view class="form-item">
								<text class="label">携程渠道转化率(%)</text>
								<input class="input" type="number" v-model.number="config.benchmarks.conversion_rate_ctrip" />
							</view>
							<view class="form-item">
								<text class="label">非携程渠道转化率(%)</text>
								<input class="input" type="number" v-model.number="config.benchmarks.conversion_rate_other" />
							</view>
							<view class="form-item">
								<text class="label">跟进率基准值 (%)</text>
								<input class="input" type="number" v-model.number="config.benchmarks.follow_up_rate" placeholder="100" />
							</view>
							<view class="form-item">
								<text class="label">客户满意度基准值 (%)</text>
								<input class="input" type="number" v-model.number="config.benchmarks.satisfaction_target" placeholder="90" />
							</view>
							<view class="form-item">
								<text class="label">回购率基准 (%)</text>
								<input class="input" type="number" v-model.number="config.benchmarks.repurchase_rate" placeholder="15" />
							</view>
							<view class="form-item">
								<text class="label">转介绍率基准 (%)</text>
								<input class="input" type="number" v-model.number="config.benchmarks.referral_rate" placeholder="10" />
							</view>
							<view class="form-item">
								<text class="label">长期客户维护数 (个)</text>
								<input class="input" type="number" v-model.number="config.benchmarks.long_term_count" placeholder="10" />
							</view>
						</view>
					</view>

					<view class="sub-card">
						<view class="card-title" style="margin-top: 20px">管家基准值</view>
						<view class="form-grid">
							<view class="form-item">
								<text class="label">NPS评分目标值</text>
								<input class="input" type="number" v-model.number="config.benchmarks.nps_target" placeholder="50" />
							</view>
						</view>
					</view>
				</view>

				<view class="config-panel" v-if="!isLoading && currentTab === 'grab'">
					<view class="panel-header">自动抢单规则配置</view>
					<button class="uni-btn-primary" @click="saveAllConfigs" :loading="isSaving">
						<uni-icons type="checkmarkempty" size="16" color="#fff"></uni-icons>
						保存配置
					</button>

					<view class="sub-card">
						<view class="card-header-row">
							<view class="card-title">全局控制</view>
						</view>
						<view class="flex">
							<view class="form-item flex w-1/2">
								<text class="label">抢单功能总开关</text>
								<switch :checked="config.grab_settings.enabled" @change="(e) => (config.grab_settings.enabled = e.detail.value)" color="#3b82f6" />
							</view>
							<view class="form-item flex w-1/2">
								<text class="label">每轮间隔时间 (秒)</text>
								<view style="display: flex; align-items: center; gap: 10px">
									<input class="input" type="number" v-model.number="config.grab_settings.grab_interval" placeholder="30" style="width: 100px; text-align: center" />
								</view>
							</view>
						</view>
					</view>

					<view class="sub-card">
						<view class="card-title">过滤白名单设置</view>
						<view class="tips-box" style="margin-bottom: 15px">
							<text>说明：开启对应开关后，只有匹配白名单内容的订单才会进行抢单。多个关键词请用逗号分隔。</text>
						</view>

						<view class="rule-item" style="margin-bottom: 20px; border-bottom: 1px dashed #eee; padding-bottom: 15px">
							<view class="label-row" style="margin-bottom: 10px">
								<text class="label" style="font-weight: bold">1. 出发地筛选</text>
								<switch
									transform-scale="0.8"
									:checked="config.grab_settings.departure.switch"
									@change="(e) => (config.grab_settings.departure.switch = e.detail.value)"
									color="#3b82f6" />
							</view>
							<view v-if="config.grab_settings.departure.switch">
								<uni-easyinput type="textarea" v-model="departureStr" placeholder="请输入允许的出发地，如：上海,北京,杭州" trim="all"></uni-easyinput>
							</view>
						</view>

						<view class="rule-item" style="margin-bottom: 20px; border-bottom: 1px dashed #eee; padding-bottom: 15px">
							<view class="label-row" style="margin-bottom: 10px">
								<text class="label" style="font-weight: bold">2. 目的地筛选</text>
								<switch
									transform-scale="0.8"
									:checked="config.grab_settings.destination.switch"
									@change="(e) => (config.grab_settings.destination.switch = e.detail.value)"
									color="#3b82f6" />
							</view>
							<view v-if="config.grab_settings.destination.switch">
								<uni-easyinput type="textarea" v-model="destinationStr" placeholder="请输入允许的目的地，如：林芝,三亚,丽江" trim="all"></uni-easyinput>
							</view>
						</view>

						<view class="rule-item" style="margin-bottom: 20px; border-bottom: 1px dashed #eee; padding-bottom: 15px">
							<view class="label-row" style="margin-bottom: 10px">
								<text class="label" style="font-weight: bold">3. 代订服务筛选</text>
								<switch
									transform-scale="0.8"
									:checked="config.grab_settings.service_type.switch"
									@change="(e) => (config.grab_settings.service_type.switch = e.detail.value)"
									color="#3b82f6" />
							</view>
							<view v-if="config.grab_settings.service_type.switch">
								<uni-easyinput type="textarea" v-model="serviceStr" placeholder="请输入允许的服务，如：代订服务,仅机票" trim="all"></uni-easyinput>
							</view>
						</view>

						<view class="rule-item">
							<view class="label-row" style="margin-bottom: 10px">
								<text class="label" style="font-weight: bold">4. 最少出行人数 (成人+儿童)</text>
								<switch
									transform-scale="0.8"
									:checked="config.grab_settings.headcount.switch"
									@change="(e) => (config.grab_settings.headcount.switch = e.detail.value)"
									color="#3b82f6" />
							</view>
							<view v-if="config.grab_settings.headcount.switch" style="display: flex; align-items: center; gap: 10px">
								<text>订单总人数需大于等于：</text>
								<input
									class="input"
									type="number"
									style="width: 80px; text-align: center; border: 1px solid #ddd; height: 32px; border-radius: 4px"
									v-model.number="config.grab_settings.headcount.min_count" />
								<text>人</text>
							</view>
						</view>
					</view>
				</view>

				<view class="config-panel" v-if="!isLoading && currentTab === 'system'">
					<view class="panel-header">系统全局设置</view>
				</view>

				<view class="config-panel" v-if="!isLoading && currentTab === 'data'">
					<view class="panel-header">数据维护与备份</view>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const CONFIG_ID = 'GLOBAL_CONFIG';

// 定义可用的计分项目
const SCORING_ITEMS_GUIDE = [
	{ label: '订单总数', value: 'order_count' },
	{ label: '服务天数', value: 'service_days' },
	{ label: '拒单数', value: 'rejected_orders' },
	{ label: '无故取消数', value: 'cancelled_orders' },
	{ label: '迟到早退数', value: 'lateness_count' },
	{ label: '评论数', value: 'review_count' },
	{ label: '评价平均分', value: 'rating_avg' },
	{ label: '5分好评数', value: 'rating_5_star' },
	{ label: '中差评数(<4分)', value: 'rating_bad' },
	{ label: '服务失误数', value: 'service_errors' },
	{ label: '报账逾漏数', value: 'accounting_delays' },
	{ label: '轻微违章数', value: 'minor_violations' },
	{ label: '严重违章数', value: 'serious_violations' },
	{ label: '拍摄达标率', value: 'photo_standard_pct' },
	{ label: '照片质量分', value: 'photo_quality_score' },
	{ label: '视频质量分', value: 'video_quality_score' },
	{ label: '素材上传逾漏', value: 'material_delays' },
	{ label: '宣传素材数', value: 'promo_materials' }
];

const SCORING_ITEMS_SALE = [
	// --- 复杂拆分项 (基准模式) ---
	{ label: '销售额', value: 'sales_amount', benchmarkType: 'bonus' },
	{ label: '转化率', value: 'conversion_rate', benchmarkType: 'bonus' },

	// --- 通用惩罚项 (倒扣模式) ---
	{ label: '潜在客户跟进率', value: 'follow_up_rate', benchmarkType: 'penalty' },
	{ label: '客户满意度(评分)', value: 'satisfaction_avg', benchmarkType: 'penalty' },
	{ label: '客户回购率', value: 'repurchase_rate', benchmarkType: 'penalty' },
	{ label: '客户转介绍率', value: 'referral_rate', benchmarkType: 'penalty' },
	{ label: '长期客户维护数', value: 'long_term_count', benchmarkType: 'penalty' },

	// --- 其他普通项 ---
	{ label: '客户投诉次数', value: 'complaint_count' },
	{ label: '响应未达标次数', value: 'response_violation_count' },
	{ label: '信息录入错误', value: 'data_entry_error_count' },
	{ label: '流程违规次数', value: 'workflow_violation_count' },
	{ label: '团队协作违规', value: 'team_violation_count' }
];

const SCORING_ITEMS_ATTENDANT = [
	{ label: 'NPS评分', value: 'nps_score', benchmarkType: 'penalty' },
	{ label: '贬损差评次数', value: 'detractor_count' },
	{ label: '客户好评与表扬', value: 'praise_count' },
	{ label: '主动纠正成本差异', value: 'cost_correction_count' },
	{ label: '主动协助同事', value: 'assist_colleague_count' },
	{ label: '担任新人导师', value: 'mentor_count' },
	{ label: '有效经验分享', value: 'knowledge_share_count' },
	{ label: 'L2级及以上客诉', value: 'l2_complaint_count' },
	{ label: '重大操作失误', value: 'major_error_count' },
	{ label: '跨部门推诿投诉', value: 'shirking_complaint_count' },
	{ label: '“1小时启动”迟漏', value: 'startup_delay_count' },
	{ label: '司机派单专项未达标', value: 'driver_dispatch_fail_count' },
	{ label: '响应未达标', value: 'response_fail_count' },
	{ label: '响应处理不当', value: 'response_mishandle_count' },
	{ label: '预订信息错误', value: 'booking_error_count' },
	{ label: '行后审核迟漏', value: 'audit_delay_count' },
	{ label: '资源库维护迟漏', value: 'resource_maintenance_delay_count' }
];

const OPERATORS = [
	{ label: '大于 (>)', value: 'gt' },
	{ label: '大于等于 (>=)', value: 'gte' },
	{ label: '等于 (==)', value: 'eq' },
	{ label: '小于 (<)', value: 'lt' },
	{ label: '小于等于 (<=)', value: 'lte' },
	{ label: '每发生 (x=)', value: 'per' }
];

export default {
	data() {
		return {
			isLoading: true,
			isSaving: false,
			currentTab: 'assessment',
			currentAssessmentRole: 'guide', // guide, sale, attendant
			currentRuleDimKey: '',

			// 抢单设置相关
			departureStr: '',
			destinationStr: '',
			serviceStr: '',

			// 常量列表
			// scoringItems: SCORING_ITEMS_GUIDE, // 目前只实现了私导
			operators: OPERATORS,

			config: {
				_id: CONFIG_ID,
				assessment_configs: {
					guide: { dimensions: [], rules: [] },
					sale: { dimensions: [], rules: [] },
					attendant: { dimensions: [], rules: [] }
				},
				benchmarks: {
					sales_target_monthly: 150000,
					conversion_rate_target: 35,
					satisfaction_target: 90,
					follow_up_rate: 100,
					nps_target: 40,
					guide_standards: {
						D: { photo_daily: 10, video_count: 0, video_days: 1, promo_daily: 0 },
						C: { photo_daily: 30, video_count: 1, video_days: 3, promo_daily: 0 },
						B: { photo_daily: 50, video_count: 1, video_days: 1, promo_daily: 0 },
						A: { photo_daily: 100, video_count: 1, video_days: 1, promo_daily: 10 }
					}
				},
				dispatch_rules: {
					ctrip_rule: 'A级优先, B级补充',
					other_rule: '按绩效分配'
				},
				system_settings: {
					show_charts: true,
					auto_refresh: true,
					show_notifications: true,
					local_storage: true
				}
			}
		};
	},
	computed: {
		// 获取当前角色的配置对象
		currentConfig() {
			if (!this.config.assessment_configs) {
				this.config.assessment_configs = { guide: { dimensions: [], rules: [] }, sale: {}, attendant: {} };
			}
			if (!this.config.assessment_configs[this.currentAssessmentRole]) {
				this.$set(this.config.assessment_configs, this.currentAssessmentRole, { dimensions: [], rules: [] });
			}
			return this.config.assessment_configs[this.currentAssessmentRole] || { dimensions: [], rules: [] };
		},
		currentDimensionsWeight() {
			return (this.currentConfig.dimensions || []).reduce((sum, item) => sum + (item.weight || 0), 0);
		},
		dimensionNames() {
			return (this.currentConfig.dimensions || []).map((d) => d.name);
		},
		filteredRules() {
			// 确保 rules 存在且为数组
			const rules = this.currentConfig.rules || [];
			if (!this.currentRuleDimKey) return [];
			// 映射原始索引以便删除
			return rules.map((r, i) => ({ ...r, _originalIndex: i })).filter((r) => r.dimension_key === this.currentRuleDimKey);
		},
		scoringItems() {
			if (this.currentAssessmentRole === 'sale') return SCORING_ITEMS_SALE;
			if (this.currentAssessmentRole === 'attendant') return SCORING_ITEMS_ATTENDANT;
			return SCORING_ITEMS_GUIDE;
		}
	},
	watch: {
		// 监听当前角色的维度列表变化
		'currentConfig.dimensions': {
			handler(newVal) {
				this.autoSelectTab();
			},
			deep: true
		},
		// 监听角色切换，切换角色后也要重置 Tab
		currentAssessmentRole() {
			this.currentRuleDimKey = '';
			this.$nextTick(() => {
				this.autoSelectTab();
			});
		}
	},
	mounted() {
		this.fetchConfig();
	},
	methods: {
		getRoleName(role) {
			const map = { guide: '私导', sale: '销售', attendant: '管家' };
			return map[role];
		},
		async fetchConfig() {
			this.isLoading = true;
			try {
				// 尝试获取指定 ID 的配置
				const res = await db.collection('a-management-configs').doc(CONFIG_ID).get();

				if (res.result.data.length > 0) {
					// 1. 获取数据
					const remoteData = res.result.data[0];

					const defaultGuideStandards = {
						D: { photo_daily: 10, video_count: 0, video_days: 1, promo_daily: 0 },
						C: { photo_daily: 30, video_count: 1, video_days: 3, promo_daily: 0 },
						B: { photo_daily: 50, video_count: 1, video_days: 1, promo_daily: 0 },
						A: { photo_daily: 100, video_count: 1, video_days: 1, promo_daily: 10 }
					};

					// 2. 深度合并，保留本地默认值
					// 注意：这里需要确保 assessment_configs 的结构被保留
					this.config = {
						...this.config,
						...remoteData,
						assessment_configs: {
							...this.config.assessment_configs,
							...(remoteData.assessment_configs || {})
						},
						benchmarks: {
							...this.config.benchmarks,
							...(remoteData.benchmarks || {}),
							guide_standards: {
								...defaultGuideStandards,
								...(remoteData.benchmarks?.guide_standards || {})
							}
						}
					};
				} else {
					await db.collection('a-management-configs').add(this.config);
				}

				// 4. 数据补全：确保所有角色的数组都存在
				['guide', 'sale', 'attendant'].forEach((role) => {
					// 确保角色对象存在
					if (!this.config.assessment_configs[role]) {
						this.$set(this.config.assessment_configs, role, {});
					}
					const roleConfig = this.config.assessment_configs[role];

					// 确保 rules 和 dimensions 数组存在且是响应式的
					if (!roleConfig.rules) this.$set(roleConfig, 'rules', []);
					if (!roleConfig.dimensions) this.$set(roleConfig, 'dimensions', []);
				});

				if (!this.config.grab_settings) {
					this.config.grab_settings = {
						enabled: false,
						grab_interval: 30,
						departure: { switch: false, whitelist: [] },
						destination: { switch: false, whitelist: [] },
						service_type: { switch: false, whitelist: [] },
						headcount: { switch: false, min_count: 1 }
					};
				}
				if (!this.config.grab_settings.grab_interval) {
					this.$set(this.config.grab_settings, 'grab_interval', 30);
				}
				// 将数组转为字符串显示
				this.departureStr = (this.config.grab_settings.departure.whitelist || []).join(',');
				this.destinationStr = (this.config.grab_settings.destination.whitelist || []).join(',');
				this.serviceStr = (this.config.grab_settings.service_type.whitelist || []).join(',');
			} catch (e) {
				console.error('配置加载失败', e);
				uni.showToast({ title: '加载失败: ' + e.message, icon: 'none' });
			} finally {
				this.isLoading = false;
				// 数据加载完后，尝试自动选中 Tab
				this.autoSelectTab();
			}
		},

		updateRuleItem(realIndex, pickerIndex) {
			const val = this.scoringItems[pickerIndex].value;
			// 必须使用 $set 或者直接赋值给对象属性，确保Vue2响应式
			this.currentConfig.rules[realIndex].item_code = val;
			// 切换项目时，默认重置基准开关
			this.currentConfig.rules[realIndex].use_benchmark = false;
		},

		// 获取项目的基准类型
		getItemBenchmarkType(code) {
			const item = this.scoringItems.find((i) => i.value === code);
			return item ? item.benchmarkType : '';
		},

		// 判断是否可以使用“基准值”模式
		canUseBenchmark(itemCode) {
			const item = this.scoringItems.find((i) => i.value === itemCode);
			return !!(item && item.benchmarkType);
		},

		// 切换基准模式
		toggleBenchmark(realIndex) {
			const rule = this.currentConfig.rules[realIndex];
			// 如果 use_benchmark 字段之前不存在，直接赋值视图不会更新
			this.$set(rule, 'use_benchmark', !rule.use_benchmark);

			if (rule.use_benchmark) {
				rule.threshold = 0; // 设为0或清除
			}
		},

		// 判断字段是否应该显示 % (用于目标数值)
		isPercentageItem(code) {
			return ['conversion_rate', 'follow_up_rate', 'repurchase_rate', 'referral_rate'].includes(code);
		},

		// 自动选择一个合适的 Tab
		autoSelectTab() {
			const dims = this.currentConfig.dimensions || [];
			if (dims.length === 0) {
				this.currentRuleDimKey = '';
				return;
			}

			// 如果当前选中的Key不在现有的列表中（比如刚被删除），或者当前为空（比如刚加载/刚新增）
			const exists = dims.some((d) => d.key === this.currentRuleDimKey);
			if (!exists || !this.currentRuleDimKey) {
				// 默认选中第一个
				this.currentRuleDimKey = dims[0].key;
			}
		},

		// 切换 Tab
		switchRuleTab(key) {
			this.currentRuleDimKey = key;
		},

		// 获取某维度下的规则数量
		getRuleCount(dimKey) {
			if (!this.currentConfig.rules) return 0;
			return this.currentConfig.rules.filter((r) => r.dimension_key === dimKey).length;
		},

		// 根据 item_code 自动判断目标数值的单位
		getItemUnit(code) {
			// 百分比类
			if (['conversion_rate', 'follow_up_rate', 'repurchase_rate', 'referral_rate', 'photo_standard_pct'].includes(code)) {
				return '%';
			}
			// 金额类
			if (['sales_amount'].includes(code)) {
				return '元';
			}
			// 评分/分数类
			if (['satisfaction_avg', 'rating_avg', 'photo_quality_score', 'nps_score'].includes(code)) {
				return '分';
			}
			// 默认计数类 (次、个)
			return '次/个';
		},

		// --- 维度管理 ---
		addDimension() {
			const key = 'dim_' + Date.now();
			this.currentConfig.dimensions.push({
				key,
				name: '',
				weight: 0,
				period_days: 30,
				max_score: 100,
				default_score: 0
			});

			this.$nextTick(() => {
				this.currentRuleDimKey = key;
			});
		},
		removeDimension(index) {
			const dim = this.currentConfig.dimensions[index];
			// 移除对应的规则
			this.currentConfig.rules = this.currentConfig.rules.filter((r) => r.dimension_key !== dim.key);
			this.currentConfig.dimensions.splice(index, 1);
		},

		// --- 规则管理 ---
		addRule() {
			if (!this.currentRuleDimKey) {
				return uni.showToast({ title: '请先添加并选择一个考核维度', icon: 'none' });
			}

			this.currentConfig.rules.push({
				dimension_key: this.currentRuleDimKey,
				item_code: this.currentAssessmentRole === 'sale' ? 'sales_amount' : 'order_count',
				operator: 'gte',
				threshold: 1,
				score_change: 0,
				use_benchmark: false,
				max_limit: null,
				min_limit: null,
				bonus_step_rate: 10, // 默认每超10%
				bonus_step_score: 1 // 默认加1分
			});
		},
		removeRule(index) {
			this.currentConfig.rules.splice(index, 1);
		},

		// --- 辅助函数 ---
		getDimName(key) {
			const d = this.currentConfig.dimensions.find((dim) => dim.key === key);
			return d ? d.name : '未知维度';
		},
		getDimIndex(key) {
			return this.currentConfig.dimensions.findIndex((dim) => dim.key === key);
		},
		getItemLabel(code) {
			const item = this.scoringItems.find((i) => i.value === code);
			return item ? item.label : code;
		},
		getOpLabel(op) {
			const o = this.operators.find((i) => i.value === op);
			return o ? o.label : op;
		},

		async saveAllConfigs() {
			this.config.grab_settings.departure.whitelist = this.departureStr
				.split(/[,，]/)
				.map((s) => s.trim())
				.filter(Boolean);
			this.config.grab_settings.destination.whitelist = this.destinationStr
				.split(/[,，]/)
				.map((s) => s.trim())
				.filter(Boolean);
			this.config.grab_settings.service_type.whitelist = this.serviceStr
				.split(/[,，]/)
				.map((s) => s.trim())
				.filter(Boolean);

			// 校验
			const guideWeight = (this.config.assessment_configs.guide.dimensions || []).reduce((s, i) => s + i.weight, 0);
			if (guideWeight !== 100 && guideWeight !== 0) {
				return uni.showToast({ title: '私导考核权重总和应为100%', icon: 'none' });
			}

			this.isSaving = true;
			try {
				// 深拷贝数据，移除 _id，防止更新冲突
				const dataToSave = JSON.parse(JSON.stringify(this.config));
				delete dataToSave._id;
				dataToSave.updated_at = Date.now();

				// 使用 .set() 覆盖更新，它会自动创建或更新，且容错性比 update 更好
				await db.collection('a-management-configs').doc(CONFIG_ID).update(dataToSave);

				uni.showToast({ title: '配置已保存', icon: 'success' });
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '保存失败: ' + e.message, icon: 'none' });
			} finally {
				this.isSaving = false;
			}
		},

		// 保留原有的辅助方法
		toggleSetting(key) {
			this.config.system_settings[key] = !this.config.system_settings[key];
		},
		onRuleChange(e, key) {
			const arr = key === 'ctrip_rule' ? ['A级优先, B级补充', '按绩效平均分配', '完全随机分配'] : ['按绩效分配', '轮流分配', '人工指派'];
			this.config.dispatch_rules[key] = arr[e.detail.value];
		},
		mockAction(name) {
			uni.showToast({ title: name + ' 功能演示', icon: 'none' });
		}
	}
};
</script>

<style lang="scss">
// 保持原有样式，增加新样式
$page-bg: #f5f7fa;
$blue: #3b82f6;
$text-main: #1f2937;
$text-sub: #6b7280;
$border: #e5e7eb;

.page-container {
	height: 80vh;
	display: flex;
	flex-direction: column;
	background-color: $page-bg;

	.main-body {
		flex: 1;
		display: flex;
		overflow: hidden;

		.side-nav {
			width: 160px;
			background: #fff;
			border-right: 1px solid $border;
			display: flex;
			flex-direction: column;
			padding-top: 20px;
			.nav-item {
				padding: 15px 20px;
				display: flex;
				align-items: center;
				gap: 10px;
				font-size: 14px;
				color: #666;
				cursor: pointer;
				&:hover {
					background: #f9fafb;
				}
				&.active {
					background: #eff6ff;
					color: $blue;
					font-weight: 500;
					border-right: 3px solid $blue;
				}
			}
		}

		.content-area {
			flex: 1;
			padding: 20px;

			.loading-state {
				padding: 50px;
				text-align: center;
			}

			.config-panel {
				.panel-header-row {
					position: sticky;
					top: 0;
					z-index: 10;
					background-color: #fff;
					padding-top: 5px;
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 20px;
					padding: 10px;
					border-bottom: 1px solid #e5e7eb;

					.header-left {
						display: flex;
						align-items: center;
						gap: 15px; /* 标题和切换器之间的间距 */

						.panel-title {
							font-size: 16px;
							font-weight: bold;
							color: #1f2937;
						}

						.role-switcher {
							display: flex;
							background: #e5e7eb; /* 灰色背景条 */
							padding: 3px;
							border-radius: 4px;

							.role-tab {
								padding: 4px 12px;
								font-size: 12px;
								color: #666;
								cursor: pointer;
								border-radius: 4px;
								transition: all 0.2s;

								&.active {
									background: #fff;
									color: #3b82f6;
									font-weight: 500;
									box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
								}
							}
						}
					}
					.uni-btn-primary {
						background: #3b82f6;
						color: #fff;
						border: none;
						padding: 0px 16px;
						border-radius: 4px;
						font-size: 13px;
						display: flex;
						align-items: center;
						gap: 4px;
						cursor: pointer;
					}
				}

				// ... 原有 .panel-header 样式兼容 ...
				.panel-header {
					font-size: 18px;
					font-weight: bold;
					color: $text-main;
					margin-bottom: 20px;
				}

				.sub-card {
					background: #fff;
					border-radius: 8px;
					padding: 20px;
					margin-bottom: 20px;
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

					.card-header-row {
						display: flex;
						justify-content: space-between;
						align-items: center;
						margin-bottom: 15px;
						padding-bottom: 10px;
						border-bottom: 1px solid #f3f4f6;
						.card-title {
							font-size: 15px;
							font-weight: 600;
							border-left: 4px solid $blue;
							padding-left: 10px;
							color: $text-main;
						}
						.mini-btn {
							font-size: 12px;
							background: #ecfdf5;
							color: #10b981;
							border: 1px solid #a7f3d0;
							padding: 4px 12px;
							border-radius: 4px;
							cursor: pointer;
							&.blue {
								background: #eff6ff;
								color: $blue;
								border-color: #bfdbfe;
							}
						}
					}

					// 兼容原有样式
					.card-title {
						font-size: 15px;
						font-weight: 600;
						margin-bottom: 15px;
						border-left: 4px solid $blue;
						padding-left: 10px;
						color: $text-main;
					}
					.form-grid {
						display: grid;
						grid-template-columns: 1fr 1fr;
						gap: 20px;
					}
					.form-item {
						display: flex;
						flex-direction: column;
						gap: 8px;
						.label {
							font-size: 13px;
							color: $text-sub;
						}
						.input,
						.picker {
							border: 1px solid $border;
							border-radius: 4px;
							padding: 0px 8px;
							font-size: 14px;
							height: 30px;
							display: flex;
							align-items: center;
							justify-content: space-between;
						}
					}
					.checkbox-grid {
						display: grid;
						grid-template-columns: 1fr 1fr;
						gap: 15px;
						.checkbox-item {
							display: flex;
							align-items: center;
							gap: 10px;
							font-size: 14px;
							color: $text-main;
							cursor: pointer;
							.cb-box {
								width: 18px;
								height: 18px;
								border: 1px solid #ccc;
								border-radius: 4px;
								display: flex;
								align-items: center;
								justify-content: center;
								&.checked {
									background: $blue;
									border-color: $blue;
								}
							}
						}
					}
					.btn-row {
						display: flex;
						gap: 20px;
						margin-bottom: 15px;
					}
					.uni-btn {
						flex: 1;
						border: none;
						color: #fff;
						padding: 10px;
						border-radius: 4px;
						font-size: 13px;
						display: flex;
						align-items: center;
						justify-content: center;
						gap: 6px;
						cursor: pointer;
						&.green {
							background: #10b981;
						}
						&.blue {
							background: $blue;
						}
						&.orange {
							background: #f59e0b;
						}
						&.red {
							background: #ef4444;
						}
					}
					.file-action-row {
						display: flex;
						align-items: center;
						gap: 15px;
						margin-bottom: 15px;
						padding-bottom: 15px;
						border-bottom: 1px dashed #eee;
						.action-label {
							width: 140px;
							font-size: 13px;
							color: $text-main;
						}
						.file-input {
							flex: 1;
							display: flex;
							align-items: center;
							gap: 10px;
							background: #f9fafb;
							padding: 6px;
							border-radius: 4px;
							border: 1px solid $border;
							.file-btn {
								font-size: 12px;
								background: #fff;
								border: 1px solid #ccc;
								color: #666;
								padding: 2px 10px;
							}
						}
						.action-btn {
							font-size: 13px;
							color: #fff;
							border: none;
							padding: 6px 20px;
							border-radius: 4px;
							cursor: pointer;
							&.blue {
								background: $blue;
							}
							&.cyan {
								background: #06b6d4;
							}
						}
					}

					// 表格样式
					.table-container {
						border: 1px solid $border;
						border-radius: 6px;
						overflow: hidden;
						.table-header {
							background: #f9fafb;
							display: flex;
							padding: 10px;
							border-bottom: 1px solid $border;
							.th {
								flex: 1;
								font-size: 12px;
								color: $text-sub;
								font-weight: 600;
							}
						}
						.table-row {
							display: flex;
							padding: 10px;
							border-bottom: 1px solid #f3f4f6;
							align-items: center;
							gap: 10px;
							&:last-child {
								border-bottom: none;
							}
							.td-input {
								flex: 1;
								border: 1px solid #e5e7eb;
								padding: 4px 8px;
								font-size: 13px;
								border-radius: 4px;
								height: 28px;
							}
							.td-action {
								width: 50px;
								display: flex;
								justify-content: center;
								cursor: pointer;
							}
						}
						.empty-text {
							padding: 20px;
							text-align: center;
							font-size: 13px;
							color: #999;
						}
					}

					// 规则列表样式
					.rules-list {
						display: flex;
						flex-direction: column;
						gap: 15px;
						.rule-item {
							border: 1px solid #e5e7eb;
							border-radius: 6px;
							padding: 15px;
							background: #fdfdfd;
							position: relative;
							.rule-header {
								display: flex;
								justify-content: space-between;
								margin-bottom: 10px;
								.rule-index {
									font-size: 12px;
									font-weight: bold;
									color: #ccc;
								}
								.action-icon {
									cursor: pointer;
								}
							}
							.rule-grid {
								display: flex;
								flex-wrap: wrap;
								gap: 15px;
								align-items: flex-end;
								.form-item {
									display: flex;
									flex-direction: column;
									gap: 6px;
									min-width: 120px;
									&.wide {
										min-width: 160px;
									}
									&.small {
										min-width: 80px;
									}
									.label {
										font-size: 12px;
										color: #666;
									}
									.picker,
									.input {
										border: 1px solid $border;
										background: #fff;
										height: 32px;
										padding: 0 10px;
										border-radius: 4px;
										font-size: 13px;
										display: flex;
										align-items: center;
										justify-content: space-between;
										&.center {
											justify-content: center;
											text-align: center;
										}
									}
								}
								.logic-row {
									display: flex;
									align-items: center;
									gap: 10px;
									background: #f0f9ff;
									padding: 10px;
									border-radius: 6px;
									flex-wrap: wrap;
									.arrow {
										color: #999;
										font-weight: bold;
										margin-top: 18px;
									}
								}
								.limit-row {
									display: flex;
									gap: 10px;
									border-left: 2px solid #eee;
									padding-left: 15px;
								}
							}
							.rule-summary {
								margin-top: 10px;
								padding-top: 10px;
								border-top: 1px dashed #eee;
								font-size: 12px;
								color: #666;
								display: flex;
								align-items: center;
								gap: 6px;
							}
						}
						.empty-text {
							padding: 20px;
							text-align: center;
							font-size: 13px;
							color: #999;
						}
					}
				}
			}
		}
	}
}

/* Tab 滚动条样式 */
.dim-tabs-scroll {
	width: 100%;
	white-space: nowrap;
	margin-bottom: 15px;
	border-bottom: 1px solid #eee;

	.dim-tabs-container {
		display: flex;
		padding-bottom: 2px; /* 给 border 留位置 */

		.dim-tab-item {
			display: inline-flex;
			align-items: center;
			padding: 8px 16px;
			font-size: 13px;
			color: #666;
			cursor: pointer;
			border-bottom: 2px solid transparent;
			transition: all 0.2s;
			position: relative;
			margin-right: 10px;

			&:hover {
				color: $blue;
				background-color: #f9fafb;
				border-radius: 4px 4px 0 0;
			}

			&.active {
				color: $blue;
				font-weight: 600;
				border-bottom-color: $blue;
				background-color: #eff6ff;
				border-radius: 4px 4px 0 0;
			}

			.count-badge {
				background: #e5e7eb;
				color: #666;
				font-size: 10px;
				padding: 1px 5px;
				border-radius: 10px;
				margin-left: 6px;
				transform: scale(0.9);

				// 激活状态下徽标也变色
				.active & {
					background: #dbeafe;
					color: $blue;
				}
			}
		}
	}
}

.mini-btn.disabled {
	opacity: 0.5;
	cursor: not-allowed;
	background: #f3f4f6;
	color: #999;
	border-color: #e5e7eb;
}

.wide-input {
	min-width: 180px !important;
}

.label-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.benchmark-switch {
	display: flex;
	font-size: 10px;
	border: 1px solid #3b82f6;
	border-radius: 3px;
	overflow: hidden;
	cursor: pointer;

	text {
		padding: 1px 4px;
		background: #fff;
		color: #3b82f6;

		&.active {
			background: #3b82f6;
			color: #fff;
		}
	}
}

.picker.disabled {
	background-color: #f3f4f6;
	color: #999;
	border-color: #e5e7eb;
}

/* 带后缀的输入框 (如 35%) */
.input-with-suffix {
	display: flex;
	align-items: center;
	border: 1px solid #e5e7eb;
	background: #fff;
	border-radius: 4px;
	height: 32px;
	padding: 0 5px;

	.input-inner {
		flex: 1;
		height: 100%;
		font-size: 13px;
		text-align: center;
	}
	.suffix {
		color: #999;
		font-size: 12px;
		padding-right: 4px;
		font-weight: bold;
	}
}

/* 分数单位切换开关 */
.unit-switch {
	display: flex;
	background: #e5e7eb;
	border-radius: 3px;
	padding: 2px;
	cursor: pointer;
	margin-left: auto; /* 靠右对齐 */

	.unit {
		font-size: 10px;
		padding: 0 4px;
		border-radius: 2px;
		color: #666;

		&.active {
			background: #3b82f6;
			color: #fff;
		}
	}
}

/* 基准模式下的超额配置框 */
.benchmark-config-box {
	border: 1px dashed #3b82f6;
	background: #eff6ff;
	border-radius: 4px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: space-around;
	padding: 0 4px;

	.bonus-row {
		display: flex;
		align-items: center;
		gap: 2px;
		font-size: 11px;
		color: #3b82f6;

		.mini-input {
			width: 30px;
			height: 20px;
			background: #fff;
			border: 1px solid #bfdbfe;
			border-radius: 2px;
			text-align: center;
			font-size: 11px;
			color: #1f2937;
		}
	}
}

.guide-standards-table {
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	overflow: hidden;
	margin-bottom: 15px;

	.gs-header {
		display: flex;
		background: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
		padding: 10px;

		.th {
			flex: 1;
			font-size: 12px;
			color: #6b7280;
			font-weight: 600;
			text-align: center;

			&.role {
				flex: 0 0 60px;
			}
			&.wide {
				flex: 1.5;
			}
		}
	}

	.gs-row {
		display: flex;
		align-items: center;
		padding: 10px;
		border-bottom: 1px solid #f3f4f6;

		&:last-child {
			border-bottom: none;
		}

		.td {
			flex: 1;
			display: flex;
			justify-content: center;
			padding: 0 5px;

			&.role {
				flex: 0 0 60px;
			}
			&.wide {
				flex: 1.5;
			}

			.input {
				width: 100%;
				text-align: center;
				border: 1px solid #e5e7eb;
				border-radius: 4px;
				height: 32px;
				font-size: 13px;
			}

			&.flex-row {
				display: flex;
				align-items: center;
				gap: 5px;
				font-size: 12px;
				color: #666;

				.mini-input {
					width: 40px;
					height: 32px;
					border: 1px solid #e5e7eb;
					border-radius: 4px;
					text-align: center;
				}
			}

			.level-badge {
				font-size: 12px;
				font-weight: bold;
				padding: 2px 8px;
				border-radius: 4px;

				&.D {
					background: #f3f4f6;
					color: #6b7280;
				}
				&.C {
					background: #ecfdf5;
					color: #10b981;
				}
				&.B {
					background: #eff6ff;
					color: #3b82f6;
				}
				&.A {
					background: #fff7ed;
					color: #f59e0b;
				}
			}
		}
	}
}

.tips-box {
	background: #f9fafb;
	padding: 10px;
	border-radius: 4px;
	display: flex;
	align-items: center;
	gap: 8px;

	text {
		font-size: 12px;
		color: #6b7280;
	}
}
</style>
