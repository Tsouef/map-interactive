import type { Zone } from '@/types';

// Temporary type for legacy zone structure
// TODO: Update this file to use Zone.geometry in Issue #12
interface LegacyZone extends Omit<Zone, 'geometry'> {
  coordinates: [number, number][];
}
import type { SelectionMetrics } from '@/components/LeafletZoneSelector/types';

// Mock implementation for testing
export function calculateMetrics(zones: Zone[]): SelectionMetrics {
  // TODO: Remove type assertion when updating to use geometry in Issue #12
  const legacyZones = zones as unknown as LegacyZone[];
  if (zones.length === 0) {
    return {
      totalArea: 0,
      totalPerimeter: 0,
      zoneCount: 0,
      boundingBox: [[0, 0], [0, 0]],
      center: [0, 0]
    };
  }

  // Mock calculations
  const allCoordinates = legacyZones.flatMap(zone => zone.coordinates);
  
  const lngs = allCoordinates.map(coord => coord[0]);
  const lats = allCoordinates.map(coord => coord[1]);
  
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  
  return {
    totalArea: zones.length * 1000, // Mock area calculation
    totalPerimeter: zones.length * 100, // Mock perimeter calculation
    zoneCount: zones.length,
    boundingBox: [[minLng, minLat], [maxLng, maxLat]],
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
  };
}