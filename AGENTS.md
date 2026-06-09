<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Bezier Playground

비주얼 노트 캔버스 POC.

## Structure

```
src/
  app/
    layout.tsx       # viewport meta (no user-scalable), h-full body
    page.tsx         # root: NodePanel + Canvas side by side
  components/
    visual-note/
      store.ts       # Zustand store — nodes, zoom, offset
      Canvas.tsx     # infinite canvas, zoom/pan, node render + delete
      NodePanel.tsx  # left sidebar, node type list
    ui/              # shadcn components
```

## Conventions

- `"use client"` on all interactive components
- Zustand store at `src/components/visual-note/store.ts`
- Canvas zoom range: MIN 0.3 / MAX 2
- Panning: Space + drag (primary), middle-click (secondary)
- Zoom: non-passive wheel listener via `useEffect` (prevents browser zoom takeover)
- Grid: SVG pattern, 40px base cell, scales with zoom
- Node deletion: shadcn `AlertDialog` confirmation
- Lint/format: Biome (`npm run lint:fix`)
- No `npm run dev` — dev server managed by user
