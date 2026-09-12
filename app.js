const APP_VERSION="V33";
const customStyle = document.createElement('style');
customStyle.textContent = `
.setting-row{display:grid; grid-template-columns:30px 110px minmax(0,1fr) 58px 70px 34px!important; gap:6px; align-items:center; margin-bottom:8px;}
@media(max-width:520px){.setting-row{grid-template-columns:24px 72px minmax(0,1fr) 54px 54px 28px!important; gap:4px;}}

.setting-row select, .setting-row input.sn, .setting-row input.sm {
  height: 36px;
  box-sizing: border-box;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 14px;
  padding: 0 8px;
  background: #fff;
  margin: 0;
}
.setting-row input.sm { width: 52px; padding: 0 4px; text-align: center; }
.setting-row .s-manual { transform: scale(1.2); margin: 0; cursor: pointer; }
.setting-time-cell{display:flex;align-items:center;justify-content:center;gap:2px;min-width:0;height:36px;font-size:11px;color:#68778c;white-space:nowrap;}
.setting-time-cell .sm{width:44px!important;min-width:0;}
.setting-count-cell{display:flex;align-items:center;justify-content:center;cursor:pointer;margin:0;height:36px;min-width:0;}
.setting-count-cell input{width:auto!important;padding:0!important;border:0!important;}
.setting-row .remove-task { height: 36px; width: 100%; border-radius: 6px; display: flex; align-items: center; justify-content: center; padding: 0; }

.task.partial { border-color:#8cc3ff; background:#f4f9ff; }
.task.partial .check { background:#e7f1ff; border-color:#8cc3ff; color:#4b7bec; font-weight:900; }
.manual-check{min-width:42px;min-height:42px;display:flex;align-items:center;justify-content:center;border-radius:10px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;}
.manual-check:active{transform:scale(.92);}

.task-count-input { width: 44px; padding: 4px 2px; text-align: center; border: 2px solid #e1e8f0; border-radius: 6px; font-size: 15px; font-weight: 900; color: #4b7bec; background: #fff; transition: 0.2s; }
.task-count-input:focus { outline: none; border-color: #4b7bec; background: #f4f9ff; }
.manual-input-wrap { display: flex; align-items: center; gap: 3px; flex-shrink: 0; }
.task-right-area { display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: auto; }

#dangerFooterArea {
  margin-top: 50px;
  padding: 24px 12px 50px;
  border-top: 1px dashed #d1d8e0;
  text-align: center;
  background: transparent;
}
#dangerFooterArea p {
  font-size: 11px;
  color: #a0aec0;
  margin-bottom: 8px;
}
.btn-subtle-reset {
  background: #edf2f7 !important;
  color: #718096 !important;
  border: 1px solid #cbd5e0 !important;
  font-size: 11px !important;
  padding: 6px 12px !important;
  border-radius: 6px !important;
  box-shadow: none !important;
  opacity: 0.8;
  cursor: pointer;
  margin: 0 4px;
}
.btn-subtle-reset:hover {
  opacity: 1;
  background: #e2e8f0 !important;
}
`;
document.head.appendChild(customStyle);

const KEY="gameTimeBankV3";

let lastPlayedVoice = null;
let lastPlayed15Min = 0;

const voiceAudioCache = {};
const VOICE_ASSETS = [
  './sound/voice/start.opus',
  './sound/voice/nokori30hun.opus',
  './sound/voice/nokori10hun.opus',
  './sound/voice/nokori5hun.opus',
  './sound/voice/nokori1hun.opus',
  './sound/voice/stop.opus',
  './sound/voice/30min_passed.opus',
  './sound/voice/60min_passed.opus',
  './sound/voice/finish.opus'
];

function preloadVoiceAssets() {
  VOICE_ASSETS.forEach(path => {
    if (!voiceAudioCache[path]) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = path;
      audio.load();
      voiceAudioCache[path] = audio;
    }
  });
}

