// Renders a lesson's component / data-flow diagram (content/…/lesson.json →
// diagram) as an inline SVG: clay-style blocks on a 4×4 grid, with one line
// style per relationship (renders, props, callbacks, hooks, context, …).

import { esc } from '../util.js';

const CAT_COLORS = {
  beginner: { main: '#15803D', soft: '#DCFCE7', strong: '#166534' },
  intermediate: { main: '#2563EB', soft: '#DBEAFE', strong: '#1E40AF' },
  advanced: { main: '#7C3AED', soft: '#EDE9FE', strong: '#5B21B6' },
  elite: { main: '#D97706', soft: '#FEF3C7', strong: '#92400E' },
};
const INK = '#0F172A';
const MUTED = '#475569';

const HEAD_H = 44;
const STEREO_H = 14;
const MEMBER_H = 19;
const ROW_GAP = 78;
const COL_GAP = 48;
const MARGIN = 18;
const NAME_CHAR_W = 8.6;
const MEMBER_CHAR_W = 6.7;
const DASHED = new Set(['callback', 'uses', 'subscribes', 'triggers']);
const DOTTED = new Set(['provides']);
const STEREOTYPE = { hook: '«hook»', state: '«state»', context: '«context»', external: '«outside React»' };
const DEFAULT_LABEL = { uses: '', provides: '«provide»', triggers: '', subscribes: '«subscribe»' };

let uid = 0;

