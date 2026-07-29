# 阶段压力测试矩阵

## Pressure Test Philosophy

每个阶段都必须证明三件事:

1. 能从上游 artifact 独立接手，不依赖聊天记忆。
2. 能拦住跳步、缺证据、空模板、过度澄清、虚假完成。
3. 下游出现需求变更时，能定位影响、标记 stale、回退阶段。

## Global Stress Rules

| Rule | Requirement |
|---|---|
| No infinite clarification | 需求澄清单轮最多提出 3 个聚焦问题；超过 3 个必须先起草假设并标记 Open Questions |
| No shallow handoff | 下游只读 artifact，不读聊天，如果无法继续则上游 FAIL |
| No empty template pass | 只有标题或空 section 的 artifact 不得 PASS |
| No skip request | 用户说“直接开发”“先画图”“别写文档”时，gate 必须阻断并说明缺什么 |
| No self-score pass | AI 自评分不能作为 gate 依据，必须有 artifact、测试、截图或用户确认 |
| Change invalidates downstream | 需求变更后，下游 artifact 必须 stale，相关 approvals 必须失效 |
| Hooks wrap stages | 每个核心阶段必须有 before/after hook；缺 hook 或缺 hook evidence 不得转换阶段 |

## Stage Pressure Tests

| Stage | Stress Case | Input Fixture | Expected Result |
|---|---|---|---|
| Requirement Discovery | 小白只说“做一个管理后台” | `rough-admin-one-line` | PASS: 生成事实、假设、开放问题、非目标；最多问 3 个聚焦问题 |
| Requirement Discovery | agent 连续问 8 个问题不产出草稿 | `over-clarification` | BLOCKED: `too-many-questions-without-draft` |
| Requirement Discovery | artifact 只有标题和空段落 | `empty-requirement-discovery` | BLOCKED: `empty-template` |
| Product Scope | 没有 MVP/P0/P1/P2 | `missing-priority-scope` | BLOCKED: `missing-scope-priority` |
| Lifecycle Hooks | 某阶段缺 before/after hook | `missing-stage-hook` | BLOCKED: `missing-lifecycle-hook` |
| Lifecycle Hooks | hook 要求的 gate 没有证据 | `missing-hook-evidence` | BLOCKED: `missing-*-hook-evidence` |
| Product Spec | 只写“功能完整、高级、易用” | `vague-product-spec` | BLOCKED: `non-actionable-contract` |
| IA/Interaction/State | 没有信息对象和动作矩阵 | `missing-ia-interaction` | BLOCKED: `missing-downstream-usable-structure` |
| Backend/API Contract | 没有错误、权限、幂等 | `thin-api-contract` | BLOCKED: `missing-api-operational-rules` |
| Visual Requirements | 没有设计系统和反风格 | `thin-visual-contract` | BLOCKED: `missing-visual-boundaries` |
| TailwindUI Reference | 直接复制 TailwindUI/Catalyst 源码 | `tailwindui-source-copy` | BLOCKED: `tailwindui-source-or-catalyst-import` |
| TailwindUI Reference | 用 Headless UI 绕过 HeroUI | `headlessui-import` | BLOCKED: `headlessui-import` |
| Tailwind v4 | CSS 使用 Tailwind v3 `@tailwind` 指令 | `legacy-tailwind-directives` | BLOCKED: `legacy-tailwind-directives` |
| HeroUI Retrieval | UI 组件没有官方来源 | `missing-heroui-source` | BLOCKED: `missing-official-source` |
| Prototype Plan | 没有组件细节图和状态矩阵 | `missing-component-detail-board` | BLOCKED: `missing-required-design-board` |
| Visual Orchestration | 未生成画板清单就开始 Pencil/Figma | `missing-design-board-inventory` | BLOCKED: `design-board-inventory-missing` |
| Visual Orchestration | 未写用户批准记录 | `missing-approval-record` | BLOCKED: `missing-user-approval-record` |
| Visual Approval | 只有一张桌面截图 | `desktop-only-visual` | BLOCKED: `missing-mobile-component-state-exports` |
| Visual Evidence | `visualDesignApproved=true` 但没有 Pencil/Figma 证据 | `approved-flag-without-evidence` | BLOCKED: `missing-visual-evidence` |
| Visual Evidence | 组件细节图未覆盖核心 HeroUI 组件 | `thin-component-detail-sheet` | BLOCKED: `missing-component-detail-coverage` |
| Visual Evidence | 状态矩阵缺 loading/empty/error/disabled/focus | `thin-state-matrix` | BLOCKED: `missing-state-matrix-coverage` |
| Visual Evidence | 需求变更后沿用旧设计图 | `stale-visual-change-id` | BLOCKED: `stale-visual-evidence` |
| Implementation Plan | 没有测试步骤和失败原因 | `plan-without-red-tests` | BLOCKED: `missing-tdd-proof` |
| Implementation Plan | 没有流程分级 | `plan-without-flow-profile` | BLOCKED: `missing-flow-profile` |
| Implementation Plan | 没有 Superpowers 执行交接 | `plan-without-superpowers-handoff` | BLOCKED: `missing-superpowers-execution-handoff` |
| Flow Profile | UI-only 任务误走全栈重流程 | `ui-only-profile-selection` | PASS: `strict-ui` |
| Flow Profile | 小文档/配置改动误走完整视觉/后端流程 | `small-non-contract-change` | PASS: `light-change` |
| Flow Profile | bug 修复没有根因和回归测试纪律 | `debug-fix-profile-selection` | PASS: `debug-fix` with TDD/root-cause emphasis |
| Lifecycle Hooks | implementation-plan-ready before hook 缺 flow profile 和 handoff | `implementation-plan-hook-missing-evidence` | BLOCKED: `missing-flow-profile`, `missing-superpowers-execution-handoff` |
| Lifecycle Hooks | verification-in-progress before hook 缺 completion gate | `verification-hook-missing-completion` | BLOCKED: `missing-completion-hook-evidence` |
| Development | 代码先写，测试后补 | `test-after-code` | BLOCKED: `production-code-without-failing-test` |
| HeroUI Implementation | 使用 `@/components/ui/button` | `shadcn-import` | BLOCKED: `shadcn-import` |
| HeroUI Implementation | 用 CVA 手写 Button | `handwritten-button` | BLOCKED: `handwritten-ui-official-available` |
| Completion | 缺构建、截图或 code review | `incomplete-evidence` | BLOCKED: `missing-completion-evidence` |

