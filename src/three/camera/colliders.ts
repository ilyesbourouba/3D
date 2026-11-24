import type * as THREE from 'three'

/**
 * Meshes the interior orbit camera must not pass through (walls, slabs, glazing).
 * Filled by the architecture components when they mount.
 */
export const cameraColliders: THREE.Mesh[] = []

export function registerCollider(mesh: THREE.Mesh | null) {
  if (mesh && !cameraColliders.includes(mesh)) cameraColliders.push(mesh)
}
