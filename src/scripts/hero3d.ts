import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/*
  Full-page monarch scene on one fixed canvas.
  Hero: a swarm rises from below the fold into a slow drifting cloud; the cursor scatters it.
  Scroll: one monarch leaves the swarm and follows the viewport. Stop scrolling and it lands on
  whatever is on screen (a heading, a card, a button) until you move again, all the way to the footer.
  Wings are painted on canvas (forewing and hindwing separately), the swarm is instanced: five draw calls.
*/

function isLight() { return document.documentElement.dataset.theme === 'light'; }
function cssVar(n: string) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - ((-2 * u + 2) ** 2) / 2);

/* ---------- wing painting ---------- */

type Pt = [number, number];
type Seg = [Pt, Pt, Pt, Pt]; // cubic bezier: p0, c1, c2, p3
type WingSpec = {
  w: number; h: number; segs: Seg[]; spotSegs: number[]; base: Pt; veins: Pt[][]; border: number;
  apex?: { path: Pt[]; patches: number[][] }; scent?: Pt;
};

const bez = (s: Seg, t: number): Pt => {
  const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * s[0][0] + b * s[1][0] + c * s[2][0] + d * s[3][0], a * s[0][1] + b * s[1][1] + c * s[2][1] + d * s[3][1]];
};
const outline = (segs: Seg[]) => {
  const p = new Path2D();
  p.moveTo(segs[0][0][0], segs[0][0][1]);
  for (const s of segs) p.bezierCurveTo(s[1][0], s[1][1], s[2][0], s[2][1], s[3][0], s[3][1]);
  p.closePath();
  return p;
};
const vein = (g: CanvasRenderingContext2D, v: Pt[]) => {
  g.beginPath();
  g.moveTo(v[0][0], v[0][1]);
  g.quadraticCurveTo(v[1][0], v[1][1], v[2][0], v[2][1]);
  g.stroke();
};

