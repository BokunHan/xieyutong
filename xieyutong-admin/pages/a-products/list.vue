<template>
  <view class="min-h-screen bg-gray-50" style="font-family: 'Microsoft YaHei', sans-serif;">
    <!-- 页面标题栏 -->
    <view class="bg-white shadow-sm border-b border-gray-200">
      <view class="max-w-full mx-auto px-6 py-4">
        <view class="flex items-center justify-between">
          <view class="flex items-center">
            <i class="fas fa-shopping-bag text-blue-600 text-2xl mr-4"></i>
  <view>
              <text class="text-2xl font-bold text-gray-900">商品管理</text>
              <text class="block text-sm text-gray-500 mt-1">管理携程同步商品信息</text>
            </view>
          </view>
          <view class="flex items-center space-x-3">
            <text class="text-sm text-gray-500">
              <i class="fas fa-clock mr-1"></i>
              {{currentTime}}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作工具栏 -->
    <view class="bg-white shadow-sm mx-6 mt-6 rounded-lg border border-gray-200">
      <view class="p-4">
        <view class="flex flex-wrap items-center justify-between gap-4">
          <!-- 搜索区域 -->
          <view class="flex items-center space-x-3 flex-1 min-w-0">
            <view class="flex-1 max-w-md">
              <uni-easyinput
                v-model="query"
                placeholder="搜索商品标题、副标题或携程商品ID"
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
                  borderColor: '#3b82f6'
                }"
              />
            </view>
            <button 
              class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base"
              @click="search"
            >
              <i class="fas fa-search mr-2"></i>
              搜索
            </button>
          </view>
          
          <!-- 操作按钮区域 -->
          <view class="flex items-center space-x-3">
            <button 
              class="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base"
              @click="navigateToSync"
            >
              <i class="fas fa-sync mr-2"></i>
              同步商品
            </button>
            
            <button 
              class="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="(!selectedRows || selectedRows.length === 0) && (!selectedIndexs || selectedIndexs.length === 0)" 
              @click="delTable"
            >
              <i class="fas fa-trash-alt mr-2"></i>
              批量删除 {{getSelectedCount() > 0 ? `(${getSelectedCount()})` : ''}}
            </button>
            
            <download-excel 
              :fields="exportExcel.fields" 
              :data="exportExcelData" 
              :type="exportExcel.type" 
              :name="exportExcel.filename"
            >
              <button class="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center text-base">
                <i class="fas fa-file-excel mr-2"></i>
                导出Excel
              </button>
        </download-excel>
          </view>
        </view>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <view class="mx-6 my-6">
      <unicloud-db 
        ref="udb" 
        :collection="collectionList" 
        field="_id,ctrip_id,title,subtitle,price,child_price,product_images,status,created_at" 
        :where="where" 
        page-data="replace"
        :orderby="orderby" 
        :getcount="true" 
        :page-size="options.pageSize" 
        :page-current="options.pageCurrent"
        v-slot:default="{data,pagination,loading,error,options}" 
        :options="options" 
        loadtime="manual" 
        @load="onqueryload"
      >
        <!-- 数据统计信息 -->
        <view class="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <view class="p-4 border-b border-gray-200">
            <view class="flex items-center justify-between">
              <view class="flex items-center">
                <i class="fas fa-chart-bar text-indigo-600 text-lg mr-3"></i>
                <text class="text-lg font-semibold text-gray-900">数据概览</text>
              </view>
              <view class="text-sm text-gray-500">
                共找到 <text class="font-semibold text-indigo-600 text-base">{{pagination.count}}</text> 个商品
              </view>
            </view>
          </view>
          
          <!-- Element Plus 表格 -->
          <div class="p-4">
            <el-table
              :data="data"
              style="width: 100%"
              v-loading="loading"
              element-loading-text="正在加载数据..."
              @selection-change="handleSelectionChange"
              row-key="_id"
            >
              <!-- 选择列 -->
              <el-table-column
                type="selection"
                width="55"
                :reserve-selection="true"
              />
              
              <!-- 商品ID -->
              <el-table-column
                prop="_id"
                label="商品ID"
                width="140"
                show-overflow-tooltip
              >
                <template #default="scope">
                  <div class="flex items-center">
                    <el-text
                      type="info"
                      class="cursor-pointer hover:text-blue-600"
                      @click="copyToClipboard(scope.row._id)"
                    >
                      {{scope.row._id ? scope.row._id.substring(0, 8) + '...' : '-'}}
                    </el-text>
                    <i class="fas fa-copy text-gray-400 ml-2 cursor-pointer hover:text-blue-600 transition-colors" @click="copyToClipboard(scope.row._id)"></i>
                  </div>
                </template>
              </el-table-column>
              
              <!-- 携程商品ID -->
              <el-table-column
                prop="ctrip_id"
                label="携程商品ID"
                width="140"
                show-overflow-tooltip
              >
                <template #default="scope">
                  <div class="flex items-center">
                    <el-text
                      type="primary"
                      class="cursor-pointer"
                      @click="copyToClipboard(scope.row.ctrip_id)"
                    >
                      {{scope.row.ctrip_id || '-'}}
                    </el-text>
                    <i class="fas fa-copy text-gray-400 ml-2 cursor-pointer hover:text-blue-600 transition-colors" @click="copyToClipboard(scope.row.ctrip_id)"></i>
                  </div>
                </template>
              </el-table-column>
              
              <!-- 商品信息 -->
              <el-table-column
                label="商品信息"
                min-width="300"
              >
                <template #default="scope">
                  <div>
                    <div class="font-medium text-gray-900 mb-1">
                      {{scope.row.title || '未设置标题'}}
                    </div>
                    <div class="text-xs text-gray-500" v-if="scope.row.subtitle">
                      {{scope.row.subtitle}}
                    </div>
                  </div>
                </template>
              </el-table-column>
              
              <!-- 商品图片 -->
              <el-table-column
                label="商品图片"
                width="100"
                align="center"
              >
                <template #default="scope">
                  <el-image
                    v-if="scope.row.product_images && scope.row.product_images.length > 0"
                    :src="getFirstImage(scope.row.product_images)"
                    :preview-src-list="getImageList(scope.row.product_images)"
                    fit="cover"
                    class="w-16 h-16 rounded-lg"
                    :initial-index="0"
                    preview-teleported
                  />
                  <div v-else class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <i class="fas fa-image text-gray-400 text-xl"></i>
                  </div>
                </template>
              </el-table-column>
              
              <!-- 成人价格 -->
              <el-table-column
                prop="price"
                label="成人价格"
                width="120"
                sortable
              >
                <template #default="scope">
                  <el-text type="success" v-if="scope.row.price">
                    ¥{{scope.row.price}}
                  </el-text>
                  <el-text type="info" v-else>-</el-text>
                </template>
              </el-table-column>
              
              <!-- 儿童价格 -->
              <el-table-column
                prop="child_price"
                label="儿童价格"
                width="120"
                sortable
              >
                <template #default="scope">
                  <el-text type="warning" v-if="scope.row.child_price">
                    ¥{{scope.row.child_price}}
                  </el-text>
                  <el-text type="info" v-else>-</el-text>
                </template>
              </el-table-column>
              
              <!-- 创建时间 -->
              <el-table-column
                prop="created_at"
                label="创建时间"
                width="160"
                sortable
              >
                <template #default="scope">
                  <el-text type="info" size="small">
                    <uni-dateformat :threshold="[0, 0]" :date="scope.row.created_at" format="yyyy-MM-dd hh:mm"></uni-dateformat>
                  </el-text>
                </template>
              </el-table-column>
              
              <!-- 商品状态 -->
              <el-table-column
                prop="status"
                label="商品状态"
                width="120"
              >
                <template #default="scope">
                  <el-tag
                    :type="getElementStatusType(scope.row.status)"
                    effect="light"
                    round
                  >
                    <i :class="getStatusIcon(scope.row.status)" class="mr-1"></i>
                    {{getStatusText(scope.row.status)}}
                  </el-tag>
                </template>
              </el-table-column>
              
              <!-- 操作 -->
              <el-table-column
                label="操作"
                width="180"
                fixed="right"
                align="center"
              >
                <template #default="scope">
                  <div class="flex items-center justify-center gap-2">
                    <el-button
                      type="primary"
                      size="small"
                      @click="navigateTo('./edit?id=' + scope.row._id, false)"
                      class="min-w-[60px]"
                    >
                      <i class="fas fa-edit mr-1"></i>
                      编辑
                    </el-button>
                    <el-button
                      type="danger"
                      size="small"
                      @click="confirmDelete(scope.row._id)"
                      class="min-w-[60px]"
                    >
                      <i class="fas fa-trash mr-1"></i>
                      删除
                    </el-button>
                  </div>
                  
                  <!-- 更多操作下拉菜单 -->
                  <el-dropdown 
                    class="ml-2" 
                    trigger="click"
                    @command="handleCommand"
                  >
                    <el-button type="info" size="small" text>
                      <i class="fas fa-ellipsis-v"></i>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item 
                          :command="{action: 'view', id: scope.row._id}"
                          icon="el-icon-view"
                        >
                          <i class="fas fa-eye mr-2"></i>
                          查看详情
                        </el-dropdown-item>
                        <el-dropdown-item 
                          :command="{action: 'copy', id: scope.row._id}"
                          icon="el-icon-copy-document"
                        >
                          <i class="fas fa-copy mr-2"></i>
                          复制商品
                        </el-dropdown-item>
                        <el-dropdown-item 
                          :command="{action: 'toggle-status', id: scope.row._id, status: scope.row.status}"
                          divided
                        >
                          <i class="fas fa-power-off mr-2"></i>
                          {{scope.row.status === 1 ? '下架商品' : '上架商品'}}
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 空状态 -->
            <el-empty v-if="!loading && !data.length" description="暂无商品数据">
              <el-button type="primary" @click="navigateToSync">
                <i class="fas fa-sync mr-2"></i>
                同步商品
              </el-button>
            </el-empty>
          </div>
        </view>
        
        <!-- 分页组件 -->
        <view class="bg-white rounded-lg shadow-sm border border-gray-200 p-4" v-if="pagination.count > 0">
          <view class="flex items-center justify-between">
            <view class="text-sm text-gray-700">
              显示第 <text class="font-medium">{{(pagination.current - 1) * pagination.size + 1}}</text> 到 
              <text class="font-medium">{{Math.min(pagination.current * pagination.size, pagination.count)}}</text> 条，
              共 <text class="font-medium">{{pagination.count}}</text> 条记录
            </view>
            <uni-pagination 
              show-icon 
              :page-size="pagination.size" 
              v-model="pagination.current" 
              :total="pagination.count" 
              @change="onPageChanged" 
            />
          </view>
        </view>
      </unicloud-db>
    </view>
  </view>
