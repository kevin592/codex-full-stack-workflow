import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(__dirname, "../..");
const skillRoot = join(pluginRoot, "skills");

function readSkill(name) {
  const path = join(skillRoot, name, "SKILL.md");
  assert.equal(existsSync(path), true, `${name} skill should exist`);
  return readFileSync(path, "utf8");
}

test("top-level skill identifies the plugin as a general Codex product development system", () => {
  const skill = readSkill("full-stack-development");

  assert.match(skill, /general Codex product development plugin/i);
  assert.match(skill, /HeroUI.*front[- ]end layer/i);
  assert.match(skill, /Artifact Registry/i);
  assert.match(skill, /Stage Gate/i);
  assert.match(skill, /Completion Gate/i);
});

test("top-level skill arbitrates one-line site design requests before brainstorming", () => {
  const skill = readSkill("full-stack-development");

  assert.match(skill, /MUST use first/i);
  assert.match(skill, /website, landing page, brand site/i);
  assert.match(skill, /front-end design draft/i);
  assert.match(skill, /brainstorming.*fixed workspace/s);
  assert.match(skill, /visual companion.*generate_requirement_workspace/s);
  assert.match(skill, /one-line request/i);
});

test("new lifecycle skills declare artifact ownership and gates", () => {
  const skillNames = [
    "requirement-discovery",
    "artifact-contract-manager",
    "stage-gate-reviewer",
    "change-control",
    "visual-evidence-gate",
    "visual-design-orchestrator",
    "tailwind-reference-adapter",
    "quality-auditor",
    "implementation-planner",
    "completion-verifier"
  ];

  for (const name of skillNames) {
    const skill = readSkill(name);
    assert.match(skill, /Input Artifacts/i, `${name} should name input artifacts`);
    assert.match(skill, /Output Artifact/i, `${name} should name output artifacts`);
    assert.match(skill, /Required MCP Tool/i, `${name} should name required MCP tool`);
    assert.match(skill, /Hard Stops/i, `${name} should name hard stops`);
    assert.match(skill, /Pressure Test Responsibility/i, `${name} should name pressure test responsibility`);
    assert.match(skill, /Next Gate/i, `${name} should name next gate`);
  }
});

test("visual evidence gate requires machine-reviewable Pencil or Figma exports", () => {
  const skill = readSkill("visual-evidence-gate");

  assert.match(skill, /generate_design_board_inventory/i);
  assert.match(skill, /review_visual_evidence/i);
  assert.match(skill, /desktop/i);
  assert.match(skill, /mobile/i);
  assert.match(skill, /component-detail/i);
  assert.match(skill, /state-matrix/i);
  assert.match(skill, /stale/i);
});

test("visual design orchestrator and Tailwind reference adapter declare non-copying handoff rules", () => {
  const visual = readSkill("visual-design-orchestrator");
  const tailwind = readSkill("tailwind-reference-adapter");

  assert.match(visual, /plan_visual_design_orchestration/i);
  assert.match(visual, /review_visual_design_orchestration/i);
  assert.match(visual, /Pencil/i);
  assert.match(visual, /Figma/i);
  assert.match(visual, /visual-evidence\.md/i);

  assert.match(tailwind, /inspect_tailwind_ui_reference/i);
  assert.match(tailwind, /plan_tailwind_hero_ui_adoption/i);
  assert.match(tailwind, /reference-only/i);
  assert.match(tailwind, /Do not copy TailwindUI source/i);
  assert.match(tailwind, /HeroUI/i);
});

test("quality auditor declares deeper visual HeroUI backend docs and code review checks", () => {
  const skill = readSkill("quality-auditor");

  assert.match(skill, /review_visual_inspection_metrics/i);
  assert.match(skill, /review_hero_ui_component_graph_audit/i);
  assert.match(skill, /review_backend_contract_audit/i);
  assert.match(skill, /review_code_review_gate/i);
  assert.match(skill, /review_hero_ui_docs_freshness/i);
});

test("requirement discovery skill drafts structure instead of asking the user for IA from scratch", () => {
  const skill = readSkill("requirement-discovery");

  assert.match(skill, /user only needs to provide a rough goal/i);
  assert.match(skill, /draft information architecture/i);
  assert.match(skill, /draft interaction/i);
  assert.match(skill, /draft state/i);
  assert.match(skill, /at most three focused questions/i);
});

test("requirement discovery owns one-line website and design draft entry before visual companion", () => {
  const skill = readSkill("requirement-discovery");

  assert.match(skill, /MUST use before brainstorming/i);
  assert.match(skill, /website, landing page, brand site/i);
  assert.match(skill, /front-end design draft/i);
  assert.match(skill, /do not develop yet/i);
  assert.match(skill, /Do not offer a browser visual companion/i);
  assert.match(skill, /generate_requirement_workspace/i);
});
