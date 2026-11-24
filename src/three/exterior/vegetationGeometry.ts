import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Procedural plant geometry (built once, then instanced). Foliage gets vertex-colour
 * "ambient occlusion" — darker towards the core and the bottom — so canopies read as volume.
 */

const n3 = (x: number, y: number, z: number) =>
  Math.sin(x * 1.7 + Math.sin(z * 2.3)) * Math.sin(y * 2.1 + Math.sin(x * 1.3)) * 0.5 +
  Math.sin(x * 4.1 + y * 3.7) * Math.sin(z * 3.9 - y * 2.2) * 0.25 +
  Math.sin(x * 9.3 - z * 7.1) * Math.sin(y * 8.7 + x * 2.9) * 0.12

function shadeFoliage(g: THREE.BufferGeometry, center: THREE.Vector3, radius: number, minY: number, maxY: number, dark = 0.35) {
  const pos = g.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const h = (v.y - minY) / (maxY - minY)
    const r = Math.min(1, v.clone().sub(center).setY(0).length() / radius)
    const k = dark + (1 - dark) * Math.min(1, 0.35 + 0.45 * h + 0.35 * r)
    colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = k
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return g
}

/** Pushes vertices along their normals with noise. Returns an indexed (smooth-shaded) geometry. */
function displace(src: THREE.BufferGeometry, amount: number, freq: number, seed: number) {
  let g = src
  if (!g.index) {
    // primitives like Icosahedron are non-indexed: weld vertices so normals come out smooth
    if (g.attributes.normal) g.deleteAttribute('normal')
    if (g.attributes.uv) g.deleteAttribute('uv')
    g = mergeVertices(g)
  }
  const pos = g.attributes.position
  const v = new THREE.Vector3()
  const n = new THREE.Vector3()
  g.computeVertexNormals()
  const nor = g.attributes.normal
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    n.fromBufferAttribute(nor, i)
    const d = n3(v.x * freq + seed, v.y * freq - seed, v.z * freq + seed * 0.5) * amount
    v.addScaledVector(n, d)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  return g
}

/** Italian cypress: unit height (scale per instance), slender flame shape. */
export function cypressGeometry() {
  const pts: THREE.Vector2[] = []
  const steps = 24
  for (let i = 0; i <= steps; i++) {
    const y = i / steps
    const r = 0.16 * Math.pow(Math.sin(Math.PI * Math.pow(y, 0.62)), 0.9) * (1 - 0.15 * y)
    pts.push(new THREE.Vector2(Math.max(r, 0.002), y))
  }
  let g: THREE.BufferGeometry = new THREE.LatheGeometry(pts, 18)
  g = displace(mergeVertices(g.deleteAttribute('uv')), 0.035, 9, 1.3)
  return shadeFoliage(g, new THREE.Vector3(0, 0, 0), 0.16, 0, 1, 0.45)
}

/** Olive tree: gnarled trunk + clustered silver-green canopy. ~4 m tall at scale 1. */
export function oliveGeometry(seed = 1, detail = 3) {
  const rnd = (() => {
    let s = seed * 9301 + 49297
    return () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  })()

  // trunk: a few tapered, leaning cylinders
  const trunks: THREE.BufferGeometry[] = []
  const limbs = [
    { lean: 0.18, dir: 0, h: 1.9, r0: 0.17, r1: 0.1 },
    { lean: 0.35, dir: 2.2, h: 1.5, r0: 0.11, r1: 0.06 },
    { lean: 0.4, dir: 4.3, h: 1.4, r0: 0.1, r1: 0.05 },
  ]
  for (const l of limbs) {
    const c = new THREE.CylinderGeometry(l.r1, l.r0, l.h, detail >= 2 ? 7 : 5, detail >= 2 ? 4 : 1)
    c.translate(0, l.h / 2, 0)
    const pos = c.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      const twist = Math.sin(y * 3 + l.dir) * 0.04
      pos.setX(i, pos.getX(i) + twist)
    }
    c.rotateZ(l.lean)
    c.rotateY(l.dir)
    if (l !== limbs[0]) c.translate(0, 0.9, 0)
    c.computeVertexNormals()
    trunks.push(c.deleteAttribute('uv'))
  }
  const trunk = mergeGeometries(trunks)!

  // canopy: displaced blobs arranged in a dome
  const blobs: THREE.BufferGeometry[] = []
  const count = 9
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rnd() * 0.6
    const ring = i === 0 ? 0 : 0.7 + rnd() * 0.7
    let b: THREE.BufferGeometry = new THREE.IcosahedronGeometry(0.75 + rnd() * 0.35, detail)
    b.scale(1, 0.62, 1)
    b = displace(b, 0.16, 3.2, i * 1.7 + seed)
    b.translate(Math.cos(a) * ring, 2.5 + rnd() * 0.7 + (i === 0 ? 0.5 : 0), Math.sin(a) * ring)
    blobs.push(b)
  }
  const canopy = shadeFoliage(mergeGeometries(blobs)!, new THREE.Vector3(0, 2.8, 0), 1.8, 1.8, 3.8, 0.4)
  return { trunk, canopy }
}

