import * as THREE from 'three'
import { POOL } from '../../data/house'
import type { MaterialKey } from '../../data/types'
import type { Quality } from '../../store/useAppStore'
import { tex, type TextureName } from './textures'

/**
 * Shared PBR material library. Created once after textures are baked; every mesh in the
 * scene references these instances (never clones) to keep shader programs and memory low.
 */

export type ExtraKey =
  | 'glass'
  | 'water'
  | 'foliageDark'
  | 'foliageOlive'
  | 'foliageHedge'
  | 'lavender'
  | 'bark'
  | 'fabric'
  | 'fabricDark'
  | 'teak'
  | 'led'
  | 'sea'
  | 'planter'
  // furniture
  | 'boucle'
  | 'linen'
  | 'velvet'
  | 'leather'
  | 'walnutWood'
  | 'oakWood'
  | 'marbleSlab'
  | 'travertineSlab'
  | 'blackMetal'
  | 'brass'
  | 'chrome'
  | 'ceramic'
  | 'mirror'
  | 'darkGlass'
  | 'lampGlow'
  | 'rug'
  | 'paper'
  // living room, restyled by the visitor (see livingDesign.ts)
  | 'livingSofa'
  | 'livingChair'
  | 'livingFrame'
  | 'livingTable'
  | 'livingRug'

export type AnyKey = MaterialKey | ExtraKey

let library: Record<AnyKey, THREE.Material> | null = null

function std(texName: TextureName | null, params: THREE.MeshStandardMaterialParameters) {
  const t = texName ? tex(texName) : null
  const maps: THREE.MeshStandardMaterialParameters = {}
  if (t?.map) maps.map = t.map
  if (t?.normalMap) maps.normalMap = t.normalMap
  if (t?.roughnessMap) maps.roughnessMap = t.roughnessMap
  return new THREE.MeshStandardMaterial({ ...maps, ...params })
}

/** Same texture set re-tiled for objects with their own 0..1 UVs (furniture). */
function retiled(name: TextureName, repeat: number, params: THREE.MeshStandardMaterialParameters) {
  const t = tex(name)
  const re = (x?: THREE.Texture) => {
    if (!x) return undefined
    const c = x.clone()
    c.repeat.set(repeat, repeat)
    c.needsUpdate = true
    return c
  }
  const maps: THREE.MeshStandardMaterialParameters = {}
  if (t.map) maps.map = re(t.map)
  if (t.normalMap) maps.normalMap = re(t.normalMap)
  if (t.roughnessMap) maps.roughnessMap = re(t.roughnessMap)
  return new THREE.MeshStandardMaterial({ ...maps, ...params })
}

/** Upholstery: flat colour + fine weave normal map. */
function upholstery(color: string, roughness = 1, sheen = 0) {
  const w = tex('weave')
  const m = new THREE.MeshPhysicalMaterial({ color, roughness, normalMap: w.normalMap, normalScale: new THREE.Vector2(0.6, 0.6), sheen, sheenRoughness: 0.6, sheenColor: new THREE.Color(color) })
  return m
}

