import { FIRST_FLOOR } from './furnitureFirstFloor'
import { LIVING_LAYOUTS } from './livingLayouts'
import type { LevelId } from './types'

/**
 * Furniture placements — the single source of truth for what stands where.
 * The renderer draws each piece from the catalogue (three/furniture/catalog.tsx) and the
 * walking collision uses `collide` footprints, so furniture and collisions never drift apart.
 *
 * Conventions: `x`, `z` = centre of the footprint; `rot` turns the piece around y
 * (0 = front faces +z / south, π/2 = faces +x / east, -π/2 = faces -x / west, π = north).
 */

export type FurnitureType =
  | 'sofa' | 'chaise' | 'armchair' | 'coffeeTable' | 'sideTable' | 'arcLamp' | 'rug' | 'fireplace' | 'art' | 'plant' | 'loungeTable' | 'floorLamp'
  | 'diningTable' | 'diningChair' | 'linearPendant' | 'globePendant' | 'chandelier' | 'roundTable'
  | 'tallUnit' | 'counter' | 'island' | 'barStool'
  | 'desk' | 'officeChair' | 'bookcase' | 'console'
  | 'vanity' | 'toilet' | 'showerScreen' | 'bathtub' | 'tubFiller'
  | 'bed' | 'nightstand' | 'bench' | 'sideboard' | 'wardrobe' | 'dressingIsland' | 'floorMirror' | 'outdoorChair'

export interface Placement {
  id: string
  type: FurnitureType
  room: string
  level: LevelId
  x: number
  z: number
  /** Height offset above the floor (wall-mounted art). */
  y?: number
  rot?: number
  props?: Record<string, unknown>
  /** Collision footprint [width (local x), depth (local z), height] centred on the piece. */
  collide?: [number, number, number]
}

const PI = Math.PI
const E = PI / 2 // faces east (+x)
const W = -PI / 2 // faces west (-x)
const N = PI // faces north (-z)

/* ------------------------------------------------------------ living room */
// fixed pieces; the movable furniture depends on the chosen design (see livingLayouts.ts)
const living: Placement[] = [
  { id: 'fireplace', type: 'fireplace', room: 'living', level: 0, x: -10.79 + 0.25, z: 1.55, rot: E, props: { length: 5.4 }, collide: [5.4, 0.5, 1.1] },
  { id: 'living-art', type: 'art', room: 'living', level: 0, x: -10.79, z: 1.55, y: 2.2, rot: E, props: { w: 2.1, h: 1.05, variant: 'horizon' } },
  { id: 'living-plant', type: 'plant', room: 'living', level: 0, x: -10.1, z: 6.1, collide: [0.7, 0.7, 2] },
  ...LIVING_LAYOUTS.contemporary,
]

/* --------------------------------------------------------------- dining */
const diningChairs: Placement[] = [
  ...[0, 1, 2].map((i): Placement => ({ id: `dc-n${i}`, type: 'diningChair', room: 'dining', level: 0, x: i, z: 3.62, collide: [0.5, 0.5, 0.9] })),
  ...[0, 1, 2].map((i): Placement => ({ id: `dc-s${i}`, type: 'diningChair', room: 'dining', level: 0, x: i, z: 5.18, rot: N, collide: [0.5, 0.5, 0.9] })),
  { id: 'dc-w', type: 'diningChair', room: 'dining', level: 0, x: -0.92, z: 4.4, rot: E, collide: [0.5, 0.5, 0.9] },
  { id: 'dc-e', type: 'diningChair', room: 'dining', level: 0, x: 2.92, z: 4.4, rot: W, collide: [0.5, 0.5, 0.9] },
]
const dining: Placement[] = [
  { id: 'dining-table', type: 'diningTable', room: 'dining', level: 0, x: 1, z: 4.4, props: { length: 3, depth: 1.1 }, collide: [3, 1.1, 0.8] },
  ...diningChairs,
  { id: 'dining-pendant', type: 'linearPendant', room: 'dining', level: 0, x: 1, z: 4.4, props: { length: 2.2, hang: 2.45, ceil: 3.3 } },
]

