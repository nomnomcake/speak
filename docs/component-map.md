# Speak — Component Map

Everything lives in `src/components/ui/` and is re-exported from
`src/components/ui/index.ts`. Import from the barrel:

```tsx
import { Panel, Button, ProgressBar } from "@/components/ui";
```

## Hierarchy

```
BrowserFrame          the fake browser window (chrome + viewport)
└── Layout            adds wallpaper, scroll area, page gutters
    └── PageTransition / Stagger
        └── Panel     .EXE windows, optionally sky-filled
            ├── Card
            ├── Button / Badge / ProgressBar / Spinner
            └── PixelFrame   ← the primitive all of the above are built from
```

`PixelFrame` is the root of the visual language. If you find yourself writing a
bordered box by hand, use `PixelFrame` instead.

---

## Primitives

### `PixelFrame`

The black plate + inset fill with stepped corners. Everything else is this.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `tone` | `paper \| mint \| mist \| ink \| ghost` | `paper` | `ink` inverts to white-on-black. |
| `notch` | `number` | `4` | Corner cut in px. 3 controls / 4 cards / 6 windows. |
| `border` | `number` | `3` | Border thickness in px. |
| `shadow` | `number` | `0` | Hard offset plate in px. Never blurred. |
| `interactive` | `boolean` | `false` | Lifts against the shadow on hover. |
| `innerClassName` | `string` | | Applied to the fill — padding, layout, type. |

Note: the middle plate carries `h-full` so an explicit height on the root
reaches the inner surface. Do not remove it.

### `PixelSky`

A static mint sky with pixel clouds, for use *inside* a window. Positions are
hardcoded so server and client render identically.

`density`: `sparse` (4 clouds) · `normal` (8) · `dense` (12). Plus `sun`,
`sparkles`.

**Static by design.** See the animation budget in
[ui-guidelines.md](./ui-guidelines.md).

### `PixelArt`

Sprite set: `PixelCloud` (shapes `wisp` · `classic` · `double` · `puff` ·
`bank`), `Sparkle`, `Sprig`, `Sun`. Shapes are authored as run-length rows, so
a cloud reads as data rather than a wall of `<rect>` tags. Add new shapes to
`CLOUDS` rather than hand-drawing SVG.

---

## Containers

### `Panel`

The primary content container — an `.EXE` window.

| Prop | Type | Notes |
| --- | --- | --- |
| `title` | `ReactNode` | |
| `chrome` | `window \| inline \| none` | `window` = framed title bar + sprig, for top-level regions. `inline` = flush title with a rule, for nested modules. |
| `actions` | `ReactNode` | Right side of the title bar. |
| `tone` | `Tone` | `ink` for focus states and live readouts. |
| `sky` | `boolean \| PixelSkyProps` | Fills the interior with clouds. The defining move of the reference. |
| `sprig` | `boolean` | Corner plant in `window` chrome. |
| `flush` | `boolean` | Drop interior padding. |
| `footer` | `ReactNode` | |

### `Card`

Lighter surface for a single unit of content. `eyebrow` + `title` + `trailing`,
optional `interactive` for the hover lift. Use inside a Panel, not instead of
one.

### `GlowBorder`

Emphasis aura for the one element that matters right now. Drawn as concentric
stepped plates, not a blur — an aura made of pixels. `soft` adds a real bloom;
use for hero moments only.

**Use sparingly.** It animates continuously; seven on a page would compete with
each other and cost real frames.

---

## Controls

### `Button`

| Prop | Values |
| --- | --- |
| `variant` | `primary` (ink) · `secondary` (paper) · `mint` · `ghost` · `danger` |
| `size` | `sm` · `md` · `lg` |
| `loading` | shows a Spinner, keeps full contrast |
| `iconLeft` / `iconRight` | lucide icons |

`ghost` has **no plates at all** — a transparent fill over the black border
plate is just black, so it gets a bare hit area that tints on hover.

### `ProgressBar`

| Prop | Notes |
| --- | --- |
| `value` | 0–1, clamped |
| `variant` | `pill` (the only rounded shape in the system) · `segmented` · `bar` |
| `invert` | **Required** on `tone="ink"` surfaces — the default is invisible on black |
| `hatch` | diagonal fill for soft or estimated values |
| `segments` | block count for `segmented` |

### `Spinner`

8 pixel blocks rotating in 8 discrete steps. `tone="current"` inherits the
surrounding text colour — use that inside buttons.

### `Badge` / `Divider`

`Badge`: tones `ink` · `paper` · `mint` · `alert` · `affirm`, plus `pulse` for a
blinking square on anything live. `Divider`: dotted by default, `solid` for
structural separations.

---

## Shell

### `BrowserFrame`

The fake browser. Three chrome rows — tab strip (with window controls at its
right edge), address bar, bookmarks bar — above a scrolling viewport, plus a
status bar. Chrome is fixed; only the viewport scrolls.

Props: `url`, `tabs`, `nav`, `status`, `footer`, `wallpaper`.

### `Layout`

Wraps `BrowserFrame` and adds the wallpaper, the scroll container
(`.pixel-scroll`) and page gutters. **This is what pages should use.**

Props: `url`, `tabs`, `nav`, `status`, `footer`, `quietBackground`, `className`.

### `PageTransition` / `Stagger` / `StaggerItem`

Mount animation keyed to the route, and sequenced reveals so a screen assembles
itself. Deliberately mount-only rather than `AnimatePresence` exit: in the App
Router the outgoing tree is already unmounted when a new route commits, so exit
variants are unreliable there.

---

## Adding a component

1. Build it on `PixelFrame` unless there is a reason not to.
2. Use `cn()` from `@/lib/utils` for class merging — and remember `type-*` never
   becomes `text-*`.
3. Take a `className` prop and spread it last.
4. Export from `index.ts`.
5. Add a demo to the design system page so it stays visible.
6. Check it against the UI checklist in [ui-guidelines.md](./ui-guidelines.md).
