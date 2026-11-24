import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { registerGlow } from '../materials/materials'
import { mulberry32 } from '../materials/noise'
import { Cyl, G, P } from './parts'

/**
 * Bedroom and dressing-room furniture. Centred on the footprint, front facing +z
 * (for a bed, the headboard is at -z and the foot at +z).
 */

/** Platform bed with upholstered headboard, layered bedding and a velvet throw. */
export function Bed({ width = 2.0, length = 2.15 }: { width?: number; length?: number }) {
  const mw = width - 0.12
  const ml = length - 0.22
  return (
    <group>
      {/* recessed plinth + walnut platform */}
      <P s={[width - 0.2, 0.1, length - 0.3]} p={[0, 0.05, 0.05]} m="blackMetal" rad={0} />
      <P s={[width, 0.2, length - 0.12]} p={[0, 0.2, 0.06]} m="walnutWood" rad={0.012} />
      {/* headboard */}
      <P s={[width + 0.1, 1.1, 0.12]} p={[0, 0.55, -length / 2 + 0.06]} m="linen" rad={0.05} />
      {/* mattress + duvet */}
      <P s={[mw, 0.24, ml]} p={[0, 0.42, 0.08]} m="fabric" rad={0.06} />
      <P s={[mw + 0.06, 0.07, ml * 0.72]} p={[0, 0.55, 0.08 + ml * 0.14]} m="fabric" rad={0.035} />
      {/* throw folded across the foot */}
      <P s={[mw + 0.1, 0.05, 0.5]} p={[0, 0.6, length / 2 - 0.42]} m="velvet" rad={0.022} />
      {/* pillows */}
      {[-1, 1].map((s) => (
        <G key={s} p={[s * mw * 0.25, 0, 0]}>
          <P s={[mw * 0.44, 0.2, 0.16]} p={[0, 0.68, -length / 2 + 0.28]} r={[-0.35, 0, 0]} m="fabric" rad={0.08} />
          <P s={[mw * 0.4, 0.17, 0.14]} p={[0, 0.66, -length / 2 + 0.42]} r={[-0.3, 0, 0]} m="linen" rad={0.07} />
        </G>
      ))}
      <P s={[0.42, 0.3, 0.12]} p={[0, 0.66, -length / 2 + 0.55]} r={[-0.25, 0, 0]} m="velvet" rad={0.06} />
    </group>
  )
}

/** Floating walnut bedside table with a ceramic table lamp. */
export function Nightstand({ lamp = true }: { lamp?: boolean }) {
  return (
    <group>
      <P s={[0.5, 0.26, 0.42]} p={[0, 0.42, 0]} m="walnutWood" rad={0.012} />
      <P s={[0.44, 0.006, 0.004]} p={[0, 0.42, 0.211]} m="blackMetal" rad={0} shadow={false} />
      {lamp && <TableLamp p={[-0.08, 0.55, -0.04]} />}
      <P s={[0.18, 0.03, 0.13]} p={[0.13, 0.565, 0.06]} r={[0, 0.3, 0]} m="leather" rad={0.004} />
    </group>
  )
}

/** Ceramic table lamp with a glowing linen drum shade. */
export function TableLamp({ p = [0, 0, 0] as [number, number, number] }) {
  return (
    <G p={p}>
      <Cyl rt={0.05} rb={0.08} h={0.22} p={[0, 0.11, 0]} m="ceramic" />
      <Cyl rt={0.006} h={0.12} p={[0, 0.28, 0]} m="brass" seg={8} />
      <mesh position={[0, 0.39, 0]} material={paperMaterial()}>
        <cylinderGeometry args={[0.12, 0.15, 0.2, 40, 1, true]} />
      </mesh>
    </G>
  )
}

let paperMat: THREE.Material | null = null
function paperMaterial() {
  if (!paperMat) {
    const m = new THREE.MeshStandardMaterial({ color: '#f3ece0', emissive: '#ffd49a', emissiveIntensity: 0.9, roughness: 0.9, side: THREE.DoubleSide })
    registerGlow(m, 0.9)
    paperMat = m
  }
  return paperMat
}

