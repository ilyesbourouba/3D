import { HOUSE } from '../data/house'
import { useAppStore } from '../store/useAppStore'
import { IconArrowLeft, IconDrag } from './icons'
import { usePointerLocked } from './WalkLayer'

const isTouch = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

function Key({ children }: { children: string }) {
  return <kbd className="inline-grid h-5 min-w-5 place-items-center rounded border border-bone/30 px-1 font-sans text-[10px] text-bone/85">{children}</kbd>
}

/** Subtle control guide for the current mode and device. */
function ControlGuide() {
  const navMode = useAppStore((s) => s.navMode)
  const locked = usePointerLocked()
  const touch = isTouch()
  let content
  if (navMode === 'orbit') {
    content = (
      <>
        <IconDrag className="text-gold-soft" /> {touch ? 'Drag to orbit · pinch to zoom' : 'Drag to orbit · scroll to zoom'}
      </>
    )
  } else if (touch) {
    content = <>Left thumb to walk · drag to look</>
  } else {
    content = (
      <span className="flex items-center gap-1.5">
        <Key>W</Key>
        <Key>A</Key>
        <Key>S</Key>
        <Key>D</Key>
        <span className="ml-1">move</span>
        <span className="mx-1 text-bone/30">·</span>
        <Key>⇧</Key>
        <span>run</span>
        <span className="mx-1 text-bone/30">·</span>
        <span>{locked ? 'Esc to release mouse' : 'click to look with the mouse'}</span>
      </span>
    )
  }
  return <div className="glass-panel hidden items-center gap-3 rounded-full px-5 py-3 text-[11px] tracking-[0.08em] text-bone/75 sm:flex">{content}</div>
}

/** Room caption, "Exterior" and walk/orbit toggle while inside the house. */
export function InteriorPanel() {
  const exitHouse = useAppStore((s) => s.exitHouse)
  const navMode = useAppStore((s) => s.navMode)
  const setNavMode = useAppStore((s) => s.setNavMode)
  const roomId = useAppStore((s) => s.currentRoomId)
  const room = HOUSE.rooms.find((r) => r.id === roomId)
  const level = room ? HOUSE.levels[room.level] : null

  return (
    <>
      {room && (
        <div key={room.id} className="rise-in pointer-events-none fixed inset-x-0 top-32 z-10 flex justify-center px-4 sm:top-8">
          <div className="text-center">
            <p className="text-[10px] tracking-[0.45em] text-gold-soft/90 uppercase">{level?.name}</p>
            <h2 className="mt-1 font-display text-3xl text-bone drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)] sm:text-4xl">{room.name}</h2>
            <p className="mt-1 text-xs text-bone/70">{room.tagline}</p>
          </div>
        </div>
      )}

      <div className="rise-in pointer-events-none fixed inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 p-4 pb-6 sm:p-10">
        <div className="pointer-events-auto flex flex-col gap-2 sm:flex-row">
          <button
            onClick={exitHouse}
            className="glass-panel group inline-flex items-center gap-3 rounded-full px-5 py-3 text-[11px] tracking-[0.3em] text-bone uppercase transition-colors hover:bg-bone hover:text-ink"
          >
            <IconArrowLeft className="transition-transform group-hover:-translate-x-1" />
            Exterior
          </button>
          <div className="glass-panel inline-flex rounded-full p-1" role="radiogroup" aria-label="Camera mode">
            {(['orbit', 'walk'] as const).map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={navMode === m}
                onClick={() => setNavMode(m)}
                className={`rounded-full px-4 py-2 text-[10px] tracking-[0.25em] uppercase transition-colors ${navMode === m ? 'bg-bone/90 text-ink' : 'text-bone/75 hover:text-bone'}`}
              >
                {m === 'walk' ? 'Walk' : 'Orbit'}
              </button>
            ))}
          </div>
        </div>
        <ControlGuide />
      </div>
    </>
  )
}
