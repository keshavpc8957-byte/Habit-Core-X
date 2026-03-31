// FOR LOGIN/SIGNUP
let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = localStorage.getItem("currentUser");

// ❌ अगर login नहीं किया → वापस भेज दो
if(!currentUser || !users[currentUser]){
  alert("Please login first");
  window.location.href = "../login/login.html";
}

/* ── STATE ── */
const quotes = [
  "🌟 Small steps every day lead to massive results!",
  "🔥 Discipline is choosing what you want most over what you want now.",
  "💪 Your habits are sculpting your future, one day at a time.",
  "🎯 Success is the sum of small efforts, repeated day in and day out.",
  "✨ You don't rise to the level of your goals, you fall to the level of your systems.",
  "🚀 The secret of getting ahead is getting started.",
  "🌱 Every day you water your habits, they grow stronger.",
  "⚡ Motivation gets you going, but habit keeps you growing.",
  "🏆 Champions don't do extraordinary things; they do ordinary things extraordinarily.",
  "💎 Be consistent. Consistency compounds into excellence."
];

const categoryMeta = {
  health:  {emoji:'🥗', color:'#27ae60', label:'Health'},
  study:   {emoji:'📚', color:'#3498db', label:'Study'},
  skill:   {emoji:'🎸', color:'#e67e22', label:'Skill'},
  mindset: {emoji:'🧘', color:'#9b59b6', label:'Mindset'},
  fitness: {emoji:'💪', color:'#1abc9c', label:'Fitness'},
};

let habits = users[currentUser].data?.habits || [];
let notes  = users[currentUser].data?.notes || {};
let nextId = Math.max(0,...habits.map(h=>h.id))+1;

const now   = new Date();
let curMonth= now.getMonth();
let curYear = now.getFullYear();
const TODAY = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

let lineChart, donutChart, barChart, hbarChart;
let notesActiveDate='';

/* ── INIT ── */
function init(){
  const name = localStorage.getItem("currentUserName");
  document.getElementById('userName').textContent = name || users[currentUser].name || currentUser;
  document.getElementById('monthSel').value = curMonth;
  document.getElementById('yearSel').value  = curYear;
  buildMarquee();
  buildAll();
}

function buildAll(){
  renderTable();
  renderDashboard();
  renderAnalytics();
  renderRankings();
}

function buildMarquee(){
  const inner = document.getElementById('marqueeInner');
  const dup = [...quotes,...quotes];
  inner.innerHTML = dup.map(q=>`<span>${q}</span>`).join('');
}

/* ── DATE HELPERS ── */
function getDaysInMonth(m,y){ return new Date(y,m+1,0).getDate() }
function getDateStr(d){ return `${curYear}-${String(curMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` }
function getWeekNum(d){
  // Day-of-month → week index 0-4
  return Math.floor((d-1)/7);
}

function getWeekDays(){
  const days = getDaysInMonth(curMonth,curYear);
  const weeks = [[],[],[],[],[]];
  for(let d=1;d<=days;d++) weeks[getWeekNum(d)].push(d);
  return weeks.filter(w=>w.length);
}

/* ── STATS ── */
function habitStats(habit){
  const days  = getDaysInMonth(curMonth,curYear);
  const today = new Date();
  const isCurrentMonth = (curMonth===today.getMonth()&&curYear===today.getFullYear());
  let completed=0, missed=0, currentStreak=0, bestStreak=0, tmp=0;
  const todayDay = today.getDate();

  for(let d=1;d<=days;d++){
    const dateStr=getDateStr(d);
    const val=habit.checks[dateStr];
    const isPast = !isCurrentMonth || d < todayDay;
    const isToday= isCurrentMonth && d===todayDay;
    if(val==='done'){
      completed++;
      tmp++;
      if(tmp>bestStreak) bestStreak=tmp;
    } else {
      if(isPast&&!isToday) tmp=0;
    }
  }
  // current streak: count backwards from today
  const refDay = isCurrentMonth ? todayDay : days;
  tmp=0;
  for(let d=refDay;d>=1;d--){
    if(habit.checks[getDateStr(d)]==='done') tmp++;
    else break;
  }
  currentStreak=tmp;
  const goal = habit.goal||30;
  const remaining = Math.max(0,goal-completed);
  const pct = Math.round((completed/goal)*100);
  return {completed,missed,remaining,pct,currentStreak,bestStreak,goal};
}

