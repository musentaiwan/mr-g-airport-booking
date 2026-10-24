const {test}=require('node:test');
const assert=require('node:assert/strict');
const line=require('../line-service.js');
const core=require('../booking-core.js');
const leg={type:'送機',date:'2027-01-05',booking_time:'08:30',userName:'測試乘客',phone:'0900000000',flight:'BR123',start:'台北測試地點',end:'桃園第一航廈',stops:['測試加點'],pax:'2大1小',luggage:'20吋x2',seat:'增高墊x1',special:['嬰兒車'],specialNote:'可折疊 1 件',memo:'測試備註'};
function setup(send=async()=>{}){
  const values=new Map();let calls=0;
  return {storage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},sdk:{isInClient:()=>true,isLoggedIn:()=>true,getContext:()=>({type:'utou'}),sendMessages:async messages=>{calls++;return send(messages);}},calls:()=>calls,values};
}
const request={messages:[{type:'text',text:'測試用，不會實際送出'}],fingerprint:'test-booking-fingerprint'};
test('LINE messages contain a branded card and all itinerary details',()=>{
  const legs=[leg,{...leg,type:'接機',date:'2027-01-10'}];
  const summary=core.buildSummary(legs,'Mr.G尊榮接送');
  const messages=line.messagesFor(legs,summary,'Mr.G尊榮接送');
  assert.equal(messages.length,2);assert.equal(messages[0].type,'flex');
  assert.equal(messages[0].contents.type,'carousel');assert.equal(messages[0].contents.contents.length,2);
  assert.equal(messages[1].text,summary);assert.match(JSON.stringify(messages[0]),/Mr.G尊榮接送/);
});
test('long text keeps every character and stays inside LINE message limits',()=>{
  const text='行程'.repeat(2249)+'😀'+'備註'.repeat(2400);
  const chunks=line.splitText(text);assert.equal(chunks.map(m=>m.text).join(''),text);
  for(const chunk of chunks){assert.ok(chunk.text.length<=4500);assert.doesNotMatch(chunk.text,/[\uD800-\uDBFF]$/);}
  assert.throws(()=>line.messagesFor([leg],'a'.repeat(18001),'Mr.G'),/SUMMARY_TOO_LONG/);
});
test('external browser, logged-out sessions and group contexts cannot send',async()=>{
  for(const override of [{isInClient:()=>false},{isLoggedIn:()=>false},{getContext:()=>({type:'group'})},{getContext:()=>null}]){
    const env=setup();Object.assign(env.sdk,override);
    assert.equal((await line.sendOnce({...env,...request})).status,'not-ready');assert.equal(env.calls(),0);
  }
});
test('successful delivery is sent once and duplicate attempts are suppressed',async()=>{
  const env=setup();assert.equal((await line.sendOnce({...env,...request})).status,'sent');
  assert.deepEqual(await line.sendOnce({...env,...request}),{status:'sent',duplicate:true});assert.equal(env.calls(),1);
  assert.doesNotMatch([...env.values.values()].join(''),/測試用|0900000000/);
});
test('a second click while sending does not send another message',async()=>{
  let complete;const env=setup(()=>new Promise(resolve=>{complete=resolve;}));
  const pending=line.sendOnce({...env,...request});
  assert.deepEqual(await line.sendOnce({...env,...request}),{status:'unknown',duplicate:true});
  complete();assert.equal((await pending).status,'sent');assert.equal(env.calls(),1);
});
test('timeout is shown as uncertain and is not automatically retried',async()=>{
  const env=setup(()=>new Promise(()=>{}));
  assert.equal((await line.sendOnce({...env,...request,timeoutMs:5})).status,'unknown');
  assert.deepEqual(await line.sendOnce({...env,...request}),{status:'unknown',duplicate:true});assert.equal(env.calls(),1);
});
test('explicit permission rejection is never reported as success',async()=>{
  const env=setup(async()=>{throw {code:'FORBIDDEN'};});
  assert.equal((await line.sendOnce({...env,...request})).status,'rejected');
});
test('unexpected network failure is uncertain rather than a false success',async()=>{
  const env=setup(async()=>{throw new Error('network unavailable');});
  assert.equal((await line.sendOnce({...env,...request})).status,'unknown');
});
test('integrated customer message contains only cards and every supplied field',()=>{
  const content={kind:'booking',service:'機場接送',sections:[{title:'聯絡資料',rows:[['聯絡人','王小姐'],['電話','0900000000']]},{title:'第一趟送機',rows:[['行李','20 吋 1 件、28–30 吋 2 件'],['加點 1','台北測試地點'],['特殊行李','可折疊嬰兒車 1 台'],['兒童座椅','增高墊 1 張'],['備註','測試備註']]},{title:'第二趟接機',rows:[['航班','BR123'],['乘車人','陳先生']]}]};
  const messages=line.messagesForContent(content,'Mr.G尊榮接送');
  assert.ok(messages.every(m=>m.type==='flex'));const json=JSON.stringify(messages);
  for(const section of content.sections)for(const [label,value] of section.rows)assert.ok(json.includes(label+'：'+value));
  assert.doesNotMatch(json,/隨附.*文字摘要/);
});
test('long customer cards split without losing content or exceeding LINE limits',()=>{
  const rows=Array.from({length:18},(_,i)=>['項目'+i,('長行程'+i).repeat(180)]);
  const messages=line.messagesForContent({kind:'feedback',service:'意見申訴',sections:[{title:'意見',rows}]},'Mr.G');
  assert.ok(messages.length<=5);for(const m of messages)assert.ok(Buffer.byteLength(JSON.stringify(m))<50000);
  for(const [key,value]of rows)assert.ok(JSON.stringify(messages).includes(key+'：'+value));
});
test('customer cards never send when duplicate-prevention storage cannot be written',async()=>{
  const env=setup();env.storage.setItem=()=>{throw Error('unavailable');};
  assert.equal((await line.sendOnce({...env,...request})).code,'STORAGE_UNAVAILABLE');assert.equal(env.calls(),0);
});
