# 携程高端游商家私域运营解决方案 - 数据库设计文档

## 1. 核心数据模型概述

本项目采用 uniCloud 云开发平台（阿里云版本），基于 DB Schema 进行数据库设计。数据库设计遵循"a-{模块名}"的命名规范，确保模块划分清晰。系统包含以下核心数据模型：

### 1.1 用户与会员体系
- **uni-id-users**: 基础用户表，存储用户基本信息和认证数据
- **a-members**: 会员信息表，实现会员等级机制和权益管理
- **a-referrals**: 用户推荐关系表，支持分销推广机制

### 1.2 商品与行程管理
- **a-products**: 商品详情表，存储从携程爬取的旅游产品完整信息
- **a-itineraries**: 行程信息表，存储旅游产品的详细行程安排
- **a-booking-policies**: 预订政策表，存储旅游产品的预订须知、限制条件等

### 1.3 订单与支付系统
- **a-orders**: 订单主表，记录用户订单信息
- **uni-pay-orders**: 支付订单表，处理支付相关信息

### 1.4 营销与优惠券系统
- **a-coupons**: 优惠券模板表，定义可发放的优惠券类型
- **a-user-coupons**: 用户优惠券表，记录用户领取的优惠券

### 1.5 系统配置
- **a-system-configs**: 系统配置表，集中管理会员升级规则、优惠券发放规则等系统参数

### 1.6 轮播图系统
- **a-banners**: 轮播图表，管理首页和其他页面的轮播图展示内容

### 1.7 评价系统
- **a-reviews**: 商品评价表，存储用户对商品的评价信息

## 2. 详细表结构设计

### 2.1 商品与行程数据模型

#### 2.1.1 商品表 (a-products)
存储从携程爬取的旅游产品完整信息，是系统的核心数据表之一。

| 字段名 | 类型 | 必填 | 描述 | 默认值 | 约束 |
|--------|------|------|------|--------|------|
| _id | string | 是 | 系统自动生成的唯一标识 | - | 主键 |
| product_id | string | 是 | 携程商品ID，用于标识具体商品 | - | 最大50字符，唯一 |
| title | string | 是 | 商品标题 | - | 最大200字符 |
| subtitle | string | 否 | 商品副标题，详细描述商品亮点 | - | 最大500字符 |
| price | string | 是 | 商品价格，包含货币符号 | - | 最大20字符 |
| price_number | number | 否 | 商品价格数值，用于排序和筛选 | - | 最小值0 |
| product_images | array | 否 | 商品主要展示图片数组 | - | 最多20项 |
| detail_images | array | 否 | 商品详情页图片数组 | - | 最多50项 |
| overview | object | 否 | 商品概览信息 | - | 包含导游、交通、活动、住宿、餐食 |
| features | array | 否 | 商品特色亮点数组 | - | 最多10项 |
| cost_info | object | 否 | 费用说明详情 | - | 包含交通、住宿、餐食、门票、服务费用说明 |
| status | number | 是 | 商品状态 | 1 | 0-下架，1-上架，2-售罄，3-待审核 |
| sort_order | number | 否 | 排序权重，数值越大排序越靠前 | 0 | - |
| view_count | number | 否 | 浏览次数统计 | 0 | 最小值0 |
| sales_count | number | 否 | 销售数量统计 | 0 | 最小值0 |
| review_count | number | 否 | 评价数量统计 | 0 | 最小值0 |
| created_at | timestamp | 是 | 创建时间 | now | - |
| updated_at | timestamp | 是 | 更新时间 | now | - |
| crawl_timestamp | string | 否 | 爬虫抓取时间戳 | - | 最大50字符 |

#### 2.1.2 行程表 (a-itineraries)
存储旅游产品的详细行程安排，采用三层嵌套结构：行程基本信息 → 每日行程 → 具体活动。

