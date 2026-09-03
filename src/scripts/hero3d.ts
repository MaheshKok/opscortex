import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/*
  Full-page blue morpho scene on one fixed canvas.
  Hero: a swarm rises from below the fold into a slow drifting cloud; the cursor scatters it.
  Scroll: the swarm flies off sideways and upward at its own pace; one morpho leaves it and follows the viewport. Stop scrolling and it lands on
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
  w: number; h: number; segs: Seg[]; base: Pt; veins: Pt[][]; border: number;
  edge: number[];           // outline segments that carry the dark margin
  costa?: [number, number]; // dark band along the leading edge: width at the base, width at the apex
  scallops?: number;        // notches per edge segment (hindwing)
  innerDark?: boolean;      // brown field along the inner margin, where the hindwing meets the abdomen
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
  // point on a segment plus the unit normal pointing into the wing
  const normalAt = (s: Seg, t: number): [Pt, Pt] => {
    const p = bez(s, t), p2 = bez(s, Math.min(1, t + 0.01));
    let nx = -(p2[1] - p[1]), ny = p2[0] - p[0];
    const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    if ((bx - p[0]) * nx + (by - p[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return [p, [nx, ny]];
  };
  const edgePath = () => {
    const p = new Path2D();
    p.moveTo(spec.segs[spec.edge[0]][0][0], spec.segs[spec.edge[0]][0][1]);
    for (const i of spec.edge) { const s = spec.segs[i]; p.bezierCurveTo(s[1][0], s[1][1], s[2][0], s[2][1], s[3][0], s[3][1]); }
    return p;
  };
  // a filled polygon with a blurred edge, so dark fields melt into the blue instead of ending in a line
  const soft = (pts: Pt[], color: string, blur: number) => {
    g.save();
    g.shadowColor = color; g.shadowBlur = blur;
    g.fillStyle = color;
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
    g.closePath(); g.fill(); g.fill();
    g.restore();
  };

  // structural blue: bright cyan close to the body, electric blue mid-wing, deep blue toward the edge
  const grad = g.createRadialGradient(bx, by, 10, bx, by, spec.w * 0.98);
  grad.addColorStop(0, '#2fa8ea');
  grad.addColorStop(0.12, '#3fe0ff');
  grad.addColorStop(0.42, '#19b4ff');
  grad.addColorStop(0.72, '#1a7cf2');
  grad.addColorStop(1, '#1236a6');
  g.fillStyle = grad;
  g.fill(shape);

  g.save();
  g.clip(shape);
  // iridescent sheen: a diagonal streak of pale cyan, the way light catches morpho scales
  const sheen = g.createLinearGradient(bx, by, spec.w, 0);
  sheen.addColorStop(0, 'rgba(200,255,255,0)');
  sheen.addColorStop(0.35, 'rgba(200,255,255,.22)');
  sheen.addColorStop(0.55, 'rgba(200,255,255,0)');
  g.fillStyle = sheen; g.fillRect(0, 0, spec.w, spec.h);
  // scales: thousands of short strokes radiating from the base
  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * spec.w, y = Math.random() * spec.h;
    const a = Math.atan2(y - by, x - bx), l = rand(5, 16);
    g.strokeStyle = Math.random() < 0.5 ? 'rgba(190,255,255,.10)' : 'rgba(10,30,120,.12)';
    g.lineWidth = rand(1, 2.5);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // veins: faint and a shade darker than the field, never black
  g.lineCap = 'round';
  for (const v of spec.veins) {
    g.strokeStyle = 'rgba(8,30,110,.22)'; g.lineWidth = 16; vein(g, v);
    g.strokeStyle = 'rgba(12,40,140,.5)'; g.lineWidth = 4; vein(g, v);
  }
  // leading edge: black-brown band from the base, widening into the whole apex, violet where it meets the blue
  if (spec.costa) {
    const [w0, w1] = spec.costa, inner: Pt[] = [];
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const [p, n] = normalAt(spec.segs[0], t);
      const w = w0 + (w1 - w0) * t * t;
      inner.push([p[0] + n[0] * w, p[1] + n[1] * w]);
    }
    const s0 = spec.segs[0][0], apex = spec.segs[0][3];
    const path: Pt[] = [[s0[0] - 200, s0[1] - 200], [apex[0] + 200, -200], [apex[0] + 200, apex[1] + 220], ...inner.reverse()];
    soft(path, 'rgba(40,24,96,.85)', 100);
    soft(path, '#0d0a10', 40);
  }
  // inner margin of the hindwing: brown where it lies against the abdomen
  if (spec.innerDark) {
    const s = spec.segs[3], inner: Pt[] = [];
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const [p, n] = normalAt(s, t);
      const w = 30 + 90 * (1 - t) * (1 - t);
      inner.push([p[0] + n[0] * w, p[1] + n[1] * w]);
    }
    soft([...inner, [-200, s[3][1] - 100], [-200, s[0][1] + 200]], 'rgba(46,30,20,.95)', 70);
  }
  // outer margin: soft dark dusting, then the thin dark edge
  const edge = edgePath();
  g.lineCap = 'butt';
  g.strokeStyle = 'rgba(8,10,40,.45)'; g.lineWidth = spec.border * 2 + 70; g.stroke(edge);
  g.strokeStyle = '#0b0910'; g.lineWidth = spec.border * 2; g.stroke(edge);
  // scalloped hindwing edge: cut notches, leave a white fringe dot on each tooth
  if (spec.scallops) {
    for (const i of spec.edge) {
      const s = spec.segs[i], step = 1 / spec.scallops;
      for (let t = step / 2; t < 1; t += step) {
        const [p, n] = normalAt(s, t);
        g.save(); g.globalCompositeOperation = 'destination-out';
        g.beginPath(); g.arc(p[0] - n[0] * 12, p[1] - n[1] * 12, 22, 0, 7); g.fill();
        g.restore();
        const [q, m] = normalAt(s, Math.min(0.995, t + step / 2));
        g.fillStyle = 'rgba(255,255,255,.92)';
        g.beginPath(); g.arc(q[0] + m[0] * 7, q[1] + m[1] * 7, 5, 0, 7); g.fill();
      }
    }
  }
  // brown dusting where the wing meets the body
  const dust = g.createRadialGradient(bx, by, 0, bx, by, 140);
  dust.addColorStop(0, 'rgba(34,20,12,.9)');
  dust.addColorStop(1, 'rgba(34,20,12,0)');
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
  w: 1024, h: 720, base: [30, 560], border: 16, edge: [1], costa: [50, 230],
  segs: [
    [[8, 520], [220, 300], [600, 50], [1000, 40]],     // costa to the drawn-out apex
    [[1000, 40], [930, 180], [900, 450], [830, 640]],  // outer margin, slightly concave, to the tornus
    [[830, 640], [640, 700], [300, 670], [8, 600]],    // inner margin back to base
    [[8, 600], [4, 570], [4, 540], [8, 520]],
  ],
  veins: [
    [[30, 540], [350, 320], [760, 150]],
    [[30, 555], [300, 400], [560, 250]],
    [[30, 565], [300, 470], [540, 420]],
    [[560, 250], [560, 335], [540, 420]], // discal cell closes here
    [[560, 250], [760, 150], [990, 60]],
    [[560, 250], [760, 240], [950, 260]],
    [[550, 335], [740, 350], [920, 380]],
    [[540, 420], [720, 460], [880, 500]],
    [[330, 500], [600, 560], [830, 640]],
    [[200, 560], [400, 610], [600, 665]],
    [[30, 600], [150, 630], [300, 650]],
  ],
};
const HIND: WingSpec = {
  w: 768, h: 768, base: [30, 150], border: 11, edge: [1, 2], scallops: 6, innerDark: true,
  segs: [
    [[8, 130], [200, 30], [540, 20], [680, 150]],
    [[680, 150], [800, 320], [760, 580], [560, 700]],
    [[560, 700], [400, 790], [170, 730], [60, 570]],
    [[60, 570], [10, 480], [0, 300], [8, 130]],
  ],
  veins: [
    [[30, 140], [250, 120], [520, 90]],
    [[30, 150], [200, 180], [330, 250]],
    [[30, 165], [180, 300], [300, 380]],
    [[330, 250], [330, 315], [300, 380]],
    [[330, 250], [500, 170], [680, 150]],
    [[330, 250], [540, 260], [750, 320]],
    [[315, 315], [520, 400], [720, 500]],
    [[300, 380], [450, 520], [600, 670]],
    [[150, 420], [280, 600], [420, 740]],
    [[40, 300], [100, 520], [200, 700]],
  ],
};

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

// physical material: thin-film iridescence and a cyan sheen give the blue its shifting, metallic look
const wingMaterial = (map: THREE.Texture) =>
  new THREE.MeshPhysicalMaterial({
    map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: 0.28,
    roughness: 0.5, metalness: 0.05,
    iridescence: 0.6, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 420],
    sheen: 0.5, sheenColor: new THREE.Color(0x8fe8ff), sheenRoughness: 0.6,
    clearcoat: 0.25, clearcoatRoughness: 0.4,
    alphaTest: 0.35, side: THREE.DoubleSide,
  });
const foreMatR = wingMaterial(paintWing(FORE, false)), foreMatL = wingMaterial(paintWing(FORE, true));
const hindMatR = wingMaterial(paintWing(HIND, false)), hindMatL = wingMaterial(paintWing(HIND, true));
const wingMats = [foreMatR, foreMatL, hindMatR, hindMatL];

// thorax + tapered abdomen as one lathe, head as a sphere, plain dark brown
const bodyGeo = mergeGeometries([
  new THREE.LatheGeometry(
    [[0, 0.24], [0.05, 0.21], [0.075, 0.12], [0.07, 0.03], [0.05, -0.04], [0.045, -0.18], [0.032, -0.32], [0.015, -0.42], [0, -0.45]].map(([r, y]) => new THREE.Vector2(r, y)),
    18,
  ),
  new THREE.SphereGeometry(0.058, 14, 12).translate(0, 0.27, 0),
])!;
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a110b, roughness: 0.8 });

/* the follower: one detailed butterfly */
function makeButterfly() {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  inner.rotation.x = Math.PI / 2;
  root.add(inner);
  const foreR = new THREE.Mesh(foreGeoR, foreMatR), foreL = new THREE.Mesh(foreGeoL, foreMatL);
  const hindR = new THREE.Mesh(hindGeoR, hindMatR), hindL = new THREE.Mesh(hindGeoL, hindMatL);
  const antMat = new THREE.LineBasicMaterial({ color: 0x14100c });
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

// follow: no swarm, only the follower, which flies in from the side you came from
function init(canvas: HTMLCanvasElement, follow: boolean, enterFrom: 'left' | 'right') {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(cssVar('--bg'), 10, 16);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, CAM_Z);

  const hemi = new THREE.HemisphereLight(0xdfeeff, 0x101a33, 0.9);
  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(4, 6, 5);
  const rim = new THREE.DirectionalLight(0x4fb8ff, 0.9);
  rim.position.set(-5, 2, -3);
  const fill = new THREE.DirectionalLight(0x8fb0ff, 0.35); // cool fill from below for depth on the undersides
  fill.position.set(-3, -2, 4);
  scene.add(hemi, sun, rim, fill, new THREE.AmbientLight(0xffffff, 0.15));

  const applyTheme = () => {
    const light = isLight();
    scene.fog!.color.set(cssVar('--bg'));
    hemi.groundColor.set(light ? 0xbfd0e8 : 0x101a33);
    hemi.intensity = light ? 1.2 : 0.9;
    for (const mt of wingMats) mt.emissiveIntensity = light ? 0.1 : 0.28;
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
    exit: THREE.Vector3; exitDist: number; speed: number; stagger: number; prog: number;
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
      // where it goes when you scroll: most leave sideways, some straight up, all at their own pace
      exit: Math.random() < 0.35
        ? new THREE.Vector3(rand(-0.3, 0.3), 1, 0).normalize()
        : new THREE.Vector3(Math.sign(c.x || 1), rand(0.15, 0.5), 0).normalize(),
      exitDist: 13,
      speed: rand(2.5, 4.5), // world units per second, roughly a real butterfly's cruise
      stagger: rand(0, 0.8),
      prog: 0,
    });
  }
  let dispersed = false, disperseAt = 0, allGone = false;

  /* ---------- follower ---------- */
  const fb = makeButterfly();
  const FZ = 0.5, FS = 0.42;
  fb.root.scale.setScalar(FS);
  fb.root.visible = false;
  scene.add(fb.root);
  // compile every shader now (compile() walks hidden objects too); otherwise the follower's first
  // appearance links its programs mid-scroll, a ~40ms hitch at the worst moment
  renderer.compile(scene, camera);

  type Perch = { el: Element; fx: number; scrollAt: number };
  let fActive = false;
  let fMode: 'fly' | 'land' | 'perch' = 'fly';
  // fp is in page pixels (y includes scroll), so the page can run away from the butterfly; it never teleports
  // sub-pages: enters from the left when you move forward through the site, from the right when you go back, and keeps to that side
  const hoverSide = follow ? (enterFrom === 'left' ? 0.24 : 0.76) : Math.random() < 0.5 ? 0.24 : 0.76;
  const fp = { x: follow ? (enterFrom === 'left' ? -W * 0.15 : W * 1.15) : W * 0.75, y: H * 0.4 }, fv = { x: 0, y: 0 };
  const F_SPEED = 700; // px/s, about the swarm's cruise at this depth
  let perch: Perch | null = null;
  const land = { x0: 0, y0: 0, t0: 0, dur: 1, scrollAt: 0 };
  const fq = new THREE.Quaternion();

  // anything on the page the follower may sit on
  const candidates = [...document.querySelectorAll('h1, h2, h3, .btn, .card, .eyebrow, blockquote, summary, footer p')];
  const visibleCandidates = () =>
    candidates.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 60 && r.top > 90 && r.bottom < H - 30;
    });
  const perchPoint = (p: Perch) => {
    const r = p.el.getBoundingClientRect();
    return { x: r.left + r.width * p.fx, y: r.top - 6 + scrollY };
  };
  const inView = (el: Element) => { const r = el.getBoundingClientRect(); return r.bottom > 40 && r.top < H - 20; };

  /* ---------- input ---------- */
  let lastScrollT = -1e9;
  addEventListener('scroll', () => { lastScrollT = performance.now(); }, { passive: true });

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

  const updateSwarm = (t: number, dt: number) => {
    const drift = 0.6 * Math.sin(t * 0.07);
    allGone = dispersed;
    for (let i = 0; i < N; i++) {
      const b = members[i];
      base.set(
        b.c.x + b.a[0] * Math.sin(b.w[0] * t + b.p[0]) + drift,
        b.c.y + b.a[1] * Math.sin(b.w[1] * t + b.p[1]),
        b.c.z + b.a[2] * Math.sin(b.w[2] * t + b.p[2]),
      );
      const e = easeInOut(clamp((t - b.delay) / 2.8, 0, 1)); // rise from below the fold
      b.pos.lerpVectors(b.start, base, e);
      // scrolling sends it off screen (and back) at its own speed, never the page's
      const leaving = dispersed && t - disperseAt > b.stagger;
      const step = (dt * b.speed) / b.exitDist;
      b.prog = clamp(b.prog + (leaving ? step : -step), 0, 1);
      if (b.prog < 1) allGone = false;
      b.pos.addScaledVector(b.exit, easeInOut(b.prog) * b.exitDist);
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

  const updateFollower = (t: number, dt: number, now: number, sy: number) => {
    if (!fActive) {
      if (follow) {
        // no swarm here: it flies in from the edge as soon as the page is up
        fp.y = sy + H * 0.4;
      } else {
        if (sy < 60) return;
        // one member peels off from where it is on screen
        members[0].hidden = true;
        tmp.copy(members[0].pos).project(camera);
        fp.x = ((tmp.x + 1) / 2) * W; fp.y = ((1 - tmp.y) / 2) * H + sy;
      }
      fActive = true;
      fv.x = fv.y = 0;
      fMode = 'fly';
      fb.root.visible = true;
    } else if (!follow && sy < 40) {
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
      const ty = sy + H * 0.4 + Math.sin(now * 0.0011) * H * 0.05;
      fv.x = (fv.x + (tx - fp.x) * 0.012) * 0.9;
      fv.y = (fv.y + (ty - fp.y) * 0.012) * 0.9;
      // its own top speed: a fast scroll leaves it behind (even off screen) and it catches up when you stop
      const cap = F_SPEED * dt, sp = Math.hypot(fv.x, fv.y);
      if (sp > cap) { fv.x *= cap / sp; fv.y *= cap / sp; }
      fp.x += fv.x; fp.y += fv.y;
      const onScreen = Math.abs(fp.y - sy - H * 0.4) < H * 0.5;
      if (now - lastScrollT > 1400 && onScreen) {
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
    fb.root.position.set((fp.x - W / 2) * s, (H / 2 - (fp.y - sy)) * s, FZ);
    const speed = Math.hypot(fv.x, fv.y);
    let fore: number, hind: number;
    if (fMode === 'perch') {
      // always the same pose: head up, wings spread toward the viewer, a slow close-and-open every few seconds
      dummy.position.copy(fb.root.position);
      dummy.lookAt(tmp.set(0, 1, 0.55).add(fb.root.position));
      fq.slerp(dummy.quaternion, 0.1);
      const ph = t % 7;
      const fold = ph > 5.5 ? Math.sin((Math.PI * (ph - 5.5)) / 1.5) : 0;
      fore = THREE.MathUtils.lerp(0.2 + 0.08 * Math.sin(t * 1.4), 1.05, fold);
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
          dummy.lookAt(tmp.set(0, 1, 0.55).add(fb.root.position));
          fq.slerp(dummy.quaternion, 0.08 + 0.2 * k);
          fore = THREE.MathUtils.lerp(fore, 0.2, k);
          hind = THREE.MathUtils.lerp(hind, 0.18, k);
        }
      }
    }
    fb.root.quaternion.copy(fq);
    fb.setWings(fore, hind);
  };

  let lastT = 0;
  const loop = () => {
    const now = performance.now();
    const t = (now - t0) / 1000;
    const dt = Math.min(0.05, t - lastT);
    lastT = t;
    const sy = scrollY;
    if (sy > 40 && !dispersed) { dispersed = true; disperseAt = t; }
    if (sy <= 40) dispersed = false;
    const swarmOn = !follow && !(dispersed && allGone);
    for (const im of inst) im.visible = swarmOn;
    if (swarmOn) updateSwarm(t, dt);
    updateFollower(t, dt, now, sy);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  loop();
}

const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// site order decides the entry side: a higher index than the last page seen is "forward" (from the left), lower is "back" (from the right)
const PAGES = ['/', '/courses', '/newsletter', '/about'];
const here = Math.max(0, PAGES.indexOf('/' + location.pathname.split('/')[1]));
let prev = -1;
try { prev = Number(sessionStorage.navIdx ?? -1); sessionStorage.navIdx = String(here); } catch {}

if (canvas && !reduce) init(canvas, canvas.dataset.follow !== undefined, prev > here ? 'right' : 'left');
