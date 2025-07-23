import * as turf from '@turf/turf';
import type { Zone } from '../../types';
import type { Polygon, MultiPolygon } from 'geojson';

/**
 * Detects if two zones are adjacent (share a border)
 * @param zone1 First zone
 * @param zone2 Second zone
 * @param tolerance Distance tolerance in meters for adjacency detection
 * @returns true if zones are adjacent, false otherwise
 */
export function detectAdjacency(
  zone1: Zone,
  zone2: Zone,
  tolerance: number = 0.1
): boolean {
  // Quick bbox check first for performance
  if (!bboxesOverlap(zone1, zone2, tolerance)) {
    return false;
  }
  
  try {
    // Handle invalid geometries
    if (!isValidGeometry(zone1.geometry) || !isValidGeometry(zone2.geometry)) {
      return false;
    }

    // Create features from zones
    const feature1 = turf.feature(zone1.geometry);
    const feature2 = turf.feature(zone2.geometry);
    
    // Check if zones directly intersect
    const intersects = turf.booleanIntersects(feature1, feature2);
    
    if (intersects) {
      // Check if they share a meaningful boundary
      // If zones just touch at a point, we don't consider them adjacent
      
      // Get all edges from both polygons
      const edges1 = getPolygonEdges(feature1.geometry);
      const edges2 = getPolygonEdges(feature2.geometry);
      
      // Check if any edges are shared (collinear and overlapping)
      for (const edge1 of edges1) {
        for (const edge2 of edges2) {
          if (edgesShareSegment(edge1, edge2)) {
            return true;
          }
        }
      }
      
      // No shared edges found - only point touches
      return false;
    }
    
    // If no direct intersection, check with tolerance
    if (tolerance > 0) {
      // Convert tolerance to degrees (rough approximation)
      const toleranceDeg = tolerance / 111320;
      
      // Buffer the geometries
      const buffered1 = turf.buffer(feature1, toleranceDeg, { units: 'degrees' });
      const buffered2 = turf.buffer(feature2, toleranceDeg, { units: 'degrees' });
      
      if (!buffered1 || !buffered2) return false;
      
      // Check if buffered zones intersect
      return turf.booleanIntersects(buffered1, buffered2);
    }
    
    return false;
    
  } catch (error) {
    console.warn('Adjacency detection error:', error);
    return false;
  }
}

/**
 * Check if bounding boxes overlap with buffer
 */
function bboxesOverlap(
  zone1: Zone,
  zone2: Zone,
  buffer: number
): boolean {
  const bbox1 = zone1.bbox || turf.bbox(zone1.geometry);
  const bbox2 = zone2.bbox || turf.bbox(zone2.geometry);
  
  // Convert buffer from meters to approximate degrees
  // This is a rough approximation that works reasonably well for small distances
  const bufferDeg = buffer / 111000; // 1 degree ≈ 111km
  
  return !(
    bbox1[2] + bufferDeg < bbox2[0] || // max lon 1 < min lon 2
    bbox1[0] - bufferDeg > bbox2[2] || // min lon 1 > max lon 2
    bbox1[3] + bufferDeg < bbox2[1] || // max lat 1 < min lat 2
    bbox1[1] - bufferDeg > bbox2[3]    // min lat 1 > max lat 2
  );
}

/**
 * Get all edges from a polygon geometry
 */
function getPolygonEdges(geometry: Polygon | MultiPolygon): Array<[number[], number[]]> {
  const edges: Array<[number[], number[]]> = [];
  const rings = geometry.type === 'Polygon' 
    ? geometry.coordinates 
    : geometry.coordinates.flat();
  
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      edges.push([ring[i], ring[i + 1]]);
    }
  }
  
  return edges;
}

/**
 * Check if two edges share a segment (are the same edge or overlapping)
 */
