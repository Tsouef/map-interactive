import { useState, useCallback, useEffect } from 'react';
import type { Zone } from '@/types';

interface UseZoneSelectionOptions {
  initialSelection?: string[];
  multiSelect?: boolean;
  maxSelections?: number;
  onSelectionChange?: (zones: Zone[]) => void;
}

export function useZoneSelection(options: UseZoneSelectionOptions & { zones?: Zone[] } = {}) {
  const {
    initialSelection = [],
    multiSelect = true,
    maxSelections = Infinity,
    onSelectionChange,
    zones = []
  } = options;

  const [selectedZones, setSelectedZones] = useState<Zone[]>([]);
  const [hoveredZone, setHoveredZone] = useState<Zone | null>(null);
  const [zoneMap, setZoneMap] = useState<Map<string, Zone>>(new Map());

  // Populate zone map from zones prop
  useEffect(() => {
    const map = new Map<string, Zone>();
    zones.forEach(zone => map.set(zone.id, zone));
    setZoneMap(map);
  }, [zones]);

  // Initialize with selected zone IDs
  useEffect(() => {
    if (initialSelection.length > 0 && (zoneMap.size > 0 || zones.length > 0)) {
      const initialZones = initialSelection
        .map(id => {
          // First check zoneMap, then check zones array
          return zoneMap.get(id) || zones.find(z => z.id === id);
        })
        .filter((zone): zone is Zone => zone !== undefined);
      setSelectedZones(initialZones);
    }
  }, [initialSelection, zoneMap, zones]);

  // Notify selection changes
  useEffect(() => {
    onSelectionChange?.(selectedZones);
  }, [selectedZones, onSelectionChange]);

  const selectZone = useCallback((zone: Zone) => {
    // Store zone in map for reference
    setZoneMap(prev => new Map(prev).set(zone.id, zone));

    setSelectedZones(prev => {
      const isSelected = prev.some(z => z.id === zone.id);
      
      if (isSelected) {
        // Zone is already selected, do nothing
        return prev;
      }

      if (!multiSelect) {
        // Single selection mode: replace selection
        return [zone];
      }

      if (prev.length >= maxSelections) {
        // Maximum selections reached
        return prev;
      }

      // Add zone to selection
      return [...prev, zone];
    });
  }, [multiSelect, maxSelections]);

  const deselectZone = useCallback((zoneId: string) => {
    setSelectedZones(prev => prev.filter(z => z.id !== zoneId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedZones([]);
  }, []);

  const isZoneSelected = useCallback((zoneId: string) => {
    return selectedZones.some(z => z.id === zoneId);
  }, [selectedZones]);

  return {
    selectedZones,
    hoveredZone,
    selectZone,
    deselectZone,
    clearSelection,
    isZoneSelected,
    setHoveredZone
  };
}