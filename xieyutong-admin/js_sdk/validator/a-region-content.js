// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
  "region_id": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ],
    "title": "所属区域",
    "label": "所属区域"
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
            "value": "tips",
            "text": "出行提示"
          },
          {
            "value": "precautions",
            "text": "注意事项"
          },
          {
            "value": "must_read",
            "text": "出行前必读"
          }
        ]
      }
    ],
    "title": "内容类型",
    "label": "内容类型"
  },
  "title": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ],
    "title": "标题",
    "label": "标题"
  },
  "content": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "title": "详细内容",
    "label": "详细内容"
  },
  "order": {
    "rules": [
      {
        "format": "int"
      }
    ],
    "title": "排序",
    "defaultValue": 0,
    "label": "排序"
  },
  "status": {
    "rules": [
      {
        "format": "bool"
      }
    ],
    "title": "发布状态",
    "defaultValue": true,
    "label": "发布状态"
  }
}

const enumConverter = {
  "type_valuetotext": {
    "tips": "出行提示",
    "precautions": "注意事项",
    "must_read": "出行前必读"
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
