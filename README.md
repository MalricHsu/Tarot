# 燭見 — 線上塔羅占卜

一款以 React + Vite 打造的沉浸式塔羅占卜 Web App。輸入問題、選擇牌陣、抽牌，由 Gemini AI 生成神諭式解讀；Gemini 不可用時自動切換本地牌義，體驗不中斷。

## 功能

| 功能 | 說明 |
|------|------|
| 🃏 沉浸式抽牌 | 動態翻牌互動，支援正逆位 |
| 🔮 多種牌陣 | 三張指引牌陣 / 五張深入牌陣 |
| ✨ AI 解讀 | Gemini 生成神諭式解讀 + 賢者白話行動建議 |
| 📖 牌庫瀏覽 | 78 張大小阿爾克那完整牌義查詢 |
| 📅 每日一牌 | 每天一張牌的靜心提示 |
| 📜 占卜記錄 | 本地保存歷史解讀 |
| 📤 分享功能 | 複製解讀文字或下載分享圖 |
| 🔄 Fallback | Gemini 失敗時自動切換本地解讀，不空白卡住 |

## 技術架構

```
前端：React 19 + TypeScript + Vite 7
路由：React Router DOM 7
UI：  Lucide React + 純 CSS（無 UI 框架）
後端：Vercel Function（/api/gemini）
AI：  Google Gemini（@google/genai）
部署：Vercel
```

朋友只需打開 Vercel 網址即可使用，**不需要輸入任何 API key**。  
Gemini API key 僅存放於 Vercel 環境變數，不會出現在前端程式碼或請求內容中。

## 頁面路由

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/` | DivinationPage | 主占卜頁面 |
| `/daily` | DailyPage | 每日一牌 |
| `/library` | LibraryPage | 牌義牌庫 |
| `/history` | HistoryPage | 占卜記錄 |
| `/settings` | SettingsPage | 設定 |

## 本地開發

### 安裝依賴

```bash
npm install
```

### 只測前端（不測 Gemini API）

```bash
npm run dev
```

前端開發伺服器啟動後，`/api/gemini` 預期會失敗，畫面會顯示本地 fallback 解讀。  
這**不代表** Vercel 上線後 Gemini 一定失敗。

測試重點：
- 抽牌流程是否正常
- 每張牌是否有「牌面描述」「牌義」「本地解讀」
- Gemini 失敗時是否顯示 fallback 而非空白

### 同時測前端 + Vercel Function

```bash
npm run dev:vercel
```

需要在本機環境設定 `GEMINI_API_KEY`（可放在 `.env` 檔）。  
此模式才能完整測試 Gemini 解讀流程。

## 部署到 Vercel

1. 將此 repo 匯入 Vercel。
2. 在 Vercel 專案的 **Environment Variables** 新增：
   ```
   GEMINI_API_KEY=你的_Gemini_API_key
   ```
3. Build Command：
   ```bash
   npm run build
   ```
4. Output Directory：
   ```
   dist
   ```
5. 部署後，修改或新增環境變數時需**重新部署**才會生效。

> **注意**：正式部署使用 Vercel，不使用 GitHub Pages。  
> GitHub Pages 為純靜態環境，無法安全執行 server-side Gemini 代理。

## 驗證 Gemini Key 是否正確部署

部署後可呼叫健康檢查端點：

```bash
curl https://你的網域/api/gemini-health
```

| 回應 | 說明 |
|------|------|
| `{ "configured": true }` | 環境變數已設定 |
| `{ "configured": false, "error": "..." }` | 環境變數未設定 |

> 此端點只確認「key 是否存在」，不實際呼叫 Gemini，不消耗配額。  
> 若 key 存在但解讀仍失敗，請檢查 key 有效性、權限或配額。

## 測試與建置

```bash
# 執行單元測試
npm run test

# 建置生產版本
npm run build
```
