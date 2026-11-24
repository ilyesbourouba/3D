import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mulberry32 } from '../materials/noise'
import { Cyl, G, P } from './parts'

/** Walnut slab desk on black steel sled legs; the user sits on the +z side. */
export function Desk({ length = 2, depth = 0.85 }: { length?: number; depth?: number }) {
  return (
    <group>
      <P s={[length, 0.045, depth]} p={[0, 0.745, 0]} m="walnutWood" rad={0.01} />
      {[-1, 1].map((s) => (
        <G key={s} p={[s * (length / 2 - 0.12), 0, 0]}>
          <P s={[0.03, 0.72, 0.03]} p={[0, 0.36, -depth / 2 + 0.08]} m="blackMetal" rad={0.004} />
          <P s={[0.03, 0.72, 0.03]} p={[0, 0.36, depth / 2 - 0.08]} m="blackMetal" rad={0.004} />
          <P s={[0.03, 0.03, depth - 0.12]} p={[0, 0.015, 0]} m="blackMetal" rad={0.004} />
          <P s={[0.03, 0.03, depth - 0.12]} p={[0, 0.705, 0]} m="blackMetal" rad={0.004} />
        </G>
      ))}
      {/* leather pad, closed laptop, books, task lamp */}
      <P s={[0.9, 0.004, 0.5]} p={[0, 0.77, 0.08]} m="leather" rad={0.002} shadow={false} />
      <P s={[0.34, 0.016, 0.24]} p={[0.05, 0.78, 0.05]} m="chrome" rad={0.006} />
      <P s={[0.24, 0.06, 0.18]} p={[-0.7, 0.8, -0.2]} r={[0, 0.2, 0]} m="linen" rad={0.004} />
      <P s={[0.22, 0.04, 0.16]} p={[-0.7, 0.85, -0.2]} r={[0, 0.05, 0]} m="leather" rad={0.004} />
      <G p={[0.75, 0.77, -0.25]}>
        <Cyl rt={0.08} h={0.02} p={[0, 0.01, 0]} m="brass" />
        <Cyl rt={0.008} h={0.45} p={[0, 0.235, 0]} m="brass" seg={8} />
        <Cyl rt={0.05} rb={0.09} h={0.12} p={[0, 0.48, 0.04]} r={[0.4, 0, 0]} m="brass" />
      </G>
    </group>
  )
}

/** Leather office chair on a polished five-star base, facing +z. */
export function OfficeChair() {
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return <P key={i} s={[0.32, 0.025, 0.04]} p={[Math.cos(a) * 0.16, 0.05, Math.sin(a) * 0.16]} r={[0, -a, 0]} m="chrome" rad={0.008} />
      })}
      <Cyl rt={0.025} h={0.36} p={[0, 0.24, 0]} m="chrome" seg={12} />
      <P s={[0.52, 0.09, 0.5]} p={[0, 0.47, 0.02]} m="leather" rad={0.04} />
      <P s={[0.5, 0.56, 0.08]} p={[0, 0.82, -0.23]} r={[-0.12, 0, 0]} m="leather" rad={0.04} />
      {[-1, 1].map((s) => (
        <P key={s} s={[0.04, 0.03, 0.34]} p={[s * 0.28, 0.66, 0.0]} m="chrome" rad={0.01} />
      ))}
    </group>
  )
}

const BOOK_COLORS = ['#7a3f2c', '#c9b79a', '#2f3b36', '#a2836a', '#e3dccf', '#5e6e63', '#b5643f', '#3d3a35', '#d7a66d', '#8a8c86']

/**
 * Built-in walnut bookcase with instanced books (one draw call for all books).
 * Front faces +z.
 */
