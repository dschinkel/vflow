# /hexagonal Skill Pair Implementation Plan

> **Spec:** [Hexagonal Architecture Skill — Design Spec](../../specs/skills/hexagonal/2026-05-17-hexagonal-architecture-skill.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `/hexagonal` skill pair — a core rules-enforcement skill that governs all service-layer code (auto-invoked when agents write controllers / use cases / repositories / data, and user-invoked for greenfield scaffolds) and a scaffold operation skill that produces the folder structure plus an in-language pseudocode README.

**Architecture:** Two markdown command files, no runtime code. `commands/hexagonal.md` is the core skill — frontmatter triggers auto-invocation on service-layer work, body holds the layer rules, language selection, optional codebase style extraction, confirmation gate, and the dispatch into the scaffold skill. `commands/hexagonal-scaffold.md` is the operation — creates the directory layout and writes a master `README.md` containing the full pattern documentation and idiomatic pseudocode (Node.js JS Module Pattern or Python functional). Both files are mirrored to `.claude/commands/` per project convention.

**Tech Stack:** Markdown skill files, Claude Code commands. No new hooks, no new bash tests. No runtime code generated — the scaffold writes a README and empty layer folders only.

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `commands/hexagonal.md` | Create | Core skill — rules, language selection, style extraction, confirmation gate, scaffold dispatch |
| `.claude/commands/hexagonal.md` | Create | Local mirror |
| `commands/hexagonal-scaffold.md` | Create | Operation skill — creates `<service>/` with 4 layer folders and one master `README.md` |
| `.claude/commands/hexagonal-scaffold.md` | Create | Local mirror |
| `docs/superpowers/specs/skills/2026-05-17-hexagonal-architecture-skill.md` | Modify | Replace plan-link placeholder |

No new hooks. No bash tests. Spec doesn't require any.

---

## Implementation Decisions Locked Down

These are details the spec leaves open that the plan must commit to before writing the skills:

1. **User-facing invocation.** Always goes through `/hexagonal`. The scaffold skill is invoked internally by the core skill, not by the user directly. Frontmatter on `hexagonal-scaffold.md` reflects this (description says "invoked by /hexagonal").
2. **Scaffold destination.** Default is `./<service-name>/` (current working directory). If a `src/` folder exists at the project root, prefer `./src/<service-name>/`. The skill asks the user to confirm the destination before creating anything (folded into the existing confirmation gate when applicable, or asked separately when the gate is skipped).
3. **Missing service-name argument.** If the user runs `/hexagonal` with no args, the skill asks: *"What's the service name?"* and proceeds once supplied.
4. **Auto-invocation context.** The core skill detects auto-invocation when the agent is editing a file already inside an existing `controllers/`, `use-cases/`, `repositories/`, or `data/` folder. In that case it skips the confirmation gate and the language prompt (the language is whatever the existing files use).
5. **Language selection memory.** The core skill always asks language for user-invoked scaffolds — no auto-detect. For auto-invocation inside an existing service, language is inferred from existing files.
6. **README sections.** The master `README.md` has a fixed structure: Overview, Layers (one section per layer with "what it does" + "what it must not do"), Dependency Flow, Pseudocode Examples (in the selected language). Locked in Task 3 below.

---

## Task 1: Cross-link spec → plan

**Files:**
- Modify: `docs/superpowers/specs/skills/2026-05-17-hexagonal-architecture-skill.md:3`

- [ ] **Step 1: Replace the plan-link placeholder**

The spec currently reads:

```markdown
# Hexagonal Architecture Skill — Design Spec

> **Plan:** _link to be added when implementation plan is written_
```

Change line 3 to:

```markdown
> **Plan:** [/hexagonal Skill Pair Implementation Plan](../../plans/2026-05-17-hexagonal-architecture-skill.md)
```

Note the `../../` — the spec lives at `docs/superpowers/specs/skills/`, two levels below `docs/superpowers/`, so the path to `plans/` climbs two directories.

- [ ] **Step 2: Verify the link resolves**

Run:
```bash
ls docs/superpowers/plans/2026-05-17-hexagonal-architecture-skill.md
```
Expected: file exists (this plan).

- [ ] **Step 3: Do not commit yet** — bundled with Task 5.

---

## Task 2: Create `commands/hexagonal.md` (core skill)

**Files:**
- Create: `commands/hexagonal.md`

- [ ] **Step 1: Write the file in one shot**

Write `commands/hexagonal.md` with exactly this content:

````markdown
---
description: Use when implementing any feature that involves service-layer code — use cases, repositories, data adapters, or controllers. Also use when the user runs /hexagonal to scaffold a new service.
allowed-tools: "Read Edit Write Bash Glob"
---

# Hexagonal Architecture Skill

Governs how all service-layer code is structured. Two roles:

1. **Auto-invoked rules enforcement** — when an agent is writing or modifying anything inside `controllers/`, `use-cases/`, `repositories/`, or `data/`, this skill's rules apply automatically. No user invocation needed.
2. **User-invoked greenfield scaffold** — when the user runs `/hexagonal <service-name>`, this skill walks them through language selection and optional reference-codebase analysis, then dispatches the `hexagonal-scaffold` operation to produce the folder layout and master `README.md`.

> **Recommended model:** `claude-opus-4-7` for greenfield scaffolds with reference-codebase analysis (judgment-heavy). `claude-sonnet-4-6` is fine for auto-invocation during feature work (mechanical rule enforcement).

---

## Invocation

```
/hexagonal payments                  # greenfield scaffold, base rules only
/hexagonal payments @src/service     # greenfield scaffold, base rules + style from reference codebase
/hexagonal                           # skill asks for the service name
(agent auto-invokes)                 # when writing/modifying service-layer code — no user action required
```

---

## Layer Rules (always enforced)

| Layer | Folder | Responsibility |
|---|---|---|
| Controllers | `controllers/` | Driving adapters. Translate external input (HTTP, CLI, events) into plain objects. Pass to use cases. **No business logic.** |
| Use Cases | `use-cases/` | Application logic. Orchestrates repositories and data adapters. **No I/O of its own.** One use case per business operation. |
| Repositories | `repositories/` | Ports for persistence/external data. Accept a data adapter as a dependency. **Know nothing about HTTP or frameworks.** |
| Data | `data/` | Driven adapters. Wrap external APIs, DBs, AI SDKs. **Only place where external service details live.** |
| Domain | `domain/` | **Not scaffolded by default.** Only introduced when logic is genuinely duplicated across 2+ modules and can be grouped under a well-named entity with like responsibilities. |

### What repositories must NOT do

- No retry logic
- No model fallback strategy
- No orchestration across multiple data calls
- No business decisions

These belong in the use case.

---

## Enforced Style Rules (language-agnostic)

- **Business logic stays in use cases.** Logic specific to one use case lives inside that use case. It is not extracted to the domain layer unless genuinely shared by 2+ modules.
- **Repositories are thin.** They translate between the use case's world and the data adapter's world. No business logic leaks in.
- **Test names in prose.** Written in domain language and layman's terms. No function names, no implementation references. Example: *"generates a lifestyle image at the requested temperature"* — not *"passes temperature to generationConfig"*.
- **One use case per file, one responsibility per use case.**

### Node.js style rules

- **JS Module Pattern** — closures returning plain objects with named methods.
- **No `create` prefix** on factory functions.
- **No generic `execute()` method** — expose named methods directly on the returned object.
- **camelCase** file names and identifiers.
- **TypeScript types on all public-facing function signatures.**

### Python style rules

- **Idiomatic functional Python** — module-level functions, no unnecessary classes.
- Dependencies injected as function parameters.
- The Python module (file) is the encapsulation unit — callers import the module and call its functions.
- **snake_case** file names and identifiers.
- **Type hints on all public-facing function signatures.**

---

## Greenfield Flow (user-invoked)

When the user runs `/hexagonal <service-name>` or `/hexagonal <service-name> @<reference-path>`:

### Step 1 — Resolve service name

If the argument is missing, ask: *"What's the service name?"* Use the answer.

### Step 2 — Ask for language

Always ask, never auto-detect:

```
Which language?
  1. Node.js (TypeScript) — JS Module Pattern
  2. Python — idiomatic functional

(1 / 2)
```

Record the choice. Both `hexagonal.md` and `hexagonal-scaffold.md` honor it.

### Step 3 — Resolve scaffold destination

Probe the project root:
- If a `src/` directory exists → propose `src/<service-name>/`.
- Otherwise → propose `<service-name>/` at the project root.

Ask: *"Create the service at `<proposed-path>`? (yes / specify a different path)"*. Use whatever the user confirms.

### Step 4 — Optional reference-codebase analysis

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

### Step 5 — Confirmation gate (greenfield with reference only)

If reference analysis ran:

1. Print a brief summary of what was found.
2. Show the proposed structure: folder layout, file names, style being applied, any conflicts and how they're being resolved.
3. Ask: *"Does this structure look right? If not, I can fall back to the default Hexagonal structure instead."*
4. **yes** → proceed to Step 6 with the blended structure.
5. **no** → present the default structure (base rules only) and ask once: *"Use the default structure? (yes / cancel)"*. If yes → proceed. If cancel → exit, nothing created.

When no `@<reference-path>` was provided, skip the gate — base rules are already known.

### Step 6 — Dispatch the scaffold

Invoke `hexagonal-scaffold` with the resolved context:

- `serviceName` (string)
- `language` (`node` or `python`)
- `destination` (filesystem path)
- `styleNotes` (string — extracted conventions to bake into the README, or empty when no reference was analyzed)

The scaffold skill produces the folder structure and the master `README.md`. This skill (`hexagonal.md`) does not write any files directly during the greenfield flow.

### Step 7 — Done

Print:
```
Scaffold complete at <destination>/.
- Layers: controllers/ use-cases/ repositories/ data/
- Pattern documented in <destination>/README.md
- Domain folder intentionally omitted (add only when 2+ modules need shared logic).
```

---

## Auto-Invocation Flow (agent feature-slice work)

When an agent is writing or modifying any file inside an existing service directory, this skill governs the work automatically.

### Detection

The skill considers itself auto-invoked when *any* of the following holds:

- The file being created/edited is inside a `controllers/`, `use-cases/`, `repositories/`, or `data/` folder.
- The user is describing a new use case, repository, data adapter, or controller in plain language.

### Behavior

- Apply all layer rules and style constraints automatically.
- **Language is inferred from existing files** in the surrounding service. No prompt.
- If the agent is editing files inside an existing service directory, **treat that directory as the style reference automatically** — no user prompt, no confirmation gate. Read enough sibling files to mirror their conventions.
- **No confirmation gate during auto-invocation** — the agent already knows the rules and applies them directly.

### What the agent must NOT do during auto-invocation

- Create a `domain/` folder speculatively.
- Add retry logic or orchestration inside a repository.
- Use a `create` prefix on module functions (Node.js).
- Add an `execute()` wrapper to use cases (Node.js).
- Convert idiomatic functional Python into class-based code.
- Write test names with function names or implementation references.

---

## Composition with Other Skills

- `/hexagonal-scaffold` — internal operation, invoked by this skill during the greenfield flow (Step 6). Not user-facing.
- `/feature` (future) — auto-invokes this skill when generating service-layer code per sticky.
- `/tdd` (existing) — composes naturally: when TDD generates a new use case or repository, this skill's rules apply.
- `/refactor` (existing) — when invoked on service-layer files, must respect the layer's naming rules (no `create` prefix on use cases, prose test names, etc.).

---

## Future Operations (not yet implemented)

- `hexagonal-review.md` — brownfield analysis. Reports what code is in the wrong layer.
- `hexagonal-refactor.md` — brownfield. Moves misplaced code to the correct layer.

These will be added in future iterations and dispatched from this skill the same way `hexagonal-scaffold` is.

---

## Error Handling

- **Service-name missing and user supplies none** → halt with: *"I need a service name to proceed. Try `/hexagonal <service-name>`."*
- **Reference path (`@<path>`) does not exist** → halt with: *"The reference path `<path>` was not found. Provide an existing folder, or omit the `@<path>` argument to use base rules only."*
- **Destination directory already exists and is non-empty** → halt with: *"Destination `<path>` already exists and contains files. Pick a different name or remove the existing directory first."*
- **Filesystem write fails** → halt and surface the underlying error. Do not leave a partial scaffold behind.
````

- [ ] **Step 2: Verify the file was created and looks complete**

Run:
```bash
wc -l commands/hexagonal.md
head -5 commands/hexagonal.md
```
Expected: roughly 200+ lines; first line is `---` (frontmatter open).

- [ ] **Step 3: Do not commit yet** — bundled with Task 5.

---

## Task 3: Create `commands/hexagonal-scaffold.md` (operation)

**Files:**
- Create: `commands/hexagonal-scaffold.md`

- [ ] **Step 1: Write the file in one shot**

Write `commands/hexagonal-scaffold.md` with exactly this content:

````markdown
---
description: Internal operation invoked by /hexagonal during greenfield scaffolding. Creates the service folder layout and the master README. Not user-invoked directly.
allowed-tools: "Write Bash"
---

# Hexagonal Scaffold Operation

Creates a Hexagonal Architecture folder layout for a new service and writes a master `README.md` documenting the pattern in the selected language's idiomatic style.

This skill is invoked by `/hexagonal` during the greenfield flow. It is not intended for direct user invocation — the core skill resolves all inputs (service name, language, destination, style notes) before calling this one.

---

## Inputs (provided by caller)

- `serviceName` — string, e.g. `payments`
- `language` — `node` or `python`
- `destination` — absolute or project-relative path, e.g. `src/payments/` or `payments/`
- `styleNotes` — string of extracted conventions to bake into the README; may be empty

If any input is missing or invalid, halt and report the issue to the caller. Do not prompt the user (the core skill is responsible for prompts).

---

## What It Produces

```
<destination>/
  controllers/           ← driving adapters (HTTP, CLI, events)
  use-cases/             ← application logic
  repositories/          ← ports for persistence/external data
  data/                  ← driven adapters (DB, AI SDKs, external APIs)
  README.md              ← master pattern documentation
```

No `domain/` folder. No code files. No framework boilerplate. The README is the only file; the user fills in the implementation.

---

## Procedure

### Step 1 — Verify destination

- If `<destination>` exists and is non-empty → halt with: *"Destination `<destination>` already exists and contains files. Pick a different name or remove the existing directory first."*
- If `<destination>` does not exist → create it.

### Step 2 — Create the four layer folders

Create empty directories (no placeholder files, no `.gitkeep` — keep it clean):

```bash
mkdir -p <destination>/controllers
mkdir -p <destination>/use-cases
mkdir -p <destination>/repositories
mkdir -p <destination>/data
```

Use the `Bash` tool for the `mkdir -p` calls.

### Step 3 — Write the master README

Write `<destination>/README.md` using the template below, substituting `<service-name>` and inserting the language-specific pseudocode block. If `styleNotes` is non-empty, append a "Style Conventions (from reference codebase)" section at the bottom.

#### README template (both languages share the structure)

```markdown
# <service-name>

Service built using Hexagonal Architecture. This README documents the layer rules and shows idiomatic patterns. Each layer has a dedicated folder; cross-layer rules are enforced by the `/hexagonal` skill.

---

## Layers

### `controllers/`
**Driving adapters.** Translate external input (HTTP, CLI, events) into plain objects and pass to use cases.

- **MUST NOT** contain business logic.
- **MUST NOT** call repositories or data adapters directly.

### `use-cases/`
**Application logic.** Orchestrates repositories and data adapters. One use case per business operation, one file per use case.

- **MUST NOT** perform I/O of its own.
- **MUST** receive its dependencies (repositories, adapters) as parameters.

### `repositories/`
**Ports for persistence/external data.** Accept a data adapter as a dependency. Translate between the use case's world and the data adapter's world.

- **MUST NOT** contain business logic.
- **MUST NOT** contain retry logic, model fallback strategy, or orchestration across multiple data calls — those belong in the use case.
- **MUST NOT** know anything about HTTP or framework concerns.

### `data/`
**Driven adapters.** Wrap external APIs, databases, AI SDKs. The only place where external-service details (endpoints, schemas, library types) live.

- **MUST** be the single concentration point for any external dependency.

### `domain/` (not present — add only when needed)
Only introduce a `domain/` folder when logic is genuinely duplicated across 2+ modules and can be grouped under a well-named entity with like responsibilities. **Do not create it speculatively.**

---

## Dependency Flow

```
controllers/  →  use-cases/  →  repositories/  →  data/
```

Each arrow means "depends on (calls into)". Nothing flows backward. Use cases never know about controllers; repositories never know about use cases; data adapters never know about repositories.

---

## Pseudocode

<LANGUAGE-SPECIFIC-PSEUDOCODE-GOES-HERE>

---

<OPTIONAL-STYLE-NOTES-SECTION>
```

#### Node.js pseudocode block

When `language === "node"`, insert this where `<LANGUAGE-SPECIFIC-PSEUDOCODE-GOES-HERE>` appears:

````markdown
### Data adapter (driven)

```ts
// data/paymentGateway.ts
export const paymentGateway = ({ httpClient }: { httpClient: HttpClient }) => {
  const charge = async (amount: number, token: string): Promise<ChargeResult> => {
    return httpClient.post('/charges', { amount, token });
  };

  return { charge };
};
```

### Repository (port)

```ts
// repositories/paymentRepository.ts
export const paymentRepository = ({ paymentGateway }: { paymentGateway: PaymentGateway }) => {
  const recordCharge = async (amount: number, token: string): Promise<Charge> => {
    const result = await paymentGateway.charge(amount, token);
    return { id: result.id, amount, status: result.status };
  };

  return { recordCharge };
};
```

### Use case (application logic)

```ts
// use-cases/processOrder.ts
export const processOrder = ({ paymentRepository }: { paymentRepository: PaymentRepository }) => {
  const placeOrder = async (orderInput: OrderInput): Promise<Order> => {
    const charge = await paymentRepository.recordCharge(orderInput.total, orderInput.token);
    return { id: charge.id, total: orderInput.total };
  };

  return { placeOrder };
};
```

### Controller (driving adapter)

```ts
// controllers/orderController.ts
export const orderController = ({ processOrder }: { processOrder: ProcessOrder }) => {
  const handlePostOrder = async (req: Request, res: Response): Promise<void> => {
    const order = await processOrder.placeOrder(req.body);
    res.status(201).json(order);
  };

  return { handlePostOrder };
};
```

### Style rules baked into these examples

- **JS Module Pattern**: each module is a factory closure that returns an object of named methods.
- **No `create` prefix** on factory functions (`paymentRepository`, not `createPaymentRepository`).
- **No generic `execute()`** — methods are named for what they do (`placeOrder`, `recordCharge`).
- **camelCase** for file names and identifiers.
- **TypeScript types** on all public-facing function signatures.
````

#### Python pseudocode block

When `language === "python"`, insert this where `<LANGUAGE-SPECIFIC-PSEUDOCODE-GOES-HERE>` appears:

````markdown
### Data adapter (driven)

```python
# data/payment_gateway.py
from typing import TypedDict

class ChargeResult(TypedDict):
    id: str
    status: str

def charge(amount: int, token: str, http_client) -> ChargeResult:
    return http_client.post("/charges", {"amount": amount, "token": token})
```

### Repository (port)

```python
# repositories/payment_repository.py
from typing import TypedDict
from data import payment_gateway

class Charge(TypedDict):
    id: str
    amount: int
    status: str

def record_charge(amount: int, token: str, http_client) -> Charge:
    result = payment_gateway.charge(amount, token, http_client)
    return {"id": result["id"], "amount": amount, "status": result["status"]}
```

### Use case (application logic)

```python
# use_cases/process_order.py
from typing import TypedDict
from repositories import payment_repository

class OrderInput(TypedDict):
    total: int
    token: str

class Order(TypedDict):
    id: str
    total: int

def place_order(order_input: OrderInput, http_client) -> Order:
    charge = payment_repository.record_charge(
        order_input["total"], order_input["token"], http_client
    )
    return {"id": charge["id"], "total": order_input["total"]}
```

### Controller (driving adapter)

```python
# controllers/order_controller.py
from use_cases import process_order

def handle_post_order(request, http_client):
    order = process_order.place_order(request.json, http_client)
    return {"status": 201, "body": order}
```

### Style rules baked into these examples

- **Module-level functions** — no unnecessary classes. The module itself is the encapsulation unit.
- **Dependencies as parameters** — `http_client` is passed in, never imported as a global.
- **snake_case** for file names and identifiers.
- **Type hints** on all public-facing function signatures.
````

#### Optional style-notes section

If `styleNotes` is non-empty, append this section to the end of the README (replacing `<OPTIONAL-STYLE-NOTES-SECTION>`):

```markdown
## Style Conventions (from reference codebase)

The following conventions were extracted from the reference codebase and apply alongside the base rules above:

<insert styleNotes verbatim>
```

If `styleNotes` is empty, omit the heading entirely (delete the `<OPTIONAL-STYLE-NOTES-SECTION>` placeholder line).

### Step 4 — Report back to the caller

Print:
```
Created scaffold at <destination>/:
  - controllers/
  - use-cases/
  - repositories/
  - data/
  - README.md (<bytes> bytes, <language> pseudocode)
```

The caller (`/hexagonal`) is responsible for any user-facing success message beyond this report.

---

## Error Handling

- **Destination exists and is non-empty** → halt with the exact message from Step 1. Do not partially populate.
- **`mkdir -p` fails** → halt and surface the underlying error.
- **`README.md` write fails after folders were created** → leave the folders in place but halt and report the write error. Caller can clean up.
````

- [ ] **Step 2: Verify the file was created and looks complete**

Run:
```bash
wc -l commands/hexagonal-scaffold.md
head -5 commands/hexagonal-scaffold.md
```
Expected: roughly 250+ lines; first line is `---` (frontmatter open).

- [ ] **Step 3: Do not commit yet** — bundled with Task 5.

---

## Task 4: Mirror both files to `.claude/commands/`

**Files:**
- Create: `.claude/commands/hexagonal.md` (copy of `commands/hexagonal.md`)
- Create: `.claude/commands/hexagonal-scaffold.md` (copy of `commands/hexagonal-scaffold.md`)

- [ ] **Step 1: Copy both files and verify identical**

```bash
cp commands/hexagonal.md .claude/commands/hexagonal.md
cp commands/hexagonal-scaffold.md .claude/commands/hexagonal-scaffold.md
diff commands/hexagonal.md .claude/commands/hexagonal.md
diff commands/hexagonal-scaffold.md .claude/commands/hexagonal-scaffold.md
echo "OK if both diffs printed nothing"
```
Expected: no output from either `diff`; the final `echo` prints `OK if both diffs printed nothing`.

- [ ] **Step 2: Do not commit yet** — bundled with Task 5.

---

## Task 5: Stage everything and stop before commit

**Files:**
- All files from Tasks 1–4 plus `docs/superpowers/plans/2026-05-17-hexagonal-architecture-skill.md`.

- [ ] **Step 1: Stage the seven files**

```bash
git add \
  docs/superpowers/specs/skills/2026-05-17-hexagonal-architecture-skill.md \
  docs/superpowers/plans/2026-05-17-hexagonal-architecture-skill.md \
  commands/hexagonal.md \
  commands/hexagonal-scaffold.md \
  .claude/commands/hexagonal.md \
  .claude/commands/hexagonal-scaffold.md
```

(The spec is staged because Task 1 modified it.)

- [ ] **Step 2: Show what's staged**

```bash
git status
```
Expected: six entries under "Changes to be committed" (one modified spec, five new files).

- [ ] **Step 3: Stop and ask the user**

The user has a hard rule: never commit without explicit user instruction. Print:

*"All files staged. Ready to commit with message `feat: add /hexagonal skill pair (core + scaffold operation)`? (yes / no / different message)"*

Only run `git commit` after the user confirms.

---

## Task 6: End-to-end smoke verification

This task verifies the artifacts are in place without actually invoking `/hexagonal` (which would require a real service name and Claude session).

- [ ] **Step 1: Verify all four command files exist in both locations**

```bash
ls -la commands/hexagonal.md commands/hexagonal-scaffold.md .claude/commands/hexagonal.md .claude/commands/hexagonal-scaffold.md
```
Expected: all four files exist and are non-empty.

- [ ] **Step 2: Verify the layer rules table is present in the core skill**

```bash
grep -c "controllers/" commands/hexagonal.md
```
Expected: at least 3 (referenced in the layer table, dependency flow, and detection rules).

- [ ] **Step 3: Verify both pseudocode blocks (Node + Python) are present in the scaffold skill**

```bash
grep -c "JS Module Pattern\|module-level functions" commands/hexagonal-scaffold.md
```
Expected: at least 2 (one for each language's style-rules section).

- [ ] **Step 4: Verify the spec cross-link is in place**

```bash
grep "Plan:" docs/superpowers/specs/skills/2026-05-17-hexagonal-architecture-skill.md
```
Expected: a line containing `[/hexagonal Skill Pair Implementation Plan](../../plans/2026-05-17-hexagonal-architecture-skill.md)`.

- [ ] **Step 5: Verify the plan cross-link is in place**

```bash
grep "Spec:" docs/superpowers/plans/2026-05-17-hexagonal-architecture-skill.md | head -1
```
Expected: a line containing `[Hexagonal Architecture Skill — Design Spec](../specs/skills/2026-05-17-hexagonal-architecture-skill.md)`.

- [ ] **Step 6: Inform the user**

Print: *"All artifacts in place. Run `bash install.sh` if you want to install to `~/.claude/`. To smoke-test, invoke `/hexagonal <service-name>` in a fresh Claude session."*

---

## Self-Review

**Spec coverage (against `docs/superpowers/specs/skills/2026-05-17-hexagonal-architecture-skill.md`):**

| Spec section | Implemented by |
|---|---|
| Skill Structure (two-file pair) | Tasks 2 + 3 |
| Trigger description (`hexagonal.md`) | Task 2, frontmatter |
| Invocation forms (greenfield + auto-invoke) | Task 2, "Invocation" + "Greenfield Flow" + "Auto-Invocation Flow" |
| Layer rules (5-layer table + repository "must NOT" list) | Task 2, "Layer Rules" |
| Language selection (always ask, no auto-detect) | Task 2, Greenfield Flow Step 2 |
| Enforced style rules (language-agnostic + Node + Python) | Task 2, "Enforced Style Rules" |
| Optional codebase style extraction | Task 2, Greenfield Flow Step 4 |
| Confirmation gate (greenfield-with-reference only) | Task 2, Greenfield Flow Step 5 |
| Agent auto-invocation (rules + "must NOT" list) | Task 2, "Auto-Invocation Flow" |
| Greenfield scaffold (folder layout + README + no domain/) | Task 3, "What It Produces" + Procedure |
| Pseudocode in Node.js JS Module Pattern | Task 3, Node.js block |
| Pseudocode in Python idiomatic functional | Task 3, Python block |
| Future operations callout (review, refactor) | Task 2, "Future Operations" |

**Placeholder scan:** No TBDs, no "implement later", no naked "Similar to Task N". All steps either show the exact content to write or the exact command to run.

**Type / name consistency:**
- `serviceName`, `language`, `destination`, `styleNotes` — used consistently across Tasks 2 and 3.
- `controllers/`, `use-cases/`, `repositories/`, `data/` folder names match in the core skill's layer table, the scaffold's "What It Produces" diagram, the README template, and the `mkdir -p` commands.
- `language` value is `node` or `python` everywhere (not `nodejs`, not `js`, not `typescript`).
- Cross-link directory math: spec lives at `docs/superpowers/specs/skills/` so plan link uses `../../plans/`. Plan lives at `docs/superpowers/plans/` so spec link uses `../specs/skills/`. Verified in Tasks 1 and the plan header.

**Gaps:** None against the spec. The "What This Spec Does Not Cover" section (review, refactor, feature-slice composition) is correctly left out of scope.

---

## Out of Scope (deferred to future plans)

- `hexagonal-review.md` (brownfield analysis). Spec calls it out as future.
- `hexagonal-refactor.md` (brownfield code movement). Spec calls it out as future.
- Auto-invocation wiring from `/feature` to `/hexagonal` (`/feature` skill is unimplemented).
- Composition specifics with `/tdd` beyond the one-line mention in the "Composition with Other Skills" section.
- Context-window guard hook, Stop hook integration — not in spec.