export function initMaterials(quality: Quality) {
  if (library) return library
  const water = tex('waterWaves')
  const rich = quality !== 'low'

  const glass = rich
    ? new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0,
        roughness: 0.03,
        transmission: 1,
        thickness: 0.02,
        ior: 1.5,
        specularIntensity: 1,
        envMapIntensity: 1.4,
        attenuationColor: new THREE.Color('#d8ece6'),
        attenuationDistance: 0.6,
        side: THREE.DoubleSide,
      })
    : new THREE.MeshPhysicalMaterial({
        color: '#9fb9bb',
        transparent: true,
        opacity: 0.28,
        roughness: 0.04,
        metalness: 0.1,
        envMapIntensity: 1.6,
        depthWrite: false,
        side: THREE.DoubleSide,
      })

  const waterMat = rich
    ? new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        roughness: 0.04,
        metalness: 0,
        transmission: 1,
        thickness: 1.4,
        ior: 1.33,
        attenuationColor: new THREE.Color('#1f9fb3'),
        attenuationDistance: 2.2,
        normalMap: water.normalMap,
        normalScale: new THREE.Vector2(0.28, 0.28),
        envMapIntensity: 1.2,
      })
    : new THREE.MeshPhysicalMaterial({
        color: '#3aa9bb',
        transparent: true,
        opacity: 0.82,
        roughness: 0.06,
        normalMap: water.normalMap,
        normalScale: new THREE.Vector2(0.3, 0.3),
        envMapIntensity: 1.3,
      })

  library = {
    // façades
    stone: std('stone', { roughness: 0.86 }),
    render: std('render', { roughness: 0.92 }),
    timber: std('timber', { roughness: 0.72 }),
    concrete: std('concrete', { roughness: 0.9 }),
    // interior
    plaster: std('plaster', { roughness: 0.94, envMapIntensity: 0.6 }),
    ceiling: std('plaster', { roughness: 0.96, color: '#ffffff', envMapIntensity: 0.55 }),
    oak: std('oak', { roughness: 1, envMapIntensity: 0.9 }),
    soffit: std('oak', { roughness: 0.75, color: '#f0e2d0' }),
    travertine: std('travertine', { roughness: 0.48, envMapIntensity: 0.9 }),
    // polished but not mirror-like: the roughness map (0.12–0.2) is scaled up so floors don't mirror the sky
    marble: std('marble', { roughness: 1.9, envMapIntensity: 0.6 }),
    walnut: std('walnut', { roughness: 0.5 }),
    // living room: separate instances so restyling never touches other rooms (initial look set by applyLivingDesign)
    livingPaint: new THREE.MeshPhysicalMaterial({ envMapIntensity: 0.6 }),
    livingFeature: new THREE.MeshPhysicalMaterial(),
    // details
    frame: new THREE.MeshStandardMaterial({ color: '#1a1a1c', metalness: 0.6, roughness: 0.38 }),
    metal: new THREE.MeshStandardMaterial({ color: '#8a6d4c', metalness: 1, roughness: 0.3 }),
    // exterior ground
    paving: std('paving', { roughness: 0.78 }),
    deck: std('deck', { roughness: 0.7 }),
    poolTile: std('poolTile', { roughness: 0.2, envMapIntensity: 0.8 }),
    gravel: std('gravel', { roughness: 0.95 }),
    grass: std('grass', { roughness: 1, vertexColors: true }),
    cliff: std('cliff', { roughness: 0.95 }),
    // extras
    glass,
    water: waterMat,
    foliageDark: new THREE.MeshStandardMaterial({ color: '#2d3b24', roughness: 0.95, vertexColors: true }),
    foliageOlive: new THREE.MeshStandardMaterial({ color: '#7d8a63', roughness: 0.9, vertexColors: true }),
    foliageHedge: new THREE.MeshStandardMaterial({ color: '#3a4e2b', roughness: 0.95, vertexColors: true }),
    lavender: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, vertexColors: true }),
    bark: new THREE.MeshStandardMaterial({ color: '#6a5c4c', roughness: 1 }),
    fabric: new THREE.MeshStandardMaterial({ color: '#e9e3d7', roughness: 1 }),
    fabricDark: new THREE.MeshStandardMaterial({ color: '#5b5550', roughness: 1 }),
    teak: std('deck', { roughness: 0.6, color: '#d8c3ac' }),
    led: new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#ffd9a0', emissiveIntensity: 3 }),
    sea: new THREE.MeshStandardMaterial({ color: '#2c5a6e', roughness: 0.15, metalness: 0.1, envMapIntensity: 1.5 }),
    planter: std('concrete', { roughness: 0.9, color: '#d6d0c6' }),
    // furniture
    boucle: upholstery('#ece6da', 1, 0.4),
    linen: upholstery('#c9bfae', 0.95, 0.2),
    velvet: upholstery('#5f6b52', 0.8, 0.9),
    leather: new THREE.MeshPhysicalMaterial({ color: '#8a5434', roughness: 0.48, clearcoat: 0.25, clearcoatRoughness: 0.5 }),
    walnutWood: retiled('walnut', 1, { roughness: 0.42 }),
    oakWood: retiled('oak', 1.5, { roughness: 0.6 }),
    marbleSlab: retiled('marble', 0.8, { roughness: 1.5, envMapIntensity: 0.75 }),
    travertineSlab: retiled('travertine', 0.7, { roughness: 0.5 }),
    blackMetal: new THREE.MeshStandardMaterial({ color: '#151515', metalness: 0.8, roughness: 0.42 }),
    brass: new THREE.MeshStandardMaterial({ color: '#c49a5a', metalness: 1, roughness: 0.24 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#d8d8d8', metalness: 1, roughness: 0.12 }),
    ceramic: new THREE.MeshPhysicalMaterial({ color: '#f4f2ee', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08 }),
    mirror: new THREE.MeshStandardMaterial({ color: '#d8dcdc', metalness: 1, roughness: 0.02, envMapIntensity: 1.4 }),
    darkGlass: new THREE.MeshPhysicalMaterial({ color: '#101214', metalness: 0.2, roughness: 0.08, clearcoat: 1 }),
    lampGlow: new THREE.MeshStandardMaterial({ color: '#fff4e2', emissive: '#ffd8a0', emissiveIntensity: 2.4, roughness: 0.6 }),
    rug: std('rug', { roughness: 1 }),
    livingSofa: new THREE.MeshPhysicalMaterial(),
    livingChair: new THREE.MeshPhysicalMaterial(),
    livingFrame: new THREE.MeshPhysicalMaterial(),
    livingTable: new THREE.MeshPhysicalMaterial({ envMapIntensity: 0.75 }),
    livingRug: new THREE.MeshPhysicalMaterial(),
    paper: new THREE.MeshStandardMaterial({ color: '#f1ebe0', emissive: '#ffcf8a', emissiveIntensity: 0.35, roughness: 0.9, side: THREE.DoubleSide }),
  }
  const [px0, pz0, px1, pz1] = POOL.rect
  addTerrainHoles(library.grass, [[px0 - 0.2, pz0 - 0.2, px1 + 0.2, pz1 + 0.2]])
  registerGlow(library.led as THREE.MeshStandardMaterial, 3)
  registerGlow(library.lampGlow as THREE.MeshStandardMaterial, 2.4)
  registerGlow(library.paper as THREE.MeshStandardMaterial, 0.35)
  return library
}

