import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { fileURLToPath } from "node:url";

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
} from "../src/craft.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(__dirname, "../..");
const officialRoot = resolve(pluginRoot, "skills/hero-ui-craft/references/official/react");

function listFilesRecursive(root) {
  const result = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      result.push(...listFilesRecursive(fullPath));
    } else {
      result.push(fullPath);
    }
  }
  return result;
}

test("planHeroUiSystem anchors frontend work to official HeroUI React v3 setup", () => {
  const plan = planHeroUiSystem({
    productType: "commerce dashboard",
    audience: "operators",
    primaryWorkflow: "review orders, filter risk, and resolve refunds",
    constraints: ["Vite", "Tailwind CSS v4"]
  });

  assert.equal(plan.intent.productType, "commerce dashboard");
  assert.ok(plan.officialContext.requirements.includes("React >= 19.0.0"));
  assert.ok(plan.officialContext.requirements.includes("Tailwind CSS >= v4"));
  assert.ok(plan.officialContext.packages.includes("@heroui/react"));
  assert.ok(plan.officialContext.packages.includes("@heroui/styles"));
  assert.ok(
    plan.officialContext.commands.some((command) =>
      command.includes("npx heroui-cli@latest agents-md --react --output AGENTS.md")
    )
  );
  assert.deepEqual(plan.officialContext.styleImportOrder, [
    "@import \"tailwindcss\";",
    "@import \"@heroui/styles\";"
  ]);
  assert.equal(plan.officialContext.mcpServer.args.at(-1), "@heroui/react-mcp@latest");
  assert.ok(plan.officialContext.docsUrls.includes("https://heroui.com/react/llms.txt"));
  assert.equal(plan.officialContext.agentDocs.priority[0].doc, "agents");
  assert.match(plan.officialContext.agentDocs.priority[0].path, /AGENTS\.md$/);
  assert.equal(plan.visualGate.requiresUserApproval, true);
  assert.ok(plan.components.some((component) => component.name === "Table"));
  assert.ok(plan.components.some((component) => component.name === "Drawer"));
});

test("official HeroUI React agent docs are bundled with AGENTS.md as the priority entry", () => {
  const expectedFiles = [
    "AGENTS.md",
    "llms.txt",
    "llms-full.txt",
    "llms-components.txt",
    "llms-patterns.txt",
    "manifest.json"
  ];

  for (const file of expectedFiles) {
    const fullPath = join(officialRoot, file);
    assert.equal(existsSync(fullPath), true, `${file} should exist`);
    assert.ok(readFileSync(fullPath, "utf8").length > 100, `${file} should not be empty`);
  }

  const agents = readFileSync(join(officialRoot, "AGENTS.md"), "utf8");
  assert.match(agents, /HEROUI-REACT-AGENTS-MD-START|HeroUI v3 React/i);
  assert.match(agents, /\.heroui-docs\/react/);

  const docsRoot = join(officialRoot, ".heroui-docs/react");
  assert.equal(existsSync(docsRoot), true, ".heroui-docs/react should exist");
  const docsFiles = listFilesRecursive(docsRoot).map((file) => file.replaceAll("\\", "/"));
  assert.ok(docsFiles.length > 10, "official docs snapshot should contain React documentation files");
  assert.ok(docsFiles.some((file) => /button/i.test(file)));
  assert.ok(docsFiles.some((file) => /getting-started|quick-start|introduction/i.test(file)));

  const manifest = JSON.parse(readFileSync(join(officialRoot, "manifest.json"), "utf8"));
  assert.equal(manifest.library, "HeroUI React v3");
  assert.equal(manifest.primaryDoc, "AGENTS.md");
  assert.match(manifest.generated.command, /agents-md --react --output AGENTS\.md/);
  for (const key of ["agents", "llms", "components", "patterns", "full"]) {
    assert.match(manifest.documents[key].sha256, /^[a-f0-9]{64}$/);
    assert.ok(manifest.documents[key].bytes > 100);
    assert.ok(manifest.documents[key].source);
  }
});

test("agent doc helpers list and read bundled official docs", () => {
  const list = listHeroUiAgentDocs();
  const docs = list.documents.map((doc) => doc.doc);

  assert.deepEqual(docs, ["agents", "llms", "components", "patterns", "full"]);
  assert.equal(list.primaryDoc, "agents");
  assert.equal(list.documents[0].priority, 1);
  assert.match(list.documents[0].path, /AGENTS\.md$/);

  const agents = getHeroUiAgentDoc({ doc: "agents" });
  assert.equal(agents.doc, "agents");
  assert.match(agents.content, /HEROUI-REACT-AGENTS-MD-START|HeroUI v3 React/i);
  assert.equal(agents.metadata.priority, 1);

  assert.throws(() => getHeroUiAgentDoc({ doc: "missing" }), /Unknown HeroUI agent doc/);
});

