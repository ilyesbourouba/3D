import { CameraControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import CameraControlsImpl from 'camera-controls'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { prefersReducedMotion, useAppStore, type Phase } from '../../store/useAppStore'
import { EYE_HEIGHT, player } from '../walk/WalkController'
import { cameraColliders } from './colliders'
import { easeInOut, enterPath, exitPath, INTRO, introPath, viewDistanceFactor, type Key } from './flightPaths'

const { ACTION } = CameraControlsImpl

interface Flight {
  pos: THREE.CatmullRomCurve3
  look: THREE.CatmullRomCurve3
  t: number
  duration: number
  onDone: () => void
}

const FOV_OUTSIDE = 38
const FOV_INSIDE = 62

/** Orbit around the villa from outside. */
function configureOrbit(c: CameraControlsImpl) {
  c.minDistance = 15
  c.maxDistance = 62 * viewDistanceFactor()
  c.minPolarAngle = 0.2
  c.maxPolarAngle = 1.46
  c.azimuthRotateSpeed = 0.6
  c.polarRotateSpeed = 0.6
  c.dollySpeed = 0.6
  c.smoothTime = 0.45
  c.draggingSmoothTime = 0.18
  c.mouseButtons.left = ACTION.ROTATE
  c.mouseButtons.right = ACTION.NONE
  c.mouseButtons.middle = ACTION.DOLLY
  c.mouseButtons.wheel = ACTION.DOLLY
  c.touches.one = ACTION.TOUCH_ROTATE
  c.touches.two = ACTION.TOUCH_DOLLY
  c.touches.three = ACTION.NONE
  c.dollyToCursor = false
  c.colliderMeshes = []
}

/** Inside the house: orbit freely around a point in front of the visitor, never through walls. */
function configureInteriorOrbit(c: CameraControlsImpl) {
  c.minDistance = 0.4
  c.maxDistance = 5
  c.minPolarAngle = 0.15
  c.maxPolarAngle = Math.PI - 0.25
  c.azimuthRotateSpeed = 0.55
  c.polarRotateSpeed = 0.55
  c.dollySpeed = 0.5
  c.smoothTime = 0.25
  c.draggingSmoothTime = 0.12
  c.mouseButtons.left = ACTION.ROTATE
  c.mouseButtons.right = ACTION.TRUCK // right-drag moves around the room (walls still stop the camera)
  c.mouseButtons.middle = ACTION.DOLLY
  c.mouseButtons.wheel = ACTION.DOLLY
  c.touches.one = ACTION.TOUCH_ROTATE
  c.touches.two = ACTION.TOUCH_DOLLY_TRUCK
  c.touches.three = ACTION.NONE
  c.colliderMeshes = cameraColliders
}

/**
 * Owns the camera outside the walking mode: orbit controls around the villa, scripted
 * cinematic flights between phases, the interior orbit view, and an idle drift.
 */
export function CameraRig() {
  const controls = useRef<CameraControlsImpl>(null)
  const flight = useRef<Flight | null>(null)
  const lastInteraction = useRef(performance.now())
  const camera = useThree((s) => s.camera)
  const phase = useAppStore((s) => s.phase)
  const navMode = useAppStore((s) => s.navMode)
  const poseVersion = useAppStore((s) => s.poseVersion)
  const sceneReady = useAppStore((s) => s.sceneReady)
  const prevPhase = useRef<Phase>(phase)

  const startFlight = (keys: Key[], duration: number, onDone: () => void) => {
    const c = controls.current!
    c.minDistance = 0.01
    c.maxDistance = Infinity
    c.colliderMeshes = []
    if (prefersReducedMotion()) duration = Math.min(duration, 2.5)
    flight.current = {
      pos: new THREE.CatmullRomCurve3(keys.map((k) => k[0]), false, 'centripetal'),
      look: new THREE.CatmullRomCurve3(keys.map((k) => k[1]), false, 'centripetal'),
      t: 0,
      duration,
      onDone,
    }
  }

  // initial camera placement
  useEffect(() => {
    const c = controls.current
    if (!c) return
    configureOrbit(c)
    c.maxDistance = Infinity
    c.setLookAt(...INTRO.position.toArray(), ...INTRO.target.toArray(), false)
    const onStart = () => {
      lastInteraction.current = performance.now()
      // the visitor grabs the camera during the intro glide → hand over control
      if (flight.current && useAppStore.getState().phase === 'exterior') {
        flight.current = null
        configureOrbit(c)
      }
    }
    c.addEventListener('controlstart', onStart)
    // dev-only handle for debugging / automated visual checks
    if (import.meta.env.DEV)
      Object.assign(window, {
        __aurelia: {
          controls: c,
          store: useAppStore,
          player,
          skipFlight: () => flight.current && (flight.current.t = 0.999),
          seekFlight: (t: number) => flight.current && (flight.current.t = t),
        },
      })
    return () => c.removeEventListener('controlstart', onStart)
  }, [])

  // intro glide once the scene is ready
  useEffect(() => {
    const c = controls.current
    if (!sceneReady || !c) return
    startFlight(introPath(), 5.5, () => configureOrbit(c))
  }, [sceneReady])

  // phase transitions → flights
  useEffect(() => {
    const c = controls.current
    if (!c || prevPhase.current === phase) return
    prevPhase.current = phase
    const pos = camera.position.clone()
    const target = pos.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(4))

    if (phase === 'entering') {
      c.enabled = false
      startFlight(enterPath(pos, c.getTarget(new THREE.Vector3())), 8.5, () => {
        // land in the hall; the interior orbit view takes over
        useAppStore.setState({ currentRoomId: 'hall', phase: 'interior' })
      })
    } else if (phase === 'exiting') {
      c.enabled = false
      startFlight(exitPath(pos, target), 7.5, () => {
        configureOrbit(c)
        c.enabled = true
        useAppStore.getState().setCurrentRoom(null)
        useAppStore.getState().setPhase('exterior')
      })
    }
  }, [phase, camera])

  // inside: walk (controls off) or orbit around a point in front of the visitor
  useEffect(() => {
    const c = controls.current
    if (!c || phase !== 'interior') return
    if (navMode === 'orbit') {
      const fx = -Math.sin(player.yaw)
      const fz = -Math.cos(player.yaw)
      const eyeY = player.feet + EYE_HEIGHT
      const pivot = new THREE.Vector3(player.x + fx * 1.6, player.feet + 1.2, player.z + fz * 1.6)
      configureInteriorOrbit(c)
      c.setLookAt(player.x - fx * 0.4, eyeY + 0.35, player.z - fz * 0.4, pivot.x, pivot.y, pivot.z, false)
      c.enabled = true
    } else {
      c.enabled = false
      c.colliderMeshes = []
    }
  }, [navMode, phase, poseVersion])

  useFrame((_, dt) => {
    const c = controls.current
    if (!c) return
    const f = flight.current

    // lens: architectural ~38° outside, wider ~62° inside (blended late in the entry flight)
    const ph = useAppStore.getState().phase
    const inside = ph === 'interior' || (ph === 'entering' && (f?.t ?? 1) > 0.72) || (ph === 'exiting' && (f?.t ?? 0) < 0.25)
    const cam = camera as THREE.PerspectiveCamera
    const goalFov = inside ? FOV_INSIDE : FOV_OUTSIDE
    if (Math.abs(cam.fov - goalFov) > 0.01) {
      cam.fov += (goalFov - cam.fov) * Math.min(1, dt * 2.2)
      cam.updateProjectionMatrix()
    }

    if (f) {
      f.t = Math.min(1, f.t + Math.min(dt, 0.1) / f.duration)
      const e = easeInOut(f.t)
      const p = f.pos.getPoint(e)
      const l = f.look.getPoint(e)
      c.setLookAt(p.x, p.y, p.z, l.x, l.y, l.z, false)
      if (f.t >= 1) {
        flight.current = null
        f.onDone()
        lastInteraction.current = performance.now()
      }
      return
    }
    // idle drift around the villa
    if (ph === 'exterior' && !prefersReducedMotion() && performance.now() - lastInteraction.current > 9000) {
      c.rotate(dt * 0.035, 0, false)
    }
  })

  return <CameraControls ref={controls} makeDefault />
}
