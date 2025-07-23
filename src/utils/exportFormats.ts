import type { Zone, ExportFormat } from '@/types';

// Temporary type for legacy zone structure
// TODO: Update this file to use Zone.geometry in Issue #13
interface LegacyZone extends Omit<Zone, 'geometry'> {
  coordinates: [number, number][];
}

// Mock implementation for testing
export function exportToFormat(zones: Zone[], format: ExportFormat): string | Blob {
  // TODO: Remove type assertion when updating to use geometry in Issue #13
  const legacyZones = zones as unknown as LegacyZone[];
  switch (format) {
    case 'geojson': {
      const geojson = {
        type: 'FeatureCollection',
        features: legacyZones.map(zone => ({
          type: 'Feature',
          properties: {
            id: zone.id,
            name: zone.name,
            ...zone.properties
          },
          geometry: {
            type: 'Polygon',
            coordinates: [zone.coordinates]
          }
        }))
      };
      return JSON.stringify(geojson, null, 2);
    }
    
    case 'kml':
      // Mock KML export
      return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    ${zones.map(zone => `<Placemark><name>${zone.name}</name></Placemark>`).join('\n')}
  </Document>
</kml>`;
    
    case 'csv': {
      // Mock CSV export
      const headers = 'id,name,coordinates\n';
      const rows = legacyZones.map(zone => 
        `${zone.id},${zone.name},"${JSON.stringify(zone.coordinates)}"`
      ).join('\n');
      return headers + rows;
    }
    
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

export function exportToGeoJSON(zones: Zone[]): object {
  // TODO: Remove type assertion when updating to use geometry in Issue #13
  const legacyZones = zones as unknown as LegacyZone[];
  return {
    type: 'FeatureCollection',
    features: legacyZones.map(zone => ({
      type: 'Feature',
      properties: {
        id: zone.id,
        name: zone.name,
        ...zone.properties
      },
      geometry: {
        type: 'Polygon',
        coordinates: [zone.coordinates]
      }
    }))
  };
}

export function exportToKML(zones: Zone[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    ${zones.map(zone => `<Placemark><name>${zone.name}</name></Placemark>`).join('\n')}
  </Document>
</kml>`;
}

export function exportToCSV(zones: Zone[]): string {
  // TODO: Remove type assertion when updating to use geometry in Issue #13
  const legacyZones = zones as unknown as LegacyZone[];
  const headers = 'id,name,coordinates\n';
  const rows = legacyZones.map(zone => 
    `${zone.id},${zone.name},"${JSON.stringify(zone.coordinates)}"`
  ).join('\n');
  return headers + rows;
}