test("selectHeroUiComponents maps product needs to official HeroUI v3 component names", () => {
  const selection = selectHeroUiComponents({
    needs: [
      "navigation",
      "search filters",
      "data table",
      "detail drawer",
      "validated form",
      "toast feedback",
      "loading state"
    ]
  });

  const names = selection.components.map((component) => component.name);

  assert.ok(names.includes("Breadcrumbs"));
  assert.ok(names.includes("Tabs"));
  assert.ok(names.includes("SearchField"));
  assert.ok(names.includes("Select"));
  assert.ok(names.includes("Table"));
  assert.ok(names.includes("Drawer"));
  assert.ok(names.includes("Form"));
  assert.ok(names.includes("FieldError"));
  assert.ok(names.includes("Toast"));
  assert.ok(names.includes("Skeleton"));
  assert.ok(selection.officialSource.includes("HeroUI v3 React component catalog"));
});

test("planVisualConfirmation requires Pencil or Figma component-detail images before coding", () => {
  const plan = planVisualConfirmation({
    components: ["Button", "Table", "Drawer"],
    targetSurfaces: ["desktop dashboard", "mobile order detail"]
  });

  assert.equal(plan.requiresDesignTool, true);
  assert.equal(plan.requiresUserApproval, true);
  assert.deepEqual(plan.acceptedTools, ["Pencil", "Figma"]);
  assert.ok(plan.pencilGate.some((item) => /get_editor_state\(include_schema: true\)/i.test(item)));
  assert.ok(plan.figmaGate.some((item) => /figma-use/i.test(item)));
  assert.ok(plan.requiredExports.some((item) => /component detail/i.test(item)));
  assert.ok(plan.requiredStates.includes("hover"));
  assert.ok(plan.requiredStates.includes("focus"));
  assert.ok(plan.requiredStates.includes("disabled"));
  assert.ok(plan.requiredStates.includes("loading"));
  assert.ok(plan.requiredStates.includes("empty"));
  assert.ok(plan.requiredStates.includes("error"));
  assert.ok(plan.requiredStates.includes("success"));
  assert.ok(plan.requiredStates.includes("mobile"));
  assert.equal(plan.componentChecklist.length, 3);
});

test("planFrontendRequirementPipeline treats IA, interaction, states, engineering, and acceptance as requirements", () => {
  const plan = planFrontendRequirementPipeline({
    idea: "Build a commerce operations dashboard",
    productType: "commerce admin",
    audience: "operations team",
    primaryWorkflow: "triage orders and release blocked batches"
  });

  assert.equal(plan.principle, "需求是一组被逐层展开、可验证、可实现的约束。");
  assert.deepEqual(plan.sequence, [
    "粗需求",
    "业务需求",
    "产品需求",
    "信息架构需求",
    "交互需求",
    "状态需求",
    "视觉需求",
    "工程需求",
    "验收需求",
    "HeroUI组件映射",
    "Pencil/Figma视觉确认"
  ]);
  assert.equal(plan.gates.beforeVisualDesign.requiresApproval, true);
  assert.equal(plan.gates.beforeImplementation.requiresApproval, true);
  assert.ok(plan.gates.beforeVisualDesign.requiredArtifacts.includes("03-information-architecture.md"));
  assert.ok(plan.gates.beforeVisualDesign.requiredArtifacts.includes("04-interaction-matrix.md"));
  assert.ok(plan.gates.beforeVisualDesign.requiredArtifacts.includes("05-state-requirements.md"));
  assert.ok(plan.gates.beforeVisualDesign.requiredArtifacts.includes("07-engineering-contract.md"));
  assert.ok(plan.gates.beforeVisualDesign.requiredArtifacts.includes("08-acceptance-contract.md"));
  assert.ok(plan.heroUiRules.some((rule) => /Official Component First/i.test(rule)));
  assert.ok(plan.heroUiRules.some((rule) => /AGENTS\.md/i.test(rule)));
  assert.ok(plan.artifacts.some((artifact) => artifact.file === "04-interaction-matrix.md"));
  assert.ok(plan.artifacts.some((artifact) => artifact.file === "09-visual-confirmation-plan.md"));
});

