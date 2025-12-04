from DrissionPage import ChromiumPage
import time

# 全局变量占位
page = None


def scrape_order_details(tab):
    """
    [修复版v3] 抓取订单详情页的扩展信息
    修复: 'Chromium' object has no attribute 'tabs'
    优化: 全局异常捕获，防止卡在详情页
    """
    global page  # 关键：引用全局 page 对象来获取标签页信息

    print("    🚀 正在获取订单详细背景信息...")

    order_info = {
        "trip_dates": "",
        "flights": [],
        "travelers": []
    }

    # 变量初始化，放在 try 外面防止 finally 访问报错
    is_new_window = False
    order_tab = None
    view_link = None

    try:
        if not page:
            print("    ⚠️ 全局 Page 对象未初始化")
            return order_info

        # === 1. 记录点击前的状态 ===
        main_tab_id = tab.tab_id
        # 使用 page.tabs_count 而不是 tab.browser.tabs
        initial_tabs_count = page.tabs_count

        # 定位查看按钮
        view_link = tab.ele('xpath://span[contains(text(), "行程方案")]/..//a[contains(text(), "查看")]', timeout=8)

        if not view_link:
            print("    ⚠️ 未找到订单明细入口，跳过背景抓取")
            return order_info

        # 点击按钮
        view_link.click()
        time.sleep(1)  # 给浏览器一点反应时间

        # === 2. 判断页面去向 ===
        current_tabs_count = page.tabs_count
        is_new_window = current_tabs_count > initial_tabs_count

        if is_new_window:
            # A. 打开了新标签页 -> 切换控制权到最新标签页
            order_tab = page.latest_tab
        else:
            # B. 当前页跳转 -> 控制权还在当前 tab
            order_tab = tab

        # 智能等待标题出现
        try:
            # 等待“订单明细”几个字出现，最长等 8 秒
            order_tab.wait.ele_displayed('text:订单明细', timeout=8)
        except:
            print("    ⚠️ 订单明细页加载超时，尝试强行抓取...")

        # === 深入获取“产品快照”页面的 URL ===
        try:
            print("    📸 正在寻找并进入产品快照页面...")
            # 定位“产品快照”链接 (根据你的截图，它是 class="snapshot" 下的 a 标签)
            snapshot_link = order_tab.ele(
                'xpath://div[contains(@class, "snapshot")]//a[contains(text(), "产品快照")]', timeout=3)

            if snapshot_link:
                # 记录当前的标签页数量
                tabs_before_snap = page.tabs_count
                snapshot_link.click()
                time.sleep(1)  # 等待浏览器响应

                # 判断是否打开了新标签页
                if page.tabs_count > tabs_before_snap:
                    # 切换到最新的快照页
                    snap_tab = page.latest_tab
                    # 等待加载完成 (可选，只要URL对了就行)
                    time.sleep(0.5)

                    # 拿到真正的 URL
                    order_info['snapshot_url'] = snap_tab.url
                    print(f"    🔗 成功获取快照链接: {order_info['snapshot_url']}")

                    # 拿完就关，保持整洁
                    snap_tab.close()
                else:
                    # 如果没有打开新窗口(极少见)，尝试直接读取 href
                    order_info['snapshot_url'] = snapshot_link.link
                    print(f"    🔗 获取快照链接(Href): {order_info['snapshot_url']}")
            else:
                print("    ⚠️ 未找到‘产品快照’按钮，将使用当前页URL兜底")
                order_info['snapshot_url'] = order_tab.url
        except Exception as e:
            print(f"    ⚠️ 获取快照链接流程出错: {e}")
            # 出错也用当前页兜底
            if not order_info['snapshot_url']:
                order_info['snapshot_url'] = order_tab.url

        # === 3. 开始抓取数据 ===

        # A. 抓取出发/返回日期
        try:
            date_ele = order_tab.ele(
                'xpath://span[contains(@class, "label") and contains(., "返回日期")]/following-sibling::span[contains(@class, "desc")]',
                timeout=1)
            if date_ele:
                order_info['trip_dates'] = date_ele.text.strip()
                print(f"    📅 日期: {order_info['trip_dates']}")
        except:
            pass

        # B. 抓取机票信息
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
                print(f"    ✈️  航班: {len(order_info['flights'])} 条")
        except:
            pass

        # C. 抓取出行人信息
        try:
            traveler_div = order_tab.ele('#traveler_div', timeout=1)
            if traveler_div:
                # 1. 尝试点击“查看加密信息”按钮
                try:
                    encrypt_btn = traveler_div.ele('xpath:.//button[contains(., "查看") and contains(., "加密")]',
                                                   timeout=1)
                    if encrypt_btn:
                        encrypt_btn.click()
                        time.sleep(0.5)
                except:
                    pass

                # 2. 遍历表格
                rows = traveler_div.eles('css:tbody tr')
                for row in rows:
                    cols = row.eles('tag:td')
                    if len(cols) > 9:
                        order_info['travelers'].append({
                            "name": cols[0].text.replace('\n', ' '),
                            "gender_type": cols[1].text.replace('\n', ' '),
                            "birthday": cols[2].text,
                            "country": cols[4].text,
                            "id_info": cols[5].text.replace('\n', ' '),
                            "room_share": cols[8].text.replace('\n', ' '),
                            "phone": cols[9].text.replace('\n', ' ')
                        })
                print(f"    👥 出行人: {len(order_info['travelers'])} 人")
        except:
            pass

    except Exception as e:
        print(f"    ⚠️ 抓取明细出错: {e}")

    finally:
        # === 4. 关键：清理现场，恢复到列表页 ===
        # 无论上面是否报错，这里都会执行
        try:
            if is_new_window and order_tab:
                # 如果是新窗口，关闭它
                order_tab.close()
            elif not is_new_window and view_link:
                # 如果是跳转，必须回退
                order_tab.back()
                # 必须等待原来的页面加载回来
                order_tab.wait.ele_displayed('text:执行模板', timeout=10)

            # 确保主页面处于激活状态
            if tab and page:
                page.activate_tab(tab.tab_id)

        except Exception as e:
            print(f"    ⚠️ 页面恢复失败: {e}")

    return order_info


