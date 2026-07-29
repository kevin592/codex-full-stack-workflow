import assert from "node:assert/strict";
import test from "node:test";

import { reviewCompletionGate } from "../src/completion-gate.js";

const baseInput = {
  stageState: {
    currentStage: "implementation-complete",
    approvals: {
      requirementsApproved: true,
      implementationApproved: true
    }
  },
  ui: { applies: true },
  backend: { applies: true }
};

test("completion gate blocks missing fresh test report", () => {
  const review = reviewCompletionGate({
    ...baseInput,
    evidence: {
      build: { passed: true },
      screenshots: { desktop: true, mobile: true },
      codeReview: { blockingIssues: 0 },
      acceptance: { passed: true }
    }
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-test-evidence"));
});

test("completion gate blocks missing build report", () => {
  const review = reviewCompletionGate({
    ...baseInput,
    evidence: {
      tests: { passed: true },
      screenshots: { desktop: true, mobile: true },
      codeReview: { blockingIssues: 0 },
      acceptance: { passed: true }
    }
  });

  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-build-evidence"));
});

test("ui completion blocks missing desktop and mobile screenshots", () => {
  const review = reviewCompletionGate({
    ...baseInput,
    evidence: {
      tests: { passed: true },
      build: { passed: true },
      codeReview: { blockingIssues: 0 },
      acceptance: { passed: true }
    }
  });

  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-screenshot-evidence"));
});

test("completion gate passes when all required evidence exists", () => {
  const review = reviewCompletionGate({
    ...baseInput,
    evidence: {
      tests: { passed: true, fresh: true },
      build: { passed: true, fresh: true },
      screenshots: { desktop: true, mobile: true, stateMatrix: true },
      heroUiCompliance: { passed: true },
      apiData: { passed: true },
      codeReview: { blockingIssues: 0 },
      acceptance: { passed: true }
    }
  });

  assert.equal(review.status, "pass");
  assert.equal(review.nextAllowedStage, "verified");
});