function playSound(path, type) {
  if (type === 'se' && localStorage.getItem(KEY+"_se") === "false") return;
  if (type === 'voice' && localStorage.getItem(KEY+"_voice") === "false") return;

  const audio = voiceAudioCache[path] || new Audio(path);
  audio.currentTime = 0;
  const p = audio.play();
  if (p && typeof p.catch === 'function') {
    p.catch(e => console.log("音声再生エラー:", path, e));
  }
}
const defaultTasks=[
 {id:"study1",cat:"🏫 学校",category:"study",icon:"🏫",name:"音・計・リ",min:10,allowManualCount:false},
 {id:"music1",cat:"🎹 音楽教室",category:"music",icon:"🎹",name:"カレリア(1回につき)",min:5,allowManualCount:true},
 {id:"music2",cat:"🎹 音楽教室",category:"music",icon:"🎹",name:"レッスンシート",min:25,allowManualCount:false},
 {id:"music3",cat:"🎹 音楽教室",category:"music",icon:"🎹",name:"レパートリー",min:5,allowManualCount:false},
 {id:"music4",cat:"🎹 音楽教室",category:"music",icon:"🎹",name:"両手カデンツ",min:10,allowManualCount:false},
 {id:"music5",cat:"🎹 音楽教室",category:"music",icon:"🎹",name:"ロマンティックが止まらない(1回につき)",min:5,allowManualCount:true},
 {id:"eng1",cat:"💬 英会話",category:"english",icon:"💬",name:"ドリル",min:5,allowManualCount:false},
 {id:"eng2",cat:"💬 英会話",category:"english",icon:"💬",name:"Talking",min:10,allowManualCount:false},
 {id:"eng3",cat:"💬 英会話",category:"english",icon:"💬",name:"1ｍチャレ",min:10,allowManualCount:false}
];

let data=JSON.parse(localStorage.getItem(KEY)||"null")||{tasks:defaultTasks,days:{},activeSession:null};
if(!data.tasks)data.tasks=defaultTasks;
if(!data.days)data.days={};
if(!Object.prototype.hasOwnProperty.call(data,"activeSession"))data.activeSession=null;
if(data.activeSession && !data.activeSession.voiceMilestones) data.activeSession.voiceMilestones={};
preloadVoiceAssets();

