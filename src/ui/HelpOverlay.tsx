import { useAppStore } from '../store/useAppStore'

function Row({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-bone/75">{label}</span>
      <span className="flex gap-1">
        {keys.map((k) => (
          <kbd key={k} className="inline-grid h-6 min-w-6 place-items-center rounded border border-bone/25 px-1.5 text-[10px] text-bone/90">
            {k}
          </kbd>
        ))}
      </span>
    </div>
  )
}

/** Control guide (opened with "?" or H). */
export function HelpOverlay() {
  const open = useAppStore((s) => s.helpOpen)
  const setOpen = useAppStore((s) => s.setHelpOpen)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-labelledby="help-title"
        className="rise-in w-full max-w-2xl rounded-3xl border border-bone/12 p-6 sm:p-8"
        style={{ background: 'rgba(14, 12, 11, 0.92)', animationDuration: '0.5s' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] tracking-[0.42em] text-gold-soft/90 uppercase">Guide</p>
            <h2 id="help-title" className="mt-1 font-display text-3xl text-bone">
              Exploring Promotion Rahmouni
            </h2>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-bone/70 hover:bg-bone/10 hover:text-bone">
            ×
          </button>
        </div>
        <div className="mt-6 grid gap-8 text-[13px] sm:grid-cols-2">
          <section>
            <h3 className="mb-2 text-[10px] tracking-[0.32em] text-bone/50 uppercase">Keyboard & mouse</h3>
            <Row keys={['Drag']} label="Look around" />
            <Row keys={['Right-drag']} label="Move around the room" />
            <Row keys={['Wheel']} label="Zoom in / out" />
            <Row keys={['Click']} label="Open a ◉ marker" />
            <Row keys={['Esc']} label="Close" />
            <Row keys={['M']} label="Map & rooms" />
            <Row keys={['F']} label="Fullscreen" />
            <Row keys={['H']} label="This guide" />
          </section>
          <section>
            <h3 className="mb-2 text-[10px] tracking-[0.32em] text-bone/50 uppercase">Touch</h3>
            <p className="py-1.5 text-bone/75">Drag with one finger to look around.</p>
            <p className="py-1.5 text-bone/75">Pinch to zoom, drag with two fingers to move.</p>
            <p className="py-1.5 text-bone/75">Tap a ◉ marker to learn about an object.</p>
            <h3 className="mt-5 mb-2 text-[10px] tracking-[0.32em] text-bone/50 uppercase">Good to know</h3>
            <p className="py-1.5 text-bone/75">Pick a room on the map to go straight there.</p>
            <p className="py-1.5 text-bone/75">The camera circles the room without passing through walls.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
