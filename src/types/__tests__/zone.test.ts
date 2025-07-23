import type {
  Zone,
  ZoneProperties,
  ZoneMetadata,
  CityDivision,
} from '../zone';
import type { Polygon, MultiPolygon } from 'geojson';

describe('Zone Types', () => {
  it('should accept valid Zone with Polygon geometry', () => {
    const zone: Zone = {
      id: 'paris-1',
      name: '1st Arrondissement',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [2.3522, 48.8566],
            [2.3532, 48.8566],
            [2.3532, 48.8576],
            [2.3522, 48.8576],
            [2.3522, 48.8566],
          ],
        ],
      } as Polygon,
    };
    
    expect(zone.id).toBe('paris-1');
    expect(zone.name).toBe('1st Arrondissement');
    expect(zone.geometry.type).toBe('Polygon');
  });

  it('should accept valid Zone with MultiPolygon geometry', () => {
    const zone: Zone = {
      id: 'hawaii',
      name: 'Hawaii',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-155.5, 19.5],
              [-155.4, 19.5],
              [-155.4, 19.6],
              [-155.5, 19.6],
              [-155.5, 19.5],
            ],
          ],
        ],
      } as MultiPolygon,
    };
    
    expect(zone.geometry.type).toBe('MultiPolygon');
  });

  it('should accept Zone with properties', () => {
    const zone: Zone = {
      id: 'nyc-manhattan',
      name: 'Manhattan',
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
      } as Polygon,
      properties: {
        postalCode: '10001',
        adminLevel: 4,
        parentId: 'nyc',
        population: 1600000,
        area: 59130000,
        customField: 'value',
      },
    };
    
    expect(zone.properties?.postalCode).toBe('10001');
    expect(zone.properties?.population).toBe(1600000);
  });

  it('should accept Zone with metadata', () => {
    const zone: Zone = {
      id: 'test-zone',
      name: 'Test Zone',
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
      } as Polygon,
      metadata: {
        source: 'osm',
        lastUpdated: new Date('2024-01-01'),
        quality: 'high',
        tags: ['city', 'urban'],
      },
    };
    
    expect(zone.metadata?.source).toBe('osm');
    expect(zone.metadata?.quality).toBe('high');
  });

  it('should accept valid CityDivision', () => {
    const cityDivision: CityDivision = {
      cityId: 'paris',
      cityName: 'Paris',
      countryCode: 'FR',
      divisionType: 'arrondissement',
      divisions: [
        {
          id: 'paris-1',
          name: '1st Arrondissement',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
          } as Polygon,
        },
      ],
    };
    
    expect(cityDivision.cityId).toBe('paris');
    expect(cityDivision.divisions).toHaveLength(1);
  });

  it('should accept ZoneProperties with all fields', () => {
    const props: ZoneProperties = {
      postalCode: '75001',
      adminLevel: 4,
      parentId: 'paris',
      population: 17000,
      area: 1830000,
      customData: { foo: 'bar' },
      anotherField: 123,
    };
    
    expect(props.postalCode).toBe('75001');
    expect(props.customData).toEqual({ foo: 'bar' });
  });

  it('should accept ZoneMetadata with all fields', () => {
    const metadata: ZoneMetadata = {
      source: 'custom',
      lastUpdated: new Date(),
      quality: 'medium',
      tags: ['test', 'sample'],
    };
    
    expect(metadata.source).toBe('custom');
    expect(metadata.tags).toContain('test');
  });
});