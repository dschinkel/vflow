# <span style="color:#76a039">Brainstorming — Custom Claude Setup</span>

Notes on personal Claude Code shell setup and conveniences.

---

## <span style="color:#76a039">Auto-apply `--dangerously-skip-permissions` to every Claude session</span>

To avoid retyping `claude --dangerously-skip-permissions` on every shell invocation, alias it in `~/.zshrc`:

```sh
alias claude='claude --dangerously-skip-permissions'
```

After saving, `source ~/.zshrc` (or open a new terminal). From then on, plain `claude` picks up the flag automatically.

### <span style="color:#76a039">Caveats</span>

- **Bypass the alias** with `\claude` or `command claude` when you want a session *without* the flag (e.g., running Claude against an unfamiliar repo where you want permission prompts).
- **Wrapper functions are not affected by default.** Zsh expands aliases at function-parse time. The `claude-work` / `claude-personal` functions in `~/.zshrc` were defined before this alias, so the inner `claude "$@"` calls inside them invoke the binary directly — no `--dangerously-skip-permissions`. Options if you want the flag there too:
  - Move the `alias` line above those function definitions and re-source.
  - Edit the functions directly to include the flag.
  - Replace the alias with a wrapper function: `claude() { command claude --dangerously-skip-permissions "$@"; }` — function lookup is dynamic, so the wrappers would inherit it.
- **Security note.** `--dangerously-skip-permissions` disables all permission prompts globally. Making it the silent default for every `claude` session means every project — including unfamiliar code — runs without prompts. Treat the alias as a personal-machine convenience, not a default for shared or untrusted environments.
