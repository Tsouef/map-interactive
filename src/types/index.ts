/**
 * Leaflet Zone Selector - Type Definitions
 * 
 * This module exports all type definitions for the Leaflet Zone Selector library.
 * Types are organized by category for better maintainability.
 */

// Geographic types
export type {
  Coordinates,
  CoordinateRing,
  CoordinateRings,
  BoundingBox,
  GeographicBounds,
  // Re-export GeoJSON types
  Feature,
  FeatureCollection,
  Geometry,
  Polygon,
  MultiPolygon,
  Point,
  LineString,
} from './geography';

// Zone types
export type {
  Zone,
  ZoneProperties,
  ZoneMetadata,
  CityDivision,
} from './zone';

// Selection types
export type {
  SelectionState,
  SelectionMode,
  SelectionConstraints,
  SelectionChangeEvent,
} from './selection';

// Theme and styling types
export type {
  ZoneVisualState,
  ZoneStyle,
  ThemeConfig,
  PresetTheme,
} from './theme';

// Export and import types
export type {
  ExportFormat,
  ExportOptions,
  ImportOptions,
} from './export';

// Metrics types
export type {
  ZoneMetrics,
  SelectionMetrics,
} from './metrics';

// Event types
export type {
  ZoneEvents,
  MapEvents,
  DrawingEvents,
  DrawingMode,
} from './events';

// Utility types
export type {
  DeepPartial,
  Mutable,
  ValueOf,
  EnsureArray,
  Callback,
  AsyncCallback,
  CodedError,
} from './utils';

// Legacy types (for backward compatibility)
export type {
  LegacyZone,
} from './legacy';
export { isLegacyZone } from './legacy';