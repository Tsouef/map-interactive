import type {
  ZoneMetrics,
  SelectionMetrics,
} from '../metrics';
import type { Coordinates, BoundingBox } from '../geography';

describe('Metrics Types', () => {
  it('should accept valid ZoneMetrics', () => {
    const metrics: ZoneMetrics = {
      zoneId: 'zone-1',
      area: 1500000,
      perimeter: 5000,
      centroid: [2.3522, 48.8566],
      bounds: [2.35, 48.85, 2.36, 48.86],
      vertexCount: 125,
      complexity: 0.75,
    };
    
    expect(metrics.zoneId).toBe('zone-1');
    expect(metrics.area).toBe(1500000);
    expect(metrics.centroid).toHaveLength(2);
    expect(metrics.bounds).toHaveLength(4);
    expect(metrics.complexity).toBeGreaterThanOrEqual(0);
    expect(metrics.complexity).toBeLessThanOrEqual(1);
  });

  it('should accept valid SelectionMetrics', () => {
    const metrics: SelectionMetrics = {
      totalArea: 3000000,
      totalPerimeter: 12000,
      count: 3,
      zones: [
        {
          zoneId: 'zone-1',
          area: 1000000,
          perimeter: 4000,
          centroid: [2.35, 48.85],
          bounds: [2.34, 48.84, 2.36, 48.86],
          vertexCount: 50,
          complexity: 0.3,
        },
        {
          zoneId: 'zone-2',
          area: 1200000,
          perimeter: 4500,
          centroid: [2.36, 48.86],
          bounds: [2.35, 48.85, 2.37, 48.87],
          vertexCount: 75,
          complexity: 0.5,
        },
        {
          zoneId: 'zone-3',
          area: 800000,
          perimeter: 3500,
          centroid: [2.34, 48.84],
          bounds: [2.33, 48.83, 2.35, 48.85],
          vertexCount: 40,
          complexity: 0.2,
        },
      ],
      bounds: [2.33, 48.83, 2.37, 48.87],
      center: [2.35, 48.85],
      convexHullArea: 3500000,
      compactness: 0.857,
    };
    
    expect(metrics.totalArea).toBe(3000000);
    expect(metrics.count).toBe(3);
    expect(metrics.zones).toHaveLength(3);
    expect(metrics.convexHullArea).toBe(3500000);
    expect(metrics.compactness).toBeGreaterThan(0);
    expect(metrics.compactness).toBeLessThanOrEqual(1);
  });

  it('should accept SelectionMetrics without optional fields', () => {
    const metrics: SelectionMetrics = {
      totalArea: 1000000,
      totalPerimeter: 4000,
      count: 1,
      zones: [
        {
          zoneId: 'zone-1',
          area: 1000000,
          perimeter: 4000,
          centroid: [0, 0],
          bounds: [-1, -1, 1, 1],
          vertexCount: 4,
          complexity: 0.1,
        },
      ],
      bounds: [-1, -1, 1, 1],
      center: [0, 0],
    };
    
    expect(metrics.convexHullArea).toBeUndefined();
    expect(metrics.compactness).toBeUndefined();
  });

  it('should validate coordinate types', () => {
    const centroid: Coordinates = [12.5, 41.9];
    const bounds: BoundingBox = [12.4, 41.8, 12.6, 42.0];
    
    const metrics: ZoneMetrics = {
      zoneId: 'test',
      area: 1000,
      perimeter: 100,
      centroid,
      bounds,
      vertexCount: 10,
      complexity: 0.5,
    };
    
    expect(metrics.centroid).toEqual(centroid);
    expect(metrics.bounds).toEqual(bounds);
  });
});