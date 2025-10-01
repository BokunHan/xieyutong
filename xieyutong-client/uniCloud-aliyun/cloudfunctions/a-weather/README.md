# 高德天气API云函数

## 功能说明

这个云函数提供了完整的天气查询服务，集成高德地图天气API，支持：

- 实时天气查询
- 未来4天天气预报
- 批量城市天气查询
- 智能数据格式化

## 配置步骤

### 1. 获取高德地图API Key

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册并登录账号
3. 进入控制台，创建应用
4. 选择"Web服务API"类型
5. 获取API Key

### 2. 配置API Key

**推荐方式：使用uni-config-center统一配置管理**

API Key已配置在 `uniCloud-aliyun/cloudfunctions/common/uni-config-center/a-weather/config.json` 中：

```json
{
  "amapApiKey": "c79c3a382a1a0ee9d06889d1db95f7bd",
  "requestTimeout": 10000,
  "maxCitiesPerBatch": 10,
  "description": "高德地图天气查询服务配置"
}
```

**备用方式：环境变量配置**
```
变量名: AMAP_API_KEY
变量值: 你的高德地图API_KEY
```

### 3. 部署云函数

1. 在HBuilderX中右键点击 `a-weather` 文件夹
2. 选择"上传部署"
3. 等待部署完成

## 使用方法

### 基础天气查询

```javascript
const result = await uniCloud.callFunction({
    name: 'a-weather',
    data: {
        action: 'getWeather',
        city: '110000', // 北京城市编码
        extensions: 'all' // all:预报天气 base:实时天气
    }
})
```

### 根据城市名称查询

```javascript
const result = await uniCloud.callFunction({
    name: 'a-weather',
    data: {
        action: 'getWeatherByCityName',
        cityName: '北京',
        extensions: 'all'
    }
})
```

### 批量查询多个城市

```javascript
const result = await uniCloud.callFunction({
    name: 'a-weather',
    data: {
        action: 'getBatchWeather',
        cities: [
            { name: '北京', code: '110000' },
            { name: '上海', code: '310000' },
            { name: '广州', code: '440100' }
        ],
        extensions: 'base'
    }
})
```

## 返回数据格式

### 预报天气 (extensions: 'all')

```javascript
{
    code: 200,
    message: '获取成功',
    data: {
        type: 'forecast',
        city: '北京市',
        province: '北京',
        casts: [
            {
                date: '2025-01-15',
                dayName: '今天',
                dayweather: '晴',
                nightweather: '晴',
                daytemp: '8',
                nighttemp: '-2',
                formatted: {
                    date: '1月15日',
                    dayName: '今天',
                    condition: '晴',
                    tempRange: '-2°C ~ 8°C',
                    wind: '北风 3级'
                }
            }
        ],
        today: { /* 今天天气 */ },
        tomorrow: { /* 明天天气 */ }
    }
}
```

### 实时天气 (extensions: 'base')

```javascript
{
    code: 200,
    message: '获取成功',
    data: {
        type: 'live',
        city: '北京市',
        weather: '晴',
        temperature: '5',
        humidity: '32',
        formatted: {
            location: '北京 北京市',
            condition: '晴',
            temp: '5°C',
            humidity: '32%',
            wind: '北风 2级'
        }
    }
}
```

## 错误处理

常见错误码：
- `400`: 参数错误
- `500`: 服务器错误或API配置问题

## API 规范说明

### 官方文档对照
- **API地址**: `https://restapi.amap.com/v3/weather/weatherInfo`
- **请求方式**: GET
- **必填参数**:
  - `key`: API密钥
  - `city`: 城市编码(adcode)，参考[城市编码表](https://lbs.amap.com/api/webservice/guide/api/district)
- **可选参数**:
  - `extensions`: 气象类型 (`base`/`all`)
  - `output`: 返回格式 (`JSON`/`XML`)，默认JSON

### 返回状态说明
- `status`: 返回状态，1表示成功，0表示失败
- `infocode`: 状态码，10000表示正确
- `info`: 状态信息描述

### 数据更新频率
- **实况天气**: 每小时更新多次
- **预报天气**: 每天更新3次 (8点、11点、18点左右)
- 以接口返回的 `reporttime` 字段为准

## 注意事项

1. **服务限制**: 高德地图免费版限制30万次/日，200次/秒并发
2. **参数编码**: 城市名称会自动进行URL编码处理
3. **批量查询**: 限制最多10个城市同时查询
4. **缓存建议**: 建议添加缓存机制减少API调用次数
5. **错误处理**: 完整记录API返回的错误信息和状态码

## 支持的城市

支持全国所有地级市及以上城市，包括：
- 直辖市：北京、上海、天津、重庆
- 省会城市：各省省会
- 地级市：全国所有地级市
- 特殊地区：港澳台地区

城市编码查询：[高德地图城市编码表](https://lbs.amap.com/api/webservice/guide/api/district) 