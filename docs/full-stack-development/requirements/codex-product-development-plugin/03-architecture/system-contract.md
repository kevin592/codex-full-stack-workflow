# 系统合同: 插件融合架构

## System Boundary

`full-stack-development` 是顶层插件。它负责通用产品开发流程，不只负责 HeroUI 前端。

`hero-ui-craft` 保留为 React Web UI 子 Skill。它只在任务涉及前端 UI、Pencil/Figma、HeroUI、视觉验证时进入。

## Core Modules

| Module | File Target | Responsibility |
|---|---|---|
| Artifact contracts | `mcp-server/src/contracts.js` | 定义 artifact registry、artifact 状态、producer/consumer/pass/failure |
| Stage gates | `mcp-server/src/stage-gates.js` | 定义阶段状态机、gate 检查、阻断原因 |
| Lifecycle hooks | `mcp-server/src/lifecycle-hooks.js` | 定义每个核心阶段的 before/after 内部 hook、hook 覆盖审查和 hook evidence runner |
| Change control | `mcp-server/src/change-control.js` | 计算变更影响、stale artifact、审批失效、阶段回退 |
| Tailwind reference | `mcp-server/src/tailwind-reference.js` | 索引本地 TailwindUI/Tailwind Plus 资源，强制 reference-only、不复制源码，并映射回 HeroUI |
| Visual orchestration | `mcp-server/src/visual-orchestration.js` | 输出 Pencil/Figma 一次性编排计划，并审查导出、批准和后续 gate 是否完成 |
| Visual evidence | `mcp-server/src/visual-evidence.js` | 定义 Pencil/Figma 画板清单、导出证据、用户批准记录、组件/状态覆盖和 changeId 过期检查 |
| Quality audits | `mcp-server/src/quality-audits.js` | 审查截图指标、HeroUI 组件图谱、后端/API 合同覆盖、代码审查证据和官方文档 freshness |
| Pressure fixtures | `mcp-server/src/pressure-fixtures.js` | 提供固定压力测试输入 |
| Completion gate | `mcp-server/src/completion-gate.js` | 完成前证据检查 |
| Implementation plan | `mcp-server/src/implementation-plan.js` | 审查实现计划、选择开发流程分级、生成 Superpowers 执行交接 |
| Existing craft compatibility | `mcp-server/src/craft.js` | 保留现有工具并逐步迁移到新模块 |
| MCP registration | `mcp-server/src/index.js` | 暴露新增 MCP 工具 |

## MCP Tool Contract

新增工具必须满足:

- 输出结构包含 `status`。
- `status` 只能是 `pass`、`blocked`、`needs_revision` 中之一。
- 每个 blocker 包含 `artifact`、`reason`、`requiredFix`、`failureRoute`。
- 不能只输出建议；必须给出是否允许进入下一阶段。
- 不能依赖聊天记录；只读输入 artifact 和 stage 文件。

## Lifecycle Hook Contract

当前插件不能把 `hooks` 字段写入 `.codex-plugin/plugin.json`，因为 validator 会拒绝该 manifest 字段。因此 hook 层作为插件内部 MCP 契约实现:

- `list_lifecycle_hooks`: 返回所有核心阶段的 `before` / `after` hook。
- `review_lifecycle_hook_coverage`: 缺任一阶段 hook 时返回 `missing-lifecycle-hook`。
- `run_lifecycle_hook`: 在进入或离开阶段时验证所需 gate/tool evidence。

核心阶段必须全覆盖:

- `rough-intake`
- `requirement-discovery`
- `product-scope`
- `product-spec`
- `ia-interaction-state`
- `backend-api-frontend-contract`
- `visual-requirements`
- `visual-design-ready`
- `visual-design-in-progress`
- `visual-approved`
- `implementation-plan-ready`
- `implementation-in-progress`
- `implementation-complete`
- `verification-in-progress`
- `verified`
- `released`

Hook 不是替代 gate，而是确保 gate 在正确阶段被调用并留下证据。缺 flow profile 仍返回 `missing-flow-profile`；缺 Superpowers handoff 仍返回 `missing-superpowers-execution-handoff`；缺 completion gate evidence 返回 `missing-completion-hook-evidence`。

## Visual Evidence Contract

涉及 UI 的实现不能只依赖 `visualDesignApproved: true`。

必须先通过:

