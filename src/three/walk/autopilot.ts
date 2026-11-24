import type { NavPoint } from './navGrid'
import { stepWalker, type WalkerState } from './walkPhysics'

/**
 * Guided travel: steers the walker along a path at a calm pace, turning smoothly towards each
 * waypoint and finally to the room's viewing direction. Uses the normal walking physics, so it
 * climbs the stairs and respects every collision exactly like a visitor would.
 */

export const GUIDE_SPEED = 2.6 // m/s

export interface Autopilot {
  path: NavPoint[]
  i: number
  finalYaw: number
  best: number
  stuckFor: number
}

export type AutopilotStatus = 'moving' | 'arrived' | 'stuck'

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

export function createAutopilot(path: NavPoint[], finalYaw: number): Autopilot {
  return { path, i: 1, finalYaw, best: Infinity, stuckFor: 0 }
}

export function stepAutopilot(s: WalkerState & { pitch: number }, ap: Autopilot, dt: number): AutopilotStatus {
  // final turn towards the room's viewing direction
  if (ap.i >= ap.path.length) {
    const diff = wrap(ap.finalYaw - s.yaw)
    s.yaw += diff * Math.min(1, dt * 3.5)
    s.pitch += (-0.06 - s.pitch) * Math.min(1, dt * 3)
    stepWalker(s, { forward: 0, strafe: 0, run: false, push: 0 }, dt)
    return Math.abs(diff) < 0.02 ? 'arrived' : 'moving'
  }
  const last = ap.i === ap.path.length - 1
  const t = ap.path[ap.i]
  const dx = t.x - s.x
  const dz = t.z - s.z
  const d = Math.hypot(dx, dz)
  if (d < (last ? 0.12 : 0.35)) {
    ap.i++
    ap.best = Infinity
    ap.stuckFor = 0
    return 'moving'
  }
  // progress watchdog
  if (d < ap.best - 0.02) {
    ap.best = d
    ap.stuckFor = 0
  } else if ((ap.stuckFor += dt) > 2) return 'stuck'

  const desired = Math.atan2(-dx, -dz)
  const diff = wrap(desired - s.yaw)
  s.yaw += diff * Math.min(1, dt * 5)
  s.pitch += (-0.04 - s.pitch) * Math.min(1, dt * 2)
  // slow down for sharp turns and on the final approach
  const forward = Math.abs(diff) > 1 ? 0.2 : last ? Math.min(1, d / 1.2 + 0.25) : 1
  stepWalker(s, { forward, strafe: 0, run: false, push: 0, speed: GUIDE_SPEED }, dt)
  return 'moving'
}
