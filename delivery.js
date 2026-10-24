'use strict';
window.mrgSending=false;
window.MrgLineReady=(async()=>{
  if(['localhost','127.0.0.1'].includes(location.hostname))return false;
  try{if(!window.liff)return false;await liff.init({liffId:MRG_CONFIG.liffId,withLoginOnExternalBrowser:false});return LineBooking.contextReady(liff);}catch{return false;}
})();
window.MrgDelivery=Object.freeze({
  async send(content,onProgress=()=>{}){
    if(window.mrgSending)return {status:'error',code:'BUSY'};
    window.mrgSending=true;
    const progress=phase=>{try{onProgress(phase);}catch{}};
    let ownerAccepted=false;
    try{
      progress('sending');
      if(!await window.MrgLineReady)return {status:'error',code:'LINE_CONTEXT'};
      const token=liff.getIDToken(),user=liff.getDecodedIDToken()?.sub;
      if(!token||!user)return {status:'error',code:'AUTH_REQUIRED'};
      const request=await MrgNotification.prepare(content,user,sessionStorage);
      // Build the complete customer card before sending anything.
      const messages=LineBooking.messagesForContent(content,MRG_CONFIG.brandName);
      const receipt=await MrgNotification.submit({endpoint:MRG_CONFIG.notificationEndpoint,request:{...content,requestId:request.requestId,idToken:token}});
      if(receipt.status!=='accepted')return receipt;
      ownerAccepted=true;
      progress('card');
      const result=await LineBooking.sendOnce({sdk:liff,messages,fingerprint:request.hash,storage:sessionStorage});
      return {status:'accepted',receiptId:receipt.receiptId,cardStatus:result.status};
    }catch{return ownerAccepted?{status:'accepted',cardStatus:'unknown'}:{status:'error',code:'UNAVAILABLE'};}
    finally{window.mrgSending=false;}
  },
  errorMessage(code){return ({LINE_CONTEXT:'請從 Mr.G 官方 LINE 聊天室下方的服務選單開啟，再送出資料。',AUTH_REQUIRED:'LINE 登入授權已失效，請關閉表單後，從 Mr.G 官方 LINE 重新開啟。',TEST_ONLY:'目前僅開放指定帳號測試，請直接聯絡 Mr.G 客服。',RATE_LIMIT:'送出次數較多，請稍候幾分鐘，或直接聯絡客服。',UNKNOWN:'尚未確認傳送結果。請稍後按「再次確認傳送」，系統會核對同一筆資料，避免重複通知。',PAUSED:'預約通知暫時無法使用，請直接聯絡 Mr.G 客服。',BUSY:'上一筆資料正在傳送，請稍候。'})[code]||'目前無法確認傳送成功，請稍後再試，或直接聯絡 Mr.G 客服。';}
});
