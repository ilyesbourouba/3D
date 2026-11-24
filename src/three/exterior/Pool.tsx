import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import { DECK, POOL } from '../../data/house'
import { GeometryBuckets } from '../architecture/GeometryBuckets'
import { mat } from '../materials/materials'

/** Pool deck, travertine coping, mosaic-tiled basin and animated water surface. */

type K = 'paving' | 'travertine' | 'poolTile' | 'water'

function build() {
  const b = new GeometryBuckets<K>()
  const [px0, pz0, px1, pz1] = POOL.rect
  const [dx0, dz0, dx1, dz1] = DECK.rect
  const c = 0.35 // coping width
  const deckSides = { py: 'paving', px: 'paving', nx: 'paving', pz: 'paving', nz: 'paving' } as const
  const top = DECK.top
  const bot = -0.4

  // deck around the pool + coping ring
  const rx0 = px0 - c, rz0 = pz0 - c, rx1 = px1 + c, rz1 = pz1 + c
  b.box([dx0, bot, dz0], [dx1, top, rz0], deckSides)
  b.box([dx0, bot, rz1], [dx1, top, dz1], deckSides)
  b.box([dx0, bot, rz0], [rx0, top, rz1], deckSides)
  b.box([rx1, bot, rz0], [dx1, top, rz1], deckSides)

  const cop = 'travertine' as const
  const ct = top + 0.015
  const cb = POOL.water + 0.02
  b.box([rx0, cb, rz0], [rx1, ct, pz0], cop)
  b.box([rx0, cb, pz1], [rx1, ct, rz1], cop)
  b.box([rx0, cb, pz0], [px0, ct, pz1], cop)
  b.box([px1, cb, pz0], [rx1, ct, pz1], cop)

  // basin
  const d = -POOL.depth
  const t = 0.2
  b.box([px0, d - 0.1, pz0], [px1, d, pz1], { py: 'poolTile' })
  b.box([px0 - t, d, pz0], [px0, cb, pz1], { px: 'poolTile' })
  b.box([px1, d, pz0], [px1 + t, cb, pz1], { nx: 'poolTile' })
  b.box([px0, d, pz0 - t], [px1, cb, pz0], { pz: 'poolTile' })
  b.box([px0, d, pz1], [px1, cb, pz1 + t], { nz: 'poolTile' })
  // entry steps in the north-west corner
  for (let i = 0; i < 4; i++) {
    const h = cb - 0.3 * (i + 1)
    b.box([px0, d, pz0], [px0 + 2.2, h, pz0 + 0.4 * (i + 1)], { py: 'poolTile', pz: 'poolTile', px: 'poolTile' })
  }

  // water surface
  b.quad('water', [px0, POOL.water, pz1], [px1, POOL.water, pz1], [px1, POOL.water, pz0], [px0, POOL.water, pz0])
  return b.build()
}

export function Pool() {
  const geos = useMemo(build, [])
  const water = mat('water') as THREE.MeshPhysicalMaterial

  useFrame((_, dt) => {
    const n = water.normalMap
    if (!n) return
    n.offset.x += dt * 0.012
    n.offset.y += dt * 0.007
  })

  return (
    <group>
      {[...geos.entries()].map(([key, g]) =>
        key === 'water' ? (
          <mesh key={key} geometry={g} material={water} receiveShadow renderOrder={1} />
        ) : (
          <mesh key={key} geometry={g} material={mat(key)} receiveShadow castShadow={key !== 'poolTile'} />
        ),
      )}
    </group>
  )
}