| 字段名 | 类型 | 必填 | 描述 | 默认值 | 约束 |
|--------|------|------|------|--------|------|
| _id | string | 是 | 系统自动生成的唯一标识 | - | 主键 |
| product_id | string | 是 | 关联的商品ID（携程商品ID） | - | 最大50字符 |
| title | string | 否 | 行程标题 | - | 最大200字符 |
| sub_title | string | 否 | 行程副标题 | - | 最大300字符 |
| duration | string | 否 | 行程时长描述，如'8天' | - | 最大50字符 |
| total_days | int | 是 | 总天数 | - | 最小1，最大365 |
| remarks | string | 否 | 行程备注说明 | - | 最大1000字符 |
| itinerary | array | 是 | 详细行程安排数组 | - | 包含每日行程和活动 |
| metadata | object | 否 | 元数据信息 | - | 包含提取时间和来源URL |
| status | string | 否 | 行程状态 | active | active, inactive, draft |
| created_at | timestamp | 是 | 创建时间 | now | - |
| updated_at | timestamp | 是 | 更新时间 | now | - |

**行程数组 (itinerary) 结构说明：**
- 每日行程包含：`day`（第几天）、`day_title`（当日标题）、`activities`（活动数组）
- 活动包含：`elementType`（活动类型）、`title`（活动标题）、时间信息、地点信息等
- 活动类型支持：集合(assembly)、交通(transport)、餐厅(restaurant)、景点(scenic)、酒店(hotel)、其他(other)、解散(dismissal)

#### 2.1.3 预订政策表 (a-booking-policies)
存储旅游产品的预订须知、限制条件、安全提示等信息。

| 字段名 | 类型 | 必填 | 描述 | 默认值 | 约束 |
|--------|------|------|------|--------|------|
| _id | string | 是 | 系统自动生成的唯一标识 | - | 主键 |
| product_id | string | 是 | 关联的商品ID（携程商品ID） | - | 最大50字符 |
| travel_agency_info | object | 否 | 旅行社信息 | - | 包含主办和委托旅行社 |
| booking_restrictions | object | 否 | 预订限制条件 | - | 包含年龄、团队、其他限制 |
| accommodation_policy | object | 否 | 住宿政策 | - | 多人入住政策 |
| group_info | object | 否 | 团队信息 | - | 成团说明、出团通知 |
| booking_requirements | array | 否 | 预订要求列表 | - | 每项最大2000字符 |
| violation_terms | object | 否 | 违约条款 | - | 旅行社和游客违约条款 |
| travel_guide | array | 否 | 旅游指南提示 | - | 每项最大1000字符 |
| safety_tips | array | 否 | 安全提示 | - | 每项最大1000字符 |
| payment_info | object | 否 | 支付信息 | - | 支持的支付方式和说明 |
| status | string | 否 | 政策状态 | active | active, inactive, draft |
| created_at | timestamp | 是 | 创建时间 | now | - |
| updated_at | timestamp | 是 | 更新时间 | now | - |

### 2.2 用户与会员体系

#### 2.2.1 会员表 (a-members)
通过user_id关联uni-id-users实现会员机制，管理用户的会员等级和权益。

| 字段名 | 类型 | 必填 | 描述 | 默认值 | 约束 |
|--------|------|------|------|--------|------|
| _id | string | 是 | 系统自动生成的唯一标识 | - | 主键 |
| user_id | string | 是 | 关联的用户ID（uni-id-users表的_id） | - | 最大50字符，外键 |
| level | string | 是 | 会员等级 | normal | normal, silver, gold, diamond |
| total_consumption | number | 否 | 累计消费金额 | 0 | 最小值0 |
| order_count | number | 否 | 订单数量 | 0 | 最小值0 |
| upgrade_threshold | object | 否 | 升级条件阈值 | - | 包含下一等级和所需条件 |
| benefits | object | 否 | 会员权益 | - | 包含折扣率等 |
| status | string | 是 | 会员状态 | active | active, inactive, suspended |
| join_date | timestamp | 是 | 加入会员时间 | now | - |
| upgrade_date | timestamp | 否 | 最后升级时间 | - | - |
| expire_date | timestamp | 否 | 会员到期时间 | - | - |
| created_at | timestamp | 是 | 创建时间 | now | - |
| updated_at | timestamp | 是 | 更新时间 | now | - |

