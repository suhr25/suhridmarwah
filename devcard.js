/* Developer card: holo tilt, drag-to-spin, flip to stat details, deal-in entrance,
   live constellation art. Plus small page extras (cursor ring, typed role, counters, copy email). */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ------------------------------------------------------------------ card */
  const card = document.getElementById('devcard');
  if (card) {
    const wrap = card.parentElement;
    const front = card.querySelector('.devcard-front');
    const back = card.querySelector('.devcard-back');
    const panel = back.querySelector('.dcb-panel');
    const tabs = [...back.querySelectorAll('.dcb-tabs [data-stat]')];
    const dots = back.querySelector('.dcb-dots');
    const indexLabel = back.querySelector('.dcb-index');
    const frontStats = [...front.querySelectorAll('.dc-stat')];
    const asideStats = [...document.querySelectorAll('.stat-index [data-stat]')];
    const templates = [...document.querySelectorAll('.dc-details template')];
    const total = templates.length;
    let spin = 0, stat = 0, opener = null;

    dots.innerHTML = templates.map(() => '<i></i>').join('');
    const dotEls = [...dots.children];

    const faceOf = deg => (((Math.round(deg / 180) % 2) + 2) % 2) === 0 ? 'front' : 'back';
    function setSpin(deg) { spin = deg; card.style.setProperty('--spin', `${deg}deg`); }

    function syncFace() {
      const face = faceOf(spin);
      card.dataset.face = face;
      front.inert = face !== 'front';
      back.inert = face !== 'back';
      asideStats.forEach((b, i) => b.setAttribute('aria-pressed', String(face === 'back' && i === stat)));
    }

    function render(i) {
      stat = (i + total) % total;
      panel.replaceChildren(templates[stat].content.cloneNode(true));
      panel.scrollTop = 0;
      panel.setAttribute('aria-labelledby', tabs[stat].id);
      tabs.forEach((t, n) => {
        const on = n === stat;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      dotEls.forEach((d, n) => d.classList.toggle('on', n === stat));
      indexLabel.textContent = String(stat + 1);
      syncFace();
    }

    function shine() {
      if (reduced.matches) return;
      card.classList.remove('shine'); void card.offsetWidth; card.classList.add('shine');
    }

    function show(face, i, focus) {
      if (typeof i === 'number') render(i);
      if (faceOf(spin) !== face) { setSpin(spin + 180); shine(); }
      syncFace();
      if (!focus) return;
      // Wait for the face to become interactive before moving focus.
      requestAnimationFrame(() => {
        if (face === 'back') tabs[stat].focus({ preventScroll: true });
        else (opener && document.contains(opener) ? opener : frontStats[0]).focus({ preventScroll: true });
      });
    }

    frontStats.forEach((b, i) => b.addEventListener('click', () => { opener = b; show('back', i, true); }));
    asideStats.forEach((b, i) => b.addEventListener('click', () => {
      opener = b;
      if (faceOf(spin) === 'back' && stat === i) { show('front'); return; }
      show('back', i);
      if (innerWidth <= 760) card.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'center' });
    }));
    tabs.forEach((t, i) => t.addEventListener('click', () => render(i)));
    back.querySelector('.dcb-back').addEventListener('click', () => show('front', undefined, true));
    back.querySelector('.dcb-prev').addEventListener('click', () => render(stat - 1));
    back.querySelector('.dcb-next').addEventListener('click', () => render(stat + 1));
    back.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        render(stat + (e.key === 'ArrowRight' ? 1 : -1));
        if (e.target.matches('[role="tab"]')) tabs[stat].focus();
      }
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Escape' && faceOf(spin) === 'back') { e.preventDefault(); show('front', undefined, true); }
    });

    /* Tilt + holo light follow the pointer (fine pointers). */
    let tiltFrame = 0;
    function tilt(x, y, strength = 1) {
      card.style.setProperty('--rx', `${(0.5 - y) * 16 * strength}deg`);
      card.style.setProperty('--ry', `${(x - 0.5) * 22 * strength}deg`);
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
      wrap.style.setProperty('--ry-n', String((x - 0.5) * 2));
    }
    function resetTilt() {
      card.classList.remove('is-tracking');
      card.style.setProperty('--hover', '0');
      tilt(0.5, 0.5, 0);
      card.style.setProperty('--mx', '50%'); card.style.setProperty('--my', '30%');
    }
    wrap.addEventListener('pointermove', e => {
      if (drag.active || !fine.matches || reduced.matches) return;
      cancelAnimationFrame(tiltFrame);
      tiltFrame = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        card.classList.add('is-tracking');
        card.style.setProperty('--hover', '1');
        tilt(clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1));
      });
    }, { passive: true });
    wrap.addEventListener('pointerleave', () => { if (!drag.active) resetTilt(); });

    /* Drag sideways to spin; release snaps to the nearest face using velocity. */
    const drag = { active: false, armed: false, id: 0, x: 0, y: 0, start: 0, last: 0, t: 0, v: 0, moved: false };
    card.addEventListener('pointerdown', e => {
      if (e.button !== 0 || reduced.matches) return;
      Object.assign(drag, { armed: true, active: false, id: e.pointerId, x: e.clientX, y: e.clientY, start: spin, last: e.clientX, t: performance.now(), v: 0, moved: false });
    });
    card.addEventListener('pointermove', e => {
      if (!drag.armed || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.active) {
        if (Math.abs(dx) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) { drag.armed = false; return; } // vertical: let the page scroll
        drag.active = true; drag.moved = true;
        try { card.setPointerCapture(e.pointerId); } catch { /* pointer already released */ }
        card.classList.add('is-dragging');
        card.classList.remove('is-tracking');
      }
      const now = performance.now();
      drag.v = (e.clientX - drag.last) / Math.max(now - drag.t, 1);
      drag.last = e.clientX; drag.t = now;
      setSpin(drag.start + dx * 0.55);
      const r = card.getBoundingClientRect();
      card.style.setProperty('--hover', '1');
      card.style.setProperty('--mx', `${clamp(50 + Math.sin(spin * Math.PI / 180) * 60, 0, 100)}%`);
      card.style.setProperty('--rx', `${clamp((r.top + r.height / 2 - e.clientY) / r.height * 10, -8, 8)}deg`);
    });
    function endDrag(e) {
      if (!drag.armed || e.pointerId !== drag.id) return;
      drag.armed = false;
      if (!drag.active) return;
      drag.active = false;
      card.classList.remove('is-dragging');
      const projected = spin + clamp(drag.v * 220, -200, 200);
      setSpin(Math.round(projected / 180) * 180);
      syncFace();
      if (faceOf(spin) === 'back') render(stat);
      shine();
      if (!fine.matches) resetTilt();
    }
    card.addEventListener('pointerup', endDrag);
    card.addEventListener('pointercancel', endDrag);
    // A drag should never also count as a click on a stat or tab.
    card.addEventListener('click', e => {
      if (drag.moved) { e.stopPropagation(); e.preventDefault(); drag.moved = false; }
    }, true);

    /* Deal-in entrance once the card scrolls into view. */
    function dealt() { card.classList.remove('is-waiting', 'is-dealing'); card.classList.add('is-dealt'); }
    if (reduced.matches || !('IntersectionObserver' in window)) dealt();
    else {
      const r = card.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) { dealt(); }
      else {
        card.classList.add('is-waiting');
        const io = new IntersectionObserver(items => {
          if (!items.some(i => i.isIntersecting)) return;
          io.disconnect();
          card.classList.add('is-dealing');
          requestAnimationFrame(() => {
            card.classList.remove('is-waiting');
            setTimeout(() => { dealt(); shine(); }, 1100);
          });
        }, { threshold: 0.35 });
        io.observe(card);
      }
    }
    reduced.addEventListener('change', () => { dealt(); resetTilt(); });

    render(0);
    resetTilt();
    setSpin(0);
    syncFace();

    /* Constellation art: core + 8 org nodes + drifting dust, linked like a neural net. */
    const canvas = card.querySelector('.dc-canvas');
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, running = false, visible = false, raf = 0, t0 = performance.now(), focusStat = -1;
    const orgs = Array.from({ length: 8 }, (_, i) => ({ a: i / 8 * Math.PI * 2, r: 0.62, s: 1, org: true }));
    const dust = Array.from({ length: 34 }, () => ({ a: Math.random() * Math.PI * 2, r: 0.25 + Math.random() * 0.75, s: 0.4 + Math.random() * 0.9, org: false, z: Math.random() }));
    const nodes = [...orgs, ...dust];
    function size() {
      const b = canvas.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = b.width; h = b.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      draw(performance.now());
    }
    function draw(now) {
      if (!w) return;
      const t = reduced.matches ? 0 : (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const mx = parseFloat(card.style.getPropertyValue('--mx')) / 100 || 0.5;
      const my = parseFloat(card.style.getPropertyValue('--my')) / 100 || 0.3;
      const cx = w / 2 + (mx - 0.5) * 14, cy = h / 2 + (my - 0.5) * 10;
      const R = Math.min(w, h * 1.5) * 0.48;
      const pts = nodes.map((n, i) => {
        const ang = n.a + t * (n.org ? 0.18 : 0.08 * n.s) * (i % 2 ? 1 : -1);
        const rr = R * n.r * (n.org ? 1 : 1 + Math.sin(t * n.s + i) * 0.04);
        return { x: cx + Math.cos(ang) * rr, y: cy + Math.sin(ang) * rr * 0.62, n };
      });
      // links
      ctx.lineWidth = 0.6;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.hypot(dx, dy);
        if (d < 46) { ctx.strokeStyle = `rgba(120,220,202,${(1 - d / 46) * 0.32})`; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
      }
      // spokes core → orgs
      const hot = focusStat === 0 || focusStat === 1;
      orgs.forEach((_, i) => {
        const p = pts[i];
        if (focusStat === 1 && i > 2) return;
        ctx.strokeStyle = `rgba(181,242,229,${hot ? 0.55 : 0.16})`;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y); ctx.stroke();
      });
      // orbit ring
      ctx.strokeStyle = 'rgba(120,220,202,.12)';
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.62, R * 0.62 * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
      // nodes
      pts.forEach((p, i) => {
        const org = p.n.org;
        const lit = org && (focusStat === 0 || (focusStat === 1 && i < 3));
        const r = org ? (lit ? 3.4 : 2.4) : 0.7 + p.n.z * 1.1;
        ctx.fillStyle = org ? (lit ? '#d0f3ef' : '#b5f2e5') : `rgba(120,220,202,${0.35 + p.n.z * 0.5})`;
        if (org) { ctx.shadowColor = '#78dcca'; ctx.shadowBlur = lit ? 14 : 8; }
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      });
      // core
      const pulse = 1 + Math.sin(t * 2.2) * 0.12;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26 * pulse);
      g.addColorStop(0, 'rgba(224,255,247,1)'); g.addColorStop(0.18, 'rgba(181,242,229,.9)');
      g.addColorStop(0.45, 'rgba(120,220,202,.25)'); g.addColorStop(1, 'rgba(120,220,202,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 26 * pulse, 0, Math.PI * 2); ctx.fill();
    }
    function loop(now) { draw(now); raf = running ? requestAnimationFrame(loop) : 0; }
    function sync() {
      const go = visible && !document.hidden && !reduced.matches;
      if (go && !running) { running = true; raf = requestAnimationFrame(loop); }
      if (!go) { running = false; cancelAnimationFrame(raf); draw(performance.now()); }
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(i => { visible = i[0].isIntersecting; sync(); }).observe(canvas);
    else { visible = true; }
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(canvas); else size();
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    [...frontStats, ...asideStats].forEach(b => {
      const i = Number(b.dataset.stat);
      b.addEventListener('pointerenter', () => { focusStat = i; });
      b.addEventListener('focus', () => { focusStat = i; });
      b.addEventListener('pointerleave', () => { focusStat = -1; });
      b.addEventListener('blur', () => { focusStat = -1; });
    });
    size(); sync();
  }

  /* --------------------------------------------------------- cursor ring */
  const ring = document.querySelector('.cursor-ring');
  if (ring) {
    let x = -100, y = -100, tx = -100, ty = -100, raf = 0;
    const step = () => {
      x += (tx - x) * 0.22; y += (ty - y) * 0.22;
      ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(step) : 0;
    };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || !fine.matches || reduced.matches) { ring.classList.remove('on'); return; }
      tx = e.clientX; ty = e.clientY;
      if (!ring.classList.contains('on')) { x = tx; y = ty; ring.classList.add('on'); }
      ring.classList.toggle('hot', !!e.target.closest?.('a, button, [role="tab"], .skill-tag, .devcard'));
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    document.addEventListener('pointerleave', () => ring.classList.remove('on'));
    addEventListener('blur', () => ring.classList.remove('on'));
  }

  /* ------------------------------------------------------- typed hero role */
  const typed = document.querySelector('.typed');
  if (typed && !reduced.matches) {
    const words = typed.dataset.words.split('|').map(s => s.replace(/&amp;/g, '&'));
    let wi = 0, ci = words[0].length, deleting = true, hold = 2200;
    const tick = () => {
      if (document.hidden) { setTimeout(tick, 600); return; }
      const word = words[wi];
      if (hold > 0) { const d = hold; hold = 0; setTimeout(tick, d); return; }
      if (deleting) {
        ci--; typed.textContent = word.slice(0, ci);
        if (ci <= 0) { deleting = false; wi = (wi + 1) % words.length; }
        setTimeout(tick, 34);
      } else {
        const next = words[wi]; ci++; typed.textContent = next.slice(0, ci);
        if (ci >= next.length) { deleting = true; hold = 2200; }
        setTimeout(tick, 70);
      }
    };
    setTimeout(tick, 1200);
  }

  /* ----------------------------------------------------- stat count-ups */
  const counters = [...document.querySelectorAll('[data-count]')];
  if (counters.length && !reduced.matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(items => items.forEach(item => {
      if (!item.isIntersecting) return;
      io.unobserve(item.target);
      const el = item.target, end = Number(el.dataset.count), start = performance.now();
      const run = now => {
        const p = Math.min(1, (now - start) / 1200), e = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(end * e));
        if (p < 1) requestAnimationFrame(run);
      };
      el.textContent = '0';
      requestAnimationFrame(run);
    }), { threshold: 0.6 });
    counters.forEach(c => { if (c.getBoundingClientRect().top > innerHeight) io.observe(c); });
  }

  /* --------------------------------------------------------- copy email */
  document.querySelectorAll('.copy-email').forEach(btn => {
    const label = btn.querySelector('span');
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(btn.dataset.email); label.textContent = 'Copied ✓'; }
      catch { label.textContent = 'Press Ctrl+C'; const r = document.createRange(); r.selectNodeContents(btn.previousElementSibling); getSelection().removeAllRanges(); getSelection().addRange(r); }
      btn.classList.add('done');
      setTimeout(() => { label.textContent = 'Copy'; btn.classList.remove('done'); }, 1800);
    });
  });
})();
