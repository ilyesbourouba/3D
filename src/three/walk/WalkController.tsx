import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { HOUSE, LEVELS, roomAt } from '../../data/house'
import { prefersReducedMotion, useAppStore } from '../../store/useAppStore'
import { HALL } from '../camera/flightPaths'
import { createAutopilot, stepAutopilot, type Autopilot } from './autopilot'
import { stairHeight } from './collision'
import { findPath, warmNavGrid } from './navGrid'
import { EYE_HEIGHT, player, playerLevel } from './playerState'
import { resetLook, walkInput } from './walkInput'
import { stepWalker, WALK_SPEED } from './walkPhysics'

/**
 * First-person walker: feeds input into the movement physics, drives the camera in "walk"
 * mode, tracks the current room, guides the visitor to a chosen room (autopilot along a
 * planned path), and performs fade-cuts when a cut is needed (skip, exit from upstairs).
 */

export { EYE_HEIGHT, player }
const MAX_PITCH = 1.35

function setPose(pos: THREE.Vector3, look: THREE.Vector3) {
  const d = look.clone().sub(pos).normalize()
  player.x = pos.x
  player.z = pos.z
  player.feet = pos.y - EYE_HEIGHT
  player.yaw = Math.atan2(-d.x, -d.z)
  player.pitch = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1))
  player.vx = player.vz = player.vy = 0
}

/** Arrival pose for a room (spawn from house data, or the hall entry point). */
function roomPose(id: string): [THREE.Vector3, THREE.Vector3] | null {
  if (id === 'hall') return [HALL.position.clone(), HALL.target.clone()]
  const room = HOUSE.rooms.find((r) => r.id === id)
  if (!room) return null
  const [x, z, yaw] = room.spawn
  const y = LEVELS[room.level].y + EYE_HEIGHT
  return [new THREE.Vector3(x, y, z), new THREE.Vector3(x - Math.sin(yaw), y - 0.08, z - Math.cos(yaw))]
}

function applyCamera(camera: THREE.Camera, bobY: number) {
  camera.position.set(player.x, player.feet + EYE_HEIGHT + bobY, player.z)
  camera.rotation.order = 'YXZ'
  camera.rotation.set(player.pitch, player.yaw, 0)
}

const userIsSteering = () =>
  walkInput.keyForward !== 0 || walkInput.keyStrafe !== 0 || walkInput.stickForward !== 0 || walkInput.stickStrafe !== 0 || Math.abs(walkInput.wheel) > 0.01

export function WalkController() {
  const camera = useThree((s) => s.camera)
  const phase = useAppStore((s) => s.phase)
  const pendingRoomId = useAppStore((s) => s.pendingRoomId)
  const travelTo = useAppStore((s) => s.travelTo)
  const bob = useRef(0)
  const roomTimer = useRef(0)
  const pilot = useRef<Autopilot | null>(null)

  // arrival in the hall + keyboard while inside; build the navigation grid in the background
  useEffect(() => {
    if (phase !== 'interior') return
    setPose(HALL.position, HALL.target)
    resetLook()
    const st = useAppStore.getState()
    // orbit is the only camera mode inside; a room picked from outside is reached with a cut
    useAppStore.setState((s) => ({ poseVersion: s.poseVersion + 1 }))
    if (st.travelAfterEnter) useAppStore.setState({ pendingRoomId: st.travelAfterEnter, travelAfterEnter: null })
  }, [phase])
  useEffect(() => {
    const id = setTimeout(warmNavGrid, 1500)
    return () => clearTimeout(id)
  }, [])

  // guided travel: plan a route to the room; fall back to a fade-cut if there is none
  useEffect(() => {
    if (!travelTo) {
      pilot.current = null
      return
    }
    const room = HOUSE.rooms.find((r) => r.id === travelTo)
    const pose = roomPose(travelTo)
    if (!room || !pose) return
    const [p, l] = pose
    const yaw = Math.atan2(-(l.x - p.x), -(l.z - p.z))
    const path = findPath({ x: player.x, z: player.z, level: playerLevel() }, { x: p.x, z: p.z, level: room.level })
    if (!path) useAppStore.getState().skipTravel()
    else pilot.current = createAutopilot(path, yaw)
  }, [travelTo])

  // room cut: fade out, move the player, fade in (and optionally leave the house)
  useEffect(() => {
    if (!pendingRoomId) return
    useAppStore.getState().setFading(true)
    // no cleanup on purpose: clearing pendingRoomId re-runs this effect and must not cancel the fade-in
    setTimeout(() => {
      const pose = roomPose(pendingRoomId)
      if (pose) setPose(pose[0], pose[1])
      const exit = useAppStore.getState().exitAfterTravel
      useAppStore.setState((s) => ({ currentRoomId: pendingRoomId, pendingRoomId: null, exitAfterTravel: false, poseVersion: s.poseVersion + 1 }))
      applyCamera(camera, 0) // camera at the new pose before the veil lifts (and for the exit flight)
      setTimeout(() => {
        useAppStore.getState().setFading(false)
        if (exit) useAppStore.getState().setPhase('exiting')
      }, 150)
    }, 380)
  }, [pendingRoomId, camera])

  useFrame((_, rawDt) => {
    const st = useAppStore.getState()
    if (st.phase !== 'interior' || st.navMode !== 'walk' || st.pendingRoomId) {
      resetLook()
      return
    }
    const dt = Math.min(rawDt, 0.05)

    // looking around is always allowed (also while being guided)
    player.yaw += walkInput.lookYaw
    player.pitch = THREE.MathUtils.clamp(player.pitch + walkInput.lookPitch, -MAX_PITCH, MAX_PITCH)
    walkInput.lookYaw = 0
    walkInput.lookPitch = 0

    const ap = pilot.current
    if (ap && st.travelTo) {
      if (userIsSteering()) {
        // the visitor takes over: stop guiding where we are
        pilot.current = null
        st.cancelTravel()
      } else {
        const status = stepAutopilot(player, ap, dt)
        if (status === 'arrived') {
          pilot.current = null
          useAppStore.setState({ currentRoomId: st.travelTo, travelTo: null })
        } else if (status === 'stuck') {
          pilot.current = null
          st.skipTravel()
        }
      }
    } else {
      const push = walkInput.wheel * Math.min(1, dt * 7)
      walkInput.wheel -= push
      stepWalker(
        player,
        { forward: walkInput.keyForward + walkInput.stickForward, strafe: walkInput.keyStrafe + walkInput.stickStrafe, run: walkInput.run, push },
        dt,
      )
    }

    // gentle head bob while moving
    const moving = Math.hypot(player.vx, player.vz)
    if (moving > 0.2 && !prefersReducedMotion()) bob.current += dt * moving * 5.2
    applyCamera(camera, moving > 0.2 ? Math.sin(bob.current) * 0.022 * Math.min(1, moving / WALK_SPEED) : 0)

    // which room are we in? (keep the last one while on the staircase)
    roomTimer.current -= dt
    if (roomTimer.current <= 0) {
      roomTimer.current = 0.3
      const id = roomAt(playerLevel(), player.x, player.z)?.id ?? null
      const onStair = stairHeight(player.x, player.z) !== null
      if (id !== st.currentRoomId && !(id === null && onStair)) st.setCurrentRoom(id)
    }
  })

  return null
}
