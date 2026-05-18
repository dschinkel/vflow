# <span style="color:#76a039">/feature-ui Implementation Plan</span>

> **Spec:** [Feature Skill — Design Spec](../../specs/skills/feature/2026-05-17-feature-skill.md)
> **Skill plan:** [/feature Skill Plan](2026-05-18-feature-skill.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

### <span style="color:#76a039">Goal</span>

Build and deploy `feature-ui/` — a Koa + React + Vite + TypeScript app that parses `story-map.md` into JSON, streams board state changes live, and serves the React story map board at `http://localhost:3847`. Deployed to `~/.claude/feature-ui/` via `install.sh`.

### <span style="color:#76a039">Architecture</span>

`feature-ui/` has two layers. The Koa server (`server/`) reads `story-map.md`, converts it to JSON, watches for file changes, and pushes updates to all open browser connections. The React client (`src/`) subscribes to that stream and renders the board live.

The React UI is organized using **Atomic Design** — `component-library/` contains atoms (primitives), molecules (small compositions), organisms (full sections), and templates (layouts); use cases in `use-cases/` own state and wire templates together.

The markdown file is the single source of truth; the React board is a live read-only view derived from it.

**Tech Stack:** Node.js 20+, Koa 2, `@koa/router`, `koa-static`, `koa-body`, React 18, TypeScript 5, Vite 5, pnpm

---

## <span style="color:#76a039">Implementation Decisions</span>

Open questions from the spec resolved here:

1. **Server starts in Phase 3**, after `story-map.md` is first written. "Live from Phase 1" is v2 — the board has nothing to show until the map exists. Smallest slice.
2. **No `story-map.html` per feature.** That concept predates the React+SSE decision. The React app at `localhost:3847` IS the visual board. Phase 3 writes only `story-map.md`.
3. **Port: 3847.**
4. **PID file: `~/.claude/feature-ui/.server.pid`.** Written on start, killed and deleted on session close.
5. **Active sticky via `POST /active-sticky`** with body `{"text":"..."}`. Server holds it in memory, injects into all streamed state payloads. Clear by posting `{"text":null}`.
6. **Mode A bulk review: one combined table** for `targetService` + `scope`.
7. **Done signal:** print summary + prepend `> *Completed: YYYY-MM-DD*` blockquote to `story-map.md`.
8. **install.sh** builds `feature-ui/` in-repo, copies `server/` + `dist/` + `package.json` to `~/.claude/feature-ui/`, runs `pnpm install --prod` there.
9. **`story-map.md` location:** `story-maps/<feature-slug>/story-map.md` relative to the user's project root (not the vflow repo).
10. **Feature slug:** lowercase, spaces → `-`, strip non-alphanumeric except hyphens. "Payments Flow" → `payments-flow`.
11. **Non-cosmetic sticky check-off:** `/tdd` handles it (it has `storyMapPath`). `/feature` does NOT check off after `/tdd` exits — only for `cosmetic` stickies does `/feature` write the check-off directly.
12. **TypeScript for all files** — React/client (`src/`) and Koa server (`server/`). All files are `.tsx` / `.ts`. `tsx` is the server runtime — executes TypeScript directly without a separate compile step.
13. **Shared types** live in `feature-ui/src/types.ts`.
14. **Component library** lives under `feature-ui/src/component-library/` — atoms, molecules, organisms, templates all inside it.
15. **Use cases** replace pages. `StoryMapPage` → `feature-ui/src/use-cases/ViewStoryMap.tsx`. The use case file subscribes to the board stream, owns state, and wires the template.

---

## <span style="color:#76a039">File Structure</span>

| File | Action | Purpose |
|------|--------|---------|
| `feature-ui/package.json` | Create | App manifest |
| `feature-ui/vite.config.js` | Create | Vite config, dev proxy to Koa |
| `feature-ui/tsconfig.json` | Create | TypeScript config for src/ and server/ |
| `feature-ui/index.html` | Create | Vite HTML entry |
| `feature-ui/server/index.ts` | Create | Koa: static serving, live board stream, file watch, active-sticky POST |
| `feature-ui/server/parseStoryMap.ts` | Create | Markdown → JSON parser |
| `feature-ui/server/boardStream.ts` | Create | Board state stream — registers listeners, pushes state to all open streams |
| `feature-ui/src/types.ts` | Create | Shared TypeScript types (StoryMapState, Activity, StickyItem, StickyState) |
| `feature-ui/src/main.tsx` | Create | React entry |
| `feature-ui/src/component-library/atoms/Sticky.tsx` | Create | Single sticky note, state-driven color |
| `feature-ui/src/component-library/atoms/ArrowUp.tsx` | Create | ↑ connector between sub-task stickies |
| `feature-ui/src/component-library/atoms/Checkbox.tsx` | Create | Done checkmark |
| `feature-ui/src/component-library/atoms/Badge.tsx` | Create | `▶ NOW` active label |
| `feature-ui/src/component-library/atoms/ColumnHeader.tsx` | Create | Numbered activity heading |
| `feature-ui/src/component-library/atoms/GridBackground.tsx` | Create | Crosshatch grid |
| `feature-ui/src/component-library/molecules/StickyWithArrow.tsx` | Create | Sub-task: ArrowUp + Sticky |
| `feature-ui/src/component-library/molecules/SuggestionBarContent.tsx` | Create | "Suggested next: X" text |
| `feature-ui/src/component-library/organisms/ActivityColumn.tsx` | Create | Header + stickies stack |
| `feature-ui/src/component-library/organisms/SuggestionBar.tsx` | Create | Top bar with suggestion |
| `feature-ui/src/component-library/templates/BoardLayout.tsx` | Create | Column grid + suggestion bar slot |
| `feature-ui/src/use-cases/ViewStoryMap.tsx` | Create | Board stream subscriber, state root, wires template |
| `feature-ui/src/styles/main.css` | Create | All component styles |
| `install.sh` | Modify | Build feature-ui, copy to `~/.claude/feature-ui/` |

---

## <span style="color:#76a039">Task 1: `feature-ui/` Walking Skeleton</span>

**Files:**
- Create: `feature-ui/package.json`
- Create: `feature-ui/tsconfig.json`
- Create: `feature-ui/vite.config.js`
- Create: `feature-ui/index.html`

- [ ] **Step 1: Create `feature-ui/package.json`**

```json
{
  "name": "feature-ui",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "vite build",
    "start": "tsx server/index.ts"
  },
  "dependencies": {
    "@koa/router": "^12.0.1",
    "koa": "^2.15.3",
    "koa-body": "^6.0.1",
    "koa-static": "^5.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tsx": "^4.16.0"
  },
  "devDependencies": {
    "@types/koa": "^2.15.0",
    "@types/koa__router": "^12.0.4",
    "@types/koa-static": "^4.0.4",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create `feature-ui/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src", "server"]
}
```

- [ ] **Step 3: Create `feature-ui/vite.config.js`**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/events': 'http://localhost:3847',
      '/state': 'http://localhost:3847',
      '/active-sticky': 'http://localhost:3847',
    }
  }
})
```

