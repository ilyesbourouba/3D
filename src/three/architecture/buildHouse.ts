import type * as THREE from 'three'
import { LEVELS } from '../../data/house'
import type { HouseData, MaterialKey, Opening, Railing, Stair, Wall } from '../../data/types'
import { GeometryBuckets } from './GeometryBuckets'

/** Material keys produced by the architecture generator. */
export type ShellKey = MaterialKey | 'glass'

const FRAME = 0.05 // window frame face width
const FRAME_D = 0.08 // frame depth
const PANE = 0.024 // glass thickness
const MAX_PANE = 2.1 // max width of a single glass pane before a mullion is added

type B = GeometryBuckets<ShellKey>

/* ------------------------------------------------------------------ walls */

/** Map along-axis/height/across coordinates to world-space boxes for a given wall. */
function wallBox(b: B, w: Wall, a0: number, a1: number, y0: number, y1: number, c0: number, c1: number, mats: Parameters<B['box']>[2]) {
  if (w.axis === 'x') b.box([a0, y0, c0], [a1, y1, c1], mats)
  else b.box([c0, y0, a0], [c1, y1, a1], mats)
}

function buildWall(b: B, w: Wall) {
  const level = LEVELS[w.level]
  const base = level.y
  const h = w.height ?? level.ceiling
  const t = w.thickness
  const c0 = w.at - t / 2
  const c1 = w.at + t / 2
  // reveals (jambs/heads of openings) take the façade material on exterior walls
  const reveal: MaterialKey = w.exterior ? (w.pos === 'plaster' ? w.neg : w.pos) : 'plaster'
  // face mapping: for axis x, ±z faces are the wall sides; for axis z, ±x faces are.
  const sideMats =
    w.axis === 'x'
      ? { pz: w.pos, nz: w.neg, px: reveal, nx: reveal, py: reveal, ny: reveal }
      : { px: w.pos, nx: w.neg, pz: reveal, nz: reveal, py: reveal, ny: reveal }

  const solid = (a0: number, a1: number, y0: number, y1: number) => {
    if (a1 - a0 < 1e-3 || y1 - y0 < 1e-3) return
    wallBox(b, w, a0, a1, base + y0, base + y1, c0, c1, sideMats)
  }

  const openings = [...(w.openings ?? [])].sort((p, q) => p.from - q.from)
  let cursor = w.from
  for (const o of openings) {
    solid(cursor, o.from, 0, h)
    if (o.sill > 0) solid(o.from, o.to, 0, o.sill)
    if (o.head < h) solid(o.from, o.to, o.head, h)
    buildOpening(b, w, o, base)
    cursor = o.to
  }
  solid(cursor, w.to, 0, h)
}

/** Frame + glass for an opening. */
function buildOpening(b: B, w: Wall, o: Opening, base: number) {
  const y0 = base + o.sill
  const y1 = base + o.head
  const width = o.to - o.from
  const fc0 = w.at - FRAME_D / 2
  const fc1 = w.at + FRAME_D / 2

  if (o.kind === 'door' || o.kind === 'opening') return // door leaves come in Stage 2

  // outer frame (jambs, head, sill)
  const frame = (a0: number, a1: number, yy0: number, yy1: number, cc0 = fc0, cc1 = fc1) => wallBox(b, w, a0, a1, yy0, yy1, cc0, cc1, 'frame')
  frame(o.from, o.from + FRAME, y0, y1)
  frame(o.to - FRAME, o.to, y0, y1)
  frame(o.from, o.to, y1 - FRAME, y1)
  if (o.kind !== 'slider') frame(o.from, o.to, y0, y0 + FRAME)
  else frame(o.from, o.to, y0, y0 + 0.012) // flush threshold track

  if (o.kind === 'slider') {
    // the sliding leaf is parked in front of the neighbouring fixed pane (interior side)
    const off = w.exterior ? (w.pos === 'plaster' ? 1 : -1) * 0.075 : 0.075
    const l0 = o.from - width
    const l1 = o.from
    const lc0 = w.at + off - FRAME_D / 2
    const lc1 = w.at + off + FRAME_D / 2
    frame(l0, l0 + FRAME, y0, y1 - FRAME, lc0, lc1)
    frame(l1 - FRAME, l1, y0, y1 - FRAME, lc0, lc1)
    frame(l0, l1, y0, y0 + FRAME, lc0, lc1)
    frame(l0, l1, y1 - FRAME * 2, y1 - FRAME, lc0, lc1)
    wallBox(b, w, l0 + FRAME, l1 - FRAME, y0 + FRAME, y1 - FRAME * 2, w.at + off - PANE / 2, w.at + off + PANE / 2, 'glass')
    return
  }

  // fixed glazing, split by mullions
  const panes = Math.max(1, Math.ceil((width - 2 * FRAME) / MAX_PANE))
  const inner0 = o.from + FRAME
  const inner1 = o.to - FRAME
  const step = (inner1 - inner0) / panes
  for (let i = 1; i < panes; i++) {
    const m = inner0 + step * i
    frame(m - FRAME / 2, m + FRAME / 2, y0 + FRAME, y1 - FRAME)
  }
  wallBox(b, w, inner0, inner1, y0 + FRAME, y1 - FRAME, w.at - PANE / 2, w.at + PANE / 2, 'glass')
}

