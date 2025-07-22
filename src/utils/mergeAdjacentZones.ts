import * as turf from '@turf/turf';
import type { Zone } from '../types';
import type { Feature, Polygon, MultiPolygon, GeoJsonProperties } from 'geojson';
import { detectAdjacency } from './detectAdjacency';

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

  // Convert zones to GeoJSON features
  const features = zones.map(zone => 
    turf.polygon(zone.coordinates, {
      zoneId: zone.id,
      zoneName: zone.name,
      originalProperties: zone.properties
    })
  );

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
      const merged = turf.union(turf.featureCollection(featuresToMerge));
      
      if (merged) {
        mergedGroups.push({
          type: 'Feature',
          geometry: merged.geometry as Polygon | MultiPolygon,
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
function areZonesAdjacent(zone1: Feature<Polygon>, zone2: Feature<Polygon>): boolean {
  return detectAdjacency(zone1, zone2, { gapTolerance: GAP_TOLERANCE_PERCENTAGE });
}