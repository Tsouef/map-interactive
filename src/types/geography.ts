/**
 * Coordinate pair following GeoJSON specification
 * @format [longitude, latitude]
 */
export type Coordinates = [number, number];

/**
 * Coordinate ring for polygons
 */
export type CoordinateRing = Coordinates[];

/**
 * Multi-dimensional coordinate array for complex polygons
 */
export type CoordinateRings = CoordinateRing[];

/**
 * Bounding box: [minLon, minLat, maxLon, maxLat]
 */
export type BoundingBox = [number, number, number, number];

/**
 * Geographic bounds for Leaflet
 */
export interface GeographicBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * GeoJSON types re-exported for convenience
 */
export type {
  Feature,
  FeatureCollection,
  Geometry,
  Polygon,
  MultiPolygon,
  Point,
  LineString
} from 'geojson';