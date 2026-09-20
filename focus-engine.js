/* ============================================================
   StudyOS — focus-engine.js
   App-wide timer engine. Survives navigation (mini-pill shows
   progress elsewhere). Emits on the Bus:
     focus:state  · focus:tick  · focus:complete
   ============================================================ */

const FocusEngine = {
  session: null,        /* {subjectId, goal, mode, phase, cycle, totalSec, remainSec, endAt} */
  running: false,
  _iv: null,

  get active(){ return !!this.session; },

  start({ subjectId, minutes, goal='', mode='classic' }){
    this.stopLoop();
    this.session = {
      subjectId, goal, mode, minutes,
      phase: 'work', cycle: 1,
      totalSec: Math.round(minutes*60),
      remainSec: Math.round(minutes*60),
      endAt: Date.now() + minutes*60000,
      breakLen: mode === 'pomodoro' ? 5 : 0,
      startedAt: Date.now()
    };
    this.running = true;
    this.startLoop();
    if (Store.state.profile.chime) AmbientAudio.chime('soft');
    Bus.emit('focus:state', this.snapshot());
  },

  pause(){ if (!this.session || !this.running) return;
    this.session.remainSec = Math.max(0, (this.session.endAt - Date.now())/1000);
    this.running = false; this.stopLoop(); Bus.emit('focus:state', this.snapshot()); },

  resume(){ if (!this.session || this.running) return;
    this.session.endAt = Date.now() + this.session.remainSec*1000;
    this.running = true; this.startLoop(); Bus.emit('focus:state', this.snapshot()); },

  reset(){ this.stopLoop(); this.session = null; this.running = false;
    Bus.emit('focus:state', null); },

  skip(){ /* finish current phase early */
    if (!this.session) return;
    if (this.session.phase === 'work'){
      const elapsed = this.session.totalSec - Math.max(0, (this.session.endAt - Date.now())/1000);
      this._completeWork(elapsed, true);
    } else {
      this._nextWork();
    }
  },

  standaloneBreak(len){
    this.stopLoop();
    this.session = { subjectId:null, goal:'', mode:'break', minutes:len, phase:'break', cycle:0,
      totalSec:len*60, remainSec:len*60, endAt:Date.now()+len*60000, startedAt:Date.now() };
    this.running = true; this.startLoop();
    Bus.emit('focus:state', this.snapshot());
  },

  startBreak(len){
    this.session.phase = 'break';
    this.session.totalSec = this.session.breakTotal = len*60;
    this.session.remainSec = len*60;
    this.session.endAt = Date.now() + len*60000;
    this.running = true; this.startLoop();
    Bus.emit('focus:state', this.snapshot());
  },

  snapshot(){
    if (!this.session) return null;
    const s = this.session;
    const remain = this.running ? Math.max(0, (s.endAt - Date.now())/1000) : s.remainSec;
    const elapsed = s.phase === 'work' ? (s.totalSec - remain) : 0;
    return {
      subjectId: s.subjectId, goal: s.goal, mode: s.mode, phase: s.phase,
      cycle: s.cycle, running: this.running,
      remain, total: s.totalSec,
      elapsedMin: Math.max(0, Math.floor(elapsed/60)),
      elapsedSec: Math.max(0, elapsed),
      progress: s.totalSec ? 1 - remain/s.totalSec : 0
    };
  },

  startLoop(){
    this.stopLoop();
    this._iv = setInterval(() => {
      const snap = this.snapshot();
      if (!snap) return this.stopLoop();
      Bus.emit('focus:tick', snap);
      if (this.running && snap.remain <= 0.4){
        if (snap.phase === 'work') this._completeWork(this.session.totalSec, false);
        else this._breakDone();
      }
    }, 500);
  },
  stopLoop(){ if (this._iv){ clearInterval(this._iv); this._iv = null; } },

  _completeWork(elapsedSec, skipped){
    const s = this.session;
    const minutes = Math.floor(elapsedSec/60);
    this.stopLoop(); this.running = false;
    let rewards = null, subject = Store.subject(s.subjectId);
    if (minutes >= 1){
      rewards = Store.addSession({ subjectId: s.subjectId, durationMin: minutes, mode: s.mode, goal: s.goal });
      rewards.minutes = minutes; rewards.subject = subject;
      rewards.sessionsToday = Store.sessionsOn(D.today()).length;
      rewards.dailyPct = Store.goalPct();
    }
    if (Store.state.profile.chime) AmbientAudio.chime('done');
    const cycle = s.cycle, mode = s.mode, breakLen = s.cycle % 4 === 0 ? 15 : 5;
    /* pomodoro pauses on the completion screen — the student starts the break */
    if (mode === 'pomodoro' && !skipped){
      this.session = { ...s, phase: 'break-wait', remainSec: 0, endAt: Date.now() };
      Bus.emit('focus:complete', { ...rewards, cycle, breakLen, autoBreak: true, goal: s.goal });
      Bus.emit('focus:state', this.snapshot());
    } else {
      this.session = null;
      Bus.emit('focus:complete', { ...rewards, cycle, breakLen, autoBreak: false, goal: s.goal });
      Bus.emit('focus:state', null);
    }
  },

  _breakDone(){
    this.stopLoop();
    if (Store.state.profile.chime) AmbientAudio.chime('soft');
    const cycle = this.session?.cycle || 0;
    this.session = null; this.running = false;
    Bus.emit('focus:breakdone', cycle);
    Bus.emit('focus:state', null);
  }
};
