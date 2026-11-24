import { clamp01, fbm, frac, mulberry32, smoothstep, vnoise } from './noise'

/**
 * Procedural PBR texture painters. Each painter fills a colour buffer and (optionally) a
 * height buffer that is later converted into a normal map. All patterns tile seamlessly.
 *
 * Every painter documents the real-world size its texture covers (`tile`, metres) so the
 * material can set `repeat = 1 / tile` and keep physical scale consistent across the house.
 */

export interface Px {
  r: number
  g: number
  b: number
  /** Height 0..1 (only used when the painter declares `height: true`). */
  h: number
  /** Roughness 0..1 (only used when the painter declares `rough: true`). */
  ro: number
}

export interface Painter {
  tile: number
  /** Texture resolution at "high" quality. */
  size: number
  height?: boolean
  rough?: boolean
  normalStrength?: number
  paint: (u: number, v: number, out: Px) => void
}

const set = (o: Px, r: number, g: number, b: number, k = 1) => {
  o.r = r * k
  o.g = g * k
  o.b = b * k
}

/* ---------------------------------------------------- travertine cladding */
// 2.4 m × 2.4 m: 4 courses of 0.6 m, slabs 1.2 m long, running bond.
const travRand = mulberry32(7)
const travTint = Array.from({ length: 64 }, () => [travRand() * 0.1 - 0.05, travRand() * 0.06 - 0.03])
export const stone: Painter = {
  tile: 2.4,
  size: 1024,
  height: true,
  normalStrength: 2.5,
  paint(u, v, o) {
    const rows = 4
    const cols = 2
    const row = Math.floor(v * rows)
    const su = u * cols + (row % 2) * 0.5
    const col = Math.floor(su) % cols
    const fu = frac(su)
    const fv = frac(v * rows)
    const ju = 0.006 / 1.2
    const jv = 0.006 / 0.6
    const joint = fu < ju || fu > 1 - ju || fv < jv || fv > 1 - jv
    const t = travTint[(row * cols + col) % 64]
    const streak = fbm(u, v, 3, 40, 4, 3)
    const vein = fbm(u, v, 6, 90, 3, 9)
    const pit = vnoise(u * 220, v * 640, 220, 640, 21)
    let k = 0.92 + 0.16 * streak + t[0] - 0.08 * smoothstep(0.62, 0.72, vein)
    let h = 0.85 + 0.15 * streak
    if (pit > 0.86) {
      k *= 0.78
      h -= 0.35
    }
    if (joint) {
      k *= 0.72
      h = 0
    }
    set(o, 216 + t[1] * 120, 202 + t[1] * 80, 178, k)
    o.h = h
  },
}

/* ------------------------------------------------------------------ render */
export const render: Painter = {
  tile: 3,
  size: 512,
  height: true,
  normalStrength: 0.6,
  paint(u, v, o) {
    const n = fbm(u, v, 8, 8, 5, 31)
    const k = 0.965 + 0.05 * n
    set(o, 238, 234, 226, k)
    o.h = n
  },
}

/* ------------------------------------------------------------------ timber */
// 1.2 m × 1.2 m: vertical slats 100 mm with 20 mm shadow gaps.
const timRand = mulberry32(5)
const timTint = Array.from({ length: 10 }, () => timRand() * 0.2 - 0.1)
export const timber: Painter = {
  tile: 1.2,
  size: 512,
  height: true,
  normalStrength: 3,
  paint(u, v, o) {
    const slats = 10
    const s = Math.floor(u * slats)
    const fu = frac(u * slats)
    const gap = fu > 0.83
    const grain = fbm(u, v, 80, 3, 4, 41 + s)
    const k = 0.85 + timTint[s] + 0.3 * grain
    if (gap) {
      set(o, 26, 21, 17)
      o.h = 0
    } else {
      set(o, 96, 66, 45, k)
      o.h = 0.9 - 0.15 * Math.abs(fu - 0.41)
    }
  },
}

