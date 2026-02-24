import time
import requests
import os
import re
from urllib.parse import urlparse
import hashlib
import msvcrt

# 引入我们的两个“干活小弟”
import recommend_actions_crawler as crawler_bot
import messenger as sender_bot

# ================= 配置区域 =================
# 测试订单：1128141975223901
# ⚠️ 替换成你云对象开启 URL 化后的地址
# BASE_URL = "https://fc-mp-518245e5-51c5-4ee4-8c3f-47f1c20358ab.next.bspapp.com"
BASE_URL = "https://fc-mp-9107d457-2ec2-48d8-aad6-a8c52dd3f29c.next.bspapp.com"

RPA_URL = BASE_URL + "/a-task-rpa"
POLLER_URL = BASE_URL + "/a-task-poller"
NOTIFIER_URL = BASE_URL + "/attendant-notifier"

TEMP_DIR = os.path.join(os.getcwd(), "temp_files")
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

GLOBAL_ACCOUNT_CONFIG = {}
PAUSE_GRAB_ORDERS = False

def load_cloud_config():
    """从云端拉取账号配置"""
    print("正在拉取云端账号配置...")
    try:
        # 对应 index.obj.js 里的 getAccounts
        res = requests.post(f"{RPA_URL}/getAccounts").json()
        if res.get("errCode") == 0:
            data = res.get("data", [])
            for item in data:
                if item.get("name") and item.get("wx_userid"):
                    GLOBAL_ACCOUNT_CONFIG[item["name"]] = item["wx_userid"]
            print(f"配置已加载: {GLOBAL_ACCOUNT_CONFIG}")
        else:
            print("拉取配置失败")
    except Exception as e:
        print(f"网络异常: {e}")

# ================= 辅助函数 =================
def get_file_hash(url):
    # 简单的用 URL 做哈希文件名，避免重复下载
    return hashlib.md5(url.encode('utf-8')).hexdigest()

def download_file(url):
    """把云端链接下载为本地临时文件"""
    if not url or not url.startswith("http"):
        return url

    try:
        parsed = urlparse(url)
        # filename = os.path.basename(parsed.path) or f"temp_{int(time.time())}.dat"
        # local_path = os.path.join(TEMP_DIR, filename)

        ext = os.path.splitext(parsed.path)[1] or ".dat"
        # 使用 URL 哈希作为文件名，确保同一个 URL 不会重复下载
        filename = f"{get_file_hash(url)}{ext}"
        local_path = os.path.join(TEMP_DIR, filename)

        # 如果文件已存在且大小不为0，直接返回，不再下载
        if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
            print(f"    使用本地缓存: {filename}")
            return local_path

        print(f"    下载资源: {filename}...")
        resp = requests.get(url, stream=True, timeout=30)
        if resp.status_code == 200:
            with open(local_path, 'wb') as f:
                for chunk in resp.iter_content(1024):
                    f.write(chunk)
            return local_path
    except Exception as e:
        print(f"    下载失败: {e}")
    return None


def clean_temp_files():
    """清理临时文件"""
    for f in os.listdir(TEMP_DIR):
        try:
            os.remove(os.path.join(TEMP_DIR, f))
        except:
            pass

def get_remote_attendants():
    """从云端获取管家列表"""
    print(" 正在获取云端管家列表...")
    try:
        # 调用刚才在 index.obj.js 里写的新接口
        res = requests.post(f"{RPA_URL}/getAttendantList").json()
        if res.get("errCode") == 0:
            return res.get("data", []) # 返回 [{"name": "张三", "id": "xxx"}, ...]
        else:
            print(f" 获取失败: {res.get('errMsg')}")
            return []
    except Exception as e:
        print(f" 网络异常: {e}")
        return []

def check_keyboard_input():
    """检测键盘输入，控制暂停/继续"""
    global PAUSE_GRAB_ORDERS
    # msvcrt.kbhit() 检测是否有键被按下，不阻塞
    if msvcrt.kbhit():
        # getch() 获取按键，decode 转为字符串，lower 转小写
        try:
            key = msvcrt.getch().decode('utf-8').lower()
            if key == 'p':
                PAUSE_GRAB_ORDERS = not PAUSE_GRAB_ORDERS
                status_str = " 已暂停抢单" if PAUSE_GRAB_ORDERS else " 已恢复抢单"
                print(f"\n{'='*40}")
                print(f"   指令收到: {status_str}")
                print(f"{'='*40}\n")
        except:
            pass # 防止特殊按键报错

