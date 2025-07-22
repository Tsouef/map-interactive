# Issue #8: Build useZoneSelection Hook

**Labels**: hook, state-management, core, high-priority

## Description

Create a comprehensive React hook for managing zone selection state, including multi-selection, constraints validation, selection history, and optimized performance for large datasets.

## Acceptance Criteria

- [ ] Single and multi-selection modes
- [ ] Selection constraints enforcement
- [ ] Undo/redo functionality
- [ ] Selection persistence
- [ ] Optimized for performance
- [ ] Event callbacks for changes
- [ ] Keyboard selection support
- [ ] Batch operations support

## Technical Implementation

### Hook Interface
```typescript
// src/hooks/useZoneSelection/types.ts
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
  selectWithinBounds: (bounds: L.LatLngBounds) => void;
  
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

interface SelectOptions {
  source?: 'click' | 'keyboard' | 'api' | 'draw';
  skipValidation?: boolean;
  silent?: boolean;
}
```

### Main Hook Implementation
```typescript
// src/hooks/useZoneSelection/useZoneSelection.ts
import { useReducer, useCallback, useEffect, useRef, useMemo } from 'react';
import { useLocalStorage } from '../useLocalStorage';
import { selectionReducer, SelectionAction } from './reducer';
import { validateConstraints } from './validation';
import { SelectionHistory } from './history';
import type { Zone, SelectionState, UseZoneSelectionOptions, UseZoneSelectionReturn } from './types';

const initialState: SelectionState = {
  selectedIds: new Set(),
  selectionOrder: [],
  lastSelectedId: undefined,
  mode: 'multiple',
  constraints: undefined
};

export function useZoneSelection(
  zones: Zone[],
  options: UseZoneSelectionOptions = {}
): UseZoneSelectionReturn {
  const {
    initialSelection = [],
    mode = 'multiple',
    multiSelect = true,
    maxSelections = Infinity,
    constraints = {},
    enableHistory = true,
    maxHistorySize = 50,
    persistKey,
    onSelectionChange,
    onSelectionError,
    debounceMs = 0,
    batchUpdates = true
  } = options;

  // Zone map for quick lookups
  const zoneMap = useMemo(() => {
    return new Map(zones.map(zone => [zone.id, zone]));
  }, [zones]);

  // Selection state
  const [state, dispatch] = useReducer(selectionReducer, {
    ...initialState,
    selectedIds: new Set(initialSelection),
    selectionOrder: initialSelection,
    mode: multiSelect ? mode : 'single',
    constraints: { ...constraints, maxSelections }
  });

  // Hover state
  const [hoveredZone, setHoveredZone] = useState<Zone | null>(null);

  // History management
  const history = useRef(
    enableHistory ? new SelectionHistory(maxHistorySize) : null
  );

  // Persistence
  const [persistedSelection, setPersistentSelection] = useLocalStorage<string[]>(
    persistKey || '',
    [],
    { enabled: !!persistKey }
  );

  // Debouncing
  const debounceTimerRef = useRef<number>();
  const pendingCallbacksRef = useRef<(() => void)[]>([]);

  // Get selected zones from IDs
  const selectedZones = useMemo(() => {
    return state.selectionOrder
      .map(id => zoneMap.get(id))
      .filter((zone): zone is Zone => zone !== undefined);
  }, [state.selectionOrder, zoneMap]);

  // Validation helper
  const validateSelection = useCallback((zonesToValidate: Zone[]): ValidationResult => {
    return validateConstraints(zonesToValidate, state.constraints);
  }, [state.constraints]);

  // Batch update helper
  const batchDispatch = useCallback((action: SelectionAction) => {
    if (!batchUpdates || debounceMs === 0) {
      dispatch(action);
      return;
    }

    // Queue the dispatch
    pendingCallbacksRef.current.push(() => dispatch(action));

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      const callbacks = pendingCallbacksRef.current;
      pendingCallbacksRef.current = [];
      
      // Execute all pending dispatches
      callbacks.forEach(cb => cb());
    }, debounceMs);
  }, [batchUpdates, debounceMs]);

  // Select zone
  const selectZone = useCallback((
    zoneOrId: Zone | string,
    options: SelectOptions = {}
  ) => {
    const zone = typeof zoneOrId === 'string' 
      ? zoneMap.get(zoneOrId)
      : zoneOrId;
    
    if (!zone) return;

    // Validate selection
    if (!options.skipValidation) {
      const newSelection = [...selectedZones, zone];
      const validation = validateSelection(newSelection);
      
      if (!validation.valid) {
        onSelectionError?.({
          code: 'VALIDATION_FAILED',
          message: validation.errors.join(', '),
          zone
        });
        return;
      }
    }

    // Save to history
    if (enableHistory && history.current) {
      history.current.push(state);
    }

    // Dispatch selection
    batchDispatch({
      type: 'SELECT_ZONE',
      payload: { zone, source: options.source || 'api' }
    });

    // Trigger callback
    if (!options.silent && onSelectionChange) {
      const event: SelectionChangeEvent = {
        added: [zone],
        removed: [],
        current: [...selectedZones, zone],
        source: options.source || 'api'
      };
      onSelectionChange(event);
    }
  }, [
    zoneMap,
    selectedZones,
    validateSelection,
    enableHistory,
    batchDispatch,
    onSelectionChange,
    onSelectionError,
    state
  ]);

  // Deselect zone
  const deselectZone = useCallback((zoneOrId: Zone | string) => {
    const zoneId = typeof zoneOrId === 'string' ? zoneOrId : zoneOrId.id;
    const zone = zoneMap.get(zoneId);
    
    if (!zone || !state.selectedIds.has(zoneId)) return;

    if (enableHistory && history.current) {
      history.current.push(state);
    }

    batchDispatch({
      type: 'DESELECT_ZONE',
      payload: { zoneId }
    });

    if (onSelectionChange) {
      const event: SelectionChangeEvent = {
        added: [],
        removed: [zone],
        current: selectedZones.filter(z => z.id !== zoneId),
        source: 'api'
      };
      onSelectionChange(event);
    }
  }, [
    zoneMap,
    state,
    selectedZones,
    enableHistory,
    batchDispatch,
    onSelectionChange
  ]);

  // Toggle zone
  const toggleZone = useCallback((zoneOrId: Zone | string) => {
    const zoneId = typeof zoneOrId === 'string' ? zoneOrId : zoneOrId.id;
    
    if (state.selectedIds.has(zoneId)) {
      deselectZone(zoneId);
    } else {
      selectZone(zoneOrId);
    }
  }, [state.selectedIds, selectZone, deselectZone]);

  // Select multiple
  const selectMultiple = useCallback((zonesToSelect: (Zone | string)[]) => {
    const zones = zonesToSelect
      .map(z => typeof z === 'string' ? zoneMap.get(z) : z)
      .filter((z): z is Zone => z !== undefined);
    
    if (zones.length === 0) return;

    // Validate all at once
    const newSelection = [...selectedZones, ...zones];
    const validation = validateSelection(newSelection);
    
    if (!validation.valid) {
      onSelectionError?.({
        code: 'VALIDATION_FAILED',
        message: validation.errors.join(', '),
        zones
      });
      return;
    }

    if (enableHistory && history.current) {
      history.current.push(state);
    }

    batchDispatch({
      type: 'SELECT_MULTIPLE',
      payload: { zones }
    });
  }, [
    zoneMap,
    selectedZones,
    validateSelection,
    enableHistory,
    state,
    batchDispatch,
    onSelectionError
  ]);

  // Clear selection
  const clearSelection = useCallback(() => {
    if (state.selectedIds.size === 0) return;

    if (enableHistory && history.current) {
      history.current.push(state);
    }

    batchDispatch({ type: 'CLEAR_SELECTION' });

    if (onSelectionChange) {
      onSelectionChange({
        added: [],
        removed: selectedZones,
        current: [],
        source: 'api'
      });
    }
  }, [state, selectedZones, enableHistory, batchDispatch, onSelectionChange]);

  // History functions
  const undo = useCallback(() => {
    if (!history.current?.canUndo()) return;
    
    const previousState = history.current.undo();
    if (previousState) {
      dispatch({ type: 'RESTORE_STATE', payload: previousState });
    }
  }, []);

  const redo = useCallback(() => {
    if (!history.current?.canRedo()) return;
    
    const nextState = history.current.redo();
    if (nextState) {
      dispatch({ type: 'RESTORE_STATE', payload: nextState });
    }
  }, []);

  // Persistence
  useEffect(() => {
    if (persistKey) {
      setPersistentSelection(state.selectionOrder);
    }
  }, [persistKey, state.selectionOrder, setPersistentSelection]);

  // Load persisted selection on mount
  useEffect(() => {
    if (persistKey && persistedSelection.length > 0) {
      const validIds = persistedSelection.filter(id => zoneMap.has(id));
      if (validIds.length > 0) {
        dispatch({
          type: 'RESTORE_STATE',
          payload: {
            ...state,
            selectedIds: new Set(validIds),
            selectionOrder: validIds
          }
        });
      }
    }
  }, []); // Only on mount

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    // State
    selectedZones,
    selectedIds: state.selectedIds,
    hoveredZone,
    selectionMode: state.mode,
    
    // Actions
    selectZone,
    deselectZone,
    toggleZone,
    selectMultiple,
    deselectMultiple,
    clearSelection,
    selectAll,
    
    // Advanced selection
    selectByPredicate,
    selectAdjacent,
    selectWithinBounds,
    
    // History
    undo,
    redo,
    canUndo: history.current?.canUndo() || false,
    canRedo: history.current?.canRedo() || false,
    
    // Hover
    setHoveredZone,
    
    // Utilities
    isZoneSelected: (id: string) => state.selectedIds.has(id),
    getSelectionMetrics,
    validateSelection,
    
    // State management
    resetSelection: clearSelection,
    loadSelection,
    exportSelection: () => state.selectionOrder
  };
}
```

