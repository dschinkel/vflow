# vflow

vflow is a personal collection of Claude Code commands. It contains no application code. Commands use native Claude Code — no Superpowers required.

## What's in this repo

- `commands/` — canonical source of truth for all commands. Each command is a single `.md` file.
- `.claude/commands/` — local copy used when working inside this repo. Kept in sync with `commands/`.
- `docs/superpowers/` — brainstorming specs, plans, and research for commands under development.
- `docs/refactorings/` — session output from `/refactor` runs. Not committed (see `.gitignore`).

## Command structure

Each command is a single markdown file with optional frontmatter:

```
commands/
  refactor.md     ← description + allowed-tools frontmatter + body
```

No `.skillfish.json`. No `SKILL.md`. No Superpowers dependency.

## Working on commands

- Edit `commands/<name>.md` to change command behavior. Mirror the change to `.claude/commands/<name>.md`.
- Session logs and tree diagrams from `/refactor` go to `docs/refactorings/` — gitignored, not committed.
- Brainstorming and research docs go under `docs/superpowers/specs/`.
- Implementation plans go under `docs/superpowers/plans/`.

## Key conventions

- `docs/refactorings/` is gitignored — do not commit session output.
- Naming is the only refactoring type currently in scope. More will be added iteratively.
- `commands/` is the distribution source. `~/.claude/commands/` is where they land on the user's machine.
