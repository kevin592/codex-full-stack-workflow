const REQUIRED_CONTRACT_FIELDS = [
  "id",
  "path",
  "producer",
  "consumers",
  "requiredForStages",
  "status",
  "passCondition",
  "failureRoute"
];

const VALID_STATUSES = new Set(["missing", "draft", "ready-for-review", "approved", "stale", "blocked"]);

const REQUIRED_ARTIFACT_SECTIONS = [
  "Confirmed Facts",
  "AI Assumptions",
  "Open Questions",
  "Out of Scope",
  "Downstream Use",
  "PASS Condition"
];

function blocker(code, reason, artifact = "artifact-registry", failureRoute = "artifact-contract-manager") {
  return {
    severity: "blocker",
    code,
    artifact,
    reason,
    requiredFix: reason,
    failureRoute
  };
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function hasArrayValue(value) {
  return Array.isArray(value) && value.length > 0;
}

function validateContractShape(contract = {}) {
  const issues = [];

  for (const field of REQUIRED_CONTRACT_FIELDS) {
    if ((field === "consumers" || field === "requiredForStages") && !hasArrayValue(contract[field])) {
      issues.push(blocker(`missing-${field.replaceAll(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`, `${field} is required.`, contract.id ?? "unknown"));
      continue;
    }

    if (field !== "consumers" && field !== "requiredForStages" && isBlank(contract[field])) {
      const code = field === "passCondition" ? "missing-pass-condition" : field === "failureRoute" ? "missing-failure-route" : `missing-${field}`;
      issues.push(blocker(code, `${field} is required.`, contract.id ?? "unknown"));
    }
  }

  if (contract.status && !VALID_STATUSES.has(contract.status)) {
    issues.push(blocker("invalid-artifact-status", `status must be one of ${[...VALID_STATUSES].join(", ")}.`, contract.id ?? "unknown"));
  }

  return issues;
}

function meaningfulLines(content) {
  return String(content ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"))
    .filter((line) => !/^[-*]\s*$/.test(line))
    .filter((line) => !/^(tbd|todo|placeholder|fill in|n\/a)$/i.test(line));
}

function sectionHasBody(content, section) {
  const lines = String(content ?? "").split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^#{1,6}\\s+${section}\\s*$`, "i").test(line.trim()));
  if (start === -1) {
    return false;
  }

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (/^#{1,6}\s+/.test(line)) {
      return false;
    }
    if (line && !/^(tbd|todo|placeholder|fill in|[-*]\s*)$/i.test(line)) {
      return true;
    }
  }

  return false;
}

function contentIssues(contract = {}, content = "") {
  const issues = [];
  const lines = meaningfulLines(content);

  if (lines.length === 0) {
    issues.push(blocker("empty-template", "Artifact content is only headings, blank sections, or placeholders.", contract.id));
  }

  for (const section of REQUIRED_ARTIFACT_SECTIONS) {
    if (!sectionHasBody(content, section)) {
      issues.push(blocker("missing-required-section", `Required section "${section}" is missing or empty.`, contract.id));
    }
  }

  return issues;
}

export function createArtifactRegistry(input = {}) {
  const artifacts = Array.isArray(input.artifacts) ? input.artifacts : [];
  const issues = [];

  for (const artifact of artifacts) {
    issues.push(...validateContractShape(artifact));
  }

  return {
    schemaVersion: input.schemaVersion ?? "full-stack-development.artifact-registry.v0.2.0",
    featureSlug: input.featureSlug ?? "unknown-feature",
    status: issues.length > 0 ? "blocked" : "pass",
    artifacts,
    issues,
    requiredFields: REQUIRED_CONTRACT_FIELDS,
    validStatuses: [...VALID_STATUSES]
  };
}

export function listArtifactContracts(input = {}) {
  const registry = input.registry ?? createArtifactRegistry(input);
  return {
    status: registry.status ?? "pass",
    featureSlug: registry.featureSlug,
    artifacts: registry.artifacts ?? [],
    issues: registry.issues ?? []
  };
}

export function getArtifactContract(input = {}) {
  const registry = input.registry ?? createArtifactRegistry(input);
  const artifact = (registry.artifacts ?? []).find((candidate) => candidate.id === input.artifactId || candidate.path === input.path);

  if (!artifact) {
    return {
      status: "blocked",
      artifact: null,
      issues: [blocker("artifact-not-found", `Artifact ${input.artifactId ?? input.path ?? ""} was not found.`)]
    };
  }

  return {
    status: "pass",
    artifact,
    issues: []
  };
}

export function reviewArtifactContract(input = {}) {
  const contract = input.contract ?? input.artifact ?? {};
  const shapeIssues = validateContractShape(contract);
  const bodyIssues = contentIssues(contract, input.content ?? "");
  const issues = [...shapeIssues, ...bodyIssues];

  return {
    status: issues.length > 0 ? "blocked" : "pass",
    artifact: contract.id ?? contract.path ?? "unknown-artifact",
    issues
  };
}

export function isArtifactApproved(artifact) {
  return artifact?.status === "approved";
}

