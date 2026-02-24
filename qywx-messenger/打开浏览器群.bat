@echo off
:: 切换到脚本所在的 E 盘目录
cd /d "E:\RPA"

:: 设置窗口标题
title 初始化浏览器集群

echo ========================================================
echo 正在启动浏览器集群 (Browser Launcher)...
echo 请确保 Chrome 已关闭，避免端口冲突
echo ========================================================

:: 运行 Python 浏览器启动脚本
python browser_launcher.py

echo.
echo 浏览器启动完毕。
pause