import { lazy, Suspense, useEffect, useState } from 'react'
import { useAppStore } from './store/useAppStore'
import { initMaterials } from './three/materials/materials'
import { prepareTextures } from './three/materials/textures'
import { LoadingScreen } from './ui/LoadingScreen'
import { Overlay } from './ui/Overlay'

// The 3D bundle (three.js, R3F, post-processing) is split from the UI shell so the
// loading screen paints immediately.
const Experience = lazy(() => import('./three/Experience').then((m) => ({ default: m.Experience })))

const LABELS: Record<string, string> = {
  stone: 'Travertine cladding',
  render: 'Architectural render',
  timber: 'Timber screens',
  plaster: 'Lime plaster',
  oak: 'Oak flooring',
  travertine: 'Honed travertine',
  marble: 'Calacatta marble',
  walnut: 'Walnut veneers',
  paving: 'Limestone paving',
  deck: 'Teak decking',
  poolTile: 'Glass mosaic',
  gravel: 'Gravel drive',
  grass: 'Gardens',
  cliff: 'Coastline',
  concrete: 'Board-formed concrete',
  waterWaves: 'Pool water',
  weave: 'Upholstery',
  rug: 'Wool rugs',
}

let loading: Promise<void> | null = null
function loadAssets() {
  if (loading) return loading
  const { quality, setLoad } = useAppStore.getState()
  loading = (async () => {
    await prepareTextures(quality, (done, total, name) => setLoad((done / total) * 0.85, LABELS[name] ?? 'Materials'))
    initMaterials(quality)
    setLoad(0.9, 'Composing the scene')
  })()
  return loading
}

export function App() {
  const [assetsReady, setAssetsReady] = useState(false)

  useEffect(() => {
    let alive = true
    loadAssets().then(() => alive && setAssetsReady(true))
    return () => {
      alive = false
    }
  }, [])

  return (
    <main className="fixed inset-0 select-none" aria-label="Promotion Rahmouni — interactive 3D visit">
      {assetsReady && (
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      )}
      <Overlay />
      <LoadingScreen />
    </main>
  )
}
