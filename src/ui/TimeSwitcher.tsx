import type { ReactNode } from 'react'
import { useAppStore, type TimeOfDay } from '../store/useAppStore'

const OPTIONS: { id: TimeOfDay; label: string; icon: ReactNode }[] = [
  {
    id: 'midday',
    label: 'Midday',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
      </svg>
    ),
  },
  {
    id: 'golden',
    label: 'Golden hour',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M5 17a7 7 0 0 1 14 0" />
        <path d="M2 17h20M12 6v2.5M4.6 9.6l1.7 1.7M19.4 9.6l-1.7 1.7M5 21h14" />
      </svg>
    ),
  },
  {
    id: 'dusk',
    label: 'Dusk',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
    ),
  },
]

/** Lighting mood selector; the change is masked by a short fade. */
export function TimeSwitcher() {
  const time = useAppStore((s) => s.timeOfDay)
  const change = (t: TimeOfDay) => {
    const s = useAppStore.getState()
    if (t === s.timeOfDay || s.fading) return
    s.setFading(true)
    setTimeout(() => {
      useAppStore.getState().setTimeOfDay(t)
      setTimeout(() => useAppStore.getState().setFading(false), 300)
    }, 320)
  }
  return (
    <div className="glass-panel flex items-center rounded-full p-1" role="radiogroup" aria-label="Time of day">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={time === o.id}
          aria-label={o.label}
          title={o.label}
          onClick={() => change(o.id)}
          className={`grid h-7 w-8 place-items-center rounded-full transition-colors ${time === o.id ? 'bg-bone/90 text-ink' : 'text-bone/70 hover:text-bone'}`}
        >
          {o.icon}
        </button>
      ))}
    </div>
  )
}
