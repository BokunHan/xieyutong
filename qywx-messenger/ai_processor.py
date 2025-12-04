import json
import time
from datetime import datetime, timedelta


# ================= 模拟加载数据 (实际使用时从数据库读取) =================
def load_data():
    # 这里模拟从文件读取你上传的 json/txt 内容
    with open('task_1128142495066986.txt', 'r', encoding='utf-8') as f:
        task_order = json.load(f)

    with open('snapshot_1128142495066986.txt', 'r', encoding='utf-8') as f:
        snapshot = json.load(f)

    return task_order, snapshot


# ================= 辅助函数 =================

def calculate_trip_day(current_date_str, departure_date_ts):
    """计算给定日期是行程的第几天"""
    try:
        # task 中的时间格式 "2025-11-22 18:00:00\n规则" -> 清洗
        clean_date_str = current_date_str.split('\n')[0].strip()
        current_dt = datetime.strptime(clean_date_str, "%Y-%m-%d %H:%M:%S")

        # snapshot 中的时间戳是毫秒
        dep_dt = datetime.fromtimestamp(departure_date_ts / 1000)

        # 简单计算天数差 (比如 22号提醒23号的行程，对应 Day 1)
        # 逻辑：提醒时间 + 1天 = 行程当天
        target_trip_date = current_dt + timedelta(days=1)
        delta = target_trip_date.date() - dep_dt.date()
        return delta.days + 1, target_trip_date.strftime("%Y-%m-%d")
    except Exception as e:
        return -1, ""


def get_snapshot_day_info(snapshot, day_num):
    """从快照中获取指定天数的行程详情"""
    for day in snapshot.get('itinerary', []):
        if day['day'] == day_num:
            return day
    return None


def find_images_in_day(day_info):
    """从当天的行程中提取所有景点图片"""
    images = []
    if not day_info: return images

    for activity in day_info.get('activities', []):
        # 提取景点(scenic)类型的图片
        if activity.get('elementType') == 'scenic':
            spots = activity.get('elementData', {}).get('scenic_spots', [])
            for spot in spots:
                if spot.get('images'):
                    # 优先取第一张
                    images.append({
                        "name": spot['name'],
                        "url": spot['images'][0]
                    })
    return images


# ================= 核心 AI 生成逻辑 =================