- [ ] **Step 4: Create `feature-ui/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Story Map</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Install dependencies**

```bash
pnpm --dir feature-ui install
```

Expected: `feature-ui/node_modules/` created, no errors.

- [ ] **Step 6: Commit**

```bash
git add feature-ui/package.json feature-ui/tsconfig.json feature-ui/vite.config.js feature-ui/index.html feature-ui/pnpm-lock.yaml
git commit -m "feat: scaffold feature-ui/ with TypeScript + React + Vite"
```

---

## <span style="color:#76a039">Task 2: Koa server, markdown parser, and board stream</span>

**Files:**
- Create: `feature-ui/server/parseStoryMap.ts`
- Create: `feature-ui/server/boardStream.ts`
- Create: `feature-ui/server/index.ts`

- [ ] **Step 1: Create `feature-ui/server/parseStoryMap.ts`**

```typescript
import fs from 'fs'
import type { StoryMapState, Activity } from '../src/types'

export function parseStoryMap(filePath: string): StoryMapState {
  if (!fs.existsSync(filePath)) {
    return { title: '', valueStory: null, activeStickyText: null, activities: [] }
  }
  const lines = fs.readFileSync(filePath, 'utf8').split('\n')
  let title = ''
  let valueStory: string | null = null
  const activities: Activity[] = []
  let current: Activity | null = null

  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = line.slice(2).trim()
    } else if (line.startsWith('> ') && !line.startsWith('> *Completed')) {
      valueStory = line.slice(2).trim()
    } else if (line.startsWith('## ')) {
      current = { name: line.slice(3).trim(), stickies: [] }
      activities.push(current)
    } else if (current && line.startsWith('- [x] ')) {
      current.stickies.push({ text: line.slice(6).trim(), state: 'done' })
    } else if (current && line.startsWith('- [ ] ')) {
      current.stickies.push({ text: line.slice(6).trim(), state: 'todo' })
    } else if (current) {
      const deferred = line.match(/^- ~~(.+)~~ \*\(deferred\)\*$/)
      if (deferred) current.stickies.push({ text: deferred[1], state: 'deferred' })
    }
  }

  return { title, valueStory, activeStickyText: null, activities }
}
```

- [ ] **Step 2: Verify parser with a sample file**

```bash
(cd feature-ui && node_modules/.bin/tsx -e "
import { parseStoryMap } from './server/parseStoryMap'
import fs from 'fs'
fs.mkdirSync('/tmp/test-feature', { recursive: true })
fs.writeFileSync('/tmp/test-feature/story-map.md', \`# Payments Flow

> As a buyer, I want to pay.

## User starts checkout
- [x] View cart summary
- [ ] Proceed to checkout
- ~~Email receipt~~ *(deferred)*
\`)
console.log(JSON.stringify(parseStoryMap('/tmp/test-feature/story-map.md'), null, 2))
")
```

Expected:
```json
{
  "title": "Payments Flow",
  "valueStory": "As a buyer, I want to pay.",
  "activeStickyText": null,
  "activities": [
    {
      "name": "User starts checkout",
      "stickies": [
        { "text": "View cart summary", "state": "done" },
        { "text": "Proceed to checkout", "state": "todo" },
        { "text": "Email receipt", "state": "deferred" }
      ]
    }
  ]
}
```

- [ ] **Step 3: Create `feature-ui/server/boardStream.ts`**

Manages the board stream. Holds HTTP response objects open and writes `data: ...\n\n` chunks to all of them whenever the story map changes. The browser's `EventSource` reads the same connection as a stream. When a tab closes, the `close` event fires and removes the response from the set automatically.

```typescript
import type { ServerResponse } from 'http'
import type { StoryMapState } from '../src/types'

const clients = new Set<ServerResponse>()

export function openStream(res: ServerResponse): void {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  clients.add(res)
  res.on('close', () => clients.delete(res))
}

export function streamToAll(data: StoryMapState): void {
  const payload = `data: ${JSON.stringify(data)}\n\n`
  for (const client of clients) client.write(payload)
}
```

- [ ] **Step 4: Create `feature-ui/server/index.ts`**

```typescript
import Koa from 'koa'
import Router from '@koa/router'
import serve from 'koa-static'
import { koaBody } from 'koa-body'
import path from 'path'
import fs from 'fs'
import { parseStoryMap } from './parseStoryMap'
import { openStream, streamToAll } from './boardStream'

const [,, mapPath, portArg] = process.argv
const port = parseInt(portArg ?? '3847')

if (!mapPath) {
  console.error('Usage: tsx index.ts <story-map-path> [port]')
  process.exit(1)
}

const app = new Koa()
const router = new Router()
let activeStickyText: string | null = null

function state() {
  return { ...parseStoryMap(mapPath), activeStickyText }
}

router.get('/events', async (ctx) => {
  ctx.respond = false
  openStream(ctx.res)
  ctx.res.write(`data: ${JSON.stringify(state())}\n\n`)
})

router.get('/state', async (ctx) => {
  ctx.body = state()
})

router.post('/active-sticky', koaBody(), async (ctx) => {
  activeStickyText = (ctx.request.body as { text?: string | null })?.text ?? null
  streamToAll(state())
  ctx.body = { ok: true }
})

if (fs.existsSync(mapPath)) {
  fs.watch(mapPath, () => streamToAll(state()))
}

app.use(serve(path.join(__dirname, '../dist')))
app.use(router.routes())

app.listen(port, () => console.log(`feature-ui: http://localhost:${port}`))
```

- [ ] **Step 5: Verify server starts, serves state, and accepts active-sticky**

```bash
feature-ui/node_modules/.bin/tsx feature-ui/server/index.ts /tmp/test-feature/story-map.md 3847 &
sleep 1
curl -s http://localhost:3847/state
```

Expected: JSON with `title: "Payments Flow"` and one activity.

```bash
curl -s -X POST http://localhost:3847/active-sticky \
  -H 'Content-Type: application/json' \
  -d '{"text":"Proceed to checkout"}'
```

Expected: `{"ok":true}`

```bash
kill $(lsof -ti:3847) 2>/dev/null || true
```

- [ ] **Step 6: Commit**

```bash
git add feature-ui/server/
git commit -m "feat: Koa server with board stream, story-map parser, and active-sticky endpoint"
```

---

## <span style="color:#76a039">Task 3: Shared TypeScript types</span>

**Files:**
- Create: `feature-ui/src/types.ts`

- [ ] **Step 1: Create `feature-ui/src/types.ts`**

```typescript
export type StickyState = 'todo' | 'done' | 'deferred' | 'active'

export interface StickyItem {
  text: string
  state: StickyState
}

export interface Activity {
  name: string
  stickies: StickyItem[]
}

export interface StoryMapState {
  title: string
  valueStory: string | null
  activeStickyText: string | null
  activities: Activity[]
}
```

- [ ] **Step 2: Commit**

```bash
git add feature-ui/src/types.ts
git commit -m "feat: shared TypeScript types for story map state"
```

---

## <span style="color:#76a039">Task 4: React atoms</span>

**Files:**
- Create: `feature-ui/src/component-library/atoms/Sticky.tsx`
- Create: `feature-ui/src/component-library/atoms/ArrowUp.tsx`
- Create: `feature-ui/src/component-library/atoms/Checkbox.tsx`
- Create: `feature-ui/src/component-library/atoms/Badge.tsx`
- Create: `feature-ui/src/component-library/atoms/ColumnHeader.tsx`
- Create: `feature-ui/src/component-library/atoms/GridBackground.tsx`

- [ ] **Step 1: Create `feature-ui/src/component-library/atoms/Sticky.tsx`**

`state` drives CSS class and which accessory renders (checkmark for done, badge for active).

```tsx
import type { StickyState } from '../../types'
import Badge from './Badge'
import Checkbox from './Checkbox'

interface Props {
  text: string
  state: StickyState
}

export default function Sticky({ text, state }: Props) {
  return (
    <div className={`sticky sticky--${state}`}>
      {state === 'done' && <Checkbox />}
      {state === 'active' && <Badge />}
      <span className="sticky__text">{text}</span>
    </div>
  )
}
```

- [ ] **Step 2: Create `feature-ui/src/component-library/atoms/ArrowUp.tsx`**

```tsx
export default function ArrowUp() {
  return <div className="arrow-up">↑</div>
}
```

- [ ] **Step 3: Create `feature-ui/src/component-library/atoms/Checkbox.tsx`**

```tsx
export default function Checkbox() {
  return <span className="checkbox">✓</span>
}
```

- [ ] **Step 4: Create `feature-ui/src/component-library/atoms/Badge.tsx`**

```tsx
export default function Badge() {
  return <span className="badge">▶ NOW</span>
}
```

- [ ] **Step 5: Create `feature-ui/src/component-library/atoms/ColumnHeader.tsx`**

```tsx
interface Props {
  index: number
  name: string
}

export default function ColumnHeader({ index, name }: Props) {
  return (
    <div className="column-header">
      <span className="column-header__index">{index + 1}</span>
      <span className="column-header__name">{name}</span>
    </div>
  )
}
```

- [ ] **Step 6: Create `feature-ui/src/component-library/atoms/GridBackground.tsx`**

```tsx
export default function GridBackground() {
  return <div className="grid-background" aria-hidden="true" />
}
```

- [ ] **Step 7: Commit**

```bash
git add feature-ui/src/component-library/atoms/
git commit -m "feat: React atoms with TypeScript props"
```

---

## <span style="color:#76a039">Task 5: React molecules and organisms</span>

**Files:**
- Create: `feature-ui/src/component-library/molecules/StickyWithArrow.tsx`
- Create: `feature-ui/src/component-library/molecules/SuggestionBarContent.tsx`
- Create: `feature-ui/src/component-library/organisms/ActivityColumn.tsx`
- Create: `feature-ui/src/component-library/organisms/SuggestionBar.tsx`

- [ ] **Step 1: Create `feature-ui/src/component-library/molecules/StickyWithArrow.tsx`**

Used for stickies at index > 0 within a column.

```tsx
import type { StickyState } from '../../types'
import ArrowUp from '../atoms/ArrowUp'
import Sticky from '../atoms/Sticky'

interface Props {
  text: string
  state: StickyState
}

export default function StickyWithArrow({ text, state }: Props) {
  return (
    <div className="sticky-with-arrow">
      <ArrowUp />
      <Sticky text={text} state={state} />
    </div>
  )
}
```

- [ ] **Step 2: Create `feature-ui/src/component-library/molecules/SuggestionBarContent.tsx`**

```tsx
interface Props {
  stickyText: string | null
}

export default function SuggestionBarContent({ stickyText }: Props) {
  if (!stickyText) return <span className="suggestion__empty">All stickies done.</span>
  return (
    <span className="suggestion__text">
      Suggested next: <strong>{stickyText}</strong>
    </span>
  )
}
```

- [ ] **Step 3: Create `feature-ui/src/component-library/organisms/ActivityColumn.tsx`**

First sticky has no arrow; all subsequent ones use `StickyWithArrow`.

```tsx
import type { StickyItem } from '../../types'
import ColumnHeader from '../atoms/ColumnHeader'
import Sticky from '../atoms/Sticky'
import StickyWithArrow from '../molecules/StickyWithArrow'

interface Props {
  index: number
  name: string
  stickies: StickyItem[]
}

export default function ActivityColumn({ index, name, stickies }: Props) {
  return (
    <div className="activity-column">
      <ColumnHeader index={index} name={name} />
      <div className="activity-column__stickies">
        {stickies.map((s, i) =>
          i === 0
            ? <Sticky key={s.text} text={s.text} state={s.state} />
            : <StickyWithArrow key={s.text} text={s.text} state={s.state} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `feature-ui/src/component-library/organisms/SuggestionBar.tsx`**

```tsx
import SuggestionBarContent from '../molecules/SuggestionBarContent'

interface Props {
  stickyText: string | null
}

export default function SuggestionBar({ stickyText }: Props) {
  return (
    <div className="suggestion-bar">
      <SuggestionBarContent stickyText={stickyText} />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add feature-ui/src/component-library/molecules/ feature-ui/src/component-library/organisms/
git commit -m "feat: React molecules and organisms with TypeScript props"
```

---

## <span style="color:#76a039">Task 6: React template, use case, entry, and styles</span>

**Files:**
- Create: `feature-ui/src/component-library/templates/BoardLayout.tsx`
- Create: `feature-ui/src/use-cases/ViewStoryMap.tsx`
- Create: `feature-ui/src/main.tsx`
- Create: `feature-ui/src/styles/main.css`

- [ ] **Step 1: Create `feature-ui/src/component-library/templates/BoardLayout.tsx`**

```tsx
import type { Activity } from '../../types'
import GridBackground from '../atoms/GridBackground'
import SuggestionBar from '../organisms/SuggestionBar'
import ActivityColumn from '../organisms/ActivityColumn'

interface Props {
  title: string
  valueStory: string | null
  activities: Activity[]
  suggestedNextText: string | null
}

export default function BoardLayout({ title, valueStory, activities, suggestedNextText }: Props) {
  return (
    <div className="board-layout">
      <GridBackground />
      <header className="board-header">
        <h1 className="board-title">{title}</h1>
        {valueStory && <p className="board-value-story">{valueStory}</p>}
      </header>
      <SuggestionBar stickyText={suggestedNextText} />
      <div className="board-columns">
        {activities.map((a, i) => (
          <ActivityColumn key={a.name} index={i} name={a.name} stickies={a.stickies} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `feature-ui/src/use-cases/ViewStoryMap.tsx`**

Owns the board stream connection. Injects `active` state into the matching sticky and derives the suggested next sticky. `suggestedNextText` is the first `todo` sticky across all activities.

```tsx
import { useState, useEffect } from 'react'
import type { StoryMapState, Activity, StickyItem } from '../types'
import BoardLayout from '../component-library/templates/BoardLayout'

function withActiveState(activities: Activity[], activeStickyText: string | null): Activity[] {
  return activities.map(a => ({
    ...a,
    stickies: a.stickies.map((s: StickyItem) =>
      s.text === activeStickyText && s.state === 'todo'
        ? { ...s, state: 'active' as const }
        : s
    )
  }))
}

function firstTodo(activities: Activity[]): string | null {
  for (const a of activities) {
    for (const s of a.stickies) {
      if (s.state === 'todo') return s.text
    }
  }
  return null
}

export default function ViewStoryMap() {
  const [mapState, setMapState] = useState<StoryMapState | null>(null)

  useEffect(() => {
    const boardStream = new EventSource('/events')
    boardStream.onmessage = (e: MessageEvent) => setMapState(JSON.parse(e.data) as StoryMapState)
    return () => boardStream.close()
  }, [])

  if (!mapState) return <div className="loading">Loading story map…</div>

  const activities = withActiveState(mapState.activities, mapState.activeStickyText)

  return (
    <BoardLayout
      title={mapState.title}
      valueStory={mapState.valueStory}
      activities={activities}
      suggestedNextText={firstTodo(activities)}
    />
  )
}
```

- [ ] **Step 3: Create `feature-ui/src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import ViewStoryMap from './use-cases/ViewStoryMap'
import './styles/main.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ViewStoryMap />
  </React.StrictMode>
)
```

- [ ] **Step 4: Create `feature-ui/src/styles/main.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #ffffff;
  color: #1a1a1a;
}

.grid-background {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(#e5e5e5 1px, transparent 1px),
    linear-gradient(90deg, #e5e5e5 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
  z-index: 0;
}

.board-layout { position: relative; z-index: 1; padding: 0 24px 32px; min-height: 100vh; }
.board-header { padding: 20px 0 8px; }
.board-title { font-size: 22px; font-weight: 700; }
.board-value-story { font-size: 13px; color: #555; margin-top: 4px; font-style: italic; }
.board-columns { display: flex; gap: 16px; align-items: flex-start; padding-top: 16px; overflow-x: auto; }

.suggestion-bar {
  background: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 10px 16px;
  margin: 8px 0;
  font-size: 14px;
}
.suggestion__text strong { color: #2563eb; }
.suggestion__empty { color: #888; }

.activity-column { min-width: 160px; display: flex; flex-direction: column; gap: 8px; }
.activity-column__stickies { display: flex; flex-direction: column; gap: 0; }

.column-header {
  background: #f0f0f0;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  padding: 6px 10px;
  display: flex;
  gap: 6px;
  align-items: center;
}
.column-header__index { font-size: 11px; font-weight: 700; color: #888; }
.column-header__name { font-size: 12px; font-weight: 600; }

.sticky {
  background: #86efac;
  border: 2px solid transparent;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.4;
  box-shadow: 0 1px 3px rgba(0,0,0,.12);
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.sticky--done     { background: #bbf7d0; color: #888; }
.sticky--deferred { background: #fecdd3; text-decoration: line-through; color: #999; }
.sticky--active   { border-color: #eab308; box-shadow: 0 0 0 2px #fef08a; }
.sticky__text { flex: 1; }

.sticky-with-arrow { display: flex; flex-direction: column; align-items: center; }
.arrow-up { font-size: 14px; color: #888; line-height: 1; padding: 2px 0; }

.checkbox { font-size: 11px; color: #16a34a; font-weight: 700; }

.badge {
  font-size: 9px; font-weight: 700;
  background: #eab308; color: #fff;
  padding: 1px 5px; border-radius: 3px;
  white-space: nowrap;
}

.loading { display: flex; align-items: center; justify-content: center; height: 100vh; color: #888; }
```

- [ ] **Step 5: Build and verify TypeScript compiles cleanly**

```bash
pnpm --dir feature-ui build
```

Expected: `feature-ui/dist/` created, no TypeScript errors, no build errors.

- [ ] **Step 6: Verify in browser**

```bash
feature-ui/node_modules/.bin/tsx feature-ui/server/index.ts /tmp/test-feature/story-map.md 3847 &
sleep 1
open http://localhost:3847
```

Expected: board renders — "Payments Flow" title, activity column with done/todo/deferred stickies in correct colors, suggestion bar showing "Proceed to checkout".

```bash
kill $(lsof -ti:3847) 2>/dev/null || true
```

- [ ] **Step 7: Commit**

```bash
git add feature-ui/src/
git commit -m "feat: React UI — component-library, use-cases/ViewStoryMap, TypeScript, Vite build"
```

---

## <span style="color:#76a039">Task 7: `install.sh` update</span>

**Files:**
- Modify: `install.sh`

- [ ] **Step 1: Add feature-ui build + deploy block to `install.sh`**

After the commands loop (after the line `echo "installed command: $(basename "$f")"`), insert:

```bash
# --- feature-ui ---
FEATURE_UI_SRC="$REPO_DIR/feature-ui"
FEATURE_UI_DEST="$CLAUDE_DIR/feature-ui"

if command -v pnpm >/dev/null 2>&1; then
  echo "building feature-ui..."
  pnpm --dir "$FEATURE_UI_SRC" install --silent
  pnpm --dir "$FEATURE_UI_SRC" build --silent

  mkdir -p "$FEATURE_UI_DEST"
  cp -r "$FEATURE_UI_SRC/server"       "$FEATURE_UI_DEST/"
  cp -r "$FEATURE_UI_SRC/dist"         "$FEATURE_UI_DEST/"
  cp    "$FEATURE_UI_SRC/package.json" "$FEATURE_UI_DEST/"

  pnpm --dir "$FEATURE_UI_DEST" install --prod --silent
  echo "installed feature-ui → $FEATURE_UI_DEST"
else
  echo "warning: pnpm not found — skipping feature-ui. Install pnpm and re-run install.sh."
fi
```

- [ ] **Step 2: Run install.sh and verify**

```bash
bash install.sh
```

Expected: commands installed, `installed feature-ui → ~/.claude/feature-ui` line appears, no errors.

```bash
ls ~/.claude/feature-ui/
```

Expected: `dist/  node_modules/  package.json  server/`

- [ ] **Step 3: Verify deployed server starts**

```bash
~/.claude/feature-ui/node_modules/.bin/tsx \
  ~/.claude/feature-ui/server/index.ts \
  /tmp/test-feature/story-map.md 3847 &
sleep 1
curl -s http://localhost:3847/state | head -c 80
kill $(lsof -ti:3847) 2>/dev/null || true
```

Expected: output starts with `{"title":"Payments Flow"`.

- [ ] **Step 4: Commit**

```bash
git add install.sh
git commit -m "feat: install.sh builds and deploys feature-ui to ~/.claude/feature-ui/"
```
