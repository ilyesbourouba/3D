import { useMemo } from 'react'
import { mulberry32 } from '../materials/noise'
import { Cable, Cyl, G, P, Sphere } from './parts'

/** Solid walnut table on two sculpted travertine pedestals. */
export function DiningTable({ length = 3, depth = 1.1 }: { length?: number; depth?: number }) {
  return (
    <group>
      <P s={[length, 0.05, depth]} p={[0, 0.745, 0]} m="walnutWood" rad={0.012} />
      {[-1, 1].map((s) => (
        <G key={s} p={[s * length * 0.3, 0, 0]}>
          <P s={[0.16, 0.66, depth * 0.62]} p={[0, 0.39, 0]} m="travertineSlab" rad={0.03} />
          <P s={[0.42, 0.06, depth * 0.7]} p={[0, 0.03, 0]} m="travertineSlab" rad={0.02} />
        </G>
      ))}
      {/* centrepiece: ceramic bowl and brass candle holders */}
      <Cyl rt={0.22} rb={0.12} h={0.1} p={[0, 0.82, 0]} m="ceramic" seg={48} />
      {[-0.55, 0.55].map((x) => (
        <G key={x} p={[x, 0.77, 0]}>
          <Cyl rt={0.03} rb={0.045} h={0.18} p={[0, 0.09, 0]} m="brass" />
          <Cyl rt={0.012} h={0.14} p={[0, 0.25, 0]} m="ceramic" seg={12} />
        </G>
      ))}
    </group>
  )
}

/** Upholstered dining chair on slim oak legs, facing +z. */
export function DiningChair({ fabric = 'linen' as 'linen' | 'boucle' }: { fabric?: 'linen' | 'boucle' }) {
  return (
    <group>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => <Cyl key={`${sx}${sz}`} rt={0.016} rb={0.012} h={0.44} p={[sx * 0.2, 0.22, sz * 0.19]} r={[sz * 0.05, 0, -sx * 0.05]} m="oakWood" seg={10} />),
      )}
      <P s={[0.5, 0.09, 0.48]} p={[0, 0.48, 0.01]} m={fabric} rad={0.035} />
      <P s={[0.5, 0.44, 0.07]} p={[0, 0.76, -0.22]} r={[-0.12, 0, 0]} m={fabric} rad={0.03} />
    </group>
  )
}

/** Linear brass pendant hanging from the ceiling, glowing strip underneath. */
export function LinearPendant({ length = 2.2, hang = 2.45, ceil = 3.3 }: { length?: number; hang?: number; ceil?: number }) {
  return (
    <group>
      <P s={[length, 0.045, 0.07]} p={[0, hang, 0]} m="brass" rad={0.012} shadow={false} />
      <P s={[length - 0.05, 0.004, 0.035]} p={[0, hang - 0.024, 0]} m="lampGlow" rad={0} shadow={false} />
      <Cable x={-length * 0.4} y0={hang + 0.02} y1={ceil} />
      <Cable x={length * 0.4} y0={hang + 0.02} y1={ceil} />
      {[-1, 1].map((s) => (
        <Cyl key={s} rt={0.03} h={0.012} p={[s * length * 0.4, ceil - 0.006, 0]} m="brass" shadow={false} />
      ))}
    </group>
  )
}

/** Opal glass globe pendant. */
export function GlobePendant({ hang = 2.1, ceil = 3.3, radius = 0.15 }: { hang?: number; ceil?: number; radius?: number }) {
  return (
    <group>
      <Sphere rad={radius} p={[0, hang, 0]} m="lampGlow" />
      <Cyl rt={0.03} rb={0.04} h={0.05} p={[0, hang + radius + 0.01, 0]} m="brass" shadow={false} />
      <Cable y0={hang + radius + 0.03} y1={ceil} />
      <Cyl rt={0.05} h={0.012} p={[0, ceil - 0.006, 0]} m="brass" shadow={false} />
    </group>
  )
}

/** Sculptural cluster of glowing spheres for the double-height hall. */
export function Chandelier({ ceil = 6.9, lowest = 3.9, spread = 1.1 }: { ceil?: number; lowest?: number; spread?: number }) {
  const drops = useMemo(() => {
    const r = mulberry32(17)
    return Array.from({ length: 13 }, (_, i) => {
      const a = i * 2.4
      const d = Math.sqrt((i + 0.5) / 13) * spread
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, y: lowest + r() * 1.3 + (spread - d) * 0.4, rad: 0.07 + r() * 0.08 }
    })
  }, [lowest, spread])
  return (
    <group>
      {drops.map((d, i) => (
        <group key={i}>
          <Sphere rad={d.rad} p={[d.x, d.y, d.z]} m="lampGlow" seg={24} />
          <Cable x={d.x} z={d.z} y0={d.y + d.rad} y1={ceil - 0.02} />
          <Cyl rt={0.028} h={0.02} p={[d.x, ceil - 0.01, d.z]} m="brass" shadow={false} seg={16} />
        </group>
      ))}
    </group>
  )
}

/** Round breakfast table: walnut top on a brass pedestal. */
export function RoundTable({ radius = 0.55 }: { radius?: number }) {
  return (
    <group>
      <Cyl rt={radius} h={0.04} p={[0, 0.74, 0]} m="walnutWood" seg={64} />
      <Cyl rt={0.05} h={0.7} p={[0, 0.37, 0]} m="brass" />
      <Cyl rt={0.28} rb={0.3} h={0.03} p={[0, 0.015, 0]} m="brass" seg={48} />
      <Cyl rt={0.1} rb={0.07} h={0.16} p={[0.12, 0.84, -0.08]} m="ceramic" />
    </group>
  )
}
