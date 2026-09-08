import { journeyState } from './journey-state.mjs';

type JourneyState = ReturnType<typeof journeyState>;

export async function mountJourney(journey: HTMLElement, isAborted = () => false) {
  const host = journey.querySelector<HTMLElement>('[data-journey-scene]');
  const canvas = host?.querySelector<HTMLCanvasElement>('canvas');
  if (!host || !canvas) throw new Error('Journey canvas is missing');

  const [three, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
    import('three'),
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/environments/RoomEnvironment.js'),
  ]);
  if (isAborted()) throw new Error('Journey initialization was aborted');
  const {
    ACESFilmicToneMapping, AmbientLight, BufferGeometry, Color, DirectionalLight,
    Float32BufferAttribute, LineBasicMaterial, LineSegments, MathUtils, PMREMGenerator,
    PerspectiveCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
  } = three;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  let contextLost = false;
  let disposeActive: (() => void) | undefined;
  const onContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    journey.classList.remove('journey--active', 'journey--initializing');
    host.classList.remove('is-ready');
    journey.dataset.scAct = 'journey=static-after-context-loss';
    disposeActive?.();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  const scene = new Scene();
  scene.background = new Color('#100e0e');
  const camera = new PerspectiveCamera(37, 1, .1, 100);
  scene.add(new AmbientLight(0xd9e1ec, .9));
  const key = new DirectionalLight(0xd7e1ed, 3.8);
  key.position.set(5, 7, 7);
  scene.add(key);
  const fill = new DirectionalLight(0x6d86a7, 1.8);
  fill.position.set(-5, 3, 5);
  scene.add(fill);
  const edge = new DirectionalLight(0xf73938, 1.35);
  edge.position.set(-6, 2, -1);
  scene.add(edge);

  let gltf;
  try {
    gltf = await new GLTFLoader().loadAsync('/models/experience/application-module.glb');
  } catch (error) {
    canvas.removeEventListener('webglcontextlost', onContextLost);
    renderer.dispose();
    throw error;
  }
  const disposeModel = () => {
    gltf.scene.traverse((child: any) => {
      child.geometry?.dispose?.();
      if (Array.isArray(child.material)) child.material.forEach((material: any) => material.dispose?.());
      else child.material?.dispose?.();
    });
  };
  if (isAborted() || contextLost || renderer.getContext().isContextLost()) {
    canvas.removeEventListener('webglcontextlost', onContextLost);
    disposeModel();
    renderer.dispose();
    throw new Error('Journey initialization was aborted');
  }
  const studio = new RoomEnvironment();
  const pmrem = new PMREMGenerator(renderer);
  const lighting = pmrem.fromScene(studio, .04);
  scene.environment = lighting.texture;
  scene.environmentIntensity = .8;
  studio.dispose();
  pmrem.dispose();
  const packageRoot = gltf.scene;
  scene.add(packageRoot);
  packageRoot.rotation.y = -.18;

  const replicaLeft = packageRoot.clone(true);
  const replicaRight = packageRoot.clone(true);
  scene.add(replicaLeft, replicaRight);
  const shellNames = ['shell_left', 'shell_right', 'shell_top', 'shell_bottom', 'shell_back'];
  const shellHome = new Map<string, { x: number; y: number; z: number }>();
  for (const name of shellNames) {
    const shell = packageRoot.getObjectByName(name);
    if (!shell) throw new Error(`Journey model is missing ${name}`);
    shellHome.set(name, { x: shell.position.x, y: shell.position.y, z: shell.position.z });
  }
  const closeReplicaShells = (replica: typeof packageRoot) => {
    for (const name of shellNames) {
      const shell = replica.getObjectByName(name);
      const home = shellHome.get(name);
      if (shell && home) shell.position.set(home.x, home.y, home.z);
    }
  };
  closeReplicaShells(replicaLeft);
  closeReplicaShells(replicaRight);
  replicaLeft.rotation.y = -.18;
  replicaRight.rotation.y = -.18;
  const serviceGeometry = new BufferGeometry();
  const serviceMaterial = new LineBasicMaterial({ color: 0xf73938, transparent: true, opacity: .9, toneMapped: false });
  const serviceLines = new LineSegments(serviceGeometry, serviceMaterial);
  scene.add(serviceLines);
  const serviceLabel = journey.querySelector<HTMLElement>('.journey__service');
  const serviceAnchor = new Vector3();
  const chapterLinks = journey.querySelectorAll<HTMLAnchorElement>('.journey__rail a');
  const stage = journey.querySelector<HTMLElement>('.journey__stage');
  const chapters = journey.querySelector<HTMLElement>('.journey__chapters');

  const setShellState = (enclosure: number) => {
    for (const name of shellNames) {
      const shell = packageRoot.getObjectByName(name);
      const home = shellHome.get(name);
      if (!shell || !home) continue;
      shell.visible = enclosure > .015;
      const offset = 1 - enclosure;
      const x = home.x + (name === 'shell_left' ? -1.2 * offset : name === 'shell_right' ? 1.2 * offset : 0);
      const y = home.y + (name === 'shell_top' ? .86 * offset : name === 'shell_bottom' ? -.86 * offset : 0);
      const z = home.z + (name === 'shell_back' ? -.78 * offset : 0);
      shell.position.set(x, y, z);
    }
  };

  let isVisible = true;
  let disposed = false;
  let queued = false;
  let currentState: JourneyState = journeyState(0);
  const setServiceLines = (replicas: number, mobile: boolean) => {
    serviceLines.visible = replicas > .03;
    if (!serviceLines.visible) return;
    const pods = mobile
      ? [[0, -1.15 * replicas], [-2.05 * replicas, .9 * replicas], [2.05 * replicas, .9 * replicas]]
      : [[0, 0], [-4.1 * replicas, 0], [4.1 * replicas, 0]];
    const busY = Math.max(...pods.map(([, y]) => y)) + 2.25;
    const podXs = pods.map(([x]) => x);
    const positions: number[] = [Math.min(...podXs), busY, -1.1, Math.max(...podXs), busY, -1.1];
    for (const [x, y] of pods) positions.push(x, busY, -1.1, x, y + 1, -1.1);
    serviceGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    serviceAnchor.set(0, busY + .35, -1.1);
  };
  const render = () => {
    if (disposed || !isVisible || document.hidden) return;
    renderer.render(scene, camera);
  };
  const applyState = (state: JourneyState) => {
    currentState = state;
    setShellState(state.enclosure);
    const mobile = window.innerWidth < 1000;
    if (mobile && stage && chapters) {
      journey.style.setProperty('--journey-pin-y', `${stage.getBoundingClientRect().top - chapters.getBoundingClientRect().top}px`);
    } else journey.style.removeProperty('--journey-pin-y');
    const clusterScale = 1.12 - state.replicas * .3;
    packageRoot.scale.setScalar(clusterScale);
    packageRoot.rotation.y = -.18 - .12 * state.enclosure + .24 * state.replicas;
    packageRoot.position.set(0, mobile ? -1.15 * state.replicas : 0, 0);
    for (const [replica, direction] of [[replicaLeft, -1], [replicaRight, 1]] as const) {
      replica.visible = state.replicas > 0;
      replica.scale.setScalar(clusterScale);
      replica.rotation.y = packageRoot.rotation.y;
      replica.position.set(direction * (mobile ? 2.05 : 4.1) * state.replicas, mobile ? .9 * state.replicas : 0, -.2 * state.replicas);
    }
    setServiceLines(state.replicas, mobile);
    const halfFov = Math.tan((camera.fov * Math.PI) / 360);
    const progress = getProgress();
    const assemblyFraming = MathUtils.smoothstep(progress, .14, .24);
    const serviceFraming = mobile ? MathUtils.smoothstep(state.replicas, 0, .2) : 0;
    const sceneWidth = 4.6 + 2.2 * assemblyFraming - 2 * state.enclosure + (mobile ? 2.8 : 7.3) * state.replicas;
    const sceneHeight = 3.5 + 1.5 * assemblyFraming - 1.3 * state.enclosure + (mobile ? 2.4 : .8) * state.replicas;
    const cameraZ = Math.max(
      sceneWidth / (2 * Math.max(.1, camera.aspect) * halfFov),
      sceneHeight / (2 * halfFov),
    ) / (mobile ? .9 - .1 * serviceFraming : .86);
    camera.position.set(mobile ? .25 : 1.4, mobile ? .65 : 1.5, cameraZ);
    camera.lookAt(0, mobile ? .3 * state.replicas + .55 * serviceFraming : .2, 0);
    camera.updateMatrixWorld();
    if (serviceLabel) serviceLabel.style.visibility = serviceLines.visible ? 'visible' : 'hidden';
    if (serviceLabel && serviceLines.visible) {
      const anchor = serviceAnchor.clone().project(camera);
      serviceLabel.style.left = `${host.offsetLeft + (anchor.x * .5 + .5) * host.clientWidth}px`;
      serviceLabel.style.top = `${host.offsetTop + (-anchor.y * .5 + .5) * host.clientHeight}px`;
    }
    for (const link of chapterLinks) {
      if (link.hash === `#${state.phase}`) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    }
    journey.dataset.journeyPhase = state.phase;
    journey.dataset.journeyProgress = getProgress().toFixed(3);
    journey.dataset.scAct = `journey=${state.phase}`;
    journey.dataset.scVerifyState = `enclosure=${state.enclosure.toFixed(2)}; replicas=${state.replicas.toFixed(2)}; service=${serviceLines.visible}; camera-z=${camera.position.z.toFixed(2)}`;
    render();
  };
  const getProgress = () => {
    const bounds = journey.getBoundingClientRect();
    return Math.max(0, Math.min(1, -bounds.top / Math.max(1, bounds.height - window.innerHeight)));
  };
  const update = () => {
    queued = false;
    applyState(journeyState(getProgress()));
  };
  const scheduleUpdate = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
    scheduleUpdate();
  };
  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) scheduleUpdate();
  }, { threshold: .02 });
  const onVisibilityChange = () => { if (!document.hidden) scheduleUpdate(); };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    journey.classList.remove('journey--active', 'journey--initializing');
    host.classList.remove('is-ready');
    journey.style.removeProperty('--journey-pin-y');
    observer.disconnect();
    canvas.removeEventListener('webglcontextlost', onContextLost);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('scroll', scheduleUpdate);
    window.removeEventListener('resize', resize);
    disposeModel();
    lighting.dispose();
    serviceGeometry.dispose();
    serviceMaterial.dispose();
    renderer.dispose();
  };

  disposeActive = dispose;
  observer.observe(journey);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', resize);
  journey.classList.add('journey--initializing');
  resize();
  if (!canvas.width || !canvas.height) {
    journey.classList.remove('journey--initializing');
    throw new Error('Journey canvas did not receive a drawable size');
  }
  if (isAborted() || contextLost || renderer.getContext().isContextLost()) {
    journey.classList.remove('journey--initializing');
    dispose();
    throw new Error('Journey initialization was aborted');
  }
  applyState(currentState);
  host.classList.add('is-ready');
  journey.classList.remove('journey--initializing');
  journey.classList.add('journey--active');
  resize();
  scheduleUpdate();
  return dispose;
}
