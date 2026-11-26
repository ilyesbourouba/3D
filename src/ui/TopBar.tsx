import { useEffect, useState } from 'react'
import { useAppStore, type Quality } from '../store/useAppStore'
import { IconCollapse, IconExpand } from './icons'
import { TimeSwitcher } from './TimeSwitcher'
import { toggleFullscreen } from './useShortcuts'

function useFullscreen() {
  const [on, setOn] = useState(!!document.fullscreenElement)
  useEffect(() => {
    const f = () => setOn(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', f)
    return () => document.removeEventListener('fullscreenchange', f)
  }, [])
  const toggle = toggleFullscreen
  const supported = typeof document.documentElement.requestFullscreen === 'function'
  return { on, toggle, supported }
}

const QUALITIES: { id: Quality; label: string }[] = [
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Med' },
  { id: 'low', label: 'Low' },
]

/** Brand mark (left) and global controls: render quality + fullscreen (right). */
export function TopBar() {
  const quality = useAppStore((s) => s.quality)
  const setQuality = useAppStore((s) => s.setQuality)
  const fs = useFullscreen()

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between p-4 sm:p-6">
      <div className="pointer-events-auto flex items-center gap-3">
        <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden className="text-gold">
          <path d="M5 26 16 6l11 20" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <div className="leading-none">
          <div className="text-[12px] font-semibold tracking-[0.42em] text-bone">RAHMOUNI</div>
          <div className="mt-1 text-[9px] tracking-[0.36em] text-bone/55 uppercase">Promotion</div>
        </div>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        <TimeSwitcher />
        <div className="glass-panel hidden items-center rounded-full p-1 md:flex" role="radiogroup" aria-label="Render quality">
          {QUALITIES.map((q) => (
            <button
              key={q.id}
              role="radio"
              aria-checked={quality === q.id}
              onClick={() => setQuality(q.id)}
              className={`rounded-full px-3 py-1 text-[10px] tracking-[0.2em] uppercase transition-colors ${
                quality === q.id ? 'bg-bone/90 text-ink' : 'text-bone/70 hover:text-bone'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => useAppStore.getState().setHelpOpen(true)}
          className="glass-panel grid h-9 w-9 place-items-center rounded-full text-[13px] text-bone/85 transition-colors hover:text-bone"
          aria-label="Controls guide"
          title="Controls guide (H)"
        >
          ?
        </button>
        {fs.supported && (
          <button
            onClick={fs.toggle}
            className="glass-panel grid h-9 w-9 place-items-center rounded-full text-bone/85 transition-colors hover:text-bone"
            aria-label={fs.on ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={fs.on ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fs.on ? <IconCollapse /> : <IconExpand />}
          </button>
        )}
      </div>
    </header>
  )
}