let categoryChoices = JSON.parse(localStorage.getItem(KEY+"_categoryChoices"));
if(!categoryChoices || categoryChoices.length === 0) {
  categoryChoices = [
   {value:"music",label:"🎹 音楽教室",icon:"🎹"},
   {value:"english",label:"💬 英会話",icon:"💬"},
   {value:"study",label:"🏫 学校",icon:"🏫"},
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

function getLocalYMD(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
const todayKey=()=>getLocalYMD(new Date());

function day(){const k=todayKey();if(!data.days[k])data.days[k]={done:[]};if(!data.days[k].logs)data.days[k].logs=[];return data.days[k]}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function mins(n){return `${Math.max(0,Math.floor(n))}分`}
function timeStr(d){return new Date(d).toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})}
function dateLabel(){const d=new Date(),w=["日","月","火","水","木","金","土"][d.getDay()];return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${w}）`}

function earnedFor(d){
 return data.tasks.reduce((s,t) => {
   const count = (d.done || []).filter(x => x === t.id).length;
   const validCount = t.allowManualCount ? count : Math.min(count, 1);
   return s + (validCount * Number(t.min));
 }, 0);
}

function earned(){return earnedFor(day())}
function used(){return day().logs.reduce((s,l)=>s+Number(l.min),0)}

function todayPlayedMinutes() {
  return day().logs.filter(l => l.kind !== "直接入力").reduce((s, l) => s + Number(l.min), 0);
}

function todayDirectMinutes() {
  return day().logs.filter(l => l.kind === "直接入力").reduce((s, l) => s - Number(l.min), 0);
}

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

window.updateManualCount = (id, val) => {
  let num = parseInt(val) || 0;
  if (num < 0) num = 0;
  day().done = day().done.filter(x => x !== id);
  for(let i=0; i<num; i++) day().done.push(id);
  save(); render(); showToast("回数を更新しました");
};

function cleanUpOldLayout() {
  const msgEl = document.getElementById("remainMessage");
  if (msgEl) {
    msgEl.style.display = "none";
    if (msgEl.parentElement) {
      Array.from(msgEl.parentElement.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.includes("あと")) {
           node.textContent = node.textContent.replace(/あと/g, "").trim();
        }
      });
      if (msgEl.parentElement.tagName === "P" && msgEl.parentElement.textContent.trim() === "") {
         msgEl.parentElement.style.display = "none";
      }
    }
  }
  
  const oldSuffix = document.getElementById("balanceSuffix");
  if (oldSuffix) oldSuffix.remove();
  
  const balEl = document.getElementById("balance");
  if (balEl && balEl.parentElement) {
     balEl.parentElement.style.display = "";
     balEl.parentElement.style.flexDirection = "";
     balEl.parentElement.style.flexWrap = "";
     balEl.parentElement.style.justifyContent = "";
     balEl.parentElement.style.alignItems = "";
  }
}

function updateBalanceDisplay(bal){
  const safeBal=Math.max(0, Number(bal)||0);

  // 「残りゲーム時間」はゲーム中だけカウントダウン表示。
  // ゲーム終了後は銀行に残っている時間を再表示する。
  if(!data.activeSession){
    const timerEl=document.getElementById("timer");
    if(timerEl){
      const totalSec=Math.max(0, Math.round(safeBal*60));
      const mm=Math.floor(totalSec/60);
      const ss=totalSec%60;
      timerEl.textContent=String(mm).padStart(2,"0")+":"+String(ss).padStart(2,"0");
    }
  }

  // 既存の残高表示処理を安全に更新
  document.querySelectorAll(".balance-value,[data-balance-display]").forEach(el=>{
    el.textContent=formatBank(safeBal);
  });
}

function updateStickyTimer() {
  const el = document.getElementById("stickyTimer");
  if (!el) return;
  el.style.display = "block";
  
  const s = data.activeSession;
  if (s) {
    const remaining = Math.max(0, s.allowedSec - sessionElapsedSec());
    el.textContent = "🎮 " + timerText(remaining);
    el.style.color = "#e96565";
    el.style.background = "#fee2e2";
  } else {
    const bal = Math.floor(balance());
    el.textContent = "残り " + bal + "分";
    el.style.color = "#4b7bec";
    el.style.background = "#eef2f7";
  }
}

function formatBank(val) {
  if (val > 0) return `<span style="color:#4b7bec;">＋${val}分</span>`;
  if (val < 0) return `<span style="color:#e96565;">−${Math.abs(val)}分</span>`;
  return `<span style="color:#24324a;">0分</span>`;
}

function render(){
 document.getElementById("todayLabel").textContent=dateLabel();
 const bal=balance();
 
 updateBalanceDisplay(bal);
 updateStickyTimer();
 
 document.getElementById("todayEarned").textContent=mins(earned());
 document.getElementById("todayUsed").textContent=mins(used()+activeElapsedMinutes());
 document.getElementById("studyTotal").textContent=earned();

 const completedTasks = data.tasks.filter(t => {
   const count = day().done.filter(x => x === t.id).length;
   return t.allowManualCount ? count > 0 : count >= 1;
 }).length;

 document.getElementById("taskDoneCount").textContent=completedTasks;
 document.getElementById("taskTotalCount").textContent=data.tasks.length;
 const pct=data.tasks.length?Math.min(100,completedTasks/data.tasks.length*100):0;
 document.getElementById("studyProgress").style.width=pct+"%";
 
 const playedMin = todayPlayedMinutes() + activeElapsedMinutes();
 const directMin = todayDirectMinutes();

 document.getElementById("carry").innerHTML = formatBank(carry());
 document.getElementById("sumEarn").innerHTML = formatBank(earned());
 document.getElementById("sumPlay").innerHTML = formatBank(-Math.round(playedMin));
 document.getElementById("sumDirect").innerHTML = formatBank(directMin);
 document.getElementById("summaryBalance").innerHTML = formatBank(Math.floor(bal));
 
 const list=document.getElementById("taskList");list.innerHTML="";
 
 data.tasks.forEach(t=>{
  const count = day().done.filter(x => x === t.id).length;
  const done = t.allowManualCount ? count > 0 : count >= 1;
  
  const cc=categoryClass(t.category);
  const el=document.createElement("div");
  el.className="task cat-"+cc+(done?" done":"");
  
  const checkHtml = done ? "✅" : "";

  let rightAreaHtml = "";
  if (t.allowManualCount) {
    rightAreaHtml = `<div class="manual-input-wrap" onclick="event.stopPropagation()">
      <input type="number" class="task-count-input" value="${count}" min="0" onchange="updateManualCount('${t.id}', this.value)">
      <span style="font-size:12px;font-weight:bold;color:#68778c;">回</span>
      <span class="points" style="margin-left:2px;line-height:1.2;">×${t.min}分</span>
    </div>`;
  } else {
    rightAreaHtml = `<div class="points" style="text-align:right;line-height:1.2;">＋${t.min}分</div>`;
  }

  el.innerHTML=`<div class="task-icon task-cat ${cc}">${esc(t.icon||"📝")}</div><div class="check${t.allowManualCount?" manual-check":""}" aria-label="${t.allowManualCount?"チェックをON/OFF":"完了"}">${checkHtml}</div><div style="flex-grow:1;min-width:0;overflow:hidden;"><div class="task-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(t.name)}</div><div class="task-cat-text">${esc(taskCategoryText(t))}</div></div><div class="task-right-area">${rightAreaHtml}</div>`;

  if(t.allowManualCount){
    const checkEl=el.querySelector(".manual-check");
    checkEl.style.cursor="pointer";
    checkEl.title="タップでON/OFF";
    checkEl.onclick=(e)=>{
      e.preventDefault();
      e.stopPropagation();
      const currentCount=day().done.filter(x=>x===t.id).length;
      if(currentCount>0){
        day().done=day().done.filter(x=>x!==t.id);
        showToast("チェックをOFFにしました（0回）");
      }else{
        day().done.push(t.id);
        showToast(`🎉 ＋${t.min}分 GET！ (計1回)`);
      }
      save();
      render();
    };
  }
  
  el.onclick=(e)=>{
    if(e.target.tagName === 'INPUT') return;
    if(e.target.closest(".manual-check")) return;
    
    const prevDoneCount = data.tasks.filter(task => {
       const c = day().done.filter(x => x === task.id).length;
       return task.allowManualCount ? c > 0 : c >= 1;
    }).length;

    if(t.allowManualCount){
      day().done.push(t.id);
      showToast(`🎉 ＋${t.min}分 GET！ (計${count+1}回)`);
    }else{
      if(done){
        day().done=day().done.filter(x=>x!==t.id);
        showToast("チェックを取り消しました");
      }else{
        day().done.push(t.id);
        showToast(`🎉 クエスト完了！ ＋${t.min}分`);
      }
    }

    const newDoneCount = data.tasks.filter(task => {
       const c = day().done.filter(x => x === task.id).length;
       return task.allowManualCount ? c > 0 : c >= 1;
    }).length;

    if (newDoneCount > prevDoneCount) {
        const totalTasks = data.tasks.length;
        if (newDoneCount === totalTasks) {
            playSound('./sound/se/perfect.opus', 'se');
            showCharacterEffect('all');
        } else if ([2, 4, 6].includes(newDoneCount)) {
            playSound('./sound/se/clear.opus', 'se');
            showCharacterEffect(newDoneCount);
        }
    }

    save();render();
  };
  list.appendChild(el);
 });

 const logs=document.getElementById("logs");logs.innerHTML="";
 if(!day().logs.length)logs.innerHTML='<div class="empty">まだゲーム記録はありません</div>';
 else [...day().logs].reverse().forEach(l=>{
  const el=document.createElement("div");el.className="log";

  let useText = `−${l.min}`;
  let useStyle = "";

  if (l.kind === "直接入力") {
    if (l.min < 0) {
      useText = `+${Math.abs(l.min)}`;
      useStyle = "color: #4b7bec;";
    } else {
      useText = `-${l.min}`;
      useStyle = "color: #e96565;";
    }
  } else {
    useText = `−${l.min}`;
  }

  el.innerHTML=`<div><div class="log-time">${l.start?timeStr(l.start):"直接入力"}${l.end?" ～ "+timeStr(l.end):""}</div><div class="log-kind">${l.kind||"ゲーム"}</div></div><div class="log-use" style="${useStyle}">${useText}分</div><div class="log-remain">残り ${l.remain}分</div>`;
  logs.appendChild(el);
 });
 renderWeek();
 renderTimer();

  // V33: restore remaining game time after rendering when no session is active.
  if(!data.activeSession){
    const timerEl=document.getElementById("timer");
    if(timerEl){
      const totalSec=Math.max(0, Math.round(Math.max(0, Number(balance())||0)*60));
      timerEl.textContent=String(Math.floor(totalSec/60)).padStart(2,"0")+":"+String(totalSec%60).padStart(2,"0");
    }
  }
}

