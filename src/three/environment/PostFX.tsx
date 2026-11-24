import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore'

/**
 * Post-processing stack: ambient occlusion (N8AO), subtle bloom for highlights and LEDs,
 * filmic tone mapping, SMAA anti-aliasing and a gentle vignette.
 * On "low" quality the composer is skipped and the renderer tone-maps directly.
 */
export function PostFX() {
  const quality = useAppStore((s) => s.quality)
  const gl = useThree((s) => s.gl)
  const enabled = quality !== 'low'

  useEffect(() => {
    gl.toneMapping = enabled ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1
  }, [enabled, gl])

  if (!enabled) return null
  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={1.2} distanceFalloff={0.8} intensity={2.4} quality={quality === 'high' ? 'high' : 'medium'} halfRes={quality !== 'high'} />
      <Bloom luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.35} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
      <Vignette offset={0.3} darkness={0.42} />
    </EffectComposer>
  )
}
