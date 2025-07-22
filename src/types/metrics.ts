import type { Coordinates, BoundingBox } from './geography';

/**
 * Zone metrics
 */
export interface ZoneMetrics {
  /** Zone identifier */
  zoneId: string;
  
  /** Area in square meters */
  area: number;
  
  /** Perimeter in meters */
  perimeter: number;
  
  /** Centroid coordinates */
  centroid: Coordinates;
  
  /** Bounding box */
  bounds: BoundingBox;
  
  /** Number of vertices */
  vertexCount: number;
  
  /** Complexity score (0-1) */
  complexity: number;
}

/**
 * Selection metrics
 */
export interface SelectionMetrics {
  /** Total area of selected zones */
  totalArea: number;
  
  /** Total perimeter */
  totalPerimeter: number;
  
  /** Number of selected zones */
  count: number;
  
  /** Individual zone metrics */
  zones: ZoneMetrics[];
  
  /** Combined bounds */
  bounds: BoundingBox;
  
  /** Geographic center */
  center: Coordinates;
  
  /** Convex hull area */
  convexHullArea?: number;
  
  /** Compactness ratio */
  compactness?: number;
}