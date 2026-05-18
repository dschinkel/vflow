# <span style="color:#76a039">Hexagonal Scaffold Skill — Implementation Plan</span>

> **Status:** Done — superseded by the unified [Hexagonal Skill Pair Implementation Plan](2026-05-17-hexagonal-architecture-skill.md) (one plan covering both core + scaffold). Both `/hexagonal` and `/hexagonal-scaffold` are now shipped. Example markdown blocks below may contain stale relative paths from when the plan was active — they're preserved as historical context only.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Spec:** [Hexagonal Architecture Skill — Design Spec](../../../../specs/done/skills/hexagonal/2026-05-17-hexagonal-architecture-skill.md)

> **Prerequisite:** [hexagonal-architecture-skill plan](2026-05-17-hexagonal-architecture-skill.md) must be complete — `commands/hexagonal.md` must exist before this plan is executed.

**Goal:** Create the `hexagonal-scaffold.md` skill that generates a new service directory with Hexagonal layer structure and a language-specific README, and wire the spec/plan cross-links.

**Architecture:** One skill file in `commands/` (canonical source), mirrored to `.claude/commands/`. Invoked by `hexagonal.md` when the user passes a service name, or directly.

**Tech Stack:** Markdown, native Claude Code skills

---

## <span style="color:#76a039">File Structure</span>

| File | Purpose |
|------|---------|
| `commands/hexagonal-scaffold.md` | Canonical source — greenfield scaffold operation |
| `.claude/commands/hexagonal-scaffold.md` | Local mirror — kept in sync |

---

## <span style="color:#76a039">Task 1: Write hexagonal-scaffold.md</span>

**Files:**
- Create: `commands/hexagonal-scaffold.md`
- Create: `.claude/commands/hexagonal-scaffold.md`

- [ ] **Step 1: Write commands/hexagonal-scaffold.md with the following content**

````markdown
---
description: Scaffold a new Hexagonal Architecture service directory. Invoked by the hexagonal skill when the user runs /hexagonal <service-name>, or directly.
---

# Hexagonal Scaffold

Creates a new service directory with the standard Hexagonal layer structure and a master README documenting the pattern in the selected language's idiom.

---

## Steps

1. Confirm the service name and language (already resolved by `hexagonal.md` if invoked from there — ask if invoked directly)
2. If a `@path` reference was provided, run the codebase style extraction from the `hexagonal` skill before creating anything
3. Create the directory structure:

```
<service-name>/
  controllers/
  use-cases/        (Python: use_cases/)
  repositories/
  data/
  README.md
```

4. Write `README.md` using the template for the selected language below

---

## README Template — Node.js

```markdown
# <service-name>

Structured using Hexagonal Architecture. Each layer has one job.

## <span style="color:#76a039">Layers</span>

### <span style="color:#76a039">controllers/</span>
Driving adapters. Translate HTTP requests (or CLI input, events) into plain objects. Delegate to use cases. No business logic lives here.

### <span style="color:#76a039">use-cases/</span>
Application logic. Orchestrates repositories and data adapters. No direct I/O. One file per business operation.

### <span style="color:#76a039">repositories/</span>
Ports for external data. Accept a data adapter as a dependency. Know nothing about HTTP or frameworks.

### <span style="color:#76a039">data/</span>
Driven adapters. Wrap external APIs, databases, AI SDKs. The only place where external service details live.

### <span style="color:#76a039">domain/ (not created by default)</span>
Only introduce this folder when logic is genuinely duplicated across 2+ modules and belongs under a well-named entity with like responsibilities.

## <span style="color:#76a039">Dependency Flow</span>

```
controllers/ → use-cases/ → repositories/ → data/
```

## <span style="color:#76a039">Style</span>

- JS Module Pattern: closures returning plain objects with named methods
- No `create` prefix on factory functions
- No `execute()` wrapper — expose named methods directly
- camelCase file names and identifiers
- TypeScript types on all public-facing function signatures

## <span style="color:#76a039">Example: Use Case</span>

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

## <span style="color:#76a039">Example: Repository</span>

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

## <span style="color:#76a039">Example: Controller</span>

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

## <span style="color:#76a039">Example: Wiring (entry point)</span>

```typescript
// index.ts
import dataLayer from './data/geminiImageGenerator';
import listingRepository from './repositories/listingRepository';
import generateImages from './use-cases/generateImages';
import listingController from './controllers/listingController';

const repo = listingRepository(dataLayer);
const useCase = generateImages(repo);
const controller = listingController(useCase);
```
```

---

## README Template — Python

