<template>
	<view>
		<view class="bg-white shadow-sm mx-6 rounded-lg border border-gray-200">
			<view class="p-4">
				<view class="flex flex-wrap items-center justify-between gap-4">
					<view class="flex items-center space-x-3 flex-1 min-w-0">
						<view class="flex-1 max-w-md">
							<uni-easyinput
								v-model="query"
								placeholder="搜索订单ID、标题、副标题或出行人姓名"
								prefixIcon="search"
								:clearable="true"
								@confirm="search"
								@clear="clearSearch"
								:styles="{
									color: '#333',
									backgroundColor: '#fff',
									borderColor: '#d1d5db',
									borderRadius: '8px',
									fontSize: '16px',
									height: '42px'
								}"
								:focus-style="{
									borderColor: '#10b981'
								}" />
						</view>
						<button
							class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base"
							@click="search">
							<i class="fas fa-search mr-2"></i>
							搜索
						</button>

						<view class="w-64 ml-3">
							<uni-datetime-picker
								type="daterange"
								v-model="filterDateRange"
								:border="false"
								:clear-icon="true"
								rangeSeparator="至"
								start-placeholder="开始日期"
								end-placeholder="结束日期"
								@change="onDateRangeChange" />
						</view>

						<view class="w-40 ml-3">
							<uni-data-select v-model="filterAttendantId" :localdata="attendantFilterOptions" placeholder="筛选管家" :clear="true" @change="search"></uni-data-select>
						</view>

						<button
							class="ml-3 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base"
							@click="navigateToSync">
							<i class="fas fa-sync mr-2"></i>
							同步快照
						</button>

						<button
							class="ml-3 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base"
							@click="openCreateDialog">
							<i class="fas fa-plus mr-2"></i>
							新建订单
						</button>
					</view>
				</view>
			</view>
		</view>

		<view class="mx-6 my-6">
			<unicloud-db
				ref="udb"
				:collection="collectionList"
				field="_id,order_id,rank,title,sub_title,departure_date,total_days,created_at,travel_users,travelers,staves,final_amount,custom_display_text,ctrip_id,product_id,snapshot_id,remarks"
				:where="where"
				page-data="replace"
				:orderby="orderby"
				:getcount="true"
				:page-size="options.pageSize"
				:page-current="options.pageCurrent"
				v-slot:default="{ data, pagination, loading, error, options }"
				:options="options"
				loadtime="manual"
				@load="onqueryload">
				<view class="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
					<view class="p-4 border-b border-gray-200">
						<view class="flex items-center justify-between">
							<view class="flex items-center">
								<i class="fas fa-camera text-emerald-600 text-lg mr-3"></i>
								<text class="text-lg font-semibold text-gray-900">订单快照列表</text>
							</view>
							<view class="text-sm text-gray-500">
								共找到
								<text class="font-semibold text-emerald-600 text-base">{{ pagination.count }}</text>
								个快照
							</view>
						</view>
					</view>

					<view class="overflow-hidden">
						<view class="overflow-x-auto">
							<table class="w-full">
								<thead class="bg-gray-50 border-b border-gray-200">
									<tr>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-72 cursor-pointer select-none" @click="handleSort('rank')">
											<text class="mr-2">订单与商品信息</text>
											<!-- 等级
											<i class="fas ml-1" :class="getSortIcon('rank')"></i> -->
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-72">出行人员</th>
										<!-- <th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-64">商品信息</th> -->
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-28">
											<view class="flex items-center gap-2">
												<view class="cursor-pointer select-none flex items-center" @click.stop="handleSort('departure_date')">
													出发日期
													<i class="fas ml-2" :class="getSortIcon('departure_date')"></i>
												</view>
												<view class="cursor-pointer select-none flex items-center" @click.stop="handleSort('total_days')">
													总天数
													<i class="fas ml-2" :class="getSortIcon('total_days')"></i>
												</view>
											</view>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-28 cursor-pointer select-none" @click="handleSort('final_amount')">
											成交金额
											<i class="fas ml-1" :class="getSortIcon('final_amount')"></i>
										</th>
										<th class="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-72">客户备注</th>
										<th class="px-4 py-4 text-center text-sm font-semibold text-gray-900">操作</th>
									</tr>
								</thead>

								<tbody class="bg-white divide-y divide-gray-200">
									<tr v-if="loading">
										<td colspan="8" class="p-8 text-center">
											<view class="flex items-center justify-center">
												<i class="fas fa-spinner fa-spin text-emerald-600 text-xl mr-3"></i>
												<text class="text-gray-600 text-base">正在加载快照数据...</text>
											</view>
										</td>
									</tr>

									<tr v-else-if="!data.length">
										<td colspan="8" class="p-12 text-center">
											<view class="flex flex-col items-center">
												<i class="fas fa-camera-retro text-gray-400 text-4xl mb-4"></i>
												<text class="text-gray-500 text-lg">{{ error.message || '暂无快照数据' }}</text>
											</view>
										</td>
									</tr>

									<tr v-else v-for="(item, index) in listData" :key="index" class="hover:bg-gray-50 transition-colors duration-150">
										<td class="pl-4 py-4">
											<view class="flex items-center mb-3">
												<text
													class="text-sm font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 transition-colors"
													@click="copyToClipboard(item.order_id)">
													{{ item.order_id || '-' }}
												</text>
												<text
													class="px-2 py-1.5 rounded text-xs font-bold"
													:class="{
														'bg-gray-100 text-gray-600': !item.rank || item.rank === 'D',
														'bg-blue-100 text-blue-600': item.rank === 'C',
														'bg-purple-100 text-purple-600': item.rank === 'B',
														'bg-orange-100 text-orange-600': item.rank === 'A'
													}">
													{{ item.rank || 'D' }}
												</text>
											</view>
											<view class="max-w-md">
												<text class="text-sm font-medium text-gray-900 line-clamp-5 leading-5">
													{{ item.title || '无标题' }}
												</text>
												<text class="text-xs text-gray-500 mt-1 line-clamp-5">
													{{ item.sub_title || '' }}
												</text>
											</view>
										</td>

										<td class="px-4 py-4">
											<view class="flex flex-col space-y-1" v-if="(item.travel_users && item.travel_users.length) || (item._rawTravelers && item._rawTravelers.length)">
												<view
													v-for="(user, idx) in getDisplayTravelers(item)"
													:key="user.key || idx"
													class="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded flex items-center">
													<i v-if="user.isRegistered" class="fas fa-user-tag mr-1 text-emerald-600"></i>
													{{ user.text || '未知' }}
												</view>
											</view>
											<view class="flex flex-col space-y-1 mt-1" v-if="item.staves && item.staves.length">
												<view v-for="staff in item.staves" :key="staff.id" class="text-xs text-gray-700 bg-yellow-100 px-2 py-0.5 rounded">
													<i class="fas fa-user-shield mr-1 text-yellow-700"></i>
													<text v-if="formatRoleText(staff.role)" class="font-semibold mr-1">[{{ formatRoleText(staff.role) }}]</text>
													<text>{{ staff.nickname || staff.name || staff.mobile || '号码缺失' }}</text>
												</view>
											</view>
											<text v-else-if="!item.travel_users?.length && !item._rawTravelers?.length && !item.staves?.length" class="text-xs text-gray-400">未指定</text>
										</td>

										<td class="px-4 py-4">
											<view class="text-sm text-gray-700">
												<uni-dateformat :threshold="[0, 0]" :date="item.departure_date" format="yyyy-MM-dd"></uni-dateformat>
											</view>
											<view class="flex items-center">
												<i class="fas fa-calendar-alt text-orange-400 mr-1.5"></i>
												<text class="text-sm text-orange-600 font-medium">{{ item.total_days || '?' }}天</text>
											</view>
										</td>

										<td class="px-4 py-4">
											<text class="text-sm font-bold text-red-600">
												{{ item.final_amount ? '¥' + item.final_amount : '-' }}
											</text>
										</td>

										<td class="px-4 py-4">
											<text class="text-xs text-gray-800 font-medium whitespace-pre-wrap select-text leading-relaxed">
												{{ item.customer_remarks || '-' }}
											</text>
										</td>

										<td class="px-4 py-4">
											<view class="flex items-center justify-center gap-2">
												<button
													@click="handleSupplyAllocation(item)"
													class="px-2 py-1.5 text-xs font-medium rounded transition-colors duration-200 flex items-center"
													:class="item._supplyStatus === 'manual' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'">
													<i class="fas fa-box mr-1"></i>
													{{ item._supplyStatus === 'manual' ? '已配物资' : '分配物资' }}
												</button>
												<button
													@click="handleInvite(item)"
													class="px-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors duration-200 flex items-center">
													<i class="fas fa-qrcode mr-1"></i>
													邀请入团
												</button>
												<button
													@click="openEditDialog(item)"
													class="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors duration-200 flex items-center">
													<i class="fas fa-cog mr-1"></i>
													管理订单
												</button>
												<button
													@click="navigateToDetailEdit(item)"
													class="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded transition-colors duration-200 flex items-center">
													<i class="fas fa-edit mr-1"></i>
													编辑商品
												</button>
												<button
													@click="confirmDelete(item._id)"
													class="px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors duration-200 flex items-center">
													<i class="fas fa-trash mr-1"></i>
													删除订单
												</button>
											</view>
										</td>
									</tr>
								</tbody>
							</table>
						</view>
					</view>
				</view>

				<view class="bg-white rounded-lg shadow-sm border border-gray-200 p-4" v-if="pagination.count > 0">
					<view class="flex items-center justify-between">
						<view class="text-sm text-gray-700">
							显示第
							<text class="font-medium">{{ (pagination.current - 1) * pagination.size + 1 }}</text>
							到
							<text class="font-medium">{{ Math.min(pagination.current * pagination.size, pagination.count) }}</text>
							条， 共
							<text class="font-medium">{{ pagination.count }}</text>
							条记录
						</view>
						<uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current" :total="pagination.count" @change="onPageChanged" />
					</view>
				</view>
			</unicloud-db>
		</view>

		<uni-popup ref="editPopup" type="center" :mask-click="false" @change="onPopupStateChange">
			<view class="bg-white rounded-lg shadow-lg border border-gray-200" style="width: 90vw; max-width: 600px">
				<view class="p-4 border-b border-gray-200">
					<view class="flex items-center justify-between">
						<view class="flex items-center">
							<i class="fas fa-edit text-emerald-600 text-xl mr-3"></i>
							<text class="text-xl font-bold text-gray-900">{{ currentEditId ? '编辑订单快照' : '新建订单快照' }}</text>
						</view>
						<view class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer" @click="closeEditDialog">
							<i class="fas fa-times text-gray-500"></i>
						</view>
					</view>
				</view>

				<scroll-view scroll-y style="max-height: 70vh">
					<view class="p-6">
						<uni-forms ref="editForm" :modelValue="formData" :rules="formRules" validate-trigger="bind" label-width="100" label-align="right">
							<uni-forms-item label="来源渠道" required v-if="!currentEditId">
								<uni-data-select v-model="tempSource" :localdata="sourceOptions" placeholder="请选择来源"></uni-data-select>
							</uni-forms-item>

							<uni-forms-item name="order_id" label="订单ID" required>
								<view class="flex items-center gap-2">
									<uni-easyinput v-model="formData.order_id" placeholder="自动生成或手动输入" :disabled="false" />
									<button v-if="!currentEditId" size="mini" @click="generateOrderId" class="bg-gray-100 text-gray-600 border-0">生成</button>
								</view>
							</uni-forms-item>

							<uni-forms-item name="departure_date" label="出发日期">
								<uni-datetime-picker type="timestamp" return-type="timestamp" v-model="formData.departure_date" />
							</uni-forms-item>

							<uni-forms-item name="total_days" label="总天数">
								<uni-number-box v-model="formData.total_days" :min="0" />
							</uni-forms-item>

							<uni-forms-item label="订单模板" class="mb-4">
								<view class="flex items-center gap-2">
									<uni-easyinput v-model="templateId" placeholder="输入ctripID(8位) 或 快照订单号/URL" :disabled="templateLoading" />
									<button size="mini" class="bg-blue-600 text-white border-0 px-3" @click="loadTemplate" :loading="templateLoading">
										{{ templateLoading ? '同步中' : '加载模板' }}
									</button>
								</view>
								<text class="text-xs text-gray-500 mt-1 block">输入ctripID搜索商品库，输入订单号搜索快照库；未找到时将尝试自动同步。</text>
							</uni-forms-item>

							<uni-forms-item name="title" label="标题" required>
								<uni-easyinput v-model="formData.title" type="textarea" autoHeight placeholder="请输入商品标题" />
							</uni-forms-item>

							<uni-forms-item name="sub_title" label="副标题">
								<uni-easyinput v-model="formData.sub_title" type="textarea" autoHeight placeholder="请输入商品副标题" />
							</uni-forms-item>

							<uni-forms-item name="final_amount" label="成交金额">
								<uni-easyinput type="number" v-model="formData.final_amount" placeholder="0.00" />
							</uni-forms-item>

							<uni-forms-item name="rank" label="订单等级">
								<view class="flex flex-wrap gap-3">
									<view
										v-for="opt in rankOptions"
										:key="opt.value"
										@click="formData.rank = opt.value"
										class="px-4 py-1.5 rounded-md text-sm font-bold cursor-pointer transition-all duration-200 border"
										:class="getRankClass(opt.value, formData.rank)">
										{{ opt.text }}
									</view>
								</view>
							</uni-forms-item>

							<uni-forms-item name="travel_users" label="出行用户">
								<view class="w-full">
									<view v-if="!formData.travel_users || formData.travel_users.length === 0" class="text-sm text-gray-400 mb-2">暂无出行用户</view>

									<view v-else class="w-full space-y-2 mb-3">
										<view v-for="(user, index) in formData.travel_users" :key="user.id" class="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-lg">
											<view class="flex items-center">
												<i class="fas fa-user text-emerald-600 mr-2"></i>
												<text class="text-sm text-gray-800">{{ user.mobile || '号码缺失' }}</text>
											</view>
											<button
												@click="removeTraveler(index)"
												class="px-2 py-0 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors"
												style="line-height: 1.5rem; margin: 0">
												移除
											</button>
										</view>
									</view>

									<uni-combox
										v-model="travelerSearchInput"
										:candidates="travelerCandidates"
										label-key="mobile"
										value-key="_id"
										placeholder="输入手机号搜索并添加"
										:clearOnSelect="true"
										@input="searchTravelers"
										@change="onTravelerSelect"
										@click="loadDefaultTravelers" />
								</view>
							</uni-forms-item>

							<uni-forms-item label="原始名单" class="mb-4">
								<view class="w-full">
									<view v-if="formData.raw_travelers.length === 0" class="text-sm text-gray-400 mb-2">暂无原始出行人数据</view>

									<view v-for="(traveler, index) in formData.raw_travelers" :key="index" class="mb-2 p-2 bg-gray-50 rounded border border-gray-200">
										<view class="flex gap-2 mb-2">
											<uni-easyinput v-model="traveler.name" placeholder="姓名" :inputBorder="true" class="flex-1"></uni-easyinput>
											<uni-easyinput v-model="traveler.phone" placeholder="手机" :inputBorder="true" class="flex-1"></uni-easyinput>
										</view>
										<view class="flex justify-end">
											<text @click="formData.raw_travelers.splice(index, 1)" class="text-red-600 text-xs cursor-pointer hover:underline">删除此人</text>
										</view>
									</view>

									<button size="mini" class="mt-2 bg-blue-50 text-blue-600 border border-blue-200" @click="formData.raw_travelers.push({ name: '', phone: '' })">
										+ 添加原始出行人
									</button>
								</view>
							</uni-forms-item>

							<uni-forms-item label="管家">
								<view class="w-full">
									<view v-if="currentAttendant" class="flex items-center justify-between bg-purple-50 border border-purple-100 px-3 py-2 rounded-lg mb-3">
										<view class="flex items-center">
											<i class="fas fa-user-shield text-purple-600 mr-2"></i>
											<view class="flex flex-col">
												<text class="text-sm font-semibold text-gray-800">
													{{ currentAttendant.nickname || currentAttendant.name || '未命名' }}
													<text v-if="currentAttendant.total_score !== undefined" class="text-gray-500 text-xs ml-1">({{ currentAttendant.total_score }}分)</text>
												</text>
												<text class="text-xs text-gray-500">{{ currentAttendant.mobile }}</text>
											</view>
										</view>
										<button
											@click="removeAttendant"
											class="px-2 py-0 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors"
											style="line-height: 1.5rem; margin: 0">
											移除
										</button>
									</view>
									<view v-else class="text-sm text-gray-400 mb-2">暂未分配管家</view>

									<uni-combox
										v-model="attendantSearchInput"
										:candidates="attendantCandidates"
										label-key="displayText"
										value-key="_id"
										placeholder="搜索管家(手机号/昵称)"
										:clearOnSelect="true"
										@input="searchAttendants"
										@change="onAttendantSelect"
										@click="loadDefaultAttendants" />
								</view>
							</uni-forms-item>

							<uni-forms-item label="私导">
								<view class="w-full">
									<view v-if="currentGuide" class="flex items-center justify-between bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg mb-3">
										<view class="flex items-center">
											<i class="fas fa-map-marked-alt text-blue-600 mr-2"></i>
											<view class="flex flex-col">
												<text class="text-sm font-semibold text-gray-800">
													{{ currentGuide.nickname || currentGuide.name || '未命名' }}
													<text v-if="currentGuide.total_score !== undefined" class="text-gray-500 text-xs ml-1">({{ currentGuide.total_score }}分)</text>
												</text>
												<text class="text-xs text-gray-500">{{ currentGuide.mobile }}</text>
											</view>
										</view>
										<button
											@click="removeGuide"
											class="px-2 py-0 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors"
											style="line-height: 1.5rem; margin: 0">
											移除
										</button>
									</view>
									<view v-else class="text-sm text-gray-400 mb-2">暂未分配私导</view>

									<uni-combox
										v-model="guideSearchInput"
										:candidates="guideCandidates"
										label-key="displayText"
										value-key="_id"
										placeholder="搜索私导(手机号/昵称)"
										:clearOnSelect="true"
										@input="searchGuides"
										@change="onGuideSelect"
										@click="loadDefaultGuides" />
								</view>
							</uni-forms-item>

							<uni-forms-item label="客户备注">
								<uni-easyinput type="textarea" autoHeight v-model="formData.customer_remarks" placeholder="编辑客户表备注信息" />
							</uni-forms-item>
						</uni-forms>
					</view>
				</scroll-view>

				<view class="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
					<view class="flex justify-end space-x-4">
						<button @click="closeEditDialog" class="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors">取消</button>
						<button @click="submitEditForm" class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center">
							<i class="fas fa-check mr-2"></i>
							保存
						</button>
					</view>
				</view>
			</view>
		</uni-popup>

		<uni-popup ref="qrPopup" type="center" :mask-click="false">
			<view
				class="bg-white rounded-xl shadow-2xl p-6 flex flex-col transition-all duration-300 relative max-w-[95vw]"
				:class="inviteStep === 'supply' ? 'w-[850px] h-[650px]' : 'w-[480px] h-auto'">
				<view class="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-gray-600 z-10" @click="closeQrPopup">
					<i class="fas fa-times text-lg"></i>
				</view>

				<view v-if="inviteStep === 'supply'" class="flex flex-col h-full w-full">
					<view class="text-xl font-bold text-gray-800 mb-4 flex items-center shrink-0">
						<i class="fas fa-box-open text-orange-500 mr-2"></i>
						确认行程物资
					</view>

					<scroll-view scroll-y class="flex-1 min-h-0 mb-4 border rounded-lg p-2 bg-gray-50/50">
						<table class="w-full text-sm">
							<thead class="bg-gray-100 sticky top-0 z-10">
								<tr>
									<th class="p-2 text-left text-gray-600">类别</th>
									<th class="p-2 text-left text-gray-600">名称</th>
									<th class="p-2 w-52 text-center text-gray-600">数量</th>
									<th class="p-2 w-16 text-center text-gray-600">操作</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="(item, index) in selectionList" :key="index">
									<td>
										<uni-data-select
											v-model="item.type"
											:localdata="[
												{ text: '服务', value: 'service' },
												{ text: '物资', value: 'supply' }
											]"
											:clear="false"
											@change="onTypeChange($event, index)"></uni-data-select>
									</td>
									<td>
										<custom-picker
											v-if="item.type === 'service'"
											:direction="selectionList.length > 6 && index >= selectionList.length - 3 ? 'top' : 'bottom'"
											:options="serviceOptions"
											:value="getPickerValue('service', item.id)"
											label-key="name"
											value-key="_id"
											placeholder="请选择服务"
											@change="(val) => handleCustomPickerChange(val, index)" />
										<custom-picker
											v-else
											:direction="selectionList.length > 6 && index >= selectionList.length - 3 ? 'top' : 'bottom'"
											:options="supplyOptions"
											:value="getPickerValue('supply', item.id)"
											label-key="name"
											value-key="_id"
											placeholder="请选择物资"
											@change="(val) => handleCustomPickerChange(val, index)" />
									</td>
									<td class="p-2">
										<view class="flex flex-col items-center justify-center">
											<view class="h-9 flex items-center justify-center">
												<text v-if="item.is_on_demand" class="text-gray-400 text-sm">-- 按需 --</text>
												<uni-number-box v-else v-model="item.quantity" :min="1" />
											</view>
										</view>
									</td>
									<td class="p-2 text-center align-middle">
										<view class="flex justify-center items-center h-full">
											<i class="fas fa-trash text-red-400 hover:text-red-600 cursor-pointer p-2" @click="selectionList.splice(index, 1)"></i>
										</view>
									</td>
								</tr>
							</tbody>
						</table>

						<view class="p-2">
							<button
								class="w-full py-2 border-dashed border-2 border-gray-300 text-gray-500 text-sm rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center"
								@click="addSupplyItem">
								<i class="fas fa-plus mr-1"></i>
								添加物资
							</button>
						</view>
					</scroll-view>

					<view class="flex gap-4 shrink-0 mt-auto pt-2">
						<button
							v-if="supplyFormData._id"
							class="flex-none px-4 bg-red-50 text-red-600 border border-red-100 py-2.5 rounded-lg text-sm hover:bg-red-100 transition-colors flex items-center justify-center"
							@click="deleteSupplyConfig">
							<i class="fas fa-trash-alt mr-1"></i>
							删除配置
						</button>
						<button class="flex-1.5 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-200 transition-colors" @click="closeQrPopup">
							<i class="fas fa-times mr-2"></i>
							取消
						</button>
						<button
							class="flex-1.5 bg-emerald-600 text-white py-2.5 rounded-lg text-sm shadow-md hover:bg-emerald-700 transition-colors flex items-center justify-center"
							:loading="supplySaving"
							@click="saveSupply">
							<i class="fas fa-save mr-2"></i>
							确认保存
						</button>
					</view>
				</view>

				<view v-if="inviteStep === 'qrcode'" class="flex flex-col items-center animate-fade-in py-4">
					<view class="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-gray-600" @click="closeQrPopup">
						<i class="fas fa-times text-lg"></i>
					</view>
					<view class="text-2xl font-bold text-gray-800 mb-2">扫码加入行程</view>
					<view class="text-md text-gray-600 mb-6 text-center">
						行程同步电子讲解
						<br />
						获得旅行精彩相册
					</view>

					<view v-if="qrLoading" class="w-48 h-48 flex items-center justify-center bg-gray-50 rounded-lg mb-6">
						<i class="fas fa-spinner fa-spin text-emerald-500 text-2xl"></i>
					</view>

					<image v-else-if="qrCodeBase64" :src="qrCodeBase64" class="w-48 h-48 mb-6 rounded-lg shadow-sm border border-gray-100" mode="aspectFit"></image>

					<view v-else class="w-48 h-48 flex items-center justify-center bg-gray-50 rounded-lg mb-6 text-gray-400 text-sm">获取失败</view>

					<view class="flex w-full space-x-3">
						<button class="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors" @click="closeQrPopup">关闭</button>
						<a
							v-if="qrCodeBase64"
							:href="qrCodeBase64"
							:download="currentQrFileName"
							class="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center decoration-none">
							<i class="fas fa-download mr-1"></i>
							下载
						</a>
					</view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
