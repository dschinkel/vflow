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
   - Ask:

     > 🟠 *"Found in-progress feature: '<feature name>'. Resume it or start a new one?"*

   - **Resume** → invoke the **Reset story map server** procedure below with that feature's map path, then skip Phases 1–3 and jump to Phase 4 with that feature's slug and map path.
   - **New** → proceed to Phase 1.
3. If none found, proceed to Phase 1.

### Reset story map server

Used by the Resume path above. Guarantees the UI starts clean — fresh in-memory state (no stuck `activeStickyText`), serving the resumed feature's `story-map.md`. The previous server (if any) is killed and a new one is launched.

Why kill-and-relaunch rather than POST `/active-sticky` with `null`: the prior server may be dead (in which case the in-place POST fails) or may be serving a different feature's `mapPath` from a previous run (in which case clearing active-sticky doesn't fix the structural mismatch). Restarting the process handles all three end-states uniformly — alive-with-stale-state, dead, alive-with-wrong-map.

Run this block, substituting `<mapPath>` with the resumed feature's `story-maps/<feature-slug>/story-map.md`:

```bash
PID_FILE="$HOME/.claude/feature-ui/.server.pid"
if [ -f "$PID_FILE" ]; then
  OLD_PID="$(cat "$PID_FILE")"
  kill "$OLD_PID" 2>/dev/null || true
  rm -f "$PID_FILE"
  # Give the port a moment to free.
  sleep 0.5
fi
"$HOME/.claude/feature-ui/node_modules/.bin/tsx" \
  "$HOME/.claude/feature-ui/server/index.ts" \
  "<mapPath>" 3847 &
echo $! > "$PID_FILE"
```

Then print:

> 🟤 *"Story map server restarted on http://localhost:3847 — refresh the browser tab if it doesn't update on its own."*

The browser's SSE connection will reconnect automatically and receive a fresh state payload with `activeStickyText: null`.

Phase 3 Step 2 (new-feature server launch) also invokes this procedure so that starting a new feature while a prior server is alive on port 3847 doesn't fail — the prior server is killed first and the port is freed before the new server launches.

---

## Phase 1 — Drafter

### Banner — print first, before any prompt

The very first thing emitted in Phase 1 is this banner. Print it verbatim inside a fenced code block so leading whitespace is preserved. The six node emojis (🔴🟠🟡🟢🔵🟣) supply the rainbow effect — modern terminals render them as colored dots. Do not substitute, rearrange, or recolor them. Do not wrap them in `<span>` tags. The banner fires regardless of whether the feature name came from the `/feature` argument or has to be asked for next — it announces "new feature, fresh story map" either way.

```
       NEW FEATURE

           🔴
          ╱ ╲
         🟠   🟡
        ╱ ╲   ╲
       🟢  🔵  🟣
```

After the banner is printed, proceed to Question 1.

### Questions

Ask these questions one at a time. Wait for the answer before asking the next.

### Question 1 — Feature name

If a name was passed as an argument to `/feature`, use it and skip this question.

Otherwise, ask:

> 🟠 *"What feature are we building?"*

Derive the feature slug: lowercase, spaces → `-`, strip everything except alphanumerics and hyphens.
Examples: "Payments Flow" → `payments-flow`, "User Auth v2" → `user-auth-v2`.

### Question 2 — Value Story (optional)

> 🟠 *"What's the value story? (skip to continue) — As a [persona], I want [goal], so that [outcome]."*

If skipped, omit the value story from the map.

### Question 3 — Personas

> 🟠 *"Who are the people involved in this feature?"*

### Question 4 — Accomplishments

> 🟠 *"What are the main things each persona needs to accomplish?"*

Each distinct accomplishment becomes an activity column.

### Question 5 — Steps

> 🟠 *"For each accomplishment, what are the individual steps to get there?"*

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

> 🟠 *"Are there any stickies we could split further? We want very, very small — a 30-minute slice is better than a half-day slice. What can we split?"*

Update the draft if stickies are split.

### Challenge 2 — WIP and priority

> 🟠 *"What's the smallest set we'd commit to right now? Most important first — everything else waits or gets cut. What should we defer?"*

Mark deferred stickies as `~~text~~ *(deferred)*` in the draft.

### Challenge 3 — Value Story accuracy

> 🟠 *"Is the value story still accurate given this map?"*

Update if needed.

### Challenge 4 — Missing personas

> 🟠 *"Is there a persona missing from any column?"*

Add any missing stickies or columns.

Show the revised draft, then ask:

> 🟠 *"Approve this map?"*

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

Invoke the **Reset story map server** procedure (defined in On Start above) with `<mapPath>` set to `story-maps/<feature-slug>/story-map.md`. The procedure kills any prior server PID, waits for port 3847 to free, and launches a fresh server pointing at this feature's map. Replace the procedure's restart-message print with this fresh-launch message instead:

> 🟤 *"Story map board is live at http://localhost:3847 — open it in your browser."*

### Step 3 — Proceed to Phase 4

Print:

```
Story map is ready. Phase 4 (implementation) works best in a fresh session — the
planning conversation has done its job and a clean context window keeps implementation
sharp. Start a new Claude Code session and run /feature to resume; it will detect the
story map and jump straight to Phase 4.
```

---

