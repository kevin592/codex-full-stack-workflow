import { existsSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const DEFAULT_TAILWIND_UI_ROOT =
  "D:\\BaiduNetdiskDownload\\TailwindUI 持续更新\\tailwindui plus 20250831\\tailwindui plus 20250831\\v4.1";

const PRIMITIVE_MAP = [
  ["button", "Button"],
  ["badge", "Badge"],
  ["table", "Table"],
  ["dialog", "Modal"],
  ["drawer", "Drawer"],
  ["input", "Input"],
  ["select", "Select"],
  ["combobox", "ComboBox"],
  ["checkbox", "Checkbox"],
  ["radio", "RadioGroup"],
  ["switch", "Switch"],
  ["pagination", "Pagination"],
  ["navbar", "Navbar"],
  ["tabs", "Tabs"],
  ["textarea", "TextArea"]
];

function safeReadDir(path) {
  try {
    return readdirSync(path, { withFileTypes: true });
  } catch {
    return [];
  }
}

function walkFiles(root, result = []) {
  for (const entry of safeReadDir(root)) {
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, result);
    } else if (entry.isFile()) {
      result.push(fullPath);
    }
  }
  return result;
}

function directoryNames(path) {
  return safeReadDir(path)
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function countExtensions(files) {
  const counts = {};
  for (const file of files) {
    const extension = extname(file) || "(none)";
    counts[extension] = (counts[extension] ?? 0) + 1;
  }
  return counts;
}

export function inspectTailwindUiReference(input = {}) {
  const root = input.root ?? DEFAULT_TAILWIND_UI_ROOT;

  if (!existsSync(root) || !statSync(root).isDirectory()) {
    return {
      status: "blocked",
      root,
      issues: [
        {
          code: "tailwind-ui-reference-not-found",
          reason: "The configured TailwindUI reference root does not exist.",
          requiredFix: "Pass a valid local TailwindUI v4.1 root path."
        }
      ]
    };
  }

  const files = walkFiles(root);
  const topLevelDirs = directoryNames(root);
  const reactUiBlocks = join(root, "react", "ui-blocks");
  const templatesRoot = join(root, "TEMPLATES");

  return {
    status: "pass",
    root,
    topLevelDirs,
    frameworks: {
      react: existsSync(join(root, "react")),
      html: existsSync(join(root, "html")),
      vue: existsSync(join(root, "vue")),
      preview: existsSync(join(root, "preview")),
      catalystUiKit: existsSync(join(root, "catalyst-ui-kit")),
      templates: existsSync(templatesRoot)
    },
    countsByExtension: countExtensions(files),
    reactCategories: directoryNames(reactUiBlocks),
    templateFamilies: directoryNames(templatesRoot),
    policy: {
      referenceOnly: true,
      doNotBundleTailwindUiSource: true,
      doNotCopyTemplateCodeIntoPlugin: true,
      exposesSourceCode: false,
      allowedUse:
        "Use local TailwindUI as a licensed visual/reference library for IA, layout density, responsive patterns, and screenshots; translate implementation to HeroUI official components."
    }
  };
}

export function planTailwindHeroUiAdoption(input = {}) {
  const patterns = Array.isArray(input.patterns) ? input.patterns : [];
  const patternText = patterns.join(" ").toLowerCase();
  const heroUiComponentMap = PRIMITIVE_MAP.filter(([primitive]) => patternText.includes(primitive)).map(
    ([tailwindUiPrimitive, heroUiComponent]) => ({
      tailwindUiPrimitive,
      heroUiComponent,
      rule: `Use @heroui/react ${heroUiComponent}; do not copy TailwindUI or Catalyst ${tailwindUiPrimitive} source.`
    })
  );

  return {
    status: "pass",
    target: input.target ?? "HeroUI React surface",
    allowedUses: [
      "Use TailwindUI React and template folders as local visual references for layout density, hierarchy, and responsive compositions.",
      "Use preview/html outputs as screenshot inspiration for Pencil/Figma boards.",
      "Use file names and categories as an index for product pattern discovery.",
      "Extract product-level ideas, not source code, props, class strings, or assets."
    ],
    blockedUses: [
      "Do not copy TailwindUI source code into this plugin or generated project artifacts.",
      "Do not bundle TailwindUI templates, screenshots, assets, or Catalyst UI Kit source into the plugin.",
      "Do not use Catalyst primitives when an official HeroUI component exists.",
      "Do not replace HeroUI Official Component First with TailwindUI, Headless UI, or Catalyst components."
    ],
    heroUiComponentMap,
    tailwindV4Rules: [
      "Use Tailwind CSS v4 import style: @import \"tailwindcss\";",
      "For HeroUI React v3, import @import \"@heroui/styles\" after Tailwind.",
      "Prefer HeroUI semantic tokens and CSS variables over raw Tailwind color palettes.",
      "Use Tailwind utility classes for layout constraints, responsive grids, spacing, and overflow guards around HeroUI components."
    ],
    nextActions: [
      "Run inspect_tailwind_ui_reference with the local TailwindUI v4.1 path.",
      "Use generated categories to choose visual references for Pencil/Figma.",
      "Map visible controls to HeroUI via select_hero_ui_components.",
      "Document any TailwindUI-inspired layout as reference-only in the visual evidence artifact."
    ]
  };
}
