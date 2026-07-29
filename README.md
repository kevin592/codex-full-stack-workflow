# Codex Full-Stack Workflow

[![CI](https://github.com/kevin592/codex-full-stack-workflow/actions/workflows/ci.yml/badge.svg)](https://github.com/kevin592/codex-full-stack-workflow/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

An open-source Codex plugin that turns rough product requests into staged,
reviewable full-stack delivery.

AI coding agents can move quickly while still missing requirements, API
contracts, UI states, change impact, or verification evidence. This plugin adds
a persistent workflow around those failure modes: requirements become
artifacts, each delivery stage has an explicit gate, changes regress the
affected stages, and completion requires test and review evidence.

中文简介：这是一个面向 Codex 的全栈开发工作流插件，将模糊需求整理为可追踪的项目工件，并通过阶段门禁、变更回归、视觉证据和质量审计降低 AI 开发中的遗漏。

## What it provides

- Requirement discovery and a fixed project requirements workspace
- Artifact registry with producer, consumer, pass-condition, and failure-route contracts
- Stage gates for product scope, architecture, implementation, visual design, and verification
- Change-control rules that invalidate stale downstream artifacts
- Full-stack implementation planning with TDD and code-review gates
- HeroUI React component mapping and official documentation snapshots
- Desktop/mobile visual-evidence checks
- Backend contract, code-review, and completion audits
- A local MCP server exposing the workflow as structured tools
- 91 automated tests covering unit, contract, pressure, and end-to-end scenarios

## Install in Codex

The repository includes a Codex marketplace manifest, so the plugin can be
installed directly from GitHub:

```bash
codex plugin marketplace add kevin592/codex-full-stack-workflow
codex plugin add full-stack-development@kevin592-codex-workflows
```

Start a new Codex conversation after installation, then try:

```text
Use full-stack-development to turn this rough request into a gated project plan:
build a small ecommerce admin dashboard.
```

You can inspect installed plugins with:

```bash
codex plugin list --json
```

## Develop locally

Requirements:

- Node.js 20 or newer
- npm
- Codex, when testing the installed plugin

```bash
git clone https://github.com/kevin592/codex-full-stack-workflow.git
cd codex-full-stack-workflow/plugins/full-stack-development/mcp-server
npm ci
npm test
```

Validate the plugin structure from the plugin root when the Codex plugin
validator is installed:

```bash
cd ..
node ./scripts/validate-plugin.mjs
```

Run the MCP server over stdio:

```bash
cd mcp-server
npm start
```

## Repository layout

```text
.agents/plugins/marketplace.json        Git-backed Codex marketplace
plugins/full-stack-development/
  .codex-plugin/plugin.json             Plugin manifest
  .mcp.json                             MCP server registration
  skills/                               Workflow skills and references
  mcp-server/src/                       MCP tools and workflow contracts
  mcp-server/test/                      Automated test suite
  scripts/                              Validation and documentation sync
docs/                                   Example generated requirement artifacts
```

## Maintenance

Issues and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md)
before proposing a change. Security reports should follow
[SECURITY.md](SECURITY.md).

The bundled HeroUI documentation snapshot is traceable through a generated
manifest containing source URLs and SHA-256 hashes. See
[NOTICE](NOTICE) for third-party attribution.

## License

Licensed under the [Apache License 2.0](LICENSE).
