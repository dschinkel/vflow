---
description: Use when implementing any feature that involves service-layer code — use cases, repositories, data adapters, or controllers. Also use when the user runs /hexagonal to scaffold a new service.
allowed-tools: "Read Edit Write Bash Glob"
---

# <span style="color:#76a039">Hexagonal Architecture Skill</span>

Governs how all service-layer code is structured. Two roles:

1. **Auto-invoked rules enforcement** — when an agent is writing or modifying anything inside `controllers/`, `use-cases/`, `repositories/`, or `data/`, this skill's rules apply automatically. No user invocation needed.
2. **User-invoked greenfield scaffold** — when the user runs `/hexagonal <service-name>`, this skill walks them through language selection and optional reference-codebase analysis, then dispatches the `hexagonal-scaffold` operation to produce the folder layout and master `README.md`.

> **Recommended model:** `claude-opus-4-7` for greenfield scaffolds with reference-codebase analysis (judgment-heavy). `claude-sonnet-4-6` is fine for auto-invocation during feature work (mechanical rule enforcement).

---

## <span style="color:#76a039">Invocation</span>

```
/hexagonal payments                  # greenfield scaffold, base rules only
/hexagonal payments @src/service     # greenfield scaffold, base rules + style from reference codebase
/hexagonal                           # skill asks for the service name
(agent auto-invokes)                 # when writing/modifying service-layer code — no user action required
```

---

## <span style="color:#76a039">Layer Rules (always enforced)</span>

| Layer        | Folder | Responsibility |
|--------------|--------|----------------|
| Controllers | `controllers/` | Driving adapters. Translate external input (HTTP, CLI, events) into plain objects. Pass to use cases. **No business logic.** |
| Use Cases | `use-cases/` | Application logic. Orchestrates repositories and data adapters. **No I/O of its own.** One use case per business operation. |
| Repositories | `repositories/` | Ports for persistence/external data. Accept a data adapter as a dependency. **Know nothing about HTTP or frameworks.** |
| Data | `data/` | Driven adapters. Wrap external APIs, DBs, AI SDKs. **Only place where external service details live.** |
| Domain | `domain/` | **Not scaffolded by default.** Only introduced when logic is genuinely duplicated across 2+ modules and can be grouped under a well-named entity with like responsibilities. |

### <span style="color:#76a039">What repositories must NOT do</span>

- No retry logic
- No model fallback strategy
- No orchestration across multiple data calls
- No business decisions

These belong in the use case.

---

## <span style="color:#76a039">Enforced Style Rules (language-agnostic)</span>

- **Business logic stays in use cases.** Logic specific to one use case lives inside that use case. It is not extracted to the domain layer unless genuinely shared by 2+ modules.
- **Repositories are thin.** They translate between the use case's world and the data adapter's world. No business logic leaks in.
- **Test names in prose.** Written in domain language and layman's terms. No function names, no implementation references. Example: *"generates a lifestyle image at the requested temperature"* — not *"passes temperature to generationConfig"*.
- **One use case per file, one responsibility per use case.**

### <span style="color:#76a039">Node.js style rules</span>

- **JS Module Pattern** — closures returning plain objects with named methods.
- **No `create` prefix** on factory functions.
- **No generic `execute()` method** — expose named methods directly on the returned object.
- **camelCase** file names and identifiers.
- **TypeScript types on all public-facing function signatures.**

### <span style="color:#76a039">Python style rules</span>

- **Idiomatic functional Python** — module-level functions, no unnecessary classes.
- Dependencies injected as function parameters.
- The Python module (file) is the encapsulation unit — callers import the module and call its functions.
- **snake_case** file names and identifiers.
- **Type hints on all public-facing function signatures.**

---

## <span style="color:#76a039">Greenfield Flow (user-invoked)</span>

When the user runs `/hexagonal <service-name>` or `/hexagonal <service-name> @<reference-path>`:

### <span style="color:#76a039">Step 1 — Resolve service name</span>

If the argument is missing, ask:

> 🟠 *"What's the service name?"*

Use the answer.

### <span style="color:#76a039">Step 2 — Ask for language</span>

Always ask, never auto-detect:

> 🟠 *"Which language?
> 1. Node.js (TypeScript) — JS Module Pattern
> 2. Python — idiomatic functional
> (1 / 2)"*

Record the choice. Both `hexagonal.md` and `hexagonal-scaffold.md` honor it.

### <span style="color:#76a039">Step 3 — Resolve scaffold destination</span>

Probe the project root:
- If a `src/` directory exists → propose `src/<service-name>/`.
- Otherwise → propose `<service-name>/` at the project root.

Ask:

> 🟠 *"Create the service at `<proposed-path>`? (yes / specify a different path)"*

Use whatever the user confirms.

### <span style="color:#76a039">Step 4 — Optional reference-codebase analysis</span>

If the invocation included a `@<reference-path>` argument:

