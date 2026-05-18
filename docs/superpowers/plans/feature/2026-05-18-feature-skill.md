# <span style="color:#76a039">/feature Skill Implementation Plan</span>

> **Spec:** [Feature Skill — Design Spec](../../specs/skills/feature/2026-05-17-feature-skill.md)
> **Prerequisite:** [feature-ui plan](2026-05-18-feature-ui.md) complete — `~/.claude/feature-ui/` deployed before running these tasks.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

### <span style="color:#76a039">Goal</span>

Write `commands/feature.md` — the four-phase XP conductor (Drafter → Provocateur → Persist → Implement) that turns a feature idea into a story map and drives sticky-by-sticky implementation using `/hexagonal`, `/tdd`, and `/refactor` as sub-skills.

---

## <span style="color:#76a039">File Structure</span>

| File | Action | Purpose |
|------|--------|---------|
| `commands/feature.md` | Create | The `/feature` skill |
| `.claude/commands/feature.md` | Create | Local mirror |
| `CLAUDE.md` | Modify | Add `/feature` to shipped commands table |
| `docs/superpowers/specs/feature/2026-05-17-feature-skill.md` | Modify | Replace `Plan:` placeholder |

---

## <span style="color:#76a039">Task 1: `commands/feature.md` — frontmatter, invocation, Phase 1</span>

**Files:**
- Create: `commands/feature.md`

- [ ] **Step 1: Create `commands/feature.md`**

