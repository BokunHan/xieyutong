# 携程高端游商家私域运营解决方案

## 项目简介

**项目口号：把平台的客户变成你的客户**

本项目是一个专为携程平台上年GMV千万级以上的高端旅游商家打造的私域运营解决方案。通过仿携程的uniapp云开发小程序，实现携程商品同步、订单管理、用户私域运营的完整商业闭环。

## 🎯 核心价值

- **降低成本**：节约13%的平台流量成本，提供0.6%结费抽成的低成本解决方案
- **自有流量**：将平台用户转化为商家自有用户，建立私域流量池
- **品牌建设**：塑造商家自有品牌，提升客户复购率
- **专业指导**：提供完整的私域运营体系和专业培训

## 🚀 功能特性

### 用户系统

- ✅ 微信一键登录
- ✅ 手机号验证码登录
- ✅ 多级会员体系（普通/银卡/金卡/钻石）
- ✅ 积分系统

### 商品管理

- ✅ 一键同步携程商品
- ✅ 商品展示与搜索
- ✅ 详细商品信息
- ✅ 行程管理

### 订单交易

- ✅ 完整下单支付流程
- ✅ 订单状态跟踪
- ✅ 一键代下单
- ✅ 短信通知
- ✅ 退改服务

### 营销推广

- ✅ 优惠券系统
- ✅ 虚拟销量评价
- ✅ 多级分销体系
- ✅ 一键分享朋友圈

### 内容管理

- ✅ Banner轮播图管理
- ✅ 支持小程序页面和外部网页跳转
- ✅ WebView网页展示
- ✅ 群相册功能

### 数据统计

- ✅ 用户行为分析
- ✅ 订单转化统计
- ✅ 营销效果报表
- ✅ 运营数据看板

## 🛠 技术栈

- **前端框架**：uniapp + Vue 2
- **云开发平台**：uniCloud（阿里云版本）
- **数据库**：uniCloud DB + JQL
- **用户认证**：uni-id
- **支付系统**：uni-pay
- **样式框架**：TailwindCSS（CSS版本）
- **图标系统**：FontAwesome 6（CDN字体加载）
- **配置管理**：uni-config-center

### 技术实现说明

- **TailwindCSS集成**：使用纯CSS版本的TailwindCSS，兼容微信小程序编译环境
- **FontAwesome集成**：通过CDN动态加载字体文件，支持Solid、Regular、Brands三套图标
- **数据库设计**：严格遵循`a-{模块名}`命名规范，配套Schema、初始数据和索引文件
- **组件化开发**：基于uni-app官方组件库，确保跨平台兼容性

## 📁 项目结构

