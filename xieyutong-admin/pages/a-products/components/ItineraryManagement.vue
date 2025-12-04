<template>
	<div class="itinerary-management">
		<!-- 页面标题和操作区 -->
		<div class="bg-white rounded-lg shadow-sm p-6 mb-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<i class="fas fa-route text-2xl text-blue-600"></i>
					<h1 class="text-2xl font-bold text-gray-800" style="font-family: 'Microsoft YaHei', sans-serif">行程管理</h1>
				</div>
				<div class="flex items-center space-x-4">
					<!-- 搜索框 -->
					<uni-easyinput
						v-model="searchKeyword"
						placeholder="搜索行程内容或活动类型..."
						class="search-input"
						:styles="{
							color: '#333',
							backgroundColor: '#f8fafc',
							borderColor: '#e2e8f0',
							borderRadius: '8px',
							fontSize: '16px',
							height: '48px',
							width: '280px'
						}"
						prefixIcon="search"
						:clearable="true"></uni-easyinput>

					<!-- 操作按钮 -->
					<button class="action-btn action-btn-success" @click="addNewDay">
						<i class="fas fa-plus mr-2"></i>
						添加新的一天
					</button>
					<button class="action-btn action-btn-primary" @click="refreshData">
						<i class="fas fa-sync-alt mr-2"></i>
						刷新数据
					</button>
					<button class="action-btn action-btn-success" @click="exportItinerary">
						<i class="fas fa-download mr-2"></i>
						导出行程
					</button>
				</div>
			</div>
		</div>

		<!-- 加载状态 -->
		<div v-if="loading" class="loading-container">
			<div class="loading-content">
				<i class="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
				<p class="text-lg text-gray-600" style="font-family: 'Microsoft YaHei', sans-serif">正在加载行程数据...</p>
			</div>
		</div>

		<!-- 行程数据展示 -->
		<div v-else-if="itineraryData" class="space-y-6">
			<!-- 行程概览卡片 -->
			<div class="overview-card">
				<div class="card-header">
					<i class="fas fa-info-circle text-2xl text-blue-600"></i>
					<h2 class="text-xl font-bold text-gray-800" style="font-family: 'Microsoft YaHei', sans-serif">行程概览</h2>
				</div>

				<div class="overview-grid">
					<div class="overview-item">
						<label class="overview-label">行程标题</label>
						<uni-easyinput
							v-model="editableData.title"
							placeholder="请输入行程标题"
							class="overview-input"
							:styles="inputStyles"
							:clearable="false"
							@change="saveField('title')"></uni-easyinput>
					</div>
					<div class="overview-item">
						<label class="overview-label">总天数</label>
						<uni-easyinput
							v-model="editableData.total_days"
							placeholder="请输入总天数"
							type="number"
							class="overview-input"
							:styles="inputStyles"
							:clearable="false"
							@blur="saveField('total_days')"></uni-easyinput>
					</div>
					<div class="overview-item full-width">
						<label class="overview-label">行程备注</label>
						<uni-easyinput
							v-model="editableData.remarks"
							placeholder="请输入行程备注"
							type="textarea"
							class="overview-input"
							:styles="textareaStyles"
							:clearable="false"
							@blur="saveField('remarks')"></uni-easyinput>
					</div>
				</div>
			</div>

			<!-- 每日行程表格 -->
			<div v-for="(dayItem, dayIndex) in filteredItinerary" :key="dayIndex" :id="'day-' + dayIndex" class="day-container">
				<!-- 日期标题栏 -->
				<div class="day-header">
					<!-- 日期标题行 -->
					<div class="day-title-row">
						<div class="day-title-section">
							<i class="fas fa-calendar-day text-2xl text-emerald-600"></i>
							<span class="day-number">第{{ dayItem.day }}天</span>
							<uni-easyinput
								v-model="dayItem.day_title"
								placeholder="请输入当日标题"
								class="day-title-input"
								:styles="dayTitleInputStyles"
								:clearable="false"
								@blur="saveDayField(dayIndex, 'day_title')"></uni-easyinput>
						</div>
						<div class="day-actions">
							<button class="action-btn action-btn-sm action-btn-outline" @click="addActivity(dayIndex)">
								<i class="fas fa-plus mr-2"></i>
								添加活动
							</button>
							<button class="action-btn action-btn-sm action-btn-danger" @click="deleteDay(dayIndex)" v-if="editableData.itinerary && editableData.itinerary.length > 1">
								<i class="fas fa-trash mr-2"></i>
								删除这一天
							</button>
						</div>
					</div>

					<!-- 行程特点和玩法亮点行 -->
					<div class="day-details-row">
						<div class="day-detail-item">
							<div class="day-detail-label">
								<i class="fas fa-map-marker-alt text-blue-500 mr-2"></i>
								<span>目的地城市</span>
							</div>
							<uni-easyinput
								v-model="dayItem.destination_city"
								placeholder="请输入当日目的地城市"
								class="day-detail-input"
								:styles="inputStyles"
								:clearable="false"
								@blur="saveDayField(dayIndex, 'destination_city')"></uni-easyinput>
						</div>
						<div class="day-detail-item day-detail-item-full">
							<div class="day-detail-label">
								<i class="fas fa-star text-amber-500 mr-2"></i>
								<span>当日亮点</span>
							</div>
							<uni-easyinput
								v-model="dayItem.day_highlights"
								placeholder="描述当日行程的特色和玩法亮点..."
								type="textarea"
								class="day-detail-input"
								:styles="dayDetailTextareaStyles"
								:clearable="false"
								@blur="saveDayField(dayIndex, 'day_highlights')"></uni-easyinput>
						</div>
					</div>
				</div>

				<!-- 活动表格 -->
				<div class="activities-table-container">
					<table class="activities-table">
						<thead>
							<tr>
								<th style="width: 80px">类型</th>
								<th style="width: 120px">时间</th>
								<th style="width: 200px">标题</th>
								<th>详细信息</th>
								<th style="width: 120px">操作</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="(activity, actIndex) in dayItem.activities"
								:key="activity._localId || activity._id || actIndex"
								:id="'activity-' + dayIndex + '-' + actIndex"
								class="activity-row">
								<!-- 活动类型 -->
								<td class="activity-type-cell">
									<div class="activity-type-badge" :class="getActivityTypeClass(activity.elementType)">
										<i :class="getActivityIconClass(activity.elementType)" class="mr-1"></i>
										{{ getActivityTypeName(activity.elementType) }}
									</div>
								</td>

								<!-- 活动时间 -->
								<td class="activity-time-cell">
									<div class="time-selector-container">
										<!-- 时间类型选择 -->
										<div class="time-type-selector">
											<button class="time-type-btn" :class="{ active: activity.time_type === 'specific' }" @click="setTimeType(dayIndex, actIndex, 'specific')">
												<i class="fas fa-clock"></i>
											</button>
											<button class="time-type-btn" :class="{ active: activity.time_type === 'period' }" @click="setTimeType(dayIndex, actIndex, 'period')">
												<i class="fas fa-calendar-day"></i>
											</button>
										</div>

										<!-- 具体时间选择 -->
										<div v-if="activity.time_type === 'specific' || !activity.time_type" class="time-input-container">
											<uni-easyinput
												v-model="activity.time_start_time"
												placeholder="HH:MM"
												class="time-input"
												:styles="timeInputStyles"
												type="time"
												:clearable="false"
												@blur="saveActivityField(dayIndex, actIndex, 'time_start_time')"
												@change="saveActivityField(dayIndex, actIndex, 'time_start_time')"></uni-easyinput>
										</div>

										<!-- 时间段选择 -->
										<div v-else-if="activity.time_type === 'period'" class="time-period-container">
											<select v-model="activity.time_period" class="time-period-select" @change="saveActivityField(dayIndex, actIndex, 'time_period')">
												<option value="">选择时段</option>
												<option value="全天">全天</option>
												<option value="上午">上午</option>
												<option value="下午">下午</option>
												<option value="晚上">晚上</option>
												<option value="早晨">早晨</option>
												<option value="中午">中午</option>
												<option value="深夜">深夜</option>
											</select>
										</div>
									</div>
								</td>

								<!-- 活动标题 -->
								<td class="activity-title-cell">
									<uni-easyinput
										v-model="activity.title"
										placeholder="请输入活动标题"
										class="title-input"
										:styles="titleInputStyles"
										:clearable="false"
										@blur="saveActivityField(dayIndex, actIndex, 'title')"></uni-easyinput>
								</td>

								<!-- 详细信息 -->
								<td class="activity-details-cell">
									<div class="activity-details">
										<!-- 集合活动 -->
										<div v-if="activity.elementType === 'assembly'" class="detail-assembly">
											<div class="detail-row">
												<label class="detail-label">集合类型</label>
												<uni-easyinput
													v-model="activity.elementData.assembly_type"
													placeholder="请输入集合类型"
													:styles="detailInputStyles"
													:clearable="false"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.assembly_type', value: activity.elementData.assembly_type })"></uni-easyinput>
											</div>
											<div class="detail-row">
												<label class="detail-label">集合地点</label>
												<uni-easyinput
													:modelValue="Array.isArray(activity.elementData.locations) ? activity.elementData.locations.join('，') : activity.elementData.locations"
													@input="activity.elementData.locations = $event.split(/[，,]/).map((item) => item.trim())"
													placeholder="请输入集合地点，用逗号分隔"
													type="textarea"
													:styles="detailTextareaStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.locations', value: activity.elementData.locations })"></uni-easyinput>
											</div>
											<div class="detail-row">
												<label class="detail-label">备注</label>
												<uni-easyinput
													v-model="activity.elementData.remark"
													placeholder="请输入备注"
													type="textarea"
													:styles="detailTextareaStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.remark', value: activity.elementData.remark })"></uni-easyinput>
											</div>
										</div>

										<!-- 交通活动 -->
										<div v-else-if="activity.elementType === 'transport'" class="detail-transport">
											<div class="detail-row">
												<label class="detail-label">交通工具</label>
												<uni-easyinput
													v-model="activity.elementData.transport_type"
													placeholder="请输入交通工具"
													:styles="detailInputStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.transport_type', value: activity.elementData.transport_type })"></uni-easyinput>
											</div>
											<div class="detail-row-group">
												<div class="detail-row">
													<label class="detail-label">出发地</label>
													<uni-easyinput
														v-model="activity.elementData.departure"
														placeholder="出发地"
														:styles="detailInputStyles"
														@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.departure', value: activity.elementData.departure })"></uni-easyinput>
												</div>
												<div class="detail-row">
													<label class="detail-label">目的地</label>
													<uni-easyinput
														v-model="activity.elementData.destination"
														placeholder="目的地"
														:styles="detailInputStyles"
														@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.destination', value: activity.elementData.destination })"></uni-easyinput>
												</div>
											</div>
											<div class="detail-row-group">
												<div class="detail-row">
													<label class="detail-label">距离(km)</label>
													<uni-easyinput
														v-model="activity.driving_distance"
														placeholder="距离"
														type="number"
														:styles="detailInputStyles"
														@blur="saveActivityDetail({ dayIndex, actIndex, field: 'driving_distance', value: activity.driving_distance })"></uni-easyinput>
												</div>
												<div class="detail-row">
													<label class="detail-label">用时(小时)</label>
													<uni-easyinput
														v-model="activity.driving_duration_hours"
														placeholder="小时"
														type="number"
														:styles="detailInputStyles"
														@blur="saveActivityDetail({ dayIndex, actIndex, field: 'driving_duration_hours', value: activity.driving_duration_hours })"></uni-easyinput>
												</div>
											</div>
											<div class="detail-row">
												<label class="detail-label">内容</label>
												<uni-easyinput
													v-model="activity.elementData.content"
													placeholder="请输入交通相关内容"
													type="textarea"
													:styles="detailTextareaStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.content', value: activity.elementData.content })"></uni-easyinput>
											</div>
										</div>

										<!-- 餐厅活动 -->
										<div v-else-if="activity.elementType === 'restaurant'" class="detail-restaurant">
											<div class="detail-row">
												<label class="detail-label">餐厅名称</label>
												<uni-easyinput
													v-model="activity.elementData.name"
													placeholder="请输入餐厅名称"
													:styles="detailInputStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.name', value: activity.elementData.name })"></uni-easyinput>
											</div>
											<div class="detail-row-group">
												<div class="detail-row">
													<label class="detail-label">餐食类型</label>
													<uni-easyinput
														v-model="activity.elementData.meal_type"
														placeholder="餐食类型"
														:styles="detailInputStyles"
														@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.meal_type', value: activity.elementData.meal_type })"></uni-easyinput>
												</div>
												<div class="detail-row">
													<label class="detail-label">费用类型</label>
													<uni-easyinput
														v-model="activity.elementData.adult_fee_type"
														placeholder="费用类型"
														:styles="detailInputStyles"
														@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.adult_fee_type', value: activity.elementData.adult_fee_type })"></uni-easyinput>
												</div>
											</div>
											<div class="detail-row">
												<label class="detail-label">菜系</label>
												<uni-easyinput
													v-model="activity.elementData.cuisine"
													placeholder="请输入菜系"
													:styles="detailInputStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.cuisine', value: activity.elementData.cuisine })"></uni-easyinput>
											</div>
											<div class="detail-row">
												<label class="detail-label">餐标</label>
												<uni-easyinput
													v-model="activity.elementData.standard"
													placeholder="请输入餐标"
													:styles="detailInputStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.standard', value: activity.elementData.standard })"></uni-easyinput>
											</div>

											<div class="detail-row">
												<label class="detail-label">注意</label>
												<uni-easyinput
													v-model="activity.elementData.remark"
													placeholder="请输入注意事项"
													type="textarea"
													:styles="detailTextareaStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.remark', value: activity.elementData.remark })"></uni-easyinput>
											</div>

											<div class="detail-row">
												<label class="detail-label">餐厅图片</label>
												<div class="scenic-images">
													<div v-for="(image, imgIndex) in activity.elementData.images" :key="imgIndex" class="scenic-image-item">
														<img :src="image" :alt="activity.elementData.name" class="scenic-image" @error="handleImageError" />
														<div class="image-overlay">
															<button class="image-action-btn" @click="previewImage(image)">
																<i class="fas fa-eye"></i>
															</button>
															<button class="image-action-btn delete" @click="removeRestaurantImage(dayIndex, actIndex, imgIndex)">
																<i class="fas fa-trash"></i>
															</button>
														</div>
													</div>
													<div class="add-image-btn" @click="addRestaurantImage(dayIndex, actIndex)">
														<i class="fas fa-plus"></i>
														<span>添加图片</span>
													</div>
												</div>
											</div>

											<div class="detail-row">
												<label class="detail-label">关联POI</label>
												<!-- <uni-data-select
													v-model="activity.linked_poi_id"
													collection="a-poi-database"
													field="_id as value, name as text"
													filterable
													clearable
													:styles="detailInputStyles"
													placeholder="搜索并关联POI"
													@blur="saveActivityField(dayIndex, actIndex, 'linked_poi_id')"></uni-data-select> -->
												<div class="flex items-center space-x-2">
													<uni-easyinput
														:value="activity.linked_poi_name || '未关联'"
														disabled
														class="flex-1"
														:styles="{ ...detailInputStyles, backgroundColor: '#f3f4f6', color: activity.linked_poi_name ? '#333' : '#999' }"></uni-easyinput>
													<button
														class="action-btn action-btn-xs action-btn-primary"
														@click="openPoiModal({ dayIndex, actIndex, field: 'main', title: activity.title, type: '餐厅', time: getTimeString(activity) })">
														<i class="fas fa-link mr-1"></i>
														修改
													</button>
												</div>
											</div>
											<div class="detail-row">
												<label class="detail-label">匹配状态</label>
												<uni-data-select
													v-model="activity.match_status"
													:localdata="matchStatusOptions"
													:styles="detailInputStyles"
													placeholder="设置匹配状态"
													@change="saveActivityField(dayIndex, actIndex, 'match_status')"></uni-data-select>
											</div>
										</div>

										<!-- 景点活动 -->
										<div v-else-if="activity.elementType === 'scenic'" class="detail-scenic">
											<!-- 单个景点 -->
											<div v-if="activity.elementData?.scenic_name" class="scenic-single">
												<div class="detail-row">
													<label class="detail-label">景点名称</label>
													<uni-easyinput
														v-model="activity.elementData.scenic_name"
														placeholder="请输入景点名称"
														:styles="detailInputStyles"
														@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.scenic_name', value: activity.elementData.scenic_name })"></uni-easyinput>
												</div>
												<div class="detail-row">
													<label class="detail-label">景点级别</label>
													<uni-easyinput
														v-model="activity.elementData.level"
														placeholder="如：AAAAA级"
														:styles="detailInputStyles"
														@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.level', value: activity.elementData.level })"></uni-easyinput>
												</div>
												<div class="detail-row">
													<label class="detail-label">景点介绍</label>
													<uni-easyinput
														v-model="activity.elementData.description"
														placeholder="请输入景点介绍"
														type="textarea"
														:styles="detailTextareaStyles"
														@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.description', value: activity.elementData.description })"></uni-easyinput>
												</div>
												<!-- 景点图片 -->
												<div v-if="activity.elementData.images && activity.elementData.images.length > 0" class="detail-row">
													<label class="detail-label">景点图片</label>
													<div class="scenic-images">
														<div v-for="(image, imgIndex) in activity.elementData.images" :key="imgIndex" class="scenic-image-item">
															<img :src="image" :alt="activity.elementData.scenic_name" class="scenic-image" @error="handleImageError" />
															<div class="image-overlay">
																<button class="image-action-btn" @click="previewImage(image)">
																	<i class="fas fa-eye"></i>
																</button>
																<button class="image-action-btn delete" @click="removeImage(dayIndex, actIndex, imgIndex)">
																	<i class="fas fa-trash"></i>
																</button>
															</div>
														</div>
														<div class="add-image-btn" @click="addScenicImage(dayIndex, actIndex)">
															<i class="fas fa-plus"></i>
															<span>添加图片</span>
														</div>
													</div>
												</div>
												<div class="detail-row">
													<label class="detail-label">景点亮点</label>
													<uni-easyinput
														:modelValue="Array.isArray(activity.elementData.highlights) ? activity.elementData.highlights.join('，') : activity.elementData.highlights"
														@input="activity.elementData.highlights = $event.split(/[，,]/).map((item) => item.trim())"
														placeholder="请输入景点亮点，每行一个"
														type="textarea"
														:styles="detailTextareaStyles"
														@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.highlights', value: activity.elementData.highlights })"></uni-easyinput>
												</div>
											</div>

											<!-- 多个景点 -->
											<div v-else-if="activity.elementData?.scenic_spots" class="scenic-multiple">
												<div class="scenic-spots-header">
													<label class="detail-label">景点列表</label>
													<button class="action-btn action-btn-xs action-btn-primary" @click="addScenicSpot(dayIndex, actIndex)">
														<i class="fas fa-plus mr-1"></i>
														添加景点
													</button>
												</div>
												<div v-for="(spot, spotIndex) in activity.elementData.scenic_spots" :key="spotIndex" class="scenic-spot-item">
													<div class="scenic-spot-header">
														<h4 class="scenic-spot-title">景点 {{ spotIndex + 1 }}</h4>
														<button class="action-btn action-btn-xs action-btn-danger" @click="removeScenicSpot(dayIndex, actIndex, spotIndex)">
															<i class="fas fa-trash"></i>
														</button>
													</div>
													<div class="detail-row-group">
														<div class="detail-row">
															<label class="detail-label-sm">景点名称</label>
															<uni-easyinput
																v-model="spot.name"
																placeholder="景点名称"
																:styles="detailInputSmStyles"
																@blur="saveScenicSpotField(dayIndex, actIndex, spotIndex, 'name', spot.name)"></uni-easyinput>
														</div>
													</div>
													<div class="detail-row">
														<label class="detail-label-sm">景点介绍</label>
														<uni-easyinput
															v-model="spot.description"
															placeholder="景点介绍"
															type="textarea"
															:styles="detailTextareaSmStyles"
															@blur="saveScenicSpotField(dayIndex, actIndex, spotIndex, 'description', spot.description)"></uni-easyinput>
													</div>

													<div class="detail-row">
														<label class="detail-label-sm">关联POI</label>
														<!-- <uni-data-select
															v-model="spot.linked_poi_id"
															collection="a-poi-database"
															field="_id as value, name as text"
															filterable
															clearable
															:styles="detailInputSmStyles"
															placeholder="搜索景点POI"
															@blur="saveScenicSpotField(dayIndex, actIndex, spotIndex, 'linked_poi_id', $event)"></uni-data-select> -->
														<div class="flex items-center space-x-2">
															<uni-easyinput
																:value="spot.linked_poi_name || '未关联'"
																disabled
																class="flex-1"
																:styles="{ ...detailInputSmStyles, backgroundColor: '#f3f4f6', color: spot.linked_poi_name ? '#333' : '#999' }"></uni-easyinput>
															<button
																class="action-btn action-btn-xs action-btn-primary"
																@click="
																	openPoiModal({ dayIndex, actIndex, spotIndex, field: 'spot', title: spot.name || '未命名景点', type: '景点', time: getTimeString(activity) })
																">
																<i class="fas fa-link"></i>
															</button>
														</div>
													</div>
													<div class="detail-row">
														<label class="detail-label-sm">匹配状态</label>
														<uni-data-select
															v-model="spot.match_status"
															:localdata="matchStatusOptions"
															:styles="detailInputSmStyles"
															placeholder="设置匹配状态"
															@blur="saveScenicSpotField(dayIndex, actIndex, spotIndex, 'match_status', $event)"></uni-data-select>
													</div>

													<!-- 景点图片 -->
													<div class="detail-row">
														<label class="detail-label-sm">景点图片</label>
														<div class="scenic-images scenic-images-sm">
															<div v-for="(image, imgIndex) in spot.images" :key="imgIndex" class="scenic-image-item scenic-image-item-sm">
																<img :src="image" :alt="spot.name" class="scenic-image scenic-image-sm" @error="handleImageError" />
																<div class="image-overlay">
																	<button class="image-action-btn" @click="previewImage(image)">
																		<i class="fas fa-eye"></i>
																	</button>
																	<button class="image-action-btn delete" @click="removeSpotImage(dayIndex, actIndex, spotIndex, imgIndex)">
																		<i class="fas fa-trash"></i>
																	</button>
																</div>
															</div>
															<div class="add-image-btn add-image-btn-sm" @click="addSpotImage(dayIndex, actIndex, spotIndex)">
																<i class="fas fa-plus"></i>
															</div>
														</div>
													</div>
												</div>
											</div>
											<div class="detail-row">
												<label class="detail-label">注意</label>
												<uni-easyinput
													v-model="activity.remark"
													placeholder="请输入景点活动注意事项"
													type="textarea"
													:styles="detailTextareaStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.remark', value: activity.remark })"></uni-easyinput>
											</div>
										</div>

										<!-- 酒店活动 -->
										<div v-else-if="activity.elementType === 'hotel'" class="detail-hotel">
											<div class="detail-row">
												<label class="detail-label">酒店名称</label>
												<uni-easyinput
													v-model="activity.elementData.hotelName"
													placeholder="请输入酒店名称"
													:styles="detailInputStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.hotelName', value: activity.elementData.hotelName })"></uni-easyinput>
											</div>
											<div class="detail-row-group">
												<div class="detail-row">
													<label class="detail-label">星级</label>
													<uni-easyinput
														v-model="activity.elementData.rating"
														placeholder="星级"
														:styles="detailInputStyles"
														@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.rating', value: activity.elementData.rating })"></uni-easyinput>
												</div>
												<div class="detail-row">
													<label class="detail-label">类型</label>
													<uni-easyinput
														v-model="activity.elementData.level"
														placeholder="酒店类型"
														:styles="detailInputStyles"
														@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.level', value: activity.elementData.level })"></uni-easyinput>
												</div>
											</div>
											<div class="detail-row">
												<label class="detail-label">地址</label>
												<uni-easyinput
													v-model="activity.elementData.address"
													placeholder="请输入酒店地址"
													:styles="detailInputStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.address', value: activity.elementData.address })"></uni-easyinput>
											</div>
											<div class="detail-row">
												<label class="detail-label">备注</label>
												<uni-easyinput
													v-model="activity.elementData.remark"
													placeholder="请输入备注"
													type="textarea"
													:styles="detailTextareaStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.remark', value: activity.elementData.remark })"></uni-easyinput>
											</div>

											<div class="detail-row">
												<label class="detail-label">酒店图片</label>
												<div class="scenic-images">
													<div v-if="activity.elementData.image" class="scenic-image-item">
														<img :src="activity.elementData.image" :alt="activity.elementData.hotelName" class="scenic-image" @error="handleImageError" />
														<div class="image-overlay">
															<button class="image-action-btn" @click="previewImage(activity.elementData.image)"><i class="fas fa-eye"></i></button>
															<button class="image-action-btn delete" @click="removeHotelImage(dayIndex, actIndex)"><i class="fas fa-trash"></i></button>
														</div>
													</div>
													<div class="add-image-btn" @click="addOrUpdateHotelImage(dayIndex, actIndex)">
														<i class="fas fa-plus"></i>
														<span>{{ activity.elementData.image ? '更换图片' : '添加图片' }}</span>
													</div>
												</div>
											</div>

											<div class="detail-row">
												<label class="detail-label">主酒店POI</label>
												<!-- <uni-data-select
													v-model="activity.linked_poi_id"
													collection="a-poi-database"
													field="_id as value, name as text"
													filterable
													clearable
													:styles="detailInputStyles"
													placeholder="搜索并关联主酒店POI"
													@blur="saveActivityField(dayIndex, actIndex, 'linked_poi_id')"></uni-data-select> -->
												<div class="flex items-center space-x-2">
													<uni-easyinput
														:value="activity.linked_poi_name || '未关联'"
														disabled
														class="flex-1"
														:styles="{ ...detailInputStyles, backgroundColor: '#f3f4f6', color: activity.linked_poi_name ? '#333' : '#999' }"></uni-easyinput>
													<button
														class="action-btn action-btn-xs action-btn-primary"
														@click="
															openPoiModal({
																dayIndex,
																actIndex,
																field: 'main',
																title: activity.elementData.hotelName || '未命名酒店',
																type: '酒店',
																time: getTimeString(activity)
															})
														">
														<i class="fas fa-link mr-1"></i>
														修改
													</button>
												</div>
											</div>
											<div class="detail-row">
												<label class="detail-label">主酒店匹配状态</label>
												<uni-data-select
													v-model="activity.match_status"
													:localdata="matchStatusOptions"
													:styles="detailInputStyles"
													placeholder="设置匹配状态"
													@blur="saveActivityField(dayIndex, actIndex, 'match_status')"></uni-data-select>
											</div>

											<div class="scenic-multiple">
												<div class="scenic-spots-header">
													<label class="detail-label">备选酒店</label>
													<button class="action-btn action-btn-xs action-btn-primary" @click="addAlternativeHotel(dayIndex, actIndex)">
														<i class="fas fa-plus mr-1"></i>
														添加备选
													</button>
												</div>
												<div v-for="(altHotel, altIndex) in activity.elementData.alternativeHotels" :key="altIndex" class="scenic-spot-item">
													<div class="scenic-spot-header">
														<h4 class="scenic-spot-title">备选酒店 {{ altIndex + 1 }}</h4>
														<button class="action-btn action-btn-xs action-btn-danger" @click="removeAlternativeHotel(dayIndex, actIndex, altIndex)">
															<i class="fas fa-trash"></i>
														</button>
													</div>
													<div class="detail-row">
														<uni-easyinput
															v-model="altHotel.name"
															placeholder="备选酒店名称"
															:styles="detailInputSmStyles"
															@blur="saveAlternativeHotel(dayIndex, actIndex, altIndex, 'name', altHotel.name)"></uni-easyinput>
													</div>

													<div class="detail-row">
														<label class="detail-label">备选酒店POI</label>
														<!-- <uni-data-select
															v-model="altHotel.linked_poi_id"
															collection="a-poi-database"
															field="_id as value, name as text"
															filterable
															clearable
															:styles="detailInputStyles"
															placeholder="搜索并关联备选酒店POI"
															@blur="saveAlternativeHotel(dayIndex, actIndex, altIndex, 'linked_poi_id', $event)"></uni-data-select> -->
														<div class="flex items-center space-x-2">
															<uni-easyinput
																:value="altHotel.linked_poi_name || '未关联'"
																disabled
																class="flex-1"
																:styles="{ ...detailInputStyles, backgroundColor: '#f3f4f6', color: altHotel.linked_poi_name ? '#333' : '#999' }"></uni-easyinput>
															<button
																class="action-btn action-btn-xs action-btn-primary"
																@click="
																	openPoiModal({
																		dayIndex,
																		actIndex,
																		altIndex,
																		field: 'alt',
																		title: altHotel.name || '未命名备选',
																		type: '备选酒店',
																		time: getTimeString(activity)
																	})
																">
																<i class="fas fa-link"></i>
															</button>
														</div>
													</div>
													<div class="detail-row">
														<label class="detail-label">备选酒店匹配状态</label>
														<uni-data-select
															v-model="altHotel.match_status"
															:localdata="matchStatusOptions"
															:styles="detailInputStyles"
															placeholder="设置匹配状态"
															@blur="saveAlternativeHotel(dayIndex, actIndex, altIndex, 'match_status', $event)"></uni-data-select>
													</div>
												</div>
											</div>
										</div>

										<!-- 其他活动 -->
										<div v-else-if="activity.elementType === 'other'" class="detail-other">
											<div class="detail-row">
												<label class="detail-label">演出名称</label>
												<uni-easyinput
													v-model="activity.elementData.show_name"
													placeholder="请输入演出名称"
													:styles="detailInputStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.show_name', value: activity.elementData.show_name })"></uni-easyinput>
											</div>
											<div class="detail-row">
												<label class="detail-label">场地</label>
												<uni-easyinput
													v-model="activity.elementData.venue"
													placeholder="请输入场地"
													:styles="detailInputStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.venue', value: activity.elementData.venue })"></uni-easyinput>
											</div>
											<div class="detail-row">
												<label class="detail-label">内容</label>
												<uni-easyinput
													v-model="activity.elementData.content"
													placeholder="请输入内容"
													type="textarea"
													:styles="detailTextareaStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.content', value: activity.elementData.content })"></uni-easyinput>
											</div>
											<div class="detail-row">
												<label class="detail-label">描述</label>
												<uni-easyinput
													v-model="activity.elementData.description"
													placeholder="请输入描述"
													type="textarea"
													:styles="detailTextareaStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.description', value: activity.elementData.description })"></uni-easyinput>
											</div>

											<!-- <div class="detail-row">
												<label class="detail-label">关联POI</label>
												<uni-data-select
													v-model="activity.linked_poi_id"
													collection="a-poi-database"
													field="_id as value, name as text"
													filterable
													clearable
													:styles="detailInputStyles"
													placeholder="搜索并关联POI"
													@change="saveActivityField(dayIndex, actIndex, 'linked_poi_id')"></uni-data-select>
											</div>
											<div class="detail-row">
												<label class="detail-label">匹配状态</label>
												<uni-data-select
													v-model="activity.match_status"
													:localdata="matchStatusOptions"
													:styles="detailInputStyles"
													placeholder="设置匹配状态"
													@change="saveActivityField(dayIndex, actIndex, 'match_status')"></uni-data-select>
											</div> -->
										</div>

										<!-- 解散活动 -->
										<div v-else-if="activity.elementType === 'dismissal'" class="detail-dismissal">
											<div class="detail-row">
												<label class="detail-label">解散类型</label>
												<uni-easyinput
													v-model="activity.elementData.dismissal_type"
													placeholder="请输入解散类型"
													:styles="detailInputStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.dismissal_type', value: activity.elementData.dismissal_type })"></uni-easyinput>
											</div>
											<div class="detail-row">
												<label class="detail-label">解散地点</label>
												<uni-easyinput
													:modelValue="Array.isArray(activity.elementData.locations) ? activity.elementData.locations.join('，') : activity.elementData.locations"
													@input="activity.elementData.locations = $event.split(/[，,]/).map((item) => item.trim())"
													placeholder="请输入解散地点"
													type="textarea"
													:styles="detailTextareaStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.locations', value: activity.elementData.locations })"></uni-easyinput>
											</div>
											<div class="detail-row">
												<label class="detail-label">备注</label>
												<uni-easyinput
													v-model="activity.elementData.remark"
													placeholder="请输入备注"
													type="textarea"
													:styles="detailTextareaStyles"
													@blur="saveActivityDetail({ dayIndex, actIndex, field: 'elementData.remark', value: activity.elementData.remark })"></uni-easyinput>
											</div>
										</div>
									</div>
								</td>

								<!-- 操作按钮 -->
								<td class="activity-actions-cell">
									<div class="activity-actions">
										<button class="action-btn action-btn-xs action-btn-danger" @click="deleteActivity(dayIndex, actIndex)">
											<i class="fas fa-trash"></i>
										</button>
									</div>
								</td>
							</tr>

							<!-- 空状态 -->
							<tr v-if="!dayItem.activities || dayItem.activities.length === 0">
								<td colspan="5" class="empty-state">
									<div class="empty-content">
										<i class="fas fa-calendar-plus text-3xl text-gray-400 mb-2"></i>
										<p class="text-gray-500" style="font-family: 'Microsoft YaHei', sans-serif">暂无活动安排</p>
										<button class="action-btn action-btn-sm action-btn-primary mt-2" @click="addActivity(dayIndex)">
											<i class="fas fa-plus mr-1"></i>
											添加第一个活动
										</button>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<!-- 无数据状态 -->
		<div v-else class="no-data-container">
			<div class="no-data-content">
				<i class="fas fa-route text-6xl text-gray-300 mb-4"></i>
				<h3 class="text-xl font-bold text-gray-500 mb-2" style="font-family: 'Microsoft YaHei', sans-serif">暂无行程数据</h3>
				<p class="text-gray-400 mb-4" style="font-family: 'Microsoft YaHei', sans-serif">{{ noDataMessage || '请先添加行程信息' }}</p>
				<button class="action-btn action-btn-primary" @click="createNewItinerary">
					<i class="fas fa-plus mr-2"></i>
					创建新行程
				</button>
			</div>
		</div>

		<!-- 活动类型选择弹窗 -->
		<div v-if="showActivityTypeModal" class="activity-type-modal-overlay" @click="closeActivityTypeModal">
			<div class="activity-type-modal" @click.stop>
				<!-- 弹窗头部 -->
				<div class="modal-header">
					<div class="modal-title-section">
						<i class="fas fa-plus-circle text-2xl text-blue-600 mr-3"></i>
						<h3 class="modal-title">选择活动类型</h3>
					</div>
					<button class="modal-close-btn" @click="closeActivityTypeModal">
						<i class="fas fa-times"></i>
					</button>
				</div>

				<!-- 活动类型网格 -->
				<div class="activity-types-grid">
					<div
						v-for="(activityType, index) in activityTypes"
						:key="index"
						class="activity-type-card"
						:class="{ selected: selectedActivityType?.value === activityType.value }"
						@click="selectActivityType(activityType)">
						<div class="activity-type-icon" :style="{ color: activityType.color }">
							<i :class="activityType.icon"></i>
						</div>
						<div class="activity-type-info">
							<h4 class="activity-type-name">{{ activityType.label }}</h4>
							<p class="activity-type-desc">{{ getActivityTypeDescription(activityType.value) }}</p>
						</div>
						<div class="activity-type-check" v-if="selectedActivityType?.value === activityType.value">
							<i class="fas fa-check-circle"></i>
						</div>
					</div>
				</div>

				<!-- 弹窗底部 -->
				<div class="modal-footer">
					<button class="modal-btn modal-btn-cancel" @click="closeActivityTypeModal">
						<i class="fas fa-times mr-2"></i>
						取消
					</button>
					<button class="modal-btn modal-btn-confirm" :disabled="!selectedActivityType" @click="confirmAddActivity">
						<i class="fas fa-check mr-2"></i>
						确认添加
					</button>
				</div>
			</div>
		</div>

		<div v-if="showPoiModal" class="activity-type-modal-overlay" @click="closePoiModal">
			<div class="activity-type-modal" @click.stop style="max-width: 500px">
				<div class="modal-header">
					<div class="modal-title-section">
						<i class="fas fa-map-marker-alt text-2xl text-blue-600 mr-3"></i>
						<h3 class="modal-title">修改 POI 关联</h3>
					</div>
				</div>

				<div class="p-6 space-y-4">
					<div class="bg-gray-50 p-4 rounded-lg border border-gray-100">
						<div class="flex items-center mb-2">
							<span class="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-700 mr-2">{{ poiModalData.type }}</span>
							<span class="text-sm text-gray-500">
								<i class="fas fa-clock mr-1"></i>
								{{ poiModalData.time }}
							</span>
						</div>
						<div class="text-lg font-bold text-gray-800">{{ poiModalData.title }}</div>
					</div>

					<div class="detail-row">
						<label class="detail-label">搜索并关联 POI</label>
						<uni-combox
							v-model="poiSearchInput"
							:candidates="poiCandidates"
							label-key="name"
							value-key="_id"
							placeholder="输入名称搜索 POI"
							:loading="poiLoading"
							@input="searchPois"
							@change="onPoiModalSelect"
							@click="loadDefaultPois"></uni-combox>
					</div>

					<div class="detail-row">
						<label class="detail-label">匹配状态</label>
						<uni-data-select v-model="poiModalData.match_status" :localdata="matchStatusOptions" placeholder="设置匹配状态" :clearable="false"></uni-data-select>
					</div>
				</div>

				<div class="modal-footer">
					<button class="modal-btn modal-btn-cancel" @click="closePoiModal">取消</button>
					<button class="modal-btn modal-btn-confirm" @click="confirmPoiModal">保存修改</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
