/* ============================================================
   StudyOS — app.js
   Router · app shell · command palette · quick start · battle FX
   ============================================================ */

const NAV_ITEMS = [
  { id:'home',     label:'Home',        icon:'home',        group:'Study',   crumb:'Your day at a glance' },
  { id:'focus',    label:'Focus',       icon:'timer',       group:'Study',   crumb:'Deep, distraction-free sessions' },
  { id:'planner',  label:'Planner',     icon:'calendar',    group:'Study',   crumb:'Shape your study week' },
  { id:'tasks',    label:'Tasks',       icon:'check-square',group:'Study',   crumb:'Everything that needs doing' },
  { id:'exams',    label:'Exams',       icon:'file-text',   group:'Prepare', crumb:'Countdown to confident' },
  { id:'subjects', label:'Subjects',    icon:'book',        group:'Prepare', crumb:'Your six lines of progress' },
  { id:'stats',    label:'Statistics',  icon:'chart',       group:'Grow',    crumb:'Insights from your studying' },
  { id:'tutor',    label:'AI Tutor',    icon:'sparkles',    group:'Grow',    crumb:'A tutor that knows your context' },
  { id:'battle',   label:'Study Battle',icon:'swords',      group:'Grow',    crumb:'XP, streaks and challenges' },
  { id:'settings', label:'Settings',    icon:'settings',    group:'Account', crumb:'Profile & preferences' },
];