- `generate_design_board_inventory`: 输出 desktop、mobile、component-detail、state-matrix 四类设计画板要求。
- `review_visual_evidence`: 审查 Pencil/Figma 来源、用户批准记录、导出图片、组件覆盖、状态覆盖和 `latestChangeId`。

任何需求变更导致 `00-stage.json.latestChangeId` 前进时，旧视觉证据必须 stale，必须回退到相应需求阶段并重新出图确认。

## TailwindUI Reference Contract

用户提供本地 TailwindUI v4.1 或 Tailwind Plus 文件夹时，插件只能做索引和参考:

- `inspect_tailwind_ui_reference`: 只读取目录、扩展名、分类和模板族，不暴露源码内容。
- `plan_tailwind_hero_ui_adoption`: 把 TailwindUI/Catalyst 视觉参考映射回 HeroUI 官方组件和 Tailwind v4 支撑规则。
- 禁止把 TailwindUI 源码、模板、截图、资产或 Catalyst UI Kit 打包进插件。
- 禁止用 Headless UI、Catalyst 或 TailwindUI primitives 绕过 HeroUI Official Component First。

## Visual Orchestration Contract

Pencil/Figma 一键编排由 `plan_visual_design_orchestration` 生成执行计划:

- 前置 `review_requirement_workspace_stage(targetStage="visual-design")`
- 生成 `generate_design_board_inventory`
- Pencil: `get_editor_state(include_schema: true)` -> `batch_design` -> `snapshot_layout` -> `export_nodes`
- Figma: 加载 Figma skills -> create/update file -> generate design -> export images
- 写入 `04-visual/visual-evidence.md`
- 通过 `review_visual_design_orchestration`
- 通过 `review_visual_evidence`
- 通过 `review_stage_gate(targetStage="implementation")`

## Quality Audit Contract

完成前必须根据任务类型运行更深层审计:

- `review_visual_inspection_metrics`: 截图非空、diff 阈值、重叠、裁剪、对比度。
- `review_hero_ui_component_graph_audit`: HeroUI 官方导入、禁止本地 shadow component、禁止原始色板漂移。
- `review_backend_contract_audit`: endpoint、auth、idempotency、schema fields、error codes。
- `review_code_review_gate`: review summary、blocking findings、tests/UI/backend review。
- `review_hero_ui_docs_freshness`: 官方 HeroUI AGENTS/llms 文档快照完整度和 freshness。

## Implementation Plan Contract

实现计划不是简单任务列表，必须先通过 `review_implementation_plan`，并额外满足:

- `select_development_flow_profile`: 从 `strict-fullstack`、`strict-ui`、`light-change`、`debug-fix` 中选择一档。
- `strict-fullstack`: 默认安全路径，适用于产品、UI、后端、API、数据、权限或验收合同可能变化的工作。
- `strict-ui`: 只适用于 React Web UI / HeroUI / 视觉 / 交互状态变更且无后端/API/数据变更的工作。
- `light-change`: 只适用于不改变产品范围、IA、UI、后端、API、数据、权限或验收行为的小改。
- `debug-fix`: 只适用于 bug、失败测试、构建失败或回归，必须先有根因证据和失败回归测试。
- `plan_superpowers_execution_handoff`: implementation-planner 后必须生成 TDD、subagent-driven 或 executing-plans、requesting-code-review、verification-before-completion、finishing branch 的交接链。

缺少 flow profile 返回 `missing-flow-profile`；缺少 Superpowers handoff 返回 `missing-superpowers-execution-handoff`。

## Skill Contract

新增或修改 Skill 必须满足:

- 写明触发场景。
- 写明输入 artifact。
- 写明输出 artifact。
- 写明禁止行为。
- 写明下一阶段 gate。
- 不能要求用户从零提供 IA、交互矩阵、状态矩阵、API 合同或验收标准。

## Compatibility

- 保留现有 `generate_requirement_workspace`。
- 保留现有 `review_requirement_workspace_stage`。
- 保留现有 `plan_requirement_change`。
- 保留现有 `review_hero_ui_quality`。
- 旧平铺文件结构可以读取，新项目默认生成分层结构。

## PASS Condition

- 实施计划只读本系统合同，也能知道应新建哪些模块、如何注册工具、如何保持兼容。

## Failure Route

- 如果模块边界不清，回退到 `artifact-contract-manager`。
