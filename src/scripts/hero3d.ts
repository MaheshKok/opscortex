import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { paintWing, mirrored, FORE, HIND } from './wings';

/*
  Full-page red butterfly scene on one fixed canvas.
  Hero: a swarm rises from below the fold into a slow drifting cloud; the cursor scatters it.
  Scroll: the swarm flies off sideways and upward at its own pace; one butterfly leaves it and follows the viewport. Stop scrolling and within two seconds it
  lands on the edge of a box on screen (a card, a button, a ruled section; a heading when there is no box), pumping its wings slowly
  until you move again, all the way to the footer.
  Wings are painted on canvas (forewing and hindwing separately), the swarm is instanced: five draw calls.
*/

function isLight() { return document.documentElement.dataset.theme === 'light'; }
function cssVar(n: string) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - ((-2 * u + 2) ** 2) / 2);

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
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); pos.setZ(i, pos.getZ(i) + 0.07 * x * x + 0.02 * Math.abs(x)); }
  geo.computeVertexNormals();
  return geo;
};
const foreGeoR = wingGeo(1, 0.703, 0.5, 0.1985, -0.004, false), foreGeoL = wingGeo(1, 0.703, 0.5, 0.1985, -0.004, true);
const hindGeoR = wingGeo(0.72, 0.72, 0.36, -0.24, 0.004, false), hindGeoL = wingGeo(0.72, 0.72, 0.36, -0.24, 0.004, true);

// top face: a warm sheen and a thin gold-red iridescence over the red, a wet-looking clearcoat on top.
// underside: its own matte material on the back face; one glossy material on both faces put the clearcoat
// highlight and the bump relief on the underside too, which read as a shine and a glitch from behind
const tex = (c: HTMLCanvasElement, srgb = true) => {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};
const wingMaterial = (color: HTMLCanvasElement, bump: HTMLCanvasElement) => {
  const map = tex(color);
  return new THREE.MeshPhysicalMaterial({
    map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: 0.42,
    bumpMap: tex(bump, false), bumpScale: 0.06, // cells puff, veins sink: relief that moves with the light
    roughness: 0.38, metalness: 0.05,
    iridescence: 0.3, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 300],
    sheen: 0.6, sheenColor: new THREE.Color(0xff9a70), sheenRoughness: 0.55,
    clearcoat: 0.55, clearcoatRoughness: 0.3,
    alphaTest: 0.35, side: THREE.FrontSide,
  });
};
const underMaterial = (color: HTMLCanvasElement) => {
  const map = tex(color);
  return new THREE.MeshStandardMaterial({
    map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: 0.16,
    roughness: 0.9, metalness: 0,
    alphaTest: 0.35, side: THREE.BackSide,
  });
};
// each wing is painted once per face; the left wing is its mirror image
const fore = paintWing(FORE), hind = paintWing(HIND), foreU = paintWing(FORE, true), hindU = paintWing(HIND, true);
const foreMatR = wingMaterial(fore.color, fore.bump), foreMatL = wingMaterial(mirrored(fore.color), mirrored(fore.bump));
const hindMatR = wingMaterial(hind.color, hind.bump), hindMatL = wingMaterial(mirrored(hind.color), mirrored(hind.bump));
const foreUnR = underMaterial(foreU.color), foreUnL = underMaterial(mirrored(foreU.color));
const hindUnR = underMaterial(hindU.color), hindUnL = underMaterial(mirrored(hindU.color));
const wingMats = [foreMatR, foreMatL, hindMatR, hindMatL];

