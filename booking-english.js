'use strict';
// Presentation-only translations. Booking values and customer-entered text stay unchanged.
(function(root){
  const copy={
    '載入中…':'Loading…',
    '這次需要哪一種服務？':'How can we help with your trip?',
    '先選這次的服務，再填聯絡資料與行程需求。':'Choose a service, then tell us about your trip.',
    '機場接送':'Airport transfers','旅遊包車':'Private tours','商務用車':'Business travel',
    '送機、接機與來回，各趟需求分別填寫':'Airport drop-off, pick-up or round trip.',
    '旅遊行程、時數與多點停靠':'Flexible hours, itineraries and multiple stops.',
    '企業接待、機場與多點商務接送':'Corporate visits, airport transfers and business trips.',
    '其他服務：市區接駁／貨物接送／結婚禮車':'Other services: city transfers, deliveries and wedding cars',
    '選擇服務':'Service','聯絡資料':'Contact','行程需求':'Trip details','另一趟':'Return trip','核對預約':'Review',
    '基本資料':'Contact details','確認資料':'Review details',
    '先填寫聯絡資料':'Your contact details',
    '請填寫方便司機聯繫與稱呼的資料。':'Please provide a name and phone number for your driver.',
    '這次為誰預約？':'Who is this booking for?',
    '自己乘車':'For myself','幫他人預約':'For someone else',
    '填寫我的乘車資料':'Use my contact details','另外填寫實際乘車人':'Add the passenger’s details',
    '乘車人姓名／稱呼':'Passenger name','預約聯絡人姓名／稱呼':'Booking contact name',
    '預約聯絡人電話':'Booking contact phone','聯絡電話':'Phone number',
    '負責人姓名／稱呼':'Contact person','負責人聯絡電話':'Contact person’s phone',
    '乘車人聯絡電話':'Passenger phone','實際乘車人':'Passenger',
    '公司／商務用車資料':'Company details','公司／商號名稱':'Company name','統一編號':'Business tax ID',
    '請填完整手機或市話；海外電話請加國碼。':'Enter a full phone number. Include the country code for overseas numbers.',
    '在這台裝置記住姓名與電話':'Remember my name and phone on this device',
    '僅儲存在此瀏覽器，您可以隨時清除。':'Saved only in this browser. You can clear it at any time.',
    '清除已記住的資料':'Clear saved details',
    '姓名與電話用於本次預約聯繫。標示 * 的欄位為必填。':'We use these details to contact you about this booking. Fields marked * are required.',
    '這個瀏覽器無法儲存資料，仍可繼續預約。':'This browser cannot save your details. You can still continue.',
    '姓名與電話已記住在這台裝置。':'Your name and phone have been saved on this device.',
    '已帶入這台裝置先前記住的資料。':'Your saved contact details have been filled in.',
    '已清除這台裝置記住的資料。目前填寫內容仍保留。':'Saved details have been cleared. Your current form entries are unchanged.',
    '安排第一趟接送':'Plan your first transfer',
    '選擇接送方向，再告訴我們時間與地點。':'Choose a direction, then enter the time and locations.',
    '送機':'Airport drop-off','接機':'Airport pick-up',
    '從指定地點出發到機場':'From your location to the airport',
    '從機場前往指定地點':'From the airport to your destination',
    '送機時間與航班':'Drop-off time & flight','接機時間與航班':'Arrival time & flight',
    '前往機場':'To the airport','抵達機場':'From the airport',
    '送機日期':'Pick-up date','接機日期':'Flight arrival date',
    '上車時間':'Pick-up time','落地時間':'Flight arrival time','航班落地時間':'Flight arrival time',
    '航班編號':'Flight number',
    '請依機票填寫出發航班，時間皆為台灣當地時間。':'Enter your departing flight number. All times are Taiwan local time (UTC+8).',
    '請依機票填寫抵達航班，時間皆為台灣當地時間。':'Enter your arriving flight number. All times are Taiwan local time (UTC+8).',
    '接送路線':'Route','上車地點':'Pick-up location','下車地點':'Drop-off location',
    '上車地點補充':'Pick-up instructions','途中加點':'Additional stops','＋ 增加加點地址':'Add a stop',
    '機場與航廈':'Airport & terminal','這一趟的乘車人':'Passengers for this trip','乘車人數':'Passengers',
    '這一趟的聯絡電話':'Phone for this trip','已帶入基本資料，可單獨修改。':'Filled from your contact details. You can edit this trip separately.',
    '大人':'Adults','小孩':'Children',
    '請填實際人數，客服將依需求確認合適車型。':'Enter the actual passenger count. We will confirm a suitable vehicle.',
    '行李與座椅':'Luggage & child seats',
    '請填各類數量，沒有攜帶的項目維持 0。':'Enter a quantity for each item. Leave unused items at 0.',
    '手提行李':'Hand luggage','20吋登機箱':'20-inch cabin suitcase','24–26吋行李箱':'24–26-inch suitcase',
    '28–30吋行李箱':'28–30-inch suitcase','胖胖箱':'Trunk-style suitcase',
    '特殊行李':'Special items','特殊行李說明':'Special item details',
    '嬰兒車':'Stroller','輪椅':'Wheelchair','球具':'Sports equipment','其他':'Other',
    '兒童座椅':'Child seats','正向安全座椅':'Forward-facing seat','反向安全座椅':'Rear-facing seat','增高墊':'Booster seat',
    '座椅種類、數量與費用由客服確認。':'Seat types, availability and charges will be confirmed by our team.',
    '其他備註':'Additional notes',
    '另一趟，也一起安排嗎？':'Would you like a return transfer?',
    '可加填接機行程，或繼續確認單趟預約。':'Add an airport pick-up or continue with a one-way booking.',
    '可加填送機行程，或繼續確認單趟預約。':'Add an airport drop-off or continue with a one-way booking.',
    '第一趟':'First transfer','只訂這一趟':'One-way only','直接核對預約資料':'Continue to review',
    '再加一趟接機':'Add airport pick-up','再加一趟送機':'Add airport drop-off',
    '接送需求可分別調整':'Set details for each transfer',
    '這一趟的乘車人不同':'Different passenger for this transfer',
    '旅遊包車需求':'Private tour details','商務用車需求':'Business travel details',
    '請填行程時間、地點、人數、行李與特殊需求。':'Tell us the time, locations, passengers, luggage and any special requests.',
    '請填用車日期時間、人數與商務行程。':'Tell us the date, time, passenger count and business itinerary.',
    '乘車人、行李與座椅可依這次行程調整。':'Adjust the passengers, luggage and child seats for this trip.',
    '用車時間':'Travel time','用車日期與時間':'Travel date & time','用車日期':'Travel date','出發時間':'Departure time',
    '預估包車時數':'Estimated duration','希望行程':'Planned itinerary','商務行程':'Business itinerary',
    '行程結束地點':'Final destination','用車方式':'Service type','接送方向':'Transfer direction',
    '尚未確定，請協助建議':'Not sure — please advise','其他，填寫於行程':'Other — specify in itinerary',
    '單趟接送':'One-way transfer','多點／包車':'Multiple stops / hourly hire',
    '確認您的預約需求':'Review your booking request',
    '請再核對時間、地址與聯絡方式。':'Please check the times, locations and contact details.',
    '預約聯絡人':'Booking contact','代訂聯絡人':'Booking contact','公司負責聯絡人':'Company contact',
    '修改':'Edit','修改聯絡資料':'Edit contact details','修改行程':'Edit trip',
    '起點':'From','終點':'To','加點':'Stop','乘車人':'Passenger','電話':'Phone',
    '人數':'Passengers','行李':'Luggage','上車補充':'Pick-up instructions','備註':'Notes',
    '公司':'Company','統編':'Tax ID','服務':'Service','日期':'Date','航班':'Flight','包車時數':'Duration','乘車人電話':'Passenger phone',
    '預約須知':'Before you submit',
    '送出後，請等候客服確認預約內容。':'After submitting, please wait for our team to confirm your request.',
    '車型、車資、行李空間、兒童座椅與等候安排，皆由客服另行確認。':'Vehicle, fare, luggage space, child seats and waiting arrangements are subject to confirmation.',
    '收到客服確認前，尚未完成訂車；行程變更或取消請直接聯繫客服。':'Your booking is not confirmed until our team contacts you. Contact us directly for changes or cancellations.',
    '我已核對資料，並了解預約須經客服確認。':'I have checked the details and understand that my booking requires confirmation.',
    '上一步':'Back','下一步：行程需求 →':'Next: trip details','下一步：安排另一趟 →':'Next: return transfer',
    '下一步：確認資料 →':'Next: review','下一步：核對預約 →':'Next: review',
    '送出預約需求':'Submit booking request','正在傳送預約需求…':'Sending your request…',
    '正在送出預約需求…':'Sending your request…','正在傳回預約小卡…':'Sending your LINE confirmation card…',
    '再次確認傳送':'Check submission status',
    '預約需求處理中':'Processing your request','預約需求已送出':'Request submitted',
    '預約小卡已傳回 LINE，請等候客服確認車型、車資與行程安排。收到客服確認前，尚未完成訂車。':'Your request card has been sent to LINE. Please wait for our team to confirm the vehicle, fare and itinerary. Your booking is not yet confirmed.',
    '客服已收到預約需求。預約小卡的傳送尚未確認，請返回 Mr.G 的 LINE 聊天室與客服核對，無須重填預約。':'Our team has received your request, but delivery of your LINE card is unconfirmed. Please check with us in LINE. You do not need to submit again.',
    '返回 LINE 對話':'Return to LINE','複製完整預約摘要':'Copy booking summary','返回修改預約資料':'Edit booking details',
    '查看完整預約摘要':'View booking summary','官方 LINE · @194wevnz':'Official LINE · @194wevnz',
    '正在連接 LINE…':'Connecting to LINE…',
    '請從 Mr.G 官方 LINE 的「用車預約」開啟，才能送出預約。':'To submit, open “Book a ride” from the Mr.G official LINE chat.',
    '請從 Mr.G 官方 LINE 的「用車預約」重新開啟。':'Please reopen “Book a ride” from the Mr.G official LINE chat.',
    '請填寫姓名／稱呼。':'Please enter your name.',
    '請填寫完整電話；海外電話請加 + 與國碼。':'Please enter a valid phone number. For overseas numbers, include + and the country code.',
    '請填寫實際乘車人的姓名／稱呼。':'Please enter the passenger’s name.',
    '請填寫實際乘車人的完整聯絡電話。':'Please enter the passenger’s full phone number.',
    '請確認航班編號，例如 BR123 或 CI008。':'Please check the flight number, e.g. BR123 or CI008.',
    '請確認航班編號，例如 BR123。':'Please check the flight number, e.g. BR123.',
    '請填寫機場與航廈。':'Please enter the airport and terminal.',
    '請選擇縣市。':'Please choose a city or county.','請選擇區域。':'Please choose a district.',
    '請填寫完整門牌地址或地點名稱。':'Please enter a full street address or place name.',
    '請補齊加點地址，或移除空白加點。':'Please complete the stop address or remove the empty stop.',
    '每趟最多可填寫 5 個加點，其他需求請填備註。':'You can add up to 5 stops per trip. Put any other requests in Notes.',
    '每趟需至少 1 位大人，本表單每趟最多填寫 30 位，更多人數請直接洽客服。':'Each trip requires at least 1 adult. For more than 30 passengers, please contact our team.',
    '請填實際人數，至少 1 位大人；超過 30 位請直接洽詢。':'Enter the actual count, including at least 1 adult. Contact us for more than 30 passengers.',
    '請填寫實際乘車人數，至少 1 位大人。':'Enter the passenger count, including at least 1 adult (up to 30 passengers).',
    '數量請填有效的整數。':'Please enter a valid whole number.',
    '請補充特殊行李的件數、尺寸與折疊方式。':'Please describe the quantity, dimensions and foldability of your special items.',
    '另一趟時間需晚於第一趟，請確認日期與時間。':'The return transfer must be later than the first. Please check both dates and times.',
    '另一趟時間需晚於第一趟。':'The return transfer must be later than the first.',
    '請填寫有效的用車日期。':'Please enter a valid travel date.','請填寫有效日期。':'Please enter a valid date.',
    '請填寫尚未過期的用車時間。':'Please choose a future travel date and time.',
    '請填寫完整縣市、行政區與接送地址。':'Please enter the city, district and full pick-up address.',
    '請填寫完整的行程結束地點。':'Please enter the full final destination.',
    '請填寫行程資訊。':'Please enter your itinerary.','請填寫商務行程。':'Please enter your business itinerary.',
    '請填寫乘車人姓名。':'Please enter the passenger’s name.','請填寫完整乘車人電話。':'Please enter the passenger’s full phone number.',
    '請填寫公司／商號名稱。':'Please enter the company name.','統一編號請填 8 位數字，或保留空白。':'Enter an 8-digit tax ID, or leave it blank.',
    '請先核對資料並勾選預約須知。':'Please review your details and tick the acknowledgement before submitting.',
    '目前無法確認傳送結果，請返回 LINE 與客服核對。':'We cannot confirm the submission status. Please check with our team in LINE.',
    '請從 Mr.G 官方 LINE 聊天室下方的服務選單開啟，再送出資料。':'Please open the service menu in the Mr.G official LINE chat before submitting.',
    'LINE 登入授權已失效，請關閉表單後，從 Mr.G 官方 LINE 重新開啟。':'Your LINE session has expired. Close this form and reopen it from our official LINE chat.',
    '目前僅開放指定帳號測試，請直接聯絡 Mr.G 客服。':'This form is currently in testing. Please contact Mr.G directly.',
    '送出次數較多，請稍候幾分鐘，或直接聯絡客服。':'Too many attempts. Please wait a few minutes or contact our team.',
    '尚未確認傳送結果。請稍後按「再次確認傳送」，系統會核對同一筆資料，避免重複通知。':'The result is unconfirmed. Tap “Check submission status” shortly to check the same request without sending a duplicate.',
    '預約通知暫時無法使用，請直接聯絡 Mr.G 客服。':'Booking notifications are temporarily unavailable. Please contact Mr.G directly.',
    '上一筆資料正在傳送，請稍候。':'Your previous request is still being sent. Please wait.',
    '目前無法確認傳送成功，請稍後再試，或直接聯絡 Mr.G 客服。':'We cannot confirm delivery. Please try again later or contact Mr.G.',
    '選擇縣市':'City / county','選擇區域':'District',
    '例如：陳小姐':'e.g. Ms. Chen','例如：0912 345 678':'e.g. +886 912 345 678',
    '司機接待時的稱呼':'Name for your driver to use','可聯繫到實際乘車人的電話':'A number where the passenger can be reached',
    '例如：BR123':'e.g. BR123','路名、巷弄、門牌或飯店名稱':'Street address or hotel name',
    '例如：大廳門口、出口編號、招牌名稱':'e.g. lobby entrance, exit number or shop sign',
    '加點完整地址':'Full stop address','例如：桃園國際機場 第一航廈':'e.g. Taoyuan International Airport, Terminal 1',
    '請說明件數、尺寸及是否可折疊，方便確認車內空間。':'List quantities, dimensions and whether items fold, so we can check the space needed.',
    '還有希望我們留意的事嗎？':'Anything else you would like us to know?',
    '路名、門牌、飯店或行程結束地點':'Street address, hotel or final destination',
    '行程、停留地點、接待或用車需求':'Itinerary, stops, guests or transport requirements',
    '請說明接待、會議或商務行程；可一併註明用車地點與時間安排。':'Describe your visits, meetings or business itinerary, including locations and timing.',
    '桃園國際機場 第一航廈':'Taoyuan International Airport — Terminal 1',
    '桃園國際機場 第二航廈':'Taoyuan International Airport — Terminal 2',
    '台北松山機場 國際線':'Taipei Songshan Airport — International',
    '台北松山機場 國內線':'Taipei Songshan Airport — Domestic',
    '台中國際機場 國際線':'Taichung International Airport — International',
    '高雄國際機場 國際線':'Kaohsiung International Airport — International'
  };
  function translate(value){
    const s=String(value||'').trim().replace(/\s+/g,' ');
    if(copy[s])return copy[s];
    let m;
    if((m=s.match(/^(\d+) 小時$/)))return m[1]+' hours';
    if((m=s.match(/^加點 (\d+)$/)))return 'Stop '+m[1];
    if((m=s.match(/^第 (\d+) 趟 [·｜] (送機|接機)$/)))return `Trip ${m[1]} · ${copy[m[2]]}`;
    if((m=s.match(/^(送機|接機) · (.+)$/)))return copy[m[1]]+' · '+m[2];
    if((m=s.match(/^(上車時間|航班落地時間) · (.+)$/)))return copy[m[1]]+' · '+m[2];
    if((m=s.match(/^(\d+ \/ \d+ · )(.+)$/))&&copy[m[2]])return m[1]+copy[m[2]];
    if((m=s.match(/^請選擇(送機|接機)日期。$/)))return 'Please choose the '+(m[1]==='送機'?'pick-up':'flight arrival')+' date.';
    if((m=s.match(/^請填寫(送機|接機)時間。$/)))return 'Please enter the '+(m[1]==='送機'?'pick-up':'flight arrival')+' time.';
    if(/^(送機|接機)時間已過/.test(s))return 'This transfer time has passed. Please check the date and time.';
    if(/^請填寫(送機|接機)乘車人的姓名/.test(s))return 'Please enter the passenger’s name for this transfer.';
    if(/^請填寫(送機|接機)的完整聯絡電話/.test(s))return 'Please enter the full phone number for this transfer.';
    return '';
  }
  function value(label,text){
    // Only system-generated values; never guess a translation for names, addresses or notes.
    if(!['服務','用車方式','接送方向','人數','乘車人數','行李','兒童座椅','包車時數','日期','用車日期','用車時間','上車時間','航班落地時間'].includes(label))return '';
    const s=String(text);
    if(s==='無')return 'None';
    if(translate(s))return translate(s);
    if(/時間$/.test(label))return s.replace('（台北時間）',' (Taiwan time, UTC+8)');
    const pax=s.match(/^(\d+)\s*(?:位大人|大)\s*[·、]?\s*(\d+)\s*(?:位小孩|小)$/);
    if(pax)return `${pax[1]} adult${pax[1]==='1'?'':'s'} · ${pax[2]} child${pax[2]==='1'?'':'ren'}`;
    if(['行李','兒童座椅'].includes(label))return s.split(', ').map(item=>{
      const parts=item.match(/^(.+)x(\d+)$/);if(!parts)return item;
      return (translate(parts[1].replace('24-26','24–26').replace('28-30','28–30'))||parts[1])+' × '+parts[2];
    }).join(', ');
    return '';
  }
  const api=Object.freeze({translate,value});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MrgBookingEnglish=api;
})(typeof globalThis!=='undefined'?globalThis:this);