// 防抖函数
function debounce(fn, delay = 300) {
	let timer = null;
	return function () {
		const context = this;
		const args = arguments;
		clearTimeout(timer);
		timer = setTimeout(() => {
			fn.apply(context, args);
		}, delay);
	};
}

export default {
	name: 'ItineraryManagement',
	emits: ['update', 'data-loaded', 'no-data-found', 'load-error', 'update-partial'],
	props: {
		productId: {
			type: String,
			default: ''
		},
		productCtripId: {
			type: String,
			default: ''
		},
		editType: {
			type: String,
			default: 'product'
		},
		snapshotId: {
			type: String,
			default: ''
		}
	},

	data() {
		return {
			keyToChineseMap: keyToChineseMap,
			loading: false,
			itineraryData: null,
			editableData: {},
			noDataMessage: '',
			searchKeyword: '',
			poiCandidates: [],
			currentPoiContext: null,
			originalPoiName: '',
			poiLoading: false,
			// POI 弹窗相关状态
			showPoiModal: false,
			poiModalData: {
				dayIndex: null,
				actIndex: null,
				spotIndex: null,
				altIndex: null,
				field: '', // 'main', 'spot', 'alt'
				type: '',
				title: '',
				time: '',
				linked_poi_id: '',
				linked_poi_name: '',
				match_status: 'unmatched'
			},
			poiSearchInput: '',
			poiCandidates: [],
			poiSearchTimer: null,

			// 输入框样式配置
			inputStyles: {
				color: '#374151',
				backgroundColor: '#ffffff',
				borderColor: '#d1d5db',
				borderRadius: '8px',
				fontSize: '16px',
				height: '44px',
				fontFamily: 'Microsoft YaHei, sans-serif'
			},

			textareaStyles: {
				color: '#374151',
				backgroundColor: '#ffffff',
				borderColor: '#d1d5db',
				borderRadius: '8px',
				fontSize: '16px',
				minHeight: '80px',
				fontFamily: 'Microsoft YaHei, sans-serif'
			},

			dayTitleInputStyles: {
				color: '#065f46',
				backgroundColor: '#ecfdf5',
				borderColor: '#10b981',
				borderRadius: '6px',
				fontSize: '18px',
				height: '50px',
				fontFamily: 'Microsoft YaHei, sans-serif',
				fontWeight: '600'
			},

			dayDetailTextareaStyles: {
				color: '#374151',
				backgroundColor: '#ffffff',
				borderColor: '#d1d5db',
				borderRadius: '8px',
				fontSize: '16px',
				minHeight: '80px',
				fontFamily: 'Microsoft YaHei, sans-serif',
				padding: '12px'
			},

			timeInputStyles: {
				color: '#374151',
				backgroundColor: '#f8fafc',
				borderColor: '#e2e8f0',
				borderRadius: '6px',
				fontSize: '14px',
				height: '36px',
				textAlign: 'center',
				fontFamily: 'Microsoft YaHei, sans-serif'
			},

			titleInputStyles: {
				color: '#374151',
				backgroundColor: '#ffffff',
				borderColor: '#e5e7eb',
				borderRadius: '6px',
				fontSize: '15px',
				height: '38px',
				fontFamily: 'Microsoft YaHei, sans-serif'
			},

			// 详情输入框样式
			detailInputStyles: {
				color: '#374151',
				backgroundColor: '#ffffff',
				borderColor: '#d1d5db',
				borderRadius: '6px',
				fontSize: '14px',
				height: '36px',
				fontFamily: 'Microsoft YaHei, sans-serif'
			},

			detailTextareaStyles: {
				color: '#374151',
				backgroundColor: '#ffffff',
				borderColor: '#d1d5db',
				borderRadius: '6px',
				fontSize: '14px',
				minHeight: '60px',
				fontFamily: 'Microsoft YaHei, sans-serif'
			},

			detailInputSmStyles: {
				color: '#374151',
				backgroundColor: '#ffffff',
				borderColor: '#d1d5db',
				borderRadius: '4px',
				fontSize: '13px',
				height: '32px',
				fontFamily: 'Microsoft YaHei, sans-serif'
			},

			detailTextareaSmStyles: {
				color: '#374151',
				backgroundColor: '#ffffff',
				borderColor: '#d1d5db',
				borderRadius: '4px',
				fontSize: '13px',
				minHeight: '50px',
				fontFamily: 'Microsoft YaHei, sans-serif'
			},

			// 活动类型配置
			activityTypes: [
				{ value: 'assembly', label: '集合', icon: 'fas fa-users', color: '#3b82f6' },
				{ value: 'transport', label: '交通', icon: 'fas fa-car', color: '#f59e0b' },
				{ value: 'restaurant', label: '餐厅', icon: 'fas fa-utensils', color: '#ef4444' },
				{ value: 'scenic', label: '景点', icon: 'fas fa-mountain', color: '#10b981' },
				{ value: 'hotel', label: '酒店', icon: 'fas fa-bed', color: '#6366f1' },
				{ value: 'other', label: '其他', icon: 'fas fa-star', color: '#8b5cf6' },
				{ value: 'dismissal', label: '解散', icon: 'fas fa-flag-checkered', color: '#6b7280' }
			],

			matchStatusOptions: [
				{ value: 'unmatched', text: '未匹配' },
				{ value: 'auto', text: '自动匹配' },
				{ value: 'manual', text: '手动确认' },
				{ value: 'ignore', text: '忽略' }
			],

			// 弹窗状态
			showActivityTypeModal: false,
			selectedActivityType: null,
			currentAddingDayIndex: null
		};
	},

	mounted() {
		this.loadItineraryFromDatabase();
	},

	watch: {
		productId: {
			handler(newVal) {
				if (newVal) {
					this.loadItineraryFromDatabase();
				}
			},
			immediate: true
		},
		productCtripId: {
			handler(newVal) {
				if (newVal) {
					this.loadItineraryFromDatabase();
				}
			},
			immediate: true
		}
	},

	computed: {
		filteredItinerary() {
			// 如果没有加载数据，或者搜索关键词为空，则直接返回完整的行程数据
			if (!this.editableData.itinerary || !this.searchKeyword) {
				return this.editableData.itinerary;
			}

			const keyword = this.searchKeyword.toLowerCase().trim();
			if (keyword === '') {
				return this.editableData.itinerary;
			}

			const result = [];

			// 遍历原始的每一天
			this.editableData.itinerary.forEach((day) => {
				// 检查这一天的信息本身是否匹配 (day_title, destination_city, day_highlights)
				const isDayMatch =
					day.day_title?.toLowerCase().includes(keyword) || day.destination_city?.toLowerCase().includes(keyword) || day.day_highlights?.toLowerCase().includes(keyword);

				// 过滤当天的活动，找出匹配的活动
				const matchingActivities = day.activities
					? day.activities.filter((activity) => {
							// 检查活动的“类型中文名”是否匹配关键词
							if (this.getActivityTypeName(activity.elementType).toLowerCase().includes(keyword)) return true;

							// 检查活动标题
							if (activity.title?.toLowerCase().includes(keyword)) return true;

							// 检查活动详情 (elementData)
							const details = activity.elementData;
							if (details) {
								for (const key in details) {
									const value = details[key];
									if (typeof value === 'string' && value.toLowerCase().includes(keyword)) return true;
									if (Array.isArray(value)) {
										if (value.some((item) => typeof item === 'string' && item.toLowerCase().includes(keyword))) return true;
									}
								}
							}
							// 特别检查景点列表 (scenic_spots)
							if (activity.elementType === 'scenic' && details.scenic_spots) {
								for (const spot of details.scenic_spots) {
									if (spot.name?.toLowerCase().includes(keyword)) return true;
									if (spot.description?.toLowerCase().includes(keyword)) return true;
								}
							}
							return false;
					  })
					: [];

				// 如果这一天本身就匹配，或者它包含了任何一个匹配的活动
				if (isDayMatch || matchingActivities.length > 0) {
					// 我们需要创建一个新的 day 对象
					const newDay = { ...day };

					// 如果是天本身匹配，则显示当天的所有活动
					// 如果是活动匹配，则只显示匹配到的活动
					newDay.activities = isDayMatch ? day.activities : matchingActivities;

					result.push(newDay);
				}
			});

			return result;
		}
	},

	methods: {
		async loadItineraryFromDatabase() {
			if (!this.productId && !this.productCtripId) {
				console.log('⚠️ [行程管理] 缺少商品ID或携程ID，无法查询');
				this.noDataMessage = '缺少商品标识，无法加载行程数据';
				return;
			}

			this.loading = true;
			console.log(`🔍 [行程管理] 开始查询行程数据 - 商品ID: ${this.productId}, 携程ID: ${this.productCtripId}`);

			let result;
			try {
				const db = uniCloud.database();

				if (this.editType === 'product') {
					if (!this.productId && !this.productCtripId) {
						console.log('⚠️ [行程管理] 缺少商品ID或携程ID，无法查询');
						// ...
						this.loading = false;
						return;
					}
					console.log(`🔍 [行程管理] 开始查询 [a-itineraries]...`);

					// 构建查询条件 - 使用OR条件兼容两种查询方式
					let whereCondition = '';
					if (this.productId && this.productCtripId) {
						whereCondition = `product_id == "${this.productId}" || ctrip_id == "${this.productCtripId}"`;
					} else if (this.productId) {
						whereCondition = `product_id == "${this.productId}"`;
					} else if (this.productCtripId) {
						whereCondition = `ctrip_id == "${this.productCtripId}"`;
					}

					console.log(`🔍 [行程管理] 查询条件: ${whereCondition}`);

					result = await db.collection('a-itineraries').where(whereCondition).orderBy('created_at desc').limit(1).get();
				} else if (this.editType === 'snapshot') {
					if (!this.snapshotId) {
						console.log('⚠️ [行程管理] 缺少 Snapshot ID，无法查询');
						this.loading = false;
						this.noDataMessage = '缺少快照ID';
						this.$emit('no-data-found');
						return;
					}

					console.log(`🔍 [行程管理] 开始查询 [a-snapshots] ID: ${this.snapshotId}`);
					// 直接按 ID 查询快照文档
					result = await db
						.collection('a-snapshots')
						.doc(this.snapshotId)
						.field('itinerary, title, sub_title, total_days, remarks, product_id, ctrip_id, _id') // <--- 只获取需要的字段
						.get();
				}

				console.log(`✅ [行程管理] 查询结果:`, result);

				// 兼容不同的返回格式
				const data = result.result?.data || result.data || [];
				console.log(`📊 [行程管理] 解析的数据:`, data);
				console.log(`📊 [行程管理] 数据条数: ${data.length}`);

				if (data.length > 0) {
					this.itineraryData = data[0];
					this.editableData = JSON.parse(JSON.stringify(this.itineraryData)); // 深拷贝用于编辑

					// 🛡️ 定义一个安全辅助函数，确保对象有 linked_poi_name
					const ensurePoiName = (item) => {
						if (item && typeof item === 'object' && item.linked_poi_name === undefined) {
							this.$set(item, 'linked_poi_name', '');
						}
					};

					// 确保每个活动都有elementData对象，并初始化新字段
					if (this.editableData.itinerary) {
						this.editableData.itinerary.forEach((day) => {
							// 确保每天都有day_highlights字段
							if (!day.day_highlights) {
								day.day_highlights = '';
							}

							// 确保每天都有destination_city字段
							if (!day.destination_city) {
								day.destination_city = '';
							}

							if (day.activities) {
								day.activities.forEach((activity) => {
									ensurePoiName(activity);

									if (!activity.elementData) {
										activity.elementData = {};
									}

									activity.linked_poi_name = '';

									if (activity.elementType === 'scenic' && activity.elementData.scenic_spots) {
										activity.elementData.scenic_spots.forEach((spot) => {
											if (!spot.linked_poi_name) {
												spot.linked_poi_name = '';
											}
										});
									}

									if (activity.elementType === 'hotel' && activity.elementData.alternativeHotels) {
										if (!activity.linked_poi_name) {
											activity.linked_poi_name = '';
										}

										if (Array.isArray(activity.elementData.alternativeHotels) && activity.elementData.alternativeHotels.length > 0) {
											// 检查第一个元素是不是字符串
											if (typeof activity.elementData.alternativeHotels[0] === 'string') {
												console.log(`🔧 [数据迁移] 正在转换第${day.day}天 酒店活动的备选酒店...`);
												// 执行转换
												activity.elementData.alternativeHotels = activity.elementData.alternativeHotels.map((hotelName) => ({
													name: hotelName,
													linked_poi_id: '',
													linked_poi_name: '',
													match_status: 'unmatched'
												}));
											}
										} else if (!Array.isArray(activity.elementData.alternativeHotels)) {
											// 如果根本不是数组（以防万一）
											activity.elementData.alternativeHotels = [];
										}
									}
								});
							}
						});
					}

					// 填充 POI 名称，用于 combox 显示
					await this.hydratePoiNames();

					console.log(`✅ [行程管理] 成功加载行程数据:`, this.itineraryData.title);
					this.$emit('data-loaded', this.itineraryData);
				} else {
					console.log(`⚠️ [行程管理] 未找到匹配的行程数据`);
					this.noDataMessage = '未找到对应的行程数据';
					this.$emit('no-data-found');
				}
			} catch (error) {
				console.error('❌ [行程管理] 查询行程数据失败:', error);
				this.noDataMessage = '加载行程数据失败';
				this.$emit('load-error', error);
			} finally {
				this.loading = false;
			}
		},

		// 获取活动类型图标类名
		getActivityIconClass(elementType) {
			const iconMap = {
				assembly: 'fas fa-users',
				transport: 'fas fa-bus',
				restaurant: 'fas fa-utensils',
				scenic: 'fas fa-mountain',
				hotel: 'fas fa-bed',
				other: 'fas fa-star',
				dismissal: 'fas fa-hand-wave'
			};
			return iconMap[elementType] || 'fas fa-map-marker-alt';
		},

		// 获取活动类型样式类名
		getActivityTypeClass(elementType) {
			const classMap = {
				assembly: 'type-assembly',
				transport: 'type-transport',
				restaurant: 'type-restaurant',
				scenic: 'type-scenic',
				hotel: 'type-hotel',
				other: 'type-other',
				dismissal: 'type-dismissal'
			};
			return classMap[elementType] || 'type-default';
		},

		// 获取活动类型名称
		getActivityTypeName(elementType) {
			const nameMap = {
				assembly: '集合',
				transport: '交通',
				restaurant: '餐厅',
				scenic: '景点',
				hotel: '酒店',
				other: '其他',
				dismissal: '解散'
			};
			return nameMap[elementType] || '未知';
		},

		// 获取活动详情组件
		getActivityDetailComponent(elementType) {
			// 暂时返回默认的详情展示组件，后续会创建具体的组件
			return 'div';
		},

		// 保存字段更改
		async saveField(fieldName) {
			try {
				const path = fieldName;
				const value = this.editableData[fieldName];
				console.log(`💾 保存字段 ${fieldName}:`, value);
				this.$emit('update-partial', { path, value });
			} catch (error) {
				console.error('保存字段失败:', error);
			}
		},

		// 保存日期字段更改
		async saveDayField(dayIndex, fieldName) {
			try {
				const path = `itinerary.${dayIndex}.${fieldName}`;
				const value = this.editableData.itinerary[dayIndex][fieldName];
				console.log(`💾 保存第${dayIndex + 1}天的字段 ${fieldName}:`, value);
				this.$emit('update-partial', { path, value });
			} catch (error) {
				console.error('保存日期字段失败:', error);
			}
		},

		// 保存活动字段更改
		async saveActivityField(dayIndex, actIndex, fieldName) {
			try {
				const path = `itinerary.${dayIndex}.activities.${actIndex}.${fieldName}`;
				const value = this.editableData.itinerary[dayIndex].activities[actIndex][fieldName];
				console.log(`💾 保存第${dayIndex + 1}天第${actIndex + 1}个活动的字段 ${fieldName}:`, value);
				this.$emit('update-partial', { path, value });
			} catch (error) {
				console.error('保存活动字段失败:', error);
			}
		},

		// 保存活动详情
		async saveActivityDetail(data) {
			try {
				const { dayIndex, actIndex, field, value } = data;
				const path = `itinerary.${dayIndex}.activities.${actIndex}.${field}`;
				console.log(`💾 保存活动详情:`, data);
				this.$emit('update-partial', { path, value });
			} catch (error) {
				console.error('保存活动详情失败:', error);
			}
		},

		// 刷新数据
		refreshData() {
			this.loadItineraryFromDatabase();
		},

		// 添加活动
		addActivity(dayIndex) {
			console.log(`➕ 为第${dayIndex + 1}天添加活动`);
			this.currentAddingDayIndex = dayIndex;
			this.selectedActivityType = null;
			this.showActivityTypeModal = true;
		},

		// 选择活动类型
		selectActivityType(activityType) {
			this.selectedActivityType = activityType;
		},

		// 关闭活动类型选择弹窗
		closeActivityTypeModal() {
			this.showActivityTypeModal = false;
			this.selectedActivityType = null;
			this.currentAddingDayIndex = null;
		},

		// 确认添加活动
		confirmAddActivity() {
			if (this.selectedActivityType && this.currentAddingDayIndex !== null) {
				this.createNewActivity(this.currentAddingDayIndex, this.selectedActivityType);
				this.closeActivityTypeModal();
			}
		},

		// 获取活动类型描述
		getActivityTypeDescription(type) {
			const descriptions = {
				assembly: '团队集合，出发准备',
				transport: '交通工具，路线规划',
				restaurant: '用餐安排，美食体验',
				scenic: '景点游览，观光体验',
				hotel: '住宿安排，休息场所',
				other: '演出表演，特色活动',
				dismissal: '行程结束，送别解散'
			};
			return descriptions[type] || '活动安排';
		},

		// 创建新活动
		createNewActivity(dayIndex, activityType) {
			console.log(`✨ 创建新活动: 第${dayIndex + 1}天 - ${activityType.label}`);

			if (!this.editableData.itinerary[dayIndex].activities) {
				this.editableData.itinerary[dayIndex].activities = [];
			}

			const newId = `act_${Date.now()}_${Math.random()}`;

			const newActivity = {
				_localId: newId,
				id: newId,
				title: `新${activityType.label}活动`,
				elementType: activityType.value,
				time_type: 'specific',
				time_start_time: '',
				time_period: '',
				elementData: this.getDefaultElementData(activityType.value),
				linked_poi_id: '',
				linked_poi_name: '',
				match_status: 'unmatched'
			};

			this.editableData.itinerary[dayIndex].activities.push(newActivity);
			const newActIndex = this.editableData.itinerary[dayIndex].activities.length - 1;

			this.$nextTick(() => {
				// 构造与模板中一致的元素ID
				const elementId = `activity-${dayIndex}-${newActIndex}`;
				const newElement = document.getElementById(elementId);

				if (newElement) {
					console.log(`📜 滚动到新活动: #${elementId}`);
					// 调用浏览器API，平滑滚动到元素位置
					newElement.scrollIntoView({
						behavior: 'smooth', // 平滑滚动效果
						block: 'center' // 滚动到视口中央
					});
				}
			});

			this.$emit('update-partial', { operator: '$push', path: `itinerary.${dayIndex}.activities`, value: newActivity });

			uni.showToast({
				title: `已添加${activityType.label}活动`,
				icon: 'success',
				duration: 2000
			});
		},

		// 获取默认的活动数据结构
		getDefaultElementData(elementType) {
			switch (elementType) {
				case 'assembly':
					return {
						assembly_type: '',
						locations: '',
						remark: ''
					};
				case 'transport':
					return {
						transport_type: '',
						departure: '',
						destination: '',
						content: ''
					};
				case 'restaurant':
					return {
						name: '',
						meal_type: '',
						adult_fee_type: '',
						cuisine: '',
						standard: '',
						remark: '',
						images: []
					};
				case 'scenic':
					return {
						scenic_spots: [],
						remark: ''
					};
				case 'hotel':
					return {
						hotelName: '',
						rating: '',
						level: '',
						address: '',
						remark: '',
						image: '',
						alternativeHotels: []
					};
				case 'other':
					return {
						show_name: '',
						venue: '',
						content: '',
						description: ''
					};
				case 'dismissal':
					return {
						dismissal_type: '',
						locations: '',
						remark: ''
					};
				default:
					return {};
			}
		},

		// 删除活动
		deleteActivity(dayIndex, actIndex) {
			console.log(`🗑️ 删除第${dayIndex + 1}天第${actIndex + 1}个活动`);
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这个活动吗？',
				success: (res) => {
					if (res.confirm) {
						this.editableData.itinerary[dayIndex].activities.splice(actIndex, 1);

						this.$emit('update-partial', { path: `itinerary.${dayIndex}.activities`, value: this.editableData.itinerary[dayIndex].activities });
					}
				}
			});
		},

		// 创建新行程
		createNewItinerary() {
			console.log('🆕 创建新行程');

			const newItinerary = {
				product_id: this.productId,
				ctrip_id: this.productCtripId,

				title: '新的行程标题',
				total_days: 1,
				remarks: '',
				status: 'active',
				itinerary: [
					{
						day: 1,
						day_title: '第1天',
						day_highlights: '',
						destination_city: '',
						activities: []
					}
				]
			};

			if (this.editType === 'product') {
				newItineraryData.product_id = this.productId;
				newItineraryData.ctrip_id = this.productCtripId;
			} else if (this.editType === 'snapshot') {
				// snapshot 模式下，合并ID
				newItineraryData._id = this.snapshotId;
				newItineraryData.product_id = this.productId;
				newItineraryData.ctrip_id = this.productCtripId;
			}

			this.editableData = newItineraryData;
			this.itineraryData = JSON.parse(JSON.stringify(newItineraryData));
			this.noDataMessage = ''; // 清空“无数据”的提示信息

			console.log('📤 准备通知父组件执行“首次创建”保存...');
			this.$emit('update', this.editableData);

			uni.showToast({
				title: '新行程已创建',
				icon: 'success'
			});
		},

		// 图片处理相关方法
		handleImageError(event) {
			console.warn('图片加载失败:', event.target.src);
			event.target.style.display = 'none';
		},

		previewImage(imageUrl) {
			console.log('🖼️ 预览图片:', imageUrl);
			uni.previewImage({
				urls: [imageUrl],
				current: imageUrl
			});
		},

		removeImage(dayIndex, actIndex, imgIndex) {
			console.log(`🗑️ 删除图片: 第${dayIndex + 1}天第${actIndex + 1}个活动第${imgIndex + 1}张图片`);
			this.editableData.itinerary[dayIndex].activities[actIndex].elementData.images.splice(imgIndex, 1);

			this.saveActivityDetail({
				dayIndex,
				actIndex,
				field: 'elementData.images',
				value: this.editableData.itinerary[dayIndex].activities[actIndex].elementData.images
			});
		},

		addScenicImage(dayIndex, actIndex) {
			console.log(`➕ 添加景点图片: 第${dayIndex + 1}天第${actIndex + 1}个活动`);
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const tempFilePath = res.tempFilePaths[0];
					// 这里可以上传到云存储
					if (!this.editableData.itinerary[dayIndex].activities[actIndex].elementData.images) {
						this.editableData.itinerary[dayIndex].activities[actIndex].elementData.images = [];
					}
					this.editableData.itinerary[dayIndex].activities[actIndex].elementData.images.push(tempFilePath);

					this.saveActivityDetail({
						dayIndex,
						actIndex,
						field: 'elementData.images',
						value: this.editableData.itinerary[dayIndex].activities[actIndex].elementData.images
					});
				}
			});
		},

		addRestaurantImage(dayIndex, actIndex) {
			console.log(`➕ 添加餐厅图片: 第${dayIndex + 1}天第${actIndex + 1}个活动`);
			uni.chooseImage({
				count: 1, // 每次只选一张，可以改成多张
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					// 假设您未来会实现上传到云存储
					// 目前我们暂时使用临时路径，或者您可以替换为上传逻辑
					const tempFilePath = res.tempFilePaths[0];

					if (!this.editableData.itinerary[dayIndex].activities[actIndex].elementData.images) {
						this.editableData.itinerary[dayIndex].activities[actIndex].elementData.images = [];
					}
					this.editableData.itinerary[dayIndex].activities[actIndex].elementData.images.push(tempFilePath);

					this.saveActivityDetail({
						dayIndex,
						actIndex,
						field: 'elementData.images',
						value: this.editableData.itinerary[dayIndex].activities[actIndex].elementData.images
					});
				}
			});
		},

		removeRestaurantImage(dayIndex, actIndex, imgIndex) {
			console.log(`🗑️ 删除餐厅图片: 第${dayIndex + 1}天第${actIndex + 1}个活动第${imgIndex + 1}张图片`);
			this.editableData.itinerary[dayIndex].activities[actIndex].elementData.images.splice(imgIndex, 1);

			this.saveActivityDetail({
				dayIndex,
				actIndex,
				field: 'elementData.images',
				value: this.editableData.itinerary[dayIndex].activities[actIndex].elementData.images
			});
		},

		removeSpotImage(dayIndex, actIndex, spotIndex, imgIndex) {
			console.log(`🗑️ 删除景点图片: 第${dayIndex + 1}天第${actIndex + 1}个活动第${spotIndex + 1}个景点第${imgIndex + 1}张图片`);
			this.editableData.itinerary[dayIndex].activities[actIndex].elementData.scenic_spots[spotIndex].images.splice(imgIndex, 1);
			this.saveScenicSpotField(dayIndex, actIndex, spotIndex, 'images', this.editableData.itinerary[dayIndex].activities[actIndex].elementData.scenic_spots[spotIndex].images);
		},

		addSpotImage(dayIndex, actIndex, spotIndex) {
			console.log(`➕ 添加景点图片: 第${dayIndex + 1}天第${actIndex + 1}个活动第${spotIndex + 1}个景点`);
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const tempFilePath = res.tempFilePaths[0];
					if (!this.editableData.itinerary[dayIndex].activities[actIndex].elementData.scenic_spots[spotIndex].images) {
						this.editableData.itinerary[dayIndex].activities[actIndex].elementData.scenic_spots[spotIndex].images = [];
					}
					this.editableData.itinerary[dayIndex].activities[actIndex].elementData.scenic_spots[spotIndex].images.push(tempFilePath);

					this.saveScenicSpotField(dayIndex, actIndex, spotIndex, 'images', this.editableData.itinerary[dayIndex].activities[actIndex].elementData.scenic_spots[spotIndex].images);
				}
			});
		},

		// 添加或更新酒店图片 (处理单个图片)
		addOrUpdateHotelImage(dayIndex, actIndex) {
			uni.chooseImage({
				count: 1,
				success: (res) => {
					uni.showLoading({ title: '图片上传中...' });
					const tempFilePath = res.tempFilePaths[0];
					const cloudPath = `itineraries/hotels/${Date.now()}.jpg`;

					uniCloud
						.uploadFile({
							filePath: tempFilePath,
							cloudPath: cloudPath,
							cloudPathAsUrl: true
						})
						.then((uploadResult) => {
							uni.hideLoading();
							if (uploadResult.fileID) {
								const newImageUrl = uploadResult.fileID;
								this.editableData.itinerary[dayIndex].activities[actIndex].elementData.image = newImageUrl;

								this.$emit('update-partial', {
									path: `itinerary.${dayIndex}.activities.${actIndex}.elementData.image`,
									value: newImageUrl
								});
								uni.showToast({ title: '图片已更新', icon: 'success' });
							}
						})
						.catch((err) => {
							uni.hideLoading();
							uni.showToast({ title: '上传失败', icon: 'error' });
							console.error('酒店图片上传失败:', err);
						});
				}
			});
		},

		// 移除酒店图片
		removeHotelImage(dayIndex, actIndex) {
			this.editableData.itinerary[dayIndex].activities[actIndex].elementData.image = '';

			this.$emit('update-partial', {
				path: `itinerary.${dayIndex}.activities.${actIndex}.elementData.image`,
				value: ''
			});
		},

		addScenicSpot(dayIndex, actIndex) {
			console.log(`➕ 添加景点: 第${dayIndex + 1}天第${actIndex + 1}个活动`);
			if (!this.editableData.itinerary[dayIndex].activities[actIndex].elementData.scenic_spots) {
				this.editableData.itinerary[dayIndex].activities[actIndex].elementData.scenic_spots = [];
			}
			this.editableData.itinerary[dayIndex].activities[actIndex].elementData.scenic_spots.push({
				name: '',
				description: '',
				images: [],
				linked_poi_id: '',
				linked_poi_name: '',
				match_status: 'unmatched'
			});
		},

		removeScenicSpot(dayIndex, actIndex, spotIndex) {
			console.log(`🗑️ 删除景点: 第${dayIndex + 1}天第${actIndex + 1}个活动第${spotIndex + 1}个景点`);
			this.editableData.itinerary[dayIndex].activities[actIndex].elementData.scenic_spots.splice(spotIndex, 1);

			this.saveActivityDetail({
				dayIndex,
				actIndex,
				field: 'elementData.scenic_spots',
				value: this.editableData.itinerary[dayIndex].activities[actIndex].elementData.scenic_spots
			});
		},

		saveScenicSpotField(dayIndex, actIndex, spotIndex, fieldName) {
			const path = `itinerary.${dayIndex}.activities.${actIndex}.elementData.scenic_spots.${spotIndex}.${fieldName}`;
			const value = this.editableData.itinerary[dayIndex].activities[actIndex].elementData.scenic_spots[spotIndex][fieldName];
			console.log(`💾 保存景点字段: 第${dayIndex + 1}天第${actIndex + 1}个活动第${spotIndex + 1}个景点的${fieldName}:`, value);
			this.$emit('update-partial', { path, value: value });
		},

		// 添加备选酒店
		addAlternativeHotel(dayIndex, actIndex) {
			const elementData = this.editableData.itinerary[dayIndex].activities[actIndex].elementData;
			if (!Array.isArray(elementData.alternativeHotels)) {
				elementData.alternativeHotels = [];
			}

			const newAltHotel = {
				name: '',
				linked_poi_id: '',
				linked_poi_name: '',
				match_status: 'unmatched'
			};
			elementData.alternativeHotels.push(newAltHotel);

			this.$emit('update-partial', {
				path: `itinerary.${dayIndex}.activities.${actIndex}.elementData.alternativeHotels`,
				value: elementData.alternativeHotels
			});
		},

		// 移除备选酒店
		removeAlternativeHotel(dayIndex, actIndex, altIndex) {
			const alternativeHotels = this.editableData.itinerary[dayIndex].activities[actIndex].elementData.alternativeHotels;
			alternativeHotels.splice(altIndex, 1);

			this.$emit('update-partial', {
				path: `itinerary.${dayIndex}.activities.${actIndex}.elementData.alternativeHotels`,
				value: alternativeHotels
			});
		},

		// 保存备选酒店名称
		saveAlternativeHotel(dayIndex, actIndex, altIndex, fieldName) {
			const path = `itinerary.${dayIndex}.activities.${actIndex}.elementData.alternativeHotels.${altIndex}.${fieldName}`;
			const value = this.editableData.itinerary[dayIndex].activities[actIndex].elementData.alternativeHotels[altIndex][fieldName];
			console.log(`💾 保存备选酒店字段: ${path}`, value);
			this.$emit('update-partial', { path, value });
		},

		// 添加新的一天
		addNewDay() {
			console.log('➕ 添加新的一天');

			if (!this.editableData.itinerary) {
				this.editableData.itinerary = [];
			}

			const newDayNumber = this.editableData.itinerary.length + 1;
			const newDay = {
				day: newDayNumber,
				day_title: `第${newDayNumber}天`,
				day_highlights: '',
				destination_city: '',
				activities: []
			};

			this.editableData.itinerary.push(newDay);
			this.editableData.total_days = this.editableData.itinerary.length;

			const newDayIndex = this.editableData.itinerary.length - 1;

			this.$nextTick(() => {
				// 构造与模板中一致的元素ID
				const elementId = `day-${newDayIndex}`;
				const newElement = document.getElementById(elementId);

				if (newElement) {
					console.log(`📜 滚动到新的一天: #${elementId}`);
					// 调用浏览器API，平滑滚动到元素位置
					newElement.scrollIntoView({
						behavior: 'smooth', // 平滑滚动效果
						block: 'center' // 滚动到视口中央
					});
				}
			});

			this.$emit('update-partial', { operator: '$push', path: 'itinerary', value: newDay });
			this.$emit('update-partial', { path: 'total_days', value: newDayNumber });

			uni.showToast({
				title: `已添加第${newDayNumber}天`,
				icon: 'success',
				duration: 2000
			});
		},

		// 删除一天
		deleteDay(dayIndex) {
			const dayNumber = dayIndex + 1;
			console.log(`🗑️ 删除第${dayNumber}天`);

			uni.showModal({
				title: '确认删除',
				content: `确定要删除第${dayNumber}天的行程吗？删除后无法恢复。`,
				confirmColor: '#f56565',
				success: (res) => {
					if (res.confirm) {
						const deletedDay = this.editableData.itinerary[dayIndex];
						this.editableData.itinerary.splice(dayIndex, 1);
						this.editableData.total_days = this.editableData.itinerary.length;

						// 重新调整后续天数的编号
						for (let i = dayIndex; i < this.editableData.itinerary.length; i++) {
							this.editableData.itinerary[i].day = i + 1;
						}

						this.$emit('update-partial', { path: 'itinerary', value: this.editableData.itinerary });
						this.$emit('update-partial', { path: 'total_days', value: this.editableData.total_days });

						uni.showToast({
							title: '删除成功',
							icon: 'success',
							duration: 2000
						});
					}
				}
			});
		},

		// 设置活动时间类型
		setTimeType(dayIndex, actIndex, type) {
			const activity = this.editableData.itinerary[dayIndex].activities[actIndex];
			activity.time_type = type;

			console.log(`💾 发送 time_type 局部更新...`);
			this.$emit('update-partial', {
				path: `itinerary.${dayIndex}.activities.${actIndex}.time_type`,
				value: type
			});

			// 根据 type 清空另一个不用的时间字段
			if (type === 'specific') {
				activity.time_period = '';
				console.log(`💾 发送 time_period 清空更新...`);
				this.$emit('update-partial', {
					path: `itinerary.${dayIndex}.activities.${actIndex}.time_period`,
					value: ''
				});
			} else if (type === 'period') {
				activity.time_start_time = '';
				console.log(`💾 发送 time_start_time 清空更新...`);
				this.$emit('update-partial', {
					path: `itinerary.${dayIndex}.activities.${actIndex}.time_start_time`,
					value: ''
				});
			}
		},

		generateMarkdownContent(data) {
			let content = '';

			// 辅助函数，用于安全地添加内容
			const addLine = (text = '') => (content += text + '\n');
			const addSectionBreak = () => addLine('\n---\n');

			// 1. 行程主标题
			addLine(`# ${data.title || '未命名行程'}`);
			addLine();

			// 2. 行程概览
			addLine('## 行程概览');
			addLine(`- **总天数:** ${data.total_days || 'N/A'} 天`);
			if (data.remarks) {
				addLine(`- **行程备注:** ${data.remarks}`);
			}
			addSectionBreak();

			// 3. 每日行程
			addLine('## 每日行程');
			if (!data.itinerary || data.itinerary.length === 0) {
				addLine('_暂无每日行程安排。_');
			} else {
				data.itinerary.forEach((day) => {
					addLine(`### ${day.day_title || '未命名标题'}`);
					addLine();
					if (day.destination_city) {
						addLine(`**目的地:** ${day.destination_city}`);
					}
					if (day.day_highlights) {
						addLine(`**当日亮点:** ${day.day_highlights}`);
					}
					addLine();
					addLine('#### 活动安排');

					if (!day.activities || day.activities.length === 0) {
						addLine(`_当天无具体活动安排。_`);
					} else {
						day.activities.forEach((activity, index) => {
							const typeName = this.getActivityTypeName(activity.elementType);
							const time = activity.time_type === 'period' ? activity.time_period : activity.time_start_time;

							// 活动标题行
							addLine(`${index + 1}. **${time || '全天'} - [${typeName}] ${activity.title || '未命名活动'}**`);

							// 渲染活动详情 (elementData)
							const details = activity.elementData;
							if (details) {
								Object.keys(details).forEach((key) => {
									const value = details[key];

									if (key === 'scenic_spots' || value === null || value === undefined || value === '') return;

									// 从映射表中查找中文标签，如果找不到则使用原始key
									const label = this.keyToChineseMap[key] || key;

									if (key === 'image' || key === 'images') {
										addLine(`    - **${label}:**`);
										if (Array.isArray(value)) {
											value.forEach((url) => addLine(`      ![图片](${url})`));
										} else if (typeof value === 'string' && value.startsWith('http')) {
											addLine(`      ![图片](${value})`);
										}
										return; // 处理完图片后跳过，避免被当作普通文本再次输出
									}

									let displayValue = value;

									// 对特殊类型的值进行格式化
									if (typeof value === 'boolean') {
										displayValue = value ? '是' : '否';
									} else if (Array.isArray(value)) {
										displayValue = value.join(' / ');
									}

									addLine(`    - **${label}:** ${displayValue}`);
								});

								// 特别处理景点列表
								if (activity.elementType === 'scenic' && details.scenic_spots && details.scenic_spots.length > 0) {
									addLine('    - **景点列表:**');
									details.scenic_spots.forEach((spot) => {
										addLine(`        - **${spot.name || '未命名景点'}**: ${spot.description || ''}`);
										// 显示景点内嵌的图片
										if (Array.isArray(spot.images) && spot.images.length > 0) {
											spot.images.forEach((url) => {
												addLine(`          ![${spot.name || '景点图片'}](${url})`);
											});
										}
									});
								}
							}
						});
					}
					addLine();
					if (day.day < data.itinerary.length) {
						addSectionBreak();
					}
				});
			}

			return content;
		},

		// 导出行程
		exportItinerary() {
			if (!this.editableData || !this.editableData.itinerary) {
				uni.showToast({ title: '没有行程数据可导出', icon: 'none' });
				return;
			}

			console.log('📥 开始生成并导出行程文件...');

			try {
				// 1. 调用辅助方法，生成 Markdown 格式的字符串内容
				const markdownContent = this.generateMarkdownContent(this.editableData);

				// 2. 定义文件名，例如 "拉萨5日游.md"
				const filename = `${this.editableData.title || '未命名行程'}.md`;

				// 3. 创建一个 Blob 对象
				const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });

				// 4. 利用 <a> 标签的 download 属性，触发浏览器下载
				const url = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = filename;
				document.body.appendChild(link);
				link.click();

				// 5. 清理：移除临时创建的元素和 URL
				document.body.removeChild(link);
				URL.revokeObjectURL(url);

				uni.showToast({ title: '导出成功！', icon: 'success' });
				console.log(`✅ 文件 [${filename}] 已开始下载。`);
			} catch (error) {
				console.error('❌ 导出行程失败:', error);
				uni.showToast({ title: '导出失败', icon: 'error' });
			}
		},

		// 加载数据时，反查 POI ID 对应的名称
		async hydratePoiNames() {
			if (!this.editableData || !this.editableData.itinerary) return;

			const poiIds = new Set();

			// 1. 收集所有 POI ID
			this.editableData.itinerary.forEach((day) => {
				if (day.activities) {
					day.activities.forEach((activity) => {
						if (activity.linked_poi_id) poiIds.add(activity.linked_poi_id);
						if (activity.elementType === 'scenic' && activity.elementData.scenic_spots) {
							activity.elementData.scenic_spots.forEach((spot) => {
								if (spot.linked_poi_id) poiIds.add(spot.linked_poi_id);
							});
						}
						if (activity.elementType === 'hotel' && activity.elementData.alternativeHotels) {
							activity.elementData.alternativeHotels.forEach((alt) => {
								if (alt && alt.linked_poi_id) poiIds.add(alt.linked_poi_id);
							});
						}
					});
				}
			});

			const idArray = Array.from(poiIds).filter((id) => id);
			if (idArray.length === 0) {
				console.log('🔍 [POI Hydration] 无需填充POI名称.');
				this.poiCandidates = []; // 🛡️ 确保置为空数组而不是 undefined
				return;
			}

			try {
				const db = uniCloud.database();
				const poiRes = await db.collection('a-poi-database').field('_id, name').get();

				const poiMap = new Map();

				// 🛡️ 修复：增加安全访问，防止 result.data 不存在导致 crash
				const fetchedPois = poiRes.result?.data || poiRes.data || [];

				// 赋值给 candidates，供 uni-combox 显示匹配项
				this.poiCandidates = fetchedPois;

				fetchedPois.forEach((poi) => {
					if (poi) poiMap.set(poi._id, poi.name);
				});

				// 3. 将名称注入到 editableData
				this.editableData.itinerary.forEach((day) => {
					if (day.activities) {
						day.activities.forEach((activity) => {
							if (activity.linked_poi_id && poiMap.has(activity.linked_poi_id)) {
								this.$set(activity, 'linked_poi_name', poiMap.get(activity.linked_poi_id));
							}
							if (activity.elementType === 'scenic' && activity.elementData.scenic_spots) {
								activity.elementData.scenic_spots.forEach((spot) => {
									if (spot.linked_poi_id && poiMap.has(spot.linked_poi_id)) {
										this.$set(spot, 'linked_poi_name', poiMap.get(spot.linked_poi_id));
									}
								});
							}
							if (activity.elementType === 'hotel' && activity.elementData.alternativeHotels) {
								activity.elementData.alternativeHotels.forEach((alt) => {
									if (alt && alt.linked_poi_id && poiMap.has(alt.linked_poi_id)) {
										this.$set(alt, 'linked_poi_name', poiMap.get(alt.linked_poi_id));
									}
								});
							}
						});
					}
				});
				console.log('✅ [POI Hydration] 成功填充 POI 名称.');
			} catch (e) {
				console.error('❌ [POI Hydration] 填充POI名称失败:', e);
				this.poiCandidates = []; // 出错时也要重置为空数组
			}
		},

		// 辅助函数：获取活动时间字符串
		getTimeString(activity) {
			if (activity.time_type === 'period') {
				return activity.time_period || '未设置时段';
			} else {
				return activity.time_start_time || '未设置时间';
			}
		},

		// 打开 POI 弹窗
		openPoiModal(context) {
			const { dayIndex, actIndex, spotIndex, altIndex, field, title, type, time } = context;

			// 1. 获取当前数据库中保存的值
			let currentId = '';
			let currentName = '';
			let currentStatus = 'unmatched';

			const activity = this.editableData.itinerary[dayIndex].activities[actIndex];

			if (field === 'main') {
				currentId = activity.linked_poi_id;
				currentName = activity.linked_poi_name;
				currentStatus = activity.match_status;
			} else if (field === 'spot') {
				const spot = activity.elementData.scenic_spots[spotIndex];
				currentId = spot.linked_poi_id;
				currentName = spot.linked_poi_name;
				currentStatus = spot.match_status;
			} else if (field === 'alt') {
				const alt = activity.elementData.alternativeHotels[altIndex];
				currentId = alt.linked_poi_id;
				currentName = alt.linked_poi_name;
				currentStatus = alt.match_status;
			}

			// 2. 初始化弹窗数据
			this.poiModalData = {
				dayIndex,
				actIndex,
				spotIndex,
				altIndex,
				field,
				title,
				type,
				time,
				linked_poi_id: currentId || '',
				linked_poi_name: currentName || '',
				match_status: currentStatus || 'unmatched'
			};

			if (currentId && currentName) {
				// 把当前项做成候选列表，uni-combox 就能通过 ID 显示出 Name
				this.poiCandidates = [{ _id: currentId, name: currentName }];
				// 将 v-model 绑定为 ID
				this.poiSearchInput = currentId;
			} else {
				// 如果没值，就清空，准备搜索
				this.poiCandidates = [];
				this.poiSearchInput = '';
			}

			// this.originalPoiName = currentName;

			// // 3. 初始化 Combox
			// this.poiSearchInput = '';
			// this.poiCandidates = [];

			this.showPoiModal = true;
		},

		// 关闭 POI 弹窗
		closePoiModal() {
			this.showPoiModal = false;
			this.poiSearchInput = '';
			this.poiCandidates = [];
			if (this.poiSearchTimer) clearTimeout(this.poiSearchTimer);
		},

		// 加载默认 POI (点击 Combox 时)
		async loadDefaultPois() {
			if (this.poiSearchTimer) clearTimeout(this.poiSearchTimer);

			this.poiCandidates = [];
			this.poiLoading = true;

			try {
				const db = uniCloud.database();
				const res = await db.collection('a-poi-database').field('_id, name').limit(20).get();

				if (res.result.data) {
					this.poiCandidates = res.result.data;
				}
			} catch (e) {
				console.error('加载默认POI失败', e);
			} finally {
				this.poiLoading = false;
			}
		},

		// 搜索 POI (仿照 orders-table 的防抖逻辑)
		searchPois(query) {
			if (this.poiSearchTimer) clearTimeout(this.poiSearchTimer);

			if (!query) {
				// 清空了搜索框，视为取消关联
				this.loadDefaultPois();
				return;
			}

			this.poiCandidates = [];
			this.poiLoading = true;

			this.poiSearchTimer = setTimeout(async () => {
				try {
					const db = uniCloud.database();
					const res = await db
						.collection('a-poi-database')
						.where({
							name: new RegExp(query, 'i') // 模糊查询
						})
						.field('_id, name')
						.limit(30)
						.get();

					if (res.result.data) {
						this.poiCandidates = res.result.data;
					}
				} catch (err) {
					console.error('POI搜索失败:', err);
				} finally {
					this.poiLoading = false;
				}
			}, 300); // 300ms 防抖
		},

		// 选中 POI (uni-combox change 事件)
		onPoiModalSelect(selectedId) {
			// 注意：uni-combox 的 change 事件有时返回 ID，有时如果是手动输入未匹配项，可能返回文本
			// 我们需要从 candidates 中找到对应的对象

			// 1. 尝试在候选列表中找到匹配项
			const selectedItem = this.poiCandidates.find((item) => item && (item._id === selectedId || item.name === selectedId));

			if (selectedItem) {
				// 命中数据库中的 POI
				this.poiModalData.linked_poi_id = selectedItem._id;
				this.poiModalData.linked_poi_name = selectedItem.name;
				this.poiSearchInput = selectedItem.name; // 修正显示文本

				// 自动将状态改为手动确认（可选优化）
				if (this.poiModalData.match_status === 'unmatched') {
					this.poiModalData.match_status = 'manual';
				}
			}
		},

		// 确认保存 POI 修改
		confirmPoiModal() {
			const { dayIndex, actIndex, spotIndex, altIndex, field, linked_poi_id, linked_poi_name, match_status } = this.poiModalData;

			let finalId, finalName, finalStatus;

			if (!this.poiSearchInput) {
				// 相当于“取消关联”
				finalId = '';
				finalName = '';
				finalStatus = 'unmatched';
			} else {
				// 否则使用当前选中的值
				finalId = this.poiModalData.linked_poi_id;
				finalName = this.poiModalData.linked_poi_name;
				finalStatus = this.poiModalData.match_status;
			}

			// 根据 field 类型回写数据并发送更新事件
			if (field === 'main') {
				const activity = this.editableData.itinerary[dayIndex].activities[actIndex];
				activity.linked_poi_id = finalId;
				activity.linked_poi_name = finalName;
				activity.match_status = finalStatus;

				// 发送局部更新
				this.saveActivityField(dayIndex, actIndex, 'linked_poi_id');
				// 顺便更新状态
				this.saveActivityField(dayIndex, actIndex, 'match_status');
			} else if (field === 'spot') {
				const spot = this.editableData.itinerary[dayIndex].activities[actIndex].elementData.scenic_spots[spotIndex];
				spot.linked_poi_id = finalId;
				spot.linked_poi_name = finalName;
				spot.match_status = finalStatus;

				this.saveScenicSpotField(dayIndex, actIndex, spotIndex, 'linked_poi_id', linked_poi_id);
				this.saveScenicSpotField(dayIndex, actIndex, spotIndex, 'match_status', match_status);
			} else if (field === 'alt') {
				const alt = this.editableData.itinerary[dayIndex].activities[actIndex].elementData.alternativeHotels[altIndex];
				alt.linked_poi_id = finalId;
				alt.linked_poi_name = finalName;
				alt.match_status = finalStatus;

				this.saveAlternativeHotel(dayIndex, actIndex, altIndex, 'linked_poi_id', linked_poi_id);
				this.saveAlternativeHotel(dayIndex, actIndex, altIndex, 'match_status', match_status);
			}

			this.closePoiModal();
			uni.showToast({ title: '关联已更新', icon: 'success' });
		},

		clearPoiMatch() {
			// 1. 清除待保存的数据
			this.poiModalData.linked_poi_id = '';
			this.poiModalData.linked_poi_name = '';

			// 2. 状态重置为未匹配
			this.poiModalData.match_status = 'unmatched';

			// 3. 更新 UI 显示 (让“当前POI”立即变为空)
			this.originalPoiName = '';

			// 4. 清空搜索框并重置列表
			this.poiSearchInput = '';
			this.poiCandidates = [];

			// 5. (可选) 重新加载默认列表，方便用户重新选择
			this.loadDefaultPois();

			uni.showToast({ title: '已清除关联，请点击保存生效', icon: 'none' });
		}
	}
};

