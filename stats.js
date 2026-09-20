/* ============================================================
   StudyOS — views/stats.js · insights & honest charts
   ============================================================ */
Views.stats = {
  title: 'Statistics', crumb: 'Insights from your studying', icon: 'chart',
  range: 30,

  render(root){
    if (!Store.state.sessions.length){
      root.innerHTML = `
      <div class="page-head">
        <div class="ph-copy"><h2>Statistics</h2><p>Insights from your studying.</p></div>
      </div>
      <div class="card" data-reveal><div class="empty" style="padding:64px 24px">
        <span class="e-ic">${ic('chart')}</span>
        <h4>No statistics yet</h4>
        <p>Charts and insights build up from your very first focus session — until then, there's honestly nothing to show.</p>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:10px;flex-wrap:wrap">
          <button class="btn btn-primary" id="stStart">${ic('play')} Start a session</button>
          <button class="btn btn-light" id="stHome">${ic('home')} Back to today</button>
        </div>
      </div></div>`;
      $('#stStart').onclick = () => quickStartModal();
      $('#stHome').onclick = () => App.nav('home');
      Reveal.init(root);
      return;
    }
    const n = this.range;
    const days = Array.from({length:n},(_,i)=>{ const k=D.addDays(D.today(),-(n-1-i));
      return { date:k, min:Store.minutesOn(k), sessions:Store.sessionsOn(k).length }; });
    const totalMin = days.reduce((a,d)=>a+d.min,0);
    const sessions = days.reduce((a,d)=>a+d.sessions,0);
    const avg = sessions ? Math.round(totalMin/sessions) : 0;
    const goal = Store.state.profile.dailyGoalMin;
    const goalHits = days.filter(d=>d.min >= goal).length;
    const st = Store.streaks();

    /* chart data: daily bars for 7, weekly bars for 30/90 */
    let barData;
    if (n === 7){ barData = days.map(d=>({ label:D.dayName(d.date), value:d.min, today:d.date===D.today() })); }
    else {
      const weeks = {};
      days.forEach(d=>{ const w = D.startOfWeek(d.date); weeks[w] = (weeks[w]||0) + d.min; });
      barData = Object.entries(weeks).map(([w,v])=>({ label:D.fmtShort(D.addDays(w,3)).split(' ')[0], value:v }));
    }

    /* subject distribution */
    const subjStats = Store.subjectStats(n).filter(s=>s.recentMin>0).sort((a,b)=>b.recentMin-a.recentMin);
    const subjTotal = subjStats.reduce((a,s)=>a+s.recentMin,0);

    /* trend (area): daily for 7/30, weekly for 90 */
    let trend;
    if (n <= 30){ trend = days.map(d=>({ label:D.fmtShort(d.date).split(' ')[1], value:d.min })); }
    else {
      const weeks = {};
      days.forEach(d=>{ const w = D.startOfWeek(d.date); weeks[w] = (weeks[w]||0) + d.min; });
      trend = Object.entries(weeks).map(([w,v])=>({ label:D.fmtShort(D.addDays(w,3)), value:v }));
    }

    /* exam prep list */
    const exams = Store.upcomingExams();

    root.innerHTML = `
    <div class="page-head">
      <div class="ph-copy"><h2>Statistics</h2><p>Honest numbers from ${sessions} real sessions — nothing decorative.</p></div>
      <div class="ph-actions">
        <div class="seg">${[[7,'7 days'],[30,'30 days'],[90,'90 days']].map(([v,l])=>`<button class="${n===v?'on':''}" data-range="${v}">${l}</button>`).join('')}</div>
      </div>
    </div>

    <div class="stats-top">
      <div class="card pad stat" data-reveal><span class="s-label">${ic('clock')}Study time</span>
        <span class="s-num" data-count="${totalMin}" data-fmt="min">0</span><span class="s-sub">last ${n} days</span></div>
      <div class="card pad stat" data-reveal style="--d:.06s"><span class="s-label">${ic('timer')}Sessions</span>
        <span class="s-num" data-count="${sessions}">0</span><span class="s-sub">avg ${avg} min each</span></div>
      <div class="card pad stat" data-reveal style="--d:.12s"><span class="s-label">${ic('target')}Goal hit</span>
        <span class="s-num" data-count="${Math.round(goalHits/n*100)}" data-fmt="pct">0</span>
        <span class="s-sub">${goalHits} of ${n} days</span></div>
      <div class="card pad stat" data-reveal style="--d:.18s"><span class="s-label">${ic('flame')}Streak</span>
        <span class="s-num">${st.current}<span class="unit">days</span></span>
        <span class="s-sub">longest: ${st.longest} days</span></div>
    </div>

    <div class="stats-charts">
      <div class="chart-card" data-reveal><h3>${n===7?'This week':'Study time'}</h3>
        <span class="cc-sub">${n===7?'Daily minutes':'Weekly minutes'} — dashed line is your daily goal</span>
        ${Charts.bars({ data:barData, goal:n===7?goal:null, height:200 })}
        <div class="cc-foot"><span>${barData.length} ${n===7?'days':'weeks'}</span><span>goal ${goal} min/day</span></div>
      </div>
      <div class="chart-card" data-reveal><h3>Subject balance</h3><span class="cc-sub">Where your time actually went</span>
        ${Charts.donut({ segments: subjStats.slice(0,6).map(s=>({ label:s.subject.name, value:s.recentMin, color:s.subject.color })), size:170, thickness:20, center:fmtMin(subjTotal), centerSub:'total' })}
        <div class="donut-legend">${subjStats.map(s=>`<div class="dl-row"><span class="sdot" style="color:${s.subject.color};background:${s.subject.color}"></span><span class="n">${esc(s.subject.name)}</span><span class="t">${fmtMin(s.recentMin)} · ${Math.round(s.recentMin/subjTotal*100)}%</span></div>`).join('')}</div>
      </div>
    </div>

    <div class="stats-row2">
      <div class="chart-card" data-reveal><h3>Consistency</h3><span class="cc-sub">Every square is a day — deeper green means more focus</span>
        ${Charts.heatmap({ days, goal })}
      </div>
      <div class="chart-card" data-reveal><h3>Trend</h3><span class="cc-sub">Daily study minutes over the period</span>
        ${Charts.area({ points:trend, height:180 })}
      </div>
    </div>

    <div class="stats-row2" style="margin-bottom:22px">
      <div class="chart-card" data-reveal><h3>Goal completion</h3><span class="cc-sub">Days you reached your daily goal (last 30)</span>
        <div class="goal-dots">${days.slice(-30).map(d=>`<i class="${d.min>=goal?'hit':''}" title="${D.fmtMedium(d.date)} — ${d.min>=goal?'goal reached':fmtMin(d.min)}"></i>`).join('')}</div>
        <div class="cc-foot"><span>${goalHits}/${n} days on target</span><span>${Math.round(goalHits/n*100)}% completion rate</span></div>
      </div>
      <div class="chart-card" data-reveal><h3>Exam preparation</h3><span class="cc-sub">Live readiness for upcoming exams</span>
        ${exams.length ? exams.map(e=>{ const p = Store.examPrep(e);
          return `<div data-exam="${e.id}" role="button" tabindex="0" style="margin-bottom:14px;cursor:pointer">
            <div class="pbar-label"><span>${esc(Store.subject(e.subjectId)?.name)} · ${esc(e.name)} — ${D.relTime(e.date)}</span><b>${p.pct}%</b></div>
            <div class="pbar"><i style="width:${p.pct}%"></i></div></div>`; }).join('')
        : `<p class="small muted-2" style="padding:4px 2px">No upcoming exams — enjoy the calm.</p>`}
      </div>
    </div>

    <h3 style="font-size:19px;margin-bottom:14px" data-reveal>Insights</h3>
    <div class="insights-grid">
      ${Store.insights().map((ins,i)=>`<div class="insight" data-reveal style="--d:${i*0.06}s"><span class="i-ic">${ic(ins.icon)}</span><p>${ins.text}</p></div>`).join('')}
    </div>`;

    $$('[data-range]', root).forEach(b => b.onclick = () => { this.range = +b.dataset.range; this.render(root); });
    $$('[data-count]', root).forEach(el => {
      const to = +el.dataset.count;
      countUp(el, to, { fmt: el.dataset.fmt === 'min' ? fmtMin : v => Math.round(v) + (el.dataset.fmt==='pct'?'%':'') });
    });
    $$('[data-exam]', root).forEach(x => x.onclick = () => App.nav('exams/' + x.dataset.exam));
    Charts.barsIn(root); Charts.donutIn(root); Charts.areaIn(root);
    Reveal.init(root);
  }
};
