'use strict';
// Keep one contact entry. Only an optional different return passenger can edit it.
const baseMountLegs=mountLegs,baseGoStepComplete=goStep,baseSetBookingMode=setBookingMode,baseSetError=setError;
const baseCopyReturnDefaults=copyReturnDefaults;
copyReturnDefaults=function(){const t=opposite(state.first),p=readLeg(t);const hasTripInput=['date','time','flight','city','dist','detail','airport','pickupNote','memo','specialNote'].some(key=>p[key])||p.stops.length||p.special.length||p.adult!==1||p.child!==0||p.luggage.some(n=>n!==0)||p.seats.some(n=>n!==0);if(hasTripInput)return;state.initialized[t]=false;baseCopyReturnDefaults();};
function syncPrimaryContact(t){const c=getContact();$(t+'-rider').value=c.riderName;$(t+'-phone').value=c.riderPhone;state.inherited[t]={rider:c.riderName,phone:c.riderPhone};state.initialized[t]=true;}
function hideRepeatedRider(t){const rider=$(t+'-rider'),phone=$(t+'-phone');const card=rider.closest('.card');card.querySelector('h3').textContent='乘車人數';card.querySelector('.index').textContent='PASSENGERS';const fields=document.createElement('div');fields.id=t+'-rider-override';fields.hidden=true;fields.className='rider-override';rider.closest('.field').before(fields);fields.append(rider.closest('.field'),phone.closest('.field'));const control=document.createElement('div');control.id=t+'-rider-control';control.hidden=true;control.innerHTML=`<label class="check" style="margin:10px 0 16px"><input id="${t}-different-rider" type="checkbox"><span>這一趟的乘車人不同</span></label>`;fields.before(control);$(t+'-different-rider').onchange=()=>{const changed=$(t+'-different-rider').checked;fields.hidden=!changed;if(!changed)syncPrimaryContact(t);};}
mountLegs=function(){baseMountLegs();if(!$(state.first+'-rider-override'))return;syncPrimaryContact(state.first);for(const t of ['dep','arr']){const primary=t===state.first;$(t+'-rider-control').hidden=primary;$(t+'-rider-override').hidden=primary||!$(t+'-different-rider').checked;}};
function contactLabels(){baseSetBookingMode(state.mode);if(state.service==='business'){$('contact-name-label').innerHTML='負責人姓名／稱呼<span class="required">*</span>';$('contact-phone-label').innerHTML='負責人聯絡電話<span class="required">*</span>';}const biz=state.service==='business';const company=$('company-card');company.classList.remove('card');company.style.marginBottom='20px';$('contact-name').closest('.card').prepend(company);company.hidden=!biz;$('company-use').checked=biz;$('company-use').closest('label').hidden=true;$('company-fields').hidden=!biz;$('company-tax').closest('.field').hidden=true;document.querySelector('label[for="company-name"]').innerHTML='公司／商號名稱<span class="optional">選填</span>';$('company-name').required=false;}
setBookingMode=function(mode){baseSetBookingMode(mode);if($('company-card'))contactLabels();};
goStep=function(step){baseGoStepComplete(step);if($('company-card'))contactLabels();if(step===2){if(state.service==='airport')mountLegs();else{syncPrimaryContact(serviceLeg());$('general-title').nextElementSibling.textContent=state.service==='business'?'請填用車日期時間、人數與商務行程。':'請填行程時間、地點、人數、行李與特殊需求。';}}};
setError=function(message,input){if(input&&/^((dep|arr|tour|biz)-(rider|phone))$/.test(input.id)){const t=input.id.split('-')[0];if(t==='arr'||t==='dep'){if(t===state.first){goStep(1);input=$(state.mode==='other'?(input.id.endsWith('phone')?'rider-phone':'rider-name'):(input.id.endsWith('phone')?'contact-phone':'contact-name'));}else{$(t+'-different-rider').checked=true;$(t+'-rider-override').hidden=false;}}else{goStep(1);input=$(state.mode==='other'?(input.id.endsWith('phone')?'rider-phone':'rider-name'):(input.id.endsWith('phone')?'contact-phone':'contact-name'));}}return baseSetError(message,input);};
validateCompany=function(){return true;};
companyRows=function(){const name=$('company-name').value.trim();return state.service==='business'&&name?[['公司',name]]:[];};
const richGeneralRows=generalRows,richValidateGeneral=validateGeneral;
validateGeneral=function(){if(state.service!=='business')return richValidateGeneral();const p=readLeg('biz');if(!validDate(p.date))return setError('請填寫有效的用車日期。',$('biz-date'));if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time)||new Date(p.date+'T'+p.time+':00+08:00')<new Date())return setError('請填寫尚未過期的用車時間。',$('biz-time'));if(!Number.isInteger(p.adult)||!Number.isInteger(p.child)||p.adult<1||p.child<0||p.adult+p.child>30)return setError('請填寫實際乘車人數，至少 1 位大人。',$('biz-pax-0'));if(!$('biz-itinerary').value.trim())return setError('請填寫商務行程。',$('biz-itinerary'));return validateCompany();};
generalRows=function(){if(state.service!=='business')return richGeneralRows().filter(([label])=>label!=='用車方式'&&(state.mode==='other'||!['乘車人','電話'].includes(label)));const p=readLeg('biz'),c=getContact();return [['服務','商務用車'],['用車日期',p.date],['用車時間',p.time+'（台北時間）'],...(state.mode==='other'?[['實際乘車人',c.riderName],['乘車人電話',c.riderPhone]]:[]),['人數',`${p.adult} 大 ${p.child} 小`],['商務行程',$('biz-itinerary').value.trim()],...(p.memo?[['備註',p.memo]]:[])];};
const baseReviewComplete=renderReview;
renderReview=function(){baseReviewComplete();if(state.service==='business')$('review-contact').querySelector('h3').textContent='公司負責聯絡人';};
document.addEventListener('DOMContentLoaded',()=>{
  for(const t of ['dep','arr','tour','biz'])hideRepeatedRider(t);
  const biz=$('bizSection'),cards=[...biz.querySelectorAll('.card')];
  // Business service follows the original LINE brief: time, company/contact, people, itinerary, notes.
  $('biz-kind').closest('.field').hidden=true;$('biz-airport-direction').hidden=true;
  cards[0].querySelector('.card-head h3').textContent='用車日期與時間';
  const itineraryInput=$('biz-itinerary'),itinerary=itineraryInput.closest('.field');
  itineraryInput.placeholder='請說明接待、會議或商務行程；可一併註明用車地點與時間安排。';
  const itineraryCard=document.createElement('div');itineraryCard.className='card';itineraryCard.append(itinerary);cards[2].after(itineraryCard);
  cards[1].hidden=true;cards[3].hidden=true;
  contactLabels();
});
