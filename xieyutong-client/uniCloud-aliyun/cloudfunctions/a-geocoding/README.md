# 高德地理编码云函数 (a-geocoding)

## 功能介绍

高德地理编码云函数提供地址与经纬度之间的相互转换服务，基于高德地图Web服务API开发。

### 主要功能

1. **地理编码**：将地址信息转换为经纬度坐标
2. **逆地理编码**：将经纬度坐标转换为详细地址信息
3. **批量地理编码**：同时处理多个地址的编码转换
4. **位置海拔查询**：结合海拔云函数提供完整的位置信息

## API 接口

### 1. 地理编码 (geocode)

将地址信息转换为经纬度坐标。

**调用示例：**
```javascript
const result = await uniCloud.callFunction({
  name: 'a-geocoding',
  data: {
    action: 'geocode',
    address: '拉萨',
    city: '西藏' // 可选，指定查询城市
  }
})
```

**参数说明：**
- `address` (String, 必填): 地址信息，如"拉萨"、"林芝"、"北京市朝阳区"
- `city` (String, 可选): 指定查询城市，提高查询精度

**返回数据：**
```javascript
{
  code: 200,
  message: '地理编码成功',
  data: {
    type: 'geocode',
    query: '拉萨',
    count: 1,
    results: [{
      location: {
        lat: 29.647535,
        lng: 91.117212
      },
      formatted_address: '西藏自治区拉萨市',
      country: '中国',
      province: '西藏自治区',
      city: '拉萨市',
      district: '',
      confidence: 'high',
      formatted: {
        coordinates: '29.647535, 91.117212',
        fullAddress: '中国西藏自治区拉萨市',
        shortAddress: '拉萨市',
        level: '市级别'
      }
    }],
    bestMatch: { /* 最佳匹配结果 */ }
  }
}
```

### 2. 逆地理编码 (regeocode)

将经纬度坐标转换为详细地址信息。

**调用示例：**
```javascript
const result = await uniCloud.callFunction({
  name: 'a-geocoding',
  data: {
    action: 'regeocode',
    lat: 29.647535,
    lng: 91.117212,
    radius: 1000, // 可选，搜索半径（米）
    extensions: 'base' // 可选，返回结果控制
  }
})
```

**参数说明：**
- `lat` (Number, 必填): 纬度
- `lng` (Number, 必填): 经度
- `radius` (Number, 可选): 搜索半径，单位米，默认1000
- `extensions` (String, 可选): 返回结果控制，'base'或'all'，默认'base'

### 3. 批量地理编码 (batchGeocode)

同时处理多个地址的编码转换。

**调用示例：**
```javascript
const result = await uniCloud.callFunction({
  name: 'a-geocoding',
  data: {
    action: 'batchGeocode',
    addresses: ['拉萨', '林芝', '日喀则']
  }
})
```

**参数说明：**
- `addresses` (Array, 必填): 地址列表，最多10个

### 4. 位置海拔查询 (getLocationWithElevation)

获取地点的位置信息和海拔数据（调用海拔云函数）。

**调用示例：**
```javascript
const result = await uniCloud.callFunction({
  name: 'a-geocoding',
  data: {
    action: 'getLocationWithElevation',
    address: '拉萨'
  }
})
```

**返回数据包含：**
- 完整的地理编码信息
- 海拔高度数据
- 格式化的海拔文本

## 配置说明

### API Key 配置

在 `uniCloud-aliyun/cloudfunctions/common/uni-config-center/a-geocoding/config.json` 中配置：

```json
{
  "amapApiKey": "your_amap_api_key_here"
}
```

### 获取高德地图API Key

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册/登录账号
3. 进入控制台，创建应用
4. 添加Key，选择"Web服务"类型
5. 将Key配置到config.json中

## 使用限制

- **免费额额度**: 100万次/日，100次/秒并发
- **批量查询**: 最多支持10个地址同时查询
- **超时设置**: 请求超时时间为10秒
- **数据格式**: 统一使用UTF-8编码

## 应用场景

1. **旅游行程规划**: 将景点名称转换为精确坐标
2. **地图标注**: 为地址信息添加地图标记
3. **位置搜索**: 实现模糊地名搜索功能
4. **海拔查询**: 结合海拔API获取完整位置信息
5. **路径规划**: 为导航应用提供坐标数据

## 错误处理

常见错误码：
- `400`: 参数错误（地址为空、经纬度格式错误等）
- `404`: 未找到地理位置信息
- `500`: 服务异常（API Key错误、网络错误等）

## 性能优化

1. **缓存策略**: 相同地址查询结果可以缓存
2. **批量处理**: 多个地址推荐使用批量接口
3. **精确查询**: 提供city参数可提高查询精度和速度
4. **异常处理**: 完整的错误处理和降级机制

## 更新日志

### v1.0.0 (2024-12-06)
- 初始版本发布
- 支持地理编码和逆地理编码
- 集成uni-config-center配置管理
- 支持批量查询和海拔信息获取 