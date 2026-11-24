import { useEffect, useRef, useState } from 'react'
import { hotspotById } from '../data/hotspots'
import { useAppStore } from '../store/useAppStore'
import { pickAtClient, pickHotspot } from '../three/hotspots/picking'
import { walkInput } from '../three/walk/walkInput'

/**
 * Full-screen input surface for first-person walking (sits above the canvas, below the UI).
 *
 * Desktop: click to capture the mouse (pointer lock) and look by moving it; Esc releases.
 *          Without the lock, click-and-drag also looks around. Wheel steps forward/back.
 * Touch:   a floating joystick appears where the left thumb lands (lower-left area);
 *          dragging anywhere else turns the view.
 */

const MOUSE_SENS = 0.0022
const DRAG_SENS = 0.0042
const TOUCH_SENS = 0.0055
const STICK_RADIUS = 52

interface Stick {
  id: number
  ox: number
  oy: number
  x: number
  y: number
}

export function WalkLayer() {
  const surface = useRef<HTMLDivElement>(null)
  const [locked, setLocked] = useState(false)
  const [stick, setStickState] = useState<Stick | null>(null)
  const stickRef = useRef<Stick | null>(null)
  const setStick = (s: Stick | null) => {
    stickRef.current = s
    setStickState(s)
  }
  const capture = (id: number) => {
    try {
      surface.current?.setPointerCapture(id)
    } catch {
      /* pointer already gone */
    }
  }
  const drag = useRef<{ id: number; x: number; y: number; moved: number; touch: boolean } | null>(null)
  const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
  const hovered = useAppStore((s) => s.hoveredHotspot)
  const hoverTimer = useRef(0)

  // with the mouse captured, a click picks whatever is under the crosshair
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0 || document.pointerLockElement !== surface.current) return
      const id = pickHotspot(0, 0)
      if (id) {
        useAppStore.getState().openHotspot(id)
        document.exitPointerLock?.()
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // pointer lock state + locked mouse movement
  useEffect(() => {
    const onChange = () => setLocked(document.pointerLockElement === surface.current)
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== surface.current) return
      walkInput.lookYaw -= e.movementX * MOUSE_SENS
      walkInput.lookPitch -= e.movementY * MOUSE_SENS
    }
    document.addEventListener('pointerlockchange', onChange)
    document.addEventListener('mousemove', onMove)
    return () => {
      document.removeEventListener('pointerlockchange', onChange)
      document.removeEventListener('mousemove', onMove)
      if (document.pointerLockElement === surface.current) document.exitPointerLock?.()
      walkInput.stickForward = walkInput.stickStrafe = 0
    }
  }, [])

  // wheel = step (non-passive so the page never scrolls)
  useEffect(() => {
    const el = surface.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      walkInput.wheel = Math.max(-2, Math.min(2, walkInput.wheel - Math.sign(e.deltaY) * 0.45))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    const touch = e.pointerType === 'touch' || e.pointerType === 'pen'
    if (touch && !stickRef.current && e.clientX < window.innerWidth * 0.45 && e.clientY > window.innerHeight * 0.4) {
      capture(e.pointerId)
      setStick({ id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY })
      return
    }
    if (locked) return
    capture(e.pointerId)
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0, touch }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const stick = stickRef.current
    if (stick && e.pointerId === stick.id) {
      let dx = e.clientX - stick.ox
      let dy = e.clientY - stick.oy
      const l = Math.hypot(dx, dy)
      if (l > STICK_RADIUS) {
        dx = (dx / l) * STICK_RADIUS
        dy = (dy / l) * STICK_RADIUS
      }
      walkInput.stickStrafe = dx / STICK_RADIUS
      walkInput.stickForward = -dy / STICK_RADIUS
      setStick({ ...stick, x: stick.ox + dx, y: stick.oy + dy })
      return
    }
    const d = drag.current
    if (!d || d.id !== e.pointerId) {
      // free mouse (not captured, no button): hover hotspots under the pointer
      if (!locked && e.pointerType === 'mouse' && !e.buttons && performance.now() - hoverTimer.current > 80) {
        hoverTimer.current = performance.now()
        useAppStore.getState().setHoveredHotspot(pickAtClient(e.clientX, e.clientY))
      }
      return
    }
    const mx = e.clientX - d.x
    const my = e.clientY - d.y
    d.x = e.clientX
    d.y = e.clientY
    d.moved += Math.abs(mx) + Math.abs(my)
    const k = d.touch ? TOUCH_SENS : DRAG_SENS
    // drag the scene: moving the pointer right turns the view left (like grabbing the world)
    walkInput.lookYaw += mx * k
    walkInput.lookPitch += my * k
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const stick = stickRef.current
    if (stick && e.pointerId === stick.id) {
      setStick(null)
      walkInput.stickForward = walkInput.stickStrafe = 0
      return
    }
    const d = drag.current
    if (d && d.id === e.pointerId) {
      drag.current = null
      const tap = d.moved < (d.touch ? 10 : 4)
      if (!tap) return
      // a click/tap on a hotspot opens it; otherwise a mouse click captures the mouse
      const id = pickAtClient(e.clientX, e.clientY)
      if (id) useAppStore.getState().openHotspot(id)
      else if (!d.touch && !locked) surface.current?.requestPointerLock?.()
    }
  }

  return (
    <>
      <div
        ref={surface}
        className="fixed inset-0 z-[5]"
        style={{ touchAction: 'none', cursor: locked ? 'none' : hovered ? 'pointer' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Walk view. Use W A S D or the arrow keys to move."
      />

      {/* crosshair while the mouse is captured */}
      {locked && (
        <div className="pointer-events-none fixed top-1/2 left-1/2 z-[6] -translate-x-1/2 -translate-y-1/2">
          <div
            className={`rounded-full transition-all duration-200 ${
              hovered ? 'h-6 w-6 border-2 border-gold-soft bg-transparent' : 'h-1.5 w-1.5 bg-bone/80 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]'
            }`}
          />
          {hovered && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/60 px-3 py-1 text-[11px] text-bone backdrop-blur-md">
              {hotspotById(hovered)?.name} <span className="text-gold-soft/80">· click</span>
            </div>
          )}
        </div>
      )}

      {/* touch joystick */}
      {isTouch && !stick && (
        <div className="pointer-events-none fixed bottom-36 left-8 z-[6] grid h-24 w-24 place-items-center rounded-full border border-bone/25 bg-ink/20 backdrop-blur-sm">
          <div className="h-9 w-9 rounded-full bg-bone/40" />
        </div>
      )}
      {stick && (
        <>
          <div
            className="pointer-events-none fixed z-[6] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-bone/35 bg-ink/25 backdrop-blur-sm"
            style={{ left: stick.ox, top: stick.oy }}
          />
          <div className="pointer-events-none fixed z-[6] h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bone/70" style={{ left: stick.x, top: stick.y }} />
        </>
      )}
    </>
  )
}

export function usePointerLocked() {
  const [locked, setLocked] = useState(false)
  useEffect(() => {
    const f = () => setLocked(!!document.pointerLockElement)
    document.addEventListener('pointerlockchange', f)
    return () => document.removeEventListener('pointerlockchange', f)
  }, [])
  return locked
}
