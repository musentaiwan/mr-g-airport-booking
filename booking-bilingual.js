'use strict';
// Decorate UI copy only. The observer also covers return trips, validation and submission states.
// Disconnect during decoration so our own captions never cause a render loop.
document.addEventListener('DOMContentLoaded',()=>{
  const english=window.MrgBookingEnglish,owned='[data-mrg-en]',selector='h2,h3,label,button,a,summary,p,small,dt,[data-en],.choice-title,.choice-sub,.field-label,.hint,.tag,.step,.check>span,.line-status,.error-banner,.memory-status,.route-label,.mini-summary strong,.check-copy,.policy-copy';
  const directText=el=>[...el.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join(' ').trim().replace(/\s+/g,' ');
  function caption(el,text){
    let en=[...el.children].find(n=>n.dataset.mrgEn==='copy');
    if(!text){en?.remove();return;}
    if(!en){en=document.createElement('span');en.className='en-caption';en.lang='en';en.dataset.mrgEn='copy';el.append(en);}
    if(en.textContent!==text)en.textContent=text;
  }
  function decorate(){
    observer.disconnect();
    document.querySelectorAll(selector).forEach(el=>{
      if(el.closest(owned)||el.matches('.optional,.required')||el.closest('[data-customer-copy]'))return;
      const source=directText(el);
      let translated=el.hasAttribute('data-en')?el.dataset.en:english.translate(source);
      if(translated&&el.querySelector(':scope > .optional'))translated+=' (optional)';
      caption(el,translated);
    });
    // Native select menus cannot contain styled second lines. Keep Chinese values intact,
    // show bilingual choices in the menu, and show the selected English below the control.
    document.querySelectorAll('select').forEach(select=>{
      [...select.options].forEach(option=>{
        const source=option.dataset.zh||option.textContent;
        if(!option.dataset.zh){option.value=option.value;option.dataset.zh=source;}
        const place=window.MrgPlaceNames?.[source];
        const en=english.translate(source)||place||'';
        option.dataset.en=en;
        const label=en?source+' · '+en:source;
        if(option.textContent!==label)option.textContent=label;
      });
      let helper=document.getElementById(select.id+'-english');
      if(!helper){helper=document.createElement('span');helper.id=select.id+'-english';helper.className='en-caption select-english';helper.dataset.mrgEn='select';helper.lang='en';
        const wrap=document.createElement('div');wrap.className='select-wrap';select.before(wrap);wrap.append(select,helper);
        select.setAttribute('aria-describedby',[select.getAttribute('aria-describedby'),helper.id].filter(Boolean).join(' '));}
      helper.textContent=select.selectedOptions[0]?.dataset.en||'';
    });
    document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(input=>{
      const text=english.translate(input.placeholder);if(!text)return;
      const id=input.id?input.id+'-example-en':null;
      let hint=id?document.getElementById(id):input.nextElementSibling?.matches('[data-mrg-en="example"]')?input.nextElementSibling:null;
      if(!hint){hint=document.createElement('span');hint.className='en-caption example-english';hint.dataset.mrgEn='example';hint.lang='en';if(id)hint.id=id;
        input.after(hint);if(id)input.setAttribute('aria-describedby',[input.getAttribute('aria-describedby'),id].filter(Boolean).join(' '));}
      if(hint.textContent!==text)hint.textContent=text;
    });
    document.querySelectorAll('datalist option').forEach(option=>{const en=english.translate(option.value);if(en)option.label=en;});
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  }
  const observer=new MutationObserver(decorate);
  decorate();
  document.addEventListener('change',decorate);
});
