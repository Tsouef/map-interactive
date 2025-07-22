import * as turf from '@turf/turf';
import type { Zone, Coordinates } from '../types';
import type { Feature, Polygon, MultiPolygon, GeoJsonProperties } from 'geojson';
import { detectAdjacency } from './detectAdjacency';
import { mergeAdjacentZonesOptimized, type MergeOptions } from './mergeAdjacentZonesOptimized';

export interface MergedZoneProperties extends GeoJsonProperties {
  mergedZones: string[];
  mergedNames: string[];
}

export type MergedZoneFeature = Feature<Polygon | MultiPolygon, MergedZoneProperties>;

const GAP_TOLERANCE_PERCENTAGE = 0.001; // 0.1% tolerance

/**
 * Merges adjacent zones into single polygons where possible
 * @param zones Array of zones to merge
 * @returns Array of GeoJSON features representing merged zones
 */
export function mergeAdjacentZones(zones: Zone[]): MergedZoneFeature[] {
  if (zones.length === 0) return [];

  // Convert zones to GeoJSON features, handling both Polygon and MultiPolygon
  const features = zones.map(zone => {
    // Check if coordinates represent multiple polygons
    // A zone with multiple polygons has all elements as valid rings (arrays of coordinates)
    const hasMultiplePolygons = zone.coordinates.length > 1 && 
      zone.coordinates.every(ring => 
        Array.isArray(ring) && 
        ring.length >= 3 &&
        Array.isArray(ring[0]) &&
        typeof ring[0][0] === 'number'
      );

    if (hasMultiplePolygons) {
      // Create a MultiPolygon from multiple polygon coordinates
      const polygons = zone.coordinates.map(coords => [coords]) as Coordinates[][][];
      return turf.multiPolygon(polygons, {
        zoneId: zone.id,
        zoneName: zone.name,
        originalProperties: zone.properties
      });
    } else {
      // Single polygon (possibly with holes)
      return turf.polygon(zone.coordinates as Coordinates[][], {
        zoneId: zone.id,
        zoneName: zone.name,
        originalProperties: zone.properties
      });
    }
  });

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

  // Group zones by adjacency
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

    // Merge all zones in the group
    if (currentGroup.indices.length === 1) {
      // Single zone, no merging needed
      mergedGroups.push({
        type: 'Feature',
        geometry: features[currentGroup.indices[0]].geometry,
        properties: {
          mergedZones: currentGroup.zoneIds,
          mergedNames: currentGroup.zoneNames
        }
      });
    } else {
      // Multiple zones, merge them
      const featuresToMerge = currentGroup.indices.map(idx => features[idx]);
      
      // Use turf.union with individual features
      let merged: Feature<Polygon | MultiPolygon> | null = null;
      
      try {
        // Start with the first feature
        merged = featuresToMerge[0] as Feature<Polygon | MultiPolygon>;
        
        // Union with each subsequent feature
        for (let i = 1; i < featuresToMerge.length; i++) {
          const unionResult = turf.union(merged as any, featuresToMerge[i] as any);
          if (unionResult) {
            merged = unionResult as Feature<Polygon | MultiPolygon>;
          }
        }
      } catch (error) {
        // If union fails, skip this group
        // This can happen with certain complex geometries
      }
      
      if (merged && merged.geometry) {
        mergedGroups.push({
          type: 'Feature',
          geometry: merged.geometry,
          properties: {
            mergedZones: currentGroup.zoneIds,
            mergedNames: currentGroup.zoneNames
          }
        });
      }
    }
  }

  return mergedGroups;
}

/**
 * Checks if two zones are adjacent (sharing a border or within tolerance)
 */
function areZonesAdjacent(zone1: Feature<Polygon | MultiPolygon>, zone2: Feature<Polygon | MultiPolygon>): boolean {
  // Handle MultiPolygon adjacency by checking if any polygon parts are adjacent
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

// Re-export the optimized version and options
export { mergeAdjacentZonesOptimized, type MergeOptions };