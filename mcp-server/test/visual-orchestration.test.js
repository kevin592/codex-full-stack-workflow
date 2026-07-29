import assert from "node:assert/strict";
import test from "node:test";

import {
  planVisualDesignOrchestration,
  reviewVisualDesignOrchestration
} from "../src/visual-orchestration.js";

test("planVisualDesignOrchestration creates a one-run Pencil workflow with gates and evidence output", () => {
  const plan = planVisualDesignOrchestration({
    featureSlug: "commerce-risk-console",
    designTool: "pencil",
    components: ["Table", "Drawer", "Button"],
    surfaces: ["orders list", "order detail"]
  });

  assert.equal(plan.status, "pass");
  assert.equal(plan.designTool, "pencil");
  assert.equal(plan.requiredBeforeStart[0].tool, "review_requirement_workspace_stage");
  assert.ok(plan.toolCallPlan.some((step) => step.tool === "pencil" && step.action === "get_editor_state"));
  assert.ok(plan.toolCallPlan.some((step) => step.tool === "pencil" && step.action === "batch_design"));
  assert.ok(plan.toolCallPlan.some((step) => step.tool === "pencil" && step.action === "snapshot_layout"));
  assert.ok(plan.toolCallPlan.some((step) => step.tool === "pencil" && step.action === "export_nodes"));
  assert.equal(plan.outputArtifact.path.endsWith("04-visual/visual-evidence.md"), true);
  assert.ok(plan.finalGates.some((gate) => gate.tool === "review_visual_evidence"));
  assert.ok(plan.finalGates.some((gate) => gate.tool === "review_stage_gate"));
});

test("planVisualDesignOrchestration creates a Figma workflow with required Figma skills", () => {
  const plan = planVisualDesignOrchestration({
    featureSlug: "checkout-flow",
    designTool: "figma",
    components: ["Form", "Input", "Button"]
  });

  assert.equal(plan.status, "pass");
  assert.deepEqual(plan.requiredSkills, ["figma:figma-use", "figma:figma-create-new-file"]);
  assert.ok(plan.toolCallPlan.some((step) => step.tool === "figma" && step.action === "create_or_update_file"));
  assert.ok(plan.toolCallPlan.some((step) => step.tool === "figma" && step.action === "export_images"));
});

test("reviewVisualDesignOrchestration blocks missing exports and approval handoff", () => {
  const review = reviewVisualDesignOrchestration({
    stageGatePassed: true,
    inventoryGenerated: true,
    designToolReady: true,
    exportedCategories: ["desktop"],
    approvalRecord: null,
    visualEvidenceReview: { status: "blocked" },
    implementationGate: { status: "blocked" }
  });

  const codes = review.blockers.map((blocker) => blocker.code);
  assert.equal(review.status, "blocked");
  assert.ok(codes.includes("missing-orchestration-export"));
  assert.ok(codes.includes("missing-user-approval-record"));
  assert.ok(codes.includes("visual-evidence-review-not-passed"));
  assert.ok(codes.includes("implementation-gate-not-passed"));
});

test("reviewVisualDesignOrchestration passes complete visual handoff", () => {
  const review = reviewVisualDesignOrchestration({
    stageGatePassed: true,
    inventoryGenerated: true,
    designToolReady: true,
    exportedCategories: ["desktop", "mobile", "component-detail", "state-matrix"],
    approvalRecord: {
      approvedBy: "user",
      approvedAt: "2026-07-07T13:00:00+08:00",
      scope: "commerce risk console"
    },
    visualEvidenceReview: { status: "pass" },
    implementationGate: { status: "pass" }
  });

  assert.equal(review.status, "pass");
  assert.equal(review.nextAllowedStage, "implementation");
});
