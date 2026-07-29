# Contributing

Thank you for helping improve Codex Full-Stack Workflow.

## Before opening a pull request

1. Search existing issues and pull requests.
2. Open an issue for changes that alter workflow contracts or stage behavior.
3. Keep each pull request focused on one problem.
4. Add or update tests for behavior changes.
5. Do not commit secrets, credentials, generated dependency folders, or private project data.

## Development

```bash
cd mcp-server
npm ci
npm test
npm audit --omit=dev --audit-level=high
```

When a Codex plugin validator is available, also run:

```bash
cd ..
node ./scripts/validate-plugin.mjs
```

## Pull request expectations

A pull request should explain:

- the problem being solved;
- the workflow stage or contract affected;
- the tests or evidence used to verify the change;
- any compatibility or documentation impact.

By contributing, you agree that your contribution is licensed under the
Apache License 2.0.
