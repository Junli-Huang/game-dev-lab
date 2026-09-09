# Daily Game Dev Topics

## Purpose

“每日游戏开发技巧”的目标不是按课程顺序系统教学，而是持续扩大开发者的 **已知未知（Known Unknowns）**。

重点不是：

```text
Unity 教程
C++ 教程
Shader 教程
```

而是从游戏中的具体可观察现象出发：

```text
游戏里出现了什么现象？
↓
背后是什么技术？
↓
核心算法 / 数学 / 系统是什么？
↓
为什么值得知道？
↓
是否值得做成可交互 Prototype？
```

长期目标：

> 将零散的游戏开发技巧逐步积累成一个可运行、可阅读、可实验的 Game Development Technology Atlas。

---

# Daily Topic Format

默认每次约：

```text
3 Topics
```

尽量跨领域，避免连续多次集中在同一种技术。

每条建议使用：

```text
Phenomenon
→ 游戏中能观察到什么

Core Idea
→ 背后的关键思想

Minimal Example
→ 最小化示例

Keywords
→ 可继续搜索/学习的关键词

Why It Matters
→ 为什么游戏开发者值得知道
```

可附加：

```text
Worth Deep Dive
Prototype Value
```

例如：

```text
Worth Deep Dive: High
Prototype Value: High
```

---

# Topic Domains

不按工具分类，而按游戏技术领域组织。

例如：

```text
Physics
Rendering
AI
Pathfinding
Procedural Generation
Animation
Networking
Simulation
Game Systems
Destruction
Audio
Optimization
World Generation
Geometry
Input
Camera
Crowd Simulation
```

同一个 Topic 可以属于多个 Domain。

---

# Prototype Pipeline

感兴趣的 Topic 可以进入：

```text
Introduced
↓
Explained
↓
Prototype
↓
Polished
```

默认 Prototype：

```text
H5
Browser Runnable
GitHub Pages
```

存放于：

```text
src/prototypes/<prototype-name>
```

除非后续已经发展成独立：

```text
Game
Tool
Library
Product
```

否则继续留在：

```text
game-dev-lab
```

---

# Topic Status

建议统一使用：

```text
Candidate
Introduced
Explained
Prototyping
Prototyped
Polished
```

含义：

### Candidate

已经进入候选池，但还没正式介绍。

### Introduced

已经在每日技巧中介绍过。

### Explained

已经进行过更深入讨论，但没有 Prototype。

### Prototyping

正在做 Prototype。

### Prototyped

Prototype 已经完成，可以运行。

### Polished

已经完成额外整理：

```text
教学文档
代码 Review
交互优化
Debug View
```

可以视为比较完整的 Lab Entry。

---

# Current Progress

## 001 — Verlet Rope

```text
Topic: 为什么 Verlet Rope 的硬度会受到 Constraint Iterations 影响？
—— 从 Verlet Integration 理解 Position-Based Dynamics
Domain:
- Physics
- Simulation

Status: Polished

V0.2.2 Expansion:
Existing Prototype / Completed

Prototype:
src/prototypes/verlet-rope

Core Concepts:
- Verlet Integration
- Position-Based Dynamics
- Position Constraints
- Constraint Iterations
- Constraint Error / Solver Convergence
- Physics Step Phases
- Fixed Timestep
- Kinematic / Controlled Point
- Ground Collision
```

核心教学点：

```text
velocity-like displacement
=
position - previousPosition
```

以及：

```text
Integrate
↓
Predicted Positions
↓
PBD-style Constraint Solve × N
↓
Collision
↓
Render
```

同时验证了一个重要架构原则：

```text
Input
→ Intent

Fixed Physics
→ Owns Simulation State

Renderer
→ Read Only
```

已完成：

```text
Previous Position Debug
Velocity Debug
Constraint Debug
Average / Max Constraint Error
Constraint Error Overlay
Dragging
Ground Collision
Pause
Frame Step
Solver Step
Prediction / Pass-by-Pass Convergence History
Loose / Normal / Tight / Heavy Gravity Presets
Parameter Controls
```

---

## 002 — Flow Field Pathfinding

```text
Topic: Flow Field Pathfinding
Domain:
- AI
- Pathfinding
- Crowd Navigation

Status: Polished

Prototype:
src/prototypes/flow-field
```

核心链路：

```text
Cost Field
↓
Integration Field
↓
Direction Field
↓
Agents
```

核心思想：

> 多个 Agent 不分别运行 A*，而是共享同一张导航 Field。

当前实现：

```text
8-neighbor Grid
Straight Cost = 1
Diagonal Cost = √2
No Corner Cutting

Normal Terrain = Cost 1
Mud = Cost 4
Obstacle = Unwalkable
```

支持：

