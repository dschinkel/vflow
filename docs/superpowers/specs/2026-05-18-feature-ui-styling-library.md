# <span style="color:#76a039">feature-ui — Component & Styling Library Design Spec</span>

> **Status:** Decided — awaiting Claude Design prototype before implementation
>
> **Plan:** [feature-ui — Styling Migration Plan](../plans/2026-05-18-feature-ui-styling-migration.md)

---

## <span style="color:#76a039">Context</span>

`feature-ui/` is a local developer tool: a Koa + React + TypeScript + Vite app that renders a live story map board at `http://localhost:3847`. It is not a user-facing product — it runs locally during development sessions.

**Current state:**
- 100% hand-rolled CSS (`feature-ui/src/styles/main.css`, 81 lines)
- 100% custom JSX components — no external UI dependencies
- Atomic Design structure: `atoms/` → `molecules/` → `organisms/` → `templates/` → `use-cases/`
- Domain-specific atoms: `Sticky`, `Badge`, `ArrowUp`, `Checkbox`, `ColumnHeader`, `GridBackground`

**Goal:** Replace hand-rolled CSS with a component/styling library. Eliminate raw CSS without abandoning the Atomic Design structure.

---

## <span style="color:#76a039">Constraint: Keep Atomic Design, Atoms Wrap Library Primitives</span>

The atomic component library is retained. The atoms don't go away — they get thinner. Instead of raw HTML + custom CSS classes, each atom wraps a library primitive:

```tsx
// Before
<div className="sticky sticky--active">...</div>

// After (with Tailwind + shadcn)
<div className={cn("sticky rounded-md p-2 bg-yellow-100", isActive && "ring-2 ring-yellow-400")}>...</div>
```

Library handles all tokens (color, spacing, typography, radius, shadow). Atoms own domain logic and structure. Raw CSS is eliminated.

---

## <span style="color:#76a039">Claude Design Integration</span>

Anthropic's Claude Design tool (claude.ai) can be used to prototype the board layout visually. It outputs:
- Standalone HTML files
- PDF / PPTX / Canva exports
- A handoff bundle for Claude Code implementation

**Important:** Claude Design does NOT output React component code or Tailwind classes. Its output is a visual reference and design spec — not pasteable code. The styling library choice is therefore not driven by Claude Design compatibility. Claude Design is used to define what it should look like; the library choice is purely a DX and aesthetics decision.

---

## <span style="color:#76a039">Options Evaluated</span>

### Option 1 — Chakra UI

Atoms wrap Chakra primitives (`Box`, `Flex`, `Text`, `Badge`, `Stack`). Chakra's theme tokens replace raw CSS. Styling via props (`bg`, `px`, `borderRadius`).

| | |
|---|---|
| **Pros** | Excellent TypeScript DX; prop-based styling maps naturally to atomic design; strong theming system; accessible by default; ergonomic for React developers |
| **Cons** | Aesthetics are recognizably "Chakra" without theme investment; medium bundle (~100kb gzipped); Chakra v3 is a significant DX shift from v2 — target v3 from the start |

### Option 2 — Tailwind CSS + shadcn/ui

shadcn components (Badge, Card, Tooltip etc.) are copied into the project and fully owned — not a dependency. Tailwind handles all spacing/color/typography via utility classes. Atoms use shadcn primitives + Tailwind classes.

| | |
|---|---|
| **Pros** | Best aesthetics out of the box; shadcn components are fully owned and customizable; dominant modern approach; Radix UI under the hood for accessibility |
| **Cons** | Tailwind class verbosity in JSX; theming is config-file based, less ergonomic than Chakra runtime theming; shadcn adds Radix UI as a dependency |

### Option 3 — Mantine

Atoms wrap Mantine primitives (`Box`, `Badge`, `Text`, `Group`, `Stack`). Mantine's color system and spacing scale replaces raw CSS.

| | |
|---|---|
| **Pros** | Better defaults than Chakra — less theme work; richer component set; TypeScript first; active maintenance |
| **Cons** | Larger bundle than Chakra; less community mindshare than Tailwind/shadcn; fewer Claude training examples means less useful AI assistance |

---

## <span style="color:#76a039">Open Questions</span>

All resolved. See Decision below.

---

## <span style="color:#76a039">Decision</span>

**Library: Tailwind CSS + shadcn/ui**

**Aesthetic goal:** Miro-like — clean, canvas-feel, neutral palette with color pops for sticky cards. shadcn's default baseline matches this without theme investment. Chakra was ruled out because its component defaults read as "web app" (soft rounded shapes, colored variants) and require meaningful theme overrides to achieve a clean canvas look. Mantine was ruled out for similar reasons. Tailwind makes per-card color variants (yellow, pink, green stickies) trivial via utility classes.

**Bundle size:** Not a constraint. This is a local dev tool that never ships to users.

**Claude Design workflow:** Claude Design will be used first to prototype the board layout visually. Its output (standalone HTML) is a visual reference only — not React code or Tailwind classes. The workflow is:
1. Prototype the board in Claude Design to define the target look
2. Use the HTML output as a visual spec when wiring atoms to Tailwind/shadcn primitives
3. Implement atoms to match the prototype, not the other way around
