import type { Zone as AppZone } from '@/types';
import type { Zone as LayerZone } from '@/components/ZoneLayer/types';
import type { Polygon } from 'geojson';

/**
 * Transforms an app zone (with coordinates array) to a layer zone (with GeoJSON geometry)
 */
export function appZoneToLayerZone(appZone: AppZone): LayerZone {
  // Ensure the polygon is closed
  const coordinates = [...appZone.coordinates];
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
  const lngs = appZone.coordinates.map(coord => coord[0]);
  const lats = appZone.coordinates.map(coord => coord[1]);
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
  };
}