test("generateRequirementArtifactTemplates returns concrete markdown templates for the full pre-design contract", () => {
  const templates = generateRequirementArtifactTemplates({
    featureName: "Commerce Cockpit",
    outputDir: "docs/hero-ui"
  });
  const files = templates.templates.map((template) => template.file);

  assert.deepEqual(files, [
    "00-requirement-brief.md",
    "01-business-requirements.md",
    "02-product-requirements.md",
    "03-information-architecture.md",
    "04-interaction-matrix.md",
    "05-state-requirements.md",
    "06-visual-requirements.md",
    "07-engineering-contract.md",
    "08-acceptance-contract.md",
    "09-visual-confirmation-plan.md"
  ]);
  assert.match(templates.templates[3].content, /信息架构需求/);
  assert.match(templates.templates[4].content, /交互矩阵/);
  assert.match(templates.templates[5].content, /空数据|加载|错误|异常|编辑/);
  assert.match(templates.templates[7].content, /Official Component First/);
  assert.match(templates.templates[7].content, /@heroui\/react/);
  assert.match(templates.templates[8].content, /怎么判断做得对不对/);
  assert.match(templates.templates[9].content, /Pencil\/Figma/);
  assert.match(templates.templates[9].content, /组件细节/);
});

test("generateRequirementWorkspace creates an agent-owned fixed project workspace from a rough request", () => {
  const workspace = generateRequirementWorkspace({
    featureName: "Commerce Risk Console",
    userRequest: "做一个电商风控后台，能看订单、筛选风险、批量放行。",
    projectRoot: "C:/repo/shop"
  });

  assert.equal(workspace.fixedRoot, "docs/full-stack-development/requirements/commerce-risk-console");
  assert.equal(workspace.stageFile, "docs/full-stack-development/requirements/commerce-risk-console/00-stage.json");
  assert.equal(workspace.currentStage, "rough-intake");
  assert.equal(workspace.nextAllowedStage, "requirements");
  assert.equal(workspace.agentOwnsClarification, true);
  assert.ok(workspace.policy.some((item) => /user only needs to provide a rough goal/i.test(item)));
  assert.ok(workspace.policy.some((item) => /agent must draft information architecture/i.test(item)));

  const paths = workspace.files.map((file) => file.path);
  assert.deepEqual(paths.slice(0, 11), [
    "docs/full-stack-development/requirements/commerce-risk-console/00-stage.json",
    "docs/full-stack-development/requirements/commerce-risk-console/01-rough-request.md",
    "docs/full-stack-development/requirements/commerce-risk-console/02-business-requirements.md",
    "docs/full-stack-development/requirements/commerce-risk-console/03-product-requirements.md",
    "docs/full-stack-development/requirements/commerce-risk-console/04-information-architecture.md",
    "docs/full-stack-development/requirements/commerce-risk-console/05-interaction-matrix.md",
    "docs/full-stack-development/requirements/commerce-risk-console/06-state-requirements.md",
    "docs/full-stack-development/requirements/commerce-risk-console/07-visual-requirements.md",
    "docs/full-stack-development/requirements/commerce-risk-console/08-engineering-contract.md",
    "docs/full-stack-development/requirements/commerce-risk-console/09-acceptance-contract.md",
    "docs/full-stack-development/requirements/commerce-risk-console/10-visual-confirmation-plan.md"
  ]);
  assert.ok(paths.includes("docs/full-stack-development/requirements/commerce-risk-console/changes/0000-initial-intake.md"));

  const ia = workspace.files.find((file) => file.path.endsWith("04-information-architecture.md")).content;
  assert.match(ia, /Agent draft/i);
  assert.match(ia, /Assumptions to verify/i);
  assert.match(ia, /Questions for user confirmation/i);
  assert.match(ia, /User confirmation/i);
});

test("generateRequirementWorkspace writes the fixed workspace when a project root is provided", () => {
  const projectRoot = mkdtempSync(join(tmpdir(), "fsd-workspace-"));

  try {
    const workspace = generateRequirementWorkspace({
      featureName: "Luxury Coffee Brand Site",
      featureSlug: "luxury-coffee-brand-site-design",
      userRequest: "I want a high-end coffee brand website design draft; do not develop yet.",
      projectRoot
    });

    assert.equal(workspace.written, true);
    assert.ok(workspace.writtenFiles.length >= 11);

    const stagePath = join(
      projectRoot,
      "docs/full-stack-development/requirements/luxury-coffee-brand-site-design/00-stage.json"
    );
    const roughPath = join(
      projectRoot,
      "docs/full-stack-development/requirements/luxury-coffee-brand-site-design/01-rough-request.md"
    );

    assert.equal(existsSync(stagePath), true);
    assert.equal(existsSync(roughPath), true);
    assert.match(readFileSync(roughPath, "utf8"), /high-end coffee brand website design draft/i);
  } finally {
    rmSync(projectRoot, { recursive: true, force: true });
  }
});