#### 2.2.2 推荐关系表 (a-referrals)
分销返券表，老客户推荐新人双方获得优惠券。

| 字段名 | 类型 | 必填 | 描述 | 默认值 | 约束 |
|--------|------|------|------|--------|------|
| _id | string | 是 | 系统自动生成的唯一标识 | - | 主键 |
| referrer_id | string | 是 | 推荐人用户ID（老客户） | - | 最大50字符 |
| referee_id | string | 是 | 被推荐人用户ID（新客户） | - | 最大50字符 |
| order_id | string | 否 | 触发奖励的订单ID | - | 最大50字符 |
| order_amount | number | 否 | 订单金额 | - | 最小值0 |
| referrer_coupon_id | string | 否 | 推荐人获得的感谢券ID | - | 最大50字符 |
| referee_coupon_id | string | 否 | 被推荐新人获得的专享券ID | - | 最大50字符 |
| referrer_coupon_amount | number | 否 | 推荐人感谢券金额 | 1000 | 最小值0 |
| referee_coupon_amount | number | 否 | 被推荐新人专享券金额 | 1000 | 最小值0 |
| status | string | 是 | 分销状态 | pending | pending, confirmed, completed |
| order_date | timestamp | 否 | 订单时间 | - | - |
| coupon_sent_date | timestamp | 否 | 优惠券发放时间 | - | - |
| remark | string | 否 | 备注信息 | - | 最大200字符 |
| created_at | timestamp | 是 | 创建时间 | now | - |
| updated_at | timestamp | 是 | 更新时间 | now | - |

### 2.3 订单与支付系统

#### 2.3.1 订单表 (a-orders)
业务订单表，记录用户购买旅游产品的订单信息。

| 字段名 | 类型 | 必填 | 描述 | 默认值 | 约束 |
|--------|------|------|------|--------|------|
| _id | string | 是 | 系统自动生成的唯一标识 | - | 主键 |
| order_no | string | 是 | 订单号，唯一标识 | - | 20-28字符 |
| user_id | string | 是 | 用户ID，关联uni-id-users表 | - | 外键 |
| product_id | string | 是 | 商品ID，关联a-products表 | - | 外键 |
| product_snapshot | object | 否 | 商品快照，记录下单时的商品信息 | - | 包含标题、价格、图片、出发日期 |
| status | string | 是 | 订单状态 | pending | pending, paid, confirmed, processing, completed, cancelled, refunded |
| quantity | number | 否 | 购买数量 | 1 | 最小值1 |
| total_amount | number | 是 | 订单总金额（原价） | - | 最小值0 |
| discount_amount | number | 否 | 折扣金额 | 0 | 最小值0 |
| coupon_discount | number | 否 | 优惠券折扣金额 | 0 | 最小值0 |
| member_discount | number | 否 | 会员折扣金额 | 0 | 最小值0 |
| final_amount | number | 是 | 最终支付金额 | - | 最小值0 |
| coupons_used | array | 否 | 使用的优惠券ID列表 | - | - |
| member_level | string | 否 | 下单时的会员等级 | - | normal, silver, gold, diamond |
| contact_info | object | 否 | 联系人信息 | - | 姓名、电话、邮箱 |
| travelers | array | 否 | 出行人信息列表 | - | 姓名、身份证、手机、护照 |
| departure_date | string | 否 | 出发日期 | - | - |
| special_requirements | string | 否 | 特殊要求 | - | - |
| payment_info | object | 否 | 支付信息 | - | 支付方式、支付时间等 |
| ctrip_sync | object | 否 | 携程同步信息 | - | 同步状态和时间 |
| created_at | timestamp | 是 | 创建时间 | now | - |
| updated_at | timestamp | 是 | 更新时间 | now | - |

