import * as turf from '@turf/turf';
import type { Feature, Polygon } from 'geojson';

export interface AdjacencyOptions {
  /**
   * Gap tolerance as a percentage of the smaller polygon's diagonal
   * Default: 0.001 (0.1%)
   */
  gapTolerance?: number;
}

const DEFAULT_GAP_TOLERANCE = 0.001; // 0.1%

/**
 * Detects if two polygons are adjacent (sharing a border or within tolerance)
 * @param zone1 First polygon feature
 * @param zone2 Second polygon feature
 * @param options Adjacency detection options
 * @returns true if zones are adjacent, false otherwise
 */
export function detectAdjacency(
  zone1: Feature<Polygon>,
  zone2: Feature<Polygon>,
  options: AdjacencyOptions = {}
): boolean {
  const { gapTolerance = DEFAULT_GAP_TOLERANCE } = options;

  // Fast path: check if polygons intersect or touch
  if (turf.booleanIntersects(zone1, zone2)) {
    return true;
  }

  // If no direct intersection, check if they're within tolerance
  return areZonesWithinTolerance(zone1, zone2, gapTolerance);
}

/**
 * Checks if two zones are within the specified tolerance distance
 */
function areZonesWithinTolerance(
  zone1: Feature<Polygon>,
  zone2: Feature<Polygon>,
  gapTolerance: number
): boolean {
  // Calculate bounding boxes
  const bbox1 = turf.bbox(zone1);
  const bbox2 = turf.bbox(zone2);

  // Calculate the diagonal of each bounding box
  const diagonal1 = Math.sqrt(
    Math.pow(bbox1[2] - bbox1[0], 2) + Math.pow(bbox1[3] - bbox1[1], 2)
  );
  const diagonal2 = Math.sqrt(
    Math.pow(bbox2[2] - bbox2[0], 2) + Math.pow(bbox2[3] - bbox2[1], 2)
  );

  // Use the smaller diagonal for tolerance calculation
  const minDiagonal = Math.min(diagonal1, diagonal2);
  const toleranceDistance = minDiagonal * gapTolerance;

  // Quick check: if bounding boxes are too far apart, zones can't be adjacent
  const bboxDistance = calculateBoundingBoxDistance(
    [bbox1[0], bbox1[1], bbox1[2], bbox1[3]],
    [bbox2[0], bbox2[1], bbox2[2], bbox2[3]]
  );
  if (bboxDistance > toleranceDistance) {
    return false;
  }

  // Buffer the zones by the tolerance and check for intersection
  try {
    // Use a very small buffer for numerical stability
    const bufferDistance = Math.max(toleranceDistance, 0.0000001);
    
    const buffered1 = turf.buffer(zone1, bufferDistance, { units: 'degrees' });
    const buffered2 = turf.buffer(zone2, bufferDistance, { units: 'degrees' });

    if (!buffered1 || !buffered2) {
      return false;
    }

    return turf.booleanIntersects(buffered1, buffered2);
  } catch {
    // If buffering fails (e.g., for very small or invalid polygons), fall back to distance check
    return calculateMinimumDistance(zone1, zone2) <= toleranceDistance;
  }
}

/**
 * Calculates the minimum distance between two bounding boxes
 */
function calculateBoundingBoxDistance(
  bbox1: [number, number, number, number],
  bbox2: [number, number, number, number]
): number {
  // Calculate the distance between the closest points of the two bounding boxes
  const xDistance = Math.max(0, Math.max(bbox1[0], bbox2[0]) - Math.min(bbox1[2], bbox2[2]));
  const yDistance = Math.max(0, Math.max(bbox1[1], bbox2[1]) - Math.min(bbox1[3], bbox2[3]));
  
  return Math.sqrt(xDistance * xDistance + yDistance * yDistance);
}

/**
 * Calculates the minimum distance between two polygons
 * This is a fallback for when buffering operations fail
 */
function calculateMinimumDistance(
  zone1: Feature<Polygon>,
  zone2: Feature<Polygon>
): number {
  let minDistance = Infinity;

  // Get the coordinates of both polygons
  const coords1 = zone1.geometry.coordinates[0];
  const coords2 = zone2.geometry.coordinates[0];

  // Check distance between all edge segments
  for (let i = 0; i < coords1.length - 1; i++) {
    const line1 = turf.lineString([coords1[i], coords1[i + 1]]);
    
    for (let j = 0; j < coords2.length - 1; j++) {
      const line2 = turf.lineString([coords2[j], coords2[j + 1]]);
      
      // Calculate distance between line segments
      const pt1 = turf.nearestPointOnLine(line2, coords1[i]);
      const pt2 = turf.nearestPointOnLine(line1, coords2[j]);
      
      const dist1 = turf.distance(turf.point(coords1[i]), pt1);
      const dist2 = turf.distance(turf.point(coords2[j]), pt2);
      
      minDistance = Math.min(minDistance, dist1, dist2);
    }
  }

  // Convert from kilometers to degrees (approximate)
  return minDistance / 111.32;
}