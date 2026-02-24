import pyautogui
import os

print("--------------------------------------------------")
print(f"PyAutoGUI 版本: {pyautogui.__version__}")

try:
    import cv2
    print(f"OpenCV 版本: {cv2.__version__}")
    print("OpenCV 已安装，模糊匹配功能可用。")
except ImportError:
    print("OpenCV 未安装！confidence 参数将失效，强制变为精确匹配。")
    print("请运行: pip install opencv-python")

print("--------------------------------------------------")

print("📸 正在截取全屏，请保存为 'debug_screen.png'...")
try:
    img = pyautogui.screenshot()
    img.save("debug_screen.png")
    print("截图成功！请在文件夹里打开 'debug_screen.png' 查看。")
    print("重点检查：截图里包含'多开神器'窗口吗？清晰吗？")
except Exception as e:
    print(f"截图失败: {e}")

print("--------------------------------------------------")