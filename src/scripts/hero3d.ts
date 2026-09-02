import * as THREE from 'three';

/*
  Full-page monarch scene on one fixed canvas.
  Hero: a swarm rises from below the fold into a slow drifting cloud; the cursor scatters it.
  Scroll: one monarch leaves the swarm and follows the viewport. Stop scrolling and it lands on
  whatever is on screen (a heading, a card, a button) until you move again, all the way to the footer.
  Wing texture is drawn on canvas, the swarm is instanced: three draw calls for the whole cloud.
*/

function isLight() { return document.documentElement.dataset.theme === 'light'; }
function cssVar(n: string) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - ((-2 * u + 2) ** 2) / 2);

/* ---------- wing texture ---------- */

function wingTexture(mirror: boolean) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  if (mirror) { g.translate(S, 0); g.scale(-1, 1); }

  // wing attaches at the left edge (x≈20), head is toward the top
  const fore = new Path2D();
  fore.moveTo(18, 262);
  fore.bezierCurveTo(60, 150, 180, 40, 330, 52);
  fore.bezierCurveTo(430, 58, 500, 110, 496, 190);
  fore.bezierCurveTo(492, 240, 400, 285, 250, 292);
  fore.bezierCurveTo(150, 296, 60, 290, 18, 262);
  fore.closePath();
  const hind = new Path2D();
  hind.moveTo(22, 292);
  hind.bezierCurveTo(120, 296, 260, 300, 350, 330);
  hind.bezierCurveTo(430, 360, 440, 440, 380, 480);
  hind.bezierCurveTo(320, 510, 220, 505, 150, 470);
  hind.bezierCurveTo(90, 440, 40, 380, 22, 292);
  hind.closePath();
  const shape = new Path2D();
  shape.addPath(fore);
  shape.addPath(hind);

  const grad = g.createRadialGradient(50, 280, 10, 50, 280, 500);
  grad.addColorStop(0, '#5a2606');
  grad.addColorStop(0.16, '#d95a14');
  grad.addColorStop(0.55, '#f7961c');
  grad.addColorStop(1, '#f07a18');
  g.fillStyle = grad;
  g.fill(fore);
  g.fill(hind);

  g.save();
  g.clip(shape);
  g.strokeStyle = '#160a03';
  g.lineCap = 'round';
  g.lineWidth = 6;
  const veins: number[][][] = [
    [[18, 262], [170, 120], [330, 60]], [[18, 262], [250, 140], [470, 110]],
    [[18, 262], [280, 200], [495, 200]], [[18, 262], [240, 250], [420, 275]],
    [[22, 292], [200, 320], [420, 365]], [[22, 292], [180, 370], [380, 470]],
    [[22, 292], [120, 400], [240, 500]], [[22, 292], [90, 360], [150, 470]],
  ];
  for (const [a, b, d] of veins) { g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(b[0], b[1], d[0], d[1]); g.stroke(); }
  g.lineWidth = 3;
  for (const [x1, y1, x2, y2] of [[200, 110, 230, 190], [330, 95, 340, 180], [300, 200, 330, 270], [260, 340, 310, 420], [180, 350, 160, 440]]) {
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  }
  g.lineWidth = 48;
  g.strokeStyle = '#120803';
  g.stroke(fore);
  g.stroke(hind);
  g.fillStyle = 'rgba(255,246,232,.95)';
  const spots = [[300, 62], [360, 66], [420, 84], [470, 120], [488, 175], [470, 220], [430, 255], [380, 275], [352, 340], [410, 385], [412, 430], [372, 470], [320, 492], [260, 498], [200, 488], [150, 462], [105, 430], [70, 390]];
  spots.forEach(([x, y], i) => { g.beginPath(); g.arc(x, y, 5 + (i % 3) * 2, 0, Math.PI * 2); g.fill(); });
  g.restore();

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* ---------- shared geometry / materials ---------- */

const FOV = 40, CAM_Z = 9;
let W = innerWidth, H = innerHeight;
// world units visible vertically at a given depth, and px→world scale there
const visH = (z: number) => 2 * (CAM_Z - z) * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const wpp = (z: number) => visH(z) / H;

// model is built with forward = +Y and wings along ±X; RX turns it so forward = +Z (what lookAt uses)
const RX = new THREE.Matrix4().makeRotationX(Math.PI / 2);
const wingGeoR = new THREE.PlaneGeometry(1, 1).translate(0.5, 0, 0);
const wingGeoL = new THREE.PlaneGeometry(1, 1).translate(-0.5, 0, 0);
const bodyGeo = new THREE.CapsuleGeometry(0.035, 0.42, 4, 8);
const wingMat = (mirror: boolean) =>
  new THREE.MeshLambertMaterial({ map: wingTexture(mirror), alphaTest: 0.3, side: THREE.DoubleSide, emissive: 0x3a1a02 });
