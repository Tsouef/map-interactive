import * as turf from '@turf/turf';
import type { Zone, Coordinates } from '../types';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { detectAdjacency } from './detectAdjacency';
import { SpatialIndex } from './spatialIndex';
import type { MergedZoneFeature } from './mergeAdjacentZones';

const GAP_TOLERANCE_PERCENTAGE = 0.001; // 0.1% tolerance

export interface MergeOptions {
  useSpatialIndex?: boolean;
  spatialIndexGridSize?: number;
}

/**
 * Optimized version of mergeAdjacentZones that uses spatial indexing
 * @param zones Array of zones to merge
 * @param options Merge options
 * @returns Array of GeoJSON features representing merged zones
 */
export function mergeAdjacentZonesOptimized(
  zones: Zone[], 
  options: MergeOptions = {}
): MergedZoneFeature[] {
  const { 
    useSpatialIndex = zones.length > 50, // Auto-enable for large datasets
    spatialIndexGridSize = Math.min(20, Math.ceil(Math.sqrt(zones.length / 5)))
  } = options;

  if (zones.length === 0) return [];

  // Convert zones to GeoJSON features
  const features = zones.map(zone => convertZoneToFeature(zone));

  // If only one zone, return it wrapped in the expected format
  if (zones.length === 1) {
    return [{
      type: 'Feature',
      geometry: features[0].geometry,
      properties: {
        mergedZones: [zones[0].id],
        mergedNames: [zones[0].name]
      }
    }];
  }

  // Use spatial indexing for large datasets
  if (useSpatialIndex) {
    return mergeWithSpatialIndex(features, zones, spatialIndexGridSize);
  } else {
    return mergeWithoutIndex(features, zones);
  }
}

/**
 * Converts a Zone to a GeoJSON Feature
 */
function convertZoneToFeature(zone: Zone): Feature<Polygon | MultiPolygon> {
  // Check if coordinates represent multiple polygons
  const hasMultiplePolygons = zone.coordinates.length > 1 && 
    zone.coordinates.every(ring => 
      Array.isArray(ring) && 
      ring.length >= 3 &&
      Array.isArray(ring[0]) &&
      typeof ring[0][0] === 'number'
    );

  if (hasMultiplePolygons) {
    const polygons = zone.coordinates.map(coords => [coords]) as Coordinates[][][];
    return turf.multiPolygon(polygons, {
      zoneId: zone.id,
      zoneName: zone.name,
      originalProperties: zone.properties
    });
  } else {
    return turf.polygon(zone.coordinates as Coordinates[][], {
      zoneId: zone.id,
      zoneName: zone.name,
      originalProperties: zone.properties
    });
  }
}

/**
 * Merges zones using spatial indexing for better performance
 */
function mergeWithSpatialIndex(
  features: Feature<Polygon | MultiPolygon>[],
  zones: Zone[],
  gridSize: number
): MergedZoneFeature[] {
  // Create spatial index
  const spatialIndex = new SpatialIndex({ gridSize });
  spatialIndex.addFeatures(features);

  // Group zones by adjacency using spatial index
  const mergedGroups: MergedZoneFeature[] = [];
  const processed = new Set<number>();

  for (let i = 0; i < features.length; i++) {
    if (processed.has(i)) continue;

    const currentGroup = {
      indices: [i],
      zoneIds: [zones[i].id],
      zoneNames: [zones[i].name]
    };
    processed.add(i);

    // Get potential neighbors from spatial index
    const queue = [i];
    const checked = new Set<number>([i]);

    while (queue.length > 0) {
      const currentIdx = queue.shift()!;
      const potentialNeighbors = spatialIndex.getPotentialNeighbors(currentIdx);

      for (const neighborIdx of potentialNeighbors) {
        if (processed.has(neighborIdx) || checked.has(neighborIdx)) continue;
        checked.add(neighborIdx);

        // Check actual adjacency
        if (areZonesAdjacent(features[currentIdx], features[neighborIdx])) {
          currentGroup.indices.push(neighborIdx);
          currentGroup.zoneIds.push(zones[neighborIdx].id);
          currentGroup.zoneNames.push(zones[neighborIdx].name);
          processed.add(neighborIdx);
          queue.push(neighborIdx);
        }
      }
    }

    // Merge the group
    const mergedFeature = mergeFeatureGroup(
      currentGroup.indices.map(idx => features[idx]),
      currentGroup.zoneIds,
      currentGroup.zoneNames
    );
    
    if (mergedFeature) {
      mergedGroups.push(mergedFeature);
    }
  }

  return mergedGroups;
}

