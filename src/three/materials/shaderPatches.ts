import type * as THREE from 'three'
import { mat } from './materials'

/**
 * Small shader extensions on top of the standard PBR materials:
 *  - animated caustics + underwater glow on the pool mosaic
 *  - wind sway and per-tree colour variation for instanced vegetation
 * Uniforms are shared objects, ticked once per frame by <ShaderClock/>.
 */

export const shaderTime = { value: 0 }
export const poolUniforms = { caustic: { value: 0.4 }, night: { value: 0 } }

/* ------------------------------------------------------------------ pool */

const causticChunk = /* glsl */ `
uniform float uTime;
uniform float uCaustic;
uniform float uNight;
varying vec3 vCausticPos;
vec2 causticHash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
// bright web between moving cells (distance to second-nearest minus nearest feature point)
float causticLayer(vec2 p, float t) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float f1 = 8.0;
  float f2 = 8.0;
  for (int y = -1; y <= 1; y++)
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = 0.5 + 0.42 * sin(t + 6.2831 * causticHash(i + g));
      float d = length(g + o - f);
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
    }
  return pow(1.0 - smoothstep(0.0, 0.2, f2 - f1), 2.0);
}
`

let poolDone = false
export function installPoolEffects() {
  if (poolDone) return
  poolDone = true
  const m = mat('poolTile') as THREE.MeshStandardMaterial
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = shaderTime
    shader.uniforms.uCaustic = poolUniforms.caustic
    shader.uniforms.uNight = poolUniforms.night
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCausticPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvCausticPos = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>\n${causticChunk}`).replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      float underwater = smoothstep(-0.05, -0.3, vCausticPos.y);
      vec2 cp = vCausticPos.xz * 1.5 + vCausticPos.y * 0.35;
      float c = causticLayer(cp, uTime * 0.9) * 0.6 + causticLayer(cp * 1.7 + 3.1, uTime * 1.25) * 0.4;
      totalEmissiveRadiance += vec3(0.78, 0.96, 1.0) * c * underwater * uCaustic;
      totalEmissiveRadiance += vec3(0.04, 0.32, 0.42) * underwater * uNight;`,
    )
  }
  m.customProgramCacheKey = () => 'pool-caustics'
  m.needsUpdate = true
}

/* ------------------------------------------------------------------ wind */

interface WindParams {
  /** Local height where sway starts and the span over which it reaches full strength. */
  base: number
  span: number
  /** Sway amplitude in local units (instance scale multiplies it). */
  amp: number
}

function patchWind(m: THREE.Material, p: WindParams, key: string) {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = shaderTime
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying float vTint;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          float inst = 1.0;
        #else
          vec3 ip = vec3(0.0);
          float inst = 0.0;
        #endif
        float sway = sin(uTime * 1.1 + ip.x * 0.37 + ip.z * 0.29) * 0.65 + sin(uTime * 2.3 + ip.x * 0.8 + ip.z * 0.5) * 0.25;
        float hf = clamp((transformed.y - ${p.base.toFixed(3)}) / ${p.span.toFixed(3)}, 0.0, 1.0);
        transformed.x += sway * ${p.amp.toFixed(4)} * hf * hf * inst;
        transformed.z += sway * ${(p.amp * 0.6).toFixed(4)} * hf * hf * inst;
        vTint = mix(1.0, 0.88 + 0.24 * fract(sin(dot(ip.xz, vec2(12.9898, 78.233))) * 43758.5453), inst);`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vTint;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vTint;')
  }
  m.customProgramCacheKey = () => `wind-${key}`
  m.needsUpdate = true
}

let windDone = false
export function installWind() {
  if (windDone) return
  windDone = true
  patchWind(mat('foliageDark'), { base: 0.15, span: 0.85, amp: 0.012 }, 'cypress')
  patchWind(mat('foliageOlive'), { base: 1.8, span: 2.2, amp: 0.05 }, 'olive')
  patchWind(mat('foliageHedge'), { base: 0, span: 1, amp: 0 }, 'hedge')
  patchWind(mat('lavender'), { base: 0.1, span: 0.35, amp: 0.035 }, 'lavender')
}
