const state={view:'home',service:'other',error:'',common:{name:'',phone:''},data:{other:{date:'',time:'',kind:'市區交通接駁',itinerary:''}}};
const $=id=>document.getElementById(id), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function value(key,common=false){return(common?state.common:state.data[state.service])[key]??'';}
function field(key,label,options={}){const common=options.common||false,v=value(key,common),attrs=`data-key="${key}" data-scope="${common?'common':'trip'}" id="f-${key}"`;let input;if(options.options){input=`<select ${attrs}>${options.options.map(x=>`<option${String(v)===x?' selected':''}>${esc(x)}</option>`).join('')}</select>`;}else if(options.area){input=`<textarea ${attrs} maxlength="${options.max||600}" placeholder="${esc(options.placeholder||'')}">${esc(v)}</textarea>`;}else{input=`<input ${attrs} type="${options.type||'text'}" value="${esc(v)}" maxlength="${options.max||160}" ${options.type==='number'?'min="0" step="1" inputmode="numeric"':''} placeholder="${esc(options.placeholder||'')}" autocomplete="off">`;}
return `<label class="field" for="f-${key}"><span>${label}${options.optional?'<small class="optional">選填</small>':'<b class="req">*</b>'}</span>${input}</label>`;}
function check(key,label,common=false){return `<label class="check"><input type="checkbox" data-key="${key}" data-scope="${common?'common':'trip'}" ${value(key,common)?'checked':''}><span>${label}</span></label>`;}
const card=(title,body,n='')=>`<div class="card"><div class="card-title"><span class="number">${n}</span>${title}</div>${body}</div>`;
const action=(text,command,primary=true)=>`<button class="button ${primary?'primary':''}" data-act="${command}">${text}</button>`;
function header(title,sub,n){return `<div class="brand-small"><span class="brand-logo">Mr.G<sup class="brand-trademark">™</sup></span><span>尊榮接送</span><small class="brand-english">Mr. G ( Gary ) Premium Shuttle Service</small></div><h2>${title}</h2><p class="sub">${sub}</p>`;}
function other(){state.service='other';const d=state.data.other;return header('其他服務，也歡迎聊聊。','市區接駁、貨物接送與結婚禮車，歡迎留下需求。')+card('告訴我們需求',field('kind','服務項目',{options:['市區交通接駁','貨物接送','結婚禮車','其他需求']})+`<div class="grid2">${field('date','預計日期',{type:'date'})}${field('time','預計時間',{type:'time'})}</div>`+field('itinerary','需求說明',{area:true,placeholder:'請說明起訖地點、服務內容；貨物請補充件數與尺寸。'})+field('name','聯絡人',{common:true})+field('phone','聯絡電話',{common:true,type:'tel'}))+`<div class="note">此處先收集需求，服務內容與安排由客服個別確認。</div><div class="action-row">${action('核對接洽內容 →','to-other-review')}</div>`;}
function showOtherReview(){const d=state.data.other,c=state.common;return header('核對您的接洽需求','請確認聯絡方式與需求內容。')+`<div class="plain">${esc('【Mr.G｜其他服務接洽】\n項目：'+d.kind+'\n日期時間：'+d.date+' '+d.time+'\n聯絡人：'+c.name+'\n電話：'+c.phone+'\n需求：'+d.itinerary)}</div><div class="action-row"><button class="button" data-view="other">返回修改</button><button class="button primary" data-act="other-submit">送出需求</button></div>`;}
function go(scene){
  if(window.mrgSending)return;
  state.view=scene==='otherReview'?'otherReview':'other';
  $('app').innerHTML=`<div class="screen-content">${state.view==='otherReview'?showOtherReview():other()}</div>`;
  $('screen').scrollTop=0;
}
function fail(text){const content=$('app').querySelector('.screen-content');content?.querySelector('.error')?.remove();content?.insertAdjacentHTML('afterbegin',`<div class="error" role="alert">${esc(text)}</div>`);$('screen').scrollTop=0;return false;}
document.addEventListener('input',e=>{const el=e.target;if(el.dataset.key){const target=el.dataset.scope==='common'?state.common:state.data.other;target[el.dataset.key]=el.value;}});
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||window.mrgSending)return;
  if(b.dataset.view){go(b.dataset.view);return;}
  if(b.dataset.act==='to-other-review'){
    const d=state.data.other,c=state.common;
    if(!d.date||!d.time||!d.itinerary.trim()||!c.name.trim()||!/^\+?[\d\s()-]{8,22}$/.test(c.phone))return fail('請填妥日期、時間、需求、聯絡人及完整電話。');
    go('otherReview');
  }else if(b.dataset.act==='other-submit')submitServiceRequest('other');
});
window.MrgPageReady.then(ready=>{if(ready)go('other');});