/* --------------------------------------------------------------- railings */

function buildRailing(b: B, r: Railing) {
  const y = LEVELS[r.level].y
  const g = 0.012
  const box = (a0: number, a1: number, y0: number, y1: number, c0: number, c1: number, key: ShellKey) =>
    r.axis === 'x' ? b.box([a0, y0, c0], [a1, y1, c1], key) : b.box([c0, y0, a0], [c1, y1, a1], key)
  box(r.from, r.to, y + 0.06, y + r.height, r.at - g, r.at + g, 'glass')
  box(r.from, r.to, y + r.height - 0.01, y + r.height + 0.035, r.at - 0.025, r.at + 0.025, 'metal') // cap rail
  box(r.from, r.to, y, y + 0.08, r.at - 0.04, r.at + 0.04, 'frame') // base channel
}

/* ------------------------------------------------------------------ stairs */

function buildStair(b: B, s: Stair) {
  const [x0, z0, x1, z1] = s.rect
  const yBottom = LEVELS[s.fromLevel].y
  const yTop = LEVELS[s.toLevel].y
  const rise = (yTop - yBottom) / s.risers
  const treads = s.risers - 1
  const run = (z1 - z0) / treads
  const tread = 0.08
  for (let i = 1; i <= treads; i++) {
    const top = yBottom + i * rise
    const za = z0 + (i - 1) * run
    const zb = z0 + i * run + 0.02 // slight nosing overlap
    b.box([x0, top - tread, za], [x1, top, zb], { py: 'oak', ny: 'oak', px: 'oak', nx: 'oak', pz: 'oak', nz: 'oak' })
  }
  // sloped glass balustrade on the open (west) side + handrail
  const bx = x0 + 0.02
  const yA = yBottom + rise
  const yB = yTop - rise
  const hh = 0.95
  b.quad('glass', [bx, yA, z0], [bx, yA, z1], [bx, yB + hh, z1], [bx, yA + hh, z0])
  b.quad('glass', [bx, yA, z0], [bx, yA + hh, z0], [bx, yB + hh, z1], [bx, yA, z1])
  b.beam('metal', [bx, yA + hh + 0.02, z0], [bx, yB + hh + 0.02, z1], 0.045, 0.04)
}

/* ------------------------------------------------------------------- build */

/** Extra architectural features that are not rooms (blade walls, planters…). */
function buildFeatures(b: B) {
  // stone blade wall framing the entrance forecourt
  b.box([-2.75, -0.35, -12.5], [-2.45, 3.0, -7.15], 'stone')
  // low stone planter bench along the forecourt
  b.box([4.4, -0.35, -10.4], [7.6, 0.45, -9.8], { py: 'travertine', px: 'stone', nx: 'stone', pz: 'stone', nz: 'stone' })
  // terrace steps down to the pool deck (deck is flush, so a subtle edge band)
  b.box([-11.3, -0.35, 9.98], [11.3, 0.005, 10.02], 'paving')
}

export function buildHouse(house: HouseData): Map<ShellKey, THREE.BufferGeometry> {
  const b: B = new GeometryBuckets<ShellKey>()
  for (const w of house.walls) buildWall(b, w)
  for (const s of house.slabs) {
    const [x0, z0, x1, z1] = s.rect
    b.box([x0, s.top - s.thickness, z0], [x1, s.top, z1], {
      py: s.topMat,
      ny: s.bottomMat,
      px: s.sideMat,
      nx: s.sideMat,
      pz: s.sideMat,
      nz: s.sideMat,
    })
  }
  for (const r of house.railings) buildRailing(b, r)
  for (const s of house.stairs) buildStair(b, s)
  for (const [x, z, size, y0, y1] of house.columns) b.box([x - size / 2, y0, z - size / 2], [x + size / 2, y1, z + size / 2], 'frame')
  buildFeatures(b)
  return b.build()
}