const keyToChineseMap = {
	// 通用字段
	title: '标题',
	content: '内容详情',
	remark: '备注',
	time_info: '时间信息',
	image: '参考图片',
	images: '参考图片',
	description: '介绍',
	locations: '地点',

	// 集合 (assembly)
	assembly_type: '集合方式',

	// 交通 (transport)
	transport_type: '交通工具',
	departure: '出发地',
	destination: '目的地',
	driving_distance: '行驶距离(km)',
	driving_duration_hours: '行驶小时',

	// 餐厅 (restaurant)
	name: '餐食名称',
	meal_type: '餐食类型',
	adult_fee_type: '成人费用',
	child_fee_type: '儿童费用',
	adult_included: '成人含餐',
	child_included: '儿童含餐',
	cuisine: '菜系',

	// 酒店 (hotel)
	hotelName: '酒店名称',
	address: '酒店地址',
	rating: '酒店星级',
	level: '酒店级别',

	// 景点 (scenic)
	scenic_name: '景点名称',
	highlights: '亮点',

	// 其他 (other)
	show_name: '演出或活动名称',
	venue: '场地',

	// 解散 (dismissal)
	dismissal_type: '解散方式'
};
</script>

<style scoped>
/* 全局字体设置 */
.itinerary-management {
	font-family: 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	background-color: #f8fafc;
	min-height: 100vh;
	padding: 20px;
}

