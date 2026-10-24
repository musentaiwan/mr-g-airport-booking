const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const crypto = require('node:crypto');
const source = fs.readFileSync(require('node:path').join(__dirname,'../apps-script/Code.gs'),'utf8');
const uid = 'U' + '1'.repeat(32), other = 'U' + '2'.repeat(32);
function setup({sender=uid, pushCode=200, pushHeaders={}, throwPush=false, authCode=200, identityOverrides={}}={}) {
  const props = new Map(Object.entries({NOTIFY_ENABLED:'true',NOTIFY_USER_ID:uid,TEST_USER_ID:uid,MODE:'test',LINE_CHANNEL_SECRET:'fake-secret'}));
  const calls=[];
  const store = {getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v),getProperties:()=>Object.fromEntries(props),deleteProperty:k=>props.delete(k)};
  const response=(code,data,headers={})=>({getResponseCode:()=>code,getContentText:()=>JSON.stringify(data),getAllHeaders:()=>headers});
  const ctx=vm.createContext({console,PropertiesService:{getScriptProperties:()=>store},CacheService:{getScriptCache:()=>({get:()=>null,put:()=>{}})},
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
    Utilities:{getUuid:()=>crypto.randomUUID(),DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(alg,text)=>[...crypto.createHash('sha256').update(text).digest()]},
    UrlFetchApp:{fetch:(url,options)=>{calls.push({url,options});
      if(url.endsWith('/verify'))return response(authCode,{sub:sender,aud:'2012188603',iss:'https://access.line.me',exp:Math.floor(Date.now()/1000)+3600,...identityOverrides});
      if(url.endsWith('/token'))return response(200,{access_token:'fake-access-token',expires_in:900});
      if(url.endsWith('/push')){if(throwPush)throw Error('timeout');return response(pushCode,{},pushHeaders);} throw Error('unexpected URL');
    }},
    HtmlService:{XFrameOptionsMode:{ALLOWALL:'ALLOWALL'},createHtmlOutput:text=>({text,setXFrameOptionsMode(){return this;}})}
  });
  vm.runInContext(source,ctx);
  const input={requestId:crypto.randomUUID(),nonce:crypto.randomUUID(),idToken:'test-token-'.repeat(8),kind:'booking',service:'機場接送',sections:[{title:'第一趟',rows:[['乘車人','測試旅客'],['行李','20 吋 x 1、28–30 吋 x 2'],['特殊行李','可折疊嬰兒車 x 1']]}]};
  return {ctx,props,calls,input,pushes:()=>calls.filter(c=>c.url.endsWith('/push'))};
}
test('fixed recipient ignores caller-supplied recipient and preserves all luggage details',()=>{
  const s=setup();s.input.to=other;assert.equal(s.ctx.receive_(s.input).status,'accepted');
  const payload=JSON.parse(s.pushes()[0].options.payload);assert.equal(payload.to,uid);
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
