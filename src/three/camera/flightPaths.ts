import * as THREE from 'three'
import { FRONT_DOOR } from '../../data/house'

/**
 * Cinematic camera paths. Each path is a list of [position, lookAt] keyframes that are
 * turned into two Catmull-Rom splines sharing the same parameter, so the gaze stays in sync
 * with the travel. Paths route around the building, never through it.
 */

export type Key = [THREE.Vector3, THREE.Vector3]

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** The exterior "hero" viewpoint (south-east, looking at the pool façade). */
export const HERO = { position: v(24, 7.5, 31), target: v(-1, 2.6, 2) }

/**
 * Distance multiplier for narrow (portrait) screens: with a fixed vertical FOV the
 * horizontal view shrinks, so the camera backs off to keep the whole villa in frame.
 */
export function viewDistanceFactor() {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight)
  return Math.min(2.1, Math.max(1, 1.45 / aspect))
}

/** Hero viewpoint adjusted for the current screen shape. */
export function heroView() {
  const k = viewDistanceFactor()
  const position = HERO.target.clone().add(HERO.position.clone().sub(HERO.target).multiplyScalar(k))
  // on portrait screens aim lower so the villa sits in the upper half, clear of the copy
  const target = HERO.target.clone().setY(HERO.target.y - (k - 1) * 6)
  return { position, target }
}
/** Where the intro starts before gliding to the hero view. */
export const INTRO = { position: v(58, 26, 78), target: v(0, 2, 0) }

const DX = FRONT_DOOR.x + 0.3 // pass on the open side of the pivot door
/** Arrival point inside the entrance hall. */
export const HALL = { position: v(DX, 1.65, -4.4), target: v(DX - 0.4, 1.55, 2) }

export function enterPath(pos: THREE.Vector3, target: THREE.Vector3): Key[] {
  const keys: Key[] = [[pos.clone(), target.clone()]]
  if (pos.z > -6) {
    // swing around the side the camera is already on, above the cypress rows (≤ 11 m)
    const side = pos.x >= 0 ? 1 : -1
    keys.push([v(side * 27, 13, 3), v(0, 3, -2)])
    keys.push([v(side * 10, 12, -26), v(DX, 2.5, -7)])
  } else {
    keys.push([v(pos.x * 0.5, Math.max(12, pos.y), Math.min(pos.z, -26)), v(DX, 2.5, -7)])
  }
  // descend along the entrance path, between the driveway cypresses and the blade wall
  keys.push([v(DX, 4, -21), v(DX, 2, -7)])
  keys.push([v(DX, 1.9, -13), v(DX, 1.8, -7)])
  keys.push([v(DX, 1.7, -9), v(DX, 1.7, -4)])
  keys.push([v(DX, 1.66, -6.4), v(DX - 0.2, 1.6, 0)])
  keys.push([HALL.position.clone(), HALL.target.clone()])
  return keys
}

export function exitPath(pos: THREE.Vector3, target: THREE.Vector3): Key[] {
  return [
    [pos.clone(), target.clone()],
    [v(DX, 1.66, -5.4), v(DX, 1.7, -12)],
    [v(DX, 1.75, -8.4), v(DX, 2, -18)],
    [v(DX, 2.6, -14), v(DX, 2.4, -6)],
    [v(DX, 5, -22), v(DX, 3, -7)],
    [v(10, 12, -26), v(0, 3, -3)],
    [v(27, 13, 3), v(0, 3, 1)],
    [heroView().position, heroView().target],
  ]
}

export function introPath(): Key[] {
  const k = viewDistanceFactor()
  return [
    [INTRO.position.clone().multiplyScalar(k), INTRO.target.clone()],
    [v(42, 15, 52).multiplyScalar((1 + k) / 2), v(0, 2.4, 1)],
    [heroView().position, heroView().target],
  ]
}

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