/* 搜索输入框样式 */
.search-input {
	min-width: 280px;
}

/* 按钮基础样式 */
.action-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-family: 'Microsoft YaHei', sans-serif;
	font-weight: 500;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s ease;
	text-decoration: none;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 按钮尺寸 */
.action-btn {
	padding: 12px 20px;
	font-size: 16px;
	min-height: 48px;
}

.action-btn-sm {
	padding: 8px 16px;
	font-size: 14px;
	min-height: 40px;
}

.action-btn-xs {
	padding: 6px 12px;
	font-size: 12px;
	min-height: 32px;
}

/* 按钮颜色变体 */
.action-btn-primary {
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
}

.action-btn-primary:hover {
	background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.action-btn-success {
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
}

.action-btn-success:hover {
	background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.action-btn-danger {
	background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	color: white;
}

.action-btn-danger:hover {
	background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}

.action-btn-outline {
	background: white;
	border: 2px solid #e5e7eb;
	color: #374151;
}

.action-btn-outline:hover {
	border-color: #3b82f6;
	color: #3b82f6;
	background: #f8fafc;
}

/* 加载状态 */
.loading-container {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 400px;
	background: white;
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-content {
	text-align: center;
}

/* 概览卡片 */
.overview-card {
	background: white;
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	overflow: hidden;
}

.card-header {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 24px;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
	border-bottom: 1px solid #e5e7eb;
}

.overview-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20px;
	padding: 24px;
}

.overview-item {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.overview-item.full-width {
	grid-column: span 2;
}

.overview-label {
	font-size: 14px;
	font-weight: 600;
	color: #374151;
	margin-bottom: 4px;
}

.overview-input {
	min-width: 200px;
}

/* 日期容器 */
.day-container {
	background: white;
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	margin-bottom: 20px;
}

.day-header {
	padding: 24px;
	background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
	border-bottom: 1px solid #a7f3d0;
}

/* 日期标题行 */
.day-title-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20px;
}

/* 行程特点和玩法亮点行 */
.day-details-row {
	display: flex;
	gap: 24px;
	margin-bottom: 20px;
}

.day-detail-item {
	display: flex;
	flex-direction: column;
	gap: 12px;
	flex: 1;
}

.day-detail-item-full {
	width: 100%;
	flex: none;
}

.day-detail-label {
	display: flex;
	align-items: center;
	font-size: 16px;
	font-weight: 600;
	color: #374151;
	font-family: 'Microsoft YaHei', sans-serif;
}

.day-detail-input {
	width: 100%;
	min-width: 300px;
}

/* 视觉增强效果 */
.day-detail-item {
	background: rgba(255, 255, 255, 0.7);
	padding: 16px;
	border-radius: 8px;
	border: 1px solid rgba(209, 213, 219, 0.5);
	transition: all 0.2s ease;
}

.day-detail-item:hover {
	background: rgba(255, 255, 255, 0.9);
	border-color: rgba(59, 130, 246, 0.3);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	transform: translateY(-1px);
}

.day-detail-label span {
	font-weight: 600;
	color: #1f2937;
}

/* 图标动画效果 */
.day-detail-label i {
	transition: transform 0.2s ease;
}

.day-detail-item:hover .day-detail-label i {
	transform: scale(1.1);
}

/* 焦点状态增强 */
.day-detail-input:focus-within {
	transform: scale(1.02);
	transition: transform 0.2s ease;
}

.day-title-section {
	display: flex;
	align-items: center;
	gap: 12px;
}

.day-number {
	font-size: 18px;
	font-weight: 700;
	color: #065f46;
	min-width: 80px;
}

.day-title-input {
	min-width: 750px;
	width: 100%;
	max-width: 1200px;
}

.day-actions {
	display: flex;
	gap: 8px;
}

/* 活动表格 */
.activities-table-container {
	overflow-x: auto;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	background: white;
}

.activities-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 14px;
	min-width: 900px; /* 确保表格有最小宽度 */
}

.activities-table th {
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
	color: #374151;
	font-weight: 600;
	padding: 16px 12px;
	text-align: left;
	border-bottom: 2px solid #e5e7eb;
	font-family: 'Microsoft YaHei', sans-serif;
	position: sticky;
	top: 0;
	z-index: 10;
}

.activities-table td {
	padding: 16px 12px;
	border-bottom: 1px solid #f1f5f9;
	vertical-align: top;
	background: white;
}

.activity-row:hover {
	background: #f8fafc;
	transition: background-color 0.2s ease;
}

.activity-row:hover td {
	background: #f8fafc;
}

/* 活动类型徽章 */
.activity-type-badge {
	display: inline-flex;
	align-items: center;
	padding: 6px 10px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 600;
	white-space: nowrap;
}

.type-assembly {
	background: #dbeafe;
	color: #1e40af;
}
.type-transport {
	background: #fef3c7;
	color: #92400e;
}
.type-restaurant {
	background: #fecaca;
	color: #991b1b;
}
.type-scenic {
	background: #d1fae5;
	color: #065f46;
}
.type-hotel {
	background: #e0e7ff;
	color: #3730a3;
}
.type-other {
	background: #f3e8ff;
	color: #6b21a8;
}
.type-dismissal {
	background: #f1f5f9;
	color: #475569;
}
.type-default {
	background: #f1f5f9;
	color: #64748b;
}

/* 输入框单元格 */
.activity-time-cell,
.activity-title-cell {
	padding: 8px 12px;
}

.time-input {
	max-width: 80px;
}

.title-input {
	min-width: 150px;
}

/* 时间选择器样式 */
.time-selector-container {
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 120px;
}

.time-type-selector {
	display: flex;
	gap: 4px;
	justify-content: center;
}

.time-type-btn {
	width: 32px;
	height: 28px;
	border: 1px solid #d1d5db;
	background: white;
	border-radius: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;
	color: #6b7280;
	font-size: 12px;
}

.time-type-btn:hover {
	border-color: #3b82f6;
	color: #3b82f6;
}

.time-type-btn.active {
	background: #3b82f6;
	border-color: #3b82f6;
	color: white;
}

.time-input-container {
	display: flex;
	justify-content: center;
}

.time-period-container {
	display: flex;
	justify-content: center;
}

.time-period-select {
	width: 100%;
	padding: 4px 8px;
	border: 1px solid #d1d5db;
	border-radius: 4px;
	font-size: 13px;
	color: #374151;
	background: white;
	font-family: 'Microsoft YaHei', sans-serif;
}

.time-period-select:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 活动详情单元格 */
.activity-details-cell {
	max-width: 300px;
}

.activity-details {
	padding: 12px;
	background: #f8fafc;
	border-radius: 8px;
	border: 1px solid #e2e8f0;
}

.detail-row {
	display: flex;
	flex-direction: column;
	gap: 6px;
	margin-bottom: 12px;
}

.detail-row-group {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
	margin-bottom: 12px;
}

.detail-label {
	font-size: 13px;
	font-weight: 600;
	color: #374151;
	font-family: 'Microsoft YaHei', sans-serif;
}

.detail-label-sm {
	font-size: 12px;
	font-weight: 600;
	color: #4b5563;
	font-family: 'Microsoft YaHei', sans-serif;
}

/* 操作按钮单元格 */
.activity-actions {
	display: flex;
	gap: 4px;
}

/* 空状态 */
.empty-state {
	padding: 40px 20px;
	text-align: center;
}

.empty-content {
	display: flex;
	flex-direction: column;
	align-items: center;
}

/* 无数据状态 */
.no-data-container {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 400px;
	background: white;
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.no-data-content {
	text-align: center;
	max-width: 300px;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.itinerary-management {
		padding: 12px;
	}

	.overview-grid {
		grid-template-columns: 1fr;
	}

	.overview-item.full-width {
		grid-column: span 1;
	}

	.day-title-row {
		flex-direction: column;
		gap: 16px;
		align-items: stretch;
	}

	.day-title-section {
		justify-content: space-between;
	}

	.day-details-row {
		grid-template-columns: 1fr;
		gap: 16px;
	}

	.day-detail-input {
		min-width: 100%;
	}

	.day-actions {
		display: flex;
		gap: 8px;
		justify-content: center;
	}

	.activities-table-container {
		overflow-x: scroll;
	}

	.activities-table {
		min-width: 800px;
	}
}

/* 间距工具类 */
.space-y-6 > * + * {
	margin-top: 1.5rem;
}

.space-x-3 > * + * {
	margin-left: 0.75rem;
}

.space-x-4 > * + * {
	margin-left: 1rem;
}

.mr-1 {
	margin-right: 0.25rem;
}
.mr-2 {
	margin-right: 0.5rem;
}
.mb-2 {
	margin-bottom: 0.5rem;
}
.mb-4 {
	margin-bottom: 1rem;
}
.mb-6 {
	margin-bottom: 1.5rem;
}
.mt-2 {
	margin-top: 0.5rem;
}

/* 字体大小 */
.text-sm {
	font-size: 0.875rem;
}
.text-lg {
	font-size: 1.125rem;
}
.text-xl {
	font-size: 1.25rem;
}
.text-2xl {
	font-size: 1.5rem;
}
.text-3xl {
	font-size: 1.875rem;
}
.text-4xl {
	font-size: 2.25rem;
}
.text-6xl {
	font-size: 3.75rem;
}

/* 字体粗细 */
.font-bold {
	font-weight: 700;
}
.font-medium {
	font-weight: 500;
}
.font-semibold {
	font-weight: 600;
}

/* 文本颜色 */
.text-gray-300 {
	color: #d1d5db;
}
.text-gray-400 {
	color: #9ca3af;
}
.text-gray-500 {
	color: #6b7280;
}
.text-gray-600 {
	color: #4b5563;
}
.text-gray-800 {
	color: #1f2937;
}
.text-blue-500 {
	color: #3b82f6;
}
.text-blue-600 {
	color: #2563eb;
}
.text-emerald-600 {
	color: #059669;
}

/* 布局 */
.flex {
	display: flex;
}
.items-center {
	align-items: center;
}
.justify-between {
	justify-content: space-between;
}

/* 活动详情样式 */
.activity-details {
	padding: 12px;
	background: #f8fafc;
	border-radius: 8px;
	border: 1px solid #e2e8f0;
}

/* 景点相关样式 */
.scenic-single,
.scenic-multiple {
	padding: 8px;
	border-radius: 6px;
	background: #ffffff;
	border: 1px solid #e5e7eb;
}

.scenic-spots-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16px;
	padding-bottom: 8px;
	border-bottom: 1px solid #e5e7eb;
}

.scenic-spot-item {
	margin-bottom: 16px;
	padding: 12px;
	background: #f9fafb;
	border-radius: 6px;
	border: 1px solid #e5e7eb;
}

.scenic-spot-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
}

