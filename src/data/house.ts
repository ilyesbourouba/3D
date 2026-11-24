import type { HouseData, Level, Opening, Room, Slab, Wall, Railing, Stair } from './types'

/**
 * VILLA AURELIA — the single source of truth for the building.
 * See README §3 for the plans. All coordinates in metres (x east, z south, y up).
 */

const EXT = 0.3 // exterior wall thickness
const INT = 0.15 // interior wall thickness
const PI = Math.PI

export const LEVELS: Level[] = [
  { id: 0, name: 'Ground Floor', y: 0, ceiling: 3.3 },
  { id: 1, name: 'First Floor', y: 3.6, ceiling: 3.3 },
]

export const ROOF = { bottom: 6.9, top: 7.25 }
/** Roof light over the double-height entrance hall: [x0, z0, x1, z1]. */
export const SKYLIGHT: [number, number, number, number] = [-0.6, -4.4, 2.4, 0.6]

/* ------------------------------------------------------------------ helpers */

const win = (from: number, to: number, sill: number, head: number): Opening => ({ from, to, sill, head, kind: 'window' })
const glass = (from: number, to: number, head = 3.3): Opening => ({ from, to, sill: 0, head, kind: 'glass' })
const door = (from: number, to: number, swing: 'pos' | 'neg' = 'pos', head = 2.6): Opening => ({ from, to, sill: 0, head, kind: 'door', swing })
const slider = (from: number, to: number, head = 3.3): Opening => ({ from, to, sill: 0, head, kind: 'slider' })

/* -------------------------------------------------------------------- walls */

const groundWalls: Wall[] = [
  // ── exterior ──
  {
    level: 0, axis: 'x', at: -7, from: -10.85, to: 3.85, thickness: EXT, pos: 'plaster', neg: 'stone', exterior: true,
    openings: [win(-10.2, -5.8, 0.9, 2.7), win(-4.1, -2.9, 1.7, 2.5), glass(-1.7, -0.1), { ...door(0.2, 2.0, 'pos', 2.9), noLeaf: true }, glass(2.3, 3.7)],
  },
  { level: 0, axis: 'z', at: 4, from: -7.15, to: -1.85, thickness: EXT, pos: 'stone', neg: 'plaster', exterior: true },
  {
    level: 0, axis: 'x', at: -2, from: 4.15, to: 10.85, thickness: EXT, pos: 'plaster', neg: 'stone', exterior: true,
    openings: [win(5.5, 10, 1.1, 2.5)],
  },
  {
    level: 0, axis: 'z', at: 11, from: -2.15, to: 7.15, thickness: EXT, pos: 'stone', neg: 'plaster', exterior: true,
    openings: [glass(2.5, 6.6)],
  },
  {
    level: 0, axis: 'z', at: -11, from: -7.15, to: 7.15, thickness: EXT, pos: 'plaster', neg: 'stone', exterior: true,
    openings: [win(-5.5, -2.5, 0.9, 2.7), glass(4.6, 6.7)],
  },
  {
    level: 0, axis: 'x', at: 7, from: -10.85, to: 10.85, thickness: EXT, pos: 'stone', neg: 'plaster', exterior: true,
    openings: [
      glass(-10.6, -6.6), glass(-6.5, -4.5), slider(-4.4, -2.4),
      glass(-1.6, 0.9), slider(1.0, 3.4),
      glass(4.3, 7.4), glass(7.5, 10.6),
    ],
  },
  // ── interior ──
  { level: 0, axis: 'z', at: -5, from: -6.85, to: -1.425, thickness: INT, pos: 'plaster', neg: 'plaster', openings: [door(-3.2, -2.2, 'neg')] },
  {
    level: 0, axis: 'x', at: -1.5, from: -10.85, to: -5.075, thickness: INT, pos: 'plaster', neg: 'plaster',
    openings: [{ from: -10.5, to: -5.5, sill: 0, head: 2.7, kind: 'glass' }],
  },
  { level: 0, axis: 'z', at: -2, from: -6.85, to: -3.425, thickness: INT, pos: 'plaster', neg: 'marble' },
  { level: 0, axis: 'x', at: -3.5, from: -4.925, to: -1.925, thickness: INT, pos: 'plaster', neg: 'marble', openings: [door(-3.9, -3.0, 'neg')] },
  { level: 0, axis: 'z', at: 4, from: -1.85, to: 1.575, thickness: INT, pos: 'walnut', neg: 'plaster' },
]

