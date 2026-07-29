import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(__dirname, "../..");
const script = resolve(pluginRoot, "scripts/validate-plugin.mjs");

test("validate-plugin script locates the system plugin validator", () => {
  const result = spawnSync("node", [script, "--dry-run", pluginRoot], {
    cwd: pluginRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /validator=(?:.*validate_plugin\.py|unavailable)/);
  assert.match(result.stdout, /plugin=.+/);
});
