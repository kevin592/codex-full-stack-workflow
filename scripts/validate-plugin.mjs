#!/usr/bin/env node

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

function candidateValidators() {
  const home = homedir();
  return [
    process.env.CODEX_PLUGIN_VALIDATOR,
    resolve(home, ".codex/skills/.system/plugin-creator/scripts/validate_plugin.py"),
    resolve(home, ".codex/plugins/cache/openai-bundled/plugin-creator/scripts/validate_plugin.py")
  ].filter(Boolean);
}

function findValidator() {
  return candidateValidators().find((candidate) => existsSync(candidate));
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const pluginPath = resolve(args.find((arg) => arg !== "--dry-run") ?? process.cwd());
const validator = findValidator();

if (dryRun) {
  console.log(`validator=${validator ?? "unavailable"}`);
  console.log(`plugin=${pluginPath}`);
  process.exit(0);
}

if (!validator) {
  console.error("Could not locate validate_plugin.py. Set CODEX_PLUGIN_VALIDATOR to the validator path.");
  process.exit(1);
}

const result = spawnSync("python", [validator, pluginPath], {
  stdio: "inherit",
  cwd: pluginPath
});

process.exit(result.status ?? 1);