function showCharacterEffect(clearCount) {
  const imageMap = {
    2: './image/Cleared_2.webp',
    4: './image/Cleared_4.webp',
    6: './image/Cleared_6.webp',
    all: './image/Cleared_all.webp'
  };
  const imagePath = imageMap[clearCount];
  if (!imagePath) return;

  // 直前の演出が残っていた場合は一度削除してから表示
  const old = document.querySelector('.character-effect-container');
  if (old) old.remove();

  const container = document.createElement('div');
  container.className = 'character-effect-container';

  const image = document.createElement('img');
  image.className = 'character-effect-image';
  image.src = imagePath;
  image.alt = '';

  // 画像そのものに「〇〇個クリア！」の文字が入っているため、追加の文字は表示しない
  container.appendChild(image);

  // キラキラを追加
  ['✨','⭐','✨','🌟'].forEach((symbol, i) => {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.textContent = symbol;
    sparkle.style.left = `${20 + i * 20}%`;
    sparkle.style.top = `${18 + (i % 2) * 55}%`;
    sparkle.style.animationDelay = `${i * 0.15}s`;
    container.appendChild(sparkle);
  });

  const closeEffect = () => {
    if (!container.isConnected) return;
    container.classList.add('fade-out');
    setTimeout(() => container.remove(), 500);
  };

  container.addEventListener('click', closeEffect);
  document.body.appendChild(container);
  setTimeout(closeEffect, 2200);
}

