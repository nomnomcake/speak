# Speak — UI Guidelines

The reference image is the source of truth. Where this document and the
reference disagree, **the reference wins**. Where a written brief and the
reference disagree, the reference also wins — that call has already been made
once and should not be relitigated.

## The one idea

Every surface in the product is the same object: a **black plate with
square-stepped corners holding an inset fill**. Panel, Card, Button, Badge and
the meters are all that primitive with different padding and tone.

That shared geometry — not the colour — is what makes unrelated screens read as
one product. It lives in `.pixel-clip` in `globals.css`, a single clip-path
that reads a `--notch` custom property so one definition serves every size.

If you add a new surface and it doesn't carry the stepped corner, it will look
like it came from a different app.

## Palette

Sampled directly from the reference image, not eyeballed.

| Token | Hex | Use |
| --- | --- | --- |
| `ink` | `#000000` | Every border and rule. True black, never softened. |
| `graphite` | `#2a3230` | Body copy. |
| `slate` | `#5a6764` | Secondary text, HUD labels. |
| `mute` | `#5f6b68` | Disabled, placeholder. |
| `paper` | `#ffffff` | Card and panel fills. |
| `mint-mist` | `#ecf6f5` | The browser viewport (page background). |
| `mint-soft` | `#d8ecea` | Tab strip, hover fills. |
| `mint` | `#b7dbd7` | Desktop wallpaper, window sky interiors. |
| `mint-deep` | `#8fbfb9` | Meter fills, cloud glyphs. |
| `mint-shade` | `#6fa6a0` | Pressed states, deepest tint. |
| `glow` | `#7fe9e0` | `GlowBorder` aura only. |
| `alert` | `#e4736a` | Destructive and failure states. |
| `affirm` | `#7fb69a` | Success states. |

`alert` and `affirm` are the only hues outside the mint family and are
deliberately desaturated. **Do not add a sixth colour** without a reason that
survives being said out loud — the near-monochrome palette is doing real work.

### Text tones and the backgrounds they survive on

A near-monochrome palette makes it very easy to pick a tone that looks right
and is unreadable. `mute` shipped at `#8b9794` and failed 4.5:1 on every
background in the product except black — 2.03:1 for the "60 topics" line under
every folder, which is 10px Silkscreen on the sky.

Measured, against the four fills text actually sits on:

| Tone | paper | mist | soft | mint |
| --- | --- | --- | --- | --- |
| `graphite` `#2a3230` | 13.0 | 11.8 | 10.6 | 8.7 |
| `slate` `#5a6764` | 5.90 | 5.36 | 4.81 | 3.97 |
| `mute` `#5f6b68` | 5.54 | 5.03 | 4.51 | 3.73 |

**Nothing lighter than `graphite` clears 4.5:1 on `mint`.** So text on a
`Panel sky` — the defining move of the reference, and therefore common — has
exactly one legal tone. `slate` and `mute` are for paper, mist and soft only;
on the sky they are decoration that happens to contain words.

`mute` and `slate` are 7% apart in contrast, which is the point: `mute` is the
floor of the readable range, not a lighter idea. If a label needs to recede
further than `mute`, make it smaller or move it — do not lighten it.

**`mute` and `slate` are light-surface tones only.** They recede by getting
darker, so on `tone="ink"` they recede towards invisible — `mute` manages
3.79:1 on black and `slate` 3.56:1. Receding on ink means getting *dimmer
without getting darker*: use `mint-shade` (7.64:1), which steps down from the
`mint` that ink surfaces use for their emphasis labels. Darkening `mute` from
`#8b9794` broke exactly one call site this way, on the landing page.

## Typography

Three families, strictly separated. Crossing the streams is the fastest way to
make this look generic.

- **Outfit** — everything readable. UI labels, headings, body copy.
- **Silkscreen** (`type-hud`) — micro-labels only. Uppercase, 10px, `0.14em`
  tracking. Never below 10px, never for a sentence.
- **Geist Mono** — numerics only. Timers, scores, WPM, hex values. Always
  `tabular-nums`.

### Naming trap

The utilities are `type-hud` and `type-caps`, **not** `text-hud` / `text-caps`.

`cn()` runs tailwind-merge, which classifies anything matching `text-*` as a
colour utility. `cn("text-hud", "text-slate")` silently drops the pixel font and
keeps only the colour. It fails exclusively where `cn()` is used, so it presents
as a random per-component bug rather than a naming problem. `type-` is not a
prefix tailwind-merge recognises, so these always survive the merge.

**Never rename them to `text-*`.**

## Geometry

