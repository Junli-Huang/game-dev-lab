# Game Dev Lab

[English](README.md) | [简体中文](README.zh-CN.md)

通过交互原型探索游戏开发技术、算法与视觉效果。

Game Dev Lab 从游戏中的可观察现象出发，将核心思路、可读实现与可运行的 H5 Demo 连接起来。它是一份可以持续扩展的游戏开发技术图谱，而不是完整游戏或传统课程网站。

网站支持简体中文与 English。语言选择会保存在浏览器中，切换语言不会重置正在运行的模拟状态。

## 本地运行

```bash
npm install
npm run dev
```

使用 `npm run build` 进行 TypeScript 检查并生成 `dist/` 生产站点。

## 添加 Prototype

在 `src/prototypes/` 下创建目录，实现 Metadata 与生命周期，然后注册到 `src/app/prototype-registry.ts`。参见[原型开发指南](docs/prototype-guide.md)。

所有新增的用户可见文案必须同时提供 `en` 与 `zh-CN` 翻译。代码、公式、状态枚举和算法实现保持英文且与语言状态完全解耦。

## 每日选题

[Daily Game Dev Topics](docs/daily-game-dev-topics.md) 是已介绍主题、Prototype 进度、选题规则与候选池的事实来源。

## 目录结构

- `src/app/`：路由、共享类型与 Prototype 注册
- `src/components/`：站点通用 UI
- `src/i18n/`：语言状态、英文与简体中文资源
- `src/prototypes/`：相互独立的交互实验
- `docs/`：架构、术语与开发说明
- `.github/workflows/pages.yml`：GitHub Pages 自动部署

## GitHub Pages

推送到 `main` 后会自动构建并部署至 <https://junli-huang.github.io/game-dev-lab/>。

## 回滚网络实验室

新增 **006 — Rollback Netcode Lab V0.1.1**：通过本地网络模拟、时间轴和修正残影，对比等待输入、输入预测与回滚。

[Prototype README](src/prototypes/rollback-netcode/README.md) · `#/prototype/rollback-netcode`

`npm test`

## 007 — Behavior Tree vs Utility AI Lab V0.1

用同一份世界状态对比行为树结构优先级与效用评分，观察真实执行路径、分数拆解及稳定的决策分歧。

[Prototype README](src/prototypes/behavior-tree-utility/README.md) · `#/prototype/behavior-tree-utility`

## 008 — Cellular Material Lab V0.1.1

五种材料、确定性火焰、连续绘制、真实规则追踪，以及更新顺序和方向偏置实验。

[Open / 打开实验](https://junli-huang.github.io/game-dev-lab/#/prototype/cellular-material) · [Implementation notes](src/prototypes/cellular-material/README.md)