function renderWeek(){
 const now=new Date(),labels=["日","月","火","水","木","金","土"],rows=[];
 for(let i=6;i>=0;i--){
  const d=new Date(now);d.setDate(now.getDate()-i);
  const k=getLocalYMD(d),dd=data.days[k]||{done:[]};
  rows.push({k,label:labels[d.getDay()],value:earnedFor(dd),today:i===0});
 }
 const max=Math.max(30,...rows.map(x=>x.value));
 document.getElementById("weekTotal").textContent=mins(rows.reduce((s,x)=>s+x.value,0));
 document.getElementById("weekChart").innerHTML=rows.map(x=>`<div class="bar-wrap"><div class="bar-value">${x.value}分</div><div class="bar ${x.today?"today":""}" style="height:${Math.max(4,x.value/max*125)}px"></div><div class="bar-label">${x.label}</div></div>`).join("");
 const todayData=data.days[getLocalYMD(now)]||{done:[]};
 const completedCount=data.tasks.filter(t=>{
   const count=(todayData.done||[]).filter(x=>x===t.id).length;
   return t.allowManualCount ? count>0 : count>=1;
 }).length;
 const completionRate=data.tasks.length ? completedCount/data.tasks.length : 0;
 const stars=Math.min(7,Math.max(0,Math.round(completionRate*7)));
 document.getElementById("starRow").innerHTML=Array.from({length:7},(_,i)=>`<span class="star ${i<stars?"on":""}">⭐</span>`).join("");
}

function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&quot;","'":"&#039;"}[m]))}
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

