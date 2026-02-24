import cv2
import numpy as np
import random
import base64
import io
import time
from PIL import Image
import requests


def get_gap_offset(bg_src, slice_base64):
    """
    识别缺口位置
    """

    def decode_to_cv2(data_str):
        try:
            # 兼容 URL 格式
            if data_str.startswith("http"):
                resp = requests.get(data_str)
                img_data = resp.content
            # 兼容 Base64 格式
            else:
                if "," in data_str:
                    data_str = data_str.split(",")[1]
                img_data = base64.b64decode(data_str)

            # 统一转为 OpenCV 格式
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as err:
            print(f"   [Captcha] 图片解码失败: {err}")
            return None

    try:
        bg_img = decode_to_cv2(bg_src)
        slice_img = decode_to_cv2(slice_base64)
        natural_width = bg_img.shape[1]

        # 1. 灰度化 + 高斯模糊 (减少噪点干扰)
        bg_gray = cv2.cvtColor(bg_img, cv2.COLOR_BGR2GRAY)
        slice_gray = cv2.cvtColor(slice_img, cv2.COLOR_BGR2GRAY)

        # 2. 边缘检测
        bg_canny = cv2.Canny(bg_gray, 255, 255)  # 阈值拉高，只保留强边缘
        slice_canny = cv2.Canny(slice_gray, 255, 255)

        # 3. 模板匹配
        result = cv2.matchTemplate(bg_canny, slice_canny, cv2.TM_CCOEFF_NORMED)
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)

        # max_loc[0] 是匹配到的左上角 X 坐标
        target_x = max_loc[0]

        # [调试] 打印识别到的坐标，方便排查是识别不准还是缩放不准
        # print(f"   [Debug] OpenCV 识别 X: {target_x} / {natural_width}")

        return target_x, natural_width

    except Exception as e:
        print(f"   [Captcha] OpenCV 识别出错: {e}")
        return 0, 0


def generate_human_track(distance):
    """
    生成仿真人轨迹：加速 -> 减速 -> 过冲 -> 回退修正
    """
    track = []
    current = 0
    # 留出一段距离用于模拟“过冲”行为
    target = distance + random.randint(3, 8)

    # === 第一阶段：快速移动到目标附近 (加速+减速) ===
    mid = target * 3 / 5
    t = 0.2
    v = 0

    while current < target:
        if current < mid:
            a = 5 + random.uniform(-1, 1)  # 加速度
        else:
            a = -7 + random.uniform(-1, 1)  # 减速度

        v0 = v
        v = v0 + a * t
        move = v0 * t + 0.5 * a * t * t

        # 限制最小移动距离，防止卡死
        if move < 0.8: move = 0.8 + random.random()

        current += move
        # 记录相对位移
        track.append([round(move), random.randint(-1, 1)])

        # 如果已经到了过冲点，就停
        if current >= target:
            break

    # === 第二阶段：回退修正 (模拟人眼对齐) ===
    # 此时 current 大约是 distance + 5 左右，需要退回到 distance
    back_distance = current - distance

    # 分几次退回来，每次退一点点
    for _ in range(int(back_distance)):
        track.append([-1, random.randint(-1, 0)])  # X退1，Y微动
        time.sleep(0.01)  # 生成轨迹时不做sleep，这里只是为了逻辑分段

    # === 第三阶段：微调抖动 (左右横跳一下，确保对准) ===
    for _ in range(2):
        track.append([1, 0])
        track.append([-1, 0])

    return track


def solve_captcha(page, max_retries=5, stop_callback=None):
    """
    滑块验证主逻辑 (已添加重试机制)
    """
    print(f"   [Captcha] 开始验证 (最大尝试 {max_retries} 次)...")

    for i in range(max_retries):
        if stop_callback and stop_callback():
            print("   [Captcha] 检测到暂停，停止验证")
            return False

        try:
            print(f"   --- 第 {i + 1} 次尝试 ---")

            # 0. 检查验证码容器是否还存在 (如果不存在说明已经成功了)
            if not page.ele('css:#verification-code-container', timeout=2):
                print("   [Captcha] 验证码容器已消失，无需验证")
                return True

            # 1. 定位元素 (每次循环必须重新定位，因为刷新后DOM可能变化)
            bg_ele = page.ele('css:img.advise', timeout=3)
            slice_ele = page.ele('css:img.image-left', timeout=3)

            slider_btn = page.ele('css:.cpt-drop-btn', timeout=2)
            if not slider_btn:
                slider_btn = page.ele('css:.cpt-drop-box', timeout=2)

            if not bg_ele or not slice_ele or not slider_btn:
                print("   [Captcha] 元素定位失败，等待加载...")
                time.sleep(1)
                continue  # 跳过本次，重试

            # 2. 识别 (获取最新的图片src)
            bg_src = bg_ele.attr('src')
            slice_src = slice_ele.attr('src')

            # 简单检查src是否有效
            if not bg_src or not slice_src:
                print("   [Captcha] 图片还未加载...")
                time.sleep(1)
                continue

            raw_distance, natural_width = get_gap_offset(bg_src, slice_src)

            if natural_width == 0:
                print("   [Captcha] 识别结果异常，刷新重试...")
                refresh_btn = page.ele('css:.refresh', timeout=2)
                if refresh_btn:
                    refresh_btn.click()
                    print("     图片重新加载...")
                    time.sleep(2)  # 等待图片重新加载
                else:
                    print("     未找到刷新按钮!")
                    time.sleep(1)
                continue

            # 3. 计算实际距离
            # 注意：如果多次失败，可能需要检查 bg_ele.rect.size[0] 是否获取到了真实的渲染宽度
            render_width = bg_ele.rect.size[0]
            if render_width == 0:
                # 防止由于页面没渲染完导致的除零错误
                time.sleep(1)
                continue

            scale = render_width / natural_width
            offset_correction = -2
            real_distance = (raw_distance * scale) + offset_correction

            print(f"     识别:{raw_distance} | 缩放:{scale:.2f} | 修正:{offset_correction} | 目标:{real_distance:.1f}")

            # 4. 执行拖拽
            tracks = generate_human_track(real_distance)

            page.actions.move_to(slider_btn)
            time.sleep(random.uniform(0.2, 0.5))

            page.actions.hold(slider_btn)
            time.sleep(random.uniform(0.1, 0.3))

            for track in tracks:
                page.actions.move(track[0], track[1], duration=random.uniform(0.01, 0.02))

            time.sleep(random.uniform(0.4, 0.7))
            page.actions.release()

            # 5. 检查结果
            print("     验证中...")
            time.sleep(3)  # 稍微多等一会儿，给它刷新或者消失的时间

            if not page.ele('css:#verification-code-container', timeout=1):
                print("   [Captcha] 验证通过")
                return True
            else:
                print("   [Captcha] 验证失败，等待自动刷新...")
                # 失败后，网页会自动刷新图片，我们这里sleep一下等新图片加载完
                # 这样下一次循环里的 page.ele 和 .attr('src') 就能拿到新的了
                time.sleep(1)

        except Exception as e:
            print(f"   [Captcha] 异常: {e}")
            time.sleep(1)

    print("   [Captcha] 多次尝试均失败")
    return False