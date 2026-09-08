const KEY="gameTimeBankV3";
const defaultTasks=[
 {id:"music1",cat:"🎹 音楽教室",category:"music",icon:"🎹",name:"カレリア",min:30},
 {id:"music2",cat:"🎹 音楽教室",category:"music",icon:"🎹",name:"レッスンシート",min:25},
 {id:"music3",cat:"🎹 音楽教室",category:"music",icon:"🎹",name:"レパートリー",min:5},
 {id:"music4",cat:"🎹 音楽教室",category:"music",icon:"🎹",name:"両手カデンツ",min:10},
 {id:"music5",cat:"🎹 音楽教室",category:"music",icon:"🎹",name:"ロマンティックが止まらない",min:5},
 {id:"eng1",cat:"💬 英会話",category:"english",icon:"💬",name:"ドリル",min:5},
 {id:"eng2",cat:"💬 英会話",category:"english",icon:"💬",name:"Talking",min:10},
 {id:"eng3",cat:"💬 英会話",category:"english",icon:"💬",name:"1ｍチャレ",min:10}
];

let data=JSON.parse(localStorage.getItem(KEY)||"null")||{tasks:defaultTasks,days:{},activeSession:null};
if(!data.tasks)data.tasks=defaultTasks;
if(!data.days)data.days={};
if(!Object.prototype.hasOwnProperty.call(data,"activeSession"))data.activeSession=null;

let categoryChoices = JSON.parse(localStorage.getItem(KEY+"_categoryChoices"));
if(!categoryChoices || categoryChoices.length === 0) {
  categoryChoices = [
   {value:"music",label:"🎹 音楽教室",icon:"🎹"},
   {value:"english",label:"💬 英会話",icon:"💬"},
   {value:"study",label:"📚 勉強・宿題",icon:"📚"},
   {value:"other",label:"📝 その他",icon:"📝"}
  ];
}

function categoryInfo(v){
 return categoryChoices.find(c=>c.value===v) || categoryChoices[categoryChoices.length-1] || {value:"other",label:"📝 その他",icon:"📝"};
}
function categoryLabel(v){return categoryInfo(v).label}

data.tasks=data.tasks.map(t=>{
 let category=t.category;
 if(!category) category=String(t.cat||"").includes("英")?"english":String(t.cat||"").includes("音")?"music":"other";
 const icon=categoryInfo(category).icon;
 return {...t,category,icon,cat:categoryLabel(category)};
});

function categoryClass(v){return ["music","english","study","other"].includes(v)?v:"other"}
function taskCategoryText(t){return categoryLabel(t.category)}

function renderCategorySettings(){
 const box=document.getElementById("categorySettings"); if(!box)return;
 box.innerHTML="";
 
 categoryChoices.forEach((c, index)=>{
  const row=document.createElement("div"); row.className="category-edit-row";
  const currentName = c.label.replace(/^[^\s]+\s*/,""); 
  
  row.innerHTML=`
    <button class="category-icon-btn" title="アイコンを変更">${c.icon}</button>
    <input data-cat="${c.value}" value="${esc(currentName)}">
    <button class="remove-cat" title="削除">✕</button>
  `;
  
  row.querySelector(".category-icon-btn").onclick = () => {
    const newIcon = prompt("新しいアイコン（絵文字など）を入力してください:", c.icon);
    if(newIcon && newIcon.trim()) {
      c.icon = newIcon.trim();
      updateCategoryLabel(c, row.querySelector("input").value);
      renderCategorySettings();
    }
  };

  row.querySelector(".remove-cat").onclick = () => {
    if(categoryChoices.length <= 1) {
      alert("種類は最低1つ必要です。");
      return;
    }
    if(confirm(`「${c.label}」を削除しますか？\n※この種類を使っているクエストは、後で種類を選び直す必要があります。`)){
      categoryChoices.splice(index, 1);
      renderCategorySettings();
      document.querySelectorAll(".category-select").forEach(sel => {
        const currentVal = sel.value;
        sel.innerHTML = categoryChoices.map(ch=>`<option value="${ch.value}" ${ch.value===currentVal?"selected":""}>${esc(categoryLabel(ch.value))}</option>`).join("");
      });
    }
  };

  const input=row.querySelector("input");
  input.oninput=() => updateCategoryLabel(c, input.value);
  box.appendChild(row);
 });
}

