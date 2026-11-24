import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { LIGHT_POINTS } from '../../data/interior'
import { useAppStore } from '../../store/useAppStore'
import { lightingState } from '../environment/Lighting'

/**
 * Warm interior lighting with a fixed budget: a small pool of point lights is moved to the
 * room-light positions nearest the camera. A constant light count keeps shader programs
 * stable (no recompiles), while every room still appears lit wherever the visitor is.
 */

const POOL = 6
const COLOR = '#ffcf9a'

export function InteriorLights() {
  const lights = useRef<(THREE.PointLight | null)[]>([])
  const timer = useRef(0)
  const target = useRef<number[]>(Array(POOL).fill(0))
  const quality = useAppStore((s) => s.quality)
  const count = quality === 'low' ? 3 : POOL

  useFrame(({ camera }, dt) => {
    timer.current -= dt
    if (timer.current <= 0) {
      timer.current = 0.25
      const p = camera.position
      const ranked = LIGHT_POINTS.map((l, i) => {
        const dx = l.pos[0] - p.x
        const dy = (l.pos[1] - p.y) * 2.5 // prefer lights on the visitor's own floor
        const dz = l.pos[2] - p.z
        return { i, d: dx * dx + dy * dy + dz * dz }
      }).sort((a, b) => a.d - b.d)
      for (let k = 0; k < count; k++) {
        const light = lights.current[k]
        const lp = LIGHT_POINTS[ranked[k].i]
        if (!light) continue
        if (light.position.x !== lp.pos[0] || light.position.z !== lp.pos[2] || light.position.y !== lp.pos[1]) {
          light.position.set(...lp.pos)
          light.intensity = 0 // fade in at the new spot
        }
        target.current[k] = lp.strength
      }
    }
    for (let k = 0; k < count; k++) {
      const light = lights.current[k]
      if (!light) continue
      const goal = target.current[k] * 6.5 * lightingState.interior
      light.intensity += (goal - light.intensity) * Math.min(1, dt * 3)
    }
  })

  return (
    <>
      {Array.from({ length: count }, (_, k) => (
        <pointLight
          key={k}
          ref={(el) => {
            lights.current[k] = el
          }}
          color={COLOR}
          intensity={0}
          distance={7}
          decay={1.6}
        />
      ))}
    </>
  )
}