.scenic-spot-title {
	font-size: 14px;
	font-weight: 600;
	color: #374151;
	margin: 0;
	font-family: 'Microsoft YaHei', sans-serif;
}

/* 景点图片展示 */
.scenic-images {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-top: 8px;
}

.scenic-images-sm {
	gap: 6px;
}

.scenic-image-item {
	position: relative;
	width: 80px;
	height: 60px;
	border-radius: 6px;
	overflow: hidden;
	border: 2px solid #e5e7eb;
	transition: all 0.2s ease;
}

.scenic-image-item-sm {
	width: 60px;
	height: 45px;
}

.scenic-image-item:hover {
	border-color: #3b82f6;
	transform: scale(1.02);
}

.scenic-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
	cursor: pointer;
}

.scenic-image-sm {
	width: 100%;
	height: 100%;
}

.image-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 4px;
	opacity: 0;
	transition: opacity 0.2s ease;
}

.scenic-image-item:hover .image-overlay {
	opacity: 1;
}

.image-action-btn {
	width: 24px;
	height: 24px;
	border-radius: 4px;
	border: none;
	background: rgba(255, 255, 255, 0.9);
	color: #374151;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 10px;
	transition: all 0.2s ease;
}

.image-action-btn:hover {
	background: white;
}

.image-action-btn.delete {
	background: rgba(239, 68, 68, 0.9);
	color: white;
}

