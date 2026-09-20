/* ============================================================
   StudyOS — views/focus.js · setup · running · complete states
   ============================================================ */
Views.focus = {
  title: 'Focus', crumb: 'Deep, distraction-free sessions', icon: 'timer',
  _offs: [], _lastResult: null,

  render(root){
    this.cleanup();
    root.innerHTML = `<div class="focus-stage" id="focusStage"><div class="focus-ambient"><div class="fa-1"></div><div class="fa-2"></div></div><div id="focusRoot" style="position:relative;z-index:2;width:100%;display:flex;justify-content:center"></div></div>`;
    const inner = $('#focusRoot', root);

    const paint = () => {
      const snap = FocusEngine.snapshot();
      if (snap && (snap.phase === 'work' || snap.phase === 'break')) this.renderRunning(inner, snap);
      else if (this._lastResult) this.renderComplete(inner, this._lastResult);
      else this.renderSetup(inner);
    };
    paint();

    this._offs.push(Bus.on('focus:state', () => paint()));
    this._offs.push(Bus.on('focus:tick', snap => this.tick(snap)));
    this._offs.push(Bus.on('focus:complete', res => {
      this._lastResult = res; paint();
    }));
    this._offs.push(Bus.on('focus:breakdone', () => {
      this._lastResult = null;
      Toast.show({ title:'Break over', desc:'Ready for the next round whenever you are.', icon:'coffee', tone:'info' });
      paint();
    }));
    this._offs.push(Bus.on('store:change', () => {
      /* keep the empty setup state in sync while the first subject is being added */
      if (!Store.state.subjects.length && !FocusEngine.active && !this._lastResult
          && $('#focusRoot .fs-card') && !Modal.stack.length){
        this.renderSetup($('#focusRoot'));
      }
    }));
    this._keyHandler = e => {
      if (App.currentRoute !== 'focus' || Modal.stack.length) return;
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
      if (e.code === 'Space' && FocusEngine.active){
        e.preventDefault();
        FocusEngine.running ? FocusEngine.pause() : FocusEngine.resume();
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  },

  /* ---------------- setup ---------------- */
  renderSetup(el){
    const p = Store.state.profile;
    const subjects = Store.state.subjects.filter(s=>!s.archived);
    if (!subjects.length){
      el.innerHTML = `<div class="focus-setup">
        <div class="fs-head" data-reveal>
          <span class="overline">Focus session</span>
          <h2>What are we studying?</h2>
          <p>Every session in StudyOS is organized by subject — add one and the timer is a click away.</p>
        </div>
        <div class="fs-card" data-reveal style="--d:.08s;align-items:center;text-align:center;padding:46px 30px;gap:12px">
          <span style="width:58px;height:58px;border-radius:18px;background:var(--g-50);border:1px solid var(--g-100);display:grid;place-items:center;color:var(--g-500)">${ic('sprout')}</span>
          <h3 class="title-md" style="font-size:17px">No subjects yet</h3>
          <p class="small muted-2" style="max-width:340px">Your workspace is clean — nothing pre-filled. Add the subject you want to study and your first session starts in seconds.</p>
          <button class="btn btn-primary" id="fAddSubj" style="margin-top:6px">${ic('plus')} Add your first subject</button>
        </div>
      </div>`;
      $('#fAddSubj', el).onclick = () => SubjectUI.open(null, { onSaved: () => this.renderSetup(el) });
      Reveal.init(el);
      return;
    }
    const recent = [...Store.state.sessions].reverse()[0];
    const defSubject = recent?.subjectId || subjects[0]?.id;
    const sel = { subject: defSubject, dur: p.preferredSession || 45, mode: 'classic', goal: '' };
    el.innerHTML = `<div class="focus-setup">
      <div class="fs-head" data-reveal>
        <span class="overline">Focus session</span>
        <h2>What are we studying?</h2>
        <p>Everything else can wait. Set your session, then disappear into it.</p>
      </div>
      <div class="fs-card" data-reveal style="--d:.08s">
        <div><div class="fs-label">${ic('book')}Subject</div>
          <div class="fs-subjects" id="fSubjs">${subjects.map(s=>`<button class="chip subj-chip ${s.id===sel.subject?'on':''}" data-id="${s.id}"><span class="sdot" style="color:${s.color};background:${s.color}"></span>${esc(s.name)}</button>`).join('')}</div></div>
        <div><div class="fs-label">${ic('clock')}Duration</div>
          <div class="qs-durs" id="fDurs">${[25,45,50,90].map(d=>`<button class="qs-dur ${d===sel.dur?'on':''}" data-d="${d}"><div class="qd-n">${d}</div><div class="qd-l">min</div></button>`).join('')}
          <div class="qs-dur" style="grid-column:span 4"><input type="range" min="10" max="120" step="5" value="${sel.dur}" id="fRange" aria-label="Custom duration"><div class="qd-l"><span id="fRangeV">${sel.dur}</span> min — slide to adjust</div></div></div></div>
        <div><div class="fs-label">${ic('layers')}Mode</div>
          <div class="qs-modes" id="fModes">
            <button class="qs-mode on" data-m="classic"><span class="qm-t">${ic('timer')}Classic</span><p>One focused block, start to finish.</p></button>
            <button class="qs-mode" data-m="pomodoro"><span class="qm-t">${ic('refresh')}Pomodoro</span><p>25-minute rounds with short breaks.</p></button>
            <button class="qs-mode" data-m="deep"><span class="qm-t">${ic('layers')}Deep work</span><p>A single long immersion session.</p></button>
          </div></div>
        <div><div class="fs-label">${ic('target')}Session goal <span style="text-transform:none;letter-spacing:0;color:var(--ink-4)">· optional</span></div>
          <input class="input" id="fGoal" maxlength="90" placeholder="e.g. Finish problem set 4, questions 1–10"></div>
        <div class="row gap10" style="justify-content:space-between;flex-wrap:wrap">
          <button class="btn btn-gold btn-sm" id="fBreak">${ic('coffee')} Short break (5 min)</button>
          <button class="btn btn-gold btn-sm" id="fLongBreak">${ic('moon')} Long break (15 min)</button>
          <span class="grow"></span>
          <button class="btn btn-ghost btn-sm" id="fSound">${ic(AmbientAudio.playing?'volume':'volume-off')} ${AmbientAudio.playing?'Ambient sound on':'Ambient sound off'}</button>
        </div>
      </div>
      <div style="display:flex;justify-content:center;margin-top:26px" data-reveal style="--d:.16s">
        <button class="btn btn-primary btn-lg" id="fGo" style="min-width:230px">${ic('play')} Begin focus</button>
      </div>
    </div>`;
    $$('.chip', el).forEach(c => c.onclick = () => { sel.subject = c.dataset.id; $$('.chip', el).forEach(x=>x.classList.toggle('on', x===c)); });
    $$('.qs-dur[data-d]', el).forEach(b => b.onclick = () => { sel.dur = +b.dataset.d; $$('.qs-dur', el).forEach(x=>x.classList.toggle('on', x===b)); $('#fRange',el).value = sel.dur; $('#fRangeV',el).textContent = sel.dur; });
    $('#fRange', el).oninput = e => { sel.dur = +e.target.value; $('#fRangeV',el).textContent = sel.dur; $$('.qs-dur', el).forEach(x=>x.classList.remove('on')); };
    $$('.qs-mode', el).forEach(b => b.onclick = () => { sel.mode = b.dataset.m; $$('.qs-mode', el).forEach(x=>x.classList.toggle('on', x===b)); });
    $('#fBreak', el).onclick = () => FocusEngine.standaloneBreak(5);
    $('#fLongBreak', el).onclick = () => FocusEngine.standaloneBreak(15);
    $('#fSound', el).onclick = () => { AmbientAudio.toggle(!AmbientAudio.playing); this.renderSetup(el); };
    $('#fGo', el).onclick = () => {
      sel.goal = $('#fGoal', el).value.trim();
      this._lastResult = null;
      FocusEngine.start({ subjectId: sel.subject, minutes: sel.dur, goal: sel.goal, mode: sel.mode });
    };
    Reveal.init(el);
  },

  /* ---------------- running ---------------- */
  renderRunning(el, snap){
    const isBreak = snap.phase !== 'work';
    const subj = Store.subject(snap.subjectId);
    const p = Store.state.profile;
    const size = 330, stroke = 13;
    el.innerHTML = `<div class="fs-running">
      <div class="fsr-subj">${isBreak
        ? `${ic('coffee')} <span>Break — breathe, stretch, look away from the screen</span>`
        : `<span class="sdot" style="width:10px;height:10px;color:${subj?.color};background:${subj?.color}"></span><span>${esc(subj?.name||'Focus')}</span>
           <span class="divider-dot"></span><span class="muted-2 small">${snap.mode === 'pomodoro' ? 'Pomodoro · round '+snap.cycle : snap.mode === 'deep' ? 'Deep work' : 'Classic'}</span>`}</div>
      ${snap.goal && !isBreak ? `<div class="fsr-goal">“${esc(snap.goal)}”</div>` : ''}
      <div class="fs-timer-wrap">
        ${Charts.ring({ size, stroke, pct: 0, num:'', sub:'', colors: isBreak ? ['#B08A34','#E5D5A8'] : ['#337354','#7FA98C'], cls:'big-ring' })}
        <span class="fs-time" id="fsTime">${fmtClock(snap.remain)}</span>
        <span class="fs-phase" id="fsPhase">${isBreak ? (snap.phase==='break-wait'?'next round soon':'break') : 'focusing'}</span>
      </div>
      <div class="fs-controls">
        <button class="fs-skip" id="fsReset" aria-label="Reset session" title="End without saving">${ic('reset')}</button>
        <button class="fs-play" id="fsPlay" aria-label="${snap.running?'Pause':'Resume'}">${ic(snap.running?'pause':'play')}</button>
        <button class="fs-skip" id="fsSkip" aria-label="Skip to next phase" title="Skip phase">${ic('skip')}</button>
      </div>
      <div class="fs-meta">
        <span class="fm-i">${ic('zap')}<span id="fsXp">+${snap.elapsedMin} XP</span></span>
        <span class="fm-i">${ic('target')}<span id="fsDaily">${Store.todayMinutes()} / ${p.dailyGoalMin} min today</span></span>
        <span class="fm-i">${ic('volume')}<button id="fsSound" style="font-weight:600" aria-label="Toggle ambient sound">${AmbientAudio.playing?'Sound on':'Sound off'}</button></span>
        <span class="fm-i" title="Press Space to pause or resume"><kbd style="font-size:10.5px;padding:2px 6px;border:1px solid var(--border);border-bottom-width:2px;border-radius:5px;background:var(--bg-2);color:var(--text-2)">Space</kbd> pause / resume</span>
      </div>
    </div>`;
    $('#fsPlay', el).onclick = () => { FocusEngine.running ? FocusEngine.pause() : FocusEngine.resume(); };
    $('#fsReset', el).onclick = () => {
      Modal.open({ title:'End this session?', body:`<p class="muted" style="font-size:13.5px">Time already studied this session will be logged.</p>`,
        footer:`<button class="btn btn-secondary" data-close>Keep going</button><button class="btn btn-danger" id="endOk">End session</button>`,
        onMount(m, api){ m.querySelector('[data-close]').onclick=()=>api.close(); m.querySelector('#endOk').onclick=()=>{ api.close(); FocusEngine.skip(); }; } });
    };
    $('#fsSkip', el).onclick = () => FocusEngine.skip();
    $('#fsSound', el).onclick = e => { AmbientAudio.toggle(!AmbientAudio.playing); e.currentTarget.textContent = AmbientAudio.playing?'Sound on':'Sound off'; };
    this.tick(FocusEngine.snapshot());
  },

  tick(snap){
    if (!snap) return;
    const t = $('#fsTime'); if (!t) return;
    t.textContent = fmtClock(snap.remain);
    const ring = $('.fs-timer-wrap .val');
    if (ring){
      const c = +ring.dataset.c || (2*Math.PI*(+ring.getAttribute('r')));
      ring.style.strokeDashoffset = c * (1 - clamp(snap.progress, 0, 1));
    }
    const xp = $('#fsXp'); if (xp) xp.textContent = '+' + Math.floor(snap.elapsedSec/60) + ' XP';
    const daily = $('#fsDaily'); if (daily) daily.textContent = `${Store.todayMinutes() + (snap.phase==='work'?Math.floor(snap.elapsedSec/60):0)} / ${Store.state.profile.dailyGoalMin} min today`;
    const play = $('#fsPlay'); if (play && play.dataset.locked !== '1'){ play.innerHTML = ic(snap.running?'pause':'play'); }
  },

  /* ---------------- complete ---------------- */
  renderComplete(el, res){
    const subj = res?.subject || Store.subject(FocusEngine.session?.subjectId);
    const minutes = res?.minutes || 0;
    const st = Store.streaks(), lvl = Store.level();
    el.innerHTML = `<div class="fs-complete">
      <div class="fc-badge">${ic('check')}</div>
      <h2>Focus session complete.</h2>
      <p class="fc-sub">${minutes >= 1
        ? `${fmtMin(minutes)} of ${esc(subj?.name||'focused work')}${res.goal?` — “${esc(res.goal)}”`:''}. That's the work that matters.`
        : 'Every session starts with the decision to begin. Try a longer one next time.'}</p>
      <div class="fs-stats">
        <div class="fs-stat"><span class="n" id="ccMin">0</span><span class="l">minutes</span></div>
        <div class="fs-stat"><span class="n" id="ccSess">${res.sessionsToday ?? Store.sessionsOn(D.today()).length}</span><span class="l">sessions today</span></div>
        <div class="fs-stat xp"><span class="n" id="ccXp">0</span><span class="l">xp earned</span></div>
      </div>
      <div style="max-width:420px;margin:0 auto 30px">
        <div class="pbar-label"><span>Daily goal</span><b>${Store.goalPct()}%</b></div>
        <div class="pbar lg"><i style="width:${Store.goalPct()}%"></i></div>
        <div class="row gap10" style="margin-top:12px;justify-content:center">
          <span class="badge badge-gold">${ic('flame')} ${st.current}-day streak</span>
          <span class="badge badge-green">${ic('award')} Level ${lvl.level} · ${lvl.title}</span>
        </div>
      </div>
      <div class="fs-actions">
        ${res.autoBreak ? `<button class="btn btn-gold" id="ccBreak">${ic('coffee')} Take your ${res.breakLen}-min break</button>` : ''}
        <button class="btn btn-primary" id="ccAgain">${ic('play')} Another session</button>
        <button class="btn btn-secondary" id="ccStats">${ic('chart')} View statistics</button>
      </div>
    </div>`;
    countUp($('#ccMin'), minutes, { fmt:v=>Math.round(v) });
    countUp($('#ccXp'), res.amount || 0, { fmt:v=>'+'+Math.round(v) });
    $('#ccAgain').onclick = () => { this._lastResult = null; this.renderSetup(el); };
    $('#ccStats').onclick = () => App.nav('stats');
    $('#ccBreak')?.addEventListener('click', () => { this._lastResult = null;
      if (FocusEngine.session?.phase === 'break-wait') FocusEngine.startBreak(res.breakLen); else FocusEngine.standaloneBreak(res.breakLen || 5); });
  },

  cleanup(){
    this._offs.forEach(off=>off()); this._offs = [];
    if (this._keyHandler){ document.removeEventListener('keydown', this._keyHandler); this._keyHandler = null; }
  },
  destroy(){ this.cleanup(); }
};
