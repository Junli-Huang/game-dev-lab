import type { PrototypeDefinition } from '../../app/types';
import { metadata } from './metadata';
import { mountCellular } from './prototype';
import './style.css';
export const cellularMaterial: PrototypeDefinition = { metadata, render: mountCellular };
