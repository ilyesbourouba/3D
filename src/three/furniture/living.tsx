import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mat } from '../materials/materials'
import { oliveGeometry } from '../exterior/vegetationGeometry'
import { artTexture, type ArtVariant } from './artTextures'
import { Cyl, G, P, Sphere } from './parts'

/* ------------------------------------------------------------------ sofa */

/** Low modular sofa in bouclé with deep seat and loose back cushions. */
export function Sofa({ length = 3.4, depth = 1.05, arms = true }: { length?: number; depth?: number; arms?: boolean }) {
  const n = Math.max(1, Math.round(length / 1.05))
  const inner = length - (arms ? 0.36 : 0.04)
  const w = inner / n
  return (
    <group>
      <P s={[length - 0.12, 0.07, depth - 0.12]} p={[0, 0.035, 0]} m="blackMetal" rad={0} />
      <P s={[length, 0.26, depth]} p={[0, 0.2, 0]} m="boucle" rad={0.05} />
      <P s={[length, 0.44, 0.2]} p={[0, 0.55, -depth / 2 + 0.1]} m="boucle" rad={0.06} />
      {arms &&
        [-1, 1].map((s) => <P key={s} s={[0.18, 0.3, depth]} p={[s * (length / 2 - 0.09), 0.48, 0]} m="boucle" rad={0.07} />)}
      {Array.from({ length: n }, (_, i) => {
        const x = -inner / 2 + w * (i + 0.5)
        return (
          <G key={i} p={[x, 0, 0]}>
            <P s={[w - 0.015, 0.16, depth - 0.3]} p={[0, 0.41, 0.12]} m="boucle" rad={0.07} />
            <P s={[w - 0.03, 0.5, 0.22]} p={[0, 0.66, -depth / 2 + 0.28]} r={[-0.16, 0, 0]} m="boucle" rad={0.1} />
          </G>
        )
      })}
      {/* scatter cushions */}
      <P s={[0.48, 0.44, 0.15]} p={[-length / 2 + 0.55, 0.72, -depth / 2 + 0.45]} r={[-0.25, 0.25, 0.05]} m="velvet" rad={0.07} />
      <P s={[0.44, 0.4, 0.14]} p={[length / 2 - 0.6, 0.7, -depth / 2 + 0.45]} r={[-0.25, -0.2, -0.04]} m="linen" rad={0.07} />
    </group>
  )
}

/** Backless chaise module completing an L-shaped sofa. */
export function Chaise({ width = 1.6, depth = 1.0 }: { width?: number; depth?: number }) {
  return (
    <group>
      <P s={[width - 0.12, 0.07, depth - 0.12]} p={[0, 0.035, 0]} m="blackMetal" rad={0} />
      <P s={[width, 0.26, depth]} p={[0, 0.2, 0]} m="boucle" rad={0.05} />
      <P s={[width - 0.03, 0.16, depth - 0.03]} p={[0, 0.41, 0]} m="boucle" rad={0.07} />
      <P s={[0.5, 0.09, 0.4]} p={[0.2, 0.53, 0.1]} r={[0, 0.4, 0]} m="linen" rad={0.03} />
    </group>
  )
}

/** Cognac leather lounge chair on a walnut frame. */
export function Armchair() {
  return (
    <group>
      {[-1, 1].map((s) => (
        <G key={s} p={[s * 0.4, 0, 0]}>
          <P s={[0.05, 0.05, 0.78]} p={[0, 0.025, 0]} m="walnutWood" rad={0.012} />
          <P s={[0.05, 0.5, 0.05]} p={[0, 0.27, 0.3]} m="walnutWood" rad={0.012} />
          <P s={[0.05, 0.62, 0.05]} p={[0, 0.33, -0.3]} r={[-0.15, 0, 0]} m="walnutWood" rad={0.012} />
          <P s={[0.07, 0.04, 0.72]} p={[0, 0.55, 0.0]} m="walnutWood" rad={0.015} />
        </G>
      ))}
      <P s={[0.74, 0.15, 0.68]} p={[0, 0.33, 0.04]} r={[-0.06, 0, 0]} m="leather" rad={0.06} />
      <P s={[0.74, 0.62, 0.15]} p={[0, 0.66, -0.3]} r={[-0.24, 0, 0]} m="leather" rad={0.07} />
    </group>
  )
}

