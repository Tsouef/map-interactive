import { describe, it, expect } from '@jest/globals';
import { detectAdjacency } from './adjacencyDetection';
import type { Zone } from '../../types';

describe('detectAdjacency', () => {
  const createZone = (id: string, coordinates: number[][]): Zone => ({
    id,
    name: `Zone ${id}`,
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates]
    }
  });

  describe('basic adjacency detection', () => {
    it('should detect two zones sharing an edge', () => {
      const zone1 = createZone('A', [
        [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
      ]);
      const zone2 = createZone('B', [
        [1, 0], [2, 0], [2, 1], [1, 1], [1, 0]
      ]);
      
      expect(detectAdjacency(zone1, zone2)).toBe(true);
    });

    it('should not detect non-adjacent zones', () => {
      const zone1 = createZone('A', [
        [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
      ]);
      const zone2 = createZone('B', [
        [2, 0], [3, 0], [3, 1], [2, 1], [2, 0]
      ]);
      
      expect(detectAdjacency(zone1, zone2)).toBe(false);
    });

    it('should detect zones with small gaps within tolerance', () => {
      const zone1 = createZone('A', [
        [0, 0], [0.9999999, 0], [0.9999999, 1], [0, 1], [0, 0]
      ]);
      const zone2 = createZone('B', [
        [1.0000001, 0], [2, 0], [2, 1], [1.0000001, 1], [1.0000001, 0]
      ]);
      
      // Gap is ~0.0000002 degrees (~0.02 meters at equator)
      // With default tolerance of 0.1 meters, should be detected
      expect(detectAdjacency(zone1, zone2)).toBe(true);
    });

    it('should not detect zones with gaps beyond tolerance', () => {
      const zone1 = createZone('A', [
        [0, 0], [0.9, 0], [0.9, 1], [0, 1], [0, 0]
      ]);
      const zone2 = createZone('B', [
        [1.1, 0], [2, 0], [2, 1], [1.1, 1], [1.1, 0]
      ]);
      
      // Gap is too large for default tolerance
      expect(detectAdjacency(zone1, zone2, 0.1)).toBe(false);
    });
  });

  describe('edge case handling', () => {
    it('should handle zones touching at a single point', () => {
      const zone1 = createZone('A', [
        [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
      ]);
      const zone2 = createZone('B', [
        [1, 1], [2, 1], [2, 2], [1, 2], [1, 1]
      ]);
      
      // Touching at point (1, 1) only - should not be considered adjacent
      expect(detectAdjacency(zone1, zone2)).toBe(false);
    });

    it('should handle zones with complex shapes', () => {
      // L-shaped zones that share an edge
      const zone1 = createZone('A', [
        [0, 0], [2, 0], [2, 1], [1, 1], [1, 2], [0, 2], [0, 0]
      ]);
      const zone2 = createZone('B', [
        [2, 0], [3, 0], [3, 2], [2, 2], [2, 0]
      ]);
      
      expect(detectAdjacency(zone1, zone2)).toBe(true);
    });

    it('should handle MultiPolygon geometries', () => {
      const zone1: Zone = {
        id: 'A',
        name: 'Zone A',
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
            [[[2, 0], [3, 0], [3, 1], [2, 1], [2, 0]]]
          ]
        }
      };
      const zone2 = createZone('B', [
        [1, 0], [2, 0], [2, 1], [1, 1], [1, 0]
      ]);
      
      // Zone2 is adjacent to the gap between zone1's polygons
      expect(detectAdjacency(zone1, zone2)).toBe(true);
    });
  });

  describe('tolerance parameter', () => {
    it('should respect custom tolerance values', () => {
      const zone1 = createZone('A', [
        [0, 0], [0.995, 0], [0.995, 1], [0, 1], [0, 0]
      ]);
      const zone2 = createZone('B', [
        [1.005, 0], [2, 0], [2, 1], [1.005, 1], [1.005, 0]
      ]);
      
      // Gap is ~0.01 degrees (~1.1km at equator)
      expect(detectAdjacency(zone1, zone2, 0.5)).toBe(false);
      expect(detectAdjacency(zone1, zone2, 2000)).toBe(true); // 2km tolerance
    });

    it('should handle zero tolerance', () => {
      const zone1 = createZone('A', [
        [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
      ]);
      const zone2 = createZone('B', [
        [1, 0], [2, 0], [2, 1], [1, 1], [1, 0]
      ]);
      
      // Even with zero tolerance, perfectly adjacent zones should be detected
      expect(detectAdjacency(zone1, zone2, 0)).toBe(true);
    });
  });

  describe('performance optimization', () => {
    it('should quickly reject zones with non-overlapping bounding boxes', () => {
      const zone1: Zone = {
        id: 'A',
        name: 'Zone A',
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
        },
        bbox: [0, 0, 1, 1]
      };
      const zone2: Zone = {
        id: 'B',
        name: 'Zone B',
        geometry: {
          type: 'Polygon',
          coordinates: [[[10, 10], [11, 10], [11, 11], [10, 11], [10, 10]]]
        },
        bbox: [10, 10, 11, 11]
      };
      
      const start = performance.now();
      expect(detectAdjacency(zone1, zone2)).toBe(false);
      const duration = performance.now() - start;
      
      // Should return very quickly due to bbox check
      expect(duration).toBeLessThan(1);
    });
  });

  describe('error handling', () => {
    it('should handle invalid geometries gracefully', () => {
      const validZone = createZone('A', [
        [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
      ]);
      const invalidZone: Zone = {
        id: 'B',
        name: 'Invalid Zone',
        geometry: {
          type: 'Polygon',
          coordinates: [] // Invalid - no rings
        }
      };
      
      expect(detectAdjacency(validZone, invalidZone)).toBe(false);
      expect(detectAdjacency(invalidZone, validZone)).toBe(false);
    });
  });
});