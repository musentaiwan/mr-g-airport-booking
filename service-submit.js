'use strict';
async function submitServiceRequest(kind){
  if(window.mrgSending)return;
  let content;
  {
    const d=state.data.other,c=state.common;
    if(!d.date||!d.time||!d.itinerary.trim()||!c.name.trim()||!/^\+?[\d\s()-]{8,22}$/.test(c.phone))return fail('請填妥需求與聯絡方式。');
    content={kind:'other',service:'其他服務',sections:[{title:d.kind,rows:[['日期時間',d.date+' '+d.time+'（台北時間）'],['聯絡人',c.name.trim()],['電話',c.phone.trim()],['需求',d.itinerary.trim()]]}]};
  }
  const buttons=[...$('app').querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
  try{
    const result=await MrgDelivery.send(content);
    if(result.status!=='accepted')return fail(MrgDelivery.errorMessage(result.code));
    $('app').innerHTML=`<div class="screen-content">${header('您的需求已送出','感謝您提供完整資訊，我們會盡快了解並與您聯繫。')}<p class="note">${result.cardStatus==='sent'?'已將資料小卡傳回 LINE，您可以返回聊天室查看。':'客服已收到資料。請返回 LINE 聊天室與客服核對，無須再次填寫。'}</p><button class="button full" id="close-line">返回 LINE</button></div>`;
    $('close-line').onclick=()=>closeMrgPage();
  }finally{buttons.forEach(b=>b.disabled=false);}
}
