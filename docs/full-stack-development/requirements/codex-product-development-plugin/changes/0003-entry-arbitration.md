# Change 0003 - Entry Arbitration For One-Line Design Requests

## Trigger

Natural and explicit plugin tests showed that a one-line request such as:

`@full-stack-development@personal I want a high-end coffee brand website, make the front-end design draft first, do not develop.`

did not start the fixed requirement workspace. The agent mentioned `full-stack-development`, but `brainstorming` and visual companion behavior still ran before requirement discovery.

## Confirmed Gap

- `full-stack-development` did not clearly claim priority over `brainstorming` for product/site/design-draft entry.
- `requirement-discovery` did not explicitly cover one-line website, landing page, brand site, and "do not develop yet" requests.
- The first observable action could become browser/visual companion instead of `generate_requirement_workspace`.

## Change

- Strengthen the top-level skill frontmatter and add an Entry Arbitration section.
- Strengthen `requirement-discovery` frontmatter and add an Entry Rule.
- Add regression tests that require:
  - `full-stack-development` to be used first for website, landing page, brand site, and front-end design draft requests.
  - `requirement-discovery` to run before brainstorming, visual companion, Pencil/Figma, or implementation.

## Expected Behavior

For one-line product/site/design requests, the first observable actions must be:

1. Inspect the workspace.
2. Run lifecycle hook coverage when available.
3. Call `generate_requirement_workspace`.
4. Draft requirement-discovery artifacts in the fixed workspace.
5. State that Pencil/Figma and implementation remain blocked until requirement review and user confirmation pass.

## Reverification

- Run MCP test suite.
- Run plugin validator.
- Start a clean thread with only:
  `@full-stack-development@personal 我要做一个高端咖啡品牌官网，先做前端设计稿，不要开发。`
- Verify that requirement discovery starts before visual companion or Pencil/Figma.
