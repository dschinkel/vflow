# Models Research

## Sonnet 4.6 vs Opus 4.7

### Sonnet 4.6
- Fast, cost-efficient
- Strong at mechanical code tasks — renaming, pattern matching, structural changes
- Good enough for most refactoring work where the rules are clear

### Opus 4.7
- Slower, more expensive (~5x cost)
- Better at ambiguous judgment calls: "is `handleData` or `processPayload` the better name here given this codebase's conventions?"
- Stronger at reasoning about broader code context — tracking how a rename ripples across many files, spotting inconsistencies you didn't ask about
- Has extended thinking mode, which helps on complex multi-file refactors

## Which to use for `/refactor`

**Stick with Sonnet 4.6** if the skill focuses on mechanical renaming with clear criteria (the current scope per CLAUDE.md).

**Try Opus 4.7** if Sonnet is making naming judgment calls that feel off — like it doesn't "get" the idioms of a codebase. The payoff is better contextual judgment, not speed.

Test by adding a `model:` line to the frontmatter in `commands/refactor.md`:

```yaml
---
model: claude-opus-4-7
---
```

This pins the skill to Opus whenever it's invoked. Run both on the same file and compare the suggestions to decide if the upgrade is worth it.