/* -------------------------------------------------------------- kitchen */
const kitchen: Placement[] = [
  { id: 'tall-unit', type: 'tallUnit', room: 'kitchen', level: 0, x: 4.075 + 0.31, z: -0.2, rot: E, props: { length: 3.4 }, collide: [3.4, 0.62, 2.6] },
  { id: 'back-counter', type: 'counter', room: 'kitchen', level: 0, x: 7.775, z: -1.85 + 0.31, props: { length: 6.15, sinkAt: 0, hobAt: 2.2 }, collide: [6.15, 0.65, 0.95] },
  { id: 'side-counter', type: 'counter', room: 'kitchen', level: 0, x: 10.85 - 0.31, z: 0.4, rot: W, props: { length: 2.8, splash: 0 }, collide: [2.8, 0.65, 0.95] },
  { id: 'island', type: 'island', room: 'kitchen', level: 0, x: 7.6, z: 1.9, props: { length: 3.6, depth: 1.2 }, collide: [3.6, 1.2, 0.95] },
  ...[6.4, 7.2, 8.0, 8.8].map((x, i): Placement => ({ id: `stool-${i}`, type: 'barStool', room: 'kitchen', level: 0, x, z: 2.85, rot: N, collide: [0.42, 0.42, 0.8] })),
  ...[6.5, 7.6, 8.7].map((x, i): Placement => ({ id: `globe-${i}`, type: 'globePendant', room: 'kitchen', level: 0, x, z: 1.9, props: { hang: 2.05, ceil: 3.3 } })),
  { id: 'breakfast-table', type: 'roundTable', room: 'kitchen', level: 0, x: 8.1, z: 5.3, collide: [1.1, 1.1, 0.8] },
  { id: 'bc-1', type: 'diningChair', room: 'kitchen', level: 0, x: 7.3, z: 5.3, rot: E, props: { fabric: 'boucle' }, collide: [0.5, 0.5, 0.9] },
  { id: 'bc-2', type: 'diningChair', room: 'kitchen', level: 0, x: 8.9, z: 5.3, rot: W, props: { fabric: 'boucle' }, collide: [0.5, 0.5, 0.9] },
  { id: 'kitchen-plant', type: 'plant', room: 'kitchen', level: 0, x: 10.3, z: 3.6, props: { scale: 0.36 }, collide: [0.7, 0.7, 2] },
]

/* --------------------------------------------------------------- office */
const office: Placement[] = [
  { id: 'office-rug', type: 'rug', room: 'office', level: 0, x: -8, z: -4.3, props: { w: 3.2, d: 2.4 } },
  { id: 'desk', type: 'desk', room: 'office', level: 0, x: -8, z: -4.0, rot: N, props: { length: 2, depth: 0.85 }, collide: [2, 0.85, 0.8] },
  { id: 'office-chair', type: 'officeChair', room: 'office', level: 0, x: -8, z: -4.95, collide: [0.6, 0.6, 1.1] },
  { id: 'bookcase', type: 'bookcase', room: 'office', level: 0, x: -5.075 - 0.19, z: -5.15, rot: W, props: { length: 3.2 }, collide: [3.2, 0.38, 2.6] },
  { id: 'office-armchair', type: 'armchair', room: 'office', level: 0, x: -10.1, z: -2.35, rot: 2.4, collide: [0.85, 0.85, 0.8] },
  { id: 'office-lamp', type: 'arcLamp', room: 'office', level: 0, x: -10.4, z: -1.85, rot: 2.9, props: { reach: 0.9 }, collide: [0.36, 0.36, 2] },
]

