/* ============================================================
   StudyOS — views/tutor.js
   AI study tutor: conversations · streaming chat · study context
   Uses an OpenAI-compatible endpoint with YOUR key (placeholder:
   YOUR_AI_API_KEY). Demo mode works with no key at all.
   ============================================================ */
Views.tutor = {
  title: 'AI Tutor', crumb: 'A tutor that knows your context', icon: 'sparkles',
  convId: null, _abort: null, _busy: false,

  render(root){
    const T = Store.state.tutor;
    if (!this.convId || !T.conversations.find(c=>c.id===this.convId)) this.convId = T.conversations[0]?.id || null;
    root.innerHTML = `
    <div class="tutor-layout">
      <aside class="tutor-side">
        <div class="ts-head"><button class="btn btn-secondary btn-block btn-sm" id="tvNew">${ic('plus')} New conversation</button></div>
        <div class="ts-list" id="tvConvList"></div>
        <div style="padding:10px 12px;border-top:1px solid var(--line-soft)">
          <button class="btn btn-ghost btn-sm btn-block" id="tvCfg">${ic('key')} API settings</button>
        </div>
      </aside>
      <div class="tutor-main">
        <div class="tutor-scroll" id="tvScroll"></div>
        <div class="composer">
          <div class="cp-tools" id="tvTools"></div>
          <div class="cp-in">
            <textarea id="tvInput" rows="1" placeholder="Ask anything about what you're studying…" aria-label="Message the tutor"></textarea>
            <button class="cp-send" id="tvSend" aria-label="Send">${ic('send')}</button>
          </div>
        </div>
      </div>
      <aside class="tutor-ctx" id="tvCtx"></aside>
    </div>`;
    this.paintConvList(); this.paintChat(); this.paintCtx(); this.paintTools();

    $('#tvNew').onclick = () => { this.convId = null; this.paintConvList(); this.paintChat(); $('#tvInput').focus(); };
    $('#tvCfg').onclick = () => TutorCfg.open();
    const input = $('#tvInput');
    input.addEventListener('input', () => autoGrow(input));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); this.send(); }
    });
    $('#tvSend').onclick = () => this.send();
  },

  /* ---------------- panels ---------------- */
  paintConvList(){
    const T = Store.state.tutor;
    $('#tvConvList').innerHTML = T.conversations.map(c=>`
      <div class="tutor-conv ${c.id===this.convId?'on':''}" data-conv="${c.id}">
        <div class="tc-t">${esc(c.title)}</div>
        <div class="tc-s">${c.messages.length} messages · ${D.fmtShort(c.createdAt)}</div>
        <button class="tc-x" data-del="${c.id}" aria-label="Delete conversation">${ic('x')}</button>
      </div>`).join('') || `<p class="tiny muted-2" style="padding:10px 12px">No conversations yet.</p>`;
    $$('#tvConvList [data-conv]').forEach(el => el.onclick = e => {
      if (e.target.closest('[data-del]')) return;
      this.convId = el.dataset.conv; this.paintConvList(); this.paintChat();
    });
    $$('#tvConvList [data-del]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      Store.state.tutor.conversations = Store.state.tutor.conversations.filter(c=>c.id!==b.dataset.del);
      if (this.convId === b.dataset.del) this.convId = null;
      Store.commit(); this.paintConvList(); this.paintChat();
    });
  },

  paintTools(){
    const cfg = Store.state.tutor.config;
    const hasKey = !!cfg.apiKey;
    $('#tvTools').innerHTML = `
      <span class="badge ${hasKey?'badge-green':'badge-amber'}">${ic('key')} ${hasKey ? esc(cfg.model) + ' · connected' : 'Demo mode — add your API key'}</span>
      <span class="grow"></span>
      <button class="btn btn-ghost btn-sm" id="tvCfg2">${ic('settings')} Configure</button>`;
    $('#tvCfg2').onclick = () => TutorCfg.open();
  },

  paintCtx(){
    const next = Store.nextExam(), st = Store.streaks();
    const tops = Store.subjectStats(30).filter(s=>s.recentMin>0).sort((a,b)=>b.recentMin-a.recentMin).slice(0,4);
    $('#tvCtx').innerHTML = `
      <h4>${ic('sparkles')} Study context</h4>
      <label class="ctx-card row" style="cursor:pointer;gap:10px">
        <span class="switch"><input type="checkbox" id="tvCtxOn" ${Store.state.tutor.includeContext?'checked':''}><span class="track"></span><span class="thumb"></span></span>
        <span class="small" style="font-weight:600">Share my context</span>
      </label>
      <p class="tiny muted-2" style="margin:6px 2px 0">With this on, the tutor sees your subjects, exams and progress.</p>
      ${next ? `<h4>${ic('file-text')} Next exam</h4>
      <div class="ctx-card" data-goto="exams/${next.id}" style="cursor:pointer">
        <div class="cc-t">${esc(Store.subject(next.subjectId)?.name)} · ${esc(next.name)}</div>
        <div class="cc-s">${D.diffDays(next.date, D.today())} days left · ${Store.examPrep(next).pct}% prepared<br>${Store.examPrep(next).done}/${Store.examPrep(next).total} topics reviewed</div>
      </div>` : ''}
      ${tops.length ? `<h4>${ic('book')} Most studied · 30d</h4>
      ${tops.map(s=>`<div class="ctx-card"><div class="row gap8">
        <span class="sdot" style="color:${s.subject.color};background:${s.subject.color}"></span>
        <span class="cc-t grow">${esc(s.subject.name)}</span><span class="cc-s num-chip">${fmtMin(s.recentMin)}</span></div></div>`).join('')}` : ''}
      <h4>${ic('flame')} Momentum</h4>
      <div class="ctx-card"><div class="cc-t">${st.current}-day streak</div>
      <div class="cc-s">Level ${Store.level().level} · ${Store.level().title} · ${Store.todayMinutes()}/${Store.state.profile.dailyGoalMin} min today</div></div>
      ${Store.state.notes.length ? `<h4>${ic('notebook')} Notes</h4>
      ${Store.state.notes.slice(0,3).map(n=>`<div class="ctx-card" data-note="${n.id}" style="cursor:pointer">
        <div class="cc-t">${esc(n.title)}</div><div class="cc-s">${D.fmtShort(n.createdAt)}${n.source==='tutor'?' · from tutor':''}</div></div>`).join('')}` : ''}`;
    $('#tvCtxOn').onchange = e => { Store.state.tutor.includeContext = e.target.checked; Store.commit(); };
    $$('[data-goto]', $('#tvCtx')).forEach(c => c.onclick = () => App.nav(c.dataset.goto));
    $$('[data-note]', $('#tvCtx')).forEach(c => c.onclick = () => NotesUI.open(c.dataset.note));
  },

  paintChat(){
    const scroll = $('#tvScroll');
    const conv = Store.state.tutor.conversations.find(c=>c.id===this.convId);
    if (!conv || !conv.messages.length){
      scroll.innerHTML = `<div class="tutor-welcome">
        <span class="tw-ic">${ic('sparkles')}</span>
        <h3>What are we working on?</h3>
        <p>Your tutor can explain topics, quiz you, build study plans and turn anything into flashcards — with your exam dates in mind.</p>
        <div class="tutor-sugg">
          ${[['lightbulb','Explain a topic','Break down something from your syllabus'],
             ['help','Quiz me','Practice questions with answers'],
             ['layers','Flashcards','Term — definition pairs to memorize'],
             ['calendar','Study plan','A realistic schedule before your exam'],
             ['notebook','Summarize notes','Condense your saved notes'],
             ['pen','Homework help','Work through a problem step by step']].map(([i,t,d])=>
            `<button data-ask="${esc(t)}">${ic(i)}<span><b>${t}</b><span>${d}</span></span></button>`).join('')}
        </div>
      </div>`;
      $$('.tutor-sugg button', scroll).forEach(b => b.onclick = () => {
        $('#tvInput').value = b.dataset.ask + ' — ' + (
          { 'Explain a topic':'', 'Quiz me':'', 'Flashcards':'', 'Study plan':'for my next exam', 'Summarize notes':'', 'Homework help':'' }[b.dataset.ask] || '');
        $('#tvInput').focus();
        const suggestions = {
          'Explain a topic': 'Explain ' + (Store.nextExam() ? 'the toughest topic for my ' + Store.subject(Store.nextExam().subjectId)?.name + ' ' + Store.nextExam().name : 'a topic I should review'),
          'Quiz me': 'Quiz me with 5 questions on ' + (Store.nextExam() ? Store.subject(Store.nextExam().subjectId)?.name : 'my most studied subject'),
          'Flashcards': 'Create flashcards for ' + (Store.nextExam() ? Store.subject(Store.nextExam().subjectId)?.name + ' — ' + Store.nextExam().name : 'my notes'),
          'Study plan': 'Create a study plan for my next exam',
          'Summarize notes': 'Summarize my notes',
          'Homework help': 'Help me with my homework — I will paste the problem'
        };
        $('#tvInput').value = suggestions[b.dataset.ask] || b.dataset.ask;
        autoGrow($('#tvInput'));
      });
      return;
    }
    scroll.innerHTML = conv.messages.map((m,i) => m.role === 'user'
      ? `<div class="bubble-u">${esc(m.content)}</div>`
      : this.aiHTML(m.content, i)).join('');
    this.bindChatActions(scroll, conv);
    scroll.scrollTop = scroll.scrollHeight;
  },

  aiHTML(content, idx){
    return `<div class="msg-ai"><span class="ai-av">${ic('sparkles')}</span>
      <div class="ai-body"><div class="ai-name">StudyOS Tutor</div>
      <div class="ai-card">${MD.render(content)}
        <div class="ai-actions">
          <button data-act="Explain that more simply, like I'm completely new to it." data-msg="${idx}">${ic('lightbulb')}Explain simpler</button>
          <button data-act="Give me a worked example of that." data-msg="${idx}">${ic('pen')}Give an example</button>
          <button data-act="Quiz me on this — 5 questions, then answers." data-msg="${idx}">${ic('help')}Quiz me</button>
          <button data-act="Turn this into flashcards as a two-column table (term | definition)." data-msg="${idx}">${ic('layers')}Flashcards</button>
          <button data-note-save data-msg="${idx}">${ic('notebook')}Add to notes</button>
          <button data-copy data-msg="${idx}">${ic('copy')}Copy</button>
        </div></div></div></div>`;
  },

  bindChatActions(scroll, conv){
    scroll.onclick = e => {
      const act = e.target.closest('[data-act]');
      const note = e.target.closest('[data-note-save]');
      const copy = e.target.closest('[data-copy]');
      if (act){ $('#tvInput').value = act.dataset.act; this.send(); }
      else if (note){
        const m = conv.messages[+note.dataset.msg];
        if (m){ Store.addNote(m.content.split('\n').find(l=>l.replace('#','').trim())?.replace(/^#+\s*/,'').slice(0,60) || 'Tutor answer', m.content, 'tutor');
          Toast.show({ title:'Saved to notes', desc:'Find it in the context panel or ⌘K search.', tone:'success' }); }
      }
      else if (copy){
        const m = conv.messages[+copy.dataset.msg];
        if (m){ copyText(m.content); Toast.show({ title:'Copied to clipboard', tone:'info', duration:2000 }); }
      }
    };
  },

  /* ---------------- send / receive ---------------- */
  async send(){
    if (this._busy) return;
    const input = $('#tvInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = ''; autoGrow(input);

    const T = Store.state.tutor;
    let conv = T.conversations.find(c=>c.id===this.convId);
    if (!conv){
      conv = { id:uid(), title: text.slice(0,42) + (text.length>42?'…':''), createdAt: D.today(), messages: [] };
      T.conversations.unshift(conv); this.convId = conv.id;
    }
    conv.messages.push({ role:'user', content:text, ts:Date.now() });
    Store.commit();
    this.paintConvList(); this.paintChat();

    /* typing indicator */
    const scroll = $('#tvScroll');
    scroll.insertAdjacentHTML('beforeend', `<div class="msg-ai" id="tvTyping"><span class="ai-av">${ic('sparkles')}</span>
      <div class="ai-body"><div class="ai-name">StudyOS Tutor</div>
      <div class="ai-card"><span class="typing"><i></i><i></i><i></i></span></div></div></div>`);
    scroll.scrollTop = scroll.scrollHeight;
    this._busy = true; $('#tvSend').disabled = true;

    let full = '';
    const onDelta = d => {
      full += d;
      const t = $('#tvTyping');
      if (t && !$('#tvStream', scroll)){
        t.outerHTML = `<div class="msg-ai" id="tvStream"><span class="ai-av">${ic('sparkles')}</span>
          <div class="ai-body"><div class="ai-name">StudyOS Tutor</div><div class="ai-card"><div class="md" id="tvStreamMd"></div></div></div></div>`;
      }
      const md = $('#tvStreamMd', scroll);
      if (md){ md.innerHTML = MD.render(full); scroll.scrollTop = scroll.scrollHeight; }
    };
    try {
      await TutorAPI.chat(conv, onDelta);
    } catch(err){
      console.warn('Tutor API error:', err);
      const t = $('#tvTyping') || $('#tvStream');
      if (t) t.outerHTML = `<div class="msg-ai"><span class="ai-av">${ic('sparkles')}</span>
        <div class="ai-body"><div class="ai-name">StudyOS Tutor</div>
        <div class="ai-card"><div class="msg-err">${ic('alert')}<div><b>Couldn't reach the tutor.</b><br>
        <span class="small">${esc(err.message || 'Unknown error')} — check your API key and endpoint in settings, or use demo mode.</span></div></div></div></div></div>`;
      this._busy = false; $('#tvSend').disabled = false;
      scroll.scrollTop = scroll.scrollHeight;
      return;
    }
    conv.messages.push({ role:'assistant', content: full, ts:Date.now() });
    Store.commit();
    this._busy = false; $('#tvSend').disabled = false;
    this.paintChat();
  }
};

/* ============================================================
   API client — OpenAI-compatible chat completions with streaming
   ============================================================ */
const TutorAPI = {
  systemPrompt(){
    const ctx = [];
    if (Store.state.tutor.includeContext){
      const p = Store.state.profile, st = Store.streaks();
      const next = Store.nextExam();
      const subj = Store.subjectStats(30).filter(s=>s.recentMin>0).sort((a,b)=>b.recentMin-a.recentMin)
        .map(s=>`${s.subject.name} (${fmtMin(s.recentMin)} in 30 days)`).join(', ');
      ctx.push(`Student name: ${p.name}. Daily study goal: ${p.dailyGoalMin} minutes. Current streak: ${st.current} days.`);
      if (subj) ctx.push(`Subjects and recent study time: ${subj}.`);
      if (next) ctx.push(`Next exam: ${Store.subject(next.subjectId)?.name} ${next.name} in ${D.diffDays(next.date, D.today())} days (${Store.examPrep(next).pct}% prepared; weakest topics: ${next.topics.filter(t=>!t.done).slice(0,5).map(t=>t.name).join(', ') || 'unknown'}).`);
      if (Store.state.notes.length) ctx.push(`The student has saved notes titled: ${Store.state.notes.slice(0,5).map(n=>n.title).join('; ')}.`);
    }
    return `You are the StudyOS Tutor — a warm, precise study assistant for a high-school or university student. Prefer structured markdown: short headings, numbered steps, bold key terms, small tables when helpful, and fenced code blocks for technical content. Use $$...$$ for important equations. Be concise but complete — teach, don't lecture. End with a short follow-up question or a quick check of understanding when it helps. Never invent facts about the student; use the context below.\n\nSTUDENT CONTEXT:\n${ctx.join('\n') || 'No context shared.'}`;
  },

  async chat(conv, onDelta){
    const cfg = Store.state.tutor.config;
    const messages = [ { role:'system', content: this.systemPrompt() },
      ...conv.messages.slice(-12).map(m=>({ role:m.role, content:m.content })) ];

    if (!cfg.apiKey || cfg.apiKey === 'YOUR_AI_API_KEY'){
      await DemoTutor.respond(conv.messages[conv.messages.length-1]?.content || '', onDelta);
      return;
    }
    const ctrl = new AbortController();
    Views.tutor._abort = ctrl;
    const base = (cfg.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/,'');
    const res = await fetch(base + '/chat/completions', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + cfg.apiKey },
      body: JSON.stringify({ model: cfg.model || 'gpt-4o-mini', messages, stream:true, temperature:0.5 }),
      signal: ctrl.signal
    });
    if (!res.ok){
      let msg = 'HTTP ' + res.status;
      try { const j = await res.json(); msg = j.error?.message || msg; } catch(e){}
      throw new Error(msg);
    }
    const reader = res.body.getReader(), dec = new TextDecoder();
    let buf = '';
    while (true){
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream:true });
      const lines = buf.split('\n'); buf = lines.pop() || '';
      for (const line of lines){
        const s = line.trim();
        if (!s.startsWith('data:')) continue;
        const payload = s.slice(5).trim();
        if (payload === '[DONE]') continue;
        try { const j = JSON.parse(payload); const d = j.choices?.[0]?.delta?.content; if (d) onDelta(d); } catch(e){}
      }
    }
    Views.tutor._abort = null;
  }
};