/* ----------------------------------------------------------------- plaster */
export const plaster: Painter = {
  tile: 4,
  size: 512,
  paint(u, v, o) {
    const n = fbm(u, v, 6, 6, 4, 51)
    set(o, 240, 236, 229, 0.975 + 0.035 * n)
  },
}

/* ------------------------------------------------------------- oak planks */
// 3.6 m square: 18 planks of 0.2 m running along u, random lengths ~1.8 m.
const oakRand = mulberry32(3)
const oakRows = Array.from({ length: 18 }, () => ({ off: oakRand(), tint: oakRand() * 0.16 - 0.08, hue: oakRand() * 0.06 - 0.03 }))
export const oak: Painter = {
  tile: 3.6,
  size: 1024,
  height: true,
  rough: true,
  normalStrength: 1.6,
  paint(u, v, o) {
    const rows = 18
    const r = Math.floor(v * rows)
    const row = oakRows[r]
    const su = u * 2 + row.off
    const plank = Math.floor(su)
    const fu = frac(su)
    const fv = frac(v * rows)
    const seam = fv < 0.012 || fv > 0.988 || fu < 0.003 || fu > 0.997
    const pr = mulberry32(r * 31 + plank)()
    const grain = fbm(u, v, 6, 140, 4, 61 + r)
    const fleck = fbm(u, v, 40, 300, 2, 71)
    const k = 0.86 + row.tint + (pr - 0.5) * 0.12 + 0.26 * grain + 0.05 * fleck
    set(o, 178 + row.hue * 400, 141, 101 - row.hue * 300, k)
    o.h = seam ? 0 : 0.8 + 0.2 * grain
    o.ro = seam ? 0.9 : 0.42 + 0.2 * (1 - grain)
  },
}

/* ---------------------------------------------------------- travertine floor */
// 2.4 m: tiles 1.2 × 0.6 m, honed.
export const travertine: Painter = {
  tile: 2.4,
  size: 1024,
  height: true,
  normalStrength: 1,
  paint(u, v, o) {
    const rows = 4
    const row = Math.floor(v * rows)
    const su = u * 2 + (row % 2) * 0.5
    const fu = frac(su)
    const fv = frac(v * rows)
    const joint = fu < 0.002 || fu > 0.998 || fv < 0.004 || fv > 0.996
    const tile = (row * 2 + Math.floor(su)) % 8
    const streak = fbm(u, v, 4, 28, 4, 81 + tile)
    const k = 0.93 + 0.1 * streak + (tile % 3) * 0.012
    set(o, 226, 214, 194, k)
    if (joint) set(o, 190, 180, 162)
    o.h = joint ? 0 : 1
  },
}

/* ------------------------------------------------------------------ marble */
// Calacatta-style: warm white with grey/gold veins. 2.4 m.
export const marble: Painter = {
  tile: 2.4,
  size: 1024,
  rough: true,
  paint(u, v, o) {
    const w = fbm(u, v, 3, 3, 5, 91)
    const w2 = fbm(u, v, 5, 5, 4, 97)
    const t = Math.sin((u * 2 + v * 3 + w * 2.4) * Math.PI * 2)
    const t2 = Math.sin((u * 4 - v * 1 + w2 * 3.2) * Math.PI * 2)
    const vein = 1 - smoothstep(0.0, 0.07, Math.abs(t))
    const fine = 1 - smoothstep(0.0, 0.025, Math.abs(t2))
    const cloud = fbm(u, v, 10, 10, 4, 99)
    const base = 0.95 + 0.05 * cloud
    const d = clamp01(vein * 0.55 + fine * 0.3)
    o.r = (243 * base) * (1 - d) + 150 * d
    o.g = (241 * base) * (1 - d) + 140 * d
    o.b = (237 * base) * (1 - d) + 126 * d
    o.ro = 0.12 + 0.08 * cloud
  },
}

