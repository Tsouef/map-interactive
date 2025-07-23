import type { Polygon, MultiPolygon } from 'geojson';
import type { Zone, BoundingBox } from '../../types';

/**
 * Options for merging adjacent zones
 */
export interface MergeOptions {
  /** Distance tolerance for adjacency detection (meters) */
  tolerance?: number;
  
  /** Preserve properties from original zones */
  preserveProperties?: boolean;
  
  /** Simplify merged geometry */
  simplify?: boolean;
  
  /** Simplification tolerance */
  simplifyTolerance?: number;
  
  /** Use spatial index for performance */
  useSpatialIndex?: boolean;
  
  /** Custom property merger function */
  propertyMerger?: (zones: Zone[]) => Record<string, any>;
}

/**
 * Result of merge operation
 */
export interface MergeResult {
  /** Merged polygon groups */
  mergedGroups: MergedZoneGroup[];
  
  /** Zones that couldn't be merged */
  unmergedZones: Zone[];
  
  /** Performance metrics */
  metrics: {
    totalZones: number;
    mergedGroups: number;
    processingTime: number;
  };
}

/**
 * A group of merged zones
 */
export interface MergedZoneGroup {
  /** Combined geometry */
  geometry: Polygon | MultiPolygon;
  
  /** Original zone IDs */
  zoneIds: string[];
  
  /** Merged properties */
  properties: Record<string, any>;
  
  /** Bounding box */
  bbox: BoundingBox;
}

/**
 * Item for spatial indexing
 */
export interface SpatialIndexItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  zone: Zone;
}