# Hexagonal Architecture Skill — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Spec:** [Hexagonal Architecture Skill — Design Spec](../../../specs/skills/2026-05-17-hexagonal-architecture-skill.md)

> **Deferred:** Scaffold skill and cross-links are in [hexagonal-scaffold-skill plan](2026-05-17-hexagonal-scaffold-skill.md)

**Goal:** Create the `hexagonal.md` core skill that enforces Hexagonal Architecture rules across Node.js and Python projects, picked up automatically by agents building feature slices.

**Architecture:** One skill file in `commands/` (canonical source), mirrored to `.claude/commands/` (local copy). The core skill is picked up automatically by agents when writing service-layer code.

**Tech Stack:** Markdown, native Claude Code skills

---

## File Structure

| File | Purpose |
|------|---------|
| `commands/hexagonal.md` | Canonical source — core skill with all architectural rules |
| `.claude/commands/hexagonal.md` | Local mirror — kept in sync |

---

## Task 1: Write hexagonal.md (core skill)

**Files:**
- Create: `commands/hexagonal.md`
- Create: `.claude/commands/hexagonal.md`

- [ ] **Step 1: Write commands/hexagonal.md with the following content**

```markdown
---
description: Use when implementing any feature that involves service-layer code — use cases, repositories, data adapters, or controllers. Also use when the user runs /hexagonal.
---

# Hexagonal Architecture

This skill governs how service-layer code is structured. It applies automatically when building feature slices and explicitly when scaffolding a new service with `/hexagonal <service-name>`.

> **Future operations:** brownfield review (`/hexagonal-review`) and brownfield refactor (`/hexagonal-refactor`) are planned but not yet implemented.

---

## On Start

**Always ask first — before doing anything else:**

> "Which language are you building in?
> 1. Node.js (TypeScript)
> 2. Python"

Wait for the response. Then proceed.

**Exception:** When auto-invoked by an agent during a feature slice, detect language from existing files in the service directory (`.ts` files → Node.js, `.py` files → Python). If ambiguous, ask.

If the user ran `/hexagonal <service-name>` with or without a `@path` reference → invoke the `hexagonal-scaffold` skill.

---

## Layer Rules (always enforced)

| Layer | Folder | Responsibility |
|---|---|---|
| Controllers | `controllers/` | Driving adapters. Translate external input (HTTP, CLI, events) into plain objects. Delegate to use cases. No business logic. |
| Use Cases | `use-cases/` | Application logic. Orchestrates repositories and data adapters. No I/O of its own. One use case per business operation. |
| Repositories | `repositories/` | Ports for persistence or external data. Accept a data adapter as a dependency. Know nothing about HTTP or frameworks. |
| Data | `data/` | Driven adapters. Wrap external APIs, databases, AI SDKs. The only place external service details live. |
| Domain | `domain/` | **Not created by default.** Only introduced when logic is genuinely duplicated across 2+ modules and can be grouped under a well-named entity with like responsibilities. |

**Python note:** Use snake_case folder names — `use_cases/` not `use-cases/`, `controllers/`, `repositories/`, `data/` stay the same.

### What repositories must NOT do

- No retry logic
- No model fallback strategy
- No orchestration across multiple data calls
- No business decisions

These belong in the use case.

---

## Style Rules (all languages)

- Business logic specific to one use case stays inside that use case — not extracted to the domain layer unless genuinely shared by 2+ modules
- Repositories are thin ports — they translate between the use case's world and the data adapter's world, nothing more
- Test names written in prose using domain language and layman's terms — no function names, no implementation references (e.g., "generates a lifestyle image at the requested temperature" not "passes temperature to generationConfig")
- One use case per file, one responsibility per use case

### Node.js (TypeScript) style

- JS Module Pattern — closures returning plain objects with named methods
- No `create` prefix on factory functions
- No generic `execute()` method — expose named methods directly on the returned object
- camelCase file names and identifiers
- TypeScript types on all public-facing function signatures

**Example use case:**

```typescript
// use-cases/generateImages.ts
const generateImages = (repository: ListingRepository) => {
  const forListing = async (request: GenerateImagesRequest) => {
    return repository.generateImages(request);
  };
  return { forListing };
};
export default generateImages;
```

**Example repository:**

```typescript
// repositories/listingRepository.ts
const listingRepository = (dataLayer: ImageGeneratorDataLayer) => {
  const generateImages = async (request: GenerateImagesRequest) => {
    return dataLayer.generateImage(request);
  };
  return { generateImages };
};
export default listingRepository;
```

**Example controller:**

```typescript
// controllers/listingController.ts
const listingController = (generateImagesUseCase: ReturnType<typeof import('../use-cases/generateImages').default>) => {
  const generate = async (ctx: Context) => {
    const result = await generateImagesUseCase.forListing(ctx.request.body);
    ctx.body = result;
    ctx.status = 200;
  };
  return { generate };
};
export default listingController;
```

### Python style

- Idiomatic functional Python — module-level functions and closures, no unnecessary classes
- Dependencies injected as function parameters
- The Python module (file) is the encapsulation unit — closures return dicts of named callables where dependency injection is needed
- snake_case file names and identifiers
- Type hints on all public-facing function signatures

**Example use case:**

```python
# use_cases/generate_images.py
def generate_images(repository: dict, request: dict) -> dict:
    return repository['generate_images'](request)
