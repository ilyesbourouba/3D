/**
 * Data integrity checks (run: npm run test:data).
 * Hotspots must point at existing furniture, ids must be unique, copy must be complete,
 * and every main room must offer at least one hotspot.
 */
import { FURNITURE } from '../src/data/furniture'
import { HOTSPOTS } from '../src/data/hotspots'
import { HOUSE } from '../src/data/house'

let failures = 0
const check = (ok: boolean, msg: string) => {
  if (ok) console.log(`  ✓ ${msg}`)
  else {
    failures++
    console.log(`  ✗ ${msg}`)
  }
}

console.log('Furniture')
const furnitureIds = FURNITURE.map((f) => f.id)
check(new Set(furnitureIds).size === furnitureIds.length, `${furnitureIds.length} placements, all ids unique`)
for (const f of FURNITURE) {
  if (!HOUSE.rooms.some((r) => r.id === f.room)) check(false, `${f.id}: unknown room "${f.room}"`)
}

console.log('Hotspots')
const ids = HOTSPOTS.map((h) => h.id)
check(new Set(ids).size === ids.length, `${ids.length} hotspots, all ids unique`)
for (const h of HOTSPOTS) {
  if ('placement' in h.target) {
    const id = h.target.placement
    check(furnitureIds.includes(id), `${h.id} → furniture "${id}" exists`)
  }
  check([h.name, h.description, h.material, h.inspiration].every((s) => s.trim().length > 3), `${h.id}: name, description, material and inspiration filled in`)
}

console.log('Coverage')
const roomsWithHotspots = new Set(
  HOTSPOTS.flatMap((h) => ('placement' in h.target ? [FURNITURE.find((f) => f.id === (h.target as { placement: string }).placement)?.room] : [])),
)
for (const r of HOUSE.rooms.filter((r) => r.inMenu !== false && !r.outdoor && r.id !== 'gallery')) {
  check(roomsWithHotspots.has(r.id), `${r.name} has at least one hotspot`)
}

console.log(failures ? `\n${failures} failure(s)` : '\nAll data checks passed')
process.exit(failures ? 1 : 0)
