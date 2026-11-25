import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { lazy, Suspense, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useAppStore } from '../store/useAppStore'
import { FrontDoor } from './architecture/FrontDoor'
import { HouseShell } from './architecture/HouseShell'
import { CameraRig } from './camera/CameraRig'
import { Lighting } from './environment/Lighting'
import { NightLights } from './environment/NightLights'
import { PostFX } from './environment/PostFX'
import { Landscape } from './exterior/Landscape'
import { OutdoorFurniture } from './exterior/OutdoorFurniture'
import { Pool } from './exterior/Pool'
import { Vegetation } from './exterior/Vegetation'
import { InteriorLights } from './interior/InteriorLights'
import { InteriorShell } from './interior/InteriorShell'
import { WalkController } from './walk/WalkController'

const InteriorContent = lazy(() => import('./interior/InteriorContent'))

/** Dev only: per-frame totals (all render passes) exposed as window.__stats. */
function DevStats() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    gl.info.autoReset = false
    return () => {
      gl.info.autoReset = true
    }
  }, [gl])
  useFrame(() => {
    const r = gl.info.render
    Object.assign(window, { __stats: { calls: r.calls, triangles: r.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures, programs: gl.info.programs?.length } })
    gl.info.reset()
  }, -1000)
  return null
}

/** Compiles shaders up front, waits a few frames, then tells the UI the scene is ready. */
function ReadySignal() {
  const frames = useRef(0)
  const done = useRef(false)
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    gl.compile(scene, camera)
  }, [gl, scene, camera])
  useFrame(() => {
    if (done.current) return
    frames.current++
    if (frames.current > 4) {
      done.current = true
      useAppStore.getState().setSceneReady()
    }
  })
  return null
}

export function Experience() {
  const quality = useAppStore((s) => s.quality)
  const sceneReady = useAppStore((s) => s.sceneReady)
  const maxDpr = quality === 'high' ? 2 : quality === 'medium' ? 1.5 : 1
  // fixed: the chosen quality tier is never changed automatically
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={dpr}
      camera={{ fov: 38, near: 0.08, far: 3000, position: [58, 26, 78] }}
      gl={{ antialias: quality === 'low', powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace
      }}
    >
      <Suspense fallback={null}>
        <Lighting />
        <NightLights />
        <HouseShell />
        <FrontDoor />
        <InteriorShell />
        <InteriorLights />
        <Pool />
        <Landscape />
        <Vegetation />
        <OutdoorFurniture />
        <CameraRig />
        <WalkController />
        <PostFX />
        <ReadySignal />
        {sceneReady && (
          <Suspense fallback={null}>
            <InteriorContent />
          </Suspense>
        )}
        {import.meta.env.DEV && <DevStats />}
      </Suspense>
    </Canvas>
  )
}