### 2.4 营销与优惠券系统

#### 2.4.1 优惠券模板表 (a-coupons)
优惠券表，支持手动发券和自动发券。

| 字段名 | 类型 | 必填 | 描述 | 默认值 | 约束 |
|--------|------|------|------|--------|------|
| _id | string | 是 | 系统自动生成的唯一标识 | - | 主键 |
| title | string | 是 | 优惠券标题 | - | 最大50字符 |
| description | string | 否 | 优惠券描述 | - | 最大200字符 |
| amount | number | 是 | 优惠金额 | - | 最小值0 |
| min_amount | number | 是 | 最低消费金额（使用门槛） | - | 最小值0 |
| issue_type | string | 是 | 发券类型 | manual | manual, auto_referral |
| total_count | number | 否 | 发放总数量（0表示无限制） | 0 | 最小值0 |
| used_count | number | 否 | 已使用数量 | 0 | 最小值0 |
| valid_days | number | 否 | 有效天数（从领取日开始计算） | 180 | 最小值1 |
| share_code | string | 否 | 分享码，用于生成领券链接和二维码 | - | 最大20字符 |
| auto_issue_condition | string | 否 | 自动发券条件 | - | referrer_reward, referee_reward |
| status | string | 是 | 优惠券状态 | active | active, inactive |
| created_at | timestamp | 是 | 创建时间 | now | - |
| updated_at | timestamp | 是 | 更新时间 | now | - |

#### 2.4.2 用户优惠券表 (a-user-coupons)
用户优惠券关联表，管理用户领取的优惠券状态和使用记录。

| 字段名 | 类型 | 必填 | 描述 | 默认值 | 约束 |
|--------|------|------|------|--------|------|
| _id | string | 是 | 系统自动生成的唯一标识 | - | 主键 |
| user_id | string | 是 | 用户ID，关联uni-id-users表 | - | 最大50字符，外键 |
| coupon_id | string | 是 | 优惠券ID，关联a-coupons表 | - | 最大50字符，外键 |
| coupon_code | string | 否 | 优惠券码，用户使用时的唯一标识 | - | 最大32字符 |
| status | string | 是 | 优惠券状态 | unused | unused, used, expired |
| order_id | string | 否 | 使用该券的订单ID | - | 最大50字符，外键 |
| source_type | string | 否 | 获取来源类型 | manual | manual, referral_reward, new_user_gift, member_upgrade, activity |
| source_detail | object | 否 | 来源详细信息 | - | 推荐记录ID、活动ID、发放管理员等 |
| received_at | timestamp | 是 | 领取时间 | now | - |
| used_at | timestamp | 否 | 使用时间 | - | - |
| expired_at | timestamp | 否 | 过期时间 | - | - |
| amount | number | 否 | 优惠金额（冗余存储） | - | 最小值0 |
| min_amount | number | 否 | 最低消费门槛（冗余存储） | - | 最小值0 |
| title | string | 否 | 优惠券标题（冗余存储） | - | 最大50字符 |
| remark | string | 否 | 备注信息 | - | 最大200字符 |
| created_at | timestamp | 是 | 创建时间 | now | - |
| updated_at | timestamp | 是 | 更新时间 | now | - |

### 2.5 系统配置

#### 2.5.1 系统配置表 (a-system-configs)
集中管理会员升级规则、优惠券发放规则等系统参数。

