import type { Placement } from './furniture'

/**
 * The four living room designs the visitor can switch between. Each one is a full furniture
 * arrangement (not just new finishes); the fireplace, the painting and the olive tree stay.
 * Materials for each design are in three/materials/livingDesign.ts.
 *
 * Room: x -11 … -2, z -1.5 … 7. The fireplace stands on the west wall and faces east.
 */

export const LIVING_STYLE_IDS = ['contemporary', 'scandinavian', 'industrial', 'classic'] as const
export type LivingStyle = (typeof LIVING_STYLE_IDS)[number]

const PI = Math.PI
const E = PI / 2 // faces east (+x)
const W = -PI / 2 // faces west (-x)
const N = PI // faces north (-z)
const living = (p: Omit<Placement, 'room' | 'level'>): Placement => ({ ...p, room: 'living', level: 0, props: { ...p.props, living: true } })

export const LIVING_LAYOUTS: Record<LivingStyle, Placement[]> = {
  /** L-shaped bouclé sofa around travertine drums, two lounge chairs and an arc lamp. */
  contemporary: [
    living({ id: 'living-rug', type: 'rug', x: -7.9, z: 1.5, props: { w: 4.6, d: 3.6 } }),
    living({ id: 'sofa', type: 'sofa', x: -5.6, z: 1.6, rot: W, props: { length: 3.6 }, collide: [3.6, 1.05, 0.8] }),
    living({ id: 'chaise', type: 'chaise', x: -6.92, z: 2.88, props: { width: 1.6, depth: 1.0 }, collide: [1.6, 1.0, 0.6] }),
    living({ id: 'coffee-table', type: 'coffeeTable', x: -8.1, z: 1.35, collide: [1.5, 1.25, 0.45] }),
    living({ id: 'armchair-1', type: 'armchair', x: -9.35, z: -0.5, rot: 0.45, collide: [0.85, 0.85, 0.8] }),
    living({ id: 'armchair-2', type: 'armchair', x: -7.75, z: -0.55, rot: -0.2, collide: [0.85, 0.85, 0.8] }),
    living({ id: 'side-table', type: 'sideTable', x: -5.6, z: -0.65, collide: [0.5, 0.5, 0.6] }),
    living({ id: 'arc-lamp', type: 'arcLamp', x: -4.75, z: 3.05, rot: W, collide: [0.36, 0.36, 2] }),
  ],

  /** Two facing linen sofas around a pale oak table, a reading chair and a tripod lamp. */
  scandinavian: [
    living({ id: 'scandi-rug', type: 'rug', x: -7.6, z: 1.55, props: { w: 4.0, d: 3.4 } }),
    living({ id: 'scandi-sofa-n', type: 'sofa', x: -7.6, z: -0.35, props: { length: 2.6 }, collide: [2.6, 1.05, 0.8] }),
    living({ id: 'scandi-sofa-s', type: 'sofa', x: -7.6, z: 3.45, rot: N, props: { length: 2.6 }, collide: [2.6, 1.05, 0.8] }),
    living({ id: 'scandi-table', type: 'loungeTable', x: -7.6, z: 1.55, props: { w: 1.4, d: 0.75, h: 0.38 }, collide: [1.4, 0.75, 0.4] }),
    living({ id: 'scandi-chair', type: 'armchair', x: -5.3, z: 1.55, rot: W, collide: [0.85, 0.85, 0.8] }),
    living({ id: 'scandi-side', type: 'sideTable', x: -5.6, z: -0.4, collide: [0.5, 0.5, 0.6] }),
    living({ id: 'scandi-lamp', type: 'floorLamp', x: -9.45, z: 3.9, collide: [0.5, 0.5, 1.6] }),
  ],

  /** Long low sofa with a chaise, a solid concrete table, a steel console and a black lamp. */
  industrial: [
    living({ id: 'indus-rug', type: 'rug', x: -7.8, z: 1.5, props: { w: 4.8, d: 3.4 } }),
    living({ id: 'indus-sofa', type: 'sofa', x: -5.7, z: 1.4, rot: W, props: { length: 3.4, arms: false }, collide: [3.4, 1.05, 0.8] }),
    living({ id: 'indus-chaise', type: 'chaise', x: -7.0, z: 2.6, props: { width: 1.6, depth: 1.0 }, collide: [1.6, 1.0, 0.6] }),
    living({ id: 'indus-table', type: 'loungeTable', x: -8.4, z: 1.0, props: { w: 1.6, d: 0.9, h: 0.32, solid: true }, collide: [1.6, 0.9, 0.35] }),
    living({ id: 'indus-chair', type: 'armchair', x: -9.0, z: -0.55, rot: 0.55, collide: [0.85, 0.85, 0.8] }),
    living({ id: 'indus-console', type: 'console', x: -4.95, z: 1.4, rot: E, props: { length: 1.8 }, collide: [1.8, 0.38, 0.9] }),
    living({ id: 'indus-lamp', type: 'floorLamp', x: -7.4, z: -0.75, collide: [0.5, 0.5, 1.6] }),
  ],

  /** Symmetrical salon: sofa facing the fire, a pair of velvet chairs, marble table and globe pendants. */
  classic: [
    living({ id: 'classic-rug', type: 'rug', x: -7.9, z: 1.55, props: { w: 4.2, d: 3.6 } }),
    living({ id: 'classic-sofa', type: 'sofa', x: -6.0, z: 1.55, rot: W, props: { length: 2.6 }, collide: [2.6, 1.05, 0.8] }),
    living({ id: 'classic-chair-n', type: 'armchair', x: -8.3, z: -0.05, collide: [0.85, 0.85, 0.8] }),
    living({ id: 'classic-chair-s', type: 'armchair', x: -8.3, z: 3.15, rot: N, collide: [0.85, 0.85, 0.8] }),
    living({ id: 'classic-table', type: 'loungeTable', x: -8.0, z: 1.55, props: { w: 1.1, h: 0.4, round: true }, collide: [1.1, 1.1, 0.42] }),
    living({ id: 'classic-side-n', type: 'sideTable', x: -6.0, z: -0.05, collide: [0.5, 0.5, 0.6] }),
    living({ id: 'classic-side-s', type: 'sideTable', x: -6.0, z: 3.15, collide: [0.5, 0.5, 0.6] }),
    living({ id: 'classic-sideboard', type: 'sideboard', x: -5.0, z: 1.55, rot: W, props: { length: 2.2, lamp: false }, collide: [2.2, 0.45, 0.9] }),
    ...[-0.35, 0, 0.35].map((dz, i) => living({ id: `classic-globe-${i}`, type: 'globePendant', x: -8.0 + (i === 1 ? 0.25 : -0.1), z: 1.55 + dz, props: { hang: 2.35 + (i % 2) * 0.25, ceil: 3.3, radius: 0.13 } })),
  ],
}

/** Hotspots that describe the Contemporary pieces; hidden while another design is shown. */
export const CONTEMPORARY_HOTSPOTS = new Set(['sofa', 'lounge-chair', 'coffee-table', 'arc-lamp'])
