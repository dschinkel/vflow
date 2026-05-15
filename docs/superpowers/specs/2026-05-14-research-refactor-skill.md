# Refactor Skill — Research Notes
_2026-05-14_
Note: this was partly based on feeding it my thoughts from `refactor-skill.txt`.

See also: `2026-05-14-research-refactor-skill_naming.md` for naming-specific research.

## What This Skill Does

`/refactor` is a Claude Code custom skill for refactoring codebases using good business domain language and well-written prose that describes behavior — not implementation details. This is a gap that both IDEs and agents have historically failed to close well out of the box.

This is being built iteratively. **Naming is the first and only refactoring type in scope right now.**

---

## Invocation

```
/refactor @<file-or-folder>
```

- The `@` reference is required. If omitted, the skill halts and asks for one.
- If a folder is given, the skill announces upfront which file it starts with (simplest first) and the order it will walk through the rest.
- The skill always displays the currently processed file at the top of every message.
- On start, the skill states clearly: *"This skill currently handles naming refactors only. More refactoring types will be added in future iterations."*

---

## Skill Format

Uses native Claude Code commands — no Superpowers required.

```
.claude/
  commands/
    refactor.md
```

A `.md` file in `.claude/commands/` becomes a slash command automatically. When `/refactor` is invoked, Claude Code reads the file and injects its content into context. No plugin, no `.skillfish.json`, no `Skill` tool call.

Vflow has no runtime code. It is purely a storage repo for command files. The thing that reads `refactor.md`, intercepts `/refactor`, and injects the content into context is Claude Code itself — no external framework needed.

---

## Notes (from Anthropic Skills Guide)

_Reviewed against: The Complete Guide to Building Skills for Claude (Anthropic, 2026)_

Since vflow uses native Claude Code commands (not Superpowers), several of the original proposed changes no longer apply. Notes that remain relevant:

### Description field

The guide recommends trigger-phrase-focused descriptions. Native Claude Code commands support an optional `description:` in frontmatter — keep it short and trigger-focused:

> *"Use when user runs /refactor, asks to rename identifiers, variables, or functions, or says 'clean up naming' on a file or folder."*

### `allowed-tools` frontmatter

Claude Code natively supports `allowed-tools` in command frontmatter to restrict which tools the command can invoke:

```yaml
allowed-tools: "Read Edit Bash"
```

This is not Superpowers-specific — it works with native commands.

### Command file size

Keep `refactor.md` under 5,000 words. Large command bodies cause degraded performance.

### Error handling

The guide calls out error handling as required. The command file should cover:

- `@` reference not found → halt and tell the user
- File has no functions → tell the user and skip
- Mermaid MCP unavailable → write `.mmd` source to disk anyway
- `docs/refactorings/` can't be created → halt and explain

_(Error handling is already in the current `refactor.md`.)_

### No longer relevant

- `.skillfish.json` — Superpowers-only, not used
- `metadata:` block — Superpowers-only, not used
- `references/` vs `examples/` folder naming — only applies to the Superpowers multi-file skill structure; native commands are a single file

---

## Open Questions

- Pattern matching against an existing codebase for consistency — noted as a future addition once the core skill works well
