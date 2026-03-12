# Smart Safety Care App (Smart Guard)

這是一個基於 AI 與移動端整合的智慧安全監控系統。

## 🚀 核心功能
- **即時 AI 辨識**：使用 YOLOv8 進行人體與危險品偵測。
- **手機鏡頭支援**：可切換使用手機原生鏡頭作為監控來源。
- **危險評估引擎**：動態計算物體距離與危險程度，並發送 Webhook 警報。
- **Modern UI**：使用 React + Framer Motion 打造的高質感玻璃擬態介面。

## 📦 結構說明
- `video/`: AI 核心與串流伺服器 (Python)。
- `src/`: 前端 React 原始碼。
- `android/`: Capacitor Android 原生專案。
- `video/models/`: 優化後的 AI 模型檔 (FP16, TFLite)。

## 🛠️ 如何啟動
1. 確保已安裝 Node.js 與 Python 環境。
2. 點擊 `▶️啟動_SmartCare.bat` 自動執行前端與 AI 伺服器。
3. 系統將自動開啟 `http://localhost:5173`。

## 🔧 環境設定
- **Python 依賴**：`pip install -r video/requirements.txt`
- **Node 依賴**：`npm install`

---
*Original project designed in Figma.*