// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
  "config_key": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      },
      {
        "maxLength": 100
      }
    ],
    "title": "配置键名",
    "label": "配置键名"
  },
  "config_value": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "object"
      }
    ],
    "title": "配置值",
    "label": "配置值"
  },
  "config_type": {
    "rules": [
      {
        "format": "string"
      },
      {
        "range": [
          {
            "value": "member_upgrade",
            "text": "member_upgrade"
          },
          {
            "value": "coupon_rules",
            "text": "coupon_rules"
          },
          {
            "value": "referral_rules",
            "text": "referral_rules"
          },
          {
            "value": "system_params",
            "text": "system_params"
          },
          {
            "value": "app_settings",
            "text": "app_settings"
          },
          {
            "value": "legal_docs",
            "text": "legal_docs"
          }
        ]
      }
    ],
    "title": "配置类型",
    "label": "配置类型"
  },
  "description": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 500
      }
    ],
    "title": "配置描述",
    "label": "配置描述"
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
  "version": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 20
      }
    ],
    "title": "版本号",
    "label": "版本号"
  },
  "effective_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ],
    "title": "生效时间",
    "label": "生效时间"
  },
  "created_by": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 50
      }
    ],
    "title": "创建人",
    "label": "创建人"
  },
  "updated_by": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 50
      }
    ],
    "title": "修改人",
    "label": "修改人"
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
  "config_type_valuetotext": {
    "member_upgrade": "member_upgrade",
    "coupon_rules": "coupon_rules",
    "referral_rules": "referral_rules",
    "system_params": "system_params",
    "app_settings": "app_settings",
    "legal_docs": "legal_docs"
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
