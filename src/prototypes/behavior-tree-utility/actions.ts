// Also defines the deterministic Utility tie-break order.
export const ACTION_IDS = ['attack', 'run', 'reload', 'eat', 'sleep', 'explore'] as const;
export type ActionId = typeof ACTION_IDS[number];
