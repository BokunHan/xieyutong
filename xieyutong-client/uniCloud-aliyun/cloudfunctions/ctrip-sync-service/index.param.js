// 测试参数文件，用于验证数据清洗功能
// 在 uniCloud 开发者工具中可以直接运行此测试

module.exports = {
  // 测试数据清洗功能
  "test-data-cleaning": {
    action: "testDataCleaning",
    testData: {
      title: '北京"故宫"深度游 - 一日游体验',
      subtitle: '探索"紫禁城"的神秘历史，感受"皇家"文化的魅力',
      description: '这是一个包含"双引号"的描述文本，还有\'单引号\'和\\反斜杠\\的内容',
      features: [
        '专业导游"贴心"服务',
        '含"午餐"和"门票"',
        '小团"私享"体验'
      ],
      nested: {
        info: {
          note: '注意：请"准时"到达集合地点',
          warning: '警告：携带"有效证件"'
        }
      }
    }
  },
  
  // 测试获取商品详情
  "test-get-detail": {
    action: "getProductDetail",
    productId: "1750906139412"
  },
  
  // 测试API健康检查
  "test-health": {
    action: "checkApiHealth"
  },
  
  // 测试完整同步流程
  "test-full-sync": {
    action: "syncFullProduct",
    productId: "1750906139412",
    uniIdToken: "your-test-token-here"
  }
}