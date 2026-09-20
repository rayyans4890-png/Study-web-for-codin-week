/* ============================================================
   StudyOS — charts.js
   Small refined SVG chart set: ring · bars · donut · heatmap · area · sparkline
   ============================================================ */

const Charts = {
  _gid: 0,
  _id(p){ return p + '-' + (++this._gid); },

  /* circular progress ring; pct 0-100 */
  ring({size=120, stroke=9, pct=0, num='', sub='', colors=['#337354','#7FA98C'], cls=''}={}){
    const id = this._id('rg'), r = (size - stroke)/2 - 1, c = 2*Math.PI*r;
    const off = c * (1 - clamp(pct,0,100)/100);
    return `<div class="ring ${cls}" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <defs><linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colors[0]}"/><stop offset="100%" stop-color="${colors[1]}"/>
        </linearGradient></defs>
        <circle class="track" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke-width="${stroke}"/>
        <circle class="val" data-off="${off}" data-c="${c}" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke-width="${stroke}"
          style="stroke:url(#${id});stroke-dasharray:${c};stroke-dashoffset:${c}"/>
      </svg>
      <div class="ring-c">
        ${num?`<div class="ring-num" style="font-size:${Math.round(size/5.2)}px">${num}</div>`:''}
        ${sub?`<div class="ring-sub">${sub}</div>`:''}
      </div>
    </div>`;
  },
  /* animate ring dashoffset after mount */
  ringTick(root=document){
    $$('.ring .val', root).forEach(v=>{
      requestAnimationFrame(()=>requestAnimationFrame(()=>{ v.style.strokeDashoffset = v.dataset.off; }));
    });
  },

  /* vertical bars: data [{label, value, today?, ghost?}] */
  bars({data, max=null, goal=null, valueFmt=fmtMin, height=190}={}){
    const vals = data.map(d=>d.value);
    const mx = Math.max(max || 0, ...vals, goal || 0, 1);
    const cols = data.map(d=>{
      const h = Math.max(2.5, (d.value/mx)*100);
      return `<div class="bc-col" data-reveal>
        <span class="bc-v">${d.value>0?valueFmt(d.value):''}</span>
        <div class="bc-bar ${d.today?'today':''} ${d.ghost?'ghost':''}" style="height:${h}%" title="${esc(d.label)}: ${d.value}"></div>
        <span class="bc-l">${esc(d.label)}</span>
      </div>`;
    }).join('');
    const goalLine = goal ? `<div style="position:relative;height:0">
      <div style="position:absolute;left:0;right:0;bottom:${(goal/mx)*100}%;border-top:1.5px dashed var(--gold);z-index:2" title="Goal ${goal}m"></div></div>` : '';
    return `<div class="bar-chart" style="height:${height}px">${cols}${goalLine}</div>`;
  },
  barsIn(root){
    $$('.bar-chart', root).forEach(ch=>{
      const io = new IntersectionObserver(es=>{ es.forEach(e=>{ if (e.isIntersecting){
        $$('.bc-col', ch).forEach((c,i)=>setTimeout(()=>c.classList.add('in'), i*70)); io.disconnect(); } }); },{threshold:.3});
      io.observe(ch);
    });
  },

  /* donut: segments [{label, value, color}] */
  donut({segments, size=176, thickness=21, center='', centerSub=''}={}){
    const id = this._id('dg'), r = (size - thickness)/2 - 2, c = 2*Math.PI*r;
    const total = segments.reduce((a,s)=>a+s.value,0) || 1;
    const gap = segments.length > 1 ? 2.5 : 0;
    let acc = 0;
    const arcs = segments.map(s=>{
      const frac = s.value/total, len = Math.max(0, frac*c - gap), off = -acc*c;
      acc += frac;
      return `<circle class="dseg" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${thickness}"
        stroke-dasharray="0 ${c}" data-dash="${len} ${c-len}" data-off="${off}" style="transition:stroke-dasharray 1s var(--ease-out)"/>`;
    }).join('');
    return `<div style="display:flex;flex-direction:column;align-items:center">
      <div class="ring" style="width:${size}px;height:${size}px">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${arcs}</svg>
        <div class="ring-c"><div class="ring-num" style="font-size:${Math.round(size/6.4)}px">${center}</div>
        ${centerSub?`<div class="ring-sub">${centerSub}</div>`:''}</div>
      </div></div>`;
  },
  donutIn(root){
    $$('.dseg', root).forEach((s,i)=>setTimeout(()=>{ s.setAttribute('stroke-dasharray', s.dataset.dash); s.setAttribute('stroke-dashoffset', s.dataset.off); }, 150 + i*90));
  },

  /* activity heatmap (GitHub-style, elegant): days [{date, min}] */
  heatmap({days, weeks=13, goal=120}={}){
    /* align to weeks grid ending this week */
    const today = D.today();
    const end = D.addDays(D.startOfWeek(today), 6); /* saturday of current week */
    const start = D.addDays(end, -(weeks*7 - 1));
    const map = {}; days.forEach(d=>map[d.date]=d.min);
    let cells = '', monthMarks = [];
    for (let w=0; w<weeks; w++){
      for (let d=0; d<7; d++){
        const k = D.addDays(start, w*7+d);
        const min = map[k] || 0;
        const l = min === 0 ? 0 : min >= goal ? 4 : min >= goal*0.66 ? 3 : min >= goal*0.33 ? 2 : 1;
        const future = k > today;
        const tt = `${D.fmtMedium(k)} — ${min ? fmtMin(min) : 'No study'}`;
        cells += `<span class="hm-c" data-l="${l}" ${future?'style="opacity:.35"':''} title="${tt}"></span>`;
      }
      const wkStart = D.addDays(start, w*7);
      if (D.parse(wkStart).getDate() <= 7) monthMarks.push({w, m:D.parse(wkStart).toLocaleDateString('en-US',{month:'short'})});
    }
    const labels = ['S','M','T','W','T','F','S'].map((l,i)=>`<span style="grid-row:${i+1};font-size:9.5px;color:var(--ink-4);padding-right:2px">${l}</span>`).join('');
    return `<div style="display:flex;gap:8px">${labels}<div><div class="heatmap">${cells}</div>
      <div style="display:flex;gap:5px;margin-top:10px;align-items:center">
        <span class="heatmap-cap">Less</span>
        <span class="hm-c" data-l="0" style="width:9px;height:9px"></span><span class="hm-c" data-l="1" style="width:9px;height:9px"></span>
        <span class="hm-c" data-l="2" style="width:9px;height:9px"></span><span class="hm-c" data-l="3" style="width:9px;height:9px"></span>
        <span class="hm-c" data-l="4" style="width:9px;height:9px"></span><span class="heatmap-cap">More</span>
      </div></div></div>`;
  },

  /* smooth area/line: points [{label, value}] */
  area({points, height=170, stroke='#337354', fill1='rgba(51,115,84,.16)', fill2='rgba(51,115,84,0)', valueFmt=fmtMin}={}){
    const id = this._id('ag'), w = 640, pad = {t:12, b:26, l:8, r:8};
    const vals = points.map(p=>p.value), mx = Math.max(...vals, 1), mn = 0;
    const iw = w - pad.l - pad.r, ih = height - pad.t - pad.b;
    const X = i => pad.l + (points.length === 1 ? iw/2 : (i/(points.length-1))*iw);
    const Y = v => pad.t + ih - ((v - mn)/(mx - mn))*ih;
    let d = `M ${X(0)} ${Y(vals[0])}`;
    for (let i=0;i<points.length-1;i++){
      const x0=X(i), y0=Y(vals[i]), x1=X(i+1), y1=Y(vals[i+1]), cx=(x0+x1)/2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    const areaD = d + ` L ${X(points.length-1)} ${pad.t+ih} L ${X(0)} ${pad.t+ih} Z`;
    const labels = points.map((p,i)=> (points.length <= 8 || i % Math.ceil(points.length/7) === 0)
      ? `<text x="${X(i)}" y="${height-6}" text-anchor="middle" font-size="10" fill="var(--ink-4)" font-family="Inter">${esc(p.label)}</text>` : '').join('');
    const dots = points.map((p,i)=>`<circle cx="${X(i)}" cy="${Y(vals[i])}" r="3" fill="var(--surface)" stroke="${stroke}" stroke-width="2" opacity="${i===points.length-1?1:.45}"/>`).join('');
    return `<svg viewBox="0 0 ${w} ${height}" style="width:100%;height:auto">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${fill1}"/><stop offset="100%" stop-color="${fill2}"/>
      </linearGradient></defs>
      <path class="apath" d="${areaD}" fill="url(#${id})" opacity="0" style="transition:opacity 1s .3s var(--ease-out)"/>
      <path class="apath" d="${d}" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"
        stroke-dasharray="2400" stroke-dashoffset="2400" style="transition:stroke-dashoffset 1.4s var(--ease-out)"/>
      ${dots}${labels}</svg>`;
  },
  areaIn(root){
    $$('.apath', root).forEach(p=>{
      const io = new IntersectionObserver(es=>{ es.forEach(e=>{ if (e.isIntersecting){
        if (p.tagName === 'path' && p.getAttribute('fill') !== 'none') p.style.opacity = 1;
        else p.style.strokeDashoffset = 0;
        io.disconnect(); } }); },{threshold:.35});
      io.observe(p);
    });
  },

  /* tiny sparkline for cards */
  sparkline({values, color='#337354', height=34}={}){
    const w = 120, mx = Math.max(...values, 1);
    const X = i => (i/(values.length-1))*w, Y = v => height - 3 - (v/mx)*(height-7);
    let d = `M ${X(0)} ${Y(values[0])}`;
    for (let i=0;i<values.length-1;i++){ const cx=(X(i)+X(i+1))/2; d += ` Q ${cx} ${Y(values[i])}, ${cx} ${(Y(values[i])+Y(values[i+1]))/2} T ${X(i+1)} ${Y(values[i+1])}`; }
    return `<svg class="sparkline" viewBox="0 0 ${w} ${height}" preserveAspectRatio="none" style="height:${height}px">
      <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" opacity=".85"/></svg>`;
  }
};