export function renderDiagram(diagram, { category = 'beginner', title = '' } = {}) {
  const id = `dg${++uid}`;
  const col = CAT_COLORS[category] || CAT_COLORS.beginner;
  const nodes = diagram.nodes.map((n) => ({ ...n, members: n.members || [], label: n.label || n.id }));
  if (!nodes.length) return '';

  // Trim unused leading rows/cols so authors can place freely.
  const minCol = Math.min(...nodes.map((n) => n.col));
  const minRow = Math.min(...nodes.map((n) => n.row));
  nodes.forEach((n) => { n.c = n.col - minCol; n.r = n.row - minRow; });
  const cols = Math.max(...nodes.map((n) => n.c)) + 1;
  const rows = Math.max(...nodes.map((n) => n.r)) + 1;

  // Size nodes from their content.
  for (const n of nodes) {
    const stereo = STEREOTYPE[n.kind] ? STEREO_H : 0;
    n.h = HEAD_H + stereo + (n.members.length ? n.members.length * MEMBER_H + 14 : 0);
    const nameW = (n.label.length + (n.kind === 'component' && !/[<>]/.test(n.label) ? 4 : 0)) * NAME_CHAR_W + 36;
    const memW = Math.max(0, ...n.members.map((m) => m.length * MEMBER_CHAR_W + 28));
    n.w = Math.max(150, nameW, memW);
  }
  const colW = Math.max(...nodes.map((n) => n.w)) + COL_GAP;
  const rowH = Array.from({ length: rows }, (_, r) => Math.max(48, ...nodes.filter((n) => n.r === r).map((n) => n.h)));
  const rowY = [];
  rowH.reduce((y, h, r) => { rowY[r] = y; return y + h + ROW_GAP; }, MARGIN);

  for (const n of nodes) {
    n.cx = MARGIN + n.c * colW + colW / 2;
    n.cy = rowY[n.r] + rowH[n.r] / 2;
    n.x = n.cx - n.w / 2;
    n.y = n.cy - n.h / 2;
  }
  const width = MARGIN * 2 + cols * colW;
  const height = rowY[rows - 1] + rowH[rows - 1] + MARGIN + 6;
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // Each edge leaves/enters a node side; edges sharing a side are spread apart
  // (ordered by where their other end is, so they don't cross), and edges that
  // bend in the same gap between two rows get their own horizontal lane.
  const plans = diagram.edges.map((e) => {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) return null;
    if (a.r === b.r) {
      const sa = b.cx > a.cx ? 'right' : 'left';
      return { e, a, b, sa, sb: sa === 'right' ? 'left' : 'right', offA: 0, offB: 0 };
    }
    return b.r > a.r ? { e, a, b, sa: 'bottom', sb: 'top', offA: 0, offB: 0 } : { e, a, b, sa: 'top', sb: 'bottom', offA: 0, offB: 0 };
  });
  const sides = new Map();
  plans.forEach((pl, i) => {
    if (!pl) return;
    for (const [node, side, other, key] of [[pl.a, pl.sa, pl.b, 'offA'], [pl.b, pl.sb, pl.a, 'offB']]) {
      const k = `${node.id}\u0000${side}`;
      if (!sides.has(k)) sides.set(k, []);
      sides.get(k).push({ pl, key, node, side, other, i });
    }
  });
  for (const group of sides.values()) {
    const vertical = group[0].side === 'top' || group[0].side === 'bottom';
    group.sort((x, y) => (vertical ? x.other.cx - y.other.cx : x.other.cy - y.other.cy) || x.i - y.i);
    const n = group.length;
    const half = (vertical ? group[0].node.w : group[0].node.h) / 2 - 14;
    const step = n > 1 ? Math.min(vertical ? 22 : 12, (2 * half) / (n - 1)) : 0;
    group.forEach((g, j) => { g.pl[g.key] = (j - (n - 1) / 2) * step; });
  }
  const gapMid = (r) => rowY[r] + rowH[r] + ROW_GAP / 2; // middle of the gap below row r
  const lanes = new Map();
  plans.forEach((pl) => {
    if (!pl || pl.a.r === pl.b.r) return;
    if (Math.abs(pl.a.cx + pl.offA - (pl.b.cx + pl.offB)) < 2) return;
    pl.gap = pl.b.r > pl.a.r ? pl.b.r - 1 : pl.b.r;
    if (!lanes.has(pl.gap)) lanes.set(pl.gap, []);
    lanes.get(pl.gap).push(pl);
  });
  for (const list of lanes.values()) {
    list.sort((x, y) => (x.a.cx + x.offA) - (y.a.cx + y.offA));
    list.forEach((pl, j) => { pl.lane = (j - (list.length - 1) / 2) * 12; });
  }

  const edgeSvg = [];
  const labelSvg = [];
  const placed = []; // label boxes already on the canvas
  let minX = 0;
  let maxX = width;
  const extend = (x0, x1) => { minX = Math.min(minX, x0 - 6); maxX = Math.max(maxX, x1 + 6); };
  for (const pl of plans) {
    if (!pl) continue;
    const { e } = pl;
    const pts = route(pl, pl.gap === undefined ? 0 : gapMid(pl.gap) + pl.lane);
    pts.forEach(([x]) => extend(x, x));
    const d = `M${pts.map((p) => `${round(p[0])},${round(p[1])}`).join(' L')}`;
    const dash = DASHED.has(e.type) ? ' stroke-dasharray="7 6"' : DOTTED.has(e.type) ? ' stroke-dasharray="1.5 6" stroke-linecap="round"' : '';
    const start = e.type === 'renders' ? ` marker-start="url(#${id}-diaf)"` : e.type === 'subscribes' ? ` marker-start="url(#${id}-dot)"` : '';
    const end = e.type === 'renders' ? '' : e.type === 'updates' || e.type === 'triggers' ? ` marker-end="url(#${id}-tri)"` : e.type === 'provides' ? ` marker-end="url(#${id}-arrc)"` : ` marker-end="url(#${id}-arr)"`;
    const stroke = e.type === 'provides' ? col.main : INK;
    const width = e.type === 'provides' ? 3.2 : 2.2;
    edgeSvg.push(`<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"${dash}${start}${end}/>`);

    const text = e.label || DEFAULT_LABEL[e.type] || '';
    if (text) {
      const w = text.length * 6.9 + 16;
      const [lx, ly] = placeLabel(pts, w, placed, nodes);
      placed.push({ x: lx - w / 2, y: ly - 11, w, h: 22 });
      extend(lx - w / 2, lx + w / 2);
      labelSvg.push(
        `<g transform="translate(${round(lx)},${round(ly)})"><rect x="${round(-w / 2)}" y="-11" width="${round(w)}" height="22" rx="11" fill="#FFFFFF" stroke="${col.main}" stroke-width="1.5"/>` +
        `<text y="4.5" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11.5" font-weight="600" fill="${INK}">${esc(text)}</text></g>`,
      );
    }
  }

  const nodeSvg = nodes.map((n) => renderNode(n, col)).join('');

  const desc = diagram.edges
    .map((e) => `${byId.get(e.from)?.label ?? e.from} ${e.type} ${byId.get(e.to)?.label ?? e.to}`)
    .join('; ');

  const vbW = maxX - minX;
  return `<svg viewBox="${round(minX)} 0 ${round(vbW)} ${round(height)}" width="${round(vbW)}" height="${round(height)}" role="img" aria-labelledby="${id}-t ${id}-d" direction="ltr" style="direction:ltr;unicode-bidi:isolate" xmlns="http://www.w3.org/2000/svg">
  <title id="${id}-t">${esc(title)}</title>
  <desc id="${id}-d">${esc(desc)}</desc>
  <defs>
    <marker id="${id}-tri" viewBox="0 0 14 14" refX="13" refY="7" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto"><path d="M1,1.5 L13,7 L1,12.5 z" fill="${INK}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/></marker>
    <marker id="${id}-arr" viewBox="0 0 14 14" refX="12" refY="7" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto"><path d="M2,2 L12,7 L2,12" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></marker>
    <marker id="${id}-arrc" viewBox="0 0 14 14" refX="12" refY="7" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto"><path d="M2,2 L12,7 L2,12" fill="none" stroke="${col.main}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></marker>
    <marker id="${id}-diaf" viewBox="0 0 20 12" refX="1" refY="6" markerWidth="20" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto"><path d="M1,6 L10,1 L19,6 L10,11 z" fill="${INK}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/></marker>
    <marker id="${id}-dot" viewBox="0 0 12 12" refX="2" refY="6" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto"><circle cx="6" cy="6" r="4" fill="#FFFFFF" stroke="${INK}" stroke-width="2"/></marker>
  </defs>
  <g>${edgeSvg.join('')}</g>
  <g>${nodeSvg}</g>
  <g>${labelSvg.join('')}</g>
</svg>`;
}

