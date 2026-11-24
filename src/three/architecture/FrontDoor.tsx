import { mat } from '../materials/materials'

/**
 * Oversized walnut pivot door at the main entrance, shown open to invite visitors in.
 * Opening: x 0.2 … 2.0 on the north façade (z = -7), 2.9 m high.
 */
export function FrontDoor() {
  const width = 1.76
  const height = 2.88
  const pivotX = 0.58 // pivot axis, offset from the left jamb
  const angle = -1.35 // swung inwards (~77°)
  return (
    <group position={[pivotX, 0, -7]} rotation={[0, angle, 0]}>
      {/* leaf: local x from (0.21 - pivot) to (1.97 - pivot) */}
      <mesh position={[0.21 - pivotX + width / 2, height / 2 + 0.01, 0]} material={mat('walnut')} castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.07]} />
      </mesh>
      {/* full-height brass pull, both sides */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[1.75 - pivotX, 1.45, s * 0.075]} material={mat('metal')} castShadow>
          <boxGeometry args={[0.035, 1.5, 0.035]} />
        </mesh>
      ))}
    </group>
  )
}
