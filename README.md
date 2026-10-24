# Mr.G尊榮接送｜機場接送預約

Mr.G尊榮接送專用的獨立預約網站。官方 LINE：`@194wevnz`。

網站：<https://musentaiwan.github.io/mr-g-airport-booking/>

## 功能

- 自己乘車或代他人預約。
- 送機、接機、單趟與來回行程；兩趟可分別修改乘車人、時間、航班及地址。
- 台灣縣市與行政區、機場航廈、途中加點。
- 乘車人數、各類行李、兒童座椅、特殊需求。
- 必填、電話、台北時間及前後行程檢查。
- 核對後產生完整摘要，使用手機 LINE 開啟指定官方帳號，帶入文字；客人須在 LINE 中按下傳送。
- 長摘要改用完整複製與貼上；電腦版提供複製摘要與官方帳號入口。

## 收件與完成狀態

本版是「填表 → 摘要 → 官方 LINE 對話」流程，不會自動發訊、不會寫入試算表，也不會宣稱訂車成功。客服須在 LINE 中確認車型、報價與接送安排。

無須 Messaging API 或 LIFF 金鑰。若未來增加 LINE 內直接送出卡片、後台存單或通知，需另外建立 Mr.G 專屬串接，不可使用其他品牌的識別碼或收件端點。

LINE 的開啟對話連結官方支援 iOS / Android；桌面版請使用複製摘要方式。手機帶入文字與最終收件仍須使用真實裝置驗證。

## 資料處理

行程資料僅保留在目前網頁記憶體。未按下前往 LINE 前，不會向應用程式後台傳送表單內容。網頁不含分析追蹤程式、不保存行程資料、不放置任何密鑰。

只有客人勾選「記住姓名與電話」後，才會以 `mrg_booking_contact_v1` 儲存在這個瀏覽器；可按清除刪除。GitHub Pages 同一網域共用瀏覽器來源，因此此設計使用獨立命名空間避免混用，並非跨網站安全隔離。

點選 LINE 按鈕時，摘要會以 LINE 官方網址的文字參數帶入對話。使用者須在對話內完成傳送。資料不會寫入其他品牌後台。

## 檔案

| 檔案 | 用途 |
| --- | --- |
| `index.html` | 預約介面 |
| `styles.css` | 品牌樣式與手機排版 |
| `app.js` | 表單流程與欄位檢查 |
| `booking-core.js` | 摘要、LINE 連結與日期等共用邏輯 |
| `config.js` | 品牌名稱與官方 LINE ID，僅放公開設定 |
| `tests/booking.test.cjs` | 摘要完整性、接收帳號與資料分流測試 |

不包含司機報到、評分、派車管理或其他品牌頁面。未套用其他業者的取消退款金額、等候時間或車輛容量承諾。

## 本機預覽與檢查

無套件依賴、無需建置。

```sh
python -m http.server 4173 --bind 127.0.0.1
npm run check
npm test
```

## GitHub Pages

在儲存庫 `Settings → Pages` 選擇 `Deploy from a branch`，來源設為 `main` 與根目錄 `/`。`index.html` 為預約入口。

LINE 圖文選單只需將「機場接送」區塊設為「連結」，填入上方網站網址。首次對外使用前，以 iPhone / Android 真實 LINE 對話確認摘要到達 `@194wevnz`。

官方連結規格：<https://developers.line.biz/en/docs/messaging-api/using-line-url-scheme/#opening-a-chat-screen-with-a-line-official-account>
