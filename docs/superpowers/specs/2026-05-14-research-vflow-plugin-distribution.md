# vflow Command Distribution — Research Notes
_2026-05-14_

## Goal

Make vflow commands installable by others. vflow uses native Claude Code commands (`.claude/commands/`) — not Superpowers. Distribution options are documented below, with Clone + Symlink as the primary approach for personal use.

---

## How the Claude Code Plugin System Works

Plugins are discovered and installed through **marketplaces** — GitHub repos with a `.claude-plugin/marketplace.json` that lists installable plugins.

### Two files every plugin needs

**`.claude-plugin/plugin.json`** — defines the plugin itself:
```json
{
  "name": "vflow",
  "description": "...",
  "version": "0.1.0",
  "author": { "name": "Dave Schinkel", "url": "https://github.com/dschinkel" },
  "repository": "https://github.com/dschinkel/vflow",
  "license": "MIT"
}
```

**`.claude-plugin/marketplace.json`** — makes the repo a self-contained marketplace so users can add it directly:
```json
{
  "name": "vflow",
  "owner": { "name": "Dave Schinkel", "url": "https://github.com/dschinkel" },
  "plugins": [
    {
      "name": "vflow",
      "source": { "source": "url", "url": "https://github.com/dschinkel/vflow.git" },
      "description": "Custom skills for value-driven agentic workflows",
      "version": "0.1.0"
    }
  ]
}
```

A repo can be both a plugin AND its own marketplace — that's what claude-mermaid does, and what vflow should do.

---

## Commands Directory Structure

vflow uses native Claude Code commands. Commands live at `.claude/commands/` for local use, and at `commands/` at the repo root for distribution via symlink or future plugin support.

```
vflow/
  commands/
    refactor.md       ← canonical source of truth for distribution
  .claude/
    commands/         ← local dev; points here via symlink or is the same file
      refactor.md
```

---

## What Needs to Be Done (Not Yet Implemented)

1. Add `skills/` at repo root with skills mirrored from `.claude/skills/` (or replace `.claude/skills/` entirely with root-level `skills/`)
2. Add `.claude-plugin/plugin.json`
3. Add `.claude-plugin/marketplace.json`
4. Update README with install instructions
5. Tag a release version on GitHub so the version in the manifest is pinned

---

## Alternate Approach: nWave (CLI Installer)

**What is nWave?** An agentic framework / workflow layer for Claude Code. Not a plugin in the traditional sense — they describe themselves as "AI agents that guide you from idea to working code." The repo: `https://github.com/nWave-ai/nWave`.

### How nWave Installs

nWave is a **Python package on PyPI** (`nwave-ai`). Users install via `uv` or `pipx`, then run the CLI tool which copies files directly into `~/.claude/`:

```bash
uv tool install nwave-ai
nwave-ai install
nwave-ai doctor
```

Their installer copies agents, commands, skills, and Claude Code hook files straight into the user's `~/.claude/` directory — bypassing the plugin system entirely.

### Why They Chose This Approach Over `/plugins`

nWave explicitly documents that the plugin marketplace is **not recommended** and ships a warning in their README:

> "DES enforcement does not work via the plugin marketplace and never will. The plugin marketplace install path is blocked on an upstream Claude Code limitation where `${CLAUDE_PLUGIN_ROOT}` is not populated in plugin hook execution contexts. Without DES hooks, you lose phase enforcement, TDD validation, rigor profiles, and audit logging."
>
> "The plugin marketplace ships agents, commands, and skills only; consider it a degraded preview, not a supported install method."

**The core issue:** Claude Code does not populate `${CLAUDE_PLUGIN_ROOT}` when executing hooks registered by a plugin. So if your framework relies on hooks (lifecycle events, enforcement, validation), the plugin system can't support it. A CLI installer that writes directly to `~/.claude/` doesn't have this limitation.

### Comparison

| | `/plugins` approach (Superpowers/vflow) | CLI installer (nWave) |
|---|---|---|
| **Install method** | `/plugins add marketplace` + `/plugins install` | `pip install` + `nwave-ai install` |
| **What gets installed** | Skills, MCP servers | Skills, agents, commands, hooks, Python lib |
| **Hook support** | No (`${CLAUDE_PLUGIN_ROOT}` not populated) | Yes (copies directly to `~/.claude/`) |
| **Complexity** | Zero — no extra tooling | Requires Python 3.10+ and uv/pipx |
| **Best for** | Skills-only distributions | Full frameworks that need lifecycle hooks |

### What This Means for vflow

vflow currently delivers **skills only** — no hooks. The `/plugins` approach is sufficient and simpler for users. If vflow ever adds Claude Code hooks (e.g., enforcement, logging, lifecycle gates), the CLI installer approach would need to be considered.

