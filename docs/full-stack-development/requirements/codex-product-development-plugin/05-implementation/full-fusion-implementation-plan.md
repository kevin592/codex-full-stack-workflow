# Full-Stack Development Plugin Fusion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `full-stack-development` into a full-process Codex product development plugin with contract artifacts, stage gates, change control, HeroUI frontend enforcement, implementation planning, pressure tests, and completion verification.

**Architecture:** Add deterministic MCP modules for artifact contracts, stage gates, change control, pressure fixtures, and completion gates, while preserving existing `craft.js` compatibility. Split Skill responsibilities so the top-level plugin orchestrates product development and `hero-ui-craft` remains the React Web UI layer.

**Tech Stack:** Node.js ESM, `node:test`, `@modelcontextprotocol/sdk`, Zod, Codex plugin Skill files, bundled HeroUI official docs.

## Global Constraints

- The plugin name remains `full-stack-development`.
- This is a general Codex product development plugin, not a HeroUI-only plugin and not a concrete ecommerce admin app.
- HeroUI remains mandatory only for React Web UI work.
- No Pencil/Figma gate is required for developing this plugin itself, because this plugin release does not ship a business UI.
- Future UI projects handled by the plugin must require Pencil/Figma visual approval before implementation.
- The user only needs to provide rough goals, corrections, and confirmations; the agent must draft missing IA, interaction, state, API, frontend, engineering, and acceptance contracts.
- Every gate must be testable and must not rely on chat memory.
- Empty templates must not pass.
- No stage may PASS by self-declaration.
- Requirement changes must create a change record, stale impacted artifacts, invalidate approvals, and regress to the earliest impacted stage.
- Keep existing tests passing and keep existing MCP tools backward compatible.

---

## File Structure

Create or modify these files:

| File | Responsibility |
|---|---|
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/contracts.js` | Artifact contract registry, artifact status rules, required field checks |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/stage-gates.js` | Stage state machine, gate requirements, blocker generation |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/change-control.js` | Change impact classification, stale artifact calculation, approval invalidation |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/tailwind-reference.js` | Local TailwindUI reference indexing and HeroUI/Tailwind v4 adoption policy |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/visual-orchestration.js` | Pencil/Figma one-run orchestration plan and review |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/visual-evidence.js` | Pencil/Figma board inventory, visual evidence review, approval and stale-change checks |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/pressure-fixtures.js` | Deterministic fixture data for pressure tests |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/completion-gate.js` | Final evidence gate for verified/released states |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/craft.js` | Delegate existing tools to new modules without breaking output shape |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/index.js` | Register new MCP tools |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/artifact-contract.test.js` | Artifact Registry unit tests |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/stage-gates.test.js` | Stage gate and status transition tests |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/change-control.test.js` | Requirement change regression tests |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/tailwind-reference.test.js` | TailwindUI reference-only adapter tests |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/visual-orchestration.test.js` | Pencil/Figma orchestration tests |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/visual-evidence.test.js` | Pencil/Figma evidence gate tests |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/pressure-requirement-clarification.test.js` | Requirement clarification pressure tests |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/pressure-visual-heroui.test.js` | Visual and HeroUI pressure tests |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/completion-gate.test.js` | Final completion evidence tests |
| `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/mcp.test.js` | MCP tool exposure regression |
| `C:/Users/ROOT/plugins/full-stack-development/skills/full-stack-development/SKILL.md` | Top-level orchestration rules |
| `C:/Users/ROOT/plugins/full-stack-development/skills/full-stack-development/references/full-stack-stage-contract.md` | Updated stage contract |
| `C:/Users/ROOT/plugins/full-stack-development/skills/<new-skill>/SKILL.md` | New focused Skill files |

## Milestone Goals

| Goal | Outcome | Done When |
|---|---|---|
| G1 Contract Core | Artifact Registry and contract validation exist | Missing producer/consumer/pass/failure blocks |
| G2 Stage Gates | Stage state machine blocks/permits correctly | Visual, implementation, verification gates have stable tests |
| G3 Pressure Testing | Each stage has pass/fail/mutation pressure fixtures | Requirement clarification cannot over-ask or under-specify |
| G4 Change Control | Requirement change regresses safely | Change impacts stale artifacts and approvals |
| G5 Visual Evidence Gate | Pencil/Figma approval is machine-reviewable | Desktop, mobile, component-detail, state-matrix, approval, and current change id pass |
| G6 TailwindUI Reference | Local TailwindUI can inform design without source copying | Reference-only index and HeroUI adoption policy pass |
| G7 Visual Orchestration | Pencil/Figma workflow is one-run and reviewable | Tool plan, exports, approval, evidence, and stage gate pass |
| G8 HeroUI Enforcement | Frontend UI cannot bypass HeroUI/Pencil | shadcn, Radix, Base UI, CVA, TailwindUI/Catalyst, Headless UI, hand-written official components block |
| G9 Skill Fusion | Plugin Skill tree reflects product lifecycle | Top-level Skill dispatches; child Skills own artifacts |
| G10 Completion Gate | No false completion | Missing tests/build/screenshots/review blocks `verified` |
| G11 Install Regression | Source and installed cache both pass | Plugin validation and cache tests pass |
| G12 Execution Discipline And Flow Profiles | Implementation planning hands off to the right execution intensity | Plans without flow profile or Superpowers handoff block; profile selector covers strict-fullstack, strict-ui, light-change, debug-fix |

## Task 1: Artifact Contract Core

**Files:**
- Create: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/contracts.js`
- Create: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/artifact-contract.test.js`
- Modify: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/index.js`