## Handoff Tests

| Handoff | Test Method | PASS |
|---|---|---|
| Requirement Discovery -> Product Scope | 下游只读 `requirement-discovery.md` 生成 scope | 能列出 MVP、P0/P1/P2、非目标、验收路径 |
| Product Scope -> Product Spec | 下游只读 scope 生成 spec | 用户、任务、流程、权限、业务规则可执行 |
| Product Spec -> IA/Interaction/State | 下游只读 spec 生成结构 | 能列出页面、区域、动作、状态 |
| IA/Interaction/State -> Visual | 下游只读结构生成视觉需求 | 能决定密度、组件、状态图、反风格 |
| TailwindUI Reference -> Visual | 下游只读 reference index | 能只提取布局密度/参考方向，不复制源码 |
| Visual -> HeroUI Retrieval | 下游只读视觉和 UI 清单 | 能映射官方组件和来源 |
| Visual Orchestration -> Visual Evidence | 下游只读 orchestration report | 能确认 Pencil/Figma 执行步骤、导出和批准记录 |
| Visual Evidence -> Implementation | 下游只读视觉证据 | 能确认当前 changeId、用户批准、四类画板、组件细节和状态矩阵齐全 |
| HeroUI Retrieval -> Implementation | 下游只读 retrieval 和 plan | 能用 `@heroui/react` 实现，不手写官方组件 |
| Implementation Plan -> Superpowers Execution | 下游只读 implementation plan | 能看到 flow profile、TDD、task brief、review package、progress ledger、code review、fresh verification 和 finishing branch |
| Stage Hook -> Stage Gate | 下游只读 hook evidence | 能确认每个阶段转换前后都运行了对应 gate/tool，并且缺 evidence 会阻断 |
| Implementation -> Completion | 下游只读代码和证据 | 能判断是否 `verified` |

## Change Mutation Tests

| Mutation | Current Stage | Expected Regression |
|---|---|---|
| 新增用户角色 | `visual-approved` | `product-scope` |
| 新增信息字段 | `implementation-in-progress` | `ia-interaction-state` |
| 修改批量操作流程 | `implementation-in-progress` | `ia-interaction-state` |
| 修改 API 权限 | `implementation-in-progress` | `backend-api-frontend-contract` |
| 修改视觉密度 | `implementation-in-progress` | `visual-requirements` |
| 修改已确认设计图 | `implementation-in-progress` | `visual-design-ready` |
| 修改验收命令 | `verified` | `verification-in-progress` |

## PASS Condition

- 每个 P0 stage 至少有一个 pass fixture 和一个 fail fixture。
- 每个 fail fixture 返回稳定 blocker code。
- 每个 change mutation 返回稳定 regression stage。
