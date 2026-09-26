const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={mode:null,people:[],editing:null,calendar:null,time:null,zodiac:null,attendance:null,rituals:new Set(),imageSaved:false};
const zodiac=["鼠","牛","虎","兔","龍","蛇","馬","羊","猴","雞","狗","豬"];
const times=["子時","丑時","寅時","卯時","辰時","巳時","午時","未時","申時","酉時","戌時","亥時","吉時"];
const ritualNames={lamp:"七星元辰燈",dou:"祈安禮斗",gaiji:"祭改"};
const ritualPrices={lamp:200,dou:1200,gaiji:200};
const lunarMonths=["正月","二月","三月","四月","五月","六月","七月","八月","九月","十月","冬月","臘月"];
const lunarDays=["初一","初二","初三","初四","初五","初六","初七","初八","初九","初十","十一","十二","十三","十四","十五","十六","十七","十八","十九","二十","廿一","廿二","廿三","廿四","廿五","廿六","廿七","廿八","廿九","三十"];
function fillLunarSelects(){
 $("#lunarMonth").innerHTML='<option value="">請選月份</option>'+lunarMonths.map(x=>`<option value="${x}">${x}</option>`).join("");
 $("#lunarDay").innerHTML='<option value="">請選日期</option>'+lunarDays.map(x=>`<option value="${x}">${x}</option>`).join("");
}
fillLunarSelects();
const money=n=>"NT$"+n.toLocaleString("zh-TW");
function show(id,step){
  $$(".panel").forEach(x=>x.classList.remove("active")); $("#"+id).classList.add("active");
  $$(".step").forEach((x,i)=>{x.classList.toggle("active",i+1===step);x.classList.toggle("done",i+1<step)});
  scrollTo({top:0,behavior:"smooth"});
}
$$(".bigChoice").forEach(b=>b.onclick=()=>{
  $$(".bigChoice").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");
  state.mode=b.dataset.mode; $("#toStep2").disabled=false;$("#toStep2").textContent="下一步：填寫資料 →";
});
$("#toStep2").onclick=()=>{resetForm();show("step2",2)};
$("#back1").onclick=()=>show("step1",1);

times.forEach(t=>{let b=document.createElement("button");b.type="button";b.textContent=t;b.onclick=()=>{state.time=t;$("#timeGrid").querySelectorAll("button").forEach(x=>x.classList.toggle("selected",x===b))};$("#timeGrid").append(b)});
zodiac.forEach(z=>{let b=document.createElement("button");b.type="button";b.textContent=z;b.onclick=()=>{state.zodiac=z;$("#zodiacGrid").querySelectorAll("button").forEach(x=>x.classList.toggle("selected",x===b))};$("#zodiacGrid").append(b)});

