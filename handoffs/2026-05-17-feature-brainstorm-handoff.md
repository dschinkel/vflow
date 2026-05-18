# vflow — Hand-off: /feature Brainstorm + Codebase Audit
_2026-05-17_

> Companion to the prior [2026-05-17-hand-off.md](2026-05-17-hand-off.md). That doc summarizes the repo as it stood after `/refactor`, `/tdd`, and `/hexagonal` shipped. This one picks up after the heavy `/feature` brainstorm and a codebase reflection pass.

---

## What's Shipped (unchanged from prior hand-off)

| Command | Status | Location | Notes |
|---|---|---|---|
| `/refactor` | Shipped, in use | `commands/refactor.md` | Now accepts `--output <dir>` (added during `/tdd` impl) |
| `/tdd` | Shipped | `commands/tdd.md` | Full RED/GREEN/REFACTOR conductor with state file + rollback |
| `/hexagonal` (core) | Shipped | `commands/hexagonal.md` | Greenfield-shaped; brownfield procedure still being designed |
| `/hexagonal-scaffold` | Shipped | `commands/hexagonal-scaffold.md` | Greenfield-only operation invoked by `/hexagonal` |

Hooks: `end-refactor-log-session-stats.sh` (Stop, token counting), `start-refactor-skill.sh` (UserPromptSubmit, context-window guard). Both wired into `install.sh`.

---

## What Got Done This Session

1. **Refined `/feature` Provocateur questions** — first two bullets rewritten:
   - "Are there any stickies we could split further?" + 7 XP reasons (smallest-slice rationale)
   - "What's the smallest set we'd commit to right now, and what should we defer?" + 7 XP/Lean reasons (low-WIP + prioritization rationale)
2. **Resized + re-wrapped Design References images** in the `/feature` spec (now `<img width="800"/>` inside `<p>` blocks so labels stick to their images).
3. **`/feature` UI architecture decided:** Koa + React + Vite + SSE + pnpm + Custom CSS + atomic design + build-at-install distribution.
4. **Sticky-scope model adopted** from GUIDELINES.md (P0.0, P0.9, T1.3.1, T1.12–T1.14, A1.6.8) — scope ∈ `{cosmetic, ui-only, ui-and-server, server-only}` determines TDD depth and which sub-skills fire.
5. **Per-sticky classification UX:** dual-mode pattern (agent proposes bulk + reasoning OR user specifies per sticky), with mid-feature mode-switching allowed.
6. **Cosmetic sticky shortcut:** `/feature` handles edit/test/commit/check-off directly. No `/tdd`, no `/hexagonal`.
7. **Sub-skill composition mental model written into spec:** `/tdd` is the driver, `/hexagonal` is the shape, `/refactor` is the polish inside `/tdd`'s REFACTOR.
8. **Composition contract via `.tdd-context.json`** locked: `/feature` writes `targetService` and `scope` in addition to existing fields.
9. **Sibling spec created:** [Hexagonal Invocation Modes brainstorm](../docs/superpowers/specs/skills/hexagonal/2026-05-17-hexagonal-invocation-modes.md) — captures greenfield vs brownfield invocation surface for `/hexagonal`.
10. **New spec:** [Claude Design research notes](../docs/superpowers/specs/2026-05-17-claude-design-research.md) — Claude Design exists (Anthropic Labs, April 2026 launch), is a hosted prototyping product, not a fit as a dependency for `/feature` v1.
11. **Feature spec checkpoint written** — new sections: UI Stack and Distribution, Sub-Skill Composition, Brainstorm In Progress (open questions). Phase 4 heavily rewritten. Story Map UI section adjusted for v1 read-only board.
12. **New memories saved** (cross-conversation):
    - `feedback_smallest-slice.md` — push for the smallest possible slice always
    - `feedback_low-wip-prioritize.md` — short prioritized list, most important first
    - `feedback_pnpm-not-npm.md` — always use pnpm for Node work

---

## Key Decisions Locked In

- **Feature = potentially multi-service.** A feature can span multiple services (decomposed by domain/use case). Per-sticky `targetService` is real, not implicit.
- **`/feature` invokes `/hexagonal` for every non-cosmetic sticky** — explicit invocation, brownfield mode dominant. Greenfield mode only fires when the sticky's `targetService` is a new service that doesn't exist yet. Auto-trigger via frontmatter description is NOT the brownfield path.
- **Outside-in TDD always** for `/feature`-driven invocations (per GUIDELINES.md T1.14). The starting layer is derived from sticky scope.
- **Story map UI is live from Phase 1** — board open during Drafter/Provocateur, updates in real time during Phase 4.
- **v1 board is read-only.** Click-to-select is v2 (requires events-file or POST mechanism not designed yet).
- **Atomic design organization** for the React component library, hand-built in CLI (no Claude Design dependency, no Tailwind, no shadcn).
- **pnpm not npm** — project-wide.

---

## Open Questions (Continue Brainstorm)

