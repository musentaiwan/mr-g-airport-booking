'use strict';

// Pure booking helpers, shared by the browser and node:test.
(function(root){
  function isPhone(value){
    const phone=String(value).trim().replace(/[\s().-]/g,'');
    return /^09\d{8}$/.test(phone)||/^0[2-8]\d{7,8}$/.test(phone)||/^\+[1-9]\d{7,14}$/.test(phone);
  }
  function validDate(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const date=new Date(value+'T00:00:00+08:00');
    if(Number.isNaN(date.valueOf()))return false;
    return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)===value;
  }
  function returnIsLater(first,second){
    return new Date(second.date+'T'+second.time+':00+08:00')>new Date(first.date+'T'+first.time+':00+08:00');
  }
  function buildSummary(legs,brand){
    if(!legs.length)throw new Error('At least one trip is required');
    const rows=[`【${brand}｜機場接送預約需求】`];
    const contact=legs[0];
    if(contact.bookingMode==='other')rows.push(`代訂聯絡人：${contact.bookingContactName}`,`代訂電話：${contact.bookingContactPhone}`);
    legs.forEach((leg,index)=>{
      rows.push('',`第 ${index+1} 趟｜${leg.type}`,`日期：${leg.date}`,`${leg.type==='送機'?'上車':'航班落地'}時間：${leg.booking_time}（台北時間）`,`乘車人：${leg.userName}`,`電話：${leg.phone}`,`航班：${leg.flight}`,`起點：${leg.start}`);
      (leg.stops||[]).forEach((stop,i)=>rows.push(`加點 ${i+1}：${stop}`));
      rows.push(`終點：${leg.end}`,`人數：${leg.pax}`,`行李：${leg.luggage}`,`兒童座椅：${leg.seat}`);
      if(leg.pickupNote)rows.push(`上車補充：${leg.pickupNote}`);
      if(leg.special?.length)rows.push(`特殊行李：${leg.special.join('、')}`,`特殊行李說明：${leg.specialNote}`);
      if(leg.memo)rows.push(`備註：${leg.memo}`);
    });
    rows.push('','請協助確認車型、報價與接送安排。','此為預約需求，尚未完成訂車。');
    return rows.join('\n');
  }
  function lineHandoff(officialId,text){
    if(!/^@[a-zA-Z0-9._-]+$/.test(officialId))throw new Error('Invalid official LINE ID');
    const base='https://line.me/R/oaMessage/'+encodeURIComponent(officialId);
    const proposed=base+'/?'+encodeURIComponent(text);
    // Conservative fallback for long URLs; never truncate a customer's itinerary.
    const requiresCopy=proposed.length>7000||text.length>4500;
    return {url:requiresCopy?base:proposed,requiresCopy};
  }
  const api=Object.freeze({isPhone,validDate,returnIsLater,buildSummary,lineHandoff});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.BookingCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
