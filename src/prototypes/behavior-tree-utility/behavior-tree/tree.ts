import type { Node } from './nodes';
export const BT_RULES = { enemyNearDistance: 8, lowHealth: 30, emptyAmmo: 0, highHunger: 70, highFatigue: 75 } as const;
export const BT_TREE: Node = {
  id: 'root', type: 'selector', children: [
    { id: 'combat', type: 'sequence', children: [
      { id: 'enemyNear', type: 'condition', field: 'enemyDistance', operator: '<=', threshold: BT_RULES.enemyNearDistance },
      { id: 'combatChoice', type: 'selector', children: [
        { id: 'runBranch', type: 'sequence', children: [
          { id: 'lowHealth', type: 'condition', field: 'health', operator: '<=', threshold: BT_RULES.lowHealth },
          { id: 'run', type: 'action', action: 'run' },
        ] },
        { id: 'reloadBranch', type: 'sequence', children: [
          { id: 'emptyAmmo', type: 'condition', field: 'ammo', operator: '==', threshold: BT_RULES.emptyAmmo },
          { id: 'reload', type: 'action', action: 'reload' },
        ] },
        { id: 'attack', type: 'action', action: 'attack' },
      ] },
    ] },
    { id: 'hungerBranch', type: 'sequence', children: [
      { id: 'highHunger', type: 'condition', field: 'hunger', operator: '>=', threshold: BT_RULES.highHunger },
      { id: 'eat', type: 'action', action: 'eat' },
    ] },
    { id: 'fatigueBranch', type: 'sequence', children: [
      { id: 'highFatigue', type: 'condition', field: 'fatigue', operator: '>=', threshold: BT_RULES.highFatigue },
      { id: 'sleep', type: 'action', action: 'sleep' },
    ] },
    { id: 'explore', type: 'action', action: 'explore' },
  ],
};
