const validator = {
	name: {
		rules: [
			{
				required: true,
				errorMessage: '{label}不能为空'
			}
		],
		label: 'POI名称'
	},
	aliases: {
		rules: [
			{
				format: 'array'
			}
		],
		label: '别名/俗称'
	},
	category_id: {
		rules: [
			{
				required: true,
				errorMessage: '{label}不能为空'
			},
			{
				format: 'string'
			}
		],
		label: 'POI分类'
	},
	region_ids: {
		rules: [
			{
				format: 'array'
			}
		],
		label: '所属区域'
	},
	media: {
		rules: [
			{
				format: 'array'
			}
		],
		label: '媒体库(图/视频)'
	},
	description: {
		rules: [],
		label: '富文本介绍'
	},
	address_text: {
		rules: [],
		label: '详细地址'
	},
	tags: {
		rules: [
			{
				format: 'array'
			}
		],
		label: 'POI标签'
	}
};

const enumConverter = {
	category_id_valuetotext: {},
	region_ids_valuetotext: {},
	tags_valuetotext: {}
};

function filterToWhere(filter, command) {
	let where = {};
	for (let field in filter) {
		let { type, value } = filter[field];
		switch (type) {
			case 'search':
				if (typeof value === 'string' && value.length) {
					where[field] = new RegExp(value, 'i');
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
					let startDate = new Date(s);
					let endDate = new Date(e);
					where[field] = command.and([command.gte(startDate), command.lte(endDate)]);
				}
				break;
			case 'timestamp':
				if (value.length) {
					let [s, e] = value;
					where[field] = command.and([command.gte(s), command.lte(e)]);
				}
				break;
		}
	}
	return where;
}

export { validator, enumConverter, filterToWhere };