/* ------------------------------------------------------------ guest bath */
const guestBath: Placement[] = [
  { id: 'guest-vanity', type: 'vanity', room: 'guestbath', level: 0, x: -4.905 + 0.25, z: -5.1, rot: E, props: { length: 1.2 }, collide: [1.2, 0.5, 0.9] },
  { id: 'guest-wc', type: 'toilet', room: 'guestbath', level: 0, x: -2.075 - 0.27, z: -6.1, rot: W, collide: [0.4, 0.55, 0.6] },
]

/* ----------------------------------------------------------------- hall */
const hall: Placement[] = [
  { id: 'console', type: 'console', room: 'hall', level: 0, x: -1.895 + 0.19, z: -5.2, rot: E, props: { length: 1.8 }, collide: [1.8, 0.38, 0.9] },
  { id: 'hall-art', type: 'art', room: 'hall', level: 0, x: -1.895, z: -5.2, y: 1.95, rot: E, props: { w: 0.95, h: 1.25, variant: 'arches' } },
  { id: 'chandelier', type: 'chandelier', room: 'hall', level: 0, x: 0.9, z: -1.8, props: { ceil: 6.9, lowest: 3.9, spread: 1.1 } },
  { id: 'hall-plant', type: 'plant', room: 'hall', level: 0, x: -1.35, z: 0.95, props: { scale: 0.45 }, collide: [0.7, 0.7, 2] },
]

export const FURNITURE: Placement[] = [...living, ...dining, ...kitchen, ...office, ...guestBath, ...hall, ...FIRST_FLOOR]

/** Garden light bollards [x, z] (drawn by environment/NightLights.tsx). */
export const BOLLARDS: [number, number][] = [
  // entrance path
  [2.75, -10.2], [2.75, -12.2], [2.75, -14.2], [-0.05, -11.2], [-0.05, -13.2],
  // pool deck
  [-11.6, 10.4], [-11.6, 18.6], [11.6, 10.4], [11.6, 18.6], [-4.6, 18.6], [8.6, 18.6],
  // garden path
  [0.6, 20.5], [3.4, 20.5], [0.6, 23.5], [3.4, 23.5], [0.6, 26.2], [3.4, 26.2],
  // terrace edge
  [-10.9, 10.15], [-5.5, 10.15], [5.5, 10.15], [10.9, 10.15],
]

/** Outdoor furniture footprints (drawn by exterior/OutdoorFurniture.tsx). */
export const OUTDOOR_COLLIDERS: [number, number, number, number, number][] = [
  // x0, x1, z0, z1, height
  ...[-10.6, -9.0, -7.4, 9.4, 11.0].map((x): [number, number, number, number, number] => [x - 0.4, x + 0.4, 12.6, 14.6, 0.9]), // loungers
  [-9.9, -6.9, 7.5, 9.6, 0.9], // terrace lounge
  [5.85, 8.55, 7.6, 9.6, 1.0], // terrace dining
  [-5.95, -5.25, 12.05, 12.75, 2.6], // parasol
  ...[[-3.4, 9.4], [3.6, 9.4], [2.9, -8.6]].map(([x, z]): [number, number, number, number, number] => [x - 0.45, x + 0.45, z - 0.45, z + 0.45, 1.5]), // planters
  ...BOLLARDS.map(([x, z]): [number, number, number, number, number] => [x - 0.06, x + 0.06, z - 0.06, z + 0.06, 0.55]), // garden bollards
]

/** World-space AABB of a placement's collision footprint (handles any rotation). */
export function footprintAABB(p: Placement) {
  if (!p.collide) return null
  const [w, d] = p.collide
  const c = Math.abs(Math.cos(p.rot ?? 0))
  const s = Math.abs(Math.sin(p.rot ?? 0))
  const hx = (w * c + d * s) / 2
  const hz = (w * s + d * c) / 2
  return { x0: p.x - hx, x1: p.x + hx, z0: p.z - hz, z1: p.z + hz }
}
