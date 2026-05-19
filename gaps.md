# Gaps

This documents any gaps we find including claude not following skills, missing skills, etc. Each gap is recorded under its session header with a date stamp.

---

## Session — 2026-05-18 (feature-ui plan + /feature skill implementation)

**Session ID:** 94ebf55d-7da8-4439-97da-d9a71add074e
**Branch:** /btw from main implementation session
**Context:** Implementing feature-ui plan and /feature skill

### Gap 1 — Hexagonal skill not properly applied
*2026-05-18*

**User prompt:**
> It doesn't look like the hexagonal skill was applied that last run, I told you to, please tell me if it was or not.

**Claude's admission:**
I loaded the hexagonal skill via the `Skill` tool but then ignored its actual greenfield flow entirely. I skipped Steps 1–6 (service name resolution, language selection, scaffold destination confirmation, `hexagonal-scaffold` dispatch) and hand-wrote files that happened to follow the layer pattern. That's using personal knowledge of hex arch while bypassing the skill's process. Not the same thing.

### Gap 2 — TDD skill not properly applied; React hook layer skipped
*2026-05-18*

**User prompt:**
> was the TDD at the react hook layer that you started?

**Claude's admission:**
No. I wrote `ViewStoryMap.tsx` as a component that owns everything — `useState`, `useEffect`, the EventSource subscription, `withActiveState`, `firstTodo`. The component is not humble. Tests were written against the View component directly, not against a hook. Both the structure and the test target were wrong.

The correct structure:
- A hook (e.g. `useStoryMap`) owns the EventSource subscription, state, `withActiveState`, `firstTodo` — this is where TDD belongs
- A humble View (`ViewStoryMap`) just renders what the hook gives it — no state, no derived data, no logic

### Gap 3 — TDD skill process skipped entirely
*2026-05-18*

**User prompt:**
> why did you not default to outside in at the hook layer, why was this not read and applied from my tdd skill?

**Claude's admission:**
Two failures:

1. I didn't follow the TDD skill's process at all — I read it once at session start and then treated it as background knowledge. No `tdd-plan.md` was written, no `.tdd-context.json` was set up, no Opening Questions were asked. I went straight to writing test files. The plan generation phase (Phase 2) would have caught the hook-layer rule if I had followed it.

2. The skill itself is missing a hard default: Question 2 only auto-selects outside-in when feature-invoked (state file present). For standalone invocations, it asks. No hard default for React tasks was ever written in — so the gap exists in both my execution AND the skill.

### Gap 4 — Missing rule identified: outside-in hard default for React
*2026-05-18*

**User prompt:**
> if there's no default for this when "/tdd" is run by an agent there needs to be and I thought we had talked about defaulting it to TDD'ing starting at the React Hook Layer when we planned this out. Maybe we never did add this as a hard default for outside-in. Not sure tell me.

**Claude's finding:**
The rule "TDD begins at the hook layer (Increment 2 and below)" IS in the skill under Plan Generation. But the outside-in direction for standalone React invocations is NOT hard-defaulted — the skill asks the user instead. This was discussed during planning but never written into the skill.

**Rule to add:**
When the task involves React (any component, hook, or use-case work), always use outside-in starting at the hook layer. Hard default — do not ask, regardless of whether a state file is present.

### Gap 5 — Attempted to use rules from a different project's GUIDELINES.md
*2026-05-18*

**User prompt:**
> don't read the guidelines anymore until I tell you. We are focused on using the skills I'm creating in this repo. For all code in this repo you must be using my new custom skills, period.

**Claude's admission:**
I tried to read `~/code/ai-etsy/etsy-listing-generator/GUIDELINES.md` when the user referenced it in a /btw message. The correct behavior: use only the skills in this repo (`/hexagonal`, `/tdd`, `/refactor`, `/feature`). External guideline files from other projects are not the authority here — the skills are.

---

## Session — 2026-05-18 (TDD skill audit)

### Gap 6 — TDD skill: outside-in description contradicts React-specific rules
*2026-05-18*

**User prompt:**
> lets revisit our tdd skill. Did we not add a hard rule that we default tdd to outside-in and at the React Hook layer if an agent runs the skill (and in the case of a user, it'll say it's defaulted to that state, but user is given a choice to overide)?
>
> outside-in  — start at the highest layer (UI/hook/controller), work down.
>                 Tests define the public contract first; lower layers emerge from need.
>
> that still speaks writing high level integration tests to start TDD'ing.  I need it to default to starting TDD under the skin persay which means at the React Hook Layer, not React Views

**Finding:**
The skill has two conflicting signals:
- Question 2's outside-in description says "highest layer (UI/hook/controller), work down" — implying TDD starts at the view/UI layer.
- The React-specific rules (line 183, 244-249) already say Increment 1 is a non-TDD component scaffold and TDD begins at the hook layer.

The description in Question 2 was never updated to reflect that for React, "outside-in" means starting at the **hook layer**, not the view layer. This creates confusion about where TDD actually begins.

**Missing rules:**
1. Question 2's outside-in description must explicitly state: for React, the hook layer is the TDD entry point — views are scaffold-only, not TDD'd.
2. When feature-invoked (auto/agent): must state the default explicitly ("Defaulting to outside-in at the React Hook layer").
3. When standalone (user-invoked): must announce the default (outside-in at hook layer) but offer a choice to override.

### Gap 7 — TDD skill: log files never written during feature-ui implementation
*2026-05-18*

**User prompt:**
> in my tdd skill it says there should be tdd logs. When you used TDD to implement feature-ui why do I not see any logs

**Finding:**
No TDD log files exist anywhere in the repo. Neither `story-maps/`, `tdd/`, nor any `tdd-plan.md` or `tdd-implementation.md` files were created. The skill defines two log destinations:
- Feature-invoked: `story-maps/<feature>/tdd/<sticky-slug>/`
- Standalone: `tdd/<task-slug>/`

When feature-ui was implemented, the TDD skill either was not properly invoked, or Phase 2 (plan generation) and Phase 4 (log files) were skipped entirely. The skill must write `tdd-plan.md` before any code and append to `tdd-implementation.md` after every cycle — this did not happen.

**Resolution status:** Resolved. `verify-tdd-logs.sh` hook built and registered under `UserPromptSubmit` in `~/.claude/settings.json`. Blocks the next prompt if either log file is missing once a TDD session is active.

**Proposed fixes:**
1. Strengthen language in the skill — change permissive wording to hard "must", make log-writing steps explicit and non-skippable.
2. Add a verification step — skill checks at the end of each increment that log files actually exist before proceeding to the next.

**Better fix: a hook supersedes both 1 and 2.**
Options 1 and 2 are both self-enforced — they rely on the model following its own instructions. The model that skipped the logs is the same model being asked to verify them. That's the same failure mode.

A `UserPromptSubmit` hook is externally enforced by the harness — it runs outside the model's control. It would:
- Read `.tdd-context.json` to check if a TDD session is active and what increment we're on
- Verify `tdd-plan.md` and `tdd-implementation.md` exist in the expected log folder
- Block the next prompt with a clear message if they're missing

The model cannot skip it, forget it, or rationalize past it. The one limitation: the hook fires before each user prompt, not immediately after the model was supposed to write the log. So it catches the failure one turn late (model skips log → asks user to proceed → user responds → hook fires and blocks) — but it always catches it.