function edgesShareSegment(edge1: [number[], number[]], edge2: [number[], number[]]): boolean {
  // Check if edges are identical (same endpoints, possibly reversed)
  const [p1, p2] = edge1;
  const [p3, p4] = edge2;
  
  // Skip degenerate edges (single points)
  const edge1Length = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
  const edge2Length = Math.sqrt(Math.pow(p4[0] - p3[0], 2) + Math.pow(p4[1] - p3[1], 2));
  
  if (edge1Length < 0.0000001 || edge2Length < 0.0000001) {
    return false;
  }
  
  // Check if edges have the same endpoints (in any order)
  const sameForward = (p1[0] === p3[0] && p1[1] === p3[1] && p2[0] === p4[0] && p2[1] === p4[1]);
  const sameReverse = (p1[0] === p4[0] && p1[1] === p4[1] && p2[0] === p3[0] && p2[1] === p3[1]);
  
  if (sameForward || sameReverse) {
    return true;
  }
  
  // Create line strings for further checks
  const line1 = turf.lineString(edge1);
  const line2 = turf.lineString(edge2);
  
  // Check if edges are collinear
  const bearing1 = turf.bearing(turf.point(p1), turf.point(p2));
  const bearing2 = turf.bearing(turf.point(p3), turf.point(p4));
  const bearingDiff = Math.abs(bearing1 - bearing2) % 180;
  
  // If not collinear (parallel or same line), they can't share a segment
  if (bearingDiff > 0.1 && bearingDiff < 179.9) {
    return false;
  }
  
  // First check if edges share exactly one endpoint
  const p1EqualsP3 = p1[0] === p3[0] && p1[1] === p3[1];
  const p1EqualsP4 = p1[0] === p4[0] && p1[1] === p4[1];
  const p2EqualsP3 = p2[0] === p3[0] && p2[1] === p3[1];
  const p2EqualsP4 = p2[0] === p4[0] && p2[1] === p4[1];
  
  const sharedEndpoints = [p1EqualsP3, p1EqualsP4, p2EqualsP3, p2EqualsP4].filter(x => x).length;
  
  // If they share only one endpoint and are collinear, check if they extend in opposite directions
  if (sharedEndpoints === 1) {
    // Find which point is shared
    let sharedPoint: number[];
    let otherPoint1: number[];
    let otherPoint2: number[];
    
    if (p1EqualsP3) {
      sharedPoint = p1;
      otherPoint1 = p2;
      otherPoint2 = p4;
    } else if (p1EqualsP4) {
      sharedPoint = p1;
      otherPoint1 = p2;
      otherPoint2 = p3;
    } else if (p2EqualsP3) {
      sharedPoint = p2;
      otherPoint1 = p1;
      otherPoint2 = p4;
    } else {
      sharedPoint = p2;
      otherPoint1 = p1;
      otherPoint2 = p3;
    }
    
    // Check if the other endpoints are on opposite sides of the shared point
    const bearing1 = turf.bearing(turf.point(sharedPoint), turf.point(otherPoint1));
    const bearing2 = turf.bearing(turf.point(sharedPoint), turf.point(otherPoint2));
    const bearingDiff = Math.abs(bearing1 - bearing2);
    
    // If bearings are opposite (180 degrees apart), edges extend in opposite directions
    if (bearingDiff > 170 && bearingDiff < 190) {
      return false; // Just touching at a point, not overlapping
    }
  }
  
  // Check if edges overlap by seeing if endpoints of one are on the other
  const p1OnLine2 = turf.booleanPointOnLine(turf.point(p1), line2);
  const p2OnLine2 = turf.booleanPointOnLine(turf.point(p2), line2);
  const p3OnLine1 = turf.booleanPointOnLine(turf.point(p3), line1);
  const p4OnLine1 = turf.booleanPointOnLine(turf.point(p4), line1);
  
  // Special case: if one edge is entirely contained within the other
  if ((p1OnLine2 && p2OnLine2) || (p3OnLine1 && p4OnLine1)) {
    return true;
  }
  
  // Count how many endpoints are on the other line
  const pointsOnOtherLine = [p1OnLine2, p2OnLine2, p3OnLine1, p4OnLine1].filter(x => x).length;
  
  // If at least 2 points are on the other line AND they're not just sharing one endpoint, edges overlap
  return pointsOnOtherLine >= 2 && sharedEndpoints !== 1;
}

/**
 * Validate that a geometry has the required structure
 */
function isValidGeometry(geometry: unknown): boolean {
  const geo = geometry as { type?: string; coordinates?: unknown };
  if (!geo || !geo.type) return false;
  
  if (geo.type === 'Polygon') {
    const coords = geo.coordinates as unknown[][];
    return Array.isArray(coords) && 
           coords.length > 0 &&
           Array.isArray(coords[0]) &&
           coords[0].length >= 4; // Minimum valid polygon
  }
  
  if (geo.type === 'MultiPolygon') {
    const coords = geo.coordinates as unknown[][][];
    return Array.isArray(coords) &&
           coords.length > 0 &&
           coords.every((polygon) =>
             Array.isArray(polygon) &&
             polygon.length > 0 &&
             Array.isArray(polygon[0]) &&
             polygon[0].length >= 4
           );
  }
  
  return false;
}