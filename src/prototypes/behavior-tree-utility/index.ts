import type { PrototypeDefinition } from '../../app/types';
import { metadata } from './metadata';
import { mountDecisionLab } from './prototype';
import './style.css';
export const behaviorTreeUtility: PrototypeDefinition = { metadata, render: mountDecisionLab };
