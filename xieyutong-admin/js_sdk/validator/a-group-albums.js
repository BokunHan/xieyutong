// 表单校验规则
const rules = {
	order_id: {
		rules: [
			{
				required: true,
				errorMessage: '订单ID不能为空'
			}
		]
	},
	album_name: {
		rules: [
			{
				required: true,
				errorMessage: '相册名称不能为空'
			}
		]
	},
	start_date: {
		rules: []
	},
	end_date: {
		rules: []
	},
	status: {
		rules: [
			{
				format: 'int'
			}
		]
	}
};

// 字段名称
const attributes = {
	order_id: '订单ID',
	album_name: '相册名称',
	start_date: '开始日期',
	end_date: '结束日期',
	status: '状态'
};

// 字段值含义
const enumConverter = {
	status_valuetotext: {
		0: '待激活',
		1: '进行中',
		2: '已归档'
	}
};

function filterToWhere(filter, command) {
	let where = {};
	for (let field in filter) {
		let { type, value } = filter[field];
		switch (type) {
			case 'search':
				if (typeof value === 'string' && value.length) {
					where[field] = new RegExp(value);
				}
				break;
			case 'select':
				if (value.length) {
					let selectValue = [];
					for (let s of value) {
						selectValue.push(command.eq(s));
					}
					where[field] = command.or(selectValue);
				}
				break;
			case 'range':
				if (value.length) {
					let gt = value[0];
					let lt = value[1];
					where[field] = command.and([command.gte(gt), command.lte(lt)]);
				}
				break;
			case 'date':
				if (value.length) {
					let [s, e] = value;
					let startDate = new Date(s).getTime();
					let endDate = new Date(e).getTime();
					where[field] = command.and([command.gte(startDate), command.lte(endDate)]);
				}
				break;
			case 'timestamp':
				if (value.length) {
					let [s, e] = value;
					let startDate = new Date(s).getTime();
					let endDate = new Date(e).getTime();
					where[field] = command.and([command.gte(startDate), command.lte(endDate)]);
				}
				break;
		}
	}
	return where;
}

export { rules, attributes, enumConverter, filterToWhere };
