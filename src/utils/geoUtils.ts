import * as turf from '@turf/turf';
import type { Polygon, MultiPolygon } from 'geojson';

/**
 * Simplifies a polygon or multipolygon geometry to reduce complexity
 * while maintaining visual accuracy
 */
export function simplifyGeometry(
  geometry: Polygon | MultiPolygon,
  tolerance: number = 0.001,
  highQuality: boolean = false
): Polygon | MultiPolygon {
  try {
    if (geometry.type === 'Polygon') {
      const simplified = turf.simplify(turf.polygon(geometry.coordinates), {
        tolerance,
        highQuality
      });
      return simplified.geometry;
    } else if (geometry.type === 'MultiPolygon') {
      const simplified = turf.simplify(turf.multiPolygon(geometry.coordinates), {
        tolerance,
        highQuality
      });
      return simplified.geometry;
    }
    return geometry;
  } catch (error) {
    console.warn('Failed to simplify geometry:', error);
    return geometry;
  }
}

/**
 * Calculates the bounding box for a polygon or multipolygon
 */
export function calculateBBox(geometry: Polygon | MultiPolygon): [number, number, number, number] | undefined {
  try {
    const feature = geometry.type === 'Polygon' 
      ? turf.polygon(geometry.coordinates)
      : turf.multiPolygon(geometry.coordinates);
    
    const bbox = turf.bbox(feature);
    return bbox as [number, number, number, number];
  } catch (error) {
    console.warn('Failed to calculate bbox:', error);
    return undefined;
  }
}

/**
 * Checks if two bounding boxes intersect
 */
export function bboxIntersects(
  bbox1: [number, number, number, number],
  bbox2: [number, number, number, number]
): boolean {
  const [minLng1, minLat1, maxLng1, maxLat1] = bbox1;
  const [minLng2, minLat2, maxLng2, maxLat2] = bbox2;
  
  return !(
    maxLat1 < minLat2 ||
    minLat1 > maxLat2 ||
    maxLng1 < minLng2 ||
    minLng1 > maxLng2
  );
}

/**
 * Validates if a geometry is valid GeoJSON
 */
export function isValidGeometry(geometry: unknown): geometry is Polygon | MultiPolygon {
  if (!geometry || typeof geometry !== 'object') return false;
  
  const geo = geometry as Record<string, unknown>;
  
  if (geo.type === 'Polygon') {
    return Array.isArray(geo.coordinates) &&
           geo.coordinates.length > 0 &&
           Array.isArray(geo.coordinates[0]) &&
           geo.coordinates[0].length >= 4;
  }
  
  if (geo.type === 'MultiPolygon') {
    return Array.isArray(geo.coordinates) &&
           geo.coordinates.length > 0 &&
           geo.coordinates.every((polygon: unknown) =>
             Array.isArray(polygon) &&
             polygon.length > 0 &&
             Array.isArray(polygon[0]) &&
             polygon[0].length >= 4
           );
  }
  
  return false;
}