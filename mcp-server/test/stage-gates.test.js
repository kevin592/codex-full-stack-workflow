import assert from "node:assert/strict";
import test from "node:test";

import { reviewStageGate } from "../src/stage-gates.js";

const approvedRegistry = {
  artifacts: [
    {
      id: "requirement-discovery",
      path: "01-intake/requirement-discovery.md",
      producer: "requirement-discovery",
      consumers: ["product-scope-builder"],
      requiredForStages: ["visual-design"],
      status: "approved",
      passCondition: "Actionable.",
      failureRoute: "requirement-discovery"
    }
  ]
};

test("visual design gate blocks without approved requirements", () => {
  const review = reviewStageGate({
    targetStage: "visual-design",
    stageState: {
      currentStage: "product-spec",
      approvals: { requirementsApproved: false }
    },
    artifactRegistry: approvedRegistry
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "requirements-not-approved"));
});

test("implementation gate blocks without visual approval when UI applies", () => {
  const review = reviewStageGate({
    targetStage: "implementation",
    stageState: {
      currentStage: "visual-design-ready",
      approvals: { requirementsApproved: true, visualDesignApproved: false }
    },
    ui: { applies: true },
    artifactRegistry: approvedRegistry
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "visual-design-not-approved"));
});

test("implementation gate skips visual approval only when uiNotApplicable is explicit", () => {
  const review = reviewStageGate({
    targetStage: "implementation",
    stageState: {
      currentStage: "implementation-plan-ready",
      approvals: { requirementsApproved: true, visualDesignApproved: false }
    },
    ui: { applies: false, reason: "CLI-only plugin capability." },
    artifactRegistry: approvedRegistry
  });

  assert.equal(review.status, "pass");
  assert.equal(review.nextAllowedStage, "implementation");
});

test("implementation gate blocks approved flag without concrete visual evidence", () => {
  const review = reviewStageGate({
    targetStage: "implementation",
    stageState: {
      currentStage: "visual-approved",
      approvals: { requirementsApproved: true, visualDesignApproved: true }
    },
    ui: { applies: true },
    artifactRegistry: approvedRegistry
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-visual-evidence"));
});

test("verification gate blocks missing test build screenshot review evidence", () => {
  const review = reviewStageGate({
    targetStage: "verified",
    stageState: {
      currentStage: "implementation-complete",
      approvals: { requirementsApproved: true, implementationApproved: true }
    },
    ui: { applies: true },
    evidence: {
      tests: true
    },
    artifactRegistry: approvedRegistry
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-build-evidence"));
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-screenshot-evidence"));
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-code-review-evidence"));
});
