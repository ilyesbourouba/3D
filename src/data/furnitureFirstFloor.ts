import type { Placement } from './furniture'

/**
 * First-floor furniture (level 1). Same conventions as data/furniture.ts:
 * x/z = footprint centre, rot 0 = front faces +z, π/2 = +x, -π/2 = -x, π = -z.
 * Wall faces used below: walnut headboard panels at x -3.105 (master), z 3.105 (bedroom two),
 * z -2.105 (bedroom three); marble bath walls 2 cm proud of the plaster.
 */

const PI = Math.PI
const E = PI / 2
const W = -PI / 2
const N = PI
const L = 1 as const

/* -------------------------------------------------------- master bedroom */
const master: Placement[] = [
  { id: 'm-rug', type: 'rug', room: 'master', level: L, x: -4.9, z: 4.05, props: { w: 3.6, d: 3.4 } },
  { id: 'm-bed', type: 'bed', room: 'master', level: L, x: -4.205, z: 4.05, rot: W, props: { width: 2.0, length: 2.2 }, collide: [2.1, 2.2, 1.1] },
  { id: 'm-ns-1', type: 'nightstand', room: 'master', level: L, x: -3.315, z: 2.7, rot: W, collide: [0.5, 0.42, 0.7] },
  { id: 'm-ns-2', type: 'nightstand', room: 'master', level: L, x: -3.315, z: 5.4, rot: W, collide: [0.5, 0.42, 0.7] },
  { id: 'm-bench', type: 'bench', room: 'master', level: L, x: -5.605, z: 4.05, rot: W, props: { length: 1.6 }, collide: [1.6, 0.42, 0.5] },
  { id: 'm-sideboard', type: 'sideboard', room: 'master', level: L, x: -7.1, z: -0.925 + 0.225, props: { length: 2.4 }, collide: [2.4, 0.45, 0.9] },
  { id: 'm-art', type: 'art', room: 'master', level: L, x: -7.1, z: -0.925, y: 1.75, props: { w: 1.0, h: 1.0, variant: 'enso' } },
  { id: 'm-armchair', type: 'armchair', room: 'master', level: L, x: -9.4, z: 2.0, rot: 1.2, collide: [0.85, 0.85, 0.8] },
  { id: 'm-side', type: 'sideTable', room: 'master', level: L, x: -9.95, z: 2.95, collide: [0.5, 0.5, 0.6] },
  { id: 'm-lamp', type: 'arcLamp', room: 'master', level: L, x: -10.4, z: 1.2, rot: 1.0, props: { reach: 0.9 }, collide: [0.36, 0.36, 2] },
  { id: 'm-plant', type: 'plant', room: 'master', level: L, x: -10.15, z: 6.15, props: { scale: 0.4 }, collide: [0.7, 0.7, 2] },
]

/* ----------------------------------------------------- walk-in dressing */
const dressing: Placement[] = [
  { id: 'd-wardrobe-w', type: 'wardrobe', room: 'dressing', level: L, x: -10.85 + 0.3, z: -4.025, rot: E, props: { length: 5.6 }, collide: [5.6, 0.6, 2.6] },
  { id: 'd-wardrobe-e', type: 'wardrobe', room: 'dressing', level: L, x: -7.075 - 0.3, z: -5.225, rot: W, props: { length: 3.2 }, collide: [3.2, 0.6, 2.6] },
  { id: 'd-island', type: 'dressingIsland', room: 'dressing', level: L, x: -8.9, z: -4.6, rot: E, props: { length: 2.2, width: 0.9 }, collide: [2.2, 0.9, 0.95] },
  { id: 'd-mirror', type: 'floorMirror', room: 'dressing', level: L, x: -8.9, z: -6.85 + 0.06, collide: [0.9, 0.15, 2.1] },
]