const firstWalls: Wall[] = [
  // ── exterior ──
  {
    level: 1, axis: 'x', at: -7, from: -10.85, to: 4, thickness: EXT, pos: 'plaster', neg: 'render', exterior: true,
    openings: [win(-10.3, -7.7, 2.0, 2.9), win(-6.5, -3.5, 1.5, 3.0), glass(-2.6, 3.6)],
  },
  {
    level: 1, axis: 'x', at: -7, from: 4, to: 10.85, thickness: EXT, pos: 'plaster', neg: 'timber', exterior: true,
    openings: [win(5.0, 10.2, 0.7, 2.9)],
  },
  {
    level: 1, axis: 'z', at: 11, from: -7.15, to: 7.15, thickness: EXT, pos: 'timber', neg: 'plaster', exterior: true,
    openings: [win(-6.2, -2.8, 0.7, 2.9), win(-1.0, 2.0, 1.6, 2.8), win(3.6, 6.6, 0.7, 2.9)],
  },
  {
    level: 1, axis: 'z', at: -11, from: -7.15, to: 7.15, thickness: EXT, pos: 'plaster', neg: 'render', exterior: true,
    openings: [win(1.0, 5.0, 0.6, 2.9)],
  },
  {
    level: 1, axis: 'x', at: 7, from: -10.85, to: 10.85, thickness: EXT, pos: 'render', neg: 'plaster', exterior: true,
    openings: [
      glass(-10.6, -7.6), glass(-7.5, -5.0), slider(-4.9, -3.2),
      glass(-2.8, 0.4), slider(0.5, 3.8),
      glass(4.2, 7.3), slider(7.4, 10.6),
    ],
  },
  // ── interior ──
  { level: 1, axis: 'z', at: -3, from: -6.85, to: -1.075, thickness: INT, pos: 'plaster', neg: 'marble' },
  { level: 1, axis: 'z', at: -3, from: -1.075, to: 6.85, thickness: INT, pos: 'plaster', neg: 'plaster', openings: [door(-0.3, 0.9, 'neg')] },
  { level: 1, axis: 'z', at: -7, from: -6.85, to: -1.075, thickness: INT, pos: 'marble', neg: 'plaster', openings: [door(-3.4, -2.4, 'pos')] },
  { level: 1, axis: 'x', at: -1, from: -10.85, to: -7, thickness: INT, pos: 'plaster', neg: 'plaster', openings: [door(-9.6, -8.6, 'neg')] },
  { level: 1, axis: 'x', at: -1, from: -7, to: -3.075, thickness: INT, pos: 'plaster', neg: 'marble', openings: [door(-5.6, -4.6, 'neg')] },
  { level: 1, axis: 'z', at: 4, from: -6.85, to: 6.85, thickness: INT, pos: 'plaster', neg: 'plaster', openings: [door(-6.6, -5.5), { ...door(1.7, 2.8), noLeaf: true /* pocket door, slides into the wall */ }] },
  { level: 1, axis: 'x', at: -2, from: 4.075, to: 6, thickness: INT, pos: 'plaster', neg: 'plaster' },
  { level: 1, axis: 'x', at: -2, from: 6, to: 10.85, thickness: INT, pos: 'marble', neg: 'plaster' },
  { level: 1, axis: 'z', at: 6, from: -1.925, to: 2.925, thickness: INT, pos: 'marble', neg: 'plaster', openings: [door(-0.5, 0.5)] },
  { level: 1, axis: 'x', at: 3, from: 4.075, to: 6, thickness: INT, pos: 'plaster', neg: 'plaster', openings: [door(4.4, 5.6)] },
  { level: 1, axis: 'x', at: 3, from: 6, to: 10.85, thickness: INT, pos: 'plaster', neg: 'marble' },
]

/* -------------------------------------------------------------------- slabs */

const G = (rect: Slab['rect'], topMat: Slab['topMat']): Slab => ({ rect, top: 0, thickness: 0.35, topMat, bottomMat: null, sideMat: 'stone' })
const F = (rect: Slab['rect'], topMat: Slab['topMat'], bottomMat: Slab['bottomMat'] = 'ceiling'): Slab => ({
  rect, top: 3.6, thickness: 0.3, topMat, bottomMat, sideMat: 'render',
})