function monthlyStats(){
  const habits_list = habits;
  let totalCompleted=0, totalGoal=0;
  habits_list.forEach(h=>{
    const s=habitStats(h);
    totalCompleted+=s.completed;
    totalGoal+=s.goal;
  });
  const rate = totalGoal>0?Math.round((totalCompleted/totalGoal)*100):0;
  return {totalCompleted,totalGoal,rate};
}

function weeklyStats(){
  const weeks=getWeekDays();
  return weeks.map((wdays,wi)=>{
    let total=0,achieved=0;
    habits.forEach(h=>{
      total+=h.goal>0?Math.round(h.goal*(wdays.length/getDaysInMonth(curMonth,curYear))):wdays.length;
      wdays.forEach(d=>{ if(h.checks[getDateStr(d)]==='done') achieved++; });
    });
    const pct = total>0?Math.round((achieved/total)*100):0;
    return {pct,achieved,total,days:wdays};
  });
}

function dailyTotals(){
  const days=getDaysInMonth(curMonth,curYear);
  return Array.from({length:days},(_,i)=>{
    const d=i+1;
    return habits.filter(h=>h.checks[getDateStr(d)]==='done').length;
  });
}

/* ── RENDER TABLE ── */
function renderTable(){
  const days   = getDaysInMonth(curMonth,curYear);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('trackerMonthLabel').textContent = `${months[curMonth]} ${curYear}`;

  // Head
  let th='<tr>';
  th+=`<th class="sticky-col">Habit</th>`;
  th+=`<th class="col-goal">Goal</th>`;
  for(let d=1;d<=days;d++){
    const ds=getDateStr(d);
    const isToday=ds===TODAY;
    th+=`<th style="${isToday?'color:var(--accent);background:var(--surface2)':''}" data-tip="${new Date(curYear,curMonth,d).toDateString()}" onclick="openNotes('${ds}')" style="cursor:pointer">${d}</th>`;
  }
  th+=`<th class="col-meta">Done</th><th class="col-meta">Left</th><th class="col-meta">Progress</th><th class="col-meta">Streak</th>`;
  th+='</tr>';
  document.getElementById('tableHead').innerHTML=th;

  // Body
  let tb='';
  habits.forEach(h=>{
    const s=habitStats(h);
    const catM=categoryMeta[h.cat]||categoryMeta.health;
    const pctClass=s.pct>=70?'pct-green':s.pct>=40?'pct-yellow':'pct-red';
    const fillColor=s.pct>=70?'#27ae60':s.pct>=40?'#f39c12':'#e74c3c';

    tb+=`<tr data-hid="${h.id}">`;
    tb+=`<td class="sticky-col"><div class="habit-name-cell">
      <span class="habit-emoji">${h.emoji}</span>
      <div>
        <div class="habit-name">${h.name}</div>
        <span class="habit-cat cat-${h.cat}">${catM.label}</span>
      </div>
      <span style="margin-left:auto;cursor:pointer;color:var(--text3);font-size:14px" onclick="deleteHabit(${h.id})" title="Remove">✕</span>
    </div></td>`;
    tb+=`<td><b>${h.goal}</b></td>`;

    for(let d=1;d<=days;d++){
      const ds=getDateStr(d);
      const val=h.checks[ds]||'';
      const isToday=ds===TODAY;
      const today=new Date();
      
      const isFuture=false;
      let cls='day-cell';
      let icon='';
      if(val==='done'){cls+=' done';icon='✓'}
      else if(val==='missed'){cls+=' missed';icon='✕'}
      if(isToday) cls+=' today-cell';
      if(isFuture) cls+=' future';

      tb+=`<td>
  <div class="${cls}" data-id="${h.id}" data-date="${ds}" onclick="toggleCheck(${h.id}, '${ds}')">
    ${icon}
  </div>
</td>`;
    }

    tb+=`<td><b style="color:#27ae60">${s.completed}</b></td>`;
    tb+=`<td><b style="color:#e74c3c">${s.remaining}</b></td>`;
    tb+=`<td>
      <span class="pct-pill ${pctClass}">${s.pct}%</span>
      <div class="habit-progress-bar"><div class="habit-progress-fill" style="width:${Math.min(s.pct,100)}%;background:${fillColor}"></div></div>
    </td>`;
    tb+=`<td><span class="streak-badge">🔥 ${s.currentStreak}</span></td>`;
    tb+='</tr>';
  });
  document.getElementById('tableBody').innerHTML=tb;
}

