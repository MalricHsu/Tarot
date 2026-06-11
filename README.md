# 燭見 - 塔羅占卜

燭見是一個 React + Vite 的線上塔羅占卜應用。使用者輸入問題、選擇牌陣並抽牌後，前端會透過 Vercel Function 呼叫 Gemini 產生解讀；如果 Gemini 暫時不可用，畫面會改用本地牌義 fallback，不會空白卡住。

## 功能

- 沉浸式塔羅抽牌互動
- 三張指引與五張深入指引牌陣
- Gemini 產生神諭式解讀
- 賢者解析補充白話行動建議
- 複製解讀文字與下載分享圖
- Gemini 失敗時自動改用本地解讀

## 架構

- 前端：React + TypeScript + Vite
- 後端代理：Vercel Function `POST /api/gemini`
- AI SDK：`@google/genai`
- API key：只放在 Vercel Environment Variable `GEMINI_API_KEY`

朋友打開 Vercel 網址即可使用，不需要輸入 Gemini API key。前端不會讀取 `localStorage.GEMINI_API_KEY`，也不會把 key 放進 request body。

## 本地開發

安裝依賴：

```bash
npm install
```

執行前端開發伺服器：

```bash
npm run dev
```

若要在本機測試 `/api/gemini`，建議使用 Vercel CLI，並在本機環境設定 `GEMINI_API_KEY`：

```bash
vercel dev
```

## 部署到 Vercel

1. 將專案匯入 Vercel。
2. 在 Vercel 專案的 Environment Variables 新增：

```text
GEMINI_API_KEY=你的 Gemini API key
```

3. Build Command 使用：

```bash
npm run build
```

4. Output Directory 使用：

```text
dist
```

正式部署不使用 GitHub Pages，因為 GitHub Pages 無法安全執行 server-side Gemini 代理。

## 驗證

```bash
npm run test
npm run build
```
