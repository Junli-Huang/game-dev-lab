import type { PrototypeDefinition } from '../../app/types';
import { metadata } from './metadata';
import { mountRollback } from './prototype';
import './style.css';
export const rollbackNetcode: PrototypeDefinition = { metadata, render: mountRollback };
