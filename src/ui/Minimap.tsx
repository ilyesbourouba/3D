import { useEffect, useMemo, useRef, useState } from 'react'
import { FURNITURE, footprintAABB } from '../data/furniture'
import { HOUSE, LEVELS } from '../data/house'
import type { LevelId, Wall } from '../data/types'
import { useAppStore } from '../store/useAppStore'
import { player, playerLevel } from '../three/walk/playerState'

/**
 * Interactive floor plan drawn from the house data: rooms (click to walk there), walls with
 * door gaps, glazing, the staircase, furniture footprints and the visitor's position + heading.
 * Plan units are metres; SVG y = world z (north up).
 */

const VIEW = { x: -11.8, z: -7.8, w: 23.6, h: 17.4 }

interface Piece {
  x: number
  y: number
  w: number
  h: number
  glass: boolean
}

function wallPieces(level: LevelId): Piece[] {
  const out: Piece[] = []
  const add = (w: Wall, a0: number, a1: number, glass: boolean) => {
    if (a1 - a0 < 0.01) return
    const t = glass ? 0.06 : Math.max(w.thickness, 0.14)
    if (w.axis === 'x') out.push({ x: a0, y: w.at - t / 2, w: a1 - a0, h: t, glass })
    else out.push({ x: w.at - t / 2, y: a0, w: t, h: a1 - a0, glass })
  }
  for (const w of HOUSE.walls.filter((w) => w.level === level)) {
    const ops = [...(w.openings ?? [])].sort((a, b) => a.from - b.from)
    let cursor = w.from
    for (const o of ops) {
      add(w, cursor, o.from, false)
      if (o.kind === 'window' && o.sill > 1.2) add(w, o.from, o.to, false) // high windows read as wall
      else if (o.kind === 'window' || o.kind === 'glass') add(w, o.from, o.to, true)
      cursor = o.to
    }
    add(w, cursor, w.to, false)
  }
  return out
}

export function Minimap({ level, onPick }: { level: LevelId; onPick?: (roomId: string) => void }) {
  const current = useAppStore((s) => s.currentRoomId)
  const target = useAppStore((s) => s.travelTo)
  const phase = useAppStore((s) => s.phase)
  const goToRoom = useAppStore((s) => s.goToRoom)
  const [hover, setHover] = useState<string | null>(null)
  const arrow = useRef<SVGGElement>(null)

  const walls = useMemo(() => wallPieces(level), [level])
  const rooms = useMemo(() => HOUSE.rooms.filter((r) => r.level === level), [level])
  const furniture = useMemo(() => FURNITURE.filter((f) => f.level === level && f.collide).map(footprintAABB).filter(Boolean), [level])
  const stair = HOUSE.stairs[0].rect

  // player marker follows the live pose without re-rendering React
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const g = arrow.current
      if (g) {
        const visible = useAppStore.getState().phase === 'interior' && playerLevel() === level
        g.style.display = visible ? '' : 'none'
        g.setAttribute('transform', `translate(${player.x} ${player.z}) rotate(${(-player.yaw * 180) / Math.PI})`)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [level])

  const pick = (id: string) => {
    if (onPick) onPick(id)
    else goToRoom(id)
  }

  return (
    <svg viewBox={`${VIEW.x} ${VIEW.z} ${VIEW.w} ${VIEW.h}`} className="block h-auto w-full select-none" role="img" aria-label={`${LEVELS[level].name} plan`}>
      {/* rooms */}
      {rooms.map((r) =>
        r.rects.map((rect, k) => {
          const active = r.id === current && phase === 'interior'
          const isTarget = r.id === target
          const isHover = r.id === hover
          const clickable = r.inMenu !== false
          return (
            <rect
              key={`${r.id}${k}`}
              x={rect[0]}
              y={rect[1]}
              width={rect[2] - rect[0]}
              height={rect[3] - rect[1]}
              fill={active ? 'rgba(201,169,110,0.38)' : isTarget ? 'rgba(201,169,110,0.22)' : isHover ? 'rgba(243,239,231,0.16)' : r.outdoor ? 'rgba(243,239,231,0.03)' : 'rgba(243,239,231,0.07)'}
              className={clickable ? 'cursor-pointer transition-[fill] duration-200' : ''}
              onPointerEnter={() => clickable && setHover(r.id)}
              onPointerLeave={() => setHover((h) => (h === r.id ? null : h))}
              onClick={() => clickable && pick(r.id)}
            >
              <title>{r.name}</title>
            </rect>
          )
        }),
      )}
      {/* furniture */}
      {furniture.map((f, i) => (
        <rect key={i} x={f!.x0} y={f!.z0} width={f!.x1 - f!.x0} height={f!.z1 - f!.z0} rx={0.05} fill="rgba(243,239,231,0.13)" pointerEvents="none" />
      ))}
      {/* staircase */}
      <g pointerEvents="none" stroke="rgba(243,239,231,0.45)" strokeWidth={0.03}>
        <rect x={stair[0]} y={stair[1]} width={stair[2] - stair[0]} height={stair[3] - stair[1]} fill="none" />
        {Array.from({ length: 12 }, (_, i) => {
          const z = stair[1] + ((stair[3] - stair[1]) * (i + 1)) / 13
          return <line key={i} x1={stair[0]} x2={stair[2]} y1={z} y2={z} />
        })}
      </g>
      {/* walls & glazing */}
      {walls.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={p.glass ? 'rgba(160,200,210,0.75)' : 'rgba(243,239,231,0.85)'} pointerEvents="none" />
      ))}
      {/* hovered room label */}
      {hover && (
        <text x={VIEW.x + 0.4} y={VIEW.z + VIEW.h - 0.4} fontSize={0.9} fill="#e2cfa4" fontFamily="Manrope Variable, sans-serif" pointerEvents="none">
          {HOUSE.rooms.find((r) => r.id === hover)?.name}
        </text>
      )}
      {/* visitor */}
      <g ref={arrow} pointerEvents="none">
        <path d="M0 0 L-1.6 -3 A3.4 3.4 0 0 1 1.6 -3 Z" fill="rgba(226,207,164,0.25)" />
        <circle r={0.34} fill="#e2cfa4" stroke="#0c0b0a" strokeWidth={0.08} />
      </g>
    </svg>
  )
}
