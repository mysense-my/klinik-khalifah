
(() => {
  'use strict';
  const d = document, de = d.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mqDesk = matchMedia('(min-width: 1200px)');
  const mqPhone = matchMedia('(max-width: 809.98px)');
  const css = getComputedStyle(de);
  const LINEAR_OK = window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)');
  const SP = n => ({ ease: (LINEAR_OK && css.getPropertyValue('--sp-' + n).trim()) || 'cubic-bezier(.22,1,.36,1)', dur: (parseFloat(css.getPropertyValue('--sp-' + n + '-d')) || .4) * 1000 });
  const REVEAL = 'cubic-bezier(.12,.23,.5,1)';
  const $$ = (s, r = d) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  
  function inView(el, amount, cb) {
    if (!('IntersectionObserver' in window)) { cb(); return; }
    const h = el.getBoundingClientRect().height || 1;
    const t = Math.min(amount, (innerHeight * 0.5) / h);
    const io = new IntersectionObserver(es => {
      for (const e of es) if (e.isIntersecting) { io.disconnect(); cb(); break; }
    }, { threshold: t });
    io.observe(el);
  }
  function settle(el) { el.style.opacity = ''; el.style.transform = 'none'; el.style.filter = 'none'; }
  function animateTo(el, from, to, opts) {
    const a = el.animate([from, to], Object.assign({ fill: 'both' }, opts));
    a.onfinish = () => { Object.assign(el.style, { opacity: '1', transform: 'none', filter: 'none' }); a.cancel(); };
    return a;
  }

  
  function splitLines(el) {
    if (!el.dataset.orig) el.dataset.orig = el.innerHTML;
    const words = el.innerHTML.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="lw">${w}</span>`).join(' ');
    const ws = $$('.lw', el);
    const lines = []; let top = null;
    ws.forEach(w => { const t = w.offsetTop; if (top === null || Math.abs(t - top) > 3) { lines.push([]); top = t; } lines[lines.length - 1].push(w.innerHTML); });
    el.innerHTML = lines.map(l => `<span class="ln">${l.join(' ')}</span>`).join('');
    el.classList.add('is-split');
    return $$('.ln', el);
  }
  const easePts = n => { const m = LINEAR_OK && /^linear\(([^)%]*)\)$/.exec(css.getPropertyValue('--sp-' + n).trim()); return m ? m[1].split(',').map(parseFloat) : null; };
  function textFx(el) {
    const type = el.dataset.fx;
    const start = parseFloat(el.dataset.fxStart || 0), stag = parseFloat(el.dataset.fxStagger || .05);
    const sp = SP(el.dataset.fxSpring || 'text-04');
    const FROM = {
      blur: { opacity: .001, filter: 'blur(10px)', transform: 'translateY(10px)' },
      flip: { opacity: .001, transform: 'scaleX(0)' },
      lines: { opacity: .001, transform: 'translateY(10px)' },
    }[type];
    const TO = { opacity: 1, filter: 'blur(0px)', transform: type === 'flip' ? 'scaleX(1)' : 'translateY(0px)' };
    if (type !== 'blur') delete TO.filter;
    const HOLD = Object.assign({}, FROM, { opacity: 0 });
    if (type === 'blur') HOLD.filter = 'none';
    const pts = type === 'flip' ? easePts(el.dataset.fxSpring || 'text-04') : null;
    const run = () => {
      const tks = type === 'lines' ? splitLines(el) : $$('.tk', el);
      const total = (start + (tks.length - 1) * stag) * 1000 + sp.dur;
      let left = tks.length;
      tks.forEach((t, i) => {
        const a0 = (start + i * stag) * 1000 / total, a1 = Math.min(1, a0 + sp.dur / total);
        const kf = pts   // flip: one keyframe per spring sample, angle θ = 90° × (1 − v), drawn width cos θ = sin(90° × v)
          ? pts.map((v, k) => ({ offset: k === pts.length - 1 ? a1 : a0 + (a1 - a0) * k / (pts.length - 1),
              opacity: .001 + .999 * v, transform: `scaleX(${Math.sin(Math.PI / 2 * clamp(v, 0, 1))})` }))
          : [Object.assign({ offset: a0, easing: sp.ease }, FROM), Object.assign({ offset: a1 }, TO)];
        if (a0 > 0) kf.unshift(Object.assign({ offset: 0 }, HOLD), Object.assign({ offset: a0 }, HOLD));
        if (a1 < 1) kf.push(Object.assign({ offset: 1 }, TO));
        const a = t.animate(kf, { duration: total, fill: 'both' });
        a.onfinish = () => {
          Object.assign(t.style, { opacity: '1', transform: 'none', filter: 'none' }); a.cancel();
          if (--left === 0 && type === 'lines') { el.innerHTML = el.dataset.orig; }
        };
      });
    };
    if (RM) { if (type === 'lines') el.classList.add('is-split'); $$('.tk', el).forEach(settle); return; }
    if (el.dataset.fxTrigger === 'load') requestAnimationFrame(() => setTimeout(run, 150));
    else inView(el, .5, run);
  }

  
  function pop(el) {
    if (RM) { settle(el); return; }
    inView(el, .5, () => animateTo(el, { opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1)' }, { duration: 500, easing: REVEAL }));
  }
  function enterX(el) {
    if (RM) { settle(el); return; }
    const delay = parseFloat(el.dataset.enterDelay || 0) * 1000;
    inView(el, .5, () => animateTo(el, { opacity: 0, transform: `translateX(${el.dataset.enterX}px)` }, { opacity: 1, transform: 'translateX(0px)' }, { duration: 500, delay, easing: REVEAL }));
  }
  function rise(el) {
    if (RM || (el.classList.contains('hero__cardspx') && mqPhone.matches)) { settle(el); return; }
    const delay = parseFloat(el.dataset.rise) * 1000;
    requestAnimationFrame(() => setTimeout(() => animateTo(el, { opacity: .001, transform: 'translateY(150px)' }, { opacity: 1, transform: 'translateY(0px)' }, { duration: 500, delay, easing: REVEAL }), 150));
  }

  
  function counter(el) {
    const start = parseFloat(el.dataset.start), end = parseFloat(el.dataset.end), dec = +el.dataset.decimals || 0;
    const step = dec ? .1 : 1, speed = +el.dataset.speed || 30, suf = el.dataset.suffix || '';
    const show = v => { el.textContent = v.toFixed(dec) + suf; };
    if (RM) { show(end); return; }
    let v = start; show(v);
    const go = () => { const t = setInterval(() => { v = parseFloat((v + step).toFixed(2)); if (v >= end) { v = end; clearInterval(t); } show(v); }, speed); };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); go(); } });
      io.observe(el);
    } else go();
  }

  
  function ticker(root) {
    const track = root.querySelector('.tick__track');
    const speed = parseFloat(root.dataset.speed || 50);
    const originals = Array.from(track.children);
    let setW = 0, x = 0, last = 0, visible = true;
    function fill() {
      $$('[data-clone]', track).forEach(n => n.remove());
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      setW = originals.reduce((s, n) => s + n.getBoundingClientRect().width, 0) + gap * originals.length;
      if (!setW) return;
      const need = root.getBoundingClientRect().width + setW * 1.5;
      let w = setW;
      while (w < need) {
        originals.forEach(n => { const c = n.cloneNode(true); c.setAttribute('data-clone', ''); c.setAttribute('aria-hidden', 'true'); $$('a,button', c).forEach(a => a.tabIndex = -1); track.appendChild(c); });
        w += setW;
      }
    }
    fill();
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(fill);
    addEventListener('resize', () => { fill(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(root);
    if (RM) return;
    const frame = t => {
      if (!last) last = t;
      const dt = Math.min(.1, (t - last) / 1000); last = t;
      if (visible && setW) { x -= speed * dt; if (-x >= setW) x += setW; track.style.transform = `translate3d(${x}px,0,0)`; }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  
  const hero = d.querySelector('[data-hero]');
  const scrubCards = hero ? $$('[data-scrub-x],[data-scrub-y]', hero) : [];
  const appts = $$('[data-appt]');
  const pastSecs = $$('[data-roll],[data-cta]');
  const fab = d.querySelector('[data-fabs]');
  const fabAvoid = $$('.foot__copy, .foot__credit');
  function docTop(el) { return el.getBoundingClientRect().top + scrollY; }
  function onScroll() {
    const vh = innerHeight, sy = scrollY;
    let fabOff = false;
    if (fab) {
      const f = fab.getBoundingClientRect();
      fabOff = fabAvoid.some(e => { const r = e.getBoundingClientRect(); return r.right > f.left - 12 && r.left < f.right + 12 && r.bottom > f.top - 12 && r.top < f.bottom + 12; });
    }
    if (hero) {
      const top = docTop(hero), bottom = top + hero.offsetHeight;
      const start = Math.max(0, top - vh), end = Math.max(start + 1, bottom - vh);
      const p = RM ? 1 : clamp((sy - start) / (end - start), 0, 1);
      scrubCards.forEach(c => {
        if (!mqDesk.matches) {
          if (c.dataset.scrubbed) { c.style.transform = 'none'; delete c.dataset.scrubbed; }
          return;
        }
        const x = parseFloat(c.dataset.scrubX || 0) * (1 - p), y = parseFloat(c.dataset.scrubY || 0) * (1 - p);
        c.style.transform = (x || y) ? `translate(${x}px, ${y}px)` : 'none';
        c.dataset.scrubbed = '1';
      });
    }
    appts.forEach(sec => {
      const r = sec.getBoundingClientRect();
      const top = r.top + sy, bottom = top + r.height;
      const start = Math.max(0, top - vh), end = Math.max(start + 1, bottom - vh);
      const p = RM ? 1 : clamp((sy - start) / (end - start), 0, 1);
      const card = sec.querySelector('[data-appt-scale]');
      card.style.transform = `scale(${p})`;
      sec.classList.toggle('is-active', RM || (r.top <= 0 && r.bottom > 0));
    });
    pastSecs.forEach(sec => { sec.classList.toggle('is-past', sec.getBoundingClientRect().bottom <= vh); });
    if (fab) fab.classList.toggle('is-off', fabOff);
  }
  let ticking = false;
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } };

  
  function faqInit(list) {
    const items = $$('.faq__item', list);
    const sp = SP('faq-08');
    function set(it, open) {
      const body = it.querySelector('.faq__body');
      const head = it.querySelector('.faq__head');
      const fromH = body.getBoundingClientRect().height;
      const cs = getComputedStyle(body);
      const fromM = parseFloat(cs.marginTop) || 0, fromO = parseFloat(cs.opacity) || 0;
      it.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      body.style.height = 'auto';
      const toH = open ? body.scrollHeight : 0;
      body.style.height = '';
      if (RM) return;
      const a = body.animate([{ height: fromH + 'px', marginTop: fromM + 'px', opacity: fromO }, { height: (open ? toH : 1) + 'px', marginTop: (open ? 20 : 0) + 'px', opacity: open ? 1 : 0 }],
        { duration: sp.dur, easing: sp.ease });
      a.onfinish = () => a.cancel();
    }
    items.forEach(it => it.querySelector('.faq__head').addEventListener('click', () => {
      const open = !it.classList.contains('is-open');
      items.forEach(o => { if (o !== it && o.classList.contains('is-open')) set(o, false); });
      set(it, open);
    }));
  }

  
  function navInit(nav) {
    const burger = nav.querySelector('[data-burger]');
    burger && burger.addEventListener('click', () => {
      const open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    });
    $$('[data-dd]', nav).forEach(dd => {
      const t = dd.querySelector('[data-dd-toggle]');
      t.addEventListener('click', () => { const o = !dd.classList.contains('is-open'); dd.classList.toggle('is-open', o); t.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    });
    d.addEventListener('keydown', e => { if (e.key === 'Escape') { nav.classList.remove('is-open'); $$('[data-dd]', nav).forEach(x => x.classList.remove('is-open')); } });
    $$('[data-nav-link], .nav__sublink', nav).forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('is-open'); if (burger) burger.setAttribute('aria-expanded', 'false');
      $$('[data-dd]', nav).forEach(x => x.classList.remove('is-open'));
    }));
    d.addEventListener('click', e => {
      if (e.target.closest('[data-dd]')) return;
      $$('[data-dd]', nav).forEach(x => { x.classList.remove('is-open'); x.querySelector('[data-dd-toggle]').setAttribute('aria-expanded', 'false'); });
    });
  }

  
  function convert() {
    try { if (window.gtag && window.KK_ADS_CONVERSION) gtag('event', 'conversion', { send_to: window.KK_ADS_CONVERSION }); } catch (e) {}
  }

  
  function bookInit(dlg) {
    const form = dlg.querySelector('[data-wa-form]');
    const svc = form.querySelector('[data-service-select]');
    const submit = form.querySelector('[data-submit]');
    function open(service) {
      if (service) { const m = Array.from(svc.options).find(o => o.text === service); if (m) svc.selectedIndex = m.index; }
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      de.classList.add('is-locked');
    }
    function close() {
      if (dlg.open) { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); }
      de.classList.remove('is-locked');
    }
    dlg.addEventListener('close', () => de.classList.remove('is-locked'));
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
    dlg.querySelector('[data-book-close]').addEventListener('click', close);
    $$('[data-book]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const nav = d.querySelector('[data-nav]');
      if (nav) nav.classList.remove('is-open');
      open(a.dataset.service || '');
    }));
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const f = new FormData(form);
      const lines = [form.dataset.greeting];
      $$('[data-wa-label]', form).forEach(el => {
        const v = (f.get(el.name) || '').toString().trim();
        if (v) lines.push(`${el.dataset.waLabel}: ${v}`);
      });
      const url = `https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(lines.join('\n'))}`;
      submit.classList.add('is-success');
      convert();
      window.open(url, '_blank', 'noopener');
      setTimeout(() => { submit.classList.remove('is-success'); close(); }, 1500);
    });
  }

  
  function svcMore(b) {
    const sec = b.closest('.svch'), label = b.querySelector('.svch__more-label');
    b.addEventListener('click', () => {
      const y = b.getBoundingClientRect().top;
      const all = sec.classList.toggle('is-all');
      b.setAttribute('aria-expanded', String(all));
      label.textContent = all ? b.dataset.less : b.dataset.more;
      if (!all) window.scrollBy({ top: b.getBoundingClientRect().top - y, behavior: 'instant' });
    });
  }

  
  function boot() {
    $$('[data-fx]').forEach(textFx);
    $$('[data-pop]').forEach(pop);
    $$('[data-pop-phone]').forEach(el => { if (mqPhone.matches) pop(el); });
    $$('[data-pop-mobile]').forEach(el => { if (!mqDesk.matches) pop(el); });
    $$('[data-enter-x]').forEach(enterX);
    $$('[data-rise]').forEach(rise);
    $$('[data-count]').forEach(counter);
    $$('[data-ticker]').forEach(ticker);
    $$('[data-faq]').forEach(faqInit);
    $$('[data-nav]').forEach(navInit);
    $$('[data-book-dialog]').forEach(bookInit);
    $$('[data-svc-more]').forEach(svcMore);
    $$('[data-convert]').forEach(a => a.addEventListener('click', () => { if (!a.hasAttribute('data-book')) convert(); }));
    addEventListener('scroll', req, { passive: true });
    addEventListener('resize', req);
    onScroll();
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
