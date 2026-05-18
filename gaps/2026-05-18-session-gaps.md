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