function updateCategoryLabel(categoryObj, inputValue) {
  const val = inputValue.trim() || "名称未設定";
  categoryObj.label = categoryObj.icon + " " + val;
  document.querySelectorAll(`.category-select option[value="${categoryObj.value}"]`).forEach(opt=>{
    opt.textContent = categoryObj.label;
  });
}

function saveCategorySettings(){
 localStorage.setItem(KEY+"_categoryChoices", JSON.stringify(categoryChoices));
}

let timerInterval=null;

// ----- 修正箇所1：ローカル時間（日本時間）で今日の日付を取得する関数を追加 -----
function getLocalYMD(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
const todayKey=()=>getLocalYMD(new Date());
// -------------------------------------------------------------------------

function day(){const k=todayKey();if(!data.days[k])data.days[k]={done:[],logs:[]};return data.days[k]}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function mins(n){return `${Math.max(0,Math.round(n))}分`}
function timeStr(d){return new Date(d).toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})}
function dateLabel(){const d=new Date(),w=["日","月","火","水","木","金","土"][d.getDay()];return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${w}）`}
function earnedFor(d){return data.tasks.reduce((s,t)=>s+(d.done?.includes(t.id)?Number(t.min):0),0)}
function earned(){return earnedFor(day())}
function used(){return day().logs.reduce((s,l)=>s+Number(l.min),0)}
function carry(){
 let total=0;
 const keys=Object.keys(data.days).sort();
 for(const k of keys){
  if(k===todayKey())break;
  const d=data.days[k];
  total+=earnedFor(d);
  total-=(d.logs||[]).reduce((s,l)=>s+Number(l.min),0);
 }
 return Math.max(0,total)
}
function activeElapsedMinutes(){
 const s=data.activeSession;
 if(!s)return 0;
 return Math.max(0,(Date.now()-s.startAt)/60000);
}
function balance(){
 const base=Math.max(0,carry()+earned()-used());
 return Math.max(0,base-activeElapsedMinutes());
}
function showToast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>t.classList.remove("show"),1800)}

function render(){
 document.getElementById("todayLabel").textContent=dateLabel();
 const bal=balance();
 document.getElementById("balance").innerHTML=`${Math.floor(bal)}<span>分</span>`;
 document.getElementById("remainMessage").textContent=bal>0?"ゲームできるよ！":"クエストをして時間をGETしよう！";
 document.getElementById("todayEarned").textContent=mins(earned());
 document.getElementById("todayUsed").textContent=mins(used()+activeElapsedMinutes());
 document.getElementById("studyTotal").textContent=earned();
 document.getElementById("taskDoneCount").textContent=day().done.length;
 document.getElementById("taskTotalCount").textContent=data.tasks.length;
 const pct=data.tasks.length?Math.min(100,day().done.length/data.tasks.length*100):0;
 document.getElementById("studyProgress").style.width=pct+"%";
 document.getElementById("carry").textContent=mins(carry());
 document.getElementById("sumEarn").textContent=`＋${earned()}分`;
 document.getElementById("sumUse").textContent=`−${Math.round(used()+activeElapsedMinutes())}分`;
 document.getElementById("summaryBalance").textContent=mins(bal);
 const list=document.getElementById("taskList");list.innerHTML="";
 data.tasks.forEach(t=>{
  const done=day().done.includes(t.id),el=document.createElement("div"),cc=categoryClass(t.category);
  el.className="task cat-"+cc+(done?" done":"");
  el.innerHTML=`<div class="task-icon task-cat ${cc}">${esc(t.icon||"📝")}</div><div class="check" aria-label="完了">${done?"✓":""}</div><div><div class="task-name">${esc(t.name)}</div><div class="task-cat-text">${esc(taskCategoryText(t))}</div></div><div class="points">＋${t.min}分</div>`;
  el.onclick=()=>{if(done){day().done=day().done.filter(x=>x!==t.id);showToast("チェックを取り消しました")}else{day().done.push(t.id);showToast(`🎉 ＋${t.min}分 GET！`)}save();render()};
  list.appendChild(el);
 });
 const logs=document.getElementById("logs");logs.innerHTML="";
 if(!day().logs.length)logs.innerHTML='<div class="empty">まだゲーム記録はありません</div>';
 else [...day().logs].reverse().forEach(l=>{
  const el=document.createElement("div");el.className="log";
  el.innerHTML=`<div><div class="log-time">${l.start?timeStr(l.start):"直接入力"}${l.end?" ～ "+timeStr(l.end):""}</div><div class="log-kind">${l.kind||"ゲーム"}</div></div><div class="log-use">−${l.min}分</div><div class="log-remain">残り ${l.remain}分</div>`;
  logs.appendChild(el);
 });
 renderWeek();
 renderTimer();
}

function renderWeek(){
 const now=new Date(),labels=["日","月","火","水","木","金","土"],rows=[];
 for(let i=6;i>=0;i--){
  const d=new Date(now);d.setDate(now.getDate()-i);
  
  // ----- 修正箇所2：週間グラフ処理もローカル時間を使用する -----
  const k=getLocalYMD(d),dd=data.days[k]||{done:[]};
  // --------------------------------------------------------
  
  rows.push({k,label:labels[d.getDay()],value:earnedFor(dd),today:i===0});
 }
 const max=Math.max(30,...rows.map(x=>x.value));
 document.getElementById("weekTotal").textContent=mins(rows.reduce((s,x)=>s+x.value,0));
 document.getElementById("weekChart").innerHTML=rows.map(x=>`<div class="bar-wrap"><div class="bar-value">${x.value}分</div><div class="bar ${x.today?"today":""}" style="height:${Math.max(4,x.value/max*125)}px"></div><div class="bar-label">${x.label}</div></div>`).join("");
 const total=rows.reduce((s,x)=>s+x.value,0),stars=Math.min(7,Math.floor(total/30));
 document.getElementById("starRow").innerHTML=Array.from({length:7},(_,i)=>`<span class="star ${i<stars?"on":""}">⭐</span>`).join("");
}

function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function sessionElapsedSec(){return data.activeSession?Math.max(0,(Date.now()-data.activeSession.startAt)/1000):0}
function timerText(sec){
 sec=Math.max(0,Math.ceil(sec));
 const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;
 return h?`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function renderTimer(){
 const s=data.activeSession;
 const timer=document.getElementById("timer");
 if(!s){
  timer.textContent="00:00";
  document.getElementById("timerStatus").textContent="待機中";
  document.getElementById("timerNote").textContent="「ゲーム開始」を押すと、タブレットを閉じても時間が進みます。";
  document.getElementById("startBtn").disabled=false;
  document.getElementById("finishBtn").disabled=true;
  timer.className="timer";
  return;
 }
 const remaining=Math.max(0,s.allowedSec-sessionElapsedSec());
 timer.textContent=timerText(remaining);
 document.getElementById("timerStatus").textContent="ゲーム中";
 document.getElementById("timerNote").textContent=`残り時間は自動で減ります。画面を閉じても止まりません。`;
 document.getElementById("startBtn").disabled=true;
 document.getElementById("finishBtn").disabled=false;
 timer.className="timer running";
 if(remaining<=0)finishTimer(true);
}

function startTimer(){
 if(data.activeSession){renderTimer();return}
 const bal=Math.floor(balance());
 if(bal<=0){alert("ゲーム時間がありません。クエストをクリアして時間をGETしましょう！");return}
 data.activeSession={startAt:Date.now(),allowedSec:bal*60};
 save(); showToast(`🎮 ${bal}分スタート！`); render(); startLiveTimer();
}

function startLiveTimer(){
 clearInterval(timerInterval);
 timerInterval=setInterval(()=>{
  if(!data.activeSession){clearInterval(timerInterval);return}
  const remaining=Math.max(0,data.activeSession.allowedSec-sessionElapsedSec());
  document.getElementById("timer").textContent=timerText(remaining);
  const bal=balance();
  document.getElementById("balance").innerHTML=`${Math.floor(bal)}<span>分</span>`;
  document.getElementById("todayUsed").textContent=mins(used()+activeElapsedMinutes());
  document.getElementById("sumUse").textContent=`−${Math.round(used()+activeElapsedMinutes())}分`;
  document.getElementById("summaryBalance").textContent=mins(bal);
  if(remaining<=0)finishTimer(true);
 },250);
}

function finishTimer(auto=false){
 const s=data.activeSession;if(!s)return;
 const elapsedSec=sessionElapsedSec();
 // 秒単位を正確に考慮し、実際に経過した秒数をそのまま分数に換算（切り上げ）して消費する
 const useMin = Math.min(s.allowedSec/60, Math.max(1/60, elapsedSec/60));
 const useRounded = Math.round(useMin * 10) / 10; // 小数点第1位まで正確に記録
 const start=s.startAt,end=Date.now();
 data.activeSession=null;
 if(useMin>0){
  const remainAfter=Math.max(0,Math.floor(carry()+earned()-used()-useMin));
  day().logs.push({start,end,min:useRounded,remain:remainAfter,kind:auto?"タイマー（自動終了）":"タイマー"});
 }
 save();clearInterval(timerInterval);timerInterval=null;render();
 document.getElementById("timerNote").textContent=auto?"⏰ ゲーム時間を使い切りました！":"ゲーム終了。おつかれさま！";
 showToast(auto?"⏰ ゲーム時間終了！":`🎮 −${useRounded}分 使用`);
}

document.getElementById("startBtn").onclick=startTimer;
document.getElementById("finishBtn").onclick=()=>finishTimer(false);
document.querySelectorAll("[data-min]").forEach(b=>b.onclick=()=>{
 if(data.activeSession){alert("タイマー中は直接消費できません。ゲーム終了を押すかお待ちください。");return}
 const n=Number(b.dataset.min),bal=Math.floor(balance());
 if(bal<n){alert(`残りは${bal}分です。`);return}
 day().logs.push({start:null,end:null,min:n,remain:bal-n,kind:"直接入力"});save();render();showToast(`🎮 −${n}分 使用`);
});

document.getElementById("resetTodayBtn").onclick=()=>{
 if(data.activeSession){alert("ゲーム中はリセットできません。先に終了してください。");return}
 if(confirm("今日のチェックと記録を全部リセットしますか？")){data.days[todayKey()]={done:[],logs:[]};save();render();showToast("今日をリセットしました")}
};
document.getElementById("clearLogsBtn").onclick=()=>{
 if(data.activeSession){alert("ゲーム中は記録を削除できません。");return}
 if(confirm("今日のゲーム記録だけ削除しますか？")){day().logs=[];save();render();showToast("ゲーム記録を削除しました")}
};

document.getElementById("settingsBtn").onclick = () => {
  const currentPwd = localStorage.getItem(KEY+"_password") || "0000";
  const input = prompt("保護者用パスワードを入力してください。\n（初期パスワードは 0000 です）");
  
  if (input === null) return;
  if (input !== currentPwd) {
    alert("パスワードが違います。");
    return;
  }
  
  openSettings();
};

function openSettings(){
 const box=document.getElementById("settingsTasks");box.innerHTML="";
 data.tasks.forEach(t=>addSettingRow(t,box));
 renderCategorySettings();
 renderMonthlyReport();
 
 const currentPwd = localStorage.getItem(KEY+"_password") || "0000";
 document.getElementById("parentPassword").value = currentPwd;
 
 const modal=document.getElementById("settingsModal");
 modal.classList.add("show"); modal.setAttribute("aria-hidden","false");
}

document.getElementById("savePasswordBtn").onclick = () => {
  const newPwd = document.getElementById("parentPassword").value.trim();
  if(newPwd) {
    localStorage.setItem(KEY+"_password", newPwd);
    alert("パスワードを変更しました！次回からこのパスワードを使用してください。");
  } else {
    alert("パスワードを入力してください。");
  }
};

function renderMonthlyReport() {
  const container = document.getElementById("monthlyReport");
  const monthly = {};
  
  for (const [date, dayData] of Object.entries(data.days)) {
    const month = date.slice(0, 7);
    if (!monthly[month]) monthly[month] = { total: 0, categories: {} };
    
    (dayData.done || []).forEach(taskId => {
       const t = data.tasks.find(x => x.id === taskId);
       if (t) {
         monthly[month].total += Number(t.min);
         monthly[month].categories[t.category] = (monthly[month].categories[t.category] || 0) + Number(t.min);
       }
    });
  }
  
  const months = Object.keys(monthly).sort().reverse();
  if(months.length === 0) {
     container.innerHTML = '<div class="empty" style="padding:10px;">まだ記録がありません</div>';
     return;
  }
  
  let html = '<table class="report-table"><tr><th>月</th><th>合計</th><th>種類別内訳</th></tr>';
  months.forEach(m => {
    const mData = monthly[m];
    const [yyyy, mm] = m.split("-");
    const monthLabel = `${yyyy}年${Number(mm)}月`;
    
    const cats = Object.entries(mData.categories)
      .map(([cat, min]) => `${esc(categoryLabel(cat))}: <b>${min}分</b>`)
      .join("<br>");
      
    html += `<tr>
      <td>${monthLabel}</td>
      <td style="font-size:16px;font-weight:900;color:#4b7bec">${mData.total}分</td>
      <td style="font-size:12px;color:#506176;line-height:1.5">${cats || "なし"}</td>
    </tr>`;
  });
  html += '</table>';
  container.innerHTML = html;
}

let draggedSetting=null;
function addSettingRow(t,box){
 const r=document.createElement("div");r.className="setting-row";r.dataset.id=t.id;
 const cat=t.category||"other";
 
 r.innerHTML=`<div class="drag-handle" title="上下にスワイプして並べ替え">☰</div>
 <select class="category-select">${categoryChoices.map(c=>`<option value="${c.value}" ${c.value===cat?"selected":""}>${esc(categoryLabel(c.value))}</option>`).join("")}</select>
 <input class="sn" value="${esc(t.name)}">
 <input class="sm" type="number" min="0" value="${t.min}">
 <button class="remove-task">✕</button>`;
 r.querySelector(".remove-task").onclick=()=>r.remove();
 
 const handle=r.querySelector(".drag-handle");
 handle.style.touchAction = "none";

 let pointerId = null, dragging = false;
 let placeholder = null, startY = 0, initialTop = 0, initialLeft = 0, initialWidth = 0;

 const beginSwipe = (e) => {
  if(dragging) return;
  dragging = true;
  draggedSetting = r;

  const rect = r.getBoundingClientRect();
  startY = e.clientY;
  initialTop = rect.top;
  initialLeft = rect.left;
  initialWidth = rect.width;

  placeholder = r.cloneNode(true);
  placeholder.style.opacity = "0"; 
  box.insertBefore(placeholder, r);

  r.style.position = "fixed";
  r.style.top = initialTop + "px";
  r.style.left = initialLeft + "px";
  r.style.width = initialWidth + "px";
  r.style.zIndex = "9999";
  r.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
  
  const bg = getComputedStyle(r).backgroundColor;
  r.style.backgroundColor = (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') ? '#fff' : bg;
  r.classList.add("dragging","touch-grabbed");
 };

 handle.addEventListener("pointerdown", e => {
  pointerId = e.pointerId;
  try{handle.setPointerCapture(pointerId)}catch(_){ }
  beginSwipe(e); e.preventDefault();
 });

 handle.addEventListener("pointermove", e => {
  if(pointerId !== e.pointerId || !dragging) return;
  e.preventDefault();
  const deltaY = e.clientY - startY;
  r.style.transform = `translateY(${deltaY}px)`;
  const currentY = initialTop + deltaY + r.offsetHeight / 2;
  const siblings = [...box.querySelectorAll('.setting-row:not(.dragging)')];
  const nextSibling = siblings.find(sib => {
   const rect = sib.getBoundingClientRect();
   return currentY <= rect.top + rect.height / 2;
  });

  if (placeholder.nextSibling !== nextSibling) box.insertBefore(placeholder, nextSibling || null);
 });

 const endPointer = e => {
  if(pointerId !== e.pointerId) return;
  if(dragging){
   if(placeholder){
    box.insertBefore(r, placeholder);
    placeholder.remove();
    placeholder = null;
   }
   r.style.position = ""; r.style.top = ""; r.style.left = ""; r.style.width = ""; r.style.zIndex = ""; r.style.boxShadow = ""; r.style.backgroundColor = ""; r.style.transform = "";
   r.classList.remove("dragging","touch-grabbed");
   draggedSetting = null;
  }
  try{handle.releasePointerCapture(pointerId)}catch(_){ }
  pointerId = null; dragging = false;
 };

 handle.addEventListener("pointerup", endPointer);
 handle.addEventListener("pointercancel", endPointer);
 box.appendChild(r);
}

document.getElementById("closeSettings").onclick=()=>{
 const modal=document.getElementById("settingsModal");modal.classList.remove("show");modal.setAttribute("aria-hidden","true");
};
document.getElementById("addTaskBtn").onclick=()=>{
 addSettingRow({id:"new"+Date.now(),cat:"📝 その他",category:"other",icon:"📝",name:"新しいクエスト",min:5},document.getElementById("settingsTasks"));
};
document.getElementById("addCategoryBtn").onclick = () => {
  const newValue = "cat_" + Date.now();
  categoryChoices.push({ value: newValue, label: "🆕 新しい種類", icon: "🆕" });
  renderCategorySettings();
  document.querySelectorAll(".category-select").forEach(sel => {
    sel.insertAdjacentHTML('beforeend', `<option value="${newValue}">${esc("🆕 新しい種類")}</option>`);
  });
};

document.getElementById("saveSettings").onclick=()=>{
 if(document.getElementById("categorySettings")) saveCategorySettings();
 const oldById=Object.fromEntries(data.tasks.map(t=>[t.id,t]));
 const rows=[...document.querySelectorAll("#settingsTasks .setting-row")];
 data.tasks=rows.map((r,i)=>{
  const id=r.dataset.id||("custom"+Date.now()+i),old=oldById[id];
  const category=r.querySelector(".category-select").value;
  const ci=categoryInfo(category);
  return {
   id,category,cat:ci.label,icon:ci.icon,
   name:r.querySelector(".sn").value||"クエスト",
   min:Math.max(0,Number(r.querySelector(".sm").value)||0)
  };
 });
 save();
 document.getElementById("settingsModal").classList.remove("show");
 document.getElementById("settingsModal").setAttribute("aria-hidden","true");
 render();
 showToast("設定を保存しました");
};

document.getElementById("factoryReset").onclick=()=>{
 if(confirm("全データを消去して初期状態に戻します。よろしいですか？")){
   localStorage.getItem(KEY);
   localStorage.removeItem(KEY);
   localStorage.removeItem(KEY+"_categoryChoices");
   localStorage.removeItem(KEY+"_password");
   location.reload();
 }
};

if(data.activeSession){
 const remaining=Math.max(0,data.activeSession.allowedSec-sessionElapsedSec());
 if(remaining<=0)finishTimer(true);
 else startLiveTimer();
}
render();

// ----- 修正箇所3：スリープ復帰時などの画面自動更新処理を追加 -----
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    render();
  }
});
// --------------------------------------------------------