| 字段名 | 类型 | 必填 | 描述 | 默认值 | 约束 |
|--------|------|------|------|--------|------|
| _id | string | 是 | 系统自动生成的唯一标识 | - | 主键 |
| config_key | string | 是 | 配置键名，用于标识配置项 | - | 最大100字符，唯一 |
| config_value | object | 是 | 配置值，JSON对象格式存储具体配置内容 | - | - |
| config_type | string | 否 | 配置类型分类 | system_params | member_upgrade, coupon_rules, referral_rules, system_params |
| description | string | 否 | 配置项描述说明 | - | 最大500字符 |
| status | string | 是 | 配置状态 | active | active, inactive |
| version | string | 否 | 配置版本号 | 1.0 | 最大20字符 |
| effective_date | timestamp | 否 | 配置生效时间 | - | - |
| created_by | string | 否 | 创建人ID | - | 最大50字符 |
| updated_by | string | 否 | 最后修改人ID | - | 最大50字符 |
| created_at | timestamp | 是 | 创建时间 | now | - |
| updated_at | timestamp | 是 | 更新时间 | now | - |

**主要配置项**:
1. **会员升级规则**:
   - 银卡会员：累计消费满500元，享受95折优惠
   - 金卡会员：累计消费满2000元，享受9折优惠
   - 钻石会员：累计消费满5000元，享受85折优惠

2. **优惠券自动发放规则**:
   - 新用户注册：不自动发放优惠券
   - 会员升级：不自动发放优惠券
   - 推荐奖励：分享并被分享人下单后，双方各获得5元优惠券（最低消费1元，有效期180天）

### 2.6 轮播图系统

#### 2.6.1 轮播图表 (a-banners)
存储首页和其他页面的轮播图展示内容，支持配置图片、标题、副标题、按钮文字和跳转链接。

| 字段名 | 类型 | 必填 | 描述 | 默认值 | 约束 |
|--------|------|------|------|--------|------|
| _id | string | 是 | 系统自动生成的唯一标识 | - | 主键 |
| image | string | 是 | 轮播图图片URL地址 | - | 最大500字符 |
| title | string | 是 | 轮播图显示的主标题 | - | 最大100字符 |
| subtitle | string | 否 | 轮播图显示的副标题 | - | 最大200字符 |
| button_name | string | 否 | 轮播图上按钮的显示文字 | 立即探索 | 最大20字符 |
| url | string | 否 | 点击按钮后跳转的链接地址 | - | 最大500字符 |
| sort_order | number | 否 | 排序权重，数值越大排序越靠前 | 0 | 最小值0 |
| status | number | 是 | 轮播图状态：0-下架，1-上架 | 1 | 0或1 |
| start_date | timestamp | 否 | 轮播图展示开始时间，为空表示立即开始 | - | - |
| end_date | timestamp | 否 | 轮播图展示结束时间，为空表示永久有效 | - | - |
| remark | string | 否 | 轮播图备注信息，仅管理员可见 | - | 最大500字符 |
| created_by | string | 是 | 创建人ID | - | 外键，关联uni-id-users |
| created_at | timestamp | 是 | 创建时间 | now | - |
| updated_at | timestamp | 是 | 更新时间 | now | - |

### 2.7 评价系统

#### 2.7.1 商品评价表 (a-reviews)
用户评价表，存储用户对旅游产品的评价信息。

| 字段名 | 类型 | 必填 | 描述 | 默认值 | 约束 |
|--------|------|------|------|--------|------|
| _id | string | 是 | 系统自动生成的唯一标识 | - | 主键 |
| user_id | string | 是 | 评价用户ID | - | 最大50字符 |
| product_id | string | 是 | 被评价的商品ID（携程商品ID） | - | 最大50字符 |
| rating | int | 是 | 评分，1-5星 | - | 1-5 |
| content | string | 是 | 评价文本内容 | - | 最大2000字符 |
| images | array | 否 | 评价图片数组 | - | 最多9项，每项最大500字符 |
| travel_date | string | 否 | 出行日期，格式：YYYY-MM-DD | - | 最大10字符 |
| is_real | bool | 否 | 是否真实用户评价 | true | false表示AI生成的虚拟评价 |
| helpful_count | int | 否 | 有用点赞数 | 0 | 最小值0 |
| status | string | 否 | 评价状态 | pending | pending, approved, rejected, hidden |
| created_at | timestamp | 是 | 创建时间 | now | - |
| updated_at | timestamp | 是 | 更新时间 | now | - |

