// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
  "product_id": {
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
    "title": "商品ID",
    "label": "商品ID"
  },
  "title": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 200
      }
    ],
    "title": "行程标题",
    "label": "行程标题"
  },
  "sub_title": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 300
      }
    ],
    "title": "行程副标题",
    "label": "行程副标题"
  },
  "duration": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 50
      }
    ],
    "title": "行程时长",
    "label": "行程时长"
  },
  "total_days": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "int"
      },
      {
        "minimum": 1,
        "maximum": 365
      }
    ],
    "title": "总天数",
    "label": "总天数"
  },
  "remarks": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 1000
      }
    ],
    "title": "行程备注",
    "label": "行程备注"
  },
  "itinerary": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "array"
      }
    ],
    "title": "行程安排",
    "label": "行程安排"
  },
  "metadata": {
    "rules": [
      {
        "format": "object"
      }
    ]
  },
  "status": {
    "rules": [
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
            "value": "draft",
            "text": "draft"
          }
        ]
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
  "status_valuetotext": {
    "active": "active",
    "inactive": "inactive",
    "draft": "draft"
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