def check_pause_status():
    """
    专门传给 crawler 模块的回调函数
    既检查键盘，又返回当前状态
    """
    check_keyboard_input() # 顺便检查有没有按键
    return PAUSE_GRAB_ORDERS

def smart_sleep(seconds):
    """智能休眠：休眠期间也会不断检测按键"""
    start_time = time.time()
    while time.time() - start_time < seconds:
        check_keyboard_input() # 每次小睡前都检查一下键盘
        time.sleep(0.1) # 0.1秒的颗粒度

def load_grab_settings():
    """从云端拉取抢单配置"""
    try:
        res = requests.post(f"{POLLER_URL}/getGrabConfig").json()
        if res.get("code") == 0:
            return res.get("data", {})
    except Exception as e:
        print(f" [Config] 拉取抢单配置失败: {e}")
    return {}

def process_dynamic_weather(payload, task_info):
    """
    [JIT 渲染] 扫描 payload 中的天气占位符，调用云端获取最新数据
    占位符格式: {{WEATHER::行程标题字符串::Offset}}
    """
    processed_payload = []
    has_error = False
    error_detail = ""

    for item in payload:
        if item.get('type') == 'text':
            content = item.get('data', '')
            # 正则匹配
            matches = re.findall(r'\{\{WEATHER::(.*?)::(\d+)\}\}', content)
            
            if matches:
                print(f"     发现动态天气占位符，正在进行 JIT 查询...")
                for location_query, offset in matches:
                    placeholder = f"{{{{WEATHER::{location_query}::{offset}}}}}"
                    
                    try:
                        # 调用云端接口
                        res = requests.post(f"{RPA_URL}/getRealtimeWeatherStr", json={
                            "city": location_query, 
                            "dayOffset": int(offset)
                        }, timeout=10).json()

                        if res.get("errCode") == 0:
                            real_weather = res.get("data")
                            content = content.replace(placeholder, real_weather)
                            print(f"      天气更新成功: {real_weather}")
                        else:
                            raise Exception(res.get("errMsg", "云端返回错误"))

                    except Exception as e:
                        print(f"      天气查询失败: {e}")
                        has_error = True
                        error_detail = str(e)
                        # 兜底替换
                        fallback_text = "近期气温较低，早晚温差大，请穿羽绒服。"
                        content = content.replace(placeholder, fallback_text)
            
            item['data'] = content
        
        processed_payload.append(item)

    if has_error:
        print(f"     [警告] 天气获取存在失败: {error_detail}")

    return processed_payload

