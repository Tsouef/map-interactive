import type { Polygon, MultiPolygon } from 'geojson';
import type { BoundingBox } from './geography';

/**
 * Base zone interface
 */
export interface Zone {
  /** Unique identifier for the zone */
  id: string;
  
  /** Display name of the zone */
  name: string;
  
  /** GeoJSON geometry */
  geometry: Polygon | MultiPolygon;
  
  /** Optional bounding box for performance */
  bbox?: BoundingBox;
  
  /** Additional properties */
  properties?: ZoneProperties;
  
  /** Metadata */
  metadata?: ZoneMetadata;
}

/**
 * Standard zone properties
 */
export interface ZoneProperties {
  /** Postal/ZIP code if applicable */
  postalCode?: string;
  
  /** Administrative level (city, district, etc.) */
  adminLevel?: number;
  
  /** Parent zone ID for hierarchical data */
  parentId?: string;
  
  /** Population if known */
  population?: number;
  
  /** Area in square meters */
  area?: number;
  
  /** Any additional custom properties */
  [key: string]: unknown;
}

/**
 * Zone metadata for internal use
 */
export interface ZoneMetadata {
  /** Source of the zone data */
  source?: 'osm' | 'custom' | 'import' | string;
  
  /** Last updated timestamp */
  lastUpdated?: Date;
  
  /** Data quality indicator */
  quality?: 'high' | 'medium' | 'low';
  
  /** Tags for categorization */
  tags?: string[];
}

/**
 * City division information
 */
export interface CityDivision {
  /** City identifier */
  cityId: string;
  
  /** City name */
  cityName: string;
  
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode: string;
  
  /** Administrative divisions */
  divisions: Zone[];
  
  /** Division type (borough, arrondissement, district, etc.) */
  divisionType: string;
}

/**
 * Zone type that supports both modern geometry and legacy coordinates
 * @deprecated The coordinates property is deprecated, use geometry instead
 */
export interface ZoneCompat extends Zone {
  /** Legacy coordinates property for backward compatibility */
  coordinates?: import('./geography').Coordinates[];
}