```text
Set / Move Target
Paint Obstacle
Erase Obstacle
Paint Mud
Restore Normal Terrain
Spawn Agents
Agent Count
Agent Speed
```

Target：

```text
Mouse
+
WASD
+
Arrow Keys
```

Debug View：

```text
Normal
Cost
Integration
Direction
```

核心教学点：

```text
movementCost
=
cost of entering a cell
```

以及：

```text
Direction Choice
=
Edge Cost
+
Neighbor Integration Cost
```

还展示：

> Pathfinding 优化的是总 Cost，而不一定是几何距离。

已明确限制：

```text
No Local Avoidance
No Steering
No Agent Collision
```

这些属于独立的 Crowd Movement 问题。

---

## 003 — SDF Playground

```text
Topic: Signed Distance Field
Domain:
- Rendering
- Math
- VFX
- Gameplay Spatial Query

Status: Prototyping

Prototype:
src/prototypes/sdf-playground
```

核心定义：

```text
SDF(position)
→ signed distance to boundary
```

其中：

```text
distance < 0
→ Inside

distance = 0
→ Boundary

distance > 0
→ Outside
```

计划包含：

```text
Circle SDF
Box SDF

Distance View
Sign View
Contour View

Union
Intersection
Subtract
Smooth Union
```

同时重点补充实际游戏应用：

```text
UI Outline
Spell Area
Metaball
Collision Probe
```

核心教学目标已经调整为：

> 不只是理解 SDF 公式，而是理解一个 Distance Function 如何同时服务 Rendering、VFX 和 Gameplay Logic。

应用映射：

```text
distance < 0
→ Inside Test

abs(distance) < width
→ Outline

distance falloff
→ Glow / Soft Edge

distance(playerPosition)
→ Trigger / Collision / Range Query

smoothMin(a, b)
→ Metaball / Shape Fusion
```

---

## 004 — Crowd Steering Lab

```text
Topic: 为什么大量单位朝同一目标移动时不会全部堆在一起？
—— 从 Seek + Separation 理解 Local Steering
Domain:
- AI
- Simulation
- Crowd Movement

Status: Polished

V0.1.1:
Distance-weighted Separation / Completed

Prototype:
src/prototypes/crowd-steering

Core Concepts:
- Desired Velocity
- Seek Steering
- Separation Steering
- Neighbor Radius
- Weighted Steering
- Max Force / Max Speed
- Fixed Timestep
- O(N²) Neighbor Query
```

核心链路：

```text
Target
↓
Seek
+
Separation from Nearby Agents
↓
Weighted Sum
↓
Clamp Force / Speed
↓
Movement
```

核心教学点：

```text
Pathfinding
→ Where should I go?

Steering
→ How should I move right now?
```

以及：

```text
Separation
≠ Collision Resolution
```

已完成：

```text
Separation ON / OFF
Seek Only / Balanced / Strong Separation / Crowded Presets
Velocity / Seek / Separation / Final Steering Debug
Selected Agent Inspector
Neighbor Radius and Neighbor Highlight
Fixed 60 Hz Simulation
Distance-weighted Separation Magnitude
Pathfinding vs Steering
Separation vs Collision
Dead Zone vs Arrival
```

已明确限制：

```text
No Arrival / Cohesion / Alignment
No Obstacle Avoidance
No Agent Collision
No RVO / ORCA
No Flow Field Integration
No Spatial Partitioning
```

---

## 005 — Constraint Generation Lab

```text
Topic: 程序化生成为什么不等于随机摆放？
—— 从 Tile Candidates、Collapse 与 Constraint Propagation 理解 WFC Core
Domain:
- Procedural Generation
- Constraint Satisfaction
- World Generation

Status: Polished

V0.1.1:
Propagation Step Counter Semantics / Completed

Prototype:
src/prototypes/constraint-generation

Core Concepts:
- Tile Candidate Sets
- Directional Compatibility Rules
- Candidate-count Entropy
- Minimum Entropy Selection
- Collapse
- FIFO Constraint Propagation
- Contradiction
```

核心链路：

```text
Possibilities
↓
Minimum-Entropy Collapse
↓
Constraint Propagation
↓
Reduced Possibilities
↓
Repeat
```

核心教学点：

> 未 Collapse 的 Cell 不是空格，而是仍有多个合法状态。

以及：

```text
Collapse
→ 做出一个局部决定

Propagation
→ 让这个决定持续约束邻居
→ 由局部规则形成整体结构
```

已完成：

```text
12 × 8 Grid
Water / Sand / Grass / Forest
Explicit Up / Right / Down / Left Rules
Collapse Step
Propagation Step
Auto Run / Pause
Seed Replay / Random Seed
Entropy / Candidate Debug
Propagation Queue
Current / Changed / Queued Highlights
Contradiction State
```

统计语义：

