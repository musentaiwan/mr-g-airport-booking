'use strict';
const $=id=>document.getElementById(id);
const bookingScenes=['contact','choose','trip','return','review'];
let currentScene='choose',pendingScene=null;
function go(scene){
  if(window.mrgSending)return;
  currentScene=bookingScenes.includes(scene)?scene:'choose';
  pendingScene=currentScene;
  $('booking-wrap').hidden=false;
  $('screen').classList.add('booking-active');
  const frame=$('booking-frame');
  if(!frame.hasAttribute('src'))frame.src=frame.dataset.src;
  else frame.contentWindow.postMessage({type:'mrg-navigate',scene:currentScene},location.origin);
}
window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==$('booking-frame').contentWindow)return;
  const data=e.data;
  if(data?.type==='mrg-ready'&&pendingScene){
    const scene=pendingScene;pendingScene=null;
    $('booking-frame').contentWindow.postMessage({type:'mrg-navigate',scene},location.origin);
  }else if(data?.type==='mrg-scene'&&bookingScenes.includes(data.scene))currentScene=data.scene;
  else if(data?.type==='mrg-home')closeMrgPage();
});
window.MrgPageReady.then(ready=>{if(ready)go('choose');});