</template>

<script>
  import { enumConverter, filterToWhere } from '../../js_sdk/validator/a-products.js';

  const db = uniCloud.database()
const dbOrderBy = 'created_at desc' // 默认按创建时间倒序
const dbSearchFields = ['title', 'subtitle', 'ctrip_id'] // 模糊搜索字段
const pageSize = 15
  const pageCurrent = 1

  const orderByMapping = {
    "ascending": "asc",
    "descending": "desc"
  }

  export default {
    data() {
      return {
        collectionList: "a-products",
        query: '',
        where: '',
        orderby: dbOrderBy,
        orderByFieldName: "",
        selectedIndexs: [],
        selectedRows: [], // element-plus选中的行数据
      currentTime: '',
        options: {
          pageSize,
          pageCurrent,
          filterData: {
            "status_localdata": [
            { "value": 1, "text": "已上架" },
            { "value": 2, "text": "已下架" },
            ]
          },
          ...enumConverter
        },
        exportExcel: {
        "filename": "商品数据导出.xls",
          "type": "xls",
          "fields": {
          "商品ID": "_id",
            "携程商品ID": "ctrip_id",
            "商品标题": "title",
            "商品副标题": "subtitle",
            "成人价格": "price",
            "儿童价格": "child_price",
            "商品状态": "status",
          "创建时间": "created_at"
          }
        },
        exportExcelData: []
      }
    },
    onLoad() {
      this._filter = {}
    this.updateCurrentTime()
    // 定时更新时间
    setInterval(() => {
      this.updateCurrentTime()
    }, 60000)
    },
    onReady() {
      this.$refs.udb.loadData()
    },
    methods: {
    updateCurrentTime() {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      this.currentTime = `${year}-${month}-${day} ${hours}:${minutes}`
    },
    
    // 获取第一张图片
    getFirstImage(images) {
      if (Array.isArray(images) && images.length > 0) {
        return images[0]
      }
      if (typeof images === 'string') {
        try {
          const parsed = JSON.parse(images)
          return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : images
        } catch {
          return images
        }
      }
      return ''
    },
    
    // 获取图片列表（用于预览）
    getImageList(images) {
      if (Array.isArray(images)) {
        return images
      }
      if (typeof images === 'string') {
        try {
          const parsed = JSON.parse(images)
          return Array.isArray(parsed) ? parsed : [images]
        } catch {
          return [images]
        }
      }
      return []
    },
    
    // 获取选中数量
    getSelectedCount() {
      if (this.selectedRows && this.selectedRows.length > 0) {
        return this.selectedRows.length
      }
      return this.selectedIndexs.length
    },
    
    // 获取element-plus的状态类型
    getElementStatusType(status) {
      const typeMap = {
        0: '',          // 草稿 - 默认
        1: 'success',   // 已发布 - 成功
        2: 'warning',   // 已下架 - 警告
        3: 'danger'     // 已删除 - 危险
      }
      return typeMap[status] || ''
    },
    
    // 获取状态样式类
    getStatusClass(status) {
      const statusMap = {
        0: 'bg-gray-100 text-gray-800',      // 草稿
        1: 'bg-green-100 text-green-800',    // 已发布
        2: 'bg-yellow-100 text-yellow-800',  // 已下架
        3: 'bg-red-100 text-red-800'         // 已删除
      }
      return statusMap[status] || 'bg-gray-100 text-gray-800'
    },
    
    // 获取状态图标
    getStatusIcon(status) {
      const iconMap = {
        0: 'fas fa-edit',          // 草稿
        1: 'fas fa-check-circle',  // 已发布
        2: 'fas fa-pause-circle',  // 已下架
        3: 'fas fa-times-circle'   // 已删除
      }
      return iconMap[status] || 'fas fa-question-circle'
    },
    
    // 获取状态文本
    getStatusText(status) {
      const textMap = {
        0: '草稿',
        1: '已发布',
        2: '已下架',
        3: '已删除'
      }
      return textMap[status] || '未知'
    },
    
    // 处理下拉菜单命令
    handleCommand(command) {
      const { action, id, status } = command
      
      switch (action) {
        case 'view':
          this.viewProduct(id)
          break
        case 'copy':
          this.copyProduct(id)
          break
        case 'toggle-status':
          this.toggleProductStatus(id, status)
          break
        default:
          console.warn('未知的操作命令:', action)
      }
    },
    
    // 查看商品详情
    viewProduct(id) {
      uni.navigateTo({
        url: './detail?id=' + id
      })
    },
    
    // 复制商品
    copyProduct(id) {
      this.$confirm('确定要复制这个商品吗？', '确认复制', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(async () => {
        try {
          // 这里可以调用复制商品的云函数
          this.$message.success('商品复制成功')
          this.loadData()
        } catch (error) {
          this.$message.error('复制失败：' + error.message)
        }
      }).catch(() => {
        // 用户取消
      })
    },
    
    // 切换商品状态
    toggleProductStatus(id, currentStatus) {
      const newStatus = currentStatus === 1 ? 2 : 1
      const actionText = newStatus === 1 ? '上架' : '下架'
      
      this.$confirm(`确定要${actionText}这个商品吗？`, `确认${actionText}`, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await this.$refs.udb.update(id, { status: newStatus })
          this.$message.success(`${actionText}成功`)
          this.loadData()
        } catch (error) {
          this.$message.error(`${actionText}失败：` + error.message)
        }
      }).catch(() => {
        // 用户取消
      })
    },
    
    // 跳转到携程同步页面
    navigateToSync() {
      uni.navigateTo({
        url: '/pages/ctrip-sync/ctrip-sync',
        success: () => {
          console.log('跳转到携程同步页面成功')
        },
        fail: (error) => {
          console.error('跳转失败:', error)
          this.$message.error('页面跳转失败，请检查页面路径是否正确')
        }
      })
    },
    
    // 复制到剪贴板
    copyToClipboard(text) {
      if (!text) return
      
      // #ifdef H5
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.$message.success('已复制到剪贴板')
        }).catch(() => {
          this.fallbackCopyToClipboard(text)
        })
      } else {
        this.fallbackCopyToClipboard(text)
      }
      // #endif
      
      // #ifndef H5
      uni.setClipboardData({
        data: text,
        success: () => {
          this.$message.success('已复制到剪贴板')
        }
      })
      // #endif
    },
    
    // 降级复制方法
    fallbackCopyToClipboard(text) {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        this.$message.success('已复制到剪贴板')
      } catch (err) {
        this.$message.error('复制失败')
      }
      document.body.removeChild(textArea)
    },
    
    // element-plus表格选中变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
      // 为了兼容原有逻辑，同步更新selectedIndexs
      this.selectedIndexs = selection.map(row => {
        const dataList = this.$refs.udb.dataList
        return dataList.findIndex(item => item._id === row._id)
      }).filter(index => index !== -1)
    },
    
    // 全选/取消全选
    toggleSelectAll(e) {
      if (e.target.checked) {
        this.selectedIndexs = Array.from({length: this.$refs.udb.dataList.length}, (_, i) => i)
      } else {
        this.selectedIndexs = []
      }
    },
    
    // 切换单个选择
    toggleSelectItem(index) {
      const currentIndex = this.selectedIndexs.indexOf(index)
      if (currentIndex > -1) {
        this.selectedIndexs.splice(currentIndex, 1)
      } else {
        this.selectedIndexs.push(index)
      }
    },
    
      onqueryload(data) {
        this.exportExcelData = data
      },
    
      getWhere() {
        const query = this.query.trim()
        if (!query) {
          return ''
        }
      // 构建模糊搜索条件
      const conditions = dbSearchFields.map(field => `/${query}/i.test(${field})`)
      return conditions.join(' || ')
      },
    
      search() {
        const newWhere = this.getWhere()
        this.where = newWhere
      this.selectedIndexs = [] // 清空选择
      this.$nextTick(() => {
        this.loadData()
      })
    },
    
    clearSearch() {
      this.query = ''
      this.where = ''
      this.selectedIndexs = [] // 清空选择
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
      this.selectedIndexs = [] // 切换页面时清空选择
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
    
    // 获取选中的项目ID
      selectedItems() {
        // 优先使用element-plus的选中数据
        if (this.selectedRows && this.selectedRows.length > 0) {
          return this.selectedRows.map(row => row._id)
        }
        // 兼容原有逻辑
        var dataList = this.$refs.udb.dataList
        return this.selectedIndexs.map(i => dataList[i]._id)
      },
    
      // 批量删除
      delTable() {
      const selectedCount = this.selectedRows ? this.selectedRows.length : this.selectedIndexs.length
      if (!selectedCount) return
      
      this.$confirm(`确定要删除选中的 ${selectedCount} 个商品吗？此操作不可恢复。`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$refs.udb.remove(this.selectedItems(), {
          success: (res) => {
            this.selectedIndexs = []
            this.selectedRows = []
            this.$message.success('删除成功')
          }
        })
      }).catch(() => {
        // 用户取消删除
      })
      },
    
      confirmDelete(id) {
      this.$confirm('确定要删除这个商品吗？此操作不可恢复。', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$refs.udb.remove(id, {
          success: (res) => {
            this.selectedIndexs = []
            this.selectedRows = []
            this.$message.success('删除成功')
          }
        })
      }).catch(() => {
        // 用户取消删除
      })
      },
    
      sortChange(e, name) {
      this.orderByFieldName = name
        if (e.order) {
          this.orderby = name + ' ' + orderByMapping[e.order]
        } else {
        this.orderby = dbOrderBy
        }
      this.selectedIndexs = []
      this.selectedRows = [] // 清空element-plus选择
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
      this.selectedIndexs = []
      this.selectedRows = [] // 清空element-plus选择
        this.$nextTick(() => {
          this.$refs.udb.loadData()
        })
      }
    }
  }
</script>

<style>
/* Tailwind CSS 和 FontAwesome 已通过 CDN 引入 */

/* 自定义样式补充 */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 表格滚动条样式 */
.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 确保表格在小屏幕上可以横向滚动 */
@media (max-width: 768px) {
  .overflow-x-auto {
    -webkit-overflow-scrolling: touch;
  }
}

/* 动画效果 */
.transition-colors {
  transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out;
}

/* 输入框聚焦效果 */
input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 按钮悬停效果 */
button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

button:active {
  transform: translateY(0);
}

/* 禁用状态 */
button:disabled {
  transform: none;
  box-shadow: none;
}
</style>
