import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { inspectTailwindUiReference, planTailwindHeroUiAdoption } from "../src/tailwind-reference.js";

function makeTailwindUiFixture() {
  const root = join(tmpdir(), `tailwind-ui-fixture-${Date.now()}`);
  mkdirSync(join(root, "react/ui-blocks/application-ui/forms/toggles"), { recursive: true });
  mkdirSync(join(root, "react/ui-blocks/ecommerce/page-examples/product-pages"), { recursive: true });
  mkdirSync(join(root, "react/ui-blocks/marketing/sections/testimonials"), { recursive: true });
  mkdirSync(join(root, "catalyst-ui-kit/typescript"), { recursive: true });
  mkdirSync(join(root, "TEMPLATES/tailwind-plus-salient"), { recursive: true });
  writeFileSync(join(root, "react/ui-blocks/application-ui/forms/toggles/simple_toggle.jsx"), "export default function Toggle() {}", "utf8");
  writeFileSync(join(root, "react/ui-blocks/ecommerce/page-examples/product-pages/with_tabs.jsx"), "export default function Product() {}", "utf8");
  writeFileSync(join(root, "react/ui-blocks/marketing/sections/testimonials/simple.jsx"), "export default function Testimonial() {}", "utf8");
  writeFileSync(join(root, "catalyst-ui-kit/typescript/button.tsx"), "export function Button() {}", "utf8");
  writeFileSync(join(root, "TEMPLATES/tailwind-plus-salient/index.html"), "<html></html>", "utf8");
  return root;
}

test("inspectTailwindUiReference indexes local TailwindUI v4.1 without exposing source code", () => {
  const root = makeTailwindUiFixture();
  try {
    const result = inspectTailwindUiReference({ root });

    assert.equal(result.status, "pass");
    assert.equal(result.root, root);
    assert.equal(result.frameworks.react, true);
    assert.equal(result.frameworks.catalystUiKit, true);
    assert.ok(result.countsByExtension[".jsx"] >= 3);
    assert.ok(result.countsByExtension[".tsx"] >= 1);
    assert.ok(result.reactCategories.includes("application-ui"));
    assert.ok(result.reactCategories.includes("ecommerce"));
    assert.ok(result.templateFamilies.includes("tailwind-plus-salient"));
    assert.equal(result.policy.doNotBundleTailwindUiSource, true);
    assert.equal(result.policy.exposesSourceCode, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("planTailwindHeroUiAdoption treats TailwindUI as reference-only and maps primitives to HeroUI", () => {
  const plan = planTailwindHeroUiAdoption({
    patterns: ["application-ui", "ecommerce", "catalyst button", "table layout"],
    target: "HeroUI React admin dashboard"
  });

  assert.equal(plan.status, "pass");
  assert.ok(plan.allowedUses.some((item) => /layout/i.test(item)));
  assert.ok(plan.blockedUses.some((item) => /copy TailwindUI source/i.test(item)));
  assert.ok(plan.blockedUses.some((item) => /Catalyst/i.test(item)));
  assert.ok(plan.heroUiComponentMap.some((item) => item.tailwindUiPrimitive === "button" && item.heroUiComponent === "Button"));
  assert.ok(plan.tailwindV4Rules.some((item) => /@import "tailwindcss"/.test(item)));
});
