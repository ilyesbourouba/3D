import { useEffect, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Draw-call optimiser for static furniture. Children are authored as many small parts (easy to
 * read and edit); once mounted, every eligible mesh is baked into one merged mesh per
 * material + shadow setting. The original meshes are hidden but kept, so hotspot picking
 * (which ray-casts against them) keeps working.
 *
 * Not merged: instanced meshes (books, clothes), custom shader materials (fireplace flames),
 * multi-material meshes (artworks) and anything flagged `userData.noMerge`.
 */
export function MergedStatic({ children }: { children: ReactNode }) {
  const root = useRef<THREE.Group>(null)
  const [merged, setMerged] = useState<THREE.Mesh[]>([])

  useEffect(() => {
    // wait one frame so lazily created geometries (rounded boxes, tubes) exist
    const id = requestAnimationFrame(() => {
      const g = root.current
      if (!g) return
      g.updateMatrixWorld(true)
      const inv = new THREE.Matrix4().copy(g.matrixWorld).invert()
      const buckets = new Map<string, { material: THREE.Material; cast: boolean; parts: THREE.BufferGeometry[]; sources: THREE.Mesh[] }>()
      g.traverse((o) => {
        const m = o as THREE.Mesh
        if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh || o.userData.noMerge) return
        if (Array.isArray(m.material) || (m.material as THREE.ShaderMaterial).isShaderMaterial) return
        const src = m.geometry
        if (!src.attributes.position || !src.attributes.normal) return
        const geo = src.index ? src.toNonIndexed() : src.clone()
        // keep a common attribute set so everything can be merged
        // (vertex colours are kept for materials that use them, e.g. foliage — they are bucketed per material)
        const keep = (m.material as THREE.MeshStandardMaterial).vertexColors ? ['position', 'normal', 'uv', 'color'] : ['position', 'normal', 'uv']
        if (keep.includes('color') && !geo.attributes.color) return
        for (const name of Object.keys(geo.attributes)) if (!keep.includes(name)) geo.deleteAttribute(name)
        if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2))
        geo.morphAttributes = {}
        geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld))
        const key = `${(m.material as THREE.Material).uuid}|${m.castShadow}`
        const b = buckets.get(key) ?? { material: m.material as THREE.Material, cast: m.castShadow, parts: [], sources: [] }
        b.parts.push(geo)
        b.sources.push(m)
        buckets.set(key, b)
      })
      const out: THREE.Mesh[] = []
      for (const b of buckets.values()) {
        const geo = mergeGeometries(b.parts, false)
        b.parts.forEach((p) => p.dispose())
        if (!geo) continue
        geo.computeBoundingSphere()
        const mesh = new THREE.Mesh(geo, b.material)
        mesh.castShadow = b.cast
        mesh.receiveShadow = true
        mesh.raycast = () => undefined // picking goes through the original parts
        out.push(mesh)
        b.sources.forEach((s) => (s.visible = false))
      }
      setMerged(out)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(
    () => () => {
      merged.forEach((m) => m.geometry.dispose())
    },
    [merged],
  )

  return (
    <>
      <group ref={root}>{children}</group>
      {merged.map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
    </>
  )
}
