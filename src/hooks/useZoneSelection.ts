// Import the new implementation
import { useZoneSelection as useZoneSelectionNew } from './useZoneSelection/index';
import type { Zone } from '@/types';
import type { SelectionChangeEvent } from './useZoneSelection/types';

interface UseZoneSelectionLegacyOptions {
  initialSelection?: string[];
  multiSelect?: boolean;
  maxSelections?: number;
  onSelectionChange?: (zones: Zone[]) => void;
  zones?: Zone[];
}

// Wrapper for backward compatibility
export function useZoneSelection(options: UseZoneSelectionLegacyOptions = {}) {
  const {
    zones = [],
    onSelectionChange,
    ...restOptions
  } = options;

  // Convert the legacy callback to the new format
  const wrappedOptions = {
    ...restOptions,
    onSelectionChange: onSelectionChange ? (event: SelectionChangeEvent) => {
      onSelectionChange(event.current);
    } : undefined
  };

  return useZoneSelectionNew(zones, wrappedOptions);
}