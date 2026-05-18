# Feature Skill — Design Spec

> **Plan:** _link to be added when implementation plan is written_

---

## Overview

A Claude Code skill (`feature.md`) that drives feature development from initial idea through sticky-by-sticky implementation using Extreme Programming principles. It combines three patterns into one end-to-end flow: a guided Drafter phase that builds a story map through natural questions, a Provocateur phase that challenges the draft before approval, a persistent story map file as the living backlog, and a conductor that implements one sticky at a time by auto-invoking sub-skills.

Agents pick this up automatically when building any feature slice. Users invoke it explicitly with `/feature`.

---

## Design References

<p><strong>Combined flow diagram:</strong><br/>
<img src="2026-05-17-feature-skill-combined-flow.png" alt="Combined flow" width="800"/></p>

<p><strong>Physical story map reference:</strong><br/>
<img src="2026-05-17-feature-skill-story-map-photo.png" alt="Story map photo" width="800"/></p>

<p><strong>Story map vs decision tree:</strong><br/>
<img src="2026-05-17-feature-skill-story-map-vs-decision-tree.png" alt="Story map vs decision tree" width="800"/></p>

<p><strong>Digital story map reference:</strong><br/>
<img src="2026-05-17-feature-skill-story-map-digital-reference.png" alt="Digital story map reference" width="800"/></p>

<p><strong>Target story map UI:</strong><br/>
<img src="2026-05-17-feature-skill-story-map-ui-final.png" alt="Story map UI" width="800"/></p>

<p><strong>Decision Tree toggle view:</strong><br/>
<img src="2026-05-17-feature-skill-story-map-decision-tree.png" alt="Decision Tree view" width="800"/></p>

---

## Invocation

```
/feature "payments flow"     # named feature
/feature                     # skill asks for feature name
(agent auto-invokes)         # trigger: task involves building a named feature or user story
```

---

## Four Phases

### Phase 1 — Drafter

Skill asks natural questions to understand the feature — no story map terminology exposed to the user. The agent owns the mapping to story map structure internally.

Questions (one at a time):
1. What is the feature name?
2. Value Story (optional — user can skip): *As a [persona], I want [goal], so that [outcome]*
3. Who are the personas involved?
4. What are the main things each persona needs to accomplish?
5. For each accomplishment, what are the individual steps to get there?

From the answers the agent produces a draft story map: accomplishments become activity columns, steps become task stickies beneath each activity.

### Phase 2 — Provocateur

Before the user approves the draft, the skill challenges it with targeted questions:

- "Are there any stickies we could split further? Remember we want to work on the simplest thing possible. We're talking very, very small."
  - **Why XP pushes for the smallest possible slice:**
    - **Faster feedback** — a small slice that's "done" teaches us something *now*, not in two weeks. We find out we're wrong (or right) before we've sunk effort into the wrong direction.
    - **Smaller blast radius** — when something breaks (and it will), a tiny commit is easy to revert. A big one is a debugging archaeology dig.
    - **Better flow through RED → GREEN → REFACTOR** — small slices cycle cleanly; big ones get stuck half-done, half-tested, half-refactored.
    - **Less cognitive load** — what fits in your head is what you can ship without bugs. Big slices hide complexity in places no one is looking.
    - **Earlier value or earlier course-correction** — even a 30-minute slice can confirm or invalidate the design assumption underneath the whole feature.
    - **Smaller integration cost** — small commits merge cleanly; big ones turn into conflict-resolution sessions.
    - **Easier to pair on or hand off** — small slices have clear start and end points; big ones are hard to share.
- "What's the smallest set we'd commit to right now, and what should we defer? We want low WIP and the most important work first; everything else either waits or gets cut."
  - **Why XP and Lean limit WIP and force prioritization:**
    - **Low WIP = faster flow** — fewer things in-flight means each thing finishes (and ships) sooner.
    - **Prioritization forces value clarity** — if we can't say what's most important right now, we don't fully understand the feature yet.
    - **Highest-priority first reduces risk** — if we have to stop, we've already shipped what mattered most. The opposite (everything half-done) leaves nothing usable.
    - **Less context-switching** — a focused queue keeps the brain (and the test suite) on one thread instead of fragmenting attention across many parallel ideas.
    - **Cut = saved effort** — anything we don't actually need is the best work to skip. YAGNI applied at the sticky level.
    - **Deferred ≠ deleted** — deferred stickies stay visible on the board so they're not forgotten, but the model never suggests them as next.
    - **Late prioritization is cheaper than early commitment** — deferring something now is easy; unwinding six weeks of code built around a wrong priority is not.
- "Is the Value Story still accurate given this map?"
- "Is there a persona missing from any column?"

User can revise or approve as-is.

### Phase 3 — Persist

On approval, the skill writes two files to `story-maps/<feature-name>/`:

