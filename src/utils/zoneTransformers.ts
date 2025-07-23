import type { Zone as AppZone } from '@/types';
import type { Zone as LayerZone } from '@/components/ZoneLayer/types';
import type { Polygon } from 'geojson';
import type { Coordinates } from '@/types';

// Temporary type for legacy app zone structure
// TODO: Update this file when all components use the new Zone type in Issue #10
interface LegacyAppZone {
  id: string;
  name: string;
  coordinates: Coordinates[];
  properties?: {
    postalCode?: string;
    [key: string]: unknown;
  };
}

/**
 * Transforms an app zone (with coordinates array) to a layer zone (with GeoJSON geometry)
 */
export function appZoneToLayerZone(appZone: AppZone): LayerZone {
  // TODO: Remove type assertion when updating to use geometry in Issue #10
  const legacyZone = appZone as unknown as LegacyAppZone;
  // Ensure the polygon is closed
  const coordinates = [...legacyZone.coordinates];
  if (coordinates.length > 0) {
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates.push(first);
    }
  }

  const geometry: Polygon = {
    type: 'Polygon',
    coordinates: [coordinates]
  };

  // Calculate bbox
  const lngs = legacyZone.coordinates.map((coord: Coordinates) => coord[0]);
  const lats = legacyZone.coordinates.map((coord: Coordinates) => coord[1]);
  const bbox: [number, number, number, number] = [
    Math.min(...lngs),
    Math.min(...lats),
    Math.max(...lngs),
    Math.max(...lats)
  ];

  return {
    id: appZone.id,
    name: appZone.name,
    geometry,
    properties: appZone.properties,
    bbox
  };
}

/**
 * Transforms a layer zone (with GeoJSON geometry) back to an app zone (with coordinates array)
 */
export function layerZoneToAppZone(layerZone: LayerZone): AppZone {
  // TODO: Update return type when all components use the new Zone type in Issue #10
  // Extract the outer ring coordinates
  let coordinates: [number, number][] = [];
  
  if (layerZone.geometry.type === 'Polygon') {
    // Take the first ring (outer boundary) and remove the last duplicate point
    const ring = layerZone.geometry.coordinates[0];
    coordinates = ring.slice(0, -1) as [number, number][];
  } else if (layerZone.geometry.type === 'MultiPolygon') {
    // For MultiPolygon, just take the first polygon's outer ring
    const ring = layerZone.geometry.coordinates[0][0];
    coordinates = ring.slice(0, -1) as [number, number][];
  }

  return {
    id: layerZone.id,
    name: layerZone.name,
    coordinates,
    properties: layerZone.properties
  } as unknown as AppZone;
}