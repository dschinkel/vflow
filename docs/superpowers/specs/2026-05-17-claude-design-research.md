# Claude Design — Research Notes

> **Status:** Reference only. Captures what we learned about Anthropic's Claude Design product during the `/feature` UI brainstorm so we don't have to re-research it later.

> **Related:** Surfaces in the `/feature` skill design discussion — specifically the question of whether Claude Design could be used as the design tool for the story map UI, and the decision not to depend on it for v1.

---

## What it is

Claude Design is a hosted Anthropic Labs product. Launched **April 17, 2026**, currently in research preview for Claude Pro, Max, Team, and Enterprise subscribers. Powered by Claude Opus 4.7.

It lets users collaborate with Claude to produce visual work: designs, prototypes, slides, one-pagers, mockups. Positioned against Figma — the pitch is "designers and developers can use the same tool."

## Key capability — design-system extraction

The feature most relevant to vflow: **automated design-system extraction**.

During onboarding, Claude reads the user's codebase and design files and builds a working design system from existing CSS, typography, colors, and components. Every project after that reuses the extracted system automatically — Claude generates new UI that conforms to the system without having to be told the colors, spacing, or component patterns each time.

The framing is that a design system that lives in your repo and gets read every time you generate UI is a competitive moat.

## Atomic design relationship

Claude Design does **not** explicitly market itself as following atomic-design methodology (Brad Frost's atoms/molecules/organisms/templates/pages framework). However, the way it produces and reuses components naturally aligns with atomic-design thinking — a generated design system tends to surface as a layered component hierarchy whether the underlying tool calls it that or not.

In our brainstorm, the user's mention of "Claude Design / StoryMap" was about wanting an atomic-design component library, and Claude Design is one path to producing that — though not the only one.

## Why it's not a fit for the `/feature` story map UI (v1)

Three reasons it doesn't slot into vflow as a direct dependency:

1. **It's a hosted prototyping product, not an installable library.** Accessed in a browser as a separate Anthropic product. No package to import into a repo.
2. **No clean export path to a structured `feature-ui/` folder.** Output is tuned for design iteration, not for hardened production code that gets bundled by Vite, served by Koa, and distributed via `install.sh`.
3. **Code it generates is prototyping-shaped**, not aligned with the long-term maintenance profile of a skill UI that ships as part of vflow and gets rebuilt at install time by every user.

The user themselves landed on this: *"it looks like claude design is more for prototyping, not hardened apps."* Correct read.

## How it could still help, indirectly

- **Standalone prototyping.** The user can open Claude Design in a separate session to iterate on individual atoms or layout ideas, screenshot the result, and bring outputs back into vflow as visual references.
- **Visual reference during brainstorming.** Acts as a sandbox for "what should the sticky look like?" exploration that's hard to do in a CLI session.
- **Future code-export path (speculative).** If Anthropic ships a React component export, design tokens (CSS variables, Tailwind config), or similar machine-readable artifact from Claude Design, that could feed the atomic-design library in vflow directly. Not available today.

## Was considered as the in-CLI brainstorming companion

The user asked whether Claude Design could serve as the collaborative design tool *during this brainstorming session* — i.e., a visual companion the user and I could iterate in together as we work through `/feature`'s UI.

**Answer: no, not directly.** Claude Design runs in a separate browser tab as a separate product. I can't invoke it from this CLI session, can't see what it produces in real time, and can't react to user tweaks inside it. Workflows that *do* exist for collaborative visual work in this CLI:

- The brainstorming skill's built-in **Visual Companion** feature (a browser-based local companion for showing mockups during brainstorming) — closest local equivalent.
- Terminal-only mockups (ASCII boxes, inline descriptions, code snippets).
- The user driving Claude Design solo and pasting results back as references.

## Decision recorded for `/feature` v1

Do **not** depend on Claude Design for the `/feature` story map UI. Build atomic-design components directly in the CLI session with custom CSS matching the spec screenshots. Revisit if Claude Design adds a code-export path or an embedding API that would let it integrate with a repo-resident toolchain.

## Open questions to revisit later

- Does Claude Design ship (or will it ship) a React component export, design tokens (CSS variables, Tailwind config, etc.), or only design artifacts viewable in the hosted product?
- Licensing and usage scope for generated outputs — particularly if outputs become long-term parts of an open-source repo like vflow.
- Does the design-system extractor work in the other direction — can it read a hand-built atomic library (the one we'll build for `/feature`) and produce a Claude Design "system" that future Claude sessions reuse automatically?
- Will it expose an API for non-browser integration?

---

## Sources

- [Introducing Claude Design by Anthropic Labs](https://www.anthropic.com/news/claude-design-anthropic-labs)
- [Set up your design system in Claude Design — Anthropic Help Center](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design)
- [What Is Claude Design? — DataCamp](https://www.datacamp.com/blog/claude-design)
- [Claude Design (Anthropic): The Complete 2026 Guide — Agence Scroll](https://agence-scroll.com/en/blog/claude-design-anthropic-2026-guide)
- [How Good is Anthropic's Claude Design? — Designing with AI](https://newsletter.victordibia.com/p/how-good-is-anthropics-claude-design)
- [What Is Claude Design? Anthropic's New Visual Prototyping Tool Explained — MindStudio](https://www.mindstudio.ai/blog/what-is-claude-design-anthropic-visual-prototyping)
- [Claude Design is here. Everything you need to know — Department of Product](https://departmentofproduct.substack.com/p/claude-design-is-here-everything)
