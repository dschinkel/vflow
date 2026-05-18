# <span style="color:#76a039">Hexagonal Frontend Skill — Design Spec</span>

> **Status:** Draft — no plan or implementation yet
>
> **Companion spec:** [Hexagonal Architecture Skill](../../../done/skills/hexagonal/2026-05-17-hexagonal-architecture-skill.md)

---

## <span style="color:#76a039">Why This Exists</span>

The existing `/hexagonal` skill governs backend service-layer code: controllers, use-cases, repositories, and data adapters. When a feature is end-to-end, the frontend needs the same architectural discipline — domain-named components, use-case-driven logic, and clean separation — but the layer set is different. A React client has no HTTP controller (components are the entry point) and no separate data adapter (repositories call the backend API directly). A standalone companion skill captures these differences without complicating the backend skill.

---

## <span style="color:#76a039">Skill Structure</span>

Two files, mirroring the backend pair:

### `hexagonal-frontend.md` (core)

Primary skill. Contains layer rules, naming rules, React-specific style constraints, and the auto-invocation trigger. Auto-invoked when an agent writes or modifies files inside `use-cases/` or `shared-repositories/` within a frontend module.

**Trigger description (frontmatter):**
> Use when implementing any feature that involves frontend/React code — use case components, hooks, or repositories inside a client-side module. Also use when the user runs /hexagonal-frontend to scaffold a new frontend module.

### `hexagonal-frontend-scaffold.md` (operation)

Invoked by the core skill during greenfield scaffolding. Produces the folder layout and a master README with React pseudocode. Not user-invoked directly — mirrors how `hexagonal-scaffold.md` works for the backend.

---

## <span style="color:#76a039">Invocation Forms</span>

```
/hexagonal-frontend checkout              # greenfield scaffold, base rules only
/hexagonal-frontend checkout @src/orders  # greenfield + style from reference codebase
/hexagonal-frontend                       # skill asks for the module name
(agent auto-invokes)                      # when writing/modifying frontend service-layer code
```

---

## <span style="color:#76a039">Folder Structure</span>

There is no top-level `repositories/` folder. Repositories live co-located with their use case domain folder. They are only promoted to `shared-repositories/` once they are needed by more than one domain.

```
use-cases/
  Company/                        ← Business Domain named folder
    ViewCompany.tsx               ← use case component (action + domain: View + Company)
    useViewCompany.ts             ← extracted hook behavior; implementation detail of the use case
    companyRepository.ts          ← repository; co-located with its domain

  Customer/                       ← Business Domain named folder
    Address/                      ← Sub-domain folder
      EditAddress.tsx             ← use case component
      useEditAddress.ts           ← extracted hook behavior
      addressRepository.ts        ← repository; co-located

shared-repositories/              ← promoted here only once a repository is needed by 2+ domains
```

No `controllers/` folder. No `data/` folder. No `components/` root folder.

---

## <span style="color:#76a039">The Three Organizing Concepts</span>

### <span style="color:#76a039">1. Domain folders</span>

Folders are named after **Business Domain concepts** — the nouns of the business: `Company`, `Customer`, `Address`, `Profile`, `Product`. These are not technical terms. `Card` is not a domain name; it is a UI pattern term. Domain names are business vocabulary.

Sub-domains nest inside their parent: `Customer/Address/`, `Company/Billing/`.

### <span style="color:#76a039">2. Use case components</span>

A use case component is a React component named as **Action verb + Business Domain noun**. The action describes what the user is doing; the domain noun identifies the business concept being acted on.

| Action | Domain | Component name |
|--------|--------|----------------|
| View | Company | `ViewCompany.tsx` |
| Edit | Address | `EditAddress.tsx` |
| Find | Crafters | `FindCrafters.tsx` |
| Add | Profile | `AddProfile.tsx` |
| View | Account | `ViewAccount.tsx` |

Use case components are the entry point for a user action. They are **humble** — they render UI and delegate all behavior to their companion hook. No business logic lives inside the component JSX.

### <span style="color:#76a039">3. Hooks (extracted behavior)</span>

A hook is the logic extracted from its use case component to keep the component humble. It is an **implementation detail of the use case**, not a separate architectural layer. It lives co-located in the same domain folder as its component.

