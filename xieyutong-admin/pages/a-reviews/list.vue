<template>
  <view>
    <view class="uni-header">
      <view class="uni-group">
        <view class="uni-title"></view>
        <view class="uni-sub-title"></view>
      </view>
      <view class="uni-group">
        <input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
        <button class="uni-button" type="default" size="mini" @click="search">搜索</button>
        <button class="uni-button" type="default" size="mini" @click="navigateTo('./add')">新增</button>
        <button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length" @click="delTable">批量删除</button>
        <download-excel class="hide-on-phone" :fields="exportExcel.fields" :data="exportExcelData" :type="exportExcel.type" :name="exportExcel.filename">
          <button class="uni-button" type="primary" size="mini">导出 Excel</button>
        </download-excel>
      </view>
    </view>
    <view class="uni-container">
      <unicloud-db ref="udb" :collection="collectionList" field="user_id,product_id,rating,content,images,travel_date,is_real,helpful_count,status,created_at,updated_at" :where="where" page-data="replace"
        :orderby="orderby" :getcount="true" :page-size="options.pageSize" :page-current="options.pageCurrent"
        v-slot:default="{data,pagination,loading,error,options}" :options="options" loadtime="manual" @load="onqueryload">
        <uni-table ref="table" :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection" @selection-change="selectionChange">
          <uni-tr>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'user_id')" sortable @sort-change="sortChange($event, 'user_id')">用户ID</uni-th>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'product_id')" sortable @sort-change="sortChange($event, 'product_id')">商品ID</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'rating')" sortable @sort-change="sortChange($event, 'rating')">评分</uni-th>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'content')" sortable @sort-change="sortChange($event, 'content')">评价内容</uni-th>
            <uni-th align="center" sortable @sort-change="sortChange($event, 'images')">评价图片</uni-th>
            <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'travel_date')" sortable @sort-change="sortChange($event, 'travel_date')">出行日期</uni-th>
            <uni-th align="center" sortable @sort-change="sortChange($event, 'is_real')">真实评价</uni-th>
            <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'helpful_count')" sortable @sort-change="sortChange($event, 'helpful_count')">有用数</uni-th>
            <uni-th align="center" filter-type="select" :filter-data="options.filterData.status_localdata" @filter-change="filterChange($event, 'status')">status</uni-th>
            <uni-th align="center" filter-type="timestamp" @filter-change="filterChange($event, 'created_at')" sortable @sort-change="sortChange($event, 'created_at')">created_at</uni-th>
            <uni-th align="center" filter-type="timestamp" @filter-change="filterChange($event, 'updated_at')" sortable @sort-change="sortChange($event, 'updated_at')">updated_at</uni-th>
            <uni-th align="center">操作</uni-th>
          </uni-tr>
          <uni-tr v-for="(item,index) in data" :key="index">
            <uni-td align="center">{{item.user_id}}</uni-td>
            <uni-td align="center">{{item.product_id}}</uni-td>
            <uni-td align="center">{{item.rating}}</uni-td>
            <uni-td align="center">{{item.content}}</uni-td>
            <uni-td align="center">{{item.images}}</uni-td>
            <uni-td align="center">{{item.travel_date}}</uni-td>
            <uni-td align="center">{{item.is_real == true ? '✅' : '❌'}}</uni-td>
            <uni-td align="center">{{item.helpful_count}}</uni-td>
            <uni-td align="center">{{options.status_valuetotext[item.status]}}</uni-td>
            <uni-td align="center">
              <uni-dateformat :threshold="[0, 0]" :date="item.created_at"></uni-dateformat>
            </uni-td>
            <uni-td align="center">
              <uni-dateformat :threshold="[0, 0]" :date="item.updated_at"></uni-dateformat>
            </uni-td>
            <uni-td align="center">
              <view class="uni-group">
                <button @click="navigateTo('./edit?id='+item._id, false)" class="uni-button" size="mini" type="primary">修改</button>
                <button @click="confirmDelete(item._id)" class="uni-button" size="mini" type="warn">删除</button>
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
</template>

<script>
  import { enumConverter, filterToWhere } from '../../js_sdk/validator/a-reviews.js';

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
        collectionList: "a-reviews",
        query: '',
        where: '',
        orderby: dbOrderBy,
        orderByFieldName: "",
        selectedIndexs: [],
        options: {
          pageSize,
          pageCurrent,
          filterData: {
            "rating_data": numberRange(1, 5),
            "rating_index": null,
            "status_localdata": [
              {
                "value": "pending",
                "text": "pending"
              },
              {
                "value": "approved",
                "text": "approved"
              },
              {
                "value": "rejected",
                "text": "rejected"
              },
              {
                "value": "hidden",
                "text": "hidden"
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
          "filename": "a-reviews.xls",
          "type": "xls",
          "fields": {
            "用户ID": "user_id",
            "商品ID": "product_id",
            "评分": "rating",
            "评价内容": "content",
            "评价图片": "images",
            "出行日期": "travel_date",
            "真实评价": "is_real",
            "有用数": "helpful_count",
            "status": "status",
            "created_at": "created_at",
            "updated_at": "updated_at"
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
        this.$refs.udb.remove(id, {
          success:(res) => {
            this.$refs.table.clearSelection()
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
      }
    }
  }
</script>

<style>
</style>
