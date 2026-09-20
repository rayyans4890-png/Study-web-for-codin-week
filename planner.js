/* ============================================================
   StudyOS — views/planner.js · month & week calendar, day panel
   ============================================================ */
Views.planner = {
  title: 'Planner', crumb: 'Shape your study week', icon: 'calendar',
  cursor: null, selDay: null, mode: 'month', weekCursor: null,
  _off: null,

  render(root, params){
    this.cursor = this.cursor || D.today();
    this.selDay = params || this.selDay || D.today();
    this.weekCursor = this.weekCursor || D.today();
    this._off && this._off();
    this.paint(root);
    this._off = Bus.on('store:change', () => { if (!Modal.stack.length && App.currentRoute==='planner') this.paint(root); });
  },

  paint(root){
    root.innerHTML = `
    <div class="page-head">
      <div class="ph-copy"><h2>Planner</h2><p>Study blocks, exams and deadlines — one calm grid.</p></div>
      <div class="ph-actions">
        <div class="seg" role="tablist">
          <button class="${this.mode==='month'?'on':''}" data-mode="month">Month</button>
          <button class="${this.mode==='week'?'on':''}" data-mode="week">Week</button>
        </div>
        <button class="btn btn-primary" id="pNew">${ic('calendar-plus')} New study block</button>
      </div>
    </div>
    <div class="planner-layout">
      <div class="cal-card" id="calCard">${this.mode==='month' ? this.monthHTML() : this.weekHTML()}</div>
      <aside class="day-panel card" id="dayPanel">${this.dayPanelHTML()}</aside>
    </div>`;
    $('#pNew').onclick = () => PlannerUI.open({ date: this.selDay });
    $$('[data-mode]', root).forEach(b => b.onclick = () => { this.mode = b.dataset.mode; this.paint(root); });

    if (this.mode === 'month'){
      $$('.cal-day', root).forEach(d => d.onclick = () => { this.selDay = d.dataset.date; this.paint(root); });
      $('#calPrev').onclick = () => { this.cursor = D.addMonths(this.cursor, -1); this.paint(root); };
      $('#calNext').onclick = () => { this.cursor = D.addMonths(this.cursor, 1); this.paint(root); };
      $('#calToday').onclick = () => { this.cursor = D.today(); this.selDay = D.today(); this.paint(root); };
    } else {
      $('#calPrev').onclick = () => { this.weekCursor = D.addDays(this.weekCursor, -7); this.paint(root); };
      $('#calNext').onclick = () => { this.weekCursor = D.addDays(this.weekCursor, 7); this.paint(root); };
      $('#calToday').onclick = () => { this.weekCursor = D.today(); this.paint(root); };
      $$('.week-ev', root).forEach(ev => ev.onclick = e => { e.stopPropagation(); PlannerUI.open({ id: ev.dataset.id }); });
    }
    this.bindDayPanel(root);
    Reveal.init(root);
  },

  /* ---------------- month ---------------- */
  monthHTML(){
    const [y, m] = this.cursor.split('-').map(Number);
    const first = new Date(y, m-1, 1);
    const gridStart = D.startOfWeek(D.key(first));
    let cells = '';
    /* skip the entire sixth row when it contains no days of the current month */
    const sixthRowStart = D.addDays(gridStart, 35);
    const skipSixthRow = i0 => i0 >= 35 && D.parse(sixthRowStart).getMonth() !== m-1;
    for (let i=0;i<42;i++){
      const k = D.addDays(gridStart, i);
      if (skipSixthRow(i)) continue;
      const out = D.parse(k).getMonth() !== m-1;
      const evs = Store.state.events.filter(e=>e.date===k).sort((a,b)=>a.start.localeCompare(b.start));
      const exams = Store.state.exams.filter(e=>e.date===k);
      const tasksDue = Store.state.tasks.filter(t=>!t.done && t.due===k);
      cells += `<div class="cal-day ${out?'out':''} ${k===D.today()?'today':''} ${k===this.selDay?'sel':''}" data-date="${k}" role="button" tabindex="0" aria-label="${D.fmtLong(k)}">
        <span class="cd-n">${D.parse(k).getDate()}</span>
        ${exams.map(e=>`<span class="cal-ev exam" title="${esc(e.name)}">${ic('file-text')} ${esc(Store.subject(e.subjectId)?.name||'Exam')}</span>`).join('')}
        ${evs.slice(0, exams.length ? 1 : 2).map(e=>{ const s=Store.subject(e.subjectId);
          return `<span class="cal-ev" style="--c:${s?.color}" title="${esc(e.title)}">${esc(e.title)}</span>`; }).join('')}
        ${evs.length + exams.length > (exams.length ? 2 : 3) ? `<span class="cal-more">+${evs.length + exams.length - (exams.length?2:3)} more</span>` : ''}
        ${tasksDue.length && !exams.length && !evs.length ? `<span class="cal-more" style="color:var(--amber)">${tasksDue.length} task${tasksDue.length>1?'s':''} due</span>` : ''}
      </div>`;
    }
    const [py, pm] = D.addMonths(this.cursor, -1).split('-').map(Number);
    return `<div class="cal-head">
      <h3>${D.monthTitle(this.cursor)}</h3>
      <div class="cal-nav">
        <button class="btn btn-sm btn-secondary" id="calToday">Today</button>
        <button class="icon-btn sm" id="calPrev" aria-label="Previous month">${ic('chevron-left')}</button>
        <button class="icon-btn sm" id="calNext" aria-label="Next month">${ic('chevron-right')}</button>
      </div></div>
      <div class="cal-grid">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<span class="cal-dow">${d}</span>`).join('')}${cells}</div>`;
  },

  /* ---------------- week ---------------- */
  weekHTML(){
    const start = D.startOfWeek(this.weekCursor);
    const days = Array.from({length:7},(_,i)=>D.addDays(start,i));
    const H0 = 6, H1 = 23, rowH = 44;
    const now = new Date();
    let nowLine = '';
    if (days.includes(D.today())){
      const mins = (now.getHours()-H0)*60 + now.getMinutes();
      if (mins > 0) nowLine = `<div class="week-now" style="top:calc(40px + ${mins/60*rowH}px)"></div>`;
    }
    return `<div class="cal-head">
      <h3>${D.fmtMedium(days[0])} — ${D.fmtMedium(days[6])}</h3>
      <div class="cal-nav">
        <button class="btn btn-sm btn-secondary" id="calToday">This week</button>
        <button class="icon-btn sm" id="calPrev" aria-label="Previous week">${ic('chevron-left')}</button>
        <button class="icon-btn sm" id="calNext" aria-label="Next week">${ic('chevron-right')}</button>
      </div></div>
      <div style="overflow-x:auto"><div class="week-grid" style="min-width:640px;position:relative">
        <div class="week-hours">${Array.from({length:H1-H0},(_,i)=>`<span>${String(H0+i).padStart(2,'0')}:00</span>`).join('')}</div>
        ${days.map(k=>{
          const evs = Store.state.events.filter(e=>e.date===k);
          const exams = Store.state.exams.filter(e=>e.date===k);
          return `<div class="week-col ${k===D.today()?'today':''}">
            <div class="wc-dow ${k===D.today()?'tdy':''}">${D.dayName(k)}<b>${D.parse(k).getDate()}</b></div>
            ${evs.map(e=>{ const s = Store.subject(e.subjectId);
              const [hh,mm] = e.start.split(':').map(Number);
              const top = ((hh-H0)*60+mm)/60*rowH + 40, h = Math.max(26, e.durationMin/60*rowH - 3);
              return `<div class="week-ev" data-id="${e.id}" style="--c:${s?.color};top:${top}px;height:${h}px">
                <span class="we-t">${esc(e.title)}</span><span class="we-s">${esc(e.start)} · ${e.durationMin}m</span></div>`;
            }).join('')}
            ${exams.map(e=>`<div class="week-ev" style="--c:var(--terra);top:${((e.time.split(':')[0]-H0)*60)/60*rowH+40}px;height:34px;background:var(--terra-bg);border-left-color:var(--terra)"><span class="we-t">${ic('file-text')} ${esc(e.name)}</span><span class="we-s">Exam · ${esc(e.time)}</span></div>`).join('')}
          </div>`; }).join('')}
        ${nowLine}
      </div></div>`;
  },

  /* ---------------- day panel ---------------- */
  dayPanelHTML(){
    const k = this.selDay;
    const evs = Store.state.events.filter(e=>e.date===k).sort((a,b)=>a.start.localeCompare(b.start));
    const exams = Store.state.exams.filter(e=>e.date===k);
    const tasks = Store.state.tasks.filter(t=>t.due===k && !t.done);
    const isToday = k === D.today();
    return `<div class="dp-date">
      <span class="dp-big">${isToday ? 'Today' : D.parse(k).toLocaleDateString('en-US',{weekday:'long'})}</span>
      <span class="dp-sub">${D.fmtLong(k)}</span>
    </div>
    <div class="dp-list">
      <button class="btn btn-secondary btn-sm" style="margin:4px 10px 10px" id="dpAdd">${ic('plus')} Add block on this day</button>
      ${exams.map(e=>`<div class="dp-ev" style="--c:var(--terra)">
        <span class="dpe-bar"></span>
        <div class="grow" style="min-width:0"><div class="dpe-t">${ic('file-text')} ${esc(e.name)} — exam</div>
        <div class="dpe-m"><span>${esc(e.time)}</span><span>${esc(e.location)}</span></div></div>
        <div class="dpe-act"><button class="icon-btn sm" data-exam="${e.id}" aria-label="Open exam">${ic('arrow-right')}</button></div>
      </div>`).join('')}
      ${evs.map(e=>{ const s = Store.subject(e.subjectId);
        return `<div class="dp-ev" data-id="${e.id}">
        <span class="dpe-bar" style="--c:${s?.color}"></span>
        <div class="grow" style="min-width:0"><div class="dpe-t">${esc(e.title)}</div>
        <div class="dpe-m"><span class="subj-chip"><span class="sdot" style="color:${s?.color};background:${s?.color}"></span>${esc(s?.name)}</span>
          <span>${esc(e.start)} · ${e.durationMin} min</span>${e.priority===3?'<span class="badge badge-terra" style="height:18px">High</span>':e.priority===2?'<span class="badge badge-amber" style="height:18px">Med</span>':'<span class="badge badge-line" style="height:18px">Low</span>'}</div>
        ${e.notes?`<div class="tiny muted-2" style="margin-top:4px">${esc(e.notes)}</div>`:''}</div>
        <div class="dpe-act">
          <button class="icon-btn sm" data-start="${e.id}" title="Start focus session" aria-label="Start">${ic('play')}</button>
          <button class="icon-btn sm" data-edit="${e.id}" title="Edit" aria-label="Edit">${ic('edit')}</button>
          <button class="icon-btn sm" data-del="${e.id}" title="Delete" aria-label="Delete">${ic('trash')}</button>
        </div>
      </div>`; }).join('')}
      ${tasks.length ? `<div class="sb-group" style="padding:10px 12px 4px">Tasks due</div>
        ${tasks.map(t=>`<div class="lrow" style="padding:8px 10px"><span class="sdot" style="color:${Store.subject(t.subjectId)?.color};background:${Store.subject(t.subjectId)?.color}"></span>
        <span class="small" style="font-weight:550">${esc(t.title)}</span></div>`).join('')}` : ''}
      ${!evs.length && !exams.length && !tasks.length ? `<div class="empty" style="padding:26px 12px">
        <span class="e-ic">${ic('calendar')}</span><h4>An open day</h4><p>Nothing planned yet. A single well-placed block can shape the whole day.</p></div>` : ''}
    </div>`;
  },

  bindDayPanel(root){
    $('#dpAdd')?.addEventListener('click', () => PlannerUI.open({ date: this.selDay }));
    $$('[data-edit]', root).forEach(b => b.onclick = () => PlannerUI.open({ id: b.dataset.edit }));
    $$('[data-del]', root).forEach(b => b.onclick = () => {
      const e = Store.event(b.dataset.del);
      Store.deleteEvent(b.dataset.del);
      Toast.show({ title:'Block removed', desc:e?.title, tone:'info' });
    });
    $$('[data-start]', root).forEach(b => b.onclick = () => {
      const ev = Store.event(b.dataset.start);
      if (!ev) return;
      quickStartModal({ subjectId: ev.subjectId, minutes: ev.durationMin >= 10 ? Math.min(ev.durationMin, 120) : 45, goal: ev.title });
    });
    $$('[data-exam]', root).forEach(b => b.onclick = () => App.nav('exams/' + b.dataset.exam));
  },

  destroy(){ this._off && this._off(); this._off = null; }
};

/* ---------------- event editor (global) ---------------- */
const PlannerUI = {
  open(prefill = {}){
    prefill = prefill || {};
    const subjects = Store.state.subjects.filter(s=>!s.archived);
    const ev = prefill.id ? Store.event(prefill.id) : null;
    if (!subjects.length && !ev) return subjectsGuardModal(() => PlannerUI.open(prefill));
    const v = ev || { subjectId: prefill.subjectId || subjects[0]?.id, title: prefill.title || '', date: prefill.date || D.today(), start: prefill.start || '17:00', durationMin: prefill.durationMin || 60, priority: 2, notes:'' };
    Modal.open({
      title: ev ? 'Edit study block' : 'New study block',
      body: `
        <div class="field"><label>Title</label><input class="input" id="evTitle" value="${esc(v.title)}" placeholder="e.g. Calculus revision — series" maxlength="80"></div>
        <div class="field"><label>Subject</label>
          <select class="select" id="evSubj">${subjects.map(s=>`<option value="${s.id}" ${s.id===v.subjectId?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
        <div class="form-row">
          <div class="field"><label>Date</label><input class="input" type="date" id="evDate" value="${v.date}"></div>
          <div class="field"><label>Start time</label><input class="input" type="time" id="evStart" value="${v.start}"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Duration (min)</label><input class="input" type="number" id="evDur" min="10" max="480" step="5" value="${v.durationMin}"></div>
          <div class="field"><label>Priority</label>
            <select class="select" id="evPrio">
              <option value="1" ${v.priority==1?'selected':''}>Low — gentle</option>
              <option value="2" ${v.priority==2?'selected':''}>Medium — steady</option>
              <option value="3" ${v.priority==3?'selected':''}>High — important</option>
            </select></div>
        </div>
        <div class="field"><label>Notes <span style="text-transform:none;letter-spacing:0;color:var(--ink-4)">· optional</span></label>
          <textarea class="textarea" id="evNotes" placeholder="Chapter, room, anything future-you needs…">${esc(v.notes||'')}</textarea></div>`,
      footer: `${ev ? `<button class="btn btn-danger" id="evDel" style="margin-right:auto">${ic('trash')} Delete</button>` : ''}
        <button class="btn btn-secondary" data-close>Cancel</button>
        <button class="btn btn-primary" id="evSave">${ev?'Save changes':'Add to calendar'}</button>`,
      onMount(el, api){
        el.querySelector('[data-close]').onclick = () => api.close();
        if (ev) $('#evDel', el).onclick = () => { api.close(); Store.deleteEvent(ev.id); Toast.show({title:'Block removed', tone:'info'}); };
        $('#evSave', el).onclick = () => {
          const data = {
            subjectId: $('#evSubj', el).value, title: $('#evTitle', el).value.trim() || 'Study block',
            date: $('#evDate', el).value || D.today(), start: $('#evStart', el).value || '17:00',
            durationMin: clamp(+$('#evDur', el).value || 60, 10, 480), priority: +$('#evPrio', el).value,
            notes: $('#evNotes', el).value.trim()
          };
          /* close before saving: views repaint on store:change only when no modal is open */
          api.close();
          if (ev) Store.saveEvent({ ...data, id: ev.id }); else Store.saveEvent(data);
          Toast.show({ title: ev ? 'Block updated' : 'Block added', desc:`${data.title} · ${D.fmtMedium(data.date)} ${data.start}`, tone:'success' });
        };
      }
    });
  }
};
