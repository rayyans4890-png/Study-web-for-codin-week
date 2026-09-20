/* ============================================================
   StudyOS — views/exams.js · countdown cards + detail page
   ============================================================ */
Views.exams = {
  title: 'Exams', crumb: 'Countdown to confident', icon: 'file-text',
  _off: null,

  render(root, params){
    this._off && this._off();
    if (params) this.detail(root, params);
    else this.list(root);
    this._off = Bus.on('store:change', () => {
      if (Modal.stack.length || App.currentRoute !== 'exams') return;
      if (params && !Store.exam(params)) this.list(root);
      else params ? this.detail(root, params, true) : this.list(root);
    });
  },

  list(root){
    const exams = [...Store.state.exams].sort((a,b)=>a.date.localeCompare(b.date));
    const t = D.today();
    root.innerHTML = `
    <div class="page-head">
      <div class="ph-copy"><h2>Exams</h2><p>Every exam becomes a slope you can climb — topic by topic.</p></div>
      <div class="ph-actions"><button class="btn btn-primary" id="xNew">${ic('calendar-plus')} Add exam</button></div>
    </div>
    <div class="exams-grid">
      ${exams.map(e=>{
        const s = Store.subject(e.subjectId), prep = Store.examPrep(e);
        const days = D.diffDays(e.date, t), past = days < 0, soon = days >= 0 && days <= 7;
        return `<div class="exam-card" data-reveal data-exam="${e.id}" style="--c:${s?.color}" tabindex="0" role="button">
          <div class="ec-count ${soon?'soon':''}">
            <span class="n">${past ? '—' : days}</span>
            <span class="l">${past ? 'written' : days === 1 ? 'day left' : 'days left'}</span>
          </div>
          <div class="ec-mid">
            <h3>${esc(s?.name)} · ${esc(e.name)}</h3>
            <div class="m">
              <span>${ic('calendar')}${D.fmtLong(e.date)}</span>
              <span>${ic('clock')}${esc(e.time)}</span>
              ${e.location?`<span>${ic('pin')}${esc(e.location)}</span>`:''}
            </div>
            <div class="exam-prep">
              <div class="pbar"><i style="width:${prep.pct}%"></i></div>
              <span class="ep-pct">${prep.pct}%</span>
              <span class="tiny muted-2">${prep.done}/${prep.total} topics</span>
              ${prep.pct===100?`<span class="badge badge-green">${ic('check-circle')} Ready</span>`:past?`<span class="badge badge-line">Past</span>`:'<span class="badge badge-amber">Preparing</span>'}
            </div>
          </div>
          <span class="icon-btn" style="pointer-events:none">${ic('chevron-right')}</span>
        </div>`;
      }).join('')}
    </div>
    ${!exams.length ? `<div class="card"><div class="empty"><span class="e-ic">${ic('graduation')}</span><h4>No exams yet</h4><p>Add your next exam and watch the countdown work for you, not against you.</p></div></div>` : ''}`;
    $('#xNew').onclick = () => ExamsUI.open();
    $$('[data-exam]', root).forEach(c => c.onclick = () => App.nav('exams/' + c.dataset.exam));
    Reveal.init(root);
  },

  detail(root, id, quiet){
    const e = Store.exam(id);
    if (!e) return this.list(root);
    const s = Store.subject(e.subjectId), prep = Store.examPrep(e);
    const days = D.diffDays(e.date, D.today());
    const linkedTasks = Store.state.tasks.filter(t=>t.examId===e.id);
    const subjEvents = Store.state.events.filter(v=>v.subjectId===e.subjectId && v.date>=D.today()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
    const recentSessions = [...Store.state.sessions].filter(x=>x.subjectId===e.subjectId).sort((a,b)=>b.startedAt.localeCompare(a.startedAt)).slice(0,5);
    const history = (e.history||[]).slice(-6).reverse();

    root.innerHTML = `
    <div class="page-head">
      <div class="ph-copy"><div class="row gap8" style="margin-bottom:6px"><a class="link-u small" href="#/exams">${ic('arrow-left')} All exams</a></div>
      <h2>${esc(s?.name)} · ${esc(e.name)}</h2>
      <p>${D.fmtLong(e.date)} · ${esc(e.time)}${e.location?` · ${esc(e.location)}`:''}</p></div>
      <div class="ph-actions">
        <button class="btn btn-secondary" id="xdEdit">${ic('edit')} Edit</button>
        <button class="btn btn-primary" id="xdStudy">${ic('play')} Study for this exam</button>
      </div>
    </div>

    <div class="exam-detail-hero" data-reveal="zoom">
      <div>
        <div class="edh-count">
          <span class="n">${days}<small> ${days===1?'day':'days'}</small></span>
        </div>
        <div class="edh-sub">
          <span>${ic('calendar')}${D.fmtLong(e.date)}</span>
          <span>${ic('clock')}${esc(e.time)}</span>
          ${e.location?`<span>${ic('pin')}${esc(e.location)}</span>`:''}
        </div>
        ${e.notes?`<p style="margin-top:14px;font-size:13px;color:var(--g-200);max-width:480px;line-height:1.6">${esc(e.notes)}</p>`:''}
      </div>
      <div style="position:relative;text-align:center">
        ${Charts.ring({ size:150, stroke:11, pct:prep.pct, num:prep.pct+'%', sub:'prepared', colors:['#D8BC72','#7FA98C'] })}
        <span class="tiny" style="color:var(--g-300)">${prep.done} of ${prep.total} topics reviewed</span>
      </div>
    </div>

    <div class="home-grid" style="grid-template-columns:1fr 320px">
      <div class="home-main">
        <div class="card home-panel" data-reveal>
          <div class="hp-head"><h3>${ic('list')} Topics</h3>
            <span class="tiny muted-2">${prep.done} of ${prep.total} reviewed — tick as you go</span></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 18px">
            ${e.topics.map((tp,i)=>`
              <div class="topic-row ${tp.done?'done':''}" data-topic="${i}" role="button" tabindex="0">
                <span class="cb ${tp.done?'on':''}">${ic('check')}</span>
                <span class="tp-n">${esc(tp.name)}</span>
                ${tp.done?ic('check-circle'):''}
              </div>`).join('')}
          </div>
        </div>

        <div class="card home-panel" data-reveal>
          <div class="hp-head"><h3>${ic('check-square')} Linked tasks</h3>
            <button class="btn btn-sm btn-secondary" id="xdAddTask">${ic('plus')} Add</button></div>
          ${linkedTasks.length ? linkedTasks.map(t=>`
            <div class="lrow">
              <button class="cb t-complete ${t.done?'on':''}" data-task="${t.id}" aria-label="Complete">${ic('check')}</button>
              <span class="small" style="font-weight:550;${t.done?'text-decoration:line-through;color:var(--ink-3)':''}">${esc(t.title)}</span>
              <span class="tm-due" style="margin-left:auto">${D.relTime(t.due)}</span>
            </div>`).join('')
          : `<p class="small muted-2" style="padding:6px 4px">No tasks linked yet — small tasks make big exams manageable.</p>`}
        </div>
      </div>

      <div class="home-side">
        <div class="card home-panel" data-reveal="right">
          <div class="hp-head"><h3>${ic('calendar')} Planned sessions</h3>
            <button class="btn btn-sm btn-secondary" id="xdPlan">${ic('plus')}</button></div>
          ${subjEvents.length ? subjEvents.map(v=>`
            <div class="lrow" style="padding:8px 6px">
              <span class="sdot" style="color:${s?.color};background:${s?.color}"></span>
              <div class="grow" style="min-width:0"><div class="small" style="font-weight:600">${esc(v.title)}</div>
              <div class="tiny muted-2">${D.fmtMedium(v.date)} · ${esc(v.start)} · ${v.durationMin}m</div></div>
            </div>`).join('')
          : `<p class="small muted-2" style="padding:6px 4px">No blocks planned for this subject yet.</p>`}
        </div>

        <div class="card home-panel" data-reveal="right">
          <div class="hp-head"><h3>${ic('clock')} Recent ${esc(s?.name||'')} sessions</h3></div>
          ${recentSessions.length ? recentSessions.map(x=>`
            <div class="sess-mini"><span class="sm-dot" style="background:${s?.color}"></span>
              <div class="grow"><div class="sm-s">${D.fmtMedium(x.date)} · ${esc(x.startedAt.slice(11,16))}</div></div>
              <span class="sm-dur">${fmtMin(x.durationMin)}</span></div>`).join('')
          : `<p class="small muted-2" style="padding:6px 4px">No sessions logged yet.</p>`}
        </div>

        ${history.length ? `<div class="card home-panel" data-reveal="right">
          <div class="hp-head"><h3>${ic('clock')} Progress history</h3></div>
          ${history.map(h=>`<div class="lrow" style="padding:7px 6px">
            <span style="color:var(--g-500)">${ic('check-circle')}</span>
            <span class="small" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(h.topic)}</span>
            <span class="tiny muted-2">${D.fmtShort(h.date)}</span></div>`).join('')}
        </div>` : ''}
      </div>
    </div>`;

    $('#xdEdit').onclick = () => ExamsUI.open({ id: e.id });
    $('#xdStudy').onclick = () => quickStartModal({ subjectId: e.subjectId, goal: 'Prepare for ' + (s?.name) + ' — ' + e.name });
    $('#xdAddTask').onclick = () => TasksUI.open({ subjectId: e.subjectId, examId: e.id, due: D.addDays(e.date, -2) });
    $('#xdPlan').onclick = () => PlannerUI.open({ date: D.today(), subjectId: e.subjectId, title: (s?.name||'') + ' revision' });
    $$('[data-topic]', root).forEach(row => row.onclick = () => {
      const idx = +row.dataset.topic;
      const wasDone = e.topics[idx].done;
      const res = Store.toggleTopic(e.id, idx);
      if (!wasDone && res.xp) Toast.show({ title:`+${res.xp} XP`, desc:'Topic reviewed — preparation updated', tone:'xp', duration:2400 });
      if (res.newAchievements?.length) BattleFX.notifyAchievements(res.newAchievements);
    });
    $$('.t-complete', root).forEach(b => b.onclick = ev => { ev.stopPropagation(); Store.completeTask(b.dataset.task, true); Toast.show({title:'Task complete', tone:'success', duration:2200}); });
    Charts.ringTick(root);
    if (!quiet) Reveal.init(root);
  },

  destroy(){ this._off && this._off(); this._off = null; }
};

/* ---------------- exam editor (global) ---------------- */
const ExamsUI = {
  open(prefill = {}){
    prefill = prefill || {};
    const subjects = Store.state.subjects.filter(s=>!s.archived);
    const exam = prefill.id ? Store.exam(prefill.id) : null;
    if (!subjects.length && !exam) return subjectsGuardModal(() => ExamsUI.open(prefill));
    const v = exam || { name:'', subjectId: subjects[0]?.id, date: D.addDays(D.today(), 14), time:'09:00', location:'', notes:'', topics:'' };
    Modal.open({
      title: exam ? 'Edit exam' : 'New exam', size: 'w-lg',
      body: `
        <div class="form-row">
          <div class="field"><label>Exam name</label><input class="input" id="xmName" value="${esc(v.name)}" placeholder="e.g. Final Exam"></div>
          <div class="field"><label>Subject</label>
            <select class="select" id="xmSubj">${subjects.map(s=>`<option value="${s.id}" ${s.id===v.subjectId?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Date</label><input class="input" type="date" id="xmDate" value="${v.date}"></div>
          <div class="field"><label>Time</label><input class="input" type="time" id="xmTime" value="${v.time}"></div>
        </div>
        <div class="field"><label>Location <span style="text-transform:none;letter-spacing:0;color:var(--ink-4)">· optional</span></label>
          <input class="input" id="xmLoc" value="${esc(v.location||'')}" placeholder="Building 5, Hall C"></div>
        <div class="field"><label>Notes</label>
          <textarea class="textarea" id="xmNotes" placeholder="Format, allowed materials, weight…">${esc(v.notes||'')}</textarea></div>
        <div class="field"><label>Topics <span style="text-transform:none;letter-spacing:0;color:var(--ink-4)">· one per line</span></label>
          <textarea class="textarea" id="xmTopics" style="min-height:120px" placeholder="Limits & continuity&#10;Differentiation rules&#10;…">${esc(exam ? exam.topics.map(t=>t.name).join('\n') : '')}</textarea></div>`,
      footer: `${exam ? `<button class="btn btn-danger" id="xmDel" style="margin-right:auto">${ic('trash')} Delete</button>` : ''}
        <button class="btn btn-secondary" data-close>Cancel</button>
        <button class="btn btn-primary" id="xmSave">${exam?'Save changes':'Add exam'}</button>`,
      onMount(el, api){
        el.querySelector('[data-close]').onclick = () => api.close();
        if (exam) $('#xmDel', el).onclick = () => { api.close(); Store.deleteExam(exam.id); Toast.show({title:'Exam removed', tone:'info'}); };
        $('#xmSave', el).onclick = () => {
          const name = $('#xmName', el).value.trim() || 'Exam';
          const topicsRaw = $('#xmTopics', el).value.split('\n').map(x=>x.trim()).filter(Boolean);
          const data = {
            name, subjectId: $('#xmSubj', el).value,
            date: $('#xmDate', el).value || D.addDays(D.today(),14), time: $('#xmTime', el).value || '09:00',
            location: $('#xmLoc', el).value.trim(), notes: $('#xmNotes', el).value.trim(),
            topics: topicsRaw.length ? topicsRaw.map(nm => ({ name: nm, done: exam?.topics.find(t=>t.name===nm)?.done || false })) : []
          };
          api.close();  /* close first: views repaint on store:change only when no modal is open */
          Store.saveExam(exam ? { ...data, id: exam.id, history: exam.history } : data);
          Toast.show({ title: exam ? 'Exam updated' : 'Exam added', desc: name + ' · ' + D.fmtMedium(data.date), tone:'success' });
        };
      }
    });
  }
};
