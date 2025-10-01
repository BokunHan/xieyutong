// 天气云函数测试文件
// 在HBuilderX中右键选择"本地运行云函数"进行测试

// 测试1: 获取北京天气预报
const testGetWeather = {
    action: 'getWeather',
    city: '110000',
    extensions: 'all'
}

// 测试2: 根据城市名称获取天气
const testGetWeatherByCityName = {
    action: 'getWeatherByCityName',
    cityName: '林芝',
    extensions: 'all'
}

// 测试3: 批量获取多个城市天气
const testBatchWeather = {
    action: 'getBatchWeather',
    cities: [
        { name: '拉萨', code: '540100' },
        { name: '林芝', code: '540400' },
        { name: '日喀则', code: '540200' }
    ],
    extensions: 'base'
}

// 测试4: 获取实时天气
const testLiveWeather = {
    action: 'getWeather',
    city: '北京',
    extensions: 'base'
}

// 导出测试用例
module.exports = {
    testGetWeather,
    testGetWeatherByCityName,
    testBatchWeather,
    testLiveWeather
}

/*
使用方法：
1. 在HBuilderX中右键点击此文件
2. 选择"本地运行云函数" 
3. 选择要测试的用例
4. 查看控制台输出结果

或者在前端页面中调用：
uniCloud.callFunction({
    name: 'a-weather',
    data: testGetWeatherByCityName
}).then(res => {
    console.log('天气数据:', res.result)
})
*/ 