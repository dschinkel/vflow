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

```
/feature "payments flow"   # pass feature name directly — skips Question 1
/feature                   # ask for feature name
(agent auto-invokes)       # trigger: task involves building a named feature or user story
```

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

```
Draft Story Map: <Feature Name>

> <value story, or blank>

| Activity | Stickies |
|---|---|
| User starts checkout | View cart summary / Proceed to checkout / Guest vs account choice |
| User enters payment  | Enter card details / Validate card / Apply promo code |
```

Proceed to Phase 2.

---

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

## Phase 3 — Persist

On approval, do the following in order.

### Step 1 — Write story-map.md

Create `story-maps/<feature-slug>/story-map.md` in the current project directory:

```markdown
# <Feature Name>

> <value story — omit this line if blank>

## <Activity Name>
- [ ] <sticky text>
- [ ] <sticky text>
- ~~<deferred sticky text>~~ *(deferred)*

## <Activity Name>
...
```

### Step 2 — Start the story map server

```bash
"$HOME/.claude/feature-ui/node_modules/.bin/tsx" \
  "$HOME/.claude/feature-ui/server/index.ts" \
  "story-maps/<feature-slug>/story-map.md" 3847 &
echo $! > "$HOME/.claude/feature-ui/.server.pid"
```

Print: *"Story map board is live at http://localhost:3847 — open it in your browser."*

### Step 3 — Proceed to Phase 4

---

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

```bash
curl -s -X POST http://localhost:3847/active-sticky \
  -H 'Content-Type: application/json' \
  -d '{"text":"<sticky text>"}'
```

4. Implement per scope rules below.
5. Clear the active sticky:

```bash
curl -s -X POST http://localhost:3847/active-sticky \
  -H 'Content-Type: application/json' \
  -d '{"text":null}'
```

6. Loop to step 1.

---

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

```json
{
  "feature": "<feature-slug>",
  "sticky": "<sticky text>",
  "storyMapPath": "story-maps/<feature-slug>/story-map.md"
}
```

3. Invoke `/tdd "<sticky text>"`. Outside-in TDD is automatic (state file present). Component scaffold (the View) is Step 1, non-TDD. `/tdd` handles per-increment commits, sticky check-off in `story-map.md`, and `.tdd-context.json` cleanup on exit.
4. After `/tdd` exits, loop. (Do NOT check off the sticky — `/tdd` already did.)

#### `ui-and-server`

Same as `ui-only` but `/hexagonal` enforces both frontend AND backend hex layers. `/tdd` drives outside-in through every layer: UI scaffold (non-TDD) → hook → controller → use-case → repository → data.

#### `server-only`

1. Invoke `/hexagonal <targetService>` (brownfield mode) to enforce backend layers: controller → use-case → repository → data.
2. Write `.tdd-context.json`:

```json
{
  "feature": "<feature-slug>",
  "sticky": "<sticky text>",
  "storyMapPath": "story-maps/<feature-slug>/story-map.md"
}
```

3. Invoke `/tdd "<sticky text>"`. Outside-in TDD from the controller layer.
4. After `/tdd` exits, loop. (Do NOT check off — `/tdd` already did.)

---

### Done signal

When no unchecked `- [ ]` stickies remain (deferred excluded), the loop ends.

Count stickies from `story-map.md`:
- Completed: count of `- [x]`
- Deferred: count of `~~...~~ *(deferred)*`

Print:

```
Feature complete: <Feature Name>

| Completed | Deferred |
|---|---|
| N stickies | M stickies |
```

Ask: *"Ready to close out this feature?"*

**Yes:**

Prepend to `story-map.md` (insert after the `# <Feature Name>` title line):

```markdown
> *Completed: YYYY-MM-DD*
```

If a plan file for this feature exists in `docs/superpowers/plans/`, move it to `docs/superpowers/plans/done/`.

Stop the server:

```bash
kill "$(cat "$HOME/.claude/feature-ui/.server.pid")" 2>/dev/null || true
rm -f "$HOME/.claude/feature-ui/.server.pid"
```

Print: *"Feature '<name>' closed out. story-map.md marked complete."*

**No:** Leave the map as-is. Server keeps running. Resume anytime with `/feature`.

---
