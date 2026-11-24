import { useMemo } from 'react'
import { mat } from '../materials/materials'
import { mulberry32 } from '../materials/noise'
import { Instanced, type InstanceItem } from './Instanced'
import { terrainHeight } from './Landscape'
import { cypressGeometry, hedgeGeometry, lavenderGeometry, oliveGeometry, shrubGeometry } from './vegetationGeometry'

/** Mediterranean planting: cypress avenues, olive trees, clipped hedges and lavender beds. */

const rand = mulberry32(42)
const jitter = (a: number) => (rand() - 0.5) * a

function row(x0: number, z0: number, x1: number, z1: number, step: number) {
  const len = Math.hypot(x1 - x0, z1 - z0)
  const n = Math.max(1, Math.round(len / step))
  return Array.from({ length: n + 1 }, (_, i) => [x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n] as [number, number])
}

function cypressItems(): InstanceItem[] {
  const spots: [number, number][] = [
    ...row(3.2, -12, 3.2, -40, 4.6), // driveway avenue (west side)
    ...row(12.4, -12, 12.4, -40, 4.6), // driveway avenue (east side)
    ...row(-18, -13, -18, 18, 3.6), // west boundary
    ...row(18.5, -3, 18.5, 18, 4.2), // east boundary
    [-8, -13], [-11.5, -12.2], [-14.5, -13.4], [-5, -14.2],
  ]
  return spots.map(([x, z]) => {
    const h = 8 + rand() * 3
    const w = h * (0.5 + rand() * 0.12)
    return { p: [x + jitter(0.3), -0.1, z + jitter(0.3)], s: [w, h, w], r: rand() * 6.28 }
  })
}

function oliveItems(): InstanceItem[] {
  const spots: [number, number, number][] = [
    [-14, 14, 1.15], [20, -8, 1.1], [15.5, 3, 1.0], [-15.5, 3, 1.05], [-12, 24.5, 1.2], [-4, 25, 1.0],
    [-1.4, -11.6, 0.75], // forecourt planter
  ]
  return spots.map(([x, z, s]) => ({ p: [x, x === -1.4 ? 0.45 : -0.06, z], s: [s, s * (0.9 + rand() * 0.2), s], r: rand() * 6.28 }))
}

function lavenderItems(): InstanceItem[] {
  const out: InstanceItem[] = []
  const bed = (x0: number, z0: number, x1: number, z1: number, step = 0.55) => {
    for (let x = x0; x <= x1; x += step)
      for (let z = z0; z <= z1; z += step) {
        const s = 0.8 + rand() * 0.45
        out.push({ p: [x + jitter(0.12), -0.06, z + jitter(0.12)], s: [s, s * (0.9 + rand() * 0.3), s], r: rand() * 6.28 })
      }
  }
  bed(-11, 19.8, -5, 21.2)
  bed(6, 19.9, 10.5, 20.6)
  bed(12.7, 10.5, 14, 18.5)
  bed(-12.9, -6.5, -11.8, 6.5)
  bed(-10, -8.3, -3.4, -7.8)
  return out
}

/** Wild olives and cypresses scattered over the surrounding hills. */
function wildItems() {
  const olives: InstanceItem[] = []
  const cypresses: InstanceItem[] = []
  const r = mulberry32(99)
  let guard = 0
  while ((olives.length < 260 || cypresses.length < 90) && guard++ < 6000) {
    const a = r() * Math.PI * 2
    const d = 58 + Math.pow(r(), 1.6) * 380
    const x = Math.cos(a) * d
    const z = 4 + Math.sin(a) * d
    if (z > 75) continue // keep the sea view open
    if (x > 0 && x < 16 && z < -30) continue // driveway corridor
    const y = terrainHeight(x, z)
    if (y < -11) continue
    if (r() < 0.25 && cypresses.length < 90) {
      const h = 7 + r() * 5
      cypresses.push({ p: [x, y - 0.2, z], s: [h * 0.5, h, h * 0.5], r: r() * 6.28 })
    } else if (olives.length < 260) {
      const s = 1.1 + r() * 0.9
      olives.push({ p: [x, y - 0.2, z], s: [s, s * (0.8 + r() * 0.3), s], r: r() * 6.28 })
    }
  }
  return { olives, cypresses }
}

const hedges: InstanceItem[] = [
  { p: [0, -0.06, 27.5], s: [40, 1.1, 0.9] },
  { p: [-20.5, -0.06, 6.5], s: [0.9, 1.5, 42] },
  { p: [21, -0.06, 12.5], s: [0.9, 1.5, 30] },
  { p: [-11, -0.06, -16.5], s: [19, 1.5, 0.9] },
  // low frames around the pool deck lawns
  { p: [-8, -0.06, 19.5], s: [8, 0.55, 0.5] },
  { p: [8, -0.06, 19.5], s: [8, 0.55, 0.5] },
]

const shrubs: InstanceItem[] = [
  [-2.0, -9.6, 1.0], [-1.0, -12.6, 0.8], [5.2, -11, 0.9], [-12.4, 8.3, 1.1], [12.4, 8.1, 1.0], [12.6, 9.4, 0.8], [-12.5, 9.6, 0.85],
].map(([x, z, s]) => ({ p: [x, s * 0.4 - 0.06, z], s: [s * 1.2, s, s * 1.2], r: rand() * 6 }))

export function Vegetation() {
  const geo = useMemo(
    () => ({
      cypress: cypressGeometry(),
      oliveA: oliveGeometry(1, 2),
      oliveB: oliveGeometry(7, 2),
      // distant hillside olives: low-detail version (≈16× fewer triangles, invisible at that range)
      oliveFar: oliveGeometry(7, 1),
      hedge: hedgeGeometry(),
      shrub: shrubGeometry(),
      lavender: lavenderGeometry(),
    }),
    [],
  )
  const items = useMemo(() => {
    const olives = oliveItems()
    return {
      cypress: cypressItems(),
      oliveA: olives.filter((_, i) => i % 2 === 0),
      oliveB: olives.filter((_, i) => i % 2 === 1),
      lavender: lavenderItems(),
      wild: wildItems(),
    }
  }, [])

  return (
    <group>
      <Instanced geometry={geo.cypress} material={mat('foliageDark')} items={items.cypress} />
      <Instanced geometry={geo.oliveA.trunk} material={mat('bark')} items={items.oliveA} />
      <Instanced geometry={geo.oliveA.canopy} material={mat('foliageOlive')} items={items.oliveA} />
      <Instanced geometry={geo.oliveB.trunk} material={mat('bark')} items={items.oliveB} />
      <Instanced geometry={geo.oliveB.canopy} material={mat('foliageOlive')} items={items.oliveB} />
      <Instanced geometry={geo.hedge} material={mat('foliageHedge')} items={hedges} />
      <Instanced geometry={geo.shrub} material={mat('foliageHedge')} items={shrubs} />
      <Instanced geometry={geo.cypress} material={mat('foliageDark')} items={items.wild.cypresses} castShadow={false} receiveShadow={false} />
      <Instanced geometry={geo.oliveFar.trunk} material={mat('bark')} items={items.wild.olives} castShadow={false} receiveShadow={false} />
      <Instanced geometry={geo.oliveFar.canopy} material={mat('foliageOlive')} items={items.wild.olives} castShadow={false} receiveShadow={false} />
      <Instanced geometry={geo.lavender} material={mat('lavender')} items={items.lavender} castShadow={false} />
    </group>
  )
}
