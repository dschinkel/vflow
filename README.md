# <span style="color:#76a039">vflow</span>

A personal collection of Claude Code slash commands for disciplined software development. Commands are plain markdown files — no Superpowers dependency, no runtime code.

## <span style="color:#76a039">Commands</span>

| Command | What it does |
|---|---|
| `/refactor` | Renames symbols, variables, files, and folders across a codebase following user-defined naming rules. Supports `--output <dir>`. |
| `/tdd` | Drives a full RED → GREEN → REFACTOR cycle, one increment at a time, with state tracking and rollback. |
| `/hexagonal` | Enforces Hexagonal Architecture rules on service-layer code; scaffolds new services (greenfield). |
| `/hexagonal-scaffold` | Internal operation invoked by `/hexagonal` — creates the folder structure and a master `README.md` with layer rules and pseudocode examples. |

## <span style="color:#76a039">Install</span>

```bash
git clone https://github.com/dschinkel/vflow
cd vflow
bash install.sh
```

`install.sh` copies `commands/*.md` to `~/.claude/commands/` and wires up two hooks into `~/.claude/settings.json`. Restart Claude Code after running.

## <span style="color:#76a039">Working conventions</span>

See [CLAUDE.md](CLAUDE.md) for repo layout, command authoring conventions, and development notes.
