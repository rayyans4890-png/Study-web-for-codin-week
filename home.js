/* ============================================================
   StudyOS — views/home.js · the student's command center
   ============================================================ */
Views.home = {
  title: 'Today', crumb: 'Your day at a glance', icon: 'home',
  _off: null,

  render(root){
    this._off && this._off();
    const p = Store.state.profile, st = Store.streaks(), lvl = Store.level();
    const todayMin = Store.todayMinutes(), sessionsToday = Store.sessionsOn(D.today());
    const nextExam = Store.nextExam();
    const upTasks = Store.state.tasks.filter(t=>!t.done).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,4);
    const recent = [...Store.state.sessions].sort((a,b)=>b.startedAt.localeCompare(a.startedAt)).slice(0,4);
    const weekStart = D.startOfWeek(D.today());
    const week = Array.from({length:7},(_,i)=>{ const k=D.addDays(weekStart,i); return { label:D.dayName(k), value:Store.minutesOn(k), today:k===D.today() }; });

    root.innerHTML = `
    <div class="home-hello">
      <div data-reveal>
        <h2>${p.name ? `${D.greeting()}, <span class="serif-i">${esc(p.name)}</span>.` : `${D.greeting()}. <span class="serif-i">A clean start.</span>`}</h2>
        <div class="hh-date">${ic('calendar')}${D.fmtLong(D.today())}</div>
      </div>
      <div class="thought" data-reveal style="--d:.1s">
        <div class="th-cap">Today's thought</div>
        <p>${esc(Store.dailyThought())}</p>
      </div>
    </div>

    ${!Store.state.sessions.length ? (() => {
      const stepsDone = (Store.state.subjects.length?1:0) + (p.name?1:0);
      return `
    <section class="card onboarding" data-reveal="zoom" style="margin-bottom:22px">
      <div class="ob-head">
        <div><span class="overline">Set up your workspace</span><h3 style="margin:5px 0 0">Three steps and you're studying</h3></div>
        <span class="badge badge-green" style="flex:none">${stepsDone} / 3 done</span>
      </div>
      <div class="ob-steps">
        <div class="ob-step ${Store.state.subjects.length?'done':''}">
          <span class="ob-n">${Store.state.subjects.length ? ic('check') : '1'}</span>
          <div class="grow"><b>Add your subjects</b><span>Whatever you're taking — each gets its own timeline and goals.</span></div>
          <button class="btn btn-light btn-sm" id="obSubj">${Store.state.subjects.length?'Manage':'Add'}</button>
        </div>
        <div class="ob-step ${p.name?'done':''}">
          <span class="ob-n">${p.name ? ic('check') : '2'}</span>
          <div class="grow"><b>Make it yours</b><span>Your name, daily goal and preferred session length.</span></div>
          <button class="btn btn-light btn-sm" id="obProfile">${p.name?'Edit':'Set up'}</button>
        </div>
        <div class="ob-step">
          <span class="ob-n">3</span>
          <div class="grow"><b>Run your first session</b><span>Pick a subject, press start — streaks, stats and XP begin with you.</span></div>
          <button class="btn btn-primary btn-sm" id="obStart" ${Store.state.subjects.length?'':'disabled'}>Start</button>
        </div>
      </div>
    </section>`; })() : ''}

    <section class="goal-panel" data-reveal="zoom" style="margin-bottom:22px">
      <div class="gp-ring">
        ${Charts.ring({ size:132, stroke:11, pct:Store.goalPct(), num:fmtMin(todayMin), sub:'of '+fmtMin(p.dailyGoalMin), colors:['#7FA98C','#D8E6DC'] })}
      </div>
      <div class="gp-mid">
        <h3>${todayMin >= p.dailyGoalMin ? 'Daily goal — complete. Beautifully done.' : 'Today’s study goal'}</h3>
        <p class="gp-sub">${todayMin >= p.dailyGoalMin
          ? 'You’ve crossed the line you set for yourself. Anything more now is a bonus.'
          : `${fmtMin(p.dailyGoalMin - todayMin)} left to reach your daily goal — one focused session closes most of the gap.`}</p>
        <div class="gp-stats">
          <div class="gp-stat"><span class="n">${st.current}</span><span class="l">day streak</span></div>
          <div class="gp-stat"><span class="n">${sessionsToday.length}</span><span class="l">sessions today</span></div>
          <div class="gp-stat"><span class="n">${lvl.level}</span><span class="l">${lvl.title}</span></div>
        </div>
      </div>
      <div class="gp-actions">
        <button class="btn btn-primary btn-lg" id="hsStart">${ic('play')} Start studying</button>
        <button class="btn btn-light" id="hsResume">${ic('timer')} ${p.preferredSession}-min quick session</button>
      </div>
    </section>

    <div class="quick-actions" data-reveal style="margin-bottom:22px">
      <button class="qa" id="qaFocus"><span class="qa-ic">${ic('timer')}</span><b>Start focus</b><span>Choose subject & length</span></button>
      <button class="qa" id="qaTask"><span class="qa-ic">${ic('check-square')}</span><b>Add a task</b><span>Quick capture</span></button>
      <button class="qa" id="qaPlan"><span class="qa-ic">${ic('calendar-plus')}</span><b>Plan a block</b><span>On the calendar</span></button>
      <button class="qa gold" id="qaTutor"><span class="qa-ic">${ic('sparkles')}</span><b>Ask the tutor</b><span>It knows your context</span></button>
    </div>

    <div class="home-grid">
      <div class="home-main">
        <div class="card home-panel" data-reveal>
          <div class="hp-head"><h3>${ic('chart')} This week's rhythm</h3>
            <span class="tiny muted-2">${fmtMin(Store.weekMinutes(0))} total</span></div>
          ${Charts.bars({ data:week, goal:p.dailyGoalMin, height:150 })}
        </div>

        <div class="card home-panel" data-reveal>
          <div class="hp-head"><h3>${ic('check-square')} Up next</h3>
            <a class="link-u small" href="#/tasks">All tasks</a></div>
          ${upTasks.length ? upTasks.map(t=>{
            const s = Store.subject(t.subjectId);
            const overdue = t.due < D.today(), isToday = t.due === D.today();
            return `<div class="task-mini" data-task="${t.id}">
              <button class="cb t-complete" data-id="${t.id}" aria-label="Complete task">${ic('check')}</button>
              <span class="tm-t">${esc(t.title)}</span>
              ${s?`<span class="subj-chip" style="flex:none"><span class="sdot" style="color:${s.color};background:${s.color}"></span>${esc(s.name)}</span>`:''}
              <span class="tm-due ${overdue?'today':''} ${isToday?'today':''}" style="${overdue?'color:var(--terra)':''}">${overdue?'Overdue':D.relTime(t.due)}</span>
            </div>`; }).join('')
          : `<div class="empty" style="padding:26px"><span class="e-ic">${ic(Store.state.tasks.length?'check-circle':'check-square')}</span>
             <h4>${Store.state.tasks.length?'Inbox zero':'No tasks yet'}</h4>
             <p>${Store.state.tasks.length?'No open tasks. Enjoy the quiet — or plan the next move.':'Capture what you need to do — assignments, problem sets, reading.'}</p></div>`}
        </div>

        <div class="card home-panel" data-reveal>
          <div class="hp-head"><h3>${ic('clock')} Recent sessions</h3>
            <a class="link-u small" href="#/stats">Statistics</a></div>
          ${recent.length ? recent.map(x=>{ const s = Store.subject(x.subjectId);
            return `<div class="sess-mini">
              <span class="sm-dot" style="background:${s?.color||'#999'}"></span>
              <div class="grow" style="min-width:0"><div class="sm-t">${esc(s?.name||'Session')}</div>
              <div class="sm-s">${D.fmtMedium(x.date)} · ${esc(x.startedAt.slice(11,16))}${x.goal?' · '+esc(x.goal.slice(0,42)):''}</div></div>
              <span class="sm-dur">${fmtMin(x.durationMin)}</span>
            </div>`; }).join('')
          : `<div class="empty" style="padding:26px"><span class="e-ic">${ic('timer')}</span>
             <h4>No sessions yet</h4><p>Your first focus session will appear here — subject, length and all.</p></div>`}
        </div>
      </div>

      <div class="home-side">
        ${nextExam ? `
        <div class="exam-cta" data-reveal="right" id="homeExam" data-id="${nextExam.id}">
          <div class="ec-num">${D.diffDays(nextExam.date, D.today())}<small>days left</small></div>
          <div class="grow" style="min-width:0">
            <div class="title-md" style="margin-bottom:3px">${esc(Store.subject(nextExam.subjectId)?.name)} · ${esc(nextExam.name)}</div>
            <div class="tiny muted-2" style="margin-bottom:9px">${D.fmtLong(nextExam.date)} · ${esc(nextExam.time)} · ${esc(nextExam.location)}</div>
            <div class="pbar-label"><span>Preparation</span><b>${Store.examPrep(nextExam).pct}%</b></div>
            <div class="pbar thin"><i style="width:${Store.examPrep(nextExam).pct}%"></i></div>
          </div>
        </div>` : `
        <div class="card home-panel dashed-cta" data-reveal="right" id="homeAddExam" role="button" tabindex="0">
          <span class="e-ic">${ic('calendar-plus')}</span>
          <h4>${Store.state.exams.length ? 'No upcoming exams' : 'Add your first exam'}</h4>
          <p>Exams get countdowns, prep progress and topic checklists.</p>
          <span class="btn btn-light btn-sm" style="margin-top:6px">${ic('plus')} Add exam</span>
        </div>`}

        <div class="card home-panel" data-reveal="right">
          <div class="hp-head"><h3>${ic('book')} Subjects this week</h3>
            <a class="link-u small" href="#/subjects">All</a></div>
          <div class="subj-progress">
            ${Store.subjectStats().length ? Store.subjectStats().slice(0,6).map(({subject:s,weekMin})=>`
              <div class="sp-row">
                <div class="sp-top"><b>${esc(s.name)}</b><span>${fmtMin(weekMin)} / ${fmtMin(s.goal)}</span></div>
                <div class="pbar thin"><i style="width:${clamp(weekMin/s.goal*100,0,100)}%"></i></div>
              </div>`).join('')
            : `<div class="empty" style="padding:22px 8px"><span class="e-ic">${ic('sprout')}</span>
               <h4 style="font-size:14px">No subjects yet</h4><p style="font-size:12.5px">Add subjects and their weekly goals will live here.</p></div>`}
          </div>
        </div>

        <div class="card home-panel" data-reveal="right">
          <div class="hp-head"><h3>${ic('swords')} Today's challenges</h3>
            <a class="link-u small" href="#/battle">Battle</a></div>
          ${Store.dailyChallenges().map(c=>`
            <div class="lrow" style="padding:9px 8px">
              <span style="color:${c.complete?'var(--g-500)':'var(--ink-4)'}">${ic(c.complete?'check-circle':c.icon)}</span>
              <div class="grow" style="min-width:0"><div class="small" style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</div></div>
              <span class="tiny num-chip muted-2">${c.value}/${c.goal}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;

    /* wiring */
    $('#hsStart').onclick = () => quickStartModal();
    const lastSubj = [...Store.state.sessions].sort((a,b)=>b.startedAt.localeCompare(a.startedAt))[0]?.subjectId || Store.state.subjects[0]?.id;
    $('#hsResume').onclick = () => lastSubj
      ? FocusEngine.start({ subjectId: lastSubj, minutes: p.preferredSession, mode:'classic', goal:'' })
      : quickStartModal();
    $('#obSubj')?.addEventListener('click', () => SubjectUI.open(null, { onSaved: () => this.render(root) }));
    $('#obProfile')?.addEventListener('click', () => App.nav('settings'));
    $('#obStart')?.addEventListener('click', () => quickStartModal());
    $('#homeAddExam')?.addEventListener('click', () => ExamsUI.open());
    $('#qaFocus').onclick = () => quickStartModal();
    $('#qaTask').onclick = () => TasksUI.open();
    $('#qaPlan').onclick = () => PlannerUI.open();
    $('#qaTutor').onclick = () => App.nav('tutor');
    $('#homeExam')?.addEventListener('click', function(){ App.nav('exams/'+this.dataset.id); });
    $$('.t-complete', root).forEach(b => b.onclick = e => {
      e.stopPropagation();
      const t = Store.task(b.dataset.id);
      b.classList.add('on','ripple');
      setTimeout(()=>Store.completeTask(b.dataset.id, true), 240);
      Toast.show({ title:'Task complete', desc:t?.title, tone:'success', duration:2600 });
    });
    Charts.ringTick(root); Charts.barsIn(root);

    this._off = Bus.on('store:change', () => {
      if (!Modal.stack.length && App.currentRoute === 'home') this.render(root);
    });
  },
  destroy(){ this._off && this._off(); this._off = null; }
};
