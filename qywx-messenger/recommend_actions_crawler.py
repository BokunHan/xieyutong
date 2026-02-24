from DrissionPage import ChromiumPage, ChromiumOptions
import time
import ctypes
import pygetwindow as gw
import pyautogui
import os
from captcha_solver import solve_captcha
import win32gui
import win32con
import win32com.client
import re

# 全局变量
page = None

# ================= 多账号配置 =================
# 必须与 browser_launcher.py 中的端口一致
SPIDER_PORT = 9222  # 爬虫用
SUPPLIER_PORTS = [9333, 9444, 9555]  # 抢单用 (支持任意多个)

PORT_CONFIG_MAP = {
    9222: {
        "path": "User_Spider",
        "url": "https://vbooking.ctrip.com/ttl_vendor/recommendAction"
    },
    9333: {
        "path": "User_Supplier_A",
        "url": "https://vbooking.ctrip.com/vbk/im/notice?currentTab=BC&initChat=3&locale=zh-CN&accountsource=vbk&disNotificationBiztype=118"
    },
    9444: {
        "path": "User_Supplier_B",
        "url": "https://vbooking.ctrip.com/vbk/im/notice?currentTab=BC&initChat=3&locale=zh-CN&accountsource=vbk&disNotificationBiztype=118"
    },
    9555: {
        "path": "User_Supplier_C",
        "url": "https://vbooking.ctrip.com/vbk/im/notice?currentTab=BC&initChat=3&locale=zh-CN&accountsource=vbk&disNotificationBiztype=118"
    }
}

# 缓存页面对象，避免重复连接
PAGE_POOL = {}


def get_page_by_port(port):
    """根据端口获取或创建页面对象，并自动导航"""
    # 1. 尝试复用现有连接
    if port in PAGE_POOL:
        try:
            if PAGE_POOL[port].process_id:
                return PAGE_POOL[port]
        except:
            PAGE_POOL.pop(port, None)

    try:
        # 2. 获取该端口的配置
        config = PORT_CONFIG_MAP.get(port, {})
        profile_path = config.get("path")
        target_url = config.get("url")

        co = ChromiumOptions()
        co.set_local_port(port)

        # 设置用户数据路径
        if profile_path:
            user_data_path = os.path.join(os.getcwd(), "browser_profiles", profile_path)
            co.set_user_data_path(user_data_path)

        co.set_argument('--blink-settings=imagesEnabled=true')

        # 3. 初始化页面对象
        page = ChromiumPage(addr_or_opts=co)
        page.set.timeouts(10)

        # === 启动时自动访问指定URL ===
        if target_url:
            try:
                current_url = page.url
                print(f"     [端口{port}] 当前URL: {current_url}")

                # 只要当前 URL 里没有包含目标域名的关键词（比如 'vbooking'），就强制跳转。
                # 这样无论是 about:blank, chrome://newtab, 还是上次遗留的百度页面，都会跳过去。
                if "vbooking" not in current_url:
                    print(f"     [端口{port}] 正在导航至业务主页...")
                    page.get(target_url)
                else:
                    print(f"     [端口{port}] 已在业务页面，无需跳转")

            except Exception as e:
                print(f"     [端口{port}] 自动导航失败: {e}")
                # 如果获取URL出错，保守策略：直接跳
                page.get(target_url)

        PAGE_POOL[port] = page
        return page
    except Exception as e:
        print(f"连接浏览器(端口{port})失败: {e}")
        return None


# ================= 辅助函数 =================

def force_browser_focus(page_obj):
    """强制将浏览器窗口置顶"""
    try:
        target_title = page_obj.title
        if not target_title:
            target_title = "Google Chrome"

        print(f"     [Focus] 正在尝试把 '{target_title}' 窗口提到最前面...")

        found_hwnd = None

        def enum_window_callback(hwnd, _):
            nonlocal found_hwnd
            if win32gui.IsWindowVisible(hwnd):
                window_text = win32gui.GetWindowText(hwnd)
                if target_title in window_text:
                    found_hwnd = hwnd
                    return False
            return True

        win32gui.EnumWindows(enum_window_callback, None)

        if not found_hwnd:
            print("     [Focus] 未找到指定窗口，正在提取任意窗口...")

            def enum_chrome_callback(hwnd, _):
                nonlocal found_hwnd
                if win32gui.IsWindowVisible(hwnd):
                    if "Google Chrome" in win32gui.GetWindowText(hwnd):
                        found_hwnd = hwnd
                        return False
                return True

            win32gui.EnumWindows(enum_chrome_callback, None)

        if found_hwnd:
            if win32gui.IsIconic(found_hwnd):
                win32gui.ShowWindow(found_hwnd, win32con.SW_RESTORE)

            shell = win32com.client.Dispatch("WScript.Shell")
            shell.SendKeys('%')

            win32gui.SetForegroundWindow(found_hwnd)
            time.sleep(0.2)
            return True
        else:
            print(f"     [Focus] 未找到 {target_title} 窗口")

    except Exception as e:
        print(f"     [Focus] 错误: {e}")
    return False


