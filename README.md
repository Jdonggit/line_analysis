# Line Analysis

## Security & Privacy
This application runs entirely in your browser.
- **API Keys**: Your OpenAI API key is stored locally in your browser's `localStorage`. It is sent directly to OpenAI's servers and is **never** sent to any other server.
- **Data Privacy**: Your chat data and analysis results remain on your device.

這是一個基於 Vue 3 開發的純前端網頁應用程式，用於分析 Line 聊天記錄的文字檔。提供訊息統計、貼圖排行、活躍時段分析，以及整合 OpenAI 的 AI 語意分析功能。

> [!IMPORTANT]
> **隱私權與安全性聲明 (Privacy & Security)**
> *   **不儲存任何數據**：本應用程式採 **100% Client-Side (純客戶端)** 架構。所有的檔案解析、數據統計皆在您的瀏覽器內完成。
> *   **無伺服器上傳**：您的聊天記錄檔 (`.txt`) **絕不會** 上傳至任何伺服器或第三方資料庫。
> *   **API Key 安全**：OpenAI API Key 僅儲存於您個人的瀏覽器 LocalStorage 中，並直接與 OpenAI 官方伺服器連線，不經過任何中介。

## ✨ 主要功能

*   **📊 數據儀表板**
    *   **訊息排行**：統計誰最愛聊天 (Top Talkers)。
    *   **貼圖王**：統計每個人發送貼圖的數量 (支援 `[貼圖]`, `[圖片]` 等標籤)。
    *   **活躍時段**：24小時熱力圖，分析哪個時段大家最活躍。
*   **🔍 進階篩選**
    *   **日期區間**：選擇特定日期的對話。
    *   **時段過濾**：可過濾每日特定時段 (例如只看上班時間 09:00 - 18:00 的訊息)。
*   **🤖 AI 語意分析** (需自備 OpenAI API Key)
    *   **自訂提問**：用自然語言問 AI (例如：「這週的重點是什麼？」、「誰比較不耐煩？」)。
    *   **模型切換**：支援 GPT-4o, GPT-4o-mini, GPT-3.5-turbo。
    *   **隱私保護**：僅在使用 AI 分析時，將您篩選後的「最後 200 則訊息」發送至 OpenAI 進行分析。

## 🛠️ 技術棧

*   [Vue 3](https://vuejs.org/) (Composition API)
*   [Vite](https://vitejs.dev/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [Pinia](https://pinia.vuejs.org/) (State Management)
*   [Chart.js](https://www.chartjs.org/) / vue-chartjs

### 使用 Docker 部署 (推薦)

如果您有安裝 Docker 與 Docker Compose，這是最快速的執行方式：

```bash
# 啟動服務
docker-compose up -d --build

# 停止服務
docker-compose down
```
啟動後請訪問 `http://localhost:8080`。

### 傳統手動方式

#### 安裝依賴
```bash
npm install
```

#### 啟動開發伺服器
```bash
npm run dev
# 瀏覽器打開 http://localhost:5173
```

#### 建置生產版本
```bash
npm run build
# 產生的 dist/ 資料夾可直接部署至任何靜態網站託管服務 (如 GitHub Pages, Vercel, Netlify)
```

## 📖 使用教學

1.  **匯出聊天記錄**：
    *   在手機版 Line 進入聊天室 -> 右上角選單 -> 設定 -> 匯出聊天記錄 -> 存為文字檔。
2.  **上傳檔案**：
    *   將 `.txt` 檔案拖曳至網頁的上傳區塊。
3.  **開始分析**：
    *   瀏覽統計圖表。
    *   拖曳時間軸過濾器查看特定時段。

---
**License**: MIT