```
xieyutong-client/
├── pages/                          # 页面文件目录
│   ├── home/                       # 首页
│   │   └── home.vue                # 首页组件
│   ├── webview/                    # WebView页面
│   │   └── webview.vue             # 网页浏览组件
│   ├── product-detail/             # 商品详情
│   │   └── product-detail.vue      # 商品详情页组件
│   ├── order/                      # 订单相关页面
│   │   ├── order-list.vue          # 订单列表
│   │   ├── order-detail.vue        # 订单详情
│   │   └── order-booking.vue       # 预订确认
│   ├── travelers/                  # 出行人管理
│   │   └── travelers.vue           # 出行人列表
│   ├── traveler-add/               # 添加出行人
│   │   └── traveler-add.vue        # 添加出行人表单
│   ├── itinerary/                  # 行程详情
│   │   └── itinerary.vue           # 行程详情页
│   ├── favorites-list/             # 收藏夹
│   │   └── favorites-list.vue      # 收藏列表页
│   ├── coupon/                     # 优惠券模块
│   │   ├── coupon.vue              # 优惠券中心
│   │   ├── list.vue                # 优惠券列表
│   │   └── claim.vue               # 领取优惠券
│   ├── search/                     # 搜索功能
│   │   ├── search.vue              # 搜索页面
│   │   └── search-result.vue       # 搜索结果
│   ├── profile/                    # 个人中心
│   │   ├── profile.vue             # 个人中心首页
│   │   └── profile-edit.vue        # 编辑个人信息
│   ├── login/                      # 登录模块
│   │   └── login.vue               # 登录页面
│   └── agreement/                  # 协议页面
│       └── index.vue               # 用户协议
│
├── components/                     # 组件目录
│   └── date-picker/                # 日期选择器
│       └── date-picker.vue         # 日期选择组件
│
├── uni_modules/                    # uni-app官方模块
│   ├── uni-id-pages/               # 用户身份页面
│   ├── uni-id-common/              # 用户身份公共模块
│   ├── uni-config-center/          # 配置中心
│   │   └── uniCloud/
│   │       └── cloudfunctions/
│   │           └── common/
│   │               └── uni-config-center/
│   │                   ├── uni-id/          # uni-id配置
│   │                   ├── uni-pay/         # 支付配置
│   │                   ├── a-weather/       # 天气服务配置
│   │                   ├── a-geocoding/     # 地理编码配置
│   │                   └── a-elevation/     # 海拔查询配置
│   ├── uni-pay/                    # 支付模块
│   ├── uni-captcha/                # 验证码
│   ├── uni-popup/                  # 弹窗组件
│   ├── uni-icons/                  # 图标组件
│   ├── uni-forms/                  # 表单组件
│   ├── uni-list/                   # 列表组件
│   ├── uni-badge/                  # 徽章组件
│   ├── uni-easyinput/              # 输入框组件
│   ├── uni-data-checkbox/          # 数据选择框
│   ├── uni-datetime-picker/        # 日期时间选择器
│   ├── uni-load-more/              # 加载更多
│   ├── uni-scss/                   # SCSS变量
│   └── uni-transition/             # 过渡动画
│
├── uniCloud-aliyun/                # 云开发文件（阿里云）
│   ├── database/                   # 数据库Schema定义
│   │   ├── a-banners.schema.json            # 轮播图表
│   │   ├── a-banners.init_data.json         # 轮播图初始数据
│   │   ├── a-banners.index.json             # 轮播图索引
│   │   ├── a-products.schema.json           # 商品表
│   │   ├── a-products.init_data.json        # 商品初始数据
│   │   ├── a-orders.schema.json             # 订单表
│   │   ├── a-members.schema.json            # 会员表
│   │   ├── a-coupons.schema.json            # 优惠券模板表
│   │   ├── a-user-coupons.schema.json       # 用户优惠券表
│   │   ├── a-reviews.schema.json            # 评价表
│   │   ├── a-itineraries.schema.json        # 行程表
│   │   ├── a-favorites.schema.json          # 收藏表
│   │   ├── a-travelers.schema.json          # 出行人表
│   │   ├── a-referrals.schema.json          # 推荐关系表
│   │   ├── a-booking-policies.schema.json   # 预订政策表
│   │   ├── a-system-configs.schema.json     # 系统配置表
│   │   ├── a-ctrip-sync-logs.schema.json    # 同步日志表
│   │   ├── a-proxy-orders.schema.json       # 代下单记录表
│   │   ├── a-search-hot.schema.json         # 热门搜索表
│   │   ├── a-search-log.schema.json         # 搜索日志表
│   │   └── uni-pay-orders.schema.json       # 支付订单表
│   │
│   └── cloudfunctions/             # 云函数目录
│       ├── common/                 # 公共模块
│       ├── a-order-service/        # 订单服务（云对象）
│       ├── a-member-service/       # 会员服务（云对象）
│       ├── a-favorites-service/    # 收藏服务（云对象）
│       ├── a-itinerary-service/    # 行程服务（云对象）
│       ├── a-proxy-order-service/  # 代下单服务（云对象）
│       ├── a-user-profile/         # 用户资料服务
│       ├── coupon-service/         # 优惠券服务（云函数）
│       ├── ctrip-sync-service/     # 携程同步服务
│       ├── admin-qrcode-service/   # 管理员二维码服务
│       ├── a-weather/              # 天气查询服务
│       ├── a-geocoding/            # 地理编码服务
│       ├── a-elevation/            # 海拔查询服务
│       ├── uni-id-co/              # 用户认证服务
│       ├── uni-pay-co/             # 支付服务
│       ├── uni-sms-co/             # 短信服务
│       ├── uni-portal/             # 门户服务
│       ├── ext-storage-co/         # 存储服务
│       └── uni-analyse-searchhot/  # 搜索热词分析
│
├── static/                         # 静态资源
│   ├── css/                        # 样式文件
│   │   ├── tailwind.css            # TailwindCSS样式
│   │   └── awesome-font.css        # FontAwesome图标
│   ├── tab_icons/                  # 底部导航图标
│   │   ├── home.png                # 首页图标
│   │   ├── home_cur.png            # 首页选中图标
│   │   ├── itinerary.png           # 行程图标
│   │   ├── itinerary_cur.png       # 行程选中图标
│   │   ├── my.png                  # 我的图标
│   │   └── my_cur.png              # 我的选中图标
│   └── logo.png                    # 应用Logo
│
├── data/                           # 测试数据（开发用）
│   ├── booking_note/               # 预订须知测试数据
│   └── itinerary/                  # 行程测试数据
│
├── .cursor/                        # Cursor IDE配置
│   └── rules/                      # 开发规则
│       ├── 00-core-rules/          # 核心规则
│       ├── 01-global-rules/        # 全局规则
│       ├── 02-requirements-rules/  # 需求规则
│       ├── 03-ui-rules/            # UI规则
│       ├── 04-data-rules/          # 数据规则
│       ├── 05-uniapp-rules/        # UniApp规则
│       ├── 06-uniCloud-rules/      # UniCloud规则
│       ├── 07-tool-rules/          # 工具规则
│       └── 08-testing-rules/       # 测试规则
│
├── gaobaozhen/                     # HTML原型文件
│   ├── home.html                   # 首页原型
│   ├── product-detail.html         # 商品详情原型
│   ├── order-list.html             # 订单列表原型
│   └── ...                         # 其他页面原型
│
├── unpackage/                      # 编译输出目录（自动生成）
├── .hbuilderx/                     # HBuilderX配置
├── node_modules/                   # npm依赖（自动生成）
│
├── pages.json                      # 页面路由配置
├── manifest.json                   # 应用配置文件
├── App.vue                         # 应用根组件
├── main.js                         # 应用入口文件
├── uni.scss                        # 全局SCSS变量
├── index.html                      # H5页面模板
├── package.json                    # npm配置文件
├── package-lock.json               # npm依赖锁定
├── .gitignore                      # Git忽略配置
├── database-design.md              # 数据库设计文档
├── ui-design-proposal.md           # UI设计方案
├── search-adaptation-plan.md       # 搜索适配方案
├── TabBar图标生成方案.md           # TabBar图标方案
├── 运营方案_简化版.md              # 运营方案文档
└── README.md                       # 项目说明文档
```