/** Soft rounded shrub blob (hedges are made from rows of these, scaled). */
export function shrubGeometry() {
  const g = displace(new THREE.IcosahedronGeometry(0.5, 3), 0.06, 7, 0.7)
  return shadeFoliage(g, new THREE.Vector3(0, 0, 0), 0.5, -0.5, 0.5, 0.45)
}

/** Clipped box hedge with slightly irregular faces (unit cube, scale per instance). */
export function hedgeGeometry() {
  const g = new THREE.BoxGeometry(1, 1, 1, 8, 6, 8)
  const pos = g.attributes.position
  // round the edges a little
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const k = 0.92 + 0.08 * (1 - Math.max(Math.abs(v.x), Math.abs(v.z)) * 2) // pull corners in
    pos.setXYZ(i, v.x * (0.97 + 0.03 * k), v.y, v.z * (0.97 + 0.03 * k))
  }
  g.translate(0, 0.5, 0)
  const m = displace(mergeVertices(g.deleteAttribute('uv').deleteAttribute('normal')), 0.02, 14, 2.1)
  return shadeFoliage(m, new THREE.Vector3(0, 0.5, 0), 0.6, 0, 1, 0.5)
}

/**
 * Lavender tuft: a sage-green mound crowned with spiky purple flower heads. Colours are
 * baked into vertex colours (use with a white material).
 */
export function lavenderGeometry() {
  const parts: THREE.BufferGeometry[] = []
  const sage = new THREE.Color(0.32, 0.38, 0.28)
  const bloom = new THREE.Color(0.5, 0.42, 0.72)
  const paint = (g: THREE.BufferGeometry, fn: (y: number) => THREE.Color) => {
    const pos = g.attributes.position
    const col = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const c = fn(pos.getY(i))
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return g
  }
  // foliage mound
  const ico = new THREE.IcosahedronGeometry(0.24, 2)
  ico.scale(1, 0.6, 1)
  const mound = displace(ico, 0.04, 16, 3.3)
  mound.translate(0, 0.1, 0)
  parts.push(paint(mound, (y) => sage.clone().multiplyScalar(0.55 + 1.2 * Math.max(0, y))))
  // flower spikes
  const rnd = (() => {
    let s = 12345
    return () => ((s = (s * 16807) % 2147483647) / 2147483647)
  })()
  for (let i = 0; i < 22; i++) {
    const a = rnd() * Math.PI * 2
    const r = Math.sqrt(rnd()) * 0.2
    const h = 0.22 + rnd() * 0.14
    const spike = new THREE.ConeGeometry(0.022, h, 4, 1)
    spike.deleteAttribute('uv')
    spike.translate(0, h / 2, 0)
    spike.rotateZ((rnd() - 0.5) * 0.5)
    spike.rotateX((rnd() - 0.5) * 0.5)
    spike.translate(Math.cos(a) * r, 0.14, Math.sin(a) * r)
    parts.push(paint(spike, (y) => sage.clone().lerp(bloom, Math.min(1, Math.max(0, (y - 0.22) / 0.12)))))
  }
  return mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!
}