function paintWing(spec: WingSpec, mirror: boolean) {
  const c = document.createElement('canvas');
  c.width = spec.w; c.height = spec.h;
  const g = c.getContext('2d')!;
  if (mirror) { g.translate(spec.w, 0); g.scale(-1, 1); }
  const shape = outline(spec.segs);
  const [bx, by] = spec.base;

  // orange field: dark and dusty at the base, brightest two thirds out
  const grad = g.createRadialGradient(bx, by, 10, bx, by, spec.w * 0.95);
  grad.addColorStop(0, '#6e2405');
  grad.addColorStop(0.1, '#c24d0e');
  grad.addColorStop(0.35, '#ec8214');
  grad.addColorStop(0.7, '#f89c1f');
  grad.addColorStop(1, '#f28f18');
  g.fillStyle = grad;
  g.fill(shape);

  g.save();
  g.clip(shape);
  // scales: thousands of short strokes radiating from the base
  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * spec.w, y = Math.random() * spec.h;
    const a = Math.atan2(y - by, x - bx), l = rand(5, 16);
    g.strokeStyle = Math.random() < 0.5 ? 'rgba(255,225,160,.09)' : 'rgba(70,25,0,.10)';
    g.lineWidth = rand(1, 2.5);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // forewing apex: black field with pale patches
  if (spec.apex) {
    g.fillStyle = '#100702';
    g.beginPath();
    g.moveTo(spec.apex.path[0][0], spec.apex.path[0][1]);
    for (const p of spec.apex.path.slice(1)) g.lineTo(p[0], p[1]);
    g.closePath();
    g.fill();
    for (const [x, y, rx, ry, white] of spec.apex.patches) {
      g.fillStyle = white ? 'rgba(255,246,228,.95)' : 'rgba(240,170,90,.9)';
      g.beginPath(); g.ellipse(x, y, rx, ry, -0.4, 0, Math.PI * 2); g.fill();
    }
  }
  // veins: soft dark dusting first, then the vein itself
  g.lineCap = 'round';
  for (const v of spec.veins) {
    g.strokeStyle = 'rgba(40,14,4,.28)'; g.lineWidth = 20; vein(g, v);
    g.strokeStyle = '#120803'; g.lineWidth = 7; vein(g, v);
  }
  // margin: dusted edge, then the solid band (stroke is centred on the outline, half of it lands inside)
  g.strokeStyle = 'rgba(16,7,2,.55)'; g.lineWidth = spec.border * 2 + 36; g.stroke(shape);
  g.strokeStyle = '#100702'; g.lineWidth = spec.border * 2; g.stroke(shape);
  // two rows of white spots along the outer margins
  g.fillStyle = 'rgba(255,246,228,.95)';
  for (const si of spec.spotSegs) {
    const s = spec.segs[si];
    let k = 0;
    for (let t = 0.04; t < 0.98; t += 0.055, k++) {
      const [x, y] = bez(s, t), [x2, y2] = bez(s, t + 0.01);
      let nx = -(y2 - y), ny = x2 - x;
      const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      if ((bx - x) * nx + (by - y) * ny < 0) { nx = -nx; ny = -ny; } // point inward
      g.beginPath(); g.arc(x + nx * 12, y + ny * 12, rand(4, 6), 0, 7); g.fill();
      if (k % 2 === 0) { g.beginPath(); g.arc(x + nx * (spec.border - 8), y + ny * (spec.border - 8), rand(6, 9), 0, 7); g.fill(); }
    }
  }
  if (spec.scent) { g.fillStyle = '#0d0602'; g.beginPath(); g.ellipse(spec.scent[0], spec.scent[1], 16, 9, -0.5, 0, 7); g.fill(); }
  // dark dusting where the wing meets the body
  const dust = g.createRadialGradient(bx, by, 0, bx, by, 150);
  dust.addColorStop(0, 'rgba(20,8,2,.85)');
  dust.addColorStop(1, 'rgba(20,8,2,0)');
  g.fillStyle = dust;
  g.fillRect(0, 0, spec.w, spec.h);
  g.restore();

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// canvas space: wing base at the left edge, head toward the top
const FORE: WingSpec = {
  w: 1024, h: 720, base: [30, 560], border: 50, spotSegs: [1, 2],
  segs: [
    [[8, 520], [240, 330], [620, 70], [985, 95]],      // costa to apex
    [[985, 95], [1000, 170], [930, 420], [830, 640]],  // outer margin to tornus
    [[830, 640], [640, 690], [300, 660], [8, 600]],    // inner margin back to base
    [[8, 600], [4, 570], [4, 540], [8, 520]],
  ],
  veins: [
    [[30, 540], [350, 320], [760, 150]],
    [[30, 555], [300, 400], [560, 250]],
    [[30, 565], [300, 470], [540, 420]],
    [[560, 250], [560, 335], [540, 420]], // discal cell closes here
    [[560, 250], [760, 150], [985, 100]],
    [[560, 250], [760, 240], [960, 260]],
    [[550, 335], [740, 350], [920, 380]],
    [[540, 420], [720, 460], [880, 500]],
    [[330, 500], [600, 560], [830, 640]],
    [[200, 560], [400, 610], [600, 665]],
    [[30, 600], [150, 630], [300, 650]],
  ],
  apex: {
    path: [[690, 150], [700, 0], [1100, 0], [1100, 420], [935, 400], [820, 300]],
    patches: [[790, 175, 26, 14, 0], [880, 150, 24, 12, 0], [930, 240, 18, 12, 0], [860, 300, 20, 12, 0], [790, 230, 14, 9, 1], [905, 340, 8, 6, 1]],
  },
};
const HIND: WingSpec = {
  w: 768, h: 768, base: [30, 150], border: 46, spotSegs: [1, 2], scent: [330, 470],
  segs: [
    [[8, 130], [200, 40], [520, 30], [660, 150]],
    [[660, 150], [800, 300], [760, 560], [560, 690]],
    [[560, 690], [400, 780], [160, 720], [60, 560]],
    [[60, 560], [10, 480], [0, 300], [8, 130]],
  ],
  veins: [
    [[30, 140], [250, 120], [520, 90]],
    [[30, 150], [200, 180], [330, 250]],
    [[30, 165], [180, 300], [300, 380]],
    [[330, 250], [330, 315], [300, 380]],
    [[330, 250], [500, 170], [660, 150]],
    [[330, 250], [540, 260], [740, 300]],
    [[315, 315], [520, 400], [700, 480]],
    [[300, 380], [450, 520], [600, 660]],
    [[150, 420], [280, 600], [420, 740]],
    [[40, 300], [100, 520], [200, 700]],
  ],
};

function bodyTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0d0703';
  g.fillRect(0, 0, 128, 256);
  g.fillStyle = 'rgba(255,245,230,.9)';
  for (let i = 0; i < 70; i++) { g.beginPath(); g.arc(Math.random() * 128, Math.random() * 256, rand(2, 4), 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
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

// wing planes hinge on the body axis (x = 0); a slight cup droops the tips
const wingGeo = (w: number, h: number, cx: number, cy: number, z: number, mirror: boolean) => {
  const geo = new THREE.PlaneGeometry(w, h, 10, 8).translate(mirror ? -cx : cx, cy, z);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); pos.setZ(i, pos.getZ(i) + 0.05 * x * x + 0.012 * Math.abs(x)); }
  geo.computeVertexNormals();
  return geo;
};
const foreGeoR = wingGeo(1, 0.703, 0.5, 0.1985, -0.004, false), foreGeoL = wingGeo(1, 0.703, 0.5, 0.1985, -0.004, true);
const hindGeoR = wingGeo(0.72, 0.72, 0.36, -0.24, 0.004, false), hindGeoL = wingGeo(0.72, 0.72, 0.36, -0.24, 0.004, true);

const wingMaterial = (map: THREE.Texture) =>
  new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: 0.32, roughness: 0.9, metalness: 0, alphaTest: 0.35, side: THREE.DoubleSide });
