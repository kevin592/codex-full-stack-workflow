# Change Record 0001: Superpowers Execution Handoff And Flow Profiles

## User Change Request

用户要求执行对比报告中的第 2 点和第 4 点：

- 把 Superpowers 的 TDD、subagent-driven、requesting-code-review、verification-before-completion、finishing branch 接到 implementation-planner 后面。
- 增加流程分级：`strict-fullstack`、`strict-ui`、`light-change`、`debug-fix`。

## Impacted Layers

- Product scope: Superpowers 执行交接和流程分级从 P1/P2 前移为 P0。
- Engineering contract: `implementation-plan.js` 增加 flow profile selector 和 Superpowers handoff planner。
- MCP contract: 新增 `select_development_flow_profile` 和 `plan_superpowers_execution_handoff`。
- Skill contract: 顶层 skill、implementation-planner、stage contract 必须声明新 hard stop。
- Acceptance contract: 新增缺 flow profile、缺 Superpowers handoff、四档 profile selection 的测试。

## Artifacts To Update

- `00-stage.json`
- `00-artifact-registry.json`
- `02-product/product-scope.md`
- `03-architecture/system-contract.md`
- `04-pressure-tests/stage-pressure-test-matrix.md`
- `05-implementation/full-fusion-implementation-plan.md`
- `skills/full-stack-development/SKILL.md`
- `skills/full-stack-development/references/full-stack-stage-contract.md`
- `skills/implementation-planner/SKILL.md`
- `mcp-server/src/implementation-plan.js`
- `mcp-server/src/index.js`
- `mcp-server/test/implementation-plan-gate.test.js`
- `mcp-server/test/mcp.test.js`

## Invalidated Approvals

- Prior implementation-plan approval is stale for new plans that do not include flow profile or Superpowers handoff.
- Prior implementation approval remains valid only after the new source tests and MCP exposure tests pass.

## Stage Regression Target

`implementation-plan-ready`

Reason: the change affects engineering contract, implementation planning, MCP exposure, and acceptance tests, but does not affect UI visual design or backend/API product contracts.

## Required Re-Verification

- `npm test -- test/implementation-plan-gate.test.js`
- `npm test -- test/mcp.test.js`
- `npm test`
- plugin validation script
- installed cache or repository backup sync if publishing the backup.

## PASS Condition

The plugin blocks implementation plans without flow profile or Superpowers execution handoff, exposes both new MCP tools, and keeps all existing regression tests passing.

