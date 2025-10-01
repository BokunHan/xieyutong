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
  "rating": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "int"
      },
      {
        "minimum": 1,
        "maximum": 5
      }
    ],
    "title": "评分",
    "label": "评分"
  },
  "content": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      },
      {
        "maxLength": 2000
      }
    ],
    "title": "评价内容",
    "label": "评价内容"
  },
  "images": {
    "rules": [
      {
        "format": "array"
      }
    ],
    "title": "评价图片",
    "label": "评价图片"
  },
  "travel_date": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 10
      }
    ],
    "title": "出行日期",
    "label": "出行日期"
  },
  "is_real": {
    "rules": [
      {
        "format": "bool"
      }
    ],
    "title": "真实评价",
    "label": "真实评价"
  },
  "helpful_count": {
    "rules": [
      {
        "format": "int"
      },
      {
        "minimum": 0
      }
    ],
    "title": "有用数",
    "label": "有用数"
  },
  "status": {
    "rules": [
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
            "value": "approved",
            "text": "approved"
          },
          {
            "value": "rejected",
            "text": "rejected"
          },
          {
            "value": "hidden",
            "text": "hidden"
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
    "pending": "pending",
    "approved": "approved",
    "rejected": "rejected",
    "hidden": "hidden"
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
