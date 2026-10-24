'use strict';
(async()=>{
 const button=document.getElementById('activate'),status=document.getElementById('status');
 try{
  await liff.init({liffId:MRG_CONFIG.liffId,withLoginOnExternalBrowser:false});
  const url=new URL(location.href),setupKey=url.searchParams.get('k');
  url.searchParams.delete('k');history.replaceState(null,'',url.pathname+url.search+url.hash);
  if(!liff.isInClient()||!liff.isLoggedIn()||!liff.getIDToken()){button.textContent='請從 LINE 開啟';status.textContent='請由 Mr.G 本人在手機 LINE 中點選專屬連結。';return;}
  if(!/^[a-f0-9]{64}$/.test(setupKey||'')){button.textContent='連結無效';status.textContent='請使用完整的專屬啟用連結。';return;}
  const requestId=crypto.randomUUID();button.textContent='啟用接收通知';button.disabled=false;
  button.onclick=async()=>{
   button.disabled=true;button.textContent='正在啟用…';status.textContent='';
   try{
    const result=await MrgNotification.submit({endpoint:MRG_CONFIG.notificationEndpoint,request:{kind:'recipient-setup',setupKey,idToken:liff.getIDToken(),requestId}});
    if(result.status==='accepted'){button.textContent='已啟用接收通知';status.textContent='設定完成，通知已傳到您的 LINE。';return;}
    status.textContent=({RECIPIENT_NAME_MISMATCH:'請使用「Mr.G-Premium™接送」本人的 LINE 開啟，並確認已加入 Mr.G 官方帳號好友。',SETUP_EXPIRED:'此啟用連結已失效，請聯絡沐森重新提供。',AUTH_REQUIRED:'LINE 授權已失效，請關閉後重新開啟連結。'})[result.code]||'尚未確認設定完成，請再試一次；不會重複傳送啟用通知。';
   }catch{status.textContent='目前連線不穩，請稍後再試。';}
   button.disabled=false;button.textContent='再次確認啟用';
  };
 }catch{button.textContent='暫時無法開啟';status.textContent='請關閉頁面後，從 LINE 重新點選專屬連結。';}
})();
