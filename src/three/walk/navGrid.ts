import { HOUSE, LEVELS } from '../../data/house'
import { floorBelow, resolve } from './collision'

/**
 * Navigation grid + A* path-finding for guided travel ("take me to the kitchen").
 * Walkable cells are derived from the same collision world the visitor walks in, so a path
 * never crosses a wall, a piece of furniture or a railing. The two floors are linked by the
 * staircase. Pure TypeScript (no three.js) so it can be tested in Node.
 */

export interface NavPoint {
  x: number
  z: number
  level: number
}

const CELL = 0.25
const X0 = -12.5
const Z0 = -10
const NX = Math.round(25 / CELL)
const NZ = Math.round(29.5 / CELL)
const PER_LEVEL = NX * NZ

/** Stair portal: bottom landing on the ground floor ↔ top arrival on the first floor. */
const STAIR = (() => {
  const [x0, z0, x1, z1] = HOUSE.stairs[0].rect
  const x = (x0 + x1) / 2
  return { bottom: { x, z: z0 - 0.45, level: 0 }, top: { x, z: z1 + 0.45, level: 1 }, x, z0, z1 }
})()

let walkable: Uint8Array | null = null

function build() {
  const grid = new Uint8Array(PER_LEVEL * LEVELS.length)
  for (let l = 0; l < LEVELS.length; l++) {
    const feet = LEVELS[l].y
    for (let j = 0; j < NZ; j++)
      for (let i = 0; i < NX; i++) {
        const x = X0 + (i + 0.5) * CELL
        const z = Z0 + (j + 0.5) * CELL
        const floor = floorBelow(x, z, feet + 0.01)
        if (Math.abs(floor - feet) > 0.02) continue // no floor at this level here
        const [rx, rz] = resolve(x, z, feet)
        if (Math.hypot(rx - x, rz - z) > 0.01) continue // too close to an obstacle
        grid[l * PER_LEVEL + j * NX + i] = 1
      }
  }
  return grid
}

function grid() {
  return (walkable ??= build())
}

const cellOf = (x: number, z: number) => [Math.floor((x - X0) / CELL), Math.floor((z - Z0) / CELL)] as const
const centre = (i: number, j: number) => [X0 + (i + 0.5) * CELL, Z0 + (j + 0.5) * CELL] as const
const ok = (l: number, i: number, j: number) => i >= 0 && j >= 0 && i < NX && j < NZ && grid()[l * PER_LEVEL + j * NX + i] === 1

/** Nearest walkable cell to a point (spiral search). */
function nearest(p: NavPoint): number | null {
  const [ci, cj] = cellOf(p.x, p.z)
  for (let r = 0; r <= 8; r++)
    for (let dj = -r; dj <= r; dj++)
      for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue
        if (ok(p.level, ci + di, cj + dj)) return p.level * PER_LEVEL + (cj + dj) * NX + (ci + di)
      }
  return null
}

/** Minimal binary heap keyed by f-score. */
class Heap {
  private items: number[] = []
  private keys: number[] = []
  push(item: number, key: number) {
    this.items.push(item)
    this.keys.push(key)
    let n = this.items.length - 1
    while (n > 0) {
      const p = (n - 1) >> 1
      if (this.keys[p] <= this.keys[n]) break
      ;[this.items[p], this.items[n]] = [this.items[n], this.items[p]]
      ;[this.keys[p], this.keys[n]] = [this.keys[n], this.keys[p]]
      n = p
    }
  }
  pop() {
    const top = this.items[0]
    const lastI = this.items.pop()!
    const lastK = this.keys.pop()!
    if (this.items.length) {
      this.items[0] = lastI
      this.keys[0] = lastK
      let n = 0
      for (;;) {
        const l = 2 * n + 1
        const r = l + 1
        let m = n
        if (l < this.items.length && this.keys[l] < this.keys[m]) m = l
        if (r < this.items.length && this.keys[r] < this.keys[m]) m = r
        if (m === n) break
        ;[this.items[m], this.items[n]] = [this.items[n], this.items[m]]
        ;[this.keys[m], this.keys[n]] = [this.keys[n], this.keys[m]]
        n = m
      }
    }
    return top
  }
  get size() {
    return this.items.length
  }
}

const decode = (id: number) => {
  const l = Math.floor(id / PER_LEVEL)
  const r = id - l * PER_LEVEL
  return [l, r % NX, Math.floor(r / NX)] as const
}

