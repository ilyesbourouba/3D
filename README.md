# Villa Aurelia — Immersive 3D Architectural Experience

A real-time, explorable 3D luxury villa that runs in the browser. Visitors admire the house
from outside, click to enter, then walk through every room in first person.

This README is the **reference document** for the project: vision, technical decisions,
the house program (floor plans), and the staged roadmap with a validation checklist per stage.

---

## 1. How to run

```powershell
npm install
npm run dev
```

Then open the URL printed in the terminal (default http://localhost:5173).

| Command           | What it does                               |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Dev server with hot reload                 |
| `npm run build`   | Type-check + production build into `dist/` |
| `npm run preview` | Serve the production build locally         |
| `npm test`        | Walking, data and guided-navigation tests  |

### Deploying

The production build is fully static (no backend) and uses relative paths, so `dist/` works
from any folder or host:

- **XAMPP (this machine):** run `npm run build`, start Apache, open
  http://localhost/3D/dist/ (the project already lives in `htdocs/3D`).
- **GitHub Pages:** run `npm run deploy`. It builds and publishes `dist/` to the `gh-pages`
  branch (`main` is untouched). One-time setup: repository **Settings → Pages → Source: Deploy from
  a branch → `gh-pages` / `(root)`**. The site is served at https://ilyesbourouba.github.io/3D/.
- **Any static host** (Netlify, Vercel, GitHub Pages, S3, Apache/Nginx): upload the _contents_ of
  `dist/`. No rewrite rules needed (single page, no client-side routes).
- Total size ≈ 2.4 MB (≈ 0.6 MB gzipped JS); all textures are generated in the browser, so there
  are no image downloads. Serve with gzip or brotli enabled for the fastest first load.

---

## 2. Technical stack (and why)

The stack you proposed is the right one for this kind of project. It is kept, with a few
additions and one deliberate substitution:

| Concern              | Choice                                                                            | Why                                                                                                                                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build tool           | **Vite**                                                                          | Fast dev server, code-splitting for lazy-loading the interior.                                                                                                                                                                                                                    |
| UI framework         | **React 19 + TypeScript**                                                         | As requested. Typed data model for the house is a big win.                                                                                                                                                                                                                        |
| 3D                   | **Three.js + React Three Fiber + Drei**                                           | As requested. Drei gives `CameraControls`, `Environment`, `Sky`, `PerformanceMonitor`…                                                                                                                                                                                            |
| Post-processing      | **@react-three/postprocessing** (added)                                           | Ambient occlusion (N8AO), bloom for LED strips, tone mapping, anti-aliasing. This is where the "CGI" look comes from.                                                                                                                                                             |
| Camera transitions   | **Drei `CameraControls`** (added)                                                 | Smooth, interruptible animated camera moves for the cinematic entry and room-to-room travel.                                                                                                                                                                                      |
| Collision / walking  | **Custom 2D collision from the plan data** (instead of a physics engine)          | The house is architecture, not a physics sandbox. Walls, furniture footprints and stairs are known analytically, so a circle-vs-segment solver is exact, tiny, and fast on mobile. A physics engine (Rapier, ~1 MB WASM) would add weight and tuning work for no visible benefit. |
| State                | **Zustand**                                                                       | As requested: app phase, camera mode, current room/floor, selected hotspot, quality tier.                                                                                                                                                                                         |
| UI styling           | **Tailwind CSS v4**                                                               | As requested.                                                                                                                                                                                                                                                                     |
| Fonts                | **Fontsource** (bundled, no CDN)                                                  | Cormorant Garamond (display) + Manrope (UI). Works offline.                                                                                                                                                                                                                       |
| Materials / textures | **Procedural PBR textures** first, **CC0 photo-scanned textures** later (Stage 8) | Procedural canvas textures (stone, oak, marble, concrete, water…) need no downloads and keep the bundle small. Stage 8 can swap selected materials for CC0 textures from Poly Haven / ambientCG for extra realism.                                                                |
| 3D models            | **Procedural + optional GLB**                                                     | Architecture is generated from data (see §3). Furniture is built from detailed parametric components; GLB models (CC0) can be dropped in later for hero pieces.                                                                                                                   |

### The key architectural idea: one source of truth

The whole house is described as **data** in `src/data/house.ts` (levels, rooms, walls,
openings, stairs, slabs). From that single description the app generates:

- the 3D geometry (walls with window/door cut-outs, floors, ceilings, glass),
- the collision world for first-person walking,
- the room list for the navigation menu,
- the minimap / floor plan,
- camera targets for "go to room".

Changing a wall in the data updates the building, the collisions and the minimap together.
Geometry is merged per material, so the whole shell renders in a handful of draw calls.

---

## 3. The house — "Villa Aurelia"

Contemporary Mediterranean villa, two floors + roof terrace slab, on a landscaped plot with a
pool. Units are metres. `x` = east, `z` = south (garden side), `y` = up.

- Footprint: 22 m × 14 m (`x -11 … 11`, `z -7 … 7`)
- Ground floor level `y = 0`, first floor `y = 3.6`, roof slab top `y ≈ 7.25`
- Ceiling height 3.3 m; entrance hall is double height (6.9 m)
- Garden faces south; the pool lies south of the terrace; driveway & carport on the north-east

### Materials palette

Travertine stone cladding (ground floor), white architectural render & board-formed
concrete (first floor volume), warm oak (floors, soffits), walnut (joinery), Calacatta marble
(kitchen, bathrooms), bronze / brushed-brass metal details, floor-to-ceiling glazing with
slim black frames, integrated LED lines.

### Ground floor (y = 0)

```
 z=-7  +-----------+------+------------+  -  -  -  -  -  -  +
       |  OFFICE   |GUEST |   ENTRANCE |  CARPORT (under     |
       |           | BATH |   HALL     |  bedroom 3)         |
       |      door>|  ^   |  (double   |                     |
 z=-3.5|           +--+---+   height)  |                     |
       |           | vest.   stair ||  +---------------------+ z=-2
 z=-1.5+-----------+        (rises S)|  |                     |
       |                             |  |     KITCHEN         |
       |   LIVING ROOM               ||  |   (island)          |
       | fireplace                   +--+                     |
       | (west wall)    DINING             open to dining      |
 z= 7  +===glass====+====glass=====+=======glass=============+
       |                COVERED TERRACE  (z 7 … 10)           |
       +------------------------------------------------------+
                    SWIMMING POOL  (z ≈ 11.5 … 16)
     x=-11        -5   -2          4                          11
```

| Room           | Extent (x, z)       | Notes                                                                                       |
| -------------- | ------------------- | ------------------------------------------------------------------------------------------- |
| Entrance hall  | x -2…4, z -7…1.5    | Double height, pivot front door on north façade, floating oak staircase along the east wall |
| Living room    | x -11…-2, z -1.5…7  | Fireplace on west wall, panoramic south glazing                                             |
| Dining room    | x -2…4, z 1.5…7     | Open to hall/kitchen, sliding glass to terrace                                              |
| Kitchen        | x 4…11, z -2…7      | Marble island, walnut joinery                                                               |
| Home office    | x -11…-5, z -7…-1.5 | Door from vestibule                                                                         |
| Guest bathroom | x -5…-2, z -7…-3.5  | Door from vestibule                                                                         |
| Terrace        | x -11…11, z 7…10    | Covered by the first-floor balcony, pool access                                             |

### First floor (y = 3.6)

| Room              | Extent (x, z)             | Notes                                               |
| ----------------- | ------------------------- | --------------------------------------------------- |
| Master bedroom    | x -11…-3, z -1…7          | Opens to balcony                                    |
| Walk-in dressing  | x -11…-7, z -7…-1         | From master bedroom                                 |
| Master bathroom   | x -7…-3, z -7…-1          | Freestanding tub, walk-in shower                    |
| Gallery & landing | x -3…-1 & x -3…4, z -7…-5 | Overlooks the double-height hall (glass balustrade) |
| Upper lounge      | x -3…4, z 1.5…7           | Top of the stairs, opens to balcony                 |
| Bedroom 2         | x 4…11, z 3…7             | Garden view                                         |
| Bedroom 3         | x 4…11, z -7…-2           | Cantilevers over the carport                        |
| Shared bathroom   | x 6…11, z -2…3            | Off the east corridor                               |
| East corridor     | x 4…6, z -2…3             | Serves bedroom 2 & shared bath                      |
| Balcony           | x -11…11, z 7…9           | Glass railing, overlooks pool                       |

---

## 4. Project structure

```
src/
  main.tsx, App.tsx, index.css
  store/            Zustand store (phase, camera mode, room, quality…)
  data/             House description (types + layout) — the source of truth
  three/
    Experience.tsx  <Canvas> + scene composition
    architecture/   Geometry generators (walls, slabs, glass, stairs, roof)
    exterior/       Landscape, pool, vegetation, outdoor furniture
    environment/    Sky, sun, environment lighting, post-processing
    materials/      Procedural textures + shared PBR materials
    camera/         Orbit rig, cinematic transitions, first-person controller
    interior/       (Stage 4+) furniture & decor per room, lazy-loaded
  ui/               Overlay UI (loading, intro, menus, minimap, info panel)
```

Rule of thumb: **no giant components** — each file owns one concern, and the scene is composed
of small pieces.

---

## 5. Roadmap — staged delivery

Each stage ends in a runnable app you can validate on its own. ✅ = done, 🔜 = next.

### Stage 0 — Foundation ✅

- Vite + React + TS + R3F + Drei + Tailwind + Zustand scaffold
- House data model and full layout for both floors
- **Validate:** `npm run dev` starts without errors.

### Stage 1 — Exterior experience ✅

- Villa shell generated from data: walls with openings, slabs, roof, glazing, cladding
- Landscape: lawn, terrace paving, swimming pool with animated water, driveway, cypress &
  olive trees, hedges, lavender, outdoor furniture (loungers, outdoor sofa)
- Lighting: sun with soft shadows, sky, image-based environment reflections, post-processing
- Orbit camera (rotate / zoom / limits), slow cinematic idle drift
- Loading screen, intro overlay, **Enter** button and click-on-house → cinematic flight to the
  front door and into the hall; **Back to exterior** button
- **Validate:**
    - [ ] Loading screen, then the villa appears with sky, shadows, pool, trees
    - [ ] Drag to rotate, wheel/pinch to zoom, can't go under ground
    - [ ] Click the house or _Enter_ → smooth flight into the entrance hall
    - [ ] _Exterior_ button flies back out
    - [ ] Reasonable frame rate on your machine

### Stage 1 — notes from implementation

- The site is a continuous coastal terrain (hills inland, land falling to the sea in the south)
  with ~350 instanced wild olives/cypresses; the pool is cut out of the terrain in its shader.
- Inside the hall you can already **look around** (drag). Walking comes in Stage 3.
- Quality (High/Med/Low) switches resolution, shadows and post-processing live; texture
  resolution and glass/water shader type are chosen at load (the choice is remembered, so a
  reload applies it fully).
- Dev-only debug handle: in the browser console, `__aurelia.store`, `__aurelia.controls`,
  `__aurelia.skipFlight()`, `__aurelia.seekFlight(t)`.

### Stage 2 — Interior architecture ✅

- Interior wall finishes per room (plaster, stone feature walls, wood panelling)
- Floor materials per room (oak, marble, stone), ceilings with LED coves and recessed lights
- Floating staircase with glass balustrade, gallery railings, doors & frames
- Interior lighting (warm area lights per room, light baking strategy)
- **Validate:** fly-through of every room via debug camera; no holes, z-fighting or light leaks.

### Stage 2 — notes from implementation

- Interior layer lives in `src/data/interior.ts` (feature walls, ceiling lighting) and
  `src/three/interior/` (generator, downlights, light pool).
- Oak door linings and open walnut door leaves on every interior door (swing side set in
  `house.ts`), black shadow-gap skirting, stone/walnut/marble feature walls, floating ceiling
  panels with LED coves, ~150 recessed downlights, and a roof light over the entrance hall.
- Interior light: a pool of 6 warm point lights follows the visitor to the nearest rooms
  (constant light count → no shader recompiles).
- Camera lens widens from 38° outside to 62° inside.
- A **Rooms** list (top right, inside) travels between rooms with a short fade; this is the
  validation tool for Stage 2 and becomes the full navigation menu in Stage 7. _Exterior_ works
  from any room.

### Stage 3 — First-person navigation & collisions ✅

- First-person controller: WASD/arrows, mouse-look (pointer lock), wheel to step forward/back
- Collision against walls, glass and furniture footprints; stairs as ramps (smooth climbing)
- Mobile: virtual joystick (left) + touch-drag look (right)
- Orbit ⇄ first-person mode toggle
- **Validate:** walk from the front door to every room on both floors without clipping.

### Stage 3 — notes from implementation

- **Desktop:** W A S D / arrow keys to move, Shift to run, mouse wheel to step forward/back.
  Click the view to capture the mouse (game-style look, Esc releases); without capture,
  click-and-drag also looks around.
- **Touch:** a joystick appears under the left thumb (lower-left area); drag elsewhere to look.
- **Walk / Orbit** toggle (bottom left, inside): Orbit circles a point in front of you and
  never passes through walls.
- Collision world is generated from the house data (`src/three/walk/collision.ts`): walls,
  window sills, fixed glass, railings, open door leaves, feature walls, pool, garden boundary
  and outdoor furniture. The staircase is a ramp; the space under it is blocked.
- Movement physics is a pure function (`walkPhysics.ts`), tested by scripted routes:
  `npm run test:walk` walks a bot through every room, up and down the stairs, and checks that
  walls, glass, railings, the pool and the under-stair space stay blocked (22 checks).
- The corridor door to bedroom two/shared bath is now a pocket door (a swinging leaf blocked
  half the corridor).

### Stage 4 — Ground-floor furnishing ✅

- Living (designer sofa, fireplace, coffee table, rug, art), kitchen (marble island, stools,
  appliances), dining (table, chairs, pendant), office (desk, shelving), guest bath, terrace
- **Validate:** each room is distinct and fully furnished; collisions follow furniture.

### Stage 4 — notes from implementation

- Furniture layout lives in `src/data/furniture.ts` (type, position, rotation, props and a
  collision footprint). The renderer (`three/furniture/Furniture.tsx`) and the walking
  collision both read it, so moving a piece moves its collision too. Outdoor furniture footprints
  moved there as well.
- Pieces are parametric components in `three/furniture/` (living, dining, kitchen, study, bath):
  linear fireplace with animated flames and a flickering warm light, L-shaped bouclé sofa,
  leather lounge chairs, travertine drum tables, brass arc lamps, wool rugs, original procedural
  artworks, walnut/travertine dining table with 8 chairs and a linear pendant, kitchen with tall
  walnut wall + ovens, marble worktops, waterfall island, stools and globe pendants, breakfast
  table, office desk/chair/bookcase (instanced books), guest-bath vanity with backlit mirror and
  WC, hall console and a sculptural chandelier in the double-height void, indoor olive trees.
- New materials: bouclé, linen, velvet, leather, brass, chrome, ceramic, mirror, re-tiled wood
  and stone for furniture; new textures: upholstery weave, rug.
- Walking tests now route around furniture and also verify every room's arrival point is clear
  (this caught two bedroom arrival points touching door leaves, now fixed).
- Performance note for Stage 9: furniture uses one mesh per part (several hundred draw calls);
  merging static furniture per material is planned there.

### Stage 5 — First-floor furnishing ✅

- Master bedroom, dressing, master bath (freestanding tub, walk-in shower), bedrooms 2 & 3,
  shared bath, upper lounge, balcony
- **Validate:** same as Stage 4 for the first floor.

### Stage 5 — notes from implementation

- First-floor layout lives in `src/data/furnitureFirstFloor.ts` (same format as the ground floor).
- New pieces (`three/furniture/bedroom.tsx`, `bath.tsx`): platform beds with upholstered
  headboards and layered bedding, floating nightstands with glowing linen-shade lamps, bed-end
  benches, walnut sideboard, open walnut wardrobes with instanced clothes and LED strips, marble
  dressing island, full-length mirror, freestanding oval bathtub with brass floor filler, walk-in
  showers (glass screen, rain head, marble bench, linear drain), double vanities, teak balcony
  chairs.
- Rooms: master suite (bed facing the west window, reading corner, sideboard + art), walk-in
  dressing (wardrobes both sides + island), master bath (tub under the window, walk-in shower,
  double vanity, WC), upper lounge (sofa, lounge chairs, arc lamp against the stone wall), both
  guest bedrooms (bed, nightstands, desk, armchair), shared bath, gallery bench/art/plant, balcony.
- Indoor trees now have narrower canopies so they never poke through walls; marble reflections
  toned down.
- Walking tests now also enter both walk-in showers, loop the dressing island and reach the
  bedside; every arrival point is verified clear.

### Stage 6 — Interactive hotspots ✅

- Clickable objects with an elegant info panel (name, description, material, inspiration)
- Hover highlight + cursor feedback; works in orbit and first-person (crosshair) and on touch
- **Validate:** at least 2–3 hotspots per main room, panel opens/closes cleanly.

### Stage 6 — notes from implementation

- 36 hotspots in `src/data/hotspots.ts`: furniture (by placement id) and architecture (pick boxes:
  floating staircase, pivot door, roof light, sliding glazing, pool). Each has name, description,
  material and design inspiration — all original copy.
- Small pulsing markers sit above each hotspot (within ~8 m, same floor). They draw on top of
  glass but are hidden behind walls by a line-of-sight check.
- How to open one: **walk mode** – click it (or tap on touch); with the mouse captured, aim the
  crosshair (it turns gold and shows the name) and click. **Orbit mode** – hover + click.
  Esc or × closes the panel. Picking never selects anything behind a wall or floor.
- Panel: side card on desktop, bottom sheet on phones.
- `npm test` now runs the walking tests and a data check (unique ids, every hotspot points at
  real furniture, copy complete, every room has at least one hotspot).

### Stage 7 — Navigation interface ✅

- Room menu with smooth camera travel to each room
- Floor selector (Ground / First), interactive minimap with player position & heading
- Exterior button, mode toggle, fullscreen, subtle control guide, settings (quality)
- **Validate:** every button works on desktop and mobile.

### Stage 7 — notes from implementation

- **Guided travel:** choosing a room (map or list) walks you there along a planned route —
  through doorways, around furniture and up/down the stairs — using the normal walking physics.
  Any key/joystick input takes back control; _Skip_ cuts straight there. From outside, choosing a
  room flies you in and then walks you to it.
    - Path-finding: `three/walk/navGrid.ts` (A\* on a 25 cm grid built from the collision world,
      floors linked by the staircase, string-pulled paths); steering: `three/walk/autopilot.ts`.
- **Navigation panel** (top right, **M**): floor selector, interactive plan drawn from the house
  data (rooms, walls with door gaps, glazing, stairs, furniture, your position + heading; click a
  room to go), and the room list. Collapsed outside; opens by itself inside on wide screens and
  follows you between floors.
- **Help** (**?** button or **H**) lists every control; shortcuts **V** walk/orbit, **F** fullscreen.
- `npm test` now also runs `test:nav`: from the hall to every room and across floors both
  ways, the autopilot must arrive (18 routes).

### Stage 8 — Visual polish ✅

- Optional CC0 photo-scanned textures for hero materials, refined glass & water
- Light probes / baked AO for interiors, bloom on LED strips, cinematic camera paths
- Quality tiers (High / Medium / Low) with automatic downgrade on weak GPUs
- **Validate:** side-by-side screenshots vs. Stage 7, frame-rate check on a mid-range phone.

### Stage 8 — notes from implementation

- **Time of day** (sun / golden / moon buttons, top bar): _Golden hour_ (default), _Midday_ and
  _Dusk_. Each preset (`three/environment/timeOfDay.ts`) sets sun, sky, image-based light, fog,
  interior light level and fixture glow; the switch is masked by a short fade and remembered.
- **Dusk** is the classic real-estate evening shot: the house glows from inside, the pool is lit
  from below, terrace and entrance lights come on, and 21 garden bollards light the paths (they
  also block walking). All lights stay mounted, so switching never recompiles shaders.
- **Pool:** animated caustic light patterns on the mosaic and an underwater glow at night
  (`three/materials/shaderPatches.ts`).
- **Vegetation:** gentle wind sway and per-tree colour variation (shader patch on the instanced
  foliage; indoor plants stay still).
- **Materials:** marble no longer mirrors the sky, ceilings are clean white, interior plaster
  picks up less sky reflection.
- **Automatic quality:** on sustained low frame rate the resolution drops first, then the quality
  tier steps down once with a notice (not saved, so a reload starts at your chosen tier).
- Photo-scanned CC0 textures were **not** added: they need downloading external files, which I
  left for your decision (see Stage 9 / follow-ups).

### Stage 9 — Performance & release ✅

- Lazy-loading the interior bundle, LOD for vegetation, instancing audit, texture budgets
- Mobile QA, accessibility pass (keyboard, reduced motion), production build & deploy guide
- **Validate:** Lighthouse/perf check, cold load time, final walkthrough.

---

### Stage 9 — notes from implementation

- **Draw calls:** static furniture (indoor + outdoor) is baked into one mesh per material after
  mounting (`three/furniture/MergedStatic.tsx`); originals stay hidden for hotspot picking.
  Exterior view **2,734 → 400** draw calls per frame (all passes), living room **1,477 → 331**.
- **Triangles:** low-detail olives for the 260 hillside trees, lighter rounded edges and plant
  canopies: **4.0 M → 2.3 M** per frame (all passes) with no visible difference.
- **Lazy loading:** furniture and hotspots are a separate chunk mounted once the exterior is on
  screen; the UI shell (≈ 27 KB gzipped) paints the loading screen immediately.
- **Adaptive quality** (Stage 8) + manual High / Med / Low; Low drops post-processing and
  transmission glass.
- **Accessibility:** `prefers-reduced-motion` shortens flights and removes idle drift and head bob;
  visible keyboard focus; labelled controls and dialogs; full keyboard navigation (see **H**).
- **Dev-only tools:** `window.__stats` (draw calls/triangles), `__aurelia`, `__hotspots` — stripped
  from production builds.
- Hotspot pick/marker range raised to 11 m (the living room is 9 m long).

### Possible next steps

- Photo-scanned CC0 textures (Poly Haven / ambientCG) for stone, oak and marble — needs your OK
  to download external files.
- GLB hero pieces (e.g. a designer chair) if you have or license models.
- A guided "tour" mode that walks through all rooms with captions.

## 6. Conventions

- All dimensions in metres; architecture is axis-aligned.
- Materials are referenced by key (`MaterialKey`) and created once in `three/materials`.
- Geometry is generated in world space and merged per material (few draw calls).
- UI never blocks the canvas; overlays use `pointer-events` carefully.