.image-action-btn.delete:hover {
	background: #dc2626;
}

.add-image-btn {
	width: 80px;
	height: 60px;
	border: 2px dashed #cbd5e1;
	border-radius: 6px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;
	background: #f8fafc;
	color: #64748b;
	font-size: 12px;
	gap: 4px;
}

.add-image-btn-sm {
	width: 60px;
	height: 45px;
	font-size: 10px;
}

.add-image-btn:hover {
	border-color: #3b82f6;
	background: #eff6ff;
	color: #3b82f6;
}

.add-image-btn i {
	font-size: 16px;
}

.add-image-btn-sm i {
	font-size: 14px;
}

.add-image-btn span {
	font-family: 'Microsoft YaHei', sans-serif;
	white-space: nowrap;
}

/* 详情区域特定样式 */
.detail-assembly {
	border-left: 4px solid #3b82f6;
	padding-left: 12px;
}

.detail-transport {
	border-left: 4px solid #f59e0b;
	padding-left: 12px;
}

.detail-restaurant {
	border-left: 4px solid #ef4444;
	padding-left: 12px;
}

.detail-scenic {
	border-left: 4px solid #10b981;
	padding-left: 12px;
}

.detail-hotel {
	border-left: 4px solid #6366f1;
	padding-left: 12px;
}

