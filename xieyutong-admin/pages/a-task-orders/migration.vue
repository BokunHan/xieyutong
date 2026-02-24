<template>
	<view class="p-5">
		<view class="uni-title mb-4 font-bold">旧账号数据迁移</view>
		<view v-if="legacyAccounts.length === 0" class="text-gray-500">暂无需要迁移的旧数据</view>

		<view v-for="(name, index) in legacyAccounts" :key="index" class="flex items-center gap-4 mb-4 p-4 border rounded bg-white">
			<view class="w-32 font-bold">{{ name }}</view>
			<view class="text-gray-400">-></view>
			<view class="flex-1">
				<uni-data-select v-model="selectedAgents[name]" :localdata="agentOptions" placeholder="选择对应的真实管家"></uni-data-select>
			</view>
			<button size="mini" type="primary" @click="doMigrate(name)">确认迁移</button>
		</view>
	</view>
</template>

<script>
const rpa = uniCloud.importObject('a-task-rpa');
const db = uniCloud.database();

export default {
	data() {
		return {
			legacyAccounts: [], // ['大号', '小号']
			agentOptions: [], // [{value: 'id1', text: '张三'}]
			selectedAgents: {} // {'大号': 'id1'}
		};
	},
	async onLoad() {
		this.loadData();
	},
	methods: {
		async loadData() {
			// 1. 加载旧账号
			const legacyRes = await rpa.getLegacyAccounts();
			this.legacyAccounts = legacyRes.data;

			// 2. 加载新管家列表 (用于下拉框)
			const usersRes = await db.collection('uni-id-users').where({ role: 'attendant' }).field('_id, nickname, username').get();
			this.agentOptions = usersRes.result.data.map((u) => ({
				value: u._id,
				text: u.nickname || u.username
			}));
		},
		async doMigrate(oldName) {
			const targetId = this.selectedAgents[oldName];
			if (!targetId) return uni.showToast({ title: '请选择管家', icon: 'none' });

			uni.showLoading({ title: '迁移中...' });
			try {
				const res = await rpa.migrateAccountData({
					oldAccountName: oldName,
					targetAgentId: targetId
				});
				uni.showModal({ content: res.msg, showCancel: false });
				// 迁移成功后从列表移除
				this.legacyAccounts = this.legacyAccounts.filter((n) => n !== oldName);
			} catch (e) {
				uni.showToast({ title: '失败:' + e.message, icon: 'none' });
			} finally {
				uni.hideLoading();
			}
		}
	}
};
</script>
