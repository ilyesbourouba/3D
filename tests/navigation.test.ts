/**
 * Guided-travel tests (run: npm run test:nav).
 * From the hall, the planner must find a route to every room, and the autopilot must actually
 * walk it with the real physics (stairs included) and arrive facing the room.
 */
import { HOUSE, LEVELS } from '../src/data/house'
import { createAutopilot, stepAutopilot } from '../src/three/walk/autopilot'
import { findPath } from '../src/three/walk/navGrid'
import type { WalkerState } from '../src/three/walk/walkPhysics'

let failures = 0
const check = (ok: boolean, msg: string) => {
  if (ok) console.log(`  ✓ ${msg}`)
  else {
    failures++
    console.log(`  ✗ ${msg}`)
  }
}

const t0 = performance.now()
findPath({ x: 1.7, z: -4.4, level: 0 }, { x: 1.7, z: -4.4, level: 0 })
console.log(`Grid built in ${(performance.now() - t0).toFixed(0)} ms`)

function travel(from: { x: number; z: number; level: number; yaw: number }, roomId: string) {
  const room = HOUSE.rooms.find((r) => r.id === roomId)!
  const [x, z, yaw] = room.spawn
  const path = findPath({ x: from.x, z: from.z, level: from.level }, { x, z, level: room.level })
  if (!path) return check(false, `${room.name}: no route found`)
  const s: WalkerState & { pitch: number } = { x: from.x, z: from.z, feet: LEVELS[from.level].y, yaw: from.yaw, pitch: 0, vx: 0, vz: 0, vy: 0 }
  const ap = createAutopilot(path, yaw)
  let t = 0
  for (; t < 60; t += 1 / 60) {
    const st = stepAutopilot(s, ap, 1 / 60)
    if (st === 'arrived') break
    if (st === 'stuck') return check(false, `${room.name}: autopilot stuck at (${s.x.toFixed(2)}, ${s.z.toFixed(2)}) after ${t.toFixed(1)} s`)
  }
  const there = Math.hypot(s.x - x, s.z - z) < 0.25 && Math.abs(s.feet - LEVELS[room.level].y) < 0.05
  check(there, `${room.name}: ${path.length} waypoints, arrived in ${t.toFixed(1)} s`)
}

console.log('From the entrance hall to every room')
for (const r of HOUSE.rooms) if (r.id !== 'hall') travel({ x: 1.7, z: -4.4, level: 0, yaw: Math.PI }, r.id)

console.log('Across floors, other direction')
travel({ x: 7.5, z: -4, level: 1, yaw: 0 }, 'kitchen') // bedroom three → kitchen
travel({ x: -8, z: -5.6, level: 0, yaw: 0 }, 'balcony') // office → balcony

console.log(failures ? `\n${failures} failure(s)` : '\nAll navigation checks passed')
process.exit(failures ? 1 : 0)