/**
 * Original merge algorithm without spatial indexing
 */
function mergeWithoutIndex(
  features: Feature<Polygon | MultiPolygon>[],
  zones: Zone[]
): MergedZoneFeature[] {
  const mergedGroups: MergedZoneFeature[] = [];
  const processed = new Set<number>();

  for (let i = 0; i < features.length; i++) {
    if (processed.has(i)) continue;

    const currentGroup = {
      indices: [i],
      zoneIds: [zones[i].id],
      zoneNames: [zones[i].name]
    };
    processed.add(i);

    // Find all adjacent zones to this group
    let foundAdjacent = true;
    while (foundAdjacent) {
      foundAdjacent = false;

      for (let j = 0; j < features.length; j++) {
        if (processed.has(j)) continue;

        // Check if this zone is adjacent to any in the current group
        let isAdjacent = false;
        for (const groupIndex of currentGroup.indices) {
          if (areZonesAdjacent(features[groupIndex], features[j])) {
            isAdjacent = true;
            break;
          }
        }

        if (isAdjacent) {
          currentGroup.indices.push(j);
          currentGroup.zoneIds.push(zones[j].id);
          currentGroup.zoneNames.push(zones[j].name);
          processed.add(j);
          foundAdjacent = true;
        }
      }
    }

    // Merge the group
    const mergedFeature = mergeFeatureGroup(
      currentGroup.indices.map(idx => features[idx]),
      currentGroup.zoneIds,
      currentGroup.zoneNames
    );
    
    if (mergedFeature) {
      mergedGroups.push(mergedFeature);
    }
  }

  return mergedGroups;
}

/**
 * Merges a group of features into a single feature
 */
function mergeFeatureGroup(
  features: Feature<Polygon | MultiPolygon>[],
  zoneIds: string[],
  zoneNames: string[]
): MergedZoneFeature | null {
  if (features.length === 1) {
    return {
      type: 'Feature',
      geometry: features[0].geometry,
      properties: {
        mergedZones: zoneIds,
        mergedNames: zoneNames
      }
    };
  }

  // Multiple zones, merge them
  let merged: Feature<Polygon | MultiPolygon> | null = null;
  
  try {
    const fc = turf.featureCollection<Polygon | MultiPolygon>(features);
    merged = turf.union(fc);
  } catch {
    // If union fails, return null
    return null;
  }
  
  if (merged && merged.geometry) {
    return {
      type: 'Feature',
      geometry: merged.geometry,
      properties: {
        mergedZones: zoneIds,
        mergedNames: zoneNames
      }
    };
  }

  return null;
}

/**
 * Checks if two zones are adjacent (sharing a border or within tolerance)
 */
function areZonesAdjacent(
  zone1: Feature<Polygon | MultiPolygon>, 
  zone2: Feature<Polygon | MultiPolygon>
): boolean {
  // Handle MultiPolygon adjacency
  const polygons1 = zone1.geometry.type === 'MultiPolygon' 
    ? zone1.geometry.coordinates.map(coords => turf.polygon(coords))
    : [turf.polygon(zone1.geometry.coordinates)];
    
  const polygons2 = zone2.geometry.type === 'MultiPolygon'
    ? zone2.geometry.coordinates.map(coords => turf.polygon(coords))
    : [turf.polygon(zone2.geometry.coordinates)];

  // Check if any polygon from zone1 is adjacent to any polygon from zone2
  for (const poly1 of polygons1) {
    for (const poly2 of polygons2) {
      if (detectAdjacency(poly1, poly2, { gapTolerance: GAP_TOLERANCE_PERCENTAGE })) {
        return true;
      }
    }
  }
  
  return false;
}