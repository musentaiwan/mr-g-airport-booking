const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const crypto = require('node:crypto');
const source = fs.readFileSync(require('node:path').join(__dirname,'../apps-script/Code.gs'),'utf8');
const uid = 'U' + '1'.repeat(32), other = 'U' + '2'.repeat(32);
function setup({sender=uid, pushCode=200, pushHeaders={}, throwPush=false, authCode=200, identityOverrides={},profileName='Mr.G-Premium™接送'}={}) {
  const props = new Map(Object.entries({NOTIFY_ENABLED:'true',NOTIFY_USER_ID:uid,TEST_USER_ID:uid,MODE:'test',LINE_CHANNEL_SECRET:'fake-secret'}));
  const calls=[];
  const store = {getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v),setProperties:values=>Object.entries(values).forEach(([k,v])=>props.set(k,v)),getProperties:()=>Object.fromEntries(props),deleteProperty:k=>props.delete(k)};
  const response=(code,data,headers={})=>({getResponseCode:()=>code,getContentText:()=>JSON.stringify(data),getAllHeaders:()=>headers});
  const ctx=vm.createContext({console,PropertiesService:{getScriptProperties:()=>store},CacheService:{getScriptCache:()=>({get:()=>null,put:()=>{}})},
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
    Utilities:{getUuid:()=>crypto.randomUUID(),DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(alg,text)=>[...crypto.createHash('sha256').update(text).digest()]},
    UrlFetchApp:{fetch:(url,options)=>{calls.push({url,options});
      if(url.includes('/profile/'))return response(200,{displayName:profileName});
      if(url.endsWith('/verify'))return response(authCode,{sub:sender,aud:'2012188603',iss:'https://access.line.me',exp:Math.floor(Date.now()/1000)+3600,...identityOverrides});
      if(url.endsWith('/token'))return response(200,{access_token:'fake-access-token',expires_in:900});
      if(url.endsWith('/push')){if(throwPush)throw Error('timeout');return response(pushCode,{},pushHeaders);} throw Error('unexpected URL');
    }},
    HtmlService:{XFrameOptionsMode:{ALLOWALL:'ALLOWALL'},createHtmlOutput:text=>({text,setXFrameOptionsMode(){return this;}})},
    ContentService:{MimeType:{JSON:'application/json'},createTextOutput:text=>({text,setMimeType(mime){this.mime=mime;return this;}})}
  });
  vm.runInContext(source,ctx);
  const input={requestId:crypto.randomUUID(),nonce:crypto.randomUUID(),idToken:'test-token-'.repeat(8),kind:'booking',service:'機場接送',sections:[{title:'第一趟',rows:[['乘車人','測試旅客'],['行李','20 吋 x 1、28–30 吋 x 2'],['特殊行李','可折疊嬰兒車 x 1']]}]};
  return {ctx,props,calls,input,pushes:()=>calls.filter(c=>c.url.endsWith('/push'))};
}
test('fixed recipient ignores caller-supplied recipient and preserves all luggage details',()=>{
  const s=setup();s.input.to=other;assert.equal(s.ctx.receive_(s.input).status,'accepted');
  const payload=JSON.parse(s.pushes()[0].options.payload);assert.equal(payload.to,uid);
  assert.doesNotMatch(payload.messages[0].text,/測試通知/);
  assert.match(payload.messages[0].text,/28–30 吋 x 2/);assert.match(payload.messages[0].text,/嬰兒車 x 1/);
  assert.ok([...s.props.values()].filter(v=>v.includes('receiptId')).every(v=>!v.includes('測試旅客')));
});
test('duplicate receipt sends once; changed content cannot reuse the request ID',()=>{
  const s=setup();const first=s.ctx.receive_(s.input),second=s.ctx.receive_(s.input);
  assert.equal(second.receiptId,first.receiptId);assert.equal(second.duplicate,true);assert.equal(s.pushes().length,1);
  s.input.sections[0].rows[0][1]='different';assert.throws(()=>s.ctx.receive_(s.input),/CONFLICT/);
});
test('test mode rejects other LINE users before any push',()=>{
  const s=setup({sender:other});assert.throws(()=>s.ctx.receive_(s.input),/TEST_ONLY/);assert.equal(s.pushes().length,0);
});
test('invalid LINE identity and paused notification never send',()=>{
  const s=setup({authCode:400});assert.throws(()=>s.ctx.receive_(s.input),/AUTH_REQUIRED/);assert.equal(s.pushes().length,0);
  s.props.set('NOTIFY_ENABLED','false');assert.throws(()=>s.ctx.receive_(s.input),/PAUSED/);
});
test('missing, malformed, expired and wrong-application identity claims never send',()=>{
  for(const identityOverrides of [{exp:undefined},{exp:'invalid'},{exp:0},{aud:'another-project'},{iss:'https://untrusted.example'}]){
    const s=setup({identityOverrides});assert.throws(()=>s.ctx.receive_(s.input),/AUTH_REQUIRED/);assert.equal(s.pushes().length,0);
  }
});
test('unknown outcomes retry using the original LINE key',()=>{
  const s=setup({throwPush:true});assert.throws(()=>s.ctx.receive_(s.input),/UNKNOWN/);assert.throws(()=>s.ctx.receive_(s.input),/UNKNOWN/);
  assert.equal(s.pushes()[0].options.headers['X-Line-Retry-Key'],s.pushes()[1].options.headers['X-Line-Retry-Key']);
  for (const [k,v]of s.props) if(k.startsWith('receipt:')) {const r=JSON.parse(v);r.time=Date.now()-24*3600000;s.props.set(k,JSON.stringify(r));}
  assert.throws(()=>s.ctx.receive_(s.input),/UNKNOWN/);assert.equal(s.pushes().length,2);
});
test('409 is successful only with an accepted request ID',()=>{
  const s=setup({pushCode:409,pushHeaders:{'X-Line-Accepted-Request-Id':'prior'}});assert.equal(s.ctx.receive_(s.input).status,'accepted');
  const t=setup({pushCode:409});assert.throws(()=>t.ctx.receive_(t.input),/UNKNOWN/);
});
test('excessive request content and submission frequency fail closed',()=>{
  const s=setup();s.input.sections[0].rows[0][1]='x'.repeat(1201);assert.throws(()=>s.ctx.receive_(s.input),/INVALID_REQUEST/);
  s.input.sections[0].rows[0][1]='測試';for(let i=0;i<5;i++){s.input.requestId=crypto.randomUUID();s.ctx.receive_(s.input);}
  s.input.requestId=crypto.randomUUID();assert.throws(()=>s.ctx.receive_(s.input),/RATE_LIMIT/);assert.equal(s.pushes().length,5);
});
test('browser receipt contains neither credentials nor personal data; hostile nonce is discarded',()=>{
  const s=setup();const output=s.ctx.doPost({parameter:{request:JSON.stringify(s.input)}}).text;
  assert.match(output,/https:\/\/musentaiwan.github.io/);assert.doesNotMatch(output,/fake-access-token|test-token-|測試旅客|LINE_CHANNEL_SECRET/);
  s.input.nonce='</script><img src=x onerror=alert(1)>';
  const invalid=s.ctx.doPost({parameter:{request:JSON.stringify(s.input)}}).text;assert.doesNotMatch(invalid,/<img|onerror/);
});
test('direct JSON receipts and legacy fallback share one delivery without leaking booking data',()=>{
  const s=setup();
  const direct=s.ctx.doPost({parameter:{request:JSON.stringify({...s.input,responseMode:'json'})}});
  const result=JSON.parse(direct.text);assert.equal(direct.mime,'application/json');
  assert.equal(result.result.status,'accepted');assert.equal(result.nonce,s.input.nonce);
  const fallback=s.ctx.doPost({parameter:{request:JSON.stringify({...s.input,nonce:crypto.randomUUID()})}});
  assert.equal(s.pushes().length,1);assert.match(fallback.text,new RegExp(result.result.receiptId));
  assert.doesNotMatch(direct.text,/fake-access-token|test-token-|測試旅客|LINE_CHANNEL_SECRET/);
});
test('direct transport still returns explicit rejection and never sends an invalid order',()=>{
  const s=setup();s.input.kind='invalid';
  const result=JSON.parse(s.ctx.doPost({parameter:{request:JSON.stringify({...s.input,responseMode:'json'})}}).text);
  assert.equal(result.result.code,'INVALID_REQUEST');assert.equal(s.pushes().length,0);
});
test('production handoff rejects a wrong profile without changing routing or sending',()=>{
  const s=setup({profileName:'another person'});s.props.set('PENDING_NOTIFY_USER_ID',other);
  assert.throws(()=>s.ctx.activateProduction(),/RECIPIENT_NAME_MISMATCH/);
  assert.equal(s.props.get('NOTIFY_USER_ID'),uid);assert.equal(s.props.get('MODE'),'test');assert.equal(s.pushes().length,0);
});
test('verified production recipient receives one activation notice and new orders without a test prefix',()=>{
  const s=setup();s.props.set('PENDING_NOTIFY_USER_ID',other);s.ctx.activateProduction();s.ctx.activateProduction();
  assert.equal(s.props.get('MODE'),'production');assert.equal(s.props.get('NOTIFY_USER_ID'),other);assert.equal(s.pushes().length,1);
  s.ctx.receive_(s.input);const body=JSON.parse(s.pushes()[1].options.payload);
  assert.equal(body.to,other);assert.doesNotMatch(body.messages[0].text,/測試通知/);assert.match(body.messages[0].text,/機場接送/);
});
test('recipient setup requires an unexpired private key and a valid LINE identity',()=>{
  const s=setup(),key='a'.repeat(64),input={...s.input,kind:'recipient-setup',setupKey:key};
  assert.throws(()=>s.ctx.registerRecipient_(input),/SETUP_EXPIRED/);
  s.props.set('RECIPIENT_SETUP_HASH',s.ctx.sha256_(key));s.props.set('RECIPIENT_SETUP_EXPIRES',String(Date.now()+60000));
  assert.throws(()=>s.ctx.registerRecipient_({...input,setupKey:'b'.repeat(64)}),/SETUP_EXPIRED/);
  assert.throws(()=>s.ctx.registerRecipient_({...input,idToken:''}),/AUTH_REQUIRED/);assert.equal(s.pushes().length,0);
  s.props.set('RECIPIENT_SETUP_EXPIRES','0');assert.throws(()=>s.ctx.registerRecipient_(input),/SETUP_EXPIRED/);
});
test('a setup link can be retried by its verified recipient but never claimed by another account',()=>{
 const s=setup(),key='a'.repeat(64),input={...s.input,kind:'recipient-setup',setupKey:key,responseMode:'json'};
 s.props.set('RECIPIENT_SETUP_HASH',s.ctx.sha256_(key));s.props.set('RECIPIENT_SETUP_EXPIRES',String(Date.now()+60000));
 assert.equal(JSON.parse(s.ctx.doPost({parameter:{request:JSON.stringify(input)}}).text).result.status,'accepted');
 s.ctx.registerRecipient_(input);assert.equal(s.pushes().length,1);assert.equal(s.props.get('RECIPIENT_SETUP_USED_BY'),uid);
 assert.throws(()=>s.ctx.activateRecipient_(other,key),/SETUP_EXPIRED/);assert.equal(s.props.get('NOTIFY_USER_ID'),uid);
});
