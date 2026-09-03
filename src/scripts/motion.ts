import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* nav: solid after scroll, hide on scroll down */
const nav = document.getElementById('nav');
let last = 0;
addEventListener(
  'scroll',
  () => {
    const y = scrollY;
    nav?.classList.toggle('nav--solid', y > 40);
    nav?.classList.toggle('nav--hide', y > last && y > 240);
    last = y;
  },
  { passive: true },
);

/* theme toggle: persists choice, tells the 3D scene */
document.querySelector('.theme')?.addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = next;
  try { localStorage.theme = next; } catch {}
  dispatchEvent(new Event('themechange'));
});

/* wrap each word in <span class="w"><span>word</span></span>, keeping inline tags like <em> */
function splitWords(root: HTMLElement, inner = true) {
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const words = (node.textContent ?? '').split(/(\s+)/);
      const frag = document.createDocumentFragment();
      for (const w of words) {
        if (!w) continue;
        if (/^\s+$/.test(w)) { frag.append(w); continue; }
        const outer = document.createElement('span');
        outer.className = 'w';
        if (inner) { const s = document.createElement('span'); s.textContent = w; outer.append(s); }
        else outer.textContent = w;
        frag.append(outer);
      }
      node.parentNode?.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      [...node.childNodes].forEach(walk);
    }
  };
  [...root.childNodes].forEach(walk);
}

if (reduce) {
  // final states only
  gsap.set('[data-reveal], [data-hero]', { clearProps: 'all' });
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    el.textContent = Number(el.dataset.count).toLocaleString() + (el.dataset.suffix ?? '');
  });
} else {
  /* inertial scroll: the page glides instead of stepping; ScrollTrigger reads it every frame */
  const lenis = new Lenis({ lerp: 0.09, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* scroll velocity (px/s), decays when the wheel stops; drives the marquees */
  let vel = 0;
  ScrollTrigger.create({ onUpdate: (self) => { vel = self.getVelocity(); } });
  gsap.ticker.add(() => { vel *= 0.92; });

  /* headlines arrive word by word: the hero on load, everything else when it scrolls into view */
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    splitWords(el);
    const inHero = !!el.closest('.hero');
    gsap.from(el.querySelectorAll('.w > span'), {
      yPercent: 110, rotate: 3, duration: 1.3, ease: 'power4.out', stagger: 0.06,
      delay: inHero ? 0.15 : 0,
      scrollTrigger: inHero ? undefined : { trigger: el, start: 'top 85%', once: true },
    });
  });
  gsap.to('[data-hero]', {
    opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out', stagger: 0.12, delay: 0.6,
  });

  /* hero copy sits behind the butterflies: it drifts up and dims as you leave, the swarm keeps its own pace */
  const hero = document.querySelector<HTMLElement>('.hero');
  if (hero) {
    gsap.to('.hero__content', {
      y: -90, opacity: 0.1, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  /* depth: heading blocks and the portrait move a little slower or faster than the page */
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    const n = Number(el.dataset.parallax ?? 20);
    gsap.fromTo(el, { y: n }, {
      y: -n, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  /* scroll reveals */
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out',
      delay: Number(el.dataset.delay ?? 0),
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  /* manifesto: words light up as you scroll */
  document.querySelectorAll<HTMLElement>('[data-manifesto]').forEach((el) => {
    splitWords(el, false);
    gsap.to(el.querySelectorAll('.w'), {
      opacity: 1, stagger: 0.04, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 40%', scrub: 0.6 },
    });
  });

  /* terminal: lines type in one after another, the prompt last */
  document.querySelectorAll<HTMLElement>('[data-term]').forEach((el) => {
    gsap.to(el.querySelectorAll('.ln'), {
      opacity: 1, duration: 0.25, stagger: 0.42, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 82%', once: true },
    });
  });

  /* counters */
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString() + (el.dataset.suffix ?? ''); },
    });
  });

  /* marquees: GSAP-driven so scroll speed pushes them faster (and backwards on the way up), with a lean */
  document.querySelectorAll<HTMLElement>('.marquee__track').forEach((track) => {
    const box = track.parentElement!;
    const dur = parseFloat(getComputedStyle(box).getPropertyValue('--dur')) || 40;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.style.animation = 'none';
    const loop = gsap.to(track, { x: () => -(track.offsetWidth + gap) / 2, ease: 'none', duration: dur, repeat: -1 });
    const lean = gsap.quickTo(track, 'skewX', { duration: 0.4, ease: 'power2.out' });
    gsap.ticker.add(() => {
      loop.timeScale(gsap.utils.interpolate(loop.timeScale(), clamp(1 + vel / 900, -4, 5), 0.08));
      lean(clamp(-vel / 400, -5, 5));
    });
  });

  if (fine) {
    /* glows follow the pointer a little */
    const glows = gsap.utils.toArray<HTMLElement>('[data-glow]').map((g) => ({
      x: gsap.quickTo(g, 'x', { duration: 1.2, ease: 'power3.out' }),
      y: gsap.quickTo(g, 'y', { duration: 1.2, ease: 'power3.out' }),
    }));
    addEventListener('pointermove', (e) => {
      const dx = (e.clientX / innerWidth - 0.5) * 70, dy = (e.clientY / innerHeight - 0.5) * 50;
      for (const g of glows) { g.x(dx); g.y(dy); }
    }, { passive: true });

    /* magnetic buttons */
    document.querySelectorAll<HTMLElement>('.magnetic').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.28, y: (e.clientY - r.top - r.height / 2) * 0.28, duration: 0.4, ease: 'power3.out' });
      });
      b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' }));
    });

    /* card spotlight + tilt */
    document.querySelectorAll<HTMLElement>('.card').forEach((c) => {
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        c.style.setProperty('--mx', `${x}px`);
        c.style.setProperty('--my', `${y}px`);
        gsap.to(c, { rotateY: (x / r.width - 0.5) * 5, rotateX: (0.5 - y / r.height) * 5, transformPerspective: 1000, duration: 0.5, ease: 'power2.out' });
      });
      c.addEventListener('pointerleave', () => gsap.to(c, { rotateX: 0, rotateY: 0, duration: 0.9, ease: 'power3.out' }));
    });
  }
}
