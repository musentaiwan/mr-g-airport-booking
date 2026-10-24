'use strict';
window.closeMrgPage=function(){
  if(window.liff?.isInClient())liff.closeWindow();
  else location.assign('https://line.me/R/ti/p/'+MRG_CONFIG.lineOfficialId);
};
window.MrgPageReady=(async()=>{
  // LINE restores the destination during initialization. Do not render a different page first.
  await window.MrgLineReady;
  const current=new URL(location.href);
  if(current.searchParams.has('liff.state')){
    document.getElementById('page-loading').textContent='頁面尚未開啟，請關閉後從 Mr.G 官方 LINE 重新點選。';
    return false;
  }
  const legacyPages={booking:'index.html',services:'services.html',feedback:'feedback.html'};
  const legacyPage=legacyPages[current.searchParams.get('view')];
  if(legacyPage){
    const target=new URL(legacyPage,current);
    if(target.pathname!==current.pathname){
      current.pathname=target.pathname;
      current.searchParams.delete('view');
      location.replace(current.href);
      return false;
    }
  }
  document.getElementById('page-loading').hidden=true;
  document.getElementById('page-content').hidden=false;
  return true;
})();