const foreMatR = wingMaterial(paintWing(FORE, false)), foreMatL = wingMaterial(paintWing(FORE, true));
const hindMatR = wingMaterial(paintWing(HIND, false)), hindMatL = wingMaterial(paintWing(HIND, true));
const wingMats = [foreMatR, foreMatL, hindMatR, hindMatL];

// thorax + tapered abdomen as one lathe, head as a sphere, white-spotted like the real thing
const bodyGeo = mergeGeometries([
  new THREE.LatheGeometry(
    [[0, 0.24], [0.05, 0.21], [0.075, 0.12], [0.07, 0.03], [0.05, -0.04], [0.045, -0.18], [0.032, -0.32], [0.015, -0.42], [0, -0.45]].map(([r, y]) => new THREE.Vector2(r, y)),
    18,
  ),
  new THREE.SphereGeometry(0.058, 14, 12).translate(0, 0.27, 0),
])!;
const bodyMat = new THREE.MeshStandardMaterial({ map: bodyTexture(), roughness: 0.85 });

/* the follower: one detailed butterfly */
function makeButterfly() {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  inner.rotation.x = Math.PI / 2;
  root.add(inner);
  const foreR = new THREE.Mesh(foreGeoR, foreMatR), foreL = new THREE.Mesh(foreGeoL, foreMatL);
  const hindR = new THREE.Mesh(hindGeoR, hindMatR), hindL = new THREE.Mesh(hindGeoL, hindMatL);
  const antMat = new THREE.LineBasicMaterial({ color: 0x0d0703 });
  const club = new THREE.SphereGeometry(0.012, 8, 6);
  const ant = (s: number) => {
    const g = new THREE.Group();
    g.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.3, -0.02), new THREE.Vector3(0.1 * s, 0.5, -0.08), new THREE.Vector3(0.2 * s, 0.6, -0.12)]),
      antMat,
    ));
    const c = new THREE.Mesh(club, bodyMat);
    c.position.set(0.2 * s, 0.6, -0.12);
    g.add(c);
    return g;
  };
  inner.add(foreR, foreL, hindR, hindL, new THREE.Mesh(bodyGeo, bodyMat), ant(1), ant(-1));
  const setWings = (fore: number, hind: number) => {
    foreR.rotation.y = fore; foreL.rotation.y = -fore;
    hindR.rotation.y = hind; hindL.rotation.y = -hind;
  };
  return { root, setWings };
}

/* ---------- scene ---------- */

