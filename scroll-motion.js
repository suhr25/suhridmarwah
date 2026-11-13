/* Scroll choreography. Native scrolling, no wheel interception or pinned content. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero-section');
  const content = hero.querySelector('.hero-content');
  const entries = [...document.querySelectorAll('.reveal-item, .section-header')];
  const covers = [...document.querySelectorAll('.project-icon')];
  const timeline = [...document.querySelectorAll('.timeline-item')];
  let observer, frame = 0, metrics = [];
  const clamp = value => Math.max(0, Math.min(1, value));
  // Layout offsets exclude animation transforms, preventing parallax feedback.
  function topOf(element) {
    let top = 0;
    for (let node = element; node; node = node.offsetParent) top += node.offsetTop;
    return top;
  }
  function measure() {
    metrics = [...covers, ...timeline].map(element => ({
      element, top: topOf(element), height: element.offsetHeight,
      cover: element.classList.contains('project-icon')
    }));
    schedule();
  }
  function update() {
    frame = 0;
    if (reduced.matches || document.hidden) return;
    const y = scrollY, height = innerHeight;
    const heroPhase = clamp(y / Math.max(hero.offsetHeight, 1));
    const mobile = innerWidth <= 680;
    content.style.setProperty('--hero-travel', `${heroPhase * (mobile ? 28 : 85)}px`);
    // Keep the hero legible until it is substantially outside the viewport.
    content.style.setProperty('--hero-opacity', String(1 - clamp((heroPhase - .2) / .75) * .8));
    content.style.setProperty('--hero-scale', String(1 - heroPhase * .035));
    for (const item of metrics) {
      const position = item.top - y;
      if (position > height + 100 || position + item.height < -100) continue;
      const phase = clamp((height - position) / (height + item.height));
      if (item.cover) {
        item.element.style.setProperty('--cover-shift', `${(.5 - phase) * (mobile ? 36 : 78)}px`);
        item.element.style.setProperty('--cover-scale', String(1.07 - phase * .07));
      } else {
        item.element.style.setProperty('--entry-progress', String(clamp((height * .85 - position) / (height * .5))));
      }
    }
  }
  function schedule() {
    if (!frame && !reduced.matches && !document.hidden) frame = requestAnimationFrame(update);
  }
  function setup() {
    observer?.disconnect();
    cancelAnimationFrame(frame); frame = 0;
    entries.forEach(element => {
      element.classList.remove('motion-reveal', 'motion-entered', 'pending-reveal');
      element.style.removeProperty('--motion-delay');
    });
    content.style.removeProperty('--hero-travel');
    content.style.removeProperty('--hero-opacity');
    content.style.removeProperty('--hero-scale');
    covers.forEach(element => {
      element.style.removeProperty('--cover-shift');
      element.style.removeProperty('--cover-scale');
    });
    if (reduced.matches) return;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(items => {
        items.forEach(item => {
          if (!item.isIntersecting) return;
          item.target.classList.add('motion-entered');
          observer.unobserve(item.target);
        });
      }, { threshold: .06, rootMargin: '0px 0px -5% 0px' });
      entries.forEach(element => {
        const rect = element.getBoundingClientRect();
        // Restored scroll positions and directly linked sections stay immediately readable.
        if (rect.top < innerHeight && rect.bottom > 0) return;
        if (rect.bottom <= 0) return;
        const siblings = [...element.parentElement.children].filter(child => child.matches('.reveal-item'));
        const index = Math.max(0, siblings.indexOf(element));
        const columns = innerWidth <= 680 ? 1 : element.matches('.connect-card') ? 3 : 2;
        element.style.setProperty('--motion-delay', `${index % columns * 95}ms`);
        element.classList.add('motion-reveal');
        observer.observe(element);
      });
    }
    measure();
  }
  document.addEventListener('focusin', event => {
    const item = event.target.closest('.motion-reveal');
    if (item) { item.classList.add('motion-entered'); observer?.unobserve(item); }
  });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', measure, { passive: true });
  addEventListener('pageshow', measure);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else schedule();
  });
  reduced.addEventListener('change', setup);
  document.fonts?.ready.then(measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.querySelector('main'));
  setup();
})();
