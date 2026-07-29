function blocker(code, reason, artifact = "05-implementation/implementation-plan.md") {
  return {
    severity: "blocker",
    code,
    artifact,
    reason,
    requiredFix: reason,
    failureRoute: "implementation-planner"
  };
}

export const DEVELOPMENT_FLOW_PROFILES = Object.freeze({
  "strict-fullstack": {
    id: "strict-fullstack",
    label: "Strict Full-Stack",
    useWhen: "Product, UI, backend, API, data, auth, or acceptance contracts may change.",
    requiredStages: [
      "requirement-discovery",
      "product-scope",
      "backend-api-frontend-contract",
      "visual-design",
      "implementation-plan",
      "implementation",
      "verification"
    ],
    requiredGates: [
      "review_requirement_workspace_stage",
      "review_stage_gate",
      "review_visual_evidence when UI applies",
      "review_backend_contract_audit when backend/API applies",
      "review_code_review_gate",
      "review_completion_gate"
    ],
    requiredSkills: [
      "full-stack-development:requirement-discovery",
      "full-stack-development:visual-design-orchestrator",
      "full-stack-development:implementation-planner",
      "full-stack-development:quality-auditor",
      "full-stack-development:completion-verifier"
    ]
  },
  "strict-ui": {
    id: "strict-ui",
    label: "Strict UI",
    useWhen: "React Web UI, HeroUI, visual design, responsive state, or interaction behavior changes without backend/API changes.",
    requiredStages: [
      "requirement-discovery",
      "frontend-hero-ui-contract",
      "visual-design",
      "implementation-plan",
      "implementation",
      "verification"
    ],
    requiredGates: [
      "review_requirement_workspace_stage",
      "review_stage_gate",
      "review_visual_evidence",
      "review_hero_ui_component_graph_audit",
      "review_visual_inspection_metrics",
      "review_completion_gate"
    ],
    requiredSkills: [
      "full-stack-development:hero-ui-craft",
      "full-stack-development:visual-design-orchestrator",
      "full-stack-development:implementation-planner",
      "full-stack-development:quality-auditor"
    ]
  },
  "light-change": {
    id: "light-change",
    label: "Light Change",
    useWhen: "Small copy, docs, config, or narrowly bounded code changes that do not alter product scope, IA, UI, backend, API, data, auth, or acceptance behavior.",
    requiredStages: ["change-record", "targeted-plan", "targeted-implementation", "verification"],
    requiredGates: [
      "plan_requirement_change when requirements changed",
      "targeted tests or explicit no-code verification",
      "review_code_review_gate for code changes",
      "review_completion_gate before completion claims"
    ],
    requiredSkills: [
      "full-stack-development:change-control",
      "full-stack-development:implementation-planner",
      "full-stack-development:completion-verifier"
    ]
  },
  "debug-fix": {
    id: "debug-fix",
    label: "Debug Fix",
    useWhen: "A bug, failed test, broken build, regression, or unexpected behavior needs repair.",
    requiredStages: ["reproduce", "root-cause", "regression-test", "fix", "verification"],
    requiredGates: [
      "root-cause evidence before fix",
      "failing regression test before production fix",
      "targeted tests pass",
      "review_code_review_gate for risky fixes",
      "review_completion_gate before completion claims"
    ],
    requiredSkills: [
      "superpowers:systematic-debugging",
      "superpowers:test-driven-development",
      "superpowers:verification-before-completion",
      "full-stack-development:completion-verifier"
    ]
  }
});

function cloneProfile(profile) {
  return {
    ...profile,
    requiredStages: [...profile.requiredStages],
    requiredGates: [...profile.requiredGates],
    requiredSkills: [...profile.requiredSkills]
  };
}

