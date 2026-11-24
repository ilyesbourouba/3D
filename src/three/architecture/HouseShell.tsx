import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { HOUSE } from '../../data/house'
import { useAppStore } from '../../store/useAppStore'
import { registerCollider } from '../camera/colliders'
import { mat } from '../materials/materials'
import { buildHouse } from './buildHouse'

/**
 * The building shell (walls, slabs, roof, glazing, railings, stairs), generated from the
 * house data and rendered as one mesh per material. Clicking it from the exterior view
 * starts the cinematic entry.
 */
export function HouseShell() {
  const geometries = useMemo(() => [...buildHouse(HOUSE).entries()], [])
  const enterHouse = useAppStore((s) => s.enterHouse)

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    // ignore clicks that were really drags (orbiting)
    if (e.delta > 6) return
    if (useAppStore.getState().phase !== 'exterior') return
    e.stopPropagation()
    enterHouse()
  }
  const onOver = () => {
    if (useAppStore.getState().phase === 'exterior') document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    document.body.style.cursor = ''
  }

  return (
    <group onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      {geometries.map(([key, geometry]) => (
        <mesh
          key={key}
          ref={registerCollider}
          geometry={geometry}
          material={mat(key)}
          castShadow={key !== 'glass'}
          receiveShadow={key !== 'glass'}
          renderOrder={key === 'glass' ? 2 : 0}
        />
      ))}
    </group>
  )
}
