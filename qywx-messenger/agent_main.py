import time
import requests
import os
from urllib.parse import urlparse

# 引入我们的两个“干活小弟”
# 请确保这两个文件在同一目录下，并且代码已按之前建议做过微调(封装了函数)
import recommend_actions_crawler as crawler_bot
import messenger as sender_bot
# import sync_groups as sync_bot

# ================= 配置区域 =================
# ⚠️ 替换成你云对象开启 URL 化后的地址
API_BASE_URL = "https://fc-mp-518245e5-51c5-4ee4-8c3f-47f1c20358ab.next.bspapp.com/a-task-rpa"
# API_BASE_URL = "https://fc-mp-9107d457-2ec2-48d8-aad6-a8c52dd3f29c.next.bspapp.com/a-task-rpa"

TEMP_DIR = os.path.join(os.getcwd(), "temp_files")
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

GLOBAL_ACCOUNT_CONFIG = {}

def load_cloud_config():
    """从云端拉取账号配置"""
    print("☁️ 正在拉取云端账号配置...")
    try:
        # 对应 index.obj.js 里的 getAccounts
        res = requests.post(f"{API_BASE_URL}/getAccounts").json()
        if res.get("errCode") == 0:
            data = res.get("data", [])
            for item in data:
                if item.get("name") and item.get("wx_userid"):
                    GLOBAL_ACCOUNT_CONFIG[item["name"]] = item["wx_userid"]
            print(f"✅ 配置已加载: {GLOBAL_ACCOUNT_CONFIG}")
        else:
            print("⚠️ 拉取配置失败")
    except Exception as e:
        print(f"❌ 网络异常: {e}")

# ================= 辅助函数 =================
def download_file(url):
    """把云端链接下载为本地临时文件"""
    if not url or not url.startswith("http"):
        return url

    try:
        parsed = urlparse(url)
        filename = os.path.basename(parsed.path) or f"temp_{int(time.time())}.dat"
        local_path = os.path.join(TEMP_DIR, filename)

        print(f"    ⬇️ 下载资源: {filename}...")
        resp = requests.get(url, stream=True, timeout=30)
        if resp.status_code == 200:
            with open(local_path, 'wb') as f:
                for chunk in resp.iter_content(1024):
                    f.write(chunk)
            return local_path
    except Exception as e:
        print(f"    ❌ 下载失败: {e}")
    return None


def clean_temp_files():
    """清理临时文件"""
    for f in os.listdir(TEMP_DIR):
        try:
            os.remove(os.path.join(TEMP_DIR, f))
        except:
            pass


