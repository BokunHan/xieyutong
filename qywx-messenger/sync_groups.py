import requests
import json
import sqlite3
import time
from datetime import datetime

# ================= 配置区域 =================
CORP_ID = "ww2dbb5ea380efe19c"  # 你的企业ID
CORP_SECRET = "Q67w2pqlZLhidmTCSJfMFHU850Ouy17ju4JC_1GSD0U"  # 你的客户联系 Secret
DB_FILE = "app.db"  # 你的数据库文件路径


# ===========================================

def get_access_token():
    url = f"https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid={CORP_ID}&corpsecret={CORP_SECRET}"
    try:
        res = requests.get(url).json()
        if res['errcode'] == 0:
            return res['access_token']
        else:
            print(f"❌ 获取Token失败: {res}")
            return None
    except Exception as e:
        print(f"❌ 网络错误: {e}")
        return None


def init_db():
    """初始化数据库表结构"""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # 创建一个简单的群组表
    # chat_id: 企业微信唯一的群ID (永远不变)
    # name: 群名 (会变)
    # owner: 群主UserID
    c.execute('''CREATE TABLE IF NOT EXISTS wecom_groups
                 (
                     chat_id
                     TEXT
                     PRIMARY
                     KEY,
                     name
                     TEXT,
                     owner
                     TEXT,
                     member_count
                     INTEGER,
                     updated_at
                     TEXT
                 )''')
    conn.commit()
    return conn


def fetch_group_list(token, owner_userid=None):
    """第一步：获取所有群的ID列表"""
    url = f"https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/list?access_token={token}"
    payload = {
        "status_filter": 0,  # 0=所有状态
        "limit": 1000,  # 单页最大1000，群多的话需要处理 next_cursor 分页
        "offset": 0
    }

    if owner_userid:
        payload["owner_filter"] = {"userid_list": [owner_userid]}
        print(f"    🔍 正在筛选 UserID=[{owner_userid}] 的群...")

    try:
        res = requests.post(url, json=payload).json()
        if res['errcode'] == 0:
            return res['group_chat_list']  # 返回包含 chat_id 的列表
        else:
            print(f"❌ 获取群列表失败: {res}")
            return []
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return []


def fetch_group_details(token, chat_ids):
    """第二步：根据ID批量获取群详情（主要是群名）"""
    url = f"https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/get?access_token={token}"

    details = []
    total = len(chat_ids)

    print(f"    📥 正在获取 {total} 个群的详细信息...")

    for i, item in enumerate(chat_ids):
        cid = item['chat_id']
        payload = {"chat_id": cid}

        try:
            res = requests.post(url, json=payload).json()
            if res['errcode'] == 0:
                group = res['group_chat']
                details.append({
                    "chat_id": group['chat_id'],
                    "name": group['name'],  # 这是我们最需要的！
                    "owner": group['owner'],
                    "member_count": len(group['member_list'])
                })
                # 打印进度
                print(f"    [{i + 1}/{total}] 已获取: {group['name']}")
            else:
                print(f"    [{i + 1}/{total}] 获取详情失败 ID: {cid}")

            # 稍微限制一下频率，防止QPS超限
            if i % 10 == 0:
                time.sleep(0.5)

        except Exception as e:
            print(f"   异常: {e}")

    return details


def save_to_db(conn, groups):
    """第三步：存入数据库 (Upsert: 有则更新，无则插入)"""
    c = conn.cursor()
    count = 0
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for g in groups:
        # 使用 REPLACE INTO 或 INSERT OR REPLACE
        c.execute('''INSERT OR REPLACE INTO wecom_groups 
                     (chat_id, name, owner, member_count, updated_at) 
                     VALUES (?, ?, ?, ?, ?)''',
                  (g['chat_id'], g['name'], g['owner'], g['member_count'], current_time))
        count += 1

    conn.commit()
    print(f"💾 数据库同步完成！共更新/插入 {count} 条记录。")


def fetch_all_groups_data(target_userid=None):
    """
    主入口：根据 UserID 获取群列表
    """
    print(f"    🔄 开始同步群列表 (UserID: {target_userid if target_userid else 'All'})...")

    token = get_access_token()
    if not token: return []

    # 直接使用传入的 UserID 进行过滤
    id_list = fetch_group_list(token, owner_userid=target_userid)

    if not id_list:
        print("⚠️ 未找到任何群组。")
        return []

    # 2. 获取详情 (fetch_group_details 是你原来写好的函数)
    # 注意：确保 fetch_group_details 返回的是 [{chat_id, name, ...}, ...] 格式的列表
    full_data = fetch_group_details(token, id_list)

    print(f"    ✅ 获取到 {len(full_data)} 个群信息")
    return full_data


if __name__ == "__main__":
    # 测试用
    groups = fetch_all_groups_data()
    print(f"测试获取: {len(groups)} 个")

# ================= 主流程 =================
# if __name__ == "__main__":
#     print("🚀 开始同步企业微信群列表...")
#
#     # 1. 连数据库
#     conn = init_db()
#
#     # 2. 拿 Token
#     token = get_access_token()
#
#     if token:
#         # 3. 拿列表 ID
#         id_list = fetch_group_list(token)
#
#         if id_list:
#             # 4. 拿详情
#             real_groups = fetch_group_details(token, id_list)
#
#             # 5. 存库
#             save_to_db(conn, real_groups)
#         else:
#             print("⚠️ 没有获取到任何群组（可能是没有客户群，或者权限不足）。")
#
#     conn.close()
#     print("✅ 同步脚本执行完毕。")