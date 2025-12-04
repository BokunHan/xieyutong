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
import threading
import time
import sqlite3
import requests

# ================= 配置区域 =================
JSON_FILE = "tasks.json"
# WINDOW_TITLE = "企业微信"
# WINDOW_TITLE = "微信"
WINDOW_TITLE = "多开神器"
POPUP_TITLE = "搜索聊天记录"
IMG_ENTER_CHAT = "enter_chat.png"
IMG_SEARCH_BOX = "search_box.png"
CHECK_INTERVAL = 3  # 检查频率(秒)
PASTE_WAIT = 1.0  # 粘贴文件后的等待时间(秒)

WAIT_TEXT = 0.5      # 发完文字后等待(秒)
WAIT_IMAGE = 2.0     # 发完图片后等待(秒)
WAIT_VIDEO = 5.0    # 发完视频后等待(秒)
VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.wmv'] # 常见的视频后缀
# ===========================================

class WeComBot:
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

    # def _find_wecom_windows(self):
    #     """模糊查找所有包含 '企业微信' 字样的窗口"""
    #     all_windows = gw.getAllWindows()
    #     wecom_wins = []
    #     for w in all_windows:
    #         if WINDOW_TITLE in w.title and w.visible:
    #             wecom_wins.append(w)
    #     return wecom_wins

    def _force_focus(self, window):
        """
        强制激活窗口，兼容不同用户权限
        """
        try:
            hwnd = window._hWnd  # 获取窗口句柄

            # 1. 如果最小化，先还原
            if window.isMinimized:
                # 使用 Win32 API 还原 (SW_RESTORE = 9)
                ctypes.windll.user32.ShowWindow(hwnd, 9)
                time.sleep(0.2)

            # 2. 强制置顶 (模拟 Alt 键防止被系统拦截)
            ctypes.windll.user32.keybd_event(0, 0, 0, 0)
            ctypes.windll.user32.SetForegroundWindow(hwnd)
            time.sleep(0.2)
            return True
        except Exception as e:
            print(f"   ⚠️ 尝试强制激活失败 (Handle: {window._hWnd}): {e}")
            return False

    def _minimize_win(self, window):
        """强制最小化窗口"""
        try:
            if window:
                # SW_MINIMIZE = 6
                ctypes.windll.user32.ShowWindow(window._hWnd, 6)
        except Exception as e:
            print(f"   ⚠️ 最小化失败: {e}")

    # def bind_accounts(self):
    #     """
    #     启动时“点名”：轮询所有窗口，人工绑定账号 (用于多开企微）
    #     """
    #     # 1. 获取所有标题叫“企业微信”的窗口
    #     windows = self._find_wecom_windows()
    #
    #     if not windows:
    #         print("❌ 未找到任何“企业微信”窗口，请先打开软件！")
    #         return
    #
    #     print(f"\n🔍 检测到 {len(windows)} 个企业微信窗口，开始进行人工认领...")
    #     print("------------------------------------------------")
    #
    #     # 清空旧映射
    #     self.account_map = {}
    #     assigned_windows = []
    #
    #     # 2. 遍历每一个窗口，弹出来让你认
    #     for i, window in enumerate(windows):
    #         # try:
    #         #     # 尝试把窗口弹到最前面
    #         #     if window.isMinimized:
    #         #         window.restore()
    #         #     window.activate()
    #         #     time.sleep(0.5)
    #         # except Exception as e:
    #         #     print(f"⚠️ 窗口 #{i + 1} 无法激活，跳过。")
    #         #     continue
    #         print(f"👉 正在尝试激活窗口 #{i + 1} ...")
    #         if not self._force_focus(window):
    #             print(f"   ⚠️ 无法激活窗口 #{i + 1}，可能需要管理员权限运行脚本！")
    #
    #         # 3. 交互式询问
    #         print(f"👉 窗口 #{i+1} 已弹出 (标题: {window.title})")
    #         account_name = input("   请输入此窗口的账号名: ").strip()
    #
    #         if account_name:
    #             self.account_map[account_name] = window
    #             assigned_windows.append(window)
    #             print(f"   ✅ 绑定成功：【{account_name}】")
    #         else:
    #             print("   ⚠️ 跳过此窗口")
    #         print("------------------------------------------------")
    #
    #     print("📉 正在隐藏所有企业微信窗口...")
    #     for win in self.account_map.values():
    #         self._minimize_win(win)
    #         time.sleep(0.1)
    #
    #     bound_list = list(self.account_map.keys())
    #     print(f"🎉 绑定结束，共绑定 {len(self.account_map)} 个账号。")
    #     return bound_list

    def bind_accounts(self):
        """
        不再轮询窗口，而是让用户把鼠标放到左侧头像上，记录坐标偏移量。（用于个人微信多开神器）
        """
        self.main_window = self._find_main_window()
        if not self.main_window:
            print(f"❌ 未找到【{WINDOW_TITLE}】窗口，请先打开软件！")
            return []

        print(f"\n🔍 已锁定主窗口: {self.main_window.title}")
        print("💡 接下来进行坐标绑定：请按提示将鼠标悬停在左侧账号头像上。")
        print("------------------------------------------------")

        # 激活窗口，让它显示出来
        self._force_focus(self.main_window)
        self.account_offsets = {}

        while True:
            account_name = input("\n👉 请输入要绑定的账号名称 (如'大号'，直接回车结束认领): ").strip()
            if not account_name:
                break

            print(f"   ⏳ 请将鼠标【移动到】 {account_name} 的头像中间，不要点击...")
            print("   ✅ 移好后，请按 【回车键】 确认坐标")
            input()  # 等待用户按回车

            # 获取当前鼠标位置
            mouse_x, mouse_y = pyautogui.position()

            # 获取窗口当前位置
            win_left = self.main_window.left
            win_top = self.main_window.top

            # 计算相对偏移量 (这样即使窗口以后移动了位置，也能点得准)
            offset_x = mouse_x - win_left
            offset_y = mouse_y - win_top

            self.account_offsets[account_name] = (offset_x, offset_y)
            print(f"   📍 已记录 {account_name} 坐标偏移: ({offset_x}, {offset_y})")

        print("------------------------------------------------")
        print("📉 绑定完成，窗口最小化...")
        self._minimize_win(self.main_window)

        bound_list = list(self.account_offsets.keys())
        print(f"🎉 当前可用账号: {bound_list}")
        return bound_list

    # def activate_window(self, account_name):
    #     """根据账号名激活对应的窗口（用于多开企微）"""
    #     if account_name and account_name in self.account_map:
    #         target_win = self.account_map[account_name]
    #         # return self._focus_win(target_win)
    #         return self._force_focus(target_win)
    #
    #     # 兜底：如果没指定账号，或者账号不存在，尝试用第一个窗口
    #     # print(f"⚠️ 账号 '{account_name}' 未找到，尝试使用默认窗口...")
    #     windows = self._find_wecom_windows()
    #     # if windows: return self._focus_win(windows[0])
    #     if windows: return self._force_focus(windows[0])
    #     return False

    def activate_window(self, account_name):
        """
        1. 激活主窗口
        2. 根据保存的偏移量，点击对应账号的头像
        （用于个人微信多开神器）
        """
        if not self.main_window:
            self.main_window = self._find_main_window()
            if not self.main_window: return False

        # 1. 先把窗口弹出来
        self._force_focus(self.main_window)

        # 2. 如果指定了账号，就去点击头像切换
        if account_name and account_name in self.account_offsets:
            offset_x, offset_y = self.account_offsets[account_name]

            # 计算当前的绝对点击坐标
            click_x = self.main_window.left + offset_x
            click_y = self.main_window.top + offset_y

            # 移动鼠标并点击
            # print(f"   🖱️ 切换账号: {account_name} (点击 {click_x},{click_y})")
            pyautogui.click(click_x, click_y)

            time.sleep(0.5)
            return True

        # 如果没指定账号，或者账号没找到，就保持在当前界面，也算成功
        if not account_name:
            return True

        print(f"⚠️ 未找到账号 [{account_name}] 的坐标信息")
        return False

    def _focus_win(self, window):
        try:
            if window.isMinimized:
                window.restore()
                time.sleep(0.5)
            window.activate()
            time.sleep(0.5)
            return True
        except Exception as e:
            return False

    def click_image(self, image_name, retries=5):
        """
        屏幕找图并点击
        :param image_name: 图片文件名
        :param retries: 重试次数 (每次间隔0.5秒)
        """
        img_path = os.path.join(os.getcwd(), image_name)
        if not os.path.exists(img_path):
            print(f"   ❌ 缺失图片素材: {img_path}")
            return False

        print(f"   🔍 正在屏幕上寻找: {image_name} ...")
        for i in range(retries):
            try:
                pos = pyautogui.locateCenterOnScreen(img_path, confidence=0.7, grayscale=True)
                if pos:
                    print(f"   🎯 找到目标，坐标: {pos}")
                    pyautogui.click(pos)
                    return True
            except Exception as e:
                if "confidence" in str(e):
                    print("   ⚠️ 未安装 opencv-python，尝试精确匹配...")
                    try:
                        pos = pyautogui.locateCenterOnScreen(img_path)
                        if pos:
                            pyautogui.click(pos)
                            return True
                    except:
                        pass
                pass

            time.sleep(0.5)

        print("   ❌ 未找到目标图片")
        return False

    def set_clipboard_files(self, file_paths):
        """将文件路径放入剪贴板"""
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

    def send_mixed_msg(self, order_id, payload, account_name=None):
        """执行发送流程 (带上下文缓存)"""

        # 目标账号处理 (没传则默认为空字符串，方便比较)
        target_account = account_name if account_name else ""

        # === 判断是否已经在正确的窗口和聊天中 ===
        is_same_context = (
                self.current_active_account == target_account and
                self.current_chat_id == order_id
        )

        if is_same_context:
            print(f"⏩ [加速模式] 已在目标群 {order_id}，直接发送...")
        else:
            # === 走完整切换流程 ===

            # 1. 切换账号
            if not self.activate_window(account_name):
                return False

            print(f"🚀 [{account_name}] 搜索订单号: {order_id}")

            if not self.click_image(IMG_SEARCH_BOX, retries=3):
                print("   ⚠️ 未找到搜索框图片，尝试盲操...")

            time.sleep(0.5)

            # 2. 搜索
            pyautogui.hotkey('ctrl', 'f')
            time.sleep(0.5)
            pyperclip.copy(order_id)
            time.sleep(0.5)
            pyautogui.hotkey('ctrl', 'v')
            time.sleep(1.5)

            pyautogui.press('down')
            time.sleep(0.2)
            pyautogui.press('enter')
            time.sleep(1.0)

            if not self.click_image(IMG_ENTER_CHAT, retries=5):
                print("   ⚠️ 无法进入聊天窗口 (找不到按钮图片)，跳过发送")
                pyautogui.press('esc')
                # 失败时清空上下文，确保下次重试
                self.current_active_account = None
                self.current_chat_id = None
                self._minimize_win(self.main_window)
                return False

            time.sleep(1.0)

            # === 切换成功，更新上下文记录 ===
            self.current_active_account = target_account
            self.current_chat_id = order_id

        # 3. 发送内容
        print(f"   💬 开始发送 {len(payload)} 条消息...")
        for index, item in enumerate(payload):
            msg_type = item.get("type")
            content = item.get("data")
            current_wait_time = WAIT_TEXT

            print(f"  [{index + 1}/{len(payload)}] {msg_type}")

            if msg_type == "text":
                pyperclip.copy(content)
                time.sleep(0.3)
                pyautogui.hotkey('ctrl', 'v')
                time.sleep(0.3)
                pyautogui.press('enter')
                current_wait_time = WAIT_TEXT

            elif msg_type in ["file", "image", "video"]:
                if os.path.exists(content):
                    _, ext = os.path.splitext(content)
                    ext = ext.lower()
                    if msg_type == "video" or ext in VIDEO_EXTS:
                        current_wait_time = WAIT_VIDEO
                    else:
                        current_wait_time = WAIT_IMAGE

                    self.set_clipboard_files([content])
                    time.sleep(0.5)
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(PASTE_WAIT)
                    pyautogui.press('enter')
                else:
                    print(f"  ❌ 文件不存在: {content}")
                    continue

            custom_delay = item.get("delay")
            final_wait = float(custom_delay) if custom_delay else current_wait_time
            time.sleep(final_wait)

        print("✅ 发送完毕")

        return True