$$("[data-calendar]").forEach(b=>b.onclick=()=>{
 state.calendar=b.dataset.calendar;$$("[data-calendar]").forEach(x=>x.classList.toggle("selected",x===b));
 $("#solarBox").classList.toggle("hidden",state.calendar!=="solar");$("#lunarBox").classList.toggle("hidden",state.calendar!=="lunar");
});
$$(".ritual").forEach(b=>b.onclick=()=>{
 const r=b.dataset.ritual; state.rituals.has(r)?state.rituals.delete(r):state.rituals.add(r);
 b.classList.toggle("selected",state.rituals.has(r)); $("#attendanceBox").classList.toggle("hidden",!state.rituals.has("gaiji")); updatePersonTotal();
});
$$("[data-attendance]").forEach(b=>b.onclick=()=>{
 state.attendance=b.dataset.attendance;$$("[data-attendance]").forEach(x=>x.classList.toggle("selected",x===b));
 $("#clothesWarning").classList.toggle("hidden",state.attendance!=="no");
});
function updatePersonTotal(){let t=[...state.rituals].reduce((s,r)=>s+ritualPrices[r],0);$("#personTotal").textContent=money(t)}
function normalizeChineseLunar(dateStr){
 if(!dateStr)return null;
 try{
   const d=new Date(dateStr+"T12:00:00");
   const roc=d.getFullYear()-1911;
   const parts=new Intl.DateTimeFormat("zh-TW-u-ca-chinese",{month:"long",day:"numeric"}).formatToParts(d);
   let month=(parts.find(p=>p.type==="month")?.value||"");
   if(!month.endsWith("月")) month+="月";
   month=month.replace("十一月","冬月").replace("十二月","臘月").replace("一月","正月");
   const raw=parts.find(p=>p.type==="day")?.value||"";
   const n=parseInt(raw,10);
   const day=isNaN(n)?raw:(lunarDays[n-1]||raw);
   return {roc,month,day};
 }catch(e){return null}
}
function solarToLunar(dateStr){
 const x=normalizeChineseLunar(dateStr);
 return x?`民國${x.roc}年 農曆${x.month}${x.day}`:"";
}
$("#convertLunar").onclick=()=>{
 const v=$("#solarDate").value;if(!v){$("#lunarResult").textContent="⚠️ 請先選擇國曆出生日期";return}
 const r=solarToLunar(v);$("#lunarResult").textContent=r?("農曆："+r):"此裝置無法自動換算，請改用農曆手動填寫。";
};
function getBirth(){
 if(state.calendar==="solar"){
   const d=$("#solarDate").value;if(!d)return null;
   const x=normalizeChineseLunar(d);if(!x)return null;
   return {type:"國曆",raw:d,roc:x.roc,month:x.month,day:x.day,display:`民國${x.roc}年 農曆${x.month}${x.day}`};
 }
 if(state.calendar==="lunar"){
   const roc=parseInt($("#rocYear").value,10),month=$("#lunarMonth").value,day=$("#lunarDay").value;
   if(!roc||!month||!day)return null;
   return {type:"農曆",roc,month,day,display:`民國${roc}年 農曆${month}${day}`};
 }
 return null;
}
function validate(){
 let missing=[];if(!$("#personName").value.trim())missing.push("姓名");if(!getBirth())missing.push("生辰");
 if(!state.time)missing.push("時辰／吉時");if(!state.zodiac)missing.push("生肖");if(!$("#address").value.trim())missing.push("地址");
 if(!state.rituals.size)missing.push("至少選擇一項科儀");if(state.rituals.has("gaiji")&&!state.attendance)missing.push("祭改本人是否到場");
 if(missing.length){$("#formError").textContent="⚠️ 尚未完成："+missing.join("、");$("#formError").classList.remove("hidden");return false}
 $("#formError").classList.add("hidden");return true;
}
function collectPerson(){
 const birth=getBirth();return {name:$("#personName").value.trim(),birth,time:state.time,zodiac:state.zodiac,address:$("#address").value.trim(),rituals:[...state.rituals],attendance:state.rituals.has("gaiji")?state.attendance:null,total:[...state.rituals].reduce((s,r)=>s+ritualPrices[r],0)}
}
$("#savePerson").onclick=()=>{
 if(!validate())return;const p=collectPerson();
 if(state.editing!==null){state.people[state.editing]=p;state.editing=null}else state.people.push(p);
 renderPeople();
 if(state.mode==="single"){renderFinal();show("step3",3)}else show("stepPeople",2);
};
function resetForm(p=null){
 $("#personName").value=p?.name||"";$("#solarDate").value="";$("#rocYear").value="";$("#lunarMonth").value="";$("#lunarDay").value="";$("#address").value=p?.address||"";$("#lunarResult").textContent="選擇日期後按「轉換成農曆」";
 state.calendar=p?.birth?.type==="國曆"?"solar":p?.birth?.type==="農曆"?"lunar":null;state.time=p?.time||null;state.zodiac=p?.zodiac||null;state.attendance=p?.attendance||null;state.rituals=new Set(p?.rituals||[]);
 if(p?.birth?.type==="國曆")$("#solarDate").value=p.birth.raw;
 if(p?.birth?.type==="農曆"){ $("#rocYear").value=p.birth.roc||"";$("#lunarMonth").value=p.birth.month||"";$("#lunarDay").value=p.birth.day||""; }
 $$("[data-calendar]").forEach(x=>x.classList.toggle("selected",x.dataset.calendar===state.calendar));$("#solarBox").classList.toggle("hidden",state.calendar!=="solar");$("#lunarBox").classList.toggle("hidden",state.calendar!=="lunar");
 $("#timeGrid").querySelectorAll("button").forEach(x=>x.classList.toggle("selected",x.textContent===state.time));$("#zodiacGrid").querySelectorAll("button").forEach(x=>x.classList.toggle("selected",x.textContent===state.zodiac));
 $$(".ritual").forEach(x=>x.classList.toggle("selected",state.rituals.has(x.dataset.ritual)));$("#attendanceBox").classList.toggle("hidden",!state.rituals.has("gaiji"));
 $$("[data-attendance]").forEach(x=>x.classList.toggle("selected",x.dataset.attendance===state.attendance));$("#clothesWarning").classList.toggle("hidden",state.attendance!=="no");
 $("#formError").classList.add("hidden");updatePersonTotal();$("#personHeading").textContent=(state.editing!==null?"修改":"填寫")+"第 "+(state.editing!==null?state.editing+1:state.people.length+1)+" 位信徒資料";
}
function renderPeople(){
 $("#peopleList").innerHTML=state.people.map((p,i)=>`<div class="personCard"><div class="personTop"><b>${i+1}. ${esc(p.name)}</b><strong>${money(p.total)}</strong></div><div class="chips">${p.rituals.map(r=>`<span class="chip">${ritualNames[r]}</span>`).join("")}</div><div class="miniActions"><button onclick="editPerson(${i})">✏️ 修改</button><button onclick="deletePerson(${i})">🗑️ 刪除</button></div></div>`).join("");
}
window.editPerson=i=>{state.editing=i;resetForm(state.people[i]);show("step2",2)}
window.deletePerson=i=>{if(confirm("確定刪除「"+state.people[i].name+"」嗎？")){state.people.splice(i,1);renderPeople();if(!state.people.length) {resetForm();show("step2",2)}}}
$("#addPerson").onclick=()=>{state.editing=null;resetForm();show("step2",2)}
$("#groupNext").onclick=()=>{if(!state.people.length)return;renderFinal();show("step3",3)}
function birthText(p){return p.birth.display||`民國${p.birth.roc}年 農曆${p.birth.month}${p.birth.day}`}／農曆 ${p.birth.lunar}`:`農曆 ${p.birth.raw}`}
function renderFinal(){
 $("#finalSummary").innerHTML=state.people.map((p,i)=>`<div class="summaryCard"><b>${i+1}. ${esc(p.name)}</b><div>${esc(birthText(p))}・${p.time}・生肖${p.zodiac}</div><div>${esc(p.address)}</div><div class="chips">${p.rituals.map(r=>`<span class="chip">${ritualNames[r]} ${money(ritualPrices[r])}</span>`).join("")}</div>${p.attendance==="no"?'<div class="warning">祭改本人不克到場：需提前準備本人衣物放置宮廟。</div>':""}</div>`).join("");
 $("#grandTotal").textContent=money(state.people.reduce((s,p)=>s+p.total,0));
}
$("#backPeople").onclick=()=>{renderPeople();show(state.mode==="group"?"stepPeople":"step2",2)}
$("#makeSlip").type="button";
$("#makeSlip").onclick=(e)=>{
 e.preventDefault();
 try{renderSlip();show("step4",4)}
 catch(err){console.error(err);show("step4",4);$("#slipPreview").innerHTML='<div class="warning">資料已確認，請按下方「傳送報名單」。</div>'}
}
function renderSlip(){
 const total=state.people.reduce((s,p)=>s+p.total,0);
 $("#slipPreview").innerHTML=`<div class="slipHead"><h2>混元九龍太子聖誕祈福科儀</h2><b>報名確認單</b><div>共 ${state.people.length} 位</div></div>`+
 state.people.map((p,i)=>`<div class="slipPerson"><b>${i+1}. ${esc(p.name)}</b><br>生辰：${esc(birthText(p))}<br>時辰：${p.time}<br>生肖：${p.zodiac}<br>地址：${esc(p.address)}<br>科儀：${p.rituals.map(r=>ritualNames[r]+" "+money(ritualPrices[r])).join("、")}${p.attendance?`<br>祭改到場：${p.attendance==="yes"?"本人會到場":"本人不克到場（需提前準備本人衣物）"}`:""}<br><b>小計：${money(p.total)}</b></div>`).join("")+
 `<div class="slipTotal">應繳總額：${money(total)}</div><div style="margin-top:10px;font-size:12px">※ 祈安禮斗限25人，以官方LINE工作人員確認名額為準。<br>※ 此確認單須傳至官方LINE，經工作人員確認後才算完成報名。</div>`;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function wrap(ctx,text,x,y,maxWidth,lineHeight){
 const chars=[...text];let line="",lines=[];for(const ch of chars){let test=line+ch;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=ch}else line=test}if(line)lines.push(line);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight));return y+lines.length*lineHeight
}
function makeCanvas(){
 const W=1080,pad=70,line=46;
 // V4 bug fix: previous height calculation referenced an undefined variable.
 const estimated=430+state.people.reduce((sum,p)=>sum+330+(p.rituals.length*35)+(p.attendance?50:0),0);
 const H=Math.max(1000,estimated);
 const c=document.createElement("canvas");c.width=W;c.height=H;
 const ctx=c.getContext("2d");
 ctx.fillStyle="#fffaf0";ctx.fillRect(0,0,W,H);
 ctx.strokeStyle="#8b6325";ctx.lineWidth=6;ctx.strokeRect(24,24,W-48,H-48);
 ctx.textAlign="center";ctx.fillStyle="#681922";ctx.font="bold 48px sans-serif";
 ctx.fillText("混元九龍太子聖誕祈福科儀",W/2,90);
 ctx.font="bold 34px sans-serif";ctx.fillText("報名確認單",W/2,142);
 ctx.font="26px sans-serif";ctx.fillStyle="#3b2b22";ctx.fillText(`共 ${state.people.length} 位`,W/2,184);
 ctx.textAlign="left";let y=240;
 state.people.forEach((p,i)=>{
   ctx.font="bold 32px sans-serif";ctx.fillStyle="#681922";ctx.fillText(`${i+1}. ${p.name}`,pad,y);y+=48;
   ctx.font="25px sans-serif";ctx.fillStyle="#2d241e";
   y=wrap(ctx,`生辰：${birthText(p)}`,pad,y,W-pad*2,line);
   y=wrap(ctx,`時辰：${p.time}　生肖：${p.zodiac}`,pad,y,W-pad*2,line);
   y=wrap(ctx,`地址：${p.address}`,pad,y,W-pad*2,line);
   y=wrap(ctx,`科儀：${p.rituals.map(r=>ritualNames[r]+" "+money(ritualPrices[r])).join("、")}`,pad,y,W-pad*2,line);
   if(p.attendance)y=wrap(ctx,`祭改到場：${p.attendance==="yes"?"本人會到場":"本人不克到場（需提前準備本人衣物）"}`,pad,y,W-pad*2,line);
   ctx.font="bold 26px sans-serif";ctx.fillText(`小計：${money(p.total)}`,pad,y);y+=58;
   ctx.strokeStyle="#cbb89b";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pad,y-20);ctx.lineTo(W-pad,y-20);ctx.stroke();
 });
 ctx.font="bold 36px sans-serif";ctx.fillStyle="#681922";ctx.textAlign="right";
 ctx.fillText(`應繳總額：${money(state.people.reduce((s,p)=>s+p.total,0))}`,W-pad,y+10);y+=68;
 ctx.textAlign="left";ctx.font="22px sans-serif";ctx.fillStyle="#5b514a";
 y=wrap(ctx,"※ 祈安禮斗限25人，以官方LINE工作人員確認名額為準。",pad,y,W-pad*2,36);
 wrap(ctx,"※ 請將本報名單傳至官方LINE，經工作人員確認後才算完成報名。",pad,y+8,W-pad*2,36);
 return c;
}
function canvasBlob(){
 return new Promise((resolve,reject)=>{
   try{
     const c=makeCanvas();
     c.toBlob(blob=>blob?resolve(blob):reject(new Error("blob failed")),"image/png",1);
   }catch(e){reject(e)}
 });
}
async function getSlipFile(){
 const blob=await canvasBlob();
 return new File([blob],"混元九龍太子聖誕-報名確認單.png",{type:"image/png"});
}
async function showFallback(){
 try{
   const blob=await canvasBlob();
   const url=URL.createObjectURL(blob);
   $("#fallbackArea").classList.remove("hidden");
   $("#generatedImageBox").innerHTML="";
   const img=document.createElement("img");img.src=url;img.alt="報名確認單圖片";
   $("#generatedImageBox").appendChild(img);
   const a=document.createElement("a");a.href=url;a.download="混元九龍太子聖誕-報名確認單.png";a.className="primary full";a.style.display="block";a.style.marginTop="10px";a.style.textDecoration="none";a.style.textAlign="center";a.textContent="⬇️ 下載／儲存這張報名單";
   $("#generatedImageBox").appendChild(a);
   $("#fallbackArea").scrollIntoView({behavior:"smooth",block:"start"});
 }catch(e){
   alert("這個瀏覽器無法產生圖片，請直接截圖畫面中的報名確認單，再前往官方 LINE 傳送。");
   $("#fallbackArea").classList.remove("hidden");
 }
}
$("#shareSlip").onclick=async()=>{
 const btn=$("#shareSlip"),old=btn.textContent;btn.disabled=true;btn.textContent="正在產生報名單…";
 try{
   const file=await getSlipFile();
   if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
     try{
       await navigator.share({files:[file],title:"混元九龍太子聖誕報名確認單",text:"混元九龍太子聖誕祈福科儀報名確認單"});
     }catch(e){
       if(e && e.name!=="AbortError") await showFallback();
     }
   }else{
     await showFallback();
   }
 }catch(e){await showFallback()}
 finally{btn.disabled=false;btn.textContent=old}
};
$("#saveImage").onclick=showFallback;