def generate_queue_messages(task_order, snapshot):
    order_id = task_order['order_id']
    target_group_id = task_order['target_group_id']
    # 假设已知群名，实际需查库
    group_name = "西藏私家团-VIP服务群"

    raw_tasks = task_order.get('raw_data', [])
    departure_ts = snapshot.get('departure_date')

    # 提取航班信息供全局使用
    order_context = {}
    if len(raw_tasks) > 0 and 'order_context' in raw_tasks[0]:
        order_context = raw_tasks[0]['order_context']

    queue_list = []

    for task in raw_tasks:
        # 跳过 context 节点
        if 'order_context' in task:
            continue

        task_name = task.get('name', '')
        start_time_raw = task.get('start', '')
        template = task.get('template', {})
        original_text = template.get('text', '')
        original_image = template.get('image', '')

        # 初始化消息体
        payload = []
        status = 'pending'  # 默认状态

        # -----------------------------------------------------------------
        # 场景 1: 值机提醒 (需要填充航班信息)
        # -----------------------------------------------------------------
        if "值机提醒" in task_name:
            flights = order_context.get('flights', [])
            if flights:
                # 找到去程航班 (假设第一条是去程)
                f = flights[0]
                # AI 文本替换逻辑
                text = original_text.replace("#航班号#", f['flight_no']) \
                    .replace("#起飞时间#", f['dep_time']) \
                    .replace("#出发城市#", "出发地") \
                    .replace("#抵达城市#", "拉萨")
                # 清理多余的占位符
                text = text.split("我们整理了一些选座建议")[0] + "\n温馨提示：高原航线建议提前选座。"

                payload.append({"type": "text", "data": text})
            else:
                # 如果没航班信息，标记为人工暂停，防止发错
                status = 'manual_stop'
                payload.append({"type": "text", "data": original_text})

        # -----------------------------------------------------------------
        # 场景 2: 明日提醒 (核心逻辑：从 Snapshot 修正内容)
        # -----------------------------------------------------------------
        elif "明日提醒" in task_name:
            # 计算这是对应行程的第几天
            day_num, date_str = calculate_trip_day(start_time_raw, departure_ts)
            day_info = get_snapshot_day_info(snapshot, day_num)

            if day_info:
                # 构造新的提醒文案
                title = day_info.get('day_title', '')
                # 提取天气 (Snapshot里没有实时天气，可以用通用提示)
                weather_tip = "高原天气多变，请注意防寒保暖。"

                new_text = f"【明日行程提醒】📅 {date_str} (第{day_num}天)\n\n" \
                           f"🚗 行程安排：{title}\n\n" \
                           f"🌥 天气贴士：{weather_tip}\n" \
                           f"⚠️ 注意事项：请保持手机畅通，司机师傅会提前联系您确认出发时间。"

                payload.append({"type": "text", "data": new_text})

                # 如果原模板有图且不是错误的图，可以用；否则用当天的景点图
                if original_image and "金山岭" not in original_text:  # 简单过滤
                    payload.append({"type": "image", "data": original_image})
            else:
                # 找不到对应行程，可能是返程后的提醒，跳过或暂停
                continue

        # -----------------------------------------------------------------
        # 场景 3: 景区/线路图 (修正爬虫抓到的错误“金山岭长城”)
        # -----------------------------------------------------------------
        elif "景区游览" in task_name or "线路图" in task_name:
            # 同样计算是哪一天的景点
            day_num, _ = calculate_trip_day(start_time_raw, departure_ts)
            day_info = get_snapshot_day_info(snapshot, day_num)

            # 检测是否包含错误的关键词
            is_wrong_data = "金山岭" in original_text

            if is_wrong_data and day_info:
                # AI 修正：从 Snapshot 拿真实的景点图
                real_images = find_images_in_day(day_info)

                if real_images:
                    spot_names = [img['name'] for img in real_images]
                    text = f"【景区预览】明天我们将游览：{'、'.join(spot_names)}。\n" \
                           f"为您准备了景区美图预览 👇"
                    payload.append({"type": "text", "data": text})

                    # 添加图片 (最多发3张，避免刷屏)
                    for img in real_images[:3]:
                        payload.append({"type": "image", "data": img['url']})
                else:
                    # 当天没景点图，跳过此任务
                    continue
            else:
                # 如果看起来没问题，保留原样
                payload.append({"type": "text", "data": original_text})
                if original_image:
                    payload.append({"type": "image", "data": original_image})

        # -----------------------------------------------------------------
        # 场景 4: 其他通用任务 (如准备清单、伴手礼)
        # -----------------------------------------------------------------
        else:
            # 直接使用模板，做简单的名字替换
            text = original_text
            users = order_context.get('travelers', [])
            user_names = "/".join([u['name'].split(' ')[0] for u in users]) if users else "贵宾"
            text = text.replace("xx先生/女士", user_names + " 您好")

            payload.append({"type": "text", "data": text})
            if original_image:
                payload.append({"type": "image", "data": original_image})

        # -----------------------------------------------------------------
        # 生成 Queue 数据项
        # -----------------------------------------------------------------
        if payload:
            # 清洗时间格式
            send_time = start_time_raw.split('\n')[0].strip()

            queue_item = {
                "task_id": task_order['_id'],  # 关联回 a-task-orders
                "group_name": group_name,  # 实际发送的群名
                "payload": payload,
                "status": status,
                "send_time": send_time,
                "created_at": int(time.time() * 1000),
                "priority": 0
            }
            queue_list.append(queue_item)

    return queue_list


# ================= 运行测试 =================
if __name__ == "__main__":
    # 1. 加载数据
    task_data, snapshot_data = load_data()
    # 模拟 task_data 中缺少 _id (因为是从文件读的)，手动补一个
    task_data['_id'] = "66f7a..."

    # 2. 执行生成
    queue_result = generate_queue_messages(task_data, snapshot_data)

    # 3. 打印结果 (JSON)
    print(json.dumps(queue_result, indent=2, ensure_ascii=False))