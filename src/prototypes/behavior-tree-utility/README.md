# 007 — Behavior Tree vs Utility AI Lab · V0.1

Status: Prototype. Route: `#/prototype/behavior-tree-utility`.

Two pure evaluators read **the same WorldState** and share six Action IDs. This is a
static decision comparison, not a continuous simulation or a claim that one AI is better.
English / Simplified Chinese switching preserves sliders, decisions and open score details.

## Try It in One Minute

1. Choose **Healthy Combat**: both select Attack.
2. Choose **Different Decision**: BT selects Attack; Utility selects Eat.
3. Inspect the BT visit numbers and skipped Hunger branch. Expand Eat / Attack on the
   Utility side to compare raw inputs, mappings, consideration scores and final products.
4. Lower Health to 15: BT now selects Run Away. Utility still prefers Eat in this hungry
   state because that scoring policy is configured differently.
5. Reset restores Healthy Combat; it does not reset language.

## What Is a Behavior Tree?

A tree organizes conditions and actions. Priority is encoded in its structure and child
order; traversal can stop before other branches are tested (short-circuit evaluation).

| Node | Child evaluation and result |
| --- | --- |
| Selector | Left to right; first Success / Running is returned; all Failure → Failure |
| Sequence | Left to right; first Failure / Running is returned; all Success → Success |
| Condition | Compare a world input with a configured threshold; Success or Failure |
| Action | Select an Action ID and return Success immediately in V0.1 |

`Running` remains in the status model and composite propagation is tested, but no action
has duration in this version. `Not Evaluated` means a node was never visited; it is not
Failure. Every evaluation builds a fresh debug result so old visits cannot leak forward.

The fixed tree prioritizes Combat → Hunger → Fatigue → Explore. Combat checks low health,
then empty ammo, otherwise Attack. Conditions live in `BT_RULES`:

| Condition | Rule |
| --- | --- |
| Enemy near | Enemy Distance ≤ 8 |
| Low health | Health ≤ 30 |
| Ammo empty | Ammo = 0 |
| High hunger | Hunger ≥ 70 |
| High fatigue | Fatigue ≥ 75 |

The indented node list is in tree order. Numbered badges give actual traversal order;
statuses describe returned results. Decision Path shows the ancestors of the selected
Action, while Why This Decision lists conditions actually tested, including failed ones.
The entire skipped subtree is retained in debug output with `not-evaluated` status.

## What Is Utility AI?

Every action evaluates considerations, maps inputs into scores, combines them, and then
compares final utilities. A consideration is one factor influencing the desirability of
an action, such as hunger or enemy proximity.

```text
Final Score = Base Score × Consideration 1 × Consideration 2 × ...
```

There is no unique standard Utility AI formula. This prototype uses multiplication for
teaching: one zero factor gates the entire product. All factors are in 0…1. Continuous
mappings use `clamp01(input / maximum)` or its inverse; ammo presence is binary.

| Action | Base | Considerations |
| --- | --- | --- |
| Attack | 1 | enemyNear × health01 × hasAmmo |
| Run Away | 1 | enemyNear × (1 − health01) |
| Reload | 1 | (1 − ammo01) × enemyNear |
| Eat | 1 | hunger01 |
| Sleep | 1 | fatigue01 |
| Explore | 0.2 | (1 − hunger01) × (1 − fatigue01) × enemyFar |

`health01 = Health / 100`, `hunger01 = Hunger / 100`, `fatigue01 = Fatigue / 100`,
`ammo01 = Ammo / 10`, `enemyFar = EnemyDistance / 30`, `enemyNear = 1 − enemyFar`,
`hasAmmo = Ammo > 0 ? 1 : 0` (normalized values are clamped).

The definition order is **Attack, Run Away, Reload, Eat, Sleep, Explore**. Exact ties
choose the first defined action. Scores are neither randomized nor rounded before
selection. The UI sorts a copy by full-precision score; displayed values use two decimal
places, so equal-looking labels need not be exact ties. Products use an approximation
symbol because displayed factors are rounded.

## Shared State and Presets

Health / Hunger / Fatigue range from 0 to 100; Ammo from 0 to 10; Enemy Distance from 0
to 30. Larger Hunger / Fatigue mean stronger needs; larger distance means a farther enemy.
Health 0 represents dead in the input vocabulary, but there is **no death handling**:
the evaluators still rank the fixed six actions. This is not a valid full NPC life cycle.

| Preset | H / Hunger / Ammo / Fatigue / Distance | BT | Utility |
| --- | --- | --- | --- |
| Healthy Combat | 90 / 20 / 8 / 20 / 4 | Attack | Attack |
| Critical Health | 15 / 20 / 5 / 10 / 3 | Run Away | Run Away |
| Hungry, Enemy Nearby | 70 / 95 / 5 / 20 / 5 | Attack | Eat |
| Peaceful Needs | 80 / 90 / 5 / 20 / 25 | Eat | Eat |
| Exhausted | 80 / 20 / 5 / 95 / 25 | Sleep | Sleep |
| Different Decision | 45 / 90 / 6 / 20 / 6 | Attack | Eat |

In Different Decision, BT reaches Attack before inspecting Hunger. Utility scores Attack
at 0.36, Run Away at 0.44, Reload at 0.32, Eat at 0.90, Sleep at 0.20 and Explore at 0.0032.
Divergence is a reproducible consequence of those configured policies.

## Core Difference / 核心区别

行为树把优先级写进结构，通过遍历和短路选择行为；效用 AI 把偏好程度写进评分
函数，评估全部行为后选最高分。两者是不同的决策组织方式，没有必然的高低级
之分，也可以混合使用，例如行为树先选择战斗，再由效用选择器比较战斗行为。

| Behavior Tree | Utility AI |
| --- | --- |
| Shared WorldState → Traverse tree | Shared WorldState → Score every action |
| First successful branch | Highest unrounded utility |
| Selected Action ID | Selected Action ID |

## Code Reading Path

- `world-state.ts`, `actions.ts`, `presets.ts`: shared vocabulary, ranges and reproducible inputs.
- `behavior-tree/nodes.ts`, `tree.ts`, `evaluator.ts`: four node types, rules, traversal and trace.
- `utility-ai/considerations.ts`, `scoring.ts`: raw inputs, mappings, products and stable selection.
- `renderer.ts`: reads results, renders statuses, score details and explanations.
- `prototype.ts`: sliders, presets, reset, cached decisions and localization lifecycle.
- `../../i18n/decision.ts`: typed bilingual text.

Both core evaluators are DOM-free and accept `Readonly<WorldState>`. No action changes
state. Only sliders, presets and Reset write it. The renderer never decides an action.

## Limits and Future Work

No action execution, damage, navigation, animation, death handling, blackboard framework,
visual tree editor, decorators, services, parallel nodes, curve editor, cooldown, action
commitment, hysteresis, AI memory, GOAP or machine learning. A Blackboard is a common BT
companion; here the tree reads WorldState directly. There is no timer or animation loop.

Later possibilities: V0.2 continuous action execution; V0.3 stability; V0.4 response curves;
V0.5 hybrid AI. These are **deferred** until explicitly requested.

## Validation

`npm test` includes 10 new DOM-free tests for presets, thresholds, short-circuiting,
composite success/failure/Running, all-action scoring, max selection, exact ties vs display
rounding, ammo gate, reproducible divergence and immutable input. `npm run build` checks
TypeScript and the production bundle. Browser acceptance checks cover immediate shared
state updates, score details, locale preservation, Reset, mobile layout and route cleanup.