```text
Collapse Decisions
= 实际执行的 Cell Collapse 决策次数

Propagation Steps
= 实际从 FIFO Queue 中取出并处理的 Source Cell 数量
```

即使某次 Propagation Step 最终发现 Contradiction，该 Step 仍然计数。

已明确限制：

```text
No Backtracking
No Weighted Randomness / Shannon Entropy
No Biomes / Large Maps
No Overlapping WFC / Pattern Learning
No Rule Editor / 3D
```

---

## 006 — Rollback Netcode Lab

- **Status:** Prototyped / Prototype
- **Version:** V0.1.1 · 2026-09-08
- **Domain:** Networking / Simulation
- **Prototype:** `src/prototypes/rollback-netcode`
- **Route:** `#/prototype/rollback-netcode`

核心链路：远端输入未到 → 使用最近已知输入预测 → 输入迟到并核对 →
恢复对应帧开始前的状态 → 重演保存的输入 → 修正当前位置。

已完成：

- Delay Based / Prediction / Rollback 三模式及一键实验预设。
- 60 Hz 固定逻辑帧、独立网络时钟、整数位置的确定性模拟。
- 单向延迟、抖动 / 乱序到包、实验性丢包与可选远端脚本。
- 300 帧输入历史 / 301 个边界快照；Delay 丢包积压满后明确停止。
- 最近 32 帧时间轴：C / P / M / R / ↻，可点击检查输入与快照。
- 修正残影、回滚深度、预测统计、连续确认帧及最大已收帧号。
- Pause / Step / Reset，键盘及触屏输入，中英文切换保留模拟状态。
- 核心回归测试及原型 README。

统计与时间语义：`stateHistory[N]` 是第 N 帧开始前的状态，Current Frame
是下一待执行帧。单步前进一个网络逻辑刻；Delay 等待时游戏帧可以不推进。
丢包没有重传，连续确认帧停在缺口前；不把最大已收到帧号误当作连续确认帧。

版本记录：

- V0.1 · 2026-09-07：首次实现，不包含真实联网、战斗、服务器权威或可靠传输。
- V0.1.1 · 2026-09-08：Step Tick / 单步 Tick；双时钟显示使用已执行网络 Tick 数
  与下一待模拟帧号；拆分 Speculative Depth 与 Missing Remote Inputs；醒目说明
  丢包无重传 / 输入冗余；历史 R / ↻ 标记与最近回滚范围双下划线区分；新增
  最近事件详情与 4 项语义回归测试。回滚核心算法不变。

---

## 007 — Behavior Tree vs Utility AI Lab

- **Status:** Prototyped / Acceptance checks passed
- **Version:** V0.1 · 2026-09-08
- **Domain:** AI / Decision Making
- **Prototype:** `src/prototypes/behavior-tree-utility`
- **Route:** `#/prototype/behavior-tree-utility`

核心对比：同一份 World State + 同一组 Action → 行为树结构优先级 vs 效用评分偏好。

已实现：Selector / Sequence / Condition / Action、短路与访问顺序、四种节点状态、
决策路径；六种行为的乘法评分、原始输入 / 归一化 / 最终效用、稳定同分规则；
六个预设与稳定的 Attack / Eat 分歧；滑块即时刷新、双语说明与 Reset。

验收：10 项新增核心测试及浏览器交互检查；不执行行为、不改变游戏状态、不做
Blackboard / 编辑器 / 连续模拟。007 V0.2 连续执行暂缓，须明确提出后再开发。

版本记录：V0.1 首次实现静态共享状态下的决策与 Debug 对比。

---

# Future Candidate Pool

以下只是候选池，不代表开发顺序。

## Animation / IK

```text
FABRIK IK
CCD IK
Spring Bone
Procedural Foot Placement
```

## AI / Movement

```text
Boids
Local Avoidance
ORCA / RVO
Influence Maps
Utility AI
Behavior Trees
GOAP
```

## Rendering

```text
Jump Flood Algorithm
2D Lighting
Shadow Casting
Normal Mapping
Parallax
Screen-space Effects
Dissolve
Voronoi
Domain Warping
```

## Procedural Generation

```text
Marching Squares
Cellular Automata
Poisson Disk Sampling
Noise / FBM
Constraint-based Generation
```

## Physics / Simulation

```text
Position Based Dynamics
XPBD
Soft Body
Fluid Approximation
Chain / Cloth
Destructible Terrain
```

## World / Geometry

```text
Signed Distance Fields
Marching Squares
Spatial Hash
Quadtree
BVH
Voronoi / Delaunay
```

## Networking

```text
Client Prediction
Server Reconciliation
Interpolation Buffer
Lag Compensation
Rollback
Lockstep
Snapshot Interpolation
```

候选池应持续扩充，不需要一次整理完整。

