const customStyle = document.createElement('style');
customStyle.textContent = `
.setting-row{grid-template-columns:30px 110px minmax(40px,1fr) auto 34px!important; gap:4px; align-items:center;}
@media(max-width:520px){.setting-row{grid-template-columns:24px 75px minmax(30px,1fr) auto 28px!important; gap:2px;}}
.setting-row input.sm { width: 52px; padding: 4px 2px; text-align: center; }
.setting-row .s-manual { transform: scale(1.1); margin-right: 2px; cursor: pointer; }
.task.partial { border-color:#8cc3ff; background:#f4f9ff; }
.task.partial .check { background:#e7f1ff; border-color:#8cc3ff; color:#4b7bec; font-weight:900; }
.task-count-input { width: 44px; padding: 4px 2px; text-align: center; border: 2px solid #e1e8f0; border-radius: 6px; font-size: 15px; font-weight: 900; color: #4b7bec; background: #fff; transition: 0.2s; }
.task-count-input:focus { outline: none; border-color: #4b7bec; background: #f4f9ff; }
.manual-input-wrap { display: flex; align-items: center; gap: 3px; flex-shrink: 0; }
.task-right-area { display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: auto; }

/* 誤操作防止：最下部リセットエリアのスタイル */
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
const defaultTasks=[
 {id:"music1",cat:"🎹 音楽教室",category:"music",icon:"🎹",name:"カレリア",min:30,allowManualCount:true},
 {id:"music2",cat:"🎹 音楽教室",category:"music",icon:"🎹",name:"レッスンシート",min:25,allowManualCount:false},
 {id:"music3",cat:"🎹 音楽教室",category:"music",icon:"🎹",name:"レパートリー",min:5,allowManualCount:true},
 {id:"music4",cat:"🎹 音楽教室",category:"music",icon:"🎹",name:"両手カデンツ",min:10,allowManualCount:false},
 {id:"music5",cat:"🎹 音楽教室",category:"music",icon:"🎹",name:"ロマンティックが止まらない",min:5,allowManualCount:false},
 {id:"eng1",cat:"💬 英会話",category:"english",icon:"💬",name:"ドリル",min:5,allowManualCount:true},
 {id:"eng2",cat:"💬 英会話",category:"english",icon:"💬",name:"Talking",min:10,allowManualCount:false},
 {id:"eng3",cat:"💬 英会話",category:"english",icon:"💬",name:"1ｍチャレ",min:10,allowManualCount:true}
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

function getLocalYMD(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
const todayKey=()=>getLocalYMD(new Date());

function day(){const k=todayKey();if(!data.days[k])data.days[k]={done:[]};if(!data.days[k].logs)data.days[k].logs=[];return data.days[k]}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function mins(n){return `${Math.max(0,Math.round(n))}分`}
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

/* --- 周囲の文字を小さく、数字を大きく調整したレイアウト関数 --- */
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

function updateBalanceDisplay(bal) {
  cleanUpOldLayout();
  const balEl = document.getElementById("balance");
  if (!balEl) return;
  
  // 周囲の文字を小さく（14px）、数字を大きく（48px）調整
  if (bal > 0) {
     balEl.innerHTML = `
       <div style="display:flex; align-items:baseline; justify-content:center; flex-wrap:wrap; margin-bottom: 6px;">
         <span style="font-size:14px; font-weight:normal; margin-right:4px; opacity:0.9;">あと</span>
         <span style="font-size:48px; line-height:1; font-weight:900; margin:0 3px;">${Math.floor(bal)}<span style="font-size:20px; font-weight:bold; margin-left:2px;">分</span></span>
         <span style="font-size:14px; font-weight:normal; margin-left:4px; opacity:0.9;">ゲームできるよ！</span>
       </div>
     `;
  } else {
     balEl.innerHTML = `
       <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; margin-bottom: 6px;">
         <span style="font-size:14px; font-weight:normal; opacity:0.9;">クエストをして時間をGETしよう！</span>
         <span style="font-size:48px; line-height:1; font-weight:900;">0<span style="font-size:20px; font-weight:bold; margin-left:2px;">分</span></span>
       </div>
     `;
  }
}

// --- 追加: stickyTimerを更新する関数 ---
function updateStickyTimer() {
  const el = document.getElementById("stickyTimer");
  if (!el) return;
  el.style.display = "block"; // 非表示状態から表示に切り替え
  
  const s = data.activeSession;
  if (s) {
    // ゲーム中：タイマーを表示して色を赤系にする
    const remaining = Math.max(0, s.allowedSec - sessionElapsedSec());
    el.textContent = "🎮 " + timerText(remaining);
    el.style.color = "#e96565";
    el.style.background = "#fee2e2";
  } else {
    // 待機中：残高を表示して色を青系にする
    const bal = Math.floor(balance());
    el.textContent = "残り " + bal + "分";
    el.style.color = "#4b7bec";
    el.style.background = "#eef2f7";
  }
}

function render(){
 document.getElementById("todayLabel").textContent=dateLabel();
 const bal=balance();
 
 updateBalanceDisplay(bal);
 
 updateStickyTimer(); // ← ここでヘッダーの残り時間を更新
 
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
 document.getElementById("carry").textContent=mins(carry());
 document.getElementById("sumEarn").textContent=`＋${earned()}分`;
 document.getElementById("sumUse").textContent=`−${Math.round(used()+activeElapsedMinutes())}分`;
 document.getElementById("summaryBalance").textContent=mins(bal);
 const list=document.getElementById("taskList");list.innerHTML="";
 
 data.tasks.forEach(t=>{
  const count = day().done.filter(x => x === t.id).length;
  const done = t.allowManualCount ? count > 0 : count >= 1;
  
  const cc=categoryClass(t.category);
  const el=document.createElement("div");
  el.className="task cat-"+cc+(done?" done":"");
  
  const checkHtml = done ? "✓" : "";

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

  el.innerHTML=`<div class="task-icon task-cat ${cc}">${esc(t.icon||"📝")}</div><div class="check" aria-label="完了">${checkHtml}</div><div style="flex-grow:1;min-width:0;overflow:hidden;"><div class="task-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(t.name)}</div><div class="task-cat-text">${esc(taskCategoryText(t))}</div></div><div class="task-right-area">${rightAreaHtml}</div>`;
  
  el.onclick=(e)=>{
    if(e.target.tagName === 'INPUT') return;
    
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
    save();render();
  };
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
  const k=getLocalYMD(d),dd=data.days[k]||{done:[]};
  rows.push({k,label:labels[d.getDay()],value:earnedFor(dd),today:i===0});
 }
 const max=Math.max(30,...rows.map(x=>x.value));
 document.getElementById("weekTotal").textContent=mins(rows.reduce((s,x)=>s+x.value,0));
 document.getElementById("weekChart").innerHTML=rows.map(x=>`<div class="bar-wrap"><div class="bar-value">${x.value}分</div><div class="bar ${x.today?"today":""}" style="height:${Math.max(4,x.value/max*125)}px"></div><div class="bar-label">${x.label}</div></div>`).join("");
 const total=rows.reduce((s,x)=>s+x.value,0),stars=Math.min(7,Math.floor(total/30));
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
  updateBalanceDisplay(bal);
  
  updateStickyTimer(); // ← ここでもヘッダーの残り時間をリアルタイム更新
  
  document.getElementById("todayUsed").textContent=mins(used()+activeElapsedMinutes());
  document.getElementById("sumUse").textContent=`−${Math.round(used()+activeElapsedMinutes())}分`;
  document.getElementById("summaryBalance").textContent=mins(bal);
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

