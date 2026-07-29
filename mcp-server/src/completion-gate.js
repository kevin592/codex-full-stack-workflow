function blocker(code, reason, artifact = "completion-evidence", failureRoute = "verification-in-progress") {
  return {
    severity: "blocker",
    code,
    artifact,
    reason,
    requiredFix: reason,
    failureRoute
  };
}

function evidencePassed(evidence) {
  return Boolean(evidence && evidence.passed === true);
}

export function reviewCompletionGate(input = {}) {
  const evidence = input.evidence ?? {};
  const blockers = [];
  const uiApplies = input.ui?.applies !== false;
  const backendApplies = input.backend?.applies === true;

  if (!input.stageState?.approvals?.requirementsApproved) {
    blockers.push(blocker("requirements-not-approved", "Requirement approval is required before completion."));
  }

  if (!input.stageState?.approvals?.implementationApproved) {
    blockers.push(blocker("implementation-not-approved", "Implementation approval or task ledger completion is required."));
  }

  if (!evidencePassed(evidence.tests)) {
    blockers.push(blocker("missing-test-evidence", "Fresh passing test evidence is required.", "06-verification/test-report.md"));
  }

  if (!evidencePassed(evidence.build)) {
    blockers.push(blocker("missing-build-evidence", "Fresh passing build evidence is required.", "06-verification/build-report.md"));
  }

  if (uiApplies && !(evidence.screenshots?.desktop && evidence.screenshots?.mobile)) {
    blockers.push(
      blocker("missing-screenshot-evidence", "Desktop and mobile screenshots are required for UI work.", "06-verification/browser-screenshot-report.md")
    );
  }

  if (uiApplies && !evidencePassed(evidence.heroUiCompliance)) {
    blockers.push(blocker("missing-heroui-compliance", "HeroUI compliance evidence is required for React Web UI work.", "05-implementation/heroui-compliance.md"));
  }

  if (backendApplies && !evidencePassed(evidence.apiData)) {
    blockers.push(blocker("missing-api-data-evidence", "API/data contract verification is required for backend work.", "06-verification/api-data-report.md"));
  }

  if (!evidence.codeReview || Number(evidence.codeReview.blockingIssues ?? 1) > 0) {
    blockers.push(blocker("missing-code-review-evidence", "Code review report with zero blocking issues is required.", "06-verification/code-review-report.md"));
  }

  if (!evidencePassed(evidence.acceptance)) {
    blockers.push(blocker("missing-final-acceptance", "Final acceptance contract evidence is required.", "06-verification/final-acceptance-report.md"));
  }

  return {
    status: blockers.length > 0 ? "blocked" : "pass",
    currentStage: input.stageState?.currentStage ?? "unknown",
    nextAllowedStage: blockers.length > 0 ? "verification-in-progress" : "verified",
    blockers
  };
}