/* ── RENDER DASHBOARD ── */
function renderDashboard(){
  const {totalCompleted,totalGoal,rate}=monthlyStats();
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Stats
  document.getElementById('statCompleted').textContent=totalCompleted;
  document.getElementById('statTarget').textContent=totalGoal;
  document.getElementById('statRate').textContent=rate+'%';
  document.getElementById('statRateSub').textContent=rate>=80?'🎉 Excellent!':rate>=60?'👍 Keep going!':rate>=40?'⚡ Push harder!':'💪 Just start!';
  document.getElementById('statCompletedBar').style.width=(totalGoal>0?Math.round((totalCompleted/totalGoal)*100):0)+'%';
  document.getElementById('statRateBar').style.width=rate+'%';
  document.getElementById('statRateBar').style.background=rate>=70?'#27ae60':rate>=40?'#f39c12':'#e74c3c';

  // Best streak
  let bestStreak=0, bestHabit='—';
  habits.forEach(h=>{const s=habitStats(h);if(s.bestStreak>bestStreak){bestStreak=s.bestStreak;bestHabit=h.name;}});
  document.getElementById('statBestStreak').textContent=bestStreak+' 🔥';
  document.getElementById('statBestHabit').textContent=bestHabit;
  document.getElementById('statStreakBar').style.width=Math.min(bestStreak/getDaysInMonth(curMonth,curYear)*100,100)+'%';

  // Donut label
  document.getElementById('donutMonth').textContent=months[curMonth];
  document.getElementById('donutPct').textContent=rate+'%';

  // Charts
  buildLineChart();
  buildDonutChart(rate);
  buildWeeklyRings();
  buildMiniHabits();
}

function buildLineChart(){
  const days=getDaysInMonth(curMonth,curYear);
  const labels=Array.from({length:days},(_,i)=>i+1);
  const data=dailyTotals();
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const gridColor=isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)';
  const textColor=isDark?'#a09890':'#6b6560';

  if(lineChart) lineChart.destroy();
  const ctx=document.getElementById('lineChart').getContext('2d');
  const gradient=ctx.createLinearGradient(0,0,0,200);
  gradient.addColorStop(0,'rgba(232,98,42,0.25)');
  gradient.addColorStop(1,'rgba(232,98,42,0)');

  lineChart=new Chart(ctx,{
    type:'line',
    data:{
      labels,
      datasets:[{
        label:'Habits Done',
        data,
        borderColor:'#e8622a',
        backgroundColor:gradient,
        fill:true,
        tension:0.4,
        pointRadius:3,
        pointHoverRadius:6,
        pointBackgroundColor:'#e8622a',
        borderWidth:2,
      }]
    },
    options:{
      responsive:true,
      plugins:{legend:{display:false},tooltip:{
        backgroundColor:isDark?'#2a2620':'#fff',
        titleColor:isDark?'#f0ede8':'#1a1816',
        bodyColor:isDark?'#a09890':'#6b6560',
        borderColor:isDark?'#3a3530':'#e2ddd6',
        borderWidth:1,
        titleFont:{family:'Poppins',size:12,weight:'600'},
        bodyFont:{family:'Poppins',size:11},
      }},
      scales:{
        x:{grid:{color:gridColor},ticks:{color:textColor,font:{family:'Poppins',size:10}}},
        y:{grid:{color:gridColor},ticks:{color:textColor,font:{family:'Poppins',size:10}},min:0,max:habits.length}
      }
    }
  });
}

function buildDonutChart(rate){
  if(donutChart) donutChart.destroy();
  const ctx=document.getElementById('donutChart').getContext('2d');
  const color=rate>=70?'#27ae60':rate>=40?'#f39c12':'#e74c3c';
  donutChart=new Chart(ctx,{
    type:'doughnut',
    data:{
      labels:['Completed','Remaining'],
      datasets:[{data:[rate,100-rate],backgroundColor:[color,'rgba(200,200,200,0.2)'],borderWidth:0,hoverOffset:4}]
    },
    options:{
      responsive:true,cutout:'72%',
      plugins:{legend:{display:false},tooltip:{
        backgroundColor:'#fff',titleColor:'#1a1816',bodyColor:'#6b6560',
        borderColor:'#e2ddd6',borderWidth:1,
        titleFont:{family:'Poppins',size:12},
        bodyFont:{family:'Poppins',size:11},
      }}
    }
  });
}

