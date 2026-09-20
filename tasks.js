/* ============================================================
   StudyOS — views/tasks.js · study task management
   ============================================================ */
Views.tasks = {
  title: 'Tasks', crumb: 'Everything that needs doing', icon: 'check-square',
  filter: 'all', subjFilter: 'all', _off: null,

  render(root){
    this._off && this._off();
    this.paint(root);
    this._off = Bus.on('store:change', () => { if (!Modal.stack.length && App.currentRoute==='tasks') this.paint(root); });
  },

  paint(root){
    const t = D.today();
    let tasks = Store.state.tasks;
    if (this.subjFilter !== 'all') tasks = tasks.filter(x=>x.subjectId===this.subjFilter);
    const done = tasks.filter(x=>x.done);
    let open = tasks.filter(x=>!x.done);
    if (this.filter === 'today') open = open.filter(x=>x.due<=t);
    if (this.filter === 'upcoming') open = open.filter(x=>x.due>t);
    open.sort((a,b)=> a.due.localeCompare(b.due) || b.priority - a.priority);
    done.sort((a,b)=> (b.doneAt||'').localeCompare(a.doneAt||''));

    const totalAll = Store.state.tasks.length, doneAll = Store.state.tasks.filter(x=>x.done).length;
    const subjects = Store.state.subjects;

    root.innerHTML = `
    <div class="page-head">
      <div class="ph-copy"><h2>Tasks</h2><p>Small promises to your future self — keep them, one check at a time.</p></div>
      <div class="ph-actions"><button class="btn btn-primary" id="tNew">${ic('plus')} Add task</button></div>
    </div>

    <div class="card tasks-progress" data-reveal>
      ${Charts.ring({ size:64, stroke:7, pct: totalAll ? Math.round(doneAll/totalAll*100) : 0, num:'', sub:'' })}
      <div class="grow">
        <div class="title-md">${doneAll} of ${totalAll} tasks complete</div>
        <div class="tiny muted-2" style="margin:2px 0 8px">${Store.tasksDueToday().length} due today · ${open.filter(x=>x.due<t).length} overdue</div>
        <div class="pbar"><i style="width:${totalAll ? doneAll/totalAll*100 : 0}%"></i></div>
      </div>
    </div>

    <div class="tasks-head-row" data-reveal>
      <div class="seg">
        ${[['all','All'],['today','Today'],['upcoming','Upcoming'],['done','Completed']].map(([f,l])=>
          `<button class="${this.filter===f?'on':''}" data-filter="${f}">${l}</button>`).join('')}
      </div>
      <div class="grow"></div>
      <select class="select" id="tSubjFilter" style="width:auto">
        <option value="all">All subjects</option>
        ${subjects.map(s=>`<option value="${s.id}" ${this.subjFilter===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}
      </select>
    </div>

    <div id="tList">
      ${(this.filter === 'done' ? done : [...open, ...(this.filter==='all' ? done.slice(0,4) : [])]).map(x => this.rowHTML(x, t)).join('')}
      ${ (this.filter==='done' ? done : open).length === 0 ? `<div class="card"><div class="empty">
        <span class="e-ic">${ic(this.filter==='done'?'check-circle':'check-square')}</span>
        <h4>${this.filter==='done' ? 'Nothing completed yet' : this.filter==='today' ? 'Nothing due today' : this.filter==='upcoming' ? 'No upcoming tasks' : 'All clear'}</h4>
        <p>${this.filter==='done' ? 'Completed tasks will gather here like trophies.' : 'Add a task and make today count.'}</p>
      </div></div>` : ''}
    </div>`;

    $('#tNew').onclick = () => TasksUI.open();
    $$('[data-filter]', root).forEach(b => b.onclick = () => { this.filter = b.dataset.filter; this.paint(root); });
    $('#tSubjFilter').onchange = e => { this.subjFilter = e.target.value; this.paint(root); };
    $$('.t-complete', root).forEach(b => b.onclick = e => { e.stopPropagation(); this.toggle(b.dataset.id, b); });
    $$('.tr-t', root).forEach(el => el.onclick = () => TasksUI.open({ id: el.dataset.id }));
    $$('[data-edit]', root).forEach(b => b.onclick = e => { e.stopPropagation(); TasksUI.open({ id: b.dataset.edit }); });
    $$('[data-del]', root).forEach(b => b.onclick = e => { e.stopPropagation();
      const task = Store.task(b.dataset.del); Store.deleteTask(b.dataset.del);
      Toast.show({ title:'Task deleted', desc: task?.title, tone:'info' }); });
    Charts.ringTick(root);
    Reveal.init(root);
  },

  rowHTML(x, today){
    const s = Store.subject(x.subjectId);
    const exam = x.examId ? Store.exam(x.examId) : null;
    const overdue = !x.done && x.due < today, isToday = x.due === today;
    return `<div class="task-row ${x.done?'done':''}" data-reveal>
      <button class="cb t-complete ${x.done?'on':''}" data-id="${x.id}" aria-label="${x.done?'Mark incomplete':'Complete task'}">${ic('check')}</button>
      <span class="tr-t" data-id="${x.id}">${esc(x.title)}</span>
      <div class="tr-meta">
        <span class="prio" data-p="${x.priority}" title="Priority"><i></i><i></i><i></i></span>
        ${s?`<span class="subj-chip"><span class="sdot" style="color:${s.color};background:${s.color}"></span>${esc(s.name)}</span>`:''}
        ${exam?`<span class="tag">${ic('file-text')} ${esc(exam.name)}</span>`:''}
        ${(x.tags||[]).slice(0,2).map(tg=>`<span class="tag">${esc(tg)}</span>`).join('')}
        <span class="tr-due ${overdue?'over':''} ${isToday&&!overdue?'today':''}">${ic('clock')}${overdue?'Overdue':x.done?D.fmtShort(x.due):D.relTime(x.due)}</span>
      </div>
      <div class="tr-act">
        <button class="icon-btn sm" data-edit="${x.id}" aria-label="Edit task">${ic('edit')}</button>
        <button class="icon-btn sm" data-del="${x.id}" aria-label="Delete task">${ic('trash')}</button>
      </div>
    </div>`;
  },

  toggle(id, btn){
    const task = Store.task(id); if (!task) return;
    if (task.done){ Store.completeTask(id, false); return; }
    btn.classList.add('on','ripple');
    const row = btn.closest('.task-row'); row?.classList.add('justdone');
    setTimeout(()=>{
      const res = Store.completeTask(id, true);
      Toast.show({ title:'Task complete', desc: task.title, tone:'success', duration:2600 });
      if (res?.xp) setTimeout(()=>Toast.show({ title:`+${res.xp} XP`, desc:'Task completed', tone:'xp', duration:2400 }), 500);
      if (res?.levelUp) setTimeout(()=>BattleFX.levelUp(res.levelUp), 1100);
      if (res?.newAchievements?.length) BattleFX.notifyAchievements(res.newAchievements);
    }, 320);
  },

  destroy(){ this._off && this._off(); this._off = null; }
};

/* ---------------- task editor (global) ---------------- */
const TasksUI = {
  open(prefill = {}){
    prefill = prefill || {};
    const subjects = Store.state.subjects.filter(s=>!s.archived);
    const task = prefill.id ? Store.task(prefill.id) : null;
    if (!subjects.length && !task) return subjectsGuardModal(() => TasksUI.open(prefill));
    const v = task || { title:'', subjectId: prefill.subjectId || subjects[0]?.id, due: prefill.due || D.today(), priority: 2, tags:[], notes:'', examId: prefill.examId || null };
    const exams = Store.upcomingExams();
    Modal.open({
      title: task ? 'Edit task' : 'New task',
      body: `
        <div class="field"><label>What needs doing?</label>
          <input class="input input-lg" id="tkTitle" value="${esc(v.title)}" placeholder="e.g. Finish problem set 4, questions 1–10" maxlength="120"></div>
        <div class="form-row">
          <div class="field"><label>Subject</label>
            <select class="select" id="tkSubj">${subjects.map(s=>`<option value="${s.id}" ${s.id===v.subjectId?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Due date</label><input class="input" type="date" id="tkDue" value="${v.due}"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Priority</label>
            <select class="select" id="tkPrio">
              <option value="1" ${v.priority==1?'selected':''}>Low</option>
              <option value="2" ${v.priority==2?'selected':''}>Medium</option>
              <option value="3" ${v.priority==3?'selected':''}>High</option>
            </select></div>
          <div class="field"><label>Linked exam <span style="text-transform:none;letter-spacing:0;color:var(--ink-4)">· optional</span></label>
            <select class="select" id="tkExam"><option value="">None</option>${exams.map(e=>`<option value="${e.id}" ${v.examId===e.id?'selected':''}>${esc(Store.subject(e.subjectId)?.name)} · ${esc(e.name)} (${D.relTime(e.date)})</option>`).join('')}</select></div>
        </div>
        <div class="field"><label>Tags <span style="text-transform:none;letter-spacing:0;color:var(--ink-4)">· comma separated</span></label>
          <input class="input" id="tkTags" value="${esc((v.tags||[]).join(', '))}" placeholder="revision, problem-set, lab"></div>
        <div class="field"><label>Notes</label>
          <textarea class="textarea" id="tkNotes" placeholder="Details, page numbers, reminders…">${esc(v.notes||'')}</textarea></div>`,
      footer: `${task ? `<button class="btn btn-danger" id="tkDel" style="margin-right:auto">${ic('trash')} Delete</button>` : ''}
        <button class="btn btn-secondary" data-close>Cancel</button>
        <button class="btn btn-primary" id="tkSave">${task?'Save changes':'Add task'}</button>`,
      onMount(el, api){
        el.querySelector('[data-close]').onclick = () => api.close();
        $('#tkTitle', el).focus();
        if (task) $('#tkDel', el).onclick = () => { api.close(); Store.deleteTask(task.id); Toast.show({title:'Task deleted', tone:'info'}); };
        $('#tkSave', el).onclick = () => {
          const data = {
            title: $('#tkTitle', el).value.trim(),
            subjectId: $('#tkSubj', el).value,
            due: $('#tkDue', el).value || D.today(),
            priority: +$('#tkPrio', el).value,
            examId: $('#tkExam', el).value || null,
            tags: $('#tkTags', el).value.split(',').map(s=>s.trim()).filter(Boolean).slice(0,4),
            notes: $('#tkNotes', el).value.trim()
          };
          if (!data.title){ $('#tkTitle', el).focus(); $('#tkTitle', el).style.borderColor = 'var(--terra)'; return; }
          api.close();  /* close first: lists repaint on store:change only when no modal is open */
          Store.saveTask(task ? { ...data, id: task.id, done: task.done, doneAt: task.doneAt } : data);
          Toast.show({ title: task ? 'Task updated' : 'Task added', desc: data.title, tone:'success' });
        };
      }
    });
  }
};
