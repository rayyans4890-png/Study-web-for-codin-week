/* ============================================================
   StudyOS — views/subjects.js · subject cards + detail view
   ============================================================ */
Views.subjects = {
  title: 'Subjects', crumb: 'Your lines of progress', icon: 'book',
  _off: null,

  render(root, params){
    this._off && this._off();
    if (params){ this.detail(root, params); }
    else this.list(root);
    this._off = Bus.on('store:change', () => {
      if (Modal.stack.length || App.currentRoute !== 'subjects') return;
      params ? this.detail(root, params, true) : this.list(root);
    });
  },

  list(root){
    const stats = Store.subjectStats();
    root.innerHTML = `
    <div class="page-head">
      <div class="ph-copy"><h2>Subjects</h2><p>Every subject is a slow, steady accumulation. Watch it grow.</p></div>
      <div class="ph-actions"><button class="btn btn-primary" id="sNew">${ic('plus')} Add subject</button></div>
    </div>
    ${stats.length ? `<div class="subjects-grid">
      ${stats.map(({subject:s, totalMin, weekMin, recentMin, sessions})=>{
        const days = Array.from({length:14},(_,i)=>{ const k=D.addDays(D.today(),-13+i);
          return Store.sessionsOn(k).filter(x=>x.subjectId===s.id).reduce((a,x)=>a+x.durationMin,0); });
        const exam = Store.upcomingExams().find(e=>e.subjectId===s.id);
        const openTasks = Store.state.tasks.filter(t=>t.subjectId===s.id && !t.done).length;
        return `<div class="subj-card" data-reveal data-subj="${s.id}" style="--c:${s.color}" tabindex="0" role="button">
          <div class="sc-wash"></div>
          <div class="sc-head"><span class="sc-ic">${ic(s.icon)}</span>
            <div class="grow"><div class="title-md">${esc(s.name)}</div>
            <span class="tiny muted-2">${sessions} sessions · ${fmtMin(totalMin)} total</span></div>
            ${exam?`<span class="badge badge-amber">${D.diffDays(exam.date, D.today())}d</span>`:''}
          </div>
          <div class="sc-stats">
            <div class="stat"><span class="s-label">This week</span><span class="s-num">${fmtMin(weekMin)}</span></div>
            <div class="stat"><span class="s-label">30 days</span><span class="s-num">${fmtMin(recentMin)}</span></div>
            <div class="stat"><span class="s-label">Open tasks</span><span class="s-num">${openTasks}</span></div>
            <div class="stat"><span class="s-label">Weekly goal</span><span class="s-num">${Math.round(weekMin/s.goal*100)}<span class="unit">%</span></span></div>
          </div>
          ${Charts.sparkline({ values:days, color:s.color, height:36 })}
          <div class="sc-foot">
            <div class="pbar thin grow"><i style="width:${clamp(weekMin/s.goal*100,0,100)}%"></i></div>
            <span class="tiny muted-2 num-chip">${fmtMin(weekMin)} / ${fmtMin(s.goal)}</span>
          </div>
        </div>`;
      }).join('')}
    </div>`
    : `<div class="card" data-reveal><div class="empty" style="padding:56px 24px">
        <span class="e-ic">${ic('sprout')}</span>
        <h4>No subjects yet</h4>
        <p>Add the subjects you're taking — focus sessions, tasks and exams all connect to them.</p>
        <button class="btn btn-primary" id="sNew2" style="margin-top:8px">${ic('plus')} Add your first subject</button>
      </div></div>`}`;
    $('#sNew').onclick = () => SubjectUI.open();
    $('#sNew2')?.addEventListener('click', () => SubjectUI.open());
    $$('[data-subj]', root).forEach(c => c.onclick = () => App.nav('subjects/' + c.dataset.subj));
    Reveal.init(root);
  },

  detail(root, id, quiet){
    const s = Store.subject(id);
    if (!s) return this.list(root);
    const all = Store.state.sessions.filter(x=>x.subjectId===s.id);
    const totalMin = all.reduce((a,x)=>a+x.durationMin,0);
    const weekMin = Store.weekSubjectMin(s.id);
    const days30 = Array.from({length:30},(_,i)=>{ const k=D.addDays(D.today(),-29+i);
      return { date:k, value:Store.minutesOn(k) === 0 ? 0 : Store.sessionsOn(k).filter(x=>x.subjectId===s.id).reduce((a,x)=>a+x.durationMin,0) }; });
    const tasks = Store.state.tasks.filter(t=>t.subjectId===s.id);
    const exams = Store.state.exams.filter(e=>e.subjectId===s.id).sort((a,b)=>a.date.localeCompare(b.date));
    const recent = [...all].sort((a,b)=>b.startedAt.localeCompare(a.startedAt)).slice(0,6);

    root.innerHTML = `
    <div class="page-head">
      <div class="ph-copy"><div class="row gap8" style="margin-bottom:6px"><a class="link-u small" href="#/subjects">${ic('arrow-left')} All subjects</a></div>
      <h2>${esc(s.name)}</h2><p>${all.length} sessions · tracking since ${D.fmtShort(all[0]?.date || D.today())}</p></div>
      <div class="ph-actions">
        <button class="btn btn-secondary" id="sdEdit">${ic('edit')} Edit</button>
        <button class="btn btn-primary" id="sdStudy">${ic('play')} Study now</button>
      </div>
    </div>

    <div class="subj-detail-hero" data-reveal="zoom" style="--c:${s.color}">
      <span class="sdh-wash"></span>
      <span class="sdh-ic">${ic(s.icon)}</span>
      <div class="grow">
        <h2>${esc(s.name)}</h2>
        <span class="small muted-2">Weekly goal ${fmtMin(s.goal)} — currently ${weekMin >= s.goal ? 'achieved' : fmtMin(s.goal - weekMin) + ' to go'}</span>
      </div>
      ${Charts.ring({ size:104, stroke:9, pct: clamp(Math.round(weekMin/s.goal*100),0,100), num:Math.round(weekMin/s.goal*100)+'%', sub:'this week', colors:[s.color,'#7FA98C'] })}
    </div>

    <div class="subj-mini-stats">
      <div class="card pad stat" data-reveal><span class="s-label">${ic('clock')}Total time</span><span class="s-num">${fmtMin(totalMin)}</span></div>
      <div class="card pad stat" data-reveal style="--d:.06s"><span class="s-label">${ic('calendar')}This week</span><span class="s-num">${fmtMin(weekMin)}</span></div>
      <div class="card pad stat" data-reveal style="--d:.12s"><span class="s-label">${ic('timer')}Sessions</span><span class="s-num">${all.length}</span></div>
      <div class="card pad stat" data-reveal style="--d:.18s"><span class="s-label">${ic('check-square')}Tasks</span><span class="s-num">${tasks.filter(t=>t.done).length}<span class="unit">/ ${tasks.length}</span></span></div>
    </div>

    <div class="stats-row2">
      <div class="chart-card" data-reveal><h3>Last 30 days</h3><span class="cc-sub">Daily minutes on ${esc(s.name)}</span>
        ${Charts.bars({ data: days30.map(d=>({label:D.fmtShort(d.date).split(' ')[1], value:d.value, today:d.date===D.today()})), goal:Math.round(s.goal/7), height:170 })}</div>
      <div class="chart-card" data-reveal><h3>Recent sessions</h3><span class="cc-sub">Your latest work on this subject</span>
        ${recent.length ? recent.map(x=>`<div class="sess-mini"><span class="sm-dot" style="background:${s.color}"></span>
          <div class="grow"><div class="sm-t">${D.fmtMedium(x.date)} · ${esc(x.startedAt.slice(11,16))}</div>
          <div class="sm-s">${x.goal?esc(x.goal.slice(0,48)):'Focus session'}</div></div>
          <span class="sm-dur">${fmtMin(x.durationMin)}</span></div>`).join('')
        : `<div class="empty" style="padding:24px"><span class="e-ic">${ic('timer')}</span><h4>No sessions yet</h4><p>Start one — even 25 minutes shows up here.</p></div>`}
      </div>
    </div>

    <div class="stats-row2">
      <div class="chart-card" data-reveal><h3>Tasks</h3><span class="cc-sub">${tasks.filter(t=>!t.done).length} open</span>
        ${tasks.length ? tasks.slice(0,6).map(t=>`<div class="lrow" style="padding:9px 6px">
          <button class="cb t-complete ${t.done?'on':''}" data-task="${t.id}" aria-label="Complete">${ic('check')}</button>
          <span class="small" style="font-weight:550;${t.done?'text-decoration:line-through;color:var(--ink-3)':''}">${esc(t.title)}</span>
          <span class="tm-due" style="margin-left:auto">${D.relTime(t.due)}</span></div>`).join('')
        : `<p class="small muted-2" style="padding:4px 2px">No tasks for this subject yet.</p>`}
      </div>
      <div class="chart-card" data-reveal><h3>Exams</h3><span class="cc-sub">Past and upcoming</span>
        ${exams.length ? exams.map(e=>`<div class="lrow" style="padding:9px 6px;cursor:pointer" data-exam="${e.id}">
          <span style="color:var(--terra)">${ic('file-text')}</span>
          <div class="grow"><div class="small" style="font-weight:600">${esc(e.name)}</div>
          <div class="tiny muted-2">${D.fmtMedium(e.date)} · ${Store.examPrep(e).pct}% prepared</div></div>
          <span class="tiny num-chip" style="color:var(--terra)">${D.diffDays(e.date, D.today()) >= 0 ? D.diffDays(e.date, D.today())+'d' : 'done'}</span></div>`).join('')
        : `<p class="small muted-2" style="padding:4px 2px">No exams for this subject.</p>`}
      </div>
    </div>`;

    $('#sdEdit').onclick = () => SubjectUI.open({ id: s.id });
    $('#sdStudy').onclick = () => quickStartModal({ subjectId: s.id });
    $$('.t-complete', root).forEach(b => b.onclick = ev => { ev.stopPropagation(); Store.completeTask(b.dataset.task, true); Toast.show({title:'Task complete', tone:'success', duration:2200}); });
    $$('[data-exam]', root).forEach(r => r.onclick = () => App.nav('exams/' + r.dataset.exam));
    Charts.ringTick(root); Charts.barsIn(root);
    if (!quiet) Reveal.init(root);
  },

  destroy(){ this._off && this._off(); this._off = null; }
};

