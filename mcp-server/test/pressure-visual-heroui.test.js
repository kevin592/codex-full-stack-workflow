import assert from "node:assert/strict";
import test from "node:test";

import { reviewHeroUiQuality } from "../src/craft.js";

test("implementation blocks when Pencil or Figma exports only include desktop", () => {
  const review = reviewHeroUiQuality({
    code: 'import { Button } from "@heroui/react"; export function Save(){ return <Button>Save</Button>; }',
    css: '@import "tailwindcss";\n@import "@heroui/styles";',
    visualConfirmation: {
      approved: true,
      exportedImages: ["desktop-dashboard.png"]
    }
  });

  assert.equal(review.status, "needs_revision");
  assert.ok(review.issues.some((issue) => issue.code === "missing-visual-export-categories"));
});

test("handwritten Button blocks when HeroUI Button exists", () => {
  const review = reviewHeroUiQuality({
    code: `
      import { cva } from "class-variance-authority";
      const buttonVariants = cva("inline-flex px-3 py-2");
      export function Button(props) { return <button className={buttonVariants()} {...props} />; }
    `,
    css: '@import "tailwindcss";\n@import "@heroui/styles";',
    visualConfirmation: {
      approved: true,
      exportedImages: ["desktop.png", "mobile.png", "component-detail.png", "state-matrix.png"]
    }
  });

  assert.ok(review.issues.some((issue) => issue.code === "handwritten-ui-official-available"));
});

test("shadcn Radix Base UI and CVA imports block", () => {
  const review = reviewHeroUiQuality({
    code: `
      import { Button } from "@/components/ui/button";
      import * as Dialog from "@radix-ui/react-dialog";
      import { Button as BaseButton } from "@base-ui/react/button";
      import { cva } from "class-variance-authority";
    `,
    css: '@import "tailwindcss";\n@import "@heroui/styles";',
    visualConfirmation: {
      approved: true,
      exportedImages: ["desktop.png", "mobile.png", "component-detail.png", "state-matrix.png"]
    }
  });

  const codes = review.issues.map((issue) => issue.code);
  assert.ok(codes.includes("shadcn-import"));
  assert.ok(codes.includes("handwritten-ui-official-available"));
});

test("HeroUI gap exception passes only with checked official sources and narrow local scope", () => {
  const missingEvidence = reviewHeroUiQuality({
    code: "export function Timeline(){ return <ol />; }",
    css: '@import "tailwindcss";\n@import "@heroui/styles";',
    heroUiGapJustification: "HeroUI has no timeline.",
    visualConfirmation: {
      approved: true,
      exportedImages: ["desktop.png", "mobile.png", "component-detail.png", "state-matrix.png"]
    }
  });

  assert.ok(missingEvidence.issues.some((issue) => issue.code === "incomplete-heroui-gap-exception"));

  const completeEvidence = reviewHeroUiQuality({
    code: "export function Timeline(){ return <ol className=\"grid gap-2\" />; }",
    css: '@import "tailwindcss";\n@import "@heroui/styles";',
    heroUiGapJustification:
      "Missing component: Timeline. Sources checked: AGENTS.md, llms-components.txt, heroui-react MCP list_components. Reason: no official timeline component. Local scope: one read-only timeline list in OrderDetailTimeline.",
    visualConfirmation: {
      approved: true,
      exportedImages: ["desktop.png", "mobile.png", "component-detail.png", "state-matrix.png"]
    }
  });

  assert.equal(completeEvidence.issues.some((issue) => issue.code === "incomplete-heroui-gap-exception"), false);
});

test("TailwindUI Catalyst and Headless UI source patterns block when HeroUI exists", () => {
  const review = reviewHeroUiQuality({
    code: `
      import { Button } from "@/catalyst/button";
      import { Dialog } from "@headlessui/react";
      import { Table } from "@/tailwind-plus/table";
    `,
    css: '@import "tailwindcss";\n@import "@heroui/styles";',
    visualConfirmation: {
      approved: true,
      exportedImages: ["desktop.png", "mobile.png", "component-detail.png", "state-matrix.png"]
    }
  });

  const codes = review.issues.map((issue) => issue.code);
  assert.ok(codes.includes("tailwindui-source-or-catalyst-import"));
  assert.ok(codes.includes("headlessui-import"));
});

test("Tailwind v3 directives block in HeroUI Tailwind v4 projects", () => {
  const review = reviewHeroUiQuality({
    code: 'import { Button } from "@heroui/react"; export function Save(){ return <Button>Save</Button>; }',
    css: "@tailwind base;\n@tailwind components;\n@tailwind utilities;",
    visualConfirmation: {
      approved: true,
      exportedImages: ["desktop.png", "mobile.png", "component-detail.png", "state-matrix.png"]
    }
  });

  assert.ok(review.issues.some((issue) => issue.code === "legacy-tailwind-directives"));
  assert.ok(review.issues.some((issue) => issue.code === "missing-heroui-styles-import"));
});
