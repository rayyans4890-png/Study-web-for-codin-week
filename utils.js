/* StudyOS — utils.js · helpers, event bus, toast, modal, confetti, audio */

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4);
const clamp = (v,a,b) => Math.min(b, Math.max(a, v));

/* view registry (populated by js/views/*.js, consumed by the router) */
const Views = {};

/* ---------- event bus ---------- */
const Bus = (()=>{ const m = {}; return {
  on(e,f){ (m[e] = m[e] || []).push(f); return ()=>Bus.off(e,f); },
  off(e,f){ m[e] = (m[e]||[]).filter(x=>x!==f); },
  emit(e,...a){ (m[e]||[]).slice().forEach(f=>{ try{f(...a);}catch(err){console.error(err);} }); }
};})();

/* ---------- dates ---------- */
const D = {
  key(d){ const x = new Date(d); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0'); },
  today(){ return D.key(new Date()); },
  parse(k){ const [y,m,d] = k.split('-').map(Number); return new Date(y, m-1, d); },
  addDays(k,n){ const d = D.parse(k); d.setDate(d.getDate()+n); return D.key(d); },
  diffDays(a,b){ return Math.round((D.parse(a) - D.parse(b)) / 864e5); },
  startOfWeek(k){ const d = D.parse(k); d.setDate(d.getDate() - d.getDay()); return D.key(d); }, /* Sunday */
  addMonths(k,n){ const d = D.parse(k); d.setMonth(d.getMonth()+n); return D.key(d); },
  fmtLong(k){ return D.parse(k).toLocaleDateString('en-US',{weekday:'long', month:'long', day:'numeric'}); },
  fmtMedium(k){ return D.parse(k).toLocaleDateString('en-US',{weekday:'short', month:'short', day:'numeric'}); },
  fmtShort(k){ return D.parse(k).toLocaleDateString('en-US',{month:'short', day:'numeric'}); },
  dayName(k){ return D.parse(k).toLocaleDateString('en-US',{weekday:'short'}); },
  monthTitle(k){ return D.parse(k).toLocaleDateString('en-US',{month:'long', year:'numeric'}); },
  relTime(k){
    const days = D.diffDays(D.today(), k);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    if (days > 1 && days < 7) return 'In ' + days + ' days';
    if (days < 0) return Math.abs(days) + ' days ago';
    return D.fmtShort(k);
  },
  nowTime(){ const d = new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); },
  greeting(){ const h = new Date().getHours(); return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 22 ? 'Good evening' : 'Up late'; }
};
const fmtMin = m => { m = Math.round(m); const h = Math.floor(m/60), r = m%60; return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r}m`; };
const fmtClock = s => { s = Math.max(0, Math.floor(s)); const m = Math.floor(s/60), ss = s%60; return String(m).padStart(2,'0')+':'+String(ss).padStart(2,'0'); };
const fmtHM = min => { const h = Math.floor(min/60), m = Math.round(min%60); return h ? `${h}:${String(m).padStart(2,'0')}` : `${m}m`; };

/* ---------- toast ---------- */
const Toast = {
  show({title, desc='', tone='info', icon, duration=4200}={}){
    const root = $('#toasts'); if (!root) return;
    if (Store?.state?.profile?.notifOff) return;
    const icons = { success:'check-circle', info:'info', xp:'zap', gold:'award', warn:'alert' };
    const t = document.createElement('div');
    t.className = 'toast ' + tone;
    t.innerHTML = `<div class="t-ic">${ic(icon || icons[tone] || 'info')}</div>
      <div class="grow"><h4>${esc(title)}</h4>${desc?`<p>${esc(desc)}</p>`:''}</div>
      <button class="icon-btn sm t-x" aria-label="Dismiss">${ic('x')}</button>`;
    root.appendChild(t);
    const kill = () => { t.classList.add('out'); setTimeout(()=>t.remove(), 320); };
    t.querySelector('.t-x').onclick = kill;
    if (root.children.length > 3) root.firstElementChild.remove();
    if (duration) setTimeout(kill, duration);
  }
};

/* ---------- modal ---------- */
const Modal = {
  stack: [],
  open({title, body, footer, size='', onMount, dismissable=true}){
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${esc(title||'Dialog')}">
      <div class="modal-head"><h3>${title||''}</h3><button class="icon-btn m-x" aria-label="Close">${ic('x')}</button></div>
      <div class="modal-body">${body||''}</div>
      ${footer?`<div class="modal-foot">${footer}</div>`:''}
    </div>`;
    $('#overlays').appendChild(ov);
    const api = { el: ov, close(){ ov.remove(); Modal.stack = Modal.stack.filter(m=>m!==api); document.body.style.overflow=''; } };
    ov.querySelector('.m-x').onclick = () => dismissable && api.close();
    if (dismissable) ov.addEventListener('mousedown', e => { if (e.target === ov) api.close(); });
    document.body.style.overflow = 'hidden';
    Modal.stack.push(api);
    onMount && onMount(ov, api);
    setTimeout(()=>{ const f = ov.querySelector('input,textarea,select,button.btn-primary'); f && f.focus(); }, 60);
    return api;
  },
  closeAll(){ this.stack.slice().forEach(m=>m.close()); }
};
document.addEventListener('keydown', e => { if (e.key === 'Escape') Modal.closeAll(); });

