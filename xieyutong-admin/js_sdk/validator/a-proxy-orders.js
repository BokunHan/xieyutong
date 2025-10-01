// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema.json 更改规则后重新生成

export const enumConverter = {
  "productSource_valuetotext": {
    "system": "系统内部",
    "ctrip": "携程"
  },
  "status_valuetotext": {
    "pending": "待处理",
    "processing": "处理中",
    "completed": "已完成",
    "cancelled": "已取消",
    "failed": "失败"
  }
}

const validator = {
  "orderNo": {
    "rules": [
      {
        "required": true,
        "errorMessage": "订单号不能为空"
      }
    ],
    "label": "订单号"
  },
  "customerPhone": {
    "rules": [
      {
        "required": true,
        "errorMessage": "客户手机号不能为空"
      },
      {
        "pattern": "^1[3-9]\\d{9}$",
        "errorMessage": "请输入正确的手机号格式"
      }
    ],
    "label": "客户手机号"
  },
  "customerName": {
    "rules": [
      {
        "minLength": 2,
        "maxLength": 20,
        "errorMessage": "客户姓名长度应在2-20个字符之间"
      }
    ],
    "label": "客户姓名"
  },
  "productId": {
    "rules": [
      {
        "required": true,
        "errorMessage": "商品ID不能为空"
      }
    ],
    "label": "商品ID"
  },
  "productTitle": {
    "rules": [
      {
        "maxLength": 200,
        "errorMessage": "商品标题长度不能超过200个字符"
      }
    ],
    "label": "商品标题"
  },
  "productSource": {
    "rules": [
      {
        "range": [
          {
            "text": "系统内部",
            "value": "system"
          },
          {
            "text": "携程",
            "value": "ctrip"
          }
        ],
        "errorMessage": "请选择正确的商品来源"
      }
    ],
    "label": "商品来源"
  },
  "departureDate": {
    "rules": [
      {
        "format": "date",
        "errorMessage": "请选择正确的出发时间"
      }
    ],
    "label": "出发时间"
  },
  "amount": {
    "rules": [
      {
        "format": "number",
        "errorMessage": "订单金额必须为数字"
      },
      {
        "minimum": 0,
        "errorMessage": "订单金额不能小于0"
      }
    ],
    "label": "订单金额"
  },
  "adultCount": {
    "rules": [
      {
        "format": "int",
        "errorMessage": "成人数量必须为整数"
      },
      {
        "minimum": 0,
        "errorMessage": "成人数量不能小于0"
      }
    ],
    "label": "成人数量"
  },
  "childCount": {
    "rules": [
      {
        "format": "int",
        "errorMessage": "儿童数量必须为整数"
      },
      {
        "minimum": 0,
        "errorMessage": "儿童数量不能小于0"
      }
    ],
    "label": "儿童数量"
  },
  "status": {
    "rules": [
      {
        "required": true,
        "errorMessage": "订单状态不能为空"
      },
      {
        "range": [
          {
            "text": "待处理",
            "value": "pending"
          },
          {
            "text": "处理中",
            "value": "processing"
          },
          {
            "text": "已完成",
            "value": "completed"
          },
          {
            "text": "已取消",
            "value": "cancelled"
          },
          {
            "text": "失败",
            "value": "failed"
          }
        ],
        "errorMessage": "请选择正确的订单状态"
      }
    ],
    "label": "订单状态"
  },
  "remarks": {
    "rules": [
      {
        "maxLength": 500,
        "errorMessage": "备注信息长度不能超过500个字符"
      }
    ],
    "label": "备注信息"
  },
  "operatorId": {
    "rules": [],
    "label": "操作员ID"
  },
  "operatorName": {
    "rules": [
      {
        "maxLength": 50,
        "errorMessage": "操作员姓名长度不能超过50个字符"
      }
    ],
    "label": "操作员姓名"
  },
  "ctripOrderId": {
    "rules": [
      {
        "maxLength": 100,
        "errorMessage": "携程订单ID长度不能超过100个字符"
      }
    ],
    "label": "携程订单ID"
  },
  "confirmationCode": {
    "rules": [
      {
        "maxLength": 50,
        "errorMessage": "确认码长度不能超过50个字符"
      }
    ],
    "label": "确认码"
  },
  "retryCount": {
    "rules": [
      {
        "format": "int",
        "errorMessage": "重试次数必须为整数"
      },
      {
        "minimum": 0,
        "errorMessage": "重试次数不能小于0"
      }
    ],
    "label": "重试次数"
  }
}

export default validator 