def process_child_page(tab):
    """
    处理子页面（详情页）的逻辑
    """
    print(f"📄 正在处理订单页面: {tab.title}")

    # 等待页面加载
    try:
        tab.wait.ele_displayed('css:tr.ant-table-row', timeout=8)
    except:
        print("    ⚠️ 任务表格加载超时")
        return []

    results = []

    # === STEP 1: 抓取订单背景信息 (只抓一次) ===
    # 这一步可能会跳转页面再回来，所以放在最前面
    order_context = scrape_order_details(tab)

    # 按照你的要求，作为列表的第一项放入
    results.append({"order_context": order_context})
    # ==========================================

    # 再次确认表格存在 (防止刚才页面跳转回来后 DOM 丢失)
    try:
        tab.wait.ele_displayed('css:tr.ant-table-row', timeout=5)
    except:
        print("    ⚠️ 页面未恢复，无法获取任务列表")
        return results

    rows_count = len(tab.eles('css:tr.ant-table-row'))
    print(f"  -> 表格中共有 {rows_count} 行任务")

    for i in range(rows_count):
        try:
            # 动态获取当前行
            current_rows = tab.eles('css:tr.ant-table-row')
            if i >= len(current_rows): break
            row = current_rows[i]

            cols = row.eles('tag:td')
            if len(cols) < 7: continue

            status_text = cols[2].text
            if "未执行" not in status_text:
                continue

            action_name = cols[0].text
            start_time = cols[4].text
            end_time = cols[5].text

            print(f"  ⚡ [第{i + 1}行] 抓取: {action_name}")

            view_btn = cols[6].ele('tag:a')
            if not view_btn: continue

            view_btn.click()

            # 等待弹窗出现 (快速检测)
            try:
                tab.wait.ele_displayed('css:[aria-label="close"]', timeout=3)
            except:
                print("    ⚠️ 弹窗超时，跳过")
                continue

            template_data = extract_template_data(tab)

            if template_data['text'] or template_data['image']:
                results.append({
                    "name": action_name,
                    "start": start_time,
                    "end": end_time,
                    "template": template_data
                })
            else:
                print("    ⚠️ 内容为空")

            # 关闭弹窗
            close_btn = tab.ele('css:[aria-label="close"]')
            if close_btn:
                close_btn.click()
                time.sleep(0.3)
            else:
                tab.actions.type('Esc')
                time.sleep(0.2)

        except Exception as e:
            print(f"  ❌ 第 {i + 1} 行处理出错: {e}")
            tab.actions.type('Esc')
            time.sleep(0.5)

    return results


