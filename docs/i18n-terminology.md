# I18n Terminology

Game Dev Lab keeps code, formulas and algorithm identifiers in English. In Simplified Chinese teaching copy, introduce an important term with its English form on first use, then use the concise Chinese term consistently.

| English | 简体中文 |
| --- | --- |
| Constraint | 约束 |
| Constraint Propagation | 约束传播 |
| Candidate Set | 候选集 |
| Entropy | 熵 |
| Minimum Entropy | 最小熵 |
| Collapse | 坍缩 |
| Contradiction | 矛盾 / 冲突状态 |
| Steering | 转向行为 / 转向量 |
| Seek | 寻目标（保留 Seek） |
| Separation | 分离行为（Separation） |
| Neighbor Radius | 邻居半径 |
| Desired Velocity | 期望速度 |
| Max Force | 最大转向力 |
| Max Speed | 最大速度 |
| Solver | 求解器 |
| Solver Iteration | 求解器迭代 |
| Constraint Pass | 约束迭代轮次（Constraint Pass） |
| Constraint Error | 约束误差 |
| Prediction | 位置预测 |
| Frame Step | 帧步进 |
| Solver Step | 求解器步进 |
| Position-Based Dynamics | 基于位置的动力学（PBD） |
| Flow Field | 流场（Flow Field） |
| Signed Distance Field | 有符号距离场（SDF） |

## Development Rule

Every new user-visible string must have both `en` and `zh-CN` entries. Translation keys use semantic namespaces such as `common.*`, `home.*`, and a Prototype namespace. Missing Simplified Chinese text falls back to English; algorithms and Simulation State must never branch on UI language.