/* ------------------------------------------------------- master bathroom */
const masterBath: Placement[] = [
  { id: 'mb-tub', type: 'bathtub', room: 'masterbath', level: L, x: -5.6, z: -6.15, collide: [1.75, 0.85, 0.6] },
  { id: 'mb-filler', type: 'tubFiller', room: 'masterbath', level: L, x: -6.65, z: -6.15, rot: E, collide: [0.2, 0.2, 1] },
  { id: 'mb-shower', type: 'showerScreen', room: 'masterbath', level: L, x: -3.525, z: -4.8, props: { width: 0.9, depth: 2.03, ceil: 3.3 }, collide: [0.9, 0.05, 2.1] },
  { id: 'mb-vanity', type: 'vanity', room: 'masterbath', level: L, x: -3.075 - 0.25, z: -3.35, rot: W, props: { length: 1.8, basins: 2 }, collide: [1.8, 0.5, 0.9] },
  { id: 'mb-wc', type: 'toilet', room: 'masterbath', level: L, x: -6.925 + 0.27, z: -1.6, rot: E, collide: [0.4, 0.55, 0.6] },
]

/* --------------------------------------------------------- gallery/landing */
const gallery: Placement[] = [
  { id: 'g-bench', type: 'bench', room: 'gallery', level: L, x: 0.5, z: -6.6, props: { length: 1.8 }, collide: [1.8, 0.42, 0.5] },
  { id: 'g-art', type: 'art', room: 'gallery', level: L, x: -2.925, z: -2.6, y: 1.6, rot: E, props: { w: 0.9, h: 1.2, variant: 'fields' } },
  { id: 'g-plant', type: 'plant', room: 'gallery', level: L, x: -2.55, z: -6.5, props: { scale: 0.38 }, collide: [0.7, 0.7, 2] },
]

/* ----------------------------------------------------------- upper lounge */
const lounge: Placement[] = [
  { id: 'l-rug', type: 'rug', room: 'lounge', level: L, x: 0.1, z: 4.3, props: { w: 3.6, d: 2.8 } },
  { id: 'l-sofa', type: 'sofa', room: 'lounge', level: L, x: 1.6, z: 4.3, rot: W, props: { length: 2.6 }, collide: [2.6, 1.05, 0.8] },
  { id: 'l-table', type: 'coffeeTable', room: 'lounge', level: L, x: 0.1, z: 4.3, collide: [1.5, 1.25, 0.45] },
  { id: 'l-chair-1', type: 'armchair', room: 'lounge', level: L, x: -1.55, z: 3.55, rot: 1.25, collide: [0.85, 0.85, 0.8] },
  { id: 'l-chair-2', type: 'armchair', room: 'lounge', level: L, x: -1.55, z: 5.05, rot: 1.9, collide: [0.85, 0.85, 0.8] },
  { id: 'l-side', type: 'sideTable', room: 'lounge', level: L, x: 1.6, z: 6.0, collide: [0.5, 0.5, 0.6] },
  { id: 'l-lamp', type: 'arcLamp', room: 'lounge', level: L, x: -2.45, z: 6.3, rot: 2.3, props: { reach: 1.1 }, collide: [0.36, 0.36, 2] },
  { id: 'l-plant', type: 'plant', room: 'lounge', level: L, x: 3.2, z: 6.3, props: { scale: 0.4 }, collide: [0.7, 0.7, 2] },
]

/* ------------------------------------------------------------ bedroom two */
const bedroom2: Placement[] = [
  { id: 'b2-rug', type: 'rug', room: 'bedroom2', level: L, x: 8.4, z: 4.7, props: { w: 3.0, d: 2.6 } },
  { id: 'b2-bed', type: 'bed', room: 'bedroom2', level: L, x: 8.4, z: 3.105 + 1.075, props: { width: 1.8, length: 2.15 }, collide: [1.9, 2.15, 1.1] },
  { id: 'b2-ns-1', type: 'nightstand', room: 'bedroom2', level: L, x: 7.15, z: 3.105 + 0.21, collide: [0.5, 0.42, 0.7] },
  { id: 'b2-ns-2', type: 'nightstand', room: 'bedroom2', level: L, x: 9.65, z: 3.105 + 0.21, collide: [0.5, 0.42, 0.7] },
  { id: 'b2-desk', type: 'desk', room: 'bedroom2', level: L, x: 4.075 + 0.35, z: 5.6, rot: E, props: { length: 1.4, depth: 0.7 }, collide: [1.4, 0.7, 0.8] },
  { id: 'b2-chair', type: 'diningChair', room: 'bedroom2', level: L, x: 5.1, z: 5.6, rot: W, props: { fabric: 'boucle' }, collide: [0.5, 0.5, 0.9] },
  { id: 'b2-armchair', type: 'armchair', room: 'bedroom2', level: L, x: 10.2, z: 6.1, rot: -2.4, collide: [0.85, 0.85, 0.8] },
]