**Interfaces:**
- Produces: `createArtifactRegistry(input)`, `reviewArtifactContract(input)`, `listArtifactContracts(input)`, `getArtifactContract(input)`.
- Consumes: feature slug, workspace files, artifact registry JSON.

- [ ] **Step 1: Write failing tests**

Test cases:

```javascript
test("artifact registry blocks missing producer consumer pass condition and failure route", () => {});
test("empty markdown artifact does not pass contract review", () => {});
test("registered artifact can be listed and fetched by id", () => {});
```

Run:

```powershell
npm test --prefix C:\Users\ROOT\plugins\full-stack-development\mcp-server -- test/artifact-contract.test.js
```

Expected: FAIL because `contracts.js` does not exist.

- [ ] **Step 2: Implement minimal module**

Implement deterministic artifact validation:

- required fields: `id`, `path`, `producer`, `consumers`, `requiredForStages`, `status`, `passCondition`, `failureRoute`.
- status values: `missing`, `draft`, `ready-for-review`, `approved`, `stale`, `blocked`.
- empty content patterns: empty string, only headings, only placeholder text.

- [ ] **Step 3: Expose MCP tools**

Register:

- `list_artifact_contracts`
- `get_artifact_contract`
- `review_artifact_contract`

- [ ] **Step 4: Run tests**

Run:

```powershell
npm test --prefix C:\Users\ROOT\plugins\full-stack-development\mcp-server
```

Expected: all existing tests plus artifact tests pass.

## Task 2: Stage Gate Engine

**Files:**
- Create: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/stage-gates.js`
- Create: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/stage-gates.test.js`
- Modify: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/craft.js`
- Modify: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/index.js`

**Interfaces:**
- Produces: `reviewStageGate(input)`, `deriveNextAllowedStage(input)`, `reviewRequirementWorkspaceV2(input)`.
- Consumes: `00-stage.json`, `00-artifact-registry.json`, files, target stage.

- [ ] **Step 1: Write failing tests**

Test cases:

```javascript
test("visual design gate blocks without approved requirements", () => {});
test("implementation gate blocks without visual approval when UI applies", () => {});
test("implementation gate skips visual approval only when uiNotApplicable is explicit", () => {});
test("verification gate blocks missing test build screenshot review evidence", () => {});
```

Expected: FAIL because `reviewStageGate` does not exist.

- [ ] **Step 2: Implement stage matrix**

Stages:

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

- [ ] **Step 3: Backward compatibility**

Update `reviewRequirementWorkspaceStage` so old callers still work, but internally delegate to the new stage gate when v0.2 artifacts exist.

- [ ] **Step 4: Run tests**

Run:

```powershell
npm test --prefix C:\Users\ROOT\plugins\full-stack-development\mcp-server -- test/stage-gates.test.js
npm test --prefix C:\Users\ROOT\plugins\full-stack-development\mcp-server
```

## Task 3: Requirement Clarification Pressure Tests

