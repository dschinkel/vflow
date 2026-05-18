# hexagonal-frontend-refactor — Design Spec

> **Status:** Backlog — no plan or implementation yet
>
> **Parent skill:** hexagonal-frontend.md (once implemented)
> **Depends on:** hexagonal-frontend-review.md (once implemented) — review produces the violation list; refactor acts on it
> **Backend equivalent:** hexagonal-refactor.md (also future)

---

## The Problem

Once `hexagonal-frontend-review` identifies drift, someone has to fix it. Moving logic between layers is mechanical but error-prone to do by hand — easy to miss a dependency, break an import, or leave dead code behind.

---

## What This Skill Would Do

Brownfield refactoring. Take a violation (from a review report or a user description) and move the misplaced code to its correct layer — updating imports, co-locating the result, and leaving no dead references behind.

### Example operations

- Extract logic from a component's JSX into its companion hook
- Move a retry loop from a repository into the hook that calls it
- Move a direct `fetch` call out of a hook and into a new or existing repository
- Promote a co-located repository to `shared-repositories/` when a second use case needs it

---

## Open Questions

- Does this skill consume output from `hexagonal-frontend-review`, or does the user describe the violation in plain language?
- How does it handle tests — does it move/update tests for the relocated logic automatically?
- What is the confirmation model? Show a diff and ask before writing, or write and let the user review via git?
- Should it be able to run on a whole module at once, or one violation at a time?
