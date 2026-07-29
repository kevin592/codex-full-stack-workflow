import assert from "node:assert/strict";
import test from "node:test";

import { generateRequirementWorkspace, reviewHeroUiQuality } from "../src/craft.js";
import { planChangeImpact } from "../src/change-control.js";
import { reviewCompletionGate } from "../src/completion-gate.js";
import { reviewStageGate } from "../src/stage-gates.js";

test("simulates rough request to change regression to HeroUI and completion gates", () => {
  const workspace = generateRequirementWorkspace({
    featureName: "Ecommerce Admin",
    userRequest: "Build an ecommerce admin dashboard."
  });

  assert.equal(workspace.fixedRoot, "docs/full-stack-development/requirements/ecommerce-admin");

  const blockedVisual = reviewStageGate({
    targetStage: "visual-design",
    stageState: {
      currentStage: "requirement-discovery",
      approvals: { requirementsApproved: false }
    }
  });
  assert.equal(blockedVisual.status, "blocked");
  assert.ok(blockedVisual.blockers.some((blocker) => blocker.code === "requirements-not-approved"));

  const change = planChangeImpact({
    currentStage: "visual-approved",
    changeRequest: "Add refund review action in the order table and detail drawer workflow."
  });
  assert.equal(change.resetToStage, "ia-interaction-state");

  const blockedImplementation = reviewStageGate({
    targetStage: "implementation",
    stageState: {
      currentStage: "ia-interaction-state",
      approvals: { requirementsApproved: true, visualDesignApproved: false }
    },
    ui: { applies: true }
  });
  assert.equal(blockedImplementation.status, "blocked");
  assert.ok(blockedImplementation.blockers.some((blocker) => blocker.code === "visual-design-not-approved"));

  const staleVisualImplementation = reviewStageGate({
    targetStage: "implementation",
    stageState: {
      currentStage: "visual-approved",
      latestChangeId: "0002",
      approvals: { requirementsApproved: true, visualDesignApproved: true }
    },
    ui: { applies: true },
    visualEvidence: {
      tool: "figma",
      changeId: "0001",
      approved: true,
      approvalRecord: {
        approvedBy: "user",
        approvedAt: "2026-07-07T10:00:00+08:00",
        scope: "initial ecommerce admin design"
      },
      exports: [
        { path: "desktop.png", category: "desktop" },
        { path: "mobile.png", category: "mobile" },
        { path: "component-detail.png", category: "component-detail", components: ["Table", "Drawer", "Button"] },
        {
          path: "state-matrix.png",
          category: "state-matrix",
          states: ["default", "hover", "focus", "disabled", "loading", "empty", "error", "success", "mobile"]
        }
      ]
    }
  });
  assert.equal(staleVisualImplementation.status, "blocked");
  assert.ok(staleVisualImplementation.blockers.some((blocker) => blocker.code === "stale-visual-evidence"));

  const allowedImplementation = reviewStageGate({
    targetStage: "implementation",
    stageState: {
      currentStage: "visual-approved",
      latestChangeId: "0002",
      approvals: { requirementsApproved: true, visualDesignApproved: true }
    },
    ui: { applies: true },
    visualEvidence: {
      tool: "figma",
      changeId: "0002",
      approved: true,
      approvalRecord: {
        approvedBy: "user",
        approvedAt: "2026-07-07T11:00:00+08:00",
        scope: "refund review workflow updated design"
      },
      exports: [
        { path: "desktop-refund-review.png", category: "desktop" },
        { path: "mobile-refund-review.png", category: "mobile" },
        { path: "component-detail-refund-review.png", category: "component-detail", components: ["Table", "Drawer", "Button"] },
        {
          path: "state-matrix-refund-review.png",
          category: "state-matrix",
          states: ["default", "hover", "focus", "disabled", "loading", "empty", "error", "success", "mobile"]
        }
      ]
    }
  });
  assert.equal(allowedImplementation.status, "pass");

  const heroUiReview = reviewHeroUiQuality({
    code: `
      import { Button } from "@/components/ui/button";
      import { cva } from "class-variance-authority";
      const buttonVariants = cva("inline-flex px-3 py-2");
    `,
    css: '@import "tailwindcss";\n@import "@heroui/styles";',
    visualConfirmation: {
      approved: true,
      exportedImages: ["desktop.png", "mobile.png", "component-detail.png", "state-matrix.png"]
    }
  });
  assert.ok(heroUiReview.issues.some((issue) => issue.code === "shadcn-import"));
  assert.ok(heroUiReview.issues.some((issue) => issue.code === "handwritten-ui-official-available"));

  const blockedCompletion = reviewCompletionGate({
    stageState: {
      currentStage: "implementation-complete",
      approvals: { requirementsApproved: true, implementationApproved: true }
    },
    ui: { applies: true },
    evidence: {
      tests: { passed: true },
      build: { passed: true },
      heroUiCompliance: { passed: true },
      codeReview: { blockingIssues: 0 },
      acceptance: { passed: true }
    }
  });
  assert.ok(blockedCompletion.blockers.some((blocker) => blocker.code === "missing-screenshot-evidence"));

  const passedCompletion = reviewCompletionGate({
    stageState: {
      currentStage: "implementation-complete",
      approvals: { requirementsApproved: true, implementationApproved: true }
    },
    ui: { applies: true },
    evidence: {
      tests: { passed: true },
      build: { passed: true },
      screenshots: { desktop: true, mobile: true, stateMatrix: true },
      heroUiCompliance: { passed: true },
      codeReview: { blockingIssues: 0 },
      acceptance: { passed: true }
    }
  });
  assert.equal(passedCompletion.status, "pass");
  assert.equal(passedCompletion.nextAllowedStage, "verified");
});