const slabs: Slab[] = [
  // ground floor
  G([-2, -7.15, 4, 1.5], 'travertine'), // hall
  G([-5, -3.5, -2, -1.5], 'travertine'), // vestibule
  G([-11.15, -7.15, -5, -1.5], 'oak'), // office
  G([-5, -7.15, -2, -3.5], 'marble'), // guest bath
  G([-11.15, -1.5, -2, 7], 'oak'), // living
  G([-2, 1.5, 4, 7], 'oak'), // dining
  G([4, -2.15, 11.15, 7], 'travertine'), // kitchen
  G([-11.3, 7, 11.3, 10], 'paving'), // terrace
  G([4.15, -7.3, 11.3, -2.15], 'paving'), // carport
  G([-2.6, -9.2, 4.15, -7.15], 'paving'), // entrance forecourt
  // first floor
  F([-11.3, -7.3, -7, -1], 'oak'), // dressing
  F([-7, -7.3, -3, -1], 'marble'), // master bath
  F([-11.3, -1, -3, 7], 'oak'), // master bedroom
  F([-3, -7.3, 4, -5], 'oak'), // landing
  F([-3, -5, -1, 1.5], 'oak'), // gallery
  F([-3, 1.5, 4, 7], 'oak'), // lounge
  F([4, -7.3, 11.3, -2], 'oak', 'soffit'), // bedroom 3 (over carport)
  F([4, -2, 6, 3], 'oak'), // corridor
  F([6, -2, 11.3, 3], 'marble'), // shared bath
  F([4, 3, 11.3, 7], 'oak'), // bedroom 2
  F([-11.3, 7, 11.3, 9.2], 'deck', 'soffit'), // balcony
  // roof (split around the skylight above the entrance hall)
  ...([
    [-11.45, -7.45, 11.45, SKYLIGHT[1]],
    [-11.45, SKYLIGHT[3], 11.45, 7],
    [-11.45, SKYLIGHT[1], SKYLIGHT[0], SKYLIGHT[3]],
    [SKYLIGHT[2], SKYLIGHT[1], 11.45, SKYLIGHT[3]],
  ] as Slab['rect'][]).map((rect): Slab => ({ rect, top: ROOF.top, thickness: ROOF.top - ROOF.bottom, topMat: 'concrete', bottomMat: 'ceiling', sideMat: 'plaster' })),
  { rect: [-11.45, 7, 11.45, 9.6], top: ROOF.top, thickness: ROOF.top - ROOF.bottom, topMat: 'concrete', bottomMat: 'soffit', sideMat: 'render' },
]

/* ----------------------------------------------------------------- railings */

const railings: Railing[] = [
  { level: 1, axis: 'z', at: -1, from: -5, to: 1.5, height: 1.05 },
  { level: 1, axis: 'x', at: -5, from: -1, to: 4, height: 1.05 },
  { level: 1, axis: 'x', at: 1.5, from: -1, to: 2.85, height: 1.05 },
  { level: 1, axis: 'x', at: 9.2, from: -11.3, to: 11.3, height: 1.05 },
  { level: 1, axis: 'z', at: -11.3, from: 7, to: 9.2, height: 1.05 },
  { level: 1, axis: 'z', at: 11.3, from: 7, to: 9.2, height: 1.05 },
]

const stairs: Stair[] = [{ rect: [2.85, -3.5, 3.95, 1.5], fromLevel: 0, toLevel: 1, dir: '+z', risers: 18 }]

/* -------------------------------------------------------------------- rooms */