/* ---------------------------------------------------------- bedroom three */
const bedroom3: Placement[] = [
  { id: 'b3-rug', type: 'rug', room: 'bedroom3', level: L, x: 8.1, z: -3.9, props: { w: 3.0, d: 2.6 } },
  { id: 'b3-bed', type: 'bed', room: 'bedroom3', level: L, x: 8.1, z: -2.105 - 1.075, rot: N, props: { width: 1.8, length: 2.15 }, collide: [1.9, 2.15, 1.1] },
  { id: 'b3-ns-1', type: 'nightstand', room: 'bedroom3', level: L, x: 6.85, z: -2.105 - 0.21, rot: N, collide: [0.5, 0.42, 0.7] },
  { id: 'b3-ns-2', type: 'nightstand', room: 'bedroom3', level: L, x: 9.35, z: -2.105 - 0.21, rot: N, collide: [0.5, 0.42, 0.7] },
  { id: 'b3-desk', type: 'desk', room: 'bedroom3', level: L, x: 7.6, z: -6.85 + 0.35, props: { length: 1.6, depth: 0.7 }, collide: [1.6, 0.7, 0.8] },
  { id: 'b3-chair', type: 'diningChair', room: 'bedroom3', level: L, x: 7.6, z: -5.85, rot: N, props: { fabric: 'linen' }, collide: [0.5, 0.5, 0.9] },
  { id: 'b3-armchair', type: 'armchair', room: 'bedroom3', level: L, x: 10.15, z: -6.1, rot: -0.75, collide: [0.85, 0.85, 0.8] },
]

/* --------------------------------------------------------- shared bathroom */
const bath2: Placement[] = [
  { id: 'b-vanity', type: 'vanity', room: 'bath2', level: L, x: 8.6, z: -1.925 + 0.25, props: { length: 1.8, basins: 2 }, collide: [1.8, 0.5, 0.9] },
  { id: 'b-shower', type: 'showerScreen', room: 'bath2', level: L, x: 10.225, z: 1.25, rot: N, props: { width: 1.25, depth: 1.675, ceil: 3.3 }, collide: [1.25, 0.05, 2.1] },
  { id: 'b-wc', type: 'toilet', room: 'bath2', level: L, x: 7.3, z: 2.925 - 0.27, rot: N, collide: [0.4, 0.55, 0.6] },
]

/* --------------------------------------------------------------- balcony */
const balcony: Placement[] = [
  ...[-6.6, -5.0, 7.6, 9.2].map((x, i): Placement => ({ id: `bal-chair-${i}`, type: 'outdoorChair', room: 'balcony', level: L, x, z: 8.45, collide: [0.8, 0.8, 0.8] })),
  { id: 'bal-table-1', type: 'sideTable', room: 'balcony', level: L, x: -5.8, z: 8.55, collide: [0.5, 0.5, 0.6] },
  { id: 'bal-table-2', type: 'sideTable', room: 'balcony', level: L, x: 8.4, z: 8.55, collide: [0.5, 0.5, 0.6] },
  { id: 'bal-plant-1', type: 'plant', room: 'balcony', level: L, x: -10.55, z: 8.65, props: { scale: 0.35 }, collide: [0.7, 0.7, 2] },
  { id: 'bal-plant-2', type: 'plant', room: 'balcony', level: L, x: 10.55, z: 8.65, props: { scale: 0.35 }, collide: [0.7, 0.7, 2] },
]

export const FIRST_FLOOR: Placement[] = [...master, ...dressing, ...masterBath, ...gallery, ...lounge, ...bedroom2, ...bedroom3, ...bath2, ...balcony]