.detail-other {
	border-left: 4px solid #8b5cf6;
	padding-left: 12px;
}

.detail-dismissal {
	border-left: 4px solid #6b7280;
	padding-left: 12px;
}

/* 活动类型选择弹窗样式 */
.activity-type-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	animation: fadeIn 0.3s ease;
}

.activity-type-modal {
	background: white;
	border-radius: 16px;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	max-width: 800px;
	width: 90%;
	max-height: 80vh;
	overflow: hidden;
	animation: slideUp 0.3s ease;
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24px 32px;
	border-bottom: 1px solid #e5e7eb;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.modal-title-section {
	display: flex;
	align-items: center;
}

.modal-title {
	font-size: 24px;
	font-weight: 700;
	color: #1f2937;
	margin: 0;
	font-family: 'Microsoft YaHei', sans-serif;
}

.modal-close-btn {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	border: none;
	background: rgba(255, 255, 255, 0.8);
	color: #6b7280;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	transition: all 0.2s ease;
}

.modal-close-btn:hover {
	background: white;
	color: #374151;
	transform: scale(1.05);
}

.activity-types-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 16px;
	padding: 32px;
	max-height: 50vh;
	overflow-y: auto;
}

.activity-type-card {
	display: flex;
	align-items: center;
	padding: 20px;
	border-radius: 12px;
	border: 2px solid #e5e7eb;
	background: white;
	cursor: pointer;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
}

