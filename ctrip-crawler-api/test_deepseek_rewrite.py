import os
import json
import copy
from openai import OpenAI

# ================= 配置区域 =================
# 建议把 Key 放在环境变量中，或者暂时硬编码在这里测试
# 去 https://www.deepseek.com/ 申请 Key
DEEPSEEK_API_KEY = "sk-b2fba8b49bea419bbc24a4e4f9c2b697"
BASE_URL = "https://api.deepseek.com"

client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=BASE_URL)

# ================= 模拟爬虫爬取到的原始数据 (参考你的 parse_ctrip_content_v3 输出) =================
MOCK_ITINERARY_DATA = {
    "product_info": {
        "title": "8日行程",
        "duration": "8天"
    },
    "itinerary": [
        {
            "day": 1,
            "day_title": "抵达拉萨-接机-入住酒店",
            "activities": [
                {
                    "elementType": "transport",
                    "title": "交通",
                    "elementData": {
                        "content": "各地乘机抵达拉萨，抵达后专车司机接机（不指定车型），送至酒店做适应性休息；如需闲逛可搭乘公交车（1元/次）、出租车（起步价10元）；当天没有行程，但对于初次进藏的大家来说很关键。"
                    }
                },
                {
                    "elementType": "scenic",
                    "title": "景点",
                    "elementData": {
                        "content": "前往：布达拉宫广场(无需门票)。布达拉宫广场是世界上海拔最高的城市广场。广场上有西藏和平解放纪念碑。"
                    }
                }
            ]
        }
    ]
}


# ================= 核心改写逻辑 =================

def extract_text_nodes(data, path=None, nodes=None):
    """
    递归提取需要改写的文本节点（content, remark, day_title）
    """
    if path is None:
        path = []
    if nodes is None:
        nodes = []

    if isinstance(data, dict):
        for key, value in data.items():
            current_path = path + [key]

            # 定义需要改写的字段 Key
            if key in ['content', 'remark', 'day_title', 'title'] and isinstance(value, str) and len(value) > 5:
                # 过滤掉太短的文本，只改写有意义的句子
                nodes.append({
                    "id": json.dumps(current_path),  # 用路径作为ID
                    "original": value
                })

            if isinstance(value, (dict, list)):
                extract_text_nodes(value, current_path, nodes)

    elif isinstance(data, list):
        for index, item in enumerate(data):
            current_path = path + [index]
            extract_text_nodes(item, current_path, nodes)

    return nodes


def set_value_by_path(data, path_str, value):
    """
    根据路径更新 JSON 数据
    """
    path = json.loads(path_str)
    current = data
    for key in path[:-1]:
        current = current[key]
    current[path[-1]] = value


def deepseek_rewrite(data):
    """
    调用 DeepSeek 进行改写
    """
    # 1. 提取所有需要改写的文本
    nodes = extract_text_nodes(data)

    if not nodes:
        print("⚠️ 没有发现需要改写的内容")
        return data

    print(f"🔍 提取到 {len(nodes)} 个文本段落，准备发送给 DeepSeek...")

    # 2. 构建 Prompt
    # 我们构建一个 JSON 列表发给 AI，要求它只返回改写后的 JSON 列表
    prompt_content = json.dumps(nodes, ensure_ascii=False)

    system_prompt = """
    你是一个资深的旅游文案策划专家。
    你的任务是润色和改写用户提供的旅游行程描述，让每个小段落与原文稍有不同，但保留原意、事实、数据、和语气氛围。
    不要修改地点、时间等数据。

    要求：
    1. **语气风格**：吸引人、温暖、专业、带有画面感（种草风格）。
    2. **准确性**：绝对保留原始数据（时间、地点、价格、公里数）不变。
    3. **去重**：不要机械重复原话，用更优美的词汇重组。
    4. **格式**：必须返回标准的 JSON 格式，不要包含 Markdown 代码块标记（如 ```json）。
    5. **结构**：返回一个列表，包含对象 {"id": "原ID", "rewritten": "改写后的文本"}。
    """

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"请改写以下 JSON 数据中的 original 字段：\n{prompt_content}"}
            ],
            stream=False,
            temperature=1.3  # 稍微高一点的温度，让文案更灵活
        )

        result_text = response.choices[0].message.content
        # 清理可能存在的 markdown 标记
        result_text = result_text.replace("```json", "").replace("```", "")

        rewritten_list = json.loads(result_text)

        # 3. 将改写后的内容回填到原数据中
        new_data = copy.deepcopy(data)

        for item in rewritten_list:
            path_id = item.get("id")
            new_text = item.get("rewritten")

            # 找到对应的原文本进行对比打印（测试用）
            original_node = next((n for n in nodes if n["id"] == path_id), None)
            if original_node:
                print("-" * 40)
                print(f"🔴 原文: {original_node['original']}")
                print(f"🟢 改写: {new_text}")

                # 更新数据
                set_value_by_path(new_data, path_id, new_text)

        return new_data

    except Exception as e:
        print(f"❌ DeepSeek 调用失败: {e}")
        return data


# ================= 执行测试 =================
if __name__ == "__main__":
    print("🚀 开始 DeepSeek 改写测试...")

    # 这里可以替换为你 ctrip_itinerary_crawler.py 实际生成的 json 文件内容
    rewritten_data = deepseek_rewrite(MOCK_ITINERARY_DATA)

    print("=" * 50)
    print("✅ 最终数据结构 (部分预览):")
    print(json.dumps(rewritten_data, ensure_ascii=False, indent=2))

    # 实际使用时，你只需要把这个逻辑集成到 ctrip_itinerary_crawler.py 的返回处即可