const App = {
  view: null, viewCleanup: null, shellBuilt: false, currentRoute: '',

  boot(){
    /* theme + motion prefs */
    const p = Store.state.profile;
    document.documentElement.dataset.theme = p.theme || 'day';
    if (p.reduceMotion) document.documentElement.classList.add('reduce-motion');
    if (!$('#toasts')){ const t = document.createElement('div'); t.id = 'toasts'; document.body.appendChild(t); }
    addEventListener('hashchange', () => this.route());
    this.route();
    Bus.on('store:change', () => this.refreshChrome());
    Bus.on('focus:tick', snap => {
      if (this.currentRoute !== 'focus' && snap) this.updatePill(snap);
      if (snap && snap.phase === 'work') document.title = `${fmtClock(snap.remain)} · ${Store.subject(snap.subjectId)?.name || 'Focus'} — StudyOS`;
      else document.title = 'StudyOS — Make studying feel beautiful';
    });
    Bus.on('focus:state', snap => {
      if (!snap){ this.killPill(); document.title = 'StudyOS — Make studying feel beautiful'; }
    });
    Bus.on('focus:complete', res => this.onSessionComplete(res));
    this.checkChallenges();
  },

  /* ---------------- router ---------------- */
  route(){
    Modal.closeAll();
    const raw = location.hash.replace(/^#\/?/, '');
    const [name, ...rest] = raw.split('/');
    const params = rest.join('/');
    if (!name){ this.renderLanding(); return; }
    const view = Views[name] ? name : 'home';
    if (!this.shellBuilt || this.view === null) this.buildShell();
    this.mountView(view, params);
  },
  nav(path){ if (location.hash === '#/' + path) this.route(); else location.hash = '#/' + path; },

  renderLanding(){
    this.view = null; this.viewCleanup && this.viewCleanup(); this.viewCleanup = null;
    this.killPill();
    document.title = 'StudyOS — Make studying feel beautiful';
    const app = $('#app'); app.innerHTML = '';
    this.landingCleanup = Landing.render(app) || null;
    window.scrollTo(0, 0);
  },

  buildShell(){
    const app = $('#app');
    if (this.landingCleanup){ this.landingCleanup(); this.landingCleanup = null; }
    app.innerHTML = `<div class="app">
      <aside class="sidebar" id="sidebar" aria-label="Main navigation"></aside>
      <div class="main">
        <header class="topbar" id="topbar"></header>
        <div class="content" id="content" tabindex="-1"></div>
      </div>
      <nav class="mobile-bar" id="mobileBar" aria-label="Mobile navigation"></nav>
    </div>
    <div class="drawer-overlay" id="drawerOverlay" hidden></div>
    <div class="drawer" id="drawer" hidden></div>`;
    this.shellBuilt = true;
    this.view = '';
    onscroll = () => $('#topbar')?.classList.toggle('scrolled', scrollY > 8);
    $('#drawerOverlay').onclick = () => this.toggleDrawer(false);
  },

  mountView(name, params=''){
    this.viewCleanup && this.viewCleanup(); this.viewCleanup = null;
    this.currentRoute = name;
    this.view = name;
    const v = Views[name]; if (!v) return;
    if (!this._welcomed){
      this._welcomed = true;
      const isEmpty = !Store.state.subjects.length && !Store.state.sessions.length;
      setTimeout(()=>Toast.show({ title:'Welcome to StudyOS', icon:'sprout', tone:'success',
        desc: isEmpty ? 'Your workspace starts clean — add subjects, then begin your first session.'
                      : 'A sample workspace is loaded — everything is real and editable. Make it yours in Settings.',
        duration:6500 }), 900);
    }
    this.renderSidebar(name);
    this.renderTopbar(v);
    this.renderMobileBar(name);
    const content = $('#content');
    content.innerHTML = `<div class="view" id="viewRoot"></div>`;
    const root = $('#viewRoot');
    v.render(root, params);
    if (v.destroy) this.viewCleanup = () => v.destroy();
    window.scrollTo(0, 0);
    Reveal.init(root);
    this.toggleDrawer(false);
    this.refreshChrome();
  },

  /* ---------------- chrome ---------------- */
  renderSidebar(active){
    const p = Store.state.profile, lvl = Store.level();
    const dueToday = Store.tasksDueToday().length;
    const groups = {};
    NAV_ITEMS.forEach(n => { (groups[n.group] = groups[n.group] || []).push(n); });
    $('#sidebar').innerHTML = `
      <div class="sb-logo"><span class="logo-mark">${ic('book-open')}</span>StudyOS<span class="sb-ver">v1.0</span></div>
      <div class="sb-scroll">${Object.entries(groups).map(([g, items]) => `
        <div class="sb-group">${g}</div>
        ${items.map(n => `
          <a class="sb-item ${n.id===active?'on':''}" href="#/${n.id}" ${n.id===active?'aria-current="page"':''}>
            ${ic(n.icon)}<span>${n.label}</span>
            ${n.id==='tasks' && dueToday ? `<span class="sb-badge">${dueToday}</span>` : ''}
          </a>`).join('')}`).join('')}
      </div>
      <button class="sb-user" id="sbUser" aria-label="Open settings">
        <span class="avatar">${p.avatarImg ? `<img src="${p.avatarImg}" alt="">` : (p.name ? esc(p.name.slice(0,1).toUpperCase()) : ic('user'))}</span>
        <span class="grow" style="min-width:0"><span class="su-name">${esc(p.name || 'New student')}</span>
        <span class="su-sub">${ic('zap')} Level ${lvl.level} · ${lvl.title}</span></span>
        ${ic('chevron-right','arrow')}
      </button>`;
    $('#sbUser').onclick = () => this.nav('settings');
  },

  renderTopbar(v){
    const p = Store.state.profile, st = Store.streaks();
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    $('#topbar').innerHTML = `
      <button class="icon-btn show-mobile" id="tbMenu" aria-label="Open menu">${ic('menu')}</button>
      <div class="tb-title"><h1>${v.title}</h1><span class="tb-crumb">${v.crumb || ''}</span></div>
      <div class="tb-right">
        <button class="tb-search" id="tbSearch" aria-label="Search">${ic('search')}<span>Search…</span><kbd>${isMac ? '⌘K' : 'Ctrl K'}</kbd></button>
        <button class="tb-chip gold" id="tbStreak" title="Current study streak">${ic('flame')}<span class="tb-chip-label">${st.current}</span></button>
        <button class="tb-chip" id="tbTheme" title="Toggle evening theme" aria-label="Toggle theme">${ic(document.documentElement.dataset.theme==='evening'?'sun':'moon')}</button>
        <button class="avatar" id="tbAvatar" style="width:37px;height:37px" aria-label="Open settings">${p.avatarImg ? `<img src="${p.avatarImg}" alt="">` : (p.name ? esc(p.name.slice(0,1).toUpperCase()) : ic('user'))}</button>
      </div>`;
    $('#tbSearch').onclick = () => Palette.open();
    $('#tbStreak').onclick = () => this.nav('battle');
    $('#tbTheme').onclick = () => this.toggleTheme();
    $('#tbAvatar').onclick = () => this.nav('settings');
    $('#tbMenu').onclick = () => this.toggleDrawer(true);
  },

  renderMobileBar(active){
    const items = [
      { id:'home', label:'Home', icon:'home' }, { id:'planner', label:'Plan', icon:'calendar' },
      { id:'focus', label:'Focus', icon:'timer', center:true },
      { id:'tasks', label:'Tasks', icon:'check-square' }, { id:'more', label:'More', icon:'dots' },
    ];
    $('#mobileBar').innerHTML = `<div class="mb-in">${items.map(i => i.center
      ? `<a href="#/focus" class="${active==='focus'?'on':''}" style="margin-top:-16px"><span style="width:48px;height:48px;border-radius:50%;background:var(--g-700);color:var(--on-g);display:grid;place-items:center;box-shadow:var(--sh-glow)">${ic('timer')}</span><span style="color:var(--ink-2)">${i.label}</span></a>`
      : `<a href="#/${i.id==='more'?'settings':i.id}" class="${i.id==='more' ? (['exams','subjects','stats','tutor','battle','settings'].includes(active)?'on':'') : (active===i.id?'on':'')}">${ic(i.icon)}<span>${i.label}</span></a>`).join('')}</div>`;
  },

  toggleDrawer(open){
    const d = $('#drawer'), ov = $('#drawerOverlay');
    if (!d) return;
    if (open){
      const groups = {}; NAV_ITEMS.forEach(n => { (groups[n.group] = groups[n.group] || []).push(n); });
      d.innerHTML = `<div class="sb-logo" style="padding-left:6px"><span class="logo-mark">${ic('book-open')}</span>StudyOS</div>
        ${Object.entries(groups).map(([g, items]) => `<div class="sb-group">${g}</div>
          ${items.map(n => `<a class="sb-item ${n.id===this.currentRoute?'on':''}" href="#/${n.id}">${ic(n.icon)}<span>${n.label}</span></a>`).join('')}`).join('')}`;
      d.hidden = false; ov.hidden = false;
    } else { d.hidden = true; ov.hidden = true; }
  },

  refreshChrome(){
    if (!this.shellBuilt || !this.view) return;
    const st = Store.streaks(), lvl = Store.level(), due = Store.tasksDueToday().length;
    const streakEl = $('#tbStreak .tb-chip-label'); if (streakEl) streakEl.textContent = st.current;
    $$('#sidebar .sb-item').forEach(a => {
      const id = a.getAttribute('href').slice(2);
      a.classList.toggle('on', id === this.currentRoute);
      if (id === 'tasks'){ const b = a.querySelector('.sb-badge');
        if (due){ if (!b){ a.insertAdjacentHTML('beforeend', `<span class="sb-badge">${due}</span>`); } else b.textContent = due; }
        else if (b) b.remove(); }
    });
    this.checkChallenges();
  },

  toggleTheme(){
    const next = document.documentElement.dataset.theme === 'evening' ? 'day' : 'evening';
    document.documentElement.dataset.theme = next;
    Store.updateProfile({ theme: next });
    Toast.show({ title: next === 'evening' ? 'Evening theme on' : 'Day theme on', icon:'moon', tone:'info', duration:2200 });
  },

  /* ---------------- running session pill ---------------- */
  updatePill(snap){
    let pill = $('#focusPill');
    if (!pill){
      document.body.insertAdjacentHTML('beforeend',
        `<button class="focus-pill" id="focusPill"><span class="fp-dot"></span>
         <span class="fp-time" id="fpTime"></span><span class="fp-go" id="fpGo">${ic('arrow-right')}</span></button>`);
      pill = $('#focusPill');
      pill.onclick = () => this.nav('focus');
    }
    const subj = Store.subject(snap.subjectId);
    $('#fpTime').textContent = (snap.phase==='break' ? 'Break · ' : (subj?.name || 'Focus') + ' · ') + fmtClock(snap.remain);
    pill.classList.toggle('paused', !snap.running);
  },
  killPill(){ $('#focusPill')?.remove(); },

  /* ---------------- battle effects ---------------- */
  onSessionComplete(res){
    if (res && res.amount >= 1){
      Toast.show({ title:`+${res.amount} XP`, desc:`${fmtMin(res.minutes)} focus session logged${res.subject ? ' — ' + res.subject.name : ''}`, tone:'xp', duration:3600 });
      if (res.streakSecured) setTimeout(()=>Toast.show({ title:`Streak secured`, desc:`Day ${res.streak.current} — keep the chain alive`, tone:'gold', icon:'flame', duration:4200 }), 700);
    }
    if (res?.levelUp) setTimeout(() => BattleFX.levelUp(res.levelUp), 900);
    if (res?.newAchievements?.length) BattleFX.notifyAchievements(res.newAchievements);
    if (res) Confetti.burst(innerWidth/2, innerHeight*0.35, 60);
  },
  checkChallenges(){
    let done = false;
    Store.dailyChallenges().forEach(ch => {
      if (ch.complete && !ch.claimed){
        const r = Store.claimChallenge(ch);
        if (r){ done = true;
          setTimeout(()=>{ Toast.show({ title:`Challenge complete — +${ch.xp} XP`, desc:ch.name, tone:'gold', icon:'award' });
            Confetti.burst(innerWidth - 180, innerHeight - 120, 34); }, 600);
          if (r.levelUp) setTimeout(()=>BattleFX.levelUp(r.levelUp), 1400);
        }
      }
    });
  }
};

/* ============================================================
   Battle FX — level-up + achievement modals
   ============================================================ */
const BattleFX = {
  achQueue: [], showing: false,
  notifyAchievements(list){
    this.achQueue.push(...list);
    if (!this.showing) this.nextAch();
  },
  nextAch(){
    const a = this.achQueue.shift();
    if (!a){ this.showing = false; return; }
    this.showing = true;
    AmbientAudio.chime('level');
    Confetti.burst(innerWidth/2, innerHeight*0.4, 90);
    const m = Modal.open({
      title: 'Achievement unlocked',
      body: `<div style="display:flex;flex-direction:column;align-items:center;gap:18px;padding:16px 4px 8px;text-align:center">
        <div class="medal on" style="width:110px;height:110px;border-radius:26px">${ic(a.icon,'m-ic')}</div>
        <div><h3 style="font-size:24px" class="title-lg">${esc(a.name)}</h3>
        <p class="muted small" style="margin-top:5px">${esc(a.desc)}</p></div>
        <span class="badge badge-gold">${ic('zap')} +100 XP</span>
      </div>`,
      footer: `<button class="btn btn-primary" id="achOk">Beautiful</button>`,
      onMount(el, api){ el.querySelector('#achOk').onclick = () => { api.close(); }; },
    });
    setTimeout(()=>{ /* auto-advance queue when closed */
      const check = setInterval(()=>{ if (!Modal.stack.includes(m)){ clearInterval(check); BattleFX.nextAch(); } }, 300);
    }, 400);
  },
  levelUp(level){
    AmbientAudio.chime('level');
    Confetti.burst(innerWidth/2, innerHeight*0.35, 110);
    const lvl = levelInfo(Store.state.battle.xp);
    Modal.open({
      title: '',
      body: `<div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:12px 4px 6px;text-align:center">
        ${Charts.ring({ size:150, stroke:10, pct:100, num:String(level), sub:'LEVEL', colors:['#B08A34','#E5D5A8'] })}
        <div><h3 style="font-size:26px" class="title-lg">Level ${level} — ${lvl.title}</h3>
        <p class="muted small" style="margin-top:5px">Your focus is compounding. Keep the rhythm.</p></div>
      </div>`,
      footer: `<button class="btn btn-primary" id="luOk">Keep going</button>`,
      onMount(el, api){ el.querySelector('#luOk').onclick = () => api.close(); Charts.ringTick(el); },
    });
  }
};

/* ============================================================
   Command palette
   ============================================================ */
const Palette = {
  open(){ this.build(); },
  build(){
    const ov = document.createElement('div');
    ov.className = 'palette-overlay'; ov.id = 'paletteOv';
    ov.innerHTML = `<div class="palette" role="dialog" aria-label="Command palette">
      <div class="palette-in">${ic('search')}<input id="palInput" placeholder="Search subjects, tasks, exams, notes… or type a command" autocomplete="off"></div>
      <div class="palette-list" id="palList"></div>
      <div class="palette-foot"><span><kbd>↑↓</kbd> navigate</span><span><kbd>↵</kbd> select</span><span><kbd>esc</kbd> close</span></div>
    </div>`;
    $('#overlays').appendChild(ov);
    const input = $('#palInput'), list = $('#palList');
    let items = [], active = 0;
    const close = () => ov.remove();
    ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
    document.addEventListener('keydown', function esc(e){ if (e.key === 'Escape'){ close(); document.removeEventListener('keydown', esc); } });

    const actions = [
      { t:'Start a focus session', s:'Quick start', icon:'timer', run:()=>App.nav('focus') },
      { t:'Add a task', s:'Tasks', icon:'plus', run:()=>{ App.nav('tasks'); setTimeout(()=>TasksUI.open(), 250); } },
      { t:'Add an exam', s:'Exams', icon:'calendar-plus', run:()=>{ App.nav('exams'); setTimeout(()=>ExamsUI.open(), 250); } },
      { t:'Plan a study block', s:'Planner', icon:'calendar-plus', run:()=>{ App.nav('planner'); setTimeout(()=>PlannerUI.open(), 250); } },
      { t:'Ask the AI tutor', s:'Tutor', icon:'sparkles', run:()=>App.nav('tutor') },
      { t:'View statistics', s:'Insights', icon:'chart', run:()=>App.nav('stats') },
      { t:'Study Battle', s:'XP & challenges', icon:'swords', run:()=>App.nav('battle') },
      { t: (document.documentElement.dataset.theme==='evening'?'Switch to day theme':'Switch to evening theme'), s:'Appearance', icon:'moon', run:()=>App.toggleTheme() },
    ];
    const data = [
      ...Store.state.subjects.map(s => ({ t:s.name, s:'Subject · '+fmtMin(Store.weekSubjectMin(s.id))+' this week', icon:s.icon, run:()=>App.nav('subjects/'+s.id) })),
      ...Store.state.tasks.filter(t=>!t.done).slice(0,30).map(t => ({ t:t.title, s:'Task · due '+D.relTime(t.due), icon:'check-square', run:()=>App.nav('tasks') })),
      ...Store.upcomingExams().map(e => ({ t:e.name + ' — ' + Store.subject(e.subjectId)?.name, s:'Exam · '+D.relTime(e.date), icon:'file-text', run:()=>App.nav('exams/'+e.id) })),
      ...Store.state.notes.map(n => ({ t:n.title, s:'Note · ' + D.fmtShort(n.createdAt), icon:'notebook', run:()=>NotesUI.open(n.id) })),
      ...Store.state.sessions.slice(-8).reverse().map(x => ({ t:fmtMin(x.durationMin)+' · '+ (Store.subject(x.subjectId)?.name||''), s:'Session · '+D.fmtMedium(x.date), icon:'timer', run:()=>App.nav('stats') })),
    ];

    function score(q, text){
      q = q.toLowerCase(); text = text.toLowerCase();
      if (!q) return 1;
      if (text.includes(q)) return 100 - text.indexOf(q);
      let i = 0, sc = 0;
      for (const ch of text){ if (ch === q[i]){ i++; sc += 2; } if (i === q.length) return sc; }
      return i === q.length ? sc : 0;
    }
    function hi(text, q){
      if (!q) return esc(text);
      const idx = text.toLowerCase().indexOf(q.toLowerCase());
      if (idx < 0) return esc(text);
      return esc(text.slice(0,idx)) + '<mark>' + esc(text.slice(idx, idx+q.length)) + '</mark>' + esc(text.slice(idx+q.length));
    }
    function render(q){
      const acts = q ? actions.filter(a => score(q, a.t) > 0) : actions;
      const ds = data.map(d => ({ ...d, _s: score(q, d.t) })).filter(d => d._s > 0).sort((a,b)=>b._s-a._s).slice(0, 7);
      items = [ ...acts.map(a=>({...a, kind:'Action'})), ...ds ];
      active = clamp(active, 0, Math.max(0, items.length-1));
      if (!items.length){ list.innerHTML = `<div class="palette-empty">Nothing found for “${esc(q)}”</div>`; return; }
      let html = '';
      if (acts.length){ html += `<div class="palette-group">Quick actions</div>` +
        acts.map((a,i)=>item(a,i,q)).join(''); }
      if (ds.length){ html += `<div class="palette-group">Your workspace</div>` + ds.map((d,i)=>item(d, acts.length+i, q)).join(''); }
      list.innerHTML = html;
      $$('.palette-item', list).forEach(el => {
        el.onmouseenter = () => { active = +el.dataset.i; paint(); };
        el.onclick = () => { items[+el.dataset.i].run(); close(); };
      });
    }
    function item(a, i, q){ return `<div class="palette-item ${i===active?'on':''}" data-i="${i}">${ic(a.icon)}<span class="pl-t">${hi(a.t,q)}</span><span class="pl-s">${esc(a.s||'')}</span></div>`; }
    function paint(){ $$('.palette-item', list).forEach(el => el.classList.toggle('on', +el.dataset.i === active)); }

    input.oninput = () => { active = 0; render(input.value.trim()); };
    input.onkeydown = e => {
      if (e.key === 'ArrowDown'){ e.preventDefault(); active = Math.min(items.length-1, active+1); paint(); scrollPal(); }
      if (e.key === 'ArrowUp'){ e.preventDefault(); active = Math.max(0, active-1); paint(); scrollPal(); }
      if (e.key === 'Enter' && items[active]){ items[active].run(); close(); }
    };
    function scrollPal(){ $(`.palette-item[data-i="${active}"]`, list)?.scrollIntoView({ block:'nearest' }); }
    render('');
    setTimeout(()=>input.focus(), 40);
  }
};
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); $('#paletteOv') ? $('#paletteOv').remove() : Palette.open(); }
  else if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')){ e.preventDefault(); Palette.open(); }
});

