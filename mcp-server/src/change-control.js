const CHANGE_RULES = [
  {
    stage: "requirement-discovery",
    keys: ["business", "goal", "metric", "success", "revenue", "risk policy"],
    staleArtifacts: ["requirement-discovery", "product-spec", "acceptance-contract"]
  },
  {
    stage: "product-scope",
    keys: ["role", "user", "scope", "p0", "p1", "p2", "mvp"],
    staleArtifacts: ["product-spec", "information-architecture", "visual-confirmation", "implementation-plan"]
  },
  {
    stage: "ia-interaction-state",
    keys: ["field", "table", "drawer", "filter", "button", "action", "state", "empty", "navigation", "page"],
    staleArtifacts: ["information-architecture", "visual-confirmation", "implementation-plan"]
  },
  {
    stage: "backend-api-frontend-contract",
    keys: ["api", "auth", "permission", "idempotency", "schema", "migration", "endpoint", "database"],
    staleArtifacts: ["api-contract", "implementation-plan", "acceptance-contract"]
  },
  {
    stage: "visual-requirements",
    keys: ["visual", "density", "component", "layout", "theme", "spacing", "color"],
    staleArtifacts: ["visual-confirmation", "implementation-plan"]
  },
  {
    stage: "visual-design-ready",
    keys: ["design", "mockup", "figma", "pencil", "screenshot"],
    staleArtifacts: ["visual-confirmation", "implementation-plan"]
  },
  {
    stage: "implementation-plan-ready",
    keys: ["implemented", "code", "behavior", "logic"],
    staleArtifacts: ["implementation-plan", "code-review-report"]
  },
  {
    stage: "verification-in-progress",
    keys: ["acceptance", "test command", "e2e", "a11y", "verified"],
    staleArtifacts: ["acceptance-contract", "final-acceptance-report"]
  }
];

const STAGE_PRIORITY = [
  "requirement-discovery",
  "product-scope",
  "ia-interaction-state",
  "backend-api-frontend-contract",
  "visual-requirements",
  "visual-design-ready",
  "implementation-plan-ready",
  "verification-in-progress"
];

function includesAny(text, keys) {
  return keys.some((key) => text.includes(key));
}

function earliestStage(matches) {
  return matches
    .map((match) => match.stage)
    .sort((left, right) => STAGE_PRIORITY.indexOf(left) - STAGE_PRIORITY.indexOf(right))[0];
}

function invalidatedApprovalsFor(stage) {
  const approvals = [];
  if (STAGE_PRIORITY.indexOf(stage) <= STAGE_PRIORITY.indexOf("visual-requirements")) {
    approvals.push("requirementsApproved", "visualDesignApproved", "implementationApproved", "finalAcceptanceApproved");
  } else if (stage === "visual-design-ready") {
    approvals.push("visualDesignApproved", "implementationApproved", "finalAcceptanceApproved");
  } else if (stage === "implementation-plan-ready") {
    approvals.push("implementationApproved", "finalAcceptanceApproved");
  } else {
    approvals.push("finalAcceptanceApproved");
  }
  return [...new Set(approvals)];
}

export function planChangeImpact(input = {}) {
  const text = String(input.changeRequest ?? "").toLowerCase();
  const acceptanceOnly =
    /(acceptance|test command|e2e|a11y|verified|final acceptance)/.test(text) &&
    !/(role|scope|field|table|drawer|filter|button|action|api|auth|permission|schema|migration|visual|density|component|layout|theme|design|mockup|figma|pencil)/.test(text);
  const matches = acceptanceOnly
    ? CHANGE_RULES.filter((rule) => rule.stage === "verification-in-progress")
    : CHANGE_RULES.filter((rule) => includesAny(text, rule.keys));
  const effectiveMatches = matches.length > 0 ? matches : [CHANGE_RULES[1]];
  const resetToStage = earliestStage(effectiveMatches);
  const staleArtifacts = [...new Set(effectiveMatches.flatMap((match) => match.staleArtifacts))];

  return {
    status: "blocked",
    changeRequest: input.changeRequest ?? "",
    currentStage: input.currentStage ?? "unknown",
    resetToStage,
    impactedStages: effectiveMatches.map((match) => match.stage),
    staleArtifacts,
    invalidatedApprovals: invalidatedApprovalsFor(resetToStage),
    requiredActions: [
      "write a change record under changes/",
      "mark impacted artifacts stale",
      "invalidate downstream approvals",
      `regress 00-stage.json to ${resetToStage}`,
      "re-run the relevant stage gate before design or implementation continues"
    ]
  };
}

export function markArtifactsStale(input = {}) {
  const ids = new Set(input.artifactIds ?? input.staleArtifacts ?? []);
  const registry = {
    ...(input.registry ?? {}),
    artifacts: (input.registry?.artifacts ?? []).map((artifact) =>
      ids.has(artifact.id) || ids.has(artifact.path)
        ? {
            ...artifact,
            status: "stale"
          }
        : artifact
    )
  };

  return {
    status: "pass",
    registry,
    staleArtifacts: [...ids]
  };
}

export function generateChangeRecord(input = {}) {
  const id = input.changeId ?? "0001";
  const impact = input.impact ?? planChangeImpact(input);
  const content = [
    `# Change Request ${id}`,
    "",
    "## User Request",
    "",
    input.changeRequest ?? "",
    "",
    "## Impacted Artifacts",
    "",
    ...(impact.staleArtifacts ?? []).map((artifact) => `- ${artifact}`),
    "",
    "## Invalidated Approvals",
    "",
    ...(impact.invalidatedApprovals ?? []).map((approval) => `- ${approval}`),
    "",
    "## Stage Regression",
    "",
    impact.resetToStage ?? "unknown",
    "",
    "## Required Re-verification",
    "",
    "- Re-run the relevant stage gate.",
    "- Re-approve stale downstream artifacts before continuing."
  ].join("\n");

  return {
    status: "pass",
    changeId: id,
    resetToStage: impact.resetToStage,
    content
  };
}
