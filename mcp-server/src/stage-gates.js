import { reviewCompletionGate } from "./completion-gate.js";
import { reviewVisualEvidence } from "./visual-evidence.js";

function blocker(code, reason, artifact = "00-stage.json", failureRoute = "stage-gate-reviewer") {
  return {
    severity: "blocker",
    code,
    artifact,
    reason,
    requiredFix: reason,
    failureRoute
  };
}

function requirementsApproved(stageState = {}) {
  return Boolean(stageState.approvals?.requirementsApproved || stageState.currentStage === "visual-design-ready");
}

function visualApproved(stageState = {}) {
  return Boolean(stageState.approvals?.visualDesignApproved || stageState.currentStage === "visual-approved");
}

function uiExplicitlyNotApplicable(input = {}) {
  return input.ui?.applies === false && Boolean(input.ui.reason);
}

function gateBlockers(input = {}) {
  const blockers = [];
  const targetStage = input.targetStage ?? "visual-design";
  const stageState = input.stageState ?? {};

  if (["visual-design", "implementation", "verified"].includes(targetStage) && !requirementsApproved(stageState)) {
    blockers.push(blocker("requirements-not-approved", "Requirements must be approved in 00-stage.json before this stage can proceed."));
  }

  if (targetStage === "implementation" && input.ui?.applies !== false && !visualApproved(stageState)) {
    blockers.push(blocker("visual-design-not-approved", "UI implementation requires approved Pencil/Figma visuals.", "04-visual/visual-confirmation.md", "visual-design-ready"));
  }

  if (targetStage === "implementation" && input.ui?.applies !== false && visualApproved(stageState)) {
    blockers.push(...reviewVisualEvidence(input).blockers);
  }

  if (targetStage === "implementation" && input.ui?.applies === false && !uiExplicitlyNotApplicable(input)) {
    blockers.push(blocker("missing-ui-not-applicable-reason", "Non-UI implementation must explicitly state why UI visual approval is not applicable."));
  }

  if (targetStage === "verified") {
    blockers.push(...reviewCompletionGate(input).blockers);
  }

  return blockers;
}

export function deriveNextAllowedStage(input = {}) {
  const blockers = gateBlockers(input);
  if (blockers.length > 0) {
    return {
      status: "blocked",
      nextAllowedStage: input.stageState?.currentStage ?? "requirements"
    };
  }

  return {
    status: "pass",
    nextAllowedStage: input.targetStage ?? "visual-design"
  };
}

export function reviewStageGate(input = {}) {
  const blockers = gateBlockers(input);
  const targetStage = input.targetStage ?? "visual-design";

  return {
    status: blockers.length > 0 ? "blocked" : "pass",
    currentStage: input.stageState?.currentStage ?? "unknown",
    targetStage,
    nextAllowedStage: blockers.length > 0 ? input.stageState?.currentStage ?? "requirements" : targetStage,
    blockers
  };
}

export function reviewRequirementWorkspaceV2(input = {}) {
  return reviewStageGate(input);
}