def click_image_match(image_name, retries=3):
    """
    屏幕找图并点击
    """
    img_path = os.path.join(os.getcwd(), image_name)
    if not os.path.exists(img_path):
        print(f"     缺失图片素材: {image_name} (请截图保存到项目根目录)")
        return False

    print(f"     正在寻找图片: {image_name} ...")
    for i in range(retries):
        try:
            # 尝试找图，confidence 需要 opencv-python 支持，如果没装会报错降级为精确匹配
            pos = pyautogui.locateCenterOnScreen(img_path, confidence=0.8, grayscale=True)
            if pos:
                print(f"     找到目标，坐标: {pos}")
                pyautogui.click(pos)
                return True
        except Exception as e:
            # 如果报错可能是没装opencv，尝试精确匹配
            try:
                pos = pyautogui.locateCenterOnScreen(img_path)
                if pos:
                    pyautogui.click(pos)
                    return True
            except:
                pass

        time.sleep(0.5)

    print(f"     未找到图片: {image_name}")
    return False


# def init_browser():
#     """ 初始化浏览器 (如果未初始化) """
#     global page
#     if page is None:
#         try:
#             co = ChromiumOptions()
#             co.set_argument('--blink-settings=imagesEnabled=true')  # 抢单可能需要看图，开启图片
#             page = ChromiumPage(addr_or_opts=co)
#             page.set.timeouts(10)
#         except Exception as e:
#             print(f"Browser Init Error: {e}")


# def switch_to_tab(keyword):
#     """
#     根据标题关键字切换标签页
#     """
#     global page
#     init_browser()
#
#     try:
#         # 获取所有标签页的 ID 列表
#         all_ids = page.tab_ids
#
#         for tab_id in all_ids:
#             # 通过 ID 获取标签页对象
#             tab = page.get_tab(tab_id)
#
#             # 判断标题是否包含关键字
#             if tab and keyword in tab.title:
#                 # 激活该标签页
#                 page.activate_tab(tab_id)
#                 print(f"👉 已切换到标签页: {tab.title}")
#                 return True
#
#         print(f"⚠️ 未找到包含 '{keyword}' 的标签页，请手动打开！")
#         return False
#
#     except Exception as e:
#         print(f"Tab Switch Error: {e}")
#         return False

def switch_to_tab(page_obj, keyword):
    """在指定页面对象中切换标签页"""
    try:
        all_ids = page_obj.tab_ids
        for tab_id in all_ids:
            tab = page_obj.get_tab(tab_id)
            if tab and keyword in tab.title:
                page_obj.activate_tab(tab_id)
                return True
        print(f" [端口{page_obj.address}] 未找到包含 '{keyword}' 的标签页")
        return False
    except Exception as e:
        print(f"Tab Switch Error: {e}")
        return False

