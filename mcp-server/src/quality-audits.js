const DEFAULT_VISUAL_CATEGORIES = ["desktop", "mobile", "component-detail", "state-matrix"];
const REQUIRED_DOCS = ["agents", "llms", "components", "patterns", "full"];
const OFFICIAL_HEROUI_COMPONENTS = [
  "Accordion",
  "Alert",
  "Avatar",
  "Badge",
  "Breadcrumbs",
  "Button",
  "Card",
  "Checkbox",
  "ComboBox",
  "Drawer",
  "Form",
  "Input",
  "Link",
  "Modal",
  "Pagination",
  "Popover",
  "Select",
  "Skeleton",
  "Spinner",
  "Switch",
  "Table",
  "Tabs",
  "TextArea",
  "Toast",
  "Tooltip"
];

function blocker(code, reason, artifact = "quality-audit", failureRoute = "quality-auditor") {
  return {
    severity: "blocker",
    code,
    artifact,
    reason,
    requiredFix: reason,
    failureRoute
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value) {
  return String(value ?? "").toLowerCase();
}

function importedHeroUiComponents(files = []) {
  const imported = new Set();
  for (const file of files) {
    const content = String(file.content ?? "");
    const importMatches = content.matchAll(/import\s+\{([^}]+)\}\s+from\s+["']@heroui\/react["']/g);
    for (const match of importMatches) {
      for (const name of match[1].split(",")) {
        imported.add(name.trim().replace(/\s+as\s+.+$/i, ""));
      }
    }
  }
  return imported;
}

function localShadowComponents(files = []) {
  const shadows = [];
  for (const file of files) {
    const content = String(file.content ?? "");
    for (const component of OFFICIAL_HEROUI_COMPONENTS) {
      const declaration = new RegExp(`(?:export\\s+)?function\\s+${component}\\s*\\(|(?:export\\s+)?const\\s+${component}\\s*=`, "m");
      if (declaration.test(content) && !content.includes("@heroui/react")) {
        shadows.push({ component, path: file.path });
      }
    }
  }
  return shadows;
}

export function reviewVisualInspectionMetrics(input = {}) {
  const screenshots = asArray(input.screenshots);
  const required = input.requiredCategories?.length ? input.requiredCategories : DEFAULT_VISUAL_CATEGORIES;
  const blockers = [];
  const byCategory = new Map(screenshots.map((shot) => [normalize(shot.category), shot]));
  const minNonBlankRatio = Number(input.minNonBlankRatio ?? 0.75);
  const maxDiffRatio = Number(input.maxDiffRatio ?? 0.08);

  for (const category of required) {
    if (!byCategory.has(normalize(category))) {
      blockers.push(blocker("missing-visual-inspection-category", `Missing visual inspection category: ${category}.`));
    }
  }

  for (const shot of screenshots) {
    const label = shot.category ?? shot.path ?? "screenshot";
    if (!shot.width || !shot.height) {
      blockers.push(blocker("missing-screenshot-dimensions", `${label} is missing width or height.`));
    }
    if (Number(shot.nonBlankRatio ?? 0) < minNonBlankRatio) {
      blockers.push(blocker("blank-or-nearly-blank-screenshot", `${label} appears blank or nearly blank.`));
    }
    if (Number(shot.diffRatio ?? 0) > maxDiffRatio) {
      blockers.push(blocker("visual-diff-threshold-exceeded", `${label} exceeds visual diff threshold.`));
    }
    if (Number(shot.overlapCount ?? 0) > 0) {
      blockers.push(blocker("layout-overlap-detected", `${label} has overlapping UI elements.`));
    }
    if (Number(shot.clippedTextCount ?? 0) > 0) {
      blockers.push(blocker("text-clipping-detected", `${label} has clipped text.`));
    }
    if (Number(shot.contrastViolations ?? 0) > 0) {
      blockers.push(blocker("contrast-violation-detected", `${label} has contrast violations.`));
    }
  }

  return {
    status: blockers.length > 0 ? "blocked" : "pass",
    nextAllowedStage: blockers.length > 0 ? "verification-in-progress" : "verified",
    blockers
  };
}

export function reviewHeroUiComponentGraphAudit(input = {}) {
  const files = asArray(input.files);
  const required = input.requiredComponents?.length ? input.requiredComponents : [];
  const imported = importedHeroUiComponents(files);
  const blockers = [];
  const shadows = localShadowComponents(files);

  for (const component of required) {
    if (!imported.has(component)) {
      blockers.push(blocker("missing-required-heroui-import", `Required HeroUI component is not imported from @heroui/react: ${component}.`));
    }
  }

  for (const shadow of shadows) {
    blockers.push(blocker("local-shadow-component", `Local component shadows official HeroUI ${shadow.component}.`, shadow.path));
  }

  if (files.some((file) => /\b(?:bg|text|border|ring)-(?:slate|gray|zinc|red|orange|amber|blue|indigo|purple|pink|rose|emerald)-\d{2,3}\b/.test(file.content ?? ""))) {
    blockers.push(blocker("raw-tailwind-color-on-ui", "Raw Tailwind color utilities found in UI component graph."));
  }

  return {
    status: blockers.length > 0 ? "blocked" : "pass",
    importedHeroUiComponents: [...imported],
    localShadowComponents: shadows,
    blockers
  };
}

function endpointKey(endpoint) {
  return `${String(endpoint.method ?? "GET").toUpperCase()} ${endpoint.path ?? ""}`;
}

export function reviewBackendContractAudit(input = {}) {
  const contractEndpoints = asArray(input.contract?.endpoints);
  const implementedEndpoints = new Map(asArray(input.implementation?.endpoints).map((endpoint) => [endpointKey(endpoint), endpoint]));
  const blockers = [];

  for (const endpoint of contractEndpoints) {
    const key = endpointKey(endpoint);
    const implementation = implementedEndpoints.get(key);
    if (!implementation) {
      blockers.push(blocker("missing-endpoint-implementation", `Missing implementation for ${key}.`, "backend-api-contract"));
      continue;
    }

    if (endpoint.requiresAuth && !implementation.authChecked) {
      blockers.push(blocker("missing-auth-check", `${key} requires auth but implementation does not prove auth check.`, key));
    }

    if (endpoint.idempotent && !implementation.idempotencyChecked) {
      blockers.push(blocker("missing-idempotency-check", `${key} requires idempotency but implementation does not prove it.`, key));
    }

    const implementedFields = new Set(asArray(implementation.requestFields));
    for (const field of asArray(endpoint.requestFields)) {
      if (!implementedFields.has(field)) {
        blockers.push(blocker("missing-request-field", `${key} is missing request field validation: ${field}.`, key));
      }
    }

    const implementedErrors = new Set(asArray(implementation.errorCodes));
    for (const code of asArray(endpoint.errorCodes)) {
      if (!implementedErrors.has(code)) {
        blockers.push(blocker("missing-error-code", `${key} is missing error code: ${code}.`, key));
      }
    }
  }

  return {
    status: blockers.length > 0 ? "blocked" : "pass",
    blockers
  };
}

export function reviewCodeReviewGate(input = {}) {
  const review = input.review ?? {};
  const blockers = [];
  const findings = asArray(review.findings);
  const changedFiles = asArray(input.changedFiles);
  const hasUi = changedFiles.some((file) => /\.(tsx|jsx|css)$/.test(file));
  const hasBackend = changedFiles.some((file) => /api|route|server|db|schema|migration/i.test(file));

  if (!String(review.summary ?? "").trim()) {
    blockers.push(blocker("missing-code-review-summary", "Code review summary is required."));
  }

  if (findings.some((finding) => ["blocker", "critical", "high"].includes(normalize(finding.severity)) && !finding.resolved)) {
    blockers.push(blocker("unresolved-blocking-findings", "All blocker/high code review findings must be resolved."));
  }

  if (!review.testsReviewed) {
    blockers.push(blocker("tests-not-reviewed", "Code review must confirm tests were reviewed."));
  }

  if (hasUi && !review.visualReviewed) {
    blockers.push(blocker("visual-not-reviewed", "UI changes require visual review confirmation."));
  }

  if (hasBackend && !review.backendReviewed) {
    blockers.push(blocker("backend-not-reviewed", "Backend/API/data changes require backend review confirmation."));
  }

  return {
    status: blockers.length > 0 ? "blocked" : "pass",
    blockingIssues: blockers.length,
    blockers
  };
}

export function reviewHeroUiDocsFreshness(input = {}) {
  const manifest = input.manifest ?? {};
  const documents = manifest.documents ?? {};
  const now = new Date(input.now ?? Date.now());
  const fetchedAt = new Date(manifest.generated?.fetchedAt ?? manifest.generatedAt ?? 0);
  const maxAgeDays = Number(input.maxAgeDays ?? 30);
  const blockers = [];

  if (!Number.isFinite(fetchedAt.getTime()) || fetchedAt.getTime() === 0) {
    blockers.push(blocker("missing-docs-generated-at", "Official HeroUI docs manifest must include generated.fetchedAt."));
  } else {
    const ageDays = (now.getTime() - fetchedAt.getTime()) / 86_400_000;
    if (ageDays > maxAgeDays) {
      blockers.push(blocker("official-docs-snapshot-stale", `Official HeroUI docs snapshot is ${Math.floor(ageDays)} days old.`));
    }
  }

  for (const doc of REQUIRED_DOCS) {
    const entry = documents[doc];
    if (!entry || !/^[a-f0-9]{64}$/i.test(entry.sha256 ?? "") || Number(entry.bytes ?? 0) <= 100) {
      blockers.push(blocker("missing-official-doc-entry", `Official HeroUI docs manifest is missing or has invalid entry: ${doc}.`));
    }
  }

  return {
    status: blockers.length > 0 ? "blocked" : "pass",
    blockers
  };
}
