# 代下单服务云函数测试用例

## 使用说明
将以下任意一个测试用例复制到 `a-proxy-order-service.param.json` 文件中进行测试。

## 1. 搜索商品（无需登录）
```json
{
  "action": "searchProduct",
  "productId": "test_product_001"
}
```

## 2. 创建代下单订单（需要登录）
```json
{
  "action": "createProxyOrder",
  "uniIdToken": "your_token_here",
  "customerPhone": "13800138000",
  "productId": "test_product_001",
  "productTitle": "测试旅游产品",
  "productSource": "system",
  "departureDate": "2025-08-15",
  "amount": 2999.00,
  "adultCount": 2,
  "childCount": 1,
  "remarks": "这是一个测试订单"
}
```

## 3. 获取订单列表（需要登录）
```json
{
  "action": "getProxyOrderList",
  "uniIdToken": "your_token_here",
  "page": 1,
  "limit": 10,
  "status": "",
  "keyword": ""
}
```

## 4. 获取今日统计（需要登录）
```json
{
  "action": "getTodayStatistics",
  "uniIdToken": "your_token_here"
}
```

## 5. 获取订单详情（需要登录）
```json
{
  "action": "getProxyOrderDetail",
  "uniIdToken": "your_token_here",
  "orderId": "order_id_here"
}
```

## 6. 更新订单状态（需要登录）
```json
{
  "action": "updateProxyOrderStatus",
  "uniIdToken": "your_token_here",
  "orderId": "order_id_here",
  "status": "completed",
  "ctripOrderId": "ctrip_123456",
  "confirmationCode": "CONF_789",
  "message": "订单处理完成"
}
```

## 7. 重试订单（需要登录）
```json
{
  "action": "retryProxyOrder",
  "uniIdToken": "your_token_here",
  "orderId": "order_id_here"
}
```

## 获取登录 Token 的方法
需要先通过以下云函数获取有效的 uniIdToken：

```javascript
// 在前端页面中获取token
const token = uni.getStorageSync('uni_id_token');
console.log('当前登录token:', token);
```

或者通过 uni-id-co 云函数登录获取：

```json
{
  "action": "loginByWeixinMobile",
  "phoneCode": "your_phone_code",
  "inviteCode": ""
}
```

## 错误码说明
- `0`: 成功
- `TOKEN_INVALID`: Token无效或已过期
- `INVALID_PARAMS`: 参数错误
- `INVALID_PHONE`: 手机号格式不正确
- `CREATE_FAILED`: 创建失败
- `ORDER_NOT_FOUND`: 订单不存在
- `SYSTEM_ERROR`: 系统错误