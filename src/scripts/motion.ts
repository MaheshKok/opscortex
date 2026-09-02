import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;

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
  /* hero headline */
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    splitWords(el);
    gsap.from(el.querySelectorAll('.w > span'), {
      yPercent: 110, rotate: 3, duration: 1.3, ease: 'power4.out', stagger: 0.06, delay: 0.15,
    });
  });
  gsap.to('[data-hero]', {
    opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out', stagger: 0.12, delay: 0.6,
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
      color: '#ededf0', stagger: 0.04, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 40%', scrub: 0.6 },
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

  /* horizontal parallax strips */
  gsap.utils.toArray<HTMLElement>('[data-drift]').forEach((el) => {
    gsap.to(el, {
      xPercent: Number(el.dataset.drift ?? -10), ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  if (fine) {
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
