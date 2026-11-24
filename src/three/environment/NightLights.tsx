import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore'
import { BOLLARDS } from '../../data/furniture'
import { mat } from '../materials/materials'
import { installPoolEffects, installWind, poolUniforms, shaderTime } from '../materials/shaderPatches'
import { lightingState } from './Lighting'
import { PRESETS } from './timeOfDay'

/**
 * Evening lighting: underwater pool light, terrace and entrance lights and garden bollards.
 * All lights are always mounted (intensity 0 by day) so switching mood never recompiles shaders.
 * Also ticks the shared shader clock (pool caustics, wind).
 */

export function NightLights() {
  const time = useAppStore((s) => s.timeOfDay)
  const night = PRESETS[time].night
  const pool = useRef<THREE.PointLight>(null)
  const terrace = useRef<THREE.PointLight>(null)
  const entrance = useRef<THREE.PointLight>(null)
  const posts = useRef<THREE.InstancedMesh>(null)
  const heads = useRef<THREE.InstancedMesh>(null)
  const headMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f2e6d0', emissive: '#ffcf8a', emissiveIntensity: 0, roughness: 0.5 }), [])
  const geo = useMemo(() => ({ post: new THREE.BoxGeometry(0.09, 0.55, 0.09), head: new THREE.BoxGeometry(0.1, 0.06, 0.1) }), [])

  useLayoutEffect(() => {
    installPoolEffects()
    installWind()
    const m = new THREE.Matrix4()
    BOLLARDS.forEach(([x, z], i) => {
      posts.current?.setMatrixAt(i, m.makeTranslation(x, 0.21, z))
      heads.current?.setMatrixAt(i, m.makeTranslation(x, 0.47, z))
    })
    if (posts.current) posts.current.instanceMatrix.needsUpdate = true
    if (heads.current) heads.current.instanceMatrix.needsUpdate = true
    posts.current?.computeBoundingSphere()
    heads.current?.computeBoundingSphere()
  }, [])

  // smooth cross-fade between moods
  const level = useRef(night)
  useFrame(({ clock }, dt) => {
    shaderTime.value = clock.elapsedTime
    level.current += (lightingState.night - level.current) * Math.min(1, dt * 2)
    const n = level.current
    if (pool.current) pool.current.intensity = n * 14
    if (terrace.current) terrace.current.intensity = n * 9
    if (entrance.current) entrance.current.intensity = n * 7
    headMat.emissiveIntensity = n * 3.5
    poolUniforms.night.value = n
    poolUniforms.caustic.value = 0.7 * (1 - n) + 0.22 * n
  })

  return (
    <>
      <pointLight ref={pool} position={[2, -0.9, 13.5]} color="#59d2ff" intensity={0} distance={10} decay={1.4} />
      <pointLight ref={terrace} position={[0, 2.9, 8.6]} color="#ffc98a" intensity={0} distance={13} decay={1.5} />
      <pointLight ref={entrance} position={[1.2, 2.7, -8.8]} color="#ffc98a" intensity={0} distance={9} decay={1.5} />
      <instancedMesh ref={posts} args={[geo.post, mat('blackMetal'), BOLLARDS.length]} castShadow receiveShadow />
      <instancedMesh ref={heads} args={[geo.head, headMat, BOLLARDS.length]} />
    </>
  )
}
