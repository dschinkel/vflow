# <span style="color:#76a039">Hexagonal Skill — Invocation Modes (Brainstorm In Progress)</span>

> **Parent spec:** [Hexagonal Architecture Skill — Design Spec](../superpowers/specs/done/skills/hexagonal/2026-05-17-hexagonal-architecture-skill.md)
>
> **Status:** In progress. This spec captures an active brainstorm refining *how* `/hexagonal` gets invoked. Decisions reached here will fold back into the parent spec once finalized.

---

## <span style="color:#76a039">Why This Spec Exists</span>

The parent spec ([Hexagonal Architecture Skill — Design Spec](../superpowers/specs/done/skills/hexagonal/2026-05-17-hexagonal-architecture-skill.md)) describes `/hexagonal` primarily as a **greenfield scaffolder** invoked by the user (`/hexagonal payments`) or auto-triggered by the model on service-layer work via the skill's frontmatter description.

While brainstorming `/feature` (the [Feature Skill spec](../superpowers/specs/skills/feature/2026-05-17-feature-skill-design.md)), a gap surfaced: `/feature` needs to invoke `/hexagonal` for **every sticky** — both when scaffolding a new service (greenfield) and when extending an existing one (brownfield). The current parent spec's procedure only handles greenfield cleanly; brownfield invocation has no defined surface, and relying on auto-trigger via frontmatter description is too implicit for the visibility/determinism the user wants.

This spec captures the design conversation about how `/hexagonal`'s invocation should behave across both modes.

---

## <span style="color:#76a039">Background — Two Ways a Skill Can "Apply"</span>

To make the decisions below readable, it's worth being explicit about the mechanics.

### <span style="color:#76a039">Auto-trigger via frontmatter</span>

Every skill file has a `description` in its frontmatter. The model reads all loaded skill descriptions and decides *on its own* when each applies — no one types the slash command. `/hexagonal`'s current description ("use when implementing any feature that involves service-layer code…") is meant to make the rules apply silently whenever code is being written in `controllers/`, `use-cases/`, `repositories/`, or `data/`.

- **Pro:** Elegant. No ceremony.
- **Con:** Invisible. No "I am now applying hexagonal rules" announcement. Reliability depends on the model noticing the description under context pressure.

### <span style="color:#76a039">Explicit invocation</span>

The caller (either the user or another skill) emits `/hexagonal …` literally. The model stops, runs through `/hexagonal`'s full procedure (whatever that procedure includes for the mode), then resumes.

- **Pro:** Deterministic. Visible. Full procedure runs.
- **Con:** More ceremony. Has to be designed for both greenfield and brownfield modes (currently only greenfield is well-shaped).

---

## <span style="color:#76a039">Decisions Reached So Far</span>

### <span style="color:#76a039">Decision 1 — `/feature` always invokes `/hexagonal` explicitly</span>

`/feature` does not rely on auto-trigger. Every code-producing sticky in Phase 4 includes an explicit `/hexagonal` step as Step 1 of the per-sticky sequence, regardless of whether the work is greenfield or brownfield.

**Rationale:** Visibility and determinism. The user wants to *see* `/hexagonal` running on every sticky, not have its rules silently leak in via frontmatter description matching. This also forces `/hexagonal`'s procedure to acknowledge the work, run any applicable checks, and hand back control cleanly — instead of being a passive background influence.

### <span style="color:#76a039">Decision 2 — Greenfield and brownfield are distinct invocation modes</span>

`/hexagonal` needs to know which mode it's being invoked in, because its procedure differs. The mode is determined by whether a service folder already exists at the target path.

| Mode        | Trigger | What the skill does |
|-------------|---------|---------------------|
| Greenfield | Target service folder does not exist | Resolves language → resolves destination → optional reference-codebase analysis → optional confirmation gate → dispatches `hexagonal-scaffold` to create the layout + README |
| Brownfield | Target service folder exists with at least one of `controllers/`, `use-cases/`, `repositories/`, `data/` | (Procedure being designed — see Open Questions below) |

### <span style="color:#76a039">Decision 3 — `/feature` passes the target service explicitly</span>

`/feature` does not let `/hexagonal` guess which service the current sticky relates to. The invocation includes the service name/path explicitly. `/hexagonal` uses the path to decide greenfield vs brownfield (does this folder exist?).

---

## <span style="color:#76a039">Open Questions — Brownfield Mode</span>

These need to be answered before the brownfield path can be folded into the parent spec.

### <span style="color:#76a039">Q1 — What does brownfield mode output?</span>

