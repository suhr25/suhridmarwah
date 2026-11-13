/* Progressive enhancement: all portfolio content remains readable without JavaScript. */
(() => {
  'use strict';
  const navbar = document.querySelector('#navbar');
  const toggle = document.querySelector('#nav-toggle');
  const menu = document.querySelector('#mobile-menu');
  const topButton = document.querySelector('#back-to-top');
  const progress = document.querySelector('.reading-progress');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function setMenu(open) {
    toggle.classList.toggle('open', open);
    menu.classList.toggle('open', open);
    menu.inert = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!menu.contains(event.target) && !navbar.contains(event.target)) setMenu(false);
  });
  const mobile = window.matchMedia('(max-width: 680px)');
  mobile.addEventListener('change', () => setMenu(false));
  let scheduled = false;
  function updateScroll() {
    const offset = window.scrollY;
    navbar.classList.toggle('scrolled', offset > 20);
    topButton.classList.toggle('visible', offset > 500);
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${total > 0 ? (offset / total) * 100 : 0}%`;
    let active = '';
    document.querySelectorAll('main > section').forEach(section => {
      if (section.getBoundingClientRect().top <= 160) active = section.id;
    });
    if (offset + window.innerHeight >= document.documentElement.scrollHeight - 5) active = 'connect';
    document.querySelectorAll('.nav-link').forEach(link => {
      const selected = link.dataset.section === active;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  window.addEventListener('resize', updateScroll);
  updateScroll();
  topButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    document.querySelector('.nav-logo').focus({ preventScroll: true });
  });
})();

/* Keep the navigation highlight aligned through hover, focus and section changes. */
(() => {
  const nav = document.querySelector('.nav-links');
  const indicator = nav.querySelector('.nav-indicator');
  const links = [...nav.querySelectorAll('.nav-link')];
  let hovered = null;
  function align() {
    const focused = links.includes(document.activeElement) ? document.activeElement : null;
    const target = hovered || focused || nav.querySelector('.active');
    if (!target || !nav.getBoundingClientRect().width) {
      indicator.classList.remove('shown');
      return;
    }
    const parent = nav.getBoundingClientRect();
    const bounds = target.getBoundingClientRect();
    indicator.style.width = `${bounds.width + 20}px`;
    indicator.style.transform = `translateX(${bounds.left - parent.left - 10}px)`;
    indicator.classList.add('shown');
  }
  links.forEach(link => {
    link.addEventListener('pointerenter', () => { hovered = link; align(); });
    link.addEventListener('focus', align);
  });
  nav.addEventListener('pointerleave', () => { hovered = null; align(); });
  nav.addEventListener('focusout', () => requestAnimationFrame(align));
  new MutationObserver(align).observe(nav, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
  window.addEventListener('resize', align, { passive: true });
  document.fonts?.ready.then(align);
  function visibility() { document.body.classList.toggle('page-hidden', document.hidden); }
  document.addEventListener('visibilitychange', visibility);
  visibility(); align();
})();