/* ============================================================
   Demo tutor — structured, context-aware responses with no key
   ============================================================ */
const DemoTutor = {
  async respond(prompt, onDelta){
    const next = Store.nextExam();
    const subj = next ? Store.subject(next.subjectId) : null;
    const p = prompt.toLowerCase();
    let out;

    if (/quiz|test me|practice question/.test(p)){
      const topics = next ? next.topics.filter(t=>!t.done).slice(0,5).map(t=>t.name) : ['Key definitions','Core principles','Worked examples','Common mistakes','Applications'];
      out = `#### Quick quiz — ${subj ? esc(subj.name) : 'mixed topics'}\n\n${topics.map((t,i)=>`
**${i+1}. ${esc(t)}**
- *(a)* One plausible-sounding option
- *(b)* The right idea, stated carefully
- *(c)* A common misconception

> Answer: **b** — and here's why in one line: the careful statement survives the edge cases.\n`).join('\n')}
---
*You're in **demo mode** — add your API key in Tutor settings for real, personalized questions.*`;
    }
    else if (/flashcard|memorize/.test(p)){
      const topics = next ? next.topics.slice(0,6).map(t=>t.name) : ['Active recall','Spaced repetition','Interleaving','Elaboration','Feynman technique','Dual coding'];
      out = `#### Flashcards — ${subj ? esc(subj.name) : 'study techniques'}\n\n| Term | Definition |\n|---|---|\n${topics.map(t=>`| ${esc(t)} | *Say it in one sentence, out loud, before flipping.* |`).join('\n')}\n\n**How to use these:** cover the right column, recall aloud, check, repeat tomorrow — then in three days.\n\n*Demo mode — configure a key for AI-generated cards from your actual notes.*`;
    }
    else if (/plan|schedule/.test(p)){
      const days = next ? D.diffDays(next.date, D.today()) : 14;
      const per = next ? Math.max(1, Math.ceil(next.topics.filter(t=>!t.done).length / Math.max(1, days-2))) : 2;
      out = `#### Study plan — ${subj ? esc(subj.name)+' '+esc(next.name) : 'general'} (${days} days out)\n\n| Days | Focus | Session |\n|---|---|---|\n| 1–${Math.ceil(days*0.4)} | Cover ${per} new topics per day | 2 × 45 min |\n| ${Math.ceil(days*0.4)+1}–${days-2} | Active recall + practice problems | 2 × 50 min |\n| Last 2 days | Past paper, weak spots, sleep | 1 × 90 min |\n\n**Three rules that make the plan work**\n1. Morning block for the hardest topic — attention is freshest.\n2. End every session by writing one line: *what do I now understand?*\n3. Never skip twice in a row.\n\n> With your ${Store.streaks().current}-day streak, you already have momentum. Protect it.\n\n*Demo mode — with an API key this plan adapts to your exact topics and progress.*`;
    }
    else if (/summar/.test(p)){
      const notes = Store.state.notes.filter(n=>n.source!=='session').slice(0,3);
      out = `#### Summary of your notes\n\n${notes.length ? notes.map(n=>`**${esc(n.title)}**\n${n.body.split('\n').slice(0,3).map(l=>'- '+esc(l.replace(/[*#]/g,''))).join('\n')}`).join('\n\n') : 'You have no saved notes yet — save tutor answers with "Add to notes" and they condense here.'}\n\n**The pattern to remember:** every summary should shrink by half each time you re-read it — until only the skeleton remains.\n\n*Demo mode summary.*`;
    }
    else {
      const topic = next ? next.topics.filter(t=>!t.done)[0]?.name || 'your next chapter' : 'the topic you asked about';
      out = `#### ${esc(topic).replace(/^\w/, c=>c.toUpperCase())} — the essential shape\n\n**In one sentence:** start from what it *is*, then what it *does*, then where it *breaks*.\n\n1. **What it is** — the definition, in your own words. If you can't rewrite it simply, you haven't learned it yet.\n2. **What it does** — one worked example, done slowly, with every step justified out loud.\n3. **Where it breaks** — the edge case or trap that exams love.\n\n$$\\text{understanding} = \\text{explain it} + \\text{use it} + \\text{break it}$$\n\n> Try this now: explain ${esc(topic)} to an imaginary friend in 60 seconds. Where you stumble is exactly where to study.\n\n---\n*You're seeing **demo mode** — a real answer needs your API key (placeholder: \`YOUR_AI_API_KEY\` in Tutor settings).*`;
    }

    /* stream it out for the live-typing feel */
    const chunks = out.match(/[\s\S]{1,7}/g) || [];
    for (const c of chunks){
      onDelta(c);
      await new Promise(r=>setTimeout(r, 8));
    }
  }
};

/* ============================================================
   Tutor configuration modal + Notes modal
   ============================================================ */
const TutorCfg = {
  open(){
    const cfg = Store.state.tutor.config;
    Modal.open({
      title: 'AI tutor settings',
      body: `
        <p class="small muted" style="line-height:1.6;margin-top:-4px">The tutor calls an OpenAI-compatible endpoint directly from your browser. Your key is stored only in this browser's local storage — never on a server.</p>
        <div class="field"><label>API key</label>
          <div style="position:relative">
            <input class="input" type="password" id="tcKey" value="${esc(cfg.apiKey)}" placeholder="YOUR_AI_API_KEY" autocomplete="off" style="padding-right:42px">
            <button class="icon-btn sm" id="tcEye" style="position:absolute;right:5px;top:50%;transform:translateY(-50%)" aria-label="Show key">${ic('eye')}</button>
          </div>
          <span class="tiny muted-2">Works with OpenAI, OpenRouter, Groq, Together, or a local server.</span></div>
        <div class="form-row">
          <div class="field"><label>Base URL</label><input class="input" id="tcUrl" value="${esc(cfg.baseUrl)}" placeholder="https://api.openai.com/v1"></div>
          <div class="field"><label>Model</label><input class="input" id="tcModel" value="${esc(cfg.model)}" placeholder="gpt-4o-mini"></div>
        </div>`,
      footer: `<button class="btn btn-secondary" id="tcDemo">Use demo mode</button>
        <button class="btn btn-primary" id="tcSave">${ic('check')} Save</button>`,
      onMount(el, api){
        let shown = false;
        $('#tcEye', el).onclick = () => { shown = !shown; $('#tcKey', el).type = shown ? 'text' : 'password'; $('#tcEye', el).innerHTML = ic(shown ? 'eye-off' : 'eye'); };
        $('#tcDemo', el).onclick = () => { cfg.apiKey = ''; Store.commit(); api.close();
          Toast.show({ title:'Demo mode on', desc:'The tutor will respond with built-in examples.', icon:'info', tone:'info' }); };
        $('#tcSave', el).onclick = () => {
          const key = $('#tcKey', el).value.trim(), url = $('#tcUrl', el).value.trim(), model = $('#tcModel', el).value.trim();
          cfg.apiKey = key; cfg.baseUrl = url || 'https://api.openai.com/v1'; cfg.model = model || 'gpt-4o-mini';
          Store.commit(); api.close();
          Toast.show({ title: key ? 'Key saved — tutor connected' : 'Saved (demo mode)', desc: key ? 'Model: ' + cfg.model : 'Add a key any time.', tone:'success' });
        };
      }
    });
  }
};

/* Notes modal — reachable from context panel & command palette */
const NotesUI = {
  open(id){
    const n = Store.note(id); if (!n) return;
    Modal.open({
      title: esc(n.title),
      body: `<div class="md" style="font-size:13.5px">${MD.render(n.body)}</div>
        <div class="tiny muted-2" style="border-top:1px solid var(--line-soft);padding-top:12px">Saved ${D.fmtMedium(n.createdAt)} · ${n.source === 'tutor' ? 'from AI tutor' : n.source === 'session' ? 'session goal' : 'manual note'}</div>`,
      footer: `<button class="btn btn-danger" id="nDel" style="margin-right:auto">${ic('trash')} Delete</button>
        <button class="btn btn-primary" data-close>Done</button>`,
      onMount(el, api){
        el.querySelector('[data-close]').onclick = () => api.close();
        $('#nDel', el).onclick = () => { Store.deleteNote(id); api.close(); Toast.show({title:'Note deleted', tone:'info'}); };
      }
    });
  }
};
