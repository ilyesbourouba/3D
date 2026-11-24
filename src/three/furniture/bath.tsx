import * as THREE from 'three'
import { mat } from '../materials/materials'
import { Cyl, G, P } from './parts'

/**
 * Bathroom pieces. Back against the wall at z = -depth/2, front facing +z.
 */

/** Floating marble vanity with a ceramic vessel basin and a backlit round mirror. */
export function Vanity({ length = 1.2, depth = 0.5, basins = 1 }: { length?: number; depth?: number; basins?: number }) {
  const xs = basins === 1 ? [0] : [-length / 4, length / 4]
  return (
    <group>
      <P s={[length, 0.22, depth]} p={[0, 0.74, 0]} m="marbleSlab" rad={0.006} />
      <P s={[length - 0.04, 0.008, depth - 0.04]} p={[0, 0.625, 0]} m="lampGlow" rad={0} shadow={false} />
      {xs.map((x) => (
        <G key={x} p={[x, 0.85, 0.02]}>
          <Cyl rt={0.21} rb={0.16} h={0.13} p={[0, 0.065, 0]} m="ceramic" seg={48} />
          <Cyl rt={0.015} h={0.2} p={[0, 0.25, -depth / 2 + 0.04]} m="brass" seg={12} />
          <P s={[0.025, 0.025, 0.17]} p={[0, 0.34, -depth / 2 + 0.12]} m="brass" rad={0.01} />
          {/* mirror with a warm halo */}
          <mesh position={[0, 0.75, -depth / 2 + 0.035]} rotation={[Math.PI / 2, 0, 0]} material={mat('lampGlow')}>
            <cylinderGeometry args={[0.43, 0.43, 0.01, 64]} />
          </mesh>
          <mesh position={[0, 0.75, -depth / 2 + 0.045]} rotation={[Math.PI / 2, 0, 0]} material={mat('mirror')}>
            <cylinderGeometry args={[0.4, 0.4, 0.012, 64]} />
          </mesh>
        </G>
      ))}
      <P s={[0.5, 0.04, 0.26]} p={[length / 2 - 0.32, 0.87, 0.06]} m="linen" rad={0.015} />
    </group>
  )
}

/** Wall-hung WC with concealed cistern and brass flush plate. */
export function Toilet() {
  return (
    <group>
      <P s={[0.37, 0.3, 0.52]} p={[0, 0.38, 0.02]} m="ceramic" rad={0.12} />
      <P s={[0.38, 0.03, 0.5]} p={[0, 0.545, 0.03]} m="ceramic" rad={0.012} />
      <P s={[0.22, 0.15, 0.01]} p={[0, 1.0, -0.27]} m="brass" rad={0.004} />
    </group>
  )
}

/**
 * Walk-in shower: fixed glass screen on z = 0, shower area behind it (towards -z, `depth` deep)
 * with a ceiling rain head, wall valve, marble bench and linear drain.
 */
export function ShowerScreen({ width = 1.2, depth = 1.8, ceil = 3.3, bench = true }: { width?: number; depth?: number; ceil?: number; bench?: boolean }) {
  return (
    <group>
      <P s={[width, 2.05, 0.012]} p={[0, 1.045, 0]} m="glass" rad={0} shadow={false} />
      <P s={[width, 0.02, 0.03]} p={[0, 2.08, 0]} m="brass" rad={0.004} />
      <P s={[0.02, 0.02, depth * 0.5]} p={[width / 2 - 0.01, 2.08, -depth * 0.25]} m="brass" rad={0.004} />
      <Cyl rt={0.18} h={0.012} p={[0, ceil - 0.04, -depth / 2]} m="brass" seg={48} />
      <Cyl rt={0.012} h={0.03} p={[0, ceil - 0.02, -depth / 2]} m="brass" seg={8} />
      <Cyl rt={0.06} h={0.02} p={[0, 1.1, -depth + 0.01]} r={[Math.PI / 2, 0, 0]} m="brass" />
      <P s={[width - 0.1, 0.012, 0.05]} p={[0, 0.003, -0.25]} m="blackMetal" rad={0} shadow={false} />
      {bench && <P s={[width - 0.04, 0.45, 0.38]} p={[0, 0.225, -depth + 0.19]} m="marbleSlab" rad={0.01} />}
    </group>
  )
}

/** Freestanding oval bathtub in glossy ceramic, length along x. */
export function Bathtub({ length = 1.75, width = 0.85 }: { length?: number; width?: number }) {
  const R = length / 2
  const r = R - 0.06 // inner radius (6 cm wall)
  const ceramic = mat('ceramic')
  return (
    // everything is modelled circular, then squashed to an oval along z
    <group scale={[1, 1, width / length]}>
      {/* rounded bottom + straight sides */}
      <mesh position={[0, 0.25, 0]} scale={[1, 0.25 / R, 1]} material={ceramic} castShadow receiveShadow>
        <sphereGeometry args={[R, 64, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0.42, 0]} material={ceramic} castShadow receiveShadow>
        <cylinderGeometry args={[R, R, 0.34, 64, 1, true]} />
      </mesh>
      {/* rim, inner wall and basin floor */}
      <mesh position={[0, 0.59, 0]} rotation={[-Math.PI / 2, 0, 0]} material={ceramic}>
        <ringGeometry args={[r, R, 64]} />
      </mesh>
      <mesh position={[0, 0.43, 0]} material={innerMaterial()}>
        <cylinderGeometry args={[r, r * 0.92, 0.32, 64, 1, true]} />
      </mesh>
      <mesh position={[0, 0.27, 0]} rotation={[-Math.PI / 2, 0, 0]} material={ceramic}>
        <circleGeometry args={[r * 0.92, 64]} />
      </mesh>
    </group>
  )
}

let inner: THREE.Material | null = null
function innerMaterial() {
  return (inner ??= new THREE.MeshPhysicalMaterial({ color: '#f1efea', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.BackSide }))
}

/** Floor-standing brass tub filler. */
export function TubFiller() {
  return (
    <group>
      <Cyl rt={0.06} h={0.01} p={[0, 0.005, 0]} m="brass" />
      <Cyl rt={0.018} h={0.95} p={[0, 0.48, 0]} m="brass" seg={16} />
      <P s={[0.025, 0.025, 0.26]} p={[0, 0.94, 0.12]} m="brass" rad={0.012} />
      <Cyl rt={0.025} h={0.08} p={[0, 0.75, 0.03]} r={[Math.PI / 2, 0, 0]} m="brass" seg={12} />
    </group>
  )
}
