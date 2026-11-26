import { useEffect, useState } from 'react'
import { HOUSE } from '../data/house'
import type { LevelId } from '../data/types'
import { useAppStore } from '../store/useAppStore'
import { playerLevel } from '../three/walk/playerState'
import { Minimap } from './Minimap'

/**
 * Navigation panel: floor selector, interactive plan and the room list.
 * Choosing a room takes you there (from outside, it flies you in first).
 */
export function NavPanel() {
  const open = useAppStore((s) => s.navOpen)
  const setOpen = useAppStore((s) => s.setNavOpen)
  const phase = useAppStore((s) => s.phase)
  const current = useAppStore((s) => s.currentRoomId)
  const target = useAppStore((s) => s.travelTo)
  const goToRoom = useAppStore((s) => s.goToRoom)
  const [level, setLevel] = useState<LevelId>(0)

  // collapsed outside (keeps the hero view clear); opens by itself inside on wide screens
  useEffect(() => {
    if (phase === 'exterior') setOpen(false)
    if (phase === 'interior' && window.innerWidth >= 1024) setOpen(true)
  }, [phase, setOpen])

  // the plan follows the visitor between floors
  useEffect(() => {
    if (phase !== 'interior') return
    let last = playerLevel()
    setLevel(last as LevelId)
    const id = setInterval(() => {
      const l = playerLevel()
      if (l !== last) {
        last = l
        setLevel(l as LevelId)
      }
    }, 400)
    return () => clearInterval(id)
  }, [phase])

  const pick = (id: string) => {
    goToRoom(id)
    if (window.innerWidth < 640) setOpen(false)
  }
  const rooms = HOUSE.rooms.filter((r) => r.level === level && r.inMenu !== false)
  const outside = phase === 'exterior'

  return (
    <nav aria-label="Navigation" className="rise-in pointer-events-none fixed top-16 right-3 z-20 flex flex-col items-end sm:top-20 sm:right-6" style={{ animationDelay: '0.15s' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="glass-panel pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-[10px] tracking-[0.3em] text-bone/85 uppercase hover:text-bone"
        title="Map and rooms (M)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
          <path d="M9 4v14M15 6v14" />
        </svg>
        {outside ? 'Explore rooms' : 'Map'}
      </button>

      {open && (
        <div className="pointer-events-auto mt-2 w-[min(320px,calc(100vw-24px))] rounded-2xl border border-bone/12 bg-ink/70 p-3 backdrop-blur-xl">
          {/* floor selector */}
          <div className="mb-3 grid grid-cols-2 rounded-full bg-bone/8 p-1" role="tablist" aria-label="Floor">
            {HOUSE.levels.map((l) => (
              <button
                key={l.id}
                role="tab"
                aria-selected={level === l.id}
                onClick={() => setLevel(l.id)}
                className={`rounded-full py-1.5 text-[10px] tracking-[0.25em] uppercase transition-colors ${level === l.id ? 'bg-bone/90 text-ink' : 'text-bone/70 hover:text-bone'}`}
              >
                {l.name}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl bg-ink/40 p-1.5">
            <Minimap level={level} onPick={pick} />
          </div>
          <p className="mt-2 px-1 text-[10px] tracking-[0.1em] text-bone/45">
            {outside ? 'Choose a room to fly in and visit it.' : 'Click a room on the plan or below to go there.'}
          </p>

          <ul className="mt-2 grid max-h-[28vh] grid-cols-2 gap-1 overflow-y-auto">
            {rooms.map((r) => {
              const here = r.id === current && phase === 'interior'
              const going = r.id === target
              return (
                <li key={r.id}>
                  <button
                    onClick={() => pick(r.id)}
                    aria-current={here}
                    className={`w-full truncate rounded-lg px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                      here ? 'bg-bone/90 text-ink' : going ? 'bg-gold/30 text-bone' : 'text-bone/80 hover:bg-bone/10 hover:text-bone'
                    }`}
                  >
                    {r.name}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </nav>
  )
}

/** "Walking to …" chip with a Skip button, shown during guided travel. */
export function TravelChip() {
  const target = useAppStore((s) => s.travelTo)
  const skip = useAppStore((s) => s.skipTravel)
  const room = HOUSE.rooms.find((r) => r.id === target)
  if (!room) return null
  return (
    <div className="rise-in pointer-events-none fixed inset-x-0 bottom-44 z-20 flex justify-center sm:bottom-32">
      <div className="glass-panel pointer-events-auto flex items-center gap-4 rounded-full py-2 pr-2 pl-5 text-[11px] tracking-[0.12em] text-bone/85">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-soft/70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-soft" />
        </span>
        Walking to <span className="text-bone">{room.name}</span>
        <button onClick={skip} className="rounded-full bg-bone/90 px-3 py-1 text-[10px] tracking-[0.2em] text-ink uppercase hover:bg-bone">
          Skip
        </button>
      </div>
    </div>
  )
}