**Files:**
- Create: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/pressure-fixtures.js`
- Create: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/pressure-requirement-clarification.test.js`
- Modify: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/contracts.js`
- Modify: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/stage-gates.js`

**Interfaces:**
- Produces: `getPressureFixture(name)`, `reviewClarificationPressure(input)`.
- Consumes: rough request, generated artifact content, question count, downstream handoff report.

- [ ] **Step 1: Write failing tests**

Required fixture tests:

```javascript
test("one-line admin request passes when agent drafts assumptions and asks at most three focused questions", () => {});
test("over-clarification blocks when agent asks more than three questions without draft", () => {});
test("vague requirement artifact blocks downstream handoff", () => {});
test("downstream product scope can consume requirement discovery without chat context", () => {});
```

Expected: FAIL because pressure fixtures do not exist.

- [ ] **Step 2: Implement pressure rules**

Rules:

- question count > 3 and no draft => `too-many-questions-without-draft`.
- artifact missing Confirmed Facts / AI Assumptions / Open Questions / Out of Scope / Downstream Use / PASS Condition => blocked.
- downstream handoff must produce next artifact or fail upstream.

- [ ] **Step 3: Add fixture names**

Required fixtures:

- `rough-admin-one-line`
- `over-clarification`
- `empty-requirement-discovery`
- `vague-product-spec`
- `missing-ia-interaction`

- [ ] **Step 4: Run tests**

Run:

```powershell
npm test --prefix C:\Users\ROOT\plugins\full-stack-development\mcp-server -- test/pressure-requirement-clarification.test.js
```

## Task 4: Change Control Engine

**Files:**
- Create: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/change-control.js`
- Create: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/change-control.test.js`
- Modify: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/craft.js`
- Modify: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/index.js`

**Interfaces:**
- Produces: `planChangeImpact(input)`, `markArtifactsStale(input)`, `generateChangeRecord(input)`.
- Consumes: current stage, change request, artifact registry, existing approvals.

- [ ] **Step 1: Write failing tests**

Test cases:

```javascript
test("new user role regresses to product-scope and invalidates visual approval", () => {});
test("new data field regresses to ia-interaction-state and stales frontend artifacts", () => {});
test("api permission change regresses to backend-api-frontend-contract", () => {});
test("verified feature with changed acceptance regresses to verification-in-progress", () => {});
```

- [ ] **Step 2: Implement change classification**

Mapping:

- business goal => `requirement-discovery`
- scope or role => `product-scope`
- page/nav/field/action/state => `ia-interaction-state`
- API/data/auth => `backend-api-frontend-contract`
- visual style/component => `visual-requirements`
- confirmed design => `visual-design-ready`
- implemented behavior => `implementation-plan-ready`
- acceptance command => `verification-in-progress`

- [ ] **Step 3: Preserve existing tool**

Make `planRequirementChange` call `planChangeImpact` internally and keep existing return fields.

- [ ] **Step 4: Run tests**

Run:

```powershell
npm test --prefix C:\Users\ROOT\plugins\full-stack-development\mcp-server -- test/change-control.test.js
```

## Task 5: HeroUI Frontend Gate Pressure Tests

**Files:**
- Create: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/pressure-visual-heroui.test.js`
- Modify: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/craft.js`
- Modify: `C:/Users/ROOT/plugins/full-stack-development/skills/hero-ui-craft/SKILL.md`
- Modify: `C:/Users/ROOT/plugins/full-stack-development/skills/hero-ui-craft/references/visual-confirmation.md`

**Interfaces:**
- Produces: stricter `reviewHeroUiQuality(input)` results and visual evidence blockers.
- Consumes: code, css, visual confirmation, HeroUI official source retrieval, exception records.

- [ ] **Step 1: Write failing tests**

Test cases:

```javascript
test("implementation blocks when Pencil/Figma exports only include desktop", () => {});
test("handwritten Button blocks when HeroUI Button exists", () => {});
test("shadcn Radix Base UI and CVA imports block", () => {});
test("HeroUI gap exception passes only with checked official sources and narrow local scope", () => {});
```

- [ ] **Step 2: Enhance quality review**

Add checks for:

- required exported image categories: desktop, mobile, component-detail, state-matrix.
- official source retrieval present for P0/P1 components.
- `heroUiGapJustification` must include sources checked, missing component, reason, local scope.

