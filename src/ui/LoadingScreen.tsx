import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'

/** Full-screen branded loader. Fades out once the 3D scene has rendered its first frames. */
export function LoadingScreen() {
  const progress = useAppStore((s) => s.loadProgress)
  const label = useAppStore((s) => s.loadLabel)
  const ready = useAppStore((s) => s.sceneReady)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setGone(true), 1400)
    return () => clearTimeout(t)
  }, [ready])

  if (gone) return null
  const pct = Math.round((ready ? 1 : progress) * 100)

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink transition-opacity duration-[1200ms] ease-out ${ready ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-7 px-6 text-center">
        <svg width="44" height="44" viewBox="0 0 32 32" aria-hidden className="text-gold">
          <path d="M5 26 16 6l11 20" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M10.5 26V17.5h11V26" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        </svg>
        <div>
          <p className="text-[11px] tracking-[0.5em] text-sand/70 uppercase">Private Residence</p>
          <h1 className="mt-3 font-display text-5xl font-normal tracking-wide text-bone sm:text-6xl">Villa Aurelia</h1>
        </div>
        <div className="mt-4 w-64 sm:w-80">
          <div className="relative h-px w-full overflow-hidden bg-bone/10">
            <div className="absolute inset-y-0 left-0 bg-gold transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 flex justify-between text-[11px] tracking-[0.2em] text-bone/50 uppercase">
            <span>{ready ? 'Welcome' : label}</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