/** Upholstered bench for the foot of the bed. */
export function Bench({ length = 1.5 }: { length?: number }) {
  return (
    <group>
      {[-1, 1].map((s) => (
        <P key={s} s={[0.04, 0.4, 0.4]} p={[s * (length / 2 - 0.06), 0.2, 0]} m="walnutWood" rad={0.01} />
      ))}
      <P s={[length, 0.04, 0.42]} p={[0, 0.36, 0]} m="walnutWood" rad={0.01} />
      <P s={[length - 0.04, 0.09, 0.4]} p={[0, 0.425, 0]} m="leather" rad={0.035} />
    </group>
  )
}

/** Walnut sideboard / dresser on slim brass legs with a few objects. */
export function Sideboard({ length = 2.2, depth = 0.45, lamp = true }: { length?: number; depth?: number; lamp?: boolean }) {
  const doors = Math.max(2, Math.round(length / 0.55))
  return (
    <group>
      <P s={[length, 0.56, depth]} p={[0, 0.5, 0]} m="walnutWood" rad={0.01} />
      {Array.from({ length: doors - 1 }, (_, i) => (
        <P key={i} s={[0.005, 0.5, 0.004]} p={[-length / 2 + (length / doors) * (i + 1), 0.5, depth / 2 + 0.001]} m="blackMetal" rad={0} shadow={false} />
      ))}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Cyl key={`${sx}${sz}`} rt={0.012} h={0.22} p={[sx * (length / 2 - 0.08), 0.11, sz * (depth / 2 - 0.07)]} m="brass" seg={10} />))}
      {lamp && <TableLamp p={[length / 2 - 0.3, 0.78, 0]} />}
      <Cyl rt={0.08} rb={0.12} h={0.3} p={[-length / 2 + 0.35, 0.93, 0]} m="ceramic" />
      <P s={[0.3, 0.05, 0.22]} p={[-0.1, 0.805, 0]} r={[0, 0.2, 0]} m="linen" rad={0.004} />
    </group>
  )
}

const CLOTHES = ['#e9e3d7', '#2f3b36', '#c9b79a', '#5b5550', '#a2836a', '#d8d2c6', '#3d3a35', '#7a5a44', '#9aa3a0']

/**
 * Open walnut wardrobe run: alternating hanging and shelf bays, integrated LED strip,
 * drawers below. Clothes are instanced (one draw call). Front faces +z.
 */
export function Wardrobe({ length = 4, height = 2.6, depth = 0.6 }: { length?: number; height?: number; depth?: number }) {
  const bays = Math.max(1, Math.round(length / 0.85))
  const bw = length / bays
  const items = useMemo(() => {
    const r = mulberry32(57)
    const out: { x: number; y: number; z: number; w: number; h: number; d: number; c: string }[] = []
    for (let b = 0; b < bays; b++) {
      const x0 = -length / 2 + b * bw
      if (b % 2 === 0) {
        // hanging: garments on a rail
        let x = x0 + 0.06
        while (x < x0 + bw - 0.08) {
          const h = 0.75 + r() * 0.45
          out.push({ x, y: 1.92 - h / 2, z: 0, w: 0.025 + r() * 0.02, h, d: depth * 0.72, c: CLOTHES[Math.floor(r() * CLOTHES.length)] })
          x += 0.05 + r() * 0.03
        }
      } else {
        // shelves with folded stacks
        for (let s = 0; s < 4; s++) {
          const y = 0.9 + s * 0.32
          for (let k = 0; k < 2; k++) {
            const stack = 2 + Math.floor(r() * 3)
            const c = CLOTHES[Math.floor(r() * CLOTHES.length)]
            out.push({ x: x0 + bw * (0.28 + k * 0.44), y: y + 0.02 + stack * 0.025, z: 0.02, w: bw * 0.36, h: stack * 0.05, d: depth * 0.6, c })
          }
        }
      }
    }
    return out
  }, [length, bays, bw, depth])
  const ref = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const clothMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 1 }), [])
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const mtx = new THREE.Matrix4()
    const col = new THREE.Color()
    items.forEach((it, i) => {
      mtx.compose(new THREE.Vector3(it.x, it.y, it.z), new THREE.Quaternion(), new THREE.Vector3(it.w, it.h, it.d))
      m.setMatrixAt(i, mtx)
      m.setColorAt(i, col.set(it.c))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [items])
  const t = 0.025
  return (
    <group>
      <P s={[length, height, 0.02]} p={[0, height / 2, -depth / 2 + 0.01]} m="walnutWood" rad={0} />
      <P s={[length, t, depth]} p={[0, height - t / 2, 0]} m="walnutWood" rad={0.003} />
      <P s={[length - 0.04, 0.008, 0.03]} p={[0, height - 0.035, depth / 2 - 0.06]} m="lampGlow" rad={0} shadow={false} />
      {Array.from({ length: bays + 1 }, (_, i) => (
        <P key={`v${i}`} s={[t, height, depth]} p={[-length / 2 + i * bw, height / 2, 0]} m="walnutWood" rad={0.003} />
      ))}
      {/* drawers below every bay */}
      <P s={[length, 0.78, depth]} p={[0, 0.39, 0]} m="walnutWood" rad={0.004} />
      {[0.26, 0.52].map((y) => (
        <P key={y} s={[length - 0.02, 0.006, 0.004]} p={[0, y, depth / 2 + 0.001]} m="blackMetal" rad={0} shadow={false} />
      ))}
      {Array.from({ length: bays }, (_, b) => {
        const x = -length / 2 + bw * (b + 0.5)
        return b % 2 === 0 ? (
          <Cyl key={b} rt={0.012} h={bw - 0.04} p={[x, 1.95, 0]} r={[0, 0, Math.PI / 2]} m="brass" seg={10} />
        ) : (
          <G key={b} p={[x, 0, 0]}>
            {[0.9, 1.22, 1.54, 1.86, 2.18].map((y) => (
              <P key={y} s={[bw - t, t, depth - 0.02]} p={[0, y, 0]} m="walnutWood" rad={0.003} />
            ))}
          </G>
        )
      })}
      <instancedMesh ref={ref} args={[geo, clothMat, items.length]} castShadow receiveShadow />
    </group>
  )
}

