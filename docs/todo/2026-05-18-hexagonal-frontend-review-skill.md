# hexagonal-frontend-review — Design Spec

> **Status:** Backlog — no plan or implementation yet
>
> **Parent skill:** hexagonal-frontend.md (once implemented)
> **Backend equivalent:** hexagonal-review.md (also future)

---

## The Problem

As a frontend codebase grows, code drifts out of the right layer. Business logic leaks into components, repositories grow fat with orchestration, hooks start calling the API directly. There is no automated way to detect this drift today.

---

## What This Skill Would Do

Brownfield analysis. Read an existing frontend module and report what code is in the wrong layer — without modifying anything.

### Expected output

- A list of violations by file, e.g.:
  - `ViewCompany.tsx` — contains conditional logic that belongs in `useViewCompany.ts`
  - `companyRepository.ts` — contains a retry loop that belongs in the hook
  - `useEditAddress.ts` — calls `fetch` directly instead of going through `addressRepository.ts`
- Severity or category per violation (logic leak, missing hook, direct API call in component, etc.)
- No changes made — report only

---

## Open Questions

- What is the invocation form? `/hexagonal-frontend-review <path>`? Or auto-triggered?
- Should it produce a machine-readable output (JSON) for use by `hexagonal-frontend-refactor`?
- How does it handle files that partially violate a rule — flag the whole file or the specific lines?
- Should it score overall health of the module, or just list raw violations?
