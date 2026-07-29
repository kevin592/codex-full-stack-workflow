# Installed Cache Regression Report

## Command

```powershell
python C:\Users\ROOT\.codex\skills\.system\plugin-creator\scripts\update_plugin_cachebuster.py C:\Users\ROOT\plugins\full-stack-development
codex plugin remove full-stack-development@personal
codex plugin add full-stack-development@personal
npm test --prefix C:\Users\ROOT\.codex\plugins\cache\personal\full-stack-development\0.1.0+codex.20260707023222\mcp-server
```

## Result

PASS.

## Evidence

- Installed plugin root: `C:\Users\ROOT\.codex\plugins\cache\personal\full-stack-development\0.1.0+codex.20260707023222`
- Tests: 77
- Pass: 77
- Fail: 0
- Installed `.mcp.json` uses `cwd: "."` and `./mcp-server/src/index.js`, so the installed cache is self-contained and no longer points back to the source plugin directory.

## PASS Condition

The installed cache contains the new MCP modules, including `tailwind-reference.js`, `visual-orchestration.js`, `visual-evidence.js`, and `quality-audits.js`, tests, and lifecycle Skill files, and the same test suite passes outside the source plugin directory.