Named as `use` + the use case component name: `useViewCompany`, `useEditAddress`, `useFindCrafters`.

The hook orchestrates the repository. It handles loading state, error state, and any business decisions (branching on response, validation). It knows nothing about rendering.

---

## <span style="color:#76a039">Atoms and Domain Compositions</span>

### <span style="color:#76a039">Atoms</span>

Atoms are **generic, domain-ignorant UI primitives** — the smallest composable units: `Header`, `Badge`, `Card`, `Arrow`, `Button`, `Spinner`. Their names are technical/UI terms only. They have zero knowledge of the business or domain. `Badge` does not know what a `Company` is.

Atoms live in `components/` at the module root. They are **never** placed inside a domain folder.

### <span style="color:#76a039">Domain compositions</span>

A domain composition is a React component that **wraps one or more atoms and adds domain context**. It is larger than an atom and more specific, but it is not a use case — it carries no action verb and represents no user action. It is a presentation building block for a specific domain concept.

`CompanyHeader` wraps `Header` (the atom) and renders it with Company-specific data. `CompanyBadge` wraps `Badge` and renders it with Company status. These live **co-located inside their domain folder**.

```
components/
  Header.tsx               ← atom: generic, no domain knowledge
  Badge.tsx                ← atom: generic, no domain knowledge
  Card.tsx
  Arrow.tsx

use-cases/
  Company/
    ViewCompany.tsx        ← use case: Action + Domain; composes domain compositions
    useViewCompany.ts      ← hook
    companyRepository.ts
    CompanyHeader.tsx      ← domain composition: wraps Header atom, adds Company context
    CompanyBadge.tsx       ← domain composition: wraps Badge atom, adds Company status
```

Domain compositions must not call hooks or repositories. They receive all data via props from the use case component that owns them.

---

## <span style="color:#76a039">Layer Rules</span>

### <span style="color:#76a039">Use case components</span>

- Named `[Action][Domain].tsx`. PascalCase. One component per file.
- Delegates all behavior to its companion hook (`use[Action][Domain].ts`).
- Must not call a repository directly.
- Props are plain domain objects — not raw API response shapes.
- No business logic in JSX.

### <span style="color:#76a039">Hooks</span>

- Named `use[Action][Domain].ts`. camelCase file name.
- The single place where loading state, error state, and business decisions for a use case live.
- Calls the repository for data access.
- No rendering logic. Returns plain data and handler functions to the component.
- Must not import global HTTP clients — receives them (or the repository) as a dependency.

### <span style="color:#76a039">Repositories</span>

- Named `[domain]Repository.ts`. camelCase file name (e.g. `companyRepository.ts`).
- The single place where fetch/axios and API endpoint URLs live.
- Translates between domain objects and API request/response shapes.
- Returns plain domain objects, not raw API response shapes.
- **No retry logic, no fallback strategy, no orchestration across multiple API calls** — those belong in the hook/use case.
- Co-located in the domain folder. Promoted to `shared-repositories/` only when needed by 2+ domains.

### <span style="color:#76a039">Shared repositories</span>

- Live in `shared-repositories/` at the module root.
- Same rules as co-located repositories — promotion changes location, not behavior.
- Only promoted when genuinely shared. Do not pre-emptively move a repository here.

---

## <span style="color:#76a039">Naming Rules (enforced everywhere)</span>

- **Domain folders: business nouns only.** `Company`, `Customer`, `Address`. Not `Card`, `List`, `Container`, `Widget`.
- **Use case components: Action + Domain.** The action is a verb from the user's perspective (`View`, `Edit`, `Find`, `Add`, `Remove`, `Manage`). The domain is the business noun.
- **Hooks: `use` + use case name.** `useViewCompany`, `useEditAddress`.
- **Repositories: domain noun + `Repository`.** `companyRepository`, `addressRepository`.
- **Atoms: generic UI terms only.** `Header`, `Badge`, `Card`, `Arrow`, `Button`. Never domain-named. Never placed inside a domain folder.
- **Domain compositions: Domain noun only, no action verb.** `CompanyHeader`, `CompanyBadge`. Wraps atoms, adds domain context. Lives in the domain folder. Receives all data via props — no hooks, no repositories.
- **Test names in prose, domain language.** Never function names or implementation references. *"shows the company name and badge when the company is active"*, not *"calls useViewCompany with the company id"*.
- **TypeScript types on all public-facing function signatures.**