/* ------------------------------------------------------------------ walnut */
// Book-matched veneer panels 0.6 m wide, vertical grain. 2.4 m.
export const walnut: Painter = {
  tile: 2.4,
  size: 512,
  height: true,
  normalStrength: 0.8,
  paint(u, v, o) {
    const panels = 4
    const p = Math.floor(u * panels)
    const fu = frac(u * panels)
    const mu = p % 2 === 0 ? fu : 1 - fu // book-matching
    const grain = fbm(mu / panels, v, 30, 3, 5, 111)
    const figure = Math.sin((mu * 9 + grain * 3) * Math.PI)
    const k = 0.75 + 0.35 * grain + 0.08 * figure
    set(o, 92, 60, 40, k)
    const seam = fu < 0.003 || fu > 0.997
    o.h = seam ? 0 : 1
  },
}

/* ------------------------------------------------------------------ paving */
// 2 m: 1 × 1 m limestone slabs.
export const paving: Painter = {
  tile: 2,
  size: 512,
  height: true,
  normalStrength: 2,
  paint(u, v, o) {
    const fu = frac(u * 2)
    const fv = frac(v * 2)
    const joint = fu < 0.004 || fu > 0.996 || fv < 0.004 || fv > 0.996
    const id = Math.floor(u * 2) + Math.floor(v * 2) * 2
    const n = fbm(u, v, 12, 12, 4, 121 + id)
    const k = 0.9 + 0.12 * n + id * 0.01
    set(o, 214, 206, 190, k)
    if (joint) set(o, 150, 142, 128)
    o.h = joint ? 0 : 0.8 + 0.2 * n
  },
}

/* -------------------------------------------------------------- teak deck */
// 2.8 m: 20 boards of 0.14 m along u.
const deckRand = mulberry32(13)
const deckRows = Array.from({ length: 20 }, () => ({ off: deckRand(), tint: deckRand() * 0.18 - 0.09 }))
export const deck: Painter = {
  tile: 2.8,
  size: 512,
  height: true,
  normalStrength: 2.5,
  paint(u, v, o) {
    const rows = 20
    const r = Math.floor(v * rows)
    const fv = frac(v * rows)
    const fu = frac(u * 1.5 + deckRows[r].off)
    const gap = fv > 0.94 || fu < 0.004
    const grain = fbm(u, v, 5, 160, 4, 131 + r)
    const k = 0.82 + deckRows[r].tint + 0.25 * grain
    if (gap) set(o, 40, 30, 22)
    else set(o, 150, 108, 74, k)
    o.h = gap ? 0 : 1
  },
}

/* --------------------------------------------------------------- pool tile */
// 1 m: 25 mm glass mosaic.
const poolRand = mulberry32(17)
const poolTints = Array.from({ length: 1600 }, () => poolRand())
export const poolTile: Painter = {
  tile: 1,
  size: 512,
  height: true,
  normalStrength: 2,
  paint(u, v, o) {
    const n = 40
    const cx = Math.floor(u * n)
    const cy = Math.floor(v * n)
    const fu = frac(u * n)
    const fv = frac(v * n)
    const grout = fu < 0.08 || fv < 0.08
    const t = poolTints[(cy * n + cx) % 1600]
    if (grout) set(o, 214, 220, 218)
    else set(o, 38 + t * 30, 132 + t * 40, 150 + t * 30)
    o.h = grout ? 0 : 1
  },
}

/* ------------------------------------------------------------------ gravel */
export const gravel: Painter = {
  tile: 1.5,
  size: 512,
  height: true,
  normalStrength: 3,
  paint(u, v, o) {
    const cells = vnoise(u * 90, v * 90, 90, 90, 141)
    const fine = fbm(u, v, 60, 60, 3, 151)
    const k = 0.75 + 0.35 * cells + 0.15 * fine
    set(o, 196, 186, 168, k)
    o.h = cells * 0.7 + fine * 0.3
  },
}