// thorax + tapered abdomen as one lathe, head as a sphere
const head = new THREE.SphereGeometry(0.058, 14, 12).translate(0, 0.27, 0);
(head.attributes.uv.array as Float32Array).fill(0.5); // the whole head samples one dark texel on the spine
const bodyGeo = mergeGeometries([
  new THREE.LatheGeometry(
    [[0, 0.24], [0.05, 0.21], [0.075, 0.12], [0.07, 0.03], [0.05, -0.04], [0.045, -0.18], [0.032, -0.32], [0.015, -0.42], [0, -0.45]].map(([r, y]) => new THREE.Vector2(r, y)),
    18,
  ),
  head,
])!;
// a plain black body vanished into the dark page, so it carries red like the reference: the abdomen is ringed
// red and black under a dark spine, the thorax fuzz turns red at the shoulders where the wings root.
// v runs from the tip (canvas top) to the head end (canvas bottom); u runs around the body, the back at the centre
const bodyMap = (() => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#140c08'; g.fillRect(0, 0, 128, 512);
  for (let y = 0; y < 300; y += 40) {
    // each segment: a red band at its front that fades into the dark seam behind it
    const r = g.createLinearGradient(0, y, 0, y + 40);
    r.addColorStop(0, '#0e0705'); r.addColorStop(0.15, '#c8251f'); r.addColorStop(0.75, '#e0392c'); r.addColorStop(1, '#3a0d0a');
    g.fillStyle = r; g.fillRect(0, y, 128, 40);
  }
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * 128, y = 300 + Math.random() * 212, shoulder = Math.abs(x - 64) > 10;
    g.strokeStyle = shoulder
      ? `rgba(${200 + Math.random() * 55 | 0},${40 + Math.random() * 50 | 0},${25 + Math.random() * 20 | 0},.7)`
      : `rgba(${70 + Math.random() * 40 | 0},${45 + Math.random() * 25 | 0},${30 + Math.random() * 15 | 0},.55)`;
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-4, 4), y + rand(-9, 9)); g.stroke();
  }
  // thin soft-edged dark spine down the back; seen from above the red must stay on both sides of it
  const sp = g.createLinearGradient(56, 0, 72, 0);
  sp.addColorStop(0, 'rgba(14,7,5,0)'); sp.addColorStop(0.4, 'rgba(14,7,5,.85)'); sp.addColorStop(0.6, 'rgba(14,7,5,.85)'); sp.addColorStop(1, 'rgba(14,7,5,0)');
  g.fillStyle = sp; g.fillRect(56, 0, 16, 512);
  return tex(c);
})();
// the map doubles as emissive so the red reads on the dark page; near-black parts emit almost nothing
const bodyMat = new THREE.MeshStandardMaterial({ map: bodyMap, emissiveMap: bodyMap, emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.85 });

