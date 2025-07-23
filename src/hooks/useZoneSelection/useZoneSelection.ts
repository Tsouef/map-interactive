import { useReducer, useCallback, useEffect, useRef, useMemo, useState } from 'react';
import type { LatLngBounds } from 'leaflet';
import * as turf from '@turf/turf';
import type { Zone } from '@/types';
import { useLocalStorage } from '../useLocalStorage';
import { selectionReducer } from './reducer';
import { validateConstraints } from './validation';
import { SelectionHistory } from './history';
import type { 
  SelectionState, 
  UseZoneSelectionOptions, 
  UseZoneSelectionReturn,
  SelectionChangeEvent,
  SelectOptions,
  ValidationResult,
  SelectionMetrics,
  SelectionError
} from './types';

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
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingCallbacksRef = useRef<(() => void)[]>([]);
  const pendingEventsRef = useRef<SelectionChangeEvent[]>([]);

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
  const batchDispatch = useCallback((
    action: Parameters<typeof dispatch>[0],
    event?: SelectionChangeEvent
  ) => {
    if (!batchUpdates || debounceMs === 0) {
      dispatch(action);
      return;
    }

    // Queue the dispatch
    pendingCallbacksRef.current.push(() => dispatch(action));
    
    // Queue the event if provided
    if (event) {
      pendingEventsRef.current.push(event);
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      const callbacks = pendingCallbacksRef.current;
      const events = pendingEventsRef.current;
      pendingCallbacksRef.current = [];
      pendingEventsRef.current = [];
      
      // Execute all pending dispatches
      callbacks.forEach(cb => cb());
      
      // Merge and trigger batched events
      if (events.length > 0 && onSelectionChange) {
        const mergedEvent: SelectionChangeEvent = {
          added: events.flatMap(e => e.added),
          removed: events.flatMap(e => e.removed),
          current: events[events.length - 1].current, // Use final state
          source: events[events.length - 1].source
        };
        onSelectionChange(mergedEvent);
      }
    }, debounceMs);
  }, [batchUpdates, debounceMs, onSelectionChange]);

  // Save current state to history
  const saveToHistory = useCallback(() => {
    if (enableHistory && history.current) {
      history.current.push(state);
    }
  }, [enableHistory, state]);

  // Select zone
  const selectZone = useCallback((
    zoneOrId: Zone | string,
    options: SelectOptions = {}
  ) => {
    const zone = typeof zoneOrId === 'string' 
      ? zoneMap.get(zoneOrId)
      : zoneOrId;
    
    if (!zone) return;

    // Check if already selected
    if (state.selectedIds.has(zone.id)) return;

    // Validate selection
    if (!options.skipValidation) {
      const newSelection = [...selectedZones, zone];
      const validation = validateSelection(newSelection);
      
      if (!validation.valid) {
        const error: SelectionError = {
          code: 'VALIDATION_FAILED',
          message: validation.errors.join(', '),
          zone
        };
        onSelectionError?.(error);
        return;
      }
    }

    // Save to history before making changes
    saveToHistory();

    // Create event
    const event: SelectionChangeEvent = {
      added: [zone],
      removed: [],
      current: [...selectedZones, zone],
      source: options.source || 'api'
    };

    // Dispatch selection
    if (!options.silent && onSelectionChange && batchUpdates && debounceMs > 0) {
      // Pass event for batching
      batchDispatch({
        type: 'SELECT_ZONE',
        payload: { zone, source: options.source || 'api' }
      }, event);
    } else {
      // Normal dispatch
      batchDispatch({
        type: 'SELECT_ZONE',
        payload: { zone, source: options.source || 'api' }
      });
      
      // Trigger callback immediately if not batching
      if (!options.silent && onSelectionChange) {
        onSelectionChange(event);
      }
    }
  }, [
    zoneMap,
    state.selectedIds,
    selectedZones,
    validateSelection,
    saveToHistory,
    batchDispatch,
    onSelectionChange,
    onSelectionError,
    batchUpdates,
    debounceMs
  ]);

  // Deselect zone
  const deselectZone = useCallback((zoneOrId: Zone | string) => {
    const zoneId = typeof zoneOrId === 'string' ? zoneOrId : zoneOrId.id;
    const zone = zoneMap.get(zoneId);
    
    if (!zone || !state.selectedIds.has(zoneId)) return;

    saveToHistory();

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
    state.selectedIds,
    selectedZones,
    saveToHistory,
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
      const error: SelectionError = {
        code: 'VALIDATION_FAILED',
        message: validation.errors.join(', '),
        zones
      };
      onSelectionError?.(error);
      return;
    }

    saveToHistory();

    batchDispatch({
      type: 'SELECT_MULTIPLE',
      payload: { zones }
    });
  }, [
    zoneMap,
    selectedZones,
    validateSelection,
    saveToHistory,
    batchDispatch,
    onSelectionError
  ]);

  // Deselect multiple
  const deselectMultiple = useCallback((zonesToDeselect: (Zone | string)[]) => {
    const zoneIds = zonesToDeselect.map(z => typeof z === 'string' ? z : z.id);
    const validIds = zoneIds.filter(id => state.selectedIds.has(id));
    
    if (validIds.length === 0) return;

    saveToHistory();

    batchDispatch({
      type: 'DESELECT_MULTIPLE',
      payload: { zoneIds: validIds }
    });

    if (onSelectionChange) {
      const removedZones = validIds
        .map(id => zoneMap.get(id))
        .filter((z): z is Zone => z !== undefined);
      
      const event: SelectionChangeEvent = {
        added: [],
        removed: removedZones,
        current: selectedZones.filter(z => !validIds.includes(z.id)),
        source: 'api'
      };
      onSelectionChange(event);
    }
  }, [
    state.selectedIds,
    selectedZones,
    saveToHistory,
    batchDispatch,
    onSelectionChange,
    zoneMap
  ]);

  // Clear selection
  const clearSelection = useCallback(() => {
    if (state.selectedIds.size === 0) return;

    saveToHistory();

    batchDispatch({ type: 'CLEAR_SELECTION' });

    if (onSelectionChange) {
      onSelectionChange({
        added: [],
        removed: selectedZones,
        current: [],
        source: 'api'
      });
    }
  }, [state.selectedIds, selectedZones, saveToHistory, batchDispatch, onSelectionChange]);

  // Select all zones
  const selectAll = useCallback((zonesToSelect = zones) => {
    const newZones = zonesToSelect.filter(z => !state.selectedIds.has(z.id));
    
    if (newZones.length === 0) return;

    // Validate
    const validation = validateSelection(zonesToSelect);
    
    if (!validation.valid) {
      const error: SelectionError = {
        code: 'VALIDATION_FAILED',
        message: validation.errors.join(', '),
        zones: newZones
      };
      onSelectionError?.(error);
      return;
    }

    saveToHistory();

    batchDispatch({
      type: 'SELECT_MULTIPLE',
      payload: { zones: newZones }
    });
  }, [zones, state.selectedIds, validateSelection, saveToHistory, batchDispatch, onSelectionError]);

  // Select by predicate
  const selectByPredicate = useCallback((predicate: (zone: Zone) => boolean) => {
    const matchingZones = zones.filter(predicate);
    selectMultiple(matchingZones);
  }, [zones, selectMultiple]);

  // Select adjacent zones
  const selectAdjacent = useCallback((zoneOrId: Zone | string) => {
    const zone = typeof zoneOrId === 'string' ? zoneMap.get(zoneOrId) : zoneOrId;
    if (!zone) return;

    const adjacentZones = zones.filter(otherZone => {
      if (otherZone.id === zone.id) return false;
      
      try {
        // Check if zones touch or overlap using booleanOverlap or booleanIntersects
        const zoneFeature = turf.feature(zone.geometry);
        const otherFeature = turf.feature(otherZone.geometry);
        
        // Check if they overlap or touch
        return turf.booleanOverlap(zoneFeature, otherFeature) || 
               turf.booleanIntersects(zoneFeature, otherFeature);
      } catch {
        return false;
      }
    });

    selectMultiple(adjacentZones);
  }, [zoneMap, zones, selectMultiple]);

  // Select within bounds
  const selectWithinBounds = useCallback((bounds: LatLngBounds) => {
    const boundsPolygon = turf.bboxPolygon([
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth()
    ]);

    const zonesWithinBounds = zones.filter(zone => {
      try {
        const centroid = turf.centroid(zone.geometry);
        return turf.booleanPointInPolygon(centroid, boundsPolygon);
      } catch {
        return false;
      }
    });

    selectMultiple(zonesWithinBounds);
  }, [zones, selectMultiple]);

  // History functions
  const undo = useCallback(() => {
    if (!history.current?.canUndo()) return;
    
    const previousState = history.current.undo();
    if (previousState) {
      dispatch({ type: 'RESTORE_STATE', payload: previousState });
      
      // Trigger selection change callback
      if (onSelectionChange) {
        const newSelectedZones = previousState.selectionOrder
          .map(id => zoneMap.get(id))
          .filter((zone): zone is Zone => zone !== undefined);
        
        onSelectionChange({
          added: [],
          removed: [],
          current: newSelectedZones,
          source: 'api'
        });
      }
    }
  }, [onSelectionChange, zoneMap]);

  const redo = useCallback(() => {
    if (!history.current?.canRedo()) return;
    
    const nextState = history.current.redo();
    if (nextState) {
      dispatch({ type: 'RESTORE_STATE', payload: nextState });
      
      // Trigger selection change callback
      if (onSelectionChange) {
        const newSelectedZones = nextState.selectionOrder
          .map(id => zoneMap.get(id))
          .filter((zone): zone is Zone => zone !== undefined);
        
        onSelectionChange({
          added: [],
          removed: [],
          current: newSelectedZones,
          source: 'api'
        });
      }
    }
  }, [onSelectionChange, zoneMap]);

  // Get selection metrics
  const getSelectionMetrics = useCallback((): SelectionMetrics => {
    if (selectedZones.length === 0) {
      return {
        count: 0,
        totalArea: 0,
        totalPerimeter: 0,
        bounds: null,
        averageArea: 0,
        largestZone: null,
        smallestZone: null
      };
    }

    let totalArea = 0;
    let totalPerimeter = 0;
    let largestZone = selectedZones[0];
    let smallestZone = selectedZones[0];
    let largestArea = 0;
    let smallestArea = Infinity;

    // Calculate metrics
    selectedZones.forEach(zone => {
      const feature = turf.feature(zone.geometry);
      const area = zone.properties?.area || turf.area(feature);
      const perimeter = turf.length(feature, { units: 'meters' });

      totalArea += area;
      totalPerimeter += perimeter;

      if (area > largestArea) {
        largestArea = area;
        largestZone = zone;
      }

      if (area < smallestArea) {
        smallestArea = area;
        smallestZone = zone;
      }
    });

    // Calculate bounds
    const allCoordinates: number[][] = [];
    selectedZones.forEach(zone => {
      const bbox = turf.bbox(zone.geometry);
      allCoordinates.push([bbox[1], bbox[0]]); // [lat, lng]
      allCoordinates.push([bbox[3], bbox[2]]); // [lat, lng]
    });

    // TODO: Implement proper LatLngBounds creation when Leaflet is available
    // For now, return null as bounds are optional in the metrics
    const bounds = null;

    return {
      count: selectedZones.length,
      totalArea,
      totalPerimeter,
      bounds,
      averageArea: totalArea / selectedZones.length,
      largestZone,
      smallestZone
    };
  }, [selectedZones]);

  // Load selection
  const loadSelection = useCallback((ids: string[]) => {
    saveToHistory();

    const validIds = ids.filter(id => zoneMap.has(id));
    
    dispatch({
      type: 'RESTORE_STATE',
      payload: {
        ...state,
        selectedIds: new Set(validIds),
        selectionOrder: validIds
      }
    });
  }, [state, zoneMap, saveToHistory]);

  // Persistence
  useEffect(() => {
    if (persistKey) {
      setPersistentSelection(state.selectionOrder);
    }
  }, [persistKey, state.selectionOrder, setPersistentSelection]);

  // Load persisted selection on mount
  useEffect(() => {
    if (persistKey && persistedSelection.length > 0 && state.selectionOrder.length === 0) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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