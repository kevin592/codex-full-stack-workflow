import assert from "node:assert/strict";
import test from "node:test";

import { generateChangeRecord, markArtifactsStale, planChangeImpact } from "../src/change-control.js";

const registry = {
  artifacts: [
    { id: "product-spec", path: "02-product/product-spec.md", status: "approved" },
    { id: "information-architecture", path: "03-architecture/information-architecture.md", status: "approved" },
    { id: "api-contract", path: "03-architecture/api-contract.md", status: "approved" },
    { id: "visual-confirmation", path: "04-visual/visual-confirmation.md", status: "approved" },
    { id: "implementation-plan", path: "05-implementation/implementation-plan.md", status: "approved" }
  ]
};

test("new user role regresses to product-scope and invalidates visual approval", () => {
  const impact = planChangeImpact({
    currentStage: "visual-approved",
    changeRequest: "Add a finance reviewer user role with read-only refund access.",
    artifactRegistry: registry
  });

  assert.equal(impact.status, "blocked");
  assert.equal(impact.resetToStage, "product-scope");
  assert.ok(impact.invalidatedApprovals.includes("visualDesignApproved"));
});

test("new data field regresses to ia-interaction-state and stales frontend artifacts", () => {
  const impact = planChangeImpact({
    currentStage: "implementation-in-progress",
    changeRequest: "Add order risk score field to the table, detail drawer, filters, and empty state copy.",
    artifactRegistry: registry
  });

  assert.equal(impact.resetToStage, "ia-interaction-state");
  assert.ok(impact.staleArtifacts.includes("information-architecture"));
  assert.ok(impact.staleArtifacts.includes("visual-confirmation"));
});

test("api permission change regresses to backend-api-frontend-contract", () => {
  const impact = planChangeImpact({
    currentStage: "implementation-in-progress",
    changeRequest: "Change API auth so refund approval requires manager permission and idempotency key.",
    artifactRegistry: registry
  });

  assert.equal(impact.resetToStage, "backend-api-frontend-contract");
  assert.ok(impact.staleArtifacts.includes("api-contract"));
});

test("verified feature with changed acceptance regresses to verification-in-progress", () => {
  const impact = planChangeImpact({
    currentStage: "verified",
    changeRequest: "Change acceptance command to include e2e screenshots and a11y scan.",
    artifactRegistry: registry
  });

  assert.equal(impact.resetToStage, "verification-in-progress");
});

test("markArtifactsStale updates selected registry entries and generateChangeRecord records regression", () => {
  const marked = markArtifactsStale({
    registry,
    artifactIds: ["api-contract", "implementation-plan"]
  });
  const statuses = Object.fromEntries(marked.registry.artifacts.map((artifact) => [artifact.id, artifact.status]));

  assert.equal(statuses["api-contract"], "stale");
  assert.equal(statuses["implementation-plan"], "stale");

  const record = generateChangeRecord({
    changeId: "0002",
    changeRequest: "Change API permissions.",
    impact: {
      resetToStage: "backend-api-frontend-contract",
      staleArtifacts: ["api-contract"],
      invalidatedApprovals: ["implementationApproved"]
    }
  });

  assert.match(record.content, /Change Request 0002/);
  assert.match(record.content, /backend-api-frontend-contract/);
});

