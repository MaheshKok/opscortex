import { completeRecovery, createRecovery, resetRecovery, stopOneReplica } from './recovery.mjs';

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

const mission = document.querySelector<HTMLElement>('.mission');
const missionGrid = document.querySelector<HTMLElement>('.mission__grid');
if (mission && missionGrid && !reducedMotion) {
  new IntersectionObserver(([entry], observer) => {
    if (!entry.isIntersecting) return;
    missionGrid.classList.add('is-entered');
    mission.dataset.scVerifyState = 'reveal=entered; opacity=1; translateY=0';
    observer.disconnect();
  }, { threshold: .18 }).observe(mission);
}

const view3d = document.querySelector<HTMLButtonElement>('[data-view-3d]');
const sceneHost = document.querySelector<HTMLElement>('[data-scene]');
const sceneError = document.querySelector<HTMLElement>('[data-scene-error]');
let disposeScene: (() => void) | undefined;
view3d?.addEventListener('click', async () => {
  if (!sceneHost || reducedMotion) return;
  if (sceneHost.classList.contains('is-ready')) {
    sceneHost.classList.remove('is-ready');
    sceneHost.dispatchEvent(new Event('scenevisibility'));
    sceneHost.closest<HTMLElement>('.app-stage')?.setAttribute('data-sc-verify-state', 'camera=poster; opacity=1');
    view3d.setAttribute('aria-pressed', 'false');
    view3d.textContent = 'Open 3D model ↗';
    return;
  }
  view3d.disabled = true;
  if (sceneError) sceneError.textContent = '';
  view3d.textContent = 'Loading 3D model…';
  try {
    if (!disposeScene) disposeScene = await mountScene(sceneHost);
    sceneHost.classList.add('is-ready');
    sceneHost.dispatchEvent(new Event('scenevisibility'));
    sceneHost.closest<HTMLElement>('.app-stage')?.setAttribute('data-sc-verify-state', 'camera=initial; position=0.12,1.65,7.8; target=0,1.58,-5; opacity=1');
    view3d.setAttribute('aria-pressed', 'true');
    view3d.textContent = 'Return to application ↙';
  } catch (error) {
    console.error('Could not load the experience 3D model.', error);
    view3d.setAttribute('aria-pressed', 'false');
    view3d.textContent = '3D model unavailable';
    if (sceneError) sceneError.textContent = 'The 3D view could not start. Try again.';
  } finally { view3d.disabled = false; }
});
window.addEventListener('pagehide', () => disposeScene?.(), { once: true });
document.documentElement.classList.add('sc-ready');

async function mountScene(host: HTMLElement) {
  const [{ AmbientLight, Color, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer }, { GLTFLoader }] = await Promise.all([
    import('three'),
    import('three/addons/loaders/GLTFLoader.js'),
  ]);
  const canvas = host.querySelector('canvas');
  if (!canvas) throw new Error('Scene canvas is missing');
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  const scene = new Scene();
  scene.background = new Color('#0e0d0d');
  const camera = new PerspectiveCamera(42, 1, .1, 100);
  camera.position.set(.12, 1.65, 7.8);
  camera.lookAt(0, 1.58, -5);
  scene.add(new AmbientLight(0xfff2df, 1.3));
  const key = new DirectionalLight(0xffd4a2, 2.4); key.position.set(2, 7, 4); scene.add(key);
  const fill = new DirectionalLight(0x8aa0c9, 1.2); fill.position.set(-4, 3, -4); scene.add(fill);
  let gltf;
  try { gltf = await new GLTFLoader().loadAsync('/models/experience/aisle.glb'); }
  catch (error) { renderer.dispose(); throw error; }
  scene.add(gltf.scene);
  let visible = true;
  let running = false;
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;
  const updateCamera = () => {
    const bounds = host.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height)));
    camera.position.set(.12 + pointerX * .16, 1.65 + pointerY * .08 - progress * .05, 7.8 - progress * 4.5);
    camera.lookAt(.15, 1.58 - progress * .18, -5 - progress * 2);
    host.closest<HTMLElement>('.app-stage')?.setAttribute('data-sc-verify-state', `camera=live; progress=${progress.toFixed(2)}; position=${camera.position.x.toFixed(2)},${camera.position.y.toFixed(2)},${camera.position.z.toFixed(2)}; opacity=1`);
  };
  const resize = () => { const { width, height } = host.getBoundingClientRect(); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); };
  const draw = () => { if (!running) return; renderer.render(scene, camera); frame = requestAnimationFrame(draw); };
  const updateRenderer = () => {
    const shouldRender = visible && !document.hidden && host.classList.contains('is-ready');
    if (shouldRender && !running) { running = true; draw(); }
    if (!shouldRender && running) { running = false; cancelAnimationFrame(frame); }
  };
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updateRenderer(); }, { threshold: .05 });
  observer.observe(host);
  const onVisibilityChange = () => updateRenderer();
  const onSceneVisibility = () => updateRenderer();
  const onPointerMove = (event: PointerEvent) => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const bounds = host.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width - .5;
    pointerY = (event.clientY - bounds.top) / bounds.height - .5;
    updateCamera();
  };
  const onSceneScroll = () => updateCamera();
  const onContextLost = (event: Event) => {
    event.preventDefault();
    visible = false;
    updateRenderer();
    sceneHost?.classList.remove('is-ready');
    sceneHost?.dispatchEvent(new Event('scenevisibility'));
    view3d?.setAttribute('aria-pressed', 'false');
    if (view3d) view3d.textContent = 'Reload 3D model';
    disposeScene?.();
    disposeScene = undefined;
    const replacement = document.createElement('canvas');
    canvas.replaceWith(replacement);
    if (sceneError) sceneError.textContent = 'The 3D view paused. Select Reload 3D model to try again.';
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  document.addEventListener('visibilitychange', onVisibilityChange);
  host.addEventListener('scenevisibility', onSceneVisibility);
  host.addEventListener('pointermove', onPointerMove);
  window.addEventListener('scroll', onSceneScroll, { passive: true });
  window.addEventListener('resize', resize); resize(); updateCamera(); updateRenderer();
  return () => { running = false; cancelAnimationFrame(frame); observer.disconnect(); canvas.removeEventListener('webglcontextlost', onContextLost); document.removeEventListener('visibilitychange', onVisibilityChange); host.removeEventListener('scenevisibility', onSceneVisibility); host.removeEventListener('pointermove', onPointerMove); window.removeEventListener('scroll', onSceneScroll); window.removeEventListener('resize', resize); gltf.scene.traverse((child: any) => { child.geometry?.dispose?.(); child.material?.dispose?.(); }); renderer.dispose(); };
}
