@AGENTS.md

# Speak

A speaking simulator: the user is handed a dense unfamiliar idea, gets a short
window to absorb it, then has to explain it out loud from memory under time
pressure. Trains learning → synthesis → communication.

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Framer Motion · Zustand.

## Project docs — these are the source of truth

The files below are imported automatically, so they are already in context. Do
not go looking for them; do follow them.

@docs/vision.md
@docs/ui-guidelines.md
@docs/component-map.md
@docs/user-flow.md
@docs/topic-schema.md

## Non-negotiables

1. **The reference image outranks any written description of the aesthetic**,
   including the vision doc and including the user's own prose brief. This call
   has been made once already — do not relitigate it.
2. **Build on `PixelFrame`.** Every surface in the product is the same
   primitive: a black plate with square-stepped corners. A hand-rolled bordered
   box will look like it came from a different app.
3. **`type-hud` / `type-caps`, never `text-hud` / `text-caps`.** tailwind-merge
   silently deletes `text-*` utilities when they collide inside `cn()`.
4. **Animate containers, not children.** ~100 concurrent transforms locked the
   browser tab once already. Count instances before adding a loop.
5. **Make it look finished before making it work.** Visual language first,
   behaviour second.

## Commands

```bash
npm run dev     # localhost:3000
npm run build   # also the real typecheck
npx eslint .    # lint
```

## Verification

`next build` passing is **not** evidence the UI is correct. Every visual bug
found in this project so far — stripped typography, an invisible ghost button,
a collapsed viewport, an ignored scrollbar — built and linted cleanly.

Look at the rendered page in a browser before claiming a visual change works.

## Checkpoints

- `v0.1.0-design-system` — design system complete, no product functionality.
- Remote: `origin` → github.com/nomnomcake/speak (private).

## Environment notes

- Windows. Prefer the editing tools over PowerShell for file edits —
  `Get-Content -Raw` reads as ANSI and corrupts em dashes.
- The dev server may already be running on :3000; check before starting another.
