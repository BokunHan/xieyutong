<template>
  <view class="min-h-screen bg-gray-50" style="font-family: 'Microsoft YaHei', sans-serif;">
    <!-- 页面头部 -->
    <view class="bg-white shadow-sm border-b border-gray-200 p-8">
      <view class="max-w-7xl mx-auto">
        <!-- 页面标题 -->
        <view class="mb-8">
          <view class="flex items-center mb-4">
            <i class="fas fa-share-alt text-green-600 text-3xl mr-4"></i>
            <text class="text-3xl font-bold text-gray-900">推荐记录管理</text>
          </view>
          <text class="text-lg text-gray-600">管理用户推荐关系和优惠券发放记录，跟踪推荐效果</text>
        </view>

        <!-- 工具栏 -->
        <view class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <!-- 搜索区域 -->
          <view class="flex flex-col sm:flex-row gap-4">
            <view class="relative flex-1 min-w-80">
              <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"></i>
              <uni-easyinput 
                v-model="query" 
                @confirm="search"
                :styles="searchInputStyles"
                placeholder="搜索推荐人ID、被推荐人ID、订单ID..."
                :clearable="true"
              />
            </view>
            <button @click="search" 
                    class="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-lg flex items-center justify-center min-w-28">
              <i class="fas fa-search mr-2"></i>
              搜索
            </button>
          </view>

          <!-- 操作按钮组 -->
          <view class="flex flex-wrap gap-3">
            <button @click="navigateTo('./add')"
                    class="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium text-lg flex items-center">
              <i class="fas fa-plus mr-2"></i>
              新增推荐记录
            </button>
            <button @click="delTable" 
                    :disabled="!selectedIndexs.length"
                    :class="[
                      'px-6 py-4 rounded-lg transition-colors duration-200 font-medium text-lg flex items-center',
                      selectedIndexs.length ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    ]">
              <i class="fas fa-trash mr-2"></i>
              批量删除 ({{ selectedIndexs.length }})
            </button>
            <download-excel 
              :fields="exportExcel.fields" 
              :data="exportExcelData" 
              :type="exportExcel.type" 
              :name="exportExcel.filename">
              <button class="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium text-lg flex items-center">
                <i class="fas fa-file-excel mr-2"></i>
                导出Excel
              </button>
            </download-excel>
          </view>
        </view>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <view class="max-w-7xl mx-auto p-8">
      <!-- 数据统计卡片 -->
      <view class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <view class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <view class="flex items-center">
            <view class="p-3 bg-green-100 rounded-lg">
              <i class="fas fa-share-alt text-green-600 text-2xl"></i>
            </view>
            <view class="ml-4">
              <text class="text-2xl font-bold text-gray-900">{{ totalCount }}</text>
              <text class="block text-sm text-gray-600">总推荐记录</text>
            </view>
          </view>
        </view>
        
        <view class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <view class="flex items-center">
            <view class="p-3 bg-blue-100 rounded-lg">
              <i class="fas fa-check-circle text-blue-600 text-2xl"></i>
            </view>
            <view class="ml-4">
              <text class="text-2xl font-bold text-gray-900">{{ completedCount }}</text>
              <text class="block text-sm text-gray-600">已完成</text>
            </view>
          </view>
        </view>
        
        <view class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <view class="flex items-center">
            <view class="p-3 bg-yellow-100 rounded-lg">
              <i class="fas fa-clock text-yellow-600 text-2xl"></i>
            </view>
            <view class="ml-4">
              <text class="text-2xl font-bold text-gray-900">{{ pendingCount }}</text>
              <text class="block text-sm text-gray-600">待处理</text>
            </view>
          </view>
        </view>
        
        <view class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <view class="flex items-center">
            <view class="p-3 bg-purple-100 rounded-lg">
              <i class="fas fa-coins text-purple-600 text-2xl"></i>
            </view>
            <view class="ml-4">
              <text class="text-2xl font-bold text-gray-900">¥{{ totalAmount }}</text>
              <text class="block text-sm text-gray-600">总奖励金额</text>
            </view>
          </view>
        </view>
      </view>

             <!-- 数据表格 -->
       <view class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <unicloud-db 
           ref="udb" 
           :collection="collectionList" 
           field="referrer_id,referee_id,order_id,order_amount,referrer_coupon_id,referee_coupon_id,referrer_coupon_amount,referee_coupon_amount,status,order_date,coupon_sent_date,remark" 
           :where="where" 
           page-data="replace"
           :orderby="orderby" 
           :getcount="true" 
           :page-size="options.pageSize" 
           :page-current="options.pageCurrent"
           v-slot:default="{data,pagination,loading,error,options}" 
           :options="options" 
           loadtime="manual" 
           @load="onqueryload">
           
           <!-- 表格头部 -->
           <view class="px-6 py-4 bg-gray-50 border-b border-gray-200">
             <view class="flex items-center justify-between">
               <text class="text-lg font-semibold text-gray-900">推荐记录列表</text>
               <text class="text-sm text-gray-600">共 {{ pagination.count }} 条记录</text>
             </view>
           </view>

           <!-- 表格内容 -->
           <view class="overflow-x-auto">
             <uni-table 
               ref="table" 
               :loading="loading" 
               :emptyText="error.message || '暂无数据'" 
               border 
               stripe 
               type="selection" 
               @selection-change="selectionChange"
               class="text-base">
               <uni-tr class="bg-gray-50">
                 <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'referrer_id')" sortable @sort-change="sortChange($event, 'referrer_id')" class="text-sm font-semibold text-gray-700 py-4">
                   <view class="flex items-center justify-center">
                     <i class="fas fa-user-plus mr-2"></i>
                     推荐人ID
                   </view>
                 </uni-th>
                 <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'referee_id')" sortable @sort-change="sortChange($event, 'referee_id')" class="text-sm font-semibold text-gray-700 py-4">
                   <view class="flex items-center justify-center">
                     <i class="fas fa-user-check mr-2"></i>
                     被推荐人ID
                   </view>
                 </uni-th>
                 <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'order_id')" sortable @sort-change="sortChange($event, 'order_id')" class="text-sm font-semibold text-gray-700 py-4">
                   <view class="flex items-center justify-center">
                     <i class="fas fa-receipt mr-2"></i>
                     关联订单ID
                   </view>
                 </uni-th>
                 <uni-th align="center" sortable @sort-change="sortChange($event, 'order_amount')" class="text-sm font-semibold text-gray-700 py-4">
                   <view class="flex items-center justify-center">
                     <i class="fas fa-money-bill mr-2"></i>
                     订单金额
                   </view>
                 </uni-th>
                 <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'referrer_coupon_id')" class="text-sm font-semibold text-gray-700 py-4">
                   <view class="flex items-center justify-center">
                     <i class="fas fa-gift mr-2"></i>
                     推荐感谢券
                   </view>
                 </uni-th>
                 <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'referee_coupon_id')" class="text-sm font-semibold text-gray-700 py-4">
                   <view class="flex items-center justify-center">
                     <i class="fas fa-ticket-alt mr-2"></i>
                     新人专享券
                   </view>
                 </uni-th>
                 <uni-th align="center" filter-type="select" :filter-data="options.filterData.status_localdata" @filter-change="filterChange($event, 'status')" class="text-sm font-semibold text-gray-700 py-4">
                   <view class="flex items-center justify-center">
                     <i class="fas fa-toggle-on mr-2"></i>
                     状态
                   </view>
                 </uni-th>
                 <uni-th align="center" filter-type="timestamp" @filter-change="filterChange($event, 'order_date')" sortable @sort-change="sortChange($event, 'order_date')" class="text-sm font-semibold text-gray-700 py-4">
                   <view class="flex items-center justify-center">
                     <i class="fas fa-calendar mr-2"></i>
                     订单日期
                   </view>
                 </uni-th>
                 <uni-th align="center" class="text-sm font-semibold text-gray-700 py-4">
                   <view class="flex items-center justify-center">
                     <i class="fas fa-comment mr-2"></i>
                     备注
                   </view>
                 </uni-th>
                 <uni-th align="center" class="text-sm font-semibold text-gray-700 py-4">
                   <view class="flex items-center justify-center">
                     <i class="fas fa-cog mr-2"></i>
                     操作
                   </view>
                                   </uni-th>
                </uni-tr>
                
                                <uni-tr v-for="(item,index) in data" :key="index" class="hover:bg-gray-50 transition-colors">
                 <uni-td align="center" class="py-4 text-base">
                   <view class="flex items-center justify-center">
                     <view class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                       <i class="fas fa-user-plus text-green-600"></i>
                     </view>
                     <text class="font-mono text-gray-700">{{ item.referrer_id || '-' }}</text>
                   </view>
                 </uni-td>
                 <uni-td align="center" class="py-4 text-base">
                   <view class="flex items-center justify-center">
                     <view class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                       <i class="fas fa-user-check text-blue-600"></i>
                     </view>
                     <text class="font-mono text-gray-700">{{ item.referee_id || '-' }}</text>
                   </view>
                 </uni-td>
                 <uni-td align="center" class="py-4 text-base">
                   <text class="font-mono text-blue-600 hover:underline cursor-pointer">{{ item.order_id || '-' }}</text>
                 </uni-td>
                 <uni-td align="center" class="py-4 text-base">
                   <span class="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                     <i class="fas fa-yen-sign mr-1"></i>
                     {{ item.order_amount ? item.order_amount.toFixed(2) : '0.00' }}
                   </span>
                 </uni-td>
                 <uni-td align="center" class="py-4 text-base">
                   <view class="text-center">
                     <text class="block font-mono text-gray-600 text-xs">{{ item.referrer_coupon_id || '-' }}</text>
                     <span v-if="item.referrer_coupon_amount" class="inline-flex px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                       ¥{{ item.referrer_coupon_amount }}
                     </span>
                   </view>
                 </uni-td>
                 <uni-td align="center" class="py-4 text-base">
                   <view class="text-center">
                     <text class="block font-mono text-gray-600 text-xs">{{ item.referee_coupon_id || '-' }}</text>
                     <span v-if="item.referee_coupon_amount" class="inline-flex px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                       ¥{{ item.referee_coupon_amount }}
                     </span>
                   </view>
                 </uni-td>
                 <uni-td align="center" class="py-4 text-base">
                   <span :class="[
                     'inline-flex px-3 py-1 rounded-full text-sm font-medium items-center',
                     item.status === 'completed' ? 'bg-green-100 text-green-800' : 
                     item.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                   ]">
                     <i :class="[
                       'mr-1',
                       item.status === 'completed' ? 'fas fa-check-circle' : 
                       item.status === 'confirmed' ? 'fas fa-clock' : 'fas fa-hourglass-half'
                     ]"></i>
                     {{ options.status_valuetotext[item.status] }}
                   </span>
                 </uni-td>
                 <uni-td align="center" class="py-4 text-base">
                   <text class="text-gray-600">
                     <uni-dateformat :threshold="[0, 0]" :date="item.order_date"></uni-dateformat>
                   </text>
                 </uni-td>
                 <uni-td align="center" class="py-4 text-base">
                   <text class="text-gray-600 text-sm max-w-32 truncate" :title="item.remark">{{ item.remark || '-' }}</text>
                 </uni-td>
                 <uni-td align="center" class="py-4 text-base">
                   <view class="flex items-center justify-center gap-2">
                     <button @click="navigateTo('./edit?id='+item._id, false)" 
                             class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium flex items-center">
                       <i class="fas fa-edit mr-1"></i>
                       编辑
                     </button>
                     <button @click="confirmDelete(item._id)" 
                             class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium flex items-center">
                       <i class="fas fa-trash mr-1"></i>
                       删除
                     </button>
                   </view>
                 </uni-td>
               </uni-tr>
             </uni-table>
           </view>

           <!-- 分页 -->
           <view v-if="pagination.count > 0" class="px-6 py-6 bg-gray-50 border-t border-gray-200">
             <view class="flex flex-col sm:flex-row items-center justify-between gap-4">
               <text class="text-sm text-gray-600">
                 显示第 {{ (pagination.current - 1) * pagination.size + 1 }} - {{ Math.min(pagination.current * pagination.size, pagination.count) }} 条，共 {{ pagination.count }} 条记录
               </text>
               <uni-pagination 
                 show-icon 
                 :page-size="pagination.size" 
                 v-model="pagination.current" 
                 :total="pagination.count" 
                 @change="onPageChanged"
                 class="pagination-modern" />
             </view>
           </view>
                   </unicloud-db>
      </view>
    </view>
  </view>
