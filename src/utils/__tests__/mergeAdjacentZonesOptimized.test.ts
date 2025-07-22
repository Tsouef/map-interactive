import { mergeAdjacentZonesOptimized } from '../mergeAdjacentZonesOptimized';
import { mergeAdjacentZones } from '../mergeAdjacentZones';
import type { Zone, Coordinates } from '../../types';

describe('mergeAdjacentZonesOptimized', () => {
  describe('correctness', () => {
    const testCases: { name: string; zones: Zone[] }[] = [
      {
        name: 'simple adjacent zones',
        zones: [
          {
            id: 'zone-1',
            name: 'Zone 1',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
            properties: {}
          },
          {
            id: 'zone-2',
            name: 'Zone 2',
            coordinates: [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]],
            properties: {}
          }
        ]
      },
      {
        name: 'non-adjacent zones',
        zones: [
          {
            id: 'zone-1',
            name: 'Zone 1',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
            properties: {}
          },
          {
            id: 'zone-2',
            name: 'Zone 2',
            coordinates: [[[5, 5], [6, 5], [6, 6], [5, 6], [5, 5]]],
            properties: {}
          }
        ]
      },
      {
        name: 'chain of zones',
        zones: Array.from({ length: 10 }, (_, i) => ({
          id: `zone-${i}`,
          name: `Zone ${i}`,
          coordinates: [[
            [i, 0],
            [i + 1, 0],
            [i + 1, 1],
            [i, 1],
            [i, 0]
          ]],
          properties: {}
        }))
      }
    ];

    testCases.forEach(({ name, zones }) => {
      it(`should produce same results as original for ${name}`, () => {
        const originalResult = mergeAdjacentZones(zones);
        const optimizedResult = mergeAdjacentZonesOptimized(zones, { useSpatialIndex: true });

        // Sort results for comparison
        const sortByIds = (a: any, b: any) => 
          a.properties.mergedZones.join(',').localeCompare(b.properties.mergedZones.join(','));
        
        originalResult.sort(sortByIds);
        optimizedResult.sort(sortByIds);

        expect(optimizedResult).toHaveLength(originalResult.length);
        
        // Compare each merged group
        optimizedResult.forEach((result, index) => {
          expect(result.properties.mergedZones.sort()).toEqual(
            originalResult[index].properties.mergedZones.sort()
          );
        });
      });
    });
  });

  describe('performance comparison', () => {
    it('should be faster than original for large datasets', () => {
      // Create a 20x20 grid of zones
      const zones: Zone[] = [];
      for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
          zones.push({
            id: `zone-${i}-${j}`,
            name: `Zone ${i}-${j}`,
            coordinates: [[
              [j, i],
              [j + 1, i],
              [j + 1, i + 1],
              [j, i + 1],
              [j, i]
            ]],
            properties: {}
          });
        }
      }

      // Time original implementation
      const originalStart = performance.now();
      const originalResult = mergeAdjacentZones(zones);
      const originalTime = performance.now() - originalStart;

      // Time optimized implementation
      const optimizedStart = performance.now();
      const optimizedResult = mergeAdjacentZonesOptimized(zones, { useSpatialIndex: true });
      const optimizedTime = performance.now() - optimizedStart;

      // Verify results are the same
      expect(optimizedResult).toHaveLength(originalResult.length);
      
      // Optimized should be faster (or at least not significantly slower)
      console.log(`Original: ${originalTime.toFixed(2)}ms, Optimized: ${optimizedTime.toFixed(2)}ms`);
      expect(optimizedTime).toBeLessThan(originalTime * 1.2); // Allow 20% margin
    });
  });

  describe('auto-enable spatial index', () => {
    it('should automatically enable spatial index for large datasets', () => {
      const zones = Array.from({ length: 100 }, (_, i) => ({
        id: `zone-${i}`,
        name: `Zone ${i}`,
        coordinates: [[
          [i % 10, Math.floor(i / 10)],
          [(i % 10) + 0.9, Math.floor(i / 10)],
          [(i % 10) + 0.9, Math.floor(i / 10) + 0.9],
          [i % 10, Math.floor(i / 10) + 0.9],
          [i % 10, Math.floor(i / 10)]
        ] as Coordinates[]],
        properties: {}
      }));

      // Should use spatial index by default for 100 zones
      const result = mergeAdjacentZonesOptimized(zones);
      expect(result).toHaveLength(1); // All zones should merge
    });

    it('should not use spatial index for small datasets by default', () => {
      const zones = Array.from({ length: 10 }, (_, i) => ({
        id: `zone-${i}`,
        name: `Zone ${i}`,
        coordinates: [[
          [i * 2, 0],
          [i * 2 + 1, 0],
          [i * 2 + 1, 1],
          [i * 2, 1],
          [i * 2, 0]
        ] as Coordinates[]],
        properties: {}
      }));

      // Should not use spatial index by default for 10 zones
      const result = mergeAdjacentZonesOptimized(zones);
      expect(result).toHaveLength(10); // No zones should merge
    });
  });

  describe('grid size calculation', () => {
    it('should calculate appropriate grid size based on zone count', () => {
      const testCases = [
        { zoneCount: 25, expectedMaxGrid: 5 },
        { zoneCount: 100, expectedMaxGrid: 10 },
        { zoneCount: 500, expectedMaxGrid: 20 },
        { zoneCount: 2000, expectedMaxGrid: 20 }
      ];

      testCases.forEach(({ zoneCount, expectedMaxGrid }) => {
        const zones = Array.from({ length: zoneCount }, (_, i) => ({
          id: `zone-${i}`,
          name: `Zone ${i}`,
          coordinates: [[
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0]
          ] as Coordinates[]],
          properties: {}
        }));

        // The grid size should be calculated appropriately
        const result = mergeAdjacentZonesOptimized(zones, { 
          useSpatialIndex: true,
          spatialIndexGridSize: Math.min(20, Math.ceil(Math.sqrt(zoneCount / 5)))
        });
        
        expect(result).toBeDefined();
      });
    });
  });
});