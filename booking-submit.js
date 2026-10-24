'use strict';
function bookingNotification(){
  const c=getContact();
  const contact={title:'預約聯絡資料',rows:[...companyRows(),[state.mode==='other'?'代訂聯絡人':'聯絡人',c.name],['聯絡電話',c.phone],...(state.mode==='other'?[['實際乘車人',c.riderName],['乘車人電話',c.riderPhone]]:[])]};
  const trips=state.service==='airport'?selectedLegs().map((t,i)=>{
    const p=readLeg(t),v=makePayload(p);
    return {title:`第 ${i+1} 趟｜${directionName(t)}`,rows:[['日期',p.date],[t==='arr'?'航班落地時間':'上車時間',p.time+'（台北時間）'],['航班',p.flight],['乘車人',p.rider],['電話',p.phone],['起點',v.start],...p.stops.map((s,n)=>['加點 '+(n+1),s]),['終點',v.end],['人數',`${p.adult} 位大人、${p.child} 位小孩`],['行李',getGridData(t,'Lug')],['兒童座椅',getGridData(t,'Seat')],...(p.special.length?[['特殊行李',p.special.join('、')],['特殊行李說明',p.specialNote]]:[]),...(p.pickupNote?[['上車補充',p.pickupNote]]:[]),...(p.memo?[['備註',p.memo]]:[])]};
  }):[{title:serviceNames[state.service],rows:generalRows()}];
  return {kind:'booking',service:serviceNames[state.service],sections:[contact,...trips]};
}
initLine=async function(){
  const ready=await(parent!==window&&parent.MrgLineReady?parent.MrgLineReady:Promise.resolve(false));
  window.liff=parent!==window?parent.liff:window.liff;
  $('line-status').hidden=ready;
  $('line-status').textContent=ready?'':'請從 Mr.G 官方 LINE 的「用車預約」開啟，才能送出預約。';
};
submitAll=async function(){
  if(state.busy||state.submission)return;
  clearErrors();
  if(!$('agree-policy').checked)return setError('請先核對資料並勾選預約須知。',$('agree-policy'));
  if(!validateContact()||!validateCompany()){goStep(1);validateContact()&&validateCompany();return;}
  if(state.service==='airport'){
    for(const t of selectedLegs())if(!validateLeg(t)){goStep(t===state.first?2:3);validateLeg(t);return;}
    if(state.hasReturn&&!BookingCore.returnIsLater(readLeg(state.first),readLeg(opposite(state.first))))return setError('另一趟時間需晚於第一趟。');
  }else if(!validateGeneral()){goStep(2);validateGeneral();return;}
  if(parent===window||!parent.MrgDelivery)return setError('請從 Mr.G 官方 LINE 的「用車預約」重新開啟。');
  const content=bookingNotification();
  state.busy=true;$('next-button').disabled=true;$('back-button').disabled=true;$('next-button').textContent='正在傳送預約需求…';
  document.querySelectorAll('.step-section,#general-trip-step').forEach(n=>n.inert=true);
  try{
    const result=await parent.MrgDelivery.send(content);
    if(result.status==='accepted'){
      state.submission={status:result.cardStatus,text:buildText(),receiptId:result.receiptId};
      hidePanels();$('form-actions').hidden=true;document.querySelector('.steps').hidden=true;
      $('result-icon').textContent='✓';$('result-title').textContent='預約需求已送出';
      $('result-description').textContent=result.cardStatus==='sent'?'預約小卡已傳回 LINE，請等候客服確認車型、車資與行程安排。收到客服確認前，尚未完成訂車。':'客服已收到預約需求。預約小卡的傳送尚未確認，請返回 Mr.G 的 LINE 聊天室與客服核對，無須重填預約。';
      $('summary-text').value=state.submission.text;$('summary-text').closest('details')?.setAttribute('hidden','');
      $('copy-summary').hidden=true;$('copy-status').textContent='';$('edit-booking').hidden=true;
      $('return-line').hidden=!window.liff?.isInClient();$('return-line').onclick=()=>parent.liff.closeWindow();
      $('result').hidden=false;$('result').inert=false;$('result').focus();window.scrollTo(0,0);
    }else{
      setError(parent.MrgDelivery.errorMessage(result.code));
      if(result.code==='UNKNOWN')$('next-button').textContent='再次確認傳送';
    }
  }catch{setError('目前無法確認傳送結果，請返回 LINE 與客服核對。');}
  finally{state.busy=false;$('next-button').disabled=false;$('back-button').disabled=false;document.querySelectorAll('.step-section,#general-trip-step').forEach(n=>n.inert=false);if($('next-button').textContent!=='再次確認傳送')$('next-button').textContent='送出預約需求';}
};