**`story-map.md`** — canonical source of truth, always written, portable to Miro and other tools:

```markdown
# Payments Flow

> As a buyer, I want to pay for goods online so I can receive them without visiting a store.

## User starts checkout
- [x] View cart summary
- [ ] Proceed to checkout
- [ ] Guest vs account choice

## User enters shipping
- [ ] Enter shipping address
- [ ] Validate address format
- [ ] Select shipping method
- [ ] Show delivery estimate

## User enters payment
- [ ] Enter card details
- [ ] Validate card number
- [ ] Apply promo code

## User reviews order
- [ ] Show order summary
- [ ] Show total with tax
- [ ] Back to edit

## User submits order
- [ ] Confirm and charge card
- [ ] Show confirmation screen
- [ ] ~~Email receipt~~ *(deferred)*
```

**Markdown rules:**
- `##` headings = activity columns
- `- [ ]` = task to do, `- [x]` = done, `~~text~~ *(deferred)*` = out of scope
- Value Story as a blockquote directly under the feature title

**`story-map.html`** — generated from the markdown, served locally as the visual board. Always regenerated from markdown after any update — the markdown is the single source of truth, HTML is always derived.

**What lives on disk:**
```
<project-root>/
  story-maps/
    payments-flow/
      story-map.md      ← canonical, portable
      story-map.html    ← generated visual board
```

### Phase 4 — Implement, sticky by sticky

Each session the skill reads `story-map.md` top to bottom, finds the first unchecked `- [ ]`, and surfaces it as the suggestion:

> *"Suggested next: 'Proceed to checkout' — confirm, or pick from the board"*

**Three ways to select the next sticky:**
1. **Confirm the suggestion** — say yes in terminal
2. **Click in the board** — click any unchecked sticky in the visual board; skill reads the selection from the events file
3. **Type it** — name a sticky directly in terminal; terminal always wins

Once a sticky is confirmed as active, the board highlights it (gold border + "▶ NOW" label) in real time.

**Per-sticky implementation sequence:**
1. Auto-invoke `/hexagonal` — governs how the code is structured
2. Follow TDD — failing test first, then minimal implementation
3. Run `/refactor` on naming after code is working
4. Commit with message tied to the sticky text
5. Check off the box: `- [ ]` → `- [x]` in `story-map.md`
6. Regenerate `story-map.html`
7. Surface next unchecked sticky

**Deferred stickies** are never suggested as next. Visible in the board but skipped. User can un-defer by editing the markdown directly.

**Done signal:** When all non-deferred stickies are checked, skill surfaces a completion summary (stickies completed, stickies deferred) and asks if the feature is ready to close out.

---

## Story Map UI

The visual board is a locally served HTML file generated from `story-map.md`. It is not a Kanban board — it is a tree-per-column layout where activity headers run left to right and task stickies hang vertically below each activity with upward arrows connecting levels.

**Layout:**
- **Activity headers** — numbered, text only, one per column
- **Top-level stickies** (green) — first task directly under each activity
- **Sub-task stickies** (yellow = view/select, blue = add/apply) — hang below with `↑` arrows
- **Deferred stickies** (pink) — visible, struck through, not clickable
- **Done stickies** — muted green, checkmark, not clickable
- **Active sticky** — gold border, `▶ NOW` label
- **Selectable stickies** — dashed hover state, `SELECT` label on hover, `✓ PICK` on click

**Suggestion bar** appears above the board showing the suggested next sticky and updates when the user clicks a different one.

**Grid background** — light gray crosshatch, white background.

**Reference UI screenshot:** `2026-05-17-feature-skill-story-map-ui-final.png`

---

## Storage and Portability

Markdown is always written regardless of which visual option is in use. It is the portable artifact — Miro export, future tooling, and version control all read from it.

| Option | Status | Notes |
|---|---|---|
| Markdown (`story-map.md`) | Always written | Canonical source of truth |
| HTML board (local server) | Phase 1 UI | Generated from markdown |
| Miro via REST API | Future | Reads from markdown, pushes to Miro board |

---

## Future Features

- **Decision Tree view** — same story map data reoriented: activities become a horizontal spine, top-level task stickies hang below each activity, and sub-tasks fan out horizontally at each depth level. Toggle between Story Map and Decision Tree at any time without changing the underlying data. Title updates to match active view. No timeline set — not in first version. See reference: `2026-05-17-feature-skill-story-map-decision-tree.png`.
- **Miro export** — `##` headings map to Miro activity stickies, `- [ ]` items map to task stickies beneath them, via Miro REST API.

---

## What This Spec Does Not Cover

- How the skill composes with future feature-archive or value-story skills
- Multi-user / team collaboration on a shared story map
- Branching within a sticky tree beyond flat vertical lists (future)
- CI/CD integration gates between stickies