def refresh_and_navigate(tab):
    """
    刷新页面 -> 点击[订单通知/Order notice] -> 点击[定制游待接单通知/Custom tour...]
    兼容中英文界面
    """
    print("   正在刷新页面并重置菜单...")
    try:
        # 1. 刷新页面
        tab.refresh()
        tab.wait.doc_loaded()

        # --- 消除通知弹窗逻辑（两种形式） ---
        for _ in range(10):
            try:
                pop_btn = tab.ele('xpath://button[text()="知道了"]', timeout=1)

                if pop_btn and pop_btn.states.is_displayed:
                    print("   发现[知道了]弹窗，点击关闭...")
                    pop_btn.click()
                    time.sleep(0.8)  # 等待一下弹窗消失
                else:
                    break
            except Exception as e:
                break

        for i in range(10):  # 最多尝试10次
            # 查找是否含有“我已仔细阅读并同意”的元素
            agreement_text = tab.ele('text:我已仔细阅读并同意', timeout=1)

            if agreement_text:
                print(f"   发现服务协议通知 (第 {i + 1} 层)，正在处理...")
                try:
                    # 点击文字或其父级以勾选
                    agreement_text.click()
                    time.sleep(0.5)

                    # 查找并点击“确 定”按钮
                    # 注意：根据截图，按钮文字中间有一个空格
                    confirm_btn = tab.ele('text:确 定', timeout=1)

                    if confirm_btn:
                        confirm_btn.click()
                        print("   已点击确定")
                        time.sleep(1)  # 等待弹窗消失或下一层弹出
                    else:
                        print("   未找到确定按钮")
                        break  # 找不到确定按钮则退出
                except Exception as e:
                    print(f"   处理弹窗时出错: {e}")
                    break
            else:
                break

        time.sleep(1)

        # === 兼容配置区 ===
        # 定义中文和英文的关键词
        TXT_SUB_MENU = ["定制游待接单通知", "Custom tour to be received notice"]
        TXT_MAIN_MENU = ["订单通知", "Order notice"]
        # =================

        # 优先检查目标子菜单是否直接可见/存在
        target_menu = None
        for txt in TXT_SUB_MENU:
            target_menu = tab.ele(f'text:{txt}', timeout=0.5)
            if target_menu and target_menu.states.is_displayed:
                break

        if target_menu and target_menu.states.is_displayed:
            print("   ⚡ 菜单已处于展开状态，直接点击目标...")
            target_menu.click()
            time.sleep(1.5)
            return True

        # 2. 如果没找到目标，或者目标不可见，则按常规流程点击父菜单
        print("    菜单未展开，准备点击主菜单...")

        # 查找主菜单 (订单通知 / Order notice)
        notice_btn = None
        for txt in TXT_MAIN_MENU:
            notice_btn = tab.ele(f'text:{txt}', timeout=2)
            if notice_btn:
                print(f"    找到主菜单: {txt}")
                break

        if not notice_btn:
            # 尝试增加超时再找一次
            notice_btn = tab.ele(f'text:{TXT_MAIN_MENU[0]}', timeout=5) or tab.ele(f'text:{TXT_MAIN_MENU[1]}', timeout=1)

        if not notice_btn:
            print("    刷新后未找到[订单通知]按钮，可能页面结构变化或未登录")
            return False

        # 3. 点击(或悬停)触发下拉菜单
        notice_btn.click()
        time.sleep(0.5)

        # 4. 点击子菜单
        target_menu = None
        for txt in TXT_SUB_MENU:
            target_menu = tab.ele(f'text:{txt}', timeout=3)
            if target_menu:
                print(f"    找到子菜单: {txt}")
                break

        if target_menu:
            target_menu.click()
            print("   已进入任务列表页面")
            time.sleep(1.5)
            return True
        else:
            print("    未找到子菜单选项，尝试使用鼠标悬停...")
            notice_btn.hover()
            time.sleep(0.5)

            for txt in TXT_SUB_MENU:
                target_menu = tab.ele(f'text:{txt}', timeout=3)
                if target_menu: break

            if target_menu:
                target_menu.click()
                print("   (悬停模式) 已进入页面")
                time.sleep(1.5)
                return True
            else:
                print("   彻底未找到菜单项")
                return False

    except Exception as e:
        print(f"   导航流程出错: {e}")
        return False

def smart_wait(seconds, stop_callback):
    """
    等待指定秒数，期间每 0.1 秒检查一次暂停状态。
    如果检测到暂停，返回 True；否则等待结束后返回 False。
    """
    if not stop_callback:
        time.sleep(seconds)
        return False

    # 将等待时间切片
    steps = int(seconds * 10)
    for _ in range(steps):
        # 只要检测到暂停，立刻中断
        if stop_callback():
            return True
        time.sleep(0.1)
    return False


def parse_headcount(text):
    """解析 '4成人2儿童' 格式的人数"""
    adults = 0
    children = 0

    m_adult = re.search(r'(\d+)成人', text)
    if m_adult: adults = int(m_adult.group(1))

    m_child = re.search(r'(\d+)儿童', text)
    if m_child: children = int(m_child.group(1))

    # 如果只有数字没有文字，尝试直接转换（防御性编程）
    if adults == 0 and children == 0 and text.isdigit():
        return int(text)

    return adults + children

# ================= 业务逻辑 =================

