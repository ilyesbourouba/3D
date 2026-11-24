import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { FURNITURE } from '../../data/furniture'
import { HOTSPOTS, hotspotById } from '../../data/hotspots'
import { LEVELS } from '../../data/house'
import { useAppStore } from '../../store/useAppStore'
import { isOccluded, pickAtClient, pickHotspot, registerHotspotTarget, setPickCamera } from './picking'

/**
 * Hotspot layer: a softly pulsing marker above every hotspot, invisible pick boxes for
 * architectural features, a name label on hover, and picking for the crosshair (walk mode
 * with captured mouse) and the interior orbit view.
 */

const MARKER_RANGE = 11

function markerTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  g.beginPath()
  g.arc(64, 64, 50, 0, Math.PI * 2)
  g.fillStyle = 'rgba(12, 11, 10, 0.35)'
  g.fill()
  g.lineWidth = 6
  g.strokeStyle = 'rgba(243, 239, 231, 0.95)'
  g.stroke()
  g.beginPath()
  g.arc(64, 64, 17, 0, Math.PI * 2)
  g.fillStyle = '#e2cfa4'
  g.fill()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

interface Anchor {
  id: string
  pos: THREE.Vector3
}

function anchors(): Anchor[] {
  const out: Anchor[] = []
  for (const h of HOTSPOTS) {
    if ('placement' in h.target) {
      const p = FURNITURE.find((f) => f.id === (h.target as { placement: string }).placement)
      if (!p) continue
      const base = LEVELS[p.level].y + (p.y ?? 0)
      const y = base + (h.markerY ?? (p.collide?.[2] ?? 1) + 0.25)
      // wall-mounted pieces: bring the marker a little into the room
      const push = p.type === 'art' ? 0.25 : 0
      const r = p.rot ?? 0
      out.push({ id: h.id, pos: new THREE.Vector3(p.x + Math.sin(r) * push, y, p.z + Math.cos(r) * push) })
    } else {
      const [cx, cy, cz, , hh] = h.target.box
      out.push({ id: h.id, pos: new THREE.Vector3(cx, h.markerY ?? cy + hh / 2 + 0.25, cz) })
    }
  }
  return out
}

function Marker({ anchor, material }: { anchor: Anchor; material: THREE.SpriteMaterial }) {
  const ref = useRef<THREE.Sprite>(null)
  const phase = useMemo(() => Math.random() * Math.PI * 2, [])
  const los = useRef({ t: Math.random() * 0.3, blocked: false })
  useEffect(() => registerHotspotTarget(anchor.id, ref.current), [anchor.id])
  useFrame(({ camera, clock }, dt) => {
    const s = ref.current
    if (!s) return
    const st = useAppStore.getState()
    const d = camera.position.distanceTo(anchor.pos)
    const sameFloor = Math.abs(camera.position.y - anchor.pos.y) < 2.8
    const candidate = st.phase === 'interior' && d < MARKER_RANGE && sameFloor && st.activeHotspot !== anchor.id
    // markers draw on top of everything (so glass never hides them); walls hide them instead,
    // using a line-of-sight check a few times per second
    los.current.t -= dt
    if (candidate && los.current.t <= 0) {
      los.current.t = 0.3
      los.current.blocked = isOccluded(camera.position, anchor.pos)
    }
    s.visible = candidate && !los.current.blocked
    const hovered = st.hoveredHotspot === anchor.id
    const k = (hovered ? 0.24 : 0.16) * (1 + 0.08 * Math.sin(clock.elapsedTime * 2.4 + phase)) * Math.min(1.6, Math.max(0.8, d / 3))
    s.scale.setScalar(k)
  })
  return <sprite ref={ref} position={anchor.pos} material={material} renderOrder={10} />
}

function PickBox({ id, box }: { id: string; box: [number, number, number, number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)
  useEffect(() => registerHotspotTarget(id, ref.current), [id])
  const [cx, cy, cz, w, h, d] = box
  return (
    <mesh ref={ref} position={[cx, cy, cz]} visible={false}>
      <boxGeometry args={[w, h, d]} />
      <meshBasicMaterial />
    </mesh>
  )
}

/** Name chip shown next to the hovered hotspot. */
function HoverLabel({ list }: { list: Anchor[] }) {
  const hovered = useAppStore((s) => s.hoveredHotspot)
  const active = useAppStore((s) => s.activeHotspot)
  const info = hotspotById(hovered)
  const anchor = list.find((a) => a.id === hovered)
  if (!info || !anchor || active === hovered) return null
  return (
    <Html position={anchor.pos} center zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
      <div className="mt-14 whitespace-nowrap rounded-full border border-bone/20 bg-ink/60 px-3 py-1.5 text-[11px] tracking-[0.08em] text-bone backdrop-blur-md">
        {info.name}
        <span className="ml-2 text-gold-soft/80">· details</span>
      </div>
    </Html>
  )
}

export function Hotspots() {
  const { camera, gl } = useThree()
  const list = useMemo(anchors, [])
  const material = useMemo(() => new THREE.SpriteMaterial({ map: markerTexture(), depthTest: false, depthWrite: false, transparent: true, sizeAttenuation: true }), [])
  const timer = useRef(0)

  const scene = useThree((s) => s.scene)
  useEffect(() => {
    setPickCamera(camera)
    if (import.meta.env.DEV) Object.assign(window, { __hotspots: { pickAtClient, pickHotspot, scene } })
  }, [camera, scene])

  // crosshair hover while the mouse is captured in walk mode
  useFrame((_, dt) => {
    timer.current -= dt
    if (timer.current > 0) return
    timer.current = 0.1
    const st = useAppStore.getState()
    if (st.phase !== 'interior') {
      if (st.hoveredHotspot) st.setHoveredHotspot(null)
      return
    }
    if (st.navMode === 'walk' && document.pointerLockElement) st.setHoveredHotspot(pickHotspot(0, 0))
  })

  // interior orbit view: hover + click directly on the canvas
  useEffect(() => {
    const el = gl.domElement
    let down: { x: number; y: number } | null = null
    const active = () => {
      const st = useAppStore.getState()
      return st.phase === 'interior' && st.navMode === 'orbit'
    }
    const onMove = (e: PointerEvent) => {
      if (!active() || e.buttons) return
      const id = pickAtClient(e.clientX, e.clientY)
      useAppStore.getState().setHoveredHotspot(id)
      el.style.cursor = id ? 'pointer' : ''
    }
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY }
    }
    const onUp = (e: PointerEvent) => {
      if (!active() || !down) return
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y)
      down = null
      if (moved > 6) return
      const id = pickAtClient(e.clientX, e.clientY)
      if (id) useAppStore.getState().openHotspot(id)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
      el.style.cursor = ''
    }
  }, [gl])

  return (
    <group>
      {list.map((a) => (
        <Marker key={a.id} anchor={a} material={material} />
      ))}
      {HOTSPOTS.map((h) => ('box' in h.target ? <PickBox key={h.id} id={h.id} box={h.target.box} /> : null))}
      <HoverLabel list={list} />
    </group>
  )
}