## Testing Requirements

- [ ] Single selection mode works correctly
- [ ] Multi-selection respects limits
- [ ] Constraints are validated
- [ ] History undo/redo functions
- [ ] Persistence saves/loads correctly
- [ ] Batch updates improve performance
- [ ] Memory leaks prevented
- [ ] Edge cases handled

### Test Examples
```typescript
describe('useZoneSelection', () => {
  it('should handle single selection mode', () => {
    const { result } = renderHook(() => 
      useZoneSelection(mockZones, { multiSelect: false })
    );
    
    act(() => {
      result.current.selectZone(mockZones[0]);
      result.current.selectZone(mockZones[1]);
    });
    
    expect(result.current.selectedZones).toHaveLength(1);
    expect(result.current.selectedZones[0].id).toBe(mockZones[1].id);
  });

  it('should enforce max selections', () => {
    const onError = jest.fn();
    const { result } = renderHook(() => 
      useZoneSelection(mockZones, { 
        maxSelections: 2,
        onSelectionError: onError 
      })
    );
    
    act(() => {
      result.current.selectMultiple([mockZones[0], mockZones[1], mockZones[2]]);
    });
    
    expect(result.current.selectedZones).toHaveLength(0);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'VALIDATION_FAILED'
      })
    );
  });
});
```

## Performance Considerations

- Use Map for O(1) zone lookups
- Batch state updates to reduce re-renders
- Memoize expensive calculations
- Debounce rapid selections
- Use Set for efficient ID checks

## Related Issues

- #4: LeafletZoneSelector uses this hook
- #6: ZoneLayer receives selection state
- #22: Adjacent zone detection integration
- #15: History/undo system implementation