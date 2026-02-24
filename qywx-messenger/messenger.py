import pyautogui
import pyperclip
import time
import json
import os
import win32clipboard
import win32con
import ctypes
import pygetwindow as gw
from datetime import datetime
import numpy as np
import cv2

# ================= 配置区域 =================
JSON_FILE = "tasks.json"

# 窗口标题：个人微信通常就是 "微信"
# WINDOW_TITLE = "微信"
WINDOW_TITLE = "多开神器"

# 图片素材（确保这两个文件在同目录下）
IMG_ENTER_CHAT = "enter_chat.png"  # 搜索结果右边的“进入聊天”按钮
IMG_SEARCH_BOX = "search_box.png"  # 顶部的搜索框图标
IMG_MENU = "menu.png"  # 右上角的三个点菜单
IMG_MEMO = "memo.png"  # 侧边栏里的“备注”标题

CHECK_INTERVAL = 3  # 检查频率(秒)
PASTE_WAIT = 1.0  # 粘贴文件后的等待时间(秒)

WAIT_TEXT = 0.5  # 发完文字后等待(秒)
WAIT_IMAGE = 2.0  # 发完图片后等待(秒)
WAIT_VIDEO = 5.0  # 发完视频后等待(秒)
VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.wmv']

# ===========================================

class WeComBot:
    # def __init__(self):
    #     # 存储 账号名 -> 窗口对象 的映射
    #     self.account_windows = {}
    #     self.current_active_account = None
    #
    # def _find_target_windows(self):
    #     """查找所有微信窗口"""
    #     all_windows = gw.getAllWindows()
    #     target_wins = []
    #     for w in all_windows:
    #         # 只要标题完全等于“微信”或者包含“微信”且可见
    #         if (WINDOW_TITLE in w.title) and w.visible:
    #             target_wins.append(w)
    #     return target_wins

    def __init__(self):
        # self.window = None
        # self.account_map = {}
        self.main_window = None
        self.account_offsets = {}
        self.current_active_account = None
        self.current_chat_id = None

    def _find_main_window(self):
        """查找多开神器的主窗口"""
        all_windows = gw.getAllWindows()
        for w in all_windows:
            if WINDOW_TITLE in w.title and w.visible:
                return w
        return None

    def _force_focus(self, window):
        """强制激活窗口"""
        try:
            hwnd = window._hWnd
            if window.isMinimized:
                ctypes.windll.user32.ShowWindow(hwnd, 9)  # SW_RESTORE
                time.sleep(0.5)

            ctypes.windll.user32.keybd_event(0, 0, 0, 0)
            ctypes.windll.user32.SetForegroundWindow(hwnd)
            time.sleep(0.2)
            return True
        except Exception as e:
            print(f"    激活窗口失败: {e}")
            return False

    def _minimize_win(self, window):
        """强制最小化窗口"""
        try:
            if window:
                ctypes.windll.user32.ShowWindow(window._hWnd, 6)  # SW_MINIMIZE
        except:
            pass

    # def bind_accounts(self):
    #     """
    #     启动时“点名”：轮询所有【微信】窗口，人工绑定账号
    #     """
    #     windows = self._find_target_windows()
    #     if not windows:
    #         print(f"❌ 未找到任何【{WINDOW_TITLE}】窗口，请先打开微信！")
    #         return []
    #
    #     print(f"\n🔍 检测到 {len(windows)} 个微信窗口，开始进行人工认领...")
    #     print("------------------------------------------------")
    #
    #     self.account_windows = {}
    #
    #     for i, window in enumerate(windows):
    #         print(f" 正在尝试激活窗口 #{i + 1} ...")
    #         if not self._force_focus(window):
    #             print(f"    无法激活窗口 #{i + 1}，可能需要管理员权限。")
    #             continue
    #
    #         print(f" 窗口 #{i + 1} 已弹出")
    #         account_name = input(f"   请输入此窗口的账号名 (如'大号'，回车跳过): ").strip()
    #
    #         if account_name:
    #             self.account_windows[account_name] = window
    #             print(f"    绑定成功：【{account_name}】")
    #         else:
    #             print("    跳过此窗口")
    #
    #         self._minimize_win(window)
    #         print("------------------------------------------------")
    #
    #     bound_list = list(self.account_windows.keys())
    #     print(f" 绑定结束，当前可用账号: {bound_list}")
    #     return bound_list

    # def bind_accounts(self):
    #     """
    #     不再轮询窗口，而是让用户把鼠标放到左侧头像上，记录坐标偏移量。（用于个人微信多开神器）
    #     """
    #     self.main_window = self._find_main_window()
    #     if not self.main_window:
    #         print(f"❌ 未找到【{WINDOW_TITLE}】窗口，请先打开软件！")
    #         return []
    #
    #     print(f"\n🔍 已锁定主窗口: {self.main_window.title}")
    #     print("💡 接下来进行坐标绑定：请按提示将鼠标悬停在左侧账号头像上。")
    #     print("------------------------------------------------")
    #
    #     # 激活窗口，让它显示出来
    #     self._force_focus(self.main_window)
    #     self.account_offsets = {}
    #
    #     while True:
    #         account_name = input("\n👉 请输入要绑定的账号名称 (如'大号'，直接回车结束认领): ").strip()
    #         if not account_name:
    #             break
    #
    #         print(f"   ⏳ 请将鼠标【移动到】 {account_name} 的头像中间，不要点击...")
    #         print("   ✅ 移好后，请按 【回车键】 确认坐标")
    #         input()  # 等待用户按回车
    #
    #         # 获取当前鼠标位置
    #         mouse_x, mouse_y = pyautogui.position()
    #
    #         # 获取窗口当前位置
    #         win_left = self.main_window.left
    #         win_top = self.main_window.top
    #
    #         # 计算相对偏移量 (这样即使窗口以后移动了位置，也能点得准)
    #         offset_x = mouse_x - win_left
    #         offset_y = mouse_y - win_top
    #
    #         self.account_offsets[account_name] = (offset_x, offset_y)
    #         print(f"   📍 已记录 {account_name} 坐标偏移: ({offset_x}, {offset_y})")
    #
    #     print("------------------------------------------------")
    #     print("📉 绑定完成，窗口最小化...")
    #     self._minimize_win(self.main_window)
    #
    #     bound_list = list(self.account_offsets.keys())
    #     print(f"🎉 当前可用账号: {bound_list}")
    #     return bound_list

    def bind_accounts(self, account_options=None):
        """
        让用户把鼠标放到左侧头像上，并从云端下发的管家列表中选择当前是谁。
        :param account_options: list [{"name": "张三", "id": "xxx"}, ...]
        """
        self.main_window = self._find_main_window()
        if not self.main_window:
            print(f" 未找到【{WINDOW_TITLE}】窗口，请先打开软件！")
            return []

        print(f"\n 已锁定主窗口: {self.main_window.title}")

        # 打印可选菜单
        print("\n 云端管家列表 (用于绑定当前鼠标指向的账号):")
        valid_options = []
        if account_options:
            for idx, acc in enumerate(account_options):
                print(f"   [{idx + 1}] {acc['name']}")
                valid_options.append(acc['name'])
        else:
            print("   (空列表，请检查云端配置)")

        print("------------------------------------------------")
        print(" 绑定步骤：")
        print("   1. 鼠标悬停在某个微信头像上")
        print("   2. 按回车确认坐标")
        print("   3. 输入上方对应的【数字序号】进行绑定")
        print("------------------------------------------------")

        self._force_focus(self.main_window)
        self.account_offsets = {}  # 重置映射: { "张三": (x, y) }
        name_map = { item['name']: item['id'] for item in account_options } if account_options else {}

        while True:
            choice = input("\n 请按回车键锁定坐标 (输入 'q' 结束绑定): ").strip()
            if choice.lower() == 'q':
                break

            # 1. 获取坐标
            mouse_x, mouse_y = pyautogui.position()
            win_left = self.main_window.left
            win_top = self.main_window.top
            offset_x = mouse_x - win_left
            offset_y = mouse_y - win_top

            print(f"    坐标已捕获: ({offset_x}, {offset_y})")

            # 2. 选择身份
            while True:
                idx_str = input("   👤 请输入该账号对应的【管家序号】: ").strip()
                if not idx_str.isdigit():
                    print("    请输入数字！")
                    continue

                idx = int(idx_str) - 1
                if 0 <= idx < len(valid_options):
                    selected_name = valid_options[idx]
                    selected_id = name_map.get(selected_name)
                    if not selected_id:
                        print("    数据错误，未找到该账号ID")
                        continue

                    # 检查是否重复绑定
                    if selected_id in self.account_offsets:
                        confirm = input(f"   ️ {selected_name} 已经被绑定过了，是否覆盖? (y/n): ")
                        if confirm.lower() != 'y':
                            break

                    self.account_offsets[selected_id] = (offset_x, offset_y)
                    print(f"    绑定成功: 窗口位置 -> [{selected_name}] (ID: {selected_id})")
                    break
                else:
                    print("    序号无效，请重新输入")

        print("------------------------------------------------")
        self._minimize_win(self.main_window)

        bound_list = list(self.account_offsets.keys())
        print(f" 本次会话可用账号: {bound_list}")
        return bound_list

    def auto_bind_accounts(self, account_list):
        """
        图像指纹匹配 (Template Matching)
        逻辑：自动遍历 account_fingerprints 文件夹，根据文件名匹配云端账号
        """
        self.main_window = self._find_main_window()
        if not self.main_window:
            print(f" 未找到【{WINDOW_TITLE}】窗口，无法自动绑定")
            return []

        fingerprint_dir = os.path.join(os.getcwd(), "account_fingerprints")
        if not os.path.exists(fingerprint_dir):
            print(f" 缺少指纹文件夹: {fingerprint_dir}")
            return []

        print(f" 正在初始化账号指纹库...")
        self._force_focus(self.main_window)
        time.sleep(1.0)

        # 截图
        region = (self.main_window.left, self.main_window.top, self.main_window.width, self.main_window.height)
        try:
            screenshot = pyautogui.screenshot(region=region)
        except:
            screenshot = pyautogui.screenshot()

        screen_mat = cv2.cvtColor(np.array(screenshot), cv2.COLOR_RGB2BGR)

        # ️ 每次绑定前清空旧数据
        self.account_offsets = {}
        target_map = {item['name']: item['id'] for item in account_list}
        found_count = 0

        print(f"    正在扫描文件夹: {fingerprint_dir}")

        for cloud_name, agent_id in target_map.items():
            img_path = os.path.join(fingerprint_dir, f"{cloud_name}.png")
            if not os.path.exists(img_path):
                img_path = os.path.join(fingerprint_dir, f"{cloud_name}.jpg")

            if not os.path.exists(img_path):
                print(f"      ️ 跳过 [{cloud_name}]: 无图片")
                continue

            try:
                # 读取模板
                template = cv2.imdecode(np.fromfile(img_path, dtype=np.uint8), cv2.IMREAD_COLOR)
            except:
                continue

            if template is None: continue

            # 匹配
            result = cv2.matchTemplate(screen_mat, template, cv2.TM_CCOEFF_NORMED)
            min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)

            # 阈值 (0.85 比较适中)
            if max_val >= 0.85:
                t_h, t_w = template.shape[:2]

                # 计算中心点（用于点击）
                center_x = max_loc[0] + t_w / 2
                center_y = max_loc[1] + t_h / 2

                # 保存 (x, y, 宽度, 高度, 图片路径)
                # 我们需要宽高和路径来进行后续的“局部重校验”
                self.account_offsets[agent_id] = {
                    "coords": (center_x, center_y),
                    "rect": (max_loc[0], max_loc[1], t_w, t_h),  # 左上角x, 左上角y, 宽, 高
                    "img_path": img_path
                }

                print(f"    匹配成功: [{cloud_name}] -> 已存入指纹库")
                found_count += 1
            else:
                print(f"      ️ 未在屏幕找到: [{cloud_name}] (当前为选中状态或被遮挡?)")

        print(f"------------------------------------------------")
        print(f" 绑定完成，共关联 {found_count} 个账号")

        return list(self.account_offsets.keys())

    def _check_diff_at_rect(self, rect, img_path):
        """
        计算区域色差 (Difference)
        返回: 平均像素差异值 (0.0 ~ 255.0)
        值越大，说明变化越大（说明微信昵称变色了）
        """
        # 1. 计算绝对坐标
        abs_x = int(self.main_window.left + rect[0])
        abs_y = int(self.main_window.top + rect[1])
        w, h = int(rect[2]), int(rect[3])

        try:
            # 截取当前屏幕的同一位置
            partial_shot = pyautogui.screenshot(region=(abs_x, abs_y, w, h))
            # 必须统一转为 RGB 格式进行比较 (OpenCV读取的是BGR，pyautogui是RGB)
            # 这里统一把 file 转为 RGB
            screen_img = np.array(partial_shot)  # RGB

            # 读取原始指纹 (注意：cv2.imdecode 读出来是 BGR)
            template_bgr = cv2.imdecode(np.fromfile(img_path, dtype=np.uint8), cv2.IMREAD_COLOR)
            template_rgb = cv2.cvtColor(template_bgr, cv2.COLOR_BGR2RGB)

            # ️ 尺寸防御：如果截图和模板尺寸有微小差异（缩放导致），强行缩放模板
            if screen_img.shape != template_rgb.shape:
                template_rgb = cv2.resize(template_rgb, (screen_img.shape[1], screen_img.shape[0]))

            # 2. 计算绝对差值 (找茬核心)
            # 黑色(0,0,0) vs 绿色(0,128,0) -> 差值会很大
            diff = cv2.absdiff(screen_img, template_rgb)

            # 计算平均差值 (Mean Difference)
            mean_diff = np.mean(diff)

            return mean_diff
        except Exception as e:
            print(f"    校验出错: {e}")
            return 0

    # def activate_window(self, account_name):
    #     """根据账号名激活对应的窗口"""
    #     target_win = None
    #     if account_name and account_name in self.account_windows:
    #         target_win = self.account_windows[account_name]
    #
    #     # 兜底：如果没指定账号且只有一个窗口，就用那个
    #     if not target_win and len(self.account_windows) == 1:
    #         target_win = list(self.account_windows.values())[0]
    #
    #     if target_win:
    #         return self._force_focus(target_win)
    #
    #     print(f" 无法找到账号 [{account_name}] 对应的窗口")
    #     return False

    def activate_window(self, agent_id):
        """
        基于【色差检测】的激活逻辑
        """
        if not self.main_window:
            self.main_window = self._find_main_window()
            if not self.main_window: return False

        self._force_focus(self.main_window)

        if not agent_id:
            print(" 错误: 必须指定 agent_id 才能激活窗口")
            return False  # 强制返回 False，终止发送

        if agent_id not in self.account_offsets:
            print(f" 无法切换: 找不到账号ID [{agent_id}]")
            return False

        data = self.account_offsets[agent_id]
        raw_x, raw_y = data["coords"]
        rect = data["rect"]
        img_path = data["img_path"]

        # 计算真实点击坐标 (含缩放修正)
        # 如果你之前运行V7发现鼠标位置是准的，这里公式不变
        # 如果之前偏了，可能 scale_x 没生效，这里默认用 V7 的逻辑
        real_click_x = self.main_window.left + (raw_x / getattr(self, 'scale_x', 1.0))
        real_click_y = self.main_window.top + (raw_y / getattr(self, 'scale_y', 1.0))

        # =========================================
        # 步骤 1: 点击前检查 (PRE-CHECK)
        # =========================================
        # 阈值设定：一般微小噪点在 5 以内。变色通常 > 10。
        # 如果 diff > 10，说明 "现在的样子" 和 "黑色的样子" 差很多 -> 说明已经是绿色了
        diff_score = self._check_diff_at_rect(rect, img_path)

        if diff_score > 8.0:
            print(f"   ️ 账号 [{agent_id}] 已经是选中状态 (色差 {diff_score:.2f})，跳过点击")
            time.sleep(0.5)
            return True

        # =========================================
        # 步骤 2: 执行点击
        # =========================================
        pyautogui.moveTo(real_click_x, real_click_y, duration=0.4) # 慢速移动
        pyautogui.mouseDown()
        time.sleep(0.15)
        pyautogui.mouseUp()

        # 等待多一点时间让UI变色
        time.sleep(0.8)

        # =========================================
        # 步骤 3: 点击后校验 (POST-CHECK)
        # =========================================
        # 检查是否变色 (色差是否变大)
        # 尝试多次检查 (防止电脑慢，变色有延迟)

        for i in range(3): # 尝试检查 3 次
            diff_score = self._check_diff_at_rect(rect, img_path)

            if diff_score > 8.0:
                print(f"    切换成功 (色差升至 {diff_score:.2f})")
                return True

            time.sleep(0.5) # 没变色？再等0.5秒看看

        # 如果循环结束还是没变色
        print(f"   ️ 第一次点击未生效 (色差仅 {diff_score:.2f})，尝试原地重试...")

        # 重试点击
        pyautogui.mouseDown()
        time.sleep(0.2)
        pyautogui.mouseUp()
        time.sleep(1.0)

        final_diff = self._check_diff_at_rect(rect, img_path)
        if final_diff > 10.0:
            print(f"    重试成功 (色差 {final_diff:.2f})")
            return True
        else:
            print(f"    切换彻底失败 (色差 {final_diff:.2f})，可能是点击被遮挡")
            return False

    def click_image(self, image_name, retries=5):
        """
        [核心] 屏幕找图并点击
        """
        img_path = os.path.join(os.getcwd(), image_name)
        if not os.path.exists(img_path):
            print(f"    缺失图片素材: {img_path}")
            return False

        print(f"    正在寻找图片: {image_name} ...")
        for i in range(retries):
            try:
                # 尝试模糊匹配 (需要安装 opencv-python)
                pos = pyautogui.locateCenterOnScreen(img_path, confidence=0.8, grayscale=True)
                if pos:
                    print(f"    找到目标，点击: {pos}")
                    pyautogui.click(pos)
                    return True
            except Exception as e:
                # 如果没装opencv或报错，尝试精确匹配
                try:
                    pos = pyautogui.locateCenterOnScreen(img_path)
                    if pos:
                        pyautogui.click(pos)
                        return True
                except:
                    pass
            time.sleep(0.5)

        print(f"    未找到图片: {image_name}")
        return False

    def set_clipboard_files(self, file_paths):
        """文件写入剪贴板"""
        offset = 20
        total_len = offset
        files_bytes = []
        for path in file_paths:
            abs_path = os.path.abspath(path)
            b_path = abs_path.encode('utf-16-le') + b'\0\0'
            files_bytes.append(b_path)
            total_len += len(b_path)
        total_len += 2

        class DROPFILES(ctypes.Structure):
            _fields_ = [("pFiles", ctypes.c_uint), ("pt_x", ctypes.c_long),
                        ("pt_y", ctypes.c_long), ("fNC", ctypes.c_int),
                        ("fWide", ctypes.c_int)]

        h_global = ctypes.windll.kernel32.GlobalAlloc(0x0042, total_len)
        p_global = ctypes.windll.kernel32.GlobalLock(h_global)
        df = DROPFILES()
        df.pFiles = offset
        df.fWide = 1
        ctypes.memmove(p_global, ctypes.byref(df), ctypes.sizeof(df))
        current_offset = offset
        base_addr = ctypes.c_void_p(p_global).value
        for b_path in files_bytes:
            ctypes.memmove(base_addr + current_offset, b_path, len(b_path))
            current_offset += len(b_path)
        ctypes.windll.kernel32.GlobalUnlock(h_global)

        win32clipboard.OpenClipboard()
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardData(win32con.CF_HDROP, h_global)
        win32clipboard.CloseClipboard()

    def send_mixed_msg(self, order_id, payload, agent_id=None, account_name=None,scheduled_time=None):
        """
        执行发送流程
        逻辑变更：任何步骤失败（切换、进群、发送），都会触发【全局重试】，从切换账号重新开始。
        """
        target_account_id = agent_id if agent_id else ""
        display_name = account_name if account_name else target_account_id

        last_error = "未知错误"

        MAX_RETRIES = 3

        # === 全局大循环：最多尝试 MAX_RETRIES 次完整的流程 ===
        for global_retry in range(MAX_RETRIES):
            print(f"\n  [全局重试 {global_retry + 1}/3] 开始执行发送流程: {display_name} -> {order_id}")

            try:
                # ============================================
                # 步骤 1: 切换/激活窗口
                # ============================================
                # 尝试激活窗口，如果失败，直接进入下一次全局循环
                if not self.activate_window(target_account_id):
                    last_error = f"无法切换到账号窗口: {display_name}"
                    print(f"     {last_error}，准备重新开始...")
                    self._ensure_window_focus() # 尝试救一下焦点
                    time.sleep(1.0)
                    continue # ->以此触发从头开始

                print(f"    [{display_name}] 窗口激活成功，准备搜索...")

                # ============================================
                # 步骤 2: 搜索并进入聊天
                # ============================================
                chat_entered = False

                self._ensure_window_focus()

                # 点击搜索框
                if not self.click_image(IMG_SEARCH_BOX, retries=3):
                    last_error = f"无法找到搜索按钮: {display_name}"
                    print(f"     {last_error}，准备重新开始...")
                    self._ensure_window_focus()  # 尝试救一下焦点
                    time.sleep(1.0)
                    continue  # ->以此触发从头开始

                time.sleep(1.0)
                pyautogui.hotkey('ctrl', 'f')
                time.sleep(0.5)
                pyperclip.copy(order_id)
                time.sleep(0.5)
                pyautogui.hotkey('ctrl', 'v')
                time.sleep(1.5)
                # pyautogui.press('down')
                # time.sleep(0.5)
                pyautogui.press('enter')
                time.sleep(1.0)

                # 识别“进入聊天”按钮
                # if self.click_image(IMG_ENTER_CHAT, retries=3):
                #     chat_entered = True
                # else:
                #     print(f"    [搜索重试] 未找到'进入聊天'按钮...")
                #     pyautogui.press('esc') # 清除搜索状态
                #     time.sleep(1.0)
                #
                # if not chat_entered:
                #     last_error = "无法进入聊天窗口 (搜索无结果或按钮未识别)"
                #     print(f"     {last_error}，准备重新开始...")
                #     continue # -> 回到步骤1 (重新切账号)
                #
                # time.sleep(1.0)

                # ============================================
                # 步骤 3: 进群校验
                # ============================================
                print("    正在进行群名校验...")
                ocr_success = False
                final_ocr_text = ""
                for ocr_attempt in range(2):
                    is_ok, text = self._verify_group_entry(order_id)
                    final_ocr_text = text  # 记录文本

                    if is_ok:
                        ocr_success = True
                        break
                    else:
                        print(f"    [群名校验重试] 校验不匹配，尝试调整焦点...")
                        self._ensure_window_focus()
                        time.sleep(1.0)

                if not ocr_success:
                    last_error = f"群名校验失败: 备注订单号不匹配 {order_id}"
                    print(f"     {last_error}，准备重新开始...")
                    # pyautogui.press('esc') # 退出聊天窗口，回到列表
                    time.sleep(0.5)
                    continue # -> 回到步骤1 (重新切账号)

                print("     群名校验通过，开始发送...")

                # ============================================
                # 步骤 4: 发送消息 (含视觉校验)
                # ============================================

                # 强制点击输入框两次，退出菜单并获取焦点
                try:
                    if self.main_window:
                        input_x = self.main_window.left + (self.main_window.width // 2)
                        input_y = self.main_window.top + self.main_window.height - 100

                        pyautogui.click(input_x, input_y)
                        time.sleep(0.5)  # 等待焦点切换
                        pyautogui.click(input_x, input_y)
                        time.sleep(0.5)  # 等待焦点切换
                        print("     已强制激活输入框焦点")
                except Exception as e:
                    print(f"     激活输入框失败: {e}")
                    time.sleep(0.5)
                    continue  # -> 回到步骤1 (重新切账号)

                self.current_active_account = target_account_id

                # 标记：本轮发送是否全部成功
                all_msgs_sent = True

                for index, item in enumerate(payload):
                    msg_type = item.get("type")
                    content = item.get("data")
                    single_msg_success = False

                    # 单条消息的小重试 (3次)
                    for retry in range(3):
                        # A. 准备剪贴板
                        if msg_type == "text":
                            pyperclip.copy(content)
                            time.sleep(0.3)
                        elif msg_type in ["file", "image", "video"]:
                            if os.path.exists(content):
                                self.set_clipboard_files([content])
                                time.sleep(0.3)
                            else:
                                print(f"     文件不存在: {content}")
                                break # 文件都没有，重试也没用
                        time.sleep(0.3)

                        # B. 截图 (前)
                        img_before = self._get_footer_screenshot()

                        # C. 粘贴 & 发送
                        pyautogui.hotkey('ctrl', 'v')
                        time.sleep(PASTE_WAIT if msg_type != "text" else 0.5)
                        pyautogui.press('enter')

                        # 等待上屏
                        wait_t = WAIT_VIDEO if msg_type == "video" else 1.5
                        time.sleep(wait_t)

                        # D. 截图 (后) & 校验
                        img_after = self._get_footer_screenshot()

                        if self._check_send_success(img_before, img_after):
                            print(f"     第 {index + 1} 条发送成功")
                            single_msg_success = True
                            break
                        else:
                            print(f"     第 {index + 1} 条视觉检测失败 ({retry+1}/3)，清理输入框重试...")
                            self._ensure_window_focus()

                    if not single_msg_success:
                        last_error = f"第 {index+1} 条消息发送失败 (视觉校验未通过)"
                        print(f"     {last_error}，触发全局重试！")
                        all_msgs_sent = False
                        break # 跳出消息循环，准备执行 continue

                    # 消息间延迟
                    custom_delay = item.get("delay")
                    if custom_delay: time.sleep(float(custom_delay))

                # 检查本轮发送结果
                if all_msgs_sent:
                    print("     所有消息发送完毕！")
                    return {"success": True, "ocr_log": final_ocr_text}
                else:
                    time.sleep(1.0)
                    continue # -> 回到步骤1 (重新切账号，从头再来)

            except Exception as e:
                # 捕获所有未知的代码错误，确保不会直接崩溃，而是进入重试
                last_error = f"代码执行异常: {str(e)}"
                print(f"     [异常] {last_error}，准备重试...")
                time.sleep(1.0)
                continue

        # === 3次全局重试都失败了 ===
        print("     严重错误: 已达到最大全局重试次数，任务放弃。")
        ocr_log_str = locals().get('final_ocr_text', '未执行OCR')
        return {"success": False, "error": f"多次重试失败: {last_error}", "ocr_log": ocr_log_str}

    def _ensure_window_focus(self):
        if self.main_window:
            print("    [重试] 正在尝试将窗口调到最前面...")
            try:
                self._force_focus(self.main_window)
                time.sleep(0.5)
                return True
            except Exception as e:
                print(f"    [重试失败] {e}")
        return False

    # === 进群校验 ===
    def _verify_group_entry(self, target_order_id):
        """
        点击右上角菜单 -> 找到备注 -> 点击下方输入框 -> 全选复制 -> 比对
        """
        print(f"    开始验证备注信息，目标单号: {target_order_id}")

        # 1. 点击右上角菜单 (...)
        if not self.click_image(IMG_MENU, retries=3):
            print("    [验证失败] 未找到右上角菜单按钮")
            return False, "Menu button not found"

        # 等待侧边栏滑出
        time.sleep(1.0)

        # 2. 寻找“备注”字样并点击下方输入框
        memo_img_path = os.path.join(os.getcwd(), IMG_MEMO)
        if not os.path.exists(memo_img_path):
            print(f"    [错误] 缺少图片素材: {IMG_MEMO}")
            return False, "Memo image missing"

        try:
            # 在屏幕上寻找“备注”图片的位置
            # confidence需要安装opencv-python，如果报错请去掉confidence参数
            pos = pyautogui.locateCenterOnScreen(memo_img_path, confidence=0.8, grayscale=True)
            if not pos:
                print("    [验证失败] 侧边栏中未找到'备注'字样")
                return False, "Memo label not found"
            print(f"    备注位置：{pos}")

            # 获取坐标
            memo_x, memo_y = pos

            # 3. 点击“备注”下方 30px 的位置（即输入框）
            input_x = memo_x
            input_y = memo_y + 30  # 向下偏移 30 像素

            pyautogui.click(input_x, input_y)
            time.sleep(1.0)  # 等待焦点激活

            # 4. 全选并复制
            # 先清空剪贴板，防止读到旧数据
            pyperclip.copy("")

            pyautogui.hotkey('ctrl', 'a')
            time.sleep(0.5)
            pyautogui.hotkey('ctrl', 'c')
            time.sleep(0.5)

            # 获取剪贴板内容
            clipboard_content = pyperclip.paste().strip()
            print(f"    [读取到的备注] {clipboard_content}")

            # 5. 比对逻辑
            # 只要备注里包含了订单号（或者订单号的关键部分）就算通过
            if not clipboard_content:
                return False, "Empty memo"

            # 兼容逻辑：完全包含 或者 包含后7位
            short_id = target_order_id[-7:] if len(target_order_id) > 7 else target_order_id

            if (target_order_id in clipboard_content) or (short_id in clipboard_content):
                return True, clipboard_content
            else:
                print(f"    [不匹配] 目标: {target_order_id} vs 实际: {clipboard_content}")
                return False, clipboard_content

        except Exception as e:
            print(f"    [验证异常] {e}")
            return False, str(e)

    # === 辅助方法 3: 视觉差分 (验证发送成功) ===
    def _get_footer_screenshot(self):
        """截取聊天区底部 30%"""
        x = self.main_window.left + 480
        w = self.main_window.width - 620
        h = int(self.main_window.height * 0.3)
        y = self.main_window.top + self.main_window.height - h - 280

        shot = pyautogui.screenshot(region=(x, y, w, h))
        debug_path = os.path.join(os.getcwd(), "debug_shot.png")
        shot.save(debug_path)

        # 转为灰度 numpy 数组用于计算
        return cv2.cvtColor(np.array(shot), cv2.COLOR_RGB2GRAY)

    def _check_send_success(self, img_before, img_after):
        """
        计算两张图片的差异度
        """
        # 计算差值绝对值
        diff = cv2.absdiff(img_before, img_after)
        # 二值化差分图，过滤微小噪点 (阈值25)
        _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
        # 计算非零像素比例 (变化面积)
        non_zero_count = np.count_nonzero(thresh)
        total_pixels = thresh.shape[0] * thresh.shape[1]
        change_rate = (non_zero_count / total_pixels) * 100

        # 如果变化超过 0.5%，认为界面刷新了（有新消息上屏）
        return change_rate > 0.5

# ================= 数据库(JSON) 管理 =================

def load_tasks():
    if not os.path.exists(JSON_FILE):
        return []
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []


def save_tasks(tasks):
    try:
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(tasks, f, ensure_ascii=False, indent=4)
    except:
        pass


bot = WeComBot()

if __name__ == "__main__":
    print(" 独立运行模式")