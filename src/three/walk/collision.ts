import { FURNITURE, footprintAABB, OUTDOOR_COLLIDERS } from '../../data/furniture'
import { HOUSE, LEVELS, POOL } from '../../data/house'
import { FINISHES } from '../../data/interior'
import type { Wall } from '../../data/types'

/**
 * Collision world for first-person walking, derived from the same house data as the 3D model.
 *
 * - Obstacles are axis-aligned boxes; the walker is a vertical capsule approximated by a circle
 *   in plan plus a height range, so a box only blocks if it overlaps the body vertically
 *   (a window sill at 0.9 m blocks, the wall above a door head does not).
 * - Floors are flat surfaces (ground, first-floor slabs) plus the staircase as a ramp.
 */

export interface Box {
  x0: number
  x1: number
  z0: number
  z1: number
  y0: number
  y1: number
}

export const PLAYER_RADIUS = 0.28
export const STEP_HEIGHT = 0.45
const BODY_BOTTOM = 0.25 // ignore obstacles lower than this above the feet (thresholds, skirting)
const BODY_TOP = 1.85

const L1 = LEVELS[1].y
const boxes: Box[] = []
const add = (x0: number, x1: number, z0: number, z1: number, y0: number, y1: number) =>
  boxes.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), y0, y1 })

/** Box in a wall's local frame (along, across, height) → world. */
function wallBox(w: Wall, a0: number, a1: number, c0: number, c1: number, y0: number, y1: number) {
  if (w.axis === 'x') add(a0, a1, c0, c1, y0, y1)
  else add(c0, c1, a0, a1, y0, y1)
}

/* ------------------------------------------------------------------ walls */
for (const w of HOUSE.walls) {
  const base = LEVELS[w.level].y
  const h = w.height ?? LEVELS[w.level].ceiling
  const c0 = w.at - w.thickness / 2
  const c1 = w.at + w.thickness / 2
  const openings = [...(w.openings ?? [])].sort((a, b) => a.from - b.from)
  let cursor = w.from
  for (const o of openings) {
    if (o.from > cursor) wallBox(w, cursor, o.from, c0, c1, base, base + h)
    if (o.sill > 0) wallBox(w, o.from, o.to, c0, c1, base, base + o.sill)
    if (o.head < h) wallBox(w, o.from, o.to, c0, c1, base + o.head, base + h)
    // fixed glazing blocks; doors, openings and slider gaps are passable
    if (o.kind === 'window' || o.kind === 'glass') wallBox(w, o.from, o.to, w.at - 0.05, w.at + 0.05, base + o.sill, base + o.head)
    // open door leaves stand perpendicular to the wall on the swing side
    if (o.kind === 'door' && !o.noLeaf) {
      const width = o.to - o.from - 0.07
      const a0 = o.from + 0.035
      const face = o.swing === 'neg' ? c0 : c1
      const s = o.swing === 'neg' ? -1 : 1
      wallBox(w, a0 - 0.03, a0 + 0.075, face, face + s * width, base, base + o.head)
    }
    cursor = o.to
  }
  if (w.to > cursor) wallBox(w, cursor, w.to, c0, c1, base, base + h)
}

/* --------------------------------------------------------- railings etc. */
for (const r of HOUSE.railings) {
  const y = LEVELS[r.level].y
  if (r.axis === 'x') add(r.from, r.to, r.at - 0.05, r.at + 0.05, y, y + r.height + 0.6)
  else add(r.at - 0.05, r.at + 0.05, r.from, r.to, y, y + r.height + 0.6)
}
for (const [x, z, size, y0, y1] of HOUSE.columns) add(x - size / 2, x + size / 2, z - size / 2, z + size / 2, y0, y1)
for (const f of FINISHES) {
  const t = f.thickness ?? 0.03
  if (f.axis === 'x') add(f.plane, f.plane + f.dir * t, f.from, f.to, f.y0, f.y1)
  else add(f.from, f.to, f.plane, f.plane + f.dir * t, f.y0, f.y1)
}

/* ------------------------------------------------------------------ stairs */
const stair = HOUSE.stairs[0]
{
  const [x0, z0, , z1] = stair.rect
  // glass balustrade on the open side, from the floor up to above the first-floor handrail
  add(x0 - 0.03, x0 + 0.03, z0, z1, 0, L1 + 1.1)
}

