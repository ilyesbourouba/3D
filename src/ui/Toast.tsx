import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

/** Brief, unobtrusive notice (auto-dismisses after a few seconds). */
export function Toast() {
  const notice = useAppStore((s) => s.notice)
  const notify = useAppStore((s) => s.notify)
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => notify(null), 4500)
    return () => clearTimeout(t)
  }, [notice, notify])
  if (!notice) return null
  return (
    <div className="rise-in pointer-events-none fixed inset-x-0 top-20 z-30 flex justify-center px-4" role="status" aria-live="polite">
      <div className="glass-panel rounded-full px-4 py-2 text-[11px] tracking-[0.08em] text-bone/90">{notice}</div>
    </div>
  )
}
