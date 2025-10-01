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
    "title": "携程商品ID",
    "label": "携程商品ID"
  },
  "title": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      },
      {
        "maxLength": 200
      }
    ],
    "title": "商品标题",
    "label": "商品标题"
  },
  "subtitle": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 500
      }
    ],
    "title": "商品副标题",
    "label": "商品副标题"
  },
  "price": {
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
    "title": "成人价格",
    "label": "成人价格"
  },
  "child_price": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 0
      }
    ],
    "title": "儿童价格",
    "label": "儿童价格"
  },
  "rating": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 0,
        "maximum": 5
      }
    ],
    "title": "产品评分",
    "defaultValue": 5,
    "label": "产品评分"
  },
  "product_images": {
    "rules": [
      {
        "format": "array"
      },
      {
        "arrayType": "string"
      }
    ],
    "title": "商品图片",
    "label": "商品图片"
  },
  "detail_images": {
    "rules": [
      {
        "format": "array"
      },
      {
        "arrayType": "string"
      }
    ],
    "title": "详情图片",
    "label": "详情图片"
  },
  "overview": {
    "rules": [
      {
        "format": "object"
      }
    ],
    "title": "商品概览",
    "label": "商品概览"
  },
  "features": {
    "rules": [
      {
        "format": "array"
      },
      {
        "arrayType": "string"
      }
    ],
    "title": "商品特色",
    "label": "商品特色"
  },
  "cost_info": {
    "rules": [
      {
        "format": "object"
      }
    ],
    "title": "费用说明",
    "label": "费用说明"
  },
  "status": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "number"
      },
      {
        "range": [
          {
            "value": 0,
            "text": 0
          },
          {
            "value": 1,
            "text": 1
          },
          {
            "value": 2,
            "text": 2
          },
          {
            "value": 3,
            "text": 3
          }
        ]
      }
    ],
    "title": "商品状态",
    "defaultValue": 1,
    "label": "商品状态"
  },
  "sort_order": {
    "rules": [
      {
        "format": "number"
      }
    ],
    "title": "排序权重",
    "defaultValue": 0,
    "label": "排序权重"
  },
  "view_count": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 0
      }
    ],
    "title": "浏览次数",
    "defaultValue": 0,
    "label": "浏览次数"
  },
  "sales_count": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 0
      }
    ],
    "title": "销售数量",
    "defaultValue": 0,
    "label": "销售数量"
  },
  "review_count": {
    "rules": [
      {
        "format": "number"
      },
      {
        "minimum": 0
      }
    ],
    "title": "评价数量",
    "defaultValue": 0,
    "label": "评价数量"
  },
  "created_at": {
    "rules": [
      {
        "format": "timestamp"
      }
    ],
    "title": "创建时间",
    "label": "创建时间"
  },
  "updated_at": {
    "rules": [
      {
        "format": "timestamp"
      }
    ],
    "title": "更新时间",
    "label": "更新时间"
  },
  "crawl_timestamp": {
    "rules": [
      {
        "format": "string"
      },
      {
        "maxLength": 50
      }
    ],
    "title": "爬取时间",
    "label": "爬取时间"
  }
}

const enumConverter = {
  "status_valuetotext": [
    {
      "value": 0,
      "text": 0
    },
    {
      "value": 1,
      "text": 1
    },
    {
      "value": 2,
      "text": 2
    },
    {
      "value": 3,
      "text": 3
    }
  ]
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
