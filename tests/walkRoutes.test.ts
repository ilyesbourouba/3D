/**
 * Scripted walking tests for the collision world (run: npm run test:walk).
 * A bot steers towards waypoints using the real movement physics; each route must complete,
 * and blocked moves (walls, glass, railings, pool, under the stairs) must stay blocked.
 */
import { HOUSE, LEVELS } from '../src/data/house'
import { OBSTACLES, PLAYER_RADIUS, resolve } from '../src/three/walk/collision'
import { stepWalker, type WalkerState } from '../src/three/walk/walkPhysics'

const DT = 1 / 60
let failures = 0
const ok = (msg: string) => console.log(`  ✓ ${msg}`)
const fail = (msg: string) => {
  failures++
  console.log(`  ✗ ${msg}`)
}

function walker(x: number, z: number, feet = 0): WalkerState {
  return { x, z, feet, yaw: 0, vx: 0, vz: 0, vy: 0 }
}

/** Body centre must never be inside an obstacle that overlaps the body vertically. */
function inside(s: WalkerState) {
  return OBSTACLES.find(
    (b) => b.y1 > s.feet + 0.25 && b.y0 < s.feet + 1.85 && s.x > b.x0 + 0.01 && s.x < b.x1 - 0.01 && s.z > b.z0 + 0.01 && s.z < b.z1 - 0.01,
  )
}

/** Walk through waypoints; returns false (and reports) if stuck. */
function route(name: string, s: WalkerState, points: [number, number][], expectFeet?: number) {
  for (const [tx, tz] of points) {
    let t = 0
    while (Math.hypot(tx - s.x, tz - s.z) > 0.18) {
      s.yaw = Math.atan2(-(tx - s.x), -(tz - s.z))
      stepWalker(s, { forward: 1, strafe: 0, run: false, push: 0 }, DT)
      const hit = inside(s)
      if (hit) return fail(`${name}: passed through an obstacle near (${s.x.toFixed(2)}, ${s.z.toFixed(2)})`)
      t += DT
      if (t > 25) return fail(`${name}: stuck at (${s.x.toFixed(2)}, ${s.z.toFixed(2)}, feet ${s.feet.toFixed(2)}) heading to (${tx}, ${tz})`)
    }
  }
  if (expectFeet !== undefined && Math.abs(s.feet - expectFeet) > 0.05) return fail(`${name}: ended at feet ${s.feet.toFixed(2)}, expected ${expectFeet}`)
  ok(name)
  return true
}

/** Walk straight for a while; `check` must hold at the end. */
function blocked(name: string, s: WalkerState, yaw: number, check: (s: WalkerState) => boolean) {
  s.yaw = yaw
  for (let t = 0; t < 6; t += DT) {
    stepWalker(s, { forward: 1, strafe: 0, run: true, push: 0 }, DT)
    if (inside(s)) return fail(`${name}: passed through an obstacle`)
  }
  if (check(s)) ok(name)
  else fail(`${name}: ended at (${s.x.toFixed(2)}, ${s.z.toFixed(2)}, feet ${s.feet.toFixed(2)})`)
}

const N = 0
const S = Math.PI
const E = -Math.PI / 2
const W = Math.PI / 2

console.log('Routes')
route('Front path → hall → living (around the sofa to the fireplace)', walker(1.4, -10), [[1.4, -4], [-1, -0.5], [-4.5, 1.5], [-4.5, 4.6], [-7, 4.6], [-9.6, 2.6]])
route('Living → dining (behind the table) → kitchen work side', walker(-7, 4.6), [[-4.5, 4.6], [1, 6.3], [5.2, 4], [5.2, 0.5], [7.6, 0.6]])
route('Kitchen → island stools → breakfast table', walker(5.2, 3.5), [[7.6, 3.5], [9.5, 4.2], [9.6, 6.3]])
route('Dining → terrace through the slider and back', walker(1, 6.3), [[2.2, 6.4], [2.2, 8.5], [2.2, 6.3]])
route('Hall → vestibule → office → behind the desk', walker(0, -2.5), [[-3.5, -2.7], [-5, -2.7], [-6.5, -2.8], [-6.5, -5.7], [-8, -5.75]])
route('Hall → guest bathroom', walker(0, -2.5), [[-3.4, -2.5], [-3.4, -3.5], [-3.1, -5]])
route('Stairs up: hall → upper lounge', walker(3.4, -5), [[3.4, -3.6], [3.4, 1.3], [3.0, 2.8]], 3.6)
route('Lounge → gallery → landing → bedroom three', walker(0, 3, 3.6), [[-1.7, 1], [-1.7, -6], [3.5, -6.05], [4.5, -6.05], [7, -4]], 3.6)
route('Lounge → corridor → bedroom two', walker(3, 2.3, 3.6), [[3.6, 2.3], [5.05, 2.3], [5.05, 4.6], [6.5, 6.3], [8.4, 6.4]], 3.6)
route('Corridor → shared bathroom', walker(5, 2.3, 3.6), [[5, 0.05], [7.5, 0.05], [9, 1]], 3.6)
route('Gallery → master → dressing → master bath', walker(-2, 1, 3.6), [[-2, 0.35], [-4.6, 0.35], [-7, 3], [-9.05, 0], [-9.05, -2.5], [-7.6, -2.85], [-6, -2.85], [-5, -4]], 3.6)
route('Master bedroom → balcony through the slider', walker(-6, 4, 3.6), [[-4.05, 6.4], [-4.05, 7.6], [8, 7.6]], 3.6)
route('Stairs down: lounge → hall', walker(3.4, 2.5, 3.6), [[3.4, 1.3], [3.4, -4.2], [1, -4.5]], 0)
route('Terrace → pool deck → garden', walker(0, 8.5), [[0, 10.6], [-9, 10.6], [-11, 17], [0, 22]])