function hasExactFilePaths(content) {
  const fileLines = String(content)
    .split(/\r?\n/)
    .filter((line) => /^\s*-\s*(Create|Modify|Test):/i.test(line));

  return (
    fileLines.length > 0 &&
    fileLines.every((line) => /`(?:[A-Za-z]:\/|\/|\.\/|[A-Za-z0-9_.-]+\/)[^`]+`/.test(line)) &&
    !fileLines.some((line) => /relevant files|appropriate files|tbd|todo|fill in/i.test(line))
  );
}

function hasDevelopmentFlowProfile(content) {
  return /Flow Profile/i.test(content) && /(strict-fullstack|strict-ui|light-change|debug-fix)/i.test(content);
}

function hasSuperpowersExecutionHandoff(content) {
  return (
    /Superpowers Execution Handoff/i.test(content) &&
    /superpowers:test-driven-development/i.test(content) &&
    /superpowers:subagent-driven-development|superpowers:executing-plans/i.test(content) &&
    /superpowers:requesting-code-review/i.test(content) &&
    /superpowers:verification-before-completion/i.test(content) &&
    /superpowers:finishing-a-development-branch/i.test(content)
  );
}

export function selectDevelopmentFlowProfile(input = {}) {
  const requested = input.requestedProfile ?? input.flowProfile ?? input.profile;
  const normalizedRequested = typeof requested === "string" ? requested.toLowerCase() : undefined;

  if (normalizedRequested && DEVELOPMENT_FLOW_PROFILES[normalizedRequested]) {
    return {
      status: "pass",
      profile: cloneProfile(DEVELOPMENT_FLOW_PROFILES[normalizedRequested]),
      reason: "explicit-profile"
    };
  }

  const issueType = String(input.issueType ?? input.intent ?? "").toLowerCase();
  if (/bug|debug|failure|failed|regression|broken/.test(issueType)) {
    return {
      status: "pass",
      profile: cloneProfile(DEVELOPMENT_FLOW_PROFILES["debug-fix"]),
      reason: "debug-or-failure"
    };
  }

  const changesProductSurface =
    input.product === true ||
    input.ia === true ||
    input.interaction === true ||
    input.state === true ||
    input.visual === true ||
    input.ui === true ||
    input.backend === true ||
    input.api === true ||
    input.data === true ||
    input.auth === true ||
    input.acceptance === true;

  if ((input.smallChange === true || input.changeSize === "small") && !changesProductSurface) {
    return {
      status: "pass",
      profile: cloneProfile(DEVELOPMENT_FLOW_PROFILES["light-change"]),
      reason: "small-non-contract-change"
    };
  }

  if (input.ui === true && input.backend !== true && input.api !== true && input.data !== true) {
    return {
      status: "pass",
      profile: cloneProfile(DEVELOPMENT_FLOW_PROFILES["strict-ui"]),
      reason: "ui-only-contract-change"
    };
  }

  return {
    status: "pass",
    profile: cloneProfile(DEVELOPMENT_FLOW_PROFILES["strict-fullstack"]),
    reason: normalizedRequested ? "unknown-profile-fallback" : "default-full-stack-safety"
  };
}

export function planSuperpowersExecutionHandoff(input = {}) {
  const taskCount = Number.isInteger(input.taskCount) ? input.taskCount : 1;
  const useSubagents = input.allowSubagents !== false && input.independentTasks !== false;
  const executionSkill = useSubagents
    ? "superpowers:subagent-driven-development"
    : "superpowers:executing-plans";

  return {
    status: "pass",
    executionSkill,
    taskCount,
    requiredSkills: [
      "superpowers:test-driven-development",
      executionSkill,
      "superpowers:requesting-code-review",
      "superpowers:verification-before-completion",
      "superpowers:finishing-a-development-branch"
    ],
    requiredArtifacts: [
      "task-brief",
      "task-report",
      "review-package",
      ".superpowers/sdd/progress.md",
      "final-code-review-report",
      "final-acceptance-report"
    ],
    sequence: [
      "Write failing tests before production code.",
      "Extract each implementation task into a task brief.",
      "Dispatch a fresh implementer per independent task when subagents are available.",
      "Create a review package and run task review after each task.",
      "Run a final code review before branch completion.",
      "Run fresh verification before any completion claim.",
      "Use the finishing branch workflow after tests pass."
    ],
    fallback: useSubagents
      ? "Use superpowers:executing-plans only when tasks are tightly coupled or subagents are unavailable."
      : "Subagent execution was not selected; use superpowers:executing-plans with review checkpoints."
  };
}

export function reviewImplementationPlan(input = {}) {
  const content = String(input.content ?? "");
  const blockers = [];

  if (!/Write the failing test/i.test(content) || !/Run test to verify it fails/i.test(content) || !/Expected:\s*FAIL because/i.test(content)) {
    blockers.push(
      blocker(
        "missing-red-test-proof",
        "Implementation plan must include a failing test step, a command to verify it fails, and the expected failure reason."
      )
    );
  }

  if (!hasExactFilePaths(content)) {
    blockers.push(
      blocker(
        "missing-exact-files",
        "Implementation plan must name exact files in `Create`, `Modify`, or `Test` lines."
      )
    );
  }

  if (!/Code Review Gate/i.test(content) || !/(code-review|reviewer|review report)/i.test(content)) {
    blockers.push(
      blocker(
        "missing-code-review-gate",
        "Implementation plan must include a Code Review Gate and require a review report before completion."
      )
    );
  }

  if (!/review_completion_gate/i.test(content)) {
    blockers.push(
      blocker(
        "missing-completion-gate",
        "Implementation plan must call review_completion_gate before any verified or complete claim."
      )
    );
  }

  if (!hasDevelopmentFlowProfile(content)) {
    blockers.push(
      blocker(
        "missing-flow-profile",
        "Implementation plan must declare one development flow profile: strict-fullstack, strict-ui, light-change, or debug-fix."
      )
    );
  }

  if (!hasSuperpowersExecutionHandoff(content)) {
    blockers.push(
      blocker(
        "missing-superpowers-execution-handoff",
        "Implementation plan must include a Superpowers Execution Handoff covering TDD, subagent/executing-plans, code review, verification-before-completion, and finishing branch workflow."
      )
    );
  }

  return {
    status: blockers.length > 0 ? "blocked" : "pass",
    blockers
  };
}

export function generateImplementationPlanScaffold(input = {}) {
  const featureName = input.featureName ?? "Full-Stack Feature";
  const [implementationFile = "C:/repo/src/feature.js", testFile = "C:/repo/test/feature.test.js"] =
    input.files ?? [];
  const flow = selectDevelopmentFlowProfile({
    flowProfile: input.flowProfile,
    ui: input.ui,
    backend: input.backend,
    api: input.api,
    data: input.data,
    auth: input.auth,
    issueType: input.issueType,
    changeSize: input.changeSize,
    smallChange: input.smallChange
  }).profile;
  const handoff = planSuperpowersExecutionHandoff({
    taskCount: 1,
    independentTasks: true,
    allowSubagents: input.allowSubagents
  });
  const constraints = input.constraints?.length
    ? input.constraints.map((constraint) => `- ${constraint}`).join("\n")
    : "- Preserve existing behavior unless the requirement contract says otherwise.";

  const content = `# ${featureName} Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use TDD. Steps use checkbox syntax for tracking.

**Goal:** Implement ${featureName} according to the approved artifact contracts.

**Architecture:** Keep implementation units small, deterministic, and reviewable. Each task must produce independently testable behavior.

**Tech Stack:** Project-local stack.

## Global Constraints

${constraints}

---

## Flow Profile

- Profile: ${flow.id}
- Use when: ${flow.useWhen}
- Required gates:
${flow.requiredGates.map((gate) => `  - ${gate}`).join("\n")}

### Task 1: Contracted Implementation Slice

**Files:**
- Create: \`${implementationFile}\`
- Test: \`${testFile}\`

**Interfaces:**
- Consumes: approved Artifact Registry, Stage Gate report, and requirement contracts.
- Produces: tested implementation and review evidence.

- [ ] **Step 1: Write the failing test**

\`\`\`javascript
test("implements the contracted behavior", () => {
  assert.equal(runContractedBehavior(), "expected");
});
\`\`\`

- [ ] **Step 2: Run test to verify it fails**

Run: \`npm test -- ${testFile}\`
Expected: FAIL because implementation is missing.

- [ ] **Step 3: Write minimal implementation**

Implement only the behavior required by the approved contract.

- [ ] **Step 4: Run test to verify it passes**

Run: \`npm test -- ${testFile}\`
Expected: PASS.

## Code Review Gate

- [ ] Produce a code-review report.
- [ ] Fix all blocking review findings.
- [ ] Record the review report in the feature verification workspace.

## Superpowers Execution Handoff

- [ ] Use \`superpowers:test-driven-development\`: no production code before a failing test is observed.
- [ ] Use \`${handoff.executionSkill}\`: execute task-by-task with isolated task context.
- [ ] Use \`superpowers:requesting-code-review\`: produce task and final code review evidence.
- [ ] Use \`superpowers:verification-before-completion\`: run fresh verification before any success claim.
- [ ] Use \`superpowers:finishing-a-development-branch\`: after tests pass, complete the branch through the structured finish workflow.
- [ ] Maintain execution artifacts: ${handoff.requiredArtifacts.join(", ")}.

## Completion Gate

- [ ] Call \`review_completion_gate\`.
- [ ] Do not claim verified until tests, build, screenshots when UI applies, code review, and final acceptance evidence pass.
`;

  return {
    status: "pass",
    featureName,
    content
  };
}
