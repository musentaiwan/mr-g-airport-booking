# Mr.G尊榮接送｜用車服務

Mr.G 專屬的 LINE 內訂車表單。官方帳號：`@194wevnz`。

## 客人使用流程

從 Mr.G 官方 LINE 點「用車預約」→ 選機場接送、旅遊包車或商務用車 → 填寫聯絡資料與需求 → 核對送出。完整文字經獨立通知服務傳給指定管理人員，客人聊天室只保留完整資料小卡。收到客服確認前，尚未完成訂車。

圖文選單 A 區必須使用 LIFF 入口：
`https://liff.line.me/2012188603-cJnVDTcj?view=booking`

服務介紹使用 `?view=services`，意見申訴使用 `?view=feedback`。

網頁託管位置是 `https://musentaiwan.github.io/mr-g-airport-booking/`，不直接拿這個網址做圖文選單。

## 功能與範圍

- 自己乘車／代他人預約；送機、接機、單趟／來回。
- 姓名電話填一次，回程可選不同乘車人；航班、時間、地址、加點、行李與兒童座椅分趟調整。公司名稱選填。
- 檢查必填欄位、電話、台北日期時間與兩趟的先後順序。
- 專用 Google Apps Script 發送完整文字通知，LIFF `sendMessages` 僅傳送客人資料小卡。
- 傳送期間鎖定表單；同一工作階段抑制重複傳送。結果不明時請客人先檢查聊天室，不自動重試。
- 只有 LINE 內、登入完成且一對一對話來源可以送出。一般瀏覽器可預覽，但不能送出。

此版本不含訂單資料庫、派車後台、司機管理或自動報價。使用 Mr.G 專用 Messaging API（2012190233）與獨立 Google Apps Script，沒有沿用其他品牌的後台。

Google 專案：https://script.google.com/home/projects/1MWZgJRcL5lP0idtJxbQy6whjLyQxFc5p_EfxA0PhDhsFnWOR9DA7hpZp/edit

專案屬性保存 `LINE_CHANNEL_SECRET`、`NOTIFY_USER_ID`、`TEST_USER_ID`、`MODE`、`NOTIFY_ENABLED`，不得放入 GitHub。`MODE=test` 只接受指定測試帳號；測試確認後才改為 `production` 開放其他客人。通知收件人固定由伺服器設定，前端無法自行指定。交接時需變更收件人並實際核對收件。

## LINE 設定

| 項目 | 設定 |
| --- | --- |
| Provider | Mr.G尊榮接送（2005672165） |
| LINE Login channel | Mr.G尊榮接送（2012188603） |
| LIFF ID | 2012188603-cJnVDTcj |
| Endpoint | https://musentaiwan.github.io/mr-g-airport-booking/ |
| Size | Full |
| Scope | openid、chat_message.write |
| Add friend option | Off |

對外使用前須將 LINE Login channel 發布。無需將 channel secret 或 access token 放入網頁；`config.js` 只有公開識別碼。

LIFF 會把訊息傳回開啟表單的原對話，無法在前端取得對方官方帳號 ID 來驗證。請由 Mr.G 的圖文選單開啟，不要將入口分享至其他對話後送出。

## 資料處理

表單內容在目前網頁記憶體中，送出時透過專用 Google 通知程式與 LINE 處理。通知程式只保留去重識別、內容雜湊、狀態與時間，最多 7 天；原始行程不寫入這些紀錄。Google 僅授權連接外部服務，不讀取 Gmail、雲端硬碟文件或試算表。沒有額外分析追蹤程式。

勾選記住資料時，姓名與電話存於 `localStorage` 的 `mrg_booking_contact_v1`；可在表單清除。傳送雜湊、時間、狀態存於 `sessionStorage` 的 `mrg_booking_delivery_v1`。相同 GitHub Pages 網域共享瀏覽器來源，獨立 key 用來避免功能混用，並非跨網站安全隔離。詳見 `privacy.html`。

## 維護與檢查

`index.html` 與 `service-shell.js` 是服務入口；`booking.html`、`app.js`、`service-flow.js`、`form-refinements.js` 是完整預約介面。`booking-submit.js`、`service-submit.js` 整理資料，`delivery.js` 協調通知與卡片，`notification-service.js` 呼叫通知服務，`line-service.js` 處理卡片。`apps-script/` 保存獨立通知程式原始碼；變更後須同步部署至上方 Google 專案。

無套件依賴、無需建置：

```sh
python -m http.server 4173 --bind 127.0.0.1
npm run check
npm test
```

GitHub Pages 從 `main` 根目錄部署。Node 測試使用模擬服務，不會實際發訊。完整驗收須在手機 LINE 從用車預約開啟，確認客人卡片、指定管理人員的完整文字與返回聊天功能。電腦測試不能取代此步驟。