test("reviewRequirementWorkspaceStage blocks Pencil and implementation unless fixed workspace files exist", () => {
  const looseArtifacts = generateRequirementArtifactTemplates({
    featureName: "Commerce Risk Console",
    outputDir: "docs/random"
  }).templates.map((template) => ({
    path: template.path,
    content: template.content
  }));

  const looseReview = reviewRequirementWorkspaceStage({
    featureSlug: "commerce-risk-console",
    targetStage: "visual-design",
    files: looseArtifacts
  });

  assert.equal(looseReview.status, "blocked");
  assert.equal(looseReview.currentStage, "workspace-missing");
  assert.ok(looseReview.issues.some((issue) => issue.code === "missing-stage-file"));
  assert.ok(looseReview.issues.some((issue) => issue.code === "artifact-outside-fixed-workspace"));

  const workspace = generateRequirementWorkspace({
    featureName: "Commerce Risk Console",
    userRequest: "做一个电商风控后台。"
  });
  const filesBeforeVisual = workspace.files
    .filter((file) => !file.path.endsWith("10-visual-confirmation-plan.md"))
    .map((file) => ({ path: file.path, content: file.content }));
  const pendingVisualReview = reviewRequirementWorkspaceStage({
    featureSlug: "commerce-risk-console",
    targetStage: "visual-design",
    files: filesBeforeVisual
  });

  assert.equal(pendingVisualReview.status, "blocked");
  assert.equal(pendingVisualReview.currentStage, "requirements-drafting");
  assert.ok(pendingVisualReview.issues.some((issue) => issue.code === "requirements-not-approved"));

  const approvedFilesBeforeVisual = filesBeforeVisual.map((file) =>
    file.path.endsWith("00-stage.json")
      ? {
          ...file,
          content: JSON.stringify({
            schema: "hero-ui-craft.requirement-workspace.v1",
            currentStage: "visual-design-ready",
            approvals: {
              requirementsApproved: true,
              visualDesignApproved: false,
              implementationApproved: false
            }
          })
        }
      : file
  );
  const visualReview = reviewRequirementWorkspaceStage({
    featureSlug: "commerce-risk-console",
    targetStage: "visual-design",
    files: approvedFilesBeforeVisual
  });

  assert.equal(visualReview.status, "pass");
  assert.equal(visualReview.currentStage, "visual-design-ready");
  assert.equal(visualReview.nextAllowedStage, "visual-design");

  const implementationReview = reviewRequirementWorkspaceStage({
    featureSlug: "commerce-risk-console",
    targetStage: "implementation",
    files: approvedFilesBeforeVisual
  });

  assert.equal(implementationReview.status, "blocked");
  assert.equal(implementationReview.currentStage, "visual-design-ready");
  assert.ok(implementationReview.issues.some((issue) => issue.code === "missing-visual-confirmation-plan"));

  const implementationApproved = reviewRequirementWorkspaceStage({
    featureSlug: "commerce-risk-console",
    targetStage: "implementation",
    files: workspace.files.map((file) =>
      file.path.endsWith("00-stage.json")
        ? {
            ...file,
            content: JSON.stringify({
              schema: "hero-ui-craft.requirement-workspace.v1",
              currentStage: "implementation-ready",
              approvals: {
                requirementsApproved: true,
                visualDesignApproved: true,
                implementationApproved: false
              }
            })
          }
        : file
    ),
    visualConfirmation: {
      approved: true,
      exportedImages: ["desktop.png", "mobile.png", "component-detail.png", "state-matrix.png"]
    }
  });

  assert.equal(implementationApproved.status, "pass");
  assert.equal(implementationApproved.currentStage, "implementation-ready");
  assert.equal(implementationApproved.nextAllowedStage, "implementation");
});

