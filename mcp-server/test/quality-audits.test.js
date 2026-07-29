import assert from "node:assert/strict";
import test from "node:test";

import {
  reviewBackendContractAudit,
  reviewCodeReviewGate,
  reviewHeroUiComponentGraphAudit,
  reviewHeroUiDocsFreshness,
  reviewVisualInspectionMetrics
} from "../src/quality-audits.js";

test("visual inspection metrics block blank images, high diff, overlap, clipping, and contrast issues", () => {
  const review = reviewVisualInspectionMetrics({
    requiredCategories: ["desktop", "mobile", "component-detail", "state-matrix"],
    screenshots: [
      { category: "desktop", width: 1440, height: 900, nonBlankRatio: 0.97, diffRatio: 0.02 },
      { category: "mobile", width: 390, height: 844, nonBlankRatio: 0.2, diffRatio: 0.01 },
      { category: "component-detail", width: 1200, height: 800, nonBlankRatio: 0.95, diffRatio: 0.12 },
      {
        category: "state-matrix",
        width: 1200,
        height: 800,
        nonBlankRatio: 0.93,
        diffRatio: 0.02,
        overlapCount: 2,
        clippedTextCount: 1,
        contrastViolations: 1
      }
    ]
  });

  const codes = review.blockers.map((blocker) => blocker.code);
  assert.equal(review.status, "blocked");
  assert.ok(codes.includes("blank-or-nearly-blank-screenshot"));
  assert.ok(codes.includes("visual-diff-threshold-exceeded"));
  assert.ok(codes.includes("layout-overlap-detected"));
  assert.ok(codes.includes("text-clipping-detected"));
  assert.ok(codes.includes("contrast-violation-detected"));
});

test("visual inspection metrics pass complete screenshot evidence", () => {
  const review = reviewVisualInspectionMetrics({
    screenshots: [
      { category: "desktop", width: 1440, height: 900, nonBlankRatio: 0.97, diffRatio: 0.02 },
      { category: "mobile", width: 390, height: 844, nonBlankRatio: 0.95, diffRatio: 0.02 },
      { category: "component-detail", width: 1200, height: 800, nonBlankRatio: 0.95, diffRatio: 0.02 },
      { category: "state-matrix", width: 1200, height: 800, nonBlankRatio: 0.95, diffRatio: 0.02 }
    ]
  });

  assert.equal(review.status, "pass");
});

test("HeroUI component graph audit blocks local shadow components and missing official imports", () => {
  const review = reviewHeroUiComponentGraphAudit({
    requiredComponents: ["Button", "Table", "Drawer"],
    files: [
      {
        path: "src/components/Button.tsx",
        content: "export function Button(props){ return <button className=\"bg-blue-600\" {...props}/> }"
      },
      {
        path: "src/App.tsx",
        content:
          'import { Table } from "@heroui/react"; import { Button } from "./components/Button"; export function App(){ return <><Button/><Table/></> }'
      }
    ]
  });

  const codes = review.blockers.map((blocker) => blocker.code);
  assert.equal(review.status, "blocked");
  assert.ok(codes.includes("missing-required-heroui-import"));
  assert.ok(codes.includes("local-shadow-component"));
  assert.ok(codes.includes("raw-tailwind-color-on-ui"));
});

test("backend contract audit blocks missing endpoint, auth, schema, error, and idempotency coverage", () => {
  const review = reviewBackendContractAudit({
    contract: {
      endpoints: [
        {
          method: "POST",
          path: "/api/orders/refund-review",
          requiresAuth: true,
          idempotent: true,
          requestFields: ["orderId", "decision"],
          errorCodes: ["UNAUTHORIZED", "VALIDATION_ERROR"]
        }
      ]
    },
    implementation: {
      endpoints: [
        {
          method: "POST",
          path: "/api/orders/refund-review",
          authChecked: false,
          idempotencyChecked: false,
          requestFields: ["orderId"],
          errorCodes: ["UNAUTHORIZED"]
        }
      ]
    }
  });

  const codes = review.blockers.map((blocker) => blocker.code);
  assert.equal(review.status, "blocked");
  assert.ok(codes.includes("missing-auth-check"));
  assert.ok(codes.includes("missing-idempotency-check"));
  assert.ok(codes.includes("missing-request-field"));
  assert.ok(codes.includes("missing-error-code"));
});

test("code review gate blocks missing review summary and unresolved blocking findings", () => {
  const review = reviewCodeReviewGate({
    changedFiles: ["src/App.tsx", "src/api/orders.ts"],
    review: {
      summary: "",
      findings: [{ severity: "blocker", resolved: false }],
      testsReviewed: false,
      visualReviewed: false,
      backendReviewed: false
    }
  });

  const codes = review.blockers.map((blocker) => blocker.code);
  assert.equal(review.status, "blocked");
  assert.ok(codes.includes("missing-code-review-summary"));
  assert.ok(codes.includes("unresolved-blocking-findings"));
  assert.ok(codes.includes("tests-not-reviewed"));
  assert.ok(codes.includes("visual-not-reviewed"));
  assert.ok(codes.includes("backend-not-reviewed"));
});

test("HeroUI docs freshness blocks stale or incomplete official docs snapshots", () => {
  const oldDate = "2026-01-01T00:00:00.000Z";
  const review = reviewHeroUiDocsFreshness({
    now: "2026-07-07T00:00:00.000Z",
    maxAgeDays: 30,
    manifest: {
      generated: { fetchedAt: oldDate },
      documents: {
        agents: { sha256: "a".repeat(64), bytes: 1000 },
        llms: { sha256: "b".repeat(64), bytes: 1000 }
      }
    }
  });

  const codes = review.blockers.map((blocker) => blocker.code);
  assert.equal(review.status, "blocked");
  assert.ok(codes.includes("official-docs-snapshot-stale"));
  assert.ok(codes.includes("missing-official-doc-entry"));
});
