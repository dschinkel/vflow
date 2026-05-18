# <span style="color:#76a039">Brainstorm</span>
Info on how Claude Skills and Rules work.

---

## <span style="color:#76a039">Local .claude Folder & Custom Skills</span>

The `.claude/` folder at the project root is Claude Code's local configuration directory.
It is project-scoped, so settings and skills here only apply when working in this repo.

### <span style="color:#76a039">Option 1: `.claude/commands/` (native Claude Code)</span>

```
.claude/
  commands/
    value-story-interview.md   ← each file = one /slash-command
  brainstorm.md
  settings.local.json
```

Each `.md` file placed in `.claude/commands/` becomes an invocable slash command in Claude
Code. For example, `.claude/commands/value-story-interview.md` becomes `/value-story-interview`.

The `.md` file contains a prompt that Claude executes when the command is invoked. It can:
- Include instructions, personas, and output templates
- Reference `$ARGUMENTS` to accept user input at invocation time
- Be as short as a single instruction or as detailed as a multi-step workflow

Skills in `.claude/commands/` are local (project-only). Skills placed in
`~/.claude/commands/` are global and available across all projects.

**Tradeoff:** Zero setup, works out of the box today. One file per skill with no place for
examples or templates — limited structure for complex skills.

### <span style="color:#76a039">Option 2: `.claude/skills/` (custom framework)</span>

```
.claude/
  skills/
    value-story-interview/
      SKILL.md          ← skill prompt/instructions
      examples/         ← example inputs and outputs
      templates/        ← output templates the skill uses
      .skillfish.json   ← skill metadata/config
  brainstorm.md
  settings.local.json
```

Each skill gets its own subfolder with dedicated space for examples, templates, and config.
The `.skillfish.json` acts as a manifest describing the skill. This pattern requires a
custom skill runner framework (not native to Claude Code) to load and interpret the
structure.

**Tradeoff:** Richer organization — better for complex skills with multiple templates and
examples. Requires building or adopting the framework that powers it.

### <span style="color:#76a039">Rules: project-wide vs. skill-specific</span>

These two things are complementary, not redundant.

**`.claude/rules/` folder** — always-on, project-wide. Claude Code automatically loads
these into every conversation in the project. Things that apply universally: coding
conventions, testing standards, architectural constraints. You don't invoke them — they're
just always there.

**Rules section inside `SKILL.md`** — only active when that specific skill is running.
They constrain behavior for that skill's task specifically. For example, an
`update-obsidian` skill might have rules like "derive technical details from source code,
not assumptions" — that only matters when that skill is running, and would be noise
everywhere else.

Mental model:
- `.claude/rules/` = standing orders for the whole project
- `SKILL.md` rules section = operating constraints for one specific task

A rule belongs in `.claude/rules/` if it should always be respected regardless of what
you're doing. It belongs inside the skill if it only makes sense in the context of that
skill's operation.

---

## <span style="color:#76a039">Auto-created `.claude/` at Project Root</span>

When you open a project in Claude Code, it automatically creates a `.claude/` folder at
the root of the working directory if one doesn't already exist. This is not something you
add manually — Claude Code generates it on session start.

It contains a `settings.local.json` file for project-level Claude Code configuration
(e.g. allowed/denied tool permissions for that project). This file is project-scoped and
should typically be gitignored if it contains local-only settings.

---

## <span style="color:#76a039">When to use a Hook vs Rule vs Skill</span>

The key distinction is **who enforces it**:

| Mechanism | Enforced by | Depends on model compliance | When it runs |
|---|---|---|---|
| Hook | The harness | No | Lifecycle events — always |
| Rule (CLAUDE.md) | The model | Yes | Every conversation — always loaded |
| Skill | The model | Yes | On demand — only when invoked |

**The real question to ask: can the model skip this?**

- If yes and that's acceptable → rule or skill
- If yes and that's *not* acceptable → hook

**Hook** — use when you need a hard guarantee. The model cannot skip, forget, or rationalize past it. Best for: blocking bad state, verifying artifacts exist, enforcing preconditions. Tradeoff: hooks are dumb bash — no judgment, just checks.

**Rule** — use when something applies universally and you want the model to know and reason about it across every session. Best for: preferences, conventions, standing orders. Tradeoff: the model can still drift.

**Skill** — use when a task has complex multi-step logic that requires model judgment. Best for: workflows, phases, conditional behavior. Tradeoff: compliance-dependent.

**The boundary in practice:** the *workflow* (what to do, when, where) belongs in the skill. The *enforcement* (did it actually happen) belongs in a hook. Skills define intent; hooks verify reality.

In practice most things are rules or skills. Hooks are reserved for things where drift is unacceptable.

---

## <span style="color:#76a039">Claude Code Hooks</span>

Hooks are bash scripts that fire at specific Claude Code lifecycle events. They are
registered in `~/.claude/settings.json` (global) or `.claude/settings.json` (project).

### <span style="color:#76a039">Lifecycle events</span>

| Event | When it fires |
|---|---|
| `Stop` | At the end of every Claude Code session |
| `UserPromptSubmit` | On every prompt submission, before Claude processes it |

### <span style="color:#76a039">Source vs installed location</span>

Hook scripts have two locations:

- **Project source** — `.claude/hooks/` in this repo. This is where you edit scripts.
- **Installed location** — `~/.claude/hooks/`. This is where Claude Code actually runs them from, as registered in `~/.claude/settings.json`.

To avoid a manual copy step after every edit, symlink the installed scripts back to the
project source:

```bash
ln -sf /path/to/project/.claude/hooks/my-hook.sh ~/.claude/hooks/my-hook.sh
```

Edits to the project source are then immediately live — no copy needed.

### <span style="color:#76a039">Hook registration (global settings)</span>

```json
{
  "Stop": [
    { "hooks": [{ "type": "command", "command": "bash ~/.claude/hooks/end-refactor-log-session-stats.sh" }] }
  ],
  "UserPromptSubmit": [
    { "hooks": [{ "type": "command", "command": "bash ~/.claude/hooks/start-refactor-skill.sh" }] }
  ]
}
```

### <span style="color:#76a039">.tdd-context.json — runtime state file</span>

`.tdd-context.json` is a runtime state file written by the `/tdd` skill during an active session. It does not exist in the repo — it is created at the project root when `/tdd` starts and deleted when the session completes or is cancelled. It is gitignored.

Its job is to be a communication channel between the TDD skill, the rollback/recovery logic, and hooks:

- Written at Phase 1 with task name, feature context, log folder path, and starting state
- Updated after every phase transition (`currentIncrement`, `currentPhase`, `filesChanged`)
- Read by rollback logic on next `/tdd` startup if a session was interrupted — drives clean recovery
- Read by the `verify-tdd-logs` hook on every prompt to check whether a TDD session is active and where log files should be

It lives at the **project root of the repo being TDD'd** — not in vflow itself.

### <span style="color:#76a039">Hooks in this repo</span>

| Script | Event | Purpose |
|---|---|---|
| `end-refactor-log-session-stats.sh` | `Stop` | Sums token counts from session JSONL and writes total into the refactor log |
| `start-refactor-skill.sh` | `UserPromptSubmit` | Blocks `/refactor` invocations when context window is too full (Sonnet: 90% min remaining, Opus: 80%) |
| `verify-tdd-logs.sh` | `UserPromptSubmit` | Blocks next prompt if `tdd-plan.md` or `tdd-implementation.md` are missing during an active TDD session |