# ================= 数据库(JSON) 管理 =================

def load_tasks():
    if not os.path.exists(JSON_FILE):
        return []
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"读取 JSON 失败: {e}")
        return []


def save_tasks(tasks):
    try:
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(tasks, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"保存 JSON 失败: {e}")


# def process_schedule(bot):
#     """轮询逻辑"""
#     tasks = load_tasks()
#     is_updated = False
#     current_time = datetime.now()
#
#     for task in tasks:
#         # 筛选：状态为 pending 且 时间已到
#         if task.get('status') == 'pending':
#             try:
#                 target_time = datetime.strptime(task['send_time'], "%Y-%m-%d %H:%M:%S")
#
#                 if current_time >= target_time:
#                     print(f"\n⏰ 触发任务 ID: {task['id']} | 时间: {task['send_time']}")
#
#                     # 🚀 执行发送
#                     success = bot.send_mixed_msg(task['group_name'], task['payload'])
#
#                     if success:
#                         task['status'] = 'sent'
#                         task['executed_at'] = current_time.strftime("%Y-%m-%d %H:%M:%S")
#                         is_updated = True
#                     else:
#                         print("❌ 发送失败，稍后重试")
#
#             except ValueError as e:
#                 print(f"⚠️ 时间格式错误 ID {task['id']}: {e}")
#
#     # 只有当状态发生改变时才写文件，保护硬盘
#     if is_updated:
#         save_tasks(tasks)
#         print("💾 任务状态已更新")
#
#
# def run_sync_job():
#     """
#     这是后台线程要跑的函数：每隔 1 小时同步一次群列表
#     """
#     print("🔄 [后台线程] 群列表同步服务已启动...")
#
#     while True:
#         try:
#
#             print(f"🔄 [后台线程] 开始同步... {datetime.now()}")
#
#             # 1. 获取 Token
#             # token = get_access_token()
#
#             # 2. 获取列表 & 存入 DB
#             # groups = fetch_group_details(token, ...)
#             # save_to_db(groups)
#
#             print("✅ [后台线程] 同步完成")
#
#         except Exception as e:
#             print(f"⚠️ [后台线程] 同步出错 (不影响主程序): {e}")
#
#         # 休息 1 小时 (3600秒)
#         time.sleep(3600)

bot = WeComBot()

# ================= 主程序 =================
if __name__ == "__main__":
    # 1. 启动后台同步线程
    # sync_thread = threading.Thread(target=run_sync_job, daemon=True)
    # sync_thread.start()
    #
    # bot = WeComBot()
    #
    # print("========================================")
    # print("🤖 全自动企业微信发送机器人已启动")
    # print(f"📂 监听数据库: {JSON_FILE}")
    # print("========================================")
    #
    # while True:
    #     process_schedule(bot)
    #     print(f"\r⏳ 监控中... {datetime.now().strftime('%H:%M:%S')}", end="", flush=True)
    #     time.sleep(CHECK_INTERVAL)

    print("🤖 独立运行模式：测试发送功能")