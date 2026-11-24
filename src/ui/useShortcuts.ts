import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

export function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.()
  else document.documentElement.requestFullscreen?.().catch(() => undefined)
}

/** Global keyboard shortcuts: M map, V view mode, F fullscreen, H / ? help, Esc close. */
export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const s = useAppStore.getState()
      switch (e.code) {
        case 'KeyM':
          s.setNavOpen(!s.navOpen)
          break
        case 'KeyV':
          if (s.phase === 'interior') s.setNavMode(s.navMode === 'walk' ? 'orbit' : 'walk')
          break
        case 'KeyF':
          toggleFullscreen()
          break
        case 'KeyH':
        case 'Slash':
          s.setHelpOpen(!s.helpOpen)
          break
        case 'Escape':
          if (s.helpOpen) s.setHelpOpen(false)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
