const REQUIRED_BOARD_CATEGORIES = ["desktop", "mobile", "component-detail", "state-matrix"];

const DEFAULT_REQUIRED_STATES = [
  "default",
  "hover",
  "focus",
  "disabled",
  "loading",
  "empty",
  "error",
  "success",
  "mobile"
];

function blocker(code, reason, artifact = "04-visual/visual-evidence.md", failureRoute = "visual-design-ready") {
  return {
    severity: "blocker",
    code,
    artifact,
    reason,
    requiredFix: reason,
    failureRoute
  };
}

function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function list(value) {
  return Array.isArray(value) ? value.map(normalizeToken).filter(Boolean) : [];
}

function categoryFromPath(path) {
  const text = normalizeToken(path);

  if (/component|detail|parts|anatomy/.test(text)) {
    return "component-detail";
  }

  if (/state|matrix|loading|empty|error|disabled|focus/.test(text)) {
    return "state-matrix";
  }

  if (/mobile|phone|390|375/.test(text)) {
    return "mobile";
  }

  if (/desktop|wide|1440|1280/.test(text)) {
    return "desktop";
  }

  return "unknown";
}

function normalizeCategory(value, path) {
  const category = normalizeToken(value).replaceAll("_", "-");
  if (category === "componentdetail" || category === "component-detail" || category === "component") {
    return "component-detail";
  }
  if (category === "statematrix" || category === "state-matrix" || category === "states") {
    return "state-matrix";
  }
  if (category === "desktop" || category === "mobile") {
    return category;
  }
  return categoryFromPath(path);
}

function normalizeExport(item) {
  if (typeof item === "string") {
    return {
      path: item,
      category: categoryFromPath(item),
      components: [],
      states: []
    };
  }

  const path = item?.path ?? item?.file ?? item?.name ?? "";
  return {
    ...item,
    path,
    category: normalizeCategory(item?.category, path),
    components: list(item?.components),
    states: list(item?.states)
  };
}

function approvalRecordComplete(record = {}) {
  return Boolean(record.approvedBy && record.approvedAt && record.scope);
}

function missingCategories(exports) {
  const present = new Set(exports.map((item) => item.category));
  return REQUIRED_BOARD_CATEGORIES.filter((category) => !present.has(category));
}

function missingCoverage(required, exports, category, field) {
  const requiredSet = new Set(list(required));
  if (requiredSet.size === 0) {
    return [];
  }

  const covered = new Set(
    exports
      .filter((item) => item.category === category)
      .flatMap((item) => list(item[field]))
  );

  return [...requiredSet].filter((item) => !covered.has(item));
}

export function generateDesignBoardInventory(input = {}) {
  const components = input.components?.length ? input.components : ["selected HeroUI components"];
  const surfaces = input.surfaces?.length ? input.surfaces : ["primary workflow"];
  const states = input.states?.length ? input.states : DEFAULT_REQUIRED_STATES;

  return {
    status: "pass",
    featureName: input.featureName ?? "Product Feature",
    toolPolicy: "Use Pencil or Figma after requirement approval and before UI implementation.",
    requiredBoards: [
      {
        category: "desktop",
        title: "Desktop full workflow",
        covers: surfaces,
        passCondition: "Desktop export covers the primary workflow and has explicit user approval."
      },
      {
        category: "mobile",
        title: "Mobile full workflow",
        covers: surfaces,
        passCondition: "Mobile export covers the primary workflow and has explicit user approval."
      },
      {
        category: "component-detail",
        title: "HeroUI component detail sheet",
        covers: components,
        passCondition: "Every important component has visible anatomy, variants, and user approval."
      },
      {
        category: "state-matrix",
        title: "State matrix",
        covers: states,
        passCondition: "Loading, empty, error, disabled, focus, success, and mobile states have user approval."
      }
    ],
    outputContract: {
      requiredApprovalRecord: ["approvedBy", "approvedAt", "scope"],
      requiredExportFields: ["path", "category"],
      categories: REQUIRED_BOARD_CATEGORIES
    }
  };
}

export function reviewVisualEvidence(input = {}) {
  const evidence = input.visualEvidence ?? input.visualConfirmation;
  const stageState = input.stageState ?? {};
  const blockers = [];

  if (!stageState.approvals?.requirementsApproved) {
    blockers.push(blocker("requirements-not-approved", "Requirement approval is required before Pencil/Figma visual evidence can pass."));
  }

  if (!evidence) {
    blockers.push(blocker("missing-visual-evidence", "Provide Pencil/Figma visual evidence before UI implementation."));
    return {
      status: "blocked",
      nextAllowedStage: "visual-design-ready",
      blockers,
      requiredCategories: REQUIRED_BOARD_CATEGORIES
    };
  }

  if (!["pencil", "figma"].includes(normalizeToken(evidence.tool))) {
    blockers.push(blocker("missing-design-tool", "Visual evidence must identify Pencil or Figma as the design source."));
  }

  if (evidence.approved !== true) {
    blockers.push(blocker("visual-not-approved", "Visual exports must be approved by the user before implementation."));
  }

  if (!approvalRecordComplete(evidence.approvalRecord)) {
    blockers.push(blocker("missing-visual-approval-record", "Approval record must include approvedBy, approvedAt, and scope."));
  }

  if (stageState.latestChangeId && evidence.changeId && stageState.latestChangeId !== evidence.changeId) {
    blockers.push(
      blocker(
        "stale-visual-evidence",
        `Visual evidence is for change ${evidence.changeId}, but the current requirement change is ${stageState.latestChangeId}.`
      )
    );
  }

  const exports = (evidence.exports ?? evidence.exportedImages ?? []).map(normalizeExport);
  if (exports.length === 0) {
    blockers.push(blocker("missing-visual-exports", "Visual evidence must include exported Pencil/Figma images."));
  }

  const categories = missingCategories(exports);
  for (const category of categories) {
    blockers.push(blocker("missing-visual-board-category", `Missing required visual board category: ${category}.`));
  }

  const missingComponents = missingCoverage(input.requiredComponents, exports, "component-detail", "components");
  if (missingComponents.length > 0) {
    blockers.push(
      blocker(
        "missing-component-detail-coverage",
        `Component detail sheet does not cover: ${missingComponents.join(", ")}.`
      )
    );
  }

  const requiredStates = input.requiredStates?.length ? input.requiredStates : DEFAULT_REQUIRED_STATES;
  const missingStates = missingCoverage(requiredStates, exports, "state-matrix", "states");
  if (missingStates.length > 0) {
    blockers.push(
      blocker("missing-state-matrix-coverage", `State matrix does not cover: ${missingStates.join(", ")}.`)
    );
  }

  return {
    status: blockers.length > 0 ? "blocked" : "pass",
    nextAllowedStage: blockers.length > 0 ? "visual-design-ready" : "implementation",
    blockers,
    requiredCategories: REQUIRED_BOARD_CATEGORIES,
    normalizedExports: exports
  };
}
