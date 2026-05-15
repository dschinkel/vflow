# vflow

vflow is a personal collection of Claude Code skills. It contains no application code.

## What's in this repo

- `.claude/skills/` — skill definitions. Each skill is a subfolder with `SKILL.md` and `.skillfish.json`.
- `docs/superpowers/` — brainstorming specs, plans, and research for skills under development.
- `docs/refactorings/` — session output from `/refactor` runs. Not committed (see `.gitignore`).

## Skill structure

Each skill follows this layout:

```
.claude/skills/<name>/
  SKILL.md          ← skill definition (YAML frontmatter + body)
  .skillfish.json   ← Superpowers metadata
```

## Working on skills

- Edit `SKILL.md` to change skill behavior.
- Session logs and tree diagrams from `/refactor` go to `docs/refactorings/` — gitignored, not committed.
- Brainstorming and research docs go under `docs/superpowers/specs/`.
- Implementation plans go under `docs/superpowers/plans/`.

## Key conventions

- `docs/refactorings/` is gitignored — do not commit session output.
- All skills currently use the Superpowers format: `.skillfish.json` + `SKILL.md` with YAML frontmatter (`name`, `description`, `allowed-tools`, `metadata`).
- Naming is the only refactoring type currently in scope. More will be added iteratively.