import { toRaw } from 'vue';
import CustomPicker from '../../../components/custom-picker/custom-picker.vue';
const db = uniCloud.database();
const dbOrderBy = 'departure_date desc';
const dbSearchFields = ['order_id', 'title', 'sub_title', 'travel_users.name', 'travel_users.nickname'];
const pageSize = 15;
const pageCurrent = 1;
const orderService = uniCloud.importObject('a-order-service');
const qrcodeService = uniCloud.importObject('qrcode-service');
const operationCenter = uniCloud.importObject('a-operation-center');
const rpa = uniCloud.importObject('a-task-rpa');
const attendantNotifier = uniCloud.importObject('attendant-notifier');

const orderByMapping = {
	ascending: 'asc',
	descending: 'desc'
};

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default {
	components: {
		CustomPicker // 注册组件
	},
	data() {
		return {
			collectionList: 'a-snapshots',
			listData: [],
			query: '',
			filterDateRange: [],
			filterAttendantId: '', // 当前选中的管家ID
			attendantFilterOptions: [], // 管家下拉选项列表
			where: '',
			orderby: 'departure_date desc',
			orderByFieldName: 'departure_date',
			currentSortOrder: 'desc',
			selectedIndexs: [],
			originalItem: null,
			options: {
				pageSize,
				pageCurrentoriginalItem: null
			},

			sourceCustomerId: null,
			currentEditId: null,
			rankOptions: [
				{ value: 'A', text: 'A级' },
				{ value: 'B', text: 'B级' },
				{ value: 'C', text: 'C级' },
				{ value: 'D', text: 'D级' }
			],
			formData: {
				order_id: '',
				rank: 'D',
				title: '',
				sub_title: '',
				final_amount: null,
				travel_users: [],
				staves: [],
				departure_date: null,
				total_days: 0,
				itinerary: null,
				ctrip_id: '',
				product_id: '',
				snapshot_id: '',
				raw_travelers: [],
				customer_remarks: ''
			},

			serviceOptions: [],
			supplyOptions: [],

			travelerSearchInput: '',
			travelerCandidates: [],
			searchTimer: null,

			// 分离的搜索状态
			attendantSearchInput: '',
			attendantCandidates: [],
			attendantSearchTimer: null,

			guideSearchInput: '',
			guideCandidates: [],
			guideSearchTimer: null,

			dialogReady: false,
			formRules: {
				title: {
					rules: [
						{
							required: true,
							errorMessage: '标题不能为空'
						}
					]
				}
			},

			qrCodeBase64: '',
			qrLoading: false,
			currentQrFileName: 'invite_code.png',
			isFirstLoad: true,
			pendingId: '',

			tempSource: '',
			sourceOptions: [
				{ value: '复购', text: '复购' },
				{ value: '转介绍', text: '转介绍' },
				{ value: '抖音', text: '抖音' },
				{ value: '小红书', text: '小红书' },
				{ value: '飞猪', text: '飞猪' },
				{ value: '携程定制', text: '携程定制' },
				{ value: '携程私家团', text: '携程私家团' },
				{ value: '小程序', text: '小程序' }
			],

			currentTravelerCount: 1,
			inviteStep: 'supply', // supply 或 qrcode
			supplySaving: false,
			currentItem: null,
			supplyFormData: {
				_id: null,
				order_id: '',
				status: 'created',
				supplies: []
			},
			serviceMap: {}, // 格式: { serviceId: serviceDetailObj }
			supplyMap: {}, // 格式: { supplyId: supplyDetailObj }
			allSuppliesMap: {}, // 全量物资Map
			selectionList: [],
			templateId: '',
			templateLoading: false,
			hasTaskOrder: false,
			hasCustomerRecord: false
		};
	},
	computed: {
		// 辅助计算属性：从 staves 数组中提取当前管家
		currentAttendant() {
			return this.formData.staves.find((s) => s.role === 'attendant' || (Array.isArray(s.role) && s.role.includes('attendant')));
		},
		// 辅助计算属性：从 staves 数组中提取当前私导
		currentGuide() {
			return this.formData.staves.find((s) => s.role === 'guide' || (Array.isArray(s.role) && s.role.includes('guide')));
		}
	},
	mounted() {
		this.$refs.udb.loadData();
		this.fetchAllSupplies();
		this.fetchAttendantOptions();
	},
	onLoad(options) {
		if (options && options.action === 'create') {
			setTimeout(() => {
				this.openCreateDialog(options);
			}, 500);
		}
	},
	methods: {
		autoSearchById(id) {
			if (!id) return;
			console.log('收到定位请求:', id);
			if (this.isFirstLoad) {
				this.pendingId = id;
			} else {
				this.doAutoSearch(id);
			}
		},
		doAutoSearch(id) {
			this.query = id;
			this.where = this.getWhere();
			this.$nextTick(() => {
				this.$refs.udb.loadData({ current: 1 });
				uni.showToast({ title: '已定位到订单', icon: 'none' });
			});
		},
		copyToClipboard(text) {
			if (!text) return;
			// #ifdef H5
			if (navigator.clipboard) {
				navigator.clipboard.writeText(text).then(() => {
					uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
				});
			} else {
				this.fallbackCopyToClipboard(text);
			}
			// #endif
			// #ifndef H5
			uni.setClipboardData({
				data: text,
				success: () => {
					uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
				}
			});
			// #endif
		},
		fallbackCopyToClipboard(text) {
			const textArea = document.createElement('textarea');
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand('copy');
				uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
			} catch (err) {
				uni.showToast({ title: '复制失败', icon: 'none' });
			}
			document.body.removeChild(textArea);
		},
		async onqueryload(data) {
			this.isFirstLoad = false;
			let tempList = JSON.parse(JSON.stringify(data));

			const orderIds = tempList.map((item) => item.order_id);
			if (orderIds.length > 0) {
				try {
					const tasksRes = await db
						.collection('a-task-orders')
						.where({
							order_id: db.command.in(orderIds)
						})
						.field('order_id, raw_data') // 只取需要的字段
						.get();

					// 建立映射：order_id -> final_amount
					const taskAmountMap = {};
					if (tasksRes.result.data) {
						tasksRes.result.data.forEach((t) => {
							try {
								if (Array.isArray(t.raw_data) && t.raw_data.length > 0 && t.raw_data[0].order_context) {
									const context = t.raw_data[0].order_context;

									taskAmountMap[t.order_id] = {
										amount: context.total_amount,
										rawTravelers: context.travelers || []
									};
								}
							} catch (err) {
								console.error('解析订单数据失败:', t.order_id, err);
							}
						});
					}

					// 将金额合并到当前列表中
					tempList.forEach((item) => {
						if (taskAmountMap[item.order_id]) {
							item.final_amount = taskAmountMap[item.order_id].amount;
							item._rawTravelers = taskAmountMap[item.order_id].rawTravelers;
						} else {
							item._rawTravelers = item.travelers || [];
						}
					});

					const supplyRes = await db
						.collection('a-order-supplies')
						.where({ order_id: db.command.in(orderIds) })
						.field('order_id, user_id')
						.get();

					const supplyMap = {};
					supplyRes.result.data.forEach((s) => {
						supplyMap[s.order_id] = s;
					});

					const customerRes = await db
						.collection('a-customers')
						.where({ order_id: db.command.in(orderIds) })
						.field('order_id, remarks')
						.get();
					const remarkMap = {};
					customerRes.result.data.forEach((c) => {
						// 如果有备注才存入
						if (c.remarks) remarkMap[c.order_id] = c.remarks;
					});

					tempList.forEach((item) => {
						const supply = supplyMap[item.order_id];
						// 状态判定：不存在或user_id为system_auto视为未人工处理
						if (!supply || supply.user_id === 'system_auto') {
							item._supplyStatus = 'auto'; // 待确认/系统生成
						} else {
							item._supplyStatus = 'manual'; // 已人工确认
						}

						item.customer_remarks = remarkMap[item.order_id] || item.remarks || '';
					});
				} catch (e) {
					console.error('查询物资状态失败', e);
				}
			}

			const userIds = new Set();
			tempList.forEach((item) => {
				if (item.staves && Array.isArray(item.staves)) {
					item.staves.forEach((staff) => {
						if (staff.id) userIds.add(staff.id);
					});
				}

				if (item.travel_users && Array.isArray(item.travel_users)) {
					item.travel_users.forEach((user) => {
						if (user.id) userIds.add(user.id);
					});
				}
			});

			if (userIds.size > 0) {
				try {
					const res = await db
						.collection('uni-id-users')
						.where({ _id: db.command.in(Array.from(userIds)) })
						.field('_id, nickname')
						.get();
					if (res.result.data) {
						const nicknameMap = {};
						res.result.data.forEach((u) => {
							nicknameMap[u._id] = u.nickname;
						});
						tempList.forEach((item) => {
							if (item.staves && Array.isArray(item.staves)) {
								item.staves.forEach((staff) => {
									if (staff.id && nicknameMap[staff.id]) {
										staff.nickname = nicknameMap[staff.id];
									}
								});
							}

							if (item.travel_users && Array.isArray(item.travel_users)) {
								item.travel_users.forEach((user) => {
									if (user.id && nicknameMap[user.id]) {
										user.nickname = nicknameMap[user.id];
									}
								});
							}
						});
					}
				} catch (e) {
					console.error('查询用户昵称失败:', e);
				}
			}
			this.listData = tempList;
			if (this.pendingId) {
				const id = this.pendingId;
				this.pendingId = '';
				this.doAutoSearch(id);
			}
		},
		getWhere() {
			let whereString = '';
			const query = this.query.trim();
			if (query) {
				const searchConditions = dbSearchFields.map((field) => `/${query}/i.test(${field})`);
				whereString = `(${searchConditions.join(' || ')})`;
			}
			if (this.filterDateRange && this.filterDateRange.length > 0) {
				// uni-datetime-picker 返回的是 ['YYYY-MM-DD', 'YYYY-MM-DD']
				// 转换开始时间为当天的 00:00:00
				const startTimestamp = new Date(this.filterDateRange[0] + ' 00:00:00').getTime();
				// 转换结束时间为当天的 23:59:59.999
				const endTimestamp = new Date(this.filterDateRange[1] + ' 23:59:59').getTime();

				const dateCondition = `departure_date >= ${startTimestamp} && departure_date <= ${endTimestamp}`;

				if (whereString) {
					whereString = `${whereString} && ${dateCondition}`;
				} else {
					whereString = dateCondition;
				}
			}
			return whereString;
		},
		onDateRangeChange(e) {
			this.filterDateRange = e;
			this.search();
		},

		async fetchAttendantOptions() {
			try {
				// 查询 uni-id-users 表中角色包含 attendant 的用户
				const res = await db
					.collection('uni-id-users')
					.where({ role: 'attendant' })
					.field('_id, nickname, username, mobile')
					.limit(100) // 根据实际情况调整限制
					.get();

				if (res.result.data) {
					this.attendantFilterOptions = res.result.data.map((u) => ({
						value: u._id,
						text: u.nickname || u.username || u.mobile || '未命名管家'
					}));
				}
			} catch (e) {
				console.error('加载管家列表失败', e);
			}
		},

		async fetchRelatedIds(keyword) {
			if (!keyword) return { userIds: [], orderIds: [] };

			const db = uniCloud.database();
			const regExp = new RegExp(escapeRegExp(keyword), 'i'); // 模糊匹配正则

			// 1. 查 uni-id-users (覆盖 travel_users 的关联昵称 和 staves 中管家的昵称)
			const p1 = db.collection('uni-id-users').where({ nickname: regExp }).field('_id').get();

			// 2. 查 b-guide-profiles (覆盖 staves 中向导的真实姓名)
			const p2 = db.collection('b-guide-profiles').where({ real_name: regExp }).field('user_id').get();

			// 3. 查 a-task-orders (覆盖原始订单 raw_data 中的游客姓名)
			// 注意：这里利用点分符号查询嵌套数组
			const p3 = db
				.collection('a-task-orders')
				.where({
					'raw_data.0.order_context.travelers.name': regExp
				})
				.field('order_id')
				.get();

			try {
				const [uRes, gRes, tRes] = await Promise.all([p1, p2, p3]);

				const userIds = new Set();
				const orderIds = new Set();

				// 收集 uni-id-users 的 ID
				if (uRes.result.data) uRes.result.data.forEach((item) => userIds.add(item._id));

				// 收集 guide profiles 的 user_id
				if (gRes.result.data) gRes.result.data.forEach((item) => userIds.add(item.user_id));

				// 收集 task orders 的 order_id
				if (tRes.result.data) tRes.result.data.forEach((item) => orderIds.add(item.order_id));

				return {
					userIds: Array.from(userIds),
					orderIds: Array.from(orderIds)
				};
			} catch (e) {
				console.error('关联搜索失败', e);
				return { userIds: [], orderIds: [] };
			}
		},

		escapeRegExp(string) {
			return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		},

		async search() {
			uni.showLoading({ title: '搜索中...' });

			// 1. 获取文本搜索关联的 ID 列表 (保持原逻辑)
			const query = this.query ? this.query.trim() : '';
			const { userIds, orderIds } = await this.fetchRelatedIds(query);

			const db = uniCloud.database();
			const dbCmd = db.command;

			// === 核心修改：建立一个总的条件数组，所有条件都 push 进去 ===
			let andConditions = [];

			// 2. 处理文本搜索 (如果有) -> 作为一个整体条件放入数组
			if (query) {
				const safeQuery = escapeRegExp(query);
				const regExp = new RegExp(safeQuery, 'i');

				// 文本搜索内部是 OR 关系 (匹配标题 或 ID 或 人名...)
				const orConditions = [{ order_id: regExp }, { title: regExp }, { sub_title: regExp }, { 'travel_users.name': regExp }, { 'travel_users.nickname': regExp }];

				// 关联ID查询
				if (userIds.length > 0) {
					orConditions.push({ 'staves.id': dbCmd.in(userIds) });
					orConditions.push({ 'travel_users.id': dbCmd.in(userIds) });
				}
				if (orderIds.length > 0) {
					orConditions.push({ order_id: dbCmd.in(orderIds) });
				}

				// 【关键】将整个文本搜索的 OR 逻辑作为一个单项，加入到总的 AND 数组中
				andConditions.push(dbCmd.or(orConditions));
			}

			// 3. 处理日期筛选 (如果有) -> 加入数组
			if (this.filterDateRange && this.filterDateRange.length > 0) {
				const startTimestamp = new Date(this.filterDateRange[0] + ' 00:00:00').getTime();
				const endTimestamp = new Date(this.filterDateRange[1] + ' 23:59:59').getTime();

				andConditions.push({
					departure_date: dbCmd.and([dbCmd.gte(startTimestamp), dbCmd.lte(endTimestamp)])
				});
			}

			// 4. 处理管家筛选 (如果有) -> 加入数组
			if (this.filterAttendantId) {
				andConditions.push({
					'staves.id': this.filterAttendantId
				});
			}

			// 5. 组合最终条件
			let finalWhere = '';

			if (andConditions.length > 1) {
				// 如果有多个条件 (例如：既有关键词，又有日期)，使用 and 连接
				finalWhere = dbCmd.and(andConditions);
			} else if (andConditions.length === 1) {
				// 只有一个条件，直接使用
				finalWhere = andConditions[0];
			}
			// 如果数组为空，finalWhere 为空字符串，即查询所有

			this.where = finalWhere;

			this.$nextTick(() => {
				// 只有当没有任何筛选条件时，重置为空字符串以确保加载全部数据
				if (andConditions.length === 0) {
					this.where = '';
				}
				this.loadData();
				uni.hideLoading();
			});
		},

		clearSearch() {
			this.query = '';
			this.search();
		},
		loadData(clear = true) {
			this.$refs.udb.loadData({ clear });
		},
		onPageChanged(e) {
			this.$refs.udb.loadData({ current: e.current });
		},
		onTypeChange(val, index) {
			this.selectionList[index].id = '';
			this.selectionList[index].quantity = 1;
		},
		confirmDelete(id) {
			this.$refs.udb.remove(id, {
				success: (res) => {
					uni.showToast({ title: '删除成功', icon: 'success' });
				}
			});
		},
		sortChange(e, name) {
			this.orderByFieldName = name;
			if (e.order) {
				this.orderby = name + ' ' + orderByMapping[e.order];
			} else {
				this.orderby = dbOrderBy;
			}
			this.$nextTick(() => {
				this.$refs.udb.loadData();
			});
		},
		/**
		 * 处理排序点击
		 * @param {String} field 数据库字段名
		 */
		handleSort(field) {
			// 如果点击的是当前正在排序的字段，则切换方向
			if (this.orderByFieldName === field) {
				this.currentSortOrder = this.currentSortOrder === 'asc' ? 'desc' : 'asc';
			} else {
				// 如果点击的是新字段，默认重置为升序（或者你喜欢的默认方向）
				this.orderByFieldName = field;
				this.currentSortOrder = 'asc';
			}

			// 拼接 uniCloud 排序字符串
			this.orderby = `${this.orderByFieldName} ${this.currentSortOrder}`;

			// 刷新列表
			this.$nextTick(() => {
				this.$refs.udb.loadData();
			});
		},
		/**
		 * 获取排序图标的样式类名
		 * @param {String} field 字段名
		 */
		getSortIcon(field) {
			// 如果不是当前排序字段，显示默认灰色双向箭头
			if (this.orderByFieldName !== field) {
				return 'fa-sort text-gray-400';
			}
			// 如果是当前字段，根据方向显示高亮箭头
			return this.currentSortOrder === 'asc' ? 'fa-sort-up text-emerald-600' : 'fa-sort-down text-emerald-600';
		},

		// 从字符串中提取真实手机号
		extractMobile(str) {
			if (!str) return '';
			// 匹配规则：查找包含 (真实号码+86...) 格式或直接是 11 位数字
			// 针对例子：02180276688转389891982(真实号码+8613922273750)
			const match = str.match(/真实号码\+86(\d{11})/);
			if (match && match[1]) return match[1];

			// 备用：如果只是纯手机号或简单格式
			const simpleMatch = str.match(/1\d{10}/);
			return simpleMatch ? simpleMatch[0] : '';
		},

		// 合并 A组(registered) 和 B组(raw) 并生成显示数据
		getDisplayTravelers(item) {
			const groupA = item.travel_users || []; // A组：已注册用户 (有 mobile, id)
			const groupB = item._rawTravelers || []; // B组：原始数据 (有 name, phone)

			const displayList = [];
			const matchedMobilesInA = new Set(); // 记录A组中已被匹配的手机号

			// 1. 遍历 B 组 (raw data)
			groupB.forEach((bUser) => {
				const realMobile = this.extractMobile(bUser.phone);
				const matchedAUser = groupA.find((a) => a.mobile === realMobile);

				if (matchedAUser) {
					// 情况1: 能对应上 (B match A)
					matchedMobilesInA.add(matchedAUser.mobile);

					let displayText = bUser.name;
					if (matchedAUser.nickname) {
						displayText += ` (${matchedAUser.nickname})`;
					}

					displayList.push({
						text: displayText,
						isRegistered: true,
						key: 'match_' + realMobile
					});
				} else {
					// 情况2: 对应不上 (B only)
					displayList.push({
						text: bUser.name, // 显示 B组 name
						isRegistered: false, // 不显示标签
						key: 'raw_' + bUser.name
					});
				}
			});

			// 2. 遍历 A 组，找出剩余未被匹配的 (A only)
			groupA.forEach((aUser) => {
				if (!matchedMobilesInA.has(aUser.mobile)) {
					// 情况3: 剩余的A组
					let displayText = aUser.mobile;
					if (aUser.nickname) {
						displayText = `${aUser.nickname} (${aUser.mobile})`;
					}

					displayList.push({
						text: displayText,
						isRegistered: true,
						key: 'reg_' + aUser.id
					});
				}
			});

			return displayList;
		},

		// 跳转到详细编辑页
		navigateToDetailEdit(item) {
			uni.navigateTo({
				url: `/pages/a-products-orders/edit?id=${item._id}&type=snapshot`,
				events: {
					refreshData: () => {
						this.loadData(false);
					}
				}
			});
		},

		openCreateDialog(arg) {
			this.dialogReady = false;
			this.currentEditId = null;
			let initData = {
				source: '',
				title: '',
				final_amount: null,
				departure_date: Date.now(),
				total_days: 1,
				customerId: null
			};
			if (arg && typeof arg === 'object' && arg.action === 'create') {
				initData.source = arg.source || '';
				initData.title = arg.product_title ? decodeURIComponent(arg.product_title) : '';
				initData.final_amount = arg.final_amount || null;
				initData.departure_date = arg.departure_date ? Number(arg.departure_date) : Date.now();
				initData.total_days = arg.total_days ? Number(arg.total_days) : 1;
				initData.customerId = arg.customerId || null;
			} else if (typeof arg === 'string') {
				initData.source = arg;
			}
			this.sourceCustomerId = initData.customerId;
			this.tempSource = initData.source;
			this.hasCustomerRecord = false;
			this.formData = {
				order_id: '',
				rank: 'D',
				title: initData.title,
				sub_title: '',
				final_amount: initData.final_amount,
				travel_users: [],
				staves: [],
				departure_date: initData.departure_date,
				total_days: initData.total_days,
				itinerary: null,
				ctrip_id: '',
				product_id: '',
				snapshot_id: ''
			};

			this.generateOrderId();

			// 重置所有搜索框
			this.resetAllSearchInputs();
			this.$refs.editPopup.open();
		},

		async openEditDialog(item) {
			this.dialogReady = false;
			this.currentEditId = item._id;
			this.originalItem = JSON.parse(JSON.stringify(item));
			this.tempSource = '';
			this.formData.order_id = item.order_id;
			this.templateId = '';
			this.formData.rank = item.rank || 'D';
			this.formData.title = item.title;
			this.formData.sub_title = item.sub_title;
			this.formData.final_amount = item.final_amount;
			this.formData.departure_date = item.departure_date;
			this.formData.total_days = item.total_days;
			this.formData.ctrip_id = item.ctrip_id || '';
			this.formData.product_id = item.product_id || '';
			this.formData.snapshot_id = item.snapshot_id || '';
			this.formData.travel_users = item.travel_users ? JSON.parse(JSON.stringify(item.travel_users)) : [];
			this.formData.staves = item.staves ? JSON.parse(JSON.stringify(item.staves)) : [];
			this.formData.raw_travelers = item.travelers ? JSON.parse(JSON.stringify(item.travelers)) : [];
			this.formData.customer_remarks = '';
			this.hasTaskOrder = false;
			this.hasCustomerRecord = false;

			if (item.order_id) {
				uni.showLoading({ title: '加载扩展信息...' });
				try {
					// 1. 获取客户备注 (a-customers)
					const customerRes = await db.collection('a-customers').where({ order_id: item.order_id }).field('remarks').get();
					if (customerRes.result && customerRes.result.data && customerRes.result.data.length > 0) {
						this.formData.customer_remarks = customerRes.result.data[0].remarks || '';
						this.hasCustomerRecord = true;
					} else {
						this.formData.customer_remarks = item.remarks || '';
						this.hasCustomerRecord = false;
					}

					// 2. 获取原始出行人 (a-task-orders)
					const taskRes = await db.collection('a-task-orders').where({ order_id: item.order_id }).field('raw_data').get();

					if (taskRes.result && taskRes.result.data && taskRes.result.data.length > 0) {
						this.hasTaskOrder = true;
						const task = taskRes.result.data[0];
						// 安全获取嵌套路径数据
						if (task.raw_data && task.raw_data[0] && task.raw_data[0].order_context && Array.isArray(task.raw_data[0].order_context.travelers)) {
							// 深拷贝以避免引用问题
							this.formData.raw_travelers = JSON.parse(JSON.stringify(task.raw_data[0].order_context.travelers));
						}
					}
				} catch (e) {
					console.error('加载扩展信息失败', e);
				} finally {
					uni.hideLoading();
				}
			}

			this.resetAllSearchInputs();
			this.$refs.editPopup.open();
		},

		closeEditDialog() {
			this.$refs.editPopup.close();
			this.currentEditId = null;
			this.templateId = '';
			this.resetAllSearchInputs();
			this.formData = {
				order_id: '',
				title: '',
				sub_title: '',
				travel_users: [],
				staves: [],
				departure_date: null,
				total_days: 0,
				itinerary: null,
				ctrip_id: '',
				product_id: '',
				snapshot_id: ''
			};
			if (this.$refs.editForm) {
				this.$refs.editForm.clearValidate();
			}
		},

		async loadTemplate() {
			const inputId = this.templateId ? this.templateId.trim() : '';
			if (!inputId) return uni.showToast({ title: '请输入模板ID', icon: 'none' });

			this.templateLoading = true;
			const _this = this;

			try {
				// === 逻辑分支 1: Ctrip ID (8位数字) ===
				if (/^\d{8}$/.test(inputId)) {
					console.log('检测为 ctrip Product ID');

					// 定义加载产品数据的函数
					const loadProductData = async () => {
						// 注意：行程数据在 a-itineraries 表中，通过 ctrip_id 关联
						const res = await db.collection('a-itineraries').where({ ctrip_id: inputId }).get();
						if (res.result.data && res.result.data.length > 0) {
							const template = res.result.data[0];
							// 复制数据到表单，保留本订单的 order_id 等关键信息
							_this.formData.title = template.title || _this.formData.title;
							_this.formData.sub_title = template.sub_title || _this.formData.sub_title;
							_this.formData.total_days = template.total_days || 1;
							_this.formData.itinerary = template.itinerary || [];
							_this.formData.ctrip_id = template.ctrip_id || '';
							_this.formData.product_id = template.product_id || '';
							_this.formData.snapshot_id = ''; // 商品模板没有 snapshot_id

							uni.showToast({ title: '产品模板加载成功', icon: 'success' });
							return true;
						}
						return false;
					};

					// 先尝试本地查找
					let found = await loadProductData();

					// 如果没找到，调用云函数同步
					if (!found) {
						uni.showLoading({ title: '本地未找到，正在云端同步...' });

						const syncRes = await uniCloud.callFunction({
							name: 'ctrip-sync-service',
							data: {
								action: 'syncFullProduct',
								productId: inputId,
								uniIdToken: uni.getStorageSync('uni_id_token')
							},
							timeout: 360000
						});

						uni.hideLoading();

						if (syncRes.errCode === 0) {
							// 同步成功后，再次读取数据库
							found = await loadProductData();
							if (!found) throw new Error('同步成功但读取数据失败');
						} else {
							throw new Error(syncRes.errMsg || '同步产品失败');
						}
					}

					// === 逻辑分支 2: 订单号 (>8位) ===
				} else {
					console.log('检测为订单快照 ID/URL');

					// 定义加载快照数据的函数
					const loadSnapshotData = async (searchId) => {
						// 直接查 a-snapshots
						const res = await db.collection('a-snapshots').where({ order_id: searchId }).get();
						if (res.result.data && res.result.data.length > 0) {
							const template = res.result.data[0];
							// 复制数据，保留本订单的 order_id
							_this.formData.title = template.title || _this.formData.title;
							_this.formData.sub_title = template.sub_title || _this.formData.sub_title;
							_this.formData.total_days = template.total_days || 1;
							_this.formData.itinerary = template.itinerary || [];
							_this.formData.ctrip_id = template.ctrip_id || '';
							_this.formData.product_id = template.product_id || '';
							_this.formData.snapshot_id = template.snapshot_id || '';

							uni.showToast({ title: '快照模板加载成功', icon: 'success' });
							return true;
						}
						return false;
					};

					// 先尝试本地查找
					let found = await loadSnapshotData(inputId);

					// 如果没找到，调用 syncSnapshot
					if (!found) {
						if (!inputId.includes('http')) {
							uni.showModal({
								title: '本地未找到快照',
								content: '未找到该订单号的本地快照。\n\n如需从携程同步，请输入完整的快照URL链接（以http开头），而不仅仅是订单号。',
								showCancel: false
							});
							this.templateLoading = false;
							return;
						}

						// 这里按需求尝试调用 syncSnapshot
						uni.showLoading({ title: '本地未找到，尝试同步快照...' });

						// 1. 获取用户输入的日期，如果为空则使用当前日期
						let dateTs = _this.formData.departure_date || Date.now();
						const d = new Date(dateTs);
						const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

						const syncRes = await uniCloud.callFunction({
							name: 'ctrip-sync-service',
							data: {
								action: 'syncSnapshot',
								snapshot_url: inputId,
								departure_date: dateStr,
								uniIdToken: uni.getStorageSync('uni_id_token')
							},
							timeout: 360000
						});

						uni.hideLoading();

						if (syncRes.result && syncRes.result.errCode === 0 && syncRes.result.data) {
							const syncedData = syncRes.result.data;

							// 2. 填充表单数据
							_this.formData.title = syncedData.title || _this.formData.title;
							_this.formData.sub_title = syncedData.sub_title || _this.formData.sub_title;
							_this.formData.total_days = syncedData.total_days || 1;
							_this.formData.itinerary = syncedData.itinerary || [];
							_this.formData.ctrip_id = syncedData.ctrip_id || '';
							_this.formData.product_id = syncedData.product_id || '';
							_this.formData.snapshot_id = syncedData.snapshot_id || '';

							// 3. 删除刚刚同步生成的临时快照记录
							let syncedOrderId = '';
							const match = inputId.match(/orderId=(\d+)/);
							if (match && match[1]) {
								syncedOrderId = match[1];
							} else if (/^\d+$/.test(inputId)) {
								syncedOrderId = inputId; // 如果输入纯数字ID且同步成功了
							}

							if (syncedOrderId) {
								console.log('清理临时同步的快照记录:', syncedOrderId);
								// 静默删除，不等待结果，确保用户体验流畅
								db.collection('a-snapshots').where({ order_id: syncedOrderId }).remove();
							}

							uni.showToast({ title: '同步并加载成功', icon: 'success' });
						} else {
							throw new Error(syncRes.errMsg || '同步快照失败，请确认输入的是有效的快照URL或已存在的订单号');
						}
					}
				}
			} catch (e) {
				console.error(e);
				if (e.message !== '同步操作取消') {
					uni.showModal({
						title: '加载失败',
						content: e.message || '未知错误',
						showCancel: false
					});
				}
			} finally {
				this.templateLoading = false;
			}
		},

		resetAllSearchInputs() {
			this.travelerSearchInput = '';
			this.travelerCandidates = [];
			if (this.searchTimer) clearTimeout(this.searchTimer);

			this.attendantSearchInput = '';
			this.attendantCandidates = [];
			if (this.attendantSearchTimer) clearTimeout(this.attendantSearchTimer);

			this.guideSearchInput = '';
			this.guideCandidates = [];
			if (this.guideSearchTimer) clearTimeout(this.guideSearchTimer);
		},

		async generateOrderId() {
			const prefix = 'FM';

			const now = new Date();
			const dateStr = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0');

			const basePrefix = `${prefix}${dateStr}`;

			uni.showLoading({ title: '生成订单ID中...' });
			try {
				// 查找当天最大的ID
				const res = await db
					.collection('a-snapshots')
					.where({
						order_id: new RegExp(`^${basePrefix}`)
					})
					.orderBy('order_id', 'desc')
					.limit(1)
					.field('order_id')
					.get();

				let sequence = 1;
				if (res.result.data && res.result.data.length > 0) {
					const lastId = res.result.data[0].order_id;
					// 截取最后4位
					if (lastId && lastId.length > 4) {
						const lastSeqStr = lastId.slice(-4);
						const lastSeqNum = parseInt(lastSeqStr, 10);
						if (!isNaN(lastSeqNum)) {
							sequence = lastSeqNum + 1;
						}
					}
				}

				// 格式化为4位，不足补0
				this.formData.order_id = `${basePrefix}${sequence.toString().padStart(4, '0')}`;
			} catch (e) {
				console.error('订单ID生成失败', e);
				// 降级：如果查询失败，使用随机数兜底
				const random = Math.floor(Math.random() * 9000 + 1000).toString();
				this.formData.order_id = `${basePrefix}${random}`;
			} finally {
				uni.hideLoading();
			}
		},

		submitEditForm() {
			this.$refs.editForm
				.validate()
				.then((res) => {
					this.saveData(this.formData);
				})
				.catch((err) => {
					console.log('表单错误信息：', err);
					uni.showToast({ title: '请检查表单信息', icon: 'none' });
				});
		},

		// 用于获取等级按钮的样式
		getRankClass(rankValue, currentRank) {
			const isSelected = rankValue === currentRank;

			// 选中状态：使用深色背景 + 白色文字
			if (isSelected) {
				switch (rankValue) {
					case 'A':
						return 'bg-orange-500 text-white border-orange-600 shadow-md';
					case 'B':
						return 'bg-purple-500 text-white border-purple-600 shadow-md';
					case 'C':
						return 'bg-blue-500 text-white border-blue-600 shadow-md';
					default:
						return 'bg-gray-500 text-white border-gray-600 shadow-md'; // D级或其他
				}
			}

			// 未选中状态：使用浅色背景 + 深色文字 (保持和列表页一致的视觉提示) + 透明边框
			switch (rankValue) {
				case 'A':
					return 'bg-orange-50 text-orange-600 border-transparent hover:bg-orange-100';
				case 'B':
					return 'bg-purple-50 text-purple-600 border-transparent hover:bg-purple-100';
				case 'C':
					return 'bg-blue-50 text-blue-600 border-transparent hover:bg-blue-100';
				default:
					return 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200';
			}
		},

		async saveData(value) {
			uni.showLoading({ title: '正在保存...', mask: true });
			const orderId = value.order_id;
			const newTravelUsers = value.travel_users || [];
			const payload = {
				...value,
				final_amount: value.final_amount ? Number(value.final_amount) : 0
			};

			if (!this.hasTaskOrder) {
				// 如果数组不为空，则存入；如果为空且原字段有值，也需要重置为空数组
				payload.travelers = value.raw_travelers || [];
			} else {
				// 如果有任务单，a-snapshots 不需要存这份数据（避免冗余），或者你想存也可以保留
				// 这里选择删除 travelers 字段以保持数据单一来源，或者你可以不处理
				delete payload.travelers;
			}

			delete payload.raw_travelers;
			delete payload.customer_remarks;
			if (!payload.itinerary) {
				delete payload.itinerary;
			}

			if (this.currentEditId && this.originalItem && this.originalItem.custom_display_text) {
				let parts = this.originalItem.custom_display_text.split('##');
				let hasChange = false;

				// 1. 处理等级变更 (如 D级 -> A级)
				if (value.rank && value.rank !== this.originalItem.rank) {
					const oldRankStr = (this.originalItem.rank || 'D') + '级';
					const newRankStr = value.rank + '级';

					parts = parts.map((p) => {
						if (p.includes(oldRankStr)) {
							hasChange = true;
							return p.split(oldRankStr).join(newRankStr);
						} else if (!p.includes(newRankStr)) {
							hasChange = true;
							return p + ' | ' + newRankStr;
						}
						return p;
					});
				}

				// 2. 处理人员变更 (管家/私导)
				const getName = (list, role) => {
					const staff = list.find((s) => s.role === role || (Array.isArray(s.role) && s.role.includes(role)));
					return staff ? staff.nickname || staff.name : null;
				};

				const rolesToCheck = ['guide', 'attendant'];
				rolesToCheck.forEach((role) => {
					const oldName = getName(this.originalItem.staves || [], role);
					const newName = getName(value.staves || [], role);

					if (newName && newName !== oldName) {
						parts = parts.map((p) => {
							if (oldName && p.includes(oldName)) {
								hasChange = true;
								return p.split(oldName).join(newName);
							} else if (!p.includes(newName)) {
								hasChange = true;
								return p + ' | ' + newName;
							}
							return p;
						});
					}
				});

				if (hasChange) {
					payload.custom_display_text = parts.join('##');
				}
			}

			try {
				if (this.currentEditId) {
					if (!payload.ctrip_id) delete payload.ctrip_id;
					if (!payload.product_id) delete payload.product_id;
					if (!payload.snapshot_id) delete payload.snapshot_id;

					const oldSnapshotRes = await db.collection('a-snapshots').doc(this.currentEditId).field('travel_users').get();
					const oldTravelUsers = oldSnapshotRes.result.data && oldSnapshotRes.result.data[0] ? oldSnapshotRes.result.data[0].travel_users || [] : [];
					const oldUserIds = oldTravelUsers.map((u) => u.id).filter((id) => id);
					// 获取新的出行用户ID列表 (从表单提交的数据中)
					const newUserIds = newTravelUsers.map((u) => u.id).filter((id) => id);
					// 计算差异：在旧列表中但不在新列表中的 ID，即为本次被移除的用户
					const idsToDelete = oldUserIds.filter((id) => !newUserIds.includes(id));

					// --- 处理关联表更新 ---
					const updateExtras = [];

					// 1. 更新客户备注 (a-customers)
					// 注意：只更新存在的记录，如果找不到不做处理
					if (this.hasCustomerRecord) {
						// 如果客户表存在记录，则更新客户表
						const updateCustomerPromise = db.collection('a-customers').where({ order_id: orderId }).update({
							remarks: value.customer_remarks,
							updated_at: Date.now()
						});
						updateExtras.push(updateCustomerPromise);

						// 同时从快照 payload 中移除 remarks (避免冗余或数据冲突)
						delete payload.remarks;
					} else {
						// 如果客户表不存在记录，则保存到快照表的 remarks 字段
						payload.remarks = value.customer_remarks;
					}

					delete payload.customer_remarks;

					// 2. 更新原始出行人 (a-task-orders)
					const taskUpdateLogic = async () => {
						try {
							const taskRes = await db.collection('a-task-orders').where({ order_id: orderId }).get();
							if (taskRes.result && taskRes.result.data && taskRes.result.data.length > 0) {
								const taskItem = taskRes.result.data[0];
								// 获取原始数据副本
								let rawData = taskItem.raw_data || [];

								// 确保数据结构存在，才进行修改
								if (rawData.length > 0 && rawData[0].order_context) {
									// 在内存中更新 travelers
									rawData[0].order_context.travelers = value.raw_travelers;

									// 整体更新 raw_data 字段
									return db.collection('a-task-orders').doc(taskItem._id).update({
										raw_data: rawData,
										updated_at: Date.now()
									});
								}
							}
						} catch (e) {
							console.error('更新原始订单失败', e);
						}
						return Promise.resolve(); // 避免报错影响主流程
					};

					// 将异步逻辑加入队列
					updateExtras.push(taskUpdateLogic());

					// 等待所有更新完成 (快照更新 + 关联表更新)
					// 注意：将 updateExtras 加入到你原本的 Promise.all 中，或者在这里单独 await
					await Promise.all(updateExtras);

					// === 更新快照基本信息 ===
					const updateSnapshotPromise = db.collection('a-snapshots').doc(this.currentEditId).update(payload);
					const findAlbumPromise = db.collection('a-group-albums').where({ order_id: orderId }).field('_id, members').get();
					const [snapshotRes, albumFindRes] = await Promise.all([updateSnapshotPromise, findAlbumPromise]);

					// === 更新相册成员 ===
					if (albumFindRes.result && albumFindRes.result.data && albumFindRes.result.data.length > 0) {
						const album = albumFindRes.result.data[0];
						let currentMembers = album.members || [];
						if (idsToDelete.length > 0) {
							currentMembers = currentMembers.filter((m) => !idsToDelete.includes(m.id));
						}

						const memberMap = new Map();
						currentMembers.forEach((m) => {
							if (m && m.id) memberMap.set(m.id, m);
						});
						newTravelUsers.forEach((m) => {
							if (m && m.id) memberMap.set(m.id, m);
						});
						if (payload.staves && Array.isArray(payload.staves)) {
							payload.staves.forEach((s) => {
								// 检查角色是否包含 guide
								const isGuide = s.role === 'guide' || (Array.isArray(s.role) && s.role.includes('guide'));
								if (isGuide && s.id) {
									if (!memberMap.has(s.id)) {
										memberMap.set(s.id, { id: s.id, mobile: s.mobile });
									}
								}
							});
						}
						await db
							.collection('a-group-albums')
							.doc(album._id)
							.update({
								members: Array.from(memberMap.values())
							});
					}

					// 手动更新本地 listData，实现"即时响应"
					const listIndex = this.listData.findIndex((item) => item._id === this.currentEditId);
					if (listIndex > -1) {
						const target = this.listData[listIndex];

						// 更新基础字段
						target.title = payload.title;
						target.sub_title = payload.sub_title;
						target.rank = payload.rank;
						target.final_amount = payload.final_amount;
						target.departure_date = payload.departure_date;
						target.total_days = payload.total_days;
						target._rawTravelers = value.raw_travelers;
						target.customer_remarks = value.customer_remarks;

						if (payload.staves) {
							target.staves = JSON.parse(JSON.stringify(payload.staves));
						}

						// 更新出行人
						if (payload.travel_users) {
							target.travel_users = JSON.parse(JSON.stringify(payload.travel_users));
						}

						// 更新自定义显示文本 (如果有变更)
						if (payload.custom_display_text) {
							target.custom_display_text = payload.custom_display_text;
						}

						// 使用 splice 触发 Vue 列表的响应式更新
						this.listData.splice(listIndex, 1, target);
					}

					// === 调用 RPA 分配管家并发送通知 ===
					const attendant = payload.staves.find((s) => s.role === 'attendant');
					if (attendant) {
						// 调用 RPA 云对象
						const attRes = await rpa.reassignAgent({
							orderId: orderId,
							agentId: attendant.id,
							accountName: attendant.nickname || attendant.name
						});
						if (attRes.errCode !== 0) {
							console.error('RPA Reassign Error:', attRes.errMsg);
							uni.showToast({ title: '管家分配RPA同步失败', icon: 'none' });
						} else {
							// RPA 分配成功后，发送通知
							let customerName = '详见订单';
							if (payload.travel_users && payload.travel_users.length > 0) {
								customerName = payload.travel_users[0].name || payload.travel_users[0].nickname || '客人';
							}
							const d = new Date(payload.departure_date);
							const departureDateStr = `${d.getMonth() + 1}.${d.getDate()}`;

							attendantNotifier
								.notifyAttendantAssigned({
									mobile: attendant.mobile,
									orderId: orderId,
									customerName: customerName,
									departureDateStr: departureDateStr
								})
								.then((res) => console.log('通知发送结果:', res))
								.catch((err) => console.error('通知发送失败:', err));
						}
					}
				} else {
					// === 新建逻辑 ===
					if (!payload.itinerary) {
						payload.itinerary = [{ day: 1, day_title: '第1天', activities: [] }];
					}

					const res = await db.collection('a-snapshots').add(payload);
					try {
						await db.collection('a-group-albums').add({
							order_id: payload.order_id,
							title: payload.title,
							members: payload.travel_users || []
						});
					} catch (e) {
						console.warn('自动创建相册失败', e);
					}

					// 同样检查是否分配了管家（新建时也可同步RPA）
					const attendant = payload.staves.find((s) => s.role === 'attendant');
					if (attendant) {
						await rpa.reassignAgent({
							orderId: payload.order_id,
							agentId: attendant.id,
							accountName: attendant.nickname || attendant.name
						});
					}

					if (this.sourceCustomerId) {
						await db.collection('a-customers').doc(this.sourceCustomerId).update({
							order_id: payload.order_id,
							status: 'deal'
						});
						uni.hideLoading();
						uni.$emit('ORDER_CREATED_SUCCESS', {
							customerId: this.sourceCustomerId,
							orderId: payload.order_id
						});
						uni.showToast({ title: '创建成功并已关联', icon: 'success' });
						setTimeout(() => {
							this.closeEditDialog();
							uni.navigateBack();
						}, 1500);
						return;
					}
				}

				uni.hideLoading();
				this.closeEditDialog();
				// this.loadData();
				uni.showToast({ title: '保存成功', icon: 'success' });
			} catch (err) {
				uni.hideLoading();
				uni.showModal({
					title: '保存失败',
					content: `发生错误: ${err.message || '请求服务失败'}`,
					showCancel: false
				});
			}
		},

		onPopupStateChange(e) {
			this.dialogReady = e.show;
		},

		async loadDefaultTravelers() {
			if (this.travelerSearchInput) return;
			if (this.searchTimer) clearTimeout(this.searchTimer);
			try {
				const res = await db.collection('uni-id-users').where('mobile != null').field('_id, mobile').limit(30).orderBy('register_date', 'desc').get();
				if (res.result.data) this.travelerCandidates = res.result.data;
			} catch (err) {
				console.error(err);
			}
		},
		searchTravelers(query) {
			this.travelerSearchInput = query;
			if (this.searchTimer) clearTimeout(this.searchTimer);
			if (!query) {
				this.loadDefaultTravelers();
				return;
			}
			const escapedQuery = escapeRegExp(query);
			this.searchTimer = setTimeout(async () => {
				try {
					const res = await db
						.collection('uni-id-users')
						.where({ mobile: new RegExp(escapedQuery, 'i') })
						.field('_id, mobile')
						.limit(30)
						.get();
					if (res.result.data) this.travelerCandidates = res.result.data;
				} catch (err) {
					console.error(err);
				}
			}, 300);
		},
		onTravelerSelect(selectedUserId) {
			if (!selectedUserId || !this.dialogReady) return;
			const selectedUser = this.travelerCandidates.find((user) => user._id === selectedUserId);
			if (!selectedUser) return;
			const isDuplicate = this.formData.travel_users.some((user) => user.id === selectedUserId);
			if (isDuplicate) {
				uni.showToast({ title: '用户已在列表中', icon: 'none' });
				this.$nextTick(() => {
					this.travelerSearchInput = '';
					this.travelerCandidates = [];
				});
				return;
			}
			this.formData.travel_users.push({ id: selectedUserId, mobile: selectedUser.mobile });
			this.$nextTick(() => {
				this.travelerSearchInput = '';
				this.travelerCandidates = [];
			});
		},
		removeTraveler(index) {
			this.formData.travel_users.splice(index, 1);
		},

		formatRoleText(roleField) {
			const roleMap = { guide: '向导', attendant: '管家' };
			if (Array.isArray(roleField)) {
				for (const r of roleField) if (roleMap[r]) return roleMap[r];
				return '';
			}
			return roleMap[roleField] || '';
		},

		formatStaffDisplay(user, role) {
			const roleText = role === 'guide' ? '向导' : '管家';
			const nickname = user.nickname || user.username || '未命名';
			const mobile = user.mobile || '无手机号';
			const scoreText = user.total_score !== undefined && user.total_score !== null ? `(${user.total_score}分)` : '';
			return `${scoreText}[${roleText}] ${nickname} - ${mobile}`;
		},

		// ================== 管家相关搜索 ==================
		async loadDefaultAttendants() {
			if (this.attendantSearchInput) return;
			try {
				const res = await operationCenter.getAssessmentData({ role: 'attendant' });
				let list = Array.isArray(res.data) ? res.data : [];
				// 兜底查询
				if (list.length === 0) {
					const dbRes = await db.collection('uni-id-users').where({ role: 'attendant' }).field('_id, mobile, nickname').limit(30).get();
					list = dbRes.result.data.map((u) => ({ user_id: u._id, real_name: u.nickname, mobile: u.mobile, total_score: 0 }));
				}
				this.attendantCandidates = list.map((item) => ({
					_id: item.user_id,
					nickname: item.real_name || item.nickname || '未命名',
					mobile: item.mobile,
					role: 'attendant',
					total_score: Number(item.total_score || 0),
					displayText: this.formatStaffDisplay(
						{
							nickname: item.real_name || item.nickname,
							mobile: item.mobile,
							total_score: item.total_score
						},
						'attendant'
					)
				}));
			} catch (e) {
				console.error(e);
			}
		},
		searchAttendants(query) {
			this.attendantSearchInput = query;
			if (this.attendantSearchTimer) clearTimeout(this.attendantSearchTimer);
			if (!query) {
				this.loadDefaultAttendants();
				return;
			}
			const escapedQuery = escapeRegExp(query);
			this.attendantSearchTimer = setTimeout(async () => {
				try {
					const dbCmd = db.command;
					const res = await db
						.collection('uni-id-users')
						.where(
							dbCmd.and([
								{ role: 'attendant' },
								dbCmd.or([{ mobile: new RegExp(escapedQuery, 'i') }, { nickname: new RegExp(escapedQuery, 'i') }, { username: new RegExp(escapedQuery, 'i') }])
							])
						)
						.field('_id, mobile, nickname, username')
						.limit(20)
						.get();
					if (res.result.data) {
						this.attendantCandidates = res.result.data.map((u) => ({
							_id: u._id,
							nickname: u.nickname || u.username,
							mobile: u.mobile,
							role: 'attendant',
							displayText: `[管家] ${u.nickname || u.username} - ${u.mobile}`
						}));
					}
				} catch (e) {
					console.error(e);
				}
			}, 300);
		},
		onAttendantSelect(id) {
			if (!id || !this.dialogReady) return;
			const user = this.attendantCandidates.find((u) => u._id === id);
			if (!user) return;
			// 移除旧的管家（如果有）
			this.formData.staves = this.formData.staves.filter((s) => s.role !== 'attendant' && !(Array.isArray(s.role) && s.role.includes('attendant')));
			// 添加新的
			this.formData.staves.push({
				id: user._id,
				mobile: user.mobile,
				role: 'attendant',
				nickname: user.nickname,
				name: user.nickname,
				total_score: user.total_score
			});
			this.$nextTick(() => {
				this.attendantSearchInput = '';
				this.attendantCandidates = [];
			});
		},
		removeAttendant() {
			this.formData.staves = this.formData.staves.filter((s) => s.role !== 'attendant' && !(Array.isArray(s.role) && s.role.includes('attendant')));
		},

		// ================== 私导相关搜索 ==================
		async loadDefaultGuides() {
			if (this.guideSearchInput) return;
			try {
				const res = await operationCenter.getAssessmentData({ role: 'guide' });
				let list = Array.isArray(res.data) ? res.data : [];
				// 兜底查询
				if (list.length === 0) {
					const dbRes = await db.collection('uni-id-users').where({ role: 'guide' }).field('_id, mobile, nickname').limit(30).get();
					list = dbRes.result.data.map((u) => ({ user_id: u._id, real_name: u.nickname, mobile: u.mobile, total_score: 0 }));
				}
				this.guideCandidates = list.map((item) => ({
					_id: item.user_id,
					nickname: item.real_name || item.nickname || '未命名',
					mobile: item.mobile,
					role: 'guide',
					total_score: Number(item.total_score || 0),
					displayText: this.formatStaffDisplay(
						{
							nickname: item.real_name || item.nickname,
							mobile: item.mobile,
							total_score: item.total_score
						},
						'guide'
					)
				}));
			} catch (e) {
				console.error(e);
			}
		},
		searchGuides(query) {
			this.guideSearchInput = query;
			if (this.guideSearchTimer) clearTimeout(this.guideSearchTimer);
			if (!query) {
				this.loadDefaultGuides();
				return;
			}
			const escapedQuery = escapeRegExp(query);
			this.guideSearchTimer = setTimeout(async () => {
				try {
					const dbCmd = db.command;
					const res = await db
						.collection('uni-id-users')
						.where(
							dbCmd.and([
								{ role: 'guide' },
								dbCmd.or([{ mobile: new RegExp(escapedQuery, 'i') }, { nickname: new RegExp(escapedQuery, 'i') }, { username: new RegExp(escapedQuery, 'i') }])
							])
						)
						.field('_id, mobile, nickname, username')
						.limit(20)
						.get();
					if (res.result.data) {
						this.guideCandidates = res.result.data.map((u) => ({
							_id: u._id,
							nickname: u.nickname || u.username,
							mobile: u.mobile,
							role: 'guide',
							displayText: `[向导] ${u.nickname || u.username} - ${u.mobile}`
						}));
					}
				} catch (e) {
					console.error(e);
				}
			}, 300);
		},
		onGuideSelect(id) {
			if (!id || !this.dialogReady) return;
			const user = this.guideCandidates.find((u) => u._id === id);
			if (!user) return;
			// 移除旧的私导（如果有）
			this.formData.staves = this.formData.staves.filter((s) => s.role !== 'guide' && !(Array.isArray(s.role) && s.role.includes('guide')));
			// 添加新的
			this.formData.staves.push({
				id: user._id,
				mobile: user.mobile,
				role: 'guide',
				nickname: user.nickname,
				name: user.nickname,
				total_score: user.total_score
			});
			this.$nextTick(() => {
				this.guideSearchInput = '';
				this.guideCandidates = [];
			});
		},
		removeGuide() {
			this.formData.staves = this.formData.staves.filter((s) => s.role !== 'guide' && !(Array.isArray(s.role) && s.role.includes('guide')));
		},

		// 处理物资分配点击
		async handleSupplyAllocation(item) {
			this.currentItem = item;
			this.inviteStep = 'supply';
			this.qrCodeBase64 = '';

			// 1. 获取准确的出行人数 (从 a-task-orders)
			uni.showLoading({ title: '加载人数...' });
			try {
				const taskRes = await db.collection('a-task-orders').where({ order_id: item.order_id }).field('raw_data').get();

				// 默认 1
				this.currentTravelerCount = 1;

				if (taskRes.result && taskRes.result.data && taskRes.result.data.length > 0) {
					const task = taskRes.result.data[0];
					if (task.raw_data && task.raw_data[0] && task.raw_data[0].order_context && Array.isArray(task.raw_data[0].order_context.travelers)) {
						this.currentTravelerCount = task.raw_data[0].order_context.travelers.length || 1;
					}
				}
			} catch (e) {
				console.error('获取任务订单人数失败', e);
			}

			await this.loadSupplyData(item);
		},

		// 处理邀请点击
		async handleInvite(item) {
			this.currentItem = item;
			this.inviteStep = 'qrcode';
			this.$refs.qrPopup.open();
			this.fetchQrCode();
		},

		async loadSupplyData(item) {
			this.supplyFormData = { order_id: item.order_id, status: 'created', supplies: [] };
			uni.showLoading({ title: '加载配置中...' });

			try {
				// ... (原 handleShowQr 中的数据库查询逻辑保持不变) ...
				const [servicesRes, suppliesRes, orderRes] = await Promise.all([
					db.collection('a-services').where('status == true').get(),
					db.collection('a-supplies').where('is_config != true').get(),
					db.collection('a-order-supplies').where({ order_id: item.order_id }).get()
				]);

				this.serviceMap = {};
				servicesRes.result.data.forEach((s) => (this.serviceMap[s._id] = s));
				this.supplyMap = {};
				suppliesRes.result.data.forEach((s) => (this.supplyMap[s._id] = s));

				this.serviceOptions = Object.values(this.serviceMap);
				this.supplyOptions = Object.values(this.allSuppliesMap || this.supplyMap);

				if (orderRes.result && orderRes.result.data && orderRes.result.data.length > 0) {
					const record = orderRes.result.data[0];
					this.supplyFormData = record;

					const uiList = [];
					if (record.selected_services) {
						record.selected_services.forEach((s) => uiList.push({ type: 'service', id: s.id, quantity: s.quantity || 1 }));
					}
					if (record.selected_supplies) {
						record.selected_supplies.forEach((s) => uiList.push({ type: 'supply', id: s.id, quantity: s.quantity || 1 }));
					}
					if (uiList.length === 0 && record.supplies && record.supplies.length > 0) {
						record.supplies.forEach((s) => uiList.push({ type: 'supply', id: s.id, quantity: s.total_quantity || 1 }));
					}
					this.selectionList = uiList.length > 0 ? uiList : [{ type: 'service', id: '', quantity: 1 }];
				} else {
					this.supplyFormData = { order_id: item.order_id, status: 'created' };
					const uiList = [];

					// 1. 加载默认服务
					// serviceOptions 已经是 Object.values(this.serviceMap)
					const defaultServices = this.serviceOptions.filter((s) => s.status === true && s.is_default === true);
					defaultServices.forEach((s) => {
						uiList.push({
							type: 'service',
							id: s._id,
							quantity: 1 // 服务默认数量通常为1
						});
					});

					// 2. 加载默认物资
					// supplyOptions 已经是 Object.values(this.allSuppliesMap || this.supplyMap)
					const defaultSupplies = this.supplyOptions.filter((s) => s.status === true && s.is_default === true && s.is_config !== true);
					defaultSupplies.forEach((s) => {
						// 核心逻辑: 如果是按人分配，默认数量 = 人数；否则 = 1
						const allocType = s.allocation_type || 'person';
						const defaultQty = allocType === 'group' ? 1 : this.currentTravelerCount > 0 ? this.currentTravelerCount : 1;

						uiList.push({
							type: 'supply',
							id: s._id,
							quantity: defaultQty
						});
					});

					// 如果没有默认项，保留一个空行
					this.selectionList = uiList.length > 0 ? uiList : [{ type: 'service', id: '', quantity: 1 }];
				}

				this.$refs.qrPopup.open();
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		},

		addSupplyItem() {
			this.selectionList.push({
				type: 'supply',
				id: '',
				quantity: 1
			});
		},

		async fetchAllSupplies() {
			try {
				const res = await db.collection('a-supplies').limit(500).get();
				if (res.result.data) {
					const map = {};
					res.result.data.forEach((item) => {
						map[item._id] = item;
					});
					this.allSuppliesMap = map;
				}
			} catch (e) {
				console.error('加载物资数据失败', e);
			}
		},

		getPickerValue(type, id) {
			if (!id) return null;
			if (type === 'service') {
				return this.serviceMap[id] || this.serviceOptions.find((i) => i._id === id);
			} else {
				return this.allSuppliesMap[id] || this.supplyMap[id] || this.supplyOptions.find((i) => i._id === id);
			}
		},

		// 处理 custom-picker 的 change 事件
		handleCustomPickerChange(item, index) {
			if (!item) return;

			// 更新 ID
			this.selectionList[index].id = item._id;

			// 如果是物资，复用原有的逻辑处理 allocation_type
			if (this.selectionList[index].type === 'supply') {
				// 构造一个模拟 uni-data-picker 的 event 对象，复用你原有的 onSupplyPickerChange 逻辑
				// 或者直接把逻辑写在这里：
				const allocType = item.allocation_type || 'person';

				if (allocType === 'group') {
					this.selectionList[index].quantity = 1;
				} else {
					this.selectionList[index].quantity = this.currentTravelerCount > 0 ? this.currentTravelerCount : 1;
				}
			}
		},

		onSupplyPickerChange(e, index) {
			if (e.detail.value && e.detail.value.length > 0) {
				const selected = e.detail.value[e.detail.value.length - 1];

				// 优先使用本地缓存的全量数据
				let allocType = 'person';
				if (selected.value && this.allSuppliesMap[selected.value]) {
					allocType = this.allSuppliesMap[selected.value].allocation_type || 'person';
				} else {
					allocType = selected.allocation_type || 'person';
				}

				console.log(`选中物资: ${selected.text}, 分配方式: ${allocType}, 当前人数: ${this.currentTravelerCount}`);

				if (allocType === 'group') {
					this.selectionList[index].quantity = 1;
				} else {
					this.selectionList[index].quantity = this.currentTravelerCount > 0 ? this.currentTravelerCount : 1;
				}
			}
		},

		// 保存物资
		async saveSupply() {
			// 1. 过滤无效行
			const validItems = this.selectionList.filter((item) => item.id && item.quantity > 0);
			if (validItems.length === 0) {
				return uni.showToast({ title: '请至少配置一项', icon: 'none' });
			}

			this.supplySaving = true;
			try {
				// 2. 分离服务和物资
				const selectedServices = validItems
					.filter((i) => i.type === 'service')
					.map((i) => {
						const svc = this.serviceMap[i.id];
						return { id: i.id, name: svc ? svc.name : '未知服务', quantity: i.quantity };
					});

				const selectedSupplies = validItems.filter((i) => i.type === 'supply').map((i) => ({ id: i.id, quantity: i.quantity }));

				// 3. 【核心】执行扁平化计算
				const tempMap = {}; // 用于去重累加: { supplyId: supplyObj }

				const addToMap = (suppId, qty) => {
					const detail = this.supplyMap[suppId];
					if (!detail) return; // 如果物资已被删除则跳过

					if (!tempMap[suppId]) {
						tempMap[suppId] = {
							id: suppId,
							name: detail.name,
							image: detail.image,
							unit: detail.unit,
							is_consumable: !!detail.is_consumable,
							is_on_demand: false,
							total_quantity: 0,
							// 初始化流转状态字段
							pickup_quantity: 0,
							return_normal_quantity: 0,
							return_damaged_quantity: 0,
							return_lost_quantity: 0,
							status: 'pending'
						};
					}
					// 累加数量
					tempMap[suppId].total_quantity += qty;
				};

				// 3.1 处理服务里的物资
				selectedServices.forEach((userSel) => {
					const serviceDetail = this.serviceMap[userSel.id];
					if (serviceDetail && serviceDetail.supplies) {
						serviceDetail.supplies.forEach((subItem) => {
							// 1. 获取该物资的定义，查看是按人还是按团
							const supplyDef = this.allSuppliesMap[subItem.id] || this.supplyMap[subItem.id];
							const allocType = supplyDef ? supplyDef.allocation_type || 'person' : 'person';

							// 2. 计算分配倍数
							// 如果是按团 (group)：倍数为 1
							// 如果是按人 (person)：倍数为当前出行人数 (this.currentTravelerCount)
							const allocationMultiplier = allocType === 'group' ? 1 : this.currentTravelerCount > 0 ? this.currentTravelerCount : 1;

							// 3. 计算最终数量
							// 公式：(服务定义的物资数量) * (用户选择的服务份数X) * (分配倍数)
							const finalQty = subItem.quantity * userSel.quantity * allocationMultiplier;

							addToMap(subItem.id, finalQty);
						});
					}
				});

				// 3.2 处理单选物资
				selectedSupplies.forEach((item) => {
					addToMap(item.id, item.quantity);
				});

				const finalSupplies = Object.values(tempMap);
				const userInfo = uniCloud.getCurrentUserInfo();

				// 4. 构造保存数据
				const dataToSave = {
					...this.supplyFormData, // 保留原有的 _id 等
					order_id: this.currentItem.order_id,
					user_id: userInfo.uid || 'admin_operator',
					selected_services: selectedServices,
					selected_supplies: selectedSupplies,
					supplies: finalSupplies, // 存入扁平化后的结果
					is_user_confirmed: false,
					updated_at: Date.now()
				};

				// 5. 写库操作
				if (dataToSave._id) {
					const { _id, ...updateData } = dataToSave;
					await db.collection('a-order-supplies').doc(_id).update(updateData);
				} else {
					dataToSave.created_at = Date.now();
					const userInfo = uniCloud.getCurrentUserInfo();
					dataToSave.user_id = userInfo.uid || 'admin_operator';
					await db.collection('a-order-supplies').add(dataToSave);
				}

				uni.showToast({ title: '保存成功', icon: 'success' });
				this.$refs.qrPopup.close();

				if (this.currentItem) {
					const idx = this.listData.findIndex((i) => i.order_id === this.currentItem.order_id);
					if (idx > -1) {
						// 直接修改列表中的对象属性
						// this.listData[idx]._supplyStatus = 'manual';
						this.$set(this.listData[idx], '_supplyStatus', 'manual');
					}
				}

				this.loadData(false);
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '保存失败: ' + e.message, icon: 'none' });
			} finally {
				this.supplySaving = false;
			}
		},

		// 删除物资配置
		async deleteSupplyConfig() {
			if (!this.supplyFormData._id) return;

			const confirm = await new Promise((resolve) => {
				uni.showModal({
					title: '危险操作',
					content: '确定要彻底删除该订单的物资配置表吗？\n删除后状态将变为“未分配”。',
					confirmColor: '#ef4444',
					success: (res) => resolve(res.confirm)
				});
			});

			if (!confirm) return;

			uni.showLoading({ title: '正在删除...', mask: true });
			try {
				// 1. 删除数据库记录
				await db.collection('a-order-supplies').doc(this.supplyFormData._id).remove();

				// 2. 更新列表页该条目的状态显示 (变为未配置)
				if (this.currentItem) {
					const idx = this.listData.findIndex((i) => i.order_id === this.currentItem.order_id);
					if (idx > -1) {
						this.listData[idx]._supplyStatus = 'auto'; // 重置为自动/未配置状态
					}
				}

				uni.showToast({ title: '删除成功', icon: 'success' });
				this.$refs.qrPopup.close();
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '删除失败: ' + e.message, icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		},

		skipSupplyAndShowQr() {
			this.inviteStep = 'qrcode';
			this.fetchQrCode();
		},

		// 封装获取二维码逻辑
		async fetchQrCode() {
			this.qrLoading = true;
			try {
				const res = await qrcodeService.generateOrderInviteCode(this.currentItem.order_id);
				if (res.errCode === 0) {
					this.qrCodeBase64 = res.base64;
				}
			} catch (e) {
				uni.showToast({ title: '获取邀请码失败', icon: 'none' });
			} finally {
				this.qrLoading = false;
			}
		},
		closeQrPopup() {
			this.$refs.qrPopup.close();
		},

		// 跳转到携程同步页面
		navigateToSync() {
			const url = '/pages/snapshot-sync/snapshot-sync';
			uni.navigateTo({
				url: url,
				success: () => {
					console.log('跳转到携程同步页面成功');
				},
				fail: (error) => {
					console.error('跳转失败:', error);
					this.$message.error('页面跳转失败，请检查页面路径是否正确');
				}
			});
		}
	}
};
</script>

<style>
.uni-easyinput,
.uni-data-select {
	width: 100%;
}
.uni-forms-item {
	margin-bottom: 20px;
}
</style>
