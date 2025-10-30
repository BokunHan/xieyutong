// 表单校验规则
const rules = {
	album_id: {
		rules: [
			{
				required: true,
				errorMessage: '相册ID不能为空'
			}
		]
	},
	user_id: {
		rules: [
			{
				required: true,
				errorMessage: '用户ID不能为空'
			}
		]
	},
	is_guide: {
		rules: [
			{
				format: 'bool'
			}
		]
	},
	original_url: {
		rules: []
	},
	compressed_url: {
		rules: []
	},
	shooting_time: {
		rules: []
	},
	day_index: {
		rules: [
			{
				format: 'int'
			}
		]
	}
};

// 字段名称
const attributes = {
	album_id: '相册ID',
	user_id: '用户ID',
	is_guide: '是否导游',
	original_url: '原图地址',
	compressed_url: '压缩图地址',
	shooting_time: '拍摄时间',
	day_index: '行程天数'
};

// 字段值含义
const enumConverter = {};

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
