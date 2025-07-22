import { useReducer, useCallback, useEffect } from 'react';
import { selectionReducer, initialState } from './selectionReducer';
import type { Zone, Coordinates } from '../types';

export interface SelectionOptions {
  multiSelect?: boolean;
  maxSelections?: number;
  initialSelection?: Zone[];
  onSelectionChange?: (zones: Zone[]) => void;
  onHoverChange?: (zone: Zone | null) => void;
}

export function useZoneSelection(options: SelectionOptions = {}) {
  const {
    multiSelect = true,
    maxSelections,
    initialSelection = [],
    onSelectionChange,
    onHoverChange
  } = options;

  const [state, dispatch] = useReducer(
    selectionReducer,
    {
      ...initialState,
      selectedZones: initialSelection,
      selectedZoneIds: new Set(initialSelection.map(z => z.id))
    }
  );

  const selectZone = useCallback((zone: Zone) => {
    dispatch({
      type: 'SELECT',
      payload: { zone, multiSelect, maxSelections }
    });
  }, [multiSelect, maxSelections]);

  const deselectZone = useCallback((zoneId: string) => {
    dispatch({
      type: 'DESELECT',
      payload: { zoneId }
    });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const setHoveredZone = useCallback((zone: Zone | null) => {
    dispatch({
      type: 'SET_HOVER',
      payload: { zone }
    });
  }, []);

  const isZoneSelected = useCallback((zoneId: string): boolean => {
    return state.selectedZoneIds.has(zoneId);
  }, [state.selectedZoneIds]);

  const getCoordinates = useCallback((): Coordinates[][][] => {
    return state.selectedZones.map(zone => {
      // Normalize to MultiPolygon format
      if (Array.isArray(zone.coordinates[0]) && Array.isArray(zone.coordinates[0][0]) && typeof zone.coordinates[0][0][0] === 'number') {
        // It's a Polygon
        return zone.coordinates as Coordinates[][];
      }
      // It's already a MultiPolygon, return first polygon
      return (zone.coordinates as Coordinates[][][])[0] || [];
    });
  }, [state.selectedZones]);

  // Notify selection changes
  useEffect(() => {
    onSelectionChange?.(state.selectedZones);
  }, [state.selectedZones, onSelectionChange]);

  // Notify hover changes
  useEffect(() => {
    onHoverChange?.(state.hoveredZone);
  }, [state.hoveredZone, onHoverChange]);

  return {
    // State
    selectedZones: state.selectedZones,
    selectedZoneIds: state.selectedZoneIds,
    hoveredZone: state.hoveredZone,

    // Actions
    selectZone,
    deselectZone,
    clearSelection,
    setHoveredZone,

    // Utilities
    isZoneSelected,
    getCoordinates
  };
}