function buildWeeklyRings(){
  const wStats=weeklyStats();
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const grid=document.getElementById('weeklyGrid');
  grid.innerHTML=wStats.map((w,i)=>{
    const color=w.pct>=70?'#27ae60':w.pct>=40?'#f39c12':'#e74c3c';
    const r=26, C=2*Math.PI*r, offset=C*(1-w.pct/100);
    const dStr=`${months[curMonth]} ${w.days[0]}–${w.days[w.days.length-1]}`;
    return `<div class="week-card">
      <div class="week-label">Week ${i+1}</div>
      <div class="week-ring">
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle class="week-ring-bg" cx="32" cy="32" r="${r}"/>
          <circle class="week-ring-fill" cx="32" cy="32" r="${r}"
            stroke="${color}"
            stroke-dasharray="${C}"
            stroke-dashoffset="${offset}"/>
        </svg>
        <div class="week-ring-text">${w.pct}%</div>
      </div>
      <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:4px">${w.achieved}/${w.total}</div>
      <div class="week-dates">${dStr}</div>
    </div>`;
  }).join('');
}

function buildMiniHabits(){
  const grid=document.getElementById('miniHabitsGrid');
  const sorted=[...habits].sort((a,b)=>habitStats(b).pct-habitStats(a).pct).slice(0,9);
  grid.innerHTML=sorted.map(h=>{
    const s=habitStats(h);
    const color=s.pct>=70?'#27ae60':s.pct>=40?'#f39c12':'#e74c3c';
    const catM=categoryMeta[h.cat]||categoryMeta.health;
    return `<div class="mini-habit">
      <div class="mini-habit-icon" style="background:${catM.color}20">${h.emoji}</div>
      <div class="mini-habit-info">
        <div class="mini-habit-name">${h.name}</div>
        <div class="mini-habit-pct">${s.completed}/${s.goal} days · ${s.pct}%</div>
        <div class="mini-habit-bar"><div class="mini-habit-fill" style="width:${Math.min(s.pct,100)}%;background:${color}"></div></div>
      </div>
      <span class="streak-badge">🔥 ${s.currentStreak}</span>
    </div>`;
  }).join('');
}

/* ── RENDER ANALYTICS ── */
function renderAnalytics(){
  buildBarChart();
  buildHbarChart();
  buildCatGrid();
  buildMatrix();
}

function buildBarChart(){
  const wStats=weeklyStats();
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const textColor=isDark?'#a09890':'#6b6560';
  const gridColor=isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)';

  if(barChart) barChart.destroy();
  const ctx=document.getElementById('barChart').getContext('2d');
  barChart=new Chart(ctx,{
    type:'bar',
    data:{
      labels:wStats.map((_,i)=>`Week ${i+1}`),
      datasets:[
        {label:'Goal',data:wStats.map(w=>w.total),backgroundColor:'rgba(52,152,219,0.3)',borderColor:'#3498db',borderWidth:1.5,borderRadius:4},
        {label:'Achieved',data:wStats.map(w=>w.achieved),backgroundColor:'rgba(39,174,96,0.7)',borderColor:'#27ae60',borderWidth:1.5,borderRadius:4},
      ]
    },
    options:{
      responsive:true,
      plugins:{legend:{labels:{font:{family:'Poppins',size:11},color:textColor}},
        tooltip:{titleFont:{family:'Poppins'},bodyFont:{family:'Poppins'}}},
      scales:{
        x:{grid:{display:false},ticks:{color:textColor,font:{family:'Poppins',size:11}}},
        y:{grid:{color:gridColor},ticks:{color:textColor,font:{family:'Poppins',size:11}}}
      }
    }
  });
}

