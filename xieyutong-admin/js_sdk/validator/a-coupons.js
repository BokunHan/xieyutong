// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
  "title": {
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
    "title": "券名称",
    "label": "券名称"
  },
  "description": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 200
      }
    ],
    "title": "券描述",
    "label": "券描述"
  },
  "amount": {
    "rules": [
      {
        "required": true
      },
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
        "required": true
      },
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
  "issue_type": {
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
            "value": "manual",
            "text": "manual"
          },
          {
            "value": "auto_referral",
            "text": "auto_referral"
          }
        ]
      }
    ],
    "title": "发券类型",
    "label": "发券类型"
  },
  "total_count": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 0
      }
    ],
    "title": "发放总数",
    "label": "发放总数"
  },
  "used_count": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 0
      }
    ],
    "title": "已使用数",
    "label": "已使用数"
  },
  "valid_days": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 1
      }
    ],
    "title": "有效天数",
    "label": "有效天数"
  },
  "share_code": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 20
      }
    ],
    "title": "分享码",
    "label": "分享码"
  },
  "auto_issue_condition": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 50
      },
      {
        "range": [
          {
            "value": "referrer_reward",
            "text": "referrer_reward"
          },
          {
            "value": "referee_reward",
            "text": "referee_reward"
          }
        ]
      }
    ],
    "title": "自动发券条件",
    "label": "自动发券条件"
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
          }
        ]
      }
    ],
    "title": "状态",
    "label": "状态"
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
  "issue_type_valuetotext": {
    "manual": "manual",
    "auto_referral": "auto_referral"
  },
  "auto_issue_condition_valuetotext": {
    "referrer_reward": "referrer_reward",
    "referee_reward": "referee_reward"
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
