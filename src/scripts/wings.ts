/*
  Wing painting on 2D canvas, no three.js here so a scratch page can render it at full size.
  After the reference photo: an electric-blue swallowtail. Bold dark veins cut the wing into glowing cells, a dark
  submarginal band carries a row of blue spots, the forewing pales to cyan at the apex, the hindwing is round with
  white crescents in the scallops and an orange spot at the tornus.
  Canvas space: wing base at the left edge, head toward the top. paintWing returns a colour canvas and a bump canvas.
*/

export type Pt = [number, number];
type Seg = [Pt, Pt, Pt, Pt]; // cubic bezier: p0, c1, c2, p3
export type WingSpec = {
  w: number; h: number; segs: Seg[]; base: Pt; border: number;
  spokes: Pt[][];       // veins from the base to the margin, leading edge first; consecutive pairs bound a cell
  cross: Pt[][];        // short cross veins
  edge: number[];       // outline segments that carry the dark margin and band
  fade?: number;        // the segment after them, along which the band thins away
  band: number;         // width of the dark submarginal band
  spots: number[];      // cells that get a blue spot in the band
  apex?: Pt;            // pale cyan wash centred here
  notch?: number[];     // cells whose margin is notched, with a white crescent inside (hindwing)
  innerDark?: number;   // outline segment along the abdomen that gets the brown field
  tornus?: Pt;          // orange spot
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const bez = (s: Seg, t: number): Pt => {
  const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * s[0][0] + b * s[1][0] + c * s[2][0] + d * s[3][0], a * s[0][1] + b * s[1][1] + c * s[2][1] + d * s[3][1]];
};
const quad = (v: Pt[], t: number): Pt => {
  const u = 1 - t;
  return [u * u * v[0][0] + 2 * u * t * v[1][0] + t * t * v[2][0], u * u * v[0][1] + 2 * u * t * v[1][1] + t * t * v[2][1]];
};
const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const outline = (segs: Seg[]) => {
  const p = new Path2D();
  p.moveTo(segs[0][0][0], segs[0][0][1]);
  for (const s of segs) p.bezierCurveTo(s[1][0], s[1][1], s[2][0], s[2][1], s[3][0], s[3][1]);
  p.closePath();
  return p;
};
const partial = (segs: Seg[], idx: number[]) => {
  const p = new Path2D();
  p.moveTo(segs[idx[0]][0][0], segs[idx[0]][0][1]);
  for (const i of idx) { const s = segs[i]; p.bezierCurveTo(s[1][0], s[1][1], s[2][0], s[2][1], s[3][0], s[3][1]); }
  return p;
};

