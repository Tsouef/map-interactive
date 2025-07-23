import type { LeafletMouseEvent } from 'leaflet';
import type { Zone } from './zone';
import type { Coordinates } from './geography';
import type { Geometry } from 'geojson';

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
  onDrawComplete?: (geometry: Geometry) => void;
  onDrawCancel?: () => void;
  onDrawVertex?: (vertex: Coordinates) => void;
}

/**
 * Drawing modes
 */
export type DrawingMode = 'polygon' | 'rectangle' | 'circle' | 'freehand';