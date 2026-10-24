# Mr.G尊榮接送｜機場接送預約

Mr.G 專屬的 LINE 內訂車表單。官方帳號：`@194wevnz`。

## 客人使用流程

從 Mr.G 官方 LINE 聊天室點「機場接送」A 區 → 在 LINE 內填寫需求 → 核對並送出 → 預約卡片及完整摘要回到原聊天室。收到客服確認前，尚未完成訂車。

圖文選單 A 區必須使用 LIFF 入口：
`https://liff.line.me/2012188603-cJnVDTcj`

網頁託管位置是 `https://musentaiwan.github.io/mr-g-airport-booking/`，不直接拿這個網址做圖文選單。

## 功能與範圍

- 自己乘車／代他人預約；送機、接機、單趟／來回。
- 各趟獨立填寫乘車人、航班、時間、地址、加點、行李及兒童座椅。
- 檢查必填欄位、電話、台北日期時間與兩趟的先後順序。
- 透過 LIFF `sendMessages` 傳送品牌卡片與完整文字摘要。
- 傳送期間鎖定表單；同一工作階段抑制重複傳送。結果不明時請客人先檢查聊天室，不自動重試。
- 只有 LINE 內、登入完成且一對一對話來源可以送出。一般瀏覽器可預覽，但不能送出。

此版本不含訂單資料庫、派車後台、司機管理或自動報價。沒有啟用 Messaging API，沒有沿用其他品牌的後台。

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

表單內容在目前網頁記憶體中，按下送出才透過 LINE 發訊。頁面載入時仍會連接 GitHub Pages 和 LINE SDK。沒有自行收件的伺服器或額外分析追蹤程式。

勾選記住資料時，姓名與電話存於 `localStorage` 的 `mrg_booking_contact_v1`；可在表單清除。傳送雜湊、時間、狀態存於 `sessionStorage` 的 `mrg_booking_delivery_v1`。相同 GitHub Pages 網域共享瀏覽器來源，獨立 key 用來避免功能混用，並非跨網站安全隔離。詳見 `privacy.html`。

## 維護與檢查

`index.html` / `styles.css` 是介面；`app.js` 管理步驟；`booking-core.js` 整理資料；`line-service.js` 處理卡片與傳送；`config.js` 放公開設定。

無套件依賴、無需建置：

```sh
python -m http.server 4173 --bind 127.0.0.1
npm run check
npm test
```

GitHub Pages 從 `main` 根目錄部署。Node 測試使用模擬 LINE 服務，不會實際發訊。正式驗收須在手機 LINE 從 A 區開啟，確認授權、送出、卡片與文字摘要收件，以及返回聊天功能。電腦測試不能取代此步驟。
