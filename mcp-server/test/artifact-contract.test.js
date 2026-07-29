import assert from "node:assert/strict";
import test from "node:test";

import {
  createArtifactRegistry,
  getArtifactContract,
  listArtifactContracts,
  reviewArtifactContract
} from "../src/contracts.js";

test("artifact registry blocks missing producer consumer pass condition and failure route", () => {
  const registry = createArtifactRegistry({
    featureSlug: "codex-product-development-plugin",
    artifacts: [
      {
        id: "requirement-discovery",
        path: "01-intake/requirement-discovery.md",
        status: "approved"
      }
    ]
  });

  assert.equal(registry.status, "blocked");
  assert.deepEqual(
    registry.issues.map((issue) => issue.code),
    [
      "missing-producer",
      "missing-consumers",
      "missing-required-for-stages",
      "missing-pass-condition",
      "missing-failure-route"
    ]
  );
});

test("empty markdown artifact does not pass contract review", () => {
  const review = reviewArtifactContract({
    contract: {
      id: "requirement-discovery",
      path: "01-intake/requirement-discovery.md",
      producer: "requirement-discovery",
      consumers: ["product-scope-builder"],
      requiredForStages: ["product-scope"],
      status: "ready-for-review",
      passCondition: "All required sections are filled and actionable.",
      failureRoute: "requirement-discovery"
    },
    content: "# Requirement Discovery\n\n## Confirmed Facts\n\n## AI Assumptions\n"
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.issues.some((issue) => issue.code === "empty-template"));
  assert.ok(review.issues.some((issue) => issue.code === "missing-required-section"));
});

test("registered artifact can be listed and fetched by id", () => {
  const registry = createArtifactRegistry({
    featureSlug: "codex-product-development-plugin",
    artifacts: [
      {
        id: "requirement-discovery",
        path: "01-intake/requirement-discovery.md",
        producer: "requirement-discovery",
        consumers: ["product-scope-builder"],
        requiredForStages: ["product-scope"],
        status: "approved",
        passCondition: "Facts, assumptions, questions, out of scope, downstream use, and PASS condition exist.",
        failureRoute: "requirement-discovery"
      }
    ]
  });

  assert.equal(registry.status, "pass");
  assert.equal(listArtifactContracts({ registry }).artifacts.length, 1);
  assert.equal(getArtifactContract({ registry, artifactId: "requirement-discovery" }).artifact.path, "01-intake/requirement-discovery.md");
});

