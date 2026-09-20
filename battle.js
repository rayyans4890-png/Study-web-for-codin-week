/* ============================================================
   StudyOS — views/battle.js · XP · levels · challenges · medals
   ============================================================ */
Views.battle = {
  title: 'Study Battle', crumb: 'XP, streaks and challenges', icon: 'swords',
  _off: null,

  render(root){
    this._off && this._off();
    this.paint(root);
    this._off = Bus.on('store:change', () => { if (!Modal.stack.length && App.currentRoute==='battle') this.paint(root); });
  },

  paint(root){
    const b = Store.state.battle, lvl = Store.level(), st = Store.streaks();
    const chs = Store.dailyChallenges();
    const weekMin = Store.weekMinutes(0), weekGoal = b.weeklyGoalMin;
    /* last 7 days streak dots */
    const dots = Array.from({length:7},(_,i)=>{ const k = D.addDays(D.today(), -(6-i)); return Store.minutesOn(k) > 0; });
    const c = 2*Math.PI*51;

    root.innerHTML = `
    <div class="page-head">
      <div class="ph-copy"><h2>Study Battle</h2><p>Real focus earns XP. Momentum, made visible.</p></div>
    </div>

    <div class="battle-hero" data-reveal="zoom">
      <div class="level-badge">
        <svg class="lb-ring" width="112" height="112" viewBox="0 0 112 112">
          <circle cx="56" cy="56" r="51" fill="none" stroke="rgba(216,188,114,.22)" stroke-width="5"/>
          <circle cx="56" cy="56" r="51" fill="none" stroke="#D8BC72" stroke-width="5" stroke-linecap="round"
            stroke-dasharray="${(c*lvl.pct/100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 56 56)"/>
        </svg>
        <div class="lb-c"><span class="lb-n">${lvl.level}</span><span class="lb-t">${lvl.title}</span></div>
      </div>
      <div class="bh-mid">
        <h2>Level ${lvl.level} — ${lvl.title}</h2>
        <p>${b.xp} XP earned through ${Store.state.sessions.length} sessions and ${Store.state.tasks.filter(t=>t.done).length} completed tasks.</p>
        <div class="bh-xp">
          <div class="pbar"><i style="width:${lvl.pct}%"></i></div>
          <div class="xp-lbl"><span>${lvl.into} XP</span><span>${lvl.need - lvl.into} XP to level ${lvl.level+1}</span></div>
        </div>
      </div>
      <div class="streak-tile">
        <span class="st-n">${ic('flame')}${st.current}</span>
        <span class="st-l">day streak</span>
        <div class="streak-days">${dots.map(d=>`<i class="${d?'on':''}"></i>`).join('')}</div>
        <span class="tiny" style="color:var(--g-300)">longest: ${st.longest} days</span>
      </div>
    </div>

    <div class="section-head"><div><h2 style="font-size:21px">Daily challenges</h2>
      <div class="sh-sub">Fresh every morning — claim by doing, not by clicking</div></div>
      <span class="tiny muted-2">resets at midnight</span></div>
    <div class="battle-grid" style="margin-bottom:26px">
      ${chs.map(ch=>`
        <div class="challenge ${ch.complete?'done':''}" data-reveal>
          <span class="ch-ic">${ic(ch.complete?'check-circle':ch.icon)}</span>
          <div class="ch-body"><b>${esc(ch.name)}</b>
            <div class="ch-prog">
              <div class="pbar thin"><i style="width:${Math.round(ch.value/ch.goal*100)}%"></i></div>
              <span class="ch-pct">${ch.value}/${ch.goal}</span>
            </div></div>
          <span class="ch-xp" style="${ch.claimed?'opacity:.45':''}">${ch.claimed?'claimed':'+'+ch.xp}</span>
        </div>`).join('')}
    </div>

    <div class="stats-row2" style="margin-bottom:26px">
      <div class="chart-card" data-reveal><h3>Weekly goal</h3>
        <span class="cc-sub">${fmtMin(weekMin)} of ${fmtMin(weekGoal)} across all subjects this week</span>
        <div class="pbar lg" style="margin:6px 0 10px"><i style="width:${clamp(weekMin/weekGoal*100,0,100)}%"></i></div>
        <div class="row between"><span class="tiny muted-2">${Math.round(weekMin/weekGoal*100)}% there</span>
          <span class="badge badge-gold">${ic('award')} ${weekMin >= weekGoal ? 'Goal reached' : fmtMin(weekGoal-weekMin) + ' to go'}</span></div>
      </div>
      <div class="chart-card" data-reveal><h3>How XP works</h3><span class="cc-sub">No tricks — only real work</span>
        <div class="lrow" style="padding:8px 4px">${ic('timer')}<span class="small grow">Each minute of focused study</span><span class="badge badge-line">+1 XP</span></div>
        <div class="lrow" style="padding:8px 4px">${ic('check-square')}<span class="small grow">Completing a task</span><span class="badge badge-line">+10 XP</span></div>
        <div class="lrow" style="padding:8px 4px">${ic('file-text')}<span class="small grow">Reviewing an exam topic</span><span class="badge badge-line">+15 XP</span></div>
        <div class="lrow" style="padding:8px 4px">${ic('target')}<span class="small grow">Daily challenge</span><span class="badge badge-line">+40–110 XP</span></div>
      </div>
    </div>

    <div class="section-head"><div><h2 style="font-size:21px">Achievements</h2>
      <div class="sh-sub">${Object.keys(b.unlocked).length} of ${ACHIEVEMENTS.filter(a=>!a.hide).length} unlocked</div></div></div>
    <div class="ach-grid">
      ${ACHIEVEMENTS.filter(a=>!a.hide).map(a=>{
        const un = b.unlocked[a.id];
        return `<div class="medal ${un?'on':''}" data-reveal title="${esc(a.desc)}">
          <span class="m-ic">${ic(a.icon)}</span><span>${esc(a.name)}</span>
          ${un?`<span class="tiny muted-2" style="position:absolute;bottom:7px">${D.fmtShort(un)}</span>`:''}
        </div>`; }).join('')}
    </div>`;
    Reveal.init(root);
  },

  destroy(){ this._off && this._off(); this._off = null; }
};
