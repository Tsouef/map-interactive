import type * as Types from '../index';

describe('Type Exports', () => {
  // Test that we can use the types (TypeScript compilation will verify this)
  it('should allow usage of geography types', () => {
    const coords: Types.Coordinates = [12.5, 41.9];
    const ring: Types.CoordinateRing = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
    const rings: Types.CoordinateRings = [ring];
    const bbox: Types.BoundingBox = [0, 0, 1, 1];
    const bounds: Types.GeographicBounds = {
      north: 1,
      south: 0,
      east: 1,
      west: 0,
    };

    expect(coords).toHaveLength(2);
    expect(ring).toHaveLength(5);
    expect(rings).toHaveLength(1);
    expect(bbox).toHaveLength(4);
    expect(bounds.north).toBe(1);
  });

  it('should allow usage of zone types', () => {
    const zone: Types.Zone = {
      id: 'test',
      name: 'Test Zone',
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
      },
      properties: {
        postalCode: '12345',
        area: 1000,
      },
      metadata: {
        source: 'osm',
        quality: 'high',
      },
    };

    const division: Types.CityDivision = {
      cityId: 'paris',
      cityName: 'Paris',
      countryCode: 'FR',
      divisionType: 'arrondissement',
      divisions: [zone],
    };

    expect(zone.id).toBe('test');
    expect(division.divisions).toHaveLength(1);
  });

  it('should allow usage of selection types', () => {
    const state: Types.SelectionState = {
      selectedIds: new Set(['zone-1', 'zone-2']),
      selectionOrder: ['zone-1', 'zone-2'],
      mode: 'multiple',
      constraints: {
        maxSelections: 5,
        adjacentOnly: true,
      },
    };

    const event: Types.SelectionChangeEvent = {
      added: [],
      removed: [],
      current: [],
      source: 'click',
    };

    expect(state.selectedIds.size).toBe(2);
    expect(event.source).toBe('click');
  });

  it('should allow usage of theme types', () => {
    const style: Types.ZoneStyle = {
      fillColor: '#3388ff',
      fillOpacity: 0.2,
      weight: 2,
      transitionDuration: 200,
    };

    const theme: Partial<Types.ThemeConfig> = {
      name: 'custom',
      zoneStyles: {
        default: style,
        hover: style,
        selected: style,
        disabled: style,
        error: style,
      },
    };

    expect(style.fillColor).toBe('#3388ff');
    expect(theme.name).toBe('custom');
  });

  it('should allow usage of export/import types', () => {
    const exportOptions: Types.ExportOptions = {
      format: 'geojson',
      includeProperties: true,
      precision: 6,
    };

    const importOptions: Types.ImportOptions = {
      format: 'kml',
      validation: {
        checkGeometry: true,
      },
    };

    expect(exportOptions.format).toBe('geojson');
    expect(importOptions.format).toBe('kml');
  });

  it('should allow usage of metrics types', () => {
    const zoneMetrics: Types.ZoneMetrics = {
      zoneId: 'zone-1',
      area: 1000000,
      perimeter: 4000,
      centroid: [0, 0],
      bounds: [-1, -1, 1, 1],
      vertexCount: 100,
      complexity: 0.5,
    };

    const selectionMetrics: Types.SelectionMetrics = {
      totalArea: 1000000,
      totalPerimeter: 4000,
      count: 1,
      zones: [zoneMetrics],
      bounds: [-1, -1, 1, 1],
      center: [0, 0],
    };

    expect(zoneMetrics.area).toBe(1000000);
    expect(selectionMetrics.count).toBe(1);
  });

  it('should allow usage of event types', () => {
    const drawingMode: Types.DrawingMode = 'polygon';
    
    const zoneEvents: Types.ZoneEvents = {
      onZoneClick: jest.fn(),
    };

    const mapEvents: Types.MapEvents = {
      onMapZoomEnd: jest.fn(),
    };

    const drawingEvents: Types.DrawingEvents = {
      onDrawStart: jest.fn(),
    };

    expect(drawingMode).toBe('polygon');
    expect(zoneEvents.onZoneClick).toBeDefined();
    expect(mapEvents.onMapZoomEnd).toBeDefined();
    expect(drawingEvents.onDrawStart).toBeDefined();
  });

  it('should allow usage of utility types', () => {
    interface TestType {
      id: string;
      data: {
        value: number;
      };
    }

    const partial: Types.DeepPartial<TestType> = {
      data: {
        value: 42,
      },
    };

    const callback: Types.Callback<string> = (msg) => {
      console.log(msg);
    };

    const asyncCallback: Types.AsyncCallback = async () => {
      await Promise.resolve();
    };

    const error: Types.CodedError = {
      name: 'TestError',
      message: 'Test error',
      code: 'TEST_ERROR',
    };

    expect(partial.data?.value).toBe(42);
    expect(typeof callback).toBe('function');
    expect(asyncCallback()).toBeInstanceOf(Promise);
    expect(error.code).toBe('TEST_ERROR');
  });
});