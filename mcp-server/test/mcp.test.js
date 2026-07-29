import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverRoot = resolve(__dirname, "..");
const serverEntry = resolve(serverRoot, "src/index.js");

test("stdio MCP server exposes HeroUI craft tools", async (t) => {
  const client = new Client({
    name: "hero-ui-craft-test",
    version: "0.1.0"
  });
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverEntry],
    cwd: serverRoot,
    stderr: "pipe"
  });

  await client.connect(transport);
  t.after(async () => {
    await client.close();
  });

  const toolList = await client.listTools();
  const names = toolList.tools.map((tool) => tool.name);

  assert.deepEqual(names.sort(), [
    "generate_design_board_inventory",
    "generate_frontend_verification_checklist",
    "generate_implementation_plan_scaffold",
    "generate_requirement_artifact_templates",
    "generate_requirement_workspace",
    "get_artifact_contract",
    "get_hero_ui_agent_doc",
    "inspect_tailwind_ui_reference",
    "list_artifact_contracts",
    "list_hero_ui_agent_docs",
    "list_lifecycle_hooks",
    "mark_artifacts_stale",
    "plan_change_impact",
    "plan_frontend_requirement_pipeline",
    "plan_hero_ui_system",
    "plan_requirement_change",
    "plan_superpowers_execution_handoff",
    "plan_tailwind_hero_ui_adoption",
    "plan_visual_confirmation",
    "plan_visual_design_orchestration",
    "review_artifact_contract",
    "review_backend_contract_audit",
    "review_code_review_gate",
    "review_completion_gate",
    "review_frontend_requirement_contract",
    "review_hero_ui_component_graph_audit",
    "review_hero_ui_docs_freshness",
    "review_hero_ui_quality",
    "review_implementation_plan",
    "review_lifecycle_hook_coverage",
    "review_requirement_workspace_stage",
    "review_stage_gate",
    "review_visual_design_orchestration",
    "review_visual_evidence",
    "review_visual_inspection_metrics",
    "run_lifecycle_hook",
    "select_development_flow_profile",
    "select_hero_ui_components"
  ]);

  const result = await client.callTool({
    name: "plan_hero_ui_system",
    arguments: {
      productType: "dashboard",
      primaryWorkflow: "triage orders"
    }
  });

  assert.equal(result.isError, undefined);
  assert.equal(result.content[0].type, "text");
  assert.equal(result.structuredContent.result.intent.productType, "dashboard");
  assert.equal(result.structuredContent.result.officialContext.agentDocs.priority[0].doc, "agents");
  assert.ok(result.structuredContent.result.components.some((component) => component.name === "Table"));

  const docs = await client.callTool({
    name: "list_hero_ui_agent_docs",
    arguments: {}
  });
  assert.equal(docs.structuredContent.result.primaryDoc, "agents");
  assert.ok(docs.structuredContent.result.documents.some((doc) => doc.doc === "agents"));

  const agentsDoc = await client.callTool({
    name: "get_hero_ui_agent_doc",
    arguments: { doc: "agents" }
  });
  assert.equal(agentsDoc.isError, undefined);
  assert.match(agentsDoc.structuredContent.result.content, /HEROUI-REACT-AGENTS-MD-START|HeroUI v3 React/i);

  const pipeline = await client.callTool({
    name: "plan_frontend_requirement_pipeline",
    arguments: {
      idea: "Build a commerce dashboard",
      productType: "commerce admin",
      primaryWorkflow: "triage orders"
    }
  });
  assert.equal(pipeline.isError, undefined);
  assert.ok(pipeline.structuredContent.result.sequence.includes("信息架构需求"));
  assert.ok(pipeline.structuredContent.result.sequence.includes("交互需求"));
  assert.ok(pipeline.structuredContent.result.sequence.includes("验收需求"));

  const workspace = await client.callTool({
    name: "generate_requirement_workspace",
    arguments: {
      featureName: "Commerce Risk Console",
      userRequest: "做一个电商风控后台，能看订单、筛选风险、批量放行。"
    }
  });
  assert.equal(workspace.isError, undefined);
  assert.equal(
    workspace.structuredContent.result.fixedRoot,
    "docs/full-stack-development/requirements/commerce-risk-console"
  );
  assert.equal(workspace.structuredContent.result.files[0].path.endsWith("00-stage.json"), true);

  const gate = await client.callTool({
    name: "review_requirement_workspace_stage",
    arguments: {
      featureSlug: "commerce-risk-console",
      targetStage: "implementation",
      files: workspace.structuredContent.result.files
    }
  });
  assert.equal(gate.structuredContent.result.status, "blocked");
  assert.ok(
    gate.structuredContent.result.issues.some((issue) => issue.code === "missing-approved-visual-confirmation")
  );

  const change = await client.callTool({
    name: "plan_requirement_change",
    arguments: {
      featureName: "Commerce Risk Console",
      currentStage: "implementation",
      changeRequest: "新增订单字段并改变批量审核流程",
      changeNumber: 2
    }
  });
  assert.equal(
    change.structuredContent.result.changeFilePath,
    "docs/full-stack-development/requirements/commerce-risk-console/changes/0002-change-request.md"
  );
  assert.equal(change.structuredContent.result.resetToStage, "product-requirements");

  const registry = {
    artifacts: [
      {
        id: "requirement-discovery",
        path: "01-intake/requirement-discovery.md",
        producer: "requirement-discovery",
        consumers: ["product-scope-builder"],
        requiredForStages: ["product-scope"],
        status: "approved",
        passCondition: "Actionable.",
        failureRoute: "requirement-discovery"
      }
    ]
  };

  const artifactList = await client.callTool({
    name: "list_artifact_contracts",
    arguments: { registry }
  });
  assert.equal(artifactList.structuredContent.result.status, "pass");
  assert.equal(artifactList.structuredContent.result.artifacts.length, 1);

  const artifact = await client.callTool({
    name: "get_artifact_contract",
    arguments: { registry, artifactId: "requirement-discovery" }
  });
  assert.equal(artifact.structuredContent.result.artifact.path, "01-intake/requirement-discovery.md");

  const artifactReview = await client.callTool({
    name: "review_artifact_contract",
    arguments: {
      contract: registry.artifacts[0],
      content:
        "# Requirement Discovery\n\n## Confirmed Facts\n- Fact.\n\n## AI Assumptions\n- Assumption.\n\n## Open Questions\n- Question.\n\n## Out of Scope\n- Scope.\n\n## Downstream Use\n- Use.\n\n## PASS Condition\n- Pass."
    }
  });
  assert.equal(artifactReview.structuredContent.result.status, "pass");

  const stageGate = await client.callTool({
    name: "review_stage_gate",
    arguments: {
      targetStage: "implementation",
      stageState: {
        currentStage: "implementation-plan-ready",
        approvals: { requirementsApproved: true, visualDesignApproved: false }
      },
      ui: { applies: false, reason: "plugin-only capability" },
      artifactRegistry: registry
    }
  });
  assert.equal(stageGate.structuredContent.result.status, "pass");

  const impact = await client.callTool({
    name: "plan_change_impact",
    arguments: {
      currentStage: "implementation-in-progress",
      changeRequest: "Add API permission and idempotency requirements.",
      artifactRegistry: registry
    }
  });
  assert.equal(impact.structuredContent.result.resetToStage, "backend-api-frontend-contract");

  const stale = await client.callTool({
    name: "mark_artifacts_stale",
    arguments: {
      registry,
      artifactIds: ["requirement-discovery"]
    }
  });
  assert.equal(stale.structuredContent.result.registry.artifacts[0].status, "stale");

  const completion = await client.callTool({
    name: "review_completion_gate",
    arguments: {
      stageState: {
        currentStage: "implementation-complete",
        approvals: { requirementsApproved: true, implementationApproved: true }
      },
      ui: { applies: false },
      backend: { applies: false },
      evidence: {
        tests: { passed: true },
        build: { passed: true },
        codeReview: { blockingIssues: 0 },
        acceptance: { passed: true }
      }
    }
  });
  assert.equal(completion.structuredContent.result.status, "pass");

  const designInventory = await client.callTool({
    name: "generate_design_board_inventory",
    arguments: {
      featureName: "Commerce Risk Console",
      components: ["Table", "Drawer", "Button"]
    }
  });
  assert.equal(designInventory.structuredContent.result.status, "pass");
  assert.ok(designInventory.structuredContent.result.requiredBoards.some((board) => board.category === "state-matrix"));

  const visualEvidence = await client.callTool({
    name: "review_visual_evidence",
    arguments: {
      requiredComponents: ["Table", "Drawer", "Button"],
      stageState: {
        approvals: { requirementsApproved: true },
        latestChangeId: "0001"
      },
      visualEvidence: {
        tool: "figma",
        changeId: "0001",
        approved: true,
        approvalRecord: {
          approvedBy: "user",
          approvedAt: "2026-07-07T10:00:00+08:00",
          scope: "initial approved design"
        },
        exports: [
          { path: "desktop.png", category: "desktop" },
          { path: "mobile.png", category: "mobile" },
          { path: "component-detail.png", category: "component-detail", components: ["Table", "Drawer", "Button"] },
          {
            path: "state-matrix.png",
            category: "state-matrix",
            states: ["default", "hover", "focus", "disabled", "loading", "empty", "error", "success", "mobile"]
          }
        ]
      }
    }
  });
  assert.equal(visualEvidence.structuredContent.result.status, "pass");

  const tailwindFixture = resolve(tmpdir(), `tailwind-ui-mcp-${Date.now()}`);
  mkdirSync(resolve(tailwindFixture, "react/ui-blocks/application-ui"), { recursive: true });
  writeFileSync(resolve(tailwindFixture, "react/ui-blocks/application-ui/table.jsx"), "export default function Table() {}", "utf8");
  t.after(() => {
    rmSync(tailwindFixture, { recursive: true, force: true });
  });

  const tailwindReference = await client.callTool({
    name: "inspect_tailwind_ui_reference",
    arguments: {
      root: tailwindFixture
    }
  });
  assert.equal(tailwindReference.structuredContent.result.status, "pass");
  assert.equal(tailwindReference.structuredContent.result.policy.doNotBundleTailwindUiSource, true);

  const tailwindAdoption = await client.callTool({
    name: "plan_tailwind_hero_ui_adoption",
    arguments: {
      patterns: ["application-ui", "ecommerce", "table", "button"],
      target: "HeroUI React dashboard"
    }
  });
  assert.equal(tailwindAdoption.structuredContent.result.status, "pass");
  assert.ok(tailwindAdoption.structuredContent.result.blockedUses.some((item) => /copy TailwindUI source/i.test(item)));

  const visualOrchestration = await client.callTool({
    name: "plan_visual_design_orchestration",
    arguments: {
      featureSlug: "commerce-risk-console",
      designTool: "pencil",
      components: ["Table", "Drawer", "Button"]
    }
  });
  assert.equal(visualOrchestration.structuredContent.result.status, "pass");
  assert.ok(
    visualOrchestration.structuredContent.result.toolCallPlan.some(
      (step) => step.tool === "pencil" && step.action === "get_editor_state"
    )
  );

  const orchestrationReview = await client.callTool({
    name: "review_visual_design_orchestration",
    arguments: {
      stageGatePassed: true,
      inventoryGenerated: true,
      designToolReady: true,
      exportedCategories: ["desktop", "mobile", "component-detail", "state-matrix"],
      approvalRecord: {
        approvedBy: "user",
        approvedAt: "2026-07-07T13:00:00+08:00",
        scope: "commerce risk console"
      },
      visualEvidenceReview: { status: "pass" },
      implementationGate: { status: "pass" }
    }
  });
  assert.equal(orchestrationReview.structuredContent.result.status, "pass");

  const visualInspection = await client.callTool({
    name: "review_visual_inspection_metrics",
    arguments: {
      screenshots: [
        { category: "desktop", width: 1440, height: 900, nonBlankRatio: 0.97, diffRatio: 0.02 },
        { category: "mobile", width: 390, height: 844, nonBlankRatio: 0.96, diffRatio: 0.02 },
        { category: "component-detail", width: 1200, height: 800, nonBlankRatio: 0.95, diffRatio: 0.02 },
        { category: "state-matrix", width: 1200, height: 800, nonBlankRatio: 0.95, diffRatio: 0.02 }
      ]
    }
  });
  assert.equal(visualInspection.structuredContent.result.status, "pass");

  const componentGraph = await client.callTool({
    name: "review_hero_ui_component_graph_audit",
    arguments: {
      requiredComponents: ["Button"],
      files: [{ path: "src/App.tsx", content: 'import { Button } from "@heroui/react"; export function App(){ return <Button/> }' }]
    }
  });
  assert.equal(componentGraph.structuredContent.result.status, "pass");

  const backendAudit = await client.callTool({
    name: "review_backend_contract_audit",
    arguments: {
      contract: {
        endpoints: [{ method: "GET", path: "/api/orders", requiresAuth: true, requestFields: [], errorCodes: ["UNAUTHORIZED"] }]
      },
      implementation: {
        endpoints: [{ method: "GET", path: "/api/orders", authChecked: true, requestFields: [], errorCodes: ["UNAUTHORIZED"] }]
      }
    }
  });
  assert.equal(backendAudit.structuredContent.result.status, "pass");

  const codeReviewGate = await client.callTool({
    name: "review_code_review_gate",
    arguments: {
      changedFiles: ["src/App.tsx"],
      review: {
        summary: "Reviewed HeroUI UI change.",
        findings: [],
        testsReviewed: true,
        visualReviewed: true
      }
    }
  });
  assert.equal(codeReviewGate.structuredContent.result.status, "pass");

  const planScaffold = await client.callTool({
    name: "generate_implementation_plan_scaffold",
    arguments: {
      featureName: "Commerce Risk Console",
      files: ["C:/repo/src/contracts.js", "C:/repo/test/contracts.test.js"],
      constraints: ["Keep existing MCP tools backward compatible."]
    }
  });
  assert.equal(planScaffold.structuredContent.result.status, "pass");
  assert.match(planScaffold.structuredContent.result.content, /Code Review Gate/);

  const planReview = await client.callTool({
    name: "review_implementation_plan",
    arguments: {
      content: planScaffold.structuredContent.result.content
    }
  });
  assert.equal(planReview.structuredContent.result.status, "pass");

  const flowProfile = await client.callTool({
    name: "select_development_flow_profile",
    arguments: {
      ui: true,
      backend: false
    }
  });
  assert.equal(flowProfile.structuredContent.result.profile.id, "strict-ui");

  const superpowersHandoff = await client.callTool({
    name: "plan_superpowers_execution_handoff",
    arguments: {
      taskCount: 2,
      independentTasks: true,
      allowSubagents: true
    }
  });
  assert.equal(superpowersHandoff.structuredContent.result.executionSkill, "superpowers:subagent-driven-development");
  assert.ok(
    superpowersHandoff.structuredContent.result.requiredSkills.includes("superpowers:verification-before-completion")
  );

  const lifecycleHooks = await client.callTool({
    name: "list_lifecycle_hooks",
    arguments: {}
  });
  assert.equal(lifecycleHooks.structuredContent.result.status, "pass");
  assert.ok(
    lifecycleHooks.structuredContent.result.hooks.some(
      (hook) => hook.stage === "implementation-plan-ready" && hook.event === "before"
    )
  );

  const hookCoverage = await client.callTool({
    name: "review_lifecycle_hook_coverage",
    arguments: {
      stages: ["implementation-plan-ready"],
      hooks: [
        { stage: "implementation-plan-ready", event: "before" },
        { stage: "implementation-plan-ready", event: "after" }
      ]
    }
  });
  assert.equal(hookCoverage.structuredContent.result.status, "pass");

  const lifecycleHook = await client.callTool({
    name: "run_lifecycle_hook",
    arguments: {
      stage: "implementation-plan-ready",
      event: "before",
      evidence: {
        review_stage_gate: { status: "pass" },
        select_development_flow_profile: { status: "pass" },
        plan_superpowers_execution_handoff: { status: "pass" }
      }
    }
  });
  assert.equal(lifecycleHook.structuredContent.result.status, "pass");
});