## Phase 4 — Implement, sticky by sticky

### One-time auto-commit toggle at Phase 4 start

Before classification, ask once:

> 🟠 *"Auto-commit each sticky as it's completed? [Y/n] (default: yes)"*

Remember the answer for the rest of this `/feature` run. Default is `yes`.

**Autonomous mode (this skill invoked by a subagent or otherwise non-interactively):** skip the prompt and use the default (auto-commit `yes`).

This toggle governs the commit step in the `cosmetic` flow below. (Commits made by `/tdd` during the `ui-only`, `ui-and-server`, and `server-only` flows are owned by `/tdd` and are not affected by this toggle.)

### One-time classification at Phase 4 start

Before any sticky runs, classify all unchecked stickies. Ask once:

> 🟠 *"How should I classify each sticky's service and scope?
> (a) I propose, you review and approve in bulk.
> (b) You specify per sticky as we go."*

**Mode A — agent proposes, bulk review:**

Examine each unchecked sticky and the workspace (look for existing service folders). Produce a table:

| Sticky | Target service | Scope | Skills |
|---|---|---|---|
| Proceed to checkout | checkout | ui-only | /hexagonal + /tdd |
| Enter card details | payments | ui-and-server | /hexagonal + /tdd |
| Validate card number | payments | server-only | /hexagonal + /tdd |
| Show order summary | orders | cosmetic | direct edit |

Scope values:
- `cosmetic` — pure visual/text change, no logic.
- `ui-only` — frontend hook → repository → data only.
- `ui-and-server` — frontend AND backend layers.
- `server-only` — backend controller → use-case → repository → data only.

Skills values (derived from Scope — no user input needed):
- `cosmetic` → `direct edit`
- `ui-only` → `/hexagonal + /tdd`
- `ui-and-server` → `/hexagonal + /tdd`
- `server-only` → `/hexagonal + /tdd`

Ask:

> 🟠 *"Edit any row, then say 'approve'."*

Apply all edits at once.

**Mode B — user specifies per sticky:**

Before each sticky, ask:

> 🟠 *"Sticky '<text>' — target service? scope? (skills will be shown based on scope)"*

**Switching modes:** user can say "switch to mode B" or "switch to mode A" at any time.

---

### Sticky selection loop

Each iteration:

1. Read `story-map.md` top to bottom. Find the first unchecked `- [ ]` sticky (skip deferred `~~...~~`).
2. Ask:

   > 🟠 *"Suggested next: '<text>' — confirm, or name a different sticky."*

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
3. If the auto-commit toggle is `yes`, commit using the canonical multi-line format below. If `no`, skip this step — leave staging and committing to the user.

   **Canonical commit message format:**

   - **Subject:** `<type>: <feature-slug>/<sticky-slug>: <sticky text>`
     - Pick the type that matches the change: `feat` (new behavior), `fix` (bug), `docs` (docs-only), `refactor`, `chore`, `test`, etc. Default is `feat` for /feature work.
     - Keep the subject ≤ 72 characters. Trim the sticky text if needed.
   - **Blank line.**
   - **Body:** a short paragraph (3–6 lines, wrapped at ~72 characters) explaining WHAT changed and WHY/CONTEXT — not a restatement of the subject. Mention any non-obvious decisions or follow-ups.
   - **No `Co-Authored-By` trailer.** No `Generated with Claude Code` trailer. No emoji.

   Use a HEREDOC so the body keeps its line breaks:

   ```bash
   git commit -m "$(cat <<'EOF'
   <type>: <feature-slug>/<sticky-slug>: <sticky text>

   <Body paragraph: what the sticky changed and why. Keep it tight —
   the reader should be able to understand the change without opening
   the diff. Reference related stickies or files only when it adds
   context the subject line cannot carry.>
   EOF
   )"
   ```

4. Check off the sticky in `story-map.md` (change `- [ ]` to `- [x]`).
5. Loop.

#### `ui-only`

1. Invoke `/hexagonal <targetService>` (brownfield mode) to enforce frontend hex layers: hook → repository → data.
2. Write `.tdd-context.json` at the project root:

```json
{
  "feature": "<feature-slug>",
  "sticky": "<sticky text>",
  "storyMapPath": "story-maps/<feature-slug>/story-map.md",
  "autoCommit": <value from Phase-4-start toggle — true or false>
}
```

`autoCommit` carries the Phase-4-start toggle's value into `/tdd`. If the toggle is `no`, set this to `false` and `/tdd` will suppress every commit during this sticky's TDD session (the canonical commit message is still recorded in the implementation log, marked `(suppressed)`).

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
  "storyMapPath": "story-maps/<feature-slug>/story-map.md",
  "autoCommit": <value from Phase-4-start toggle — true or false>
}
```

`autoCommit` carries the Phase-4-start toggle's value into `/tdd`. If the toggle is `no`, set this to `false` and `/tdd` will suppress every commit during this sticky's TDD session (the canonical commit message is still recorded in the implementation log, marked `(suppressed)`).

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

Ask:

> 🟠 *"Ready to close out this feature?"*

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

Print:

> 🟤 *"Feature '<name>' closed out. story-map.md marked complete."*

**No:** Leave the map as-is. Server keeps running. Resume anytime with `/feature`.

---