/* ------------------------------------------------------------------- grass */
export const grass: Painter = {
  tile: 4,
  size: 512,
  height: true,
  normalStrength: 1.5,
  paint(u, v, o) {
    const blades = fbm(u, v, 128, 128, 2, 161)
    const clump = fbm(u, v, 12, 12, 4, 171)
    // near-neutral luminance detail; the hue comes from the terrain's vertex colours
    const k = 0.62 + 0.38 * blades + 0.2 * clump
    o.r = 214 * k + clump * 14
    o.g = 222 * k
    o.b = 190 * k
    o.h = blades
  },
}

/* ------------------------------------------------------------------- cliff */
export const cliff: Painter = {
  tile: 10,
  size: 512,
  height: true,
  normalStrength: 4,
  paint(u, v, o) {
    const n = fbm(u, v, 6, 3, 6, 181)
    const strata = Math.sin(v * Math.PI * 2 * 14 + n * 6) * 0.5 + 0.5
    const k = 0.65 + 0.35 * n + 0.1 * strata
    set(o, 168, 152, 128, k)
    o.h = n * 0.7 + strata * 0.3
  },
}

/* ---------------------------------------------------------------- concrete */
// 3 m: board-formed concrete, 150 mm boards.
export const concrete: Painter = {
  tile: 3,
  size: 512,
  height: true,
  normalStrength: 1.2,
  paint(u, v, o) {
    const boards = 20
    const b = Math.floor(v * boards)
    const fv = frac(v * boards)
    const grain = fbm(u, v, 4, 120, 4, 191 + b)
    const blot = fbm(u, v, 6, 6, 4, 201)
    const line = fv < 0.03 ? 0.88 : 1
    const k = (0.85 + 0.1 * grain + 0.1 * blot) * line
    set(o, 190, 186, 179, k)
    o.h = (fv < 0.03 ? 0.3 : 0.8) + 0.2 * grain
  },
}

/* ------------------------------------------------------------------- water */
// Height field only — converted to a normal map for the animated pool surface.
export const waterWaves: Painter = {
  tile: 3,
  size: 512,
  height: true,
  normalStrength: 3,
  paint(u, v, o) {
    const n = fbm(u, v, 4, 4, 5, 211)
    const n2 = fbm(u, v, 9, 9, 3, 221)
    set(o, 128, 128, 255)
    o.h = n * 0.7 + n2 * 0.3
  },
}

/* ------------------------------------------------------------------- weave */
// Upholstery weave (normal map only), 0.25 m. Bouclé-like nubby texture.
export const weave: Painter = {
  tile: 0.25,
  size: 256,
  height: true,
  normalStrength: 2.2,
  paint(u, v, o) {
    const warp = Math.sin(u * Math.PI * 2 * 48) * 0.5 + 0.5
    const weft = Math.sin(v * Math.PI * 2 * 48) * 0.5 + 0.5
    const nub = vnoise(u * 96, v * 96, 96, 96, 231)
    set(o, 255, 255, 255)
    o.h = warp * 0.35 + weft * 0.35 + nub * 0.6
  },
}

/* --------------------------------------------------------------------- rug */
// Hand-knotted wool rug (covers the whole rug: tile 1 = the rug's own 0..1 UVs).
export const rug: Painter = {
  tile: 1,
  size: 1024,
  height: true,
  normalStrength: 1.4,
  paint(u, v, o) {
    const wool = fbm(u, v, 120, 120, 3, 241)
    const cloud = fbm(u, v, 4, 4, 4, 251)
    const edge = Math.min(u, v, 1 - u, 1 - v)
    const border = edge < 0.06 && edge > 0.045 ? 1 : 0
    const field = 0.88 + 0.08 * cloud + 0.1 * wool
    let r = 214 * field
    let g = 204 * field
    let b = 188 * field
    if (border) {
      r *= 0.72
      g *= 0.68
      b *= 0.62
    }
    if (edge < 0.012) {
      r *= 0.9
      g *= 0.9
      b *= 0.9
    }
    o.r = r
    o.g = g
    o.b = b
    o.h = wool
  },
}
