# v0.1.2 Change and Review Evidence

## Intended change set

- Plugin manifest and MCP package version aligned at 0.1.2
- OSS maintenance planner and release gate
- Unit, MCP integration, and skill contract tests
- OSS maintainer skill and evidence reference
- README quick demo and ecosystem listing link
- Changelog and this dogfooded maintenance cycle
- Transitive dependency security updates

## Verification commands

```bash
cd mcp-server
npm test
npm audit --omit=dev --audit-level=high
cd ..
node ./scripts/validate-plugin.mjs .
```

## Local result

- Automated tests: 97 passed, 0 failed
- npm audit: 0 known vulnerabilities
- `oss-maintainer-workflow` quick validation: passed
- Plugin validation: passed
- `git diff --check`: passed

Pull request, remote CI, and review links are recorded in
[04-release-readiness.md](04-release-readiness.md) after remote checks complete.

## Pull request

- [PR #5: Add OSS maintainer workflow](https://github.com/kevin592/codex-full-stack-workflow/pull/5)
