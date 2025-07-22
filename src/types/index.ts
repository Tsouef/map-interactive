import type { Map as MapboxMap } from 'mapbox-gl';

export type Coordinates = [number, number];

export interface Zone {
  id: string;
  name: string;
  coordinates: Coordinates[][];
  properties: {
    postalCode?: string;
    population?: number;
    [key: string]: string | number | boolean | undefined;
  };
}

export interface ZoneMetrics {
  area: number; // km²
  perimeter: number; // km
  center: Coordinates;
  boundingBox: [Coordinates, Coordinates];
}

export interface ThemeObject {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
    hover: string;
    selected: string;
    error: string;
    warning: string;
    success: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

export interface MapboxEvent {
  lngLat: {
    lng: number;
    lat: number;
  };
  point: {
    x: number;
    y: number;
  };
  originalEvent: MouseEvent | TouchEvent;
  target: MapboxMap;
  type: string;
}

export interface MapboxZoneSelectorProps {
  // Required Props
  mapboxToken: string;
  
  // Map Configuration
  initialCenter?: [number, number];
  initialZoom?: number;
  mapStyle?: string;
  
  // Behavior Configuration
  multiSelect?: boolean;
  maxSelections?: number;
  enableDrawing?: boolean;
  enableSearch?: boolean;
  
  // Event Callbacks
  onSelectionChange?: (zones: Zone[], coordinates: Coordinates[][][]) => void;
  onZoneClick?: (zone: Zone, event: MapboxEvent) => void;
  onMapLoad?: (map: MapboxMap) => void;
  onError?: (error: Error) => void;
  
  // Styling
  theme?: 'light' | 'dark' | ThemeObject;
  height?: string | number;
  width?: string | number;
}

export interface MapboxZoneSelectorRef {
  getMap: () => MapboxMap | null;
  selectZone: (zoneId: string) => void;
  clearSelection: () => void;
  getSelectedZones: () => Zone[];
  exportSelection: (format: 'geojson' | 'kml' | 'csv') => string;
}

export type ExportFormat = 'geojson' | 'kml' | 'csv';

export interface ConstraintViolation {
  type: 'maxZones' | 'maxArea' | 'minArea' | 'overlap' | 'bounds';
  message: string;
  details?: Record<string, unknown>;
}