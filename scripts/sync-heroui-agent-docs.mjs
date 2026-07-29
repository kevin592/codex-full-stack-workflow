#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(scriptDir, "..");
const officialRoot = join(pluginRoot, "skills", "hero-ui-craft", "references", "official", "react");
const docsRoot = join(officialRoot, ".heroui-docs", "react");

const agentCommand = "npx heroui-cli@latest agents-md --react --output AGENTS.md";
const documents = {
  agents: {
    relativePath: "AGENTS.md",
    source: "https://www.heroui.com/docs/react/getting-started/agents-md",
    generatedBy: agentCommand
  },
  llms: {
    relativePath: "llms.txt",
    source: "https://heroui.com/react/llms.txt"
  },
  components: {
    relativePath: "llms-components.txt",
    source: "https://heroui.com/react/llms-components.txt"
  },
  patterns: {
    relativePath: "llms-patterns.txt",
    source: "https://heroui.com/react/llms-patterns.txt"
  },
  full: {
    relativePath: "llms-full.txt",
    source: "https://heroui.com/react/llms-full.txt"
  }
};

function assertSafeTarget() {
  const normalizedRoot = resolve(pluginRoot);
  const normalizedTarget = resolve(officialRoot);

  if (!normalizedTarget.startsWith(normalizedRoot) || !normalizedTarget.endsWith(join("references", "official", "react"))) {
    throw new Error(`Refusing to replace unexpected path: ${normalizedTarget}`);
  }
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const quoteForCmd = (arg) =>
      /^[^\s"&|<>^]+$/.test(arg) ? arg : `"${arg.replaceAll('"', '""')}"`;
    const executable = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : command;
    const executableArgs =
      process.platform === "win32"
        ? ["/d", "/s", "/c", [command, ...args].map(quoteForCmd).join(" ")]
        : args;
    const child = spawn(executable, executableArgs, {
      ...options,
      shell: false,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
      }
    });
  });
}

async function downloadText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "hero-ui-craft-sync/0.1"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  if (text.length < 100) {
    throw new Error(`Downloaded ${url} but content looked too small (${text.length} bytes)`);
  }
  return text;
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function readDocumentMetadata(entry) {
  const absolutePath = join(officialRoot, entry.relativePath);
  const content = await readFile(absolutePath, "utf8");

  return {
    ...entry,
    path: entry.relativePath.replaceAll("\\", "/"),
    bytes: Buffer.byteLength(content),
    sha256: sha256(content)
  };
}

async function main() {
  assertSafeTarget();
  await rm(officialRoot, { recursive: true, force: true });
  await mkdir(officialRoot, { recursive: true });

  await run("npx", ["-y", "heroui-cli@latest", "agents-md", "--react", "--output", "AGENTS.md"], {
    cwd: officialRoot,
    env: {
      ...process.env,
      HEROUI_ANALYTICS_DISABLED: "1"
    }
  });

  await rm(join(officialRoot, ".gitignore"), { force: true });

  for (const [key, entry] of Object.entries(documents)) {
    if (key === "agents") {
      continue;
    }
    const text = await downloadText(entry.source);
    await writeFile(join(officialRoot, entry.relativePath), text, "utf8");
  }

  const metadata = {};
  for (const [key, entry] of Object.entries(documents)) {
    metadata[key] = await readDocumentMetadata(entry);
  }

  const manifest = {
    library: "HeroUI React v3",
    primaryDoc: "AGENTS.md",
    generated: {
      at: new Date().toISOString(),
      command: agentCommand,
      analyticsDisabled: true,
      pluginRoot: pluginRoot.replaceAll("\\", "/"),
      docsRoot: relative(officialRoot, docsRoot).replaceAll("\\", "/")
    },
    documents: metadata
  };

  await writeFile(join(officialRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`Synced HeroUI official agent docs to ${officialRoot}`);
}

await main();