def check_order_suitability(tab, config):
    """
    检查弹窗中的订单信息是否符合白名单配置
    config: 从云端拉取的 grab_settings
    """
    if not config: return True  # 无配置则默认抢

    print("   正在筛选订单详情...")

    try:
        # 等待弹窗表格出现
        table = tab.ele('css:.ant-modal-body table', timeout=3)
        if not table:
            print("   未找到详情表格，无法筛选，默认放行")
            return True

        rows = table.eles('css:tbody tr')
        if not rows: return True

        cells = rows[0].eles('tag:td')

        # 需求单号, 出发地, 目的地, 往返日期, 出行人数, 代订服务
        # 对应数据列应该是：
        # cells[0]: 需求单号
        # cells[1]: 出发地
        # cells[2]: 目的地
        # cells[3]: 日期
        # cells[4]: 人数
        # cells[5]: 服务

        val_dep = cells[1].text.strip()
        val_dest = cells[2].text.strip()
        val_pax_str = cells[4].text.strip()
        val_service = cells[5].text.strip()

        val_pax = parse_headcount(val_pax_str)

        print(f"     [订单信息] 出发:{val_dep} | 目的:{val_dest} | 人数:{val_pax}({val_pax_str}) | 服务:{val_service}")

        # 1. 检查出发地
        cfg_dep = config.get('departure', {})
        if cfg_dep.get('switch'):
            whitelist = cfg_dep.get('whitelist', [])
            # 只要包含关键词即可，还是需要完全匹配？通常包含即可
            # 假设 whitelist 是 ["上海", "北京"]
            match = False
            for w in whitelist:
                if not w: continue
                if w in val_dep:
                    match = True
                    break
            if not match:
                print(f"      出发地 '{val_dep}' 不在白名单内")
                return False

        # 2. 检查目的地
        cfg_dest = config.get('destination', {})
        if cfg_dest.get('switch'):
            whitelist = cfg_dest.get('whitelist', [])
            match = False
            for w in whitelist:
                if not w: continue
                if w in val_dest:
                    match = True
                    break
            if not match:
                print(f"      目的地 '{val_dest}' 不在白名单内")
                return False

        # 3. 检查服务
        cfg_svc = config.get('service_type', {})
        if cfg_svc.get('switch'):
            whitelist = cfg_svc.get('whitelist', [])
            # 如果白名单为空，可能意味着只抢"无服务"的？
            # 这里逻辑：如果服务文本包含白名单任一词，则通过
            # 如果单元格为空，视为空字符串
            match = False
            for w in whitelist:
                if not w: continue
                if w in val_service:
                    match = True
                    break
            if not match:
                print(f"      代订服务 '{val_service}' 不在白名单内")
                return False

        # 4. 检查人数
        cfg_pax = config.get('headcount', {})
        if cfg_pax.get('switch'):
            min_count = cfg_pax.get('min_count', 0)
            if val_pax < min_count:
                print(f"      总人数 {val_pax} 低于设定值 {min_count}")
                return False

        print("      订单符合筛选条件")
        return True

    except Exception as e:
        print(f"   筛选逻辑出错: {e}，默认放行")
        return True

def run_grab_orders_single_account(port, stop_callback=None, config=None):
    """
    单账号抢单逻辑
    """
    page = get_page_by_port(port)
    if not page: return

    print(f" [账号端口 {port}] 正在检查可接订单...")

    # 强制置顶窗口，否则 PyAutoGUI 找图可能会失败
    # force_browser_focus(page)

    if not switch_to_tab(page, "供应商客服工作台"):
        return

    tab = page.latest_tab

    # 执行刷新 + 菜单导航
    if not refresh_and_navigate(tab):
        return

    try:
        # 扫描接单按钮
        apply_btns = tab.eles('text:申请接单', timeout=2)
        if not apply_btns:
            print(f"   [端口 {port}] 暂无新订单")
            return

        print(f"   [端口 {port}] 发现 {len(apply_btns)} 个潜在订单!")

        # 遍历抢单
        for i in range(len(apply_btns)):
            if stop_callback and stop_callback():
                print(f"   [端口 {port}] 收到暂停指令，中断当前账号抢单！")
                return

            current_btns = tab.eles('text:申请接单', timeout=2)
            if not current_btns: break
            btn = current_btns[0]

            print(f"    点击第 {i + 1} 个申请按钮...")
            btn.click()
            if smart_wait(1, stop_callback):
                print(f"   [端口 {port}] 暂停... (已中断后续操作)")
                return

            # 等待弹窗加载
            try:
                tab.wait.ele_displayed('css:.ant-modal-body', timeout=3)
                is_suitable = check_order_suitability(tab, config)

                if not is_suitable:
                    # 不合适，点击关闭按钮
                    # 根据截图，Close 按钮 class 为 "ant-modal-close"
                    close_btn = tab.ele('css:.ant-modal-close', timeout=2)
                    if close_btn:
                        close_btn.click()
                        time.sleep(0.5)
                    print("     已放弃该订单 (不满足筛选条件)")
                    continue  # 跳过当前循环，处理下一个按钮
            except Exception as e:
                print(f"   筛选过程异常: {e}")

            confirm_btn = tab.ele(
                'xpath://div[contains(@class, "ant-modal-footer")]//span[contains(text(), "继续申请")]', timeout=3)
            if confirm_btn:
                if stop_callback and stop_callback():
                    print(f"   [端口 {port}] 暂停... (取消确认点击)")
                    return

                confirm_btn.click()
                if smart_wait(1, stop_callback): return

                if tab.ele('css:#verification-code-container', timeout=3):
                    print("   出现验证码，开始破解...")
                    if solve_captcha(tab, stop_callback=stop_callback):
                        print("   抢单成功")
                    else:
                        print("   验证失败")
                        close_btn = tab.ele('css:button.ant-modal-close')
                        if close_btn: close_btn.click()
                else:
                    print("   无需验证码，申请成功")
            else:
                print("   无需确认或已直接申请")
            if smart_wait(1, stop_callback): return

    except Exception as e:
        print(f"   [端口 {port}] 抢单出错: {e}")


