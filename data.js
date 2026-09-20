/* ============================================================
   StudyOS — data.js
   Central store: persistence · seeded demo data · computed
   metrics · every mutation (features feed each other)
   ============================================================ */

const STORE_KEY = 'studyos:v2';

/* seeded RNG so demo data is consistent but dates always relative to today */
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

const SUBJECT_SEEDS = [
  { name:'Mathematics',       icon:'sigma',    color:'#2D6A4F', goal:300 },
  { name:'Physics',           icon:'atom',     color:'#3D6E77', goal:240 },
  { name:'Computer Science',  icon:'code',     color:'#46647E', goal:240 },
  { name:'Chemistry',         icon:'flask',    color:'#77784B', goal:180 },
  { name:'Biology',           icon:'dna',      color:'#5D8A54', goal:150 },
  { name:'English',           icon:'book-open',color:'#A06B3F', goal:120 },
];

const DAILY_THOUGHTS = [
  'Progress is rarely loud. Twenty quiet minutes today beats the plan you keep postponing.',
  'You do not need to feel ready to begin. Beginning is how readiness gets built.',
  'Review yesterday before starting something new — memory pays interest on repetition.',
  'One page, one problem, one paragraph. Start small enough that starting is easy.',
  'Rest is part of the work. A short walk often finishes the thinking you started.',
  'Attention is a muscle. Every uninterrupted session makes the next one easier.',
  'Difficult material is not a verdict on your ability — it is the sensation of learning.',
  'Study the confusion, not just the content. What you cannot explain is what to revisit.',
  'Consistency compounds. An hour daily outruns a heroic all-nighter, every single time.',
  'Close the loop: after each session, write one line about what you now understand.',
  'Your future self is watching. Give them something to thank you for — even twenty minutes.',
  'Do the hardest task while your mind is freshest. Guard that hour fiercely.',
  'Half of exam success is composure, and composure is built by practice under mild pressure.',
  'A clean desk is a head start. Clear the space, then clear the mind.',
  'Do not measure a day by how much you planned — measure it by what you truly understood.',
  'Little and often beats much and rarely. The brain prefers intervals to marathons.',
  'Finished is a skill. Practice completing small things and large things will follow.',
  'Ask better questions of yourself: not "did I study?" but "can I teach it?"',
];

const ACHIEVEMENTS = [
  { id:'first-session', name:'First Light',        icon:'sun-horizon', desc:'Complete your first focus session' },
  { id:'hours-10',      name:'Ten Hours In',       icon:'clock',       desc:'Study 10 total hours' },
  { id:'hours-50',      name:'Fifty Hours',        icon:'hourglass',   desc:'Study 50 total hours', hide:true },
  { id:'sessions-25',   name:'Rhythm',             icon:'timer',       desc:'Complete 25 focus sessions' },
  { id:'streak-3',      name:'Warming Up',         icon:'flame',       desc:'Reach a 3-day streak' },
  { id:'streak-7',      name:'Week Strong',        icon:'flame',       desc:'Reach a 7-day streak' },
  { id:'streak-30',     name:'Unbreakable',        icon:'shield',      desc:'Reach a 30-day streak' },
  { id:'early-bird',    name:'Early Bird',         icon:'sun',         desc:'Study before 8:00 AM' },
  { id:'night-owl',     name:'Night Scholar',      icon:'moon',        desc:'Study after 10:00 PM' },
  { id:'exam-ready',    name:'Exam Ready',         icon:'check-circle',desc:'Reach 100% preparation for an exam' },
  { id:'task-25',       name:'Taskmaster',         icon:'check-square',desc:'Complete 25 tasks' },
  { id:'well-rounded',  name:'Renaissance',        icon:'layers',      desc:'Study 5 different subjects' },
];

const CHALLENGE_POOL = [
  { id:'focus-60',   name:'Deep work — 60 minutes today', icon:'target', xp:80,  goal:60,  metric:'minutes' },
  { id:'sessions-2', name:'Complete 2 focus sessions',    icon:'timer',  xp:60,  goal:2,   metric:'sessions' },
  { id:'tasks-3',    name:'Complete 3 tasks',             icon:'check-square', xp:50, goal:3, metric:'tasks' },
  { id:'topics-2',   name:'Review 2 exam topics',         icon:'file-text', xp:40, goal:2, metric:'topics' },
  { id:'focus-90',   name:'Marathon — 90 minutes today',  icon:'flame',  xp:110, goal:90,  metric:'minutes' },
  { id:'any-subject',name:'Study 3 different subjects',   icon:'layers', xp:45,  goal:3,   metric:'subjects' },
];

