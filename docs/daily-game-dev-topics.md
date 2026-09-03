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

Status: Prototyped

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
Wave Function Collapse
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