def run_grab_orders(stop_callback=None, config=None):
    """
    [总入口] 轮询所有供应商账号进行抢单
    """
    print("\n 开始多账号轮询抢单...")
    for port in SUPPLIER_PORTS:
        # 1. 每次切账号前，检查一下是否需要暂停
        if stop_callback and stop_callback():
            print("   检测到暂停指令，停止本轮抢单循环！")
            break

        # 2. 正常执行单账号逻辑
        run_grab_orders_single_account(port, stop_callback=stop_callback, config=config)

        # 3. 再次检查（防止在 sleep 期间按了暂停）
        if stop_callback and stop_callback():
            print("   检测到暂停指令，停止后续操作！")
            break

        # 账号间稍微间隔一下
        time.sleep(1)

def toggle_order_status(page):
    """
    [图像识别版] 切换'订单推荐动作状态'
    1. 点击下拉框 (DOM)
    2. 点击选项 (图像识别)
    3. 点击查询按钮 (DOM)
    """
    print("     未找到订单，尝试切换'订单推荐动作状态'...")
    try:
        # 1. 定位并点击下拉框 (DOM定位)
        selector = page.ele(
            'xpath://label[@title="订单推荐动作状态"]/ancestor::div[contains(@class,"ant-form-item")]//div[contains(@class, "ant-select-selector")]')

        if not selector:
            print("     未找到状态切换下拉框")
            return False

        # 获取当前状态
        current_val_ele = selector.ele('.ant-select-selection-item')
        current_text = current_val_ele.text.strip() if current_val_ele else "进行中"

        # 决定要找哪张图
        if "进行中" in current_text:
            target_text = "待开始"
            target_img = "option_pending.png"
        else:
            target_text = "进行中"
            target_img = "option_processing.png"

        print(f"     当前状态: [{current_text}] -> 寻找图片: [{target_img}]")

        # 2. 点击展开下拉菜单
        selector.click()
        time.sleep(0.5)  # 等待菜单弹出

        # 3. 使用图像识别找选项
        if click_image_match(target_img):
            print(f"     选项点击成功: {target_text}")

            print("     正在点击[查询]按钮...")
            time.sleep(0.5)  # 稍等一下，防止下拉框还没收起

            try:
                search_btn = page.ele('css:.searchBtn .ant-btn-primary', timeout=2)

                if not search_btn:
                    search_btn = page.ele('text:查询', timeout=2)

                if search_btn:
                    search_btn.click()
                    print("     查询按钮点击成功")
                else:
                    print("     未找到查询按钮，列表可能未刷新")

            except Exception as e:
                print(f"     点击查询按钮出错: {e}")
            # ==========================================

            # 4. 等待刷新
            print("     等待列表刷新...")
            time.sleep(1.5)

            # 移开鼠标防止挡住视线
            pyautogui.moveRel(200, 0)

            # 等待表格重现
            page.wait.ele_displayed('css:tr.ant-table-row', timeout=10)
            return True
        else:
            print(f"     屏幕上没找到 [{target_text}] 的图片，请检查截图是否清晰或分辨率是否变化")
            page.run_js('document.body.click()')  # 关闭下拉框

    except Exception as e:
        print(f"     切换状态出错: {e}")

    return False


