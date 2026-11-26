import { useEffect, useRef, useState } from 'react'
import { LIVING_STYLES, WALL_COLORS, type LivingStyle } from '../three/materials/livingDesign'
import { useAppStore } from '../store/useAppStore'

type Menu = 'wall' | 'style' | null

/** Living room only: two buttons to repaint the walls and switch the interior style. */
export function LivingDesignPanel() {
  const [open, setOpen] = useState<Menu>(null)
  const style = useAppStore((s) => s.livingStyle)
  const wall = useAppStore((s) => s.livingWall)
  const setStyle = useAppStore((s) => s.setLivingStyle)
  const setWall = useAppStore((s) => s.setLivingWall)
  const root = useRef<HTMLDivElement>(null)
  const current = WALL_COLORS.find((c) => c.id === wall) ?? WALL_COLORS[0]

  // close on outside click or Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = (m: Exclude<Menu, null>) => setOpen((o) => (o === m ? null : m))
  const btn = (active: boolean) =>
    `inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[10px] tracking-[0.25em] uppercase transition-colors ${active ? 'bg-bone/90 text-ink' : 'text-bone/75 hover:text-bone'}`

  return (
    <div ref={root} className="relative">
      {open === 'wall' && (
        <div className="glass-panel rise-in absolute bottom-full left-0 mb-2 w-64 rounded-2xl p-4" role="radiogroup" aria-label="Wall colour">
          <p className="text-[10px] tracking-[0.3em] text-gold-soft uppercase">Wall colour</p>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {WALL_COLORS.map((c) => (
              <button
                key={c.id}
                role="radio"
                aria-checked={wall === c.id}
                aria-label={c.name}
                title={c.name}
                onClick={() => setWall(c.id)}
                className={`h-8 w-8 rounded-full border transition-transform hover:scale-110 ${wall === c.id ? 'border-gold ring-2 ring-gold/70 ring-offset-2 ring-offset-ink' : 'border-bone/30'}`}
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-bone/80">{current.name}</p>
        </div>
      )}
      {open === 'style' && (
        <div className="glass-panel rise-in absolute bottom-full left-0 mb-2 w-72 rounded-2xl p-2" role="radiogroup" aria-label="Living room style">
          <p className="px-3 pt-2 pb-1 text-[10px] tracking-[0.3em] text-gold-soft uppercase">Living room style</p>
          {(Object.keys(LIVING_STYLES) as LivingStyle[]).map((id) => {
            const s = LIVING_STYLES[id]
            const on = style === id
            return (
              <button
                key={id}
                role="radio"
                aria-checked={on}
                onClick={() => setStyle(id)}
                className={`block w-full rounded-xl px-3 py-2 text-left transition-colors ${on ? 'bg-bone/90 text-ink' : 'text-bone hover:bg-bone/10'}`}
              >
                <span className="block font-display text-lg leading-tight">{s.name}</span>
                <span className={`block text-[11px] ${on ? 'text-ink/70' : 'text-bone/60'}`}>{s.description}</span>
              </button>
            )
          })}
        </div>
      )}
      <div className="glass-panel inline-flex rounded-full p-1">
        <button className={btn(open === 'wall')} onClick={() => toggle('wall')} aria-expanded={open === 'wall'}>
          <span className="h-3 w-3 rounded-full border border-bone/40" style={{ backgroundColor: current.color }} aria-hidden />
          Wall colour
        </button>
        <button className={btn(open === 'style')} onClick={() => toggle('style')} aria-expanded={open === 'style'}>
          Style
        </button>
      </div>
    </div>
  )
}
