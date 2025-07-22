import { mergeAdjacentZones } from '../mergeAdjacentZones';
import type { Zone } from '../../types';

describe('mergeAdjacentZones - Edge Cases', () => {
  describe('polygons with holes', () => {
    it('should merge adjacent polygons where one has a hole', () => {
      const zoneWithHole: Zone = {
        id: 'zone-with-hole',
        name: 'Zone with Hole',
        coordinates: [
          // Outer ring
          [[0, 0], [3, 0], [3, 3], [0, 3], [0, 0]],
          // Hole
          [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]
        ],
        properties: {}
      };

      const adjacentZone: Zone = {
        id: 'adjacent-zone',
        name: 'Adjacent Zone',
        coordinates: [[
          [3, 0],
          [6, 0],
          [6, 3],
          [3, 3],
          [3, 0]
        ]],
        properties: {}
      };

      const result = mergeAdjacentZones([zoneWithHole, adjacentZone]);
      
      expect(result).toHaveLength(1);
      expect(result[0].properties.mergedZones).toContain('zone-with-hole');
      expect(result[0].properties.mergedZones).toContain('adjacent-zone');
      
      // Verify the merged polygon still has the hole
      const mergedGeometry = result[0].geometry;
      if (mergedGeometry.type === 'Polygon') {
        expect(mergedGeometry.coordinates.length).toBeGreaterThan(1); // Has holes
      }
    });

    it('should merge zones where both have holes', () => {
      const zone1: Zone = {
        id: 'zone-1',
        name: 'Zone 1',
        coordinates: [
          // Outer ring
          [[0, 0], [3, 0], [3, 3], [0, 3], [0, 0]],
          // Hole
          [[0.5, 0.5], [1, 0.5], [1, 1], [0.5, 1], [0.5, 0.5]]
        ],
        properties: {}
      };

      const zone2: Zone = {
        id: 'zone-2',
        name: 'Zone 2',
        coordinates: [
          // Outer ring
          [[3, 0], [6, 0], [6, 3], [3, 3], [3, 0]],
          // Hole
          [[4, 1], [5, 1], [5, 2], [4, 2], [4, 1]]
        ],
        properties: {}
      };

      const result = mergeAdjacentZones([zone1, zone2]);
      
      expect(result).toHaveLength(1);
      expect(result[0].properties.mergedZones).toHaveLength(2);
    });
  });

  describe('multi-polygons', () => {
    it('should handle zones that are multi-polygons (islands)', () => {
      // Zone 1: Main area with an island
      const zone1: Zone = {
        id: 'zone-1-multi',
        name: 'Zone 1 Multi',
        coordinates: [
          // First polygon (main area)
          [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]],
          // Second polygon (island)
          [[3, 3], [4, 3], [4, 4], [3, 4], [3, 3]]
        ],
        properties: {}
      };

      // Zone 2: Adjacent to the main area of Zone 1
      const zone2: Zone = {
        id: 'zone-2',
        name: 'Zone 2',
        coordinates: [[
          [2, 0],
          [4, 0],
          [4, 2],
          [2, 2],
          [2, 0]
        ]],
        properties: {}
      };

      const result = mergeAdjacentZones([zone1, zone2]);
      
      expect(result).toHaveLength(1);
      expect(result[0].properties.mergedZones).toContain('zone-1-multi');
      expect(result[0].properties.mergedZones).toContain('zone-2');
      
      // The result should be a MultiPolygon with the island preserved
      expect(result[0].geometry.type).toBe('MultiPolygon');
    });

    it('should merge multi-polygon zones correctly', () => {
      // Two zones, each with multiple polygons
      const zone1: Zone = {
        id: 'multi-1',
        name: 'Multi 1',
        coordinates: [
          [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]],
          [[0, 2], [1, 2], [1, 3], [0, 3], [0, 2]]
        ],
        properties: {}
      };

      const zone2: Zone = {
        id: 'multi-2',
        name: 'Multi 2',
        coordinates: [
          [[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]],
          [[1, 2], [2, 2], [2, 3], [1, 3], [1, 2]]
        ],
        properties: {}
      };

      const result = mergeAdjacentZones([zone1, zone2]);
      
      expect(result).toHaveLength(1);
      expect(result[0].properties.mergedZones).toHaveLength(2);
    });
  });

  describe('complex real-world scenarios', () => {
    it('should handle star-shaped polygons', () => {
      // Create a star-shaped polygon
      const createStar = (centerX: number, centerY: number, size: number): [number, number][] => {
        const points: [number, number][] = [];
        const numPoints = 10;
        
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * 2 * Math.PI;
          const radius = i % 2 === 0 ? size : size * 0.5;
          points.push([
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
          ]);
        }
        points.push(points[0]); // Close the polygon
        return points;
      };

      const zone1: Zone = {
        id: 'star-1',
        name: 'Star 1',
        coordinates: [createStar(0, 0, 1)],
        properties: {}
      };

      const zone2: Zone = {
        id: 'star-2',
        name: 'Star 2',
        coordinates: [createStar(1.5, 0, 1)], // Overlapping stars
        properties: {}
      };

      const result = mergeAdjacentZones([zone1, zone2]);
      
      expect(result).toHaveLength(1);
      expect(result[0].properties.mergedZones).toHaveLength(2);
    });

    it('should handle very small polygons adjacent to large ones', () => {
      const smallZone: Zone = {
        id: 'small',
        name: 'Small Zone',
        coordinates: [[
          [0, 0],
          [0.001, 0],
          [0.001, 0.001],
          [0, 0.001],
          [0, 0]
        ]],
        properties: {}
      };

      const largeZone: Zone = {
        id: 'large',
        name: 'Large Zone',
        coordinates: [[
          [0.001, 0],
          [10, 0],
          [10, 10],
          [0.001, 10],
          [0.001, 0]
        ]],
        properties: {}
      };

      const result = mergeAdjacentZones([smallZone, largeZone]);
      
      expect(result).toHaveLength(1);
      expect(result[0].properties.mergedZones).toContain('small');
      expect(result[0].properties.mergedZones).toContain('large');
    });

    it('should handle zones forming a ring when merged', () => {
      // Create 4 zones that form a ring when all merged
      const zones: Zone[] = [
        {
          id: 'north',
          name: 'North',
          coordinates: [[[0, 2], [3, 2], [3, 3], [0, 3], [0, 2]]],
          properties: {}
        },
        {
          id: 'east',
          name: 'East',
          coordinates: [[[2, 0], [3, 0], [3, 3], [2, 3], [2, 0]]],
          properties: {}
        },
        {
          id: 'south',
          name: 'South',
          coordinates: [[[0, 0], [3, 0], [3, 1], [0, 1], [0, 0]]],
          properties: {}
        },
        {
          id: 'west',
          name: 'West',
          coordinates: [[[0, 0], [1, 0], [1, 3], [0, 3], [0, 0]]],
          properties: {}
        }
      ];

      const result = mergeAdjacentZones(zones);
      
      expect(result).toHaveLength(1);
      expect(result[0].properties.mergedZones).toHaveLength(4);
      
      // Note: The merged result might not have a hole in the middle
      // as Turf.union doesn't always preserve internal holes when merging
      // zones that form a ring. This is acceptable behavior.
    });
  });

  describe('invalid or edge case inputs', () => {
    it('should handle zones with duplicate points', () => {
      const zone: Zone = {
        id: 'duplicate-points',
        name: 'Duplicate Points',
        coordinates: [[
          [0, 0],
          [1, 0],
          [1, 0], // Duplicate
          [1, 1],
          [0, 1],
          [0, 0]
        ]],
        properties: {}
      };

      const result = mergeAdjacentZones([zone]);
      
      expect(result).toHaveLength(1);
      expect(result[0].properties.mergedZones).toContain('duplicate-points');
    });

    it('should handle zones with very complex boundaries', () => {
      // Create a zone with a very wiggly boundary
      const createWigglyZone = (id: string, offsetX: number): Zone => {
        const coords: [number, number][] = [];
        const steps = 50;
        
        // Top edge with wiggles
        for (let i = 0; i <= steps; i++) {
          const x = offsetX + (i / steps) * 2;
          const y = 2 + 0.1 * Math.sin(i * 0.5);
          coords.push([x, y]);
        }
        
        // Right edge
        coords.push([offsetX + 2, 0]);
        
        // Bottom edge
        coords.push([offsetX, 0]);
        
        // Close
        coords.push(coords[0]);
        
        return {
          id,
          name: `Wiggly ${id}`,
          coordinates: [coords],
          properties: {}
        };
      };

      const zone1 = createWigglyZone('wiggly-1', 0);
      const zone2 = createWigglyZone('wiggly-2', 2);

      const result = mergeAdjacentZones([zone1, zone2]);
      
      expect(result).toHaveLength(1);
      expect(result[0].properties.mergedZones).toHaveLength(2);
    });

    it('should handle self-intersecting polygons gracefully', () => {
      // Create a figure-8 shaped polygon (self-intersecting)
      const zone: Zone = {
        id: 'figure-8',
        name: 'Figure 8',
        coordinates: [[
          [0, 0],
          [2, 2],
          [2, 0],
          [0, 2],
          [0, 0]
        ]],
        properties: {}
      };

      // This should not throw an error
      expect(() => mergeAdjacentZones([zone])).not.toThrow();
    });
  });

  describe('performance with complex scenarios', () => {
    it('should handle merging of zones with many vertices efficiently', () => {
      const createComplexZone = (id: string, offsetX: number): Zone => {
        const coords: [number, number][] = [];
        const vertices = 200;
        
        for (let i = 0; i < vertices; i++) {
          const angle = (i / vertices) * 2 * Math.PI;
          const radius = 1 + 0.3 * Math.sin(angle * 12);
          coords.push([
            offsetX + radius * Math.cos(angle),
            radius * Math.sin(angle)
          ]);
        }
        coords.push(coords[0]);
        
        return {
          id,
          name: `Complex ${id}`,
          coordinates: [coords],
          properties: {}
        };
      };

      const zones = Array.from({ length: 5 }, (_, i) => 
        createComplexZone(`complex-${i}`, i * 2)
      );

      const startTime = performance.now();
      const result = mergeAdjacentZones(zones);
      const endTime = performance.now();

      expect(result).toHaveLength(1);
      expect(result[0].properties.mergedZones).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(500); // Should complete in under 500ms
    });
  });
});