def scrape_order_details(tab, page_obj=None):
    """抓取订单详情页的扩展信息"""
    global page
    current_page = page_obj if page_obj else page
    print("     正在获取订单详细背景信息...")

    order_info = {"trip_dates": "", "flights": [], "travelers": [], "snapshot_url": "",
        "vehicle_type": "",
        "total_amount": ""}

    is_new_window = False
    order_tab = None
    view_link = None

    try:
        if not current_page: return order_info
        initial_tabs_count = current_page.tabs_count

        view_link = tab.ele('xpath://span[contains(text(), "行程方案")]/..//a[contains(text(), "查看")]', timeout=5)
        if not view_link: return order_info

        view_link.click()
        time.sleep(1)

        is_new_window = current_page.tabs_count > initial_tabs_count
        order_tab = current_page.latest_tab if is_new_window else tab

        try:
            order_tab.wait.ele_displayed('text:订单明细', timeout=8)
        except:
            pass

        # === 获取快照 URL ===
        try:
            snapshot_link = order_tab.ele('xpath://div[contains(@class, "snapshot")]//a[contains(text(), "产品快照")]',
                                          timeout=3)
            if snapshot_link:
                tabs_before = current_page.tabs_count
                snapshot_link.click()
                time.sleep(1)
                if current_page.tabs_count > tabs_before:
                    snap_tab = current_page.latest_tab
                    order_info['snapshot_url'] = snap_tab.url
                    snap_tab.close()
                else:
                    order_info['snapshot_url'] = snapshot_link.link
            else:
                order_info['snapshot_url'] = order_tab.url
        except:
            order_info['snapshot_url'] = order_tab.url

        #  抓取“等同级车”前的车型词
        try:
            # 查找包含特定文字的 div
            car_eles = order_tab.eles(
                'xpath://div[contains(@class, "tablecol-twoline") and contains(text(), "等同级车")]', timeout=2)
            vehicles = []
            for ele in car_eles:
                text = ele.text.strip()
                # 解析 "经济5座：本田CR-V..." 格式
                if "：" in text:
                    # 取冒号前的内容
                    v_type = text.split("：")[0].strip()
                    if v_type not in vehicles:
                        vehicles.append(v_type)
                elif ":" in text:  # 防御英文冒号
                    v_type = text.split(":")[0].strip()
                    if v_type not in vehicles:
                        vehicles.append(v_type)

            # 将列表转为字符串存储，或者根据需求保留列表
            order_info['vehicle_type'] = ", ".join(vehicles)
            if vehicles:
                print(f"     [抓取] 车型信息: {order_info['vehicle_type']}")
        except Exception as e:
            print(f"     [抓取] 车型获取失败: {e}")

        # === 抓取基础信息 ===
        try:
            date_ele = order_tab.ele(
                'xpath://span[contains(@class, "label") and contains(., "返回日期")]/following-sibling::span[contains(@class, "desc")]',
                timeout=1)
            if date_ele: order_info['trip_dates'] = date_ele.text.strip()
        except:
            pass

        #  抓取“总计”金额
        try:
            price_ele = order_tab.ele('css:.resource-table-footer .settlement-summary span', timeout=2)
            if price_ele:
                raw_price = price_ele.text.strip()
                order_info['total_amount'] = raw_price.replace('CNY', '').strip()
                print(f"     [抓取] 订单总计: {order_info['total_amount']}")
        except Exception as e:
            print(f"     [抓取] 金额获取失败: {e}")

        try:
            flight_section = order_tab.ele('xpath://div[@class="child-title" and contains(text(), "机票")]/..',
                                           timeout=1)
            if flight_section:
                rows = flight_section.eles('css:tbody tr')
                for row in rows:
                    cols = row.eles('tag:td')
                    if len(cols) > 4:
                        order_info['flights'].append({
                            "route": cols[0].text.replace('\n', ' '),
                            "dep_time": cols[1].text.replace('\n', ' '),
                            "arr_time": cols[2].text.replace('\n', ' '),
                            "flight_no": cols[3].text.replace('\n', ' ')
                        })
        except:
            pass

        try:
            traveler_div = order_tab.ele('#traveler_div', timeout=1)
            if traveler_div:
                try:
                    btn = traveler_div.ele('xpath:.//button[contains(., "查看") and contains(., "加密")]', timeout=1)
                    if btn: btn.click()
                except:
                    pass
                rows = traveler_div.eles('css:tbody tr')
                for row in rows:
                    cols = row.eles('tag:td')
                    if len(cols) > 9:
                        order_info['travelers'].append({
                            "name": cols[0].text.replace('\n', ' '),
                            "phone": cols[9].text.replace('\n', ' ')
                        })
        except:
            pass

    except Exception as e:
        print(f"     抓取明细出错: {e}")

    finally:
        try:
            if is_new_window and order_tab:
                order_tab.close()
            elif not is_new_window and view_link:
                order_tab.back()
                order_tab.wait.ele_displayed('text:执行模板', timeout=10)
            if current_page: current_page.activate_tab(tab.tab_id)
        except:
            pass

    return order_info


def extract_template_data(tab):
    """处理弹窗内容"""
    try:
        if tab.ele('text:当前动作子项无内容模板', timeout=0.2):
            tab.ele('text:其他模板').click()
    except:
        pass

    content_text = ""
    img_url = ""
    panel = tab.ele('css:.ant-tabs-tabpane-active')
    if not panel: panel = tab.ele('css:.ant-drawer-body')

    if panel:
        try:
            precise_text = panel.ele('xpath:.//label[@title="文字"]/../..//div[contains(@class, "input-content")]',
                                     timeout=0.2)
            if precise_text:
                content_text = precise_text.text.strip()
            else:
                txt_div = panel.ele('css:.ant-form-item-control-input-content', timeout=0.2)
                if txt_div: content_text = txt_div.text.strip()
            img = panel.ele('tag:img', timeout=0.2)
            if img: img_url = img.link
        except:
            pass

    return {"text": content_text, "image": img_url}