# ================= 核心循环 =================
def main_loop():
    print("========================================")
    print("  RPA 本地总指挥已启动")
    print(f"  连接云端: {RPA_URL}")
    print("   操作指南: 点击本黑窗口，按 'p' 键暂停/继续抢单功能")
    print("========================================")

    # 1. 获取云端管家名单
    attendants_list = get_remote_attendants()

    # 2. 传入名单，开始交互式绑定
    # sender_bot.bot.bind_accounts(account_options=attendants_list)

    valid_ids = sender_bot.bot.auto_bind_accounts(attendants_list)

    if not valid_ids:
        print(" 警告：未识别到任何有效账号！即将进入纯人工绑定模式作为兜底...")
        sender_bot.bot.bind_accounts(account_options=attendants_list)
    # =================================

    last_grab_time = 0
    current_grab_interval = 30  # 默认30秒

    min_interval = 3  # 最小间隔 3秒
    max_interval = 30  # 最大间隔 30秒
    current_interval = min_interval

    while True:
        check_keyboard_input()

        try:
            try:
                resp = requests.get(f"{POLLER_URL}/getNextTask", timeout=15).json()
            except Exception as e:
                print(f" 网络连接错误: {e}")
                smart_sleep(5)
                continue

            task_type = resp.get("type")
            task_data = resp.get("data")

            # 空闲时处理抢单
            if task_type == "none" or not task_data:
                # 检查是否到了抢单时间
                if time.time() - last_grab_time > current_grab_interval:
                    grab_settings = load_grab_settings()
                    cloud_enabled = grab_settings.get("enabled", False)
                    current_grab_interval = grab_settings.get("grab_interval", 30)

                    if PAUSE_GRAB_ORDERS or not cloud_enabled:
                        print(f"\r[Idle] 抢单已暂停 (按 P 恢复)...", end="")
                    else:
                        print(f"\n[Idle] 空闲时段，切换到[供应商客服工作台]申请接单...")
                        try:
                            # 调用抢单逻辑
                            crawler_bot.run_grab_orders(stop_callback=check_pause_status, config=grab_settings)
                        except Exception as e:
                            print(f"抢单模块异常: {e}")

                    # 更新时间，并切回推荐任务平台以便下次可以快速响应
                    last_grab_time = time.time()

                print(f" 暂无任务，休眠 {int(current_interval)} 秒...")
                smart_sleep(current_interval)
                # 逐步增加休眠时间，直到达到最大值 (指数退避算法)
                current_interval = min(current_interval * 1.5, max_interval)
                continue

            # 如果有任务，重置为最快频率，因为接下来可能还有任务
            current_interval = min_interval

            print(f"\n 收到任务: {task_type.upper()}")

            # === A. 执行系统指令 ===
            if task_type == "command":
                cmd_type = task_data.get("type")
                target_account = task_data.get("account")

                print(f"     收到系统指令: {cmd_type} | 账号: {target_account}")

            # === B. 执行抓取任务 ===
            elif task_type == "crawl":
                order_id = task_data.get("order_id")
                print(f"     目标订单: {order_id}")

                try:
                    # 调用爬虫
                    crawl_data = crawler_bot.run_crawler(target_order_id=order_id)

                    if crawl_data:
                        status = "success"
                        print(f"     抓取成功，共 {len(crawl_data)} 条数据")
                    else:
                        status = "failed"  # 或者是 success 但为空，看业务定义
                        print("     抓取结果为空")

                    # 上报结果
                    requests.post(f"{RPA_URL}/uploadCrawlResult", json={
                        "order_id": order_id,
                        "status": status,
                        "data": crawl_data
                    })

                except Exception as e:
                    print(f"     抓取出错: {e}")
                    requests.post(f"{RPA_URL}/uploadCrawlResult", json={
                        "order_id": order_id,
                        "status": "failed",
                        "error": str(e)
                    })

            # === C. 执行发送任务 ===
            elif task_type == "send":
                task_id = task_data.get("_id")
                target_agent_id = task_data.get("agent_id")
                target_account = task_data.get("account_name")
                group_name = task_data.get("group_name")
                payload = task_data.get("payload", [])
                scheduled_time = task_data.get("send_time")

                # 检查 agent_id 是否为空
                if not target_agent_id:
                    print(f"      任务 {task_id} 被拦截: agent_id 为空，不执行发送")

                    # 立即上报失败状态，避免任务卡在 pending
                    requests.post(f"{RPA_URL}/updateSendStatus", json={
                        "task_id": task_id,
                        "status": "failed",
                        "error": "agent_id is missing or empty"
                    })

                    # 跳过本次循环，直接处理下一个任务或休眠
                    continue

                print(f"     发送目标: {group_name} | 执行人: {target_account}")

                # try:
                #     payload = process_dynamic_weather(payload, task_data)
                # except Exception as e:
                #     print(f"     天气预处理异常(不影响发送): {e}")

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
                    result = sender_bot.bot.send_mixed_msg(
                        group_name,
                        processed_payload,
                        agent_id=target_agent_id,
                        account_name=target_account,
                        scheduled_time=scheduled_time
                    )

                    # 解析结果
                    success = result.get("success", False)
                    error_msg = result.get("error", "未知错误")
                    ocr_log_content = result.get("ocr_log", "")

                    final_status = "sent" if success else "failed"

                    # 1. 更新任务状态
                    requests.post(f"{RPA_URL}/updateSendStatus", json={
                        "task_id": task_id,
                        "status": final_status,
                        "error": error_msg if not success else "",
                        "ocr_raw": ocr_log_content
                    })
                    print(f"    {' 发送完毕' if success else ' 发送失败'}")

                    # 2. 失败报警逻辑
                    if not success:
                        print(f"     触发报警，原因: {error_msg}")
                        # 调用云对象通知管家
                        try:
                            requests.post(f"{NOTIFIER_URL}/notifyTaskFailed", json={
                                "agentId": target_agent_id,
                                "groupName": group_name,
                                "sendTime": scheduled_time,
                                "errorMsg": error_msg
                            })
                        except Exception as e:
                            print(f"    报警接口调用失败: {e}")
                else:
                    print("     资源下载失败，取消发送")
                    requests.post(f"{RPA_URL}/updateSendStatus", json={
                        "task_id": task_id,
                        "status": "failed",
                        "error": "Download failed"
                    })

                # clean_temp_files()

            # 任务间隔
            smart_sleep(1)

        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f" 主循环异常: {e}")
            smart_sleep(5)


if __name__ == "__main__":
    main_loop()