.activity-type-card:hover {
	border-color: #3b82f6;
	transform: translateY(-2px);
	box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.activity-type-card.selected {
	border-color: #3b82f6;
	background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
	box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.2);
}

.activity-type-icon {
	width: 60px;
	height: 60px;
	border-radius: 12px;
	background: rgba(59, 130, 246, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24px;
	margin-right: 16px;
	flex-shrink: 0;
	transition: all 0.3s ease;
}

.activity-type-card.selected .activity-type-icon {
	background: rgba(59, 130, 246, 0.2);
	transform: scale(1.1);
}

.activity-type-info {
	flex: 1;
}

.activity-type-name {
	font-size: 18px;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 8px 0;
	font-family: 'Microsoft YaHei', sans-serif;
}

.activity-type-desc {
	font-size: 14px;
	color: #6b7280;
	margin: 0;
	line-height: 1.4;
	font-family: 'Microsoft YaHei', sans-serif;
}

.activity-type-check {
	width: 32px;
	height: 32px;
	color: #3b82f6;
	font-size: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	animation: bounceIn 0.3s ease;
}

.modal-footer {
	display: flex;
	justify-content: flex-end;
	gap: 16px;
	padding: 24px 32px;
	border-top: 1px solid #e5e7eb;
	background: #f9fafb;
}

.modal-btn {
	padding: 12px 24px;
	border-radius: 8px;
	border: none;
	font-size: 16px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	font-family: 'Microsoft YaHei', sans-serif;
	min-width: 120px;
	justify-content: center;
}

.modal-btn-cancel {
	background: #f3f4f6;
	color: #6b7280;
}

.modal-btn-cancel:hover {
	background: #e5e7eb;
	color: #374151;
}

.modal-btn-confirm {
	background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
	color: white;
}

.modal-btn-confirm:hover:not(:disabled) {
	background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.modal-btn-confirm:disabled {
	background: #d1d5db;
	color: #9ca3af;
	cursor: not-allowed;
	transform: none;
	box-shadow: none;
}

/* uni-combox 下拉列表高度自定义 */
::v-deep .uni-combox__selector {
	z-index: 999; /* 确保在弹窗之上 */
}

::v-deep .uni-combox__selector-scroll {
	max-height: 180px;
}

::v-deep .is-disabled {
	color: #333 !important;
	-webkit-text-fill-color: #333 !important; /* iOS Safari 修复 */
	background-color: #f3f4f6 !important;
}

/* 动画效果 */
@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes slideUp {
	from {
		transform: translateY(100px);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}

@keyframes bounceIn {
	0% {
		transform: scale(0);
		opacity: 0;
	}
	50% {
		transform: scale(1.2);
	}
	100% {
		transform: scale(1);
		opacity: 1;
	}
}
</style>
