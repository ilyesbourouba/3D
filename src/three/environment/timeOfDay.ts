import * as THREE from 'three'

/**
 * Lighting moods. Golden hour is the signature look; midday is bright and neutral; dusk is the
 * "blue hour" real-estate shot with the house glowing from inside, lit pool and garden lights.
 */

export type TimeOfDay = 'golden' | 'midday' | 'dusk'

export interface LightingPreset {
  label: string
  sunDir: THREE.Vector3
  sunColor: string
  sunIntensity: number
  sky: { turbidity: number; rayleigh: number; mieCoefficient: number; mieDirectionalG: number }
  envIntensity: number
  bounce: { color: string; intensity: number }
  sunCard: { color: string; intensity: number }
  hemi: { sky: string; ground: string; intensity: number }
  fog: { color: string; near: number; far: number }
  /** Multiplier for the interior light pool. */
  interior: number
  /** Multiplier for emissive fixtures (LED strips, lamps, downlights). */
  glow: number
  /** 0 = day, 1 = full night lighting (pool, garden, entrance). */
  night: number
}

const dir = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).normalize()

export const PRESETS: Record<TimeOfDay, LightingPreset> = {
  golden: {
    label: 'Golden hour',
    sunDir: dir(-0.62, 0.42, 0.66),
    sunColor: '#ffe2bd',
    sunIntensity: 4.2,
    sky: { turbidity: 3.2, rayleigh: 0.9, mieCoefficient: 0.004, mieDirectionalG: 0.86 },
    envIntensity: 0.65,
    bounce: { color: '#d6cfc4', intensity: 0.55 },
    sunCard: { color: '#ffd9a8', intensity: 6 },
    hemi: { sky: '#c7dcf2', ground: '#9b8a6d', intensity: 0.25 },
    fog: { color: '#cdd5d6', near: 260, far: 1500 },
    interior: 1,
    glow: 1,
    night: 0,
  },
  midday: {
    label: 'Midday',
    sunDir: dir(0.25, 0.92, 0.32),
    sunColor: '#fff6ea',
    sunIntensity: 4.6,
    sky: { turbidity: 2.2, rayleigh: 1.1, mieCoefficient: 0.003, mieDirectionalG: 0.8 },
    envIntensity: 0.8,
    bounce: { color: '#e2ddd4', intensity: 0.6 },
    sunCard: { color: '#fff4e0', intensity: 5 },
    hemi: { sky: '#d3e4f5', ground: '#a39578', intensity: 0.3 },
    fog: { color: '#d9e2e8', near: 300, far: 1700 },
    interior: 0.55,
    glow: 0.7,
    night: 0,
  },
  dusk: {
    label: 'Dusk',
    sunDir: dir(-0.7, 0.05, 0.45),
    sunColor: '#ff9a62',
    sunIntensity: 0.55,
    sky: { turbidity: 4.5, rayleigh: 3.4, mieCoefficient: 0.005, mieDirectionalG: 0.92 },
    envIntensity: 0.32,
    bounce: { color: '#3d4250', intensity: 0.35 },
    sunCard: { color: '#ff8c5a', intensity: 2.5 },
    hemi: { sky: '#5d6f92', ground: '#2b2620', intensity: 0.32 },
    fog: { color: '#4e5566', near: 180, far: 1100 },
    interior: 2.4,
    glow: 2.2,
    night: 1,
  },
}

export const TIMES: TimeOfDay[] = ['golden', 'midday', 'dusk']