---

## Why `commands/` and not `skills/`?

`.claude/skills/` is a **Superpowers convention** — Claude Code itself doesn't know what that folder is. Superpowers is what watches it, reads the `SKILL.md` files, and wires up the slash commands. If you removed Superpowers, `.claude/skills/` would just be an ignored folder.

The thing Claude Code *natively* understands is `.claude/commands/`. These are parallel concepts from different layers:

| | Superpowers | Native Claude Code |
|---|---|---|
| Folder | `.claude/skills/` | `.claude/commands/` |
| File | `SKILL.md` | `<command-name>.md` |
| Metadata | `.skillfish.json` | None |
| Wired up by | Superpowers plugin | Claude Code itself |

---

## Clone + Symlink (Primary Approach)

The quickest way to get vflow commands globally available across all projects on your machine — no plugin system, no Python, no installer.

### How It Works

Claude Code loads personal global commands from `~/.claude/commands/`. Symlink the commands folder from your cloned vflow repo into that directory and Claude Code picks them up immediately in every project.

```bash
# Step 1: clone vflow somewhere stable on your machine
git clone https://github.com/dschinkel/vflow ~/code/ai/vflow

# Step 2: symlink each command into ~/.claude/commands/
ln -s ~/code/ai/vflow/commands/refactor.md ~/.claude/commands/refactor.md
```

To add new commands in the future, just add one more symlink. To update, `git pull` inside the vflow repo — the symlink means every project instantly gets the updated command with no reinstall step.

### Adding All Commands at Once

```bash
for cmd in ~/code/ai/vflow/commands/*.md; do
  ln -s "$cmd" ~/.claude/commands/$(basename "$cmd")
done
```

**Prompt to give Claude after cloning:**
> Symlink all commands from `~/code/ai/vflow/commands/` into `~/.claude/commands/`

### Trade-offs vs Other Approaches

| | Clone + Symlink | CLI Installer (nWave-style) |
|---|---|---|
| **Setup time** | ~30 seconds | ~5 minutes + Python req |
| **Updates** | `git pull` | `uv tool upgrade nwave-ai` |
| **Hook support** | Yes (files live in `~/.claude/`) | Yes |
| **Requires tooling** | git only | Python 3.10+, uv/pipx |
| **Best for** | Personal use on one machine | Full frameworks with hooks |

---

## Reference: nWave (CLI Installer Approach)

**What is nWave?** An agentic framework / workflow layer for Claude Code. Not a plugin in the traditional sense. The repo: `https://github.com/nWave-ai/nWave`.

### How nWave Installs

nWave is a **Python package on PyPI** (`nwave-ai`). Users install via `uv` or `pipx`, then run the CLI tool which copies files directly into `~/.claude/`:

```bash
uv tool install nwave-ai
nwave-ai install
nwave-ai doctor
```

Their installer copies agents, commands, skills, and Claude Code hook files straight into the user's `~/.claude/` directory — bypassing the plugin system entirely.

### Why They Chose This Over `/plugins`

nWave explicitly documents that the plugin marketplace is **not recommended**:

> "The plugin marketplace install path is blocked on an upstream Claude Code limitation where `${CLAUDE_PLUGIN_ROOT}` is not populated in plugin hook execution contexts. Without DES hooks, you lose phase enforcement, TDD validation, rigor profiles, and audit logging."

**The core issue:** Claude Code does not populate `${CLAUDE_PLUGIN_ROOT}` when executing hooks registered by a plugin. A CLI installer that writes directly to `~/.claude/` doesn't have this limitation.

### Relevance to vflow

vflow delivers commands only — no hooks. The CLI installer approach is overkill for vflow's current scope. Relevant if vflow ever adds lifecycle hooks.

---

## Reference: `/plugins` Approach (Superpowers Marketplace)

Documented here for reference only. This approach is **Superpowers-specific** and requires the Superpowers plugin system. vflow does not use Superpowers.

The `/plugins` approach works by adding `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` to the repo, with skills at `skills/` at the repo root. Users install via:

```
/plugins add marketplace github:dschinkel/vflow
/plugins install vflow
```

**Note on visibility:** This approach is **public**. Anyone with Claude Code could discover and install these commands once a marketplace manifest is in place.

Not pursued for vflow because: (1) vflow uses native commands, not Superpowers skills format, and (2) the `/plugins` hook limitation documented by nWave would apply if hooks are ever added.

---

## Open Question

Should `commands/` at root and `.claude/commands/` be kept in sync (two files), or should root `commands/` be the single source of truth with `.claude/commands/` symlinked to it? With the symlink approach, `~/.claude/commands/refactor.md` already points to `commands/refactor.md`, so working in any project gives you the same command without duplication.
