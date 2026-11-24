import { create } from 'zustand'

/**
 * App-wide state. 3D components read it with selectors; UI components call the actions.
 *
 * Phase lifecycle:
 *   loading → exterior ⇄ (entering → interior → exiting) → exterior
 */
export type Phase = 'loading' | 'exterior' | 'entering' | 'interior' | 'exiting'
export type Quality = 'high' | 'medium' | 'low'
/** Inside the house: first-person walking or a free orbit camera around the current spot. */
export type NavMode = 'walk' | 'orbit'
export type TimeOfDay = 'golden' | 'midday' | 'dusk'

interface AppState {
  phase: Phase
  quality: Quality
  /** 0..1 progress of asset preparation, shown by the loading screen. */
  loadProgress: number
  loadLabel: string
  /** True once the 3D scene has rendered its first frames. */
  sceneReady: boolean
  currentRoomId: string | null
  /** Room the camera should travel to next (handled by the camera rig). */
  pendingRoomId: string | null
  /** Leave the house once the pending room travel (to the hall) completes. */
  exitAfterTravel: boolean
  /** Full-screen fade used to mask camera cuts between rooms. */
  fading: boolean
  navMode: NavMode
  /** Hotspot under the pointer / crosshair, and the one whose info panel is open. */
  hoveredHotspot: string | null
  activeHotspot: string | null
  /** Room the visitor is being guided to (walking autopilot), if any. */
  travelTo: string | null
  /** Room to travel to as soon as the entry flight lands inside. */
  travelAfterEnter: string | null
  /** Navigation panel (map + rooms) and help overlay visibility. */
  navOpen: boolean
  helpOpen: boolean
  timeOfDay: TimeOfDay
  /** Short message shown as a toast (e.g. automatic quality change). */
  notice: string | null

  setLoad: (progress: number, label: string) => void
  setSceneReady: () => void
  setQuality: (q: Quality) => void
  setPhase: (p: Phase) => void
  setCurrentRoom: (id: string | null) => void
  enterHouse: () => void
  exitHouse: () => void
  goToRoom: (id: string) => void
  setFading: (f: boolean) => void
  setNavMode: (m: NavMode) => void
  setHoveredHotspot: (id: string | null) => void
  openHotspot: (id: string) => void
  closeHotspot: () => void
  /** Cut straight to the room being travelled to (fade). */
  skipTravel: () => void
  cancelTravel: () => void
  setNavOpen: (open: boolean) => void
  setHelpOpen: (open: boolean) => void
  setTimeOfDay: (t: TimeOfDay) => void
  notify: (msg: string | null) => void
}

/** Visitor asked the OS to minimise motion: shorter flights, no idle drift or head bob. */
export const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const QUALITY_KEY = 'aurelia.quality'
const TIME_KEY = 'aurelia.time'

function initialTime(): TimeOfDay {
  try {
    const t = localStorage.getItem(TIME_KEY)
    if (t === 'golden' || t === 'midday' || t === 'dusk') return t
  } catch {
    /* storage unavailable */
  }
  return 'golden'
}

function initialQuality(): Quality {
  if (typeof window === 'undefined') return 'high'
  try {
    const saved = localStorage.getItem(QUALITY_KEY)
    if (saved === 'high' || saved === 'medium' || saved === 'low') return saved
  } catch {
    /* storage unavailable (private mode) */
  }
  const coarse = window.matchMedia?.('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency ?? 4
  if (coarse && cores <= 4) return 'low'
  if (coarse) return 'medium'
  return 'high'
}

export const useAppStore = create<AppState>((set, get) => ({
  phase: 'loading',
  quality: initialQuality(),
  loadProgress: 0,
  loadLabel: 'Preparing',
  sceneReady: false,
  currentRoomId: null,
  pendingRoomId: null,
  exitAfterTravel: false,
  fading: false,
  navMode: 'walk',
  hoveredHotspot: null,
  activeHotspot: null,
  travelTo: null,
  travelAfterEnter: null,
  navOpen: false,
  helpOpen: false,
  timeOfDay: initialTime(),
  notice: null,

  setLoad: (loadProgress, loadLabel) => set({ loadProgress, loadLabel }),
  setSceneReady: () => set({ sceneReady: true, phase: get().phase === 'loading' ? 'exterior' : get().phase }),
  setQuality: (quality) => {
    try {
      localStorage.setItem(QUALITY_KEY, quality)
    } catch {
      /* storage unavailable */
    }
    set({ quality })
  },
  setPhase: (phase) => set({ phase }),
  setCurrentRoom: (currentRoomId) => set({ currentRoomId }),
  enterHouse: () => {
    if (get().phase === 'exterior') set({ phase: 'entering' })
  },
  exitHouse: () => {
    const s = get()
    if (s.phase !== 'interior' || s.pendingRoomId) return
    // the exit flight starts from the hall; travel there first from any other room
    if (s.currentRoomId !== 'hall') set({ pendingRoomId: 'hall', exitAfterTravel: true, travelTo: null, activeHotspot: null, hoveredHotspot: null })
    else set({ phase: 'exiting', activeHotspot: null, hoveredHotspot: null })
  },
  goToRoom: (id) => {
    const s = get()
    // from outside: fly in first, then walk to the room
    if (s.phase === 'exterior') {
      set({ travelAfterEnter: id === 'hall' ? null : id, phase: 'entering' })
      return
    }
    if (s.phase !== 'interior' || s.pendingRoomId || (s.currentRoomId === id && !s.travelTo)) return
    set({ travelTo: id, navMode: 'walk', activeHotspot: null, hoveredHotspot: null })
  },
  skipTravel: () => {
    const t = get().travelTo
    if (t) set({ travelTo: null, pendingRoomId: t })
  },
  cancelTravel: () => set({ travelTo: null }),
  setNavOpen: (navOpen) => set({ navOpen }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  setTimeOfDay: (timeOfDay) => {
    try {
      localStorage.setItem(TIME_KEY, timeOfDay)
    } catch {
      /* storage unavailable */
    }
    set({ timeOfDay })
  },
  notify: (notice) => set({ notice }),
  setFading: (fading) => set({ fading }),
  setNavMode: (navMode) => set({ navMode }),
  setHoveredHotspot: (hoveredHotspot) => {
    if (get().hoveredHotspot !== hoveredHotspot) set({ hoveredHotspot })
  },
  openHotspot: (activeHotspot) => set({ activeHotspot }),
  closeHotspot: () => set({ activeHotspot: null }),
}))
