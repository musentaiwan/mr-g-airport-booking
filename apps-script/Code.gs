/** Mr.G 尊榮接送｜預約通知。此專案只使用 Mr.G 的 LINE 設定。 */
const MRG = Object.freeze({
  loginChannel: '2012188603', messagingChannel: '2012190233',
  origin: 'https://musentaiwan.github.io', brand: 'Mr.G尊榮接送',
  keepMs: 7 * 86400000, retryMs: 23 * 3600000
});

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({service: MRG.brand, version: 2}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let input = {}, result;
  try {
    const raw = e && e.parameter && e.parameter.request;
    if (typeof raw !== 'string' || raw.length > 45000) throw new Error('INVALID_REQUEST');
    input = JSON.parse(raw);
    result = input.kind === 'recipient-setup' ? registerRecipient_(input) : receive_(input);
  } catch (error) {
    const allowed = ['INVALID_REQUEST','NOT_CONFIGURED','PAUSED','AUTH_REQUIRED','TEST_ONLY','RATE_LIMIT','BUSY','CONFLICT','UNKNOWN','LINE_REJECTED','SETUP_EXPIRED','RECIPIENT_NAME_MISMATCH','ACTIVATION_NOTICE_UNCONFIRMED'];
    result = {status:'error', code:allowed.includes(error.message) ? error.message : 'UNAVAILABLE'};
  }
  // No tokens, booking data or LINE identifiers are included in the browser response.
  const nonce = validUuid_(input.nonce) ? input.nonce : '';
  const receipt = {type:'mrg-notification-result', nonce, result};
  if (input.responseMode === 'json') {
    return ContentService.createTextOutput(JSON.stringify(receipt)).setMimeType(ContentService.MimeType.JSON);
  }
  const body = JSON.stringify(receipt)
    .replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
  return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><script>window.top.postMessage(' + body + ',"' + MRG.origin + '");</script>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function receive_(input) {
  if (!validUuid_(input.requestId) || !validUuid_(input.nonce)) throw new Error('INVALID_REQUEST');
  const content = normalize_(input);
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('NOTIFY_ENABLED') !== 'true') throw new Error('PAUSED');
  const recipient = props.getProperty('NOTIFY_USER_ID');
  const tester = props.getProperty('TEST_USER_ID');
  if (!/^U[a-f0-9]{32}$/.test(recipient || '') || !props.getProperty('LINE_CHANNEL_SECRET')) throw new Error('NOT_CONFIGURED');
  const sender = verifyIdentity_(input.idToken);
  // Testing is the default; production must be explicitly enabled in this project.
  if (props.getProperty('MODE') !== 'production' && (!tester || sender !== tester)) throw new Error('TEST_ONLY');
  const senderHash = sha256_(sender);
  const key = 'receipt:' + sha256_(sender + ':' + input.requestId);
  const hash = sha256_(JSON.stringify(content) + ':' + recipient);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) throw new Error('BUSY');
  try {
    const now = Date.now();
    let record = JSON.parse(props.getProperty(key) || 'null');
    if (record) {
      if (record.hash !== hash) throw new Error('CONFLICT');
      if (record.status === 'accepted') return {status:'accepted', receiptId:record.receiptId, duplicate:true};
      // Never create a new retry key for an uncertain request, including after LINE's 24h window.
      if (now - record.time >= MRG.retryMs) throw new Error('UNKNOWN');
    } else {
      const all = props.getProperties();
      let retained = 0, daily = 0, recent = 0;
      Object.keys(all).filter(k => k.startsWith('receipt:')).forEach(k => {
        const r = JSON.parse(all[k]);
        if (now - r.time > MRG.keepMs) { props.deleteProperty(k); return; }
        retained++;
        if (now - r.time < 86400000) daily++;
        if (r.sender === senderHash && now - r.time < 600000) recent++;
      });
      if (retained >= 500 || daily >= 50 || recent >= 5) throw new Error('RATE_LIMIT');
      record = {hash, sender:senderHash, time:now, status:'pending', retryKey:Utilities.getUuid(), receiptId:Utilities.getUuid()};
      // Persist before sending; an interrupted request can safely reuse its LINE retry key.
      props.setProperty(key, JSON.stringify(record));
    }
    const text = summary_(content, record.receiptId, props.getProperty('MODE') !== 'production');
    let response;
    try {
      response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
        method:'post', contentType:'application/json', muteHttpExceptions:true, followRedirects:false,
        headers:{Authorization:'Bearer ' + accessToken_(), 'X-Line-Retry-Key':record.retryKey},
        payload:JSON.stringify({to:recipient, messages:splitText_(text)})
      });
    } catch (_) { throw new Error('UNKNOWN'); }
    const code = response.getResponseCode();
    const headers = response.getAllHeaders();
    const acceptedBefore = Object.keys(headers).some(k => k.toLowerCase() === 'x-line-accepted-request-id' && headers[k]);
    if (code === 200 || (code === 409 && acceptedBefore)) {
      record.status = 'accepted';
      props.setProperty(key, JSON.stringify(record));
      return {status:'accepted', receiptId:record.receiptId};
    }
    // Keep the original retry key even if LINE rejected this attempt.
    throw new Error([400,401,403,429].includes(code) ? 'LINE_REJECTED' : 'UNKNOWN');
  } finally { lock.releaseLock(); }
}

