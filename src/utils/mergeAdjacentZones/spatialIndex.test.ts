import { describe, it, expect, beforeEach } from '@jest/globals';
import { SpatialIndex } from './spatialIndex';
import type { Zone } from '../../types';
import * as turf from '@turf/turf';

describe('SpatialIndex', () => {
  const createZone = (id: string, bbox: [number, number, number, number]): Zone => ({
    id,
    name: `Zone ${id}`,
    geometry: turf.bboxPolygon(bbox).geometry,
    bbox
  });

  describe('initialization', () => {
    it('should create an empty spatial index', () => {
      const index = new SpatialIndex();
      expect(index).toBeDefined();
      expect(index.query([0, 0, 1, 1])).toEqual([]);
    });

    it('should create index with initial zones', () => {
      const zones = [
        createZone('A', [0, 0, 1, 1]),
        createZone('B', [2, 0, 3, 1])
      ];
      
      const index = new SpatialIndex(zones);
      
      // Query that covers first zone
      const results = index.query([0, 0, 1, 1]);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('A');
    });

    it('should handle zones without bbox', () => {
      const zone: Zone = {
        id: 'A',
        name: 'Zone A',
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
        }
      };
      
      const index = new SpatialIndex([zone]);
      
      // Should calculate bbox automatically
      const results = index.query([0, 0, 1, 1]);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('A');
    });
  });

  describe('add operation', () => {
    let index: SpatialIndex;

    beforeEach(() => {
      index = new SpatialIndex();
    });

    it('should add a zone to the index', () => {
      const zone = createZone('A', [0, 0, 1, 1]);
      
      index.add(zone);
      
      const results = index.query([0, 0, 1, 1]);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('A');
    });

    it('should add multiple zones', () => {
      index.add(createZone('A', [0, 0, 1, 1]));
      index.add(createZone('B', [1, 0, 2, 1]));
      index.add(createZone('C', [0, 1, 1, 2]));
      
      // Query that covers all zones
      const results = index.query([0, 0, 2, 2]);
      expect(results).toHaveLength(3);
    });

    it('should handle duplicate zones', () => {
      const zone = createZone('A', [0, 0, 1, 1]);
      
      index.add(zone);
      index.add(zone); // Add same zone again
      
      // Should handle gracefully (implementation specific)
      const results = index.query([0, 0, 1, 1]);
      expect(results.filter(z => z.id === 'A').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('remove operation', () => {
    let index: SpatialIndex;

    beforeEach(() => {
      index = new SpatialIndex([
        createZone('A', [0, 0, 1, 1]),
        createZone('B', [1, 0, 2, 1]),
        createZone('C', [0, 1, 1, 2])
      ]);
    });

    it('should remove a zone from the index', () => {
      const zoneToRemove = createZone('B', [1, 0, 2, 1]);
      
      index.remove(zoneToRemove);
      
      const results = index.query([1, 0, 2, 1]);
      expect(results.find(z => z.id === 'B')).toBeUndefined();
    });

    it('should handle removing non-existent zone', () => {
      const nonExistentZone = createZone('X', [10, 10, 11, 11]);
      
      // Should not throw
      expect(() => index.remove(nonExistentZone)).not.toThrow();
    });
  });

  describe('query operation', () => {
    let index: SpatialIndex;

    beforeEach(() => {
      index = new SpatialIndex([
        createZone('A', [0, 0, 2, 2]),    // Large zone
        createZone('B', [1, 1, 3, 3]),    // Overlapping
        createZone('C', [4, 4, 5, 5]),    // Distant
        createZone('D', [0.5, 0.5, 1.5, 1.5]) // Inside A
      ]);
    });

    it('should find zones within query bbox', () => {
      // Query that includes A, B, D
      const results = index.query([0, 0, 3, 3]);
      
      expect(results).toHaveLength(3);
      expect(results.map(z => z.id).sort()).toEqual(['A', 'B', 'D']);
    });

    it('should return empty array for query with no matches', () => {
      const results = index.query([10, 10, 11, 11]);
      expect(results).toEqual([]);
    });

    it('should find zones that partially overlap query bbox', () => {
      // Query that partially overlaps with A and B
      const results = index.query([1.5, 1.5, 2.5, 2.5]);
      
      expect(results).toHaveLength(2);
      expect(results.map(z => z.id).sort()).toEqual(['A', 'B']);
    });

    it('should handle point queries', () => {
      // Query with zero area (point)
      const results = index.query([1, 1, 1, 1]);
      
      // Should find zones containing this point
      expect(results.map(z => z.id).sort()).toEqual(['A', 'B', 'D']);
    });

    it('should handle large query areas efficiently', () => {
      // Add many zones
      for (let i = 0; i < 1000; i++) {
        const x = i % 100;
        const y = Math.floor(i / 100);
        index.add(createZone(`zone-${i}`, [x, y, x + 0.9, y + 0.9]));
      }
      
      const start = performance.now();
      const results = index.query([40, 5, 60, 7]); // Should find ~40 zones
      const duration = performance.now() - start;
      
      expect(results.length).toBeGreaterThan(20);
      expect(results.length).toBeLessThan(60);
      expect(duration).toBeLessThan(10); // Should be very fast
    });
  });

  describe('MultiPolygon support', () => {
    it('should handle MultiPolygon zones', () => {
      const multiZone: Zone = {
        id: 'multi',
        name: 'Multi Zone',
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
            [[[2, 0], [3, 0], [3, 1], [2, 1], [2, 0]]]
          ]
        }
      };
      
      const index = new SpatialIndex([multiZone]);
      
      // Query should find the zone when querying either polygon
      expect(index.query([0, 0, 1, 1])).toHaveLength(1);
      expect(index.query([2, 0, 3, 1])).toHaveLength(1);
      expect(index.query([0, 0, 3, 1])).toHaveLength(1);
    });
  });

  describe('performance', () => {
    it('should handle 10,000 zones efficiently', () => {
      const zones: Zone[] = [];
      
      // Create a grid of zones
      for (let i = 0; i < 100; i++) {
        for (let j = 0; j < 100; j++) {
          zones.push(createZone(`${i}-${j}`, [i, j, i + 0.9, j + 0.9]));
        }
      }
      
      const start = performance.now();
      const index = new SpatialIndex(zones);
      const buildTime = performance.now() - start;
      
      expect(buildTime).toBeLessThan(100); // Building should be fast
      
      // Query performance
      const queryStart = performance.now();
      const results = index.query([45, 45, 55, 55]);
      const queryTime = performance.now() - queryStart;
      
      expect(queryTime).toBeLessThan(5); // Queries should be very fast
      expect(results.length).toBeGreaterThan(50);
      expect(results.length).toBeLessThan(150);
    });
  });
});