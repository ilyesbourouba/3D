import { useAppStore } from '../store/useAppStore'
import { IconArrowRight, IconDrag, IconPointer, IconZoom } from './icons'

/** Hero copy + "Enter" call to action shown while orbiting the exterior. */
export function ExteriorPanel() {
  const enterHouse = useAppStore((s) => s.enterHouse)
  return (
    <>
      {/* soft scrim so the copy stays legible over bright scenery */}
      <div className="rise-in pointer-events-none fixed inset-x-0 bottom-0 z-[1] h-[60vh] bg-linear-to-t from-ink/75 via-ink/25 to-transparent sm:h-[50vh] sm:from-ink/55" />
      <section className="rise-in pointer-events-none fixed bottom-0 left-0 z-10 max-w-xl p-5 pb-8 sm:p-10 sm:pb-12">
        <p className="text-[10px] tracking-[0.45em] text-gold-soft/90 uppercase sm:text-[11px]">Mediterranean Coast · Private Residence</p>
        <h1 className="mt-3 font-display text-5xl leading-[0.95] font-normal text-bone drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)] sm:text-7xl">
          Promotion Rahmouni
        </h1>
        <p className="mt-4 max-w-md text-[13px] leading-relaxed text-bone/80 sm:text-sm">
          Travertine, oak and glass composed around light. Two levels, three suites and a pool terrace facing the sea.
        </p>
        <dl className="mt-5 flex gap-6 text-bone/85">
          {[
            ['560', 'm² living'],
            ['3', 'suites'],
            ['4', 'baths'],
          ].map(([n, l]) => (
            <div key={l}>
              <dt className="font-display text-2xl leading-none">{n}</dt>
              <dd className="mt-1 text-[10px] tracking-[0.25em] text-bone/55 uppercase">{l}</dd>
            </div>
          ))}
        </dl>
        <button
          onClick={enterHouse}
          className="group pointer-events-auto mt-7 inline-flex items-center gap-3 rounded-full border border-gold/70 bg-ink/30 px-6 py-3 text-[11px] tracking-[0.3em] text-bone uppercase backdrop-blur-md transition-all hover:border-gold hover:bg-gold hover:text-ink"
        >
          Enter the residence
          <IconArrowRight className="transition-transform group-hover:translate-x-1" />
        </button>
      </section>

      <aside className="rise-in pointer-events-none fixed right-0 bottom-0 z-10 hidden p-10 pb-12 md:block" style={{ animationDelay: '0.3s' }}>
        <ul className="glass-panel space-y-2.5 rounded-2xl px-5 py-4 text-[11px] tracking-[0.12em] text-bone/75">
          <li className="flex items-center gap-3"><IconDrag className="text-gold-soft" /> Drag to orbit</li>
          <li className="flex items-center gap-3"><IconZoom className="text-gold-soft" /> Scroll to zoom</li>
          <li className="flex items-center gap-3"><IconPointer className="text-gold-soft" /> Click the house to enter</li>
        </ul>
      </aside>
    </>
  )
}