function renderNode(n, col) {
  const palette = {
    component: { fill: '#FFFFFF', stroke: col.main, depth: col.strong },
    hook: { fill: col.soft, stroke: col.main, depth: col.strong },
    state: { fill: '#FCE7F3', stroke: '#BE185D', depth: '#9D174D' },
    context: { fill: '#CFFAFE', stroke: '#0E7490', depth: '#155E75' },
    external: { fill: '#F1F5F9', stroke: '#475569', depth: '#334155', dash: true },
    note: { fill: '#FFFBEB', stroke: '#D97706', depth: '#92400E' },
  }[n.kind] || { fill: '#FFFFFF', stroke: col.main, depth: col.strong };

  const italic = n.kind === 'hook' ? ' font-style="italic"' : '';
  const stereo = STEREOTYPE[n.kind];
  let y = n.y + (stereo ? 22 : 28);
  const parts = [];
  // clay depth + body + inner highlight
  parts.push(`<rect x="${round(n.x)}" y="${round(n.y + 5)}" width="${round(n.w)}" height="${round(n.h)}" rx="16" fill="${palette.depth}" opacity="0.35"/>`);
  parts.push(`<rect x="${round(n.x)}" y="${round(n.y)}" width="${round(n.w)}" height="${round(n.h)}" rx="16" fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="3"${palette.dash ? ' stroke-dasharray="8 5"' : ''}/>`);
  parts.push(`<rect x="${round(n.x + 8)}" y="${round(n.y + 5)}" width="${round(n.w - 16)}" height="8" rx="4" fill="#FFFFFF" opacity="0.55"/>`);
  if (stereo) {
    parts.push(`<text x="${round(n.cx)}" y="${round(y)}" text-anchor="middle" font-family="Nunito, sans-serif" font-size="11" font-weight="700" fill="${MUTED}">${esc(stereo)}</text>`);
    y += 18;
  }
  const name = n.kind === 'component' && !/[<>]/.test(n.label) ? `<${n.label} />` : n.label;
  parts.push(`<text x="${round(n.cx)}" y="${round(y)}" text-anchor="middle" font-family="${n.kind === 'component' || n.kind === 'hook' ? 'JetBrains Mono, monospace' : 'Fredoka, Nunito, sans-serif'}" font-size="${n.kind === 'component' || n.kind === 'hook' ? 14 : 15.5}" font-weight="700" fill="${INK}"${italic}>${esc(name)}</text>`);
  if (n.members.length) {
    const lineY = n.y + HEAD_H + (stereo ? STEREO_H : 0);
    parts.push(`<line x1="${round(n.x + 10)}" x2="${round(n.x + n.w - 10)}" y1="${round(lineY)}" y2="${round(lineY)}" stroke="${palette.stroke}" stroke-opacity="0.45" stroke-width="2" stroke-dasharray="2 4" stroke-linecap="round"/>`);
    n.members.forEach((m, i) => {
      parts.push(`<text x="${round(n.x + 14)}" y="${round(lineY + 20 + i * MEMBER_H)}" font-family="JetBrains Mono, monospace" font-size="11.5" fill="${INK}">${esc(m)}</text>`);
    });
  }
  return `<g>${parts.join('')}</g>`;
}

