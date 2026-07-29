export const CORE_LIFECYCLE_STAGES = Object.freeze([
  "rough-intake",
  "requirement-discovery",
  "product-scope",
  "product-spec",
  "ia-interaction-state",
  "backend-api-frontend-contract",
  "visual-requirements",
  "visual-design-ready",
  "visual-design-in-progress",
  "visual-approved",
  "implementation-plan-ready",
  "implementation-in-progress",
  "implementation-complete",
  "verification-in-progress",
  "verified",
  "released"
]);

const STAGE_REQUIREMENTS = Object.freeze({
  "rough-intake": {
    before: [],
    after: ["generate_requirement_workspace"]
  },
  "requirement-discovery": {
    before: ["generate_requirement_workspace"],
    after: ["review_artifact_contract"]
  },
  "product-scope": {
    before: ["review_artifact_contract"],
    after: ["review_stage_gate"]
  },
  "product-spec": {
    before: ["review_stage_gate"],
    after: ["review_artifact_contract"]
  },
  "ia-interaction-state": {
    before: ["review_artifact_contract"],
    after: ["review_stage_gate"]
  },
  "backend-api-frontend-contract": {
    before: ["review_artifact_contract"],
    after: ["review_stage_gate"]
  },
  "visual-requirements": {
    before: ["review_requirement_workspace_stage"],
    after: ["review_stage_gate"]
  },
  "visual-design-ready": {
    before: [
      "review_requirement_workspace_stage",
      "plan_visual_design_orchestration",
      "generate_design_board_inventory"
    ],
    after: ["review_stage_gate"]
  },
  "visual-design-in-progress": {
    before: ["review_stage_gate"],
    after: ["review_visual_design_orchestration"]
  },
  "visual-approved": {
    before: ["review_visual_design_orchestration", "review_visual_evidence"],
    after: ["review_stage_gate"]
  },
  "implementation-plan-ready": {
    before: [
      "review_stage_gate",
      "select_development_flow_profile",
      "plan_superpowers_execution_handoff"
    ],
    after: ["review_implementation_plan"]
  },
  "implementation-in-progress": {
    before: ["review_implementation_plan", "plan_superpowers_execution_handoff"],
    after: ["review_code_review_gate"]
  },
  "implementation-complete": {
    before: ["review_code_review_gate"],
    after: ["review_completion_gate"]
  },
  "verification-in-progress": {
    before: ["review_completion_gate"],
    after: ["review_stage_gate"]
  },
  verified: {
    before: ["review_completion_gate"],
    after: ["review_stage_gate"]
  },
  released: {
    before: ["review_stage_gate"],
    after: []
  }
});

const SPECIAL_BLOCKER_CODES = Object.freeze({
  select_development_flow_profile: "missing-flow-profile",
  plan_superpowers_execution_handoff: "missing-superpowers-execution-handoff",
  review_completion_gate: "missing-completion-hook-evidence"
});

const STAGE_ALIASES = Object.freeze({
  requirements: "requirement-discovery",
  "requirement-discovery-stage": "requirement-discovery",
  design: "visual-design-ready",
  "visual-design": "visual-design-ready",
  "pencil-figma": "visual-design-ready",
  implementation: "implementation-plan-ready",
  verification: "verification-in-progress",
  release: "released"
});

function hookId(stage, event) {
  return `${event}:${stage}`;
}

function normalizeStageName(stage) {
  const value = String(stage ?? "").trim();
  return STAGE_ALIASES[value] ?? value;
}

function requestedStages(input = {}) {
  const requested = input.stages?.length ? input.stages : CORE_LIFECYCLE_STAGES;
  const stages = [];
  const unknownStages = [];

  for (const stage of requested) {
    const normalized = normalizeStageName(stage);
    if (!STAGE_REQUIREMENTS[normalized]) {
      unknownStages.push(stage);
      continue;
    }

    if (!stages.includes(normalized)) {
      stages.push(normalized);
    }
  }

  return {
    requested,
    stages,
    unknownStages
  };
}

function unknownStageBlocker(stage) {
  return {
    severity: "blocker",
    code: "unknown-lifecycle-stage",
    stage,
    artifact: "mcp-server/src/lifecycle-hooks.js",
    reason: `Lifecycle stage ${stage} is not registered and could not be normalized.`,
    requiredFix: "Use a core lifecycle stage or a supported stage alias.",
    failureRoute: "lifecycle-hook-registry"
  };
}