const matR = wingMat(false), matL = wingMat(true);
const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a0d06, roughness: 0.6 });

/* the follower: one detailed butterfly */
function makeButterfly() {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  inner.rotation.x = Math.PI / 2;
  root.add(inner);
  const wR = new THREE.Mesh(wingGeoR, matR);
  const wL = new THREE.Mesh(wingGeoL, matL);
  const body = new THREE.Mesh(bodyGeo, darkMat);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), darkMat);
  head.position.y = 0.27;
  const antMat = new THREE.LineBasicMaterial({ color: 0x1a0d06 });
  const ant = (s: number) => new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0.12 * s, 0.5, 0.05), new THREE.Vector3(0.2 * s, 0.56, 0.08)]),
    antMat,
  );
  inner.add(wR, wL, body, head, ant(1), ant(-1));
  return { root, wR, wL };
}

/* ---------- scene ---------- */

function init(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(cssVar('--bg'), 10, 16);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, CAM_Z);

  const hemi = new THREE.HemisphereLight(0xffd6a0, 0x2a1a10, 0.9);
  const sun = new THREE.DirectionalLight(0xffb15e, 1.6);
  sun.position.set(4, 6, 5);
  const rim = new THREE.DirectionalLight(0xff7a2a, 0.6);
  rim.position.set(-5, 2, -3);
  scene.add(hemi, sun, rim, new THREE.AmbientLight(0xffffff, 0.15));

  const applyTheme = () => {
    const light = isLight();
    scene.fog!.color.set(cssVar('--bg'));
    hemi.groundColor.set(light ? 0xd8c4a8 : 0x2a1a10);
    hemi.intensity = light ? 1.2 : 0.9;
  };
  applyTheme();
  addEventListener('themechange', applyTheme);

  /* ---------- swarm ---------- */
  const N = 72;
  const iR = new THREE.InstancedMesh(wingGeoR, matR, N);
  const iL = new THREE.InstancedMesh(wingGeoL, matL, N);
  const iB = new THREE.InstancedMesh(bodyGeo, darkMat, N);
  for (const im of [iR, iL, iB]) { im.frustumCulled = false; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(im); }

  type Member = {
    c: THREE.Vector3; a: number[]; w: number[]; p: number[]; s: number; flap: number; fphase: number;
    delay: number; start: THREE.Vector3; off: THREE.Vector3; pos: THREE.Vector3; prev: THREE.Vector3; q: THREE.Quaternion; hidden: boolean;
  };
  const members: Member[] = [];
  for (let i = 0; i < N; i++) {
    // cloud sits mostly above the headline; sqrt bias pushes members upward
    const c = new THREE.Vector3(rand(-5.5, 5.5), 0.3 + 2.8 * Math.sqrt(Math.random()), rand(-4, 1.5));
    members.push({
      c,
      a: [rand(0.5, 1.5), rand(0.3, 0.9), rand(0.3, 1)],
      w: [rand(0.12, 0.4), rand(0.2, 0.55), rand(0.1, 0.35)],
      p: [rand(0, 6.28), rand(0, 6.28), rand(0, 6.28)],
      s: rand(0.2, 0.42),
      flap: rand(13, 21), // ~2–3 beats/s
      fphase: rand(0, 6.28),
      delay: rand(0.2, 2.6),
      start: new THREE.Vector3(c.x + rand(-1, 1), rand(-5, -3.6), c.z),
      off: new THREE.Vector3(),
      pos: new THREE.Vector3(),
      prev: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      hidden: false,
    });
  }

  /* ---------- follower ---------- */
  const fb = makeButterfly();
  const FZ = 0.5, FS = 0.42;
  fb.root.scale.setScalar(FS);
  fb.root.visible = false;
  scene.add(fb.root);

  type Perch = { el: Element; fx: number; scrollAt: number };
  let fActive = false;
  let fMode: 'fly' | 'land' | 'perch' = 'fly';
  const fp = { x: W * 0.75, y: H * 0.4 }, fv = { x: 0, y: 0 };
  let perch: Perch | null = null;
  const land = { x0: 0, y0: 0, t0: 0, dur: 1, scrollAt: 0 };
  const fq = new THREE.Quaternion();
  const hoverSide = Math.random() < 0.5 ? 0.24 : 0.76;

  // anything on the page the follower may sit on
  const candidates = [...document.querySelectorAll('h1, h2, h3, .btn, .card, .eyebrow, blockquote, summary, footer p')];
  const visibleCandidates = () =>
    candidates.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 60 && r.top > 90 && r.bottom < H - 30;
    });
  const perchPoint = (p: Perch) => {
    const r = p.el.getBoundingClientRect();
    return { x: r.left + r.width * p.fx, y: r.top - 6 };
  };
  const inView = (el: Element) => { const r = el.getBoundingClientRect(); return r.bottom > 40 && r.top < H - 20; };

  /* ---------- input ---------- */
  let lastScrollT = -1e9, lastY = scrollY, scrollVel = 0;
  addEventListener('scroll', () => {
    const now = performance.now();
    const dt = Math.max(8, now - lastScrollT);
    scrollVel = clamp(((scrollY - lastY) / dt) * 1000, -3000, 3000);
    lastY = scrollY;
    lastScrollT = now;
  }, { passive: true });

  const cursor = new THREE.Vector3(1e3, 1e3, 0);
  addEventListener('pointermove', (e) => {
    cursor.set((e.clientX - W / 2) * wpp(0), (H / 2 - e.clientY) * wpp(0), 0);
  });

  const resize = () => {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize);
  resize();

  /* ---------- loop ---------- */
  const dummy = new THREE.Object3D();
  const m = new THREE.Matrix4(), mw = new THREE.Matrix4(), rot = new THREE.Matrix4();
  const tmp = new THREE.Vector3(), base = new THREE.Vector3();
  const t0 = performance.now();

  const updateSwarm = (t: number, sy: number) => {
    const drift = 0.6 * Math.sin(t * 0.07);
    for (let i = 0; i < N; i++) {
      const b = members[i];
      base.set(
        b.c.x + b.a[0] * Math.sin(b.w[0] * t + b.p[0]) + drift,
        b.c.y + b.a[1] * Math.sin(b.w[1] * t + b.p[1]),
        b.c.z + b.a[2] * Math.sin(b.w[2] * t + b.p[2]),
      );
      const e = easeInOut(clamp((t - b.delay) / 2.8, 0, 1)); // rise from below the fold
      b.pos.lerpVectors(b.start, base, e);
      b.pos.y -= sy * wpp(b.c.z); // scrolls away with the hero, with depth parallax
      // cursor scatter
      tmp.subVectors(b.pos, cursor); tmp.z = 0;
      const d = tmp.length();
      if (d < 1.6 && e > 0.5) b.off.addScaledVector(tmp.normalize(), (1.6 - d) * 0.1).y += 0.02;
      b.off.multiplyScalar(0.93);
      b.pos.add(b.off);

      tmp.subVectors(b.pos, b.prev);
      if (tmp.lengthSq() > 1e-6) {
        dummy.position.copy(b.pos);
        dummy.lookAt(tmp.add(b.pos));
        b.q.slerp(dummy.quaternion, 0.1);
      }
      b.prev.copy(b.pos);

      const wing = THREE.MathUtils.lerp(1.35, 0.7 + 0.6 * Math.sin(t * b.flap + b.fphase), e);
      m.compose(b.pos, b.q, tmp.setScalar(b.hidden ? 0 : b.s)).multiply(RX);
      iB.setMatrixAt(i, m);
      iR.setMatrixAt(i, mw.copy(m).multiply(rot.makeRotationY(wing)));
      iL.setMatrixAt(i, mw.copy(m).multiply(rot.makeRotationY(-wing)));
    }
    iR.instanceMatrix.needsUpdate = iL.instanceMatrix.needsUpdate = iB.instanceMatrix.needsUpdate = true;
  };

  const updateFollower = (t: number, now: number, sy: number) => {
    const scrolling = now - lastScrollT < 180;
    if (!scrolling) scrollVel *= 0.9;

    if (!fActive) {
      if (sy < 60) return;
      // one member peels off from where it is on screen
      fActive = true;
      members[0].hidden = true;
      tmp.copy(members[0].pos).project(camera);
      fp.x = ((tmp.x + 1) / 2) * W; fp.y = ((1 - tmp.y) / 2) * H;
      fv.x = fv.y = 0;
      fMode = 'fly';
      fb.root.visible = true;
    } else if (sy < 40) {
      // back at the top: rejoin the swarm
      fActive = false;
      members[0].hidden = false;
      fb.root.visible = false;
      return;
    }

    if (fMode === 'perch' && perch && (Math.abs(sy - perch.scrollAt) > 80 || !inView(perch.el))) { fMode = 'fly'; perch = null; }
    if (fMode === 'land' && Math.abs(sy - land.scrollAt) > 40) { fMode = 'fly'; perch = null; }

    if (fMode === 'fly') {
      const tx = W * hoverSide + Math.sin(now * 0.0007) * W * 0.05;
      const ty = H * 0.4 + Math.sin(now * 0.0011) * H * 0.05 - clamp(scrollVel * 0.1, -140, 140);
      fv.x = (fv.x + (tx - fp.x) * 0.012) * 0.9;
      fv.y = (fv.y + (ty - fp.y) * 0.012) * 0.9;
      fp.x += fv.x; fp.y += fv.y;
      if (now - lastScrollT > 1400) {
        const vis = visibleCandidates();
        if (vis.length) {
          const el = vis[Math.floor(Math.random() * vis.length)];
          perch = { el, fx: rand(0.1, 0.9), scrollAt: sy };
          const pt = perchPoint(perch);
          land.x0 = fp.x; land.y0 = fp.y; land.t0 = now; land.scrollAt = sy;
          land.dur = clamp(Math.hypot(pt.x - fp.x, pt.y - fp.y) * 3.4, 1800, 3600);
          fMode = 'land';
        }
      }
    } else if (fMode === 'land' && perch) {
      const u = clamp((now - land.t0) / land.dur, 0, 1);
      const e = easeInOut(u);
      const pt = perchPoint(perch);
      // arc: lift above the straight line, then settle
      const mx = (land.x0 + pt.x) / 2, my = Math.min(land.y0, pt.y) - H * 0.12;
      const x = (1 - e) ** 2 * land.x0 + 2 * (1 - e) * e * mx + e * e * pt.x;
      const y = (1 - e) ** 2 * land.y0 + 2 * (1 - e) * e * my + e * e * pt.y;
      fv.x = x - fp.x; fv.y = y - fp.y;
      fp.x = x; fp.y = y;
      if (u >= 1) { fMode = 'perch'; perch.scrollAt = sy; }
    } else if (fMode === 'perch' && perch) {
      const pt = perchPoint(perch);
      fp.x += (pt.x - fp.x) * 0.3; fp.y += (pt.y - fp.y) * 0.3;
      fv.x = fv.y = 0;
    }

    /* pose */
    const s = wpp(FZ);
    fb.root.position.set((fp.x - W / 2) * s, (H / 2 - fp.y) * s, FZ);
    const speed = Math.hypot(fv.x, fv.y);
    let wing: number;
    if (fMode === 'perch') {
      dummy.position.copy(fb.root.position);
      dummy.lookAt(tmp.set(0, 1, 0.8).add(fb.root.position));
      fq.slerp(dummy.quaternion, 0.1);
      const ph = t % 7;
      const bask = ph > 5.5 ? Math.sin((Math.PI * (ph - 5.5)) / 1.5) : 0;
      wing = THREE.MathUtils.lerp(0.95 + 0.12 * Math.sin(t * 1.6), 0.25, bask);
    } else {
      if (speed > 0.4) {
        dummy.position.copy(fb.root.position);
        dummy.lookAt(tmp.set(fv.x, -fv.y, 0).normalize().multiplyScalar(2).setZ(0.4).add(fb.root.position));
        dummy.rotateZ(clamp(-fv.x * 0.02, -0.5, 0.5)); // bank into turns
        fq.slerp(dummy.quaternion, 0.14);
      }
      wing = 0.7 + 0.6 * Math.sin(t * 19);
      if (fMode === 'land') {
        const u = clamp((now - land.t0) / land.dur, 0, 1);
        if (u > 0.8) {
          const k = (u - 0.8) / 0.2;
          dummy.position.copy(fb.root.position);
          dummy.lookAt(tmp.set(0, 1, 0.8).add(fb.root.position));
          fq.slerp(dummy.quaternion, 0.08 + 0.2 * k);
          wing = THREE.MathUtils.lerp(wing, 0.95, k);
        }
      }
    }
    fb.root.quaternion.copy(fq);
    fb.wR.rotation.y = wing;
    fb.wL.rotation.y = -wing;
  };

  const loop = () => {
    const now = performance.now();
    const t = (now - t0) / 1000;
    const sy = scrollY;
    const swarmOn = sy < H * 1.6;
    iR.visible = iL.visible = iB.visible = swarmOn;
    if (swarmOn) updateSwarm(t, sy);
    updateFollower(t, now, sy);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  loop();
}

const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (canvas && !reduce) init(canvas);
