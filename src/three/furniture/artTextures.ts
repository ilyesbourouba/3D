import * as THREE from 'three'
import { mulberry32 } from '../materials/noise'

/**
 * Original abstract artworks painted procedurally on a canvas (no external images).
 * Each variant is cached; the texture covers the whole canvas face (0..1 UVs).
 */

export type ArtVariant = 'fields' | 'enso' | 'horizon' | 'arches'

const cache = new Map<ArtVariant, THREE.CanvasTexture>()

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

/** Linen-like ground with a little grain. */
function ground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, seed: number) {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
  const r = mulberry32(seed)
  ctx.globalAlpha = 0.05
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = r() > 0.5 ? '#000' : '#fff'
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1)
  }
  ctx.globalAlpha = 1
}

/** Soft-edged colour fields stacked vertically. */
function fields() {
  const [c, ctx] = canvas(768, 1024)
  ground(ctx, 768, 1024, '#e8dccb', 1)
  const blocks: [number, number, string][] = [
    [0.08, 0.38, '#b5643f'],
    [0.42, 0.62, '#d7a66d'],
    [0.66, 0.92, '#7a3f2c'],
  ]
  ctx.filter = 'blur(14px)'
  for (const [y0, y1, col] of blocks) {
    ctx.fillStyle = col
    ctx.globalAlpha = 0.9
    ctx.fillRect(768 * 0.1, 1024 * y0, 768 * 0.8, 1024 * (y1 - y0))
  }
  ctx.filter = 'none'
  ctx.globalAlpha = 1
  return c
}

/** A single brush circle on off-white paper. */
function enso() {
  const [c, ctx] = canvas(1024, 1024)
  ground(ctx, 1024, 1024, '#f0ebe1', 2)
  const r = mulberry32(5)
  ctx.lineCap = 'round'
  for (let pass = 0; pass < 26; pass++) {
    ctx.beginPath()
    const off = (r() - 0.5) * 18
    const start = -0.3 + r() * 0.1
    const end = Math.PI * 1.85 + r() * 0.15
    ctx.strokeStyle = `rgba(28, 26, 24, ${0.06 + r() * 0.08})`
    ctx.lineWidth = 30 + r() * 40
    ctx.arc(512 + off, 512 + off * 0.5, 300 + (r() - 0.5) * 20, start, end)
    ctx.stroke()
  }
  return c
}

/** Layered landscape bands in earth and sea tones. */
function horizon() {
  const [c, ctx] = canvas(1536, 768)
  ground(ctx, 1536, 768, '#ded4c3', 3)
  const bands = ['#c9b79a', '#9fa49a', '#6f8790', '#d3c4aa', '#a2836a']
  const r = mulberry32(9)
  let y = 120
  ctx.filter = 'blur(3px)'
  for (const col of bands) {
    const h = 70 + r() * 90
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= 1536; x += 64) ctx.lineTo(x, y + Math.sin(x * 0.004 + r() * 6) * 14)
    ctx.lineTo(1536, y + h)
    ctx.lineTo(0, y + h)
    ctx.fill()
    y += h + 12
  }
  ctx.filter = 'none'
  return c
}

/** Overlapping arches, a nod to Mediterranean architecture. */
function arches() {
  const [c, ctx] = canvas(768, 1024)
  ground(ctx, 768, 1024, '#efe6d8', 4)
  const cols = ['#c27a55', '#e0b48a', '#5e6e63']
  cols.forEach((col, i) => {
    ctx.fillStyle = col
    ctx.globalAlpha = 0.88
    const x = 150 + i * 150
    const w = 300
    const top = 260 + i * 90
    ctx.beginPath()
    ctx.moveTo(x, 900)
    ctx.lineTo(x, top + w / 2)
    ctx.arc(x + w / 2, top + w / 2, w / 2, Math.PI, 0)
    ctx.lineTo(x + w, 900)
    ctx.closePath()
    ctx.fill()
  })
  ctx.globalAlpha = 1
  return c
}

const PAINT: Record<ArtVariant, () => HTMLCanvasElement> = { fields, enso, horizon, arches }

export function artTexture(variant: ArtVariant) {
  let t = cache.get(variant)
  if (!t) {
    t = new THREE.CanvasTexture(PAINT[variant]())
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    cache.set(variant, t)
  }
  return t
}