function init(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(cssVar('--bg'), 10, 16);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, CAM_Z);

  const hemi = new THREE.HemisphereLight(0xffd6a0, 0x2a1a10, 0.9);
  const sun = new THREE.DirectionalLight(0xffb15e, 1.8);
  sun.position.set(4, 6, 5);
  const rim = new THREE.DirectionalLight(0xff7a2a, 0.7);
  rim.position.set(-5, 2, -3);
  const fill = new THREE.DirectionalLight(0x8fb0ff, 0.35); // cool fill from below for depth on the undersides
  fill.position.set(-3, -2, 4);
  scene.add(hemi, sun, rim, fill, new THREE.AmbientLight(0xffffff, 0.15));

  const applyTheme = () => {
    const light = isLight();
    scene.fog!.color.set(cssVar('--bg'));
    hemi.groundColor.set(light ? 0xd8c4a8 : 0x2a1a10);
    hemi.intensity = light ? 1.2 : 0.9;
    for (const mt of wingMats) mt.emissiveIntensity = light ? 0.12 : 0.32;
  };
  applyTheme();
  addEventListener('themechange', applyTheme);

  /* ---------- swarm ---------- */
  const N = 72;
  const iFR = new THREE.InstancedMesh(foreGeoR, foreMatR, N), iFL = new THREE.InstancedMesh(foreGeoL, foreMatL, N);
  const iHR = new THREE.InstancedMesh(hindGeoR, hindMatR, N), iHL = new THREE.InstancedMesh(hindGeoL, hindMatL, N);
  const iB = new THREE.InstancedMesh(bodyGeo, bodyMat, N);
  const inst = [iFR, iFL, iHR, iHL, iB];
  for (const im of inst) { im.frustumCulled = false; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(im); }

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

      // hindwing trails the forewing by a fraction of a beat
      const ph = t * b.flap + b.fphase;
      const fore = THREE.MathUtils.lerp(1.35, 0.7 + 0.6 * Math.sin(ph), e);
      const hind = THREE.MathUtils.lerp(1.3, 0.62 + 0.5 * Math.sin(ph - 0.45), e);
      m.compose(b.pos, b.q, tmp.setScalar(b.hidden ? 0 : b.s)).multiply(RX);
      iB.setMatrixAt(i, m);
      iFR.setMatrixAt(i, mw.copy(m).multiply(rot.makeRotationY(fore)));
      iFL.setMatrixAt(i, mw.copy(m).multiply(rot.makeRotationY(-fore)));
      iHR.setMatrixAt(i, mw.copy(m).multiply(rot.makeRotationY(hind)));
      iHL.setMatrixAt(i, mw.copy(m).multiply(rot.makeRotationY(-hind)));
    }
    for (const im of inst) im.instanceMatrix.needsUpdate = true;
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
    let fore: number, hind: number;
    if (fMode === 'perch') {
      dummy.position.copy(fb.root.position);
      dummy.lookAt(tmp.set(0, 1, 0.8).add(fb.root.position));
      fq.slerp(dummy.quaternion, 0.1);
      const ph = t % 7;
      const bask = ph > 5.5 ? Math.sin((Math.PI * (ph - 5.5)) / 1.5) : 0;
      fore = THREE.MathUtils.lerp(0.95 + 0.12 * Math.sin(t * 1.6), 0.25, bask);
      hind = fore * 0.9;
    } else {
      if (speed > 0.4) {
        dummy.position.copy(fb.root.position);
        dummy.lookAt(tmp.set(fv.x, -fv.y, 0).normalize().multiplyScalar(2).setZ(0.4).add(fb.root.position));
        dummy.rotateZ(clamp(-fv.x * 0.02, -0.5, 0.5)); // bank into turns
        fq.slerp(dummy.quaternion, 0.14);
      }
      fore = 0.7 + 0.6 * Math.sin(t * 19);
      hind = 0.62 + 0.5 * Math.sin(t * 19 - 0.45);
      if (fMode === 'land') {
        const u = clamp((now - land.t0) / land.dur, 0, 1);
        if (u > 0.8) {
          const k = (u - 0.8) / 0.2;
          dummy.position.copy(fb.root.position);
          dummy.lookAt(tmp.set(0, 1, 0.8).add(fb.root.position));
          fq.slerp(dummy.quaternion, 0.08 + 0.2 * k);
          fore = THREE.MathUtils.lerp(fore, 0.95, k);
          hind = THREE.MathUtils.lerp(hind, 0.85, k);
        }
      }
    }
    fb.root.quaternion.copy(fq);
    fb.setWings(fore, hind);
  };

  const loop = () => {
    const now = performance.now();
    const t = (now - t0) / 1000;
    const sy = scrollY;
    const swarmOn = sy < H * 1.6;
    for (const im of inst) im.visible = swarmOn;
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