def extract_template_data(tab):
    """
    处理弹窗内部逻辑
    """
    try:
        if tab.ele('text:当前动作子项无内容模板', timeout=0.1):
            tab.ele('text:其他模板').click()
            time.sleep(0.2)
    except:
        pass

    current_panel = tab.ele('css:.ant-tabs-tabpane-active')
    if not current_panel:
        current_panel = tab.ele('css:.ant-drawer-body')

    content_text = ""
    img_url = ""

    if current_panel:
        try:
            text_container = current_panel.ele('css:.ant-form-item-control-input-content', timeout=0.5)
            if text_container:
                precise_text = current_panel.ele(
                    'xpath:.//label[@title="文字"]/../..//div[contains(@class, "input-content")]', timeout=0.2)
                if precise_text:
                    content_text = precise_text.text.strip()
                else:
                    content_text = text_container.text.strip()

            img_ele = current_panel.ele('tag:img', timeout=0.5)
            if img_ele:
                img_url = img_ele.link
        except:
            pass

    return {
        "text": content_text,
        "image": img_url
    }


def run_crawler(target_order_id=None):
    global page
    print(f"🕷️ 爬虫启动，目标订单: {target_order_id if target_order_id else '所有'}")

    if page is None:
        try:
            page = ChromiumPage(addr_or_opts=9222)
            page.set.timeouts(10)
        except Exception as e:
            print(f"    ❌ 无法连接浏览器: {e}")
            return []

    if page:
        try:
            page.run_js('window.focus()')
        except:
            pass

    try:
        print("    🔄 正在刷新页面以获取最新数据...")
        page.refresh()
        time.sleep(2)
    except Exception as e:
        print(f"    ⚠️ 刷新失败: {e}")

    print("    ⏳ 检查页面状态...")
    try:
        if not page.ele('css:tr.ant-table-row'):
            print("    ⚠️ 未检测到表格，等待页面加载 (最长60秒)...")
            page.wait.ele_displayed('css:tr.ant-table-row', timeout=60)
            print("    ✅ 页面就绪")
    except:
        print("    ❌ 等待超时，请确认已登录并处于列表页")
        return []

    all_data = []
    parent_rows = page.eles('css:tr.ant-table-row')
    print(f"    🔍 列表页扫描到 {len(parent_rows)} 行")

    for i in range(len(parent_rows)):
        try:
            current_row = page.eles('css:tr.ant-table-row')[i]

            if target_order_id:
                if target_order_id not in current_row.text:
                    continue

            view_btn = current_row.ele('text:查看')
            if not view_btn: continue

            print(f"    👉 进入订单推荐页 (行 {i + 1})")
            view_btn.click()

            new_tab = page.latest_tab
            try:
                new_tab.wait.ele_displayed('text:执行模板', timeout=8)
            except:
                print("    ⚠️ 详情页加载慢，尝试继续...")
                time.sleep(2)

            # === 抓取子页面数据 ===
            order_data = process_child_page(new_tab)

            if order_data:
                # 注入来源订单号 (跳过第一项 context)
                for index, item in enumerate(order_data):
                    # 如果是 context 项，也加上方便追溯
                    if "order_context" in item:
                        item['origin_order_id'] = target_order_id
                    else:
                        item['origin_order_id'] = target_order_id

                all_data.extend(order_data)
                print(f"    ✅ 抓取完成: 包含 {len(order_data) - 1} 条任务")
            else:
                print("    ⚠️ 无有效数据")

            if new_tab.tab_id != page.tab_id:
                new_tab.close()

            if target_order_id:
                break

        except Exception as e:
            print(f"    ⚠️ 主循环异常: {e}")
            if page.tabs_count > 1: page.latest_tab.close()

    return all_data


if __name__ == "__main__":
    print(run_crawler())