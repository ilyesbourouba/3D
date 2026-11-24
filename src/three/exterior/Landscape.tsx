import { useMemo } from 'react'
import * as THREE from 'three'
import { mat } from '../materials/materials'
import { smoothstep, vnoise } from '../materials/noise'
import { GeometryBuckets } from '../architecture/GeometryBuckets'

/**
 * The site: a flat landscaped garden around the villa inside a continuous coastal terrain —
 * hills rising inland (north) and the land falling away to the sea in the south.
 */

export const GROUND_Y = -0.06
const SEA_Y = -14
const SIZE = 1600
const SEGMENTS = 240

const noise = (x: number, z: number, scale: number, seed: number) => vnoise(x / scale, z / scale, 1 << 20, 1 << 20, seed)

/** Terrain height at a world position (flat inside the garden). */
export function terrainHeight(x: number, z: number) {
  const d = Math.hypot(x, z - 4)
  const outside = smoothstep(48, 90, d)
  if (outside <= 0) return GROUND_Y
  const inland = 1 - smoothstep(30, 150, z)
  const n = noise(x, z, 120, 1) * 0.6 + noise(x, z, 45, 2) * 0.3 + noise(x, z, 16, 3) * 0.1
  let h = (n - 0.45) * 14 * outside
  h += inland * smoothstep(80, 650, d) * 120 * (0.55 + 0.45 * noise(x, z, 260, 4))
  h -= smoothstep(55, 190, z) * 34 * outside
  return GROUND_Y + h
}

function terrainGeometry() {
  const g = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS)
  g.rotateX(-Math.PI / 2)
  const pos = g.attributes.position
  const uv = g.attributes.uv as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    pos.setY(i, terrainHeight(x, z))
    uv.setXY(i, x, z)
  }
  g.computeVertexNormals()
  const nor = g.attributes.normal
  const colors = new Float32Array(pos.count * 3)
  // linear-space tints multiplied with the neutral grass texture
  const lawn = new THREE.Color(0.36, 0.5, 0.2)
  const dry = new THREE.Color(0.6, 0.56, 0.33)
  const scrub = new THREE.Color(0.3, 0.37, 0.2)
  const rock = new THREE.Color(0.62, 0.56, 0.46)
  const sand = new THREE.Color(0.8, 0.72, 0.56)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const d = Math.hypot(x, z - 4)
    const slope = 1 - nor.getY(i)
    const garden = 1 - smoothstep(33, 50, d)
    const patch = noise(x, z, 30, 7)
    c.copy(dry).lerp(scrub, smoothstep(0.35, 0.7, patch))
    c.lerp(rock, smoothstep(0.06, 0.22, slope))
    c.lerp(sand, 1 - smoothstep(SEA_Y + 0.5, SEA_Y + 3, y))
    c.lerp(lawn, garden)
    const k = 0.86 + 0.24 * noise(x, z, 9, 8)
    colors[i * 3] = c.r * k
    colors[i * 3 + 1] = c.g * k
    colors[i * 3 + 2] = c.b * k
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return g
}

function hardscape() {
  const b = new GeometryBuckets<'gravel' | 'paving' | 'stone' | 'travertine'>()
  const all = (k: 'paving') => ({ py: k, px: k, nx: k, pz: k, nz: k })
  // gravel driveway to the carport
  b.box([4.6, GROUND_Y - 0.1, -44], [11, GROUND_Y + 0.025, -7.3], { py: 'gravel' })
  // stepping stones from the driveway to the front door
  for (let i = 0; i < 6; i++) {
    const z = -10.1 - i * 0.95
    b.box([0.4, GROUND_Y - 0.1, z - 0.32], [2.4, GROUND_Y + 0.04, z + 0.32], all('paving'))
  }
  b.box([0.4, GROUND_Y - 0.1, -15.6], [4.6, GROUND_Y + 0.04, -14.2], all('paving'))
  // forecourt planter for the olive tree
  b.box([-2.3, GROUND_Y, -12.5], [-0.5, 0.45, -10.7], { py: 'gravel', px: 'stone', nx: 'stone', pz: 'stone', nz: 'stone' })
  // garden path from the pool deck towards the sea view
  for (let i = 0; i < 7; i++) {
    const z = 19.7 + i * 1.0
    b.box([1, GROUND_Y - 0.1, z], [3, GROUND_Y + 0.035, z + 0.6], all('paving'))
  }
  return [...b.build().entries()]
}

export function Landscape() {
  const terrain = useMemo(terrainGeometry, [])
  const hard = useMemo(hardscape, [])

  return (
    <group>
      <mesh geometry={terrain} material={mat('grass')} receiveShadow />
      <mesh rotation-x={-Math.PI / 2} position={[0, SEA_Y, 0]} material={mat('sea')}>
        <circleGeometry args={[4000, 64]} />
      </mesh>
      {hard.map(([key, g]) => (
        <mesh key={key} geometry={g} material={mat(key)} receiveShadow castShadow={key === 'stone'} />
      ))}
    </group>
  )
}
