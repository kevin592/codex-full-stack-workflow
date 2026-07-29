# 需求发现: 全流程 Codex 通用产品开发插件

## Confirmed Facts

- 当前开发对象是 `full-stack-development` 插件，不是一个具体业务系统。
- 插件目标是支持 Codex 完成通用产品开发全流程: 需求澄清、合同化产物、阶段门禁、变更控制、设计图确认、前端实现、后端/API/数据合同、测试、代码审查、完成前验证。
- HeroUI 只作为 React Web UI 子系统，不能再把插件目标缩窄为 HeroUI 前端插件。
- 用户强调需求澄清阶段不能要求用户懂信息架构、交互矩阵、状态图、工程合同；这些必须由 agent 起草。
- 用户强调每个阶段都要压力测试，尤其要测试需求澄清是否既不无限澄清，也不含糊交付。
- 用户强调如果下游阶段出现需求更改，必须能记录、回退、重新验证。

## AI Assumptions

- 插件 v0.2.0 先升级本地 MCP、Skill 和测试，不先做远程服务或 UI 控制台。
- 第一阶段以 deterministic MCP 工具为核心，因为只有工具层可被稳定测试。
- 设计图门禁本轮不要求给插件自身画 UI；但必须验证插件对未来 UI 项目会强制 Pencil/Figma 和 HeroUI 官方体系。
- 需求澄清压力测试应使用 fixture，而不是依赖真实用户反复对话。

## Open Questions

- 是否需要把 Superpowers 的子代理执行能力完整复制进插件，还是只在 Skill 文档中引用其执行纪律。
- 是否需要把“毒舌产品经理 5.0”的自进化能力放入 v0.2.0，还是放到 v0.3.0。
- 插件发布目标是否只保留 personal marketplace，还是准备远程共享版。

## Out of Scope

- 不开发具体电商后台 UI。
- 不迁移用户已有业务项目。
- 不把 HeroUI v2 / NextUI migration 放进默认流程。
- 不在没有用户批准的情况下自动发布插件。

## Downstream Use

- `product-scope-builder` 用本文件划定 P0/P1/P2。
- `pressure-test-planner` 用本文件定义压力测试边界。
- `implementation-planner` 用本文件确保任务拆解不会偏成单纯前端插件。

## PASS Condition

- 下游只读本文件，不读聊天记录，也能知道插件要解决什么问题、不能做什么、哪些问题仍未确认。

## Failure Route

- 如果下游无法判断插件目标，回退到 `requirement-discovery`。

