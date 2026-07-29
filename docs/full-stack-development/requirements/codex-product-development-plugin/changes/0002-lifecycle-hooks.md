# Change Record 0002: Lifecycle Hook Coverage

## User Change Request

用户指出当前插件只有阶段 gate 和 handoff，但没有每个阶段的 hook：

> hook 呢？我们的 hook 好像也都没有，每一个阶段都没有不是吗

## Confirmed Gap

- `.codex-plugin/plugin.json` 没有 hooks。
- 插件源码没有 lifecycle hook registry。
- 阶段转换依赖 Skill 文档和 MCP gate 的手动调用，没有 `before:<stage>` / `after:<stage>` 包裹层。

## Platform Boundary

plugin-creator 资料中提到过 `hooks` manifest 字段，但当前 validator 明确拒绝 unsupported manifest fields including `hooks`。因此本次不向 `.codex-plugin/plugin.json` 增加 `hooks` 字段，避免插件验证失败。

## Impacted Layers

- Product scope: Lifecycle Hooks 前移为 P0。
- Engineering contract: 新增 `mcp-server/src/lifecycle-hooks.js`。
- MCP contract: 新增 `list_lifecycle_hooks`、`review_lifecycle_hook_coverage`、`run_lifecycle_hook`。
- Stage contract: 每个阶段转换都必须有 hook evidence。
- Skill contract: 顶层 Skill 必须要求 hook coverage 和每阶段 hook runner。
- Acceptance contract: 新增 lifecycle hook coverage 和 hook evidence 测试。

## Artifacts To Update

- `00-stage.json`
- `00-artifact-registry.json`
- `02-product/product-scope.md`
- `03-architecture/system-contract.md`
- `04-pressure-tests/stage-pressure-test-matrix.md`
- `skills/full-stack-development/SKILL.md`
- `skills/full-stack-development/references/full-stack-stage-contract.md`
- `mcp-server/src/lifecycle-hooks.js`
- `mcp-server/src/index.js`
- `mcp-server/test/lifecycle-hooks.test.js`
- `mcp-server/test/mcp.test.js`

## Invalidated Approvals

- Prior stage-gate approval is stale for workflows that do not include lifecycle hook evidence.
- Prior implementation approval remains valid only after lifecycle hook tests, full source tests, and plugin validation pass.

## Stage Regression Target

`implementation-plan-ready`

Reason: this change affects stage transition mechanics and implementation/verification evidence, but does not require visual redesign.

## Required Re-Verification

- `npm test -- test/lifecycle-hooks.test.js`
- `npm test -- test/mcp.test.js`
- `npm test`
- plugin validation script
- GitHub backup source tree and ZIP sync.

## PASS Condition

Every core stage has before/after hooks, missing hook coverage blocks, missing hook evidence blocks, hook MCP tools are exposed, and the full test suite plus plugin validator pass.
