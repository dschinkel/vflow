# Brainstorm
Info on how Claude Skills and Rules work.

---

## Local .claude Folder & Custom Skills

The `.claude/` folder at the project root is Claude Code's local configuration directory.
It is project-scoped, so settings and skills here only apply when working in this repo.

### Option 1: `.claude/commands/` (native Claude Code)

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

### Option 2: `.claude/skills/` (custom framework)

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

### Rules: project-wide vs. skill-specific

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

## Auto-created `.claude/` at Project Root

When you open a project in Claude Code, it automatically creates a `.claude/` folder at
the root of the working directory if one doesn't already exist. This is not something you
add manually — Claude Code generates it on session start.

It contains a `settings.local.json` file for project-level Claude Code configuration
(e.g. allowed/denied tool permissions for that project). This file is project-scoped and
should typically be gitignored if it contains local-only settings.


## Local .claude Folder & Custom Skills

The `.claude/` folder at the project root is Claude Code's local configuration directory.
It is project-scoped, so settings and skills here only apply when working in this repo.

### Option 1: `.claude/commands/` (native Claude Code)

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

### Option 2: `.claude/skills/` (custom framework)

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

### Rules: project-wide vs. skill-specific

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