# ================= 核心循环 =================
def main_loop():
    print("========================================")
    print("🚀 RPA 本地总指挥已启动")
    print(f"📡 连接云端: {API_BASE_URL}")
    print("========================================")

    # 启动时，先拉取账号的云端配置
    load_cloud_config()

    # === 启动时进行账号绑定并存入云端 ===
    my_accounts = sender_bot.bot.bind_accounts()

    if my_accounts:
        print("☁️ 正在将账号同步到云端...")
        try:
            res = requests.post(f"{API_BASE_URL}/updateAccounts", json={"accounts": my_accounts})
            print(f"    ✅ 同步结果: {res.json().get('msg')}")
        except Exception as e:
            print(f"    ❌ 同步失败 (不影响本地运行): {e}")
    else:
        print("⚠️ 未绑定任何账号，只能处理不指定账号的任务。")
    # =================================

    last_sync_time = 0
    SYNC_INTERVAL = 3600  # 1小时同步一次群

    while True:
        try:
            # --- 1. 定时同步群列表 (低优先级) ---
            # if time.time() - last_sync_time > SYNC_INTERVAL:
            #     print("\n🔄 [维护] 开始轮询同步所有账号的群列表...")
            #
            #     # 检查是否已加载配置
            #     if not GLOBAL_ACCOUNT_CONFIG:
            #         # 尝试重新加载一次，防止启动时没网
            #         load_cloud_config()
            #
            #     if GLOBAL_ACCOUNT_CONFIG:
            #         # 遍历每一个账号进行同步
            #         for ac_name, ac_userid in GLOBAL_ACCOUNT_CONFIG.items():
            #             print(f"👉 正在同步账号: [{ac_name}] (UserID: {ac_userid})...")
            #             try:
            #                 # 1. 定向拉取该 UserID 的群
            #                 groups = sync_bot.fetch_all_groups_data(target_userid=ac_userid)
            #
            #                 if groups:
            #                     # 2. 上报时带上 account_name
            #                     requests.post(f"{API_BASE_URL}/updateGroups", json={
            #                         "groups": groups,
            #                         "account_name": ac_name
            #                     })
            #                     print(f"    ✅ {ac_name}: 已同步 {len(groups)} 个群到云端")
            #                 else:
            #                     print(f"    ⚠️ {ac_name}: 未获取到群组 (可能是新号或无权限)")
            #
            #             except Exception as e:
            #                 print(f"       ❌ {ac_name}: 同步出错 {e}")
            #
            #         print("✅ 所有账号同步流程结束")
            #     else:
            #         print("⚠️ 未加载到账号配置(GLOBAL_ACCOUNT_CONFIG为空)，跳过同步。")
            #
            #     last_sync_time = time.time()

            # --- 2. 轮询云端任务 ---
            # 注意：云对象的方法名在 URL 调用时通常是 /getNextTask
            try:
                resp = requests.get(f"{API_BASE_URL}/getNextTask", timeout=15).json()
            except Exception as e:
                print(f"⚠️ 网络连接错误: {e}")
                time.sleep(5)
                continue

            task_type = resp.get("type")
            task_data = resp.get("data")

            # 如果没有任务，休息一下
            if task_type == "none" or not task_data:
                time.sleep(5)
                continue

            print(f"\n⚡ 收到任务: {task_type.upper()}")

            # === A. 执行系统指令 ===
            if task_type == "command":
                cmd_type = task_data.get("type")
                target_account = task_data.get("account")

                print(f"    🔔 收到系统指令: {cmd_type} | 账号: {target_account}")

                # if cmd_type == "sync_groups":
                #     print(f"    🔄 正在为账号 [{target_account}] 同步群列表...")
                #
                #     real_userid = GLOBAL_ACCOUNT_CONFIG.get(target_account)
                #
                #     if not real_userid:
                #         print(f"❌ 错误：账号【{target_account}】未在云端配置 UserID，无法筛选群列表！")
                #         # 你可以在这里选择 return，或者如果不配置就抓取所有(传入None)
                #     else:
                #         print(f"    🔄 账号 [{target_account}] -> UserID [{real_userid}]")
                #
                #         try:
                #             groups = sync_bot.fetch_all_groups_data(target_userid=real_userid)
                #
                #             if groups:
                #                 requests.post(f"{API_BASE_URL}/updateGroups", json={"groups": groups, "account_name": target_account})
                #                 print("    ✅ 同步完成并已上报云端")
                #             else:
                #                 print("    ⚠️ 未获取到群组数据")
                #
                #         except Exception as e:
                #             print(f"    ❌ 同步出错: {e}")

            # === B. 执行抓取任务 ===
            elif task_type == "crawl":
                order_id = task_data.get("order_id")
                print(f"    📦 目标订单: {order_id}")

                try:
                    # 调用爬虫
                    crawl_data = crawler_bot.run_crawler(target_order_id=order_id)

                    if crawl_data:
                        status = "success"
                        print(f"    ✅ 抓取成功，共 {len(crawl_data)} 条数据")
                    else:
                        status = "failed"  # 或者是 success 但为空，看业务定义
                        print("    ⚠️ 抓取结果为空")

                    # 上报结果
                    requests.post(f"{API_BASE_URL}/uploadCrawlResult", json={
                        "order_id": order_id,
                        "status": status,
                        "data": crawl_data
                    })

                except Exception as e:
                    print(f"    ❌ 抓取出错: {e}")
                    requests.post(f"{API_BASE_URL}/uploadCrawlResult", json={
                        "order_id": order_id,
                        "status": "failed",
                        "error": str(e)
                    })

            # === C. 执行发送任务 ===
            elif task_type == "send":
                task_id = task_data.get("_id")
                target_account = task_data.get("account_name")
                group_name = task_data.get("group_name")
                payload = task_data.get("payload", [])
                scheduled_time = task_data.get("send_time")

                print(f"    💬 发送目标: {group_name}")

                # 预处理：下载文件
                processed_payload = []
                download_ok = True

                for item in payload:
                    new_item = item.copy()
                    if item.get('type') in ['file', 'image', 'video']:
                        url = item.get('data')
                        if url and url.startswith("http"):
                            local_path = download_file(url)
                            if local_path:
                                new_item['data'] = local_path
                            else:
                                download_ok = False
                                break
                    processed_payload.append(new_item)

                if download_ok:
                    # 调用发送器
                    success = sender_bot.bot.send_mixed_msg(group_name, processed_payload, account_name=target_account, scheduled_time=scheduled_time)

                    final_status = "sent" if success else "failed"
                    requests.post(f"{API_BASE_URL}/updateSendStatus", json={
                        "task_id": task_id,
                        "status": final_status
                    })
                    print(f"    {'✅ 发送完毕' if success else '❌ 发送失败'}")
                else:
                    print("    ❌ 资源下载失败，取消发送")
                    requests.post(f"{API_BASE_URL}/updateSendStatus", json={
                        "task_id": task_id,
                        "status": "failed",
                        "error": "Download failed"
                    })

                clean_temp_files()

            # 任务间隔
            time.sleep(1)

        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"⚠️ 主循环异常: {e}")
            time.sleep(5)


if __name__ == "__main__":
    main_loop()