test("planRequirementChange records upgrades and regresses the stage to the earliest impacted requirement layer", () => {
  const change = planRequirementChange({
    featureName: "Commerce Risk Console",
    currentStage: "implementation",
    changeRequest: "增加订单风险字段，并把批量审核流程改成先预检再放行。",
    changeNumber: 3
  });

  assert.equal(change.changeFilePath, "docs/full-stack-development/requirements/commerce-risk-console/changes/0003-change-request.md");
  assert.equal(change.resetToStage, "product-requirements");
  assert.ok(change.impactedArtifacts.includes("03-product-requirements.md"));
  assert.ok(change.impactedArtifacts.includes("04-information-architecture.md"));
  assert.ok(change.impactedArtifacts.includes("05-interaction-matrix.md"));
  assert.ok(change.invalidates.includes("Pencil/Figma visual approval"));
  assert.ok(change.invalidates.includes("front-end implementation"));
  assert.ok(change.requiredActions.some((action) => /update 00-stage\.json/i.test(action)));
  assert.ok(change.requiredActions.some((action) => /append the change record/i.test(action)));
});

test("reviewFrontendRequirementContract blocks visual design and implementation when requirement layers are missing", () => {
  const review = reviewFrontendRequirementContract({
    targetStage: "visual-design",
    artifacts: [
      {
        file: "00-requirement-brief.md",
        content: "粗需求: build dashboard"
      },
      {
        file: "02-product-requirements.md",
        content: "产品需求: operators triage orders"
      }
    ]
  });

  const codes = review.issues.map((issue) => issue.code);

  assert.equal(review.status, "blocked");
  assert.equal(review.nextAllowedStage, "requirements");
  assert.ok(codes.includes("missing-information-architecture"));
  assert.ok(codes.includes("missing-interaction-matrix"));
  assert.ok(codes.includes("missing-state-requirements"));
  assert.ok(codes.includes("missing-engineering-contract"));
  assert.ok(codes.includes("missing-acceptance-contract"));
});

test("reviewFrontendRequirementContract allows visual design only after the complete HeroUI requirement contract", () => {
  const templates = generateRequirementArtifactTemplates({
    featureName: "Commerce Cockpit",
    outputDir: "docs/hero-ui"
  });
  const review = reviewFrontendRequirementContract({
    targetStage: "visual-design",
    artifacts: templates.templates
  });

  assert.equal(review.status, "pass");
  assert.equal(review.nextAllowedStage, "visual-design");
  assert.equal(review.requiredNextArtifact, "09-visual-confirmation-plan.md");
  assert.ok(review.checks.some((check) => check.includes("Official Component First")));
  assert.ok(review.checks.some((check) => check.includes("Pencil/Figma")));
});

test("reviewHeroUiQuality flags shadcn, legacy NextUI, missing styles, and v2 provider assumptions", () => {
  const review = reviewHeroUiQuality({
    code: `
      import { Button as LocalButton } from "@/components/ui/button";
      import { HeroUIProvider } from "@heroui/react";
      import { Card } from "@nextui-org/react";

      export function Screen() {
        return <HeroUIProvider><LocalButton className="bg-blue-600">Save</LocalButton></HeroUIProvider>;
      }
    `,
    css: `
      @import "tailwindcss";
    `,
    visualConfirmation: {
      approved: false,
      exportedImages: []
    }
  });

  const codes = review.issues.map((issue) => issue.code);

  assert.equal(review.status, "needs_revision");
  assert.ok(codes.includes("blocked-no-visual-approval"));
  assert.ok(codes.includes("shadcn-import"));
  assert.ok(codes.includes("legacy-nextui-package"));
  assert.ok(codes.includes("missing-heroui-styles-import"));
  assert.ok(codes.includes("obsolete-provider-assumption"));
  assert.ok(codes.includes("raw-tailwind-color"));
});

test("reviewHeroUiQuality blocks hand-written UI when an official HeroUI component should be used", () => {
  const review = reviewHeroUiQuality({
    code: `
      import { cva } from "class-variance-authority";
      import { Button as ButtonPrimitive } from "@base-ui/react/button";

      const buttonVariants = cva("inline-flex rounded-lg border px-3 py-2");

      export function Button(props) {
        return <ButtonPrimitive className={buttonVariants()} {...props} />;
      }
    `,
    css: `
      @import "tailwindcss";
      @import "@heroui/styles";
    `,
    visualConfirmation: {
      approved: true,
      exportedImages: ["desktop.png", "components.png"]
    }
  });

  const codes = review.issues.map((issue) => issue.code);

  assert.equal(review.status, "needs_revision");
  assert.ok(codes.includes("handwritten-ui-official-available"));
});

