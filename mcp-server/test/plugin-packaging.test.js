import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(__dirname, "../..");

test("plugin MCP config runs from the installed plugin root instead of a source-only absolute path", () => {
  const config = JSON.parse(readFileSync(join(pluginRoot, ".mcp.json"), "utf8"));
  const server = config.mcpServers["full-stack-development"];

  assert.equal(server.cwd, ".");
  assert.equal(server.command, "node");
  assert.deepEqual(server.args, ["./mcp-server/src/index.js"]);
  assert.equal(server.args.some((arg) => /C:[/\\]Users[/\\]ROOT[/\\]plugins/.test(arg)), false);
});

