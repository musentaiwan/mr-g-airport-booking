const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../entry.js'),'utf8');
function setup(url){
  let release;const initialized=new Promise(resolve=>release=resolve),redirects=[];
  const nodes={'page-content':{hidden:true},'page-loading':{hidden:false,textContent:'載入中…'}};
  const context={window:{MrgLineReady:initialized},URL,location:{href:url,replace:value=>redirects.push(value)},document:{getElementById:id=>nodes[id]}};
  vm.createContext(context);vm.runInContext(source,context);
  return {nodes,context,redirects,release,ready:context.window.MrgPageReady};
}
test('no page is revealed before LINE restores the requested destination',async()=>{
  const s=setup('https://example.com/mrg/?liff.state=%3Fview%3Dfeedback');
  assert.equal(s.nodes['page-content'].hidden,true);assert.equal(s.redirects.length,0);
  s.context.location.href='https://example.com/mrg/?view=feedback';s.release(true);
  assert.equal(await s.ready,false);
  assert.deepEqual(s.redirects,['https://example.com/mrg/feedback.html']);
  assert.equal(s.nodes['page-content'].hidden,true);
});
test('separate pages render their own content after initialization without redirecting through booking',async()=>{
  for(const file of ['index.html','services.html','feedback.html','other.html']){
    const s=setup('https://example.com/mrg/'+file);s.release(true);
    assert.equal(await s.ready,true);assert.equal(s.nodes['page-content'].hidden,false);assert.equal(s.redirects.length,0);
  }
});
test('unresolved LINE destination does not fall back to booking',async()=>{
  const s=setup('https://example.com/mrg/?liff.state=%2Fservices.html');s.release(false);
  assert.equal(await s.ready,false);assert.equal(s.nodes['page-content'].hidden,true);assert.equal(s.redirects.length,0);
  assert.match(s.nodes['page-loading'].textContent,/重新點選/);
});
test('legacy service and complaint links route to their own pages and keep unrelated LINE parameters',async()=>{
  for(const [view,file] of [['services','services.html'],['feedback','feedback.html']]){
    const s=setup('https://example.com/mrg/?view='+view+'&liff.referrer=reference');s.release(true);await s.ready;
    assert.equal(s.redirects[0],'https://example.com/mrg/'+file+'?liff.referrer=reference');
  }
});
test('service and feedback pages do not mount booking or a service overlay',()=>{
  for(const file of ['services.html','feedback.html','other.html']){
    const html=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
    assert.doesNotMatch(html,/<iframe|<dialog|service-shell\.js/);
  }
  const booking=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(booking,/data-src="booking\.html/);assert.doesNotMatch(booking,/<iframe[^>]*\ssrc=/);
});
