import type { CSSProperties } from 'react';
import type { LatLngBoundsExpression, LeafletMouseEvent, Map } from 'leaflet';
import type { Zone, ExportFormat } from '@/types';

// Theme configuration
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
    hover?: string;
    selected?: string;
    error?: string;
    success?: string;
  };
  spacing?: SpacingScale;
  borderRadius?: BorderRadiusScale;
  shadows?: ShadowScale;
  transitions?: TransitionConfig;
}

export interface SpacingScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface BorderRadiusScale {
  none: string;
  sm: string;
  md: string;
  lg: string;
  full: string;
}

export interface ShadowScale {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface TransitionConfig {
  duration: number;
  easing: string;
}

// Selection metrics
export interface SelectionMetrics {
  totalArea: number;
  totalPerimeter: number;
  zoneCount: number;
  boundingBox: [[number, number], [number, number]];
  center: [number, number];
}

// Component props
export interface LeafletZoneSelectorProps {
  // Map Configuration
  initialCenter?: [number, number];
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  bounds?: [[number, number], [number, number]];
  
  // Data
  zones?: Zone[];
  loadZonesAsync?: () => Promise<Zone[]>;
  
  // Selection
  multiSelect?: boolean;
  maxSelections?: number;
  selectedZoneIds?: string[];
  
  // Behavior
  enableSearch?: boolean;
  enableDrawing?: boolean;
  enableKeyboardNavigation?: boolean;
  
  // Styling
  theme?: 'light' | 'dark' | ThemeConfig;
  containerClassName?: string;
  containerStyle?: CSSProperties;
  
  // Callbacks
  onSelectionChange?: (zones: Zone[]) => void;
  onZoneClick?: (zone: Zone, event: LeafletMouseEvent) => void;
  onZoneHover?: (zone: Zone | null) => void;
  onMapReady?: (map: Map) => void;
  onError?: (error: Error) => void;
  
  // Children (for error boundary testing)
  children?: React.ReactNode;
}

// Component ref interface
export interface LeafletZoneSelectorRef {
  // Map Control
  setView: (center: [number, number], zoom?: number) => void;
  fitBounds: (bounds: LatLngBoundsExpression) => void;
  
  // Selection
  selectZones: (zoneIds: string[]) => void;
  clearSelection: () => void;
  getSelectedZones: () => Zone[];
  
  // Data
  loadZones: (zones: Zone[]) => void;
  refreshZones: () => Promise<void>;
  
  // Export
  exportSelection: (format: ExportFormat) => string | Blob;
  getSelectionMetrics: () => SelectionMetrics;
}

// Child component props
export interface ZoneLayerProps {
  zones: Zone[];
  selectedZoneIds: string[];
  hoveredZoneId?: string;
  onZoneClick: (zone: Zone, event: LeafletMouseEvent) => void;
  onZoneHover: (zone: Zone | null) => void;
  theme: 'light' | 'dark' | ThemeConfig;
}

export interface SearchInputProps {
  onLocationFound: (location: { center: [number, number]; bounds?: LatLngBoundsExpression }) => void;
}

export interface DrawingToolsProps {
  onShapeCreated: (shape: GeoJSON.Feature) => void;
}

export interface LoadingOverlayProps {
  message?: string;
}

export interface ErrorBoundaryProps {
  onError?: (error: Error) => void;
  children: React.ReactNode;
}