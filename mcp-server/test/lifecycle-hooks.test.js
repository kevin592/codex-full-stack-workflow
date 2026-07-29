import assert from "node:assert/strict";
import test from "node:test";

import {
  CORE_LIFECYCLE_STAGES,
  listLifecycleHooks,
  reviewLifecycleHookCoverage,
  runLifecycleHook
} from "../src/lifecycle-hooks.js";

test("lifecycle hook registry covers every core stage with before and after hooks", () => {
  const registry = listLifecycleHooks();

  assert.equal(registry.status, "pass");

  for (const stage of CORE_LIFECYCLE_STAGES) {
    assert.ok(
      registry.hooks.some((hook) => hook.stage === stage && hook.event === "before"),
      `${stage} should have a before hook`
    );
    assert.ok(
      registry.hooks.some((hook) => hook.stage === stage && hook.event === "after"),
      `${stage} should have an after hook`
    );
  }
});

test("lifecycle hook coverage blocks missing stage hooks", () => {
  const review = reviewLifecycleHookCoverage({
    stages: ["rough-intake", "implementation-plan-ready"],
    hooks: [{ stage: "rough-intake", event: "before" }]
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-lifecycle-hook"));
  assert.ok(review.blockers.some((blocker) => blocker.stage === "implementation-plan-ready"));
});

test("lifecycle hook tools normalize common stage aliases", () => {
  const registry = listLifecycleHooks({
    stages: ["requirements", "visual-design"]
  });

  assert.equal(registry.status, "pass");
  assert.deepEqual(registry.stages, ["requirement-discovery", "visual-design-ready"]);
  assert.ok(registry.hooks.some((hook) => hook.id === "before:requirement-discovery"));
  assert.ok(registry.hooks.some((hook) => hook.id === "before:visual-design-ready"));

  const coverage = reviewLifecycleHookCoverage({
    stages: ["requirements", "visual-design"],
    hooks: registry.hooks
  });

  assert.equal(coverage.status, "pass");
});

test("lifecycle hook coverage blocks unknown stage aliases", () => {
  const review = reviewLifecycleHookCoverage({
    stages: ["requirements", "not-a-real-stage"],
    hooks: []
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "unknown-lifecycle-stage"));
});

test("implementation planning before hook blocks missing flow profile and Superpowers handoff", () => {
  const review = runLifecycleHook({
    stage: "implementation-plan-ready",
    event: "before",
    evidence: {
      review_stage_gate: { status: "pass" }
    }
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-flow-profile"));
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-superpowers-execution-handoff"));
});

test("implementation planning before hook passes with required gate evidence", () => {
  const review = runLifecycleHook({
    stage: "implementation-plan-ready",
    event: "before",
    evidence: {
      review_stage_gate: { status: "pass" },
      select_development_flow_profile: { status: "pass" },
      plan_superpowers_execution_handoff: { status: "pass" }
    }
  });

  assert.equal(review.status, "pass");
});

test("verification hook blocks missing completion gate evidence", () => {
  const review = runLifecycleHook({
    stage: "verification-in-progress",
    event: "before",
    evidence: {}
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-completion-hook-evidence"));
});
