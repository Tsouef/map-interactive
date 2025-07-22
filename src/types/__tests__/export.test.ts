import type {
  ExportFormat,
  ExportOptions,
  ImportOptions,
} from '../export';
import type { Zone } from '../zone';

describe('Export Types', () => {
  it('should accept all ExportFormat values', () => {
    const formats: ExportFormat[] = ['geojson', 'kml', 'csv', 'wkt', 'topojson'];
    
    formats.forEach(format => {
      expect(formats).toContain(format);
    });
  });

  it('should accept valid ExportOptions', () => {
    const options: ExportOptions = {
      format: 'geojson',
      includeProperties: true,
      includeMetrics: true,
      simplify: true,
      simplifyTolerance: 0.01,
      precision: 6,
      propertyMapper: (zone: Zone) => ({
        id: zone.id,
        name: zone.name,
        customField: 'value',
      }),
      fileName: 'selected-zones',
    };
    
    expect(options.format).toBe('geojson');
    expect(options.precision).toBe(6);
    expect(typeof options.propertyMapper).toBe('function');
  });

  it('should accept minimal ExportOptions', () => {
    const options: ExportOptions = {
      format: 'csv',
    };
    
    expect(options.format).toBe('csv');
    expect(options.includeProperties).toBeUndefined();
  });

  it('should accept valid ImportOptions', () => {
    const options: ImportOptions = {
      format: 'geojson',
      propertyMapping: {
        id: 'ZONE_ID',
        name: 'ZONE_NAME',
        postalCode: 'ZIP_CODE',
      },
      validation: {
        checkGeometry: true,
        fixGeometry: true,
        removeDuplicates: true,
      },
      transform: (feature) => {
        if (!feature.properties?.isValid) {
          return null;
        }
        return {
          id: feature.properties.id,
          name: feature.properties.name,
          geometry: feature.geometry,
        } as Zone;
      },
    };
    
    expect(options.format).toBe('geojson');
    expect(options.propertyMapping?.id).toBe('ZONE_ID');
    expect(options.validation?.checkGeometry).toBe(true);
    expect(typeof options.transform).toBe('function');
  });

  it('should accept ImportOptions with auto-detect format', () => {
    const options: ImportOptions = {
      validation: {
        checkGeometry: false,
      },
    };
    
    expect(options.format).toBeUndefined();
    expect(options.validation?.checkGeometry).toBe(false);
  });

  it('should accept property mapper function', () => {
    const mockZone: Zone = {
      id: 'test-1',
      name: 'Test Zone',
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
      },
      properties: {
        area: 1000,
      },
    };

    const options: ExportOptions = {
      format: 'geojson',
      propertyMapper: (zone) => ({
        zoneId: zone.id,
        zoneName: zone.name,
        area: zone.properties?.area || 0,
      }),
    };
    
    const mapped = options.propertyMapper!(mockZone);
    expect(mapped.zoneId).toBe('test-1');
    expect(mapped.area).toBe(1000);
  });
});