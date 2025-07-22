// Leaflet Zone Selector - Main Entry Point

// Import CSS for the library
import './styles/leaflet-zone-selector.css';

// Version
export const VERSION = '0.1.0';

// Main Component exports (to be implemented in Issue #4)
export { LeafletZoneSelector } from './components/LeafletZoneSelector';
export type { LeafletZoneSelectorProps, LeafletZoneSelectorRef } from './components/LeafletZoneSelector';

// Hook exports (to be implemented in Issue #8)
export { useZoneSelection } from './hooks/useZoneSelection';
export { useZoneMetrics } from './hooks/useZoneMetrics';

// Utility exports (to be implemented in Issue #9)
export { mergeAdjacentZones } from './utils/mergeAdjacentZones';
export { exportToGeoJSON, exportToKML, exportToCSV } from './utils/exportFormats';

// Type exports (to be implemented in Issue #7)
export type { Zone, Coordinates, SelectionState, ExportFormat } from './types';

// Export a simple test function to verify TypeScript compilation
export function getVersion(): string {
  return VERSION;
}