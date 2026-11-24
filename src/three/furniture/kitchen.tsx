import * as THREE from 'three'
import { mat } from '../materials/materials'
import { Cyl, G, P } from './parts'

let lemonMat: THREE.Material | null = null
const lemon = () => (lemonMat ??= new THREE.MeshStandardMaterial({ color: '#e3c13b', roughness: 0.55 }))

/**
 * Kitchen joinery: walnut cabinetry, Calacatta marble worktops, integrated appliances.
 * All pieces centred on their footprint with the front (door side) facing +z.
 */

const DEPTH = 0.62

/** Floor-to-ceiling walnut wall with integrated fridge and stacked ovens. */
export function TallUnit({ length = 3.4, height = 2.6 }: { length?: number; height?: number }) {
  const doors = Math.max(2, Math.round(length / 0.6))
  const w = length / doors
  const ovenCol = Math.floor(doors / 2)
  return (
    <group>
      <P s={[length, 0.1, DEPTH - 0.06]} p={[0, 0.05, -0.03]} m="blackMetal" rad={0} />
      <P s={[length, height - 0.1, DEPTH]} p={[0, 0.1 + (height - 0.1) / 2, 0]} m="walnutWood" rad={0.004} />
      {/* door joints */}
      {Array.from({ length: doors - 1 }, (_, i) => (
        <P key={i} s={[0.006, height - 0.12, 0.004]} p={[-length / 2 + w * (i + 1), 0.1 + (height - 0.1) / 2, DEPTH / 2 + 0.001]} m="blackMetal" rad={0} shadow={false} />
      ))}
      {/* stacked ovens */}
      {[1.05, 1.68].map((y) => (
        <G key={y} p={[-length / 2 + w * (ovenCol + 0.5), y, DEPTH / 2]}>
          <P s={[w - 0.04, 0.58, 0.02]} p={[0, 0, 0.005]} m="darkGlass" rad={0.004} />
          <P s={[w - 0.16, 0.018, 0.03]} p={[0, 0.24, 0.03]} m="brass" rad={0.006} />
        </G>
      ))}
      {/* recessed brass pulls */}
      {Array.from({ length: doors }, (_, i) =>
        i === ovenCol ? null : <P key={i} s={[0.02, 0.5, 0.02]} p={[-length / 2 + w * (i + 0.5) + w / 2 - 0.06, 1.25, DEPTH / 2 + 0.01]} m="brass" rad={0.006} />,
      )}
    </group>
  )
}

/** Base cabinets with marble worktop and backsplash; optional sink and induction hob. */
export function Counter({ length = 4, sinkAt, hobAt, splash = 0.22 }: { length?: number; sinkAt?: number; hobAt?: number; splash?: number }) {
  return (
    <group>
      <P s={[length, 0.1, DEPTH - 0.08]} p={[0, 0.05, -0.04]} m="blackMetal" rad={0} />
      <P s={[length, 0.72, DEPTH - 0.02]} p={[0, 0.46, -0.01]} m="walnutWood" rad={0.004} />
      <P s={[length, 0.012, 0.004]} p={[0, 0.64, DEPTH / 2 - 0.018]} m="blackMetal" rad={0} shadow={false} />
      <P s={[length, 0.04, DEPTH + 0.03]} p={[0, 0.84, 0.015]} m="marbleSlab" rad={0.006} />
      {splash > 0 && <P s={[length, splash, 0.02]} p={[0, 0.86 + splash / 2, -DEPTH / 2 + 0.01]} m="marbleSlab" rad={0} />}
      {sinkAt !== undefined && (
        <G p={[sinkAt, 0.86, 0.02]}>
          <P s={[0.7, 0.004, 0.42]} p={[0, 0.001, 0]} m="blackMetal" rad={0} shadow={false} />
          <Cyl rt={0.016} h={0.32} p={[0, 0.16, -0.24]} m="brass" seg={12} />
          <P s={[0.025, 0.025, 0.2]} p={[0, 0.31, -0.15]} m="brass" rad={0.01} />
        </G>
      )}
      {hobAt !== undefined && <P s={[0.78, 0.006, 0.5]} p={[hobAt, 0.863, 0.02]} m="darkGlass" rad={0.004} shadow={false} />}
    </group>
  )
}

/** Waterfall marble island: storage on the working side (-z), seating overhang on +z. */
export function Island({ length = 3.6, depth = 1.2 }: { length?: number; depth?: number }) {
  const t = 0.05
  return (
    <group>
      <P s={[length, t, depth]} p={[0, 0.92 - t / 2, 0]} m="marbleSlab" rad={0.006} />
      {[-1, 1].map((s) => (
        <P key={s} s={[t, 0.92 - t, depth]} p={[s * (length / 2 - t / 2), (0.92 - t) / 2, 0]} m="marbleSlab" rad={0.004} />
      ))}
      <P s={[length - 2 * t - 0.02, 0.8, 0.62]} p={[0, 0.42, -depth / 2 + 0.33]} m="walnutWood" rad={0.004} />
      <P s={[length - 2 * t - 0.02, 0.08, 0.5]} p={[0, 0.04, -depth / 2 + 0.33]} m="blackMetal" rad={0} />
      {/* bowl of lemons and a cutting board */}
      <Cyl rt={0.2} rb={0.12} h={0.09} p={[0.6, 0.965, 0.1]} m="ceramic" seg={48} />
      {[
        [0.55, 0.06],
        [0.66, 0.12],
        [0.6, 0.16],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.02, z]} material={lemon()} castShadow>
          <sphereGeometry args={[0.045, 16, 12]} />
        </mesh>
      ))}
      <P s={[0.5, 0.025, 0.32]} p={[-0.8, 0.935, -0.2]} r={[0, 0.15, 0]} m="oakWood" rad={0.01} />
    </group>
  )
}

/** Counter stool: leather seat on a slim brass frame. */
export function BarStool() {
  return (
    <group>
      <Cyl rt={0.2} rb={0.18} h={0.07} p={[0, 0.74, 0]} m="leather" seg={40} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4
        return <Cyl key={i} rt={0.011} h={0.74} p={[Math.cos(a) * 0.14, 0.37, Math.sin(a) * 0.14]} r={[Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08]} m="brass" seg={8} />
      })}
      <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat('brass')} castShadow>
        <torusGeometry args={[0.16, 0.009, 8, 40]} />
      </mesh>
    </group>
  )
}