function buildHbarChart(){
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const textColor=isDark?'#a09890':'#6b6560';
  const sorted=[...habits].sort((a,b)=>habitStats(b).pct-habitStats(a).pct).slice(0,10);

  if(hbarChart) hbarChart.destroy();
  const ctx=document.getElementById('hbarChart').getContext('2d');
  hbarChart=new Chart(ctx,{
    type:'bar',
    data:{
      labels:sorted.map(h=>`${h.emoji} ${h.name}`),
      datasets:[{
        label:'Completion %',
        data:sorted.map(h=>habitStats(h).pct),
        backgroundColor:sorted.map(h=>{const p=habitStats(h).pct;return p>=70?'rgba(39,174,96,0.7)':p>=40?'rgba(243,156,18,0.7)':'rgba(231,76,60,0.7)'}),
        borderRadius:4,borderWidth:0
      }]
    },
    options:{
      indexAxis:'y',responsive:true,
      plugins:{legend:{display:false},tooltip:{titleFont:{family:'Poppins'},bodyFont:{family:'Poppins'}}},
      scales:{
        x:{grid:{color:isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'},ticks:{color:textColor,font:{family:'Poppins',size:10}},max:100},
        y:{grid:{display:false},ticks:{color:textColor,font:{family:'Poppins',size:10}}}
      }
    }
  });
}

function buildCatGrid(){
  const grid=document.getElementById('catGrid');
  const cats=Object.keys(categoryMeta);
  grid.innerHTML=cats.map(cat=>{
    const hs=habits.filter(h=>h.cat===cat);
    if(!hs.length) return `<div class="cat-card"><div class="cat-emoji">${categoryMeta[cat].emoji}</div><div class="cat-name">${categoryMeta[cat].label}</div><div class="cat-count">No habits</div><div class="cat-bar"><div class="cat-bar-fill" style="width:0%;background:${categoryMeta[cat].color}"></div></div></div>`;
    const avgPct=Math.round(hs.reduce((a,h)=>a+habitStats(h).pct,0)/hs.length);
    return `<div class="cat-card">
      <div class="cat-emoji">${categoryMeta[cat].emoji}</div>
      <div class="cat-name">${categoryMeta[cat].label}</div>
      <div class="cat-count">${hs.length} habit${hs.length>1?'s':''} · ${avgPct}% avg</div>
      <div class="cat-bar"><div class="cat-bar-fill" style="width:${avgPct}%;background:${categoryMeta[cat].color}"></div></div>
    </div>`;
  }).join('');
}

function buildMatrix(){
  const wStats=weeklyStats();
  const hd=document.getElementById('matrixHead');
  const hb=document.getElementById('matrixBody');
  hd.innerHTML=`<tr><th>Habit</th>${wStats.map((_,i)=>`<th>Week ${i+1}</th>`).join('')}<th>Overall</th></tr>`;
  hb.innerHTML=habits.map(h=>{
    const s=habitStats(h);
    const wRows=wStats.map((w,wi)=>{
      let done=0;
      w.days.forEach(d=>{if(h.checks[getDateStr(d)]==='done')done++;});
      const pct=w.days.length>0?Math.round((done/w.days.length)*100):0;
      const cl=pct>=70?'pct-green':pct>=40?'pct-yellow':'pct-red';
      return `<td><span class="pct-pill ${cl}">${pct}%</span></td>`;
    }).join('');
    const oCl=s.pct>=70?'pct-green':s.pct>=40?'pct-yellow':'pct-red';
    return `<tr><td><b>${h.emoji} ${h.name}</b></td>${wRows}<td><span class="pct-pill ${oCl}">${s.pct}%</span></td></tr>`;
  }).join('');
}

/* ── RENDER RANKINGS ── */
function renderRankings(){
  const ranked=[...habits].sort((a,b)=>habitStats(b).pct-habitStats(a).pct);
  const top3=ranked.slice(0,3);

  // Podium
  const podiumEl=document.getElementById('podium');
  const order=[1,0,2]; // 2nd, 1st, 3rd
  podiumEl.innerHTML=order.map(idx=>{
    if(!top3[idx]) return '';
    const h=top3[idx];
    const s=habitStats(h);
    const medals=['🥇','🥈','🥉'];
    const cls=['podium-1','podium-2','podium-3'];
    return `<div class="podium-item ${cls[idx]}">
      <div class="podium-card">
        <div class="podium-medal">${medals[idx]}</div>
        <div style="font-size:24px;margin-bottom:4px">${h.emoji}</div>
        <div class="podium-name">${h.name}</div>
        <div class="podium-pct" style="color:${s.pct>=70?'#27ae60':s.pct>=40?'#f39c12':'#e74c3c'}">${s.pct}%</div>
      </div>
      <div class="podium-base"></div>
    </div>`;
  }).join('');

  // Rank list
  const rl=document.getElementById('rankList');
  rl.innerHTML=ranked.map((h,i)=>{
    const s=habitStats(h);
    const color=s.pct>=70?'#27ae60':s.pct>=40?'#f39c12':'#e74c3c';
    const catM=categoryMeta[h.cat]||categoryMeta.health;
    return `<div class="rank-item">
      <div class="rank-num">${i+1}</div>
      <div style="font-size:20px">${h.emoji}</div>
      <div class="rank-info">
        <div class="rank-name">${h.name}</div>
        <div class="rank-meta">
          <span class="habit-cat cat-${h.cat}">${catM.label}</span>
          &nbsp;&nbsp;${s.completed}/${s.goal} days &nbsp; Best: ${s.bestStreak} 🔥
        </div>
      </div>
      <div class="rank-bar-wrap">
        <div style="font-size:12px;font-weight:700;color:${color};text-align:right;margin-bottom:4px">${s.pct}%</div>
        <div class="rank-bar"><div class="rank-bar-fill" style="width:${s.pct}%;background:${color}"></div></div>
      </div>
      <span class="streak-badge">🔥 ${s.currentStreak}</span>
    </div>`;
  }).join('');
}

/* ── INTERACTIONS ── */
function toggleCheck(hid, dateStr){
  const h=habits.find(h=>h.id===hid);
  if(!h) return;
  const cur=h.checks[dateStr]||'';
  if(cur==='') h.checks[dateStr]='done';
  else if(cur==='done') h.checks[dateStr]='missed';
  else delete h.checks[dateStr];
  save();
  buildAll();
}

function addHabit(){
  const name=document.getElementById('newHabitName').value.trim();
  if(!name){alert('Please enter a habit name');return;}
  if(habits.length>=20){alert('Maximum 20 habits allowed');return;}
  const emoji=document.getElementById('newHabitEmoji').value.trim()||'⭐';
  const cat=document.getElementById('newHabitCat').value;
  const goal=parseInt(document.getElementById('newHabitGoal').value)||30;
  habits.push({id:nextId++,name,cat,emoji,goal,checks:{}});
  document.getElementById('newHabitName').value='';
  document.getElementById('newHabitEmoji').value='';
  document.getElementById('newHabitGoal').value='30';
  toggleAddForm();
  save();
  buildAll();
}

function deleteHabit(hid){
  if(!confirm('Delete this habit?')) return;
  habits=habits.filter(h=>h.id!==hid);
  save();
  buildAll();
}

function markAllToday(){
  habits.forEach(h=>{h.checks[TODAY]='done'});
  save();buildAll();
}

function clearAll(){
  if(!confirm('Clear all data for this month?')) return;
  const prefix=`${curYear}-${String(curMonth+1).padStart(2,'0')}-`;
  habits.forEach(h=>{
    Object.keys(h.checks).forEach(k=>{if(k.startsWith(prefix)) delete h.checks[k]});
  });
  save();buildAll();
}

function toggleAddForm(){
  document.getElementById('addHabitForm').classList.toggle('open');
}

function changeMonth(){
  curMonth=parseInt(document.getElementById('monthSel').value);
  curYear=parseInt(document.getElementById('yearSel').value);
  buildAll();
}

/* ── NOTES ── */
function openNotes(dateStr){
  notesActiveDate=dateStr;
  const d=new Date(dateStr);
  document.getElementById('notesDate').textContent=d.toDateString();
  document.getElementById('notesTextarea').value=notes[dateStr]||'';
  document.getElementById('notesOverlay').classList.add('open');
}

function closeNotes(){
  document.getElementById('notesOverlay').classList.remove('open');
}

function saveNote(){
  const val=document.getElementById('notesTextarea').value.trim();
  if(val) notes[notesActiveDate]=val;
  else delete notes[notesActiveDate];
  save();
  closeNotes();
}

/* ── DARK MODE ── */
function toggleDark(){
  const html=document.documentElement;
  const isDark=html.getAttribute('data-theme')==='dark';
  html.setAttribute('data-theme',isDark?'light':'dark');
  document.getElementById('darkBtn').textContent=isDark?'🌙':'☀️';
  localStorage.setItem('hf_theme',isDark?'light':'dark');
  buildAll();
}

/* ── TABS ── */
function switchTab(name,el){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('panel-'+name).classList.add('active');
  if(name==='analytics') renderAnalytics();
  if(name==='rankings') renderRankings();
  toggleAddForm();
}

/* ── SAVE & LOGOUT ── */
function save(){
  users[currentUser].data = {
    habits,
    notes
  };
  localStorage.setItem("users", JSON.stringify(users)); // ye bhi add karo
  localStorage.setItem("currentUser", currentUser);
  localStorage.setItem("currentUserName", users[currentUser].name);
}

function logout(){
  localStorage.removeItem("currentUser");
  window.location.href = "../../index.html";
}

// Initial theme check
if(localStorage.getItem('hf_theme')==='dark'){
  document.documentElement.setAttribute('data-theme','dark');
  document.getElementById('darkBtn').textContent='☀️';
}

// Start
init();
