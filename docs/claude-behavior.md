# Claude Behavior — How to Make Things Stick

## Reliability hierarchy

When you want Claude to reliably do something across sessions, where you put the instruction matters:

| Location | Reliability | Why |
|---|---|---|
| `CLAUDE.md` | Highest | Loaded as project instructions. Claude is told to treat these as binding overrides over default behavior. Hard to miss. |
| Memory (`/memory/*.md`) | Medium | Loaded at session start, but competes with everything else in context. Claude can drift from it under pressure. |
| Nothing | None | Claude will forget between sessions. |

**Rule of thumb:** if you've had to correct Claude more than once on something, it belongs in `CLAUDE.md`, not just memory.

---

## What memory is good for

Memory is useful for things that *inform* Claude's behavior — user profile, preferences, project context, reference pointers. It shapes how Claude approaches work.

It's less reliable for *procedural* requirements — things Claude must always do, every session, without exception. Those belong in `CLAUDE.md`.

---

## What CLAUDE.md is good for

Standing instructions that must be followed every session:

- Workflow requirements ("always use pnpm, never npm")
- Process gates ("always ask spec or implement before writing code")
- Logging requirements ("log skill gaps to gaps/ during the conversation")
- Skill enforcement ("all code in this repo must use the custom skills")

---

## Gap and drift logging

When any conversation involves:
- A skill being skipped or only partially followed
- A rule not applied that should have been
- A misunderstanding about what was done vs. what should have been done
- A missing rule discovered in a skill

Log it immediately to `gaps/<YYYY-MM-DD>-session-gaps.md`. One file per Claude session. Each entry includes the user's prompt verbatim and Claude's admission or finding. Append to the file if it already exists for the session; don't create a new one.

This instruction lives in both `CLAUDE.md` (binding) and memory (reinforcement).
