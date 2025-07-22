# Issue #7: Define Zone, Coordinates, and Selection Types

**Labels**: types, typescript, foundation, high-priority

## Description

Create comprehensive TypeScript type definitions for the library, including Zone data structures, coordinate systems, selection states, and all public API interfaces.

## Acceptance Criteria

- [ ] Zone type with geometry and properties
- [ ] Coordinate type following GeoJSON spec
- [ ] Selection state management types
- [ ] Export format type definitions
- [ ] Theme and styling types
- [ ] Event handler types
- [ ] Utility types for type safety
- [ ] Full JSDoc documentation

## Technical Implementation

### Core Geographic Types
```typescript
// src/types/geography.ts

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
```

### Zone Types
```typescript
// src/types/zone.ts
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
  [key: string]: any;
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
```

### Selection Types
```typescript
// src/types/selection.ts

/**
 * Selection state for zones
 */
export interface SelectionState {
  /** Currently selected zone IDs */
  selectedIds: Set<string>;
  
  /** Selection order for multi-select */
  selectionOrder: string[];
  
  /** Last selected zone ID */
  lastSelectedId?: string;
  
  /** Selection mode */
  mode: SelectionMode;
  
  /** Selection constraints */
  constraints?: SelectionConstraints;
}

/**
 * Selection modes
 */
export type SelectionMode = 'single' | 'multiple' | 'range' | 'adjacent';

/**
 * Constraints for zone selection
 */
export interface SelectionConstraints {
  /** Maximum number of selections */
  maxSelections?: number;
  
  /** Minimum number of selections */
  minSelections?: number;
  
  /** Maximum total area (square meters) */
  maxArea?: number;
  
  /** Minimum total area (square meters) */
  minArea?: number;
  
  /** Only allow adjacent zone selection */
  adjacentOnly?: boolean;
  
  /** Custom validation function */
  validate?: (zones: Zone[]) => boolean | string;
}

/**
 * Selection change event
 */
export interface SelectionChangeEvent {
  /** Newly selected zones */
  added: Zone[];
  
  /** Newly deselected zones */
  removed: Zone[];
  
  /** All currently selected zones */
  current: Zone[];
  
  /** Trigger source */
  source: 'click' | 'keyboard' | 'api' | 'draw';
}
```

### Style and Theme Types
```typescript
// src/types/theme.ts
import type { PathOptions } from 'leaflet';

/**
 * Zone visual state
 */
export type ZoneVisualState = 'default' | 'hover' | 'selected' | 'disabled' | 'error';

/**
 * Style configuration for a visual state
 */
export interface ZoneStyle extends PathOptions {
  /** Transition duration in ms */
  transitionDuration?: number;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Cursor style */
  cursor?: string;
}

/**
 * Complete theme configuration
 */
export interface ThemeConfig {
  /** Theme name */
  name: string;
  
  /** Zone styles by state */
  zoneStyles: Record<ZoneVisualState, ZoneStyle>;
  
  /** Map container styles */
  mapStyles: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  };
  
  /** UI component styles */
  componentStyles: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
    error: string;
    warning: string;
    success: string;
  };
  
  /** Typography */
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
  };
  
  /** Spacing scale */
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  /** Border radius scale */
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  
  /** Shadow scale */
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

/**
 * Preset theme names
 */
export type PresetTheme = 'light' | 'dark' | 'contrast' | 'colorblind';
```

### Export Types
```typescript
// src/types/export.ts

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
  propertyMapper?: (zone: Zone) => Record<string, any>;
  
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
  transform?: (feature: any) => Zone | null;
}
```

### Metrics Types
```typescript
// src/types/metrics.ts

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
```

### Event Types
```typescript
// src/types/events.ts
import type { LeafletMouseEvent, LeafletKeyboardEvent } from 'leaflet';
import type { Zone } from './zone';

/**
 * Zone interaction events
 */
export interface ZoneEvents {
  onZoneClick?: (zone: Zone, event: LeafletMouseEvent) => void;
  onZoneDoubleClick?: (zone: Zone, event: LeafletMouseEvent) => void;
  onZoneMouseEnter?: (zone: Zone, event: LeafletMouseEvent) => void;
  onZoneMouseLeave?: (zone: Zone, event: LeafletMouseEvent) => void;
  onZoneContextMenu?: (zone: Zone, event: LeafletMouseEvent) => void;
}

/**
 * Map interaction events
 */
export interface MapEvents {
  onMapClick?: (event: LeafletMouseEvent) => void;
  onMapMoveEnd?: (center: Coordinates, zoom: number) => void;
  onMapZoomEnd?: (zoom: number) => void;
}

/**
 * Drawing events
 */
export interface DrawingEvents {
  onDrawStart?: (mode: DrawingMode) => void;
  onDrawComplete?: (geometry: GeoJSON.Geometry) => void;
  onDrawCancel?: () => void;
  onDrawVertex?: (vertex: Coordinates) => void;
}

/**
 * Drawing modes
 */
export type DrawingMode = 'polygon' | 'rectangle' | 'circle' | 'freehand';
```

### Utility Types
```typescript
// src/types/utils.ts

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Mutable type (removes readonly)
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Value of object
 */
export type ValueOf<T> = T[keyof T];

/**
 * Ensure array type
 */
export type EnsureArray<T> = T extends any[] ? T : T[];

/**
 * Callback function type
 */
export type Callback<T = void> = T extends void ? () => void : (arg: T) => void;

/**
 * Async callback function type
 */
export type AsyncCallback<T = void> = T extends void ? () => Promise<void> : (arg: T) => Promise<void>;

/**
 * Error with code
 */
export interface CodedError extends Error {
  code: string;
  details?: any;
}
```

## Testing Requirements

- [ ] All types compile without errors
- [ ] Types are properly exported
- [ ] JSDoc comments are valid
- [ ] No use of 'any' type
- [ ] Strict null checks pass
- [ ] Types work with strict mode

## Documentation Requirements

- [ ] Each type has JSDoc comments
- [ ] Complex types have usage examples
- [ ] Type relationships documented
- [ ] Migration guide for breaking changes

## Related Issues

- #4: LeafletZoneSelector component props
- #6: ZoneLayer component types
- #19: Selection hook types
- #30: Export functionality types