function markVoiceMilestones(elapsedSec) {
  const s = data.activeSession;
  if (!s) return;

  // Threshold crossing is used instead of exact-second matching.
  // This also catches thresholds after iPhone/iPad background throttling.
  const remainingSec = Math.max(0, s.allowedSec - elapsedSec);
  const remainingVoices = [
    { sec: 1800, path: './sound/voice/nokori30hun.opus' },
    { sec: 600,  path: './sound/voice/nokori10hun.opus' },
    { sec: 300,  path: './sound/voice/nokori5hun.opus' },
    { sec: 60,   path: './sound/voice/nokori1hun.opus' }
  ];

  if (!s.voiceMilestones) s.voiceMilestones = {};

  remainingVoices.forEach(item => {
    if (s.allowedSec >= item.sec &&
        remainingSec <= item.sec &&
        !s.voiceMilestones['remain_'+item.sec]) {
      playSound(item.path, 'voice');
      s.voiceMilestones['remain_'+item.sec] = true;
    }
  });

  const elapsedVoices = [
    { sec: 1800, path: './sound/voice/30min_passed.opus' },
    { sec: 3600, path: './sound/voice/60min_passed.opus' }
  ];

  elapsedVoices.forEach(item => {
    if (s.allowedSec >= item.sec &&
        elapsedSec >= item.sec &&
        !s.voiceMilestones['elapsed_'+item.sec]) {
      playSound(item.path, 'voice');
      s.voiceMilestones['elapsed_'+item.sec] = true;
    }
  });
}

function startTimer(){
  if(data.activeSession){renderTimer();return}
  const bal=Math.floor(balance());
  if(bal<=0){alert("ゲーム時間がありません。クエストをクリアして時間をGETしましょう！");return}

  data.activeSession={
    startAt:Date.now(),
    allowedSec:bal*60,
    voiceMilestones:{}
  };

  lastPlayedVoice = null;
  lastPlayed15Min = 0;

  // Start button is a user gesture on iPhone/iPad, so preload the voice files here.
  preloadVoiceAssets();
  playSound('./sound/voice/start.opus', 'voice');

  save(); showToast(`🎮 ${bal}分スタート！`); render(); startLiveTimer();
}

function startLiveTimer(){
  clearInterval(timerInterval);
  timerInterval=setInterval(()=>{
    if(!data.activeSession){clearInterval(timerInterval);return}

    const elapsedSec=sessionElapsedSec();
    const remaining=Math.max(0,data.activeSession.allowedSec-elapsedSec);
    document.getElementById("timer").textContent=timerText(remaining);

    const bal=balance();
    updateBalanceDisplay(bal);
    updateStickyTimer();

    document.getElementById("todayUsed").textContent=mins(used()+activeElapsedMinutes());

    const playedMin = todayPlayedMinutes() + activeElapsedMinutes();
    document.getElementById("sumPlay").innerHTML = formatBank(-Math.round(playedMin));
    document.getElementById("summaryBalance").innerHTML = formatBank(Math.floor(bal));

    markVoiceMilestones(elapsedSec);

    const elapsed = Math.floor(elapsedSec);
    const elapsed15MinCount = Math.floor(elapsed / 900);
    if (elapsed15MinCount > 0 && elapsed15MinCount > lastPlayed15Min) {
      playSound('./sound/se/pikon_15hun.opus', 'se');
      lastPlayed15Min = elapsed15MinCount;
    }

    if(remaining<=0)finishTimer(true);
  },250);
}

function finishTimer(auto=false){
  const s=data.activeSession;if(!s)return;
  const elapsedSec=sessionElapsedSec();
  const useMin = Math.min(s.allowedSec/60, Math.max(1/60, elapsedSec/60));
  const useRounded = Math.round(useMin * 10) / 10;
  const start=s.startAt,end=Date.now();
  data.activeSession=null;
  if(useMin>0){
    const remainAfter=Math.max(0,Math.floor(carry()+earned()-used()-useMin));
    day().logs.push({start,end,min:useRounded,remain:remainAfter,kind:auto?"タイマー（自動終了）":"タイマー"});
  }

  // Manual "ゲーム終了" uses the requested stop voice.
  // Automatic exhaustion keeps the existing finish voice.
  playSound(auto ? './sound/voice/finish.opus' : './sound/voice/stop.opus', 'voice');

  save();clearInterval(timerInterval);timerInterval=null;render();
  document.getElementById("timerNote").textContent=auto?"⏰ ゲーム時間を使い切りました！":"ゲーム終了。おつかれさま！";
  showToast(auto?"⏰ ゲーム時間終了！":`🎮 −${useRounded}分 使用`);
}

