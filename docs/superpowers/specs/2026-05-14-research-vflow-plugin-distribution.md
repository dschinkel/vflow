# vflow Plugin Distribution — Research Notes
_2026-05-14_

## Goal

Make vflow skills installable by others via `/plugins` in Claude Code, the same way Superpowers is installed.

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

## Skills Directory Structure

For the plugin system to find skills, they must live at **`skills/`** at the repo root — not `.claude/skills/`.

The `.claude/skills/` path is for local project-scoped use when working inside the repo itself. For distribution, the plugin loader looks at `skills/` at root.

```
vflow/
  skills/
    refactor/
      SKILL.md
      .skillfish.json
  .claude-plugin/
    plugin.json
    marketplace.json
  .claude/
    skills/       ← local dev only, not loaded by plugin system
      refactor/
        SKILL.md
        .skillfish.json
```

---

## How Users Would Install

```
/plugins add marketplace github:dschinkel/vflow
/plugins install vflow
```

Or in one step if they already know the repo:
```
/plugins install github:dschinkel/vflow
```

> **Note on visibility:** This approach is **public**. Because vflow is a public GitHub repo, anyone with Claude Code could discover and install these skills once the marketplace manifest is in place. If you want skills to remain personal/private, use the Clone + Symlink approach instead — nothing gets published and it stays local to your machine.

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

## Simple Local Approach: Clone + Symlink

The quickest way to get vflow skills globally available across all projects on your machine — no plugin system, no Python, no installer.

### How It Works

Claude Code loads personal global skills from `~/.claude/skills/`. Symlink each skill folder from your cloned vflow repo into that directory and Claude Code picks them up immediately in every project.

```bash
# Step 1: clone vflow somewhere stable on your machine
git clone https://github.com/dschinkel/vflow ~/code/ai/vflow

# Step 2: symlink each skill into ~/.claude/skills/
ln -s ~/code/ai/vflow/skills/refactor ~/.claude/skills/refactor
```

To add new skills in the future, just add one more symlink. To update, `git pull` inside the vflow repo — the symlink means every project instantly gets the updated skill with no reinstall step.

### Adding All Skills at Once

To symlink every skill in one command:

```bash
for skill in ~/code/ai/vflow/skills/*/; do
  ln -s "$skill" ~/.claude/skills/$(basename "$skill")
done
```

**Prompt to give Claude after cloning:**
> Symlink all skills from `~/code/ai/vflow/skills/` into `~/.claude/skills/`

### Trade-offs vs Other Approaches

| | Clone + Symlink | `/plugins` | CLI Installer (nWave-style) |
|---|---|---|---|
| **Setup time** | ~30 seconds | ~1 minute | ~5 minutes + Python req |
| **Updates** | `git pull` | `/plugins update` | `uv tool upgrade nwave-ai` |
| **Hook support** | Yes (files live in `~/.claude/`) | No | Yes |
| **Requires tooling** | git only | Claude Code `/plugins` | Python 3.10+, uv/pipx |
| **Best for** | Personal use on one machine | Sharing with others easily | Full frameworks with hooks |

### What Needs to Be True for This to Work

Skills must live at `skills/` at the root of the vflow repo (not only in `.claude/skills/`). The symlink points to `~/code/ai/vflow/skills/<skill-name>`, so the canonical source of truth for each skill needs to be at root `skills/`.

---

## Open Question

Should `.claude/skills/` and root `skills/` be kept in sync (two copies), or should the root `skills/` be the single source of truth and `.claude/skills/` dropped? The local dev experience might still benefit from `.claude/skills/` when working inside the vflow repo itself — but with the symlink approach, `~/.claude/skills/refactor` already points to `skills/refactor`, so working in any project gives you the same skill.
