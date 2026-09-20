/* ============================================================
   StudyOS — markdown.js
   Compact, safe markdown renderer for tutor responses
   ============================================================ */

const MD = {
  KEYWORDS: /\b(const|let|var|function|return|if|else|for|while|class|import|from|export|def|print|True|False|None|null|true|false|new|this|self|in|of|not|and|or|is|elif|try|except|with|as|lambda|public|private|static|void|int|float|double|str|string|bool|struct)\b/g,

  hl(code){
    let s = esc(code);
    s = s.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|`[^`\n]*`)/g, '<span class="str">$1</span>');
    s = s.replace(/(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)/g, m => `<span class="cmt">${m}</span>`);
    s = s.replace(this.KEYWORDS, '<span class="kw">$1</span>');
    s = s.replace(/\b(\d+\.?\d*)\b/g, '<span class="num">$1</span>');
    return s;
  },

  inline(s){
    return s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--g-600);text-decoration:underline">$1</a>');
  },

  render(src){
    if (!src) return '';
    let s = String(src).replace(/\r\n/g, '\n');
    const codeBlocks = [];
    s = s.replace(/```(\w*)\n?([\s\S]*?)```/g, (m, lang, code) => {
      codeBlocks.push({ lang: lang || 'code', code: code.replace(/\n$/, '') });
      return `\u0001${codeBlocks.length - 1}\u0001`;
    });
    const eqBlocks = [];
    s = s.replace(/\$\$([^$]+)\$\$/g, (m, eq) => { eqBlocks.push(eq.trim()); return `\u0002${eqBlocks.length - 1}\u0002`; });

    const lines = s.split('\n');
    const out = [];
    let list = null, para = [], table = null;

    const flushPara = () => { if (para.length){ out.push(`<p>${this.inline(para.join(' '))}</p>`); para = []; } };
    const flushList = () => { if (list){ out.push(`</${list}>`); list = null; } };
    const flushTable = () => {
      if (!table) return;
      const [head, ...rows] = table;
      out.push(`<table><thead><tr>${head.map(h=>`<th>${this.inline(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${this.inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      table = null;
    };
    const flushAll = () => { flushPara(); flushList(); flushTable(); };

    for (const raw of lines){
      const line = raw.trimEnd();
      const cb = line.match(/^\u0001(\d+)\u0001$/);
      const eb = line.match(/^\u0002(\d+)\u0002$/);
      if (cb){ flushAll(); const b = codeBlocks[+cb[1]];
        out.push(`<div class="codeblock"><div class="cb-head"><span>${esc(b.lang)}</span>
          <button class="cb-copy" data-code="${esc(b.code).replace(/"/g,'&quot;')}">${ic('copy')} Copy</button></div>
          <pre>${this.hl(b.code)}</pre></div>`); continue; }
      if (eb){ flushAll(); out.push(`<div class="eq">${esc(eqBlocks[+eb[1]])}</div>`); continue; }
      if (/^\|.*\|$/.test(line)){
        const cells = line.slice(1, -1).split('|').map(c => c.trim());
        if (/^[-: ]+$/.test(cells.join(''))) continue; /* separator row */
        if (!table){ flushAll(); table = []; }
        table.push(cells); continue;
      }
      flushTable();
      if (!line){ flushAll(); continue; }
      const h = line.match(/^(#{1,4})\s+(.*)/);
      if (h){ flushAll(); out.push(`<h${Math.min(4, h[1].length + 2)}>${this.inline(h[2])}</h${Math.min(4, h[1].length + 2)}>`); continue; }
      if (/^(---|___|\*\*\*)$/.test(line)){ flushAll(); out.push('<hr>'); continue; }
      if (/^>\s?/.test(line)){ flushPara(); out.push(`<blockquote>${this.inline(line.replace(/^>\s?/, ''))}</blockquote>`); continue; }
      const ul = line.match(/^[-*+]\s+(.*)/);
      if (ul){ flushPara(); if (list !== 'ul'){ flushList(); out.push('<ul>'); list = 'ul'; }
        out.push(`<li>${this.inline(ul[1])}</li>`); continue; }
      const ol = line.match(/^\d+[.)]\s+(.*)/);
      if (ol){ flushPara(); if (list !== 'ol'){ flushList(); out.push('<ol>'); list = 'ol'; }
        out.push(`<li>${this.inline(ol[1])}</li>`); continue; }
      para.push(line);
    }
    flushAll();
    return `<div class="md">${out.join('')}</div>`;
  }
};
