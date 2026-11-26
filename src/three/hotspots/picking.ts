import * as THREE from 'three'
import { CONTEMPORARY_HOTSPOTS } from '../../data/livingLayouts'
import { useAppStore } from '../../store/useAppStore'
import { cameraColliders } from '../camera/colliders'

/**
 * Hotspot picking shared by every input path (crosshair, mouse, touch, orbit view).
 * Targets register their objects here; a pick casts one ray and returns the hotspot id only
 * if no wall stands in front of it, so nothing can be clicked through walls or floors.
 */

const targets = new Map<string, THREE.Object3D[]>()
let camera: THREE.Camera | null = null
const raycaster = new THREE.Raycaster()
const ndc = new THREE.Vector2()

export const PICK_DISTANCE = 11

export function registerHotspotTarget(id: string, obj: THREE.Object3D | null) {
  if (!obj) return
  const list = targets.get(id) ?? []
  if (!list.includes(obj)) list.push(obj)
  targets.set(id, list)
}

function inScene(o: THREE.Object3D) {
  let p: THREE.Object3D | null = o
  while (p.parent) p = p.parent
  return (p as THREE.Scene).isScene === true
}

export function setPickCamera(c: THREE.Camera) {
  camera = c
}

/** Opaque architecture only (glass does not hide what is behind it). */
function occluders() {
  return cameraColliders.filter((m) => {
    const mat = m.material as THREE.MeshPhysicalMaterial
    return !mat.transparent && !(mat.transmission > 0)
  })
}

/** Pick at normalised device coordinates (-1..1). Returns a hotspot id or null. */
export function pickHotspot(x: number, y: number): string | null {
  if (!camera) return null
  ndc.set(x, y)
  raycaster.setFromCamera(ndc, camera)
  raycaster.near = 0.05
  raycaster.far = PICK_DISTANCE
  let best: { id: string; d: number } | null = null
  const contemporary = useAppStore.getState().livingStyle === 'contemporary'
  for (const [id, objs] of targets) {
    if (!contemporary && CONTEMPORARY_HOTSPOTS.has(id)) continue // that piece is not in the room now
    for (const o of objs) {
      if (!inScene(o)) continue // removed with a previous living room design
      const hit = raycaster.intersectObject(o, true)[0]
      if (hit && (!best || hit.distance < best.d)) best = { id, d: hit.distance }
    }
  }
  if (!best) return null
  const wall = raycaster.intersectObjects(occluders(), false)[0]
  if (wall && wall.distance < best.d - 0.15) return null
  return best.id
}

const losRay = new THREE.Raycaster()
const dir = new THREE.Vector3()

/** True when an opaque wall/floor stands between `from` and `to`. */
export function isOccluded(from: THREE.Vector3, to: THREE.Vector3) {
  dir.subVectors(to, from)
  const d = dir.length()
  losRay.set(from, dir.normalize())
  losRay.far = d - 0.25
  return losRay.intersectObjects(occluders(), false).length > 0
}

/** Pick at a client (CSS pixel) position over the full-window canvas. */
export function pickAtClient(clientX: number, clientY: number) {
  return pickHotspot((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1)
}
