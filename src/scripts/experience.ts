import { completeRecovery, createRecovery, resetRecovery, stopOneReplica } from './recovery.mjs';
import { mountJourney } from './journey';

type RecoveryState = ReturnType<typeof createRecovery>;

const themeButton = document.querySelector<HTMLButtonElement>('.theme');
themeButton?.addEventListener('click', () => {
  const root = document.documentElement;
  const nextTheme = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = nextTheme;
  try { localStorage.theme = nextTheme; } catch {}
  window.dispatchEvent(new CustomEvent('themechange'));
});

const recovery = document.querySelector<HTMLElement>('[data-recovery]');
if (recovery) {
  const stop = recovery.querySelector<HTMLButtonElement>('[data-stop]');
  const reset = recovery.querySelector<HTMLButtonElement>('[data-reset]');
  const message = recovery.querySelector<HTMLElement>('[data-recovery-message]');
  let state: RecoveryState = createRecovery();
  let recoveryTimer: number | undefined;

  const render = () => {
    const isRecovering = state.phase === 'recovering';
    recovery.dataset.phase = state.phase;
    if (stop) stop.disabled = isRecovering;
    if (message) message.textContent = isRecovering
      ? '2 replicas ready. A replacement is starting while booking remains available.'
      : '3 replicas ready. Booking remains available.';
  };
  const clearTimer = () => {
    if (recoveryTimer) window.clearTimeout(recoveryTimer);
    recoveryTimer = undefined;
  };
  stop?.addEventListener('click', () => {
    state = stopOneReplica(state);
    render();
    if (state.phase === 'recovering') {
      clearTimer();
      recoveryTimer = window.setTimeout(() => { state = completeRecovery(state); render(); }, 1800);
    }
  });
  reset?.addEventListener('click', () => { clearTimer(); state = resetRecovery(state); render(); });
  render();
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reducedMotion) document.documentElement.classList.add('motion-safe');
if (reducedMotion) document.documentElement.classList.add('reduced-motion');
const arrival = document.querySelector<HTMLElement>('[data-arrival-media]');
if (arrival && !reducedMotion && window.matchMedia('(pointer: fine)').matches) {
  arrival.addEventListener('pointermove', (event) => {
    const bounds = arrival.getBoundingClientRect();
    arrival.style.setProperty('--arrival-x', `${((event.clientX - bounds.left) / bounds.width - .5) * 8}px`);
    arrival.style.setProperty('--arrival-y', `${((event.clientY - bounds.top) / bounds.height - .5) * 8}px`);
  });
}

const arrivalSection = document.querySelector<HTMLElement>('.arrival');
const arrivalContent = document.querySelector<HTMLElement>('.arrival__content');
if (arrivalSection && arrival && arrivalContent && !reducedMotion) {
  let queued = false;
  const updateArrival = () => {
    queued = false;
    const bounds = arrivalSection.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, -bounds.top / Math.max(1, bounds.height - window.innerHeight)));
    arrival.style.setProperty('--arrival-scale', `${1.025 + progress * .075}`);
    arrivalContent.style.transform = `translate3d(0, ${-progress * 12}vh, 0)`;
    arrivalContent.style.opacity = `${1 - progress * .9}`;
    arrivalSection.dataset.scVerifyState = `hero=push-in; progress=${progress.toFixed(2)}; poster-scale=${(1.025 + progress * .075).toFixed(3)}`;
  };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(updateArrival); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  updateArrival();
}

const journey = document.querySelector<HTMLElement>('[data-journey-phase]');
let disposeJourney: (() => void) | undefined;
let pageGone = false;
if (journey && !reducedMotion) {
  let started = false;
  let journeyObserver: IntersectionObserver;
  journeyObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting || started || pageGone) return;
    started = true;
    journeyObserver.disconnect();
    mountJourney(journey, () => pageGone)
      .then((dispose) => {
        if (pageGone) dispose();
        else disposeJourney = dispose;
      })
      .catch(() => { if (!pageGone) journey.dataset.scAct = 'journey=static-after-load-failure'; });
  }, { rootMargin: '200px 0px' });
  journeyObserver.observe(journey);
  window.addEventListener('pagehide', () => {
    pageGone = true;
    journeyObserver.disconnect();
    disposeJourney?.();
  }, { once: true });
}
