import assert from "node:assert/strict";
import test from "node:test";

import {
  planOssMaintenanceCycle,
  reviewOssReleaseReadiness
} from "../src/oss-maintenance.js";

test("maintenance planner prioritizes unresolved high-severity vulnerabilities", () => {
  const plan = planOssMaintenanceCycle({
    repository: "example/workflow",
    cycle: "v0.1.2",
    signals: {
      highVulnerabilities: 2,
      userFeedbackCount: 1
    }
  });

  assert.equal(plan.status, "planned");
  assert.equal(plan.priorities[0].id, "security");
  assert.match(plan.priorities[0].evidence, /zero unresolved critical or high/i);
});

test("maintenance planner creates an evidence workspace and forbids fabricated adoption", () => {
  const plan = planOssMaintenanceCycle({
    repository: "example/workflow",
    cycle: "August maintenance",
    signals: {
      externalListings: 1
    }
  });

  assert.equal(plan.outputRoot, "docs/oss-maintenance/august-maintenance");
  assert.equal(plan.artifacts.length, 5);
  assert.equal(plan.priorities[0].id, "security-verification");
  assert.ok(plan.integrityRules.some((rule) => /Do not fabricate stars/i.test(rule)));
  assert.ok(plan.priorities.some((priority) => priority.id === "real-user-feedback"));
  assert.ok(plan.priorities.some((priority) => priority.id === "ecosystem-evidence"));
});

test("release readiness treats malformed review counts as blocking", () => {
  const review = reviewOssReleaseReadiness({
    version: "0.1.2",
    repository: {
      name: "example/workflow",
      public: true,
      license: "Apache-2.0"
    },
    change: {
      summary: "Apply a maintenance fix.",
      rationale: "A published advisory affects the dependency lock."
    },
    evidence: {
      tests: { passed: true },
      securityAudit: { passed: true, critical: 0, high: 0 },
      docs: { updated: true },
      changelog: { updated: true },
      pullRequest: {
        url: "not-a-url",
        reviewed: true
      },
      review: { blockingIssues: "unknown" }
    }
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-pr-review"));
  assert.ok(review.blockers.some((blocker) => blocker.code === "blocking-review-findings"));
});

test("release readiness blocks missing tests security docs changelog and review evidence", () => {
  const review = reviewOssReleaseReadiness({
    version: "0.1.2",
    repository: {
      name: "example/workflow",
      public: true,
      license: "Apache-2.0"
    },
    change: {
      summary: "Add a maintainer workflow.",
      rationale: "Maintainers need a reproducible release gate."
    }
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "tests-not-passing"));
  assert.ok(review.blockers.some((blocker) => blocker.code === "security-audit-not-clean"));
  assert.ok(review.blockers.some((blocker) => blocker.code === "docs-not-updated"));
  assert.ok(review.blockers.some((blocker) => blocker.code === "changelog-not-updated"));
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-pr-review"));
});

test("release readiness passes complete source-linked maintenance evidence", () => {
  const review = reviewOssReleaseReadiness({
    version: "0.1.2",
    repository: {
      name: "example/workflow",
      public: true,
      license: "Apache-2.0"
    },
    change: {
      summary: "Add a maintainer workflow and remediate dependency advisories.",
      issueUrl: "https://github.com/example/workflow/issues/12"
    },
    evidence: {
      tests: { passed: true },
      securityAudit: { passed: true, critical: 0, high: 0 },
      docs: { updated: true },
      changelog: { updated: true },
      pullRequest: {
        url: "https://github.com/example/workflow/pull/13",
        reviewed: true
      },
      review: { blockingIssues: 0 }
    }
  });

  assert.equal(review.status, "pass");
  assert.equal(review.nextAllowedAction, "merge-tag-and-publish");
  assert.deepEqual(review.blockers, []);
});
