import { floorBelow, resolve, STEP_HEIGHT } from './collision'

/**
 * Pure first-person movement step (no three.js, no DOM) so it can be driven by the game loop
 * and by scripted route tests alike.
 */

export interface WalkerState {
  x: number
  z: number
  /** Height of the feet (floor level the walker stands on). */
  feet: number
  /** Heading: 0 looks north (-z), +π/2 looks west (-x). */
  yaw: number
  vx: number
  vz: number
  vy: number
}

export interface WalkerInput {
  /** -1..1 forward/back and right/left. */
  forward: number
  strafe: number
  run: boolean
  /** Extra forward displacement this step (mouse wheel), metres. */
  push: number
  /** Optional speed override in m/s (guided travel). */
  speed?: number
}

export const WALK_SPEED = 1.7 // m/s, a relaxed real walking pace
export const RUN_SPEED = 3.4

export function stepWalker(s: WalkerState, input: WalkerInput, dt: number) {
  const sin = Math.sin(s.yaw)
  const cos = Math.cos(s.yaw)
  const f = Math.max(-1, Math.min(1, input.forward))
  const st = Math.max(-1, Math.min(1, input.strafe))
  let wx = -sin * f + cos * st
  let wz = -cos * f - sin * st
  const len = Math.hypot(wx, wz)
  if (len > 1) {
    wx /= len
    wz /= len
  }
  const speed = input.speed ?? (input.run ? RUN_SPEED : WALK_SPEED)
  const accel = len > 0 ? 9 : 12
  const k = Math.min(1, dt * accel)
  s.vx += (wx * speed - s.vx) * k
  s.vz += (wz * speed - s.vz) * k

  let dx = s.vx * dt - sin * input.push
  let dz = s.vz * dt - cos * input.push
  // sub-steps so fast movement cannot tunnel through thin walls or glass
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08))
  dx /= n
  dz /= n
  for (let i = 0; i < n; i++) {
    ;[s.x, s.z] = resolve(s.x + dx, s.z + dz, s.feet)
    followFloor(s, dt / n)
  }
}

function followFloor(s: WalkerState, dt: number) {
  const floor = floorBelow(s.x, s.z, s.feet)
  if (floor > s.feet) {
    // stepping up (stair treads, thresholds): ease up quickly
    s.feet = Math.min(floor, s.feet + Math.max((floor - s.feet) * dt * 16, 0.01))
    s.vy = 0
  } else if (floor < s.feet) {
    const drop = s.feet - floor
    if (s.vy === 0 && drop <= STEP_HEIGHT) {
      s.feet = floor // walking down stairs: stay on the treads
    } else {
      s.vy -= 9.81 * dt
      s.feet = Math.max(floor, s.feet + s.vy * dt)
      if (s.feet === floor) s.vy = 0
    }
  }
}