/* the follower: one detailed butterfly */
function makeButterfly() {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  inner.rotation.x = Math.PI / 2;
  root.add(inner);
  // a wing is two meshes on one geometry: the top face and the underside
  const wing = (geo: THREE.BufferGeometry, top: THREE.Material, under: THREE.Material) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, top), new THREE.Mesh(geo, under));
    return g;
  };
  const foreR = wing(foreGeoR, foreMatR, foreUnR), foreL = wing(foreGeoL, foreMatL, foreUnL);
  const hindR = wing(hindGeoR, hindMatR, hindUnR), hindL = wing(hindGeoL, hindMatL, hindUnL);
  // antennae as thin red tubes with clubs, like the reference; glossy black eyes
  const dark = new THREE.MeshStandardMaterial({ color: 0x0b0806, roughness: 0.35 });
  const red = new THREE.MeshStandardMaterial({ color: 0xe8524a, roughness: 0.4 });
  const club = new THREE.SphereGeometry(0.014, 8, 6), eye = new THREE.SphereGeometry(0.03, 12, 10);
  const ant = (s: number) => {
    const g = new THREE.Group();
    const path = new THREE.CatmullRomCurve3([new THREE.Vector3(0.02 * s, 0.3, -0.02), new THREE.Vector3(0.1 * s, 0.5, -0.08), new THREE.Vector3(0.2 * s, 0.6, -0.12)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(path, 12, 0.006, 5), red));
    const c = new THREE.Mesh(club, red);
    c.position.set(0.2 * s, 0.6, -0.12);
    g.add(c);
    return g;
  };
  const eyes = [1, -1].map((s) => { const e = new THREE.Mesh(eye, dark); e.position.set(0.045 * s, 0.28, 0.03); return e; });
  inner.add(foreR, foreL, hindR, hindL, new THREE.Mesh(bodyGeo, bodyMat), ant(1), ant(-1), ...eyes);
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

  const hemi = new THREE.HemisphereLight(0xfff0e8, 0x1a0a0e, 0.9);
  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(4, 6, 5);
  const rim = new THREE.DirectionalLight(0xff5a3a, 0.9);
  rim.position.set(-5, 2, -3);
  const fill = new THREE.DirectionalLight(0xff9a80, 0.3); // warm fill from below for depth on the undersides
  fill.position.set(-3, -2, 4);
  scene.add(hemi, sun, rim, fill, new THREE.AmbientLight(0xffffff, 0.15));

  const applyTheme = () => {
    const light = isLight();
    scene.fog!.color.set(cssVar('--bg'));
    hemi.groundColor.set(light ? 0xe8d0cc : 0x1a0a0e);
    hemi.intensity = light ? 1.2 : 0.9;
    for (const mt of wingMats) mt.emissiveIntensity = light ? 0.1 : 0.42;
    bodyMat.emissiveIntensity = light ? 0.05 : 0.4;
  };
  applyTheme();
  addEventListener('themechange', applyTheme);

  /* ---------- swarm ---------- */
  const N = 72;
  const iFR = new THREE.InstancedMesh(foreGeoR, foreMatR, N), iFL = new THREE.InstancedMesh(foreGeoL, foreMatL, N);
  const iHR = new THREE.InstancedMesh(hindGeoR, hindMatR, N), iHL = new THREE.InstancedMesh(hindGeoL, hindMatL, N);
  const iB = new THREE.InstancedMesh(bodyGeo, bodyMat, N);
  // undersides share the top faces' instance matrices, so updateSwarm places them for free
  const under = (im: THREE.InstancedMesh, mat: THREE.Material) => {
    const u = new THREE.InstancedMesh(im.geometry, mat, N);
    u.instanceMatrix = im.instanceMatrix;
    return u;
  };
  const inst = [iFR, iFL, iHR, iHL, iB, under(iFR, foreUnR), under(iFL, foreUnL), under(iHR, hindUnR), under(iHL, hindUnL)];
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
  // a soft ground shadow that fades in as it settles: what makes the perch read as a thing sitting on the page
  const shadow = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(0.5, 'rgba(0,0,0,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 0, depthWrite: false }));
    sp.scale.set(FS * 2.1, FS * 1.5, 1);
    sp.visible = false;
    scene.add(sp);
    return sp;
  })();
  // compile every shader now (compile() walks hidden objects too); otherwise the follower's first
  // appearance links its programs mid-scroll, a ~40ms hitch at the worst moment
  renderer.compile(scene, camera);

  type Edge = 'top' | 'left' | 'right';
  type Perch = { el: Element; edge: Edge; fx: number; fy: number; scrollAt: number };
  let fActive = false;
  let fMode: 'fly' | 'land' | 'perch' = 'fly';
  // fp is in page pixels (y includes scroll), so the page can run away from the butterfly; it never teleports
  // sub-pages: enters from the left when you move forward through the site, from the right when you go back, and keeps to that side
  const hoverSide = follow ? (enterFrom === 'left' ? 0.24 : 0.76) : Math.random() < 0.5 ? 0.24 : 0.76;
  const fp = { x: follow ? (enterFrom === 'left' ? -W * 0.15 : W * 1.15) : W * 0.75, y: H * 0.4 }, fv = { x: 0, y: 0 };
  const F_SPEED = 700; // px/s, about the swarm's cruise at this depth
  const CALM_SPEED = 240; // pace right after a spook, eased back up to F_SPEED over 2.5 s
  let calmUntil = 0;
  let perch: Perch | null = null;
  const land = { x0: 0, y0: 0, t0: 0, dur: 1, scrollAt: 0 };
  const fq = new THREE.Quaternion();

  // where the follower may sit: the edge of a box first (cards, buttons, chips, ruled sections and rows), and only when
  // no box edge is in view, on top of a heading or a line of text
  const boxes = [...document.querySelectorAll('.card, .btn, .tag, [class*="border"]')];
  const texts = [...document.querySelectorAll('h1, h2, h3, .eyebrow, blockquote, summary, footer p')].filter((el) => !boxes.includes(el));
  const visiblePerches = () => {
    const out: [Element, Edge][] = [];
    for (const el of boxes) {
      const r = el.getBoundingClientRect();
      if (r.width < 60) continue;
      if (r.top > 90 && r.top < H - 30) out.push([el, 'top']);
      // the sides too, when the box is wholly on screen and not a full-width band
      if (r.top > 90 && r.bottom < H - 30 && r.height > 80 && r.width < W * 0.7) out.push([el, 'left'], [el, 'right']);
    }
    if (out.length) return out;
    for (const el of texts) {
      const r = el.getBoundingClientRect();
      if (r.width > 60 && r.top > 90 && r.bottom < H - 30) out.push([el, 'top']);
    }
    return out;
  };
  const perchPoint = (p: Perch) => {
    const r = p.el.getBoundingClientRect();
    return {
      x: p.edge === 'left' ? r.left : p.edge === 'right' ? r.right : r.left + r.width * p.fx,
      y: scrollY + (p.edge === 'top' ? r.top - 6 : r.top + r.height * p.fy),
    };
  };
  const inView = (el: Element) => { const r = el.getBoundingClientRect(); return r.bottom > 40 && r.top < H - 20; };

  /* ---------- input ---------- */
  let lastScrollT = -1e9;
  addEventListener('scroll', () => { lastScrollT = performance.now(); }, { passive: true });

  const cursor = new THREE.Vector3(1e3, 1e3, 0);
  const mouse = { x: -1e4, y: -1e4 };
  addEventListener('pointermove', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
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
    // the cursor coming onto it (perched, or about to) spooks it: off away from the pointer, and no settling for a while
    if (fMode !== 'fly') {
      const dx = fp.x - mouse.x, dy = fp.y - sy - mouse.y, d = Math.hypot(dx, dy) || 1;
      if (d < 80) {
        fMode = 'fly'; perch = null;
        fv.x = (dx / d) * 10; fv.y = (dy / d) * 10 - 8; // heading only: away from the pointer and up; the calm cap sets the pace
        calmUntil = now + 2500;
        lastScrollT = now + 1200; // counts as a disturbance: it will not land again for ~1.6 s
      }
    }

    if (fMode === 'fly') {
      const tx = W * hoverSide + Math.sin(now * 0.0007) * W * 0.05;
      const ty = sy + H * 0.4 + Math.sin(now * 0.0011) * H * 0.05;
      fv.x = (fv.x + (tx - fp.x) * 0.012) * 0.9;
      fv.y = (fv.y + (ty - fp.y) * 0.012) * 0.9;
      // its own top speed: a fast scroll leaves it behind (even off screen) and it catches up when you stop
      const cap = THREE.MathUtils.lerp(F_SPEED, CALM_SPEED, clamp((calmUntil - now) / 2500, 0, 1)) * dt, sp = Math.hypot(fv.x, fv.y);
      if (sp > cap) { fv.x *= cap / sp; fv.y *= cap / sp; }
      fp.x += fv.x; fp.y += fv.y;
      const onScreen = Math.abs(fp.y - sy - H * 0.4) < H * 0.5;
      // stop scrolling and it is sitting inside two seconds: 0.4 s of quiet, then a landing of 0.6 to 1.5 s
      if (now - lastScrollT > 400 && onScreen) {
        const vis = visiblePerches();
        if (vis.length) {
          const [el, edge] = vis[Math.floor(Math.random() * vis.length)];
          perch = { el, edge, fx: rand(0.1, 0.9), fy: rand(0.2, 0.8), scrollAt: sy };
          const pt = perchPoint(perch);
          land.x0 = fp.x; land.y0 = fp.y; land.t0 = now; land.scrollAt = sy;
          land.dur = clamp(Math.hypot(pt.x - fp.x, pt.y - fp.y) * 1.2, 600, 1500);
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
    // shadow: down-left of it (the sun is up-right), fading in over the last stretch of the landing
    const settle = fMode === 'perch' ? 1 : fMode === 'land' ? clamp(((now - land.t0) / land.dur - 0.7) / 0.3, 0, 1) : 0;
    shadow.position.set(fb.root.position.x - FS * 0.08, fb.root.position.y - FS * 0.12, FZ - 0.05);
    shadow.material.opacity += (settle * 0.5 - shadow.material.opacity) * 0.12;
    const speed = Math.hypot(fv.x, fv.y);
    // sitting, it keeps pumping its wings slowly, open to nearly closed about every two seconds
    const sitFore = 0.55 + 0.4 * Math.sin(t * 3), sitHind = 0.5 + 0.36 * Math.sin(t * 3 - 0.35);
    let fore: number, hind: number;
    if (fMode === 'perch') {
      // always the same pose: head up, wings toward the viewer
      dummy.position.copy(fb.root.position);
      dummy.lookAt(tmp.set(0, 1, 0.55).add(fb.root.position));
      fq.slerp(dummy.quaternion, 0.1);
      fore = sitFore; hind = sitHind;
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
          fore = THREE.MathUtils.lerp(fore, sitFore, k);
          hind = THREE.MathUtils.lerp(hind, sitHind, k);
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
    shadow.visible = fb.root.visible;
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
