<template>
  <view class="min-h-screen bg-gray-50" style="font-family: 'Microsoft YaHei', sans-serif;">
    <!-- 页面标题栏 -->
    <view class="bg-white shadow-sm border-b border-gray-200">
      <view class="max-w-full mx-auto px-6 py-4">
        <view class="flex items-center justify-between">
          <view class="flex items-center space-x-4">
            <button @click="goBack" class="flex items-center px-4 py-2 text-gray-600 hover:text-emerald-600 transition-colors">
              <i class="fas fa-arrow-left text-lg mr-2"></i>
              <text class="text-lg font-medium">返回列表</text>
            </button>
            <view class="h-6 w-px bg-gray-300"></view>
            <view>
              <text class="text-2xl font-bold text-gray-900">订单详情管理</text>
              <text v-if="formData.order_no" class="block text-sm text-gray-500 mt-1">订单号: {{ formData.order_no }}</text>
            </view>
          </view>
          <view class="flex items-center space-x-3">
            <view class="text-sm text-gray-500">
              <i class="fas fa-clock mr-1"></i>
              {{currentTime}}
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <view class="mx-6 my-6">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
        <!-- 基本信息卡片 -->
        <view class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <view class="p-6 border-b border-gray-200">
            <view class="flex items-center">
              <i class="fas fa-info-circle text-emerald-600 text-xl mr-3"></i>
              <text class="text-xl font-semibold text-gray-900">基本信息</text>
            </view>
          </view>
          
          <view class="p-6 space-y-6">
            <!-- 订单号 -->
            <view class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <view>
      <uni-forms-item name="order_no" label="订单号" required>
                  <template v-slot:label>
                    <view class="flex items-center mb-2">
                      <i class="fas fa-barcode text-gray-400 mr-2"></i>
                      <text class="text-sm font-medium text-gray-700">订单号</text>
                      <text class="text-red-500 ml-1">*</text>
                      <text class="text-xs text-orange-600 ml-2">(不可修改)</text>
                    </view>
                  </template>
                  <uni-easyinput 
                    placeholder="订单号，唯一标识" 
                    v-model="formData.order_no"
                    :disabled="true"
                    :styles="{
                      color: '#6b7280',
                      backgroundColor: '#f9fafb',
                      borderColor: '#d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      height: '42px'
                    }"
                  />
                </uni-forms-item>
              </view>

                            <!-- 订单状态 -->
              <view>
                <uni-forms-item name="status" label="订单状态" required>
                  <template v-slot:label>
                    <view class="flex items-center mb-2">
                      <i class="fas fa-flag text-gray-400 mr-2"></i>
                      <text class="text-sm font-medium text-gray-700">订单状态</text>
                      <text class="text-red-500 ml-1">*</text>
                    </view>
                  </template>
                  <uni-data-select
                    v-model="formData.status"
                    :localdata="formOptions.status_localdata"
                    placeholder="请选择订单状态"
                    :clear="false"
                    :styles="{
                      color: '#333',
                      backgroundColor: '#fff',
                      borderColor: '#d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      height: '42px'
                    }"
                  />
      </uni-forms-item>
              </view>
            </view>

            <!-- 用户和商品信息 -->
            <view class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <view>
                <uni-forms-item name="user_id" label="用户信息" required>
                  <template v-slot:label>
                    <view class="flex items-center mb-2">
                      <i class="fas fa-mobile-alt text-gray-400 mr-2"></i>
                      <text class="text-sm font-medium text-gray-700">用户信息</text>
                      <text class="text-red-500 ml-1">*</text>
                    </view>
                  </template>
                  <view class="relative">
                    <uni-easyinput 
                      placeholder="用户手机号" 
                      v-model="userMobile"
                      :disabled="true"
                      :styles="{
                        color: '#333',
                        backgroundColor: '#f9fafb',
                        borderColor: '#d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        height: '42px'
                      }"
                    />
                    <view v-if="userMobile" class="absolute right-3 top-3 text-xs text-gray-500">
                      ID: {{formData.user_id}}
                    </view>
                  </view>
      </uni-forms-item>
              </view>

              <view>
      <uni-forms-item name="product_id" label="商品ID" required>
                  <template v-slot:label>
                    <view class="flex items-center mb-2">
                      <i class="fas fa-box text-gray-400 mr-2"></i>
                      <text class="text-sm font-medium text-gray-700">商品ID</text>
                      <text class="text-red-500 ml-1">*</text>
                      <text class="text-xs text-orange-600 ml-2">(不可修改)</text>
                    </view>
                  </template>
                  <uni-easyinput 
                    placeholder="商品ID，关联商品信息" 
                    v-model="formData.product_id"
                    :disabled="true"
                    :styles="{
                      color: '#6b7280',
                      backgroundColor: '#f9fafb',
                      borderColor: '#d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      height: '42px'
                    }"
                  />
      </uni-forms-item>
              </view>
            </view>

            <!-- 数量和会员等级 -->
            <view class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <view>
                <uni-forms-item name="quantity" label="购买数量">
                  <template v-slot:label>
                    <view class="flex items-center mb-2">
                      <i class="fas fa-sort-numeric-up text-gray-400 mr-2"></i>
                      <text class="text-sm font-medium text-gray-700">购买数量</text>
                    </view>
                  </template>
                  <uni-easyinput 
                    type="number"
                    placeholder="请输入购买数量" 
                    v-model="formData.quantity"
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
                    }"
                  />
      </uni-forms-item>
              </view>

              <view>
                <uni-forms-item name="member_level" label="会员等级">
                  <template v-slot:label>
                    <view class="flex items-center mb-2">
                      <i class="fas fa-crown text-gray-400 mr-2"></i>
                      <text class="text-sm font-medium text-gray-700">会员等级</text>
                    </view>
                  </template>
                  <uni-data-checkbox 
                    v-model="formData.member_level" 
                    :localdata="formOptions.member_level_localdata"
                    mode="tag"
                    selectedColor="#10b981"
                  />
      </uni-forms-item>
              </view>
            </view>
          </view>
        </view>

        <!-- 金额信息卡片 -->
        <view class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <view class="p-6 border-b border-gray-200">
            <view class="flex items-center">
              <i class="fas fa-dollar-sign text-amber-600 text-xl mr-3"></i>
              <text class="text-xl font-semibold text-gray-900">金额信息</text>
            </view>
          </view>
          
          <view class="p-6 space-y-6">
            <view class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- 订单总金额 -->
              <view>
                <uni-forms-item name="total_amount" label="订单总金额">
                  <template v-slot:label>
                    <view class="flex items-center mb-2">
                      <i class="fas fa-receipt text-gray-400 mr-2"></i>
                      <text class="text-sm font-medium text-gray-700">订单总金额</text>
                    </view>
                  </template>
                  <uni-easyinput 
                    type="digit"
                    placeholder="请输入订单总金额（分）" 
                    v-model="formData.total_amount"
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
                    }"
                  />
      </uni-forms-item>
              </view>

              <!-- 最终支付金额 -->
              <view>
                <uni-forms-item name="final_amount" label="最终支付金额">
                  <template v-slot:label>
                    <view class="flex items-center mb-2">
                      <i class="fas fa-money-bill-wave text-gray-400 mr-2"></i>
                      <text class="text-sm font-medium text-gray-700">最终支付金额</text>
                    </view>
                  </template>
                  <uni-easyinput 
                    type="digit"
                    placeholder="请输入最终支付金额（分）" 
                    v-model="formData.final_amount"
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
                    }"
                  />
      </uni-forms-item>
              </view>
            </view>

            <view class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- 折扣金额 -->
              <view>
      <uni-forms-item name="discount_amount" label="折扣金额">
                  <template v-slot:label>
                    <view class="flex items-center mb-2">
                      <i class="fas fa-percentage text-gray-400 mr-2"></i>
                      <text class="text-sm font-medium text-gray-700">折扣金额</text>
                    </view>
                  </template>
                  <uni-easyinput 
                    type="digit"
                    placeholder="折扣金额（分）" 
                    v-model="formData.discount_amount"
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
                    }"
                  />
      </uni-forms-item>
              </view>

              <!-- 优惠券折扣 -->
              <view>
      <uni-forms-item name="coupon_discount" label="优惠券折扣">
                  <template v-slot:label>
                    <view class="flex items-center mb-2">
                      <i class="fas fa-ticket-alt text-gray-400 mr-2"></i>
                      <text class="text-sm font-medium text-gray-700">优惠券折扣</text>
                    </view>
                  </template>
                  <uni-easyinput 
                    type="digit"
                    placeholder="优惠券折扣（分）" 
                    v-model="formData.coupon_discount"
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
                    }"
                  />
      </uni-forms-item>
              </view>

              <!-- 会员折扣 -->
              <view>
      <uni-forms-item name="member_discount" label="会员折扣">
                  <template v-slot:label>
                    <view class="flex items-center mb-2">
                      <i class="fas fa-crown text-gray-400 mr-2"></i>
                      <text class="text-sm font-medium text-gray-700">会员折扣</text>
                    </view>
                  </template>
                  <uni-easyinput 
                    type="digit"
                    placeholder="会员折扣（分）" 
                    v-model="formData.member_discount"
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
                    }"
                  />
      </uni-forms-item>
              </view>
            </view>
          </view>
        </view>

        <!-- 行程信息卡片 -->
        <view class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <view class="p-6 border-b border-gray-200">
            <view class="flex items-center">
              <i class="fas fa-route text-blue-600 text-xl mr-3"></i>
              <text class="text-xl font-semibold text-gray-900">行程信息</text>
            </view>
          </view>
          
          <view class="p-6 space-y-6">
            <view class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- 出发日期 -->
              <view>
      <uni-forms-item name="departure_date" label="出发日期">
                  <template v-slot:label>
                    <view class="flex items-center mb-2">
                      <i class="fas fa-calendar-alt text-gray-400 mr-2"></i>
                      <text class="text-sm font-medium text-gray-700">出发日期</text>
                    </view>
                  </template>
                  <uni-datetime-picker 
                    return-type="timestamp" 
                    v-model="formData.departure_date"
                    :border="false"
                    placeholder="请选择出发日期"
                  />
      </uni-forms-item>
              </view>

              <!-- 返回日期 -->
              <view>
      <uni-forms-item name="return_date" label="返回日期">
                  <template v-slot:label>
                    <view class="flex items-center mb-2">
                      <i class="fas fa-calendar-check text-gray-400 mr-2"></i>
                      <text class="text-sm font-medium text-gray-700">返回日期</text>
                    </view>
                  </template>
                  <uni-datetime-picker 
                    return-type="timestamp" 
                    v-model="formData.return_date"
                    :border="false"
                    placeholder="请选择返回日期"
                  />
      </uni-forms-item>
              </view>

              <!-- 行程天数 -->
              <view>
      <uni-forms-item name="duration_days" label="行程天数">
                  <template v-slot:label>
                    <view class="flex items-center mb-2">
                      <i class="fas fa-clock text-gray-400 mr-2"></i>
                      <text class="text-sm font-medium text-gray-700">行程天数</text>
                    </view>
                  </template>
                  <uni-easyinput 
                    type="number"
                    placeholder="请输入行程天数" 
                    v-model="formData.duration_days"
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
                    }"
                  />
      </uni-forms-item>
              </view>
            </view>

            <!-- 特殊要求 -->
            <view>
      <uni-forms-item name="special_requirements" label="特殊要求">
                <template v-slot:label>
                  <view class="flex items-center mb-2">
                    <i class="fas fa-exclamation-triangle text-gray-400 mr-2"></i>
                    <text class="text-sm font-medium text-gray-700">特殊要求</text>
                  </view>
                </template>
                <uni-easyinput 
                  type="textarea"
                  placeholder="请输入特殊要求或注意事项" 
                  v-model="formData.special_requirements"
                  :maxlength="500"
                  :styles="{
                    color: '#333',
                    backgroundColor: '#fff',
                    borderColor: '#d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    minHeight: '80px'
                  }"
                  :focus-style="{
                    borderColor: '#10b981'
                  }"
                />
      </uni-forms-item>
            </view>
          </view>
        </view>

        <!-- 联系人和出行人信息卡片 -->
        <view class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <view class="p-6 border-b border-gray-200">
            <view class="flex items-center">
              <i class="fas fa-users text-purple-600 text-xl mr-3"></i>
              <text class="text-xl font-semibold text-gray-900">联系人与出行人</text>
            </view>
          </view>
          
          <view class="p-6 space-y-6">
            <!-- 联系人信息 -->
            <view>
              <view class="flex items-center mb-4">
                <i class="fas fa-address-book text-gray-400 mr-2"></i>
                <text class="text-lg font-medium text-gray-900">联系人信息</text>
              </view>
              
              <view class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <view>
                  <text class="text-sm font-medium text-gray-700 mb-2 block">联系人姓名</text>
                  <uni-easyinput 
                    placeholder="请输入联系人姓名" 
                    v-model="contactName"
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
                    }"
                  />
                </view>
                
                <view>
                  <text class="text-sm font-medium text-gray-700 mb-2 block">联系人电话</text>
                  <uni-easyinput 
                    placeholder="请输入联系人电话" 
                    v-model="contactPhone"
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
                    }"
                  />
                </view>
                
                <view>
                  <text class="text-sm font-medium text-gray-700 mb-2 block">联系人邮箱</text>
                  <uni-easyinput 
                    placeholder="请输入联系人邮箱" 
                    v-model="contactEmail"
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
                    }"
                  />
                </view>
              </view>
            </view>

            <!-- 出行人信息 -->
            <view>
              <view class="flex items-center justify-between mb-4">
                <view class="flex items-center">
                  <i class="fas fa-user-friends text-gray-400 mr-2"></i>
                  <text class="text-lg font-medium text-gray-900">出行人信息</text>
                </view>
                <button 
                  @click="addTraveler"
                  class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center"
                >
                  <i class="fas fa-plus mr-1"></i>
                  添加出行人
                </button>
              </view>
              
              <view v-if="!travelersArray.length" class="text-center py-8 text-gray-500">
                <i class="fas fa-user-plus text-4xl mb-2 text-gray-300"></i>
                <text class="block text-sm">暂无出行人信息，点击上方按钮添加</text>
              </view>
              
              <view v-else class="space-y-4">
                <view 
                  v-for="(traveler, index) in travelersArray" 
                  :key="index"
                  class="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <view class="flex items-center justify-between mb-3">
                    <text class="text-sm font-medium text-gray-700">出行人 {{index + 1}}</text>
                    <button 
                      @click="removeTraveler(index)"
                      class="text-red-500 hover:text-red-700 text-sm"
                    >
                      <i class="fas fa-trash mr-1"></i>删除
                    </button>
                  </view>
                  
                  <view class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <view>
                      <text class="text-xs text-gray-600 mb-1 block">姓名</text>
                      <uni-easyinput 
                        placeholder="出行人姓名" 
                        v-model="traveler.name"
                        :styles="{
                          color: '#333',
                          backgroundColor: '#fff',
                          borderColor: '#d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          height: '36px'
                        }"
                      />
                    </view>
                    
                    <view>
                      <text class="text-xs text-gray-600 mb-1 block">身份证号</text>
                      <uni-easyinput 
                        placeholder="身份证号码" 
                        v-model="traveler.id_card"
                        :styles="{
                          color: '#333',
                          backgroundColor: '#fff',
                          borderColor: '#d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          height: '36px'
                        }"
                      />
                    </view>
                    
                    <view>
                      <text class="text-xs text-gray-600 mb-1 block">手机号</text>
                      <uni-easyinput 
                        placeholder="手机号码" 
                        v-model="traveler.phone"
                        :styles="{
                          color: '#333',
                          backgroundColor: '#fff',
                          borderColor: '#d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          height: '36px'
                        }"
                      />
                    </view>
                    
                    <view>
                      <text class="text-xs text-gray-600 mb-1 block">护照号</text>
                      <uni-easyinput 
                        placeholder="护照号码（可选）" 
                        v-model="traveler.passport"
                        :styles="{
                          color: '#333',
                          backgroundColor: '#fff',
                          borderColor: '#d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          height: '36px'
                        }"
                      />
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 备注信息卡片 -->
        <view class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <view class="p-6 border-b border-gray-200">
            <view class="flex items-center">
              <i class="fas fa-sticky-note text-orange-600 text-xl mr-3"></i>
              <text class="text-xl font-semibold text-gray-900">备注信息</text>
            </view>
          </view>
          
          <view class="p-6">
      <uni-forms-item name="notes" label="订单备注">
              <template v-slot:label>
                <view class="flex items-center mb-2">
                  <i class="fas fa-comment-alt text-gray-400 mr-2"></i>
                  <text class="text-sm font-medium text-gray-700">订单备注</text>
                </view>
              </template>
              <uni-easyinput 
                type="textarea"
                placeholder="请输入订单备注信息" 
                v-model="formData.notes"
                :maxlength="1000"
                :styles="{
                  color: '#333',
                  backgroundColor: '#fff',
                  borderColor: '#d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  minHeight: '100px'
                }"
                :focus-style="{
                  borderColor: '#10b981'
                }"
              />
      </uni-forms-item>
          </view>
        </view>
               <!-- 按钮操作区域 -->
         <view class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
           <view class="p-6">
             <view class="flex items-center justify-between">
               <view class="flex items-center space-x-4">
                 <button 
                   @click="submit"
                   class="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-medium rounded-lg transition-colors duration-200 flex items-center"
                 >
                   <i class="fas fa-save mr-2"></i>
                   保存修改
                 </button>
                 
                 <button 
                   @click="resetForm"
                   class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-medium rounded-lg transition-colors duration-200 flex items-center"
                 >
                   <i class="fas fa-undo mr-2"></i>
                   重置
                 </button>
               </view>
               
               <button 
                 @click="goBack"
                 class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white text-lg font-medium rounded-lg transition-colors duration-200 flex items-center"
               >
                 <i class="fas fa-arrow-left mr-2"></i>
                 返回列表
               </button>
             </view>
           </view>
      </view>
    </uni-forms>
     </view>
  </view>
