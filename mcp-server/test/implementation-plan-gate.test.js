import assert from "node:assert/strict";
import test from "node:test";

import {
  generateImplementationPlanScaffold,
  planSuperpowersExecutionHandoff,
  selectDevelopmentFlowProfile,
  reviewImplementationPlan
} from "../src/implementation-plan.js";

test("implementation plan review blocks plans without failing test proof", () => {
  const review = reviewImplementationPlan({
    content: `
# Feature Implementation Plan

**Goal:** Build the feature.

### Task 1: Add contract module

**Files:**
- Create: \`C:/repo/src/contracts.js\`
- Test: \`C:/repo/test/contracts.test.js\`

- [ ] Implement the module.
- [ ] Run: \`npm test\`
`
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-red-test-proof"));
});

test("implementation plan review blocks plans without exact files", () => {
  const review = reviewImplementationPlan({
    content: `
# Feature Implementation Plan

### Task 1: Add checks

**Files:**
- Modify: relevant files

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
Expected: FAIL because implementation is missing.
- [ ] **Step 3: Implement code**
- [ ] **Step 4: Run test to verify it passes**
`
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-exact-files"));
});

test("implementation plan review blocks plans without code review gate", () => {
  const review = reviewImplementationPlan({
    content: `
# Feature Implementation Plan

### Task 1: Add checks

**Files:**
- Create: \`C:/repo/src/checks.js\`
- Test: \`C:/repo/test/checks.test.js\`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
Expected: FAIL because implementation is missing.
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**
`
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-code-review-gate"));
});

test("implementation plan review blocks plans without Superpowers execution handoff", () => {
  const review = reviewImplementationPlan({
    content: `
# Feature Implementation Plan

## Flow Profile

- Profile: strict-fullstack

### Task 1: Add checks

**Files:**
- Create: \`C:/repo/src/checks.js\`
- Test: \`C:/repo/test/checks.test.js\`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
Expected: FAIL because implementation is missing.
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**

## Code Review Gate

- [ ] Produce a code-review report.

## Completion Gate

- [ ] Call \`review_completion_gate\`.
`
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-superpowers-execution-handoff"));
});

test("implementation plan review blocks plans without a development flow profile", () => {
  const review = reviewImplementationPlan({
    content: `
# Feature Implementation Plan

### Task 1: Add checks

**Files:**
- Create: \`C:/repo/src/checks.js\`
- Test: \`C:/repo/test/checks.test.js\`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
Expected: FAIL because implementation is missing.
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**

## Code Review Gate

- [ ] Produce a code-review report.

## Superpowers Execution Handoff

- [ ] Use \`superpowers:subagent-driven-development\`.
- [ ] Use \`superpowers:requesting-code-review\`.
- [ ] Use \`superpowers:verification-before-completion\`.
- [ ] Use \`superpowers:finishing-a-development-branch\`.

## Completion Gate

- [ ] Call \`review_completion_gate\`.
`
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-flow-profile"));
});

test("implementation scaffold includes TDD, code review, and completion gate requirements", () => {
  const scaffold = generateImplementationPlanScaffold({
    featureName: "Codex Product Development Plugin",
    files: [
      "C:/repo/mcp-server/src/contracts.js",
      "C:/repo/mcp-server/test/contracts.test.js"
    ],
    constraints: ["Keep existing MCP tools backward compatible."],
    flowProfile: "strict-fullstack"
  });

  assert.equal(scaffold.status, "pass");
  assert.match(scaffold.content, /Flow Profile/);
  assert.match(scaffold.content, /strict-fullstack/);
  assert.match(scaffold.content, /Write the failing test/);
  assert.match(scaffold.content, /Expected: FAIL because/);
  assert.match(scaffold.content, /Code Review Gate/);
  assert.match(scaffold.content, /Superpowers Execution Handoff/);
  assert.match(scaffold.content, /superpowers:subagent-driven-development/);
  assert.match(scaffold.content, /superpowers:verification-before-completion/);
  assert.match(scaffold.content, /superpowers:finishing-a-development-branch/);
  assert.match(scaffold.content, /review_completion_gate/);
  assert.equal(reviewImplementationPlan({ content: scaffold.content }).status, "pass");
});

test("Superpowers handoff maps implementation plans to execution skills and evidence artifacts", () => {
  const handoff = planSuperpowersExecutionHandoff({
    taskCount: 3,
    independentTasks: true,
    allowSubagents: true
  });

  assert.equal(handoff.status, "pass");
  assert.equal(handoff.executionSkill, "superpowers:subagent-driven-development");
  assert.ok(handoff.requiredSkills.includes("superpowers:test-driven-development"));
  assert.ok(handoff.requiredSkills.includes("superpowers:requesting-code-review"));
  assert.ok(handoff.requiredSkills.includes("superpowers:verification-before-completion"));
  assert.ok(handoff.requiredSkills.includes("superpowers:finishing-a-development-branch"));
  assert.ok(handoff.requiredArtifacts.includes(".superpowers/sdd/progress.md"));
  assert.ok(handoff.requiredArtifacts.includes("task-brief"));
  assert.ok(handoff.requiredArtifacts.includes("review-package"));
});

test("development flow profile selector supports strict, light, and debug flows", () => {
  assert.equal(
    selectDevelopmentFlowProfile({ ui: true, backend: true }).profile.id,
    "strict-fullstack"
  );
  assert.equal(
    selectDevelopmentFlowProfile({ ui: true, backend: false }).profile.id,
    "strict-ui"
  );
  assert.equal(
    selectDevelopmentFlowProfile({ changeSize: "small", ui: false, backend: false, data: false, api: false }).profile.id,
    "light-change"
  );
  assert.equal(
    selectDevelopmentFlowProfile({ issueType: "bug" }).profile.id,
    "debug-fix"
  );
});
