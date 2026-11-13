/* 案件の動き（土台の部品＋案件だけの動き）。ページ送りには触らない（swipe.js が担当。AGENTS.md 4）
 * 案件だけの動きは、この下に 2. 3. … と番号を足して書く。土台の部品（1.）は消さない・書き換えない
 */

/* 1. 数字のカウントアップ（土台の部品。v5 11/12。責任者決定「数字は基本カウントアップ」・sp-34。AGENTS.md 2.8）
 *    class="cu" を付けた要素の中の数字を、画面に見えたときに 0 から数え上げ、終わったら元の文字に戻す。
 *    HTML の文字はシートのまま（文言照合に影響しない）。画面から外れたら元の文字に戻し、また見えたら数え直す
 *    数えるもの：整数（「13,000」はカンマを付けたまま数える。「30万円」の 30 も数える）。範囲（13,000円～20,000円）は両端を同時に数える
 *    数えないもの（そのまま残す）：小数（1.5）・0 で始まる数字（05）・全角の数字
 *    style="--cd:1" で始まりを 0.65 秒ずつずらせる
 *    動きを減らす設定（prefers-reduced-motion）では数えない。自動操作のブラウザ（検査の道具。navigator.webdriver）でも数えない
 *    （検査が数えている途中の短い文字で測らないように。検査は最後の文字で測る）
 */
(() => {
  const els = document.querySelectorAll('.cu');
  if (!els.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.webdriver) return;
  const DUR = 1100, START = 300, STEP = 650;
  const NUM = /\d+(?:,\d{3})*(?:\.\d+)?/g;
  const fmt = (src, k) => src.replace(NUM, (m) => {
    if (m.includes('.') || /^0\d/.test(m)) return m;
    const v = Math.round(Number(m.replace(/,/g, '')) * k);
    return m.includes(',') ? v.toLocaleString('en-US') : String(v);
  });
  const texts = (el) => {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const out = [];
    while (w.nextNode()) if (/\d/.test(w.currentNode.data)) out.push({ n: w.currentNode, orig: w.currentNode.data });
    return out;
  };
  const stop = (el) => {
    clearTimeout(el._cuT); cancelAnimationFrame(el._cuR);
    (el._cuN || []).forEach((x) => { x.n.data = x.orig; });
  };
  const run = (el) => {
    stop(el);
    const nodes = el._cuN || (el._cuN = texts(el));
    nodes.forEach((x) => { x.n.data = fmt(x.orig, 0); });
    const delay = START + STEP * (parseFloat(getComputedStyle(el).getPropertyValue('--cd')) || 0);
    el._cuT = setTimeout(() => {
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, Math.max(0, (t - t0) / DUR)), k = 1 - Math.pow(1 - p, 3);
        nodes.forEach((x) => { x.n.data = p < 1 ? fmt(x.orig, k) : x.orig; });
        if (p < 1) el._cuR = requestAnimationFrame(tick);
      };
      el._cuR = requestAnimationFrame(tick);
    }, delay);
  };
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    const el = en.target;
    if (en.isIntersecting && !el._cuOn) { el._cuOn = true; run(el); }
    else if (!en.isIntersecting && el._cuOn) { el._cuOn = false; stop(el); }
  }), { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
})();

/* sp-37：吹き出しの見出しを1字ずつに分ける（char-in。文字はそのまま。読み上げは親の aria-label） */
(() => {
  document.querySelectorAll('.pf-char-in').forEach((el) => {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ''));
    let i = 0;
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...n.data].forEach((ch) => {
          if (/\s/.test(ch)) { frag.append(ch); return; }
          const s = document.createElement('span'); s.className = 'pf-c'; s.style.setProperty('--i', i++); s.setAttribute('aria-hidden', 'true'); s.textContent = ch; frag.append(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'WBR') walk(n);
    });
    walk(el);
  });
})();