function verifyIdentity_(token) {
  if (typeof token !== 'string' || token.length < 40 || token.length > 10000) throw new Error('AUTH_REQUIRED');
  const response = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/verify', {
    method:'post', payload:{id_token:token, client_id:MRG.loginChannel}, muteHttpExceptions:true, followRedirects:false
  });
  if (response.getResponseCode() !== 200) throw new Error('AUTH_REQUIRED');
  const identity = JSON.parse(response.getContentText());
  if (String(identity.aud) !== MRG.loginChannel || identity.iss !== 'https://access.line.me' ||
      !Number.isFinite(identity.exp) || identity.exp * 1000 <= Date.now() ||
      !/^U[a-f0-9]{32}$/.test(identity.sub || '')) throw new Error('AUTH_REQUIRED');
  return identity.sub;
}

function accessToken_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('mrg-line-token');
  if (cached) return cached;
  const secret = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_SECRET');
  if (!secret) throw new Error('NOT_CONFIGURED');
  const response = UrlFetchApp.fetch('https://api.line.me/oauth2/v3/token', {
    method:'post', payload:{grant_type:'client_credentials', client_id:MRG.messagingChannel, client_secret:secret},
    muteHttpExceptions:true, followRedirects:false
  });
  if (response.getResponseCode() !== 200) throw new Error('NOT_CONFIGURED');
  const data = JSON.parse(response.getContentText());
  if (!data.access_token || data.expires_in < 120) throw new Error('NOT_CONFIGURED');
  cache.put('mrg-line-token', data.access_token, Math.min(840, data.expires_in - 60));
  return data.access_token;
}

function validUuid_(value) { return typeof value === 'string' && /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value); }
function sha256_(text) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8).map(b => ((b + 256) % 256).toString(16).padStart(2,'0')).join(''); }
function normalize_(input) {
  if (!['booking','feedback','other'].includes(input.kind) || !['機場接送','旅遊包車','商務用車','意見申訴','其他服務'].includes(input.service)) throw new Error('INVALID_REQUEST');
  if (!Array.isArray(input.sections) || !input.sections.length || input.sections.length > 4) throw new Error('INVALID_REQUEST');
  const str = (v,max) => { if (typeof v !== 'string' || !v.trim() || v.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v)) throw new Error('INVALID_REQUEST'); return v.trim(); };
  let count = 0;
  const sections = input.sections.map(section => {
    if (!section || !Array.isArray(section.rows) || !section.rows.length) throw new Error('INVALID_REQUEST');
    const rows = section.rows.map(row => {
      if (!Array.isArray(row) || row.length !== 2 || ++count > 80) throw new Error('INVALID_REQUEST');
      return [str(row[0],40),str(row[1],1200)];
    });
    return {title:str(section.title,60), rows};
  });
  const content = {kind:input.kind, service:input.service, sections};
  if (JSON.stringify(content).length > 18000) throw new Error('INVALID_REQUEST');
  return content;
}
function summary_(content, receipt, testing) {
  const lines = [(testing ? '【測試通知】' : '') + '【' + MRG.brand + '｜' + content.service + '】', '案件編號：' + receipt];
  content.sections.forEach(section => { lines.push('',section.title); section.rows.forEach(row => lines.push(row[0] + '：' + row[1])); });
  lines.push('', content.kind === 'booking' ? '此為預約需求，尚未完成訂車。請確認車型、車資與行程安排。' : '請協助了解需求並回覆客人。');
  return lines.join('\n');
}
function splitText_(text) {
  const result = [];
  while (text.length) {
    let end = Math.min(text.length,4500);
    if (end < text.length) { const newline = text.lastIndexOf('\n',end); if (newline > 2000) end = newline + 1; if (/[\uD800-\uDBFF]/.test(text[end-1])) end--; }
    result.push({type:'text',text:text.slice(0,end)}); text = text.slice(end);
  }
  if (result.length > 5) throw new Error('INVALID_REQUEST');
  return result;
}

