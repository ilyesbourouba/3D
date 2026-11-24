import type { WalkerState } from './walkPhysics'

/**
 * Live pose of the visitor inside the house. Plain data (no three.js) so the 2D interface
 * (minimap) can read it every animation frame without pulling the 3D bundle.
 */
export const player: WalkerState & { pitch: number } = { x: 0, z: 0, feet: 0, yaw: 0, pitch: 0, vx: 0, vz: 0, vy: 0 }

export const EYE_HEIGHT = 1.65

/** Floor index the visitor is on. */
export const playerLevel = () => (player.feet > 1.8 ? 1 : 0)
