import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

type V3 = [number, number, number]

export interface FaceMats<K extends string> {
  px?: K | null
  nx?: K | null
  py?: K | null
  ny?: K | null
  pz?: K | null
  nz?: K | null
}

interface Bucket {
  p: number[]
  n: number[]
  uv: number[]
}

/**
 * Accumulates quads in world space, grouped by material key, and turns each group into a
 * single BufferGeometry. UVs are world-projected (metres) so procedural textures keep a
 * consistent physical scale and continue seamlessly across neighbouring pieces.
 */
export class GeometryBuckets<K extends string> {
  private buckets = new Map<K, Bucket>()

  private get(key: K) {
    let b = this.buckets.get(key)
    if (!b) {
      b = { p: [], n: [], uv: [] }
      this.buckets.set(key, b)
    }
    return b
  }

  /** Quad with corners in counter-clockwise order seen from the front side. */
  quad(key: K, a: V3, b: V3, c: V3, d: V3) {
    const bucket = this.get(key)
    const e1 = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2])
    const e2 = new THREE.Vector3(c[0] - a[0], c[1] - a[1], c[2] - a[2])
    const n = e1.cross(e2).normalize()
    const ax = Math.abs(n.x)
    const ay = Math.abs(n.y)
    const az = Math.abs(n.z)
    const uvOf = (p: V3): [number, number] => (ax >= ay && ax >= az ? [p[2], p[1]] : ay >= az ? [p[0], p[2]] : [p[0], p[1]])
    for (const p of [a, b, c, a, c, d]) {
      bucket.p.push(p[0], p[1], p[2])
      bucket.n.push(n.x, n.y, n.z)
      bucket.uv.push(...uvOf(p))
    }
  }

  /** Axis-aligned box. `mats` may be a single key for all faces or per-face keys (null = skip). */
  box(min: V3, max: V3, mats: K | FaceMats<K>) {
    const [x0, y0, z0] = min
    const [x1, y1, z1] = max
    if (x1 - x0 <= 1e-4 || y1 - y0 <= 1e-4 || z1 - z0 <= 1e-4) return
    const m: FaceMats<K> = typeof mats === 'string' ? { px: mats, nx: mats, py: mats, ny: mats, pz: mats, nz: mats } : mats
    if (m.px) this.quad(m.px, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1])
    if (m.nx) this.quad(m.nx, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0])
    if (m.pz) this.quad(m.pz, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1])
    if (m.nz) this.quad(m.nz, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0])
    if (m.py) this.quad(m.py, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0])
    if (m.ny) this.quad(m.ny, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1])
  }

  /** Oriented box between two points (for handrails, sloped elements). */
  beam(key: K, start: V3, end: V3, width: number, height: number) {
    const s = new THREE.Vector3(...start)
    const e = new THREE.Vector3(...end)
    const dir = e.clone().sub(s).normalize()
    const up0 = Math.abs(dir.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
    const side = new THREE.Vector3().crossVectors(dir, up0).normalize().multiplyScalar(width / 2)
    const up = new THREE.Vector3().crossVectors(side, dir).normalize().multiplyScalar(height / 2)
    const corner = (p: THREE.Vector3, sx: number, sy: number): V3 => {
      const v = p.clone().addScaledVector(side, sx).addScaledVector(up, sy)
      return [v.x, v.y, v.z]
    }
    const s00 = corner(s, -1, -1), s10 = corner(s, 1, -1), s11 = corner(s, 1, 1), s01 = corner(s, -1, 1)
    const e00 = corner(e, -1, -1), e10 = corner(e, 1, -1), e11 = corner(e, 1, 1), e01 = corner(e, -1, 1)
    this.quad(key, s01, s11, e11, e01) // top
    this.quad(key, s10, s00, e00, e10) // bottom
    this.quad(key, s11, s10, e10, e11) // side +
    this.quad(key, s00, s01, e01, e00) // side -
    this.quad(key, s00, s10, s11, s01) // start cap
    this.quad(key, e10, e00, e01, e11) // end cap
  }

  build(): Map<K, THREE.BufferGeometry> {
    const out = new Map<K, THREE.BufferGeometry>()
    for (const [key, b] of this.buckets) {
      let g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3))
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3))
      g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2))
      g = mergeVertices(g)
      g.computeBoundingBox()
      g.computeBoundingSphere()
      out.set(key, g)
    }
    return out
  }
}