def process_child_page(tab, page_obj=None):
    """进入订单详情后的列表抓取"""
    print(f" 进入页面: {tab.title}")

    # 先抓取顶部的订单详情
    results = [{"order_context": scrape_order_details(tab, page_obj)}]

    try:
        tab.wait.ele_displayed('css:tr.ant-table-row', timeout=5)
    except:
        return results

    # 获取所有行
    # 注意：如果存在固定列，Ant Design 可能会渲染双倍的 tr，这里简单处理，后续通过 key 去重或查找
    all_rows = tab.eles('css:tr.ant-table-row')
    rows_count = len(all_rows)
    print(f"  -> DOM中发现 {rows_count} 个行元素 (含固定列重复项)")

    # 使用集合记录已处理过的 row-key，防止因固定列导致的重复处理
    processed_keys = set()

    for i in range(rows_count):
        try:
            # 重新获取行列表以防 DOM 变化
            current_rows = tab.eles('css:tr.ant-table-row')
            if i >= len(current_rows): break
            row = current_rows[i]

            # 获取 row-key (Ant Design 表格每行都有唯一 ID)
            row_key = row.attr('data-row-key')

            # 如果这行已经被处理过（比如左侧固定列处理了，右侧就跳过），则continue
            if row_key and row_key in processed_keys:
                continue

            # 标记该 ID 已处理
            if row_key: processed_keys.add(row_key)

            cols = row.eles('tag:td')
            # 如果这一行是个残缺的固定列（比如只有1-2列），且没有 key，可能需要跳过
            # 但我们要尝试去拿数据，所以先不强行 continue，除非完全拿不到数据

            # 尝试获取基础数据 (加 try 避免索引越界)
            action_name = "未知任务"
            score = ""
            start_time = ""
            end_time = ""

            try:
                if len(cols) > 0: action_name = cols[0].text
                if len(cols) > 1: score = cols[1].text
                if len(cols) > 6: start_time = cols[6].text
                if len(cols) > 7: end_time = cols[7].text
            except:
                pass

            print(f"  [处理行 Key={row_key}] 任务: {action_name}")

            # === [核心修改] 查找按钮 ===
            # 1. 尝试在当前 row 对象里找
            view_btn = row.ele('xpath:.//a[contains(text(), "查看模板")]', timeout=0.5)

            # 2. 如果当前 row 里没有 (常见于表格左右固定列分离的情况)，通过 row-key 全局找
            if not view_btn and row_key:
                # 逻辑：在整个 tab 页面中，寻找 data-row-key 等于当前 key，且包含“查看模板”链接的元素
                # 这样即使 row 对象是“左侧固定列”，我们也能找到“右侧固定列”里的按钮
                view_btn = tab.ele(f'xpath://tr[@data-row-key="{row_key}"]//a[contains(text(), "查看模板")]', timeout=1)

            if not view_btn:
                # 如果还是没找到，可能这行本身就不是任务行，或者是表头残留
                # print("     未找到按钮，跳过")
                continue

            # === 点击操作 ===
            # 使用 JS 点击，防止按钮被固定表头遮挡或不在视口内
            view_btn.click(by_js=True)

            # 等待弹窗出现
            try:
                tab.wait.ele_displayed('css:[aria-label="close"]', timeout=3)
            except:
                print("     弹窗超时或未响应")
                continue

            template_data = extract_template_data(tab)

            if template_data['text'] or template_data['image']:
                results.append({
                    "name": action_name,
                    "score": score,
                    "start": start_time,
                    "end": end_time,
                    "template": template_data
                })
            else:
                print("     内容为空")

            # 关闭弹窗
            close_btn = tab.ele('css:[aria-label="close"]')
            if close_btn:
                close_btn.click()
                time.sleep(0.3)
            else:
                tab.actions.type('Esc')
                time.sleep(0.2)

        except Exception as e:
            print(f"   行处理出错: {e}")
            # 尝试按一下 ESC 防止弹窗卡死
            tab.actions.type('Esc')
            time.sleep(0.5)

    return results


# def run_grab_orders():
#     """
#     自动抢单流程
#     1. 切换到“供应商客服工作台”
#     2. 查找“申请接单”按钮
#     3. 处理弹窗和验证码
#     """
#     global page
#
#     # 1. 切换标签页
#     if not switch_to_tab("供应商客服工作台"):
#         return
#
#     tab = page.latest_tab  # 获取当前激活的标签页
#
#     if not refresh_and_navigate(tab):
#         print("   ❌ 刷新导航失败，跳过本次抢单")
#         return
#
#     try:
#         # 2. 查找所有的“申请接单”按钮 (根据截图 c86b6d.png)
#         # 按钮是 <a class="mr-8">申请接单</a>
#         print("🔍 正在扫描可接单列表...")
#
#         # 刷新一下列表确保是最新的
#         # tab.refresh()
#         # time.sleep(2)
#
#         # 查找所有包含“申请接单”文字的元素
#         apply_btns = tab.eles('text:申请接单', timeout=2)
#
#         if not apply_btns:
#             print("   暂无新订单")
#             return
#
#         print(f"   发现 {len(apply_btns)} 个潜在订单，开始尝试申请...")
#
#         # 遍历每一个按钮
#         # 注意：点击一个后列表可能会刷新，所以建议每次只处理第一个，或者处理完重新获取
#         for i in range(len(apply_btns)):
#             # 重新获取按钮列表，防止DOM变化导致元素失效
#             current_btns = tab.eles('text:申请接单', timeout=2)
#             if not current_btns: break
#
#             btn = current_btns[0]  # 总是处理第一个，处理完它通常会消失或变状态
#
#             print(f"   ⚡ 点击第 {i + 1} 个申请按钮...")
#             btn.click()
#             time.sleep(1)
#
#             # 3. 处理弹窗 (根据截图 c8732d.png)
#             # 弹窗标题通常是“确认申请”或类似，按钮是“继续申请”
#             # 定位 class="ant-btn ant-btn-primary" 且包含 "继续申请"
#
#             confirm_btn = tab.ele(
#                 'xpath://div[contains(@class, "ant-modal-footer")]//span[contains(text(), "继续申请")]', timeout=3)
#
#             if confirm_btn:
#                 print("   弹窗出现，点击[继续申请]...")
#                 confirm_btn.click()  # 点击span的父级button会自动处理
#
#                 time.sleep(1)
#
#                 # 4. 处理验证码 (根据截图 c8764f.png)
#                 # 检查是否出现验证码容器
#                 if tab.ele('css:#verification-code-container', timeout=3):
#                     print("   出现滑块验证，开始破解...")
#                     if solve_captcha(tab):
#                         print("   ✅ 抢单流程完成 (验证通过)")
#                     else:
#                         print("   ❌ 验证失败")
#                         # 失败后可能需要关闭弹窗，防止阻挡后续操作
#                         close_btn = tab.ele('css:button.ant-modal-close')
#                         if close_btn: close_btn.click()
#                 else:
#                     print("   无需验证码，申请提交成功")
#             else:
#                 print("   未检测到确认弹窗，可能已直接申请或无需确认")
#
#             # 稍微等待，防止操作过快
#             time.sleep(2)
#
#     except Exception as e:
#         print(f"   抢单过程出错: {e}")