---

# Topic Selection Rules

每日选择新 Topic 时，应优先：

```text
1. 尚未 Introduced 的内容

2. 与最近几次不同领域

3. 游戏中有明显可观察现象

4. 背后存在值得掌握的通用技术

5. 能扩大 Known Unknowns

6. 必要时优先选择适合做 Prototype 的内容
```

避免：

```text
连续几天都是 Shader
连续几天都是 Pathfinding
连续几天都是某个具体引擎 API
```

---

# Repository as Source of Truth

关于每日技巧：

```text
长期规则 / 用户偏好
→ Conversation Memory

具体 Topic 进度
Prototype 状态
已经介绍过什么
→ game-dev-lab
```

`game-dev-lab` 应作为：

> Daily Game Dev Topic Progress 的事实来源（Source of Truth）。

后续选择每日技巧时，应参考本文件，避免重复已经介绍过的主题。

---

# Site Language

`game-dev-lab` 网页支持：

```text
简体中文（zh-CN）
English（en）
```

语言状态与 Simulation State 完全分离。后续新增 Prototype 时，所有用户可见文案必须同时提供中文与英文，并遵循 `docs/i18n-terminology.md` 的术语约定。

Current Implementation:

- Global language switcher
- zh-CN / en
- Browser-language detection
- localStorage persistence
- `document.documentElement.lang` synchronization
- Homepage localization
- Prototype metadata localization
- Prototype controls / teaching copy localization
- Runtime stats / phase message localization
- Shared terminology rules
- English fallback

架构原则：

```text
UI Language
↓
i18n Layer

Simulation / Algorithm
↓
Language Independent
```

语言切换不得重置 Prototype State，包括：

```text
Physics Step
Solver Step
Propagation Queue
Collapsed Cells
Seed
Random Sequence
Agent State
Debug State
```

Terminology:
`docs/i18n-terminology.md`

该术语表统一维护 Constraint、Constraint Propagation、Entropy、Minimum Entropy、Collapse、Steering、Separation、Solver、Position-Based Dynamics、Flow Field 与 Signed Distance Field 等术语；后续新增 Prototype 应遵循该术语表。

以后新增 Prototype 时，以下所有 User-visible Copy 必须同时提供 `en` 与 `zh-CN`：

```text
Title
Description
Controls
Debug View
Stats
Status Message
Recommended Experiment
Teaching Explanation
Error Message
Tooltip / aria-label
```

以下内容保持英文：

```text
Source Code
Identifiers
Function Names
Variable Names
Algorithm Pseudocode / Formula
Code Comments
```

中文教学正文第一次出现重要术语时使用：

```text
中文名称（English Term）
```

后续可使用简化中文名称。

## 008 — Cellular Material Lab V0.1 · 2026-09-08

已实现并通过验收检查：120×80 网格、Air/Sand/Water/Wood/Fire、固定 30 Hz、种子随机点燃、笔刷和五个预设。正常模式自底向上且每 Tick 最多主动更新一次；错误模式明确关闭移动保护并自顶向下。支持固定左优先与交替策略对比、真实规则追踪、六邻域和统计、中英文切换。新增 12 项核心测试，全库 34 项测试及浏览器交互、移动端检查通过。

详细规则与限制见 `src/prototypes/cellular-material/README.md`。V0.2 暂缓。

## 008 V0.1.1 · 2026-09-09 · implemented / pending review

修复 Water 平底左右周期振荡：沿连续 Air 路径搜索六格内下落出口，优先近处，等距使用原方向策略；每次只横移一格，无出口则 Stay。Debug 增加左右搜索结果与距离。未改变 Sand、Fire、每 Tick 更新保护和教学 Bug 模式。全库 38 项 DOM-free 测试通过，覆盖稳定 200 Tick、逐格到达出口并下落、无出口静止、等距确定性、距离/障碍/边界。等待 Review，不标 Accepted；不引入压力或 V0.2。

## 008 V0.1.2 · 2026-09-09 · implemented / pending review

按修订需求增加 Long-range Surface Equalization：6 格 Drop Search 保留；失败后仅表面水格沿连通水面边界搜索最多 24 列，目标液面至少低 2 格，优先最近、再低处、最后方向策略。实际仍只和相邻 Air 交换一格。障碍与不连通水柱截断，垂直观察也限制 24 格，不模拟压力。

新增“宽水池找平”预设：旧规则完全不动，新规则逐格迁移到 13 格外的低液面。全库 44 项测试覆盖守恒、最终高度差 ≤ 1、之后 200 Tick 静止、Drop 优先、内部格跳过、障碍与确定性；原水箱长时间运行也稳定。Debug 支持中英文液面坐标、差值、距离与原因。README / STATE 同步，等待 Review，未标 Accepted，不继续 V0.2。
