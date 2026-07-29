#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  generateFrontendVerificationChecklist,
  generateRequirementArtifactTemplates,
  generateRequirementWorkspace,
  getHeroUiAgentDoc,
  listHeroUiAgentDocs,
  planRequirementChange,
  planFrontendRequirementPipeline,
  planHeroUiSystem,
  planVisualConfirmation,
  reviewFrontendRequirementContract,
  reviewRequirementWorkspaceStage,
  reviewHeroUiQuality,
  selectHeroUiComponents
} from "./craft.js";
import {
  getArtifactContract,
  listArtifactContracts,
  reviewArtifactContract
} from "./contracts.js";
import { markArtifactsStale, planChangeImpact } from "./change-control.js";
import { reviewCompletionGate } from "./completion-gate.js";
import {
  generateImplementationPlanScaffold,
  planSuperpowersExecutionHandoff,
  selectDevelopmentFlowProfile,
  reviewImplementationPlan
} from "./implementation-plan.js";
import {
  listLifecycleHooks,
  reviewLifecycleHookCoverage,
  runLifecycleHook
} from "./lifecycle-hooks.js";
import { reviewStageGate } from "./stage-gates.js";
import { inspectTailwindUiReference, planTailwindHeroUiAdoption } from "./tailwind-reference.js";
import { generateDesignBoardInventory, reviewVisualEvidence } from "./visual-evidence.js";
import {
  planVisualDesignOrchestration,
  reviewVisualDesignOrchestration
} from "./visual-orchestration.js";
import {
  reviewBackendContractAudit,
  reviewCodeReviewGate,
  reviewHeroUiComponentGraphAudit,
  reviewHeroUiDocsFreshness,
  reviewVisualInspectionMetrics
} from "./quality-audits.js";

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};

function jsonResult(summary, result) {
  return {
    content: [
      {
        type: "text",
        text: summary
      }
    ],
    structuredContent: {
      result
    }
  };
}

const server = new McpServer({
  name: "full-stack-development",
  version: "0.1.0"
});

