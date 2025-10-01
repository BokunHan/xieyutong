// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
  "user_id": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "name": {
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
    ]
  },
  "type": {
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
            "value": "成人",
            "text": "成人"
          },
          {
            "value": "儿童",
            "text": "儿童"
          }
        ]
      }
    ],
    "defaultValue": "成人"
  },
  "id_card": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      },
      {
        "maxLength": 18
      }
    ]
  },
  "phone": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 20
      }
    ]
  },
  "birthday": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 10
      },
      {
        "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
      }
    ]
  },
  "is_main": {
    "rules": [
      {
        "format": "bool"
      }
    ],
    "defaultValue": false
  },
  "gender": {
    "rules": [
      {
        "format": "string"
      },
      {
        "range": [
          {
            "value": "男",
            "text": "男"
          },
          {
            "value": "女",
            "text": "女"
          },
          {
            "value": "未知",
            "text": "未知"
          }
        ]
      }
    ],
    "defaultValue": "未知"
  },
  "passport": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 30
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
          }
        ]
      }
    ],
    "defaultValue": "active"
  },
  "remark": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 200
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
  "type_valuetotext": {
    "成人": "成人",
    "儿童": "儿童"
  },
  "gender_valuetotext": {
    "男": "男",
    "女": "女",
    "未知": "未知"
  },
  "status_valuetotext": {
    "active": "active",
    "inactive": "inactive"
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
