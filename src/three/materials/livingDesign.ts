import * as THREE from 'three'
import { mat } from './materials'
import { tex, type TextureName } from './textures'

/**
 * Living room customisation: the visitor can repaint the walls and switch the room between a
 * few interior styles. Everything goes through materials used only by the living room
 * (`livingPaint`, `livingFeature`, `livingSofa`…), which are updated in place, so the rest of
 * the house is never affected and the merged furniture meshes need no rebuild.
 */

export const WALL_COLORS = [
  { id: 'white', name: 'Plaster white', color: '#ffffff' },
  { id: 'sand', name: 'Warm sand', color: '#e8d6bc' },
  { id: 'sage', name: 'Sage', color: '#b7c2a6' },
  { id: 'terracotta', name: 'Terracotta', color: '#cf9474' },
  { id: 'blue', name: 'Dusty blue', color: '#a7b6c6' },
  { id: 'charcoal', name: 'Charcoal', color: '#5e5c5a' },
] as const
export type WallColorId = (typeof WALL_COLORS)[number]['id']

interface Surface {
  /** Texture set; with `normalOnly` only its normal map is used (upholstery weave). */
  tex?: TextureName
  normalOnly?: boolean
  /** Furniture has 0..1 UVs: the texture is re-tiled by this factor. Walls use world UVs. */
  repeat?: number
  color: string
  roughness: number
  metalness?: number
  sheen?: number
  clearcoat?: number
}

interface StyleDef {
  name: string
  description: string
  /** Fireplace feature wall; 'paint' takes the chosen wall colour. */
  feature: Surface | 'paint'
  sofa: Surface
  chair: Surface
  frame: Surface
  table: Surface
  rug: Surface
}

const fabric = (color: string, roughness = 1, sheen = 0.3): Surface => ({ tex: 'weave', normalOnly: true, color, roughness, sheen })

export const LIVING_STYLES = {
  contemporary: {
    name: 'Contemporary',
    description: 'Travertine, bouclé and cognac leather',
    feature: { tex: 'stone', color: '#ffffff', roughness: 0.86 },
    sofa: fabric('#ece6da', 1, 0.4),
    chair: { color: '#8a5434', roughness: 0.48, clearcoat: 0.25 },
    frame: { tex: 'walnut', repeat: 1, color: '#ffffff', roughness: 0.42 },
    table: { tex: 'travertine', repeat: 0.7, color: '#ffffff', roughness: 0.5 },
    rug: { tex: 'rug', color: '#ffffff', roughness: 1 },
  },
  scandinavian: {
    name: 'Scandinavian',
    description: 'Painted walls, pale oak and soft linen',
    feature: 'paint',
    sofa: fabric('#cfcbc4', 0.95, 0.2),
    chair: fabric('#d8c8ae', 1, 0.3),
    frame: { tex: 'oak', repeat: 1.5, color: '#f6ead8', roughness: 0.6 },
    table: { tex: 'oak', repeat: 1.5, color: '#f3e6d2', roughness: 0.55 },
    rug: { tex: 'rug', color: '#f4efe6', roughness: 1 },
  },
  industrial: {
    name: 'Industrial',
    description: 'Raw concrete, black steel and dark leather',
    feature: { tex: 'concrete', color: '#b8b4ae', roughness: 0.9 },
    sofa: fabric('#4d4a47', 1, 0.3),
    chair: { color: '#4a2e1e', roughness: 0.42, clearcoat: 0.3 },
    frame: { color: '#151515', roughness: 0.42, metalness: 0.8 },
    table: { tex: 'concrete', repeat: 0.8, color: '#9a958f', roughness: 0.85 },
    rug: { tex: 'rug', color: '#8a837b', roughness: 1 },
  },
  classic: {
    name: 'Classic luxury',
    description: 'Marble, emerald velvet and brass',
    feature: { tex: 'marble', color: '#ffffff', roughness: 1.9 },
    sofa: fabric('#3e5a4a', 0.8, 0.9),
    chair: fabric('#8c4a36', 0.8, 0.9),
    frame: { color: '#c49a5a', roughness: 0.24, metalness: 1 },
    table: { tex: 'marble', repeat: 0.8, color: '#ffffff', roughness: 1.5 },
    rug: { tex: 'rug', color: '#c9b08e', roughness: 1 },
  },
} satisfies Record<string, StyleDef>
export type LivingStyle = keyof typeof LIVING_STYLES

/** Re-tiled copies of a texture set for furniture UVs (created once per name + repeat). */
const retiledCache = new Map<string, { map?: THREE.Texture; normalMap?: THREE.Texture; roughnessMap?: THREE.Texture }>()
function texturesFor(name: TextureName, repeat?: number) {
  const t = tex(name)
  if (repeat === undefined) return t
  const key = `${name}|${repeat}`
  let r = retiledCache.get(key)
  if (!r) {
    const re = (x?: THREE.Texture) => {
      if (!x) return undefined
      const c = x.clone()
      c.repeat.set(repeat, repeat)
      c.needsUpdate = true
      return c
    }
    r = { map: re(t.map), normalMap: re(t.normalMap), roughnessMap: re(t.roughnessMap) }
    retiledCache.set(key, r)
  }
  return r
}

function applySurface(m: THREE.MeshPhysicalMaterial, s: Surface) {
  const t = s.tex ? texturesFor(s.tex, s.repeat) : null
  m.map = (!s.normalOnly && t?.map) || null
  m.normalMap = t?.normalMap ?? null
  m.roughnessMap = (!s.normalOnly && t?.roughnessMap) || null
  m.color.set(s.color)
  m.roughness = s.roughness
  m.metalness = s.metalness ?? 0
  m.sheen = s.sheen ?? 0
  m.sheenColor.set(s.color)
  m.sheenRoughness = 0.6
  m.clearcoat = s.clearcoat ?? 0
  m.clearcoatRoughness = 0.5
  m.needsUpdate = true
}

export function applyLivingDesign(style: LivingStyle, wall: WallColorId) {
  const def: StyleDef = LIVING_STYLES[style]
  const paint: Surface = { tex: 'plaster', color: WALL_COLORS.find((c) => c.id === wall)?.color ?? '#ffffff', roughness: 0.94 }
  const m = (k: Parameters<typeof mat>[0]) => mat(k) as THREE.MeshPhysicalMaterial
  applySurface(m('livingPaint'), paint)
  applySurface(m('livingFeature'), def.feature === 'paint' ? paint : def.feature)
  applySurface(m('livingSofa'), def.sofa)
  applySurface(m('livingChair'), def.chair)
  applySurface(m('livingFrame'), def.frame)
  applySurface(m('livingTable'), def.table)
  applySurface(m('livingRug'), def.rug)
}