```markdown
# <service-name>

Structured using Hexagonal Architecture. Each layer has one job.

## <span style="color:#76a039">Layers</span>

### <span style="color:#76a039">controllers/</span>
Driving adapters. Translate HTTP requests (or CLI input, events) into plain dicts. Delegate to use cases. No business logic lives here.

### <span style="color:#76a039">use_cases/</span>
Application logic. Orchestrates repositories and data adapters. No direct I/O. One file per business operation.

### <span style="color:#76a039">repositories/</span>
Ports for external data. Accept a data adapter as a function parameter. Know nothing about HTTP or frameworks.

### <span style="color:#76a039">data/</span>
Driven adapters. Wrap external APIs, databases, AI SDKs. The only place where external service details live.

### <span style="color:#76a039">domain/ (not created by default)</span>
Only introduce this folder when logic is genuinely duplicated across 2+ modules and belongs under a well-named entity with like responsibilities.

## <span style="color:#76a039">Dependency Flow</span>

```
controllers/ → use_cases/ → repositories/ → data/
```

## <span style="color:#76a039">Style</span>

- Idiomatic functional Python — module-level functions and closures, no unnecessary classes
- Dependencies injected as function parameters
- The Python module (file) is the encapsulation unit — closures return dicts of named callables where DI is needed
- snake_case file names and identifiers
- Type hints on all public-facing function signatures

## <span style="color:#76a039">Example: Use Case</span>

```python
# use_cases/generate_images.py
def generate_images(repository: dict, request: dict) -> dict:
    return repository['generate_images'](request)
```

## <span style="color:#76a039">Example: Repository</span>

```python
# repositories/listing_repository.py
def listing_repository(data_layer: dict) -> dict:
    def generate_images(request: dict) -> dict:
        return data_layer['generate_image'](request)
    return {'generate_images': generate_images}
```

## <span style="color:#76a039">Example: Controller</span>

```python
# controllers/listing_controller.py
def generate(use_case: callable, request: dict) -> dict:
    result = use_case(request)
    return {'status': 200, 'body': result}
```

## <span style="color:#76a039">Example: Wiring (entry point)</span>

```python
# main.py
from data.gemini_image_generator import gemini_image_generator
from repositories.listing_repository import listing_repository
from use_cases.generate_images import generate_images
from controllers.listing_controller import generate

data_layer = gemini_image_generator()
repo = listing_repository(data_layer)

def handle_generate(request: dict) -> dict:
    return generate(lambda r: generate_images(repo, r), request)
```
```
````

- [ ] **Step 2: Mirror to .claude/commands/hexagonal-scaffold.md**

Copy the file content exactly — both files must be identical.

- [ ] **Step 3: Commit**

```bash
git add commands/hexagonal-scaffold.md .claude/commands/hexagonal-scaffold.md
git commit -m "feat: add hexagonal-scaffold skill for greenfield service creation"
```

---

## <span style="color:#76a039">Task 2: Add cross-links between spec and plan</span>

**Files:**
- Modify: `docs/superpowers/specs/2026-05-17-hexagonal-architecture-skill.md`

- [ ] **Step 1: Update the spec's plan link**

In `docs/superpowers/specs/2026-05-17-hexagonal-architecture-skill.md`, replace:

```markdown
> **Plan:** _link to be added when implementation plan is written_
```

With:

```markdown
> **Plan:** [Hexagonal Architecture Skill — Implementation Plan](2026-05-17-hexagonal-architecture-skill.md) · [Hexagonal Scaffold Skill — Implementation Plan](../plans/2026-05-17-hexagonal-scaffold-skill.md)
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-05-17-hexagonal-architecture-skill.md
git commit -m "docs: add cross-links between hexagonal skill spec and plans"
```

---

## <span style="color:#76a039">Task 3: Smoke test hexagonal-scaffold skill</span>

- [ ] **Step 1: Invoke with a service name and Node.js**

Run `/hexagonal payments`, select Node.js.

Expected:
- Creates `payments/controllers/`, `payments/use-cases/`, `payments/repositories/`, `payments/data/`
- Creates `payments/README.md`
- README contains Node.js pseudocode examples (JS Module Pattern, closure style)
- README does NOT include `domain/` as a created folder

- [ ] **Step 2: Invoke with a service name and Python**

Run `/hexagonal orders`, select Python.

Expected:
- Creates `orders/controllers/`, `orders/use_cases/`, `orders/repositories/`, `orders/data/`
- Creates `orders/README.md`
- README contains Python pseudocode examples (module-level functions, dict DI)

- [ ] **Step 3: Clean up test directories**

```bash
rm -rf payments orders
```
