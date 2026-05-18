# <span style="color:#76a039">vflow</span>

vflow is a personal collection of Claude Code commands. It contains no application code. Commands use native Claude Code — no Superpowers required.

## <span style="color:#76a039">What's in this repo</span>

- `commands/` — canonical source of truth for all commands. Each command is a single `.md` file.
- `.claude/commands/` — local copy used when working inside this repo. Kept in sync with `commands/`.
- `docs/superpowers/` — brainstorming specs, plans, and research for commands under development.
- `docs/todo/` — research and brainstorm docs that have no plan or implementation yet (backlog).
- `docs/refactorings/` — session output from `/refactor` runs. Not committed (see `.gitignore`).

## <span style="color:#76a039">Shipped commands</span>

| Command | File |
|---|---|
| `/refactor` | `commands/refactor.md` — renames symbols/files/folders; supports `--output <dir>` |
| `/tdd` | `commands/tdd.md` — RED/GREEN/REFACTOR conductor with state file (`.tdd-context.json`) and rollback |
| `/hexagonal` | `commands/hexagonal.md` — enforces Hexagonal Architecture rules; greenfield scaffold dispatch |
| `/hexagonal-scaffold` | `commands/hexagonal-scaffold.md` — internal operation invoked by `/hexagonal` |
| `/feature` | `commands/feature.md` — Drafter → Provocateur → Persist → Implement; story map board at `localhost:3847` |

## <span style="color:#76a039">Command structure</span>

Each command is a single markdown file with optional frontmatter:

```
commands/
  refactor.md     ← description + allowed-tools frontmatter + body
```

No `.skillfish.json`. No `SKILL.md`. No Superpowers dependency.

## <span style="color:#76a039">How commands work</span>

Command files are **instruction sets for the model**, not runtime code. When a user invokes `/tdd`, Claude reads `commands/tdd.md` and follows it as a set of rules and procedures.

Practical consequences:

- A JSON schema block in a command file (e.g. the `.tdd-context.json` schema in `tdd.md`) is prose the model reads — not a type definition or validator. If a field isn't mentioned in the command file, the model won't know to read or act on it, even if the field exists in the file on disk.
- Changing a command's behavior means editing the markdown, not writing code. The model's behavior is exactly what its instruction file says.
- State files like `.tdd-context.json` are a communication channel between skills: one skill writes fields, another reads them — but only if its instruction file tells it to. Fields written by one skill and never mentioned in another's file are silently ignored.

## <span style="color:#76a039">Working on commands</span>

- Edit `commands/<name>.md` to change command behavior. Mirror the change to `.claude/commands/<name>.md`.
- Session logs and tree diagrams from `/refactor` go to `docs/refactorings/` — gitignored, not committed.
- Brainstorming and research docs go under `docs/superpowers/specs/`.
- Implementation plans go under `docs/superpowers/plans/`.

## <span style="color:#76a039">Key conventions</span>

- `docs/refactorings/` is gitignored — do not commit session output.
- `.tdd-context.json` is gitignored — state file written by `/tdd` during a session.
- Naming is the only refactoring type currently in scope. More will be added iteratively.
- `commands/` is the distribution source. `~/.claude/commands/` is where they land on the user's machine.
- Use **pnpm** for any Node work, never npm.

## <span style="color:#76a039">Gap and drift logging</span>

When any conversation involves a skill being skipped, a rule not followed, a misunderstanding about what was done vs. what should have been done, or a missing rule discovered in a skill — log it immediately to `gaps/<YYYY-MM-DD>-session-gaps.md`.

- One file per Claude session. Use today's date in the filename.
- Each entry includes the user's prompt verbatim and Claude's admission or finding.
- Append to the file if it already exists for this session; never create a duplicate.
- Do not wait until the end of the session — log it as soon as the gap is identified.

See `docs/claude-behavior.md` for why this lives in `CLAUDE.md` rather than memory.