Options:
1. **Just print the rules + acknowledge the target service.** "Applying hexagonal rules to `src/payments/`. Layer reminders: controllers don't contain business logic, repositories are thin, …" — then exit.
2. **Print rules + a one-paragraph audit of the existing service.** "Applying hexagonal rules to `src/payments/`. Existing layout looks consistent (4 use cases, 2 repositories, 1 data adapter). Style appears camelCase, JS Module Pattern. Proceeding."
3. **Print rules + read a few sibling files and surface inferred conventions to the caller.** Same as option 2 but actively passes the inferred style notes back to `/feature` (and onward to `/tdd`) so subsequent code generation matches.

Recommendation TBD. Option 3 is the most useful but the most work.

### <span style="color:#76a039">Q2 — Does brownfield mode prompt for language?</span>

The greenfield procedure always asks "Node.js or Python?" before doing anything else. In brownfield, the language is determinable from existing files (extensions, file naming style).

Options:
1. **Infer silently** from file extensions.
2. **Infer and confirm** ("Looks like Node.js — correct?").
3. **Always ask anyway,** for consistency with greenfield.

Recommendation TBD. Inferring silently is the cleanest UX; confirming is the safest.

### <span style="color:#76a039">Q3 — Does brownfield mode use the optional `@<reference-path>` argument?</span>

In greenfield, the user can pass `/hexagonal payments @src/other-service` to use another codebase as a style reference. In brownfield, **the current service folder is itself the reference** — every sibling file is already a style guide. The `@<reference-path>` argument may be redundant in brownfield, or it may allow overriding ("style this work like *that other* service, not this one's existing conventions").

Recommendation TBD.

### <span style="color:#76a039">Q4 — Does brownfield mode write any artifacts?</span>

Greenfield writes folders and a master README. Brownfield could:
1. **Write nothing.** Pure rule enforcement. No artifacts.
2. **Update the existing README** if one exists, appending a "Style Conventions (auto-extracted)" section.
3. **Write a session log** documenting what the skill inferred and applied, for traceability.

Recommendation TBD. Option 1 is cleanest; option 3 is most observable.

### <span style="color:#76a039">Q5 — How does `/hexagonal` hand inferred style notes back to the caller?</span>

If brownfield mode infers conventions from the existing service (e.g. "this service uses single-quoted strings, `async/await` always, never `.then()`"), how does that information reach `/tdd` so the GREEN phase honors it?

Options:
1. **State file** — `/hexagonal` writes `.hexagonal-context.json` immediately before exiting; `/tdd` reads it (similar to how `/feature` writes `.tdd-context.json`).
2. **Inline announcement** — `/hexagonal` prints style notes prominently and trusts the model to carry them forward in conversation memory.
3. **No handoff** — `/hexagonal` runs in isolation; whatever the model retains from reading sibling files during `/hexagonal`'s execution is what carries into `/tdd`.

Recommendation TBD. State file is most explicit; inline announcement is the lowest ceremony.

---

## <span style="color:#76a039">Implications for Other Specs (When Decisions Land)</span>

### <span style="color:#76a039">Parent hexagonal spec ([link](2026-05-17-hexagonal-architecture-skill.md))</span>

Once Q1–Q5 are resolved, the parent spec will need:
- A new section "Brownfield Flow" (parallel to "Greenfield Flow")
- An explicit "Mode Detection" subsection at the top of `/hexagonal`'s procedure that decides greenfield vs brownfield from the target folder state
- Removal of the implication that auto-trigger via frontmatter is the brownfield path

### <span style="color:#76a039">Feature spec ([link](../superpowers/specs/skills/feature/2026-05-17-feature-skill-design.md))</span>

The Phase 4 per-sticky sequence will be locked to:

1. **Invoke `/hexagonal <target-service-path>`** — every sticky. Skill internally branches greenfield vs brownfield based on whether the folder exists.
2. **Write `.tdd-context.json`** (feature + sticky + storyMapPath + any style-notes handoff from `/hexagonal` if Q5 resolves to state-file).
3. **Invoke `/tdd "<sticky text>"`** — RED/GREEN/REFACTOR, per-increment commits, sticky check-off, `.tdd-context.json` cleanup.
4. **Resume `/feature`** — regenerate `story-map.html`, surface next sticky.

### <span style="color:#76a039">TDD spec ([link](../superpowers/specs/done/skills/2026-05-17-tdd-skill-design.md))</span>

If Q5 resolves to "state file" handoff (`.hexagonal-context.json`), `/tdd` needs to know to read it during GREEN-phase code generation. This is a small addition to its existing context-file pattern.

---

## <span style="color:#76a039">What This Spec Does Not Cover</span>

- The greenfield procedure itself — that's stable in the parent spec.
- `/hexagonal-scaffold` operation — unaffected by these decisions (only runs on greenfield path).
- Future operations (`hexagonal-review`, `hexagonal-refactor`) — they will probably reuse the brownfield procedure designed here, but their full design is out of scope.