See [Open Questions section of /feature spec](../docs/superpowers/specs/feature/2026-05-17-feature-skill-design.md#brainstorm-in-progress--open-questions). High-level groups:

- **UI behavior:** server lifecycle (PID, port, cleanup), markdown→JSON pipeline, SSE endpoint design, v2 click-to-select.
- **Visual layer:** detailed atomic inventory, polish-target specifics, yellow/blue sub-task color rule.
- **Composition:** Mode-A bulk-review UX (combined vs separate tables), done signal / feature close-out format.
- **Repo structure:** `feature-ui/` layout, `install.sh` changes for pnpm + Vite.
- **`/hexagonal` brownfield invocation:** Q1–Q5 in the [Hexagonal Invocation Modes brainstorm](../docs/superpowers/specs/skills/hexagonal/2026-05-17-hexagonal-invocation-modes.md).

---

## Discrepancies / Issues Found (Codebase Audit)

> **Cleanup pass status — updated 2026-05-17 (post-archive):**
> - ✅ **A, B** — both orphan-plan groups archived to `docs/superpowers/plans/archive/` with `git mv` (history preserved). Each archived file gained a `Status: Archived` header explaining what superseded it. Relative paths inside the archived plans were re-anchored to their new locations, and the 2 inbound links from refactor research docs were repointed to the archive paths.
> - ❌ **C, D, E, J** — not addressed in this cleanup pass.
> - ⚠️ **Broken cross-links** — partial: 2 of the original 4 resolved (1 directly via archive, 1 because its container moved into a code fence). 2 still broken: the `/tdd` plan body reference and the hexagonal plan self-references.

### Stale / orphan files

**A. Obsolete hexagonal plans (no inbound spec link).** ✅ **RESOLVED** — archived 2026-05-17 to `docs/superpowers/plans/archive/skills/hexagonal/`. Earlier brainstorm produced a split-pair plan that's been superseded by the unified plan we wrote and committed. The original orphan files were:
- `docs/superpowers/plans/skills/hexagonal/2026-05-17-hexagonal-architecture-skill.md`
- `docs/superpowers/plans/skills/hexagonal/2026-05-17-hexagonal-scaffold-skill.md`

**Canonical now:** `docs/superpowers/plans/2026-05-17-hexagonal-architecture-skill.md` (the spec's `Plan:` link points only here).

**B. Orphan refactor plan.** ✅ **RESOLVED** — archived 2026-05-17 to `docs/superpowers/plans/archive/skills/2026-05-14-refactor-skill.md`. The 2 inbound links from `docs/superpowers/specs/skills/refactor-skill/*.md` were repointed to the archive path with an "(archived)" annotation noting that `/refactor` has since gained the `--output <dir>` flag.

**C. Orphan research specs.** ❌ **NOT RESOLVED** — still pending. Files in question:
- `docs/superpowers/specs/2026-05-14-research-vflow-plugin-distribution.md` — no inbound links.
- `docs/superpowers/specs/models-research.md` — no date prefix (convention is `YYYY-MM-DD-...`), no inbound links.

### Broken cross-links

Python check originally found **4 actually broken `.md` links** (after correcting for `realpath -m` macOS incompatibility). Status update post-archive:

1. ❌ **STILL BROKEN.** `plans/2026-05-17-tdd-skill-design.md` has a body reference to `../specs/2026-05-17-tdd-skill-design.md`. That path is stale — the /tdd spec was moved to `specs/skills/` during reorganization. The plan's top `Spec:` header was updated; this body reference was missed. Needs a targeted edit inside the plan body.
2. ❌ **STILL BROKEN.** `plans/2026-05-17-hexagonal-architecture-skill.md` has two self-references using `../../plans/...` that resolve OUTSIDE `docs/superpowers/`. The path overshoots one level — should be `../plans/...` or just the bare filename. (Both instances still broken; the cross-link checker now skips inside code fences, so only one shows in the active scan, but both are present in the file.)
3. ✅ **RESOLVED.** `plans/skills/hexagonal/2026-05-17-hexagonal-scaffold-skill.md` (one of the obsolete plans from issue A) referenced `../plans/2026-05-17-hexagonal-scaffold-skill.md`. The whole file moved into the archive AND that broken reference happens to sit inside a code fence (example markdown), so it no longer surfaces. The file's header now explicitly notes that example blocks may contain stale paths preserved as historical context only.

**Reality check on the original prediction.** The hand-off originally said "If you archive/delete the obsolete plans (issue A), 3 of these 4 disappear automatically." That turned out to be optimistic — the archive resolved 1, but the moves themselves introduced 4 new breakages (relative paths inside the archived files now assumed the wrong levels). Those 4 were fixed inline during the archive. Net result: 2 of the original 4 broken links remain.

### Documentation drift

**D. `README.md` is an empty stub.** ❌ **NOT RESOLVED** — still pending. Just `# vflow` and nothing else. Anyone landing on the repo via GitHub sees nothing. Should at minimum point to `CLAUDE.md` for orientation.

**E. `CLAUDE.md` is out of date.** ❌ **NOT RESOLVED** — still pending. Mentions only `/refactor`. Doesn't mention:
- `/tdd`, `/hexagonal`, `/hexagonal-scaffold` (all shipped)
- `.tdd-context.json` in `.gitignore`
- The future `/feature` skill or its Node-app dependency (`feature-ui/`, pnpm)
- The pnpm convention for any Node work

Either update `CLAUDE.md` now to reflect shipped state, or note it'll be updated when `/feature` lands.

### Forward-looking spec/skill gaps (will block `/feature` implementation)

These aren't bugs in shipped code — they're known mismatches between `/feature`'s spec and what its sub-skills currently support. Each needs an update when `/feature` is implemented.

**F. `/tdd` skill missing `targetService` + `scope` in `.tdd-context.json`.** Current schema:
```json
{ "feature", "sticky", "storyMapPath", "logFolder", "currentIncrement", "currentPhase", "filesChanged" }
```
Needed when `/feature` lands:
```json
{ "feature", "sticky", "storyMapPath", "logFolder", "targetService", "scope", "currentIncrement", "currentPhase", "filesChanged" }
```
`/tdd` also needs to adapt opening flow based on `scope` (skip direction question, derive starting layer, bypass entirely if cosmetic). Requires updates to both `commands/tdd.md` and the /tdd spec.

**G. `/hexagonal` has no brownfield procedure.** Current skill is greenfield-shaped (language prompt → destination resolution → optional reference analysis → scaffold dispatch). Brownfield invocation surface is still being designed in the invocation-modes brainstorm spec. Once Q1–Q5 there are resolved, `commands/hexagonal.md` needs a parallel "Brownfield Flow" section and a Mode Detection step at the top of its procedure.

**H. `install.sh` doesn't handle the future `feature-ui/` Node app.** Currently it just copies `commands/*.md` and `hooks/*.sh`. When `/feature` lands, `install.sh` needs:
- A check for `pnpm` availability
- `pnpm install` in `feature-ui/`
- `pnpm build` in `feature-ui/`
- A way to start/stop the server (likely managed by `/feature` itself, not by `install.sh`)

**I. Hook registration in `install.sh` is hand-listed per hook.** `STOP_HOOK_COMMAND` and `SKILL_START_HOOK_COMMAND` are hardcoded strings for the refactor hooks. When future hooks are added (none currently planned for `/tdd`/`/hexagonal`/`/feature` per their specs, but the door is open), `install.sh` needs a per-hook addition. Worth noting as low-grade maintenance debt; not urgent.

### Naming inconsistencies

**J. `models-research.md` lacks date prefix.** ❌ **NOT RESOLVED** — still pending. Convention everywhere else is `YYYY-MM-DD-<topic>.md`. Either rename to `2026-05-14-models-research.md` (best guess at original date) or leave as a known exception.

### Things that are FINE (worth recording as "verified")

- All shipped commands have matching files in both `commands/` and `.claude/commands/` (no drift between canonical and mirror).
- `/tdd` spec ↔ plan cross-links resolve correctly (top-of-file `Spec:`/`Plan:` headers both work post-move).
- `/hexagonal` spec ↔ plan cross-links resolve correctly.
- `/refactor --output` flag is documented in both copies (`commands/refactor.md` and `.claude/commands/refactor.md`).
- `.tdd-context.json` is in `.gitignore` (won't accidentally land in commits).
- All sibling spec cross-links from the `/feature` spec resolve (verified post-reorganization).

---

## What to Pick Up Next

In rough priority order (whichever feels right):

1. **Cleanup pass on the audit findings** (~30 min):
   - Archive or delete the orphan plans (issue A, B)
   - Fix the 4 broken links (issue, post-archive)
   - Update `CLAUDE.md` to mention shipped commands and the pnpm/feature-ui future (issue E)
   - Decide what to do with the empty `README.md` (issue D)
   - Rename `models-research.md` or accept the exception (issue J)
2. **Continue `/feature` brainstorm** — pick from the Open Questions in the `/feature` spec. The atomic component inventory feels like the natural next thing — once that's locked, the spec is close to "ready to plan."
3. **Resolve `/hexagonal` invocation-modes brainstorm** (Q1–Q5 in that sibling spec). Required before `/feature` can be implemented end-to-end.
4. **Decide when to write the `/feature` implementation plan.** The spec still has Open Questions; the plan can't be locked until those are resolved. But a v0 plan covering only what's decided is possible if you want to start shipping incrementally.

---

## Memories Active This Session

Saved cross-conversation in `~/.claude/projects/-Users-zevia-code-ai-vflow/memory/`:

- `feedback_no-auto-commit.md` — never commit without explicit ask
- `feedback_ask-before-implement.md` — always ask spec-vs-implement first
- `feedback_spec-plan-crosslinks.md` — bidirectional cross-links on every spec/plan pair
- `feedback_js-module-pattern.md` — closures, no `create` prefix, no `execute()`
- `feedback_test-naming.md` — prose + domain language only
- `feedback_domain-folder.md` — no `domain/` by default
- `feedback_smallest-slice.md` — push for smallest possible slice
- `feedback_low-wip-prioritize.md` — short prioritized list, most important first
- `feedback_pnpm-not-npm.md` — always pnpm for Node work
