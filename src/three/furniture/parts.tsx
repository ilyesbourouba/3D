import { RoundedBox } from '@react-three/drei'
import type { ReactNode } from 'react'
import { mat, type AnyKey } from '../materials/materials'

/**
 * Small building blocks for furniture. Every piece is authored in its own local frame:
 * centred on the origin in plan, standing on y = 0, with its front facing +z.
 */

export type V3 = [number, number, number]

interface PartProps {
  /** Size [w, h, d]. */
  s: V3
  /** Centre position. */
  p: V3
  m: AnyKey
  r?: V3
  /** Edge radius (rounded box); 0 = sharp box. */
  rad?: number
  shadow?: boolean
}

/** Box or rounded box. */
export function P({ s, p, m, r, rad = 0.008, shadow = true }: PartProps) {
  if (rad <= 0)
    return (
      <mesh position={p} rotation={r} material={mat(m)} castShadow={shadow} receiveShadow>
        <boxGeometry args={s} />
      </mesh>
    )
  const radius = Math.min(rad, Math.min(...s) / 2 - 0.0005)
  return <RoundedBox args={s} radius={radius} smoothness={2} position={p} rotation={r} material={mat(m)} castShadow={shadow} receiveShadow />
}

/** Cylinder (vertical by default). */
export function Cyl({ rt, rb = rt, h, p, m, r, seg = 32, shadow = true }: { rt: number; rb?: number; h: number; p: V3; m: AnyKey; r?: V3; seg?: number; shadow?: boolean }) {
  return (
    <mesh position={p} rotation={r} material={mat(m)} castShadow={shadow} receiveShadow>
      <cylinderGeometry args={[rt, rb, h, seg]} />
    </mesh>
  )
}

export function Sphere({ rad, p, m, seg = 32, shadow = false }: { rad: number; p: V3; m: AnyKey; seg?: number; shadow?: boolean }) {
  return (
    <mesh position={p} material={mat(m)} castShadow={shadow}>
      <sphereGeometry args={[rad, seg, Math.round(seg * 0.75)]} />
    </mesh>
  )
}

/** Group placed in the parent's frame. */
export function G({ p = [0, 0, 0], r = 0, children }: { p?: V3; r?: number; children: ReactNode }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      {children}
    </group>
  )
}

/** Thin suspension cable from y0 up to y1. */
export function Cable({ x = 0, z = 0, y0, y1 }: { x?: number; z?: number; y0: number; y1: number }) {
  return <Cyl rt={0.003} h={y1 - y0} p={[x, (y0 + y1) / 2, z]} m="blackMetal" seg={6} shadow={false} />
}
