# browser_launcher.py
from DrissionPage import ChromiumOptions, ChromiumPage
import os

# 定义每个账号的配置
# key 是名字，port 是端口，path 是用户数据存放文件夹(会自动创建)
CONFIGS = [
    {"name": "行中推荐任务平台", "port": 9222, "path": "User_Spider", "url": "https://vbooking.ctrip.com/ttl_vendor/recommendAction"},
    {"name": "供应商_账号A", "port": 9333, "path": "User_Supplier_A", "url": "https://vbooking.ctrip.com/vbk/im/notice?currentTab=BC&initChat=3&locale=zh-CN&accountsource=vbk&disNotificationBiztype=118"},
    {"name": "供应商_账号B", "port": 9444, "path": "User_Supplier_B", "url": "https://vbooking.ctrip.com/vbk/im/notice?currentTab=BC&initChat=3&locale=zh-CN&accountsource=vbk&disNotificationBiztype=118"},
    {"name": "供应商_账号C", "port": 9555, "path": "User_Supplier_C", "url": "https://vbooking.ctrip.com/vbk/im/notice?currentTab=BC&initChat=3&locale=zh-CN&accountsource=vbk&disNotificationBiztype=118"},
]


def launch_browsers():
    base_dir = os.path.join(os.getcwd(), "browser_profiles")
    if not os.path.exists(base_dir):
        os.makedirs(base_dir)

    for cfg in CONFIGS:
        print(f"正在启动: {cfg['name']} (端口 {cfg['port']})...")

        co = ChromiumOptions()
        # 设置完全独立的用户数据目录
        user_data_path = os.path.join(base_dir, cfg['path'])
        co.set_user_data_path(user_data_path)
        # 设置独立的端口
        co.set_local_port(cfg['port'])
        co.set_argument('--ignore-certificate-errors')

        # 启动浏览器 (只启动，不接管)
        # DrissionPage 只要实例化并访问一次，浏览器就会启动
        try:
            # 创建时会自动打开浏览器窗口
            page = ChromiumPage(addr_or_opts=co)
            target_url = cfg.get("url", "about:blank")
            print(f"  -> 打开网页: {target_url}")
            page.get(target_url)
            print(f"  -> {cfg['name']} 启动成功！请在此窗口完成登录。")
        except Exception as e:
            print(f"  -> 启动失败: {e}")

    print("\n所有浏览器已启动。请手动登录各个账号，登录后保持窗口开启，然后运行主程序 agent_main.py")


if __name__ == "__main__":
    launch_browsers()