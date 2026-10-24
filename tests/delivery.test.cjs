const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const line=require('../line-service.js');
const source=fs.readFileSync(path.join(__dirname,'../delivery.js'),'utf8');
const content={kind:'booking',service:'商務用車',sections:[{title:'聯絡資料',rows:[['姓名','測試'],['電話','0900000000']]},{title:'行程',rows:[['商務行程','會議接送']]}]};
function setup({ready=true,receipt={status:'accepted',receiptId:'test-receipt'},cardStatus='sent'}={}){
  const calls=[];const sdk={init:async()=>{},getIDToken:()=> 'private-test-token',getDecodedIDToken:()=>({sub:'test-user'})};
  const context={window:{liff:sdk},liff:sdk,location:{hostname:'musentaiwan.github.io'},MRG_CONFIG:{liffId:'dedicated-liff',brandName:'Mr.G',notificationEndpoint:'dedicated-endpoint'},sessionStorage:{},
    LineBooking:{contextReady:()=>ready,messagesForContent:line.messagesForContent,sendOnce:async request=>{calls.push({type:'card',request});return {status:cardStatus};}},
    MrgNotification:{prepare:async(c,user)=>{calls.push({type:'prepare',user});return {requestId:'fixed-request',hash:'stable-hash'};},submit:async request=>{calls.push({type:'owner',request});return receipt;}}};
  vm.createContext(context);vm.runInContext(source,context);return {api:context.window.MrgDelivery,calls};
}
test('owner rejection or unknown status does not send a misleading customer confirmation',async()=>{
  for(const code of ['AUTH_REQUIRED','TEST_ONLY','UNKNOWN','RATE_LIMIT']){const s=setup({receipt:{status:'error',code}});assert.equal((await s.api.send(content)).code,code);assert.equal(s.calls.filter(c=>c.type==='card').length,0);}
});
test('owner gets complete details before the customer receives only cards',async()=>{
  const s=setup();const result=await s.api.send(content);assert.equal(result.status,'accepted');assert.equal(result.cardStatus,'sent');
  assert.deepEqual(s.calls.map(c=>c.type),['prepare','owner','card']);
  assert.deepEqual(s.calls[1].request.request.sections,content.sections);
  assert.ok(s.calls[2].request.messages.every(m=>m.type==='flex'));
  assert.equal(s.calls[1].request.request.idToken,'private-test-token');
  assert.doesNotMatch(JSON.stringify(s.calls[2].request.messages),/private-test-token/);
});
test('customer card failure retains the successful owner notification result',async()=>{
  const s=setup({cardStatus:'unknown'}),result=await s.api.send(content);assert.equal(result.status,'accepted');assert.equal(result.cardStatus,'unknown');
});
test('ordinary browser context does not create a notification',async()=>{
  const s=setup({ready:false});assert.equal((await s.api.send(content)).code,'LINE_CONTEXT');assert.equal(s.calls.length,0);
});
test('a simultaneous second click is blocked even while LINE initialization is pending',async()=>{
  const s=setup(),first=s.api.send(content),second=s.api.send(content);
  assert.equal((await second).code,'BUSY');assert.equal((await first).status,'accepted');assert.equal(s.calls.filter(c=>c.type==='owner').length,1);
});
test('progress changes to card only after owner acceptance; observer failures cannot break delivery',async()=>{
  const s=setup(),phases=[];await s.api.send(content,phase=>{phases.push(phase);if(phase==='card')assert.ok(s.calls.some(c=>c.type==='owner'));});
  assert.deepEqual(phases,['sending','card']);
  const failed=setup({receipt:{status:'error',code:'UNKNOWN'}}),rejected=[];await failed.api.send(content,p=>rejected.push(p));assert.deepEqual(rejected,['sending']);
  assert.equal((await setup().api.send(content,()=>{throw Error('UI callback');})).status,'accepted');
});
