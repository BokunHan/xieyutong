'use strict';

exports.main = async (event, context) => {
	const db = uniCloud.database();
	const dbCmd = db.command;

	// 动作分发
	switch (event.action) {
		case 'transfer_album_photos':
			return await transferAlbumPhotos(db, event.params);
		default:
			return { errCode: 'INVALID_ACTION', errMsg: '未知操作' };
	}
};

// 【新增】3. 指定迁移相册照片归属（将 user_id 从 A 改成 B）
async function transferAlbumPhotos(db, params) {
	const { oldUid, newUid } = params;

	// 简单的参数校验
	if (!oldUid || !newUid) {
		return {
			errCode: 400,
			errMsg: '参数缺失：请提供 oldUid 和 newUid'
		};
	}

	if (oldUid === newUid) {
		return {
			errCode: 400,
			errMsg: '源用户ID和目标用户ID不能相同'
		};
	}

	try {
		console.log(`开始迁移相册：从 ${oldUid} 到 ${newUid}`);

		const res = await db
			.collection('a-album-photos')
			.where({
				user_id: oldUid
			})
			.update({
				user_id: newUid
			});

		return {
			errCode: 0,
			errMsg: `迁移成功，共更新 ${res.updated} 张照片数据`,
			updated: res.updated,
			oldUid: oldUid,
			newUid: newUid
		};
	} catch (e) {
		return {
			errCode: 500,
			errMsg: '迁移失败：' + e.message
		};
	}
}
