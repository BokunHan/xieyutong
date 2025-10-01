// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
  "user_id": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      },
      {
        "maxLength": 50
      }
    ],
    "title": "用户ID",
    "label": "用户ID"
  },
  "coupon_id": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      },
      {
        "maxLength": 50
      }
    ],
    "title": "优惠券ID",
    "label": "优惠券ID"
  },
  "coupon_code": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 32
      }
    ],
    "title": "优惠券码",
    "label": "优惠券码"
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
            "value": "unused",
            "text": "unused"
          },
          {
            "value": "used",
            "text": "used"
          },
          {
            "value": "expired",
            "text": "expired"
          }
        ]
      }
    ],
    "title": "使用状态",
    "label": "使用状态"
  },
  "order_id": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 50
      }
    ],
    "title": "关联订单ID",
    "label": "关联订单ID"
  },
  "source_type": {
    "rules": [
      {
        "format": "string"
      },
      {
        "range": [
          {
            "value": "manual",
            "text": "manual"
          },
          {
            "value": "referral_reward",
            "text": "referral_reward"
          },
          {
            "value": "new_user_gift",
            "text": "new_user_gift"
          },
          {
            "value": "member_upgrade",
            "text": "member_upgrade"
          },
          {
            "value": "activity",
            "text": "activity"
          }
        ]
      }
    ],
    "title": "获取来源",
    "label": "获取来源"
  },
  "source_detail": {
    "rules": [
      {
        "format": "object"
      }
    ],
    "title": "来源详情",
    "label": "来源详情"
  },
  "received_at": {
    "rules": [
      {
        "format": "timestamp"
      }
    ],
    "title": "领取时间",
    "label": "领取时间"
  },
  "used_at": {
    "rules": [
      {
        "format": "timestamp"
      }
    ],
    "title": "使用时间",
    "label": "使用时间"
  },
  "expired_at": {
    "rules": [
      {
        "format": "timestamp"
      }
    ],
    "title": "过期时间",
    "label": "过期时间"
  },
  "amount": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 0
      }
    ],
    "title": "优惠金额",
    "label": "优惠金额"
  },
  "min_amount": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 0
      }
    ],
    "title": "使用门槛",
    "label": "使用门槛"
  },
  "title": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 50
      }
    ],
    "title": "券标题",
    "label": "券标题"
  },
  "remark": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 200
      }
    ],
    "title": "备注",
    "label": "备注"
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
  }
}

const enumConverter = {
  "status_valuetotext": {
    "unused": "unused",
    "used": "used",
    "expired": "expired"
  },
  "source_type_valuetotext": {
    "manual": "manual",
    "referral_reward": "referral_reward",
    "new_user_gift": "new_user_gift",
    "member_upgrade": "member_upgrade",
    "activity": "activity"
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
