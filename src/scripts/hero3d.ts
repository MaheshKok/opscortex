import * as THREE from 'three';

const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = matchMedia('(max-width: 768px)').matches;

// ponytail: mobile + reduced-motion get the CSS gradient fallback, no WebGL
if (canvas && !reduce && !small) init(canvas);

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,160,150,.9)');
  grad.addColorStop(1, 'rgba(232,82,74,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function hexGrid(radius: number, rings: number, y: number) {
  const pos: number[] = [];
  const h = Math.sqrt(3) * radius;
  for (let q = -rings; q <= rings; q++) {
    for (let r = Math.max(-rings, -q - rings); r <= Math.min(rings, -q + rings); r++) {
      const cx = radius * 1.5 * q;
      const cz = h * (r + q / 2);
      for (let i = 0; i < 6; i++) {
        const a1 = (Math.PI / 3) * i, a2 = (Math.PI / 3) * (i + 1);
        pos.push(cx + radius * Math.cos(a1), y, cz + radius * Math.sin(a1));
        pos.push(cx + radius * Math.cos(a2), y, cz + radius * Math.sin(a2));
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xe8524a, transparent: true, opacity: 0.18 }));
}

function init(canvas: HTMLCanvasElement) {
  const host = canvas.parentElement!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x09090b, 5, 16);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.4, 7.5);

  /* cluster: nodes on a jittered fibonacci sphere, each linked to 3 nearest */
  const N = 96;
  const pts: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const yy = 1 - (i / (N - 1)) * 2;
    const rr = Math.sqrt(1 - yy * yy);
    const th = golden * i;
    const R = 2.1 + (Math.random() - 0.5) * 0.5;
    pts.push(new THREE.Vector3(Math.cos(th) * rr * R, yy * R, Math.sin(th) * rr * R));
  }
  const seen = new Set<string>();
  const edge: number[] = [];
  pts.forEach((p, i) => {
    const near = pts
      .map((q, j) => ({ j, d: j === i ? Infinity : p.distanceToSquared(q) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
    for (const { j } of near) {
      const k = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(k)) continue;
      seen.add(k);
      edge.push(p.x, p.y, p.z, pts[j].x, pts[j].y, pts[j].z);
    }
  });
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edge, 3));
  const lines = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0xe8524a, transparent: true, opacity: 0.32 }));

  const nodeGeo = new THREE.BufferGeometry().setFromPoints(pts);
  const nodes = new THREE.Points(
    nodeGeo,
    new THREE.PointsMaterial({ size: 0.2, map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }),
  );

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.85, 1),
    new THREE.MeshBasicMaterial({ color: 0xff8f84, wireframe: true, transparent: true, opacity: 0.4 }),
  );
  const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  coreGlow.scale.setScalar(2.1);

  const cluster = new THREE.Group();
  cluster.add(lines, nodes, core, coreGlow);
  cluster.position.y = 0.2;
  scene.add(cluster);

  const grid = hexGrid(0.5, 14, -2.6);
  scene.add(grid);

  /* interaction */
  let tx = 0, ty = 0, mx = 0, my = 0;
  addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  addEventListener('resize', resize);

  /* pause when hero offscreen or tab hidden */
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    mx += (tx - mx) * 0.04;
    my += (ty - my) * 0.04;
    cluster.rotation.y = t * 0.12 + mx * 0.9;
    cluster.rotation.x = Math.sin(t * 0.2) * 0.08 + my * 0.5;
    core.rotation.y = -t * 0.3;
    core.rotation.z = t * 0.15;
    (core.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(t * 1.4) * 0.12;
    coreGlow.material.opacity = 0.3 + Math.sin(t * 1.4) * 0.12;
    grid.position.z = (t * 0.25) % (Math.sqrt(3) * 0.5);
    grid.rotation.y = mx * 0.1;
    camera.position.x += (mx * 0.9 - camera.position.x) * 0.04;
    camera.position.y += (0.4 - my * 0.6 - camera.position.y) * 0.04;
    // scroll: cluster lifts and fades as page scrolls
    const s = Math.min(scrollY / innerHeight, 1);
    cluster.position.y = 0.2 + s * 2.2;
    renderer.render(scene, camera);
  });
}
