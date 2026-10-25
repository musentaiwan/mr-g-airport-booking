'use strict';
(function(root){
  const LEDGER_KEY='mrg_booking_delivery_v1';
  // Chat cards keep their readable cream-and-gold palette independently of the website theme.
  const CARD_COLORS=Object.freeze({header:'#EDE1CB',body:'#FFFCF5',footer:'#F7F1E6',text:'#493927',muted:'#6D5B3F',gold:'#715020',line:'#D8C8AE'});
  const cardStyles=()=>({header:{backgroundColor:CARD_COLORS.header},body:{backgroundColor:CARD_COLORS.body},footer:{backgroundColor:CARD_COLORS.footer}});
  function contextReady(sdk){
    try{return !!sdk&&sdk.isInClient()&&sdk.isLoggedIn()&&sdk.getContext()?.type==='utou'&&typeof sdk.sendMessages==='function';}catch{return false;}
  }
  function makeCard(payloads,brand){
    const text=(value,size='md',color=CARD_COLORS.text,bold=false)=>({type:'text',text:String(value||'無'),size,color,weight:bold?'bold':'regular',wrap:true});
    const row=(label,value)=>({type:'box',layout:'horizontal',spacing:'md',contents:[{...text(label,'sm',CARD_COLORS.muted),flex:2},{...text(value),flex:6}]});
    const bubbles=payloads.map((p,i)=>({type:'bubble',size:'mega',styles:cardStyles(),header:{type:'box',layout:'vertical',spacing:'sm',contents:[text('Mr. G ( Gary ) Premium Shuttle Service™','sm',CARD_COLORS.gold,true),text(`${p.type}預約需求`,'xl',CARD_COLORS.text,true),text(`第 ${i+1} 趟 · 待客服確認`,'sm',CARD_COLORS.muted)]},body:{type:'box',layout:'vertical',spacing:'md',contents:[text(`${p.date}  ${p.booking_time}`,'xl',CARD_COLORS.text,true),text(p.type==='送機'?'上車時間（台北時間）':'航班落地時間（台北時間）','sm',CARD_COLORS.muted),{type:'separator',color:CARD_COLORS.line},row('乘車人',p.userName),row('電話',p.phone),row('航班',p.flight),row('起點',p.start),row('終點',p.end),row('人數',p.pax),row('行李',p.luggage),row('座椅',p.seat)]},footer:{type:'box',layout:'vertical',contents:[text('加點及特殊需求請見隨附的完整文字摘要。','sm',CARD_COLORS.muted),text('尚未完成訂車，請等候客服確認。','sm',CARD_COLORS.muted)]}}));
    return {type:'flex',altText:`${brand}｜${payloads.map(p=>p.type+' '+p.date).join('／')}｜預約需求待確認`,contents:bubbles.length===1?bubbles[0]:{type:'carousel',contents:bubbles}};
  }
  function splitText(text){
    const chunks=[];
    while(text.length){let end=Math.min(text.length,4500);if(end<text.length){const split=text.lastIndexOf('\n',end);if(split>2000)end=split+1;if(/[\uD800-\uDBFF]/.test(text[end-1]))end--;}
      chunks.push({type:'text',text:text.slice(0,end)});text=text.slice(end);
    }
    return chunks;
  }
  function messagesFor(payloads,summary,brand){
    const messages=[makeCard(payloads,brand),...splitText(summary)];
    if(messages.length>5)throw new Error('SUMMARY_TOO_LONG');
    return messages;
  }
  function messagesForContent(content,brand){
    if(!content?.sections?.length)throw Error('EMPTY_CONTENT');
    const text=(value,size='md',color=CARD_COLORS.text,bold=false)=>({type:'text',text:String(value),size,color,weight:bold?'bold':'regular',wrap:true});
    const footer=content.kind==='booking'?'尚未完成訂車，請等候客服確認。':'已收到您提供的資料，我們會盡快了解並與您聯繫。';
    const bubble=contents=>({type:'bubble',size:'mega',styles:cardStyles(),header:{type:'box',layout:'vertical',spacing:'sm',contents:[text('Mr. G ( Gary ) Premium Shuttle Service™','xs',CARD_COLORS.gold,true),text(content.service+(content.kind==='booking'?'預約需求':''),'xl',CARD_COLORS.text,true)]},body:{type:'box',layout:'vertical',spacing:'md',contents},footer:{type:'box',layout:'vertical',contents:[text(footer,'sm',CARD_COLORS.muted)]}});
    const bytes=value=>new TextEncoder().encode(JSON.stringify(value)).length;
    const nodes=content.sections.flatMap(section=>[text(section.title,'md',CARD_COLORS.gold,true),...section.rows.map(([label,value])=>text(label+'：'+value))]);
    const bubbles=[];let current=[];
    for(const node of nodes){if(current.length&&bytes(bubble([...current,node]))>26000){bubbles.push(bubble(current));current=[];}current.push(node);if(bytes(bubble(current))>28000)throw Error('CARD_TOO_LONG');}
    if(current.length)bubbles.push(bubble(current));
    const messages=[];let group=[];
    const message=items=>({type:'flex',altText:`${brand}｜${content.service}｜${content.kind==='booking'?'預約需求待確認':'資料已送出'}`,contents:items.length===1?items[0]:{type:'carousel',contents:items}});
    for(const b of bubbles){if(group.length&&bytes(message([...group,b]))>48000){messages.push(message(group));group=[];}group.push(b);}
    if(group.length)messages.push(message(group));
    if(messages.length>5)throw Error('CARD_TOO_LONG');
    return messages;
  }
  async function sendOnce({sdk,messages,fingerprint,storage,timeoutMs=20000}){
    if(!contextReady(sdk))return {status:'not-ready'};
    let prior;
    try{prior=JSON.parse(storage.getItem(LEDGER_KEY)||'null');}catch{}
    if(prior?.fingerprint===fingerprint&&Date.now()-prior.time<86400000&&['attempting','sent','unknown'].includes(prior.status))return {status:prior.status==='sent'?'sent':'unknown',duplicate:true};
    const save=status=>{storage.setItem(LEDGER_KEY,JSON.stringify({fingerprint,status,time:Date.now()}));};
    try{save('attempting');}catch{return {status:'not-ready',code:'STORAGE_UNAVAILABLE'};}
    let timer;
    try{
      await Promise.race([sdk.sendMessages(messages),new Promise((_,reject)=>{timer=setTimeout(()=>reject({code:'CLIENT_TIMEOUT'}),timeoutMs);})]);
      try{save('sent');}catch{}return {status:'sent'};
    }catch(error){
      const code=String(error?.code||'');
      const status=['400','401','403','INVALID_ARGUMENT','UNAUTHORIZED','FORBIDDEN'].includes(code)?'rejected':'unknown';
      try{save(status);}catch{}return {status};
    }finally{clearTimeout(timer);}
  }
  const api=Object.freeze({contextReady,makeCard,messagesFor,messagesForContent,splitText,sendOnce});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LineBooking=api;
})(typeof globalThis!=='undefined'?globalThis:this);