/* --- 誤操作防止対策：リセットボタンを最下部領域へ移動＆2段階確認 --- */
function setupRelocatedResetButtons() {
  const resetBtn = document.getElementById("resetTodayBtn");
  const clearLogsBtn = document.getElementById("clearLogsBtn");
  
  if (resetBtn) {
    let footerArea = document.getElementById("dangerFooterArea");
    if (!footerArea) {
      footerArea = document.createElement("div");
      footerArea.id = "dangerFooterArea";
      footerArea.innerHTML = "<p>※保護者用管理操作エリア</p>";
      
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
 <div style="display:flex;flex-direction:row;align-items:center;gap:4px;font-size:11px;color:#68778c;white-space:nowrap;">
   <div style="display:flex;align-items:center;gap:1px;"><input class="sm" type="number" min="0" value="${t.min}" style="width:52px">分</div>
   <label style="display:flex;align-items:center;gap:1px;cursor:pointer;margin:0;"><input type="checkbox" class="s-manual" ${t.allowManualCount?'checked':''}> 回数枠</label>
 </div>
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

document.getElementById("saveSettings").onclick=()=>{
 if(document.getElementById("categorySettings")) saveCategorySettings();
 const rows=[...document.querySelectorAll("#settingsTasks .setting-row")];
 data.tasks=rows.map((r,i)=>{
  const id=r.dataset.id||("custom"+Date.now()+i);
  const category=r.querySelector(".category-select").value;
  const ci=categoryInfo(category);
  return {
    id,category,cat:ci.label,icon:ci.icon,
    name:r.querySelector(".sn").value||"クエスト",
    min:Math.max(0,Number(r.querySelector(".sm").value)||0),
    allowManualCount: r.querySelector(".s-manual").checked
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

/* --- 0時（深夜）をまたいだ時の自動更新 --- */
function scheduleMidnightRefresh() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const timeUntilMidnight = tomorrow - now;
  
  setTimeout(() => {
    location.reload();
  }, timeUntilMidnight);
}
scheduleMidnightRefresh();

if(data.activeSession){
 const remaining=Math.max(0,data.activeSession.allowedSec-sessionElapsedSec());
 if(remaining<=0)finishTimer(true);
 else startLiveTimer();
}
render();

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    render();
  }
});