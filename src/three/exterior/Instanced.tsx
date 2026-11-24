import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

export interface InstanceItem {
  p: [number, number, number]
  s: [number, number, number]
  r?: number
}

/** Renders many copies of one geometry in a single draw call. */
export function Instanced({
  geometry,
  material,
  items,
  castShadow = true,
  receiveShadow = true,
}: {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  items: InstanceItem[]
  castShadow?: boolean
  receiveShadow?: boolean
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    items.forEach((it, i) => {
      q.setFromEuler(e.set(0, it.r ?? 0, 0))
      m.compose(new THREE.Vector3(...it.p), q, new THREE.Vector3(...it.s))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow={receiveShadow} />
}
