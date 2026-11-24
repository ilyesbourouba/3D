import * as THREE from 'three'
import { HOUSE, LEVELS, ROOF, SKYLIGHT } from '../../data/house'
import { CEILINGS, ceilingAt, FINISHES } from '../../data/interior'
import type { Opening, Wall } from '../../data/types'
import { GeometryBuckets } from '../architecture/GeometryBuckets'
import type { ShellKey } from '../architecture/buildHouse'

/**
 * Interior architecture generated from the house data:
 *  - oak door linings and open flush walnut door leaves
 *  - shadow-gap skirting along plaster walls (only where there is floor)
 *  - feature wall cladding (stone / walnut)
 *  - floating ceiling panels with perimeter LED coves
 *  - roof light over the entrance hall
 * Recessed downlight positions are returned separately for instancing.
 */

export type InteriorKey = ShellKey | 'led'
type B = GeometryBuckets<InteriorKey>

/** Box in a wall's local frame (along the wall, across it, height) → world. */
function wallLocal(b: B, w: Wall, a0: number, a1: number, c0: number, c1: number, y0: number, y1: number, key: InteriorKey) {
  if (w.axis === 'x') b.box([a0, y0, c0], [a1, y1, c1], key)
  else b.box([c0, y0, a0], [c1, y1, a1], key)
}

/* ------------------------------------------------------------------ doors */

function buildDoor(b: B, w: Wall, o: Opening) {
  const base = LEVELS[w.level].y
  const t = w.thickness
  const c0 = w.at - t / 2 - 0.008
  const c1 = w.at + t / 2 + 0.008
  const top = base + o.head
  const L = 0.03 // lining thickness
  // linings cover the plaster reveal
  wallLocal(b, w, o.from, o.from + L, c0, c1, base, top, 'oak')
  wallLocal(b, w, o.to - L, o.to, c0, c1, base, top, 'oak')
  wallLocal(b, w, o.from, o.to, c0, c1, top - L, top, 'oak')
  if (o.noLeaf) return

  // leaf, hinged at `from`, opened 90° against the swing side
  const width = o.to - o.from - 2 * L - 0.01
  const a0 = o.from + L + 0.005
  const a1 = a0 + 0.045
  const face = o.swing === 'neg' ? w.at - t / 2 : w.at + t / 2
  const s = o.swing === 'neg' ? -1 : 1
  const cA = Math.min(face, face + s * width)
  const cB = Math.max(face, face + s * width)
  wallLocal(b, w, a0, a1, cA, cB, base + 0.008, top - L - 0.004, 'walnut')
  // vertical bronze pull on both faces near the free edge
  const free = face + s * (width - 0.12)
  wallLocal(b, w, a0 - 0.035, a1 + 0.035, free - 0.012, free + 0.012, base + 0.85, base + 1.35, 'metal')
}

/* ---------------------------------------------------------------- skirting */

const floorSlabs = (level: number) => HOUSE.slabs.filter((s) => s.top === LEVELS[level].y && s.topMat && s.topMat !== 'paving' && s.topMat !== 'deck')
function hasFloor(level: number, x: number, z: number) {
  return floorSlabs(level).some((s) => x > s.rect[0] && x < s.rect[2] && z > s.rect[1] && z < s.rect[3])
}

function buildSkirting(b: B, w: Wall) {
  const base = LEVELS[w.level].y
  const blocked = (w.openings ?? []).filter((o) => o.sill < 0.1)
  for (const side of [1, -1] as const) {
    const mat = side === 1 ? w.pos : w.neg
    if (mat !== 'plaster') continue
    const face = w.at + (side * w.thickness) / 2
    const probe = face + side * 0.15
    // walk the wall in small steps and emit runs where there is a floor and no opening
    const step = 0.1
    let runStart: number | null = null
    for (let a = w.from; a <= w.to + 1e-6; a += step) {
      const x = w.axis === 'x' ? a : probe
      const z = w.axis === 'x' ? probe : a
      const ok = a < w.to - 1e-6 && hasFloor(w.level, x, z) && !blocked.some((o) => a + step > o.from && a < o.to)
      if (ok && runStart === null) runStart = a
      if (!ok && runStart !== null) {
        const c0 = side === 1 ? face : face - 0.012
        wallLocal(b, w, runStart, Math.min(a, w.to), c0, c0 + 0.012, base, base + 0.07, 'frame')
        runStart = null
      }
    }
  }
}

