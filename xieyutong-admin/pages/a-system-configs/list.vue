<template>
  <view class="min-h-screen bg-gray-50" style="font-family: 'Microsoft YaHei', sans-serif;">
    <!-- 页面头部 -->
    <view class="bg-white shadow-sm border-b border-gray-200 p-8">
      <view class="max-w-7xl mx-auto">
        <!-- 页面标题 -->
        <view class="mb-8">
          <view class="flex items-center mb-4">
            <i class="fas fa-cogs text-indigo-600 text-3xl mr-4"></i>
            <text class="text-3xl font-bold text-gray-900">系统配置管理</text>
          </view>
          <text class="text-lg text-gray-600">管理系统核心配置参数，包括会员规则、优惠券规则、应用设置等</text>
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
                placeholder="搜索配置键名、描述、类型..."
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
              新增配置
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
              <button class="px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium text-lg flex items-center">
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
      <view class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- 总配置数 -->
        <view class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <view class="flex items-center justify-between">
            <view>
              <text class="text-sm font-medium text-gray-600">总配置数</text>
              <text class="text-3xl font-bold text-gray-900 mt-2">{{ totalConfigs }}</text>
            </view>
            <view class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-cogs text-blue-600 text-xl"></i>
            </view>
          </view>
          <view class="mt-4 flex items-center text-sm">
            <text class="text-gray-600">系统配置总数量</text>
          </view>
        </view>

        <!-- 激活配置数 -->
        <view class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <view class="flex items-center justify-between">
            <view>
              <text class="text-sm font-medium text-gray-600">激活配置</text>
              <text class="text-3xl font-bold text-green-600 mt-2">{{ activeConfigs }}</text>
            </view>
            <view class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-check-circle text-green-600 text-xl"></i>
            </view>
          </view>
          <view class="mt-4 flex items-center text-sm">
            <text class="text-gray-600">当前生效配置数</text>
          </view>
        </view>

        <!-- 应用设置 -->
        <view class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <view class="flex items-center justify-between">
            <view>
              <text class="text-sm font-medium text-gray-600">应用设置</text>
              <text class="text-3xl font-bold text-purple-600 mt-2">{{ appSettingsCount }}</text>
            </view>
            <view class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-mobile-alt text-purple-600 text-xl"></i>
            </view>
          </view>
          <view class="mt-4 flex items-center text-sm">
            <text class="text-gray-600">应用相关配置</text>
          </view>
        </view>

        <!-- 业务规则 -->
        <view class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <view class="flex items-center justify-between">
            <view>
              <text class="text-sm font-medium text-gray-600">业务规则</text>
              <text class="text-3xl font-bold text-orange-600 mt-2">{{ businessRulesCount }}</text>
            </view>
            <view class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-business-time text-orange-600 text-xl"></i>
            </view>
          </view>
          <view class="mt-4 flex items-center text-sm">
            <text class="text-gray-600">业务规则配置</text>
          </view>
        </view>
      </view>
      
      <!-- 数据表格 -->
      <view class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <unicloud-db ref="udb" :collection="collectionList" field="config_key,config_value,config_type,description,status,version,effective_date,created_by,updated_by,created_at,updated_at" :where="where" page-data="replace"
          :orderby="orderby" :getcount="true" :page-size="options.pageSize" :page-current="options.pageCurrent"
          v-slot:default="{data,pagination,loading,error,options}" :options="options" loadtime="manual" @load="onqueryload">
                     <uni-table ref="table" :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection" @selection-change="selectionChange" class="modern-table">
             <uni-tr class="table-header">
               <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'config_key')" sortable @sort-change="sortChange($event, 'config_key')" class="th-config-key">
                 <view class="flex items-center justify-center gap-2">
                   <i class="fas fa-key text-blue-600"></i>
                   <text class="font-medium">配置键名</text>
                 </view>
               </uni-th>
               <uni-th align="center" sortable @sort-change="sortChange($event, 'config_value')" class="th-config-value">
                 <view class="flex items-center justify-center gap-2">
                   <i class="fas fa-code text-green-600"></i>
                   <text class="font-medium">配置值</text>
                 </view>
               </uni-th>
               <uni-th align="center" filter-type="select" :filter-data="options.filterData.config_type_localdata" @filter-change="filterChange($event, 'config_type')" class="th-config-type">
                 <view class="flex items-center justify-center gap-2">
                   <i class="fas fa-tags text-cyan-400"></i>
                   <text class="font-medium">配置类型</text>
                 </view>
               </uni-th>
               <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'description')" sortable @sort-change="sortChange($event, 'description')" class="th-description">
                 <view class="flex items-center justify-center gap-2">
                   <i class="fas fa-info-circle text-gray-600"></i>
                   <text class="font-medium">配置描述</text>
                 </view>
               </uni-th>
               <uni-th align="center" filter-type="select" :filter-data="options.filterData.status_localdata" @filter-change="filterChange($event, 'status')" class="th-status">
                 <view class="flex items-center justify-center gap-2">
                   <i class="fas fa-toggle-on text-green-600"></i>
                   <text class="font-medium">状态</text>
                 </view>
               </uni-th>
               <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'version')" sortable @sort-change="sortChange($event, 'version')" class="th-version">
                 <view class="flex items-center justify-center gap-2">
                   <i class="fas fa-code-branch text-indigo-600"></i>
                   <text class="font-medium">版本号</text>
                 </view>
               </uni-th>
               <uni-th align="center" filter-type="timestamp" @filter-change="filterChange($event, 'effective_date')" sortable @sort-change="sortChange($event, 'effective_date')" class="th-effective-date">
                 <view class="flex items-center justify-center gap-2">
                   <i class="fas fa-calendar-check text-orange-600"></i>
                   <text class="font-medium">生效时间</text>
                 </view>
               </uni-th>
               <uni-th align="center" class="th-actions">
                 <view class="flex items-center justify-center gap-2">
                   <i class="fas fa-tools text-gray-600"></i>
                   <text class="font-medium">操作</text>
                 </view>
               </uni-th>
             </uni-tr>
                         <uni-tr v-for="(item,index) in data" :key="index" class="table-row hover:bg-gray-50">
               <!-- 配置键名 -->
               <uni-td align="left" class="p-4">
                 <view class="flex items-center gap-3">
                   <view class="w-2 h-2 bg-blue-400 rounded-full"></view>
                   <text class="font-mono text-sm font-medium text-gray-900">{{ item.config_key }}</text>
                 </view>
               </uni-td>
               
               <!-- 配置值 - 可点击编辑 -->
               <uni-td align="left" class="p-4">
                 <view class="max-w-xs">
                   <view @click="openEditPopup(item)" class="cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-3 transition-colors">
                     <view class="flex items-center justify-between">
                       <text class="text-sm text-gray-600 truncate flex-1 mr-2">
                         {{ formatConfigValue(item.config_value) }}
                       </text>
                       <i class="fas fa-edit text-blue-500 text-xs"></i>
                     </view>
                   </view>
                 </view>
               </uni-td>
               
               <!-- 配置类型 -->
               <uni-td align="center" class="p-4">
                 <view :class="getTypeTagClass(item.config_type)" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium">
                   <i :class="getTypeIcon(item.config_type)" class="mr-1"></i>
                   {{ getTypeDisplayName(item.config_type) }}
                 </view>
               </uni-td>
               
               <!-- 配置描述 -->
               <uni-td align="left" class="p-4">
                 <text class="text-sm text-gray-700 line-clamp-2">{{ item.description }}</text>
               </uni-td>
               
               <!-- 状态 -->
               <uni-td align="center" class="p-4">
                 <view :class="item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" 
                       class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium">
                   <i :class="item.status === 'active' ? 'fas fa-check-circle' : 'fas fa-times-circle'" class="mr-1"></i>
                   {{ item.status === 'active' ? '启用' : '禁用' }}
                 </view>
               </uni-td>
               
               <!-- 版本号 -->
               <uni-td align="center" class="p-4">
                 <view class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                   v{{ item.version }}
                 </view>
               </uni-td>
               
               <!-- 生效时间 -->
               <uni-td align="center" class="p-4">
                 <view class="text-sm text-gray-600">
                   <i class="fas fa-calendar text-orange-500 mr-1"></i>
                   <uni-dateformat :threshold="[0, 0]" :date="item.effective_date" format="yyyy-MM-dd hh:mm"></uni-dateformat>
                 </view>
               </uni-td>
               
               <!-- 操作 -->
               <uni-td align="center" class="p-4">
                 <view class="flex items-center justify-center gap-2">
                   <button @click="openEditPopup(item)" 
                           class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium flex items-center">
                     <i class="fas fa-edit mr-1"></i>
                     快速编辑
                   </button>
                   <button @click="navigateTo('./edit?id='+item._id, false)" 
                           class="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium flex items-center">
                     <i class="fas fa-cog mr-1"></i>
                     详细编辑
                   </button>
                   <button @click="confirmDelete(item._id)" 
                           class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium flex items-center">
                     <i class="fas fa-trash mr-1"></i>
                     删除
                   </button>
                 </view>
               </uni-td>
             </uni-tr>
          </uni-table>
          <view class="uni-pagination-box">
            <uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current" :total="pagination.count" @change="onPageChanged" />
          </view>
        </unicloud-db>
      </view>
    </view>

    <!-- 配置编辑弹窗 -->
    <uni-popup ref="configEditPopup" type="center" :mask-click="false">
      <view class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <view class="flex items-center justify-between mb-4">
          <text class="text-xl font-bold text-gray-900">编辑配置</text>
          <button @click="closeEditPopup" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-lg"></i>
          </button>
        </view>
        
        <view v-if="editingConfig" class="space-y-4">
          <view>
            <text class="block text-sm font-medium text-gray-700 mb-2">配置键名</text>
            <text class="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">{{ editingConfig.config_key }}</text>
          </view>
          
          <view>
            <text class="block text-sm font-medium text-gray-700 mb-2">配置值</text>
            <uni-easyinput 
              v-model="editingConfigValue" 
              :styles="modalInputStyles"
              placeholder="请输入配置值"
              type="textarea"
              :autoHeight="true"
            />
          </view>
          
          <view>
            <text class="block text-sm font-medium text-gray-700 mb-2">配置描述</text>
            <text class="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">{{ editingConfig.description }}</text>
          </view>
          
          <view class="flex justify-end gap-3 pt-4 border-t">
            <button @click="closeEditPopup" 
                    class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">
              取消
            </button>
            <button @click="saveConfig" 
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              保存
            </button>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
  import { enumConverter, filterToWhere } from '../../js_sdk/validator/a-system-configs.js';

  const db = uniCloud.database()
  // 表查询配置
  const dbOrderBy = '' // 排序字段
  const dbSearchFields = [] // 模糊搜索字段，支持模糊搜索的字段列表。联表查询格式: 主表字段名.副表字段名，例如用户表关联角色表 role.role_name
  // 分页配置
  const pageSize = 20
  const pageCurrent = 1

  const orderByMapping = {
    "ascending": "asc",
    "descending": "desc"
  }

  export default {
    data() {
      return {
        collectionList: "a-system-configs",
        query: '',
        where: '',
        orderby: dbOrderBy,
        orderByFieldName: "",
        selectedIndexs: [],
        options: {
          pageSize,
          pageCurrent,
          filterData: {
            "config_type_localdata": [
              {
                "value": "member_upgrade",
                "text": "member_upgrade"
              },
              {
                "value": "coupon_rules",
                "text": "coupon_rules"
              },
              {
                "value": "referral_rules",
                "text": "referral_rules"
              },
              {
                "value": "system_params",
                "text": "system_params"
              },
              {
                "value": "app_settings",
                "text": "app_settings"
              },
              {
                "value": "legal_docs",
                "text": "legal_docs"
              }
            ],
            "status_localdata": [
              {
                "value": "active",
                "text": "active"
              },
              {
                "value": "inactive",
                "text": "inactive"
              }
            ]
          },
          ...enumConverter
        },
        imageStyles: {
          width: 64,
          height: 64
        },
        exportExcel: {
          "filename": "a-system-configs.xls",
          "type": "xls",
          "fields": {
            "配置键名": "config_key",
            "配置值": "config_value",
            "配置类型": "config_type",
            "配置描述": "description",
            "状态": "status",
            "版本号": "version",
            "生效时间": "effective_date",
            "创建人": "created_by",
            "修改人": "updated_by",
            "created_at": "created_at",
            "updated_at": "updated_at"
          }
        },
        exportExcelData: [],
        editingConfig: null,
        editingConfigValue: '',
        searchInputStyles: {
          paddingLeft: '32px'
        },
        modalInputStyles: {
          padding: '12px'
        },
        // 统计数据
        totalConfigs: 0,
        activeConfigs: 0,
        appSettingsCount: 0,
        businessRulesCount: 0
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
      
      // 计算统计数据
      calculateStats(data) {
        this.totalConfigs = data.length
        this.activeConfigs = data.filter(item => item.status === 'active').length
        this.appSettingsCount = data.filter(item => item.config_type === 'app_settings').length
        this.businessRulesCount = data.filter(item => 
          ['member_upgrade', 'coupon_rules', 'referral_rules'].includes(item.config_type)
        ).length
      },
      
      // 格式化配置值显示
      formatConfigValue(value) {
        if (!value) return '未设置'
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value)
            if (typeof parsed === 'object') {
              // 如果是JSON对象，显示简化信息
              const keys = Object.keys(parsed)
              return `JSON对象 (${keys.length}个属性)`
            }
          } catch (e) {
            // 不是JSON，直接截取显示
            return value.length > 50 ? value.substring(0, 50) + '...' : value
          }
        }
        return value.toString()
      },
      
      // 获取类型标签样式
      getTypeTagClass(type) {
        const classMap = {
          'member_upgrade': 'bg-blue-100 text-blue-800',
          'coupon_rules': 'bg-green-100 text-green-800',
          'referral_rules': 'bg-cyan-100 text-cyan-800',
          'system_params': 'bg-gray-100 text-gray-800',
          'app_settings': 'bg-orange-100 text-orange-800',
          'legal_docs': 'bg-red-100 text-red-800'
        }
        return classMap[type] || 'bg-gray-100 text-gray-800'
      },
      
      // 获取类型图标
      getTypeIcon(type) {
        const iconMap = {
          'member_upgrade': 'fas fa-star',
          'coupon_rules': 'fas fa-ticket-alt',
          'referral_rules': 'fas fa-share-alt',
          'system_params': 'fas fa-cogs',
          'app_settings': 'fas fa-mobile-alt',
          'legal_docs': 'fas fa-file-contract'
        }
        return iconMap[type] || 'fas fa-cog'
      },
      
      // 获取类型显示名称
      getTypeDisplayName(type) {
        const nameMap = {
          'member_upgrade': '会员升级',
          'coupon_rules': '优惠券规则',
          'referral_rules': '推荐规则',
          'system_params': '系统参数',
          'app_settings': '应用设置',
          'legal_docs': '法律文档'
        }
        return nameMap[type] || type
      },
      
      // 打开编辑弹窗
      openEditPopup(config) {
        this.editingConfig = config
        this.editingConfigValue = typeof config.config_value === 'string' 
          ? config.config_value 
          : JSON.stringify(config.config_value, null, 2)
        this.$refs.configEditPopup.open()
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
        // clear 表示刷新列表时是否清除页码，true 表示刷新并回到列表第 1 页，默认为 true
        uni.navigateTo({
          url,
          events: {
            refreshData: () => {
              this.loadData(clear)
            }
          }
        })
      },
      // 多选处理
      selectedItems() {
        var dataList = this.$refs.udb.dataList
        return this.selectedIndexs.map(i => dataList[i]._id)
      },
      // 批量删除
      delTable() {
        this.$refs.udb.remove(this.selectedItems(), {
          success:(res) => {
            this.$refs.table.clearSelection()
          }
        })
      },
      // 多选
      selectionChange(e) {
        this.selectedIndexs = e.detail.index
      },
      confirmDelete(id) {
        uni.showModal({
          title: '确认删除',
          content: '确定要删除这个配置吗？删除后不可恢复！',
          confirmColor: '#ef4444',
          success: (res) => {
            if (res.confirm) {
              this.$refs.udb.remove(id, {
                success: (result) => {
                  this.$refs.table.clearSelection()
                  uni.showToast({
                    title: '删除成功',
                    icon: 'success'
                  })
                },
                fail: (error) => {
                  uni.showToast({
                    title: '删除失败',
                    icon: 'error'
                  })
                  console.error('删除配置失败:', error)
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
          this.orderby = ''
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
      },
      closeEditPopup() {
        this.editingConfig = null
        this.editingConfigValue = ''
        this.$refs.configEditPopup.close()
      },
      
      // 保存配置
      async saveConfig() {
        if (!this.editingConfig || !this.editingConfigValue.trim()) {
          uni.showToast({
            title: '配置值不能为空',
            icon: 'error'
          })
          return
        }
        
        try {
          // 验证JSON格式（如果看起来像JSON）
          let configValue = this.editingConfigValue.trim()
          if (configValue.startsWith('{') || configValue.startsWith('[')) {
            try {
              JSON.parse(configValue)
            } catch (e) {
              uni.showToast({
                title: 'JSON格式错误',
                icon: 'error'
              })
              return
            }
          }
          
          // 更新配置
          const db = uniCloud.database()
          await db.collection('a-system-configs').doc(this.editingConfig._id).update({
            config_value: configValue,
            updated_at: new Date()
          })
          
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          })
          
          this.closeEditPopup()
          // 重新加载数据
          this.loadData(false)
        } catch (error) {
          console.error('保存配置失败:', error)
          uni.showToast({
            title: '保存失败',
            icon: 'error'
          })
        }
      }
    }
  }
</script>

<style scoped>
/* 现代化表格样式 */
.modern-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-header {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.table-header uni-th {
  background: transparent !important;
  color: white !important;
  font-weight: 600;
  padding: 16px 12px;
  border-bottom: none !important;
}

.table-row {
  transition: all 0.2s ease;
}

.table-row:hover {
  background-color: #f8fafc !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-row uni-td {
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

/* 输入框样式 */
.search-input {
  padding-left: 48px !important;
  height: 48px !important;
  border-radius: 12px !important;
  border: 2px solid #e2e8f0 !important;
  font-size: 16px !important;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

/* 按钮悬停效果 */
button {
  transition: all 0.2s ease;
  transform: translateY(0);
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

button:active {
  transform: translateY(0);
}

/* 统计卡片动画 */
.bg-white {
  transition: all 0.2s ease;
}

.bg-white:hover {
  transform: translateY(-2px);
}

/* 配置值编辑区域 */
.cursor-pointer {
  cursor: pointer;
}

/* 标签样式增强 */
.inline-flex {
  transition: all 0.2s ease;
}

.inline-flex:hover {
  transform: scale(1.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  .lg\\:grid-cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  
  .flex-wrap {
    gap: 8px;
  }
  
  .px-6 {
    padding-left: 12px;
    padding-right: 12px;
  }
}

/* 表格内容截断 */
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 弹窗样式 */
.max-h-96 {
  max-height: 24rem;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 特殊样式增强 */
.font-mono {
  font-family: 'Courier New', monospace;
}

.bg-gradient-to-r {
  background: linear-gradient(90deg, var(--tw-gradient-from), var(--tw-gradient-to));
}

/* 加载状态样式 */
.loading-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 状态徽章动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.bg-green-100 {
  animation: pulse 2s infinite;
}

/* 边框动画效果 */
.border-animation {
  position: relative;
  overflow: hidden;
}

.border-animation::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #3b82f6, transparent);
  animation: scan 2s infinite;
}

@keyframes scan {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .bg-white {
    background-color: #1f2937;
    color: #f9fafb;
  }
  
  .text-gray-900 {
    color: #f9fafb;
  }
  
  .text-gray-600 {
    color: #d1d5db;
  }
  
  .bg-gray-50 {
    background-color: #374151;
  }
  
  .border-gray-200 {
    border-color: #4b5563;
  }
}
</style>