</template>

<script>
  import { validator } from '../../js_sdk/validator/a-orders.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'a-orders';

  function getValidator(fields) {
    let result = {}
    for (let key in validator) {
      if (fields.includes(key)) {
        result[key] = validator[key]
      }
    }
    return result
  }

  

  export default {
    data() {
      let formData = {
        "order_no": "",
        "user_id": "",
        "product_id": "",
        "product_snapshot": null,
        "status": "",
        "quantity": 1,
        "total_amount": 0,
        "discount_amount": 0,
        "coupon_discount": 0,
        "member_discount": 0,
        "final_amount": 0,
        "coupons_used": [],
        "member_level": "",
        "contact_info": {},
        "travelers": [],
        "departure_date": null,
        "return_date": null,
        "duration_days": 1,
        "special_requirements": "",
        "payment_info": null,
        "ctrip_sync": null,
        "notes": "",
        "created_at": null,
        "updated_at": null,
        "paid_at": null,
        "confirmed_at": null,
        "completed_at": null,
        "cancelled_at": null
      }
      return {
        formData,
        currentTime: '',
        userMobile: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        travelersArray: [],
        originalFormData: {},
        formOptions: {
          "status_localdata": [
            {
              "value": "pending",
              "text": "待支付"
            },
            {
              "value": "paid",
              "text": "已支付"
            },
            {
              "value": "confirmed",
              "text": "已确认"
            },
            {
              "value": "processing",
              "text": "处理中"
            },
            {
              "value": "completed",
              "text": "已完成"
            },
            {
              "value": "cancelled",
              "text": "已取消"
            },
            {
              "value": "refunded",
              "text": "已退款"
            }
          ],
          "member_level_localdata": [
            {
              "value": "normal",
              "text": "普通会员"
            },
            {
              "value": "silver",
              "text": "银卡会员"
            },
            {
              "value": "gold",
              "text": "金卡会员"
            },
            {
              "value": "diamond",
              "text": "钻石会员"
            }
          ]
        },
        rules: {
          ...getValidator(Object.keys(formData))
        }
      }
    },
    onLoad(e) {
      if (e.id) {
        const id = e.id
        this.formDataId = id
        this.getDetail(id)
      }
      this.updateCurrentTime()
      // 定时更新时间
      setInterval(() => {
        this.updateCurrentTime()
      }, 1000)
    },
    onReady() {
      this.$refs.form.setRules(this.rules)
    },
    methods: {
      /**
       * 更新当前时间
       */
      updateCurrentTime() {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        const seconds = String(now.getSeconds()).padStart(2, '0')
        this.currentTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      },

      /**
       * 返回上一页
       */
      goBack() {
        uni.navigateBack()
      },

      /**
       * 重置表单
       */
      resetForm() {
        uni.showModal({
          title: '确认重置',
          content: '是否要重置表单数据到最初状态？',
          success: (res) => {
            if (res.confirm) {
              this.formData = JSON.parse(JSON.stringify(this.originalFormData))
              this.syncContactInfo()
              this.syncTravelersInfo()
              uni.showToast({
                title: '表单已重置',
                icon: 'success'
              })
            }
          }
        })
      },

      /**
       * 添加出行人
       */
      addTraveler() {
        this.travelersArray.push({
          name: '',
          id_card: '',
          phone: '',
          passport: ''
        })
      },

      /**
       * 删除出行人
       */
      removeTraveler(index) {
        this.travelersArray.splice(index, 1)
      },

      /**
       * 同步联系人信息到formData
       */
      syncContactInfo() {
        this.formData.contact_info = {
          name: this.contactName,
          phone: this.contactPhone,
          email: this.contactEmail
        }
      },

      /**
       * 同步出行人信息到formData
       */
      syncTravelersInfo() {
        this.formData.travelers = [...this.travelersArray]
      },

      /**
       * 从formData初始化联系人和出行人信息
       */
      initContactAndTravelers() {
        // 初始化联系人信息
        if (this.formData.contact_info) {
          this.contactName = this.formData.contact_info.name || ''
          this.contactPhone = this.formData.contact_info.phone || ''
          this.contactEmail = this.formData.contact_info.email || ''
        }

        // 初始化出行人信息
        if (this.formData.travelers && Array.isArray(this.formData.travelers)) {
          this.travelersArray = [...this.formData.travelers]
        }
      },

      /**
       * 获取用户手机号
       */
      async getUserMobile(userId) {
        if (!userId) {
          this.userMobile = ''
          return
        }
        
        try {
          const res = await db.collection('uni-id-users')
            .doc(userId)
            .field('mobile')
            .get()
          
          if (res.result.data && res.result.data.length > 0) {
            this.userMobile = res.result.data[0].mobile || '未设置手机号'
          } else {
            this.userMobile = '用户不存在'
          }
        } catch (err) {
          console.error('获取用户手机号失败:', err)
          this.userMobile = '获取失败'
        }
      },
      
      /**
       * 验证表单并提交
       */
      submit() {
        // 先同步联系人和出行人信息
        this.syncContactInfo()
        this.syncTravelersInfo()

        uni.showLoading({
          mask: true
        })
        this.$refs.form.validate().then((res) => {
          return this.submitForm(res)
        }).catch(() => {
        }).finally(() => {
          uni.hideLoading()
        })
      },

      /**
       * 提交表单
       */
      submitForm(value) {
        // 使用 clientDB 提交数据
        return db.collection(dbCollectionName).doc(this.formDataId).update(value).then((res) => {
          uni.showToast({
            title: '修改成功'
          })
          this.getOpenerEventChannel().emit('refreshData')
          setTimeout(() => uni.navigateBack(), 500)
        }).catch((err) => {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          })
        })
      },

      /**
       * 获取表单数据
       * @param {Object} id
       */
      getDetail(id) {
        uni.showLoading({
          mask: true
        })
        db.collection(dbCollectionName).doc(id).field("order_no,user_id,product_id,product_snapshot,status,quantity,total_amount,discount_amount,coupon_discount,member_discount,final_amount,coupons_used,member_level,contact_info,travelers,departure_date,return_date,duration_days,special_requirements,payment_info,ctrip_sync,notes,created_at,updated_at,paid_at,confirmed_at,completed_at,cancelled_at").get().then((res) => {
          const data = res.result.data[0]
          if (data) {
            this.formData = data
            this.originalFormData = JSON.parse(JSON.stringify(data))
            this.initContactAndTravelers()
            // 获取用户手机号
            this.getUserMobile(data.user_id)
          }
        }).catch((err) => {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          })
        }).finally(() => {
          uni.hideLoading()
        })
      }
    },

    watch: {
      // 监听联系人信息变化
      contactName() {
        this.syncContactInfo()
      },
      contactPhone() {
        this.syncContactInfo()
      },
      contactEmail() {
        this.syncContactInfo()
      },
      // 监听出行人信息变化
      travelersArray: {
        handler() {
          this.syncTravelersInfo()
        },
        deep: true
      },
      // 监听用户ID变化，自动获取手机号
      'formData.user_id'(newUserId) {
        this.getUserMobile(newUserId)
      }
    }
  }
</script>