document.getElementById("startBtn").onclick=startTimer;
document.getElementById("finishBtn").onclick=()=>finishTimer(false);

function applyDirectTime(isAdd) {
  if (data.activeSession) {
    alert("タイマー中は直接入力できません。ゲーム終了を押すかお待ちください。");
    return;
  }
  
  const inputEl = isAdd ? document.getElementById("directTimeAddInput") : document.getElementById("directTimeSubInput");
  const val = inputEl.value;
  const inputMin = parseInt(val, 10);
  
  if (isNaN(inputMin) || inputMin <= 0) {
    alert("1以上の数値を入力してください。");
    return;
  }

  const bal = Math.floor(balance());
  
  if (!isAdd) {
    if (bal < inputMin) {
      alert(`残高（${bal}分）が足りません。`);
      return;
    }
    day().logs.push({start:null, end:null, min: inputMin, remain: bal - inputMin, kind: "直接入力"});
    showToast(`🎮 ${inputMin}分 減らしました`);
  } else {
    day().logs.push({start:null, end:null, min: -inputMin, remain: bal + inputMin, kind: "直接入力"});
    showToast(`🎉 ＋${inputMin}分 追加しました`);
  }
  
  save();
  render();
  inputEl.value = "";
}

const applyDirectAddBtn = document.getElementById("applyDirectAddBtn");
if(applyDirectAddBtn) applyDirectAddBtn.onclick = () => applyDirectTime(true);

const applyDirectSubBtn = document.getElementById("applyDirectSubBtn");
if(applyDirectSubBtn) applyDirectSubBtn.onclick = () => applyDirectTime(false);

[document.getElementById("directTimeAddInput"), document.getElementById("directTimeSubInput")].forEach(el => {
  if (el) {
    el.addEventListener("input", function() {
      let val = this.value;
      val = val.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      this.value = val.replace(/[^\d]/g, "");
    });
  }
});

function setupRelocatedResetButtons() {
  const resetBtn = document.getElementById("resetTodayBtn");
  const clearLogsBtn = document.getElementById("clearLogsBtn");
  
  if (resetBtn) {
    let footerArea = document.getElementById("dangerFooterArea");
    if (!footerArea) {
      footerArea = document.createElement("div");
      footerArea.id = "dangerFooterArea";
      footerArea.innerHTML = `<p>※保護者用管理操作エリア</p><div id="appVersion" style="font-size:11px;color:#a0aec0;margin-bottom:12px;">アプリバージョン：${APP_VERSION}</div>`;
      
      const appContainer = document.querySelector(".app-container") || document.querySelector(".container") || document.body;
      appContainer.appendChild(footerArea);
    }
    
    resetBtn.className = "btn-subtle-reset";
    footerArea.appendChild(resetBtn);
    
    if (clearLogsBtn) {
      clearLogsBtn.className = "btn-subtle-reset";
      footerArea.appendChild(clearLogsBtn);
    }

    resetBtn.onclick = () => {
      if(data.activeSession){alert("ゲーム中はリセットできません。先に終了してください。");return}
      if(confirm("【保護者確認】\n今日のチェックと記録をすべて消去しますか？")){
        if(confirm("※本当に今日の記録をリセットしてよろしいですか？（取り消せません）")){
          data.days[todayKey()]={done:[],logs:[]};
          save();render();
          showToast("今日をリセットしました");
        }
      }
    };

    if (clearLogsBtn) {
      clearLogsBtn.onclick = () => {
        if(data.activeSession){alert("ゲーム中は記録を削除できません。");return}
        if(confirm("【保護者確認】今日のゲーム記録だけ削除しますか？")){
          day().logs=[];
          save();render();
          showToast("ゲーム記録を削除しました");
        }
      };
    }
  }
}
setTimeout(setupRelocatedResetButtons, 100);