/** Run only in the editor: checks the configured account and recipient without sending messages. */
function checkSetup() {
  const props = PropertiesService.getScriptProperties();
  const recipient = props.getProperty('NOTIFY_USER_ID');
  if (!/^U[a-f0-9]{32}$/.test(recipient || '')) throw new Error('NOT_CONFIGURED');
  const opts = {headers:{Authorization:'Bearer ' + accessToken_()}, muteHttpExceptions:true, followRedirects:false};
  const bot = UrlFetchApp.fetch('https://api.line.me/v2/bot/info', opts);
  const person = UrlFetchApp.fetch('https://api.line.me/v2/bot/profile/' + recipient, opts);
  if (bot.getResponseCode() !== 200 || person.getResponseCode() !== 200) throw new Error('PROFILE_UNAVAILABLE');
  console.log(JSON.stringify({officialAccount:JSON.parse(bot.getContentText()).displayName,
    recipient:JSON.parse(person.getContentText()).displayName, mode:props.getProperty('MODE') || 'test',
    enabled:props.getProperty('NOTIFY_ENABLED') === 'true'}));
}

/** Editor-only handoff: verify the named recipient, then enable this account's production notices. */
function activateProduction() {
  return activateRecipient_(PropertiesService.getScriptProperties().getProperty('PENDING_NOTIFY_USER_ID'));
}
function activateRecipient_(recipient, setupKey) {
  const props = PropertiesService.getScriptProperties();
  if (!/^U[a-f0-9]{32}$/.test(recipient || '')) throw new Error('RECIPIENT_NOT_CONFIGURED');
  const profile = UrlFetchApp.fetch('https://api.line.me/v2/bot/profile/' + recipient, {
    headers:{Authorization:'Bearer ' + accessToken_()}, muteHttpExceptions:true, followRedirects:false
  });
  if (profile.getResponseCode() !== 200 || JSON.parse(profile.getContentText()).displayName !== 'Mr.G-Premium™接送') {
    throw new Error('RECIPIENT_NAME_MISMATCH');
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) throw new Error('BUSY');
  try {
    if (setupKey !== undefined) {
      if (props.getProperty('RECIPIENT_SETUP_HASH') !== sha256_(setupKey) || Number(props.getProperty('RECIPIENT_SETUP_EXPIRES')) <= Date.now()) throw new Error('SETUP_EXPIRED');
      const usedBy = props.getProperty('RECIPIENT_SETUP_USED_BY');
      if (usedBy && usedBy !== recipient) throw new Error('SETUP_EXPIRED');
      props.setProperty('RECIPIENT_SETUP_USED_BY',recipient);
    }
    props.setProperties({NOTIFY_USER_ID:recipient,MODE:'production',NOTIFY_ENABLED:'true'});
    const key = 'activation:' + sha256_(recipient);
    let record = JSON.parse(props.getProperty(key) || 'null');
    if (!record) { record = {retryKey:Utilities.getUuid(),time:Date.now(),status:'pending'}; props.setProperty(key,JSON.stringify(record)); }
    if (record.status !== 'accepted') {
      if (Date.now() - record.time >= MRG.retryMs) throw new Error('UNKNOWN');
      const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
        method:'post', contentType:'application/json', muteHttpExceptions:true, followRedirects:false,
        headers:{Authorization:'Bearer ' + accessToken_(),'X-Line-Retry-Key':record.retryKey},
        payload:JSON.stringify({to:recipient,messages:[{type:'text',text:'【Mr.G尊榮接送｜通知已啟用】\n新的用車預約、其他服務需求與意見申訴，將由官方帳號傳送完整內容到您的這個 LINE 帳號。\n\n這是設定完成通知，無須派車。'}]})
      });
      const code = response.getResponseCode(), headers = response.getAllHeaders();
      if (code !== 200 && !(code === 409 && Object.keys(headers).some(k => k.toLowerCase() === 'x-line-accepted-request-id' && headers[k]))) throw new Error('ACTIVATION_NOTICE_UNCONFIRMED');
      record.status = 'accepted'; props.setProperty(key,JSON.stringify(record));
    }
    console.log(JSON.stringify({recipient:JSON.parse(profile.getContentText()).displayName,mode:'production',enabled:true,activationNotice:'accepted'}));
    return {status:'accepted',receiptId:record.retryKey};
  } finally { lock.releaseLock(); }
}

function registerRecipient_(input) {
  const props = PropertiesService.getScriptProperties();
  if (!validUuid_(input.nonce) || !/^[a-f0-9]{64}$/.test(input.setupKey || '') ||
      props.getProperty('RECIPIENT_SETUP_HASH') !== sha256_(input.setupKey) ||
      !(Number(props.getProperty('RECIPIENT_SETUP_EXPIRES')) > Date.now())) throw new Error('SETUP_EXPIRED');
  return activateRecipient_(verifyIdentity_(input.idToken),input.setupKey);
}

/** Editor only: creates one expiring, single-recipient setup link. Never publish it in the source. */
function createRecipientSetup() {
  const props = PropertiesService.getScriptProperties();
  const key = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g,'');
  props.setProperties({RECIPIENT_SETUP_HASH:sha256_(key),RECIPIENT_SETUP_EXPIRES:String(Date.now()+86400000),RECIPIENT_SETUP_USED_BY:''});
  console.log('https://liff.line.me/2012188603-cJnVDTcj/recipient-setup.html?k='+key);
}