def run_crawler(target_order_id=None):
    """
    使用专门的爬虫账号(SPIDER_PORT)进行抓取
    """
    page = get_page_by_port(SPIDER_PORT)
    if not page:
        print("无法连接爬虫浏览器")
        return []

    print(f"🕷️ 爬虫启动 (端口 {SPIDER_PORT})，目标: {target_order_id if target_order_id else '所有'}")

    if not switch_to_tab(page, "行中推荐任务平台"):
        return []

    try:
        page.refresh()
        page.wait.ele_displayed('css:tr.ant-table-row', timeout=60)
    except:
        return []

    all_data = []

    # 定义内部扫描函数，闭包使用 page
    def scan_table_once():
        found_flag = False
        rows = page.eles('css:tr.ant-table-row')
        print(f"     扫描列表中 {len(rows)} 个订单...")
        for i in range(len(rows)):
            try:
                row = page.eles('css:tr.ant-table-row')[i]
                if target_order_id and target_order_id not in row.text: continue
                found_flag = True
                print(f"     找到目标订单 (第 {i + 1} 行)")

                view_btn = row.ele('text:查看')
                if view_btn:
                    view_btn.click()
                    new_tab = page.latest_tab
                    try:
                        new_tab.wait.ele_displayed('text:执行模板', timeout=10)
                        # 调用详情页处理，传入 page 对象
                        data = process_child_page(new_tab, page)
                        if data:
                            for item in data: item['origin_order_id'] = target_order_id
                            all_data.extend(data)
                    except Exception as e:
                        print(f"err: {e}")
                    finally:
                        if new_tab.tab_id != page.tab_id: new_tab.close()
                if target_order_id: return True
            except:
                pass
        return found_flag

    # if scan_table_once(): return all_data

    # 定义一个支持翻页的扫描函数
    def scan_all_pages():
        while True:
            # 1. 扫描当前页
            if scan_table_once():
                return True  # 找到了，直接返回

            # 2. 寻找“下一页”按钮 (根据截图 class 为 ant-pagination-next)
            # 注意：DrissionPage 查找元素时，如果有多个相同 class，通常返回第一个可见的
            next_btn = page.ele('css:li.ant-pagination-next', timeout=2)

            # 3. 判断是否还有下一页
            # 截图显示不可用时会有 'ant-pagination-disabled' 类名，或者 aria-disabled="true"
            if not next_btn:
                break  # 没分页条，退出

            class_val = next_btn.attr('class') or ""
            aria_val = next_btn.attr('aria-disabled')

            if 'ant-pagination-disabled' in class_val or aria_val == 'true':
                print("     已到达最后一页，停止翻页")
                break

            # 4. 翻页操作
            print("     当前页未找到，点击下一页...")
            next_btn.click()

            # 5. 等待加载 (非常重要)
            time.sleep(1.5)  # 硬等待，防止点击太快
            try:
                # 等待表格行出现，表示加载完成
                page.wait.ele_displayed('css:tr.ant-table-row', timeout=10)
            except:
                pass

        return False

    if scan_all_pages():
        return all_data

    if target_order_id:
        if toggle_order_status(page):  # 传入 page
            if scan_all_pages():
                print("     切换状态后抓取完成")
            else:
                print(f"     彻底未找到: {target_order_id}")
        else:
            print("     无法切换状态")

    return all_data


if __name__ == "__main__":
    pass