export function paintWing(spec: WingSpec) {
  const { w, h, base: [bx, by], band } = spec;
  const color = document.createElement('canvas'), bump = document.createElement('canvas');
  color.width = bump.width = w; color.height = bump.height = h;
  const g = color.getContext('2d')!, k = bump.getContext('2d')!;
  const shape = outline(spec.segs), edge = partial(spec.segs, spec.edge);
  const vein = (c: CanvasRenderingContext2D, v: Pt[]) => {
    c.beginPath(); c.moveTo(v[0][0], v[0][1]); c.quadraticCurveTo(v[1][0], v[1][1], v[2][0], v[2][1]); c.stroke();
  };
  const ellipse = (c: CanvasRenderingContext2D, p: Pt, rx: number, ry: number, ang: number, fill: string | CanvasGradient) => {
    c.save(); c.translate(p[0], p[1]); c.rotate(ang); c.scale(rx, ry);
    c.beginPath(); c.arc(0, 0, 1, 0, 7); c.restore();
    c.fillStyle = fill; c.fill();
  };
  const glow = (c: CanvasRenderingContext2D, p: Pt, r: number, rgb: string, a: number) => {
    const gr = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = gr; c.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
  };
  // a polygon with a blurred edge, so dark fields melt into the blue instead of ending in a line
  const soft = (pts: Pt[], fill: string, blur: number) => {
    g.save(); g.shadowColor = fill; g.shadowBlur = blur; g.fillStyle = fill;
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
    g.closePath(); g.fill(); g.fill(); g.restore();
  };
  // cells: the wedge between two neighbouring spokes; margin end, width there, and the inward direction
  const cells = spec.spokes.slice(0, -1).map((s, i) => {
    const n = spec.spokes[i + 1], e0 = s[2], e1 = n[2], m = mid(e0, e1);
    const inl = Math.hypot(bx - m[0], by - m[1]);
    return { s, n, e0, e1, m, width: dist(e0, e1), ang: Math.atan2(e1[1] - e0[1], e1[0] - e0[0]), inward: [(bx - m[0]) / inl, (by - m[1]) / inl] as Pt };
  });
  const along = (c: { m: Pt; inward: Pt }, d: number): Pt => [c.m[0] + c.inward[0] * d, c.m[1] + c.inward[1] * d];
  // a stroke along the margin segments; on the segment after them it thins to nothing instead of ending in a cut
  const bandStroke = (c: CanvasRenderingContext2D, rgb: string, a: number, lw: number) => {
    c.lineCap = 'butt'; c.lineWidth = lw;
    c.strokeStyle = `rgba(${rgb},${a})`; c.stroke(edge);
    if (spec.fade === undefined) return;
    const s = spec.segs[spec.fade], e = bez(s, 0.6);
    const gr = c.createLinearGradient(s[0][0], s[0][1], e[0], e[1]);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    c.strokeStyle = gr; c.stroke(partial(spec.segs, [spec.fade]));
  };

  /* ---- colour ---- */
  // structural blue: the site's first morpho palette, compressed so its deep outer blues sit inside the field the band leaves visible
  const grad = g.createRadialGradient(bx, by, 10, bx, by, w * 0.98);
  grad.addColorStop(0, '#2fa8ea');
  grad.addColorStop(0.1, '#19b4ff');
  grad.addColorStop(0.4, '#1690f8');
  grad.addColorStop(0.72, '#1560d6');
  grad.addColorStop(1, '#1236a6');
  g.fillStyle = grad; g.fill(shape);
  g.save(); g.clip(shape);
  if (spec.apex) glow(g, spec.apex, w * 0.46, '110,180,255', 0.4);
  // each cell glows from its centre, brightest toward the band: the stained-glass look of the photo
  for (const c of cells) for (const t of [0.35, 0.6, 0.82]) {
    const p = mid(quad(c.s, t), quad(c.n, t)), r = dist(quad(c.s, t), quad(c.n, t)) * 0.6;
    glow(g, p, r, '70,150,255', 0.12 + 0.15 * t);
  }
  // iridescent sheen: a diagonal streak of pale cyan, the way light catches the scales
  const sheen = g.createLinearGradient(bx, by, w, 0);
  sheen.addColorStop(0, 'rgba(200,255,255,0)'); sheen.addColorStop(0.35, 'rgba(200,255,255,.2)'); sheen.addColorStop(0.55, 'rgba(200,255,255,0)');
  g.fillStyle = sheen; g.fillRect(0, 0, w, h);
  // scales: short strokes radiating from the base
  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * w, y = Math.random() * h, a = Math.atan2(y - by, x - bx), l = rand(5, 14);
    g.strokeStyle = Math.random() < 0.5 ? 'rgba(200,255,255,.10)' : 'rgba(6,20,90,.12)';
    g.lineWidth = rand(1, 2.2);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // submarginal band: soft dark halo, then the band itself
  bandStroke(g, '8,12,60', 0.4, band * 2 + 70);
  bandStroke(g, '7,10,48', 0.93, band * 2);
  // veins: bold and dark, a soft halo so they read as ridges
  g.lineCap = 'round';
  const veinW = w > 900 ? 6 : 5;
  for (const v of [...spec.spokes, ...spec.cross]) {
    g.strokeStyle = 'rgba(8,16,70,.42)'; g.lineWidth = veinW * 3.2; vein(g, v);
    g.strokeStyle = '#0a1238'; g.lineWidth = veinW; vein(g, v);
  }
  // thin dark leading edge
  g.lineCap = 'butt';
  g.strokeStyle = 'rgba(10,8,22,.9)'; g.lineWidth = 18; g.stroke(partial(spec.segs, [0]));
  // blue spots in the band, one per cell
  for (const c of spec.spots.map((i) => cells[i])) {
    const p = along(c, band * 0.5);
    const gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], c.width * 0.34);
    gr.addColorStop(0, '#c4fbff'); gr.addColorStop(0.55, '#5fd6ff'); gr.addColorStop(1, '#2f9bff');
    ellipse(g, p, c.width * 0.34, band * 0.2, c.ang, gr);
  }
  // hindwing: notch the margin between the veins, leave a white crescent inside each notch
  for (const i of spec.notch ?? []) {
    const c = cells[i], r = c.width * 0.15, p = along(c, -r * 0.55);
    g.save(); g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fill(); g.restore();
    ellipse(g, along(c, r * 0.55 + 12), c.width * 0.24, 8, c.ang, 'rgba(240,252,255,.92)');
  }
  // inner margin of the hindwing: brown where it lies against the abdomen
  if (spec.innerDark !== undefined) {
    const s = spec.segs[spec.innerDark], inner: Pt[] = [];
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const p = bez(s, t), p2 = bez(s, Math.min(1, t + 0.01));
      let nx = -(p2[1] - p[1]), ny = p2[0] - p[0];
      const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      if ((bx - p[0]) * nx + (by - p[1]) * ny < 0) { nx = -nx; ny = -ny; }
      const d = 30 + 90 * (1 - t) * (1 - t);
      inner.push([p[0] + nx * d, p[1] + ny * d]);
    }
    soft([...inner, [-200, s[3][1] - 100], [-200, s[0][1] + 200]], 'rgba(28,20,16,.95)', 70);
  }
  if (spec.tornus) {
    ellipse(g, spec.tornus, 24, 15, -0.5, '#2a0a05');
    ellipse(g, spec.tornus, 18, 10, -0.5, '#ff6a1a');
  }
  // the thin dark edge, then the brown dusting where the wing meets the body
  bandStroke(g, '5,6,15', 1, spec.border * 2);
  glow(g, [bx, by], 170, '30,18,10', 0.95);
  g.restore();

  /* ---- bump: cells puff up, veins and the band sink ---- */
  k.fillStyle = '#808080'; k.fillRect(0, 0, w, h);
  k.save(); k.clip(shape);
  for (const c of cells) for (const t of [0.35, 0.6, 0.82]) {
    const p = mid(quad(c.s, t), quad(c.n, t));
    glow(k, p, dist(quad(c.s, t), quad(c.n, t)) * 0.55, '255,255,255', 0.35);
  }
  k.lineCap = 'round';
  for (const v of [...spec.spokes, ...spec.cross]) { k.strokeStyle = 'rgba(0,0,0,.55)'; k.lineWidth = veinW * 1.6; vein(k, v); }
  bandStroke(k, '0,0,0', 0.25, band * 2);
  k.restore();
  return { color, bump };
}

