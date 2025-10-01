# Google Maps海拔API云函数

## 功能说明

这个云函数提供了完整的海拔查询服务，集成Google Maps Elevation API，支持：

- 指定位置海拔查询
- 路径沿线海拔剖面查询
- 批量位置海拔查询
- 智能数据格式化和分析

## 配置步骤

### 1. 获取Google Maps API Key

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 **Elevation API**
4. 创建凭据并获取API Key
5. 配置API Key的使用限制（推荐限制来源和API）

### 2. 配置API Key

在uniCloud控制台中配置环境变量：

```
变量名: GOOGLE_MAPS_API_KEY
变量值: 你的Google_Maps_API_Key
```

或者在云函数中直接配置（不推荐）：
```javascript
const apiKey = 'your_google_maps_api_key_here'
```

### 3. 部署云函数

1. 在HBuilderX中右键点击 `a-elevation` 文件夹
2. 选择"上传部署"
3. 等待部署完成

## 使用方法

### 1. 获取指定位置海拔

```javascript
const result = await uniCloud.callFunction({
    name: 'a-elevation',
    data: {
        action: 'getElevationForLocations',
        locations: [
            { lat: 39.9042, lng: 116.4074 }, // 北京天安门
            { lat: 31.2304, lng: 121.4737 }  // 上海外滩
        ]
    }
})
```

### 2. 获取路径沿线海拔剖面

```javascript
const result = await uniCloud.callFunction({
    name: 'a-elevation',
    data: {
        action: 'getElevationAlongPath',
        path: [
            { lat: 36.579, lng: -118.292 }, // Mt. Whitney起点
            { lat: 36.606, lng: -118.0638 }, // Lone Pine
            { lat: 36.433, lng: -117.951 },  // Owens Lake
            { lat: 36.24, lng: -116.832 }    // Badwater终点
        ],
        samples: 50 // 沿路径采样50个点
    }
})
```

### 3. 批量获取多组位置海拔

```javascript
const result = await uniCloud.callFunction({
    name: 'a-elevation',
    data: {
        action: 'getBatchElevation',
        locationGroups: [
            {
                name: '北京景点',
                locations: [
                    { lat: 39.9042, lng: 116.4074 }, // 天安门
                    { lat: 40.4319, lng: 116.5704 }  // 长城
                ]
            },
            {
                name: '上海景点',
                locations: [
                    { lat: 31.2304, lng: 121.4737 }, // 外滩
                    { lat: 31.2397, lng: 121.4996 }  // 东方明珠
                ]
            }
        ]
    }
})
```

## 返回数据格式

### 位置海拔查询结果

```javascript
{
    code: 200,
    message: '获取成功',
    data: {
        type: 'locations',
        count: 2,
        results: [
            {
                location: { lat: 39.9042, lng: 116.4074 },
                elevation: 44.08,
                resolution: 19.11,
                formatted: {
                    elevation: '44米',
                    elevationText: '海拔44米',
                    coordinates: '39.904200, 116.407400',
                    resolution: '精度19米'
                }
            }
        ],
        locationInfo: {
            totalLocations: 2,
            averageElevation: 35.42
        }
    }
}
```

### 路径海拔剖面结果

```javascript
{
    code: 200,
    message: '获取成功',
    data: {
        type: 'path',
        count: 50,
        results: [
            {
                location: { lat: 36.579, lng: -118.292 },
                elevation: 4421.09,
                resolution: 30.48,
                formatted: {
                    elevation: '4421米',
                    elevationText: '海拔4421米',
                    coordinates: '36.579000, -118.292000',
                    resolution: '精度30米'
                }
            }
            // ... 更多采样点数据
        ],
        pathInfo: {
            originalPath: [/* 原始路径 */],
            samples: 50,
            maxElevation: 4421.09,
            minElevation: -85.32,
            elevationGain: 4506.41,
            formatted: {
                maxElevation: '最高4421米',
                minElevation: '最低-85米',
                elevationGain: '高差4506米'
            }
        }
    }
}
```

## API 规范说明

### 官方文档对照
- **API地址**: `https://maps.googleapis.com/maps/api/elevation/json`
- **请求方式**: GET
- **必填参数**:
  - `key`: Google Maps API密钥
  - `locations` 或 `path`: 位置信息
- **可选参数**:
  - `samples`: 路径采样点数量 (2-512)

### 返回状态说明
- `OK`: 请求成功
- `INVALID_REQUEST`: 请求格式无效
- `OVER_QUERY_LIMIT`: 查询次数超出限制
- `REQUEST_DENIED`: 请求被拒绝
- `UNKNOWN_ERROR`: 未知错误

### 数据精度说明
- **海拔精度**: 通常在±1米以内
- **分辨率**: 表示插值计算时使用的数据点间距
- **负值处理**: 海平面以下位置返回负值（如海底）

## 应用场景

### 1. 远足和骑行应用
- 路线海拔剖面图
- 爬升难度评估
- 体力消耗计算

### 2. 移动定位应用
- 实时海拔显示
- 高度变化监测
- 运动轨迹分析

### 3. 地理信息系统
- 地形分析
- 海拔数据可视化
- 地理测量应用

## 注意事项

1. **服务限制**: Google Maps免费配额有限，建议配置使用限制
2. **采样密度**: 路径采样点越多，数据越详细，但消耗配额也越多
3. **精度说明**: 多点查询时精度可能降低，单点查询精度最高
4. **缓存建议**: 建议对相同位置的查询结果进行缓存
5. **错误处理**: 完整记录API返回的错误信息便于调试

## 定价和配额

### 免费配额
- 每月免费额度：具体查看Google Cloud Console
- 超出后按使用量计费

### 优化建议
1. 合理设置路径采样点数量
2. 避免重复查询相同位置
3. 实施客户端缓存策略
4. 监控API使用量

## 支持的地理范围

- **全球覆盖**: 支持地球表面所有位置
- **海洋深度**: 支持海底深度查询（返回负值）
- **高山海拔**: 支持高海拔地区查询
- **精度保证**: 陆地区域精度通常优于海洋区域

## 错误处理

常见错误码：
- `400`: 参数错误（位置格式、采样数量等）
- `500`: 服务器错误或API配置问题
- `OVER_QUERY_LIMIT`: 配额超限
- `REQUEST_DENIED`: API密钥问题

## 技术支持

如需技术支持或有疑问，请参考：
- [Google Maps Elevation API官方文档](https://developers.google.com/maps/documentation/elevation)
- [Google Cloud Console](https://console.cloud.google.com/) 