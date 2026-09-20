/* ============================================================
   StudyOS — landing.js
   Marketing experience with scroll narrative + product mockups.
   Deliberately decoupled from the real Store: the numbers below
   are a fixed sample workspace, because the app itself now starts
   empty — nothing is seeded for a new visitor.
   ============================================================ */

const Landing = (() => {

  /* Static sample shown on this page only — never written to the Store */
  const SAMPLE = {
    streak: { current: 9, longest: 21 },
    todayMin: 47,
    totalMin: 4820,
    sessions: 103,
    examDays: 18,
    examSubject: 'Mathematics',
    examName: 'Final Exam',
    examPrep: { pct: 45, done: 9, total: 20 },
    lvl: { level: 5, title: 'Scholar', pct: 62, into: 310, need: 500 },
    xp: 2310,
    weekValues: [35, 80, 120, 45, 95, 60, 47],
    subjects: [
      { name: 'Mathematics', min: 420, color: '#2D6A4F' },
      { name: 'Physics', min: 300, color: '#3D6E77' },
      { name: 'Computer Science', min: 240, color: '#77784B' },
      { name: 'Chemistry', min: 150, color: '#A06B3F' },
      { name: 'Biology', min: 120, color: '#7C5A7E' },
    ],
    challenges: [
      { icon: 'timer', name: 'Focus 90 minutes today', value: 47, goal: 90, xp: 40 },
      { icon: 'check-square', name: 'Complete 2 tasks', value: 1, goal: 2, xp: 30 },
      { icon: 'book-open', name: 'Study 2 subjects', value: 2, goal: 2, xp: 35, complete: true },
    ],
    topics: [
      { name: 'Integration techniques', done: true },
      { name: 'Sequences & series', done: true },
      { name: 'Taylor expansions', done: true },
      { name: 'Differential equations', done: false },
      { name: 'Linear algebra review', done: false },
    ],
  };

  function navHTML(){
    const links = [['Focus','focus'],['Plan','planner'],['Prepare','exams'],['Learn','tutor'],['Insights','stats']];
    return `<nav class="l-nav" id="lNav"><div class="l-progress" id="lProgress"></div><div class="l-nav-in">
      <a class="l-logo" href="#/" data-link><span class="logo-mark">${ic('book-open')}</span>StudyOS</a>
      <div class="l-nav-links">${links.map(([l,id])=>`<a data-target="sec-${id}">${l}</a>`).join('')}</div>
      <div class="nav-cta">
        <a class="btn btn-secondary btn-sm hide-mobile" data-target="sec-focus">Take a tour</a>
        <a class="btn btn-primary btn-sm" data-link href="#/home">Open StudyOS</a>
        <button class="icon-btn show-mobile" id="lMenuBtn" aria-label="Menu">${ic('menu')}</button>
      </div>
    </div>
    <div class="menu l-menu show-mobile" id="lMenu" hidden style="position:fixed;top:64px;right:16px">
      ${links.map(([l,id])=>`<button data-target="sec-${id}">${l}</button>`).join('')}
      <div class="m-sep"></div><button data-link data-href="#/home">Open StudyOS</button>
    </div></nav>`;
  }

  function heroHTML(){
    const days = SAMPLE.examDays;
    return `<header class="hero"><div class="wrap-wide"><div class="hero-grid">
      <div class="hero-copy">
        <span class="hero-eyebrow"><span class="pulse-dot"></span>A calm operating system for studying</span>
        <h1 class="display-1">
          <span class="h-line"><span style="--d:.1s">Study smarter.</span></span>
          <span class="h-line"><span style="--d:.22s" class="serif-i">Focus deeper.</span></span>
          <span class="h-line"><span style="--d:.34s">Achieve more.</span></span>
        </h1>
        <p class="lede">StudyOS brings your subjects, focus sessions, exams and an AI tutor into one quiet, beautifully connected workspace — so every hour you study visibly moves you forward.</p>
        <div class="hero-ctas">
          <a class="btn btn-primary btn-lg" data-link href="#/home">Start studying ${ic('arrow-right','arr')}</a>
          <button class="btn btn-secondary btn-lg" data-target="sec-why">Explore the platform</button>
        </div>
        <div class="hero-live">
          <span class="hl-cap">From a sample workspace</span>
          <span class="hl-item gold">${ic('flame')}<b>${SAMPLE.streak.current}</b>&nbsp;day streak</span>
          <span class="hl-item">${ic('timer')}<b>${SAMPLE.todayMin}</b>&nbsp;min focused today</span>
          <span class="hl-item">${ic('file-text')}Next exam in&nbsp;<b>${days}&nbsp;days</b></span>
        </div>
      </div>
      <div class="hero-stage" id="heroStage">
        <div class="stage-glow"></div>
        <div class="stage-canvas" id="stageCanvas"></div>
        <div class="f-card-wrap" data-depth="22" style="top:6%;left:-2%"><div class="f-card green" style="--fd:7.5s">
          <span class="fc-top">${ic('timer')}Focus session</span>
          <span class="fc-num fc-timer"><span class="t-num">47:12</span></span>
          <span class="fc-sub">Mathematics · problem set 4</span>
          <div class="fc-bar"><i style="width:62%"></i></div>
        </div></div>
        <div class="f-card-wrap" data-depth="34" style="top:2%;right:-3%"><div class="f-card gold" style="--fd:6s;animation-delay:-2s">
          <span class="fc-top">${ic('flame')}Study streak</span>
          <span class="fc-num">${SAMPLE.streak.current} <small style="font-size:14px;font-family:var(--font-b);color:var(--ink-3)">days</small></span>
          <span class="fc-sub">Longest: ${SAMPLE.streak.longest} days</span>
        </div></div>
        <div class="f-card-wrap" data-depth="16" style="bottom:10%;left:4%"><div class="f-card" style="--fd:8s;animation-delay:-4s">
          <span class="fc-top">${ic('file-text')}Next exam</span>
          <span class="fc-num">${days} <small style="font-size:14px;font-family:var(--font-b);color:var(--ink-3)">days</small></span>
          <span class="fc-sub">${esc(SAMPLE.examSubject)} · ${esc(SAMPLE.examName)}</span>
          <div class="fc-bar"><i style="width:${SAMPLE.examPrep.pct}%"></i></div>
          <span class="fc-sub">${SAMPLE.examPrep.done} of ${SAMPLE.examPrep.total} topics reviewed</span>
        </div></div>
        <div class="f-card-wrap" data-depth="40" style="bottom:0%;right:6%"><div class="f-card" style="--fd:6.8s;animation-delay:-1s">
          <span class="fc-top">${ic('award')}Level ${SAMPLE.lvl.level}</span>
          <span class="fc-num">${SAMPLE.lvl.title}</span>
          <div class="fc-bar"><i style="width:${SAMPLE.lvl.pct}%"></i></div>
          <span class="fc-sub">${SAMPLE.lvl.into} / ${SAMPLE.lvl.need} XP to level ${SAMPLE.lvl.level + 1}</span>
        </div></div>
      </div>
    </div></div></header>`;
  }

  function stripHTML(){
    return `<section class="l-strip"><div class="wrap-wide"><div class="row">
      <div class="strip-item" data-reveal><span class="si-num" data-count="${SAMPLE.totalMin}" data-fmt="min">0h</span><span class="si-t">of focused study logged across all subjects</span></div>
      <div class="strip-item" data-reveal style="--d:.12s"><span class="si-num" data-count="${SAMPLE.sessions}">0</span><span class="si-t">focus sessions, from 25-minute rounds to deep work</span></div>
      <div class="strip-item" data-reveal style="--d:.24s"><span class="si-num" data-count="${SAMPLE.streak.current}">0</span><span class="si-t">days in the current study streak — keep the chain alive</span></div>
    </div></div></section>`;
  }

  function point(icon, t, d){ return `<div class="l-point"><span class="lp-ic">${ic(icon)}</span><div><h4>${t}</h4><p>${d}</p></div></div>`; }

  function sec(id, sunk, inner){ return `<section class="l-sec ${sunk?'sunk':''}" id="sec-${id}"><div class="wrap-wide">${inner}</div></section>`; }
  function head(num, title, lead, center){
    return `<div class="l-sec-head ${center?'center':''}" data-reveal>
      <span class="overline"><span class="num">${num}</span>${title}</span>
      ${lead ? `<h2 class="display-2">${lead.h}</h2><p class="lead">${lead.p}</p>` : ''}</div>`;
  }

  /* ---- mockups (real components, real data) ---- */
  function focusMock(){
    return `<div class="mock" data-reveal="zoom"><div class="m-dots"><i></i><i></i><i></i></div><div class="m-title">FOCUS MODE</div>
      <div class="m-body" style="display:flex;align-items:center;gap:34px;padding-top:56px">
        <div class="focus-ambient" style="position:absolute;inset:0;pointer-events:none"><div class="fa-1" style="left:10%;top:-10%"></div></div>
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:6px">
          <span style="font-size:12px;font-weight:600;color:var(--ink-3);display:flex;gap:8px;align-items:center"><span class="sdot" style="width:9px;height:9px;color:#2D6A4F;background:#2D6A4F"></span>Mathematics</span>
          ${Charts.ring({ size:210, stroke:12, pct:64, num:'32:14', sub:'OF 50 MIN', colors:['#337354','#7FA98C'] })}
          <span style="font-family:var(--font-d);font-style:italic;font-size:14px;color:var(--ink-3)">Goal: finish problem set 4</span>
        </div>
        <div style="position:relative;display:flex;flex-direction:column;gap:14px;flex:1;max-width:250px">
          <div class="row gap12" style="justify-content:center">
            <span class="fs-play" style="width:52px;height:52px;display:grid;place-items:center">${ic('pause')}</span>
            <span class="fs-skip" style="width:44px;height:44px;display:grid;place-items:center">${ic('skip')}</span>
            <span class="fs-skip" style="width:44px;height:44px;display:grid;place-items:center">${ic('volume')}</span>
          </div>
          <div class="row gap10" style="justify-content:center">
            <span class="badge badge-green">${ic('zap')} +18 XP so far</span>
            <span class="badge badge-line">${ic('coffee')} break in 18 min</span>
          </div>
          <div style="border-top:1px solid var(--line-soft);padding-top:12px">
            <div class="pbar-label"><span>Today</span><b>94 / 120 min</b></div>
            <div class="pbar"><i style="width:78%"></i></div>
          </div>
        </div>
      </div></div>`;
  }

  function plannerMock(){
    const today = D.today(), first = new Date(); first.setDate(1);
    const start = D.startOfWeek(D.key(first));
    /* sample blocks placed relative to today, kept inside the displayed month */
    const evs = [
      { date: today, title: 'History essay — outline', color: '#A06B3F' },
      { date: D.addDays(today, 2), title: 'Calculus revision — series', color: '#2D6A4F' },
      { date: D.addDays(today, 5), title: 'Physics lab report', color: '#3D6E77' },
      { date: D.addDays(today, 9), title: 'CS project milestone', color: '#77784B' },
    ].filter(e => D.parse(e.date).getMonth() === first.getMonth());
    const examDate = D.addDays(today, SAMPLE.examDays);
    const examInMonth = D.parse(examDate).getMonth() === first.getMonth();
    let cells = '';
    for (let i=0;i<35;i++){
      const k = D.addDays(start,i);
      const dayEvs = evs.filter(e=>e.date===k);
      const isExam = examInMonth && k===examDate;
      cells += `<div class="cal-day ${k!==today&&D.parse(k).getMonth()!==first.getMonth()?'out':''} ${k===today?'today':''}">
        <span class="cd-n">${D.parse(k).getDate()}</span>
        ${dayEvs.slice(0,1).map(e=>`<span class="cal-ev" style="--c:${e.color}">${esc(e.title.split('—')[0].trim())}</span>`).join('')}
        ${isExam?'<span class="cal-ev exam">Exam</span>':''}
      </div>`;
    }
    return `<div class="mock" data-reveal="zoom"><div class="m-dots"><i></i><i></i><i></i></div><div class="m-title">PLANNER</div>
      <div class="m-body" style="padding:56px 18px 20px">
        <div class="cal-grid">${['S','M','T','W','T','F','S'].map(d=>`<span class="cal-dow">${d}</span>`).join('')}${cells}</div>
      </div>
      <div class="mock-chip" style="bottom:44px;right:26px">${ic('calendar-plus','')}<div><b style="font-size:12.5px">New study block</b><div class="tiny muted-2">Subject · time · priority</div></div></div>
    </div>`;
  }

  function examMock(){
    const e = { name: SAMPLE.examName, subject: SAMPLE.examSubject };
    const prep = SAMPLE.examPrep, days = SAMPLE.examDays;
    const topics = SAMPLE.topics;
    return `<div class="mock" data-reveal="zoom"><div class="m-dots"><i></i><i></i><i></i></div><div class="m-title">EXAM PREPARATION</div>
      <div class="m-body" style="display:flex;gap:28px;align-items:center;padding-top:56px">
        <div style="text-align:center;min-width:150px">
          <div class="countdown"><div class="cd-num">${days}</div><div class="cd-word">days left</div></div>
          <div class="cd-sub">${esc(e.subject)} · ${esc(e.name)}</div>
        </div>
        <div class="grow" style="display:flex;flex-direction:column;gap:9px">
          ${topics.slice(0,5).map((t,i)=>`<div class="topic-row ${t.done?'done':''}" style="padding:5px 2px"><span class="cb ${t.done?'on':''}">${ic('check')}</span><span class="tp-n" style="font-size:12.5px">${esc(t.name)}</span></div>`).join('')}
          <div style="display:flex;align-items:center;gap:12px;margin-top:6px">
            <div class="pbar grow"><i style="width:${prep.pct}%"></i></div>
            <b style="font-size:13px" class="num-chip">${prep.pct}%</b>
          </div>
          <span class="tiny muted-2">${prep.done} of ${prep.total} topics reviewed — ${prep.pct}% prepared</span>
        </div>
      </div>
      <div class="mock-chip" style="bottom:40px;right:24px">${ic('check-circle')}<div><b style="font-size:12.5px">Topic reviewed</b><div class="tiny muted-2">+15 XP · exam prep updated</div></div></div>
    </div>`;
  }

  function tutorMock(){
    const answer = MD.render(
`#### Integration by parts — the 30-second version

When you can't simplify an integral directly, and it's a **product of two different families** (polynomial × trig, exponential × log…), integration by parts usually cracks it:

$$\\int u \\, dv = uv - \\int v \\, du$$

**How to choose \u0060u\u0060 — the LIPE rule**
1. **L**ogarithm — grab it first
2. **I**nverse trig
3. **P**olynomial
4. **E**xponential — take it last

##### Worked example
\`\`\`text
∫ x·eˣ dx
u = x   →  du = dx
dv = eˣ dx  →  v = eˣ
= x·eˣ − ∫ eˣ dx = x·eˣ − eˣ + C
\`\`\`

> **Quiz yourself:** what happens with ∫ ln(x) dx? (Hint: u = ln x, dv = dx.)`);
    return `<div class="mock" data-reveal="zoom"><div class="m-dots"><i></i><i></i><i></i></div><div class="m-title">AI STUDY TUTOR</div>
      <div class="m-body" style="padding-top:56px;display:flex;gap:16px">
        <div class="grow" style="display:flex;flex-direction:column;gap:14px;min-width:0">
          <div class="bubble-u" style="max-width:88%">Explain integration by parts like I have a quiz tomorrow</div>
          <div class="msg-ai"><span class="ai-av">${ic('sparkles')}</span>
            <div class="ai-body"><div class="ai-name">STUDYOS TUTOR <span class="badge badge-line" style="height:17px;font-size:9.5px">context: ${esc(SAMPLE.examSubject)}</span></div>
            <div class="ai-card">${answer}
              <div class="ai-actions"><button>${ic('lightbulb')}Explain simpler</button><button>${ic('file-text')}Give an example</button><button>${ic('help')}Quiz me</button></div>
            </div></div></div>
        </div>
      </div>
      <div class="mock-chip" style="top:60px;right:20px">${ic('key')}<div><b style="font-size:12px">Your API key</b><div class="tiny muted-2">OpenAI · OpenRouter · local</div></div></div>
    </div>`;
  }

  function statsMock(){
    const days = SAMPLE.weekValues.map((v,i)=>{ const k = D.addDays(D.today(), -(6-i));
      return { label: D.dayName(k), value: v, today: k === D.today() }; });
    const subj = SAMPLE.subjects;
    const total = subj.reduce((a,s)=>a+s.min,0);
    return `<div class="mock" data-reveal="zoom"><div class="m-dots"><i></i><i></i><i></i></div><div class="m-title">INSIGHTS</div>
      <div class="m-body" style="padding-top:56px;display:grid;grid-template-columns:1.3fr 1fr;gap:22px">
        <div>
          <span class="overline" style="margin-bottom:14px">This week</span>
          ${Charts.bars({ data:days, goal:120, height:150 })}
        </div>
        <div>
          <span class="overline" style="margin-bottom:14px">Subjects · 30 days</span>
          ${Charts.donut({ segments:subj.slice(0,5).map(s=>({ label:s.name, value:s.min, color:s.color })), size:150, thickness:17, center:fmtMin(total), centerSub:'TOTAL' })}
          <div class="donut-legend" style="margin-top:12px">${subj.slice(0,3).map(s=>`<div class="dl-row"><span class="sdot" style="color:${s.color};background:${s.color}"></span><span class="n">${esc(s.name)}</span><span class="t">${fmtMin(s.min)}</span></div>`).join('')}</div>
        </div>
      </div></div>`;
  }

  function battleMock(){
    const chs = SAMPLE.challenges;
    return `<div class="mock" data-reveal="zoom"><div class="m-dots"><i></i><i></i><i></i></div><div class="m-title">STUDY BATTLE</div>
      <div class="m-body" style="padding-top:56px;display:flex;gap:30px;align-items:center;flex-wrap:wrap">
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;min-width:150px">
          <div class="level-badge">
            <svg class="lb-ring" width="112" height="112" viewBox="0 0 112 112"><circle cx="56" cy="56" r="51" fill="none" stroke="rgba(216,188,114,.25)" stroke-width="5"/><circle cx="56" cy="56" r="51" fill="none" stroke="#D8BC72" stroke-width="5" stroke-linecap="round" stroke-dasharray="${2*Math.PI*51*(SAMPLE.lvl.pct/100)} 999" transform="rotate(-90 56 56)"/></svg>
            <div class="lb-c"><span class="lb-n">${SAMPLE.lvl.level}</span><span class="lb-t">${SAMPLE.lvl.title}</span></div>
          </div>
          <span class="tiny muted-2">${SAMPLE.xp} XP total</span>
        </div>
        <div class="grow" style="display:flex;flex-direction:column;gap:10px;min-width:230px">
          ${chs.map(c=>`<div class="challenge ${c.complete?'done':''}">
            <span class="ch-ic">${ic(c.icon)}</span>
            <div class="ch-body"><b>${esc(c.name)}</b>
              <div class="ch-prog"><div class="pbar thin"><i style="width:${Math.round(c.value/c.goal*100)}%"></i></div><span class="ch-pct">${c.value}/${c.goal}</span></div>
            </div><span class="ch-xp">+${c.xp}</span>
          </div>`).join('')}
        </div>
      </div></div>`;
  }

  /* ---------------- main render ---------------- */
  function render(root){
    root.innerHTML = `<div class="landing">
      ${navHTML()}
      ${heroHTML()}
      ${stripHTML()}

      ${sec('why', true, `
        ${head('01','Why StudyOS',{ h:'Built for one verb: <em class="serif-i">study</em>.', p:'Not another project board. Not another to-do app with a leaf icon. StudyOS is designed around the way students actually work — subjects, sessions, exams and the fog between them.' })}
        <div class="values-grid">
          <div class="value-card" data-reveal><span class="vc-num">i.</span><span class="vc-ic">${ic('sprout')}</span><h3>Grown from studying</h3><p>Every screen exists to serve a study session, an exam, or the quiet hour before one. If a feature didn't help you learn, it didn't ship.</p></div>
          <div class="value-card" data-reveal style="--d:.12s"><span class="vc-num">ii.</span><span class="vc-ic">${ic('zap')}</span><h3>Everything is connected</h3><p>Focus sessions feed streaks and statistics. Tasks feed exam preparation. The tutor reads your context. Numbers reflect real work — never decoration.</p></div>
          <div class="value-card" data-reveal style="--d:.24s"><span class="vc-num">iii.</span><span class="vc-ic">${ic('leaf')}</span><h3>Calm by design</h3><p>Warm paper tones, deep forest green, soft motion. An interface that lowers your shoulders — because attention is the scarcest resource you have.</p></div>
        </div>`)}

      ${sec('focus', false, `<div class="l-split">
        <div class="l-copy" data-reveal="left">
          ${head('02','Focus system',{ h:'One timer. <em class="serif-i">Zero noise.</em>', p:'Choose a subject, a length and a goal — then let everything else fade. Pomodoro rounds, deep-work blocks, gentle ambient sound and a completion screen that feels earned.' })}
          <div class="l-points">
            ${point('target','Progress you can feel','A ring that fills as you do, with session stats that update live while you study.')}
            ${point('coffee','Breaks that flow naturally','After a Pomodoro round, a short break begins on its own — long ones every fourth round.')}
            ${point('zap','Every minute counts','Sessions feed XP, streaks, subject stats and insights the moment they end.')}
          </div>
        </div>
        <div class="l-visual">${focusMock()}</div>
      </div>`)}

      ${sec('planner', true, `<div class="l-split rev">
        <div class="l-copy" data-reveal="right">
          ${head('03','Planner',{ h:'Your week, <em class="serif-i">shaped by hand.</em>', p:'A calendar that thinks in study blocks. Plan a revision session in five seconds, watch exams land on the grid, and see today stand out — gently, not alarmingly.' })}
          <div class="l-points">
            ${point('calendar-plus','Blocks in five seconds','Subject, title, time, duration, priority. Done — it sits on your calendar with its subject color.')}
            ${point('file-text','Exams appear automatically','Every exam you track shows up on the calendar and links to its preparation page.')}
            ${point('sun','Today, highlighted elegantly','A quiet ring around the day that matters most: this one.')}
          </div>
        </div>
        <div class="l-visual">${plannerMock()}</div>
      </div>`)}

      ${sec('exams', false, `<div class="l-split">
        <div class="l-copy" data-reveal="left">
          ${head('04','Exam preparation',{ h:'Every exam, <em class="serif-i">counted down.</em>', p:'A distant exam becomes a visible slope: a live countdown, a topic checklist, preparation percentage and the study sessions that get you to 100%.' })}
          <div class="l-points">
            ${point('clock','Countdowns that stay honest','“18 days left” — always computed from today, never a stale number.')}
            ${point('check-square','Topics, one check at a time','Review a topic, tick it, watch preparation rise — and earn XP for it.')}
            ${point('list','Linked work','Tasks and planned sessions tied to the exam appear on its detail page.')}
          </div>
        </div>
        <div class="l-visual">${examMock()}</div>
      </div>`)}

      ${sec('tutor', true, `<div class="l-split rev">
        <div class="l-copy" data-reveal="right">
          ${head('05','AI study tutor',{ h:'A tutor that knows <em class="serif-i">your syllabus.</em>', p:'Ask anything about what you are studying. The tutor sees your subjects, upcoming exams and preparation — so its answers land exactly where you need them.' })}
          <div class="l-points">
            ${point('sparkles','Explain · quiz · flashcards','Structured explanations, worked examples, revision questions and flashcards on demand.')}
            ${point('notebook','Save what matters','Send any answer to your notes with one click — it waits for you on exam week.')}
            ${point('key','Your key, your model','Bring an OpenAI, OpenRouter or local key. Nothing is hardcoded, nothing leaves your browser.')}
          </div>
        </div>
        <div class="l-visual">${tutorMock()}</div>
      </div>`)}

      ${sec('stats', false, `<div class="l-split">
        <div class="l-copy" data-reveal="left">
          ${head('06','Statistics',{ h:'Numbers that <em class="serif-i">mean something.</em>', p:'Charts built from your real sessions — weekly rhythm, subject balance, consistency over months — plus plain-language insights like “your most consistent day is Monday.”' })}
          <div class="l-points">
            ${point('chart','Honest charts only','No vanity graphs. Each one answers a question a student would actually ask.')}
            ${point('lightbulb','Insights, not dashboards','Short sentences generated from your data — trends, records, gentle nudges.')}
            ${point('flame','Streaks & records','Current streak, longest streak, goal completion — history you can feel good about.')}
          </div>
        </div>
        <div class="l-visual">${statsMock()}</div>
      </div>`)}

      ${sec('battle', true, `<div class="l-split rev">
        <div class="l-copy" data-reveal="right">
          ${head('07','Study battle',{ h:'Momentum, <em class="serif-i">made visible.</em>', p:'Real focus earns XP. Levels rise quietly. Daily challenges and tasteful achievements reward the unglamorous middle of studying — the part that actually decides your grade.' })}
          <div class="l-points">
            ${point('zap','XP for real work','Minutes studied, tasks finished, topics reviewed — all of it adds up.')}
            ${point('target','Daily challenges','“Sixty minutes today.” “Finish three tasks.” Small prompts, real rewards.')}
            ${point('award','Achievements worth earning','Streaks, deep-work milestones, exam readiness — unlocked with a quiet flourish.')}
          </div>
        </div>
        <div class="l-visual">${battleMock()}</div>
      </div>`)}

      <section class="final-cta">
        <div class="fc-glow"></div>
        <div class="wrap-wide">
          <span class="overline" data-reveal>Begin</span>
          <h2 class="display-2" data-reveal style="--d:.08s">Make studying<br><em class="serif-i">feel beautiful.</em></h2>
          <p class="lead" data-reveal style="--d:.16s">Free, private, and stored in your own browser. Open the workspace and start your first session — the streak starts today.</p>
          <div class="btn-row" data-reveal style="--d:.24s">
            <a class="btn btn-primary btn-lg" data-link href="#/home">Start studying ${ic('arrow-right','arr')}</a>
            <a class="btn btn-secondary btn-lg" data-link href="#/focus">Jump into focus mode</a>
          </div>
          <p class="fc-note" data-reveal style="--d:.3s">No account needed · Your data never leaves this device</p>
        </div>
      </section>

      <footer class="l-footer"><div class="wrap-wide row">
        <span class="l-logo" style="font-size:16px"><span class="logo-mark" style="width:26px;height:26px;border-radius:8px">${ic('book-open')}</span>StudyOS</span>
        <div class="f-links"><a data-target="sec-focus">Focus</a><a data-target="sec-planner">Planner</a><a data-target="sec-exams">Exams</a><a data-target="sec-tutor">Tutor</a><a data-target="sec-stats">Insights</a></div>
        <span class="f-tag">Designed for deep work. © 2026 StudyOS</span>
      </div></footer>
    </div>`;

    /* ---- behaviors ---- */
    const landingEl = $('.landing', root);
    let scene = null;

    /* nav scroll state + progress */
    const onScroll = () => {
      $('#lNav')?.classList.toggle('scrolled', scrollY > 24);
      const h = document.documentElement.scrollHeight - innerHeight;
      $('#lProgress')?.style.setProperty('width', (h > 0 ? (scrollY/h)*100 : 0) + '%');
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    /* smooth-scroll anchors (never touch location.hash — router owns it) */
    const goTo = id => { const t = document.getElementById(id); t && t.scrollIntoView({ behavior:'smooth', block:'start' }); };
    landingEl.addEventListener('click', e => {
      const t = e.target.closest('[data-target]');
      if (t){ e.preventDefault(); goTo(t.dataset.target); $('#lMenu').hidden = true; return; }
      const link = e.target.closest('[data-link]');
      if (link && link.getAttribute('href')){ e.preventDefault(); App.nav(link.getAttribute('href').slice(2)); }
    });
    $('#lMenuBtn').onclick = e => { e.stopPropagation(); const m = $('#lMenu'); m.hidden = !m.hidden; };

    /* 3D scene */
    const canvasHost = $('#stageCanvas');
    if (canvasHost) scene = HeroScene.create(canvasHost, { compact:false });

    /* hero parallax on floating cards */
    const stage = $('#heroStage');
    const reduce = document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (stage && !reduce){
      const onMove = e => {
        const r = stage.getBoundingClientRect();
        const px = clamp((e.clientX - r.left)/r.width - .5, -.6, .6);
        const py = clamp((e.clientY - r.top)/r.height - .5, -.6, .6);
        stage.style.setProperty('--px', px.toFixed(3));
        stage.style.setProperty('--py', py.toFixed(3));
      };
      addEventListener('mousemove', onMove, { passive:true });
      stage._cleanupMove = () => removeEventListener('mousemove', onMove);
    }

    /* reveals + counters + chart animations */
    Reveal.init(landingEl);
    Charts.ringTick(landingEl); Charts.barsIn(landingEl); Charts.donutIn(landingEl);
    const cio = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting){
        const el = en.target, to = +el.dataset.count;
        countUp(el, to, { fmt: el.dataset.fmt === 'min' ? v => fmtMin(v) : v => Math.round(v) });
        cio.unobserve(el);
      }
    }), { threshold:.5 });
    $$('[data-count]', landingEl).forEach(el => cio.observe(el));

    /* subtle hero timer illusion */
    const tnum = $('.fc-timer .t-num', landingEl);
    if (tnum){ let sec = 47*60 + 12; setInterval(() => { if (!document.hidden){ sec++; tnum.textContent = fmtClock(sec); } }, 1000); }

    return () => {
      removeEventListener('scroll', onScroll);
      scene && scene.destroy();
      stage?._cleanupMove?.();
    };
  }

  return { render };
})();
