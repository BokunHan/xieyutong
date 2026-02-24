const db = uniCloud.database();
const dbCmd = db.command;

// 辅助函数：获取北京时间
function getBjTimeStr() {
	const now = new Date();
	const tzOffset = 8 * 60 * 60 * 1000;
	const time = now.getTime() + now.getTimezoneOffset() * 60 * 1000 + tzOffset;
	const d = new Date(time);
	const Y = d.getFullYear();
	const M = (d.getMonth() + 1).toString().padStart(2, '0');
	const D = d.getDate().toString().padStart(2, '0');
	const h = d.getHours().toString().padStart(2, '0');
	const m = d.getMinutes().toString().padStart(2, '0');
	const s = d.getSeconds().toString().padStart(2, '0');
	return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

module.exports = {
	_before: function () {},

	/**
	 * 专门用于轮询的任务获取接口
	 */
	async getNextTask() {
		try {
			// === 1. 查系统指令 ===
			const cmdRes = await db.collection('a-task-commands').where({ status: 'pending' }).orderBy('created_at', 'asc').limit(1).get();
			if (cmdRes.data.length > 0) {
				const cmd = cmdRes.data[0];
				// 领走指令
				await db.collection('a-task-commands').doc(cmd._id).update({ status: 'done' });
				return { type: 'command', data: cmd };
			}

			// === 2. 查待发送消息 ===
			const nowStr = getBjTimeStr();
			const sendRes = await db
				.collection('a-task-queue')
				.where({
					status: 'pending',
					send_time: dbCmd.lte(nowStr)
				})
				.orderBy('priority', 'desc')
				.orderBy('send_time', 'asc')
				.limit(1)
				.get();

			if (sendRes.data.length > 0) {
				return { type: 'send', data: sendRes.data[0] };
			}

			// === 3. 查待抓取订单 ===
			const crawlRes = await db.collection('a-task-orders').where({ crawl_status: 'pending' }).orderBy('created_at', 'asc').limit(1).get();
			if (crawlRes.data.length > 0) {
				const task = crawlRes.data[0];
				// 标记为处理中
				await db.collection('a-task-orders').doc(task._id).update({ crawl_status: 'processing' });
				return { type: 'crawl', data: task };
			}

			return { type: 'none', data: null };
		} catch (e) {
			console.error('获取任务出错:', e);
			return { type: 'none', data: null, error: e.message };
		}
	},

	/**
	 * 获取抢单配置 (Python RPA专用)
	 */
	async getGrabConfig() {
		const res = await db.collection('a-management-configs').doc('GLOBAL_CONFIG').field({ grab_settings: 1 }).get();
		if (res.data && res.data.length > 0) {
			return { code: 0, data: res.data[0].grab_settings || {} };
		}
		return { code: 0, data: { enabled: false } }; // 默认关闭
	}
};
