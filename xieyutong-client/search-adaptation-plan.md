# 搜索模板适配方案

## 1. 数据库表替换策略

### 原始表结构 → 目标表结构
- `opendb-mall-goods` → `a-products` (旅游商品表)
- `opendb-search-log` → `a-search-log` (搜索日志表)
- `opendb-search-hot` → `a-search-hot` (热搜表)

### a-products 表字段映射
```json
{
  "name": "product_name",           // 商品名称 → 旅游产品名称
  "goods_desc": "product_desc",     // 商品描述 → 产品描述  
  "goods_thumb": "product_image",   // 商品缩略图 → 产品图片
  "goods_price": "product_price",   // 商品价格 → 产品价格
  "keywords": "search_keywords",    // 搜索关键词
  "category_id": "destination_id",  // 分类ID → 目的地ID
  "shop_name": "provider_name",     // 商家名称 → 供应商名称
  "tag": "product_tags",           // 商品标签 → 产品标签
  "is_on_sale": "is_available"     // 是否上架 → 是否可预订
}
```

## 2. 搜索字段适配

### 主要搜索字段
- `product_name`: 产品名称（主要搜索字段）
- `destination`: 目的地城市/国家
- `product_tags`: 产品标签（如：亲子游、蜜月、自由行）
- `search_keywords`: 搜索关键词

### 联想搜索逻辑
```javascript
// 搜索联想查询条件
const searchFields = 'product_name,destination,product_tags,search_keywords'
const searchWhere = `/${searchText}/i.test(product_name) || /${searchText}/i.test(destination) || /${searchText}/i.test(search_keywords)`
```

## 3. 页面集成方案

### 3.1 首页搜索集成
- 在首页添加搜索栏组件
- 点击跳转到专业搜索页面
- 搜索结果展示在产品列表页

### 3.2 搜索页面适配
- 保持原有nvue页面结构
- 修改数据库查询目标为 `a-products`
- 调整搜索字段和显示字段

### 3.3 搜索结果页面
- 复用现有产品列表组件
- 支持按价格、评分、销量排序
- 添加筛选功能（目的地、价格区间、出行天数）

## 4. 云函数适配

### 热搜分析云函数修改
- 修改数据库表名为 `a-search-log` 和 `a-search-hot`
- 调整定时器配置（建议每4小时执行一次）
- 增加旅游相关的数据分析维度

## 5. 组件复用策略

### 直接复用组件
- `uni-search-bar`: 搜索框组件
- `uni-list`: 搜索结果列表
- `uni-icons`: 图标组件
- `uni-load-more`: 加载更多组件

### 需要定制的组件
- 搜索联想列表（显示旅游产品信息）
- 热搜标签（添加旅游热门标签样式）
- 搜索历史（增加地理位置标识）

## 6. 实施步骤

### 第一阶段：基础搭建
1. 创建搜索相关数据表Schema
2. 复制搜索页面到项目中
3. 修改数据库查询目标表

### 第二阶段：功能适配
1. 调整搜索字段和显示逻辑
2. 集成到首页和产品列表
3. 测试搜索联想和历史功能

### 第三阶段：优化增强
1. 部署热搜分析云函数
2. 添加高级筛选功能
3. 优化搜索体验和性能

## 7. 技术要点

### 搜索性能优化
- 为搜索字段创建复合索引
- 使用正则表达式进行模糊搜索
- 实现搜索结果缓存机制

### 用户体验优化
- 搜索框自动聚焦
- 实时搜索联想
- 支持语音搜索（APP端）
- 搜索无结果时的友好提示

### 数据统计
- 记录用户搜索行为
- 分析热门搜索词趋势
- 为产品推荐提供数据支持 