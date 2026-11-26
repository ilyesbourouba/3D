import { HOUSE } from '../data/house'
import { useAppStore } from '../store/useAppStore'
import { IconArrowLeft, IconDrag } from './icons'
import { LivingDesignPanel } from './LivingDesignPanel'

const isTouch = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

/** Subtle control guide for the orbit camera. */
function ControlGuide() {
  const touch = isTouch()
  return (
    <div className="glass-panel hidden items-center gap-3 rounded-full px-5 py-3 text-[11px] tracking-[0.08em] text-bone/75 lg:flex">
      <IconDrag className="text-gold-soft" /> {touch ? 'Drag to look · pinch to zoom · two fingers to move' : 'Drag to look · scroll to zoom · right-drag to move'}
    </div>
  )
}

/** Room caption, "Exterior" and (in the living room) the design controls while inside the house. */
export function InteriorPanel() {
  const exitHouse = useAppStore((s) => s.exitHouse)
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
          {roomId === 'living' && <LivingDesignPanel />}
        </div>
        <ControlGuide />
      </div>
    </>
  )
}
