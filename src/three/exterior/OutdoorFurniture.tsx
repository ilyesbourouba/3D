import { RoundedBox } from '@react-three/drei'
import { MergedStatic } from '../furniture/MergedStatic'
import { shrubGeometry } from './vegetationGeometry'
import type { ReactNode } from 'react'
import { mat } from '../materials/materials'

/** Outdoor furniture: pool loungers, parasols, terrace lounge and dining set. */

type V3 = [number, number, number]

function Part({ size, position, material, rotation, radius = 0.02 }: { size: V3; position: V3; material: Parameters<typeof mat>[0]; rotation?: V3; radius?: number }) {
  return (
    <RoundedBox args={size} radius={radius} smoothness={2} position={position} rotation={rotation} material={mat(material)} castShadow receiveShadow />
  )
}

function Group({ position, rotation = 0, children }: { position: V3; rotation?: number; children: ReactNode }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {children}
    </group>
  )
}

/** Teak sun lounger with an inclined back cushion. Head at local -z. */
function Lounger({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  return (
    <Group position={position} rotation={rotation}>
      <Part size={[0.74, 0.08, 2.0]} position={[0, 0.3, 0]} material="teak" />
      {[-0.32, 0.32].flatMap((x) => [-0.88, 0.88].map((z) => <Part key={`${x}${z}`} size={[0.06, 0.28, 0.06]} position={[x, 0.13, z]} material="teak" radius={0.01} />))}
      <Part size={[0.7, 0.09, 1.3]} position={[0, 0.385, 0.32]} material="fabric" radius={0.04} />
      <Part size={[0.7, 0.09, 0.72]} position={[0, 0.58, -0.58]} rotation={[0.62, 0, 0]} material="fabric" radius={0.04} />
      <Part size={[0.74, 0.05, 0.7]} position={[0, 0.5, -0.62]} rotation={[0.62, 0, 0]} material="teak" />
    </Group>
  )
}

function Parasol({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} material={mat('planter')} castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.38, 0.12, 24]} />
      </mesh>
      <mesh position={[0, 1.3, 0]} material={mat('teak')} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 2.5, 10]} />
      </mesh>
      <mesh position={[0, 2.45, 0]} material={mat('fabric')} castShadow receiveShadow>
        <coneGeometry args={[1.5, 0.42, 8, 1, true]} />
      </mesh>
    </group>
  )
}

/** Low modular outdoor sofa (L-shape) with a travertine coffee table. */
function OutdoorLounge({ position }: { position: V3 }) {
  const seat = (x: number, z: number, w: number, d: number, backSide: 'n' | 'w') => (
    <group key={`${x}${z}`} position={[x, 0, z]}>
      <Part size={[w, 0.24, d]} position={[0, 0.12, 0]} material="teak" />
      <Part size={[w - 0.04, 0.16, d - 0.04]} position={[0, 0.32, 0]} material="fabric" radius={0.06} />
      {backSide === 'n' ? (
        <Part size={[w - 0.04, 0.42, 0.2]} position={[0, 0.55, -d / 2 + 0.12]} material="fabric" radius={0.08} />
      ) : (
        <Part size={[0.2, 0.42, d - 0.04]} position={[-w / 2 + 0.12, 0.55, 0]} material="fabric" radius={0.08} />
      )}
    </group>
  )
  return (
    <group position={position}>
      {seat(-1.2, 0, 0.95, 0.95, 'w')}
      {seat(-0.2, -0.0, 0.95, 0.95, 'n')}
      {seat(0.8, 0, 0.95, 0.95, 'n')}
      {seat(-1.2, 0.98, 0.95, 0.95, 'w')}
      <Part size={[1.2, 0.34, 0.8]} position={[0.3, 0.17, 1.15]} material="travertine" radius={0.03} />
      {/* scatter cushions */}
      <Part size={[0.45, 0.4, 0.14]} position={[0.55, 0.6, -0.25]} rotation={[-0.2, 0.15, 0]} material="fabricDark" radius={0.06} />
      <Part size={[0.14, 0.4, 0.45]} position={[-1.45, 0.6, 0.7]} rotation={[0, 0, 0.2]} material="fabricDark" radius={0.06} />
    </group>
  )
}

function DiningSet({ position }: { position: V3 }) {
  const chairs: [number, number, number][] = [
    [-0.9, -0.75, 0], [0, -0.75, 0], [0.9, -0.75, 0],
    [-0.9, 0.75, Math.PI], [0, 0.75, Math.PI], [0.9, 0.75, Math.PI],
  ]
  return (
    <group position={position}>
      <Part size={[2.6, 0.05, 1.0]} position={[0, 0.74, 0]} material="teak" />
      {[-1.1, 1.1].map((x) => (
        <Part key={x} size={[0.08, 0.72, 0.8]} position={[x, 0.36, 0]} material="frame" radius={0.01} />
      ))}
      {chairs.map(([x, z, r]) => (
        <Group key={`${x}${z}`} position={[x, 0, z]} rotation={r}>
          <Part size={[0.5, 0.06, 0.5]} position={[0, 0.45, 0]} material="teak" />
          <Part size={[0.46, 0.05, 0.44]} position={[0, 0.5, 0]} material="fabric" radius={0.02} />
          <Part size={[0.5, 0.42, 0.04]} position={[0, 0.72, -0.24]} material="teak" />
          {[-0.22, 0.22].flatMap((cx) => [-0.22, 0.22].map((cz) => <Part key={`${cx}${cz}`} size={[0.035, 0.44, 0.035]} position={[cx, 0.22, cz]} material="frame" radius={0.005} />))}
        </Group>
      ))}
    </group>
  )
}

let shrubGeo: ReturnType<typeof shrubGeometry> | null = null
const shrub = () => (shrubGeo ??= shrubGeometry())

function Planter({ position, scale = 1 }: { position: V3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.4, 0]} material={mat('planter')} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.36, 0.8, 32]} />
      </mesh>
      <mesh geometry={shrub()} position={[0, 1.0, 0]} material={mat('foliageHedge')} castShadow scale={[1.05, 0.85, 1.05]} />
    </group>
  )
}

export function OutdoorFurniture() {
  return (
    <MergedStatic>
      {/* pool deck — west side */}
      {[-10.6, -9.0, -7.4].map((x) => (
        <Lounger key={x} position={[x, 0, 13.6]} />
      ))}
      <Parasol position={[-5.6, 0, 12.4]} />
      {/* pool deck — east side */}
      {[9.4, 11.0].map((x) => (
        <Lounger key={x} position={[x, 0, 13.6]} />
      ))}
      {/* covered terrace */}
      <OutdoorLounge position={[-8.2, 0, 8.0]} />
      <DiningSet position={[7.2, 0, 8.6]} />
      <Planter position={[-3.4, 0, 9.4]} />
      <Planter position={[3.6, 0, 9.4]} scale={0.9} />
      <Planter position={[2.9, 0, -8.6]} scale={1.1} />
    </MergedStatic>
  )
}
