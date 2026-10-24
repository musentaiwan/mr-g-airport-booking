const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../notification-service.js'),'utf8');
const endpoint='https://script.google.com/macros/s/test/exec';
function setup(mode){
 const calls=[],listeners=new Set();let frame;
 const context={module:{exports:{}},URL,URLSearchParams,AbortController,crypto:require('node:crypto').webcrypto,setTimeout,clearTimeout,
  window:{addEventListener:(name,fn)=>listeners.add(fn),removeEventListener:(name,fn)=>listeners.delete(fn)},
  document:{body:{append(){}},createElement:type=>{const element={remove(){},append(child){this.field=child;}};if(type==='form')element.submit=()=>{frame=JSON.parse(element.field.value);calls.push({type:'frame',request:frame});for(const fn of listeners)fn({origin:'https://script.googleusercontent.com',data:{type:'mrg-notification-result',nonce:frame.nonce,result:{status:'accepted',receiptId:'same-receipt'}}});};return element;}},
  fetch:async(url,options)=>{const request=JSON.parse(options.body.get('request'));calls.push({type:'fetch',request,options});
   if(mode==='cors')throw Error('blocked');
   if(mode==='timeout')return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted'))));
   return {ok:true,json:async()=>({type:'mrg-notification-result',nonce:mode==='bad-nonce'?'other':request.nonce,result:mode==='reject'?{status:'error',code:'AUTH_REQUIRED'}:{status:'accepted',receiptId:'same-receipt'}})};
  }};
 vm.createContext(context);vm.runInContext(source,context);return {api:context.module.exports,calls,listeners};
}
test('direct reply accepts only a matching receipt and avoids loading a frame',async()=>{
 const s=setup();const result=await s.api.submit({endpoint,request:{requestId:'stable-id'}});
 assert.equal(result.status,'accepted');assert.equal(s.calls.length,1);assert.equal(s.calls[0].request.responseMode,'json');
 assert.equal(s.calls[0].options.credentials,'omit');assert.equal(s.calls[0].options.method,'POST');
});
test('rejected identity is not retried through another transport',async()=>{
 const s=setup('reject');assert.equal((await s.api.submit({endpoint,request:{requestId:'stable-id'}})).code,'AUTH_REQUIRED');assert.equal(s.calls.length,1);
});
test('blocked or mismatched replies fall back using the same order identity',async()=>{
 for(const mode of ['cors','bad-nonce']){const s=setup(mode),result=await s.api.submit({endpoint,request:{requestId:'stable-id'}});
 assert.equal(result.status,'accepted');assert.deepEqual(s.calls.map(c=>c.type),['fetch','frame']);assert.equal(s.calls[1].request.requestId,s.calls[0].request.requestId);assert.equal(s.listeners.size,0);}
});
test('a timeout remains uncertain and never pretends the notification succeeded',async()=>{
 const s=setup('timeout');const result=await s.api.submit({endpoint,request:{requestId:'stable-id'},timeoutMs:5});assert.equal(result.code,'UNKNOWN');assert.equal(s.calls.length,1);
});