/* ---------------- subject editor (global) ---------------- */
const SubjectUI = {
  PALETTE: ['#2D6A4F','#3D6E77','#46647E','#77784B','#5D8A54','#A06B3F','#7C5A7E','#8A5A44'],
  open(prefill = {}, opts = {}){
    prefill = prefill || {};
    const subj = prefill.id ? Store.subject(prefill.id) : null;
    const v = subj || { name:'', icon:'book', color:this.PALETTE[0], goal:180 };
    const iconChoices = ['book','sigma','atom','flask','dna','code','book-open','pen','leaf','layers','message','notebook'];
    Modal.open({
      title: subj ? 'Edit subject' : 'New subject',
      body: `
        <div class="field"><label>Name</label><input class="input" id="sjName" value="${esc(v.name)}" placeholder="e.g. Mathematics" maxlength="32"></div>
        <div class="field"><label>Icon</label>
          <div class="fs-subjects" id="sjIcons">${iconChoices.map(i=>`<button class="chip ${i===v.icon?'on':''}" data-icon="${i}" style="width:42px;justify-content:center">${ic(i)}</button>`).join('')}</div></div>
        <div class="field"><label>Color</label>
          <div class="avatar-pick" id="sjColors">${this.PALETTE.map(c=>`<span class="color-dot ${c===v.color?'on':''}" data-c="${c}" style="background:${c}"></span>`).join('')}</div></div>
        <div class="field"><label>Weekly goal (minutes)</label>
          <input class="input" type="number" id="sjGoal" min="30" max="3000" step="15" value="${v.goal}"></div>`,
      footer: `${subj ? `<button class="btn btn-danger" id="sjDel" style="margin-right:auto">${ic('trash')} Delete</button>` : ''}
        <button class="btn btn-secondary" data-close>Cancel</button>
        <button class="btn btn-primary" id="sjSave">${subj?'Save changes':'Add subject'}</button>`,
      onMount(el, api){
        let icon = v.icon, color = v.color;
        el.querySelector('[data-close]').onclick = () => api.close();
        $$('#sjIcons .chip', el).forEach(b => b.onclick = () => { icon = b.dataset.icon; $$('#sjIcons .chip', el).forEach(x=>x.classList.toggle('on', x===b)); });
        $$('#sjColors .color-dot', el).forEach(b => b.onclick = () => { color = b.dataset.c; $$('#sjColors .color-dot', el).forEach(x=>x.classList.toggle('on', x===b)); });
        if (subj) $('#sjDel', el).onclick = () => {
          Modal.open({ title:'Delete subject?', body:`<p class="muted small">Sessions keep their history but lose the subject label. Tasks and exams for this subject will be removed.</p>`,
            footer:`<button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-danger" id="sjDelOk">Delete</button>`,
            onMount(m2, api2){ m2.querySelector('[data-close]').onclick=()=>api2.close();
              m2.querySelector('#sjDelOk').onclick=()=>{ api2.close(); api.close(); Store.deleteSubject(subj.id); App.nav('subjects'); Toast.show({title:'Subject deleted', tone:'info'}); }; } });
        };
        $('#sjSave', el).onclick = () => {
          const name = $('#sjName', el).value.trim();
          if (!name){ $('#sjName', el).focus(); return; }
          const data = { name, icon, color, goal: clamp(+$('#sjGoal', el).value || 180, 30, 3000) };
          api.close();  /* close first: views repaint on store:change only when no modal is open */
          Store.saveSubject(subj ? { ...data, id: subj.id } : data);
          Toast.show({ title: subj ? 'Subject updated' : 'Subject added', desc: name, tone:'success' });
          opts.onSaved && opts.onSaved();
        };
      }
    });
  }
};
