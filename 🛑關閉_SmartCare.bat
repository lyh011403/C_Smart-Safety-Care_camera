@echo off
chcp 65001 >nul
title Smart Safety Care 關閉系統

echo ========================================
echo   關閉 Smart Safety Care App 與攝影機
echo ========================================

echo.
echo 正在停止前端網頁伺服器 (node.exe)...
start "" /b taskkill /F /IM node.exe /T >nul 2>&1
start "" /b taskkill /F /FI "WINDOWTITLE eq React Frontend*" /T >nul 2>&1

echo.
echo 正在停止影像辨識與串流伺服器 (python.exe)...
start "" /b taskkill /F /IM python.exe /T >nul 2>&1
start "" /b taskkill /F /FI "WINDOWTITLE eq AI Camera Server*" /T >nul 2>&1

echo.
echo ----------------------------------------
echo 系統已完全關閉，攝影機已釋放！
echo ----------------------------------------
timeout /t 3 >nul
exit