</template>

<script>
import { enumConverter, filterToWhere } from '../../js_sdk/validator/a-referrals.js';

const db = uniCloud.database()
// 表查询配置
const dbOrderBy = 'order_date desc' // 排序字段
const dbSearchFields = ['referrer_id', 'referee_id', 'order_id'] // 模糊搜索字段
// 分页配置
const pageSize = 15
const pageCurrent = 1

const orderByMapping = {
  "ascending": "asc",
  "descending": "desc"
}

export default {
  data() {
    return {
      collectionList: "a-referrals",
      query: '',
      where: '',
      orderby: dbOrderBy,
      orderByFieldName: "",
      selectedIndexs: [],
      totalCount: 0,
      completedCount: 0,
      pendingCount: 0,
      totalAmount: 0,
      options: {
        pageSize,
        pageCurrent,
        filterData: {
          "status_localdata": [
            {
              "value": "pending",
              "text": "待处理"
            },
            {
              "value": "confirmed",
              "text": "已确认"
            },
            {
              "value": "completed",
              "text": "已完成"
            }
          ]
        },
        ...enumConverter
      },
      // uni-easyinput 样式配置
      searchInputStyles: {
        borderRadius: '8px',
        borderColor: '#d1d5db',
        fontSize: '16px',
        padding: '16px 16px 16px 48px',
        backgroundColor: '#f9fafb'
      },
      exportExcel: {
        "filename": "推荐记录管理.xlsx",
        "type": "xlsx",
        "fields": {
          "推荐人ID": "referrer_id",
          "被推荐人ID": "referee_id",
          "关联订单ID": "order_id",
          "订单金额": "order_amount",
          "推荐感谢券ID": "referrer_coupon_id",
          "新人专享券ID": "referee_coupon_id",
          "推荐感谢券金额": "referrer_coupon_amount",
          "新人专享券金额": "referee_coupon_amount",
          "状态": "status",
          "订单日期": "order_date",
          "优惠券发放日期": "coupon_sent_date",
          "备注": "remark"
        }
      },
      exportExcelData: []
    }
  },
    onLoad() {
      this._filter = {}
    },
    onReady() {
      this.$refs.udb.loadData()
    },
    methods: {
      onqueryload(data) {
        this.exportExcelData = data
        this.calculateStats(data)
      },
      calculateStats(data) {
        this.totalCount = data.length
        this.completedCount = data.filter(item => item.status === 'completed').length
        this.pendingCount = data.filter(item => item.status === 'pending').length
        
        // 计算总奖励金额
        this.totalAmount = data.reduce((total, item) => {
          const referrerAmount = item.referrer_coupon_amount || 0
          const refereeAmount = item.referee_coupon_amount || 0
          return total + referrerAmount + refereeAmount
        }, 0).toFixed(2)
      },
      getWhere() {
        const query = this.query.trim()
        if (!query) {
          return ''
        }
        const queryRe = new RegExp(query, 'i')
        return dbSearchFields.map(name => queryRe + '.test(' + name + ')').join(' || ')
      },
      search() {
        const newWhere = this.getWhere()
        this.where = newWhere
        this.$nextTick(() => {
          this.loadData()
        })
      },
      loadData(clear = true) {
        this.$refs.udb.loadData({
          clear
        })
      },
      onPageChanged(e) {
        this.selectedIndexs.length = 0
        this.$refs.table.clearSelection()
        this.$refs.udb.loadData({
          current: e.current
        })
      },
      navigateTo(url, clear) {
        uni.navigateTo({
          url,
          events: {
            refreshData: () => {
              this.loadData(clear)
            }
          }
        })
      },
      selectedItems() {
        var dataList = this.$refs.udb.dataList
        return this.selectedIndexs.map(i => dataList[i]._id)
      },
      delTable() {
        if (!this.selectedIndexs.length) return
        
        uni.showModal({
          title: '确认删除',
          content: `确定要删除选中的 ${this.selectedIndexs.length} 个推荐记录吗？此操作不可恢复。`,
          confirmColor: '#dc2626',
          success: (res) => {
            if (res.confirm) {
              this.$refs.udb.remove(this.selectedItems(), {
                success: (res) => {
                  this.$refs.table.clearSelection()
                  uni.showToast({
                    title: '删除成功',
                    icon: 'success'
                  })
                },
                fail: (err) => {
                  uni.showToast({
                    title: '删除失败',
                    icon: 'none'
                  })
                }
              })
            }
          }
        })
      },
      selectionChange(e) {
        this.selectedIndexs = e.detail.index
      },
      confirmDelete(id) {
        uni.showModal({
          title: '确认删除',
          content: '确定要删除这个推荐记录吗？此操作不可恢复。',
          confirmColor: '#dc2626',
          success: (res) => {
            if (res.confirm) {
              this.$refs.udb.remove(id, {
                success: (res) => {
                  this.$refs.table.clearSelection()
                  uni.showToast({
                    title: '删除成功',
                    icon: 'success'
                  })
                },
                fail: (err) => {
                  uni.showToast({
                    title: '删除失败',
                    icon: 'none'
                  })
                }
              })
            }
          }
        })
      },
      sortChange(e, name) {
        this.orderByFieldName = name;
        if (e.order) {
          this.orderby = name + ' ' + orderByMapping[e.order]
        } else {
          this.orderby = dbOrderBy
        }
        this.$refs.table.clearSelection()
        this.$nextTick(() => {
          this.$refs.udb.loadData()
        })
      },
      filterChange(e, name) {
        this._filter[name] = {
          type: e.filterType,
          value: e.filter
        }
        let newWhere = filterToWhere(this._filter, db.command)
        if (Object.keys(newWhere).length) {
          this.where = newWhere
        } else {
          this.where = ''
        }
        this.$nextTick(() => {
          this.$refs.udb.loadData()
        })
      }
    }
  }
</script>

<style scoped>
/* 自定义分页样式 */
.pagination-modern {
  --uni-color-primary: #2563eb;
}

/* 搜索框focus样式增强 */
.search-input-focus {
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* 表格悬停效果 */
.table-hover-row:hover {
  background-color: #f8fafc;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 状态徽章动画 */
.status-badge {
  transition: all 0.2s ease-in-out;
}

.status-badge:hover {
  transform: scale(1.05);
}

/* 卡片悬停效果 */
.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* 按钮组间距 */
.button-group {
  gap: 8px;
}

/* 金额显示特效 */
.amount-badge {
  background: linear-gradient(45deg, #10b981, #059669);
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 优惠券标签 */
.coupon-badge {
  border: 1px solid;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .table-responsive {
    overflow-x: auto;
  }
  
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .button-group {
    flex-direction: column;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}
</style>
