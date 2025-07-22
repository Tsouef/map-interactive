import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Zone, Coordinates } from '../types';

export interface SelectionOptions {
  multiSelect?: boolean;
  maxSelections?: number;
  initialSelection?: Zone[];
  onSelectionChange?: (zones: Zone[]) => void;
  onHoverChange?: (zone: Zone | null) => void;
}

export interface SelectionState {
  selectedZones: Zone[];
  selectedZoneIds: Set<string>;
  hoveredZone: Zone | null;
}

export function useZoneSelection(options: SelectionOptions = {}) {
  const {
    multiSelect = true,
    maxSelections,
    initialSelection = [],
    onSelectionChange,
    onHoverChange
  } = options;

  const [selectedZones, setSelectedZones] = useState<Zone[]>(initialSelection);
  const [hoveredZone, setHoveredZone] = useState<Zone | null>(null);

  const selectedZoneIds = useMemo(
    () => new Set(selectedZones.map(zone => zone.id)),
    [selectedZones]
  );

  const selectZone = useCallback((zone: Zone) => {
    setSelectedZones(prev => {
      const isSelected = prev.some(z => z.id === zone.id);

      if (isSelected) {
        // Deselect if already selected
        return prev.filter(z => z.id !== zone.id);
      }

      if (!multiSelect) {
        // Single select mode - replace selection
        return [zone];
      }

      // Multi-select mode
      if (maxSelections && prev.length >= maxSelections) {
        // Max selections reached
        return prev;
      }

      return [...prev, zone];
    });
  }, [multiSelect, maxSelections]);

  const deselectZone = useCallback((zoneId: string) => {
    setSelectedZones(prev => prev.filter(zone => zone.id !== zoneId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedZones([]);
  }, []);

  const isZoneSelected = useCallback((zoneId: string): boolean => {
    return selectedZoneIds.has(zoneId);
  }, [selectedZoneIds]);

  const getCoordinates = useCallback((): Coordinates[][][] => {
    return selectedZones.map(zone => zone.coordinates);
  }, [selectedZones]);

  // Notify selection changes
  useEffect(() => {
    onSelectionChange?.(selectedZones);
  }, [selectedZones, onSelectionChange]);

  // Handle hover state and notify changes
  const handleSetHoveredZone = useCallback((zone: Zone | null) => {
    setHoveredZone(zone);
    onHoverChange?.(zone);
  }, [onHoverChange]);

  return {
    // State
    selectedZones,
    selectedZoneIds,
    hoveredZone,

    // Actions
    selectZone,
    deselectZone,
    clearSelection,
    setHoveredZone: handleSetHoveredZone,

    // Utilities
    isZoneSelected,
    getCoordinates
  };
}