export function Bookcase({ length = 3.2, height = 2.6, depth = 0.38 }: { length?: number; height?: number; depth?: number }) {
  const bays = Math.max(1, Math.round(length / 0.8))
  const shelves = 6
  const bw = length / bays
  const sh = height / shelves
  const books = useMemo(() => {
    const r = mulberry32(31)
    const out: { x: number; y: number; w: number; h: number; d: number; c: string; lean: number }[] = []
    for (let b = 0; b < bays; b++)
      for (let s = 0; s < shelves; s++) {
        if (r() < 0.22) continue // leave some bays for objects / breathing room
        const x0 = -length / 2 + b * bw + 0.03
        const span = (bw - 0.06) * (0.55 + r() * 0.4)
        let x = x0 + (r() < 0.5 ? 0 : bw - 0.06 - span)
        const end = x + span
        while (x < end - 0.03) {
          const w = 0.025 + r() * 0.03
          const h = sh * (0.55 + r() * 0.3)
          out.push({ x: x + w / 2, y: s * sh + 0.025 + h / 2, w, h, d: depth * (0.6 + r() * 0.25), c: BOOK_COLORS[Math.floor(r() * BOOK_COLORS.length)], lean: 0 })
          x += w + 0.002
        }
      }
    return out
  }, [length, bays, bw, sh, depth])
  const ref = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const bookMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.85 }), [])
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const mtx = new THREE.Matrix4()
    const col = new THREE.Color()
    books.forEach((b, i) => {
      mtx.compose(new THREE.Vector3(b.x, b.y, -depth / 2 + b.d / 2 + 0.01), new THREE.Quaternion(), new THREE.Vector3(b.w, b.h, b.d))
      m.setMatrixAt(i, mtx)
      m.setColorAt(i, col.set(b.c))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [books, depth])
  const t = 0.025
  return (
    <group>
      <P s={[length, height, 0.02]} p={[0, height / 2, -depth / 2 + 0.01]} m="walnutWood" rad={0} />
      {Array.from({ length: bays + 1 }, (_, i) => (
        <P key={`v${i}`} s={[t, height, depth]} p={[-length / 2 + i * bw, height / 2, 0]} m="walnutWood" rad={0.003} />
      ))}
      {Array.from({ length: shelves + 1 }, (_, i) => (
        <P key={`h${i}`} s={[length, t, depth]} p={[0, Math.min(height - t / 2, i * sh + t / 2), 0]} m="walnutWood" rad={0.003} />
      ))}
      <instancedMesh ref={ref} args={[geo, bookMat, books.length]} castShadow receiveShadow />
      {/* a few objects in the empty bays */}
      <Cyl rt={0.07} rb={0.1} h={0.26} p={[-length / 2 + bw * 0.5, sh * 3 + 0.155, 0]} m="ceramic" />
      <Cyl rt={0.09} h={0.05} p={[length / 2 - bw * 0.5, sh * 1 + 0.05, 0]} m="brass" />
    </group>
  )
}

/** Hall console: thin walnut top on brass legs, vase with dried branches and books. */
export function Console({ length = 1.8, depth = 0.38 }: { length?: number; depth?: number }) {
  const branches = useMemo(() => {
    const r = mulberry32(7)
    return Array.from({ length: 7 }, () => ({ a: r() * 6.28, tilt: 0.15 + r() * 0.3, h: 0.6 + r() * 0.4 }))
  }, [])
  return (
    <group>
      <P s={[length, 0.035, depth]} p={[0, 0.8, 0]} m="walnutWood" rad={0.008} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Cyl key={`${sx}${sz}`} rt={0.012} h={0.78} p={[sx * (length / 2 - 0.06), 0.39, sz * (depth / 2 - 0.05)]} m="brass" seg={10} />))}
      <P s={[length - 0.1, 0.012, depth - 0.08]} p={[0, 0.25, 0]} m="brass" rad={0.004} />
      <G p={[-length / 2 + 0.4, 0.817, 0]}>
        <Cyl rt={0.07} rb={0.13} h={0.36} p={[0, 0.18, 0]} m="ceramic" />
        {branches.map((b, i) => (
          <Cyl key={i} rt={0.003} rb={0.006} h={b.h} p={[Math.cos(b.a) * b.tilt * b.h * 0.5, 0.36 + (b.h / 2) * Math.cos(b.tilt), Math.sin(b.a) * b.tilt * b.h * 0.5]} r={[Math.sin(b.a) * b.tilt, 0, -Math.cos(b.a) * b.tilt]} m="bark" seg={5} />
        ))}
      </G>
      <P s={[0.3, 0.05, 0.22]} p={[length / 2 - 0.4, 0.843, 0]} m="linen" rad={0.004} />
      <P s={[0.27, 0.04, 0.2]} p={[length / 2 - 0.4, 0.888, 0]} r={[0, 0.12, 0]} m="leather" rad={0.004} />
    </group>
  )
}