/* ---------------------------------------------------------------- exterior */
const [px0, pz0, px1, pz1] = POOL.rect
add(px0, px1, pz0, pz1, -2, 1) // keep out of the pool
add(-2.75, -2.45, -12.5, -7.15, -0.4, 3) // entrance blade wall
add(4.4, 7.6, -10.4, -9.8, -0.4, 0.45) // planter bench
add(-2.3, -0.5, -12.5, -10.7, -0.1, 3) // forecourt olive planter
/* --------------------------------------------------------------- furniture */
for (const [x0, x1, z0, z1, h] of OUTDOOR_COLLIDERS) add(x0, x1, z0, z1, 0, h)
for (const p of FURNITURE) {
  const fp = footprintAABB(p)
  if (!fp) continue
  const y = LEVELS[p.level].y + (p.y ?? 0)
  add(fp.x0, fp.x1, fp.z0, fp.z1, y, y + p.collide![2])
}

/** Walkable garden limits (inside the hedges). */
export const SITE_BOUNDS = { x0: -19.7, x1: 20.2, z0: -15.8, z1: 26.8 }

export const OBSTACLES: readonly Box[] = boxes

/* ------------------------------------------------------------------ floors */

const firstFloorSlabs = HOUSE.slabs.filter((s) => s.top === L1)
const inRect = (r: [number, number, number, number], x: number, z: number) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3]

/** Stair surface height at (x, z), or null when outside the stair footprint. */
export function stairHeight(x: number, z: number): number | null {
  const [x0, z0, x1, z1] = stair.rect
  if (x < x0 || x > x1 || z < z0 || z > z1) return null
  return ((z - z0) / (z1 - z0)) * (LEVELS[stair.toLevel].y - LEVELS[stair.fromLevel].y)
}

/** Highest walkable surface under (x, z) that can be reached from `feet` (step-up limit). */
export function floorBelow(x: number, z: number, feet: number): number {
  let best = 0 // ground, terraces and garden
  const consider = (y: number) => {
    if (y <= feet + STEP_HEIGHT && y > best) best = y
  }
  if (firstFloorSlabs.some((s) => inRect(s.rect, x, z))) consider(L1)
  const st = stairHeight(x, z)
  if (st !== null) consider(st)
  return best
}

/* -------------------------------------------------------------- resolution */

/**
 * Push a circle (player footprint) out of every obstacle overlapping its body height.
 * Returns the corrected position. Runs a few iterations to settle in corners.
 */
export function resolve(x: number, z: number, feet: number): [number, number] {
  const r = PLAYER_RADIUS
  const bottom = feet + BODY_BOTTOM
  const top = feet + BODY_TOP
  for (let iter = 0; iter < 4; iter++) {
    let moved = false
    for (const b of OBSTACLES) {
      if (b.y1 <= bottom || b.y0 >= top) continue
      if (x + r < b.x0 || x - r > b.x1 || z + r < b.z0 || z - r > b.z1) continue
      const cx = Math.max(b.x0, Math.min(x, b.x1))
      const cz = Math.max(b.z0, Math.min(z, b.z1))
      let dx = x - cx
      let dz = z - cz
      const d2 = dx * dx + dz * dz
      if (d2 >= r * r) continue
      if (d2 > 1e-10) {
        const d = Math.sqrt(d2)
        x = cx + (dx / d) * r
        z = cz + (dz / d) * r
      } else {
        // centre inside the box: leave through the nearest face
        const pushes = [b.x0 - r - x, b.x1 + r - x, b.z0 - r - z, b.z1 + r - z]
        const i = pushes.reduce((bi, p, k) => (Math.abs(p) < Math.abs(pushes[bi]) ? k : bi), 0)
        if (i < 2) x += pushes[i]
        else z += pushes[i]
      }
      moved = true
    }
    // under the staircase: the band of z where the treads sit between step and head height
    // (too high to step onto, too low to walk under) is solid
    const [sx0, sz0, sx1, sz1] = stair.rect
    if (x + r > sx0 && x - r < sx1) {
      const run = sz1 - sz0
      const zA = sz0 + ((feet + STEP_HEIGHT) / L1) * run
      const zB = Math.min(sz1, sz0 + ((feet + 2.05) / L1) * run)
      if (zB > zA && z + r > zA && z - r < zB) {
        z = z > (zA + zB) / 2 ? zB + r : zA - r
        moved = true
      }
    }
    if (!moved) break
  }
  x = Math.max(SITE_BOUNDS.x0, Math.min(SITE_BOUNDS.x1, x))
  z = Math.max(SITE_BOUNDS.z0, Math.min(SITE_BOUNDS.z1, z))
  return [x, z]
}