## 🗄️ 数据库设计

### 核心表结构

- **a-banners**: 轮播图管理
- **a-users**: 用户信息
- **a-products**: 商品信息
- **a-orders**: 订单管理
- **a-coupons**: 优惠券系统

### 命名规范

- 所有数据库表必须遵循 `a-{模块名}` 格式
- 使用 DB Schema 定义数据结构
- 配套生成初始化数据和索引配置

## 🔧 安装部署

### 环境要求

- Node.js 16+
- HBuilderX 或 VSCode
- 微信开发者工具
- uniCloud账号

### 安装步骤

1. **克隆项目**

```bash
git clone [项目地址]
cd xieyutong-client
```

2. **安装依赖**

```bash
npm install
```

3. **配置uniCloud**

- 在HBuilderX中关联uniCloud项目
- 上传云函数和数据库Schema
- 配置uni-id参数

4. **小程序配置**

- 在微信公众平台注册小程序
- 配置AppID和AppSecret
- 设置服务器域名

5. **运行项目**

```bash
# 开发调试
npm run dev:mp-weixin

# 编译发布
npm run build:mp-weixin
```

## 📱 功能演示

### Banner管理系统

- 支持图片轮播展示
- 可配置跳转类型（小程序页面/外部网页）
- 点击按钮跳转，图片不可点击
- WebView支持微信公众号文章展示

### 私域运营

- 用户自动注册会员系统
- 新用户自动赠送优惠券
- 完整的积分获取和消费体系
- 多级分销推广机制

## 🎨 设计规范

### UI/UX原则

- **简洁精美**：清爽高级的界面设计
- **仿携程风格**：降低用户学习成本
- **品牌定制**：支持商家Logo和色彩定制
- **响应式设计**：适配不同设备尺寸

### 代码规范

- 遵循Vue 2最佳实践
- 使用TailwindCSS统一样式
- 组件化开发，提高复用性
- 详细的注释和日志记录

## 🔐 安全保障

- 数据加密传输
- 用户隐私保护
- 权限控制管理
- 安全审计日志

## 📈 性能优化

- 图片懒加载
- 数据分页加载
- 缓存策略优化
- CDN加速支持

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码更改
4. 发起 Pull Request

## 📞 联系支持

- **技术支持**：[技术支持邮箱]
- **商务合作**：[商务合作邮箱]
- **用户文档**：[文档地址]

## 📄 许可证

本项目采用 [许可证类型] 许可证，详情请查看 LICENSE 文件。

---

**© 2024 携程高端游商家私域运营解决方案. 保留所有权利.**
