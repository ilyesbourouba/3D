import { Environment, Lightformer, Sky } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore'
import { setGlow } from '../materials/materials'
import { PRESETS } from './timeOfDay'

/**
 * Sun, physical sky, image-based lighting baked from that same sky (so reflections in glass and
 * water match) and atmospheric haze — all driven by the selected time of day.
 */

/** Live lighting factors read by other systems (interior lights, night lights). */
export const lightingState = { interior: 1, night: 0 }

export function Lighting() {
  const quality = useAppStore((s) => s.quality)
  const time = useAppStore((s) => s.timeOfDay)
  const p = PRESETS[time]
  const shadowSize = quality === 'high' ? 4096 : quality === 'medium' ? 2048 : 1024
  const sun = useRef<THREE.DirectionalLight>(null)
  const scene = useThree((s) => s.scene)
  const sunPos = useMemo(() => p.sunDir.clone().multiplyScalar(60), [p])

  useLayoutEffect(() => {
    scene.fog = new THREE.Fog(p.fog.color, p.fog.near, p.fog.far)
    lightingState.interior = p.interior
    lightingState.night = p.night
    setGlow(p.glow)
    const light = sun.current
    if (light) {
      light.target.position.set(0, 0, 3)
      light.target.updateMatrixWorld()
    }
    return () => {
      scene.fog = null
    }
  }, [scene, p, shadowSize])

  return (
    <>
      <Sky distance={450} sunPosition={p.sunDir.toArray()} {...p.sky} />
      {/* re-captured whenever the time of day changes */}
      <Environment key={time} resolution={256} frames={1} environmentIntensity={p.envIntensity}>
        <Sky distance={450} sunPosition={p.sunDir.toArray()} {...p.sky} />
        <Lightformer form="rect" intensity={p.bounce.intensity} color={p.bounce.color} position={[0, -10, 0]} rotation-x={Math.PI / 2} scale={[200, 200, 1]} />
        <Lightformer form="circle" intensity={p.sunCard.intensity} color={p.sunCard.color} position={sunPos.toArray()} scale={12} />
      </Environment>

      <hemisphereLight args={[p.hemi.sky, p.hemi.ground, p.hemi.intensity]} />
      <directionalLight
        key={shadowSize}
        ref={sun}
        position={sunPos.toArray()}
        intensity={p.sunIntensity}
        color={p.sunColor}
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.035}
        shadow-camera-near={10}
        shadow-camera-far={140}
        shadow-camera-left={-38}
        shadow-camera-right={38}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
      />
    </>
  )
}
