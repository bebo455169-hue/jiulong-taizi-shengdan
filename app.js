'use strict';
const $ = id => document.getElementById(id);
const rituals = [...document.querySelectorAll('.ritual')];
const money = n => Number(n || 0).toLocaleString('zh-TW');
const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const val = id => ($(id)?.value || '').trim();
const selected = () => rituals.filter(r => r.checked);

// 生肖與時辰：使用事件監聽，避免行動版 Safari 的 onclick 相容問題。
const zodiacs = ['🐭 鼠','🐮 牛','🐯 虎','🐰 兔','🐲 龍','🐍 蛇','🐴 馬','🐐 羊','🐵 猴','🐔 雞','🐶 狗','🐷 豬'];
const hours = ['子時 23–01','丑時 01–03','寅時 03–05','卯時 05–07','辰時 07–09','巳時 09–11','午時 11–13','未時 13–15','申時 15–17','酉時 17–19','戌時 19–21','亥時 21–23','吉時（不清楚）'];
function makeChoices(container, values, target, className='') {
  values.forEach(label => {
    const b = document.createElement('button'); b.type='button'; b.className=className; b.textContent=label;
    b.addEventListener('click', () => {
      container.querySelectorAll('button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      $(target).value = label.includes('（不清楚）') ? '吉時' : label.replace(/^\S+\s(?=[鼠牛虎兔龍蛇馬羊猴雞狗豬]$)/,'');
      update();
    });
    container.appendChild(b);
  });
}
makeChoices($('zodiacChoices'), zodiacs, 'zodiac');
makeChoices($('hourChoices'), hours, 'birthHour');

// 國曆 / 農曆
let calendarMode = 'solar';
document.querySelectorAll('.calBtn').forEach(btn => btn.addEventListener('click', () => {
  calendarMode = btn.dataset.cal;
  document.querySelectorAll('.calBtn').forEach(x => x.classList.toggle('on', x === btn));
  $('solarBox').classList.toggle('hidden', calendarMode !== 'solar');
  $('lunarBox').classList.toggle('hidden', calendarMode !== 'lunar');
}));
function solarToLunar(dateStr) {
  if (!dateStr) return '';
  const [y,m,d] = dateStr.split('-').map(Number);
  const date = new Date(y, m-1, d, 12, 0, 0);
  try {
    const fmt = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', {year:'numeric', month:'long', day:'numeric'});
    return fmt.format(date).replace(/\s/g,'');
  } catch (e) { return ''; }
}
$('convertLunar').addEventListener('click', () => {
  const s = val('solarDate');
  if (!s) { $('lunarResult').textContent='請先選擇國曆出生日期。'; return; }
  const lunar = solarToLunar(s);
  $('lunarResult').textContent = lunar ? `農曆：${lunar}` : '此瀏覽器無法自動換算，請改用「直接填農曆」。';
});
$('solarDate').addEventListener('change', () => {
  const s = val('solarDate'); if (!s) return;
  const lunar = solarToLunar(s); $('lunarResult').textContent = lunar ? `農曆：${lunar}` : '可按「轉換農曆」查看。';
});
function birthText() {
  const hour = val('birthHour');
  if (calendarMode === 'solar') {
    const s = val('solarDate'); if (!s) return '';
    const [y,m,d] = s.split('-'); const solar = `國曆 ${Number(y)}年${Number(m)}月${Number(d)}日`;
    const lunar = solarToLunar(s);
    return `${solar}${lunar ? `／農曆 ${lunar}` : ''}${hour ? `／${hour}` : ''}`;
  }
  return `${val('lunarText')}${hour ? `／${hour}` : ''}`;
}

// 科儀與祭改到場
rituals.forEach(r => r.addEventListener('change', update));
document.querySelectorAll('.presence button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.presence button').forEach(x => x.classList.remove('on'));
  b.classList.add('on'); $('presence').value=b.dataset.value;
  $('clothes').classList.toggle('show', b.dataset.value === '本人不克到場'); update();
}));
document.querySelectorAll('input,textarea').forEach(x => x.addEventListener('input', update));
function update() {
  $('gaigaiExtra').classList.toggle('show', !!document.querySelector('.ritual[data-key="gaigai"]')?.checked);
  const total = selected().reduce((s,r) => s + Number(r.dataset.price), 0);
  $('total').textContent = 'NT$ ' + money(total);
  $('summary').innerHTML = selected().length ? selected().map(r => `<b>${escapeHtml(r.dataset.name)}</b>　NT$${money(r.dataset.price)}`).join('<br><br>') : '請先填寫資料並選擇科儀。';
}
function row(k,v){return `<div class="rrow"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v || '未填')}</strong></div>`;}
function validate(){
  const e=[];
  if(!val('contactName')) e.push('請填寫聯絡人姓名');
  if(!val('phone')) e.push('請填寫聯絡電話');
  if(!val('personName')) e.push('請填寫祈福人姓名');
  if(calendarMode==='solar' && !val('solarDate')) e.push('請選擇國曆出生日期');
  if(calendarMode==='lunar' && !val('lunarText')) e.push('請填寫農曆出生日期');
  if(!val('birthHour')) e.push('請選擇時辰；不知道請選「吉時」');
  if(!val('zodiac')) e.push('請選擇生肖');
  if(!val('address')) e.push('請填寫地址');
  if(!selected().length) e.push('請至少選擇一項科儀');
  const gai = document.querySelector('.ritual[data-key="gaigai"]');
  if(gai?.checked && !val('presence')) e.push('祭改請選擇本人是否到場');
  return e;
}
$('form').addEventListener('submit', e => {
  e.preventDefault();
  const errs=validate(); $('error').innerHTML=errs.map(escapeHtml).join('<br>');
  if(errs.length){$('error').scrollIntoView({behavior:'smooth',block:'center'});return;}
  let html=`<section class="person"><h3>聯絡人資料</h3>${row('聯絡人',val('contactName'))}${row('聯絡電話',val('phone'))}${val('lineName')?row('LINE名稱',val('lineName')):''}</section>`;
  html+=`<section class="person"><h3>祈福人資料</h3>${row('姓名',val('personName'))}${row('生辰',birthText())}${row('生肖',val('zodiac'))}${row('地址',val('address'))}</section>`;
  let no=0,total=0;
  selected().forEach(r=>{
    no++; total+=Number(r.dataset.price);
    html+=`<section class="ritualBlock"><div class="ritualTitle"><b>${no}. ${escapeHtml(r.dataset.name)}</b><strong>NT$${money(r.dataset.price)}</strong></div>`;
    if(r.dataset.key==='dou') html+=`<div class="quota">限25人｜名額以官方 LINE 回覆確認為準</div>`;
    if(r.dataset.key==='gaigai'){
      html+=row('本人到場',val('presence'));
      if(val('presence')==='本人不克到場') html+=`<div class="clothesReceipt">⚠️ 未到場者請準備本人衣物，提前放置宮廟。</div>`;
    }
    html+='</section>';
  });
  if(val('note')) html+=`<section class="person"><h3>其他備註</h3><p>${escapeHtml(val('note'))}</p></section>`;
  $('receiptBody').innerHTML=html; $('receiptTotal').textContent='NT$ '+money(total);
  $('receiptModal').classList.add('show'); $('receiptModal').setAttribute('aria-hidden','false'); document.body.classList.add('locked');
  setTimeout(()=>$('receipt').scrollIntoView({block:'start'}),50);
});
function closeModal(){ $('receiptModal').classList.remove('show'); $('receiptModal').setAttribute('aria-hidden','true'); document.body.classList.remove('locked'); }
$('closeModal').addEventListener('click',closeModal); $('backEdit').addEventListener('click',closeModal);
update();
