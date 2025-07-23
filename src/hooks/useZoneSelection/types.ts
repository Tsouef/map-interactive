import type { LatLngBounds } from 'leaflet';
import type { Zone } from '@/types';

/**
 * Selection mode for zone selection
 */
export type SelectionMode = 'single' | 'multiple' | 'range';

/**
 * Source of selection action
 */
export type SelectionSource = 'click' | 'keyboard' | 'api' | 'draw';

/**
 * Selection constraints configuration
 */
export interface SelectionConstraints {
  /** Maximum number of zones that can be selected */
  maxSelections?: number;
  
  /** Minimum number of zones required */
  minSelections?: number;
  
  /** Maximum total area (in square meters) */
  maxArea?: number;
  
  /** Minimum total area (in square meters) */
  minArea?: number;
  
  /** Maximum distance between zones (in meters) */
  maxDistance?: number;
  
  /** Only allow selecting zones with specific properties */
  allowedProperties?: Record<string, unknown>;
  
  /** Custom validation function */
  customValidator?: (zones: Zone[]) => ValidationResult;
}

/**
 * Options for zone selection hook
 */
export interface UseZoneSelectionOptions {
  /** Initial selection */
  initialSelection?: string[];
  
  /** Selection mode */
  mode?: SelectionMode;
  
  /** Enable multi-selection */
  multiSelect?: boolean;
  
  /** Maximum selections allowed */
  maxSelections?: number;
  
  /** Selection constraints */
  constraints?: SelectionConstraints;
  
  /** Enable selection history */
  enableHistory?: boolean;
  
  /** Maximum history size */
  maxHistorySize?: number;
  
  /** Persist selection to storage */
  persistKey?: string;
  
  /** Callbacks */
  onSelectionChange?: (event: SelectionChangeEvent) => void;
  onSelectionError?: (error: SelectionError) => void;
  
  /** Performance options */
  debounceMs?: number;
  batchUpdates?: boolean;
}

/**
 * Selection change event
 */
export interface SelectionChangeEvent {
  /** Zones that were added */
  added: Zone[];
  
  /** Zones that were removed */
  removed: Zone[];
  
  /** Current selection */
  current: Zone[];
  
  /** Source of the change */
  source: SelectionSource;
}

/**
 * Selection error
 */
export interface SelectionError {
  /** Error code */
  code: 'VALIDATION_FAILED' | 'MAX_SELECTIONS' | 'MIN_SELECTIONS' | 'CONSTRAINT_VIOLATION';
  
  /** Error message */
  message: string;
  
  /** Related zone(s) */
  zone?: Zone;
  zones?: Zone[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** Validation errors */
  errors: string[];
  
  /** Warnings (non-blocking) */
  warnings?: string[];
}

/**
 * Selection metrics
 */
export interface SelectionMetrics {
  /** Number of selected zones */
  count: number;
  
  /** Total area in square meters */
  totalArea: number;
  
  /** Total perimeter in meters */
  totalPerimeter: number;
  
  /** Bounding box of selection */
  bounds: LatLngBounds | null;
  
  /** Average zone area */
  averageArea: number;
  
  /** Largest zone */
  largestZone: Zone | null;
  
  /** Smallest zone */
  smallestZone: Zone | null;
}

/**
 * Options for selecting a zone
 */
export interface SelectOptions {
  /** Source of selection */
  source?: SelectionSource;
  
  /** Skip validation */
  skipValidation?: boolean;
  
  /** Silent mode (no callbacks) */
  silent?: boolean;
}

/**
 * Internal selection state
 */
export interface SelectionState {
  /** Set of selected zone IDs for fast lookup */
  selectedIds: Set<string>;
  
  /** Ordered list of selected zone IDs */
  selectionOrder: string[];
  
  /** Last selected zone ID */
  lastSelectedId?: string;
  
  /** Selection mode */
  mode: SelectionMode;
  
  /** Active constraints */
  constraints?: SelectionConstraints;
}

/**
 * Return type of useZoneSelection hook
 */
export interface UseZoneSelectionReturn {
  // State
  selectedZones: Zone[];
  selectedIds: Set<string>;
  hoveredZone: Zone | null;
  selectionMode: SelectionMode;
  
  // Actions
  selectZone: (zone: Zone | string, options?: SelectOptions) => void;
  deselectZone: (zone: Zone | string) => void;
  toggleZone: (zone: Zone | string) => void;
  selectMultiple: (zones: (Zone | string)[]) => void;
  deselectMultiple: (zones: (Zone | string)[]) => void;
  clearSelection: () => void;
  selectAll: (zones?: Zone[]) => void;
  
  // Advanced selection
  selectByPredicate: (predicate: (zone: Zone) => boolean) => void;
  selectAdjacent: (zone: Zone | string) => void;
  selectWithinBounds: (bounds: LatLngBounds) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Hover
  setHoveredZone: (zone: Zone | null) => void;
  
  // Utilities
  isZoneSelected: (zoneId: string) => boolean;
  getSelectionMetrics: () => SelectionMetrics;
  validateSelection: (zones: Zone[]) => ValidationResult;
  
  // State management
  resetSelection: () => void;
  loadSelection: (ids: string[]) => void;
  exportSelection: () => string[];
}