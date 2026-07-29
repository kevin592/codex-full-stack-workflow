import assert from "node:assert/strict";
import test from "node:test";

import { generateDesignBoardInventory, reviewVisualEvidence } from "../src/visual-evidence.js";

test("design board inventory requires desktop mobile component detail and state matrix boards", () => {
  const inventory = generateDesignBoardInventory({
    featureName: "Commerce Admin",
    components: ["Table", "Drawer", "Button"],
    surfaces: ["orders-list", "order-detail"],
    states: ["loading", "empty", "error", "disabled", "focus"]
  });

  assert.equal(inventory.status, "pass");
  assert.deepEqual(
    inventory.requiredBoards.map((board) => board.category),
    ["desktop", "mobile", "component-detail", "state-matrix"]
  );
  assert.ok(inventory.requiredBoards.every((board) => board.passCondition.includes("user approval")));
});

test("visual evidence blocks desktop-only exports before implementation", () => {
  const review = reviewVisualEvidence({
    requiredComponents: ["Table", "Drawer", "Button"],
    visualEvidence: {
      tool: "figma",
      changeId: "0001",
      approved: true,
      approvalRecord: {
        approvedBy: "user",
        approvedAt: "2026-07-07T10:00:00+08:00",
        scope: "initial ecommerce admin visual design"
      },
      exports: [{ path: "desktop-orders.png", category: "desktop" }]
    },
    stageState: {
      approvals: { requirementsApproved: true },
      latestChangeId: "0001"
    }
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "missing-visual-board-category"));
});

test("visual evidence blocks component detail sheets that omit required components or states", () => {
  const review = reviewVisualEvidence({
    requiredComponents: ["Table", "Drawer", "Button"],
    requiredStates: ["loading", "empty", "error", "disabled", "focus"],
    visualEvidence: {
      tool: "pencil",
      changeId: "0001",
      approved: true,
      approvalRecord: {
        approvedBy: "user",
        approvedAt: "2026-07-07T10:00:00+08:00",
        scope: "initial ecommerce admin visual design"
      },
      exports: [
        { path: "desktop-orders.png", category: "desktop" },
        { path: "mobile-orders.png", category: "mobile" },
        { path: "components.png", category: "component-detail", components: ["Table"] },
        { path: "states.png", category: "state-matrix", states: ["loading", "empty"] }
      ]
    },
    stageState: {
      approvals: { requirementsApproved: true },
      latestChangeId: "0001"
    }
  });

  const codes = review.blockers.map((blocker) => blocker.code);
  assert.ok(codes.includes("missing-component-detail-coverage"));
  assert.ok(codes.includes("missing-state-matrix-coverage"));
});

test("visual evidence is stale after requirement change id moves forward", () => {
  const review = reviewVisualEvidence({
    requiredComponents: ["Table"],
    visualEvidence: {
      tool: "figma",
      changeId: "0001",
      approved: true,
      approvalRecord: {
        approvedBy: "user",
        approvedAt: "2026-07-07T10:00:00+08:00",
        scope: "initial ecommerce admin visual design"
      },
      exports: [
        { path: "desktop.png", category: "desktop" },
        { path: "mobile.png", category: "mobile" },
        { path: "component-detail.png", category: "component-detail", components: ["Table"] },
        {
          path: "state-matrix.png",
          category: "state-matrix",
          states: ["default", "hover", "focus", "disabled", "loading", "empty", "error", "success", "mobile"]
        }
      ]
    },
    stageState: {
      approvals: { requirementsApproved: true },
      latestChangeId: "0002"
    }
  });

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "stale-visual-evidence"));
});

test("visual evidence passes only with approved complete current design exports", () => {
  const review = reviewVisualEvidence({
    requiredComponents: ["Table", "Drawer", "Button"],
    requiredStates: ["loading", "empty", "error", "disabled", "focus"],
    visualEvidence: {
      tool: "figma",
      changeId: "0003",
      approved: true,
      approvalRecord: {
        approvedBy: "user",
        approvedAt: "2026-07-07T10:00:00+08:00",
        scope: "refund review workflow v3"
      },
      exports: [
        { path: "desktop-orders.png", category: "desktop" },
        { path: "mobile-orders.png", category: "mobile" },
        { path: "component-detail.png", category: "component-detail", components: ["Table", "Drawer", "Button"] },
        { path: "state-matrix.png", category: "state-matrix", states: ["loading", "empty", "error", "disabled", "focus"] }
      ]
    },
    stageState: {
      approvals: { requirementsApproved: true },
      latestChangeId: "0003"
    }
  });

  assert.equal(review.status, "pass");
  assert.equal(review.nextAllowedStage, "implementation");
});
