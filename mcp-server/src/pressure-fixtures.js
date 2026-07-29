const COMPLETE_DISCOVERY = [
  "# Requirement Discovery",
  "",
  "## Confirmed Facts",
  "- The user wants an admin system.",
  "",
  "## AI Assumptions",
  "- The first version manages records, filters, details, and status feedback.",
  "",
  "## Open Questions",
  "- Confirm whether payments are read-only in v1.",
  "",
  "## Out of Scope",
  "- Real payment execution is excluded until confirmed.",
  "",
  "## Downstream Use",
  "- Product scope can derive MVP, P0/P1/P2, and non-goals.",
  "",
  "## PASS Condition",
  "- A downstream agent can create product scope without reading chat."
].join("\n");

const FIXTURES = {
  "rough-admin-one-line": {
    userRequest: "Build an admin dashboard.",
    questionCount: 3,
    hasAgentDraft: true,
    artifactContent: COMPLETE_DISCOVERY
  },
  "over-clarification": {
    userRequest: "Build an admin dashboard.",
    questionCount: 8,
    hasAgentDraft: false,
    artifactContent: ""
  },
  "empty-requirement-discovery": {
    questionCount: 0,
    hasAgentDraft: true,
    artifactContent: "# Requirement Discovery\n\n## Confirmed Facts\n\n## AI Assumptions\n"
  },
  "vague-product-spec": {
    questionCount: 1,
    hasAgentDraft: true,
    artifactContent: "The product should be powerful, advanced, simple, flexible, and high quality."
  },
  "missing-ia-interaction": {
    questionCount: 1,
    hasAgentDraft: true,
    artifactContent: COMPLETE_DISCOVERY,
    downstreamHandoff: {
      artifact: "ia-interaction-state",
      produced: false,
      consumedWithoutChat: false
    }
  }
};

function blocker(code, reason, artifact = "requirement-discovery", failureRoute = "requirement-discovery") {
  return {
    severity: "blocker",
    code,
    artifact,
    reason,
    requiredFix: reason,
    failureRoute
  };
}

function contentHasSections(content) {
  return ["Confirmed Facts", "AI Assumptions", "Open Questions", "Out of Scope", "Downstream Use", "PASS Condition"].every((section) =>
    new RegExp(`^##\\s+${section}`, "im").test(content)
  );
}

function isNonActionable(content) {
  const text = String(content ?? "").toLowerCase();
  const vagueMatches = ["powerful", "advanced", "simple", "flexible", "high quality"].filter((word) => text.includes(word));
  return vagueMatches.length >= 3 && !contentHasSections(content);
}

export function getPressureFixture(name) {
  const fixture = FIXTURES[name];
  if (!fixture) {
    throw new Error(`Unknown pressure fixture: ${name}`);
  }
  return structuredClone(fixture);
}

export function reviewClarificationPressure(input = {}) {
  const blockers = [];
  const questionCount = Number(input.questionCount ?? 0);
  const content = String(input.artifactContent ?? "");

  if (questionCount > 3 && !input.hasAgentDraft) {
    blockers.push(blocker("too-many-questions-without-draft", "Agent must draft assumptions before asking more than three clarification questions."));
  }

  if (!content.trim() || /^#.*\n\s*##/s.test(content) && !contentHasSections(content)) {
    blockers.push(blocker("empty-template", "Requirement artifact is empty or missing required filled sections."));
  }

  if (isNonActionable(content)) {
    blockers.push(blocker("non-actionable-contract", "Requirement artifact is vague and cannot be consumed by the next stage."));
  }

  const downstream = input.downstreamHandoff
    ? {
        ...input.downstreamHandoff,
        status: input.downstreamHandoff.produced && input.downstreamHandoff.consumedWithoutChat ? "pass" : "blocked"
      }
    : undefined;

  if (downstream?.status === "blocked") {
    blockers.push(blocker("downstream-handoff-failed", "Downstream stage could not consume the artifact without chat context.", downstream.artifact));
  }

  return {
    status: blockers.length > 0 ? "blocked" : "pass",
    questionCount,
    downstreamHandoff: downstream,
    blockers
  };
}