/* ============================================================
   Quick start modal (shared by Home, Focus, Planner, palette)
   ============================================================ */
function subjectsGuardModal(reopen){
  Modal.open({
    title: 'Add a subject first',
    body: `<div class="empty" style="padding:28px 10px">
      <span class="e-ic">${ic('sprout')}</span>
      <h4>Studying in StudyOS is organized by subject</h4>
      <p>Add your first subject — Mathematics, Physics, anything you're taking — and focus sessions, tasks and exams will connect to it.</p>
    </div>`,
    footer: `<button class="btn btn-secondary" data-close>Not now</button>
      <button class="btn btn-primary" id="sgAdd">${ic('plus')} Add subject</button>`,
    onMount(el, api){
      el.querySelector('[data-close]').onclick = () => api.close();
      $('#sgAdd', el).onclick = () => {
        api.close();
        SubjectUI.open(null, { onSaved: reopen });
      };
    }
  });
}

function quickStartModal(prefill = {}){
  const p = Store.state.profile;
  const subjects = Store.state.subjects.filter(s=>!s.archived);
  if (!subjects.length){ return subjectsGuardModal(() => quickStartModal(prefill)); }
  const sel = { subject: prefill.subjectId || subjects[0]?.id, dur: prefill.minutes || p.preferredSession || 45, mode: 'classic', goal: prefill.goal || '' };
  const durs = [25, 45, 50, 90];
  const modes = [
    { id:'classic', t:'Classic', d:'One focused block, no interruptions', icon:'timer' },
    { id:'pomodoro', t:'Pomodoro', d:'25-min rounds with short breaks', icon:'refresh' },
    { id:'deep', t:'Deep work', d:'A single long immersion session', icon:'layers' },
  ];
  const m = Modal.open({
    title: 'Start studying',
    body: `
      <div class="field"><label>Subject</label>
        <div class="fs-subjects" id="qsSubjs">${subjects.map(s=>`<button class="chip subj-chip ${s.id===sel.subject?'on':''}" data-id="${s.id}"><span class="sdot" style="color:${s.color};background:${s.color}"></span>${esc(s.name)}</button>`).join('')}</div></div>
      <div class="field"><label>Duration</label>
        <div class="qs-durs" id="qsDurs">${durs.map(d=>`<button class="qs-dur ${d===sel.dur?'on':''}" data-d="${d}"><div class="qd-n">${d}</div><div class="qd-l">min</div></button>`).join('')}
        <div class="qs-dur" id="qsCustom" style="grid-column:span 4"><input type="range" min="10" max="120" step="5" value="${sel.dur}" id="qsRange" aria-label="Custom duration"><div class="qd-l"><span id="qsRangeV">${sel.dur}</span> min — slide to adjust</div></div></div></div>
      <div class="field"><label>Focus mode</label>
        <div class="qs-modes" id="qsModes">${modes.map(mm=>`<button class="qs-mode ${mm.id===sel.mode?'on':''}" data-m="${mm.id}"><span class="qm-t">${ic(mm.icon)} ${mm.t}</span><p>${mm.d}</p></button>`).join('')}</div></div>
      <div class="field"><label>Session goal <span style="text-transform:none;letter-spacing:0;color:var(--ink-4)">(optional)</span></label>
        <input class="input" id="qsGoal" maxlength="90" placeholder="e.g. Finish problem set 4, questions 1–10"></div>`,
    footer: `<button class="btn btn-secondary" data-close>Cancel</button>
      <button class="btn btn-primary" id="qsGo">${ic('play')} Begin focus</button>`,
    onMount(el, api){
      $$('.chip', el).forEach(c => c.onclick = () => { sel.subject = c.dataset.id; $$('.chip', el).forEach(x=>x.classList.toggle('on', x===c)); });
      $$('.qs-dur[data-d]', el).forEach(b => b.onclick = () => { sel.dur = +b.dataset.d; $$('.qs-dur', el).forEach(x=>x.classList.toggle('on', x===b)); $('#qsRange', el).value = sel.dur; $('#qsRangeV', el).textContent = sel.dur; });
      $('#qsRange', el).oninput = e => { sel.dur = +e.target.value; $('#qsRangeV', el).textContent = sel.dur; $$('.qs-dur', el).forEach(x=>x.classList.remove('on')); };
      $$('.qs-mode', el).forEach(b => b.onclick = () => { sel.mode = b.dataset.m; $$('.qs-mode', el).forEach(x=>x.classList.toggle('on', x===b)); });
      el.querySelector('[data-close]').onclick = () => api.close();
      $('#qsGo', el).onclick = () => {
        sel.goal = $('#qsGoal', el).value.trim();
        api.close();
        App.nav('focus');
        setTimeout(()=>{
          FocusEngine.start({ subjectId: sel.subject, minutes: sel.mode==='pomodoro' ? Math.min(sel.dur, 50) : sel.dur, goal: sel.goal, mode: sel.mode });
        }, 200);
      };
    }
  });
  return m;
}