/* ---------------------------------------------------------------- finishes */

function buildFinishes(b: B) {
  for (const f of FINISHES) {
    const t = f.thickness ?? 0.03
    const p0 = Math.min(f.plane, f.plane + f.dir * t)
    const p1 = Math.max(f.plane, f.plane + f.dir * t)
    if (f.axis === 'x') b.box([p0, f.y0, f.from], [p1, f.y1, f.to], f.mat)
    else b.box([f.from, f.y0, p0], [f.to, f.y1, p1], f.mat)
  }
}

/* ---------------------------------------------------------------- ceilings */

function buildCeilings(b: B, downlights: THREE.Vector3[]) {
  const inSkylight = (x: number, z: number) => x > SKYLIGHT[0] - 0.3 && x < SKYLIGHT[2] + 0.3 && z > SKYLIGHT[1] - 0.3 && z < SKYLIGHT[3] + 0.3
  for (const c of CEILINGS) {
    const [x0, z0, x1, z1] = c.rect
    const cx = (x0 + x1) / 2
    const cz = (z0 + z1) / 2
    const ceil = ceilingAt(c.level, cx, cz)
    const drop = 0.09
    let panel: [number, number, number, number] | null = null
    if (c.cove) {
      // floating plaster panel with an LED strip around its upper edge
      const i = c.cove
      panel = [x0 + i, z0 + i, x1 - i, z1 - i]
      const [px0, pz0, px1, pz1] = panel
      b.box([px0, ceil - drop, pz0], [px1, ceil - 0.025, pz1], { ny: 'ceiling', px: 'ceiling', nx: 'ceiling', pz: 'ceiling', nz: 'ceiling' })
      const ly0 = ceil - 0.04
      const ly1 = ceil - 0.025
      const g = 0.012
      b.box([px0 - g, ly0, pz0 - g], [px1 + g, ly1, pz0], 'led')
      b.box([px0 - g, ly0, pz1], [px1 + g, ly1, pz1 + g], 'led')
      b.box([px0 - g, ly0, pz0], [px0, ly1, pz1], 'led')
      b.box([px1, ly0, pz0], [px1 + g, ly1, pz1], 'led')
    }
    if (c.downlights) {
      const s = c.downlights
      const w = x1 - x0
      const d = z1 - z0
      const nx = Math.max(1, Math.round((w - 0.6) / s))
      const nz = Math.max(1, Math.round((d - 0.6) / s))
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < nz; j++) {
          const x = x0 + (w * (i + 0.5)) / nx
          const z = z0 + (d * (j + 0.5)) / nz
          if (c.level === 0 && inSkylight(x, z)) continue
          const onPanel = panel && x > panel[0] && x < panel[2] && z > panel[1] && z < panel[3]
          const y = onPanel ? ceil - drop : ceilingAt(c.level, x, z)
          downlights.push(new THREE.Vector3(x, y - 0.002, z))
        }
    }
  }
}

/* ---------------------------------------------------------------- skylight */

function buildSkylight(b: B) {
  const [x0, z0, x1, z1] = SKYLIGHT
  const top = ROOF.top
  const k = 0.12 // curb width
  const h = 0.22 // curb height
  b.box([x0 - k, top, z0 - k], [x1 + k, top + h, z0], 'render')
  b.box([x0 - k, top, z1], [x1 + k, top + h, z1 + k], 'render')
  b.box([x0 - k, top, z0], [x0, top + h, z1], 'render')
  b.box([x1, top, z0], [x1 + k, top + h, z1], 'render')
  b.box([x0 - k, top + h, z0 - k], [x1 + k, top + h + 0.02, z1 + k], 'glass')
  // slim mullion across the glass
  b.box([x0 - k, top + h + 0.02, (z0 + z1) / 2 - 0.025], [x1 + k, top + h + 0.05, (z0 + z1) / 2 + 0.025], 'frame')
}

export function buildInterior() {
  const b: B = new GeometryBuckets<InteriorKey>()
  const downlights: THREE.Vector3[] = []
  for (const w of HOUSE.walls) {
    for (const o of w.openings ?? []) if (o.kind === 'door') buildDoor(b, w, o)
    buildSkirting(b, w)
  }
  buildFinishes(b)
  buildCeilings(b, downlights)
  buildSkylight(b)
  return { geometries: b.build(), downlights }
}
