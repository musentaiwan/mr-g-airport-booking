'use strict';
(function(root){
  const LEDGER_KEY='mrg_booking_delivery_v1';
  function contextReady(sdk){
    try{return !!sdk&&sdk.isInClient()&&sdk.isLoggedIn()&&sdk.getContext()?.type==='utou'&&typeof sdk.sendMessages==='function';}catch{return false;}
  }
  function makeCard(payloads,brand){
    const text=(value,size='sm',color='#102B3D',bold=false)=>({type:'text',text:String(value||'無'),size,color,weight:bold?'bold':'regular',wrap:true});
    const row=(label,value)=>({type:'box',layout:'horizontal',spacing:'md',contents:[{...text(label,'xs','#687579'),flex:2},{...text(value),flex:6}]});
    const bubbles=payloads.map((p,i)=>({type:'bubble',size:'mega',styles:{header:{backgroundColor:'#102B3D'},body:{backgroundColor:'#FFFEFA'},footer:{backgroundColor:'#F0E8DA'}},header:{type:'box',layout:'vertical',spacing:'sm',contents:[text(brand,'md','#E1C49B',true),text(`${p.type}預約需求`,'xl','#FFFFFF',true),text(`第 ${i+1} 趟 · 待客服確認`,'xs','#C0CCD0')]},body:{type:'box',layout:'vertical',spacing:'md',contents:[text(`${p.date}  ${p.booking_time}`,'xl','#102B3D',true),text(p.type==='送機'?'上車時間（台北時間）':'航班落地時間（台北時間）','xs','#687579'),{type:'separator',color:'#DCE2DF'},row('乘車人',p.userName),row('電話',p.phone),row('航班',p.flight),row('起點',p.start),row('終點',p.end),row('人數',p.pax),row('行李',p.luggage),row('座椅',p.seat)]},footer:{type:'box',layout:'vertical',contents:[text('加點及特殊需求請見隨附的完整文字摘要。','xs','#6D5B3F'),text('尚未完成訂車，請等候客服確認。','xs','#6D5B3F')]}}));
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
  async function sendOnce({sdk,messages,fingerprint,storage,timeoutMs=20000}){
    if(!contextReady(sdk))return {status:'not-ready'};
    let prior;
    try{prior=JSON.parse(storage.getItem(LEDGER_KEY)||'null');}catch{}
    if(prior?.fingerprint===fingerprint&&Date.now()-prior.time<86400000&&['attempting','sent','unknown'].includes(prior.status))return {status:prior.status==='sent'?'sent':'unknown',duplicate:true};
    const save=status=>{try{storage.setItem(LEDGER_KEY,JSON.stringify({fingerprint,status,time:Date.now()}));}catch{}};
    save('attempting');
    let timer;
    try{
      await Promise.race([sdk.sendMessages(messages),new Promise((_,reject)=>{timer=setTimeout(()=>reject({code:'CLIENT_TIMEOUT'}),timeoutMs);})]);
      save('sent');return {status:'sent'};
    }catch(error){
      const code=String(error?.code||'');
      const status=['400','401','403','INVALID_ARGUMENT','UNAUTHORIZED','FORBIDDEN'].includes(code)?'rejected':'unknown';
      save(status);return {status};
    }finally{clearTimeout(timer);}
  }
  const api=Object.freeze({contextReady,makeCard,messagesFor,splitText,sendOnce});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LineBooking=api;
})(typeof globalThis!=='undefined'?globalThis:this);
