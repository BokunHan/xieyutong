// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
  "order_no": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      },
      {
        "minLength": 20,
        "maxLength": 28
      }
    ],
    "title": "订单号",
    "label": "订单号"
  },
  "user_id": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ],
    "title": "用户ID",
    "label": "用户ID"
  },
  "product_id": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ],
    "title": "商品ID",
    "label": "商品ID"
  },
  "product_snapshot": {
    "rules": [
      {
        "format": "object"
      }
    ],
    "title": "商品快照",
    "label": "商品快照"
  },
  "status": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      },
      {
        "range": [
          {
            "value": "pending",
            "text": "pending"
          },
          {
            "value": "paid",
            "text": "paid"
          },
          {
            "value": "confirmed",
            "text": "confirmed"
          },
          {
            "value": "processing",
            "text": "processing"
          },
          {
            "value": "completed",
            "text": "completed"
          },
          {
            "value": "cancelled",
            "text": "cancelled"
          },
          {
            "value": "refunded",
            "text": "refunded"
          }
        ]
      }
    ],
    "title": "订单状态",
    "label": "订单状态"
  },
  "quantity": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 1
      }
    ],
    "title": "购买数量",
    "label": "购买数量"
  },
  "total_amount": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 0
      }
    ],
    "title": "订单总金额",
    "label": "订单总金额"
  },
  "discount_amount": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 0
      }
    ],
    "title": "折扣金额",
    "label": "折扣金额"
  },
  "coupon_discount": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 0
      }
    ],
    "title": "优惠券折扣",
    "label": "优惠券折扣"
  },
  "member_discount": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 0
      }
    ],
    "title": "会员折扣",
    "label": "会员折扣"
  },
  "final_amount": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 0
      }
    ],
    "title": "最终支付金额",
    "label": "最终支付金额"
  },
  "coupons_used": {
    "rules": [
      {
        "format": "array"
      }
    ],
    "title": "使用优惠券",
    "label": "使用优惠券"
  },
  "member_level": {
    "rules": [
      {
        "format": "string"
      },
      {
        "range": [
          {
            "value": "normal",
            "text": "normal"
          },
          {
            "value": "silver",
            "text": "silver"
          },
          {
            "value": "gold",
            "text": "gold"
          },
          {
            "value": "diamond",
            "text": "diamond"
          }
        ]
      }
    ],
    "title": "会员等级",
    "label": "会员等级"
  },
  "contact_info": {
    "rules": [
      {
        "format": "object"
      }
    ],
    "title": "联系人信息",
    "label": "联系人信息"
  },
  "travelers": {
    "rules": [
      {
        "format": "array"
      }
    ],
    "title": "出行人信息",
    "label": "出行人信息"
  },
  "departure_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ],
    "title": "出发日期",
    "label": "出发日期"
  },
  "return_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ],
    "title": "返回日期",
    "label": "返回日期"
  },
  "duration_days": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 1
      }
    ],
    "title": "行程天数",
    "label": "行程天数"
  },
  "special_requirements": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "特殊要求",
    "label": "特殊要求"
  },
  "payment_info": {
    "rules": [
      {
        "format": "object"
      }
    ],
    "title": "支付信息",
    "label": "支付信息"
  },
  "ctrip_sync": {
    "rules": [
      {
        "format": "object"
      }
    ],
    "title": "携程同步",
    "label": "携程同步"
  },
  "notes": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "订单备注",
    "label": "订单备注"
  },
  "created_at": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  },
  "updated_at": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  },
  "paid_at": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  },
  "confirmed_at": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  },
  "completed_at": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  },
  "cancelled_at": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  }
}

const enumConverter = {
  "status_valuetotext": {
    "pending": "pending",
    "paid": "paid",
    "confirmed": "confirmed",
    "processing": "processing",
    "completed": "completed",
    "cancelled": "cancelled",
    "refunded": "refunded"
  },
  "member_level_valuetotext": {
    "normal": "normal",
    "silver": "silver",
    "gold": "gold",
    "diamond": "diamond"
  }
}

function filterToWhere(filter, command) {
  let where = {}
  for (let field in filter) {
    let { type, value } = filter[field]
    switch (type) {
      case "search":
        if (typeof value === 'string' && value.length) {
          where[field] = new RegExp(value)
        }
        break;
      case "select":
        if (value.length) {
          let selectValue = []
          for (let s of value) {
            selectValue.push(command.eq(s))
          }
          where[field] = command.or(selectValue)
        }
        break;
      case "range":
        if (value.length) {
          let gt = value[0]
          let lt = value[1]
          where[field] = command.and([command.gte(gt), command.lte(lt)])
        }
        break;
      case "date":
        if (value.length) {
          let [s, e] = value
          let startDate = new Date(s)
          let endDate = new Date(e)
          where[field] = command.and([command.gte(startDate), command.lte(endDate)])
        }
        break;
      case "timestamp":
        if (value.length) {
          let [startDate, endDate] = value
          where[field] = command.and([command.gte(startDate), command.lte(endDate)])
        }
        break;
    }
  }
  return where
}

export { validator, enumConverter, filterToWhere }
