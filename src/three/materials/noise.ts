/** Small, fast, tileable noise helpers used by the procedural texture painters. */

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash2(x: number, y: number, seed: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967295
}

const mod = (a: number, n: number) => ((a % n) + n) % n

/**
 * Periodic value noise. `x`, `y` are in lattice units; the pattern repeats every
 * `px` × `py` lattice cells so textures tile seamlessly.
 */
export function vnoise(x: number, y: number, px: number, py: number, seed = 0) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const x0 = mod(xi, px)
  const x1 = mod(xi + 1, px)
  const y0 = mod(yi, py)
  const y1 = mod(yi + 1, py)
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash2(x0, y0, seed)
  const b = hash2(x1, y0, seed)
  const c = hash2(x0, y1, seed)
  const d = hash2(x1, y1, seed)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

/**
 * Tileable fractal noise over normalised texture coords (u, v ∈ [0,1)).
 * `fx`, `fy` = base frequency (integer → seamless), result in [0,1].
 */
export function fbm(u: number, v: number, fx: number, fy: number, octaves = 4, seed = 0) {
  let amp = 0.5
  let sum = 0
  let norm = 0
  let mx = fx
  let my = fy
  for (let i = 0; i < octaves; i++) {
    sum += amp * vnoise(u * mx, v * my, mx, my, seed + i * 17)
    norm += amp
    amp *= 0.5
    mx *= 2
    my *= 2
  }
  return sum / norm
}

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
export const frac = (x: number) => x - Math.floor(x)
