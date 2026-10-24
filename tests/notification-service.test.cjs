const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../notification-service.js');
test('accepts actual Apps Script response origins and rejects lookalike domains',()=>{
  for(const origin of ['https://script.google.com','https://script.googleusercontent.com','https://n-wlzgreyxpj46ve743722uwcph3ttw3ukgtbetoa-0lu-script.googleusercontent.com'])assert.equal(api.googleOrigin(origin),true);
  for(const origin of ['null','http://script.google.com','https://evil.example','https://n-script.googleusercontent.com.evil.example','https://evil-googleusercontent.com','https://googleusercontent.com'])assert.equal(api.googleOrigin(origin),false);
});
test('request IDs survive retries and cannot be created when session storage fails',async()=>{
  const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  const c={kind:'booking',service:'商務用車',sections:[{title:'行程',rows:[['日期','2026-11-20']]}]};
  const first=await api.prepare(c,'user',storage),second=await api.prepare(c,'user',storage);
  assert.equal(first.requestId,second.requestId);
  assert.notEqual((await api.prepare({...c,service:'機場接送'},'user',storage)).requestId,first.requestId);
  await assert.rejects(api.prepare(c,'other-user',{getItem:()=>null,setItem:()=>{throw Error('no storage');}}),/no storage/);
});