```

**Example repository:**

```python
# repositories/listing_repository.py
def listing_repository(data_layer: dict) -> dict:
    def generate_images(request: dict) -> dict:
        return data_layer['generate_image'](request)
    return {'generate_images': generate_images}
```

**Example controller:**

```python
# controllers/listing_controller.py
def generate(use_case: callable, request: dict) -> dict:
    result = use_case(request)
    return {'status': 200, 'body': result}
```

---

## Optional Codebase Style Extraction

When a `@path` reference is provided, read the existing codebase at that path before doing anything else.

### What to analyze

- Naming patterns (file names, function names, exported identifiers)
- Layer organization (folder structure, file grouping)
- Dependency flow (what gets injected, how)
- Error handling conventions
- Testing patterns (file naming, describe/it structure, assertion style)
- Any conventions not already covered by the base rules

### How to apply extracted style

Extracted conventions are **additions** to the base rules, never overrides. The architectural rules above always win. If the reference codebase has repositories doing business logic, note it as a conflict but do not carry that pattern forward. Naming, file structure, and testing conventions are where the reference codebase has influence.

### Confirmation gate (greenfield only — not during auto-invocation)

After analysis:

1. Print a brief summary of what was found
2. Show the proposed structure to be created — folder layout, file names, style applied
3. Ask: *"Does this structure look right? If not, I can fall back to the default Hexagonal structure instead."*
   - Approved → proceed with the blended structure
   - Rejected → show the default structure (base rules only) and confirm once before proceeding

---

## Agent Auto-Invocation (Feature Slices)

When invoked automatically during a feature slice (not by the user running `/hexagonal`):

- Follow all layer rules and style constraints without prompting the user
- Detect language from existing files in the service directory (`.ts` → Node.js, `.py` → Python); ask if ambiguous
- If editing files inside an existing service directory, treat that directory as the style reference automatically — no user prompt needed
- No confirmation gate — apply rules directly

**Must NOT:**
- Create a `domain/` folder speculatively
- Add retry logic or orchestration inside a repository
- Use a `create` prefix on module functions (Node.js)
- Add an `execute()` wrapper to use cases
- Write test names with function names or implementation references
```

- [ ] **Step 2: Mirror to .claude/commands/hexagonal.md**

Copy the file content exactly — both files must be identical.

- [ ] **Step 3: Commit**

```bash
git add commands/hexagonal.md .claude/commands/hexagonal.md
git commit -m "feat: add hexagonal architecture core skill"
```

---

## Task 2: Smoke test hexagonal skill

No automated tests exist for skill files — verify behavior manually by invoking the skill.

- [ ] **Step 1: Invoke the skill directly**

Run `/hexagonal` in Claude Code (no arguments).

Expected: skill asks "Which language are you building in? 1. Node.js (TypeScript) 2. Python" before doing anything else.

- [ ] **Step 2: Verify layer rules are present**

After selecting a language, confirm the skill references all four layers (`controllers/`, `use-cases/`, `repositories/`, `data/`) and explicitly states that `domain/` is not created by default.

- [ ] **Step 3: Verify style rules match the selected language**

Select Node.js → confirm the skill describes the JS Module Pattern, no `create` prefix, no `execute()`.
Select Python → confirm the skill describes module-level functions, dict-of-callables DI, snake_case.

- [ ] **Step 4: Invoke with a service name to confirm scaffold handoff**

Run `/hexagonal payments`.

Expected: skill asks for language, then invokes `hexagonal-scaffold`.
