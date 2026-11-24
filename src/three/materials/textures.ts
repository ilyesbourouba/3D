import * as THREE from 'three'
import type { Quality } from '../../store/useAppStore'
import * as P from './painters'
import type { Painter, Px } from './painters'

export type TextureName = keyof typeof PAINTERS

const PAINTERS = {
  stone: P.stone,
  render: P.render,
  timber: P.timber,
  plaster: P.plaster,
  oak: P.oak,
  travertine: P.travertine,
  marble: P.marble,
  walnut: P.walnut,
  paving: P.paving,
  deck: P.deck,
  poolTile: P.poolTile,
  gravel: P.gravel,
  grass: P.grass,
  cliff: P.cliff,
  concrete: P.concrete,
  waterWaves: P.waterWaves,
  weave: P.weave,
  rug: P.rug,
} satisfies Record<string, Painter>

export interface TextureSet {
  map?: THREE.Texture
  normalMap?: THREE.Texture
  roughnessMap?: THREE.Texture
  /** Real-world size covered by one repeat, metres. */
  tile: number
}

const cache = new Map<TextureName, TextureSet>()

function toCanvas(size: number, data: Uint8ClampedArray) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  c.getContext('2d')!.putImageData(new ImageData(data as Uint8ClampedArray<ArrayBuffer>, size, size), 0, 0)
  return c
}

function heightToNormal(h: Float32Array, size: number, strength: number) {
  const out = new Uint8ClampedArray(size * size * 4)
  const s = strength * (size / 512)
  for (let y = 0; y < size; y++) {
    const ym = ((y - 1 + size) % size) * size
    const yp = ((y + 1) % size) * size
    const yr = y * size
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size
      const xp = (x + 1) % size
      const dx = (h[yr + xp] - h[yr + xm]) * s
      // canvas y grows downward while texture v grows upward → flip dy
      const dy = (h[yp + x] - h[ym + x]) * s
      let nx = -dx
      let ny = dy
      let nz = 1
      const l = Math.hypot(nx, ny, nz)
      nx /= l
      ny /= l
      nz /= l
      const i = (yr + x) * 4
      out[i] = (nx * 0.5 + 0.5) * 255
      out[i + 1] = (ny * 0.5 + 0.5) * 255
      out[i + 2] = (nz * 0.5 + 0.5) * 255
      out[i + 3] = 255
    }
  }
  return out
}

function configure(t: THREE.Texture, srgb: boolean, tile: number, anisotropy: number) {
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / tile, 1 / tile)
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.anisotropy = anisotropy
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.needsUpdate = true
  return t
}

function bake(name: TextureName, quality: Quality): TextureSet {
  const p: Painter = PAINTERS[name]
  const size = quality === 'high' ? p.size : quality === 'medium' ? Math.min(p.size, 512) : Math.min(p.size, 256)
  const col = new Uint8ClampedArray(size * size * 4)
  const hgt = p.height ? new Float32Array(size * size) : null
  const rgh = p.rough ? new Uint8ClampedArray(size * size * 4) : null
  const px: Px = { r: 0, g: 0, b: 0, h: 0, ro: 0.5 }
  const inv = 1 / size
  for (let y = 0; y < size; y++) {
    const v = y * inv
    for (let x = 0; x < size; x++) {
      const u = x * inv
      p.paint(u, v, px)
      const i = y * size + x
      col[i * 4] = px.r
      col[i * 4 + 1] = px.g
      col[i * 4 + 2] = px.b
      col[i * 4 + 3] = 255
      if (hgt) hgt[i] = px.h
      if (rgh) {
        const r = px.ro * 255
        rgh[i * 4] = r
        rgh[i * 4 + 1] = r
        rgh[i * 4 + 2] = r
        rgh[i * 4 + 3] = 255
      }
    }
  }
  const aniso = quality === 'low' ? 2 : 8
  const set: TextureSet = { tile: p.tile }
  if (name !== 'waterWaves' && name !== 'weave') set.map = configure(new THREE.CanvasTexture(toCanvas(size, col)), true, p.tile, aniso)
  if (hgt) set.normalMap = configure(new THREE.CanvasTexture(toCanvas(size, heightToNormal(hgt, size, p.normalStrength ?? 1))), false, p.tile, aniso)
  if (rgh) set.roughnessMap = configure(new THREE.CanvasTexture(toCanvas(size, rgh)), false, p.tile, aniso)
  return set
}

/**
 * Let the browser paint between heavy steps. MessageChannel callbacks are not throttled in
 * background tabs (unlike setTimeout), so loading continues if the visitor switches tabs.
 */
function yieldToBrowser() {
  return new Promise<void>((resolve) => {
    const ch = new MessageChannel()
    ch.port1.onmessage = () => resolve()
    ch.port2.postMessage(null)
  })
}

/** Bake all textures, yielding to the browser between each one so the loader can animate. */
export async function prepareTextures(quality: Quality, onProgress: (done: number, total: number, name: string) => void) {
  const names = Object.keys(PAINTERS) as TextureName[]
  let done = 0
  for (const name of names) {
    if (!cache.has(name)) {
      onProgress(done, names.length, name)
      await yieldToBrowser()
      cache.set(name, bake(name, quality))
    }
    done++
  }
  onProgress(done, names.length, 'done')
}

export function tex(name: TextureName): TextureSet {
  const t = cache.get(name)
  if (!t) throw new Error(`Texture "${name}" requested before prepareTextures()`)
  return t
}
