# <span style="color:#76a039">Hexagonal Architecture Skill — Design Spec</span>

> **Plan:** [/hexagonal Skill Pair Implementation Plan](../../../../plans/done/skills/hexagonal/2026-05-17-hexagonal-architecture-skill.md)
>
> **Sibling spec (in progress):** [Hexagonal Skill — Invocation Modes](../../../../../todo/2026-05-17-hexagonal-invocation-modes.md) — active brainstorm refining how `/hexagonal` is invoked for brownfield vs greenfield. Decisions there will fold back into this spec when finalized.

---

## <span style="color:#76a039">Overview</span>

A pair of Claude Code skills that govern how service-layer code is structured, both when agents are automatically building feature slices and when a user explicitly scaffolds a new service. The skills enforce a consistent Hexagonal Architecture style with opinionated rules baked in, with optional style enrichment from an existing reference codebase.

---

## <span style="color:#76a039">Skill Structure</span>

Two skill files:

### <span style="color:#76a039">`hexagonal.md` (core)</span>

The primary skill. Contains all architectural rules, layer responsibilities, style constraints, and the optional codebase-style-extraction flow. Agents pick this up automatically when writing or modifying any service-layer code (use cases, repositories, data adapters, controllers).

**Trigger description:**
> Use when implementing any feature that involves service-layer code — use cases, repositories, data adapters, or controllers. Also use when the user runs /hexagonal.

### <span style="color:#76a039">`hexagonal-scaffold.md` (operation)</span>

Invoked by the core skill (or directly) when the user explicitly wants to create a new service directory structure. Produces a folder layout and a master README documenting the pattern in pseudocode.

**Future operations (not yet implemented — called out in the skill):**
- `hexagonal-review.md` — brownfield analysis, report of what is in the wrong layer
- `hexagonal-refactor.md` — brownfield, moves misplaced code to the correct layer

---

## <span style="color:#76a039">Invocation Forms</span>

```
/hexagonal payments                  # greenfield scaffold, base rules only
/hexagonal payments @src/service     # greenfield scaffold, base rules + style from reference codebase
(agent auto-invokes)                 # when building a feature slice — no user action required
(agent auto-invokes with context)    # same, uses existing service path as style reference if obvious from context
```

---

## <span style="color:#76a039">Layer Rules (always enforced)</span>

| Layer | Folder | Responsibility |
|---|---|---|
| Controllers | `controllers/` | Driving adapters. Translate external input (HTTP, CLI, events) into plain objects. Pass to use cases. No business logic. |
| Use Cases | `use-cases/` | Application logic. Orchestrates repositories and data adapters. No I/O of its own. One use case per business operation. |
| Repositories | `repositories/` | Ports for persistence/external data. Accept a data adapter as a dependency. Know nothing about HTTP or frameworks. |
| Data | `data/` | Driven adapters. Wrap external APIs, DBs, AI SDKs. Only place where external service details live. |
| Domain | `domain/` | **Not scaffolded by default.** Only introduced when logic is genuinely duplicated across 2+ modules and can be grouped under a well-named entity with like responsibilities. |

### <span style="color:#76a039">What repositories must NOT do</span>

- No retry logic
- No model fallback strategy
- No orchestration across multiple data calls
- No business decisions

These belong in the use case.

---

## <span style="color:#76a039">Language Selection</span>

The skill always asks which language to use before doing anything else. Supported languages:

- **Node.js** (TypeScript)
- **Python**

No auto-detection. The user is always prompted.

---

## <span style="color:#76a039">Enforced Style Rules</span>

These apply to all code written under this skill, regardless of language or reference codebase:

- **Business logic stays in use cases** — logic specific to one use case lives inside that use case. It is not extracted to the domain layer unless genuinely shared by 2+ modules.
- **Repositories are thin** — they translate between the use case's world and the data adapter's world. No business logic leaks in.
- **Test names in prose** — written in domain language and layman's terms. No function names, no implementation references in test descriptions (e.g., "generates a lifestyle image at the requested temperature" not "passes temperature to generationConfig").
- **One use case per file, one responsibility per use case.**

