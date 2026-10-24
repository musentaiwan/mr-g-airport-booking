'use strict';
(function(root){
  function googleOrigin(origin){
    try { const url=new URL(origin); return url.protocol==='https:' && (url.hostname==='script.google.com' || url.hostname==='script.googleusercontent.com' || /^[a-z0-9-]+-script\.googleusercontent\.com$/.test(url.hostname)); } catch { return false; }
  }
  function isEndpoint(value){return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(value||'');}
  function submitViaFrame({endpoint,request,timeoutMs=45000}){
    if(!isEndpoint(endpoint))return Promise.resolve({status:'error',code:'NOT_CONFIGURED'});
    return new Promise(resolve=>{
      const nonce=crypto.randomUUID();
      const frame=document.createElement('iframe'); frame.name='mrg-notify-'+nonce;frame.hidden=true;frame.title='傳送預約';frame.referrerPolicy='no-referrer';
      const form=document.createElement('form');form.method='POST';form.action=endpoint;form.target=frame.name;form.hidden=true;form.acceptCharset='UTF-8';
      const field=document.createElement('input');field.type='hidden';field.name='request';field.value=JSON.stringify({...request,nonce});form.append(field);
      let timer,done=false;
      const finish=result=>{if(done)return;done=true;clearTimeout(timer);window.removeEventListener('message',receive);form.remove();frame.remove();resolve(result);};
      const receive=event=>{const data=event.data;if(!googleOrigin(event.origin)||data?.type!=='mrg-notification-result'||data.nonce!==nonce)return;
        if(data.result?.status==='accepted'&&typeof data.result.receiptId==='string')finish({status:'accepted',receiptId:data.result.receiptId});
        else if(data.result?.status==='error')finish({status:'error',code:String(data.result.code||'UNAVAILABLE')});};
      window.addEventListener('message',receive);document.body.append(frame,form);
      timer=setTimeout(()=>finish({status:'error',code:'UNKNOWN'}),timeoutMs);
      try{form.submit();}catch{finish({status:'error',code:'UNAVAILABLE'});}
    });
  }
  function receiptResult(data,nonce){
    if(data?.type!=='mrg-notification-result'||data.nonce!==nonce)return null;
    if(data.result?.status==='accepted'&&typeof data.result.receiptId==='string')return {status:'accepted',receiptId:data.result.receiptId};
    if(data.result?.status==='error')return {status:'error',code:String(data.result.code||'UNAVAILABLE')};
    return null;
  }
  async function submit({endpoint,request,timeoutMs=45000,transport='auto'}){
    if(!isEndpoint(endpoint))return {status:'error',code:'NOT_CONFIGURED'};
    if(transport==='iframe'||typeof fetch!=='function')return submitViaFrame({endpoint,request,timeoutMs});
    const nonce=crypto.randomUUID(),controller=new AbortController(),started=Date.now();
    let timer;
    try{
      timer=setTimeout(()=>controller.abort(),timeoutMs);
      const response=await fetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',redirect:'follow',signal:controller.signal,
        body:new URLSearchParams({request:JSON.stringify({...request,nonce,responseMode:'json'})})});
      if(!response.ok)throw Error('UNREADABLE_RESPONSE');
      const result=receiptResult(await response.json(),nonce);
      if(!result)throw Error('INVALID_RECEIPT');
      return result;
    }catch{
      if(controller.signal.aborted)return {status:'error',code:'UNKNOWN'};
      const remaining=timeoutMs-(Date.now()-started);
      if(transport==='fetch'||remaining<1000)return {status:'error',code:'UNKNOWN'};
      // A browser can block a response after the server accepted it. Reuse the same
      // request ID so the existing server receipt/LINE retry key prevents another push.
      return await submitViaFrame({endpoint,request,timeoutMs:remaining});
    }finally{clearTimeout(timer);}
  }
  async function fingerprint(value){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');}
  async function prepare(content,userId,storage){
    const hash=await fingerprint({content,userId}); const key='mrg_request_'+hash;
    let prior;try{prior=JSON.parse(storage.getItem(key)||'null');}catch{}
    if(prior?.requestId)return {key,hash,...prior};
    const request={requestId:crypto.randomUUID(),created:Date.now(),status:'pending'};
    // Fail before sending if the duplicate-prevention record cannot be retained.
    storage.setItem(key,JSON.stringify(request));
    return {key,hash,...request};
  }
  const api=Object.freeze({submit,prepare,fingerprint,googleOrigin,isEndpoint,receiptResult});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MrgNotification=api;
})(typeof globalThis!=='undefined'?globalThis:this);
