import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mat } from '../materials/materials'
import { buildInterior } from './buildInterior'

/** Recessed downlight: dark trim ring + glowing lens, facing down (instanced). */
function Downlights({ points }: { points: THREE.Vector3[] }) {
  const trim = useRef<THREE.InstancedMesh>(null)
  const lens = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(() => {
    const ring = new THREE.RingGeometry(0.038, 0.058, 24).rotateX(Math.PI / 2)
    const disc = new THREE.CircleGeometry(0.038, 24).rotateX(Math.PI / 2)
    return { ring, disc }
  }, [])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    points.forEach((p, i) => {
      m.makeTranslation(p.x, p.y, p.z)
      trim.current!.setMatrixAt(i, m)
      m.makeTranslation(p.x, p.y + 0.0015, p.z)
      lens.current!.setMatrixAt(i, m)
    })
    trim.current!.instanceMatrix.needsUpdate = true
    lens.current!.instanceMatrix.needsUpdate = true
    trim.current!.computeBoundingSphere()
    lens.current!.computeBoundingSphere()
  }, [points])
  return (
    <>
      <instancedMesh ref={trim} args={[geo.ring, mat('frame'), points.length]} />
      <instancedMesh ref={lens} args={[geo.disc, mat('led'), points.length]} />
    </>
  )
}

/** Interior architecture layer: doors, skirting, feature walls, ceilings, skylight. */
export function InteriorShell() {
  const { geometries, downlights } = useMemo(buildInterior, [])
  return (
    <group>
      {[...geometries.entries()].map(([key, g]) => (
        <mesh key={key} geometry={g} material={mat(key)} castShadow={key !== 'glass' && key !== 'led'} receiveShadow={key !== 'led'} renderOrder={key === 'glass' ? 2 : 0} />
      ))}
      <Downlights points={downlights} />
    </group>
  )
}
