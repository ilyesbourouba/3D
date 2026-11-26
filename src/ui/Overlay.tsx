import { useAppStore } from '../store/useAppStore'
import { ExteriorPanel } from './ExteriorPanel'
import { HelpOverlay } from './HelpOverlay'
import { HotspotPanel } from './HotspotPanel'
import { InteriorPanel } from './InteriorPanel'
import { NavPanel } from './NavPanel'
import { Toast } from './Toast'
import { TopBar } from './TopBar'
import { useShortcuts } from './useShortcuts'

/** Black veil that masks camera cuts between rooms. */
function Fade() {
  const fading = useAppStore((s) => s.fading)
  return <div className={`pointer-events-none fixed inset-0 z-40 bg-ink transition-opacity duration-300 ${fading ? 'opacity-100' : 'opacity-0'}`} aria-hidden />
}

/** Composes the 2D interface above the canvas according to the current phase. */
export function Overlay() {
  const phase = useAppStore((s) => s.phase)
  useShortcuts()
  if (phase === 'loading') return null
  return (
    <>
      <TopBar />
      {phase === 'exterior' && (
        <>
          <ExteriorPanel />
          <NavPanel />
        </>
      )}
      {phase === 'interior' && (
        <>
          <InteriorPanel />
          <NavPanel />
          <HotspotPanel />
        </>
      )}
      {(phase === 'entering' || phase === 'exiting') && (
        <div className="rise-in pointer-events-none fixed inset-x-0 bottom-10 z-10 text-center text-[10px] tracking-[0.5em] text-bone/70 uppercase">
          {phase === 'entering' ? 'Entering the residence' : 'Returning outside'}
        </div>
      )}
      <HelpOverlay />
      <Toast />
      <Fade />
    </>
  )
}
