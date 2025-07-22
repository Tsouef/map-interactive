import type { Zone } from './zone';

/**
 * Supported export formats
 */
export type ExportFormat = 'geojson' | 'kml' | 'csv' | 'wkt' | 'topojson';

/**
 * Export options
 */
export interface ExportOptions {
  /** Export format */
  format: ExportFormat;
  
  /** Include zone properties */
  includeProperties?: boolean;
  
  /** Include calculated metrics */
  includeMetrics?: boolean;
  
  /** Simplify geometry */
  simplify?: boolean;
  
  /** Simplification tolerance */
  simplifyTolerance?: number;
  
  /** Coordinate precision (decimal places) */
  precision?: number;
  
  /** Custom property mapper */
  propertyMapper?: (zone: Zone) => Record<string, unknown>;
  
  /** File name (without extension) */
  fileName?: string;
}

/**
 * Import options
 */
export interface ImportOptions {
  /** Expected format (auto-detect if not specified) */
  format?: ExportFormat;
  
  /** Property mapping */
  propertyMapping?: {
    id?: string;
    name?: string;
    [key: string]: string | undefined;
  };
  
  /** Validation options */
  validation?: {
    /** Check geometry validity */
    checkGeometry?: boolean;
    
    /** Fix invalid geometries */
    fixGeometry?: boolean;
    
    /** Remove duplicates */
    removeDuplicates?: boolean;
  };
  
  /** Transform function */
  transform?: (feature: unknown) => Zone | null;
}