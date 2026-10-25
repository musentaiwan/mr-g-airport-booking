const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const english=require('../booking-english.js');

test('English review captions never reinterpret customer names, routes or free text',()=>{
  for(const label of ['乘車人','聯絡人','起點','終點','公司','備註','商務行程','行程需求']){
    for(const value of ['機場接送','送機','1 大 0 小','<img src=x onerror=alert(1)>','AlexandertheVeryLongPassengerNameWithoutAnySpaces']){
      assert.equal(english.value(label,value),'');
    }
  }
});
test('system-generated counts and luggage are readable without changing the Chinese source value',()=>{
  assert.equal(english.value('乘車人數','1 位大人 · 2 位小孩'),'1 adult · 2 children');
  assert.equal(english.value('人數','2 大 1 小'),'2 adults · 1 child');
  assert.equal(english.value('行李','28-30吋行李箱x2, 手提行李x1'),'28–30-inch suitcase × 2, Hand luggage × 1');
  assert.equal(english.value('兒童座椅','增高墊x1'),'Booster seat × 1');
  assert.equal(english.value('包車時數','10 小時'),'10 hours');
  assert.equal(english.value('上車時間','09:30（台北時間）'),'09:30 (Taiwan time, UTC+8)');
});
test('changing trip direction and step number produces the correct English meaning',()=>{
  assert.equal(english.translate('第 2 趟 · 接機'),'Trip 2 · Airport pick-up');
  assert.equal(english.translate('請選擇送機日期。'),'Please choose the pick-up date.');
  assert.equal(english.translate('請選擇接機日期。'),'Please choose the flight arrival date.');
  assert.equal(english.translate('下一步：安排另一趟　→'),'Next: return transfer');
  assert.equal(english.translate('4 / 5 · 另一趟'),'4 / 5 · Return trip');
});
test('every existing city and district option has an English place-name caption',()=>{
  const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
  const data=JSON.parse(source.match(/const twData = (\{.*\});/)[1]);
  const context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../booking-places.js'),'utf8'),context);
  const names=context.window.MrgPlaceNames;
  for(const [city,districts]of Object.entries(data))for(const name of [city,...districts])assert.ok(names[name],name);
});