const rooms: Room[] = [
  // ground floor
  { id: 'hall', name: 'Entrance Hall', level: 0, rects: [[-2, -7, 4, 1.5], [-5, -3.5, -2, -1.5]], floor: 'travertine', tagline: 'A double-height welcome in travertine and light', spawn: [1.1, -5.2, PI] },
  { id: 'living', name: 'Living Room', level: 0, rects: [[-11, -1.5, -2, 7]], floor: 'oak', tagline: 'Panoramic lounge around a sculpted fireplace', spawn: [-2.6, 6.2, 0.87] },
  { id: 'dining', name: 'Dining Room', level: 0, rects: [[-2, 1.5, 4, 7]], floor: 'oak', tagline: 'Long table facing the garden and pool', spawn: [3.3, 2.2, 2.36] },
  { id: 'kitchen', name: 'Kitchen', level: 0, rects: [[4, -2, 11, 7]], floor: 'travertine', tagline: 'Calacatta marble island and walnut joinery', spawn: [10.3, 6.3, 0.63] },
  { id: 'office', name: 'Home Office', level: 0, rects: [[-11, -7, -5, -1.5]], floor: 'oak', tagline: 'A quiet study behind a glass partition', spawn: [-5.6, -2.0, 0.83] },
  { id: 'guestbath', name: 'Guest Bathroom', level: 0, rects: [[-5, -7, -2, -3.5]], floor: 'marble', tagline: 'Book-matched marble powder room', spawn: [-2.6, -3.9, 0.58] },
  { id: 'terrace', name: 'Terrace & Pool', level: 0, rects: [[-11, 7, 11, 10]], floor: 'paving', tagline: 'Covered terrace opening onto the pool', spawn: [9, 8.3, 1.87], outdoor: true },
  // first floor
  { id: 'master', name: 'Master Bedroom', level: 1, rects: [[-11, -1, -3, 7]], floor: 'oak', tagline: 'Suite with private balcony access', spawn: [-6.8, 6.3, -0.85] },
  { id: 'dressing', name: 'Walk-in Dressing', level: 1, rects: [[-11, -7, -7, -1]], floor: 'oak', tagline: 'Walnut wardrobes with integrated lighting', spawn: [-7.7, -1.5, 0.62] },
  { id: 'masterbath', name: 'Master Bathroom', level: 1, rects: [[-7, -7, -3, -1]], floor: 'marble', tagline: 'Freestanding bath and walk-in shower', spawn: [-3.6, -1.5, 0.53] },
  { id: 'gallery', name: 'Gallery', level: 1, rects: [[-3, -7, 4, -5], [-3, -5, -1, 1.5]], floor: 'oak', tagline: 'Overlooking the double-height hall', spawn: [-2, 1.0, -0.62] },
  { id: 'lounge', name: 'Upper Lounge', level: 1, rects: [[-3, 1.5, 4, 7]], floor: 'oak', tagline: 'Reading lounge at the top of the stairs', spawn: [3.4, 2.0, 2.22] },
  { id: 'bedroom2', name: 'Bedroom Two', level: 1, rects: [[4, 3, 11, 7]], floor: 'oak', tagline: 'Garden-facing guest bedroom', spawn: [5.05, 3.7, -2.03] },
  { id: 'bedroom3', name: 'Bedroom Three', level: 1, rects: [[4, -7, 11, -2]], floor: 'oak', tagline: 'Cantilevered bedroom above the carport', spawn: [4.6, -5.85, -2.15] },
  { id: 'bath2', name: 'Shared Bathroom', level: 1, rects: [[6, -2, 11, 3]], floor: 'marble', tagline: 'Double vanity in honed stone', spawn: [6.6, 2.4, -0.79] },
  { id: 'corridor', name: 'East Corridor', level: 1, rects: [[4, -2, 6, 3]], floor: 'oak', tagline: 'Serves bedroom two and the shared bathroom', spawn: [5, 2, 0], inMenu: false },
  { id: 'balcony', name: 'Balcony', level: 1, rects: [[-11, 7, 11, 9.2]], floor: 'deck', tagline: 'Overlooking the garden and the pool', spawn: [-9, 8.1, -2.0], outdoor: true },
]

export const HOUSE: HouseData = {
  levels: LEVELS,
  rooms,
  walls: [...groundWalls, ...firstWalls],
  slabs,
  railings,
  stairs,
  columns: [[10.95, -7.05, 0.22, 0, 3.3]],
}

/** Front door centre (outside face) — used by the cinematic entry. */
export const FRONT_DOOR = { x: 1.1, z: -7 }

/** Pool basin (inner water area) — see exterior/Pool.tsx. */
export const POOL = { rect: [-4, 11.5, 8, 15.5] as [number, number, number, number], depth: 1.5, water: -0.12 }

/** Paved deck around the pool. */
export const DECK = { rect: [-12, 10, 12, 19] as [number, number, number, number], top: 0 }

export const levelY = (level: number) => LEVELS[level]?.y ?? 0

/** The room containing a plan point on a level (first match), or null. */
export function roomAt(level: number, x: number, z: number) {
  return HOUSE.rooms.find((r) => r.level === level && r.rects.some(([x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1)) ?? null
}