export function mirrored(c: HTMLCanvasElement) {
  const m = document.createElement('canvas');
  m.width = c.width; m.height = c.height;
  const g = m.getContext('2d')!;
  g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0);
  return m;
}

export const FORE: WingSpec = {
  w: 1024, h: 720, base: [30, 560], border: 14, band: 95, spots: [0, 1, 2, 3, 4, 5], edge: [1, 2], fade: 3, apex: [940, 70],
  segs: [
    [[8, 520], [200, 290], [620, 40], [940, 70]],      // costa to a blunt apex
    [[940, 70], [1030, 150], [1000, 460], [830, 640]], // outer margin, convex and round, to the tornus
    [[830, 640], [773, 658], [703, 668], [624, 671]],  // inner margin, the stretch that shows past the hindwing
    [[624, 671], [440, 678], [212, 649], [8, 600]],    // inner margin back to the base
    [[8, 600], [4, 570], [4, 540], [8, 520]],
  ],
  spokes: [
    [[34, 548], [380, 300], [967, 108]],
    [[34, 552], [420, 330], [988, 194]],
    [[34, 556], [430, 380], [984, 304]],
    [[34, 560], [420, 440], [956, 426]],
    [[34, 566], [400, 500], [905, 539]],
    [[34, 574], [360, 560], [830, 640]],
    [[34, 584], [300, 610], [624, 671]],
    [[34, 594], [180, 630], [369, 662]],
  ],
  cross: [[[500, 235], [520, 330], [500, 430]]],
};

export const HIND: WingSpec = {
  w: 768, h: 768, base: [30, 150], border: 10, band: 80, spots: [0, 1, 2, 3, 4], edge: [1, 2], notch: [0, 1, 2, 3, 4], innerDark: 3, tornus: [185, 625],
  segs: [
    [[8, 130], [200, 30], [540, 20], [680, 150]],      // costa
    [[680, 150], [790, 290], [770, 520], [640, 640]],  // outer margin, round
    [[640, 640], [520, 760], [200, 750], [60, 570]],   // lower margin, round, to the tornus
    [[60, 570], [10, 480], [0, 300], [8, 130]],        // inner margin, against the abdomen
  ],
  spokes: [
    [[34, 146], [420, 150], [738, 269]],
    [[34, 152], [420, 230], [750, 402]],
    [[34, 160], [400, 320], [717, 533]],
    [[34, 170], [360, 400], [640, 640]],
    [[34, 182], [280, 470], [488, 712]],
    [[34, 196], [190, 500], [324, 713]],
    [[34, 220], [90, 460], [163, 658]],
  ],
  cross: [[[300, 190], [330, 260], [300, 330]]],
};
