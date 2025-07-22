// Type definitions for Leaflet Zone Selector (to be implemented in Issue #7)

export type Coordinates = [number, number];

export interface Zone {
  id: string;
  name: string;
  coordinates: Coordinates[];
  properties?: {
    postalCode?: string;
    [key: string]: any;
  };
}

export interface SelectionState {
  selectedZones: Zone[];
  hoveredZone?: Zone;
}

export type ExportFormat = 'geojson' | 'kml' | 'csv';