### <span style="color:#76a039">Node.js style rules</span>

- **JS Module Pattern** — closures returning plain objects with named methods
- No `create` prefix on factory functions
- No generic `execute()` method — expose named methods directly on the returned object
- camelCase file names and identifiers
- TypeScript types on all public-facing function signatures

### <span style="color:#76a039">Python style rules</span>

- **Idiomatic functional Python** — module-level functions, no unnecessary classes
- Dependencies injected as function parameters
- The Python module (file) is the encapsulation unit — callers import the module and call its functions
- snake_case file names and identifiers
- Type hints on all public-facing function signatures

---

## <span style="color:#76a039">Optional Codebase Style Extraction</span>

When a `@path` reference is provided, the core skill reads the existing codebase before doing anything else.

### <span style="color:#76a039">What it analyzes</span>

- Naming patterns (file names, function names, exported identifiers)
- Layer organization (folder structure, file grouping)
- Dependency flow (what gets injected, how)
- Error handling conventions
- Testing patterns (file naming, describe/it structure, assertion style)
- Any conventions not already covered by the base rules

### <span style="color:#76a039">How extracted style is applied</span>

Extracted conventions are **additions** to the base rules, not overrides. The base architectural rules always win. If the reference codebase has repositories doing business logic, the skill notes it as a conflict but does not carry that pattern forward. Naming, file structure, and testing conventions are where the reference codebase has influence.

### <span style="color:#76a039">Confirmation gate (greenfield only)</span>

After analysis, before creating anything, the skill:

1. Prints a brief summary of what was found
2. Shows the proposed structure it will create (folder layout, file names, style applied)
3. Asks: *"Does this structure look right? If not, I can fall back to the default Hexagonal structure instead."*
4. If approved → proceeds with the blended structure
5. If rejected → presents the default structure (base rules only) and confirms once before proceeding

When no `@path` is provided, the confirmation gate is skipped — the rules are already known.

---

## <span style="color:#76a039">Agent Auto-Invocation (Feature Slices)</span>

When an agent is building a feature slice, the skill governs how any new service-layer code is structured without the user having to invoke it.

### <span style="color:#76a039">Behavior</span>

- Agent follows all layer rules and style constraints automatically
- If the agent is editing files inside an existing service directory, it treats that directory as the style reference automatically — no user prompt needed
- No confirmation gate during auto-invocation — the agent already knows the rules and applies them directly

### <span style="color:#76a039">What the agent must NOT do</span>

- Create a `domain/` folder speculatively
- Add retry logic or orchestration inside a repository
- Use a `create` prefix on module functions
- Add an `execute()` wrapper to use cases
- Write test names with function names or implementation references

---

## <span style="color:#76a039">Greenfield Scaffold (`hexagonal-scaffold.md`)</span>

Invoked when the user runs `/hexagonal <service-name>`.

### <span style="color:#76a039">What it produces</span>

- `<service-name>/` directory with: `controllers/`, `use-cases/`, `repositories/`, `data/`
- One master `README.md` in the service root documenting the full pattern:
  - What each layer does and what it must not do
  - Dependency flow between layers
  - Pseudocode examples written in the selected language's idiomatic style:
    - **Node.js** — JS Module Pattern (closure, named methods on returned object, camelCase)
    - **Python** — module-level functions, dependencies as parameters, snake_case

### <span style="color:#76a039">What it does NOT produce</span>

- No `domain/` folder
- No real code files — README is the artifact; the user fills in the implementation
- No framework-specific boilerplate

---

## <span style="color:#76a039">What This Spec Does Not Cover</span>

- How `hexagonal-review.md` will analyze brownfield code (future)
- How `hexagonal-refactor.md` will move misplaced logic (future)
- How this skill composes with feature-slice skills that call it (future)
