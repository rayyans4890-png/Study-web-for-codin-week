/* ============================================================
   StudyOS — views/settings.js · profile & personalization
   ============================================================ */
Views.settings = {
  title: 'Settings', crumb: 'Profile & preferences', icon: 'settings',
  AVATARS: [
    'linear-gradient(135deg,#2D6A4F,#0F3324)', 'linear-gradient(135deg,#4E8A6B,#16402D)',
    'linear-gradient(135deg,#C9A45C,#8A6820)', 'linear-gradient(135deg,#3D6E77,#1E3A40)',
    'linear-gradient(135deg,#77784B,#3F4025)', 'linear-gradient(135deg,#A06B3F,#5C3A1E)'
  ],

  render(root){
    const p = Store.state.profile;
    root.innerHTML = `
    <div class="page-head">
      <div class="ph-copy"><h2>Settings</h2><p>Make StudyOS feel like it was built for you — because it was.</p></div>
    </div>
    <div class="settings-grid">
      <div>
        <div class="card set-card" data-reveal>
          <h3>${ic('user')} Profile</h3><p class="sc-sub">How the workspace greets you.</p>
          <div class="form-row" style="margin-bottom:18px">
            <div class="field"><label>Name</label><input class="input" id="stName" value="${esc(p.name)}" maxlength="24"></div>
            <div class="field"><label>Daily study goal — <b id="stGoalV">${p.dailyGoalMin}</b> min</label>
              <input type="range" id="stGoal" min="30" max="360" step="15" value="${p.dailyGoalMin}" style="margin-top:12px"></div>
          </div>
          <div class="field"><label>Avatar</label>
            <div class="avatar-pick" id="stAvatars">
              ${this.AVATARS.map((g,i)=>`<span class="avatar-opt ${i===p.avatarIdx&&!p.avatarImg?'on':''}" data-i="${i}" style="background:${g}">${esc(p.name.slice(0,1).toUpperCase())}</span>`).join('')}
              <span class="avatar-opt ${p.avatarImg?'on':''}" data-i="img" style="background:var(--surface-sunk);color:var(--ink-3);border:1.5px dashed var(--line-strong)" title="Upload an image">${ic('upload')}</span>
              <input type="file" id="stAvatarFile" accept="image/*" hidden>
            </div></div>
        </div>

        <div class="card set-card" data-reveal>
          <h3>${ic('timer')} Study preferences</h3><p class="sc-sub">Defaults for focus sessions and planning.</p>
          <div class="set-row"><div class="sr-t"><b>Preferred session length</b><span>Pre-selected when you start a focus session</span></div>
            <div class="sr-c"><select class="select" id="stPref" style="width:130px">
              ${[25,45,50,60,90].map(v=>`<option value="${v}" ${p.preferredSession==v?'selected':''}>${v} minutes</option>`).join('')}</select></div></div>
          <div class="set-row"><div class="sr-t"><b>Ambient sound</b><span>Soft brown noise during focus sessions</span></div>
            <div class="sr-c"><label class="switch"><input type="checkbox" id="stSound" ${p.sound?'checked':''}><span class="track"></span><span class="thumb"></span></label></div></div>
          <div class="set-row"><div class="sr-t"><b>Completion chime</b><span>A gentle tone when a session ends</span></div>
            <div class="sr-c"><label class="switch"><input type="checkbox" id="stChime" ${p.chime?'checked':''}><span class="track"></span><span class="thumb"></span></label></div></div>
          <div class="set-row"><div class="sr-t"><b>Notifications</b><span>In-app toasts for XP, streaks and completions</span></div>
            <div class="sr-c"><label class="switch"><input type="checkbox" id="stNotif" ${!p.notifOff?'checked':''}><span class="track"></span><span class="thumb"></span></label></div></div>
        </div>

        <div class="card set-card" data-reveal>
          <h3>${ic('moon')} Appearance</h3><p class="sc-sub">Warm paper, or deep forest.</p>
          <div class="set-row"><div class="sr-t"><b>Theme</b><span>Evening uses deep greens, easy on the eyes at night</span></div>
            <div class="sr-c"><div class="seg">
              <button data-theme-set="day" class="${p.theme!=='evening'?'on':''}">${ic('sun')} Day</button>
              <button data-theme-set="evening" class="${p.theme==='evening'?'on':''}">${ic('moon')} Evening</button>
            </div></div></div>
          <div class="set-row"><div class="sr-t"><b>Reduce motion</b><span>Fewer animations, instant transitions</span></div>
            <div class="sr-c"><label class="switch"><input type="checkbox" id="stMotion" ${p.reduceMotion?'checked':''}><span class="track"></span><span class="thumb"></span></label></div></div>
        </div>

        <div class="card set-card" data-reveal>
          <h3>${ic('book')} Subjects</h3><p class="sc-sub">Your active subjects and weekly goals.</p>
          <div id="stSubjects">
            ${Store.state.subjects.map(s=>`
              <div class="subj-manage-row">
                <span class="sc-ic" style="width:36px;height:36px;border-radius:11px;display:grid;place-items:center;color:#fff;background:${s.color}">${ic(s.icon)}</span>
                <div class="grow"><b class="small" style="font-weight:600">${esc(s.name)}</b>
                  <div class="tiny muted-2">goal ${fmtMin(s.goal)}/week · ${Store.state.sessions.filter(x=>x.subjectId===s.id).length} sessions</div></div>
                <button class="icon-btn sm" data-edit-subj="${s.id}" aria-label="Edit subject">${ic('edit')}</button>
              </div>`).join('')}
          </div>
          <button class="btn btn-secondary btn-sm" id="stAddSubj" style="margin-top:12px">${ic('plus')} Add subject</button>
        </div>

        <div class="card set-card" data-reveal>
          <h3>${ic('key')} AI tutor</h3><p class="sc-sub">Bring your own key — it never leaves this browser.</p>
          <div class="set-row"><div class="sr-t"><b>Endpoint & key</b>
            <span>${Store.state.tutor.config.apiKey ? 'Connected — model ' + esc(Store.state.tutor.config.model) : 'Currently in demo mode'}</span></div>
            <div class="sr-c"><button class="btn btn-secondary btn-sm" id="stTutorCfg">${ic('settings')} Configure</button></div></div>
        </div>

        <div class="card set-card" data-reveal>
          <h3>${ic('shield')} Data</h3><p class="sc-sub">Everything lives in your browser's local storage.</p>
          <div class="row gap10" style="flex-wrap:wrap">
            <button class="btn btn-secondary btn-sm" id="stExport">${ic('download')} Export data</button>
            <button class="btn btn-secondary btn-sm" id="stImport">${ic('upload')} Import</button>
            <input type="file" id="stImportFile" accept="application/json" hidden>
            <button class="btn btn-secondary btn-sm" id="stLoadDemo">${ic('sparkles')} Load demo workspace</button>
            <button class="btn btn-danger btn-sm" id="stStartFresh">${ic('refresh')} Start fresh</button>
          </div>
          <p class="tiny muted-2" style="margin-top:10px">“Load demo” fills the workspace with a sample student (Salem) to explore every feature — your profile and tutor settings are kept. “Start fresh” empties everything you've entered; your preferences stay.</p>
        </div>
      </div>

      <div class="home-side">
        <div class="card pad" data-reveal="right" style="text-align:center;padding:28px 22px">
          ${Charts.ring({ size:120, stroke:10, pct:Store.level().pct, num:'Lv '+Store.level().level, sub:Store.level().title, colors:['#B08A34','#E5D5A8'] })}
          <div class="title-md" style="margin-top:14px">${Store.state.battle.xp} XP</div>
          <p class="tiny muted-2" style="margin-top:4px">${Store.level().need - Store.level().into} XP to level ${Store.level().level+1}</p>
        </div>
        <div class="card pad" data-reveal="right">
          <div class="overline" style="margin-bottom:10px">About</div>
          <p class="small muted" style="line-height:1.65">StudyOS is a self-contained studying workspace. Sessions, streaks, XP and insights are computed from your real activity — never faked. Your data stays on this device.</p>
          <div class="row gap6" style="margin-top:14px;flex-wrap:wrap">
            <span class="badge badge-green">${ic('check')} Local-first</span>
            <span class="badge badge-line">${ic('shield')} Private</span>
          </div>
        </div>
      </div>
    </div>`;

    /* wiring */
    const save = debounce(() => { Store.updateProfile({ name: $('#stName').value.trim() || 'Student' }); }, 500);
    $('#stName').oninput = e => { save(); };
    $('#stGoal').oninput = e => { $('#stGoalV').textContent = e.target.value; };
    $('#stGoal').onchange = e => { Store.updateProfile({ dailyGoalMin: +e.target.value }); Toast.show({ title:'Daily goal updated', desc: e.target.value + ' minutes a day', tone:'success', duration:2200 }); };
    $$('#stAvatars .avatar-opt', root).forEach(o => o.onclick = () => {
      if (o.dataset.i === 'img'){ $('#stAvatarFile').click(); return; }
      Store.updateProfile({ avatarIdx: +o.dataset.i, avatarImg: null });
      this.render(root);
    });
    $('#stAvatarFile').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { const img = new Image();
        img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 128;
          const g = c.getContext('2d'); const s = Math.min(img.width, img.height);
          g.drawImage(img, (img.width-s)/2, (img.height-s)/2, s, s, 0, 0, 128, 128);
          Store.updateProfile({ avatarImg: c.toDataURL('image/jpeg', 0.82) });
          this.render(root); Toast.show({ title:'Avatar updated', tone:'success' });
        };
        img.src = rd.result; };
      rd.readAsDataURL(f);
    };
    $('#stPref').onchange = e => Store.updateProfile({ preferredSession: +e.target.value });
    $('#stSound').onchange = e => { Store.updateProfile({ sound: e.target.checked }); if (e.target.checked) AmbientAudio.start(); else AmbientAudio.stop(); };
    $('#stChime').onchange = e => { Store.updateProfile({ chime: e.target.checked }); if (e.target.checked) AmbientAudio.chime('soft'); };
    $('#stNotif').onchange = e => Store.updateProfile({ notifOff: !e.target.checked });
    $$('[data-theme-set]', root).forEach(b => b.onclick = () => {
      document.documentElement.dataset.theme = b.dataset.themeSet;
      Store.updateProfile({ theme: b.dataset.themeSet });
      $$('[data-theme-set]', root).forEach(x=>x.classList.toggle('on', x===b));
    });
    $('#stMotion').onchange = e => {
      Store.updateProfile({ reduceMotion: e.target.checked });
      document.documentElement.classList.toggle('reduce-motion', e.target.checked);
    };
    $$('[data-edit-subj]', root).forEach(b => b.onclick = () => SubjectUI.open({ id: b.dataset.editSubj }));
    $('#stAddSubj').onclick = () => SubjectUI.open();
    $('#stTutorCfg').onclick = () => TutorCfg.open();
    $('#stExport').onclick = () => { downloadFile('studyos-data.json', JSON.stringify(Store.state, null, 2)); Toast.show({ title:'Data exported', desc:'studyos-data.json', tone:'success' }); };
    $('#stImport').onclick = () => $('#stImportFile').click();
    $('#stImportFile').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { try {
          const j = JSON.parse(rd.result);
          if (j && j.version === 1){ Store.state = j; Store.commit(); this.render(root); Toast.show({ title:'Data imported', tone:'success' }); }
          else Toast.show({ title:'Import failed', desc:'Not a StudyOS export file.', tone:'warn' });
        } catch(err){ Toast.show({ title:'Import failed', desc:'Could not parse the file.', tone:'warn' }); } };
      rd.readAsText(f);
    };
    $('#stLoadDemo').onclick = () => {
      Modal.open({ title:'Load the demo workspace?',
        body:'<p class="muted small">This replaces your current subjects, sessions, tasks and exams with a sample student (Salem) so you can explore every feature. Your profile and tutor settings are kept. You can undo this anytime with “Start fresh”.</p>',
        footer:'<button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary" id="rstOk">Load demo</button>',
        onMount(el, api){ el.querySelector('[data-close]').onclick=()=>api.close();
          el.querySelector('#rstOk').onclick=()=>{ api.close(); Store.loadDemo(); location.hash = '#/home'; App.route(); Toast.show({title:'Demo workspace loaded', desc:'Explore freely — then “Start fresh” when you want your own space.', tone:'info'}); }; } });
    };
    $('#stStartFresh').onclick = () => {
      Modal.open({ title:'Start fresh?',
        body:'<p class="muted small">This permanently clears all subjects, sessions, tasks, exams, events, notes and XP from this workspace. Your name, preferences and tutor settings are kept.</p>',
        footer:'<button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-danger" id="rstOk">Clear everything</button>',
        onMount(el, api){ el.querySelector('[data-close]').onclick=()=>api.close();
          el.querySelector('#rstOk').onclick=()=>{ api.close(); Store.startFresh(); location.hash = '#/home'; App.route(); Toast.show({title:'Fresh start', desc:'Your workspace is clean — add your first subject to begin.', tone:'info'}); }; } });
    };
    Charts.ringTick(root);
    Reveal.init(root);
  }
};
