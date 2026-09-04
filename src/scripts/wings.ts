/*
  Wing painting on 2D canvas, no three.js here so a scratch page can render it at full size.
  After the reference images: a red butterfly on black. Crimson field that glows orange-red mid-wing as if lit from
  behind, thin dark veins, a black leading edge that widens into the whole apex and carries a row of cream dashes,
  a black submarginal band with a row of small cream dots, one black eyespot with a white pupil on the forewing,
  scalloped hindwing with white crescents. Rounded apex and a convex outer margin, no tails.
  The underside (under = true) follows the closed-wing reference: darker crimson, no backlight, bold black veins.
  Canvas space: wing base at the left edge, head toward the top. paintWing returns a colour canvas and a bump canvas.
*/

export type Pt = [number, number];
type Seg = [Pt, Pt, Pt, Pt]; // cubic bezier: p0, c1, c2, p3
export type WingSpec = {
  w: number; h: number; segs: Seg[]; base: Pt; border: number;
  spokes: Pt[][];       // veins from the base to the margin, leading edge first; consecutive pairs bound a cell
  cross: Pt[][];        // short cross veins
  edge: number[];       // outline segments that carry the dark margin and band
  band: number;         // width of the dark submarginal band
  spots: number;        // cells (from the leading edge) that get a cream dot in the band
  costa?: [number, number]; // black band along the leading edge: width at the base, width at the apex
  dashes?: number;      // cream dashes inside the black apex (forewing)
  notch?: number[];     // cells whose margin is notched, with a white crescent inside (hindwing)
  innerDark?: number;   // outline segment along the abdomen that gets the dark field
  eyespot?: Pt;         // black eyespot with a white pupil
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

export function paintWing(spec: WingSpec, under = false) {
  const { w, h, base: [bx, by], band } = spec;
  const color = document.createElement('canvas'), bump = document.createElement('canvas');
  color.width = bump.width = w; color.height = bump.height = h;
  const g = color.getContext('2d')!, k = bump.getContext('2d')!;
  const shape = outline(spec.segs), edge = partial(spec.segs, spec.edge);
  // point on a segment plus the unit normal pointing into the wing
  const normalAt = (s: Seg, t: number): [Pt, Pt] => {
    const p = bez(s, t), p2 = bez(s, Math.min(1, t + 0.01));
    let nx = -(p2[1] - p[1]), ny = p2[0] - p[0];
    const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    if ((bx - p[0]) * nx + (by - p[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return [p, [nx, ny]];
  };
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
  // a polygon with a blurred edge, so dark fields melt into the red instead of ending in a line;
  // shadowOnly keeps just the blur (the shape itself lands off-canvas), so there is no solid core with a hard edge
  const soft = (pts: Pt[], fill: string, blur: number, shadowOnly = false) => {
    g.save(); g.shadowColor = fill; g.shadowBlur = blur; g.fillStyle = fill;
    if (shadowOnly) { g.shadowOffsetX = w * 2; g.translate(-w * 2, 0); } // shadow offsets ignore the transform
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

  /* ---- colour ---- */
  // field: deep crimson at the body, red mid-wing, back to crimson under the band
  const grad = g.createRadialGradient(bx, by, 10, bx, by, w * 0.98);
  const stops = under
    ? ['#3a040a', '#8a0c16', '#b8141f', '#c41a22', '#6a0810']
    : ['#4a050b', '#9c0e1a', '#e02430', '#e62c30', '#8a0a14'];
  [0, 0.16, 0.42, 0.7, 1].forEach((t, i) => grad.addColorStop(t, stops[i]));
  g.fillStyle = grad; g.fill(shape);
  g.save(); g.clip(shape);
  if (!under) {
    // backlight: each cell glows orange-red from its centre, strongest mid-wing, the way the reference is lit from behind
    for (const c of cells) for (const [t, a] of [[0.38, 0.22], [0.58, 0.42], [0.78, 0.3]] as const) {
      const p = mid(quad(c.s, t), quad(c.n, t)), r = dist(quad(c.s, t), quad(c.n, t)) * 0.62;
      glow(g, p, r, '255,120,50', a);
    }
    // sheen: a diagonal streak of warm light, the way scales catch it
    const sheen = g.createLinearGradient(bx, by, w, 0);
    sheen.addColorStop(0, 'rgba(255,200,150,0)'); sheen.addColorStop(0.35, 'rgba(255,200,150,.16)'); sheen.addColorStop(0.55, 'rgba(255,200,150,0)');
    g.fillStyle = sheen; g.fillRect(0, 0, w, h);
  }
  // scales: short strokes radiating from the base
  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * w, y = Math.random() * h, a = Math.atan2(y - by, x - bx), l = rand(5, 14);
    g.strokeStyle = Math.random() < 0.5 ? 'rgba(255,170,120,.10)' : 'rgba(50,0,8,.14)';
    g.lineWidth = rand(1, 2.2);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // submarginal band: soft dark halo, then the band itself
  g.lineCap = 'butt';
  g.strokeStyle = 'rgba(30,2,6,.4)'; g.lineWidth = band * 2 + 70; g.stroke(edge);
  g.strokeStyle = 'rgba(12,2,5,.94)'; g.lineWidth = band * 2; g.stroke(edge);
  // veins: thin and dark on top, a soft halo so they read as ridges under the light; bold and black underneath
  g.lineCap = 'round';
  const veinW = (w > 900 ? 3.5 : 3) * (under ? 2.2 : 1);
  for (const v of [...spec.spokes, ...spec.cross]) {
    g.strokeStyle = 'rgba(60,4,10,.4)'; g.lineWidth = veinW * 3.4; vein(g, v);
    g.strokeStyle = under ? '#120206' : '#2a0308'; g.lineWidth = veinW; vein(g, v);
  }
  // leading edge: black band from the base, widening into the whole apex, crimson where it meets the red
  if (spec.costa) {
    const [w0, w1] = spec.costa, inner: Pt[] = [];
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const [p, n] = normalAt(spec.segs[0], t);
      const d = w0 + (w1 - w0) * t * t;
      inner.push([p[0] + n[0] * d, p[1] + n[1] * d]);
    }
    const s0 = spec.segs[0][0], apex = spec.segs[0][3];
    const path: Pt[] = [[s0[0] - 200, s0[1] - 200], [apex[0] + 200, -200], [apex[0] + 200, apex[1] + 220], ...inner.reverse()];
    soft(path, 'rgba(90,8,20,.85)', 100);
    soft(path, '#0b0508', 40);
    // pale patch at the very tip, then cream dashes down the apex just inside the black
    glow(g, [apex[0] - 40, apex[1] + 40], 110, '255,215,205', 0.5);
    const n = spec.dashes ?? 0;
    for (let i = 0; i < n; i++) {
      const t = 0.62 + 0.3 * (i / n), [p, nrm] = normalAt(spec.segs[0], t);
      const d = (w0 + (w1 - w0) * t * t) * 0.55, q: Pt = [p[0] + nrm[0] * d, p[1] + nrm[1] * d];
      const p2 = bez(spec.segs[0], t + 0.02), ang = Math.atan2(p2[1] - p[1], p2[0] - p[0]);
      ellipse(g, q, 24 + 6 * i, 8, ang, i % 2 ? '#f3d9b8' : '#f8e6cc');
    }
  } else {
    g.lineCap = 'butt';
    g.strokeStyle = 'rgba(12,4,8,.9)'; g.lineWidth = 18; g.stroke(partial(spec.segs, [0]));
  }
  // cream dots in the band, one per cell
  for (const c of cells.slice(0, spec.spots)) {
    const p = along(c, band * 0.5);
    const gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], c.width * 0.18);
    gr.addColorStop(0, '#fff4e2'); gr.addColorStop(0.6, '#f1cfae'); gr.addColorStop(1, '#c98f74');
    ellipse(g, p, c.width * 0.18, band * 0.16, c.ang, gr);
  }
  // hindwing: notch the margin between the veins, leave a white crescent inside each notch
  for (const i of spec.notch ?? []) {
    const c = cells[i], r = c.width * 0.2, p = along(c, -r * 0.55);
    g.save(); g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fill(); g.restore();
    ellipse(g, along(c, r * 0.55 + 12), c.width * 0.24, 8, c.ang, 'rgba(250,240,230,.92)');
  }
  // inner margin of the hindwing: near-black where it lies against the abdomen
  if (spec.innerDark !== undefined) {
    const s = spec.segs[spec.innerDark];
    // two shadow-only layers, a wide faint one under a narrow dense one, so the field fades into the red with no edge;
    // widest at the base end (t = 1), thin at the tornus; the closing corners stay outside the wing
    for (const [k, a, blur] of [[1, 0.55, 120], [0.5, 0.8, 60]] as const) {
      const inner: Pt[] = [];
      for (let t = 0; t <= 1.0001; t += 0.05) {
        const [p, n] = normalAt(s, t);
        const d = (30 + 90 * t * t) * k;
        inner.push([p[0] + n[0] * d, p[1] + n[1] * d]);
      }
      soft([...inner, [-200, s[3][1] - 100], [s[0][0] - 200, s[0][1] + 200]], `rgba(28,6,8,${a})`, blur, true);
    }
  }
  // eyespot: thin orange ring, black disc, white pupil set off-centre like a highlight
  if (spec.eyespot) {
    const e = spec.eyespot;
    ellipse(g, e, 52, 40, -0.35, 'rgba(255,110,50,.55)');
    ellipse(g, e, 42, 32, -0.35, '#0a0407');
    ellipse(g, [e[0] - 8, e[1] - 6], 11, 8, -0.35, '#f8f0ea');
  }
  // the thin dark edge, then the dark dusting where the wing meets the body
  g.strokeStyle = '#07040a'; g.lineWidth = spec.border * 2; g.stroke(edge);
  glow(g, [bx, by], 170, '22,6,6', 0.95);
  g.restore();

  /* ---- bump: cells puff up, veins, the band and the eyespot sink ---- */
  k.fillStyle = '#808080'; k.fillRect(0, 0, w, h);
  k.save(); k.clip(shape);
  for (const c of cells) for (const t of [0.35, 0.6, 0.82]) {
    const p = mid(quad(c.s, t), quad(c.n, t));
    glow(k, p, dist(quad(c.s, t), quad(c.n, t)) * 0.55, '255,255,255', 0.35);
  }
  k.lineCap = 'round';
  for (const v of [...spec.spokes, ...spec.cross]) { k.strokeStyle = 'rgba(0,0,0,.55)'; k.lineWidth = veinW * 2; vein(k, v); }
  k.lineCap = 'butt';
  k.strokeStyle = 'rgba(0,0,0,.25)'; k.lineWidth = band * 2; k.stroke(edge);
  if (spec.eyespot) glow(k, spec.eyespot, 60, '0,0,0', 0.5);
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

// spoke ends sit on the margin curves (sampled from the beziers), so the band dots and notches land on the edge
export const FORE: WingSpec = {
  w: 1024, h: 720, base: [30, 560], border: 14, band: 80, spots: 6, edge: [1], costa: [36, 230], dashes: 5, eyespot: [660, 330],
  segs: [
    [[8, 520], [200, 330], [560, 60], [900, 70]],      // costa to a rounded apex
    [[900, 70], [1010, 110], [1000, 520], [820, 650]], // outer margin, convex, to the tornus
    [[820, 650], [640, 700], [300, 670], [8, 600]],    // inner margin back to the base
    [[8, 600], [4, 570], [4, 540], [8, 520]],
  ],
  spokes: [
    [[34, 548], [380, 300], [915, 79]],
    [[34, 552], [420, 330], [951, 133]],
    [[34, 556], [430, 380], [969, 220]],
    [[34, 560], [420, 440], [969, 326]],
    [[34, 566], [400, 500], [949, 438]],
    [[34, 574], [360, 560], [908, 544]],
    [[34, 584], [300, 610], [820, 650]],
    [[34, 594], [180, 630], [369, 662]],
  ],
  cross: [[[500, 235], [520, 330], [500, 430]]],
};

export const HIND: WingSpec = {
  w: 768, h: 768, base: [30, 150], border: 10, band: 70, spots: 6, edge: [1, 2, 3], notch: [0, 1, 2, 3, 4, 5, 6], innerDark: 3,
  segs: [
    [[8, 130], [200, 30], [540, 20], [680, 150]],      // costa
    [[680, 150], [820, 300], [760, 620], [520, 720]],  // outer margin, one round sweep
    [[520, 720], [380, 780], [170, 735], [60, 570]],   // lower margin to the tornus
    [[60, 570], [10, 480], [0, 300], [8, 130]],        // inner margin, against the abdomen
  ],
  spokes: [
    [[34, 146], [330, 150], [722, 211]],
    [[34, 152], [330, 240], [752, 320]],
    [[34, 158], [310, 330], [743, 454]],
    [[34, 166], [300, 430], [679, 593]],
    [[34, 178], [240, 470], [574, 692]],
    [[34, 195], [150, 470], [380, 745]],
    [[34, 220], [80, 450], [229, 711]],
    [[34, 240], [50, 420], [116, 636]],
  ],
  cross: [[[300, 190], [330, 260], [300, 330]]],
};