/* ---------- count up ---------- */
function countUp(el, to, {dur=950, fmt=v=>Math.round(v), from=null}={}){
  if (!el) return;
  const reduce = document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = from ?? (parseFloat(el.dataset.v) || 0);
  if (reduce || start === to){ el.textContent = fmt(to); el.dataset.v = to; return; }
  const t0 = performance.now();
  (function tick(t){
    const p = clamp((t - t0)/dur, 0, 1), e = 1 - Math.pow(1-p, 3);
    el.textContent = fmt(start + (to-start)*e);
    if (p < 1) requestAnimationFrame(tick); else el.dataset.v = to;
  })(t0);
}

/* ---------- confetti ---------- */
const Confetti = (()=>{
  let cv, ctx, parts = [], raf = null;
  function ensure(){
    if (cv) return;
    cv = document.createElement('canvas'); cv.className = 'confetti-canvas';
    document.body.appendChild(cv); ctx = cv.getContext('2d');
    const fit = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); };
    fit(); addEventListener('resize', fit);
  }
  function loop(){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    parts = parts.filter(p => p.life < 1 && p.y < innerHeight + 40);
    for (const p of parts){
      p.vy += 0.16; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life += 0.006;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = clamp(1 - p.life*1.2, 0, 1); ctx.fillStyle = p.c;
      ctx.fillRect(-p.s/2, -p.s/2, p.s, p.s*0.62); ctx.restore();
    }
    if (parts.length) raf = requestAnimationFrame(loop); else { raf = null; ctx.clearRect(0,0,innerWidth,innerHeight); }
  }
  return {
    burst(x=innerWidth/2, y=innerHeight*0.42, n=70){
      const reduce = document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;
      ensure();
      const colors = ['#2D6A4F','#7FA98C','#D8BC72','#B08A34','#F2EEDF','#4E8A6B'];
      for (let i=0;i<n;i++){
        const a = Math.random()*Math.PI*2, sp = 3 + Math.random()*7;
        parts.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 4.5, s: 4.5+Math.random()*5,
          rot: Math.random()*Math.PI, vr: (Math.random()-.5)*.3, c: colors[i%colors.length], life: 0 });
      }
      if (!raf) loop();
    }
  };
})();

/* ---------- ambient audio (synthesized, no assets) ---------- */
const AmbientAudio = (()=>{
  let ctx = null, src = null, gain = null, filter = null, playing = false;
  function ensure(){
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
  }
  return {
    toggle(on){
      if (on){ this.start(); } else { this.stop(); }
    },
    start(){
      ensure(); if (!ctx || playing) return;
      if (ctx.state === 'suspended') ctx.resume();
      const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), data = buf.getChannelData(0);
      let last = 0;
      for (let i=0;i<len;i++){ const w = Math.random()*2-1; last = (last + 0.02*w)/1.02; data[i] = last*3.2; }
      src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 420;
      gain = ctx.createGain(); gain.gain.value = 0;
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination); src.start();
      gain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 1.2);
      playing = true;
    },
    stop(){
      if (!playing) return;
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      const s = src; setTimeout(()=>{ try{s.stop();}catch(e){} }, 700);
      playing = false;
    },
    get playing(){ return playing; },
    chime(kind='done'){
      ensure(); if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const notes = kind === 'level' ? [392, 494, 587, 784] : [523.25, 659.25, 783.99];
      notes.forEach((f, i)=>{
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        const t = ctx.currentTime + i*0.14;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t+0.03); g.gain.exponentialRampToValueAtTime(0.001, t+1.1);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t+1.2);
      });
    }
  };
})();

/* ---------- reveal on scroll ---------- */
const Reveal = {
  io: null,
  init(root=document){
    if (!this.io){
      this.io = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting){ en.target.classList.add('revealed'); this.io.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    }
    $$('[data-reveal]:not(.revealed)', root).forEach(el => this.io.observe(el));
  },
  refresh(root){ this.init(root); }
};

/* ---------- misc ---------- */
function copyText(txt){
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(txt).catch(()=>{});
  const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta);
  ta.select(); try{ document.execCommand('copy'); }catch(e){} ta.remove();
  return Promise.resolve();
}
function downloadFile(name, content, type='application/json'){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], {type})); a.download = name;
  a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
}
function debounce(fn, ms=200){ let t; return (...a)=>{ clearTimeout(t); t = setTimeout(()=>fn(...a), ms); }; }
function stagger(nodes, base=0.08){ nodes.forEach((n,i)=> n.style.setProperty('--d', (i*base)+'s')); }
function autoGrow(ta){ ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 130) + 'px'; }