/**
 * Cut rectangular holes (e.g. the pool basin) out of the terrain material. The terrain grid is
 * too coarse to model the hole, so fragments inside the rectangles are discarded instead.
 */
export function addTerrainHoles(material: THREE.Material, holes: [number, number, number, number][]) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTerrainWorld;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvTerrainWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    const tests = holes
      .map(([x0, z0, x1, z1]) => `if (vTerrainWorld.x > ${x0.toFixed(3)} && vTerrainWorld.x < ${x1.toFixed(3)} && vTerrainWorld.z > ${z0.toFixed(3)} && vTerrainWorld.z < ${z1.toFixed(3)}) discard;`)
      .join('\n')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTerrainWorld;')
      .replace('void main() {', `void main() {\n${tests}`)
  }
  material.customProgramCacheKey = () => `terrain-holes-${holes.length}`
  material.needsUpdate = true
}

/* ------------------------------------------------------------ glow control */
// Emissive fixtures (LED strips, lamps, downlights) scale with the time of day.
const glowMats: { m: THREE.MeshStandardMaterial; base: number }[] = []
let glowFactor = 1
export function registerGlow(m: THREE.MeshStandardMaterial, base: number) {
  glowMats.push({ m, base })
  m.emissiveIntensity = base * glowFactor
}
export function setGlow(k: number) {
  glowFactor = k
  for (const g of glowMats) g.m.emissiveIntensity = g.base * k
}

export function mat(key: AnyKey): THREE.Material {
  if (!library) throw new Error('initMaterials() must run before mat()')
  return library[key]
}