1. Read the reference codebase (use `Glob` for the folder tree, then `Read` on representative files — enough to identify conventions, not exhaustive).
2. Extract:
   - Naming patterns (file names, function names, exported identifiers)
   - Layer organization (folder structure, file grouping)
   - Dependency flow (what gets injected, how)
   - Error handling conventions
   - Testing patterns (file naming, describe/it structure, assertion style)
   - Any conventions not already covered by the base rules
3. **Conflicts:** if the reference codebase violates a base rule (e.g. repositories doing business logic, factory functions with `create` prefix, generic `execute()`), note the conflict and **do not carry the violation forward**. The base architectural rules always win. Naming, file structure, and testing conventions are where the reference codebase has influence.

If no `@<reference-path>` was provided, skip this step entirely.

### <span style="color:#76a039">Step 5 — Confirmation gate (greenfield with reference only)</span>

If reference analysis ran:

1. Print a brief summary of what was found.
2. Show the proposed structure: folder layout, file names, style being applied, any conflicts and how they're being resolved.
3. Ask:

   > 🟠 *"Does this structure look right? If not, I can fall back to the default Hexagonal structure instead."*

4. **yes** → proceed to Step 6 with the blended structure.
5. **no** → present the default structure (base rules only) and ask once:

   > 🟠 *"Use the default structure? (yes / cancel)"*

   If yes → proceed. If cancel → exit, nothing created.

When no `@<reference-path>` was provided, skip the gate — base rules are already known.

### <span style="color:#76a039">Step 6 — Dispatch the scaffold</span>

Invoke `hexagonal-scaffold` with the resolved context:

- `serviceName` (string)
- `language` (`node` or `python`)
- `destination` (filesystem path)
- `styleNotes` (string — extracted conventions to bake into the README, or empty when no reference was analyzed)

The scaffold skill produces the folder structure and the master `README.md`. This skill (`hexagonal.md`) does not write any files directly during the greenfield flow.

### <span style="color:#76a039">Step 7 — Done</span>

Print:
```
Scaffold complete at <destination>/.
- Layers: controllers/ use-cases/ repositories/ data/
- Pattern documented in <destination>/README.md
- Domain folder intentionally omitted (add only when 2+ modules need shared logic).
```

---

## <span style="color:#76a039">Auto-Invocation Flow (agent feature-slice work)</span>

When an agent is writing or modifying any file inside an existing service directory, this skill governs the work automatically.

### <span style="color:#76a039">Detection</span>

The skill considers itself auto-invoked when *any* of the following holds:

- The file being created/edited is inside a `controllers/`, `use-cases/`, `repositories/`, or `data/` folder.
- The user is describing a new use case, repository, data adapter, or controller in plain language.

### <span style="color:#76a039">Behavior</span>

- Apply all layer rules and style constraints automatically.
- **Language is inferred from existing files** in the surrounding service. No prompt.
- If the agent is editing files inside an existing service directory, **treat that directory as the style reference automatically** — no user prompt, no confirmation gate. Read enough sibling files to mirror their conventions.
- **No confirmation gate during auto-invocation** — the agent already knows the rules and applies them directly.

### <span style="color:#76a039">What the agent must NOT do during auto-invocation</span>

- Create a `domain/` folder speculatively.
- Add retry logic or orchestration inside a repository.
- Use a `create` prefix on module functions (Node.js).
- Add an `execute()` wrapper to use cases (Node.js).
- Convert idiomatic functional Python into class-based code.
- Write test names with function names or implementation references.

---

## <span style="color:#76a039">Composition with Other Skills</span>

- `/hexagonal-scaffold` — internal operation, invoked by this skill during the greenfield flow (Step 6). Not user-facing.
- `/feature` (future) — auto-invokes this skill when generating service-layer code per sticky.
- `/tdd` (existing) — composes naturally: when TDD generates a new use case or repository, this skill's rules apply.
- `/refactor` (existing) — when invoked on service-layer files, must respect the layer's naming rules (no `create` prefix on use cases, prose test names, etc.).

---

## <span style="color:#76a039">Future Operations (not yet implemented)</span>

- `hexagonal-review.md` — brownfield analysis. Reports what code is in the wrong layer.
- `hexagonal-refactor.md` — brownfield. Moves misplaced code to the correct layer.

These will be added in future iterations and dispatched from this skill the same way `hexagonal-scaffold` is.

---

## <span style="color:#76a039">Error Handling</span>

- **Service-name missing and user supplies none** → halt with: *"I need a service name to proceed. Try `/hexagonal <service-name>`."*
- **Reference path (`@<path>`) does not exist** → halt with: *"The reference path `<path>` was not found. Provide an existing folder, or omit the `@<path>` argument to use base rules only."*
- **Destination directory already exists and is non-empty** → halt with: *"Destination `<path>` already exists and contains files. Pick a different name or remove the existing directory first."*
- **Filesystem write fails** → halt and surface the underlying error. Do not leave a partial scaffold behind.
