# Plugin Structure Check

## Checks Performed

- Parsed `.codex-plugin/plugin.json` as JSON.
- Parsed `.mcp.json` as JSON.
- Confirmed each Skill directory has `SKILL.md`.
- Confirmed personal plugin reinstall succeeds.
- Confirmed installed cache test suite passes.
- Confirmed `codex plugin list` reports `full-stack-development@personal installed, enabled`.
- Confirmed `codex doctor` reports 17 ok, 0 warnings, 0 failures.
- Confirmed `npx -y @heroui/react-mcp@latest --help` starts the HeroUI MCP server on STDIO and reports Version 1.1.0.
- Confirmed installed cache `.mcp.json` uses the installed plugin root via `cwd: "."` and relative MCP server path.
- Confirmed system plugin validator exists at `C:\Users\ROOT\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py`.
- Confirmed `node scripts\validate-plugin.mjs C:\Users\ROOT\plugins\full-stack-development` passes.
- Confirmed Skill quick validation passes for modified/new Skills with `PYTHONUTF8=1`.
- Confirmed real local TailwindUI v4.1 default path indexes successfully: React true, Catalyst true, Templates true, `.jsx` 1056, `.tsx` 399, template families 12, reference-only true.

## Result

PASS.

## Validator Resolution

The previous lookup path was wrong for this Codex installation:

```text
C:\Users\ROOT\.codex\plugins\cache\openai-bundled\plugin-creator\scripts\validate_plugin.py
```

The active validator is provided by the system `plugin-creator` skill:

```text
C:\Users\ROOT\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py
```

The repository now includes `scripts/validate-plugin.mjs`, which locates this validator automatically and falls back to the legacy cache path when available.