/** Straight segment stays on walkable cells (same level). */
function clear(l: number, ax: number, az: number, bx: number, bz: number) {
  const d = Math.hypot(bx - ax, bz - az)
  const n = Math.max(1, Math.ceil(d / (CELL * 0.4)))
  for (let k = 0; k <= n; k++) {
    const [i, j] = cellOf(ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n)
    if (!ok(l, i, j)) return false
  }
  return true
}

/** Remove unnecessary corners (string pulling) within one level. */
function smooth(points: NavPoint[]) {
  if (points.length < 3) return points
  const out: NavPoint[] = [points[0]]
  let a = 0
  while (a < points.length - 1) {
    let b = points.length - 1
    while (b > a + 1 && !(points[b].level === points[a].level && clear(points[a].level, points[a].x, points[a].z, points[b].x, points[b].z))) b--
    out.push(points[b])
    a = b
  }
  return out
}

/**
 * Shortest walkable route between two points (possibly on different floors). Returns
 * waypoints including the staircase, or null if no route exists.
 */
export function findPath(from: NavPoint, to: NavPoint): NavPoint[] | null {
  const start = nearest(from)
  const goal = nearest(to)
  if (start === null || goal === null) return null
  const portalA = nearest(STAIR.bottom)!
  const portalB = nearest(STAIR.top)!
  const [, gi, gj] = decode(goal)
  const goalLevel = to.level
  const h = (id: number) => {
    const [l, i, j] = decode(id)
    if (l === goalLevel) return Math.hypot(i - gi, j - gj) * CELL
    // must pass the stairs: go to the portal on this level, then on to the goal
    const [, pi, pj] = decode(l === 0 ? portalA : portalB)
    const [, qi, qj] = decode(l === 0 ? portalB : portalA)
    return (Math.hypot(i - pi, j - pj) + Math.hypot(qi - gi, qj - gj)) * CELL + 5
  }
  const g = new Float32Array(PER_LEVEL * LEVELS.length).fill(Infinity)
  const came = new Int32Array(PER_LEVEL * LEVELS.length).fill(-1)
  const heap = new Heap()
  g[start] = 0
  heap.push(start, h(start))
  const DIRS: [number, number, number][] = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
  ]
  while (heap.size) {
    const cur = heap.pop()
    if (cur === goal) break
    const [l, i, j] = decode(cur)
    const relax = (next: number, cost: number) => {
      const ng = g[cur] + cost
      if (ng < g[next]) {
        g[next] = ng
        came[next] = cur
        heap.push(next, ng + h(next))
      }
    }
    for (const [di, dj, c] of DIRS) {
      const ni = i + di
      const nj = j + dj
      if (!ok(l, ni, nj)) continue
      if (di && dj && (!ok(l, i + di, j) || !ok(l, i, j + dj))) continue // no corner cutting
      relax(l * PER_LEVEL + nj * NX + ni, c * CELL)
    }
    if (cur === portalA) relax(portalB, STAIR.z1 - STAIR.z0 + 1)
    if (cur === portalB) relax(portalA, STAIR.z1 - STAIR.z0 + 1)
  }
  if (came[goal] === -1 && goal !== start) return null

  // rebuild, inserting the staircase centre line when the route changes level
  const cells: number[] = []
  for (let c = goal; c !== -1; c = came[c]) cells.push(c)
  cells.reverse()
  const raw: NavPoint[] = []
  for (let k = 0; k < cells.length; k++) {
    const [l, i, j] = decode(cells[k])
    const [x, z] = centre(i, j)
    if (k > 0 && decode(cells[k - 1])[0] !== l) {
      const up = l === 1
      raw.push({ x: STAIR.x, z: up ? STAIR.z0 + 0.1 : STAIR.z1 - 0.1, level: up ? 0 : 1 })
      raw.push({ x: STAIR.x, z: up ? STAIR.z1 - 0.1 : STAIR.z0 + 0.1, level: l })
    }
    raw.push({ x, z, level: l })
  }
  raw[raw.length - 1] = { ...to, level: to.level }
  raw[0] = { ...from }
  // smooth each level separately (never across the staircase)
  const out: NavPoint[] = []
  let seg: NavPoint[] = []
  for (const p of raw) {
    if (seg.length && seg[seg.length - 1].level !== p.level) {
      out.push(...smooth(seg))
      seg = []
    }
    seg.push(p)
  }
  out.push(...smooth(seg))
  return out
}

/** Pre-build the grid (call while idle so the first request is instant). */
export function warmNavGrid() {
  grid()
}
