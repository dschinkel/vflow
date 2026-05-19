# <span style="color:#76a039">vflow</span>

A personal collection of Claude Code slash commands for disciplined software development. Commands are plain markdown files — no Superpowers dependency, no runtime code.

## <span style="color:#76a039">Commands</span>

| Command               | What it does |
|-----------------------|---|
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

## <span style="color:#76a039">feature-ui — Story Map Board</span>

`feature-ui/` is a local Koa + React + Vite app that renders a live story map board at `http://localhost:3847`. It is used by the `/feature` command to track implementation progress sticky by sticky.

### Dev setup (two terminals)

**Terminal 1 — API server** (SSE + active-sticky endpoint):

```bash
cd feature-ui
pnpm start story-maps/<feature-slug>/story-map.md 3847
```

**Terminal 2 — Vite dev server** (HMR + React Fast Refresh):

```bash
cd feature-ui
pnpm dev
```

Open `http://localhost:5173` for the board with hot reload. The Vite dev server proxies `/events`, `/state`, and `/active-sticky` to the Koa server on 3847.

### Production / `/feature` command usage

The `/feature` command starts only the Koa server and serves the pre-built `dist/`. After making UI changes, rebuild first:

```bash
cd feature-ui
pnpm build
```

Then restart the Koa server — it will serve the new dist automatically.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite`. No `tailwind.config` file — CSS-first configuration. The `cn()` utility lives at `src/lib/utils.ts` (clsx + tailwind-merge).

## <span style="color:#76a039">Working conventions</span>

See [CLAUDE.md](CLAUDE.md) for repo layout, command authoring conventions, and development notes.