server.registerTool(
  "review_visual_inspection_metrics",
  {
    title: "Review Visual Inspection Metrics",
    description:
      "Use this after screenshot or image analysis to block blank screenshots, high diff, overlap, clipping, and contrast issues.",
    inputSchema: {
      requiredCategories: z.array(z.string()).optional(),
      screenshots: z.array(z.any()).optional(),
      minNonBlankRatio: z.number().optional(),
      maxDiffRatio: z.number().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Reviewed visual inspection metrics.", reviewVisualInspectionMetrics(args))
);

server.registerTool(
  "review_hero_ui_component_graph_audit",
  {
    title: "Review HeroUI Component Graph Audit",
    description:
      "Use this to audit changed TSX/JSX files for official HeroUI imports, local shadow components, and raw Tailwind color drift.",
    inputSchema: {
      requiredComponents: z.array(z.string()).optional(),
      files: z.array(z.any()).optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Reviewed the HeroUI component graph audit.", reviewHeroUiComponentGraphAudit(args))
);

server.registerTool(
  "review_backend_contract_audit",
  {
    title: "Review Backend Contract Audit",
    description:
      "Use this to audit backend/API implementation coverage against endpoint contracts, auth, schema fields, errors, and idempotency.",
    inputSchema: {
      contract: z.any().optional(),
      implementation: z.any().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Reviewed backend/API contract coverage.", reviewBackendContractAudit(args))
);

server.registerTool(
  "review_code_review_gate",
  {
    title: "Review Code Review Gate",
    description:
      "Use this before completion to verify code review summary, unresolved findings, test review, UI review, and backend review evidence.",
    inputSchema: {
      changedFiles: z.array(z.string()).optional(),
      review: z.any().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Reviewed code review gate evidence.", reviewCodeReviewGate(args))
);

server.registerTool(
  "review_hero_ui_docs_freshness",
  {
    title: "Review HeroUI Docs Freshness",
    description:
      "Use this to block stale or incomplete bundled official HeroUI AGENTS.md and llms documentation snapshots.",
    inputSchema: {
      manifest: z.any().optional(),
      now: z.string().optional(),
      maxAgeDays: z.number().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Reviewed official HeroUI docs freshness.", reviewHeroUiDocsFreshness(args))
);

server.registerTool(
  "inspect_tailwind_ui_reference",
  {
    title: "Inspect TailwindUI Reference",
    description:
      "Use this to inspect a local TailwindUI v4.1 reference folder without copying or bundling its source code.",
    inputSchema: {
      root: z.string().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Inspected the local TailwindUI reference library.", inspectTailwindUiReference(args))
);

server.registerTool(
  "plan_tailwind_hero_ui_adoption",
  {
    title: "Plan TailwindUI to HeroUI Adoption",
    description:
      "Use this to translate TailwindUI/Catalyst visual references into HeroUI official component and Tailwind v4 rules without copying source.",
    inputSchema: {
      patterns: z.array(z.string()).optional(),
      target: z.string().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult("Planned a reference-only TailwindUI to HeroUI adoption path.", planTailwindHeroUiAdoption(args))
);

server.registerTool(
  "plan_visual_design_orchestration",
  {
    title: "Plan Visual Design Orchestration",
    description:
      "Use this to produce a one-run Pencil/Figma workflow from requirement gate to exported visual evidence and implementation gate.",
    inputSchema: {
      featureSlug: z.string().optional(),
      designTool: z.enum(["pencil", "figma"]).optional(),
      components: z.array(z.string()).optional(),
      surfaces: z.array(z.string()).optional(),
      states: z.array(z.string()).optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult("Planned the Pencil/Figma visual design orchestration.", planVisualDesignOrchestration(args))
);

server.registerTool(
  "review_visual_design_orchestration",
  {
    title: "Review Visual Design Orchestration",
    description:
      "Use this to verify the Pencil/Figma orchestration produced complete exports, approval, visual evidence review, and implementation gate pass.",
    inputSchema: {
      stageGatePassed: z.boolean().optional(),
      inventoryGenerated: z.boolean().optional(),
      designToolReady: z.boolean().optional(),
      exportedCategories: z.array(z.string()).optional(),
      approvalRecord: z.any().optional(),
      visualEvidenceReview: z.any().optional(),
      implementationGate: z.any().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult("Reviewed the Pencil/Figma orchestration evidence.", reviewVisualDesignOrchestration(args))
);

server.registerTool(
  "generate_design_board_inventory",
  {
    title: "Generate Design Board Inventory",
    description:
      "Use this before Pencil/Figma work to define the desktop, mobile, component-detail, and state-matrix boards required for user approval.",
    inputSchema: {
      featureName: z.string().optional(),
      components: z.array(z.string()).optional(),
      surfaces: z.array(z.string()).optional(),
      states: z.array(z.string()).optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult("Generated the required Pencil/Figma design board inventory.", generateDesignBoardInventory(args))
);

server.registerTool(
  "plan_frontend_requirement_pipeline",
  {
    title: "Plan Frontend Requirement Pipeline",
    description:
      "Use this before visual design or implementation to plan the full requirement contract from clarification to Pencil/Figma approval.",
    inputSchema: {
      idea: z.string().optional(),
      productType: z.string().optional(),
      audience: z.string().optional(),
      primaryWorkflow: z.string().optional(),
      outputDir: z.string().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult(
      "Planned the layered frontend requirement pipeline before HeroUI visual design.",
      planFrontendRequirementPipeline(args)
    )
);

server.registerTool(
  "generate_requirement_artifact_templates",
  {
    title: "Generate Requirement Artifact Templates",
    description:
      "Use this to generate the required markdown artifact templates before Pencil/Figma visual design.",
    inputSchema: {
      featureName: z.string().optional(),
      outputDir: z.string().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult(
      "Generated the frontend requirement contract templates.",
      generateRequirementArtifactTemplates(args)
    )
);

server.registerTool(
  "generate_requirement_workspace",
  {
    title: "Generate Requirement Workspace",
    description:
      "Use this to create the fixed project requirement workspace from a rough user request before Pencil/Figma or implementation.",
    inputSchema: {
      featureName: z.string().optional(),
      featureSlug: z.string().optional(),
      userRequest: z.string().optional(),
      idea: z.string().optional(),
      projectRoot: z.string().optional(),
      outputRoot: z.string().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult(
      "Generated the fixed HeroUI requirement workspace file set.",
      generateRequirementWorkspace(args)
    )
);

server.registerTool(
  "review_frontend_requirement_contract",
  {
    title: "Review Frontend Requirement Contract",
    description:
      "Use this to block visual design or implementation when required frontend requirement artifacts are missing or incomplete.",
    inputSchema: {
      targetStage: z.enum(["visual-design", "implementation"]).default("visual-design"),
      artifacts: z
        .array(
          z.object({
            file: z.string().optional(),
            path: z.string().optional(),
            name: z.string().optional(),
            content: z.string().optional()
          })
        )
        .optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult(
      "Reviewed the frontend requirement contract gate.",
      reviewFrontendRequirementContract(args)
    )
);

server.registerTool(
  "review_requirement_workspace_stage",
  {
    title: "Review Requirement Workspace Stage",
    description:
      "Use this to block Pencil/Figma or implementation unless the fixed requirement workspace and stage gate are complete.",
    inputSchema: {
      featureName: z.string().optional(),
      featureSlug: z.string().optional(),
      outputRoot: z.string().optional(),
      targetStage: z.enum(["visual-design", "implementation"]).default("visual-design"),
      files: z
        .array(
          z.object({
            file: z.string().optional(),
            path: z.string().optional(),
            name: z.string().optional(),
            content: z.string().optional()
          })
        )
        .optional(),
      artifacts: z
        .array(
          z.object({
            file: z.string().optional(),
            path: z.string().optional(),
            name: z.string().optional(),
            content: z.string().optional()
          })
        )
        .optional(),
      visualConfirmation: z
        .object({
          approved: z.boolean().optional(),
          exportedImages: z.array(z.string()).optional()
        })
        .optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult(
      "Reviewed the fixed HeroUI requirement workspace stage gate.",
      reviewRequirementWorkspaceStage(args)
    )
);

server.registerTool(
  "plan_requirement_change",
  {
    title: "Plan Requirement Change",
    description:
      "Use this when a user changes or upgrades requirements to record the change, identify impacted artifacts, and regress the stage safely.",
    inputSchema: {
      featureName: z.string().optional(),
      featureSlug: z.string().optional(),
      outputRoot: z.string().optional(),
      currentStage: z.string().optional(),
      changeRequest: z.string().optional(),
      impactedLayers: z.array(z.string()).optional(),
      changeNumber: z.number().int().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult(
      "Planned the requirement change record and stage regression.",
      planRequirementChange(args)
    )
);

server.registerTool(
  "plan_hero_ui_system",
  {
    title: "Plan HeroUI System",
    description:
      "Use this before front-end implementation to plan a HeroUI React v3 workflow with official docs, MCP, and visual approval gates.",
    inputSchema: {
      productType: z.string().optional(),
      audience: z.string().optional(),
      primaryWorkflow: z.string().optional(),
      constraints: z.array(z.string()).optional(),
      targetSurfaces: z.array(z.string()).optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult("Generated a HeroUI React v3 implementation direction.", planHeroUiSystem(args))
);

server.registerTool(
  "list_hero_ui_agent_docs",
  {
    title: "List HeroUI Agent Docs",
    description:
      "Use this to list the bundled official HeroUI React v3 AGENTS.md and LLM documentation snapshots.",
    inputSchema: {},
    annotations: READ_ONLY_ANNOTATIONS
  },
  async () =>
    jsonResult("Listed bundled official HeroUI React v3 agent documentation.", listHeroUiAgentDocs())
);

server.registerTool(
  "get_hero_ui_agent_doc",
  {
    title: "Get HeroUI Agent Doc",
    description:
      "Use this to read a bundled official HeroUI React v3 agent documentation file. Read doc='agents' first.",
    inputSchema: {
      doc: z.enum(["agents", "llms", "components", "patterns", "full"]).default("agents")
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult("Read bundled official HeroUI React v3 agent documentation.", getHeroUiAgentDoc(args))
);

server.registerTool(
  "select_hero_ui_components",
  {
    title: "Select HeroUI Components",
    description:
      "Use this to map product needs to official HeroUI React v3 components and composition guardrails.",
    inputSchema: {
      needs: z.array(z.string()).min(1)
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult("Selected official HeroUI React v3 components for the requested needs.", selectHeroUiComponents(args))
);

server.registerTool(
  "plan_visual_confirmation",
  {
    title: "Plan Visual Confirmation",
    description:
      "Use this before coding to define the required Pencil or Figma component-detail images and user approval gate.",
    inputSchema: {
      components: z.array(z.string()).optional(),
      targetSurfaces: z.array(z.string()).optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult("Planned the Pencil/Figma visual approval gate.", planVisualConfirmation(args))
);

server.registerTool(
  "review_hero_ui_quality",
  {
    title: "Review HeroUI Quality",
    description:
      "Use this to review JSX, TSX, HTML, or CSS for HeroUI React v3 consistency, visual approval, and shadcn migration issues.",
    inputSchema: {
      code: z.string().optional(),
      css: z.string().optional(),
      heroUiGapJustification: z.string().optional(),
      visualConfirmation: z
        .object({
          approved: z.boolean().optional(),
          exportedImages: z.array(z.string()).optional()
        })
        .optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult("Reviewed HeroUI React v3 quality gates.", reviewHeroUiQuality(args))
);

server.registerTool(
  "generate_frontend_verification_checklist",
  {
    title: "Generate Frontend Verification Checklist",
    description:
      "Use this when preparing final QA for a HeroUI React v3 front-end implementation.",
    inputSchema: {
      appType: z.string().optional(),
      viewports: z.array(z.string()).optional(),
      interactions: z.array(z.string()).optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult(
      "Generated a HeroUI, visual, responsive, accessibility, and interaction verification checklist.",
      generateFrontendVerificationChecklist(args)
    )
);

server.registerTool(
  "list_artifact_contracts",
  {
    title: "List Artifact Contracts",
    description:
      "Use this to list the current feature artifact contracts and see producer, consumer, status, PASS condition, and failure route.",
    inputSchema: {
      featureSlug: z.string().optional(),
      registry: z.any().optional(),
      artifacts: z.array(z.any()).optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Listed full-stack artifact contracts.", listArtifactContracts(args))
);

server.registerTool(
  "get_artifact_contract",
  {
    title: "Get Artifact Contract",
    description:
      "Use this to read a single artifact contract by id or path before deciding whether a stage can consume it.",
    inputSchema: {
      artifactId: z.string().optional(),
      path: z.string().optional(),
      registry: z.any().optional(),
      artifacts: z.array(z.any()).optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Read one full-stack artifact contract.", getArtifactContract(args))
);

server.registerTool(
  "review_artifact_contract",
  {
    title: "Review Artifact Contract",
    description:
      "Use this to block empty templates and incomplete artifact contracts before handing them to the next stage.",
    inputSchema: {
      contract: z.any().optional(),
      artifact: z.any().optional(),
      content: z.string().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Reviewed one full-stack artifact contract.", reviewArtifactContract(args))
);

server.registerTool(
  "review_stage_gate",
  {
    title: "Review Stage Gate",
    description:
      "Use this to determine whether requirements, visual design, implementation, or verification may proceed.",
    inputSchema: {
      targetStage: z.string().optional(),
      stageState: z.any().optional(),
      artifactRegistry: z.any().optional(),
      ui: z.any().optional(),
      backend: z.any().optional(),
      evidence: z.any().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Reviewed the full-stack stage gate.", reviewStageGate(args))
);

server.registerTool(
  "plan_change_impact",
  {
    title: "Plan Change Impact",
    description:
      "Use this when requirements change to compute impacted artifacts, stale downstream contracts, invalidated approvals, and stage regression.",
    inputSchema: {
      currentStage: z.string().optional(),
      changeRequest: z.string().optional(),
      artifactRegistry: z.any().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Planned full-stack requirement change impact.", planChangeImpact(args))
);

server.registerTool(
  "mark_artifacts_stale",
  {
    title: "Mark Artifacts Stale",
    description:
      "Use this after a requirement change to mark impacted downstream artifact contracts as stale.",
    inputSchema: {
      registry: z.any().optional(),
      artifactIds: z.array(z.string()).optional(),
      staleArtifacts: z.array(z.string()).optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Marked impacted artifact contracts stale.", markArtifactsStale(args))
);

server.registerTool(
  "review_completion_gate",
  {
    title: "Review Completion Gate",
    description:
      "Use this before claiming a product feature is complete or verified. It requires fresh tests, build, screenshots when UI applies, review, and acceptance evidence.",
    inputSchema: {
      stageState: z.any().optional(),
      ui: z.any().optional(),
      backend: z.any().optional(),
      evidence: z.any().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Reviewed completion evidence before final status.", reviewCompletionGate(args))
);

server.registerTool(
  "review_visual_evidence",
  {
    title: "Review Visual Evidence",
    description:
      "Use this before implementation to block incomplete, stale, or unapproved Pencil/Figma visual evidence.",
    inputSchema: {
      requiredComponents: z.array(z.string()).optional(),
      requiredStates: z.array(z.string()).optional(),
      stageState: z.any().optional(),
      visualEvidence: z.any().optional(),
      visualConfirmation: z.any().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Reviewed Pencil/Figma visual evidence before implementation.", reviewVisualEvidence(args))
);

server.registerTool(
  "generate_implementation_plan_scaffold",
  {
    title: "Generate Implementation Plan Scaffold",
    description:
      "Use this after contracts and gates pass to create a TDD-ready implementation plan scaffold with code review and completion gates.",
    inputSchema: {
      featureName: z.string().optional(),
      files: z.array(z.string()).optional(),
      constraints: z.array(z.string()).optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) =>
    jsonResult("Generated a TDD-ready implementation plan scaffold.", generateImplementationPlanScaffold(args))
);

server.registerTool(
  "list_lifecycle_hooks",
  {
    title: "List Lifecycle Hooks",
    description:
      "Use this to list the internal full-stack before/after lifecycle hooks for every product development stage.",
    inputSchema: {
      stages: z.array(z.string()).optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Listed full-stack lifecycle hooks.", listLifecycleHooks(args))
);

server.registerTool(
  "review_lifecycle_hook_coverage",
  {
    title: "Review Lifecycle Hook Coverage",
    description:
      "Use this to block missing before/after hook coverage for required full-stack lifecycle stages.",
    inputSchema: {
      stages: z.array(z.string()).optional(),
      hooks: z
        .array(
          z.object({
            id: z.string().optional(),
            stage: z.string().optional(),
            event: z.enum(["before", "after"]).optional()
          })
        )
        .optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Reviewed lifecycle hook coverage.", reviewLifecycleHookCoverage(args))
);

server.registerTool(
  "run_lifecycle_hook",
  {
    title: "Run Lifecycle Hook",
    description:
      "Use this as the internal hook runner before or after a stage transition. It blocks when required gate evidence is missing.",
    inputSchema: {
      stage: z.string().optional(),
      currentStage: z.string().optional(),
      event: z.enum(["before", "after"]).optional(),
      evidence: z.record(z.any()).optional(),
      toolResults: z.any().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Ran the full-stack lifecycle hook.", runLifecycleHook(args))
);

server.registerTool(
  "select_development_flow_profile",
  {
    title: "Select Development Flow Profile",
    description:
      "Use this to choose the correct lifecycle intensity: strict-fullstack, strict-ui, light-change, or debug-fix.",
    inputSchema: {
      requestedProfile: z.string().optional(),
      flowProfile: z.string().optional(),
      profile: z.string().optional(),
      issueType: z.string().optional(),
      intent: z.string().optional(),
      changeSize: z.string().optional(),
      smallChange: z.boolean().optional(),
      product: z.boolean().optional(),
      ia: z.boolean().optional(),
      interaction: z.boolean().optional(),
      state: z.boolean().optional(),
      visual: z.boolean().optional(),
      ui: z.boolean().optional(),
      backend: z.boolean().optional(),
      api: z.boolean().optional(),
      data: z.boolean().optional(),
      auth: z.boolean().optional(),
      acceptance: z.boolean().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Selected the full-stack development flow profile.", selectDevelopmentFlowProfile(args))
);

server.registerTool(
  "plan_superpowers_execution_handoff",
  {
    title: "Plan Superpowers Execution Handoff",
    description:
      "Use this after implementation planning to attach Superpowers TDD, subagent/executing-plans, code review, verification-before-completion, and finishing-branch workflow.",
    inputSchema: {
      taskCount: z.number().int().optional(),
      independentTasks: z.boolean().optional(),
      allowSubagents: z.boolean().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Planned the Superpowers execution handoff.", planSuperpowersExecutionHandoff(args))
);

server.registerTool(
  "review_implementation_plan",
  {
    title: "Review Implementation Plan",
    description:
      "Use this before implementation to block plans that lack failing tests, exact files, code review, or completion gates.",
    inputSchema: {
      content: z.string().optional()
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  async (args) => jsonResult("Reviewed the implementation plan gate.", reviewImplementationPlan(args))
);

const transport = new StdioServerTransport();
await server.connect(transport);