- **No border radius anywhere**, with exactly one exception: the `pill` variant
  of `ProgressBar`. In the reference it is the only curve on the page, which is
  precisely why it reads as a gauge rather than a container. Keep it rare.
- Borders: `2px` for controls and nested frames, `3px` for panels and windows.
- Notch (corner cut): `3px` controls, `4px` cards, `6px` full windows.
- Shadows are **hard offset plates**, never blurred. `PixelFrame shadow={n}`
  draws a solid black plate `n` px down and right.

## Spacing

4px base unit (`--spacing: 4px`). Controls use 8/12, panels 16/24, page rhythm
32/48. Nothing lands off the grid — half-pixels are what make pixel art look
broken.

## Motion

Pixel UIs **step**; they do not glide.

- Easing: `ease-pixel` for snaps, `ease-snap` for entrances. Nothing overshoots
  — no springs, no bounce, no elastic.
- The spinner rotates in 8 discrete steps, not continuously.
- Buttons press *into* their shadow plate; hover lifts exactly one pixel.
- `prefers-reduced-motion` is honoured globally in `globals.css`.

### Animation budget

Learned the hard way: animating every cloud individually put ~100 simultaneous
transforms on the compositor and locked the browser tab.

**Rule: animate containers, not children.** The wallpaper's drift comes from
three belts, where one transform moves a whole strip of clouds. Clouds inside
window skies are completely static. Before adding a looping animation, count how
many instances will be on screen at once.

## Layout

The product lives inside `BrowserFrame`: a fake retro browser with a tab strip,
address bar and bookmarks bar. The chrome is **fixed**; only the viewport
scrolls. That detail is what sells the illusion — a real browser's toolbar does
not scroll away.

Backgrounds, outermost to innermost:

1. **Desktop wallpaper** — mint with drifting clouds, dotted grid, sparkles.
   Behind the browser window.
2. **Viewport** — `mint-mist`. The page.
3. **Window interiors** — `Panel sky` fills a window with a static pixel sky so
   white cards float on clouds. This is the defining move of the reference.
4. **Cards** — paper white.

## Known platform traps

Each of these cost real debugging time. They are listed so they are not
rediscovered.

- **`scrollbar-color` kills `::-webkit-scrollbar`.** In Chromium the standard
  scrollbar properties and the webkit pseudo-elements are mutually exclusive.
  Declaring `scrollbar-color` switches the element to the standard path and
  silently ignores every `::-webkit-scrollbar` rule. The Firefox fallback is
  fenced behind `@supports not selector(::-webkit-scrollbar)`.
- **`PixelFrame` needs `h-full` on its middle plate** for an explicit height to
  reach the inner surface. Without it any frame given a height collapses its
  content to zero.
- **Tailwind may not emit exotic arbitrary values.** `md:grid-cols-[1.35fr_1fr]`
  was never generated and silently fell back to one column. Prefer standard
  scales (`grid-cols-3` + `col-span-2`) over clever arbitrary values.
- **Never rewrite files with PowerShell `Get-Content -Raw`.** It reads as ANSI
  and turns every em dash into `â€"`. Use the editing tools, or
  `[System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)`.
- **`break-words` hides overflow instead of reporting it.** A label that cannot
  fit its column silently splits mid-word — `ECONOMI/CS` — so every automated
  check passes while the desktop plainly looks broken. Overflow measurements
  will not find these; only looking will.

## Checking a narrow viewport

The window here cannot be resized below the display width, so a phone layout
cannot be seen by shrinking the browser. **Use a same-origin iframe**: it gets
its own viewport, so `sm:` and friends evaluate against *its* width, not the
window's.

```js
const f = document.createElement("iframe");
f.src = "http://localhost:3000/play";
f.style.cssText = "position:fixed;top:0;left:0;width:390px;height:790px;z-index:99999";
document.body.appendChild(f);
// then read f.contentDocument / f.contentWindow, and screenshot the tab
```

Two traps: measure well after `onload`, because entrance animations report
zero width until they finish; and `documentElement.scrollWidth` inside the
frame is the honest overflow number, whereas narrowing the real page with
`html.style.width` is not — fixed-position chrome keeps sizing to the actual
viewport and every figure comes out wrong.

## Checklist for new UI

- [ ] Stepped corner (`pixel-clip` or a `PixelFrame`)?
- [ ] Borders true black, 2px or 3px?
- [ ] Colours from the token list — no new hues?
- [ ] Pixel font used *only* for micro-labels, via `type-hud`?
- [ ] Numbers in Geist Mono, `tabular-nums`?
- [ ] Spacing on the 4px grid?
- [ ] No blurred shadows, no border radius (unless it's a gauge)?
- [ ] Animation count checked against the budget?