- [ ] **Step 3: Run tests**

Run:

```powershell
npm test --prefix C:\Users\ROOT\plugins\full-stack-development\mcp-server -- test/pressure-visual-heroui.test.js
```

## Task 6: Completion Gate

**Files:**
- Create: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/completion-gate.js`
- Create: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/completion-gate.test.js`
- Modify: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/index.js`

**Interfaces:**
- Produces: `reviewCompletionGate(input)`.
- Consumes: feature path, stage state, evidence inventory, test/build/screenshot/review reports.

- [ ] **Step 1: Write failing tests**

Test cases:

```javascript
test("completion gate blocks missing fresh test report", () => {});
test("completion gate blocks missing build report", () => {});
test("ui completion blocks missing desktop and mobile screenshots", () => {});
test("completion gate passes when all required evidence exists", () => {});
```

- [ ] **Step 2: Implement evidence matrix**

Required evidence:

- requirements stage state
- implementation task ledger
- test report
- build report
- screenshot report when UI applies
- HeroUI compliance when UI applies
- API/data report when backend applies
- code review report
- final acceptance report

- [ ] **Step 3: Register MCP tool**

Register:

- `review_completion_gate`

- [ ] **Step 4: Run tests**

Run:

```powershell
npm test --prefix C:\Users\ROOT\plugins\full-stack-development\mcp-server -- test/completion-gate.test.js
```

## Task 6A: Visual Evidence Gate

**Files:**
- Create: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/visual-evidence.js`
- Create: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/visual-evidence.test.js`
- Modify: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/stage-gates.js`
- Modify: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/index.js`
- Create: `C:/Users/ROOT/plugins/full-stack-development/skills/visual-evidence-gate/SKILL.md`

**Interfaces:**
- Produces: `generateDesignBoardInventory(input)`, `reviewVisualEvidence(input)`.
- Consumes: `00-stage.json`, Pencil/Figma exports, user approval record, required components, required states.

- [x] **Step 1: Write failing tests**

Test cases:

```javascript
test("design board inventory requires desktop mobile component detail and state matrix boards", () => {});
test("visual evidence blocks desktop-only exports before implementation", () => {});
test("visual evidence blocks component detail sheets that omit required components or states", () => {});
test("visual evidence is stale after requirement change id moves forward", () => {});
test("implementation gate blocks approved flag without concrete visual evidence", () => {});
```

- [x] **Step 2: Implement visual evidence review**

Rules:

- required categories: `desktop`, `mobile`, `component-detail`, `state-matrix`.
- required approval record: `approvedBy`, `approvedAt`, `scope`.
- tool must be `pencil` or `figma`.
- `stageState.latestChangeId` must match visual evidence `changeId`.
- required components must appear in component-detail exports.
- required states must appear in state-matrix exports.

- [x] **Step 3: Expose MCP tools**

Register:

- `generate_design_board_inventory`
- `review_visual_evidence`

- [x] **Step 4: Run tests**

Run:

```powershell
node --test test/visual-evidence.test.js test/stage-gates.test.js
node --test test/mcp.test.js
```

Expected: all pass.

## Task 7: Skill Tree Fusion

**Files:**
- Modify: `C:/Users/ROOT/plugins/full-stack-development/skills/full-stack-development/SKILL.md`
- Modify: `C:/Users/ROOT/plugins/full-stack-development/skills/full-stack-development/references/full-stack-stage-contract.md`
- Create: `C:/Users/ROOT/plugins/full-stack-development/skills/requirement-discovery/SKILL.md`
- Create: `C:/Users/ROOT/plugins/full-stack-development/skills/artifact-contract-manager/SKILL.md`
- Create: `C:/Users/ROOT/plugins/full-stack-development/skills/stage-gate-reviewer/SKILL.md`
- Create: `C:/Users/ROOT/plugins/full-stack-development/skills/change-control/SKILL.md`
- Create: `C:/Users/ROOT/plugins/full-stack-development/skills/implementation-planner/SKILL.md`
- Create: `C:/Users/ROOT/plugins/full-stack-development/skills/completion-verifier/SKILL.md`
- Modify: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/craft.test.js`

**Interfaces:**
- Produces: clear Skill routing and artifact ownership.
- Consumes: stage contract and artifact registry.

- [ ] **Step 1: Write failing tests**