function normalizeEvidence(evidence = {}) {
  if (Array.isArray(evidence)) {
    return Object.fromEntries(
      evidence
        .filter((item) => item?.tool)
        .map((item) => [item.tool, item.result ?? { status: item.status }])
    );
  }

  return evidence;
}

function toolPassed(tool, evidence = {}) {
  const result = evidence[tool];
  if (result === true) {
    return true;
  }

  if (typeof result === "string") {
    return result === "pass";
  }

  return result?.status === "pass" || result?.structuredContent?.result?.status === "pass";
}

function missingToolBlocker(tool, stage, event) {
  return {
    severity: "blocker",
    code: SPECIAL_BLOCKER_CODES[tool] ?? `missing-${tool.replaceAll("_", "-")}-hook-evidence`,
    stage,
    event,
    hookId: hookId(stage, event),
    tool,
    artifact: "00-stage.json",
    reason: `${tool} must pass before the ${event} hook for ${stage} can pass.`,
    requiredFix: `Run ${tool}, record its pass result in hook evidence, then rerun this lifecycle hook.`,
    failureRoute: stage
  };
}

function hookRecord(stage, event) {
  const requiredTools = STAGE_REQUIREMENTS[stage]?.[event];
  if (!requiredTools) {
    return undefined;
  }

  return {
    id: hookId(stage, event),
    stage,
    event,
    requiredTools: [...requiredTools],
    evidencePolicy: requiredTools.length > 0 ? "all-required-tools-pass" : "no-tool-evidence-required",
    failureRoute: stage
  };
}

export function listLifecycleHooks(input = {}) {
  const { requested, stages, unknownStages } = requestedStages(input);
  const hooks = [];

  for (const stage of stages) {
    for (const event of ["before", "after"]) {
      const hook = hookRecord(stage, event);
      if (hook) {
        hooks.push(hook);
      }
    }
  }

  return {
    status: unknownStages.length > 0 ? "blocked" : "pass",
    schemaVersion: "full-stack-development.lifecycle-hooks.v0.1.0",
    requestedStages: [...requested],
    stages: [...stages],
    aliases: STAGE_ALIASES,
    hooks,
    blockers: unknownStages.map(unknownStageBlocker)
  };
}

export function reviewLifecycleHookCoverage(input = {}) {
  const { stages, unknownStages } = requestedStages(input);
  const provided = input.hooks ?? listLifecycleHooks({ stages }).hooks;
  const providedIds = new Set(
    provided.map((hook) => hook.id ?? hookId(hook.stage, hook.event))
  );
  const blockers = [];

  for (const stage of unknownStages) {
    blockers.push(unknownStageBlocker(stage));
  }

  for (const stage of stages) {
    for (const event of ["before", "after"]) {
      const id = hookId(stage, event);
      if (!providedIds.has(id)) {
        blockers.push({
          severity: "blocker",
          code: "missing-lifecycle-hook",
          stage,
          event,
          hookId: id,
          artifact: "mcp-server/src/lifecycle-hooks.js",
          reason: `Stage ${stage} is missing its ${event} lifecycle hook.`,
          requiredFix: `Add lifecycle hook ${id} to the hook registry and document its required gate evidence.`,
          failureRoute: "lifecycle-hook-registry"
        });
      }
    }
  }

  return {
    status: blockers.length > 0 ? "blocked" : "pass",
    blockers
  };
}

export function runLifecycleHook(input = {}) {
  const stage = input.stage ?? input.currentStage;
  const event = input.event ?? "before";
  const hook = hookRecord(stage, event);

  if (!hook) {
    return {
      status: "blocked",
      blockers: [
        {
          severity: "blocker",
          code: "unknown-lifecycle-hook",
          stage,
          event,
          hookId: hookId(stage ?? "unknown", event),
          artifact: "mcp-server/src/lifecycle-hooks.js",
          reason: "The requested lifecycle hook is not registered.",
          requiredFix: "Use a registered stage and event or add the hook to the lifecycle registry.",
          failureRoute: "lifecycle-hook-registry"
        }
      ]
    };
  }

  const evidence = normalizeEvidence(input.evidence ?? input.toolResults ?? {});
  const blockers = hook.requiredTools
    .filter((tool) => !toolPassed(tool, evidence))
    .map((tool) => missingToolBlocker(tool, stage, event));

  return {
    status: blockers.length > 0 ? "blocked" : "pass",
    hook,
    blockers,
    nextActions:
      blockers.length > 0
        ? blockers.map((blocker) => blocker.requiredFix)
        : [`${hook.id} passed; continue to the next allowed stage only if the stage gate also passes.`]
  };
}