---

## <span style="color:#76a039">How Repositories Differ from Backend Repositories</span>

On the backend, repositories are ports backed by a separate `data/` adapter. On the frontend, there is no separate data adapter — the repository is both port and adapter in one file. This is intentional: the abstraction cost of a data adapter layer on the client side is not worth the benefit. The repository directly wraps the HTTP call. If that HTTP client ever changes, only the repository changes.

---

## <span style="color:#76a039">Composition with `/hexagonal` (E2E Features)</span>

When building an end-to-end feature:

- The backend module is governed by `hexagonal.md`: controllers → use-cases → repositories → data.
- The frontend module is governed by `hexagonal-frontend.md`: use case components → hooks → repositories.
- The frontend repositories call the backend controllers (the API endpoints).
- The same domain language flows through both sides. A `Company` on the backend is a `Company` on the frontend.

Neither skill invokes the other. When a `/feature` slice is built end-to-end, both skills auto-invoke in their respective areas based on which files are being touched.

---

## <span style="color:#76a039">Greenfield Scaffold</span>

Invoked by `/hexagonal-frontend <module-name>`. Produces:

```
<module-name>/
  components/            ← generic, domain-ignorant UI atoms (Header, Badge, Card)
  use-cases/             ← domain-named subfolders; use case components, hooks, repositories
  shared-repositories/   ← empty; promoted from domain folders when shared by 2+ domains
  shared-state/          ← empty; promoted from domain folders when shared by 2+ domains
  shared-validation/     ← empty; promoted from domain folders when shared by 2+ domains
  README.md              ← layer rules and React pseudocode
```

No `data/` folder. No `controllers/` folder. No `domain/` folder. Tech stack: React + Vite (no framework).

The README includes React pseudocode showing the full dependency flow: use case component → hook → repository → API call.

---

## <span style="color:#76a039">Summary: The Composition Chain</span>

**Atoms** are the raw material — generic, domain-ignorant UI primitives (`Header`, `Badge`, `Card`). They know nothing about the business.

**Domain Compositions** give atoms domain context. `CompanyHeader` wraps `Header` and makes it about `Company`. They are named after the domain concept they present, carry no action verb, and hold no behavior. They are pure presentation.

**Use Cases hold the Action against the Domain Composition.** `ViewCompany` is the action (`View`) applied to the domain (`Company`). It is the entry point for a user's intent. It composes domain compositions, delegates behavior to its hook, and connects to the repository through that hook. The action only exists at the use case level — atoms and domain compositions never carry it.

```
atoms/          Header, Badge, Card          ← generic; no domain, no action
                       ↓ composed into
domain folder/  CompanyHeader, CompanyBadge  ← domain context; no action
                       ↓ composed into
use-cases/      ViewCompany                  ← action + domain; behavior via hook → repository
```

---

## <span style="color:#76a039">Decisions</span>

All open questions resolved:

1. **Atoms folder name** → `components/`. Generic, domain-ignorant UI primitives live in `components/` at the module root.

2. **Auto-invocation detection** → `.tsx` file extension. If the file being written or modified is `.tsx`, the frontend skill fires. Backend files are `.ts` or `.py` — never `.tsx`. Simple and unambiguous.

3. **State management** → Same co-location pattern as repositories. A store lives in the domain folder alongside its use case. Promoted to `shared-state/` at the module root only when genuinely needed by 2+ domains.

4. **Form validation** → Same co-location pattern. Validation lives next to the use case in the domain folder. Promoted to `shared-validation/` at the module root only when genuinely shared by 2+ use cases.

5. **Next.js / RSC** → Not applicable. The stack is plain React + Vite, no framework.

---

## <span style="color:#76a039">What This Spec Does Not Cover</span>

- The actual pseudocode for the scaffold README (that belongs in the plan/implementation)
- How `hexagonal-frontend-review.md` or `hexagonal-frontend-refactor.md` would work (future brownfield operations)
