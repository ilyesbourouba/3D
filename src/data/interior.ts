import { HOUSE, LEVELS, ROOF } from './house'
import type { CeilingLighting, Finish, LevelId, Rect } from './types'

/**
 * Interior architecture that sits on top of the shell: feature walls and ceiling lighting.
 * Positions reference wall faces (wall centre ± half thickness) from house.ts.
 */

const L1 = LEVELS[1].y

export const FINISHES: Finish[] = [
  // Entrance hall — full-height travertine wall the floating stair is anchored into
  { axis: 'x', plane: 3.85, dir: -1, from: -6.85, to: 1.5, y0: 0, y1: L1, mat: 'stone', thickness: 0.05 },
  // …continuing up through the void only (the landing keeps its door to bedroom three)
  { axis: 'x', plane: 3.85, dir: -1, from: -5.0, to: 1.5, y0: L1, y1: ROOF.bottom, mat: 'stone', thickness: 0.05 },
  // Entrance hall — walnut panelled wall facing the stair
  { axis: 'x', plane: -1.925, dir: 1, from: -6.85, to: -3.5, y0: 0, y1: 3.3, mat: 'walnut' },
  // Living room — travertine fireplace wall
  { axis: 'x', plane: -10.85, dir: 1, from: -1.35, to: 4.45, y0: 0, y1: 3.3, mat: 'livingFeature', thickness: 0.06 },
  // Living room — paintable plaster (colour picked by the visitor)
  ...([
    ['x', -10.85, -1.425, -1.35, 0, 3.3], // west wall, beside the fireplace wall
    ['x', -10.85, 4.45, 6.85, 0, 3.3],
    ['z', -1.425, -10.85, -10.5, 0, 3.3], // north wall, around the glass partition to the office
    ['z', -1.425, -5.5, -5.075, 0, 3.3],
    ['z', -1.425, -10.5, -5.5, 2.7, 3.3],
  ] as const).map(([axis, plane, from, to, y0, y1]): Finish => ({ axis, plane, dir: 1, from, to, y0, y1, mat: 'livingPaint', thickness: 0.004 })),
  // Master bedroom — walnut headboard wall (bed faces the west window)
  { axis: 'x', plane: -3.075, dir: -1, from: 1.5, to: 6.6, y0: 0 + L1, y1: 3.3 + L1, mat: 'walnut' },
  // Bedroom two — headboard wall
  { axis: 'z', plane: 3.075, dir: 1, from: 6.0, to: 10.85, y0: L1, y1: L1 + 3.3, mat: 'walnut' },
  // Bedroom three — headboard wall
  { axis: 'z', plane: -2.075, dir: -1, from: 5.4, to: 10.85, y0: L1, y1: L1 + 3.3, mat: 'walnut' },
  // Bathrooms — marble on the faces shared with plaster walls (kept below window sills)
  { axis: 'x', plane: -4.925, dir: 1, from: -6.85, to: -3.575, y0: 0, y1: 3.3, mat: 'marble', thickness: 0.02 }, // guest bath, west
  { axis: 'z', plane: -6.85, dir: 1, from: -4.925, to: -2.075, y0: 0, y1: 1.65, mat: 'marble', thickness: 0.02 }, // guest bath, north
  { axis: 'z', plane: -6.85, dir: 1, from: -6.925, to: -3.075, y0: L1, y1: L1 + 1.45, mat: 'marble', thickness: 0.02 }, // master bath, north
  { axis: 'x', plane: 10.85, dir: -1, from: -1.925, to: 2.925, y0: L1, y1: L1 + 1.55, mat: 'marble', thickness: 0.02 }, // shared bath, east
  // Upper lounge — stone feature behind the reading corner
  { axis: 'x', plane: -2.925, dir: 1, from: 1.6, to: 6.85, y0: L1, y1: L1 + 3.3, mat: 'stone', thickness: 0.05 },
]

const room = (id: string) => HOUSE.rooms.find((r) => r.id === id)!
const inset = (r: Rect, d: number): Rect => [r[0] + d, r[1] + d, r[2] - d, r[3] - d]

/** Ceiling lighting per room (LED coves + recessed downlights). */
export const CEILINGS: CeilingLighting[] = [
  ...['master', 'bedroom2', 'bedroom3', 'office', 'lounge', 'kitchen'].map((id): CeilingLighting => ({
    rect: room(id).rects[0],
    level: room(id).level,
    cove: 0.42,
    downlights: 2.1,
  })),
  ...['living', 'dining', 'dressing', 'masterbath', 'bath2', 'guestbath', 'corridor'].map((id): CeilingLighting => ({
    rect: room(id).rects[0],
    level: room(id).level,
    downlights: 1.8,
  })),
  { rect: [-3, -7, 4, -5], level: 1, downlights: 1.8 }, // landing
  { rect: [-3, -5, -1, 1.5], level: 1, downlights: 1.8 }, // gallery
  { rect: [-5, -3.5, -2, -1.5], level: 0, downlights: 1.6 }, // vestibule
  { rect: [-2, -7, 4, 1.5], level: 0, downlights: 2.0 }, // entrance hall (both ceiling heights)
  { rect: inset([-11.3, 7, 11.3, 10], 0.2), level: 0, downlights: 2.4 }, // terrace soffit
  { rect: inset([-11.45, 7, 11.45, 9.6], 0.4), level: 1, downlights: 2.6 }, // balcony soffit (roof)
]

/** Ceiling height above a plan point on a level (handles the double-height hall). */
export function ceilingAt(level: LevelId, x: number, z: number): number {
  if (level === 1) return ROOF.bottom
  const covered = HOUSE.slabs.some((s) => s.top === L1 && x > s.rect[0] && x < s.rect[2] && z > s.rect[1] && z < s.rect[3])
  return covered ? L1 - 0.3 : ROOF.bottom
}

/**
 * Candidate positions for the dynamic interior light pool: one per room rectangle (two for
 * long rooms), hung 1.1 m under the ceiling. The nearest few to the camera are lit.
 */
export const LIGHT_POINTS: { pos: [number, number, number]; strength: number }[] = HOUSE.rooms
  .filter((r) => !r.outdoor)
  .flatMap((r) =>
    r.rects.flatMap((rect) => {
      const [x0, z0, x1, z1] = rect
      const w = x1 - x0
      const d = z1 - z0
      const area = w * d
      const cx = (x0 + x1) / 2
      const cz = (z0 + z1) / 2
      const pts: [number, number][] = w > 7 ? [[x0 + w * 0.3, cz], [x0 + w * 0.7, cz]] : d > 7 ? [[cx, z0 + d * 0.3], [cx, z0 + d * 0.7]] : [[cx, cz]]
      return pts.map(([x, z]) => ({ pos: [x, ceilingAt(r.level, x, z) - 1.1, z] as [number, number, number], strength: Math.min(1.6, 0.6 + area / 40) }))
    }),
  )
