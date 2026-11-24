/**
 * Data model for the villa. Everything visual, collidable or navigable is derived from these
 * types, so the house only needs to be described once (see house.ts).
 *
 * Coordinate system: metres, x = east, z = south (garden side), y = up.
 */

export type MaterialKey =
  // façades
  | 'stone' // travertine cladding (ground floor)
  | 'render' // white architectural render (first floor)
  | 'timber' // vertical dark timber slats (east volume)
  | 'concrete' // board-formed concrete
  // interior
  | 'plaster'
  | 'ceiling'
  | 'oak' // oak floor planks
  | 'soffit' // oak soffits (outdoor ceilings)
  | 'travertine' // stone floor tiles
  | 'marble'
  | 'walnut'
  // details
  | 'frame' // black anodised window frames
  | 'metal' // bronze / dark steel
  // exterior ground
  | 'paving'
  | 'deck'
  | 'poolTile'
  | 'gravel'
  | 'grass'
  | 'cliff'

/** Axis-aligned rectangle on the plan: [x0, z0, x1, z1] with x0 < x1, z0 < z1. */
export type Rect = [number, number, number, number]

export type LevelId = 0 | 1

export interface Level {
  id: LevelId
  name: string
  /** Finished floor height (top of slab). */
  y: number
  /** Clear ceiling height above the floor. */
  ceiling: number
}

export type OpeningKind =
  | 'door' // passable, no glass (door leaves added in Stage 2)
  | 'opening' // passable, no frame
  | 'window' // framed glass with sill/head
  | 'glass' // floor-to-ceiling fixed glazing
  | 'slider' // passable; a glass leaf is parked over the neighbouring pane

export interface Opening {
  /** Start / end along the wall axis, absolute world coordinates. */
  from: number
  to: number
  /** Bottom and top of the opening, relative to the wall base. */
  sill: number
  head: number
  kind: OpeningKind
  /** Doors only: which side of the wall the open leaf stands on (hinged at `from`). */
  swing?: 'pos' | 'neg'
  /** Doors only: no swinging leaf (pocket door, or modelled elsewhere like the front pivot door). */
  noLeaf?: boolean
}

/** A cladding / panelling overlay applied on a wall face. */
export interface Finish {
  /** Normal axis of the face: 'x' → plane x = `plane`, spans z; 'z' → plane z = `plane`, spans x. */
  axis: 'x' | 'z'
  plane: number
  /** Direction the overlay grows away from the wall (+1 or -1 along the axis). */
  dir: 1 | -1
  from: number
  to: number
  y0: number
  y1: number
  mat: MaterialKey
  thickness?: number
}

/** Ceiling lighting for a room rectangle. */
export interface CeilingLighting {
  rect: Rect
  level: LevelId
  /** Perimeter LED cove inset from the rectangle edges (metres); omit for none. */
  cove?: number
  /** Spacing of recessed downlights (metres); omit for none. */
  downlights?: number
}

export interface Wall {
  level: LevelId
  /** 'x' → the wall runs along x at z = `at`; 'z' → runs along z at x = `at`. */
  axis: 'x' | 'z'
  at: number
  from: number
  to: number
  thickness: number
  /** Defaults to the level's ceiling height. */
  height?: number
  /** Face materials. `pos` faces +z (axis x) or +x (axis z); `neg` faces the other way. */
  pos: MaterialKey
  neg: MaterialKey
  openings?: Opening[]
  exterior?: boolean
}

/** A horizontal slab piece (floor + ceiling below). */
export interface Slab {
  rect: Rect
  /** Top of the slab. */
  top: number
  thickness: number
  topMat: MaterialKey | null
  bottomMat: MaterialKey | null
  sideMat: MaterialKey
}

export interface Railing {
  level: LevelId
  axis: 'x' | 'z'
  at: number
  from: number
  to: number
  height: number
}

export interface Stair {
  /** Plan footprint. Steps rise from z0 (bottom) to z1 (top) — see `dir`. */
  rect: Rect
  fromLevel: LevelId
  toLevel: LevelId
  /** Direction of travel when climbing. */
  dir: '+z' | '-z' | '+x' | '-x'
  risers: number
}

export interface Room {
  id: string
  name: string
  level: LevelId
  /** Plan areas belonging to the room (used by minimap, room detection, floors). */
  rects: Rect[]
  floor: MaterialKey
  /** Short marketing line shown in the UI. */
  tagline: string
  /** First-person arrival point [x, z] and yaw in radians (0 = looking towards -z / north). */
  spawn: [number, number, number]
  outdoor?: boolean
  /** Set to false to hide from the room menu (e.g. corridors). */
  inMenu?: boolean
}

export interface HouseData {
  levels: Level[]
  rooms: Room[]
  walls: Wall[]
  slabs: Slab[]
  railings: Railing[]
  stairs: Stair[]
  /** Free-standing columns: [x, z, size, fromY, toY]. */
  columns: [number, number, number, number, number][]
}
