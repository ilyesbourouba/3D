import { useEffect } from 'react'
import { FURNITURE } from '../data/furniture'
import { hotspotById, type HotspotInfo } from '../data/hotspots'
import { HOUSE, roomAt } from '../data/house'
import { useAppStore } from '../store/useAppStore'

function roomName(h: HotspotInfo) {
  if ('placement' in h.target) {
    const id = h.target.placement
    const p = FURNITURE.find((f) => f.id === id)
    return HOUSE.rooms.find((r) => r.id === p?.room)?.name ?? ''
  }
  const [x, y, z] = h.target.box
  return roomAt(y > 3.6 ? 1 : 0, x, z)?.name ?? (z > 7 ? 'Terrace & Pool' : 'Villa Aurelia')
}

/** Elegant information card for the selected object (side panel on desktop, sheet on mobile). */
export function HotspotPanel() {
  const activeId = useAppStore((s) => s.activeHotspot)
  const close = useAppStore((s) => s.closeHotspot)
  const info = hotspotById(activeId)

  useEffect(() => {
    if (!info) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [info, close])

  if (!info) return null
  return (
    <aside
      key={info.id}
      role="dialog"
      aria-labelledby="hotspot-title"
      className="rise-in glass-panel pointer-events-auto fixed inset-x-3 bottom-3 z-30 max-h-[55vh] overflow-y-auto rounded-3xl p-6 sm:inset-x-auto sm:top-1/2 sm:right-6 sm:bottom-auto sm:max-h-[80vh] sm:w-[380px] sm:-translate-y-1/2 sm:p-8"
      style={{ animationDuration: '0.6s', background: 'rgba(14, 12, 11, 0.9)' }}
    >
      <button
        onClick={close}
        aria-label="Close"
        className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full text-bone/70 transition-colors hover:bg-bone/10 hover:text-bone"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      <p className="pr-8 text-[10px] tracking-[0.42em] text-gold-soft/90 uppercase">{roomName(info)}</p>
      <h3 id="hotspot-title" className="mt-2 pr-6 font-display text-[2rem] leading-tight text-bone">
        {info.name}
      </h3>
      <p className="mt-4 text-[13px] leading-relaxed text-bone/80">{info.description}</p>
      <div className="my-6 h-px w-full bg-gradient-to-r from-gold/60 via-bone/15 to-transparent" />
      <dl className="space-y-4 text-[13px]">
        <div>
          <dt className="text-[10px] tracking-[0.32em] text-bone/50 uppercase">Material</dt>
          <dd className="mt-1 leading-relaxed text-bone/90">{info.material}</dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-[0.32em] text-bone/50 uppercase">Design inspiration</dt>
          <dd className="mt-1 font-display text-lg leading-snug text-bone/90 italic">{info.inspiration}</dd>
        </div>
      </dl>
    </aside>
  )
}
