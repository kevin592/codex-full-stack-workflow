const REQUIRED_CATEGORIES = ["desktop", "mobile", "component-detail", "state-matrix"];

function blocker(code, reason, failureRoute = "visual-evidence-gate") {
  return {
    severity: "blocker",
    code,
    reason,
    requiredFix: reason,
    failureRoute
  };
}

function featurePath(featureSlug = "front-end-surface") {
  return `docs/full-stack-development/requirements/${featureSlug}`;
}

function approvalComplete(record = {}) {
  if (!record) {
    return false;
  }
  return Boolean(record.approvedBy && record.approvedAt && record.scope);
}

export function planVisualDesignOrchestration(input = {}) {
  const designTool = String(input.designTool ?? "pencil").toLowerCase();
  const featureSlug = input.featureSlug ?? "front-end-surface";
  const root = featurePath(featureSlug);
  const components = input.components?.length ? input.components : ["selected HeroUI components"];
  const surfaces = input.surfaces?.length ? input.surfaces : ["primary workflow"];
  const states = input.states?.length
    ? input.states
    : ["default", "hover", "focus", "disabled", "loading", "empty", "error", "success", "mobile"];

  const common = {
    status: ["pencil", "figma"].includes(designTool) ? "pass" : "blocked",
    designTool,
    featureSlug,
    requiredBeforeStart: [
      {
        tool: "review_requirement_workspace_stage",
        args: { featureSlug, targetStage: "visual-design" },
        passRequired: true
      },
      {
        tool: "generate_design_board_inventory",
        args: { featureName: featureSlug, components, surfaces, states },
        passRequired: true
      }
    ],
    outputArtifact: {
      path: `${root}/04-visual/visual-evidence.md`,
      mustInclude: ["tool", "changeId", "approvalRecord", "exports", "component coverage", "state coverage"]
    },
    finalGates: [
      {
        tool: "review_visual_evidence",
        passRequired: true
      },
      {
        tool: "review_stage_gate",
        args: { targetStage: "implementation" },
        passRequired: true
      }
    ]
  };

  if (common.status === "blocked") {
    return {
      ...common,
      blockers: [blocker("unsupported-design-tool", "designTool must be pencil or figma.")]
    };
  }

  if (designTool === "figma") {
    return {
      ...common,
      requiredSkills: ["figma:figma-use", "figma:figma-create-new-file"],
      toolCallPlan: [
        { order: 1, tool: "figma", action: "load_required_skills", requiredSkills: ["figma:figma-use", "figma:figma-create-new-file"] },
        { order: 2, tool: "figma", action: "create_or_update_file", boards: REQUIRED_CATEGORIES },
        { order: 3, tool: "figma", action: "generate_design", components, surfaces, states },
        { order: 4, tool: "figma", action: "export_images", categories: REQUIRED_CATEGORIES },
        { order: 5, tool: "codex", action: "request_user_approval", evidenceArtifact: `${root}/04-visual/visual-evidence.md` }
      ]
    };
  }

  return {
    ...common,
    requiredSkills: ["pencil"],
    toolCallPlan: [
      { order: 1, tool: "pencil", action: "get_editor_state", args: { include_schema: true } },
      { order: 2, tool: "pencil", action: "batch_design", boards: REQUIRED_CATEGORIES, components, surfaces, states },
      { order: 3, tool: "pencil", action: "snapshot_layout", checks: ["clipping", "overlap", "spacing", "responsive constraints"] },
      { order: 4, tool: "pencil", action: "export_nodes", categories: REQUIRED_CATEGORIES },
      { order: 5, tool: "codex", action: "request_user_approval", evidenceArtifact: `${root}/04-visual/visual-evidence.md` }
    ]
  };
}

export function reviewVisualDesignOrchestration(input = {}) {
  const blockers = [];
  const exported = new Set((input.exportedCategories ?? []).map((category) => String(category).toLowerCase()));

  if (!input.stageGatePassed) {
    blockers.push(blocker("visual-design-stage-gate-not-passed", "Visual design cannot start until the requirement workspace stage gate passes."));
  }

  if (!input.inventoryGenerated) {
    blockers.push(blocker("design-board-inventory-missing", "Run generate_design_board_inventory before design generation."));
  }

  if (!input.designToolReady) {
    blockers.push(blocker("design-tool-not-ready", "Pencil/Figma setup must be ready before design generation."));
  }

  for (const category of REQUIRED_CATEGORIES) {
    if (!exported.has(category)) {
      blockers.push(blocker("missing-orchestration-export", `Missing exported design category: ${category}.`));
    }
  }

  if (!approvalComplete(input.approvalRecord)) {
    blockers.push(blocker("missing-user-approval-record", "Visual design handoff requires approvedBy, approvedAt, and scope."));
  }

  if (input.visualEvidenceReview?.status !== "pass") {
    blockers.push(blocker("visual-evidence-review-not-passed", "review_visual_evidence must pass before implementation."));
  }

  if (input.implementationGate?.status !== "pass") {
    blockers.push(blocker("implementation-gate-not-passed", "review_stage_gate(targetStage='implementation') must pass before implementation."));
  }

  return {
    status: blockers.length > 0 ? "blocked" : "pass",
    nextAllowedStage: blockers.length > 0 ? "visual-design-ready" : "implementation",
    blockers
  };
}
