# Session Gaps — 2026-05-18

## Gap 1 — TDD skill: outside-in description contradicts React-specific rules

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

## Gap 2 — TDD skill: log files never written during feature-ui implementation

**User prompt:**
> in my tdd skill it says there should be tdd logs. When you used TDD to implement feature-ui why do I not see any logs

**Finding:**
No TDD log files exist anywhere in the repo. Neither `story-maps/`, `tdd/`, nor any `tdd-plan.md` or `tdd-implementation.md` files were created. The skill defines two log destinations:
- Feature-invoked: `story-maps/<feature>/tdd/<sticky-slug>/`
- Standalone: `tdd/<task-slug>/`

When feature-ui was implemented, the TDD skill either was not properly invoked, or Phase 2 (plan generation) and Phase 4 (log files) were skipped entirely. The skill must write `tdd-plan.md` before any code and append to `tdd-implementation.md` after every cycle — this did not happen.

**Resolution status:** Unresolved. This is a compliance failure — the skill already has the rules, they were just not followed. No fix was applied this session.

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
