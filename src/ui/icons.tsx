/** Minimal line icons (1.25px stroke) used by the overlay UI. */
type P = { className?: string }
const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const IconExpand = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
)
export const IconCollapse = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
  </svg>
)
export const IconArrowRight = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M4 12h15M14 7l5 5-5 5" />
  </svg>
)
export const IconArrowLeft = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M20 12H5M10 7l-5 5 5 5" />
  </svg>
)
export const IconDrag = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M12 3v18M3 12h18M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5" />
  </svg>
)
export const IconZoom = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5M8.5 11h5M11 8.5v5" />
  </svg>
)
export const IconPointer = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M6 3l12 7-5.5 1.5L10 17z" />
  </svg>
)
