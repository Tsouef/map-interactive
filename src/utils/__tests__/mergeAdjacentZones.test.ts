import { mergeAdjacentZones } from '../mergeAdjacentZones';
import type { Zone } from '../../types';

describe('mergeAdjacentZones', () => {
  describe('basic merging', () => {
    it('should return empty array for empty input', () => {
      const result = mergeAdjacentZones([]);
      expect(result).toEqual([]);
    });

    it('should return single zone unchanged', () => {
      const zone: Zone = {
        id: 'zone-1',
        name: 'Zone 1',
        coordinates: [[
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0]
        ]],
        properties: {}
      };

      const result = mergeAdjacentZones([zone]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: zone.coordinates
        },
        properties: {
          mergedZones: ['zone-1'],
          mergedNames: ['Zone 1']
        }
      });
    });

    it('should merge two adjacent zones sharing an edge', () => {
      const zone1: Zone = {
        id: 'zone-1',
        name: 'Zone 1',
        coordinates: [[
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0]
        ]],
        properties: {}
      };

      const zone2: Zone = {
        id: 'zone-2',
        name: 'Zone 2',
        coordinates: [[
          [1, 0],
          [2, 0],
          [2, 1],
          [1, 1],
          [1, 0]
        ]],
        properties: {}
      };

      const result = mergeAdjacentZones([zone1, zone2]);
      expect(result).toHaveLength(1);
      expect(result[0].properties.mergedZones).toContain('zone-1');
      expect(result[0].properties.mergedZones).toContain('zone-2');
      expect(result[0].geometry.type).toBe('Polygon');
    });

    it('should keep non-adjacent zones separate', () => {
      const zone1: Zone = {
        id: 'zone-1',
        name: 'Zone 1',
        coordinates: [[
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0]
        ]],
        properties: {}
      };

      const zone2: Zone = {
        id: 'zone-2',
        name: 'Zone 2',
        coordinates: [[
          [3, 0],
          [4, 0],
          [4, 1],
          [3, 1],
          [3, 0]
        ]],
        properties: {}
      };

      const result = mergeAdjacentZones([zone1, zone2]);
      expect(result).toHaveLength(2);
      expect(result[0].properties.mergedZones).toEqual(['zone-1']);
      expect(result[1].properties.mergedZones).toEqual(['zone-2']);
    });
  });

  describe('gap tolerance', () => {
    it('should merge zones with small gap (within 0.1% tolerance)', () => {
      const zone1: Zone = {
        id: 'zone-1',
        name: 'Zone 1',
        coordinates: [[
          [0, 0],
          [0.999, 0],
          [0.999, 1],
          [0, 1],
          [0, 0]
        ]],
        properties: {}
      };

      const zone2: Zone = {
        id: 'zone-2',
        name: 'Zone 2',
        coordinates: [[
          [1.0001, 0],
          [2, 0],
          [2, 1],
          [1.0001, 1],
          [1.0001, 0]
        ]],
        properties: {}
      };

      const result = mergeAdjacentZones([zone1, zone2]);
      expect(result).toHaveLength(1);
      expect(result[0].properties.mergedZones).toHaveLength(2);
    });

    it('should not merge zones with gap exceeding tolerance', () => {
      const zone1: Zone = {
        id: 'zone-1',
        name: 'Zone 1',
        coordinates: [[
          [0, 0],
          [0.99, 0],
          [0.99, 1],
          [0, 1],
          [0, 0]
        ]],
        properties: {}
      };

      const zone2: Zone = {
        id: 'zone-2',
        name: 'Zone 2',
        coordinates: [[
          [1.01, 0],
          [2, 0],
          [2, 1],
          [1.01, 1],
          [1.01, 0]
        ]],
        properties: {}
      };

      const result = mergeAdjacentZones([zone1, zone2]);
      expect(result).toHaveLength(2);
    });
  });

  describe('complex scenarios', () => {
    it('should handle chain of adjacent zones', () => {
      const zones: Zone[] = [
        {
          id: 'zone-1',
          name: 'Zone 1',
          coordinates: [[
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0]
          ]],
          properties: {}
        },
        {
          id: 'zone-2',
          name: 'Zone 2',
          coordinates: [[
            [1, 0],
            [2, 0],
            [2, 1],
            [1, 1],
            [1, 0]
          ]],
          properties: {}
        },
        {
          id: 'zone-3',
          name: 'Zone 3',
          coordinates: [[
            [2, 0],
            [3, 0],
            [3, 1],
            [2, 1],
            [2, 0]
          ]],
          properties: {}
        }
      ];

      const result = mergeAdjacentZones(zones);
      expect(result).toHaveLength(1);
      expect(result[0].properties.mergedZones).toHaveLength(3);
    });

    it('should handle multiple groups of adjacent zones', () => {
      const zones: Zone[] = [
        // Group 1
        {
          id: 'zone-1',
          name: 'Zone 1',
          coordinates: [[
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0]
          ]],
          properties: {}
        },
        {
          id: 'zone-2',
          name: 'Zone 2',
          coordinates: [[
            [1, 0],
            [2, 0],
            [2, 1],
            [1, 1],
            [1, 0]
          ]],
          properties: {}
        },
        // Group 2 (separate)
        {
          id: 'zone-3',
          name: 'Zone 3',
          coordinates: [[
            [5, 0],
            [6, 0],
            [6, 1],
            [5, 1],
            [5, 0]
          ]],
          properties: {}
        },
        {
          id: 'zone-4',
          name: 'Zone 4',
          coordinates: [[
            [6, 0],
            [7, 0],
            [7, 1],
            [6, 1],
            [6, 0]
          ]],
          properties: {}
        }
      ];

      const result = mergeAdjacentZones(zones);
      expect(result).toHaveLength(2);
      
      const mergedZoneCounts = result.map(r => r.properties.mergedZones.length);
      expect(mergedZoneCounts).toContain(2);
      expect(mergedZoneCounts).toContain(2);
    });
  });

  describe('performance', () => {
    it('should handle large number of zones efficiently', () => {
      const zones: Zone[] = [];
      
      // Create a 10x10 grid of adjacent zones
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          zones.push({
            id: `zone-${i}-${j}`,
            name: `Zone ${i}-${j}`,
            coordinates: [[
              [i, j],
              [i + 1, j],
              [i + 1, j + 1],
              [i, j + 1],
              [i, j]
            ]],
            properties: {}
          });
        }
      }

      const startTime = performance.now();
      const result = mergeAdjacentZones(zones);
      const endTime = performance.now();

      expect(result).toHaveLength(1);
      expect(result[0].properties.mergedZones).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds (will optimize later)
    });
  });
});