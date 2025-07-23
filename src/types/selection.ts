import type { Zone } from './zone';

/**
 * Selection state for zones
 */
export interface SelectionState {
  /** Currently selected zone IDs */
  selectedIds: Set<string>;
  
  /** Selection order for multi-select */
  selectionOrder: string[];
  
  /** Last selected zone ID */
  lastSelectedId?: string;
  
  /** Selection mode */
  mode: SelectionMode;
  
  /** Selection constraints */
  constraints?: SelectionConstraints;
}

/**
 * Selection modes
 */
export type SelectionMode = 'single' | 'multiple' | 'range' | 'adjacent';

/**
 * Constraints for zone selection
 */
export interface SelectionConstraints {
  /** Maximum number of selections */
  maxSelections?: number;
  
  /** Minimum number of selections */
  minSelections?: number;
  
  /** Maximum total area (square meters) */
  maxArea?: number;
  
  /** Minimum total area (square meters) */
  minArea?: number;
  
  /** Only allow adjacent zone selection */
  adjacentOnly?: boolean;
  
  /** Custom validation function */
  validate?: (zones: Zone[]) => boolean | string;
}

/**
 * Selection change event
 */
export interface SelectionChangeEvent {
  /** Newly selected zones */
  added: Zone[];
  
  /** Newly deselected zones */
  removed: Zone[];
  
  /** All currently selected zones */
  current: Zone[];
  
  /** Trigger source */
  source: 'click' | 'keyboard' | 'api' | 'draw';
}