/** Dressing island: walnut drawers under a marble top with a glass display tray. */
export function DressingIsland({ length = 2.2, width = 0.9 }: { length?: number; width?: number }) {
  return (
    <group>
      <P s={[length - 0.04, 0.82, width - 0.04]} p={[0, 0.41 + 0.04, 0]} m="walnutWood" rad={0.006} />
      <P s={[length - 0.1, 0.08, width - 0.1]} p={[0, 0.04, 0]} m="blackMetal" rad={0} />
      <P s={[length, 0.04, width]} p={[0, 0.89, 0]} m="marbleSlab" rad={0.006} />
      {[0.3, 0.6].map((y) =>
        [-1, 1].map((s) => <P key={`${y}${s}`} s={[length - 0.06, 0.006, 0.004]} p={[0, y, s * (width / 2 - 0.018)]} m="blackMetal" rad={0} shadow={false} />),
      )}
      <P s={[0.5, 0.012, 0.3]} p={[-0.4, 0.917, 0]} m="leather" rad={0.004} />
      <Cyl rt={0.07} rb={0.05} h={0.16} p={[0.5, 0.99, 0.1]} m="ceramic" />
    </group>
  )
}

/** Full-length mirror leaning on the wall (back at -z). */
export function FloorMirror({ width = 0.9, height = 2.1 }: { width?: number; height?: number }) {
  return (
    <group rotation={[-0.06, 0, 0]}>
      <P s={[width, height, 0.04]} p={[0, height / 2, 0]} m="brass" rad={0.01} />
      <P s={[width - 0.06, height - 0.06, 0.01]} p={[0, height / 2, 0.022]} m="mirror" rad={0} shadow={false} />
    </group>
  )
}

/** Teak outdoor armchair with deep cushions. */
export function OutdoorChair() {
  return (
    <group>
      <P s={[0.78, 0.26, 0.78]} p={[0, 0.13, 0]} m="teak" rad={0.02} />
      <P s={[0.72, 0.13, 0.7]} p={[0, 0.33, 0.02]} m="fabric" rad={0.05} />
      <P s={[0.78, 0.38, 0.12]} p={[0, 0.5, -0.33]} r={[-0.15, 0, 0]} m="fabric" rad={0.05} />
      {[-1, 1].map((s) => (
        <P key={s} s={[0.08, 0.2, 0.74]} p={[s * 0.37, 0.36, 0]} m="teak" rad={0.02} />
      ))}
    </group>
  )
}
