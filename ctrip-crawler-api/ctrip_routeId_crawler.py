import asyncio
import re
from datetime import datetime
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode


def extract_route_ids_from_html(html_content, url=""):
    """
    从HTML内容中提取所有的 multiRouteId_xxxxxxxx 的id
    """
    # print(html_content)
    print("🎯 开始从HTML中提取 route IDs...")

    # 尝试从URL中解析product_id
    product_id_match = re.search(r'productid=(\d+)', url, re.IGNORECASE)
    product_id = product_id_match.group(1) if product_id_match else ""

    # 定义正则表达式
    route_id_pattern = re.compile(r'multiRouteId_(\d+)')

    # 查找所有匹配的ID
    # S使用 set 来自动去重
    route_ids = set(route_id_pattern.findall(html_content))

    # 转换为列表
    route_ids_list = list(route_ids)

    print(f"✅ 提取完成！共找到 {len(route_ids_list)} 个不重复的 Route ID。")

    a_route_pattern = re.compile(
        # 1. 查找ID并捕获
        r'multiRouteId_(\d+)'
        # 2. 非贪婪地匹配所有中间内容
        r'.*?'
        # 3. 匹配那个包含 "A线" 描述的span标签
        r'<span class="[^"]*MultiRouteDescription_New[^"]*"[^>]*>'
        # 4. 匹配标签后的任何空格（包括换行符）
        r'\s*'
        # 5. 匹配以 "A线" 开头的文本
        r'A线',
        re.DOTALL | re.IGNORECASE  # re.DOTALL (让.匹配换行符)至关重要
    )

    a_route_match = a_route_pattern.search(html_content)
    a_route_id = a_route_match.group(1) if a_route_match else route_ids_list[0]

    if a_route_id:
        print(f"✅ 成功匹配到 A线 ID: {a_route_id}")
    else:
        print("⚠️ 未能匹配到 A线 ID。")

    # 返回结构化数据
    return {
        "product_id": product_id,
        "A_route_id": a_route_id,
        "route_ids": route_ids_list,
        "metadata": {
            "extracted_at": datetime.now().isoformat(),
            "source_url": url
        }
    }


async def crawl_and_extract_route_ids(url):
    """
    爬取携程商品详情页面并提取所有 multiRouteId
    """
    print(f"🚀 开始爬取携程详情页面 (HTML模式): {url}")

    browser_config = BrowserConfig(
        headless=True,
        extra_args=['--disable-web-security', '--no-sandbox'],
    )

    # 只需要原始HTML，不需要复杂的JS滚动，所以配置一个快速加载
    crawl_config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        page_timeout=30000,
        delay_before_return_html=3.0,  # 等待3秒让基础JS加载
        scan_full_page=False  # 不需要完整扫描
    )

    async with AsyncWebCrawler(config=browser_config) as crawler:
        try:
            print("📱 正在加载页面...")
            result = await crawler.arun(url=url, config=crawl_config)

            # 注意：我们这里使用的是 result.html，而不是 result.markdown
            if result.success and result.html:
                print("✅ 页面HTML爬取成功！")
                structured_data = extract_route_ids_from_html(result.html, url)
                return {"success": True, "data": structured_data}
            else:
                print(f"❌ 页面HTML爬取失败: {result.error_message}")
                return {"success": False, "error": f"爬取失败: {result.error_message}"}

        except Exception as e:
            print(f"💥 爬取过程中发生异常: {str(e)}")
            return {"success": False, "error": f"发生异常: {str(e)}"}


# --- 用于独立测试 ---
async def main():
    """
    主函数 - 测试爬虫功能
    """
    # 使用和 detail_crawler 相同的测试ID
    test_url = "https://m.ctrip.com/webapp/xtour/detail?rv=1&productid=61162192&productId=61162192&isRedirect=tour_h5"

    print("🎯 携程 Route ID 爬虫测试开始")
    print("=" * 50)

    result = await crawl_and_extract_route_ids(test_url)

    if result and result.get("success"):
        print("\n🎉 爬取测试完成！")
        print("=" * 50)
        print("📋 数据摘要:")
        print(f"   商品ID: {result['data'].get('product_id', 'N/A')}")
        print(f"   Route IDs: {result['data'].get('route_ids', [])}")
    else:
        print(f"\n❌ 爬取测试失败: {result.get('error')}")


if __name__ == "__main__":
    asyncio.run(main())