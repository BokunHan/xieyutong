// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema.json 更改。
// 如果手动修改过校验规则，之后 schema2code 将不再覆盖此文件。

const validator = {
  "ctrip_id": {
    "rules": [
      {
        "required": true,
        "message": "请输入携程商品ID"
      }
    ],
    "title": "携程商品ID",
    "label": "携程商品ID"
  },
  "product_id": {
    "rules": [],
    "title": "商品ID",
    "label": "商品ID"
  },
  "sync_type": {
    "rules": [
      {
        "required": true,
        "message": "请选择同步类型"
      },
      {
        "range": [
          {
            "text": "商品详情",
            "value": "product_detail"
          },
          {
            "text": "行程安排",
            "value": "itinerary"
          },
          {
            "text": "预订须知", 
            "value": "booking_policies"
          },
          {
            "text": "全部同步",
            "value": "full_sync"
          }
        ],
        "message": "请选择正确的同步类型"
      }
    ],
    "title": "同步类型",
    "label": "同步类型"
  },
  "sync_status": {
    "rules": [
      {
        "required": true,
        "message": "请选择同步状态"
      },
      {
        "range": [
          {
            "text": "同步中",
            "value": "syncing"
          },
          {
            "text": "成功",
            "value": "success"
          },
          {
            "text": "失败",
            "value": "failed"
          }
        ],
        "message": "请选择正确的同步状态"
      }
    ],
    "title": "同步状态",
    "label": "同步状态"
  },
  "crawl_source": {
    "rules": [],
    "title": "爬取数据源",
    "label": "爬取数据源"
  },
  "operator_id": {
    "rules": [],
    "title": "操作人ID",
    "label": "操作人ID"
  },
  "duration": {
    "rules": [
      {
        "format": "int"
      }
    ],
    "title": "同步耗时",
    "label": "同步耗时"
  }
}

const enumConverter = {
  "sync_type_valuetotext": {
    "product_detail": "商品详情",
    "itinerary": "行程安排", 
    "booking_policies": "预订须知",
    "full_sync": "全部同步"
  },
  "sync_status_valuetotext": {
    "syncing": "同步中",
    "success": "成功",
    "failed": "失败"
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