## 3. 数据关系与索引设计

### 3.1 核心数据关系
- 商品数据采用携程商品ID (`product_id`) 作为关联键，实现商品信息、行程安排、预订政策的关联
- 用户与会员通过 `user_id` 关联，实现用户基础信息与会员信息的分离
- 订单通过 `user_id` 关联用户，通过 `product_id` 关联商品

### 3.2 主要索引设计
- **a-products**: 对 `product_id` 建立唯一索引，对 `status`、`price_number` 建立复合索引
- **a-itineraries**: 对 `product_id` 建立唯一索引
- **a-booking-policies**: 对 `product_id` 建立唯一索引
- **a-members**: 对 `user_id` 建立唯一索引，对 `level` 建立索引
- **a-orders**: 对 `order_no` 建立唯一索引，对 `user_id`、`status` 建立复合索引
- **a-coupons**: 对 `share_code` 建立唯一索引，对 `issue_type`、`status` 建立复合索引
- **a-user-coupons**: 对 `user_id`、`status` 建立复合索引，对 `coupon_code` 建立唯一索引
- **a-referrals**: 对 `referrer_id`、`referee_id` 建立复合索引
- **a-reviews**: 对 `product_id`、`rating` 建立复合索引，对 `user_id` 建立索引
- **a-system-configs**: 对 `config_key` 建立唯一索引，对 `config_type`、`status` 建立复合索引
- **a-banners**: 对 `status`、`sort_order` 建立复合索引，对 `created_at` 建立索引

## 4. 设计特点与优势

1. **简洁而完整**: 遵循奥卡姆剃刀原则，保持表结构简洁但功能完整，避免过度设计
2. **映射携程数据**: 表结构设计完美映射携程爬虫数据结构，便于数据同步
3. **灵活的配置机制**: 通过系统配置表集中管理业务规则，便于调整和维护
4. **完善的索引设计**: 针对查询场景优化索引，提升系统性能
5. **安全的权限控制**: 每个表都设置了严格的读写权限控制，确保数据安全
6. **冗余字段优化**: 在用户优惠券表等关键表中适当使用冗余字段，减少关联查询，提升查询性能
7. **扩展性良好**: 表结构设计考虑了未来功能扩展的需要，预留了必要的扩展字段

## 5. 数据流转流程

1. **商品数据流**: 通过爬虫从携程获取商品数据 → 存入a-products、a-itineraries、a-booking-policies表 → 前端展示
2. **用户注册流**: 微信一键登录/手机号验证码登录 → 创建uni-id-users记录 → 自动创建a-members记录（普通会员）
3. **订单流程**: 用户下单 → 创建a-orders记录 → 支付 → 更新订单状态 → 更新会员累计消费
4. **会员升级流**: 订单完成 → 更新会员累计消费 → 触发会员等级检查 → 符合条件自动升级
5. **分享奖励流**: 用户分享 → 新用户通过分享链接访问 → 记录推荐关系 → 新用户下单 → 双方获得优惠券
6. **评价流程**: 订单完成 → 用户提交评价 → 存入a-reviews表 → 更新商品评价统计

## 6. 结论

本数据库设计方案充分考虑了携程高端游商家私域运营的业务需求，采用uniCloud云开发平台的DB Schema设计，实现了商品管理、会员体系、订单交易、营销推广等核心功能。设计遵循简洁性原则，同时保证了功能的完整性和扩展性，为系统的稳定运行和后续功能迭代提供了坚实的数据基础。

通过详细的字段表格设计，开发者可以清晰了解每个表的结构、约束和用途，便于进行后续的开发工作。数据库设计既满足了当前业务需求，又为未来的功能扩展预留了空间。 