route('Master bedroom → master bath → into the walk-in shower', walker(-6, 2, 3.6), [[-5.1, -0.4], [-5.1, -2.2], [-4.35, -4.3], [-4.35, -5.3], [-3.55, -5.6]], 3.6)
route('Dressing: loop around the island', walker(-9.05, -1.6, 3.6), [[-9.8, -2.6], [-9.8, -6.2], [-8.0, -6.2], [-8.0, -2.6]], 3.6)
route('Shared bath → into the shower', walker(7.5, 0.05, 3.6), [[8.5, 0.8], [9.3, 2.1], [10.2, 2.3]], 3.6)
route('Master bedroom → bedside', walker(-6, 2, 3.6), [[-4.3, 2.4], [-3.75, 2.2]], 3.6)

console.log('Blocked moves')
blocked('Hall: stone wall stops the walker', walker(1, -5.5), E, (s) => s.x < 3.85 - PLAYER_RADIUS + 0.02)
blocked('Dining: fixed glass stops the walker', walker(-0.5, 5), S, (s) => s.z < 7 - PLAYER_RADIUS + 0.03)
blocked('Office: window wall stops the walker', walker(-9.6, -5.5), N, (s) => s.z > -6.85 + PLAYER_RADIUS - 0.02)
blocked('Balcony: railing holds', walker(0, 8.2, 3.6), S, (s) => s.z < 9.2 && s.feet > 3.5)
blocked('Gallery: void railing holds', walker(-2, -2, 3.6), E, (s) => s.x < -1 && s.feet > 3.5)
blocked('Lounge: void railing holds', walker(0, 3, 3.6), N, (s) => s.z > 1.5 && s.feet > 3.5)
blocked('Pool deck: cannot walk into the pool', walker(0, 10.6), S, (s) => s.z < 11.5)
blocked('Dining: cannot walk into the space under the stairs', walker(3.4, 3), N, (s) => s.z > -0.75 && s.feet < 0.01)
blocked('Hall: stair balustrade blocks a side entry', walker(1.8, -1), E, (s) => s.x < 2.85 && s.feet < 0.01)
blocked('Living: the sofa blocks', walker(-4.5, 1.5), W, (s) => s.x > -5.075)
blocked('Kitchen: the island blocks', walker(7.6, 0.4), S, (s) => s.z < 1.3)
blocked('Dining: the table and chairs block', walker(1, 6.3), N, (s) => s.z > 4.95)
blocked('Master: the bed blocks', walker(-6.4, 4.05, 3.6), E, (s) => s.x < -5.88)
blocked('Master bath: shower glass blocks', walker(-3.5, -4.3, 3.6), N, (s) => s.z > -4.8)
blocked('Garden: hedge boundary', walker(0, 22), S, (s) => s.z <= 26.81)

console.log('Arrival points')
for (const room of HOUSE.rooms) {
  const [x, z] = room.spawn
  const s = walker(x, z, LEVELS[room.level].y)
  const [rx, rz] = resolve(x, z, s.feet)
  if (Math.hypot(rx - x, rz - z) > 0.02) fail(`${room.name}: arrival point overlaps an obstacle (pushed to ${rx.toFixed(2)}, ${rz.toFixed(2)})`)
  else ok(`${room.name}: arrival point is clear`)
}

console.log(failures ? `\n${failures} failure(s)` : '\nAll walking tests passed')
process.exit(failures ? 1 : 0)