/** Pair of nested travertine drums with a few objects. */
export function CoffeeTable() {
  return (
    <group>
      <Cyl rt={0.6} h={0.34} p={[-0.18, 0.17, 0]} m="travertineSlab" seg={64} />
      <Cyl rt={0.4} h={0.42} p={[0.45, 0.21, 0.22]} m="travertineSlab" seg={64} />
      <P s={[0.32, 0.05, 0.24]} p={[-0.3, 0.365, -0.1]} r={[0, 0.3, 0]} m="linen" rad={0.005} />
      <P s={[0.28, 0.04, 0.21]} p={[-0.3, 0.41, -0.1]} r={[0, 0.2, 0]} m="walnutWood" rad={0.005} />
      <Cyl rt={0.11} rb={0.06} h={0.08} p={[0.45, 0.46, 0.22]} m="ceramic" />
      <Sphere rad={0.05} p={[0.08, 0.39, 0.18]} m="brass" shadow />
    </group>
  )
}

export function SideTable() {
  return (
    <group>
      <Cyl rt={0.24} h={0.025} p={[0, 0.54, 0]} m="marbleSlab" />
      <Cyl rt={0.05} rb={0.07} h={0.52} p={[0, 0.27, 0]} m="brass" />
      <Cyl rt={0.18} h={0.02} p={[0, 0.01, 0]} m="brass" />
      <Cyl rt={0.07} rb={0.05} h={0.22} p={[0.05, 0.66, 0.02]} m="ceramic" />
    </group>
  )
}

/** Arc floor lamp: marble base, brass arc, dome shade glowing underneath. Arcs towards +z. */
export function ArcLamp({ reach = 1.5 }: { reach?: number }) {
  const tube = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.05, 0),
      new THREE.Vector3(0, 1.4, 0),
      new THREE.Vector3(0, 2.05, reach * 0.35),
      new THREE.Vector3(0, 2.05, reach * 0.8),
      new THREE.Vector3(0, 1.88, reach),
    ])
    return new THREE.TubeGeometry(curve, 64, 0.012, 8, false)
  }, [reach])
  return (
    <group>
      <Cyl rt={0.17} h={0.06} p={[0, 0.03, 0]} m="marbleSlab" />
      <mesh geometry={tube} material={mat('brass')} castShadow />
      <mesh position={[0, 1.82, reach]} material={mat('brass')} castShadow>
        <sphereGeometry args={[0.22, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 1.821, reach]} rotation={[Math.PI / 2, 0, 0]} material={mat('lampGlow')}>
        <circleGeometry args={[0.2, 32]} />
      </mesh>
    </group>
  )
}

export function Rug({ w = 3, d = 2 }: { w?: number; d?: number }) {
  return <P s={[w, 0.012, d]} p={[0, 0.006, 0]} m="rug" rad={0.004} shadow={false} />
}

/* -------------------------------------------------------------- fireplace */

const flameVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const flameFragment = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
void main() {
  vec2 uv = vUv;
  float n = noise(vec2(uv.x * 14.0, uv.y * 3.0 - uTime * 2.2)) * 0.6 + noise(vec2(uv.x * 30.0, uv.y * 6.0 - uTime * 3.4)) * 0.4;
  float tongues = 0.55 + 0.45 * sin(uv.x * 40.0 + n * 4.0);
  float h = uv.y + n * 0.45 - 0.08;
  float flame = smoothstep(0.85, 0.15, h) * tongues;
  flame *= smoothstep(0.0, 0.06, uv.x) * smoothstep(1.0, 0.94, uv.x);
  vec3 col = mix(vec3(1.0, 0.28, 0.04), vec3(1.0, 0.78, 0.35), smoothstep(0.2, 0.9, flame));
  gl_FragColor = vec4(col * flame * 3.2, flame);
}
`

/** Linear gas fireplace set into a floating travertine bench. Bench footprint centred. */
export function Fireplace({ length = 5.4 }: { length?: number }) {
  const flame = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: flameVertex,
        fragmentShader: flameFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  const light = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    flame.uniforms.uTime.value = t
    if (light.current) light.current.intensity = 2.2 + Math.sin(t * 7.3) * 0.25 + Math.sin(t * 13.1) * 0.15
  })
  const d = 0.5
  return (
    <group>
      {/* floating bench */}
      <P s={[length, 0.36, d]} p={[0, 0.25, 0]} m="travertineSlab" rad={0.01} />
      {/* firebox: steel surround with a glass front, flames and an ember bed */}
      <P s={[2.5, 0.1, 0.14]} p={[0, 1.0, 0.02]} m="blackMetal" rad={0.004} />
      <P s={[2.5, 0.1, 0.14]} p={[0, 0.48, 0.02]} m="blackMetal" rad={0.004} />
      {[-1, 1].map((s) => (
        <P key={s} s={[0.15, 0.62, 0.14]} p={[s * 1.175, 0.74, 0.02]} m="blackMetal" rad={0.004} />
      ))}
      <P s={[2.3, 0.5, 0.18]} p={[0, 0.74, -0.14]} m="darkGlass" rad={0} shadow={false} />
      <P s={[2.2, 0.03, 0.08]} p={[0, 0.545, -0.03]} m="lampGlow" rad={0} shadow={false} />
      <mesh position={[0, 0.76, -0.03]} material={flame}>
        <planeGeometry args={[2.2, 0.42]} />
      </mesh>
      <pointLight ref={light} position={[0, 0.8, 0.5]} color="#ff9a4a" intensity={2.2} distance={4.5} decay={1.6} />
      {/* objects on the bench */}
      <Cyl rt={0.09} rb={0.12} h={0.36} p={[length / 2 - 0.5, 0.61, 0]} m="ceramic" />
      <Cyl rt={0.06} rb={0.08} h={0.24} p={[length / 2 - 0.75, 0.55, 0.05]} m="leather" />
      <P s={[0.45, 0.22, 0.33]} p={[-length / 2 + 0.6, 0.54, 0]} m="walnutWood" rad={0.02} />
    </group>
  )
}

/* ---------------------------------------------------------------- artwork */

/** Frameless canvas, back on z = 0, painted face towards +z. */
export function Artwork({ w = 1.2, h = 1.5, variant = 'fields' as ArtVariant }: { w?: number; h?: number; variant?: ArtVariant }) {
  const mats = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({ color: '#e9e3d8', roughness: 0.9 })
    const face = new THREE.MeshStandardMaterial({ map: artTexture(variant), roughness: 0.85 })
    return [side, side, side, side, face, side]
  }, [variant])
  return (
    <mesh position={[0, 0, 0.02]} material={mats} castShadow receiveShadow>
      <boxGeometry args={[w, h, 0.04]} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ plant */

let olive: ReturnType<typeof oliveGeometry> | null = null

/** Indoor olive tree in a large stone planter. */
export function Plant({ scale = 0.42 }: { scale?: number }) {
  olive ??= oliveGeometry(3, 2)
  return (
    <group>
      <Cyl rt={0.34} rb={0.28} h={0.52} p={[0, 0.26, 0]} m="travertineSlab" seg={40} />
      <Cyl rt={0.31} h={0.02} p={[0, 0.51, 0]} m="blackMetal" seg={40} />
      {/* indoor trees are pruned narrower than garden olives so canopies stay clear of walls */}
      <group position={[0, 0.5, 0]} scale={[scale * 0.6, scale, scale * 0.6]}>
        <mesh geometry={olive.trunk} material={mat('bark')} castShadow />
        <mesh geometry={olive.canopy} material={mat('foliageOlive')} castShadow />
      </group>
    </group>
  )
}
