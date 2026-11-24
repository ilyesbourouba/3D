/**
 * Interactive hotspots: objects visitors can click to learn about. A hotspot either targets a
 * furniture placement (by id, see data/furniture*.ts) or an architectural feature described by
 * an invisible pick box. All copy is original; designs are described, not attributed to brands.
 */

export interface HotspotInfo {
  id: string
  /** Furniture placement id, or a pick box [cx, cy, cz, w, h, d] for architecture. */
  target: { placement: string } | { box: [number, number, number, number, number, number] }
  name: string
  description: string
  material: string
  inspiration: string
  /**
   * Marker height: for furniture, above the placement origin (floor + its y), default = its
   * collision height + 0.25; for pick boxes, an absolute world height.
   */
  markerY?: number
}

const pl = (placement: string) => ({ placement })

export const HOTSPOTS: HotspotInfo[] = [
  /* ---------------------------------------------------------------- hall */
  {
    id: 'staircase',
    target: { box: [3.4, 1.8, -1, 1.1, 3.6, 5] },
    name: 'Floating Staircase',
    description: 'Seventeen solid oak treads cantilever from the travertine wall with no visible stringer, so the stair seems to hover inside the double-height hall.',
    material: 'Solid European oak, concealed steel cantilevers, low-iron glass balustrade, bronze handrail',
    inspiration: 'Mid-century Italian cantilevered stairs and the stone terracing of Mediterranean hillsides.',
    markerY: 2.2,
  },
  {
    id: 'chandelier',
    target: pl('chandelier'),
    name: 'Cascade Light Sculpture',
    description: 'Thirteen hand-blown opal spheres hang at staggered heights through the void, reading as one floating constellation from both floors.',
    material: 'Mouth-blown opal glass, brushed brass ceiling cups, braided steel cable',
    inspiration: 'Lantern festivals and the way morning light breaks on the sea surface.',
    markerY: 3.6,
  },
  {
    id: 'front-door',
    target: { box: [0.75, 1.45, -6.4, 0.5, 2.9, 1.6] },
    name: 'Walnut Pivot Door',
    description: 'A 1.8 m wide, 2.9 m tall door turning on a concealed floor pivot set off-centre, so its full weight opens with a fingertip.',
    material: 'Book-matched American walnut veneer on a stable core, full-height bronze pulls',
    inspiration: 'Monumental Mediterranean entrance doors, reinterpreted without frames or ornament.',
    markerY: 2.2,
  },
  {
    id: 'console',
    target: pl('console'),
    name: 'Hall Console',
    description: 'A 35 mm walnut top floating on four slender bronze legs, styled with dried olive branches and books.',
    material: 'Walnut, satin bronze, stoneware vase',
    inspiration: 'The quiet asymmetry of Japanese entrance alcoves.',
  },

  /* -------------------------------------------------------------- living */
  {
    id: 'fireplace',
    target: pl('fireplace'),
    name: 'Linear Fireplace',
    description: 'A 2.2 m frameless firebox set into a cantilevered travertine bench that runs the length of the stone wall and doubles as seating.',
    material: 'Honed travertine bench, blackened steel surround, ceramic glass',
    inspiration: 'Low hearth benches of Mediterranean farmhouses, simplified into a single line.',
    markerY: 1.35,
  },
  {
    id: 'sofa',
    target: pl('sofa'),
    name: 'Modular Bouclé Sofa',
    description: 'An L-shaped sofa with deep 1.05 m seats, loose back cushions and a recessed plinth that makes it appear to float above the oak floor.',
    material: 'Wool bouclé, feather-wrapped foam, blackened steel plinth',
    inspiration: 'Seventies conversation pits and the soft forms of sea-worn stone.',
  },
  {
    id: 'lounge-chair',
    target: pl('armchair-1'),
    name: 'Leather Lounge Chair',
    description: 'A low reading chair with a slung seat and tilted back, framed by solid walnut runners.',
    material: 'Vegetable-tanned cognac leather, solid walnut',
    inspiration: 'Scandinavian lounge chairs of the 1950s.',
  },
  {
    id: 'coffee-table',
    target: pl('coffee-table'),
    name: 'Travertine Drum Tables',
    description: 'Two nested cylinders of filled and honed travertine at different heights, carved from a single block.',
    material: 'Roman travertine, honed finish',
    inspiration: 'Ancient column drums found in Mediterranean ruins.',
  },
  {
    id: 'arc-lamp',
    target: pl('arc-lamp'),
    name: 'Arc Floor Lamp',
    description: 'A brass arc reaches 1.5 m over the sofa from a marble base, placing a soft pool of light without a ceiling fixture.',
    material: 'Brushed brass, Calacatta marble base',
    inspiration: 'Italian arc lamps of the 1960s.',
    markerY: 2.2,
  },
  {
    id: 'living-art',
    target: pl('living-art'),
    name: '"Coastline", oil on linen',
    description: 'Horizontal bands of earth, olive and sea tones echo the landscape beyond the glass.',
    material: 'Oil on Belgian linen, frameless canvas',
    inspiration: 'The layered view from the terrace at dusk.',
    markerY: 0.75,
  },

  /* -------------------------------------------------------------- dining */
  {
    id: 'dining-table',
    target: pl('dining-table'),
    name: 'Walnut Dining Table',
    description: 'A 3 m solid walnut top for eight, resting on two sculpted travertine pedestals so there are no legs at the corners.',
    material: 'Solid American walnut, travertine, oil finish',
    inspiration: 'Long refectory tables of Italian monasteries.',
  },
  {
    id: 'dining-pendant',
    target: pl('dining-pendant'),
    name: 'Linear Brass Pendant',
    description: 'A 2.2 m brass bar with a continuous warm LED line underneath, dimmable for long dinners.',
    material: 'Brushed brass, opal diffuser, 2700 K LED',
    inspiration: 'The horizon line seen through the glass wall.',
    markerY: 2.8,
  },
  {
    id: 'dining-chair',
    target: pl('dc-n1'),
    name: 'Upholstered Dining Chair',
    description: 'A softly rounded shell in natural linen on slim splayed oak legs, comfortable through a long meal.',
    material: 'Linen, solid oak',
    inspiration: 'Danish dining chairs and their honest joinery.',
  },

  /* ------------------------------------------------------------- kitchen */
  {
    id: 'island',
    target: pl('island'),
    name: 'Waterfall Marble Island',
    description: 'A 3.6 m island where the Calacatta top folds down both ends in one continuous vein, with walnut storage on the working side and seating for four.',
    material: 'Calacatta marble, mitred waterfall edges, walnut cabinetry',
    inspiration: 'Marble altar tables and the gathering table of a family kitchen.',
  },
  {
    id: 'tall-unit',
    target: pl('tall-unit'),
    name: 'Walnut Pantry Wall',
    description: 'Floor-to-ceiling walnut joinery conceals the refrigerator, pantry and two stacked ovens behind flush doors.',
    material: 'Walnut veneer, smoked glass oven fronts, brass pulls',
    inspiration: 'Built-in cabinetry of modernist villas, where appliances disappear.',
    markerY: 2.3,
  },
  {
    id: 'globe-pendants',
    target: pl('globe-1'),
    name: 'Opal Globe Pendants',
    description: 'Three opal globes hang low over the island, giving a soft task light without glare.',
    material: 'Opal glass, brass canopies',
    inspiration: 'Classic Milanese bar lighting.',
    markerY: 2.5,
  },
  {
    id: 'bar-stool',
    target: pl('stool-1'),
    name: 'Counter Stool',
    description: 'A saddle-leather seat on a slim brass frame with a foot ring at a comfortable 28 cm.',
    material: 'Saddle leather, brass',
    inspiration: 'Old Riviera café stools.',
  },

  /* -------------------------------------------------------------- office */
  {
    id: 'desk',
    target: pl('desk'),
    name: 'Walnut Writing Desk',
    description: 'A single walnut slab on black steel sled legs, placed to face the glass partition and the living room beyond.',
    material: 'Solid walnut, powder-coated steel, leather desk pad',
    inspiration: 'Architects’ drafting tables.',
  },
  {
    id: 'bookcase',
    target: pl('bookcase'),
    name: 'Library Wall',
    description: 'A built-in walnut grid of four bays and six shelves holding the owners’ library, with bays left open for objects.',
    material: 'Walnut veneer',
    inspiration: 'Private libraries of Mediterranean villas.',
    markerY: 2.3,
  },

  /* --------------------------------------------------------- guest bath */
  {
    id: 'guest-vanity',
    target: pl('guest-vanity'),
    name: 'Floating Marble Vanity',
    description: 'A cantilevered marble vanity with a ceramic vessel basin, a wall-mounted brass spout and a backlit round mirror.',
    material: 'Calacatta marble, glazed ceramic, brushed brass',
    inspiration: 'Roman baths, scaled down to a jewel box.',
    markerY: 1.2,
  },

  /* ------------------------------------------------------------- terrace */
  {
    id: 'pool',
    target: { box: [2, -0.4, 13.5, 12, 0.8, 4] },
    name: 'Swimming Pool',
    description: 'A 12 × 4 m pool lined in hand-set glass mosaic, with a travertine coping and wide entry steps in the shallow corner.',
    material: 'Glass mosaic tile, travertine coping, limestone deck',
    inspiration: 'Coastal rock pools and their turquoise colour.',
    markerY: 0.7,
  },
  {
    id: 'sliding-glass',
    target: { box: [2.2, 1.6, 7, 2.4, 3.2, 0.3] },
    name: 'Minimal Sliding Glazing',
    description: 'Floor-to-ceiling sliders with frames only 5 cm wide disappear when open, joining the living spaces to the terrace.',
    material: 'Low-iron double glazing, black anodised aluminium',
    inspiration: 'Modernist pavilions where inside and outside merge.',
    markerY: 2.6,
  },

  /* --------------------------------------------------------- first floor */
  {
    id: 'skylight',
    target: { box: [0.9, 6.9, -1.9, 3, 0.4, 5] },
    name: 'Roof Light',
    description: 'A 3 × 5 m roof light above the hall lets sunlight move across the travertine wall throughout the day.',
    material: 'Low-iron glass, rendered upstand',
    inspiration: 'The oculus of the Pantheon, reinterpreted as a rectangle of sky.',
    markerY: 6.5,
  },
  {
    id: 'gallery-art',
    target: pl('g-art'),
    name: '"Terracotta", oil on linen',
    description: 'Softly blurred fields of terracotta and ochre that glow when the evening sun reaches the gallery.',
    material: 'Oil on linen',
    inspiration: 'Colour-field painting and the colours of sun-baked roofs.',
    markerY: 0.75,
  },
  {
    id: 'master-bed',
    target: pl('m-bed'),
    name: 'Master Bed',
    description: 'A king-size platform bed on a recessed plinth with a linen headboard set against the full-height walnut wall.',
    material: 'Belgian linen, walnut, cotton bedding, velvet throw',
    inspiration: 'Quiet luxury hotel suites on the Amalfi coast.',
  },
  {
    id: 'master-art',
    target: pl('m-art'),
    name: '"Ensō", ink on paper',
    description: 'A single brushed circle, left slightly open — a reminder of imperfection and calm.',
    material: 'Sumi ink on handmade paper',
    inspiration: 'Zen calligraphy.',
    markerY: 0.65,
  },
  {
    id: 'wardrobe',
    target: pl('d-wardrobe-w'),
    name: 'Open Walnut Wardrobes',
    description: 'Alternating hanging and shelving bays, lit by a concealed LED strip and finished with deep drawers below.',
    material: 'Walnut veneer, brass hanging rails, integrated LED',
    inspiration: 'Tailors’ ateliers and their open displays.',
    markerY: 2.3,
  },
  {
    id: 'dressing-island',
    target: pl('d-island'),
    name: 'Dressing Island',
    description: 'A marble-topped island with drawers on both sides for watches, jewellery and folded knitwear.',
    material: 'Calacatta marble, walnut',
    inspiration: 'Jewellery counters of old Parisian maisons.',
  },
  {
    id: 'bathtub',
    target: pl('mb-tub'),
    name: 'Freestanding Bathtub',
    description: 'A soft oval tub placed under the window, with a floor-standing brass filler.',
    material: 'Glossy cast stone, brushed brass filler',
    inspiration: 'Smooth sea-polished pebbles.',
  },
  {
    id: 'shower',
    target: pl('mb-shower'),
    name: 'Walk-in Rain Shower',
    description: 'A level-access shower behind a single fixed glass screen, with a ceiling rain head, marble bench and a linear floor drain.',
    material: 'Calacatta marble, low-iron glass, brass fittings',
    inspiration: 'Roman bathhouses and summer rain.',
    markerY: 2.2,
  },
  {
    id: 'master-vanity',
    target: pl('mb-vanity'),
    name: 'Double Vanity',
    description: 'Two vessel basins on a floating marble shelf, each with its own backlit mirror and brass spout.',
    material: 'Calacatta marble, glazed ceramic, brushed brass',
    inspiration: 'Classic hotel bathrooms, simplified.',
    markerY: 1.2,
  },
  {
    id: 'lounge-sofa',
    target: pl('l-sofa'),
    name: 'Reading Lounge',
    description: 'A quiet sitting area at the top of the stairs, with a sofa facing the stone wall and lounge chairs for reading.',
    material: 'Bouclé, leather, travertine, brass',
    inspiration: 'Libraries of Italian palazzi.',
  },
  {
    id: 'bedroom2-bed',
    target: pl('b2-bed'),
    name: 'Guest Bed',
    description: 'A queen platform bed facing the garden, with its own reading lamps and a writing desk.',
    material: 'Linen, walnut, cotton',
    inspiration: 'Boutique guesthouses of Provence.',
  },
  {
    id: 'bedroom3-desk',
    target: pl('b3-desk'),
    name: 'Window Desk',
    description: 'A walnut desk under the north window, lit by soft, glare-free daylight.',
    material: 'Walnut, black steel',
    inspiration: 'Writers’ studies with north light.',
  },
  {
    id: 'bath2-vanity',
    target: pl('b-vanity'),
    name: 'Shared Bathroom Vanity',
    description: 'A floating marble vanity with two basins and backlit mirrors.',
    material: 'Calacatta marble, ceramic, brass',
    inspiration: 'Mediterranean spa bathrooms.',
    markerY: 1.2,
  },
  {
    id: 'balcony-chairs',
    target: pl('bal-chair-0'),
    name: 'Teak Balcony Chairs',
    description: 'Deep outdoor armchairs facing the pool and the sea, in weather-silvered teak with quick-dry cushions.',
    material: 'Grade-A teak, outdoor acrylic fabric',
    inspiration: 'Riviera hotel terraces.',
  },
]

export const hotspotById = (id: string | null) => HOTSPOTS.find((h) => h.id === id) ?? null
