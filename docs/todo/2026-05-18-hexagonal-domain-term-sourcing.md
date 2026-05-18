# Hexagonal Skills — Domain Term Sourcing

> **Status:** Backlog — no plan or implementation yet
>
> **Applies to:** [hexagonal.md](../../commands/hexagonal.md) and [hexagonal-frontend.md](../../commands/hexagonal-frontend.md) (once implemented)

---

## The Problem

When either hexagonal skill auto-invokes during feature work, it knows *how* to structure and name things — but neither has an explicit rule for *where domain terms come from*. Without a rule, the agent may invent folder and component names that don't match the project's actual domain vocabulary.

---

## Proposed Rule (to be ratified)

Domain terms are sourced in this priority order:

1. **The user's task description.** If the user says "build a way to view company profiles", `Company` and `Profile` are the domain terms. The agent extracts vocabulary directly from the language the user used.

2. **Existing code in the same service.** If the service already has domain-named folders, use cases, or repositories, the agent mirrors those names exactly — same nouns, same casing conventions. It does not introduce synonyms or variants.

3. **The counterpart layer.** On an e2e feature, if one side (frontend or backend) already has domain names established, the other side mirrors them. The same nouns flow through both.

4. **Ask before creating.** If none of the above sources yield a clear answer, the agent asks the user for the domain term before creating any folder or file. A wrong domain name baked into the structure is worse than a one-question pause.

---

## Open Questions

- Should the skill explicitly read sibling folders to extract domain terms, or rely on the agent inferring them from context?
- What happens when the user's language and the existing codebase naming disagree (e.g. user says "crafter" but codebase uses "vendor")? Which wins, and does the agent flag the conflict?
- Is there a project-level domain glossary convention worth introducing so all skills can reference a single source of truth?
