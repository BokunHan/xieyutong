// a-itinerary-service 测试参数
// 用于在uniCloud控制台测试云对象方法

module.exports = {
	// 测试获取当前行程
	getCurrentItinerary: {
		// 这个方法会通过uni-id验证用户身份，因此不需要传入参数
		// 在实际测试时，需要先在客户端登录，获取token后再调用
	},
	
	// 测试时间戳处理
	testTimestampHandling: {
		// 模拟订单数据（基于当前数据库中的真实数据格式）
		orderData: {
			_id: "order_41767537_001",
			departure_date: 1719331200000, // 2024-06-26 (使用数据库中的真实值)
			return_date: 1719936000000,    // 2024-07-03 (使用数据库中的真实值)
			duration_days: 8,
			product_id: "41767537",
			status: "processing"
		},
		
		// 测试时间计算
		currentTimestamp: Date.now(), // 当前时间戳
		
		// 预期结果验证
		expectedResults: {
			// 基于当前时间的预期结果（行程已过期）
			isActiveItinerary: false, // 2024年的行程现在已经过期
			currentDay: 8,           // 计算出的天数（即使过期）
			totalDays: 8,           // 总共8天
			departureFormatted: "2024.06.26", // 格式化的出发日期
			endFormatted: "2024.07.03"        // 格式化的结束日期
		},
		
		// 边界测试案例
		boundaryTests: [
			{
				name: "行程开始当天",
				currentTime: 1719331200000, // 2024-06-26 00:00:00
				expectedDay: 1,
				expectedActive: true
			},
			{
				name: "行程结束当天", 
				currentTime: 1719936000000 - 1, // 2024-07-02 23:59:59
				expectedDay: 8,
				expectedActive: true
			},
			{
				name: "行程结束后",
				currentTime: 1719936000000 + 1, // 2024-07-03 00:00:01
				expectedDay: 8,
				expectedActive: false
			},
			{
				name: "行程开始前",
				currentTime: 1719331200000 - 1, // 2024-06-25 23:59:59
				expectedDay: 1,
				expectedActive: false
			}
		]
	},
	
	// 测试获取行程详情
	getItineraryDetail: {
		productId: "41767537" // 使用数据库中存在的产品ID
	}
}; 