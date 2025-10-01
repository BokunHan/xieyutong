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
  "level": {
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
  "total_consumption": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 0
      }
    ],
    "title": "累计消费",
    "label": "累计消费"
  },
  "order_count": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 0
      }
    ],
    "title": "订单数量",
    "label": "订单数量"
  },
  "upgrade_threshold": {
    "rules": [
      {
        "format": "object"
      }
    ],
    "title": "升级条件",
    "label": "升级条件"
  },
  "benefits": {
    "rules": [
      {
        "format": "object"
      }
    ],
    "title": "会员权益",
    "label": "会员权益"
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
            "value": "active",
            "text": "active"
          },
          {
            "value": "inactive",
            "text": "inactive"
          },
          {
            "value": "suspended",
            "text": "suspended"
          }
        ]
      }
    ]
  },
  "join_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  },
  "upgrade_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  },
  "expire_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
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
  "level_valuetotext": {
    "normal": "normal",
    "silver": "silver",
    "gold": "gold",
    "diamond": "diamond"
  },
  "status_valuetotext": {
    "active": "active",
    "inactive": "inactive",
    "suspended": "suspended"
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