/** Orthogonal route for a planned edge (see renderDiagram); returns a polyline as [[x,y],…]. */
function route({ a, b, offA, offB }, laneY) {
  if (a.r === b.r) {
    const dir = b.cx > a.cx ? 1 : -1;
    const sx = a.cx + (dir * a.w) / 2;
    const tx = b.cx - (dir * b.w) / 2;
    const y1 = a.cy + offA;
    const y2 = b.cy + offB;
    if (Math.abs(y1 - y2) < 1) return [[sx, y1], [tx, y1]];
    const mx = (sx + tx) / 2;
    return [[sx, y1], [mx, y1], [mx, y2], [tx, y2]];
  }
  const down = b.r > a.r;
  const sx = a.cx + offA;
  const tx = b.cx + offB;
  const sy = down ? a.y + a.h : a.y;
  const ty = down ? b.y : b.y + b.h + 4; // +4 leaves room for the clay depth under the target
  if (Math.abs(sx - tx) < 2) return [[sx, sy], [sx, ty]];
  return [[sx, sy], [sx, laneY], [tx, laneY], [tx, ty]];
}

/** The point at fraction `f` (0–1) of a polyline's length. */
function pointAt(pts, f) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const len = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(len);
    total += len;
  }
  let rest = total * f;
  for (let i = 0; i < segs.length; i++) {
    if (rest <= segs[i]) {
      const t = segs[i] ? rest / segs[i] : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t];
    }
    rest -= segs[i];
  }
  return pts[pts.length - 1];
}

const LABEL_SPOTS = [0.5, 0.38, 0.62, 0.28, 0.72, 0.18, 0.82];

/** Picks the spot along the edge whose label box overlaps the fewest labels and nodes. */
function placeLabel(pts, w, placed, nodes) {
  const hits = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  let best = null;
  for (const f of LABEL_SPOTS) {
    const [x, y] = pointAt(pts, f);
    const box = { x: x - w / 2 - 3, y: y - 14, w: w + 6, h: 28 };
    const score = placed.filter((p) => hits(box, p)).length * 10 + nodes.filter((n) => hits(box, { x: n.x, y: n.y, w: n.w, h: n.h })).length * 3;
    if (!best || score < best.score) best = { score, point: [x, y] };
    if (score === 0) break;
  }
  return best.point;
}

function round(v) {
  return Math.round(v * 10) / 10;
}

/** Small inline legend swatches for each relationship type used by the diagram. */
export function renderLegend(diagram, labels) {
  const used = [...new Set(diagram.edges.map((e) => e.type))];
  const kinds = [...new Set(diagram.nodes.map((n) => n.kind))];
  const edges = used.map((type) => {
    const dash = DASHED.has(type) ? ' stroke-dasharray="5 4"' : DOTTED.has(type) ? ' stroke-dasharray="1.5 4" stroke-linecap="round"' : '';
    const stroke = type === 'provides' ? '#0E7490' : '#0F172A';
    let marker = '<path d="M34,3 L41,8 L34,13" fill="none" stroke="#0F172A" stroke-width="1.8"/>';
    let x1 = 2;
    let x2 = 40;
    if (type === 'renders') { marker = '<path d="M2,8 L9,4 L16,8 L9,12 z" fill="#0F172A"/>'; x1 = 16; x2 = 42; }
    else if (type === 'updates' || type === 'triggers') { marker = '<path d="M33,3 L42,8 L33,13 z" fill="#0F172A"/>'; x2 = 34; }
    else if (type === 'subscribes') { marker += '<circle cx="6" cy="8" r="4" fill="#fff" stroke="#0F172A" stroke-width="1.6"/>'; x1 = 10; }
    return `<span><svg viewBox="0 0 44 16" aria-hidden="true"><line x1="${x1}" y1="8" x2="${x2}" y2="8" stroke="${stroke}" stroke-width="${type === 'provides' ? 2.6 : 2}"${dash}/>${marker}</svg>${esc(labels.edges[type] || type)}</span>`;
  });
  const nodes = kinds.filter((k) => k !== 'note').map((k) => `<span><i class="kind-swatch kind-${k}" aria-hidden="true"></i>${esc(labels.nodes[k] || k)}</span>`);
  return [...nodes, ...edges].join('');
}