test("hero-ui-craft skill states official HeroUI components are mandatory before hand-written UI", () => {
  const skill = readFileSync(join(pluginRoot, "skills/hero-ui-craft/SKILL.md"), "utf8");

  assert.match(skill, /Official Component First/i);
  assert.match(skill, /Do not hand[- ]write UI/i);
  assert.match(skill, /only when HeroUI has no official/i);
  assert.match(skill, /document the exception/i);
});

test("hero-ui-craft skill requires the layered requirement contract before Pencil or Figma visuals", () => {
  const skill = readFileSync(join(pluginRoot, "skills/hero-ui-craft/SKILL.md"), "utf8");
  const workflow = readFileSync(
    join(pluginRoot, "skills/hero-ui-craft/references/requirements-to-visual-workflow.md"),
    "utf8"
  );

  assert.match(skill, /需求流水线|Requirement Pipeline/i);
  assert.match(skill, /粗需求.*业务需求.*产品需求.*信息架构需求.*交互需求.*状态需求.*视觉需求.*工程需求.*验收需求/s);
  assert.match(skill, /before Pencil\/Figma/i);
  assert.match(skill, /review_frontend_requirement_contract/);
  assert.match(workflow, /04-information-architecture\.md/);
  assert.match(workflow, /05-interaction-matrix\.md/);
  assert.match(workflow, /06-state-requirements\.md/);
  assert.match(workflow, /08-engineering-contract\.md/);
  assert.match(workflow, /09-acceptance-contract\.md/);
  assert.match(workflow, /禁止手写 UI|No hand-written UI/i);
});

test("hero-ui-craft skill makes the requirement workspace a project artifact and handles changes by stage regression", () => {
  const skill = readFileSync(join(pluginRoot, "skills/hero-ui-craft/SKILL.md"), "utf8");

  assert.match(skill, /docs\/full-stack-development\/requirements\/<feature-slug>/);
  assert.match(skill, /generate_requirement_workspace/);
  assert.match(skill, /review_requirement_workspace_stage/);
  assert.match(skill, /plan_requirement_change/);
  assert.match(skill, /用户只需要提供粗目标|user only needs to provide a rough goal/i);
  assert.match(skill, /agent .*信息架构|agent must draft information architecture/i);
  assert.match(skill, /需求变更|requirement change/i);
  assert.match(skill, /回退|regress/i);
  assert.match(skill, /00-stage\.json/);
});

test("full-stack-development plugin exposes a top-level full-stack skill and keeps HeroUI as the frontend layer", () => {
  const manifest = JSON.parse(readFileSync(join(pluginRoot, ".codex-plugin/plugin.json"), "utf8"));
  const skill = readFileSync(join(pluginRoot, "skills/full-stack-development/SKILL.md"), "utf8");
  const contract = readFileSync(
    join(pluginRoot, "skills/full-stack-development/references/full-stack-stage-contract.md"),
    "utf8"
  );
  const heroSkill = readFileSync(join(pluginRoot, "skills/hero-ui-craft/SKILL.md"), "utf8");

  assert.equal(manifest.name, "full-stack-development");
  assert.match(manifest.interface.displayName, /全栈开发|Full Stack Development/i);
  assert.match(skill, /^name: full-stack-development/m);
  assert.match(skill, /docs\/full-stack-development\/requirements\/<feature-slug>/);
  assert.match(skill, /generate_requirement_workspace/);
  assert.match(skill, /review_requirement_workspace_stage/);
  assert.match(skill, /plan_requirement_change/);
  assert.match(skill, /hero-ui-craft/);
  assert.match(contract, /backend\/data requirements/i);
  assert.match(contract, /API contract/i);
  assert.match(contract, /HeroUI Boundary/i);
  assert.match(heroSkill, /Official Component First/i);
});

test("generateFrontendVerificationChecklist includes official HeroUI and visual QA gates", () => {
  const checklist = generateFrontendVerificationChecklist({
    appType: "admin dashboard",
    viewports: ["1440x900", "390x844"],
    interactions: ["open Drawer", "submit Form", "show Toast"]
  });

  const text = checklist.sections.flatMap((section) => section.items).join("\n");

  assert.match(text, /agents-md --react --output AGENTS\.md/);
  assert.match(text, /@heroui\/react-mcp@latest/);
  assert.match(text, /Pencil or Figma/i);
  assert.match(text, /component detail/i);
  assert.match(text, /npx heroui-cli@latest doctor/i);
  assert.match(text, /1440x900/);
  assert.match(text, /390x844/);
  assert.match(text, /open Drawer/);
});
