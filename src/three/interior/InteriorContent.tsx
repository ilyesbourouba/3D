import { Furniture } from '../furniture/Furniture'
import { Hotspots } from '../hotspots/Hotspots'

/**
 * Furniture and hotspots, split into their own chunk and mounted only after the exterior scene
 * has appeared — the first view loads faster, and the interiors arrive during the intro glide.
 */
export default function InteriorContent() {
  return (
    <>
      <Furniture />
      <Hotspots />
    </>
  )
}
