// Import the new implementation
import { useZoneSelection as useZoneSelectionNew } from './useZoneSelection/index';
import type { Zone } from '@/types';

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
    ...restOptions
  } = options;

  return useZoneSelectionNew(zones, restOptions);
}