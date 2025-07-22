import type { PathOptions, LeafletMouseEvent } from 'leaflet';
import type { Polygon, MultiPolygon } from 'geojson';

export interface ZoneLayerProps {
  zones: Zone[];
  selectedZoneIds: string[];
  hoveredZoneId?: string | null;
  
  // Styling
  defaultStyle?: PathOptions;
  hoverStyle?: PathOptions;
  selectedStyle?: PathOptions;
  getZoneStyle?: (zone: Zone, state: ZoneState) => PathOptions;
  
  // Behavior
  interactive?: boolean;
  smoothTransitions?: boolean;
  virtualizationThreshold?: number;
  
  // Events
  onZoneClick?: (zone: Zone, event: LeafletMouseEvent) => void;
  onZoneHover?: (zone: Zone | null, event?: LeafletMouseEvent) => void;
  onZoneDoubleClick?: (zone: Zone, event: LeafletMouseEvent) => void;
  
  // Performance
  simplifyTolerance?: number;
  updateOnlyVisibleZones?: boolean;
}

export type ZoneState = 'default' | 'hover' | 'selected' | 'selected-hover';

export interface Zone {
  id: string;
  name: string;
  geometry: Polygon | MultiPolygon;
  properties?: Record<string, unknown>;
  bbox?: [number, number, number, number]; // For performance
}