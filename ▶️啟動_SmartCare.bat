@echo off
chcp 65001 >nul
title Smart Safety Care 啟動系統

echo ========================================
echo   啟動 Smart Safety Care App (AI 監控系統)
echo ========================================

echo.
echo [1/2] 載入 前端監控網頁伺服器...
cd /d "%~dp0"
start "React Frontend" cmd /c "npm run dev"

echo.
echo [2/2] 載入 AI 影像辨識與串流伺服器...
cd /d "%~dp0video"
start "AI Camera Server" cmd /k "..\.venv\Scripts\python stream_server.py"

echo.
echo 系統已啟動！5 秒後為您自動開啟瀏覽器...
timeout /t 5 >nul
start http://localhost:5173

exit