const LEVEL_TITLES = ['Novice','Apprentice','Focused','Adept','Scholar','Specialist','Strategist','Sage','Master','Luminary','Paragon'];
const LEVEL_STEPS = [0, 250, 550, 900, 1350, 1850, 2450, 3150, 3950, 4850, 5850];
function levelInfo(xp){
  let lvl = 1; for (let i=1;i<LEVEL_STEPS.length;i++) if (xp >= LEVEL_STEPS[i]) lvl = i+1;
  const base = LEVEL_STEPS[lvl-1], next = LEVEL_STEPS[lvl] ?? base + 1200;
  return { level: lvl, title: LEVEL_TITLES[Math.min(lvl-1, LEVEL_TITLES.length-1)],
    into: xp - base, need: next - base, next, pct: Math.round(((xp - base)/(next - base))*100) };
}

const Store = {
  state: null, _mem: null,

  load(){
    let raw = null;
    try { raw = localStorage.getItem(STORE_KEY); } catch(e){ raw = this._mem; }
    if (raw){
      try { const p = JSON.parse(raw); if (p && p.version === 1){ this.state = p; return; } } catch(e){}
    }
    this.seedEmpty();
  },
  save(){
    const raw = JSON.stringify(this.state);
    try { localStorage.setItem(STORE_KEY, raw); } catch(e){ this._mem = raw; }
  },
  commit(){ this.save(); Bus.emit('store:change'); },
  reset(){ try{ localStorage.removeItem(STORE_KEY); }catch(e){} this.loadDemo(); },

  /* ---------------- seed ---------------- */
  seedContent(){  /* generates the showcase workspace content (dates relative to today) */
    const rnd = mulberry32(20260919);
    const pick = a => a[Math.floor(rnd()*a.length)];
    const today = D.today();
    const subjects = SUBJECT_SEEDS.map((s,i)=>({ id:'subj-'+(i+1), ...s, archived:false }));
    const subjWeights = [.26,.2,.18,.13,.12,.11];

    /* --- sessions across the last 28 days; guaranteed 9-day streak ending today --- */
    const sessions = [];
    const durs = [25,30,35,40,45,50,60,75,90];
    for (let back = 28; back >= 1; back--){
      const date = D.addDays(today, -back);
      const inStreak = back <= 8;                 /* yesterday..8 days ago: streak */
      const chance = inStreak ? 1 : (D.parse(date).getDay()===5 ? .45 : .78);
      if (rnd() > chance && !inStreak) continue;
      const n = inStreak ? (rnd() < .55 ? 2 : 1) : (rnd() < .3 ? 2 : 1);
      for (let s=0;s<n;s++){
        const r = rnd(); let acc = 0, si = 0;
        for (let i=0;i<subjWeights.length;i++){ acc += subjWeights[i]; if (r <= acc){ si = i; break; } }
        const hour = 15 + Math.floor(rnd()*7), min = pick([0,10,15,20,30,40,45]);
        sessions.push({ id:uid(), subjectId:subjects[si].id, date,
          startedAt:`${date}T${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`,
          durationMin: pick(durs), mode: pick(['pomodoro','deep','classic']) });
      }
    }
    /* today: one completed morning session (47 min Mathematics) */
    sessions.push({ id:uid(), subjectId:subjects[0].id, date:today, startedAt:`${today}T08:12`, durationMin:47, mode:'pomodoro' });

    const totalMin = sessions.reduce((a,s)=>a+s.durationMin,0);

    /* --- tasks --- */
    const T = (title, si, due, prio, tags, notes='', examIdx=null, done=false, doneAt=null)=>({
      id:uid(), title, subjectId:subjects[si].id, due, priority:prio, tags, notes, examId:examIdx!==null?('exam-'+(examIdx+1)):null,
      done, doneAt, createdAt:D.addDays(today,-Math.ceil(rnd()*8)) });
    const tasks = [
      T('Finish problem set 4 — integration by parts', 0, today, 3, ['revision','problem-set'], 'Questions 1–14, skip starred', 0),
      T('Read chapter 12 — electromagnetic induction', 1, D.addDays(today,1), 2, ['reading']),
      T('Chemistry lab report — titration analysis', 3, D.addDays(today,2), 3, ['lab','writing'], 'Include error analysis section'),
      T('Implement binary search tree + tests', 2, D.addDays(today,3), 2, ['project','code']),
      T('English essay outline — Gatsby symbolism', 5, D.addDays(today,4), 2, ['writing']),
      T('Draw & label plant cell diagrams', 4, D.addDays(today,5), 1, ['revision']),
      T('Past paper 2023 — Paper 1 (timed)', 0, D.addDays(today,9), 3, ['past-paper'], '90 minutes, no notes', 0),
      T('Summarize kinematics formulas on one page', 1, D.addDays(today,11), 1, ['summary'], '', 1),
      T('Flashcards: organic chemistry groups', 3, D.addDays(today,14), 1, ['memorization'], '', 2),
      T('Solve 10 problems — series convergence', 0, D.addDays(today,-1), 2, ['problem-set'], '', 0, true, `${D.addDays(today,-1)}T20:40`),
      T('Annotate poem for literature class', 5, D.addDays(today,-1), 1, ['reading'], '', null, true, `${D.addDays(today,-1)}T16:10`),
      T('CS: review recursion examples', 2, D.addDays(today,0), 1, ['revision'], '', null, true, `${today}T09:35`),
      T('Physics — redo incorrectly solved problems', 1, D.addDays(today,-2), 2, ['corrections'], '', 1, true, `${D.addDays(today,-2)}T19:00`),
      T('Biology quiz self-test — unit 2', 4, D.addDays(today,7), 2, ['self-test'], '', 2),
    ];

    /* --- exams --- */
    const E = (i, name, si, inDays, time, loc, notes, topics, doneN)=>({
      id:'exam-'+(i+1), name, subjectId:subjects[si].id, date:D.addDays(today,inDays), time, location:loc, notes,
      topics: topics.map((t,j)=>({ name:t, done:j<doneN })), createdAt:D.addDays(today,-20), history:[] });
    const exams = [
      E(0,'Final Exam',0,18,'08:00','Building 5, Hall C','Cumulative — weight 40%. Calculator allowed, one formula sheet.',[
        'Limits & continuity','Differentiation rules','Applications of derivatives','Integration techniques',
        'Definite integrals','Areas & volumes','Sequences','Series & convergence tests','Taylor polynomials',
        'Trigonometric integrals','Partial fractions','Integration by parts','Improper integrals','Differential equations',
        'Vector basics','Parametric equations','Polar coordinates','L’Hôpital’s rule','Optimization problems','Related rates'],12),
      E(1,'Midterm',1,26,'10:30','Science Auditorium','Chapters 8–14. Formula sheet provided.',[
        'Electrostatics','Electric fields','Gauss’s law','Electric potential','Capacitance','Current & resistance',
        'DC circuits','Magnetic fields','Ampère’s law','Faraday’s law','Inductance','AC circuits','EM waves','Optics basics',
        'Interference','Diffraction','Modern physics intro','Problem-solving workshop'],8),
      E(2,'Unit Quiz',4,5,'09:00','Room 204','Unit 2 — cell biology. Short answers + diagrams.',[
        'Cell structure','Membrane transport','Cell cycle','Mitosis','Meiosis','Enzymes','Cellular respiration',
        'Photosynthesis','DNA replication','Protein synthesis'],4),
      E(3,'Literature Essay',5,33,'13:00','Online submission','Comparative essay — 1,500 words.',[
        'Text selection','Thesis statement','Outline','First draft','Sources & quotes','Revision','Final proofread'],2),
    ];

    /* --- planner events --- */
    const V = (i, si, title, inDays, start, dur, prio, notes='')=>({
      id:'ev-'+(i+1), subjectId:subjects[si].id, title, date:D.addDays(today,inDays), start, durationMin:dur, priority:prio, notes });
    const events = [
      V(0,0,'Calculus revision — series',0,'17:00',60,2),
      V(1,1,'Physics past paper practice',1,'19:00',90,3,'Chapter 12 + 13 problems'),
      V(2,2,'BST implementation session',2,'20:00',75,2),
      V(8,4,'Cell diagrams practice',-2,'18:30',45,1,'Unit 2 — mitosis & meiosis'),
      V(9,3,'Titration calculations',-1,'17:00',50,2),
      V(3,0,'Math formulas deep review',3,'16:30',45,2),
      V(4,4,'Cell diagrams practice',4,'18:00',40,1),
      V(5,3,'Titration calculations',5,'17:30',50,2),
      V(6,0,'Mock exam — full paper',8,'09:00',180,3,'Silent room, timed'),
      V(7,1,'Electromagnetism summary',11,'19:30',60,1),
    ];

    /* --- notes --- */
    const notes_ = [
      { id:uid(), title:'Newton’s laws — quick summary', body:'**1st law** — inertia: objects keep their velocity unless a net force acts.\n**2nd law** — F = ma.\n**3rd law** — equal and opposite reactions.\nKey exam trap: normal force ≠ weight on an incline.', createdAt:D.addDays(today,-3), source:'manual' },
      { id:uid(), title:'Integration techniques — when to use what', body:'1. Try simple substitution first.\n2. By parts when you see a product (polynomial × exp/trig).\n3. Partial fractions for rational functions.\n4. Trig substitution for √(a² ± x²).', createdAt:D.addDays(today,-6), source:'manual' },
    ];

    /* --- battle / gamification --- */
    const doneCount = tasks.filter(t=>t.done).length;
    const unlocked = { 'first-session':D.addDays(today,-24), 'hours-10':D.addDays(today,-15), 'sessions-25':D.addDays(today,-6),
      'streak-3':D.addDays(today,-20), 'streak-7':D.addDays(today,-14), 'well-rounded':D.addDays(today,-10) };
    const xp = Math.round(totalMin * 0.9) + doneCount*10 + 130;

    return { subjects, sessions, tasks, exams, events: events.map(e=>({...e})), notes: notes_,
      battle: { xp, unlocked, claimedChallenges: {}, weeklyGoalMin: 600 } };
  },
  seed(){  /* full demo workspace — used by "Load demo" in Settings */
    const c = this.seedContent();
    this.state = {
      version: 1,
      profile: { name:'Salem', avatarIdx:0, avatarImg:null, dailyGoalMin:120, preferredSession:45, theme:'day',
        reduceMotion:false, chime:true, notifOff:false },
      ...c,
      tutor: { conversations: [], config: { baseUrl:'https://api.openai.com/v1', model:'gpt-4o-mini', apiKey:'' }, includeContext:true },
      meta: { seededAt: D.today(), mode: 'demo' }
    };
    this.save();
  },
  seedEmpty(){  /* every real user starts here: zero inputs, nothing made up */
    this.state = {
      version: 1,
      profile: { name:'', avatarIdx:0, avatarImg:null, dailyGoalMin:120, preferredSession:45, theme:'day',
        reduceMotion:false, chime:true, notifOff:false },
      subjects: [], sessions: [], tasks: [], exams: [], events: [], notes: [],
      battle: { xp:0, unlocked:{}, claimedChallenges:{}, weeklyGoalMin:600 },
      tutor: { conversations: [], config: { baseUrl:'https://api.openai.com/v1', model:'gpt-4o-mini', apiKey:'' }, includeContext:true },
      meta: { seededAt: D.today(), mode:'empty' }
    };
    this.save();
  },
  loadDemo(){  /* replace content with the sample workspace, keep the user's own profile & tutor settings */
    const profile = this.state ? { ...this.state.profile } : null;
    const tutor = this.state ? JSON.parse(JSON.stringify(this.state.tutor)) : null;
    this.seed();
    if (profile && Object.keys(profile).length) this.state.profile = profile;
    if (tutor) this.state.tutor = tutor;
    this.state.meta.mode = 'demo';
    this.commit();
  },
  startFresh(){  /* zero everything the user (or demo) entered; preferences stay */
    Object.assign(this.state, {
      subjects: [], sessions: [], tasks: [], exams: [], events: [], notes: [],
      battle: { xp:0, unlocked:{}, claimedChallenges:{}, weeklyGoalMin: this.state.battle?.weeklyGoalMin || 600 },
    });
    this.state.meta.mode = 'fresh';
    this.commit();
  },

  /* ---------------- lookups ---------------- */
  subject(id){ return this.state.subjects.find(s=>s.id===id); },
  exam(id){ return this.state.exams.find(e=>e.id===id); },
  task(id){ return this.state.tasks.find(t=>t.id===id); },
  event(id){ return this.state.events.find(e=>e.id===id); },
  note(id){ return this.state.notes.find(n=>n.id===id); },

  /* ---------------- computed ---------------- */
  sessionsOn(key){ return this.state.sessions.filter(s=>s.date===key); },
  minutesOn(key){ return this.sessionsOn(key).reduce((a,s)=>a+s.durationMin,0); },
  todayMinutes(){ return this.minutesOn(D.today()); },
  goalPct(){ return clamp(Math.round((this.todayMinutes() / this.state.profile.dailyGoalMin) * 100), 0, 100); },
  weekMinutes(offset=0){
    const start = D.addDays(D.startOfWeek(D.today()), offset*7); let sum = 0;
    for (let i=0;i<7;i++) sum += this.minutesOn(D.addDays(start,i));
    return sum;
  },
  streaks(){
    const days = new Set(this.state.sessions.map(s=>s.date));
    let current = 0; const t = D.today();
    if (days.has(t)) current = 1;
    let k = D.addDays(t,-1);
    while (days.has(k)){ current++; k = D.addDays(k,-1); }
    /* longest */
    const sorted = [...days].sort(); let longest = 0, run = 0, prev = null;
    for (const d of sorted){
      run = (prev && D.diffDays(d, prev) === 1) ? run+1 : 1;
      longest = Math.max(longest, run); prev = d;
    }
    return { current, longest: Math.max(longest, current) };
  },
  subjectStats(days=30){
    const from = D.addDays(D.today(), -(days-1));
    return this.state.subjects.map(s=>{
      const all = this.state.sessions.filter(x=>x.subjectId===s.id);
      const recent = all.filter(x=>x.date >= from);
      return { subject:s, totalMin:all.reduce((a,x)=>a+x.durationMin,0),
        weekMin:this.weekSubjectMin(s.id), recentMin:recent.reduce((a,x)=>a+x.durationMin,0), sessions:all.length };
    });
  },
  weekSubjectMin(sid){
    const start = D.startOfWeek(D.today()); let sum = 0;
    for (let i=0;i<7;i++){ const k = D.addDays(start,i);
      this.sessionsOn(k).forEach(s=>{ if (s.subjectId===sid) sum += s.durationMin; }); }
    return sum;
  },
  last30Days(){ const out=[]; for (let i=29;i>=0;i--){ const k=D.addDays(D.today(),-i); out.push({date:k, min:this.minutesOn(k), sessions:this.sessionsOn(k).length}); } return out; },
  examPrep(exam){ const total = exam.topics.length, done = exam.topics.filter(t=>t.done).length;
    return { total, done, pct: total ? Math.round(done/total*100) : 0 }; },
  upcomingExams(){ const t = D.today(); return this.state.exams.filter(e=>e.date>=t).sort((a,b)=>a.date.localeCompare(b.date)); },
  nextExam(){ return this.upcomingExams()[0] || null; },
  tasksDueToday(){ const t = D.today(); return this.state.tasks.filter(x=>!x.done && x.due===t); },
  openTasks(){ return this.state.tasks.filter(t=>!t.done); },
  level(){ return levelInfo(this.state.battle.xp); },
  dailyThought(){ const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 864e5);
    return DAILY_THOUGHTS[doy % DAILY_THOUGHTS.length]; },

  /* daily challenges: deterministic pick of 3, live progress */
  dailyChallenges(){
    const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 864e5);
    const pool = [...CHALLENGE_POOL];
    const chosen = [];
    for (let i=0;i<3;i++){ chosen.push(pool.splice((doy + i*2) % pool.length, 1)[0]); }
    const t = D.today(), todaySessions = this.sessionsOn(t);
    const progress = { minutes: this.minutesOn(t), sessions: todaySessions.length,
      tasks: this.state.tasks.filter(x=>x.done && x.doneAt && x.doneAt.startsWith(t)).length,
      topics: this.state.exams.reduce((a,e)=>a + (e.history||[]).filter(h=>h.date===t).length, 0),
      subjects: new Set(todaySessions.map(s=>s.subjectId)).size };
    const claimed = this.state.battle.claimedChallenges[t] || [];
    return chosen.map(c=>({ ...c, value: Math.min(progress[c.metric], c.goal),
      complete: progress[c.metric] >= c.goal, claimed: claimed.includes(c.id) }));
  },

  /* ---------------- insights for stats page ---------------- */
  insights(){
    const out = [];
    const thisW = this.weekMinutes(0), lastW = this.weekMinutes(-1);
    if (lastW > 0){
      const r = thisW/lastW;
      out.push({ icon: r>=1?'arrow-up-right':'arrow-right', text: r>=1
        ? `You studied <b>${Math.round((r-1)*100)}% more</b> this week than last week. Momentum is on your side.`
        : `This week is <b>${Math.round((1-r)*100)}% lighter</b> than last week — a good moment to plan one more session.` });
    } else if (thisW > 0){
      out.push({ icon:'sparkles', text:`You’ve logged <b>${fmtMin(thisW)}</b> of focused study this week.` });
    }
    const counts = {}; this.last30Days().forEach(d=>{ if (d.min>0){ const wd = D.parse(d.date).getDay(); counts[wd]=(counts[wd]||0)+1; } });
    const best = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
    if (best){ const names=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      out.push({ icon:'calendar', text:`Your most consistent study day is <b>${names[best[0]]}</b> — ${best[1]} sessions in the last 30 days landed there.` }); }
    const tops = [...this.subjectStats(30)].sort((a,b)=>b.recentMin-a.recentMin)[0];
    if (tops && tops.recentMin > 0) out.push({ icon: tops.subject.icon, text:`<b>${esc(tops.subject.name)}</b> is currently your most studied subject, with ${fmtMin(tops.recentMin)} in the last 30 days.` });
    const goalDays = this.last30Days().filter(d=>d.min >= this.state.profile.dailyGoalMin).length;
    out.push({ icon:'target', text:`You hit your daily goal on <b>${goalDays} of the last 30 days</b> (${Math.round(goalDays/30*100)}%).` });
    const st = this.streaks();
    if (st.current > 1) out.push({ icon:'flame', text:`You’re on a <b>${st.current}-day streak</b> — your longest ever is ${st.longest} days.` });
    const avg = (()=>{ const ss=this.state.sessions; return ss.length? Math.round(ss.reduce((a,s)=>a+s.durationMin,0)/ss.length):0; })();
    if (avg) out.push({ icon:'timer', text:`Your average session length is <b>${avg} minutes</b> — right in the sweet spot for deep focus.` });
    return out.slice(0,6);
  },

  /* ---------------- battle helpers ---------------- */
  addXP(amount, reason){
    const before = levelInfo(this.state.battle.xp).level;
    this.state.battle.xp += amount;
    const after = levelInfo(this.state.battle.xp).level;
    return { amount, levelUp: after > before ? after : null, reason };
  },
  checkAchievements(){
    const s = this.state, st = this.streaks(), totalMin = s.sessions.reduce((a,x)=>a+x.durationMin,0);
    const cond = {
      'first-session': s.sessions.length >= 1,
      'hours-10': totalMin >= 600, 'hours-50': totalMin >= 3000,
      'sessions-25': s.sessions.length >= 25,
      'streak-3': st.longest >= 3, 'streak-7': st.longest >= 7, 'streak-30': st.longest >= 30,
      'early-bird': s.sessions.some(x=>Number(x.startedAt.slice(11,13)) < 8),
      'night-owl': s.sessions.some(x=>Number(x.startedAt.slice(11,13)) >= 22),
      'exam-ready': s.exams.some(e=>this.examPrep(e).pct === 100),
      'task-25': s.tasks.filter(t=>t.done).length >= 25,
      'well-rounded': new Set(s.sessions.map(x=>x.subjectId)).size >= 5,
    };
    const newly = [];
    ACHIEVEMENTS.forEach(a=>{
      if (!s.battle.unlocked[a.id] && cond[a.id]){ s.battle.unlocked[a.id] = D.today(); newly.push(a); }
    });
    return newly;
  },

  /* ---------------- actions ---------------- */
  addSession({subjectId, durationMin, mode='classic', goal='', date=null, time=null}){
    const d = date || D.today();
    const t = time || D.nowTime();
    const streakBefore = this.streaks().current;
    this.state.sessions.push({ id:uid(), subjectId, date:d, startedAt:`${d}T${t}`, durationMin:Math.round(durationMin), mode, goal });
    const res = this.addXP(Math.round(durationMin), 'Focus session');
    const streak = this.streaks();
    const streakSecured = streak.current > streakBefore;
    const newAchievements = this.checkAchievements();
    this.commit();
    return { ...res, streak, streakSecured, newAchievements };
  },
  saveTask(t){
    if (t.id){ const i = this.state.tasks.findIndex(x=>x.id===t.id); if (i>-1) this.state.tasks[i] = {...this.state.tasks[i], ...t}; }
    else this.state.tasks.unshift({ ...t, id:uid(), done:false, doneAt:null, createdAt:D.today() });
    this.commit();
  },
  completeTask(id, done){
    const t = this.task(id); if (!t) return null;
    t.done = done; t.doneAt = done ? `${D.today()}T${D.nowTime()}` : null;
    let xp = null, levelUp = null;
    if (done){ const r = this.addXP(10,'Task completed'); xp = 10; levelUp = r.levelUp; }
    const newAchievements = done ? this.checkAchievements() : [];
    this.commit();
    return { xp, levelUp, newAchievements };
  },
  deleteTask(id){ this.state.tasks = this.state.tasks.filter(t=>t.id!==id); this.commit(); },
  saveExam(e){
    if (e.id){ const i = this.state.exams.findIndex(x=>x.id===e.id); if (i>-1) this.state.exams[i] = {...this.state.exams[i], ...e}; }
    else this.state.exams.push({ ...e, id:uid(), history:[], createdAt:D.today() });
    this.commit();
  },
  deleteExam(id){ this.state.exams = this.state.exams.filter(e=>e.id!==id); this.commit(); },
  toggleTopic(examId, idx){
    const e = this.exam(examId); if (!e) return;
    e.topics[idx].done = !e.topics[idx].done;
    if (e.topics[idx].done){
      e.history = e.history || []; e.history.push({ date:D.today(), topic:e.topics[idx].name });
      this.addXP(15, 'Topic reviewed');
    }
    const newAchievements = this.checkAchievements();
    this.commit();
    return { xp: e.topics[idx].done ? 15 : 0, newAchievements };
  },
  saveEvent(v){
    if (v.id){ const i = this.state.events.findIndex(x=>x.id===v.id); if (i>-1) this.state.events[i] = {...this.state.events[i], ...v}; }
    else this.state.events.push({ ...v, id:uid() });
    this.commit();
  },
  deleteEvent(id){ this.state.events = this.state.events.filter(e=>e.id!==id); this.commit(); },
  addNote(title, body, source='tutor'){ this.state.notes.unshift({ id:uid(), title, body, createdAt:D.today(), source }); this.commit(); },
  deleteNote(id){ this.state.notes = this.state.notes.filter(n=>n.id!==id); this.commit(); },
  claimChallenge(ch){
    const t = D.today();
    const claimed = this.state.battle.claimedChallenges[t] = this.state.battle.claimedChallenges[t] || [];
    if (claimed.includes(ch.id)) return null;
    claimed.push(ch.id);
    const res = this.addXP(ch.xp, 'Daily challenge');
    this.commit();
    return res;
  },
  saveSubject(s){
    if (s.id){ const i = this.state.subjects.findIndex(x=>x.id===s.id); if (i>-1) this.state.subjects[i] = {...this.state.subjects[i], ...s}; }
    else this.state.subjects.push({ ...s, id:uid(), archived:false });
    this.commit();
  },
  deleteSubject(id){
    this.state.subjects = this.state.subjects.filter(s=>s.id!==id);
    this.commit();
  },
  updateProfile(patch){ Object.assign(this.state.profile, patch); this.commit(); }
};
Store.load();
