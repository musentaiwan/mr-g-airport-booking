'use strict';
const feedbackState={view:'form',matter:'',date:'',place:''};
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const heading=title=>`<div class="brand-small"><span class="brand-english">Mr. G ( Gary ) Premium Shuttle <span class="brand-word">Service<sup class="brand-trademark">™</sup></span></span></div><h2>${title}</h2><p class="sub">Mr.G 尊榮接送｜客戶服務中心</p>`;
function feedbackContent(){
  return {kind:'feedback',service:'意見申訴',sections:[{title:'客戶服務中心',rows:[['申訴事項',feedbackState.matter.trim()],['用車日期',feedbackState.date||'未提供'],['用車地點',feedbackState.place.trim()||'未提供']]}]};
}
function renderFeedback(){
  const review=feedbackState.view==='review';
  const content=review?
    `<div class="summary-card"><div class="summary-head"><small>MR.G · CUSTOMER SERVICE</small><h3>意見申訴</h3></div><div class="summary-body"><p class="sub" style="white-space:pre-wrap">${esc(feedbackContent().sections[0].rows.map(([label,value])=>label+'：'+value).join('\n'))}</p></div><div class="summary-footer">感謝您的寶貴意見，我們重視每一位賓客的服務體驗。</div></div><div class="action-row"><button class="button" data-action="edit">修改內容</button><button class="button primary" data-action="submit">送出意見</button></div>`:
    `<div class="card"><p class="feedback-intro">尊貴的賓客您好，我們非常重視您的寶貴意見。<br>請留下申訴事項與用車日期／地點，我們會盡快了解情況並與您聯繫。</p><label class="field" for="feedback-matter"><span>申訴事項 <b class="req">*</b></span><textarea id="feedback-matter" data-feedback="matter" maxlength="1200" placeholder="請說明遇到的情況，或您希望我們改善的地方。">${esc(feedbackState.matter)}</textarea></label><label class="field" for="feedback-date"><span>用車日期 <small class="optional">選填</small></span><input id="feedback-date" type="date" data-feedback="date" value="${esc(feedbackState.date)}"></label><label class="field" for="feedback-place"><span>用車地點 <small class="optional">選填</small></span><input id="feedback-place" data-feedback="place" maxlength="200" value="${esc(feedbackState.place)}" placeholder="上車地點、目的地或行程區間"></label></div><div class="action-row"><button class="button primary" data-action="review">核對意見內容 →</button></div>`;
  $('app').innerHTML=`<div class="screen-content">${heading(review?'核對您的意見':'意見申訴')}${content}</div>`;
  $('screen').scrollTop=0;
}
function showFeedbackError(message){
  const content=$('app').querySelector('.screen-content');
  content.querySelector('.error')?.remove();
  content.insertAdjacentHTML('afterbegin',`<div class="error" role="alert">${esc(message)}</div>`);
  $('screen').scrollTop=0;
}
async function sendFeedback(){
  if(window.mrgSending)return;
  if(!feedbackState.matter.trim())return showFeedbackError('請填寫申訴事項或想告訴我們的意見。');
  const buttons=[...$('app').querySelectorAll('button')];buttons.forEach(button=>button.disabled=true);
  const submit=buttons.find(button=>button.dataset.action==='submit'),label=submit?.textContent;
  try{
    const result=await MrgDelivery.send(feedbackContent(),phase=>{if(submit)submit.textContent=phase==='card'?'正在傳回資料小卡…':'正在送出意見…';});
    if(result.status!=='accepted')return showFeedbackError(MrgDelivery.errorMessage(result.code));
    feedbackState.view='sent';
    $('app').innerHTML=`<div class="screen-content">${heading('您的意見已送出')}<p class="sub">感謝您的寶貴意見，我們會盡快了解並與您聯繫。</p><p class="note">${result.cardStatus==='sent'?'已將資料小卡傳回 LINE，您可以返回聊天室查看。':'客服已收到資料。請返回 LINE 聊天室與客服核對，無須再次填寫。'}</p><button class="button full" data-action="close">返回 LINE</button></div>`;
  }finally{buttons.forEach(button=>button.disabled=false);if(submit)submit.textContent=label;}
}
document.addEventListener('input',event=>{
  const key=event.target.dataset.feedback;
  if(['matter','date','place'].includes(key))feedbackState[key]=event.target.value;
});
document.addEventListener('click',event=>{
  const action=event.target.closest('button')?.dataset.action;
  if(window.mrgSending||!action)return;
  if(action==='review'){
    if(!feedbackState.matter.trim())return showFeedbackError('請填寫申訴事項或想告訴我們的意見。');
    feedbackState.view='review';renderFeedback();
  }else if(action==='edit'){feedbackState.view='form';renderFeedback();}
  else if(action==='submit')sendFeedback();
  else if(action==='close')closeMrgPage();
});
window.MrgPageReady.then(ready=>{if(ready)renderFeedback();});