Add tests that read Skill files and assert:

- top-level Skill says this is a general product development plugin.
- `hero-ui-craft` is only frontend layer.
- each new Skill names input artifact, output artifact, hard stops, next gate.
- requirement-discovery says user does not need to provide IA/interactions/states from scratch.

- [ ] **Step 2: Create Skill files**

Each Skill must include:

- trigger description
- input artifacts
- output artifact
- required MCP tool
- hard stops
- pressure test responsibility

- [ ] **Step 3: Run tests**

Run:

```powershell
npm test --prefix C:\Users\ROOT\plugins\full-stack-development\mcp-server
```

## Task 8: MCP Exposure Regression

**Files:**
- Modify: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/mcp.test.js`
- Modify: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/src/index.js`

**Interfaces:**
- Produces: all new tools visible over stdio MCP.
- Consumes: MCP client.

- [ ] **Step 1: Update expected tool list**

Expected new tools:

- `list_artifact_contracts`
- `get_artifact_contract`
- `review_artifact_contract`
- `review_stage_gate`
- `plan_change_impact`
- `mark_artifacts_stale`
- `review_completion_gate`
- `select_development_flow_profile`
- `plan_superpowers_execution_handoff`

- [ ] **Step 2: Add smoke calls**

Call each new tool with a minimal valid fixture and assert `structuredContent.result.status` or expected data exists.

- [ ] **Step 3: Run MCP test**

Run:

```powershell
npm test --prefix C:\Users\ROOT\plugins\full-stack-development\mcp-server -- test/mcp.test.js
```

## Task 9: Plugin Validation And Installed Cache Regression

**Files:**
- Modify: `C:/Users/ROOT/plugins/full-stack-development/.codex-plugin/plugin.json` if version bump is required.
- No source module changes unless tests expose packaging issues.

**Interfaces:**
- Produces: validated local plugin and validated installed cache plugin.
- Consumes: plugin creator validator and Codex plugin cache.

- [ ] **Step 1: Run source tests**

```powershell
npm test --prefix C:\Users\ROOT\plugins\full-stack-development\mcp-server
```

- [ ] **Step 2: Validate plugin**

```powershell
python C:\Users\ROOT\.codex\plugins\cache\openai-bundled\plugin-creator\scripts\validate_plugin.py C:\Users\ROOT\plugins\full-stack-development
```

- [ ] **Step 3: Reinstall personal plugin**

```powershell
codex plugin remove full-stack-development@personal
codex plugin add full-stack-development@personal
```

- [ ] **Step 4: Run installed cache tests**

Find installed version under:

```text
C:\Users\ROOT\.codex\plugins\cache\personal\full-stack-development\
```

Then run:

```powershell
npm test --prefix C:\Users\ROOT\.codex\plugins\cache\personal\full-stack-development\<version>\mcp-server
```

## Task 10: End-To-End Product Development Simulation

**Files:**
- Create: `C:/Users/ROOT/plugins/full-stack-development/mcp-server/test/e2e-product-development-simulation.test.js`

**Interfaces:**
- Produces: one full simulated lifecycle.
- Consumes: all public MCP functions.

- [ ] **Step 1: Write failing simulation**

Scenario:

```text
User: 帮我做一个电商管理后台
Gate: Generate workspace
Gate: Block visual until requirements approved
Change: Add refund review workflow after visual approval
Gate: Regress to product/interaction stage
Gate: Block implementation until visual re-approved
Implementation Review: Block shadcn and hand-written Button
Completion: Block missing screenshot
Completion: Pass after all evidence supplied
```

- [ ] **Step 2: Implement enough wiring**

The simulation should call public functions, not private implementation details.

- [ ] **Step 3: Run e2e test**

```powershell
npm test --prefix C:\Users\ROOT\plugins\full-stack-development\mcp-server -- test/e2e-product-development-simulation.test.js
```

## Self-Review Checklist

- [x] The plan keeps the plugin as a full-process Codex product development plugin.
- [x] HeroUI remains a frontend subsystem, not the top-level product.
- [x] Every P0 capability has a corresponding test task.
- [x] Requirement clarification pressure tests include both over-clarification and under-specification.
- [x] Change requests are tested after downstream progress.
- [x] Completion claims require evidence.
- [x] Installed cache regression is included.
