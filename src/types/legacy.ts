import type { Coordinates } from './geography';

/**
 * Legacy zone type with coordinates array
 * @deprecated Use Zone with geometry property instead
 */
export interface LegacyZone {
  id: string;
  name: string;
  coordinates: Coordinates[];
  properties?: {
    postalCode?: string;
    [key: string]: unknown;
  };
}

/**
 * Type guard to check if a zone is using legacy format
 */
export function isLegacyZone(zone: unknown): zone is LegacyZone {
  return (
    zone !== null &&
    typeof zone === 'object' &&
    'coordinates' in zone &&
    Array.isArray((zone as Record<string, unknown>).coordinates)
  );
}