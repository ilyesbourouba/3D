import type { ComponentType } from 'react'
import { FURNITURE, type FurnitureType } from '../../data/furniture'
import { HOTSPOTS } from '../../data/hotspots'
import { LEVELS } from '../../data/house'
import { registerHotspotTarget } from '../hotspots/picking'
import { Bathtub, ShowerScreen, Toilet, TubFiller, Vanity } from './bath'
import { Bed, Bench, DressingIsland, FloorMirror, Nightstand, OutdoorChair, Sideboard, Wardrobe } from './bedroom'
import { Chandelier, DiningChair, DiningTable, GlobePendant, LinearPendant, RoundTable } from './dining'
import { BarStool, Counter, Island, TallUnit } from './kitchen'
import { ArcLamp, Armchair, Artwork, Chaise, CoffeeTable, Fireplace, Plant, Rug, SideTable, Sofa } from './living'
import { MergedStatic } from './MergedStatic'
import { Bookcase, Console, Desk, OfficeChair } from './study'

/** Furniture type → component. Every component is authored centred, front facing +z. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CATALOG: Record<FurnitureType, ComponentType<any>> = {
  sofa: Sofa,
  chaise: Chaise,
  armchair: Armchair,
  coffeeTable: CoffeeTable,
  sideTable: SideTable,
  arcLamp: ArcLamp,
  rug: Rug,
  fireplace: Fireplace,
  art: Artwork,
  plant: Plant,
  diningTable: DiningTable,
  diningChair: DiningChair,
  linearPendant: LinearPendant,
  globePendant: GlobePendant,
  chandelier: Chandelier,
  roundTable: RoundTable,
  tallUnit: TallUnit,
  counter: Counter,
  island: Island,
  barStool: BarStool,
  desk: Desk,
  officeChair: OfficeChair,
  bookcase: Bookcase,
  console: Console,
  vanity: Vanity,
  toilet: Toilet,
  showerScreen: ShowerScreen,
  bathtub: Bathtub,
  tubFiller: TubFiller,
  bed: Bed,
  nightstand: Nightstand,
  bench: Bench,
  sideboard: Sideboard,
  wardrobe: Wardrobe,
  dressingIsland: DressingIsland,
  floorMirror: FloorMirror,
  outdoorChair: OutdoorChair,
}

/** placement id → hotspot id, for pieces visitors can click. */
const HOTSPOT_OF = new Map(HOTSPOTS.flatMap((h) => ('placement' in h.target ? [[h.target.placement, h.id] as const] : [])))

/** Renders every placement from data/furniture.ts. */
export function Furniture() {
  return (
    <MergedStatic>
      {FURNITURE.map((p) => {
        const Comp = CATALOG[p.type]
        return (
          <group
            key={p.id}
            ref={(g) => {
              const hs = HOTSPOT_OF.get(p.id)
              if (hs) registerHotspotTarget(hs, g)
            }}
            position={[p.x, LEVELS[p.level].y + (p.y ?? 0), p.z]} rotation={[0, p.rot ?? 0, 0]}>
            <Comp {...(p.props ?? {})} />
          </group>
        )
      })}
    </MergedStatic>
  )
}