```markdown
---
description: Use when user runs /feature, says "build a feature", asks to plan and implement a feature or user story, or when building a named feature slice end-to-end.
allowed-tools: "Read Edit Write Bash"
---

# Feature Skill

A four-phase XP conductor: Drafter → Provocateur → Persist → Implement. Turns a feature idea into a story map and implements it sticky-by-sticky using /hexagonal, /tdd, and /refactor as sub-skills, with a live visual board at http://localhost:3847.

> **Recommended model:** `claude-opus-4-7`
> To switch: `/model claude-opus-4-7`

---

## Invocation

\`\`\`
/feature "payments flow"   # pass feature name directly — skips Question 1
/feature                   # ask for feature name
(agent auto-invokes)       # trigger: task involves building a named feature or user story
\`\`\`

---

## On Start — Check for Existing Session

Before running Phase 1, check for an in-progress map in the current project:

1. Look for any `story-maps/*/story-map.md` in the current working directory.
2. If one exists with unchecked `- [ ]` stickies:
   - Print: *"Found in-progress feature: '<feature name>'. Resume it or start a new one?"*
   - **Resume** → skip Phases 1–3, jump to Phase 4 with that feature's slug and map path.
   - **New** → proceed to Phase 1.
3. If none found, proceed to Phase 1.

---

## Phase 1 — Drafter

Ask these questions one at a time. Wait for the answer before asking the next.

### Question 1 — Feature name

If a name was passed as an argument to `/feature`, use it and skip this question.

Otherwise: *"What feature are we building?"*

Derive the feature slug: lowercase, spaces → `-`, strip everything except alphanumerics and hyphens.
Examples: "Payments Flow" → `payments-flow`, "User Auth v2" → `user-auth-v2`.

### Question 2 — Value Story (optional)

*"What's the value story? (skip to continue) — As a [persona], I want [goal], so that [outcome]."*

If skipped, omit the value story from the map.

### Question 3 — Personas

*"Who are the people involved in this feature?"*

### Question 4 — Accomplishments

*"What are the main things each persona needs to accomplish?"*

Each distinct accomplishment becomes an activity column.

### Question 5 — Steps

*"For each accomplishment, what are the individual steps to get there?"*

Each step becomes a task sticky beneath its activity.

After all answers, show a draft in your response:

\`\`\`
Draft Story Map: <Feature Name>

> <value story, or blank>

| Activity | Stickies |
|---|---|
| User starts checkout | View cart summary / Proceed to checkout / Guest vs account choice |
| User enters payment  | Enter card details / Validate card / Apply promo code |
\`\`\`

Proceed to Phase 2.

---
```

- [ ] **Step 2: Commit**

```bash
git add commands/feature.md
git commit -m "feat: feature.md — frontmatter, invocation, Phase 1 Drafter"
```

---

## <span style="color:#76a039">Task 2: `commands/feature.md` — Phase 2 and Phase 3</span>

**Files:**
- Modify: `commands/feature.md`

- [ ] **Step 1: Append Phase 2 — Provocateur**

```markdown
## Phase 2 — Provocateur

Challenge the draft with four questions in sequence. Present each as a direct challenge.

### Challenge 1 — Smallest slice

*"Are there any stickies we could split further? We want very, very small — a 30-minute slice is better than a half-day slice. What can we split?"*

Update the draft if stickies are split.

### Challenge 2 — WIP and priority

*"What's the smallest set we'd commit to right now? Most important first — everything else waits or gets cut. What should we defer?"*

Mark deferred stickies as `~~text~~ *(deferred)*` in the draft.

### Challenge 3 — Value Story accuracy

*"Is the value story still accurate given this map?"*

Update if needed.

### Challenge 4 — Missing personas

*"Is there a persona missing from any column?"*

Add any missing stickies or columns.

Show the revised draft, then ask: *"Approve this map?"*

- **Yes** → Phase 3.
- **No** → ask what to change, update, re-ask.

---
```

- [ ] **Step 2: Append Phase 3 — Persist and server start**

```markdown
## Phase 3 — Persist

On approval, do the following in order.

### Step 1 — Write story-map.md

Create `story-maps/<feature-slug>/story-map.md` in the current project directory:

\`\`\`markdown
# <Feature Name>

> <value story — omit this line if blank>

## <Activity Name>
- [ ] <sticky text>
- [ ] <sticky text>
- ~~<deferred sticky text>~~ *(deferred)*

## <Activity Name>
...
\`\`\`

### Step 2 — Start the story map server

\`\`\`bash
"$HOME/.claude/feature-ui/node_modules/.bin/tsx" \
  "$HOME/.claude/feature-ui/server/index.ts" \
  "story-maps/<feature-slug>/story-map.md" 3847 &
echo $! > "$HOME/.claude/feature-ui/.server.pid"
\`\`\`

Print: *"Story map board is live at http://localhost:3847 — open it in your browser."*

### Step 3 — Proceed to Phase 4

---
```

- [ ] **Step 3: Commit**

```bash
git add commands/feature.md
git commit -m "feat: feature.md — Phase 2 Provocateur + Phase 3 Persist + server start"
```

---

## <span style="color:#76a039">Task 3: `commands/feature.md` — Phase 4 sticky selection and classification</span>

**Files:**
- Modify: `commands/feature.md`

- [ ] **Step 1: Append Phase 4 header, classification, and sticky selection loop**

```markdown
## Phase 4 — Implement, sticky by sticky

### One-time classification at Phase 4 start

Before any sticky runs, classify all unchecked stickies. Ask once:

*"How should I classify each sticky's service and scope?
  (a) I propose, you review and approve in bulk.
  (b) You specify per sticky as we go."*

**Mode A — agent proposes, bulk review:**

Examine each unchecked sticky and the workspace (look for existing service folders). Produce a table:

| Sticky | Target service | Scope |
|---|---|---|
| Proceed to checkout | checkout | ui-only |
| Enter card details | payments | ui-and-server |
| Validate card number | payments | server-only |
| Show order summary | orders | ui-only |

Scope values:
- `cosmetic` — pure visual/text change, no logic.
- `ui-only` — frontend hook → repository → data only.
- `ui-and-server` — frontend AND backend layers.
- `server-only` — backend controller → use-case → repository → data only.

Ask: *"Edit any row, then say 'approve'."* Apply all edits at once.

**Mode B — user specifies per sticky:**

Before each sticky, ask: *"Sticky '<text>' — target service? scope?"*

**Switching modes:** user can say "switch to mode B" or "switch to mode A" at any time.

---

### Sticky selection loop

Each iteration:

1. Read `story-map.md` top to bottom. Find the first unchecked `- [ ]` sticky (skip deferred `~~...~~`).
2. Print: *"Suggested next: '<text>' — confirm, or name a different sticky."*
3. On confirm (or user-named sticky), set it active on the board:

\`\`\`bash
curl -s -X POST http://localhost:3847/active-sticky \
  -H 'Content-Type: application/json' \
  -d '{"text":"<sticky text>"}'
\`\`\`

4. Implement per scope rules below.
5. Clear the active sticky:

\`\`\`bash
curl -s -X POST http://localhost:3847/active-sticky \
  -H 'Content-Type: application/json' \
  -d '{"text":null}'
\`\`\`

6. Loop to step 1.

---
```

- [ ] **Step 2: Commit**

```bash
git add commands/feature.md
git commit -m "feat: feature.md — Phase 4 sticky selection and classification"
```

---

## <span style="color:#76a039">Task 4: `commands/feature.md` — Phase 4 scope flows, done signal, server stop</span>

**Files:**
- Modify: `commands/feature.md`

- [ ] **Step 1: Append scope routing flows**

```markdown
### Per-sticky implementation — scope flows

#### `cosmetic`

1. Make the edit directly with the Edit tool.
2. Run the project's existing test suite to confirm nothing broke.
3. Commit: `git commit -m "feat: <feature-slug>/<sticky-slug>: <sticky text>"`.
4. Check off the sticky in `story-map.md` (change `- [ ]` to `- [x]`).
5. Loop.

#### `ui-only`

1. Invoke `/hexagonal <targetService>` (brownfield mode) to enforce frontend hex layers: hook → repository → data.
2. Write `.tdd-context.json` at the project root:

\`\`\`json
{
  "feature": "<feature-slug>",
  "sticky": "<sticky text>",
  "storyMapPath": "story-maps/<feature-slug>/story-map.md"
}
\`\`\`

3. Invoke `/tdd "<sticky text>"`. Outside-in TDD is automatic (state file present). Component scaffold (the View) is Step 1, non-TDD. `/tdd` handles per-increment commits, sticky check-off in `story-map.md`, and `.tdd-context.json` cleanup on exit.
4. After `/tdd` exits, loop. (Do NOT check off the sticky — `/tdd` already did.)

#### `ui-and-server`

Same as `ui-only` but `/hexagonal` enforces both frontend AND backend hex layers. `/tdd` drives outside-in through every layer: UI scaffold (non-TDD) → hook → controller → use-case → repository → data.

#### `server-only`

1. Invoke `/hexagonal <targetService>` (brownfield mode) to enforce backend layers: controller → use-case → repository → data.
2. Write `.tdd-context.json`:

\`\`\`json
{
  "feature": "<feature-slug>",
  "sticky": "<sticky text>",
  "storyMapPath": "story-maps/<feature-slug>/story-map.md"
}
\`\`\`

3. Invoke `/tdd "<sticky text>"`. Outside-in TDD from the controller layer.
4. After `/tdd` exits, loop. (Do NOT check off — `/tdd` already did.)

---

### Done signal

When no unchecked `- [ ]` stickies remain (deferred excluded), the loop ends.

Count stickies from `story-map.md`:
- Completed: count of `- [x]`
- Deferred: count of `~~...~~ *(deferred)*`

Print:

\`\`\`
Feature complete: <Feature Name>

| Completed | Deferred |
|---|---|
| N stickies | M stickies |
\`\`\`

Ask: *"Ready to close out this feature?"*

**Yes:**

Prepend to `story-map.md` (insert after the `# <Feature Name>` title line):

\`\`\`markdown
> *Completed: YYYY-MM-DD*
\`\`\`

Stop the server:

\`\`\`bash
kill "$(cat "$HOME/.claude/feature-ui/.server.pid")" 2>/dev/null || true
rm -f "$HOME/.claude/feature-ui/.server.pid"
\`\`\`

Print: *"Feature '<name>' closed out. story-map.md marked complete."*

**No:** Leave the map as-is. Server keeps running. Resume anytime with `/feature`.

---
```

- [ ] **Step 2: Commit**

```bash
git add commands/feature.md
git commit -m "feat: feature.md — Phase 4 scope flows, done signal, server stop"
```

---

## <span style="color:#76a039">Task 5: Mirror to `.claude/commands/`</span>

**Files:**
- Create: `.claude/commands/feature.md`

- [ ] **Step 1: Copy**

```bash
cp commands/feature.md .claude/commands/feature.md
```

- [ ] **Step 2: Verify identical**

```bash
diff commands/feature.md .claude/commands/feature.md
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add .claude/commands/feature.md
git commit -m "feat: mirror feature.md to .claude/commands/"
```

---

## <span style="color:#76a039">Task 6: `CLAUDE.md` and spec cross-link</span>

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/specs/feature/2026-05-17-feature-skill.md`

- [ ] **Step 1: Add `/feature` to the shipped commands table in `CLAUDE.md`**

The table currently ends with the `/hexagonal-scaffold` row. Add:

```markdown
| `/feature` | `commands/feature.md` — Drafter → Provocateur → Persist → Implement; story map board at `localhost:3847` |
```

- [ ] **Step 2: Replace plan-link placeholder in the spec**

The spec line 3 reads:

```markdown
> **Plan:** _link to be added when implementation plan is written_
```

Replace with:

```markdown
> **Plan:** [feature-ui](../../plans/2026-05-18-feature-ui.md) · [feature skill](../../plans/2026-05-18-feature-skill.md)
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md docs/superpowers/specs/feature/2026-05-17-feature-skill.md
git commit -m "docs: update CLAUDE.md for /feature; cross-link spec → plans"
```
