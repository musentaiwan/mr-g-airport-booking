const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=require('../booking-core.js');

const leg={type:'送機',date:'2027-01-05',booking_time:'08:30',userName:'測試乘客',phone:'0900000000',flight:'BR123',start:'台北測試地點',end:'桃園國際機場 第一航廈',stops:['測試加點'],pax:'2大1小',luggage:'20吋登機箱x2',seat:'增高墊x1',bookingMode:'other',bookingContactName:'測試代訂人',bookingContactPhone:'0900000001',pickupNote:'大廳門口',special:['嬰兒車'],specialNote:'可折疊 1 件',memo:'測試備註'};

test('accepts Taiwan mobile, landline and international phone formats',()=>{
  for(const value of ['0912 345 678','02-2345-6789','+81 90 1234 5678'])assert.equal(core.isPhone(value),true);
  for(const value of ['', '123', '091234567', '+000000000'])assert.equal(core.isPhone(value),false);
});
test('validates calendar dates rather than normalizing impossible days',()=>{
  assert.equal(core.validDate('2028-02-29'),true);
  for(const value of ['2027-02-29','2027-04-31','2027-13-01','2027-1-01'])assert.equal(core.validDate(value),false);
});
test('return trip must follow the first trip in Taipei time',()=>{
  const first={date:'2027-01-05',time:'23:30'};
  assert.equal(core.returnIsLater(first,{date:'2027-01-06',time:'00:30'}),true);
  assert.equal(core.returnIsLater(first,{date:'2027-01-05',time:'23:30'}),false);
  assert.equal(core.returnIsLater(first,{date:'2027-01-05',time:'08:00'}),false);
});
test('summary keeps both trips, booking contact, stops and special requests',()=>{
  const text=core.buildSummary([leg,{...leg,type:'接機',date:'2027-01-10',booking_time:'22:00',start:leg.end,end:leg.start}], 'Mr.G尊榮接送');
  for(const value of ['Mr.G尊榮接送','代訂聯絡人：測試代訂人','第 1 趟｜送機','第 2 趟｜接機','加點 1：測試加點','特殊行李說明：可折疊 1 件','航班落地時間：22:00','尚未完成訂車'])assert.ok(text.includes(value));
});
test('recipient is fixed to the Mr.G official account; summary survives URL encoding',()=>{
  const text=core.buildSummary([leg],'Mr.G尊榮接送')+'\nA & B? # / 😀';
  const result=core.lineHandoff('@194wevnz',text);
  const url=new URL(result.url);
  assert.equal(url.hostname,'line.me');
  assert.equal(url.pathname,'/R/oaMessage/%40194wevnz/');
  assert.equal(decodeURIComponent(url.search.slice(1)),text);
  assert.equal(result.requiresCopy,false);
  assert.throws(()=>core.lineHandoff('@194wevnz/other','test'));
});
test('long summaries use copy-and-open without dropping itinerary details',()=>{
  const result=core.lineHandoff('@194wevnz','行程'.repeat(3000));
  assert.equal(result.requiresCopy,true);
  assert.equal(result.url,'https://line.me/R/oaMessage/%40194wevnz');
});
test('published frontend contains no old account, backend endpoint, token, or network submission',()=>{
  const source=['index.html','app.js','config.js','booking-core.js'].map(file=>fs.readFileSync(require('node:path').join(__dirname,'..',file),'utf8')).join('\n');
  assert.doesNotMatch(source,/musen|沐森|2009589320|script\.google\.com|fetch\s*\(|XMLHttpRequest|sendBeacon/i);
  assert.doesNotMatch(source,/channel[_ -]?(?:secret|access.?token)/i);
  const context={};vm.createContext(context);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'..','config.js'),'utf8')+'\nthis.settings=MRG_CONFIG;',context);
  assert.equal(context.settings.lineOfficialId,'@194wevnz');
});