document.getElementById("settingsBtn").onclick = () => {
  playSound('./sound/se/pi_memu.opus', 'se');
  
  const requirePwd = localStorage.getItem(KEY+"_requirePwd") !== "false";
  
  if (requirePwd) {
    const currentPwd = localStorage.getItem(KEY+"_password") || "0000";
    const input = prompt("保護者用パスワードを入力してください。\n（初期パスワードは 0000 です）");
    
    if (input === null) return;
    if (input !== currentPwd) {
      alert("パスワードが違います。");
      return;
    }
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
 
 document.getElementById("requirePasswordCheck").checked = (localStorage.getItem(KEY+"_requirePwd") !== "false");
 document.getElementById("soundSeCheck").checked = (localStorage.getItem(KEY+"_se") !== "false");
 document.getElementById("soundVoiceCheck").checked = (localStorage.getItem(KEY+"_voice") !== "false");
 
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
    
    const countMap = {};
    (dayData.done || []).forEach(taskId => {
       countMap[taskId] = (countMap[taskId] || 0) + 1;
    });

    Object.keys(countMap).forEach(taskId => {
       const t = data.tasks.find(x => x.id === taskId);
       if (t) {
         const validCount = t.allowManualCount ? countMap[taskId] : Math.min(countMap[taskId], 1);
         const earnedMin = validCount * Number(t.min);
         
         monthly[month].total += earnedMin;
         monthly[month].categories[t.category] = (monthly[month].categories[t.category] || 0) + earnedMin;
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
 <div class="setting-time-cell"><input class="sm" type="number" min="0" value="${t.min}"><span>分</span></div>
 <label class="setting-count-cell" title="回数枠"><input type="checkbox" class="s-manual" ${t.allowManualCount?'checked':''}></label>
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
 addSettingRow({id:"new"+Date.now(),cat:"📝 その他",category:"other",icon:"📝",name:"新しいクエスト",min:5,allowManualCount:false},document.getElementById("settingsTasks"));
};
document.getElementById("addCategoryBtn").onclick = () => {
  const newValue = "cat_" + Date.now();
  categoryChoices.push({ value: newValue, label: "🆕 新しい種類", icon: "🆕" });
  renderCategorySettings();
  document.querySelectorAll(".category-select").forEach(sel => {
    sel.insertAdjacentHTML('beforeend', `<option value="${newValue}">${esc("🆕 新しい種類")}</option>`);
  });
};

document.getElementById("saveSettings").onclick = () => {
  const newTasks = [];
  document.querySelectorAll("#settingsTasks .setting-row").forEach(r => {
    const id = r.dataset.id;
    const category = r.querySelector(".category-select").value;
    const name = r.querySelector(".sn").value;
    const min = Number(r.querySelector(".sm").value);
    const allowManualCount = r.querySelector(".s-manual").checked;
    const catInfo = categoryInfo(category);
    newTasks.push({id, category, cat: catInfo.label, icon: catInfo.icon, name, min, allowManualCount});
  });
  data.tasks = newTasks;
  save();
  saveCategorySettings();
  render();
  document.getElementById("closeSettings").click();
  showToast("設定を保存しました");
};

document.getElementById("forceUpdateBtn").onclick = () => {
  if(confirm("アプリを最新版に更新しますか？")){
     if('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
           for(let registration of registrations) { registration.unregister(); }
        });
     }
     window.location.reload(true);
  }
};

document.getElementById("factoryReset").onclick = () => {
  if(confirm("【警告】すべてのデータを初期化しますか？\n（クエスト設定、履歴、パスワードなどすべて消えます）")){
    if(confirm("※本当に初期化してよろしいですか？（取り消せません）")){
       localStorage.removeItem(KEY);
       localStorage.removeItem(KEY+"_categoryChoices");
       localStorage.removeItem(KEY+"_password");
       localStorage.removeItem(KEY+"_requirePwd");
       localStorage.removeItem(KEY+"_se");
       localStorage.removeItem(KEY+"_voice");
       window.location.reload();
    }
  }
};

document.getElementById("requirePasswordCheck").onchange = (e) => {
  localStorage.setItem(KEY+"_requirePwd", e.target.checked);
};
document.getElementById("soundSeCheck").onchange = (e) => {
  localStorage.setItem(KEY+"_se", e.target.checked);
};
document.getElementById("soundVoiceCheck").onchange = (e) => {
  localStorage.setItem(KEY+"_voice", e.target.checked);
};

render();